// AP MEBERRA — Sürüm arşivi (kullanıcı talimatı, 15 Ekim 2026: "tüm eklemelerimizde versiyon arşivlemesi yapalım")
// Her teslimde (tur sonu ya da ara ekleme) projenin o anki halini numaralı bir zip'e alır ve SURUMLER.md günlüğüne yazar.
//
// Kullanım (proje klasöründe):
//   node araclar/surum-arsivle.js --not "Tur 11: üniversite mezunu modeli"            → sürüm numarası otomatik artar (11.0 → 11.1)
//   node araclar/surum-arsivle.js --surum 12.0 --not "Tur 12 başlangıcı"                → numarayı elle verir
//   node araclar/surum-arsivle.js --liste                                              → arşivdeki sürümleri gösterir
//
// Çıktı: arsiv/surumler/AP-MEBERRA-v<surum>-<YYYY-AA-GG>.zip
//   - Zip'in içinde proje dosyaları + SURUM.json (sürüm, tarih, not, dosya sayısı, her dosyanın SHA-256'sı) bulunur.
//   - Zip açılıp her dosya yeniden hash'lenir; tek bir fark varsa zip silinir ve araç hata verir.
// Arşive GİRMEYENLER: sunum/ (paketler zaten zip), arsiv/ (önceki sürümler), kaynaklar/pdf/ (değişmeyen büyük PDF'ler; SURUM.json'a
//   adı ve hash'i yazılır), node_modules, .git.
// Geri dönmek için: zip'i boş bir klasöre çıkarın; SURUM.json'daki hash'lerle karşılaştırın; sonra dosyaları proje klasörüne kopyalayın.
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "arsiv", "surumler");
const GUNLUK = path.join(ROOT, "SURUMLER.md");
const TAR = "C:\\Windows\\System32\\tar.exe"; // bsdtar: Windows 10+ ile gelir, zip yazar/okur
const SKIP_DIRS = new Set(["node_modules", ".git", "sunum", "arsiv"]);
const SKIP_PATHS = new Set(["kaynaklar/pdf", "kaynaklar/eposta-ornekleri/ham"]); // pdf: yalnızca hash kaydedilir; ham e-posta örnekleri kişisel veri içerir, hiç girmez (Tur 14)

const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const sha = f => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const rel = p => path.relative(ROOT, p).split(path.sep).join("/");

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || SKIP_PATHS.has(rel(p))) continue;
      walk(p, out);
    } else if (e.isFile()) out.push(p);
  }
  return out;
}

function oncekiSurumler() {
  if (!fs.existsSync(OUT)) return [];
  return fs.readdirSync(OUT).map(f => /^AP-MEBERRA-v(\d+)\.(\d+)-(\d{4}-\d{2}-\d{2})\.zip$/.exec(f))
    .filter(Boolean).map(m => ({ dosya: m[0], ana: +m[1], alt: +m[2], tarih: m[3] }))
    .sort((a, b) => a.ana - b.ana || a.alt - b.alt);
}

if (args.includes("--liste")) {
  const s = oncekiSurumler();
  if (!s.length) console.log("Arşivde sürüm yok.");
  s.forEach(x => console.log(`v${x.ana}.${x.alt}  ${x.tarih}  ${x.dosya}  ${(fs.statSync(path.join(OUT, x.dosya)).size / 1048576).toFixed(1)} MB`));
  process.exit(0);
}

const not = (arg("--not") || "").trim();
if (!not) { console.error("HATA: --not \"ne eklendi\" zorunlu (SURUMLER.md'ye yazılır)."); process.exit(1); }

let surum = arg("--surum");
const onceki = oncekiSurumler();
if (surum) {
  if (!/^\d+\.\d+$/.test(surum)) { console.error("HATA: --surum biçimi <ana>.<alt> olmalı, ör. 11.0"); process.exit(1); }
} else {
  const son = onceki[onceki.length - 1];
  surum = son ? `${son.ana}.${son.alt + 1}` : "11.0";
}
if (onceki.some(x => `${x.ana}.${x.alt}` === surum)) { console.error(`HATA: v${surum} zaten arşivde.`); process.exit(1); }

const d = new Date();
const tarih = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ad = `AP-MEBERRA-v${surum}-${tarih}`;
fs.mkdirSync(OUT, { recursive: true });

// 1. Hazırlık klasörü: dosyalar + SURUM.json
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "apmeberra-surum-"));
const kok = path.join(tmp, ad);
const dosyalar = walk(ROOT, []);
const hashler = {};
for (const f of dosyalar) {
  const r = rel(f);
  const hedef = path.join(kok, r);
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.copyFileSync(f, hedef);
  hashler[r] = sha(f);
}
const pdfDir = path.join(ROOT, "kaynaklar", "pdf");
const disarida = fs.existsSync(pdfDir) ? fs.readdirSync(pdfDir).map(f => ({ dosya: "kaynaklar/pdf/" + f, sha256: sha(path.join(pdfDir, f)) })) : [];
const meta = { proje: "AP MEBERRA", surum, tarih, not, dosyaSayisi: dosyalar.length, arsivDisi: disarida, dosyalar: hashler };
fs.writeFileSync(path.join(kok, "SURUM.json"), JSON.stringify(meta, null, 2));

// 2. Zip
const zip = path.join(OUT, ad + ".zip");
execFileSync(TAR, ["-a", "-c", "-f", zip, "-C", tmp, ad]);

// 3. Doğrulama: zip'i ayrı klasöre aç, her dosyayı yeniden hash'le
const kontrol = fs.mkdtempSync(path.join(os.tmpdir(), "apmeberra-surumkontrol-"));
let hata = 0;
try {
  execFileSync(TAR, ["-x", "-f", zip, "-C", kontrol]);
  for (const [r, h] of Object.entries(hashler)) {
    const p = path.join(kontrol, ad, r);
    if (!fs.existsSync(p) || sha(p) !== h) { hata++; console.error("  FARK: " + r); }
  }
} finally {
  fs.rmSync(kontrol, { recursive: true, force: true });
  fs.rmSync(tmp, { recursive: true, force: true });
}
if (hata) { fs.rmSync(zip, { force: true }); console.error(`HATA: ${hata} dosya zip içinde doğrulanamadı; arşiv silindi.`); process.exit(1); }

// 4. Günlük (SURUMLER.md) — en yeni sürüm tablonun en üstünde
const boyut = (fs.statSync(zip).size / 1048576).toFixed(1);
const satir = `| **v${surum}** | ${tarih} | ${not.replace(/\|/g, "/")} | ${dosyalar.length} | ${boyut} MB | \`arsiv/surumler/${ad}.zip\` |`;
const BASLIK = "| Sürüm | Tarih | Ne eklendi | Dosya | Boyut | Arşiv |\n| :--- | :--- | :--- | ---: | ---: | :--- |";
let metin = fs.existsSync(GUNLUK) ? fs.readFileSync(GUNLUK, "utf8") : "";
if (!metin.includes(BASLIK)) {
  metin = "# AP MEBERRA — Sürüm Arşivi\n\n" +
    "> Kullanıcı talimatı (15 Ekim 2026): Her eklemede sürüm arşivi alınır. Araç: `node araclar/surum-arsivle.js --not \"...\"`.\n" +
    "> Her zip içinde `SURUM.json` vardır (dosya listesi + SHA-256). PDF'ler (`kaynaklar/pdf/`) arşive girmez, yalnızca hash'leri yazılır.\n" +
    "> Ayrıntılı kayıt `proje.md`'dedir; bu dosya yalnızca sürüm listesidir.\n\n" + BASLIK + "\n";
}
metin = metin.replace(BASLIK + "\n", BASLIK + "\n" + satir + "\n");
fs.writeFileSync(GUNLUK, metin);

console.log(`✓ v${surum} arşivlendi: arsiv/surumler/${ad}.zip (${dosyalar.length} dosya, ${boyut} MB; ${Object.keys(hashler).length} hash doğrulandı)`);
console.log(`  SURUMLER.md güncellendi.`);
