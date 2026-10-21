# İçerik Denetimi — AP Biology, AP English Language, AP Electives

Tarih: 21.10.2026 · Kaynak: `server/tohum/soru-bankasi.json` · Ayrıntılı veri: `biology-english-electives.json`

## Kısa sonuç

- **363 soru incelendi:** Biology 185, English 65, Electives 113.
- **Hiçbir soruda cevap anahtarı yanlış değil.**
  - Her soru önce anahtara bakılmadan çözüldü, sonra anahtarla karşılaştırıldı.
  - 363 sorunun 363'ünde bağımsız cevap anahtarla aynı çıktı.
- **Şüpheli soru yok.** 20 soruda yalnızca küçük düzeltme önerisi var:
  - konu numarası
  - çeldirici açıklaması
  - zorluk düzeyi
  - tekrar eden veri
- **Zenginleştirme tamamlandı.** 363 sorunun tamamı için `ek` alanı dolduruldu:
  - kavram
  - ipucu
  - hesap makinesi bilgisi
  - sık hata
  - CED konusu
  - gerekiyorsa zorluk önerisi

## Ders bazında sayılar

| Ders | Soru | Doğru | Düzeltme önerisi | Hatalı anahtar | Şüpheli |
|---|---|---|---|---|---|
| AP Biology (161 ders + 24 seviye) | 185 | 173 | 12 | 0 | 0 |
| AP English Language (41 ders + 24 seviye) | 65 | 60 | 5 | 0 | 0 |
| AP Electives (CS A 48, Micro 32, Macro 33) | 113 | 110 | 3 | 0 | 0 |

## Hatalı veya şüpheli anahtarlar

Yok. Sayısal sorular ayrıca yeniden hesaplandı:

- **Biology:** su potansiyeli, ki-kare, Hardy–Weinberg, rekombinasyon frekansı, PCR, lojistik büyüme.
- **CS A:** Java kodu adım adım izlendi (tam sayı bölmesi, indeks sınırları, String/ArrayList metotları).
- **Ekonomi:** çarpanlar, para yaratma ve esneklik hesapları.

Hepsi anahtarla tutarlı.

## Düzeltme önerileri (anahtar doğru, metin veya etiket düzeltilmeli)

**Biology**

- **bio_u2_q8:** Açıklama endosimbiyozun "tartışmasız" kanıtlandığını söylüyor. "Güçlü biçimde destekler" denmeli. Konu etiketi 2.11 olmalı.
- **bio_u1_q7:** bio_u2_q3 ile neredeyse aynı soru. İçerik de CED 2.4'e ait. Unit 1 için yeni bir makromolekül sorusuyla değiştirilmeli.
- **Konu numarası hataları:**
  - bio_u7_q15 → 7.12 / ki-kare
  - bio_u7_q26 → 7.12
  - bio_u7_q27 → 7.13
- **Seviye testi ders sorusunu tekrar ediyor:** sv_bio_u1_3 (= bio_u6_q1) ve sv_bio_u4_2 (= bio_u4_q21). Sayılar değiştirilmeli. sv_bio_u4_3, sv_bio_u5_2 ve sv_bio_u2_2 de yakın tekrar.
- **Zorluk fazla yüksek:** bio_u1_q2, bio_u5_q15, sv_bio_u5_3, sv_bio_u6_3 ve sv_bio_u8_3 için medium önerilir. sv_bio_u1_3 için easy önerilir.

**CS A**

- **csa_q1:** Konu etiketi "1.5 Expressions". 2025-26 CED'de bu konu 1.3; 1.5 "Casting".
- **csa_d4:** D çeldiricisinin açıklaması tutmuyor. `i += 2` ifadesini `i++` gibi okuyan öğrenci "3 5 7 4" sonucunu değil, B şıkkındaki ArrayIndexOutOfBoundsException'ı bulur.
- **csa_d6:** D çeldiricisi (12) için "1 tabanlı indeks" açıklaması yanlış; o yanılgı 16 verir. 12, satır × sütun sayısıdır (3 × 4).

**English**

- **eng_read_q12:** Pasaj başlığı "address to first-year engineering students" diyor. Başlık öğrenciye görünüyorsa cevabı ele veriyor; başlık nötrleştirilmeli.
- **eng_read_q16:** Şık sırası karışık (1, 3, 6, 4). Sayısal sıraya dizilmeli; bu durumda anahtar D olur.
- **eng_write_q19:** D şıkkı "save the school money" yerine "save money" diyor; ifade aynen korunmalı. Açıklamada C'nin hatası "neden-sonuç ters" yerine "yanlış nedensellik" diye yazılmalı.
- **eng_write_q15 ve eng_write_q18:** Saf dilbilgisi soruları (SAT tarzı). AP Lang retorik amaç sorar; soru kökü buna göre yeniden çerçevelenmeli.

## Kapsam

### AP Biology (CED Unit 1–8, ders + seviye)

| Ünite | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Soru | 17 | 22 | 27 | 29 | 28 | 29 | 30 | **3** |

- **Unit 8 Ecology hiç ders sorusu yok** (0/161). Seviye testinde 3 soru var. Sınavda bu ünitenin ağırlığı %10–15.
- **Hiç sorusu olmayan konular:** 8.1, 8.3, 8.5, 8.6, 8.7 ve 7.11 Extinction.
- **Tek sorulu konular:** 2.2, 2.5, 2.7, 2.9, 2.10, 2.11, 3.1, 3.2, 3.7, 5.5, 7.1, 7.3, 7.7, 7.8, 7.13.

### AP English Language (41 ders sorusu, 24 seviye)

- Ders soruları CED'in 8 beceri kategorisine göre etiketlenmiş; 9 CED ünitesine eşleme yapılmamış.
- **Okuma ve yazma dağılımı:**
  - Reading: ders 17, seviye 12
  - Writing: ders 24, seviye 12
  - Gerçek sınavda okuma daha ağır: 45 sorunun 23–25'i okuma.
- **Kategori dağılımı (ders sorusu):**
  - Retorik durum: R 4 / W 4
  - İddia ve kanıt: R 5 / W 5
  - Akıl yürütme ve organizasyon: R 4 / W 5
  - Üslup: R 4 / W 10
- **Eksikler:**
  - Okuma pasajları çok kısa: 3 pasaj, her biri 7–9 cümle. Gerçek sınavda 500–700 kelimelik pasaj başına 11–13 soru var.
  - 20. yüzyıl öncesine ait metin yok.
  - Grafik veya tablo içeren kaynak sorusu yok.
  - Ders setinde yalnızca 2 hard soru var.

### AP Electives

- **CS A:** Sorular **2025-26 revize 4 üniteli CED**'i izliyor. Konu numaraları (2.11, 3.9, 4.14–4.17) yeni CED ile örtüşüyor ve eski kalıtım ünitesinden soru yok.
  - Ünite dağılımı: U1 11, U2 9, U3 6, U4 22.
  - Hiç sorusu olmayan konular: 3.1–3.3 ve 3.5, 4.6 Text Files (yeni CED konusu), 4.7 Wrapper Classes, 2.12 Run-time analysis.
  - Kod yazdıran (FRQ tarzı) soru yok.
- **Micro (32 soru):** U1 2, U2 5, U3 6, U4 7, U5 5, U6 7.
  - Unit 1'de PPC, kıtlık ve fayda-maliyet konularında soru yok.
  - Unit 2'de arz esnekliği, gelir/çapraz esneklik, tarife/kota, fiyat tavanı/tabanı konularında soru yok.
- **Macro (33 soru):** U1 5, U2 4, U3 4, U4 7, U5 7, U6 6.
  - Sınavın en ağır ünitesi Unit 3'te yalnızca 4 soru var. AD, SRAS, LRAS, AD-AS dengesi ve otomatik stabilizatörler konularında soru yok.
  - Unit 2'de GDP sınırlılıkları, enflasyonun maliyetleri ve iş çevrimleri konularında soru yok.
- **Ekonomi sorularının hiçbirinde grafik yok.** Gerçek sınavda grafik okuma ağırlıklı.
- **Electives için seviye testi yok.**

## İlk 10 öneri

1. **Biology Unit 8 Ecology için ders seti yazın** (en az 20 soru). Önce 8.1, 8.3, 8.5, 8.6 ve 8.7 konularından başlayın.
2. **Macro Unit 3 (AD-AS) setini 4 sorudan en az 15 soruya çıkarın.** Grafikle kayma, durgunluk/enflasyon açığı ve LRAS konularını kapsayın.
3. **Micro Unit 1 ve 2'yi genişletin.** PPC, fırsat maliyeti, esneklik türleri, fiyat tavanı/tabanı ve tarife/kota için soru ekleyin.
4. **Ekonomiye grafik tabanlı sorular ekleyin** (SVG grafik ya da tablo-grafik). Sınavda bu tür sorular yaygın.
5. **English'e 2–3 uzun pasaj seti ekleyin** (pasaj başına 500+ kelime, 10–13 soru). Bunlardan biri 19. yüzyıl nesri olsun. Reading ağırlığını artırın.
6. **CS A Unit 3 ve yeni CED konularını tamamlayın:** sınıf tasarımı, metot yazma, 4.6 Text Files (Scanner/File), 4.7 Wrapper Classes, 2.12 çalışma zamanı analizi.
7. **Seviye testlerindeki 5 tekrarı değiştirin.** Biology seviye soruları ders sorularıyla aynı sayıları kullanmamalı.
8. **Etiketleri düzeltin:**
   - bio_u7_q15/q26/q27 ve csa_q1 konu numaraları
   - csa_d4 ve csa_d6 çeldirici açıklamaları
   - bio_u2_q8'deki "tartışmasız" ifadesi
9. **Zorluk etiketlerini kalibre edin.** Tek adımlı hesaplar "hard" işaretlenmiş (ayrıntılar JSON'daki `zorlukOnerisi` alanlarında). English ders setinde hard soru sayısı artırılmalı.
10. **Electives için seviye testi oluşturun** (CS A, Micro ve Macro için her ünitede 3'er soru). Ayrıca English'teki SAT tarzı dilbilgisi sorularını retorik amaç odaklı olarak yeniden yazın.
