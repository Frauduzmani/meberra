"use strict";
// Yönetici: panel sekmeleri, öğrenciye 404, bakım modu (öğrenci bakım sayfası görür, yönetici atlar).
const { test, expect, girisYap, ogrenciGiris, yonetici, yoneticiApi, konsolSerbest } = require("./yardimci");

test("yönetici /yonetim panelini açar; Özet, Destek merkezi, Soru bankası, Sistem sekmeleri yüklenir", async ({ page }) => {
  const y = yonetici();
  await girisYap(page, y.eposta, y.sifre, "/yonetim");
  if (!/\/yonetim/.test(page.url())) await page.goto("/yonetim");
  await expect(page.getByRole("heading", { level: 1, name: "Yönetici paneli" })).toBeVisible();
  const sekmeler = page.getByRole("tablist", { name: "Yönetici bölümleri" });
  for (const ad of ["Özet", "Destek merkezi", "Soru bankası", "Sistem"]) {
    const sekme = sekmeler.getByRole("tab", { name: ad, exact: true });
    await sekme.click();
    await expect(sekme).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel", { name: ad });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading").first()).toBeVisible();
  }
  await expect(page.getByRole("tabpanel", { name: "Sistem" })).not.toContainText(/Yükleniyor…$/);
});

test("öğrenci için /yonetim ve /admin.html 404 (yol varlığı belli olmaz)", async ({ page }) => {
  konsolSerbest("404 sayfası tarayıcı konsoluna 'Failed to load resource: 404' yazar");
  await ogrenciGiris(page, "/bugun");
  const r = await page.goto("/yonetim");
  expect(r.status()).toBe(404);
  await expect(page.locator("#main-content, main").first()).toBeVisible();
  expect((await page.request.get("/admin.html", { maxRedirects: 0 })).status()).toBe(404);
  expect((await page.request.get("/api/admin/sorular")).status()).toBe(403);
});

test("bakım modu: öğrenci bakım sayfası (503) görür, yönetici atlar; kapatınca normale döner", async ({ page, browser }) => {
  konsolSerbest("bakımda sayfa ve API istekleri 503 döner");
  await ogrenciGiris(page, "/bugun");
  const y = await yoneticiApi();
  const yb = await browser.newContext({ extraHTTPHeaders: { "X-Forwarded-For": "10.250.0." + (1 + Math.floor(Math.random() * 200)) } });
  try {
    const ac = await y.post("/api/admin/bakim", { data: { acik: true, mesaj: "E2E bakım: birazdan döneceğiz." } });
    expect(ac.status()).toBe(200);

    const r = await page.goto("/bugun");
    expect(r.status()).toBe(503);
    expect(r.headers()["retry-after"]).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1, name: "Kısa bir bakımdayız" })).toBeVisible();
    await expect(page.getByText("E2E bakım: birazdan döneceğiz.")).toBeVisible();
    expect((await page.request.get("/api/state")).status()).toBe(503);
    // Giriş sayfası bakımda da açık
    expect((await page.request.get("/giris")).status()).toBe(200);

    const yp = await yb.newPage();
    const ys = yonetici();
    await girisYap(yp, ys.eposta, ys.sifre, "/bugun");
    const yr = await yp.goto("/bugun");
    expect(yr.status()).toBe(200);
    await expect(yp.getByRole("heading", { name: "Kısa bir bakımdayız" })).toHaveCount(0);
  } finally {
    await y.post("/api/admin/bakim", { data: { acik: false } });
    await y.dispose();
    await yb.close();
  }
  const r2 = await page.goto("/bugun");
  expect(r2.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Kısa bir bakımdayız" })).toHaveCount(0);
});
