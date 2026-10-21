// Meberra — Seviye Testi (Tanı Sınavı): AP Chemistry
// Hazırlayan: Doç. Dr. Selin Erdem (AP Kimya Baş Eğitmeni). Şema: PM Tur 3 seviye şeması.
// Her CED ünitesi için 3 yeni tanı sorusu (easy / medium / hard). Tüm sayısal cevaplar Python 3.11 ile bağımsız doğrulandı.
// Not: AP Chemistry'de hesap makinesi sınavın TAMAMINDA (MCQ + FRQ) serbesttir; soru düzeyindeki
// hesapMakinesi alanı, o sorunun hesap makinesiyle hesaplama gerektirip gerektirmediğini gösterir.
// v1.5.0: sorular (cevap anahtarıyla) sunucu veritabanında; bu dosya yalnızca ünite meta verisi taşır (GET /api/seviye/bankalar).
window.APMEBERRA_SEVIYE = window.APMEBERRA_SEVIYE || {};
window.APMEBERRA_SEVIYE["chemistry"] = {
  ders: "chemistry",
  ad: "AP Chemistry",
  cedSurum: "CED (güncel, 2024-25 sonrası)",
  portalSayfasi: "ap-chemistry.html",
  hesapMakinesiKurali: "AP Chemistry sınavının tamamında (Section I MCQ + Section II FRQ) bilimsel/grafik hesap makinesi serbesttir; periyodik tablo ve formül sayfası verilir.",
  uniteler: [
    { no: "1", ad: "Atomic Structure and Properties", sinavAgirligi: "7–9%", portaldaVar: true, portalCapa: "chem-unit1-quiz-section" },
    { no: "2", ad: "Compound Structure and Properties", sinavAgirligi: "7–9%", portaldaVar: true, portalCapa: "chem-unit2-quiz-section" },
    { no: "3", ad: "Properties of Substances and Mixtures", sinavAgirligi: "18–22%", portaldaVar: true, portalCapa: "chem-unit3-quiz-section" },
    { no: "4", ad: "Chemical Reactions", sinavAgirligi: "7–9%", portaldaVar: true, portalCapa: "chem-unit4-lecture-section" },
    { no: "5", ad: "Kinetics", sinavAgirligi: "7–9%", portaldaVar: true, portalCapa: "chem-unit5-lecture-section" },
    { no: "6", ad: "Thermochemistry", sinavAgirligi: "7–9%", portaldaVar: true, portalCapa: "chem-unit6-lecture-section" },
    { no: "7", ad: "Equilibrium", sinavAgirligi: "7–9%", portaldaVar: true, portalCapa: "chem-unit7-lecture-section" },
    { no: "8", ad: "Acids and Bases", sinavAgirligi: "11–15%", portaldaVar: true, portalCapa: "chem-unit8-lecture-section" },
    { no: "9", ad: "Thermodynamics and Electrochemistry", sinavAgirligi: "7–9%", portaldaVar: true, portalCapa: "chem-unit9-lecture-section" }
  ]
};
