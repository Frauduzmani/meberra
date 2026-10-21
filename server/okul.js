"use strict";
// 1.19.0 Okul ve öğretmen paneli (B2B): okul koltuk lisansı alır → yönetici öğretmeni e-postayla davet eder → öğretmen sınıf
// açar (6 karakterlik katılım kodu) → öğrenci /sinif?kod=… ile, ne paylaşılacağını görüp onaylayarak katılır.
// Okulun boş koltuğu varsa öğrenci Premium olur: subscriptions satırı kaynak = 'okul', okul_id, bitis = lisans bitişi
// (tutar YOK: gelir istatistiğine girmez). Öğrenci ayrılınca / çıkarılınca / lisans bitince ya da iptal edilince okul Premium'u
// biter; öğrencinin kendi ödediği Premium etkilenmez (ayrı satır).
// Gizlilik (öğrenciler reşit değil): öğretmen yalnızca TOPLU sayıları görür — ad + soyadın baş harfi, son etkinlik, haftalık soru,
// doğruluk, seri, tahmini AP puanı, ünite kapsamı, ödev durumu. Soru-cevap yazışmaları, notlar, cevap ayrıntısı, veli bağlantıları
// ASLA gitmez; e-posta yalnızca yönetici okul için açtıysa. Öğretmen yalnızca kendi sınıflarını görür (başkasınınki 404).
const crypto = require("crypto");
const config = require("./config");
const { islem, simdi } = require("./db");
const { sifreOzetle, belirtec, ozet, publicId, hizSinirlayici } = require("./guvenlik");
const { HttpHata } = require("./http");
const zaman = require("./zaman");
const AP = require("../assets/js/ap-hedef");
const ADRES = require("./adresler");

const EPOSTA_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/;
const kirp = s => String(s == null ? "" : s).trim().replace(/\s+/g, " ");
const GUN = 864e5;
const DAVET_GUN = 7;
const KOD_ABECE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 0/O, 1/I/L yok: tahtaya yazılınca karışmaz
const KOD_RE = /^[A-HJKMNP-Z2-9]{6}$/;
const TURLER = ["unite", "deneme", "frq", "tam_sinav", "kart"];
const TUR_AD = { unite: "Ünite soruları", deneme: "Deneme", frq: "FRQ", tam_sinav: "Tam deneme sınavı", kart: "Kavram kartları" };
const PAYLASILAN = ["Adın ve soyadının baş harfi", "Son etkinlik zamanı", "Bu haftaki soru sayısı ve doğruluk oranı", "Çalışma serisi",
  "Tahmini AP puanı (deneme / tam sınav sonuçlarından)", "Ünite kapsamı (kaç sorunun çözüldüğü)", "Ödevlerin tamamlanma durumu"];
const PAYLASILMAYAN = ["Soru-cevap yazışmaların", "Notların ve cevaplarının ayrıntısı", "E-posta adresin", "Veli bağlantıların"];

// Öğretmen hesabının kullanabileceği API yolları (öğrenci özellikleri kapalı)
const OGRETMEN_ACIK = ["/api/health", "/api/me", "/api/log", "/api/account/export", "/api/account/delete"];
const OGRETMEN_ACIK_ONEK = ["/api/ogretmen/", "/api/auth/", "/api/public/"];
function ogretmenYolIzinli(yol) { return OGRETMEN_ACIK.indexOf(yol) >= 0 || OGRETMEN_ACIK_ONEK.some(o => yol.startsWith(o)); }

function kodUret() {
  const b = crypto.randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) s += KOD_ABECE[b[i] % KOD_ABECE.length];
  return s;
}
const jsonCoz = (s, v) => { try { const x = JSON.parse(s); return x == null ? v : x; } catch (e) { return v; } };
const kisaAd = u => (u.ad + " " + (u.soyad ? String(u.soyad).slice(0, 1).toLocaleUpperCase("tr-TR") + "." : "")).trim();
const dersBilgi = d => AP.DERSLER.filter(x => x.ders === d)[0] || null;
const DERS_LISTESI = () => AP.DERSLER.map(x => ({ ders: x.ders, ad: "AP " + x.ad }));

function okulServisi(db, c) {
  const { hesap, eposta, denetim, bildirim } = c;
  const calismaDurumu = c.calismaDurumu || null;
  const saat = c.saat || Date.now;
  const tabloVar = ad => !!db.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?").get(ad);

  const q = {
    okul: db.prepare("SELECT * FROM okullar WHERE id = ?"),
    kullanici: db.prepare("SELECT * FROM users WHERE id = ?"),
    kullaniciEposta: db.prepare("SELECT * FROM users WHERE eposta = ?"),
    lisans: db.prepare("SELECT * FROM lisanslar WHERE okul_id = ? AND durum = 'aktif' AND baslangic <= ? AND bitis > ? ORDER BY bitis DESC, id DESC LIMIT 1"),
    sonLisans: db.prepare("SELECT * FROM lisanslar WHERE okul_id = ? AND durum = 'aktif' ORDER BY bitis DESC, id DESC LIMIT 1"),
    koltukKullanilan: db.prepare("SELECT COUNT(DISTINCT user_id) AS n FROM subscriptions WHERE okul_id = ? AND kaynak = 'okul' AND durum = 'aktif' AND bitis > ?"),
    okulAbonelik: db.prepare("SELECT * FROM subscriptions WHERE okul_id = ? AND user_id = ? AND kaynak = 'okul' AND durum = 'aktif' AND bitis > ? ORDER BY id DESC LIMIT 1"),
    aboneIptal: db.prepare("UPDATE subscriptions SET durum = 'iptal', iptal_zamani = ? WHERE id = ? AND durum = 'aktif'"),
    uyeAktifOkul: db.prepare(`SELECT COUNT(*) AS n FROM sinif_uyeleri m JOIN siniflar s ON s.id = m.sinif_id
      WHERE s.okul_id = ? AND m.ogrenci_id = ? AND m.durum = 'aktif' AND s.durum = 'aktif'`),
    ogretmenAktif: db.prepare("SELECT * FROM ogretmenler WHERE user_id = ? AND durum = 'aktif' LIMIT 1"),
    sinif: db.prepare("SELECT * FROM siniflar WHERE id = ?"),
    sinifKod: db.prepare("SELECT * FROM siniflar WHERE kod = ? AND durum = 'aktif'"),
    uyeler: db.prepare(`SELECT m.id AS uye_id, m.katilma, u.* FROM sinif_uyeleri m JOIN users u ON u.id = m.ogrenci_id
      WHERE m.sinif_id = ? AND m.durum = 'aktif' AND u.durum != 'silindi' ORDER BY u.ad, u.soyad, m.id`),
    uyeAktif: db.prepare("SELECT * FROM sinif_uyeleri WHERE sinif_id = ? AND ogrenci_id = ? AND durum = 'aktif'"),
    odevler: db.prepare("SELECT * FROM odevler WHERE sinif_id = ? AND durum = 'aktif' ORDER BY COALESCE(son_tarih, '9999') ASC, id DESC")
  };

  // ---------------------------------------------------------------- koltuk / Premium
  /** Öğrencinin bu okuldaki koltuğunu eşitler: aktif üyelik + geçerli lisans + boş koltuk → okul Premium'u; değilse biter.
   *  Dönüş: { premium, koltukYok } */
  function koltukEsitle(okulId, ogrenciId, req) {
    const z = simdi();
    const okul = q.okul.get(okulId);
    const lis = okul && okul.durum === "aktif" ? q.lisans.get(okulId, z, z) : null;
    const uye = q.uyeAktifOkul.get(okulId, ogrenciId).n > 0;
    const mevcut = q.okulAbonelik.get(okulId, ogrenciId, z);
    if (!uye || !lis) {
      if (mevcut) {
        q.aboneIptal.run(z, mevcut.id);
        denetim({ eylem: "okul.premium-bitti", kullanici: ogrenciId, istek: req, varlik: "subscriptions", varlikId: mevcut.id, ayrinti: { okul: okulId, neden: !uye ? "uyelik" : "lisans" } });
      }
      return { premium: false, koltukYok: false };
    }
    if (mevcut) {
      if (mevcut.bitis !== lis.bitis) db.prepare("UPDATE subscriptions SET bitis = ? WHERE id = ?").run(lis.bitis, mevcut.id);
      return { premium: true, koltukYok: false };
    }
    if (q.koltukKullanilan.get(okulId, z).n >= lis.koltuk) return { premium: false, koltukYok: true };
    const id = Number(db.prepare(`INSERT INTO subscriptions (user_id, plan, baslangic, bitis, kaynak, tutar_tl, talep_id, not_, olusturan, olusturma, okul_id)
      VALUES (?, 'ozel', ?, ?, 'okul', NULL, NULL, ?, NULL, ?, ?)`).run(ogrenciId, z, lis.bitis, "Okul lisansı: " + okul.ad, z, okulId).lastInsertRowid);
    denetim({ eylem: "okul.premium-basladi", kullanici: ogrenciId, istek: req, varlik: "subscriptions", varlikId: id, ayrinti: { okul: okulId, bitis: lis.bitis } });
    return { premium: true, koltukYok: false };
  }
  /** Okuldaki herkesi eşitler (lisans değişince / zamanlayıcı). Koltuk sırası: önce katılan. */
  function okulEsitle(okulId, req) {
    const z = simdi();
    const ogr = db.prepare(`SELECT m.ogrenci_id, MIN(m.katilma) AS k FROM sinif_uyeleri m JOIN siniflar s ON s.id = m.sinif_id
      WHERE s.okul_id = ? AND m.durum = 'aktif' AND s.durum = 'aktif' GROUP BY m.ogrenci_id ORDER BY k`).all(okulId).map(r => r.ogrenci_id);
    const sahipler = db.prepare("SELECT DISTINCT user_id FROM subscriptions WHERE okul_id = ? AND kaynak = 'okul' AND durum = 'aktif' AND bitis > ?").all(okulId, z).map(r => r.user_id);
    const hepsi = Array.from(new Set(sahipler.concat(ogr)));
    // Önce sahiplerin durumu (üyeliği biten koltuğu boşaltır), sonra sırayla yeni koltuklar
    let n = 0;
    islem(db, () => { hepsi.forEach(id => { if (koltukEsitle(okulId, id, req).premium) n++; }); });
    return n;
  }
  function koltukBilgi(okulId) {
    const z = simdi(), lis = q.lisans.get(okulId, z, z) || null;
    return { koltuk: lis ? lis.koltuk : 0, kullanilan: q.koltukKullanilan.get(okulId, z).n, bitis: lis ? lis.bitis : null, baslangic: lis ? lis.baslangic : null, gecerli: !!lis };
  }

  // ---------------------------------------------------------------- etkinlikten hesaplanan özet
  function birimler(ders) {
    if (ders === "karisik") return AP.DERSLER.filter(x => x.ders !== "calculus-bc").map(x => ({ id: x.ders, ad: x.kisa || x.ad, sayfa: x.sayfa, kutuRe: x.kutu || null, ders: x.ders }));
    const d = dersBilgi(ders);
    if (!d) return [];
    const re = d.kutu ? new RegExp(d.kutu) : null;
    return db.prepare(`SELECT kutu, MAX(kutu_baslik) AS baslik, MIN(unite_no) AS no, COUNT(*) AS n FROM questions_bank
      WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ? AND kutu IS NOT NULL GROUP BY kutu ORDER BY no, kutu`).all(d.sayfa)
      .filter(r => !re || re.test(r.kutu)).map(r => ({ id: r.kutu, ad: kirp(r.baslik || r.kutu).replace(/\s*(quiz|practice)\s*$/i, ""), no: r.no, sayfa: d.sayfa, banka: r.n }));
  }
  function kapsam(uid, birim) {
    if (birim.kutuRe !== undefined) { // karışık: ders başına
      const re = birim.kutuRe ? new RegExp(birim.kutuRe) : null;
      const cozulen = new Set(db.prepare("SELECT unite, soru FROM answers WHERE user_id = ? AND sayfa = ?").all(uid, birim.sayfa).filter(a => !re || re.test(a.unite)).map(a => a.soru)).size;
      const banka = db.prepare("SELECT kutu FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ?").all(birim.sayfa).filter(r => !re || re.test(r.kutu || "")).length;
      return { cozulen, banka, yuzde: banka ? Math.min(100, Math.round(cozulen / banka * 100)) : null };
    }
    const cozulen = db.prepare("SELECT COUNT(DISTINCT soru) AS n FROM answers WHERE user_id = ? AND sayfa = ? AND unite = ?").get(uid, birim.sayfa, birim.id).n;
    return { cozulen, banka: birim.banka, yuzde: birim.banka ? Math.min(100, Math.round(cozulen / birim.banka * 100)) : null };
  }
  function ogrenciOzet(u, sinif, simdiMs, epostaGorunur) {
    const aralik = zaman.haftaAraligi(zaman.hafta(simdiMs)), son = new Date(simdiMs).toISOString();
    const d = dersBilgi(sinif.ders), re = d && d.kutu ? new RegExp(d.kutu) : null;
    const hafta = db.prepare("SELECT unite, sayfa, dogru FROM answers WHERE user_id = ? AND zaman >= ? AND zaman <= ?").all(u.id, aralik.bas, son)
      .filter(a => !d || (a.sayfa === d.sayfa && (!re || re.test(a.unite))));
    const tum = d ? db.prepare("SELECT unite, dogru FROM answers WHERE user_id = ? AND sayfa = ?").all(u.id, d.sayfa).filter(a => !re || re.test(a.unite))
      : db.prepare("SELECT dogru FROM answers WHERE user_id = ?").all(u.id);
    const sonCevap = db.prepare("SELECT MAX(zaman) AS t FROM answers WHERE user_id = ?").get(u.id).t;
    const sonDeneme = db.prepare("SELECT MAX(tarih) AS t FROM exams WHERE user_id = ?").get(u.id).t;
    const ex = d ? db.prepare("SELECT tahmini_band, tarih, istemci_id FROM exams WHERE user_id = ? AND kod = ? AND tahmini_band IS NOT NULL ORDER BY tarih DESC LIMIT 1").get(u.id, d.deneme)
      : db.prepare("SELECT tahmini_band, tarih, istemci_id FROM exams WHERE user_id = ? AND tahmini_band IS NOT NULL ORDER BY tarih DESC LIMIT 1").get(u.id);
    const st = calismaDurumu ? calismaDurumu(u.id, simdiMs) : { seri: 0, bugunAktif: false };
    const hd = hafta.reduce((s, a) => s + (a.dogru ? 1 : 0), 0), td = tum.reduce((s, a) => s + (a.dogru ? 1 : 0), 0);
    return {
      id: u.uye_id, ad: kisaAd(u), katilma: u.katilma, eposta: epostaGorunur ? u.eposta || null : undefined,
      sonAktif: [sonCevap, sonDeneme, u.son_gorulme].filter(Boolean).sort().pop() || null,
      haftaSoru: hafta.length, haftaDogruluk: hafta.length ? Math.round(hd / hafta.length * 100) : null,
      dogruluk: tum.length ? Math.round(td / tum.length * 100) : null, toplamSoru: tum.length,
      seri: st.seri + (st.bugunAktif ? 1 : 0),
      tahminiPuan: ex && ex.tahmini_band != null ? +ex.tahmini_band : null, tahminKaynagi: ex ? (/^ts-/.test(String(ex.istemci_id || "")) ? "tam_sinav" : "deneme") : null
    };
  }

  /** Bir ödevin bir öğrenci için durumu (mevcut etkinlik tablolarından; kopya veri yok) */
  function odevDurumu(o, uid, simdiMs) {
    const h = jsonCoz(o.hedef, {}), bas = o.olusturma;
    let ilerleme = 0, hedef = 1, tamam = false, ek = null;
    if (o.tur === "unite") {
      hedef = Math.max(1, +h.adet || 10);
      ilerleme = db.prepare("SELECT COUNT(DISTINCT soru) AS n FROM answers WHERE user_id = ? AND sayfa = ? AND unite = ? AND zaman >= ?").get(uid, String(h.sayfa || ""), String(h.kutu || ""), bas).n;
      tamam = ilerleme >= hedef;
    } else if (o.tur === "deneme") {
      const r = db.prepare("SELECT yuzde, tahmini_band FROM exams WHERE user_id = ? AND kod = ? AND tarih >= ? AND istemci_id NOT LIKE 'ts-%' ORDER BY tarih DESC LIMIT 1").get(uid, String(h.kod || ""), bas);
      tamam = !!r; ilerleme = r ? 1 : 0; if (r) ek = { yuzde: r.yuzde != null ? Math.round(r.yuzde) : null, tahminiPuan: r.tahmini_band != null ? +r.tahmini_band : null };
    } else if (o.tur === "tam_sinav") {
      const r = db.prepare("SELECT id, durum FROM tam_sinavlar WHERE user_id = ? AND kod = ? AND olusturma >= ? ORDER BY (durum = 'bitti') DESC, olusturma DESC LIMIT 1").get(uid, String(h.kod || ""), bas);
      tamam = !!(r && r.durum === "bitti"); ilerleme = tamam ? 1 : 0;
      if (r && !tamam && r.durum === "devam") ilerleme = 0.5;
      if (tamam) { const e = db.prepare("SELECT tahmini_band FROM exams WHERE user_id = ? AND istemci_id = ?").get(uid, r.id); if (e && e.tahmini_band != null) ek = { tahminiPuan: +e.tahmini_band }; }
    } else if (o.tur === "frq") {
      const r = h.frqId ? db.prepare("SELECT toplam, toplam_puan FROM frq_denemeleri WHERE user_id = ? AND frq_id = ? AND created >= ? ORDER BY id DESC LIMIT 1").get(uid, String(h.frqId), bas)
        : db.prepare("SELECT toplam, toplam_puan FROM frq_denemeleri WHERE user_id = ? AND ders = ? AND created >= ? ORDER BY id DESC LIMIT 1").get(uid, String(h.ders || ""), bas);
      tamam = !!r; ilerleme = r ? 1 : 0;
    } else if (o.tur === "kart") {
      hedef = Math.max(1, +h.adet || 20);
      if (tabloVar("kart_durumu")) {
        const onek = String(h.onek || "");
        ilerleme = db.prepare("SELECT COUNT(*) AS n FROM kart_durumu WHERE user_id = ? AND guncelleme >= ? AND kart_id LIKE ? ESCAPE '\\'").get(uid, bas, onek.replace(/[\\%_]/g, "\\$&") + "%").n;
      }
      tamam = ilerleme >= hedef;
    }
    const gecikti = !tamam && o.son_tarih && o.son_tarih < new Date(simdiMs).toISOString();
    return { durum: tamam ? "tamam" : gecikti ? "gecikti" : ilerleme > 0 ? "devam" : "baslamadi", ilerleme: Math.min(ilerleme, hedef), hedef, ek };
  }
  function odevLink(o) {
    const h = jsonCoz(o.hedef, {});
    if (o.tur === "unite") { const y = ADRES.sayfaAdres(h.sayfa); return y ? y + (h.no ? "?unite=" + h.no : "") : "/calis"; }
    if (o.tur === "deneme") return "/deneme?ders=" + encodeURIComponent(h.kod || "");
    if (o.tur === "tam_sinav") return "/deneme?tam=" + encodeURIComponent(h.kod || "");
    if (o.tur === "frq") return "/frq?" + (h.frqId ? "id=" + encodeURIComponent(h.frqId) : "ders=" + encodeURIComponent(h.ders || ""));
    return "/calis";
  }
  const odevGenel = o => ({ id: o.id, baslik: o.baslik, tur: o.tur, turAd: TUR_AD[o.tur], hedef: jsonCoz(o.hedef, {}), sonTarih: o.son_tarih, olusturma: o.olusturma, link: odevLink(o) });

  // ---------------------------------------------------------------- öğretmen
  function ogretmenOkul(u) {
    const o = q.ogretmenAktif.get(u.id);
    if (!o) return null;
    const okul = q.okul.get(o.okul_id);
    return okul && okul.durum === "aktif" ? okul : null;
  }
  /** Öğretmenin kendi sınıfı (değilse 404: başka sınıfın varlığı sızdırılmaz) */
  function sinifAl(u, id) {
    const s = q.sinif.get(+id || 0);
    const okul = ogretmenOkul(u);
    if (!s || !okul || s.ogretmen_id !== u.id || s.okul_id !== okul.id || s.durum !== "aktif") throw new HttpHata(404, "Sınıf bulunamadı.");
    return { s, okul };
  }
  function sinifGenel(s) {
    const uye = db.prepare("SELECT COUNT(*) AS n FROM sinif_uyeleri m JOIN users u ON u.id = m.ogrenci_id WHERE m.sinif_id = ? AND m.durum = 'aktif' AND u.durum != 'silindi'").get(s.id).n;
    const odev = db.prepare("SELECT COUNT(*) AS n FROM odevler WHERE sinif_id = ? AND durum = 'aktif'").get(s.id).n;
    const d = dersBilgi(s.ders);
    return { id: s.id, ad: s.ad, ders: s.ders, dersAd: d ? "AP " + d.ad : "Karışık (tüm dersler)", kod: s.kod, link: config.baseUrl + "/sinif?kod=" + s.kod, uye, odev, olusturma: s.olusturma };
  }

  function panel(u) {
    const okul = ogretmenOkul(u);
    const siniflar = okul ? db.prepare("SELECT * FROM siniflar WHERE ogretmen_id = ? AND okul_id = ? AND durum = 'aktif' ORDER BY id DESC").all(u.id, okul.id).map(sinifGenel) : [];
    return { ogretmen: { ad: u.ad, soyad: u.soyad }, okul: okul ? Object.assign({ ad: okul.ad, sehir: okul.sehir }, koltukBilgi(okul.id)) : null, siniflar,
      dersler: DERS_LISTESI().concat([{ ders: "karisik", ad: "Karışık (tüm dersler)" }]) };
  }
  function sinifOlustur(u, f, req) {
    const okul = ogretmenOkul(u);
    if (!okul) throw new HttpHata(403, "Hesabın etkin bir okula bağlı değil.");
    const ad = kirp(f && f.ad), ders = String((f && f.ders) || "");
    const e = {};
    if (!ad) e.ad = "Sınıfa bir ad ver."; else if (ad.length > 60) e.ad = "En fazla 60 karakter.";
    if (ders !== "karisik" && !dersBilgi(ders)) e.ders = "Bir ders seç.";
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    if (db.prepare("SELECT COUNT(*) AS n FROM siniflar WHERE ogretmen_id = ? AND durum = 'aktif'").get(u.id).n >= 50) throw new HttpHata(409, "En fazla 50 etkin sınıf açılabilir.");
    let kod;
    for (let i = 0; i < 20 && !kod; i++) { const k = kodUret(); if (!db.prepare("SELECT 1 FROM siniflar WHERE kod = ?").get(k)) kod = k; }
    if (!kod) throw new HttpHata(503, "Kod üretilemedi, tekrar dene.");
    const id = Number(db.prepare("INSERT INTO siniflar (okul_id, ogretmen_id, ad, ders, kod, olusturma) VALUES (?, ?, ?, ?, ?, ?)").run(okul.id, u.id, ad, ders, kod, simdi()).lastInsertRowid);
    denetim({ eylem: "okul.sinif-olustur", kullanici: u.id, istek: req, varlik: "siniflar", varlikId: id, ayrinti: { okul: okul.id, ders } });
    return sinifGenel(q.sinif.get(id));
  }
  function sinifArsiv(u, id, req) {
    const { s, okul } = sinifAl(u, id);
    const uyeler = q.uyeler.all(s.id).map(r => r.id);
    db.prepare("UPDATE siniflar SET durum = 'arsiv' WHERE id = ?").run(s.id);
    uyeler.forEach(oid => koltukEsitle(okul.id, oid, req));
    denetim({ eylem: "okul.sinif-arsiv", kullanici: u.id, istek: req, varlik: "siniflar", varlikId: s.id });
    return true;
  }
  function sinifPano(u, id, simdiMs) {
    simdiMs = simdiMs == null ? saat() : simdiMs;
    const { s, okul } = sinifAl(u, id);
    const uyeler = q.uyeler.all(s.id);
    const bl = birimler(s.ders);
    const odevler = q.odevler.all(s.id);
    const ogr = uyeler.map(m => {
      const o = ogrenciOzet(m, s, simdiMs, !!okul.eposta_gorunur);
      o.kapsam = bl.map(b => { const k = kapsam(m.id, b); return k.yuzde; });
      o.odevler = odevler.map(od => odevDurumu(od, m.id, simdiMs));
      return o;
    });
    return {
      sinif: sinifGenel(s), okul: { ad: okul.ad, epostaGorunur: !!okul.eposta_gorunur },
      birimler: bl.map(b => ({ id: b.id, ad: b.ad, no: b.no || null, sayfa: b.sayfa, banka: b.banka || null })),
      ogrenciler: ogr,
      odevler: odevler.map((od, i) => {
        const tamam = ogr.filter(x => x.odevler[i].durum === "tamam").length;
        return Object.assign(odevGenel(od), { tamam, toplam: ogr.length, yuzde: ogr.length ? Math.round(tamam / ogr.length * 100) : null });
      }),
      secenekler: secenekler(s.ders)
    };
  }
  /** Ödev formu seçenekleri (dersin üniteleri, deneme kodları, FRQ dersleri, tam sınav planları) */
  function secenekler(ders) {
    const d = dersBilgi(ders);
    const dersler = d ? [d] : AP.DERSLER;
    const uniteler = [];
    dersler.forEach(x => birimler(x.ders).forEach(b => uniteler.push({ sayfa: b.sayfa, kutu: b.id, no: b.no, ad: (d ? "" : "AP " + x.ad + " · ") + b.ad, banka: b.banka })));
    const tekil = (l, k) => l.filter((x, i) => l.findIndex(y => y[k] === x[k] && (k !== "kutu" || y.sayfa === x.sayfa)) === i);
    let frqDersler = [];
    try { frqDersler = db.prepare("SELECT DISTINCT ders FROM frq WHERE durum = 'aktif'").all().map(r => r.ders); } catch (e) { /* FRQ tablosu yok */ }
    return {
      uniteler: tekil(uniteler, "kutu"),
      denemeler: tekil(dersler.map(x => ({ kod: x.deneme, ad: "AP " + x.ad })), "kod"),
      tamSinavlar: dersler.map(x => ({ kod: x.ders, ad: "AP " + x.ad })),
      frq: dersler.filter(x => frqDersler.indexOf(x.ders) >= 0).map(x => ({ ders: x.ders, ad: "AP " + x.ad }))
    };
  }
  function odevOlustur(u, sid, f, req) {
    const { s } = sinifAl(u, sid);
    f = f || {};
    const baslik = kirp(f.baslik), tur = String(f.tur || ""), h = f.hedef && typeof f.hedef === "object" ? f.hedef : {};
    const e = {};
    if (TURLER.indexOf(tur) < 0) e.tur = "Ödev türünü seç.";
    const sec = secenekler(s.ders), hedef = {};
    if (tur === "unite") {
      const un = sec.uniteler.filter(x => x.sayfa === h.sayfa && x.kutu === h.kutu)[0];
      if (!un) e.hedef = "Bir ünite seç.";
      else Object.assign(hedef, { sayfa: un.sayfa, kutu: un.kutu, no: un.no, adet: Math.max(1, Math.min(+h.adet || Math.min(10, un.banka || 10), un.banka || 50)) });
    } else if (tur === "deneme") { if (!sec.denemeler.some(x => x.kod === h.kod)) e.hedef = "Bir deneme seç."; else hedef.kod = h.kod; }
    else if (tur === "tam_sinav") { if (!sec.tamSinavlar.some(x => x.kod === h.kod)) e.hedef = "Bir sınav seç."; else hedef.kod = h.kod; }
    else if (tur === "frq") { if (!sec.frq.some(x => x.ders === h.ders)) e.hedef = "Bir FRQ dersi seç."; else hedef.ders = h.ders; }
    else if (tur === "kart") { hedef.adet = Math.max(1, Math.min(+h.adet || 20, 200)); if (h.onek && /^[a-z0-9-]{1,30}$/i.test(String(h.onek))) hedef.onek = String(h.onek); }
    let son = null;
    if (f.sonTarih) {
      const m = /^(\d{4}-\d{2}-\d{2})$/.exec(String(f.sonTarih));
      if (!m || isNaN(Date.parse(m[1]))) e.sonTarih = "Geçerli bir tarih seç.";
      else son = m[1] + "T20:59:59.000Z"; // İstanbul günü sonu (23:59, UTC+3)
      if (son && son < simdi()) e.sonTarih = "Son tarih geçmişte olamaz.";
    }
    const bas = baslik || (TUR_AD[tur] || "Ödev");
    if (bas.length > 100) e.baslik = "En fazla 100 karakter.";
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    const id = Number(db.prepare("INSERT INTO odevler (sinif_id, baslik, tur, hedef, son_tarih, olusturma, olusturan) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(s.id, bas, tur, JSON.stringify(hedef), son, simdi(), u.id).lastInsertRowid);
    denetim({ eylem: "okul.odev-olustur", kullanici: u.id, istek: req, varlik: "odevler", varlikId: id, ayrinti: { sinif: s.id, tur } });
    if (bildirim) {
      q.uyeler.all(s.id).forEach(m => {
        try {
          bildirim.olustur(m.id, { tur: "duyuru", baslik: "Yeni ödev: " + bas, metin: s.ad + " sınıfı · " + TUR_AD[tur] + (son ? " · son gün " + new Date(son).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long" }) : ""), link: "/sinif" });
        } catch (x) { /* bildirim ödevi bozmaz */ }
      });
    }
    return odevGenel(db.prepare("SELECT * FROM odevler WHERE id = ?").get(id));
  }
  function odevIptal(u, oid, req) {
    const o = db.prepare("SELECT * FROM odevler WHERE id = ? AND durum = 'aktif'").get(+oid || 0);
    if (!o) throw new HttpHata(404, "Ödev bulunamadı.");
    sinifAl(u, o.sinif_id);
    db.prepare("UPDATE odevler SET durum = 'iptal' WHERE id = ?").run(o.id);
    denetim({ eylem: "okul.odev-iptal", kullanici: u.id, istek: req, varlik: "odevler", varlikId: o.id });
    return true;
  }
  function ogrenciCikar(u, sid, uyeId, req) {
    const { s, okul } = sinifAl(u, sid);
    const m = db.prepare("SELECT * FROM sinif_uyeleri WHERE id = ? AND sinif_id = ? AND durum = 'aktif'").get(+uyeId || 0, s.id);
    if (!m) throw new HttpHata(404, "Öğrenci bu sınıfta değil.");
    islem(db, () => {
      db.prepare("UPDATE sinif_uyeleri SET durum = 'cikarildi', ayrilma = ? WHERE id = ?").run(simdi(), m.id);
      koltukEsitle(okul.id, m.ogrenci_id, req);
    });
    denetim({ eylem: "okul.ogrenci-cikar", kullanici: m.ogrenci_id, yapan: u.id, istek: req, varlik: "sinif_uyeleri", varlikId: m.id, ayrinti: { sinif: s.id } });
    if (bildirim) { try { bildirim.olustur(m.ogrenci_id, { tur: "duyuru", baslik: "Sınıftan çıkarıldın", metin: s.ad + " sınıfının öğretmeni seni sınıftan çıkardı. Öğretmen artık ilerleme özetini göremez.", link: "/sinif" }); } catch (x) { /* */ } }
    return true;
  }
  function csv(u, sid, simdiMs) {
    const p = sinifPano(u, sid, simdiMs);
    const h = s => { const t = String(s == null ? "" : s); return /[",;\n\r]/.test(t) || /^[=+\-@\t]/.test(t) ? '"' + (/^[=+\-@\t]/.test(t) ? "'" : "") + t.replace(/"/g, '""') + '"' : t; };
    const bas = ["Öğrenci"].concat(p.sinif && p.okul.epostaGorunur ? ["E-posta"] : [], ["Son etkinlik", "Bu hafta soru", "Bu hafta doğruluk %", "Doğruluk %", "Seri (gün)", "Tahmini AP puanı"],
      p.birimler.map(b => "Kapsam % · " + b.ad), p.odevler.map(o => "Ödev · " + o.baslik));
    const DUR = { tamam: "Tamamlandı", devam: "Devam ediyor", baslamadi: "Başlamadı", gecikti: "Gecikti" };
    const satir = p.ogrenciler.map(o => [o.ad].concat(p.okul.epostaGorunur ? [o.eposta || ""] : [], [o.sonAktif ? o.sonAktif.slice(0, 10) : "", o.haftaSoru, o.haftaDogruluk == null ? "" : o.haftaDogruluk,
      o.dogruluk == null ? "" : o.dogruluk, o.seri, o.tahminiPuan == null ? "" : o.tahminiPuan], o.kapsam.map(k => k == null ? "" : k), o.odevler.map(d => DUR[d.durum] + (d.hedef > 1 ? " (" + d.ilerleme + "/" + d.hedef + ")" : ""))));
    return { ad: p.sinif.ad, metin: "﻿" + [bas].concat(satir).map(r => r.map(h).join(";")).join("\r\n") + "\r\n" };
  }

  // ---------------------------------------------------------------- öğrenci
  function kodBilgi(ogr, kod) {
    kod = String(kod || "").trim().toUpperCase();
    if (!KOD_RE.test(kod)) throw new HttpHata(400, "Sınıf kodu 6 karakter olmalı (harf ve rakam).");
    const s = q.sinifKod.get(kod);
    const okul = s ? q.okul.get(s.okul_id) : null;
    if (!s || !okul || okul.durum !== "aktif") throw new HttpHata(404, "Bu kodla etkin bir sınıf bulunamadı. Kodu öğretmenine sor.");
    const ogt = q.kullanici.get(s.ogretmen_id);
    const kb = koltukBilgi(okul.id), uye = !!q.uyeAktif.get(s.id, ogr.id);
    const zatenKoltuk = !!q.okulAbonelik.get(okul.id, ogr.id, simdi());
    const d = dersBilgi(s.ders);
    return { sinif: { kod: s.kod, ad: s.ad, dersAd: d ? "AP " + d.ad : "Karışık (tüm dersler)", okul: okul.ad, ogretmen: ogt ? kisaAd(ogt) : null },
      uye, premium: { lisans: kb.gecerli, koltukVar: zatenKoltuk || (kb.gecerli && kb.kullanilan < kb.koltuk), bitis: kb.bitis },
      paylasilan: PAYLASILAN, paylasilmayan: PAYLASILMAYAN };
  }
  function katil(ogr, f, req) {
    f = f || {};
    if (f.onay !== true) throw new HttpHata(400, "Katılmak için öğretmenin göreceği bilgileri onayla.", { onay: "Onay gerekli." });
    const b = kodBilgi(ogr, f.kod);
    const s = q.sinifKod.get(b.sinif.kod);
    let sonuc;
    islem(db, () => {
      if (!q.uyeAktif.get(s.id, ogr.id)) {
        if (db.prepare("SELECT COUNT(*) AS n FROM sinif_uyeleri WHERE ogrenci_id = ? AND durum = 'aktif'").get(ogr.id).n >= 10) throw new HttpHata(409, "En fazla 10 sınıfa katılabilirsin.");
        db.prepare("INSERT INTO sinif_uyeleri (sinif_id, ogrenci_id, katilma) VALUES (?, ?, ?)").run(s.id, ogr.id, simdi());
      }
      sonuc = koltukEsitle(s.okul_id, ogr.id, req);
    });
    denetim({ eylem: "okul.sinif-katil", kullanici: ogr.id, istek: req, varlik: "siniflar", varlikId: s.id, ayrinti: { premium: sonuc.premium, koltukYok: sonuc.koltukYok } });
    return { premium: sonuc.premium, koltukYok: sonuc.koltukYok,
      mesaj: sonuc.premium ? "Sınıfa katıldın. Okulunun lisansıyla Premium açık." : sonuc.koltukYok ? "Sınıfa katıldın. Okulunun Premium koltukları şu an dolu; ücretsiz planla devam ediyorsun. Koltuk açılınca öğretmenin bilgilendirilir." : "Sınıfa katıldın." };
  }
  function ayril(ogr, sid, req) {
    const m = db.prepare("SELECT * FROM sinif_uyeleri WHERE sinif_id = ? AND ogrenci_id = ? AND durum = 'aktif'").get(+sid || 0, ogr.id);
    if (!m) throw new HttpHata(404, "Bu sınıfta değilsin.");
    const s = q.sinif.get(m.sinif_id);
    islem(db, () => {
      db.prepare("UPDATE sinif_uyeleri SET durum = 'ayrildi', ayrilma = ? WHERE id = ?").run(simdi(), m.id);
      koltukEsitle(s.okul_id, ogr.id, req);
    });
    denetim({ eylem: "okul.sinif-ayril", kullanici: ogr.id, istek: req, varlik: "sinif_uyeleri", varlikId: m.id, ayrinti: { sinif: s.id } });
    return true;
  }
  function benim(ogr, simdiMs) {
    simdiMs = simdiMs == null ? saat() : simdiMs;
    const l = db.prepare(`SELECT s.*, m.katilma FROM sinif_uyeleri m JOIN siniflar s ON s.id = m.sinif_id JOIN okullar o ON o.id = s.okul_id
      WHERE m.ogrenci_id = ? AND m.durum = 'aktif' AND s.durum = 'aktif' ORDER BY m.id DESC`).all(ogr.id);
    const uy = hesap.uyelik(ogr.id);
    return {
      siniflar: l.map(s => {
        const okul = q.okul.get(s.okul_id), ogt = q.kullanici.get(s.ogretmen_id), d = dersBilgi(s.ders);
        return { id: s.id, ad: s.ad, kod: s.kod, dersAd: d ? "AP " + d.ad : "Karışık (tüm dersler)", okul: okul.ad, ogretmen: ogt ? kisaAd(ogt) : null, katilma: s.katilma,
          okulPremium: !!q.okulAbonelik.get(s.okul_id, ogr.id, simdi()),
          odevler: q.odevler.all(s.id).map(o => Object.assign(odevGenel(o), odevDurumu(o, ogr.id, simdiMs))) };
      }),
      uyelik: { premium: uy.premium, kaynak: uy.kaynak, bitis: uy.bitis },
      paylasilan: PAYLASILAN, paylasilmayan: PAYLASILMAYAN
    };
  }

  // ---------------------------------------------------------------- öğretmen daveti
  const davetLinki = tok => config.baseUrl + "/ogretmen?t=" + encodeURIComponent(tok);
  function davetBul(tok) {
    if (!tok || typeof tok !== "string" || tok.length > 100) return null;
    const r = db.prepare("SELECT * FROM ogretmenler WHERE belirtec_hash = ? AND durum = 'davet'").get(ozet(tok));
    if (!r || !r.davet_bitis || r.davet_bitis <= simdi()) return null;
    const okul = q.okul.get(r.okul_id);
    return okul && okul.durum === "aktif" ? Object.assign(r, { okul }) : null;
  }
  function baglan(davet, u, req) {
    islem(db, () => {
      // Öğretmen tek okulda etkin: eski etkin bağlantı (başka okul) kapanır
      db.prepare("UPDATE ogretmenler SET durum = 'iptal', iptal_zamani = ? WHERE user_id = ? AND durum = 'aktif' AND id != ?").run(simdi(), u.id, davet.id);
      db.prepare("UPDATE ogretmenler SET user_id = ?, durum = 'aktif', kabul = ?, belirtec_hash = NULL WHERE id = ? AND durum = 'davet'").run(u.id, simdi(), davet.id);
    });
    denetim({ eylem: "okul.ogretmen-baglandi", kullanici: u.id, istek: req, varlik: "ogretmenler", varlikId: davet.id, ayrinti: { okul: davet.okul_id } });
  }

  // ---------------------------------------------------------------- yönetici
  function okulGenel(o) {
    const kb = koltukBilgi(o.id);
    return { id: o.id, ad: o.ad, sehir: o.sehir, iletisimEposta: o.iletisim_eposta, durum: o.durum, epostaGorunur: !!o.eposta_gorunur, olusturma: o.olusturma, koltuk: kb,
      sonLisans: (() => { const l = q.sonLisans.get(o.id); return l ? { id: l.id, koltuk: l.koltuk, baslangic: l.baslangic, bitis: l.bitis } : null; })(),
      ogretmen: db.prepare("SELECT COUNT(*) AS n FROM ogretmenler WHERE okul_id = ? AND durum = 'aktif'").get(o.id).n,
      sinif: db.prepare("SELECT COUNT(*) AS n FROM siniflar WHERE okul_id = ? AND durum = 'aktif'").get(o.id).n,
      ogrenci: db.prepare("SELECT COUNT(DISTINCT m.ogrenci_id) AS n FROM sinif_uyeleri m JOIN siniflar s ON s.id = m.sinif_id WHERE s.okul_id = ? AND m.durum = 'aktif' AND s.durum = 'aktif'").get(o.id).n };
  }
  function okulAlanlari(f, e) {
    const ad = kirp(f.ad), sehir = kirp(f.sehir), ep = kirp(f.iletisimEposta).toLowerCase();
    if (!ad) e.ad = "Okul adı gerekli."; else if (ad.length > 120) e.ad = "En fazla 120 karakter.";
    if (sehir.length > 60) e.sehir = "En fazla 60 karakter.";
    if (ep && (ep.length > 120 || !EPOSTA_RE.test(ep))) e.iletisimEposta = "Geçerli bir e-posta yaz.";
    return { ad, sehir: sehir || null, ep: ep || null };
  }
  const tarihAl = (v, k, e) => {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v || ""));
    if (!m || isNaN(Date.parse(m[1]))) { e[k] = "Geçerli bir tarih seç."; return null; }
    return m[1];
  };

  return {
    ogretmenYolIzinli, koltukEsitle, okulEsitle, koltukBilgi, odevDurumu,
    panel, sinifOlustur, sinifArsiv, sinifPano, odevOlustur, odevIptal, ogrenciCikar, csv,
    kodBilgi, katil, ayril, benim,
    /** Zamanlayıcı: başlayan / biten lisanslar için tüm okulları eşitler */
    tumunuEsitle() { return db.prepare("SELECT id FROM okullar").all().reduce((t, o) => t + okulEsitle(o.id, null), 0); },

    davetBilgi(tok) {
      const r = davetBul(tok);
      if (!r) return null;
      const v = q.kullaniciEposta.get(r.eposta);
      return { okul: r.okul.ad, eposta: r.eposta, hesapVar: !!v, hesapOgretmen: !!(v && v.rol === "ogretmen"), bitis: r.davet_bitis };
    },
    kayit(f, req) {
      f = f || {};
      const r = davetBul(f.t);
      if (!r) throw new HttpHata(400, "Davet bağlantısının süresi dolmuş ya da geçersiz. Meberra'dan yeni davet isteyin.");
      const ad = kirp(f.ad), soyad = kirp(f.soyad), e = {};
      if (!ad) e.ad = "Adınızı yazın."; else if (ad.length > 40) e.ad = "En fazla 40 karakter.";
      if (!soyad) e.soyad = "Soyadınızı yazın."; else if (soyad.length > 40) e.soyad = "En fazla 40 karakter.";
      if (!f.sifre || String(f.sifre).length < 8) e.sifre = "Şifre en az 8 karakter olmalı.";
      else if (String(f.sifre).length > 128) e.sifre = "Şifre en fazla 128 karakter olabilir.";
      else if (f.sifre !== f.sifre2) e.sifre2 = "Şifreler eşleşmiyor.";
      if (f.kosullar !== true) e.kosullar = "Devam etmek için kullanım koşullarını kabul edin.";
      if (f.kvkk !== true) e.kvkk = "Devam etmek için KVKK aydınlatma metnini okuduğunuzu onaylayın.";
      if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzeltin.", e);
      if (q.kullaniciEposta.get(r.eposta)) throw new HttpHata(409, "Bu e-posta ile bir hesap var. Giriş yapıp daveti kabul edin.", { eposta: "Hesap var: giriş yapın." });
      const z = simdi();
      const id = Number(db.prepare(`INSERT INTO users (public_id, eposta, kullanici_adi, ad, soyad, sifre_hash, rol, kvkk_onay, kosul_onay, veli_onay, olusturma, guncelleme)
        VALUES (?, ?, ?, ?, ?, ?, 'ogretmen', ?, ?, 1, ?, ?)`).run(publicId(), r.eposta, r.eposta, ad, soyad, sifreOzetle(f.sifre), z, z, z, z).lastInsertRowid);
      denetim({ eylem: "auth.kayit", kullanici: id, istek: req, ayrinti: { rol: "ogretmen", davet: r.id } });
      baglan(r, q.kullanici.get(id), req);
      return hesap.giris(r.eposta, f.sifre, req);
    },
    kabul(u, tok, req) {
      if (u.rol !== "ogretmen") throw new HttpHata(403, "Daveti kabul etmek için öğretmen hesabıyla giriş yapın.");
      const r = davetBul(tok);
      if (!r) throw new HttpHata(400, "Davet bağlantısının süresi dolmuş ya da geçersiz.");
      if (String(r.eposta || "").toLowerCase() !== String(u.eposta || "").toLowerCase()) throw new HttpHata(403, "Bu davet başka bir e-posta adresine gönderildi.");
      baglan(r, u, req);
      return true;
    },

    adminListe() { return db.prepare("SELECT * FROM okullar ORDER BY durum, ad").all().map(okulGenel); },
    adminDetay(id) {
      const o = q.okul.get(+id || 0);
      if (!o) throw new HttpHata(404, "Okul bulunamadı.");
      return Object.assign(okulGenel(o), {
        lisanslar: db.prepare("SELECT id, koltuk, baslangic, bitis, plan_notu AS planNotu, tutar_tl AS tutarTl, durum, olusturma FROM lisanslar WHERE okul_id = ? ORDER BY id DESC").all(o.id),
        ogretmenler: db.prepare(`SELECT t.id, t.durum, t.eposta, t.olusturma, t.kabul, t.davet_bitis AS davetBitis, u.ad, u.soyad,
          (SELECT COUNT(*) FROM siniflar s WHERE s.ogretmen_id = t.user_id AND s.okul_id = t.okul_id AND s.durum = 'aktif') AS sinif
          FROM ogretmenler t LEFT JOIN users u ON u.id = t.user_id WHERE t.okul_id = ? AND t.durum != 'iptal' ORDER BY t.id DESC`).all(o.id)
          .map(t => ({ id: t.id, durum: t.durum, eposta: t.eposta, ad: t.ad ? (t.ad + " " + t.soyad).trim() : null, olusturma: t.olusturma, kabul: t.kabul, davetBitis: t.davetBitis, sinif: t.sinif })),
        siniflar: db.prepare(`SELECT s.id, s.ad, s.ders, s.kod, s.olusturma, u.ad AS t_ad, u.soyad AS t_soyad,
          (SELECT COUNT(*) FROM sinif_uyeleri m WHERE m.sinif_id = s.id AND m.durum = 'aktif') AS uye FROM siniflar s JOIN users u ON u.id = s.ogretmen_id
          WHERE s.okul_id = ? AND s.durum = 'aktif' ORDER BY s.id DESC`).all(o.id).map(s => ({ id: s.id, ad: s.ad, ders: s.ders, kod: s.kod, olusturma: s.olusturma, ogretmen: (s.t_ad + " " + s.t_soyad).trim(), uye: s.uye }))
      });
    },
    adminOlustur(yon, f, req) {
      f = f || {};
      const e = {}, a = okulAlanlari(f, e);
      if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzeltin.", e);
      const id = Number(db.prepare("INSERT INTO okullar (ad, sehir, iletisim_eposta, olusturma, olusturan) VALUES (?, ?, ?, ?, ?)").run(a.ad, a.sehir, a.ep, simdi(), yon.id).lastInsertRowid);
      denetim({ eylem: "okul.olustur", yapan: yon.id, istek: req, varlik: "okullar", varlikId: id, ayrinti: { ad: a.ad } });
      return okulGenel(q.okul.get(id));
    },
    adminGuncelle(yon, id, f, req) {
      const o = q.okul.get(+id || 0);
      if (!o) throw new HttpHata(404, "Okul bulunamadı.");
      f = f || {};
      const e = {}, a = okulAlanlari(Object.assign({ ad: o.ad, sehir: o.sehir, iletisimEposta: o.iletisim_eposta }, f), e);
      const durum = f.durum == null ? o.durum : String(f.durum);
      if (["aktif", "pasif"].indexOf(durum) < 0) e.durum = "Geçersiz durum.";
      if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzeltin.", e);
      const eg = f.epostaGorunur == null ? o.eposta_gorunur : (f.epostaGorunur === true ? 1 : 0);
      db.prepare("UPDATE okullar SET ad = ?, sehir = ?, iletisim_eposta = ?, durum = ?, eposta_gorunur = ? WHERE id = ?").run(a.ad, a.sehir, a.ep, durum, eg, o.id);
      denetim({ eylem: "okul.guncelle", yapan: yon.id, istek: req, varlik: "okullar", varlikId: o.id, ayrinti: { durum, epostaGorunur: !!eg } });
      if (durum !== o.durum) okulEsitle(o.id, req);
      return okulGenel(q.okul.get(o.id));
    },
    adminLisans(yon, id, f, req) {
      const o = q.okul.get(+id || 0);
      if (!o) throw new HttpHata(404, "Okul bulunamadı.");
      f = f || {};
      const e = {};
      const koltuk = Number(f.koltuk);
      if (!Number.isInteger(koltuk) || koltuk < 1 || koltuk > 10000) e.koltuk = "Koltuk sayısı 1–10000 arası tam sayı olmalı.";
      const bas = tarihAl(f.baslangic, "baslangic", e), bit = tarihAl(f.bitis, "bitis", e);
      if (bas && bit && bit <= bas) e.bitis = "Bitiş başlangıçtan sonra olmalı.";
      const tutar = f.tutarTl == null || f.tutarTl === "" ? null : Number(f.tutarTl);
      if (tutar != null && (!isFinite(tutar) || tutar < 0)) e.tutarTl = "Geçerli bir tutar yaz.";
      const not = kirp(f.planNotu).slice(0, 300) || null;
      if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzeltin.", e);
      let lid;
      islem(db, () => {
        db.prepare("UPDATE lisanslar SET durum = 'yenilendi' WHERE okul_id = ? AND durum = 'aktif'").run(o.id);
        lid = Number(db.prepare("INSERT INTO lisanslar (okul_id, koltuk, baslangic, bitis, plan_notu, tutar_tl, olusturma, olusturan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .run(o.id, koltuk, bas + "T00:00:00.000Z", bit + "T20:59:59.000Z", not, tutar, simdi(), yon.id).lastInsertRowid);
        okulEsitle(o.id, req);
      });
      denetim({ eylem: "okul.lisans", yapan: yon.id, istek: req, varlik: "lisanslar", varlikId: lid, ayrinti: { okul: o.id, koltuk, baslangic: bas, bitis: bit, tutar } });
      return okulGenel(q.okul.get(o.id));
    },
    adminLisansIptal(yon, id, req) {
      const o = q.okul.get(+id || 0);
      if (!o) throw new HttpHata(404, "Okul bulunamadı.");
      const n = Number(db.prepare("UPDATE lisanslar SET durum = 'iptal', iptal_zamani = ? WHERE okul_id = ? AND durum = 'aktif'").run(simdi(), o.id).changes);
      if (!n) throw new HttpHata(409, "Etkin lisans yok.");
      okulEsitle(o.id, req);
      denetim({ eylem: "okul.lisans-iptal", yapan: yon.id, istek: req, varlik: "okullar", varlikId: o.id });
      return okulGenel(q.okul.get(o.id));
    },
    adminDavet(yon, id, f, req) {
      const o = q.okul.get(+id || 0);
      if (!o) throw new HttpHata(404, "Okul bulunamadı.");
      const ep = kirp(f && f.eposta).toLowerCase();
      if (!ep || ep.length > 120 || !EPOSTA_RE.test(ep)) throw new HttpHata(400, "Geçerli bir e-posta adresi yaz.", { eposta: "Geçerli bir e-posta adresi yaz." });
      const v = q.kullaniciEposta.get(ep);
      if (v && v.rol !== "ogretmen") throw new HttpHata(400, "Bu adres başka türde bir hesaba ait (öğrenci/veli/yönetici). Öğretmenin okul e-postasını yazın.", { eposta: "Bu adres öğretmen olarak eklenemez." });
      if (v && db.prepare("SELECT 1 FROM ogretmenler WHERE user_id = ? AND okul_id = ? AND durum = 'aktif'").get(v.id, o.id)) throw new HttpHata(409, "Bu öğretmen zaten okula bağlı.");
      const tok = belirtec(24), z = simdi(), bitis = new Date(Date.parse(z) + DAVET_GUN * GUN).toISOString();
      const eski = db.prepare("SELECT * FROM ogretmenler WHERE okul_id = ? AND eposta = ? AND durum = 'davet'").get(o.id, ep);
      let did;
      if (eski) { db.prepare("UPDATE ogretmenler SET belirtec_hash = ?, davet_bitis = ?, olusturma = ? WHERE id = ?").run(ozet(tok), bitis, z, eski.id); did = eski.id; }
      else did = Number(db.prepare("INSERT INTO ogretmenler (okul_id, eposta, belirtec_hash, davet_bitis, olusturma) VALUES (?, ?, ?, ?, ?)").run(o.id, ep, ozet(tok), bitis, z).lastInsertRowid);
      eposta.gonder(ep, "Meberra öğretmen paneli daveti: " + o.ad,
        "Merhaba,\n\n" + o.ad + " için Meberra öğretmen paneline davet edildiniz. Panelde sınıf açıp katılım kodu paylaşabilir, öğrencilerinizin toplu ilerlemesini " +
        "(soru sayısı, doğruluk, ünite kapsamı, tahmini AP puanı) görebilir ve ödev verebilirsiniz. Öğrencilerin yazışmaları ve notları paylaşılmaz.\n\n" +
        "Daveti kabul edip şifrenizi belirlemek için bu bağlantıyı açın (" + DAVET_GUN + " gün geçerli):\n" + davetLinki(tok) + "\n\nBu daveti beklemiyorsanız hiçbir şey yapmanız gerekmez.\n\nMeberra");
      denetim({ eylem: eski ? "okul.ogretmen-davet-yeniden" : "okul.ogretmen-davet", yapan: yon.id, istek: req, varlik: "ogretmenler", varlikId: did, ayrinti: { okul: o.id, eposta: ep } });
      return { id: did, eposta: ep, davetBitis: bitis };
    },
    adminOgretmenIptal(yon, tid, req) {
      const t = db.prepare("SELECT * FROM ogretmenler WHERE id = ? AND durum != 'iptal'").get(+tid || 0);
      if (!t) throw new HttpHata(404, "Öğretmen kaydı bulunamadı.");
      db.prepare("UPDATE ogretmenler SET durum = 'iptal', iptal_zamani = ?, belirtec_hash = NULL WHERE id = ?").run(simdi(), t.id);
      denetim({ eylem: "okul.ogretmen-iptal", kullanici: t.user_id || null, yapan: yon.id, istek: req, varlik: "ogretmenler", varlikId: t.id, ayrinti: { okul: t.okul_id } });
      return true;
    }
  };
}

/** Rotalar. c: { okul, oturumGerekli, yoneticiGerekli, oturumYanit, kayitSiniri } */
function okulRotalari(r, c) {
  const { okul, oturumGerekli, yoneticiGerekli, oturumYanit } = c;
  const sinir = { kod: hizSinirlayici(30, 15 * 60e3), kayit: hizSinirlayici(c.kayitSiniri || 10, 60 * 60e3), bilgi: hizSinirlayici(60, 15 * 60e3) };
  const ogretmenGerekli = req => { oturumGerekli(req); if (req.kullanici.rol !== "ogretmen") throw new HttpHata(403, "Bu sayfa öğretmen hesapları içindir."); };
  const ogrenciGerekli = req => { oturumGerekli(req); if (req.kullanici.rol !== "ogrenci") throw new HttpHata(403, "Sınıfa yalnızca öğrenci hesapları katılabilir."); };

  // Öğretmen daveti (oturum gerekmez; belirteç yeterli)
  r.get("/api/public/ogretmen-davet", req => {
    if (!sinir.bilgi.dene(req.ip)) throw new HttpHata(429, "Çok fazla istek. Biraz sonra tekrar deneyin.");
    const b = okul.davetBilgi(req.sorgu.get("t"));
    if (!b) throw new HttpHata(404, "Davet bağlantısının süresi dolmuş ya da geçersiz.");
    return { ok: true, davet: b };
  });
  r.post("/api/ogretmen/kayit", (req, res) => {
    if (!sinir.kayit.dene(req.ip)) throw new HttpHata(429, "Çok fazla kayıt denemesi. Biraz sonra tekrar deneyin.");
    const s = okul.kayit(req.body || {}, req);
    return oturumYanit(res, s.kullanici, s.oturum);
  });
  r.post("/api/ogretmen/kabul", req => { oturumGerekli(req); okul.kabul(req.kullanici, (req.body || {}).t, req); return { ok: true }; });

  // Öğretmen paneli
  r.get("/api/ogretmen/panel", req => { ogretmenGerekli(req); return Object.assign({ ok: true }, okul.panel(req.kullanici)); });
  r.post("/api/ogretmen/siniflar", req => { ogretmenGerekli(req); return { ok: true, sinif: okul.sinifOlustur(req.kullanici, req.body || {}, req) }; });
  r.get("/api/ogretmen/siniflar/:id", req => { ogretmenGerekli(req); return Object.assign({ ok: true }, okul.sinifPano(req.kullanici, req.params.id)); });
  r.post("/api/ogretmen/siniflar/:id/arsiv", req => { ogretmenGerekli(req); okul.sinifArsiv(req.kullanici, req.params.id, req); return { ok: true }; });
  r.post("/api/ogretmen/siniflar/:id/odevler", req => { ogretmenGerekli(req); return { ok: true, odev: okul.odevOlustur(req.kullanici, req.params.id, req.body || {}, req) }; });
  r.post("/api/ogretmen/odevler/:id/iptal", req => { ogretmenGerekli(req); okul.odevIptal(req.kullanici, req.params.id, req); return { ok: true }; });
  r.post("/api/ogretmen/siniflar/:id/uyeler/:uye/cikar", req => { ogretmenGerekli(req); okul.ogrenciCikar(req.kullanici, req.params.id, req.params.uye, req); return { ok: true }; });
  r.get("/api/ogretmen/siniflar/:id/csv", (req, res) => {
    ogretmenGerekli(req);
    const x = okul.csv(req.kullanici, req.params.id);
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", "attachment; filename=\"sinif-" + req.params.id + ".csv\"; filename*=UTF-8''" + encodeURIComponent(x.ad.replace(/[\\/:*?"<>|]+/g, "-") + ".csv"));
    res.end(x.metin);
  });

  // Öğrenci: sınıf
  r.get("/api/sinif/kod/:kod", req => {
    ogrenciGerekli(req);
    if (!sinir.kod.dene("u:" + req.kullanici.id)) throw new HttpHata(429, "Çok fazla deneme. Biraz sonra tekrar dene.");
    return Object.assign({ ok: true }, okul.kodBilgi(req.kullanici, req.params.kod));
  });
  r.post("/api/sinif/katil", req => {
    ogrenciGerekli(req);
    if (!sinir.kod.dene("u:" + req.kullanici.id)) throw new HttpHata(429, "Çok fazla deneme. Biraz sonra tekrar dene.");
    return Object.assign({ ok: true }, okul.katil(req.kullanici, req.body || {}, req));
  });
  r.get("/api/sinif/benim", req => { ogrenciGerekli(req); return Object.assign({ ok: true }, okul.benim(req.kullanici)); });
  r.post("/api/sinif/:id/ayril", req => { ogrenciGerekli(req); okul.ayril(req.kullanici, req.params.id, req); return { ok: true }; });

  // Yönetici
  r.get("/api/admin/okullar", req => { yoneticiGerekli(req); return { ok: true, okullar: okul.adminListe() }; });
  r.post("/api/admin/okullar", req => { yoneticiGerekli(req); return { ok: true, okul: okul.adminOlustur(req.kullanici, req.body, req) }; });
  r.get("/api/admin/okullar/:id", req => { yoneticiGerekli(req); return { ok: true, okul: okul.adminDetay(req.params.id) }; });
  r.put("/api/admin/okullar/:id", req => { yoneticiGerekli(req); return { ok: true, okul: okul.adminGuncelle(req.kullanici, req.params.id, req.body, req) }; });
  r.post("/api/admin/okullar/:id/lisans", req => { yoneticiGerekli(req); return { ok: true, okul: okul.adminLisans(req.kullanici, req.params.id, req.body, req) }; });
  r.post("/api/admin/okullar/:id/lisans/iptal", req => { yoneticiGerekli(req); return { ok: true, okul: okul.adminLisansIptal(req.kullanici, req.params.id, req) }; });
  r.post("/api/admin/okullar/:id/ogretmen-davet", req => { yoneticiGerekli(req); return { ok: true, davet: okul.adminDavet(req.kullanici, req.params.id, req.body, req) }; });
  r.post("/api/admin/ogretmenler/:id/iptal", req => { yoneticiGerekli(req); okul.adminOgretmenIptal(req.kullanici, req.params.id, req); return { ok: true }; });
  return { sinir };
}

module.exports = { okulServisi, okulRotalari, ogretmenYolIzinli, kodUret, KOD_RE, PAYLASILAN, PAYLASILMAYAN };
