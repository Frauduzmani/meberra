# Tur 5 — Çok Öğrencili Platform Sözleşmesi (PM, 12 Ekim 2026)

Bu dosya Tur 5'te paralel çalışan ajanların ortak sözleşmesidir. Burada yazan dosya sahipliği, anahtar adları ve veri şemaları değiştirilmez. Değişiklik gerekiyorsa raporunda PM'e öner.

## 1. Hedef akış
1. Öğrenci siteyi açar → oturum yoksa `giris.html` (Giriş / Kayıt Ol sekmeleri).
2. Kayıt: ad, soyad, kullanıcı adı (veya e-posta), şifre (kendi belirler, en az 8 karakter), şifre tekrarı.
3. İlk girişte `profil.html` sihirbazı: okul adı, sınıf (9 / 10 / 11 / 12 / Mezun), hedef ülke(ler) (Almanya, İtalya; çoklu seçim). Tamamlanmadan panele geçilmez.
4. Sihirbaz sonrası `universiteler.html`: seçilen ülkenin üniversiteleri, programları, isterleri ve ülkenin genel kabul şartları.
5. `sinavlar.html`: her sınav ayrı kart (her AP dersi ayrı, CEnT-S, IELTS/TOEFL ...). Her kartta: format, süre, puanlama, tarih, resmi kaynak, "Ders anlatımı (English)" bağlantısı, "Deneme sınavı" bağlantısı.
6. `deneme.html`: ders bazında deneme ve karma genel deneme; sonuç ve hata incelemesi.
7. `index.html` kişisel panel olur ("Merhaba {ad}"), ilerleme ve önerilen sonraki adım.

## 2. Depolama (yalnızca tarayıcı — sunucu yok)
- Hesaplar: `apmeberra-hesap:v1:kullanicilar` → `[{id, ad, soyad, kullaniciAdi, salt, hash, iter, olusturma}]`
  - Şifre düz metin SAKLANMAZ. PBKDF2-SHA-256 (Web Crypto), rastgele 16 bayt salt, ≥150.000 iterasyon. `crypto.subtle` yoksa saf JS SHA-256 tabanlı yedek uygulanır.
- Profil: `apmeberra-hesap:v1:profil:<id>` → `{okul, sinif, ulkeler:["de","it"], tamamlandi:true, guncelleme}`
- Oturum: `apmeberra-hesap:v1:oturum` → `{id, baslangic}`
- Aktif veri sahibi: `apmeberra-hesap:v1:aktif` → id
- Kişi verisi takası: Mevcut kod `apmeberra:*` anahtarlarını kullanmaya devam eder (değiştirilmez).
  - Çıkışta: tüm `apmeberra:*` anahtarları (`apmeberra:theme` hariç) `apmeberra-hesap:v1:veri:<id>` içine JSON olarak kaydedilir ve canlı anahtarlar silinir.
  - Girişte: `aktif` başka biriyse önce onun verisi saklanır, sonra girenin verisi geri yüklenir.
  - Hesap sistemi gelmeden önceki (sahipsiz) ilerleme varsa: ilk giriş yapan kullanıcıya "Bu cihazda önceki ilerleme bulundu, hesabına aktarılsın mı?" sorulur.
- Yeni anahtar: `apmeberra:deneme:v1` (deneme geçmişi). `apmeberra:` önekli olduğu için takas ve yedekleme modülü otomatik kapsar.
- Yeni anahtar (Tur 12, 16 Ekim 2026, Ajan 12): `apmeberra:calc-frq:v1` (ap-calculus.html Resmi FRQ Arşivi öz değerlendirme işaretleri; soru başına x/9, yıl başına x/54). `apmeberra:` önekli olduğu için takas ve yedekleme modülü otomatik kapsar.
- Arayüzde dürüst not: "Hesabın ve ilerlemen bu cihazdaki tarayıcıda saklanır; şifren hiçbir sunucuya gönderilmez. Başka cihaza geçmek için Yedek Al / Yükle kullan."

## 3. Dosya sahipliği (çakışma olmaması için)
| Ajan | Yazabileceği dosyalar |
| :--- | :--- |
| Ajan 11 Frontend | `assets/js/auth.js` (yeni), `assets/js/app.js`, `assets/css/styles.css`, `index.html`, `giris.html`, `profil.html`, `universiteler.html`, `sinavlar.html` (yeni sayfalar), `ilerleme.html` |
| Ajan 2 Weber & Rossi (+ Canan Yılmaz) | `data/mevzuat/ulkeler.js`, `data/mevzuat/sinavlar.js` (yeni) |
| Ajan 3 Canan Yılmaz + Ajan 12 Deneme Sorumlusu | `deneme.html`, `assets/js/deneme.js`, `assets/css/deneme.css`, `araclar/deneme-bankasi-olustur.js`, `data/sorular/deneme-bankasi.js` (üretilen) |
| İçerik ajanı (CEnT-S) | `sinav-cents.html` (yeni), `araclar/pm-denetim.js` (yalnızca sayfa desenine `sinav-*.html` eklemek için) |

Ders sayfaları (`ap-*.html`) bu turda yalnızca içerik ajanlarına aittir. Oturum koruması ve menü `assets/js/app.js` üzerinden gelir; tüm sayfalar zaten `assets/js/app.js` yüklüyor.

## 4. Oturum koruması
- `assets/js/auth.js` her sayfada `assets/js/app.js`'den ÖNCE yüklenmez; bunun yerine `assets/js/app.js` en başta `assets/js/auth.js`'in sağladığı `window.APMEBERRA_AUTH` nesnesini kullanır. Sayfalara script etiketi eklemeden çözüm: `assets/js/app.js` kendi başında koruma yapar (oturum yoksa `location.replace("giris.html?donus=<sayfa>")`; profil tamamlanmamışsa `profil.html`). Koruma dışı sayfalar: `giris.html`.
- `assets/js/auth.js` yalnızca `giris.html` ve `profil.html` gibi yeni sayfalarda ayrıca yüklenebilir; kod tekrarını önlemek için hesap mantığı tek yerde (`assets/js/auth.js`) durur ve `assets/js/app.js` gerekirse onu dinamik yükler. Uygulama ayrıntısı Ajan 11'e aittir. Şart: ders sayfalarının HTML'i değişmeden korunmalı.

## 5. Veri şemaları

### 5.1 `data/mevzuat/ulkeler.js`
```js
window.APMEBERRA_ULKELER = [{
  id: "de",               // "de" | "it"
  ad: "Almanya",
  ozet: "...",            // 2–3 cümle
  kabulYolu: [{ baslik, detay, kaynak }],     // ör. KMK/Anabin 4 AP kuralı, uni-assist VPD
  genelIsterler: [{ baslik, detay, kaynak }], // dil belgesi, diploma denkliği, vize/bloke hesap
  sinavlar: ["ap-calculus-ab", "ielts-academic", ...], // data/mevzuat/sinavlar.js id'leri
  takvim: [{ tarih: "2027-01-15", olay, kaynak }],
  universiteler: [{
    id, ad, sehir, web,
    programlar: [{ ad, derece: "B.Sc.", dil: "English", sure: "6 semestr", kaynak }],
    isterler: [{ baslik, detay, kaynak }],    // üniversiteye özel: test, dil skoru, başvuru kanalı
    basvuruDonemi: "...", ucret: "...",       // doğrulanamıyorsa "Doğrulanamadı"
    kaynak, dogrulamaTarihi: "2026-10-12"
  }],
  kaynaklar: [url, ...]
}];
```

### 5.2 `data/mevzuat/sinavlar.js`
```js
window.APMEBERRA_SINAVLAR = [{
  id: "ap-calculus-ab",
  ad: "AP Calculus AB",
  kategori: "AP",            // "AP" | "Giriş Sınavı" | "Dil Sınavı"
  kurum: "College Board",
  ulkeler: ["de", "it"],
  format: "...", sure: "3 saat 15 dk", puanlama: "1–5",
  tarih: "...",              // resmi takvimden; data/mevzuat/sinav-takvimi.js ile tutarlı
  dersSayfasi: "ap-calculus.html" | null,  // English konu anlatımı
  denemeKodu: "calculus-ab" | null,        // deneme.html?ders=<denemeKodu>
  durum: "hazir" | "kismi" | "yakinda",
  not: "...",
  kaynak: "https://..."
}];
```

### 5.3 Deneme kodları (sabit liste)
`calculus-ab` (Calculus Unit 1–8), `calculus-bc` (Unit 1–10), `physics-1`, `chemistry`, `biology`, `english-language`, `cs-a`, `economics`, `cents` (sinav-cents.html hazır olunca). Genel deneme: `deneme.html?ders=genel`.

## 6. Ortak kalite şartları
- `AGENTS.md` §2.1 PM Doğruluk Kapısı geçerlidir: mevzuat, ücret ve tarih bilgisi yalnızca resmi URL ile yazılır, doğrulanamayan bilgi "Doğrulanamadı" olarak işaretlenir.
- Arayüz metinleri Türkçe; ders anlatımı ve soru metinleri İngilizce (Kural 13).
- Renkler yalnızca `assets/css/styles.css` içindeki `var(--...)` değişkenleri; açık ve koyu temada çalışmalı; 360 px telefon genişliğinde yatay taşma olmamalı.
- Teslimden önce `node araclar/pm-denetim.js` → 0 sorun.

## 7. Resmi Yazışma (E-posta) Mekanizması — Tur 5b (PM, 12 Ekim 2026)
Amaç: Üniversitelere, uni-assist'e ve kurumlara gönderilecek teyit e-postalarını öğrencinin profil bilgileriyle otomatik oluşturmak.
- **Şimdi (yerel):** Öğrenci e-postayı kopyalar ya da `mailto:` ile kendi e-posta programında açar. Gönderimi kendisi yapar ve "gönderildi" olarak işaretler.
- **Sunucu gelince:** Aynı şablon motoru sunucuda çalışır; gönderim, kuyruk ve yanıt takibi sunucuya taşınır.

### 7.1 Şablon verisi: `data/kocluk/eposta-sablonlari.js` (sahibi: Ajan 13 Mevzuat Uzmanı)
```js
window.APMEBERRA_EPOSTA_SABLONLARI = [{
  id: "de-uni-ap-yks-teyit",
  baslik: "Alman üniversitesine kabul yolu teyidi",   // Türkçe, arayüzde görünür
  amac: "...",                                         // neden gönderilmeli (Türkçe, 1–2 cümle)
  ulke: "de" | "it" | "genel",
  kararNotu: "K1",                                     // ilgili karar notu maddesi (varsa)
  alici: { tur: "universite" | "kurum", kurum: "uni-assist" | null, eposta: "..." | null,
           iletisimSayfasi: "https://...", kaynak: "https://..." },
  // alici.tur === "universite" ise kullanıcı data/mevzuat/ulkeler.js'ten üniversite (ve program) seçer
  dil: "en" | "de" | "it",
  konu: "Admission eligibility – {{ogrenci.diploma}} ... {{basvuru.donem}}",
  govde: "Dear Admissions Team,\n\nI will graduate in {{ogrenci.mezuniyetAyYil}} ...",
  zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "universite.ad", "program.ad"],
  neZaman: "...",                                      // önerilen gönderim zamanı (Türkçe)
  guncelleme: "2026-10-12"
}];
```

### 7.2 Değişkenler
Değişkenler profil ve seçimden doldurulur. Eksik zorunlu alan varsa e-posta "eksik" uyarısıyla gösterilir.
- **Öğrenci:**
  - `ogrenci.adSoyad`, `ogrenci.ad`, `ogrenci.soyad`
  - `ogrenci.eposta`, `ogrenci.dogumTarihi`, `ogrenci.okul`, `ogrenci.okulSehir` (varsayılan İstanbul), `ogrenci.sinif`
  - `ogrenci.mezuniyetYili`: sınıftan hesaplanır, 2026-27 öğretim yılı referans alınır (11 → 2028, 12 → 2027, 10 → 2029, 9 → 2030). Mezun ise profilde girilir.
  - `ogrenci.mezuniyetAyYil`: "June 2028"
  - `ogrenci.diploma`: "Turkish Lise Diplomasi"
  - `ogrenci.apSinavlari`: profildeki "Sınavlarım" listesindeki AP'ler, İngilizce adlarıyla
- **Başvuru, kurum ve tarih:**
  - `basvuru.yil` (mezuniyet yılı), `basvuru.donem` ("winter semester 2028/29" / "academic year 2028/29")
  - `universite.ad`, `program.ad`
  - `bugun`

### 7.3 Profil ekleri (sahibi: Ajan 11)
Profile şu isteğe bağlı alanlar eklenir: `eposta`, `dogumTarihi`, `okulSehir` (varsayılan "İstanbul") ve mezunlar için `mezuniyetYili`. Kayıtta zorunlu DEĞİL; e-posta oluşturulurken eksikse istenir.

### 7.4 Motor ve sayfa (sahibi: Ajan 11)
- **`assets/js/eposta.js`:** saf fonksiyonlar, DOM'a bağımsız.
  - `APMEBERRA_EPOSTA.degiskenler(profil, kullanici, secim)` → değişken nesnesi
  - `APMEBERRA_EPOSTA.olustur(sablon, degiskenler)` → `{konu, govde, eksikler[]}`
  - `APMEBERRA_EPOSTA.mailto(...)`
  - Node'da da çalışır (`module.exports` koşullu), çünkü sunucuda aynı modül kullanılacak.
- **`yazismalar.html`:** "Resmi Yazışmalarım" sayfası.
  - Şablon listesi profil ülkelerine göre süzülür.
  - Şablon seçilince alıcı ve üniversite/program seçimi yapılır, önizleme gösterilir. Önizleme, gönderimden önce düzenlenebilir bir metin alanıdır.
  - Butonlar: "Kopyala", "E-posta programında aç (mailto)", "Gönderildi olarak işaretle".
  - Yazışma geçmişi: tarih, alıcı, durum (taslak / gönderildi / yanıt geldi), yanıt notu.
- **Depolama:** `apmeberra:yazisma:v1` = `{ kayitlar: [{id, sablonId, alici, universiteId, programAd, konu, govde, durum, olusturma, gonderim, yanitNotu}] }`. `apmeberra:` önekli olduğu için kişi verisi takası ve yedek modülü bu anahtarı kapsar.

## 8. Ülkeye Özel Yol (Rota) Motoru — Tur 6 (kullanıcı kararı K1, 12 Ekim 2026)
**Kullanıcı kararı:** "Her iki ülke ayrı ayrı olsun. Öğrenci seçince o ülkenin isterleri ve kuralları devreye alınarak devam edilsin."
- Almanya ve İtalya iki bağımsız rotadır. Biri diğerinin yedeği değildir.
- Öğrenci profilde hangi ülkeleri seçtiyse yalnızca o ülkelerin rotaları açılır. İki ülke seçildiyse iki rota yan yana, ayrı ayrı izlenir.
- Portalda "PM/aile kararı bekleniyor (K1)" notu kalmaz. Yerine şu ifade gelir: "Bu bilgi Almanya rotası içindir" / "Bu bilgi İtalya rotası içindir".
- K2 (AP fen dersi) ve K3 (Kasım/Aralık 2026 CEnT-S) hâlâ açık. Bunlar artık rota içi seçenek olarak gösterilir:
  - K2: Almanya rotasında "KMK uyumu istiyorsan" notu.
  - K3: İtalya rotasında "prova" seçeneği.

### 8.1 Kural verisi: `data/mevzuat/ulke-rotalari.js` (sahibi: Ajan 13 + Ajan 2)
```js
window.APMEBERRA_ROTALAR = {
  de: {
    ad: "Almanya rotası",
    temelKural: { baslik, detay, kaynak },           // ör. TUR-BV05: YKS'de lisans yerleşmesi → alana bağlı giriş
    kosullar: [{ id, baslik, detay, kaynak, kesinlik: "Doğrulandı"|"Yoruma açık"|"Doğrulanamadı" }],
    adimlar: [{
      id: "de-yks-yerlesme",
      baslik, detay, kaynak, kesinlik,
      zaman: { mezuniyetGore: 0, ay: 7, metin: "YKS yerleştirme sonuçları (Temmuz–Ağustos)" },  // mezuniyetGore: mezuniyet yılına göre yıl farkı (−1 = son sınıftan önceki yıl); ay 1–12; tarih doğrulanamıyorsa metin + kesinlik
      siniflar: ["11","12","mezun"] | null,            // adım hangi sınıflar için görünür (null = hepsi)
      tur: "sinav"|"belge"|"basvuru"|"karar"|"hazirlik",
      bagli: { sinav: "ielts-academic" } | { sablon: "de-uni-ap-yks-teyit" } | { sayfa: "universiteler.html#de" } | null,
      zorunlu: true|false
    }],
    belgeler: [{ id, ad, detay, kaynak, zorunlu }],   // ör. Lise diploması + yeminli tercüme, YKS yerleştirme belgesi
    sinavlar: { zorunlu: ["ielts-academic|toefl-ibt"], secmeli: [...], notlar: {...} },  // "a|b" = biri yeterli; id'ler data/mevzuat/sinavlar.js
    uyarilar: [{ metin, kaynak }],
    acikKararlar: [{ id: "K2", baslik, secenekler: [...], not }]
  },
  it: { ... aynı şema ... }
};
```
- Her `kaynak` resmi URL olmalıdır.
- Tarihler mezuniyet yılına göre görelidir. Böylece 9., 10., 11. ve 12. sınıf ve mezun öğrenci aynı veriden kendi tarihli takvimini alır.

### 8.2 Profil ve arayüz (sahibi: Ajan 11)
- **Profil:**
  - `ulkeler` alanı aynı kalır.
  - Yeni alan `aktifRota: "de"|"it"` (son seçilen rota).
  - Yeni alan `hedefAlan` (varsayılan "Mühendislik"). Almanya'da YKS yerleşmesi alana bağlı giriş verdiği için bu alan rotadaki uyarıda kullanılır.
- **`rota.html` ("Rotam"):**
  - İki ülke seçildiyse üstte rota seçici. Rota durumu adres satırında da tutulur: `rota.html?ulke=de`.
  - İçerik: temel kural, koşullar, sınıfa göre süzülmüş ve mezuniyet yılına göre tarihlenmiş adım zaman çizelgesi, belge kontrol listesi, rotanın sınavları (zorunlu / seçmeli), açık kararlar.
  - Her adımda: "yapıldı" işaretleme, ilgili sınav/şablon/sayfa bağlantısı, kesinlik rozeti, kaynak.
- **Durum deposu:** `apmeberra:rota:v1` = `{ de: { adimlar: { <adimId>: { durum: "yapildi"|"bekliyor", tarih } }, belgeler: { <id>: bool } }, it: {...} }`
- **Rota bağlamı diğer sayfalarda da işler:**
  - **Panel:** yol haritası aktif rotanın ilk bekleyen adımlarını gösterir; rota sekmesi vardır.
  - **Sınavlar:** aktif rotaya göre "Bu rotada zorunlu" / "Seçmeli" rozetleri.
  - **Yazışmalar:** aktif rotanın şablonları önce gelir.
  - **Üniversitelerim:** aktif rotanın sekmesi açık gelir.
  - **KMK denetleyicisi:** yalnızca Almanya rotasında görünür, "ABD diploması kuralı; bilgi amaçlı" notuyla.
- **Menü:** "Rotam" en üst sıralarda yer alır (Panelim'den sonra).

### 8.3 K2 ve K3 kararları (kullanıcı, 12 Ekim 2026)
- **K2 kapandı:**
  - AP Physics C (Mechanics + E&M) ve AP Chemistry iki ayrı derstir; öğrenci ikisini de alabilir. Bir "ya o ya bu" kararı yoktur.
  - Almanya rotasında ikisi de KMK fen dersi şartını karşılar.
  - İkisi birlikte alınırsa biri fen dersi sayılır. Diğerinin 4. "ek ders" sayılması anabin'de Yoruma açık; güvenli 4. ders CS A ya da Micro + Macro.
  - Physics 1 fen dersi sayılmaz.
  - KMK kuralı Türk diplomasına giriş hakkı vermediği için bu yalnızca uyum ve profil gücü bilgisidir.
  - Ders seçimi öğrencinin yük planına bırakılır.
  - Arayüzde K2 "açık karar" olarak gösterilmez; Almanya rotasında yukarıdaki bilgi notu olur.
- **K3 kapandı:**
  - Kasım/Aralık 2026 CEnT-S oturumuna **prova olarak girilecek.** Bu bir resmi başvuru değildir; sonucu 2028/29 kaydında kullanılmaz.
  - İtalya rotasında "Prova CEnT-S (11. sınıf)" adımı olarak gösterilir: `zorunlu: false`, `siniflar: ["11"]`, not: "Resmi başvuru değil; sınav deneyimi ve seviye ölçümü".
  - "Açık karar" olarak gösterilmez.
- Sonuç: Rota verisinde `acikKararlar` dizisi boş kalabilir.

## 9. Proje Adı Değişikliği (kullanıcı kararı, 12 Ekim 2026)
- Görünen proje adı **"AP MEBERRA" → "AP MEBERRA"** oldu.
- Sabit metinlerdeki öğrenci adı **"Meberra" → "Meberra"** oldu. Türkçe ekler aynı kalır: Meberra'nın, Meberra'ya, Meberra'yı.
- **DEĞİŞMEYENLER:**
  - Klasör yolu: `Desktop\projelerim\AP AZRA`
  - localStorage anahtarları: `apmeberra:*`, `apmeberra-hesap:*`. Değişirse mevcut ilerleme kaybolur.
  - Kod adları: `APMEBERRA_*`, `window.APMEBERRA`
  - Geçmiş tarihli rapor ve karar notu dosyaları, tarihsel kayıt olarak
- Yeni yazılan her metin yeni adı kullanır. Mevcut dosyalardaki toplu değişikliği PM yapar.

## 10. "Doğrulanamadı" Tamamlama Turu — Tur 8 (kullanıcı isteği, 12 Ekim 2026)
Her "Doğrulanamadı" maddesi yeniden araştırılır ve şu dört sonuçtan birine bağlanır:

| Sonuç | `kesinlik` değeri | Ne yazılır |
| :--- | :--- | :--- |
| Resmi kaynak bulundu | `"Doğrulandı"` | Yeni bilgi + resmi URL + belge yılı |
| Kaynaklar çelişiyor / muğlak | `"Yoruma açık"` | İki okuma + iki kaynak |
| Resmi belge HENÜZ YAYIMLANMADI (gelecek takvim, gelecek çağrı/genelge) | `"Yayımlanmadı"` (YENİ) | Son yayımlanmış yılın bilgisi "(20XX/YY'e göre)" + beklenen yayın dönemi + yayımlanacağı resmi sayfa URL'si |
| Bilgiyi yalnızca kurum verebilir | `"Teyit gerekir"` (YENİ) | Neyin sorulacağı + `data/kocluk/eposta-sablonlari.js` şablon id'si (varsa) |

- "Doğrulanamadı" etiketi yalnızca gerçekten araştırılıp hiçbir resmi iz bulunamayan maddede kalabilir. Bu durumda nerelere bakıldığı yazılır.
- **Takip listesi:** `.agents/mevzuat/takip-listesi.md`. "Yayımlanmadı" etiketli her madde buraya eklenir: ne bekleniyor, beklenen tarih, kontrol edilecek URL, etkilediği dosya ve id. Ajan 13 her turda bu listeyi kontrol eder.
- **Araştırma bulguları:** `.agents/mevzuat/dogrulama/bulgular-de.json` ve `bulgular-it.json`.
  - Şema: `[{dosya, konum, eskiMetin, yeniMetin, kesinlik, kaynak, belgeYili, erisim:"2026-10-12", not}]`
  - `konum` alanı: id veya alan yolu, ör. `ulkeler.js > it > universiteler[padova] > ucret`.
  - `eskiMetin`: dosyada aynen geçen metin parçası; uygulayıcı bununla bulur.
