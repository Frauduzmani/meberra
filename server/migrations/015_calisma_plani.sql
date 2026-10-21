-- v1.18.0 Kişisel uyarlanır çalışma planı (server/plan.js; motor assets/js/plan-motor.js).
-- plan_ayar: haftalık çalışma saati, dondurulmuş (görevleri yazılmış) hafta ve profil imzası (ders/hedef/sınav yılı değişince bu hafta yeniden kurulur).
CREATE TABLE plan_ayar (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  saat        INTEGER NOT NULL DEFAULT 5,            -- 3 | 5 | 8 | 12
  hafta       TEXT,                                  -- görevleri yazılmış haftanın pazartesisi (YYYY-MM-DD)
  imza        TEXT,
  created     TEXT NOT NULL,
  updated     TEXT NOT NULL
);
-- plan_gorevler: bir haftaya yazılmış görevler. hafta = şu an bulunduğu hafta (devredince ilerler), ilk_hafta = planlandığı hafta.
-- tamam: 1 bitti (etkinlikten otomatik ya da elle). manuel: 1 öğrenci elle işaretledi/kaldırdı (otomatik işaret üzerine yazmaz).
CREATE TABLE plan_gorevler (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,
  hafta       TEXT NOT NULL,
  ilk_hafta   TEXT NOT NULL,
  veri        TEXT NOT NULL,                         -- görev JSON (plan-motor gorevYap çıktısı)
  tamam       INTEGER NOT NULL DEFAULT 0,
  manuel      INTEGER NOT NULL DEFAULT 0,
  tamam_zaman TEXT,
  created     TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX idx_plan_gorevler_hafta ON plan_gorevler(user_id, hafta);
