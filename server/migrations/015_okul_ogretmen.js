"use strict";
// Meberra şeması (1.19.0): okul ve öğretmen paneli.
//  - users.rol CHECK kısıtına 'ogretmen' eklenir. 008 ile aynı güvenli yol: tablo, CANLI tanımı (önceki geçişlerin eklediği
//    tüm sütunlarla) kopyalanarak yeniden kurulur; yalnızca rol kısıtı değişir. Yabancı anahtarlar bu geçişte kapalıdır
//    (db.js fkKapali), DROP TABLE alt tablolarda CASCADE silmesi yapmaz; sonunda foreign_key_check yapılır.
//  - okullar, lisanslar (koltuk + tarih), ogretmenler (davet → aktif), siniflar (katılım kodu), sinif_uyeleri, odevler.
//  - subscriptions.okul_id: okul lisansıyla verilen Premium (kaynak = 'okul'); gelir istatistiğine girmez (tutar yok).
//  Ödev durumları ayrı tabloda TUTULMAZ: mevcut etkinlik tablolarından (answers, exams, frq_denemeleri, tam_sinavlar…) hesaplanır.

function usersYenidenKur(db) {
  const t = db.prepare("SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = 'users'").get();
  if (!t) throw new Error("users tablosu yok");
  if (/'ogretmen'/.test(t.sql)) return; // zaten güncel
  const re = /CHECK\s*\(\s*rol\s+IN\s*\(([^)]*)\)\s*\)/i;
  if (!re.test(t.sql)) throw new Error("users.rol CHECK kısıtı bulunamadı");
  const yeniSql = t.sql.replace(re, (m, l) => "CHECK (rol IN (" + l.trim() + ", 'ogretmen'))")
    .replace(/^CREATE TABLE\s+"?users"?\s*\(/i, "CREATE TABLE users_015 (");
  const indeksler = db.prepare("SELECT sql FROM sqlite_schema WHERE type = 'index' AND tbl_name = 'users' AND sql IS NOT NULL").all().map(r => r.sql);
  const tetikler = db.prepare("SELECT sql FROM sqlite_schema WHERE type = 'trigger' AND tbl_name = 'users' AND sql IS NOT NULL").all().map(r => r.sql);
  const sutunlar = db.prepare("PRAGMA table_info(users)").all().map(c => '"' + c.name + '"').join(", ");
  const once = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  db.exec(yeniSql);
  db.exec("INSERT INTO users_015 (" + sutunlar + ") SELECT " + sutunlar + " FROM users");
  if (db.prepare("SELECT COUNT(*) AS n FROM users_015").get().n !== once) throw new Error("users kopyası eksik");
  db.exec("DROP TABLE users");
  db.exec("ALTER TABLE users_015 RENAME TO users");
  indeksler.concat(tetikler).forEach(s => db.exec(s));
}

module.exports = {
  fkKapali: true,
  calistir(db) {
    usersYenidenKur(db);
    db.exec(`
      CREATE TABLE okullar (
        id              INTEGER PRIMARY KEY,
        ad              TEXT NOT NULL,
        sehir           TEXT,
        iletisim_eposta TEXT COLLATE NOCASE,
        durum           TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'pasif')),
        eposta_gorunur  INTEGER NOT NULL DEFAULT 0,          -- 1: öğretmen öğrenci e-postalarını görür (yalnız yönetici açar)
        olusturma       TEXT NOT NULL,
        olusturan       INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE TABLE lisanslar (
        id          INTEGER PRIMARY KEY,
        okul_id     INTEGER NOT NULL REFERENCES okullar(id) ON DELETE CASCADE,
        koltuk      INTEGER NOT NULL CHECK (koltuk >= 0),
        baslangic   TEXT NOT NULL,
        bitis       TEXT NOT NULL,
        plan_notu   TEXT,
        tutar_tl    REAL,                                     -- okulun ödediği tutar (bilgi; öğrenci geliri sayılmaz)
        durum       TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'iptal', 'yenilendi')),
        olusturma   TEXT NOT NULL,
        olusturan   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        iptal_zamani TEXT
      );
      CREATE INDEX idx_lisans_okul ON lisanslar(okul_id, durum, bitis);
      CREATE TABLE ogretmenler (
        id            INTEGER PRIMARY KEY,
        okul_id       INTEGER NOT NULL REFERENCES okullar(id) ON DELETE CASCADE,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,     -- davet kabul edilene kadar NULL
        eposta        TEXT COLLATE NOCASE,
        belirtec_hash TEXT UNIQUE,                                         -- davet belirtecinin SHA-256 özeti (kabulde NULL)
        davet_bitis   TEXT,
        durum         TEXT NOT NULL DEFAULT 'davet' CHECK (durum IN ('davet', 'aktif', 'iptal')),
        olusturma     TEXT NOT NULL,
        kabul         TEXT,
        iptal_zamani  TEXT
      );
      CREATE INDEX idx_ogretmen_okul ON ogretmenler(okul_id, durum);
      CREATE UNIQUE INDEX idx_ogretmen_aktif ON ogretmenler(user_id) WHERE durum = 'aktif';
      CREATE TABLE siniflar (
        id          INTEGER PRIMARY KEY,
        okul_id     INTEGER NOT NULL REFERENCES okullar(id) ON DELETE CASCADE,
        ogretmen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ad          TEXT NOT NULL,
        ders        TEXT NOT NULL,                                         -- ap-hedef ders anahtarı ya da 'karisik'
        kod         TEXT NOT NULL UNIQUE,                                  -- 6 karakter katılım kodu
        durum       TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'arsiv')),
        olusturma   TEXT NOT NULL
      );
      CREATE INDEX idx_sinif_ogretmen ON siniflar(ogretmen_id, durum);
      CREATE TABLE sinif_uyeleri (
        id          INTEGER PRIMARY KEY,
        sinif_id    INTEGER NOT NULL REFERENCES siniflar(id) ON DELETE CASCADE,
        ogrenci_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        katilma     TEXT NOT NULL,
        durum       TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'ayrildi', 'cikarildi')),
        ayrilma     TEXT
      );
      CREATE INDEX idx_uye_sinif ON sinif_uyeleri(sinif_id, durum);
      CREATE INDEX idx_uye_ogrenci ON sinif_uyeleri(ogrenci_id, durum);
      CREATE UNIQUE INDEX idx_uye_aktif ON sinif_uyeleri(sinif_id, ogrenci_id) WHERE durum = 'aktif';
      CREATE TABLE odevler (
        id          INTEGER PRIMARY KEY,
        sinif_id    INTEGER NOT NULL REFERENCES siniflar(id) ON DELETE CASCADE,
        baslik      TEXT NOT NULL,
        tur         TEXT NOT NULL CHECK (tur IN ('unite', 'deneme', 'frq', 'tam_sinav', 'kart')),
        hedef       TEXT NOT NULL DEFAULT '{}',                            -- JSON: { sayfa, kutu, kod, ders, adet }
        son_tarih   TEXT,
        durum       TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'iptal')),
        olusturma   TEXT NOT NULL,
        olusturan   INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX idx_odev_sinif ON odevler(sinif_id, durum);
      ALTER TABLE subscriptions ADD COLUMN okul_id INTEGER REFERENCES okullar(id) ON DELETE SET NULL;
      CREATE INDEX idx_subs_okul ON subscriptions(okul_id, durum, bitis);
    `);
  }
};
