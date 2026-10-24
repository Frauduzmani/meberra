"use strict";
// v1.5.0 Soru bankası: sorular (doğru cevap + açıklamalar) veritabanında; sunucu üyeliğe göre verir.
// - Liste yanıtlarında doğru şık / çözüm YOKTUR (yalnızca öğrencinin daha önce cevapladığı soruların çözümü eklenir).
// - Cevap kontrolü sunucuda (POST /api/sorular-bankasi/cevap); cevap mevcut senkron birleştirmesiyle (apmeberra:quiz:v1 →
//   answers tablosu) kaydedilir: XP, lig ve istatistikler değişmeden çalışır.
// - Ücretsiz plan: istemciyle AYNI kural dosyası (assets/js/ucretsiz-kural.js). Kilitli kutu → 402 { premiumGerekli: true }.
// - Deneme ve seviye testi oturumları sunucuda kurulur ve puanlanır; ücretsiz deneme hakkı oluşturmada yazılır.
// - Yönetici "Soru bankası" düzenleyicisi: sürümlü kayıt (questions_bank_history), geri yükleme, arşiv (silme yok), dışa aktarma.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const config = require("./config");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const kural = require("../assets/js/ucretsiz-kural.js");
const sekilM = require("./sekil");

const TOHUM = path.join(__dirname, "tohum", "soru-bankasi.json");
const DENEME_META = path.join(__dirname, "tohum", "deneme-meta.json");
const SEVIYE_DIR = path.join(config.ROOT, "data", "sorular", "seviye");
const DEMO_ID = process.env.DEMO_SORU_ID || "vitrin_demo_1";
const QUIZ_KEY = "apmeberra:quiz:v1", HAK_KEY = "apmeberra:deneme-hak:v1", DENEME_KEY = "apmeberra:deneme:v1";

const JSON_ALAN = ["secenekler", "hata_aciklamalari", "deneme_kodlari", "ek", "sekil"];
// İçerik alanları (sürüm karşılaştırması ve geçmiş farkı bunlar üzerinden)
const ICERIK = ["tur", "sayfa", "ders", "unite_no", "unite", "kutu", "kutu_baslik", "dizi", "sira", "numara", "konu", "zorluk", "govde", "secenekler",
  "dogru", "aciklama", "genel_hatirlatma", "hata_aciklamalari", "kaynak", "deneme_kodlari", "pasaj", "ek", "durum", "sekil"];
const ZORLUKLAR = ["easy", "medium", "hard"];
const DURUMLAR = ["aktif", "taslak", "arsiv"];
const HARFLER = ["A", "B", "C", "D", "E"];
const SUPHELI = { enAz: 5, alt: 0.25, ust: 0.95 };   // en az 5 cevap; %25'in altı ya da %95'in üstü doğru → şüpheli

const sirala = o => Array.isArray(o) ? o.map(sirala) : o && typeof o === "object" ? Object.keys(o).sort().reduce((a, k) => (a[k] = sirala(o[k]), a), {}) : o;
const esit = (a, b) => JSON.stringify(sirala(a)) === JSON.stringify(sirala(b));
const kirp = s => String(s == null ? "" : s).trim();
const sayfaAd = s => String(s || "").replace(/\.html?$/i, "");
function jsonCoz(v, d) { if (v == null) return d; try { return JSON.parse(v); } catch (e) { return d; } }
function satirCoz(r) {
  if (!r) return null;
  const o = Object.assign({}, r);
  JSON_ALAN.forEach(k => { o[k] = jsonCoz(r[k], k === "secenekler" || k === "deneme_kodlari" ? [] : k === "sekil" ? null : {}); });
  return o;
}
function icerik(r) { const o = {}; ICERIK.forEach(k => { o[k] = r[k] === undefined ? null : r[k]; }); return o; }
function farkAlanlari(a, b) { return ICERIK.filter(k => !esit(a[k] === undefined ? null : a[k], b[k] === undefined ? null : b[k])); }

// --- satır yazımı ----------------------------------------------------------------------------
function hazirla(db) {
  return {
    tek: db.prepare("SELECT * FROM questions_bank WHERE id = ?"),
    ekle: db.prepare(`INSERT INTO questions_bank (id, tur, sayfa, ders, unite_no, unite, kutu, kutu_baslik, dizi, sira, numara, konu, zorluk, govde, secenekler, dogru,
      aciklama, genel_hatirlatma, hata_aciklamalari, kaynak, deneme_kodlari, pasaj, ek, durum, sekil, surum, olusturma, guncelleme, guncelleyen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    guncelle: db.prepare(`UPDATE questions_bank SET tur = ?, sayfa = ?, ders = ?, unite_no = ?, unite = ?, kutu = ?, kutu_baslik = ?, dizi = ?, sira = ?, numara = ?,
      konu = ?, zorluk = ?, govde = ?, secenekler = ?, dogru = ?, aciklama = ?, genel_hatirlatma = ?, hata_aciklamalari = ?, kaynak = ?, deneme_kodlari = ?, pasaj = ?,
      ek = ?, durum = ?, sekil = ?, surum = ?, guncelleme = ?, guncelleyen = ? WHERE id = ? AND surum = ?`),
    gecmis: db.prepare("INSERT INTO questions_bank_history (soru_id, surum, veri, fark, not_, degistiren, zaman) VALUES (?, ?, ?, ?, ?, ?, ?)")
  };
}
const yaziDegerleri = r => [r.tur, r.sayfa, r.ders, r.unite_no, r.unite, r.kutu, r.kutu_baslik, r.dizi, r.sira | 0, r.numara, r.konu, r.zorluk, r.govde,
  JSON.stringify(r.secenekler || []), r.dogru, r.aciklama, r.genel_hatirlatma, JSON.stringify(r.hata_aciklamalari || {}), r.kaynak,
  JSON.stringify(r.deneme_kodlari || []), r.pasaj, JSON.stringify(r.ek || {}), r.durum || "aktif", r.sekil == null ? null : JSON.stringify(r.sekil)];

/** Yeni sürüm yazar: eski hâl geçmişe, satır surum+1. Dönüş: { surum, fark } (fark boşsa yazılmaz). */
function surumYaz(db, st, eski, yeni, kim, not) {
  const fark = farkAlanlari(eski, yeni);
  if (!fark.length) return { surum: eski.surum, fark };
  const z = simdi();
  st.gecmis.run(eski.id, eski.surum, JSON.stringify(eski), JSON.stringify(fark), not || null, kim == null ? null : String(kim), z);
  const n = Number(st.guncelle.run(...yaziDegerleri(yeni), eski.surum + 1, z, kim == null ? null : String(kim), eski.id, eski.surum).changes);
  if (n !== 1) throw new HttpHata(409, "Soru bu sırada başka biri tarafından değiştirildi. Sayfayı yenileyip tekrar dene.");
  return { surum: eski.surum + 1, fark };
}

/** Tohum / aktarım upsert'i (idempotent). Aynı içerik atlanır; değişen soru yeni sürüm olur. */
/** v1.13.0: tohum/aktarım satırlarının şekilleri temizlenir (kararlı çıktı → aynı içerik yeniden sürüm üretmez); geçersiz şekil atılır. */
function tohumSekilleri(satirlar, gunluk) {
  return satirlar.map(r => {
    const t = sekilM.satirSekilTemizle(r);
    if (t.sorunlar.length && gunluk) gunluk.uyari("sunucu", "Tohum sorusunda geçersiz şekil atıldı: " + r.id, { soruId: r.id, sorunlar: t.sorunlar.slice(0, 5).join("; ") });
    return t.satir;
  });
}
function tohumUpsert(db, satirlar, o) {
  satirlar = tohumSekilleri(satirlar, o && o.gunluk);
  const st = hazirla(db), kim = (o && o.guncelleyen) || "tohum", z = simdi();
  const s = { eklenen: 0, guncellenen: 0, ayni: 0 };
  islem(db, () => {
    for (const r of satirlar) {
      const eski = satirCoz(st.tek.get(r.id));
      if (!eski) { st.ekle.run(r.id, ...yaziDegerleri(r), 1, z, z, kim); s.eklenen++; continue; }
      if (esit(icerik(eski), icerik(r))) { s.ayni++; continue; }
      surumYaz(db, st, eski, Object.assign({}, eski, icerik(r)), kim, "aktarım"); s.guncellenen++;
    }
  });
  return s;
}
/** Tablo boşsa tohumdan doldurur. Dönüş: eklenen sayı (dolu tabloda 0). Tohum sürümü de ayarlara yazılır. */
function tohumYukleGerekirse(db, dosya) {
  if (db.prepare("SELECT COUNT(*) AS n FROM questions_bank").get().n > 0) return 0;
  const r = tohumEsitle(db, dosya);
  return r.mod === "ilk" ? r.eklenen : 0;
}

// --- v1.10.0 tohum sürümü: mevcut veritabanlarına içerik güncellemesi ---------------------------------------------
// Tohum dosyasının "surum" alanı ayarlar.soru_tohum_surum ile karşılaştırılır (anahtar yoksa veritabanı 1.10.0 öncesi
// tohumla, yani sürüm 1 ile kurulmuştur). Tohum daha yeniyse: yeni sorular eklenir; yönetici panelinde HİÇ düzenlenmemiş
// sorular yeni sürüme geçer (eski hâl questions_bank_history'ye, guncelleyen = 'tohum'); yönetici düzenlemesi olan sorulara
// dokunulmaz ve system_logs'a "bilgi" olarak yazılır. Tohumda olmayan sorular (yöneticinin eklediği) olduğu gibi kalır.
const TOHUM_AYAR = "soru_tohum_surum";
const SISTEM_YAZAR = new Set(["tohum", "aktarim"]);
const yoneticiKimligi = v => v != null && !SISTEM_YAZAR.has(String(v)) && /^\d+$/.test(String(v));
/** Soru yönetici panelinde düzenlendi mi (son yazan ya da geçmişteki herhangi bir sürümü yazan bir kullanıcı)? */
function yoneticiDuzenledi(db, satir) {
  if (yoneticiKimligi(satir.guncelleyen)) return true;
  return db.prepare("SELECT degistiren FROM questions_bank_history WHERE soru_id = ?").all(satir.id).some(h => yoneticiKimligi(h.degistiren));
}
function tohumSurumOku(db) {
  const r = db.prepare("SELECT deger FROM ayarlar WHERE anahtar = ?").get(TOHUM_AYAR);
  return r ? Number(r.deger) || 1 : null;
}
function tohumSurumYaz(db, surum) {
  db.prepare(`INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, NULL)
    ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme, guncelleyen = NULL`).run(TOHUM_AYAR, String(surum), simdi());
}
/**
 * Açılışta çağrılır. gunluk (isteğe bağlı): server/gunluk.js servisi; korunan yönetici düzenlemeleri "bilgi" olarak yazılır.
 * Dönüş: { mod: "yok" | "ilk" | "guncel" | "guncelleme", surum, eklenen, guncellenen, ayni, korunan: [id] }
 */
function tohumEsitle(db, dosya, gunluk) {
  const f = dosya || TOHUM;
  if (!fs.existsSync(f)) return { mod: "yok" };
  const t = JSON.parse(fs.readFileSync(f, "utf8"));
  const surum = Number(t.surum) || 1, satirlar = tohumSekilleri(t.sorular || [], gunluk);
  if (db.prepare("SELECT COUNT(*) AS n FROM questions_bank").get().n === 0) {
    let s;
    islem(db, () => { s = tohumUpsert(db, satirlar, { guncelleyen: "tohum" }); tohumSurumYaz(db, surum); });
    return { mod: "ilk", surum, eklenen: s.eklenen, guncellenen: 0, ayni: 0, korunan: [] };
  }
  const dbSurum = tohumSurumOku(db) || 1;
  if (surum <= dbSurum) return { mod: "guncel", surum: dbSurum, eklenen: 0, guncellenen: 0, ayni: 0, korunan: [] };
  const st = hazirla(db), z = simdi(), s = { mod: "guncelleme", oncekiSurum: dbSurum, surum, eklenen: 0, guncellenen: 0, ayni: 0, korunan: [] };
  islem(db, () => {
    for (const r of satirlar) {
      const eski = satirCoz(st.tek.get(r.id));
      if (!eski) { st.ekle.run(r.id, ...yaziDegerleri(r), 1, z, z, "tohum"); s.eklenen++; continue; }
      if (esit(icerik(eski), icerik(r))) { s.ayni++; continue; }
      if (yoneticiDuzenledi(db, eski)) { s.korunan.push(r.id); continue; }
      surumYaz(db, st, eski, Object.assign({}, eski, icerik(r)), "tohum", "tohum sürümü " + surum);
      s.guncellenen++;
    }
    tohumSurumYaz(db, surum);
  });
  if (gunluk) {
    gunluk.bilgi("sunucu", `Soru bankası tohum sürümü ${dbSurum} → ${surum}: ${s.guncellenen} soru güncellendi, ${s.eklenen} eklendi, ${s.korunan.length} yönetici düzenlemesi korundu`,
      { oncekiSurum: dbSurum, surum, guncellenen: s.guncellenen, eklenen: s.eklenen, ayni: s.ayni, korunan: s.korunan.slice(0, 200).join(", ") || null });
    s.korunan.slice(0, 100).forEach(id => gunluk.bilgi("sunucu", "Soru bankası tohum güncellemesi atlandı, yönetici düzenlemesi korundu: " + id,
      { soruId: id, tohumSurum: surum, cozum: "Panelde soruyu tohumdaki hâliyle karşılaştırıp gerekirse elle güncelle (araclar/icerik-denetim/UYGULAMA.md)." }));
  }
  return s;
}

// --- öğrenciye giden biçimler (eski istemci şemasıyla aynı alan adları; doğru şık / çözüm YOK) -------------------
/** 1.23.0: makinece okunur CED konu numarası ("1.6"); önce ek.cedKonu, yoksa konu metni. Numara yoksa null (English beceri kodları). */
function konuKodu(r) {
  const kaynaklar = [r && r.ek && r.ek.cedKonu, r && r.konu];
  for (const k of kaynaklar) {
    const m = /(?:^|[^\d.])(\d{1,2}\.\d{1,2})(?![\d.])/.exec(String(k || ""));
    if (m) return m[1];
  }
  return null;
}
function acikSoru(r) {
  const options = (r.secenekler || []).map(sekilM.acikSecenek);
  // v1.13.0: kök şekilleri (konum "govde") — konum "aciklama" olanlar yalnız çözümde (cozumOf)
  const sk = sekilM.govdeSekilleri(r.sekil);
  let o;
  if (r.tur === "seviye") {
    const ek = r.ek || {};
    o = { id: r.id, unite: r.unite, beceri: ek.beceri || r.konu, zorluk: r.zorluk, sureSn: ek.sureSn || 90, hesapMakinesi: !!ek.hesapMakinesi,
      source: r.kaynak, question: r.govde, options };
  } else o = { id: r.id, number: r.numara, topic: r.konu, konuKod: konuKodu(r), difficulty: r.zorluk, source: r.kaynak, question: r.govde, options };
  if (sk.length) o.sekiller = sk;
  // 1.25.0 A2 köprüsü: "Ne soruyor?" cevabı ele vermeyen Türkçe tek cümle — cevaptan önce gönderilir
  const ns = r.ek && typeof r.ek.neSoruyor === "string" ? r.ek.neSoruyor.trim() : "";
  if (ns) o.neSoruyor = ns;
  return o;
}
/**
 * v1.10.0 içerik zenginleştirmesi (yalnız CEVAPTAN SONRA gönderilir; liste yanıtlarında yoktur):
 * { kavram, ipucu, sikHata, hesapMakinesi: "gerekmez" | "yardımcı" | "gerekli" } — boş alanlar yazılmaz.
 * Seviye sorularında ek.hesapMakinesi boolean'dır (seviye arayüzü); üç düzeyli değer ek.hesapMakinesiDurum'dadır.
 */
function ogrenciEk(r) {
  const e = r.ek || {}, o = {};
  ["kavram", "ipucu", "sikHata"].forEach(k => { if (e[k] != null && String(e[k]).trim()) o[k] = String(e[k]); });
  const hm = e.hesapMakinesiDurum || (typeof e.hesapMakinesi === "string" ? e.hesapMakinesi : null);
  if (hm) o.hesapMakinesi = String(hm);
  return o;
}
/** Çözüm: { dogru, aciklama, genelHatirlatma, hatalar: { harf: { errorTag, remediation } }, ek } (istemci apCozumUygula ile birleştirir) */
function cozumOf(r) {
  const hatalar = {};
  Object.keys(r.hata_aciklamalari || {}).forEach(k => { const h = r.hata_aciklamalari[k] || {}; hatalar[k] = { errorTag: h.etiket || "", remediation: h.aciklama || "" }; });
  const c = { dogru: r.dogru, aciklama: r.aciklama || "", genelHatirlatma: r.genel_hatirlatma || "", hatalar, ek: ogrenciEk(r) };
  const sk = sekilM.cozumSekilleri(r.sekil);
  if (sk.length) c.sekiller = sk; // v1.13.0: konum "aciklama" şekilleri yalnız cevaptan sonra
  return c;
}

// --- deneme seçimi (istemcideki eski selectQuestions ile birebir: aynı tohum + aynı havuz → aynı deneme) ------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function karistir(arr, rng) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
function sirayla(groups, n) {
  const out = [], idx = groups.map(() => 0);
  let moved = true;
  while (out.length < n && moved) {
    moved = false;
    for (let i = 0; i < groups.length && out.length < n; i++) if (idx[i] < groups[i].length) { out.push(groups[i][idx[i]++]); moved = true; }
  }
  return out;
}
function uniteDengeli(pool, n, rng) {
  const by = {};
  pool.forEach(q => { (by[q.unite] = by[q.unite] || []).push(q); });
  const groups = karistir(Object.keys(by).sort(), rng).map(u => karistir(by[u].slice(), rng));
  return sirayla(groups, n);
}
function sinavSirasi(list, rng) {
  karistir(list, rng);
  const ilk = {};
  list.forEach((q, i) => { const g = q.pasaj || ("_" + i); if (!(g in ilk)) ilk[g] = i; });
  return list.map((q, i) => ({ q, g: ilk[q.pasaj || ("_" + i)], n: q.pasaj ? (q.number || 0) : 0 })).sort((a, b) => a.g - b.g || a.n - b.n).map(x => x.q);
}
function soruSec(havuzFn, cfg, seed) {
  const rng = mulberry32(seed);
  if (cfg.kod !== "genel") {
    const pool = havuzFn(cfg.kod, cfg.uniteFiltre);
    const n = cfg.adet === "tam" ? pool.length : Math.min(cfg.adet, pool.length);
    return sinavSirasi(uniteDengeli(pool, n, rng), rng).map(q => ({ k: q.k, kod: cfg.kod }));
  }
  const seen = {}, groups = [];
  cfg.dersler.forEach(kod => {
    const p = havuzFn(kod).filter(q => { if (seen[q.k]) return false; seen[q.k] = true; return true; });
    groups.push(uniteDengeli(p, p.length, rng).map(q => ({ q, kod })));
  });
  const total = groups.reduce((s, g) => s + g.length, 0);
  const picked = sirayla(groups, cfg.adet === "tam" ? total : Math.min(cfg.adet, total));
  const out = [];
  cfg.dersler.forEach(kod => {
    sinavSirasi(picked.filter(x => x.kod === kod).map(x => x.q), rng).forEach(q => out.push({ k: q.k, kod }));
  });
  return out;
}
const BAND_ESIK = [{ min: 72, band: 5 }, { min: 58, band: 4 }, { min: 44, band: 3 }, { min: 30, band: 2 }, { min: 0, band: 1 }];
function bandOf(yuzde) { for (const e of BAND_ESIK) if (yuzde >= e.min) return e.band; return 1; }

// --- seviye testi meta verisi (herkese açık data/sorular/seviye/*.js; soru içermez) ---------------------------
let seviyeMetaOnbellek = null;
function seviyeMeta() {
  if (seviyeMetaOnbellek) return seviyeMetaOnbellek;
  const w = { APMEBERRA_SEVIYE: {} }, c = { window: w };
  vm.createContext(c);
  if (fs.existsSync(SEVIYE_DIR)) {
    fs.readdirSync(SEVIYE_DIR).filter(f => f.endsWith(".js") && !f.startsWith("_")).sort()
      .forEach(f => vm.runInContext(fs.readFileSync(path.join(SEVIYE_DIR, f), "utf8"), c, { filename: f }));
  }
  const out = {};
  Object.keys(w.APMEBERRA_SEVIYE).forEach(k => { const b = Object.assign({}, w.APMEBERRA_SEVIYE[k]); delete b.sorular; out[k] = b; });
  seviyeMetaOnbellek = out;
  return out;
}
let denemeMetaOnbellek = null;
function denemeMeta() {
  if (!denemeMetaOnbellek) denemeMetaOnbellek = fs.existsSync(DENEME_META) ? JSON.parse(fs.readFileSync(DENEME_META, "utf8")) : { kodlar: {}, pasajlar: {} };
  return denemeMetaOnbellek;
}

/**
 * Rotalar. bag: { db, hesap, veri, denetim, oturumGerekli, yoneticiGerekli, sinirlar? }
 */
function soruBankasiRotalari(r, bag) {
  const { db, hesap, veri, denetim, oturumGerekli, yoneticiGerekli } = bag;
  const st = hazirla(db);
  const sinir = {
    cevap: hizSinirlayici(bag.cevapSiniri || 600, 10 * 60e3),
    deneme: hizSinirlayici(bag.denemeSiniri || 40, 60 * 60e3),
    seviye: hizSinirlayici(bag.seviyeSiniri || 30, 60 * 60e3),
    demo: hizSinirlayici(bag.demoSiniri || 60, 10 * 60e3)
  };
  const q = {
    kutuSorulari: db.prepare("SELECT * FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ? AND kutu = ? ORDER BY sira, rowid"),
    uniteSorulari: db.prepare("SELECT * FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ? AND unite_no = ? ORDER BY rowid"),
    ozet: db.prepare(`SELECT kutu, MAX(kutu_baslik) AS baslik, MIN(unite_no) AS unite_no, COUNT(*) AS toplam, MIN(rowid) AS ilk FROM questions_bank
      WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ? GROUP BY kutu ORDER BY ilk`),
    kutuSay: db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ? AND kutu = ?"),
    cevaplanan: db.prepare("SELECT DISTINCT soru FROM answers WHERE user_id = ? AND sayfa = ?"),
    cevapVar: db.prepare("SELECT 1 FROM answers WHERE user_id = ? AND sayfa = ? AND soru = ? LIMIT 1"),
    yanlisVar: db.prepare("SELECT 1 FROM wrong_answers WHERE user_id = ? AND sayfa = ? AND soru = ? LIMIT 1"),
    denemeHavuz: db.prepare("SELECT id, sayfa, unite, pasaj, numara, kutu, kutu_baslik, konu, deneme_kodlari FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND deneme_kodlari != '[]' ORDER BY rowid"),
    oturumEkle: db.prepare("INSERT INTO soru_oturumlari (id, user_id, tur, kod, sayfa, ucretsiz_hak, ayar, sorular, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),
    oturum: db.prepare("SELECT * FROM soru_oturumlari WHERE id = ? AND user_id = ?"),
    oturumTeslim: db.prepare("UPDATE soru_oturumlari SET teslim = ?, sonuc = ? WHERE id = ? AND teslim IS NULL"),
    hakOturum: db.prepare("SELECT 1 FROM soru_oturumlari WHERE user_id = ? AND tur = 'deneme' AND sayfa = ? AND ucretsiz_hak = 1 LIMIT 1"),
    hakDurum: db.prepare("SELECT deger FROM user_state WHERE user_id = ? AND anahtar = ?"),
    sinavlar: db.prepare("SELECT kod FROM exams WHERE user_id = ?"),
    sinav: db.prepare("SELECT veri FROM exams WHERE user_id = ? AND istemci_id = ?"),
    seviyeSorulari: db.prepare("SELECT * FROM questions_bank WHERE tur = 'seviye' AND durum = 'aktif' ORDER BY ders, sira, rowid"),
    seviyeOturumlari: db.prepare("SELECT sorular FROM soru_oturumlari WHERE user_id = ? AND tur = 'seviye'"),
    seviyeRaporlari: db.prepare("SELECT veri FROM level_tests WHERE user_id = ?")
  };
  const tek = id => satirCoz(st.tek.get(String(id || "")));
  const premiumMu = req => !!req.kullanici && (req.kullanici.rol === "yonetici" || hesap.uyelik(req.kullanici.id).premium);
  const ucretsizMi = row => row.tur !== "ders" || kural.apKutuUcretsizMi(row.sayfa, row.kutu);
  const ozel = res => res.setHeader("Cache-Control", "private, no-store");
  const premiumHata = (mesaj, ek) => new HttpHata(402, mesaj || "Bu içerik Premium'da.", null, Object.assign({ premiumGerekli: true }, ek || {}));

  // ==== öğrenci: ders sayfası soruları ==============================================================
  r.get("/api/sorular-bankasi/:sayfa", (req, res) => {
    oturumGerekli(req); ozel(res);
    const sayfa = sayfaAd(req.params.sayfa), prem = premiumMu(req);
    const kutular = q.ozet.all(sayfa).map(k => ({ kutu: k.kutu, baslik: k.baslik, uniteNo: k.unite_no, toplam: k.toplam, kilitli: !prem && !kural.apKutuUcretsizMi(sayfa, k.kutu) }));
    if (!kutular.length) throw new HttpHata(404, "Bu sayfada soru yok.");
    return { ok: true, sayfa, premium: prem, kutular };
  });
  r.get("/api/sorular-bankasi/:sayfa/:unite", (req, res) => {
    oturumGerekli(req); ozel(res);
    const sayfa = sayfaAd(req.params.sayfa), u = String(req.params.unite || "");
    const satirlar = (/^\d+$/.test(u) ? q.uniteSorulari.all(sayfa, Number(u)) : q.kutuSorulari.all(sayfa, u)).map(satirCoz);
    if (!satirlar.length) throw new HttpHata(404, "Bu ünitede soru yok.");
    if (!premiumMu(req) && satirlar.some(x => !ucretsizMi(x))) throw premiumHata("Bu ünite Premium'da. Ücretsiz planda her dersin ilk üniteleri açık.");
    const cevaplanan = new Set(q.cevaplanan.all(req.kullanici.id, sayfa).map(x => x.soru));
    const kutular = [], by = {};
    satirlar.forEach(x => {
      let k = by[x.kutu];
      if (!k) { k = by[x.kutu] = { kutu: x.kutu, baslik: x.kutu_baslik, uniteNo: x.unite_no, sorular: [] }; kutular.push(k); }
      const s = acikSoru(x);
      // Öğrencinin daha önce cevapladığı sorunun çözümü (sayfa yenilenince geri bildirim yeniden çizilsin); diğerlerinde yok
      if (cevaplanan.has(x.id)) s.cozum = cozumOf(x);
      k.sorular.push(s);
    });
    return { ok: true, sayfa, kutular };
  });

  /** Cevap kontrolü + kayıt. Kayıt mevcut birleştirmeyle (apmeberra:quiz:v1 → answers). */
  r.post("/api/sorular-bankasi/cevap", (req, res) => {
    oturumGerekli(req); ozel(res);
    if (!sinir.cevap.dene("u:" + req.kullanici.id)) throw new HttpHata(429, "Çok hızlı cevap gönderiyorsun. Biraz bekleyip tekrar dene.");
    const b = req.body || {};
    const row = tek(b.soruId);
    if (!row || row.tur !== "ders" || row.durum !== "aktif") throw new HttpHata(404, "Soru bulunamadı.");
    if (!premiumMu(req) && !ucretsizMi(row)) throw premiumHata("Bu soru Premium'da.");
    const secim = kirp(b.secim).toUpperCase();
    if (!row.secenekler.some(o => o.id === secim)) throw new HttpHata(400, "Geçersiz seçenek.");
    const dogru = secim === row.dogru, t = simdi();
    const kayit = { v: 1, pages: { [row.sayfa]: { units: { [row.kutu]: { title: row.kutu_baslik || row.kutu, total: q.kutuSay.get(row.sayfa, row.kutu).n,
      answers: { [row.id]: { s: secim, c: dogru, t } } } } } } };
    veri.uygula(req.kullanici.id, { [QUIZ_KEY]: JSON.stringify(kayit) });
    const c = cozumOf(row), h = c.hatalar[secim];
    return { ok: true, soruId: row.id, secim, dogru, dogruSecenek: row.dogru, aciklama: c.aciklama, genelHatirlatma: c.genelHatirlatma,
      hataAciklamasi: dogru ? null : { etiket: h ? h.errorTag : "", aciklama: h ? h.remediation : "" }, ek: c.ek, cozum: c, t };
  });

  /** Anahtarla soru getir (İlerleme › Bugünkü tekrar). Ücretsiz planda: açık kutu ya da öğrencinin daha önce çözdüğü soru. */
  r.post("/api/sorular-bankasi/getir", (req, res) => {
    oturumGerekli(req); ozel(res);
    const l = Array.isArray(req.body && req.body.anahtarlar) ? req.body.anahtarlar.slice(0, 100) : [];
    const prem = premiumMu(req), uid = req.kullanici.id, meta = denemeMeta();
    const sorular = {}, eksik = [], pasajlar = {};
    l.forEach(k => {
      const p = String(k).split("|"), sayfa = sayfaAd(p[0]), row = tek(p[1]);
      if (!row || row.tur !== "ders" || row.sayfa !== sayfa || row.durum !== "aktif") { eksik.push(k); return; }
      const izin = prem || ucretsizMi(row) || q.cevapVar.get(uid, sayfa, row.id) || q.yanlisVar.get(uid, sayfa, row.id);
      if (!izin) { eksik.push(k); return; }
      const s = Object.assign(acikSoru(row), { sayfa: row.sayfa + ".html", kap: row.kutu, kapBaslik: row.kutu_baslik, pasaj: row.pasaj || null });
      if (q.cevapVar.get(uid, sayfa, row.id)) s.cozum = cozumOf(row);
      if (row.pasaj && meta.pasajlar[row.pasaj]) pasajlar[row.pasaj] = meta.pasajlar[row.pasaj];
      sorular[k] = s;
    });
    return { ok: true, sorular, pasajlar, eksik };
  });

  // ==== herkese açık: vitrin demo sorusu (yalnızca yapılandırılmış TEK soru) ========================================
  r.get("/api/public/demo-soru", (req, res) => {
    const row = tek(DEMO_ID);
    if (!row || row.durum !== "aktif") throw new HttpHata(404, "Örnek soru şu an yok.");
    res.setHeader("Cache-Control", "public, max-age=300");
    return { ok: true, soru: Object.assign(acikSoru(row), { konu: row.konu }) };
  });
  r.post("/api/public/demo-soru/cevap", (req, res) => {
    ozel(res);
    if (!sinir.demo.dene("ip:" + req.ip)) throw new HttpHata(429, "Çok fazla deneme. Biraz sonra tekrar dene.");
    const row = tek(DEMO_ID);
    if (!row || row.durum !== "aktif") throw new HttpHata(404, "Örnek soru şu an yok.");
    const secim = kirp(req.body && req.body.secim).toUpperCase();
    if (!row.secenekler.some(o => o.id === secim)) throw new HttpHata(400, "Geçersiz seçenek.");
    const c = cozumOf(row), h = c.hatalar[secim], dogru = secim === row.dogru;
    return { ok: true, dogru, dogruSecenek: row.dogru, aciklama: c.aciklama, genelHatirlatma: c.genelHatirlatma,
      hataAciklamasi: dogru ? null : { etiket: h ? h.errorTag : "", aciklama: h ? h.remediation : "" }, sekiller: c.sekiller || [] };
  });

  // ==== deneme ===================================================================================
  function havuz() {
    return q.denemeHavuz.all().map(x => ({ k: x.sayfa + ".html|" + x.id, id: x.id, sayfa: x.sayfa, unite: x.unite, pasaj: x.pasaj || null, number: x.numara,
      kap: x.kutu, kapBaslik: x.kutu_baslik, topic: x.konu, denemeKodlari: jsonCoz(x.deneme_kodlari, []) }));
  }
  function kodlarCanli(h) {
    const meta = denemeMeta(), out = {};
    Object.keys(meta.kodlar).forEach(kod => {
      const m = meta.kodlar[kod], qs = h.filter(x => x.denemeKodlari.indexOf(kod) >= 0), say = {};
      qs.forEach(x => { say[x.unite] = (say[x.unite] || 0) + 1; });
      const uniteler = m.uniteler.map(u => ({ no: u.no, ad: u.ad, soruSayisi: say[u.no] || 0 }));
      Object.keys(say).forEach(no => { if (!uniteler.some(u => u.no === no)) uniteler.push({ no, ad: "Bölüm " + no, soruSayisi: say[no] }); });
      if (!qs.length) return;
      out[kod] = Object.assign({}, m, { soruSayisi: qs.length, uniteler });
    });
    return out;
  }
  const kodSayfa = (kodlar, kod) => sayfaAd(kodlar[kod] && kodlar[kod].sayfa);
  function hakKullanildi(uid, sayfa, kodlar) {
    if (q.hakOturum.get(uid, sayfa)) return true;
    const h = q.hakDurum.get(uid, HAK_KEY), j = h ? jsonCoz(h.deger, {}) : {};
    if (j && typeof j === "object" && j[sayfa]) return true;
    // Geriye uyum: o sayfaya ait tamamlanmış (sunucuya eşitlenmiş) eski deneme
    return q.sinavlar.all(uid).some(x => x.kod && x.kod !== "genel" && x.kod !== "yanlislar" && kodlar[x.kod] && kodSayfa(kodlar, x.kod) === sayfa);
  }

  /** Katalog: deneme kurulumu için soru meta verisi (kök, şık, cevap YOK) + canlı sayılar + pasajlar. */
  r.get("/api/deneme/katalog", (req, res) => {
    oturumGerekli(req); ozel(res);
    const h = havuz(), meta = denemeMeta(), kodlar = kodlarCanli(h), uid = req.kullanici.id, prem = premiumMu(req);
    const haklar = {};
    Object.keys(kodlar).forEach(k => { const s = kodSayfa(kodlar, k); if (!(s in haklar)) haklar[s] = hakKullanildi(uid, s, kodlar); });
    // Yalnız aktif havuzdaki sorularda geçen pasajlar (taslak sorulara ait yeni pasajlar onaydan önce gönderilmez)
    const pasajlar = {};
    h.forEach(x => { if (x.pasaj && meta.pasajlar[x.pasaj]) pasajlar[x.pasaj] = meta.pasajlar[x.pasaj]; });
    return { ok: true, premium: prem, haklar, kodlar, pasajlar,
      sorular: h.map(x => ({ sayfa: x.sayfa + ".html", id: x.id, unite: x.unite, denemeKodlari: x.denemeKodlari, pasaj: x.pasaj, number: x.number, kap: x.kap, kapBaslik: x.kapBaslik, topic: x.topic })) };
  });

  function icerikHaritasi(liste) {
    const out = {};
    liste.forEach(x => { if (out[x.k]) return; const row = tek(x.k.split("|")[1]); if (row) out[x.k] = acikSoru(row); });
    return out;
  }
  function cozumHaritasi(keys) {
    const out = {};
    keys.forEach(k => { if (out[k]) return; const row = tek(String(k).split("|")[1]); if (row) out[k] = cozumOf(row); });
    return out;
  }

  r.post("/api/deneme/olustur", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, b = req.body || {}, prem = premiumMu(req);
    if (!sinir.deneme.dene("u:" + uid)) throw new HttpHata(429, "Kısa sürede çok fazla deneme kurdun. Biraz sonra tekrar dene.");
    const h = havuz(), kodlar = kodlarCanli(h), byK = new Map(h.map(x => [x.k, x]));
    let kod, sayfa = null, ucretsizHak = 0, sorular, ad, seed = Number(b.seed) >>> 0 || (crypto.randomBytes(4).readUInt32BE(0) >>> 0) || 1, ayar;
    if (b.mod === "yanlislar") {
      kod = "yanlislar"; ad = "Yanlışlarım tekrarı";
      const l = Array.isArray(b.sorular) ? b.sorular.slice(0, 300) : [];
      sorular = [];
      l.forEach(x => {
        const k = String(x && x.k || ""), m = byK.get(k), kk = String(x && x.kod || "");
        if (!m || m.denemeKodlari.indexOf(kk) < 0 || sorular.some(y => y.k === k)) return;
        // Ücretsiz plan: yalnızca kendi yanlışları (Yanlışlarım) ya da açık kutulardaki sorular (kilitli içeriğe arka kapı olmasın)
        if (!prem && !kural.apKutuUcretsizMi(m.sayfa, m.kap) && !q.yanlisVar.get(uid, m.sayfa, m.id) && !q.cevapVar.get(uid, m.sayfa, m.id)) return;
        sorular.push({ k, kod: kk });
      });
      if (!sorular.length) throw new HttpHata(400, "Tekrar edilecek uygun soru bulunamadı.");
      ayar = { mod: "yanlislar", kaynakDeneme: kirp(b.kaynakDeneme).slice(0, 80) || null, sureModu: "suresiz" };
    } else {
      kod = kirp(b.kod);
      const adet = b.adet === "tam" ? "tam" : Math.max(1, Math.min(200, Number(b.adet) || 20));
      if (kod === "genel") {
        if (!prem) throw premiumHata("Genel deneme Premium'da.", { neden: "genel" });
        const dersler = (Array.isArray(b.dersler) ? b.dersler : []).map(String).filter(k => kodlar[k]);
        if (!dersler.length) throw new HttpHata(400, "En az bir ders seç.");
        const kisa = dersler.map(k => kodlar[k].ad.replace(/^AP /, ""));
        ad = "Genel deneme (" + kisa.join(", ") + ")";
        ayar = { adet, dersler, sureModu: b.sureModu === "suresiz" ? "suresiz" : "tempo" };
        sorular = soruSec((k, u) => h.filter(x => x.denemeKodlari.indexOf(k) >= 0 && (!u || u.indexOf(x.unite) >= 0)), { kod, adet, dersler }, seed);
      } else {
        if (!kodlar[kod]) throw new HttpHata(400, "Bilinmeyen deneme kodu.");
        sayfa = kodSayfa(kodlar, kod);
        if (!prem && hakKullanildi(uid, sayfa, kodlar)) throw premiumHata("Bu dersin ücretsiz denemesini kullandın. Premium ile sınırsız deneme çözebilirsin.", { hakKullanildi: true, sayfa });
        const uf = Array.isArray(b.uniteFiltre) ? b.uniteFiltre.map(String) : null;
        ad = kodlar[kod].ad;
        ayar = { adet, uniteFiltre: uf, sureModu: b.sureModu === "suresiz" ? "suresiz" : "tempo" };
        sorular = soruSec((k, u) => h.filter(x => x.denemeKodlari.indexOf(k) >= 0 && (!u || u.indexOf(x.unite) >= 0)), { kod, adet, uniteFiltre: uf }, seed);
        ucretsizHak = 1; // ders denemesi başlarken hak kullanılır (iptal geri getirmez) — istemcideki eski kuralla aynı
      }
      if (!sorular.length) throw new HttpHata(400, "Seçimine uyan soru yok.");
    }
    const id = "dn-" + Date.now().toString(36) + "-" + seed.toString(36) + crypto.randomBytes(2).toString("hex");
    ayar.seed = seed; ayar.ad = ad;
    islem(db, () => {
      q.oturumEkle.run(id, uid, "deneme", kod, sayfa, ucretsizHak, JSON.stringify(ayar), JSON.stringify(sorular), simdi());
      if (ucretsizHak) veri.uygula(uid, { [HAK_KEY]: JSON.stringify({ [sayfa]: { t: Date.now(), kod } }) });
    });
    denetim({ eylem: "deneme.olustur", kullanici: uid, istek: req, varlik: "soru_oturumlari", varlikId: id, ayrinti: { kod, soru: sorular.length, ucretsizHak: !!ucretsizHak && !prem } });
    return { ok: true, deneme: { id, kod, ad, seed, sorular }, icerik: icerikHaritasi(sorular) };
  });

  function sinavOturumu(uid, id) {
    const o = q.oturum.get(String(id || ""), uid);
    if (!o || o.tur !== "deneme") return null;
    return Object.assign({}, o, { sorular: jsonCoz(o.sorular, []), ayar: jsonCoz(o.ayar, {}), sonuc: jsonCoz(o.sonuc, null) });
  }
  r.get("/api/deneme/:id", (req, res) => {
    oturumGerekli(req); ozel(res);
    const o = sinavOturumu(req.kullanici.id, req.params.id);
    if (o) {
      const out = { ok: true, deneme: { id: o.id, kod: o.kod, ad: o.ayar.ad, seed: o.ayar.seed, sorular: o.sorular, teslim: o.teslim }, icerik: icerikHaritasi(o.sorular) };
      if (o.teslim) { out.sonuc = o.sonuc; out.cozumler = cozumHaritasi(o.sorular.map(x => x.k)); }
      return out;
    }
    // Geriye uyum: v1.5.0 öncesi tarayıcıda kurulan ve sunucuya eşitlenen (exams) tamamlanmış deneme → inceleme
    const e = q.sinav.get(req.kullanici.id, String(req.params.id || ""));
    const rec = e ? jsonCoz(e.veri, null) : null;
    if (!rec || !Array.isArray(rec.inceleme)) throw new HttpHata(404, "Deneme bulunamadı.");
    // İstemciden eşitlenmiş kayıt: taslak (henüz yayımlanmamış) soruların içeriği / çözümü bu yoldan verilmez
    const keys = rec.inceleme.map(x => String(x && x.k || "")).filter(Boolean).filter(k => { const row = tek(k.split("|")[1]); return !row || row.durum !== "taslak"; });
    return { ok: true, deneme: { id: rec.id, kod: rec.kod, ad: rec.ad, seed: rec.seed, sorular: rec.inceleme.map(x => ({ k: x.k, kod: x.kod })), teslim: rec.tarih },
      icerik: icerikHaritasi(keys.map(k => ({ k }))), cozumler: cozumHaritasi(keys), eski: true };
  });

  r.post("/api/deneme/teslim", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, b = req.body || {};
    const o = sinavOturumu(uid, b.denemeId);
    if (!o) throw new HttpHata(404, "Deneme bulunamadı.");
    if (o.teslim && o.sonuc) return { ok: true, sonuc: o.sonuc, cozumler: cozumHaritasi(o.sorular.map(x => x.k)), icerik: icerikHaritasi(o.sorular), tekrar: true };
    const meta = denemeMeta(), cev = b.cevaplar && typeof b.cevaplar === "object" ? b.cevaplar : {}, isr = b.isaretli && typeof b.isaretli === "object" ? b.isaretli : {};
    const unitName = (kod, no) => { const k = meta.kodlar[kod]; const u = k && k.uniteler.find(x => x.no === no); return u ? u.ad : no; };
    let dogru = 0, yanlis = 0, bos = 0;
    const uniteler = {}, inceleme = [];
    o.sorular.forEach((x, i) => {
      const row = tek(String(x.k).split("|")[1]);
      let s = cev[i] == null ? null : kirp(cev[i]).toUpperCase() || null;
      if (s && (!row || !row.secenekler.some(op => op.id === s))) s = null;
      const durum = !s ? "bos" : row && s === row.dogru ? "dogru" : "yanlis";
      if (durum === "dogru") dogru++; else if (durum === "yanlis") yanlis++; else bos++;
      const unite = row ? row.unite : "?", uk = x.kod + "|" + unite;
      const u = uniteler[uk] || (uniteler[uk] = { kod: x.kod, unite, ad: unitName(x.kod, unite), soru: 0, dogru: 0, yanlis: 0, bos: 0 });
      u.soru++; u[durum]++;
      inceleme.push({ k: x.k, kod: x.kod, s, m: isr[i] ? 1 : 0, st: durum });
    });
    const n = o.sorular.length, yuzde = n ? Math.round(dogru / n * 100) : 0, karma = o.kod === "genel" || o.kod === "yanlislar";
    const sure = Math.max(0, Math.min(86400, Math.round(Number(b.gecenSn) || 0)));
    const lim = Number(b.sureLimitSn);
    const rec = {
      id: o.id, kod: o.kod, ad: o.ayar.ad, tarih: simdi(), soruSayisi: n, dogru, yanlis, bos, yuzde, sureSn: sure, tahminiBand: karma ? null : bandOf(yuzde),
      uniteler, seed: o.ayar.seed, sureModu: o.ayar.sureModu || "tempo", sureLimitSn: isFinite(lim) && lim > 0 ? Math.round(lim) : null, otomatikTeslim: !!b.otomatik,
      dersler: o.kod === "genel" ? o.ayar.dersler : o.kod === "yanlislar" ? Array.from(new Set(o.sorular.map(x => x.kod))) : [o.kod], inceleme
    };
    if (o.kod === "yanlislar") { rec.mod = "yanlislar"; rec.kaynakDeneme = o.ayar.kaynakDeneme || null; }
    islem(db, () => {
      if (Number(q.oturumTeslim.run(rec.tarih, JSON.stringify(rec), o.id).changes) !== 1) throw new HttpHata(409, "Bu deneme zaten teslim edildi.");
      // Mevcut birleştirme: geçmişe eklenir, exams tablosuna ayrışır (XP / lig / istatistik), aynı id'li yarım deneme kapanır
      veri.uygula(uid, { [DENEME_KEY]: JSON.stringify({ v: 1, gecmis: [rec] }) });
    });
    denetim({ eylem: "deneme.teslim", kullanici: uid, istek: req, varlik: "soru_oturumlari", varlikId: o.id, ayrinti: { kod: o.kod, dogru, yanlis, bos } });
    return { ok: true, sonuc: rec, cozumler: cozumHaritasi(o.sorular.map(x => x.k)), icerik: icerikHaritasi(o.sorular) };
  });

  // ==== seviye testi (oturum açmış herkese açık; cevaplar sunucuda kontrol edilir) =================================
  r.get("/api/seviye/bankalar", (req, res) => {
    oturumGerekli(req); ozel(res);
    const meta = seviyeMeta(), out = {};
    q.seviyeSorulari.all().map(satirCoz).forEach(x => {
      if (!meta[x.ders]) return;
      const b = out[x.ders] || (out[x.ders] = Object.assign({}, meta[x.ders], { sorular: [] }));
      b.sorular.push(acikSoru(x));
    });
    return { ok: true, bankalar: out };
  });
  /** Seviye sorusu. Taslak hiçbir zaman (yayımlanmamış); arşivlenmiş soru eski raporlar için çözülmeye devam eder. */
  function seviyeSatiri(k) {
    const p = String(k).split("|"), row = tek(p.slice(1).join("|"));
    return row && row.tur === "seviye" && row.ders === p[0] && row.durum !== "taslak" ? row : null;
  }
  r.post("/api/seviye/teslim", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id;
    if (!sinir.seviye.dene("u:" + uid)) throw new HttpHata(429, "Kısa sürede çok fazla test gönderdin. Biraz sonra tekrar dene.");
    const c = req.body && req.body.cevaplar && typeof req.body.cevaplar === "object" ? req.body.cevaplar : {};
    const keys = Object.keys(c).slice(0, 400);
    const sonuclar = {}, cozumler = {}, sorular = [];
    keys.forEach(k => {
      const row = seviyeSatiri(k);
      if (!row) return;
      const s = c[k] == null ? null : kirp(c[k]).toUpperCase() || null;
      sonuclar[k] = { secim: s, dogru: s ? s === row.dogru : null, dogruSecenek: row.dogru };
      cozumler[k] = cozumOf(row);
      sorular.push({ k, kod: row.ders });
    });
    if (!sorular.length) throw new HttpHata(400, "Gönderilen cevaplarda geçerli soru yok.");
    const id = "sv-" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
    const ozet = { dogru: 0, yanlis: 0, bos: 0 };
    Object.keys(sonuclar).forEach(k => { const x = sonuclar[k]; ozet[x.dogru === null ? "bos" : x.dogru ? "dogru" : "yanlis"]++; });
    q.oturumEkle.run(id, uid, "seviye", null, null, 0, JSON.stringify({ dersler: Array.from(new Set(sorular.map(x => x.kod))) }), JSON.stringify(sorular), simdi());
    q.oturumTeslim.run(simdi(), JSON.stringify(Object.assign({ sonuclar }, ozet)), id);
    denetim({ eylem: "seviye.teslim", kullanici: uid, istek: req, varlik: "soru_oturumlari", varlikId: id, ayrinti: ozet });
    return { ok: true, oturumId: id, sonuclar, cozumler };
  });
  /** Daha önce teslim edilmiş seviye sorularının çözümleri (rapor yeniden açılınca). Yalnız kullanıcının kendi testlerindeki sorular. */
  r.post("/api/seviye/cozumler", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, izinli = new Set();
    q.seviyeOturumlari.all(uid).forEach(o => jsonCoz(o.sorular, []).forEach(x => izinli.add(x.k)));
    q.seviyeRaporlari.all(uid).forEach(o => {
      const r0 = jsonCoz(o.veri, {}) || {};
      Object.keys(r0.sonuclar || {}).forEach(ders => {
        const s = r0.sonuclar[ders] || {}, l = s.liste || {};
        [].concat(l.yanlis || [], l.cevapsiz || []).forEach(id => izinli.add(ders + "|" + id));
        Object.keys(s.cevaplar || {}).forEach(id => izinli.add(ders + "|" + id));
      });
    });
    const out = {};
    (Array.isArray(req.body && req.body.anahtarlar) ? req.body.anahtarlar.slice(0, 400) : []).forEach(k => {
      if (!izinli.has(k)) return;
      const row = seviyeSatiri(k);
      if (row) out[k] = cozumOf(row);
    });
    return { ok: true, cozumler: out };
  });

  // ==== yönetici: Soru bankası düzenleyicisi =====================================================================
  const STAT_SQL = "LEFT JOIN (SELECT sayfa AS s_sayfa, soru AS s_soru, COUNT(*) AS cevap, COALESCE(SUM(dogru), 0) AS dogru_sayi FROM answers GROUP BY sayfa, soru) s ON s.s_sayfa = q.sayfa AND s.s_soru = q.id";
  function istatistik(x) {
    const n = Number(x.cevap) || 0, d = Number(x.dogru_sayi) || 0, oran = n ? d / n : null;
    return { cevap: n, dogruSayi: d, dogruOran: oran == null ? null : Math.round(oran * 1000) / 10, supheli: n >= SUPHELI.enAz && (oran < SUPHELI.alt || oran > SUPHELI.ust) };
  }
  function yoneticiSatir(x) {
    const o = satirCoz(x);
    const out = icerik(o);
    out.id = o.id; out.surum = o.surum; out.olusturma = o.olusturma; out.guncelleme = o.guncelleme; out.guncelleyen = o.guncelleyen;
    out.istatistik = istatistik(x);
    return out;
  }

  r.get("/api/admin/soru-bankasi/meta", req => {
    yoneticiGerekli(req);
    const kutular = db.prepare(`SELECT tur, sayfa, ders, kutu, MAX(kutu_baslik) AS baslik, MIN(unite_no) AS unite_no, COUNT(*) AS toplam,
      SUM(durum = 'aktif') AS aktif, MIN(rowid) AS ilk FROM questions_bank GROUP BY tur, sayfa, ders, kutu ORDER BY tur, sayfa, ilk`).all();
    const durum = db.prepare("SELECT durum, COUNT(*) AS n FROM questions_bank GROUP BY durum").all();
    const seviyeUniteler = {};
    db.prepare("SELECT ders, unite, COUNT(*) AS n FROM questions_bank WHERE tur = 'seviye' GROUP BY ders, unite").all().forEach(x => { (seviyeUniteler[x.ders] = seviyeUniteler[x.ders] || []).push(x.unite); });
    return { ok: true, kutular, durum, zorluklar: ZORLUKLAR, durumlar: DURUMLAR, seviyeUniteler, supheli: SUPHELI, denemeKodlari: Object.keys(denemeMeta().kodlar) };
  });

  r.get("/api/admin/soru-bankasi", req => {
    yoneticiGerekli(req);
    const g = k => kirp(req.sorgu.get(k));
    const sart = [], p = [];
    const ekle = (s, v) => { sart.push(s); p.push(v); };
    if (g("tur")) ekle("q.tur = ?", g("tur"));
    if (g("sayfa")) ekle("q.sayfa = ?", sayfaAd(g("sayfa")));
    if (g("ders")) ekle("q.ders = ?", g("ders"));
    if (g("kutu")) ekle("q.kutu = ?", g("kutu"));
    if (/^\d+$/.test(g("unite"))) ekle("q.unite_no = ?", Number(g("unite")));
    else if (g("unite")) ekle("q.unite = ?", g("unite"));
    if (DURUMLAR.indexOf(g("durum")) >= 0) ekle("q.durum = ?", g("durum"));
    if (ZORLUKLAR.indexOf(g("zorluk")) >= 0) ekle("q.zorluk = ?", g("zorluk"));
    if (g("q")) {
      const ara = "%" + g("q").slice(0, 100).replace(/[\\%_]/g, m => "\\" + m) + "%";
      sart.push("(q.id LIKE ? ESCAPE '\\' OR q.govde LIKE ? ESCAPE '\\' OR q.konu LIKE ? ESCAPE '\\' OR q.kaynak LIKE ? ESCAPE '\\')"); p.push(ara, ara, ara, ara);
    }
    if (g("supheli") === "1") { sart.push(`COALESCE(s.cevap, 0) >= ${SUPHELI.enAz} AND (1.0 * s.dogru_sayi / s.cevap < ${SUPHELI.alt} OR 1.0 * s.dogru_sayi / s.cevap > ${SUPHELI.ust})`); }
    const where = sart.length ? " WHERE " + sart.join(" AND ") : "";
    const SIRA = { cevap: "COALESCE(s.cevap, 0) DESC", oran: "CASE WHEN s.cevap IS NULL THEN 2 ELSE 1.0 * s.dogru_sayi / s.cevap END ASC", guncelleme: "q.guncelleme DESC", id: "q.id ASC" };
    const order = SIRA[g("sirala")] || "q.rowid ASC";
    const boyut = 50, sayfaNo = Math.max(1, Number(g("sayfaNo")) || 1);
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM questions_bank q " + STAT_SQL + where).get(...p).n;
    const satirlar = db.prepare("SELECT q.*, s.cevap, s.dogru_sayi FROM questions_bank q " + STAT_SQL + where + " ORDER BY " + order + " LIMIT ? OFFSET ?")
      .all(...p, boyut, (sayfaNo - 1) * boyut).map(yoneticiSatir);
    return { ok: true, toplam, sayfa: sayfaNo, sayfaBoyu: boyut, sorular: satirlar };
  });

  function gecmisListe(id) {
    return db.prepare("SELECT h.surum, h.veri, h.fark, h.not_, h.degistiren, h.zaman, u.ad, u.soyad FROM questions_bank_history h LEFT JOIN users u ON CAST(u.id AS TEXT) = h.degistiren WHERE h.soru_id = ? ORDER BY h.surum DESC")
      .all(id).map(x => ({ surum: x.surum, zaman: x.zaman, not: x.not_, fark: jsonCoz(x.fark, []), degistiren: x.ad ? x.ad + " " + x.soyad : x.degistiren, veri: icerik(jsonCoz(x.veri, {})) }));
  }
  r.get("/api/admin/soru-bankasi/soru/:id", req => {
    yoneticiGerekli(req);
    const x = db.prepare("SELECT q.*, s.cevap, s.dogru_sayi FROM questions_bank q " + STAT_SQL + " WHERE q.id = ?").get(String(req.params.id));
    if (!x) throw new HttpHata(404, "Soru bulunamadı.");
    const secimler = db.prepare("SELECT secim, COUNT(*) AS n FROM answers WHERE sayfa = ? AND soru = ? GROUP BY secim").all(x.sayfa, x.id);
    return { ok: true, soru: yoneticiSatir(x), secimDagilimi: secimler, gecmis: gecmisListe(x.id) };
  });
  r.get("/api/admin/soru-bankasi/soru/:id/gecmis", req => {
    yoneticiGerekli(req);
    if (!st.tek.get(String(req.params.id))) throw new HttpHata(404, "Soru bulunamadı.");
    return { ok: true, gecmis: gecmisListe(String(req.params.id)) };
  });

  /** Gelen formu doğrular ve satır içeriğine çevirir. eski: güncellemede mevcut satır (yeni soruda null). */
  function formDogrula(b, eski) {
    const e = {};
    const govde = String(b.govde == null ? "" : b.govde).trim();
    if (!govde) e.govde = "Soru kökünü yaz."; else if (govde.length > 20000) e.govde = "Soru kökü en fazla 20000 karakter.";
    const sec = Array.isArray(b.secenekler) ? b.secenekler : [];
    if (sec.length < 2 || sec.length > 5) e.secenekler = "2 ile 5 arasında seçenek olmalı.";
    const secenekler = sec.slice(0, 5).map((o, i) => {
      const x = { id: HARFLER[i], text: String(o && typeof o === "object" ? (o.text != null ? o.text : "") : o || "").trim() };
      // v1.13.0 şık şekli (secenekler[i].sekil): beyaz liste temizleyicisinden geçer; şekilli şıkta metin boş olabilir
      if (o && typeof o === "object" && o.sekil != null && o.sekil !== "") {
        const k = sekilM.sekilDogrula(o.sekil, { secenek: true });
        if (k.hatalar.length) e["sekil_" + x.id] = x.id + " şıkkının şekli: " + k.hatalar.join("; ");
        else x.sekil = k.sekil;
      }
      return x;
    });
    if (!e.secenekler && secenekler.some(o => !o.text && !o.sekil)) e.secenekler = "Boş seçenek bırakma.";
    if (!e.secenekler && secenekler.some(o => o.text.length > 4000)) e.secenekler = "Seçenek metni en fazla 4000 karakter.";
    // Büyük/küçük harfe DUYARLI: bazı çeldiriciler bilinçli olarak yalnız harfle ayrılır (ör. calc_u7_q1: k(t − 20) / k(T − 20))
    if (!e.secenekler && new Set(secenekler.map(o => o.text.replace(/\s+/g, " ") + "\u0001" + (o.sekil ? o.sekil.svg : ""))).size !== secenekler.length) e.secenekler = "Aynı metinli iki seçenek olamaz.";
    // Kök şekli (null | nesne | dizi). Alan gönderilmezse güncellemede mevcut şekil korunur.
    let sekil = eski ? eski.sekil : null;
    if (b.sekil !== undefined) {
      const k = sekilM.sekilleriDogrula(b.sekil === "" ? null : b.sekil);
      if (k.hatalar.length) e.sekil = k.hatalar.join("; "); else sekil = k.deger;
    }
    const dogru = String(b.dogru || "").toUpperCase();
    // Tek doğru şık: dogru tek harf ve seçeneklerden biri olmalı (birden çok doğru işaretlenemez)
    if (!secenekler.some(o => o.id === dogru)) e.dogru = "Tam olarak bir doğru seçenek işaretle.";
    const zorluk = String(b.zorluk || "");
    if (ZORLUKLAR.indexOf(zorluk) < 0) e.zorluk = "Zorluk easy, medium ya da hard olmalı.";
    const durum = String(b.durum || (eski ? eski.durum : "taslak"));
    if (DURUMLAR.indexOf(durum) < 0) e.durum = "Durum aktif, taslak ya da arsiv olmalı.";
    const aciklama = String(b.aciklama == null ? "" : b.aciklama).trim();
    if (aciklama.length > 20000) e.aciklama = "Açıklama en fazla 20000 karakter.";
    const genel = String(b.genel_hatirlatma == null ? "" : b.genel_hatirlatma).trim();
    if (genel.length > 10000) e.genel_hatirlatma = "Konu hatırlatması en fazla 10000 karakter.";
    const hata = {};
    const hb = b.hata_aciklamalari && typeof b.hata_aciklamalari === "object" ? b.hata_aciklamalari : {};
    secenekler.forEach(o => {
      if (o.id === dogru) return;
      const h = hb[o.id] || {};
      const et = String(h.etiket == null ? "" : h.etiket).trim(), ac = String(h.aciklama == null ? "" : h.aciklama).trim();
      if (et.length > 1000 || ac.length > 10000) e.hata_aciklamalari = "Hata açıklaması çok uzun.";
      if (et || ac) hata[o.id] = { etiket: et, aciklama: ac };
    });
    const konu = String(b.konu == null ? "" : b.konu).trim().slice(0, 500), kaynak = String(b.kaynak == null ? "" : b.kaynak).trim().slice(0, 300);
    // LaTeX ayırıcısı ($) tek sayıda kalırsa MathJax bozulur
    [["govde", govde], ["aciklama", aciklama], ["genel_hatirlatma", genel]].forEach(([k, v]) => { if (!e[k] && (v.replace(/\\\$/g, "").match(/\$/g) || []).length % 2) e[k] = "Tek sayıda $ var (LaTeX kapanmamış)."; });
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    return { govde, secenekler, dogru, zorluk, durum, aciklama, genel_hatirlatma: genel, hata_aciklamalari: hata, konu, kaynak, sekil };
  }

  /** v1.13.0 şekil önizleme: temizlenmiş SVG + hatalar / uyarılar / atılanlar (kaydetmez). */
  r.post("/api/admin/sekil/onizle", req => {
    yoneticiGerekli(req);
    const b = req.body || {};
    const k = sekilM.sekilDogrula(b.sekil, { secenek: !!b.secenek });
    return { ok: true, gecerli: !k.hatalar.length, sekil: k.sekil, hatalar: k.hatalar, uyarilar: k.uyarilar, kaldirilan: k.kaldirilan };
  });

  r.put("/api/admin/soru-bankasi/soru/:id", req => {
    yoneticiGerekli(req);
    const b = req.body || {};
    const eski = tek(req.params.id);
    if (!eski) throw new HttpHata(404, "Soru bulunamadı.");
    if (Number(b.surum) !== eski.surum) throw new HttpHata(409, "Soru sen düzenlerken değişti (sürüm " + eski.surum + "). Yeniden yükleyip tekrar dene.", null, { guncelSurum: eski.surum });
    const f = formDogrula(b, eski);
    const yeni = Object.assign({}, eski, f);
    if (eski.tur === "seviye" && b.unite != null) yeni.unite = kirp(b.unite).slice(0, 20) || eski.unite;
    let s;
    islem(db, () => { s = surumYaz(db, st, eski, yeni, req.kullanici.id, kirp(b.not).slice(0, 300) || null); });
    if (s.fark.length) denetim({ eylem: "soru-bankasi.duzenle", yapan: req.kullanici.id, istek: req, varlik: "questions_bank", varlikId: eski.id, ayrinti: { surum: s.surum, fark: s.fark } });
    return { ok: true, degisti: s.fark.length > 0, surum: s.surum, fark: s.fark, soru: yoneticiSatir(db.prepare("SELECT q.*, s.cevap, s.dogru_sayi FROM questions_bank q " + STAT_SQL + " WHERE q.id = ?").get(eski.id)) };
  });

  r.post("/api/admin/soru-bankasi/soru", req => {
    yoneticiGerekli(req);
    const b = req.body || {};
    const tur = b.tur === "seviye" ? "seviye" : "ders";
    const f = formDogrula(Object.assign({ durum: "taslak" }, b), null);
    let kardes, temel;
    if (tur === "ders") {
      const sayfa = sayfaAd(b.sayfa), kutu = kirp(b.kutu);
      kardes = db.prepare("SELECT * FROM questions_bank WHERE tur = 'ders' AND sayfa = ? AND kutu = ? ORDER BY sira DESC LIMIT 1").get(sayfa, kutu);
      if (!kardes) throw new HttpHata(400, "Geçerli bir sayfa ve soru istasyonu (kutu) seç.", { kutu: "Mevcut bir soru istasyonu seç." });
      kardes = satirCoz(kardes);
      temel = { tur, sayfa, ders: null, unite_no: kardes.unite_no, unite: kardes.unite, kutu, kutu_baslik: kardes.kutu_baslik, dizi: kardes.dizi,
        sira: kardes.sira + 1, numara: (Number(kardes.numara) || kardes.sira + 1) + 1, deneme_kodlari: kardes.deneme_kodlari, pasaj: null, ek: {} };
    } else {
      const ders = kirp(b.ders), unite = kirp(b.unite);
      kardes = db.prepare("SELECT * FROM questions_bank WHERE tur = 'seviye' AND ders = ? ORDER BY sira DESC LIMIT 1").get(ders);
      if (!kardes || !unite) throw new HttpHata(400, "Geçerli bir seviye testi dersi ve ünite seç.", { ders: "Ders ve ünite gerekli." });
      kardes = satirCoz(kardes);
      temel = { tur, sayfa: kardes.sayfa, ders, unite_no: null, unite, kutu: null, kutu_baslik: kardes.kutu_baslik, dizi: null, sira: kardes.sira + 1, numara: kardes.sira + 2,
        deneme_kodlari: [], pasaj: null, ek: { beceri: f.konu, sureSn: Math.max(30, Math.min(600, Number(b.sureSn) || 90)), hesapMakinesi: !!b.hesapMakinesi } };
    }
    let id = kirp(b.id).toLowerCase();
    if (id && !/^[a-z0-9_]{3,60}$/.test(id)) throw new HttpHata(400, "Kimlik yalnızca küçük harf, rakam ve _ içerebilir (3–60).", { id: "Geçersiz kimlik." });
    if (!id) {
      const kok = (tur === "ders" ? String(kardes.id).replace(/_?q?\d+$/, "") : String(kardes.id).replace(/_?\d+$/, "")) || "soru";
      let i = 1; do { id = kok + "_y" + i++; } while (st.tek.get(id));
    } else if (st.tek.get(id)) throw new HttpHata(409, "Bu kimlikle bir soru zaten var.", { id: "Kimlik kullanımda." });
    const satir = Object.assign(temel, f);
    const z = simdi();
    st.ekle.run(id, ...yaziDegerleri(satir), 1, z, z, String(req.kullanici.id));
    denetim({ eylem: "soru-bankasi.ekle", yapan: req.kullanici.id, istek: req, varlik: "questions_bank", varlikId: id, ayrinti: { tur, sayfa: satir.sayfa, kutu: satir.kutu, ders: satir.ders, durum: satir.durum } });
    return { ok: true, id, soru: yoneticiSatir(st.tek.get(id)) };
  });

  r.post("/api/admin/soru-bankasi/soru/:id/arsiv", req => {
    yoneticiGerekli(req);
    const eski = tek(req.params.id);
    if (!eski) throw new HttpHata(404, "Soru bulunamadı.");
    const hedef = req.body && req.body.geriAl ? "aktif" : "arsiv";
    if (eski.durum === hedef) return { ok: true, surum: eski.surum, durum: hedef };
    let s;
    islem(db, () => { s = surumYaz(db, st, eski, Object.assign({}, eski, { durum: hedef }), req.kullanici.id, hedef === "arsiv" ? "arşivlendi" : "arşivden çıkarıldı"); });
    denetim({ eylem: hedef === "arsiv" ? "soru-bankasi.arsiv" : "soru-bankasi.arsivden-cikar", yapan: req.kullanici.id, istek: req, varlik: "questions_bank", varlikId: eski.id, ayrinti: { surum: s.surum } });
    return { ok: true, surum: s.surum, durum: hedef };
  });

  // ==== v1.11.0 onay kuyruğu: taslak sorular (tohumdan gelen üretimler ya da panelde eklenen) toplu onay / ret ==========
  // Taslak öğrenciye hiçbir uçta sunulmaz; onay → aktif (yeni sürüm, geçmişe yazılır), ret → arsiv (neden ek.red'e ve geçmiş notuna).
  const TOPLU_EN_COK = 500;
  r.get("/api/admin/soru-bankasi/onay-kuyrugu", req => {
    yoneticiGerekli(req);
    const g = k => kirp(req.sorgu.get(k));
    const sart = ["q.durum = 'taslak'"], p = [];
    const ekle = (s, v) => { sart.push(s); p.push(v); };
    if (g("sayfa")) ekle("q.sayfa = ?", sayfaAd(g("sayfa")));
    if (g("kutu")) ekle("q.kutu = ?", g("kutu"));
    if (/^\d+$/.test(g("unite"))) ekle("q.unite_no = ?", Number(g("unite")));
    else if (g("unite")) ekle("q.unite = ?", g("unite"));
    if (g("uretim")) ekle("json_extract(q.ek, '$.uretim') = ?", g("uretim"));
    const where = " WHERE " + sart.join(" AND ");
    const boyut = Math.max(1, Math.min(200, Number(g("sayfaBoyu")) || 50)), sayfaNo = Math.max(1, Number(g("sayfaNo")) || 1);
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM questions_bank q" + where).get(...p).n;
    const satirlar = db.prepare("SELECT q.*, s.cevap, s.dogru_sayi FROM questions_bank q " + STAT_SQL + where + " ORDER BY q.sayfa, q.unite_no, q.kutu, q.sira, q.rowid LIMIT ? OFFSET ?")
      .all(...p, boyut, (sayfaNo - 1) * boyut).map(yoneticiSatir);
    // Önizleme: sorularda geçen pasaj metinleri (deneme-meta.json)
    const meta = denemeMeta(), pasajlar = {};
    satirlar.forEach(x => { if (x.pasaj && meta.pasajlar[x.pasaj]) pasajlar[x.pasaj] = meta.pasajlar[x.pasaj]; });
    // Sayılar (filtreden bağımsız; tüm taslaklar): sayfa, istasyon (kutu) ve üretim etiketine göre
    const sayilar = {
      toplam: db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak'").get().n,
      sayfa: db.prepare("SELECT sayfa, COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak' GROUP BY sayfa ORDER BY sayfa").all(),
      kutu: db.prepare(`SELECT sayfa, kutu, MAX(kutu_baslik) AS baslik, MIN(unite_no) AS unite_no, COUNT(*) AS n,
        (SELECT COUNT(*) FROM questions_bank a WHERE a.durum = 'aktif' AND a.sayfa = t.sayfa AND a.kutu IS t.kutu) AS aktif
        FROM questions_bank t WHERE durum = 'taslak' GROUP BY sayfa, kutu ORDER BY sayfa, MIN(unite_no), kutu`).all()
        .map(x => Object.assign(x, { yeniKutu: x.aktif === 0 })),
      uretim: db.prepare("SELECT json_extract(ek, '$.uretim') AS uretim, COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak' GROUP BY uretim ORDER BY uretim").all()
    };
    return { ok: true, toplam, sayfa: sayfaNo, sayfaBoyu: boyut, sayilar, sorular: satirlar, pasajlar };
  });

  function topluIdler(b) {
    const ids = Array.isArray(b && b.ids) ? Array.from(new Set(b.ids.map(x => String(x == null ? "" : x).trim()).filter(Boolean))) : [];
    if (!ids.length) throw new HttpHata(400, "En az bir soru seç.", { ids: "Soru kimliği listesi boş." });
    if (ids.length > TOPLU_EN_COK) throw new HttpHata(400, "Tek seferde en fazla " + TOPLU_EN_COK + " soru.", { ids: "Çok fazla soru." });
    return ids;
  }
  /** Toplu durum değişikliği (yalnız taslak sorularda). Dönüş: { islenen: [{id, surum}], atlanan: [{id, neden}] } */
  function topluDurum(req, ids, hedef, not, ekFn, eylem, ayrinti) {
    const islenen = [], atlanan = [];
    islem(db, () => {
      for (const id of ids) {
        const eski = tek(id);
        if (!eski) { atlanan.push({ id, neden: "bulunamadı" }); continue; }
        if (eski.durum !== "taslak") { atlanan.push({ id, neden: "taslak değil (" + eski.durum + ")" }); continue; }
        const yeni = Object.assign({}, eski, { durum: hedef });
        if (ekFn) yeni.ek = ekFn(eski.ek || {});
        const s = surumYaz(db, st, eski, yeni, req.kullanici.id, not);
        islenen.push({ id, surum: s.surum });
      }
    });
    islenen.forEach(x => denetim({ eylem, yapan: req.kullanici.id, istek: req, varlik: "questions_bank", varlikId: x.id, ayrinti: Object.assign({ surum: x.surum }, ayrinti || {}) }));
    return { islenen, atlanan };
  }
  r.post("/api/admin/soru-bankasi/onayla", req => {
    yoneticiGerekli(req);
    const ids = topluIdler(req.body);
    const s = topluDurum(req, ids, "aktif", "onaylandı (onay kuyruğu)", null, "soru-bankasi.onayla", { toplu: ids.length });
    return { ok: true, onaylanan: s.islenen.length, atlanan: s.atlanan, sorular: s.islenen };
  });
  r.post("/api/admin/soru-bankasi/reddet", req => {
    yoneticiGerekli(req);
    const ids = topluIdler(req.body);
    const neden = kirp(req.body && req.body.neden).slice(0, 500);
    if (neden.length < 3) throw new HttpHata(400, "Ret nedenini yaz.", { neden: "En az 3 karakter." });
    const zaman = simdi();
    const s = topluDurum(req, ids, "arsiv", "reddedildi: " + neden.slice(0, 280),
      ek => Object.assign({}, ek, { red: { neden, zaman, yapan: String(req.kullanici.id) } }), "soru-bankasi.reddet", { toplu: ids.length, neden });
    return { ok: true, reddedilen: s.islenen.length, atlanan: s.atlanan, sorular: s.islenen };
  });

  r.post("/api/admin/soru-bankasi/soru/:id/geri-yukle", req => {
    yoneticiGerekli(req);
    const eski = tek(req.params.id);
    if (!eski) throw new HttpHata(404, "Soru bulunamadı.");
    const hs = Number(req.body && req.body.surum);
    const h = db.prepare("SELECT veri FROM questions_bank_history WHERE soru_id = ? AND surum = ?").get(eski.id, hs);
    if (!h) throw new HttpHata(404, "Bu sürüm bulunamadı.");
    const hedef = icerik(jsonCoz(h.veri, {}));
    let s;
    islem(db, () => { s = surumYaz(db, st, eski, Object.assign({}, eski, hedef), req.kullanici.id, "sürüm " + hs + " geri yüklendi"); });
    denetim({ eylem: "soru-bankasi.geri-yukle", yapan: req.kullanici.id, istek: req, varlik: "questions_bank", varlikId: eski.id, ayrinti: { kaynakSurum: hs, yeniSurum: s.surum, fark: s.fark } });
    return { ok: true, surum: s.surum, fark: s.fark };
  });

  r.get("/api/admin/soru-bankasi/disa-aktar", (req, res) => {
    yoneticiGerekli(req);
    const sart = [], p = [];
    const tur = kirp(req.sorgu.get("tur")), sayfa = kirp(req.sorgu.get("sayfa"));
    if (tur) { sart.push("tur = ?"); p.push(tur); }
    if (sayfa) { sart.push("sayfa = ?"); p.push(sayfaAd(sayfa)); }
    const satirlar = db.prepare("SELECT * FROM questions_bank" + (sart.length ? " WHERE " + sart.join(" AND ") : "") + " ORDER BY rowid").all(...p).map(satirCoz)
      .map(x => Object.assign({ id: x.id }, icerik(x), { surum: x.surum, guncelleme: x.guncelleme }));
    denetim({ eylem: "soru-bankasi.disa-aktar", yapan: req.kullanici.id, istek: req, ayrinti: { tur: tur || null, sayfa: sayfa || null, adet: satirlar.length } });
    res.setHeader("Content-Disposition", 'attachment; filename="meberra-soru-bankasi-' + simdi().slice(0, 10) + '.json"');
    return { surum: 1, olusturma: simdi(), aciklama: "Meberra soru bankası dışa aktarımı (server/tohum/soru-bankasi.json ile aynı biçim)", sorular: satirlar };
  });

  return { sinir };
}

module.exports = { soruBankasiRotalari, konuKodu, tohumUpsert, tohumSekilleri, tohumYukleGerekirse, tohumEsitle, tohumSurumOku, yoneticiDuzenledi, acikSoru, cozumOf, ogrenciEk, soruSec, satirCoz,
  TOHUM, TOHUM_AYAR, DEMO_ID };
