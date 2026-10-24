// 1.27.0 — Bugün: tahmini AP puanı göstergesi (odak ders, sonraki adım metni, bant yükselişi).
// Çalıştır: node araclar/testler/bugun-tahmin-birim-test.js
"use strict";
const path = require("path");
const T = require(path.join(__dirname, "..", "..", "assets", "js", "bugun-tahmin.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };

const d = (ders, kisa, puan, ince, hedef, kald, sonraki) => ({ ders, kisa, hedef, tahminModel: puan == null ? null : { puan, ince, guven: "orta", kaldirac: kald || null, sonraki: sonraki || null } });
const L = [d("calculus-ab", "Calculus AB", 3, 3.4, 5, { unite: "6", etiket: "Unit 6", link: "/ders/calculus?unite=6", puanYeni: 4 }, { puan: 4 }),
  d("chemistry", "Chemistry", 4, 4.2, 4, { unite: "3", etiket: "Unit 3", link: "/ders/chemistry?unite=3", puanYeni: 4 }, { puan: 5 }),
  d("biology", "Biology", null)];

// 1) Odak ders: hedefin en çok altında kalan (hedef yoksa 5 kabul); veri olmayan sona
ok(T.odakDers(L).ders === "calculus-ab", "hedefe en uzak ders odakta");
ok(T.odakDers([L[2]]) === null, "hiç tahmin yoksa odak yok");
// 2) Sonraki adım metni
ok(T.adimMetni(L[0]) === "Calculus AB: Unit 6'yı %85'e çıkar → tahminin 4 olur", "banda geçiren kaldıraç", T.adimMetni(L[0]));
ok(T.adimMetni(L[1]) === "Chemistry: en çok puanı Unit 3 getirir. Çalışmaya oradan devam et.", "banda geçirmeyen kaldıraç", T.adimMetni(L[1]));
ok(/5 bandındasın/.test(T.adimMetni(d("x", "X", 5, 5, 5, null, null))), "5'te koruma mesajı");
ok(/10 soru/.test(T.adimMetni(L[2])), "veri yoksa 10 soru çağrısı");
// Sayıya göre Türkçe ekler: belirtme (-ı/-i/-u/-ü, ünlüyle biten sayıda -y-), ayrılma (-den/-ten), yönelme (-e/-a, -ye)
ok([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => "Unit " + n + T.ek.belirtme(n)).join(",") === "Unit 1'i,Unit 2'yi,Unit 3'ü,Unit 4'ü,Unit 5'i,Unit 6'yı,Unit 7'yi,Unit 8'i,Unit 9'u,Unit 10'u", "belirtme eki", [1, 3, 6, 9].map(T.ek.belirtme));
ok([1, 2, 3, 4, 5].map(n => n + T.ek.ayrilma(n)).join(",") === "1'den,2'den,3'ten,4'ten,5'ten" && [2, 3, 4, 5].map(n => n + T.ek.yonelme(n)).join(",") === "2'ye,3'e,4'e,5'e", "ayrılma/yönelme");
ok(T.adimMetni(d("chemistry", "Chemistry", 2, 2.5, 4, { unite: "3", etiket: "Unit 3", link: "/x", puanYeni: 3 }, { puan: 3 })) === "Chemistry: Unit 3'ü %85'e çıkar → tahminin 3 olur", "kaldıraç metninde doğru ek");
// 3) Halka oranı (1 → 0, 5 → 1)
ok(T.halka(1) === 0 && T.halka(5) === 1 && Math.abs(T.halka(3) - 0.5) < 1e-9 && T.halka(null) === 0, "halka oranı");
// 4) Bant yükselişi: yalnız artışlar, ilk görülen ders kutlanmaz
ok(JSON.stringify(T.yukselenler({ "calculus-ab": 2, chemistry: 4 }, L)) === JSON.stringify([{ ders: "calculus-ab", kisa: "Calculus AB", eski: 2, yeni: 3 }]), "yalnız artan bant", T.yukselenler({ "calculus-ab": 2, chemistry: 4 }, L));
ok(T.yukselenler({}, L).length === 0 && T.yukselenler({ chemistry: 5 }, L).length === 0, "ilk görüş ve düşüş kutlanmaz");
ok(JSON.stringify(T.kayit(L)) === JSON.stringify({ "calculus-ab": 3, chemistry: 4 }), "kayıt: tahmini olan dersler");
console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
