-- Meberra şeması v7 (1.6.0): dönüşüm hunisi ölçümü (birinci taraf), 7 günlük Premium denemesi, indirim kodları, davet programı.
-- Gizlilik: olaylarda IP, tarayıcı parmak izi, e-posta tutulmaz; anon_id tarayıcıda üretilen rastgele kimliktir (çerez + localStorage).
-- E-posta karmaları HMAC-SHA256 (sunucu tuzu) ile tutulur; hesap silinse de deneme/davet kötüye kullanımını engellemek için kalır.

-- Ölçüm olayları (400 gün saklanır; daha eskisi olay_ozet'e toplanıp silinir)
CREATE TABLE olaylar (
  id            INTEGER PRIMARY KEY,
  zaman         TEXT NOT NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  anon_id       TEXT,
  olay          TEXT NOT NULL,
  sayfa         TEXT,
  ozellikler    TEXT,                              -- küçük JSON (en çok 10 alan, 500 karakter)
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT
);
CREATE INDEX idx_olay_zaman ON olaylar(zaman, olay);
CREATE INDEX idx_olay_user ON olaylar(user_id, olay);
CREATE INDEX idx_olay_anon ON olaylar(anon_id);

-- 400 günden eski olayların günlük toplamı
CREATE TABLE olay_ozet (
  gun           TEXT NOT NULL,
  olay          TEXT NOT NULL,
  utm_source    TEXT NOT NULL DEFAULT '',
  adet          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (gun, olay, utm_source)
);

-- Kullanıcı başına büyüme ayarları: davet kodu, ölçüm tercihi
CREATE TABLE buyume_kullanici (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  davet_kodu    TEXT NOT NULL UNIQUE,
  olcum_kapali  INTEGER NOT NULL DEFAULT 0,
  guncelleme    TEXT NOT NULL
);

-- 7 günlük ücretsiz Premium denemesi: e-posta karması başına bir kez (hesap silinse de kalır)
CREATE TABLE premium_denemeleri (
  eposta_hash   TEXT PRIMARY KEY,
  user_id       INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  abonelik_id   INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  baslangic     TEXT NOT NULL,
  bitis         TEXT NOT NULL,
  hatirlatma    TEXT,                              -- "2 gün kaldı" gönderimi
  bitti_bildirim TEXT                              -- bitiş bildirimi
);

-- İndirim kodları
CREATE TABLE kuponlar (
  id            INTEGER PRIMARY KEY,
  kod           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  tur           TEXT NOT NULL CHECK (tur IN ('yuzde', 'tutar')),
  deger         REAL NOT NULL CHECK (deger > 0),
  plan          TEXT NOT NULL DEFAULT 'hepsi' CHECK (plan IN ('aylik', 'yillik', 'hepsi')),
  baslangic     TEXT,
  bitis         TEXT,
  max_kullanim  INTEGER,                           -- NULL: sınırsız
  kisi_basi     INTEGER NOT NULL DEFAULT 1,
  aktif         INTEGER NOT NULL DEFAULT 1,
  aciklama      TEXT,
  olusturan     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  olusturma     TEXT NOT NULL,
  guncelleme    TEXT NOT NULL
);

CREATE TABLE kupon_kullanimlari (
  id            INTEGER PRIMARY KEY,
  kupon_id      INTEGER NOT NULL REFERENCES kuponlar(id),
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  talep_id      INTEGER UNIQUE REFERENCES upgrade_requests(id),
  plan          TEXT NOT NULL,
  liste_tutar   REAL NOT NULL,
  indirim       REAL NOT NULL,
  tutar         REAL NOT NULL,
  zaman         TEXT NOT NULL
);
CREATE INDEX idx_kk_kupon ON kupon_kullanimlari(kupon_id);

-- Ödeme bildirimi: uygulanan kod ve indirimsiz liste fiyatı (tutar_tl indirimli tutardır)
ALTER TABLE upgrade_requests ADD COLUMN kupon_id INTEGER REFERENCES kuponlar(id);
ALTER TABLE upgrade_requests ADD COLUMN liste_tutar_tl REAL;

-- Davet programı
CREATE TABLE davetler (
  id            INTEGER PRIMARY KEY,
  davet_eden    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  davet_edilen  INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  kod           TEXT NOT NULL,
  eposta_hash   TEXT NOT NULL,                     -- davet edilenin e-posta karması (tekrar kayıt tespiti)
  durum         TEXT NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'odullendi', 'reddedildi')),
  neden         TEXT,                              -- reddedildi: kendi-kodu | ayni-ip | tekrar-eposta
  eden_odul     INTEGER NOT NULL DEFAULT 0,        -- davet edene 7 gün verildi mi (yıllık sınır)
  olusturma     TEXT NOT NULL,
  odul_zamani   TEXT
);
CREATE INDEX idx_davet_eden ON davetler(davet_eden, durum);
CREATE INDEX idx_davet_hash ON davetler(eposta_hash);
