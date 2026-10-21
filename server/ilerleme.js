"use strict";
// 1.16.0 İlerleme grafikleri: öğrencinin kendi verisinden SALT OKUNUR toplu özetler (GET /api/ilerleme/ozet).
// Kaynak tablolar: answers, exams (ders denemeleri + tam sınavlar, istemci_id "ts-…"), frq_denemeleri, wrong_answers,
// questions_bank (ünite kapsamı için soru sayısı). Hiçbir tabloya yazmaz. Günler Europe/Istanbul yerel günüdür.
// Veli paneli (server/veli.js) haftalik() ve puanGecmisi() yardımcılarını aynı kurallarla kullanır.
const zaman = require("./zaman");
const ADRES = require("./adresler");
const AP = require("../assets/js/ap-hedef");

const GUN_SAYISI = 90;          // günlük etkinlik penceresi
const HAFTA_SAYISI = 12;        // haftalık XP penceresi
const XP = { soru: 5, dogru: 5, deneme: 50 }; // = server/lig.js XP ve assets/js/oyun.js
const ZAYIF_ESIK = 3;           // zayıf ünite sayılmak için en az cevap

const DENEME_DERS = {};          // deneme kodu → ilk AP ders anahtarı (economics → microeconomics)
AP.DERSLER.forEach(d => { if (!DENEME_DERS[d.deneme]) DENEME_DERS[d.deneme] = d.ders; });

/** tahmini_band sütunu: sayı (1–5) ya da eski kayıtlarda metin/JSON. Yalnızca 1–5 arası tek sayı kabul edilir. */
function puanOku(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n * 10) / 10 : null;
}
/** Doğruluk yüzdesinden ondalıklı tahmini puan (1,0–5,0): AP.BAND_ESIK eşikleri arasında doğrusal (halka için; tamsayı bant aynı kalır) */
function inceTahmin(y) {
  if (y === null || y === undefined || isNaN(+y)) return null;
  const e = AP.BAND_ESIK.slice().sort((a, b) => a.min - b.min); // 0→1, 30→2, 44→3, 58→4, 72→5
  y = +y;
  if (y >= e[e.length - 1].min) return 5;
  for (let i = e.length - 2; i >= 0; i--) if (y >= e[i].min) return Math.round((e[i].band + (y - e[i].min) / (e[i + 1].min - e[i].min)) * 10) / 10;
  return 1;
}
const yuzde = (a, b) => (b > 0 ? Math.round(a / b * 100) : null);

/** Son n İstanbul günü (eskiden yeniye) "YYYY-MM-DD" listesi */
function gunListesi(simdiMs, n) {
  const bugun = zaman.gun(simdiMs), out = [];
  for (let i = n - 1; i >= 0; i--) out.push(zaman.gunEkle(bugun, -i));
  return out;
}
/** Son n ISO haftası (eskiden yeniye): [{ hafta, pazartesi, bas, bit }] */
function haftaListesi(simdiMs, n) {
  const out = [];
  let h = zaman.hafta(simdiMs);
  for (let i = 0; i < n; i++) { const a = zaman.haftaAraligi(h); out.unshift({ hafta: h, pazartesi: a.pazartesi, bas: a.bas, bit: a.bit }); h = zaman.oncekiHafta(h); }
  return out;
}

/** Haftalık etkinlik (veli paneli de kullanır): [{ hafta, pazartesi, soru, dogru, deneme, xp }] */
function haftalik(db, uid, simdiMs, n) {
  const hl = haftaListesi(simdiMs, n || 8), bas = hl[0].bas, son = new Date(simdiMs).toISOString();
  const idx = {}; hl.forEach((h, i) => { idx[h.hafta] = i; h.soru = 0; h.dogru = 0; h.deneme = 0; });
  db.prepare("SELECT zaman, dogru FROM answers WHERE user_id = ? AND zaman >= ? AND zaman <= ?").all(uid, bas, son).forEach(a => {
    const t = Date.parse(a.zaman); if (isNaN(t)) return;
    const i = idx[zaman.hafta(t)]; if (i === undefined) return;
    hl[i].soru++; if (a.dogru) hl[i].dogru++;
  });
  db.prepare("SELECT tarih FROM exams WHERE user_id = ? AND tarih >= ? AND tarih <= ?").all(uid, bas, son).forEach(e => {
    const t = Date.parse(e.tarih); if (isNaN(t)) return;
    const i = idx[zaman.hafta(t)]; if (i !== undefined) hl[i].deneme++;
  });
  return hl.map(h => ({ hafta: h.hafta, pazartesi: h.pazartesi, soru: h.soru, dogru: h.dogru, deneme: h.deneme,
    xp: h.soru * XP.soru + h.dogru * XP.dogru + h.deneme * XP.deneme }));
}

/** Tahmini AP puanı geçmişi (eskiden yeniye): ders denemeleri ve tam sınavlar. [{ tarih, kod, ders, ad, tur, yuzde, puan }] */
function puanGecmisi(db, uid, n) {
  return db.prepare(`SELECT istemci_id, kod, ad, tarih, yuzde, tahmini_band FROM exams
      WHERE user_id = ? AND tahmini_band IS NOT NULL AND tarih IS NOT NULL ORDER BY tarih DESC LIMIT ?`).all(uid, n || 60)
    .map(e => ({ tarih: e.tarih, kod: e.kod, ders: DENEME_DERS[e.kod] || null, ad: e.ad || e.kod, tur: /^ts-/.test(String(e.istemci_id || "")) ? "tam" : "deneme",
      yuzde: e.yuzde == null ? null : Math.round(e.yuzde), puan: puanOku(e.tahmini_band) }))
    .filter(e => e.puan !== null && !isNaN(Date.parse(e.tarih)))
    .reverse();
}

/** Seçilen dersler; seçim yoksa çalışılmış ders sayfaları (veli paneliyle aynı kural) */
function dersListesi(db, uid, profil) {
  let d = AP.secilenler(profil);
  if (d.length) return d;
  const sayfalar = db.prepare("SELECT DISTINCT sayfa FROM answers WHERE user_id = ?").all(uid).map(r => r.sayfa);
  return AP.DERSLER.filter(x => sayfalar.indexOf(x.sayfa) >= 0 && !x.kutu && x.ders !== "calculus-bc")
    .map(x => ({ ders: x.ders, hedef: null, ad: x.ad, kisa: x.kisa || x.ad, sayfa: x.sayfa, kutu: null, deneme: x.deneme }));
}

/** Ders başına ünite ustalığı (doğruluk + kapsam), tahmini puan ve en zayıf 3 ünite */
function dersOzeti(db, uid, x) {
  const re = x.kutu ? new RegExp(x.kutu) : null;
  const uygun = k => !re || re.test(k || "");
  const banka = db.prepare(`SELECT kutu, MIN(unite_no) AS no, MIN(kutu_baslik) AS baslik, COUNT(*) AS n FROM questions_bank
      WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ? AND kutu IS NOT NULL GROUP BY kutu`).all(x.sayfa).filter(r => uygun(r.kutu));
  const cev = db.prepare("SELECT unite, unite_baslik, soru, dogru FROM answers WHERE user_id = ? AND sayfa = ?").all(uid, x.sayfa).filter(a => uygun(a.unite));
  const un = {};
  banka.forEach(b => { un[b.kutu] = { kutu: b.kutu, no: b.no, ad: b.baslik || b.kutu, bankada: b.n, cevap: 0, dogru: 0, sorular: new Set() }; });
  cev.forEach(a => {
    const u = un[a.unite] || (un[a.unite] = { kutu: a.unite, no: null, ad: a.unite_baslik || a.unite, bankada: 0, cevap: 0, dogru: 0, sorular: new Set() });
    u.cevap++; if (a.dogru) u.dogru++; u.sorular.add(a.soru);
  });
  const temel = ADRES.sayfaAdres(x.sayfa) || "/" + x.sayfa;
  const uniteler = Object.keys(un).map(k => un[k]).map(u => ({
    kutu: u.kutu, no: u.no, ad: String(u.ad).replace(/\s+/g, " ").trim(), bankada: u.bankada, cevap: u.cevap, dogru: u.dogru,
    cozulen: u.sorular.size, dogruluk: yuzde(u.dogru, u.cevap), kapsam: u.bankada ? Math.min(100, Math.round(u.sorular.size / u.bankada * 100)) : null,
    link: u.no != null ? temel + "?unite=" + u.no : temel + "#" + encodeURIComponent(u.kutu), zayif: false
  })).sort((a, b) => (a.no == null ? 1e9 : a.no) - (b.no == null ? 1e9 : b.no) || a.kutu.localeCompare(b.kutu));
  uniteler.filter(u => u.cevap >= ZAYIF_ESIK).sort((a, b) => a.dogruluk - b.dogruluk || b.cevap - a.cevap).slice(0, 3)
    .forEach(u => { if (u.dogruluk < 75) u.zayif = true; });
  const top = cev.length, dogru = cev.reduce((s, a) => s + (a.dogru ? 1 : 0), 0), dg = yuzde(dogru, top);
  const bankaTop = banka.reduce((s, b) => s + b.n, 0), cozulen = new Set(cev.map(a => a.soru)).size;
  const sd = db.prepare("SELECT tahmini_band, tarih FROM exams WHERE user_id = ? AND kod = ? AND tahmini_band IS NOT NULL ORDER BY tarih DESC LIMIT 1").get(uid, x.deneme);
  const denemePuan = sd ? puanOku(sd.tahmini_band) : null;
  const tahmini = denemePuan !== null ? denemePuan : top >= 10 ? AP.tahminiPuan(dg) : null;
  return { ders: x.ders, ad: "AP " + x.ad, kisa: x.kisa || x.ad, sayfa: x.sayfa, link: temel, hedef: x.hedef || null, cevap: top, dogru, dogruluk: dg,
    cozulen, bankada: bankaTop, kapsam: bankaTop ? Math.min(100, Math.round(cozulen / bankaTop * 100)) : null,
    tahmini, tahminiInce: denemePuan !== null ? denemePuan : tahmini !== null ? Math.min(inceTahmin(dg), tahmini + 0.9) : null, tahminKaynagi: denemePuan !== null ? "deneme" : tahmini !== null ? "sorular" : null, uniteler };
}

/** Öğrencinin tüm grafik verisi (salt okunur). */
function ozet(db, uid, profil, simdiMs, calismaDurumu) {
  const gl = gunListesi(simdiMs, GUN_SAYISI), bas = new Date(zaman.gunBaslangic(gl[0])).toISOString(), son = new Date(simdiMs).toISOString();
  const gi = {}; const gunler = gl.map((g, i) => { gi[g] = i; return { gun: g, cevap: 0, dogru: 0, deneme: 0 }; });
  db.prepare("SELECT zaman, dogru FROM answers WHERE user_id = ? AND zaman >= ? AND zaman <= ?").all(uid, bas, son).forEach(a => {
    const t = Date.parse(a.zaman); if (isNaN(t)) return; const i = gi[zaman.gun(t)]; if (i === undefined) return;
    gunler[i].cevap++; if (a.dogru) gunler[i].dogru++;
  });
  db.prepare("SELECT tarih FROM exams WHERE user_id = ? AND tarih >= ? AND tarih <= ?").all(uid, bas, son).forEach(e => {
    const t = Date.parse(e.tarih); if (isNaN(t)) return; const i = gi[zaman.gun(t)]; if (i !== undefined) gunler[i].deneme++;
  });
  // Seri: zamanlayıcının kuralı (dondurulmuş günler dahil) varsa o; yoksa bugünden/dünden geriye ardışık aktif gün
  let seri = 0;
  if (calismaDurumu) { const d = calismaDurumu(uid, simdiMs); seri = d.seri + (d.bugunAktif ? 1 : 0); }
  else {
    let i = gunler.length - 1;
    if (!(gunler[i].cevap || gunler[i].deneme)) i--;
    while (i >= 0 && (gunler[i].cevap || gunler[i].deneme)) { seri++; i--; }
  }
  let enUzun = 0, k = 0;
  gunler.forEach(g => { k = g.cevap || g.deneme ? k + 1 : 0; if (k > enUzun) enUzun = k; });
  const toplam = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(dogru), 0) AS d FROM answers WHERE user_id = ?").get(uid);
  const acik = db.prepare("SELECT COUNT(*) AS n FROM wrong_answers WHERE user_id = ? AND cozuldu IS NULL").get(uid).n;
  const denemeSay = db.prepare("SELECT COUNT(*) AS n FROM exams WHERE user_id = ?").get(uid).n;
  const frq = db.prepare(`SELECT frq_id, ders, toplam, toplam_puan, COALESCE(puanlama, created) AS tarih FROM frq_denemeleri
      WHERE user_id = ? AND toplam IS NOT NULL ORDER BY COALESCE(puanlama, created) DESC LIMIT 60`).all(uid)
    .map(f => ({ tarih: f.tarih, frq: f.frq_id, ders: f.ders, puan: f.toplam, toplamPuan: f.toplam_puan, yuzde: yuzde(f.toplam, f.toplam_puan) })).reverse();
  return {
    simdi: son, bugun: gl[gl.length - 1],
    toplam: { cevap: toplam.n, dogru: toplam.d, dogruluk: yuzde(toplam.d, toplam.n), acikYanlis: acik, deneme: denemeSay },
    seri: { simdi: seri, enUzun },
    gunler,
    haftalar: haftalik(db, uid, simdiMs, HAFTA_SAYISI),
    dersler: dersListesi(db, uid, profil).map(x => dersOzeti(db, uid, x)),
    puanGecmisi: puanGecmisi(db, uid, 60),
    frq
  };
}

/** Rota kaydı: GET /api/ilerleme/ozet (yalnız oturum sahibi kendi verisini görür; önbelleğe alınmaz) */
function ilerlemeRotalari(r, c) {
  const { db, hesap, oturumGerekli } = c;
  const saat = c.saat || Date.now;
  r.get("/api/ilerleme/ozet", (req, res) => {
    oturumGerekli(req);
    res.setHeader("Cache-Control", "private, no-store");
    const uid = req.kullanici.id;
    return Object.assign({ ok: true }, ozet(db, uid, hesap.profilAl(uid) || {}, saat(), c.calismaDurumu || null));
  });
}

module.exports = { ilerlemeRotalari, ozet, haftalik, puanGecmisi, dersOzeti, puanOku, inceTahmin, gunListesi, haftaListesi, XP, GUN_SAYISI, HAFTA_SAYISI };
