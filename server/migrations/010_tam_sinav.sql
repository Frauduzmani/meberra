-- v1.12.0: Tam deneme sınavı (server/tamsinav.js; plan server/tohum/sinav-formatlari.json).
-- Süre sunucuda tutulur: her bölümün açılış ve bitiş zamanı sunucu saatiyle yazılır; bitişten sonra gelen cevap reddedilir.
-- Doğru cevaplar sınav bitene kadar gönderilmez; FRQ rubriği yalnız Bölüm II teslim edilince gelir (frq_denemeleri satırı).

CREATE TABLE tam_sinavlar (
  id            TEXT PRIMARY KEY,                          -- ts-…
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kod           TEXT NOT NULL,                             -- sınav planı anahtarı (calculus-ab, microeconomics …)
  durum         TEXT NOT NULL DEFAULT 'devam' CHECK (durum IN ('devam', 'bitti', 'birakildi')),
  plan          TEXT NOT NULL,                             -- JSON: bölümler (tür, süre sn, soru anahtarları / FRQ kimlikleri) — değişmez
  veri          TEXT NOT NULL,                             -- JSON: bölüm zamanları, cevaplar, işaretler, soru süreleri, FRQ metinleri
  sonuc         TEXT,                                      -- JSON: puanlanmış sonuç (bitince)
  olusturma     TEXT NOT NULL,
  bitis         TEXT
);
CREATE INDEX idx_ts_user ON tam_sinavlar(user_id, durum, olusturma);
