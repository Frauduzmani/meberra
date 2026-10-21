# AP Calculus İçerik Denetimi (AB + BC)

_Tarih: 2026-10-21 · Kaynak: `server/tohum/soru-bankasi.json` (sayfa = ap-calculus) · Makine okunur sürüm: `calculus.json`_

## 1. Özet

| Ölçüt | Değer |
|---|---|
| İncelenen soru | **295** (ders: 241, seviye: 54) |
| Anahtarı doğru | **295 / 295** |
| Hatalı anahtar | **0** |
| Şüpheli (ikinci doğru şık / belirsiz kök) | **0** |
| Düzeltme önerisi olan soru | **29** (anahtar doğru; metin, şık, LaTeX, çeldirici açıklaması veya tekrar sorunu) |
| Zenginleştirme (ek) eklenen | **295 / 295** |
| Zorluk etiketi değişikliği önerisi | 93 (43 hard→medium, 49 medium→easy, 1 easy→medium) |
| Hesap makinesi: gerekmez / yardımcı / gerekli | 273 / 6 / 16 |

**Yöntem:** Her soru, anahtara bakmadan önce bağımsız çözüldü. Hesap makinesi gerektiren sorular (integraller, kökler, polar alanlar, yay uzunlukları vb.) Node.js ile Simpson integrali ve ikiye bölme yöntemiyle sayısal olarak doğrulandı. SVG grafikler (limit grafiği, f/f′ grafikleri, iki eğim alanı) koordinatlardan okunarak kontrol edildi. Çeldirici açıklamalarındaki sayısal iddialar (ör. "bu hata 2/5 verir") tek tek yeniden hesaplandı.

## 2. Hatalı ve şüpheli anahtarlar

**Hatalı anahtar bulunmadı.** 295 sorunun tamamında `dogru` alanı benim bağımsız çözümümle örtüşüyor. Şüpheli olarak işaretlenen soru da yok; her soruda tek bir savunulabilir doğru şık var. Güven çoğunlukla 0.98–0.99. En düşük güven `calc_u1_q22` için 0.95: A şıkkı da doğru bir sonuç söylüyor, ama süreklilik hipotezini yazmadığı için "complete justification" ölçütünde D tek doğru.

## 3. Düzeltme önerileri (anahtar doğru)

| ID | Tür | Sorun (kısa) |
|---|---|---|
| `calc_u1_q2` | Çeldirici açıklaması | hata_aciklamalari A ve B şıklarla uyuşmuyor: A'nın tanısı (2a = 4 − a) a = 4/3 verir, a = 1 vermez; B'nin tanısı (2a − a) a = 1 verir, a = −1 vermez. |
| `calc_u1_q10` | CED etiketi | Konu etiketi '1.11 Removing Discontinuities' CED ile uyuşmuyor: CED'de 1.11 = Defining Continuity at a Point, 1.13 = Removing Discontinuities. Etiket 1.13 olmalı. |
| `calc_u1_q19` | Metin | Açıklamanın 4. adımı yalnızca 'soldan limit −4' diyor; doğru şık her iki tek taraflı limiti (−4 ve 4) belirtiyor. Küçük tutarlılık düzeltmesi önerilir. |
| `calc_u1_q22` | Metin | A şıkkı da matematiksel olarak doğru bir sonuç söylüyor; 'complete justification' vurgusu ile D tek doğru, ama kökte 'the most complete … including all hypotheses' ifadesi netliği artırır. |
| `calc_u2_q2` | LaTeX | LaTeX hatası: cases ortamında satır ayırıcı '\\' yerine tek '\ ' yazılmış; iki parça tek satırda görünür. |
| `calc_u2_q3` | Çeldirici açıklaması | B (−11) şıkkının tanısı uyuşmuyor: (−4)(−1)'i −4 almak −4+15 = 11 verir (C şıkkı). −11 ancak 4 − 15 gibi bir işaretle elde edilir. |
| `calc_u2_q4` | Çeldirici açıklaması | D (y = −x + 7) şıkkının tanısı eğimi 2 hesaplıyor; şıkta eğim −1. Tanı şıkla uyuşmuyor. |
| `calc_u2_q12` | CED etiketi | Konu etiketi '2.6' ama içerik e^x ve sin x türevleri (CED 2.7). 2.6 = sabit/toplam/fark kuralları. |
| `calc_u3_q1` | Çeldirici açıklaması | C (−14) şıkkının tanısı belirsiz: verilen değerlerle −14 = g'(3)·g'(1) = 7·(−2) eşleştirmesinden çıkar; tanı bunu açıkça göstermiyor. |
| `calc_u3_q2` | Çeldirici açıklaması | A (−2/3) şıkkının tanısı uyuşmuyor: xy' terimi unutulursa y' = −(2x+y)/(2y) = −1 çıkar, −2/3 değil. |
| `calc_u3_q8` | Özdeş şıklar | B ve C şıkları matematiksel olarak AYNI ifade (x^{sin x}·ln x·cos x = cos x·x^{sin x}·ln x). İki özdeş çeldirici var; biri değiştirilmeli. Logaritmik türev (x^{sin x}) AP CED'de açıkça listelenmiyor; zor/zenginleştirme sorusu olarak işaretlenebilir. |
| `calc_u4_q1` | Çeldirici açıklaması | B (−1/(6π)) şıkkının tanısı (r = 4 sabit alınması) hesapla uyuşmuyor: r = 4 sabit alınırsa dh/dt = −3/(8π) çıkar. |
| `calc_u4_q14` | Metin | İçerik tekrarı: calc_u1_q11 ile aynı limit ((1 − cos x)/x²). Biri farklı bir limitle (ör. (x − sin x)/x³ = 1/6) değiştirilebilir. |
| `calc_u5_q3` | Eksik grafik | Kök 'The figure above' diyor ama soruda grafik yok, yalnızca sözel betim var. Ya bir SVG grafik eklenmeli ya da ifade düzeltilmeli. |
| `calc_u6_q25` | Çeldirici açıklaması | D şıkkının tanısı (v = 3e^{3x}) şıkla tam uyuşmuyor: bu hatayla 3xe^{3x} − e^{3x} çıkar, şıkta −3e^{3x} var. Küçük düzeltme. |
| `calc_u6_q32` | BC etiketi | Konu 'BC ONLY 6.14' olarak etiketli ama çözüm yalnızca uzun bölme + u-sub (AB konusu 6.10) gerektiriyor; ayrıca kökte '[BC ONLY]' ön eki eksik (diğer BC sorularıyla tutarsız). |
| `calc_u6_q33` | Tekrar soru | İÇERİK TEKRARI: calc_u6_q27 ile birebir aynı integral (∫(5x+1)/((x−1)(x+2))dx), yalnızca şık sırası farklı. Biri farklı bir integrale çevrilmeli. |
| `calc_u7_q31` | BC etiketi | Kökte diğer BC sorularındaki '[BC ONLY]' ön eki yok (tutarlılık). |
| `calc_u8_q26` | BC etiketi | Kökte BC etiketi yok; konu başlığında '(BC ONLY)' var. Tutarlılık için kök başına '[BC ONLY]' eklenmeli. |
| `calc_u8_q27` | BC etiketi | Kökte BC etiketi yok (konu '(BC ONLY)' diyor); tutarlılık için '[BC ONLY]' eklenmeli. |
| `calc_u8_q28` | BC etiketi | Kökte BC etiketi yok; ayrıca konu 8.1 (AB) altında ama polar gösterim BC (Unit 9) bilgisi gerektiriyor. |
| `calc_u9_q25` | BC etiketi | Kökte BC etiketi yok (konu '(BC ONLY)' diyor). |
| `calc_u10_q3` | Çeldirici açıklaması | C (3) şıkkının tanısı tek başına (1 + r) hatası olarak verilmiş; bu hata ilk terim 10/3 ile 2 (D şıkkı) verir. 3 sonucu ancak ilk terim 5 ve 1 + r birlikte alınırsa çıkar. |
| `calc_u10_q7` | Çeldirici açıklaması | B şıkkının açıklamasında serinin toplamı '≈ 2.04' deniyor; gerçek değer ≈ 2.11 (Σ_{n≥2} 1/(n ln²n) ≈ 2.1097). Sayısal ifade düzeltilmeli. |
| `calc_u10_q16` | Çeldirici açıklaması | A (L = 2/5) şıkkının tanısı uyuşmuyor: (2n+2)!/(2n)! = 2n+2 alınırsa L = 0 çıkar. 2/5, (n!)²'nin oranını (n+1) almakla oluşur. |
| `sv_calcab_u3_2` | Tekrar soru | İÇERİK TEKRARI: calc_u3_q2 ile birebir aynı soru (x² + xy + y² = 7, (1, 2), cevap −4/5). Seviye testinde farklı bir eğri/nokta kullanılmalı. |
| `sv_calcab_u4_3` | Tekrar soru | İÇERİK TEKRARI: calc_u4_q5 ile birebir aynı limit ((e^{2x} − 1 − 2x)/x², cevap 2). Seviye testi için farklı bir limit önerilir. |
| `sv_calcbc_u3_2` | Tekrar soru | İÇERİK TEKRARI: calc_u3_q3 ile birebir aynı soru (x² + y² = 25, (3, 4), cevap −25/64). |
| `sv_calcbc_u6_3` | Tekrar soru | İÇERİK TEKRARI: calc_u6_q34 ile birebir aynı integral (∫_2^3 dx/(x²−1), cevap ½ln(3/2)). |

Bilgi amaçlı (düzeltme gerekmez) benzerlikler: `sv_calcab_u1_1`, `sv_calcab_u1_3`, `sv_calcab_u4_2`, `sv_calcbc_u1_3`, `sv_calcbc_u5_2`, `sv_calcbc_u10_3`.

## 4. Kapsam: CED birimleri

Ders soruları: **241**. AB+BC ortak konular: **160**, yalnız BC konuları (6.11–6.13, 7.5, 7.9, 8.13, Unit 9–10): **81**.

| Unit | Ders sorusu | CED sınav ağırlığı AB | CED sınav ağırlığı BC |
|---|---|---|---|
| 1 | 22 | 10–12% | 4–7% |
| 2 | 15 | 10–12% | 4–7% |
| 3 | 15 | 9–13% | 4–7% |
| 4 | 15 | 10–15% | 6–9% |
| 5 | 17 | 15–18% | 8–11% |
| 6 | 34 | 10–15% | 17–20% |
| 7 | 31 | 6–12% | 6–9% |
| 8 | 28 | 10–15% | 6–9% |
| 9 | 25 | — | 11–12% |
| 10 | 39 | — | 17–18% |

**Denge yorumu:** AB sınavında puanın yaklaşık %44–58'i Unit 2–5 (türev ve uygulamaları) konularından gelir; bu dört birimde ise toplam yalnızca 62 ders sorusu var. Buna karşılık yalnız BC kapsamındaki Unit 10'da tek başına 39 soru bulunuyor. Ders havuzu BC lehine ağırlıklı; AB öğrencisi için türev birimleri zayıf kalıyor.

### Boş ya da zayıf konular (ders sorusu 0–1)

| Konu | Ad | Ders | Seviye |
|---|---|---|---|
| 1.1 | Introducing Calculus: Can Change Occur at an Instant? | **1** | 0 |
| 1.2 | Defining Limits and Using Limit Notation | **1** | 0 |
| 1.3 | Estimating Limit Values from Graphs | **1** | 0 |
| 1.4 | Estimating Limit Values from Tables | **1** | 0 |
| 1.5 | Determining Limits Using Algebraic Properties of Limits | **1** | 0 |
| 1.7 | Selecting Procedures for Determining Limits | **1** | 0 |
| 1.8 | Determining Limits Using the Squeeze Theorem | **1** | 0 |
| 1.9 | Connecting Multiple Representations of Limits | **1** | 0 |
| 1.10 | Exploring Types of Discontinuities | **1** | 0 |
| 1.11 | Defining Continuity at a Point | **0** | 0 |
| 1.12 | Confirming Continuity over an Interval | **1** | 0 |
| 1.14 | Connecting Infinite Limits and Vertical Asymptotes | **1** | 0 |
| 2.1 | Defining Average and Instantaneous Rates of Change at a Point | **1** | 0 |
| 2.2 | Defining the Derivative of a Function and Using Derivative Notation | **1** | 1 |
| 2.3 | Estimating Derivatives of a Function at a Point | **1** | 0 |
| 2.5 | Applying the Power Rule | **1** | 2 |
| 2.6 | Derivative Rules: Constant, Sum, Difference, and Constant Multiple | **0** | 0 |
| 4.1 | Interpreting the Meaning of the Derivative in Context | **1** | 0 |
| 4.3 | Rates of Change in Applied Contexts Other Than Motion | **1** | 0 |
| 4.4 | Introduction to Related Rates | **1** | 0 |
| 5.1 | Using the Mean Value Theorem | **1** | 1 |
| 5.2 | Extreme Value Theorem, Global vs Local Extrema, Critical Points | **1** | 0 |
| 5.3 | Intervals of Increase/Decrease | **1** | 0 |
| 5.7 | Second Derivative Test | **1** | 0 |
| 5.9 | Connecting f, f', and f'' | **1** | 1 |
| 5.10 | Introduction to Optimization Problems | **1** | 0 |
| 5.12 | Exploring Behaviors of Implicit Relations | **1** | 0 |
| 6.1 | Exploring Accumulations of Change | **1** | 0 |
| 6.3 | Riemann Sums, Summation Notation, Definite Integral Notation | **1** | 0 |
| 8.10 | Disc Method: Other Axes | **1** | 0 |
| 8.11 | Washer Method: x- or y-Axis | **1** | 0 |
| 8.12 | Washer Method: Other Axes | **1** | 0 |

Ders sorusu 2 olan konu sayısı: 42. Tam liste `calculus.json → kapsam` içinde.

## 5. En önemli 10 iyileştirme önerisi

1. **`calc_u2_q2` LaTeX düzeltmesi (acil, görünür hata):** `cases` ortamında satır ayırıcı `\\` yerine tek `\ ` var; parçalı fonksiyon tek satırda bozuk görünüyor. Düzeltilmiş kök `oneri.govde` alanında.
2. **`calc_u3_q8` özdeş şıklar:** B ve C aynı ifade (çarpımın sırası farklı). C için yeni çeldirici `oneri.secenekler` alanında.
3. **Birebir tekrar soruları ayıklayın:** `calc_u6_q33` = `calc_u6_q27`, `sv_calcab_u3_2` = `calc_u3_q2`, `sv_calcbc_u3_2` = `calc_u3_q3`, `sv_calcab_u4_3` = `calc_u4_q5`, `sv_calcbc_u6_3` = `calc_u6_q34`, `calc_u4_q14` ≈ `calc_u1_q11`. Seviye testindeki tekrar, ders havuzunu çözen öğrencide seviyeyi olduğundan yüksek ölçtürür. Her biri için yeni kök önerisi verildi.
4. **Hesap makinesi gerektiren soruları artırın:** Yalnızca 16/295 (%5) soru hesap makinesi gerektiriyor. AP sınavında ÇSS Part B (45 sorunun 15'i) ve FRQ Part A (2 soru) hesap makinesiyle çözülür. Her birime 3–5 hesap makinesi sorusu ekleyin (fnInt, kesişim bulma, nDeriv, radyan modu tuzakları).
5. **Unit 2–5 (AB çekirdeği) havuzunu büyütün:** Bu birimlerde 15–17 soru var, Unit 10'da 39. Özellikle tek sorulu konular: 1.1–1.5, 1.7–1.12, 1.14, 2.1–2.3, 2.5, 4.1, 4.3, 4.4, 5.1–5.3, 5.7, 5.9, 5.10, 5.12, 6.1, 6.3, 8.10–8.12. Konu başına en az 3 ders sorusu hedefleyin.
6. **Sıfır sorulu konular:** 1.11 (Defining Continuity at a Point) ve 2.6 (Constant/Sum/Difference rules). 1.11 için "f(c) tanımlı mı? limit var mı? eşit mi?" üç-koşul sorusu ekleyin. `calc_u1_q10` CED'de 1.13'e ait olduğu halde 1.11 olarak etiketlenmiş; `calc_u2_q12` ise 2.7'ye ait olduğu halde 2.6 olarak.
7. **Çeldirici açıklamalarındaki 10 sayısal uyuşmazlığı düzeltin:** `calc_u1_q2` (A, B), `calc_u2_q3` (B/C), `calc_u2_q4` (D), `calc_u3_q1` (C), `calc_u3_q2` (A), `calc_u4_q1` (B), `calc_u6_q25` (D), `calc_u10_q3` (C), `calc_u10_q7` (B: seri toplamı ≈2.11, metinde 2.04), `calc_u10_q16` (A). Bu açıklamalarda anlatılan hata, şıktaki sayıyı üretmiyor. Öğrenci "bu hatayı yaptım" diye kendini doğrulayamaz. Düzeltilmiş metinler `oneri.hata_aciklamalari` alanında.
8. **BC etiketi tutarlılığı:** Kökte "[BC ONLY]", "BC ONLY" ve hiç etiket olmaması karışık kullanılıyor. `calc_u6_q32`, `calc_u7_q31`, `calc_u8_q26`, `calc_u8_q27`, `calc_u8_q28` ve `calc_u9_q25` kök etiketi taşımıyor. Kök metni yerine bir `ek.sinav: "BC"` alanı tanımlayıp rozeti arayüzde gösterin.
9. **`calc_u5_q3` görsel eksikliği:** Kök "The figure above" diyor ama ortada grafik yok. f′ grafiğini SVG olarak ekleyin; diğer grafik sorularındaki SVG kalıbı hazır.
10. **Zorluk kalibrasyonu ve yeni `ek` alanlarının kullanımı:** Mevcut dağılım easy/medium/hard = 60/133/102; önerilen dağılım 108/128/59. "hard" etiketi tek kural uygulanan sorularda da kullanılmış. Ayrıca `ek.hesapMakinesi` rozeti, `ek.ipucu` ("Sınav taktiği") ve `ek.sikHata` alanları çözüm ekranında gösterilirse soru başına ek içerik yazmadan değer katar.

## 6. `calculus.json` alanları

- `sorular[].durum`: `dogru` | `duzeltme-onerisi` (hatali-anahtar ve supheli: 0)
- `sorular[].bagimsizCevap`, `guven`: bağımsız çözümün sonucu ve güven düzeyi (0–1)
- `sorular[].oneri`: yalnız gereken alanlar (`govde`, `secenekler`, `hata_aciklamalari`, `aciklama`, `konu`)
- `sorular[].ek`: `kavram`, `ipucu`, `hesapMakinesi`, `sikHata`, `cedKonu`, varsa `zorlukOnerisi`
- `kapsam[]`: 111 CED konusu; her biri için `adet` (ders), `seviyeAdet`, `sinav` (AB+BC | BC) ve `uyari`
