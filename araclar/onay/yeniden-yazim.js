"use strict";
// 1.11.0 içerik kararları (araclar/icerik-denetim/KARARLAR.md › "Yeniden yazılacaklar"): yeniden yazılan soruların tam içeriği.
// araclar/onay-uygula.js bu dosyayı okur ve tohuma (server/tohum/soru-bankasi.json) uygular. Kimlikler aynı kalır (geçmiş korunur);
// doğru şık harfi hiçbir soruda değişmez. Her soru bağımsız olarak yeniden çözüldü; sayısal sağlama araclar/onay-uygula.js --dogrula'da.
// Alanlar: govde, secenekler, dogru, aciklama, genel_hatirlatma, hata_aciklamalari (her yanlış şık), konu, zorluk?, ek (birleştirilir).
const R = String.raw;
const sec = (a, b, c, d) => [{ id: "A", text: a }, { id: "B", text: b }, { id: "C", text: c }, { id: "D", text: d }];
const h = (etiket, aciklama) => ({ etiket, aciklama });

module.exports = {
  // ---------------------------------------------------------------- Calculus ----------------------------------------------------------------
  sv_calcab_u3_2: {
    neden: "calc_u3_q2 ile birebir aynıydı (x² + xy + y² = 7, (1, 2)).",
    konu: "Implicit differentiation",
    govde: R`The curve $x^2 - xy + y^2 = 7$ passes through the point $(-1, 2)$. What is $\frac{dy}{dx}$ at $(-1, 2)$?`,
    secenekler: sec(R`$-\frac{4}{5}$`, R`$\frac{2}{5}$`, R`$1$`, R`$\frac{4}{5}$`),
    dogru: "D",
    aciklama: R`1. Her terimi $x$'e göre türevle; $-xy$ için product rule: $2x - \left(y + x\frac{dy}{dx}\right) + 2y\frac{dy}{dx} = 0$.<br/>2. $\frac{dy}{dx}$ terimlerini topla: $\frac{dy}{dx}(2y - x) = y - 2x$.<br/>3. $(-1, 2)$'yi koy: $\frac{dy}{dx}(4 + 1) = 2 + 2$ ⟹ $5\frac{dy}{dx} = 4$.<br/>4. $\frac{dy}{dx} = \frac{4}{5}$. Doğru cevap: D.`,
    genel_hatirlatma: R`<strong>Implicit differentiation</strong>: Her $y$ teriminin türevine $\frac{dy}{dx}$ çarpanı eklenir; $xy$ gibi karma terimlerde product rule zorunludur ve önündeki eksi işareti iki parçaya da dağılır. Noktayı türevli denkleme hemen koymak cebiri kısaltır.`,
    hata_aciklamalari: {
      A: h(R`İşaret Hatası: $\frac{dy}{dx}$'i yalnız bırakırken eksiyi yanlış taşımak.`, R`$5\frac{dy}{dx} = 4$ elde edilir; terimi karşıya atarken işaret iki kez değişir ve sonuç pozitif kalır: $\frac{4}{5}$. $-\frac{4}{5}$, $4$'ü yanlış tarafa eksiyle geçirmekten çıkar.`),
      B: h(R`Product Rule Eksikliği: $-xy$'nin türevini yalnızca $-x\frac{dy}{dx}$ almak ($-y$ terimini unutmak).`, R`Bu hatayla $2x - x\frac{dy}{dx} + 2y\frac{dy}{dx} = 0$ ⟹ $\frac{dy}{dx} = \frac{-2x}{2y - x} = \frac{2}{5}$ çıkar. Doğrusu $\frac{d}{dx}(xy) = y + x\frac{dy}{dx}$.`),
      C: h(R`Product Rule Eksikliği: $-xy$'nin türevini yalnızca $-y$ almak ($x\frac{dy}{dx}$ terimini unutmak).`, R`Bu hatayla $2x - y + 2y\frac{dy}{dx} = 0$ ⟹ $\frac{dy}{dx} = \frac{y - 2x}{2y} = \frac{4}{4} = 1$ çıkar. $x$ ile $y$'nin çarpımında iki terim de türev alır.`)
    },
    ek: { kavram: "Kapalı türev (product rule ile)", ipucu: "dy/dx = (y − 2x)/(2y − x); noktayı hemen koy.", sikHata: "−xy türevinde bir terimi atlamak", cedKonu: "3.2", hesapMakinesiDurum: "gerekmez" }
  },

  sv_calcab_u4_3: {
    neden: "calc_u4_q5 ile aynı limitti ((e^{2x} − 1 − 2x)/x²).",
    konu: "L'Hôpital's Rule applied twice",
    govde: R`Evaluate $\displaystyle\lim_{x \to 0} \frac{e^{3x} - 1 - 3x}{x^2}$.`,
    secenekler: sec(R`$9$`, R`$0$`, R`$\frac{3}{2}$`, R`$\frac{9}{2}$`),
    dogru: "D",
    aciklama: R`1. $x = 0$'da pay $1 - 1 - 0 = 0$, payda $0$: form $\frac{0}{0}$. L'Hôpital: $\frac{3e^{3x} - 3}{2x}$.<br/>2. $x = 0$'da yine $\frac{3 - 3}{0} = \frac{0}{0}$; tekrar uygula: $\frac{9e^{3x}}{2}$.<br/>3. $x \to 0$: $\frac{9 \cdot 1}{2} = \frac{9}{2}$. Doğru cevap: D.<br/>4. Sağlama: $e^{3x} \approx 1 + 3x + \frac{9x^2}{2}$ ⟹ oran $\to \frac{9}{2}$.`,
    genel_hatirlatma: R`<strong>L'Hôpital's Rule</strong> yalnızca $\frac{0}{0}$ veya $\frac{\infty}{\infty}$ için geçerlidir. Her uygulamadan önce formu yeniden kontrol et; $e^{kx}$'in her türevinde iç türev $k$ çarpanı gelir.`,
    hata_aciklamalari: {
      A: h(R`Payda Türevi Hatası: İkinci uygulamada $2x$'in türevini $1$ almak.`, R`$\frac{9e^{3x}}{1} \to 9$ çıkar; oysa $\frac{d}{dx}(2x) = 2$, sonuç $\frac{9}{2}$.`),
      B: h(R`Erken Durma: İlk L'Hôpital'den sonra $\frac{0}{0}$'ı $0$ kabul etmek.`, R`$\frac{3e^{3x} - 3}{2x}$, $x = 0$'da hâlâ $\frac{0}{0}$ belirsizliğidir; kural yeniden uygulanmalıdır.`),
      C: h(R`Chain Rule Eksikliği: İkinci türevde $e^{3x}$'in iç türevini unutmak.`, R`$\frac{d}{dx}(3e^{3x}) = 3e^{3x}$ alınırsa $\frac{3e^{3x}}{2} \to \frac{3}{2}$ çıkar; doğrusu $9e^{3x}$.`)
    },
    ek: { kavram: "L'Hôpital iki kez", ipucu: "e^{3x} ≈ 1 + 3x + 9x²/2 ⇒ limit 9/2.", sikHata: "İlk adımda durmak", cedKonu: "4.7", hesapMakinesiDurum: "gerekmez" }
  },

  sv_calcbc_u3_2: {
    neden: "calc_u3_q3 ile birebir aynıydı (x² + y² = 25, (3, 4)).",
    konu: "Second derivative by implicit differentiation",
    govde: R`For the curve $x^2 + y^2 = 169$, what is the value of $\frac{d^2y}{dx^2}$ at the point $(5, 12)$?`,
    secenekler: sec(R`$-\frac{5}{12}$`, R`$-\frac{1}{12}$`, R`$-\frac{119}{1728}$`, R`$-\frac{169}{1728}$`),
    dogru: "D",
    aciklama: R`1. $2x + 2yy' = 0 \Rightarrow y' = -\frac{x}{y}$; $(5, 12)$'de $y' = -\frac{5}{12}$.<br/>2. Quotient rule: $y'' = -\frac{y - xy'}{y^2} = \frac{-y + xy'}{y^2}$.<br/>3. Yerine koy: $\frac{-12 + 5\left(-\frac{5}{12}\right)}{144} = \frac{-\frac{169}{12}}{144}$.<br/>4. $y'' = -\frac{169}{1728}$. Doğru cevap: D. (Kısayol: çemberde $y'' = -\frac{r^2}{y^3} = -\frac{169}{1728}$.)`,
    genel_hatirlatma: R`<strong>Implicit second derivative</strong>: $\frac{dy}{dx}$'i bul, onu quotient rule ile tekrar türevle ($y$, $x$'in fonksiyonudur), çıkan $y'$ yerine $\frac{dy}{dx}$ ifadesini koy.`,
    hata_aciklamalari: {
      A: h("Mertebe Hatası: Birinci türevde durmak.", R`$-\frac{5}{12}$, $\frac{dy}{dx}$ değeridir. İkinci türev için $-\frac{x}{y}$ tekrar türevlenmelidir.`),
      B: h(R`$y$'yi Sabit Saymak: $-\frac{x}{y}$'yi türevlerken $y$'yi sabit tutmak.`, R`$y$ sabit sayılırsa $y'' = -\frac{1}{y} = -\frac{1}{12}$ çıkar. $y$, $x$'e bağlıdır; quotient rule'da $xy'$ terimi gelir.`),
      C: h(R`İşaret Hatası: Quotient rule payında $-y - xy'$ yazmak.`, R`Bu hatayla $\frac{-12 - 5\left(-\frac{5}{12}\right)}{144} = \frac{-\frac{119}{12}}{144} = -\frac{119}{1728}$ çıkar. Doğru pay $-y + xy'$.`)
    },
    ek: { kavram: "Kapalı türevle ikinci türev", ipucu: "Çemberde y'' = −r²/y³ kısayolu.", sikHata: "Birinci türevde durmak", cedKonu: "3.6", hesapMakinesiDurum: "gerekmez" }
  },

  sv_calcbc_u6_3: {
    neden: "calc_u6_q34 ile birebir aynı integraldi (∫₂³ dx/(x² − 1)). Not: denetimin önerdiği cevap (½ ln(9/5)) hatalıydı; doğru değer ½ ln(5/3) (sayısal integralle doğrulandı).",
    konu: "[BC] Partial fraction decomposition",
    govde: R`<strong>[BC ONLY]</strong> Evaluate $\displaystyle\int_3^4 \frac{2}{x^2 - 4}\,dx$.`,
    secenekler: sec(R`$\ln\frac{5}{3}$`, R`$\frac{1}{2}\ln\frac{5}{3}$`, R`$\frac{1}{2}\ln\frac{3}{5}$`, R`$\ln\frac{12}{5}$`),
    dogru: "B",
    aciklama: R`1. $\frac{2}{(x - 2)(x + 2)} = \frac{A}{x - 2} + \frac{B}{x + 2}$: $x = 2$ ⟹ $A = \frac{2}{4} = \frac{1}{2}$; $x = -2$ ⟹ $B = -\frac{1}{2}$.<br/>2. Antitürev: $\frac{1}{2}\ln\left|\frac{x - 2}{x + 2}\right|$.<br/>3. $F(4) - F(3) = \frac{1}{2}\left[\ln\frac{2}{6} - \ln\frac{1}{5}\right] = \frac{1}{2}\ln\frac{5}{3}$.<br/>4. Sağlama: integrand $[3, 4]$'te pozitif, sonuç $\approx 0.255 > 0$. Doğru cevap: B.`,
    genel_hatirlatma: R`<strong>Partial fractions</strong>: Doğrusal çarpanlı paydayı $\frac{A}{x - a} + \frac{B}{x - b}$ biçimine ayır (kök yerine koyma yöntemi hızlıdır); her terim bir $\ln$ verir. Pozitif integrandın belirli integrali pozitiftir: işaretle sağla.`,
    hata_aciklamalari: {
      A: h(R`Katsayı Unutuldu: Kısmi kesirlerdeki $\frac{1}{2}$ katsayısını atlamak.`, R`$\frac{2}{x^2 - 4} = \frac{1/2}{x - 2} - \frac{1/2}{x + 2}$; katsayılar $\pm 1$ alınırsa sonuç iki kat büyük çıkar: $\ln\frac{5}{3}$.`),
      C: h("Sınır Sırası Hatası: F(3) − F(4) hesaplamak.", R`$\frac{1}{2}\ln\frac{3}{5} < 0$ olur; oysa integrand pozitif. Belirli integral $F(\text{üst}) - F(\text{alt}) = F(4) - F(3)$.`),
      D: h(R`Yanlış Kalıp: $\int\frac{2}{x^2 - 4}dx = \ln|x^2 - 4|$ sanmak.`, R`Bu hatayla $\ln 12 - \ln 5 = \ln\frac{12}{5}$ çıkar. $\ln|g(x)|$ ancak pay $g'(x) = 2x$ iken doğrudur; burada pay sabit, partial fractions gerekir.`)
    },
    ek: { kavram: "Kısmi kesirlerle belirli integral", ipucu: "2/(x²−4) = ½[1/(x−2) − 1/(x+2)].", sikHata: "½ katsayısını atlamak", cedKonu: "6.12", hesapMakinesiDurum: "gerekmez" }
  },

  calc_u4_q14: {
    neden: "calc_u1_q11 ile aynı limitti ((1 − cos x)/x²); karar: (x − sin x)/x³ = 1/6 ile yeniden.",
    konu: "4.7 L'Hôpital's Rule Applied Three Times",
    zorluk: "medium",
    zorlukNedeni: "Yeni soru L'Hôpital'i üç kez gerektirir; eski soru için önerilen 'easy' yeni içeriğe uymaz.",
    govde: R`Evaluate $$\lim_{x \to 0} \frac{x - \sin x}{x^3}$$`,
    secenekler: sec(R`$0$`, R`$\frac{1}{2}$`, R`$\frac{1}{6}$`, R`$-\frac{1}{6}$`),
    dogru: "C",
    aciklama: R`1. $x \to 0$: $\frac{0}{0}$ ⟹ L'Hôpital: $\lim \frac{1 - \cos x}{3x^2}$.<br/>2. Yine $\frac{0}{0}$ ⟹ $\lim \frac{\sin x}{6x}$.<br/>3. Yine $\frac{0}{0}$ ⟹ $\lim \frac{\cos x}{6} = \frac{1}{6}$.<br/>4. Sağlama: $\sin x \approx x - \frac{x^3}{6}$ ⟹ $x - \sin x \approx \frac{x^3}{6}$. Doğru cevap: C.`,
    genel_hatirlatma: R`Topic 4.7: Her adımda belirsizliği yeniden kontrol et. $\frac{0}{0}$ sürüyorsa L'Hôpital tekrar uygulanır; paydanın türevindeki katsayıları ($x^3 \to 3x^2 \to 6x \to 6$) atlama.`,
    hata_aciklamalari: {
      A: h(R`Erken Durma: İlk L'Hôpital'den sonra $\frac{1 - \cos x}{3x^2}$'de $\frac{0}{0}$'ı $0$ sanmak.`, R`$\frac{1 - \cos x}{3x^2}$ hâlâ $\frac{0}{0}$ belirsizliğidir; iki kez daha uygula: $\frac{\sin x}{6x}$, sonra $\frac{\cos x}{6} \to \frac{1}{6}$.`),
      B: h(R`Katsayı Hatası: $\frac{d}{dx}(x^3)$'ü $x^2$ almak (3 çarpanını atlamak).`, R`Bu hatayla $\lim \frac{1 - \cos x}{x^2} = \frac{1}{2}$ çıkar. Doğrusu $\frac{d}{dx}(x^3) = 3x^2$; sonuç $\frac{1}{2} \cdot \frac{1}{3} = \frac{1}{6}$.`),
      D: h(R`İşaret Hatası: Üçüncü adımda $\frac{d}{dx}(\sin x) = -\cos x$ yazmak.`, R`$\frac{d}{dx}(\sin x) = +\cos x$; eksi işaret $\frac{d}{dx}(\cos x) = -\sin x$'e aittir. Doğru sonuç $+\frac{1}{6}$.`)
    },
    ek: { kavram: "L'Hôpital üç kez", ipucu: "sin x ≈ x − x³/6 ile anında kontrol: limit 1/6.", sikHata: "İlk adımda durmak", cedKonu: "4.7", hesapMakinesi: "gerekmez" }
  },

  // ---------------------------------------------------------------- Physics ----------------------------------------------------------------
  phys_u3_q3: {
    neden: "C çeldiricisi (11.8 m/s) tanımlı bir hatadan gelmiyordu; √(rg)·tanθ hatasına göre yeniden yazıldı (≈ 12.5 m/s).",
    konu: "2.9 Banked Curves: Design Speed with Zero Lateral Friction",
    govde: R`A civil engineer designs a highway curve of radius $r = 120\text{ m}$ banked at an angle of $\theta = 20^\circ$. What is the ideal design speed $v_{\text{design}}$ at which a car can navigate this turn safely even if the roadway is covered in frictionless black ice ($f_s = 0$)? (Take $g = 9.8\text{ m/s}^2$ and $\tan 20^\circ \approx 0.364$)`,
    secenekler: sec("v_design ≈ 20.7 m/s (≈ 74.5 km/h)", "v_design ≈ 34.3 m/s (≈ 123.5 km/h)", "v_design ≈ 12.5 m/s (≈ 44.9 km/h)", "It depends on the mass m of the car."),
    dogru: "A",
    aciklama: R`1. Serbest Cisim Diyagramı Kuvvet Bileşenleri:<br/>- Düşey denge ($a_y = 0$): $F_N \cos\theta = mg$<br/>- Yatay merkezcil ivme ($a_x = a_c$): $F_N \sin\theta = \frac{m v^2}{r}$<br/>2. İki denklemi taraf tarafa böl:<br/>$$\frac{F_N \sin\theta}{F_N \cos\theta} = \frac{m v^2 / r}{mg} \implies \tan\theta = \frac{v^2}{rg}$$<br/>3. Hızı yalnız bırak (tan θ karekökün İÇİNDE kalır):<br/>$$v = \sqrt{rg \tan\theta} = \sqrt{120\text{ m} \times 9.8\text{ m/s}^2 \times 0.364} = \sqrt{428.06} \approx 20.7\text{ m/s}$$<br/>4. Kütle sadeleşti; doğru seçenek A'dır.`,
    genel_hatirlatma: R`Sürtünmesiz eğimli virajda normal kuvvetin yatay bileşeni merkezcil kuvveti, düşey bileşeni ise yerçekimini dengeler:<br/>$$F_N \sin\theta = \frac{m v^2}{r}, \quad F_N \cos\theta = mg \implies \tan\theta = \frac{v^2}{r g} \implies v = \sqrt{r g \tan\theta}$$`,
    hata_aciklamalari: {
      B: h("tan θ Çarpanı Unutuldu: v = √(rg) hesaplamak (tan 20° hiç kullanılmamış).", R`$\sqrt{120 \times 9.8} = \sqrt{1176} \approx 34.3\text{ m/s}$ çıkar. Yatay $F_N\sin\theta = mv^2/r$ ve düşey $F_N\cos\theta = mg$ denklemleri oranlandığında $\tan\theta = v^2/rg$ elde edilir; $\tan\theta$ formülde kalmalıdır.`),
      C: h("Karekök Hatası: tan θ'yı karekökün dışına çıkarmak, v = √(rg)·tan θ yazmak.", R`$\sqrt{1176} \times 0.364 \approx 34.3 \times 0.364 \approx 12.5\text{ m/s}$ çıkar. Oysa $v^2 = rg\tan\theta$ olduğundan karekök çarpımın tamamına uygulanır: $v = \sqrt{rg\tan\theta} = \sqrt{428.06} \approx 20.7\text{ m/s}$.`),
      D: h("Kütle Yanılgısı: Eğimli viraj hızının araç kütlesine bağlı olduğunu sanmak.", "Tıpkı eğik düzlemde olduğu gibi kütle her iki denklemde de sadeleşir; kamyon ile motosiklet için tasarım hızı aynıdır.")
    },
    ek: { kavram: "Eğimli viraj: tanθ = v²/(rg)", ipucu: "Sürtünmesiz eğimde merkezcil kuvveti N'nin yatay bileşeni sağlar.", sikHata: "Tasarım hızının kütleye bağlı olduğunu sanmak.", cedKonu: "2.9", hesapMakinesi: "yardımcı" }
  },

  // ---------------------------------------------------------------- Chemistry ----------------------------------------------------------------
  chem_u1_q6: {
    neden: "D çeldiricisi (63.00 amu; Europium) hiçbir hesap yolundan çıkmıyordu; C (64.55) de ters ağırlıklandırmayla üretilemiyordu (doğrusu 64.31). İkisi tanımlı hatalara göre yeniden yazıldı.",
    konu: "1.2 Mass Spectrometry Calculation of Atomic Weight",
    govde: R`An unknown element $X$ has two stable isotopes: $^{63}X$ (atomic mass $62.93$ amu, abundance $69.17\%$) and $^{65}X$ (atomic mass $64.93$ amu, abundance $30.83\%$). What is the average atomic mass of element $X$, and what is its identity?`,
    secenekler: sec("63.55 amu; Copper (Cu)", "63.93 amu; Zinc (Zn)", "64.31 amu; Copper (Cu)", "64.93 amu; Zinc (Zn)"),
    dogru: "A",
    aciklama: R`1. Ağırlıklı ortalama denklemini kur:<br/>$$\bar{M} = (62.93 \times 0.6917) + (64.93 \times 0.3083)$$<br/>2. Çarpımları hesapla: $62.93 \times 0.6917 = 43.529$; $64.93 \times 0.3083 = 20.018$.<br/>3. Topla: $43.529 + 20.018 = 63.547 \approx 63.55$ amu.<br/>4. Sağlama: sonuç bol izotopa (62.93, %69) daha yakın olmalı — öyle.<br/>5. Periyodik tabloda ortalama atom kütlesi $63.55$ amu olan element <strong>Bakır (Cu, Z = 29)</strong>'dır. Doğru cevap: A.`,
    genel_hatirlatma: R`Ağırlıklı ortalama formülü: $\text{Ortalama Kütle} = (m_1 \times f_1) + (m_2 \times f_2)$. %69.17 bolluk $\implies 0.6917$, %30.83 bolluk $\implies 0.3083$. Sonuç her zaman en bol izotopun kütlesine daha yakındır.`,
    hata_aciklamalari: {
      B: h("Aritmetik Ortalama Hatası: İzotop kütlelerinin basit ortalamasını almak ((62.93 + 64.93)/2 = 63.93) ve sonucu yanlış elemente eşlemek.", R`Ortalama atom kütlesi bolluk yüzdeleriyle ağırlıklı ortalamadır: $(62.93 \times 0.6917) + (64.93 \times 0.3083) = 63.55$ amu. Ayrıca 63.93, Zn'nin (65.38) değil Cu'nun (63.55) kütlesine yakındır.`),
      C: h("Ters Ağırlıklandırma: Bolluk yüzdelerini izotoplarla yer değiştirerek çarpmak.", R`$(62.93 \times 0.3083) + (64.93 \times 0.6917) = 19.40 + 44.91 = 64.31$ amu çıkar. Hafif izotop (%69.17) baskın olduğundan ortalama 62.93'e daha yakın olmalıdır.`),
      D: h("Bolluğu Yok Saymak: Yalnızca ağır izotopun kütlesini ortalama sanmak.", R`64.93 amu yalnızca $^{65}X$'in kütlesidir ve en yakın element Zn (65.38) gibi görünür. Oysa örnekteki atomların %69'u hafif izotoptur; iki izotop bollukla ağırlıklandırılmalıdır: 63.55 amu (Cu).`)
    },
    ek: { kavram: "Ortalama atom kütlesi bolluk ağırlıklı ortalamadır", ipucu: "Σ(kütle × kesir); sonuç bol izotopa yakın olmalı.", sikHata: "Basit aritmetik ortalama almak.", cedKonu: "1.2 Mass Spectroscopy of Elements", hesapMakinesi: "yardımcı" }
  },

  chem_u2_q3: {
    neden: "Lewis yapıları ':Ö', 'N̈:' gibi belirsiz noktalarla yazılmıştı; ortaklanmamış çift (LP) sayıları açıkça verildi.",
    konu: "2.6 Resonance Structures & Formal Charge Optimization for Cyanate",
    govde: R`Three valid resonance structures can be drawn for the cyanate ion, [OCN]⁻ (16 valence electrons; C is the central atom and every atom has an octet). LP = lone pairs.<br/>• <strong>Structure I:</strong> O (3 LP) single-bonded to C; C triple-bonded to N (1 LP). &nbsp;[ O–C≡N ]⁻<br/>• <strong>Structure II:</strong> O (2 LP) double-bonded to C; C double-bonded to N (2 LP). &nbsp;[ O=C=N ]⁻<br/>• <strong>Structure III:</strong> O (1 LP) triple-bonded to C; C single-bonded to N (3 LP). &nbsp;[ O≡C–N ]⁻<br/>According to the principles of formal charge, which structure is the major (most stable) resonance contributor to the actual resonance hybrid?`,
    secenekler: sec(
      "Structure I, because the formal charges are minimized (FC of C = 0, N = 0) and the negative formal charge (-1) resides on oxygen, the most electronegative atom.",
      "Structure II, because having double bonds makes the electron distribution completely symmetric across the ion.",
      "Structure III, because triple bonds always impart the highest thermodynamic stability regardless of formal charge.",
      "All three structures contribute exactly equally because they are all valid Lewis octet structures."),
    dogru: "A",
    aciklama: R`1. Formal yük: $FC = V - N_{\text{LP elektron}} - \frac{1}{2}B_{\text{bağ elektron}}$ (her LP = 2 elektron).<br/>2. <strong>Structure I</strong> (O: 3 LP, tek bağ; N: 1 LP, üçlü bağ):<br/>• O: $6 - 6 - 1 = -1$ • C: $4 - 0 - 4 = 0$ • N: $5 - 2 - 3 = 0$<br/>3. <strong>Structure II</strong> (O: 2 LP, çift bağ; N: 2 LP, çift bağ):<br/>• O: $6 - 4 - 2 = 0$ • C: $0$ • N: $5 - 4 - 2 = -1$<br/>4. <strong>Structure III</strong> (O: 1 LP, üçlü bağ; N: 3 LP, tek bağ):<br/>• O: $6 - 2 - 3 = +1$ • C: $0$ • N: $5 - 6 - 1 = -2$<br/>5. Elektron sağlaması: her yapıda 4 bağ (8 e⁻) + 4 LP (8 e⁻) = 16 e⁻.<br/>6. I ve II'de yükler $-1, 0, 0$; ama O ($EN = 3.44$) N'den ($EN = 3.04$) daha elektronegatif olduğu için $-1$'in O'da olduğu <strong>Structure I</strong> ana katkıcıdır. Doğru cevap: A.`,
    genel_hatirlatma: R`Rezonans kararlılık kuralları: 1) Formal yükler sıfıra en yakın olmalıdır. 2) Zorunlu eksi formal yük <strong>en elektronegatif atom</strong> üzerinde yer almalıdır. Formal yük için önce her atomdaki ortaklanmamış çiftleri say (LP × 2 elektron), sonra bağ sayısını ekle.`,
    hata_aciklamalari: {
      B: h("Simetri Tuzağı: Çift bağ simetrisinin formal yük-elektronegatiflik kuralından üstün olduğunu sanmak.", "Structure II'de O (2 LP, çift bağ) FC = 0, N (2 LP, çift bağ) FC = −1'dir. Eksi yük daha az elektronegatif N'de kalır; O'da olan Structure I daha kararlıdır."),
      C: h("Formal Yük İhmali: Structure III'te oksijenin +1, azotun −2 formal yük aldığını fark etmemek.", "Structure III'te O (1 LP, üçlü bağ) FC = +1, N (3 LP, tek bağ) FC = −2'dir. En elektronegatif atoma pozitif yük ve bir atoma −2 yük vermek yapıyı en az kararlı katkıcı yapar."),
      D: h("Eşit Katkı Yanılgısı: Tüm rezonans yapılarının hibrite eşit katıldığını düşünmek.", "Formal yük dağılımları farklı olan rezonans yapıları hibrite eşit katkı yapmaz. Yükleri sıfıra en yakın ve eksi yükü en elektronegatif atomda olan yapı ana katkıcıdır.")
    },
    ek: { kavram: "Eksi formal yük en elektronegatif atomda olmalı", ipucu: "Her atomda LP say, FC'leri hesapla; −1 O'da olan yapı baskın.", sikHata: "Simetrik çift bağlı yapıyı otomatik baskın saymak.", cedKonu: "2.6 Resonance and Formal Charge", hesapMakinesi: "gerekmez" }
  },

  sv_chem_u1_2: {
    neden: "chem_u1_q2 ile aynı kavram ve veriydi (N/O iyonlaşma enerjisi); Be/B anomalisine çevrildi.",
    konu: "Periodic trends: ionization energy (Coulomb's law)",
    govde: "The first ionization energy of boron (801 kJ/mol) is lower than that of beryllium (900 kJ/mol), even though boron has a greater nuclear charge. Which of the following best explains this observation?",
    secenekler: sec(
      "The electron removed from B is paired in a 2p orbital, and electron–electron repulsion makes it easier to remove.",
      "Boron has a greater effective nuclear charge than beryllium.",
      "Boron has more core electrons shielding its valence electrons.",
      "The electron removed from B is in a 2p sublevel, which is higher in energy and partly shielded by the 2s electrons, so it is held less tightly."),
    dogru: "D",
    aciklama: "1) Be: 1s² 2s² — koparılan elektron 2s'dedir.<br/>2) B: 1s² 2s² 2p¹ — koparılan elektron 2p'dedir.<br/>3) 2p alt düzeyi 2s'den daha yüksek enerjilidir ve çekirdeğe ortalamada daha uzaktır; ayrıca 2s elektronları onu kısmen perdeler.<br/>4) Bu yüzden B'nin 2p elektronu çekirdeğe daha zayıf bağlıdır ve daha kolay koparılır (801 < 900 kJ/mol). Doğru şık D.",
    genel_hatirlatma: "Periyot boyunca IE genel olarak artar; iki istisna vardır: Be→B (yeni bir alt düzeye, 2p'ye geçiş) ve N→O (2p⁴'teki ilk eşleşmiş elektronun itmesi). Hangisinin söz konusu olduğunu elektron dizilimini yazarak belirle.",
    hata_aciklamalari: {
      A: h("Yanlış anomali: N/O açıklamasını Be/B'ye uygulamak", "B: 2p¹ — 2p'de tek elektron vardır, eşleşmiş elektron yoktur. Eşleşme itmesi N→O düşüşünü açıklar, Be→B düşüşünü değil."),
      B: h("Doğru bilgi, ters sonuç", "Daha büyük effective nuclear charge iyonlaşma enerjisini <strong>artırır</strong>; düşüşü açıklayamaz."),
      C: h("Perdeleme hatası", "Be ve B aynı periyottadır; ikisinin de core electron sayısı 2'dir (1s²). Core perdeleme farkı yoktur; fark koparılan elektronun alt düzeyindedir (2s ↔ 2p).")
    },
    ek: { kavram: "2p elektronu 2s'den daha kolay koparılır", ipucu: "B 2p¹: yeni alt düzey, daha yüksek enerji, 2s perdelemesi.", sikHata: "Eşleşme itmesini (N/O) Be/B'ye uygulamak.", cedKonu: "1.7 Periodic Trends", hesapMakinesiDurum: "gerekmez" }
  },

  sv_chem_u6_2: {
    neden: "chem_u6_q16 ile birebir aynıydı (H₂ + Cl₂ → 2 HCl); NH₃ sentezine çevrildi.",
    konu: "Bond enthalpies",
    govde: "Use the average bond enthalpies N≡N = 945 kJ/mol, H–H = 436 kJ/mol, and N–H = 391 kJ/mol to estimate ΔH for N<sub>2</sub>(g) + 3 H<sub>2</sub>(g) → 2 NH<sub>3</sub>(g).",
    secenekler: sec("−93 kJ/mol<sub>rxn</sub>", "+93 kJ/mol<sub>rxn</sub>", "+1080 kJ/mol<sub>rxn</sub>", "−4599 kJ/mol<sub>rxn</sub>"),
    dogru: "A",
    aciklama: "1) Kırılan bağlar: 1 N≡N + 3 H–H = 945 + 3(436) = 945 + 1308 = 2253 kJ.<br/>2) Oluşan bağlar: 2 NH<sub>3</sub> × 3 N–H = 6 N–H = 6(391) = 2346 kJ.<br/>3) ΔH ≈ Σ(kırılan) − Σ(oluşan) = 2253 − 2346 = −93 kJ/mol<sub>rxn</sub>. Doğru şık A.",
    genel_hatirlatma: "ΔH ≈ Σ BE(kırılan) − Σ BE(oluşan). Kırılan bağlar enerji gerektirir, oluşan bağlar enerji açığa çıkarır. Bağ sayısını katsayılardan say: 3 H₂ = 3 H–H bağı, 2 NH₃ = 6 N–H bağı.",
    hata_aciklamalari: {
      B: h("Products − reactants sırası", "2346 − 2253 = +93 kJ. Bond enthalpy ile ΔH = Σ(kırılan) − Σ(oluşan); ürün − reaktif sırası ΔH°f verisi içindir."),
      C: h("Katsayı hatası: 2 NH₃'te yalnız 3 N–H bağı saymak", "2253 − 3(391) = 2253 − 1173 = +1080 kJ çıkar. Her NH₃'te 3 N–H vardır; 2 NH₃ için 6 N–H bağı oluşur: 6 × 391 = 2346 kJ."),
      D: h("Tüm bağ enerjilerini toplamak", "−(2253 + 2346) = −4599 kJ çıkar. Bağ kırmak endotermik (+), bağ oluşturmak ekzotermiktir (−); tüm değerleri aynı işaretle toplayamazsın.")
    },
    ek: { kavram: "ΔH ≈ Σ(kırılan) − Σ(oluşan)", ipucu: "(945 + 3·436) − 6·391 = −93.", sikHata: "2 NH₃'teki N–H bağlarını eksik saymak.", cedKonu: "6.7 Bond Enthalpies", hesapMakinesiDurum: "yardımcı" }
  },

  sv_chem_u9_1: {
    neden: "chem_u9_q1 ile aynı dört süreçti; farklı süreçlerle yeniden yazıldı.",
    konu: "Introduction to entropy",
    govde: "Which of the following processes has a negative entropy change (ΔS° &lt; 0)?",
    secenekler: sec(
      "Ag<sup>+</sup>(aq) + Cl<sup>−</sup>(aq) → AgCl(s)",
      "I<sub>2</sub>(s) → I<sub>2</sub>(g)",
      "N<sub>2</sub>O<sub>4</sub>(g) → 2 NO<sub>2</sub>(g)",
      "2 H<sub>2</sub>O<sub>2</sub>(l) → 2 H<sub>2</sub>O(l) + O<sub>2</sub>(g)"),
    dogru: "A",
    aciklama: "1) Seçenek A: Çözeltide serbestçe hareket eden iki iyon, düzenli bir kristal katıya (çökelti) dönüşür.<br/>2) Parçacıkların konum ve hareket serbestliği azalır → daha az microstate → ΔS° &lt; 0 (AgCl için ≈ −33 J/(mol·K)).<br/>3) B (katı → gaz), C (1 mol gaz → 2 mol gaz) ve D (sıvıdan gaz ürünü oluşur) süreçlerinde ΔS° &gt; 0. Doğru şık A.",
    genel_hatirlatma: "ΔS işaretini tahmin etmek için: gaz mol sayısı değişimi (Δn_gas) en güçlü ipucudur; gaz yoksa faz değişimine bak (katı &lt; sıvı &lt; gaz). Çözeltideki iyonların katı oluşturması (çökelme) parçacıkların dağılımını azaltır: ΔS &lt; 0.",
    hata_aciklamalari: {
      B: h("Süblimleşmeyi ters yorumlamak", "Katı I₂'nin doğrudan gaza geçmesi (süblimleşme) parçacıkların hareket serbestliğini ve microstate sayısını büyük ölçüde artırır: ΔS° > 0."),
      C: h("Gaz mol artışını gözden kaçırmak", "1 mol gaz 2 mol gaza dönüşür (Δn_gas = +1): microstate sayısı artar, ΔS° > 0."),
      D: h("Gaz ürününü gözden kaçırmak", "Sıvı reaktiflerden O₂ gazı oluşur; gaz mol sayısı 0'dan 1'e çıkar: ΔS° > 0.")
    },
    ek: { kavram: "Çökelme: iyonlar düzenli katıya geçerse ΔS° < 0", ipucu: "Gaz oluşumu/artışı → ΔS > 0; iyon → katı çökelme → ΔS < 0.", sikHata: "Gaz mol değişimi olmayan süreçlerde ΔS işaretini tahmin edememek.", cedKonu: "9.1 Introduction to Entropy", hesapMakinesiDurum: "gerekmez" }
  },

  // ---------------------------------------------------------------- Biology ----------------------------------------------------------------
  bio_u1_q7: {
    neden: "bio_u2_q3 ile neredeyse aynıydı (soğukta doymamış yağ asidi; içerik CED 2.4). Ünite 1 için yeni makromolekül sorusu (glikojen dallanması, CED 1.5).",
    konu: "1.5 Structure and Function of Carbohydrates: Glycogen Branching",
    govde: "Glycogen (stored in animal liver and muscle) and amylose (an unbranched form of plant starch) are both polymers of α-glucose. Amylose is a single chain of α(1→4) linkages, whereas glycogen has an α(1→6) branch point about every 8–12 glucose units. The enzyme that mobilizes stored glucose removes glucose units one at a time, and only from the free ends of chains. Which of the following best explains how glycogen's structure supports its function in animals that may need glucose quickly, such as during a sprint?",
    secenekler: sec(
      "Branching gives glycogen β-glycosidic linkages, which animal enzymes hydrolyze faster than α-glycosidic linkages.",
      "Branching increases the number of glucose units in each molecule, so each glucose unit stores more chemical energy.",
      "Branching lets glycogen chains form hydrogen-bonded parallel fibers, as in cellulose, making glycogen a rigid storage structure.",
      "Branching creates many free chain ends, so many enzyme molecules can remove glucose at the same time, releasing glucose rapidly."),
    dogru: "D",
    aciklama: "1. Soru, yapının (dallanma) işlevi (hızlı glikoz salımı) nasıl desteklediğini soruyor.<br/>2. Enzim glikozu yalnızca zincir uçlarından, birer birer koparır.<br/>3. Her α(1→6) dal noktası yeni bir zincir ucu oluşturur; bu yüzden dallı glikojende aynı kütle için çok daha fazla serbest uç vardır.<br/>4. Çok sayıda enzim molekülü aynı anda farklı uçlarda çalışabilir → glikoz hızla serbest kalır (ör. sprint sırasında kas).<br/>5. Doğru cevap: D.",
    genel_hatirlatma: "Makromoleküllerde yapı işlevi belirler (CED 1.5). Glikoz polimerlerinde bağ türü (α ↔ β) sindirilebilirliği ve şekli belirler: α(1→4) sarmal depo (nişasta, glikojen), β(1→4) düz lif (selüloz). Dallanma (α(1→6)) uç sayısını artırarak depo glikozun hızlı mobilizasyonunu sağlar.",
    hata_aciklamalari: {
      A: h("Bağ Türü Hatası: Dal noktalarının β-bağı olduğunu sanmak.", "Glikojendeki dal noktaları α(1→6) bağlarıdır; β-glikozidik bağlar selülozda bulunur ve hayvan enzimleri bunları hızlı yıkamaz, çoğunu hiç yıkamaz."),
      B: h("Miktar–Hız Karışıklığı: Dallanmanın glikoz başına enerjiyi artırdığını sanmak.", "Her glikoz biriminin depoladığı kimyasal enerji dallı ya da düz zincirde aynıdır. Dallanma enerji miktarını değil, glikozun ne kadar HIZLI serbest kalacağını değiştirir."),
      C: h("Yapısal–Depo Polisakkarit Karışıklığı: Glikojeni selüloz gibi lif sanmak.", "Paralel, hidrojen bağlı lifler selülozun β(1→4) bağlarından kaynaklanır ve yapısal destek sağlar. Glikojen α-bağlı, dallı, kompakt bir depo molekülüdür; katı lif yapısı glikozun hızlı salımını engellerdi.")
    },
    ek: { kavram: "Glikojen dallanması: çok uç → hızlı glikoz salımı", ipucu: "Enzim yalnız uçlardan koparır; dal sayısı = uç sayısı.", sikHata: "Dallanmanın glikoz başına enerjiyi artırdığını sanmak.", cedKonu: "Unit 1 · 1.5 Structure and Function of Biological Macromolecules", hesapMakinesi: "gerekmez" }
  },

  sv_bio_u1_3: {
    neden: "bio_u6_q1 ile aynı sayılardı (%18 A); %28 A ile yeniden yazıldı.",
    konu: "1.6 Nucleic Acids (base pairing data)",
    govde: "A sample of double-stranded DNA from a newly discovered bacterium is analyzed, and 28% of its nitrogenous bases are adenine. Based on base-pairing rules, what percentage of the bases in this sample are guanine?",
    secenekler: sec("28%", "44%", "56%", "22%"),
    dogru: "D",
    aciklama: "1. %A = 28% ⟹ %T = 28%.<br/>2. A + T = 56%.<br/>3. G + C = 100% − 56% = 44%.<br/>4. %G = %C = 44% / 2 = 22%.<br/>5. Doğru cevap: D.",
    genel_hatirlatma: "Çift sarmallı DNA'da Chargaff kuralları geçerlidir: %A = %T ve %G = %C (purine = pyrimidine). Bir baz biliniyorsa önce eşini ekle, kalanı diğer çiftin iki bazına eşit böl. Tek sarmallı DNA/RNA'da bu kural geçerli değildir.",
    hata_aciklamalari: {
      A: h("Eşleşme Hatası: G'yi A'ya eşit sanmak.", "Base pairing: A = T ve G = C. Adenine'e eşit olan (28%) thymine'dir, guanine değil."),
      B: h("Yarılama Unutma: G + C toplamını G sanmak.", "A + T = 56%, kalan G + C = 44%. Bu toplam G ve C arasında eşit paylaşılır: G = 22%."),
      C: h("Yanlış Toplam: A + T değerini G sanmak.", "56% adenine + thymine toplamıdır. G, kalan 44%'ün yarısıdır: 22%.")
    },
    ek: { kavram: "Chargaff kuralı", ipucu: "A = T; G + C = 100 − 2A; G = C.", sikHata: "G + C toplamını G sanmak.", cedKonu: "Unit 1 · 1.6 Nucleic Acids", hesapMakinesiDurum: "gerekmez" }
  },

  sv_bio_u4_2: {
    neden: "bio_u4_q21 ile aynı veriydi (200 hücre, 20 mitoz, 24 saat); farklı sayılarla yeniden yazıldı.",
    konu: "4.6 Cell Cycle (estimating phase duration from counts)",
    govde: "In a microscope slide of an onion root tip, students counted 300 cells: 255 were in interphase and 45 were in a stage of mitosis. The complete cell cycle in these cells takes 20 hours. Assuming the proportion of cells in each stage reflects the time spent in that stage, about how long does mitosis last?",
    secenekler: sec("17.0 hours", "1.5 hours", "6.0 hours", "3.0 hours"),
    dogru: "D",
    aciklama: "1. Mitozdaki oran = 45 / 300 = 0.15.<br/>2. Süre = 0.15 × 20 h = 3.0 h.<br/>3. Kontrol: interphase 255/300 = 0.85 × 20 = 17.0 h; 17.0 + 3.0 = 20 h.<br/>4. Doğru cevap: D.",
    genel_hatirlatma: "Asenkron bölünen dokuda bir evredeki hücre oranı, o evrede geçen zamanın döngüye oranına yaklaşık eşittir: t(evre) = (evredeki hücre / toplam hücre) × döngü süresi. Bu yöntem kök ucu (root tip) laboratuvarının temel hesabıdır.",
    hata_aciklamalari: {
      A: h("Yanlış Faz: Interphase süresini hesaplamak.", "255/300 × 20 = 17.0 saat interphase süresidir. Soru mitozu soruyor: 45/300 × 20 = 3.0 saat."),
      B: h("Gereksiz Yarılama: Sonucu iki yavru hücre için ikiye bölmek.", "3.0 / 2 = 1.5 saat çıkar. Hücre oranı doğrudan zaman oranını verir; ek bir 2'ye bölme gerekmez."),
      C: h("Gereksiz İkiye Katlama: Sonucu iki yavru hücre için ikiyle çarpmak.", "3.0 × 2 = 6.0 saat çıkar. Mitoz evresindeki her hücre tek hücre olarak sayılır; süre = (45/300) × 20 = 3.0 saat.")
    },
    ek: { kavram: "Mitoz süresi tahmini", ipucu: "Mitozdaki oran × döngü süresi.", sikHata: "İnterfaz süresini vermek.", cedKonu: "Unit 4 · 4.6 Cell Cycle", hesapMakinesiDurum: "yardımcı" }
  },

  // ---------------------------------------------------------------- English ----------------------------------------------------------------
  eng_write_q15: {
    neden: "Saf dilbilgisi (SAT tarzı) sorusuydu; AP Lang'e uygun retorik amaç sorusu olarak yeniden çerçevelendi.",
    konu: "Sentence Combining for Rhetorical Purpose (Draft 4, Sentences 6–7)",
    govde: "<strong>Draft 4.</strong> The writer wants to combine sentences 6 and 7 (\"The city council will vote in March.\" / \"The vote will decide whether the lanes are built.\") so that the paragraph ends by emphasizing exactly what the council's vote will decide for Elm Avenue. Which version best achieves this purpose?",
    secenekler: sec(
      "The city council will vote in March, and it is one of many votes the council will hold this spring.",
      "In March, the city council, which meets in the old courthouse, will hold a vote.",
      "In March, the city council will vote on whether the bike lanes on Elm Avenue are built.",
      "The city council will vote in March; the vote is very important."),
    dogru: "C",
    aciklama: "1. Amaç: paragrafı, oylamanın NEYİ belirleyeceğini (Elm Avenue'daki bisiklet yollarının yapılıp yapılmayacağını) vurgulayarak bitirmek.<br/>2. C: zamanı (In March), karar vereni (the city council) ve kararın konusunu (whether the bike lanes on Elm Avenue are built) tek cümlede toplar; cümle tam da tartışılan konuyla biter.<br/>3. A oylamayı sıradan bir işe indirger, B kararın konusunu tamamen düşürür, D somut konuyu belirsiz bir \"important\" ile değiştirir.<br/>4. Doğru cevap C.",
    genel_hatirlatma: "AP Lang revizyon sorularında doğru seçenek yalnızca dilbilgisel olarak doğru olan değil, yazarın <strong>belirtilen amacını</strong> (burada: kararın konusunu vurgulamak) en iyi gerçekleştiren seçenektir. Vurgulanacak bilgi cümlenin sonuna, somut sözcüklerle yerleştirilir.",
    hata_aciklamalari: {
      A: h("Vurguyu Dağıtmak: Oylamayı sıradan bir işin parçası gibi sunmak.", "\"one of many votes\" ifadesi kararın önemini küçültür ve oylamanın neyi belirleyeceğini hiç söylemez; amaç tam tersidir."),
      B: h("Konuyu Düşürmek: Alakasız ayrıntı eklemek.", "Toplantı yeri (old courthouse) paragrafın tartışmasıyla ilgisizdir; asıl bilgi (oylamanın bisiklet yollarını belirleyeceği) tamamen kaybolur."),
      D: h("Somut Yerine Belirsiz: Kararın konusunu \"important\" ile geçiştirmek.", "\"very important\" okura neyin önemli olduğunu söylemez; sentence 7'deki somut bilgi (whether the lanes are built) silinir, vurgu zayıflar.")
    },
    ek: { kavram: "Retorik amaç: kararın konusunu cümle sonunda vurgulamak", ipucu: "Amaç cümlesindeki anahtar bilgiyi (neyin karara bağlanacağı) koruyan ve sona koyan seçeneği seç.", sikHata: "Somut bilgiyi belirsiz bir değer sözcüğüyle (important) değiştirmek.", cedKonu: "Skill Cat. 8 · 8.B Sentence combining for purpose (Writing)", hesapMakinesi: "gerekmez" }
  },

  eng_write_q18: {
    neden: "Saf paralellik (dilbilgisi) sorusuydu; retorik etkiyle (ritim ve vurgu) ilişkilendirildi.",
    konu: "Parallelism for Rhetorical Effect (Draft 5, Sentence 4)",
    govde: "<strong>Draft 5.</strong> Sentence 4 reads: \"A repair club, meeting once a week in the lab, would teach students to diagnose faults, to solder loose connections, and replacing worn batteries safely.\" The writer wants the list to build with a steady, emphatic rhythm so that readers can picture three concrete skills members would learn. Which choice for the final item in the series (\"and replacing worn batteries safely\") best achieves this purpose?",
    secenekler: sec(
      "and replacing worn batteries safely (as it is now)",
      "and to replace worn batteries safely",
      "and also, if time allows, perhaps some battery replacement",
      "and they would replace worn batteries safely"),
    dogru: "B",
    aciklama: "1. Amaç: üç somut beceriyi düzenli, vurgulu bir ritimle sıralamak.<br/>2. İlk iki öğe \"to + fiil\" biçiminde (to diagnose, to solder); üçüncü öğe de aynı biçimde olursa (to replace) dizi \"to … to … to …\" ritmiyle güçlenerek biter.<br/>3. B hem paralelliği hem de somut eylemi (replace worn batteries safely) korur.<br/>4. A ritmi son öğede kırar, C son beceriyi çekingen ve belirsiz yapar, D yeni bir özne ekleyip diziyi bozar.<br/>5. Doğru cevap B.",
    genel_hatirlatma: "<strong>Paralel yapı</strong> yalnızca dilbilgisi kuralı değil, retorik bir araçtır: aynı biçimde tekrarlanan öğeler okurda ritim ve birikim etkisi yaratır, son öğeyi vurgular. AP Lang'de \"which choice best achieves the writer's purpose\" sorularında biçim ile amaç birlikte değerlendirilir.",
    hata_aciklamalari: {
      A: h("Ritim Kırılması: Son öğeyi gerund (replacing) bırakmak.", "\"to diagnose, to solder\" kalıbından sonra \"replacing\" gelince dizi son öğede tökezler; üçüncü beceri eklenmiş gibi durur ve vurgu zayıflar."),
      C: h("Çekingen Dil: Son öğeyi koşul ve belirsizlikle yumuşatmak.", "\"if time allows, perhaps some battery replacement\" son beceriyi isteğe bağlı ve belirsiz gösterir; amaç olan \"emphatic\" ve somut liste bozulur."),
      D: h("Özne Kayması: Listeye yeni bir yan cümle eklemek.", "\"they would replace\" diziyi bağımsız bir cümleye çevirir; \"they\" belirsizdir (students mı, club mı?) ve üçlü ritim kaybolur.")
    },
    ek: { kavram: "Paralellik ile ritim ve vurgu", ipucu: "İlk iki öğenin biçimini (to diagnose, to solder) üçüncüye uygula; amaç cümlesindeki 'emphatic' sözcüğüne bak.", sikHata: "Mevcut gerund biçimini doğru sanmak.", cedKonu: "Skill Cat. 8 · 8.B Parallelism for effect (Writing)", hesapMakinesi: "gerekmez" }
  }
};
