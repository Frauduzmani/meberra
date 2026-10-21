# Tasarım 1.9.0 — Genel sayfalar: ÖNCE eleştirisi

Ölçüm: 1440×900 ve 390×844, açık + koyu; dolu hesap (onboarding + AP dersleri, 12 Calculus + Biology cevabı, 1 bitmiş deneme) ve boş (taze) hesap; yönetici ayrı alt alan adında.
360/390 px yatay taşma: **yok** (tüm sayfalarda `scrollWidth == clientWidth`).

Önem sırasıyla (1 = en ağır):

| # | Sayfa | Sorun | Tür |
|---|-------|-------|-----|
| 1 | Yasal metinler (kvkk, gizlilik, kosullar, mesafeli-satis, cerez) | Tablolarda ilk sütun ~40 px'e eziliyor; "Veri kateg orisi", "Kimli k" gibi kelimeler harf harf kırılıyor. Okunamaz. | Bozuk |
| 2 | Profil | İki sütunlu tek dev form duvarı (okul, 15 ülke kartı, odak, dil, alan, resmi yazışma, şifre, bildirimler, veri, davet, ölçüm…) — odak noktası yok, mobilde ~6 ekran kaydırma. | Kaotik |
| 3 | Çalış | Her ders kartında ayrı öğrenme yolu + ayrı Tilo → sayfada 7 maskot (kural: en fazla 1). Kart altlarında 2–3 eşit ağırlıklı buton. | Kaotik / tutarsız |
| 4 | Deneme sınav ekranı | Ana gezinme (Bugün/Çalış/Hedefim/XP/zil) sınav sırasında görünür → "odaklı ekran" vaadi bozuluyor. | Zayıf odak |
| 5 | Deneme katalog | Kartlar farklı yükseklikte, CTA'lar hizasız; turuncu "Premium'a geç" ve mor "Denemeyi kur" karışık; her kartta turuncu/kırmızı uyarı metni (hata gibi görünüyor). | Tutarsız / gürültü |
| 6 | Ders sayfası soru kartı | Yanlış cevapta tüm kartın kalın kırmızı çerçevesi + kırmızı kutu içinde turuncu kutu + mor kutu: üç renkli iç içe kutu. Sakin değil. | Kaotik |
| 7 | İlerleme | 13 rozetlik duvar (11'i "Henüz kazanılmadı"), mobilde ~3 ekran. Başlamamış her ders için aynı boş kart ×5. Renk lejandı çipleri gürültü. | Metin/öğe fazlası |
| 8 | Seviye testi | Form öncesi iki ayrı banner (gün sayacı + uyarı) → iki odak. | Odak |
| 9 | Premium | Turuncu "Ücretsiz denemeyi başlat" ve mor "Devam et" aynı ekranda iki birincil CTA. | Odak |
| 10 | Sorularım (boş) | Başlıkta + boş durumda iki ayrı turuncu "Soru sor" butonu. | Tekrar |
| 11 | Yönetim paneli | Üst barda XP çipi ("⚡ / 0XP") iki satıra kırılıyor; altta öğrenci "Rehberler" şeridi; özet kartları farklı yükseklikte, mini grafik tek blok. | Bozuk / tutarsız |
| 12 | Şifre sıfırla (geçersiz bağlantı) | Hata kutusunun altında yine boş form + pasif buton gösteriliyor. | Gereksiz |
| 13 | Bugün | Hero'da selam balonu + "Hoş geldin" çipi + "Bugünkü görevin" + "Çalışma planı" çipi + 3 adım + 2 CTA + "Neden bu?" → çok küçük öğe. | Gürültü (hafif) |
| 14 | Ders hub'ı | Temiz; ama hero'daki 3 istatistik kutusu ve "Ek bölümler" çip bulutu aynı ağırlıkta. | Hafif |
| 15 | Vitrin, Fiyatlar, Giriş/Kayıt, 404, Veli | İyi durumda; yalnız ufak boşluk ritmi. | — |

Koyu tema: genel olarak tutarlı; turuncu uyarı metinleri koyu zeminde göz yoruyor (deneme kartları).
