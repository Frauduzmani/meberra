// Meberra 1.25.0 — A2 İngilizce köprüsü sözlüğünü üretir: data/sozluk/ap-sozluk.json
// Kaynaklar: araclar/sozluk/kelimeler.json (soru kökü/şıklarındaki ≥ 3 kez geçen kelimeler; { kelime: { tr, t, l } })
//            data/dersler/<ders>/unite-<n>.json konu "terimler" [{ en, tr }] — çok kelimeli olanlar "ifadeler"e, tek kelimeler eksikse "kelimeler"e (t: ap)
// Kullanım: node araclar/sozluk-olustur.js            (yazar)
//           node araclar/sozluk-olustur.js --kontrol  (dosya güncel değilse 1 ile çıkar)
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CIKTI = path.join(ROOT, "data", "sozluk", "ap-sozluk.json");
const ATLA = new Set(["atc", "nsted"]); // anlamsız parça (ayrıştırma artığı)
const TURLER = ["temel", "akademik", "ap"];

function olustur(kok) {
  const R = kok || ROOT;
  const ham = JSON.parse(fs.readFileSync(path.join(R, "araclar", "sozluk", "kelimeler.json"), "utf8"));
  const kelimeler = {}, ifadeler = {}, sorun = [];
  Object.keys(ham).sort().forEach(w => {
    const e = ham[w];
    if (ATLA.has(w) || /-$/.test(w) || !e || !String(e.tr || "").trim()) return;
    if (TURLER.indexOf(e.t) < 0) sorun.push(w + ": tür " + e.t);
    const o = { tr: String(e.tr).trim(), t: e.t };
    if (e.l && e.l !== w) o.l = e.l;
    kelimeler[w] = o;
  });
  const DD = path.join(R, "data", "dersler");
  fs.readdirSync(DD).filter(d => fs.statSync(path.join(DD, d)).isDirectory()).sort().forEach(d => {
    fs.readdirSync(path.join(DD, d)).filter(f => /\.json$/.test(f)).sort().forEach(f => {
      JSON.parse(fs.readFileSync(path.join(DD, d, f), "utf8")).konular.forEach(k => (k.terimler || []).forEach(t => {
        const en = String(t.en || "").toLowerCase().replace(/\s*\([^)]*\)\s*/g, " ").replace(/[^a-z0-9' -]/g, " ").replace(/\s+/g, " ").trim();
        const tr = String(t.tr || "").trim();
        if (!en || !tr || tr.length > 80) return;
        if (/\s/.test(en)) { if (!ifadeler[en]) ifadeler[en] = tr; }
        else if (!kelimeler[en] && en.length > 1) kelimeler[en] = { tr: tr, t: "ap" };
      }));
    });
  });
  const ifs = {};
  Object.keys(ifadeler).sort().forEach(k => { ifs[k] = ifadeler[k]; });
  const ks = {};
  Object.keys(kelimeler).sort().forEach(k => { ks[k] = kelimeler[k]; });
  return { veri: { surum: 1, aciklama: "Meberra A2 İngilizce köprüsü sözlüğü (üretilir: node araclar/sozluk-olustur.js)", kelimeler: ks, ifadeler: ifs }, sorun };
}
const metin = v => JSON.stringify(v) + "\n";

module.exports = { olustur, CIKTI, metin };

if (require.main === module) {
  const r = olustur();
  r.sorun.forEach(s => console.log("✗ " + s));
  const yeni = metin(r.veri);
  if (process.argv.includes("--kontrol")) {
    const guncel = fs.existsSync(CIKTI) && fs.readFileSync(CIKTI, "utf8") === yeni;
    console.log(`SÖZLÜK: ${Object.keys(r.veri.kelimeler).length} kelime, ${Object.keys(r.veri.ifadeler).length} ifade, ${r.sorun.length} sorun, ${guncel ? "güncel" : "GÜNCEL DEĞİL"}`);
    process.exit(r.sorun.length || !guncel ? 1 : 0);
  }
  fs.mkdirSync(path.dirname(CIKTI), { recursive: true });
  fs.writeFileSync(CIKTI, yeni, "utf8");
  console.log(`yazıldı: data/sozluk/ap-sozluk.json — ${Object.keys(r.veri.kelimeler).length} kelime, ${Object.keys(r.veri.ifadeler).length} ifade, ${Math.round(yeni.length / 1024)} KB`);
}
