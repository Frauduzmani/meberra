# Sürüm notları

Meberra [anlamsal sürümleme](https://semver.org/lang/tr/) kullanır: `ANA.ARA.YAMA`.

- **YAMA** (1.3.**1**): hata düzeltmesi, metin düzeltmesi; davranış değişmez.
- **ARA** (1.**4**.0): yeni özellik, yeni sayfa ya da ekran; eski veriler ve bağlantılar çalışmaya devam eder.
- **ANA** (**2**.0.0): geriye uyumsuz değişiklik (ör. veri biçimi, API sözleşmesi, mobil uygulamanın güncellenmesini zorunlu kılan değişiklik).

Her sürümde: `package.json` → `version` güncellenir, bu dosyaya not eklenir, git'te `vX.Y.Z` etiketi atılır.
Sürüm numarası `/api/health` yanıtında ve yönetici panelinde görünür. Android uygulamasının (Google Play) `versionName` değeri buradaki sürümle aynı tutulur.

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
