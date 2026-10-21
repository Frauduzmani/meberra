// 1.16.0 oyunlaştırma ekleri (assets/js/oyun-ek.js) saf çekirdeği — Node birim testi.
// Ünite ustalığı (Bronz/Gümüş/Altın), ustalık yükseltme, aylık görev (belirlenimli hedef, ilerleme, öne çıkma), haftalık özet.
// Kullanım (proje klasöründen): node araclar/testler/oyun-ek-birim-test.js
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const E = require(path.join(ROOT, "assets/js/oyun-ek.js"));
const O = require(path.join(ROOT, "assets/js/oyun.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };

// 1) Seviye eşikleri
const sv = (toplam, cevap, dogruIlk, acikYanlis) => E.ustalikSeviyesi({ toplam, cevap, dogruIlk, acikYanlis: acikYanlis || 0 });
ok(sv(20, 0, 0) === null, "hiç cevap yok → seviye yok");
ok(sv(20, 9, 9) === null, "%45 cevap → seviye yok");
ok(sv(20, 10, 6) === "bronz", "%50 cevap, %60 doğruluk → Bronz");
ok(sv(20, 10, 5) === null, "%50 cevap, %50 doğruluk → yok");
ok(sv(20, 16, 12) === "gumus", "%80 cevap, %75 doğruluk → Gümüş");
ok(sv(20, 16, 11) === "bronz", "%80 cevap, %69 doğruluk → Bronz");
ok(sv(20, 20, 18, 0) === "altin", "%100, %90, açık yanlış yok → Altın");
ok(sv(20, 20, 18, 1) === "gumus", "%100, %90 ama açık yanlış var → Gümüş");
ok(sv(20, 20, 17, 0) === "gumus", "%100, %85 → Gümüş");
ok(sv(0, 3, 3) === null, "toplam 0 → yok");

// 2) Ünite istatistiği: ilk denemede doğru, çözülen yanlış, açılmamış kutu
const kayit = { units: { k1: { total: 4, answers: { a: { c: true }, b: { c: true }, c: { c: true }, d: { c: false } } } } };
let s = E.uniteIstatistik("ap-calculus", kayit, ["k1"], 4, { "ap-calculus|c": { resolved: true }, "ap-calculus|d": { resolved: false } });
ok(s.toplam === 4 && s.cevap === 4 && s.dogruIlk === 2 && s.acikYanlis === 1, "çözülmüş yanlış ilk denemede yanlış sayılır; son cevabı yanlış açık", s);
s = E.uniteIstatistik("ap-calculus", kayit, ["k1", "k2"], 10, {});
ok(s.toplam === 10 && s.cevap === 4, "açılmamış kutu → bankadaki soru sayısı", s);
const tam = { units: { k1: { total: 10, answers: {} } } };
for (let i = 0; i < 10; i++) tam.units.k1.answers["q" + i] = { c: true };
ok(E.uniteIstatistik("p", tam, ["k1"], 10, { "p|q0": { resolved: true } }).seviye === "altin", "tek yanlış sonradan doğru: %90 → Altın");
ok(E.uniteIstatistik("p", tam, ["k1"], 10, { "p|q0": { resolved: true }, "p|q1": { resolved: true } }).seviye === "gumus", "iki çözülmüş yanlış: %80 → Gümüş");

// 3) Yükseltme: yalnız daha yüksek seviye "yeni"; düşme yok; seviye başına bir kez
let u = {};
let r = E.ustalikIlerle(u, "p|1", "bronz", 100);
ok(r.yeni === "bronz" && u["p|1"].t === 100, "ilk Bronz yeni");
r = E.ustalikIlerle(u, "p|1", "bronz", 200);
ok(r.yeni === null && u["p|1"].t === 100, "aynı seviye tekrar kutlanmaz, t değişmez");
r = E.ustalikIlerle(u, "p|1", "altin", 300);
ok(r.yeni === "altin" && u["p|1"].seviye === "altin", "Altın'a yükselir");
r = E.ustalikIlerle(u, "p|1", "gumus", 400);
ok(r.yeni === null && u["p|1"].seviye === "altin", "düşük seviye geri yazmaz");
ok(E.ustalikIlerle({}, "p|2", null, 1).yeni === null, "seviye yoksa kayıt yok");

// 4) Aylık görev
const h1 = E.aylikHedef("2026-10"), h1b = E.aylikHedef("2026-10");
ok(JSON.stringify(h1) === JSON.stringify(h1b), "aynı ay → aynı hedef (belirlenimli)");
ok(E.AYLIK_SECENEK.some(x => x.tur === h1.tur && x.miktar === h1.miktar) && /^Ekim ayında/.test(h1.ad), "hedef seçeneklerden, ad Türkçe ay", h1);
const turler = new Set(); for (let m = 1; m <= 12; m++) turler.add(E.aylikHedef("2027-" + String(m).padStart(2, "0")).tur);
ok(turler.size === 2, "bir yılda iki hedef türü de çıkar");
const cev = [{ gun: "2026-10-01" }, { gun: "2026-10-01" }, { gun: "2026-10-05" }, { gun: "2026-09-30" }, { gun: null }];
ok(E.aylikIlerleme({ tur: "soru", miktar: 200 }, "2026-10", cev, []) === 3, "soru: yalnız bu ayın cevapları");
ok(E.aylikIlerleme({ tur: "gun", miktar: 15 }, "2026-10", cev, ["2026-10-07", "2026-10-05", "2026-11-01"]) === 3, "gün: cevap + deneme günleri, tekil");
ok(E.ayKalanGun("2026-10-21") === 11 && E.ayKalanGun("2026-02-28") === 1 && E.ayKalanGun("2028-02-28") === 2, "ayın kalan günü (artık yıl)");
ok(E.aylikOne(160, { miktar: 200 }, "2026-10-10") === true, "%80 → öne çıkar");
ok(E.aylikOne(100, { miktar: 200 }, "2026-10-10") === false, "%50, ay ortası → çıkmaz");
ok(E.aylikOne(100, { miktar: 200 }, "2026-10-28") === true, "%50, son 4 gün → çıkar");
ok(E.aylikOne(200, { miktar: 200 }, "2026-10-28") === false, "tamamlandı → çıkmaz");

// 5) Haftalık özet (geçen hafta Pzt 12 Ekim – Paz 18 Ekim 2026)
const hc = [
  { sayfa: "ap-calculus", kap: "c1", c: true, gun: "2026-10-12" }, { sayfa: "ap-calculus", kap: "c1", c: true, gun: "2026-10-13" },
  { sayfa: "ap-calculus", kap: "c2", c: false, gun: "2026-10-13" }, { sayfa: "ap-physics", kap: "p1", c: true, gun: "2026-10-18" },
  { sayfa: "ap-physics", kap: "p1", c: true, gun: "2026-10-19" }, { sayfa: "ap-physics", kap: "p1", c: true, gun: "2026-10-11" }
];
const oz = E.haftaOzeti(hc, ["2026-10-14", "2026-10-20"], { c1: "Ünite 1 · Limits" }, "2026-10-12", O.gunEkle);
ok(oz.soru === 4 && oz.dogru === 3 && oz.dogruluk === 75, "soru / doğruluk yalnız geçen hafta", oz);
ok(oz.xp === 4 * 5 + 3 * 5 + 50, "XP = lig kuralı (+ deneme 50)", oz.xp);
ok(oz.gun === 4, "çalışılan gün (deneme dahil)", oz.gun);
ok(oz.enIyiDers === "Calculus" && oz.gelisenUnite === "Ünite 1 · Limits", "en iyi ders + gelişen ünite (başlıkla)", oz);
ok(E.haftaOzeti([], [], {}, "2026-10-12", O.gunEkle).enIyiDers === null, "boş hafta: ders yok");
ok(E.ozetGosterilsinMi({}, "2026-W43", 1, 4) === true, "pazartesi, gösterilmedi → göster");
ok(E.ozetGosterilsinMi({ "2026-W43": 1 }, "2026-W43", 1, 4) === false, "haftada bir kez");
ok(E.ozetGosterilsinMi({}, "2026-W43", 2, 4) === false, "pazartesi değil → yok");
ok(E.ozetGosterilsinMi({}, "2026-W43", 1, 0) === false, "geçen hafta soru yok → sakin, kart yok");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
