# Tasks

## Active

- [ ] **Veritabanı altyapısı (yerelde de veritabanıyla çalışacak)** - sıradaki büyük iş
  - Şu an her şey tarayıcının localStorage'ında; sunucu ve veritabanı yok
  - Tablolar: kullanıcılar, profiller, oturumlar, ilerleme (her cevap), hata defteri / yanlışlar, denemeler, seviye testi sonuçları, rota durumu, sınav listesi, yazışma taslakları
  - Denetim kaydı (audit log) tablosu: kim, ne zaman, ne yaptı (giriş, kayıt, profil değişikliği, cevap, deneme, silme)
  - Yerelde ve sunucuda aynı şema; şifreler sunucuda hash'li, e-postayla şifre sıfırlama
  - localStorage'daki mevcut verilerin veritabanına taşınması (tek seferlik aktarım)
  - Karar bekliyor: teknoloji (öneri: Node.js + SQLite yerelde, PostgreSQL sunucuda; aynı SQL şeması)

## Waiting On

- [ ] **Marka adı** - logo hâlâ "AP MEBERRA"; kullanıcı yeni adı seçecek

## Someday

- [ ] **Ünite içindeki konu başlıklarını katlanabilir yap** - Calculus Unit 1 tek başına telefonda ~35 ekran (anlatım çok uzun); "Sorulara geç" kısayolu eklendi
- [ ] **English sayfası** - yalnızca 2 soru istasyonu ünite olarak çıkıyor; kompozisyon içerikleri "Ek bölümler"de

- [ ] **Üyelik ve ödeme** - Ücretsiz / Premium ayrımı, iyzico veya PayTR (veritabanından sonra)
- [ ] **Tahmini AP puanı (1–5)** - deneme sonuçlarından; Premium kartı ile birlikte
- [ ] **Akıllı yanlış tekrarı** - yanlış soru 1, 3, 7 gün sonra tekrar
- [ ] **Veli haftalık raporu (e-posta)** - sunucu gerektirir
- [ ] **Üniversite mezunu Bugün ekranını tarayıcıda kontrol et**
- [ ] **Tarayıcı testlerini güncelle** - `araclar/testler` eski menüyü ("Başvuru" sekmesi) bekliyor; Chromium yolu başka makineye ait
- [ ] **`sinav-birim-test.js` hatası** - test, geçici klasör yolunu proje yoluyla yanlış birleştiriyor
- [ ] **Eski ajan sohbet kodunu temizle** - `assets/js/app.js` içindeki AGENTS / sohbet fonksiyonları artık kullanılmıyor
- [ ] **`sunum/` klasöründeki eski kopya** - hâlâ ajan bağlantıları içeriyor

## Done

- [x] ~~Öğrenciye görünen iç notları, sahte danışmanları ve Ajanlar sayfasını kaldır~~ (20 Eki 2026)
- [x] ~~Okul adı isteğe bağlı; karşılama seviye testinde bitiyor~~ (20 Eki 2026)
- [x] ~~v4 enerjik tema, 4 sekmeli menü, yeni Bugün ekranı ve çalışma serisi~~ (20 Eki 2026)
- [x] ~~Ders sayfalarını ünitelere böl (özet · ?unite=N · ?bolum=K; eski # bağlantılar çalışıyor)~~ (20 Eki 2026)
