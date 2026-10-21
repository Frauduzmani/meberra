"use strict";
// 1.6.0 Dönüşüm hunisi: birinci taraf, gizlilik dostu olay ölçümü (POST /api/olay) ve yönetici "Büyüme" analizi.
// Gizlilik: IP / tarayıcı / e-posta yazılmaz; anon_id tarayıcının ürettiği rastgele kimliktir (parmak izi yok).
// Ölçümü kapatan kullanıcının (profil → "Kullanım ölçümü") olayları kaydedilmez. 400 günden eski olaylar günlük toplama
// (olay_ozet) dönüştürülüp silinir.
const { simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");

const SAKLAMA_GUN = 400;
const GUN = 864e5;
/** İstemcinin gönderebileceği olaylar (sunucu kendi olaylarını da aynı listeden yazar) */
const OLAYLAR = ["page_view", "vitrin_gorundu", "demo_soru_cevaplandi", "kayit_baslat", "kayit_tamam", "karsilama_tamam", "seviye_basla", "seviye_bitti",
  "ilk_soru", "unite_bitti", "paywall_gordu", "premium_sayfa", "plan_secti", "odeme_bildirdi", "premium_aktif", "deneme_basla", "deneme_bitti",
  "soru_sordu", "davet_paylasti", "kupon_uygulandi"];
/** Yalnızca sunucunun yazdığı (istemciden gelirse yok sayılan) olaylar: sahte dönüşüm yazılamasın */
const SUNUCU_OLAYLARI = new Set(["kayit_tamam", "karsilama_tamam", "odeme_bildirdi", "premium_aktif", "deneme_basla", "deneme_bitti"]);
/** Kullanıcı başına bir kez sayılan olaylar (ikinci kayıt yazılmaz) */
const TEKIL = new Set(["kayit_tamam", "karsilama_tamam", "ilk_soru", "deneme_basla", "deneme_bitti"]);
/** Huni adımları: [anahtar, ad, olay] — "ziyaret" herhangi bir olaydır */
const ADIMLAR = [
  ["ziyaret", "Ziyaret", null], ["kayit", "Kayıt", "kayit_tamam"], ["karsilama", "Karşılama", "karsilama_tamam"], ["seviye", "Seviye testi", "seviye_bitti"],
  ["ilk_soru", "İlk soru", "ilk_soru"], ["paywall", "Paywall", "paywall_gordu"], ["premium_sayfa", "Premium sayfası", "premium_sayfa"],
  ["odeme", "Ödeme bildirimi", "odeme_bildirdi"], ["premium", "Premium", "premium_aktif"]
];
const ANON_RE = /^[A-Za-z0-9_-]{16,40}$/;
const UTM_RE = /^[\w .:+-]{1,60}$/u;
const kirp = (s, n) => String(s == null ? "" : s).trim().slice(0, n);

/** Sayfa yolu: yalnızca yol (sorgu/parça atılır), en çok 100 karakter */
function sayfaTemiz(s) {
  const t = kirp(s, 300).split(/[?#]/)[0];
  return /^\/[\w./-]*$/.test(t) ? t.slice(0, 100) : null;
}
/** Özellikler: düz nesne, en çok 10 alan; değerler kısa metin/sayı/mantıksal; JSON en çok 500 karakter */
function ozellikTemiz(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  const out = {};
  Object.keys(o).slice(0, 10).forEach(k => {
    if (!/^[a-zA-Z_][\w]{0,29}$/.test(k)) return;
    const v = o[k];
    if (typeof v === "number" && isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 80);
  });
  const s = JSON.stringify(out);
  return s === "{}" ? null : s.slice(0, 500);
}
function utmTemiz(v) { const s = kirp(v, 60).toLowerCase(); return s && UTM_RE.test(s) ? s : null; }

/**
 * Huni hesabı (saf; testlerde doğrudan sınanır).
 * satirlar: [{ olay, user_id, anon_id }] (aralıktaki tekil satırlar) · eslesme: Map(anon_id → user_id)
 * kaynaklar: Map(kişi → utm_source|null) · filtre: kaynak adı, "(yok)" ya da boş (hepsi)
 * Kişi: user_id varsa "u"+id; yoksa anon_id kayıtlı bir kullanıcıya bağlanmışsa o kullanıcı; değilse "a"+anon_id.
 * Adım sayısı = önceki tüm adımları da yapmış kişi sayısı (kümülatif kesişim); ham = yalnızca o adımı yapan.
 */
function huniHesapla(satirlar, eslesme, kaynaklar, filtre) {
  const kisi = s => (s.user_id ? "u" + s.user_id : s.anon_id ? (eslesme.has(s.anon_id) ? "u" + eslesme.get(s.anon_id) : "a" + s.anon_id) : null);
  const kumeler = {};
  ADIMLAR.forEach(a => { kumeler[a[0]] = new Set(); });
  const olayAdim = {};
  ADIMLAR.forEach(a => { if (a[2]) olayAdim[a[2]] = a[0]; });
  satirlar.forEach(s => {
    const k = kisi(s);
    if (!k) return;
    if (filtre) { const kay = kaynaklar.get(k) || null; if (filtre === "(yok)" ? kay !== null : kay !== filtre) return; }
    kumeler.ziyaret.add(k);
    if (olayAdim[s.olay]) kumeler[olayAdim[s.olay]].add(k);
  });
  let onceki = null;
  return ADIMLAR.map((a, i) => {
    const kume = onceki ? new Set([...kumeler[a[0]]].filter(x => onceki.has(x))) : kumeler[a[0]];
    const sonuc = { anahtar: a[0], ad: a[1], olay: a[2], kisi: kume.size, ham: kumeler[a[0]].size,
      adimOrani: i === 0 ? null : onceki.size ? Math.round(kume.size / onceki.size * 1000) / 10 : 0 };
    onceki = kume;
    return sonuc;
  });
}

function huniServisi(db, sec) {
  sec = sec || {};
  const q = {
    ekle: db.prepare(`INSERT INTO olaylar (zaman, user_id, anon_id, olay, sayfa, ozellikler, utm_source, utm_medium, utm_campaign)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    tekilVar: db.prepare("SELECT 1 FROM olaylar WHERE user_id = ? AND olay = ? LIMIT 1"),
    tercih: db.prepare("SELECT olcum_kapali FROM buyume_kullanici WHERE user_id = ?")
  };
  const kapaliMi = uid => !!(uid && (q.tercih.get(uid) || {}).olcum_kapali);

  /** Sunucu tarafı olay (kayıt, ödeme bildirimi, Premium …). Ölçümü kapatan kullanıcı için yazılmaz. */
  function kaydet(olay, k) {
    k = k || {};
    if (OLAYLAR.indexOf(olay) < 0) throw new Error("Bilinmeyen olay: " + olay);
    const uid = k.userId || null;
    if (kapaliMi(uid)) return false;
    if (uid && TEKIL.has(olay) && q.tekilVar.get(uid, olay)) return false;
    const anon = k.anonId && ANON_RE.test(k.anonId) ? k.anonId : null;
    const u = k.utm || {};
    q.ekle.run(k.zaman || simdi(), uid, anon, olay, sayfaTemiz(k.sayfa), ozellikTemiz(k.ozellikler), utmTemiz(u.source), utmTemiz(u.medium), utmTemiz(u.campaign));
    return true;
  }

  /** İstemci toplu gönderimi: { anon, utm: {source, medium, campaign}, olaylar: [{ ad, sayfa, ozellikler, t }] } */
  function topluAl(govde, kullanici, cerezAnon) {
    const g = govde && typeof govde === "object" ? govde : {};
    const liste = Array.isArray(g.olaylar) ? g.olaylar : [];
    if (liste.length > 25) throw new HttpHata(413, "Tek seferde en fazla 25 olay gönderilebilir.");
    const uid = kullanici ? kullanici.id : null;
    if (g.izinYok === true || kapaliMi(uid)) return { alinan: 0, yoksayilan: liste.length };
    const anon = ANON_RE.test(String(g.anon || "")) ? g.anon : ANON_RE.test(String(cerezAnon || "")) ? cerezAnon : null;
    if (!anon && !uid) throw new HttpHata(400, "Ziyaretçi kimliği gerekli.");
    const utm = g.utm && typeof g.utm === "object" ? g.utm : {};
    let alinan = 0;
    const simdiMs = Date.now();
    liste.forEach(o => {
      if (!o || typeof o !== "object") return;
      const ad = String(o.ad || "");
      if (OLAYLAR.indexOf(ad) < 0 || SUNUCU_OLAYLARI.has(ad)) return;
      // İstemci zamanı yalnızca son 1 saat içindeyse kabul edilir (çevrimdışı kuyruk); yoksa sunucu zamanı
      const t = Date.parse(o.t);
      const zaman = !isNaN(t) && t <= simdiMs + 60e3 && t >= simdiMs - 3600e3 ? new Date(Math.min(t, simdiMs)).toISOString() : simdi();
      if (kaydet(ad, { userId: uid, anonId: anon, sayfa: o.sayfa, ozellikler: o.ozellikler, utm, zaman })) alinan++;
    });
    return { alinan, yoksayilan: liste.length - alinan, anon };
  }

  /** 400 günden eski olaylar: günlük toplam (olay_ozet) + silme */
  function saklama(simdiMs) {
    const sinir = new Date((simdiMs == null ? Date.now() : simdiMs) - SAKLAMA_GUN * GUN).toISOString();
    db.prepare(`INSERT INTO olay_ozet (gun, olay, utm_source, adet)
      SELECT substr(zaman, 1, 10), olay, COALESCE(utm_source, ''), COUNT(*) FROM olaylar WHERE zaman < ? GROUP BY 1, 2, 3
      ON CONFLICT(gun, olay, utm_source) DO UPDATE SET adet = adet + excluded.adet`).run(sinir);
    return Number(db.prepare("DELETE FROM olaylar WHERE zaman < ?").run(sinir).changes);
  }

  // ---- analiz ---------------------------------------------------------------------------------------------
  function eslesmeHaritasi() {
    const m = new Map();
    db.prepare("SELECT anon_id, MIN(user_id) AS uid FROM olaylar WHERE anon_id IS NOT NULL AND user_id IS NOT NULL GROUP BY anon_id").all().forEach(r => m.set(r.anon_id, r.uid));
    return m;
  }
  /** Kişi başına ilk kaynak (utm_source) */
  function kaynakHaritasi(eslesme) {
    const m = new Map();
    db.prepare("SELECT user_id, anon_id, utm_source FROM olaylar WHERE utm_source IS NOT NULL ORDER BY zaman").all().forEach(s => {
      const k = s.user_id ? "u" + s.user_id : eslesme.has(s.anon_id) ? "u" + eslesme.get(s.anon_id) : "a" + s.anon_id;
      if (!m.has(k)) m.set(k, s.utm_source);
    });
    return m;
  }
  function huni(gun, kaynak) {
    const bas = new Date(Date.now() - gun * GUN).toISOString();
    const satirlar = db.prepare("SELECT DISTINCT olay, user_id, anon_id FROM olaylar WHERE zaman >= ?").all(bas);
    const es = eslesmeHaritasi(), kay = kaynakHaritasi(es);
    const kaynakSay = new Map();
    const gorulen = new Set();
    satirlar.forEach(s => {
      const k = s.user_id ? "u" + s.user_id : s.anon_id ? (es.has(s.anon_id) ? "u" + es.get(s.anon_id) : "a" + s.anon_id) : null;
      if (!k || gorulen.has(k)) return;
      gorulen.add(k);
      const ad = kay.get(k) || "(yok)";
      kaynakSay.set(ad, (kaynakSay.get(ad) || 0) + 1);
    });
    return {
      adimlar: huniHesapla(satirlar, es, kay, kaynak || ""),
      kaynaklar: [...kaynakSay.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(x => ({ ad: x[0], kisi: x[1] }))
    };
  }

  /** Kayıt haftası kohortu (son 8 hafta): hafta k (1..8) = kayıttan sonraki [7k, 7k+7) gün; etkin = olay/cevap/giriş */
  function kohort(simdiMs) {
    simdiMs = simdiMs == null ? Date.now() : simdiMs;
    const bas = new Date(simdiMs - 9 * 7 * GUN).toISOString();
    const kullanicilar = db.prepare("SELECT id, olusturma FROM users WHERE rol = 'ogrenci' AND durum != 'silindi' AND olusturma >= ?").all(bas);
    if (!kullanicilar.length) return [];
    const etkin = new Map(); // uid → Set(gün sayısı)
    const ekle = (uid, iso) => { const t = Date.parse(iso); if (!isNaN(t)) { if (!etkin.has(uid)) etkin.set(uid, []); etkin.get(uid).push(t); } };
    db.prepare("SELECT user_id, zaman FROM olaylar WHERE user_id IS NOT NULL AND zaman >= ?").all(bas).forEach(r => ekle(r.user_id, r.zaman));
    db.prepare("SELECT user_id, zaman FROM answers WHERE zaman >= ?").all(bas).forEach(r => ekle(r.user_id, r.zaman));
    db.prepare("SELECT user_id, gun FROM giris_sayilari WHERE gun >= ? AND adet > 0").all(bas.slice(0, 10)).forEach(r => ekle(r.user_id, r.gun + "T12:00:00Z"));
    const pazartesi = ms => { const d = new Date(ms); const g = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - g)).toISOString().slice(0, 10); };
    const gruplar = new Map();
    kullanicilar.forEach(u => {
      const t0 = Date.parse(u.olusturma), h = pazartesi(t0);
      if (!gruplar.has(h)) gruplar.set(h, { hafta: h, kisi: 0, aktif: new Array(8).fill(0), olculebilir: new Array(8).fill(0) });
      const g = gruplar.get(h);
      g.kisi++;
      const haftalar = new Set((etkin.get(u.id) || []).map(t => Math.floor((t - t0) / (7 * GUN))));
      for (let k = 1; k <= 8; k++) {
        if (t0 + k * 7 * GUN > simdiMs) continue; // o hafta henüz başlamadı
        g.olculebilir[k - 1]++;
        if (haftalar.has(k)) g.aktif[k - 1]++;
      }
    });
    return [...gruplar.values()].sort((a, b) => (a.hafta < b.hafta ? 1 : -1)).slice(0, 8).map(g => ({
      hafta: g.hafta, kisi: g.kisi,
      oranlar: g.aktif.map((n, i) => (g.olculebilir[i] ? Math.round(n / g.olculebilir[i] * 100) : null))
    }));
  }

  /** Günlük seriler (UTC günü): etkin kullanıcı, yeni kayıt, Premium dönüşümü (ödemeli), deneme başlangıcı */
  function gunluk(gun) {
    const gunler = [];
    for (let i = gun - 1; i >= 0; i--) gunler.push(new Date(Date.now() - i * GUN).toISOString().slice(0, 10));
    const bas = gunler[0];
    const seri = (sql, ...a) => { const m = new Map(db.prepare(sql).all(...a).map(x => [x.g, x.n])); return gunler.map(g => m.get(g) || 0); };
    return {
      gunler,
      etkin: seri(`SELECT g, COUNT(DISTINCT uid) AS n FROM (
          SELECT substr(zaman, 1, 10) AS g, user_id AS uid FROM olaylar WHERE user_id IS NOT NULL AND zaman >= ?
          UNION SELECT substr(zaman, 1, 10), user_id FROM answers WHERE zaman >= ?
          UNION SELECT gun, user_id FROM giris_sayilari WHERE gun >= ? AND adet > 0) GROUP BY g`, bas, bas, bas),
      kayit: seri("SELECT substr(olusturma, 1, 10) AS g, COUNT(*) AS n FROM users WHERE rol = 'ogrenci' AND olusturma >= ? GROUP BY g", bas),
      premium: seri("SELECT substr(olusturma, 1, 10) AS g, COUNT(DISTINCT user_id) AS n FROM subscriptions WHERE kaynak = 'talep' AND olusturma >= ? GROUP BY g", bas),
      deneme: seri("SELECT substr(baslangic, 1, 10) AS g, COUNT(*) AS n FROM premium_denemeleri WHERE baslangic >= ? GROUP BY g", bas)
    };
  }

  /** En çok paywall görülen yerler (sayfa + ünite) */
  function paywallYerleri(gun) {
    const bas = new Date(Date.now() - gun * GUN).toISOString();
    const satirlar = db.prepare("SELECT sayfa, ozellikler, user_id, anon_id FROM olaylar WHERE olay = 'paywall_gordu' AND zaman >= ?").all(bas);
    const m = new Map();
    satirlar.forEach(s => {
      let o = {}; try { o = JSON.parse(s.ozellikler || "{}") || {}; } catch (e) { /* bozuk */ }
      const yer = (s.sayfa || "?") + (o.unite != null ? " · ünite " + o.unite : o.yer ? " · " + o.yer : "");
      if (!m.has(yer)) m.set(yer, { yer, gosterim: 0, kisiler: new Set() });
      const x = m.get(yer);
      x.gosterim++; x.kisiler.add(s.user_id ? "u" + s.user_id : "a" + s.anon_id);
    });
    return [...m.values()].map(x => ({ yer: x.yer, gosterim: x.gosterim, kisi: x.kisiler.size })).sort((a, b) => b.kisi - a.kisi || b.gosterim - a.gosterim).slice(0, 10);
  }

  return { kaydet, topluAl, saklama, huni, kohort, gunluk, paywallYerleri, kapaliMi,
    sinir: hizSinirlayici(sec.olaySiniri || 120, 60e3) };
}

/** Rotalar: POST /api/olay (herkese açık, hız + boyut sınırlı), GET /api/admin/buyume/analiz */
function huniRotalari(r, c) {
  const { huni, yoneticiGerekli } = c;
  r.post("/api/olay", req => {
    if (!huni.sinir.dene(req.ip)) throw new HttpHata(429, "Çok fazla ölçüm isteği.");
    const s = huni.topluAl(req.body, req.kullanici, req.cerezler && req.cerezler.mb_anon);
    return { ok: true, alinan: s.alinan };
  });
  r.get("/api/admin/buyume/analiz", req => {
    yoneticiGerekli(req);
    const gun = [7, 30, 90].indexOf(+req.sorgu.get("gun")) >= 0 ? +req.sorgu.get("gun") : 30;
    const kaynak = kirp(req.sorgu.get("kaynak"), 60);
    const h = huni.huni(gun, kaynak);
    return { ok: true, gun, kaynak: kaynak || null, huni: h.adimlar, kaynaklar: h.kaynaklar, kohort: huni.kohort(), gunluk: huni.gunluk(gun), paywall: huni.paywallYerleri(gun) };
  });
}

module.exports = { huniServisi, huniRotalari, huniHesapla, OLAYLAR, ADIMLAR, SAKLAMA_GUN, sayfaTemiz, ozellikTemiz };
