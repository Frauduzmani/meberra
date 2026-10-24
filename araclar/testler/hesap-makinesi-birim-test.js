// 1.26.1 — Sınav içi hesap makinesi: Desmos gömülü (girişsiz) adresleri, tür eşlemesi.
// Çalıştır: node araclar/testler/hesap-makinesi-birim-test.js
"use strict";
const path = require("path");
const H = require(path.join(__dirname, "..", "..", "assets", "js", "hesap-makinesi.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };
// College Board sürümü (Bluebook'taki): ifade listesi açık, giriş yok
ok(H.adres("https://www.desmos.com/calculator") === "https://www.desmos.com/testing/collegeboard/graphing", "grafik → College Board sürümü", H.adres("https://www.desmos.com/calculator"));
ok(H.adres("https://www.desmos.com/scientific") === "https://www.desmos.com/testing/collegeboard/scientific", "bilimsel");
ok(H.adres("https://www.desmos.com/fourfunction?x=1") === "https://www.desmos.com/testing/collegeboard/fourfunction", "dört işlem (sorgu atılır)");
ok(H.adres("https://www.desmos.com/testing/collegeboard/graphing") === "https://www.desmos.com/testing/collegeboard/graphing" && H.adres("https://www.desmos.com/geometry") === null, "College Board adresi aynen; bilinmeyen Desmos aracı reddedilir");
ok(H.adres("https://kotu.example/calc") === null && H.adres("javascript:alert(1)") === null, "yalnız www.desmos.com kabul edilir");
ok(H.turAdresi("grafik") === "https://www.desmos.com/calculator" && H.turAdresi("bilimsel") === "https://www.desmos.com/scientific" && H.turAdresi("4 işlem") === "https://www.desmos.com/fourfunction", "tür → adres");
ok(H.turAdresi("bilimsel veya grafik") === "https://www.desmos.com/calculator", "'bilimsel veya grafik' → grafik (daha güçlü olan)");
console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
