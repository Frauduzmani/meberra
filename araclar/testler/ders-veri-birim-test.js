// 1.23.0 — Konu anlatımı verisi denetimi. Çalıştır: node araclar/testler/ders-veri-birim-test.js
// Kapsam: denetleyici kuralları (örnek iyi/kötü kayıtlar) ve data/dersler altındaki tüm dosyaların 0 sorun vermesi.
"use strict";
const path = require("path");
const D = require(path.join(__dirname, "..", "ders-veri-denetim.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };

const uzun = "<p>" + "Limit, bir fonksiyonun bir noktaya yaklaşırken aldığı değerdir. ".repeat(25) + "\\(\\lim_{x \\to 2} x^2 = 4\\)</p>";
const konu = () => ({
  kod: "1.2", baslik: "Defining Limits", baslikTr: "Limitin tanımı", hedefler: ["Limiti gösterimle yaz."], anlatim: uzun,
  ornekler: [{ soru: "<p>\\(\\lim_{x\\to 1}(2x)\\)?</p>", cozum: ["<p>Yerine koy.</p>", "<p>Sonuç 2.</p>"] }, { soru: "<p>Tablo</p>", cozum: ["a", "b"] }],
  ipuclari: ["a", "b", "c"], sikHatalar: ["x", "y"]
});
const iyi = { ders: "calculus", unite: 1, baslik: "Limits and Continuity", baslikTr: "Limitler", konular: [konu()] };
ok(D.denetle(iyi, "iyi").length === 0, "geçerli kayıt", D.denetle(iyi, "iyi"));
const bozuk = (f, re, m) => { const o = JSON.parse(JSON.stringify(iyi)); f(o); const s = D.denetle(o, "k"); ok(s.some(x => re.test(x)), m, s); };
bozuk(o => { o.konular[0].kod = "2.1"; }, /ünite numarasıyla/, "kod ünite ile başlamalı");
bozuk(o => { o.konular[0].anlatim = "<p>kısa</p>"; }, /1200 karakter/, "anlatım uzunluğu");
bozuk(o => { o.konular[0].ornekler.pop(); }, /2 çözümlü örnek/, "en az 2 örnek");
bozuk(o => { o.konular[0].anlatim += "<script>x</script>"; }, /betik/, "betik yasak");
bozuk(o => { o.konular[0].anlatim += "<img src=x>"; }, /izinsiz etiket <img>/, "izinsiz etiket");
bozuk(o => { o.konular[0].anlatim += "<span class='kirmizi'>"; }, /izinsiz/, "izinsiz sınıf ya da tırnak");
bozuk(o => { o.konular[0].anlatim += "\\(x"; }, /dengesiz/, "dengesiz MathJax");
bozuk(o => { o.konular[0].anlatim += "\f"; }, /kontrol karakteri/, "kontrol karakteri");
bozuk(o => { o.konular.push(konu()); }, /tekrarlanmış/, "tekrar kod");
bozuk(o => { o.konular[0].ipuclari = ["a"]; }, /3 ipucu/, "ipucu sayısı");
bozuk(o => { o.konular[0].fazla = 1; }, /bilinmeyen alan/, "bilinmeyen alan");

const H = D.hepsi(path.join(__dirname, "..", ".."));
H.forEach(x => ok(!x.sorunlar.length, x.dosya + ": 0 sorun", x.sorunlar.slice(0, 5)));

const fs = require("fs");
const dz = path.join(__dirname, "..", "..", "data", "dersler", "dizin.json");
ok(fs.existsSync(dz), "data/dersler/dizin.json var");
if (fs.existsSync(dz)) ok(JSON.stringify(JSON.parse(fs.readFileSync(dz, "utf8"))) === JSON.stringify(D.dizinOlustur(path.join(__dirname, "..", ".."))),
  "dizin.json dosyalarla uyumlu (node araclar/ders-veri-denetim.js --dizin)");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
