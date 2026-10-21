# Onay ve içerik kararları — uygulama kaydı (1.11.0)

_Tarih: 2026-10-21 · Araç: `node araclar/onay-uygula.js` (idempotent; `--kuru` ile önizleme) · Girdiler: `araclar/onay/*.json` (bağımsız denetçi kararları),
`araclar/icerik-denetim/KARARLAR.md` (sahip adına kararlar), `araclar/onay/yeniden-yazim.js` (yeniden yazılan soruların tam içeriği)._

- Tohum sürümleri: **soru bankası 3 → 4**, **FRQ 1 → 2**. Mevcut veritabanları bir sonraki açılışta güncellenir; yönetici panelinde
  düzenlenmiş (ya da onaylanmış/reddedilmiş) kayıtlara dokunulmaz.
- Her kararlı kayda `ek.onay = { tarih: "2026-10-21", kaynak: "bağımsız denetim (sahip yetkisiyle)" }` yazıldı; reddedilenlere ayrıca `ek.redNedeni`.
- **Hiçbir sorunun doğru şıkkı (`dogru`) değişmedi** (araç her çalıştırmada denetler; değişirse durur).
- Tohumda taslak kalmadı: **aktif 1349 · arşiv 11 · toplam 1360**. FRQ: **32 aktif**.

## 1. Taslak soruların onayı (229)

| Ders sayfası | Onay | Düzeltilip onay | Ret (arşiv) | → Aktif | → Arşiv |
|---|---:|---:|---:|---:|---:|
| ap-calculus | 56 | 1 | 6 | 57 | 6 |
| ap-physics | 38 | 2 | 0 | 40 | 0 |
| sinav-cents | 14 | 0 | 1 | 14 | 1 |
| ap-chemistry | 44 | 0 | 1 | 44 | 1 |
| ap-biology | 22 | 0 | 0 | 22 | 0 |
| ap-electives | 27 | 1 | 1 | 28 | 1 |
| ap-english | 14 | 1 | 0 | 15 | 0 |
| **Toplam** | **215** | **5** | **9** | **220** | **9** |

### Düzeltilip onaylananlar (alanlar denetçinin `duzeltme` değeriyle birebir)

| Kayıt | Alan(lar) | Neden (özet) |
|---|---|---|
| `calc_y_u5_14` | aciklama | İşaret testi verilen aralığın dışındaki x = −1'i kullanıyordu; aralık içi f′(−0.9) ile değiştirildi. |
| `phys_y_u8_19` | hata_aciklamalari.D.aciklama | "Basınç farkı çeker" ifadesi → "iter" (genel hatırlatmayla tutarlı). |
| `phys_y_u1_1` | hata_aciklamalari.B.etiket | Etiketteki fazladan ters eğik çizgi kaldırıldı. |
| `csa_y_4_1` | govde, konu, aciklama, genel_hatirlatma | `hasNextInt()` AP CSA Java Quick Reference'ta yok → `hasNext()` (cevap aynı: 21). |
| `eng_y_r_7` | hata_aciklamalari.C.aciklama | Dil bilgisi: "kendi şehre" → "kendi şehrine". |

### Reddedilenler (arşiv; `ek.redNedeni` dolu)

| Kayıt | Neden (özet) |
|---|---|
| `calc_y_u2_4` | Aktif `calc_u2_q9` ile neredeyse aynı (x³, [1, 3] ortalama değişim). |
| `calc_y_u2_6` | Aktif `calc_u2_q1` ile birebir aynı. |
| `calc_y_u3_4` | Aktif `sv_calcab_u3_3` ile birebir aynı. |
| `calc_y_u5_1` | Aktif `sv_calcab_u5_2` ile birebir aynı. |
| `calc_y_u5_4` | Aktif `sv_calcbc_u5_2` / `calc_u5_q2` ile aynı kübik ve aralık. |
| `calc_y_u8_1` | Aktif `calc_u8_q22` ile birebir aynı. |
| `cents_y_9` | Aktif `phys_mom_q7` ile neredeyse kopya (aynı patenci/top kurgusu). |
| `chem_y_u7_2` | Aktif `chem_u7_q25` ile neredeyse aynı (asitlendirme ve çözünürlük). |
| `micro_y_1_1` | Aktif `econ_ma1a` ile aynı PPC tablosu. |

## 2. FRQ onayı (32)

| Ders | Onay | Düzeltilip onay | Ret | → Aktif |
|---|---:|---:|---:|---:|
| calculus-ab | 4 | 0 | 0 | 4 |
| calculus-bc | 2 | 0 | 0 | 2 |
| physics-1 | 4 | 1 | 0 | 5 |
| chemistry | 5 | 0 | 0 | 5 |
| biology | 5 | 0 | 0 | 5 |
| english-language | 3 | 0 | 0 | 3 |
| macroeconomics | 2 | 0 | 0 | 2 |
| microeconomics | 2 | 0 | 0 | 2 |
| computer-science-a | 3 | 1 | 0 | 4 |
| **Toplam** | **30** | **2** | **0** | **32** |

- `frq-phys1-3`: (c) örnek çözümü eğimi en uygun doğru üzerindeki noktalardan alacak biçimde yeniden yazıldı (rubrikle tutarlı; k ≈ 25 N/m).
- `frq-csa-4`: (b) "orijinal örnek dizi" netleştirildi; rubriğin ilk ölçütü eşdeğer satır öncelikli dolaşımı da kabul ediyor.
- **FRQ yükseltme yolu:** `server/frq.js › tohumEsitle` artık durumu da tohumdan alır — ama yalnız yönetici o FRQ'ya hiç dokunmadıysa
  (içerik düzenlemesi, onay ya da arşiv; `guncelleyen` ya da `frq_gecmis.degistiren` bir kullanıcı kimliği). Dokunulmuşsa durum korunur,
  içerik düzenlemesi (`elle = 1`) varsa içerik de korunur. Soru bankasındaki "yönetici düzenlemesi korunur" kuralının eşi.

## 3. Ürün kararları

- **Physics C (karar 1):** Beş calculus gerektiren soru silinmedi; konu etiketi `Physics C · ileri · …`, `ek.ileri = true`, `deneme_kodlari`'nda physics-1 yok
  (zaten boştu; korundu). Konu etiketi soru kartında görünür, "ileri düzey" işareti oradan okunur (ayrı bir arayüz rozeti eklenmedi).

  | Soru | Önce | Sonra |
  |---|---|---|
  | `phys_u2_q7` | Physics C · Drag Force & Terminal Velocity | Physics C · ileri · Drag Force & Terminal Velocity |
  | `phys_u1_q6` | 1.1 Calculus-Based Kinematics: Instantaneous Rest (Physics C) | Physics C · ileri · 1.1 Calculus-Based Kinematics: Instantaneous Rest |
  | `phys_wep_q16` | 3.3 Potential Energy Function, Force, and Equilibrium Stability (Physics C) | Physics C · ileri · 3.3 Potential Energy Function, Force, and Equilibrium Stability |
  | `phys_wep_q21` | 3.2 Work by a Position-Dependent Force (Physics C Integration) | Physics C · ileri · 3.2 Work by a Position-Dependent Force |
  | `phys_mom_q21` | 4.2 Impulse of a Time-Dependent Force (Physics C Integration) | Physics C · ileri · 4.2 Impulse of a Time-Dependent Force |

- **calc_u6_q32 (karar 2):** konu `[BC ONLY] 6.14 …` → `6.10 Integrating Using Long Division: Simplify Before Integrating`; `ek.cedKonu = 6.10`;
  AB konusu olduğu için `deneme_kodlari` = calculus-ab + calculus-bc. Köke "[BC ONLY]" eklenmedi.
- **Kimya konu etiketleri (karar 3, 21 soru):** konu numarası `ek.cedKonu`'daki güncel CED numarasıyla değişti, başlık metni korundu:
  `chem_u1_q5` 1.8→2.3, `chem_u2_q10` 2.2→2.3, `chem_u3_q6` 3.3→3.2, `chem_u5_q15` 5.5→5.11, `chem_u7_q25` 8.11 Preview→7.13 ("Preview:" kaldırıldı),
  `chem_u9_q13` 9.6→7.14, `chem_u9_q14`/`q15` 9.7→9.6, `chem_u9_q16`/`q17`/`q18` 9.8→9.7, `chem_u9_q19`–`q22` 9.9→9.8, `chem_u9_q23`/`q24` 9.10→9.9,
  `chem_u9_q25`–`q28` 9.11→9.10.
- **Zorluk önerileri (karar 4, 121):** `ek.zorlukOnerisi` → `zorluk`; iz `ek.zorlukNotu`'nda ("eski → yeni (bağımsız denetim önerisi, sahip kararı 2026-10-21)").
  Soru bankası yükseltmesi eski hâli `questions_bank_history`'ye yazar.
  - AP Calculus 93: hard→medium 43, medium→easy 49, easy→medium 1
  - AP Chemistry 24: hard→medium 23, medium→easy 1
  - AP English 4: hard→medium 4
  - Aktif bankada "hard" oranı şimdi %20.8 (280 / 1348, vitrin hariç).
  - `calc_u4_q14` için öneri (easy) uygulandı, ardından yeniden yazımda medium yapıldı (yeni soru L'Hôpital'i üç kez ister); iki adım da `ek.zorlukNotu`'nda.
- **Seviye hesap makinesi bayrakları (karar 5):** değiştirilmedi.
- **calc_u7_q1 / aynı şık kontrolü (karar 6):** yönetici formunda (sunucu `server/sorubankasi.js` doğrulaması ve istemci `assets/js/admin-soru-bankasi.js`)
  aynı şık kontrolü artık büyük/küçük harfe duyarlı; `k(t - 20)` / `k(T - 20)` kaydedilir, birebir aynı iki şık hâlâ reddedilir (test eklendi).

## 4. Yeniden yazılan sorular (17; kimlikler ve doğru şık harfleri aynı)

Her biri için: yeni kök, 4 farklı şık, aynı anahtar, Türkçe adım adım çözüm, genel hatırlatma, her yanlış şık için o değeri üreten hata
açıklaması, `ek` (kavram, ipucu, hesap makinesi, sık hata, cedKonu) ve `ek.yenidenYazim`. Sorular bağımsız olarak yeniden çözüldü; matematik/kimya/biyoloji
anahtarları araçtaki sayısal sağlamayla (11/11) doğrulanır. Aktif bankada yeni köklerin kopyası yok (araç + pm-denetim tekrar taraması: 0).

| Soru | Önce | Sonra | Anahtar |
|---|---|---|---|
| `sv_calcab_u3_2` | x² + xy + y² = 7, (1, 2) → −4/5 (`calc_u3_q2` kopyası) | x² − xy + y² = 7, (−1, 2) → **4/5**; çeldiriciler −4/5 (işaret), 2/5 (−y terimi atlandı), 1 (−x·y′ atlandı) | D |
| `sv_calcab_u4_3` | (e^{2x} − 1 − 2x)/x² → 2 (`calc_u4_q5` kopyası) | (e^{3x} − 1 − 3x)/x² → **9/2**; 9 (payda türevi 1), 0 (erken durma), 3/2 (iç türev unutuldu) | D |
| `sv_calcbc_u3_2` | x² + y² = 25, (3, 4) → −25/64 (`calc_u3_q3` kopyası) | x² + y² = 169, (5, 12) → **−169/1728**; −5/12 (birinci türev), −1/12 (y sabit), −119/1728 (pay işareti) | D |
| `sv_calcbc_u6_3` | ∫₂³ 1/(x² − 1) dx (`calc_u6_q34` kopyası) | ∫₃⁴ 2/(x² − 4) dx = **½ ln(5/3)**; ln(5/3) (½ unutuldu), ½ ln(3/5) (sınır sırası), ln(12/5) (ln\|g\| kalıbı). Not: denetimin önerdiği "½ ln(9/5)" hatalıydı; sayısal integral 0.2554 = ½ ln(5/3). | B |
| `calc_u4_q14` | (1 − cos x)/x² → 1/2 (`calc_u1_q11` ile aynı limit) | (x − sin x)/x³ → **1/6**; 0 (erken durma), 1/2 (x³′ = x² hatası), −1/6 (sin′ işareti) | C |
| `phys_u3_q3` | C: 11.8 m/s (kaynağı belirsiz) | C: **12.5 m/s ≈ √(rg)·tanθ** (tan θ karekökün dışına çıkarılmış); diğer şıklar ve anahtar 20.7 m/s aynı; C açıklaması yeni | A |
| `chem_u1_q6` | D: 63.00 amu; Europium (anlamsız); C: 64.55 (ters ağırlıklandırma bu değeri vermiyordu) | D: **64.93 amu; Zinc** (yalnız ağır izotop); C: **64.31 amu** (gerçek ters ağırlıklandırma); B açıklamasına yanlış element eşlemesi eklendi | A |
| `chem_u2_q3` | Lewis yapıları ":Ö", "N̈:" gibi belirsiz noktalarla | Her yapı ortaklanmamış çift sayılarıyla: I O(3 LP)–C≡N(1 LP); II O(2 LP)=C=N(2 LP); III O(1 LP)≡C–N(3 LP); çözümde 16 e⁻ sağlaması | A |
| `sv_chem_u1_2` | N/O iyonlaşma anomalisi (`chem_u1_q2` ile aynı veri) | **Be (900) / B (801 kJ/mol)** anomalisi: 2p alt düzeyi + 2s perdelemesi; çeldirici A eşleşme itmesini (N/O açıklaması) yanlış uygular | D |
| `sv_chem_u6_2` | H₂ + Cl₂ → 2 HCl (`chem_u6_q16` kopyası) | **N₂ + 3 H₂ → 2 NH₃** (945, 436, 391) → **−93 kJ/mol**; +93 (sıra), +1080 (3 N–H sayıldı), −4599 (hepsi toplandı) | A |
| `sv_chem_u9_1` | 4 süreç `chem_u9_q1` ile aynı | **Ag⁺ + Cl⁻ → AgCl(s)** (ΔS° < 0); I₂(s)→I₂(g), N₂O₄→2 NO₂, 2 H₂O₂(l)→2 H₂O(l) + O₂(g) | A |
| `bio_u1_q7` | Soğukta doymamış yağ asidi (`bio_u2_q3` ile neredeyse aynı; içerik CED 2.4) | **Glikojen dallanması (CED 1.5):** çok zincir ucu → hızlı glikoz salımı; çeldiriciler β-bağ, "glikoz başına daha çok enerji", selüloz lifi | D |
| `sv_bio_u1_3` | %18 A → G %32 (`bio_u6_q1` ile aynı sayılar) | **%28 A → G %22**; 28 (G = A), 44 (G + C), 56 (A + T) | D |
| `sv_bio_u4_2` | 200 hücre / 20 mitoz / 24 h (`bio_u4_q21` ile aynı) | **300 hücre / 45 mitoz / 20 h → 3.0 h**; 17.0 (interfaz), 1.5 (yarılama), 6.0 (ikiye katlama) | D |
| `eng_write_q15` | "Which choice most effectively combines…" (dilbilgisi) | Retorik amaç: birleşik cümle **oylamanın neyi belirleyeceğini vurgulamalı**; çeldiriciler vurguyu dağıtır, konuyu düşürür, "very important" ile geçiştirir | C |
| `eng_write_q18` | Paralellik (dilbilgisi) | Retorik etki: üç beceri **düzenli, vurgulu bir ritimle** sıralanmalı; çeldiriciler ritmi kırar (gerund), çekingen dil, özne kayması | B |
| `eng_read_q12` | Pasaj başlığı "From an address to first-year engineering students" cevabı ele veriyordu | Başlık **"From an address on communication in engineering"** (`ap-english.html`, `server/tohum/deneme-meta.json`); soru metni zaten nötrdü | B |

Değişmeyenler (karar gereği): `eng_read_q16` (anahtar doğru), `calc_u5_q3` (grafik sözel betimle kalır).

## 5. Physics C metin değişiklikleri (Physics C vaadi kaldırıldı)

| Dosya | Değişiklik |
|---|---|
| `ap-physics.html` | `<title>` "AP Physics (1 & C)" → "AP Physics 1"; meta açıklama Physics 1 kapsamıyla yeniden yazıldı; hero rozeti ve başlık "AP Physics 1"; MCQ formatı "Physics 1"; sınav havuzu metni "AP Physics 1 sınavında 5"; "AP Physics 1 Past FRQs" kartı (Physics C kaynakları metinden çıktı); "MODEL 1 … AP PHYSICS 1 FRQ"; "Current FRQ Types (AP Physics 1 …)". Gauss kartı ve Module 4 (E&M) "ileri okuma · Physics 1 sınavında yok" olarak etiketlendi; Unit 3/4 giriş metinleri ve calculus notları "Physics C · ileri" etiketiyle. |
| `index.html` | Ders kartı "Physics 1 / C" → "Physics 1". |
| `assets/js/app.js` | Ders listesi adı "AP Physics 1 / C" → "AP Physics 1". |
| `assets/js/universite-isterleri.js` | "AP Physics (Physics 1 / C)" → "AP Physics 1". |
| `araclar/testler/bugun-birim-test.js` | Sınama verisindeki ders adı "AP Physics 1". |

Mevzuat/üniversite şartı metinlerindeki "Physics C" geçişleri (ör. KMK, Groningen/Twente, sınav takvimi) olgusal bilgi olduğu için korundu.

## 6. Son aktif toplamlar (ders sayfası başına)

| Sayfa | Ders soruları | Seviye testi | Toplam aktif | Arşiv |
|---|---:|---:|---:|---:|
| ap-calculus | 297 | 54 | **351** | 7 |
| ap-physics | 201 | 24 | **225** | 0 |
| ap-chemistry | 243 | 27 | **270** | 2 |
| ap-biology | 183 | 24 | **207** | 0 |
| ap-english | 56 | 24 | **80** | 0 |
| ap-electives | 141 | 0 | **141** | 1 |
| sinav-cents | 74 | 0 | **74** | 1 |
| vitrin | — | — | 1 | 0 |
| **Toplam** | **1195** | **153** | **1349** | **11** |

Yeni istasyonlar artık aktif: `phys-unit8-quiz-container` 20, `bio-unit8-quiz-container` 20 (pm-denetim "yalnız taslak" uyarıları kalktı).
Deneme havuzu: 1189 soru (calculus-ab 215).

## 7. Doğrulama

- `node araclar/onay-uygula.js --kuru` → 0 yeni değişiklik (idempotent), sayısal sağlama 11/11.
- `node araclar/pm-denetim.js` → 0 sorun, 0 uyarı; 0 aktif tekrar grubu; FRQ 32, 0 sorun.
- `npm test` → 126/126 geçti (sayı temelli testler yeni toplamlara güncellendi; onay kuyruğu ve FRQ akış testleri onay öncesi hâli taşıyan
  sınama tohumuyla çalışır; yeni testler: 1.11.0 tohum yükseltmesi, FRQ durum yükseltmesi, büyük/küçük harfe duyarlı şık kontrolü).
- `araclar/testler/*-birim-test.js` → hepsi geçti.
- Canlı veritabanının kopyası (VACUUM INTO, geçici klasör; asıl dosyaya dokunulmadı, kopya silindi): önce soru tohumu 3, FRQ tohumu 1,
  `aktif 1129 · arsiv 2 · taslak 229`, FRQ `taslak 32` → açılıştan sonra soru tohumu 4, FRQ tohumu 2, `aktif 1349 · arsiv 11`, FRQ `aktif 32`;
  günlük: "Soru bankası tohum sürümü 3 → 4: 386 soru güncellendi, 0 yönetici düzenlemesi korundu", "FRQ tohumu 1 → 2: 32 güncellendi".
