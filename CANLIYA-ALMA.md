# Meberra — Canlıya Alma Rehberi

Bu rehber, Meberra'yı kendi alan adınızda (örnek: **meberra.com**) yayına almanız için
adım adım hazırlanmıştır. Komutlar kopyala-yapıştır yapılabilir. `meberra.com` gördüğünüz
her yere kendi alan adınızı yazın.

**İçindekiler**

- A) Ön koşullar
- B) Yol 1 — Docker ile kurulum (önerilen)
- C) Yol 2 — Docker'sız (düz Node.js) kurulum
- D) Kendi bilgisayarınızda çalıştırma (Windows / macOS)
- E) Yayın sonrası kontrol listesi
- F) Sorun giderme

İlgili dosyalar: `Dockerfile`, `docker-compose.yml`, `.env.example`,
`deploy/nginx-meberra.conf`, `deploy/meberra.service`, `deploy/yedek-cron.txt`,
`deploy/geri-yukleme.md`.

---

## A) Ön koşullar

1. **Alan adı** (domain): örn. `meberra.com`. Herhangi bir kayıt firmasından alınabilir.
2. **Linux sanal sunucu (VPS):** **Ubuntu 24.04 LTS**.
   - Başlangıç için **1 vCPU / 1–2 GB RAM / 20 GB disk** yeterlidir
     (PDF kaynakları ~65 MB, veritabanı küçüktür).
   - Örnek sağlayıcılar: Hetzner (CX22), DigitalOcean (Basic Droplet), veya yurt içi
     bir sağlayıcı (verinin Türkiye'de tutulması KVKK açısından tercih edilebilir).
   - Kurulumda size bir **IP adresi** (örn. `203.0.113.10`) ve `root` şifresi / SSH
     anahtarı verilir.
3. **DNS kaydı:** Alan adı panelinizde iki kayıt açın:

   | Tür | Ad    | Değer          |
   |-----|-------|----------------|
   | A   | `@`   | sunucu IP'si   |
   | A   | `www` | sunucu IP'si   |

   Yayılması birkaç dakika–birkaç saat sürebilir. Kontrol: `ping meberra.com`
   sunucu IP'sini göstermeli.
4. **Sunucuya bağlanma:** Windows'ta PowerShell, macOS'ta Terminal:
   ```bash
   ssh root@203.0.113.10
   ```
5. **İlk güvenlik ayarları (sunucuda):**
   ```bash
   apt update && apt upgrade -y
   timedatectl set-timezone Europe/Istanbul
   apt install -y ufw git curl
   ufw allow OpenSSH
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw --force enable
   ```

---

## B) Yol 1 — Docker ile kurulum (önerilen)

### B1. Docker'ı kurun
```bash
curl -fsSL https://get.docker.com | sh
docker --version
docker compose version
```

### B2. Projeyi sunucuya alın
Git deposu varsa:
```bash
git clone <DEPO-ADRESİ> /opt/meberra
cd /opt/meberra
```
Git yoksa, kendi bilgisayarınızdan proje klasörünü kopyalayın (PowerShell / Terminal'de,
proje klasörünün **bir üstündeyken**):
```bash
scp -r MEBERRA root@203.0.113.10:/opt/meberra
```
> `arsiv/`, `sunum/`, `node_modules/` gibi büyük klasörleri kopyalamanıza gerek yok;
> Docker imajına zaten alınmazlar (`.dockerignore`). `kaynaklar/` klasörü **gereklidir**.

### B3. `.env` dosyasını oluşturun
```bash
cd /opt/meberra
cp .env.example .env
nano .env
```
En az şunları doldurun: `BASE_URL`, `SMTP_*` (sonra da olabilir), `BANKA_ADI`, `IBAN`,
`HESAP_SAHIBI`, `DESTEK_EPOSTA`. `DATA_DIR=/data` olarak kalsın.
Kaydet: `Ctrl+O`, `Enter`, çık: `Ctrl+X`.
```bash
chmod 600 .env
```

### B4. Uygulamayı başlatın
```bash
docker compose up -d --build
docker compose ps          # STATUS sütununda "healthy" görünmeli (≈30 sn)
docker compose logs -f     # canlı günlük; çıkmak için Ctrl+C
curl -s http://127.0.0.1:3000/api/health
```

### B5. Yönetici hesabı oluşturun
```bash
docker compose exec meberra node server/cli.js yonetici-olustur --eposta siz@ornek.com --sifre 'GucluBirSifre!2026'
```
(`.env` içine `ADMIN_EPOSTA` / `ADMIN_SIFRE` yazdıysanız ilk açılışta hesap otomatik
oluşur. Giriş yaptıktan sonra bu iki satırı `.env`'den silin ve
`docker compose up -d` ile yeniden başlatın.)

### B6. nginx + ücretsiz SSL sertifikası (Let's Encrypt)
```bash
apt install -y nginx certbot python3-certbot-nginx
mkdir -p /var/www/certbot

# 1) Önce sertifikayı alın (DNS kaydı sunucuyu göstermeli!)
certbot certonly --nginx -d meberra.com -d www.meberra.com --agree-tos -m siz@ornek.com --no-eff-email

# 2) Meberra nginx yapılandırmasını yerleştirin
cp /opt/meberra/deploy/nginx-meberra.conf /etc/nginx/sites-available/meberra
ln -sf /etc/nginx/sites-available/meberra /etc/nginx/sites-enabled/meberra
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 3) Otomatik yenilemeyi test edin
certbot renew --dry-run
```
> Alan adınız `meberra.com` değilse, `nginx-meberra.conf` içindeki tüm `meberra.com`
> geçen yerleri değiştirin: `sed -i 's/meberra\.com/sizinalan.com/g' /etc/nginx/sites-available/meberra`

### B7. Doğrulayın
```bash
curl -s https://meberra.com/api/health
```
Tarayıcıda `https://meberra.com` açılmalı, adres çubuğunda kilit simgesi görünmeli.

### B8. Yedeklemeyi kurun
```bash
crontab -e
```
En alta ekleyin (her gece 03:30):
```
30 3 * * * cd /opt/meberra && /usr/bin/docker compose exec -T meberra node server/cli.js yedek >> /var/log/meberra-yedek.log 2>&1
```
Hemen bir kez elle deneyin:
```bash
docker compose exec meberra node server/cli.js yedek
docker compose exec meberra ls -lh /data/yedekler/
```
Sunucu dışına kopya için `deploy/yedek-cron.txt` dosyasındaki rclone örneğine bakın.

---

## C) Yol 2 — Docker'sız (düz Node.js) kurulum

### C1. Node.js 24 LTS kurun (NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
node --version     # v24.x.x olmalı
```
> nvm de kullanılabilir (`nvm install 24`), ancak systemd birimindeki `/usr/bin/node`
> yolunu `which node` çıktısıyla değiştirmeniz gerekir.

### C2. Kullanıcı ve klasörler
```bash
useradd --system --home /opt/meberra --shell /usr/sbin/nologin meberra
# projeyi /opt/meberra'ya alın (git clone veya scp, bkz. B2)
cd /opt/meberra
mkdir -p server/data
chown -R meberra:meberra /opt/meberra
```

### C3. Bağımlılıklar ve `.env`
```bash
cd /opt/meberra
sudo -u meberra npm ci --omit=dev || sudo -u meberra npm install --omit=dev
cp .env.example .env
nano .env
```
Docker'sız kurulumda `.env` içinde **şunları değiştirin**:
```
DATA_DIR=/opt/meberra/server/data
HOST=127.0.0.1
```
```bash
chown meberra:meberra .env && chmod 600 .env
```

### C4. systemd servisi
```bash
cp /opt/meberra/deploy/meberra.service /etc/systemd/system/meberra.service
systemctl daemon-reload
systemctl enable --now meberra
systemctl status meberra
journalctl -u meberra -f        # günlük; Ctrl+C ile çık
curl -s http://127.0.0.1:3000/api/health
```

### C5. Yönetici hesabı
```bash
cd /opt/meberra
sudo -u meberra bash -c 'set -a; . ./.env; set +a; node server/cli.js yonetici-olustur --eposta siz@ornek.com --sifre "GucluBirSifre!2026"'
```

### C6. nginx + SSL
B6 adımının aynısı.

### C7. Yedekleme
`deploy/yedek-cron.txt` içindeki "DOCKER'SIZ" satırını `sudo crontab -u meberra -e`
ile ekleyin.

---

## D) Kendi bilgisayarınızda çalıştırma (Windows / macOS)

1. **Node.js 24 LTS** kurun: https://nodejs.org (LTS sürümü, "24.x").
2. Proje klasöründe terminal açın (Windows: klasörde boş yere Shift+Sağ tık →
   "Terminalde aç").
3. ```bash
   npm install
   npm start
   ```
4. Tarayıcıda açın: **http://localhost:3000**
5. Yönetici hesabı (ikinci bir terminalde, aynı klasörde):
   ```bash
   node server/cli.js yonetici-olustur --eposta siz@ornek.com --sifre GucluBirSifre2026
   ```
6. Veriler `server/data/` klasörüne yazılır.

Notlar:
- Ekranda `ExperimentalWarning: SQLite is an experimental feature` benzeri bir uyarı
  çıkabilir. **Zararsızdır**, yok sayabilirsiniz.
- Yerelde `.env` kullanmak isterseniz `COOKIE_SECURE=0` yapın (http://localhost'ta
  güvenli çerez çalışmaz, giriş yapılamaz) ve şöyle başlatın:
  `node --env-file=.env server/index.js`
- Durdurmak için terminalde `Ctrl+C`.

---

## E) Yayın sonrası kontrol listesi

- [ ] **Yasal metinler:** `kvkk.html` ve diğer yasal sayfalardaki `[ŞİRKET ÜNVANI]`,
      `[ADRES]`, `[VERGİ NO]` gibi köşeli parantezli yer tutucuları doldurun.
      Aramak için: `grep -rn "\[ŞİRKET" *.html`. Mümkünse bir hukukçuya okutun.
- [ ] **Banka bilgileri:** `.env` → `BANKA_ADI`, `IBAN`, `HESAP_SAHIBI`; ödeme sayfasında
      doğru göründüğünü kontrol edin.
- [ ] **Fiyatlar:** `FIYAT_AYLIK`, `FIYAT_YILLIK`.
- [ ] **E-posta (SMTP):** Brevo, Mailgun veya Google Workspace SMTP bilgilerini girin.
      Alan adınız için sağlayıcının verdiği **SPF / DKIM** DNS kayıtlarını ekleyin;
      yoksa e-postalar spam'e düşer. SMTP boşsa e-postalar yalnızca veritabanındaki
      giden kutusunda tutulur.
- [ ] `.env` değiştikten sonra yeniden başlatın: Docker `docker compose up -d`,
      systemd `systemctl restart meberra`.
- [ ] **Uçtan uca test:** yeni bir hesapla kayıt olun → e-posta geldi mi → Premium talebi
      oluşturun → yönetici panelinde talebi onaylayın → hesapta Premium açıldı mı?
- [ ] **İlk yönetici şifresi:** `ADMIN_EPOSTA` / `ADMIN_SIFRE` satırlarını `.env`'den silin.
- [ ] **Yedekler:** gece yedeği çalışıyor mu (`ls` ile kontrol), sunucu dışı kopya var mı,
      ve **bir kez geri yükleme denemesi** yapın (`deploy/geri-yukleme.md`).
- [ ] **İzleme:** UptimeRobot (ücretsiz) → yeni "HTTP(s)" monitörü →
      `https://meberra.com/api/health`, 5 dakikada bir; e-posta uyarısı açın.
- [ ] **Sistem logları:** Yönetici paneli → **Sistem** sekmesi. Sunucu/tarayıcı hataları, uyarılar
      (yavaş istek, çok sayıda 401/403/429, e-posta ve push hataları) ve sağlık kartları (çalışma süresi,
      veritabanı boyutu, son yedek — 36 saatten eskiyse uyarı, e-posta kuyruğu, zamanlayıcı) burada görünür.
      Özet sekmesinde kırmızı "N yeni hata" kartı çıkarsa inceleyip "Çözüldü" ile kapatın (not yazılabilir,
      denetim kaydına geçer). Saklama: bilgi 7 gün, uyarı/hata 90 gün (zamanlayıcı açık olmalı).
      Loglar ayrıca konsola yazılır: `docker compose logs -f meberra` / `journalctl -u meberra -f`.
      `MEBERRA_TEST_ROTALARI` değişkenini canlıda **tanımlamayın** (yalnızca test için 500 üreten uç nokta açar).
- [ ] **Güncelleme yöntemi** (yeni sürüm geldiğinde):
      ```bash
      cd /opt/meberra
      docker compose exec meberra node server/cli.js yedek   # önce yedek!
      git pull
      docker compose up -d --build
      docker image prune -f
      ```
      Docker'sız: `git pull && sudo -u meberra npm ci --omit=dev && systemctl restart meberra`
- [ ] **Sunucu güncellemeleri:** `apt install -y unattended-upgrades` (otomatik güvenlik
      yamaları).

---

## E2) Bildirimler, hatırlatmalar ve uygulama (PWA)

- [ ] **Tarayıcı bildirimleri (web push) yalnızca HTTPS'te çalışır** (yerelde `http://localhost` istisnadır).
      Service worker kökte `/sw.js` olarak sunulur; nginx'te ek ayar gerekmez.
- [ ] **VAPID anahtarları:** `.env` içindeki `VAPID_PUBLIC` / `VAPID_PRIVATE` boşsa uygulama ilk açılışta
      anahtar üretir ve `DATA_DIR/vapid.json` dosyasına yazar. Bu dosya **yedeklenmeli** ve korunmalıdır: kaybolursa
      tüm tarayıcı abonelikleri geçersiz olur (öğrencilerin bildirimi yeniden açması gerekir). İsterseniz anahtarları
      `npx web-push generate-vapid-keys` ile üretip `.env`'e yazın; `VAPID_SUBJECT=mailto:destek@alanadiniz.com`.
- [ ] **iPhone/iPad:** iOS 16.4 ve üzeri gerekir ve bildirimler yalnızca site **Ana Ekrana Ekle** ile uygulama gibi
      eklendiğinde çalışır (Safari sekmesinde çalışmaz). Öğrencilere bunu anlatan kısa bir not ekleyin.
- [ ] **Zamanlayıcı:** Uygulama 10 dakikada bir hatırlatmaları, pazar 18:00 veli raporlarını ve haftalık lig devrini
      işler (`ZAMANLAYICI=0` ile kapatılır). Birden fazla uygulama örneği çalıştırmayın: hatırlatma kaydı (reminder_log)
      tekrar gönderimi engeller ama tek örnek en sağlıklısıdır.
- [ ] **Kurallar (sahibinin kararı):** Tüm e-posta/push tercihleri varsayılan **kapalıdır** (açık rıza). Günde en fazla
      1 hatırlatma; 22:00–08:00 (İstanbul) arası hatırlatma/push gönderilmez; her e-postada tek tıkla iptal bağlantısı
      vardır. Veli raporu yalnızca veli e-postadaki onay bağlantısına tıkladıktan sonra gönderilir.
- [ ] **İYS / ticari ileti:** Çalışma hatırlatmaları, soru yanıtı ve veli raporu kullanıcının istediği **hizmet
      iletileri** olarak tasarlandı; kampanya/indirim/tanıtım içeren duyurular ise 6563 sayılı Kanun kapsamında
      **ticari elektronik ileti** sayılır ve İleti Yönetim Sistemi (İYS) kaydı + onay gerektirir. Duyuru sekmesini
      reklam için kullanmadan önce ve hatırlatma metinlerinin hizmet iletisi sayılıp sayılmadığı konusunda
      **hukuki görüş alın**. Kullanıcıların çoğu reşit olmadığından veli onayı süreçlerini de avukatınızla gözden geçirin.

## E3) Google Play (TWA) için

Meberra, Google Play'e **Trusted Web Activity (TWA)** olarak, yani siteyi tam ekran açan ince bir Android kabuğu
olarak konabilir. Uygulama içeriği her zaman canlı siteden gelir; mağazaya yeni sürüm göndermeden site güncellenir.

- [ ] **Gereksinimler:** geçerli sertifikalı **HTTPS alan adı** (ör. `https://meberra.com`), `manifest.webmanifest`
      (ad, `start_url: /bugun`, `id: /bugun`, `display: standalone`, 192/512 ve maskable ikonlar — hazır), kökte `sw.js` (hazır), Lighthouse
      PWA denetiminin geçmesi. Google Play geliştirici hesabı (tek seferlik ücret) ve Java 17 + Android SDK
      (Bubblewrap ilk çalıştırmada indirmeyi önerir).
- [ ] **Bubblewrap CLI** (bilgisayarınızda, sunucuda değil):
      ```bash
      npm i -g @bubblewrap/cli
      bubblewrap init --manifest https://meberra.com/manifest.webmanifest   # paket adı ör. com.meberra.app
      bubblewrap build                                                      # app-release-bundle.aab + imzalı apk
      ```
      `init` sırasında oluşturulan **imzalama anahtarını (keystore) ve şifresini kaybetmeyin**; güncellemeler aynı
      anahtarla imzalanmalıdır. Play Console'a `.aab` dosyasını yükleyin; Play App Signing açıksa Google ayrıca
      kendi anahtarıyla imzalar.
- [ ] **Digital Asset Links (adres çubuğunu gizlemek için zorunlu):** `.env` dosyasına ekleyin ve yeniden başlatın:
      ```
      ANDROID_PAKET_ADI=com.meberra.app
      ANDROID_SHA256=AA:BB:...:FF          # birden çok parmak izi virgülle (yükleme anahtarı + Play App Signing anahtarı)
      ```
      Parmak izleri: `keytool -list -v -keystore android.keystore` ve Play Console → *Kurulum → Uygulama bütünlüğü →
      Uygulama imzalama*. Sunucu `https://alanadiniz/.well-known/assetlinks.json` adresini `application/json` olarak
      sunar (tanımlı değilse 404). Alternatif: proje köküne `.well-known/assetlinks.json` dosyası koymak. Doğrulama:
      `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://meberra.com&relation=delegate_permission/common.handle_all_urls`.
      Eşleşme yoksa uygulama üstte adres çubuğuyla (Custom Tab) açılır.
- [ ] **Bildirimler:** Mevcut **web push** TWA içinde de çalışır (Chrome'un bildirim izni Android uygulamasına
      devredilir; Android 13+ cihazda uygulama bildirim izni ister). Ek sunucu ayarı gerekmez; VAPID anahtarlarını
      koruyun (E2).
- [ ] **Mağaza metinleri:** Gizlilik politikası adresi (`/gizlilik`), veri güvenliği formu (toplanan veriler:
      e-posta, ad, çalışma ilerlemesi, IP adresi — 90 gün), hedef yaş grubu (13–18 yaş öğrenciler varsa **Aileler
      politikası** gereklerini avukatınızla gözden geçirin).
- [ ] **Bakım modu:** Yönetici paneli → Sistem → Bakım modu ile site (ve TWA uygulaması) geçici olarak bakım sayfasına
      alınabilir; yönetici girişi (`/giris`) ve paneli açık kalır.
- [ ] **1.8.0 temiz adresler:** 1.8.0'dan önce Bubblewrap ile paket oluşturduysanız `twa-manifest.json` içindeki
      `startUrl` değerini `/bugun` yapıp yeniden derleyin (eski `/index.html` de 301 ile `/bugun`'a gider, yani acil değil).
      Yönetici paneli adresi **`/yonetim`**'dir (yalnızca yönetici oturumunda açılır; diğer herkes 404 görür, robots.txt'te
      bilerek yazılmaz). Eski `/x.html` adresleri ve yer imleri 301 ile yeni adreslerine gider. Adres tablosu:
      `assets/js/adresler.js` (yönetim adresi yalnızca `server/adresler.js`).

---

## F) Sorun giderme

| Belirti | Olası neden | Çözüm |
|---|---|---|
| `https://` açılmıyor, `http://` açılıyor | Sertifika alınmamış / nginx yüklenmemiş | `nginx -t`, `certbot certificates`, B6'yı tekrarlayın |
| certbot "Challenge failed" | DNS henüz sunucuyu göstermiyor veya 80 portu kapalı | `ping meberra.com`, `ufw status` (80 açık olmalı) |
| **502 Bad Gateway** | Uygulama çalışmıyor | Docker: `docker compose ps`, `docker compose logs --tail=100`; systemd: `journalctl -u meberra -n 100` |
| Kapsayıcı sürekli yeniden başlıyor | `.env` hatası veya Node sürümü | Günlüğe bakın; `docker compose config` ile `.env` okunuyor mu kontrol edin |
| `node:sqlite` bulunamadı / `ERR_UNKNOWN_BUILTIN_MODULE` | Node.js 24'ten eski | `node --version` → 24 kurun (C1) |
| `ExperimentalWarning: SQLite ...` | Normal | Zararsız, işlem gerekmez |
| Giriş yapılıyor ama hemen çıkış oluyor | `COOKIE_SECURE=1` iken http ile erişim, veya `TRUST_PROXY` eksik | Canlıda https kullanın ve `TRUST_PROXY=1`; yerelde `COOKIE_SECURE=0` |
| E-postalar gitmiyor | SMTP bilgisi yanlış / boş | Günlükte SMTP hatası; port 587 (STARTTLS) veya 465 deneyin; bazı VPS'ler 25/465'i kapatır |
| E-postalar spam'e düşüyor | SPF/DKIM yok | Sağlayıcının DNS kayıtlarını ekleyin, `SMTP_FROM` alan adınızda olsun |
| `SQLITE_BUSY` / `database is locked` | Aynı veri klasörünü iki uygulama kullanıyor | Yalnızca bir örnek çalıştırın; Docker ve systemd'yi aynı anda açmayın |
| `EACCES` / `SQLITE_CANTOPEN` | Veri klasörü yazılamıyor | Docker: volume'u silmeden `docker compose down && docker compose up -d`; systemd: `chown -R meberra:meberra /opt/meberra/server/data` |
| Dosya yüklerken `413 Request Entity Too Large` | nginx sınırı | `client_max_body_size` (varsayılan 10m) |
| Güncellemeden sonra eski görünüm | Tarayıcı önbelleği | `Ctrl+F5`; CSS/JS 1 saat önbellekte tutulur |
| `docker compose exec` "service is not running" | Kapsayıcı kapalı | `docker compose up -d` |
| Disk doldu | Günlükler / eski imajlar | `docker image prune -af`, `df -h`, `journalctl --vacuum-time=14d` |

**Asla yapmayın:** `docker compose down -v` (`-v` veritabanı volume'unu **siler**).
