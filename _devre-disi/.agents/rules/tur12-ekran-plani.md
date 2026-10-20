# Tur 12 — Sınavlar ve Yazışmalarım Ekran Planı (Ajan 11, 15 Ekim 2026)

> Durum: **PM tarafından önceden onaylandı** ("planla ve uygula, sapmaları raporla"). Kural AGENTS.md §2.1 md. 8: ekran baştan planlanır, yama yapılmaz.
> Dayanak: Tur 11 planı (`tur11-ekran-plani.md`, D1–D8 ve §10), `proje.md` §27.6 / §27.9 (madde 1–2, 4), PM ek işi (rota adımı `dil` alanı).
> Değişmeyen sözleşmeler: `apmeberra:panel:v1.sinavlarim`, `apmeberra:yazisma:v1`, `apmeberra:rota:v1` anahtarları; sınav kartı `id`, `data-kategori`, `#ulke-filtre`, sekme rolleri; şablon şeması (§7.1) ve 9 şablon.

---

## 0. Kararlar (özet)

| No | Karar | Gerekçe |
| :--- | :--- | :--- |
| **S1** | `sinavlar.html` yeni sayfa açmadan yeniden kurulur: üstte **seçim çubuğu** (Durum → Sınıf → Ülke → Sınav dili), altında kategori sekmeleri ve kart ızgarası. | Şartlar sayfasıyla aynı zihinsel model; aynı URL. |
| **S2** | URL: `sinavlar.html?model=&sinif=&ulke=&dil=` (sartlar.html ile aynı adlar). Sınavlarda `dil` üç değer alır: `en` · `yerel` · `hepsi` (varsayılan `hepsi`). Şartlara giden bağlantılar `apSecimSorgusu` ile `hepsi`yi `en`e çevirir. Eski `?ulke=de`, `?filtre=rota`, `#sinav-id` çalışır. | Paylaşılabilir tek adres; eski yer imleri kırılmaz. |
| **S3** | Oturumlu kullanıcıda URL'de seçim yoksa **profil varsayılandır**: model = `ogrenciModeli`, sınıf, ülke = "Hedef ülkelerim", dil = `egitimDili`. Seçim değişince URL `replaceState` ile yazılır; profile **yazılmaz**. | "Profil varsayılan" isteği; profil yalnızca profil sayfasından değişir. |
| **S4** | Düzey modelden gelir (`uni-mezun` → `yl`, diğerleri → `lisans`). Kayıtta `duzey` yoksa varsayılan: AP ve Giriş Sınavı → `["lisans"]`, Dil Sınavı → `["lisans","yl"]`, GRE/GMAT (id `gre*`/`gmat*`) → `["yl"]`. | Ek alanlar yokken de sayfa doğru süzer. |
| **S5** | Üniversite mezununda AP sekmesi **gizlenir**; listenin sonunda "Lise öğrencileri için: AP sınavları (n) — göster" düğmesi sekmeyi geri açar. Sekme sırası modele göre: lise `AP · Giriş · Dil`; lise mezunu `Giriş · Dil · AP`; üniversite mezunu `Dil · Giriş/YL (GRE/GMAT)`. | Görev: AP gizli ya da en sonda daraltılmış. |
| **S6** | Sınav şeması isteğe bağlı alanlarla genişler: `dil`, `duzey`, `kesinlik`, `sonKontrol`, `ucret`. Motor: yeni `assets/js/sinav-motor.js` (saf, UMD, Node birim testli). `dil` şu biçimlerin hepsini kabul eder: `"en"`, `"yerel"`, ISO kodu (`"de"`), kod dizisi (`["de","en"]`), Türkçe ad (`"Almanca"`, `"Lehçe / Çekçe / Macarca"`). | Ajan 13'ün öneri biçimi bilinmiyor; motor dayanıklı olur, veri dönüştürülmeden okunur. |
| **S7** | Dil sınıflaması ülkeye göredir: ülke seçiliyken sınav dili o ülkenin `yerelDil` listesindeyse "yerel", `en` ise "İngilizce", ikisi de değilse "diğer" (gösterilmez). Ülke "tümü"yken İngilizce dışındaki her dil "yerel" sayılır. `dil` bilgisi yoksa: Dil Sınavı → İngilizce varsayılır (bugünkü IELTS/TOEFL), diğer kategoriler dil süzgecinden etkilenmez. | DELF Fransa ve Belçika'da yerel, Almanya'da değil. |
| **S8** | `araclar/sinav-aktar.js` (PM çalıştırır): girdi `sinavlar-tur12.json`; mevcut kayıtları korur, yalnız izinli alanları günceller (`ulkeler` birleşir), yeni kayıtları ekler, şemayı denetler, `--kuru` ile yazmadan rapor verir. Çıktı biçimi bugünkü `sinavlar.js` gibi okunur JS. | sinavlar.js elle düzenlenmez; içerik PM'de kalır. |
| **Y1** | Yazışmalarım tek sayfa kalır; üstte **ortak süzgeç çubuğu** (Durum → Ülke) iki bölümü birlikte süzer: (1) **Kişisel şablonlar** (mevcut 9, profil bilgisiyle dolar) ve (2) **Hazır teyit taslakları** (72, hazır metin). | Şablon ile taslak farklı nesneler; aynı süzgeçle bulunur. |
| **Y2** | Taslaklar ayrı üretilmiş dosyada: `data/kocluk/teyit-taslaklari.js` (`window.APMEBERRA_TEYIT_TASLAKLARI`), üretici `araclar/teyit-taslak-olustur.js` (girdi `.agents/mevzuat/teyit-taslaklari-tur11.json`). Şablon şeması (§7.1) değişmez. | Değişkenli şablon değiller; motoru zorlamadan ayrı tür. |
| **Y3** | **Alıcı adresi kuralı:** Taslağın `kime` metnindeki e-posta yalnızca `data/mevzuat/kaynak/*.json` içinde kaynak URL'li bir maddede geçiyorsa `eposta` olur ve mailto'ya yazılır (kaynak bağlantısıyla). Geçmiyorsa adres mailto'ya yazılmaz; kartta "Taslakta adres geçiyor ama resmi kaynakla eşleşmedi; kurumun iletişim sayfasından doğrula" notu ve adres düz metin olarak gösterilir. Adres yoksa: "Kurumun uluslararası ofisi / kabul birimi; adresi resmi sitesinden bul". | Görev: mailto yalnız resmi kaynaklı adresle. |
| **Y4** | Taslak kişisel veri taşımaz: üretici `Meberra`, `Azra`, ad-soyad kalıpları ve kaynaksız e-posta adreslerini gövdede arar; bulursa hata verir. `[Name]` gibi yer tutucular kalır; arayüz bunları sayıp "göndermeden önce doldur" uyarısı verir. | Gizli veri sızdırmama. |
| **Y5** | Taslak düzey → model: `lisans` → lise + lise mezunu; `yl` → üniversite mezunu; `genel` ülkeli taslaklar (5, YL) her ülke seçiminde YL için görünür. | Model/ülke/düzey süzgeci. |
| **Y6** | Taslak "Bu taslağı kullan" ile mevcut oluşturucuya (alıcı, konu, metin) yüklenir; kayıt geçmişe `taslakId` ile yazılır (`sablonId` null). Kopyala / e-posta programında aç / taslak kaydet / gönderildi işaretle aynen çalışır. Kartta ayrıca doğrudan "Kopyala" düğmesi vardır. | Var olan akış yeniden kullanılır; yeni depolama anahtarı yok. |
| **R1** | (PM ek işi) Rota adımında isteğe bağlı `dil: "en" | "yerel"`. Kural `madde.dil` ile aynı: alan yoksa iki yola da ait; varsa yalnız seçilen eğitim diliyle eşleşince gösterilir. Seçim: Rotam/Panelim'de profil `egitimDili` (yoksa `en`), şartlar sayfasında URL `dil`. | `de-almanca` Almanca yolda gösterilmez. |

---

## 1. Bilgi mimarisi

### 1.1 `sinavlar.html`
```
page-head (eyebrow "Sınavlar", h1, lead)
genel-banner (Genel deneme; misafirde giriş)
[Seçim çubuğu: form role=search]
  Durum   (•Lise öğrencisi)(Lise mezunu)(Üniversite mezunu)      ← sr-seg
  Sınıf   [9][10][11][12]   (yalnız lise)
  Ülke    [select #ulke-filtre: Hedef ülkelerim · Rotamın sınavları · Tüm ülkeler · 15 ülke · Yalnızca listem]
  Sınav dili (•Hepsi)(İngilizce)(Yerel dil: Almanca)               ← ülke seçiliyse yerel dil adı
  [Seçimi temizle]   özet: "Lise · 11. sınıf · Almanya · Yerel dil — 7 sınav"
rota-context (oturumlu, rota varsa)
tabs (modele göre sıra) + sayaç
#exam-panel: sonuç sayısı · kart ızgarası · boş durum
AP katlanmış bandı (yalnız uni-mezun)
"Bu ülkenin şartları" bağlantısı (sartlar.html + seçim)
```
Kart (değişen kısımlar): başlık · kurum · durum rozeti → **pill satırı** (sınav dili, düzey "YL", kesinlik rozeti, ülkeler: seçili ülke vurgulu, 4'ten fazla ülke "+n ülke" ile kısaltılır) → meta (Format, Süre, Puanlama, Tarih, **Ücret** varsa) → not → eylemler (AP'de ders/deneme; AP dışı ve içerik yoksa tek satır "Portalda bu sınav için çalışma içeriği yok") → alt satır (Listeme ekle · **Son kontrol** · Resmi kaynak).

### 1.2 `sartlar.html` "Dil sınavları" bölümü
- Süzgeç sınav motorundan: ülke + model düzeyi + eğitim dili; Dil Sınavı kategorisi, YL'de ayrıca `duzey` içinde `yl` olan giriş sınavları (GRE/GMAT) → başlık "Dil sınavları ve GRE/GMAT".
- Bağlantı `sinavlar.html?model=&sinif=&ulke=&dil=#id`.
- Ülkede kayıt yoksa bölüm yine görünür: "Bu ülke için dil sınavı kaydı hazırlanıyor" + "Tüm dil sınavları" bağlantısı. Jump-nav çipi her zaman var.

### 1.3 `yazismalar.html`
```
page-head · dürüst not
[Süzgeç çubuğu]  Durum (Lisans: lise/lise mezunu)(YL: üniversite mezunu)   Ülke [Hedef ülkelerim · Tüm ülkeler · 15 ülke]
adımlar (1 Şablon · 2 Alıcı · 3 Önizle)
§ Kişisel şablonlar (profil bilgilerinle dolar)   — mevcut kartlar; şablonu olmayan ülkede boş durum (aşağıda)
§ Hazır teyit taslakları (Ajan 13, Tur 11)          — sayaç, ülke grupları (cc rozeti + ad), kart: kime · dil · düzey · konu · metin önizleme (3 satır, details ile tamamı) · [Bu taslağı kullan] [Kopyala]
oluşturucu (mevcut) · geçmiş (mevcut)
```

---

## 2. Süzgeç akışı

`model → (sınıf) → ülke → dil → düzey (türetilir)`

| Adım | Sınavlar | Yazışmalar |
| :--- | :--- | :--- |
| Model | URL > profil > yok (hepsi) | URL > profil > `lise` |
| Sınıf | yalnız lise; URL'de taşınır, şablon `siniflar` süzgecini etkiler | profil sınıfı (değişmez) |
| Ülke | URL `ulke` > profil ("Hedef ülkelerim") > tümü; misafirde tümü | URL `ulke` > "Hedef ülkelerim" |
| Dil | URL `dil` > profil `egitimDili` > `hepsi` | taslak/şablon dili süzülmez (yazışma dili kurumun dilidir) |
| Düzey | modelden; kayıt `duzey` ya da S4 varsayılanı | taslak `tur` |

---

## 3. Tel çerçeveler

### 3.1 1280 px — sinavlar
```
┌ Sınavlar ───────────────────────────────────────────────────────────────────────┐
│ h1 Girmen gereken sınavlar, tek tek                                              │
│ ┌ Genel deneme ────────────────────────────────────────── [Genel denemeye başla] ┐│
│ ┌ seçim çubuğu (surface) ────────────────────────────────────────────────────────┐│
│ │ DURUM  [Lise öğrencisi|Lise mezunu|Üniversite mezunu]   SINIF [9|10|11|12]     ││
│ │ ÜLKE   [Almanya ▾]          SINAV DİLİ [Hepsi|İngilizce|Yerel dil (Almanca)]    ││
│ │ Lise · 11. sınıf · Almanya · Yerel dil — 6 sınav            [Seçimi temizle]    ││
│ └────────────────────────────────────────────────────────────────────────────────┘│
│ [AP 11] [Giriş Sınavları 2] [Dil Sınavları 4]                                    │
│ ┌card┐ ┌card┐ ┌card┐   (auto-fill minmax 340)                                     │
│ Almanya'nın şartları → sartlar.html?…                                            │
```
### 3.2 360 px
Seçim çubuğu tek sütun; segmentler tam genişlik (3 durum düğmesi sığmazsa iki satıra sarar), select tam genişlik; sekmeler yatay kaydırma; kartlar tek sütun; pill satırı sarar. Yatay kaydırma yok.

### 3.3 Yazışmalar 1280 / 360
Süzgeç çubuğu (`uni-filtre` deseni) üstte; taslak kartları `tpl-grid` (auto-fill 320). 360 px'te tek sütun, düğmeler tam genişlik.

---

## 4. Boş durumlar (metinler testte aranır)

| Durum | Metin |
| :--- | :--- |
| Sınav verisi yok | "Sınav listesi hazırlanıyor" (mevcut) |
| Süzgeç sonucu 0 | "Bu seçimde sınav yok" + [Sınav dilini "Hepsi" yap] [Tüm ülkeler] |
| Ülkede yerel dil sınavı kaydı yok (dil=yerel) | "{Ülke} için yerel dil sınavı kaydı henüz yok" + mevzuat notu + [İngilizce sınavları gör] |
| uni-mezun, Giriş sekmesi boş | "Yüksek lisans giriş sınavı (GRE/GMAT) kaydı henüz yok" + YL ortak notları bağlantısı |
| Şartlar: ülkede dil sınavı yok | "Bu ülke için dil sınavı kaydı hazırlanıyor" |
| Yazışma: ülkede kişisel şablon yok | "{Ülke} için kişisel şablon yok" + "Aşağıdaki hazır teyit taslaklarını kullan" (taslak varsa) |
| Yazışma: ülkede taslak yok | "{Ülke} için hazır teyit taslağı yok" + "Kurumun uluslararası ofisine genel şablonla yaz" |
| Taslak dosyası yok | "Teyit taslakları yüklenemedi" (bölüm gizlenmez, şablonlar çalışır) |

---

## 5. Test planı

| Test | Tür | Kapsam |
| :--- | :--- | :--- |
| `sinav-birim-test.js` (yeni) | Node | secim çözümü (URL/profil/varsayılan), dil sınıflaması (kod/dizi/Türkçe ad/yerel/en/diğer), düzey varsayılanları, süzgeç (model × ülke × dil), AP gizleme, sekme sırası, şema denetimi, gerçek `sinavlar.js` 0 sorun, `yl-genel.dilSinavlari` (16) dönüştürülmüş fixture ile 15 ülke × 2 dil, `sinav-aktar` birleştirme kuralları (geçici dosyada) |
| `taslak-birim-test.js` (yeni) | Node | üretici çıktısı güncel, 72 taslak, şema, id tekil, kişisel veri yok, eposta yalnız kaynaklı, model/ülke süzgeci, yer tutucu sayımı |
| `sinav-test.js` (yeni) | Playwright | 3 model yolu, URL ↔ çubuk eşleşmesi, profil varsayılanı, eski adresler (`?ulke=it`, `?filtre=rota`, `#ielts-academic`), AP gizli/aç düğmesi, boş durumlar, fixture ile 15 ülke yerel dil, sartlar "Dil sınavları" bölümü, 360 px taşma, PM ekran görüntüleri |
| `yazisma-taslak-test.js` (yeni) | Playwright | süzgeç (model/ülke), şablonsuz ülke boş durumu, taslak kartı → oluşturucu, kopyala (pano), mailto alıcısı yalnız kaynaklı adreste, geçmişe kayıt, 360 px, PM ekran görüntüleri |
| `rota-birim-test.js` (+) | Node | adım `dil` süzgeci (de + yerel → de-almanca yok; de + en → var; profil dil yok → en) ve `yolHaritasi` dil parametresi |
| Eski testler | — | yazisma 64, eposta-birim 119, hesap, erisim, rota, mezun, tasarim, tur11 … kırılmaz |

PM ekran görüntüleri (`scratchpad/shots`, 1280 + 390, açık + koyu): sinavlar `uni-mezun·se·en`, `lise·11·de·yerel`, `lise-mezun·fr·yerel`; yazismalar `uni-mezun·dk`, `lise·11·it`.

---

## 6. Riskler
| Risk | Önlem |
| :--- | :--- |
| Ajan 13 alan biçimi farklı gelir | S6: motor birçok biçimi okur; `sinav-aktar` bilinmeyen alanları raporlar, yazmaz. |
| IELTS gibi kayıtlar 15 ülkeye açılınca pill satırı uzar | 4'ten fazla ülke "+n ülke" (title ve visually-hidden tam liste). |
| Taslaktaki adresin kaynağı yok | Y3: mailto'ya yazılmaz, açık uyarı. |
| `dil=hepsi` şartlar sayfasında tanınmaz | Şartlara giden bağlantılar `apSecimSorgusu` ile `en`e çevrilir. |

*Hazırlayan: Ajan 11 (Frontend & UX), 15 Ekim 2026.*

---

## 7. Uygulama notları ve plandan sapmalar (Ajan 11, 15–16 Ekim 2026)

| Konu | Uygulanan |
| :--- | :--- |
| Sınıf (sınavlar) | Sınıf seçimi süzmeyi etkilemez; yalnızca adreste taşınır ve şartlar bağlantısına geçer (AP kayıtlarında sınıf bilgisi yok). |
| Dil süzgeci ve AP | AP ve dil bilgisi olmayan giriş sınavları (SAT, TestAS) "yerel dil" seçiminde de görünür (S7: dil bilgisi yoksa süzgeçten etkilenmez). Ajan 13 kayıtlarına `dil` gelirse süzülür. |
| Boş meta alanları | Format, süre, puanlama ve tarihin dördü de yoksa kartta dört ayrı "Doğrulanamadı" kutusu yerine tek satır: "Bu kayıtta yok; Doğrulanamadı. Resmi kaynaktan kontrol et." (yeni dil sınavı kayıtları için). |
| Ülke pilleri | Seçili ülke (ya da hedef ülkeler) her seçimde öne alınıp vurgulanır; 5'ten fazla ülke "+n ülke". |
| Taslak kartı sınıfı | Taslak kartları `.tt-card` (şablon kartı `.tpl-card` seçicilerini ve Tur 6 rota testini etkilememek için ayrı sınıf). |
| Kişisel şablonların düzeyi | 9 şablonun `duzey` alanı yok; motor/arayüz bunları lisans sayar (isteğe bağlı `duzey: "yl"` ileride YL şablonu için). |
| `#sb-all` | "Tüm ülkelerin şablonlarını göster" kutusu kaldırıldı; yerini ortak ülke süzgecindeki "Tüm ülkeler" aldı. |
| Kaynaklı alıcı adresi | 72 taslağın 13'ünde adres geçiyor; yalnız 1'i (`study@tcd.ie`, `lisans-ie.json` · TCD kabul rehberi) kaynaklı maddede bulunduğu için mailto'ya yazılır. 12'si "adres adayı" uyarısıyla gösterilir. |
| Rota adımı `dil` (PM ek işi) | `rota.js` `dilUygun`, `egitimDili`, `zamanCizelgesi.gizlenenDil`; `sartlar-motor.yolHaritasi(…, dil)` ve `gizlenenDil`; Rotam ve şartlar yol haritası gizlenen adım sayısını yazar. |
