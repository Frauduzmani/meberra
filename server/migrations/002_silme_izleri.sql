-- Meberra şeması v2: senkron silme izleri (tombstone).
-- Bir cihaz birleştirilen bir anahtarı (ör. apmeberra:errors:v1) sildiğinde silme zamanı burada tutulur;
-- eski cihazlardan gelen, bu zamandan önceki kayıtlar birleştirmede atılır (silinen veri geri gelmez).
CREATE TABLE state_tombstones (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anahtar       TEXT NOT NULL,
  zaman         TEXT NOT NULL,                     -- son silme zamanı (sunucu saati, ISO)
  PRIMARY KEY (user_id, anahtar)
);
