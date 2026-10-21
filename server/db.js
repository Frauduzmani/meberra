"use strict";
// SQLite bağlantısı (Node yerleşik node:sqlite), şema geçişleri ve küçük yardımcılar.
const fs = require("fs");
const path = require("path");

// node:sqlite ilk yüklemede "ExperimentalWarning" basabilir; yalnızca bu uyarıyı sustur
const yay = process.emitWarning;
process.emitWarning = function (w, ...a) {
  const t = typeof w === "string" ? w : w && w.message;
  if (/SQLite is an experimental feature/i.test(String(t || ""))) return;
  return yay.call(process, w, ...a);
};
const { DatabaseSync } = require("node:sqlite");

function simdi() { return new Date().toISOString(); }

function ac(dosya) {
  if (dosya !== ":memory:") fs.mkdirSync(path.dirname(dosya), { recursive: true });
  const db = new DatabaseSync(dosya);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;");
  gecis(db);
  return db;
}

// migrations/NNN_*.sql (ya da NNN_*.js) dosyalarını sırayla, bir kez uygular.
// .js geçişi: module.exports = { calistir(db), fkKapali?: true }. fkKapali: tablo yeniden kurulurken (ör. CHECK kısıtı
// değişimi) yabancı anahtarlar işlem DIŞINDA kapatılır (SQLite'ın önerdiği yol; DROP TABLE'ın örtük DELETE'i CASCADE
// tetiklemesin); işlem sonunda foreign_key_check temiz olmalı, sonra yeniden açılır.
function gecis(db) {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (surum TEXT PRIMARY KEY, uygulama TEXT NOT NULL)");
  const yapilan = new Set(db.prepare("SELECT surum FROM schema_migrations").all().map(r => r.surum));
  const klasor = path.join(__dirname, "migrations");
  const dosyalar = fs.readdirSync(klasor).filter(f => /^\d+_.*\.(sql|js)$/.test(f)).sort();
  for (const f of dosyalar) {
    if (yapilan.has(f)) continue;
    const js = /\.js$/.test(f) ? require(path.join(klasor, f)) : null;
    const fkKapali = !!(js && js.fkKapali);
    if (fkKapali) db.exec("PRAGMA foreign_keys = OFF");
    db.exec("BEGIN");
    try {
      if (js) js.calistir(db); else db.exec(fs.readFileSync(path.join(klasor, f), "utf8"));
      if (fkKapali && db.prepare("PRAGMA foreign_key_check").all().length) throw new Error("yabancı anahtar denetimi başarısız");
      db.prepare("INSERT INTO schema_migrations (surum, uygulama) VALUES (?, ?)").run(f, simdi());
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw new Error("Şema geçişi başarısız: " + f + " — " + e.message);
    } finally {
      if (fkKapali) db.exec("PRAGMA foreign_keys = ON");
    }
  }
}

/** fn'i tek işlemde (transaction) çalıştırır; hata olursa geri alır. İç içe çağrıda dıştaki işlem kullanılır. */
function islem(db, fn) {
  if (db.__islemde) return fn();
  db.exec("BEGIN IMMEDIATE");
  db.__islemde = true;
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    try { db.exec("ROLLBACK"); } catch (_) { /* zaten geri alındı */ }
    throw e;
  } finally {
    db.__islemde = false;
  }
}

module.exports = { ac, islem, simdi };
