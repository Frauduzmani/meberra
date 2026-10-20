// Meberra — Seviye Testi (Tanı Sınavı): AP Calculus AB & BC
// Hazırlayan: Prof. Sinan Demir (AP Calculus). Şema: PM Tur 3 seviye şeması.
// Her ünite 3 soru (easy / medium / hard). Tüm sorular yeni ve AP-style original'dır.
window.APMEBERRA_SEVIYE = window.APMEBERRA_SEVIYE || {};

window.APMEBERRA_SEVIYE["calculus-ab"] = {
  ders: "calculus-ab",
  ad: "AP Calculus AB",
  cedSurum: "CED (güncel, 2024-25 sonrası)",
  portalSayfasi: "ap-calculus.html",
  uniteler: [
    { no: "1", ad: "Limits and Continuity", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "unit1-quiz-section" },
    { no: "2", ad: "Differentiation: Definition and Fundamental Properties", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "unit2-quiz-section" },
    { no: "3", ad: "Differentiation: Composite, Implicit, and Inverse Functions", sinavAgirligi: "5–10%", portaldaVar: true, portalCapa: "unit3-quiz-section" },
    { no: "4", ad: "Contextual Applications of Differentiation", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "unit4-quiz-section" },
    { no: "5", ad: "Analytical Applications of Differentiation", sinavAgirligi: "15–20%", portaldaVar: true, portalCapa: "calc-unit5-quiz-section" },
    { no: "6", ad: "Integration and Accumulation of Change", sinavAgirligi: "15–20%", portaldaVar: true, portalCapa: "calc-unit6-lecture-section" },
    { no: "7", ad: "Differential Equations", sinavAgirligi: "5–10%", portaldaVar: true, portalCapa: "calc-unit7-lecture-section" },
    { no: "8", ad: "Applications of Integration", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "calc-unit8-lecture-section" }
  ],
  sorular: [
    // ---------------- UNIT 1 ----------------
    {
      id: "sv_calcab_u1_1",
      unite: "1",
      beceri: "Limits by algebraic manipulation",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.6)",
      question: "Evaluate $\\displaystyle\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}$.",
      options: [
        { id: "A", text: "$6$", isCorrect: true },
        { id: "B", text: "$0$", isCorrect: false, errorTag: "Belirsiz Form Hatası: $\\frac{0}{0}$ ifadesini $0$ sanmak.", remediation: "$\\frac{0}{0}$ bir <strong>indeterminate form</strong>'dur; limit henüz bilinmiyor demektir. Önce pay çarpanlarına ayrılır: $x^2 - 9 = (x-3)(x+3)$." },
        { id: "C", text: "$3$", isCorrect: false, errorTag: "Sadeleştirme Sonrası Hata: $(x+3)$ yerine yalnızca $x$ değerini yazmak.", remediation: "Sadeleştirmeden sonra kalan ifade $x + 3$'tür; $x \\to 3$ için $3 + 3 = 6$ olur." },
        { id: "D", text: "Does not exist", isCorrect: false, errorTag: "DNE Yanılgısı: Payda sıfır olduğu için limitin olmadığını sanmak.", remediation: "Payda sıfır olsa bile pay da sıfırsa ($\\frac{0}{0}$) limit var olabilir; ortak çarpan sadeleştirilerek <strong>removable discontinuity</strong> görülür." }
      ],
      generalRemediation: "$\\frac{0}{0}$ çıkan limitlerde çarpanlara ayırma, eşlenik ile çarpma veya sadeleştirme gibi <strong>algebraic manipulation</strong> yöntemleri kullanılır.",
      stepByStepSolution: "1. Doğrudan yerine koyma $\\frac{0}{0}$ verir.<br/>2. $\\frac{x^2-9}{x-3} = \\frac{(x-3)(x+3)}{x-3} = x + 3 \\; (x \\ne 3)$.<br/>3. $\\lim_{x \\to 3}(x+3) = 6$."
    },
    {
      id: "sv_calcab_u1_2",
      unite: "1",
      beceri: "Continuity of a piecewise function",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.13)",
      question: "Let $f(x) = \\begin{cases} kx + 1, & x \\lt 2 \\\\ x^2 - k, & x \\ge 2 \\end{cases}$. For what value of $k$ is $f$ continuous at $x = 2$?",
      options: [
        { id: "A", text: "$k = 3$", isCorrect: false, errorTag: "İşaret Hatası: Sağ parçayı $4 + k$ olarak yazmak.", remediation: "Sağdan limit $\\lim_{x \\to 2^+}(x^2 - k) = 4 - k$'dır; $-k$ işaretini koru. $2k + 1 = 4 - k$ denklemi kurulmalı." },
        { id: "B", text: "$k = 1$", isCorrect: true },
        { id: "C", text: "$k = \\frac{3}{2}$", isCorrect: false, errorTag: "Eksik Terim: Sağ parçadaki $-k$ terimini unutmak ($2k + 1 = 4$).", remediation: "Sağ parça $x^2 - k$'dır; $x = 2$'de değeri $4 - k$ olur, yalnızca $4$ değil." },
        { id: "D", text: "$k = \\frac{1}{3}$", isCorrect: false, errorTag: "Cebir Hatası: $3k = 3$ yerine $3k = 1$ yazmak.", remediation: "$2k + 1 = 4 - k \\Rightarrow 3k = 3 \\Rightarrow k = 1$. Sabitleri karşı tarafa atarken $4 - 1 = 3$ olduğuna dikkat et." }
      ],
      generalRemediation: "Bir noktada <strong>continuity</strong> için üç şart: $f(c)$ tanımlı, $\\lim_{x \\to c} f(x)$ var ve ikisi eşit. Parçalı fonksiyonda sol ve sağ limitler eşitlenir.",
      stepByStepSolution: "1. Sol limit: $\\lim_{x \\to 2^-}(kx + 1) = 2k + 1$.<br/>2. Sağ limit ve $f(2)$: $4 - k$.<br/>3. $2k + 1 = 4 - k \\Rightarrow 3k = 3 \\Rightarrow k = 1$."
    },
    {
      id: "sv_calcab_u1_3",
      unite: "1",
      beceri: "Limits at infinity with radicals",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.15)",
      question: "Evaluate $\\displaystyle\\lim_{x \\to -\\infty} \\frac{\\sqrt{9x^2 + 1}}{2x - 1}$.",
      options: [
        { id: "A", text: "$\\frac{3}{2}$", isCorrect: false, errorTag: "İşaret Hatası: $x \\lt 0$ iken $\\sqrt{x^2} = x$ sanmak.", remediation: "$\\sqrt{x^2} = |x|$'tir; $x \\to -\\infty$ için $|x| = -x$ olur. Bu yüzden pay pozitif, payda negatif kalır ve limit negatiftir." },
        { id: "B", text: "$\\frac{9}{2}$", isCorrect: false, errorTag: "Kök Hatası: Baş katsayıyı kök dışına $9$ olarak çıkarmak.", remediation: "$\\sqrt{9x^2} = 3|x|$'tir; baş katsayının da karekökü alınır." },
        { id: "C", text: "$-\\frac{3}{2}$", isCorrect: true },
        { id: "D", text: "$-\\infty$", isCorrect: false, errorTag: "Derece Karşılaştırma Hatası: Paydaki $x^2$ terimini derece $2$ saymak.", remediation: "$\\sqrt{9x^2 + 1}$ ifadesi büyüklük olarak $3|x|$ gibi davranır, yani etkin derecesi $1$'dir. Pay ve payda aynı derecede olduğundan limit sonludur." }
      ],
      generalRemediation: "<strong>Limits at infinity</strong> sorularında payı ve paydayı en yüksek etkin kuvvete böl. Kök içindeki $x^2$, $\\sqrt{x^2} = |x|$ olarak çıkar; $x \\to -\\infty$ ise $|x| = -x$.",
      stepByStepSolution: "1. $x \\lt 0$ için $\\sqrt{9x^2+1} = |x|\\sqrt{9 + \\frac{1}{x^2}} = -x\\sqrt{9 + \\frac{1}{x^2}}$.<br/>2. İfade $\\frac{-x\\sqrt{9 + 1/x^2}}{x(2 - 1/x)} = \\frac{-\\sqrt{9 + 1/x^2}}{2 - 1/x}$ olur.<br/>3. $x \\to -\\infty$ iken limit $-\\frac{3}{2}$'dir."
    },
    // ---------------- UNIT 2 ----------------
    {
      id: "sv_calcab_u2_1",
      unite: "2",
      beceri: "Power rule with negative and fractional exponents",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.6)",
      question: "If $f(x) = 4x^3 - \\frac{2}{x} + \\sqrt{x}$, what is $f'(1)$?",
      options: [
        { id: "A", text: "$\\frac{21}{2}$", isCorrect: false, errorTag: "İşaret Hatası: $-2x^{-1}$ türevini $-2x^{-2}$ almak.", remediation: "$\\frac{d}{dx}(-2x^{-1}) = (-1)(-2)x^{-2} = +\\frac{2}{x^2}$; iki eksi çarpılınca artı olur." },
        { id: "B", text: "$15$", isCorrect: false, errorTag: "Kesirli Üs Hatası: $\\sqrt{x}$ türevini $1$ almak.", remediation: "$\\sqrt{x} = x^{1/2}$ ve türevi $\\frac{1}{2}x^{-1/2} = \\frac{1}{2\\sqrt{x}}$'tir; $x = 1$'de $\\frac{1}{2}$ olur." },
        { id: "C", text: "$\\frac{25}{2}$", isCorrect: false, errorTag: "Terim Atlama: $-\\frac{2}{x}$ terimini sabit gibi düşünüp türevini $0$ almak.", remediation: "$-\\frac{2}{x}$ bir sabit değil, $-2x^{-1}$ kuvvet fonksiyonudur; <strong>power rule</strong> uygulanır." },
        { id: "D", text: "$\\frac{29}{2}$", isCorrect: true }
      ],
      generalRemediation: "Türev almadan önce her terimi $x^n$ biçimine yaz: $\\frac{1}{x} = x^{-1}$, $\\sqrt{x} = x^{1/2}$. Sonra <strong>power rule</strong>: $\\frac{d}{dx}x^n = nx^{n-1}$.",
      stepByStepSolution: "1. $f(x) = 4x^3 - 2x^{-1} + x^{1/2}$.<br/>2. $f'(x) = 12x^2 + 2x^{-2} + \\frac{1}{2}x^{-1/2}$.<br/>3. $f'(1) = 12 + 2 + \\frac{1}{2} = \\frac{29}{2}$."
    },
    {
      id: "sv_calcab_u2_2",
      unite: "2",
      beceri: "Recognizing the limit definition of the derivative",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.2)",
      question: "What is the value of $\\displaystyle\\lim_{h \\to 0} \\frac{(2 + h)^5 - 32}{h}$?",
      options: [
        { id: "A", text: "$80$", isCorrect: true },
        { id: "B", text: "$0$", isCorrect: false, errorTag: "Erken Yerine Koyma: $h = 0$ koyup $\\frac{0}{0} = 0$ demek.", remediation: "$\\frac{0}{0}$ belirsizdir. Bu ifade $f(x) = x^5$ için $x = 2$'deki <strong>difference quotient</strong>'tır; limit $f'(2)$'ye eşittir." },
        { id: "C", text: "$32$", isCorrect: false, errorTag: "Kavram Karışıklığı: Limiti $f(2) = 2^5$ ile karıştırmak.", remediation: "Bu limit fonksiyon değerini değil, $x = 2$'deki anlık değişim hızını ($f'(2)$) verir." },
        { id: "D", text: "$160$", isCorrect: false, errorTag: "Kuvvet Kuralı Hatası: $f'(x) = 5x^5$ veya $5 \\cdot 2^5$ hesaplamak.", remediation: "$\\frac{d}{dx}x^5 = 5x^4$; üs bir azalır. $f'(2) = 5 \\cdot 16 = 80$." }
      ],
      generalRemediation: "$\\lim_{h \\to 0}\\frac{f(a+h) - f(a)}{h} = f'(a)$. Önce $f$ ve $a$'yı tanı ($f(x) = x^5$, $a = 2$, $f(2) = 32$), sonra türevi kurallarla hesapla.",
      stepByStepSolution: "1. $f(x) = x^5$, $a = 2$ ve $f(2) = 32$ olduğundan ifade $f'(2)$'dir.<br/>2. $f'(x) = 5x^4$.<br/>3. $f'(2) = 5 \\cdot 16 = 80$."
    },
    {
      id: "sv_calcab_u2_3",
      unite: "2",
      beceri: "Quotient rule with tabular values",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.9)",
      question: "Differentiable functions $f$ and $g$ satisfy $f(2) = 3$, $f'(2) = -1$, $g(2) = 4$, and $g'(2) = 5$. If $h(x) = \\frac{f(x)}{g(x)}$, what is $h'(2)$?",
      options: [
        { id: "A", text: "$\\frac{19}{16}$", isCorrect: false, errorTag: "Pay Sırası Hatası: $\\frac{fg' - f'g}{g^2}$ yazmak.", remediation: "Quotient rule: $\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}$ (\"low d-high minus high d-low\"). Sıra değişirse işaret ters döner." },
        { id: "B", text: "$-\\frac{19}{16}$", isCorrect: true },
        { id: "C", text: "$\\frac{11}{16}$", isCorrect: false, errorTag: "Kural Karışıklığı: Payda product rule gibi toplam ($f'g + fg'$) kullanmak.", remediation: "Bölümün türevinde payda iki terim arasında <strong>çıkarma</strong> vardır: $f'g - fg'$." },
        { id: "D", text: "$-\\frac{1}{5}$", isCorrect: false, errorTag: "Türevleri Bölme: $h' = \\frac{f'}{g'}$ sanmak.", remediation: "Bölümün türevi, türevlerin bölümü değildir. Quotient rule formülünü kullan." }
      ],
      generalRemediation: "<strong>Quotient rule</strong>: $h'(x) = \\frac{f'(x)g(x) - f(x)g'(x)}{[g(x)]^2}$. Tablo sorularında değerleri doğrudan bu formüle yerleştir.",
      stepByStepSolution: "1. $h'(2) = \\frac{f'(2)g(2) - f(2)g'(2)}{[g(2)]^2}$.<br/>2. $= \\frac{(-1)(4) - (3)(5)}{16} = \\frac{-4 - 15}{16}$.<br/>3. $h'(2) = -\\frac{19}{16}$."
    },
    // ---------------- UNIT 3 ----------------
    {
      id: "sv_calcab_u3_1",
      unite: "3",
      beceri: "Chain rule",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.1)",
      question: "What is $\\frac{d}{dx}\\left[\\sin(3x^2)\\right]$?",
      options: [
        { id: "A", text: "$\\cos(3x^2)$", isCorrect: false, errorTag: "Eksik Chain Rule: İç fonksiyonun türevini çarpmamak.", remediation: "<strong>Chain rule</strong>: $\\frac{d}{dx}\\sin(u) = \\cos(u) \\cdot u'$. Burada $u = 3x^2$, $u' = 6x$." },
        { id: "B", text: "$\\cos(6x)$", isCorrect: false, errorTag: "Yanlış Yerleştirme: İç türevi cosinüsün içine yazmak.", remediation: "Dış fonksiyonun türevi iç fonksiyon <strong>değişmeden</strong> alınır: $\\cos(3x^2)$; iç türev $6x$ ise dışarıda çarpan olur." },
        { id: "C", text: "$6x\\cos(3x^2)$", isCorrect: true },
        { id: "D", text: "$-6x\\cos(3x^2)$", isCorrect: false, errorTag: "İşaret Hatası: $\\sin$ türevini $-\\cos$ almak.", remediation: "$\\frac{d}{dx}\\sin x = \\cos x$ (artı); $\\frac{d}{dx}\\cos x = -\\sin x$ (eksi). İkisini karıştırma." }
      ],
      generalRemediation: "Bileşke fonksiyonda $\\frac{d}{dx}f(g(x)) = f'(g(x)) \\cdot g'(x)$: dışın türevi (iç aynen) çarpı içinin türevi.",
      stepByStepSolution: "1. Dış: $\\sin(u)$, iç: $u = 3x^2$.<br/>2. $\\frac{d}{dx}\\sin(u) = \\cos(u) \\cdot u' = \\cos(3x^2) \\cdot 6x$.<br/>3. Türev $6x\\cos(3x^2)$'dir."
    },
    {
      id: "sv_calcab_u3_2",
      unite: "3",
      beceri: "Implicit differentiation",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.2)",
      question: "The curve $x^2 + xy + y^2 = 7$ passes through the point $(1, 2)$. What is $\\frac{dy}{dx}$ at $(1, 2)$?",
      options: [
        { id: "A", text: "$-\\frac{2}{5}$", isCorrect: false, errorTag: "Product Rule Eksikliği: $xy$ teriminin türevini yalnızca $\\frac{dy}{dx}$ almak.", remediation: "$\\frac{d}{dx}(xy) = y + x\\frac{dy}{dx}$ (<strong>product rule</strong>). $y$ terimini unutma." },
        { id: "B", text: "$-\\frac{1}{2}$", isCorrect: false, errorTag: "Terim Atlama: $xy$ terimini tamamen göz ardı etmek.", remediation: "Denklemin her terimi türevlenmelidir; $xy$ karma terimi hem $y$ hem $x\\frac{dy}{dx}$ katkısı yapar." },
        { id: "C", text: "$\\frac{4}{5}$", isCorrect: false, errorTag: "İşaret Hatası: $\\frac{dy}{dx}$ için çözerken eksiyi kaybetmek.", remediation: "$4 + 5\\frac{dy}{dx} = 0 \\Rightarrow \\frac{dy}{dx} = -\\frac{4}{5}$. Terimi karşıya atarken işaret değişir." },
        { id: "D", text: "$-\\frac{4}{5}$", isCorrect: true }
      ],
      generalRemediation: "<strong>Implicit differentiation</strong>: Her $y$ teriminin türevine $\\frac{dy}{dx}$ çarpanı eklenir; $xy$ gibi karma terimlerde product rule zorunludur. Sonra $\\frac{dy}{dx}$ yalnız bırakılır.",
      stepByStepSolution: "1. $2x + \\left(y + x\\frac{dy}{dx}\\right) + 2y\\frac{dy}{dx} = 0$.<br/>2. $(1, 2)$'de: $2 + 2 + (1 + 4)\\frac{dy}{dx} = 0$.<br/>3. $5\\frac{dy}{dx} = -4 \\Rightarrow \\frac{dy}{dx} = -\\frac{4}{5}$."
    },
    {
      id: "sv_calcab_u3_3",
      unite: "3",
      beceri: "Derivative of an inverse function",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.3)",
      question: "Let $f(x) = x^3 + 2x + 1$, and let $g$ be the inverse function of $f$. What is $g'(4)$?",
      options: [
        { id: "A", text: "$\\frac{1}{5}$", isCorrect: true },
        { id: "B", text: "$\\frac{1}{50}$", isCorrect: false, errorTag: "Yanlış Nokta: $\\frac{1}{f'(4)}$ hesaplamak.", remediation: "$g'(4) = \\frac{1}{f'(g(4))}$. Önce $f(a) = 4$ çözülür: $a = 1$. Türev $x = 1$'de alınır, $x = 4$'te değil." },
        { id: "C", text: "$5$", isCorrect: false, errorTag: "Ters Alma Unutuldu: $g'(4) = f'(1)$ sanmak.", remediation: "Ters fonksiyonun türevi orijinal türevin <strong>çarpmaya göre tersidir</strong>: $\\frac{1}{f'(1)}$." },
        { id: "D", text: "$50$", isCorrect: false, errorTag: "Çifte Hata: $f'(4)$ değerini doğrudan yazmak.", remediation: "Hem nokta hem işlem hatalı: $g'(b) = \\frac{1}{f'(a)}$ ve $f(a) = b$ olmalı." }
      ],
      generalRemediation: "<strong>Inverse function derivative</strong>: $f(a) = b$ ise $g'(b) = \\frac{1}{f'(a)}$. Önce $b$ değerini veren $a$'yı bul.",
      stepByStepSolution: "1. $f(a) = 4 \\Rightarrow a^3 + 2a + 1 = 4 \\Rightarrow a = 1$ (tek reel kök).<br/>2. $f'(x) = 3x^2 + 2 \\Rightarrow f'(1) = 5$.<br/>3. $g'(4) = \\frac{1}{f'(1)} = \\frac{1}{5}$."
    },
    // ---------------- UNIT 4 ----------------
    {
      id: "sv_calcab_u4_1",
      unite: "4",
      beceri: "Straight-line motion: acceleration",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.2)",
      question: "A particle moves along the $x$-axis with position $x(t) = t^3 - 6t^2$ for $t \\ge 0$. What is the acceleration of the particle at $t = 1$?",
      options: [
        { id: "A", text: "$-9$", isCorrect: false, errorTag: "Yanlış Türev Mertebesi: Hızı ($x'(1)$) hesaplamak.", remediation: "Velocity $v = x'(t)$, acceleration $a = x''(t)$'dir. İkinci türevi almalısın." },
        { id: "B", text: "$-6$", isCorrect: true },
        { id: "C", text: "$-5$", isCorrect: false, errorTag: "Türevsiz Değer: Konumu ($x(1)$) hesaplamak.", remediation: "Konum $x(1) = 1 - 6 = -5$'tir; soru ivmeyi, yani $x''(1)$'i istiyor." },
        { id: "D", text: "$6$", isCorrect: false, errorTag: "İşaret Hatası: $6t - 12$ yerine $12 - 6t$ yazmak.", remediation: "$x''(t) = 6t - 12$; $t = 1$'de $-6$. Negatif ivme, hızın azalma yönünde değiştiğini gösterir." }
      ],
      generalRemediation: "Doğrusal hareket zinciri: position $x(t)$ → velocity $v(t) = x'(t)$ → acceleration $a(t) = v'(t) = x''(t)$.",
      stepByStepSolution: "1. $v(t) = 3t^2 - 12t$.<br/>2. $a(t) = 6t - 12$.<br/>3. $a(1) = 6 - 12 = -6$."
    },
    {
      id: "sv_calcab_u4_2",
      unite: "4",
      beceri: "Related rates: sphere volume",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.5)",
      question: "Air is pumped into a spherical balloon at a rate of $100 \\text{ cm}^3/\\text{s}$. How fast is the radius increasing, in $\\text{cm/s}$, when the radius is $5 \\text{ cm}$? $\\left(V = \\frac{4}{3}\\pi r^3\\right)$",
      options: [
        { id: "A", text: "$\\frac{3}{5\\pi}$", isCorrect: false, errorTag: "Türev Almadan Bölme: $\\frac{dV}{dt}$ değerini $V$'ye bölmek.", remediation: "Önce zamana göre türev: $\\frac{dV}{dt} = 4\\pi r^2\\frac{dr}{dt}$. Hacim formülünün kendisiyle oran kurulamaz." },
        { id: "B", text: "$\\frac{5}{\\pi}$", isCorrect: false, errorTag: "Kuvvet Kuralı Hatası: $\\frac{dV}{dr} = 4\\pi r$ almak.", remediation: "$\\frac{d}{dr}\\left(\\frac{4}{3}\\pi r^3\\right) = 4\\pi r^2$; $r = 5$'te $100\\pi$ olur." },
        { id: "C", text: "$\\frac{1}{\\pi}$", isCorrect: true },
        { id: "D", text: "$\\frac{4}{\\pi}$", isCorrect: false, errorTag: "Yanlış Formül: Çember alanı $\\pi r^2$ ile $\\frac{dr}{dt}$ çözmek.", remediation: "Küre hacminin türevi yüzey alanıdır: $4\\pi r^2$, $\\pi r^2$ değil." }
      ],
      generalRemediation: "<strong>Related rates</strong>: (1) değişkenleri ilişkilendiren denklemi yaz, (2) zamana göre türev al, (3) anlık değerleri <strong>türevden sonra</strong> yerine koy.",
      stepByStepSolution: "1. $\\frac{dV}{dt} = 4\\pi r^2 \\frac{dr}{dt}$.<br/>2. $100 = 4\\pi(25)\\frac{dr}{dt} = 100\\pi\\frac{dr}{dt}$.<br/>3. $\\frac{dr}{dt} = \\frac{1}{\\pi} \\text{ cm/s}$."
    },
    {
      id: "sv_calcab_u4_3",
      unite: "4",
      beceri: "L'Hôpital's Rule applied twice",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.7)",
      question: "Evaluate $\\displaystyle\\lim_{x \\to 0} \\frac{e^{2x} - 1 - 2x}{x^2}$.",
      options: [
        { id: "A", text: "$4$", isCorrect: false, errorTag: "Payda Türevi Hatası: İkinci uygulamada paydanın türevini $1$ almak.", remediation: "$\\frac{d^2}{dx^2}(x^2) = 2$'dir; ikinci adımda $\\frac{4e^{2x}}{2}$ elde edilir." },
        { id: "B", text: "$0$", isCorrect: false, errorTag: "Erken Durma: İlk L'Hôpital sonrası $\\frac{0}{0}$'ı $0$ kabul etmek.", remediation: "İlk uygulamadan sonra $\\frac{2e^{2x} - 2}{2x}$ hâlâ $\\frac{0}{0}$; kural yeniden uygulanmalıdır." },
        { id: "C", text: "$1$", isCorrect: false, errorTag: "Chain Rule Eksikliği: İkinci türevde $e^{2x}$'in iç türevini unutmak.", remediation: "$\\frac{d}{dx}(2e^{2x}) = 4e^{2x}$; her türevde iç türev $2$ çarpanı gelir." },
        { id: "D", text: "$2$", isCorrect: true }
      ],
      generalRemediation: "<strong>L'Hôpital's Rule</strong> yalnızca $\\frac{0}{0}$ veya $\\frac{\\infty}{\\infty}$ için geçerlidir. Her uygulamadan önce formu yeniden kontrol et; FRQ'da bu kontrolü yazılı göster.",
      stepByStepSolution: "1. $x = 0$'da form $\\frac{0}{0}$; L'Hôpital: $\\frac{2e^{2x} - 2}{2x}$.<br/>2. Yine $\\frac{0}{0}$; tekrar: $\\frac{4e^{2x}}{2}$.<br/>3. $x \\to 0$: $\\frac{4}{2} = 2$."
    },
    // ---------------- UNIT 5 ----------------
    {
      id: "sv_calcab_u5_1",
      unite: "5",
      beceri: "First Derivative Test",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.4)",
      question: "The derivative of a function $f$ is $f'(x) = (x - 1)(x + 2)^2$. Which of the following describes the relative extrema of $f$?",
      options: [
        { id: "A", text: "Relative minimum at $x = 1$ only", isCorrect: true },
        { id: "B", text: "Relative min at $x = 1$; relative max at $x = -2$", isCorrect: false, errorTag: "Kritik Nokta = Ekstremum Yanılgısı: $f'(-2) = 0$ olduğu için ekstremum sanmak.", remediation: "$(x+2)^2 \\ge 0$ olduğundan $f'$, $x = -2$'nin iki yanında da negatiftir; <strong>işaret değişimi yok</strong>, ekstremum yok." },
        { id: "C", text: "Relative maximum at $x = 1$ only", isCorrect: false, errorTag: "İşaret Okuma Hatası: $-$'dan $+$'ya geçişi maksimum sanmak.", remediation: "$f'$ negatiften pozitife geçiyorsa $f$ önce azalıp sonra artar: <strong>relative minimum</strong>." },
        { id: "D", text: "Relative maximum at $x = -2$ only", isCorrect: false, errorTag: "Çift Katlı Kök Hatası: Kare çarpanlı kökü ekstremum saymak.", remediation: "Çift katlı kökte türev işaret değiştirmez. İşaret tablosu kur: $(-\\infty,-2)$: $-$, $(-2,1)$: $-$, $(1,\\infty)$: $+$." }
      ],
      generalRemediation: "<strong>First Derivative Test</strong>: Kritik noktada $f'$ işareti $+ \\to -$ değişirse relative max, $- \\to +$ değişirse relative min; değişmiyorsa ekstremum yoktur.",
      stepByStepSolution: "1. Kritik noktalar: $x = -2$ ve $x = 1$.<br/>2. İşaret: $x \\lt -2$: $-$; $-2 \\lt x \\lt 1$: $-$; $x \\gt 1$: $+$.<br/>3. Yalnızca $x = 1$'de $- \\to +$ değişim var: relative minimum."
    },
    {
      id: "sv_calcab_u5_2",
      unite: "5",
      beceri: "Mean Value Theorem",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.1)",
      question: "Let $f(x) = x^3 - 3x$ on the interval $[0, 3]$. What value of $c$ in $(0, 3)$ satisfies the conclusion of the Mean Value Theorem?",
      options: [
        { id: "A", text: "$c = \\sqrt{7}$", isCorrect: false, errorTag: "Ortalama Hız Hatası: $\\frac{f(3) - f(0)}{3 - 0}$ yerine $f(3) - f(0) = 18$ kullanmak.", remediation: "Ortalama değişim hızı aralık uzunluğuna bölünür: $\\frac{18 - 0}{3} = 6$." },
        { id: "B", text: "$c = \\sqrt{3}$", isCorrect: true },
        { id: "C", text: "$c = 1$", isCorrect: false, errorTag: "Rolle Karışıklığı: $f'(c) = 0$ çözmek.", remediation: "$f'(c) = 0$ yalnızca $f(a) = f(b)$ olduğunda (<strong>Rolle's Theorem</strong>) geçerlidir. MVT'de $f'(c)$ ortalama değişim hızına eşitlenir." },
        { id: "D", text: "$c = \\sqrt{2}$", isCorrect: false, errorTag: "Türev Hatası: $f'(x) = 3x^2$ alıp $-3$'ü unutmak.", remediation: "$\\frac{d}{dx}(x^3 - 3x) = 3x^2 - 3$. Doğru denklem $3c^2 - 3 = 6$." }
      ],
      generalRemediation: "<strong>MVT</strong>: $f$, $[a,b]$'de continuous ve $(a,b)$'de differentiable ise $f'(c) = \\frac{f(b) - f(a)}{b - a}$ olacak bir $c \\in (a, b)$ vardır. FRQ'da bu ön koşulları mutlaka yaz.",
      stepByStepSolution: "1. $f$ polinom: continuous ve differentiable.<br/>2. $\\frac{f(3) - f(0)}{3} = \\frac{18 - 0}{3} = 6$.<br/>3. $3c^2 - 3 = 6 \\Rightarrow c^2 = 3 \\Rightarrow c = \\sqrt{3} \\in (0, 3)$."
    },
    {
      id: "sv_calcab_u5_3",
      unite: "5",
      beceri: "Locating a relative maximum from f' (calculator)",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 5.4) — calculator active",
      question: "<strong>Graphing calculator required.</strong> The derivative of $f$ is $f'(x) = \\cos x - 0.2x^2$ for $0 \\lt x \\lt 3$. At what value of $x$ does $f$ have a relative maximum?",
      options: [
        { id: "A", text: "$x \\approx 1.571$", isCorrect: false, errorTag: "Terim Atlama: $0.2x^2$ terimini yok sayıp $\\cos x = 0$ çözmek.", remediation: "Kritik nokta $f'(x) = 0$, yani $\\cos x = 0.2x^2$ denkleminin köküdür; iki grafiğin kesişimini hesap makinesiyle bul." },
        { id: "B", text: "$x \\approx 2.236$", isCorrect: false, errorTag: "Mod Hatası: Hesap makinesini DEGREE modunda kullanmak (veya $\\cos x \\approx 1$ varsaymak).", remediation: "AP Calculus'ta trigonometrik fonksiyonlar her zaman <strong>RADIAN</strong> modundadır. Degree modunda $\\cos x \\approx 1$ olur ve kök $\\sqrt{5}$'e kayar." },
        { id: "C", text: "$x \\approx 1.252$", isCorrect: true },
        { id: "D", text: "None; $x \\approx 1.252$ is a relative minimum", isCorrect: false, errorTag: "İşaret Okuma Hatası: $+ \\to -$ geçişini minimum sanmak.", remediation: "$f'(1) \\gt 0$ ve $f'(2) \\lt 0$; $f$ önce artıp sonra azalır, bu bir <strong>relative maximum</strong>'dır." }
      ],
      generalRemediation: "Calculator-active sorularda $f'(x) = 0$ köklerini <strong>zero / intersect</strong> komutuyla bul, sonra kökün iki yanında $f'$ işaretini kontrol et. Mod her zaman radian.",
      stepByStepSolution: "1. $f'(x) = 0 \\iff \\cos x = 0.2x^2$; radian modda kök $x \\approx 1.252$.<br/>2. $f'(0.5) \\approx 0.83 \\gt 0$, $f'(2) \\approx -1.22 \\lt 0$.<br/>3. $f'$ pozitiften negatife geçtiği için $x \\approx 1.252$'de relative maximum vardır."
    },
    // ---------------- UNIT 6 ----------------
    {
      id: "sv_calcab_u6_1",
      unite: "6",
      beceri: "Evaluating a definite integral with FTC",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.7)",
      question: "Evaluate $\\displaystyle\\int_1^3 (2x + 1)\\,dx$.",
      options: [
        { id: "A", text: "$8$", isCorrect: false, errorTag: "Terim Atlama: $+1$ teriminin antitürevi olan $x$'i unutmak.", remediation: "$\\int (2x + 1)\\,dx = x^2 + x + C$; sabit terimin antitürevi $x$'tir." },
        { id: "B", text: "$12$", isCorrect: false, errorTag: "Alt Sınır Unutuldu: Yalnızca $F(3)$ hesaplamak.", remediation: "FTC: $\\int_a^b f(x)\\,dx = F(b) - F(a)$. $F(1) = 2$ çıkarılmalıdır." },
        { id: "C", text: "$4$", isCorrect: false, errorTag: "Antitürev Yerine Fonksiyon: $f(3) - f(1)$ hesaplamak.", remediation: "Belirli integral, integrandın değil <strong>antiderivative</strong>'in uç değerleri farkıdır." },
        { id: "D", text: "$10$", isCorrect: true }
      ],
      generalRemediation: "<strong>Fundamental Theorem of Calculus</strong>: $F' = f$ ise $\\int_a^b f(x)\\,dx = F(b) - F(a)$.",
      stepByStepSolution: "1. $F(x) = x^2 + x$.<br/>2. $F(3) = 12$, $F(1) = 2$.<br/>3. $\\int_1^3 (2x+1)\\,dx = 12 - 2 = 10$."
    },
    {
      id: "sv_calcab_u6_2",
      unite: "6",
      beceri: "Derivative of an accumulation function with variable limit",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.4)",
      question: "If $F(x) = \\displaystyle\\int_0^{x^2} \\cos(t^3)\\,dt$, what is $F'(x)$?",
      options: [
        { id: "A", text: "$2x\\cos(x^6)$", isCorrect: true },
        { id: "B", text: "$\\cos(x^6)$", isCorrect: false, errorTag: "Chain Rule Eksikliği: Üst sınırın türevini ($2x$) çarpmamak.", remediation: "$\\frac{d}{dx}\\int_a^{g(x)} f(t)\\,dt = f(g(x)) \\cdot g'(x)$. Üst sınır $x^2$ olduğu için $2x$ çarpanı gelir." },
        { id: "C", text: "$2x\\cos(x^3)$", isCorrect: false, errorTag: "Yerine Koyma Hatası: $t$ yerine $x^2$ değil $x$ koymak.", remediation: "$t^3$ içine üst sınırın tamamı yazılır: $(x^2)^3 = x^6$." },
        { id: "D", text: "$\\cos(x^6) - 1$", isCorrect: false, errorTag: "FTC Karışıklığı: Integrandı $F(b) - F(a)$ gibi uç değer farkıyla hesaplamak.", remediation: "Accumulation function türevinde alt sınır sabitse katkısı sıfırdır; integrand üst sınırda değerlendirilir ve chain rule uygulanır." }
      ],
      generalRemediation: "<strong>FTC Part 1 + Chain Rule</strong>: $\\frac{d}{dx}\\int_a^{g(x)} f(t)\\,dt = f(g(x))\\,g'(x)$.",
      stepByStepSolution: "1. $f(t) = \\cos(t^3)$, $g(x) = x^2$, $g'(x) = 2x$.<br/>2. $f(g(x)) = \\cos((x^2)^3) = \\cos(x^6)$.<br/>3. $F'(x) = 2x\\cos(x^6)$."
    },
    {
      id: "sv_calcab_u6_3",
      unite: "6",
      beceri: "Accumulation of a rate in context (calculator)",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 6.7) — calculator active",
      question: "<strong>Graphing calculator required.</strong> Water flows into a tank at a rate of $r(t) = 20\\sin\\left(\\frac{t^2}{35}\\right)$ gallons per hour, where $t$ is in hours. How many gallons of water flow into the tank from $t = 0$ to $t = 8$?",
      options: [
        { id: "A", text: "$9.571$", isCorrect: false, errorTag: "Ortalama ile Karıştırma: Toplamı $8$'e bölüp ortalama hızı bulmak.", remediation: "Toplam miktar $\\int_0^8 r(t)\\,dt$'dir; $\\frac{1}{8}\\int_0^8 r(t)\\,dt$ ise <strong>average rate</strong>'tir." },
        { id: "B", text: "$76.570$", isCorrect: true },
        { id: "C", text: "$19.339$", isCorrect: false, errorTag: "Anlık Hız Hatası: $r(8)$ değerini toplam miktar sanmak.", remediation: "$r(8)$ yalnızca $t = 8$'deki anlık akış hızıdır (gal/saat). Toplam değişim için hızı integralle." },
        { id: "D", text: "$1.702$", isCorrect: false, errorTag: "Mod Hatası: İntegrali DEGREE modunda hesaplamak.", remediation: "Hesap makinesini <strong>RADIAN</strong> moduna al; AP Calculus'ta açı birimi daima radyandır." }
      ],
      generalRemediation: "<strong>Net change theorem</strong>: Bir hızın integrali, o niceliğin toplam değişimini verir. Antitürevi elementer olmayan integrandlarda <code>fnInt</code> / numerik integral kullan ve 3 ondalık yaz.",
      stepByStepSolution: "1. Toplam su $= \\int_0^8 20\\sin\\left(\\frac{t^2}{35}\\right) dt$.<br/>2. Radian modda numerik integral $\\approx 76.570$.<br/>3. Yaklaşık $76.570$ galon su girer."
    },
    // ---------------- UNIT 7 ----------------
    {
      id: "sv_calcab_u7_1",
      unite: "7",
      beceri: "Verifying solutions to a differential equation",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.2)",
      question: "Which of the following functions is a solution to the differential equation $\\frac{dy}{dx} = 3y$?",
      options: [
        { id: "A", text: "$y = e^{3x} + 5$", isCorrect: false, errorTag: "Toplamsal Sabit Hatası: Sabiti üstel ifadeye eklemek.", remediation: "$y' = 3e^{3x}$ ama $3y = 3e^{3x} + 15$; eşit değil. Bu DE'de keyfi sabit <strong>çarpan</strong> olarak gelir: $y = Ce^{3x}$." },
        { id: "B", text: "$y = 5e^{x/3}$", isCorrect: false, errorTag: "Katsayı Ters Çevirme: Üsteki $3$'ü $\\frac{1}{3}$ yazmak.", remediation: "$y = 5e^{x/3}$ ise $y' = \\frac{1}{3}y$ olur. $\\frac{dy}{dx} = ky$ için çözüm $Ce^{kx}$'tir; burada $k = 3$." },
        { id: "C", text: "$y = 5e^{3x}$", isCorrect: true },
        { id: "D", text: "$y = 3e^{x}$", isCorrect: false, errorTag: "Katsayı Yerleşim Hatası: $3$'ü üs yerine katsayıya yazmak.", remediation: "$y = 3e^x$ ise $y' = 3e^x = y$, yani $y' = y$; $3y$ değil." }
      ],
      generalRemediation: "Bir fonksiyonun DE çözümü olup olmadığını test etmek için türevini al ve iki tarafa yerleştir; özdeş eşitlik sağlanmalı.",
      stepByStepSolution: "1. $y = 5e^{3x} \\Rightarrow y' = 15e^{3x}$.<br/>2. $3y = 15e^{3x}$.<br/>3. $y' = 3y$ sağlanır; $y = 5e^{3x}$ bir çözümdür."
    },
    {
      id: "sv_calcab_u7_2",
      unite: "7",
      beceri: "Separation of variables with initial condition",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.7)",
      question: "Let $y = f(x)$ be the particular solution to $\\frac{dy}{dx} = xy^2$ with $f(0) = 1$. What is $f(1)$?",
      options: [
        { id: "A", text: "$-2$", isCorrect: false, errorTag: "Sabit Unutuldu: $+C$ eklemeden çözmek.", remediation: "İntegralden sonra $-\\frac{1}{y} = \\frac{x^2}{2} + C$ yazılır ve $C$, başlangıç koşulundan bulunur ($C = -1$)." },
        { id: "B", text: "$\\frac{2}{3}$", isCorrect: false, errorTag: "Antitürev İşaret Hatası: $\\int y^{-2}\\,dy = \\frac{1}{y}$ almak.", remediation: "$\\int y^{-2}\\,dy = \\frac{y^{-1}}{-1} = -\\frac{1}{y}$; eksi işareti kritik." },
        { id: "C", text: "$e^{1/2}$", isCorrect: false, errorTag: "Model Karışıklığı: $y^2$'yi $y$ gibi işleyip üstel çözüm yazmak.", remediation: "$\\frac{dy}{y^2}$ integrali logaritma değil kuvvet kuralı verir. $\\ln|y|$ yalnızca $\\frac{dy}{y}$ için çıkar." },
        { id: "D", text: "$2$", isCorrect: true }
      ],
      generalRemediation: "<strong>Separation of variables</strong>: $y$'leri bir tarafa, $x$'leri diğer tarafa ayır, iki tarafı integralle, $+C$ ekle ve başlangıç koşulunu hemen uygula.",
      stepByStepSolution: "1. $\\frac{dy}{y^2} = x\\,dx \\Rightarrow -\\frac{1}{y} = \\frac{x^2}{2} + C$.<br/>2. $f(0) = 1$: $-1 = C$.<br/>3. $\\frac{1}{y} = 1 - \\frac{x^2}{2} \\Rightarrow y = \\frac{2}{2 - x^2}$; $f(1) = \\frac{2}{1} = 2$."
    },
    {
      id: "sv_calcab_u7_3",
      unite: "7",
      beceri: "Newton's Law of Cooling (exponential model)",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.8)",
      question: "The temperature $T$ (in °C) of a cup of tea satisfies $\\frac{dT}{dt} = -k(T - 20)$, where $t$ is in minutes and $k$ is a positive constant. If $T(0) = 90$ and $T(10) = 55$, what is $T(20)$?",
      options: [
        { id: "A", text: "$37.5$", isCorrect: true },
        { id: "B", text: "$20$", isCorrect: false, errorTag: "Doğrusal Model Hatası: Sıcaklığın her 10 dakikada $35$ derece sabit düştüğünü varsaymak.", remediation: "DE üstel bir modeldir: sıcaklık farkı $T - 20$ her 10 dakikada <strong>yarıya</strong> iner, sabit miktarda azalmaz." },
        { id: "C", text: "$27.5$", isCorrect: false, errorTag: "Yanlış Nicelik: Farkı değil $T$'nin kendisini yarıya indirmek.", remediation: "Üstel azalan nicelik $T - 20$'dir: $35 \\to 17.5$. Sonra ortam sıcaklığı geri eklenir: $20 + 17.5$." },
        { id: "D", text: "$33.6$", isCorrect: false, errorTag: "Ortam Sıcaklığı Unutuldu: $T = 90e^{-kt}$ modelini kullanmak.", remediation: "Çözüm $T - 20 = 70e^{-kt}$ biçimindedir; $-20$ kayması unutulursa $T$ sıfıra çekilir, $20$'ye değil." }
      ],
      generalRemediation: "$\\frac{dy}{dt} = k(y - M)$ biçimindeki DE'nin çözümü $y = M + Ce^{kt}$'dir. Üstel davranan nicelik $y - M$ farkıdır.",
      stepByStepSolution: "1. $T - 20 = 70e^{-kt}$.<br/>2. $T(10) = 55$: $35 = 70e^{-10k} \\Rightarrow e^{-10k} = \\frac{1}{2}$.<br/>3. $T(20) = 20 + 70\\left(\\frac{1}{2}\\right)^2 = 20 + 17.5 = 37.5$."
    },
    // ---------------- UNIT 8 ----------------
    {
      id: "sv_calcab_u8_1",
      unite: "8",
      beceri: "Average value of a function",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 8.1)",
      question: "What is the average value of $f(x) = x^2$ on the interval $[0, 3]$?",
      options: [
        { id: "A", text: "$9$", isCorrect: false, errorTag: "Bölme Unutuldu: Yalnızca $\\int_0^3 x^2\\,dx$ hesaplamak.", remediation: "Average value $= \\frac{1}{b - a}\\int_a^b f(x)\\,dx$; integral aralık uzunluğu $3$'e bölünür." },
        { id: "B", text: "$3$", isCorrect: true },
        { id: "C", text: "$\\frac{9}{2}$", isCorrect: false, errorTag: "Uç Nokta Ortalaması: $\\frac{f(0) + f(3)}{2}$ hesaplamak.", remediation: "Uç değerlerin ortalaması yalnızca doğrusal fonksiyonlar için ortalama değere eşittir; eğri için integral gerekir." },
        { id: "D", text: "$\\sqrt{3}$", isCorrect: false, errorTag: "Değer ile Konum Karışıklığı: $f(c) = 3$ sağlayan $c$'yi yazmak.", remediation: "$\\sqrt{3}$, fonksiyonun ortalama değerini aldığı $x$ konumudur; soru $f_{avg}$ değerini istiyor." }
      ],
      generalRemediation: "<strong>Average value of a function</strong>: $f_{avg} = \\frac{1}{b-a}\\int_a^b f(x)\\,dx$. Bunu average rate of change ($\\frac{f(b)-f(a)}{b-a}$) ile karıştırma.",
      stepByStepSolution: "1. $\\int_0^3 x^2\\,dx = \\frac{x^3}{3}\\Big|_0^3 = 9$.<br/>2. $f_{avg} = \\frac{1}{3} \\cdot 9$.<br/>3. $f_{avg} = 3$."
    },
    {
      id: "sv_calcab_u8_2",
      unite: "8",
      beceri: "Volume by disc method",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 8.9)",
      question: "The region bounded by $y = \\sqrt{x}$, the $x$-axis, and the line $x = 4$ is revolved about the $x$-axis. What is the volume of the resulting solid?",
      options: [
        { id: "A", text: "$16\\pi$", isCorrect: false, errorTag: "Antitürev Hatası: $\\int x\\,dx = x^2$ almak ($\\frac{1}{2}$ unutuldu).", remediation: "$\\int_0^4 x\\,dx = \\frac{x^2}{2}\\Big|_0^4 = 8$, yani hacim $8\\pi$." },
        { id: "B", text: "$\\frac{16\\pi}{3}$", isCorrect: false, errorTag: "Yarıçap Karesi Unutuldu: $\\pi\\int_0^4 \\sqrt{x}\\,dx$ hesaplamak.", remediation: "Disc method'da kesit alanı $\\pi[R(x)]^2$'dir; $R = \\sqrt{x}$ ise $R^2 = x$." },
        { id: "C", text: "$8\\pi$", isCorrect: true },
        { id: "D", text: "$8$", isCorrect: false, errorTag: "Eksik Çarpan: Kesit alanındaki $\\pi$ çarpanını unutmak.", remediation: "Her disk bir dairedir: alan $\\pi R^2$. Hacim $\\pi\\int_a^b R^2\\,dx$." }
      ],
      generalRemediation: "<strong>Disc method</strong>: $V = \\pi\\int_a^b [R(x)]^2\\,dx$; $R(x)$, dönme ekseninden eğriye uzaklıktır.",
      stepByStepSolution: "1. $R(x) = \\sqrt{x}$, $R^2 = x$.<br/>2. $V = \\pi\\int_0^4 x\\,dx = \\pi \\cdot \\frac{16}{2}$.<br/>3. $V = 8\\pi$."
    },
    {
      id: "sv_calcab_u8_3",
      unite: "8",
      beceri: "Area between curves with calculator intersections",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 8.4) — calculator active",
      question: "<strong>Graphing calculator required.</strong> Let $R$ be the region enclosed by the graphs of $y = 2\\cos x$ and $y = x^2$. What is the area of $R$?",
      options: [
        { id: "A", text: "$1.350$", isCorrect: false, errorTag: "Yarım Bölge: Yalnızca $[0, a]$ aralığında integral almak.", remediation: "Eğriler $x = \\pm 1.022$'de kesişir; bölge $y$-ekseninin iki yanındadır. Simetri kullanıyorsan sonucu $2$ ile çarp." },
        { id: "B", text: "$3.771$", isCorrect: false, errorTag: "Mod Hatası: Kesişimleri ve integrali DEGREE modunda hesaplamak.", remediation: "Radian modda kesişimler $x \\approx \\pm 1.022$'dir. Mod hatası hem sınırları hem integrandı bozar." },
        { id: "C", text: "$-2.701$", isCorrect: false, errorTag: "Sıralama Hatası: Alt eğriden üst eğriyi çıkarmak ($x^2 - 2\\cos x$).", remediation: "Alan daima pozitiftir: $\\int (\\text{top} - \\text{bottom})\\,dx$. Bu aralıkta $2\\cos x \\ge x^2$." },
        { id: "D", text: "$2.701$", isCorrect: true }
      ],
      generalRemediation: "<strong>Area between curves</strong>: (1) kesişimleri hesap makinesiyle bul ve sakla, (2) hangi eğrinin üstte olduğunu belirle, (3) $\\int_a^b (\\text{top} - \\text{bottom})\\,dx$.",
      stepByStepSolution: "1. $2\\cos x = x^2 \\Rightarrow x \\approx \\pm 1.02169$ (radian).<br/>2. Aralıkta $2\\cos x \\ge x^2$.<br/>3. $\\int_{-1.02169}^{1.02169}(2\\cos x - x^2)\\,dx \\approx 2.701$."
    }
  ]
};

window.APMEBERRA_SEVIYE["calculus-bc"] = {
  ders: "calculus-bc",
  ad: "AP Calculus BC",
  cedSurum: "CED (güncel, 2024-25 sonrası)",
  portalSayfasi: "ap-calculus.html",
  uniteler: [
    { no: "1", ad: "Limits and Continuity", sinavAgirligi: "5–10%", portaldaVar: true, portalCapa: "unit1-quiz-section" },
    { no: "2", ad: "Differentiation: Definition and Fundamental Properties", sinavAgirligi: "5–10%", portaldaVar: true, portalCapa: "unit2-quiz-section" },
    { no: "3", ad: "Differentiation: Composite, Implicit, and Inverse Functions", sinavAgirligi: "5–10%", portaldaVar: true, portalCapa: "unit3-quiz-section" },
    { no: "4", ad: "Contextual Applications of Differentiation", sinavAgirligi: "5–10%", portaldaVar: true, portalCapa: "unit4-quiz-section" },
    { no: "5", ad: "Analytical Applications of Differentiation", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "calc-unit5-quiz-section" },
    { no: "6", ad: "Integration and Accumulation of Change", sinavAgirligi: "15–20%", portaldaVar: true, portalCapa: "calc-unit6-lecture-section" },
    { no: "7", ad: "Differential Equations", sinavAgirligi: "5–10%", portaldaVar: true, portalCapa: "calc-unit7-lecture-section" },
    { no: "8", ad: "Applications of Integration", sinavAgirligi: "5–10%", portaldaVar: true, portalCapa: "calc-unit8-lecture-section" },
    { no: "9", ad: "Parametric Equations, Polar Coordinates, and Vector-Valued Functions", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "calc-unit9-lecture-section" },
    { no: "10", ad: "Infinite Sequences and Series", sinavAgirligi: "15–20%", portaldaVar: true, portalCapa: "calc-unit10-lecture-section" }
  ],
  sorular: [
    // ---------------- UNIT 1 ----------------
    {
      id: "sv_calcbc_u1_1",
      unite: "1",
      beceri: "Special trigonometric limit",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.8)",
      question: "Evaluate $\\displaystyle\\lim_{x \\to 0} \\frac{\\sin(5x)}{2x}$.",
      options: [
        { id: "A", text: "$\\frac{5}{2}$", isCorrect: true },
        { id: "B", text: "$1$", isCorrect: false, errorTag: "Kalıp Ezberi: $\\frac{\\sin(\\cdot)}{\\cdot} \\to 1$ kuralını katsayılara bakmadan uygulamak.", remediation: "$\\lim_{u \\to 0}\\frac{\\sin u}{u} = 1$ yalnızca pay ve paydadaki argüman aynıysa geçerlidir. $\\frac{\\sin 5x}{2x} = \\frac{5}{2}\\cdot\\frac{\\sin 5x}{5x}$." },
        { id: "C", text: "$\\frac{2}{5}$", isCorrect: false, errorTag: "Ters Oran: Katsayıları ters yerleştirmek.", remediation: "Paydayı $5x$ yapmak için $\\frac{5}{5}$ ile çarparız; dışarıda $\\frac{5}{2}$ kalır." },
        { id: "D", text: "$0$", isCorrect: false, errorTag: "Belirsiz Form Hatası: $\\sin 0 = 0$ olduğu için limiti $0$ sanmak.", remediation: "Payda da sıfıra gidiyor; $\\frac{0}{0}$ belirsizdir ve özel limit kullanılmalıdır." }
      ],
      generalRemediation: "Temel trigonometrik limit: $\\lim_{x \\to 0}\\frac{\\sin(ax)}{bx} = \\frac{a}{b}$ (Squeeze Theorem ile kanıtlanan $\\lim_{u\\to0}\\frac{\\sin u}{u} = 1$'den).",
      stepByStepSolution: "1. $\\frac{\\sin 5x}{2x} = \\frac{5}{2}\\cdot\\frac{\\sin 5x}{5x}$.<br/>2. $x \\to 0$ iken $\\frac{\\sin 5x}{5x} \\to 1$.<br/>3. Limit $\\frac{5}{2}$'dir."
    },
    {
      id: "sv_calcbc_u1_2",
      unite: "1",
      beceri: "Removing a discontinuity",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.13)",
      question: "Let $g(x) = \\frac{x^2 - x - 6}{x - 3}$ for $x \\ne 3$. What value should $g(3)$ be assigned so that $g$ is continuous at $x = 3$?",
      options: [
        { id: "A", text: "$0$", isCorrect: false, errorTag: "Belirsiz Form Hatası: $\\frac{0}{0} = 0$ kabul etmek.", remediation: "$\\frac{0}{0}$ bir sayı değildir; limit, pay çarpanlarına ayrıldıktan sonra bulunur." },
        { id: "B", text: "$5$", isCorrect: true },
        { id: "C", text: "$6$", isCorrect: false, errorTag: "Yarım Hesap: Yalnızca $x^2 - x$ ifadesini $x = 3$'te değerlendirmek.", remediation: "Pay $(x - 3)(x + 2)$ olarak çarpanlarına ayrılır; sadeleşme sonrası $x + 2$ kalır." },
        { id: "D", text: "No such value exists", isCorrect: false, errorTag: "Süreksizlik Türü Hatası: Removable discontinuity'yi vertical asymptote sanmak.", remediation: "Ortak çarpan $(x-3)$ sadeleştiği için süreksizlik <strong>removable</strong>'dır; limit vardır ve $g(3)$ ona eşitlenebilir." }
      ],
      generalRemediation: "<strong>Removable discontinuity</strong>: Limit var ama fonksiyon değeri yok ya da farklı. Süreklilik için $g(c) = \\lim_{x \\to c} g(x)$ tanımlanır.",
      stepByStepSolution: "1. $x^2 - x - 6 = (x - 3)(x + 2)$.<br/>2. $x \\ne 3$ için $g(x) = x + 2$.<br/>3. $\\lim_{x\\to3} g(x) = 5$; $g(3) = 5$ atanmalıdır."
    },
    {
      id: "sv_calcbc_u1_3",
      unite: "1",
      beceri: "Intermediate Value Theorem: guaranteed zeros",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.16)",
      question: "A function $f$ is continuous on $[1, 5]$ with $f(1) = 4$, $f(3) = -2$, and $f(5) = 6$. What is the minimum number of zeros that $f$ must have on $[1, 5]$?",
      options: [
        { id: "A", text: "$1$", isCorrect: false, errorTag: "Eksik Aralık: Yalnızca bir işaret değişimini saymak.", remediation: "$[1,3]$'te $4 \\to -2$ ve $[3,5]$'te $-2 \\to 6$: iki ayrı işaret değişimi, IVT ile iki ayrı sıfır." },
        { id: "B", text: "$0$", isCorrect: false, errorTag: "IVT'yi Uygulamamak: Fonksiyonun sıfırdan atlayabileceğini sanmak.", remediation: "Fonksiyon <strong>continuous</strong> olduğu için işaret değiştirdiği her aralıkta en az bir kez sıfırdan geçmek zorundadır." },
        { id: "C", text: "$2$", isCorrect: true },
        { id: "D", text: "$3$", isCorrect: false, errorTag: "Fazla Sayım: Tam sayı aralıklarına göre veya uç değerleri sayarak $3$ bulmak.", remediation: "IVT yalnızca işaret değişimi olan aralıklarda sıfır garanti eder; burada iki aralık var. Daha fazlası mümkün ama garanti değil." }
      ],
      generalRemediation: "<strong>Intermediate Value Theorem</strong>: $f$, $[a,b]$'de continuous ve $k$, $f(a)$ ile $f(b)$ arasında ise $f(c) = k$ olacak bir $c$ vardır. \"En az\" soruları her işaret değişim aralığını ayrı sayar.",
      stepByStepSolution: "1. $f$ continuous, $[1,3]$'te $f(1) = 4 \\gt 0 \\gt f(3) = -2$ ⟹ en az bir sıfır.<br/>2. $[3,5]$'te $f(3) \\lt 0 \\lt f(5)$ ⟹ en az bir sıfır daha.<br/>3. Aralıklar yalnızca $x = 3$'te kesişir ve $f(3) \\ne 0$; en az $2$ sıfır."
    },
    // ---------------- UNIT 2 ----------------
    {
      id: "sv_calcbc_u2_1",
      unite: "2",
      beceri: "Equation of a tangent line",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.2)",
      question: "What is the equation of the line tangent to $y = x^3 - 2x$ at $x = 2$?",
      options: [
        { id: "A", text: "$y = 12x - 20$", isCorrect: false, errorTag: "Türev Hatası: $-2x$ teriminin türevini unutup eğimi $12$ almak.", remediation: "$y' = 3x^2 - 2$; $x = 2$'de eğim $10$'dur." },
        { id: "B", text: "$y = 10x - 24$", isCorrect: false, errorTag: "İşaret Hatası: Nokta-eğim formunda $y + 4$ yazmak.", remediation: "Point-slope form: $y - y_1 = m(x - x_1)$; $y_1 = 4$ ise $y - 4 = 10(x - 2)$." },
        { id: "C", text: "$y = 10x + 4$", isCorrect: false, errorTag: "Form Hatası: $(x - 2)$ yerine $x$ yazmak.", remediation: "Doğru teğet noktasından geçmelidir: $x = 2$'de $y = 4$ vermelidir. $10(2) + 4 = 24 \\ne 4$." },
        { id: "D", text: "$y = 10x - 16$", isCorrect: true }
      ],
      generalRemediation: "Teğet doğrusu: nokta $(a, f(a))$, eğim $f'(a)$, denklem $y - f(a) = f'(a)(x - a)$. Kontrol: $x = a$ koyunca $f(a)$ çıkmalı.",
      stepByStepSolution: "1. $f(2) = 8 - 4 = 4$.<br/>2. $f'(x) = 3x^2 - 2 \\Rightarrow f'(2) = 10$.<br/>3. $y - 4 = 10(x - 2) \\Rightarrow y = 10x - 16$."
    },
    {
      id: "sv_calcbc_u2_2",
      unite: "2",
      beceri: "Differentiability and continuity",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.4)",
      question: "Let $f(x) = |x - 2| + 1$. Which of the following is true about $f$ at $x = 2$?",
      options: [
        { id: "A", text: "Continuous but not differentiable", isCorrect: true },
        { id: "B", text: "Differentiable but not continuous", isCorrect: false, errorTag: "Mantık Ters Çevirme: Differentiability'nin continuity gerektirdiğini unutmak.", remediation: "Differentiable ⟹ continuous. Bu yüzden \"differentiable ama continuous değil\" hiçbir zaman mümkün değildir." },
        { id: "C", text: "Both continuous and differentiable", isCorrect: false, errorTag: "Köşe Noktası Gözden Kaçtı: Mutlak değerin köşesini türevlenebilir sanmak.", remediation: "Sol türev $-1$, sağ türev $+1$; tek taraflı türevler eşit değil, $x = 2$'de <strong>corner</strong> var." },
        { id: "D", text: "Neither continuous nor differentiable", isCorrect: false, errorTag: "Süreklilik Hatası: Köşeyi süreksizlik sanmak.", remediation: "$\\lim_{x \\to 2} f(x) = 1 = f(2)$; grafik kopmuyor. Köşe süreksizlik değil, yalnızca türevlenemezliktir." }
      ],
      generalRemediation: "Türevlenemezlik nedenleri: <strong>corner</strong>, <strong>cusp</strong>, <strong>vertical tangent</strong> ve discontinuity. İlk üçünde fonksiyon continuous olabilir.",
      stepByStepSolution: "1. $\\lim_{x\\to2}(|x-2|+1) = 1 = f(2)$ ⟹ continuous.<br/>2. $x \\lt 2$'de eğim $-1$, $x \\gt 2$'de eğim $+1$.<br/>3. Tek taraflı türevler farklı ⟹ $x = 2$'de differentiable değil."
    },
    {
      id: "sv_calcbc_u2_3",
      unite: "2",
      beceri: "Product rule with tabular values",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.8)",
      question: "Differentiable functions $f$ and $g$ satisfy $f(1) = 2$, $f'(1) = -3$, and $g'(1) = 4$. If $h(x) = x^2 f(x) - 3g(x)$, what is $h'(1)$?",
      options: [
        { id: "A", text: "$-18$", isCorrect: false, errorTag: "Türevleri Çarpma: $(x^2 f)' = 2x \\cdot f'(x)$ sanmak.", remediation: "Product rule: $(uv)' = u'v + uv'$. $(x^2 f)' = 2x f(x) + x^2 f'(x)$." },
        { id: "B", text: "$-11$", isCorrect: true },
        { id: "C", text: "$-15$", isCorrect: false, errorTag: "Product Rule Eksikliği: $x^2$'yi sabit gibi tutup yalnızca $x^2 f'(x)$ almak.", remediation: "$x^2$ de $x$'e bağlıdır; $2x f(x)$ terimi ($= 4$) eksik kalıyor." },
        { id: "D", text: "$13$", isCorrect: false, errorTag: "İşaret Hatası: $-3g(x)$ teriminin türevini $+3g'(x)$ almak.", remediation: "Sabit çarpan kuralı işareti korur: $\\frac{d}{dx}[-3g(x)] = -3g'(x) = -12$." }
      ],
      generalRemediation: "<strong>Product rule</strong>: $(uv)' = u'v + uv'$. Tablo sorularında önce genel türevi sembolik yaz, sonra değerleri yerleştir.",
      stepByStepSolution: "1. $h'(x) = 2x f(x) + x^2 f'(x) - 3g'(x)$.<br/>2. $h'(1) = 2(1)(2) + (1)(-3) - 3(4)$.<br/>3. $h'(1) = 4 - 3 - 12 = -11$."
    },
    // ---------------- UNIT 3 ----------------
    {
      id: "sv_calcbc_u3_1",
      unite: "3",
      beceri: "Derivative of inverse trigonometric functions",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.4)",
      question: "What is $\\frac{d}{dx}\\left[\\arctan(2x)\\right]$?",
      options: [
        { id: "A", text: "$\\frac{1}{1 + 4x^2}$", isCorrect: false, errorTag: "Eksik Chain Rule: İç türev $2$'yi çarpmamak.", remediation: "$\\frac{d}{dx}\\arctan(u) = \\frac{u'}{1 + u^2}$; $u = 2x$, $u' = 2$." },
        { id: "B", text: "$\\frac{2}{1 + 2x^2}$", isCorrect: false, errorTag: "Kare Alma Hatası: $(2x)^2 = 2x^2$ yazmak.", remediation: "$(2x)^2 = 4x^2$; katsayının da karesi alınır." },
        { id: "C", text: "$\\frac{2}{1 + 4x^2}$", isCorrect: true },
        { id: "D", text: "$\\frac{2}{\\sqrt{1 - 4x^2}}$", isCorrect: false, errorTag: "Formül Karışıklığı: $\\arcsin$ türev formülünü kullanmak.", remediation: "$\\frac{d}{dx}\\arcsin u = \\frac{u'}{\\sqrt{1 - u^2}}$, $\\frac{d}{dx}\\arctan u = \\frac{u'}{1 + u^2}$. İkisini ayrı ezberle." }
      ],
      generalRemediation: "Ters trigonometrik türevler + chain rule: $\\frac{d}{dx}\\arctan(u) = \\frac{u'}{1 + u^2}$.",
      stepByStepSolution: "1. $u = 2x$, $u' = 2$.<br/>2. $\\frac{d}{dx}\\arctan(u) = \\frac{u'}{1 + u^2}$.<br/>3. Türev $\\frac{2}{1 + 4x^2}$'dir."
    },
    {
      id: "sv_calcbc_u3_2",
      unite: "3",
      beceri: "Second derivative by implicit differentiation",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.6)",
      question: "For the curve $x^2 + y^2 = 25$, what is the value of $\\frac{d^2y}{dx^2}$ at the point $(3, 4)$?",
      options: [
        { id: "A", text: "$-\\frac{3}{4}$", isCorrect: false, errorTag: "Mertebe Hatası: Birinci türevde durmak.", remediation: "$-\\frac{3}{4}$, $\\frac{dy}{dx}$ değeridir. İkinci türev için $\\frac{dy}{dx} = -\\frac{x}{y}$ tekrar türevlenmelidir." },
        { id: "B", text: "$-\\frac{1}{4}$", isCorrect: false, errorTag: "$y$'yi Sabit Saymak: $-\\frac{x}{y}$'yi türevlerken $y$'yi sabit tutmak.", remediation: "$y$, $x$'in fonksiyonudur; quotient rule'da $y'$ terimi çıkar: $\\frac{-y + xy'}{y^2}$." },
        { id: "C", text: "$-\\frac{7}{64}$", isCorrect: false, errorTag: "İşaret Hatası: Quotient rule payında $-y - xy'$ yazmak.", remediation: "$\\frac{d}{dx}\\left(-\\frac{x}{y}\\right) = -\\frac{y - xy'}{y^2} = \\frac{-y + xy'}{y^2}$; $xy'$ teriminin işareti artıdır." },
        { id: "D", text: "$-\\frac{25}{64}$", isCorrect: true }
      ],
      generalRemediation: "<strong>Implicit second derivative</strong>: $\\frac{dy}{dx}$'i bul, onu quotient rule ile tekrar türevle, çıkan $y'$ yerine $\\frac{dy}{dx}$ ifadesini koy.",
      stepByStepSolution: "1. $2x + 2yy' = 0 \\Rightarrow y' = -\\frac{x}{y}$; $(3,4)$'te $y' = -\\frac{3}{4}$.<br/>2. $y'' = \\frac{-y + xy'}{y^2} = \\frac{-4 + 3(-3/4)}{16} = \\frac{-25/4}{16}$.<br/>3. $y'' = -\\frac{25}{64}$."
    },
    {
      id: "sv_calcbc_u3_3",
      unite: "3",
      beceri: "Inverse function derivative inside a product",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.3)",
      question: "A differentiable, invertible function $f$ satisfies $f(2) = 5$, $f'(2) = 3$, and $f'(5) = -1$. Let $g = f^{-1}$ and $h(x) = x \\cdot g(x)$. What is $h'(5)$?",
      options: [
        { id: "A", text: "$\\frac{11}{3}$", isCorrect: true },
        { id: "B", text: "$-3$", isCorrect: false, errorTag: "Yanlış Nokta: $g'(5) = \\frac{1}{f'(5)}$ kullanmak.", remediation: "$g'(5) = \\frac{1}{f'(g(5))} = \\frac{1}{f'(2)} = \\frac{1}{3}$. $f'(5)$ bu soruda tuzak bilgidir." },
        { id: "C", text: "$17$", isCorrect: false, errorTag: "Ters Alma Unutuldu: $g'(5) = f'(2) = 3$ kullanmak.", remediation: "Ters fonksiyonun türevi $\\frac{1}{f'(g(5))}$'tir; $f'(2)$'nin kendisi değil." },
        { id: "D", text: "$\\frac{5}{3}$", isCorrect: false, errorTag: "Product Rule Eksikliği: $g(5)$ terimini unutmak.", remediation: "$h'(x) = 1 \\cdot g(x) + x \\cdot g'(x)$; $g(5) = 2$ terimi eklenmelidir." }
      ],
      generalRemediation: "Bileşik sorularda kuralları sırayla uygula: önce product rule ile genel $h'$, sonra $g(5)$ ve $g'(5) = \\frac{1}{f'(g(5))}$ değerleri.",
      stepByStepSolution: "1. $f(2) = 5 \\Rightarrow g(5) = 2$ ve $g'(5) = \\frac{1}{f'(2)} = \\frac{1}{3}$.<br/>2. $h'(x) = g(x) + xg'(x)$.<br/>3. $h'(5) = 2 + 5 \\cdot \\frac{1}{3} = \\frac{11}{3}$."
    },
    // ---------------- UNIT 4 ----------------
    {
      id: "sv_calcbc_u4_1",
      unite: "4",
      beceri: "Speeding up or slowing down",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.2)",
      question: "A particle moves along a line with velocity $v(t) = t^2 - 4t + 3$. At $t = 2.5$, which statement is true?",
      options: [
        { id: "A", text: "Speeding up, because $a(2.5) \\gt 0$", isCorrect: false, errorTag: "Tek İşaret Hatası: Yalnızca ivmenin işaretine bakmak.", remediation: "Hızlanma/yavaşlama <strong>v ve a'nın işaretlerinin karşılaştırılmasıyla</strong> belirlenir; tek başına $a \\gt 0$ yetmez." },
        { id: "B", text: "Slowing down: $v(2.5)$, $a(2.5)$ differ in sign", isCorrect: true },
        { id: "C", text: "Speeding up, because $v(2.5) \\lt 0$", isCorrect: false, errorTag: "Velocity = Speed Karışıklığı: Negatif hızı hızlanma sanmak.", remediation: "Negatif velocity yalnızca sola hareket demektir. Speed $|v|$'nin artıp artmadığı $v$ ve $a$ işaretleriyle anlaşılır." },
        { id: "D", text: "The particle is at rest", isCorrect: false, errorTag: "Kök Karışıklığı: $v = 0$ noktalarını ($t = 1, 3$) $t = 2.5$ ile karıştırmak.", remediation: "$v(2.5) = -0.75 \\ne 0$; parçacık hareket hâlindedir." }
      ],
      generalRemediation: "<strong>Speed</strong> artıyor ⟺ $v$ ve $a$ aynı işaretli; azalıyor ⟺ zıt işaretli.",
      stepByStepSolution: "1. $v(2.5) = 6.25 - 10 + 3 = -0.75 \\lt 0$.<br/>2. $a(t) = 2t - 4 \\Rightarrow a(2.5) = 1 \\gt 0$.<br/>3. İşaretler zıt ⟹ parçacık yavaşlıyor (slowing down)."
    },
    {
      id: "sv_calcbc_u4_2",
      unite: "4",
      beceri: "Local linear approximation",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.6)",
      question: "Using the tangent line to $f(x) = \\sqrt{x}$ at $x = 16$, what is the approximation of $\\sqrt{16.4}$?",
      options: [
        { id: "A", text: "$4.1$", isCorrect: false, errorTag: "Türev Hatası: $f'(16) = \\frac{1}{4}$ almak ($\\frac{1}{2\\sqrt{x}}$ yerine $\\frac{1}{\\sqrt{x}}$).", remediation: "$f'(x) = \\frac{1}{2\\sqrt{x}}$; $x = 16$'da $\\frac{1}{8}$." },
        { id: "B", text: "$4.4$", isCorrect: false, errorTag: "Eğim Unutuldu: $\\Delta x$'i doğrudan $f(16)$'ya eklemek.", remediation: "Linearization: $L(x) = f(a) + f'(a)(x - a)$; $\\Delta x = 0.4$ eğimle çarpılmalıdır." },
        { id: "C", text: "$4.05$", isCorrect: true },
        { id: "D", text: "$4.025$", isCorrect: false, errorTag: "Türev Hatası: $f'(16) = \\frac{1}{16}$ almak.", remediation: "$\\frac{1}{2\\sqrt{16}} = \\frac{1}{8}$, $\\frac{1}{16}$ değil; $\\sqrt{16} = 4$ ve $2 \\cdot 4 = 8$." }
      ],
      generalRemediation: "<strong>Local linear approximation</strong>: $f(x) \\approx f(a) + f'(a)(x - a)$, $x$ değeri $a$'ya yakınken.",
      stepByStepSolution: "1. $f(16) = 4$, $f'(16) = \\frac{1}{8}$.<br/>2. $L(16.4) = 4 + \\frac{1}{8}(0.4)$.<br/>3. $L(16.4) = 4.05$ (gerçek değer $\\approx 4.0497$)."
    },
    {
      id: "sv_calcbc_u4_3",
      unite: "4",
      beceri: "Related rates: conical tank",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.5)",
      question: "Water drains from an inverted conical tank at $2 \\text{ m}^3/\\text{min}$. The tank has height $6$ m and top radius $3$ m. How fast is the water level changing, in m/min, when the water is $4$ m deep? $\\left(V = \\frac{1}{3}\\pi r^2 h\\right)$",
      options: [
        { id: "A", text: "$-\\frac{3}{2\\pi}$", isCorrect: false, errorTag: "Sabit Yarıçap Hatası: $r = 2$'yi türev almadan önce sabit yerleştirmek.", remediation: "Su derinliği değiştikçe $r$ de değişir. Önce $r = \\frac{h}{2}$ ile $V$'yi yalnızca $h$ cinsinden yaz, sonra türevle." },
        { id: "B", text: "$\\frac{1}{2\\pi}$", isCorrect: false, errorTag: "İşaret Hatası: Boşalma hızını $+2$ almak.", remediation: "Tank boşaldığı için $\\frac{dV}{dt} = -2$; seviye de düşer, $\\frac{dh}{dt} \\lt 0$." },
        { id: "C", text: "$-\\frac{1}{32\\pi}$", isCorrect: false, errorTag: "Benzerlik Oranı Ters: $r = 2h$ yazmak.", remediation: "Benzer üçgenler: $\\frac{r}{h} = \\frac{3}{6} = \\frac{1}{2}$, yani $r = \\frac{h}{2}$." },
        { id: "D", text: "$-\\frac{1}{2\\pi}$", isCorrect: true }
      ],
      generalRemediation: "Koni related rates sorularında benzer üçgenlerle bir değişkeni ele (burada $r$), sonra zamana göre türev al; anlık değerleri en son koy.",
      stepByStepSolution: "1. $r = \\frac{h}{2} \\Rightarrow V = \\frac{\\pi}{12}h^3$.<br/>2. $\\frac{dV}{dt} = \\frac{\\pi}{4}h^2\\frac{dh}{dt}$; $h = 4$: $-2 = 4\\pi\\frac{dh}{dt}$.<br/>3. $\\frac{dh}{dt} = -\\frac{1}{2\\pi} \\text{ m/min}$."
    },
    // ---------------- UNIT 5 ----------------
    {
      id: "sv_calcbc_u5_1",
      unite: "5",
      beceri: "Points of inflection from f''",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.6)",
      question: "The second derivative of $f$ is $f''(x) = x^2(x - 3)$. At which $x$-values does the graph of $f$ have a point of inflection?",
      options: [
        { id: "A", text: "$x = 3$ only", isCorrect: true },
        { id: "B", text: "$x = 0$ and $x = 3$", isCorrect: false, errorTag: "Sıfır = Büküm Yanılgısı: $f'' = 0$ olan her noktayı inflection saymak.", remediation: "Inflection point için $f''$ <strong>işaret değiştirmelidir</strong>. $x^2 \\ge 0$ olduğundan $x = 0$'ın iki yanında $f'' \\lt 0$." },
        { id: "C", text: "$x = 0$ only", isCorrect: false, errorTag: "Kök Seçim Hatası: Çift katlı kökü seçip tek katlıyı atlamak.", remediation: "Tek katlı kök ($x = 3$) işaret değişimi yaratır; çift katlı kök ($x = 0$) yaratmaz." },
        { id: "D", text: "There are none", isCorrect: false, errorTag: "Analiz Eksikliği: İşaret tablosu kurmadan sonuç çıkarmak.", remediation: "$x \\lt 3$'te $f'' \\lt 0$ (concave down), $x \\gt 3$'te $f'' \\gt 0$ (concave up): $x = 3$'te concavity değişir." }
      ],
      generalRemediation: "Point of inflection: concavity değişir ⟺ $f''$ işaret değiştirir. $f'' = 0$ tek başına yeterli değildir.",
      stepByStepSolution: "1. $f'' = 0$: $x = 0$ (çift katlı), $x = 3$.<br/>2. İşaret: $x \\lt 0$: $-$; $0 \\lt x \\lt 3$: $-$; $x \\gt 3$: $+$.<br/>3. Yalnızca $x = 3$'te işaret değişimi var."
    },
    {
      id: "sv_calcbc_u5_2",
      unite: "5",
      beceri: "Candidates Test for absolute extrema",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.5)",
      question: "What is the absolute maximum value of $f(x) = 2x^3 - 3x^2 - 12x + 1$ on the closed interval $[-2, 3]$?",
      options: [
        { id: "A", text: "$-3$", isCorrect: false, errorTag: "Kritik Nokta Atlandı: Yalnızca sol uç $f(-2)$'yi değerlendirmek.", remediation: "<strong>Candidates Test</strong>: Uç noktalar <strong>ve</strong> kritik noktalar ($x = -1, 2$) birlikte değerlendirilir." },
        { id: "B", text: "$8$", isCorrect: true },
        { id: "C", text: "$-8$", isCorrect: false, errorTag: "Uç Nokta Yanılgısı: Maksimumun sağ uçta olduğunu varsaymak.", remediation: "$f(3) = -8$ yalnızca bir aday; $f(-1) = 8$ daha büyük." },
        { id: "D", text: "$-1$", isCorrect: false, errorTag: "Konum/Değer Karışıklığı: Maksimumun $x$-koordinatını yazmak.", remediation: "Soru maksimum <strong>değeri</strong>, yani $f(-1) = 8$'i istiyor; $x = -1$ konumdur." }
      ],
      generalRemediation: "<strong>Extreme Value Theorem</strong> + <strong>Candidates Test</strong>: Kapalı aralıkta continuous fonksiyonun mutlak ekstremumları kritik noktalarda veya uçlarda oluşur; hepsini tabloya koy.",
      stepByStepSolution: "1. $f'(x) = 6x^2 - 6x - 12 = 6(x - 2)(x + 1) \\Rightarrow x = -1, 2$.<br/>2. $f(-2) = -3$, $f(-1) = 8$, $f(2) = -19$, $f(3) = -8$.<br/>3. Mutlak maksimum değer $8$ ($x = -1$'de)."
    },
    {
      id: "sv_calcbc_u5_3",
      unite: "5",
      beceri: "Optimization: inscribed rectangle",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.11)",
      question: "A rectangle has its base on the $x$-axis and its two upper vertices on the parabola $y = 12 - x^2$. What is the maximum possible area of the rectangle?",
      options: [
        { id: "A", text: "$16$", isCorrect: false, errorTag: "Genişlik Hatası: Taban genişliğini $2x$ yerine $x$ almak.", remediation: "Simetrik dikdörtgenin köşeleri $(-x, 0)$ ve $(x, 0)$'dır; taban $2x$. $A = 2x(12 - x^2)$." },
        { id: "B", text: "$8$", isCorrect: false, errorTag: "Yanlış Nicelik: Optimum yüksekliği ($12 - 4$) alan sanmak.", remediation: "$x = 2$'de yükseklik $8$'dir; alan $= \\text{taban} \\times \\text{yükseklik} = 4 \\cdot 8$." },
        { id: "C", text: "$32$", isCorrect: true },
        { id: "D", text: "$4$", isCorrect: false, errorTag: "Yanlış Nicelik: Optimum taban genişliğini ($2x$) alan sanmak.", remediation: "Optimizasyonda soru hangi niceliği istiyorsa onu raporla; burada maksimum <strong>alan</strong>." }
      ],
      generalRemediation: "<strong>Optimization</strong>: (1) amaç fonksiyonunu tek değişkenle yaz, (2) türevi sıfırla, (3) maksimumu doğrula (sign chart veya Candidates Test), (4) istenen niceliği raporla.",
      stepByStepSolution: "1. $A(x) = 2x(12 - x^2) = 24x - 2x^3$, $0 \\lt x \\lt \\sqrt{12}$.<br/>2. $A'(x) = 24 - 6x^2 = 0 \\Rightarrow x = 2$; $A'$ burada $+$'dan $-$'ye geçer.<br/>3. $A(2) = 4 \\cdot 8 = 32$."
    },
    // ---------------- UNIT 6 ----------------
    {
      id: "sv_calcbc_u6_1",
      unite: "6",
      beceri: "Integration by u-substitution",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.9)",
      question: "Find $\\displaystyle\\int x e^{x^2}\\,dx$.",
      options: [
        { id: "A", text: "$e^{x^2} + C$", isCorrect: false, errorTag: "Katsayı Unutuldu: $du = 2x\\,dx$'teki $2$'yi telafi etmemek.", remediation: "$u = x^2$, $du = 2x\\,dx \\Rightarrow x\\,dx = \\frac{1}{2}du$. Sonuç $\\frac{1}{2}e^{x^2} + C$." },
        { id: "B", text: "$\\frac{x^2}{2}e^{x^2} + C$", isCorrect: false, errorTag: "Parçalı Antitürev: Çarpanları ayrı ayrı integrallemek.", remediation: "Çarpımın integrali, integrallerin çarpımı değildir. Türevi $x\\,e^{x^2}$ vermediğini kontrol et." },
        { id: "C", text: "$2xe^{x^2} + C$", isCorrect: false, errorTag: "Yön Hatası: Antitürev yerine türev almak.", remediation: "İntegral türevin tersidir; sonucun türevi integrandı vermelidir." },
        { id: "D", text: "$\\frac{1}{2}e^{x^2} + C$", isCorrect: true }
      ],
      generalRemediation: "<strong>u-substitution</strong>: İç fonksiyonu $u$ seç, $du$'yu hesapla, eksik sabitleri düzelt. Kontrol: sonucun türevi integranda eşit olmalı.",
      stepByStepSolution: "1. $u = x^2$, $du = 2x\\,dx$.<br/>2. $\\int xe^{x^2}dx = \\frac{1}{2}\\int e^u\\,du$.<br/>3. $= \\frac{1}{2}e^{x^2} + C$."
    },
    {
      id: "sv_calcbc_u6_2",
      unite: "6",
      beceri: "[BC] Integration by parts",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.11, BC only)",
      question: "<strong>[BC ONLY]</strong> Evaluate $\\displaystyle\\int_0^1 x e^{x}\\,dx$.",
      options: [
        { id: "A", text: "$1$", isCorrect: true },
        { id: "B", text: "$e - 1$", isCorrect: false, errorTag: "Eksik Terim: $x$ çarpanını yok sayıp $\\int_0^1 e^x\\,dx$ hesaplamak.", remediation: "Integration by parts: $\\int u\\,dv = uv - \\int v\\,du$, $u = x$, $dv = e^x dx$." },
        { id: "C", text: "$e$", isCorrect: false, errorTag: "Yarım IBP: Yalnızca $uv = xe^x$ terimini değerlendirmek.", remediation: "$uv$'den sonra $-\\int v\\,du = -\\int e^x dx$ terimi de çıkarılmalıdır." },
        { id: "D", text: "$2e - 1$", isCorrect: false, errorTag: "İşaret Hatası: $uv - \\int v\\,du$ yerine $uv + \\int v\\,du$ yazmak.", remediation: "Formül eksi işaretlidir: $xe^x - e^x$. Kontrol: $\\frac{d}{dx}(xe^x - e^x) = xe^x$." }
      ],
      generalRemediation: "<strong>Integration by parts</strong>: $\\int u\\,dv = uv - \\int v\\,du$. $u$'yu LIATE sırasına göre seç (cebirsel $x$ genelde $u$).",
      stepByStepSolution: "1. $u = x$, $dv = e^x dx \\Rightarrow du = dx$, $v = e^x$.<br/>2. $\\int xe^x dx = xe^x - e^x$.<br/>3. $[xe^x - e^x]_0^1 = (e - e) - (0 - 1) = 1$."
    },
    {
      id: "sv_calcbc_u6_3",
      unite: "6",
      beceri: "[BC] Partial fraction decomposition",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.12, BC only)",
      question: "<strong>[BC ONLY]</strong> Evaluate $\\displaystyle\\int_2^3 \\frac{1}{x^2 - 1}\\,dx$.",
      options: [
        { id: "A", text: "$\\ln\\frac{3}{2}$", isCorrect: false, errorTag: "Katsayı Unutuldu: Kısmi kesirlerdeki $\\frac{1}{2}$ katsayısını atlamak.", remediation: "$\\frac{1}{x^2 - 1} = \\frac{1/2}{x - 1} - \\frac{1/2}{x + 1}$; $A$ ve $B$ katsayıları $\\pm\\frac{1}{2}$'dir." },
        { id: "B", text: "$\\frac{1}{2}\\ln\\frac{3}{2}$", isCorrect: true },
        { id: "C", text: "$\\frac{1}{2}\\ln\\frac{2}{3}$", isCorrect: false, errorTag: "Logaritma Sırası Hatası: Sınırları ters yerleştirmek.", remediation: "$F(3) - F(2)$: $\\frac{1}{2}\\left[\\ln\\frac{1}{2} - \\ln\\frac{1}{3}\\right] = \\frac{1}{2}\\ln\\frac{3}{2} \\gt 0$. Pozitif integrand pozitif integral verir." },
        { id: "D", text: "$\\ln\\frac{8}{3}$", isCorrect: false, errorTag: "Yanlış Kalıp: $\\int\\frac{1}{g(x)}dx = \\ln|g(x)|$ sanmak.", remediation: "$\\ln|g(x)|$ yalnızca payda $g'(x)$ varken çıkar. Burada pay sabit; partial fractions gerekir." }
      ],
      generalRemediation: "<strong>Partial fractions</strong>: Doğrusal çarpanlı paydayı $\\frac{A}{x - a} + \\frac{B}{x - b}$ biçimine ayır; her terim bir $\\ln$ verir.",
      stepByStepSolution: "1. $\\frac{1}{(x-1)(x+1)} = \\frac{1}{2}\\left(\\frac{1}{x-1} - \\frac{1}{x+1}\\right)$.<br/>2. Antitürev: $\\frac{1}{2}\\ln\\left|\\frac{x - 1}{x + 1}\\right|$.<br/>3. $\\frac{1}{2}\\left[\\ln\\frac{2}{4} - \\ln\\frac{1}{3}\\right] = \\frac{1}{2}\\ln\\frac{3}{2}$."
    },
    // ---------------- UNIT 7 ----------------
    {
      id: "sv_calcbc_u7_1",
      unite: "7",
      beceri: "Slope fields: slope at a point",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.3)",
      question: "In the slope field for $\\frac{dy}{dx} = x - y$, what is the slope of the segment drawn at the point $(2, 3)$?",
      options: [
        { id: "A", text: "$1$", isCorrect: false, errorTag: "Sıra Hatası: $y - x$ hesaplamak.", remediation: "Formül $x - y$'dir: $2 - 3 = -1$. Koordinatların yerini karıştırma." },
        { id: "B", text: "$5$", isCorrect: false, errorTag: "İşlem Hatası: $x + y$ hesaplamak.", remediation: "DE çıkarma içerir: $\\frac{dy}{dx} = x - y$." },
        { id: "C", text: "$-1$", isCorrect: true },
        { id: "D", text: "$0$", isCorrect: false, errorTag: "Kavram Hatası: Slope field'da eğimin hep $0$ veya noktadan bağımsız olduğunu sanmak.", remediation: "Her noktadaki eğim, DE'ye o noktanın koordinatları konarak bulunur." }
      ],
      generalRemediation: "<strong>Slope field</strong>: Her $(x, y)$ noktasında, eğimi $\\frac{dy}{dx}$ formülüne koyarak bulunan küçük bir doğru parçası çizilir.",
      stepByStepSolution: "1. $x = 2$, $y = 3$.<br/>2. $\\frac{dy}{dx} = 2 - 3$.<br/>3. Eğim $-1$'dir."
    },
    {
      id: "sv_calcbc_u7_2",
      unite: "7",
      beceri: "[BC] Euler's method",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.5, BC only)",
      question: "<strong>[BC ONLY]</strong> Let $y = f(x)$ be the solution to $\\frac{dy}{dx} = 2x - y$ with $f(1) = 3$. Starting at $x = 1$, use Euler's method with step size $\\Delta x = 0.5$ to approximate $f(2)$.",
      options: [
        { id: "A", text: "$2$", isCorrect: false, errorTag: "Adım Sayısı Hatası: Tek adım ($\\Delta x = 1$) kullanmak.", remediation: "$\\Delta x = 0.5$ ile $x = 1$'den $x = 2$'ye iki adım gerekir. Her adımda eğim yeni noktada yeniden hesaplanır." },
        { id: "B", text: "$3.75$", isCorrect: false, errorTag: "İşaret Hatası: Eğimi $y - 2x$ olarak hesaplamak.", remediation: "DE $\\frac{dy}{dx} = 2x - y$'dir; $(1, 3)$'te eğim $2 - 3 = -1$, yani ilk adımda $y$ azalır." },
        { id: "C", text: "$2.75$", isCorrect: true },
        { id: "D", text: "$2.25$", isCorrect: false, errorTag: "$x$ Güncellenmedi: İkinci adımda eğimi $x = 1$ ile hesaplamak.", remediation: "İkinci adımın eğimi yeni noktada, yani $(1.5, 2.5)$'te hesaplanır: $2(1.5) - 2.5 = 0.5$." }
      ],
      generalRemediation: "<strong>Euler's method</strong>: $(x_0, y_0)$'dan başla; $y_{n+1} = y_n + \\left(\\frac{dy}{dx}\\right)_{(x_n, y_n)}\\Delta x$ ve $x_{n+1} = x_n + \\Delta x$. Tabloyla adım adım ilerle.",
      stepByStepSolution: "1. $(1, 3)$'te eğim $2(1) - 3 = -1$ ⟹ $y(1.5) \\approx 3 + (-1)(0.5) = 2.5$.<br/>2. $(1.5, 2.5)$'te eğim $3 - 2.5 = 0.5$ ⟹ $y(2) \\approx 2.5 + 0.5(0.5)$.<br/>3. $f(2) \\approx 2.75$."
    },
    {
      id: "sv_calcbc_u7_3",
      unite: "7",
      beceri: "[BC] Logistic growth: limit and fastest growth",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.9, BC only)",
      question: "<strong>[BC ONLY]</strong> A population satisfies $\\frac{dP}{dt} = 0.3P\\left(1 - \\frac{P}{800}\\right)$ with $P(0) = 200$. Which statement is true?",
      options: [
        { id: "A", text: "Fastest growth at $P = 400$; $\\lim_{t\\to\\infty} P = 800$", isCorrect: true },
        { id: "B", text: "Fastest growth at $P = 800$; $\\lim_{t\\to\\infty} P = 800$", isCorrect: false, errorTag: "Maksimum Konumu Hatası: En hızlı büyümeyi taşıma kapasitesinde sanmak.", remediation: "$P = 800$'de $\\frac{dP}{dt} = 0$; büyüme durur. $\\frac{dP}{dt}$, $P$'nin ikinci dereceden fonksiyonudur ve tepe noktası $\\frac{M}{2}$'dir." },
        { id: "C", text: "Fastest growth at $P = 200$; $\\lim_{t\\to\\infty} P = 400$", isCorrect: false, errorTag: "Başlangıç Koşulu Karışıklığı: $P(0)$'ı belirleyici sanmak.", remediation: "Limit başlangıç değerinden bağımsızdır ($0 \\lt P(0)$ olduğu sürece): carrying capacity $M = 800$." },
        { id: "D", text: "Fastest growth at $P = 400$; $\\lim_{t\\to\\infty} P = \\infty$", isCorrect: false, errorTag: "Model Karışıklığı: Logistic modeli exponential gibi yorumlamak.", remediation: "$\\left(1 - \\frac{P}{800}\\right)$ çarpanı büyümeyi frenler; $P$, $800$'e yaklaşır ama aşmaz." }
      ],
      generalRemediation: "<strong>Logistic model</strong> $\\frac{dP}{dt} = kP\\left(1 - \\frac{P}{M}\\right)$: $\\lim P = M$ (eğer $P(0) \\gt 0$) ve en hızlı büyüme $P = \\frac{M}{2}$'de (inflection point).",
      stepByStepSolution: "1. $M = 800$ ve $P(0) = 200 \\gt 0$ ⟹ $\\lim_{t\\to\\infty} P = 800$.<br/>2. $\\frac{dP}{dt} = 0.3P - \\frac{0.3}{800}P^2$ parabolünün tepe noktası $P = 400$.<br/>3. En hızlı büyüme $P = 400$'de, limit $800$."
    },
    // ---------------- UNIT 8 ----------------
    {
      id: "sv_calcbc_u8_1",
      unite: "8",
      beceri: "Total distance vs. displacement",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 8.2)",
      question: "A particle moves along a line with velocity $v(t) = t - 2$ for $0 \\le t \\le 4$. What is the total distance traveled by the particle over this interval?",
      options: [
        { id: "A", text: "$0$", isCorrect: false, errorTag: "Displacement Karışıklığı: $\\int_0^4 v(t)\\,dt$ hesaplamak.", remediation: "$\\int v\\,dt$ net yer değiştirmedir (displacement). Total distance $\\int |v(t)|\\,dt$'dir." },
        { id: "B", text: "$4$", isCorrect: true },
        { id: "C", text: "$2$", isCorrect: false, errorTag: "Yarım Aralık: Yalnızca bir yöndeki hareketi saymak.", remediation: "Parçacık $[0,2]$'de sola $2$, $[2,4]$'te sağa $2$ birim gider; iki yön toplanır." },
        { id: "D", text: "$8$", isCorrect: false, errorTag: "Hız Değeri Karışıklığı: $v(4) \\cdot 4$ veya $\\int t\\,dt$ hesaplamak.", remediation: "Sabit olmayan hız için mesafe, $|v(t)|$'nin integralidir; tek bir anlık hızla çarpılmaz." }
      ],
      generalRemediation: "Displacement $= \\int_a^b v(t)\\,dt$; total distance $= \\int_a^b |v(t)|\\,dt$. $v$'nin işaret değiştirdiği noktalarda integrali böl.",
      stepByStepSolution: "1. $v = 0$ at $t = 2$.<br/>2. $\\int_0^2 |t - 2|\\,dt = 2$, $\\int_2^4 |t - 2|\\,dt = 2$.<br/>3. Total distance $= 4$."
    },
    {
      id: "sv_calcbc_u8_2",
      unite: "8",
      beceri: "[BC] Arc length of a curve (calculator)",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 8.13, BC only) — calculator active",
      question: "<strong>[BC ONLY] Graphing calculator required.</strong> What is the arc length of the graph of $y = \\sin x$ from $x = 0$ to $x = \\pi$?",
      options: [
        { id: "A", text: "$4.712$", isCorrect: false, errorTag: "Karekök Unutuldu: $\\int (1 + \\cos^2 x)\\,dx$ hesaplamak.", remediation: "Arc length $= \\int_a^b \\sqrt{1 + [f'(x)]^2}\\,dx$; integrand karekök içindedir." },
        { id: "B", text: "$3.142$", isCorrect: false, errorTag: "Kiriş Uzunluğu: Uç noktalar arası düz mesafeyi almak.", remediation: "$(0,0)$ ile $(\\pi, 0)$ arası düz mesafe $\\pi$'dir; eğri bundan daha uzundur." },
        { id: "C", text: "$2.000$", isCorrect: false, errorTag: "Kavram Karışıklığı: Eğri altındaki alanı ($\\int_0^\\pi \\sin x\\,dx$) hesaplamak.", remediation: "Alan ile yay uzunluğu farklıdır; yay uzunluğu için $\\sqrt{1 + (y')^2}$ integrali gerekir." },
        { id: "D", text: "$3.820$", isCorrect: true }
      ],
      generalRemediation: "<strong>Arc length</strong>: $L = \\int_a^b \\sqrt{1 + [f'(x)]^2}\\,dx$. Çoğu integrand elementer antitürev vermez; hesap makinesiyle numerik hesapla.",
      stepByStepSolution: "1. $f'(x) = \\cos x$.<br/>2. $L = \\int_0^\\pi \\sqrt{1 + \\cos^2 x}\\,dx$.<br/>3. Numerik integral (radian): $L \\approx 3.820$."
    },
    {
      id: "sv_calcbc_u8_3",
      unite: "8",
      beceri: "Volume by disc method (calculator)",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 8.9) — calculator active",
      question: "<strong>Graphing calculator required.</strong> The region bounded by $y = e^{-x^2}$, the $x$-axis, $x = 0$, and $x = 1$ is revolved about the $x$-axis. What is the volume of the resulting solid?",
      options: [
        { id: "A", text: "$2.654$", isCorrect: false, errorTag: "Üs Kuralı Hatası: $(e^{-x^2})^2 = e^{-x^4}$ yazmak.", remediation: "$(e^{a})^2 = e^{2a}$; yani $(e^{-x^2})^2 = e^{-2x^2}$. Üs ikiyle çarpılır, kare alınmaz." },
        { id: "B", text: "$1.752$", isCorrect: false, errorTag: "Kare Yeri Hatası: $\\pi\\left(\\int_0^1 e^{-x^2}dx\\right)^2$ hesaplamak.", remediation: "Disc method'da her diskin yarıçapının karesi alınır, integralin karesi değil: $\\pi\\int R^2\\,dx$." },
        { id: "C", text: "$1.986$", isCorrect: false, errorTag: "Yöntem/Eksen Karışıklığı: Shell yöntemini $y$-ekseni etrafında uygulamak.", remediation: "$2\\pi\\int x\\,f(x)\\,dx$ $y$-ekseni etrafındaki dönme hacmidir. Soru $x$-ekseni etrafında; disc method kullan." },
        { id: "D", text: "$1.879$", isCorrect: true }
      ],
      generalRemediation: "<strong>Disc method</strong> ($x$-ekseni etrafında): $V = \\pi\\int_a^b [f(x)]^2\\,dx$. Antitürevi olmayan integrandlarda numerik integral kullan.",
      stepByStepSolution: "1. $R(x) = e^{-x^2}$, $R^2 = e^{-2x^2}$.<br/>2. $V = \\pi\\int_0^1 e^{-2x^2}\\,dx$.<br/>3. Numerik integral: $V \\approx 1.879$."
    },
    // ---------------- UNIT 9 ----------------
    {
      id: "sv_calcbc_u9_1",
      unite: "9",
      beceri: "[BC] Derivative of a parametric curve",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 9.1, BC only)",
      question: "<strong>[BC ONLY]</strong> A curve is defined by $x(t) = t^2$ and $y(t) = t^3 - 3t$. What is $\\frac{dy}{dx}$ at $t = 2$?",
      options: [
        { id: "A", text: "$\\frac{9}{4}$", isCorrect: true },
        { id: "B", text: "$\\frac{4}{9}$", isCorrect: false, errorTag: "Ters Oran: $\\frac{dx/dt}{dy/dt}$ hesaplamak.", remediation: "$\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt}$; pay $y$'nin türevidir." },
        { id: "C", text: "$9$", isCorrect: false, errorTag: "Eksik Bölme: Yalnızca $\\frac{dy}{dt}$ değerini yazmak.", remediation: "$\\frac{dy}{dt}$, $t$'ye göre değişimdir; $x$'e göre eğim için $\\frac{dx}{dt}$'ye bölünmelidir." },
        { id: "D", text: "$4$", isCorrect: false, errorTag: "Yanlış Türev: Yalnızca $\\frac{dx}{dt}$ değerini yazmak.", remediation: "Eğim, dikey değişimin yatay değişime oranıdır: $\\frac{9}{4}$." }
      ],
      generalRemediation: "<strong>Parametric derivative</strong>: $\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt}$ (eğer $\\frac{dx}{dt} \\ne 0$).",
      stepByStepSolution: "1. $\\frac{dx}{dt} = 2t = 4$.<br/>2. $\\frac{dy}{dt} = 3t^2 - 3 = 9$.<br/>3. $\\frac{dy}{dx} = \\frac{9}{4}$."
    },
    {
      id: "sv_calcbc_u9_2",
      unite: "9",
      beceri: "[BC] Area enclosed by a polar curve",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 9.8, BC only)",
      question: "<strong>[BC ONLY]</strong> What is the area of the region enclosed by the polar curve $r = 4\\sin\\theta$?",
      options: [
        { id: "A", text: "$8\\pi$", isCorrect: false, errorTag: "Çift Sayım veya $\\frac{1}{2}$ Unutuldu: $[0, 2\\pi]$'de integral almak ya da $\\frac{1}{2}$ çarpanını atlamak.", remediation: "$r = 4\\sin\\theta$ çemberi $0 \\le \\theta \\le \\pi$'de bir kez çizilir. Polar alan: $\\frac{1}{2}\\int r^2\\,d\\theta$." },
        { id: "B", text: "$4\\pi$", isCorrect: true },
        { id: "C", text: "$16\\pi$", isCorrect: false, errorTag: "Yarıçap Hatası: $r = 4$'ü çemberin yarıçapı sanmak.", remediation: "$r = 4\\sin\\theta$ çemberinin <strong>çapı</strong> $4$'tür; yarıçap $2$, alan $4\\pi$." },
        { id: "D", text: "$2\\pi$", isCorrect: false, errorTag: "Eksik Aralık: Yalnızca $[0, \\frac{\\pi}{2}]$'de integral almak.", remediation: "$[0, \\frac{\\pi}{2}]$ çemberin yalnızca sağ yarısını çizer; tam çember için $[0, \\pi]$ gerekir." }
      ],
      generalRemediation: "<strong>Polar area</strong>: $A = \\frac{1}{2}\\int_\\alpha^\\beta r^2\\,d\\theta$. Önce eğrinin tam olarak bir kez çizildiği $\\theta$ aralığını belirle.",
      stepByStepSolution: "1. Eğri $0 \\le \\theta \\le \\pi$'de bir kez çizilir.<br/>2. $A = \\frac{1}{2}\\int_0^\\pi 16\\sin^2\\theta\\,d\\theta = 8 \\cdot \\frac{\\pi}{2}$.<br/>3. $A = 4\\pi$."
    },
    {
      id: "sv_calcbc_u9_3",
      unite: "9",
      beceri: "[BC] Vector-valued motion: total distance (calculator)",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 9.6, BC only) — calculator active",
      question: "<strong>[BC ONLY] Graphing calculator required.</strong> A particle moves in the $xy$-plane with velocity vector $\\vec{v}(t) = \\langle \\cos(t^2),\\, e^{0.5t} \\rangle$. What is the total distance traveled by the particle from $t = 0$ to $t = 2$?",
      options: [
        { id: "A", text: "$3.467$", isCorrect: false, errorTag: "Displacement Karışıklığı: Yer değiştirme vektörünün büyüklüğünü hesaplamak.", remediation: "$\\left|\\int \\vec{v}\\,dt\\right|$ net yer değiştirmedir. Total distance $\\int_0^2 |\\vec{v}(t)|\\,dt = \\int_0^2 \\sqrt{x'(t)^2 + y'(t)^2}\\,dt$." },
        { id: "B", text: "$4.930$", isCorrect: false, errorTag: "Speed Hatası: $|x'| + |y'|$ toplamını integrallemek.", remediation: "Speed, bileşenlerin toplamı değil Pisagor uzunluğudur: $\\sqrt{(x')^2 + (y')^2}$." },
        { id: "C", text: "$3.828$", isCorrect: true },
        { id: "D", text: "$2.796$", isCorrect: false, errorTag: "Anlık Değer: $t = 2$'deki speed'i toplam mesafe sanmak.", remediation: "$|\\vec{v}(2)|$ yalnızca o andaki hızdır; mesafe için speed zamana göre integrallenir." }
      ],
      generalRemediation: "Vector-valued hareket: speed $= |\\vec{v}(t)| = \\sqrt{(x')^2 + (y')^2}$; total distance $= \\int_a^b |\\vec{v}(t)|\\,dt$; position $= \\text{başlangıç} + \\int \\vec{v}\\,dt$.",
      stepByStepSolution: "1. Speed $= \\sqrt{\\cos^2(t^2) + e^{t}}$.<br/>2. Distance $= \\int_0^2 \\sqrt{\\cos^2(t^2) + e^{t}}\\,dt$.<br/>3. Numerik integral (radian): $\\approx 3.828$."
    },
    // ---------------- UNIT 10 ----------------
    {
      id: "sv_calcbc_u10_1",
      unite: "10",
      beceri: "[BC] Sum of a geometric series",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 10.2, BC only)",
      question: "<strong>[BC ONLY]</strong> What is the sum of the series $\\displaystyle\\sum_{n=0}^{\\infty} 3\\left(-\\frac{1}{2}\\right)^n$?",
      options: [
        { id: "A", text: "$6$", isCorrect: false, errorTag: "Oran İşareti Hatası: $r = \\frac{1}{2}$ almak.", remediation: "$r = -\\frac{1}{2}$; $1 - r = 1 + \\frac{1}{2} = \\frac{3}{2}$." },
        { id: "B", text: "$-1$", isCorrect: false, errorTag: "İlk Terim Hatası: Seriyi $n = 1$'den başlatmak.", remediation: "$n = 0$ için ilk terim $a = 3(-\\frac{1}{2})^0 = 3$'tür." },
        { id: "C", text: "Diverges", isCorrect: false, errorTag: "Yakınsaklık Hatası: Alternating işaretleri ıraksaklık sanmak.", remediation: "Geometrik seri $|r| \\lt 1$ ise yakınsar; $|-\\frac{1}{2}| = \\frac{1}{2} \\lt 1$." },
        { id: "D", text: "$2$", isCorrect: true }
      ],
      generalRemediation: "<strong>Geometric series</strong>: $\\sum_{n=0}^\\infty ar^n = \\frac{a}{1 - r}$, yalnızca $|r| \\lt 1$ ise. $a$ ilk terimdir.",
      stepByStepSolution: "1. $a = 3$, $r = -\\frac{1}{2}$, $|r| \\lt 1$ ⟹ yakınsar.<br/>2. Toplam $= \\frac{3}{1 - (-1/2)} = \\frac{3}{3/2}$.<br/>3. Toplam $= 2$."
    },
    {
      id: "sv_calcbc_u10_2",
      unite: "10",
      beceri: "[BC] Maclaurin series coefficient",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 10.11, BC only)",
      question: "<strong>[BC ONLY]</strong> What is the coefficient of $x^3$ in the Maclaurin series for $f(x) = e^{2x}$?",
      options: [
        { id: "A", text: "$\\frac{4}{3}$", isCorrect: true },
        { id: "B", text: "$8$", isCorrect: false, errorTag: "Faktöriyel Unutuldu: $\\frac{f'''(0)}{3!}$ yerine $f'''(0)$ yazmak.", remediation: "Taylor katsayısı $\\frac{f^{(n)}(0)}{n!}$'dir; $\\frac{8}{6} = \\frac{4}{3}$." },
        { id: "C", text: "$\\frac{1}{6}$", isCorrect: false, errorTag: "İç Katsayı Unutuldu: $e^{x}$ serisinin katsayısını yazmak.", remediation: "$e^{u}$ serisinde $u = 2x$: $\\frac{(2x)^3}{3!} = \\frac{8x^3}{6}$. $2^3$ çarpanı unutulmamalı." },
        { id: "D", text: "$\\frac{1}{3}$", isCorrect: false, errorTag: "Kısmi Kuvvet: $(2x)^3$ yerine $2x^3$ almak.", remediation: "Yerine koyma tüm $x$'e uygulanır: $(2x)^3 = 8x^3$, $2x^3$ değil." }
      ],
      generalRemediation: "Bilinen seriden türetme: $e^u = \\sum \\frac{u^n}{n!}$; $u = 2x$ koy. Alternatif: $\\frac{f^{(n)}(0)}{n!}$ formülü.",
      stepByStepSolution: "1. $e^{2x} = \\sum \\frac{(2x)^n}{n!}$.<br/>2. $n = 3$ terimi: $\\frac{(2x)^3}{3!} = \\frac{8x^3}{6}$.<br/>3. Katsayı $\\frac{4}{3}$."
    },
    {
      id: "sv_calcbc_u10_3",
      unite: "10",
      beceri: "[BC] Interval of convergence with endpoint tests",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 10.13, BC only)",
      question: "<strong>[BC ONLY]</strong> What is the interval of convergence of the power series $\\displaystyle\\sum_{n=1}^{\\infty} \\frac{(x - 2)^n}{n \\cdot 3^n}$?",
      options: [
        { id: "A", text: "$(-1, 5)$", isCorrect: false, errorTag: "Uç Noktalar Test Edilmedi: Ratio test aralığını doğrudan yazmak.", remediation: "Ratio test uç noktalarda sonuç vermez ($L = 1$). $x = -1$ ve $x = 5$ ayrı ayrı test edilmelidir." },
        { id: "B", text: "$[-1, 5)$", isCorrect: true },
        { id: "C", text: "$(-1, 5]$", isCorrect: false, errorTag: "Uç Nokta Ters: Harmonic ve alternating harmonic serilerini karıştırmak.", remediation: "$x = 5$: $\\sum\\frac{1}{n}$ (harmonic, ıraksak). $x = -1$: $\\sum\\frac{(-1)^n}{n}$ (alternating harmonic, yakınsak)." },
        { id: "D", text: "$[-1, 5]$", isCorrect: false, errorTag: "Fazla Dahil Etme: Her iki ucu da yakınsak sanmak.", remediation: "$x = 5$'te seri harmonic seridir ve ıraksar ($p$-series, $p = 1$)." }
      ],
      generalRemediation: "<strong>Interval of convergence</strong>: (1) ratio test ile radius, (2) her uç noktayı ayrı seri olarak test et (p-series, alternating series test vb.).",
      stepByStepSolution: "1. Ratio test: $\\frac{|x - 2|}{3} \\lt 1 \\Rightarrow -1 \\lt x \\lt 5$ (radius $3$).<br/>2. $x = 5$: $\\sum\\frac{1}{n}$ ıraksar; $x = -1$: $\\sum\\frac{(-1)^n}{n}$ AST ile yakınsar.<br/>3. Interval: $[-1, 5)$."
    }
  ]
};
