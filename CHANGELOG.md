# Sürüm notları

Meberra [anlamsal sürümleme](https://semver.org/lang/tr/) kullanır: `ANA.ARA.YAMA`.

- **YAMA** (1.3.**1**): hata düzeltmesi, metin düzeltmesi; davranış değişmez.
- **ARA** (1.**4**.0): yeni özellik, yeni sayfa ya da ekran; eski veriler ve bağlantılar çalışmaya devam eder.
- **ANA** (**2**.0.0): geriye uyumsuz değişiklik (ör. veri biçimi, API sözleşmesi, mobil uygulamanın güncellenmesini zorunlu kılan değişiklik).

Her sürümde: `package.json` → `version` güncellenir, bu dosyaya not eklenir, git'te `vX.Y.Z` etiketi atılır.
Sürüm numarası `/api/health` yanıtında ve yönetici panelinde görünür. Android uygulamasının (Google Play) `versionName` değeri buradaki sürümle aynı tutulur.

## [1.12.1] — 2026-10-21
### Düzeltildi
- Bugün ve Çalış: AP kayıt son günü uyarısı yalnızca sınav yılı bu dönem olan öğrenciye gösterilir.

## [1.12.0] — 2026-10-21
### Eklendi
- Tam deneme sınavı (`/deneme?tam=1`, Premium): gerçek AP bölüm yapısı, süreleri ve hesap makinesi kuralları (9 sınav; College Board kaynaklı, `server/tohum/sinav-formatlari.json`).
  Süre sunucuda tutulur, otomatik teslim, soru ızgarası, işaretleme, şık eleme, ara ekranı, gözden geçirme; resmi formül/başvuru PDF bağlantıları, izinli bölümlerde Desmos.
- Bölüm II FRQ öz puanlamasıyla bileşik puan ve tahmini 1–5 (kesme puanları "tahmini"); ünite, soru süresi ve geçmiş grafikleri; yanlışlar akıllı tekrara eklenir.
- Tam sınav sonuçları veli panelinde; KVKK dışa aktarma ve silme kapsar.
### Not
- Micro ve Macro için tam sınav yeterli soru olana dek "Yakında".

## [1.11.0] — 2026-10-21
### Eklendi
- 220 yeni soru yayında (yazan ekipten bağımsız denetçiler her birini yeniden çözerek onayladı; 9 tekrar/benzer soru arşivde).
  Aktif soru bankası: Calculus 351 · Physics 225 · Chemistry 270 · Biology 207 · English 80 · Seçmeliler 141 · CEnT-S 74 (toplam 1.349).
- 32 FRQ yayında. Physics Unit 8 Fluids ve Biology Unit 8 Ecology üniteleri açıldı.
### Değişti
- Sahip adına içerik kararları (`araclar/icerik-denetim/KARARLAR.md`): Physics C vaadi kaldırıldı ("AP Physics 1"); 5 ileri soru "Physics C · ileri" etiketiyle derste kalır, Physics 1 denemesine girmez.
- 17 soru yeniden yazıldı (seviye testindeki 9 tekrar dâhil; kimlikler ve cevap geçmişi korunur); 121 zorluk etiketi kalibre edildi; 21 kimya konu numarası güncel CED'e çekildi.
- Yönetici formunda şık karşılaştırması büyük/küçük harfe duyarlı. FRQ tohumu da mevcut veritabanlarına sürümle aktarılır.

## [1.10.0] — 2026-10-21
### Eklendi
- İçerik denetimi: 1.130 sorunun her biri bağımsız olarak yeniden çözüldü — **hatalı cevap anahtarı yok**. Raporlar `araclar/icerik-denetim/`.
- Cevaptan sonra geri bildirimde kavram, hesap makinesi bilgisi; "Daha fazla" altında ipucu ve sık hata (ders, tekrar, deneme, seviye testi).
- FRQ pratiği (`/frq`): 32 özgün serbest yanıt sorusu (taslak, onaydan sonra yayında), rubrikle öz puanlama; ücretsiz planda her dersten 1.
- 229 yeni çoktan seçmeli soru (taslak) ve yönetici › Soru bankası › Onay kuyruğu (önizleme, toplu onay/ret, klavye kısayolları); yönetici FRQ sekmesi.
- Physics Unit 8 Fluids, Biology Unit 8 Ecology üniteleri ve English 4–6. okuma parçaları (onaylanan soru yoksa "Yakında").
### Değişti
- 40 metin/çeldirici düzeltmesi, 20 konu etiketi, 29 zorluk; 2 birebir tekrar soru arşivde (cevap geçmişi korunur).
- Mevcut veritabanları tohum sürümüyle otomatik güncellenir; yönetici düzenlemeleri korunur. Taslak sorular hiçbir yoldan öğrenciye gitmez.
- Ücretsiz planda Genel deneme kilitli kart olarak görünür. KVKK dışa aktarma ve silme FRQ verisini kapsar.

## [1.9.0] — 2026-10-21
### Değişti
- Tasarım taraması (her sayfa masaüstü/telefon, açık/koyu ekran görüntüsüyle; notlar `araclar/tasarim-1.9/`):
  - Sınavlar: "sıradaki tarih" sayacı ve zaman şeridi, sade sınav kartları, "Benim sınavlarım" süzgeci.
  - Ülkem: bayraklı ülke seçici, "AP burada ne işe yarar?" bandı, şart listesi, katlanır bölümler (sayfa boyu ~4 kat kısaldı).
  - Takvim, Başvurular, Üniversiteler ve rehberler ortak başlık düzeninde; rehberlerde içindekiler.
  - Profil 4 bölüm (yan menü / sekmeler); sınav sırasında odak modu; tek kutulu cevap geri bildirimi; Çalış'ta tek maskot.
  - Yasal sayfalarda tablo düzeni, Premium'da tek odak, şifre sıfırlamada geçersiz bağlantı ekranı.
- JS ve CSS her açılışta doğrulanır (ETag); yeni sürüme geçişte eski stil/betik kalmaz.
### Düzeltildi
- Sayfa kaymaları: deneme 0,134 → 0,003; Premium 0,090 → 0,008; tüm ana sayfalar ≤ 0,011.

## [1.8.0] — 2026-10-21
### Değişti
- Temiz adresler: `/bugun`, `/calis`, `/ders/calculus`, `/ulkem`, `/takvim`, `/basvurular`, `/rehber/almanya`…; URL'lerde .html yok. Eski `/x.html` adresleri 301 ile yönlenir (sorgu korunur).
- Yönetim paneli `/yonetim`: yalnızca yönetici oturumunda açılır, diğerlerine 404; adres herkese açık dosyalarda geçmez.
- E-posta ve bildirim bağlantıları temiz adreslerle; giriş yapmış kullanıcı `/` adresinde Bugün'e (veli kendi paneline) gider.
### Eklendi
- Bilinmeyen adreslerde maskotlu 404 sayfası; tanıtım sayfalarına `<link rel="canonical">`; site haritası, robots.txt ve PWA manifest (`start_url /bugun`) güncellendi.
### Not
- Site artık dosyadan (`file://`) açılmaz; `npm start` / `baslat.bat` ile açın.

## [1.7.0] — 2026-10-21
### Eklendi
- Veli paneli (`veli.html`): öğrenci davetiyle veli hesabı; haftalık özet, ders hedef ilerlemesi, son denemeler, AP tarihleri, Premium durumu; veli çocuğu için ödeme bildirimi verir.
- Karşılamada ve profilde AP dersleri, hedef puan (3/4/5), sınav yılı; Bugün planı, Çalış, deneme önerileri ve geri sayım seçime göre.
- Haftalık veli e-postası bağlı velilere (tek tıkla iptal); öğrenci bağlantıyı istediği an kaldırır; tüm bağlama işlemleri denetim kaydında.
### Değişti
- Yönetici kullanıcı listesinde rol süzgeci ve veli bağlantıları. Veritabanı göçleri artık `.js` de olabilir.

## [1.6.0] — 2026-10-21
### Eklendi
- Birinci taraf dönüşüm hunisi ölçümü (üçüncü taraf betik yok; DNT/GPC ve profil tercihi; 400 gün saklama) ve yönetici "Büyüme" sekmesi: huni, kohort, günlük grafikler, paywall yerleri.
- 7 gün ücretsiz Premium denemesi: kişi ve e-posta başına bir kez, ödeme bilgisi gerekmez; 2 gün kala ve bitişte bildirim; yönetici uzatır veya iptal eder; gelir tahminine girmez.
- İndirim kodları (yüzde/tutar, plan, tarih, kullanım sınırı); ödeme bildirimi indirimli tutarla kaydedilir.
- Davet programı: davet edilen seviye testini bitirince iki tarafa +7 gün Premium (davet edene yılda en çok 10); kötüye kullanım bayrakları.
- `HUKUK-NOTLARI.md`: yasal metinlere eklenecek maddeler.

## [1.5.0] — 2026-10-21
### Eklendi
- Soru bankası veritabanında (1.131 soru: 977 ders + 153 seviye testi + 1 vitrin örneği); tohum dosyası `server/tohum/soru-bankasi.json`, aktarıcı `araclar/soru-aktar.js`.
- Yönetici paneline "Soru bankası" sekmesi: istatistik, şüpheli soru vurgusu, önizleme, sürüm geçmişi ve geri yükleme, arşiv, JSON dışa aktarma.
### Değişti
- Cevap anahtarları artık herkese açık dosyalarda yok; cevap kontrolü, deneme ve seviye testi puanlaması sunucuda.
- Kilitli ünite ve ücretsiz deneme hakkı sunucuda denetleniyor; ücretsiz ünite kuralı tek ortak dosyada (`assets/js/ucretsiz-kural.js`).

## [1.4.0] — 2026-10-21
### Eklendi
- Maskot Tilo (6 ifade) ve hareket sistemi; tek seferde tek kutlama (kuyruk), ünite bitince paylaşılabilir hikâye kartı.
- Doğru cevapta "+10 XP" uçuşu ve gezinme çubuğunda XP sayacı; yanlışta açıklama kayarak açılır.
- Kıvrımlı öğrenme yolu (Çalış ve ders sayfaları), deneme puanının sayarak belirmesi, 7/30/100 gün seri kartları.
- Akşam seri tehlikedeyken uykulu Tilo hatırlatması; maskotlu boş ekranlar ve 404 sayfası.
### Değişti
- Bugün en fazla 4 blok; geri kalanı "Daha fazla" altında. Ders kartı → ders sayfası geçiş animasyonu.
- Yinelenen konfeti/toast ve sonsuz döngü animasyonları kaldırıldı.

## [1.3.0] — 2026-10-21
### Eklendi
- Yönetici paneli: kullanıcıların IP'si, son görülme, çevrimiçi durumu, günlük giriş sayısı, son giriş; oturum listesi.
- Kullanıcı ve IP engelleme (süreli/süresiz), destek merkezi (hazır yanıtlar, iç not, bekleme süresi), sistem bilgileri (uptime, bellek, önbellek, kuyruklar), elle yedek, bakım modu.
- Google Play (TWA) hazırlığı: `/.well-known/assetlinks.json`.
- Sürüm numarası ve bu sürüm notları.
### Değişti
- Telifli PDF'ler repodan ve siteden çıkarıldı; Calculus sayfası College Board'un resmi bağlantılarını kullanıyor.

## [1.2.0] — 2026-10-21
### Eklendi
- Sistem logları: sunucu ve tarayıcı hataları, yavaş istekler, güvenlik uyarıları; yönetici panelinde Sistem sekmesi.
- Sorularım ayrı sayfa; vitrinde canlı örnek soru; Premium ödeme adımları.
### Değişti
- Tasarım v5: tüm sayfalar yenilendi, sayfa kaymaları giderildi, geçiş animasyonları.
- Tarayıcı depolaması, yedekleme ve kurtarma kodu metinleri kaldırıldı (ürün yalnızca sunucu modunda çalışır).
- Resmi kaynaklardan bilgi düzeltmeleri (AP Calculus sınav yapısı, CEnT-S tarihleri).

## [1.1.0] — 2026-10-21
### Eklendi
- Yönetici paneli: Veri (tablo görüntüle/düzenle/CSV), Sorular, Duyuru, Lig.
- Soru–cevap (ücretsiz ayda 3), bildirim zili, e-posta hatırlatma, veli haftalık raporu, telefon bildirimi (PWA), haftalık lig.
- Oyunlaştırma: günlük hedef, seri koruma, akıllı tekrar, görevler, rozetler, kutlama, öğrenme yolu.
- Yeni vitrin (3 adımlı anlatım), üniversiteler sayfası yeniden tasarım.
### Değişti
- Hedefim üç bölüm: Ülkem, Takvimim, Başvurularım. Terim birliği; yüksek lisans yolu gizlendi.
### Düzeltildi
- Oturum süresi, şifre değişikliği, hesap silme, gelir tahmini, cihazlar arası eşitleme, ücretsiz ünite ve deneme hakkı kuralları.

## [1.0.0] — 2026-10-21
### Eklendi
- Node.js + SQLite sunucu: hesaplar, oturumlar, ilerleme senkronu, denetim kaydı.
- Ücretsiz / Premium (havale/EFT + yönetici onayı), yönetici paneli, yasal sayfa taslakları, canlıya alma dosyaları.
