-- v1.16.0 oyun: akıllı hatırlatma saati. saat_elle = 1 → öğrenci saati kendisi seçti (önerilen saat kullanılmaz).
-- Mevcut kayıtlarda varsayılandan (19) farklı saat seçilmişse elle seçilmiş sayılır.
ALTER TABLE notification_prefs ADD COLUMN saat_elle INTEGER NOT NULL DEFAULT 0;
UPDATE notification_prefs SET saat_elle = 1 WHERE hatirlatma_saati <> 19;
