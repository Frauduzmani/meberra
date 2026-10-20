// ÖRNEK — YALNIZCA GELİŞTİRME/TEST İÇİN. Gerçek tanı bankası DEĞİLDİR.
// seviye-testi.html bu dosyayı yalnızca URL'de ?ornek=1 varken yükler.
// "_" önekli olduğu için PM denetimi ve sunum paketi bu dosyayı atlar.
window.APMEBERRA_SEVIYE = window.APMEBERRA_SEVIYE || {};
window.APMEBERRA_SEVIYE["_ornek"] = {
  ders: "_ornek",
  ad: "ÖRNEK Ders (sahte veri)",
  cedSurum: "ÖRNEK — CED'e dayanmaz",
  portalSayfasi: "ap-calculus.html",
  uniteler: [
    { no: "1", ad: "ÖRNEK Ünite 1 — Limits", sinavAgirligi: "10–12%", portaldaVar: true },
    { no: "2", ad: "ÖRNEK Ünite 2 — Derivatives", sinavAgirligi: null, portaldaVar: false }
  ],
  sorular: [
    {
      id: "sv_ornek_u1_1", unite: "1", beceri: "ÖRNEK: limit of a polynomial", zorluk: "easy", sureSn: 60, hesapMakinesi: false,
      source: "ÖRNEK (sahte test verisi)",
      question: "ÖRNEK: Evaluate $\\lim_{x \\to 2} (x^2 + 1)$.",
      options: [
        { id: "A", text: "$5$", isCorrect: true },
        { id: "B", text: "$4$", isCorrect: false, errorTag: "Forgot the constant term", remediation: "Substitute $x=2$ into every term: $4+1$." },
        { id: "C", text: "$3$", isCorrect: false, errorTag: "Used $2x$ instead of $x^2$", remediation: "$x^2$ at $x=2$ is $4$, not $2\\cdot 2$ added to 1 incorrectly." },
        { id: "D", text: "Does not exist", isCorrect: false, errorTag: "Thinks limits of polynomials may fail", remediation: "Polynomials are continuous everywhere, so direct substitution works." }
      ],
      generalRemediation: "For continuous functions, $\\lim_{x\\to a} f(x) = f(a)$.",
      stepByStepSolution: "1) $x^2+1$ is continuous. 2) Substitute: $2^2+1 = 5$."
    },
    {
      id: "sv_ornek_u1_2", unite: "1", beceri: "ÖRNEK: removable discontinuity", zorluk: "medium", sureSn: 90, hesapMakinesi: false,
      source: "ÖRNEK (sahte test verisi)",
      question: "ÖRNEK: Evaluate $\\displaystyle \\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}$.",
      options: [
        { id: "A", text: "$0$", isCorrect: false, errorTag: "Plugged in to get $0$ on top only", remediation: "$0/0$ is indeterminate; factor first." },
        { id: "B", text: "$6$", isCorrect: true },
        { id: "C", text: "$3$", isCorrect: false, errorTag: "Cancelled incorrectly", remediation: "$x^2-9=(x-3)(x+3)$, so the result is $x+3$." },
        { id: "D", text: "Does not exist", isCorrect: false, errorTag: "Treats $0/0$ as undefined limit", remediation: "A $0/0$ form means simplify, not that the limit fails." }
      ],
      generalRemediation: "Factor and cancel the common factor causing $0/0$.",
      stepByStepSolution: "1) Factor: $(x-3)(x+3)/(x-3)$. 2) Cancel: $x+3$. 3) Substitute $x=3$: $6$."
    },
    {
      id: "sv_ornek_u1_3", unite: "1", beceri: "ÖRNEK: limits at infinity", zorluk: "hard", sureSn: 120, hesapMakinesi: false,
      source: "ÖRNEK (sahte test verisi)",
      question: "ÖRNEK: Evaluate $\\displaystyle \\lim_{x \\to \\infty} \\frac{3x^2 + 1}{x^2 - 5}$.",
      options: [
        { id: "A", text: "$0$", isCorrect: false, errorTag: "Confused degree rule", remediation: "Equal degrees give the ratio of leading coefficients." },
        { id: "B", text: "$\\infty$", isCorrect: false, errorTag: "Assumed numerator dominates", remediation: "Both have degree 2; neither dominates." },
        { id: "C", text: "$3$", isCorrect: true },
        { id: "D", text: "$-\\tfrac{1}{5}$", isCorrect: false, errorTag: "Used constant terms", remediation: "As $x\\to\\infty$ the constants become negligible." }
      ],
      generalRemediation: "Divide numerator and denominator by the highest power of $x$.",
      stepByStepSolution: "1) Divide by $x^2$: $(3+1/x^2)/(1-5/x^2)$. 2) As $x\\to\\infty$: $3/1 = 3$."
    },
    {
      id: "sv_ornek_u2_1", unite: "2", beceri: "ÖRNEK: power rule", zorluk: "easy", sureSn: 60, hesapMakinesi: false,
      source: "ÖRNEK (sahte test verisi)",
      question: "ÖRNEK: If $f(x) = x^3$, what is $f'(x)$?",
      options: [
        { id: "A", text: "$x^2$", isCorrect: false, errorTag: "Dropped the coefficient", remediation: "Power rule: bring the exponent down, $3x^2$." },
        { id: "B", text: "$3x^3$", isCorrect: false, errorTag: "Did not reduce the exponent", remediation: "Subtract 1 from the exponent." },
        { id: "C", text: "$\\tfrac{x^4}{4}$", isCorrect: false, errorTag: "Integrated instead of differentiated", remediation: "That is an antiderivative." },
        { id: "D", text: "$3x^2$", isCorrect: true }
      ],
      generalRemediation: "Power rule: $\\frac{d}{dx}x^n = n x^{n-1}$.",
      stepByStepSolution: "1) $n=3$. 2) $3x^{3-1} = 3x^2$."
    },
    {
      id: "sv_ornek_u2_2", unite: "2", beceri: "ÖRNEK: product rule", zorluk: "medium", sureSn: 90, hesapMakinesi: false,
      source: "ÖRNEK (sahte test verisi)",
      question: "ÖRNEK: If $g(x) = x \\sin x$, what is $g'(x)$?",
      options: [
        { id: "A", text: "$\\sin x + x\\cos x$", isCorrect: true },
        { id: "B", text: "$\\cos x$", isCorrect: false, errorTag: "Multiplied derivatives", remediation: "$(uv)' = u'v + uv'$, not $u'v'$." },
        { id: "C", text: "$x\\cos x$", isCorrect: false, errorTag: "Forgot one product-rule term", remediation: "Include $u'v = 1\\cdot\\sin x$." },
        { id: "D", text: "$\\sin x - x\\cos x$", isCorrect: false, errorTag: "Sign error", remediation: "The product rule adds the two terms." }
      ],
      generalRemediation: "Product rule: $(uv)' = u'v + uv'$.",
      stepByStepSolution: "1) $u=x$, $v=\\sin x$. 2) $u'v + uv' = \\sin x + x\\cos x$."
    },
    {
      id: "sv_ornek_u2_3", unite: "2", beceri: "ÖRNEK: chain rule", zorluk: "hard", sureSn: 120, hesapMakinesi: true,
      source: "ÖRNEK (sahte test verisi)",
      question: "ÖRNEK: If $h(x) = (2x + 1)^5$, what is $h'(0)$?",
      options: [
        { id: "A", text: "$5$", isCorrect: false, errorTag: "Forgot the inner derivative", remediation: "Multiply by $\\frac{d}{dx}(2x+1) = 2$." },
        { id: "B", text: "$10$", isCorrect: true },
        { id: "C", text: "$1$", isCorrect: false, errorTag: "Evaluated $h(0)$ instead of $h'(0)$", remediation: "Differentiate first, then substitute." },
        { id: "D", text: "$32$", isCorrect: false, errorTag: "Random power evaluation", remediation: "Apply the chain rule: $5(2x+1)^4\\cdot 2$." }
      ],
      generalRemediation: "Chain rule: $\\frac{d}{dx}f(g(x)) = f'(g(x))\\,g'(x)$.",
      stepByStepSolution: "1) $h'(x) = 5(2x+1)^4 \\cdot 2$. 2) $h'(0) = 5\\cdot 1\\cdot 2 = 10$."
    }
  ]
};
