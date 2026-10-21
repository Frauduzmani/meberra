# Tasks

## Active

- [ ] **GitHub'a gönder (sahibi)** - `git push -u origin master --tags` (gizli repo: Frauduzmani/meberra)
- [ ] **Canlıya alma (sahibi, sunucuda)** - adım adım rehber: `CANLIYA-ALMA.md`
  - Alan adı + Linux VPS; `.env` dosyasını `.env.example`'dan oluştur (IBAN, SMTP, yönetici, VAPID, BUYUME_TUZ)
  - Docker: `docker compose up -d --build` · Nginx + HTTPS (certbot) · günlük yedek (`deploy/yedek-cron.txt`) · yedeklerin sunucu dışına kopyası · dış "site ayakta mı" izleme
- [ ] **Yasal metinler** - köşeli parantezli şirket bilgileri; `HUKUK-NOTLARI.md` maddeleri (IP saklama, ölçüm, deneme, davet, veli, okul/öğretmen); 7 gün iade kararı; hukukçu kontrolü; İYS
- [ ] **İlk gerçek satış provası** - kayıt → Premium bildirimi → yönetici onayı → Premium açıldı e-postası
- [ ] **Gerçek cihaz denemesi** - telefon bildirimi (Android + iPhone "Ana Ekrana Ekle", iOS 16.4+), "Uygulamayı yükle", çevrimdışı sayfa
- [ ] **Öğretmen kontrolü** - bir AP öğretmeninin soru ve kart örneklemini kontrol etmesi (pazarlamada yalnızca yapıldıysa söylenir)
- [ ] **Üniversite AP rozetleri** - `assets/js/universiteler-gorunum.js` içindeki elle yazılmış tabloyu içerik sahibi olarak kontrol et

## Waiting On

- [ ] **Ödeme sağlayıcısı (iyzico / PayTR)** - şimdilik havale/EFT + elle onay; şirket hesabı açılınca otomatik ödeme
- [ ] **Google Play (TWA)** - alan adı + HTTPS sonrası; `CANLIYA-ALMA.md` › Google Play bölümü

## Someday (özellik dondurma: yalnızca içerik, doğruluk, sadelik)

- [ ] **İçerik derinliği** - English ve CS A'da daha fazla soru; Physics 1 ve Biology'de yeni ünite derslerinin (Unit 8) konu anlatımı
- [ ] **Dönüşüm hunisini izle** - Yönetim › Büyüme: kullanılmayan özellikleri sadeleştir
- [ ] **`sunum/` eski çevrimdışı kopya** - eski marka ve ajan bağlantıları içeriyor (canlıya gitmiyor); silinebilir
- [ ] **Yapay zekâ öğretmen (Premium)** - API anahtarı ve bütçe olunca (sahip: şimdilik yok)

## Done

- [x] ~~1.13–1.19 (21 Eki 2026): grafikli sorular (50), Ekonomi/English (+82), CI + uçtan uca testler + çevrimdışı, ilerleme grafikleri, Premium yönetimi, ustalık/aylık görev/haftalık özet/akıllı hatırlatma/geri dönüş, interaktif konu anlatımı (31 araç), hız turu, günün sorusu, odak sayacı, kişisel plan, kavram kartları (326), 6 rehber, okul ve öğretmen paneli; Bugün tek yön, Çalış 4 giriş~~
- [x] ~~1.8–1.12 (21 Eki 2026): temiz adresler, tasarım taraması, içerik denetimi (0 hatalı anahtar), 220 yeni soru + 32 FRQ, tam deneme sınavı~~
- [x] ~~1.4–1.7 (21 Eki 2026): maskot Tilo, soru bankası veritabanında (sunucuda Premium koruması), dönüşüm hunisi/deneme/kupon/davet, veli paneli~~
- [x] ~~1.0–1.3 (20–21 Eki 2026): sunucu + SQLite, senkron, Premium (havale), yönetici paneli, sistem logları, bakım modu, sürümleme~~
