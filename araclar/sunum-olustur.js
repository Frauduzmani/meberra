// AP MEBERRA — Sunum (taşınabilir teslim) paketi oluşturucu
// Kullanım (proje klasöründen):  node araclar/sunum-olustur.js [--zorla]
//
// Üretir:  sunum/AP-MEBERRA/            → açılmış, çevrimdışı çalışan paket
//          sunum/AP-MEBERRA-Sunum-<tarih>.zip  → iletilecek tek dosya
// Adımlar: PM denetimi → kopyalama → MathJax'i yerelleştirme → yerel bağlantı kontrolü
//          → SHA-256 bütünlük listesi → zip → zip'i açıp her dosyanın hash'ini yeniden doğrulama.
// --zorla: PM denetimi sorun bulsa da paketi üretir (önerilmez).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_BASE = path.join(ROOT, "sunum");
const PKG_NAME = "AP-MEBERRA";
const PKG = path.join(OUT_BASE, PKG_NAME);
const TAR = "C:\\Windows\\System32\\tar.exe"; // bsdtar: Windows 10+ ile gelir, zip yazar/okur
const MATHJAX_CDN = /https:\/\/cdn\.jsdelivr\.net\/npm\/mathjax@3[^"']*\/es5\/(tex-svg|tex-mml-chtml)\.js/g;
const force = process.argv.includes("--zorla");

const log = (...a) => console.log(...a);
const rel = p => path.relative(PKG, p).split(path.sep).join("/");
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const copy = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); };
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

// 1. PM Doğruluk Kapısı
log("1/7 PM denetimi çalışıyor…");
const audit = spawnSync(process.execPath, [path.join(__dirname, "pm-denetim.js")], { encoding: "utf8" });
const auditOut = audit.stdout.trim();
const auditSummary = auditOut.split("\n").pop();
log("    " + auditSummary);
if (audit.status !== 0 && !force) {
  log(auditOut);
  log("\n✗ Paket üretilmedi: PM denetimi sorun buldu. Sorunları düzeltin ya da --zorla kullanın.");
  process.exit(1);
}

// 2. Temiz klasör (yalnızca sunum/AP-MEBERRA silinir; önceki zip'ler korunur)
log("2/7 Paket klasörü hazırlanıyor…");
if (!PKG.startsWith(OUT_BASE + path.sep)) throw new Error("güvenlik: beklenmeyen çıktı yolu");
fs.rmSync(PKG, { recursive: true, force: true });
fs.mkdirSync(PKG, { recursive: true });

// 3. Portal dosyaları + MathJax yerelleştirme
log("3/7 Portal kopyalanıyor ve MathJax yerelleştiriliyor…");
const PORTAL = path.join(PKG, "portal");
const portalFiles = fs.readdirSync(ROOT).filter(f => /\.(html|css|js)$/.test(f));
let mathjaxPages = 0;
for (const f of portalFiles) {
  const src = path.join(ROOT, f), dst = path.join(PORTAL, f);
  if (f.endsWith(".html")) {
    let html = fs.readFileSync(src, "utf8");
    if (html.match(MATHJAX_CDN)) mathjaxPages++;
    html = html.replace(MATHJAX_CDN, "vendor/mathjax/tex-svg.js");
    // Pakette belgeler portal/ yanında değil, belgeler/ altında.
    html = html.replace(/\b(href|src)="(proje\.md|AGENTS\.md)([#?][^"]*)?"/g, (m, attr, doc, rest = "") => `${attr}="../belgeler/${doc}${rest}"`);
    // Tur 12: kaynak PDF'ler pakette portal/ yanında değil, kaynak-pdf/ altında.
    html = html.replace(/\b(href|src)="kaynaklar\/pdf\//g, (m, attr) => `${attr}="../kaynak-pdf/`);
    fs.mkdirSync(PORTAL, { recursive: true });
    fs.writeFileSync(dst, html);
  } else copy(src, dst);
}
// Portalın çalışma zamanı klasörleri. Geliştirme amaçlı "_" önekli örnek veriler pakete girmez.
for (const dir of ["data", "assets"]) { // HARITA.md §1: assets/css, assets/js, data/<alt klasör>
  const src = path.join(ROOT, dir);
  if (!fs.existsSync(src)) continue;
  for (const f of walk(src)) {
    if (path.basename(f).startsWith("_")) continue;
    // Tur 11 (D8): data/mevzuat/kaynak/ üreticinin girdisidir; sayfalar okumaz, pakete girmez
    if (path.relative(src, f).split(path.sep).slice(0, 2).join("/") === "mevzuat/kaynak") continue;
    copy(f, path.join(PORTAL, dir, path.relative(src, f)));
  }
}
for (const f of walk(path.join(__dirname, "vendor", "mathjax"))) copy(f, path.join(PORTAL, "vendor", "mathjax", path.basename(f)));
log(`    ${portalFiles.length} dosya, ${mathjaxPages} sayfada MathJax yerel kopyaya bağlandı`);

// 4. Belgeler ve kaynak PDF'ler (bağlantı kontrolünden önce: portal bunlara bağlantı veriyor)
log("4/7 Belgeler ve PDF kaynaklar ekleniyor…");
const DOCS = path.join(PKG, "belgeler");
for (const f of ["proje.md", "AGENTS.md"]) copy(path.join(ROOT, f), path.join(DOCS, f));
copy(path.join(ROOT, ".agents", "rules", "agent-roster.md"), path.join(DOCS, "agent-roster.md"));
for (const f of walk(path.join(ROOT, "belgeler", "hibe"))) copy(f, path.join(DOCS, "hibe-modulleri", path.basename(f)));
for (const f of ["pm-denetim.js", "sunum-olustur.js"]) copy(path.join(__dirname, f), path.join(DOCS, "araclar", f));
const PDF_DIR = path.join(ROOT, "kaynaklar", "pdf");
// Tur 12 (16 Ekim 2026): kaynaklar/pdf/kaynak-listesi.json varsa yalnızca paket !== false olan PDF'ler girer.
// Ticari kitaplar (telifli) ve büyük çalışma kılavuzları yerelde kalır; listede olmayan PDF varsayılan olarak girer.
const LISTE = path.join(PDF_DIR, "kaynak-listesi.json");
const paketDisi = new Set();
if (fs.existsSync(LISTE)) {
  const l = JSON.parse(fs.readFileSync(LISTE, "utf8"));
  for (const k of (Array.isArray(l) ? l : l.kaynaklar || [])) if (k && k.paket === false) paketDisi.add(k.dosya);
}
const pdfs = fs.existsSync(PDF_DIR) ? fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith(".pdf") && !paketDisi.has(f)) : [];
for (const f of pdfs) copy(path.join(PDF_DIR, f), path.join(PKG, "kaynak-pdf", f));
log(`    ${pdfs.length} PDF pakete girdi, ${paketDisi.size} PDF yerelde kaldı (kaynak-listesi.json: paket=false)`);

// 5. Yerel bağlantı kontrolü (paket içinde kırık bağlantı kalmasın)
log("5/7 Yerel bağlantılar kontrol ediliyor…");
const broken = [];
for (const f of walk(PORTAL).filter(f => f.endsWith(".html"))) {
  const html = fs.readFileSync(f, "utf8");
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|#|javascript:|data:)/.test(url) || /['+$`{]/.test(url)) continue; // dış bağlantı ya da JS şablonu
    const target = path.join(path.dirname(f), decodeURI(url.split(/[?#]/)[0]));
    if (!fs.existsSync(target)) broken.push(`${rel(f)} → ${url}`);
  }
  if (/cdn\.jsdelivr\.net\/npm\/mathjax/.test(html)) broken.push(`${rel(f)} → MathJax hâlâ CDN'den`);
}
if (broken.length) { log("✗ Kırık bağlantılar:\n  " + broken.join("\n  ")); process.exit(1); }
log("    kırık bağlantı yok");

// 6. Giriş sayfası, BENIOKU ve bütünlük listesi
log("6/7 BENIOKU ve SHA-256 bütünlük listesi yazılıyor…");
const now = new Date();
// Yerel tarih (Türkiye). toISOString UTC verir; gece yarısından sonra önceki günün paketinin üzerine yazıyordu (Tur 12 düzeltmesi).
const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const countMatch = auditSummary.match(/(\d+) soru/);
fs.writeFileSync(path.join(PKG, "BASLA.html"), `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AP MEBERRA — Başla</title><meta http-equiv="refresh" content="0; url=portal/index.html">
<style>body{font-family:"Segoe UI",system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 16px;line-height:1.6;color:#1f2937;background:#fff}
@media (prefers-color-scheme:dark){body{color:#e5e7eb;background:#111827}a{color:#93c5fd}}</style></head>
<body><h1>AP MEBERRA Portalı</h1><p>Portal açılıyor… Açılmazsa <a href="portal/index.html">buraya tıklayın</a>.</p></body></html>
`);

const readme = `AP MEBERRA — TAŞINABİLİR SUNUM PAKETİ
===================================
Paket tarihi : ${now.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
Soru bankası : ${countMatch ? countMatch[1] : "?"} interaktif soru (PM denetimi: ${auditSummary.replace(/^TOPLAM:\s*/, "")})
İnternet     : Gerekmez. Formül motoru (MathJax 3.2.2) pakete dahildir. Yalnızca resmi sitelere giden
               kaynak bağlantıları internet ister.

NASIL AÇILIR?
  1. Zip dosyasını bir klasöre ÇIKARIN (zip içinden doğrudan açmayın).
  2. "BASLA.html" dosyasına çift tıklayın (Chrome, Edge veya Firefox).
  3. AP sınav kaydından ÖNCE: menüden "Seviye Testi"ni çözün. Rapor; ünite bazında hazırlık,
     sınava kalan sürede açığın kapanıp kapanmayacağı, kayıt önerisi ve kayıt/sınav günü
     kontrol listesini verir. (Rapor AP puanı tahmini değildir; bir planlama aracıdır.)

KLASÖRLER
  BASLA.html          Portalı açar
  portal/             Web portalı (ders sayfaları, soru bankası, Bilgi Merkezi, İlerleme)
  belgeler/           proje.md (ana plan), AGENTS.md (ajan sistemi), ajan kadrosu, hibe modülleri, araçlar
  kaynak-pdf/         Projede kullanılan PDF kılavuzlar
  BUTUNLUK.sha256     Her dosyanın SHA-256 parmak izi
  dogrula.ps1         Windows bütünlük kontrolü

İLERLEMEYİ TAŞIMA (VERİ KAYBI OLMASIN)
  Çözülen sorular ve Hata Defteri tarayıcının hafızasında tutulur; paketin içinde değildir.
  Başka bir bilgisayara ya da tarayıcıya geçerken:
    • Eski yerde: portal → İlerleme → "İlerlemeyi dosyaya aktar" (.json dosyası iner)
    • Yeni yerde: portal → İlerleme → "Dosyadan yükle" → "Birleştir"
  Tarayıcı geçmişini/site verilerini temizlemeden önce de yedek alın.

BÜTÜNLÜK KONTROLÜ (dosyalar eksiksiz ve bozulmamış mı?)
  Windows : klasörde sağ tık → "Terminalde aç" →  powershell -ExecutionPolicy Bypass -File .\\dogrula.ps1
  macOS/Linux:  shasum -a 256 -c BUTUNLUK.sha256

ÖNEMLİ NOT
  Kabul şartları, ücretler ve tarihler ${stamp} itibarıyla resmi kaynaklarla doğrulanmıştır
  (portal → Bilgi Merkezi). Karar vermeden önce her zaman kaynak bağlantısından güncel hali kontrol edin.
`;
fs.writeFileSync(path.join(PKG, "BENIOKU.txt"), "\ufeff" + readme.replace(/\n/g, "\r\n"));

fs.writeFileSync(path.join(PKG, "dogrula.ps1"), "\ufeff" + `# AP MEBERRA paket bütünlük kontrolü — BUTUNLUK.sha256 içindeki her dosyayı doğrular
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bad = 0; $ok = 0
Get-Content -LiteralPath (Join-Path $root 'BUTUNLUK.sha256') -Encoding UTF8 | ForEach-Object {
  if ($_ -match '^([0-9a-f]{64}) \\*?(.+)$') {
    $expected = $Matches[1]; $file = Join-Path $root $Matches[2]
    if (-not (Test-Path -LiteralPath $file)) { Write-Host "EKSİK : $($Matches[2])" -ForegroundColor Red; $bad++ }
    elseif ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLower() -ne $expected) { Write-Host "BOZUK : $($Matches[2])" -ForegroundColor Red; $bad++ }
    else { $ok++ }
  }
}
if ($bad -eq 0) { Write-Host "TAMAM: $ok dosyanın tamamı eksiksiz ve bozulmamış." -ForegroundColor Green } else { Write-Host "SORUN: $bad dosya eksik ya da bozuk ($ok dosya sağlam)." -ForegroundColor Red; exit 1 }
`.replace(/\n/g, "\r\n"));

const files = walk(PKG).filter(f => path.basename(f) !== "BUTUNLUK.sha256").sort();
const manifest = files.map(f => `${sha256(f)} *${rel(f)}`).join("\n") + "\n";
fs.writeFileSync(path.join(PKG, "BUTUNLUK.sha256"), manifest);
const totalBytes = files.reduce((s, f) => s + fs.statSync(f).size, 0);
log(`    ${files.length} dosya, ${(totalBytes / 1048576).toFixed(1)} MB`);

// 7. Zip + gidiş-dönüş doğrulaması
log("7/7 Zip oluşturuluyor ve açılıp doğrulanıyor…");
const zipName = `AP-MEBERRA-Sunum-${stamp}.zip`;
const zipPath = path.join(OUT_BASE, zipName);
fs.rmSync(zipPath, { force: true });
execFileSync(TAR, ["-a", "-c", "-f", zipPath, "-C", OUT_BASE, PKG_NAME]);
const check = fs.mkdtempSync(path.join(require("os").tmpdir(), "apmeberra-zipkontrol-"));
try {
  execFileSync(TAR, ["-x", "-f", zipPath, "-C", check]);
  const base = path.join(check, PKG_NAME);
  let bad = 0;
  for (const line of manifest.trim().split("\n")) {
    const [hash, name] = [line.slice(0, 64), line.slice(66)];
    const f = path.join(base, name);
    if (!fs.existsSync(f) || sha256(f) !== hash) { log("    ✗ " + name); bad++; }
  }
  if (bad) { log(`✗ Zip doğrulaması BAŞARISIZ: ${bad} dosya`); process.exit(1); }
  log(`    zip içindeki ${files.length} dosyanın tamamı orijinalle birebir aynı`);
} finally { fs.rmSync(check, { recursive: true, force: true }); }

log(`\n✓ Hazır: sunum/${zipName} (${(fs.statSync(zipPath).size / 1048576).toFixed(1)} MB)`);
log(`  Açılmış hali: sunum/${PKG_NAME}/BASLA.html`);
