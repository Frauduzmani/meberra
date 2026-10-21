-- v1.11.0: FRQ (free-response) pratiği. Tohum: server/tohum/frq.json (sunucu açılışta eşitler; server/frq.js).
-- Puanlama ölçütleri (rubrik) ve örnek çözümler yalnızca öğrenci cevabını TESLİM ettikten sonra gönderilir.

CREATE TABLE frq (
  id             TEXT PRIMARY KEY,                       -- kalıcı kimlik (ör. frq-calc-ab-1)
  sayfa          TEXT NOT NULL,                          -- ders sayfası (ap-calculus …)
  ders           TEXT NOT NULL,                          -- ders anahtarı (calculus-ab …); ücretsiz hak bu anahtara göre sayılır
  baslik         TEXT NOT NULL,
  toplam_puan    INTEGER NOT NULL,
  veri           TEXT NOT NULL,                          -- JSON: tam FRQ (giriş, parçalar, rubrik, örnek çözüm, sık hatalar)
  durum          TEXT NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak', 'aktif', 'arsiv')),
  surum          INTEGER NOT NULL DEFAULT 1,
  elle           INTEGER NOT NULL DEFAULT 0,             -- 1: içerik yönetici panelinde düzenlendi (tohum güncellemesi dokunmaz)
  olusturma      TEXT NOT NULL,
  guncelleme     TEXT NOT NULL,
  guncelleyen    TEXT                                    -- 'tohum' | users.id (yönetici)
);
CREATE INDEX idx_frq_ders ON frq(durum, sayfa, ders);

-- Eski sürümler (her içerik/durum değişikliğinde önceki hâl)
CREATE TABLE frq_gecmis (
  id            INTEGER PRIMARY KEY,
  frq_id        TEXT NOT NULL REFERENCES frq(id) ON DELETE CASCADE,
  surum         INTEGER NOT NULL,                        -- bu kaydın sakladığı (eski) sürüm
  veri          TEXT NOT NULL,                           -- JSON: o sürümdeki tam FRQ
  durum         TEXT NOT NULL,
  not_          TEXT,
  degistiren    TEXT,
  zaman         TEXT NOT NULL,
  UNIQUE (frq_id, surum)
);

-- Öğrenci denemeleri: teslimde cevaplar, öz puanlamada ölçüt başına puanlar
CREATE TABLE frq_denemeleri (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  frq_id        TEXT NOT NULL,
  ders          TEXT NOT NULL,
  frq_surum     INTEGER NOT NULL,
  cevaplar      TEXT NOT NULL,                           -- JSON {harf: metin}
  puanlar       TEXT,                                    -- JSON {harf: [ölçüt başına puan]} (öz puanlama sonrası)
  toplam        INTEGER,                                 -- öz puan toplamı (puanlanana kadar NULL)
  toplam_puan   INTEGER NOT NULL,
  sure_sn       INTEGER,
  ucretsiz_hak  INTEGER NOT NULL DEFAULT 0,              -- 1: ücretsiz plandaki ders hakkı bu denemeyle kullanıldı
  created       TEXT NOT NULL,
  puanlama      TEXT                                     -- son öz puanlama zamanı
);
CREATE INDEX idx_frqd_user ON frq_denemeleri(user_id, ders, frq_id);
