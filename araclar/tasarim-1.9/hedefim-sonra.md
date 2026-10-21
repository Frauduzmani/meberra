# Hedefim tasarım geçişi 1.9.0 — SONRA (ne değişti)

Yeni ortak stil: `assets/css/hedefim.css` (yalnızca tokenlar; açık/koyu tema tokenlardan gelir; hareket tokenları `hareket.css`).
Sayfalar `<main class="main-container hd">` ile bu dosyaya bağlanır. Veri dosyalarına (data/mevzuat/**) dokunulmadı.

## Ortak kalıp
- Başlık: üst satır (bölüm adı) + kısa h1 + tek satır alt metin (`.hd-head`); app.js'in Hedefim sekme çubuğuyla hizalı.
- Ülke çipleri bayrak benzeri CSS renk çipiyle (görsel dosya yok): Ülkem, Takvimim, Üniversiteler aynı görünüm.
- Açılır alanlar `details` + `::details-content` ile yumuşak yükseklik geçişi (destekleyen tarayıcıda); azaltılmış harekette kapalı.
- Sıralı giriş yalnızca ilk çizimde (opaklık + transform; düzen kayması yok). `[hidden]` her zaman gizler.
- Yüklenirken kökler yer ayırır (CLS).

## /sinavlar
- Odak: "Senin sıradaki tarihin" şeridi — büyük gün sayacı (bir kez sayar) + yatay zaman çizgisi (en yakın 6 tarih).
- Kapsam çipleri: Benim sınavlarım (profil AP dersleri + takvimime eklenenler + rotada zorunlu + hedef ülke × eğitim dili) / Tümü.
- Kategori çipleri Hepsi · AP · Giriş · Dil; eski süzgeç formu "Süzgeci değiştir" açılır alanında.
- Kart: ad, tek satır "ne" (tür · kurum · dil), sıradaki tarih + geri sayım çipi, ücret, "Takvimime ekle" (+ AP'de Deneme); format/süre/puanlama/tarih/not/kaynaklar "Ayrıntılar"da.
- Tarih kaynağı: AP için sinav-takvimi.js; diğerlerinde `sonrakiTarih`, yoksa yalnızca "Doğrulandı" kayıtların metnindeki oturum tarihleri (parantez içi, kayıt/son gün/pencere, "kapandı/geçti" hariç). Sürekli sınavlarda "Sık oturum".
- Kartlar sıradaki tarihe göre sıralı. Boş durumda Tilo.

## /ulkem
- Profilde ülke varsa 4 adımlı form gizli; yerine ülke değiştirici (DE · IT · NL · Başka ülke). Form yalnız "Başka ülke" ile ya da profilde ülke yoksa görünür (form ızgarasındaki 3 sütun çakışması da düzeltildi).
- Kahraman kart: bayrak çipi, durum rozeti, özetin ilk cümlesi (devamı açılır), "AP burada ne işe yarar?" bandı, 3 hızlı bilgi, tek birincil eylem (Takvimimi aç).
- Uyarılar kahramanın altında tek sütun.
- "Başvuruya giden yol" adım şeridi (dönemler, "Şimdi" vurgulu).
- "Ne gerekiyor" görsel kontrol listesi (✓ doğrulandı / ! teyit-yorum / ? belirsiz; ilk 6 madde, gerisi "Tüm maddeler"); her madde açılınca metin + kaynak.
- Diğer bölümler (Bu yıl, Tarihler, Hatalar, AP'nin etkisi, Burslar, Yol haritası) açılır kartlar; Üniversiteler ve Dil sınavları yapışkan yan sütunda. Eski `#sr-…` bağlantıları ilgili alanı açıp kaydırır.
- Sayfa boyu: masaüstü ~10 400 → ~2 600 px; telefon ~15 300 → ~4 100 px.

## /takvim
- Telefondaki üst üste binen rota seçici düzeltildi (bayraklı çipler, kendi içinde kayar).
- Yapışkan "Sıradaki adım" kartı (ay olarak geri sayım, ilerleme halkası) + "Sınavların" (zorunlu, seçmeli açılır, takvimime eklediklerim).
- Zaman çizelgesi ay ay gruplu (yapışkan ay rozeti), yapıldı/sıradaki/gecikti durumları; geçmiş katlı; uzun açıklamalar "Ayrıntılar"da.
- Belgeler, koşullar, açık kararlar, uyarılar açılır bölümlerde. Alt kısım sakin "sonraki adımlar" şeridi.

## /basvurular
- Başlık kalıbı; boş "Kontrol" paneli çizgileri kaldırıldı (boş bloklar gizli); boş durumda Tilo.
- Şablon kartlarında "Ne zaman / kime / dayanak" açılır alana alındı; amaç ve taslak ön izlemesi 3 satır.

## /universiteler
- Başlık Hedefim kalıbına alındı ("Ülkem · Üniversiteler" / "Üniversiteler" / tek satır); ülke çipleri bayraklı, yumuşak seçili hal.

## Rehberler ve /kaynaklar
- Makale düzeni: masaüstünde yapışkan numaralı İçindekiler (etkin bölüm vurgulu), telefonda katlı.
- Başlık kart değil, kalıpla aynı; istatistikler kompakt.
- Uzun notlar 3 satır + "Devamını göster" (CSS baştan uygular).
- /kaynaklar: bölüm İçindekiler'i (kart sayılı), kart özetleri kısaltılmış, 2 sütunlu okunur ızgara.

## Ölçümler
- CLS (PerformanceObserver, buffered, 1440 ve 390 px): ısınmış önbellekle 9 sayfanın hepsi 0. Soğuk ilk yüklemede /ulkem önce 0,74 idi (veri geç gelince kök ve alt bilgi kayıyordu); kök artık yüklenirken 80vh yer ayırıyor → soğuk yüklemede 0,034.
- 360/390 px'te yatay taşma yok (scrollWidth = görünür genişlik).
