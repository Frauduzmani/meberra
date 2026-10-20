# Karar Notu — Ajan 13: Mezun Öğrenciler ve Sınıfa Göre Ülke Şartları (Tur 10, K4/K5)
**Tarih:** 14 Ekim 2026 · **Muhatap:** Lead PM Dr. Aylin Kaya · **Son kontrol (tüm maddeler):** 2026-10-14
**Kapsam:** Herkese açık "sınıfına göre ülke şartları" sayfaları (9, 10, 11, 12, mezun) ve mezun öğrenciler. Metinlerde kişi adı yok; genel öğrenciye hitap edilir.
**Bu notta proje dosyalarında değişiklik yapılmadı.** Yalnızca bu dosya yazıldı ve `takip-listesi.md`'ye yeni bir bölüm eklendi.
**Etiketler:** Doğrulandı · Yoruma açık · Yayımlanmadı · Teyit gerekir. Kaynak kodları (K1, K2, …) §7'de.
**Yeniden araştırılmayanlar:** 12 Ekim karar notu ve Tur 8 bulgularında doğrulanmış bilgiler tekrar araştırılmadı; kaynakları yeniden kullanıldı (ör. TUR-BV05 eşikleri, uni-assist belge listesi, PoliTo ve PoliMi eşikleri, MUR genelgesi, vize ve Sperrkonto).

---

## 1. PM özeti (10 satır)
1. **Mezun için Almanya'da AP yolu kapalı (Doğrulandı).** Türk diploması + AP için anabin'de kural yok. ABD diploması için olan AP kuralı da AP'lerin "lise bitmeden" alınmasını şart koşuyor. Mezuniyetten sonra alınan AP iki açıdan da giriş hakkı vermez.
2. **Mezun için Almanya'nın asıl yolu geçmiş yıl yerleşmesi (Doğrulandı).** anabin TUR-BV05 eşikleri sınav yılına göre veriyor (1998'e kadar geriye) ve bir süre sınırı koymuyor. Uygun alanda yerleşmesi olan mezunun belgesi elinde olduğu için 15 Temmuz çakışması onun için yok. Tek tek üniversitenin bu belgeyi kabul edip etmediği Teyit gerekir.
3. **Mezunun yeniden YKS'ye girmesinin bedeli var (Doğrulandı, ÖSYM 2026).** Bir önceki yıl bir programa yerleşen adayın OBP katsayısı ertesi yıl yarıya iner. Bu kural kayıt yaptırmasa da geçerli. Yalnızca o yılın puanıyla yerleştirme yapılır.
4. **İtalya mezunlara açık (Doğrulandı).** PoliMi önceki yıllarda alınmış diplomayı kabul ediyor, PoliTo TIL-I'ye mezunlar girebiliyor, CISIA kurallarında mezun kısıtı yok. MUR genelgesinde mezuniyetten bu yana geçen süre ya da boşluk yılı için kural yok.
5. **İtalya'da en büyük mezun riski bursla ilgili (Doğrulandı, PoliMi DSU 2026/27 Md. 4.2).** Türkiye'de ya da başka bir yerde aynı düzeyde bir üniversiteye kayıt yaptırmış öğrencinin bursta "1. sınıf" sayılma hakkı kalkar. Bu öğrenciden kredi (ECTS) şartı istenir. Diğer bölgeler için Teyit gerekir.
6. **Platform hatası (yüksek öncelik):** `rota.js`/`eposta.js` mezun için tarihleri geçmiş mezuniyet yılına göre hesaplıyor. Bu yüzden mezunun tüm adımları "Geçmiş" görünür. Mezunda hesap **hedef başlangıç yılına** göre yapılmalı (bkz. §4.3).
7. **9–10. sınıf için en erken resmi kural diploma notu (Doğrulandı).** MEB'e göre mezuniyet puanı 9, 10, 11 ve 12. sınıfların eşit ağırlıklı ortalamasıdır. Bu puan Türkiye'de OBP'ye (×5, ×0,12; en fazla 60 puan), Almanya'da modifiye Bavyera formülüyle Alman notuna dönüşür. İtalya'da PoliMi ve PoliTo sıralamasında diploma notu kullanılmıyor.
8. **Dil belgesinin süresi:** TOEFL 2 yıl geçerli (ETS, Doğrulandı). IELTS için 2 yıl bir öneri, kurum daha uzun süre kabul edebilir (Doğrulandı). Bu yüzden 9–10. sınıfta alınan belge başvuruda işe yaramaz.
9. **12. sınıflar için 2027/28 dönemi şimdi başlıyor.** 26 Kasım ve 17 Aralık 2026 CEnT-S oturumları 12. sınıflar ve mezunlar için asıl sınav (Doğrulandı), 11. sınıflar için yalnızca prova. MUR genelgesi 2027/28'i kapsıyor, vize son tarihi 31 Ekim 2027 (Doğrulandı). ÖSYM 2027 takvimi Kasım 2026'da bekleniyor.
10. **Sayım:** Mezun soruları A1–A4: 34 bulgu. Birincil etiketle Doğrulandı 26, Teyit gerekir 7 (ayrıca 3 bulgu kısmen Teyit gerekir), Yoruma açık 1. Önerilen 8 yeni rota adımı: Doğrulandı 7, Teyit gerekir 1 (4 adımda ek teyit notu var). Sınıf tablosundaki takvim maddelerinin 12. sınıf, mezun ve sonraki yıllar için olanları Yayımlanmadı. Takip listesine 6 yeni madde (MS-1…MS-6), teyit e-postası taslağı 4.

---

## 2. Mezun soruları (A1–A4)

### A1. Almanya: Türk diploması + mezuniyetten sonra alınan AP
| # | Bulgu | Etiket | Kaynak |
|---|---|---|---|
| A1.1 | Türk Lise Diploması için anabin'deki hiçbir vaka grubunda (TUR-BV01–15) AP yok. Mezuniyetten önce de sonra da alınsa, AP Türk diplomasına giriş hakkı eklemez. | Doğrulandı | K2 |
| A1.2 | AP kuralı (USA-BV07/08) yalnızca ABD High School Diploma ile birlikte geçerli. Ek koşul: "Die finalen AP-Prüfungen müssen alle bis zum Abschluss der High School separat beim College Board abgelegt werden." Yani ABD diplomalı biri için bile mezuniyetten sonra alınan AP sayılmaz. | Doğrulandı | K1 |
| A1.3 | AP sertifikasının kendi notu: "Die alleinige Vorlage dieses Nachweises eröffnet nicht den Hochschulzugang." | Doğrulandı | K1 |
| A1.4 | Mezunlar AP sınavına girebilir: "A student who is no longer in high school (secondary school) can take an AP exam … if they need a specific AP Exam for university application." Ancak Almanya ve İtalya'da Türk diplomalı öğrenci için böyle bir gereklilik yok. | Doğrulandı | K9 |
| A1.5 | Okulu AP vermeyen ya da bağımsız aday nasıl girer: AP Course Ledger'dan bölgedeki okulları bul, okulun AP koordinatörünü ara, "dış aday" kabul edip etmediğini sor. Okulların sipariş son günü Kasım ortası (2027 sınavları için 13 Kasım 2026). Sonrasında kabul okulun takdirinde. İstanbul'da belirli bir okulun mezun kabul edip etmediği: sınav merkezine sorulmalı. | Doğrulandı (genel kural) / Teyit gerekir (okul) | K10, AP_UCRET |

**Mezun için sonuç:** Almanya hedefinde AP'ye para ve zaman harcamak önerilmez. Platformda mezun profiline AP önerisi gösterilmemeli; yalnızca "ABD/İngiltere gibi başka hedefler için" bilgi notu kalabilir.

### A2. Almanya: YKS yerleşmesinin yılı ve mezun açısından fark
| # | Bulgu | Etiket | Kaynak |
|---|---|---|---|
| A2.1 | TUR-BV05 eşikleri sınav yılına göre verilir: 2018'den beri 180'in üzerinde (2020'de 170), 2010–2017 LYS, 2008–2009, 2003–2007, 1999–2002 ve 1998 öncesi için ayrı eşik. Kuralda yerleşmenin hangi yılda olması gerektiğine ya da kaç yıl geçerli olduğuna dair bir sınır yok. Yani geçmiş yıl yerleşmesi anabin'e göre geçerli. | Doğrulandı | K2 |
| A2.2 | uni-assist TR sayfası "Yerleştirme Sonuçları" belgesini istiyor, belgenin yaşı ya da yılı hakkında bir şey söylemiyor. Kayıt yaptırıldıysa ayrıca e-Devlet transkripti isteniyor. | Doğrulandı | K4 |
| A2.3 | Tek bir üniversitenin eski yıl yerleşmesini kabul edip etmediği (ör. "son 2 yıl" gibi bir iç kural) yalnızca o üniversiteden öğrenilebilir. | Teyit gerekir (üniversite / uni-assist; taslak T-M1) | K2 (anabin bir değerlendirme önerisidir) |
| A2.4 | KMK not kararı Md. 4: Giriş hakkının kazanıldığı tarih, sunulması gereken en yeni belgenin tarihidir. Mezunda bu tarih yerleşme belgesinin tarihi olur. Bazı kontenjanlı programlarda tarih sıralamayı etkileyebilir; üniversiteye göre değişir. | Doğrulandı (kural) / Teyit gerekir (etkisi) | K3 |
| A2.5 | ÖSYM: "2026 yılında … merkezî yerleştirmede, 2026 yılı yerleştirme puanları … kullanılacaktır." Türkiye'de yeni bir yerleşme yalnızca o yılın YKS'siyle olur. | Doğrulandı | K6 §5 |
| A2.6 | ÖSYM: "2025-YKS puanları ile bir yükseköğretim programına … yerleştirilen (kayıt olsun veya olmasın) … adaylar, 2026-YKS puanları ile … yerleştirilirken OBP'ye uygulanacak katsayılar yarıya düşürülecektir." Tercih kılavuzu da aynı kuralı 2027-YKS için tekrarlıyor (Md. 1.3). | Doğrulandı | K6 §4.2 s. 33; K7 Md. 1.3 |
| A2.7 | Yerleşme yalnızca yerleşilen alan ve komşu alanlar için hak verir. Örnek: İşletme'ye yerleşmiş bir mezun mühendislik okumak isterse yeniden YKS'ye girip mühendislik programına yerleşmek zorundadır ve o yıl OBP katsayısı yarıya iner (A2.6). | Doğrulandı | K2, K6 |

**Mezun ile son sınıf öğrencisi arasındaki fark:**

| | Son sınıf (ilk YKS) | Mezun, uygun alanda yerleşmesi var | Mezun, yerleşmesi yok ya da alan uymuyor |
|---|---|---|---|
| Giriş belgesi | Ağustos'ta çıkar | **Elinde** | Ağustos'ta çıkar |
| 15 Temmuz çakışması | Var (geç teslim teyidi gerekir) | **Yok** | Var |
| YKS'ye yeniden girmek | — | Gerekmez | Gerekir; önceki yıl yerleştiyse OBP katsayısı yarıya iner |
| AP'nin rolü | Profil | Profil (giriş hakkı yok) | Profil (giriş hakkı yok) |
| En erken başlangıç (bugünden) | Kış 2027/28 (12. sınıf) | Yaz 2027 (yalnızca yaz döneminde başlayan programlar) ya da Kış 2027/28 | Kış 2027/28 riskli; yaz 2028 ya da kış 2028/29 |

### A3. İtalya: YKS yılı, testler, boşluk yılı, süre sınırı
| # | Bulgu | Etiket | Kaynak |
|---|---|---|---|
| A3.1 | MUR genelgesi lisans için (a) en az 12 yıllık diploma ve (b) "certificato attestante il superamento della prova di idoneità accademica" ister. Metinde sınavın yılı, diplomanın yaşı ya da boşluk yılı hakkında bir hüküm yok (genelgenin tamamı tarandı). | Doğrulandı | K11 s. 8–9 |
| A3.2 | Mezun için hangi yılın YKS sonuç belgesinin isteneceği: PoliTo yalnızca "certificate stating that the applicant has passed the national admission test (i.e., YKS in Turkey…)" diyor, yıl belirtmiyor. Eski yıl belgesinin kabul edilip edilmediği üniversiteye sorulmalı. | Teyit gerekir (üniversite; taslak T-M2) | K13 s. 30 |
| A3.3 | "YKS'yi geçmek" için gereken puan resmi metinlerde yok (Tur 8'den, değişmedi). | Yoruma açık | K13 |
| A3.4 | **PoliMi mezunlara açık:** Standart kayıt aşamasına girebilecekler arasında "a high school diploma obtained in school years prior to the 2025/2026 school year" sayılıyor (2026-27 çağrısı Md. 6.3). | Doğrulandı | K12 s. 15 |
| A3.5 | **PoliTo TIL-I mezunlara açık:** "they must be attending their last year of high school … or they must have already earned their high school diploma" (Md. 1.5). Puan yalnızca o yılın kaydı için geçerli. | Doğrulandı | K13 Md. 1.5 |
| A3.6 | **CEnT-S:** CISIA kurallarında kimin kayıt olabileceğine (sınıf ya da diploma tarihi) dair bir kısıt yok. Test bir sonraki akademik yılın kaydı için geçerli (1 Kasım 2025 – 31 Ekim 2026 → 2026/27). Her makro dönemde bir kez girilebilir. Ücret 55 €. | Doğrulandı (2025/26 kuralları; 2026/27 kuralları IT-1 ile bekleniyor) | K14 |
| A3.7 | **SAT:** Sınıf kısıtı yok, ancak üniversite tarih aralığı koyabilir (ör. Sapienza 2026/27'de 1 Ocak 2024'ten sonra alınan SAT'ı kabul etti). | Doğrulandı (mevcut veri) | SAPIENZA (`ulke-rotalari.js`) |
| A3.8 | Boşluk yılının başvuruya resmi bir etkisi ya da mezuniyetten bu yana geçen süre için bir sınır: MUR genelgesinde ve PoliMi/PoliTo çağrılarında bulunamadı. Konsolosluğun vize aşamasında açıklama isteyip istemeyeceği bilinmiyor. | Teyit gerekir (konsolosluk / üniversite) | K11, K12, K13 |
| A3.9 | **Türkiye'de üniversiteye kayıtlı mezun:** PoliTo çift kayda izin veriyor ama başvuruda üniversite, program ve ders bilgileri isteniyor (Md. 2.3). | Doğrulandı | K13 s. 18 |
| A3.10 | **DSU (PoliMi):** Gereken kredi, öğrencinin "absolute first enrolment"ına göre hesaplanır: "referring to the first year when the student may have finalized an enrolment in a University in Italy or abroad for the same level of studies". Bu durumdaki öğrenci "subsequent years" profiliyle başvurur. Türkiye'de lisansa kayıt yaptırmış mezun 1. sınıf burs profilini kaybeder. | Doğrulandı (PoliMi 2026/27) | K15 Md. 4.2 s. 11 |
| A3.11 | Aynı kural EDISU, DiSCo ve Padova'da da var mı? | Teyit gerekir (DSU kurumları; taslak T-M3) | — |

### A4. Mezun için ek belgeler
| Ülke | Belge | Etiket | Kaynak |
|---|---|---|---|
| DE | Lise diploması + yeminli tercüme (uni-assist yalnızca Türkiye'de yeminli tercüman çevirisini kabul eder; temsilcilik notu ayrıca noter tasdikli fotokopi ister) | Doğrulandı | K4, K5 |
| DE | ÖSYM yerleştirme sonuç belgesi (geçmiş yıl) + yeminli tercüme | Doğrulandı (belge) / Teyit gerekir (yıl kabulü, A2.3) | K4, K5 |
| DE | Türk üniversitesine kayıt yaptırdıysa e-Devlet transkripti | Doğrulandı | K4 |
| DE | Almanca ya da İngilizce CV (temsilcilik listesi) | Doğrulandı | K5 |
| DE | Boşluk yılının ayrıca açıklanması: uni-assist TR sayfasında ve temsilcilik notunda böyle bir şart yok. CV'de dönemin yazılması önerilir; üniversite ayrıca isteyebilir. | Teyit gerekir (üniversite) | K4, K5 |
| DE | Kabul henüz yoksa **öğrenci adayı vizesi** (9 ay; lise diploması + ÖSYM sonuç belgesi + finansman kanıtı). Mezun için Almanya'da başvuru sürecini yürütmeye yarayan resmi bir seçenek. | Doğrulandı (Mart 2025 notu) | K5 |
| IT | Diploma aslı + apostil + İtalyanca çeviri; YKS sonuç belgesi + apostil + çeviri; DoV ya da CIMEA | Doğrulandı (mevcut veri) | KONS_IST, MUR |
| IT | Türk üniversitesine kayıtlıysa kariyer bilgisi (PoliTo) ve DSU'da "subsequent years" profili | Doğrulandı | K13, K15 |
| IT | Boşluk yılı açıklaması | Teyit gerekir (konsolosluk) | — |
| TR | Diploma ve ÖSYM belgesine apostil hangi makamdan alınır (Kaymakamlık/Valilik; önce MEB onayı gerekiyor mu?) Resmi bir kaynak bulunamadı; yalnızca ikincil kaynaklar var. | Teyit gerekir (İl/İlçe Milli Eğitim Müdürlüğü ve Kaymakamlık) | — |
| TR | Mezunun diploma bilgisi YKS'de e-Okul'dan alınır; eğitim bilgisinin AİS'te onaylanması gerekir (2026'da 23–30 Haziran). | Doğrulandı (2026); Yayımlanmadı (2027) | K6 §4.1 |

---

## 3. Ülke × sınıf tablosu
*2026/27 öğretim yılına göre. Mezuniyet: 12. sınıf Haziran 2027, 11. sınıf 2028, 10. sınıf 2029, 9. sınıf 2030. Mezun öğrenci bugünden en erken 2027/28'i hedefler. Göreli ifadeler herkese açık sayfa içindir; mutlak tarihler yalnızca kaynağı olanlarda verildi.*

### 3.0 Değişmeyen şartlar ("Ne gerekiyor")
**Almanya (bir kez gösterilir)**
- Türk diplomasıyla doğrudan giriş: YKS'de ilgili puan türünde 180'in üzerinde puan + en az 4 yıllık örgün lisans programına yerleşme. Giriş hakkı yalnızca yerleşilen alan ve komşu alanlar için geçerli (TUR-BV05). — Doğrulandı, K2
- AP, SAT ve IB modülü Türk diplomasına giriş hakkı eklemez. Yerleşme yoksa Studienkolleg de açılmaz; tek istisna MYO'da 1 yıl okumak, bu da yalnızca FH Studienkolleg'ine açılır. — Doğrulandı, K2
- Diploma notu Alman notuna modifiye Bavyera formülüyle çevrilir: X = 1 + 3·(Nmax − Nd)/(Nmax − Nmin). Ondalıktan sonra bir basamak hesaplanır, yuvarlama yapılmaz. — Doğrulandı, K3. Türk lisesi için Nmax=100, Nmin=50 alındığında örnek: 85 → 1,9; 70 → 2,8. Eşik değerlerini ZAB belirler; Türkiye için resmi değerler API kaydında yok. — **Teyit gerekir** (uni-assist)
- İngilizce dil belgesi programa göre (çoğunlukla IELTS 6.0–6.5 / TOEFL 72–90); bazı programlar Almanca A2–B1 ister. — Doğrulandı (mevcut veri)
- Kabul sonrası: Sperrkonto (Mart 2025: aylık 992 €), ulusal vize, sağlık sigortası. Bavyera ve Baden-Württemberg AB dışı öğrenciden harç alır. — Doğrulandı (mevcut veri)

**İtalya (bir kez gösterilir)**
- En az 12 yıllık diploma + YKS'yi geçtiğini gösteren belge + üniversitenin giriş testi (CEnT-S / TIL-I / TOL / SAT) + İngilizce B2. Vize gereken aday Universitaly ön başvurusu yapar; yalnızca bir program seçilebilir. — Doğrulandı, K11 / mevcut veri
- AP, Türk diploması sahibi için kabul şartı da değil, resmi avantaj da değil. — Doğrulandı (12 Ekim notu)
- Giriş testi yalnızca bir kayıt yılı için geçerli (CEnT: bir sonraki akademik yıl; TIL-I: o yılın çağrısı). — Doğrulandı, K14, K13
- Diploma notu: PoliMi sıralaması yalnızca test puanına dayanır (Md. 6.2), PoliTo kabulü TIL-I/SAT'a dayanır. Diğer üniversitelerin diploma notunu kullanıp kullanmadığı **Teyit gerekir**. — Doğrulandı (PoliMi/PoliTo)
- DSU bursu: 1. sınıfta sıralama gelire göre yapılır; bursun sürmesi için kredi gerekir (PoliMi mühendislik: 10 Ağustos'a kadar 35 ECTS). — Doğrulandı, K15 Md. 4.1

**Türkiye (iki ülke için ortak)**
- Mezuniyet puanı = 9, 10, 11 ve 12. sınıf yılsonu başarı puanlarının aritmetik ortalaması; hazırlık sınıfı sayılmaz. — Doğrulandı, K8 Md. 65 ve hazırlık sınıfı maddesi
- OBP = diploma notu × 5 (250–500); yerleştirme puanına OBP × 0,12 eklenir (30–60 puan). Diploma notu 50'nin altındaysa 50 sayılır. — Doğrulandı, K6 §4.1–4.2
- Bir yıl önce yerleşen adayın (kayıt olsun olmasın) OBP katsayısı ertesi yıl yarıya iner. — Doğrulandı, K6, K7
- Dil belgesi süresi: TOEFL 2 yıl (ETS, Doğrulandı, K16). IELTS için 2 yıl önerilir, kurum daha uzun kabul edebilir (Doğrulandı, K17).

### 3.1 Almanya

**DE — 9. sınıf**
- *Bu yıl:*
  - Her yılın yılsonu başarı puanı mezuniyet puanının dörtte biridir (K8, Doğrulandı). Bu puan hem OBP'ye hem Almanya'daki nota yansır (K3, K6).
  - İngilizceyi B2'ye taşıyacak bir plan kur.
  - Almanca A1'e başlamak isteğe bağlı; bazı programlar A2–B1 ister.
- *Tarihler:* Bu sınıfa bağlı resmi bir son tarih yok. Hedef yılın çağrıları (2030/31) Yayımlanmadı.
- *Sık hatalar:*
  - "AP alırsam YKS'ye gerek kalmaz" düşüncesi (yanlış; K2, Doğrulandı).
  - 9. sınıf notlarını önemsememek (ağırlığı 12. sınıfla aynı; K8).
  - Dil sınavına çok erken girmek (2 yıl kuralı; K16, K17).

**DE — 10. sınıf**
- *Bu yıl:*
  - Not ortalamasını koru.
  - Mühendislik için AYT matematik ve fen temelini kur (SAY puanı).
  - Hangi mühendislik alanını okumak istediğini daralt; giriş hakkı alana bağlı (K2).
- *Tarihler:*
  - AP'ye girmek istersen sipariş son günü Kasım ortası (2027 sınavları için 13 Kasım 2026; Doğrulandı).
  - 2029/30 çağrıları Yayımlanmadı.
- *Sık hatalar:* Alan seçimini YKS tercih dönemine bırakmak. Almanya'daki alanla uyumsuz bir programa yerleşmek o alanda hak vermez (K2).

**DE — 11. sınıf** (mevcut rota; ek yok)
- *Bu yıl:*
  - Hedef üniversitelere teyit e-postası gönder.
  - İstersen AP'ye gir (profil amaçlı).
  - Almanca A2 planını yap.
- *Tarihler:* AP sipariş son günü 13 Kasım 2026 (Doğrulandı).
- *Sık hatalar:*
  - Physics 1'i KMK fen dersi saymak (12 Ekim notu).
  - AP'yi giriş hakkı sanmak.

**DE — 12. sınıf (2027 mezunu)**
- *Bu yıl:* 
  - Hedef programları kesinleştir.
  - Geç teslim teyidini al.
  - Dil sınavına gir.
  - YKS 2027'ye başvur ve gir.
  - Tercihte mühendislik programı yaz.
- *Tarihler:*
  - ÖSYM 2027 takvimi Kasım 2026'da bekleniyor (DE-1, **Yayımlanmadı**). 2026 kalıbı: başvuru Şubat–Mart, sınav Haziran, yerleştirme Ağustos ortası.
  - Kış dönemi son başvuru tarihi çoğunlukla 15 Temmuz 2027 (Doğrulandı, kalıp).
  - Yaz dönemi son başvuru tarihi çoğunlukla 15 Ocak 2028.
  - KIT portalı Aralık 2026'da açılıyor (Tur 8).
- *Sık hatalar:*
  - Yerleşme belgesini 15 Temmuz'a yetişecek sanmak (2023–2026'da hiç yetişmedi; Doğrulandı).
  - MYO ya da açıköğretim programı yazmak (TUR-BV05 şartını sağlamaz).
  - Belgeyi yeminli olmayan tercümana çevirtmek (K4).
  - "Sadece belge için" ilgisiz bir alana yerleşmek (A2.7).

**DE — Mezun**
- *Bu yıl:*
  1. Elindeki yerleşme belgesinin alanını kontrol et. Hedef Alman programıyla uyumluysa YKS'ye yeniden girmene gerek yok (A2.1, Doğrulandı). Üniversitenin eski yıl belgesini kabul ettiğini yazılı teyit et (T-M1, **Teyit gerekir**).
  2. Yerleşmen yoksa ya da alan uymuyorsa YKS 2027'ye gir. Önceki yıl yerleştiysen OBP katsayın yarıya iner (A2.6, Doğrulandı). Bu durumda takvim çakışması yine yaşanır.
  3. Yerleştirme belgeni, diplomanı ve (kayıtlıysan) transkriptini yeminli tercümeye ver (K4).
  4. CV'de mezuniyetten sonraki dönemi açıkça yaz (K5). Üniversitenin ayrıca açıklama isteyip istemediği **Teyit gerekir**.
  5. AP'ye kaynak ayırma (A1, Doğrulandı).
- *Tarihler:*
  - Uygun yerleşmesi olan mezun: Yaz dönemi 2027 başvuruları genellikle Aralık–15 Ocak 2027; az sayıda İngilizce program yaz döneminde başlar (mevcut veri, Doğrulandı). Kış dönemi 2027/28 başvuruları genellikle Mayıs–15 Temmuz 2027.
  - Yerleşmesi olmayan mezun: YKS 2027 takvimi (DE-1, **Yayımlanmadı**).
- *Sık hatalar:*
  - AP ile "Studienkolleg'siz giriş" beklemek.
  - Türk üniversitesine kayıt yaptırmayı zorunlu sanmak (gerekmez; Tur 8, Doğrulandı).
  - Yeniden YKS'ye girerken OBP kaybını hesaba katmamak.
  - İtalya'yı da düşünüyorsa Türkiye'de kayıt yaptırıp DSU 1. sınıf hakkını kaybetmek (A3.10).

### 3.2 İtalya

**IT — 9. sınıf**
- *Bu yıl:*
  - Matematik temelini sağlamlaştır (CEnT-S'te Matematik ve Reasoning bölümleri var).
  - İngilizceyi B2'ye taşıyacak bir plan kur.
  - Diploma notu PoliMi ve PoliTo sıralamasını etkilemez (Doğrulandı), ama YKS'de OBP'yi ve Almanya seçeneğini etkiler (K6, K3).
- *Tarihler:* Hedef yıl 2030/31; tüm çağrılar Yayımlanmadı.
- *Sık hatalar:* İtalya'da YKS'nin gerekmediğini sanmak. YKS'yi geçtiğini gösteren belge şart (K11, Doğrulandı).

**IT — 10. sınıf**
- *Bu yıl:*
  - CEnT-S, TIL-I ve SAT formatlarını tanı.
  - Hedef şehirlerin DSU kurumlarını öğren.
  - Ailenin gelir belgeleri (ISEE parificato) hakkında bilgi edin.
- *Tarihler:* Resmi bir son tarih yok. 10. sınıfta CEnT-S'e prova olarak girilip girilemeyeceği: CISIA kurallarında sınıf kısıtı yok (K14), ancak sonuç hiçbir kayıt yılında işe yaramaz. — **Yoruma açık**
- *Sık hatalar:* Dil sınavına erken girmek (K16, K17).

**IT — 11. sınıf** (mevcut rota; ek yok)
- *Bu yıl:* İstersen prova CEnT-S'e gir; PoliMi'ye erken giriş penceresini sor.
- *Tarihler:*
  - 26 Kasım ve 17 Aralık 2026 oturumları 2027/28 kaydı için geçerli; 11. sınıf öğrencisinin kayıt yılı olan 2028/29'da kullanılamaz (Doğrulandı).
  - PoliMi 2027/28 çağrısı Kasım 2026'da bekleniyor (IT-3, **Yayımlanmadı**).

**IT — 12. sınıf (2027 mezunu, 2027/28 kaydı)**
- *Bu yıl:*
  - Asıl CEnT-S'e ilk makro dönemde gir.
  - Hedef üniversiteleri ve testlerini kesinleştir.
  - Dil belgesini al.
  - YKS 2027'ye gir.
  - Universitaly ön başvurusunu yap.
  - DSU belgelerini topla.
- *Tarihler:*
  - CEnT-S 26 Kasım ve 17 Aralık 2026 (Padova sayfası; Doğrulandı). 2026/27 CISIA kuralları IT-1'de bekleniyor (**Yayımlanmadı**).
  - Padova AB dışı başvuru penceresi 7 Ocak – 7 Mart 2027 (Doğrulandı).
  - PoliMi çağrısı Kasım 2026, PoliTo ve Sapienza Aralık 2026 (**Yayımlanmadı**).
  - Vize son tarihi 31 Ekim 2027; MUR genelgesi 2027/28'i kapsıyor (Doğrulandı, K11). Not: rotadaki `it-vize` adımı bu sınıf için "Yayımlanmadı" yerine "Doğrulandı" göstermeli (§4.3).
- *Sık hatalar:*
  - Padova'nın erken penceresini kaçırmak.
  - Universitaly'de birden fazla program seçmeye çalışmak (yalnızca bir program).
  - YKS sonuç belgesine apostil yaptırmayı unutmak.

**IT — Mezun**
- *Bu yıl:*
  1. Uygunluk açık: PoliMi önceki yıl diplomasını kabul ediyor (A3.4), PoliTo TIL-I mezunlara açık (A3.5), CEnT-S'te kısıt yok (A3.6). — Doğrulandı
  2. Hangi yılın YKS sonuç belgesinin kabul edildiğini sor (T-M2, **Teyit gerekir**). Gerekirse YKS 2027'ye yeniden gir. İtalya'da yerleşme gerekmez; yeniden girmek de OBP kaybı yaratmaz, çünkü İtalya OBP'ye bakmaz. OBP yalnızca Türkiye'deki yerleştirmeyi etkiler.
  3. Türkiye'de lisansa kayıtlıysan ya da kayıt yaptırmayı düşünüyorsan DSU kuralını öğren: PoliMi'de 1. sınıf burs profili kalkar (A3.10, Doğrulandı). Diğer bölgeler için T-M3 (**Teyit gerekir**).
  4. Asıl CEnT-S'e ilk makro dönemde gir (Kasım–Aralık 2026). Sonuç 2027/28 için geçerli (Doğrulandı).
- *Tarihler:* 12. sınıfla aynı (2027/28 takvimi).
- *Sık hatalar:*
  - Önceki yıllarda alınmış bir CEnT'i yeni yıl için geçerli sanmak (CEnT yalnızca bir sonraki kayıt yılı için geçerli; K14).
  - Süresi dolmuş TOEFL belgesini kullanmak (K16).
  - Türk üniversitesine kaydı sürdürüp DSU'ya 1. sınıf olarak başvurmak (A3.10).

---

## 4. `data/ulke-rotalari.js` için öneriler (uygulama dosya sahibinde)

### 4.1 Mevcut adımlara `siniflar` etiketi
| id | Şu an | Öneri | Gerekçe |
|---|---|---|---|
| de-ap-profil | ["9","10","11"] | **Aynı kalsın; "mezun" eklenmesin** | A1 (Doğrulandı) |
| de-almanca | null | ["9","10","11","12","mezun"] (= null) | — |
| de-hedef-program | null | null | Mezunda zamanı "hemen" olmalı (§4.3) |
| de-teyit-universite | null | null; mezun için metne eski yıl belgesi sorusu eklenmeli (T-M1) | A2.3 |
| de-yks-gec-teslim | null | **["11","12"]** + mezunlardan yalnızca yerleşmesi olmayanlar | Uygun yerleşmesi olan mezunda çakışma yok |
| de-dil-sinavi | null | null; detaya "TOEFL 2 yıl (ETS); IELTS 2 yıl önerisi" eklenebilir | K16, K17 |
| de-yks-basvuru, de-yks-sinav, de-yks-tercih, de-yks-yerlesme | null | ["9","10","11","12"] + mezunlardan yerleşmesi olmayanlar | A2 |
| de-program-testi, de-basvuru-kis, de-sperrkonto, de-vize, de-saglik-sigortasi, de-basvuru-yaz | null | null | — |
| it-prova-cents | ["11"] | Aynı kalsın | A3.6 / §3.2 |
| it-polimi-erken | ["11"] | Aynı kalsın | — |
| it-hedef-universite, it-tili-teyit, it-dil-sinavi, it-sat, it-cents-asil, it-basvuru, it-tili, it-isee-belgeleri, it-on-kabul, it-universitaly, it-yks, it-dov-cimea, it-konaklama, it-dsu-basvuru, it-vize | null | null | Hepsi mezuna da uygulanır |

**Not:** `siniflar` alanı "mezun ve yerleşmesi var/yok" ayrımını ifade edemiyor. Öneri: profile `yerlesmeDurumu: "uygun" \| "yok" \| "alan-uyumsuz"` alanı eklensin ve adımlara `kosul: "yerlesme-yok"` filtresi tanınsın. Bu bir PM kararıdır (§4.4, K5-a).

### 4.2 Önerilen yeni adımlar
| Yeni id | siniflar | Başlık / özet | Kaynak | Kesinlik |
|---|---|---|---|---|
| de-diploma-notu | ["9","10"] | "Her yılın notu diplomanın dörtte biri": Mezuniyet puanı 4 yılın eşit ortalamasıdır. OBP = diploma × 5 (×0,12 ile en fazla 60 puan). Almanya'da modifiye Bavyera formülüyle Alman notuna çevrilir. | K8 Md. 65; K6 §4.1–4.2; K3 | Doğrulandı (Türkiye için eşik değerleri: Teyit gerekir) |
| de-mezun-yerlesme-kontrol | ["mezun"] | "Elindeki yerleşme belgesi hangi alanda?" Uyumluysa YKS'ye yeniden girme; üniversitenin eski yıl belgesini kabul ettiğini teyit et (T-M1). Değilse YKS'ye yeniden gir; önceki yıl yerleştiysen OBP katsayın yarıya iner. | K2, K6 §4.2, K7 Md. 1.3 | Doğrulandı (kural) + Teyit gerekir (üniversite) |
| de-mezun-ap-uyari *(uyarı)* | ["mezun"] | "Mezuniyetten sonra alınan AP Almanya'da giriş hakkı vermez": Türk diploması için AP kuralı yok; ABD diploması kuralı da AP'lerin lise bitmeden alınmasını ister. | K1, K2 | Doğrulandı |
| de-mezun-aday-vizesi | ["mezun"] | "İsteğe bağlı: öğrenci adayı vizesi (9 ay)": Kabul henüz yoksa Almanya'da başvuru sürecini yürütmek için; lise diploması + ÖSYM sonuç belgesi + finansman kanıtı. | K5 | Doğrulandı (Mart 2025 notu; güncel şartı temsilcilikten kontrol et) |
| it-diploma-notu | ["9","10"] | "Diploma notu İtalya'da sıralamayı etkilemiyor, Türkiye'de etkiliyor": PoliMi ve PoliTo sıralaması test puanına dayanır; YKS'deki OBP ve Almanya seçeneği için not önemli. | K12 Md. 6.2 (12 Ekim notu), K13, K6 | Doğrulandı (PoliMi/PoliTo); diğer üniversiteler Teyit gerekir |
| it-mezun-uygunluk | ["mezun"] | "Mezunlar başvurabilir": PoliMi önceki yıl diplomasını kabul eder, PoliTo TIL-I mezunlara açık, CEnT-S'te kısıt yok. Test sonucu yalnızca bir kayıt yılı için geçerli. | K12 Md. 6.3, K13 Md. 1.5, K14 | Doğrulandı |
| it-mezun-yks-belgesi | ["mezun"] | "YKS sonuç belgenin yılını üniversiteye sor": genelgede ve çağrılarda yıl belirtilmiyor. | K11, K13 | Teyit gerekir (T-M2) |
| it-mezun-dsu-ilk-kayit | ["mezun"] | "Türkiye'de üniversiteye kayıt yaptırdıysan DSU'da 1. sınıf sayılmazsın (PoliMi)": "absolute first enrolment" kuralı. Kayıt düşünüyorsan önce bölgenin DSU kurumuna sor. | K15 Md. 4.2 | Doğrulandı (PoliMi) / Teyit gerekir (diğer bölgeler, T-M3) |

### 4.3 Platform hesap hatası (Ajan 11; öncelik yüksek)
- **Sorun:**
  - `eposta.js` `mezuniyetYili()` mezun için profilde girilen geçmiş yılı döndürüyor.
  - `rota.js` her adımın tarihini `mezuniyetYili + mezuniyetGore` ile hesaplıyor (satır 115–124).
  - Örnek: 2026 mezunu, 2027/28'i hedefliyor. Bu öğrenci YKS, başvuru ve vize adımlarını 2026 tarihleriyle, yani "Geçmiş" olarak görür. `basvuru.yil` e-posta alanı da yanlış yılı yazar.
- **Öneri:**
  - Mezun için profile `hedefBaslangicYili` alanı eklensin.
  - Rota hesabında mezunun "sanal mezuniyet yılı" = `hedefBaslangicYili` olsun. Örnek: 2027/28 hedefinde 2027 kullanılır; `mezuniyetGore: 0` adımları 2027'ye düşer.
  - `mezuniyetGore < 0` olan okul dönemi adımları mezunda "şimdi" olarak gösterilsin ya da gizlensin.
- **Kesinlik etiketi yıla bağlı olmalı:** `it-vize` ve İtalya uyarılarındaki "MUR genelgesi yayımlanmadı" ifadesi 2027 mezunu (12. sınıf) ve 2027/28'i hedefleyen mezun için yanlış, çünkü genelge 2027/28'i kapsıyor (Doğrulandı). Öneri: adımlara `kesinlikYila: { "2027": "Doğrulandı" }` gibi bir alan ya da sınıfa göre metin.

### 4.4 Karar gerektiren konular (PM)
| # | Konu | Seçenekler | Önerim |
|---|---|---|---|
| K5-a | Mezunun yerleşme durumu | (1) Profile `yerlesmeDurumu` alanı eklemek. Artısı: doğru rota. Eksisi: sihirbaza bir soru daha eklenir. (2) Mezuna iki dallı tek adım göstermek. Artısı: basit. Eksisi: kalabalık. | (1) — yanlış yönlendirme riski yüksek |
| K5-b | Mezun profilinde AP | (1) AP adımlarını gizlemek. (2) "Başka ülkeler için" notuyla göstermek. | (1), yalnızca bilgi notu kalsın |
| K5-c | Herkese açık sayfada kesinlik etiketleri | Sınıfa göre hesaplanan etiket ya da sabit etiket | Sınıfa göre: 12. sınıf ve mezun için birçok "Yayımlanmadı" etiketi aslında "Doğrulandı" |
| K4-a | İtalya'yı da hedefleyen mezuna Türkiye'de kayıt uyarısı | Hem DE hem IT seçen mezuna ortak uyarı göstermek | Evet: "Almanya için kayıt gerekmez; kayıt İtalya'da DSU 1. sınıf hakkını etkileyebilir" |

---

## 5. `takip-listesi.md`'ye eklenen maddeler
(Dosyaya "Tur 10 eklemeleri" bölümü olarak işlendi.)
- **MS-1:** ÖSYM 2027-YKS Kılavuzu (Şubat 2027): OBP yarıya düşme kuralı, OBP formülü ve "yalnızca o yılın puanı" ilkesi sürüyor mu? → mezun adımları.
- **MS-2:** PoliMi DSU 2027/28 çağrısı (Haziran–Temmuz 2027): Md. 4.2 "absolute first enrolment" → `it-mezun-dsu-ilk-kayit`.
- **MS-3:** EDISU, DiSCo ve Padova DSU 2027/28 çağrıları: aynı kural var mı? → `it-mezun-dsu-ilk-kayit`.
- **MS-4:** PoliMi 2027/28 mühendislik çağrısı: mezun uygunluk maddesi (2026-27'de Md. 6.3) → `it-mezun-uygunluk` (IT-3 ile birlikte kontrol).
- **MS-5:** CISIA 2026/27 kuralları: kayıt uygunluğu (mezun kısıtı eklendi mi?) → `it-mezun-uygunluk` (IT-1 ile birlikte).
- **MS-6:** College Board 2027 AP: mezunların sınava girme şartı (international FAQ) ve sipariş son günü → `de-mezun-ap-uyari`.
- **Durum notu (14 Ekim 2026):**
  - IT-1 kontrol edildi: CISIA sayfası hâlâ 2025/26 kurallarını (55 soru, 55 €) gösteriyor. Hedef tarih (31 Ekim) henüz gelmedi.
  - DE-1 artık 12. sınıf kullanıcıları için doğrudan mezuniyet yılı takvimi; öncelik yükseltildi.

---

## 6. Yazılı teyit taslakları

**T-M1 — Alman üniversitesi (International Office), bilgi için uni-assist (İngilizce)**
> Subject: Eligibility with a YKS placement from a previous year – Turkish Lise Diplomasi (start: [winter 2027/28])
>
> Dear Admissions Team,
> I graduated in [June 2026] from a 12-year general secondary school in Turkey (Lise Diplomasi). In YKS [2026] I scored [xxx] in the SAY score type and was placed ("Yerleştirme Sonuçları") in the 4-year face-to-face Lisans programme [programme name, university]. I did not enrol / I enrolled and withdrew [delete as applicable].
> 1) Do you accept a YKS placement from a previous year (anabin TUR-BV05) for the [B.Sc. programme], or must the placement be from the year of application?
> 2) Is [placed programme] considered the same or a related subject ("benachbartes Fach") for the [B.Sc. programme]?
> 3) Do I need to document the period since my graduation (e.g., a CV entry or a separate statement)?
> 4) Does the programme require a uni-assist VPD?
> Kind regards, [Name, date of birth]

**T-M2 — İtalyan üniversitesi (Admissions / International Students) (İngilizce)**
> Subject: Non-EU applicant who graduated in [2026] – YKS certificate year and gap year ([a.y. 2027/28])
>
> Dear Admissions Office,
> I am a Turkish citizen residing in Turkey. I obtained my 12-year high school diploma in [June 2026] and took YKS in [2026]. I plan to apply to [programme] for a.y. 2027/28 with [CEnT-S / TIL-I / SAT].
> 1) Is a YKS result certificate from [2026] accepted, or must I sit YKS again in 2027?
> 2) Does the time since my graduation (gap year) affect eligibility, and do you need any statement about it?
> 3) [If applicable] I am currently enrolled at a Turkish university. Must I withdraw before enrolling, and which documents about this enrolment should I submit?
> Kind regards, [Name]

**T-M3 — Bölgesel DSU kurumu (EDISU / DiSCo / ESU Padova / PoliMi DSU) (İngilizce)**
> Subject: First-year DSU eligibility for a student previously enrolled at a university abroad
>
> Dear DSU Office,
> I will enrol in the first year of a Bachelor's programme at [university] in a.y. 2027/28. In [2026/27] I was enrolled in a Bachelor's programme at a university in Turkey (I [completed / did not complete] any exams).
> 1) Will my previous enrolment abroad count as my "first enrolment" (prima immatricolazione assoluta), so that I must apply under the "subsequent years" profile with a minimum number of credits?
> 2) Does withdrawing from the Turkish university before enrolling in Italy change this?
> Kind regards, [Name]

**T-M4 — İstanbul'da AP sınav merkezi koordinatörü (İngilizce)**
> Subject: AP Exam registration for a recent graduate (May 2027)
>
> Dear AP Coordinator,
> I graduated from a Turkish high school in [June 2026]. Does your centre accept recent graduates as external candidates for the May 2027 AP Exams, and what is your local registration deadline and fee? Kind regards, [Name]
>
> *(Yalnızca AP'yi Almanya ve İtalya dışındaki bir hedef için gerçekten isteyen mezun için.)*

---

## 7. Kaynaklar (erişim: 14 Ekim 2026)
| Kod | Kaynak | Belge / yıl |
|---|---|---|
| K1 | anabin, "Nachweis über die Advanced Placement (AP)-Prüfungen" (USA-BV07/08) — https://anabin.kmk.org/api/public/certificates/ (kayıt 6729e86b4a3c434b0b3deab0) | Güncel veri tabanı |
| K2 | anabin, Türkei "Lise Diplomasi einer 12-jährigen allgemeinbildenden Sekundarschule" ve "Code-Karte" (TUR-BV01–15) — https://anabin.kmk.org/api/public/certificates/6729e86b4a3c434b0b3dea1f | Güncel veri tabanı |
| K3 | KMK, "Vereinbarung über die Festsetzung der Gesamtnote bei ausländischen Hochschulzugangszeugnissen" — https://www.kmk.org/fileadmin/pdf/ZAB/Hochschulzugang_Beschluesse_der_KMK/GesNot05.pdf (liste: https://www.kmk.org/zab/zentralstelle-fuer-auslaendisches-bildungswesen/allgemeines-zur-anerkennung/veroeffentlichungen-und-beschluesse/hochschulzugang.html) | 15.03.1991, 12.09.2013 tarihli metin |
| K4 | uni-assist, Türkiye ülke bilgisi — https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/ | © 2026 |
| K5 | Almanya'nın Türkiye temsilcilikleri, öğrenim bilgi notu — https://tuerkei.diplo.de/resource/blob/2705882/e2f501fcfae013d26f393ea8e6441bdf/studium-info-2025-tur-data.pdf | Mart 2025 |
| K6 | ÖSYM, 2026-YKS Kılavuzu — https://dokuman.osym.gov.tr/pdfdokuman/2026/YKS/basvuru_kilavuz06022026.pdf (§4.1–4.2, s. 32–33; §5) | 6 Şubat 2026 |
| K7 | ÖSYM, 2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu — https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf (Md. 1.3; tercih uyarıları 2(ç)) | 21 Temmuz 2026 (ön bilgi baskısı) |
| K8 | MEB Ortaöğretim Kurumları Yönetmeliği, Md. 65 "Mezuniyet puanı" ve hazırlık sınıfı maddesi — https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=18812&MevzuatTur=7&MevzuatTertip=5 | Güncel konsolide metin |
| K9 | College Board International, "Can I take an AP Exam after completing grade 12?" — https://international.collegeboard.org/help-center/can-i-take-ap-exam-after-completing-grade-12 | Tarihsiz |
| K10 | College Board AP Students, "I'm homeschooled, how can I take an AP Exam?" — https://apstudents.collegeboard.org/faqs/im-homeschooled-how-can-i-take-ap-exam ; ücretler: https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees | 2026/27 döngüsü |
| K11 | MUR genelgesi "Procedure … 2026-2027 e 2027-2028" (Ferrara kopyası) — https://www.unife.it/it/internazionale/venire/iscriversi/informazioni/circolare_2026-2027_studenti_internazionali.pdf (s. 8–9) | 2026/27–2027/28 |
| K12 | PoliMi Engineering BSc call 2026-27 — https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf (Md. 6.2, 6.3 s. 15) | 19 Kasım 2025 |
| K13 | PoliTo Call for applications Engineering 2026-27 — https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf (Md. 1.5; çift kayıt Md. 2.3 s. 18; belgeler s. 30) | Aralık 2025 |
| K14 | CISIA, CEnT rules — https://www.cisiaonline.it/en/cent/all-about-CEnT/CEnT-rules | 2025/26 kuralları ("Rules-CEnT-2026") |
| K15 | PoliMi DSU Call a.y. 2026/27 — https://www.polimi.it/fileadmin/user_upload/studenti/tasse-borse-agevolazioni-economiche/dsu/bando_2026-2027/DSU_Call_a.y._2026-2027.pdf (Md. 4.1–4.2, s. 10–11) | 2026/27 |
| K16 | ETS, TOEFL iBT scores — https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html | Güncel |
| K17 | IELTS, "IELTS scoring in detail" — https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail | Güncel |
| — | Mevcut doğrulanmış kaynaklar (yeniden kullanıldı): `data/ulke-rotalari.js` sabitleri (KONS_IST, SAPIENZA, PADOVA, OSYM_*, AP_UCRET, DAAD_SUREC) ve `.agents/mevzuat/karar-notu-2026-10-12.md` | 12–13 Ekim 2026 |

**Doğrulanamayan ve olgu gibi yazılmayanlar:**
- Türk diploması için ZAB Nmax/Nmin değerleri
- Apostil makamı ve diploma için ön onay
- Eski yıl YKS belgesinin üniversitelerce kabulü
- Boşluk yılı açıklaması
- EDISU, DiSCo ve Padova'da ilk kayıt kuralı
- İstanbul'daki merkezlerin mezun kabulü

Hepsi "Teyit gerekir" olarak etiketlendi ve yukarıdaki taslaklara bağlandı.
