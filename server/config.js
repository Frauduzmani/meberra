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

// Yıllık plan açıklaması fiyatlardan hesaplanır (assets/js/urun.js aynı formülü kullanır): "Ayda yaklaşık 124 ₺ · %38 tasarruf"
function yillikAciklama(aylik, yillik) {
  const ay = Math.round(yillik / 12), tasarruf = Math.round((1 - yillik / (aylik * 12)) * 100);
  return "Ayda yaklaşık " + ay.toLocaleString("tr-TR") + " ₺" + (tasarruf > 0 ? " · %" + tasarruf + " tasarruf" : "");
}
const FIYAT_AYLIK = sayi(env.FIYAT_AYLIK, 199), FIYAT_YILLIK = sayi(env.FIYAT_YILLIK, 1490);

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
  // Web push (VAPID). Boşsa anahtarlar bir kez üretilip DATA_DIR/vapid.json'a yazılır.
  vapid: { public: env.VAPID_PUBLIC || "", private: env.VAPID_PRIVATE || "", subject: env.VAPID_SUBJECT || "" },
  // Hatırlatmalar: zamanlayıcı (ZAMANLAYICI=0 ile kapatılır) ve yeni kullanıcının varsayılan saati (8–21, İstanbul)
  zamanlayici: env.ZAMANLAYICI !== "0",
  hatirlatmaSaati: Math.min(21, Math.max(8, Math.floor(sayi(env.HATIRLATMA_SAATI, 19)))),
  // Ücretsiz planda takvim ayı başına soru hakkı (Premium ve yöneticiler sınırsız)
  soruHakki: Math.max(0, Math.floor(sayi(env.UCRETSIZ_SORU_HAKKI, 3))),
  // Google Play (Trusted Web Activity): /.well-known/assetlinks.json bu iki değerden üretilir (SHA-256 parmak izleri virgülle)
  android: {
    paket: (env.ANDROID_PAKET_ADI || "").trim(),
    sha256: String(env.ANDROID_SHA256 || "").split(",").map(s => s.trim().toUpperCase()).filter(s => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s))
  },
  urun: {
    marka: "Meberra",
    para: "₺",
    destekEposta: env.DESTEK_EPOSTA || "destek@meberra.com",
    planlar: [
      { id: "aylik", ad: "Aylık", fiyat: FIYAT_AYLIK, donem: "ay", gun: 30, aciklama: "İstediğin zaman bırak" },
      { id: "yillik", ad: "Yıllık", fiyat: FIYAT_YILLIK, donem: "yıl", gun: 365, aciklama: yillikAciklama(FIYAT_AYLIK, FIYAT_YILLIK), oneCikan: true }
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
