// 1.27.0 — Tahmini AP puanı modeli: CED ünite ağırlıkları × (şansa doğru büzülmüş) ünite doğruluğu + FRQ öz puanı + yakın deneme.
// Çalıştır: node araclar/testler/puan-tahmin-birim-test.js
"use strict";
const path = require("path");
const P = require(path.join(__dirname, "..", "..", "assets", "js", "puan-tahmin.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };
const yak = (a, b, e) => Math.abs(a - b) <= (e || 0.01);

const PLAN = { agirlik: { I: 50, II: 50 }, uniteAgirlik: { 1: 25, 2: 25, 3: 50 }, esikler: [{ puan: 5, min: 70 }, { puan: 4, min: 55 }, { puan: 3, min: 40 }, { puan: 2, min: 25 }] };

// 1) Büzülme: hiç cevap yoksa şans (%25); çok cevapla gerçek doğruluğa yaklaşır
ok(P.uniteOrani({ cevap: 0, dogru: 0 }) === 25, "çalışılmamış ünite %25 (şans)");
ok(yak(P.uniteOrani({ cevap: 5, dogru: 5 }), (5 + 0.25 * 5) / 10 * 100), "5/5 → büzülmüş %62.5");
ok(P.uniteOrani({ cevap: 200, dogru: 180 }) > 88, "200 cevapta gerçek orana yakın");
// 2) Bant ve ince puan
ok(P.bant(PLAN.esikler, 70) === 5 && P.bant(PLAN.esikler, 54.9) === 3 && P.bant(PLAN.esikler, 10) === 1, "bant eşikleri");
ok(yak(P.ince(PLAN.esikler, 47.5), 3.5) && P.ince(PLAN.esikler, 90) === 5 && P.ince(PLAN.esikler, 0) === 1, "ince puan eşikler arasında doğrusal", P.ince(PLAN.esikler, 47.5));
// 3) Yalnız Ünite 1'de %100 → ağırlıklı MCQ düşük kalır (kapsam önemlidir)
{
  const r = P.tahmin(PLAN, { uniteler: { 1: { cevap: 60, dogru: 60 } }, frq: [] });
  ok(r.mcq < 50 && r.puan <= 2, "tek ünite mükemmel ama kapsam dar → düşük tahmin", r);
  ok(r.frqKaynak === "tahmin" && r.guven !== "yuksek", "FRQ yok → tahmin edilir, güven yüksek olamaz");
  ok(r.kaldirac && r.kaldirac.unite === "3", "en büyük kaldıraç en ağır çalışılmamış ünite (3)", r.kaldirac);
}
// 4) Her ünite iyi + FRQ öz puanı → yüksek
{
  const r = P.tahmin(PLAN, { uniteler: { 1: { cevap: 80, dogru: 68 }, 2: { cevap: 80, dogru: 68 }, 3: { cevap: 120, dogru: 102 } }, frq: [80, 70] });
  ok(r.puan === 5 && r.frqKaynak === "oz" && yak(r.frq, 75) && r.guven === "yuksek", "geniş ve doğru + FRQ → 5, güven yüksek", r);
  ok(r.sonraki === null, "5'te sonraki bant yok");
}
// 5) Yakın deneme (≤ 30 gün) modelle harmanlanır; eski deneme sayılmaz
{
  const g = { uniteler: { 1: { cevap: 40, dogru: 30 }, 2: { cevap: 40, dogru: 30 }, 3: { cevap: 40, dogru: 30 } }, frq: [60] };
  const a = P.tahmin(PLAN, g), b = P.tahmin(PLAN, Object.assign({ deneme: { puan: 5, gunOnce: 3 } }, g)), c = P.tahmin(PLAN, Object.assign({ deneme: { puan: 5, gunOnce: 60 } }, g));
  ok(b.ince > a.ince && b.kaynak === "model+deneme" && c.ince === a.ince && c.kaynak === "model", "deneme harmanı", [a.ince, b.ince, c.ince]);
}
// 6) Sonraki bant hedefi ve kaldıraç ünitesi bandı aşıyorsa yeniPuan
{
  const r = P.tahmin(PLAN, { uniteler: { 1: { cevap: 60, dogru: 50 }, 2: { cevap: 60, dogru: 50 }, 3: { cevap: 10, dogru: 3 } }, frq: [50] });
  ok(r.sonraki && r.sonraki.puan === r.puan + 1 && r.sonraki.gereken > r.kompozit, "sonraki bant hedefi", r.sonraki);
  ok(r.kaldirac.unite === "3" && r.kaldirac.puanYeni >= r.puan, "kaldıraç: Ünite 3'ü %85'e çıkarmak", r.kaldirac);
}
// 7) Ünite ağırlığı olmayan ders (English): genel doğrulukla
{
  const r = P.tahmin({ agirlik: { I: 45, II: 55 }, uniteAgirlik: null, esikler: PLAN.esikler }, { genel: { cevap: 50, dogru: 35 }, frq: [] });
  ok(r.mcq > 60 && r.kaldirac === null, "ünitesiz ders genel doğrulukla, kaldıraç yok", r);
}
// 8) Sınava kalan hafta
ok(P.haftaKaldi("2026-10-25") === 27 && P.haftaKaldi("2027-06-01") === 0, "Mayıs 2027'ye kalan hafta", P.haftaKaldi("2026-10-25"));
console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
