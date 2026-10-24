"use strict";
// 1.22.0 Hedef sihirbazı (/ulkem): ülke → okul → şart tablosu → "Bu planı uygula" → kayıt → Bugün.
const { test, expect, yatayKaydirmaYok } = require("./yardimci");

async function ulkeSec(page, ad) { await page.locator("#hd-adim-1").getByRole("checkbox", { name: ad, exact: true }).check(); }

test("misafir: ülke → okul → tablo", async ({ page }) => {
  await page.goto("/ulkem");
  const a1 = page.locator("#hd-adim-1");
  await expect(a1).toBeVisible();
  const devam = a1.getByRole("button", { name: /Devam et/ });
  await expect(devam).toBeDisabled();
  await ulkeSec(page, "İtalya");
  await ulkeSec(page, "Almanya");
  await expect(page.locator("#hd-sayac")).toContainText("2 ülke");
  for (const ad of ["Hollanda", "Avusturya", "Çekya"]) await ulkeSec(page, ad);
  const altinci = a1.getByRole("checkbox", { name: "İspanya", exact: true });
  await altinci.click();
  await expect(altinci).not.toBeChecked();
  for (const ad of ["Hollanda", "Avusturya", "Çekya"]) await a1.getByRole("checkbox", { name: ad, exact: true }).uncheck();
  await devam.click();

  const a2 = page.locator("#hd-adim-2");
  await expect(a2).toBeVisible();
  await a2.getByRole("checkbox", { name: /Politecnico di Milano/ }).check();
  await a2.getByRole("button", { name: /Tablomu göster/ }).click();

  await expect(page.locator("#hd-adim-3")).toBeVisible();
  const tablo = page.locator("#hd-tablo");
  await expect(tablo.locator("thead th[data-sutun]")).toHaveCount(2);
  await expect(page.locator("#hd-ortak")).toContainText("Calculus");
  await page.getByRole("radiogroup", { name: "Alan" }).getByRole("radio", { name: /Tıp/ }).check();
  await expect(page.locator("#hd-ortak")).toContainText("Biology");
  expect(page.url()).toContain("a=tip");
});

test("okul bilmiyorum: ülke sütunu", async ({ page }) => {
  await page.goto("/ulkem");
  await ulkeSec(page, "Hollanda");
  await page.locator("#hd-adim-1").getByRole("button", { name: /Devam et/ }).click();
  await page.getByRole("button", { name: /Okul bilmiyorum/ }).click();
  await expect(page.locator("#hd-tablo thead th[data-sutun]")).toHaveCount(1);
  await expect(page.locator("#hd-tablo thead")).toContainText("Hollanda");
});

test("eski bağlantı ?ulke=de sonuç ekranını açar", async ({ page }) => {
  await page.goto("/ulkem?ulke=de");
  await expect(page.locator("#hd-adim-3")).toBeVisible();
  await expect(page.locator("#hd-tablo thead")).toContainText("Almanya");
  await expect(page.locator("#hd-ortak")).toContainText("YKS");
});

test("tam eski seçim (dil=) ülke ayrıntısını açar", async ({ page }) => {
  await page.goto("/ulkem?model=lise&sinif=11&ulke=it&dil=en");
  await expect(page.locator("#hd-sihirbaz")).toBeHidden();
  await expect(page.locator("#sr-root")).toContainText("İtalya");
});

test("telefon: 3 sütunlu tabloda sayfa yatay kaymaz", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/ulkem?u=it,de,nl&s=11");
  await expect(page.locator("#hd-adim-3")).toBeVisible();
  await expect(page.locator("#hd-tablo thead th[data-sutun]")).toHaveCount(3);
  await yatayKaydirmaYok(page);
});
