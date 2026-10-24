"use strict";
// 1.23.0 konu modu: ünite sayfasında konu yolu, konuya göre süzülen sorular, ünite testi, adreste konu.
const { test, expect, ogrenciGiris, yatayKaydirmaYok } = require("./yardimci");

test("konu yolu: konu seçilince yalnız o konunun soruları görünür", async ({ page }) => {
  await ogrenciGiris(page, "/bugun");
  await page.goto("/ders/calculus?unite=1");
  const yol = page.getByRole("navigation", { name: "Ünitenin konuları" });
  await expect(yol).toBeVisible();
  await expect(page.locator("#calc-unit1-quiz-container .question-card").first()).toBeAttached();
  const d116 = yol.locator('[data-kn="1.16"]');
  await expect(d116).toBeVisible();
  await d116.click();
  await expect(page).toHaveURL(/konu=1\.16/);
  const gorunen = page.locator("#calc-unit1-quiz-container .question-card:visible");
  await expect(gorunen.first()).toBeVisible();
  const konular = await gorunen.evaluateAll(L => L.map(c => c.dataset.konu));
  expect(konular.length).toBeGreaterThan(0);
  expect(new Set(konular)).toEqual(new Set(["1.16"]));
  await yol.locator('[data-kn="tum"]').click();
  const hepsi = await page.locator("#calc-unit1-quiz-container .question-card").count();
  await expect(page.locator("#calc-unit1-quiz-container .question-card:visible")).toHaveCount(hepsi);
});

test("adresteki konu açılır; sonraki konu düğmesi ilerletir; telefonda yatay kaydırma yok", async ({ page }) => {
  await ogrenciGiris(page, "/bugun");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ders/calculus?unite=1&konu=1.6");
  await expect(page.locator('.kn-dugum.is-secili[data-kn="1.6"]')).toBeVisible();
  await page.locator("#kn-alt-1 .kn-sonraki").click();
  await expect(page).not.toHaveURL(/konu=1\.6(&|$)/);
  await yatayKaydirmaYok(page);
});
