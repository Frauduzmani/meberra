"use strict";
// Öğrenci akışları: kayıt + 5 adımlı sihirbaz, ders sayfasında soru, ücretsiz plan sınırları, FRQ, Sorularım → zil, çıkış.
const { test, expect, SIFRE, yeniEposta, ogrenciGiris, girisYap, apiOgrenci, yoneticiApi, xpOku, yatayKaydirmaYok } = require("./yardimci");

test("kayıt → 5 adımlı sihirbaz → Bugün ekranında bugünkü görev", async ({ page }) => {
  await page.goto("/kayit");
  const k = page.getByRole("tabpanel", { name: "Kayıt ol" });
  await k.getByLabel("Ad", { exact: true }).fill("Ece");
  await k.getByLabel("Soyad").fill("Demir");
  await k.getByLabel("E-posta").fill(yeniEposta("kayit"));
  await k.getByLabel("Şifre", { exact: true }).fill(SIFRE);
  await k.getByLabel("Şifre (tekrar)").fill(SIFRE);
  await k.getByRole("checkbox", { name: /Kullanım koşullarını/ }).check();
  await k.getByRole("checkbox", { name: /KVKK/ }).check();
  await k.getByRole("button", { name: "Ücretsiz hesap oluştur" }).click();

  await page.waitForURL(/\/profil/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Merhaba Ece/);
  const adimlar = page.getByRole("list", { name: "Adımlar" }).getByRole("listitem");
  await expect(adimlar).toHaveCount(5);
  const devam = page.getByRole("button", { name: /Devam et/ });
  const adim = n => expect(page.locator("#wzp-" + n)).toHaveAttribute("aria-current", "step");

  await adim(1);
  await page.getByRole("radio", { name: /Lise öğrencisi/ }).check();
  await devam.click();
  await adim(2);
  await page.getByRole("radio", { name: "11. sınıf" }).check();
  await devam.click();
  await adim(3);
  await page.getByRole("checkbox", { name: /^AlmanyaDE/ }).check();
  await devam.click();
  await adim(4);
  await expect(page.getByRole("radio", { name: /^İngilizce/ })).toBeChecked();
  await devam.click();
  await adim(5);
  await page.locator("#wz-step-5").getByText("Calculus AB", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Calculus AB" })).toBeChecked();
  await page.getByRole("button", { name: "Sonra" }).click();
  await page.waitForURL(/\/seviye-testi/);

  // Profil sunucuya yazıldı
  const me = await (await page.request.get("/api/me")).json();
  expect(me.profile).toMatchObject({ tamamlandi: true, ogrenciModeli: "lise", sinif: "11", ulkeler: ["de"] });

  await page.goto("/bugun");
  const karsilama = page.getByRole("region", { name: /Ece!/ });
  await expect(karsilama.getByText("Bugünkü görevin")).toBeVisible();
  await expect(karsilama.getByRole("heading", { level: 2 })).not.toBeEmpty();
  await expect(page.getByRole("region", { name: "Günün görevleri" })).toBeVisible();
  await yatayKaydirmaYok(page);
});

test("ders sayfası: Calculus ünite 1'de soru cevaplanır, XP artar, açıklama görünür", async ({ page }) => {
  await ogrenciGiris(page, "/ders/calculus?unite=1");
  await expect(page).toHaveURL(/\/ders\/calculus\?unite=1/);
  const kart = page.locator(".question-card").first();
  await expect(kart).toBeVisible();
  const once = await xpOku(page);
  await kart.locator('.option-btn[data-opt="A"]').click();
  await expect(kart.locator(".feedback-box")).toBeVisible();
  await expect(kart.locator(".feedback-box")).toContainText(/Doğru Seçenek|Doğru cevap|Doğru!/);
  await expect(kart.locator(".option-btn").first()).toBeDisabled();
  await expect.poll(() => xpOku(page)).toBeGreaterThan(once);
  await expect(page.getByText(/1 \/ \d+ çözüldü/)).toBeVisible();
  await yatayKaydirmaYok(page);
});

test("ücretsiz plan: ünite 3 Premium kilidi gösterir, soru kartı yok", async ({ page }) => {
  await ogrenciGiris(page, "/ders/calculus?unite=3");
  await expect(page.getByRole("heading", { name: /Ünite 3 .*Premium'da/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Premium'a geç" })).toHaveAttribute("href", /\/premium/);
  await expect(page.getByRole("link", { name: /Ünite 1 · Limits and Continuity/ })).toBeVisible();
  await expect(page.locator(".question-card")).toHaveCount(0);
});

test("/deneme: genel deneme ücretsiz planda kilit kartı; ders denemeleri açık", async ({ page }) => {
  await ogrenciGiris(page, "/deneme");
  await expect(page.getByRole("heading", { level: 1, name: "AP çoktan seçmeli deneme" })).toBeVisible();
  const genel = page.getByRole("region", { name: /Genel deneme/ });
  await expect(genel).toContainText("Premium");
  await expect(genel.getByRole("link", { name: /Premium.a geç/ })).toBeVisible();
  const dersler = page.getByRole("region", { name: "Ders denemeleri" });
  await expect(dersler.getByRole("link", { name: /Denemeyi kur/ }).first()).toBeVisible();
});

test("/frq: FRQ listesi yüklenir ve ders süzgeci çalışır", async ({ page }) => {
  await ogrenciGiris(page, "/frq");
  await expect(page.getByRole("heading", { level: 1, name: "FRQ pratiği" })).toBeVisible();
  const liste = page.locator("#main-content").getByRole("listitem").filter({ has: page.getByRole("button", { name: /^AP / }) });
  await expect.poll(() => liste.count()).toBeGreaterThan(10);
  const suzgec = page.getByRole("group", { name: "Ders" }).getByRole("button", { name: /^Calculus \d+$/ });
  const n = Number((/(\d+)$/.exec(await suzgec.textContent()) || [])[1]);
  await suzgec.click();
  await expect(suzgec).toHaveAttribute("aria-pressed", "true");
  await expect(liste).toHaveCount(n);
  for (const t of await liste.allTextContents()) expect(t).toMatch(/AP Calculus/);
});

test("Sorularım: soru kartından soru sorulur → yönetici API ile yanıtlar → zilde bildirim", async ({ page }) => {
  await ogrenciGiris(page, "/ders/calculus?unite=1");
  const kart = page.locator(".question-card").first();
  await kart.locator('.option-btn[data-opt="A"]').click();
  await kart.getByRole("button", { name: "Bu soruyu anlamadım" }).click();
  const pencere = page.getByRole("dialog", { name: "Bu soruyu anlamadım" });
  await expect(pencere).toBeVisible();
  await pencere.getByLabel("Neresini anlamadın?").fill("Eşlenikle çarpma adımını anlamadım.");
  await pencere.getByRole("button", { name: "Gönder" }).click();
  await expect(pencere.getByRole("heading", { name: "Sorun bize ulaştı!" })).toBeVisible();

  const y = await yoneticiApi();
  try {
    const liste = await (await y.get("/api/admin/sorular")).json();
    const soru = liste.sorular.find(s => /Eşlenikle çarpma/.test(s.metin || s.sonMesaj || "")) || liste.sorular[0];
    expect(soru, "yönetici kuyruğunda soru").toBeTruthy();
    const r = await y.post("/api/admin/sorular/" + soru.id + "/yanit", { data: { metin: "Pay ve paydayı eşlenikle çarp, sonra sadeleştir." } });
    expect(r.status()).toBe(200);
  } finally { await y.dispose(); }

  await page.goto("/bugun");
  const zil = page.getByRole("button", { name: /^Bildirimler, 1 okunmamış/ });
  await expect(zil).toBeVisible();
  await zil.click();
  const panel = page.getByRole("region", { name: "Bildirimler" });
  const bildirim = panel.getByRole("link", { name: /Sorun yanıtlandı/ });
  await expect(bildirim).toBeVisible();
  await expect(bildirim).toHaveAttribute("href", /\/sorularim\?soru=\d+/);
  await bildirim.click();
  await page.waitForURL(/\/sorularim/);
  await expect(page.getByText("Pay ve paydayı eşlenikle çarp, sonra sadeleştir.")).toBeVisible();
});

test("çıkış: oturum ve yerel hesap verisi temizlenir, korumalı sayfa girişe yönlendirir", async ({ page }) => {
  await ogrenciGiris(page, "/bugun");
  const oturumAnahtarlari = () => page.evaluate(() => Object.keys(localStorage).filter(k => /^apmeberra-hesap:v1:(oturum|aktif|profil)/.test(k) && localStorage.getItem(k) && localStorage.getItem(k) !== "null"));
  expect((await oturumAnahtarlari()).length).toBeGreaterThan(0);
  await page.getByRole("button", { name: /Hesap menüsü/ }).click();
  await page.getByRole("link", { name: "Çıkış yap" }).click();
  await page.waitForURL(/\/giris/);
  await expect.poll(oturumAnahtarlari).toEqual([]);
  expect((await page.context().cookies()).filter(c => c.name === "meberra_sid" && c.value)).toEqual([]);
  expect((await page.request.get("/api/me")).status()).toBe(401);
  await page.goto("/bugun");
  await page.waitForURL(/\/giris/);
});
