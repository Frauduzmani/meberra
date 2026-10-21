// Meberra — İçerik denetimi uygulama aracı (v1.10.0)
// araclar/icerik-denetim/{calculus,physics,chemistry,biology-english-electives}.json denetim sonuçlarını
// server/tohum/soru-bankasi.json tohumuna uygular ve araclar/icerik-denetim/UYGULAMA.md günlüğünü yazar.
//
// Kullanım (proje klasöründen):
//   node araclar/icerik-uygula.js --kuru     Neyin değişeceğini yazar; hiçbir dosyaya dokunmaz
//   node araclar/icerik-uygula.js            Tohumu günceller (değişiklik varsa tohum "surum" +1) ve UYGULAMA.md'yi yazar
//
// İdempotenttir: ikinci çalıştırma "0 yeni değişiklik" verir, tohum sürümü yeniden artmaz.
// Kurallar:
//  - ek zenginleştirmesi her soruya birleştirilir (mevcut ek anahtarları korunur; seviye sorularındaki boolean
//    hesapMakinesi korunur, denetimin üç düzeyli değeri hesapMakinesiDurum alanına yazılır).
//  - Metin düzeltmeleri aşağıdaki KARARLAR tablosundan gelir: her öneri elle incelendi; uygulanmayanlar nedeniyle loglanır.
//  - dogru (cevap anahtarı) ASLA değişmez (denetimlerde hatali-anahtar yok); değişirse araç durur.
//  - Zorluk yalnızca denetim o soru için gerekçe yazdıysa değişir; seviye testinde ünite başına zorluk çeşitliliği korunur.
//  - Birebir tekrar: kopya "arsiv" yapılır (silinmez; cevap geçmişi çözülmeye devam eder). Seviye testinde her ünite tam
//    3 soru (pm-denetim alt sınırı) olduğundan seviye kopyaları arşivlenmez, insan incelemesine yazılır.
//  - Kimya konu etiketleri (CED numarası güveni "orta") konu alanında değişmez; yalnız ek.cedKonu doldurulur.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TOHUM = path.join(ROOT, "server", "tohum", "soru-bankasi.json");
const DENETIM_DIR = path.join(ROOT, "araclar", "icerik-denetim");
const RAPOR = path.join(DENETIM_DIR, "UYGULAMA.md");
const DOSYALAR = [
  { dosya: "calculus.json", ad: "AP Calculus", konuKurali: "karar", zorlukKurali: "gerekce" },
  { dosya: "physics.json", ad: "AP Physics + CEnT-S", konuKurali: "oneri", zorlukKurali: "gerekce" },
  { dosya: "chemistry.json", ad: "AP Chemistry", konuKurali: "yalnizCed", zorlukKurali: "gerekce" },
  { dosya: "biology-english-electives.json", ad: "AP Biology + English + Electives", konuKurali: "karar", zorlukKurali: "gerekce" }
];
const ZORLUKLAR = ["easy", "medium", "hard"];
const EK_ANAHTAR = ["kavram", "ipucu", "sikHata", "cedKonu"];
const KURU = process.argv.includes("--kuru");
const R = String.raw;
const BC_ROZET = "<span class='card-badge badge-rose'>BC ONLY</span> ";
const BC_KALIN = "<strong>[BC ONLY]</strong> ";

// ---------------------------------------------------------------------------------------------------------------
// KARARLAR: her düzeltme önerisi için elle verilen karar. islemler: { yol, eski, yeni } metin değişimi | { yol, deger } atama |
// { yol, onek } başa ekleme. yol: govde | aciklama | genel_hatirlatma | konu | secenek.X | hata.X.etiket | hata.X.aciklama
// atla: { neden, insan: true } → uygulanmaz, UYGULAMA.md "insan incelemesi" listesine yazılır.
// arsiv: { asil } → bu soru asil'in birebir tekrarıdır; durum = arsiv.
// ---------------------------------------------------------------------------------------------------------------
const KARARLAR = {
  // ---- AP Calculus ----
  calc_u1_q2: { neden: "A ve B çeldirici teşhisleri şıkları üretmiyordu (2a = 4 − a → 4/3; 2a − a → 1). Yeni teşhisler yeniden hesaplandı: 2a + 3 = 4 + a → a = 1; 2a + 3 = 4 + 3a → a = −1.",
    islemler: [{ yol: "hata.A.etiket", deger: "İşaret Hatası: Sağ parçayı x² + a gibi okuyup 2a + 3 = 4 + a yazmak (a = 1 çıkar)." },
      { yol: "hata.B.etiket", deger: "Taşıma Hatası: 2a + 3 = 4 − a denkleminde terimleri yanlış tarafa geçirip 2a + 3 = 4 + 3a yazmak (a = −1 çıkar)." }] },
  calc_u1_q10: { neden: "CED'de 1.11 = Defining Continuity at a Point; Removing Discontinuities 1.13.", islemler: [{ yol: "konu", eski: "1.11 Removing Discontinuities", yeni: "1.13 Removing Discontinuities" }] },
  calc_u1_q19: { neden: "Açıklamanın 4. adımı yalnız soldan limiti söylüyordu; doğru şık iki tek taraflı limiti de belirtiyor.",
    islemler: [{ yol: "aciklama", eski: R`4. Doğru ifade: soldan limit $-4$ ve iki taraflı limit yok.`, yeni: R`4. Tek taraflı limitler $-4$ (soldan) ve $4$ (sağdan); eşit olmadıkları için $\lim_{x \to 2} h(x)$ yoktur.` }] },
  calc_u1_q22: { neden: "A da doğru bir sonuç söylüyor; kök 'en eksiksiz, tüm hipotezleri içeren' gerekçeyi istemeli (anahtar D değişmez).",
    islemler: [{ yol: "govde", eski: "Which of the following is a complete justification that", yeni: "Which of the following is the most complete justification, including all hypotheses, that" }] },
  calc_u2_q2: { neden: "LaTeX cases ortamında satır ayırıcı tek ters bölüydü; iki parça tek satırda görünüyordu.",
    islemler: [{ yol: "govde", eski: R`x \le 1 \ bx - 2`, yeni: R`x \le 1 \\ bx - 2` }] },
  calc_u2_q3: { neden: "B (−11) ve C (11) teşhisleri yer değiştirmişti: (−4)(−1)'i −4 almak 11 verir (C); f'g − fg' yazmak 4 − 15 = −11 verir (B).",
    islemler: [{ yol: "hata.B.etiket", deger: "İşaret Hatası: Çarpım kuralını f'g − fg' gibi çıkarma ile yazıp 4 − 15 = −11 bulmak." },
      { yol: "hata.B.aciklama", deger: "Çarpım kuralı bir toplamdır: h'(2) = f'(2)g(2) + f(2)g'(2) = (−4)(−1) + (3)(5) = 4 + 15 = 19." },
      { yol: "hata.C.etiket", deger: "İşaret Hatası: (−4)(−1) çarpımını −4 alıp −4 + 15 = 11 bulmak." },
      { yol: "hata.C.aciklama", deger: "(−4) · (−1) = +4'tür. 4 + 15 = 19 olur." }] },
  calc_u2_q4: { neden: "D (y = −x + 7) şıkkının eğimi −1; eski teşhis eğimi 2 hesaplıyordu.",
    islemler: [{ yol: "hata.D.etiket", deger: "Eğim Hatası: Bölüm kuralını yanlış sadeleştirip x = 2'de eğimi −1 bulmak." },
      { yol: "hata.D.aciklama", deger: R`Bölüm kuralı uygulanmalıdır: $\frac{d}{dx}[u/v] = \frac{u'v - uv'}{v^2}$. Burada $y' = \frac{-3}{(x-1)^2}$, yani $x = 2$'de eğim $-3$'tür.` }] },
  calc_u2_q12: { neden: "e^x ve sin x türevleri CED 2.7; 2.6 sabit/toplam/fark kuralları.", islemler: [{ yol: "konu", eski: "2.6 Tangent Line", yeni: "2.7 Tangent Line" }] },
  calc_u3_q1: { neden: "C (−14) teşhisi hatanın nasıl üretildiğini göstermiyordu: g'(3)·g'(1) = 7·(−2).",
    islemler: [{ yol: "hata.C.etiket", deger: "Eşleştirme Hatası: f' yerine g' tablosunu kullanıp g'(g(1))·g'(1) = g'(3)·(−2) = 7·(−2) = −14 hesaplamak." }] },
  calc_u3_q2: { neden: "Eski açıklama 'xy' unutulursa −2/3 çıkar' diyordu; gerçekte −1 çıkar. Yanlış iddia kaldırıldı, doğru kurulum eklendi.",
    islemler: [{ yol: "hata.A.etiket", deger: "Çarpım Kuralı Hatası: xy teriminin türevini yanlış alıp yanlış bir oran elde etmek." },
      { yol: "hata.A.aciklama", deger: "d/dx[xy] = 1·y + x·y' (Çarpım Kuralı). Doğru kurulum: 2x + y + xy' + 2yy' = 0; (1, 2) noktasında 4 + 5y' = 0 ⟹ y' = −4/5." }] },
  calc_u3_q8: { neden: "B ve C matematiksel olarak aynı ifadeydi (iki özdeş çeldirici). C, tanımlı bir hatadan gelen yeni çeldiriciyle değişti; anahtar D aynı.",
    islemler: [{ yol: "secenek.C", deger: "y' = x^(sin x) · (sin x)/x" },
      { yol: "hata.C.etiket", deger: "Eksik Çarpım Kuralı: sin(x)·ln(x)'in türevinde yalnızca sin(x)·(1/x) terimini alıp cos(x)·ln(x) terimini unutmak." },
      { yol: "hata.C.aciklama", deger: "ln(y) = sin(x)·ln(x) çarpımının türevi iki terimlidir: cos(x)·ln(x) + sin(x)/x. Sonra y ile çarpılır." }] },
  calc_u4_q1: { neden: "Eski teşhis (r = 4 sabit) −3/(8π) verir, B'deki −1/(6π)'yi değil.",
    islemler: [{ yol: "hata.B.etiket", deger: "Oran Hatası: Benzer üçgen oranını ters kurmak ya da türevde katsayıyı yanlış almak (sonuç çok küçük çıkar)." }] },
  calc_u4_q14: { atla: { insan: true, neden: "calc_u1_q11 ile aynı limit (1 − cos x)/x², ama şıklar farklı ve ünite bağlamı (L'Hôpital) farklı: birebir kopya değil. Önerilen yeni kök ((x − sin x)/x³ = 1/6) yeni şıklar ve çözüm gerektiriyor." } },
  calc_u5_q3: { neden: "Kök 'The figure above' diyordu ama grafik yok; ifade sözel betime çevrildi (SVG eklemek ayrı iş).",
    islemler: [{ yol: "govde", eski: "The figure above (graphical description) shows the derivative $f'$ of a twice-differentiable function $f$ on $[-4, 4]$. The graph of $f'$ has horizontal",
      yeni: "The graph of the derivative $f'$ of a twice-differentiable function $f$ on $[-4, 4]$ has the following features: it has horizontal" }] },
  calc_u6_q25: { neden: "D teşhisi şıktaki −3e^{3x} terimini açıklamıyordu.",
    islemler: [{ yol: "hata.D.etiket", deger: R`Türev/İntegral Karışıklığı: $v = \int e^{3x}\,dx$ yerine $v = 3e^{3x}$ almak ve $\int v\,dx$ terimini de integral almadan $3e^{3x}$ yazmak.` }] },
  calc_u6_q32: { atla: { insan: true, neden: "Denetim iki seçenek veriyor ('[BC ONLY]' ekle ya da konuyu AB 6.10 yap); çözüm AB tekniği istediği için hangisinin doğru olduğu öğretmen kararı." } },
  calc_u6_q33: { arsiv: { asil: "calc_u6_q27" }, neden: "calc_u6_q27 ile birebir aynı integral ve aynı şık kümesi (yalnız sıra farklı)." },
  calc_u7_q31: { neden: "Ünite 7'deki diğer BC sorularıyla tutarlı BC etiketi.", islemler: [{ yol: "govde", onek: BC_KALIN }] },
  calc_u8_q26: { neden: "Ünite 8–10'daki diğer BC sorularıyla tutarlı BC rozeti.", islemler: [{ yol: "govde", onek: BC_ROZET }] },
  calc_u8_q27: { neden: "Ünite 8–10'daki diğer BC sorularıyla tutarlı BC rozeti.", islemler: [{ yol: "govde", onek: BC_ROZET }] },
  calc_u8_q28: { neden: "Polar gösterim BC bilgisi; diğer BC sorularıyla tutarlı rozet.", islemler: [{ yol: "govde", onek: BC_ROZET }] },
  calc_u9_q25: { neden: "Ünite 9'daki diğer sorularla tutarlı BC rozeti.", islemler: [{ yol: "govde", onek: BC_ROZET }] },
  calc_u10_q3: { neden: "C (3) yalnız (1 + r) hatasından çıkmaz (o 2 verir = D); 3 ancak ilk terim 5 ve 1 + r birlikte alınınca çıkar.",
    islemler: [{ yol: "hata.C.etiket", deger: R`Çift Hata: İlk terimi $5$ alıp (indeks $n = 1$ iken) paydada $1 + r$ kullanmak: $5/(5/3) = 3$.` },
      { yol: "hata.C.aciklama", deger: R`$n = 1$ için ilk terim $5 \cdot \frac{2}{3} = \frac{10}{3}$'tür ve payda $1 - r = \frac{1}{3}$ olur: $\frac{10/3}{1/3} = 10$.` }] },
  calc_u10_q7: { neden: "Serinin toplamı ≈ 2.11 (sayısal olarak yeniden hesaplandı: 2.1097); metinde 2.04 yazıyordu.",
    islemler: [{ yol: "hata.B.aciklama", eski: "yaklaşık $2.04$'tür", yeni: "yaklaşık $2.11$'dir" }] },
  calc_u10_q16: { neden: "2/5 sonucu iki faktöriyel oranı hatasının birlikte yapılmasından çıkar; eski teşhis L = 0 verirdi.",
    islemler: [{ yol: "hata.A.etiket", deger: R`Faktöriyel Oran Hatası: $\frac{(2n+2)!}{(2n)!}$ oranını yalnız $2n+2$, $\frac{((n+1)!)^2}{(n!)^2}$ oranını da $(n+1)^2$ yerine $n+1$ almak: $\frac{2n+2}{5(n+1)} \to \frac{2}{5}$.` }] },
  sv_calcab_u3_2: { atla: { insan: true, neden: "calc_u3_q2 ile aynı soru. Seviye testinde her ünite tam 3 soru (alt sınır 3): arşivlenemez. Önerilen yeni kök (x² − xy + y² = 7, (−1, 2)) yeni şıklar gerektiriyor." } },
  sv_calcab_u4_3: { atla: { insan: true, neden: "calc_u4_q5 ile aynı limit. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni limit (e^{3x} − 1 − 3x)/x² = 9/2 yeni şıklar gerektiriyor." } },
  sv_calcbc_u3_2: { atla: { insan: true, neden: "calc_u3_q3 ile aynı soru. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni kök (x² + y² = 169, (5, 12)) yeni şıklar gerektiriyor." } },
  sv_calcbc_u6_3: { atla: { insan: true, neden: "calc_u6_q34 ile aynı integral. Seviye ünitesi 3 soru: arşivlenemez. Önerilen yeni integral (∫₃⁴ 2/(x² − 4) dx) yeni şıklar gerektiriyor." } },

  // ---- AP Physics + CEnT-S ----
  phys_u1_q8: { neden: "Kök 'A, B'yi ne zaman geçer?' diye yanlış bir öncül veriyordu (A başından beri önde). Şıklar zaten ifade biçiminde; anahtar B aynı.",
    islemler: [{ yol: "govde", eski: "At what time $t > 0$ does Car A overtake Car B?", yeni: "Which statement correctly describes the positions of the two cars for $t > 0$?" }] },
  sv_phys1_u3_2: { neden: "Yükseklik en sıkışık konumdan ölçülüyor (½kx² = mgh → 2.0 m); 'release point' belirsizdi.",
    islemler: [{ yol: "govde", eski: "how high above the release point does the ball rise?", yeni: "how high above its position at maximum compression does the ball rise?" }] },
  phys_mom_q9: { neden: "B (1.0 m/s) 'ağırlıksız ortalama' değil (o 1.5 verir); hızların toplamı toplam kütleye bölünmüş.",
    islemler: [{ yol: "hata.B.etiket", deger: "Kütle Unutuldu: Hızları kütleyle çarpmadan toplayıp toplam kütleye bölmek: (6.0 − 3.0)/3 = 1.0 m/s." }] },
  phys_u6_q10: { neden: "D etiketi başlıkta 'pay', metinde 'payda' diyordu. 3.0 rad/s, paydaki I_A yerine I_B kullanılınca çıkar (I_A = 0.3, I_B = 0.1, ω₀ = 12 ile doğrulandı).",
    islemler: [{ yol: "hata.D.etiket", deger: "Yanlış Başlangıç Momentumu: Paydaki I_A yerine I_B kullanmak: ω = I_B·ω₀/(I_A + I_B) = 3.0 rad/s." }] },
  phys_u3_q3: { neden: "B (34.3 m/s) = √(rg): tan θ hiç kullanılmamış; eski teşhis 'sin/cos kullanmak' diyordu. (C teşhisi ayrıca insan incelemesinde.)",
    islemler: [{ yol: "hata.B.etiket", deger: "tan θ Çarpanı Unutuldu: v = √(rg) hesaplamak (tan 20° hiç kullanılmamış)." }],
    insanNotu: "phys_u3_q3 C (11.8 m/s) çeldiricisinin hangi hatadan geldiği belirsiz (√(rg)·sin20° ≈ 11.7); tanımlı bir hataya göre yeniden yazılmalı." },
  phys_u2_q7: { neden: "Doğrusal sürüklenme Physics C konusu; P1 CED'de 2.6 Gravitational Force.", islemler: [{ yol: "konu", deger: "Physics C · Drag Force & Terminal Velocity" }],
    insanNotu: "phys_u2_q7 (ve phys_u1_q6, phys_wep_q16, phys_wep_q21, phys_mom_q21) Physics C soruları Physics 1 deneme/kapsamından ayrılmalı mı? Ürün kararı." },

  // ---- AP Chemistry ----
  chem_u1_q3: { neden: "'Anyonlar daima katyonlardan büyüktür' aşırı genelleme (Cs⁺ > F⁻); izoelektronik türlerle sınırlandı.",
    islemler: [{ yol: "hata.C.aciklama", eski: "Anyonlar daima katyonlardan daha büyüktür.", yeni: "Aynı elektron sayısına sahip (izoelektronik) türlerde anyonlar katyonlardan daha büyüktür." }] },
  chem_u1_q6: { atla: { insan: true, neden: "D çeldiricisi (63.00 amu; Europium) anlamsız; ama önerilen 63.93 amu B şıkkında zaten var. Yeni çeldirici ve teşhisi öğretmen yazmalı." } },
  chem_u2_q3: { atla: { insan: true, neden: "Lewis yapıları ortaklanmamış çift sayılarıyla yeniden yazılmalı ya da SVG çizim eklenmeli (içerik üretimi)." } },
  chem_u3_q4: { neden: "D şıkkındaki yol uzunluğu ifadesi kalibrasyon bağlamında belirsizdi; netleştirildi (0.50 cm ile absorbans yarıya iner → derişim düşük çıkar, D yine yanlış; anahtar C).",
    islemler: [{ yol: "secenek.D", deger: "The unknown was measured in a 0.50 cm cuvette, while the standards were measured in 1.00 cm cuvettes." }] },
  chem_u8_q9: { neden: "İç not '(Erdem standardı)' öğrenciye görünüyordu.", islemler: [{ yol: "genel_hatirlatma", eski: "Topic 8.3 (Erdem standardı):", yeni: "Topic 8.3:" }] },
  chem_u8_q11: { arsiv: { asil: "chem_u4_q3" }, neden: "chem_u4_q3 ile aynı soru (asetik asit + NaOH net iyonik denklemi; aynı anahtar, 4 şıktan 3'ü aynı). Denetim 'tekrarlar' listesinde." },
  chem_u8_q19: { neden: "Gövde karşılaştırılan asitleri listelemiyordu (D 'All three' diyor).",
    islemler: [{ yol: "govde", eski: "Which of the following is the strongest acid, and what is the best structural explanation?",
      yeni: R`Consider the oxyacids HClO, $\text{HClO}_2$, and $\text{HClO}_3$. Which of the following is the strongest acid, and what is the best structural explanation?` }] },
  sv_chem_u1_2: { atla: { insan: true, neden: "chem_u1_q2 ile aynı kavram ve veri (N/O IE). Seviye ünitesi 3 soru: arşivlenemez. Be/B ya da Mg/Al anomalisiyle yeniden yazılmalı." } },
  sv_chem_u6_2: { atla: { insan: true, neden: "chem_u6_q16 ile birebir aynı (H₂ + Cl₂ bağ entalpisi). Seviye ünitesi 3 soru: arşivlenemez. NH₃ sentezi gibi farklı tepkimeyle yeniden yazılmalı." } },
  sv_chem_u9_1: { atla: { insan: true, neden: "chem_u9_q1 ile aynı dört süreç. Seviye ünitesi 3 soru: arşivlenemez. Farklı süreçlerle yeniden yazılmalı." } },

  // ---- AP Biology + English + Electives ----
  bio_u1_q7: { atla: { insan: true, neden: "bio_u2_q3 ile neredeyse aynı (soğukta doymamış yağ asidi) ve içerik CED 2.4. Ünite 1 için yeni makromolekül sorusu yazılmalı." } },
  bio_u2_q8: { neden: "'Tartışmasız kanıtlar' bilimsel olarak aşırı iddialı.",
    islemler: [{ yol: "aciklama", eski: "endosimbiyotik kökeni tartışmasız şekilde kanıtlar.", yeni: "endosimbiyotik kökeni güçlü biçimde destekler." }] },
  bio_u7_q15: { neden: "Ki-kare (tuzluluk tercihi) içeriği 7.3 Artificial Selection değil; CED 7.12.", islemler: [{ yol: "konu", eski: "7.3 Chi-Square", yeni: "7.12 Chi-Square" }] },
  bio_u7_q26: { neden: "CED'de 7.11 Extinction; bu içerik 7.12 Variations in Populations.", islemler: [{ yol: "konu", eski: "7.11 Genetic Diversity", yeni: "7.12 Genetic Diversity" }] },
  bio_u7_q27: { neden: "RNA dünyası CED 7.13 Origins of Life on Earth.", islemler: [{ yol: "konu", eski: "7.12 Origins of Life", yeni: "7.13 Origins of Life" }] },
  sv_bio_u1_3: { atla: { insan: true, neden: "bio_u6_q1 ile aynı sayılar (%18 A). Seviye ünitesi 3 soru: arşivlenemez. Farklı yüzdeyle (ör. %28 A) yeniden yazılmalı; şıklar değişir." } },
  sv_bio_u4_2: { atla: { insan: true, neden: "bio_u4_q21 ile aynı veri (200 hücre, 20 mitoz, 24 saat). Farklı sayılarla yeniden yazılmalı; şıklar değişir." } },
  csa_q1: { neden: "2025-26 CSA CED'de ifadeler ve çıktı 1.3 (1.5 = Casting).", islemler: [{ yol: "konu", eski: "1.5 Expressions:", yeni: "1.3 Expressions and Output:" }] },
  csa_d4: { neden: "Eski D teşhisi (i++ okumak) B'deki istisnayı üretir, '3 5 7 4'ü değil (kod adım adım izlendi).",
    islemler: [{ yol: "hata.D.etiket", deger: "Adım ve Sınır Hatası: i += 2'yi i++ gibi okuyup son turdaki arr[i + 1] taşmasını da gözden kaçırmak (döngüyü i = 2'de bitirmek)." }] },
  csa_d6: { neden: "D (12) = satır × sütun sayısı; '1 tabanlı indeks' 16 verir.",
    islemler: [{ yol: "hata.D.etiket", deger: "Boyut / Eleman Karışıklığı: m[2][3] değeri yerine satır × sütun sayısını (3 × 4 = 12) hesaplamak." },
      { yol: "hata.D.aciklama", deger: "m.length = 3 ve m[0].length = 4 yalnızca boyutlardır; istenen eleman m[2][3] = 2 · 3 + 3 = 9." }] },
  eng_read_q12: { atla: { insan: true, neden: "Cevabı ele veren pasaj başlığı soru bankasında değil (ap-english.html / deneme-meta.json pasajları); bu adımın kapsamı dışında. Başlık 'From an address on communication in engineering' olarak nötrleştirilmeli." } },
  eng_read_q16: { atla: { insan: true, neden: "Şıkları sayısal sıraya dizmek anahtarı C → D değiştirir; denetimde hatalı anahtar yok, anahtar değiştirilmez." } },
  eng_write_q15: { atla: { insan: true, neden: "Kökü retorik amaçla yeniden çerçevelemek yeni yazım gerektirir (SAT tarzı dilbilgisi sorusu)." } },
  eng_write_q18: { atla: { insan: true, neden: "Paralellik sorusunu retorik etkiyle ilişkilendirmek yeni yazım gerektirir." } },
  eng_write_q19: { neden: "Doğru şık D 'save the school money' yerine 'save money' diyerek anlamı değiştiriyordu; C teşhisi 'yanlış nedensellik' olarak netleştirildi. Anahtar D aynı.",
    islemler: [{ yol: "secenek.D", eski: "The club would also save money, a real benefit", yeni: "The club would also save the school money, a real benefit" },
      { yol: "hata.C.etiket", deger: "Yanlış Nedensellik: Bütçe kesintisini tasarrufun nedeni yapmak." },
      { yol: "aciklama", eski: "C nedenselliği tersine çevirir.", yeni: "C yanlış bir nedensellik kurar." }] }
};
// Zorluk önerisi verisi bozuk olanlar (ör. değer bir metin parçası) → atla
const ZORLUK_ATLA = { phys_u7_q13: "Denetimdeki zorluk önerisi bozuk (\" maksimumsa \"); geçerli bir düzey değil." };

// ---------------------------------------------------------------------------------------------------------------
const kopya = o => JSON.parse(JSON.stringify(o));
const dolarTek = s => ((String(s || "").replace(/\\\$/g, "").match(/\$/g) || []).length % 2) === 1;

function oku(r, yol) {
  const p = yol.split(".");
  if (p[0] === "secenek") { const o = r.secenekler.find(x => x.id === p[1]); return o ? o.text : undefined; }
  if (p[0] === "hata") { const h = (r.hata_aciklamalari || {})[p[1]]; return h ? h[p[2]] : undefined; }
  return r[yol];
}
function yaz(r, yol, v) {
  const p = yol.split(".");
  if (p[0] === "secenek") { r.secenekler.find(x => x.id === p[1]).text = v; return; }
  if (p[0] === "hata") { r.hata_aciklamalari = r.hata_aciklamalari || {}; r.hata_aciklamalari[p[1]] = r.hata_aciklamalari[p[1]] || { etiket: "", aciklama: "" }; r.hata_aciklamalari[p[1]][p[2]] = v; return; }
  r[yol] = v;
}
/** Bir işlemi uygular. Dönüş: "yeni" | "zaten" | hata metni */
function islemUygula(r, is) {
  const simdi = oku(r, is.yol);
  if (simdi === undefined) return "alan yok: " + is.yol;
  if ("deger" in is) { if (simdi === is.deger) return "zaten"; yaz(r, is.yol, is.deger); return "yeni"; }
  if ("onek" in is) { if (simdi.startsWith(is.onek)) return "zaten"; yaz(r, is.yol, is.onek + simdi); return "yeni"; }
  if (simdi.includes(is.yeni)) return "zaten";
  if (!simdi.includes(is.eski)) return "eski metin bulunamadı (" + is.yol + ")";
  yaz(r, is.yol, simdi.split(is.eski).join(is.yeni));
  return "yeni";
}

function main() {
  const tohum = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
  const once = kopya(tohum.sorular);
  const byId = new Map(tohum.sorular.map(r => [r.id, r]));
  const rapor = { dersler: [], arsiv: [], insan: [], cedYalniz: [], zorlukBekleyen: [], hesapUyumsuz: [], ekKapsam: 0, uyari: [] };
  let yeniDegisiklik = 0;
  const gorulen = new Set();

  for (const D of DOSYALAR) {
    const den = JSON.parse(fs.readFileSync(path.join(DENETIM_DIR, D.dosya), "utf8"));
    const d = { ad: D.ad, dosya: D.dosya, soru: den.sorular.length, durum: {}, ek: 0, uygulanan: [], atlanan: [], zorluk: [], konu: [], arsiv: [] };
    rapor.dersler.push(d);
    for (const a of den.sorular) {
      d.durum[a.durum] = (d.durum[a.durum] || 0) + 1;
      const r = byId.get(a.id);
      if (!r) { rapor.uyari.push(a.id + ": denetimde var, tohumda yok"); continue; }
      gorulen.add(a.id);
      if (a.durum === "hatali-anahtar") rapor.insan.push({ id: a.id, neden: "Denetim hatalı anahtar dedi (beklenmiyordu); anahtar araçla değiştirilmez, öğretmen onayı gerekir." });
      if (a.durum === "supheli") rapor.insan.push({ id: a.id, neden: "Denetim şüpheli dedi: " + (a.sorunlar || []).join(" ") });
      const oneri = a.oneri || {};
      const karar = KARARLAR[a.id];

      // 1) zorluk (yalnız gerekçe varsa)
      const zo = oneri.zorluk !== undefined ? oneri.zorluk : (a.ek || {}).zorlukOnerisi;
      let zorlukUygulandi = false;
      if (zo !== undefined && zo !== r.zorluk) {
        const gerekce = (a.sorunlar || []).find(s => /zorluk|'hard'|"hard"|'medium'|"medium"|'easy'|"easy"|\bhard\b|\bmedium\b/i.test(s));
        if (ZORLUK_ATLA[a.id]) d.atlanan.push({ id: a.id, alan: "zorluk", neden: ZORLUK_ATLA[a.id] });
        else if (!ZORLUKLAR.includes(zo)) d.atlanan.push({ id: a.id, alan: "zorluk", neden: "geçersiz zorluk önerisi: " + JSON.stringify(zo) });
        else if (!gerekce) rapor.zorlukBekleyen.push({ id: a.id, ders: D.ad, eski: r.zorluk, yeni: zo });
        else {
          // seviye testinde ünite zorluk çeşitliliği (en az 2 düzey) korunmalı
          let cesitlilikTamam = true;
          if (r.tur === "seviye") {
            const kardes = tohum.sorular.filter(x => x.tur === "seviye" && x.ders === r.ders && x.unite === r.unite && x.durum !== "arsiv");
            cesitlilikTamam = new Set(kardes.map(x => x.id === r.id ? zo : x.zorluk)).size >= 2;
          }
          if (!cesitlilikTamam) d.atlanan.push({ id: a.id, alan: "zorluk", neden: `seviye ünitesi ${r.ders}/${r.unite} zorluk çeşitliliğini kaybederdi (${r.zorluk} → ${zo})` });
          else { d.zorluk.push({ id: a.id, eski: r.zorluk, yeni: zo, gerekce }); r.zorluk = zo; zorlukUygulandi = true; yeniDegisiklik++; }
        }
      } else if (zo !== undefined && zo === r.zorluk) { // önceki çalıştırmada uygulanmış
        zorlukUygulandi = true;
        const gerekce = (a.sorunlar || []).find(s => /zorluk|\bhard\b|\bmedium\b|\beasy\b/i.test(s));
        d.zorluk.push({ id: a.id, eski: "(önceden)", yeni: zo, gerekce: gerekce || "" });
      }

      // 2) ek zenginleştirmesi (mevcut anahtarlar korunur)
      const ae = a.ek || {}, ek = Object.assign({}, r.ek || {});
      const ekOnce = JSON.stringify(ek);
      for (const k of EK_ANAHTAR) if (ae[k] != null && ae[k] !== "" && !(k in ek)) ek[k] = ae[k];
      if (ae.hesapMakinesi != null) {
        if (!("hesapMakinesi" in ek)) ek.hesapMakinesi = ae.hesapMakinesi;
        else if (typeof ek.hesapMakinesi === "boolean") {
          if (!("hesapMakinesiDurum" in ek)) ek.hesapMakinesiDurum = ae.hesapMakinesi;
          if (ek.hesapMakinesi !== (ek.hesapMakinesiDurum !== "gerekmez")) rapor.hesapUyumsuz.push({ id: a.id, mevcut: ek.hesapMakinesi, denetim: ek.hesapMakinesiDurum });
        }
      }
      if (ae.zorlukOnerisi !== undefined && !zorlukUygulandi && !("zorlukOnerisi" in ek) && ZORLUKLAR.includes(ae.zorlukOnerisi)) ek.zorlukOnerisi = ae.zorlukOnerisi;
      if (zorlukUygulandi && "zorlukOnerisi" in ek) delete ek.zorlukOnerisi;
      if (JSON.stringify(ek) !== ekOnce) { r.ek = ek; yeniDegisiklik++; }
      if (EK_ANAHTAR.every(k => ek[k]) && (ek.hesapMakinesi != null)) d.ek++;

      // 3) konu
      if (oneri.konu !== undefined && !(karar && (karar.islemler || []).some(i => i.yol === "konu"))) {
        if (D.konuKurali === "yalnizCed") rapor.cedYalniz.push({ id: a.id, konu: r.konu, ced: ek.cedKonu });
        else if (D.konuKurali === "oneri" && typeof oneri.konu === "string" && /^\d+\.\d+ /.test(oneri.konu)) {
          if (r.konu !== oneri.konu) { d.konu.push({ id: a.id, eski: r.konu, yeni: oneri.konu }); r.konu = oneri.konu; yeniDegisiklik++; }
          else d.konu.push({ id: a.id, eski: "(önceden)", yeni: r.konu });
        } else if (!karar) d.atlanan.push({ id: a.id, alan: "konu", neden: "konu önerisi uygulanabilir bir etiket değil: " + JSON.stringify(oneri.konu) });
      }

      // 4) elle verilen kararlar
      if (karar) {
        if (karar.atla) { d.atlanan.push({ id: a.id, alan: Object.keys(oneri).join(", ") || "-", neden: karar.atla.neden }); if (karar.atla.insan) rapor.insan.push({ id: a.id, neden: karar.atla.neden }); }
        if (karar.arsiv) {
          const asil = byId.get(karar.arsiv.asil);
          if (!asil || asil.durum === "arsiv") throw new Error(a.id + ": asıl soru yok ya da arşivde: " + karar.arsiv.asil);
          if (r.tur !== "ders") throw new Error(a.id + ": yalnız ders sorusu arşivlenir");
          if (r.durum !== "arsiv") { r.durum = "arsiv"; yeniDegisiklik++; }
          const k = { id: a.id, asil: karar.arsiv.asil, neden: karar.neden };
          d.arsiv.push(k); rapor.arsiv.push(Object.assign({ ders: D.ad }, k));
        }
        if (karar.islemler) {
          const sonuc = karar.islemler.map(is => ({ is, s: islemUygula(r, is) }));
          const hatali = sonuc.filter(x => x.s !== "yeni" && x.s !== "zaten");
          if (hatali.length) d.atlanan.push({ id: a.id, alan: hatali.map(x => x.is.yol).join(", "), neden: "uygulanamadı: " + hatali.map(x => x.s).join("; ") });
          const yeni = sonuc.filter(x => x.s === "yeni").length;
          yeniDegisiklik += yeni;
          if (sonuc.some(x => x.s === "yeni" || x.s === "zaten")) d.uygulanan.push({ id: a.id, alanlar: sonuc.filter(x => x.s === "yeni" || x.s === "zaten").map(x => x.is.yol), neden: karar.neden });
          for (const x of sonuc) if (x.is.yol === "konu" && (x.s === "yeni" || x.s === "zaten")) d.konu.push({ id: a.id, eski: x.s === "zaten" ? "(önceden)" : (x.is.eski || "-"), yeni: r.konu });
        }
        if (karar.insanNotu) rapor.insan.push({ id: a.id, neden: karar.insanNotu });
      } else if (a.durum === "duzeltme-onerisi") {
        const kalan = Object.keys(oneri).filter(k => !["zorluk", "konu"].includes(k));
        if (kalan.length) { d.atlanan.push({ id: a.id, alan: kalan.join(", "), neden: "karar tablosunda yok (incelenmedi)" }); rapor.uyari.push(a.id + ": düzeltme önerisi için karar yok"); }
      }
    }
  }
  for (const id of Object.keys(KARARLAR)) if (!gorulen.has(id)) rapor.uyari.push(id + ": karar tablosunda var, denetimde yok");

  // ---- doğrulamalar: anahtar değişmedi, şıklar benzersiz, $ dengeli, seviye üniteleri ≥3 aktif + zorluk çeşitliliği
  const onceById = new Map(once.map(r => [r.id, r]));
  const hatalar = [];
  for (const r of tohum.sorular) {
    const o = onceById.get(r.id);
    if (o.dogru !== r.dogru) hatalar.push(r.id + ": dogru değişti (yasak)");
    if (new Set(r.secenekler.map(x => x.text.replace(/\s+/g, " "))).size !== r.secenekler.length) hatalar.push(r.id + ": aynı metinli iki şık");
    for (const k of ["govde", "aciklama", "genel_hatirlatma"]) if (dolarTek(r[k])) hatalar.push(r.id + ": " + k + " tek sayıda $");
    for (const [h, v] of Object.entries(r.hata_aciklamalari || {})) if (dolarTek(v.etiket) || dolarTek(v.aciklama)) hatalar.push(r.id + ": hata." + h + " tek sayıda $");
  }
  const sv = {};
  tohum.sorular.filter(r => r.tur === "seviye" && r.durum !== "arsiv").forEach(r => { (sv[r.ders + "|" + r.unite] = sv[r.ders + "|" + r.unite] || []).push(r.zorluk); });
  for (const [k, z] of Object.entries(sv)) { if (z.length < 3) hatalar.push("seviye " + k + ": " + z.length + " aktif soru (en az 3)"); if (new Set(z).size < 2) hatalar.push("seviye " + k + ": zorluk çeşitliliği yok"); }
  if (hatalar.length) { console.error("✗ Doğrulama başarısız:\n  " + hatalar.join("\n  ")); process.exit(1); }

  const degisti = JSON.stringify(once) !== JSON.stringify(tohum.sorular);
  rapor.ekKapsam = tohum.sorular.filter(r => EK_ANAHTAR.every(k => (r.ek || {})[k])).length;
  const eskiSurum = Number(tohum.surum) || 1;
  if (degisti) { tohum.surum = eskiSurum + 1; tohum.icerikGuncelleme = new Date().toISOString(); }

  // ---- konsol özeti
  console.log(`İçerik denetimi uygulaması${KURU ? " (KURU — dosyalara yazılmaz)" : ""}`);
  for (const d of rapor.dersler) console.log(`  ${d.ad.padEnd(34)} soru ${String(d.soru).padStart(3)} · ek ${d.ek} · düzeltme ${d.uygulanan.length} · konu ${d.konu.length} · zorluk ${d.zorluk.length} · arşiv ${d.arsiv.length} · atlanan ${d.atlanan.length}`);
  console.log(`  Yeni değişiklik: ${yeniDegisiklik} · ek kapsamı ${rapor.ekKapsam}/${tohum.sorular.length} · tohum sürümü ${eskiSurum}${degisti ? " → " + tohum.surum : " (değişmedi)"}`);
  console.log(`  İnsan incelemesi: ${rapor.insan.length} madde · gerekçesiz zorluk önerisi (uygulanmadı): ${rapor.zorlukBekleyen.length}`);
  for (const u of rapor.uyari) console.log("  ! " + u);
  if (KURU) return;

  if (degisti) fs.writeFileSync(TOHUM, JSON.stringify(tohum, null, 1) + "\n", "utf8");
  fs.writeFileSync(RAPOR, raporMd(rapor, tohum), "utf8");
  console.log(`✓ ${degisti ? "Tohum yazıldı: " + path.relative(ROOT, TOHUM) + " · " : ""}Günlük: ${path.relative(ROOT, RAPOR)}`);
}

function raporMd(R0, tohum) {
  const s = [];
  const t = (r, sutun) => "| " + sutun.map(k => String(r[k] == null ? "" : r[k]).replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ") + " |";
  s.push("# İçerik denetimi — uygulama günlüğü (1.10.0)", "");
  s.push(`_Üretici: \`node araclar/icerik-uygula.js\` (idempotent; \`--kuru\` ile önizleme). Tohum: \`server/tohum/soru-bankasi.json\`, tohum sürümü **${tohum.surum}**. Bu dosya her uygulamada yeniden yazılır._`, "");
  s.push("## Özet", "");
  s.push("| Ders | Soru | Denetim durumu | ek | Metin/şık düzeltmesi | Konu | Zorluk | Arşiv | Atlanan |", "|---|---|---|---|---|---|---|---|---|");
  for (const d of R0.dersler) s.push(`| ${d.ad} | ${d.soru} | ${Object.entries(d.durum).map(([k, v]) => k + " " + v).join(", ")} | ${d.ek} | ${d.uygulanan.length} | ${d.konu.length} | ${d.zorluk.length} | ${d.arsiv.length} | ${d.atlanan.length} |`);
  s.push("", `- Denetimlerde **hatalı anahtar: 0**. Hiçbir sorunun \`dogru\` alanı değiştirilmedi (araç bunu doğrular).`);
  s.push(`- \`ek\` zenginleştirmesi (kavram, ipucu, sikHata, cedKonu, hesap makinesi düzeyi): **${R0.ekKapsam} / ${tohum.sorular.length}** soru (denetlenmeyen tek soru: vitrin demo sorusu).`);
  s.push("- Mevcut `ek` anahtarları korundu. Seviye sorularında `ek.hesapMakinesi` (boolean, seviye testi arayüzü kullanır) değişmedi; denetimin üç düzeyli değeri (`gerekmez | yardımcı | gerekli`) `ek.hesapMakinesiDurum` alanına yazıldı. Ders sorularında `ek.hesapMakinesi` bu üç düzeyli metindir.");
  s.push("- Öğrenciye görünen iç not taraması (`Erdem`, `TODO`, `FIXME`, `internal`, `not:` vb. tüm metin alanlarında): yalnız `chem_u8_q9` içindeki \"(Erdem standardı)\" iç notu bulundu ve kaldırıldı; diğer eşleşmeler içerik (ör. \"internal energy\").", "");
  for (const d of R0.dersler) {
    s.push(`## ${d.ad} (\`${d.dosya}\`)`, "");
    if (d.uygulanan.length) { s.push("### Uygulanan düzeltmeler", "", "| Soru | Alanlar | Gerekçe |", "|---|---|---|"); d.uygulanan.forEach(x => s.push(t({ id: "`" + x.id + "`", a: x.alanlar.join(", "), n: x.neden }, ["id", "a", "n"]))); s.push(""); }
    if (d.konu.length) { s.push("### Konu etiketi (CED numarası)", "", "| Soru | Önce | Sonra |", "|---|---|---|"); d.konu.forEach(x => s.push(t({ id: "`" + x.id + "`", e: x.eski, y: x.yeni }, ["id", "e", "y"]))); s.push(""); }
    if (d.zorluk.length) { s.push("### Zorluk (denetim gerekçe yazdığı için)", "", "| Soru | Önce → sonra | Gerekçe |", "|---|---|---|"); d.zorluk.forEach(x => s.push(t({ id: "`" + x.id + "`", z: x.eski + " → " + x.yeni, g: x.gerekce }, ["id", "z", "g"]))); s.push(""); }
    if (d.arsiv.length) { s.push("### Arşivlenen tekrarlar", ""); d.arsiv.forEach(x => s.push(`- \`${x.id}\` → arşiv (asıl: \`${x.asil}\`). ${x.neden}`)); s.push(""); }
    if (d.atlanan.length) { s.push("### Uygulanmayanlar", "", "| Soru | Alan | Neden |", "|---|---|---|"); d.atlanan.forEach(x => s.push(t({ id: "`" + x.id + "`", a: x.alan, n: x.neden }, ["id", "a", "n"]))); s.push(""); }
  }
  s.push("## Arşivlenen birebir tekrarlar", "");
  s.push("Satırlar silinmedi (`durum = \"arsiv\"`): eski cevaplar, Yanlışlarım, deneme incelemeleri ve geçmiş kayıtlar bu kimliklerle çözülmeye devam eder. Ders listeleri, ünite görünümü, deneme havuzu ve seviye testi arşivli soruları göstermez; yeni cevap kabul edilmez.", "");
  R0.arsiv.forEach(x => s.push(`- \`${x.id}\` (${x.ders}) — asıl: \`${x.asil}\``));
  s.push("", "Seviye testindeki tekrarlar arşivlenmedi: her seviye ünitesi tam 3 soru ve pm-denetim alt sınırı 3; arşivlemek üniteyi 2 soruya düşürürdü. Bunlar aşağıda insan incelemesinde (yeni soru yazılmalı).", "");
  s.push("## Kimya konu etiketleri (yalnız ek.cedKonu)", "");
  s.push(`Denetimin güncel CED numarası güveni "orta-yüksek" olduğundan \`konu\` alanı değiştirilmedi; güncel numara \`ek.cedKonu\` alanında. CED PDF'iyle teyit edildikten sonra konu etiketleri panelden ya da bu araca karar eklenerek güncellenebilir (${R0.cedYalniz.length} soru):`, "");
  s.push("| Soru | Mevcut konu | ek.cedKonu |", "|---|---|---|");
  R0.cedYalniz.forEach(x => s.push(t({ id: "`" + x.id + "`", k: x.konu, c: x.ced }, ["id", "k", "c"])));
  s.push("", "## Uygulanmayan zorluk önerileri (gerekçe yok)", "");
  const zb = {};
  R0.zorlukBekleyen.forEach(x => { (zb[x.ders] = zb[x.ders] || []).push(`\`${x.id}\` ${x.eski}→${x.yeni}`); });
  s.push(`Denetim bu ${R0.zorlukBekleyen.length} soru için zorluk önerdi ama soru bazında gerekçe yazmadı; uygulanmadı. Öneri \`ek.zorlukOnerisi\` alanında saklanır (öğrenciye gönderilmez).`, "");
  Object.entries(zb).forEach(([k, v]) => s.push(`- **${k} (${v.length}):** ${v.join(", ")}`));
  if (R0.hesapUyumsuz.length) {
    s.push("", "## Seviye testi hesap makinesi uyuşmazlıkları", "", "Seviye sorusunun mevcut `hesapMakinesi` bayrağı denetimin düzeyiyle uyuşmuyor (bayrak değiştirilmedi):", "");
    R0.hesapUyumsuz.forEach(x => s.push(`- \`${x.id}\`: bayrak ${x.mevcut}, denetim "${x.denetim}"`));
  }
  s.push("", "## İnsan (sahip / öğretmen) incelemesi gerekenler", "");
  R0.insan.forEach(x => s.push(`- \`${x.id}\`: ${x.neden}`));
  s.push("- Kapsam boşlukları (yeni soru yazımı): Biology Unit 8 ders seti yok; Physics 1 Unit 8 Fluids ders seti yok; Chemistry Unit 3 sınav ağırlığına göre az; Macro Unit 3 4 soru; Calculus 1.11 ve 2.6 konularında soru yok. Ayrıntı: denetim .md dosyaları.");
  s.push("- `calc_u5_q3` için f′ grafiği SVG olarak eklenebilir (kök şimdilik sözel betime çevrildi).");
  s.push("- `calc_u7_q1`: B (`k(t - 20)`) ve C (`k(T - 20)`) şıkları yalnız t/T harfiyle ayrılıyor (bilinçli çeldirici). Yönetici formu şıkları büyük/küçük harf duyarsız karşılaştırdığı için bu soru panelde \"Aynı metinli iki şık\" hatasıyla kaydedilemez; panelden düzenlenecekse önce bu kural gözden geçirilmeli.");
  if (R0.uyari.length) { s.push("", "## Uyarılar", ""); R0.uyari.forEach(u => s.push("- " + u)); }
  s.push("", "## Veritabanına yansıma", "");
  s.push("Sunucu açılışta tohumun `surum` değerini `ayarlar.soru_tohum_surum` ile karşılaştırır. Tohum daha yeniyse yönetici panelinde düzenlenmemiş soruları günceller (yeni sürüm + `questions_bank_history` kaydı, `guncelleyen = 'tohum'`); yönetici düzenlemesi olan sorulara dokunmaz ve bunları `system_logs` içine **bilgi** olarak yazar. Ayrıntı: `server/API.md` › Soru bankası tohum güncellemesi.", "");
  return s.join("\n");
}

if (require.main === module) main();
module.exports = { KARARLAR, islemUygula };
