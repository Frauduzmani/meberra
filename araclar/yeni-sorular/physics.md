# Yeni sorular: AP Physics 1 + CEnT-S (taslak)

Tarih: 21 Ekim 2026 · Dosya: `araclar/yeni-sorular/physics.json` · Sürüm etiketi: `ek.uretim = "1.11.0"` · Tüm sorular `durum: "taslak"`

Toplam **55 özgün soru**: 40 AP Physics 1 (`ap-physics`) + 15 CEnT-S (`sinav-cents`). Soru kökleri ve şıklar İngilizce, açıklamalar Türkçe. Her yanlış şıkkın `hata_aciklamalari` kaydı var ve açıklama o şıkkın değerini adım adım yeniden üretiyor. Sorularda $g = 9.8\ \text{m/s}^2$ kullanıldı ve gereken her kökte bu değer yazıyor.

## Sayılar

### AP Physics 1 (40)

| Ünite / konu | Soru | id |
|---|---|---|
| **8.1 Internal Structure and Density** | 5 | `phys_y_u8_1`–`5` |
| **8.2 Pressure** | 5 | `phys_y_u8_6`–`10` |
| **8.3 Fluids and Newton's Laws (kaldırma kuvveti)** | 5 | `phys_y_u8_11`–`15` |
| **8.4 Fluids and Conservation Laws (süreklilik, Bernoulli)** | 5 | `phys_y_u8_16`–`20` |
| 1.1 Scalars and Vectors | 2 | `phys_y_u1_1`, `_2` |
| 1.4 Reference Frames | 2 | `phys_y_u1_3`, `_4` |
| 2.1 Systems and Center of Mass | 2 | `phys_y_u2_1`, `_2` |
| 2.2 Free-Body Diagrams | 2 | `phys_y_u2_3`, `_4` |
| 2.3 Newton's Third Law | 2 | `phys_y_u2_5`, `_6` |
| 2.4 Newton's First Law | 2 | `phys_y_u2_7`, `_8` |
| 2.8 Spring Forces | 2 | `phys_y_u2_9`, `_10` |
| 3.1 Translational Kinetic Energy | 2 | `phys_y_u3_1`, `_2` |
| 4.1 Linear Momentum | 2 | `phys_y_u4_1`, `_2` |
| 5.1 Rotational Kinematics | 2 | `phys_y_u5_1`, `_2` |

### CEnT-S (15)

| Bölüm / konu | Soru | id |
|---|---|---|
| Mathematics: trigonometri | 3 | `cents_y_1`–`3` |
| Mathematics: diziler (aritmetik, geometrik) | 2 | `cents_y_4`, `_5` |
| Mathematics: analitik geometri (doğru, parabol, çember–doğru) | 3 | `cents_y_6`–`8` |
| Physics: momentum | 2 | `cents_y_9`, `_10` |
| Physics: termodinamik (1. yasa, kalorimetri, Carnot) | 3 | `cents_y_11`–`13` |
| Physics: dalgalar | 2 | `cents_y_14`, `_15` |

Matematik soruları `cents-math-quiz-container` kutusunda `sira` 10–17, fizik soruları `cents-physics-quiz-container` kutusunda `sira` 10–16.

### Zorluk ve doğru şık dağılımı

| | easy | medium | hard |
|---|---|---|---|
| AP (40) | 13 | 19 | 8 |
| CEnT-S (15) | 5 | 7 | 3 |
| **Toplam (55)** | **18 (%33)** | **26 (%47)** | **11 (%20)** |

Doğru şık dağılımı: A 14, B 14, C 14, D 13.

## Öz denetim sonucu

- Her soruyu sıfırdan yeniden çözdüm. 40 sayısal soru ayrıca bir betikle bağımsız olarak yeniden hesaplandı. **55/55 soruda anahtar doğru, her soruda tek doğru şık var.**
- Her çeldiricinin değeri, açıklamasında anlatılan hatadan birebir çıkıyor (ör. çap oranının karesini almamak → 980 N, Celsius ile Carnot → 1.5×10³ J).
- Yapı denetimi: **0 hata.** Her soruda 4 farklı şık var. `hata_aciklamalari` anahtarları yanlış şıklarla birebir eşleşiyor. `$` işaretleri ve süslü parantezler dengeli, kontrol karakteri yok. id'ler bankayla çakışmıyor, soru kökleri mevcut sorularla aynı değil, `kutu`+`sira` çakışması yok.
- Sorular özgün bağlamlarla yazıldı. College Board'un yayımladığı sorulardan kopya yok.

## Notlar (lead için)

1. **Yeni Unit 8 kutusu açıldı:** `kutu: "phys-unit8-quiz-container"`, `kutu_baslik: "Unit 8 Fluids"`, `dizi: "PHYS_UNIT8_QUESTIONS"`, `unite: "8"`. **Sayfaya bu kutunun (quiz container) ve dizinin eklenmesi gerekiyor.** Eklenmezse 20 soru görünmez.
2. **`unite_no` = 9 (8 değil).** Bankada `unite_no` CED ünite numarası değil, kutunun sayfadaki sırası: `unite_no 8` zaten Unit 7 Oscillations'a ait (`phys-unit7-oscillations-quiz-container`). Çakışmayı önlemek için Unit 8 Fluids'e `unite_no: 9` verdim. CED ünitesi `unite: "8"` alanında. Sayfa farklı bir eşleme bekliyorsa yalnız bu alanı değiştirin.
3. Diğer AP soruları mevcut kutulara eklendi ve `sira` her kutudaki son sorudan devam ediyor: Unit 1 → 15–18, Unit 2 → 15–24, Unit 3 (WEP) → 22–23, Unit 4 → 23–24, Unit 5 → 25–26.
4. Deneme setindeki 3 Fluids sorusu `g = 10` kullanıyor. Yeni ders bankası soruları `g = 9.8` kullanıyor (ünitelerdeki ders sorularıyla tutarlı).
5. `ek.hesapMakinesi` değerleri "gerekmez / yardımcı / gerekli". Hesap makinesi gereken sorular: `phys_y_u8_4` ve `phys_y_u8_18`.
6. `deneme_kodlari` alanı mevcut ders sorularındaki gibi: AP için `["physics-1"]`, CEnT-S için `["cents"]`.
