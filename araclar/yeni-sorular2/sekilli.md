# Şekilli yeni sorular (1.13.0) — özet

_Tarih: 2026-10-21 · Dosya: `araclar/yeni-sorular2/sekilli.json` (dizi, 50 soru) · Hepsi `durum: "taslak"`, `ek.uretim: "1.13.0"`._

Tüm sorular özgündür (College Board yayımlanmış sorularından sayı ya da bağlam alınmadı). Kök ve şıklar İngilizce, açıklamalar Türkçe.
Şema `server/tohum/soru-bankasi.json` ile aynı alan sırasındadır; yalnız `govde` alanından sonra yeni `sekil` alanı ve gerektiğinde `secenekler[i].sekil` vardır
(şık şekillerinde `konum` yok). `kutu_baslik`, `unite_no`, `dizi` mevcut kutulardan alındı; `sira`/`numara` kutudaki son sorunun ardından verildi.

**Birleştirme notu:** `araclar/yeni-soru-ekle.js` şu an yalnız `yeni-sorular/` klasörünü okur ve `sekil` alanını "bilinmeyen alan" sayar; bu dosya eklenmeden önce
ALANLAR listesine `sekil` eklenmeli ve şekiller `server/sekil.js` → `sekilDogrula` ile doğrulanmalı (bu dosyada zaten 0 hata).

## 1. Sayılar

| Ders | Soru | Easy | Medium | Hard |
|---|---|---|---|---|
| AP Calculus | 20 | 5 | 11 | 4 |
| AP Chemistry | 10 | 4 | 4 | 2 |
| AP Micro/Macro (ap-electives, econ-quiz-container) | 12 | 3 | 6 | 3 |
| AP Physics 1 | 8 | 2 | 5 | 1 |
| **Toplam** | **50** | **14** | **26** | **10** |

- Doğru şık dağılımı: A 12 · B 13 · C 15 · D 10.
- Toplam SVG: 72 — kökte şekli olan 48 soru, şıkları şekil olan 6 soru.
- Şıkları şekil olan sorular: `calc_sk_u5_1` (hangi grafik f′ olabilir), `chem_sk_u1_3` (parçacık diyagramı), `phys_sk_u1_2` (a–t grafiği), `phys_sk_u2_1`, `phys_sk_u2_2` (serbest cisim diyagramı), `phys_sk_u3_2` (enerji çubuk grafiği).
- Calculus kapsamı: 1.3 / 1.9 / 1.10 / 1.11 (grafikten limit, tek yönlü limit, süreksizlik türleri, süreklilik), 2.1 / 2.8 (f grafiğinden f′), 5.3 / 5.4 / 5.5 / 5.6 / 5.9 (f′ grafiğinden artanlık, ekstremum, konkavlık, f′ seçimi), 6.2 (Riemann), 6.4 (birikim fonksiyonu, 3 soru), 7.3 (eğim alanı, 2 soru), 4.2 ve 8.2 (v(t) grafiğinden parçacık hareketi).

## 2. Soru listesi

| Ders | Kimlik | Kutu · ünite | Konu | Zorluk | Doğru | Şekil |
|---|---|---|---|---|---|---|
| calc | `calc_sk_u1_1` | calc-unit1-quiz-container · 1 | 1.3 Estimating Limit Values from Graphs: One-Sided Limits | easy | B | kök |
| calc | `calc_sk_u1_2` | calc-unit1-quiz-container · 1 | 1.10 Exploring Types of Discontinuities: Limit Exists but f Is Not Continuous | medium | A | kök |
| calc | `calc_sk_u1_3` | calc-unit1-quiz-container · 1 | 1.10 Exploring Types of Discontinuities: Classifying from a Graph | medium | A | kök |
| calc | `calc_sk_u1_4` | calc-unit1-quiz-container · 1 | 1.9 Connecting Multiple Representations of Limits: Limit of a Sum from Two Graphs | hard | A | kök |
| calc | `calc_sk_u1_5` | calc-unit1-quiz-container · 1 | 1.11 Defining Continuity at a Point: Reading Continuity from a Graph | medium | B | kök |
| calc | `calc_sk_u2_1` | calc-unit2-quiz-container · 2 | 2.1 Defining Average and Instantaneous Rates of Change: Slope from a Graph | easy | A | kök |
| calc | `calc_sk_u2_2` | calc-unit2-quiz-container · 2 | 2.8 The Product Rule with Values Read from a Graph | medium | C | kök |
| calc | `calc_sk_u4_1` | calc-unit4-quiz-container · 4 | 4.2 Straight-Line Motion: When Is Speed Increasing? (Velocity Graph) | medium | A | kök |
| calc | `calc_sk_u8_1` | calc-unit8-quiz-container · 8 | 8.2 Connecting Position, Velocity, and Acceleration Using Integrals: Maximum Position | hard | C | kök |
| calc | `calc_sk_u5_1` | calc-unit5-quiz-container · 5 | 5.9 Connecting a Function and Its Derivative: Which Graph Could Be f′? | medium | D | kök + 4 şık |
| calc | `calc_sk_u5_2` | calc-unit5-quiz-container · 5 | 5.6 Determining Concavity: Increasing and Concave Down from the Graph of f′ | medium | D | kök |
| calc | `calc_sk_u5_3` | calc-unit5-quiz-container · 5 | 5.4 The First Derivative Test: Relative Extrema from the Graph of f′ | medium | A | kök |
| calc | `calc_sk_u5_4` | calc-unit5-quiz-container · 5 | 5.5 Using the Candidates Test to Determine Absolute Extrema from the Graph of f′ | hard | B | kök |
| calc | `calc_sk_u5_5` | calc-unit5-quiz-container · 5 | 5.3 Determining Intervals on Which a Function Is Increasing or Decreasing from f′ | easy | C | kök |
| calc | `calc_sk_u6_1` | calc-unit6-quiz-container · 6 | 6.2 Approximating Areas with Riemann Sums: Right Sum from a Graph | medium | D | kök |
| calc | `calc_sk_u6_2` | calc-unit6-quiz-container · 6 | 6.4 The Fundamental Theorem of Calculus and Accumulation Functions: Evaluating g from Areas | easy | B | kök |
| calc | `calc_sk_u6_3` | calc-unit6-quiz-container · 6 | 6.4 Accumulation Functions with a Nonzero Lower Limit: Evaluating g to the Left of the Lower Limit | hard | B | kök |
| calc | `calc_sk_u6_4` | calc-unit6-quiz-container · 6 | 6.4 Accumulation Functions: Concavity of g(x) = ∫f from the Graph of f | medium | C | kök |
| calc | `calc_sk_u7_1` | calc-unit7-quiz-container · 7 | 7.3 Sketching Slope Fields: Matching a Slope Field to a Differential Equation | medium | D | kök |
| calc | `calc_sk_u7_2` | calc-unit7-quiz-container · 7 | 7.3 Reading Slope Fields: Slopes That Depend Only on y | easy | C | kök |
| chem | `chem_sk_u8_1` | chem-unit8-quiz-container · 8 | 8.5 Acid–Base Titrations: Determining Ka at the Half-Equivalence Point | medium | B | kök |
| chem | `chem_sk_u8_2` | chem-unit8-quiz-container · 8 | 8.8 Properties of Buffers: Locating the Maximum Buffer Capacity on a Titration Curve | easy | B | kök |
| chem | `chem_sk_u8_3` | chem-unit8-quiz-container · 8 | 8.5 Titration of a Weak Base with a Strong Acid: Finding pKb from the Curve | hard | B | kök |
| chem | `chem_sk_u1_1` | chem-unit1-quiz-container · 1 | 1.6 Photoelectron Spectroscopy: Identifying an Element from Peak Heights | easy | C | kök |
| chem | `chem_sk_u1_2` | chem-unit1-quiz-container · 1 | 1.6 Photoelectron Spectroscopy: Explaining the Lowest Binding-Energy Peak | medium | D | kök |
| chem | `chem_sk_u3_1` | chem-unit3-quiz-container · 3 | 3.5 Kinetic Molecular Theory: Interpreting Maxwell–Boltzmann Distributions at Two Temperatures | easy | A | kök |
| chem | `chem_sk_u5_1` | chem-unit5-quiz-container · 5 | 5.5 Collision Model: Why Rate Increases with Temperature (Energy Distribution and Ea) | medium | D | kök |
| chem | `chem_sk_u5_2` | chem-unit5-quiz-container · 5 | 5.11 Catalysis: Reading Activation Energies from a Reaction Energy Diagram | hard | C | kök |
| chem | `chem_sk_u1_3` | chem-unit1-quiz-container · 1 | 1.4 Composition of Mixtures: Particle Diagrams of Elements, Compounds, and Mixtures | easy | D | 4 şık |
| chem | `chem_sk_u3_2` | chem-unit3-quiz-container · 3 | 3.4 Ideal Gas Law and Dalton's Law: Partial Pressure from a Particle Diagram | medium | C | kök |
| econ | `econ_sk_mi1_1` | econ-quiz-container · Micro 1 | Micro 1.3 Production Possibilities Curve: Efficient, Inefficient, and Unattainable Points | easy | C | kök |
| econ | `econ_sk_mi1_2` | econ-quiz-container · Micro 1 | Micro 1.3 Production Possibilities Curve: Increasing Opportunity Cost | medium | B | kök |
| econ | `econ_sk_mi2_1` | econ-quiz-container · Micro 2 | Micro 2.5 Supply and 2.2 Demand: Identifying a Cause of a Demand Shift | easy | A | kök |
| econ | `econ_sk_mi2_2` | econ-quiz-container · Micro 2 | Micro 2.8 The Effects of Government Intervention in Markets: A Binding Price Ceiling | medium | C | kök |
| econ | `econ_sk_mi2_3` | econ-quiz-container · Micro 2 | Micro 2.8 Government Intervention: Deadweight Loss of a Per-Unit Tax | hard | B | kök |
| econ | `econ_sk_mi3_1` | econ-quiz-container · Micro 3 | Micro 3.6 Short-Run Production Decisions: Loss Minimization vs. Shutdown from Cost Curves | medium | A | kök |
| econ | `econ_sk_mi4_1` | econ-quiz-container · Micro 4 | Micro 4.2 Monopoly: Profit-Maximizing Quantity and Price from the Graph | medium | C | kök |
| econ | `econ_sk_mi4_2` | econ-quiz-container · Micro 4 | Micro 4.2 Monopoly: Deadweight Loss Relative to the Allocatively Efficient Outcome | hard | B | kök |
| econ | `econ_sk_ma3_1` | econ-quiz-container · Macro 3 | Macro 3.7 Equilibrium in the AD–AS Model: Short-Run Effects of a Decrease in Aggregate Demand | easy | D | kök |
| econ | `econ_sk_ma3_2` | econ-quiz-container · Macro 3 | Macro 3.9 Long-Run Self-Adjustment: Closing an Inflationary Gap | medium | A | kök |
| econ | `econ_sk_ma4_1` | econ-quiz-container · Macro 4 | Macro 4.6 The Money Market: Effect of an Open-Market Operation on the Nominal Interest Rate | medium | C | kök |
| econ | `econ_sk_ma5_1` | econ-quiz-container · Macro 5 | Macro 5.2 The Phillips Curve: Long-Run Adjustment after Expansionary Policy | hard | D | kök |
| phys | `phys_sk_u1_1` | phys-unit1-quiz-container · 1 | 1.2 Displacement, Velocity, and Acceleration: Velocity as the Slope of a Position–Time Graph | easy | A | kök |
| phys | `phys_sk_u1_2` | phys-unit1-quiz-container · 1 | 1.3 Representing Motion: Matching an Acceleration–Time Graph to a Velocity–Time Graph | medium | C | kök + 4 şık |
| phys | `phys_sk_u2_1` | phys-unit2-quiz-container · 2 | 2.2 Free-Body Diagrams: Block at Rest on a Rough Incline | easy | A | kök + 4 şık |
| phys | `phys_sk_u2_2` | phys-unit2-quiz-container · 2 | 2.2 Free-Body Diagrams and 2.6 Newton's Second Law: Person in an Elevator That Is Slowing Down While Moving Upward | medium | C | 4 şık |
| phys | `phys_sk_u3_1` | phys-unit3-wep-quiz-container · 3 | 3.2 Work as the Area Under a Force–Position Graph and 3.3 the Work–Energy Theorem: Finding Speed | medium | B | kök |
| phys | `phys_sk_u3_2` | phys-unit3-wep-quiz-container · 3 | 3.4 Conservation of Energy: Energy Bar Charts with Friction (Block–Incline–Earth System) | medium | D | kök + 4 şık |
| phys | `phys_sk_u4_1` | phys-unit4-momentum-quiz-container · 4 | 4.2 Change in Momentum and Impulse: Impulse as the Area Under a Force–Time Graph | medium | C | kök |
| phys | `phys_sk_u4_2` | phys-unit4-momentum-quiz-container · 4 | 4.2 Impulse and Momentum: Net Impulse from a Force–Time Graph with Positive and Negative Regions | hard | B | kök |

## 3. Doğrulama

- **Şekiller hesapla üretildi** (göz kararı yok): eğriler fonksiyonlardan örneklenip path'e çevrildi (ör. f = x³/3 − x²/2 − 2x + 1; f′ = (x+2)²(x−1)(3−x)/8; MC = q² − 8q + 20, AVC = q²/3 − 4q + 20, ATC = AVC + 64/q; PPC y = 100 − x²/100; SRPC π = 12/(u−1) − 1). Titrasyon eğrileri yük denkliğinin sayısal çözümüyle (HA pKa 4.70 ve 4.00, NH₃ Kb 1.8×10⁻⁵), Maxwell–Boltzmann eğrileri normalize dağılımdan, eğim alanları dy/dx'ten hesaplandı. Boş dairelerde eğri daire çevresinde kesildi.
- **Yeniden çözüm**: 50 sorunun her biri yalnız kök + şekil (ve alt metin) ile yeniden çözüldü; doğru şık tek ve her yanlış şıkkın hata açıklaması o şıkkın gerçek hatasını anlatıyor. Bu sırada düzeltilenler: NH₃ eşdeğerlik pH'ı 5.1 → 5.3 (hesap 5.28; şık da 5.3), HA 40 mL pH'ı 12.3 → 12.5, AD–AS uzun dönem grafiğinde SRAS₂ AD ile LRAS kesişiminden geçecek biçimde düzeltildi, firma zararı ≈ 31 dolar olarak düzeltildi; doğru şık dağılımı dengelendi (B 20 → 13).
- **Görsel kontrol**: 72 SVG headless Chrome ile render edilip tek tek incelendi; çakışan/kırpılan etiketler (titrasyon 9.3/12.5, P = MR, AD₂, eğim alanı eksen etiketleri, asansör FBD'sinde FN) düzeltildi.
- **SVG izin listesi** (yerel denetleyici + `server/sekil.js` `sekilDogrula`): **0 hata, temizleyici hiçbir şeyi değiştirmedi**. Yalnız izinli etiket/öznitelikler; renkler yalnız `currentColor`/`none` + 4 sınıf (`sk-vurgu`, `sk-ikincil`, `sk-izgara`, `sk-eksen`); viewBox ≤ 480×360; kökte width/height yok; font-size 11–14; harici URL/style/href/script yok. Eksen ok uçları `<marker>` yerine küçük `polygon` olarak çizildi.
- **Alt metinler**: her şekilde zorunlu ve Türkçe; anahtar noktalar, kesişimler, işaretler ve değerler yazılı (grafiği görmeyen biri soruyu çözebilir). `sekilDogrula` alt metinde `<`/`>` kabul etmediği için eşitsizlikler tam genişlik `＜`/`＞` ile yazıldı. İngilizce `baslik` (ör. "Graph of f", "Graph of f′", "Titration of HA with NaOH") kök şekillerinde var.
- **Şema** (`yeni-soru-ekle.js` kurallarının kopyası): alan adları ve sırası, bankada olmayan benzersiz kimlikler, A–D, tek doğru, `hata_aciklamalari` = tüm yanlış şıklar, dengeli `$`, ekonomide çıplak `$` yok (para "dollars"), kontrol karakteri yok, bankayla ve kendi içinde kök tekrarı yok: **0 hata**.

## 4. calc_u5_q3 için şekil önerisi (yeni soru değil, banka değiştirilmedi)

Mevcut kök f′ grafiğini sözle anlatıyor ("horizontal tangent lines at x = −2, 0, 2; crosses the x-axis at x = −3, −1, 1, 3"). Önerilen grafik f′(x) = 2cos(πx/2), −4 ≤ x ≤ 4: bu özelliklerin tamamını taşır ve açıklamadaki aralık işaretleriyle (x < −2'de f′ azalan, −2 < x < 0'da artan …) birebir uyumludur. `sekilDogrula`: 0 hata.
Kök şöyle kısaltılabilir: _"The graph of $f'$, the derivative of a twice-differentiable function $f$ on $[-4, 4]$, is shown above. At which values of $x$ does the graph of $f$ have a point of inflection?"_ — doğru şık (A) ve açıklama değişmez.

```json
{
  "tur": "svg",
  "svg": "<svg viewBox=\"0 0 360 220\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\"><line x1=\"34\" y1=\"107.7\" x2=\"344\" y2=\"107.7\" stroke=\"currentColor\" stroke-width=\"1.2\" class=\"sk-eksen\"/><polygon points=\"350,107.7 343,111.2 343,104.2\" fill=\"currentColor\" stroke=\"none\" class=\"sk-eksen\"/><line x1=\"184.3\" y1=\"194\" x2=\"184.3\" y2=\"12\" stroke=\"currentColor\" stroke-width=\"1.2\" class=\"sk-eksen\"/><polygon points=\"184.3,6 187.8,13 180.8,13\" fill=\"currentColor\" stroke=\"none\" class=\"sk-eksen\"/><line x1=\"50.7\" y1=\"104.7\" x2=\"50.7\" y2=\"110.7\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"50.7\" y=\"121.7\" font-size=\"11\" text-anchor=\"middle\" fill=\"currentColor\">−4</text><line x1=\"84.1\" y1=\"104.7\" x2=\"84.1\" y2=\"110.7\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"84.1\" y=\"121.7\" font-size=\"11\" text-anchor=\"middle\" fill=\"currentColor\">−3</text><line x1=\"117.5\" y1=\"104.7\" x2=\"117.5\" y2=\"110.7\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"117.5\" y=\"121.7\" font-size=\"11\" text-anchor=\"middle\" fill=\"currentColor\">−2</text><line x1=\"150.9\" y1=\"104.7\" x2=\"150.9\" y2=\"110.7\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"150.9\" y=\"121.7\" font-size=\"11\" text-anchor=\"middle\" fill=\"currentColor\">−1</text><line x1=\"217.7\" y1=\"104.7\" x2=\"217.7\" y2=\"110.7\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"217.7\" y=\"121.7\" font-size=\"11\" text-anchor=\"middle\" fill=\"currentColor\">1</text><line x1=\"251.1\" y1=\"104.7\" x2=\"251.1\" y2=\"110.7\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"251.1\" y=\"121.7\" font-size=\"11\" text-anchor=\"middle\" fill=\"currentColor\">2</text><line x1=\"284.5\" y1=\"104.7\" x2=\"284.5\" y2=\"110.7\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"284.5\" y=\"121.7\" font-size=\"11\" text-anchor=\"middle\" fill=\"currentColor\">3</text><line x1=\"318\" y1=\"104.7\" x2=\"318\" y2=\"110.7\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"318\" y=\"121.7\" font-size=\"11\" text-anchor=\"middle\" fill=\"currentColor\">4</text><line x1=\"181.3\" y1=\"174.1\" x2=\"187.3\" y2=\"174.1\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"178.3\" y=\"178.1\" font-size=\"11\" text-anchor=\"end\" fill=\"currentColor\">−2</text><line x1=\"181.3\" y1=\"140.9\" x2=\"187.3\" y2=\"140.9\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"178.3\" y=\"144.9\" font-size=\"11\" text-anchor=\"end\" fill=\"currentColor\">−1</text><line x1=\"181.3\" y1=\"74.5\" x2=\"187.3\" y2=\"74.5\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"178.3\" y=\"78.5\" font-size=\"11\" text-anchor=\"end\" fill=\"currentColor\">1</text><line x1=\"181.3\" y1=\"41.2\" x2=\"187.3\" y2=\"41.2\" stroke=\"currentColor\" stroke-width=\"1\" class=\"sk-eksen\"/><text x=\"178.3\" y=\"45.2\" font-size=\"11\" text-anchor=\"end\" fill=\"currentColor\">2</text><text x=\"350\" y=\"100.7\" font-size=\"12\" text-anchor=\"end\" fill=\"currentColor\">x</text><text x=\"192.3\" y=\"12\" font-size=\"12\" text-anchor=\"start\" fill=\"currentColor\">y</text><path d=\"M50.7 41.2L51.5 41.3L52.4 41.5L53.2 41.7L54 42.1L54.9 42.5L55.7 43.1L56.5 43.7L57.4 44.5L58.2 45.4L59.1 46.3L59.9 47.3L60.7 48.5L61.6 49.7L62.4 51L63.2 52.4L64.1 53.9L64.9 55.5L65.7 57.2L66.6 58.9L67.4 60.7L68.2 62.6L69.1 64.5L69.9 66.5L70.7 68.6L71.6 70.8L72.4 73L73.3 75.2L74.1 77.5L74.9 79.9L75.8 82.2L76.6 84.7L77.4 87.1L78.3 89.6L79.1 92.2L79.9 94.7L80.8 97.3L81.6 99.9L82.4 102.4L83.3 105.1L84.1 107.7L84.9 110.3L85.8 112.9L86.6 115.5L87.5 118L88.3 120.6L89.1 123.2L90 125.7L90.8 128.2L91.6 130.6L92.5 133.1L93.3 135.5L94.1 137.8L95 140.1L95.8 142.4L96.6 144.6L97.5 146.7L98.3 148.8L99.1 150.8L100 152.7L100.8 154.6L101.6 156.4L102.5 158.2L103.3 159.8L104.2 161.4L105 162.9L105.8 164.3L106.7 165.6L107.5 166.8L108.3 168L109.2 169L110 170L110.8 170.8L111.7 171.6L112.5 172.2L113.3 172.8L114.2 173.3L115 173.6L115.8 173.9L116.7 174L117.5 174.1L118.4 174L119.2 173.9L120 173.6L120.9 173.3L121.7 172.8L122.5 172.2L123.4 171.6L124.2 170.8L125 170L125.9 169L126.7 168L127.5 166.8L128.4 165.6L129.2 164.3L130 162.9L130.9 161.4L131.7 159.8L132.5 158.2L133.4 156.4L134.2 154.6L135.1 152.7L135.9 150.8L136.7 148.8L137.6 146.7L138.4 144.6L139.2 142.4L140.1 140.1L140.9 137.8L141.7 135.5L142.6 133.1L143.4 130.6L144.2 128.2L145.1 125.7L145.9 123.2L146.7 120.6L147.6 118L148.4 115.5L149.3 112.9L150.1 110.3L150.9 107.7L151.8 105.1L152.6 102.4L153.4 99.9L154.3 97.3L155.1 94.7L155.9 92.2L156.8 89.6L157.6 87.1L158.4 84.7L159.3 82.2L160.1 79.9L160.9 77.5L161.8 75.2L162.6 73L163.5 70.8L164.3 68.6L165.1 66.5L166 64.5L166.8 62.6L167.6 60.7L168.5 58.9L169.3 57.2L170.1 55.5L171 53.9L171.8 52.4L172.6 51L173.5 49.7L174.3 48.5L175.1 47.3L176 46.3L176.8 45.4L177.6 44.5L178.5 43.7L179.3 43.1L180.2 42.5L181 42.1L181.8 41.7L182.7 41.5L183.5 41.3L184.3 41.2L185.2 41.3L186 41.5L186.8 41.7L187.7 42.1L188.5 42.5L189.3 43.1L190.2 43.7L191 44.5L191.8 45.4L192.7 46.3L193.5 47.3L194.4 48.5L195.2 49.7L196 51L196.9 52.4L197.7 53.9L198.5 55.5L199.4 57.2L200.2 58.9L201 60.7L201.9 62.6L202.7 64.5L203.5 66.5L204.4 68.6L205.2 70.8L206 73L206.9 75.2L207.7 77.5L208.5 79.9L209.4 82.2L210.2 84.7L211.1 87.1L211.9 89.6L212.7 92.2L213.6 94.7L214.4 97.3L215.2 99.9L216.1 102.4L216.9 105.1L217.7 107.7L218.6 110.3L219.4 112.9L220.2 115.5L221.1 118L221.9 120.6L222.7 123.2L223.6 125.7L224.4 128.2L225.3 130.6L226.1 133.1L226.9 135.5L227.8 137.8L228.6 140.1L229.4 142.4L230.3 144.6L231.1 146.7L231.9 148.8L232.8 150.8L233.6 152.7L234.4 154.6L235.3 156.4L236.1 158.2L236.9 159.8L237.8 161.4L238.6 162.9L239.5 164.3L240.3 165.6L241.1 166.8L242 168L242.8 169L243.6 170L244.5 170.8L245.3 171.6L246.1 172.2L247 172.8L247.8 173.3L248.6 173.6L249.5 173.9L250.3 174L251.1 174.1L252 174L252.8 173.9L253.6 173.6L254.5 173.3L255.3 172.8L256.2 172.2L257 171.6L257.8 170.8L258.7 170L259.5 169L260.3 168L261.2 166.8L262 165.6L262.8 164.3L263.7 162.9L264.5 161.4L265.3 159.8L266.2 158.2L267 156.4L267.8 154.6L268.7 152.7L269.5 150.8L270.4 148.8L271.2 146.7L272 144.6L272.9 142.4L273.7 140.1L274.5 137.8L275.4 135.5L276.2 133.1L277 130.6L277.9 128.2L278.7 125.7L279.5 123.2L280.4 120.6L281.2 118L282 115.5L282.9 112.9L283.7 110.3L284.5 107.7L285.4 105.1L286.2 102.4L287.1 99.9L287.9 97.3L288.7 94.7L289.6 92.2L290.4 89.6L291.2 87.1L292.1 84.7L292.9 82.2L293.7 79.9L294.6 77.5L295.4 75.2L296.2 73L297.1 70.8L297.9 68.6L298.7 66.5L299.6 64.5L300.4 62.6L301.3 60.7L302.1 58.9L302.9 57.2L303.8 55.5L304.6 53.9L305.4 52.4L306.3 51L307.1 49.7L307.9 48.5L308.8 47.3L309.6 46.3L310.4 45.4L311.3 44.5L312.1 43.7L312.9 43.1L313.8 42.5L314.6 42.1L315.5 41.7L316.3 41.5L317.1 41.3L318 41.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"/><circle cx=\"50.7\" cy=\"41.2\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"117.5\" cy=\"174.1\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"184.3\" cy=\"41.2\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"251.1\" cy=\"174.1\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"318\" cy=\"41.2\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "alt": "f′ grafiği, −4 ≤ x ≤ 4: dalga biçimli düzgün eğri. Yerel ekstremumlar (yatay teğetler): (−4, 2) uç noktası, x = −2’de dip (−2), x = 0’da tepe (2), x = 2’de dip (−2), (4, 2) uç noktası. Eğri x-eksenini x = −3, −1, 1 ve 3’te keser. f′ azalan: (−4, −2) ve (0, 2); artan: (−2, 0) ve (2, 4).",
  "baslik": "Graph of f′",
  "konum": "govde"
}
```
