"use strict";
// v1.17.0 Hız turu (60 sn blitz) ve Günün sorusu. Bkz. server/API.md "Hız turu" / "Günün sorusu".
// - Hız turu: kuyruk (~40 soru) SUNUCUDA seçilir: yalnız AKTİF, kolay/orta, hesap makinesi gerektirmeyen ("gerekmez"),
//   pasajsız ders soruları; Premium olmayana yalnız ücretsiz ünite kutuları (assets/js/ucretsiz-kural.js). Süre sunucuda:
//   başlangıç + 60 sn + küçük tolerans sonrası gelen cevap 409 (bitti). Puan: doğru başına 10; art arda 3 doğrudan sonra ×2,
//   6 doğrudan sonra ×3 (saf: puanla). Doğru şık yalnız o soru cevaplanınca döner.
// - Her cevap mevcut hatta yazılır (apmeberra:quiz:v1 → answers) → XP / lig / istatistik / tekrar normal sayılır.
// - Günün sorusu: herkese aynı soru (tarihe göre belirlenimli; ders sırayla döner; yalnız aktif, orta zorlukta, pasajsız,
//   ücretsiz ünite soruları). O günün sorusu ilk istekte gunun_sorusu tablosuna sabitlenir. Topluluk istatistiği yalnız şık
//   başına sayıdır (kimin neyi seçtiği tutulmaz); öğrencinin kendi cevabı mevcut hatla kaydedilir.
const crypto = require("crypto");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const { acikSoru, cozumOf, satirCoz } = require("./sorubankasi");
const kural = require("../assets/js/ucretsiz-kural.js");
const AP_HEDEF = require("../assets/js/ap-hedef.js");
const zaman = require("./zaman");

const QUIZ_KEY = "apmeberra:quiz:v1";
const KURAL = { sureMs: 60000, toleransMs: 3000, kuyruk: 40, taban: 10, esik2: 3, esik3: 6, gecmis: 10 };
// Ders anahtarı → sayfa (+ isteğe bağlı kutu öneki). "karisik" profildeki AP derslerinden (apDersleri) kurulur.
const DERSLER = {
  calculus: { ad: "Calculus", sayfa: "ap-calculus" },
  physics: { ad: "Physics", sayfa: "ap-physics" },
  chemistry: { ad: "Chemistry", sayfa: "ap-chemistry" },
  biology: { ad: "Biology", sayfa: "ap-biology" },
  english: { ad: "English", sayfa: "ap-english" },
  secmeli: { ad: "Seçmeliler", sayfa: "ap-electives" },
  karisik: { ad: "Karışık", sayfa: null }
};
const SAYFA_AD = { "ap-calculus": "Calculus", "ap-physics": "Physics", "ap-chemistry": "Chemistry", "ap-biology": "Biology", "ap-english": "English", "ap-electives": "Seçmeliler" };
const GUNLUK_SAYFALAR = ["ap-calculus", "ap-physics", "ap-chemistry", "ap-biology", "ap-electives", "ap-english"];

function jsonCoz(v, d) { if (v == null) return d; try { return JSON.parse(v); } catch (e) { return d; } }
const kirp = s => String(s == null ? "" : s).trim();

// --- saf yardımcılar (araclar/testler/hiz-birim-test.js) -------------------------------------------------
/** Kombo çarpanı: önceki art arda doğru sayısına göre (0–2 → ×1, 3–5 → ×2, 6+ → ×3). */
function carpan(oncekiKombo) { const k = Math.max(0, oncekiKombo | 0); return k >= KURAL.esik3 ? 3 : k >= KURAL.esik2 ? 2 : 1; }
/** Bir cevabın puanı: { kombo (yeni), carpan (uygulanan), kazanilan }. Yanlış ya da pas komboyu sıfırlar. */
function puanla(oncekiKombo, dogru) {
  if (!dogru) return { kombo: 0, carpan: 1, kazanilan: 0 };
  const c = carpan(oncekiKombo);
  return { kombo: (oncekiKombo | 0) + 1, carpan: c, kazanilan: KURAL.taban * c };
}
/** Süre: { kalanMs, bitti (tolerans dahil kabul edilmez mi), gecikti (süre doldu ama tolerans içinde) } */
function sureDurum(bitis, now, tolerans) {
  const t = tolerans == null ? KURAL.toleransMs : tolerans;
  return { kalanMs: Math.max(0, bitis - now), bitti: now > bitis + t, gecikti: now > bitis && now <= bitis + t };
}
/** Bir cevap dizisinin toplam puanı (doğru/yanlış boolean listesi) — istemci önizlemesi ve test için. */
function toplamPuan(liste) {
  let k = 0, p = 0, en = 0;
  (liste || []).forEach(d => { const r = puanla(k, !!d); k = r.kombo; p += r.kazanilan; if (k > en) en = k; });
  return { puan: p, enKombo: en };
}
/** Hesap makinesi düzeyi (ek): "gerekmez" | "yardımcı" | "gerekli" | "" (tamsinav.hmDuzey ile aynı). */
function hmDuzey(ek) {
  const e = ek || {};
  const v = e.hesapMakinesiDurum || (typeof e.hesapMakinesi === "string" ? e.hesapMakinesi : e.hesapMakinesi === true ? "gerekli" : "");
  const s = String(v).toLocaleLowerCase("tr-TR");
  if (/gerekmez|gereksiz|yok/.test(s)) return "gerekmez";
  if (/gerekli|gerekir|şart/.test(s)) return "gerekli";
  if (/yardım|basit|faydal/.test(s)) return "yardımcı";
  return "";
}
/** Basit belirlenimli özet (FNV-1a 32 bit). */
function ozet32(s) { let h = 0x811c9dc5; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
const gunNo = tarih => Math.floor(Date.parse(tarih + "T00:00:00Z") / 864e5);
/**
 * Günün sorusu seçimi (saf, belirlenimli). havuz: [{ id, sayfa }] (aktif, orta, ücretsiz). Ders, gün numarasına göre sırayla
 * döner (yalnız havuzda sorusu olan dersler); ders içinde soru tarihin özetiyle seçilir. Boş havuz → null.
 */
function gununSorusuSec(havuz, tarih) {
  const sayfalar = GUNLUK_SAYFALAR.filter(s => havuz.some(r => r.sayfa === s));
  if (!sayfalar.length) return null;
  const sayfa = sayfalar[((gunNo(tarih) % sayfalar.length) + sayfalar.length) % sayfalar.length];
  const l = havuz.filter(r => r.sayfa === sayfa).map(r => r.id).sort();
  return l[ozet32("gunun-sorusu|" + tarih) % l.length];
}
/** Art arda gün serisi: tarihler kümesi, bugün. Bugün cevaplanmadıysa dünden geriye sayılır (seri bozulmamış sayılır). */
function gunSerisi(tarihler, bugun) {
  const s = new Set(tarihler);
  let g = s.has(bugun) ? bugun : zaman.gunEkle(bugun, -1), n = 0;
  while (s.has(g)) { n++; g = zaman.gunEkle(g, -1); }
  return n;
}

// --- rotalar ----------------------------------------------------------------------------------------------
/** bag: { db, hesap, veri, denetim, oturumGerekli, saat?, basSiniri?, cevapSiniri? } */
function hizRotalari(r, bag) {
  const { db, hesap, veri, denetim, oturumGerekli } = bag;
  const saat = typeof bag.saat === "function" ? bag.saat : () => Date.now();
  const sinir = { basla: hizSinirlayici(bag.basSiniri || 60, 60 * 60e3), cevap: hizSinirlayici(bag.cevapSiniri || 900, 10 * 60e3) };
  const q = {
    havuz: db.prepare(`SELECT id, sayfa, kutu, zorluk, ek FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND pasaj IS NULL
      AND zorluk IN ('easy', 'medium') ORDER BY rowid`),
    gunlukHavuz: db.prepare("SELECT id, sayfa, kutu FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND pasaj IS NULL AND zorluk = 'medium' ORDER BY rowid"),
    tek: db.prepare("SELECT * FROM questions_bank WHERE id = ?"),
    kutuSay: db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ? AND kutu = ?"),
    yakin: db.prepare("SELECT DISTINCT soru FROM answers WHERE user_id = ? AND zaman >= ?"),
    ekle: db.prepare(`INSERT INTO hiz_turlari (id, user_id, ders, kuyruk, sira, baslangic, bitis, olusturma) VALUES (?, ?, ?, ?, 0, ?, ?, ?)`),
    oturum: db.prepare("SELECT * FROM hiz_turlari WHERE id = ? AND user_id = ?"),
    guncelle: db.prepare(`UPDATE hiz_turlari SET sira = ?, puan = ?, kombo = ?, en_kombo = ?, dogru = ?, yanlis = ?, pas = ? WHERE id = ? AND sira = ? AND durum = 'devam'`),
    kapat: db.prepare("UPDATE hiz_turlari SET durum = 'bitti' WHERE id = ? AND durum = 'devam'"),
    acik: db.prepare("SELECT id FROM hiz_turlari WHERE user_id = ? AND durum = 'devam'"),
    rekorlar: db.prepare("SELECT ders, MAX(puan) AS puan, COUNT(*) AS tur FROM hiz_turlari WHERE user_id = ? AND durum = 'bitti' GROUP BY ders"),
    sonTurlar: db.prepare("SELECT id, ders, puan, dogru, yanlis, en_kombo, baslangic FROM hiz_turlari WHERE user_id = ? AND durum = 'bitti' ORDER BY baslangic DESC LIMIT ?"),
    rekor: db.prepare("SELECT MAX(puan) AS puan FROM hiz_turlari WHERE user_id = ? AND ders = ? AND durum = 'bitti' AND id != ?"),
    gs: db.prepare("SELECT soru_id FROM gunun_sorusu WHERE tarih = ?"),
    gsEkle: db.prepare("INSERT OR IGNORE INTO gunun_sorusu (tarih, soru_id, olusturma) VALUES (?, ?, ?)"),
    katilim: db.prepare("SELECT 1 FROM gunun_sorusu_katilim WHERE user_id = ? AND tarih = ?"),
    katilimEkle: db.prepare("INSERT OR IGNORE INTO gunun_sorusu_katilim (user_id, tarih) VALUES (?, ?)"),
    katilimlar: db.prepare("SELECT tarih FROM gunun_sorusu_katilim WHERE user_id = ? AND tarih >= ? ORDER BY tarih DESC"),
    dagilimEkle: db.prepare("INSERT INTO gunun_sorusu_dagilim (tarih, secim, n) VALUES (?, ?, 1) ON CONFLICT(tarih, secim) DO UPDATE SET n = n + 1"),
    dagilim: db.prepare("SELECT secim, n FROM gunun_sorusu_dagilim WHERE tarih = ?"),
    kendiCevap: db.prepare("SELECT secim, dogru FROM answers WHERE user_id = ? AND sayfa = ? AND soru = ? AND zaman >= ? ORDER BY zaman DESC LIMIT 1")
  };
  const tek = id => satirCoz(q.tek.get(String(id || "")));
  const premiumMu = req => !!req.kullanici && (req.kullanici.rol === "yonetici" || hesap.uyelik(req.kullanici.id).premium);
  const ozel = res => res.setHeader("Cache-Control", "private, no-store");

  /** Cevabı mevcut hatta yazar (POST /api/sorular-bankasi/cevap ile aynı kayıt biçimi). */
  function cevapKaydet(uid, row, secim, dogru) {
    const t = new Date(saat()).toISOString();
    const kayit = { v: 1, pages: { [row.sayfa]: { units: { [row.kutu]: { title: row.kutu_baslik || row.kutu, total: q.kutuSay.get(row.sayfa, row.kutu).n,
      answers: { [row.id]: { s: secim, c: dogru, t } } } } } } };
    veri.uygula(uid, { [QUIZ_KEY]: JSON.stringify(kayit) });
    return t;
  }
  const soruOf = row => Object.assign(acikSoru(row), { sayfa: row.sayfa, ders: SAYFA_AD[row.sayfa] || row.sayfa });

  // ==== Hız turu ===========================================================================================
  function kuyrukKur(req, ders) {
    const prem = premiumMu(req), uid = req.kullanici.id;
    let uygun;
    if (ders === "karisik") {
      const f = AP_HEDEF.filtre(hesap.profilAl(uid) || {});
      uygun = x => f.uniteUygun(x.sayfa, x.kutu);
    } else { const s = DERSLER[ders].sayfa; uygun = x => x.sayfa === s; }
    const yakin = new Set(q.yakin.all(uid, new Date(saat() - 3 * 864e5).toISOString()).map(x => x.soru));
    const havuz = q.havuz.all().filter(x => uygun(x) && hmDuzey(jsonCoz(x.ek, {})) === "gerekmez" && (prem || kural.apKutuUcretsizMi(x.sayfa, x.kutu)));
    const karistir = l => { for (let i = l.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); const t = l[i]; l[i] = l[j]; l[j] = t; } return l; };
    const taze = karistir(havuz.filter(x => !yakin.has(x.id))), eski = karistir(havuz.filter(x => yakin.has(x.id)));
    return taze.concat(eski).slice(0, KURAL.kuyruk).map(x => x.id);
  }
  function sonuc(o, uid) {
    const onceki = q.rekor.get(uid, o.ders, o.id).puan;
    return { puan: o.puan, dogru: o.dogru, yanlis: o.yanlis, pas: o.pas, enKombo: o.en_kombo, ders: o.ders, dersAd: DERSLER[o.ders] ? DERSLER[o.ders].ad : o.ders,
      oncekiRekor: onceki == null ? null : onceki, yeniRekor: o.puan > 0 && (onceki == null || o.puan > onceki) };
  }
  function kapat(o, uid) {
    if (o.durum === "devam") { q.kapat.run(o.id); o.durum = "bitti"; }
    return sonuc(o, uid);
  }

  r.post("/api/hiz/basla", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id;
    if (!sinir.basla.dene("u:" + uid)) throw new HttpHata(429, "Çok fazla tur başlattın. Biraz mola ver, sonra yeniden dene.");
    const ders = kirp(req.body && req.body.ders).toLowerCase() || "karisik";
    if (!DERSLER[ders]) throw new HttpHata(400, "Bilinmeyen ders.", { ders: "Geçersiz ders." });
    const kuyruk = kuyrukKur(req, ders);
    if (kuyruk.length < 5) throw new HttpHata(409, "Bu derste hız turu için yeterli soru yok. Başka bir ders seç.", null, { yetersiz: true });
    const id = "hz-" + crypto.randomBytes(9).toString("base64url"), now = saat();
    islem(db, () => {
      q.acik.all(uid).forEach(x => q.kapat.run(x.id)); // yarım kalan tur kapanır
      q.ekle.run(id, uid, ders, JSON.stringify(kuyruk), now, now + KURAL.sureMs, simdi());
    });
    return { ok: true, oturum: id, ders, dersAd: DERSLER[ders].ad, sureMs: KURAL.sureMs, bitis: now + KURAL.sureMs, sunucuZamani: now, toplam: kuyruk.length,
      kural: { taban: KURAL.taban, esik2: KURAL.esik2, esik3: KURAL.esik3 }, soru: soruOf(tek(kuyruk[0])), sira: 0 };
  });

  r.post("/api/hiz/cevap", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, b = req.body || {};
    if (!sinir.cevap.dene("u:" + uid)) throw new HttpHata(429, "Çok hızlı cevap gönderiyorsun.");
    const o = q.oturum.get(kirp(b.oturum), uid);
    if (!o) throw new HttpHata(404, "Tur bulunamadı.");
    const now = saat(), sd = sureDurum(o.bitis, now);
    if (o.durum !== "devam" || sd.bitti) throw new HttpHata(409, "Süre doldu.", null, { bitti: true, sonuc: kapat(o, uid) });
    const kuyruk = jsonCoz(o.kuyruk, []), soruId = kirp(b.soruId);
    if (soruId !== kuyruk[o.sira]) throw new HttpHata(409, "Bu soru sırada değil.", null, { sira: o.sira });
    const row = tek(soruId);
    const pas = b.pas === true;
    let secim = null, dogru = false;
    if (!pas) {
      if (!row || row.durum !== "aktif") throw new HttpHata(404, "Soru bulunamadı.");
      secim = kirp(b.secim).toUpperCase();
      if (!row.secenekler.some(x => x.id === secim)) throw new HttpHata(400, "Geçersiz seçenek.");
      dogru = secim === row.dogru;
    }
    const p = puanla(o.kombo, dogru);
    const yeni = { sira: o.sira + 1, puan: o.puan + p.kazanilan, kombo: p.kombo, en: Math.max(o.en_kombo, p.kombo), dogru: o.dogru + (dogru ? 1 : 0), yanlis: o.yanlis + (!pas && !dogru ? 1 : 0), pas: o.pas + (pas ? 1 : 0) };
    const d = q.guncelle.run(yeni.sira, yeni.puan, yeni.kombo, yeni.en, yeni.dogru, yeni.yanlis, yeni.pas, o.id, o.sira);
    if (!d.changes) throw new HttpHata(409, "Bu soru zaten cevaplandı.", null, { sira: o.sira + 1 });
    if (!pas && row) cevapKaydet(uid, row, secim, dogru);
    Object.assign(o, { sira: yeni.sira, puan: yeni.puan, kombo: yeni.kombo, en_kombo: yeni.en, dogru: yeni.dogru, yanlis: yeni.yanlis, pas: yeni.pas });
    const sonrakiId = kuyruk[yeni.sira], sonrakiRow = sonrakiId && !sd.gecikti ? tek(sonrakiId) : null;
    const out = { ok: true, soruId, secim, pas, dogru, dogruSecenek: row ? row.dogru : null, kombo: p.kombo, carpan: p.carpan, kazanilan: p.kazanilan, puan: yeni.puan,
      kalanMs: sd.kalanMs, sira: yeni.sira, sonraki: sonrakiRow && sonrakiRow.durum === "aktif" ? soruOf(sonrakiRow) : null, bitti: false };
    if (!out.sonraki) { out.bitti = true; out.sonuc = kapat(o, uid); }
    return out;
  });

  r.post("/api/hiz/bitir", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, o = q.oturum.get(kirp(req.body && req.body.oturum), uid);
    if (!o) throw new HttpHata(404, "Tur bulunamadı.");
    return { ok: true, sonuc: kapat(o, uid) };
  });

  r.get("/api/hiz/rekorlar", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, rek = {};
    q.rekorlar.all(uid).forEach(x => { rek[x.ders] = { puan: x.puan, tur: x.tur }; });
    const son = q.sonTurlar.all(uid, KURAL.gecmis).map(x => ({ id: x.id, ders: x.ders, dersAd: DERSLER[x.ders] ? DERSLER[x.ders].ad : x.ders, puan: x.puan, dogru: x.dogru,
      yanlis: x.yanlis, enKombo: x.en_kombo, zaman: new Date(x.baslangic).toISOString() }));
    const prof = hesap.profilAl(uid) || {};
    return { ok: true, rekorlar: rek, son, premium: premiumMu(req),
      dersler: Object.keys(DERSLER).map(k => ({ ders: k, ad: DERSLER[k].ad })), apDersleri: AP_HEDEF.secilenler(prof).map(x => x.ad) };
  });

  // ==== Günün sorusu =======================================================================================
  function gununSatiri(tarih) {
    let id = (q.gs.get(tarih) || {}).soru_id;
    let row = id ? tek(id) : null;
    if (!row || row.durum !== "aktif") {
      const havuz = q.gunlukHavuz.all().filter(x => kural.apKutuUcretsizMi(x.sayfa, x.kutu));
      id = gununSorusuSec(havuz, tarih);
      if (!id) return null;
      db.prepare("DELETE FROM gunun_sorusu WHERE tarih = ?").run(tarih);
      q.gsEkle.run(tarih, id, simdi());
      row = tek(id);
    }
    return row;
  }
  function istatistik(tarih, row) {
    const l = q.dagilim.all(tarih), toplam = l.reduce((a, x) => a + x.n, 0), by = {};
    l.forEach(x => { by[x.secim] = x.n; });
    const dagilim = row.secenekler.map(x => ({ secim: x.id, n: by[x.id] || 0, yuzde: toplam ? Math.round((by[x.id] || 0) * 100 / toplam) : 0 }));
    return { toplam, dogruYuzde: toplam ? Math.round((by[row.dogru] || 0) * 100 / toplam) : 0, dagilim };
  }
  function seri(uid, bugun) { return gunSerisi(q.katilimlar.all(uid, zaman.gunEkle(bugun, -400)).map(x => x.tarih), bugun); }
  function cozumBlok(row, tarih, secim) {
    const c = cozumOf(row), h = secim ? c.hatalar[secim] : null;
    return { secim: secim || null, dogru: secim ? secim === row.dogru : null, dogruSecenek: row.dogru, aciklama: c.aciklama, genelHatirlatma: c.genelHatirlatma,
      hataAciklamasi: secim && secim !== row.dogru ? { etiket: h ? h.errorTag : "", aciklama: h ? h.remediation : "" } : null, ek: c.ek, cozum: c, istatistik: istatistik(tarih, row) };
  }

  r.get("/api/gunun-sorusu", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, now = saat(), tarih = zaman.gun(now);
    const row = gununSatiri(tarih);
    if (!row) throw new HttpHata(404, "Bugün için soru yok.");
    const cevaplandi = !!q.katilim.get(uid, tarih);
    const out = { ok: true, tarih, soru: soruOf(row), cevaplandi, seri: seri(uid, tarih) };
    if (cevaplandi) {
      const k = q.kendiCevap.get(uid, row.sayfa, row.id, new Date(zaman.gunBaslangic(tarih)).toISOString());
      out.sonuc = cozumBlok(row, tarih, k ? k.secim : null);
    }
    return out;
  });

  r.post("/api/gunun-sorusu/cevap", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id;
    if (!sinir.cevap.dene("u:" + uid)) throw new HttpHata(429, "Çok hızlı cevap gönderiyorsun.");
    const now = saat(), tarih = zaman.gun(now), row = gununSatiri(tarih);
    if (!row) throw new HttpHata(404, "Bugün için soru yok.");
    const soruId = kirp(req.body && req.body.soruId);
    if (soruId && soruId !== row.id) throw new HttpHata(409, "Günün sorusu değişti; sayfayı yenile.", null, { yenile: true });
    const secim = kirp(req.body && req.body.secim).toUpperCase();
    if (!row.secenekler.some(x => x.id === secim)) throw new HttpHata(400, "Geçersiz seçenek.");
    const dogru = secim === row.dogru;
    let ilk = false;
    islem(db, () => {
      if (q.katilimEkle.run(uid, tarih).changes) { ilk = true; q.dagilimEkle.run(tarih, secim); }
    });
    if (!ilk) {
      const k = q.kendiCevap.get(uid, row.sayfa, row.id, new Date(zaman.gunBaslangic(tarih)).toISOString());
      return Object.assign({ ok: true, tarih, tekrar: true, seri: seri(uid, tarih) }, cozumBlok(row, tarih, k ? k.secim : null));
    }
    cevapKaydet(uid, row, secim, dogru);
    return Object.assign({ ok: true, tarih, tekrar: false, seri: seri(uid, tarih) }, cozumBlok(row, tarih, secim));
  });

  return { sinir };
}

module.exports = { hizRotalari, carpan, puanla, sureDurum, toplamPuan, hmDuzey, gununSorusuSec, gunSerisi, ozet32, KURAL, DERSLER };
