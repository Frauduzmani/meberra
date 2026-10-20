// v4 ünite görünümü: ders sayfası bloklarını ünitelere gruplayan saf fonksiyon — apUniteGrupla (assets/js/app.js).
// Kullanım (proje klasöründen): node araclar/testler/unite-birim-test.js
// Ayrıca 6 gerçek ders sayfasının başlıklarıyla uçtan uca kontrol: her soru istasyonu bir üniteye düşer.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const src = fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8");
const bas = src.indexOf("const AP_TOC_QUIZ"), son = src.indexOf("// --- İçindekiler (uzun sayfalar)");
if (bas < 0 || son < bas) { console.error("FAIL apTocParse / apUniteGrupla bölümü app.js içinde bulunamadı"); process.exit(1); }
const ctx = { apEsc: x => String(x == null ? "" : x) };
vm.createContext(ctx);
vm.runInContext(src.slice(bas, son) + "\nthis.F = { apTocParse, apUniteGrupla };", ctx);
const { apTocParse, apUniteGrupla } = ctx.F;

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };
const B = t => (t === null ? { baslik: null } : { baslik: apTocParse(t) });

// 1) Düzenli sayfa: anlatım + soru istasyonu çiftleri, öncesinde ve sonrasında ek bölümler
let r = apUniteGrupla([
  B("Kritik Formüller"), B(null), B("Unit 1: Limits — Mastery"), B("Unit 1 Limits: İnteraktif Soru İstasyonu"), B(null),
  B("Unit 2: Differentiation"), B("Unit 2 Differentiation: İnteraktif Soru İstasyonu"), B("Official FRQ Archive")
]);
ok(r.uniteler.length === 2, "2 ünite", r);
ok(JSON.stringify(r.uniteler[0].bloklar) === "[2,3,4]" && JSON.stringify(r.uniteler[1].bloklar) === "[5,6]", "ünite blokları: anlatım + soru; zincir içindeki başlıksız blok üniteye ait", r.uniteler);
ok(r.uniteler[0].baslik === "Unit 1: Limits" && r.uniteler[0].no === 1, "ünite başlığı ve sıra numarası", r.uniteler[0]);
ok(JSON.stringify(r.ekler.map(e => e.blok)) === "[0,7]" && r.ekler[0].baslik === "Kritik Formüller", "ek bölümler", r.ekler);
ok(JSON.stringify(r.genel) === "[1]", "ünitelerden önceki başlıksız blok genel (özet sayfası) içerik", r.genel);
ok(r.uniteler[0].sorular === 1 && r.uniteler[0].anlatim === true, "ünitede soru istasyonu sayısı ve anlatım bayrağı");

// 2) Anlatımsız soru istasyonu kendi ünitesidir; ek bölüm zinciri keser
r = apUniteGrupla([B("Unit A: Rhetorical Analysis — İnteraktif Soru İstasyonu"), B("Unit B: Writing MCQ — İnteraktif Soru İstasyonu"), B("Rubrik")]);
ok(r.uniteler.length === 2 && r.uniteler[0].anlatim === false && r.uniteler[0].baslik === "Unit A: Rhetorical Analysis", "anlatımsız soru istasyonları ayrı ünite (English)", r.uniteler);

// 3) Devam anlatımı yeni ünite açar; aynı anlatımın ardından gelen iki istasyon tek ünitede
r = apUniteGrupla([B("Unit 2: Force"), B("Unit 2 Force: İnteraktif Soru İstasyonu"), B("Unit 2 (cont.): Circular Motion"), B("Unit 2 (cont.) Circular: İnteraktif Soru İstasyonu"),
  B("Unit 4: Data — Recursion"), B("Unit 1–3 (CSA) Strings: İnteraktif Soru İstasyonu"), B("Unit 4 (CSA) Data: İnteraktif Soru İstasyonu")]);
ok(r.uniteler.length === 3 && r.uniteler[1].baslik === "Unit 2: Circular Motion", "devam anlatımı ayrı ünite", r.uniteler);
ok(r.uniteler[2].sorular === 2 && JSON.stringify(r.uniteler[2].bloklar) === "[4,5,6]", "bir anlatımın ardından iki istasyon", r.uniteler[2]);

// 3b) Çoğul "Units 1–4" anlatımı da ünite açar (Seçmeliler, CSA)
r = apUniteGrupla([B("AP Computer Science A — Units 1–4: Strings, Class Design — Foundations"), B("Unit 1–3 (AP CSA) Strings: İnteraktif Soru İstasyonu")]);
ok(r.uniteler.length === 1 && r.uniteler[0].anlatim === true && r.ekler.length === 0, "çoğul Units anlatımı ünite", r);

// 4) "Unit Circle" geçen ek bölüm ünite sayılmaz
r = apUniteGrupla([B("Reference Library: Formula Sheets, Unit Circle and Technique Charts"), B("Unit 1: Limits"), B("Unit 1: İnteraktif Soru İstasyonu")]);
ok(r.uniteler.length === 1 && r.ekler.length === 1, "Unit Circle başlığı ek bölüm", r);

// 5) Gerçek ders sayfaları: her soru istasyonu bir ünitede, hiçbir ünite boş değil
for (const f of ["ap-calculus.html", "ap-physics.html", "ap-chemistry.html", "ap-biology.html", "ap-english.html", "ap-electives.html"]) {
  const h = fs.readFileSync(path.join(ROOT, f), "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const heads = [...h.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim());
  const g = apUniteGrupla(heads.map(B));
  const quizSay = heads.filter(t => apTocParse(t).quiz).length;
  const topSoru = g.uniteler.reduce((a, u) => a + u.sorular, 0);
  ok(g.uniteler.length >= 2 && topSoru === quizSay && g.uniteler.every(u => u.bloklar.length > 0 && u.baslik),
    f + ": " + g.uniteler.length + " ünite, " + quizSay + " soru istasyonunun hepsi bir ünitede", g.uniteler.map(u => u.baslik));
}

console.log("SONUC: " + pass + " gecti, " + fail + " kaldi.");
process.exit(fail ? 1 : 0);
