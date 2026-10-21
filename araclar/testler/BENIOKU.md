# Tarayıcı Regresyon Testleri

> **1.15.0 notu:** Aşağıdaki Playwright betikleri (`*-test.js`, `interact.js`, `paket-test.js`, `sv-paket.js`,
> `oturum-tohum.js`) güncelliğini yitirdi ve `eski/` klasörüne taşındı (bkz. `eski/README.md`). Güncel tarayıcı
> testleri kökteki `e2e/` klasöründedir: `npm run test:e2e`. Bu klasörde kalan `*-birim-test.js` dosyaları
> `npm run test:birim` ile hep birlikte çalışır. Aşağıdaki tablo tarihsel kayıttır.

Bu testler portalı gerçek bir tarayıcıda (Playwright + Chromium) çalıştırır.

## Kurulum (bir kez)
Bu klasörü proje DIŞINDA bir çalışma klasörüne kopyalayın, sonra orada şunu çalıştırın:
```
npm install
```
`package.json` yalnızca `playwright-core` paketini kullanır. Chromium yolu betiklerde sabit yazılıdır:
`C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe`.
Bu yol değişirse betiklerdeki `executablePath` satırını güncelleyin.
Betikler ekran görüntülerini `../shots/` klasörüne yazar.

## Testler
| Betik | Neyi test eder |
| :--- | :--- |
| `interact.js` | Soru motoru, Hata Defteri, menü, tema, İlerleme, Bilgi Merkezi |
| `backup-test.js` | İlerlemeyi dışa/içe aktarma, birleştirme kuralları, bozuk dosya reddi |
| `ulke-test.js` | Almanya, İtalya, İstanbul ve Ajanlar sayfaları (2 genişlik × 2 tema) |
| `seviye-test.js` | Seviye testi + rapor (örnek veriyle; süreli mod, geç kayıt, eksik dosya, yedekleme) |
| `pm-seviye-test.js` | PM kabul testi: gerçek Calculus AB bankası, elle hesaplanmış beklenen değerler |
| `hesap-test.js` | Kayıt → profil → Üniversitelerim → Sınavlar → deneme → çıkış → tekrar giriş; kurtarma kodu, şifre değiştirme, kişi verisi takası (Tur 5) |
| `deneme-test.js` | Deneme motoru: dengeli seçim, seed, yenilemede devam, teslim, inceleme, otomatik teslim, geçmiş (Tur 5) |
| `yanlislar-test.js` | Tur 14 A7: Yanlışlarım modu (`deneme.html?mod=yanlislar`): boş durum, 6 açık hata tohumu, ders süzgeci, tek oturum, doğru cevap hatayı kapatır, sonuç eylemleri (tekrar çöz · konu anlatımı çapası · Bugün), `&deneme=`, yarım deneme uyarısı, Bugün/Çalış/İlerleme bağlantıları, 360 px açık/koyu, ağ isteği yok |
| `tasarim-test.js` | Tasarım v3: 360 px taşma (23 sayfa, `calis` dahil), Tur 14 alt gezinme / Hedefim / Bugün / Çalış merkezi (5c) senaryoları, İçindekiler (ders sayfaları), açılır notlar (Sınavlar/Rotam), tema geçişi, panel bölüm sırası, yerel bağlantılar, monogramlar (Ekim 2026) |
| `mezun-test.js` | Tur 10 K4/K5: mezun sihirbazı ve profil alanları, eski profil uyumu, mezun Rotam (hedef yıl, "Şimdi", YKS koşulu, AP yok), iki ülke uyarısı, yıla bağlı kesinlik; 360/390/1280 px |
| `mezun-birim-test.js` | (Node, proje klasöründen) auth doğrulaması, takvim yılı, koşul filtresi, kesinlikYila, gerçek rota verisi |
| `mezun-menu-test.js` | Tur 11: mezun.html yönlendirmesi (eski yer imleri), lise mezunu × Macaristan içeriği ve BME duyurusu (bitiş tarihi), ülke rozetleri (dk/ie), menüde Mezunlar yok, Panelim duyuru kartı, 360 px |
| `tur11-test.js` | Tur 11: seçici (3 model, çok dilli ülke, İrlanda, klavye, geri tuşu), Ajan 13 önizlemesi (K-B, K-D), üniversiteler (15 sekme, filtre, 360 px), üniversite mezunu Panelim/Rotam/menü, YL sihirbazı, PM ekranları (`../shots/t11-*.png`) |
| `secici-birim-test.js` | (Node) seçim URL uyum matrisi, program durumu kuralı, ulkeBolumleri dil süzgeci, universiteSuz, duyuruSuz, genelYol, liste aynılığı (app/auth/rota/motor) |
| `profil-v2-birim-test.js` | (Node) profil normalleştirme (eski kayıt), model / 15 ülke / dil / üniversite mezunu doğrulamaları, model değişiminde alan temizliği |
| `ulke-veri-test.js` | (Node) üretici 0 sorun ve çıktılar güncel, dizin şeması, sartlar.js + mezun-ulkeler.js taşıma eşdeğerliği, de/11 dil süzgeci, Ajan 13 çıktıları (K-A, K-B) |
| `tasima-test.js` | Tur 10 Aşama 4: eski (AP MEBERRA öncesi) kod adlı anahtarlarla tohumlanmış tarayıcıda hesap, profil, ilerleme, Hata Defteri, deneme, FRQ, rota, tema ve hesap kasalarının yeni `apmeberra` anahtarlarına taşınması; eski formatlı yedeğin kabulü (bu dosya ad-denetimi izin listesinde) |
| `sinav-birim-test.js` | (Node) Tur 12 sınav motoru: seçim (URL > profil), dil sınıflaması (kod/Türkçe ad/ülkeye göre yerel), düzey varsayılanları, süzgeç, şema, yl-genel önizleme fixture'ıyla 15 ülke × 2 dil, `araclar/sinav-aktar.js` uçtan uca (geçici klasörde) |
| `taslak-birim-test.js` | (Node) Tur 12 hazır teyit taslakları: üretici çıktısı güncel, 72 taslak, kişisel veri yok, e-posta yalnız kaynaklı, model × ülke süzgeci, şablon ülke süzgeci |
| `sinav-test.js` | Tur 12 Sınavlar v2: 3 model, sekme sırası, AP bandı, boş durumlar, profil varsayılanı, eski adresler, şartlar "Dil sınavları" bölümü (15 ülke, fixture), 360/390/1280 açık/koyu (`../shots/t12-sinavlar-*.png`) |
| `yazisma-taslak-test.js` | Tur 12 Yazışmalarım v2: durum × ülke süzgeci, şablonsuz ülke boş durumu, taslak → oluşturucu → kayıt, kopyala, mailto yalnız kaynaklı adresle, 360/390/1280 (`../shots/t12-yazismalar-*.png`) |
| `paket-test.js` | `sunum/AP-MEBERRA` paketi, internet tamamen kapalıyken |
| `sv-paket.js` | Paketteki seviye testi, internet kapalıyken |

`paket-test.js` ve `sv-paket.js` çalıştırılmadan önce paket üretilmelidir: `node araclar/sunum-olustur.js`

## Oturum koruması (Tur 5)
Tur 5'ten itibaren portal, oturum açılmadan `giris.html` sayfasına yönlendiriyor. Bu yüzden her test, tarayıcı bağlamını açtıktan sonra `oturum-tohum.js` ile bir test hesabı ve oturum yazar. Yeni bir test yazıyorsanız bu satırı ekleyin:
`await require('./oturum-tohum')(ctx);`

## Teslim öncesi zorunlu sıra
0. Ders sayfalarına soru eklendiyse: `node araclar/deneme-bankasi-olustur.js` (deneme havuzunu yeniden üretir)
0b. `data/mevzuat/kaynak/` değiştiyse: `node araclar/ulke-veri-olustur.js` (ülke verisini üretir; şema hatasında yazmaz)
1. `node araclar/pm-denetim.js` → **0 sorun**
1b. `node araclar/ad-denetimi.js` → **0 sorun**. Proje adı AP MEBERRA'dır; tüm metin dosyalarında eski ad aranır, istisnalar yalnızca klasör yolu ve `ad-denetimi.js` içindeki `KOD_ADI_IZIN` listesidir (Tur 10: eski kod adları da denetlenir).
2. Yukarıdaki testler → hepsi geçmeli
3. `node araclar/sunum-olustur.js` → paket + zip doğrulaması (`sunum/AP-MEBERRA-Sunum-<tarih>.zip`)
4. Paket testleri: `paket-test.js`, `sv-paket.js` (internet kapalıyken)
