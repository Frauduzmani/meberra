# Yeni Sorular — AP Biology, AP English Language, AP Electives

Tarih: 21.10.2026 · Veri: `biology-english-electives.json` · Tüm sorular `durum: "taslak"`, `ek.uretim: "1.11.0"`
Soru bankasına (`server/tohum/soru-bankasi.json`) **aktarılmadı**; yalnızca bu klasöre yazıldı.

## Kısa sonuç

- **66 özgün AP tarzı soru** yazıldı. Gövde ve şıklar İngilizce, açıklamalar Türkçe.
- Her yanlış şık için `hata_aciklamalari` var. Her biri belirli bir öğrenci hatasını adlandırıyor.
- Bağımsız çözüm kontrolünde **66 sorunun 66'sı anahtarla aynı çıktı**. Düzeltme gerekmedi.
- Zorluk: 16 easy, 31 medium, 19 hard.
- Doğru şık dağılımı: A 15, B 15, C 18, D 18.

## Ders ve ünite bazında sayılar

| Ders | Kutu | Ünite / konu | Soru | ID'ler |
|---|---|---|---|---|
| AP Biology | `bio-unit8-quiz-container` (**YENİ**) | Unit 8 Ecology (8.1–8.7) | 20 | bio_y_8_1 … bio_y_8_20 |
| AP Biology | `bio-unit7-quiz-container` | 7.11 Extinction | 2 | bio_y_7_1, bio_y_7_2 |
| AP Macro | `econ-quiz-container` | Macro 3 (3.1–3.9, AD-AS) | 10 | macro_y_3_1 … macro_y_3_10 |
| AP Micro | `econ-quiz-container` | Micro 1 (1.1, 1.3, 1.5) | 4 | micro_y_1_1 … micro_y_1_4 |
| AP Micro | `econ-quiz-container` | Micro 2 (2.5, 2.8, 2.9) | 4 | micro_y_2_1 … micro_y_2_4 |
| AP CS A | `csa-core-quiz-container` | Unit 3 (3.1, 3.3, 3.5, 3.8) | 4 | csa_y_3_1 … csa_y_3_4 |
| AP CS A | `csa-data-quiz-container` | 4.6 Text Files | 2 | csa_y_4_1, csa_y_4_2 |
| AP CS A | `csa-data-quiz-container` | 4.7 Wrapper Classes | 2 | csa_y_4_3, csa_y_4_4 |
| AP CS A | `csa-data-quiz-container` | Döngü/ArrayList izleme (4.9, 4.10) | 3 | csa_y_4_5 … csa_y_4_7 |
| AP English Lang. | `eng-reading-quiz-container` | Reading: 3 pasaj × 5 soru | 15 | eng_y_r_1 … eng_y_r_15 |
| **Toplam** | | | **66** | |

### Biology Unit 8 konu dağılımı

8.1: 3 · 8.2: 3 · 8.3: 3 · 8.4: 3 · 8.5: 3 · 8.6: 2 · 8.7: 3

- **Hesaplama soruları:** NPP, trofik verim, üstel ve lojistik büyüme, kişi başına r.
- **Veri ve tablo soruları:** survivorship, yoğunluk faktörleri, çeşitlilik ile direnç ilişkisi, tür eşitliği.

### Ekonomi: grafik tanımlı sorular

Görsel kullanılamadığı için grafikler metinle ya da `u-table` HTML tablolarıyla verildi:

- **macro_y_3_6:** AD/SRAS tarifesi ve LRAS = 900; çıktı açığı soruluyor.
- **macro_y_3_7, macro_y_3_8, macro_y_3_9:** AD-AS grafiğindeki kaymalar metinle tarif edildi.
- **micro_y_1_1:** PPC tablosu.
- **micro_y_1_3:** Toplam fayda tablosu.
- **micro_y_2_3:** Talep/arz tarifesi ve fiyat tavanı.
- **micro_y_2_4:** Doğrusal talep/arz ve dünya fiyatı ile tarife.

### English okuma setleri

Pasaj metinleri JSON'da üst düzey `pasajlar` alanında. Biçim `server/tohum/deneme-meta.json → pasajlar` ile aynı: `baslik`, `html` ve ek olarak `rozet`.

| Pasaj (`pasaj` değeri) | Tür | Kelime | Sorular | Hard |
|---|---|---|---|---|
| `eng-reading-quiz-container:Passage 4` | 19. yüzyıl üslubunda özgün deneme (okuma ve boş zaman) | ~390 | r_1–r_5 | r_4, r_5 |
| `eng-reading-quiz-container:Passage 5` | Kamuya açık toplantıda konuşma (kent ağaçlandırma) | ~320 | r_6–r_10 | r_9, r_10 |
| `eng-reading-quiz-container:Passage 6` | Kişisel deneme (onarım kültürü) | ~320 | r_11–r_15 | r_14, r_15 |

- **Beceri dağılımı:**
  - Retorik durum (unite "1"): 3
  - İddia ve kanıt ("3"): 4
  - Akıl yürütme ve organizasyon ("5"): 4
  - Üslup ("7"): 4
- **Başlıklar nötr tutuldu.** Denetimde eng_read_q12 için belirtilen "başlık cevabı ele veriyor" sorunu bu pasajlarda tekrarlanmadı.

## Öz denetim sonucu

1. **Yapısal kontrol (betikle):**
   - Her soruda 4 farklı şık var.
   - `dogru` A–D arasında.
   - `hata_aciklamalari` anahtarları tam olarak 3 yanlış şık.
   - ID'ler benzersiz ve mevcut bankayla çakışmıyor.
   - Mevcut 1131 soruyla ve kendi aralarında kök tekrarı yok.
   - Pasaj anahtarları mevcut `deneme-meta.json` ile çakışmıyor.
   - Sonuç: **hata yok**.
2. **Sayısal yeniden hesap:**
   - Biology: NPP 4,800 · verimler %8 / %12 / %6.25 · 60 · 0.06 · 112.5.
   - Ekonomi: vergi çarpanı 160 · ΔG 75 · ithalat 40 ve gelir $400 · MB = MC noktası 3 saat.
   - CS A: ArrayList izlemeleri betikle yeniden çalıştırıldı ([4, 7, 4, 9] ve [mo, st, cl]).
   - Hepsi anahtarla tutarlı.
3. **Bağımsız kör çözüm:**
   - Anahtarsız bir kopya, açıklamaları görmeyen ayrı bir çözücüye verildi; Java kodları satır satır izlendi.
   - Sonuç: **66/66 uyum**, tümü yüksek güvenle.
   - "Birden fazla savunulabilir cevap" ya da olgu hatası bildirimi yok.

## Yeni kutu ve aktarım notları

- **`bio-unit8-quiz-container` yeni bir kutu.** Bilgileri:
  - kutu_baslik "Unit 8 Ecology", dizi `BIO_UNIT8_QUESTIONS`, unite_no 8, sira 0–19.
  - `ap-biology.html` içinde bu id'ye sahip konteyner henüz yok. Aktarım öncesinde Unit 7 konteynerinin yanına eklenmeli.
  - JSON'daki `yeniKutular` alanında da kayıtlı.
- **Kalan sorular mevcut kutulara eklendi.** sira/numara değerleri kutudaki son sorudan devam ediyor:
  - Unit 7: sira 27–28
  - econ: 20–37
  - csa-core: 12–15
  - csa-data: 16–22
  - eng-reading: 17–31
- **Ekonomi soruları `econ-quiz-container` kutusuna konuldu.** Macro Unit 2–3 ve Micro Unit 1–2 için ayrı kutu yok. Kutu ileride bölünürse `unite` alanı ("Macro 3", "Micro 1", "Micro 2") ayırmaya yeter.
- **English pasajları ayrıca yayımlanmalı.** Aktarım sırasında `pasajlar` girdileri `deneme-meta.json → pasajlar` alanına eklenmeli. Ayrıca `ap-english.html` Unit A bölümüne üç yeni `lecture-card` olarak konmalı. Rozet sayısı da 17 → 32 olarak güncellenmeli.
- **CS A sorularının kapsamı:** Sorular 2025-26 CED konu numaralarını izliyor (4.6 Using Text Files, 4.7 Wrapper Classes). 4.6 soruları `Scanner(new File(...))`, `hasNextInt` ve `nextInt`/`nextLine` tuzağını kullanıyor.
