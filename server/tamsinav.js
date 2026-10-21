"use strict";
// v1.12.0 Tam deneme sınavı simülasyonu (Bluebook benzeri). Bkz. server/API.md "Tam deneme sınavı".
// - Plan: server/tohum/sinav-formatlari.json (bölümler, süreler, hesap makinesi kuralı, CED ünite ağırlıkları, TAHMİNİ eşikler).
// - Kurulum: yalnız AKTİF sorular (taslak/arşiv asla); MCQ bölümleri ünite ağırlığına göre (en büyük kalan yöntemi), hesap makinesi
//   yasak kısımlara yalnız ek.hesapMakinesi = "gerekmez" sorular; öğrencinin son 60 günde cevapladığı ya da önceki tam sınavlarda
//   gördüğü sorular mümkünse kullanılmaz. Bölüm II aktif FRQ'lardan (frq tablosu); yetmezse kısaltılır (süre orantılı), hiç yoksa
//   sınav yalnız Bölüm I'dir (yalnizMcq).
// - Süre SUNUCUDA: bölüm başlatılınca açılış/bitiş sunucu saatiyle yazılır; bitiş + tolerans sonrası gelen cevap 409 ile reddedilir,
//   süresi dolan bölüm ilk istekte kendiliğinden kapanır. Doğru cevaplar sınav bitene kadar hiçbir yanıtta yoktur; FRQ rubriği
//   yalnız o FRQ kısmı kapanınca gelir (frq_denemeleri satırı açılır; öz puanlama mevcut POST /api/frq/:id/puanla ile).
// - Erişim: yalnız Premium (ve yönetici). Ücretsiz planda kilitli kart (402 { premiumGerekli: true, neden: "tam-sinav" }).
// - Bitince sonuç deneme geçmişine (apmeberra:deneme:v1 → exams) mod: "tam" ile yazılır: XP, veli paneli ve Yanlışlarım tekrarı çalışır.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const { acikSoru, cozumOf, satirCoz } = require("./sorubankasi");
const frqM = require("./frq");

const PLAN_DOSYA = path.join(__dirname, "tohum", "sinav-formatlari.json");
const DENEME_META = path.join(__dirname, "tohum", "deneme-meta.json");
const DENEME_KEY = "apmeberra:deneme:v1";
const TOLERANS_MS = 15000;        // ağ gecikmesi payı: bitişten sonra 15 sn içinde gelen cevap kabul edilir
const YAKIN_GUN = 60;             // son 60 günde cevaplanan sorular "yakın" sayılır
const HM = ["yasak", "gerekli", "serbest", "yok"];

function jsonCoz(v, d) { if (v == null) return d; try { return JSON.parse(v); } catch (e) { return d; } }
const kirp = s => String(s == null ? "" : s).trim();

// --- plan dosyası ----------------------------------------------------------------------------------
let onbellek = null;
function planlar(dosya) {
  if (dosya) return JSON.parse(fs.readFileSync(dosya, "utf8"));
  if (!onbellek) onbellek = JSON.parse(fs.readFileSync(PLAN_DOSYA, "utf8"));
  return onbellek;
}
let metaOnbellek = null;
function denemeMeta() {
  if (!metaOnbellek) metaOnbellek = fs.existsSync(DENEME_META) ? JSON.parse(fs.readFileSync(DENEME_META, "utf8")) : { kodlar: {}, pasajlar: {} };
  return metaOnbellek;
}

/** Plan dosyası yapı denetimi (test + araclar/pm-denetim.js). Dönüş: sorun metinleri (boş = geçerli). */
function dogrula(dosyaIcerigi) {
  const s = [], t = dosyaIcerigi || planlar();
  if (!t || typeof t !== "object" || !t.sinavlar) return ["sinavlar alanı yok"];
  Object.keys(t.sinavlar).forEach(kod => {
    const p = t.sinavlar[kod], e = m => s.push(kod + ": " + m);
    if (!kirp(p.ad)) e("ad boş");
    if (!kirp(p.denemeKodu)) e("denemeKodu boş");
    if (!/^https:\/\/apcentral\.collegeboard\.org\//.test(String(p.kaynak || ""))) e("kaynak AP Central adresi olmalı");
    if (!Array.isArray(p.frqDersleri) || !p.frqDersleri.length || p.frqDersleri.some(d => !frqM.DERSLER[d])) e("frqDersleri bilinmeyen ders içeriyor");
    if (p.referans && !/^https:\/\/apcentral\.collegeboard\.org\/media\/pdf\//.test(String(p.referans.url || ""))) e("referans resmî College Board PDF'i olmalı");
    if (!Array.isArray(p.bolumler) || !p.bolumler.length) { e("bolumler boş"); return; }
    const kodlar = new Set();
    p.bolumler.forEach((b, i) => {
      if (!b.kod || kodlar.has(b.kod)) e("bölüm " + i + " kodu boş/yinelenen"); kodlar.add(b.kod);
      if (["mcq", "frq"].indexOf(b.tur) < 0) e(b.kod + " tur mcq|frq olmalı");
      if (!Number.isInteger(b.soru) || b.soru < 1) e(b.kod + " soru ≥ 1 tam sayı olmalı");
      if (!(b.dk > 0) || b.dk > 240) e(b.kod + " dk 1–240 olmalı");
      if (HM.indexOf(b.hesapMakinesi) < 0) e(b.kod + " hesapMakinesi " + HM.join("|") + " olmalı");
      if (!p.agirlik || !(p.agirlik[b.bolum] > 0)) e(b.kod + " bölüm ağırlığı yok: " + b.bolum);
    });
    if (!p.bolumler.some(b => b.tur === "mcq")) e("MCQ bölümü yok");
    const ag = Object.keys(p.agirlik || {}).reduce((a, k) => a + Number(p.agirlik[k] || 0), 0);
    if (Math.abs(ag - 100) > 0.5) e("bölüm ağırlıkları toplamı " + ag + " ≠ 100");
    const ua = p.uniteAgirlik || {};
    if (!Object.keys(ua).length || Object.keys(ua).some(k => !(ua[k] > 0))) e("uniteAgirlik boş ya da pozitif değil");
    const es = p.esikler || [];
    if (es.map(x => x.puan).join(",") !== "5,4,3,2") e("esikler 5,4,3,2 sırasında olmalı");
    for (let i = 1; i < es.length; i++) if (!(es[i].min < es[i - 1].min)) e("esikler azalan olmalı");
    if (es.some(x => !(x.min > 0 && x.min < 100))) e("eşik 0–100 arasında olmalı");
  });
  return s;
}

// --- saf hesaplar ----------------------------------------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function karistir(arr, rng) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }

/** Hesap makinesi düzeyi: "gerekmez" | "yardımcı" | "gerekli" | "" (eski serbest değerler eşlenir) */
function hmDuzey(ek) {
  const e = ek || {};
  const v = e.hesapMakinesiDurum || (typeof e.hesapMakinesi === "string" ? e.hesapMakinesi : e.hesapMakinesi === true ? "gerekli" : "");
  const s = String(v).toLocaleLowerCase("tr-TR");
  if (/gerekmez|gereksiz|yok/.test(s)) return "gerekmez";
  if (/gerekli|gerekir|şart/.test(s)) return "gerekli";
  if (/yardım|basit|faydal/.test(s)) return "yardımcı";
  return "";
}

/** Ünite kotaları (en büyük kalan; kapasiteyi aşan pay kalan ünitelere oranla dağılır). Dönüş: { kota: {ünite: n}, eksik } */
function kotalar(n, agirlik, mevcut) {
  const kota = {};
  Object.keys(mevcut).forEach(u => { kota[u] = 0; });
  let kalan = n, aktif = Object.keys(mevcut).filter(u => Number(agirlik[u]) > 0 && mevcut[u] > 0).sort();
  while (kalan > 0 && aktif.length) {
    const top = aktif.reduce((a, u) => a + Number(agirlik[u]), 0);
    const ham = aktif.map(u => ({ u, x: kalan * Number(agirlik[u]) / top }));
    const ek = {};
    let verilen = 0;
    ham.forEach(h => { ek[h.u] = Math.floor(h.x); verilen += ek[h.u]; });
    ham.slice().sort((a, b) => (b.x - Math.floor(b.x)) - (a.x - Math.floor(a.x)) || (a.u < b.u ? -1 : 1)).slice(0, kalan - verilen).forEach(h => { ek[h.u]++; });
    let atandi = 0;
    aktif.forEach(u => { const al = Math.min(ek[u], mevcut[u] - kota[u]); kota[u] += al; atandi += al; });
    kalan -= atandi;
    aktif = aktif.filter(u => kota[u] < mevcut[u]);
    if (!atandi) break;
  }
  return { kota, eksik: kalan };
}

/** Bir MCQ kısmı için seçim. adaylar: [{k, unite, taze, hm, pasaj, number}] (önceden karıştırılmış). */
function kisimSec(adaylar, n, agirlik, oncelik) {
  const puan = x => (oncelik ? oncelik(x) : 0) * 2 + (x.taze ? 1 : 0);
  const sirali = adaylar.map((x, i) => ({ x, i })).sort((a, b) => puan(b.x) - puan(a.x) || a.i - b.i).map(o => o.x);
  const by = {};
  sirali.forEach(x => { (by[x.unite] = by[x.unite] || []).push(x); });
  const mevcut = {};
  Object.keys(by).forEach(u => { mevcut[u] = by[u].length; });
  const { kota } = kotalar(n, agirlik, mevcut);
  const secilen = [], al = new Set();
  Object.keys(kota).forEach(u => by[u].slice(0, kota[u]).forEach(x => { secilen.push(x); al.add(x.k); }));
  for (const x of sirali) { if (secilen.length >= n) break; if (!al.has(x.k)) { secilen.push(x); al.add(x.k); } }
  return secilen.slice(0, n);
}
/** Sınav sırası: karışık, pasaj soruları yan yana (pasaj içinde numara sırası) */
function sinavSirasi(list, rng) {
  karistir(list, rng);
  const ilk = {};
  list.forEach((q, i) => { const g = q.pasaj || ("_" + i); if (!(g in ilk)) ilk[g] = i; });
  return list.map((q, i) => ({ q, g: ilk[q.pasaj || ("_" + i)], n: q.pasaj ? (q.number || 0) : 0 })).sort((a, b) => a.g - b.g || a.n - b.n).map(x => x.q);
}
const KURULUM_SIRASI = { gerekli: 0, yasak: 1, serbest: 2, yok: 2 };

/**
 * Plan kur (saf). p: plan dosyasındaki sınav; mcqHavuz: [{k, unite, hm, taze, pasaj, number}]; frqHavuz: [{id, ders, hesapMakinesi, taze}].
 * Dönüş: { bolumler: [{kod, bolum, ad, tur, hesapMakinesi, hedefSoru, sureSn, sorular|frq, kisaltilmis}], yetersiz: [mesaj], yalnizMcq }
 */
function planKur(p, mcqHavuz, frqHavuz, rng) {
  const kullanilan = new Set(), out = p.bolumler.map(b => null), yetersiz = [];
  const sira = p.bolumler.map((b, i) => ({ b, i })).sort((a, c) => KURULUM_SIRASI[a.b.hesapMakinesi] - KURULUM_SIRASI[c.b.hesapMakinesi] || a.i - c.i);
  const mcq = karistir(mcqHavuz.slice(), rng), frq = karistir(frqHavuz.slice(), rng);
  sira.forEach(({ b, i }) => {
    const temel = { kod: b.kod, bolum: b.bolum, ad: b.ad, tur: b.tur, hesapMakinesi: b.hesapMakinesi, hedefSoru: b.soru, okumaDk: b.okumaDk || 0 };
    if (b.tur === "mcq") {
      const ad = mcq.filter(x => !kullanilan.has(x.k) && (b.hesapMakinesi !== "yasak" || x.hm === "gerekmez" || x.hm === ""));
      const oncelik = b.hesapMakinesi === "gerekli" ? (x => (x.hm === "gerekli" || x.hm === "yardımcı") ? 1 : 0) : null;
      const sec = kisimSec(ad, b.soru, p.uniteAgirlik || {}, oncelik);
      sec.forEach(x => kullanilan.add(x.k));
      if (sec.length < b.soru) yetersiz.push(b.ad + ": " + sec.length + " / " + b.soru + " uygun aktif soru");
      out[i] = Object.assign(temel, { sureSn: Math.round(b.dk * 60), sorular: sinavSirasi(sec, rng).map(x => x.k), kisaltilmis: false });
    } else {
      const derece = d => { const j = (p.frqDersleri || []).indexOf(d); return j < 0 ? 99 : j; };
      const ad = frq.filter(f => !kullanilan.has("frq:" + f.id) && (b.hesapMakinesi === "gerekli" ? f.hesapMakinesi === true : b.hesapMakinesi === "yasak" ? f.hesapMakinesi === false : true))
        .map((f, j) => ({ f, j })).sort((a, c) => derece(a.f.ders) - derece(c.f.ders) || (c.f.taze ? 1 : 0) - (a.f.taze ? 1 : 0) || a.j - c.j).map(o => o.f);
      const sec = ad.slice(0, b.soru);
      sec.forEach(f => kullanilan.add("frq:" + f.id));
      if (!sec.length) { out[i] = null; return; }
      const oran = sec.length / b.soru;
      out[i] = Object.assign(temel, { hedefSoru: b.soru, sureSn: Math.round(b.dk * 60 * oran), frq: sec.map(f => f.id), kisaltilmis: sec.length < b.soru });
    }
  });
  const bolumler = out.filter(Boolean);
  return { bolumler, yetersiz, yalnizMcq: !bolumler.some(b => b.tur === "frq") };
}

/** Bileşik puan (0–100) ve tahmini AP puanı. mcqYuzde/frqYuzde 0–100; frqYuzde null → yalnız Bölüm I. */
function kompozit(p, mcqYuzde, frqYuzde) {
  const wI = Number(p.agirlik.I) || 0, wII = Number(p.agirlik.II) || 0;
  let deger, katki;
  if (frqYuzde == null) { deger = mcqYuzde; katki = { I: Math.round(mcqYuzde * 10) / 10, II: null }; }
  else {
    const top = wI + wII;
    katki = { I: Math.round(wI * mcqYuzde / top * 10) / 10, II: Math.round(wII * frqYuzde / top * 10) / 10 };
    deger = (wI * mcqYuzde + wII * frqYuzde) / top;
  }
  deger = Math.round(deger * 10) / 10;
  return { kompozit: deger, katki, tahminiPuan: apPuan(p.esikler, deger) };
}
function apPuan(esikler, yuzde) { for (const e of esikler || []) if (yuzde >= e.min) return e.puan; return 1; }

/** Test hızı: yalnız NODE_ENV=test ya da MEBERRA_TEST_ROTALARI=1 iken TAM_SINAV_HIZ okunur (ör. 60 → 62 dk = 62 sn). */
function hizOku(secenek) {
  if (Number(secenek) > 0) return Math.min(3600, Number(secenek));
  const test = process.env.NODE_ENV === "test" || process.env.MEBERRA_TEST_ROTALARI === "1";
  const h = Number(process.env.TAM_SINAV_HIZ);
  return test && h > 0 ? Math.min(3600, h) : 1;
}

// --- rotalar ---------------------------------------------------------------------------------------
/** bag: { db, hesap, veri, denetim, oturumGerekli, hiz?, saat?, planDosyasi?, olusturSiniri?, cevapSiniri? } */
function tamSinavRotalari(r, bag) {
  const { db, hesap, veri, denetim, oturumGerekli } = bag;
  const saat = typeof bag.saat === "function" ? bag.saat : () => Date.now();
  const hiz = hizOku(bag.hiz);
  const P = () => planlar(bag.planDosyasi).sinavlar;
  const sinir = { olustur: hizSinirlayici(bag.olusturSiniri || 12, 60 * 60e3), cevap: hizSinirlayici(bag.cevapSiniri || 3000, 10 * 60e3) };
  const q = {
    havuz: db.prepare("SELECT id, sayfa, unite, pasaj, numara, kutu, deneme_kodlari, ek FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND deneme_kodlari != '[]' ORDER BY rowid"),
    tek: db.prepare("SELECT * FROM questions_bank WHERE id = ?"),
    yakin: db.prepare("SELECT DISTINCT sayfa || '.html|' || soru AS k FROM answers WHERE user_id = ? AND zaman >= ?"),
    frqAktif: db.prepare("SELECT * FROM frq WHERE durum = 'aktif' ORDER BY id"),
    frqTek: db.prepare("SELECT * FROM frq WHERE id = ?"),
    frqYapilan: db.prepare("SELECT DISTINCT frq_id FROM frq_denemeleri WHERE user_id = ?"),
    frqEkle: db.prepare("INSERT INTO frq_denemeleri (user_id, frq_id, ders, frq_surum, cevaplar, toplam_puan, sure_sn, ucretsiz_hak, created) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)"),
    frqDeneme: db.prepare("SELECT id, frq_id, puanlar, toplam, toplam_puan, cevaplar FROM frq_denemeleri WHERE id = ? AND user_id = ?"),
    ekle: db.prepare("INSERT INTO tam_sinavlar (id, user_id, kod, durum, plan, veri, olusturma) VALUES (?, ?, ?, 'devam', ?, ?, ?)"),
    oturum: db.prepare("SELECT * FROM tam_sinavlar WHERE id = ? AND user_id = ?"),
    aktif: db.prepare("SELECT id, kod FROM tam_sinavlar WHERE user_id = ? AND durum = 'devam' ORDER BY olusturma DESC LIMIT 1"),
    oncekiPlanlar: db.prepare("SELECT plan FROM tam_sinavlar WHERE user_id = ? ORDER BY olusturma DESC LIMIT 20"),
    yaz: db.prepare("UPDATE tam_sinavlar SET veri = ?, durum = ?, sonuc = ?, bitis = ? WHERE id = ?"),
    gecmis: db.prepare("SELECT id, kod, sonuc, bitis FROM tam_sinavlar WHERE user_id = ? AND durum = 'bitti' ORDER BY bitis DESC LIMIT ?")
  };
  const ozel = res => res.setHeader("Cache-Control", "private, no-store");
  const premiumMu = req => !!req.kullanici && (req.kullanici.rol === "yonetici" || hesap.uyelik(req.kullanici.id).premium);

  function mcqHavuzu(p, yakin) {
    return q.havuz.all().filter(x => jsonCoz(x.deneme_kodlari, []).indexOf(p.denemeKodu) >= 0 && (!p.uniteOnek || String(x.unite || "").indexOf(p.uniteOnek) === 0))
      .map(x => { const k = x.sayfa + ".html|" + x.id; return { k, unite: String(x.unite), hm: hmDuzey(jsonCoz(x.ek, {})), pasaj: x.pasaj || null, number: x.numara, taze: !(yakin && yakin.has(k)) }; });
  }
  function frqHavuzu(p, yapilan) {
    return q.frqAktif.all().filter(x => p.frqDersleri.indexOf(x.ders) >= 0)
      .map(x => { const v = jsonCoz(x.veri, {}); return { id: x.id, ders: x.ders, hesapMakinesi: !!v.hesapMakinesi, taze: !(yapilan && yapilan.has(x.id)) }; });
  }
  /** Katalog satırı: planı sabit tohumla deneyerek hazır olup olmadığını bulur */
  function katalogSatiri(kod, p) {
    const k = planKur(p, mcqHavuzu(p, null), frqHavuzu(p, null), mulberry32(1));
    const mcqHedef = p.bolumler.filter(b => b.tur === "mcq").reduce((a, b) => a + b.soru, 0);
    const frqHedef = p.bolumler.filter(b => b.tur === "frq").reduce((a, b) => a + b.soru, 0);
    const frqVar = k.bolumler.filter(b => b.tur === "frq").reduce((a, b) => a + b.frq.length, 0);
    return { kod, ad: p.ad, kaynak: p.kaynak, referans: p.referans || null, hesapMakinesi: p.hesapMakinesi || null, agirlik: p.agirlik, esikler: p.esikler, frqNot: p.frqNot || null,
      bolumler: p.bolumler.map(b => ({ kod: b.kod, bolum: b.bolum, ad: b.ad, tur: b.tur, soru: b.soru, dk: b.dk, okumaDk: b.okumaDk || 0, hesapMakinesi: b.hesapMakinesi })),
      hazir: !k.yetersiz.length, yetersiz: k.yetersiz, mcqHedef, mcqHavuz: mcqHavuzu(p, null).length,
      frqHedef, frqVar, frqDurumu: frqVar === 0 ? "yok" : frqVar < frqHedef ? "kisaltilmis" : "tam",
      toplamDk: Math.round(k.bolumler.reduce((a, b) => a + b.sureSn, 0) / 60) };
  }

  function oku(uid, id) {
    const o = q.oturum.get(String(id || ""), uid);
    if (!o) throw new HttpHata(404, "Tam sınav bulunamadı.");
    return Object.assign({}, o, { plan: jsonCoz(o.plan, {}), veri: jsonCoz(o.veri, {}), sonuc: jsonCoz(o.sonuc, null) });
  }
  function kaydet(o) { q.yaz.run(JSON.stringify(o.veri), o.durum, o.sonuc ? JSON.stringify(o.sonuc) : null, o.bitis || null, o.id); }

  /** FRQ kısmı kapanınca frq_denemeleri satırları açılır (öz puanlama mevcut FRQ API'siyle) */
  function frqSatirlari(o, bi) {
    const b = o.plan.bolumler[bi], v = o.veri, bd = v.bolumler[bi];
    if (b.tur !== "frq") return;
    v.frqDeneme = v.frqDeneme || {};
    if (v.frqDeneme[bi]) return;
    const sure = bd.acilis ? Math.round(Math.max(0, (bd.kapanis - bd.acilis) / 1000 * o.plan.hiz) / b.frq.length) : 0;
    v.frqDeneme[bi] = {};
    b.frq.forEach((fid, i) => {
      const r0 = q.frqTek.get(fid);
      if (!r0) return;
      const f = jsonCoz(r0.veri, {}), gelen = ((v.frq || {})[bi] || {})[i] || {}, cevaplar = {};
      (f.parcalar || []).forEach(pc => { cevaplar[pc.harf] = String(gelen[pc.harf] == null ? "" : gelen[pc.harf]).slice(0, 20000); });
      v.frqDeneme[bi][i] = Number(q.frqEkle.run(o.user_id, fid, r0.ders, r0.surum, JSON.stringify(cevaplar), r0.toplam_puan, sure, simdi()).lastInsertRowid);
    });
  }
  function kapat(o, bi, zaman, otomatik) {
    const bd = o.veri.bolumler[bi];
    if (!bd || !bd.acilis || bd.kapanis) return false;
    bd.kapanis = Math.min(zaman, bd.bitis);
    bd.otomatik = !!otomatik;
    frqSatirlari(o, bi);
    return true;
  }
  /** Süresi dolan açık bölümü kapatır (bitiş + tolerans geçtiyse). Dönüş: değişti mi */
  function durumGuncelle(o, now) {
    if (o.durum !== "devam") return false;
    let d = false;
    o.veri.bolumler.forEach((bd, i) => { if (bd.acilis && !bd.kapanis && now > bd.bitis + TOLERANS_MS) d = kapat(o, i, now, true) || d; });
    return d;
  }
  const acikBolum = o => o.veri.bolumler.findIndex(bd => bd.acilis && !bd.kapanis);

  function icerik(keys) {
    const meta = denemeMeta(), out = {}, pasajlar = {};
    keys.forEach(k => {
      const row = satirCoz(q.tek.get(String(k).split("|")[1]));
      if (!row) return;
      out[k] = Object.assign(acikSoru(row), { sayfa: row.sayfa + ".html", unite: row.unite, kap: row.kutu, kapBaslik: row.kutu_baslik, pasaj: row.pasaj || null });
      if (row.pasaj && meta.pasajlar && meta.pasajlar[row.pasaj]) pasajlar[row.pasaj] = meta.pasajlar[row.pasaj];
    });
    return { sorular: out, pasajlar };
  }
  function frqAcik(fid) {
    const r0 = q.frqTek.get(fid);
    if (!r0) return null;
    const f = jsonCoz(r0.veri, {}), d = frqM.DERSLER[f.ders] || {};
    return { id: f.id, ders: f.ders, dersAd: d.ad || f.ders, kisa: d.kisa || null, baslik: f.baslik, tur: f.tur, giris: f.giris, hesapMakinesi: !!f.hesapMakinesi, toplam_puan: f.toplam_puan,
      parcalar: (f.parcalar || []).map(p => ({ harf: p.harf, soru: p.soru, puan: p.puan })) };
  }
  function frqTam(fid) {
    const a = frqAcik(fid);
    if (!a) return null;
    const f = jsonCoz(q.frqTek.get(fid).veri, {});
    a.parcalar = (f.parcalar || []).map(p => ({ harf: p.harf, soru: p.soru, puan: p.puan, ornek_cozum: p.ornek_cozum, sik_hatalar: p.sik_hatalar || [],
      rubrik: (p.rubrik || []).map(rb => { const o = { puan: rb.puan, olcut: rb.olcut }; if (rb.ornek_cevap) o.ornek_cevap = rb.ornek_cevap; return o; }) }));
    return a;
  }

  /** İstemciye durum. Doğru cevap YOK. İçerik yalnız açık bölüm için; rubrik yalnız kapanmış FRQ kısmı için. */
  function yanit(o, now) {
    const v = o.veri, ai = acikBolum(o);
    const bolumler = o.plan.bolumler.map((b, i) => {
      const bd = v.bolumler[i];
      return { kod: b.kod, bolum: b.bolum, ad: b.ad, tur: b.tur, hesapMakinesi: b.hesapMakinesi, soru: b.tur === "mcq" ? b.sorular.length : b.frq.length, hedefSoru: b.hedefSoru,
        sureSn: b.sureSn, okumaDk: b.okumaDk || 0, kisaltilmis: !!b.kisaltilmis, acilis: bd.acilis, bitis: bd.bitis, kapanis: bd.kapanis, otomatik: !!bd.otomatik,
        durum: bd.kapanis ? "kapandi" : bd.acilis ? "acik" : "bekliyor", kalanMs: bd.acilis && !bd.kapanis ? Math.max(0, bd.bitis - now) : null };
    });
    const out = { ok: true, sunucuZamani: now, sinav: { id: o.id, kod: o.kod, ad: o.plan.ad, durum: o.durum, hiz: o.plan.hiz, uyariMs: Math.round(300000 / o.plan.hiz),
      yalnizMcq: !!o.plan.yalnizMcq, agirlik: o.plan.agirlik, esikler: o.plan.esikler, referans: o.plan.referans || null, hesapMakinesi: o.plan.hesapMakinesiBilgi || null,
      bolumler, aktifBolum: ai, olusturma: o.olusturma } };
    out.cevaplar = v.cevaplar || {}; out.isaret = v.isaret || {}; out.eleme = v.eleme || {}; out.sureler = v.sure || {}; out.frqCevap = v.frq || {};
    if (o.durum === "devam" && ai >= 0) {
      const b = o.plan.bolumler[ai];
      if (b.tur === "mcq") { const ic = icerik(b.sorular); out.icerik = { bolum: ai, sorular: b.sorular.map(k => ic.sorular[k] ? Object.assign({ k }, ic.sorular[k]) : { k, question: "", options: [] }), pasajlar: ic.pasajlar }; }
      else out.icerik = { bolum: ai, frq: b.frq.map(frqAcik) };
    }
    // Kapanmış FRQ kısımları: rubrik + deneme kimlikleri + kaydedilmiş öz puanlar (öz puanlama ekranı)
    const rub = [];
    o.plan.bolumler.forEach((b, i) => {
      if (b.tur !== "frq" || !v.bolumler[i].kapanis) return;
      b.frq.forEach((fid, j) => {
        const did = ((v.frqDeneme || {})[i] || {})[j], d = did ? q.frqDeneme.get(did, o.user_id) : null;
        rub.push({ bolum: i, i: j, denemeId: did || null, frq: frqTam(fid), cevaplar: d ? jsonCoz(d.cevaplar, {}) : {}, puanlar: d ? jsonCoz(d.puanlar, null) : null, toplam: d ? d.toplam : null });
      });
    });
    if (rub.length) out.rubrikler = rub;
    if (o.durum === "bitti" && o.sonuc) {
      out.sonuc = o.sonuc;
      const keys = o.plan.bolumler.filter(b => b.tur === "mcq").reduce((a, b) => a.concat(b.sorular), []);
      const ic = icerik(keys), coz = {};
      keys.forEach(k => { const row = satirCoz(q.tek.get(k.split("|")[1])); if (row) coz[k] = cozumOf(row); });
      out.icerik = { sorular: ic.sorular, pasajlar: ic.pasajlar }; out.cozumler = coz;
    }
    return out;
  }

  function sonucHesapla(o) {
    const p = P()[o.kod] || o.plan, meta = denemeMeta(), v = o.veri, plan = o.plan;
    const uniteAd = u => { const m = meta.kodlar[plan.denemeKodu]; const x = m && m.uniteler.find(y => y.no === u); return x ? x.ad : u; };
    let dogru = 0, yanlis = 0, bos = 0, toplam = 0;
    const uniteler = {}, inceleme = [], zaman = [], bolumOzet = [];
    plan.bolumler.forEach((b, bi) => {
      const bd = v.bolumler[bi], kullanilan = bd.acilis ? Math.round((bd.kapanis - bd.acilis) / 1000 * plan.hiz) : 0;
      const oz = { kod: b.kod, ad: b.ad, tur: b.tur, soru: b.tur === "mcq" ? b.sorular.length : b.frq.length, sureSn: b.sureSn, kullanilanSn: Math.min(b.sureSn, kullanilan), otomatik: !!bd.otomatik, kisaltilmis: !!b.kisaltilmis };
      if (b.tur === "mcq") {
        const hedefSn = b.sureSn / Math.max(1, b.sorular.length);
        oz.dogru = 0;
        b.sorular.forEach((k, i) => {
          const row = satirCoz(q.tek.get(k.split("|")[1]));
          let s = ((v.cevaplar || {})[bi] || {})[i] || null;
          if (s && (!row || !row.secenekler.some(op => op.id === s))) s = null;
          const st = !s ? "bos" : row && s === row.dogru ? "dogru" : "yanlis";
          toplam++; if (st === "dogru") { dogru++; oz.dogru++; } else if (st === "yanlis") yanlis++; else bos++;
          const un = row ? String(row.unite) : "?";
          const u = uniteler[un] || (uniteler[un] = { unite: un, ad: uniteAd(un), soru: 0, dogru: 0, yanlis: 0, bos: 0 });
          u.soru++; u[st]++;
          const isr = !!((v.isaret || {})[bi] || {})[i];
          inceleme.push({ b: bi, i, k, s, st, m: isr ? 1 : 0 });
          const sn = Math.max(0, Math.min(b.sureSn, Math.round(Number(((v.sure || {})[bi] || {})[i]) || 0)));
          zaman.push({ b: bi, i, k, sn, hedefSn: Math.round(hedefSn), uzun: sn > hedefSn * 2 && sn >= 60, st });
        });
      }
      bolumOzet.push(oz);
    });
    const mcqYuzde = toplam ? dogru / toplam * 100 : 0;
    let frq = null;
    if (!plan.yalnizMcq) {
      frq = { kazanilan: 0, toplam: 0, puanlanmamis: 0, sorular: [] };
      plan.bolumler.forEach((b, bi) => {
        if (b.tur !== "frq") return;
        b.frq.forEach((fid, j) => {
          const did = ((v.frqDeneme || {})[bi] || {})[j], d = did ? q.frqDeneme.get(did, o.user_id) : null, r0 = q.frqTek.get(fid);
          const tp = d ? d.toplam_puan : r0 ? r0.toplam_puan : 0, t = d && d.toplam != null ? d.toplam : null;
          frq.toplam += tp; frq.kazanilan += t || 0; if (t == null) frq.puanlanmamis++;
          frq.sorular.push({ bolum: bi, id: fid, baslik: r0 ? jsonCoz(r0.veri, {}).baslik : fid, denemeId: did || null, toplam: t, toplamPuan: tp });
        });
      });
      frq.yuzde = frq.toplam ? Math.round(frq.kazanilan / frq.toplam * 1000) / 10 : 0;
    }
    const k = kompozit({ agirlik: plan.agirlik, esikler: plan.esikler || p.esikler }, mcqYuzde, frq ? frq.yuzde : null);
    const sureSn = bolumOzet.reduce((a, b) => a + b.kullanilanSn, 0);
    return { id: o.id, kod: o.kod, ad: plan.ad, tarih: o.bitis || simdi(), yalnizMcq: !!plan.yalnizMcq, tahmini: true,
      mcq: { dogru, yanlis, bos, toplam, yuzde: Math.round(mcqYuzde * 10) / 10 }, frq, agirlik: plan.agirlik, esikler: plan.esikler,
      kompozit: k.kompozit, katki: k.katki, tahminiPuan: k.tahminiPuan, sureSn, bolumler: bolumOzet,
      uniteler: Object.keys(uniteler).sort((a, b) => a.localeCompare(b, "tr", { numeric: true })).map(u => Object.assign(uniteler[u], { yuzde: Math.round(uniteler[u].dogru / uniteler[u].soru * 100) })),
      zaman, inceleme };
  }
  /** Deneme geçmişine (exams) yazılan kayıt: veli paneli, XP, Yanlışlarım tekrarı (deneme.js ?mod=yanlislar&deneme=<id>) */
  function denemeKaydi(o, s) {
    const dk = o.plan.denemeKodu, un = {};
    s.uniteler.forEach(u => { un[dk + "|" + u.unite] = { kod: dk, unite: u.unite, ad: u.ad, soru: u.soru, dogru: u.dogru, yanlis: u.yanlis, bos: u.bos }; });
    return { id: o.id, kod: dk, ad: "Tam sınav · " + o.plan.ad, tarih: s.tarih, soruSayisi: s.mcq.toplam, dogru: s.mcq.dogru, yanlis: s.mcq.yanlis, bos: s.mcq.bos,
      yuzde: Math.round(s.kompozit), sureSn: s.sureSn, tahminiBand: s.tahminiPuan, uniteler: un, dersler: [dk], mod: "tam", sureModu: "tam",
      tamSinav: { kod: o.kod, kompozit: s.kompozit, mcqYuzde: s.mcq.yuzde, frqYuzde: s.frq ? s.frq.yuzde : null, yalnizMcq: s.yalnizMcq },
      inceleme: s.inceleme.map(x => ({ k: x.k, kod: dk, s: x.s, m: x.m, st: x.st })) };
  }

  // ==== uçlar ======================================================================================
  r.get("/api/tam-sinav/katalog", (req, res) => {
    oturumGerekli(req); ozel(res);
    const pl = P(), a = q.aktif.get(req.kullanici.id);
    return { ok: true, premium: premiumMu(req), hiz, sinavlar: Object.keys(pl).map(k => katalogSatiri(k, pl[k])), aktif: a ? { id: a.id, kod: a.kod } : null,
      gecmis: gecmisListe(req.kullanici.id, 20) };
  });
  function gecmisListe(uid, n) {
    return q.gecmis.all(uid, n).map(x => { const s = jsonCoz(x.sonuc, {}) || {};
      return { id: x.id, kod: x.kod, ad: s.ad || x.kod, tarih: x.bitis, kompozit: s.kompozit, tahminiPuan: s.tahminiPuan, mcqYuzde: s.mcq ? s.mcq.yuzde : null, frqYuzde: s.frq ? s.frq.yuzde : null, yalnizMcq: !!s.yalnizMcq }; });
  }
  r.get("/api/tam-sinav/gecmis", (req, res) => { oturumGerekli(req); ozel(res); return { ok: true, gecmis: gecmisListe(req.kullanici.id, 50) }; });

  r.post("/api/tam-sinav/olustur", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, kod = kirp(req.body && req.body.kod), p = P()[kod];
    if (!premiumMu(req)) throw new HttpHata(402, "Tam deneme sınavı Premium'da. Ücretsiz planda ders denemelerini ve FRQ pratiğini kullanabilirsin.", null, { premiumGerekli: true, neden: "tam-sinav" });
    if (!p) throw new HttpHata(400, "Bilinmeyen sınav.");
    const a = q.aktif.get(uid);
    if (a) {
      if (a.kod === kod) return yanit(oku(uid, a.id), saat());
      throw new HttpHata(409, "Yarım kalan bir tam sınavın var. Önce onu bitir ya da bırak.", null, { aktifId: a.id, aktifKod: a.kod });
    }
    if (!sinir.olustur.dene("u:" + uid)) throw new HttpHata(429, "Kısa sürede çok fazla sınav kurdun. Biraz sonra tekrar dene.");
    const yakin = new Set(q.yakin.all(uid, new Date(saat() - YAKIN_GUN * 864e5).toISOString()).map(x => x.k));
    q.oncekiPlanlar.all(uid).forEach(x => (jsonCoz(x.plan, {}).bolumler || []).forEach(b => (b.sorular || []).forEach(k => yakin.add(k))));
    const yapilan = new Set(q.frqYapilan.all(uid).map(x => x.frq_id));
    const seed = crypto.randomBytes(4).readUInt32BE(0) >>> 0 || 1;
    const k = planKur(p, mcqHavuzu(p, yakin), frqHavuzu(p, yapilan), mulberry32(seed));
    if (k.yetersiz.length) throw new HttpHata(400, "Bu ders için tam sınav henüz kurulamıyor: " + k.yetersiz.join("; ") + ".", null, { yetersiz: k.yetersiz });
    const plan = { kod, ad: p.ad, denemeKodu: p.denemeKodu, hiz, seed, agirlik: p.agirlik, esikler: p.esikler, referans: p.referans || null, hesapMakinesiBilgi: p.hesapMakinesi || null,
      yalnizMcq: k.yalnizMcq, bolumler: k.bolumler, planSurum: planlar(bag.planDosyasi).surum || 1 };
    const veri0 = { bolumler: k.bolumler.map(() => ({ acilis: null, bitis: null, kapanis: null, otomatik: false })), cevaplar: {}, isaret: {}, eleme: {}, sure: {}, frq: {}, frqDeneme: {} };
    const id = "ts-" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
    q.ekle.run(id, uid, kod, JSON.stringify(plan), JSON.stringify(veri0), simdi());
    denetim({ eylem: "tam-sinav.olustur", kullanici: uid, istek: req, varlik: "tam_sinavlar", varlikId: id, ayrinti: { kod, yalnizMcq: k.yalnizMcq, frq: k.bolumler.filter(b => b.tur === "frq").reduce((a2, b) => a2 + b.frq.length, 0) } });
    return yanit(oku(uid, id), saat());
  });

  r.get("/api/tam-sinav/:id", (req, res) => {
    oturumGerekli(req); ozel(res);
    const o = oku(req.kullanici.id, req.params.id), now = saat();
    if (durumGuncelle(o, now)) kaydet(o);
    return yanit(o, now);
  });

  r.post("/api/tam-sinav/:id/bolum-baslat", (req, res) => {
    oturumGerekli(req); ozel(res);
    const o = oku(req.kullanici.id, req.params.id), now = saat(), bi = Number(req.body && req.body.bolum);
    if (o.durum !== "devam") throw new HttpHata(409, "Bu sınav bitti.");
    durumGuncelle(o, now);
    const v = o.veri;
    if (!Number.isInteger(bi) || !v.bolumler[bi]) { kaydet(o); throw new HttpHata(400, "Geçersiz bölüm."); }
    if (v.bolumler[bi].acilis) { kaydet(o); return yanit(o, now); } // zaten başladı (yenileme)
    if (v.bolumler.some((bd, i) => i < bi && !bd.kapanis)) { kaydet(o); throw new HttpHata(409, "Önce önceki bölümü teslim et."); }
    v.bolumler[bi].acilis = now;
    v.bolumler[bi].bitis = now + Math.round(o.plan.bolumler[bi].sureSn * 1000 / o.plan.hiz);
    kaydet(o);
    return yanit(o, now);
  });

  r.post("/api/tam-sinav/:id/cevap", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id;
    if (!sinir.cevap.dene("u:" + uid)) throw new HttpHata(429, "Çok hızlı kayıt gönderiyorsun.");
    const o = oku(uid, req.params.id), now = saat(), b0 = req.body || {}, bi = Number(b0.bolum), i = Number(b0.i);
    if (o.durum !== "devam") throw new HttpHata(409, "Bu sınav bitti.", null, { kapandi: true });
    const degisti = durumGuncelle(o, now);
    const bd = o.veri.bolumler[bi], b = o.plan.bolumler[bi];
    if (!bd || !b) throw new HttpHata(400, "Geçersiz bölüm.");
    if (!bd.acilis || bd.kapanis || now > bd.bitis + TOLERANS_MS) {
      if (degisti) kaydet(o);
      throw new HttpHata(409, bd.acilis ? "Bu bölümün süresi doldu ya da teslim edildi; cevap kaydedilmedi." : "Bu bölüm henüz başlamadı.", null, { kapandi: !!bd.acilis });
    }
    const n = b.tur === "mcq" ? b.sorular.length : b.frq.length;
    if (!Number.isInteger(i) || i < 0 || i >= n) throw new HttpHata(400, "Geçersiz soru.");
    const v = o.veri, alan = (ad) => ((v[ad] = v[ad] || {})[bi] = v[ad][bi] || {});
    if (b.tur === "mcq") {
      if ("secim" in b0) {
        const s = b0.secim == null || b0.secim === "" ? null : kirp(b0.secim).toUpperCase();
        if (s) { const row = satirCoz(q.tek.get(b.sorular[i].split("|")[1])); if (!row || !row.secenekler.some(op => op.id === s)) throw new HttpHata(400, "Geçersiz seçenek."); alan("cevaplar")[i] = s; }
        else delete alan("cevaplar")[i];
      }
      if ("eleme" in b0) { const l = (Array.isArray(b0.eleme) ? b0.eleme : []).map(x => kirp(x).toUpperCase()).filter(x => /^[A-E]$/.test(x)).slice(0, 5); if (l.length) alan("eleme")[i] = l; else delete alan("eleme")[i]; }
    } else if (b0.frq && typeof b0.frq === "object" && !Array.isArray(b0.frq)) {
      const c = {};
      Object.keys(b0.frq).slice(0, 12).forEach(h => { if (/^[a-z]$/.test(h)) c[h] = String(b0.frq[h] == null ? "" : b0.frq[h]).slice(0, 20000); });
      alan("frq")[i] = c;
    }
    if ("isaret" in b0) { if (b0.isaret) alan("isaret")[i] = 1; else delete alan("isaret")[i]; }
    if ("sureSn" in b0) { const sn = Math.round(Number(b0.sureSn)); if (Number.isFinite(sn) && sn >= 0) alan("sure")[i] = Math.min(b.sureSn, sn); }
    kaydet(o);
    return { ok: true, kalanMs: Math.max(0, bd.bitis - now), sunucuZamani: now };
  });

  r.post("/api/tam-sinav/:id/bolum-teslim", (req, res) => {
    oturumGerekli(req); ozel(res);
    const o = oku(req.kullanici.id, req.params.id), now = saat(), bi = Number(req.body && req.body.bolum);
    if (o.durum !== "devam") throw new HttpHata(409, "Bu sınav bitti.");
    durumGuncelle(o, now);
    const bd = o.veri.bolumler[bi];
    if (!bd) throw new HttpHata(400, "Geçersiz bölüm.");
    if (!bd.acilis) throw new HttpHata(409, "Bu bölüm henüz başlamadı.");
    const yeni = kapat(o, bi, now, !!(req.body && req.body.otomatik));
    kaydet(o);
    if (yeni) denetim({ eylem: "tam-sinav.bolum-teslim", kullanici: o.user_id, istek: req, varlik: "tam_sinavlar", varlikId: o.id, ayrinti: { bolum: o.plan.bolumler[bi].kod, otomatik: !!bd.otomatik } });
    return yanit(o, now);
  });

  r.post("/api/tam-sinav/:id/bitir", (req, res) => {
    oturumGerekli(req); ozel(res);
    const o = oku(req.kullanici.id, req.params.id), now = saat();
    if (o.durum === "birakildi") throw new HttpHata(409, "Bu sınav bırakıldı.");
    if (o.durum === "devam") {
      durumGuncelle(o, now);
      if (o.veri.bolumler.some(bd => !bd.kapanis)) { kaydet(o); throw new HttpHata(409, "Önce tüm bölümleri tamamla."); }
    }
    const ilk = o.durum === "devam";
    if (ilk) { o.durum = "bitti"; o.bitis = new Date(now).toISOString(); }
    // Bitmiş sınavda yeniden çağrı: FRQ öz puanı değiştiyse bileşik puan güncellenir (MCQ sabit)
    o.sonuc = sonucHesapla(o);
    islem(db, () => {
      kaydet(o);
      veri.uygula(o.user_id, { [DENEME_KEY]: JSON.stringify({ v: 1, gecmis: [denemeKaydi(o, o.sonuc)] }) });
    });
    if (ilk) denetim({ eylem: "tam-sinav.bitir", kullanici: o.user_id, istek: req, varlik: "tam_sinavlar", varlikId: o.id, ayrinti: { kod: o.kod, kompozit: o.sonuc.kompozit, tahminiPuan: o.sonuc.tahminiPuan } });
    return Object.assign(yanit(o, now), { denemeKaydi: denemeKaydi(o, o.sonuc), ilk });
  });

  r.post("/api/tam-sinav/:id/birak", (req, res) => {
    oturumGerekli(req); ozel(res);
    const o = oku(req.kullanici.id, req.params.id);
    if (o.durum !== "devam") throw new HttpHata(409, "Bu sınav zaten kapandı.");
    o.durum = "birakildi"; o.bitis = simdi();
    kaydet(o);
    denetim({ eylem: "tam-sinav.birak", kullanici: o.user_id, istek: req, varlik: "tam_sinavlar", varlikId: o.id, ayrinti: { kod: o.kod } });
    return { ok: true };
  });

  return { sinir };
}

module.exports = { tamSinavRotalari, dogrula, planlar, planKur, kotalar, kisimSec, kompozit, apPuan, hmDuzey, hizOku, mulberry32, PLAN_DOSYA, TOLERANS_MS };
