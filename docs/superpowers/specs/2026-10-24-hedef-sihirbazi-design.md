# Hedef Sihirbazı — "Seç, gör, başla" (1.22.0) — Tasarım

Tarih: 2026-10-24 · Durum: taslak (sahip onayı bekliyor)
Onaylı görsel: `.superpowers/brainstorm/918-1792842983/content/akis-v2.html` (sahip: "tam bu, bu çizgide kodla").

## 1. Niyet ve neden

Sahibin gözlemi: ilk kez gelen öğrenciye site karışık geliyor. Bugün vitrinden "Ücretsiz başla" doğrudan
kayıt formuna gidiyor. Kayıttan sonra 5 adımlı bir profil sihirbazı geliyor. Ülkem ise tek ülke seçtirip uzun
bir sonuç sayfası açıyor.

Yeni akışta öğrenci kayıt olmadan önce şunları yapar:

1. Bir ya da birden fazla ülke seçer.
2. İsterse her ülkeden bir ya da birden fazla üniversite seçer ("Okul bilmiyorum, ülke yeter" de geçerli).
3. Seçtiklerinin şartlarını tek bir **karşılaştırma tablosunda** görür. Tablonun altında hepsine birden yeten
   **ortak yol** yazar (hangi AP'ler, hangi dil belgesi, hangi giriş sınavı, kaç hafta).
4. "Bu planı uygula" der. Hesap açar ve doğrudan **Bugün** ekranında ilk görevini görür.

Başarı ölçütü: ilk 60 saniyede "gidebilir miyim, ne yapmam lazım?" sorusu cevaplanır. Kayıt, öğrenci planını
kaydetmek istediği anda istenir. Kayıttan sonra ek sihirbaz adımı olmaz.

## 2. Hedefler / hedef olmayanlar / anti-hedefler

**Hedefler**

- Çoklu ülke ve çoklu üniversite seçimi, girişsiz.
- Her ekranın aynı boyda ve aynı iskelette olması: üstte renkli başlık ve ilerleme, ortada tek iş, altta tek
  turuncu düğme ve Dede Korkut.
- Enerjik bir görünüm: hareketli arka plan, zıplayan seçim kartları, XP sayacı, sonuçta hücrelerin tek tek açılması
  ve konfeti, kayıttan sonra kutlama.
- Tabloda yalnızca **kaynağı olan** bilgi gösterilir. Kaynak yoksa hücrede "? teyit et" yazar.
- Kayıt sonrası profil sihirbazı yerine sihirbazdaki seçimlerden profil kurulur ve plan hemen çalışır.

**Hedef olmayanlar**

- Yeni menü bölümü açılmaz (özellik dondurma, 2026-10-21). Sihirbaz Ülkem'in giriş ekranının yerini alır.
  Mevcut ülke ayrıntı sonucu sihirbazın altında, ülke çipiyle açılan "ayrıntı" olarak kalır.
- Üniversite başvuru takibi, belge listesi ve e-posta değişmez.
- Yüksek lisans (uni-mezun) bu akışa girmez. Gizli kalır, kod silinmez.

**Anti-hedefler (çalışsa bile başarısızlık sayılır)**

- Uydurma şart. Tabloda kaynağı olmayan bir IELTS eşiği ya da AP sayısı yazmak. `universite-isterleri.js`
  dosyasındaki kaynaksız sabit değerler bu tabloda **kullanılmaz**.
- "AP yeter" yanılgısı. Almanya'da YKS şartı gibi sert gerçekler tabloda ⚠️ olarak görünür olmalı.
- Kayıttan sonra öğrenciyi yine 5 adımlı sihirbaza atmak.
- Sonuç ekranının uzun metin duvarına dönmesi. Ayrıntı ancak tıklanınca açılır.

## 3. Kısıtlar (mevcut koddan)

- **Tek ülke varsayımı.** Ülkem şu an tek ülkelik (`sartlar.html:231` radio; `M.secimCoz`,
  `sartlar-motor.js:420`). Seçim yalnızca URL'de tutuluyor (`?model&sinif&ulke&dil`).
- **Seçimi kayda taşımak.** Kayıt sırasında `oturumYaz` → `onbellekTemizle` (`auth.js:887-914`) tüm
  `apmeberra:*` localStorage anahtarlarını siliyor. Sihirbaz seçimi bu yüzden **URL** ile ya da bu öneki
  kullanmayan bir `sessionStorage` anahtarıyla taşınmalı.
- **Profil kapısı.** `profile.tamamlandi` olmadan her sayfa `/profil`'e atıyor (`app.js:197`). Sihirbaz bu alanı
  doldurabilmeli. Profil, `PUT /api/profile` ile yazılan 20 KB'lık serbest bir JSON blobu; `ulkeler` sunucuda en
  çok 15, istemcide en çok 5.
- **Plan girdileri.** Plan `apDersleri [{ders, hedef}]` ve `sinavYili` alanlarından hesaplanıyor
  (`server/plan.js:115-153`). Hedef ülke ve üniversite plana girmiyor. "Planı uygula" demek, ortak yoldaki
  AP'leri `apDersleri` alanına yazmak demek.
- **Veri.** 15 ülke, 202 üniversite var (`data/mevzuat/ulke/<cc>.js`, `universiteler.liste[]`). Üniversite başına
  yapılandırılmış şart alanı yok. Şartlar ülke maddelerinde serbest metin olarak duruyor (`ortak`, `en.gerekenler`,
  `apEtkisi`). Giriş ve dil sınavları `sinavlar.js` içinde ülke düzeyinde yapılandırılmış.
- **Kutlama kodu.** `kutlama.js` (konfeti, XP uçurma, sayaç) ve `maskot.js` var ama `sartlar.html` ve
  `giris.html` bunları yüklemiyor.
- **Yayın kuralları.** Her geliştirme semver + CHANGELOG + etiket gerektirir. Bu iş **1.22.0** olacak.

## 4. Kararlaştırılan "nasıl"

### 4.1 Akış ve ekranlar (onaylı mockup)

| # | Ekran | İçerik | Düğme |
|---|-------|--------|-------|
| 1 | Ülke | 15 bayrak kartı, çoklu seçim, kartta "N okul". Sayaç: "🌍 2 ülke · 40 üniversite seni bekliyor". Korkut (selam): "Önce yönümüzü belirleyelim." | Devam et → |
| 2 | Okul (isteğe bağlı) | Arama kutusu; seçilen ülkelere göre gruplanmış üniversite kartları (kısaltma rozeti, şehir, QS sırası, onay kutusu). Kesik çizgili "🤷 Okul bilmiyorum, ülke yeter". | Tablomu göster ✨ |
| 3 | Sonuç | Karşılaştırma tablosu (§4.2), "🧭 Hepsine birden yeten yol" kartı (AP çipleri, dil, sınav, kalan hafta sayacı), konfeti. | Bu planı uygula 🚀 |
| 4 | Kayıt → Bugün | Mevcut kayıt formu. Ardından Bugün'de kutlama: Korkut (kutlama) ilerleme halkasında, seri, XP ve ilk görev kartı. | Hadi başla ▶ |

- Ekranlar 1-3 `/ulkem` adresinde tek sayfa adımları olarak çalışır. Adım URL'ye yazılır, böylece geri tuşu çalışır.
- Masaüstünde aynı iskelet ortalanmış tek bir kart olarak gösterilir (en çok ~720 px). Arka planda hareketli
  renk bulutları olur.
- Vitrindeki "Ücretsiz başla" düğmesi `/giris#kayit` yerine `/ulkem` adresine gider.
- `prefers-reduced-motion` açıksa tüm hareket kapanır. Bayrak kartları klavyeyle seçilebilir (checkbox semantiği).
- Giriş yapmış kullanıcı `/ulkem` açtığında sihirbaz profildeki ülke ve okullarla dolu gelir ve doğrudan
  3. adımı gösterir.

### 4.2 Karşılaştırma tablosu

- **Sütunlar.** Seçilen her üniversite bir sütundur. Okul seçilmemiş ülke kendi ülke sütunu olur
  ("🇮🇹 İtalya (genel)"). Mobilde 2'den fazla sütun varsa ilk sütun sabit kalır ve tablo yatay kayar.
- **Satırlar.** Lise diploması yeterli mi · YKS gerekir mi · AP (kaç tane, hangileri) · Giriş sınavı · Dil belgesi
  (en düşük eşik) · Başvuru dönemi.
- **Hücre durumu.** ✅ uygun/gerekmez · ⚠️ ek şart · ❌ bu yol kapalı · ❔ teyit et (veri yok). Hücreye
  dokununca tek satırlık açıklama ve kaynak bağlantısı açılır.
- **Ortak yol.** AP için seçilenlerin istediği en büyük sayı ve derslerin birleşimi alınır. Dil için en yüksek
  eşik, giriş sınavları için birleşim alınır. YKS bir sütunda bile gerekiyorsa uyarı olarak eklenir. Kalan hafta
  sınıfa göre en yakın AP Mayıs sınavına kadar hesaplanır.
- **Sınıf ve alan (sahip kararı, 2026-10-24).** Sonuç ekranının başında iki küçük çip satırı olur:
  - Sınıf: 9 · 10 · 11 · 12 · Mezun (varsayılan 11).
  - Alan: Mühendislik · Tıp/Sağlık · İşletme/Ekonomi · Fen (varsayılan Mühendislik).

  Çip değişince tablo ve hafta sayacı canlı güncellenir. Ekran sayısı artmaz. Eski "Son bir soru" kutusunun
  yerini bu satırlar alır. Alan, profile `hedefAlan` olarak yazılır.

### 4.3 Yeni veri katmanı: yapılandırılmış isterler

Tablo serbest metinden üretilemez. Bu yüzden yeni bir kaynak dosyası eklenir:
`data/mevzuat/kaynak/isterler-<cc>.json`. Üretici bunu `ulke/<cc>.js` içine `isterler` anahtarı olarak ekler.

```json
{
  "ulke": "it",
  "varsayilan": {
    "diploma": { "durum": "ok", "metin": "...", "kaynak": [{ "ad": "...", "url": "..." }], "kesinlik": "resmi" },
    "yks":     { "durum": "ok|uyari|kapali|teyit", "metin": "...", "kaynak": [], "kesinlik": "..." },
    "ap":      { "durum": "...", "sayi": 2, "dersler": ["ap-calculus", "ap-physics"], "metin": "...", "kaynak": [] },
    "sinav":   { "durum": "...", "sinavlar": ["cent-s"], "metin": "...", "kaynak": [] },
    "dil":     { "durum": "...", "belge": "IELTS", "esik": 6.0, "metin": "...", "kaynak": [] },
    "donem":   { "durum": "...", "metin": "Şubat–Nisan", "kaynak": [] }
  },
  "universite": {
    "it-politecnico-di-milano": { "sinav": { "...": "..." }, "dil": { "...": "..." } }
  }
}
```

- **Alana göre.** `varsayilan` ve her `universite` kaydı isteğe bağlı bir `alanlar: {muhendislik|tip|isletme|fen:
  {satır: …}}` alt nesnesi taşır. Çözüm sırası: üniversite+alan → üniversite → ülke+alan → ülke varsayılanı →
  `teyit`. Alanın varsayılan AP seti `hedef-motor.js` içinde sabittir (mühendislik: calculus-ab, physics-1,
  chemistry; tıp: biology, chemistry, calculus-ab; işletme: calculus-ab, microeconomics, macroeconomics; fen:
  calculus-ab, chemistry, biology). Bu set şart değil, öneri olarak etiketlenir.
- Üniversite kaydı yalnızca farklı olan satırları ezer. Kimlik `APMEBERRA_EPOSTA.universiteKimligi` ile üretilir.
- **Doldurma kuralı.** Her değer mevcut kaynaklı maddelerden (`ortak`, `en.gerekenler`, `apEtkisi`, `sinavlar.js`,
  `ulke-rotalari.js`) türetilir ve o maddenin `kaynak` ve `kesinlik` bilgisini taşır. Durumları uygulayıcı
  belirler. Sahip ayrı bir veri onayı istemedi (2026-10-24): emin olunmayan her hücre `teyit` olarak yayına çıkar. Kaynağı olmayan alan
  `"durum": "teyit"` olur. 1.22.0'da 15 ülkenin `varsayilan` kaydı doldurulur, üniversite özel kayıtları ise
  verisi olanlarla sınırlı kalır (en az DE, IT, NL için mevcut maddeler).
- `araclar/ulke-veri-olustur.js --kontrol` şunları denetler: her satırda `durum` var mı, her ok/uyari/kapali
  değerinin kaynağı var mı, `ap.dersler` geçerli kodlar mı (`ap-hedef.js`), `sinav.sinavlar` `sinavlar.js` içinde
  var mı.

### 4.4 Motor

`assets/js/hedef-motor.js` saf bir UMD modülü olur (Node + tarayıcı), `sartlar-motor.js` deseninde:

- `sutunlar(secim, veri)`: seçim `{ulkeler: [cc], okullar: {cc: [uniId]}}` alır ve sütun listesi döndürür.
- `hucre(ulkeVeri, uniId, satir)`: üniversite kaydı varsa onu, yoksa ülke varsayılanını döndürür.
- `ortakYol(sutunlar, sinif, bugun)`: `{apDersleri, apSayi, dil, sinavlar, yksUyari, haftaKaldi, sinavYili}` döndürür.
- `secimAdres` / `secimCoz` çoklu seçimi URL'de taşır: `?u=it,de&o=it-politecnico-di-milano,de-tum&s=11`.

### 4.5 "Bu planı uygula" ve kayıt

- Misafir için düğme `/giris?donus=/bugun&hedef=<kodlanmış seçim>#kayit` adresine gider. Seçim ayrıca
  `sessionStorage["meberra-hedef"]` anahtarına yazılır (`apmeberra:` öneki **değil**, temizlenmesin diye).
- Kayıt başarılı olunca `giris.html` `/profil` yerine şu adımları izler:
  1. Profili şu alanlarla doldurur ve `PUT /api/profile` ile kaydeder: `ogrenciModeli` (sınıf → lise, Mezun →
     lise-mezun), `sinif`, `ulkeler` (ilk 5), `aktifRota` (ilk ülke), `egitimDili: "en"`, `apDersleri` (ortak
     yoldan, hedef 4), `sinavYili`, `hedefOkullar` (uniId listesi), `tamamlandi: true`.
  2. Okulları "Listem"e ekler (`apmeberra:panel:v1.universitelerim` mekanizması, `PUT /api/state`).
  3. `/bugun?ilk=1` adresine gider. Bugün ekranı `ilk=1` görünce `MeberraKutlama.kutla({tur: "hedef", buyuk: true})`
     çalıştırır ve plan görevini öne çıkarır (mevcut 5d bloğu).
- Sihirbazı kullanmadan kayıt olan (doğrudan `/giris#kayit`) eski 5 adımlı profil akışına düşer. Bu akış silinmez.
- Giriş yapmış kullanıcı "Bu planı uygula" derse profil güncellenir. `apDersleri` alanında var olan dersler
  korunur ve ortak yoldakiler eklenir.

### 4.6 Görsel dil

`akis-v2.html` esas alınır: mor degrade başlık (`--hero-a/--hero-b`), turuncu 3D düğme (`--energy`, alt gölge
ve parıltı), Nunito, yuvarlak kartlar, yeşil onay rozeti, sonuç ekranında turuncu-pembe başlık, konfeti, XP rozeti
ve gerçek Korkut SVG'leri (`selam`, `dusunen`, `kutlama`). Stiller yeni `assets/css/hedef.css` dosyasında toplanır.
`ulkem.css` dosyasındaki giriş ekranı kuralları kaldırılır. Koyu tema mevcut belirteçlerle çalışır.

### 4.7 Netleştirmeler (tasarımcının kararları — sahip okurken kontrol eder)

- **AP kodları.** `isterler.ap.dersler` alanı `ap-hedef.js` kodlarını kullanır (`calculus-ab`, `physics-1`...),
  sayfa kimliklerini kullanmaz. Kaynak yalnızca "N ilgili AP" diyorsa `dersler` boş kalır ve `sayi` dolar.
  `ortakYol` eksik kalan sayıyı alanın varsayılan AP setinden tamamlar. Ortak yol hiç AP istemiyorsa (ör.
  Almanya'da AP giriş hakkı vermez) yine alanın varsayılan seti önerilir, kartta da "AP burada şart değil,
  başvurunu güçlendirir" yazar. Böylece `apDersleri` hiçbir zaman boş kalmaz ve Bugün ekranında her zaman bir
  görev olur.
- **Ülke sütunu.** "Genel" sütun ülkenin genel kuralını gösterir. Eşik okuldan okula değişiyorsa aralık yazılır
  ("IELTS 6.0–6.5"). Ortak yol aralığın üst ucunu alır.
- **Eski bağlantılar.** `/ulkem?ulke=de` sihirbazı 3. adımda, o ülke seçili olarak açar. `model=lise-mezun`
  Mezun çipine, `sinif=` sınıf çipine eşlenir. Eski `SECIM` → `/profil` yolu sihirbazsız kayıt için kalır.
  Yeni `hedef=` yolu ondan önce gelir.
- **Giriş yapmış kullanıcıda birleştirme.**
  - `ulkeler`: yeniler başa eklenir, en çok 5.
  - `hedefOkullar` ve Listem: birleşim alınır.
  - `apDersleri`: var olan dersler korunur, eksikler hedef 4 ile eklenir.
  - `sinif`, `ogrenciModeli`, `aktifRota`, `sinavYili`: yalnızca boşsa yazılır.
  - Uygulamadan önce "Planına 2 ülke, 3 ders eklenecek" özeti gösterilir.
- **`hedef=` ile giriş yapan.** Seçim, giriş yapmış kullanıcıdaki birleştirme kurallarıyla aynı şekilde
  uygulanır. Ardından `/bugun?ilk=1` adresine gidilir.

## 5. Uygulayıcıya bırakılanlar

- Adım geçiş animasyonunun ayrıntısı, kart düzeninin kırılım noktaları, arama kutusunun eşleştirme yöntemi
  (aksan duyarsız önerilir).
- XP rozetinin sihirbaz içinde sadece görsel mi olacağı, yoksa `oyun.js` ile gerçek XP mi yazacağı.
  Önerilen: girişsiz kullanıcıda sadece görsel olsun, kayıttan sonra ilk görev için `GOREV_XP` verilsin.
- Teyit hücrelerinin kopyası ("Bu okul için resmi sayfayı kontrol et" + bağlantı).

## 6. Test ve teslim

- **Birim testi:** `araclar/testler/hedef-birim-test.js` şunları kapsar: sutunlar, hücre ezme, ortakYol
  (maksimum AP, birleşim, en yüksek dil eşiği, YKS uyarısı, hafta hesabı) ve URL gidiş-dönüşü.
- **Veri denetimi:** `node araclar/ulke-veri-olustur.js --kontrol` isterler kurallarıyla birlikte 0 sorun vermeli.
- **E2E:** yeni `e2e/hedef.spec.js` şu akışı dener: `/ulkem` → İtalya + Almanya → PoliMi + TUM → tablo ve ortak
  yol → "Bu planı uygula" → kayıt → `/bugun?ilk=1` kutlama ve plan görevi → `/api/me` profilinde `ulkeler`,
  `apDersleri`, `tamamlandi`. Ayrıca bir "Okul bilmiyorum" yolu da denenir. Mevcut `e2e/ogrenci.spec.js`
  (eski sihirbaz) geçmeye devam eder.
- **Teslim:** `package.json` 1.22.0, CHANGELOG girdisi, `v1.22.0` etiketi, HARITA.md'ye yeni dosyalar.
  `.superpowers/` klasörü `.gitignore`'a eklenir.
