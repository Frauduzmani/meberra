# 1.14.0 — Ekonomi + English Language soru taslakları ve Almanya kaynak düzeltmesi

Dosya: `araclar/yeni-sorular2/ekonomi-english.json` (`{ surum, olusturma, aciklama, pasajlar, sorular }`, 1.11.0 dosyasıyla aynı biçim).
**85 soru**, hepsi `durum: "taslak"`, `ek.uretim: "1.14.0"`. Banka tohumuna **aktarılmadı**.

## A) AP Microeconomics / Macroeconomics — 55 soru

Amaç: tam uzunlukta Micro ve Macro denemesi (60 MCQ, `uniteOnek` "Micro " / "Macro ") CED ünite ağırlıklarıyla kurulabilsin.
Hepsi `deneme_kodlari: ["economics"]`, `kaynak: "AP-style original (CED Topic Micro x.y)"` / `"… Macro x.y"`. Şekil yok; veriler HTML `<table class='u-table'>`.
Para birimi `\$` olarak kaçışlı (MathJax).

Kutu eşlemesi (mevcut kutular; `kutu_baslik`, `unite_no`, `dizi` bankadan alındı):
Micro 1–2 → `econ-quiz-container`, Micro 3–4 → `micro34-quiz-container`, Micro 5–6 → `micro56-quiz-container`,
Macro 1 ve 4 → `macro14-quiz-container`, Macro 2–3 → `econ-quiz-container`, Macro 5–6 → `macro56-quiz-container`.

| Ünite | CED ağırlığı | 60'lık denemede gereken | Aktif (önce) | Yeni taslak | Onaydan sonra |
|---|---:|---:|---:|---:|---:|
| Micro 1 | 13.5% | 8 | 5 | 4 | 9 |
| Micro 2 | 22.5% | 14 | 9 | 6 | 15 |
| Micro 3 | 23.5% | 14 | 6 | **10** | 16 |
| Micro 4 | 17.5% | 10 | 7 | 5 | 12 |
| Micro 5 | 11.5% | 7 | 5 | 3 | 8 |
| Micro 6 | 10.5% | 6 | 7 | 2 | 9 |
| **Micro toplam** | | **60** | **39** | **30** | **69** |
| Macro 1 | 7.5% | 5 | 5 | 1 | 6 |
| Macro 2 | 14.5% | 9 | 4 | 6 | 10 |
| Macro 3 | 22% | 13 | 14 | 1 | 15 |
| Macro 4 | 20.5% | 12 | 7 | 7 | 14 |
| Macro 5 | 25% | 15 | 7 | **9** | 16 |
| Macro 6 | 11.5% | 7 | 6 | 1 | 7 |
| **Macro toplam** | | **60** | **43** | **25** | **68** |

Zorluk: Micro 9 easy / 14 medium / 7 hard; Macro 8 / 12 / 5 (toplam %31 / %47 / %22).
Doğru şık dağılımı: Micro A8 B8 C7 D7; Macro A7 B6 C6 D6.
Kimlikler: `micro_y2_<ünite>_<n>`, `macro_y2_<ünite>_<n>`. Not: `macro_y2_4_6` şıkları tablo satırlarına (A–D) bağlı olduğu için karıştırılmadı.

## B) AP English Language — 30 soru, 4 yeni pasaj

| Pasaj anahtarı | Tür | Kelime | Soru | Beceri kategorileri (unite) |
|---|---|---:|---:|---|
| `eng-reading-quiz-container:Passage 7` | Argümantatif deneme (kamusal banklar) | 348 | 8 | 1, 3 (×3), 5, 7 (×3) |
| `eng-reading-quiz-container:Passage 8` | 19. yüzyıl üslubunda konuşma (su tesisi açılışı) | 357 | 8 | 1 (×2), 3 (×2), 5, 7 (×3) |
| `eng-writing-quiz-container:Draft 7` | Öğrenci mektubu taslağı (gece feribotu) | 304 | 7 | 2 (×2), 4 (×3), 6 (×2) |
| `eng-writing-quiz-container:Draft 8` | Öğrenci makalesi taslağı (Svalbard tohum kasası) | 302 | 7 | 2, 4, 6 (×2), 8 (×3) |

- Pasajlar `pasajlar` alanında `{ baslik, rozet, html }` (1.11.0 ile aynı; `yeni-soru-ekle.js` yalnızca `baslik` + `html`'i `deneme-meta.json`'a yazar). Cümleler (1), (2)… numaralı.
- Yazma soruları retorik amaç için revizyon: tez, kanıt seçimi, karşı görüşe yanıt, geçiş, sonuç, okura uygun ton/açıklama, amaca uygun birleştirme. Yalnızca dilbilgisi sorusu yok.
- Konular mevcut pasajlarla çakışmaz (Draft 4 bisiklet yolu ve Draft 5 tamir kulübü bilinçli olarak tekrarlanmadı).
- Zorluk: 8 easy / 16 medium / 6 hard (%27 / %53 / %20). Doğru şık: okuma A4 B4 C4 D4; yazma A4 B4 C3 D3.
- Kimlikler: `eng_y2_r7_*`, `eng_y2_r8_*`, `eng_y2_w7_*`, `eng_y2_w8_*`. `deneme_kodlari: ["english-language"]`.
- Draft 8 olguları (2008 açılış, −18 °C, >1 milyon numune, 2015 ICARDA/Halep çekimi, Lübnan ve Fas) ve FAO'nun "20. yüzyılda bitki genetik çeşitliliğinin ~%75'i kayboldu" bilgisi yaygın kaynaklarla uyumludur.

**Arayüz notu:** `ap-english.html` pasaj kartları HTML'den okunuyor. Passage 7–8 ve Draft 7–8 için kartlar eklenmeden `deneme-bankasi-olustur.js` çalıştırılırsa bu pasajlar meta'dan düşer (bkz. `yeni-sorular/BIRLESTIRME.md`).

## Doğrulama

1. **Bağımsız yeniden çözüm:** 85 sorunun yalnızca kökü ve şıkları (anahtar ve açıklama olmadan) ayrı bir ajana verildi; bütün hesaplar baştan yapıldı.
   **85/85 anahtarla aynı**, hepsi yüksek güvenle. İki sorunun birden doğru olduğu, hiç doğru şıkkın olmadığı ya da hesabın tutarsız olduğu bir soru bulunmadı.
   İnceleme notları: (a) İngilizce anahtarlar B'de yığılmıştı, şıklar deterministik olarak karıştırılarak dengelendi (açıklamalardaki harf göndermeleri ve `hata_aciklamalari` yeniden eşlendi);
   (b) `micro_y2_3_10`: P = \$8'de firma kayıtsız (AP'de standart kabul); (c) `macro_y2_5_9`: sermaye birikimi Solow'da düzeyi artırır, AP'deki standart cevap korunur.
   Bilinen zayıflık: bazı sorularda doğru şık en uzun ve en ayrıntılı şık. Onay sırasında gözden geçirilebilir.
2. **Şema / tekrar:** `yeni-soru-ekle.js`'in doğrulaması bu dosya için (`URETIM = "1.14.0"`, kuru çalıştırma, karalama kopyasıyla) çalıştırıldı:
   **0 hata.** Şema, kutu tutarlılığı, tek doğru şık, `hata_aciklamalari` = yanlış şıklar, LaTeX/`\$`, pasaj anahtarları ve aktif bankayla kök/kök+şık tekrarı kontrol edildi. Ayrıca 85 eklenecek, tohum sürümü 4 → 5 olur.
   `sira` / `numara` değerleri her kutudaki mevcut azami değerin ardından verildi; birleştirme aracı bunları yeniden atar.

## C) Almanya kaynak düzeltmesi: "anabin TUR-BV05" kaldırıldı

Doğrulanamayan "TUR-BV05" kodu (ve kaynak adlarındaki "TUR-BV05/07", "TUR-BV01–15") kaldırıldı. Olgusal ifade ("YKS'de bir lisans programına yerleşme gerekir") korundu ve
**uni-assist Türkiye ülke sayfasına** atfedildi: https://www.uni-assist.de/tools/laenderhinweise/laenderdetails/country/tr/ — uni-assist, Türk lise diploması için
Lise Diploması ile birlikte, adayın bir lisans programına yerleştirildiğini (üniversite, fakülte, puan türü) gösteren YKS sonucunu ister. anabin (https://anabin.kmk.org) koddan bağımsız, genel kaynak olarak kaldı.

Değişen dosyalar:
- `almanya-muhendislik.html` — 3 yer (uni-assist bağlantısı + anabin genel bağlantı)
- `assets/js/app.js` — KMK/AP uyarı metni
- `data/rehber/bilgi-merkezi.js` — Almanya kabul yolu özeti
- `data/mevzuat/ulkeler.js` — Almanya `ozet` ve uni-assist belge maddesi ("anabin'deki tek resmi yol" → "tek resmi yol")
- `data/mevzuat/ulke-rotalari.js` — yeni sabit `UA_TR_DE`; `temelKural.baslik` "(uni-assist)", `temelKural.kaynak` → `UA_TR_DE`; 4 detay metninde kod kaldırıldı
- `data/kocluk/eposta-sablonlari.js` — üniversiteye/uni-assist'e gidecek İngilizce e-posta şablonları ve amaç metni ("case group TUR-BV05" → uni-assist ülke sayfası)
- `data/mevzuat/kaynak/lisans-de.json` — 18 kaynak adı → "anabin (KMK) — Türkiye Lise Diploması"
- `data/mevzuat/ulke/de.js` — `node araclar/ulke-veri-olustur.js` ile yeniden üretildi (0 sorun; başka ülke dosyası değişmedi)
- `araclar/testler/rota-birim-test.js` — sahte veri başlığı "(TUR-BV05)" → "(uni-assist)"

Bilerek dokunulmayanlar (kapsam dışı / tarihsel kayıt): `.agents/mevzuat/**` karar notları ve doğrulama kopyaları, `proje.md`, `sunum/**` (sunum paketi ve arşiv; `sunum-olustur.js` ile yeniden üretilmeli),
`_devre-disi/**`. Not: "USA-BV07" gibi diğer anabin vaka kodlarına dokunulmadı.

Testler: `node araclar/testler/birim-hepsi.js` → **25/25 birim testi geçti**; `npm test` → C değişikliklerinden hemen sonra **126/126 geçti**. Son çalıştırmada (başka ajanların eş zamanlı değişiklikleriyle 183 test) 182/183 geçti;
kalan `server/test/ozellikler.test.js:517` "Senkron: seri, tekrar ve oyun anahtarları birleşir" (fetch ECONNRESET) bu işin dosyalarıyla ilgisiz.
