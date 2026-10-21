-- v1.18.0: Kavram kartları — öğrencinin kart başına aralıklı tekrar durumu (server/kart.js).
-- Kart içeriği veritabanında DEĞİL (server/tohum/kartlar.json); burada yalnızca durum tutulur. Hesap silinince CASCADE.
CREATE TABLE kart_durumu (
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kart_id        TEXT NOT NULL,                             -- kartlar.json id (ör. calc-u1-01)
  aralik         INTEGER NOT NULL,                          -- gün (1, 3, 7, 14, 30 ya da zor × 1,2)
  sonraki        TEXT NOT NULL,                             -- YYYY-MM-DD (Europe/Istanbul): bu günden itibaren vadeli
  tekrar_sayisi  INTEGER NOT NULL DEFAULT 0,
  son_sonuc      TEXT NOT NULL CHECK (son_sonuc IN ('biliyorum', 'zor', 'tekrar')),
  son_gun        TEXT NOT NULL,                             -- son değerlendirme günü (YYYY-MM-DD)
  guncelleme     TEXT NOT NULL,
  PRIMARY KEY (user_id, kart_id)
);
CREATE INDEX idx_kart_durumu_vade ON kart_durumu(user_id, sonraki);
CREATE INDEX idx_kart_durumu_gun ON kart_durumu(user_id, son_gun);
