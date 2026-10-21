"use strict";
// Web push (VAPID). Anahtarlar .env'den (VAPID_PUBLIC / VAPID_PRIVATE / VAPID_SUBJECT) okunur; yoksa bir kez üretilip
// DATA_DIR/vapid.json dosyasına yazılır (sunucu yeniden başlayınca abonelikler geçerli kalsın diye).
const fs = require("fs");
const path = require("path");
const config = require("./config");

function vapidAnahtarlari(secenek) {
  secenek = secenek || {};
  if (secenek.vapid) return secenek.vapid;
  const webpush = require("web-push");
  const konu = config.vapid.subject || "mailto:" + config.urun.destekEposta;
  if (config.vapid.public && config.vapid.private) return { publicKey: config.vapid.public, privateKey: config.vapid.private, subject: konu };
  // Bellek içi veritabanında (testler) diske yazılmaz
  if (secenek.gecici) return Object.assign(webpush.generateVAPIDKeys(), { subject: konu });
  const dosya = path.join(config.dataDir, "vapid.json");
  try {
    const k = JSON.parse(fs.readFileSync(dosya, "utf8"));
    if (k.publicKey && k.privateKey) return { publicKey: k.publicKey, privateKey: k.privateKey, subject: konu };
  } catch (e) { /* yok: üretilecek */ }
  const k = webpush.generateVAPIDKeys();
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(dosya, JSON.stringify({ publicKey: k.publicKey, privateKey: k.privateKey, olusturma: new Date().toISOString() }, null, 2), { mode: 0o600 });
  console.log("[push] VAPID anahtarları üretildi: " + dosya);
  return Object.assign(k, { subject: konu });
}

/** Gönderici: (abonelik {endpoint, keys:{p256dh, auth}}, yük dizesi) → Promise. Hata nesnesinde statusCode olur (404/410: abonelik ölü). */
function pushGondericisi(vapid) {
  const webpush = require("web-push");
  return (abonelik, yuk) => webpush.sendNotification(abonelik, yuk, { TTL: 12 * 3600, vapidDetails: { subject: vapid.subject, publicKey: vapid.publicKey, privateKey: vapid.privateKey } });
}

module.exports = { vapidAnahtarlari, pushGondericisi };
