"use strict";
// 1.27.0 Bugün: tahmini AP puanı göstergesi — soru çözünce görünür, halka + sonraki adım bağlantısı, "tahminidir" notu.
const { test, expect, ogrenciGiris } = require("./yardimci");

test("Bugün: 10+ soru çözen öğrencide tahmini AP puanı ve tek sonraki adım", async ({ page }) => {
  await ogrenciGiris(page, "/bugun");
  // Calculus Unit 1'de 12 cevap (10 doğru) sunucuya yazılır (ilerleme.test.js ile aynı yol: PUT /api/state)
  const l = await page.request.get("/api/sorular-bankasi/ap-calculus/calc-unit1-quiz-container");
  const sorular = (await l.json()).kutular[0].sorular.slice(0, 12);
  const answers = {};
  sorular.forEach((q, i) => { answers[q.id] = { s: "A", c: i < 10, t: new Date(Date.now() - (i + 1) * 60000).toISOString() }; });
  const r = await page.request.put("/api/state", { headers: { "X-Meberra": "1" },
    data: { degisiklikler: { "apmeberra:quiz:v1": JSON.stringify({ v: 1, pages: { "ap-calculus": { units: { "calc-unit1-quiz-container": { title: "Unit 1", answers } } } } }) } } });
  expect(r.status()).toBe(200);
  await page.goto("/bugun");
  const t = page.locator("#bg-tahmin");
  await expect(t).toBeVisible();
  await expect(t).toContainText("Tahmini AP puanın");
  await expect(t.locator(".bt-ders").first()).toContainText(/Calculus/);
  await expect(t.locator(".bt-sayi").first()).toHaveText(/^[1-5]$/);
  await expect(t.locator(".bt-adim")).toHaveAttribute("href", /\/ders\/calculus\?unite=\d+/);
  await expect(t.locator(".bt-not")).toContainText("Tahminidir");
});
