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

## Testler

CI: `.github/workflows/ci.yml` (GitHub Actions; `master`a push/PR ve her pazartesi). Gizli anahtar gerekmez.

```bash
npm test                       # sunucu/API testleri (server/test/*.test.js)
npm run test:birim             # tüm araclar/testler/*-birim-test.js
node araclar/pm-denetim.js     # içerik denetimi (0 sorun olmalı)
npx playwright install chromium   # bir kez: e2e tarayıcısı
npm run test:e2e               # tarayıcı uçtan uca testleri (e2e/)
```

`e2e/` (@playwright/test): sunucu boş bir portta, geçici `DATA_DIR`, `ZAMANLAYICI=0`, `NODE_ENV=test` ve her
çalıştırmada rastgele üretilen yönetici kimliğiyle kendiliğinden başlar (`e2e/kurulum.js`). Projeler: `chromium`
(masaüstü) ve `mobil` (390×844). Her test konsol hatası olmadığını denetler. Chromium indirilemiyorsa kurulu
tarayıcı: `E2E_KANAL=chrome npm run test:e2e` (ya da `msedge`). Rapor: `playwright-report/` (`npx playwright show-report`).
Eski Playwright betikleri `araclar/testler/eski/` altında arşivdir (çalıştırılmaz).

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
(`assets/js/auth.js` sunucu modu). 1.8.0'dan beri sayfalar temiz adreslerle sunulur (`/bugun`, `/ders/calculus`, `/ulkem`…;
tablo `assets/js/adresler.js`, eski `/x.html` adresleri 301 ile yönlenir) ve bağlantılar kök-mutlaktır; bu yüzden siteyi
dosyadan (`file://`) açmak artık desteklenmez — `npm start` ile açın.
