// 1.22.1 — İçerik düzeltmeleri denetimi (tarayıcı gerekmez). Çalıştır: node araclar/testler/icerik-birim-test.js
// Kapsam: ders sayfalarında ham LaTeX kalmadı, AP dışı (Abitur/Maturità/IMAT) havuzlar kalktı, Physics 1 formül kartı
// resmî formül sayfasına uygun, "Kendini dene" şıkları karıştırılıyor (doğru cevap hep aynı harfte değil), bankadaki
// incelemede işaretlenen sorular düzeltildi.
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };
const oku = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const SAYFALAR = fs.readdirSync(ROOT).filter(f => /^ap-.*\.html$/.test(f));

// 1) <code> içinde LaTeX (MathJax <code>'u atlar; öğrenci ham metin görür)
SAYFALAR.forEach(f => {
  const ham = (oku(f).match(/<code[^>]*>[^<]*<\/code>/g) || []).filter(c => /\\[a-zA-Z]|_\{|\^\{|lim_/.test(c));
  ok(!ham.length, f + ": <code> içinde ham LaTeX yok", ham.slice(0, 2));
});

// 2) AP dışı havuzlar ders sayfalarından kalktı
SAYFALAR.forEach(f => {
  const s = oku(f);
  ok(!/Üçlü Sınav|Abitur|Maturit|INVALSI|bIMATb/.test(s), f + ": Abitur/Maturità/IMAT içeriği yok", (s.match(/.{0,40}(Üçlü Sınav|Abitur|Maturit|INVALSI|bIMATb).{0,40}/) || [])[0]);
});

// 3) Physics 1 formül kartı: resmî formül sayfası (cebir tabanlı); Physics C / E&M yok, yazım hatası yok
const fiz = oku("ap-physics.html");
ok(!/Gauss|\\oint|Korumlu|× F \* sin|∫ F dx/.test(fiz), "ap-physics: Gauss/∮/∫F dx/Korumlu/τ = r × F * sin yok");
["v_x = v_{x0} + a_x t", "P = P_0 + \\rho g h", "F_b = \\rho V g", "A_1 v_1 = A_2 v_2", "\\tau = r F \\sin\\theta", "T_s = 2\\pi\\sqrt{\\frac{m}{k}}"].forEach(x =>
  ok(fiz.includes(x), "ap-physics formül kartı: " + x));

// 4) "Kendini dene" şıkları karıştırılır: doğru cevabın görünen konumu tek harfte toplanmaz
const KBE = require(path.join(ROOT, "assets", "js", "etkilesim-kbe.js"));
const MF = require(path.join(ROOT, "assets", "js", "etkilesim-mf.js"));
ok(typeof KBE.siraKaristir === "function" && typeof MF.siraKaristir === "function", "siraKaristir dışa verilir");
if (typeof KBE.siraKaristir === "function") {
  const p = KBE.siraKaristir(4, "örnek soru");
  ok(p.slice().sort().join() === "0,1,2,3", "permütasyon geçerli");
  ok(JSON.stringify(KBE.siraKaristir(4, "örnek soru")) === JSON.stringify(p), "aynı soru aynı sırada (kararlı)");
  const dagilim = (liste, k) => { const n = [0, 0, 0, 0]; liste.forEach(([metin, sayi, dogru]) => n[k(sayi, metin).indexOf(dogru)]++); return n; };
  const kbe = [];
  Object.keys(KBE.BIRIM).forEach(b => KBE.BIRIM[b].sorular.forEach(q => kbe.push([q[0], q[1].length, q[2]])));
  const mf = [];
  Object.keys(MF.dene).forEach(b => MF.dene[b].forEach(q => mf.push([q.s, q.o.length, q.d])));
  [["kbe", kbe, KBE.siraKaristir], ["mf", mf, MF.siraKaristir]].forEach(([ad, l, k]) => {
    const n = dagilim(l, k), en = Math.max.apply(null, n);
    ok(en / l.length <= 0.5, ad + ": doğru cevap tek konumda toplanmıyor (" + n.join("/") + ")");
  });
  ok(/siraKaristir\(/.test(oku("assets/js/etkilesim-kbe.js").split("W.birim = function")[1] || ""), "kbe: çizim karıştırılmış sırayı kullanır");
  ok(/siraKaristir\(/.test(oku("assets/js/etkilesim-mf.js").split("function dene(host)")[1] || ""), "mf: çizim karıştırılmış sırayı kullanır");
}

// 5) Soru bankası düzeltmeleri
const BANKA = JSON.parse(oku("server/tohum/soru-bankasi.json"));
const S = id => BANKA.sorular.find(q => q.id === id);
const sik = (q, h) => q.secenekler.find(x => x.id === h).text;
ok(BANKA.surum >= 7, "tohum sürümü artırıldı (sunucu düzeltmeleri alır)", BANKA.surum);
ok(!/^\$?-/.test(sik(S("calc_u8_q24"), "C")), "calc_u8_q24: hacim çeldiricisi negatif değil", sik(S("calc_u8_q24"), "C"));
ok(!/\(0\.025/.test(sik(S("calc_u4_q6"), "D")), "calc_u4_q6: doğru şık ondalıkla ele verilmiyor");
const q632 = S("calc_u6_q32");
ok(!/6\.14/.test(q632.genel_hatirlatma) || /6\.14/.test(q632.konu), "calc_u6_q32: konu etiketi tutarlı");
const c12 = S("chem_u1_q2"), uz = c12.secenekler.map(x => x.text.length);
ok(!/required by College Board/.test(c12.govde), "chem_u1_q2: kökte 'required by College Board' yok");
ok(Math.max.apply(null, uz) <= 2 * Math.min.apply(null, uz) + 40, "chem_u1_q2: doğru şık diğerlerinden belirgin uzun değil", uz);
["phys_u1_q6", "phys_u2_q7", "phys_u3_q8", "phys_wep_q16", "phys_wep_q21", "phys_mom_q21"].forEach(id =>
  ok(S(id).durum === "arsiv", id + ": Physics C sorusu Physics 1 bankasında arşivde"));
ok(!/eğimi 1|\(2, −1\)/.test(S("calc_sk_u2_2").sekil.alt), "calc_sk_u2_2: şekil alt metni cevabı vermiyor");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
