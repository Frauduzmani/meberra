"use strict";
// 1.15.0 Çevrimdışı (PWA): service worker kabuğu önbelleğe alır; bağlantı yokken gezinme /cevrimdisi sayfasını gösterir,
// stiller ve maskot önbellekten gelir; /api/* hiçbir önbellekte yok; bağlantı gelince "Yeniden dene" sayfayı açar.
const { test, expect, ogrenciGiris, konsolSerbest, yatayKaydirmaYok } = require("./yardimci");
const SURUM = require("../package.json").version;

test("çevrimdışı: SW kabuğu önbellekler, gezinmede uykulu maskotlu çevrimdışı sayfa, bağlanınca yeniden dene", async ({ page, context }) => {
  konsolSerbest("çevrimdışıyken ağ istekleri konsola hata yazar");
  await ogrenciGiris(page, "/bugun");

  // Service worker etkin ve sayfayı denetliyor
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  const onbellek = await page.evaluate(async () => {
    const o = {};
    for (const ad of await caches.keys()) o[ad] = (await (await caches.open(ad)).keys()).map(r => new URL(r.url).pathname);
    return o;
  });
  const kabuk = onbellek["meberra-kabuk-" + SURUM];
  expect(kabuk, "sürümlü kabuk önbelleği: " + Object.keys(onbellek).join(", ")).toBeTruthy();
  expect(kabuk).toEqual(expect.arrayContaining(["/cevrimdisi", "/assets/css/styles.css", "/assets/img/maskot/tilki-uykulu.svg", "/assets/fonts/nunito-latin.woff2"]));
  for (const ad of Object.keys(onbellek)) {
    expect(onbellek[ad].filter(p => p.startsWith("/api/")), ad + " içinde API yanıtı olmamalı").toEqual([]);
    if (ad.startsWith("meberra-")) expect(ad.endsWith(SURUM), "eski sürüm önbelleği kalmamalı: " + ad).toBe(true);
  }

  await context.setOffline(true);
  try {
    await page.goto("/ilerleme");
    await expect(page.getByRole("heading", { level: 1, name: "İnternet bağlantın yok gibi" })).toBeVisible();
    await expect(page).toHaveURL(/\/ilerleme$/);
    await expect(page.getByText(/eşitlenir/)).toBeVisible();
    const maskot = page.getByRole("img", { name: "Uykulu Tilo" });
    await expect(maskot).toBeVisible();
    await expect.poll(() => maskot.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
    // Stil önbellekten geldi (styles.css değişkenleri uygulanmış)
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim())).not.toBe("");
    await yatayKaydirmaYok(page);
    // Hâlâ çevrimdışıyken "Yeniden dene" sayfada kalır ve durumu söyler
    await page.getByRole("button", { name: "Yeniden dene" }).click();
    await expect(page.getByRole("status")).toContainText(/çevrimdışı/i);
  } finally {
    await context.setOffline(false);
  }
  // Bağlantı geldi: sayfanın "online" dinleyicisi asıl sayfayı kendiliğinden yeniden yükler
  // (önce /api/health yoklanır; ağ gecikirse 1,5 sn arayla yeniden dener)
  await expect(page.locator('meta[name="meberra-sayfa"]')).toHaveAttribute("content", "ilerleme", { timeout: 30e3 });
  await expect(page).toHaveURL(/\/ilerleme$/);
  await expect(page.getByRole("heading", { name: "İnternet bağlantın yok gibi" })).toHaveCount(0);
});
