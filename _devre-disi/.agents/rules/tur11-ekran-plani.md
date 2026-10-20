# Tur 11 — Ekran Düzeni Planı ve Veri Sözleşmesi Önerisi (Ajan 11, 15 Ekim 2026)

> Durum: **ÖNERİ — PM onayı bekliyor.** Bu aşamada kod yazılmadı. Uygulama, mevzuat verisi (`.agents/mevzuat/dogrulama/`) gelince ayrı görevle yapılacak.
> Dayanak: kullanıcı kararları 15 Ekim 2026 (aşağıda **Y1–Y7**). K4 (açık şartlar) sürüyor. `tur5-platform-spec.md` §2 depolama anahtarları ve §5.2 sınav şeması değişmez.
> Kural Y5 gereği bu plan yama değildir: bilgi mimarisi 3 model × 15 ülke × 2 dil × 2 düzey için baştan kuruldu.

**Kullanıcı kararları (15 Ekim 2026):**
- **Y1 Öğrenci modeli:** lise öğrencisi / lise mezunu / üniversite mezunu (YL).
- **Y2 Ülke:** 15 ülke; DE/IT kısıtı kalkar.
- **Y3 Üniversite listesi:** ülke başına QS ilk 20.
- **Y4 Eğitim dili:** İngilizce ya da yerel dil.
- **Y5 Plan kuralı:** her eklemede ekran düzeni baştan düşünülür.
- **Y6 Erişim:** K4 sürer.
- **Y7 Rota:** DE/IT dışında ve YL'de genel yol haritası kullanılır.

---

## 0. PM'in onaylayacağı kararlar (özet)

| No | Karar önerisi | Gerekçe |
| :--- | :--- | :--- |
| **D1** | **Yeni sayfa yok.** `sartlar.html`, 4 adımlı seçicili tek "Ülke şartları" sayfası olur. Lisans ve YL aynı sayfada; düzeyi model belirler. | Tek motor, tek madde bileşeni ve paylaşılabilir tek URL. Ayrı bir YL sayfası, seçiciyi ve testleri ikiye katlar. |
| **D2** | `mezun.html` ince bir **yönlendirme sayfası** olur: `sartlar.html?model=lise-mezun[&ulke=hu]`. Menüden kalkar ama dosya ve K4 listesi kalır. | Ülke kısıtı kalkınca "Mezun Menüsü"nün ayrı ülke listesi anlamını yitirir. Eski yer imleri kırılmaz. |
| **D3** | `universiteler.html` tek sayfa kalır, iki katmanı olur: (a) **QS ülke içi ilk 20** (15 ülke, düzey/dil filtresi), (b) DE/IT için mevcut **rotaya uygun seçilmiş üniversiteler** (`ulkeler.js`). | `ulkeler.js` yazışmalar ve rota tarafından kullanılıyor; silinmez. İlk 20 ile örtüşen kayıtlar `rotaUniId` alanıyla bağlanır. |
| **D4** | URL dili `dil=en\|yerel` olur. İsviçre, Belçika ve Finlandiya'da yerel dil birden çoksa sayfa etiketi "Yerel dil (Almanca / Fransızca)" olur. Program bazındaki dil üniversite kartında gösterilir. İrlanda'da dil adımı atlanır. | Mevzuat verisi `en{}` / `yerel{}` olarak geliyor; dil başına ayrı blok istemek veri yükünü üçe katlar. |
| **D5** | Profilde `ogrenciModeli` ana alan olur. `sinif` geriye uyum için türetilmiş alan olarak kalır: lise → 9–12, lise mezunu → `"mezun"`, üniversite mezunu → `"lisans-mezun"`. Eski kayıtlar okunurken taşınır; hiçbir alan silinmez. | `rota.js`, `eposta.js`, `index.html` ve `rota.html` bugün `sinif === "mezun"` kontrol ediyor. Bu kodlar kırılmaz. |
| **D6** | Ülke verisi ülke başına **tek dosya** olur: `data/mevzuat/ulke/<cc>.js`. Dosyada lisans, YL ve üniversiteler birlikte durur. Ayrıca küçük bir dizin dosyası `ulke-dizini.js` her sayfada yüklenir. Ülke dosyası seçilince yüklenir. | `file://` altında JSON okunamaz; JS sarmalayıcı gerekir. Tembel yükleme, 15 ülke verisinin her sayfada yüklenmesini önler. |
| **D7** | DE/IT dışındaki ülkelerde ve tüm YL'lerde **Rotam = "Genel yol haritası"** gösterilir. Adımlar ülke dosyasındaki zamanlı maddelerden ve ortak bir şablondan gelir. Takvim tarihi "tahmini" rozetiyle hesaplanır; "yapıldı" işareti aynı `apmeberra:rota:v1` anahtarında tutulur. | Rotam bugün yalnızca DE/IT lisans için var. Bu yol, her ülkeye ayrı bir `ulke-rotalari` yazmayı gerektirmez. |
| **D8** | Kaynak JSON'lar PM onayından sonra `data/mevzuat/kaynak/` altına konur. `araclar/ulke-veri-olustur.js` bunları doğrular ve `data/mevzuat/ulke/*.js` dosyalarını üretir; elle düzenleme yapılmaz. | `deneme-bankasi-olustur` ile aynı model: tek kaynak + üretilen çıktı + denetim. |

---

## 1. Bilgi mimarisi

### 1.1 Sayfa listesi

| Sayfa | Erişim | Karar | Yeni rolü |
| :--- | :--- | :--- | :--- |
| `sartlar.html` | Açık | **Yeniden kurulur** | Seçici: model → sınıf → ülke → dil. Ülke seçilmemişken 15 ülkelik karşılaştırma ızgarası; seçilince ülke × dil × düzey şartları, burslar, dil sınavları, ilk 20 önizlemesi ve genel yol haritası. |
| `mezun.html` | Açık | **Yönlendirme** (D2) | `location.replace` ile yönlendirir; `noscript` bağlantısı da vardır. Eski `?ulke=hu\|pl` korunur. BME duyurusu ortak duyuru şeridine taşınır. |
| `universiteler.html` | Açık | **Yeniden kurulur** (D3) | Misafire "Üniversiteler", oturumlu kullanıcıya "Üniversitelerim" adıyla açılır. Ülke sekmeleri, düzey ve dil filtresi, ilk 20 listesi, DE/IT seçilmiş listesi. |
| `sinavlar.html` | Açık | **Filtre eklenir** | Ülke, dil ve düzey çipleri. Yerel dil sınavları (TestDaF, CILS, DELF, DELE, NT2…) ve GRE/GMAT eklenir. Veriyi Ajan 2 ekler, şema §5.2 değişmez. |
| `almanya-muhendislik.html`, `italya-muhendislik.html` | Açık | Değişmez | Ülke sayfasında "Ayrıntılı rehber" bağlantısı olur. |
| `istanbul-sinav-rehberi.html`, `bilgi-merkezi.html`, `ajanlar.html` | Açık | Değişmez | — |
| `giris.html` | Açık | Küçük değişiklik | `model`, `sinif`, `ulke` ve `dil` seçimini kayda taşır. |
| `profil.html` | Kilitli | **Sihirbaz yeniden kurulur** | 4 adım: model, durum ayrıntısı, ülkeler, dil. |
| `index.html` (Panelim) | Kilitli | Modele göre bölümler değişir | Ayrıntı §6.1. |
| `rota.html` (Rotam) | Kilitli | Tarihli rota (DE/IT lisans) ve genel yol haritası (diğerleri) | Ayrıntı §6.2. |
| `yazismalar.html` | Kilitli | Ülke filtresi 15 ülkeye çıkar | Şablonu olmayan ülkede "Bu ülke için şablon yok; genel şablonu kullan" mesajı. |
| `ap-*.html`, `deneme`, `seviye-testi`, `ilerleme`, `sinav-cents` | Kilitli | Değişmez | Üniversite mezunu menüsünde gizlenir; adresle açılabilir. |

**Yeni sayfa açılmaz** (D1). YL ayrı sayfa olmaz, çünkü:
- seçici, madde bileşeni, kesinlik rozetleri ve ilk 20 listesi aynıdır;
- yalnızca bölüm seti farklıdır: YL'de `sinifNotlari` ve `apEtkisi` yok, `ornekProgramlar` ve `yl-genel` var.

### 1.2 Menü

**Misafir menüsü (`APMEBERRA_NAV_ACIK`):**
```
[AP MEBERRA]  Ülke şartları · Üniversiteler · Sınavlar · Rehberler ▾        [Giriş yap] [Kayıt ol] [◐]
                                                         ├ Almanya rehberi
                                                         ├ İtalya rehberi
                                                         ├ İstanbul sınav rehberi (AP)
                                                         ├ Bilgi Merkezi
                                                         └ Ajan Konseyi
```
"Mezunlar" bağlantısı kalkar; lise mezunu artık seçicide bir model.

**Oturumlu menü (`APMEBERRA_NAV`), modele göre süzülür.** Her öğeye `modeller: [...]` alanı eklenir; alan yoksa öğe herkese gösterilir.

| Öğe | lise | lise-mezun | uni-mezun |
| :--- | :---: | :---: | :---: |
| Panelim · Rotam · Üniversitelerim · Yazışmalarım | ✓ | ✓ | ✓ |
| Sınavlar ▾ → Tüm sınavlar | ✓ | ✓ | ✓ |
| Sınavlar ▾ → AP dersleri, CEnT-S | ✓ | ✓ | — |
| Denemeler · İlerleme | ✓ | ✓ | — |
| Rehberler ▾ → Ülke şartları, rehberler, Bilgi Merkezi | ✓ | ✓ | ✓ |
| Rehberler ▾ → Seviye testi | ✓ | ✓ | — |

### 1.3 Açık / kilitli durumu
`APMEBERRA_ACIK_SAYFALAR` değişmez (10 sayfa; `mezun` yönlendirme olarak kalır). Yeni veri dosyaları (`data/mevzuat/ulke/*.js`, `ulke-dizini.js`, `yl-genel.js`, `duyurular.js`) herkese açık veridir. Kişisel koçluk sınırı K4'teki gibidir.

---

## 2. Seçici akışı ve URL

### 2.1 Akış
```
[1 Durumun]            [2 Sınıfın]            [3 Ülke]                 [4 Eğitim dili]
 ○ Lise öğrencisi  ──►  9 · 10 · 11 · 12  ──►  15 ülke ızgarası  ──►  ○ İngilizce   ○ Yerel dil (Felemenkçe)
 ○ Lise mezunu     ──────────────────────►   (lisans durumları)      (İrlanda: adım atlanır)
 ○ Üniversite mez. ──────────────────────►   (YL durumları)
```
- Adımlar hep görünür, açılır-kapanır değildir. Seçilmemiş adım soluk görünür ama erişilebilir kalır; seçim sırası serbesttir.
- Model değişince geçersiz alanlar düşer: üniversite mezununda `sinif` silinir; ülke ve dil korunur.
- Ülke kartında seçili düzeyin İngilizce program durumu rozetle gösterilir (§3.4). Böylece ızgara aynı zamanda karşılaştırma tablosu olur.
- Seçim tamamlanınca seçici tek satırlık **özet çubuğuna** küçülür: `Lise · 11. sınıf · Hollanda · İngilizce [Değiştir]`. Çubuk masaüstünde yapışkandır, 360 px'te yapışkan değildir.

### 2.2 URL parametreleri (sıra sabit: model, sınıf, ülke, dil)
| Parametre | Değerler | Varsayılan |
| :--- | :--- | :--- |
| `model` | `lise` · `lise-mezun` · `uni-mezun` | Yok → giriş ekranı (seçici açık) |
| `sinif` | `9` · `10` · `11` · `12` (yalnızca `lise`) | Yok → 2. adım bekler |
| `ulke` | `de it at ch nl be fr es se fi dk ie hu pl cz` | Yok → 15 ülke ızgarası |
| `dil` | `en` · `yerel` | `en`. İrlanda'da her zaman `en`. Seçim yoksa da `en` gösterilir ve URL'ye yazılır. |

Örnekler:
- `sartlar.html?model=lise&sinif=11&ulke=nl&dil=en`
- `sartlar.html?model=uni-mezun&ulke=se&dil=yerel`

Oturumlu kullanıcıda seçim yoksa "Kendi profilime göre göster" düğmesi görünür (bugünkü davranış). Seçim kendiliğinden doldurulmaz.

### 2.3 Geriye uyum (`secimOku` normalleştirir, `replaceState` ile kanonik URL'ye yazar)
| Gelen adres | Okunan seçim |
| :--- | :--- |
| `?ulke=de&sinif=11` | `model=lise&sinif=11&ulke=de&dil=en` |
| `?sinif=mezun` | `model=lise-mezun` (sınıf düşer) |
| `?model=uni-mezun&sinif=11` | Sınıf yok sayılır |
| `?model=lise&sinif=mezun` | `model=lise-mezun` (sınıf bilgisi kazanır) |
| `?ulke=ie&dil=yerel` | `dil=en` + bilgi notu "İrlanda'da yerel öğretim dili İngilizce" |
| `mezun.html?ulke=pl` | `sartlar.html?model=lise-mezun&ulke=pl&dil=en` |
| `universiteler.html?ulke=de` | `duzey` profilden ya da `lisans`, `dil=hepsi` |
| Bilinmeyen değer | `null` (bugünkü davranış) |

- `apSecimSorgusu` (app.js) dört parametreyi de taşıyacak şekilde genişler; desen 15 ülkeyi kapsar.
- `#sr-...` ve `#m-<id>` çapaları korunur.

### 2.4 Düzey
`duzey = model === "uni-mezun" ? "yl" : "lisans"`. URL'de ayrı parametre olarak yer almaz; yalnızca `universiteler.html` kendi `duzey` filtresini taşır (`lisans` | `yl`).

---

## 3. Tel çerçeveler

Ortak kurallar:
- `max-width` 1200 px; ızgara `repeat(auto-fill, minmax(…))`.
- 360 px'te 16 px kenar boşluğu, tek sütun, yatay kaydırma yok.
- Uzun ülke ve üniversite adlarında `overflow-wrap:anywhere`.
- Renkler yalnızca token'lardan gelir.
- Ülke tanıtıcısı **2 harfli kod rozetidir** (`NL`). Bayrak emojisi kullanılmaz; Windows'ta harf olarak görünür.

### 3.1 `sartlar.html` — giriş (model seçilmemiş)

1280 px:
```
┌ navbar ─────────────────────────────────────────────────────────────────────────────┐
│ ÜLKE ŞARTLARI · GİRİŞ GEREKMEZ                                                      │
│ Avrupa'da lisans ve yüksek lisans: durumuna göre şartlar                    (h1)    │
│ Durumunu, ülkeni ve eğitim dilini seç; resmi kaynaklı şartları gör.        (lead)   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ 1 Durumun                                                                           │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ ○ Lise öğrencisi     │ │ ○ Lise mezunu        │ │ ○ Üniversite mezunu  │          │
│ │ 9–12. sınıf · lisans │ │ Lisansa başvuru      │ │ Yüksek lisans        │          │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘          │
│ 2 Sınıfın   (soluk)  [9] [10] [11] [12]                                             │
│ 3 Ülke      (soluk)  … 15 ülke ızgarası (aşağıda) …                                 │
│ 4 Eğitim dili (soluk) (•İngilizce) ( Yerel dil )                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Ne göreceksin: Ne gerekiyor · Bu yıl ne yapmalısın · Tarihler · Sık hatalar ·       │
│ Burslar · Dil sınavları · İlk 20 üniversite · Genel yol haritası                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

360 px: model kartları üst üste dizilir, kart başına 1 satır. Sınıf düğmeleri 4 sütunluk ızgara (her biri ≥ 44 px). Dil düğmeleri 2 sütun.

### 3.2 `sartlar.html` — ülke ızgarası (model seçili, ülke yok)

1280 px (4 sütun; `minmax(260px,1fr)`):
```
│ 3 Ülke   [ ] Yalnızca İngilizce lisans programı olanlar          15 ülke · 11 gösteriliyor │
│ ── Tarihli rotası olanlar ──────────────────────────────────────────────────────────── │
│ ┌ DE Almanya ──────────────┐ ┌ IT İtalya ──────────────┐                               │
│ │ EN lisans: Kısıtlı  ◔    │ │ EN lisans: Geniş   ●    │                               │
│ │ Yerel: Almanca           │ │ Yerel: İtalyanca        │                               │
│ │ Tarihli rota ✓           │ │ Tarihli rota ✓          │                               │
│ └──────────────────────────┘ └─────────────────────────┘                               │
│ ── Diğer ülkeler (A–Z, tr) ─────────────────────────────────────────────────────────── │
│ ┌ AT Avusturya ────────────┐ ┌ BE Belçika ─────────────┐ ┌ CZ Çekya ─┐ ┌ DK Danimarka ┐ │
│ │ EN lisans: Kısıtlı       │ │ EN lisans: Teyit gerekir│ │ …         │ │ …            │ │
│ │ [Teyit gerekir]          │ │ Yerel: Felemenkçe/Frans.│ │           │ │              │ │
│ └──────────────────────────┘ └─────────────────────────┘ └───────────┘ └──────────────┘ │
│ … FI FR NL IE ES SE CH HU PL                                                           │
```
- Kart `<a>` öğesidir ve `?…&ulke=xx` adresine gider; JS varsa sayfa yerinde güncellenir.
- Durum rozeti renk + simge + metin üçlüsüyle verilir (yalnızca renge dayanmaz).
- Üniversite mezunu modelinde rozet "EN YL" olur.

360 px: tek sütun, kompakt kart (`DE Almanya · EN lisans: Kısıtlı ›`, 56 px yükseklik); filtre onay kutusu üstte.

### 3.3 `sartlar.html` — sonuç (model + ülke + dil)

1280 px:
```
│ Lise · 11. sınıf · Hollanda · İngilizce                             [Değiştir ▾] (yapışkan) │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ h1  Hollanda'da İngilizce lisans: 11. sınıf öğrencisi için şartlar                          │
│ ┌ Özet (surface) ─────────────────────────────┐ ┌ Kişisel koçluk (CTA) ──────────────────┐ │
│ │ NL Hollanda  [Teyit gerekir]                 │ │ Hesabınla tarihli adımlar, ders,       │ │
│ │ ozet (2–3 cümle)                             │ │ deneme… [Kişisel koçluğu başlat →]     │ │
│ │ Mezuniyet: Haziran 2028 · EN lisans: Geniş   │ │ [Hesabım var, giriş yap]               │ │
│ │ Hazır bölüm 6/8 · Son kontrol 15 Eki 2026    │ └────────────────────────────────────────┘ │
│ │ [Bağlantıyı kopyala] [Hollanda üniversiteleri]│                                           │
│ └──────────────────────────────────────────────┘                                           │
│ ⚠ Dil durumu bandı (yalnızca "kısıtlı/yok/teyit" ise) — §3.4                              │
│ 🔔 Duyuru şeridi (duyurular.js; model/ülke/dil eşleşen, bitiş tarihine kadar)              │
│ [Ne gerekiyor (7)] [Bu yıl (3)] [Tarihler (4)] [Sık hatalar (5)] [AP'nin etkisi] [Burslar] │
│ [Dil sınavları] [İlk 20] [Yol haritası]                         (jump-nav, kaydırılabilir) │
│ ┌ Ne gerekiyor ───────────────┐ ┌ Bu yıl ne yapmalısın ───────┐   (sr-grid, 2 sütun)        │
│ │ ortak + dil.gerekenler       │ │ sinifNotlari[11]            │                            │
│ └──────────────────────────────┘ └─────────────────────────────┘                            │
│ ┌ Kaçırılmaması gereken tarihler┐ ┌ Sık yapılan hatalar ───────┐                             │
│ └──────────────────────────────┘ └─────────────────────────────┘                            │
│ ┌ AP'nin etkisi (yalnızca lisans) ┐ ┌ Burslar ──────────────────┐                            │
│ └────────────────────────────────┘ └───────────────────────────┘                            │
│ Dil sınavları  [IELTS Academic] [TOEFL iBT] [NT2 II → yerelde]   (sinavlar.js süzgeci)      │
│ İlk 20 üniversite (QS 2026, ülke içi) — İngilizce lisans olanlar 9/20                       │
│ ┌ 1 TU Delft · Delft · QS 47 · EN ● YEREL ● ┐ ┌ 2 … ┐ ┌ 3 … ┐   (ilk 6 kart)               │
│ [20 üniversitenin tümünü gör →] (universiteler.html?ulke=nl&duzey=lisans&dil=en)           │
│ Genel yol haritası  (DE/IT: tarihli rota verisi; diğer: §6.2 genel yol)                     │
│ ⓘ Resmi kaynak esastır; son kararı üniversite verir.                                        │
```

**Bölüm sırası.** Bölümler şu sırayla gelir; bir bölümün verisi yoksa jump-nav'da da gösterilmez:
1. **Lisans (`lise`, `lise-mezun`):** Ne gerekiyor → Bu yıl → Tarihler → Hatalar → AP'nin etkisi → Burslar → Dil sınavları → İlk 20 → Yol haritası.
2. **YL (`uni-mezun`):**
   - Ne gerekiyor (`ortak` + `dil.gerekenler`)
   - Tarihler
   - Hatalar
   - Örnek programlar (`ornekProgramlar`, dile göre süzülür)
   - Burslar (ülke) + **Türkiye ve AB bursları** (`yl-genel`)
   - Dil sınavları + GRE/GMAT
   - **Tüm ülkeler için ortak YL notları** (`yl-genel`: belgeler, askerlik, takvim; katlanır)
   - İlk 20 (YL süzgeci)
   - Genel yol haritası
3. **"Bu yıl ne yapmalısın":**
   - `lise`: `sinifNotlari[sinif]`.
   - `lise-mezun`: `sinifNotlari.mezun`.
   - YL'de bu bölüm yoktur.

360 px:
```
│ Lise·11·NL·EN  [Değiştir]  │  (yapışkan değil; tek satır, taşarsa sarar)
│ h1 (24px)                  │
│ Özet kartı                 │
│ Koçluk CTA (tam genişlik)  │
│ ⚠ Dil bandı                │
│ jump-nav: yatay kaydırmalı │  (çipler tek satır, overflow-x:auto; sayfa taşmaz)
│ Bölümler tek sütun         │
│ İlk 20: liste görünümü     │  (sıra · ad · EN/YEREL rozetleri; ilk 6)
│ Yol haritası               │
```

### 3.4 Kesinlik ve durum rozetleri

| Rozet ailesi | Değerler | Görünüm |
| :--- | :--- | :--- |
| Madde kesinliği (mevcut) | Doğrulandı · Yoruma açık · Yayımlanmadı · Teyit gerekir · Doğrulanamadı | Mevcut `.kesinlik-*` |
| Ülke rozeti (yeni, ülke düzeyi) | `null` · "Teyit gerekir" · "Kısmi veri" | Ülke kartı ve özet kartı; `.kesinlik-warn` |
| Program durumu (yeni) | `genis` ● Geniş · `kisitli` ◔ Kısıtlı · `yok` ○ Yok · `teyit` ? Teyit gerekir · `veri-yok` – Hazırlanıyor | Ülke kartı, özet ve dil bandı. Simge + metin birlikte gösterilir; WCAG AA. |
| Üniversite dil hücresi (yeni) | `var` · `kismi` · `yok` · `teyit` | Her üniversitede "EN ●" ve "YEREL ◔" mini rozetleri |
| Rota türü (yeni) | "Tarihli rota" · "Genel yol haritası" | Rotam sekmesi ve ülke kartı |
| Tarih (yeni) | "Tahmini" | Genel yol haritasındaki hesaplanmış takvim ayı |

### 3.5 Boş ve eksik veri durumları (metinler kesin; testte aranır)

| Durum | Gösterilen | Eylem |
| :--- | :--- | :--- |
| Ülke dosyası yok / yüklenemedi | "**{Ülke} için şartlar hazırlanıyor.** Mevzuat uzmanı resmi kaynakları doğruluyor." | Ülkenin resmi portalı (`ulke-dizini.portal`) · başka ülke seç |
| Seçili dilde program **yok** | Kırmızı-nötr band: "**{Ülke}'da İngilizce lisans programı yok.** İlk 20'de İngilizce lisans sunan üniversite bulunamadı." Dil bölümleri gösterilmez; yalnızca ortak bölüm kalır. | [Yerel dil şartlarını gör] · YL için [YL'de İngilizce durumu: Geniş] (diğer düzey biliniyorsa) |
| Seçili dilde program **kısıtlı** | Amber band: "**İngilizce lisans programı kısıtlı:** ilk 20'den {n} üniversite, çoğu tek program." | [İngilizce program sunanları listele] |
| Durum **teyit** | "Bu bilgi resmi yazılı yanıtla teyit edilmedi." | Varsa e-posta şablonu bağlantısı (oturumlu) |
| Bölüm boş | Mevcut "Bu bölüm hazırlanıyor" kartı (sartlar-ui) | — |
| QS listesinde ülkede 20'den az üniversite | "QS {yayın} sıralamasında {Ülke}'dan **{n} üniversite** var; listenin tamamı bu." | — |
| Filtre sonucu 0 üniversite | "Bu filtreyle ilk 20'de üniversite yok." | [Filtreleri temizle] |
| İrlanda + yerel | Dil adımı yerine not: "İrlanda'da öğretim dili İngilizce; yerel dil seçeneği yok." | — |
| Model `lise` + sınıf yok | Sonuç yerine "Önce sınıfını seç" giriş kartı (mevcut desen) | — |
| Oturumlu kullanıcı, ülke profilde yok | Koçluk kartı: "Bu ülkeyi rotana eklemek için profilini güncelle." (mevcut) | [Profilimi düzenle] |

---

### 3.6 `universiteler.html`

1280 px:
```
│ ÜNİVERSİTELER · GİRİŞ GEREKMEZ   (oturumlu: ÜNİVERSİTELERİM)                               │
│ h1  Hollanda'da en iyi 20 üniversite                                                        │
│ [DE][IT][AT][BE]…[NL•]… ülke sekmeleri (oturumlu: önce profil ülkeleri, sonra "Tümü ▾")     │
│ ┌ Filtre çubuğu (role=search) ─────────────────────────────────────────────────────────┐   │
│ │ Düzey (•Lisans)(YL)   Dil (•Hepsi)(İngilizce)(Yerel)   [Ara: ad, şehir]  [Şehir ▾]   │   │
│ └───────────────────────────────────────────────────────────────────────────────────────┘   │
│ QS World University Rankings 2026 · ülke içi sıra · kaynak ↗ · 20 üniversiteden 9'u gösteriliyor │
│ ┌──┬──────────────────────┬────────┬───────┬──────────┬──────────┬──────────┬───────────┐  │
│ │# │ Üniversite           │ Şehir  │ QS    │ EN lisans│ Yerel l. │ Mühendis.│ Başvuru ↗ │  │
│ │1 │ TU Delft             │ Delft  │ 47    │ ● Var    │ ● Var    │ ✓        │ Kaynak    │  │
│ │  │ ▸ Ayrıntı: not, harç notu, kesinlik, kaynak (details)                            │  │
│ └──┴──────────────────────┴────────┴───────┴──────────┴──────────┴──────────┴───────────┘  │
│ ── Rotaya uygun seçilmiş üniversiteler (yalnızca DE/IT; ulkeler.js) ── mevcut kart ızgarası │
│ ── Ülkenin kabul yolu ve genel isterler ── → sartlar.html?…&ulke=nl bağlantısı (tekrar yok) │
```
- Tablo `<table>` öğesidir (anlamsal); başlık hücreleri `scope="col"`. Durum hücreleri simge + metin içerir.
- Seçilen düzeye göre "EN lisans" sütunu "EN YL" olur.
- URL: `universiteler.html?ulke=nl&duzey=lisans&dil=en`. Arama ve şehir URL'ye yazılmaz.
- Varsayılanlar:
  - misafir: `duzey=lisans`, `dil=hepsi`;
  - oturumlu: profilin modelinden gelen düzey ve `egitimDili`.

360 px: Tablo **kart listesine** dönüşür (CSS ile `display:block`, satır = kart):
```
│ 1 · TU Delft            │
│ Delft · QS 47           │
│ EN ● Var  YEREL ● Var   │
│ ▸ Ayrıntı   Başvuru ↗   │
```
- Ülke sekmeleri yatay kaydırılır (`overflow-x:auto`, sayfa taşmaz).
- Filtre çubuğu iki satıra sarar.

### 3.7 `mezun.html` (yönlendirme)
```
│ h1 Lise mezunları sayfası taşındı                         │
│ Şartlar artık tek sayfada: Durum = Lise mezunu.           │
│ [Lise mezunu şartlarına git →]  (JS: location.replace)    │
```
- Duyurular (BME) `duyurular.js` dosyasına taşınır ve `sartlar.html`'deki duyuru şeridinde görünür; eşleşme `model=lise-mezun` ve `ulke=hu` ile yapılır.
- `digerleri` (menüye alınmayan ülkeler) kalkar. Bu ülkelerin nedenleri ilgili ülke dosyasının `lisans.uyarilar` alanına taşınır.

### 3.8 `profil.html` sihirbazı (4 adım; ilerleme çubuğu "Adım 2/4")
```
1 Durumun      ○ Lise öğrencisi  ○ Lise mezunu  ○ Üniversite mezunu
2 Ayrıntı      lise:        Okul + sınıf (9–12)
               lise-mezun:  Okul + mezuniyet yılı + hedef başlangıç yılı + YKS yerleşme durumu (mevcut)
               uni-mezun:   Lisans alanı + üniversite (isteğe bağlı) + durum (mezun / son sınıf)
                            + mezuniyet (beklenen) yılı + GPA (4'lük) + hedef başlangıç yılı + hedef YL alanı
3 Ülkeler      15 ülke ızgarası (çoklu, en fazla 5) + aktif rota (2+ seçilirse)
4 Eğitim dili  (•İngilizce) ( Yerel dil ) — tek seçim; ülkeye göre etiket örneği gösterilir
```
- 360 px: adım başına tek sütun; "Geri / Devam" düğmeleri alt kenarda tam genişlikte.
- Düzenleme formu (`pf-form`) aynı sırayla tek sayfada gösterilir; modele ait alan kümeleri `hidden` ile değişir.

---

## 4. Profil şeması önerisi (`assets/js/auth.js`)

### 4.1 Yeni ve değişen alanlar
| Alan | Tür / değerler | Zorunlu | Not |
| :--- | :--- | :--- | :--- |
| `ogrenciModeli` | `"lise"` \| `"lise-mezun"` \| `"uni-mezun"` | Evet | Ana alan (D5) |
| `sinif` | `"9".."12"` \| `"mezun"` \| `"lisans-mezun"` | Türetilir | Modelden yazılır. Eski kodun okuduğu alan; kullanıcıya ayrıca sorulmaz. |
| `okul` | metin ≤100 | lise, lise-mezun | uni-mezun için zorunlu değil (lise adı gerekmez) |
| `ulkeler` | 15 koddan 1–5 tanesi, tekil | Evet | `["de","it"]` süzgeci kalkar. Tek liste `ULKE_KODLARI`; `ulke-dizini.js` ile aynı. |
| `aktifRota` | `ulkeler` içinden | Türetilir | Mevcut kural |
| `egitimDili` | `"en"` \| `"yerel"` | Evet; varsayılan `"en"` | İrlanda için yok sayılır. Ülke başına ayrı tercih ilk sürümde yok (risk R6). |
| `hedefBaslangicYili` | YYYY (Y…Y+3) | lise-mezun, uni-mezun | Mevcut alan; artık uni-mezunda da kullanılır |
| `hedefAlan` | metin ≤60 | Hayır | Mevcut. uni-mezunda "Hedef YL alanı" etiketiyle gösterilir. |
| `lisansAlani` | metin ≤80 | uni-mezun | ör. "Makine Mühendisliği" |
| `lisansUniversitesi` | metin ≤100 | Hayır | E-posta şablonlarında kullanılır |
| `lisansDurumu` | `"mezun"` \| `"son-sinif"` | uni-mezun | — |
| `lisansMezuniyetYili` | YYYY; mezunsa ≤ bu yıl, son sınıfsa bu yıl ya da +1 | uni-mezun | — |
| `gpa4` | sayı 0.00–4.00, en fazla 2 ondalık | Hayır | 100'lük not girilirse çevrilmez; yalnızca 4'lük kabul edilir. Not: "YÖK dönüşüm tablosu kullanılmaz; transkriptteki 4'lük not." |

Saklanmayan bilgiler:
- **Askerlik durumu** profilde tutulmaz (hassas veri). `yl-genel.askerlik` bilgisi herkese genel not olarak gösterilir.
- **Dil sınavı puanı** ilk sürümde yok.

### 4.2 Model değişince temizlenen alanlar (`MODEL_ALANLARI`)
- `lise` → `lise-mezun`/`uni-mezun`: sınıf yeniden türetilir.
- `lise-mezun` dışına çıkınca: `yerlesmeDurumu`, `mezuniyetYili` silinir. Bu, bugünkü `MEZUN_FIELDS` mantığının genelleştirilmiş hâlidir.
- `uni-mezun` dışına çıkınca: `lisansAlani`, `lisansUniversitesi`, `lisansDurumu`, `lisansMezuniyetYili`, `gpa4` silinir.
- `hedefBaslangicYili`: yalnızca `lise` modeline geçilince silinir.
- Bilinmeyen alanlar korunur (bugünkü kural).

### 4.3 Eski kayıt taşıma (yalnızca okuma anında; yazma ilk kayıtta)
Kurallar `profilNormallestir(p)` içinde uygulanır; işlev saf ve idempotenttir, auth.js'te durur ve app.js'ten de çağrılır:
1. `ogrenciModeli` yoksa:
   - `sinif === "mezun"` → `"lise-mezun"`;
   - `sinif` 9–12 → `"lise"`;
   - diğer durumlarda `null` → `tamamlandi` korunur, Panelim "Durumunu seç" bandı gösterir. Sihirbaza **zorla** yönlendirilmez.
2. `egitimDili` yoksa → `"en"` (projenin bugünkü varsayımı).
3. `ulkeler` içindeki geçersiz kodlar atılır. Liste boş kalırsa `tamamlandi` korunur ve "Hedef ülke seç" bandı gösterilir.
4. Normalleştirilmiş profil, kullanıcı profili kaydedene kadar depoya **yazılmaz**. Böylece taşıma geri alınabilir kalır ve `tasima-test` deseniyle uyumludur.
5. Yedek (`apmeberra-yedek`) içinden gelen profiller de aynı işlevden geçer.

---

## 5. Veri sözleşmesi önerisi (PM doldurur)

### 5.1 Dosyalar
```
data/mevzuat/
├── ulke-dizini.js          window.APMEBERRA_ULKE_DIZINI   (her açık sayfada; ~6 KB)
├── ulke/<cc>.js            window.APMEBERRA_ULKE_VERI[cc] (seçilince dinamik <script>; 15 dosya)
├── yl-genel.js             window.APMEBERRA_YL_GENEL      (yalnızca uni-mezun seçiminde yüklenir)
├── duyurular.js            window.APMEBERRA_DUYURULAR     (mezun-ulkeler.js duyurularının yerine)
├── kaynak/*.json           PM onaylı mevzuat çıktıları (sayfalar okumaz; pakete girmez)
├── ulke-rotalari.js        DEĞİŞMEZ (DE/IT tarihli rota)
├── ulkeler.js              DEĞİŞMEZ (DE/IT seçilmiş üniversiteler; yazışmalar)
├── sinavlar.js             Genişler: yeni dil sınavları + GRE/GMAT; ulkeler[] 15 koda açılır; isteğe bağlı dil: "en"|"yerel", duzey: ["lisans","yl"]
├── sartlar.js              KALKAR (A3 sonunda) → içeriği ulke/de.js, ulke/it.js'e taşınır
└── mezun-ulkeler.js        KALKAR (A3 sonunda) → ulke/hu.js, ulke/pl.js + duyurular.js
```
Üretici: `node araclar/ulke-veri-olustur.js`
- Girdi `kaynak/lisans-<cc>.json`, `yl-<cc>.json`, `uni-<cc>.json`, `yl-genel.json`.
- Doğrular ve `ulke/<cc>.js`, `yl-genel.js`, `ulke-dizini.js` dosyalarını üretir.
- Şema hatasında sıfırdan farklı çıkış kodu verir.
- `pm-denetim` zincirine eklenir (teslim sırası 0b).

### 5.2 `ulke-dizini.js` (her sayfada; küçük)
```js
window.APMEBERRA_ULKE_DIZINI = {
  surum: "2.0.0", sonKontrol: "2026-10-15",
  ulkeler: [{
    kod: "nl", ad: "Hollanda", adEk: { de: "Hollanda'da", den: "Hollanda'dan" }, // Türkçe ekler (h1 için)
    yerelDil: ["nl"], yerelDilAd: "Felemenkçe",           // ch: ["de","fr","it"] → "Almanca / Fransızca / İtalyanca"
    grup: "ana" | "diger",                                 // ana = de, it (tarihli rota)
    rozet: null | "Teyit gerekir" | "Kısmi veri",
    program: { lisans: { en: "genis", yerel: "genis" }, yl: { en: "genis", yerel: "genis" } }, // genis|kisitli|yok|teyit|veri-yok
    tarihliRota: { lisans: true|false, yl: false },        // ulke-rotalari.js'te var mı
    portal: { ad: "Studielink", url: "https://..." },      // boş durum eylemi
    veri: { lisans: true, yl: true, uni: true }            // ulke/<cc>.js içinde hangi bloklar dolu
  }]
};
```
`program.*` alanı elle yazılmaz. Üretici, `uni-<cc>.json` sayımından ve `lisans/yl-<cc>.json` özetinden türetir. Kurallar:
- ilk 20'de en az 5 `var` → `genis`;
- 1–4 → `kisitli`;
- 0 → `yok`;
- `teyit` ağırlıklıysa → `teyit`.

### 5.3 `ulke/<cc>.js`
```js
(window.APMEBERRA_ULKE_VERI = window.APMEBERRA_ULKE_VERI || {}).nl = {
  ulke: "nl", ad: "Hollanda", yerelDil: ["nl"], sonKontrol: "2026-10-15",
  lisans: {                         // lisans-nl.json
    ozet: "…",
    ortak: [madde],
    en:    { gerekenler: [madde], tarihler: [madde], hatalar: [madde] },
    yerel: { gerekenler: [madde], tarihler: [madde], hatalar: [madde] },
    sinifNotlari: { "9": [madde] | {gerekenler, buYil, tarihler, hatalar}, …, "mezun": … },
    apEtkisi: [madde], burslar: [madde],
    uyarilar: [madde]               // ör. eski "digerleri.neden" metni
  },
  yl: {                             // yl-nl.json
    ozet, ortak, en: {…}, yerel: {…}, burslar: [madde],
    ornekProgramlar: [{ universite, program, dil: "en"|"yerel", url, not }]
  },
  universiteler: {                  // uni-nl.json
    siralama: { ad: "QS World University Rankings", yayin: "2026", url },
    liste: [{ sira, ad, sehir, qsSira, url,
              lisans: { en: "var"|"kismi"|"yok"|"teyit", yerel: …, not, kaynak },
              yuksekLisans: { en, yerel, not, kaynak },
              muhendislik: true|false, harcNotu, basvuruUrl, kesinlik,
              rotaUniId: "de-tum" | null }]   // ulkeler.js ile bağ (yalnızca DE/IT)
  }
};
```
Madde şeması `sartlar.js` ile aynıdır: `{id, baslik?, metin, kaynak[], kesinlik, sonKontrol, zaman?}`.

İki isteğe bağlı ek alan önerilir:
- `dil: "en" | "yerel"`: `ortak`, `sinifNotlari` ve `burslar` içindeki bir madde yalnızca bir dile aitse yazılır. Motor bu alana göre süzer.
- `zaman.hedefYilaGore`: YL ve mezun maddelerinde kullanılır. Hedef başlangıç yılına göre yıl farkını verir (ör. `-1`, `ay: 1` → başlangıçtan önceki Ocak). `mezuniyetGore` ile aynı mantıktadır; `goreliZaman` ikisini de anlar.

Id kuralı: `<cc>-<duzey>-<dil|ortak>-<kisa>`, örneğin `nl-l-en-studielink-15-ocak`. Id tüm ülke dosyalarında benzersiz olmalıdır (çapa `#m-<id>`).

### 5.4 `yl-genel.js` ve `duyurular.js`
```js
window.APMEBERRA_YL_GENEL = { surum, sonKontrol, belgeler: [madde], turkiyeBurslari: [madde], abBurslari: [madde],
  askerlik: [madde], takvim: [madde], gre: [madde], dilSinavlari: [madde] };
window.APMEBERRA_DUYURULAR = [ madde + { bitis: "YYYY-AA-GG", hedef: { modeller: ["lise-mezun"], ulkeler: ["hu"], diller: ["en"] } } ];
```

### 5.5 `sartlar-motor.js` genişletmesi (saf; Node + tarayıcı)
Mevcut dışa aktarılan işlevler A3'e kadar korunur. Yenileri:

| İşlev | Dönüş |
| :--- | :--- |
| `MODELLER`, `ULKE_KODLARI` (15), `DILLER` | Sabitler. `ULKE_KODLARI`, `rota.js` ve `auth.js` tarafından da okunur; tek liste olur. |
| `secimOku(search)` | `{model, sinif, ulke, dil, duzey, notlar[]}`. §2.3 uyum tablosu bu işlevde uygulanır. |
| `secimUrl(sayfa, secim)` | Kanonik adres. Eski imza `(sayfa, ulke, sinif)` de kabul edilir. |
| `dizinDogrula(d)`, `ulkeVeriDogrula(v)`, `ylGenelDogrula(g)` | Sorun listesi |
| `programDurumu(dizinKaydi, duzey, dil)` | `genis` \| `kisitli` \| `yok` \| `teyit` \| `veri-yok` |
| `ulkeBolumleri(veri, secim, ylGenel?)` | `{gerekenler, buYil, tarihler, hatalar, apEtkisi, burslar, ornekProgramlar, ylOrtak, uyarilar, atlanan}`. Geçersiz madde atlanır; `madde.dil` süzgeci bu işlevde uygulanır. |
| `universiteSuz(liste, {duzey, dil, q, sehir})` | Süzülmüş liste + `{toplam, gosterilen}` |
| `aktifDuyurular(liste, secim, bugun)` | Hedefi eşleşen ve süresi geçmemiş duyurular |
| `genelYol(veri, secim, profil?, bugun)` | §6.2 adımları (göreli etiket + tahmini tarih) |
| `veriYukle(cc)` | **UI dosyasında** (`sartlar-ui.js`) durur, motor saf kalır. Dinamik `<script src="data/mevzuat/ulke/<cc>.js">` yükler ve Promise döndürür; zaman aşımı 8 sn. |

`rota.js`:
- `ULKELER` sabiti `ULKE_KODLARI` olur.
- `rota.veri(cc)` tarihli rota yoksa `null` döndürür (bugünkü gibi); `rota.html` bu durumda `genelYol` kullanır.

`eposta.js`:
- `mezuniyetYili("lisans-mezun")` → `null`.
- `takvimYili` uni-mezunda `hedefBaslangicYili` kullanır.

---

## 6. Panelim / Rotam etkisi

### 6.1 Panelim (`index.html`)
| Bölüm | lise | lise-mezun | uni-mezun |
| :--- | :---: | :---: | :---: |
| Merhaba kartı (alt satır modele göre) | ✓ | ✓ | ✓ |
| Rotanın sıradaki adımları (tarihli ya da genel) | ✓ | ✓ | ✓ |
| Duyuru şeridi (`duyurular.js`, modele göre) | ✓ | ✓ (eski Mezun Menüsü kartının yerine) | ✓ |
| Bugün ne yapmalısın · son deneme · AP geri sayımı | ✓ | AP geri sayımı gizli (K5-b) | — |
| AP çalışma odaları · KMK ön kontrolü (yalnızca DE) | ✓ | — / bilgi notu | — |
| **YL kontrol listesi** (`yl-genel.belgeler`; "hazır" işareti `apmeberra:rota:v1.genel.belgeler` altında) | — | — | ✓ |
| **Dil sınavı / GRE kartı** (profil ülkeleri + `egitimDili`) | — | — | ✓ |
| Ülke kartları (profil ülkeleri; program durumu rozeti; şartlar bağlantısı) | ✓ | ✓ | ✓ |
| Rehberler ve araçlar | ✓ | ✓ | süzülmüş |

360 px'te sıra: Merhaba → sıradaki adımlar → duyuru → (modele özel kart) → ülke kartları → araçlar.

### 6.2 Rotam (`rota.html`)
- **Ülke sekmeleri:** profilde 1–5 ülke olabilir. Sekmeler 360 px'te yatay kaydırılır. Her sekmede "Tarihli" ya da "Genel" rozeti bulunur.
- **Tarihli rota:** yalnızca DE ve IT, model `lise` ya da `lise-mezun`. Bugünkü motor aynen kullanılır.
- **Genel yol haritası** diğer tüm durumlarda gösterilir: 13 ülke, ayrıca DE/IT için YL. Adımlar iki kaynaktan gelir:
  1. Ülke dosyasında zamanı olan maddeler: `{düzey}.{dil}.tarihler` ile `ortak` içindeki `zaman` taşıyanlar.
  2. Ortak şablon (`ulke-dizini.js` içinde `GENEL_ADIMLAR`, 7 adım). Adımların zamanı göreli olarak verilir:
     - Dil sınavı: −15 ay
     - Belge çevirisi ve apostil: −10 ay
     - Başvuru penceresi: ülke verisinden
     - Kabul ve teminat: −5 ay
     - Vize: −4 ay
     - Konaklama: −3 ay
     - Varış / kayıt: 0
- **Adım sırası ve tarihi:** Adımlar göreli zamana göre sıralanır. Profil yılı varsa (lise mezuniyeti ya da `hedefBaslangicYili`), takvim ayı hesaplanır ve "Tahmini" rozeti eklenir. Profil yılı yoksa yalnızca göreli etiket gösterilir ("Başlangıçtan 10 ay önce").
- **Şablon adımı kuralı:** Şablon adımında madde kaynağı ve kesinliği yoksa adım "Genel öneri" olarak etiketlenir ve kesinlik rozeti gösterilmez. Bu, PM Doğruluk Kapısı'na uyum içindir: şablon bir mevzuat iddiası taşımaz.
- **"Yapıldı" durumu:** `apmeberra:rota:v1[cc].adimlar[id]` altında tutulur, anahtar değişmez. YL için ayrı bir alt anahtar kullanılır: `apmeberra:rota:v1["nl-yl"]`. Böylece lisans ve YL durumları karışmaz.
- **Genel rotada gösterilmeyenler:**
  - KMK denetleyicisi ve belge listesi gösterilmez (yalnızca DE/IT tarihli rotada vardır).
  - YL'de belge listesi `yl-genel.belgeler`'den gelir.

---

## 7. Test planı

### 7.1 Yeni testler
| Test | Tür | Kapsam (hedef kontrol sayısı) |
| :--- | :--- | :--- |
| `secici-birim-test.js` | Node | `secimOku`/`secimUrl` uyum matrisi (§2.3, ≥40 durum), `programDurumu`, `ulkeBolumleri` dil süzgeci, `universiteSuz`, `aktifDuyurular` hedef eşleşmesi, `genelYol` sıralama ve tahmini tarih (~120) |
| `ulke-veri-test.js` | Node | Üretilen 15 ülke dosyası ile `yl-genel` ve `dizin` şeması: tekil id, kaynak URL http(s), sira 1..n tekil ve ≤20, `program` türetmesi kurallara uygun, `rotaUniId` `ulkeler.js`'te mevcut (~300+) |
| `profil-v2-birim-test.js` | Node | `profilNormallestir` (eski mezun / 9–12 / bozuk), uni-mezun doğrulamaları (GPA 0–4, 2 ondalık, yıl aralıkları), model değişiminde alan temizliği, 15 ülke + en fazla 5 (~80) |
| `secici-test.js` | Playwright | 3 model yolu; İrlanda dil atlama; İsviçre ve Belçika etiketleri; klavye (Tab, ok tuşları, Enter); geri/ileri (`popstate`); eski bağlantılar (`?ulke=de&sinif=mezun`, `mezun.html?ulke=pl`); boş durum metinleri (§3.5); 0 `pageerror`; 360 px'te `scrollWidth ≤ innerWidth` |
| `universiteler-v2-test.js` | Playwright | Ülke sekmeleri, düzey/dil filtreleri, 0 sonuç durumu, <20 üniversite notu, misafir ve oturumlu varsayılanlar, tablonun 360 px'te kart görünümü |
| `panel-model-test.js` | Playwright | 3 model için Panelim bölüm görünürlüğü (§6.1 tablosu), menü süzgeci (§1.2) |
| `rota-genel-test.js` | Playwright | Genel yol haritası (NL lisans, DE YL); "Tahmini" rozeti; "yapıldı" kaydı ve `nl-yl` ayrımı; test sonunda localStorage temizliği |
| Ekran görüntüleri | Playwright | `sartlar` (giriş / ızgara / sonuç), `universiteler`, `profil` sihirbazı, Panelim (3 model), Rotam (genel). Her biri 1280 ve 390 px, açık ve koyu tema. Scratchpad'e kaydedilir. |

### 7.2 Güncellenecek mevcut testler
| Test (bugünkü sayı) | Değişiklik |
| :--- | :--- |
| `sartlar-birim` (45) | `ULKELER` 2 → 15; `secimOku` yeni alanları; eski `bolumler` testleri A3'te `ulkeBolumleri`'ne taşınır |
| `mezun-menu-test` (27), `mezun-test` (56), `mezun-birim` (59) | Mezun Menüsü sekmeleri → yönlendirme, `hu`/`pl` sonucu `sartlar.html`'de; duyuru testleri `duyurular.js`'e |
| `erisim-test` (79) | Misafir menüsünde "Mezunlar" yok; yeni veri dosyaları açık; kilitli sayfa listesi aynı |
| `hesap-test` (157) | Profil doğrulama (15 ülke, model alanları, sihirbaz 4 adım) |
| `rota-birim` (51), `rota-test` (225) | `ULKE_KODLARI`; DE/IT dışı ülke → genel yol; mezun davranışı aynı |
| `eposta-birim` (119) | `lisans-mezun` sınıfı, `takvimYili` |
| `yazisma-test` (64) | Ülke süzgeci 15; şablonsuz ülke boş durumu |
| `tasima-test` (17) | Profil normalleştirme ile birlikte |
| `tasarim-test` (52), `ulke-test`, `paket-test` (11) | Yeni sayfa bölümleri, paket dosya sayısı (+18 veri dosyası) |
| `ad-denetimi`, `pm-denetim` | Değişmez. `ulke-veri-olustur` teslim sırasına 0b olarak girer. |

**Ön koşul (A0b, PM tarafından tamamlandı):** Test betiklerindeki eski klasör adlı mutlak yollar (DEVAM-NOKTASI "ilk iş") A1 adımından önce düzeltildi.

---

## 8. Riskler

| No | Risk | Önlem |
| :--- | :--- | :--- |
| R1 | QS'de bazı ülkelerden 20'den az üniversite olabilir (ör. IE, HU, DK, FI, CZ). | "Listenin tamamı bu" notu (§3.5); kural "en fazla 20" olarak yazılır. |
| R2 | QS sıralaması yılda bir değişir; QS verisinin kullanım koşulları. | Yalnızca sıra no + yayın yılı + kaynak bağlantısı gösterilir; puan kopyalanmaz. Yayın yılı dizinde tutulur; takip listesine yıllık kontrol maddesi eklenir. |
| R3 | 15 ülke × 2 düzey × 2 dil = 60 kombinasyon. Çoğu ilk sürümde "Teyit gerekir" ya da boş olabilir. | Sayfa hazır bölüm oranını gösterir ("Hazır bölüm 4/8"). Boş durumlar kesin metinlidir; uydurma veri yerine "hazırlanıyor" gösterilir. |
| R4 | `sinif:"mezun"` ile kurulmuş eski mantık (rota, eposta, panel) kırılabilir. | D5: `sinif` türetilmiş olarak kalır; normalleştirme yalnızca okuma anında yapılır; `tasima-test` deseni izlenir. |
| R5 | Dinamik `<script>` yükleme `file://`'da çalışır, ancak hata yönetimi gerekir; paket testi ağ isteği sayar. | Yerel dosya ağ isteği değildir; zaman aşımı + "yüklenemedi" durumu eklenir. `seviye.js` aynı yöntemi zaten kullanıyor. |
| R6 | Tek `egitimDili` her ülke için aynı tercih olmayabilir (ör. NL'de İngilizce, DE'de Almanca). | İlk sürümde tek tercih; sartlar sayfasında dil her zaman değiştirilebilir. Ülke başına tercih (`dilTercihi{cc}`) A5 sonrası backlog'a. |
| R7 | CH/BE/FI'de çok yerel dil var; `dil=yerel` kararsız kalabilir. | D4 etiketi + üniversite satırında program dili. Gerekirse sonradan `yd=fr` parametresi eklenebilir (geriye uyumlu). |
| R8 | Menü ve ülke ızgarası kalabalıklaşır (15 kart). | İki grup (ana / diğer) + "yalnızca İngilizce" süzgeci + 360 px'te kompakt satır. |
| R9 | Mezun Menüsü'nün kaldırılması kullanıcıya kayıp gibi görünebilir. | Yönlendirme + duyuru şeridi; `lise-mezun` modelinin ızgarasında HU ve PL zaten görünür. |
| R10 | YL burs ve askerlik bilgisi hassas ve hızlı değişir. | Profilde tutulmaz; yalnızca kaynaklı madde. Takip listesine eklenir. |
| R11 | Sayfa ağırlığı. | Dizin ~6 KB her sayfada; ülke dosyası (~30–60 KB) yalnızca seçilince yüklenir; ilk 20 tablosu en fazla 20 satır, sanallaştırma gerekmez. |

---

## 9. İş kırılımı (aşamalar)

| Aşama | İş | Sahip | Bağımlılık | Bitti ölçütü |
| :--- | :--- | :--- | :--- | :--- |
| **A0** | Bu planın onayı (D1–D8) | PM + kullanıcı | — | Kararlar `proje.md` §27'ye işlendi |
| **A0b** | Test yolları `AP MEBERRA` + tam regresyon | Ajan 11 | — | Tüm mevcut testler geçti |
| **A1** | `ulke-veri-olustur.js`, şema denetimi; `sartlar.js` → `kaynak/lisans-de/it.json`, `mezun-ulkeler.js` → `lisans-hu/pl.json` + `duyurular`; motor işlevleri (§5.5) + `secici-birim`, `ulke-veri-test` | Ajan 11 (araç, motor) + PM (dönüştürme onayı) | A0, en az 1 yeni ülke JSON'u (öneri: `nl`) | Eşdeğerlik testi: eski 74 + 26 madde id'sinin tamamı yeni dosyalarda; birim testleri 0 hata |
| **A2** | `sartlar.html` v2 (seçici, ızgara, sonuç, boş durumlar), `mezun.html` yönlendirme, menü, `giris.html` taşıma | Ajan 11 | A1 | `secici-test`, `erisim`, `mezun-*` güncel; ekran görüntüleri 4×2 |
| **A3** | `universiteler.html` v2 + eski `sartlar.js` / `mezun-ulkeler.js` kaldırma | Ajan 11 | A1 + `uni-<cc>.json` | `universiteler-v2-test`; paket testi |
| **A4** | `auth.js` profil v2 + `profilNormallestir` + sihirbaz + düzenleme formu | Ajan 11 | A0 | `profil-v2-birim`, `hesap`, `tasima` |
| **A5** | Panelim (model bölümleri), Rotam genel yol haritası, `sinavlar.html` filtreleri, yazışmalar boş durumu | Ajan 11 (+ Ajan 2: yeni sınav kayıtları) | A2, A4, `yl-genel.json` | `panel-model-test`, `rota-genel-test`, `rota`, `yazisma` |
| **A6** | Tam regresyon, ekran görüntüleri (1280/390 × açık/koyu), paket, `HARITA.md` + `proje.md` + `DEVAM-NOKTASI.md` | Ajan 11 + PM | A1–A5 | `pm-denetim` 0, `ad-denetimi` 0, tüm testler geçti |

A2 ile A4 paralel yürüyebilir. A3, yalnızca `uni-*` verisi beklerse geride kalabilir; o sürede `universiteler.html` bugünkü hâliyle çalışmaya devam eder.

---

*Hazırlayan: Ajan 11 (Frontend & UX), 15 Ekim 2026. `proje.md`'ye girecek özet: "Tur 11 ekran planı hazırlandı (`.agents/rules/tur11-ekran-plani.md`). 8 karar önerisi (D1–D8), 0 kod değişikliği; PM onayı bekleniyor."*

---

## 10. Uygulama notları (Ajan 11, 15 Ekim 2026; PM onayı D1–D8 sonrası)

Plan uygulanırken PM kararlarıyla şu ayrıntılar değişti ya da netleşti:

| Konu | Uygulanan |
| :--- | :--- |
| Motor adları | Eski `secimOku` / `secimUrl` / `bolumler` Tur 10 testleri için aynen duruyor. Yeni işlevler `secimCoz` (plan §2.3 uyum kuralları) ve `secimAdres` adını aldı. |
| Özet (program durumu) kuralı | **PM kararı:** yalnızca "var" (en az 3 program) sayılır. var ≥ 5 → Geniş; listenin çoğunluğu Doğrulanamadı → Teyit gerekir; var 1–4 ya da yalnız kısıtlı → Kısıtlı; yalnız yok → Yok; liste yoksa Hazırlanıyor. Plan §5.2'deki "var + kısıtlı ≥ 5" kuralının yerine geçer. |
| K-A | Hücre eşlemesi üreticide yapılır: "kısıtlı" → `kismi`, "Doğrulanamadı" → `teyit`. Kaynak JSON değişmez; dönüştürülen değer `enHam` / `yerelHam` alanında saklanır. URL dizisi ve metin içindeki URL'ler `{ad, url}` dizisine çevrilir. |
| K-B | Doğrulanamadı hücreli üniversiteler gizlenmez. Dil süzgecinde listenin sonunda "Doğrulanamadı — resmi katalogdan kontrol et" rozetiyle gösterilir. |
| K-D | `ozetUyari: {"lisans-en": "…"}` (metin ya da `{metin, kaynak}`) lisans, YL ya da uni dosyasında; dizinde ülke kartı, özet kartı ve üniversiteler tablosunun üstünde gösterilir. |
| Ülke rozeti | `ulkeler-meta.json` içindeki `rozet` alanı (null dahil) kaynak dosyalardaki rozetin önüne geçer. 15 Ekim 2026: dk ve ie "Teyit gerekir", diğerleri rozetsiz. |
| yl-genel sınav kayıtları | `dilSinavlari` öğeleri (`ad`, `cefr`, `gecerlilik`…) üreticide madde biçimine çevrilir; özgün dil adı `sinavDili` alanında kalır. |
| Profil düzenleme formu | Sihirbaz 4 adımlı (plan §3.8). Düzenleme formunda model ve sınıf tek "Durumun" grubunda: 9–12 / Lise mezunu / Üniversite mezunu. |
| Rotam durum anahtarları | `apmeberra:rota:v1` altında de, it her zaman; diğer ülkeler `<cc>`, YL `<cc>-yl`, YL belge listesi `genel` anahtarıyla yalnız kayıt varsa tutulur. |
