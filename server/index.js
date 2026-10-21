"use strict";
// Meberra sunucusu: node server/index.js
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { olustur } = require("./uygulama");

fs.mkdirSync(path.join(config.dataDir, "yedekler"), { recursive: true });
const { server, db, zamanlayici } = olustur();
// Hatırlatma / veli raporu / lig devri: 10 dakikada bir (ZAMANLAYICI=0 ile kapatılır)
if (config.zamanlayici) zamanlayici.baslat(10 * 60e3);

server.listen(config.port, config.host, () => {
  console.log("Meberra çalışıyor: " + config.baseUrl + "  (veri: " + config.dataDir + ")");
  if (!config.uretim) console.log("Geliştirme modu · tarayıcıda aç: http://localhost:" + config.port);
});

// Temiz kapanış (Docker/systemd SIGTERM gönderir): yeni bağlantıları kes, veritabanını kapat (WAL kontrol noktası)
let kapaniyor = false;
function kapat(sinyal) {
  if (kapaniyor) return;
  kapaniyor = true;
  console.log(sinyal + " alındı, kapanıyor…");
  zamanlayici.durdur();
  server.close(() => process.exit(0));
  try { db.exec("PRAGMA wal_checkpoint(TRUNCATE)"); } catch (e) { /* yok say */ }
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => kapat("SIGTERM"));
process.on("SIGINT", () => kapat("SIGINT"));
