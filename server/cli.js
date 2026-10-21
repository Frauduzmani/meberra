"use strict";
// Meberra komut satırı aracı
//   node server/cli.js yonetici-olustur --eposta ad@ornek.com --sifre "GucluSifre123"
//   node server/cli.js yedek            (çalışan sunucuyla birlikte güvenle çalışır; son 14 yedek tutulur)
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
    const db = db_.ac(dosya);
    const s = await require("./yedek").yedekAl(db, path.join(config.dataDir, "yedekler"));
    db.close();
    console.log("Yedek alındı: " + s.yol);
  } else {
    console.log("Kullanım:\n  node server/cli.js yonetici-olustur --eposta ad@ornek.com --sifre \"GucluSifre123\"\n  node server/cli.js yedek");
    process.exitCode = komut ? 1 : 0;
  }
}

main().catch(e => { console.error("Hata: " + e.message); process.exit(1); });
