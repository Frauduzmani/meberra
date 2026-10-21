"use strict";
// Veritabanı yedeği (CLI "npm run yedek" ve yönetici paneli "Yedek al" aynı işlevi kullanır). Çalışan sunucuyla güvenlidir
// (node:sqlite backup API'si ya da VACUUM INTO). DATA_DIR/yedekler içinde en yeni 14 yedek tutulur.
const fs = require("fs");
const path = require("path");

const SAKLA = 14;
const AD_RE = /^meberra-\d{8}-\d{4}(\d{2})?\.db$/;

/** db: açık DatabaseSync; klasor: hedef klasör; sec.saniyeli: aynı dakikada ikinci yedek üzerine yazılmasın */
async function yedekAl(db, klasor, sec) {
  sec = sec || {};
  fs.mkdirSync(klasor, { recursive: true });
  const d = new Date(), p = n => String(n).padStart(2, "0");
  const ad = `meberra-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${sec.saniyeli ? p(d.getSeconds()) : ""}.db`;
  const hedef = path.join(klasor, ad);
  try { fs.unlinkSync(hedef); } catch (e) { /* yok */ }
  const bas = Date.now();
  const { backup } = require("node:sqlite");
  if (typeof backup === "function") await backup(db, hedef);
  else db.exec("VACUUM INTO '" + hedef.replace(/'/g, "''") + "'");
  const eski = fs.readdirSync(klasor).filter(f => AD_RE.test(f)).sort((a, b) => fs.statSync(path.join(klasor, a)).mtimeMs - fs.statSync(path.join(klasor, b)).mtimeMs);
  const silinen = eski.slice(0, Math.max(0, eski.length - SAKLA));
  silinen.forEach(f => { try { fs.unlinkSync(path.join(klasor, f)); } catch (e) { /* yok say */ } });
  return { dosya: ad, yol: hedef, boyut: fs.statSync(hedef).size, sureMs: Date.now() - bas, silinen: silinen.length };
}

module.exports = { yedekAl, SAKLA };
