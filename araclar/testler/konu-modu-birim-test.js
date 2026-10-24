// 1.23.0 — Konu modu saf yardımcıları. Çalıştır: node araclar/testler/konu-modu-birim-test.js
"use strict";
const path = require("path");
const fs = require("fs");
const K = require(path.join(__dirname, "..", "..", "assets", "js", "konu-modu.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m, a);

eq(["1.10", "1.2", "1.9", "1.1"].sort(K.kodSirala), ["1.1", "1.2", "1.9", "1.10"], "kod sıralama sayısal");
const S = [{ kod: "1.6", baslik: "1.6 Special Trigonometric Limits" }, { kod: "1.16", baslik: "1.16 IVT" }, { kod: "1.6", baslik: "x" },
  { kod: null, baslik: "kodsuz" }, { kod: "2.1", baslik: "başka ünite" }, { kod: "1.1", baslik: "[BC ONLY] 1.1 Intro" }];
eq(K.sorulardanKonular(S, 1), [{ kod: "1.1", baslik: "Intro", sayi: 1 }, { kod: "1.6", baslik: "Special Trigonometric Limits", sayi: 2 }, { kod: "1.16", baslik: "IVT", sayi: 1 }], "sorulardan konu yolu");
const V = { konular: [{ kod: "1.2", baslik: "Defining Limits", baslikTr: "Limitin tanımı" }, { kod: "1.6", baslik: "Trig", baslikTr: "Trigonometrik limitler" }] };
const L = K.konuListesi(V, S, 1);
eq(L.map(k => [k.kod, k.baslik, k.sayi]), [["1.1", "Intro", 1], ["1.2", "Limitin tanımı", 0], ["1.6", "Trigonometrik limitler", 2], ["1.16", "IVT", 1]], "veri + soru konuları birleşir");
ok(L[1].veri === V.konular[0] && !L[0].veri, "veri olan konu verisini taşır");
eq([K.secimOku("?unite=1&konu=1.6"), K.secimOku("?konu=tum"), K.secimOku("?unite=1"), K.secimOku("?konu=x")], ["1.6", "tum", null, null], "seçim okuma");
eq([K.secimYaz("?unite=1&konu=1.2", "1.6"), K.secimYaz("", "tum"), K.secimYaz("?unite=2&konu=2.1", null)], ["?unite=1&konu=1.6", "?konu=tum", "?unite=2"], "seçim yazma");

// Ders sayfaları konu modu varlıklarını yükler
fs.readdirSync(path.join(__dirname, "..", "..")).filter(f => /^ap-.*\.html$/.test(f)).forEach(f => {
  const s = fs.readFileSync(path.join(__dirname, "..", "..", f), "utf8");
  ok(/\/assets\/js\/konu-modu\.js[^"]*" defer/.test(s) && /\/assets\/css\/konu-modu\.css/.test(s), f + ": konu-modu.js (defer) + konu-modu.css");
});
const app = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "js", "app.js"), "utf8");
ok(/meberra:unite-acildi/.test(app) && /card\.dataset\.konu = q\.konuKod/.test(app), "app.js olayı yayar ve kartı konu koduyla işaretler");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
