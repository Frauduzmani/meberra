# AP MEBERRA — Klasör ve Veri Haritası

> Bu dosya her verinin nerede durduğunu ve hangi sayfada gösterildiğini anlatır.
> Yeni bir sayfa ya da veri dosyası eklenince bu harita da güncellenir; değişiklik `proje.md`'ye işlenir.
> İlk hazırlık: 14 Ekim 2026 (Tur 10, PM). **Durum: 1. aşama (dosya taşıma) 14 Ekim 2026'da uygulandı (Ajan 11).** 2. aşama (soruları sayfadan ayırma) ayrı turda.

---

## 1. Klasör yapısı (uygulandı)

Sayfalar (`*.html`) kökte kalır. Böylece adresler, yer imleri ve sunum paketi bozulmaz. Diğer her şey amacına göre klasörlenir.

```
AP MEBERRA/              (klasör tur sonunda "AP AZRA" adından yeniden adlandırılır)
├── *.html                  Sayfalar (adresleri değişmez; liste §2)
├── AGENTS.md               Ajan protokolü (kökte kalmalı)
├── proje.md                Tek kayıt (kökte kalır)
├── DEVAM-NOKTASI.md        Yeni oturum özeti (kökte kalır)
├── HARITA.md               Bu dosya
│
├── assets/
│   ├── css/                styles.css, deneme.css
│   └── js/                 app.js, auth.js, eposta.js, rota.js, seviye.js, deneme.js,
│                           sartlar-motor.js (şartlar + Mezun Menüsü motoru), sartlar-ui.js (ortak madde bileşeni),
│                           1.22.0: hedef-motor.js (hedef sihirbazı motoru: seçim, şart hücresi, ortak yol, profil yaması),
│                           hedef-sihirbaz.js (/ulkem sihirbaz arayüzü; stil css/hedef.css)
│                           1.23.0: konu-modu.js (ünite sayfasında konu yolu + konu paneli + konuya göre soru süzgeci; stil css/konu-modu.css)
│                           1.25.0: kelime-kopru.js (kelimeye dokun → Türkçe; sözlük data/sozluk/ap-sozluk.json) · 1.26.0: ap-nedir.js (/ap-nedir)
│                           sinav-motor.js (Tur 12: sınav süzgeci — model/ülke/dil/düzey)
│
├── data/
│   ├── mevzuat/            ülke ve kabul verisi (herkese açık sayfalar okur)
│   │   ├── kaynak/               Tur 11: TEK KAYNAK (PM onaylı JSON; sayfalar okumaz, pakete girmez)
│   │   │                         lisans-<cc>, yl-<cc>, uni-<cc>, yl-genel, duyurular, mezun-notlari, ulkeler-meta
│   │   ├── ulke-dizini.js        ÜRETİLİR: 15 ülke özeti (rozet, program durumu, özet uyarısı, genel yol şablonu)
│   │   ├── ulke/<cc>.js          ÜRETİLİR: ülke başına lisans + YL + ilk 20 + isterler (1.22.0 şart tablosu; seçilince dinamik yüklenir; 15 dosya)
│   │   │                         Kaynak: kaynak/isterler-<cc>.json · denetim araclar/isterler-denetim.js
│   │   ├── yl-genel.js           ÜRETİLİR: tüm ülkeler için ortak YL notları
│   │   ├── duyurular.js          ÜRETİLİR: model/ülke/dil hedefli duyurular (bitiş tarihine kadar)
│   │   │                         Üretici: node araclar/ulke-veri-olustur.js (--kontrol, --kaynak, --cikti)
│   │   ├── ulkeler.js
│   │   ├── ulke-rotalari.js      (+ APMEBERRA_ROTA_UYARILARI, Tur 10 K4-a)
│   │   ├── sartlar.js            (K4) — Tur 11'de kaynak/'a taşındı; testler eşdeğerlik için okur, sayfalar okumaz
│   │   ├── mezun-ulkeler.js      (Tur 10 Mezun Menüsü) — Tur 11'de kaynak/'a taşındı; aynı durum
│   │   ├── sinavlar.js           (Tur 12: 47 kayıt, 15 ülke; aktarım: node araclar/sinav-aktar.js ← .agents/mevzuat/dogrulama/sinavlar-tur12.json)
│   │   └── sinav-takvimi.js
│   ├── sozluk/             1.25.0: ap-sozluk.json ÜRETİLİR (node araclar/sozluk-olustur.js ← araclar/sozluk/kelimeler.json + konu terimleri)
│   ├── dersler/            1.23.0: konu anlatımları <ders>/unite-<n>.json (hedefler, anlatım, örnekler, ipuçları, sık hatalar, terimler)
│   │                         dizin.json ÜRETİLİR: node araclar/ders-veri-denetim.js --dizin (denetim aynı araçla)
│   ├── rehber/
│   │   └── bilgi-merkezi.js
│   ├── kocluk/             kişisel koçluk verisi (yalnızca girişten sonra)
│   │   ├── eposta-sablonlari.js
│   │   ├── ilk-basvuru-sablonlari.js   (Tur 14, Ajan 14) 36 İngilizce ilk başvuru / takip şablonu; motor eposta.js ilkBasvuruHazirla()
│   │   └── teyit-taslaklari.js   ÜRETİLİR (Tur 12): 72 hazır teyit taslağı; node araclar/teyit-taslak-olustur.js
│   └── sorular/            soru verisi (yalnızca girişten sonra)
│       ├── deneme-bankasi.js   (üretilir: araclar/deneme-bankasi-olustur.js)
│       └── seviye/             biology.js, calculus.js, chemistry.js, english-language.js, physics-1.js, _ornek.js
│                               (2. aşamada ders soruları için data/sorular/ders/ eklenecek)
│
├── kaynaklar/
│   ├── eposta-ornekleri/   (Tur 14) anonim/yonergeler.md: 11 resmi e-posta yönergesi; ham/ kişisel veri, arşive girmez (şu an boş)
│   └── pdf/                26 PDF; envanter kaynak-listesi.json (tür, telif, paket=true/false). Ticari kitaplar paket=false: yerelde kalır, portaldan bağlantı verilmez
│
├── belgeler/
│   └── hibe/               hibe modülleri (eski grants/, 4 modül)
│
├── araclar/                denetimler, üreticiler, testler, vendor
│                           Tur 11–12: mevzuat-aktar.js (PM; dogrulama → data/mevzuat/kaynak), ulke-veri-olustur.js,
│                           sinav-aktar.js, teyit-taslak-olustur.js, surum-arsivle.js (sürüm arşivi)
├── arsiv/surumler/         Sürüm arşivi zip dosyaları (günlük: SURUMLER.md; ad-denetimi atlar)
├── sunum/
│   ├── AP-MEBERRA/             güncel paket kaynağı (sunum-olustur üretir)
│   ├── AP-MEBERRA-Sunum-*.zip  güncel paketler
│   └── arsiv/                  AP MEBERRA adından önceki paket klasörü (AP-AZRA) ve AP-AZRA-*.zip paketleri
│
├── .agents/                Ajan kuralları ve mevzuat notları
└── .claude/agents/         Ajan tanımları
```

---

## 2. Sayfa → veri haritası

**Erişim:** *Açık* = giriş gerekmez (K4, 14 Ekim 2026). *Kilitli* = kişisel koçluk, giriş gerekir.
Açık sayfa listesinin tek kaynağı `assets/js/app.js` içindeki `APMEBERRA_ACIK_SAYFALAR`'dır.
Her sayfa ayrıca `assets/css/styles.css` ve `assets/js/app.js` yükler (aşağıda tekrar yazılmadı).

### Herkese açık sayfalar — ülke şartları ve genel bilgi

| Sayfa | Ne gösterir | Okuduğu veri | Ek betik |
| :--- | :--- | :--- | :--- |
| `sartlar.html` (Tur 11; 1.22.0) | **Varsayılan: hedef sihirbazı** (ülkeler → okullar → şart tablosu + ortak yol → planı uygula; `hedef-motor.js`, `hedef-sihirbaz.js`, `ulke/<cc>.js` `isterler`). Adreste `dil=` varsa ülke ayrıntısı: durum → sınıf → 15 ülke → dil seçicisi; şartlar, burslar, dil sınavları, ilk 20 önizlemesi, tarihli ya da genel yol haritası | `data/mevzuat/ulke-dizini.js`, `ulke/<cc>.js` (dinamik), `duyurular.js`, `yl-genel.js`, `sinavlar.js`, `ulke-rotalari.js` | `eposta.js`, `rota.js`, `sartlar-motor.js`, `sartlar-ui.js` |
| `mezun.html` (Tur 11: yönlendirme) | `sartlar.html?model=lise-mezun[&ulke=..]` adresine yönlendirir (eski yer imleri) | — | — |
| `almanya-muhendislik.html` | Almanya kabul rehberi | Sayfa içi metin | — |
| `italya-muhendislik.html` | İtalya kabul rehberi | Sayfa içi metin | — |
| `universiteler.html` (Tur 11) | 15 ülke sekmesi; QS ülke içi ilk 20 (düzey/dil filtresi); DE/IT seçilmiş üniversiteler ve programlar | `data/mevzuat/ulke-dizini.js`, `ulke/<cc>.js`, `ulkeler.js`, `sinavlar.js` | `sartlar-motor.js`, `sartlar-ui.js` |
| `sinavlar.html` (Tur 12) | Durum → sınıf → ülke → sınav dili seçimi; AP, giriş, dil sınavları (12 dil), GRE/GMAT; üniversite mezununda AP gizli | `data/mevzuat/sinavlar.js`, `data/mevzuat/ulke-rotalari.js`, `ulke-dizini.js` | `rota.js`, `sinav-motor.js` |
| `istanbul-sinav-rehberi.html` | İstanbul AP sınav merkezleri | Sayfa içi metin | — |
| `bilgi-merkezi.html` | Sık sorulan sorular | `data/rehber/bilgi-merkezi.js` | — |
| `ajanlar.html` | Uzman ekip | Sayfa içi metin + `app.js` ajan metinleri | — |
| `giris.html` | Giriş / kayıt | — | `auth.js` |

### Kilitli sayfalar — kişisel koçluk

| Sayfa | Ne gösterir | Okuduğu veri | Ek betik |
| :--- | :--- | :--- | :--- |
| `index.html` (Bugün; Tur 14 A3) | Sıradaki adım, Yaklaşan 3 tarih (K14-5: süresi dolan → sonraki dönem), Devam et, rota özeti; duyuru kartı (modele göre); üniversite mezununda YL kartı, AP bölümleri gizli | `sinav-takvimi.js`, `ulke-rotalari.js`, `duyurular.js`, `yl-genel.js`, `ulke-dizini.js` | `eposta.js`, `rota.js`, `sartlar-motor.js` |
| `profil.html` | Sihirbaz (Tur 11, 4 adım): durum → ayrıntı (okul+sınıf / mezun soruları / lisans bilgileri) → en fazla 5 ülke → eğitim dili | Tarayıcı deposu (`apmeberra:`), `ulke-dizini.js` | `auth.js` |
| `rota.html` (Rotam) | DE/IT lisans: tarihli kişisel rota. Diğer ülkeler ve YL: genel yol haritası (tahmini aylar; durum `apmeberra:rota:v1` altında `<cc>` / `<cc>-yl`) | `ulke-rotalari.js`, `sinavlar.js`, `ulke-dizini.js`, `ulke/<cc>.js` | `eposta.js`, `rota.js`, `sartlar-motor.js`, `sartlar-ui.js` |
| `yazismalar.html` (Tur 12; Tur 14 A5 = Başvuru) | Son tarihler şeridi + üç sekme: Üniversiteye ilk e-posta (Ajan 14 motoru, derin bağlantı `?uni=&amac=ilk-iletisim`) · Teyit taslakları (15 ülke, 72 taslak) · Yazışma geçmişi | `data/mevzuat/ulkeler.js`, `sinavlar.js`, `data/kocluk/eposta-sablonlari.js`, `data/kocluk/teyit-taslaklari.js`, `ulke-rotalari.js` | `eposta.js`, `rota.js`, `auth.js` |
| `seviye-testi.html` | Seviye testi | `data/mevzuat/sinav-takvimi.js`, `data/sorular/seviye/*.js` (dinamik yüklenir) | `seviye.js` |
| `ap-calculus.html` | Calculus anlatım + soru istasyonları (184) | Sayfa içinde (2. aşamada `data/sorular/ders/`) | — |
| `ap-physics.html` | Physics anlatım + sorular (137) | Sayfa içinde | — |
| `ap-chemistry.html` | Chemistry anlatım + sorular (144) | Sayfa içinde | — |
| `ap-biology.html` | Biology anlatım + sorular (134) | Sayfa içinde | — |
| `ap-english.html` | English anlatım + sorular (41) + FRQ yazım istasyonu | Sayfa içinde | — |
| `ap-electives.html` | CS A, Micro, Macro (113) | Sayfa içinde | — |
| `ap-precalculus.html` · `ap-statistics.html` · `ap-physics-2.html` (1.28.0) | Yeni dersler: konu anlatımı `data/dersler/{precalculus,statistics,physics-2}/` + soru bankası (sunucu) | `data/dersler/` | — |
| `sinav-cents.html` | CEnT-S hazırlık + sorular (60) | Sayfa içinde | — |
| `deneme.html` | Deneme sınavları; `?mod=yanlislar` Yanlışlarım tek oturum modu (Tur 14 A7, Hata Defteri açık kayıtları) | `data/sorular/deneme-bankasi.js` | `deneme.js`, `assets/css/deneme.css` |
| `calis.html` (Tur 14 A6) | Çalış merkezi: sıradaki çalışma (Bugün ile aynı `apCalismaPlani`/`apSiradakiAdim`), kaldığın yer, 6 AP + CEnT-S ders kartları, Denemeler / Yanlışlarım / Seviye testi. Giriş gerekir (K4) | `sinav-takvimi.js`, `data/sorular/seviye/*` | `app.js` |
| `ilerleme.html` | İlerleme ve zayıf konular | Tarayıcı deposu (`apmeberra:`) | — |

Soru sayıları: Tur 9 sonu (13 Ekim 2026), `proje.md` §25.

---

## 3. Taşıma planı

**1. aşama — dosya taşıma: UYGULANDI (14 Ekim 2026, Ajan 11)**
1. Klasörler oluşturuldu; dosyalar §1'e göre taşındı (39 taşıma: 2 CSS, 8 JS, 9 veri dosyası, 6 seviye bankası, 6 PDF, 4 hibe modülü, 4 eski sunum öğesi).
2. Tüm `src`/`href` yolları, `seviye.js` içindeki `data/sorular/seviye/` yolu ve `araclar/` içindeki yollar (deneme-bankasi-olustur, pm-denetim, sunum-olustur, testler) güncellendi.
3. `ap-calculus.html`'deki PDF adı `kaynaklar/pdf/` yoluyla yazıldı.
4. Ajan brifinglerindeki (`.agents/rules/`, `.claude/agents/`) yollar güncellendi. `.agents/mevzuat/` karar notları tarihsel belge olduğu için değiştirilmedi.
5. Tam regresyon geçti: `deneme-bankasi-olustur` → `pm-denetim` → `ad-denetimi` → tüm tarayıcı testleri.

**2. aşama — soruları sayfadan ayırma (Ajan 12 ile, ayrı tur)**
- Ders soruları bugün `ap-*.html` içinde `const CALC_UNIT1_QUESTIONS = [...]` gibi dizilerde duruyor (sayfa başına 180–530 KB).
- Bu dizileri `data/sorular/ders/<ders>.js` dosyalarına çıkarmak:
  - içerik ile tasarımı ayırır,
  - `pm-denetim` ve `deneme-bankasi-olustur` araçlarını sadeleştirir,
  - sunucuya geçişte soruların sunucudan, giriş kontrolüyle verilmesini kolaylaştırır.
- Şema değişmez; yalnızca yer değişir.
