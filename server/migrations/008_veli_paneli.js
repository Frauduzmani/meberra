"use strict";
// Meberra şeması v8 (1.7.0): veli paneli.
//  - users.rol CHECK kısıtına 'veli' eklenir. SQLite CHECK değiştiremez: tablo, MEVCUT tanımı (önceki geçişlerin eklediği
//    tüm sütunlarla) kopyalanarak yeniden kurulur; yalnızca rol kısıtı değişir. Yabancı anahtarlar bu geçişte kapalıdır
//    (db.js fkKapali), böylece DROP TABLE alt tablolarda CASCADE silmesi yapmaz; sonunda foreign_key_check yapılır.
//  - veli_baglantilari: öğrenci → veli daveti ve bağlantısı (davet | aktif | iptal). Davet belirtecinin yalnızca özeti saklanır.
//  - upgrade_requests.veli_id: ödeme bildirimini veli kendi hesabından çocuğu için verdiyse veli.

function usersYenidenKur(db) {
  const t = db.prepare("SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = 'users'").get();
  if (!t) throw new Error("users tablosu yok");
  if (/'veli'/.test(t.sql)) return; // zaten güncel
  const re = /CHECK\s*\(\s*rol\s+IN\s*\(([^)]*)\)\s*\)/i;
  if (!re.test(t.sql)) throw new Error("users.rol CHECK kısıtı bulunamadı");
  const yeniSql = t.sql.replace(re, (m, l) => "CHECK (rol IN (" + l.trim() + ", 'veli'))")
    .replace(/^CREATE TABLE\s+"?users"?\s*\(/i, "CREATE TABLE users_008 (");
  const indeksler = db.prepare("SELECT sql FROM sqlite_schema WHERE type = 'index' AND tbl_name = 'users' AND sql IS NOT NULL").all().map(r => r.sql);
  const tetikler = db.prepare("SELECT sql FROM sqlite_schema WHERE type = 'trigger' AND tbl_name = 'users' AND sql IS NOT NULL").all().map(r => r.sql);
  const sutunlar = db.prepare("PRAGMA table_info(users)").all().map(c => '"' + c.name + '"').join(", ");
  db.exec(yeniSql);
  db.exec("INSERT INTO users_008 (" + sutunlar + ") SELECT " + sutunlar + " FROM users");
  db.exec("DROP TABLE users");
  db.exec("ALTER TABLE users_008 RENAME TO users");
  indeksler.concat(tetikler).forEach(s => db.exec(s));
}

module.exports = {
  fkKapali: true,
  calistir(db) {
    usersYenidenKur(db);
    db.exec(`
      CREATE TABLE veli_baglantilari (
        id            INTEGER PRIMARY KEY,
        ogrenci_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        veli_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,   -- davet kabul edilene kadar NULL
        eposta        TEXT COLLATE NOCASE,                              -- davet edilen adres (iptal/silmede NULL)
        belirtec_hash TEXT UNIQUE,                                      -- davet bağlantısı belirtecinin SHA-256 özeti (kabulde NULL)
        durum         TEXT NOT NULL DEFAULT 'davet' CHECK (durum IN ('davet', 'aktif', 'iptal')),
        rapor         INTEGER NOT NULL DEFAULT 1,                       -- haftalık e-posta raporu (veli kapatabilir)
        rapor_belirtec TEXT UNIQUE,                                     -- e-postadaki tek tıkla rapor iptali (gizli)
        olusturma     TEXT NOT NULL,
        davet_bitis   TEXT,                                             -- davet bağlantısının son geçerlilik zamanı
        kabul         TEXT,
        iptal_zamani  TEXT,
        iptal_eden    INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX idx_veli_ogrenci ON veli_baglantilari(ogrenci_id, durum);
      CREATE INDEX idx_veli_veli ON veli_baglantilari(veli_id, durum);
      CREATE UNIQUE INDEX idx_veli_aktif_tekil ON veli_baglantilari(veli_id, ogrenci_id) WHERE durum = 'aktif';
      ALTER TABLE upgrade_requests ADD COLUMN veli_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    `);
  }
};
