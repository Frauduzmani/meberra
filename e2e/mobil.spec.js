"use strict";
// 390×844 telefon görünümü (yalnızca "mobil" projesinde): ana akışlarda yatay kaydırma yok, konsol temiz.
const { test, expect, ogrenciGiris, yatayKaydirmaYok } = require("./yardimci");

test("mobil: vitrin + örnek soru, yatay kaydırma yok", async ({ page }) => {
  await page.goto("/");
  await yatayKaydirmaYok(page);
  const demo = page.getByRole("region", { name: "Hadi, bir soru çöz" });
  await demo.scrollIntoViewIfNeeded();
  await demo.locator("[data-demo-opts] .vt-opt").nth(1).tap();
  await expect(demo.getByRole("status")).toContainText(/Doğru/);
  await yatayKaydirmaYok(page);
});

test("mobil: giriş → Bugün, yatay kaydırma yok", async ({ page }) => {
  await ogrenciGiris(page, "/bugun");
  await expect(page.getByText("Bugünkü görevin")).toBeVisible();
  await yatayKaydirmaYok(page);
  await page.goto("/deneme");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await yatayKaydirmaYok(page);
});

test("mobil: ders sayfasında soru cevaplanır, yatay kaydırma yok", async ({ page }) => {
  await ogrenciGiris(page, "/ders/calculus?unite=1");
  const kart = page.locator(".question-card:visible").first(); // 1.23.0: konu modu ilk konuya süzer
  await kart.locator('.option-btn[data-opt="B"]').tap();
  await expect(kart.locator(".feedback-box")).toBeVisible();
  await yatayKaydirmaYok(page);
});
