#!/usr/bin/env node
"use strict";
/*
 * Meberra 1.8.0 — Temiz adres dönüştürücü (tekrar çalıştırılabilir; ikinci çalıştırmada değişiklik yapmaz).
 *
 * Sayfalar artık /ders/calculus gibi iki seviyeli adreslerden de sunulduğu için sayfa ve betiklerdeki göreli
 * bağlantılar ("assets/css/styles.css", "giris.html?donus=...") kök-mutlak hale getirilir:
 *   - "assets/..." "data/..."                → "/assets/..." "/data/..."
 *   - "favicon.svg" "manifest.webmanifest" "sw.js" → "/favicon.svg" ...
 *   - "sartlar.html?x#y" ya da "/sartlar.html" → "/ulkem?x#y"   (tablo: assets/js/adresler.js)
 *   - "admin.html"                            → "/admin.html" (yönetim yolu herkese açık dosyalarda yazmaz; sunucu
 *                                                yöneticiyi yönlendirir, diğerlerine 404)
 *   - her sayfanın <head>'ine <script src="/assets/js/adresler.js"></script> (MEBERRA_ADRES yardımcıları)
 * Yalnızca tırnak/parantez ile başlayan değerler değişir; yorumlardaki düz metin ve dış adresler
 * ("https://x.ch/index.html") dokunulmaz. <base href> kullanılmaz: sayfa içi "#capa" bağlantıları bozulurdu.
 *
 * Kullanım: node araclar/adres-donustur.js [--kuru]   (--kuru: yalnızca rapor)
 */
const fs = require("fs");
const path = require("path");
const ADRES = require("../assets/js/adresler.js");

const KOK = path.join(__dirname, "..");
const KURU = process.argv.includes("--kuru");

const ACILIS = "[\"'`(]";
const KURALLAR = [
  // varlık klasörleri
  [new RegExp("(" + ACILIS + ")(?:\\./)?((?:assets|data)/)", "g"), "$1/$2"],
  // kökteki tek dosyalar
  [new RegExp("([\"'`])(?:\\./)?(favicon\\.svg|manifest\\.webmanifest|sw\\.js|robots\\.txt)(?=[\"'`?#])", "g"), "$1/$2"],
  // sayfalar
  [new RegExp("([\"'`])(?:\\./|/)?([a-z0-9-]+)\\.html(?=[?#\"'`\\s<)\\\\]|$)", "g"), (m, ac, ad) => {
    if (ad === "admin") return ac + "/admin.html";
    const y = ADRES.dosyadan(ad + ".html");
    return y ? ac + y : m;
  }]
];
const BETIK = '<script src="/assets/js/adresler.js"></script>';

function donustur(metin, html) {
  let s = metin;
  for (const [re, yeni] of KURALLAR) s = s.replace(re, yeni);
  if (html && s.indexOf("/assets/js/adresler.js") < 0) {
    const bas = s.search(/<\/head>/i);
    if (bas > 0) {
      const ilkBetik = s.slice(0, bas).search(/<script\b/i);
      const yer = ilkBetik > 0 ? ilkBetik : bas;
      // satır girintisini koru
      const satirBas = s.lastIndexOf("\n", yer) + 1;
      const girinti = /^[ \t]*$/.test(s.slice(satirBas, yer)) ? s.slice(satirBas, yer) : "  ";
      const nl = /\r\n/.test(s) ? "\r\n" : "\n";
      s = ilkBetik > 0 && satirBas !== yer && /^[ \t]*$/.test(s.slice(satirBas, yer))
        ? s.slice(0, satirBas) + girinti + BETIK + nl + s.slice(satirBas)
        : s.slice(0, yer) + BETIK + nl + girinti + s.slice(yer);
    }
  }
  return s;
}

function dosyalar() {
  const l = [];
  fs.readdirSync(KOK).filter(f => /\.html$/i.test(f)).forEach(f => l.push({ yol: path.join(KOK, f), html: true }));
  const js = path.join(KOK, "assets", "js");
  fs.readdirSync(js).filter(f => /\.js$/.test(f) && f !== "adresler.js").forEach(f => l.push({ yol: path.join(js, f), html: false }));
  return l;
}

if (require.main === module) {
  let degisen = 0;
  for (const d of dosyalar()) {
    const eski = fs.readFileSync(d.yol, "utf8");
    const yeni = donustur(eski, d.html);
    if (yeni !== eski) {
      degisen++;
      console.log((KURU ? "[kuru] " : "") + "değişti: " + path.relative(KOK, d.yol));
      if (!KURU) fs.writeFileSync(d.yol, yeni);
    }
  }
  console.log(degisen ? degisen + " dosya " + (KURU ? "değişecek" : "güncellendi") + "." : "Değişiklik yok (zaten temiz).");
}

module.exports = { donustur };
