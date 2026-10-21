// AP MEBERRA — Proje adı denetimi (12 Ekim 2026, kullanıcı kararı: "AP AZRA" → "AP MEBERRA", "Azra" → "Meberra").
// Kullanım (proje klasöründen): node araclar/ad-denetimi.js
// Proje klasöründeki TÜM metin dosyalarını tarar; eski adın kalmış olduğu her satırı dosya:satır olarak yazar.
// Teslim şartı: "0 sorun".
//
// İzinli istisnalar (spec §9):
//  - Klasör yolu: projelerim/AP AZRA, projelerim\AP AZRA, AP%20AZRA, ...-projelerim-AP-AZRA (scratchpad yolu)
//  - Tur 10 (14 Ekim 2026, kullanıcı onayı): kod adları da taşındı (apazra: -> apmeberra:, APAZRA_* -> APMEBERRA_*).
//    Artık "apazra" / "APAZRA" de eski ad sayılır. Bilinçli istisnalar yalnızca aşağıdaki KOD_ADI_IZIN listesindedir.
//  - Ad değişikliğini belgeleyen satırlar: aynı satırda yeni ad (MEBERRA / Meberra) da geçiyorsa
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", "vendor", ".git", "sunum", "arsiv"]);
const TEXT_EXT = /\.(html?|js|mjs|cjs|css|md|txt|json|ps1|sha256|csv|svg|xml|ya?ml)$/i;
const PATH_ALLOW = [
  /projelerim[\\/]+AP AZRA/gi,
  /Desktop[\\/]+AP AZRA/gi,          // eski klasör yolu (tarihsel kayıt)
  /projelerim[\\/]+AP%20AZRA/gi,
  /AP%20AZRA/gi,
  /projelerim-AP-AZRA/gi
];
const BAD = [
  { ad: "eski proje adı", re: /(?<![\p{L}_])AP[\s\-]+AZRA(?!\p{L})/iu },
  { ad: "eski öğrenci adı", re: /(?<!\p{L})Azra(?!\p{L})/u },
  { ad: "eski ad (büyük harf)", re: /(?<!\p{L})AZRA(?!\p{L})/u }
];
const NEW_NAME = /MEBERRA|Meberra/;
// Eski kod adı (Tur 10): "apazra" / "APAZRA" her yerde sorundur; NEW_NAME istisnası bu kurala UYGULANMAZ
// (ör. "apmeberra" satırında eski "apazra" kalmışsa yine yakalanır).
const KOD_ADI = { ad: "eski kod adı (apazra/APAZRA)", re: /apazra/i };
// Bilinçli istisnalar: { dosya, desen, neden } — desen satırdan silinir, sonra kural uygulanır.
const KOD_ADI_IZIN = [
  { dosya: "assets/js/app.js", desen: /"apazra[^"\s]*"/gi, neden: "taşıma kodu ve eski yedek desteği: eski önek/format adları (APMEBERRA_TASIMA, ESKI_PREFIX, ESKI_FORMAT)" },
  { dosya: "araclar/testler/eski/tasima-test.js", desen: /apazra/gi, neden: "taşıma testi: tarayıcı eski anahtarlarla tohumlanır" },
  { dosya: "proje.md", desen: /apazra/gi, neden: "tarihsel tek kayıt (PM tutar; ajanlar dokunmaz): taşıma öncesi kod adlarını belgeler" },
  { dosya: "DEVAM-NOKTASI.md", desen: /apazra/gi, neden: "oturum özeti (PM tutar; ajanlar dokunmaz)" }
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT, []);
const sorunlar = [];
const adSorunlari = [];
let taranan = 0;

for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  if (/AZRA/i.test(path.basename(f)) && !/^araclar\/ad-denetimi\.js$/.test(rel)) adSorunlari.push(rel);
  if (!TEXT_EXT.test(f)) continue;
  if (rel === "araclar/ad-denetimi.js") continue; // bu dosya desenleri tanımlar
  taranan++;
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    let l = line;
    for (const re of PATH_ALLOW) l = l.replace(re, "<YOL>");
    let k = l;
    for (const iz of KOD_ADI_IZIN) if (iz.dosya === rel) k = k.replace(iz.desen, "<IZINLI>");
    const km = k.match(KOD_ADI.re);
    if (km) { sorunlar.push(`${rel}:${i + 1}: ${KOD_ADI.ad} → "${line.trim().slice(Math.max(0, km.index - 40), km.index + 60)}"`); return; }
    if (NEW_NAME.test(l)) return; // ad değişikliğini belgeleyen satır
    for (const b of BAD) {
      const m = l.match(b.re);
      if (m) { sorunlar.push(`${rel}:${i + 1}: ${b.ad} → "${line.trim().slice(Math.max(0, m.index - 40), m.index + 60)}"`); break; }
    }
  });
}

console.log(`Taranan metin dosyası: ${taranan} (atlanan klasörler: ${[...SKIP_DIRS].join(", ")})`);
if (adSorunlari.length) {
  console.log(`\nDosya adında eski ad (${adSorunlari.length}):`);
  adSorunlari.forEach(s => console.log("  ✗ " + s));
}
if (sorunlar.length) {
  console.log(`\nİçerikte eski ad (${sorunlar.length}):`);
  sorunlar.forEach(s => console.log("  ✗ " + s));
}
const toplam = sorunlar.length + adSorunlari.length;
console.log(`\nAD DENETİMİ: ${toplam} sorun`);
process.exit(toplam ? 1 : 0);
