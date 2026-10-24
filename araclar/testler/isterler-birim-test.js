// 1.22.0 — Yapılandırılmış isterler (şart tablosu) denetimi. Çalıştır: node araclar/testler/isterler-birim-test.js
// Kapsam: isterlerDenetle kuralları (durum, kaynak, AP kodu, sınav kimliği, üniversite kimliği, alan anahtarı) ve üretilen ulke/<cc>.js.
"use strict";
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const ROOT = path.join(__dirname, "..", "..");
const D = require(path.join(ROOT, "araclar", "isterler-denetim.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };

const B = D.baglam();
const k = [{ ad: "Kaynak", url: "https://ornek.org/" }];
const tamam = { varsayilan: { yks: { durum: "uyari", metin: "x", kaynak: k, kesinlik: "Doğrulandı" } } };
ok(D.isterlerDenetle(tamam, "it", B).length === 0, "geçerli en küçük kayıt");
const sorunlu = (o, m, re) => { const s = D.isterlerDenetle(o, "it", B); ok(s.some(x => re.test(x)), m, s); };
sorunlu({ varsayilan: { yks: { metin: "x", kaynak: k } } }, "durum eksik", /durum/);
sorunlu({ varsayilan: { yks: { durum: "ok", metin: "x", kaynak: [], kesinlik: "Doğrulandı" } } }, "ok ama kaynak yok", /kaynak/);
sorunlu({ varsayilan: { yks: { durum: "ok", metin: "x", kaynak: k } } }, "kesinlik yok", /kesinlik/);
sorunlu({ varsayilan: { ap: { durum: "ok", metin: "x", kaynak: k, kesinlik: "Doğrulandı", sayi: 1, dersler: ["ap-calculus"] } } }, "geçersiz AP kodu", /ap-calculus/);
sorunlu({ varsayilan: { sinav: { durum: "uyari", metin: "x", kaynak: k, kesinlik: "Doğrulandı", sinavlar: ["yok-sinav"] } } }, "bilinmeyen sınav", /yok-sinav/);
sorunlu({ universite: { "it-yok-universite": {} } }, "bilinmeyen üniversite", /it-yok-universite/);
sorunlu({ alanlar: { hukuk: {} } }, "bilinmeyen alan", /hukuk/);
sorunlu({ varsayilan: { renk: { durum: "teyit", metin: "x" } } }, "bilinmeyen satır", /renk/);
ok(D.isterlerDenetle({ varsayilan: { donem: { durum: "teyit", metin: "x" } } }, "it", B).length === 0, "teyit kaynaksız olabilir");

const it = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "mevzuat", "kaynak", "isterler-it.json"), "utf8"));
const sIt = D.isterlerDenetle(it, "it", B);
ok(sIt.length === 0, "isterler-it.json geçerli", sIt);

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data", "mevzuat", "ulke", "it.js"), "utf8"), ctx);
const v = ctx.window.APMEBERRA_ULKE_VERI.it;
ok(v && v.isterler && v.isterler.varsayilan && typeof v.isterler.varsayilan.yks.durum === "string", "ulke/it.js isterler taşıyor");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
