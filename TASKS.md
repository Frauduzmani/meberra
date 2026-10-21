# Tasks

## Active

- [ ] **Canlıya alma (sahibi yapacak)** - adım adım rehber: `CANLIYA-ALMA.md`
  - Alan adı + Linux VPS al; `.env` dosyasını `.env.example`'dan oluştur
  - `BANKA_ADI`, `IBAN`, `HESAP_SAHIBI` (Premium ödeme sayfasında görünür)
  - `ADMIN_EPOSTA` + `ADMIN_SIFRE` (ilk yönetici; ilk girişten sonra satırları sil)
  - SMTP (şifre sıfırlama, Premium onay e-postaları; yoksa e-postalar yalnızca veritabanı kuyruğunda kalır)
  - Docker: `docker compose up -d --build` · Nginx + HTTPS (certbot) · günlük yedek (`deploy/yedek-cron.txt`)
- [ ] **Yasal metinleri tamamla** - `kvkk.html`, `gizlilik.html`, `kosullar.html`, `mesafeli-satis.html`, `cerez.html`
  - Köşeli parantezli alanlar: `[ŞİRKET ÜNVANI]`, `[ADRES]`, `[VERGİ DAİRESİ / NO]`, `[MERSİS NO]`, `[KEP ADRESİ]`, `[TELEFON]`, barındırma ve e-posta sağlayıcısı
  - 7 günlük iyi niyet iadesi politikası (fiyatlar, koşullar, mesafeli satış sayfalarında aynı metin) — karar ver
  - Bir hukukçuya kontrol ettir; sonra sayfa üstündeki sarı "taslak" kutusunu kaldır
- [ ] **İlk gerçek satış provası** - kayıt → Premium bildirimi → yönetici panelinden onay → Premium açıldı e-postası

- [ ] **Telefon bildirimini gerçek telefonda dene** - Android Chrome + iPhone (Ana Ekrana Ekle, iOS 16.4+); canlıda HTTPS şart
- [ ] **Üniversite AP rozetlerini içerik olarak kontrol et** - `assets/js/universiteler-gorunum.js` içindeki elle yazılmış tablo
- [ ] **İYS / ticari ileti** - hatırlatma e-postaları ve bildirimler için hukukçuya sor

## Waiting On

- [ ] **Ödeme sağlayıcısı (iyzico / PayTR)** - şimdilik havale/EFT + elle onay; şirket hesabı açılınca otomatik ödeme eklenir

## Someday

- [ ] **Akıllı yanlış tekrarı** - yanlış soru 1, 3, 7 gün sonra Bugün ekranında "tekrar zamanı" olarak çıksın
- [ ] **Veli haftalık raporu (e-posta)** - SMTP kurulduktan sonra; ilerleme özeti
- [ ] **Premium içerik koruması (sunucu tarafı)** - kilit şu an arayüzde; ünite soruları HTML içinde. Sorular API'den, Premium kontrolüyle verilsin
- [ ] **Üniversite mezunu Bugün ekranını tarayıcıda kontrol et**
- [ ] **Tarayıcı testlerini güncelle** - `araclar/testler/*-test.js` (Playwright) eski menüyü ve tarayıcı içi hesabı bekliyor; Chromium yolu başka makineye ait
- [ ] **English sayfası** - yalnızca 2 soru istasyonu ünite olarak çıkıyor; kompozisyon içerikleri "Ek bölümler"de
- [ ] **`sunum/` klasöründeki eski çevrimdışı kopya** - hâlâ eski marka ve ajan bağlantıları içeriyor (canlıya gitmiyor)

## Done

- [x] ~~Denetim: sunucu (oturum, şifre, hesap silme, gelir, eşitleme, hız sınırı) ve istemci (ücretsiz ünite kuralı, deneme hakkı, bayat Premium) hataları~~ (21 Eki 2026)
- [x] ~~Sadeleştirme: terim sözlüğü, Hedefim = Ülkem/Takvimim/Başvurularım, yüksek lisans gizli; yeni vitrin (3 adımlı animasyon); üniversiteler sayfası yeniden tasarım~~ (21 Eki 2026)
- [x] ~~Yönetici paneli: Veri (tablo görüntüle/düzenle/CSV), Sorular, Duyuru, Lig sekmeleri~~ (21 Eki 2026)
- [x] ~~Soru-cevap (ücretsiz 3/ay), bildirim zili, e-posta hatırlatma, veli haftalık raporu, web push (PWA), haftalık lig~~ (21 Eki 2026)
- [x] ~~Oyunlaştırma: günlük hedef, seri koruma, akıllı tekrar, görevler, rozetler, kutlama, öğrenme yolu; enerjik geçişler~~ (21 Eki 2026)

- [x] ~~Öğrenciye görünen iç notları, sahte danışmanları ve Ajanlar sayfasını kaldır~~ (20 Eki 2026)
- [x] ~~Okul adı isteğe bağlı; karşılama seviye testinde bitiyor~~ (20 Eki 2026)
- [x] ~~v4 enerjik tema, 4 sekmeli menü, yeni Bugün ekranı ve çalışma serisi~~ (20 Eki 2026)
- [x] ~~Ders sayfalarını ünitelere böl (özet · ?unite=N · ?bolum=K; eski # bağlantılar çalışıyor)~~ (20 Eki 2026)
- [x] ~~Node.js + SQLite sunucu: hesaplar, oturumlar, profil, cevaplar, yanlışlar, denemeler, seviye testleri, abonelikler, ödeme bildirimleri, denetim kaydı, e-posta kuyruğu~~ (21 Eki 2026)
- [x] ~~Tarayıcı ↔ sunucu senkronu (her cihazdan aynı ilerleme), e-postayla şifre sıfırlama, KVKK veri indirme / hesap silme~~ (21 Eki 2026)
- [x] ~~Ücretsiz / Premium: her derste ilk 2 ünite ve her dersten 1 deneme ücretsiz; premium.html (havale/EFT bildirimi); yönetici paneli (onay, kullanıcılar, denetim kaydı)~~ (21 Eki 2026)
- [x] ~~Vitrin, fiyatlar, yasal metin taslakları; marka adı Meberra; robots.txt, sitemap.xml, favicon~~ (21 Eki 2026)
- [x] ~~Docker, Nginx, systemd, yedek ve geri yükleme dosyaları; CANLIYA-ALMA.md~~ (21 Eki 2026)
- [x] ~~Ünite içindeki konu kartları katlanır; eski ajan sohbet kodu silindi~~ (21 Eki 2026)
