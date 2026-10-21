# Yeni AP Calculus Soruları — Doğrulama Özeti

_Tarih: 2026-10-21 · Dosya: `araclar/yeni-sorular/calculus.json` · Durum: tüm sorular `"durum": "taslak"`, `ek.uretim: "1.11.0"`_

Kaynak: `araclar/icerik-denetim/calculus.md` içindeki kapsam açıkları (1.11 ve 2.6 hiç soru yok, tek sorulu konular, hesap makinesi sorularının azlığı). Tüm sorular özgündür; College Board yayımlanmış sorularından sayı ya da bağlam alınmadı. Kök ve şıklar İngilizce, açıklamalar Türkçe.

## 1. Sayılar

**Toplam: 63 soru** (hepsi `tur: "ders"`, `deneme_kodlari: ["calculus-ab","calculus-bc"]`; BC'ye özel soru yok).

| Ünite | Soru | Easy | Medium | Hard | Hesap makinesi (gerekli) |
|---|---|---|---|---|---|
| 1 Limits & Continuity | 10 | 4 | 5 | 1 | 1 |
| 2 Differentiation | 12 | 5 | 6 | 1 | 3 |
| 3 Composite/Implicit/Inverse | 8 | 1 | 5 | 2 | 2 |
| 4 Contextual Applications | 11 | 2 | 6 | 3 | 5 |
| 5 Analytical Applications | 14 | 3 | 7 | 4 | 5 |
| 6 Integration & Accumulation | 4 | 2 | 2 | 0 | 1 |
| 8 Applications of Integration | 4 | 0 | 3 | 1 | 2 |
| **Toplam** | **63** | **17 (%27)** | **34 (%54)** | **12 (%19)** | **19 (%30)** |

Hesap makinesi: gerekli 19, gerekmez 44. Hesap makinesi sorularının kökü `(Graphing calculator allowed.)` ile başlar, cevaplar AP'deki gibi 3 ondalıktır.

Doğru şık dağılımı: A 17, B 17, C 18, D 11.

AB çekirdeği (Unit 2–5): 45 soru (%71).

## 2. Konu (CED) dağılımı

| CED | Soru | ID'ler (`calc_y_…`) |
|---|---|---|
| 1.4 | 1 | u1_4 (HM) |
| 1.5 | 1 | u1_5 |
| 1.7 | 1 | u1_6 |
| 1.8 | 1 | u1_7 |
| 1.10 | 1 | u1_8 |
| **1.11** (önceden 0) | 3 | u1_1, u1_2, u1_3 |
| 1.12 | 1 | u1_9 |
| 1.14 | 1 | u1_10 |
| 2.1 | 2 | u2_4, u2_5 (HM) |
| 2.2 | 1 | u2_6 |
| 2.3 | 2 | u2_7, u2_8 (HM) |
| 2.4 | 1 | u2_11 |
| 2.5 | 2 | u2_9, u2_10 |
| **2.6** (önceden 0) | 3 | u2_1, u2_2, u2_3 |
| 2.10 | 1 | u2_12 (HM) |
| 3.1 | 2 | u3_1, u3_2 (HM) |
| 3.2 | 1 | u3_3 |
| 3.3 | 2 | u3_4, u3_8 (HM) |
| 3.4 | 1 | u3_5 |
| 3.5 | 1 | u3_6 |
| 3.6 | 1 | u3_7 |
| 4.1 | 3 | u4_1, u4_2, u4_11 (HM) |
| 4.2 | 1 | u4_7 (HM) |
| 4.3 | 2 | u4_3 (HM), u4_4 (HM) |
| 4.4 | 2 | u4_5, u4_6 |
| 4.5 | 1 | u4_8 |
| 4.6 | 1 | u4_9 (HM) |
| 4.7 | 1 | u4_10 |
| 5.1 | 2 | u5_1, u5_2 (HM) |
| 5.2 | 2 | u5_3, u5_4 |
| 5.3 | 2 | u5_5, u5_6 (HM) |
| 5.4 | 1 | u5_14 (HM) |
| 5.5 | 1 | u5_13 (HM) |
| 5.7 | 2 | u5_7, u5_8 |
| 5.9 | 1 | u5_9 |
| 5.10 | 1 | u5_10 |
| 5.11 | 1 | u5_11 (HM) |
| 5.12 | 1 | u5_12 |
| 6.1 | 2 | u6_1, u6_2 (HM) |
| 6.3 | 2 | u6_3, u6_4 |
| 8.10 | 1 | u8_1 |
| 8.11 | 1 | u8_2 (HM) |
| 8.12 | 2 | u8_3 (HM), u8_4 |

Denetimde 0–1 soru ile işaretlenen 32 konudan 28'i bu setle en az 2 soruya çıkar. Eklenmeyenler: 1.1, 1.2, 1.3, 1.9 (grafik/SVG gerektirdiği için bu turda yazılmadı).

## 3. Öz-denetim (self-check)

Yöntem: `ek`, `kutu`, `dizi`, `unite`, `kutu_baslik` alanları mevcut ünite sorularından alındı; `sira`/`numara` mevcut en büyük değerden devam eder. Ardından her soru, anahtara bakılmadan, ayrı bir betikle yeniden çözüldü:

- **Sayısal yeniden çözüm (46 soru):** limitler iki taraflı yaklaşımla, türevler merkezî farkla, kökler ikiye bölme yöntemiyle, integraller Simpson yöntemiyle (n = 20000) hesaplandı. Ekstremumlar ince ızgara taramasıyla bulundu. Sonuç şıklarla eşlendi; tam bir şıkla eşleşmesi ve ikinci en yakın şıkkın uzak olması şartı arandı.
- **Kavramsal/yorum soruları (17 soru):** gerekçe (koşul kontrolü, işaret tablosu, birim analizi) yeniden kuruldu ve beklenen ifade şık metinlerinde arandı; tam bir şıkla eşleşmesi şartı arandı.
- **Sonuç: 63/63 soruda bağımsız çözüm anahtarla örtüşüyor. Uyuşmazlık: 0.**

Yapısal kontroller (hepsi geçti):

| Kontrol | Sonuç |
|---|---|
| Her soruda tam 4 şık (A–D) ve tek `dogru` | ✓ 63/63 |
| Şık metinleri birbirinden farklı; sayısal şıklar sayısal olarak da farklı (ör. eşdeğer kesir yok) | ✓ |
| `hata_aciklamalari` tam olarak 3 yanlış şıkkı kapsıyor | ✓ |
| Çeldirici açıklaması o şıkkın değerini üretiyor (hesap makinesi çeldiricileri betikle, diğerleri elle yeniden hesaplandı; ör. derece modu, zincir kuralı ihmali, 1/f′(b) hatası) | ✓ |
| LaTeX: `$$` ve `$` sayıları çift, `{}` dengeli (kök, şıklar, açıklama, hatırlatma, hata açıklamaları) | ✓ |
| Mevcut 295 AP Calculus kökü ile normalize edilmiş birebir tekrar | 0 |
| Yeni sorular arasında tekrar | 0 |

Not: Mevcut havuzla aynı konudan olan ama farklı fonksiyon ve sayılarla yazılmış sorular var (ör. ters fonksiyon türevi, zincir kuralı tablosu). Denetimde tekrar olarak işaretlenen kalıplar (ör. (1 − cos x)/x², (e^{2x} − 1 − 2x)/x², x² + xy + y² = 7) kullanılmadı.

## 4. Yayına almadan önce

- `durum: "taslak"` → bir öğretmen incelemesinden sonra `aktif` yapılmalı.
- `calc_y_u5_11` CED 5.11 olarak etiketlendi; 5.10 için ayrıca yalnızca `calc_y_u5_10` var.
- Grafik gerektiren tek sorulu konular (1.1–1.3, 1.9) için SVG'li sorular ayrı bir turda yazılabilir.
