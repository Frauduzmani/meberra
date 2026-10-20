# Karar Notu: "Ülkenin en iyi 20 üniversitesi" (İsveç, Finlandiya, Danimarka, İrlanda, Macaristan, Polonya, Çekya)
*Ajan 13 (Mevzuat Uzmanı) → Lead PM Dr. Aylin Kaya · Tur 11 · 15 Ekim 2026 · Bütün erişimler 15.10.2026*

Veri dosyaları: `.agents/mevzuat/dogrulama/uni-se.json`, `uni-fi.json`, `uni-dk.json`, `uni-ie.json`, `uni-hu.json`, `uni-pl.json`, `uni-cz.json`

---

## 1. Sonuç

1. **Sıralama kaynağı:** En güncel baskı **QS World University Rankings 2027**. 17–18 Haziran 2026'da yayımlandı. topuniversities.com ana sayfası 15.10.2026'da bu baskıyı gösteriyor (node 4153156). Ülke listeleri QS'nin kendi sıralama uç noktasından birebir alındı. **Doğrulandı.** Not: sitedeki meta veri "datePublished 2027-06-18" diyor; bu bir site hatası.
2. **Gerçek üniversite sayıları (QS 2027):** İsveç **9**, Finlandiya **9**, Danimarka **6**, İrlanda **8**, Macaristan **10**, Polonya **20** (tam 20), Çekya **16**. Toplam **78** üniversite. Polonya dışında her ülkede QS'deki üniversitelerin hepsi listede.
3. **İngilizce lisans en dar İskandinavya'da:**
   - Kopenhag'da İngilizce lisans hiç yok.
   - Chalmers'ta ve Åbo Akademi'de İngilizce lisans yok.
   - KTH, Linköping, DTU, Helsinki ve Turku'da yalnızca 1–2 İngilizce lisans programı var.
   - Yüksek lisans düzeyinde 78 üniversitenin 78'i de İngilizce program sunuyor.
4. **Yerel dilde ücret avantajı:**
   - **Çekya:** Çekçe eğitim uyruğa bakılmaksızın ücretsiz.
   - **Finlandiya:** Fince ve İsveççe programlar ücretsiz.
   - **Polonya:** Devlet sertifikasıyla en az C1 Lehçe belgeleyen yabancı, Polonya vatandaşıyla aynı koşullarda (ücretsiz) okur (PSWN md. 324).
   - **İsveç ve Danimarka:** AB dışı öğrenci yerel dilde de ücret öder.
5. **Doğrulanamayan alanlar:** Toplam **9 alan** "Doğrulanamadı" (312 dil/düzey hücresinin %2,9'u). Hepsi yerel dil hücresinde:
   - Macaristan 5 alan: felvi.hu bağlantıyı reddetti.
   - Polonya 4 alan: PULS ve Pollub sayfaları bot korumalı.

   Kesinlik dağılımı: **63 Doğrulandı, 15 Teyit gerekir.** Hiçbir üniversitede İngilizce durumu tahminle doldurulmadı.

### Ülke başı özet

| Ülke | Üni | Lisans EN (var/kısıtlı/yok) | Lisans yerel | YL EN | YL yerel | Doğrulanamadı | Kesinlik (D/T) |
| :-- | --: | :-- | :-- | :-- | :-- | --: | :-- |
| İsveç | 9 | 6 / 2 / 1 | 9 var | 9 var | 9 var | 0 | 9 / 0 |
| Finlandiya | 9 | 6 / 2 / 1 | 9 var | 9 var | 8 var, 1 kısıtlı (Aalto) | 0 | 9 / 0 |
| Danimarka | 6 | 4 / 1 / 1 | 6 var | 6 var | 5 var, 1 yok (DTU) | 0 | 4 / 2 |
| İrlanda | 8 | 8 / 0 / 0 | 8 var (yerel = İngilizce) | 8 var | 8 var | 0 | 8 / 0 |
| Macaristan | 10 | 10 / 0 / 0 | 8 var | 10 var | 7 var | 5 | 6 / 4 |
| Polonya | 20 | 17 / 3 / 0 | 18 var | 19 var, 1 kısıtlı | 18 var | 4 | 15 / 5 |
| Çekya | 16 | 12 / 4 / 0 | 16 var | 16 var | 16 var | 0 | 12 / 4 |

**Kural ("var/kısıtlı/yok"):**
- **var:** O düzeyde, o dilde en az 3 ayrı program.
- **kısıtlı:** 1–2 program.
- **yok:** Resmi katalogda hiç program yok.

Tüm sayılar resmi kataloglardan alındı:
- **İsveç:** universityadmissions.se ve antagning.se API'si. İngilizce sayılar Güz 2027 turu, İsveççe sayılar Güz 2026 ulusal turu.
- **Finlandiya:** Studyinfo (Opintopolku) API'si.
- **Danimarka:** Study in Denmark API'si ve üniversite sayfaları.
- **Macaristan:** Tempus/Study in Hungary programı bulucusu.
- **Polonya:** NAWA study.gov.pl programı bulucusu.
- **Çekya:** studyin.gov.cz.
- **İrlanda:** Üniversitelerin ders katalogları.

### Ülke notları (Türk öğrenciye uygulanmış)

- **İsveç:**
  - İngilizce lisans: Lund 7, Uppsala 9, Gothenburg 10, Malmö 6, Stockholm 6, Umeå 3.
  - Mühendislikte İngilizce lisans neredeyse yok. KTH'de yalnızca ICT var; Chalmers'ta 0, LiU'da 1 (biyotıp).
  - AB dışı öğrenci her dilde başvuru ücreti (900 SEK) ve harç öder. Örnek: Güz 2027 Lund İngilizce lisans programının toplam harcı 375.000–615.000 SEK.
  - Mühendislik isteyen lise öğrencisi için İsveç fiilen bir **yüksek lisans ülkesi**dir.
- **Finlandiya:**
  - İngilizce lisans arzı geniş: Aalto 11, LUT 15, Tampere 11, UEF 8. Helsinki (2) ve Turku (1) dar, Åbo Akademi'de (İsveççe üniversite) yok.
  - Başvuru tek portaldan, Studyinfo ortak başvurusuyla yapılır.
  - İngilizce programların ücreti 9.000–20.000 €/yıl. Fince ve İsveççe programlar ücretsiz.
- **Danimarka:**
  - Kopenhag'ın 78 lisans programının hepsi Danca.
  - DTU'da tek İngilizce lisans var (General Engineering). DTU'nun yüksek lisansları ise yalnızca İngilizce.
  - SDU'da 15 İngilizce lisans var; çoğu mühendislik.
  - AU Cognitive Science 2027'de Danca'ya geçiyor.
  - AB dışı öğrenci her dilde ücret öder (6.000–16.000 €/yıl).
- **İrlanda:**
  - Yerel öğretim dili İngilizce olduğu için iki filtre aynı listeyi verir. Motor bunu zaten biliyor (`yalnizIngilizce("ie")`).
  - AB dışı öğrenci doğrudan üniversiteye başvurur. Fen ve mühendislikte yıllık ücret yaklaşık 9.850–25.500 € (Avrupa Komisyonu).
- **Macaristan:**
  - 10 üniversitenin hepsinde İngilizce lisans ve yüksek lisans var (8–38 lisans programı).
  - Türkiye Stipendium Hungaricum ortağıdır (takip DU-1/DU-2).
  - Türk vatandaşının Macarca programlarda devlet burslu kontenjana girip giremeyeceği **doğrulanamadı**.
- **Polonya:**
  - 20 üniversitenin 17'sinde 3+ İngilizce lisans var. Silesia (2), SGGW (1) ve Lublin Tech (2) dar.
  - Lublin Tech NAWA bulucusunda hiç yok. Bilgisi üniversitenin 2027/28 sayfasından alındı: Management, 1.300 €/dönem; Computer Science, 2.000 €/dönem.
  - NAWA'ya göre ortalama ücret 2.000 €/yıl, aralık 2.000–6.000 €/yıl.
- **Çekya:**
  - 16 üniversitenin 12'sinde 3+ İngilizce lisans var.
  - UCT Prag, Güney Bohemya, Ostrava ve Pardubice'de 1–2 İngilizce lisans var.
  - Çekçe programlar ücretsiz. Bu, Türk öğrenci için en güçlü yerel dil seçeneğidir (Çekçe hazırlık yılı + nostrifikasyon gerekir; bkz. mezun-notlari).

---

## 2. Karar gerektiren konular

**K-A. Değer sözlüğü (veri ile motor uyumu).**
- PM şablonu `var | kısıtlı | yok` istiyor. `assets/js/sartlar-motor.js` ise `var | kismi | yok | teyit` bekliyor (`ulkeVeriDogrula`).
- Dosyalar PM şablonuna sadık yazıldı. Her dosyada `motorEslemesi` alanı var.
- Kontrol yapıldı: dosyalar `kısıtlı→kismi` ve `Doğrulanamadı→teyit` eşlemesiyle motor doğrulamasından **0 sorunla** geçti. `kaynak` alanı URL dizisidir.
- **Seçenekler:**
  - (a) Uygulayıcı ajan eşlemeyi aktarırken yapsın.
  - (b) Motor `kısıtlı` değerini de kabul etsin.
- **Öneri: (a).** Motor ve şema sabit kalır.

**K-B. "Doğrulanamadı" yerel dil hücreleri gösterilsin mi?**
- Etkilenen üniversiteler (9 hücre): MATE, SZE, BME-YL, PULS, Pollub.
- `universiteSuz` yalnızca `var/kismi` gösterir, yani `teyit` olan üniversite "yerel dil" filtresinde görünmez.
- **Seçenekler:**
  - (a) Gizli kalsın. Artısı: yanlış bilgi yok. Eksisi: liste kısalır.
  - (b) "Teyit gerekiyor" rozetiyle gösterilsin.
- **Öneri: (a).** Bir sonraki turda tarayıcıdan felvi.hu ve pollub.pl kontrol edilsin (takip IL-2, IL-3).

**K-C. Eşik tanımı ("var" ≥ 3).**
- Sınırda kalan üniversiteler: Umeå (3), Wrocław Tech (3), Cracow Tech (3), NCU (3), Jyväskylä (3 İngilizce + 2 çok dilli).
- Eşik 5 yapılırsa bunlar "kısıtlı"ya düşer.
- **Öneri: 3 kalsın.** Not alanlarında program adları yazılı; öğrenci kendisi görür.

**K-D. Ülke "program" özeti.**
- `ulke-dizini.js` bu 7 ülkede `program: veri-yok` gösteriyor.
- Yeni listelerle `programDurumuTuret` yedi ülkenin dördünde de (lisans/YL × en/yerel) **"genis"** veriyor.
- Bu, İsveç ve Danimarka'nın İngilizce lisansta "geniş" görünmesine yol açar. Gerçekte mühendislik dışı birkaç programdan ibaret.
- **Seçenekler:**
  - (a) Olduğu gibi kalsın.
  - (b) İsveç ve Danimarka İngilizce lisans için ülke özetine elle uyarı eklensin.
- **Öneri: (b).** Uyarı metni: "İngilizce lisans var ama mühendislikte çok dar; mühendislik için yüksek lisans ülkesi."

---

## 3. Düzeltilecek iddialar

| Dosya > alan | Eski | Doğru | Kaynak |
| :-- | :-- | :-- | :-- |
| `data/mevzuat/ulke-dizini.js` > fi.mezunNotu.metin (ve kaynak `data/mevzuat/kaynak/mezun-notlari.json`) | "Yıllık ücret 12.000 € ve üzeri." | "AB dışı için İngilizce programlar genellikle 9.000–20.000 €/yıl; Fince/İsveççe programlar ücretsiz." (12.000 € Aalto'ya özgü bir rakamdı, ülke geneli değil) | https://www.studyinfinland.fi/funding-your-studies/fees-and-cost-living (erişim 15.10.2026) |
| `data/mevzuat/ulke-dizini.js` > se, fi, dk, ie, hu, pl, cz `.siralama` | `null` | `{ad:"QS World University Rankings 2027", yayin:"2026-06", url:"https://www.topuniversities.com/world-university-rankings/2027"}` | QS (erişim 15.10.2026) |
| `data/mevzuat/ulke-dizini.js` > aynı 7 ülke `.program` ve `.veri.uni` | `veri-yok`, `uni: 0` | `uni-<cc>.json` listesinden `programDurumuTuret` ile türetilsin. Üniversite sayısı: 9 / 9 / 6 / 8 / 10 / 20 / 16 | bu not, §1 |
| `data/mevzuat/ulke-dizini.js` > se.mezunNotu | "İngilizce mühendislik lisansı az, ücret yüksek." | Doğru, korunsun. Somut veri: KTH 1, Chalmers 0, LiU 1 İngilizce lisans (Güz 2027) | universityadmissions.se API (termin 30) |

*Çelişki bulunmayan, kapsam dışı bırakılan iddialar:*
- ie.mezunNotu ("Türk diplomasıyla doğrudan giriş yok"): bu turda denetlenmedi.
- cz.mezunNotu (nostrifikasyon): Study in Czechia ücretsizlik sayfası bunu çürütmüyor.

---

## 4. Yazılı teyit taslakları

**T-1 · Macarca programlar ve Türk vatandaşı (BME; aynı metin MATE ve SZE'ye de gider)**
> Subject: Admission of a Turkish citizen to Hungarian-taught BSc/MSc programmes, 2027/28
>
> Dear Admissions Office,
> I am a Turkish citizen and will finish a Turkish state high school (Lise Diploması) in 2028. I am considering a Hungarian-taught programme at your university. Could you please confirm in writing: (1) whether non-EU applicants may apply through felvi.hu to Hungarian-taught BSc and MSc programmes; (2) whether they are eligible for state-funded (állami ösztöndíjas) places or only self-financed places, and the fee for 2027/28; (3) the required level of Hungarian and the accepted certificates.
> Thank you in advance. Kind regards, [Ad Soyad]

**T-2 · Lublin University of Technology: tam İngilizce program listesi**
> Subject: Full list of English-taught programmes for 2027/2028
>
> Dear International Admissions Office,
> Your page bkm.pollub.pl/en/admission/programs/2027-2028 lists Bachelor in Management and Bachelor in Computer Science. Could you please confirm the complete list of English-taught first-cycle and second-cycle programmes open to non-EU applicants for 2027/2028, with tuition per semester and the application window?
> Kind regards, [Ad Soyad]

**T-3 · Aarhus Üniversitesi: Cognitive Science dil değişikliği**
> Subject: Language of instruction, BSc Cognitive Science, 2027 and 2028 intake
>
> Dear AU Admissions,
> The bachelor page notes an anticipated change of the language of instruction of Cognitive Science from English to Danish in 2027. Could you confirm whether the 2027 and 2028 intakes will be taught in Danish, and whether other English-taught bachelor programmes are planned to change language?
> Kind regards, [Ad Soyad]

---

## 5. Takip listesi (bu tur)

**Tarihi gelmiş maddeler:** DU-5, DU-6 ve DU-8'in "her ekim" ara kontrolü yapıldı.
- **DU-5 (Twente):** Sayfa 02.10.2026'da güncellenmiş. Kurallar hâlâ Eylül 2027 dönemi içindir; Eylül 2028 kuralları yok. Kural aynı: 4 AP, her biri 3+. "Previous academic year" cümlesi duruyor. Madde listede kalır.
- **DU-6 (RUG Türkiye):** Sayfa 12.10.2026'da güncellenmiş. Genel kural 4 AP (3–5). Tıp, Diş ve Biyoloji dipnotlarında ise "en az 3 AP" yazıyor; metin kendi içinde çelişiyor (**Yoruma açık**). Giriş yılı belirtilmemiş. Madde kalır.
- **DU-8 (OeAD Türkiye PDF):** PDF erişilebilir (200), sürüm tarihi bu turda okunamadı. Madde kalır.

**Henüz tarihi gelmemiş maddeler:** IT-1 ve MS-5 (31 Ekim), DE-1 ve DU-1/DU-2 (Kasım). Durum değişmedi.

Bu turun yeni maddeleri `takip-listesi.md` dosyasına "Tur 11" bölümü olarak eklendi:
- **IL-1:** QS WUR 2028 (Haziran 2027).
- **IL-2:** felvi.hu kontrolü.
- **IL-3:** PULS ve Pollub Lehçe kataloğu.
- **IL-4:** Danimarka dil değişiklikleri.
- **IL-5:** universityadmissions.se Güz 2028 turu.
- **IL-6:** Studyinfo 2028 ortak başvurusu.

---

## 6. Kaynaklar (hepsine erişim 15.10.2026)

**Sıralama:**
- QS WUR 2027: https://www.topuniversities.com/world-university-rankings/2027
- QS uç noktası: https://www.topuniversities.com/rankings/endpoint?nid=4153156&countries=se (fi, dk, ie, hu, pl, cz için de aynı)
- Basın duyurusu (17.06.2026): https://tools.prnewswire.com/en-us/live/20813/release/20260617EN86024

**İsveç:**
- Güz 2027 uluslararası tur: https://www.universityadmissions.se/intl/search (API `POST /intl/api/sok`, termin 30)
- Ulusal tur, Güz 2026 ve 2027: https://www.antagning.se/se/search (API `POST /se/api/sok`)
- Ücret: https://www.universityadmissions.se/en/fees-scholarships-residence-permit/who-is-required-to-pay-fees/

**Finlandiya:**
- Katalog: https://opintopolku.fi/konfo-backend/search/koulutukset (Studyinfo, yayımlanmış kayıtlar)
- Ücret: https://www.studyinfinland.fi/funding-your-studies/fees-and-cost-living

**Danimarka:**
- Program veritabanı: https://studyindenmark.dk/portal (API `/++api++/@search?portal_type=program`)
- Ücret: https://studyindenmark.dk/study-options/tuition-fees-and-scholarships
- Üniversite sayfaları: https://www.ku.dk/studies/bachelor ; https://www.ku.dk/studies/masters ; https://www.dtu.dk/english/education/undergraduate ; https://www.dtu.dk/english/education/graduate ; https://bachelor.au.dk/en/ ; https://www.sdu.dk/en/uddannelse/bachelor ; https://ruc.dk/en/bachelor-programmes

**İrlanda:**
- Avrupa Komisyonu ülke profili: https://education.ec.europa.eu/study-in-europe/country-profiles/ireland
- Üniversite katalogları: her kayıttaki URL'ler.

**Macaristan:**
- Programı bulucu: https://tempus.tpf.hu/studyfinder/index/search/
- Stipendium Hungaricum: https://stipendiumhungaricum.hu/study-finder/
- Erişilemedi: felvi.hu.

**Polonya:**
- Programı bulucu: https://study.gov.pl/studyfinder
- Ücret: https://study.gov.pl/tuition-fees
- C1 kuralı (Ustawa 20.07.2018 md. 324 ust. 1): https://rekrutacja.us.edu.pl/?p=10000
- Lublin Tech: https://bkm.pollub.pl/en/admission/programs/2027-2028

**Çekya:**
- Program arama: https://studyin.gov.cz/study-programmes/
- Ücretsizlik: https://studyin.gov.cz/plan-your-studies/learn-czech-study-tuition-free/

**Takip kontrolleri:**
- https://www.utwente.nl/en/education/bachelor/how-to-apply/diplomas/AP-CollegeBoard/
- https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey

**Sınırlar:**
- Studyinfo, NAWA, Tempus ve Study in Czechia kayıtlarında akademik yıl yazmıyor. Bu kataloglar, o yıl açılmayan programları da gösterebilir.
- "Teyit gerekir" etiketli kayıtlar, başvurudan önce üniversite sayfasından kontrol edilmeli.
- Çekya'da site sayfa başına en çok 20 program gösteriyor; "20+" en az 20 demek.

---

## 7. proje.md'ye girecek özet

> **Tur 11 (15.10.2026), Ajan 13:** Yedi ülke için "en iyi 20 üniversite" listeleri hazırlandı (`.agents/mevzuat/dogrulama/uni-{se,fi,dk,ie,hu,pl,cz}.json`).
> - Sıralama kaynağı: QS WUR 2027 (Haziran 2026).
> - Üniversite sayısı: SE 9, FI 9, DK 6, IE 8, HU 10, PL 20, CZ 16; toplam 78.
> - İngilizce lisans: 63 var, 12 kısıtlı, 3 yok (Kopenhag, Chalmers, Åbo Akademi).
> - Yüksek lisans: 77 var, 1 kısıtlı (Lublin Tech).
> - Doğrulanamadı: 9 yerel dil hücresi (HU 5, PL 4).
> - Kesinlik: 63 Doğrulandı, 15 Teyit gerekir.
> - Dosyalar motor doğrulamasından eşlemeyle (kısıtlı→kismi, Doğrulanamadı→teyit) 0 sorunla geçti.
> - Düzeltme: fi.mezunNotu ücret ifadesi (9.000–20.000 €; Fince/İsveççe ücretsiz).
