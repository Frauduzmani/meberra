# Tasarım 1.9.0 — Genel sayfalar: SONRA

Yaklaşım: "woow" yeni animasyondan değil; tek odak, sakin kartlar, tekrarların kaldırılması ve odaklı sınav ekranından.
Ölçüm aynı koşullarda (1440 / 390 / 360 px, açık + koyu, dolu ve boş hesap, yönetici).

## Sayfa sayfa yapılanlar (önce listesindeki sırayla)

| # | Sayfa | Değişiklik | Dosya |
|---|-------|-----------|-------|
| 1 | Yasal metinler | Tablo hücreleri `overflow-wrap: break-word` + ilk sütun en az 9em; kelimeler artık harf harf kırılmıyor. | vitrin.css |
| 2 | Profil | 4 bölüm: **Hedeflerim · Hesap ve bildirimler · Velin · Lig ve davet**. Masaüstünde yapışkan sol alt menü, telefonda segment. Bölümler yerinde kalır (betikler/kimlikler aynı); `/profil#veli`, `#pf-hedefAlan`, `#bildirim-ayarlari` gibi çapalar doğru bölümü açar. Seçili olmayan 13 ülke kompakt (yalnız ad). | app.js `initProfilSekmeler`, styles.css 1.9.1 |
| 3 | Çalış | Sayfada tek Tilo (ilk ders kartı); "Kilitli üniteler Premium ile açılır" notu tek sefer; kart içi "kaldığın yer" kutusu sade satır. | styles.css 1.9.2 |
| 4 | Deneme sınavı | **Odak modu**: sınav sürerken menü, XP, zil, hesap ve alt gezinme gizli; markanın yanında "Deneme · odak modu". | deneme.css |
| 5 | Deneme katalog | Uyarı rengi yerine sakin not metni; "Seçtiğin ders" çipi; kapsam tek satır; Premium CTA'sı kart içinde dış çizgili (turuncu/mor karmaşası bitti). | deneme.css |
| 6 | Soru kartı | Geri bildirim tek nötr kutu, renk yalnız üst çizgi + başlıkta; "konu hatırlatması" ve "adım adım çözüm" iç kutu değil çizgiyle ayrılan bölüm. | styles.css 1.9.3 |
| 7 | İlerleme | Kazanılmayan rozetler küçük/soluk (telefonda 3 sütun, ~3 ekran → 1); başlanmamış dersler tek satır; Yanlışlarım boşken "Tek oturumda çöz" gizli. | oyun.css, styles.css 1.9.4 |
| 8 | Seviye testi | Geri sayım ince şerit; "puan tahmini değildir" notu formun altında sakin satır → form tek odak. | seviye-testi.html, styles.css 1.9.5 |
| 9 | Premium | 7 gün deneme teklifi plan kartının altında ikincil şerit (dış çizgili buton); birincil eylem "Devam et". Geç görünen şerit artık içeriği itmiyor. | premium.html, buyume.css |
| 10 | Sorularım | Liste boşken başlıktaki "Soru sor" gizli; boş durumdaki Tilo + tek CTA kalır. | styles.css 1.9.6 |
| 11 | Yönetim | XP çipi ve öğrenci "Rehberler" şeridi panelde yok; özet kutuları tek tip (renkli üst çizgi yalnız uyarıda), eşit yükseklik, sıfır günler de çubuk. | app.js, admin.css |
| 12 | Şifre sıfırla | Geçersiz bağlantıda boş form yerine uyarı + tek buton "Girişe dön ve yeni bağlantı iste". | sifre-sifirla.html, giris.css |
| 13 | Bugün | Hero'da "Hoş geldin" rozeti ve görev türü çipi kaldırıldı (Tilo selamı zaten karşılıyor). | styles.css 1.9.7 |
| 14 | Ders hub'ı | Ünite başlığında tek birincil eylem: **Sürdür / Başla: Ünite N**; telefonda anlatım kartlarının iç dolgusu inceltildi (metin sütunu ~270 → ~320 px). | app.js, styles.css 1.9.10, icerik.css |
| — | Genel | Kısa sayfalarda altbilgi sayfa dibinde; navbar XP çipinin yerleşim kuralları ortak dosyada (CLS düzeltmesi). | styles.css 1.9.8–1.9.9 |

## CLS (PerformanceObserver, `layout-shift`, girdi hariç; 1440 ve 390 px)

| Sayfa | Önce (1440) | Sonra (1440) | Sonra (390) |
|-------|------------|--------------|-------------|
| Premium | 0.090 | 0.008 | 0 |
| Deneme | 0.134 | 0.003 | 0 |
| Bugün | 0.024 | 0.000 | 0 |
| Fiyatlar | 0.024 | 0.011 | 0 |
| Vitrin, Giriş, Çalış, İlerleme, Profil, Ders, Sorularım, Yönetim | ≤ 0.017 | ≤ 0.010 | 0 |

Kök neden: `canli.css`'i statik yüklemeyen sayfalarda XP çipi CSS gelene kadar biçimsiz kalıp menüyü 60 → 92 px'e uzatıyordu.

## Kontroller
- 360 ve 390 px'te tüm sayfalarda yatay taşma yok.
- Koyu tema: yeni öğeler token'lı (`--btn-bg/--on-btn`, `--accent-soft`, `--energy-text`); mobil segmentte etkin sekme koyu temada da ≥ 4.5:1.
- Azaltılmış hareket: yeni animasyon eklenmedi (yalnız 150 ms renk geçişleri).
- `node araclar/testler/*-birim-test.js`, `npm test` (106/106), `node araclar/pm-denetim.js` geçti.

## Bilinçli olarak bırakılanlar
- Deneme katalogundaki "Genel deneme" formu ücretsiz kullanıcıya da tam görünüyor (deneme.js mantığı; bu turun dosyası değil).
- Navbar'ın ilk çizimde 1–3 px'lik oynaması (≈0.002) — app.js menü kurulumundan; bütçe içinde.
