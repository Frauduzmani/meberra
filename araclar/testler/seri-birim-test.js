// v4 Bugün ekranı: çalışma serisi saf fonksiyonu — apCalismaSerisi (assets/js/app.js) Node birim testi.
// Kullanım (proje klasöründen): node araclar/testler/seri-birim-test.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const src = fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8");
const bas = src.indexOf("// --- Bugün ekranı (Tur 14 A3"), son = src.indexOf("// --- Bugün ekranı sonu");
if (bas < 0 || son < bas) { console.error("FAIL Bugün ekranı bölümü app.js içinde bulunamadı"); process.exit(1); }
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src.slice(bas, son) + "\nthis.F = { apCalismaSerisi };", ctx);
const { apCalismaSerisi } = ctx.F;

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };
// Cevap kaydı: progress.pages[sayfa].units[ünite].answers[soru] = { c, t }
const ilerleme = (...zamanlar) => ({ pages: { "ap-calculus": { units: { u1: { answers: Object.fromEntries(zamanlar.map((t, i) => ["q" + i, { c: true, t }])) } } } } });

// 2026-10-20 Salı
let r = apCalismaSerisi(null, null, "2026-10-20");
ok(r.seri === 0 && r.bugunVar === false, "boş veri: seri 0", r);
ok(r.hafta.length === 7 && r.hafta[0].etiket === "Pzt" && r.hafta[0].gun === "2026-10-19" && r.hafta[6].gun === "2026-10-25", "hafta Pazartesi–Pazar", r.hafta);
ok(r.hafta[1].bugun === true && r.hafta.filter(h => h.bugun).length === 1, "bugün işaretli (Salı)", r.hafta);
ok(r.hafta[2].gelecek === true && r.hafta[1].gelecek === false, "gelecek günler işaretli");

r = apCalismaSerisi(ilerleme("2026-10-20T09:00:00", "2026-10-19T21:00:00", "2026-10-18T08:00:00"), [], "2026-10-20");
ok(r.seri === 3 && r.bugunVar === true, "bugün + 2 önceki gün: seri 3", r);
ok(r.hafta[0].var && r.hafta[1].var && !r.hafta[2].var, "haftada Pzt ve Sal dolu");

r = apCalismaSerisi(ilerleme("2026-10-19T21:00:00", "2026-10-18T08:00:00"), [], "2026-10-20");
ok(r.seri === 2 && r.bugunVar === false, "bugün çalışılmadı ama dün çalışıldı: seri sürüyor (2)", r);

r = apCalismaSerisi(ilerleme("2026-10-18T08:00:00", "2026-10-17T08:00:00"), [], "2026-10-20");
ok(r.seri === 0, "dün boşsa seri kırılır (0)", r);

r = apCalismaSerisi(ilerleme("2026-10-20T09:00:00", "2026-10-20T10:00:00", "2026-10-18T10:00:00"), [], "2026-10-20");
ok(r.seri === 1, "aynı gün iki cevap tek gün sayılır; arada boş gün seriyi keser", r);

r = apCalismaSerisi(ilerleme(), [{ tarih: "2026-10-20T12:00:00" }, { tarih: "2026-10-19T12:00:00" }], "2026-10-20");
ok(r.seri === 2, "denemeler de çalışma günü sayılır", r);

r = apCalismaSerisi({ pages: { x: { units: { u: { answers: { a: { t: "bozuk" }, b: {} } } } } } }, [{ tarih: null }], "2026-10-20");
ok(r.seri === 0, "bozuk / eksik zaman damgaları yok sayılır", r);

r = apCalismaSerisi(ilerleme("2026-11-01T09:00:00", "2026-10-31T09:00:00"), [], "2026-11-01");
ok(r.seri === 2 && r.hafta[6].gun === "2026-11-01" && r.hafta[6].bugun, "ay geçişi ve Pazar günü", r);

console.log("SONUC: " + pass + " gecti, " + fail + " kaldi.");
process.exit(fail ? 1 : 0);
