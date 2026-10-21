-- Meberra şeması v3: Soru-cevap (öğrenci ↔ Meberra ekibi), SSS, bildirimler, bildirim ayarları,
-- web push abonelikleri, hatırlatma kaydı (günde en fazla 1) ve haftalık lig.

-- Öğrenci soruları (konu başlığı). baglam: soru metni/şıklar/öğrencinin cevabı gibi JSON.
CREATE TABLE questions (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sayfa         TEXT,                              -- ör. ap-calculus
  soru_ref      TEXT,                              -- ör. calc-unit1-quiz-container|q3
  baglam        TEXT,                              -- JSON (en fazla 8000 karakter)
  metin         TEXT NOT NULL,                     -- ilk mesaj (en fazla 2000 karakter)
  durum         TEXT NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'cevaplandi', 'kapandi')),
  olusturma     TEXT NOT NULL,
  guncelleme    TEXT NOT NULL
);
CREATE INDEX idx_questions_user ON questions(user_id, olusturma);
CREATE INDEX idx_questions_durum ON questions(durum, guncelleme);

-- Soru yazışması (ilk mesaj dahil her mesaj bir satır)
CREATE TABLE question_messages (
  id            INTEGER PRIMARY KEY,
  question_id   INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  yazan_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('ogrenci', 'yonetici')),
  metin         TEXT NOT NULL,
  tarih         TEXT NOT NULL,
  okundu        TEXT                               -- yönetici yanıtını öğrencinin gördüğü zaman
);
CREATE INDEX idx_qmsg_soru ON question_messages(question_id, id);

-- Sık sorulan sorular (yönetici yayınlar; herkese açık)
CREATE TABLE faq (
  id             INTEGER PRIMARY KEY,
  soru           TEXT NOT NULL,
  cevap          TEXT NOT NULL,
  sayfa          TEXT,                             -- NULL: genel
  kaynak_soru_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  durum          TEXT NOT NULL DEFAULT 'yayinda' CHECK (durum IN ('yayinda', 'gizli')),
  sira           INTEGER NOT NULL DEFAULT 0,
  olusturan      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  olusturma      TEXT NOT NULL,
  guncelleme     TEXT NOT NULL
);
CREATE INDEX idx_faq_sayfa ON faq(durum, sayfa, sira);

-- Uygulama içi bildirimler
CREATE TABLE notifications (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tur           TEXT NOT NULL CHECK (tur IN ('soru-yanit', 'seri', 'premium', 'duyuru', 'rozet', 'lig', 'tekrar')),
  baslik        TEXT NOT NULL,
  metin         TEXT,
  link          TEXT,                              -- yalnızca site içi göreli yol (/...)
  okundu        TEXT,
  olusturma     TEXT NOT NULL
);
CREATE INDEX idx_notif_user ON notifications(user_id, id);
CREATE INDEX idx_notif_okunmamis ON notifications(user_id, okundu);

-- Bildirim tercihleri (hepsi açık rıza ile; varsayılan kapalı)
CREATE TABLE notification_prefs (
  user_id            INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  eposta_hatirlatma  INTEGER NOT NULL DEFAULT 0,   -- günlük çalışma hatırlatması e-postası
  push               INTEGER NOT NULL DEFAULT 0,   -- tarayıcı bildirimleri
  eposta_bildirim    INTEGER NOT NULL DEFAULT 0,   -- sorum yanıtlanınca e-posta
  hatirlatma_saati   INTEGER NOT NULL DEFAULT 19 CHECK (hatirlatma_saati BETWEEN 8 AND 21),
  veli_raporu        INTEGER NOT NULL DEFAULT 0,
  veli_eposta        TEXT,
  veli_dogrulandi    TEXT,                         -- velinin e-postadaki onay bağlantısına tıkladığı zaman
  veli_belirtec      TEXT,                         -- veli onay/iptal bağlantısı (gizli)
  iptal_belirtec     TEXT NOT NULL,                -- tek tıkla e-posta aboneliği iptal bağlantısı (gizli)
  guncelleme         TEXT NOT NULL
);

-- Web push abonelikleri (tarayıcı başına bir satır)
CREATE TABLE push_subscriptions (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  tarayici      TEXT,
  olusturma     TEXT NOT NULL,
  son_basari    TEXT
);
CREATE INDEX idx_push_user ON push_subscriptions(user_id);

-- Gönderilen hatırlatma/rapor kaydı: (kullanıcı, tür, İstanbul günü) başına tek satır → günde en fazla 1
CREATE TABLE reminder_log (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tur           TEXT NOT NULL,                     -- hatirlatma | veli-raporu
  gun           TEXT NOT NULL,                     -- YYYY-MM-DD (Europe/Istanbul)
  zaman         TEXT NOT NULL,
  ayrinti       TEXT,
  PRIMARY KEY (user_id, tur, gun)
);

-- Haftalık lig üyeleri (isteğe bağlı katılım; yalnızca takma ad görünür)
CREATE TABLE lig_uyeleri (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  takma_ad      TEXT NOT NULL,
  takma_anahtar TEXT NOT NULL UNIQUE,              -- tr-TR küçük harf: benzersizlik denetimi
  kademe        INTEGER NOT NULL DEFAULT 1 CHECK (kademe BETWEEN 1 AND 5),
  durum         TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'ayrildi', 'gizli')),
  katilma       TEXT NOT NULL,
  guncelleme    TEXT NOT NULL
);

-- Haftalık grup yerleşimi ve sonuç
CREATE TABLE lig_haftalik (
  hafta         TEXT NOT NULL,                     -- YYYY-Www (ISO hafta, Europe/Istanbul)
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kademe        INTEGER NOT NULL,
  grup          INTEGER NOT NULL,
  xp            INTEGER NOT NULL DEFAULT 0,        -- hafta kapanınca kesinleşir
  sonuc         TEXT CHECK (sonuc IN ('yukseldi', 'dustu', 'kaldi')),
  PRIMARY KEY (hafta, user_id)
);
CREATE INDEX idx_lig_grup ON lig_haftalik(hafta, kademe, grup);

-- Kapanmış haftalar (devir bir kez yapılır)
CREATE TABLE lig_haftalar (
  hafta         TEXT PRIMARY KEY,
  kapanis       TEXT NOT NULL
);
