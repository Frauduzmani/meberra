"use strict";
// 1.26.0 /ap-nedir: giriş gerekmez; 6 sahne aynı kart iskeletinde; kart çevirme, puan kaydırıcısı, takvim, mini test → rozet.
const { test, expect, yatayKaydirmaYok } = require("./yardimci");

test("10 dakikada AP: sahneler, mini test ve AP Kâşifi rozeti", async ({ page }) => {
  await page.goto("/ap-nedir");
  const kap = page.locator("#an-yolculuk");
  await expect(kap.getByRole("heading", { level: 1, name: "AP nedir?" })).toBeVisible();
  const kart = kap.locator('[data-kart="0"]');
  await kart.click();
  await expect(kart).toHaveAttribute("aria-pressed", "true");
  const yukseklik = async () => (await kap.locator(".hz-kart").boundingBox()).height;
  const h1 = await yukseklik();
  await kap.getByRole("button", { name: "Devam et →" }).click();
  await expect(kap.getByRole("heading", { level: 1, name: "1'den 5'e puan" })).toBeVisible();
  await kap.locator("#an-kaydir").fill("5");
  await expect(kap.locator(".an-puan-not")).toContainText("En yüksek puan");
  await kap.getByRole("button", { name: "Devam et →" }).click();
  await kap.locator('[data-bolum="frq"]').click();
  await expect(kap.locator(".an-frq p")).toBeVisible();
  await kap.getByRole("button", { name: "Devam et →" }).click();
  await expect(kap.getByRole("heading", { level: 1, name: "Türkiye'den nasıl girilir?" })).toBeVisible();
  await expect(kap.locator(".an-zaman li")).toHaveCount(5);
  expect(Math.abs((await yukseklik()) - h1)).toBeLessThan(2);
  await kap.getByRole("button", { name: "Devam et →" }).click();
  await kap.getByRole("button", { name: "Mini teste geç 🎯" }).click();
  await expect(page).toHaveURL(/sahne=6/);
  const dogrular = await page.evaluate(() => window.MeberraApNedir.TEST.map(q => q.siklar[q.dogru]));
  for (const d of dogrular) await kap.getByRole("button", { name: d, exact: true }).click();
  await expect(kap.getByRole("heading", { level: 2, name: "AP Kâşifi rozeti senin!" })).toBeVisible();
  await expect(kap.getByRole("link", { name: "Hedefimi seç 🎯" })).toHaveAttribute("href", "/ulkem");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("meberra:ap-nedir")).rozet)).toBe("kasif");
});

test("telefon: yatay kaydırma yok; adresteki sahne açılır", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ap-nedir?sahne=4");
  await expect(page.locator("#an-yolculuk").getByRole("heading", { level: 1, name: "Türkiye'den nasıl girilir?" })).toBeVisible();
  await yatayKaydirmaYok(page);
});

test("Bugün: rozeti olmayan yeni öğrenciye '10 dakikada AP' kartı; rozetten sonra yok", async ({ page }) => {
  const { ogrenciGiris } = require("./yardimci");
  await ogrenciGiris(page, "/bugun");
  const kart = page.locator("#bg-baglam #bg-apnedir");
  await expect(kart).toBeVisible();
  await expect(kart).toHaveAttribute("href", "/ap-nedir");
  await page.evaluate(() => localStorage.setItem("meberra:ap-nedir", JSON.stringify({ rozet: "kasif", tarih: "2026-10-24" })));
  await page.reload();
  await expect(page.locator("#bg-apnedir")).toHaveCount(0);
});
