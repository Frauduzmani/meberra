# Meberra API sözleşmesi (v1)

Sunucu: `node server/index.js` (Node.js 22.5+; yerleşik `node:sqlite`). Varsayılan port `3000`.
Tüm uç noktalar JSON alır/verir (`Content-Type: application/json`). Oturum, `meberra_sid` adlı
HttpOnly çerezle taşınır (kayan süre: günde bir kez uzar ve çerez yeni `Max-Age` ile yeniden yazılır). Değiştiren isteklerde (POST/PUT) `X-Meberra: 1` başlığı zorunludur (CSRF koruması).

Hata biçimi: `{ "ok": false, "error": "Türkçe mesaj", "errors": { "alan": "mesaj" } }` + uygun HTTP kodu
(400 doğrulama, 401 oturum yok, 402 ücretsiz hak bitti, 403 yetki yok, 404, 409 çakışma, 413 çok büyük, 429 çok fazla deneme).
Bazı hatalar ek alan taşır (ör. 402: `kalan`, `premiumGerekli`, `hak`).
Başarı: `{ "ok": true, ... }`.

## Genel
- `GET /api/health` → `{ ok, surum (package.json), zaman, bakim: bool }`
- `GET /api/public/config` → `{ ok, marka, planlar:[{id,ad,fiyat,donem,aciklama,oneCikan}], para, ucretsiz:{uniteSayisi,dersDenemesi}, banka:{banka,iban,hesapSahibi,aciklamaNotu}, destekEposta }`

## Hesap
- `POST /api/auth/register` `{ ad, soyad, eposta, sifre, sifre2, kosullar:true, kvkk:true, veliOnay?:bool }`
  → `{ ok, user, profile:null, uyelik, state:{} }` + çerez
- `POST /api/auth/login` `{ kimlik, sifre }` (kimlik: e-posta ya da kullanıcı adı) → `{ ok, user, profile, uyelik, state }`
- `POST /api/auth/logout` → `{ ok }`
- `GET /api/me` → `{ ok, user, profile, uyelik }` (401: oturum yok)
- `PUT /api/profile` `{ profile }` → `{ ok, profile }`
- `POST /api/auth/password` `{ eski, yeni, yeni2 }` → bu oturum dışındaki tüm oturumlar ve açık şifre sıfırlama bağlantıları kapanır
- `POST /api/auth/forgot` `{ eposta }` → her zaman `{ ok:true }` (e-posta varsa sıfırlama bağlantısı gider)
- `POST /api/auth/reset` `{ token, yeni, yeni2 }` → tüm oturumlar ve diğer sıfırlama bağlantıları kapanır
- `GET /api/account/export` → kullanıcının tüm verisi (KVKK veri taşınabilirliği)
- `POST /api/account/delete` `{ sifre }` → hesap silinir: öğrenci verisi silinir; bekleyen ödeme bildirimi `iptal`, aktif Premium dönemi sona erer; ödeme/abonelik kayıtları, denetim kaydı (IP/tarayıcı/e-posta silinir) ve giden e-postalar anonimleştirilerek saklanır

`user` = `{ id, ad, soyad, kullaniciAdi, eposta, rol: "ogrenci"|"yonetici", olusturma }`
`uyelik` = `{ premium: bool, plan: "aylik"|"yillik"|"ozel"|null, bitis: ISO|null, bekleyenTalep: {id, plan, olusturma}|null }`

## Öğrenci verisi (tarayıcı deposu senkronu)
- `GET /api/state` → `{ ok, keys: { "<anahtar>": { deger: "<ham JSON dizesi>", guncelleme: ISO } } }`
- `PUT /api/state` `{ degisiklikler: { "<anahtar>": "<ham JSON dizesi>" | null } }`
  → `{ ok, birlesen: { "<anahtar>": "<sunucuda birleşmiş ham dize>" }, reddedilen: ["<anahtar>"] }`
  (`birlesen`: yalnızca gönderilenden farklı sonuçlananlar; `reddedilen`: geçersiz ad/JSON, 2 MB üstü ya da kullanıcı başına 60 anahtar sınırı)
  Yalnızca `apmeberra:` ile başlayan anahtarlar kabul edilir. Sunucuda birleştirilenler:
  `apmeberra:quiz:v1` (cevap başına en yeni kazanır), `apmeberra:errors:v1` (kayıt başına birleşim),
  `apmeberra:deneme:v1` (geçmiş id ile birleşir, en yeni 50; yarım deneme son yazana ait, bitmişse geri gelmez),
  `apmeberra:seviye:v1` (raporlar id ile birleşir, en yeni 5; kontrol işaretinde yeni damga kazanır),
  `apmeberra:deneme-hak:v1` (`{ "<sayfa>": { t, kod } }` birleşimi, sayfa başına en erken `t`; hiçbir kayıt silinmez,
  `null` da silmez). Diğerleri son yazan kazanır.
  Birleştirilen bir anahtar `null` ile silinince sunucu silme izi (`state_tombstones`) yazar ve boş değer saklar:
  diğer cihazlar çekince boşalır; eski cihazdan gelen, silme anından önceki kayıtlar atılır (geri gelmez). Sunucu, ilerlemeyi
  `answers`, `wrong_answers`, `exams`, `level_tests` tablolarına da ayrıştırır.

## Premium (elle onay; havale/EFT)
- `GET /api/premium` → `{ ok, uyelik, talepler:[...] }`
- `POST /api/premium/talep` `{ plan: "aylik"|"yillik", odeyenAd, aciklama?, kupon? }` (1.6.0: `kupon` verilirse sunucu yeniden doğrular; `tutar` indirimli tutardır; geçersiz kod → 400 `errors.kupon`) → `{ ok, talep:{id, plan, tutar, durum}, uyelik }` (409: zaten bekleyen var)
- `POST /api/premium/talep/iptal` → öğrencinin bekleyen bildirimi `iptal` olur → `{ ok, talep:{id, plan, durum:"iptal"}, uyelik }` (409: bekleyen yok)

## Yönetici (rol: yonetici)
- `GET /api/admin/stats` → `{ ok, kullanici:{toplam, son7gun, aktif7gun}, premium:{aktif, aylik, yillik, ozel}, talep:{bekleyen}, soru:{bekleyen, son7gun}, cevap:{toplam, son7gun}, gelirTahmini:{aylikTL} }`
  (`gelirTahmini`: yalnızca onaylı ödeme talebinden açılmış, hesabı aktif kullanıcıların şu anki dönemleri; ödenen tutar ÷ dönem günü × 30)
- `GET /api/admin/users?q=&sayfa=1&premium=1` → `{ ok, toplam, sayfa, sayfaBoyu, kullanicilar:[{id, ad, soyad, eposta, rol, olusturma, sonGiris, durum, premium, plan, bitis, bekleyenTalep: bool, cevapSayisi}] }`
- `GET /api/admin/users/:id` → `{ ok, user, profile, uyelik, abonelikler:[...], talepler:[...], istatistik:{cevap, dogru, yanlisAcik, deneme, sonEtkinlik}, dersler:[{sayfa, cevap, dogru}] }`
- `POST /api/admin/users/:id/premium` `{ plan?, gun?, not? }` → Premium verir; plan ya da gun gerekli (gun: 1–3650 tam sayı; yoksa plana göre 30/365). Mevcut dönemin sonuna eklenir
- `POST /api/admin/users/:id/premium/iptal` `{ not? }`
- `POST /api/admin/users/:id/durum` `{ durum: "aktif"|"askida" }`
- `GET /api/admin/talepler?durum=bekliyor` → `{ ok, talepler:[{id, kullanici:{id,ad,soyad,eposta}, plan, tutar, odeyenAd, aciklama, durum, olusturma, islemZamani, islemNotu}] }` (durum: bekliyor|onaylandi|reddedildi|iptal; başka değer: hepsi)
- `POST /api/admin/talepler/:id` `{ islem: "onayla"|"reddet", not? }` → `{ ok, abonelik }` (409: talep bekliyor değil ya da onayda hesap aktif değil)
- `GET /api/admin/audit?kullanici=&eylem=&sayfa=1` → `{ ok, toplam, sayfa, sayfaBoyu, kayitlar:[{id, zaman, kullanici, yapan, eylem, varlik, varlikId, ip, ayrinti}] }`

## Zaman kuralları (ortak)
Tüm takvim hesapları **Europe/Istanbul** saatine göredir: "gün" `YYYY-MM-DD`, "ay" takvim ayı, "hafta" ISO hafta
`YYYY-Www` (pazartesi 00:00 – pazar 23:59). **Sessiz saatler 22:00–08:00**: bu aralıkta hatırlatma ve push gönderilmez
(uygulama içi bildirim yine oluşur). Sunucunun döndürdüğü zamanlar ISO-8601 UTC'dir.

## Soru-cevap (öğrenci → Meberra ekibi)
Kota: ücretsiz planda **takvim ayı başına 3 yeni soru** (`UCRETSIZ_SORU_HAKKI`); Premium ve yöneticiler sınırsız (Premium
denetimi `uyelik.premium` ile aynı). Takip mesajları hak tüketmez. Metin en fazla **2000** karakter (satır sonları korunur),
`baglam` JSON nesnesi en fazla **8000** karakter (dizeleştirilmiş). Hız sınırı: kullanıcı başına saatte 20 mesaj (soru + takip) → 429.
Soru başına öğrencinin en fazla ~20 takip mesajı (sonra 409 "yeni soru aç").

`hak` = `{ sinirsiz: bool, limit: 3|null, kullanilan: n, kalan: n|null, donem: "YYYY-MM" }`
`soru` (öğrenci görünümü) = `{ id, sayfa, soruRef, baglam, metin, durum: "bekliyor"|"cevaplandi"|"kapandi", olusturma, guncelleme,
  mesajlar: [{ id, rol: "ogrenci"|"yonetici", yazan: "Sen"|"Meberra ekibi", metin, tarih }] }` (yöneticinin adı öğrenciye gösterilmez)

- `GET /api/sorular` → `{ ok, hak, sorular: [{ id, sayfa, soruRef, metin, durum, olusturma, guncelleme, mesajSayisi, okunmamis }] }`
  (en son güncellenen önce, en fazla 200; `okunmamis` = öğrencinin henüz açmadığı yönetici yanıtı sayısı)
- `POST /api/sorular` `{ metin, sayfa?, soruRef?, baglam? }` → `{ ok, soru, hak }`
  - `sayfa` ≤80, `soruRef` ≤120 karakter (ör. `"calc-unit1-quiz-container|q3"`). Önerilen `baglam`:
    `{ soru: "metin", secenekler: ["A metni", ...], ogrenciCevabi: "B", dogruCevap: "C", unite?, konu? }` (yönetici panelinde bu
    alanlar okunur gösterilir; diğer alanlar ham JSON olarak görünür)
  - **402** hak bitti: `{ ok:false, error, kalan: 0, premiumGerekli: true, hak }` · 400 boş/uzun metin · 413 bağlam büyük · 429
- `GET /api/sorular/:id` → `{ ok, soru }` — yönetici yanıtlarını okundu işaretler. Başkasının sorusu: 404
- `POST /api/sorular/:id/mesaj` `{ metin }` → `{ ok, soru }` — durum `bekliyor`a döner. Kapanmış soru: **409**

## SSS (herkese açık)
- `GET /api/public/sss?sayfa=ap-calculus` → `{ ok, sss: [{ id, soru, cevap, sayfa }] }` — yalnızca yayındakiler. `sayfa` verilirse o
  sayfanınkiler önce, ardından genel (`sayfa: null`) olanlar; verilmezse tümü (en fazla 500).

## Bildirimler
`bildirim` = `{ id, tur, baslik, metin, link, okundu: bool, olusturma }`
`tur`: `soru-yanit | seri | premium | duyuru | rozet | lig | tekrar`. `link` her zaman site içi göreli yoldur (`/...`) ya da `null`.
Sunucunun ürettiği bağlantılar: soru yanıtı `"/profil.html?soru=<id>#sorularim"`, hatırlatma `"/calis.html"`,
lig `"/profil.html#lig"`, Premium `"/calis.html"` (istemci bu adresleri karşılamalı).

- `GET /api/bildirimler?once=<id>` → `{ ok, bildirimler: [...en yeni 30], okunmamis: n, dahaVar: bool }`
  (`once`: imleç; bu id'den küçük olanlar — "daha fazla yükle" için son öğenin id'si)
- `POST /api/bildirimler/okundu` `{ ids: [id, ...] }` ya da `{ hepsi: true }` → `{ ok, okunmamis }` (en fazla 200 id; başkasının id'si yok sayılır)

## Bildirim ayarları (açık rıza; hepsi varsayılan kapalı)
`ayarlar` = `{ epostaHatirlatma: bool, push: bool, epostaBildirim: bool, hatirlatmaSaati: 8..21, veliRaporu: bool,
  veliEposta: string|null, veliDogrulandi: bool, pushAbonelik: n }`
- `epostaHatirlatma`: günlük çalışma hatırlatması e-postası · `epostaBildirim`: sorum yanıtlanınca e-posta ·
  `push`: tarayıcı bildirimi (push için ayrıca abonelik gerekir) · `hatirlatmaSaati`: İstanbul saati, varsayılan 19 (`HATIRLATMA_SAATI`)
- `GET /api/bildirim-ayarlari` → `{ ok, ayarlar, sessizSaatler: { bas: 22, bit: 8 }, pushDestek: bool }`
- `PUT /api/bildirim-ayarlari` `{ ...kısmi ayarlar }` (ya da `{ ayarlar: {...} }`) → aynı yanıt
  - 400: saat 8–21 dışı (sessiz saatler seçilemez), bool olmayan değer, geçersiz/kendi e-postası olan `veliEposta`,
    `veliRaporu:true` iken veli e-postası yok
  - `veliEposta` değişince `veliDogrulandi=false` olur ve veliye **onay e-postası** gider; rapor yalnızca veli onaydan sonra gönderilir
  - `push:false` kaydedilince kullanıcının tüm push abonelikleri silinir
- Tek tıkla iptal (e-postalardaki bağlantılar; oturum gerekmez, HTML sayfa döner):
  - `GET /api/public/bildirim-iptal?tur=hatirlatma|yanit|hepsi&t=<belirteç>` → ilgili e-posta tercihini kapatır (404: geçersiz belirteç)
  - `GET /api/public/veli?t=<veli belirteci>&islem=onay|iptal` → veli raporunu onaylar / durdurur

## Web push
- `GET /api/push/anahtar` → `{ ok, publicKey }` (VAPID; `applicationServerKey` olarak kullanılır). 503: push devre dışı
- `POST /api/push/abone` `{ subscription: PushSubscription.toJSON() }` → `{ ok, abonelik: <cihaz sayısı>, ayarlar }`
  (endpoint https olmalı; `keys.p256dh`, `keys.auth` base64url. Abone olmak `push` tercihini açar. Kullanıcı başına en fazla 10 cihaz → 409)
- `POST /api/push/iptal` `{ endpoint? }` (ya da `{ subscription }`) → `{ ok, abonelik, ayarlar }` — endpoint yoksa tüm cihazlar; hiç
  abonelik kalmazsa `push` kapanır
- Push yükü (sw.js bunu okur): `{ title, body, link, tag }`. Sunucu 404/410 alan aboneliği siler. Sessiz saatlerde push gitmez.
- İstemci akışı: `navigator.serviceWorker.register("/sw.js")` → izin (yalnızca kullanıcı tıklayınca iste) →
  `reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` → `POST /api/push/abone`.

## Hatırlatmalar ve veli raporu (sunucu zamanlayıcısı, 10 dakikada bir)
- Aday: `epostaHatirlatma` ya da `push` açık, hesabı aktif, İstanbul saati ≥ `hatirlatmaSaati`, sessiz saat dışında, bugün henüz
  hatırlatma almamış (`reminder_log` → **günde en fazla 1**).
- Gönderilir ancak: bugün çalışmamışsa (bugün `answers`/`exams` satırı yok) **ve** bugün seri dondurma günü değilse **ve**
  (seri ≥ 1 gün **veya** tekrar zamanı gelmiş soru ≥ 1). Seri: dünden geriye ardışık çalışılan günler; `apmeberra:seri:v1.donmus`
  içindeki günler seriyi bozmaz (sayılmaz da). Tekrar: `apmeberra:tekrar:v1` içinde `sonraki <= bugün` ve `silindi` olmayan kayıtlar.
- Tek mesaj: uygulama içi bildirim (`tur: "seri"` ya da `"tekrar"`) + e-posta (`epostaHatirlatma` ise, tek tıkla iptal bağlantısıyla)
  + push (`push` açık ve abone ise). Metin örneği: "3 günlük serin harika gidiyor! Bugün birkaç soruyla devam etmek ister misin?
  Ayrıca tekrar zamanı gelen 4 soru var." (suçlayıcı dil yok; seri koptuysa hatırlatma da gelmez)
- Veli raporu: pazar 18:00 sonrası (İstanbul), `veliRaporu` açık ve veli onaylı ise haftada bir e-posta: bu haftaki soru sayısı,
  doğruluk yüzdesi, seri, tamamlanan deneme sayısı; iptal bağlantısı içerir.

## Haftalık lig (isteğe bağlı; yalnızca takma ad görünür)
XP (sunucu hesaplar, İstanbul haftası içinde): **her cevap 5 XP, doğru cevap +5 XP, biten deneme 50 XP** (`answers` ve `exams`
tablolarından; yani senkronla gelen veriden). Kademeler: 1 Bronz, 2 Gümüş, 3 Altın, 4 Elmas, 5 Şampiyon. Gruplar kademe başına en
fazla 30 kişi; haftanın ilk görüntülenmesinde kurulur. Hafta kapanınca (pazartesi 00:00 sonrası ilk istek ya da zamanlayıcı): grup
≥10 kişiyse **ilk 5 (XP>0) bir üst kademeye çıkar, son 5 bir alta iner**; her üyeye `tur: "lig"` bildirimi gider.
Takma ad: 3–20 karakter, harf (Türkçe dahil) / rakam / `_`; basit küfür/argo listesi (rakam hileleri ve harf tekrarı normalleştirilir)
ve ayrılmış adlar (admin, meberra, yonetici…) reddedilir; büyük/küçük harf duyarsız benzersiz.

- `GET /api/lig` → `{ ok, katildi: bool, hafta: "2026-W43", bitis: ISO, kalanSn, kurallar: { xp: {soru:5, dogru:5, deneme:50}, grupBoyu: 30,
  yukselen: 5, dusen: 5, enAzGrup: 10, kademeler: [...] }, uye: { takmaAd, kademe, kademeAd, durum: "aktif"|"gizli", uyari }|null,
  grup: { no, kademe, kademeAd, uyeSayisi, siralama: [{ sira, takmaAd, xp, ben: bool }] }|null, benimXp, sonSonuc: { hafta, sonuc:
  "yukseldi"|"dustu"|"kaldi", kademe, kademeAd, xp }|null }`
  — sıralamada **yalnızca** `sira, takmaAd, xp, ben` vardır (ad, e-posta, kimlik yok). Yöneticinin gizlediği üye diğerlerine
  `"Gizli üye"` görünür; kendisine `uye.uyari` ("yeni bir takma ad seç") döner.
- `POST /api/lig/katil` `{ takmaAd }` → `GET /api/lig` yanıtı. Yeniden çağrı takma adı değiştirir ve `durum`u `aktif` yapar.
  400 geçersiz/uygunsuz ad (`errors.takmaAd`), 409 alınmış ad
- `POST /api/lig/ayril` → `GET /api/lig` yanıtı (`katildi:false`); bu haftanın grubundan çıkar, kademe korunur. 409: ligde değil

## Senkron: yeni istemci anahtarları (sunucuda birleştirilir)
- `apmeberra:seri:v1` `{ donmus: ["YYYY-MM-DD"], hakKullanim: { "YYYY-Www": n } }` → `donmus` birleşim (sıralı, en yeni 400 gün;
  geçersiz tarih atılır), `hakKullanim` hafta başına en büyük sayı; diğer alanlar gelen kazanır.
- `apmeberra:tekrar:v1` `{ "<sayfa>|<soruId>": { kutu: 1..4, sonraki: "YYYY-MM-DD", guncelleme: <ms> , silindi?: true } }` → anahtar
  başına `guncelleme` değeri büyük olan kayıt kalır (eşitse sunucudaki). Kaydı kaldırmak için silmeyin;
  `{ silindi: true, guncelleme: Date.now() }` yazın (aksi halde diğer cihaz geri getirir).
- `apmeberra:oyun:v1` `{ xp, rozetler: { id: { t } }, gorevler: { "YYYY-MM-DD": { id: { tamam, t } } }, hedef: { tur: "soru", miktar: 10 } }`
  → `xp` en büyük; `rozetler` birleşim, aynı rozette en erken `t`; `gorevler` birleşim, `tamam:true` kazanır (ikisi de tamamsa en
  erken `t`), en yeni 120 gün tutulur; `hedef` son yazan (gelen değerde `hedef` alanı varsa).
- Bu üç anahtar `null` ile silinirse silme izi tutulmaz (düz silinir).

## PWA
- `/manifest.webmanifest` (ad Meberra, `theme_color #5B3DF5`, `start_url /index.html`, standalone; ikonlar `/assets/img/pwa/`:
  `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (180), `badge-72.png`)
- `/sw.js` (kök kapsam, `Cache-Control: no-cache`): push → bildirim; tıklayınca açık sekmeye odaklanıp `link`e gider; yalnızca
  sayfa gezinmesinde ağ yoksa küçük bir çevrimdışı sayfası. API yanıtları ve sayfalar önbelleğe alınmaz.
- Sayfalara eklenecekler (istemci): `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="#5B3DF5">`,
  `<link rel="apple-touch-icon" href="/assets/img/pwa/apple-touch-icon.png">`. CSP: `worker-src 'self'; manifest-src 'self'`.

## Yönetici: sorular, SSS, duyuru, lig
- `GET /api/admin/sorular?durum=bekliyor|cevaplandi|kapandi|hepsi&sayfa=1` (varsayılan bekliyor; bekleyenler en eski önce, diğerleri
  en yeni önce; 25/sayfa) → `{ ok, toplam, sayfa, sayfaBoyu, sorular: [{ id, kullanici: { id, ad, soyad, eposta, durum, premium },
  sayfa, soruRef, metin, durum, olusturma, guncelleme, mesajSayisi, sonMesajRol }] }`
- `GET /api/admin/sorular/:id` → `{ ok, soru: { ...yukarıdaki alanlar, baglam, mesajlar: [{ id, rol, metin, tarih, okundu, yazan: {ad, soyad}|null }],
  sss: [{ id, soru, cevap, sayfa, durum }] } }`
- `POST /api/admin/sorular/:id/yanit` `{ metin }` → `{ ok, soru }` — durum `cevaplandi`; öğrenciye `soru-yanit` bildirimi + push
  (açıksa) + e-posta (`epostaBildirim` açıksa). 409: öğrenci hesabını silmiş
- `POST /api/admin/sorular/:id/durum` `{ durum }` → `{ ok, soru }`
- `POST /api/admin/sss` `{ soru (≤500), cevap (≤4000), sayfa?, kaynakSoruId? }` → `{ ok, sss }` (yayında olarak eklenir; düzenleme/gizleme Veri sekmesinden `faq`)
- `GET /api/admin/sss` → `{ ok, sss: [{ id, soru, cevap, sayfa, durum, sira, kaynakSoruId, olusturma }] }`
- `POST /api/admin/duyuru` `{ baslik (≤120), metin (≤1000), link?: "/...", hedef: "hepsi"|"premium"|"ucretsiz", onizleme?: true }`
  → `{ ok, alici, push }` (`onizleme:true` → yalnızca `{ ok, onizleme:true, alici }`, hiçbir şey gönderilmez). Alıcılar: hesabı aktif
  kullanıcılar (premium: aktif aboneliği olan). Her alıcıya `tur: "duyuru"` bildirimi; push tercihi açık abonelere push (sessiz
  saatte push yok). Dış bağlantı 400. Denetim: `duyuru.gonder`
- `GET /api/admin/lig?hafta=YYYY-Www` → `{ ok, hafta, kapandi, uyeSayisi: { aktif, gizli, ayrildi }, haftalar: [...son 12],
  gruplar: [{ kademe, kademeAd, grup, uyeler: [{ userId, kullaniciId, ad, soyad, takmaAd, durum, xp, sonuc }] }] }`
  (takma ad moderasyonu: `PUT /api/admin/veri/lig_uyeleri/<userId>` ile `takma_ad` ya da `durum: "gizli"|"aktif"`)
- `GET /api/admin/stats` yanıtına eklendi: `soru: { bekleyen, son7gun }`
- Premium talebi onaylanınca öğrenciye ayrıca `tur: "premium"` bildirimi (+ push) oluşturulur.

## Yönetici: Veri (tablo tarayıcı / düzenleyici)
Tablo adı hem izin listesinde (`server/veriyonetim.js` → `TABLOLAR`) hem `sqlite_master`'da olmalı; değilse **404**. Sütun adları
yalnızca şemadan gelir. **Gizli sütunlar** her yanıtta `"••••"` (null ise null): `users.sifre_hash`, `sessions.token_hash`,
`password_resets.token_hash`, `push_subscriptions.endpoint/p256dh/auth`, `notification_prefs.iptal_belirtec/veli_belirtec`;
`email_outbox.metin` içindeki `?t=`/`token=` belirteçleri de gizlenir. Gizli sütunla arama/sıralama/süzme 400. **Silme yoktur**
(DELETE → 405); kullanıcıyı kapatmak için `durum: "askida"`. Düzenlenebilir alanlar:

| Tablo | Alanlar |
|---|---|
| users | `ad`, `soyad` (1–40), `durum` aktif\|askida (askıya alma oturumları kapatır), `rol` ogrenci\|yonetici — kendi rol/durumunu değiştiremez, son yönetici düşürülemez, silinmiş hesap düzenlenemez |
| profiles (anahtar `user_id`) | `ogrenci_modeli`, `sinif` (≤20), `ulkeler` (`de,it`), `okul` (≤100), `tamamlandi` 0/1, `veri` (JSON nesnesi ≤20000) — sütun düzenlemesi `veri` JSON'una da işlenir |
| subscriptions | `bitis` (ISO tarih), `durum` aktif\|iptal |
| upgrade_requests | `durum` bekliyor\|reddedildi\|iptal, `islem_notu` (≤300) — onay için Ödeme talepleri uç noktasını kullanın |
| questions | `durum` |
| faq | `soru` (≤500), `cevap` (≤4000), `sayfa` (≤80, boş = genel), `durum` yayinda\|gizli, `sira` (−1000..1000) |
| lig_uyeleri (anahtar `user_id`) | `takma_ad` (lig kuralları + benzersiz), `durum` aktif\|ayrildi\|gizli, `kademe` 1–5 |

Diğer tablolar (audit_log dahil) **salt okunur**: answers, wrong_answers, exams, level_tests, user_state, state_tombstones,
sessions, password_resets, email_outbox, notifications, notification_prefs, push_subscriptions, reminder_log, question_messages,
lig_haftalik, lig_haftalar, schema_migrations.

- `GET /api/admin/veri/tablolar` → `{ ok, sayfaBoyu: 50, tablolar: [{ ad, aciklama, satir, anahtar: "<sütun>"|"rowid", saltOkunur,
  duzenlenebilir: [sütun], sutunlar: [{ ad, tur, anahtar, gizli, duzenlenebilir, kural: { tur: "metin", min, max, re? } | { tur: "secim",
  degerler } | { tur: "tamsayi", min, max } | { tur: "bool" } | { tur: "tarih" } | { tur: "json", max } | { tur: "takmaAd", min, max } | null }] }] }`
- `GET /api/admin/veri/:tablo?q=&alan=&deger=&sirala=&yon=asc|desc&sayfa=1` → `{ ok, tablo, toplam, sayfa, sayfaBoyu: 50, anahtar,
  saltOkunur, sutunlar, satirlar: [{ _id, ...sütunlar }] }` — `q`: metin sütunlarında LIKE (≤100 karakter); `alan`+`deger`: tam eşitlik
  (`deger` yok ya da `__null__` → IS NULL); varsayılan sıra anahtar azalan; listede 200 karakterden uzun metin `…` ile kısalır.
  `_id` satırın düzenleme kimliğidir (anahtar sütunu ya da rowid).
- `GET /api/admin/veri/:tablo.csv` (ya da `?bicim=csv`) → aynı süzgeçlerle en fazla 50.000 satır, **UTF-8 BOM**, ayraç `;`
  (Türkçe Excel; `&ayrac=virgul` ile `,`), `=`/`+`/`-`/`@` ile başlayan metin `'` ile kaçırılır, gizli sütunlar maskeli. Denetim: `veri.disa-aktar`
- `GET /api/admin/veri/:tablo/:id` → `{ ok, tablo, saltOkunur, sutunlar, satir }` (tam değerler, maskeli)
- `PUT /api/admin/veri/:tablo/:id` `{ degisiklikler: { sütun: değer }, onceki?: { sütun: istemcinin gördüğü değer } }` →
  `{ ok, satir, degisen: [sütun] }`. 403: salt okunur tablo ya da izinsiz alan · 400: tür/seçenek hatası (`errors.<sütun>`) ya da
  "Değişiklik yok" · 409: `onceki` uyuşmuyor (`guncel` satırı döner) ya da benzersizlik. Denetim: `veri.duzenle`,
  `varlik`=tablo, `varlikId`=id, `ayrinti: { once: {...}, sonra: {...} }` (yalnızca değişen alanlar).

## Sistem logları ve izleme
Tablo `system_logs` (`004_sistem_loglari.sql`): `seviye` hata|uyari|bilgi, `kaynak` sunucu|istemci|zamanlayici|eposta|push|guvenlik,
`mesaj`, `ayrinti` (JSON: stack, method, path, status, user_id, ipOzet, ua, url, satir, sutun…), `parmak_izi` (kaynak + mesaj + yığının ilk çerçevesi),
`adet` + `son_zaman` (aynı parmak izi 1 saat içinde tekrar ederse yeni satır açılmaz; çözüldü işaretli kayıt tekrar ederse yeni satır), `durum` yeni|incelendi|cozuldu, `cozum_notu`.
Kayıtlar konsola da yazılır. Şifre/belirteç/çerez/Authorization alanları ve URL'deki `t=`, `token=`… değerleri `[gizli]` olur; IP yalnızca kısa özet; istek gövdesi asla yazılmaz.
Saklama (zamanlayıcı): bilgi 7 gün, uyarı/hata 90 gün.
Yakalananlar: 500 hataları (yöntem, yol, kullanıcı; veritabanı hataları "Veritabanı hatası:" önekiyle), 2 sn'den yavaş API istekleri (uyari),
bir IP'den 10 dk'da ≥20 adet 401 (yalnızca değiştiren istekler) / 403 ya da ≥5 adet 429 (guvenlik uyarısı), `uncaughtException` (kayıt + çıkış),
`unhandledRejection`, Node `warning` (node:sqlite ExperimentalWarning hariç), zamanlayıcı işi hataları, e-posta gönderim hataları (alıcı yerine yalnızca alan adı),
404/410 dışındaki push hataları, açılış/kapanış (bilgi).

- `POST /api/log` `{ seviye?: "hata"|"uyari", mesaj, stack?, url?, satir?, sutun? }` → `{ ok }` (oturum gerekmez; `X-Meberra: 1` gerekir; gövde ≤ 16 KB → 413;
  mesaj 500, stack 4000 karaktere kırpılır; IP başına 10 dk'da 30 rapor → 429). `kaynak=istemci` olarak yazılır. İstemci tarafı: `assets/js/hata-izle.js`
  (window error, unhandledrejection, `/api/*` 5xx; tekilleştirme, sayfa başına en fazla 10 rapor, eklenti ve ResizeObserver gürültüsü yok sayılır)
- `GET /api/admin/loglar?seviye=&kaynak=&durum=yeni|incelendi|cozuldu|acik&q=&sayfa=` → `{ ok, toplam, sayfa, sayfaBoyu: 50, loglar:[{id, zaman, sonZaman, seviye, kaynak, mesaj, adet, durum, ozet:{method, path, status, url}}] }` (son görülmeye göre yeni → eski; `acik` = çözülmemiş)
- `GET /api/admin/loglar/ozet` → `{ ok, son24s:{hata, uyari, bilgi}, son7g:{…}, yeni:{hata, uyari, bilgi}, gunluk:[{gun, hata, uyari}] (7 gün),
  saglik:{ baslangic, calismaSn, bellek:{rss, heapKullanilan, heapToplam}, dbBoyut, node, platform, sonYedek:{dosya, zaman, boyut}|null (DATA_DIR/yedekler),
  eposta:{smtp, bekleyen, hatali24s}, zamanlayici:{acik, aralikDk, sonCalisma, sonSureMs, sonHata}|null } }` (sayılar `adet` toplamıdır)
- `GET /api/admin/loglar/:id` → `{ ok, log:{…, ayrinti, kullanici:{id, ad, soyad}|null, cozumNotu, isleyen, islemZamani, parmakIzi} }`
- `POST /api/admin/loglar/:id/durum` `{ durum: "yeni"|"incelendi"|"cozuldu", not? }` → `{ ok, log }` (denetim: `log.durum`, önceki/sonraki durum + not)
- `POST /api/admin/loglar/toplu` `{ ids:[1–200], durum, not? }` → `{ ok, guncellenen }` (denetim: `log.toplu-durum`)
- `GET /api/admin/stats` ayrıca `sistem:{yeniHata, yeniUyari}` ve `seri:{gunler, kayit[7], cevap[7]}` döndürür.
- Yalnızca test/hata ayıklama: `NODE_ENV=test` ya da `MEBERRA_TEST_ROTALARI=1` iken `GET|POST /api/test/hata` bilinçli 500 üretir (canlıda kapalı).

## Yönetici v2: varlık, engel, destek merkezi, operasyon, bakım (`005_yonetim_operasyon.sql`)
**Varlık (presence).** Kimliği doğrulanmış her API isteği `users.son_gorulme` / `son_ip` (ve oturumun `sessions.son_gorulme` / `son_ip`)
değerini günceller; kullanıcı başına **en fazla 60 sn'de bir** bellekteki kuyruğa alınır, kuyruk 30 sn'de bir ve kapanışta veritabanına
yazılır (yönetici uç noktaları okumadan önce boşaltır). IP, `TRUST_PROXY` kuralıyla (`X-Forwarded-For`'un son adresi) alınır.
`varlik`: `cevrimici` (son 5 dk) | `yakin` (son 30 dk, "az önce aktif") | `cevrimdisi`. Başarılı girişte `son_giris` + `son_giris_ip`
yazılır; `giris_sayilari (user_id, gun YYYY-MM-DD İstanbul, adet, basarisiz)` başarılı ve (hesap bulunduysa) hatalı şifre girişlerini sayar.

**KVKK / saklama.** IP adresleri kişisel veridir: zamanlayıcı (`erisim` işi) **90 günden eski** `users.son_ip`, `users.son_giris_ip`,
`sessions.ip/son_ip` değerlerini siler; 400 günden eski giriş sayaçlarını ve süresi dolan IP engellerini kaldırır. Hesap silmede
`giris_sayilari` silinir, `son_ip`/`son_giris_ip`/`son_gorulme`/`engel_nedeni` boşaltılır; veri indirme (`/api/account/export`) `erisim`
(sonGiris, sonGirisIp, sonGorulme, sonIp) ve `girisSayilari` alanlarını içerir.

- `GET /api/admin/users?...&varlik=cevrimici|yakin|engelli&sirala=kayit|gorulme|giris` → her kullanıcıya ek: `{ sonGorulme, sonIp, sonGirisIp,
  varlik, bugunGiris, engel: { zaman, bitis|null, neden, dolmus }|null }`
- `GET /api/admin/users/:id` → ek: `user.{ sonGorulme, sonIp, sonGirisIp, varlik, engel }`, `girisler: { gunler[14], adet[14], basarisiz[14] }`,
  `oturumlar: [{ id, olusturma, sonGorulme, ip, ilkIp, tarayici, bitis }]` (açık oturumlar)
- `POST /api/admin/users/:id/oturumlar/:sid/kapat` · `POST /api/admin/users/:id/oturumlar/kapat` → `{ ok, kapanan, oturumlar }` (denetim: `oturum.kapat`, `oturum.tumunu-kapat`)
- `GET /api/admin/stats` → `kullanici` ek: `{ cevrimici, yakin, engelli, bugunGiris }`

**Engelleme.** `POST /api/admin/users/:id/engel` `{ neden (zorunlu, ≤300, yalnızca yöneticiler görür), sure: "suresiz"|"1g"|"7g"|"30g" }` →
`durum = 'askida'` + `engel_zamani`, `engel_bitis` (süresizde null), `engel_nedeni`; tüm oturumlar kapanır (denetim `hesap.engellendi`).
Engelli kullanıcının girişi **403** `{ error: "Hesabın engellendi. Engel <tarih> tarihinde kalkacak. …", engelli: true, engelBitis }`; eski çereziyle gelen
API istekleri **403** `{ engelli: true }` (giriş/çıkış/kayıt/sağlık/public hariç). Süreli engel süresi dolunca girişte ya da zamanlayıcıda kalkar
(`hesap.engel-sona-erdi`). `POST /api/admin/users/:id/engel-kaldir` → `{ ok, durum: "aktif" }` (409: engelli değil). Eski `POST …/durum` aynen çalışır
(`askida` → eski tip askı: 401; `aktif` engel alanlarını da temizler). Kendini engelleyemezsin (400).

**IP engel listesi.** `ip_engelleri (kapsam: tek IPv4/IPv6 adresi ya da IPv4 /24, neden, bitis)`. Eşleşen istemci giriş, kayıt ve tüm API'de
**403** `{ ipEngeli: true }` alır (`/api/health` ve yönetici oturumu hariç). `GET /api/admin/ip-engelleri` → `{ ok, sizinIp, engeller:[{ id, kapsam, neden,
bitis, olusturma, olusturan, etkin }] }` · `POST /api/admin/ip-engelleri` `{ kapsam, neden, sure: "suresiz"|"1g"|"7g"|"30g" }` (400: geçersiz ya da kendi IP'n;
409: zaten var) · `DELETE /api/admin/ip-engelleri/:id`. Denetim: `ip-engel.ekle`, `ip-engel.kaldir`.

**Destek merkezi** (öğrenci tarafı `/api/sorular*` değişmedi; iç notlar öğrenci yanıtlarında hiç yoktur).
- `GET /api/admin/sorular?durum=&q=&sirala=eski|yeni&atanan=ben&sayfa=` → ek alanlar: `sayilar: { bekliyor, cevaplandi, kapandi, okunmamis }`; her soruda
  `beklemeBaslangic` (bekliyorsa: son yönetici mesajından sonraki ilk öğrenci mesajı — SLA), `okunmamis`, `atanan: {id, ad, soyad}|null`, `notSayisi`,
  `kullanici.{ plan, bitis, sonGorulme, varlik }`. Varsayılan sıra: bekleyenlerde en uzun bekleyen önce.
- `GET /api/admin/sorular/:id` → yönetici okundu işaretlenir; ek: `notlar: [{ id, metin, tarih, yazan }]`, `atanan`, `beklemeBaslangic`
- `POST /api/admin/sorular/:id/yanit` `{ metin, kapat?: true }` → `kapat` ise durum `kapandi` ("Cevapla & kapat"); atanmamışsa yanıtlayana atanır
- `POST /api/admin/sorular/:id/not` `{ metin ≤2000 }` → iç not (bildirim yok; denetim `soru.not`)
- `POST /api/admin/sorular/:id/ata` `{ atanan: "<yönetici id>"|"ben"|null }` (denetim `soru.ata`) · `GET /api/admin/yoneticiler` → `{ ok, ben, yoneticiler:[{id, ad, soyad}] }`
- Hazır yanıtlar (yöneticiler arasında ortak, en fazla 200): `GET /api/admin/hazir-yanitlar` → `{ ok, yanitlar:[{ id, baslik, metin, guncelleme }] }` ·
  `POST` `{ baslik ≤80, metin ≤2000 }` · `PUT /api/admin/hazir-yanitlar/:id` · `DELETE /api/admin/hazir-yanitlar/:id`. Denetim: `hazir-yanit.ekle|duzenle|sil`.

**Sistem / operasyon.**
- `GET /api/admin/sistem` → `{ ok, surum, node, platform, pid, baslangic, calismaSn, bellek: { rss, heapKullanilan, heapToplam, harici, sistemToplam, sistemBos },
  olayDongusu: { ortalamaMs, p99Ms, enCokMs, pencereSn }|null (perf_hooks, 5 dk pencere), cpu: { cekirdek, yuk: [1,5,15]|null (Windows'ta null) },
  veritabani: { boyut, walBoyut, dosya }, disk: { bos, toplam }|null (fs.statfs, DATA_DIR), yedek: { son, adet, sakla: 14 },
  onbellek: { girdi, bayt, isabet, iska, temizleme, sonTemizleme } (HTML sayfa önbelleği), hizSinirlari: { giris, kayit, sifre, soru, hataRaporu } (izlenen anahtar),
  kuyruk: { eposta: { smtp, bekleyen, hata, gonderilen24s }, push: { abonelik, kullanici } }, zamanlayici: { acik, aralikDk, sonCalisma, sonSureMs, sonHata,
  isler: [{ ad, baslik, sonCalisma, sureMs, sonuc, hata }] }, oturum: { aktif, cevrimici, yakin }, istek: { dakikada, ortSureMs, son5dk, hata5xx5dk,
  hataOrani5dk, seri: [15 × { dakika, istek, hata5xx }] } (yalnızca /api/*), bakim, ipEngeli }`
- `POST /api/admin/sistem/onbellek-temizle` → `{ ok, temizlenen, onbellek }` (denetim `sistem.onbellek-temizle`)
- `POST /api/admin/sistem/yedek` → çalışan veritabanından yedek (`node:sqlite` backup), `DATA_DIR/yedekler`, en yeni 14 tutulur → `{ ok, yedek: { dosya, boyut, sureMs, silinen }, son }`
  (409: bellek içi veritabanı ya da süren yedek; denetim `sistem.yedek`)
- `GET /api/admin/sistem/eposta?durum=bekleyen|hata|gonderilen` → en yeni 100 `{ id, alici, konu, olusturma, gonderim, hata }` (metin gösterilmez) ·
  `POST /api/admin/sistem/eposta/isle` (en eski 50 gönderilmemiş; 409: SMTP yok) · `POST /api/admin/sistem/eposta/:id/tekrar`
- `POST /api/admin/sistem/zamanlayici/:is` (`lig`|`temizlik`|`erisim`|`hatirlatma`|`veliRaporu`) → `{ ok, calisti, sonuc|neden }`. Hatırlatma/veli raporu kendi
  kurallarına uyar (sessiz saatte çalışmaz; `reminder_log` ile kişi başına günde bir).

**Bakım modu** (`ayarlar` tablosunda `bakim` anahtarı; yeniden başlatmada korunur).
- `GET /api/admin/bakim` → `{ ok, bakim: { acik, mesaj, bitis, baslangic, baslatan } }` · `POST /api/admin/bakim` `{ acik: bool, mesaj? ≤500, bitis?: ISO }` (denetim `bakim.ac|guncelle|kapat`)
- Açıkken yönetici oturumu olmayan isteklerde: HTML sayfaları (`/` dahil; `bakim.html`, `giris.html`, `admin.html` hariç) **503** + `Retry-After` ile `bakim.html`;
  API **503** `{ ok:false, bakim:true, error, mesaj, bitis }` + `Retry-After` — açık kalanlar: `/api/health`, `/api/public/config` (`bakim: { acik, mesaj, bitis }`),
  `/api/auth/login`, `/api/auth/logout`, `/api/me`, `/api/admin/*` (kendi yetki denetimiyle). Statik varlıklar (css/js/font/görsel) açık. `bakim.html` 60 sn'de bir
  `/api/public/config` ile yeniden dener; bakım bitince sayfayı yeniler.

**Android (TWA).** `GET /.well-known/assetlinks.json`: `.env` → `ANDROID_PAKET_ADI` + `ANDROID_SHA256` (virgülle birden çok SHA-256 parmak izi, `AA:BB:…`)
varsa üretilen Digital Asset Links JSON'u; yoksa proje kökündeki `.well-known/assetlinks.json` dosyası; ikisi de yoksa 404. `Content-Type: application/json`.

## Soru bankası (v1.5.0, `006_soru_bankasi.sql`)

Sorular, doğru şıklar ve çözümler yalnız veritabanında (`questions_bank`; eski sürümler `questions_bank_history`). Herkese açık
HTML/JS'te soru dizisi ya da cevap anahtarı yoktur. Tohum (tek doğruluk kaynağı): `server/tohum/soru-bankasi.json`
(statik olarak sunulmaz; `node araclar/soru-aktar.js` üretir, yönetici dışa aktarımı aynı biçimdedir). Tablo boşsa sunucu açılışta
tohumdan doldurur. Ücretsiz plan kuralı istemciyle aynı dosyadır: `assets/js/ucretsiz-kural.js` (`apKutuUcretsizMi`).
Cevap/çözüm içeren yanıtlar `Cache-Control: private, no-store`.

Soru (öğrenciye giden, cevapsız): `{ id, number, topic, difficulty, source, question, options: [{ id, text }] }` (seviye: `unite, beceri, zorluk, sureSn, hesapMakinesi`).
Çözüm: `{ dogru, aciklama, genelHatirlatma, hatalar: { <harf>: { errorTag, remediation } } }`.

- `GET /api/sorular-bankasi/:sayfa` — oturum. Kutu (soru istasyonu) başına `{ kutu, baslik, uniteNo, toplam, kilitli }` (soru içeriği yok).
- `GET /api/sorular-bankasi/:sayfa/:unite` — oturum (misafir 401). `:unite` = ünite görünümü numarası (`?unite=N`) ya da kutu kimliği
  (`calc-unit1-quiz-container`). Ücretsiz planda kilitli kutu → **402** `{ premiumGerekli: true }`. Yanıt `{ kutular: [{ kutu, baslik, uniteNo, sorular }] }`;
  doğru şık/çözüm YOK — yalnız öğrencinin daha önce cevapladığı (answers tablosunda olan) soruda `cozum` alanı (yeniden açılışta geri bildirim için).
- `POST /api/sorular-bankasi/cevap` `{ soruId, secim }` — oturum; kilitli → 402. Dönüş `{ dogru, dogruSecenek, aciklama, genelHatirlatma,
  hataAciklamasi: { etiket, aciklama } | null, cozum, t }`. Kayıt mevcut birleştirmeyle: `apmeberra:quiz:v1` → `answers` (XP/lig/istatistik);
  istemci aynı `t` ile yerel depoya yazar (eşitlemede ikinci satır oluşmaz). Hız sınırı: kullanıcı başına 600 / 10 dk.
- `POST /api/sorular-bankasi/getir` `{ anahtarlar: ["sayfa|id"] }` — İlerleme › Bugünkü tekrar. Ücretsiz planda yalnız açık kutular ya da öğrencinin
  daha önce çözdüğü/yanlış yaptığı sorular; diğerleri `eksik`.
- `GET /api/public/demo-soru` — herkese açık TEK demo sorusu (`DEMO_SORU_ID`, varsayılan `vitrin_demo_1`), cevapsız; `public, max-age=300`.
  `POST /api/public/demo-soru/cevap` `{ secim }` → sonuç + açıklama (kayıt yok; IP başına 60 / 10 dk).

### Deneme (sunucuda kurulur ve puanlanır)
- `GET /api/deneme/katalog` — oturum. `{ kodlar (canlı soru sayılarıyla), pasajlar, haklar: { <sayfa>: bool }, sorular: [{ sayfa, id, unite, denemeKodlari, pasaj, number, kap, kapBaslik, topic }] }` (kök/şık/cevap yok).
- `POST /api/deneme/olustur` `{ kod, adet, sureModu, dersler?, uniteFiltre?, seed? }` ya da `{ mod: "yanlislar", sorular: [{ k, kod }], kaynakDeneme? }`.
  Sunucu soruları eski istemciyle birebir aynı tohumlu algoritmayla seçer. Ücretsiz plan: ders sayfası başına 1 deneme — hak oluşturmada
  `soru_oturumlari.ucretsiz_hak` + `apmeberra:deneme-hak:v1`'e yazılır; ikinci deneme (aynı sayfa, ör. calculus-ab sonra calculus-bc) ve genel deneme → **402**.
  Yanlışlarım modunda ücretsiz plan yalnız kendi yanlışlarını/çözdüklerini ya da açık kutuları ekleyebilir. Dönüş `{ deneme: { id, kod, ad, seed, sorular }, icerik: { k: soru } }`.
  Hız sınırı: kullanıcı başına 40 / saat. POST'tur (GET yan etkisiz olmalı: hak yazar ve siteler arası isteğe açık olmamalı).
- `GET /api/deneme/:id` — kendi denemesi: içerik; teslim edildiyse `sonuc` + `cozumler`. v1.5.0 öncesi eşitlenmiş eski deneme (exams) için inceleme verisi.
- `POST /api/deneme/teslim` `{ denemeId, cevaplar: { <index>: "A" }, isaretli, gecenSn, otomatik, sureLimitSn }` — sunucu puanlar (tahmini bant dahil),
  `inceleme[i].st` (dogru/yanlis/bos), `exams` tablosuna ve `apmeberra:deneme:v1` geçmişine yazar; `{ sonuc, cozumler, icerik }`. Tekrar teslim aynı sonucu döner.

### Seviye testi (oturum açmış herkese açık)
- `GET /api/seviye/bankalar` — ünite meta verisi (`data/sorular/seviye/*.js`, soru içermez) + sorular (cevapsız).
- `POST /api/seviye/teslim` `{ cevaplar: { "ders|id": "A" | null } }` → `{ sonuclar: { k: { secim, dogru, dogruSecenek } }, cozumler }`; `soru_oturumlari`'na yazılır.
- `POST /api/seviye/cozumler` `{ anahtarlar }` — yalnız kullanıcının daha önce teslim ettiği sorular (rapor yeniden açılınca).

### Yönetici: Soru bankası (rol: yonetici; hepsi denetim kaydına yazılır)
- `GET /api/admin/soru-bankasi/meta` — kutular, durum sayıları, seviye üniteleri, şüpheli eşiği.
- `GET /api/admin/soru-bankasi?tur&sayfa&ders&kutu&unite&durum&zorluk&q&supheli=1&sirala=(cevap|oran|guncelleme|id)&sayfaNo` — 50'lik sayfa;
  her soruda `istatistik: { cevap, dogruSayi, dogruOran, supheli }` (answers tablosu; en az 5 cevapta <%25 ya da >%95 doğru = şüpheli).
- `GET /api/admin/soru-bankasi/soru/:id` — tam satır + istatistik + şık seçim dağılımı + geçmiş. `GET .../soru/:id/gecmis`.
- `PUT /api/admin/soru-bankasi/soru/:id` `{ surum, govde, secenekler: [{ text }], dogru, aciklama, genel_hatirlatma, hata_aciklamalari, konu, kaynak, zorluk, durum, not? }`
  — doğrulama: 2–5 şık, boş/aynı şık yok, tam bir doğru şık, zorluk easy|medium|hard, tek sayıda `$` yok. `surum` güncel değilse **409**. Değişen alan
  varsa eski hâl geçmişe yazılır, `surum + 1` (`fark`: değişen alanlar). Eylem: `soru-bankasi.duzenle`.
- `POST /api/admin/soru-bankasi/soru` — yeni soru (`tur: ders` + `sayfa` + `kutu`, ya da `tur: seviye` + `ders` + `unite`; `id` isteğe bağlı). Varsayılan durum `taslak`.
- `POST /api/admin/soru-bankasi/soru/:id/arsiv` `{ geriAl? }` — silme yok; arşiv öğrenciye ve denemelere gelmez.
- `POST /api/admin/soru-bankasi/soru/:id/geri-yukle` `{ surum }` — o sürümün içeriği yeni sürüm olarak yazılır.
- `GET /api/admin/soru-bankasi/disa-aktar?tur&sayfa` — JSON (tohumla aynı biçim, `Content-Disposition: attachment`).

## Büyüme (v1.6.0, `007_buyume.sql`; `server/huni.js`, `server/kampanya.js`)
Ölçüm birinci taraftır (üçüncü taraf betik yok). Olay satırında IP, tarayıcı, e-posta yoktur; `anon_id` tarayıcının ürettiği rastgele
kimliktir (`mb_anon` çerezi + localStorage, 400 gün). Do Not Track / GPC açık tarayıcı ya da ölçümü kapatan hesap olay göndermez/yazılmaz.
Olaylar 400 gün saklanır; daha eskisi `olay_ozet` günlük toplamına çevrilip silinir (zamanlayıcı işi `olaySaklama`).

### Ölçüm
- `POST /api/olay` (oturum gerekmez; CSRF başlığı; gövde ≤ 16 KB; IP başına dakikada 120 istek) `{ anon, utm?:{source,medium,campaign}, izinYok?, olaylar:[{ ad, sayfa?, ozellikler?, t? }] }` (≤ 25 olay)
  → `{ ok, alinan }`. İzinli istemci olayları: `page_view, vitrin_gorundu, kayit_baslat, seviye_basla, unite_bitti, paywall_gordu, premium_sayfa, plan_secti,
  davet_paylasti, kupon_uygulandi`. Sunucunun yazdıkları (istemciden gelirse yok sayılır): `kayit_tamam, karsilama_tamam, odeme_bildirdi, premium_aktif, deneme_basla,
  deneme_bitti`; rota sonrası kancayla: `seviye_bitti` (`POST /api/seviye/teslim`), `ilk_soru` (`POST /api/sorular-bankasi/cevap`, kişi başı bir),
  `soru_sordu` (`POST /api/sorular`), `demo_soru_cevaplandi`. `sayfa` yalnız yol (sorgu atılır); `ozellikler` ≤ 10 düz alan, 500 karakter.
- `GET /api/olcum-tercih` → `{ ok, kapali }` · `PUT /api/olcum-tercih` `{ kapali: bool }` (profil → "Kullanım ölçümü")

### 7 gün ücretsiz Premium denemesi
- `GET /api/premium/deneme` → `{ ok, uygun, neden: null|"kullanildi"|"premium"|"yonetici", gun: 7, aktif, bitis, kullanildi }`
- `POST /api/premium/deneme` → `{ ok, bitis, uyelik }` (409 + `neden`). Kullanıcı ve e-posta karması (HMAC-SHA256, `BUYUME_TUZ`) başına bir kez;
  karma hesap silinse de kalır. `subscriptions` satırı `plan='ozel', kaynak='deneme'`, +7 gün; `uyelik.deneme = true`. Gelir tahmininde ve
  özet Premium sayısında sayılmaz. Zamanlayıcı (`denemeBildirim`, sessiz saatlerde çalışmaz, günde en çok bir mesaj — `reminder_log tur='deneme'`):
  bitişe ≤ 2 gün kala bir kez "2 gün kaldı", bitişte bir kez "denemen bitti" (uygulama içi + e-posta + push tercihi açıksa); ücretliye geçen için yok.

### İndirim kodu
- `POST /api/kupon/dogrula` (oturum) `{ kod, plan }` → `{ ok, kod, plan, liste, indirim, tutar, aciklama }`; 400 `errors.kupon` (geçersiz, pasif, başlamadı,
  süresi doldu, plan kısıtı, kullanım sınırı, kişi başı). Kullanıcı ve IP başına 10 dakikada 20 deneme. Bekleyen bildirimler de sınıra sayılır.
- Ödeme bildirimi `kupon_id`, `liste_tutar_tl` ve indirimli `tutar_tl` tutar; yönetici onaylayınca `kupon_kullanimlari` satırı yazılır.

### Davet programı
- `GET /api/davet` → `{ ok, kod, link: BASE_URL/giris.html?davet=KOD#kayit, odulGun: 7, basarili, bekleyen, yillikSinir: 10, buYilOdul }`
- `POST /api/auth/register` gövdesine `davet` (istemci `?davet=` parametresini saklayıp ekler). Kendi kodu, aynı e-posta karmasıyla yeniden kayıt ya da
  davet edenin son 24 saatte görüldüğü IP'den kayıt → `reddedildi`. Davet edilen seviye testini (sunucuda puanlanan `soru_oturumlari tur='seviye'`) bitirince
  iki tarafa `kaynak='davet'` +7 gün Premium; davet eden yılda en çok 10 ödül alır.

### Yönetici
- `GET /api/admin/buyume/analiz?gun=7|30|90&kaynak=` → `{ huni:[{anahtar, ad, olay, kisi, ham, adimOrani}], kaynaklar:[{ad, kisi}], kohort:[{hafta, kisi, oranlar[8]}],
  gunluk:{gunler, etkin, kayit, premium, deneme}, paywall:[{yer, kisi, gosterim}] }`. Huni adımı = önceki tüm adımları da yapmış kişi (kümülatif kesişim).
- `GET /api/admin/buyume/ozet` · `GET /api/admin/buyume/denemeler?durum=hepsi` · `POST /api/admin/buyume/denemeler/:kullaniciId/uzat` `{ gun: 1–30 }` · `.../iptal`
- `GET /api/admin/kuponlar` (kullanım istatistiği + son 50 kullanım) · `POST /api/admin/kuponlar` `{ kod, tur:"yuzde"|"tutar", deger, plan:"aylik"|"yillik"|"hepsi",
  baslangic?, bitis?, maxKullanim?, kisiBasi=1, aktif, aciklama? }` · `PUT /api/admin/kuponlar/:id` (kısmi; `aktif:false` pasifleştirir; silme yok)
- `GET /api/admin/davetler?durum=` → bayraklar: `kendi-kodu`, `ayni-ip`, `tekrar-eposta`, `yogun-davet` (24 saatte 5+), `hesap-silindi`

## Sayfalar
Sunucu proje kökündeki statik sayfaları da sunar. HTML yanıtlarına `<meta name="meberra-api" content="1">`
eklenir; istemci bu etiketi görünce sunucu modunda çalışır (yoksa eski tarayıcı-içi mod).
