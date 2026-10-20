"use strict";
// Meberra sunucu yapılandırması: tüm ayarlar ortam değişkenlerinden (.env desteği: proje kökündeki .env okunur).
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// Basit .env okuyucu (bağımlılıksız): ANAHTAR=değer satırları; tırnaklar atılır; mevcut ortam değişkeni ezilmez
(function envYukle() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return;
  for (const satir of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(satir);
    if (!m || satir.trim().startsWith("#")) continue;
    let v = m[2];
    if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
})();

const env = process.env;
const uretim = env.NODE_ENV === "production";
const sayi = (v, d) => (v !== undefined && v !== "" && !isNaN(+v) ? +v : d);

const config = {
  ROOT,
  uretim,
  port: sayi(env.PORT, 3000),
  host: env.HOST || "0.0.0.0",
  baseUrl: (env.BASE_URL || "http://localhost:" + sayi(env.PORT, 3000)).replace(/\/+$/, ""),
  dataDir: path.resolve(ROOT, env.DATA_DIR || "server/data"),
  trustProxy: env.TRUST_PROXY === "1" || env.TRUST_PROXY === "true",
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === "1" || env.COOKIE_SECURE === "true" : uretim,
  oturumGun: sayi(env.OTURUM_GUN, 30),
  smtp: {
    host: env.SMTP_HOST || "",
    port: sayi(env.SMTP_PORT, 587),
    user: env.SMTP_USER || "",
    pass: env.SMTP_PASS || "",
    from: env.SMTP_FROM || "Meberra <destek@meberra.com>"
  },
  yonetici: { eposta: env.ADMIN_EPOSTA || "", sifre: env.ADMIN_SIFRE || "" },
  urun: {
    marka: "Meberra",
    para: "₺",
    destekEposta: env.DESTEK_EPOSTA || "destek@meberra.com",
    planlar: [
      { id: "aylik", ad: "Aylık", fiyat: sayi(env.FIYAT_AYLIK, 199), donem: "ay", gun: 30, aciklama: "İstediğin zaman bırak" },
      { id: "yillik", ad: "Yıllık", fiyat: sayi(env.FIYAT_YILLIK, 1490), donem: "yıl", gun: 365, aciklama: "En avantajlı plan", oneCikan: true }
    ],
    ucretsiz: { uniteSayisi: 2, dersDenemesi: 1 },
    banka: {
      banka: env.BANKA_ADI || "[BANKA ADI]",
      iban: env.IBAN || "[TR00 0000 0000 0000 0000 0000 00]",
      hesapSahibi: env.HESAP_SAHIBI || "[HESAP SAHİBİ]",
      aciklamaNotu: "Açıklama kısmına kayıtlı e-posta adresini yaz."
    }
  }
};

config.plan = id => config.urun.planlar.find(p => p.id === id) || null;

module.exports = config;
