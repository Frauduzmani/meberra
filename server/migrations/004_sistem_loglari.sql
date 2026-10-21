-- Sistem logları (yönetici paneli "Sistem" sekmesi). Aynı parmak izi 1 saat içinde tekrar ederse yeni satır yerine
-- adet artar ve son_zaman güncellenir. Saklama (zamanlayıcı): bilgi 7 gün, uyarı/hata 90 gün (son_zaman'a göre).
CREATE TABLE system_logs (
  id            INTEGER PRIMARY KEY,
  zaman         TEXT NOT NULL,
  son_zaman     TEXT NOT NULL,
  seviye        TEXT NOT NULL CHECK (seviye IN ('hata', 'uyari', 'bilgi')),
  kaynak        TEXT NOT NULL CHECK (kaynak IN ('sunucu', 'istemci', 'zamanlayici', 'eposta', 'push', 'guvenlik')),
  mesaj         TEXT NOT NULL,
  ayrinti       TEXT,
  parmak_izi    TEXT NOT NULL,
  adet          INTEGER NOT NULL DEFAULT 1,
  durum         TEXT NOT NULL DEFAULT 'yeni' CHECK (durum IN ('yeni', 'incelendi', 'cozuldu')),
  cozum_notu    TEXT,
  isleyen       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  islem_zamani  TEXT
);
CREATE INDEX ix_system_logs_parmak ON system_logs (parmak_izi, son_zaman);
CREATE INDEX ix_system_logs_son ON system_logs (son_zaman);
CREATE INDEX ix_system_logs_durum ON system_logs (durum, seviye);
