// Meberra — Seviye Testi (Tanı Sınavı): AP Calculus AB & BC
// Hazırlayan: Prof. Sinan Demir (AP Calculus). Şema: PM Tur 3 seviye şeması.
// Her ünite 3 soru (easy / medium / hard). Tüm sorular yeni ve AP-style original'dır.
// v1.5.0: sorular (cevap anahtarıyla) sunucu veritabanında; bu dosya yalnızca ünite meta verisi taşır (GET /api/seviye/bankalar).
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
  ]
};
