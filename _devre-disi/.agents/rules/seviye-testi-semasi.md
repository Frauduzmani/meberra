# AP MEBERRA — Seviye Testi (Tanı Sınavı) Veri Şeması (PM, Tur 3)

Amaç: AP sınav kaydından (son gün 13 Kasım 2026) önce öğrencinin her dersteki hazırlığını **dersin TÜM CED ünitelerinde** ölçmek ve ünite bazında rapor üretmek.

## Dosya: `data/sorular/seviye/<ders>.js` (her ders ayrı dosya; HTML'e gömülmez)

```js
window.APMEBERRA_SEVIYE = window.APMEBERRA_SEVIYE || {};
window.APMEBERRA_SEVIYE["calculus-ab"] = {
  ders: "calculus-ab",                  // anahtar: calculus-ab | calculus-bc | physics-1 | chemistry | biology | english-language
  ad: "AP Calculus AB",
  cedSurum: "CED (güncel, 2024-25 sonrası)", // hangi CED'e göre hazırlandığı
  portalSayfasi: "ap-calculus.html",    // çalışma için yönlendirilecek sayfa
  uniteler: [                           // dersin TÜM üniteleri, CED sırasıyla
    { no: "1", ad: "Limits and Continuity", sinavAgirligi: "10–12%", portaldaVar: true },
    // ... sinavAgirligi: College Board CED'deki MCQ ağırlık aralığı (biliniyorsa; bilinmiyorsa null)
    // portaldaVar: ap-*.html'de bu ünitenin konu anlatımı + soru istasyonu var mı (true/false)
    // portalCapa: portaldaVar true ise ZORUNLU — ünitenin portal sayfasındaki bölüm id'si
    //   (ör. "calc-unit8-lecture-section"); rapordaki "Portalda çalış" bağlantısı buraya atlar.
    //   Yeni ünite eklendiğinde portaldaVar: true + portalCapa birlikte güncellenir (pm-denetim kontrol eder).
  ],
  sorular: [ /* aşağıdaki soru şeması */ ]
};
```

## Soru şeması (mevcut motorla uyumlu + tanı alanları)
```js
{
  id: "sv_calc_u1_1",           // benzersiz; önek sv_<ders>_u<no>_<n>
  unite: "1",                   // uniteler[].no ile eşleşmeli
  beceri: "Limits from graphs", // kısa konu/beceri etiketi (CED topic adı)
  zorluk: "easy" | "medium" | "hard",
  sureSn: 90,                   // önerilen süre (saniye)
  hesapMakinesi: false,         // bu soruda grafik hesap makinesi gerekir mi
  source: "AP-style original (CED Topic 1.3)",
  question: "...",              // İngilizce; MathJax $...$; JS string'de \\ çift
  options: [ { id:"A", text:"...", isCorrect:true }, { id:"B", text:"...", isCorrect:false, errorTag:"...", remediation:"..." }, ... ],
  generalRemediation: "...",
  stepByStepSolution: "..."
}
```

## İçerik kuralları
- **Kapsam:** Her ünite için **3 soru** (1 easy, 1 medium, 1 hard). Ünite sayısı az olan derste (English) beceri başına 3 soru.
- **Yeni soru:** Portal soru bankasındaki soruları KOPYALAMA. Tanı sorusu, ünitenin en temel ve en ayırt edici kavramını ölçmeli.
- Ortak içerik kurallarına (`content-rules.md`) aynen uy:
  - Kalın yazı için `<strong>` kullan; Markdown `**` yasak.
  - Her soruda tek doğru şık. Doğru şıkların konumu dengeli dağılsın ve doğru şık sistematik olarak en uzun şık olmasın.
  - Çeldiriciler gerçek öğrenci hatalarını temsil etsin.
  - Kaynak etiketi dürüst olsun.
  - Her cevap bağımsız hesapla doğrulansın (Python 3.11, proje klasörünün DIŞINDAN çalıştır).
  - Çözüm metnindeki harf, işaretli doğru şıkla aynı olsun.
- `uniteler[].sinavAgirligi`: College Board CED'deki resmi aralığı yaz. Emin değilsen `null` yaz; tahmin etme.
- `portaldaVar`: İlgili ap-*.html dosyasına bakarak doğru doldur.
- **Denetim:** `node araclar/pm-denetim.js`, `data/sorular/seviye/*.js` dosyalarını da tarar ve 0 sorun vermelidir.
