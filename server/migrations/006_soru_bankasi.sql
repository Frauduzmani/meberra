-- v1.5.0: Soru bankası veritabanında (cevap anahtarı ve açıklamalar artık herkese açık HTML/JS'te değil).
-- Tohum: server/tohum/soru-bankasi.json (araclar/soru-aktar.js üretir); tablo boşsa sunucu açılışta doldurur.

CREATE TABLE questions_bank (
  id                 TEXT PRIMARY KEY,                    -- kalıcı soru kimliği (ör. calc_u1_q1); answers.soru ile aynı
  tur                TEXT NOT NULL DEFAULT 'ders' CHECK (tur IN ('ders', 'seviye', 'vitrin')),
  sayfa              TEXT,                                -- ders sayfası (ap-calculus); seviye: portal sayfası; vitrin: 'vitrin'
  ders               TEXT,                                -- seviye testi ders anahtarı (calculus-ab …); ders sorusunda NULL
  unite_no           INTEGER,                             -- ders sayfasındaki ünite görünümü numarası (?unite=N)
  unite              TEXT,                                -- deneme/seviye ünite etiketi ("1", "Micro 2", "R1")
  kutu               TEXT,                                -- soru istasyonu (kutu) kimliği: calc-unit1-quiz-container
  kutu_baslik        TEXT,
  dizi               TEXT,                                -- eski kaynak dizi adı (bilgi amaçlı)
  sira               INTEGER NOT NULL DEFAULT 0,          -- kutu içi sıra
  numara             INTEGER,                             -- ekranda "Soru N"
  konu               TEXT,                                -- topic (ders) / beceri (seviye)
  zorluk             TEXT,                                -- easy | medium | hard (eski veride serbest metin olabilir)
  govde              TEXT NOT NULL,                       -- soru kökü (HTML + LaTeX)
  secenekler         TEXT NOT NULL,                       -- JSON [{id, text}]
  dogru              TEXT NOT NULL,                       -- doğru şık harfi
  aciklama           TEXT,                                -- adım adım çözüm (HTML)
  genel_hatirlatma   TEXT,                                -- konu hatırlatması (generalRemediation)
  hata_aciklamalari  TEXT NOT NULL DEFAULT '{}',          -- JSON {harf: {etiket, aciklama}} (yanlış şık başına)
  kaynak             TEXT,
  deneme_kodlari     TEXT NOT NULL DEFAULT '[]',          -- JSON ["calculus-ab", …]
  pasaj              TEXT,                                -- deneme pasaj anahtarı ("<kutu>:Passage N")
  ek                 TEXT NOT NULL DEFAULT '{}',          -- JSON (seviye: beceri, sureSn, hesapMakinesi)
  durum              TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'taslak', 'arsiv')),
  surum              INTEGER NOT NULL DEFAULT 1,
  olusturma          TEXT NOT NULL,
  guncelleme         TEXT NOT NULL,
  guncelleyen        TEXT                                 -- 'tohum' | 'aktarim' | users.id (yönetici)
);
CREATE INDEX idx_qb_sayfa ON questions_bank(tur, sayfa, kutu, sira);
CREATE INDEX idx_qb_unite ON questions_bank(sayfa, unite_no);
CREATE INDEX idx_qb_ders ON questions_bank(ders, unite);

-- Eski sürümler (her kaydetme / geri yüklemede önceki hâl)
CREATE TABLE questions_bank_history (
  id            INTEGER PRIMARY KEY,
  soru_id       TEXT NOT NULL REFERENCES questions_bank(id) ON DELETE CASCADE,
  surum         INTEGER NOT NULL,                         -- bu kaydın sakladığı (eski) sürüm numarası
  veri          TEXT NOT NULL,                            -- JSON: o sürümdeki tam satır
  fark          TEXT,                                     -- JSON: değişen alan adları (yeni sürüme göre)
  not_          TEXT,
  degistiren    TEXT,
  zaman         TEXT NOT NULL,
  UNIQUE (soru_id, surum)
);
CREATE INDEX idx_qbh_soru ON questions_bank_history(soru_id, surum);

-- Sunucunun kurduğu deneme ve seviye testi oturumları (cevaplar sunucuda puanlanır; ücretsiz deneme hakkı burada yazılır)
CREATE TABLE soru_oturumlari (
  id            TEXT PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tur           TEXT NOT NULL CHECK (tur IN ('deneme', 'seviye')),
  kod           TEXT,                                     -- deneme kodu / genel / yanlislar
  sayfa         TEXT,                                     -- ücretsiz hak sayfası (ap-calculus …)
  ucretsiz_hak  INTEGER NOT NULL DEFAULT 0,               -- 1: bu oturum sayfanın ücretsiz deneme hakkını kullandı
  ayar          TEXT,                                     -- JSON (adet, süre modu, ünite filtresi, seed …)
  sorular       TEXT NOT NULL,                            -- JSON [{k: "sayfa|id", kod}]
  olusturma     TEXT NOT NULL,
  teslim        TEXT,
  sonuc         TEXT                                      -- JSON (puanlanmış sonuç)
);
CREATE INDEX idx_so_user ON soru_oturumlari(user_id, tur, sayfa);
