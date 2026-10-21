# Yeni soruların soru bankasına birleştirilmesi (v1.11.0)

_Araç: `node araclar/yeni-soru-ekle.js` (idempotent; `--kuru` önizleme). Tarih: 2026-10-21._

## Özet

- **229 yeni soru** `server/tohum/soru-bankasi.json` dosyasına **`durum: "taslak"`** ile eklendi (hepsinde `ek.uretim = "1.11.0"`).
- Tohum sürümü **2 → 3**. Mevcut veritabanları açılışta (`tohumEsitle`, v1.10.0 yolu) yeni soruları **taslak olarak** alır; mevcut sorulara dokunulmaz.
- 3 yeni English pasajı (`eng-reading-quiz-container:Passage 4/5/6`) `server/tohum/deneme-meta.json` → `pasajlar` alanına eklendi (`{ baslik, html }` biçimi).
- Doğrulama: 0 hata (şema, benzersiz kimlik, tek doğru şık, farklı şıklar, `hata_aciklamalari` = yanlış şıklar, dengeli LaTeX, kaçışsız para birimi `$` yok,
  normalleştirilmiş kök tekrarı yok). `node araclar/pm-denetim.js`: **0 sorun**, taslaklar ayrı bölümde sayılır.
- Düzeltme: Ekonomi taslaklarında para birimi olarak kullanılan çıplak `$` (MathJax bunu matematik ayırıcısı sayıyordu) `\$` yapıldı
  (`biology-english-electives.json`, 18 Micro/Macro sorusu; `.md` kopyası güncellenmedi).
- `sira` / `numara`: aynı kutudaki mevcut soruların ardından verildi (yeni kutularda 0/1'den başlar).
- Zorluk dağılımı: easy 64 · medium 114 · hard 51.

## Ders / ünite başına sayılar

| Ders sayfası | Kutu (soru istasyonu) | Ünite | Taslak |
|---|---|---|---:|
| AP Calculus | `calc-unit1-quiz-container` | Unit 1 | 10 |
| | `calc-unit2-quiz-container` | Unit 2 | 12 |
| | `calc-unit3-quiz-container` | Unit 3 | 8 |
| | `calc-unit4-quiz-container` | Unit 4 | 11 |
| | `calc-unit5-quiz-container` | Unit 5 | 14 |
| | `calc-unit6-quiz-container` | Unit 6 | 4 |
| | `calc-unit8-quiz-container` | Unit 8 | 4 |
| **AP Calculus toplam** | | | **63** |
| AP Physics 1 | **`phys-unit8-quiz-container` (YENİ)** | Unit 8 Fluids | 20 |
| | `phys-unit1-quiz-container` | Unit 1 | 4 |
| | `phys-unit2-quiz-container` | Unit 2 | 10 |
| | `phys-unit3-wep-quiz-container` | Unit 3 | 2 |
| | `phys-unit4-momentum-quiz-container` | Unit 4 | 2 |
| | `phys-unit5-rotation-quiz-container` | Unit 5 | 2 |
| **AP Physics toplam** | | | **40** |
| CEnT-S | `cents-math-quiz-container` | Section 2 Mathematics | 8 |
| | `cents-physics-quiz-container` | Section 6 Physics | 7 |
| **CEnT-S toplam** | | | **15** |
| AP Chemistry | `chem-unit1` … `chem-unit9` | Unit 1/2/3/4/5/6/7/8/9 | 4/4/25/5/1/1/2/2/1 |
| **AP Chemistry toplam** | | | **45** |
| AP Biology | **`bio-unit8-quiz-container` (YENİ)** | Unit 8 Ecology | 20 |
| | `bio-unit7-quiz-container` | Unit 7 | 2 |
| **AP Biology toplam** | | | **22** |
| AP Electives | `econ-quiz-container` | Macro 3 / Micro 1 / Micro 2 | 10 / 4 / 4 |
| | `csa-core-quiz-container` | CS A Unit 3 | 4 |
| | `csa-data-quiz-container` | CS A Unit 4 | 7 |
| **AP Electives toplam** | | | **29** |
| AP English Language | `eng-reading-quiz-container` (Passage 4, 5, 6) | Skill 1 / 3 / 5 / 7 | 3 / 4 / 4 / 4 |
| **AP English toplam** | | | **15** |
| **GENEL TOPLAM** | | | **229** |

## Sunucu (bu sürümde yapıldı)

- Taslak öğrenciye hiçbir uçta gitmez: ünite listeleri ve sayıları, `cevap`, `getir`, deneme katalog / kurulum / yanlışlar, katalog pasajları,
  eski deneme incelemesi, seviye bankası / teslim / çözümler, vitrin demo. Yalnız taslak sorusu olan kutu öğrenci listesinde hiç görünmez.
- Yönetici uçları (ayrıntı: `server/API.md` › Onay kuyruğu):
  - `GET /api/admin/soru-bankasi/onay-kuyrugu?sayfa&kutu&unite&uretim&sayfaNo&sayfaBoyu` (sayılar + liste + pasaj önizlemesi)
  - `POST /api/admin/soru-bankasi/onayla` `{ ids }` → aktif (yeni sürüm, geçmiş, denetim)
  - `POST /api/admin/soru-bankasi/reddet` `{ ids, neden }` → arsiv (neden `ek.red` ve geçmiş notunda)
- Ücretsiz kural (`assets/js/ucretsiz-kural.js`, değiştirilmedi): `phys-unit8-quiz-container` ve `bio-unit8-quiz-container`
  `AP_UCRETSIZ_KUTULAR` listesinde yok → **Premium** (ücretsiz planda `kilitli: true`, içerik 402). Sayfa kuralı (ilk 2 ünite açık) ile tutarlı;
  sonraki ünite olduğu için listeye eklenmesi GEREKMEZ.
- Testler: `server/test/onay-kuyrugu.test.js`.

## Arayüzün yapması gerekenler

### 1) Yönetici paneli: "Onay kuyruğu" görünümü (`admin.html` + `assets/js/admin-soru-bankasi.js`)

- Soru bankası sekmesinde yeni alt görünüm **Onay kuyruğu**; rozet sayısı = `sayilar.toplam` (ilk yüklemede 229).
- Filtreler: ders sayfası (`sayilar.sayfa`), istasyon (`sayilar.kutu`; `yeniKutu: true` olanlara "Yeni istasyon" etiketi), ünite, üretim (`sayilar.uretim`).
- Liste satırı: kimlik, ders · istasyon · konu, zorluk, kaynak; satır açılınca **önizleme**: kök + şıklar (doğru şık işaretli), adım adım açıklama,
  konu hatırlatması, yanlış şıkların hata etiketi/açıklaması, `ek` (kavram, ipucu, sık hata, hesap makinesi), pasajlı sorularda
  `pasajlar[soru.pasaj].html`. Matematik için MathJax `typeset` çağrılmalı (metinler `$…$`, `\(…\)`, `\$` içerir).
- Toplu işlem: onay kutuları + "Sayfadakileri seç" + **Onayla** (`POST …/onayla`) ve **Reddet** (neden zorunlu; `POST …/reddet`).
  Yanıttaki `atlanan` listesi kullanıcıya gösterilmeli (ör. "başka biri onaylamış"). İşlem sonrası liste ve sayılar yenilenmeli.
- Tek soruyu düzeltmek için mevcut düzenleyiciye (`PUT …/soru/:id`) bağlantı; düzenlenen soru taslak kalır, sonra kuyruktan onaylanır.

### 2) Ders sayfalarına yeni soru istasyonları

**AP Physics — `ap-physics.html`**
- Konum: `#phys-unit7-oscillations-quiz-section` bölümünden **hemen sonra** (sayfadaki son ünite; `</div>` + footer'dan önce).
- Bölüm: `<section class="interactive-panel" id="phys-unit8-fluids-quiz-section">`, başlık **"Unit 8 Fluids: İnteraktif Soru İstasyonu"**,
  aynı `panel-sub icerik-not` metni, kutu: `<div class="u-mt-6" id="phys-unit8-quiz-container"></div>`.
- Kutu başlığı (sunucu): `Unit 8 Fluids`, `unite_no` 9 (fizikte kutu sırası numarası; CED Unit 8). Ders anlatımı istenirse
  `id="phys-unit8-fluids-lecture"` bölümü soru bölümünden önce.

**AP Biology — `ap-biology.html`**
- Konum: `#bio-unit7-quiz-section` bölümünden **hemen sonra** (son ünite).
- Bölüm: `<section class="interactive-panel" id="bio-unit8-quiz-section">`, etiket `UNIT 8 SORULAR`, başlık
  `<h2 class="panel-title" id="bio-unit8-soru-baslik">`**"Unit 8 Ecology: İnteraktif Soru İstasyonu"**, kutu:
  `<div class="u-mt-6" id="bio-unit8-quiz-container"></div>`. İsteğe bağlı anlatım bölümü: `id="bio-unit8-lecture-section"`
  (`bio-unit8-baslik`: "AP Biology — Unit 8: Ecology").

**Önemli:** Bu iki kutu, sorular **onaylanana dek** öğrenci API'sinde yoktur (`GET /api/sorular-bankasi/<sayfa>` listesinde görünmez,
kutu isteği 404). Arayüz kutuyu ya onayla birlikte yayımlamalı ya da kutu listede yoksa bölümü gizlemeli / "Yakında" göstermeli.
`pm-denetim` bu durumu sorun değil **uyarı** olarak yazar.

**AP English — `ap-english.html`** (ders sayfasında pasaj metni HTML'den okunur)
- `#eng-reading-quiz-container` öncesindeki pasaj kartlarına (`lecture-card` › `theory-title` + `theory-body`), **Passage 3'ten sonra**
  üç kart eklenmeli; `theory-body` içeriği = `deneme-meta.json` → `pasajlar["eng-reading-quiz-container:Passage N"].html`:
  - Passage 4 — From an essay on reading and leisure (original, written in a nineteenth-century style) · rozet `Essay • Original • 19th-century style`
  - Passage 5 — From remarks delivered at a public meeting · rozet `Speech • Original`
  - Passage 6 — From a personal essay · rozet `Essay • Original`
- Not: `node araclar/deneme-bankasi-olustur.js` pasajları HTML'den yeniden üretir; kartlar eklenmeden çalıştırılırsa Passage 4–6 meta'dan düşer.

### 3) Diğer

- `araclar/soru-aktar.js` artık kaynak HTML'den tohum üretmek için kullanılmamalı (taslakları bilmez); tohum değişiklikleri
  `icerik-uygula.js` / `yeni-soru-ekle.js` ile yapılır.
- Sürüm notu (CHANGELOG / package.json) bu adımda değiştirilmedi.
