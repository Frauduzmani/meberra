# Yasal metinlere eklenecekler (hukukçu kontrolü için)

Yasal sayfalar (`kvkk.html`, `gizlilik.html`, `cerez.html`, `kosullar.html`, `mesafeli-satis.html`) taslaktır. Aşağıdaki maddeler
yeni özelliklerden doğdu; hukukçu onayıyla ilgili sayfaya işlenmeli.

## 1.3.0 — Güvenlik kayıtları (işlendi)
- Son giriş IP adresi, oturum IP adresleri ve son görülme zamanı güvenlik amacıyla tutulur, 90 gün sonra silinir; günlük giriş sayıları 400 gün saklanır; hesap verisi indirme dosyasına dahildir.

## 1.6.0 — Ölçüm, deneme süresi, indirim kodu, davet
- **Çerez:** Birinci taraf `mb_anon` çerezi (rastgele ziyaretçi kimliği, 400 gün) ve cihazdaki uygulama önbelleği: kullanım ölçümü ve ilk ziyaret kaynağı (utm).
- **Gizlilik / KVKK:** Olay kayıtları (sayfa, olay adı, utm; IP ve tarayıcı bilgisi yok) meşru menfaat kapsamında 400 gün tutulur; profilden kapatılabilir; tarayıcının "izleme" (DNT/GPC) tercihine uyulur.
- **Gizlilik / KVKK:** Deneme süresi ve davet ödülünün kötüye kullanılmasını önlemek için e-posta adresinin tek yönlü özeti hesap silindikten sonra da saklanır.
- **Koşullar / Mesafeli satış:** Ücretsiz Premium denemesi 7 gündür ve kişi başına bir kezdir; otomatik ücretlendirme yoktur. Bitişten 2 gün önce ve bitişte bilgilendirme yapılır.
- **Koşullar:** İndirim kodu kuralları (süre, plan, kullanım sınırı) ve davet ödülü kuralları (davet edilen seviye testini bitirince iki tarafa 7 gün; davet edene yılda en çok 10 ödül; kötüye kullanımda ödül geri alınabilir).

## 1.7.0 — Veli paneli
- **KVKK / Gizlilik:** İşlenen veli verileri (ad, e-posta, şifre özeti, onay zamanı, bağlantı ve rapor tercihi); amaç: öğrencinin toplu ilerlemesini veliye göstermek.
- **Paylaşılan:** tahmini çalışma süresi, soru sayıları, doğruluk, seri, son etkinlik, deneme sonuçları, Premium durumu. **Paylaşılmayan:** soru–cevap yazışmaları, notlar, cevap ayrıntıları.
- Öğrenci bağlantıyı istediği an kaldırabilir; iki hesaptan biri silinince bağlantı ve davet bilgileri silinir. Velinin verdiği ödeme bildirimi öğrencinin hesabına bağlanır.
- **Koşullar:** Veli hesabı yalnızca davetle açılır ve yalnızca görüntüleme amaçlıdır.

## Genel
- Hatırlatma e-postaları ve bildirimler için İYS (ticari elektronik ileti) gerekip gerekmediği.
- Google Play "Veri güvenliği" formu ve Aileler politikası (kullanıcıların çoğu reşit değil).
