# Meberra

AP sınavları ve Avrupa'da (Almanya, İtalya ve 13 ülke daha) üniversiteye hazırlık platformu. Üyelik modeli:
ücretsiz plan (her derste ilk 2 ünite, her dersten 1 deneme) ve Premium (199 ₺/ay · 1.490 ₺/yıl; havale/EFT + yönetici onayı).

## Yerelde çalıştırma

Gerekli: Node.js 22.13+ (önerilen 24 LTS). Veritabanı SQLite'tır ve Node'a dahildir; ayrı kurulum gerekmez.

Windows'ta en kolayı: **`baslat.bat`** dosyasına çift tıklayın (ilk seferde paketleri kurar, sunucuyu açar, tarayıcıyı başlatır).

```bash
npm install
npm start                      # http://localhost:3000
npm run yonetici -- --eposta sen@ornek.com --sifre "GucluSifre123"   # yönetici hesabı
npm test                       # API testleri
```

Veritabanı dosyası: `server/data/meberra.db` (git'e girmez). Yedek: `npm run yedek`.

## Sürümler

Anlamsal sürümleme (`ANA.ARA.YAMA`); her geliştirmede sürüm yükseltilir. Kurallar ve notlar: `CHANGELOG.md`.
Kod deposu: `https://github.com/Frauduzmani/meberra` (gizli).

## Yapı

| Klasör / dosya | İçerik |
|---|---|
| `server/` | Node.js sunucusu (bağımlılıksız HTTP + `node:sqlite`): hesap, oturum, senkron, Premium, yönetici, denetim kaydı |
| `server/migrations/` | Veritabanı şeması (sırayla uygulanır) |
| `server/API.md` | API sözleşmesi |
| `server/test/` | Uçtan uca API testleri (`node --test`) |
| `*.html`, `assets/`, `data/` | Site: sayfalar, stiller, istemci kodu, ders ve mevzuat verisi |
| `kaynaklar/` | PDF kaynaklar |
| `araclar/` | Geliştirici araçları (veri üreticileri, içerik denetimi `node araclar/pm-denetim.js`, birim testleri) |
| `deploy/`, `Dockerfile`, `docker-compose.yml`, `.env.example` | Canlıya alma; adım adım rehber: `CANLIYA-ALMA.md` |
| `TASKS.md` | Yapılacaklar |

## Nasıl çalışır (kısa)

Sayfalar kayıtları tarayıcı deposuna yazar (`apmeberra:*` anahtarları). Sunucu her HTML'e
`<meta name="meberra-api">` ekler; bunu gören `assets/js/app.js` (MEBERRA_SYNC) her yazımı yakalayıp
`PUT /api/state` ile sunucuya gönderir. Sunucu ilerlemeyi birleştirir (cevap başına en yeni kazanır) ve
`answers`, `wrong_answers`, `exams`, `level_tests` tablolarına ayrıştırır. Hesap ve şifre yalnızca sunucudadır
(`assets/js/auth.js` sunucu modu). Dosyadan (`file://`) açıldığında eski tarayıcı içi mod çalışır.
