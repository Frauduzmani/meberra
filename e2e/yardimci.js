"use strict";
// Ortak test donanımı: her test kendi X-Forwarded-For adresiyle (hız sınırları paylaşılmaz), konsol hatası denetimi,
// kayıt/giriş/yönetici yardımcıları.
const base = require("@playwright/test");
const { expect, request } = base;
const crypto = require("crypto");

const SIFRE = "Deneme-12345";
const CSRF = { "X-Meberra": "1" };
const rastgeleIp = () => "10." + [0, 0, 0].map(() => 1 + crypto.randomInt(250)).join(".");
const yeniEposta = on => (on || "e2e") + "-" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex") + "@ornek.test";

const test = base.test.extend({
  extraHTTPHeaders: async ({}, use) => { await use({ "X-Forwarded-For": rastgeleIp() }); },
  /** Konsol hataları ve yakalanmamış sayfa hataları. Bilerek hata üreten test `konsolSerbest()` çağırır. */
  konsol: [async ({ page }, use, testInfo) => {
    const hatalar = [];
    // Test başlığı X-Forwarded-For CDN font isteklerine de gider → CORS ön kontrolü reddeder (yalnız test ortamı; MathJax fontları)
    const testGurultusu = m => /x-forwarded-for is not allowed|ERR_FAILED/i.test(m.text()) && /cdn\.jsdelivr\.net\/npm\/mathjax/.test(m.text() + " " + (m.location().url || ""));
    page.on("console", m => { if (m.type() === "error" && !testGurultusu(m)) hatalar.push("console: " + m.text() + " @ " + (m.location().url || "")); });
    page.on("pageerror", e => hatalar.push("pageerror: " + e.message));
    await use(hatalar);
    if (!testInfo.annotations.some(a => a.type === "konsol-serbest") && testInfo.status === testInfo.expectedStatus)
      expect(hatalar, "konsolda hata olmamalı").toEqual([]);
  }, { auto: true }]
});

function konsolSerbest(neden) { test.info().annotations.push({ type: "konsol-serbest", description: neden }); }

/** Yatay kaydırma yok: belge genişliği görünür alanı aşmamalı */
async function yatayKaydirmaYok(page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw, "yatay kaydırma (scrollWidth " + o.sw + " > clientWidth " + o.cw + ")").toBeLessThanOrEqual(o.cw + 1);
}

/** API ile öğrenci hesabı + tamamlanmış profil (sihirbaz atlanır). Çerez sayfanın bağlamına yazılır; istemci tarafı
 *  oturumu için ardından `girisYap` çağrılır. */
async function apiOgrenci(page, ad) {
  const eposta = yeniEposta("ogr");
  let r = await page.request.post("/api/auth/register", { headers: CSRF,
    data: { ad: ad || "Ali", soyad: "Kaya", eposta, sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true } });
  expect(r.status(), "kayıt: " + (await r.text())).toBe(200);
  r = await page.request.put("/api/profile", { headers: CSRF, data: { profile: {
    ogrenciModeli: "lise", sinif: "11", ulkeler: ["de"], egitimDili: "en", tamamlandi: true, aktifRota: "de", apHedefSoruldu: new Date().toISOString() } } });
  expect(r.status(), "profil").toBe(200);
  await page.context().clearCookies();
  return eposta;
}

/** Giriş formuyla oturum açar; donus verilirse o sayfaya döner */
async function girisYap(page, eposta, sifre, donus) {
  await page.goto("/giris" + (donus ? "?donus=" + encodeURIComponent(donus) : ""));
  const g = page.getByRole("tabpanel", { name: "Giriş yap" });
  await g.getByLabel("E-posta").fill(eposta);
  await g.getByLabel("Şifre", { exact: true }).fill(sifre || SIFRE);
  await g.getByRole("button", { name: "Giriş yap" }).click();
  await page.waitForURL(u => !/^\/giris/.test(u.pathname));
}

/** Kayıtlı + girişli öğrenci; dönüş: e-posta */
async function ogrenciGiris(page, donus, ad) {
  const eposta = await apiOgrenci(page, ad);
  await girisYap(page, eposta, SIFRE, donus || "/bugun");
  return eposta;
}

const yonetici = () => ({ eposta: process.env.E2E_ADMIN_EPOSTA, sifre: process.env.E2E_ADMIN_SIFRE });

/** Yönetici oturumlu API istemcisi (ayrı çerez kavanozu). Kullanım sonunda dispose() çağrılır. */
async function yoneticiApi() {
  const y = yonetici();
  const c = await request.newContext({ baseURL: process.env.E2E_BASE_URL, extraHTTPHeaders: Object.assign({ "X-Forwarded-For": rastgeleIp() }, CSRF) });
  const r = await c.post("/api/auth/login", { data: { kimlik: y.eposta, sifre: y.sifre } });
  expect(r.status(), "yönetici girişi").toBe(200);
  return c;
}

/** Üst çubuktaki XP sayısı ("Toplam N XP") */
async function xpOku(page) {
  const ad = await page.getByRole("link", { name: /^Toplam \d+ XP$/ }).getAttribute("aria-label").catch(() => null);
  const metin = ad || (await page.getByRole("link", { name: /^Toplam \d+ XP$/ }).textContent());
  return Number((/(\d+)/.exec(metin) || [0, 0])[1]);
}

module.exports = { test, expect, SIFRE, CSRF, konsolSerbest, yatayKaydirmaYok, apiOgrenci, girisYap, ogrenciGiris, yonetici, yoneticiApi, xpOku, yeniEposta };
