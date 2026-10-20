# Tur 14 — Üniversiteye İlk Başvuru E-postası: Veri Sözleşmesi ve Arayüz Önerisi (Ajan 14, Faz 1)

**Tarih:** 19 Ekim 2026 · **Hazırlayan:** Ajan 14 (`eposta-uzmani`) · **Onay:** Lead PM (bekliyor) · **Arayüz uygulayıcısı:** Ajan 11 (Faz 2)

**Kullanıcı talebi (19 Ekim 2026):** Kayıtlı öğrenci bir üniversite seçtiğinde, o üniversiteye gidecek ilk başvuru e-postası otomatik ve prosedüre uygun biçimde hazırlanmalı. Metin İngilizce olacak, öğrenci bilgileriyle dolu gelecek ve hazır şablonlardan üretilecek.

## 0. Kaynak dürüstlüğü (PM notu, 19 Ekim 2026)

**Gerçek e-posta örneği YOK.** Kullanıcı, daha önce gönderilmiş gerçek bir e-posta örneği bulunmadığını teyit etti. Bu yüzden:
- `kaynaklar/eposta-ornekleri/ham/` klasörü boştur ve boş kalacaktır.
- Şablonlar **yalnızca** resmi yönergelere dayanır. Bu yönergeler `kaynaklar/eposta-ornekleri/anonim/yonergeler.md` dosyasındadır: Y1–Y11, URL'leri ve erişim tarihi (19 Ekim 2026) ile.
- Her şablonun `dayanak` alanında yalnızca bu yönergelerin URL'leri vardır. Hiçbir dosyada "gerçek örnekten türetildi" iddiası yoktur; birim testi de bunu denetler.

## 1. Faz 1'de teslim edilenler

| Dosya | İçerik |
| :--- | :--- |
| `kaynaklar/eposta-ornekleri/anonim/yonergeler.md` | 11 resmi yönerge (Y1–Y11) ve bunlardan damıtılan 10 kural (K1–K10) |
| `data/kocluk/ilk-basvuru-sablonlari.js` | 36 şablon. Tarayıcıda `window.APMEBERRA_ILK_BASVURU_SABLONLARI` olarak, Node'da `module.exports` olarak yüklenir. |
| `assets/js/eposta.js` (1.1.0) | Koşullu blok desteği ve `ilkBasvuruHazirla()` ile yardımcıları. Mevcut API korunur, geriye uyumludur. |
| `araclar/testler/ilk-basvuru-birim-test.js` | 3 model × 7 ülke × 2 gerçek üniversite × 3 sınav durumu × 2 amaç = 252 üretim |

### 1.1 Şablon matrisi (36)

- **Amaç (2):** `ilk-iletisim`, `takip`.
- **Model (3):** `lise`, `lise-mezun`, `uni-mezun`.
- **Ülke (6):**
  - `*` (genel): AT, CH, BE, ES, FI, DK, IE, HU, PL, CZ bunu kullanır.
  - Ülke varyantları:
    - `de`: doğrudan başvuru mu, uni-assist mi, VPD gerekiyor mu?
    - `it`: giriş testi ve Universitaly ön kaydının sırası.
    - `nl`: Studielink'ten sonraki adım.
    - `fr`: Études en France mı, doğrudan başvuru mu?
    - `se`: universityadmissions.se ve uygunluk değerlendirmesi.
- **Kimlik biçimi:** `ilk-<ülke|genel>-<model>` ve `takip-<ülke|genel>-<model>`. Örnek: `ilk-de-lise`, `takip-genel-uni-mezun`.
- **Seçim önceliği:** amaç ve model birebir eşleşmelidir. Bu koşulu sağlayanlar arasında ülke varyantı genel şablondan önce gelir.

**Şablon alanları:**
- `id`, `baslik` (TR)
- `amac`, `modeller[]`, `ulke` ("*" ya da ülke kodu)
- `dil: "en"`, `konu`, `govde`
- `zorunluAlanlar[]`
- `dayanak[]`: yalnızca yönerge URL'leri
- `not` (TR): prosedür ya da resmi kanal uyarısı
- `alici.not`, `guncelleme`

## 2. Motor API'si (assets/js/eposta.js)

```js
APMEBERRA_EPOSTA.ilkBasvuruHazirla(profil, kullanici, universite, ulkeKod, amac /* "ilk-iletisim" | "takip" */, secenek?)
// secenek: { bugun?, program?: {ad}, sinavlarim?: [sinavId], sinavKatalogu?, ilkGonderim?: "YYYY-MM-DD" (takip için),
//            sablonlar?, epostaSablonlari?, teyitTaslaklari?, ulkeler? }  — tarayıcıda window.* varsayılanları kullanılır
// Dönüş:
{
  sablonId: "ilk-de-lise", amac, model, ulke, universiteId: "de-technical-university-of-munich",
  konu, govde,                       // İngilizce, doldurulmuş
  alici: { kurum, eposta|null, iletisimSayfasi|null, kaynak|null, not|null, cozum },
  eksikler: ["ogrenci.okul", ...],   // boşsa metin hazır; doluysa metinde "[eksik: yol]" görünür
  kelimeSayisi, hazir: eksikler.length === 0,
  mailto: { url, uzunluk, uzun },    // alıcı yoksa "mailto:?subject=…"
  uyarilar: ["…"],                   // Türkçe: kaynaklı adres yok, lisans alanı Türkçe, kelime sınırı dışı
  not: "…",                          // şablonun prosedür notu (Türkçe)
  dayanak: ["https://…"]             // yönerge URL'leri
}
```

**Yardımcılar:**
- `ilkBasvuruSablonSec(liste, model, ulke, amac)`
- `ilkBasvuruSablonDogrula(s)`
- `ilkBasvuruAlicisi(uni, ulke, model, kaynaklar)`
- `universiteKimligi(ulke, uni)`
- `universiteBul(APMEBERRA_ULKE_VERI, kimlik)`
- `kosullariCoz(metin, degiskenler)`
- `kelimeSay(metin)`

**Koşullu blok:** `{{#if yol}} … {{else}} … {{/if}}`. Bloklar iç içe olabilir. Boş metin, boş dizi ve tanımsız değer "yanlış" sayılır. Koşul içindeki boş alan `eksikler` listesine girmez. Bu yüzden profilde olmayan belge (AP, dil sınavı, GPA, doğum tarihi) cümlesiyle birlikte metinden düşer. Koşul içermeyen eski şablonların çıktısı birebir aynı kalır; `eposta-birim-test.js` 119/119 geçer.

**Yeni değişkenler:** `degiskenler()` çıktısına yalnızca alan eklendi:
- `ogrenci.model`, `ogrenci.dilSinavlari`, `ogrenci.girisSinavlari`
- `ogrenci.lisansAlani`, `ogrenci.lisansUniversitesi`, `ogrenci.lisansMezuniyetYili`, `ogrenci.lisansMezun`, `ogrenci.lisansSonSinif`, `ogrenci.gpa4`
- `ogrenci.yksYerlesme`
- `program.dil` ("English-taught" ya da "German-taught" vb., profildeki `egitimDili` alanından)
- `basvuru.duzey` ("bachelor's" / "master's")
- `takip.ilkTarih`

**Alıcı çözümü:** Adres yalnızca kaynaklı bir kanaldan gelir. Sıra şöyledir:
1. `eposta-sablonlari.js` içindeki `alici.secenekler`: Ajan 13'ün doğruladığı DE adresleri. Üniversite, `ulkeler.js` kimliğiyle web alan adı üzerinden eşleştirilir.
2. `teyit-taslaklari.js` içinde aynı kuruma giden, aynı düzeyde ve `epostaKaynak` alanı dolu bir taslak.
3. İkisi de yoksa `eposta: null` olur ve üniversitenin `basvuruUrl`/`url` sayfası `iletisimSayfasi` olarak döner.

15 ülke listesindeki 202 üniversitenin 5'i bugün kaynaklı adresle çözülüyor:

| Üniversite | Adres | Kaynak |
| :--- | :--- | :--- |
| TUM | `studium@tum.de` | `eposta-sablonlari` |
| KIT | `admissions@carlbenzschool.kit.edu` | `eposta-sablonlari`; programa özel adres, bkz. §4 madde 4 |
| FAU | `zulassungsstelle-international@fau.de` | `eposta-sablonlari` |
| Sapienza | `hello@uniroma1.it` | `eposta-sablonlari` |
| TCD (yalnızca lisans) | `study@tcd.ie` | `teyit-taslaklari` |

Testteki 252 üretimin 30'unda alıcı adresi bu yolla bulundu. Ajan 13 adres düzeltmesini bitirdiğinde motor yeni adresleri değişiklik gerektirmeden kullanır.

**Üniversite kimliği:** `data/mevzuat/ulke/<cc>.js` listelerinde `id` alanı yok. Motor kalıcı bir kimlik üretir: `<cc>-<QS adı>`, örneğin `de-technical-university-of-munich` ya da `it-politecnico-di-milano`. 15 ülkenin tamamında kimlikler tekrarsızdır ve `universiteBul` her kimliği geri bulur.

## 3. Arayüz önerisi (Faz 2, Ajan 11; PM onayından sonra)

### 3.1 `yazismalar.html` — yeni bölüm "Üniversiteye ilk e-posta"
1. **Giriş kontrolü (K4 kararı):** Bölüm yalnızca giriş yapmış kullanıcıya açılır. Giriş yoksa "E-posta hazırlamak için giriş yap" kartı gösterilir; bağlantı `giris.html` sayfasına `next` parametresiyle (geri dönüş adresi) gider. Açık erişimde yalnızca ülke × sınıf şartları görünür.
2. **Seçiciler:**
   - Ülke: profildeki `ulkeler` listesi; varsayılan `aktifRota`.
   - Üniversite: `APMEBERRA_ULKE_VERI[cc].universiteler.liste`, QS sırasıyla.
   - Program (isteğe bağlı, serbest metin): boş bırakılırsa metin "your English-taught bachelor's programmes" der.
   - Amaç: "İlk iletişim" / "Takip". Takip seçilince "İlk e-postayı gönderdiğin tarih" alanı açılır; kayıt varsa geçmişteki `gonderim` tarihi kullanılır.
3. **Önizleme:**
   - Konu ve gövde düzenlenebilir alanlarda gösterilir.
   - Üstünde şunlar yer alır: kelime sayacı (120–220), `eksikler` için Türkçe etiketli "Profilini tamamla" bağlantıları (`E.KAYNAK` alanına göre profil sayfasına), `uyarilar`, şablonun `not` alanı ve "Dayanak" açılır listesi (yönerge URL'leri).
4. **Alıcı:**
   - Kaynaklı adres varsa adres ve kaynağı gösterilir (kaynak bağlantısıyla).
   - Yoksa "Bu üniversite için doğrulanmış e-posta adresi yok. Metni iletişim sayfasındaki forma yapıştır" yazar ve `iletisimSayfasi` bağlantısı verilir.
5. **Butonlar:**
   - Kopyala.
   - E-posta programında aç (`mailto`; `uzun` ise yalnızca kopyala önerilir).
   - Taslak olarak kaydet: `yeniKayit({sablonId, universiteId, programAd, konu, govde, alici})`, mevcut `apmeberra:yazisma:v1` deposuna.
   - Gönderildi olarak işaretle.
   - **Portal e-posta GÖNDERMEZ.**
6. **Hatırlatma (yönerge K4):** "Bu e-postayı başvuruda kullanacağın kendi adresinden gönder" (Y2, Y8).
7. **Derin bağlantı:** `yazismalar.html?uni=<universiteKimligi>&amac=ilk-iletisim`. Sayfa `E.universiteBul(APMEBERRA_ULKE_VERI, uni)` ile ülkeyi ve üniversiteyi seçili açar.
8. **Gerekli betikler:** `data/kocluk/ilk-basvuru-sablonlari.js` ve profildeki ülkelerin `data/mevzuat/ulke/<cc>.js` dosyaları. `ulkeler.js`, `eposta-sablonlari.js` ve `teyit-taslaklari.js` zaten yükleniyor.

### 3.2 `sartlar.html` (ve `universiteler.html`) — üniversite kartı
- Her kartta `✉️ İlk e-posta` bağlantısı bulunur. Hedef: `yazismalar.html?uni=<E.universiteKimligi(cc, u)>&amac=ilk-iletisim`. Kart listesi `sartlar.html` satır 398–446 ve `universiteler.html` satır 291–316 civarında üretiliyor.
- Kullanıcı giriş yapmamışsa bağlantı giriş sayfasına `next` parametresiyle gider (K4 kararı).

### 3.3 Ekran yeniden planlama (AGENTS.md §2.1-8)
Ajan 11, bölümü mevcut "Hazır teyit taslakları" ve "Kişisel şablonlar" bölümleriyle birlikte yeniden değerlendirmeli.

**Öneri:** Sayfa üç sekmeye ayrılsın:
1. Üniversiteye ilk e-posta (varsayılan),
2. Teyit taslakları,
3. Yazışma geçmişi.

Düzen 1280 px ve 360 px genişlikte doğrulanmalı.

## 4. Faz 2 için açıklar
1. **Adres kapsamı:** DE dışındaki üniversitelerin çoğunda kaynaklı adres yok. Ajan 13'ün `.agents/mevzuat/` düzeltmesinden sonra `alici.secenekler` benzeri bir yapı 15 ülkeye genişletilmeli. Önerilen dosya `data/kocluk/universite-iletisim.js`; `universiteKimligi` ile anahtarlanır ve kaynak URL zorunludur.
2. **Lisans alanı Türkçe:** Profildeki `lisansAlani` Türkçe girilebiliyor ("Makine Mühendisliği"). Motor uyarı veriyor. Profile isteğe bağlı bir `lisansAlaniEn` alanı eklenmesi önerilir; bu `auth.js` değişikliği Ajan 11'indir.
3. **Program listesi:** Ülke verisinde program adları yalnızca not metninde var. Program seçici şimdilik serbest metin olmalı.
4. **KIT eşleşmesi:** Motor, KIT için Carl Benz School kabul adresini (`alici.secenekler`, yalnızca Mechanical Engineering (International) programı için) bulabilir; `not` alanı bunu gösterir. Programa özel adreslerin genel ilk e-postada kullanılıp kullanılmayacağına Ajan 13 karar vermeli.
5. **Gerçek örnek akışı:** Kullanıcı ileride gönderilmiş bir e-posta ve gelen cevabı `ham/` klasörüne eklerse, Ajan 14 bunları anonimleştirip yönergelere ekler ve dayanakları günceller. O zamana kadar şablonlar yalnızca yönergeye dayalıdır.
6. **Takip zamanı:** "10 iş günü" proje kuralıdır; kaynaklarda böyle bir süre yok. Arayüz, ilk gönderimden 10 iş günü sonra yazışma geçmişinde "Takip e-postası hazırla" önerisini gösterebilir.
7. **Claire Bennett dil incelemesi:** Şablon metinleri Kural 13 incelemesine sunulmalı (İngiliz akademik üslubu, "programme" yazımı).

## 5. Örnek çıktılar (kurgusal profil: Ayşe Yılmaz; bugün = 19 Ekim 2026; program seçilmedi)

**Kurgusal profiller:**
- **Lise öğrencisi:** 11. sınıf, Kadıköy Anadolu Lisesi, İstanbul. Doğum tarihi 2009-03-02. Sınavlarım: AP Calculus AB, AP Physics 1, IELTS.
- **Lise mezunu:** 2025 mezunu, hedef başlangıç 2027, YKS yerleşmesi var. Doğum tarihi girilmemiş. Sınavlarım: IELTS.
- **Üniversite mezunu:** Yildiz Technical University, Mechanical Engineering, son sınıf, beklenen mezuniyet 2027, GPA 3.4. Sınavlarım: TOEFL iBT.

#### lise × Technische Universität München (de-technical-university-of-munich)

- Şablon: `ilk-de-lise` · kelime: 187 · eksikler: [] · alıcı: `studium@tum.de` (kaynak: https://www.tum.de/en/studies/international-students/application-and-admission)

```text
Subject: Prospective bachelor's applicant (Turkish high school student) – English-taught programmes, winter semester 2028/29

Dear Admissions Team,

My name is Ayşe Yılmaz. I am a Grade 11 student at Kadıköy Anadolu Lisesi in Istanbul, Türkiye, and I expect to receive the Turkish high school diploma (Lise Diplomasi) in June 2028. I am interested in your English-taught bachelor's programmes at Technische Universität München, starting in the winter semester 2028/29.

I have read your admission pages but could not find a clear answer to these questions:

1. Does your university evaluate a Turkish Lise Diplomasi itself, or should I apply through uni-assist, and is a uni-assist VPD required?
2. Which documents do you require to establish a higher education entrance qualification with a Turkish Lise Diplomasi (for example, YKS results and placement), and can a document published after your deadline be submitted later?
3. Which application deadline applies to international applicants for the winter semester 2028/29?

Advanced Placement (AP) examinations, taken or planned: AP Calculus AB and AP Physics 1: Algebra-Based. Language tests, taken or planned: IELTS Academic.

Thank you for your time. I will submit all documents through the official application portal.

Kind regards,
Ayşe Yılmaz
Date of birth: 2 March 2009
```

#### lise × Politecnico di Milano (it-politecnico-di-milano)

- Şablon: `ilk-it-lise` · kelime: 192 · eksikler: [] · alıcı: e-posta yok → https://www.polimi.it/en/prospective-students/how-to-apply

```text
Subject: Prospective bachelor's applicant (Turkish high school student) – English-taught programmes, academic year 2028/29

Dear Admissions Team,

My name is Ayşe Yılmaz. I am a Grade 11 student at Kadıköy Anadolu Lisesi in Istanbul, Türkiye, and I expect to receive the Turkish high school diploma (Lise Diplomasi) in June 2028. I am interested in your English-taught bachelor's programmes at Politecnico di Milano, starting in the academic year 2028/29.

I have read your admission pages but could not find a clear answer to these questions:

1. Does admission to these programmes require an entrance test (for example, a CISIA test or your own test), and when can international applicants take it for the academic year 2028/29?
2. After an admission decision, should I complete the pre-enrolment on Universitaly, and what is your deadline for it?
3. Is the Turkish Lise Diplomasi (12 years of schooling) accepted, and do you require a Declaration of Value or a CIMEA statement of comparability?

Advanced Placement (AP) examinations, taken or planned: AP Calculus AB and AP Physics 1: Algebra-Based. Language tests, taken or planned: IELTS Academic.

Thank you for your time. I will submit all documents through the official application portal.

Kind regards,
Ayşe Yılmaz
Date of birth: 2 March 2009
```

#### lise-mezun × Technische Universität München (de-technical-university-of-munich)

- Şablon: `ilk-de-lise-mezun` · kelime: 168 · eksikler: [] · alıcı: `studium@tum.de` (kaynak: https://www.tum.de/en/studies/international-students/application-and-admission)

```text
Subject: Prospective bachelor's applicant (Turkish high school graduate) – English-taught programmes, winter semester 2027/28

Dear Admissions Team,

My name is Ayşe Yılmaz. I graduated from Kadıköy Anadolu Lisesi in Istanbul, Türkiye, in June 2025 with the Turkish high school diploma (Lise Diplomasi). I have also been placed in a four-year Lisans programme through the Turkish university entrance examination (YKS). I am interested in your English-taught bachelor's programmes at Technische Universität München, starting in the winter semester 2027/28.

I have read your admission pages but could not find a clear answer to these questions:

1. Does your university evaluate a Turkish Lise Diplomasi itself, or should I apply through uni-assist, and is a uni-assist VPD required?
2. Which documents do you require from an applicant with a Turkish Lise Diplomasi and a YKS placement to establish a higher education entrance qualification for these programmes?
3. Which application deadline applies to international applicants for the winter semester 2027/28?

Language tests, taken or planned: IELTS Academic.

Thank you for your time. I will submit all documents through the official application portal.

Kind regards,
Ayşe Yılmaz
```

#### lise-mezun × Politecnico di Milano (it-politecnico-di-milano)

- Şablon: `ilk-it-lise-mezun` · kelime: 163 · eksikler: [] · alıcı: e-posta yok → https://www.polimi.it/en/prospective-students/how-to-apply

```text
Subject: Prospective bachelor's applicant (Turkish high school graduate) – English-taught programmes, academic year 2027/28

Dear Admissions Team,

My name is Ayşe Yılmaz. I graduated from Kadıköy Anadolu Lisesi in Istanbul, Türkiye, in June 2025 with the Turkish high school diploma (Lise Diplomasi). I am interested in your English-taught bachelor's programmes at Politecnico di Milano, starting in the academic year 2027/28.

I have read your admission pages but could not find a clear answer to these questions:

1. Does admission to these programmes require an entrance test (for example, a CISIA test or your own test), and when can international applicants take it for the academic year 2027/28?
2. After an admission decision, should I complete the pre-enrolment on Universitaly, and what is your deadline for it?
3. Is the Turkish Lise Diplomasi (12 years of schooling) accepted, and do you require a Declaration of Value or a CIMEA statement of comparability?

Language tests, taken or planned: IELTS Academic.

Thank you for your time. I will submit all documents through the official application portal.

Kind regards,
Ayşe Yılmaz
```

#### uni-mezun × Technische Universität München (de-technical-university-of-munich)

- Şablon: `ilk-de-uni-mezun` · kelime: 171 · eksikler: [] · alıcı: `studium@tum.de` (kaynak: https://www.tum.de/en/studies/international-students/application-and-admission)

```text
Subject: Prospective master's applicant (Turkish bachelor's degree) – English-taught programmes, winter semester 2027/28

Dear Admissions Team,

My name is Ayşe Yılmaz. I am in the final year of a bachelor's degree in Mechanical Engineering at Yildiz Technical University in Türkiye and expect to graduate in 2027. My cumulative GPA is 3.40 out of 4.00. I am interested in your English-taught master's programmes at Technische Universität München, starting in the winter semester 2027/28.

I have read your admission pages but could not find a clear answer to these questions:

1. Should I apply directly to your university or through uni-assist, and is a uni-assist VPD required for a Turkish bachelor's degree?
2. Does my bachelor's degree in Mechanical Engineering meet the subject-specific entry requirements, and is a preliminary assessment possible before the formal application?
3. Can I apply before graduation with my current transcript, and which deadline applies for the winter semester 2027/28?

Language tests, taken or planned: TOEFL iBT.

Thank you for your time. I will submit all documents through the official application portal.

Kind regards,
Ayşe Yılmaz
Date of birth: 2 March 2004
```

#### uni-mezun × Politecnico di Milano (it-politecnico-di-milano)

- Şablon: `ilk-it-uni-mezun` · kelime: 169 · eksikler: [] · alıcı: e-posta yok → https://www.polimi.it/en/prospective-students/how-to-apply

```text
Subject: Prospective master's applicant (Turkish bachelor's degree) – English-taught programmes, academic year 2027/28

Dear Admissions Team,

My name is Ayşe Yılmaz. I am in the final year of a bachelor's degree in Mechanical Engineering at Yildiz Technical University in Türkiye and expect to graduate in 2027. My cumulative GPA is 3.40 out of 4.00. I am interested in your English-taught master's programmes at Politecnico di Milano, starting in the academic year 2027/28.

I have read your admission pages but could not find a clear answer to these questions:

1. Does my bachelor's degree in Mechanical Engineering meet the curricular requirements, and do you assess them before or during the call for applications?
2. After receiving an admission letter, should I complete the pre-enrolment on Universitaly, and what is your deadline for it?
3. Do you require a Declaration of Value or a CIMEA statement of comparability for my bachelor's degree?

Language tests, taken or planned: TOEFL iBT.

Thank you for your time. I will submit all documents through the official application portal.

Kind regards,
Ayşe Yılmaz
Date of birth: 2 March 2004
```

