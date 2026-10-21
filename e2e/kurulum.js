"use strict";
// Playwright global kurulum: sunucuyu boş bir porta, geçici DATA_DIR ile başlatır (ZAMANLAYICI=0, NODE_ENV=test).
// Yönetici kimliği her çalıştırmada rastgele üretilir ve yalnızca ortam değişkeniyle test süreçlerine geçer (asla yazdırılmaz).
// Dönen işlev global temizliktir (sunucuyu kapatır, geçici klasörü siler).
const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");

const KOK = path.resolve(__dirname, "..");

function bosPort() {
  return new Promise((coz, red) => {
    const s = net.createServer();
    s.unref();
    s.on("error", red);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => coz(p)); });
  });
}

async function hazirBekle(url, surec, ms) {
  const bitis = Date.now() + ms;
  while (Date.now() < bitis) {
    if (surec.exitCode !== null) throw new Error("E2E sunucusu başlarken kapandı (çıkış kodu " + surec.exitCode + ").");
    try { const r = await fetch(url + "/api/health"); if (r.ok) return; } catch (e) { /* henüz hazır değil */ }
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error("E2E sunucusu " + ms + " ms içinde hazır olmadı.");
}

module.exports = async function kurulum() {
  // Bir dış süreç (ör. önceden başlatılmış sunucu) verildiyse onu kullan
  if (process.env.E2E_BASE_URL && process.env.E2E_ADMIN_EPOSTA && process.env.E2E_ADMIN_SIFRE) return async () => {};

  const port = await bosPort();
  const veri = fs.mkdtempSync(path.join(os.tmpdir(), "meberra-e2e-"));
  const eposta = "e2e-yonetici-" + crypto.randomBytes(4).toString("hex") + "@ornek.test";
  const sifre = "E2e-" + crypto.randomBytes(12).toString("base64url") + "-9";
  const base = "http://localhost:" + port;
  const env = Object.assign({}, process.env, {
    NODE_ENV: "test", PORT: String(port), HOST: "127.0.0.1", BASE_URL: base, DATA_DIR: veri,
    ZAMANLAYICI: "0", COOKIE_SECURE: "0",
    // Her test kendi X-Forwarded-For adresini gönderir: kayıt/giriş hız sınırları testler arasında paylaşılmaz
    TRUST_PROXY: "1",
    ADMIN_EPOSTA: eposta, ADMIN_SIFRE: sifre,
    // .env dosyasındaki gerçek ayarlar devreye girmesin (config.js mevcut değişkeni ezmez)
    SMTP_HOST: "", SMTP_USER: "", SMTP_PASS: "", VAPID_PUBLIC: "", VAPID_PRIVATE: "", ANDROID_PAKET_ADI: ""
  });
  const gunlukDosya = path.join(veri, "e2e-sunucu.log");
  const gunluk = fs.openSync(gunlukDosya, "w");
  const surec = spawn(process.execPath, [path.join(KOK, "server", "index.js")], { cwd: KOK, env, stdio: ["ignore", gunluk, gunluk], windowsHide: true });
  try { await hazirBekle(base, surec, 30e3); }
  catch (e) {
    try { surec.kill(); } catch (_) { /* */ }
    const kuyruk = fs.existsSync(gunlukDosya) ? fs.readFileSync(gunlukDosya, "utf8").slice(-3000) : "";
    throw new Error(e.message + "\n" + kuyruk);
  }
  process.env.E2E_BASE_URL = base;
  process.env.E2E_ADMIN_EPOSTA = eposta;
  process.env.E2E_ADMIN_SIFRE = sifre;
  process.env.E2E_SUNUCU_GUNLUK = gunlukDosya;

  return async function temizlik() {
    await new Promise(coz => {
      if (surec.exitCode !== null) return coz();
      surec.once("exit", coz);
      try { surec.kill(); } catch (_) { coz(); }
      setTimeout(coz, 5000).unref();
    });
    try { fs.closeSync(gunluk); } catch (_) { /* */ }
    try { fs.rmSync(veri, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (_) { /* Windows kilidi: geçici klasör */ }
  };
};
