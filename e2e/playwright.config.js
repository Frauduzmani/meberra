"use strict";
// Meberra tarayıcı uçtan uca testleri (@playwright/test). Çalıştırma: npm run test:e2e
// Sunucu e2e/kurulum.js içinde boş bir portta, geçici veri klasörüyle başlatılır.
// Tarayıcı: Playwright'ın Chromium'u (npx playwright install chromium). İndirilemiyorsa E2E_KANAL=chrome ya da msedge
// ile kurulu Chrome/Edge kullanılır.
const { defineConfig, devices } = require("@playwright/test");

const kanal = process.env.E2E_KANAL || undefined;
const masaustu = Object.assign({}, devices["Desktop Chrome"], kanal ? { channel: kanal } : {});
// 390×844 telefon görünümü (Chromium motoruyla; dokunma + mobil kullanıcı ajanı)
const mobil = Object.assign({}, devices["Pixel 7"], { viewport: { width: 390, height: 844 } }, kanal ? { channel: kanal } : {});

module.exports = defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.js$/,
  globalSetup: require.resolve("./kurulum.js"),
  outputDir: "../test-results/e2e",
  // Bakım modu ve sunucu durumu paylaşıldığı için testler tek işçide sırayla koşar
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60e3,
  expect: { timeout: 10e3 },
  reporter: process.env.CI
    ? [["list"], ["html", { outputFolder: "../playwright-report", open: "never" }], ["github"]]
    : [["list"], ["html", { outputFolder: "../playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off"
  },
  projects: [
    { name: "chromium", use: masaustu, testIgnore: /mobil\.spec\.js$/ },
    // Mobil öykünme belirgin biçimde yavaş (yüksek DPR + dokunma): daha uzun süre sınırı
    { name: "mobil", use: mobil, testMatch: /(mobil|cevrimdisi)\.spec\.js$/, timeout: 120e3 }
  ]
});
