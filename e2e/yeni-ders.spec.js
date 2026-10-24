"use strict";
// 1.28.0 yeni dersler (Precalculus, Statistics, Physics 2): sayfa kendi adresinde açılır, ünite görünümü CED ünitelerini
// doğru sayı ve başlıkla gösterir; ünite 1 istasyonunda onaylı sorular yüklenir (1.28.0 içerik dalgası).
const { test, expect, ogrenciGiris, yatayKaydirmaYok } = require("./yardimci");

const DERSLER = [
  { yol: "/ders/precalculus", baslik: "AP Precalculus", kutu: "precalc-unit1-quiz-container",
    uniteler: ["Polynomial and Rational Functions", "Exponential and Logarithmic Functions", "Trigonometric and Polar Functions", "Functions Involving Parameters, Vectors, and Matrices"] },
  { yol: "/ders/statistics", baslik: "AP Statistics", kutu: "stat-unit1-quiz-container",
    uniteler: ["Exploring One-Variable Data and Collecting Data", "Probability, Random Variables, and Probability", "Inference for Categorical Data: Proportions",
      "Inference for Quantitative Data: Means", "Regression Analysis"] },
  { yol: "/ders/physics-2", baslik: "AP Physics 2", kutu: "phys2-unit9-quiz-container",
    uniteler: ["Thermodynamics", "Electric Force, Field, and Potential", "Electric Circuits", "Magnetism and Electromagnetism", "Geometric Optics",
      "Waves, Sound, and Physical Optics", "Modern Physics"] }
];

for (const d of DERSLER) {
  test(d.baslik + ": ünite görünümü CED üniteleri; ilk ünitede sorular yüklenir", async ({ page }) => {
    await ogrenciGiris(page, "/bugun");
    await page.goto(d.yol);
    await expect(page.getByRole("heading", { level: 1, name: d.baslik })).toBeVisible();
    const kartlar = page.locator(".ug-panel .ug-kart");
    await expect(kartlar).toHaveCount(d.uniteler.length);
    const adlar = await page.locator(".ug-panel .ug-kart b").allTextContents();
    d.uniteler.forEach((ad, i) => expect(adlar[i]).toContain(ad));
    // Physics 2 numaralandırması Physics 1'in devamı: başlıkta Unit 9–15, sırada 1–7
    if (d.yol === "/ders/physics-2") expect(await page.locator(".ug-panel .ug-no").allTextContents()).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    await expect(page.locator(".ug-panel .ug-ozet")).toContainText(d.uniteler.length + " ünite");
    await page.goto(d.yol + "?unite=1");
    const kutu = page.locator("#" + d.kutu);
    await expect(kutu).toBeAttached();
    await expect(kutu.locator(".question-card:visible").first()).toBeVisible();
    await expect(kutu.locator(".sb-durum.is-yakinda")).toHaveCount(0);
    await yatayKaydirmaYok(page);
  });
}
