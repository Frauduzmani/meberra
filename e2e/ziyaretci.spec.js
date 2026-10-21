"use strict";
// Ziyaretçi: tanıtım sayfası + örnek soru; eski .html adresleri temiz yollara 301.
const { test, expect, yatayKaydirmaYok } = require("./yardimci");

test("vitrin yüklenir ve örnek soru cevaplanır (sunucuda denetlenir, çözüm görünür)", async ({ page }) => {
  const yanit = await page.goto("/");
  expect(yanit.status()).toBe(200);
  await expect(page).toHaveTitle(/Meberra/);
  const demo = page.getByRole("region", { name: "Hadi, bir soru çöz" });
  await demo.scrollIntoViewIfNeeded();
  const secenekler = demo.locator("[data-demo-opts] .vt-opt");
  await expect(secenekler).toHaveCount(4);
  const cevap = page.waitForResponse(r => r.url().includes("/api/public/demo-soru/cevap"));
  await secenekler.first().click();
  expect((await cevap).status()).toBe(200);
  await expect(demo.getByRole("status")).toContainText(/Doğru/);
  await expect(demo.getByText("Çözüm:")).toBeVisible();
  await expect(secenekler.first()).toBeDisabled();
  await expect(demo.getByRole("link", { name: /ücretsiz başla/ })).toBeVisible();
  await yatayKaydirmaYok(page);
});

test("eski /index.html adresi 301 ile /bugun'a gider; sorgu korunur", async ({ request }) => {
  const r = await request.get("/index.html", { maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expect(r.headers()["location"]).toBe("/bugun");
  const s = await request.get("/ap-calculus.html?unite=2", { maxRedirects: 0 });
  expect(s.status()).toBe(301);
  expect(s.headers()["location"]).toBe("/ders/calculus?unite=2");
});
