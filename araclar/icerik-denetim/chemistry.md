# AP Chemistry: İçerik Denetimi

Kapsam: `server/tohum/soru-bankasi.json` içinde `sayfa === "ap-chemistry"` olan **227 soru** (200 ünite sorusu + 27 seviye `sv_` sorusu). Ayrıntılı, soru bazlı sonuçlar `chemistry.json` dosyasında.

## 1. Özet

| Durum | Sayı |
|---|---|
| Soru sayısı | 227 |
| Anahtarı doğru (bağımsız çözümle uyuşan) | **227 / 227** |
| `hatali-anahtar` | **0** |
| `supheli` | **0** |
| `duzeltme-onerisi` (anahtar doğru, metin veya çeldirici düzeltilmeli) | 9 |
| `dogru` | 218 |
| Zorluk önerisi verilen | 24 (çoğu "hard → medium") |

Yöntem: Her soru, anahtara bakmadan önce bağımsız olarak çözüldü. Hesaplı sorularda tüm çeldirici değerler de yeniden üretilerek hata teşhisleri (`hata_aciklamalari`) kontrol edildi. Örneğin titrasyon setinin (u8_q13–16) iç tutarlılığı doğrulandı: 0.120 M, pKa 4.74, başlangıç pH'si 2.83 ve eşdeğerlik pH'si 8.74 birbiriyle uyumlu.

Yapısal kontroller sorunsuz çıktı: `dogru` her soruda şıklar arasında, her yanlış şıkkın hata açıklaması var, `$` işaretleri dengeli ve HTML'i bozacak çıplak `<` yok. Anahtar harf dağılımı dengeli (A 58, B 56, C 56, D 57).

## 2. Hatalı ya da şüpheli anahtarlar

**Hatalı veya şüpheli anahtar yok.** Bütün sayısal sonuçlar ve kavramsal cevaplar anahtarla örtüşüyor.

## 3. Düzeltme önerileri (anahtar doğru)

| ID | Sorun | Öneri |
|---|---|---|
| chem_u2_q3 | Siyanat Lewis yapıları ":Ö", "N̈:" gibi belirsiz noktalarla yazılmış; ortaklanmamış çift sayıları okunamıyor. | Çift sayılarını açıkça yaz ya da SVG Lewis çizimi ekle. |
| chem_u8_q19 | Gövdede karşılaştırılan asitler listelenmemiş, buna rağmen D şıkkı "All three" diyor. | Gövdeye "HClO, HClO₂, HClO₃" ekle. |
| chem_u8_q9 | `genel_hatirlatma` içinde "(Erdem standardı)" yazıyor; iç not öğrenciye sızmış. | İfadeyi kaldır. |
| chem_u1_q3 | C hata açıklamasındaki "Anyonlar daima katyonlardan büyüktür" ifadesi yanlış bir genelleme (Cs⁺ > F⁻). | "İzoelektronik türlerde" diye sınırla. |
| chem_u1_q6 | D çeldiricisi (63.00 amu, Europium) ve "Yuvarlama Hatası" teşhisi anlamsız. | Gerçek bir hata yoluna dayanan çeldirici koy. |
| chem_u3_q4 (yalnızca not; durum: dogru) | D şıkkındaki "path length 0.50 cm" ifadesi kalibrasyon eğrisi bağlamında belirsiz. C açıkça doğru. | D'yi "örnek 0.50 cm, standartlar 1.00 cm küvette ölçüldü" diye netleştir. |
| sv_chem_u6_2 | chem_u6_q16 ile **birebir aynı** (H₂ + Cl₂ bağ entalpisi). | Başka bir tepkimeyle yeniden yaz (ör. NH₃ sentezi). |
| sv_chem_u9_1 | chem_u9_q1 ile aynı dört süreç ve aynı cevap. | Farklı süreçler kullan. |
| chem_u8_q11 | chem_u4_q3 ile aynı soru (asetik asit + NaOH net iyonik denklemi). | NH₃ + HCl veya HF + KOH denklemine çevir. |
| sv_chem_u1_2 | chem_u1_q2 ile aynı kavram ve aynı veriler (N/O IE anomalisi). | Be/B veya Mg/Al anomalisine çevir. |

Yakın tekrarlar (aynı beceri, farklı sayılar; kabul edilebilir ama çeşitlilik düşük): u1_q5 / u2_q10 / sv_u2_1 (MgO örgü enerjisi), u2_q15 / sv_u2_3, u3_q3 / u3_q12, u9_q6 / sv_u9_2, u7_q24 / sv_u7_3, u4_q23 / sv_u4_3, u7_q11 / sv_u7_2, u5_q18 / sv_u5_3, u4_q8 / sv_u4_2.

## 4. Konu etiketi numaralandırması

Bankadaki `konu` etiketleri **eski CED numaralandırmasını** kullanıyor. Güncel CED'de (2020 revizyonu) karşılıkları şöyle:

- "8.11 pH and Solubility" → **7.13**
- "9.6 Free Energy of Dissolution" → **7.14**
- "9.7 Coupled" → 9.6, "9.8 Cells" → 9.7, "9.9 E°/ΔG°" → 9.8, "9.10 Nernst" → 9.9, "9.11 Faraday" → 9.10

Bu kayma 21 soruyu etkiliyor. Ayrıca u1_q5 ve u2_q10 (örgü enerjisi → 2.3), u3_q6 (ağ ve moleküler katı → 3.2) ve u5_q15 (katalizör → 5.11) farklı konuya daha iyi oturuyor.

`ek.cedKonu` alanı güncel numarayla doldurulmuştur. Numaralandırma konusundaki güvenim orta-yüksek; yayına almadan önce CED PDF'iyle bir kez teyit edilmeli.

## 5. Kapsam (güncel CED, 9 ünite ve 91 konu)

| Ünite | Soru | Bankadaki pay | Sınav ağırlığı |
|---|---|---|---|
| 1 Atomic Structure | 17 | 7.5% | 7–9% |
| 2 Compound Structure | 19 | 8.4% | 7–9% |
| **3 Properties of Substances & Mixtures** | **18** | **7.9%** | **18–22%** |
| 4 Chemical Reactions | 27 | 11.9% | 7–9% |
| 5 Kinetics | 28 | 12.3% | 7–9% |
| 6 Thermochemistry | 28 | 12.3% | 7–9% |
| 7 Equilibrium | 29 | 12.8% | 7–9% |
| 8 Acids & Bases | 31 | 13.7% | 11–15% |
| 9 Thermodynamics & Electrochemistry | 30 | 13.2% | 7–9% |

**En büyük boşluk Unite 3.** Sınavın yaklaşık beşte birini oluşturuyor ama bankada payı %8. Payın sınav ağırlığına yaklaşması için yaklaşık 25–30 yeni soru gerekiyor.

**Hiç sorusu olmayan konular (0):**
- 2.5 Lewis Diagrams (yalnızca 2.6 içinde dolaylı geçiyor)
- 3.3 Solids, Liquids, and Gases
- 3.8 Representations of Solutions (particulate diyagramlar)
- 3.11 Spectroscopy and the EM Spectrum (geçiş ve bölge eşleme)
- 4.1 Introduction for Reactions (u4_q1 etiketinde geçiyor, içeriği 4.4)

**1–2 sorulu konular (toplam 50):** 1.1, 1.4, 1.5, 1.6, 1.8, 2.1, 2.2, 2.4, 3.2, 3.5, 3.6, 3.7, 3.9, 3.10, 3.12, 3.13, 4.3, 4.4, 4.7, 4.8, 5.1, 5.4–5.10, 6.1–6.3, 7.1, 7.2, 7.4–7.6, 7.8, 7.9, 7.13, 7.14, 8.1, 8.6–8.10, 9.2, 9.4, 9.6, 9.9. Tam liste `chemistry.json → kapsam.zayifKonular` içinde.

Biçim boşluğu: Hiçbir soruda görsel yok. PES spektrumu, titrasyon eğrisi, Maxwell–Boltzmann grafiği ve partikül diyagramları yalnızca metinle anlatılmış, oysa AP sınavında bunlar görsel olarak veriliyor.

## 6. Öncelikli 10 öneri

1. **Unite 3'ü güçlendir:** 3.3, 3.8 ve 3.11 için birer mini set, 3.2/3.5/3.6/3.7/3.10/3.12 için 2–3'er soru ekle (yaklaşık 25 soru).
2. **4 tam tekrarı değiştir** (sv_chem_u6_2, sv_chem_u9_1, chem_u8_q11, sv_chem_u1_2) ve yeni soruları boş konulara (2.5, 3.8, 3.11, 4.1) yönlendir.
3. **Görsel destekli sorular ekle:** PES grafiği, titrasyon eğrisi, ln[A]–t grafiği, partikül diyagramı (SVG). AP'de en çok puan kaybettiren biçim bunlar.
4. **Konu etiketlerini güncel CED numarasına taşı** (21 soru, özellikle Unite 9 ve 7.13/7.14). `ek.cedKonu` hazır.
5. **chem_u8_q19 gövdesini düzelt** (asit listesi eksik).
6. **chem_u8_q9'daki "Erdem standardı" ifadesini kaldır.**
7. **chem_u2_q3'teki Lewis yapılarını görselleştir** veya ortaklanmamış çiftleri açıkça yaz.
8. **Zorluk etiketlerini kalibre et:** 24 soru (çoğu standart bir adımlı hesap) "hard → medium" olmalı. Şu an "hard" etiketi 68 soruda (%30) ve şişkin görünüyor.
9. **Unite 4–7 ve 9 ağırlığını azaltma değil, Unite 3 ve 8'i artırma** yoluyla dengele. Bu ünitelerin her biri sınav ağırlığının 1.5 katı temsil ediliyor.
10. **Yakın tekrarları çeşitlendir:** MgO örgü enerjisi 3 kez, CaF₂ ortak iyon 2 kez, HI ICE 2 kez geçiyor. Birini farklı bağlama taşı (ör. melting point vs. lattice energy grafiği, Mg(OH)₂ ortak iyon).
