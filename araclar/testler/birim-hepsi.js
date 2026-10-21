"use strict";
// Tüm birim testlerini (araclar/testler/*-birim-test.js) sırayla ayrı süreçte çalıştırır. npm run test:birim
// Çıkış kodu: hepsi geçtiyse 0, en az biri kaldıysa 1. CI (.github/workflows/ci.yml) bunu kullanır.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const KLASOR = __dirname;
const KOK = path.resolve(KLASOR, "..", "..");
const dosyalar = fs.readdirSync(KLASOR).filter(f => /-birim-test\.js$/.test(f)).sort();
const kalan = [];
for (const f of dosyalar) {
  const bas = Date.now();
  const r = spawnSync(process.execPath, [path.join(KLASOR, f)], { cwd: KOK, encoding: "utf8", env: process.env });
  const ms = Date.now() - bas;
  if (r.status === 0) console.log("✔ " + f + " (" + ms + " ms)");
  else {
    kalan.push(f);
    console.log("✖ " + f + " (çıkış " + r.status + ")\n" + String(r.stdout || "").slice(-4000) + String(r.stderr || "").slice(-4000));
  }
}
console.log("\nBirim testleri: " + (dosyalar.length - kalan.length) + " / " + dosyalar.length + " geçti" + (kalan.length ? " · KALAN: " + kalan.join(", ") : ""));
process.exit(kalan.length ? 1 : 0);
