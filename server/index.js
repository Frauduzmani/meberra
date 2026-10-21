"use strict";
// Meberra sunucusu: node server/index.js
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { olustur } = require("./uygulama");

fs.mkdirSync(path.join(config.dataDir, "yedekler"), { recursive: true });
const { server, db, zamanlayici, gunluk } = olustur();
const { hataAyrinti } = require("./gunluk");

// Süreç düzeyi hatalar sistem günlüğüne (yönetici paneli → Sistem). Yakalanmamış istisnadan sonra süreç güvenli
// durumda olmayabilir: kayıt yazılır ve çıkılır (Docker/systemd yeniden başlatır).
process.on("uncaughtException", e => {
  try { gunluk.hata("sunucu", "Yakalanmamış istisna: " + ((e && e.message) || e), hataAyrinti(e)); } catch (_) { console.error(e); }
  try { db.exec("PRAGMA wal_checkpoint(TRUNCATE)"); } catch (_) { /* yok say */ }
  process.exit(1);
});
process.on("unhandledRejection", e => {
  gunluk.hata("sunucu", "İşlenmemiş Promise reddi: " + ((e && e.message) || e), hataAyrinti(e));
});
process.on("warning", w => {
  // node:sqlite ExperimentalWarning db.js'de zaten susturulur; yine de gelirse yok sayılır
  if (w && w.name === "ExperimentalWarning" && /sqlite/i.test(String(w.message))) return;
  gunluk.uyari("sunucu", "Node uyarısı: " + (w && w.name ? w.name + ": " : "") + ((w && w.message) || w), { stack: w && w.stack, kod: w && w.code });
});
// Hatırlatma / veli raporu / lig devri: 10 dakikada bir (ZAMANLAYICI=0 ile kapatılır)
if (config.zamanlayici) zamanlayici.baslat(10 * 60e3);

server.listen(config.port, config.host, () => {
  gunluk.bilgi("sunucu", "Sunucu başladı", { surum: require("../package.json").version, node: process.version, port: config.port, zamanlayici: config.zamanlayici });
  console.log("Meberra çalışıyor: " + config.baseUrl + "  (veri: " + config.dataDir + ")");
  if (!config.uretim) console.log("Geliştirme modu · tarayıcıda aç: http://localhost:" + config.port);
});

// Temiz kapanış (Docker/systemd SIGTERM gönderir): yeni bağlantıları kes, veritabanını kapat (WAL kontrol noktası)
let kapaniyor = false;
function kapat(sinyal) {
  if (kapaniyor) return;
  kapaniyor = true;
  gunluk.bilgi("sunucu", "Sunucu kapanıyor (" + sinyal + ")", { calismaSn: Math.round(process.uptime()) });
  zamanlayici.durdur();
  server.close(() => process.exit(0));
  try { db.exec("PRAGMA wal_checkpoint(TRUNCATE)"); } catch (e) { /* yok say */ }
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => kapat("SIGTERM"));
process.on("SIGINT", () => kapat("SIGINT"));
