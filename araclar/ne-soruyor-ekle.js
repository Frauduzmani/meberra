// Meberra 1.25.0 — MCQ "Ne soruyor?" cümlelerini (ek.neSoruyor) soru bankası tohumuna ekler.
// Girdi: { "<soru id>": "<Türkçe tek cümle>" } dosyaları (cevabı bilmeyen yazar üretir).
// Her cümle denetlenir; sorunlu olan (cevap sızıntısı, uzunluk, HTML/$) EKLENMEZ ve raporlanır:
//   - doğru şıkka özgü kelime (≥ 5 harf; kökte ve diğer şıklarda geçmeyen) cümlede geçiyorsa → sızıntı
//   - doğru şıktaki, kökte geçmeyen bir sayı cümlede geçiyorsa → sızıntı
// Var olan ek.neSoruyor değişmez (--zorla ile değişir). Bir şey eklenirse tohum surum +1.
// Kullanım: node araclar/ne-soruyor-ekle.js <dosya...> [--zorla] [--kuru]
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TOHUM = path.join(ROOT, "server", "tohum", "soru-bankasi.json");
const ENCOK = 220;

const duz = s => String(s == null ? "" : s).replace(/\\\(.*?\\\)|\\\[.*?\\\]/gs, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").toLowerCase();
const sozcukler = s => new Set((duz(s).match(/[a-zÀ-ɏ]{5,}/g) || []));
const sayilar = s => new Set((duz(s).match(/\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(",", ".")));

function sorunlar(q, cumle) {
  const s = [];
  const c = String(cumle == null ? "" : cumle).trim();
  if (!c) return ["boş"];
  if (c.length > ENCOK) s.push("çok uzun (" + c.length + " > " + ENCOK + ")");
  if (/[<>]/.test(c)) s.push("HTML/< > yasak");
  if (/\$/.test(c)) s.push("$ yasak");
  if (/[\u0000-\u0009\u000b\u000c\u000e-\u001f]/.test(c)) s.push("kontrol karakteri");
  const dogru = (q.secenekler || []).find(o => o.id === q.dogru);
  if (dogru) {
    const kok = sozcukler(q.govde), digerleri = new Set();
    (q.secenekler || []).filter(o => o !== dogru).forEach(o => sozcukler(o.text).forEach(w => digerleri.add(w)));
    const ozel = [...sozcukler(dogru.text)].filter(w => !kok.has(w) && !digerleri.has(w));
    const cs = sozcukler(c); // tam kelime: "because" içindeki "cause" sızıntı değildir
    const bulunan = ozel.filter(w => cs.has(w));
    if (bulunan.length) s.push("sızıntı: doğru şıkka özgü kelime(ler) " + bulunan.join(", "));
    const kokSayi = sayilar(q.govde), cSayi = sayilar(c);
    const sz = [...sayilar(dogru.text)].filter(n => !kokSayi.has(n) && cSayi.has(n));
    if (sz.length) s.push("sızıntı: doğru şıktaki sayı " + sz.join(", "));
  }
  return s;
}

function uygula(tohum0, cumleler, secenek) {
  const zorla = !!(secenek && secenek.zorla);
  const tohum = JSON.parse(JSON.stringify(tohum0));
  const M = new Map(tohum.sorular.map(q => [q.id, q]));
  let eklenen = 0, korunan = 0;
  const atlanan = [], bilinmeyen = [];
  Object.keys(cumleler).forEach(id => {
    const q = M.get(id);
    if (!q) { bilinmeyen.push(id); return; }
    const c = String(cumleler[id] || "").trim();
    const s = sorunlar(q, c);
    if (s.length) { atlanan.push({ id, sorun: s }); return; }
    const ek = q.ek || {};
    if (ek.neSoruyor && !zorla) { if (ek.neSoruyor !== c) korunan++; return; }
    if (ek.neSoruyor === c) return;
    q.ek = Object.assign({}, ek, { neSoruyor: c });
    eklenen++;
  });
  if (eklenen) tohum.surum = (Number(tohum.surum) || 1) + 1;
  return { tohum: eklenen ? tohum : tohum0, eklenen, korunan, atlanan, bilinmeyen };
}

module.exports = { sorunlar, uygula };

if (require.main === module) {
  const dosyalar = process.argv.slice(2).filter(a => !/^--/.test(a));
  if (!dosyalar.length) { console.error("Kullanım: node araclar/ne-soruyor-ekle.js <dosya...> [--zorla] [--kuru]"); process.exit(2); }
  const cumleler = {};
  dosyalar.forEach(d => Object.assign(cumleler, JSON.parse(fs.readFileSync(path.resolve(d), "utf8"))));
  const t = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
  const r = uygula(t, cumleler, { zorla: process.argv.includes("--zorla") });
  r.atlanan.forEach(a => console.log("✗ " + a.id + ": " + a.sorun.join("; ")));
  if (r.bilinmeyen.length) console.log("? bilinmeyen id: " + r.bilinmeyen.slice(0, 20).join(", ") + (r.bilinmeyen.length > 20 ? " …" : ""));
  console.log(`${Object.keys(cumleler).length} cümle: ${r.eklenen} eklenecek, ${r.atlanan.length} atlandı (sorunlu), ${r.korunan} korundu, ${r.bilinmeyen.length} bilinmeyen` +
    (r.eklenen ? `; tohum sürümü ${t.surum} → ${r.tohum.surum}` : ""));
  if (!process.argv.includes("--kuru") && r.eklenen) { fs.writeFileSync(TOHUM, JSON.stringify(r.tohum, null, 1) + "\n", "utf8"); console.log("yazıldı: server/tohum/soru-bankasi.json"); }
}
