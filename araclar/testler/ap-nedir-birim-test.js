// 1.26.0 — /ap-nedir "10 dakikada AP" yolculuğu: sahneler, mini test puanı, rozet, sınava kalan gün.
// Çalıştır: node araclar/testler/ap-nedir-birim-test.js
"use strict";
const path = require("path");
const A = require(path.join(__dirname, "..", "..", "assets", "js", "ap-nedir.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };

// 1) Sahneler: 6 sahne (5 anlatım + mini test), her birinde başlık, Dede Korkut cümlesi (≤ 90 karakter)
ok(A.SAHNELER.length === 6 && A.SAHNELER[5].tur === "test", "6 sahne, sonuncusu mini test");
ok(A.SAHNELER.every(s => s.baslik && s.dede && s.dede.length <= 90), "her sahnede başlık + kısa Dede Korkut cümlesi", A.SAHNELER.map(s => s.dede && s.dede.length));
// 2) Mini test: 5 soru, her birinde 3–4 şık, tek doğru, açıklama
ok(A.TEST.length === 5 && A.TEST.every(q => q.siklar.length >= 3 && q.siklar.length <= 4 && q.dogru >= 0 && q.dogru < q.siklar.length && q.neden), "5 soruluk test geçerli");
ok(new Set(A.TEST.map(q => q.dogru)).size >= 2, "doğru şık hep aynı sırada değil");
// 3) Puan + rozet
ok(A.puanla(A.TEST.map(q => q.dogru)).dogru === 5 && A.puanla(A.TEST.map(q => q.dogru)).rozet === "kasif", "5/5 → AP Kâşifi rozeti");
ok(A.puanla([A.TEST[0].dogru, A.TEST[1].dogru, A.TEST[2].dogru, -1, -1]).rozet === "kasif", "3/5 de rozet kazanır");
ok(A.puanla([-1, -1, -1, A.TEST[3].dogru, -1]).rozet === null && A.puanla([]).dogru === 0, "2/5 altı rozet yok; boş cevap 0");
// 4) Sınava kalan gün (İstanbul günü; geçmişse sonraki yılın Mayıs'ı) ve ay sayısı
ok(A.gunKaldi("2026-10-25", "2027-05-03") === 190, "25 Ekim 2026 → 3 Mayıs 2027: 190 gün", A.gunKaldi("2026-10-25", "2027-05-03"));
ok(A.gunKaldi("2027-05-03", "2027-05-03") === 0 && A.gunKaldi("2027-06-01", "2027-05-03") === null, "sınav günü 0, geçmiş tarih null");
ok(A.SINAV.ilkGun === "2027-05-03" && A.SINAV.siparis === "2026-11-13", "resmî 2026–27 takvimi (rehber-turkiyede-ap ile aynı)");
console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
