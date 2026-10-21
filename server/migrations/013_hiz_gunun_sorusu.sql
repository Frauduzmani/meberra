-- v1.17.0: Hız turu (60 sn) ve Günün sorusu (server/hiz.js).
-- Hız turu: kuyruk ve süre SUNUCUDA; puan/kombo sunucuda hesaplanır. Cevaplar ayrıca mevcut hatta (apmeberra:quiz:v1 → answers)
-- yazılır, böylece XP / lig / istatistik / tekrar normal sayılır.
CREATE TABLE hiz_turlari (
  id            TEXT PRIMARY KEY,                          -- hz-…
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ders          TEXT NOT NULL,                             -- calculus | physics | … | karisik
  kuyruk        TEXT NOT NULL,                             -- JSON: soru kimlikleri (sunucu seçer, ~40)
  sira          INTEGER NOT NULL DEFAULT 0,                -- sıradaki soru indeksi
  baslangic     INTEGER NOT NULL,                          -- ms (sunucu saati)
  bitis         INTEGER NOT NULL,                          -- ms: baslangic + 60 sn
  puan          INTEGER NOT NULL DEFAULT 0,
  kombo         INTEGER NOT NULL DEFAULT 0,                -- art arda doğru (şu an)
  en_kombo      INTEGER NOT NULL DEFAULT 0,
  dogru         INTEGER NOT NULL DEFAULT 0,
  yanlis        INTEGER NOT NULL DEFAULT 0,
  pas           INTEGER NOT NULL DEFAULT 0,
  durum         TEXT NOT NULL DEFAULT 'devam' CHECK (durum IN ('devam', 'bitti')),
  olusturma     TEXT NOT NULL
);
CREATE INDEX idx_hiz_user ON hiz_turlari(user_id, durum, baslangic);

-- Günün sorusu: o günün sorusu ilk istekte sabitlenir (gün içinde havuz değişse de aynı soru kalır).
CREATE TABLE gunun_sorusu (
  tarih         TEXT PRIMARY KEY,                          -- YYYY-MM-DD (Europe/Istanbul)
  soru_id       TEXT NOT NULL,
  olusturma     TEXT NOT NULL
);
-- Topluluk istatistiği: yalnız şık başına SAYI (kim neyi seçti tutulmaz).
CREATE TABLE gunun_sorusu_dagilim (
  tarih         TEXT NOT NULL,
  secim         TEXT NOT NULL,
  n             INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tarih, secim)
);
-- Katılım (seri ve "bugün cevapladın mı" için): şık bilgisi YOK.
CREATE TABLE gunun_sorusu_katilim (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tarih         TEXT NOT NULL,
  PRIMARY KEY (user_id, tarih)
);
