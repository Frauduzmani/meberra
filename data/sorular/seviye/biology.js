// Meberra — AP Biology Seviye Testi (Tanı Sınavı)
// Hazırlayan: Dr. Zeynep Aksoy (AP Biology). 8 CED ünitesi × 3 soru = 24 soru.
// Soru metinleri %100 İngilizce (Kural 13); açıklamalar Türkçe + İngilizce terimler.
// v1.5.0: sorular (cevap anahtarıyla) sunucu veritabanında; bu dosya yalnızca ünite meta verisi taşır (GET /api/seviye/bankalar).
window.APMEBERRA_SEVIYE = window.APMEBERRA_SEVIYE || {};
window.APMEBERRA_SEVIYE["biology"] = {
  ders: "biology",
  ad: "AP Biology",
  cedSurum: "AP Biology CED (Fall 2019 yapısı, 2020 güncellemesi; 8 ünite)",
  portalSayfasi: "ap-biology.html",
  uniteler: [
    { no: "1", ad: "Chemistry of Life", sinavAgirligi: "8–11%", portaldaVar: true, portalCapa: "bio-unit1-quiz-section" },
    { no: "2", ad: "Cells (Cell Structure and Function)", sinavAgirligi: "10–13%", portaldaVar: true, portalCapa: "bio-unit2-quiz-section" },
    { no: "3", ad: "Cellular Energetics", sinavAgirligi: "12–16%", portaldaVar: true, portalCapa: "bio-unit3-lecture-section" },
    { no: "4", ad: "Cell Communication and Cell Cycle", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "bio-unit4-lecture-section" },
    { no: "5", ad: "Heredity", sinavAgirligi: "8–11%", portaldaVar: true, portalCapa: "bio-unit5-lecture-section" },
    { no: "6", ad: "Gene Expression and Regulation", sinavAgirligi: "12–16%", portaldaVar: true, portalCapa: "bio-unit6-lecture-section" },
    { no: "7", ad: "Natural Selection", sinavAgirligi: "13–20%", portaldaVar: true, portalCapa: "bio-unit7-lecture-section" },
    { no: "8", ad: "Ecology", sinavAgirligi: "10–15%", portaldaVar: false }
  ]
};
