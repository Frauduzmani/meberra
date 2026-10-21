# AP Chemistry: Yeni Özgün Sorular (taslak, 1.11.0)

Dosya: `araclar/yeni-sorular/chemistry.json` (45 soru). Tüm sorular `durum: "taslak"`, `ek.uretim: "1.11.0"`. Kimlikler `chem_y_u<ünite>_<n>` biçiminde. `kutu`, `kutu_baslik`, `dizi` ve `unite` alanları bankadaki ünite sorularıyla aynı. `numara` ise her ünitenin mevcut son numarasından devam ediyor. Gövde ve şıklar İngilizce (AP biçimi), açıklamalar Türkçe ve adım adım. Her yanlış şık için `hata_aciklamalari` var ve her biri o şıkkın hangi hatayla elde edildiğini yeniden üretiyor.

Hedef: `araclar/icerik-denetim/chemistry.md` raporundaki boşluklar. Unite 3'e 25 soru eklendi (bankadaki 15 soru 40'a çıkıyor). Hiç sorusu olmayan 3.3, 3.8, 3.11, 2.5 ve 4.1 konularına en az 3'er soru yazıldı. Kalan 14 soru, 1–2 sorusu olan zayıf konulara dağıtıldı.

## Ünite dağılımı

| Ünite | Soru | Kolay | Orta | Zor |
|---|---|---|---|---|
| 1 | 4 | 1 | 2 | 1 |
| 2 | 4 | 1 | 2 | 1 |
| 3 | 25 | 8 | 12 | 5 |
| 4 | 5 | 3 | 2 | 0 |
| 5 | 1 | 0 | 1 | 0 |
| 6 | 1 | 0 | 1 | 0 |
| 7 | 2 | 0 | 1 | 1 |
| 8 | 2 | 0 | 1 | 1 |
| 9 | 1 | 0 | 1 | 0 |
| **Toplam** | **45** | **13 (%29)** | **23 (%51)** | **9 (%20)** |

Doğru şık dağılımı: A 11, B 11, C 11, D 12.

## Konu dağılımı (CED)

| Konu | Soru | Kolay | Orta | Zor |
|---|---|---|---|---|
| 1.4 Composition of Mixtures | 1 | 0 | 0 | 1 |
| 1.6 Photoelectron Spectroscopy | 1 | 0 | 1 | 0 |
| 1.7 Periodic Trends | 1 | 0 | 1 | 0 |
| 1.8 Valence Electrons and Ionic Compounds | 1 | 1 | 0 | 0 |
| 2.4 Structure of Metals and Alloys | 1 | 0 | 1 | 0 |
| **2.5 Lewis Diagrams** (önceden 0) | 3 | 1 | 1 | 1 |
| 3.1 Intermolecular and Interparticle Forces | 2 | 0 | 1 | 1 |
| 3.2 Properties of Solids | 3 | 1 | 2 | 0 |
| **3.3 Solids, Liquids, and Gases** (önceden 0) | 3 | 1 | 1 | 1 |
| 3.5 Kinetic Molecular Theory | 2 | 1 | 1 | 0 |
| 3.6 Deviation from Ideal Gas Law | 2 | 1 | 0 | 1 |
| 3.7 Solutions and Mixtures | 2 | 1 | 1 | 0 |
| **3.8 Representations of Solutions** (önceden 0) | 3 | 1 | 1 | 1 |
| 3.9 Separation of Solutions and Mixtures | 1 | 0 | 1 | 0 |
| 3.10 Solubility | 2 | 1 | 1 | 0 |
| **3.11 Spectroscopy and the EM Spectrum** (önceden 0) | 3 | 1 | 1 | 1 |
| 3.12 Photoelectric Effect | 1 | 0 | 1 | 0 |
| 3.13 Beer–Lambert Law | 1 | 0 | 1 | 0 |
| **4.1 Introduction for Reactions** (önceden 0) | 3 | 2 | 1 | 0 |
| 4.4 Physical and Chemical Changes | 1 | 1 | 0 | 0 |
| 4.7 Types of Chemical Reactions | 1 | 0 | 1 | 0 |
| 5.1 Reaction Rates | 1 | 0 | 1 | 0 |
| 6.2 Energy Diagrams | 1 | 0 | 1 | 0 |
| 7.2 Direction of Reversible Reactions | 1 | 0 | 1 | 0 |
| 7.13 pH and Solubility | 1 | 0 | 0 | 1 |
| 8.5 Acid–Base Titrations | 1 | 0 | 0 | 1 |
| 8.6 Molecular Structure of Acids and Bases | 1 | 0 | 1 | 0 |
| 9.2 Absolute Entropy and Entropy Change | 1 | 0 | 1 | 0 |

## Veri yorumlama soruları (görsel yerine metin tablo)

Görsel kullanılamadığı için 22 soruda küçük HTML `<table>` veya metinle tarif edilen bir temsil var:

- **PES tablosu:** u1_1 (Al'nin bağlanma enerjileri ve tepe yükseklikleri)
- **İyonlaşma enerjisi tablosu:** u1_4
- **Atom ve iyon yarıçapı tabloları:** u2_4, u3_5
- **Katı özellikleri tablosu:** u3_3
- **Kaynama noktası ve buhar basıncı tabloları:** u3_1, u3_2, u3_7
- **PV/nRT ve basınç tablosu:** u3_12
- **Tanecik diyagramı tarifleri:** u3_15, u3_16, u3_17, u4_2
- **Spektroskopi dalga boyu tablosu:** u3_22
- **Fotoelektrik deney tablosu:** u3_24
- **Beer–Lambert kalibrasyon tablosu:** u3_25
- **Derişim–zaman tabloları:** u5_1, u7_1
- **Enerji profili ana noktaları:** u6_1
- **Ksp ve Ka tablosu:** u7_2
- **Titrasyon eğrisi anahtar noktaları:** u8_2 (başlangıç, yarı eşdeğerlik, eşdeğerlik ve eşdeğerlik sonrası pH)
- **Standart entropi tablosu:** u9_1

## Öz denetim sonucu

Her soru anahtara bakılmadan yeniden çözüldü. Ayrıca bir betikle şunlar kontrol edildi:

| Kontrol | Sonuç |
|---|---|
| Tam olarak 4 şık, hepsi birbirinden farklı | 45/45 ✓ |
| Tek doğru şık; doğru şık için hata açıklaması yok, her yanlış şık için `etiket` ve `aciklama` var | 45/45 ✓ |
| Bankadaki ve yeni setteki gövdelerle yinelenen gövde ya da kimlik | 0 ✓ |
| `$` dengesi, matematik içinde `&lt;` kalmaması (`\lt`, `\gt` kullanıldı), HTML'i bozacak çıplak `<` olmaması, etiket açılış ve kapanışlarının eşleşmesi | Sorunsuz ✓ |
| Kaçış karakteri kaybı (LaTeX `\t`, `\f` vb.) | Yok ✓ |
| Hesaplı soruların bağımsız yeniden hesabı | Hepsi anahtarla uyumlu ✓ |

Hesaplı sorulardaki bağımsız sonuçlar:

- Seyreltme: 0.30 M.
- [Cl⁻]: 0.60 M.
- Foton enerjisi: 4.6×10⁻²⁰ J.
- Beer–Lambert: 0.125 M.
- Kütlece % Cl: 55.6.
- NO₂ oluşum hızı: 6.0×10⁻⁴ M/s.
- Enerji profili: ΔH = −80, Ea(geri) = 150.
- Kc: 2.0.
- ΔS°: −187.8 J/(mol·K).
- PCl₃ ortaklanmamış çift sayısı: 10. I₃⁻ merkez atomundaki çift sayısı: 3.
- Coulomb sıralaması: KCl &lt; NaF &lt; MgO.
- Tanecik sayıları: 3 Ca²⁺ ve 12 Cl⁻.
- Titrasyon seti (u8_2) iç tutarlılığı: Kb = 1.8×10⁻⁵ ve 0.100 M ile başlangıç pH'ı 11.13, eşdeğerlik pH'ı 5.28 ve 35.0 mL'deki pH 1.78 yeniden hesaplandı. Hepsi tabloyla uyumlu.

Yeniden çözüm sırasında düzeltilenler:

- LaTeX ters bölü işaretlerinin normal JS dizgilerinde kaybolması engellendi; tüm hata açıklamaları ham dizgiye çevrildi.
- Matematik içindeki `&lt;` ve `&gt;` karakterleri `\lt` ve `\gt` yapıldı.
- İki açıklamadaki fazladan `\'` kaçışı temizlendi.

İçerikle ilgili notlar:

- u3_11'deki "200 K" çeldiricilerinde NH₃ gerçekte yoğuşur. Bu durum şıkkın yanlışlığını yalnızca güçlendirir, doğru cevabı etkilemez.
- u8_1, ikili asitleri suyun eşitleme etkisinden bağımsız olarak "proton verme eğilimi" ile soruyor. HCl, HBr ve HI suda tamamen iyonlaştığı için gövde buna göre yazıldı.

Bankaya aktarmadan önce insan gözden geçirmesi önerilir.
