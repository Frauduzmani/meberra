# Şekilli sorular — bağımsız inceleme (onay2)

Girdi: `araclar/yeni-sorular2/sekilli.json` (50 soru: 20 Calculus, 10 Chemistry, 12 Economics, 8 Physics 1)
Karar dosyası: `araclar/onay2/sekilli.json`

## Sayılar
| Karar | Adet |
|---|---|
| onay | 48 |
| duzelt | 2 |
| red | 0 |

## Yöntem
- Her SVG Node'da ayrıştırıldı: eksen işaret etiketlerinden piksel → veri dönüşümü kuruldu; path/polyline, daire, çizgi ve dikdörtgenler veri koordinatlarına çevrildi (alt metne güvenilmedi). PES tepe yükseklikleri, MB dağılımı alanları, arz–talep/AD–AS kesişimleri, titrasyon eğrileri (başlangıç, yarı-eşdeğerlik, eşdeğerlik ve fazla baz/asit pH'ları ayrıca hesaplandı) tek tek doğrulandı.
- Her soru anahtara bakılmadan sıfırdan çözüldü; 50 anahtarın 50'si doğru.
- `sekilleriDogrula` / `sekilDogrula({secenek:true})`: tüm gövde ve şık şekilleri hatasız, uyarısız; temizlenmiş SVG girdiyle birebir aynı.
- `server/tohum/soru-bankasi.json` (1442 soru) ile gövde metni ve id karşılaştırması yapıldı: kopya yok.

## Düzeltmeler
1. **phys_sk_u4_2** (şekil hatası): Kuvvet grafiğinin çizgi yolu (4 s, 6 N)'den doğrudan (6 s, −4 N)'ye gidiyor ve (5 s, 0) köşesini atlıyordu. Çizildiği hâliyle eksen t = 5.2 s'de kesiliyor, net itme 18 N·s ve v = 10.5 m/s çıkıyor; bu değer hiçbir şıkta yok. Taralı alanlar, dolu nokta, alt metin ve açıklama ise (5, 0) köşesini varsayıyor. Yola `L229.2 129.8` köşesi eklendi. Şeklin tamamı `duzeltme.sekil` içinde veriliyor. Anahtar B (+10 m/s) değişmedi.
2. **calc_sk_u2_2** (çeldirici açıklaması): B (−1) şıkkının etiketi "(fg)′ = f′g′" diyordu. Oysa x′·f′(2) = 1 eder, bu da doğru cevaptır (C). B'nin hata açıklaması −1'i gerçekten üreten hataya göre, yani f(2)·f′(2) ya da yalnız f(2) alınmasına göre yeniden yazıldı. Anahtar C değişmedi.

## Küçük notlar (karar gerektirmeyen)
- calc_sk_u1_3: x = −2'nin sağındaki dal pencerenin altından (y = −3.5) x ≈ −1.54'te giriyor. Asimptota yakınsama görsel olarak kabul edilebilir.
- econ_sk_mi3_1: MC eğrisi ATC'yi q ≈ 7.6'da kesiyor, alt metinde ≈ 7.7 yazıyor. Fark ihmal edilebilir; soruyu etkilemiyor.
- chem_sk_u1_2, B çeldiricisinin açıklamasındaki "(ör. H)" örneği biraz belirsiz ama yanlış değil.
