# Tur 14 — Öğrenci Odaklı Ekran Planı (Ajan 11, 20 Ekim 2026)

> Durum: **ONAYLANDI (kullanıcı, 20 Ekim 2026): 7 aşamanın hepsi, A1 → A7 sırasıyla.** Her aşama ayrı test + ekran görüntüsü + sürüm arşivi (v14.x). Not: tel kafeslerdeki tarihler temsilîdir (AP kayıt son günü gerçekte 13 Kasım 2026); uygulamada tarihler veriden gelir.
> Kullanıcı talebi (PM aracılığıyla): "Tasarımcı, bir öğrenci için olabilecek en kolay ve istediğine ulaşabileceği yapıda ekran tasarımını hazırlasın."
> Dokunulmayacaklar: ders içeriği, soru nesnesi şeması, `apmeberra:*` depolama anahtarları, K4 erişim listesi (`APMEBERRA_ACIK_SAYFALAR`), mevcut URL'ler (hiçbiri silinmez).

---

## 1. Mevcut durum denetimi

### 1.1 Ölçümler (20 Ekim 2026, test hesabı: lise · 11. sınıf · Almanya; Playwright, MathJax kapalı)

| Sayfa · bölüm | 1280 px'te üst kenarı | 360 px'te üst kenarı | 360 px'te kaç ekran aşağıda |
| :--- | ---: | ---: | ---: |
| `index.html` "Bugün ne yapmalısın?" (`.today-grid`) | 960 | 2039 | 2,7 |
| `index.html` ders kartları (`#course-grid`) | 1600 | 3333 | 4,4 |
| `index.html` sayfa boyu | 3499 | 7409 | 9,7 |
| `ilerleme.html` Hata Defteri (`#hata-title`) | 1750 | 2284 | 3,0 |
| `sartlar.html?…ulke=de` "En iyi 20 üniversite" (`#sr-ilk20`) | 5638 | 9678 | 12,7 |
| `universiteler.html` üniversite listesi (`…uniler`) | 6300 | 12897 | 17,0 |
| `yazismalar.html` hazır taslaklar (`#taslaklar`) | 3077 | 7410 | 9,7 |

Üst menü (oturumlu lise): **8 ana öğe** — Panelim · Rotam · Üniversitelerim · Yazışmalarım · Sınavlar ▾ (9 alt öğe) · Denemeler · İlerleme · Rehberler ▾ (7 alt öğe). "Ülke şartları" oturumlu kullanıcıda Rehberler altında gizli, misafirde ise ilk öğe. 1180 px altında menü hamburgere iner; telefonda alt gezinme yok.

### 1.2 En sık 8 görev — bugünkü yol (lise öğrencisi)

Tık = menü/düğme tıklaması; "kaydırma" 360 px'te ekran sayısı.

| # | Görev | Bugünkü yol | Tık | Sayfa | Nerede kayboluyor |
| :--- | :--- | :--- | ---: | ---: | :--- |
| G1 | Hangi ülke / üniversite bana uygun? | Rehberler ▾ → Ülke şartları → (seçici) → 12,7 ekran kaydır → İlk 20; **ya da** Üniversitelerim → ülke sekmesi → 17 ekran kaydır | 2–3 | 1 | Aynı liste iki sayfada (`sartlar.html` #sr-ilk20 ve `universiteler.html`); ikisinde de liste sayfanın en altında. Şartlar oturumluda menüde görünmüyor. |
| G2 | O üniversite ne istiyor? | G1 + kartta "Dersler ve İsterler" → çekmece → Konu anlatımı / Deneme | 4–5 | 2 | Çekmece güçlü (Tur 13) ama ulaşmak için G1'in uzun kaydırması gerekiyor. |
| G3 | Bugün ne çalışmalıyım? | Panelim → 2,7 ekran kaydır | 0–1 | 1 | "Bugün" kartı rota panelinin altında; mezun/YL panelleri varsa daha da aşağıda. |
| G4 | Deneme çöz | Denemeler → ders seç → Başla | 3 | 1 | Sorun yok; ancak Panelim'den doğrudan "kaldığın denemeye devam" yok (yalnızca son sonuç). |
| G5 | Yanlışlarımı tekrar et | İlerleme → 3 ekran kaydır → Hata Defteri → "Soruya git" (her soru ayrı ders sayfası açar) → geri | 2 + soru başına 2 | 2+ | Tek oturumda "yanlışlarımı çöz" yok; her soruda sayfa değişiyor. Ders sayfasında ünite bazlı "Sadece yanlışlarımı tekrar çöz" var ama bilinmiyor. |
| G6 | Yaklaşan son tarihler | Panelim'de yalnız AP Mayıs 2027 sayacı; Rotam → zaman çizelgesi; Sınavlar → kart tarihleri; Şartlar → Duyurular | 3–6 | 3–4 | **Tek bir "son tarihler" görünümü yok.** Veri var (rota.js zaman çizelgesi, sinavlar.js tarihleri, duyuru bitiş tarihleri) ama dağınık. |
| G7 | Üniversiteye e-posta hazırla | Yazışmalarım → şablon veya taslak seç (9,7 ekran) → oluşturucu | 2–3 | 1 (+üniversiteyi başka sekmede aramak) | Üniversite kartından e-postaya bağlantı yok (Ajan 14 planı §3.2 ekleyecek: `yazismalar.html?uni=<id>&amac=ilk-iletisim`). |
| G8 | İlerlemem | İlerleme | 1 | 1 | Sorun yok; yedekleme ve sıfırlama aynı sayfada en altta. |

### 1.3 Öğrenci modellerine göre farklar

| Model | Menü | Ek kayıp noktaları |
| :--- | :--- | :--- |
| **Lise öğrencisi** | 8 ana öğe (yukarıdaki) | AP dersleri Sınavlar ▾ altında 6 satır; "dersler" ile "sınavlar" aynı açılır listede. |
| **Lise mezunu** | Aynı 8 öğe; AP araçları görünür | Panelim'de mezun paneli (`#mezun-panel`) "Bugün"ü daha da aşağı itiyor; Tur 12 S5'e göre AP en sonda olmalı ama menü sırası aynı. Hedef yıl / YKS koşulları Rotam'da. |
| **Üniversite mezunu (YL)** | 6 öğe (Denemeler, İlerleme gizli; Sınavlar ▾'de AP yok) | Çalışma alanı yok (GRE/GMAT/dil sınavı hazırlığı portalda yok — doğru, ama boşluk olarak açıkça söylenmiyor). YL ortak notları `sartlar.html` en altta (#sr-ylortak). |
| **Girişsiz ziyaretçi (K4)** | Ülke şartları · Üniversiteler · Sınavlar · Rehberler ▾ | Açık sayfalar doğru; ancak üniversite kartındaki "Deneme" ve gelecek "İlk e-posta" bağlantıları girişe atıyor ve ziyaretçi bunu tıklamadan önce bilmiyor. Giriş/kayıt düğmesi yalnız hesap alanında. |

### 1.4 Kök nedenler
1. **Sayfa = veri kaynağı** düzeni: her veri kümesi (şartlar, üniversiteler, rota, sınavlar) kendi uzun sayfasında; öğrencinin sorusu ise birkaçını birden kesiyor.
2. **En önemli bölüm en altta:** İlk 20 listesi, Hata Defteri, taslaklar uzun açıklamaların altında.
3. **Menü yoğunluğu:** 8 ana öğe + 16 alt öğe; telefonda hamburger, alt gezinme yok.
4. **"Sıradaki adım" tek yerde değil:** Panelim, Rotam ve Şartlar'ın her birinin kendi yol haritası var.

---

## 2. Önerilen bilgi mimarisi

### 2.1 İlke
Öğrenci soruyla gelir; her ana ekran bir soruyu yanıtlar. Her görev **en fazla 2–3 tık**; ilk ekranda (360 px'te ilk 1,5 ekran) cevabın kendisi görünür, açıklamalar açılır alanlara iner.

### 2.2 Üst menü (en fazla 5) ve mobil alt gezinme

| Ana öğe | Soru | İçerik (mevcut dosyalar) | Lise | Lise mezunu | Üni. mezunu | Misafir |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Bugün** | Şimdi ne yapmalıyım? | `index.html` (Panelim yeniden adlandırılır) | ✓ | ✓ | ✓ | — |
| **Hedefim** | Nereye, hangi üniversiteye, ne istiyorlar? | `sartlar.html` · `universiteler.html` · `rota.html` ortak sekme çubuğuyla tek alan | ✓ | ✓ | ✓ | Şartlar + Üniversiteler |
| **Çalış** | Neyi çalışayım, nasıl ölçerim? | ders sayfaları (`ap-*.html`, `sinav-cents.html`) · `deneme.html` · `seviye-testi.html` · "Yanlışlarım" | ✓ | ✓ (sonda) | — | — |
| **Başvuru** | Hangi tarih, hangi belge, kime yazacağım? | `yazismalar.html` · "Son tarihler" · belge listesi (rota.js'ten) · `sinavlar.html` | ✓ | ✓ | ✓ | Sınavlar |
| **Ben** | Nasıl gidiyorum? | `ilerleme.html` · `profil.html` · yedekleme | ✓ | ✓ | profil | Giriş yap |

- Rehberler (Almanya/İtalya/İstanbul rehberi, Bilgi Merkezi, Ajan Konseyi) üst menüden çıkar; **Hedefim** sekmesinde "Ülke rehberi" bağlantısı ve altbilgide durur.
- Üniversite mezununda "Çalış" yerine **Sınavlar** (dil + GRE/GMAT kartları, `sinavlar.html?model=uni-mezun`) gelir; 4 öğe.
- Misafir: **Şartlar · Üniversiteler · Sınavlar · [Giriş yap / Kayıt ol]** (K4 aynen).
- **Telefonda alt gezinme** (≤ 1180 px yerine ≤ 760 px): aynı 5 öğe, ikon + kısa etiket, 56 px yükseklik, `aria-current`, güvenli alan dolgusu. Üst çubuk yalnız logo + tema + hesap.

### 2.3 Ekranlar

**A. Bugün (`index.html`)** — sıra yeniden kurulur:
1. **Sıradaki adım kartı** (tek kart, tek birincil düğme): öncelik sırası → yarım kalan deneme > süresi 14 gün içinde dolan rota adımı > açık hata ≥ 5 > haftalık plan görevi > profil eksiği. Veri: `apmeberra:deneme:v1`, rota.js `zamanCizelgesi`, `apmeberra:errors:v1`, mevcut "Bugün" listesi.
2. **Yaklaşan 3 tarih** (rota adımları + kayıtlı sınavların tarihleri + duyuru bitişleri; "Tümü →" Başvuru › Son tarihler).
3. **Devam et** satırı: son çalışılan ünite (quiz `seen`), son deneme sonucu, açık hata sayısı → "Yanlışlarımı çöz".
4. Rota özeti (mevcut `#panel-rota`, daraltılmış) · ders kartları · ikincil grup (KMK denetleyici vb.) en altta.
Model farkı: mezun/YL panelleri 1 satırlık bilgi şeridine iner; içeriği Hedefim'e taşınır.

**B. Hedefim (sartlar + universiteler + rota)** — üç dosya kalır, üstlerine ortak **alan sekme çubuğu** gelir: `Şartlar | Üniversiteler | Rotam`. Seçim (model·sınıf·ülke·dil) tek çubukta ve URL'de taşınır (`apSecimSorgusu` zaten var).
- `universiteler.html`: liste **ilk ekrana** alınır (QS sırası, arama, EN/Yerel süzgeç); kabul/sınav/takvim açıklamaları listenin altına "Bu ülkede kabul nasıl işler?" açılır bölümlerine iner.
- Üniversite kartı: isterler rozetleri (Tur 13) + üç eylem: **İsterler ve dersler** (çekmece) · **İlk e-posta** (Ajan 14 derin bağlantısı) · **Listeme ekle**. Misafirde girişe giden eylemlerde kilit ikonu ve "giriş gerekir" etiketi.
- `sartlar.html`: "En iyi 20" bölümü yerine Üniversiteler sekmesine "Bu ülkenin 20 üniversitesi →" bağlantısı (aynı veri iki kez listelenmez); şartlar sayfası yol haritası + belge + dil sınavı özetine odaklanır.
- `rota.html`: değişmez; sekme çubuğuyla bu alana bağlanır.

**C. Çalış** — yeni küçük merkez sayfa `calis.html` (oturum gerekir):
- Üstte "Kaldığın yer" (son ünite, yarım deneme).
- Dersler ızgarası (6 AP + CEnT-S; ilerleme halkası), her kartta **Konu · Sorular · Deneme**.
- **Yanlışlarım**: tüm açık hataları tek oturumda çözdüren mod — `deneme.html?mod=yanlislar` (soru havuzu = açık Hata Defteri kayıtları). *deneme.js'e dokunduğu için deneme/içerik ajanıyla birlikte; soru şeması değişmez.*
- Seviye testi ve İstanbul sınav rehberi bağlantıları.
Menüdeki 6 ders satırı buraya taşınır; ders sayfası URL'leri aynı kalır.

**D. Başvuru** — `yazismalar.html` sekmeli hale gelir (Ajan 14 önerisi §3.3 ile uyumlu): `İlk e-posta (varsayılan) | Teyit taslakları | Kişisel şablonlar | Geçmiş`; ayrıca sayfa başında **Son tarihler** şeridi ve rota belge listesine bağlantı. Derin bağlantı `yazismalar.html?uni=<id>&amac=ilk-iletisim` İlk e-posta sekmesini o üniversiteyle açar. `sinavlar.html` bu alanın ikinci girişi olarak menüde "Başvuru ▸ Sınavlar".

**E. Deneme sonuç ekranı** (`deneme.html` içi) — sonuç başlığı: puan halkası + ünite çubukları; altında **tek birincil eylem** "Yanlış 7 soruyu şimdi çöz" (Yanlışlarım moduna), ikincil "Zayıf ünite: Unit 4 konu anlatımı", üçüncül "Soru soru incele".

### 2.4 Görev başına hedef tık sayısı

| Görev | Bugün | Öneri |
| :--- | ---: | :--- |
| G1 Uygun üniversite | 2–3 tık + 12–17 ekran kaydırma | Hedefim → Üniversiteler: **1–2 tık, liste ilk ekranda** |
| G2 Üniversite isterleri | 4–5 | kartta İsterler: **2–3** |
| G3 Bugün ne çalışayım | 0–1 + 2,7 ekran | **0** (Sıradaki adım ilk kart) |
| G4 Deneme | 3 | Bugün'den "Devam et" **1**, yeni deneme **2** |
| G5 Yanlışlarım | 2 + soru başına 2 | Bugün/Çalış → Yanlışlarım: **1–2**, tek oturum |
| G6 Son tarihler | 3–6 (3–4 sayfa) | Bugün'de ilk 3; tümü **1** (Başvuru) |
| G7 İlk e-posta | 2–3 + üniversite arama | üniversite kartından **1**, Başvuru'dan **2** |
| G8 İlerleme | 1 | Ben: **1** |

### 2.5 URL ve yönlendirme
Hiçbir dosya silinmez, hiçbir URL kırılmaz. Değişen yalnızca menü etiketi ve sayfa içi düzen:
- `index.html` aynı ("Panelim" etiketi → "Bugün"; `<title>` güncellenir).
- `calis.html` yeni (K4: kilitli). `deneme.html?mod=yanlislar` yeni parametre; parametresiz davranış aynı.
- `mezun.html` → mevcut yönlendirme korunur.
- `yazismalar.html#sablonlar|#taslaklar|#gecmis` çapaları sekmeyi seçer (eski yer imleri çalışır).
- `sartlar.html#sr-ilk20` → Üniversiteler sekmesine `?ulke=` ile yönlenir (çapa korunur, bölüm kısa bağlantı kartına döner).

---

## 3. Tel kafesler

### 3.1 Bugün — 1280 px
```
┌ AP MEBERRA  [Bugün] Hedefim  Çalış  Başvuru  Ben                 ☾  (TÖ) ┐
│ Merhaba Ayşe · Lise · 11. sınıf · Almanya · İngilizce   [Hedefi değiştir] │
│ ┌ SIRADAKİ ADIM ─────────────────────────────────┐ ┌ YAKLAŞAN TARİHLER ─┐ │
│ │ Calculus Unit 4 denemen yarım kaldı (12/30)     │ │ 01 Kas  AP kayıt   │ │
│ │ ~25 dk · kaldığın yerden                        │ │         son günü   │ │
│ │ [ Devam et ]            Neden bu? ▾             │ │ 15 Ara  TUM başv.  │ │
│ └─────────────────────────────────────────────────┘ │ 09 Oca  IELTS      │ │
│ ┌ Devam et ─────────┐┌ Yanlışlarım ─────┐┌ Son deneme ┐│ Tümü →          │ │
│ │ Physics U3  64%   ││ 9 açık soru      ││ 3/5 tahmin │└──────────────────┘ │
│ │ [Sürdür]          ││ [Çöz]            ││ [İncele]   │                     │
│ Rotam: Almanya — 4/11 adım  ▸ (daraltılmış)                                │
│ Derslerin  [Calc ◔] [Phys ◑] [Chem ○] [Bio ○] [Eng ◔] [Seçmeli ○]          │
│ Daha fazla ▸ (KMK ön kontrol, yol haritası, duyurular)                     │
```
### 3.2 Bugün — 360 px
```
┌ AP MEBERRA          ☾ (TÖ) ┐
│ Merhaba Ayşe · 11 · DE     │
│ ┌ SIRADAKİ ADIM ─────────┐ │
│ │ Calculus U4 denemesi    │ │
│ │ yarım (12/30) · ~25 dk  │ │
│ │ [ Devam et ]  (tam gen.)│ │
│ └─────────────────────────┘ │
│ Yaklaşan  01 Kas AP kayıt › │
│           15 Ara TUM      › │
│ [Yanlışlarım 9] [Son deneme]│  ← 2 sütun
│ Rotam 4/11 ▸                │
│ Derslerin (yatay kaydırma)  │
├─────────────────────────────┤
│ ⌂Bugün ◎Hedefim ✎Çalış ✉Başvuru ☺Ben │ ← alt gezinme 56 px
```

### 3.3 Hedefim: ülke → üniversite → ister → ders/deneme
```
1280 px
┌ Hedefim   [Şartlar] [Üniversiteler] [Rotam]                                  ┐
│ Lise · 11 · [Almanya ▾] · [İngilizce|Yerel]   Ülke rehberi →                 │
│ 🔍 Üniversite ara…   [EN programı var] [Yerel]        20 üniversite · QS     │
│ ┌ 1 TUM · Münih · QS 25 ─────────────────────┐ ┌ 2 LMU · Münih · QS 54 ─┐  │
│ │ Dil: IELTS 6.5 · TOEFL 90                   │ │ …                       │  │
│ │ Bilim: AP Calc · AP Phys · +1               │ │                         │  │
│ │ [İsterler ve dersler ▾] [İlk e-posta] [☆]   │ │                         │  │
│ │ ┌ çekmece ───────────────────────────────┐  │ │                         │  │
│ │ │ AP Calculus  [Konu] [AB Deneme]         │  │ │                         │  │
│ │ │ IELTS        [Strateji] [Deneme]        │  │ │                         │  │
│ Bu ülkede kabul nasıl işler? ▸   Sınav takvimi ▸   Kaynaklar ▸               │

360 px
┌ Hedefim                     ┐
│ [Şartlar|Üniversiteler|Rota]│ ← segment, tam genişlik
│ [Almanya ▾] [EN|Yerel]      │
│ 🔍 Ara…                     │
│ ┌ 1 TUM · QS 25 ───────────┐│
│ │ IELTS 6.5 · AP Calc · +2  ││
│ │ [İsterler ▾]              ││
│ │ [İlk e-posta] [☆]         ││ ← ≥44 px hedefler
│ └───────────────────────────┘│
```
Akış: Hedefim (1) → kartta İsterler (2) → çekmecede Konu/Deneme (3).

### 3.4 Deneme sonuç ekranı
```
1280 px                                              360 px
┌ Calculus AB denemesi — bitti ───────────────┐      ┌ Deneme bitti ──────────┐
│ (◕ 72%)  22/30 doğru · 41 dk  · tahmini 4    │      │ (◕ 72%) 22/30 · ~4     │
│ Unit 2 ██████████ 90%                        │      │ [Yanlış 8 soruyu çöz]  │
│ Unit 4 ████░░░░░░ 40%  ← zayıf               │      │ Zayıf: Unit 4 › Konu   │
│ [ Yanlış 8 soruyu şimdi çöz ]  Unit 4 konu → │      │ Ünite çubukları ▾      │
│ Soru soru incele ▸                           │      │ Soru soru incele ▸     │
```

### 3.5 Başvuru › İlk e-posta (Ajan 14 Faz 2)
```
1280 px
┌ Başvuru  [İlk e-posta] [Teyit taslakları] [Şablonlar] [Geçmiş]   Son tarihler: 15 Ara TUM › ┐
│ Ülke [Almanya ▾]  Üniversite [TUM ▾]  Program (isteğe bağlı) [____]  Amaç (•İlk)(Takip)      │
│ ┌ Önizleme (İngilizce, düzenlenebilir) ───────────────┐ ┌ Kontrol ─────────────────────┐ │
│ │ Subject: Prospective bachelor's applicant …          │ │ Alıcı: studium@tum.de        │ │
│ │ Dear Admissions Team, …                              │ │   kaynak ↗                    │ │
│ │                                                      │ │ 187 kelime (120–220) ✓        │ │
│ └──────────────────────────────────────────────────────┘ │ Eksik: okul adı → Profil     │ │
│ [Kopyala] [E-posta programında aç] [Taslak kaydet] [Gönderildi]│ Kendi adresinden gönder.  │ │
360 px: seçiciler alt alta; Kontrol kartı önizlemenin ÜSTÜNE (eksik/alıcı önce görülsün); düğmeler tam genişlik, 2×2.
```
Derin bağlantı: `yazismalar.html?uni=de-technical-university-of-munich&amac=ilk-iletisim` → sekme ve seçiciler dolu açılır. Misafir: "E-posta hazırlamak için giriş yap" kartı (`giris.html?donus=…`).

---

## 4. Uygulama aşamaları

| Aşama | İş | Dosyalar | Test |
| :--- | :--- | :--- | :--- |
| **A1** | Menü 5 öğe + misafir menüsü + "Panelim"→"Bugün"; Rehberler altbilgiye | `assets/js/app.js` (APMEBERRA_NAV, NAV_ACIK), `styles.css` | `tur11-test` (menü), `mezun-menu-test`, `hesap-test`, `erisim-test`, `interact` (menü metinleri) güncellenir |
| **A2** | Telefon alt gezinme (≤ 760 px) | `app.js` initGlobalNav, `styles.css` | `tasarim-test` 360 px taşma + yeni: alt gezinme görünür, `aria-current` |
| **A3** | Bugün ekranı: Sıradaki adım + Yaklaşan tarihler + Devam et; bölüm sırası | `index.html`, `app.js` (yeni saf `apSiradakiAdim()`, `apYaklasanTarihler()` + Node birim testi) | `tasarim-test` panel sırası testi yeni sıraya; yeni `bugun-birim-test.js` |
| **A4** | Hedefim sekme çubuğu; Üniversiteler listesi üstte; kartta İlk e-posta / Listeme ekle; Şartlar'da İlk 20 → bağlantı kartı | `universiteler.html`, `sartlar.html`, `rota.html` (yalnız sekme çubuğu), `sartlar-ui.js`, `universite-isterleri.js` | `tur11-test` (üniversiteler), `universite-ister-test`, `mezun-test` (şartlar), `ulke-test` |
| **A5** | Başvuru: yazışmalar sekmeleri + İlk e-posta bölümü (Ajan 14 Faz 2) + Son tarihler şeridi | `yazismalar.html`, `eposta.js` (yalnız çağrı), `styles.css` | `yazisma-test`, `yazisma-taslak-test`, yeni `ilk-eposta-test.js` (derin bağlantı, misafir, 360 px) |
| **A6** | Çalış merkezi `calis.html` + K4 kilit listesi | yeni `calis.html`, `app.js` | `erisim-test` (kilitli sayfa), `tasarim-test` PAGES listesi |
| **A7** | Yanlışlarım modu + deneme sonuç ekranı eylemleri | `deneme.js` (deneme ajanıyla), `deneme.css` | `deneme-test` + yeni yanlışlar senaryosu |

Her aşama ayrı teslim: `pm-denetim` 0 sorun, ilgili testler, 1280/360 açık/koyu ekran görüntüleri, `proje.md` kaydı, sürüm arşivi (PM).

**Riskler:** (1) Menü metni değişikliği birçok testi kırar → A1'de testler aynı teslimde güncellenir. (2) `index.html` sıra değişikliği `tasarim-test` panel sırası sözleşmesini değiştirir → test yeni sözleşmeyle yazılır. (3) Yanlışlarım modu deneme.js'e dokunur → sahibi ajanla ortak, soru şeması değişmez. (4) Ajan 14 Faz 2 ile çakışma → A5 tek iş olarak birlikte yapılır. (5) Alt gezinme sabit konumlu öğelerle (sohbet düğmesi, yedek hatırlatması) çakışabilir → `--bottom-nav-h` token'ı ve alt dolgu.

---

## 5. Kullanıcıya sunulacak özet

1. Bugün portalda bir öğrencinin en sık 8 işinden 4'ü uzun kaydırma ya da 3+ sayfa gerektiriyor; telefonda üniversite listesi 12–17 ekran aşağıda.
2. Menü 8 ana öğeden 5'e iniyor: **Bugün · Hedefim · Çalış · Başvuru · Ben**.
3. Telefonda bu 5 öğe ekranın altında sabit bir çubukta duracak.
4. Ana ekranın ilk kartı tek bir şey söyleyecek: "Sıradaki adımın bu" ve tek düğme.
5. Yaklaşan son tarihler (sınav kaydı, başvuru, belge) ilk kez tek yerde toplanacak.
6. Üniversite listesi sayfanın en üstüne çıkacak; her kartta istekler, ilgili ders/deneme ve "İlk e-posta" düğmesi olacak.
7. Yanlış yapılan sorular tek oturumda tekrar çözülebilecek; deneme bitince ilk düğme "yanlışlarını şimdi çöz" olacak.
8. Lise öğrencisi, lise mezunu ve üniversite mezunu kendi menüsünü görecek; girişsiz ziyaretçi şartlar, üniversiteler ve sınavları görmeye devam edecek.
9. Hiçbir sayfa adresi kırılmayacak; ders içeriği ve sorular değişmeyecek.
10. İş 7 küçük aşamada, her aşama ayrı test ve ekran görüntüsüyle teslim edilecek; onayınızdan sonra başlanır.

*Hazırlayan: Ajan 11 (Frontend & UX), 20 Ekim 2026. Ölçüm betiği: scratchpad `a11/testler/akış-olc.js` (proje dışı).*
