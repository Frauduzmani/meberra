# Tur 14 — Öğrenci Odaklı Ekran: Aşama Kayıtları (Ajan 11)

> Plan: `.agents/rules/tur14-ogrenci-odakli-ekran-plani.md` (kullanıcı onayı 20 Ekim 2026, A1 → A7).
> Her aşama ayrı teslim: `pm-denetim` 0 sorun, `ad-denetimi` 0, Node birim testleri, 18 tarayıcı testi, 1280/360 açık/koyu ekran görüntüleri, sürüm arşivi.
> Ekran görüntüleri proje dışında: `C:\Users\hp\AppData\Local\Temp\claude\C--Users-hp-Desktop-projelerim-AP-MEBERRA\fd6a0583-424a-4324-9d58-a54839f2cfb3\scratchpad\a11\shots\` (aşağıda kısaca `shots\`).

---

## A1 — Menü 5 öğe, misafir menüsü, "Panelim" → "Bugün", Rehberler altbilgide (20 Ekim 2026)

### Yapılanlar
- **Menü verisi** (`assets/js/app.js:239-315`): `APMEBERRA_NAV` 8 ana öğe + 16 alt öğeden **5 ana öğeye** indi: **Bugün** (`index.html`) · **Hedefim** (bölünmüş: etiket → `universiteler.html`; alt menü Ülke şartları · Üniversiteler · Rotam · Ülke rehberi: Almanya / İtalya) · **Çalış** (açılır: 6 AP dersi · CEnT-S · Denemeler · Yanlışlarım = `ilerleme.html#hata-title` · Seviye testi · İstanbul sınav rehberi; A6'da `calis.html` gelene kadar geçici, kırık bağlantı yok) · **Başvuru** (bölünmüş: etiket → `yazismalar.html`; alt menü Yazışmalarım · Sınavlar) · **Ben** (bölünmüş: etiket → `ilerleme.html`; alt menü İlerleme · Profil ve hesap · Yedek al / yükle).
- **Model farkları:** üniversite mezununda `Bugün · Hedefim · Sınavlar (sinavlar.html?model=uni-mezun) · Başvuru (düz bağlantı) · Ben (profil.html)`; AP araçları görünmez. Lise mezunu lise öğrencisiyle aynı 5 öğeyi görür.
- **Saf yardımcılar:** `apNavListesi(nav, model)` (`app.js:284`) modele göre süzer, tek alt öğesi kalan bölünmüş öğeyi düz bağlantıya çevirir, boş grup başlıklarını atar; `apNavEtkin(item, current)` (`app.js:295`) etkin ana öğeyi bulur (`#`'lı alt bağlantılar etkinlik saymaz → `ilerleme.html` yalnız "Ben"i yakar).
- **Bölünmüş öğe** (`app.js:471-515`): etiket `<a>` tek tıkla ana sayfaya gider, ok `<button aria-expanded aria-controls aria-label="… alt menüsü">` alt menüyü açar; eski klavye deseni (ok tuşları, Home/End, Escape, Tab ile kapanma) aynen. Her `<li>` artık `data-nav` (id) ve `data-nav-label` taşır (testler metin yerine bunu okur).
- **Misafir menüsü** (`app.js:302`): `Şartlar · Üniversiteler · Sınavlar` + sağda `Giriş yap / Kayıt ol` (K4 listesi `APMEBERRA_ACIK_SAYFALAR` değişmedi).
- **Rehberler altbilgide** (`app.js:308` `APMEBERRA_REHBERLER`, `app.js:626` `initFooterRehber()`): her sayfanın altbilgisine "Rehberler" satırı (Almanya, İtalya, İstanbul sınav rehberi [AP modelleri + misafir], Bilgi Merkezi, Ajan Konseyi); altbilgisi olmayan `giris.html`'e küçük altbilgi eklenir; profil sihirbazında gösterilmez. Hedefim alt menüsünde "Ülke rehberi" grubu.
- **"Panelim" → "Bugün":** `index.html` `<title>`, bölüm etiketi ve `document.title`; marka `aria-label`; `rota.html`, `sinavlar.html`, `universiteler.html`, `yazismalar.html` altbilgi bağlantısı "← Bugün ekranına dön"; `sartlar.html` "Bugün ekranına git"; `giris.html` dönüş adı; `profil.html` ipucu metni.
- **CSS** (`assets/css/styles.css:3484-3540`, bölüm 32): bölünmüş öğe kapsülü, 761–1100 px sığdırma (marka alt başlığı, danışman metni, hesap adı gizlenir), hamburger kırılımı 1180 → **760 px** (`styles.css:511`, `:1890`; A2'de alt gezinmeye döner), altbilgi Rehberler hapları, yazdırmada gizli.

### Testler (yeni sözleşmeye güncellenenler — gevşetme yok)
- `erisim-test.js`: ziyaretçi menüsü tam olarak `Şartlar|Üniversiteler|Sınavlar` + altbilgide 5 açık rehber; oturumlu menü tam olarak `Bugün|Hedefim|Çalış|Başvuru|Ben`, Hedefim > Ülke şartları, altbilgide 5 rehber.
- `tur11-test.js` D1: üniversite mezunu `Bugün|Hedefim|Sınavlar|Başvuru|Ben`, Sınavlar = `sinavlar.html?model=uni-mezun`, Ben = `profil.html`, AP bağlantısı yok.
- `hesap-test.js`: ders sayfasında yalnızca "Çalış" etkin; ArrowDown → `ap-calculus.html`, End → `istanbul-sinav-rehberi.html`, Escape odağı düğmeye döndürür; Başvuru → `yazismalar.html` + alt menüde Sınavlar; menü bağlantı denetimi sorgulu adresleri (`?model=`) dosya adına indirger.
- `rota-test.js`: "Hedefim" Bugün'den sonra ve "Rotam" Hedefim altında; > 760 px tek satır (1024 px dahil), ≤ 760 px hamburger → Hedefim ok düğmesi → Rotam görünür.
- `interact.js`: Çalış açılır menüsünde AP dersleri; `seviye-test.js`, `mezun-menu-test.js`: ileti metinleri (Çalış / Hedefim).

### Sonuçlar
- `node araclar/pm-denetim.js` → **977 soru, 0 sorun**; `node araclar/ad-denetimi.js` → **0 sorun**.
- Node: eposta 119 · ilk-basvuru 4694 · mezun-birim 59 · profil-v2 30 · rota-birim 62 · sartlar-birim 45 · secici-birim 95 · sinav-birim 183 · taslak-birim 58 · toc-birim 19 · ulke-veri 55 · universite-ister (0 hata) — hepsi 0 kaldı.
- Tarayıcı (18/18 geçti): interact 27 · backup 56 · ulke-test 16 sayfa/0 hata · seviye 104 · pm-seviye 17 · hesap 160 · deneme 58 · tasarim 53 · mezun 54 · mezun-menu 24 · tasima 17 · tur11 88 · sinav 111 · yazisma-taslak 90 · yazisma 64 · calc-frq 20 · erisim 88 · rota 221.
- Ekran görüntüleri (23 + 2; pageerror 0, yatay taşma 0): `shots\t14-A1-{lise,lise-mezun,uni-mezun}-index-{1280,360}-{light,dark}.png`, `shots\t14-A1-misafir-sartlar-{1280,360}-{light,dark}.png`, açık menüler `shots\t14-A1-*-menu-*.png`, altbilgi `shots\t14-A1-lise-index-altbilgi-1280-light.png`, `shots\t14-A1-misafir-giris-altbilgi-360-dark.png`.

### Tık ölçümü (masaüstü, oturumlu lise)
| Görev | Önce | A1 sonrası |
| :--- | ---: | ---: |
| G1 Üniversiteler | 1 (Üniversitelerim) | **1** (Hedefim etiketi) |
| Ülke şartları (oturumlu) | 2 (Rehberler ▾ → Ülke şartları) | 2 (Hedefim ▾ → Ülke şartları) |
| G4 Yeni deneme | 1 (Denemeler) + 2 | 2 (Çalış ▾ → Denemeler) + 2 — A6'da Çalış merkezi |
| G6/G7 Yazışmalar | 1 | **1** (Başvuru etiketi) |
| G8 İlerleme | 1 | **1** (Ben etiketi) |

### Arşiv
- `node araclar/surum-arsivle.js` → **v14.2** `arsiv/surumler/AP-MEBERRA-v14.2-2026-10-20.zip` (270 dosya, 3.9 MB, 270 hash doğrulandı).

### Açık kalanlar
- Plan §2.2 tablosu üniversite mezununa "4 öğe" diyor; brif "Çalış yerine Sınavlar" dediği için 5 öğe uygulandı (Bugün · Hedefim · Sınavlar · Başvuru · Ben). PM kararı gerekirse Başvuru ve Sınavlar birleştirilebilir.
- `index.html` altbilgisindeki eski "Portal" sütunu Rehberler satırıyla kısmen yineleniyor (A3'te ele alınır).

---

## A2 — Telefon alt gezinme (≤ 760 px) (20 Ekim 2026)

### Yapılanlar
- **Alt gezinme** (`assets/js/app.js` `initBottomNav()` + `apBnSheetKapat()`, çağrı `initGlobalNav` içinde): ≤ 760 px'te ekranın altında sabit çubuk; A1 menüsüyle aynı ana öğeler, ikon + kısa etiket: lise / lise mezunu `Bugün · Hedefim · Çalış · Başvuru · Ben`, üniversite mezunu `Bugün · Hedefim · Sınavlar · Başvuru · Ben`, misafir `Şartlar · Üniversiteler · Sınavlar · Kayıt ol` (Kayıt ol şartlar seçimini taşır: `giris.html?model=…&ulke=…#kayit`; "Giriş yap" üst çubukta kalır).
- Alt öğesi olan öğe (Hedefim, Çalış, Başvuru) alttan açılan bir liste açar (`#bn-sheet`, `aria-expanded`/`aria-controls`, odak ilk bağlantıya, Escape kapatır ve odağı düğmeye döndürür, dışarı tıklama kapatır, kapat düğmesi); "Ben" (`mobilBaglanti: true`) ve alt öğesiz öğeler doğrudan sayfaya gider. Etkin öğe `aria-current="page"` taşır (ders sayfasında Çalış, `sinavlar.html`'de Başvuru, `ilerleme.html`'de Ben).
- 9 yeni satır içi SVG ikon (`APMEBERRA_ICONS.bn_*`), profil sihirbazında (minimal) alt gezinme yok.
- **CSS** (`assets/css/styles.css` bölüm 32.3 + token `--bottom-nav-h: 56px` `:root`'ta): yükseklik 56 px + `env(safe-area-inset-bottom)` dolgusu; öğe ≥ 44 px dokunma hedefi; `body.has-bottom-nav` alt dolgusu ve `scroll-padding-bottom` (sabit çubuk içeriği ve altbilgiyi örtmez); ≤ 760 px'te üst menü listesi ve hamburger gizli (üst çubuk: logo + tema + hesap); liste açılışı 140 ms, `prefers-reduced-motion`'da animasyonsuz; z-index 95/96 (üst çubuk 100, modal 1000 üstte kalır); yazdırmada gizli. Hamburger düğmesi artık hiçbir genişlikte görünmez (> 760 px tam üst menü, ≤ 760 px alt gezinme); kodu geriye uyum için yerinde.

### Testler (yeni sözleşme)
- `tasarim-test.js` yeni bölüm **1b** (24 kontrol): 360 açık / 390 koyu × 6 sayfa — alt gezinme görünür, 56–60 px, ekranın dibinde, 5 etiket, doğru öğe `aria-current`, her öğe ≥ 44 px, gövde alt dolgusu ≥ 56 px, üst menü ve hamburger gizli, taşma yok; Hedefim listesi açılır (odak `sartlar.html`, çubuğun üstünde, Ülke rehberi var), Escape kapatır + odak geri, dışarı tıklama kapatır, sayfa sonu (altbilgi) çubuğun üstünde, sayfa hatası yok; üniversite mezunu 360 px etiketleri ve bağlantıları; 1280 px'te alt gezinme gizli, üst menü görünür.
- `hesap-test.js` (390/360): üst menü gizli + alt gezinme görünür; Çalış listesi açılır, ders sayfasında Çalış etkin.
- `rota-test.js` (360/390): üst menü gizli, alt gezinme görünür, Hedefim > Rotam listede.
- `erisim-test.js` (misafir 360): `Şartlar|Üniversiteler|Sınavlar|Kayıt ol`, Kayıt ol seçimi taşır, Şartlar etkin, Giriş yap üst çubukta.

### Sonuçlar
- `pm-denetim` → **977 soru, 0 sorun**; `ad-denetimi` → **0 sorun**; Node birim testleri A1 ile aynı sayılarla 12/12 geçti (eposta 119 · ilk-basvuru 4694 · mezun 59 · profil-v2 30 · rota 62 · sartlar 45 · secici 95 · sinav 183 · taslak 58 · toc 19 · ulke-veri 55 · universite-ister 0 hata).
- Tarayıcı (18/18 geçti): interact 27 · backup 56 · ulke-test 16 sayfa/0 hata · seviye 104 · pm-seviye 17 · **hesap 163** · deneme 58 · **tasarim 77** (53 → 77, +24 alt gezinme) · mezun 54 · mezun-menu 24 · tasima 17 · tur11 88 · sinav 111 · yazisma-taslak 90 · yazisma 64 · calc-frq 20 · erisim 88 · rota 221.
- Ekran görüntüleri (22; pageerror 0, taşma 0): `shots\t14-A2-{lise,lise-mezun,uni-mezun}-index-{1280,360}-{light,dark}.png`, `shots\t14-A2-misafir-sartlar-{1280,360}-{light,dark}.png`, açık liste `shots\t14-A2-{lise,lise-mezun,uni-mezun,misafir}-*-menu-360-light.png`, test çıktısı `shots\t14-alt-gezinme-360-{light,dark}.png`.

### Tık ölçümü (telefon 360 px, oturumlu lise)
| Görev | A1 (hamburger) | A2 (alt gezinme) |
| :--- | ---: | ---: |
| G1 Üniversiteler | 3 (☰ → Hedefim ▾ → Üniversiteler) | **2** (Hedefim → Üniversiteler) |
| G4 Yeni deneme | 3 + 2 | **2** + 2 (Çalış → Denemeler) |
| G6 Yazışmalar / son tarihler | 3 (☰ → Başvuru ▾ → Yazışmalarım) ya da 2 (☰ → Başvuru) | **2** (Başvuru → Yazışmalarım); Bugün'den "Tümü →" 1 (A3) |
| G8 İlerleme | 2 (☰ → Ben) | **1** (Ben) |

### Arşiv
- **v14.3** (aşağıdaki arşiv satırı `SURUMLER.md`'de).

### Açık kalanlar
- Alt gezinmede Hedefim ve Başvuru liste açar (2 dokunuş); A4 (Hedefim sekme çubuğu) ve A5 (Başvuru sekmeleri) gelince bu iki öğe doğrudan sayfaya gidebilir (`mobilBaglanti: true`).

---

## A3 — Bugün ekranı: Sıradaki adım + Yaklaşan tarihler + Devam et, yeni bölüm sırası (20 Ekim 2026)

### Yapılanlar
- **Saf fonksiyonlar** (`assets/js/app.js:943-1110`, `window.APMEBERRA.bugun` `app.js:2360`; DOM ve depolama okumaz):
  - `apSiradakiAdim(g)` (`:988`): öncelik **yarım deneme** (`apmeberra:deneme:v1.aktif`) > **son günü 14 gün içinde olan rota adımı** (rota.js `zamanCizelgesi`; ay düzeyindeki adımın son günü = ayın son günü) > **açık hata ≥ 5** (`apmeberra:errors:v1`) > **çalışma planı görevi** (mevcut "Bugün" listesi; profil başlangıç adımı "Üniversiteleri incele" bitmediyse önce o) > **profil eksiği** > boş durum. Her sonuç `{tur, baslik, aciklama, href, etiket, neden}`.
  - `apYaklasanTarihler(g)` (`:1043`): en yakın 3 tarih — rota adımları (ay düzeyinde, **gün uydurulmaz**: "Kasım 2026"), AP sipariş son günü / geç sipariş / sınav dönemi (`data/mevzuat/sinav-takvimi.js`, yalnızca lise öğrencisinde; K5-b), öğrencinin "Listem"deki sınavları (`data/mevzuat/sinavlar.js`; metin **tarihle başlıyorsa** okunur — `apTrTarihCoz` `:967`), modele uyan duyuru bitişleri. Geçmiş tarih yok; AP sipariş son günüyle aynı aydaki AP'ye bağlı rota adımı yinelenmez.
  - `apKaldiginYer(progress, dersler)` (`:1092`): en yeni **cevap damgası** (`answers[*].t`) olan ünite (ünitenin `seen` alanı sayfa açılınca tüm ünitelere yazıldığı için kullanılmadı).
- **`index.html` yeni sıra** (plan §2.3-A): karşılama (kompakt: Merhaba + rozetler + Profili düzenle · Hedefi değiştir) → model bilgi şeridi (`#bugun-serit`: lise mezununda "N açık duyuru · en yakın son gün", YL'de "Başvuru dosyan X / Y belge hazır"; ayrıntıya ↓ bağlantı) → **Sıradaki adım** kartı (`#siradaki` / `#next-step`, tek birincil düğme `#sa-git`, "Neden bu?" açılır notu, tür rozeti) + **Yaklaşan tarihler** (`#yaklasan`, takvim yaprağı rozeti, 14 gün içindekiler uyarı tonunda, "Tümü →" `rota.html?ulke=<aktif>`, ay düzeyi notu) → **Devam et** satırı (`#bugun-devam`: Kaldığın yer + ilerleme çubuğu · Yanlışlarım sayısı → Hata Defteri · Son deneme) → yedek hatırlatması → **Rota özeti** (`#panel-rota`, daraltılmış: 3 adım) → ders kartları → **Daha fazla** (`.dash-more`: duyurular `#mezun-panel`, YL dosyası `#yl-panel`, "Çalışma planın" `#todo-list` + ilerleme halkası + AP sayacı, başlangıç adımları, rehberler, KMK ön kontrolü, 2 yıllık yol haritası). Tüm eski kimlikler korundu; `index.html` artık `data/mevzuat/sinavlar.js`'i de yükler.
- Rota anahtarı (Almanya ↔ İtalya) değişince ve YL belge kutusu işaretlenince Sıradaki adım, Yaklaşan tarihler ve şerit yeniden hesaplanır.
- **CSS** `assets/css/styles.css` bölüm 32.4 (`:3595`): 1280 px'te Sıradaki adım (1,55 fr) + Yaklaşan (1 fr) yan yana, ≤ 900 px alt alta; Devam et 3 → 2 sütun; 560 px altında birincil düğme tam genişlik; `[hidden]` şerit gizli.
- **Yeni Node testi** `araclar/testler/bugun-birim-test.js` (40 kontrol): tarih okuma (baştaki tarih, aralık/geçersiz gün reddi), öncelik sırasının 6 basamağı, 14/15 gün sınırı, geçmiş ay, zorunlu > isteğe bağlı, yaklaşan sıralama/yineleme/geç sipariş/duyuru/n sınırı/boş liste, kaldığın yer; **gerçek veriyle** uçtan uca: gösterilen her gün düzeyindeki tarih `sinav-takvimi.js`/`sinavlar.js`'te, her ay düzeyindeki tarih rota çizelgesinde var (uydurma yok); lise mezunu "Şimdi · Ekim 2026" adımı 11 gün.

### Testler (yeni sözleşme)
- `tasarim-test.js`: panel sırası `karşılama → sıradaki adım → devam et → rota → dersler → ikincil`; 1280 px Yaklaşan Sıradaki adımın sağında ve ikisi ilk ekranda; tek birincil düğme + "Neden bu?"; plan/başlangıç/model panelleri ikincil grupta; 360 px'te Sıradaki adım düğmesi ilk ekranda (alt gezinmenin üstünde), Yaklaşan ilk 1,5 ekranda; yeni **5b** senaryoları (bugün sabit 20 Ekim 2026): a) yarım deneme önce, b) 6 açık hata → Yanlışlarımı çöz + Kaldığın yer Physics Unit 1, c) lise DE Yaklaşan `ap-kayit` (13 Kasım 2026) + Kasım AP rota adımı yinelenmez + Tümü → `rota.html?ulke=de`, d) lise mezunu: rota adımı öne geçer, duyuru şeridi, AP tarihi yok, e) üniversite mezunu: YL şeridi, Devam et gizli, Sıradaki adım = belge listesi, boş Yaklaşan.
- `rota-test.js`: panel özeti 4 → **3** adım (daraltılmış).

### Sonuçlar
- `pm-denetim` → **977 soru, 0 sorun**; `ad-denetimi` → **0 sorun**.
- Node 13/13: **bugun-birim 40** · eposta 119 · ilk-basvuru 4694 · mezun 59 · profil-v2 30 · rota 62 · sartlar 45 · secici 95 · sinav 183 · taslak 58 · toc 19 · ulke-veri 55 · universite-ister 0 hata.
- Tarayıcı (18/18 geçti): interact 27 · backup 56 · ulke-test 16 sayfa/0 hata · seviye 104 · pm-seviye 17 · hesap 163 · deneme 58 · **tasarim 85** (77 → 85) · mezun 54 · mezun-menu 24 · tasima 17 · tur11 88 · sinav 111 · yazisma-taslak 90 · yazisma 64 · calc-frq 20 · erisim 88 · rota 221.
- Ekran görüntüleri (16 tam sayfa; pageerror 0, taşma 0): `shots\t14-A3-{lise,lise-mezun,uni-mezun}-index-{1280,360}-{light,dark}.png`, `shots\t14-A3-misafir-sartlar-{1280,360}-{light,dark}.png`.

### Tık ölçümü
| Görev | Önce (plan §1.2) | A3 sonrası |
| :--- | ---: | ---: |
| G3 Bugün ne çalışayım | 0–1 tık + 2,7 ekran kaydırma (360 px) | **0 tık, 0 kaydırma** — Sıradaki adım ilk kart, düğmesi 360 px'te ilk ekranda |
| G4 Yarım denemeye dön | 3 | **1** (Sıradaki adım düğmesi) |
| G5 Yanlışlarım | 2 + 3 ekran kaydırma | **1** (Devam et › Yanlışlarım ya da ≥ 5 hatada Sıradaki adım) |
| G6 Son tarihler | 3–6 tık, 3–4 sayfa | **0** (ilk 3 tarih Bugün'de); tümü **1** ("Tümü →" Rotam; A5'te Başvuru › Son tarihler) |

### Açık kalanlar
- "Tümü →" şimdilik `rota.html?ulke=<aktif>`'e gider; A5'te Başvuru › Son tarihler şeridine bağlanacak. Üniversite mezununda tarihli rota olmadığı için Yaklaşan yalnızca "Listem"deki tarihli sınavlarla dolar (çoğu YL sınavı — IELTS, GRE — sabit tarih vermediği için çoğunlukla boş durum).
- Mezun/YL panellerinin içeriği plan gereği A4'te Hedefim'e taşınacak; A3'te tek satırlık şerit + ikincil gruptaki tam panel.
- "Yanlışlarımı çöz" A7'ye kadar Hata Defteri'ne (`ilerleme.html#hata-title`) gider; A7'de `deneme.html?mod=yanlislar`.

---

## A4 — Hedefim: ortak sekme çubuğu, üniversite listesi üstte, kartta İlk e-posta / Listeme ekle, mezun/YL panelleri Hedefim'de (20 Ekim 2026)

### Yapılanlar
- **Hedefim sekme çubuğu** (`assets/js/app.js:733-800` `APMEBERRA_HEDEFIM`, `apKendiSecim`, `apHedefimHref`, `initHedefimSekmeler`; çağrı `:991`): `sartlar.html`, `universiteler.html`, `rota.html` ana alanının en üstünde `<nav class="hedefim-bar" aria-label="Hedefim">` — **Şartlar · Üniversiteler · Rotam** (sayfalar arası gezinme olduğu için bağlantı + `aria-current="page"`, sekme rolü değil). Seçim adres satırından (model, sınıf, ülke, dil, düzey) taşınır, eksik parça profilden tamamlanır (adreste seçim yokken Şartlar sekmesi doğrudan kendi şartlarını açar, seçici değil). Sayfa seçimi `replaceState` ile değiştirince adresler etkileşim anında tazelenir. Ziyaretçide (K4) yalnızca Şartlar · Üniversiteler. `rota.html`'e dokunulmadı (çubuk app.js'ten eklenir).
- **Alt gezinme:** Hedefim artık doğrudan `universiteler.html`'e gider (`mobilBaglanti: true`, `app.js:248`) — A2 açık kalanı kapandı (Başvuru A5'te).
- **`universiteler.html`:** ilk 20 listesi (QS) sayfanın başında; başlık kısaltıldı, telefonda açıklama paragrafı gizli. Seçilmiş üniversiteler (arama + şehir; `#c-<cc>-uniler`, `#c-<cc>-q`, `#c-<cc>-city` korunur) listenin altında; **"<Ülke>: kabul nasıl işler?"** bölümünde özet + açılır bölümler (`<details id="c-de-kabul|isterler|sinavlar|takvim|kaynaklar">`, eski çapalar bölümü açar; `universiteler.html:186-240`). Eski sayfa içi atlama şeridi kaldırıldı (açılır başlıklar aynı işi görüyor).
- **Kart eylemleri** (`universiteler.html:77-96` `eylemHtml`, `universite-isterleri.js:270-361` isteğe bağlı 5. parametre `ek.eylemHtml`; eylemsiz çıktı birebir aynı): her satırda **Dersler ve İsterler** (çekmece) · **İlk e-posta** → `yazismalar.html?uni=<E.universiteKimligi(cc,u)>&amac=ilk-iletisim` · **Listeme ekle** (`aria-pressed`, "Listemde"). Ziyaretçide ikisi kilit ikonlu ve "Giriş gerekir" notlu; `giris.html?donus=<derin bağlantı>` (projede dönüş parametresi `donus`; plandaki `next` yerine mevcut ve `safeReturn` ile korunan parametre kullanıldı). `universiteler.html` artık `eposta.js`'i yükler (yalnız `universiteKimligi`).
- **"Listeme ekle" deposu:** yeni anahtar **eklenmedi**; mevcut `apmeberra:panel:v1` nesnesine `universitelerim: [kimlik]` alanı (sınav listesi `sinavlarim` ile aynı desen; yedek/geri yükleme anahtarı değişmedi). Filtre çubuğunda "Yalnızca listem (n)" süzgeci + boş durum.
- **`sartlar.html`:** "En iyi 20" listesi kaldırıldı (aynı veri iki kez listelenmiyor) → `#sr-ilk20` çapası korunarak **bağlantı kartı**: "Bu ülkenin N üniversitesi", seçime uyan sayı, ilk 3 ad, "N üniversitenin tümünü gör →" (Üniversiteler sekmesi, düzey/dil taşınır; `sartlar.html:398-425`). Atlama çipi "Üniversiteler". Oturumlu öğrencide "Giriş gerekmez" ibaresi kalkar.
- **Mezun/YL panelleri Hedefim'e taşındı (A3 açık kalanı):** `sartlar.html` `#sr-kisisel` (`:73`, `kisiselCiz` `:683`) — oturumlu öğrencinin modeline göre **duyurular** (`#mezun-panel`, tüm ülkeler, lise mezunu ya da duyurusu olan model) ve **YL başvuru dosyası** (`#yl-panel`, belge kontrol listesi; işaret aynı yere — rota durumu `genel.belgeler` — yazılır, ilerleme çubuğu). Kapalı açılır kartlar; çapa (`#mezun-panel`/`#yl-panel`) paneli açar ve kaydırır. `index.html`'den iki panel kaldırıldı; şerit ve YL Sıradaki adım bağlantısı `sartlar.html?<kendi seçimi>#…` (`index.html:575-594`, `SARTLAR_KENDI`); YL özeti DOM yerine veriden (`app.js:802` `apYlKalan`). Yaklaşan tarihlerdeki duyuru bağlantısı `sartlar.html#mezun-panel`.
- **CSS** `assets/css/styles.css` bölüm 32.5 (`:3682-3768`): sekme çubuğu (telefonda tam genişlik, ≥ 44 px), kart eylem satırı (telefonda çekmece tam satır + iki eylem yan yana), açılır bölümler, bağlantı kartı, kişisel paneller (`scroll-margin-top`), yazdırma ve azaltılmış hareket.

### Testler (yeni sözleşme)
- `tasarim-test.js` yeni **1c** (8 kontrol): 3 sayfada çubuk (ilk öğe, etiketler, `aria-current`, İtalya seçimi taşınır), adreste seçim yokken Şartlar = profil seçimi ve 1 tıkla Almanya şartları, klavye odağı, 360 px tam genişlik ≥ 44 px, ziyaretçide 2 sekme. 1b: Hedefim doğrudan bağlantı, liste davranışı Çalış ile; Bugün ikincil grupta model paneli yok; 5b e) YL Sıradaki adım ve şerit → `sartlar.html?model=uni-mezun&ulke=nl&dil=en#yl-panel`.
- `tur11-test.js` B2 (bağlantı kartı, liste tekrarı yok), D2 (Bugün'de YL şeridi) + **D2b** (YL dosyası Şartlar'da, işaret rota durumuna, Bugün şeridi 1/N), **C6** (ziyaretçi kilitli eylemler + giriş bağlamı), **C7** (İlk e-posta derin bağlantısı, Listeme ekle → `apmeberra:panel:v1.universitelerim`, Yalnızca listem, kalıcılık, çıkarma), **C8** (sıra ve çapa açılışı).
- `mezun-menu-test.js` 5): Bugün'de kart yok, şerit → Şartlar `#mezun-panel` (açık gelir), 12. sınıfta kişisel duyuru yok, bitişten sonra duyurusuz.
- `hesap-test.js`: takvim açılır bölümde kapalı, açınca geçmiş tarih soluk. `rota-test.js`: alt gezinmede Hedefim → Üniversiteler → çubukta Rotam. `universite-ister-test.js`: eylem satırı + eylemsiz çıktı değişmedi.

### Sonuçlar
- `pm-denetim` → **977 soru, 0 sorun**; `ad-denetimi` → **0 sorun**; `ulke-veri-olustur.js --kontrol` → 0 sorun.
- Node 13/13: bugun-birim 40 · eposta 119 · ilk-basvuru 4694 · mezun 59 · profil-v2 30 · rota 62 · sartlar 45 · secici 95 · sinav 183 · taslak 58 · toc 19 · ulke-veri 55 · universite-ister 0 hata.
- Tarayıcı (18/18 geçti): interact 27 · backup 56 · ulke-test 16 sayfa/0 hata · seviye 104 · pm-seviye 17 · **hesap 164** · deneme 58 · **tasarim 96** · mezun 54 · **mezun-menu 25** · tasima 17 · **tur11 93** · sinav 111 · yazisma-taslak 90 · yazisma 64 · calc-frq 20 · erisim 88 · rota 221.
- Ekran görüntüleri (48 + 3; pageerror 0, taşma 0): `shots\t14-A4-{lise,lise-mezun,uni-mezun,misafir}-{universiteler,sartlar,index}-{1280,360}-{light,dark}.png`, `shots\t14-A4-lise-universiteler-kart-1280-light.png`, `shots\t14-A4-lise-mezun-sartlar-duyuru-360-dark.png`.

### Tık / konum ölçümü (oturumlu lise, DE)
| Görev | Önce (plan §1.2) | A4 sonrası |
| :--- | ---: | ---: |
| G1 Uygun üniversite | 2–3 tık + 12–17 ekran kaydırma | **1 tık** (Hedefim); ilk kart 1280 px'te 797 px (ilk ekran), 360 px'te 1024 px (≈ 1,3 ekran) |
| G2 Üniversite isterleri | 4–5 | **2** (Hedefim → Dersler ve İsterler) |
| G7 İlk e-posta | 2–3 + üniversite arama | **2** (Hedefim → kartta İlk e-posta; A5'te hazır metin) |
| Ülke şartları (oturumlu) | 2 | **2** (Hedefim → Şartlar sekmesi; kendi seçimiyle açılır) |

### Arşiv
- **v14.5** (`SURUMLER.md` satırı).

### Açık kalanlar
- `index.html` dışında duyuru paneli yalnız Şartlar'da; Yaklaşan tarihlerdeki duyuru bağlantısı A5'te kendi seçimli adrese bağlanır.
- `rota.html` için ayrıca panel taşınmadı (brif: yalnız sekme çubuğu).


---

## A5 — Başvuru: üç sekme + Üniversiteye ilk e-posta (Ajan 14 Faz 2) + Son tarihler şeridi + K14-5 (20 Ekim 2026)

### Yapılanlar
- **`yazismalar.html` yeni düzen:** başlık "Başvuru ve yazışmalarım" → **Son tarihler şeridi** (`#son-tarihler`, `:29`) → "Portal e-posta göndermez … kendi adresinden sen gönderirsin" notu (`#durust-not`, tüm sekmelerin üstünde) → **üç sekme** (`role=tablist`, `:45`): **Üniversiteye ilk e-posta** (varsayılan, `#pnl-ilk`) · **Teyit taslakları** (`#pnl-teyit`: mevcut süzgeç, kişisel şablonlar `#sablonlar`, hazır taslaklar `#taslaklar`, oluşturucu `#olustur` — kimlikler aynen) · **Yazışma geçmişi** (`#pnl-gecmis`, `#gecmis`). Ok tuşları / Home / End, kayan tabindex, sekme sayaçları. Eski çapalar (`#sablonlar`, `#taslaklar`, `#olustur`, `#gecmis`) ve `?sablon=` / `?taslak=` ilgili sekmeyi açar; sayfa içi çapa değişimi (`hashchange`) de sekme seçer. Oluşturucu her açılışta Teyit sekmesine geçer; geçmişteki ilk e-posta kaydı "Aç ve düzenle" ile İlk e-posta sekmesinde açılır.
- **İlk e-posta bölümü** (Ajan 14 planı §3.1, ekran planı §3.5; betik `yazismalar.html:1056-1283`): Ülke (hedef ülkeler önce, 15 ülke) · Üniversite (`data/mevzuat/ulke/<cc>.js` gerektiğinde dinamik yüklenir, QS sırası, değer = `E.universiteKimligi`) · Program (isteğe bağlı, serbest metin) · Amaç (İlk iletişim / Takip; Takip'te ilk gönderim tarihi geçmişteki "Gönderildi" kaydından gelir). Önizleme: düzenlenebilir Konu + Gövde (`lang="en"`), canlı kelime sayacı (120–220), elle düzenlenince "Şablondan yeniden oluştur". **Kontrol** kartı: alıcı yalnız kaynaklı adres + "Adresin kaynağı" (yoksa "doğrulanmış e-posta adresi yok — iletişim sayfasındaki forma yapıştır" + iletişim/başvuru sayfası), Uzunluk, Eksikler → "Profilini tamamla" (`profil.html#pf-<alan>`; sınıf/yerleşme için `-group` çapası) / Sınavlar / "Yukarıdan seç", motor uyarıları, prosedür notu, **kendi adresinden gönder** hatırlatması, Dayanak listesi. Eylemler: **Kopyala** (konu + metin) · **E-posta programında aç** (`mailto`; uzunsa metni panoya alır) · **Taslak olarak kaydet** (`E.yeniKayit` → mevcut `apmeberra:yazisma:v1`) · **Gönderildi olarak işaretle** (eksik varken iki adımlı onay). **Derin bağlantı** `yazismalar.html?uni=<kimlik>&amac=ilk-iletisim|takip` sekmeyi ve seçicileri dolu açar; adres seçimle güncellenir. 1280 px: Önizleme + yapışkan Kontrol; ≤ 760 px: Kontrol önizlemenin **üstünde**, düğmeler 2×2 ve ≥ 44 px. Misafir: sayfa kilitli (K4) → `giris.html?donus=<derin bağlantı>`, girişten sonra aynı üniversiteye döner. `eposta.js`'e dokunulmadı (yalnız çağrı). **Ağ isteği yok; portal e-posta göndermez.**
- **Son tarihler şeridi** (`yazismalar.html:1285`; girdi `app.js:1191` `apSonTarihGirdisi`): rota adımları, AP takvimi (lise), Listem'deki sınavlar, modele uyan duyurular; ilk 4 görünür, "+N tarih daha"; "Rotam · Sınavlar" bağlantıları (telefonda Başvuru › Sınavlar yolu). Bugün'deki **"Tümü →" artık `yazismalar.html#son-tarihler`** (A3 açık kalanı; odak şeride).
- **K14-5 (kullanıcı kararı):** `apYaklasanTarihler` (`app.js:1128`) süresi dolan gün düzeyindeki tarihi düşürmez → `suresiDoldu`, `gecenGun`, `sonraki`, `sonrakiMetni` ("Sonraki dönem: …" ya da "Sonraki dönem tarihi henüz açıklanmadı"). İsteğe bağlı **`sonrakiTarih`** alanı okunur (AP takviminde `kayit.sonrakiTarih`, `kayit.gecKayitSonrakiTarih`, `sinavDonemi.sonrakiTarih`; sınav ve duyuru kayıtlarında `sonrakiTarih`; ISO ya da "12 Kasım 2027"); geçmiş `sonrakiTarih` kullanılmaz, gün eklenmez. Süresi dolanlar yaklaşanların **arkasında**, en yeni dolan önce, `nGecmis` (varsayılan 3) sınırıyla. Bugün kartında en fazla 2 ("Süresi dolanlar" alt satırı, `index.html:72` `#yt-gecmis`), Son tarihler şeridinde en fazla 4. Geciken rota adımları dönemlik tarih değil görev olduğu için Rotam'daki "tarihi geçti" davranışı korundu. AP standart sipariş tarihi geçince geç sipariş yaklaşanlarda, standart tarih "Süresi doldu" satırında. Veri eklenmedi (`data/**` PM/Ajan 13).
- **Alt gezinme:** Başvuru doğrudan `yazismalar.html` (`app.js:269`, `mobilBaglanti: true`) — A2 açık kalanı tamamen kapandı.
- **CSS** bölüm 32.6 (`styles.css:3770` ve sonrası): şerit, sekmeler (telefonda 3 sütun), İlk e-posta ızgarası, Kontrol kartı, sayaç rozetleri, süresi dolanlar, yazdırma.

### Testler
- **Yeni `araclar/testler/ilk-eposta-test.js` (49 kontrol):** misafir → giriş (`donus` korunur, bağlam kartı); lise × TUM derin bağlantı (sekme, ülke, üniversite, profil bilgili metin, kaynaklı alıcı, Bilgiler tamam, sayaç, Dayanak, hatırlatma, mailto); canlı sayaç + yeniden oluştur; program alanı; Kopyala (pano); mailto durum iletisi; Taslak → `apmeberra:yazisma:v1`; Gönderildi aynı kayıt; Geçmiş etiketi ve geri açma; Takip (tarih geçmişten, ayrı kayıt); PoliMi kaynaksız alıcı; eksik okul (işaret, `profil.html#pf-okul`, koşullu blok, iki adımlı Gönderildi); lise mezunu ve üniversite mezunu doğru şablon; sekmeler klavye + eski çapalar + `?sablon=`; Son tarihler (Bugün "Tümü →", ilk 4 + daha fazla) ve **K14-5** (20 Kasım: "Süresi doldu … henüz açıklanmadı", yaklaşanların önüne geçmez); Üniversiteler kartından 1 tık; 360 px açık/koyu (taşma 0, Kontrol üstte, ≥ 44 px, Başvuru doğrudan); **yerel sunucu dışında istek 0**.
- `bugun-birim-test.js` 40 → **50** (K14-5 senaryoları: geçmiş tarih "Süresi doldu" + "henüz açıklanmadı", `sonrakiTarih` ISO/TR, geçmiş `sonrakiTarih` reddi, `nGecmis` ve sıra, geçmiş sınav/duyuru sonda, duyuru bağlantısı; gerçek veride süresi dolanlar da veride).
- `yazisma-test.js` 64 → 65, `yazisma-taslak-test.js` 90 → 91 (Teyit/Geçmiş sekmesine geçiş, sekme sayacı, not metni), `tasarim-test.js` (Başvuru doğrudan bağlantı, "Tümü →" `yazismalar.html#son-tarihler`), `rota-test.js` (yazışma şablon sırası Teyit sekmesinde).

### Sonuçlar
- `pm-denetim` → **977 soru, 0 sorun**; `ad-denetimi` → **0 sorun**; `ulke-veri-olustur.js --kontrol` → 0 sorun.
- Node 13/13: **bugun-birim 50** · eposta 119 · ilk-basvuru 4694 · mezun 59 · profil-v2 30 · rota 62 · sartlar 45 · secici 95 · sinav 183 · taslak 58 · toc 19 · ulke-veri 55 · universite-ister 0 hata.
- Tarayıcı (**19/19**): interact 27 · backup 56 · ulke-test 16 sayfa/0 hata · seviye 104 · pm-seviye 17 · hesap 164 · deneme 58 · tasarim 96 · mezun 54 · mezun-menu 25 · tasima 17 · tur11 93 · sinav 111 · **yazisma-taslak 91** · **yazisma 65** · calc-frq 20 · erisim 88 · rota 221 · **ilk-eposta 49 (yeni)**.
- Ekran görüntüleri (32 + 5; pageerror 0, taşma 0): `shots\t14-A5-{lise,lise-mezun,uni-mezun,misafir}-{yazismalar,index}-{1280,360}-{light,dark}.png` (misafir → giriş), `shots\t14-A5-lise-yazismalar-polimi-kaynaksiz-1280-light.png`, `shots\t14-A5-lise-eksik-kontrol-360-light.png`, `shots\t14-ilk-eposta-{1280-light,360-light,360-dark}.png`.

### Tık ölçümü
| Görev | Önce (plan §1.2) | A5 sonrası |
| :--- | ---: | ---: |
| G7 İlk e-posta (üniversite kartından) | 2–3 + üniversite arama | **1** (kartta İlk e-posta → doldurulmuş metin) |
| G7 İlk e-posta (Başvuru'dan) | 2–3 | **2** (Başvuru → varsayılan sekme, aktif rota ülkesi seçili → üniversite seç) |
| G6 Son tarihler (tümü) | 3–6 tık, 3–4 sayfa | **1** (Bugün "Tümü →" ya da Başvuru) |

### eposta.js / şablon notları (Ajan 14'e; düzeltilmedi)
- `data/kocluk/ilk-basvuru-sablonlari.js:217-221` ülke notları öğrenciye "(Y1)", "(K1, K8)" gibi yönerge kodlarıyla gösteriliyor; Dayanak listesi yalnız URL verdiği için kodlar öğrenci için çözülemiyor.
- `assets/js/eposta.js:92` (`ogrenci.sinif` → `sinif`) ve `:104` (`ogrenci.yksYerlesme` → `yerlesmeDurumu`): profil sayfasında `pf-sinif` / `pf-yerlesmeDurumu` kimliği yok (`-group` var); arayüz eşlemeyle çözdü, `KAYNAK`'a isteğe bağlı `capa` alanı önerilir.
- KIT için genel ilk e-postada programa özel Carl Benz adresi dönüyor (Ajan 14 planı §4 madde 4; karar Ajan 13'te).

### Arşiv
- **v14.6** (`SURUMLER.md` satırı).

### Açık kalanlar
- `sonrakiTarih` verisi yok; süresi dolanlar şimdilik "henüz açıklanmadı" der (PM, Ajan 13'ten sonra aktaracak).
- Duyurular `duyuruSuz` ile bitişten sonra süzüldüğü için süresi dolan duyuru Bugün/Son tarihler'e ulaşmaz (motor davranışı değiştirilmedi).
- "10 iş günü sonra takip" önerisi yalnız Gönderildi iletisinde; geçmişte otomatik öneri yok.

---

## A6 — Çalış merkezi `calis.html` + K4 kilit listesi (20 Ekim 2026)

### Yapılanlar
- **Yeni `calis.html`** (247 satır; plan §2.3-C): başlık "Ne çalışayım?" → **Sıradaki çalışma** kartı (`#calis-siradaki`, tek birincil düğme `#cs-git`, "Neden bu?") + **Kaldığın yer** listesi (`#ck-list`: son ünite `apKaldiginYer` · yarım deneme · son deneme `deneme.html?sonuc=<id>`; boş durum metni) → **Derslerin** ızgarası (`#calis-grid`, 7 kart: 6 AP + CEnT-S; ders renginde üst çizgi, kapsam halkası `--p` = çözülen / bankadaki soru, "X / Y soru · %Z doğru", derse ait açık hata sayısı, dersin kendi "Kaldığın yer" ünitesi, son deneme, eylemler **Konu anlatımı** (`<ders>.html`) + **Deneme** (`deneme.html?ders=<kod>`; Calculus AB/BC, Seçmeliler CS A/Ekonomi → 9 deneme kodu)) → **Ölç ve tekrar et** (Denemeler · Yanlışlarım · Seviye testi kartları; yarım deneme / geçmiş / seviye raporu durumuna göre metin) + İstanbul sınav rehberi ve İlerleme bağlantıları. Üniversite mezunu: ders içeriği gizli, "Çalış alanı lise öğrencileri ve lise mezunları içindir" kartı → `sinavlar.html?model=uni-mezun`. 2 MB deneme bankası yüklenmez (deneme kodları sayfada sabit; sayılar ilerleme deposundan).
- **"Bugün ne çalışayım" tutarlılığı:** index.html'deki satır içi çalışma planı hesabı **app.js'e taşındı** (`apCalismaPlani`, `app.js:1247`, Bugün bölümünde; sıra ve metinler aynı: hata → en zayıf ünite → kaldığın yer / ilk soru bankası → seviye testi (≤ 60 gün başa) → son tarihler). Bugün (`index.html:597`) ve Çalış aynı fonksiyonu + `apSiradakiAdim` önceliklerini kullanır; Çalış'ta rota ve profil adımları girdi değildir (onlar Bugün'de öne geçebilir — "Neden bu?" notunda söylenir). `APMEBERRA.bugun.calismaPlani` dışa açık.
- **Menü:** Çalış artık doğrudan `calis.html` (`app.js:258`; A1'in geçici açılır menüsü kalktı). Yeni `etkinSayfalar` alanı (`app.js:259`, `apNavEtkin` `:293`): 6 ders sayfası, `sinav-cents`, `deneme`, `seviye-testi`, `istanbul-sinav-rehberi` ve `calis`'te Çalış etkin. Alt gezinmede Çalış doğrudan bağlantı → beş öğenin hepsi doğrudan sayfaya gider (alttan açılan liste kodu yerinde, kullanan öğe yok). Üniversite mezunu menüsü değişmedi.
- **K4:** `calis.html` `APMEBERRA_ACIK_SAYFALAR`'da **yok** → giriş gerektirir (`giris.html?donus=calis.html`); misafir listesi değişmedi. `giris.html:263-265`: bağlam kartında "Çalış" adı ve "Ders çalışma ve soru çözme kişisel hesabınla açılır" başlığı.
- **CSS** bölüm 32.7 (`styles.css:3870` ve sonrası): kaldığın yer listesi, ders kartları (`minmax(min(100%,300px),1fr)`), halka ders renginde, ölç kartları 3 → 2 → 1 sütun, ≤ 560 px'te eylem düğmeleri ≥ 44 px ve kart açıklaması gizli, yazdırma.

### Testler (yeni sözleşme)
- `tasarim-test.js`: PAGES'e `calis` (360 px taşma/hata); 1b: alt gezinmede 5 doğrudan bağlantı (liste düğmesi yok), Çalış dokunuşu calis.html'i açar ve etkin olur (liste testleri kaldırıldı — liste kullanan öğe kalmadı); **yeni 5c (7 kontrol):** menüde Çalış = calis.html, açılır menü yok, calis ve ders sayfasında yalnız Çalış etkin; 7 kart + 7 konu + 9 deneme bağlantısı; 6 hatada Sıradaki çalışma = Bugün Sıradaki adım (başlık + hedef); Kaldığın yer Physics Unit 1, Yanlışlarım 6, Physics kartında 6 açık hata; yarım deneme iki ekranda da önce; boş durumda Çalış = Bugün "Çalışma planın" ilk görevi; üniversite mezunu bilgi kartı.
- `erisim-test.js`: `calis` kilitli sayfalar listesinde, girişte çalışma bağlamı. `hesap-test.js`: ders sayfasında Çalış bağlantısı etkin; açılır menü klavye deseni (ArrowDown/End/Escape) Hedefim alt menüsünde; telefonda Çalış → calis.html. `interact.js`: Çalış bağlantısı + Hedefim açılır menüsü. `seviye-test.js`: menüde Çalış, Çalış'ta Seviye testi kartı. `bugun-birim-test.js` 50 → **58** (`apCalismaPlani`: boş/mezun/rapor/≤ 21 gün/> 60 gün/geçmiş kayıt günü/dolu sıra, Sıradaki adım ile birlikte).

### Sonuçlar
- `pm-denetim` → **977 soru, 0 sorun**; `ad-denetimi` → **0 sorun**.
- Node 13/13: **bugun-birim 58** · eposta 119 · ilk-basvuru 4694 · mezun 59 · profil-v2 30 · rota 62 · sartlar 45 · secici 95 · sinav 183 · taslak 58 · toc 19 · ulke-veri 55 · universite-ister 0 hata.
- Tarayıcı (19/19, sırayla tek Chromium): interact **28** · backup 56 · ulke-test 16 sayfa/0 hata · seviye **105** · pm-seviye 17 · hesap 164 · deneme 58 · tasarim **100** · mezun 54 · mezun-menu 25 · tasima 17 · tur11 93 · sinav 111 · yazisma-taslak 91 · yazisma 65 · calc-frq 20 · erisim **89** · rota 221 · ilk-eposta 49.
- Ekran görüntüleri (32, tam sayfa; pageerror 0, taşma 0): `shots\t14-A6-{lise,lise-mezun,uni-mezun,misafir}-{calis,index}-{1280,360}-{light,dark}.png` (misafir → giriş bağlam kartı).

### Tık ölçümü
| Görev | Önce | A6 sonrası |
| :--- | ---: | ---: |
| G3 Bugün ne çalışayım (Çalış'tan) | — (Çalış açılır menü, merkez yok) | **1** (Çalış → Sıradaki çalışma ilk kart) |
| Bir dersin konu anlatımı | 2 (Çalış ▾ → ders) | **2** (Çalış → kartta Konu anlatımı); telefonda 2 (önce 2) |
| G4 Yeni ders denemesi | 2 + 2 (Çalış ▾ → Denemeler → ders → Başlat) | **3** (Çalış → kartta Deneme → Başlat) |
| G4 Yarım deneme | 1 (Bugün) | 1 (Bugün) / 2 (Çalış → Kaldığın yer) |

### Açık kalanlar
- "Yanlışlarımı çöz" (Çalış ve Bugün) A7'ye kadar Hata Defteri'ne gider.
- Ders kartlarındaki halka yalnızca açılmış ünitelerin soru sayısını bilir (ilerleme deposu); hiç açılmamış derste "Henüz başlanmadı" gösterilir (2 MB banka yüklenmez).

---

## A7 — Yanlışlarım modu (`deneme.html?mod=yanlislar`) + deneme sonuç ekranı eylemleri (20 Ekim 2026)

### Yapılanlar
- **Yanlışlarım modu** (`assets/js/deneme.js`, yalnız arayüz/akış katmanı): `deneme.html?mod=yanlislar[&ders=<kod>][&deneme=<sonuç id>]` (boot `:1049`). Soru havuzu = Hata Defterindeki **açık** kayıtlar (`apmeberra:errors:v1`, `resolved:false`) ∩ deneme bankası (`yanlisHavuzu` `:147`; anahtar `<sayfa>|<id>`, soru `BY_KEY["<sayfa>.html|<id>"]`); bankada olmayan açık hata sayılır ve Hata Defteri'ne yönlendirilir. **Yeni depolama anahtarı yok**; `apmeberra:deneme:v1` aktif/geçmiş kaydına yalnız ek alanlar: `kod:"yanlislar"`, `mod:"yanlislar"`, `kaynakDeneme` (her sorunun kendi ders kodu `sorular[i].kod`). Kurulum (`renderYanlislar` `:305`): özet (Açık hata · Bu oturumda çözülebilir · Ders sayfasında), ders süzgeci (hata sayılı; `?ders=` ön seçim), soru sayısı (Hepsi / en yeni 10 / 20 — havuz büyükse), tek düğme "Yanlışlarımı çözmeye başla (N soru)". Oturum (`startYanlislar` `:382`) mevcut sınav ekranını kullanır: süresiz, ders etiketi, doğru/yanlış gösterilmez, yenilemede kaldığı yerden sürer; sıra ders → ünite → pasaj → numara (pasajlı sorular yan yana). **Hata kapatma mevcut `writeErrors` ile** (değişmedi): doğru → `resolved:true` + `resolvedDate`, yanlış → açık kalır (`count+1`), boş → dokunulmaz. Başka bir deneme yarımsa önce o deneme açılır + uyarı (`#dn-y-once`, tek aktif deneme kuralı). **Boş durum** (`#dn-yanlis-bos`): "Açık hatan yok" (Deneme çöz · Çalış · Bugün'e dön), "Açık hataların deneme havuzunda değil" (Hata Defteri'ne git), "Bu denemenin açık yanlışı kalmadı" (Tüm yanlışlarım). Denemeler giriş ekranında Yanlışlarım kısayol kartı (`yanlisGirisKarti` `:294`, `#dn-yanlis-kart`).
- **Sonuç ekranı eylemleri** (`sonucEylemleri` `:904`; özet kutularının hemen altında, plan §2.3-E): tek birincil **"Yanlış N soruyu şimdi çöz"** (`deneme.html?mod=yanlislar&deneme=<id>`: bu denemenin hâlâ açık yanlışları; yoksa "Yanlışlarımı tekrar çöz (N)" tüm açık hatalar; hiç yoksa "Açık hatan kalmadı" notu) · ikincil **"Konu anlatımı: Unit X …"** (bu denemede oranı en düşük ünite; `<ders>.html#konu-<soru kabı>`) · üçüncül **"Bugün'e dön"** ve "Soru soru incele ↓" (incelemeye kaydırıp odaklar; sayfa yeniden çizilmez). Yanlışlarım oturumunun sonucunda tahmini bant yerine **"N hata kapandı · M hata açık kaldı"** kutusu (`#dn-y-sonuc`); alt eylem "Yanlışlarıma dön". Geçmiş/mini grafik adı "Yanlışlarım tekrarı"; karma kayıtlarda (genel + yanlışlar) ders noktası ve bant yok (`karma()`).
- **Ünite çapası** (`assets/js/app.js:2519`, `initQuizHashFocus`): `#konu-<soru kabı>` → o soru istasyonundan önceki en yakın konu anlatımı `h2`'si (İçindekiler'deki `AP_TOC_QUIZ` kuralıyla) görünür ve odakta (`data-konu-hedef`). `ap-*.html` içeriğine dokunulmadı.
- **"Yanlışlarımı çöz" bağlantıları moda gider:** Bugün Sıradaki adım (≥ 5 hata, `app.js:1094`), çalışma planı hata görevi (`app.js:1255`, etiket "Yanlışlarımı çöz"), Bugün Devam et › Yanlışlarım (`index.html:87`), Çalış › Yanlışlarım (`calis.html:73`) ve ders kartındaki "N açık hata" (`calis.html:210`, tek deneme kodlu derste `&ders=`), İlerleme › Hata Defteri yeni "Tek oturumda çöz" düğmesi (`ilerleme.html:113`). `deneme.html` altbilgisi "← Bugün ekranına dön".
- **CSS** `assets/css/deneme.css:229` ve sonrası: kısayol kartı, özet ızgarası (telefonda 3 sütun sıkı), boş durum, sonuç eylem şeridi (≤ 640 px tam genişlik, ≥ 44 px), Hata Defteri sonuç kutusu, yazdırmada gizli; program odağı alan `#dn-h1`'de görsel halka yok.
- Soru nesnesi şeması, soru içerikleri, `data/sorular/**`, `deneme-bankasi-olustur` değişmedi; ağ isteği yok.

### Testler
- **Yeni `araclar/testler/yanlislar-test.js` (32 kontrol):** boş durum (metin, 3 bağlantı, odak) + giriş kartı boş; 6 açık hata (4 Physics + 2 Chemistry, gerçek banka) + 1 bankada olmayan tohumu; kısayol kartı; `?ders=chemistry`; özet 7 · 6 · 1, ders süzgeci, sıfır seçimde kapalı düğme; oturum sırası ve ders kodları, süresiz, geri bildirim yok; yenilemede Soru 4 / 6; teslim: 4 doğru · 1 yanlış · 1 boş → 4 hata kapandı (resolvedDate), yanlış count 2, boş ve bankada olmayan dokunulmadı; sonuç kutusu ve eylemler (sıra, hedefler, özetin altında); "Soru soru incele"; **Konu anlatımına dön → ap-chemistry Unit 1 anlatım başlığı görünür + odakta**; kalan 2'yi doğru çöz → hepsi kapandı, "Açık hatan kalmadı", mod "deneme havuzunda değil"; normal Physics denemesinde yarım deneme uyarısı, "Yanlış N soruyu şimdi çöz" (`&deneme=`, N bağımsız hesap) → yalnız o denemenin N yanlışı; Bugün/Çalış/İlerleme bağlantıları ve Bugün'den 1 tık; 360 px açık/koyu (kurulum, sınav, sonuç; eylemler tam genişlik ≥ 44 px, taşma 0); sayfa hatası 0; ağ isteği 0 (yalnız mevcut MathJax CDN girişimi engellendi).
- `bugun-birim-test.js` (58): Sıradaki adım ve çalışma planı hata hedefi `deneme.html?mod=yanlislar`. `tasarim-test.js` 5b b): Bugün → `deneme.html?mod=yanlislar`; 5c: Çalış Yanlışlarım = Bugün hedefi. `BENIOKU.md` tablosu güncellendi.

### Sonuçlar
- `pm-denetim` → **977 soru, 0 sorun**; `ad-denetimi` → **0 sorun**.
- Node 13/13: bugun-birim 58 · eposta 119 · ilk-basvuru 4694 · mezun 59 · profil-v2 30 · rota 62 · sartlar 45 · secici 95 · sinav 183 · taslak 58 · toc 19 · ulke-veri 55 · universite-ister 0 hata.
- Tarayıcı (**20/20**, sırayla tek Chromium): interact 28 · backup 56 · ulke-test 16 sayfa/0 hata · seviye 105 · pm-seviye 17 · hesap 164 · deneme 58 · tasarim 100 · mezun 54 · mezun-menu 25 · tasima 17 · tur11 93 · sinav 111 · yazisma-taslak 91 · yazisma 65 · calc-frq 20 · erisim 89 · rota 221 · ilk-eposta 49 · **yanlislar 32 (yeni)**.
- Ekran görüntüleri (32 + 7; pageerror 0, taşma 0): `shots\t14-A7-{lise,lise-mezun,uni-mezun,misafir}-{deneme,index}-{1280,360}-{light,dark}.png` (mod sayfası, 6 açık hata tohumlu; misafir → giriş), `shots\t14-A7-yanlislar-{kurulum,sonuc}-{1280-light,360-light,360-dark}.png`, `shots\t14-A7-yanlislar-sinav-360-light.png`.

### Tık ölçümü
| Görev | Önce (plan §1.2) | A7 sonrası |
| :--- | ---: | ---: |
| G5 Yanlışlarımı tekrar et | 2 + soru başına 2 (her soru ayrı ders sayfası) | **2, tek oturum** (Bugün/Çalış › Yanlışlarım → Başlat) |
| G5 Deneme sonucundan yanlışlar | — (yalnız Hata Defteri notu) | **2** (Yanlış N soruyu şimdi çöz → Başlat) |
| Zayıf ünitenin konu anlatımı (sonuçtan) | 2+ (tablo › Ders sayfası → kaydırma) | **1** (başlık görünür ve odakta) |
| G4 Yarım deneme | 1 | 1 (değişmedi) |

### Açık kalanlar
- Bankada olmayan hatalar (ders sayfasındaki ama deneme havuzuna girmemiş soru) mod dışında kalır; Hata Defteri'nden çözülür (sayısı ekranda söylenir).
- Yanlışlarım oturumu süresizdir; tempo seçeneği eklenmedi (bilerek: tekrar oturumu).
- `deneme.html` başındaki MathJax CDN betiği önceden vardı (çevrimdışıda formüller düz metin); bu aşamada değiştirilmedi.
