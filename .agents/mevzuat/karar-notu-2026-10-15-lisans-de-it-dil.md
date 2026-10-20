# Karar Notu: Lisans, Almanya ve İtalya, İngilizce / yerel dil ayrımı
**Ajan 13 · Tur 11 · 15 Ekim 2026 · Muhatap: Lead PM Dr. Aylin Kaya**
**Kapsam:** Lise öğrencisi (9–12) ve lise mezunu; lisans. Yüksek lisans kapsam dışı.
**Proje veri dosyalarında değişiklik yapılmadı.** Bulgular: `dogrulama/lisans-de.json` (39 madde), `dogrulama/lisans-it.json` (43 madde).

---

## Yönetici özeti
1. **Almanya'da giriş hakkı dilden bağımsız (Doğrulandı).** Almanca programda da YKS'de puan türünde 180'in üzerinde puan ve 4 yıllık örgün lisansa yerleşme şart. Studienkolleg iki yolda da kapalı. Fark yalnızca dil belgesinde.
2. **Almanca yol seçenekleri katlıyor (Doğrulandı, HRK 2025/26).** Lisans düzeyindeki 11.767 programın yalnızca 439'u (yüzde 3,7) İngilizce.
3. **Almanca belge listesi Kasım 2025'te güncellendi (Doğrulandı).** Geçerli belgeler: DSH-2, TestDaF'ın her bölümünde TDN 4, DSD II, Feststellungsprüfung. Muafiyet sağlayanlar: Goethe C2, ÖSD C2, telc C1 Hochschule. **Goethe C1 listede yok (Yoruma açık).**
4. **Almanca C1 için 800–1.000 ders saati gerekiyor (Goethe).** Bu yol 9.–10. sınıfta başlarsa gerçekçi. 11. sınıfta sıfırdan başlamak haftada 11–14 ders saati demek ve YKS hazırlığıyla çakışıyor.
5. **Harç dile değil vatandaşlığa bağlı (Doğrulandı).** TUM'da lisans ücreti dönem başına 2.000 ya da 3.000 €; 2027/28 kışından itibaren yeni başlayanlar için 2.300 ya da 3.400 €.
6. **İtalya'da her programda öğretim dilinde en az B2 gerekiyor (Doğrulandı, MUR §6).** Bu düzey vizeden önce Universitaly'ye işleniyor. İtalyanca programda yollar şunlar: üniversitenin kendi sınavı ya da CLIQ sisteminden B2 belgesi (CILS, CELI, PLIDA, CERT.IT). PoliMi doğrudan CLIQ B2 belgesi istiyor. PoliTo 2026/27'de belgeyi 22 Mayıs'a kadar istedi.
7. **İtalyanca yolda testler de İtalyanca yapılabiliyor (Doğrulandı).**
   - TOL: PoliMi'nin testi
   - TOLC-I: 50 soru + 30 İngilizce soru, 35 €, son sınıftan önceki yıldan itibaren girilebiliyor
   - TIL-I: İtalyanca sürümü var

   PoliMi'nin ≥75/100 erken kayıt penceresi yalnızca İtalyanca programlar için.
8. **İngilizce yolda da İtalyanca gerekiyor (Doğrulandı).** PoliMi İngilizce programlarda İtalyanca OFA veriyor; borç mezuniyetten önce kapatılmalı. Tersi de geçerli: İtalyanca programda İngilizce eksikse İngilizce OFA veriliyor.
9. **AP iki ülkede de iki yolu değiştirmiyor (Doğrulandı).** AP German ve AP Italian dil belgesi sayılmıyor.
10. **İstanbul'daki İtalyan lisesi ile DSD/Abitur okulları özel durum.** Muafiyet kuralları doğrulandı. Okulların bugünkü statüsü ise **teyit gerekiyor.**

---

## 1. Sonuç (PM için)
- **Veri modeli:** Ülke × dil seçimi doğru bir ayrım. Almanya'da "ortak" katman büyük: 39 mevcut maddeden 34'ü ortak, 5'i İngilizce yola ait. İtalya'da durum farklı: 35 mevcut maddeden 18'i İngilizce yola ait (CEnT-S, Padova, TOEFL/IELTS), 17'si ortak. Mevcut İtalya içeriği büyük ölçüde İngilizce yolu anlatıyor.
- **Yerel dil yolu artık kaynaklı.** Almanya'da 17 yerel madde var (9 gereken, 3 tarih, 5 hata). İtalya'da 21 yerel madde var (10 gereken, 6 tarih, 5 hata). Her iki ülkede sınıf notları (10'ar), AP etkisi ve burslar ayrı listelendi.
- **Kesinlik dağılımı:**

  | Ülke | Doğrulandı | Teyit gerekir | Yoruma açık | Yayımlanmadı | Doğrulanamadı |
  |---|---|---|---|---|---|
  | Almanya | 31 | 6 | 2 | 0 | 0 |
  | İtalya | 35 | 4 | 1 | 3 | 0 |

---

## 2. Karar gerektiren konular

### K1. Almanca yolu hangi sınıflara "önerilen yol" olarak gösterelim?
| Seçenek | Artı | Eksi |
|---|---|---|
| A. Her sınıfa eşit göster | Basit | 11. ve 12. sınıf öğrencisine gerçekçi olmayan bir yol önerilir: C1 için 800–1.000 ders saati gerekiyor. |
| **B. 9.–10. sınıfta "önerilen", 11. sınıfta "B2'ye yakınsan", 12. sınıf ve mezunda "yoğun kurs / ertesi yıl" uyarısıyla göster** | Goethe saat verisine dayanıyor; YKS yükünü hesaba katıyor | Arayüzde sınıfa göre uyarı metni gerekiyor |

**Önerim: B.** Sınıf notları (`sinifNotlari`) buna göre yazıldı.

### K2. Goethe-Zertifikat C1'i Almanca belge olarak nasıl sunalım?
- A. "Geçerli" yazmak: **yanlış olabilir.** KMK/HRK listesinde Goethe yalnızca C2 ile yer alıyor.
- **B. "Üniversiteye göre değişir; TestDaF ya da telc C1 Hochschule daha güvenli" yazmak.** Önerim B (madde `lis-de-yerel-goethe-c1`, Yoruma açık). Teyit taslağı DE-1 hazır.

### K3. İtalya'da dil yolu seçimi ve PoliMi erken kayıt
PoliMi'nin 11. sınıf erken kayıt penceresi İtalyanca yolun en güçlü avantajı. Ancak bu pencere için kayıtta İtalyanca B2 de gösterilmeli.
- **Önerim:** İtalyanca yolu seçen 11. sınıf öğrencisine şu hedef yazılsın: "CILS B2 Haziran oturumu (2027: 10 Haziran)".
- Pencerenin 2027/28'de sürüp sürmediği **Yayımlanmadı** (IT-3, LD-2).

### K4. `it-sartlar` maddesinin bölünmesi
Mevcut metin "İngilizce B2" diyor; İtalyanca programlar için bu yanlış.
- **Önerim:** Madde iki parçaya ayrılsın:
  - Ortak parça: "öğretim dilinde B2"
  - İngilizce yol parçası: "İngilizce B2"

  Bkz. §3.

---

## 3. Düzeltilecek iddialar (dosya → eski → doğru → kaynak)

| # | Dosya > id | Eski | Doğru | Kaynak |
|---|---|---|---|---|
| 1 | `data/mevzuat/sartlar.js` > `it-sartlar` | "… üniversitenin giriş testi (CEnT-S, TIL-I, TOL ya da SAT) ve İngilizce B2." | "… ve programın öğretim dilinde en az B2 (İngilizce programda İngilizce; İtalyanca programda İtalyanca, CLIQ belgesi ya da üniversite sınavı). Dil düzeyi vizeden önce Universitaly'ye işlenir." | MUR genelgesi §6 |
| 2 | `data/mevzuat/sartlar.js` > `it-test-suresi` | "CEnT sonucu yalnızca bir sonraki akademik yılın kaydı için geçerlidir; TIL-I …" | İngilizce yol için doğru. İtalyanca yol eki: "TOLC sonucu en az girildiği yıl için geçerlidir; daha uzun süre geçerli sayılıp sayılmadığını her üniversite çağrısında belirler." | CISIA TOLC yönetmeliği §1.6 |
| 3 | `data/mevzuat/sartlar.js` > `de-dil`, `de-9-ingilizce`, `de-11-almanca`, `de-dil-suresi`, `it-dil-suresi` | Dil yolundan bağımsız gibi sunuluyor | İngilizce yol etiketi alsın (yol: "en"). Yerel yolda karşılıkları `lis-de-yerel-belgeler` ve `lis-it-yerel-b2`. | — |
| 4 | `data/mevzuat/sartlar.js` > `de-mezun-yaz` | "yaz döneminde başlayan İngilizce program azdır" | Ortak maddeye uygun genel cümle: "yaz döneminde başlayan lisans programı azdır; programın sayfasından kontrol et." İngilizceye özgü kısım İngilizce yola taşınsın. | DAAD başvuru süreci (mevcut kaynak) |
| 5 | `data/mevzuat/ulke-rotalari.js` > `de-almanca` başlığı "Almanca A2–B1 (yalnızca bazı programlarda)" | Doğru, ama yalnızca İngilizce yol için | Yol etiketi "en". Yerel yolda Almanca, C1 düzeyinde giriş şartı. | KMK/HRK RO-DT (2025) |

Diğer kontrol edilen mevcut iddialar doğru bulundu:
- TOL İtalyanca yapılıyor (ulkeler.js, sinavlar.js).
- TIL-I İngilizce ya da İtalyanca yapılıyor.
- PoliMi İngilizce programlarda İtalyanca OFA var.
- ≥75/100 erken kayıt yalnızca İtalyanca programlar için.

---

## 4. Ayrıntılı bulgular

### 4.1 Almanya, Almanca lisans
- **Belge listesi (Doğrulandı):** RO-DT, HRK 04.11.2025 / KMK 27.11.2025 sürümü; 3 ay sonra yürürlüğe giriyor.
  - Kabul edilen belgeler (§2–§6): DSH (genel sonuç ≥ DSH-2), TestDaF (4 bölümün her birinde ≥ TDN 4), Feststellungsprüfung'un Almanca bölümü, DSD II.
  - Muafiyet sağlayanlar (§8(2)): Alman giriş yeterliliğine denk diploma, Goethe C2 GDS, ÖSD C2, telc Deutsch C1 Hochschule.
  - Esneklik (§1(3)–(5), önsöz): Üniversite eşiği DSH-1/TDN 3'e indirebilir ya da yükseltebilir. Düşük eşik, öğrenim sırasında dil kursu şartıyla verilir ve başka programa taşınmaz.
- **DSH:** Yalnızca Almanya'daki üniversite ve Studienkolleg'lerde yapılıyor (§3(2)). Türkiye'den girilemiyor.
- **DSD II:** B2/C1 düzeyini ölçüyor, ücretsiz (§6(6)) ve Almanca öğrenim için dil belgesi sayılıyor (KMK). DSD I (B1) Studienkolleg girişinde yeterli. DSD II yalnızca dil şartını karşılıyor; Türk diploması kuralı (YKS) değişmiyor.
- **İstanbul okulları (Teyit gerekir; PASCH kaydı 10.11.2022):**
  - DSD okulları: Kabataş Erkek, Özel ALEV, Bahçelievler AL, Kartal AL, Üsküdar Ahmet Keleşoğlu AL, Cağaloğlu AL
  - Yurt dışı Alman okulları (DAS): Alman Lisesi, İstanbul Erkek Lisesi, IELEV, Alman Büyükelçiliği Okulu İstanbul şubesi

  Hangi okulun bugün Abitur verdiği resmi sayfadan doğrulanamadı.
- **Süre:**
  - Goethe: B2 için 600–800, C1 için 800–1.000 ders saati (45 dk). Bu, resmi bir şart değil yol gösterici bir değer.
  - Hesap, 9. sınıf başlangıcı: yaklaşık 140 hafta → haftada 6–7 ders saati.
  - Hesap, 11. sınıf başlangıcı: yaklaşık 70 hafta → haftada 11–14 ders saati.
  - Hesap, mezun yoğun kurs (20–25 ders saati/hafta): yaklaşık 8–12 ay.
- **TestDaF:**
  - Yapı: B2–C1 düzeyi, dijital ya da kağıt, yılda 6 tarih, kayıt yalnızca testdaf.de üzerinden.
  - Sonuç süresi: dijitalde yaklaşık 3, kağıtta yaklaşık 6 hafta.
  - Türkiye'deki merkezler ve TL ücreti: Goethe Türkiye sayfaları otomatik erişime kapalı → **Teyit gerekir** (taslak DE-3).
- **Program genişliği:** HRK, WiSe 2025/26: lisans düzeyinde 11.767 program, bunların 439'u (yüzde 3,7) İngilizce. Yüksek lisansta oran yüzde 18,2. Lisans programlarının yüzde 29,8'i kontenjanlı.
- **Harç:** TUM lisans ücreti 2.000 ya da 3.000 €/dönem; 2027/28 kış döneminde başlayanlar için 2.300 ya da 3.400 €. Burs 500–1.800 €/dönem.
  - Muafiyet: Alman eğitim sistemi içinde alınan giriş yeterliliği (ör. Abitur). Studienkolleg sınavı bu muafiyeti sağlamıyor.
  - Yurt dışında alınan Abitur'un bu kapsama girip girmediği **Yoruma açık** (taslak DE-2).

### 4.2 İtalya, İtalyanca lisans
- **MUR §6:**
  - Her üniversite, B2 ve üstü düzeyde bir İtalyanca sınavı yapıyor. Sınav vizeden önce ve tercihen uzaktan yapılıyor; sonuç Universitaly'ye işleniyor.
  - CLIQ B2 belgesi bu sınavdan muaf tutuyor, ancak aday kontenjan içinde kalıyor.
  - Şunlar kontenjandan bağımsız olarak muaf: yurt dışındaki İtalyan devlet ya da denk (paritaria) okullarının diploması, Allegato 2 diplomaları, Perugia/Siena diploması ve CLIQ C1–C2. CLIQ C1–C2'nin kontenjan dışı sayılıp sayılmadığı **Yoruma açık**.
  - Dipnot 3: yurt dışındaki İtalyan okullarının diplomasını alanlar İtalyan öğrencilerle aynı koşullarda başvuruyor. **İstanbul İtalyan lisesinin statüsü teyit gerektiriyor** (taslak IT-4).
- **Kontenjan:** Üniversiteler kontenjanı her yıl 31 Aralık'a kadar belirliyor. 2026/27'den itibaren onaylanan ön başvuru sayısı kontenjanın en fazla yüzde 20 fazlası olabiliyor (yeni kural). Universitaly'de tek program seçiliyor.
- **İstanbul Başkonsolosluğu:** 12 yıl = 8 + 4 olarak sayılıyor, **hazırlık sınıfı sayılmıyor**. Tüm belgelerin aslı ve apostili isteniyor.
- **PoliMi:**
  - İtalyanca programlarda CLIQ B2 zorunlu (Art. 1.2.1). İngilizce yeterlilik de isteniyor, yoksa OFA veriliyor; TOL/TOLC-I İngilizce bölümünde ≥24 doğru muafiyet sağlıyor.
  - TOL: İtalyanca, 65 soru, 35 €.
  - Erken kayıt (Art. 3): ≥75/100 ile yalnızca İtalyanca programlara. 2026 pencereleri 11 Mart–31 Mayıs ve 1 Haziran–16 Temmuz.
- **PoliTo:**
  - TIL-I İngilizce ya da İtalyanca yapılıyor.
  - Vizeli adayın İtalyanca B2 belgesi için son gün 22 Mayıs 2026'ydı (Art. 17).
  - Ek B muafiyetleri: İtalyanca eğitim veren bir lisede ≥1 yıl okumak ya da Kültür Merkezi/üniversite belgesi (final sınavı ve CEFR düzeyi yazılı olmalı).
- **CISIA TOLC-I:**
  - Yapı: 50 soru (matematik, mantık, fen, sözel anlama) + 30 İngilizce soru, toplam 125 dk; 2026 ücreti 35 €.
  - Uygunluk: son sınıftan önceki yıldan itibaren ve mezunlar giriyor; ayda en fazla bir kez.
  - Geçerlilik: "en az girildiği yıl".
- **Türkiye'de dil sınavı:**
  - İstanbul Kültür Merkezi CELI, CILS, CERT.IT ve PLIDA'yı listeliyor.
  - Kursları: A1–B2 için her düzey 3 ay ve 120 saat, 366 €. C1–C2 için 96 saat, 326 €.
  - Katılım belgesi resmi dil belgesi değil.
  - CILS B2 tarihleri: 2026'da 14 Nisan, 16 Haziran ve 3 Aralık (kayıt 24 Ekim'e kadar). 2027'de 8 Nisan, 10 Haziran (kayıt 1 Mayıs'a kadar) ve 2 Aralık (kayıt 23 Ekim'e kadar).
  - Bu oturumların İstanbul'da açılıp açılmadığı ve sonuç süresi **teyit gerektiriyor** (taslak IT-3).
- **İtalyanca tıp, diş ve veteriner (2026/27):** Giriş sınavı yok, yerine serbest kayıtlı eleme dönemi var. Universitaly son günü 3 Ağustos, vize son günü 10 Ağustos 2026. Aynı anda yakın bir programa da kayıt zorunlu.
- **DSU:** PoliMi çağrısında dil yoluna göre bir ayrım yok.

### 4.3 AP'nin rolü (kısa)
- **Almanya:** AP iki yolda da giriş hakkı vermiyor. AP German, KMK/HRK listesinde yok. Almanca kontenjanlı programlarda sıralama çevrilmiş diploma notuyla yapılıyor; AP'nin bu sıralamaya resmi katkısını gösteren bir kaynak yok (Teyit gerekir).
- **İtalya:** AP iki yolda da şart ya da avantaj değil. AP Italian bir CLIQ belgesi değil. PoliMi'de SAT, İtalyanca programlar için de TOL'a alternatif; AP'nin böyle bir karşılığı yok.

### 4.4 Çözüm yolları
**Almanca yol geç kaldıysa:**
1. İngilizce yol: 439 program; IELTS/TOEFL.
2. Mezun yılı yoğun kurs: 8–12 ay; YKS yerleşmesi uygun alandaysa korunuyor.
3. Almanya'da hazırlanıp DSH'ye girmek: öğrenci adayı vizesi gerekiyor.

**İtalyanca B2 yetişmezse:**
1. İngilizce programa geçmek: PoliMi'de İtalyanca OFA ile kayıt mümkün.
2. Bir sonraki akademik yıla kaydırmak.

---

## 5. Yazılı teyit taslakları
Tam metinler JSON dosyalarında (`teyitTaslaklari`).

| Kod | Kime | Dil | Ne soruluyor |
|---|---|---|---|
| DE-1 | Hedef Alman üniversitesi | Almanca | Goethe C1, düşük eşik, dil belgesi ve YKS belgesinin teslim tarihi |
| DE-2 | TUM Student Service Center | İngilizce | Yurt dışında alınan Abitur ile ücret muafiyeti |
| DE-3 | Goethe-Institut İstanbul | Türkçe | TestDaF ve Goethe C1 tarihleri ile TL ücreti (2027–2028) |
| IT-1 | PoliTo | İtalyanca | B2 son günü, Kültür Merkezi belgesi muafiyeti, Nisan CILS sonucunun yetişmesi |
| IT-2 | PoliMi | İtalyanca | İtalyanca erken kayıt (2027/28), CLIQ son günü, 2027'de alınan TOLC-I'nin geçerliliği |
| IT-3 | İstanbul İtalyan Kültür Merkezi | İtalyanca | B2 oturumları, ücret, sonuç süresi |
| IT-4 | İtalya İstanbul Başkonsolosluğu | İtalyanca | İtalyan lisesi diplomasının MUR muafiyetine girip girmediği |

---

## 6. proje.md'ye girecek özet
**Tur 11, Ajan 13 (15 Ekim 2026): lisans, DE/IT İngilizce–yerel dil ayrımı.**
- Mevcut `sartlar.js` maddeleri yola göre sınıflandırıldı:
  - DE: 39 madde (34 ortak, 5 en)
  - IT: 35 madde (17 ortak, 18 en)
- Yeni kaynaklı madde sayıları:
  - DE: 39 (31 Doğrulandı, 6 Teyit gerekir, 2 Yoruma açık)
  - IT: 43 (35 Doğrulandı, 4 Teyit gerekir, 1 Yoruma açık, 3 Yayımlanmadı)
- 7 teyit taslağı hazırlandı.
- Takip listesine LD-1…LD-4 eklendi.
- Düzeltme önerisi: 5 madde (en önemlisi `it-sartlar`: "İngilizce B2" → "öğretim dilinde B2").

---

## 7. Kaynaklar (erişim: 15 Ekim 2026)
| Kaynak | Belge / yıl |
|---|---|
| HRK/KMK, RO-DT: https://www.testdaf.de/fileadmin/testdaf/downloads/Dokumente/2004_06_25-RO_DT.pdf | HRK 04.11.2025 / KMK 27.11.2025 sürümü |
| KMK, Deutsches Sprachdiplom: https://www.kmk.org/kultusministerkonferenz/uebergreifende-themen/das-deutsche-sprachdiplom-der-kultusministerkonferenz.html | Güncel |
| ZfA, DSD: https://www.auslandsschulwesen.de/zfa-de/deutsch-lernen/deutsch-als-fremdsprache-daf-/deutsches-sprachdiplom-dsd- | Ausführungsbestimmungen, 11.12.2024 |
| PASCH-net haritası: https://www.pasch-net.de/de/pasch-schulen/weltkarte.html | Türkiye kayıtları 10.11.2022 |
| anabin, Türkiye Lise Diploması: https://anabin.kmk.org/api/public/certificates/6729e86b4a3c434b0b3dea1f | Güncel veri tabanı (TUR-BV05/07) |
| Goethe, C1 ek bilgi: https://www.goethe.de/ins/gb/de/m/sta/lon/prf/gzc1/w24.html ; B2: https://www.goethe.de/ins/ps/de/m/spr/prf/gzb2/wi9.html | Güncel; içerik arama özetinden alındı, sayfalar otomatik erişime kapalı |
| Goethe Türkiye, TestDaF: https://www.goethe.de/ins/tr/tr/spr/prf/testdaf.html | 5 Haziran 2026 sürümü (arşiv kopyası üzerinden okundu) |
| TestDaF tarihler ve kayıt: https://www.testdaf.de/de/teilnehmende/mein-testdaf/testdaf-termine-und-anmeldung/ | © 2026 |
| HRK istatistik, WiSe 2025/26: https://www.hrk.de/fileadmin/redaktion/hrk/02-Dokumente/02-03-Studium/02-03-01-Studium-Studienreform/HRK_Statistik_BA_MA_UEbrige_WiSe_2025_26.pdf | 2025/26 |
| TUM öğrenim ücreti: https://www.tum.de/en/studies/fees/tuition | Güncel; WS 2027/28 artışı ilan edilmiş |
| MUR genelgesi 2026-27/2027-28: https://www.unife.it/it/internazionale/venire/iscriversi/informazioni/circolare_2026-2027_studenti_internazionali.pdf | 2026/27–2027/28 |
| İstanbul Başkonsolosluğu, lisans: https://consistanbul.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/studiare-in-italia/universita/laurea-triennale-e-laurea-magistrale-a-ciclo-unico/ | Güncel |
| İstanbul Başkonsolosluğu, İtalyanca tıp 2026/27: (aynı dizin) …/corsi-di-laurea-magistrale-a-ciclo-unico-in-medicina-…-anno-accademico-2025-2026-in-lingua-italiana-erogati-da-atenei-statali/ | 2026/27 |
| PoliMi Engineering BSc çağrısı 2026-27: https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf | 2026/27 (Art. 1–3, 7, 9–10) |
| PoliTo çağrısı 2026-27: https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf | 2026/27 (Art. 7, 17, Ek B) |
| CISIA TOLC-I yapısı: https://www.cisiaonline.it/tolc/tolc-i/struttura-della-prova-e-sillabo ; TOLC yönetmeliği: https://www.cisiaonline.it/tolc/tutto-sul-TOLC/regolamento-tolc | 2026 |
| CISIA CEnT kuralları: https://www.cisiaonline.it/en/cent/all-about-CEnT/CEnT-rules | Hâlâ 2025/26 sürümü (IT-1) |
| İstanbul İtalyan Kültür Merkezi, sertifikalar ve kurslar: https://iicistanbul.esteri.it/it/lingua-e-cultura/certificazioni/ ; https://iicistanbul.esteri.it/it/lingua-e-cultura/i-corsi-di-lingua/ | Güncel |
| CILS tarihleri 2026: https://cils.unistrasi.it/1/211/415/Le_date_degli_esami_2026.htm ; 2027: https://cils.unistrasi.it/1/213/428/Le_date_degli_esami_2027.htm | 2026, 2027 |
| PoliMi DSU çağrısı 2026/27: https://www.polimi.it/fileadmin/user_upload/studenti/tasse-borse-agevolazioni-economiche/dsu/bando_2026-2027/DSU_Call_a.y._2026-2027.pdf | 2026/27 |

**Sınırlar:**
- Bu turda web arama kotası doldu.
- Goethe Türkiye sayfalarındaki ücret ve tarihler, TestDaF'ın Türkiye ücreti, İtalyan lisesinin statüsü ve CILS sonuç süresi bu yüzden "Teyit gerekir" olarak bırakıldı.
- İtalya'da İtalyanca lisans programlarının toplam sayısı için resmi bir istatistik aranmadı.
