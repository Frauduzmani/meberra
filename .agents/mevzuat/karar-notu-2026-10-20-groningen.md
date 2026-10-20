# Karar notu — Groningen ve AP Physics 2 zamanlaması (K14-5)
*Ajan 13 → Lead PM Dr. Aylin Kaya · 20 Ekim 2026 · Bulgular: `.agents/mevzuat/dogrulama/tur14-groningen-sonraki-donem.json`*

## 1. Sonuç
1. **Groningen şartı geçerli (Doğrulandı).** Türk diploması için 4 AP (her biri 3–5). Physics, Applied Physics ve Astronomy için ayrıca AP Calculus AB ya da BC ile **AP Physics 2** gerekiyor. Physics C yetersiz sayılıyor. Sayfa 19.10.2026'da güncellendi.
2. **Physics 2 için zorunlu ön koşul yok (Doğrulandı).** College Board önce Physics 1'i almayı yalnızca öneriyor. 2027'de Physics 1 (5 Mayıs, Session 2) ile Physics 2 (6 Mayıs, Session 1) çakışmıyor.
3. **13 Kasım 2026 kaçarsa Mayıs 2027 kapanmaz.** 12 Mart 2027'ye kadar sınav başına 40 $ geç ücretle sipariş verilebiliyor. K14-5 metnindeki "13 Kasım kaçarsa Mayıs 2028" ifadesi düzeltilmeli.
4. **Asıl risk takvimde.** RUG'a göre AB dışı aday şartları 1 Temmuz'a kadar tamamlamalı (2027 dönemi). Aynı sayfanın başka bir bölümünde vize nedeniyle 1 Haziran yazıyor. AP puanları ise Temmuz'da açıklanıyor. Yani Mayıs 2028 sınavlarının sonucu iki son güne de yetişmiyor. Geç sonucu kabul edip etmediklerine dair RUG metni yok (**Teyit gerekir**).
5. **Eylül 2028 dönemi henüz açıklanmadı.** 2027 dönemi şöyle: Early Bird 1 Ekim–28 Şubat, son başvuru 1 Mayıs 2027. Mayıs 2028 AP tarihleri ve 2027-28 sipariş son günü de henüz açıklanmadı.

## 2. Karar: Physics 2 hangi dönemde?
| Seçenek | Artı | Eksi |
| :-- | :-- | :-- |
| **A. Mayıs 2027 (11. sınıf)** | Sonuç Temmuz 2027'de gelir. Groningen'in 1 Mayıs 2028 başvurusunda puan hazır olur, 1 Haziran/1 Temmuz riski kalkar. Physics 1 ile çakışma yok. | Bu yıl iki fizik birden çalışılır (Physics 2: akışkanlar, termodinamik, elektrik-manyetizma, optik, modern fizik). Exam-only siparişi veren bir koordinatör bulunmalı. |
| B. Mayıs 2028 (12. sınıf) | Önce Physics 1 biter, yük dağılır. | Puan Temmuz 2028'de gelir, RUG'un AB dışı son günlerinden sonra. Ancak RUG yazılı onay verirse güvenli olur. Mayıs 2028 tarihleri de henüz açıklanmadı. |

**Önerim: A.** Groningen'in takvimiyle uyumlu tek seçenek bu. Pedagojik yükün değerlendirmesi PM'e ve Dr. Emre Yıldız'a ait. Yük fazla gelirse yedek yol B'dir, ama yalnızca RUG geç AP sonucunu yazılı olarak kabul ederse.
**Aynı sorun diğer dersler için de geçerli:** Groningen'in istediği Calculus AB/BC ve 4 AP'nin geri kalanı da puanı başvurudan önce gelecek biçimde, en geç Mayıs 2027'de tamamlanmalı. Calculus AB Mayıs 2027'de alınırsa matematik şartı karşılanır. BC'yi 12. sınıfa bırakmak Groningen açısından gerekli değil.
**Somut adım:** 13 Kasım 2026'dan önce koordinatörden Physics 2 için de exam-only siparişi istenmeli. Yetişmezse son çare 12 Mart 2027'dir (+40 $).

## 3. Düzeltilecek iddialar
- `proje.md` §30.1 K14-5: eski "13 Kasım 2026 kaçarsa Physics 2 Mayıs 2028'e alınır" → doğru "12 Mart 2027'ye kadar geç sipariş mümkün (+40 $), Mayıs 2028 yalnızca bu da kaçarsa" → kaynak: AP Central Exam Fees 2026-27.
- `sinavlar.js` > cent-s: eski "CISIA takviminde 15 Ekim 2026'dan sonra CEnT-S oturumu yok" → doğru "CISIA takvimi 26.11.2026 ve 17.12.2026'yı gösteriyor (Messina, @UNI)" → kaynak: testcisia.it.
- `lisans-nl.json` > lis-nl-rug-ap: "güncelleme 12 Ekim 2026" → "19 Ekim 2026". Fizik listesine Astronomy eklendi.
- **Yeni bulgu, Meberra'nın İtalya rotasını etkiliyor:** PoliTo 2027/28'den itibaren lisans girişinde CISIA testlerine geçiyor. Yalnızca yüz yüze yapılan TOLC@UNI ve CEnT@UNI kabul ediliyor, evden yapılan @CASA sürümleri kabul edilmiyor. TIL-I'nin ve AB dışı aday kuralının ne olacağı yazmıyor (`til-i`, `it-tili`: Teyit gerekir; takip listesine PT-1 önerisi).
- 25 tarihli kaydın "sonraki dönem" karşılığı JSON'da (`sonrakiDonem`): 10'u Doğrulandı, 3'ü Teyit gerekir, 12'si Henüz açıklanmadı.

## 4. Yazılı teyit taslağı (RUG Admissions Office)
> Subject: Turkish Lise Diploması + AP — timing of AP results for September 2028 entry (Physics / Applied Physics)
>
> Dear Admissions Office,
> I am a Turkish student (Lise Diploması expected June 2028) planning to apply to the BSc Physics / Applied Physics for September 2028 as a non-EU/EEA applicant. Your Türkiye page requires at least 4 AP exams (3–5) including AP Calculus AB/BC and AP Physics 2.
> 1. If some of these AP exams are taken in May 2028, College Board releases scores in July 2028. Would such scores be accepted to meet the conditions of a conditional offer, given the non-EU deadlines (1 June / 1 July) on your website?
> 2. Which of these two dates applies to non-EU applicants with outstanding AP results?
> 3. Is a school statement confirming AP exams in May 2028 sufficient at the time of application?
> Thank you for your help.
> Kind regards, [Ad Soyad]

## 5. Kaynaklar (hepsine erişim 20.10.2026)
- RUG Türkiye sayfası (son değişiklik 19.10.2026): https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey
- RUG lisans başvurusu, yabancı diploma (2027-28; 01.10.2026): https://www.rug.nl/education/application-enrolment-tuition-fees/admission/procedures/non-dutch-qualification/bachelor-non-dutch-qualification
- RUG Physics / Applied Physics başvuru sayfaları (Eylül 2027): https://www.rug.nl/bachelors/physics/admission-and-application · https://www.rug.nl/bachelors/applied-physics/admission-and-application
- College Board, 2027 AP sınav tarihleri: https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates
- College Board, sınav ücretleri 2026-27: https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees · önemli tarihler 2026-27: https://apcentral.collegeboard.org/about-ap/school-year-timeline
- College Board, ders almadan sınava girme: https://apstudents.collegeboard.org/help-center/can-i-take-ap-exam-if-i-havent-taken-ap-course · Physics 2 önerilen ön koşulları: https://apstudents.collegeboard.org/courses/ap-physics-2-algebra-based · puan açıklama: https://apstudents.collegeboard.org/view-scores
- PoliTo, giriş testleri 2027/28: https://www.polito.it/didattica/iscriversi-studiare-laurearsi/iscrizione/corsi-di-laurea/test-di-ammissione
