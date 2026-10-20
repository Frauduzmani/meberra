"use strict";
// Meberra komut satırı aracı
//   node server/cli.js yonetici-olustur --eposta ad@ornek.com --sifre "GucluSifre123"
//   node server/cli.js yedek            (çalışan sunucuyla birlikte güvenle çalışır; son 14 yedek tutulur)
const fs = require("fs");
const path = require("path");
const config = require("./config");
const db_ = require("./db");
const { denetimKaydi } = require("./denetim");
const { epostaServisi } = require("./eposta");
const { hesapServisi } = require("./hesap");

function arg(ad) { const i = process.argv.indexOf("--" + ad); return i > 0 ? process.argv[i + 1] : undefined; }
const dosya = path.join(config.dataDir, "meberra.db");

async function main() {
  const komut = process.argv[2];
  if (komut === "yonetici-olustur") {
    const db = db_.ac(dosya);
    const hesap = hesapServisi(db, denetimKaydi(db), epostaServisi(db));
    const s = hesap.yoneticiHazirla(arg("eposta") || "", arg("sifre"));
    console.log(s.yeni ? "Yönetici oluşturuldu." : "Var olan hesap yöneticiye yükseltildi" + (arg("sifre") ? " ve şifresi güncellendi." : "."));
    db.close();
  } else if (komut === "yedek") {
    const { backup } = require("node:sqlite");
    const db = db_.ac(dosya);
    const klasor = path.join(config.dataDir, "yedekler");
    fs.mkdirSync(klasor, { recursive: true });
    const d = new Date(), p = n => String(n).padStart(2, "0");
    const hedef = path.join(klasor, `meberra-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.db`);
    if (typeof backup === "function") await backup(db, hedef);
    else db.exec("VACUUM INTO '" + hedef.replace(/'/g, "''") + "'");
    db.close();
    const eski = fs.readdirSync(klasor).filter(f => /^meberra-\d{8}-\d{4}\.db$/.test(f)).sort();
    eski.slice(0, Math.max(0, eski.length - 14)).forEach(f => fs.unlinkSync(path.join(klasor, f)));
    console.log("Yedek alındı: " + hedef);
  } else {
    console.log("Kullanım:\n  node server/cli.js yonetici-olustur --eposta ad@ornek.com --sifre \"GucluSifre123\"\n  node server/cli.js yedek");
    process.exitCode = komut ? 1 : 0;
  }
}

main().catch(e => { console.error("Hata: " + e.message); process.exit(1); });
