-- Meberra veritabanı şeması v1 (SQLite). Zamanlar ISO-8601 UTC metin olarak tutulur.

-- Kullanıcılar
CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  public_id     TEXT NOT NULL UNIQUE,              -- istemciye gösterilen kimlik (u + 16 hex)
  eposta        TEXT UNIQUE COLLATE NOCASE,
  kullanici_adi TEXT NOT NULL UNIQUE COLLATE NOCASE,
  ad            TEXT NOT NULL,
  soyad         TEXT NOT NULL,
  sifre_hash    TEXT NOT NULL,                     -- scrypt$N$r$p$salt$hash
  rol           TEXT NOT NULL DEFAULT 'ogrenci' CHECK (rol IN ('ogrenci', 'yonetici')),
  durum         TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'askida', 'silindi')),
  kvkk_onay     TEXT,                              -- onay zamanı
  kosul_onay    TEXT,
  veli_onay     INTEGER NOT NULL DEFAULT 0,
  olusturma     TEXT NOT NULL,
  guncelleme    TEXT NOT NULL,
  son_giris     TEXT
);

-- Profil (öğrenci modeli, sınıf, hedef ülkeler ...). Sık sorgulanan alanlar ayrı sütun, tamamı JSON.
CREATE TABLE profiles (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ogrenci_modeli TEXT,
  sinif         TEXT,
  ulkeler       TEXT,                              -- virgülle ayrılmış ülke kodları
  okul          TEXT,
  tamamlandi    INTEGER NOT NULL DEFAULT 0,
  veri          TEXT NOT NULL,                     -- profilin tamamı (JSON)
  guncelleme    TEXT NOT NULL
);

-- Oturumlar (çerezdeki rastgele belirtecin SHA-256 özeti saklanır)
CREATE TABLE sessions (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  olusturma     TEXT NOT NULL,
  son_kullanim  TEXT NOT NULL,
  bitis         TEXT NOT NULL,
  ip            TEXT,
  tarayici      TEXT,
  iptal         TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Şifre sıfırlama belirteçleri
CREATE TABLE password_resets (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  olusturma     TEXT NOT NULL,
  bitis         TEXT NOT NULL,
  kullanildi    TEXT,
  ip            TEXT
);

-- Tarayıcı deposu anahtarlarının ham kopyası (istemci senkronu; apmeberra:* anahtarları)
CREATE TABLE user_state (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anahtar       TEXT NOT NULL,
  deger         TEXT NOT NULL,
  guncelleme    TEXT NOT NULL,
  PRIMARY KEY (user_id, anahtar)
);

-- Her cevap olayı (geçmiş): aynı soru tekrar çözülünce yeni satır
CREATE TABLE answers (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sayfa         TEXT NOT NULL,                     -- ör. ap-calculus
  unite         TEXT NOT NULL,                     -- soru kutusu kimliği (ör. calc-unit1-quiz-container)
  unite_baslik  TEXT,
  soru          TEXT NOT NULL,
  secim         TEXT,
  dogru         INTEGER NOT NULL,
  zaman         TEXT NOT NULL,
  UNIQUE (user_id, sayfa, soru, zaman)
);
CREATE INDEX idx_answers_user ON answers(user_id, zaman);
CREATE INDEX idx_answers_zaman ON answers(zaman);

-- Hata defteri (Yanlışlarım): soru başına tek satır
CREATE TABLE wrong_answers (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sayfa         TEXT NOT NULL,
  soru          TEXT NOT NULL,
  unite         TEXT,
  konu          TEXT,
  hata_etiketi  TEXT,
  secilen       TEXT,
  dogru_cevap   TEXT,
  ilk_yanlis    TEXT,
  son_yanlis    TEXT,
  yanlis_sayisi INTEGER NOT NULL DEFAULT 1,
  cozuldu       TEXT,                              -- düzeltilme zamanı (NULL: açık)
  UNIQUE (user_id, sayfa, soru)
);
CREATE INDEX idx_wrong_user ON wrong_answers(user_id, cozuldu);

-- Denemeler (tamamlanan)
CREATE TABLE exams (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  istemci_id    TEXT NOT NULL,
  kod           TEXT,
  ad            TEXT,
  tarih         TEXT,
  soru_sayisi   INTEGER,
  dogru         INTEGER,
  yanlis        INTEGER,
  bos           INTEGER,
  yuzde         REAL,
  sure_sn       INTEGER,
  tahmini_band  TEXT,
  veri          TEXT,
  UNIQUE (user_id, istemci_id)
);
CREATE INDEX idx_exams_user ON exams(user_id, tarih);

-- Seviye testi raporları
CREATE TABLE level_tests (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tarih         TEXT NOT NULL,
  veri          TEXT NOT NULL,
  UNIQUE (user_id, tarih)
);

-- Abonelikler (Premium dönemleri)
CREATE TABLE subscriptions (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL CHECK (plan IN ('aylik', 'yillik', 'ozel')),
  baslangic     TEXT NOT NULL,
  bitis         TEXT NOT NULL,
  durum         TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'iptal')),
  kaynak        TEXT NOT NULL DEFAULT 'elle',      -- elle | talep
  tutar_tl      REAL,
  talep_id      INTEGER REFERENCES upgrade_requests(id),
  not_          TEXT,
  olusturan     INTEGER REFERENCES users(id),
  olusturma     TEXT NOT NULL,
  iptal_zamani  TEXT
);
CREATE INDEX idx_subs_user ON subscriptions(user_id, bitis);

-- Premium ödeme bildirimleri (havale/EFT)
CREATE TABLE upgrade_requests (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL CHECK (plan IN ('aylik', 'yillik')),
  tutar_tl      REAL NOT NULL,
  odeyen_ad     TEXT NOT NULL,
  aciklama      TEXT,
  durum         TEXT NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'onaylandi', 'reddedildi', 'iptal')),
  olusturma     TEXT NOT NULL,
  isleyen       INTEGER REFERENCES users(id),
  islem_zamani  TEXT,
  islem_notu    TEXT
);
CREATE INDEX idx_req_durum ON upgrade_requests(durum, olusturma);

-- Denetim kaydı (audit log): kim, ne zaman, ne yaptı
CREATE TABLE audit_log (
  id            INTEGER PRIMARY KEY,
  zaman         TEXT NOT NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,   -- etkilenen kullanıcı
  yapan_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,   -- işlemi yapan (yönetici ya da kendisi)
  eylem         TEXT NOT NULL,                                     -- ör. auth.login, profil.guncelle, premium.ver
  varlik        TEXT,
  varlik_id     TEXT,
  ip            TEXT,
  tarayici      TEXT,
  ayrinti       TEXT                                               -- JSON
);
CREATE INDEX idx_audit_zaman ON audit_log(zaman);
CREATE INDEX idx_audit_user ON audit_log(user_id, zaman);
CREATE INDEX idx_audit_eylem ON audit_log(eylem, zaman);

-- Giden e-postalar (SMTP yoksa yalnızca burada kalır)
CREATE TABLE email_outbox (
  id            INTEGER PRIMARY KEY,
  alici         TEXT NOT NULL,
  konu          TEXT NOT NULL,
  metin         TEXT NOT NULL,
  html          TEXT,
  olusturma     TEXT NOT NULL,
  gonderim      TEXT,
  hata          TEXT
);
