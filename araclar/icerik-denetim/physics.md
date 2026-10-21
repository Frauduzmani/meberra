# İçerik denetimi: AP Physics + CEnT-S

Tarih: 21 Ekim 2026 · Kaynak: `server/tohum/soru-bankasi.json` (salt okunur) · Ayrıntılı veri: `physics.json`

## Kapsam ve sayılar

| Sayfa | Soru | Ayrıntı |
|---|---|---|
| `ap-physics` | 185 | 161 ders bankası (Unit 1–7) + 24 deneme (`physics-1`, Unit 1–8) |
| `sinav-cents` | 60 | 20 metin ve veri üzerine muhakeme (10 okuma + 10 mantık/veri), 10 matematik, 10 biyoloji, 10 kimya, 10 fizik |
| **Toplam** | **245** | |

## Doğruluk sonucu

- Her soruyu anahtara bakmadan önce kendim çözdüm. **245/245 soruda bulduğum cevap anahtarla aynı.**
- **Yanlış anahtar: 0. Şüpheli anahtar: 0.**
- **Düzeltme önerisi: 19 soru.** Bunların 13'ü yalnız konu etiketi düzeltmesi. 6'sı soru metni ya da çeldirici açıklaması düzeltmesi.
- LaTeX ve HTML temiz: tüm `$` işaretleri eşleşiyor, süslü parantezler dengeli, yalnız `br/strong/em/table` etiketleri kullanılmış. Her soruda 4 şık var, yinelenen şık yok, `hata_aciklamalari` anahtarları yanlış şıklarla birebir eşleşiyor.
- Çeldirici açıklamalarını tek tek yeniden hesapladım. Neredeyse hepsi gerçekten tanımlanan hatadan çıkıyor (ör. ½'yi unutmak, çap/yarıçap karışıklığı). Uymayan 3 açıklama aşağıda.
- Doğru şık dağılımı dengeli: A 63, B 64, C 62, D 56.

### Metin veya açıklama düzeltmesi gereken 6 soru

| id | Sorun | Öneri |
|---|---|---|
| `phys_u1_q8` | Soru kökü "A, B'yi ne zaman geçer?" diye soruyor. Oysa A başından beri önde, yani hiç "geçme" yok. Doğru şık (B) bunu söylüyor ama kök öğrenciye yanlış bir öncül veriyor. | Kökü tarafsız yazın: "Which statement correctly describes the positions of the two cars for t > 0?" |
| `sv_phys1_u3_2` | "how high above the release point" ifadesi belirsiz. 2.0 m, en sıkışık konumdan ölçülen yükseklik. Top yaydan 0.10 m yukarıda ayrılır, oradan ölçülürse cevap 1.9 m olur. | `phys_wep_q8`'deki gibi yazın: "above its position at maximum compression". |
| `phys_mom_q9` | B (1.0 m/s) şıkkının açıklaması "ağırlıksız ortalama" diyor. Ağırlıksız ortalama 1.5 m/s olurdu. 1.0 m/s, hızların toplamının toplam kütleye bölünmesinden geliyor: (6 − 3)/3. | Açıklamayı düzeltin. |
| `phys_u6_q10` | D şıkkının açıklaması kendi içinde tutarsız: başlıkta "Pay", metinde "Payda" yazıyor. 3.0 rad/s, payda I_A yerine I_B kullanılınca çıkıyor. | Etiketi tek ve net bir ifadeye çevirin. |
| `phys_u3_q3` | B (34.3 m/s) aslında √(rg), yani tan θ hiç kullanılmamış. Açıklama ise "sin/cos kullanmak" diyor. C (11.8 m/s) şıkkının hangi hatadan geldiği belirsiz. | B'nin açıklamasını düzeltin. C'yi tanımlı bir hatadan türetin. |
| `phys_u2_q7` | Doğrusal sürüklenme Physics C konusu. Etiketteki "2.6", Physics 1 CED'de Gravitational Force (kütleçekim kuvveti) konusu. | Etiketi "Physics C · Drag" yapın. |

### Konu etiketi düzeltmeleri (2024-25 CED numaralandırması)

| id | Şu anki etiket | Önerilen |
|---|---|---|
| `phys_u1_q2`, `phys_u1_q4`, `phys_u1_q7` | 1.4 (eğik atış) | 1.5 Vectors and Motion in 2D |
| `phys_u1_q3` | 1.1 | 1.2 |
| `phys_u1_q5` | 1.6 (CED'de 1.6 diye bir konu yok) | 1.3 |
| `phys_u1_q9` | 1.1 (2B vektör) | 1.5 |
| `phys_u2_q2`, `phys_u2_q8` | 2.4 | 2.7 Friction |
| `phys_u2_q3` | 2.2 | 2.5 |
| `phys_u2_q5` | 2.1 & 2.2 | 2.5 |
| `phys_u3_q5` | 2.9 | 2.2 FBD |
| `phys_u3_q7`, `phys_u3_q8` | 2.9 / Unit 6, 2.9 / 3.3 | 6.6 Orbiting Satellites |

## AP Physics 1 kapsamı (CED 2024-25, 8 ünite)

| Ünite | Soru (ders + deneme) | Zayıf konular (≤2) |
|---|---|---|
| 1 Kinematics | 17 | **1.1: 0**, 1.4: 1 |
| 2 Force & Translational Dynamics | 30 | 2.1: 1, 2.2: 1, 2.8: 1, 2.3: 2, 2.4: 2 |
| 3 Work, Energy, Power | 23 | 3.1: 1 |
| 4 Linear Momentum | 25 | 4.1: 2 |
| 5 Torque & Rotational Dynamics | 28 | 5.1: 2 |
| 6 Energy & Momentum of Rotating Systems | 27 | yok |
| 7 Oscillations | 27 | yok |
| **8 Fluids** | **3** (yalnız deneme) | **8.1: 0**, 8.2: 1, 8.3: 1, 8.4: 1 |

Ders bankasında **Unit 8 Fluids için hiç soru yok.** Fluids, 2024-25'ten beri sınavın ağırlıklı bir ünitesi. Bankadaki tek 3 akışkan sorusu deneme setinde.

### Physics C durumu

Sayfanın meta açıklamasında "AP Physics 1 ve Physics C (Mechanics & E&M)" yazıyor. Bankadaki Physics C içeriği ise yalnız **5 kalkülüslü mekanik sorusu**: `phys_u1_q6`, `phys_u2_q7`, `phys_wep_q16`, `phys_wep_q21`, `phys_mom_q21`. **Physics C: E&M için 0 soru var.** Bu 5 soru doğru, ama Physics 1 ünitelerinin içine karışmış durumda; P1 öğrencisi için kapsam dışı.

## CEnT-S kapsamı

| CISIA bölümü | Soru | Eksik görünen konular |
|---|---|---|
| Reasoning on texts and data | 20 | Grafik/çizelge okuma (yalnız 2 tablo var), çok adımlı veri soruları |
| Mathematics | 10 | Trigonometri, doğru ve parabol (analitik geometri), diziler, denklem sistemleri, mutlak değer, üstel denklemler, polinomlar |
| Biology | 10 | Enzimler, evrim, bağışıklık, sinir sistemi |
| Chemistry | 10 | Adlandırma, termokimya, elektrokimya, çözünürlük |
| Physics | 10 | Momentum, termodinamik, dalgalar/optik, manyetizma |

Not: CEnT-S, CISIA'nın fen ve sağlık alanları için verdiği İngilizce testtir (bazı mühendislik ve biyoteknoloji programları da kabul eder). Matematik ve muhakeme en büyük bölümlerdir. Bölüm başına soru sayısını CISIA'nın güncel sayfasından teyit edin. Bankada yalnız 10 matematik sorusu olması, bu bölümün sınavdaki ağırlığına göre az.

## Zenginleştirme

`physics.json` içinde 245 sorunun hepsine `ek` alanı eklendi:

- `kavram`
- `ipucu`
- `hesapMakinesi` (gerekmez / yardımcı / gerekli)
- `sikHata`
- `cedKonu`: AP için CED konu kodu, CEnT-S için CISIA bölüm adı
- `zorlukOnerisi`: 23 soruda. Çoğu "hard" → "medium". Özellikle 7 deneme sorusu standart tek adımlı hesap olduğu hâlde "hard" etiketli.

Deneme sorularının mevcut `beceri/sureSn/hesapMakinesi` alanları korundu ve yeni alanlarla birleştirildi.

## En önemli 10 öneri

1. **Unit 8 Fluids ders bankası açın.** En az 12 soru (konu başına 3), özellikle 8.1 Density, kaldırma kuvveti ve Bernoulli.
2. **Physics C vaadini netleştirin.** Ya meta açıklamadan "Physics C (E&M)" ifadesini çıkarın, ya da ayrı bir Physics C: Mechanics + E&M bankası kurun (E&M için şu an 0 soru).
3. **5 Physics C sorusunu ayırın.** `ders: "physics-c"` gibi bir etiketle ayırın ve P1 deneme/kapsam sayımlarından çıkarın.
4. **13 konu etiketini 2024-25 CED numaralandırmasına çekin** (tablo yukarıda). Yanlış etiketler kapsam raporlarını bozuyor.
5. **Zayıf konuları doldurun:** 1.1 (0 soru), 1.4, 2.1, 2.2, 2.8, 3.1 (1'er soru), 2.3, 2.4, 4.1, 5.1 (2'şer soru).
6. **Soru metnini düzeltin:** `phys_u1_q8` (yanıltıcı öncül) ve `sv_phys1_u3_2` (ölçüm noktası belirsiz).
7. **3 çeldirici açıklamasını düzeltin:** `phys_mom_q9` B, `phys_u6_q10` D, `phys_u3_q3` B/C.
8. **Grafik içeren soruları görsele çevirin.** Bankadaki v–t, F–x ve F–t grafiklerinin hepsi sözle tarif edilmiş. AP sınavında öğrenci grafiği görerek okur; SVG grafik eklemek gerçekçiliği artırır.
9. **CEnT-S matematik bölümünü genişletin.** 10 sorudan en az 30 soruya çıkın: trigonometri, analitik geometri, diziler, sistemler. Fizik bölümüne momentum, termodinamik ve dalga sorusu ekleyin.
10. **Zorluk dağılımını yeniden ayarlayın.** AP bankasında 54 "hard" var; 23 soru için daha düşük zorluk önerildi. Gerçekten çok adımlı "hard" sorular ekleyin: QQT, deney tasarımı, iki ünite birleştiren sorular.
