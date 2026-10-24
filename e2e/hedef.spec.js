"use strict";
// 1.22.0 Hedef sihirbazı (/ulkem): ülke → okul → şart tablosu → "Bu planı uygula" → kayıt → Bugün.
const { test, expect, yatayKaydirmaYok, SIFRE, CSRF, yeniEposta, girisYap } = require("./yardimci");

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

async function kayitOl(page, ad) {
  const k = page.getByRole("tabpanel", { name: "Kayıt ol" });
  await k.getByLabel("Ad", { exact: true }).fill(ad);
  await k.getByLabel("Soyad").fill("Demir");
  await k.getByLabel("E-posta").fill(yeniEposta("hedef"));
  await k.getByLabel("Şifre", { exact: true }).fill(SIFRE);
  await k.getByLabel("Şifre (tekrar)").fill(SIFRE);
  await k.getByRole("checkbox", { name: /Kullanım koşullarını/ }).check();
  await k.getByRole("checkbox", { name: /KVKK/ }).check();
  await k.getByRole("button", { name: "Ücretsiz hesap oluştur" }).click();
}

test("misafir → planı uygula → kayıt → Bugün", async ({ page }) => {
  await page.goto("/ulkem?u=it,de&o=it-politecnico-di-milano&s=11&a=muhendislik");
  await page.getByRole("button", { name: /Bu planı uygula/ }).click();
  await page.waitForURL(/\/giris/);
  await kayitOl(page, "Ayşe");
  await page.waitForURL(/\/bugun/);
  await expect(page.getByText(/Plan senin, Ayşe/).first()).toBeVisible();
  const me = await (await page.request.get("/api/me")).json();
  expect(me.profile).toMatchObject({ tamamlandi: true, ogrenciModeli: "lise", sinif: "11", aktifRota: "it", hedefAlan: "Mühendislik" });
  expect(me.profile.ulkeler).toEqual(["it", "de"]);
  expect(me.profile.hedefOkullar).toEqual(["it-politecnico-di-milano"]);
  expect(me.profile.apDersleri.map(d => d.ders)).toEqual(["calculus-ab", "physics-1", "chemistry"]);
  expect(page.url()).not.toContain("ilk=1");
});

test("hedef adresi sessionStorage olmadan da uygulanır", async ({ page }) => {
  await page.goto("/giris?donus=%2Fbugun&hedef=" + encodeURIComponent("?u=nl&s=12&a=fen") + "#kayit");
  await kayitOl(page, "Can");
  await page.waitForURL(/\/bugun/);
  const me = await (await page.request.get("/api/me")).json();
  expect(me.profile).toMatchObject({ ulkeler: ["nl"], sinif: "12", hedefAlan: "Fen", tamamlandi: true });
});

test("giriş yapmış öğrenci: mevcut profil korunur", async ({ page }) => {
  const eposta = yeniEposta("hedefg");
  let r = await page.request.post("/api/auth/register", { headers: CSRF, data: { ad: "Deniz", soyad: "Ak", eposta, sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true } });
  expect(r.status()).toBe(200);
  r = await page.request.put("/api/profile", { headers: CSRF, data: { profile: {
    ogrenciModeli: "lise", sinif: "10", ulkeler: ["nl", "at"], egitimDili: "en", tamamlandi: true, aktifRota: "nl", sinavYili: 2028,
    apDersleri: [{ ders: "biology", hedef: 5 }], apHedefSoruldu: new Date().toISOString() } } });
  expect(r.status()).toBe(200);
  await page.context().clearCookies();
  await girisYap(page, eposta, SIFRE, "/bugun");
  await page.goto("/ulkem?u=it,de,cz,es&o=it-politecnico-di-milano&s=10");
  await page.getByRole("button", { name: /Bu planı uygula/ }).click();
  await expect(page.getByRole("status").filter({ hasText: /eklenecek/ })).toContainText("Avusturya listenden çıkacak");
  await page.getByRole("button", { name: "Onayla" }).click();
  await page.waitForURL(/\/bugun/);
  const me = await (await page.request.get("/api/me")).json();
  expect(me.profile).toMatchObject({ sinif: "10", aktifRota: "nl", sinavYili: 2028 });
  expect(me.profile.ulkeler).toEqual(["it", "de", "cz", "es", "nl"]);
  expect(me.profile.apDersleri[0]).toEqual({ ders: "biology", hedef: 5 });
  const listem = await page.evaluate(() => JSON.parse(localStorage.getItem("apmeberra:panel:v1") || "{}").universitelerim);
  expect(listem).toContain("it-politecnico-di-milano");
});

test("vitrin: Ücretsiz başla sihirbazı açar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Ücretsiz başla/ }).first().click();
  await expect(page.locator("#hd-adim-1")).toBeVisible();
});

test("okul araması kartları süzer", async ({ page }) => {
  await page.goto("/ulkem?u=it&adim=2");
  const kartlar = page.locator("#hd-okullar .hz-u");
  await expect(kartlar.first()).toBeVisible();
  await page.locator("#hd-ara").fill("politecnico");
  await expect(page.locator("#hd-okullar .hz-u:visible")).toHaveCount(await page.locator("#hd-okullar .hz-u", { hasText: "Politecnico" }).count());
  await expect(kartlar.filter({ hasText: "Sapienza" })).toBeHidden();
});

test("eski sessionStorage seçimi ilgisiz girişte uygulanmaz", async ({ page }) => {
  const eposta = yeniEposta("hedefs");
  let r = await page.request.post("/api/auth/register", { headers: CSRF, data: { ad: "Ece", soyad: "Ak", eposta, sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true } });
  expect(r.status()).toBe(200);
  r = await page.request.put("/api/profile", { headers: CSRF, data: { profile: { ogrenciModeli: "lise", sinif: "11", ulkeler: ["de"], egitimDili: "en", tamamlandi: true, aktifRota: "de", apHedefSoruldu: new Date().toISOString() } } });
  await page.context().clearCookies();
  await page.goto("/ulkem");
  await page.evaluate(() => sessionStorage.setItem("meberra-hedef", "?u=nl&s=11"));
  await girisYap(page, eposta, SIFRE, "/calis");
  expect(page.url()).toContain("/calis");
  const me = await (await page.request.get("/api/me")).json();
  expect(me.profile.ulkeler).toEqual(["de"]);
});

test("YKS'si bilinmeyen ülkede 'gerekiyor' denmez", async ({ page }) => {
  await page.goto("/ulkem?u=nl&s=11");
  await expect(page.locator("#hd-ortak")).not.toContainText("YKS’ye girmen gerekiyor");
  await expect(page.locator("#hd-ortak")).toContainText("teyit et");
});

test("lise mezunu: planı uygula → profil lise-mezun", async ({ page }) => {
  await page.goto("/ulkem?u=it&s=mezun&a=muhendislik");
  await page.getByRole("button", { name: /Bu planı uygula/ }).click();
  await page.waitForURL(/\/giris/);
  await kayitOl(page, "Mert");
  await page.waitForURL(/\/bugun/);
  const me = await (await page.request.get("/api/me")).json();
  expect(me.profile).toMatchObject({ ogrenciModeli: "lise-mezun", ulkeler: ["it"], tamamlandi: true });
});

test("yalnızca # değişince adım yeniden çizilmez (arama korunur)", async ({ page }) => {
  await page.goto("/ulkem?u=it&adim=2");
  await page.locator("#hd-ara").fill("politecnico");
  await page.evaluate(() => { window.__ara = document.getElementById("hd-ara"); location.hash = "main-content"; });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__ara.isConnected)).toBe(true);
});
