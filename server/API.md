# Meberra API sözleşmesi (v1)

Sunucu: `node server/index.js` (Node.js 22.5+; yerleşik `node:sqlite`). Varsayılan port `3000`.
Tüm uç noktalar JSON alır/verir (`Content-Type: application/json`). Oturum, `meberra_sid` adlı
HttpOnly çerezle taşınır (kayan süre: günde bir kez uzar ve çerez yeni `Max-Age` ile yeniden yazılır). Değiştiren isteklerde (POST/PUT) `X-Meberra: 1` başlığı zorunludur (CSRF koruması).

Hata biçimi: `{ "ok": false, "error": "Türkçe mesaj", "errors": { "alan": "mesaj" } }` + uygun HTTP kodu
(400 doğrulama, 401 oturum yok, 402 ücretsiz hak bitti, 403 yetki yok, 404, 409 çakışma, 413 çok büyük, 429 çok fazla deneme).
Bazı hatalar ek alan taşır (ör. 402: `kalan`, `premiumGerekli`, `hak`).
Başarı: `{ "ok": true, ... }`.

## Genel
- `GET /api/health` → `{ ok, surum, zaman }`
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
- `POST /api/premium/talep` `{ plan: "aylik"|"yillik", odeyenAd, aciklama? }` → `{ ok, talep:{id, plan, tutar, durum}, uyelik }` (409: zaten bekleyen var)
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

## Sayfalar
Sunucu proje kökündeki statik sayfaları da sunar. HTML yanıtlarına `<meta name="meberra-api" content="1">`
eklenir; istemci bu etiketi görünce sunucu modunda çalışır (yoksa eski tarayıcı-içi mod).
