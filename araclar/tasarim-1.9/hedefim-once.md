# Hedefim tasarım geçişi 1.9.0 — ÖNCE (eleştiri)

Ortam: yerel sunucu (geçici veri), kayıtlı öğrenci: lise 11. sınıf · Almanya, İtalya, Hollanda · İngilizce · AP Calculus AB, Physics 1, Chemistry.
Matris: masaüstü ≈1512 px ve telefon 390 px (iframe öykünmesi), açık ve koyu tema.

## /ulkem (sartlar.html) — "bozuk"
- Odak noktası yok: başlık + özet çubuğu + "Seçimin" kartı + "Sonraki adım" kartı + uyarı bandı + 8 çipli atlama çubuğu aynı anda ilk ekranda (6+ blok).
- "Seçimin" kartı kalabalık: uzun özet, AP notu, 5 kutulu `dl` (Son kontrol tek başına ikinci satıra düşüyor), uyarı, kaynak, 4 düğme.
- Sağ sütunda yalnız küçük "Sonraki adım" kartı; altında büyük boşluk, sol sütun 3 kat uzun (dengesiz ızgara).
- Şart listeleri duvar gibi: her maddenin tam metni + kaynak + "son kontrol" açık; 2 sütunlu ızgarada sol sütun ~5000 px, sağ sütun kısa.
- Gereken şartların görsel özeti (✓/!/?) yok; AP'nin rolü bir paragraf içinde kayboluyor.
- Telefonda sayfa 15 300 px; atlama çipleri yatay kaydırma okları ile kırpılıyor.
- Ülke değiştirmek için "Başka ülkeye bak" 4 adımlı formu açıyor (profilde ülkeler varken gereksiz form).

## /sinavlar (sinavlar.html) — "bozuk"
- İlk ekranın yarısı süzgeç formu (durum/sınıf/ülke/dil); "Genel deneme" bandı sınavlardan önce geliyor.
- Hedefim sekmesinde "Takvimim" etkin görünüyor; başlık üstünde "← Takvimim · Sınavlar".
- Kartlar metin duvarı: format, süre, puanlama, tarih paragrafları kartta açık; kartlar 700+ px boyunda ve ızgarada eşitsiz.
- Sıradaki tarih / geri sayım / ücret görünmüyor; yaklaşan tarihlerin görsel şeridi yok; "Takvimime ekle" yok.
- Telefonda sayfa 12 100 px.

## /takvim (rota.html)
- Telefonda rota seçici (Almanya/İtalya/Hollanda rotası) metinleri üst üste biniyor — gerçek kırık.
- "Sıradaki adım" + ilerleme halkası + temel kural + zaman çizelgesi + koşullar + belge listesi: ilk ekran kalabalık.
- Zaman çizelgesi ay gruplaması yok; yalnız "Gelecek" başlığı. Seçili adımın uzun detay metni kartta açık.
- Sağ sütunda koşullar ve belge listesi çok uzun, sol sütunla hizasız.

## /basvurular (yazismalar.html)
- Düzen genel olarak sakin; ama "Kontrol" paneli boşken boş çizgiler (iskelet) gösteriyor.
- Ön izleme alanı (metin kutusu) boşken çok büyük; şablon seçilmeden 4 eylem düğmesi görünüyor.
- Boş durumda maskot yok; başlık düzeni diğer Hedefim sayfalarıyla aynı değil (eyebrow "Hedefim").

## /universiteler
- 1.x yeniden tasarımı tutarlı; başlık "← Ülkem · Üniversiteler" + "Hangi ülke?" diğer Hedefim başlıklarından farklı.
- "Şartların" kartında satırlar yüklenirken soluk/boş görünüyor (kısa süreli).

## /rehber/almanya, /rehber/italya, /rehber/istanbul-sinav
- Uzun makale, içindekiler yok; masaüstünde metin 1100 px genişlikte (okuma ölçüsü çok geniş).
- "Genel koşullar" sarı kutusu uzun paragraf duvarı; adım kartları da tam metin.
- Başlık kalıbı Hedefim'den farklı (kart içinde hero).

## /kaynaklar (bilgi-merkezi.html)
- Kartlar 3 sütunlu ızgarada boyları çok farklı (bir kart 600 px), uzun notlar açık.
- Süzgeç çipleri ve arama iyi; ama bölümler arası geçiş/İçindekiler yok.

## Ortak
- 360 px'te yatay taşma yok (scrollWidth = viewport).
- Hedefim başlık kalıbı sayfadan sayfaya değişiyor (eyebrow, geri bağlantısı, h1 boyu).
