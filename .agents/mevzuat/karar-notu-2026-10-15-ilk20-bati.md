# Karar Notu: Ülkenin en iyi 20 üniversitesi (DE, IT, AT, CH, NL, BE, FR, ES)
*Ajan 13 (Mevzuat Uzmanı), Lead PM Dr. Aylin Kaya'ya. Tur 11, 15 Ekim 2026. Veri: `.agents/mevzuat/dogrulama/uni-{de,it,at,ch,nl,be,fr,es}.json`.*

## 1. Sonuç

1. **Sıralama:** En güncel baskı **QS World University Rankings 2027**. QS 18 Haziran 2026'da yayımladı (1.504 kurum). Ülke listelerini QS'nin kendi veri ucundan aldım (`nid=4153156`). Dünya ilk 6'sı QS basın bülteniyle birebir aynı. Toplam **124 üniversite** var. Avusturya (10), İsviçre (11), Hollanda (13) ve Belçika'da (10) QS'de 20'den az kurum olduğu için hepsini listeledim.
2. **İngilizce lisans az, İngilizce yüksek lisans çok.** Lisansta İngilizce "var" olan üniversite sayısı: Almanya 2/20, İtalya 9/20, Hollanda 9/13, Fransa 1/20, İspanya 3/20, Avusturya 2/10, İsviçre 0/11, Belçika 0/10. Yüksek lisansta İngilizce "var" olanlar: Almanya 20/20, Fransa 17/20, İtalya 13/20.
3. **Meberra için en somut sonuç:** İngilizce mühendislik lisansı olan ilk-20 üniversiteleri şunlar:
   - Almanya: TUM, KIT, FAU
   - İtalya: PoliMi, PoliTo, Bologna, Padova, Tor Vergata, Napoli, Genova, Pisa (iki dilli)
   - Avusturya: JKU, Klagenfurt, Leoben
   - Hollanda: TU Delft (4 program), Twente (15 program), Maastricht
   - İspanya: UC3M (Aerospace, Robotics, Biomedical ve diğerleri), UPC (1)

   **ETH, EPFL, RWTH, TU Berlin, TU Darmstadt, TU Wien, TU Graz, Innsbruck ve Salzburg'da İngilizce lisans yok.**
4. **Doğrulanamadı oranı ülkeye göre çok farklı.** Kesinlik etiketi "Doğrulanamadı" olan üniversite sayısı:

   | Ülke | Doğrulanamadı |
   | :-- | :-- |
   | Almanya | 0 |
   | Avusturya | 1 |
   | Fransa | 1 |
   | İsviçre | 2 |
   | Belçika | 3 |
   | Hollanda | 4 |
   | İtalya | 5 |
   | İspanya | 13 |
   | **Toplam** | **29 / 124** |

   Sebepler:
   - Sitelerin bot koruması (403): UniMi, Floransa, Trento, Bicocca, Siena, Brescia, USI, Tilburg, UB, UPF.
   - Program listesinin tarayıcıda yüklenmesi: Leiden, VU, TU/e, KU Leuven, Uni Graz, UNIL.
   - Oturumun web arama kotasının (200) dolması.

   Tahmin yürütmedim. Bu hücreler "Doğrulanamadı" kaldı.
5. **Projede düzeltilecek 2 iddia var (§3).** Biri proje.md'deki "RWTH İngilizce lisans" ifadesi; RWTH'de İngilizce lisans yok. Diğeri bilgi-merkezi.js'deki Pisa kartı.

### Ülke başı özet (lisans = lise sonrası doğrudan giriş; tek döngülü Tıp dahil)

| Ülke | Üniv. | Lisans EN (var / kısıtlı / yok / D.) | Lisans yerel dil "var" | YL EN (var / kısıtlı / D.) | Kesinlik (Doğrulandı / Teyit / Yoruma açık / D.) |
| :-- | :-: | :-- | :-: | :-- | :-- |
| Almanya | 20 | 2 / 9 / 9 / 0 | 20 | 20 / 0 / 0 | 15 / 5 / 0 / 0 |
| İtalya | 20 | 9 / 5 / 0 / 6 | 14 | 13 / 0 / 7 | 11 / 3 / 1 / 5 |
| Avusturya | 10 | 2 / 3 / 4 / 1 | 8 | 8 / 0 / 2 | 8 / 1 / 0 / 1 |
| İsviçre | 11 | 0 / 4 / 3 / 4 | 9 | 5 / 2 / 4 | 5 / 3 / 1 / 2 |
| Hollanda | 13 | 9 / 0 / 0 / 4 | 8 | 6 / 0 / 7 | 5 / 4 / 0 / 4 |
| Belçika | 10 | 0 / 2 / 1 / 7 | 8 | 4 / 1 / 5 | 2 / 5 / 0 / 3 |
| Fransa | 20 | 1 / 7 / 11 / 1 | 14 | 17 / 1 / 2 | 14 / 5 / 0 / 1 |
| İspanya | 20 | 3 / 2 / 1 / 14 | 16 | 1 / 0 / 19 | 0 / 5 / 2 / 13 |

### Ülke gözlemleri

**Almanya**
- Kaynak: DAAD International Programmes veritabanı (2.488 kayıt). Kataloğu okunabilen üniversitelerde üniversite kataloğuyla da karşılaştırdım (RWTH, TU Berlin, TU Darmstadt, Heidelberg, FU, LMU).
- İngilizce lisansı "var" olan yalnızca 2 üniversite:
  - TUM: Almanya'da 8 program; Aerospace, Geodesy ve Information Engineering dahil.
  - FAU: 5 program; AI, Autonomy Technologies ve Clean Energy Processes dahil.
- Harç durumu:
  - Baden-Württemberg (Heidelberg, KIT, Stuttgart, Tübingen, Freiburg): AB dışı öğrenciye 1.500 €/dönem.
  - FAU: AB dışı öğrenciden harç alıyor. 2026/27 kışından itibaren başvuru başına 100 € işlem ücreti var.

**İtalya**
- Hiçbir üniversitenin tamamı İngilizce değil.
- PoliMi: 29 lisanstan 5'i yalnızca İngilizce, 2'si İtalyanca + İngilizce.
- PoliTo: 26 lisanstan 3'ü yalnızca İngilizce, 4'ü iki dilli.
- Bologna: 118 lisans ve tek döngülü programdan 15'i İngilizce.
- Masterlarda tablo tersine dönüyor: PoliMi'de 45 masterın 37'si yalnızca İngilizce.

**Avusturya**
- İngilizce lisansı olan üniversiteler: JKU (4), Klagenfurt (6), Leoben (3), CEU (3; özel), Viyana (1).
- TU Wien, TU Graz, Innsbruck ve Salzburg'da lisans Almanca.
- AB dışı öğrenci harcı: 726,72 €/dönem + 26,20 € ÖH ücreti.

**İsviçre**
- ETH ve EPFL lisansları Almanca ya da Fransızca.
- EPFL'de 2. yıldan itibaren derslerin %50'ye kadarı İngilizce olabilir.
- İki kurumda da masterların çoğu İngilizce.
- ETH'de yabancı öğrenci 2025 güzünden beri dönem başına 2.190 CHF ödüyor.

**Hollanda**
- İngilizce lisansta en geniş seçenek bu ülkede: Twente 15/19, RUG 34, UvA 20'den fazla, Radboud 13.
- TU Delft'te yalnızca 4 lisans İngilizce, ama masterların hepsi İngilizce.

**Belçika**
- Flaman üniversitelerinde İngilizce lisans çok az: UGent'in İngilizce lisansları Kore kampüsünde, Antwerp'te 2, Hasselt'te 0.
- Valon üniversitelerinde İngilizce yalnızca master düzeyinde anılıyor.

**Fransa**
- Kaynak: Campus France "Taught in English" kataloğu.
- Devlet üniversitelerinin çoğunda İngilizce lisans yok.
- Paris 1, Montpellier ve Strasbourg'daki İngilizce programlar yalnızca L2/L3'ten giriş alıyor; **liseden doğrudan giriş yok.**
- Lisansı "var" olan tek kurum Sciences Po (Le Havre, Menton, Reims İngilizce).
- AB dışı öğrenci harcı 2026-27'de: licence 2.902 €/yıl, master 3.950 €/yıl.

**İspanya**
- Okunabilen kataloglar: UC3M (15 tamamen İngilizce lisans), IE (15), Ramon Llull (11), UPM (İngilizce lisans yok, 16 İngilizce master).
- Diğer 13 üniversite için veri yok.

## 2. Karar gerektiren konular

**K1. Doğrulanamadı hücreleri arayüzde nasıl gösterilsin?**

Lisans EN için 37, YL EN için 46 hücre Doğrulanamadı.

| Seçenek | Artı | Eksi |
| :-- | :-- | :-- |
| (a) Listeyi şimdi yayımla, hücreyi "Bilgi yok, üniversiteye sor" etiketiyle göster | Kuralla uyumlu; 124 kurum görünür | İspanya listesi zayıf görünür |
| (b) İngilizce filtresinde yalnızca var/kısıtlı olanları göster | Öğrenci yanıltılmaz | İngilizce programı olan bazı üniversiteler (ör. UniMi'nin AI lisansı) filtrede kaybolur |
| (c) Yayından önce tarayıcıyla bir tur daha (takip IW-2…IW-4) | Doğrulanamadı sayısı belirgin düşer | Bir tur gecikme |

**Önerim: (a) + (c) birlikte.** Filtre "var" ve "kısıtlı" olanları göstersin. Doğrulanamadı olanlar "dil bilgisi yok" rozetiyle listenin altında kalsın.

**K2. "Kısıtlı" ve yalnızca L3 girişli programlar.**

Fransa'daki L3-only programlar ve Heidelberg'in DSH-2 isteyen İngilizce filolojisi, Meberra için fiilen "İngilizce lisans yok" demek.

**Önerim:** Kartta `not` alanı görünsün. Liseden girişi olmayan programlar için `liseGirisi:false` gibi ayrı bir rozet eklensin. Şema değişikliği dosya sahibi ajanın kararı.

**K3. Muhendislik alanı.**

Bu alan genel katalog bilgisine dayanıyor; program dilinden bağımsız. Ca' Foscari için `null` bıraktım.

**Önerim:** Arayüzde mühendislik filtresi "İngilizce mühendislik lisansı" anlamında kullanılmasın. O bilgi `lisans.not` alanında.

## 3. Düzeltilecek iddialar

| Dosya | Eski | Doğru | Kaynak |
| :-- | :-- | :-- | :-- |
| `proje.md` (satır ~553) | "Almanya'nın İngilizce lisans programları (TUM, RWTH Aachen) ve İtalya'nın mühendislik fakülteleri (PoliMi, PoliTo, Bologna) %100 İngilizce dilinde icra edilmektedir." | RWTH'de İngilizce lisans yok: program listesinde "English" filtresi 34 sonuç veriyor, hepsi M.Sc./M.A. PoliMi'nin 29 lisansından 22'si, PoliTo'nun 26 lisansından 19'u yalnızca İtalyanca. Bologna'da 118 lisans ve tek döngülü programdan 15'i İngilizce. Bu kurumlarda İngilizce lisans var ama kurumun tamamı İngilizce değil. | RWTH program listesi (dil filtresi); polimi.it/en/education/laurea-programmes; polito.it/en/education/bachelor-s-degree-programmes; unibo.it/en/study/first-and-single-cycle-degree?lingua=en (erişim 15.10.2026) |
| `data/rehber/bilgi-merkezi.js` (Pisa kartı, satır ~150) | "Pisa'nın tek İngilizce lisansı bir beşeri bilimler programı" / "İngilizce mühendislik lisansı yok" | **Yoruma açık.** Pisa 2026/27 kataloğunda Digital Technologies Engineering "English italian" olarak geçiyor ve açıklamasında "Most courses are taught in English" yazıyor. Yalnızca İngilizce lisanslardan biri Taşkent'te verilen Geology. "İngilizce mühendislik lisansı yok" ifadesi "tamamen İngilizce mühendislik lisansı yok; Digital Technologies Engineering iki dilli, derslerin çoğu İngilizce" olarak değiştirilmeli. | unipi.it/en/education/courses/bachelor-and-single-cycle-master-degree/ (erişim 15.10.2026) |
| `data/mevzuat/ulkeler.js` > `de-tum` (eksik bilgi, çelişki değil) | Yalnızca Information Engineering ve Management and Technology var | DAAD'a göre mühendislik odaklı İngilizce lisanslar da var: Aerospace (BSc, Garching), Geodesy and Earth Observation, Sustainable Engineering for Materials and Processes (Straubing). Eklenmesi değerlendirilmeli; kabul şartları ayrıca doğrulanmalı. | DAAD detail 7256, 11129, 11020 |
| `data/mevzuat/ulkeler.js` > `de-fau` (eksik bilgi) | Yalnızca Artificial Intelligence var | Autonomy Technologies ve Clean Energy Processes de İngilizce lisans. | DAAD detail 8924, 7629 |
| `data/mevzuat/ulkeler.js` > `it-polito` (eksik bilgi) | 5 program var | Food Tech for Ecological Transition (yalnızca İngilizce) ve Architecture (İtalyanca + İngilizce) eksik. | polito.it/en/education/bachelor-s-degree-programmes |
| `AGENTS.md` §1 ve Ajan 2 profili (bilgi; yalnızca PM düzenler) | "%100 İngilizce Politecnico di Milano, Politecnico di Torino, Sapienza" | Bu kurumlarda İngilizce program bazında var; kurumun tamamı İngilizce değil (yukarıdaki sayılar). | yukarıdaki kataloglar |

## 4. Yazılı teyit taslağı

Bot koruması nedeniyle okunamayan İtalyan üniversiteleri için (UniMi, Floransa, Trento, Bicocca, Siena, Brescia):

> **Subject:** English-taught bachelor's programmes 2027/28 and 2028/29 – non-EU applicant from Türkiye
>
> Dear International Admissions Office,
>
> I am a Turkish student who will graduate from a Turkish state high school (MEB, 12 years of schooling) in June 2028, and I plan to apply as a non-EU applicant residing abroad.
>
> 1. Could you please send the official list of bachelor's (laurea triennale) and single-cycle programmes that will be taught entirely in English in a.y. 2027/28, and tell me whether any changes are planned for 2028/29?
> 2. For these programmes, which admission test do you accept for non-EU applicants (CEnT-S, TOLC, SAT or your own test), and when are the application windows for visa applicants?
> 3. Are AP exam results (College Board) considered in the evaluation?
>
> Thank you in advance for your written reply.
>
> Kind regards, [Ad Soyad]

## 5. Kaynaklar (erişim: 15 Ekim 2026)

**Sıralama**
- QS veri ucu, WUR 2027 (`nid=4153156`, 1.504 kurum): https://www.topuniversities.com/rankings/endpoint?nid=4153156&countries=<cc>
- QS 2027 basın bülteni (18 Haziran 2026): https://www.aap.com.au/aapreleases/cision20260617ae86024/

**Ülke katalogları**
- Almanya, DAAD International Programmes veri ucu: https://www2.daad.de/deutschland/studienangebote/international-programmes/api/solr/en/search.json?q=&limit=5000
- Fransa, Campus France "Taught in English" kataloğu: https://taughtie.campusfrance.org/tiesearch/ (veri ucu: https://tie-api.campusfrance.org/sgetprograms/1)
- Fransa, Campus France harç sayfası (2026–27): https://www.campusfrance.org/en/tuition-fees-france

**Harç sayfaları**
- Viyana Üniversitesi (Avusturya): https://studieren.univie.ac.at/en/studying-and-learning/financial-matters/amount-of-the-tuition-fee/students-union-fee
- ETH Zürich: https://ethz.ch/students/en/studies/financial/tuition-fees.html

**Dil bilgisi sayfaları**
- ETH, lisans dili: https://ethz.ch/en/studies/bachelor.html
- ETH, master dil şartları: https://ethz.ch/en/studies/master/application/language-requirements.html
- EPFL öğretim dilleri: https://www.epfl.ch/education/studies/reglement-et-procedure/langues_etudes/
- Bern lisans ve master PDF'leri (2026/27): https://www.unibe.ch/unibe/portal/content/e1006/e251033/e265855/Bachelor_e_26-27_ger.pdf ; https://www.unibe.ch/unibe/portal/content/e1006/e251033/e265857/Master_e_26-27_ger.pdf

Diğer üniversite kaynakları her kaydın `lisans.kaynak` ve `yuksekLisans.kaynak` alanında.

**Takip listesi kontrolü (bu tur)**
- **DU-8:** OeAD Türkiye PDF'i hâlâ "Stand: Oktober 2025" sürümü.
- **IT-1 / MS-5:** CISIA CEnT kuralları hâlâ 2025/26 sürümü (55 soru, 55 €). Hedef tarih (31 Ekim) henüz gelmedi.
- **DU-5 / DU-6:** Kontrol edildi; kardeş notla aynı sonuç, değişiklik yok.
