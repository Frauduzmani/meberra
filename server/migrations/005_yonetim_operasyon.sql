-- Meberra şeması v5: kullanıcı varlığı (son görülme / IP), günlük giriş sayıları, engelleme, IP engel listesi,
-- destek merkezi (iç not, atanan yönetici, hazır yanıtlar), ayarlar (bakım modu) ve oturum son görülme.
-- KVKK: IP adresleri kişisel veridir; zamanlayıcı 90 günden eski son_ip / son_giris_ip / sessions.ip değerlerini siler.

ALTER TABLE users ADD COLUMN son_gorulme TEXT;          -- son kimlik doğrulanmış istek (en fazla 60 sn'de bir yazılır)
ALTER TABLE users ADD COLUMN son_ip TEXT;               -- son görülmedeki IP (TRUST_PROXY kuralına göre)
ALTER TABLE users ADD COLUMN son_giris_ip TEXT;         -- son başarılı girişin IP'si
ALTER TABLE users ADD COLUMN engel_zamani TEXT;         -- yönetici engeli (durum = 'askida' ile birlikte); NULL: eski tip askı
ALTER TABLE users ADD COLUMN engel_bitis TEXT;          -- NULL: süresiz
ALTER TABLE users ADD COLUMN engel_nedeni TEXT;
ALTER TABLE users ADD COLUMN engelleyen INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_users_son_gorulme ON users(son_gorulme);

ALTER TABLE sessions ADD COLUMN son_gorulme TEXT;
ALTER TABLE sessions ADD COLUMN son_ip TEXT;

-- Günlük giriş sayıları (Europe/Istanbul günü)
CREATE TABLE giris_sayilari (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gun           TEXT NOT NULL,                     -- YYYY-MM-DD (Europe/Istanbul)
  adet          INTEGER NOT NULL DEFAULT 0,        -- başarılı giriş
  basarisiz     INTEGER NOT NULL DEFAULT 0,        -- hatalı şifre (hesap bulunduysa)
  PRIMARY KEY (user_id, gun)
);
CREATE INDEX idx_giris_gun ON giris_sayilari(gun);

-- IP engel listesi: tek adres ya da IPv4 /24 (ör. 203.0.113.0/24)
CREATE TABLE ip_engelleri (
  id            INTEGER PRIMARY KEY,
  kapsam        TEXT NOT NULL UNIQUE,
  neden         TEXT,
  bitis         TEXT,                              -- NULL: süresiz
  olusturan     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  olusturma     TEXT NOT NULL
);

-- Destek merkezi
ALTER TABLE questions ADD COLUMN atanan_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN yonetici_okundu TEXT;  -- yöneticinin konuşmayı son açtığı zaman (okunmamış hesabı)

CREATE TABLE soru_notlari (                         -- iç notlar: yalnızca yöneticiler görür
  id            INTEGER PRIMARY KEY,
  question_id   INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  yazan_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  metin         TEXT NOT NULL,
  tarih         TEXT NOT NULL
);
CREATE INDEX idx_soru_not ON soru_notlari(question_id, id);

CREATE TABLE hazir_yanitlar (
  id            INTEGER PRIMARY KEY,
  baslik        TEXT NOT NULL,
  metin         TEXT NOT NULL,
  olusturan     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  olusturma     TEXT NOT NULL,
  guncelleme    TEXT NOT NULL
);

-- Anahtar/değer ayarları (ör. bakim → JSON)
CREATE TABLE ayarlar (
  anahtar       TEXT PRIMARY KEY,
  deger         TEXT,
  guncelleme    TEXT NOT NULL,
  guncelleyen   INTEGER REFERENCES users(id) ON DELETE SET NULL
);
