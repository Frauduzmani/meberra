# İçerik denetimi — uygulama günlüğü (1.10.0)

_Üretici: `node araclar/icerik-uygula.js` (idempotent; `--kuru` ile önizleme). Tohum: `server/tohum/soru-bankasi.json`, tohum sürümü **2**. Bu dosya her uygulamada yeniden yazılır._

## Özet

| Ders | Soru | Denetim durumu | ek | Metin/şık düzeltmesi | Konu | Zorluk | Arşiv | Atlanan |
|---|---|---|---|---|---|---|---|---|
| AP Calculus | 295 | dogru 266, duzeltme-onerisi 29 | 295 | 22 | 2 | 0 | 1 | 6 |
| AP Physics + CEnT-S | 245 | dogru 226, duzeltme-onerisi 19 | 245 | 6 | 14 | 23 | 0 | 1 |
| AP Chemistry | 227 | dogru 218, duzeltme-onerisi 9 | 227 | 4 | 0 | 0 | 1 | 5 |
| AP Biology + English + Electives | 363 | dogru 343, duzeltme-onerisi 20 | 363 | 8 | 4 | 6 | 0 | 7 |

- Denetimlerde **hatalı anahtar: 0**. Hiçbir sorunun `dogru` alanı değiştirilmedi (araç bunu doğrular).
- `ek` zenginleştirmesi (kavram, ipucu, sikHata, cedKonu, hesap makinesi düzeyi): **1130 / 1131** soru (denetlenmeyen tek soru: vitrin demo sorusu).
- Mevcut `ek` anahtarları korundu. Seviye sorularında `ek.hesapMakinesi` (boolean, seviye testi arayüzü kullanır) değişmedi; denetimin üç düzeyli değeri (`gerekmez | yardımcı | gerekli`) `ek.hesapMakinesiDurum` alanına yazıldı. Ders sorularında `ek.hesapMakinesi` bu üç düzeyli metindir.
- Öğrenciye görünen iç not taraması (`Erdem`, `TODO`, `FIXME`, `internal`, `not:` vb. tüm metin alanlarında): yalnız `chem_u8_q9` içindeki "(Erdem standardı)" iç notu bulundu ve kaldırıldı; diğer eşleşmeler içerik (ör. "internal energy").

## AP Calculus (`calculus.json`)

### Uygulanan düzeltmeler

| Soru | Alanlar | Gerekçe |
|---|---|---|
| `calc_u1_q2` | hata.A.etiket, hata.B.etiket | A ve B çeldirici teşhisleri şıkları üretmiyordu (2a = 4 − a → 4/3; 2a − a → 1). Yeni teşhisler yeniden hesaplandı: 2a + 3 = 4 + a → a = 1; 2a + 3 = 4 + 3a → a = −1. |
| `calc_u1_q10` | konu | CED'de 1.11 = Defining Continuity at a Point; Removing Discontinuities 1.13. |
| `calc_u1_q19` | aciklama | Açıklamanın 4. adımı yalnız soldan limiti söylüyordu; doğru şık iki tek taraflı limiti de belirtiyor. |
| `calc_u1_q22` | govde | A da doğru bir sonuç söylüyor; kök 'en eksiksiz, tüm hipotezleri içeren' gerekçeyi istemeli (anahtar D değişmez). |
| `calc_u2_q2` | govde | LaTeX cases ortamında satır ayırıcı tek ters bölüydü; iki parça tek satırda görünüyordu. |
| `calc_u2_q3` | hata.B.etiket, hata.B.aciklama, hata.C.etiket, hata.C.aciklama | B (−11) ve C (11) teşhisleri yer değiştirmişti: (−4)(−1)'i −4 almak 11 verir (C); f'g − fg' yazmak 4 − 15 = −11 verir (B). |
| `calc_u2_q4` | hata.D.etiket, hata.D.aciklama | D (y = −x + 7) şıkkının eğimi −1; eski teşhis eğimi 2 hesaplıyordu. |
| `calc_u2_q12` | konu | e^x ve sin x türevleri CED 2.7; 2.6 sabit/toplam/fark kuralları. |
| `calc_u3_q1` | hata.C.etiket | C (−14) teşhisi hatanın nasıl üretildiğini göstermiyordu: g'(3)·g'(1) = 7·(−2). |
| `calc_u3_q2` | hata.A.etiket, hata.A.aciklama | Eski açıklama 'xy' unutulursa −2/3 çıkar' diyordu; gerçekte −1 çıkar. Yanlış iddia kaldırıldı, doğru kurulum eklendi. |
| `calc_u3_q8` | secenek.C, hata.C.etiket, hata.C.aciklama | B ve C matematiksel olarak aynı ifadeydi (iki özdeş çeldirici). C, tanımlı bir hatadan gelen yeni çeldiriciyle değişti; anahtar D aynı. |
| `calc_u4_q1` | hata.B.etiket | Eski teşhis (r = 4 sabit) −3/(8π) verir, B'deki −1/(6π)'yi değil. |
| `calc_u5_q3` | govde | Kök 'The figure above' diyordu ama grafik yok; ifade sözel betime çevrildi (SVG eklemek ayrı iş). |
| `calc_u6_q25` | hata.D.etiket | D teşhisi şıktaki −3e^{3x} terimini açıklamıyordu. |
| `calc_u7_q31` | govde | Ünite 7'deki diğer BC sorularıyla tutarlı BC etiketi. |
| `calc_u8_q26` | govde | Ünite 8–10'daki diğer BC sorularıyla tutarlı BC rozeti. |
| `calc_u8_q27` | govde | Ünite 8–10'daki diğer BC sorularıyla tutarlı BC rozeti. |
| `calc_u8_q28` | govde | Polar gösterim BC bilgisi; diğer BC sorularıyla tutarlı rozet. |
| `calc_u9_q25` | govde | Ünite 9'daki diğer sorularla tutarlı BC rozeti. |
| `calc_u10_q3` | hata.C.etiket, hata.C.aciklama | C (3) yalnız (1 + r) hatasından çıkmaz (o 2 verir = D); 3 ancak ilk terim 5 ve 1 + r birlikte alınınca çıkar. |
| `calc_u10_q7` | hata.B.aciklama | Serinin toplamı ≈ 2.11 (sayısal olarak yeniden hesaplandı: 2.1097); metinde 2.04 yazıyordu. |
| `calc_u10_q16` | hata.A.etiket | 2/5 sonucu iki faktöriyel oranı hatasının birlikte yapılmasından çıkar; eski teşhis L = 0 verirdi. |

### Konu etiketi (CED numarası)

| Soru | Önce | Sonra |
|---|---|---|
| `calc_u1_q10` | (önceden) | 1.13 Removing Discontinuities |
| `calc_u2_q12` | (önceden) | 2.7 Tangent Line Using Derivatives of e^x and sin x |

### Arşivlenen tekrarlar

- `calc_u6_q33` → arşiv (asıl: `calc_u6_q27`). calc_u6_q27 ile birebir aynı integral ve aynı şık kümesi (yalnız sıra farklı).

### Uygulanmayanlar

| Soru | Alan | Neden |
|---|---|---|
| `calc_u4_q14` | govde | calc_u1_q11 ile aynı limit (1 − cos x)/x², ama şıklar farklı ve ünite bağlamı (L'Hôpital) farklı: birebir kopya değil. Önerilen yeni kök ((x − sin x)/x³ = 1/6) yeni şıklar ve çözüm gerektiriyor. |
| `calc_u6_q32` | govde | Denetim iki seçenek veriyor ('[BC ONLY]' ekle ya da konuyu AB 6.10 yap); çözüm AB tekniği istediği için hangisinin doğru olduğu öğretmen kararı. |
| `sv_calcab_u3_2` | govde | calc_u3_q2 ile aynı soru. Seviye testinde her ünite tam 3 soru (alt sınır 3): arşivlenemez. Önerilen yeni kök (x² − xy + y² = 7, (−1, 2)) yeni şıklar gerektiriyor. |
| `sv_calcab_u4_3` | govde | calc_u4_q5 ile aynı limit. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni limit (e^{3x} − 1 − 3x)/x² = 9/2 yeni şıklar gerektiriyor. |
| `sv_calcbc_u3_2` | govde | calc_u3_q3 ile aynı soru. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni kök (x² + y² = 169, (5, 12)) yeni şıklar gerektiriyor. |
| `sv_calcbc_u6_3` | govde | calc_u6_q34 ile aynı integral. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni integral (∫₃⁴ 2/(x² − 4) dx) yeni şıklar gerektiriyor. |

## AP Physics + CEnT-S (`physics.json`)

### Uygulanan düzeltmeler

| Soru | Alanlar | Gerekçe |
|---|---|---|
| `phys_u1_q8` | govde | Kök 'A, B'yi ne zaman geçer?' diye yanlış bir öncül veriyordu (A başından beri önde). Şıklar zaten ifade biçiminde; anahtar B aynı. |
| `phys_u2_q7` | konu | Doğrusal sürüklenme Physics C konusu; P1 CED'de 2.6 Gravitational Force. |
| `phys_u3_q3` | hata.B.etiket | B (34.3 m/s) = √(rg): tan θ hiç kullanılmamış; eski teşhis 'sin/cos kullanmak' diyordu. (C teşhisi ayrıca insan incelemesinde.) |
| `phys_mom_q9` | hata.B.etiket | B (1.0 m/s) 'ağırlıksız ortalama' değil (o 1.5 verir); hızların toplamı toplam kütleye bölünmüş. |
| `phys_u6_q10` | hata.D.etiket | D etiketi başlıkta 'pay', metinde 'payda' diyordu. 3.0 rad/s, paydaki I_A yerine I_B kullanılınca çıkar (I_A = 0.3, I_B = 0.1, ω₀ = 12 ile doğrulandı). |
| `sv_phys1_u3_2` | govde | Yükseklik en sıkışık konumdan ölçülüyor (½kx² = mgh → 2.0 m); 'release point' belirsizdi. |

### Konu etiketi (CED numarası)

| Soru | Önce | Sonra |
|---|---|---|
| `phys_u1_q2` | (önceden) | 1.5 Independence of Horizontal and Vertical Projectile Motion |
| `phys_u1_q3` | (önceden) | 1.2 Speeding Up vs. Slowing Down Conditions |
| `phys_u1_q4` | (önceden) | 1.5 Projectile Quadratic Proportionality (Height & Range) |
| `phys_u1_q5` | (önceden) | 1.3 Experimental Design: Graph Linearization for Free-Fall |
| `phys_u1_q7` | (önceden) | 1.5 Acceleration Vector at the Apex of Trajectory |
| `phys_u1_q9` | (önceden) | 1.5 Vector Addition: Net Displacement vs. Distance |
| `phys_u2_q2` | (önceden) | 2.7 Static Friction on an Incline: Self-Adjusting Force vs. Maximum Threshold |
| `phys_u2_q3` | (önceden) | 2.5 Apparent Weight & Normal Force in an Accelerating Elevator |
| `phys_u2_q5` | (önceden) | 2.5 Contact Force Between Pushed Blocks |
| `phys_u2_q7` | (önceden) | Physics C · Drag Force & Terminal Velocity |
| `phys_u2_q8` | (önceden) | 2.7 Incline Dynamics: Sliding Up vs. Sliding Down with Friction |
| `phys_u3_q5` | (önceden) | 2.2 Free-Body Diagram Protocol: The Centripetal Force Trap |
| `phys_u3_q7` | (önceden) | 6.6 Kepler’s Second Law & Conservation of Angular Momentum |
| `phys_u3_q8` | (önceden) | 6.6 Escape Velocity & Gravitational Binding Energy |

### Zorluk (denetim gerekçe yazdığı için)

| Soru | Önce → sonra | Gerekçe |
|---|---|---|
| `phys_u1_q2` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_u1_q4` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_u1_q8` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_u2_q4` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_u3_q15` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_wep_q5` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_rot_q8` | (önceden) → easy | Zorluk "medium" yerine "easy" daha uygun. |
| `phys_rot_q13` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_u7_q6` | (önceden) → medium | Zorluk "hard" yerine "İvmeyi yer değiştirme yönünde almak." daha uygun. |
| `phys_u7_q11` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_u7_q12` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `phys_u7_q18` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `cents-reading-03` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `cents-reasoning-09` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `cents-biology-06` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `cents-chemistry-10` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `sv_phys1_u1_3` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `sv_phys1_u2_3` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `sv_phys1_u3_3` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `sv_phys1_u4_3` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `sv_phys1_u6_3` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `sv_phys1_u7_3` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |
| `sv_phys1_u8_3` | (önceden) → medium | Zorluk "hard" yerine "medium" daha uygun. |

### Uygulanmayanlar

| Soru | Alan | Neden |
|---|---|---|
| `phys_u7_q13` | zorluk | Denetimdeki zorluk önerisi bozuk (" maksimumsa "); geçerli bir düzey değil. |

## AP Chemistry (`chemistry.json`)

### Uygulanan düzeltmeler

| Soru | Alanlar | Gerekçe |
|---|---|---|
| `chem_u1_q3` | hata.C.aciklama | 'Anyonlar daima katyonlardan büyüktür' aşırı genelleme (Cs⁺ > F⁻); izoelektronik türlerle sınırlandı. |
| `chem_u3_q4` | secenek.D | D şıkkındaki yol uzunluğu ifadesi kalibrasyon bağlamında belirsizdi; netleştirildi (0.50 cm ile absorbans yarıya iner → derişim düşük çıkar, D yine yanlış; anahtar C). |
| `chem_u8_q9` | genel_hatirlatma | İç not '(Erdem standardı)' öğrenciye görünüyordu. |
| `chem_u8_q19` | govde | Gövde karşılaştırılan asitleri listelemiyordu (D 'All three' diyor). |

### Arşivlenen tekrarlar

- `chem_u8_q11` → arşiv (asıl: `chem_u4_q3`). chem_u4_q3 ile aynı soru (asetik asit + NaOH net iyonik denklemi; aynı anahtar, 4 şıktan 3'ü aynı). Denetim 'tekrarlar' listesinde.

### Uygulanmayanlar

| Soru | Alan | Neden |
|---|---|---|
| `chem_u1_q6` | secenekler, hata_aciklamalari | D çeldiricisi (63.00 amu; Europium) anlamsız; ama önerilen 63.93 amu B şıkkında zaten var. Yeni çeldirici ve teşhisi öğretmen yazmalı. |
| `chem_u2_q3` | govde | Lewis yapıları ortaklanmamış çift sayılarıyla yeniden yazılmalı ya da SVG çizim eklenmeli (içerik üretimi). |
| `sv_chem_u1_2` | degistir | chem_u1_q2 ile aynı kavram ve veri (N/O IE). Seviye ünitesi 3 soru: arşivlenemez. Be/B ya da Mg/Al anomalisiyle yeniden yazılmalı. |
| `sv_chem_u6_2` | degistir | chem_u6_q16 ile birebir aynı (H₂ + Cl₂ bağ entalpisi). Seviye ünitesi 3 soru: arşivlenemez. NH₃ sentezi gibi farklı tepkimeyle yeniden yazılmalı. |
| `sv_chem_u9_1` | degistir | chem_u9_q1 ile aynı dört süreç. Seviye ünitesi 3 soru: arşivlenemez. Farklı süreçlerle yeniden yazılmalı. |

## AP Biology + English + Electives (`biology-english-electives.json`)

### Uygulanan düzeltmeler

| Soru | Alanlar | Gerekçe |
|---|---|---|
| `bio_u2_q8` | aciklama | 'Tartışmasız kanıtlar' bilimsel olarak aşırı iddialı. |
| `bio_u7_q15` | konu | Ki-kare (tuzluluk tercihi) içeriği 7.3 Artificial Selection değil; CED 7.12. |
| `bio_u7_q26` | konu | CED'de 7.11 Extinction; bu içerik 7.12 Variations in Populations. |
| `bio_u7_q27` | konu | RNA dünyası CED 7.13 Origins of Life on Earth. |
| `csa_q1` | konu | 2025-26 CSA CED'de ifadeler ve çıktı 1.3 (1.5 = Casting). |
| `csa_d4` | hata.D.etiket | Eski D teşhisi (i++ okumak) B'deki istisnayı üretir, '3 5 7 4'ü değil (kod adım adım izlendi). |
| `csa_d6` | hata.D.etiket, hata.D.aciklama | D (12) = satır × sütun sayısı; '1 tabanlı indeks' 16 verir. |
| `eng_write_q19` | secenek.D, hata.C.etiket, aciklama | Doğru şık D 'save the school money' yerine 'save money' diyerek anlamı değiştiriyordu; C teşhisi 'yanlış nedensellik' olarak netleştirildi. Anahtar D aynı. |

### Konu etiketi (CED numarası)

| Soru | Önce | Sonra |
|---|---|---|
| `bio_u7_q15` | (önceden) | 7.12 Chi-Square Test with Four Categories |
| `bio_u7_q26` | (önceden) | 7.12 Genetic Diversity and Population Resilience |
| `bio_u7_q27` | (önceden) | 7.13 Origins of Life: RNA World Hypothesis and Timeline |
| `csa_q1` | (önceden) | 1.3 Expressions and Output: Integer Division, Remainder (%) and Operator Precedence |

### Zorluk (denetim gerekçe yazdığı için)

| Soru | Önce → sonra | Gerekçe |
|---|---|---|
| `bio_u1_q2` | (önceden) → medium | Seçenek A'daki 'hydrophobic interactions strengthen as temperature increases' ifadesi termodinamik olarak kısmen doğrudur (hidrofobik etki belli aralıkta sıcaklıkla güçlenir); seçenek yine de yanlış çünkü üçüncül yapı bozulur. Zorluk 'hard' yerine 'medium' daha uygun. |
| `bio_u5_q15` | (önceden) → medium | Tek adımlı RF hesabı; 'hard' yerine 'medium' önerilir. |
| `sv_bio_u1_3` | (önceden) → easy | bio_u6_q1 ile aynı sayılar (%18 A) — seviye testinde ders sorusunun tekrarı; zorluk 'hard' değil, kolay bir Chargaff hesabı. |
| `sv_bio_u5_3` | (önceden) → medium | Tek adımlı RF hesabı; 'hard' yerine 'medium'. |
| `sv_bio_u6_3` | (önceden) → medium | Kodon tablosu verilmiş tek adımlı nonsense tespiti; 'medium' yeterli. |
| `sv_bio_u8_3` | (önceden) → medium | Formül verilmiş tek adımlı yerine koyma; 'medium' yeterli. |

### Uygulanmayanlar

| Soru | Alan | Neden |
|---|---|---|
| `bio_u1_q7` | konu | bio_u2_q3 ile neredeyse aynı (soğukta doymamış yağ asidi) ve içerik CED 2.4. Ünite 1 için yeni makromolekül sorusu yazılmalı. |
| `sv_bio_u1_3` | zorluk, govde | bio_u6_q1 ile aynı sayılar (%18 A). Seviye ünitesi 3 soru: arşivlenemez. Farklı yüzdeyle (ör. %28 A) yeniden yazılmalı; şıklar değişir. |
| `sv_bio_u4_2` | govde | bio_u4_q21 ile aynı veri (200 hücre, 20 mitoz, 24 saat). Farklı sayılarla yeniden yazılmalı; şıklar değişir. |
| `eng_read_q12` | pasajBasligi | Cevabı ele veren pasaj başlığı soru bankasında değil (ap-english.html / deneme-meta.json pasajları); bu adımın kapsamı dışında. Başlık 'From an address on communication in engineering' olarak nötrleştirilmeli. |
| `eng_read_q16` | secenekSirasi | Şıkları sayısal sıraya dizmek anahtarı C → D değiştirir; denetimde hatalı anahtar yok, anahtar değiştirilmez. |
| `eng_write_q15` | govde | Kökü retorik amaçla yeniden çerçevelemek yeni yazım gerektirir (SAT tarzı dilbilgisi sorusu). |
| `eng_write_q18` | not | Paralellik sorusunu retorik etkiyle ilişkilendirmek yeni yazım gerektirir. |

## Arşivlenen birebir tekrarlar

Satırlar silinmedi (`durum = "arsiv"`): eski cevaplar, Yanlışlarım, deneme incelemeleri ve geçmiş kayıtlar bu kimliklerle çözülmeye devam eder. Ders listeleri, ünite görünümü, deneme havuzu ve seviye testi arşivli soruları göstermez; yeni cevap kabul edilmez.

- `calc_u6_q33` (AP Calculus) — asıl: `calc_u6_q27`
- `chem_u8_q11` (AP Chemistry) — asıl: `chem_u4_q3`

Seviye testindeki tekrarlar arşivlenmedi: her seviye ünitesi tam 3 soru ve pm-denetim alt sınırı 3; arşivlemek üniteyi 2 soruya düşürürdü. Bunlar aşağıda insan incelemesinde (yeni soru yazılmalı).

## Kimya konu etiketleri (yalnız ek.cedKonu)

Denetimin güncel CED numarası güveni "orta-yüksek" olduğundan `konu` alanı değiştirilmedi; güncel numara `ek.cedKonu` alanında. CED PDF'iyle teyit edildikten sonra konu etiketleri panelden ya da bu araca karar eklenerek güncellenebilir (21 soru):

| Soru | Mevcut konu | ek.cedKonu |
|---|---|---|
| `chem_u1_q5` | 1.8 Coulomb's Law and Ionic Lattice Energy | 2.3 Structure of Ionic Solids |
| `chem_u2_q10` | 2.2 Coulomb's Law and Lattice Energy Ranking | 2.3 Structure of Ionic Solids |
| `chem_u3_q6` | 3.3 Types of Solids & Extreme Melting Point Disparity (SiO₂ vs. CO₂) | 3.2 Properties of Solids |
| `chem_u5_q15` | 5.5 Maxwell–Boltzmann Distribution and a Catalyst | 5.11 Catalysis |
| `chem_u7_q25` | 8.11 Preview: Effect of pH on Solubility (Qualitative) | 7.13 pH and Solubility |
| `chem_u9_q13` | 9.6 Free Energy of Dissolution: An Endothermic Salt | 7.14 Free Energy of Dissolution |
| `chem_u9_q14` | 9.7 Coupled Reactions: ATP Hydrolysis Drives Glutamine Synthesis | 9.6 Coupled Reactions |
| `chem_u9_q15` | 9.7 External Energy Sources for Unfavorable Processes | 9.6 Coupled Reactions |
| `chem_u9_q16` | 9.8 Galvanic Cell Components: Electron Flow and Salt Bridge | 9.7 Galvanic (Voltaic) and Electrolytic Cells |
| `chem_u9_q17` | 9.8 Electrolytic Cell: Electrolysis of Molten NaCl | 9.7 Galvanic (Voltaic) and Electrolytic Cells |
| `chem_u9_q18` | 9.8 Modifying the Procedure: Removing the Salt Bridge | 9.7 Galvanic (Voltaic) and Electrolytic Cells |
| `chem_u9_q19` | 9.9 Standard Cell Potential from Reduction Potentials | 9.8 Cell Potential and Free Energy |
| `chem_u9_q20` | 9.9 ΔG° from the Cell Potential (ΔG° = −nFE°) | 9.8 Cell Potential and Free Energy |
| `chem_u9_q21` | 9.9 Predicting Which Redox Reaction Is Thermodynamically Favored | 9.8 Cell Potential and Free Energy |
| `chem_u9_q22` | 9.9 Equilibrium Constant from the Standard Cell Potential | 9.8 Cell Potential and Free Energy |
| `chem_u9_q23` | 9.10 Effect of Concentration on Cell Potential (Qualitative Nernst) | 9.9 Cell Potential Under Nonstandard Conditions |
| `chem_u9_q24` | 9.10 Concentration Cells and E = 0 at Equilibrium | 9.9 Cell Potential Under Nonstandard Conditions |
| `chem_u9_q25` | 9.11 Faraday's Law: Mass of Copper Electroplated | 9.10 Electrolysis and Faraday's Law |
| `chem_u9_q26` | 9.11 Faraday's Law: Time Required to Plate Silver | 9.10 Electrolysis and Faraday's Law |
| `chem_u9_q27` | 9.11 Determining the Charge of a Metal Ion by Electrolysis | 9.10 Electrolysis and Faraday's Law |
| `chem_u9_q28` | 9.11 Electrolytic Cells in Series Carry the Same Charge | 9.10 Electrolysis and Faraday's Law |

## Uygulanmayan zorluk önerileri (gerekçe yok)

Denetim bu 121 soru için zorluk önerdi ama soru bazında gerekçe yazmadı; uygulanmadı. Öneri `ek.zorlukOnerisi` alanında saklanır (öğrenciye gönderilmez).

- **AP Calculus (93):** `calc_u1_q2` hard→medium, `calc_u1_q3` medium→easy, `calc_u1_q4` hard→medium, `calc_u1_q5` medium→easy, `calc_u1_q7` medium→easy, `calc_u1_q10` medium→easy, `calc_u1_q11` hard→medium, `calc_u1_q13` hard→medium, `calc_u1_q18` medium→easy, `calc_u1_q19` medium→easy, `calc_u1_q21` medium→easy, `calc_u2_q3` medium→easy, `calc_u2_q4` hard→medium, `calc_u2_q5` medium→easy, `calc_u2_q7` hard→medium, `calc_u2_q8` hard→medium, `calc_u2_q12` medium→easy, `calc_u2_q13` medium→easy, `calc_u2_q15` medium→easy, `calc_u3_q2` hard→medium, `calc_u3_q5` medium→easy, `calc_u3_q7` hard→medium, `calc_u3_q11` hard→medium, `calc_u3_q12` medium→easy, `calc_u4_q3` medium→easy, `calc_u4_q4` hard→medium, `calc_u4_q5` hard→medium, `calc_u4_q8` hard→medium, `calc_u4_q9` medium→easy, `calc_u4_q14` medium→easy, `calc_u4_q15` medium→easy, `calc_u5_q2` hard→medium, `calc_u5_q4` medium→easy, `calc_u5_q7` hard→medium, `calc_u5_q9` medium→easy, `calc_u5_q11` hard→medium, `calc_u5_q12` hard→medium, `calc_u5_q15` hard→medium, `calc_u6_q7` medium→easy, `calc_u6_q8` hard→medium, `calc_u6_q14` medium→easy, `calc_u6_q15` hard→medium, `calc_u6_q20` medium→easy, `calc_u6_q21` medium→easy, `calc_u6_q25` medium→easy, `calc_u6_q27` hard→medium, `calc_u6_q29` hard→medium, `calc_u7_q5` medium→easy, `calc_u7_q9` hard→medium, `calc_u7_q10` medium→easy, `calc_u7_q16` medium→easy, `calc_u7_q18` hard→medium, `calc_u7_q24` medium→easy, `calc_u7_q25` hard→medium, `calc_u7_q26` medium→easy, `calc_u7_q27` hard→medium, `calc_u7_q28` medium→easy, `calc_u7_q29` medium→easy, `calc_u7_q30` hard→medium, `calc_u8_q2` medium→easy, `calc_u8_q3` medium→easy, `calc_u8_q7` medium→easy, `calc_u8_q9` hard→medium, `calc_u8_q12` hard→medium, `calc_u8_q14` hard→medium, `calc_u10_q10` medium→easy, `calc_u10_q12` hard→medium, `calc_u10_q15` medium→easy, `calc_u10_q19` medium→easy, `calc_u10_q23` medium→easy, `calc_u10_q26` medium→easy, `calc_u10_q32` medium→easy, `calc_u10_q33` medium→easy, `calc_u10_q34` hard→medium, `calc_u10_q35` hard→medium, `calc_u10_q36` medium→easy, `calc_u10_q39` hard→medium, `sv_calcab_u1_3` hard→medium, `sv_calcab_u2_2` medium→easy, `sv_calcab_u2_3` hard→medium, `sv_calcab_u3_3` hard→medium, `sv_calcab_u4_2` medium→easy, `sv_calcab_u4_3` hard→medium, `sv_calcab_u7_3` hard→medium, `sv_calcab_u8_2` medium→easy, `sv_calcbc_u1_2` medium→easy, `sv_calcbc_u1_3` hard→medium, `sv_calcbc_u2_3` hard→medium, `sv_calcbc_u4_1` easy→medium, `sv_calcbc_u4_2` medium→easy, `sv_calcbc_u6_2` medium→easy, `sv_calcbc_u6_3` hard→medium, `sv_calcbc_u7_3` hard→medium
- **AP Chemistry (24):** `chem_u1_q2` hard→medium, `chem_u1_q5` hard→medium, `chem_u2_q1` hard→medium, `chem_u3_q2` hard→medium, `chem_u3_q6` hard→medium, `chem_u3_q12` medium→easy, `chem_u4_q15` hard→medium, `chem_u5_q10` hard→medium, `chem_u5_q12` hard→medium, `chem_u6_q4` hard→medium, `chem_u6_q10` hard→medium, `chem_u6_q13` hard→medium, `chem_u6_q23` hard→medium, `chem_u6_q25` hard→medium, `chem_u9_q6` hard→medium, `chem_u9_q21` hard→medium, `chem_u9_q28` hard→medium, `sv_chem_u1_3` hard→medium, `sv_chem_u2_3` hard→medium, `sv_chem_u3_3` hard→medium, `sv_chem_u4_3` hard→medium, `sv_chem_u5_3` hard→medium, `sv_chem_u7_3` hard→medium, `sv_chem_u9_3` hard→medium
- **AP Biology + English + Electives (4):** `eng_read_q9` hard→medium, `eng_write_q24` hard→medium, `sv_eng_w2_3` hard→medium, `sv_eng_w4_3` hard→medium

## Seviye testi hesap makinesi uyuşmazlıkları

Seviye sorusunun mevcut `hesapMakinesi` bayrağı denetimin düzeyiyle uyuşmuyor (bayrak değiştirilmedi):

- `sv_phys1_u3_1`: bayrak false, denetim "yardımcı"
- `sv_phys1_u6_2`: bayrak false, denetim "yardımcı"
- `sv_phys1_u8_3`: bayrak false, denetim "yardımcı"
- `sv_chem_u6_2`: bayrak false, denetim "yardımcı"
- `sv_bio_u8_1`: bayrak false, denetim "yardımcı"
- `sv_bio_u8_2`: bayrak false, denetim "yardımcı"

## İnsan (sahip / öğretmen) incelemesi gerekenler

- `calc_u4_q14`: calc_u1_q11 ile aynı limit (1 − cos x)/x², ama şıklar farklı ve ünite bağlamı (L'Hôpital) farklı: birebir kopya değil. Önerilen yeni kök ((x − sin x)/x³ = 1/6) yeni şıklar ve çözüm gerektiriyor.
- `calc_u6_q32`: Denetim iki seçenek veriyor ('[BC ONLY]' ekle ya da konuyu AB 6.10 yap); çözüm AB tekniği istediği için hangisinin doğru olduğu öğretmen kararı.
- `sv_calcab_u3_2`: calc_u3_q2 ile aynı soru. Seviye testinde her ünite tam 3 soru (alt sınır 3): arşivlenemez. Önerilen yeni kök (x² − xy + y² = 7, (−1, 2)) yeni şıklar gerektiriyor.
- `sv_calcab_u4_3`: calc_u4_q5 ile aynı limit. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni limit (e^{3x} − 1 − 3x)/x² = 9/2 yeni şıklar gerektiriyor.
- `sv_calcbc_u3_2`: calc_u3_q3 ile aynı soru. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni kök (x² + y² = 169, (5, 12)) yeni şıklar gerektiriyor.
- `sv_calcbc_u6_3`: calc_u6_q34 ile aynı integral. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni integral (∫₃⁴ 2/(x² − 4) dx) yeni şıklar gerektiriyor.
- `phys_u2_q7`: phys_u2_q7 (ve phys_u1_q6, phys_wep_q16, phys_wep_q21, phys_mom_q21) Physics C soruları Physics 1 deneme/kapsamından ayrılmalı mı? Ürün kararı.
- `phys_u3_q3`: phys_u3_q3 C (11.8 m/s) çeldiricisinin hangi hatadan geldiği belirsiz (√(rg)·sin20° ≈ 11.7); tanımlı bir hataya göre yeniden yazılmalı.
- `chem_u1_q6`: D çeldiricisi (63.00 amu; Europium) anlamsız; ama önerilen 63.93 amu B şıkkında zaten var. Yeni çeldirici ve teşhisi öğretmen yazmalı.
- `chem_u2_q3`: Lewis yapıları ortaklanmamış çift sayılarıyla yeniden yazılmalı ya da SVG çizim eklenmeli (içerik üretimi).
- `sv_chem_u1_2`: chem_u1_q2 ile aynı kavram ve veri (N/O IE). Seviye ünitesi 3 soru: arşivlenemez. Be/B ya da Mg/Al anomalisiyle yeniden yazılmalı.
- `sv_chem_u6_2`: chem_u6_q16 ile birebir aynı (H₂ + Cl₂ bağ entalpisi). Seviye ünitesi 3 soru: arşivlenemez. NH₃ sentezi gibi farklı tepkimeyle yeniden yazılmalı.
- `sv_chem_u9_1`: chem_u9_q1 ile aynı dört süreç. Seviye ünitesi 3 soru: arşivlenemez. Farklı süreçlerle yeniden yazılmalı.
- `bio_u1_q7`: bio_u2_q3 ile neredeyse aynı (soğukta doymamış yağ asidi) ve içerik CED 2.4. Ünite 1 için yeni makromolekül sorusu yazılmalı.
- `sv_bio_u1_3`: bio_u6_q1 ile aynı sayılar (%18 A). Seviye ünitesi 3 soru: arşivlenemez. Farklı yüzdeyle (ör. %28 A) yeniden yazılmalı; şıklar değişir.
- `sv_bio_u4_2`: bio_u4_q21 ile aynı veri (200 hücre, 20 mitoz, 24 saat). Farklı sayılarla yeniden yazılmalı; şıklar değişir.
- `eng_read_q12`: Cevabı ele veren pasaj başlığı soru bankasında değil (ap-english.html / deneme-meta.json pasajları); bu adımın kapsamı dışında. Başlık 'From an address on communication in engineering' olarak nötrleştirilmeli.
- `eng_read_q16`: Şıkları sayısal sıraya dizmek anahtarı C → D değiştirir; denetimde hatalı anahtar yok, anahtar değiştirilmez.
- `eng_write_q15`: Kökü retorik amaçla yeniden çerçevelemek yeni yazım gerektirir (SAT tarzı dilbilgisi sorusu).
- `eng_write_q18`: Paralellik sorusunu retorik etkiyle ilişkilendirmek yeni yazım gerektirir.
- Kapsam boşlukları (yeni soru yazımı): Biology Unit 8 ders seti yok; Physics 1 Unit 8 Fluids ders seti yok; Chemistry Unit 3 sınav ağırlığına göre az; Macro Unit 3 4 soru; Calculus 1.11 ve 2.6 konularında soru yok. Ayrıntı: denetim .md dosyaları.
- `calc_u5_q3` için f′ grafiği SVG olarak eklenebilir (kök şimdilik sözel betime çevrildi).
- `calc_u7_q1`: B (`k(t - 20)`) ve C (`k(T - 20)`) şıkları yalnız t/T harfiyle ayrılıyor (bilinçli çeldirici). Yönetici formu şıkları büyük/küçük harf duyarsız karşılaştırdığı için bu soru panelde "Aynı metinli iki şık" hatasıyla kaydedilemez; panelden düzenlenecekse önce bu kural gözden geçirilmeli.

## Veritabanına yansıma

Sunucu açılışta tohumun `surum` değerini `ayarlar.soru_tohum_surum` ile karşılaştırır. Tohum daha yeniyse yönetici panelinde düzenlenmemiş soruları günceller (yeni sürüm + `questions_bank_history` kaydı, `guncelleyen = 'tohum'`); yönetici düzenlemesi olan sorulara dokunmaz ve bunları `system_logs` içine **bilgi** olarak yazar. Ayrıntı: `server/API.md` › Soru bankası tohum güncellemesi.
