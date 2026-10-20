# Meberra — Yedekten Geri Yükleme

Yedekler `DATA_DIR/yedekler/` klasöründe `meberra-YYYYMMDD-HHMM.db` adıyla durur
(son 14 tanesi). Canlı veritabanı `DATA_DIR/meberra.db` dosyasıdır; yanında çalışırken
`meberra.db-wal` ve `meberra.db-shm` dosyaları bulunur.

> **Altın kural:** Geri yüklemeden önce uygulamayı **durdurun**, mevcut veritabanının
> bir kopyasını **saklayın** ve eski `-wal` / `-shm` dosyalarını **silin**. Eski WAL
> dosyası yeni veritabanının yanında kalırsa veri karışabilir.

Geri yükleme, yedek tarihinden sonraki tüm kayıtları (yeni üyeler, ödeme onayları,
ilerleme) **kaybettirir**. Gerekirse önce kullanıcılara duyurun.

---

## A) Docker kurulumu

```bash
cd /opt/meberra

# 1) Mevcut yedekleri listele
docker compose exec meberra ls -lh /data/yedekler/

# 2) Geri yüklenecek dosyanın adını bir değişkene yaz (örnek)
YEDEK=meberra-20261020-0330.db

# 3) Uygulamayı durdur
docker compose stop meberra

# 4) Geçici bir kapsayıcı ile: mevcut veriyi sakla, yedeği yerine koy, WAL/SHM sil
docker compose run --rm --no-deps --entrypoint sh meberra -c "
  set -e
  mkdir -p /data/geri-yukleme-oncesi
  T=\$(date +%Y%m%d-%H%M)
  for f in meberra.db meberra.db-wal meberra.db-shm; do
    [ -f /data/\$f ] && cp /data/\$f /data/geri-yukleme-oncesi/\$T-\$f || true
  done
  cp /data/yedekler/$YEDEK /data/meberra.db
  rm -f /data/meberra.db-wal /data/meberra.db-shm
  node -e \"const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/data/meberra.db',{readOnly:true});console.log(d.prepare('PRAGMA integrity_check').get())\"
"
# Son satırda  integrity_check: 'ok'  görmelisiniz.

# 5) Uygulamayı başlat ve kontrol et
docker compose start meberra
curl -s http://127.0.0.1:3000/api/health
```

### Sunucu dışındaki (rclone) bir yedekten

```bash
mkdir -p /root/geri && rclone copy yedekdepo:meberra-yedekler/meberra-20261020-0330.db /root/geri/
chmod 644 /root/geri/*.db
docker compose stop meberra
docker compose run --rm --no-deps -v /root/geri:/geri:ro --entrypoint sh meberra -c "
  cp /geri/meberra-20261020-0330.db /data/yedekler/
"
```
Ardından yukarıdaki 2–5. adımları uygulayın.

---

## B) Docker'sız (systemd) kurulum

```bash
cd /opt/meberra/server/data
ls -lh yedekler/
YEDEK=meberra-20261020-0330.db

sudo systemctl stop meberra

T=$(date +%Y%m%d-%H%M)
sudo -u meberra mkdir -p geri-yukleme-oncesi
for f in meberra.db meberra.db-wal meberra.db-shm; do
  [ -f "$f" ] && sudo -u meberra cp "$f" "geri-yukleme-oncesi/$T-$f"
done
sudo -u meberra cp "yedekler/$YEDEK" meberra.db
sudo rm -f meberra.db-wal meberra.db-shm

# Bütünlük kontrolü
sudo -u meberra node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/opt/meberra/server/data/meberra.db',{readOnly:true});console.log(d.prepare('PRAGMA integrity_check').get())"

sudo systemctl start meberra
curl -s http://127.0.0.1:3000/api/health
```

---

## C) Yerel bilgisayarda (Windows / macOS) bir yedeği incelemek

Yedek dosyası sıradan bir SQLite dosyasıdır. Ücretsiz **DB Browser for SQLite**
(sqlitebrowser.org) ile açıp tablolara bakabilirsiniz. Canlı dosyayı değil,
her zaman bir **kopyasını** açın.

---

## D) Geri alma (geri yükleme hatalıysa)

`geri-yukleme-oncesi/` klasöründe, geri yüklemeden hemen önceki dosyalar
`<tarih>-meberra.db`, `-wal`, `-shm` adlarıyla durur. Uygulamayı durdurup bu üç
dosyayı eski adlarıyla (`meberra.db`, `meberra.db-wal`, `meberra.db-shm`) geri
kopyalayın ve uygulamayı başlatın.

## E) Düzenli deneme

Ayda bir, yedeklerden birini **ayrı bir bilgisayarda** veya yerel kurulumda
(`DATA_DIR` farklı bir klasör olacak şekilde) açıp giriş yapılabildiğini kontrol edin.
Hiç denenmemiş yedek, yedek sayılmaz.
