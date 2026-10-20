// AP MEBERRA — Hazır teyit e-postası taslakları üreticisi (Ajan 11, Tur 12; plan .agents/rules/tur12-ekran-plani.md Y2–Y5)
// Kullanım (proje klasöründen): node araclar/teyit-taslak-olustur.js [--kuru]
// Girdi : .agents/mevzuat/teyit-taslaklari-tur11.json  ({olusturma, sayi, taslaklar: [{ulke, tur, kime, konu, metin}]}, Ajan 13)
// Çıktı : data/kocluk/teyit-taslaklari.js              (window.APMEBERRA_TEYIT_TASLAKLARI; ELLE DÜZENLENMEZ)
// Kurallar:
//  - Alıcı e-postası (Y3): "kime" metnindeki adres yalnızca data/mevzuat/kaynak/*.json içinde kaynak URL'li bir maddede
//    geçiyorsa `eposta` olur (kaynağıyla). Geçmiyorsa `adresAdayi` olarak kalır; arayüz bunu mailto'ya YAZMAZ.
//  - Kişisel veri (Y4): metinde öğrenci adı, kaynaksız e-posta adresi, telefon numarası ya da adı geçen kişi hitabı
//    varsa üretim durur (çıkış kodu 1). [Name] gibi yer tutucular kalır ve sayılır.
//  - Şema hatasında dosya yazılmaz.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GIRDI = path.join(ROOT, ".agents", "mevzuat", "teyit-taslaklari-tur11.json");
const KAYNAK_DIR = path.join(ROOT, "data", "mevzuat", "kaynak");
const CIKTI = path.join(ROOT, "data", "kocluk", "teyit-taslaklari.js");
const KURU = process.argv.includes("--kuru");

const ULKELER = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];
/** "genel" taslaklarda kime alanı kod olarak gelir; kişi adı değil, kurum türü etiketi. */
const GENEL_KIME = {
  "valilik": "Bulunduğun ilin valiliği / kaymakamlık (apostil birimi)",
  "universite-ogrenci-isleri": "Mezun olduğun üniversitenin öğrenci işleri daire başkanlığı",
  "egitim-musavirligi": "Türkiye'nin hedef ülkedeki eğitim müşavirliği / ataşeliği",
  "meb-yyegm": "MEB Yükseköğretim ve Yurt Dışı Eğitim Genel Müdürlüğü",
  "emjm-konsorsiyum": "Erasmus Mundus ortak yüksek lisans programının konsorsiyum ofisi"
};
const EPOSTA_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const YASAK = [
  { ad: "öğrenci adı", re: /\b(Meberra|Azra)\b/i },
  { ad: "telefon numarası", re: /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/ },
  { ad: "adı geçen kişiye hitap", re: /\b(Dear|Sehr geehrte[rs]?|Gentile|Estimad[oa]s?|Sayın)\s+(Mr|Ms|Mrs|Dr|Prof|Herr|Frau|Dott(?:ssa)?|Sr|Sra|Bay|Bayan)\.?\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+/ }
];

function dilBul(metin) {
  const ilk = String(metin).split("\n")[0];
  if (/^(Sehr geehrte|Guten Tag|Liebe)/.test(ilk)) return "de";
  if (/^(Gentile|Spettabile|Egregi)/.test(ilk)) return "it";
  if (/^(Madame|Monsieur|Bonjour|Mesdames)/.test(ilk)) return "fr";
  if (/^(Estimad|Buenos)/.test(ilk)) return "es";
  if (/^Sayın/.test(ilk)) return "tr";
  return "en";
}

/** Kaynak JSON'larında, kaynak URL'li maddelerde geçen e-posta adresleri -> {adres: {url, ad, madde}} */
function kaynakliAdresler() {
  const out = {};
  if (!fs.existsSync(KAYNAK_DIR)) return out;
  for (const fn of fs.readdirSync(KAYNAK_DIR).filter(f => f.endsWith(".json"))) {
    const j = JSON.parse(fs.readFileSync(path.join(KAYNAK_DIR, fn), "utf8"));
    (function rec(o) {
      if (Array.isArray(o)) return o.forEach(rec);
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o.teyitTaslaklari)) { Object.keys(o).filter(k => k !== "teyitTaslaklari").forEach(k => rec(o[k])); return; }
      const urller = (Array.isArray(o.kaynak) ? o.kaynak : (o.kaynak ? [o.kaynak] : [])).map(k => typeof k === "string" ? { url: k } : k).filter(k => k && /^https?:\/\//.test(k.url || ""));
      if (o.id && urller.length) {
        const s = JSON.stringify(Object.assign({}, o, { kaynak: undefined }));
        (s.match(EPOSTA_RE) || []).forEach(a => { const k = a.toLowerCase(); if (!out[k]) out[k] = { url: urller[0].url, ad: urller[0].ad || "", madde: o.id, dosya: fn }; });
        return;
      }
      Object.keys(o).forEach(k => rec(o[k]));
    })(j);
  }
  return out;
}

function uret() {
  const ham = JSON.parse(fs.readFileSync(GIRDI, "utf8"));
  const liste = Array.isArray(ham.taslaklar) ? ham.taslaklar : [];
  const adresler = kaynakliAdresler();
  const sorunlar = [], sayac = {};
  const taslaklar = liste.map((t, i) => {
    const yer = "[" + i + "]";
    ["ulke", "tur", "kime", "konu", "metin"].forEach(k => { if (typeof t[k] !== "string" || !t[k].trim()) sorunlar.push(yer + " " + k + " eksik"); });
    if (t.ulke !== "genel" && ULKELER.indexOf(t.ulke) < 0) sorunlar.push(yer + " ulke tanınmadı: " + t.ulke);
    if (["lisans", "yl"].indexOf(t.tur) < 0) sorunlar.push(yer + " tur lisans|yl olmalı: " + t.tur);
    const anahtar = t.ulke + "-" + (t.tur === "yl" ? "yl" : "l");
    sayac[anahtar] = (sayac[anahtar] || 0) + 1;
    const id = "tt-" + anahtar + "-" + sayac[anahtar];
    const kimeHam = String(t.kime || "").trim();
    const adresKime = (kimeHam.match(EPOSTA_RE) || [])[0] || null;
    let kime = t.ulke === "genel" && GENEL_KIME[kimeHam] ? GENEL_KIME[kimeHam] : kimeHam;
    if (t.ulke === "genel" && !GENEL_KIME[kimeHam] && /^[a-z-]+$/.test(kimeHam)) sorunlar.push(yer + " genel alıcı kodu etiketsiz: " + kimeHam);
    if (adresKime) kime = kime.replace(/\s*\(\s*[^()]*@[^()]*\)\s*/, " ").replace(/\s{2,}/g, " ").trim();
    const metin = String(t.metin || "").replace(/\r\n?/g, "\n");
    const konu = String(t.konu || "").replace(/\s*[\r\n]+\s*/g, " ").trim();
    // Kişisel veri denetimi
    YASAK.forEach(y => { if (y.re.test(konu + "\n" + metin)) sorunlar.push(yer + " " + id + ": metinde " + y.ad); });
    (metin.match(EPOSTA_RE) || []).forEach(a => { if (!adresKime || a.toLowerCase() !== adresKime.toLowerCase()) sorunlar.push(yer + " " + id + ": metinde e-posta adresi (" + a + ")"); });
    const kay = adresKime ? adresler[adresKime.toLowerCase()] : null;
    const yerTutucular = (metin.match(/\[[^\]\n]{1,80}\]/g) || []).filter((x, j, a) => a.indexOf(x) === j);
    return {
      id: id,
      ulke: t.ulke,
      duzey: t.tur === "yl" ? "yl" : "lisans",
      modeller: t.tur === "yl" ? ["uni-mezun"] : ["lise", "lise-mezun"],
      kime: kime,
      eposta: kay ? adresKime : null,
      epostaKaynak: kay ? { ad: kay.ad || "Resmi kaynak", url: kay.url } : null,
      adresAdayi: adresKime && !kay ? adresKime : null,
      dil: dilBul(metin),
      konu: konu,
      metin: metin,
      yerTutucular: yerTutucular
    };
  });
  const ids = {};
  taslaklar.forEach(t => { if (ids[t.id]) sorunlar.push("tekrar eden id " + t.id); ids[t.id] = 1; });
  if (typeof ham.sayi === "number" && ham.sayi !== taslaklar.length) sorunlar.push("girdi sayi alanı (" + ham.sayi + ") taslak sayısıyla (" + taslaklar.length + ") uyuşmuyor");
  return { taslaklar, sorunlar, olusturma: ham.olusturma || null };
}

function yazilacak(r) {
  const veri = {
    surum: "1.0.0",
    kaynak: ".agents/mevzuat/teyit-taslaklari-tur11.json (Ajan 13, Tur 11)",
    olusturma: r.olusturma,
    sayi: r.taslaklar.length,
    taslaklar: r.taslaklar
  };
  return "// AP MEBERRA — Hazır teyit e-postası taslakları (Tur 12). ÜRETİLMİŞ DOSYA: elle düzenlemeyin.\n" +
    "// Üretici: node araclar/teyit-taslak-olustur.js · Girdi: .agents/mevzuat/teyit-taslaklari-tur11.json (Ajan 13).\n" +
    "// eposta yalnızca data/mevzuat/kaynak/*.json içinde kaynaklı bir maddede geçen adrestir (epostaKaynak); adresAdayi mailto'ya yazılmaz.\n" +
    "window.APMEBERRA_TEYIT_TASLAKLARI = " + JSON.stringify(veri, null, 1) + ";\n";
}

function calistir() {
  const r = uret();
  const say = {}; r.taslaklar.forEach(t => { const k = t.ulke + "/" + t.duzey; say[k] = (say[k] || 0) + 1; });
  console.log("Taslak: " + r.taslaklar.length + " · kaynaklı alıcı adresi: " + r.taslaklar.filter(t => t.eposta).length + " · kaynaksız adres adayı: " + r.taslaklar.filter(t => t.adresAdayi).length);
  console.log("Dağılım: " + Object.keys(say).map(k => k + "=" + say[k]).join(" "));
  if (r.sorunlar.length) { console.log("Sorunlar (" + r.sorunlar.length + "):"); r.sorunlar.forEach(s => console.log("  ✗ " + s)); console.log("Dosya YAZILMADI."); return 1; }
  const metin = yazilacak(r);
  if (KURU) { console.log("--kuru: yazılmadı (0 sorun)."); return 0; }
  fs.writeFileSync(CIKTI, metin, "utf8");
  console.log("Yazıldı: " + path.relative(ROOT, CIKTI).replace(/\\/g, "/") + " · 0 sorun");
  return 0;
}

if (require.main === module) process.exit(calistir());
module.exports = { uret, yazilacak, dilBul, kaynakliAdresler, GENEL_KIME };
