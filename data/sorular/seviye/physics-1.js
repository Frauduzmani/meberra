// Meberra — Seviye Testi (Tanı Sınavı): AP Physics 1 — Dr. Emre Yıldız
// 8 CED ünitesi × 3 soru (easy / medium / hard). Aksi belirtilmedikçe g = 10 m/s² (AP Physics 1 kuralı).
// v1.5.0: sorular (cevap anahtarıyla) sunucu veritabanında; bu dosya yalnızca ünite meta verisi taşır (GET /api/seviye/bankalar).
window.APMEBERRA_SEVIYE = window.APMEBERRA_SEVIYE || {};
window.APMEBERRA_SEVIYE["physics-1"] = {
  ders: "physics-1",
  ad: "AP Physics 1: Algebra-Based",
  cedSurum: "CED (güncel, 2024-25 sonrası — 8 ünite, Fluids dahil)",
  portalSayfasi: "ap-physics.html",
  uniteler: [
    { no: "1", ad: "Kinematics", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "phys-unit1-lecture" },
    { no: "2", ad: "Force and Translational Dynamics", sinavAgirligi: "18–23%", portaldaVar: true, portalCapa: "phys-unit2-lecture" },
    { no: "3", ad: "Work, Energy, and Power", sinavAgirligi: "18–23%", portaldaVar: true, portalCapa: "phys-unit3-wep-lecture" },
    { no: "4", ad: "Linear Momentum", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "phys-unit4-momentum-lecture" },
    { no: "5", ad: "Torque and Rotational Dynamics", sinavAgirligi: "10–15%", portaldaVar: true, portalCapa: "phys-unit5-rotation-lecture" },
    { no: "6", ad: "Energy and Momentum of Rotating Systems", sinavAgirligi: "5–8%", portaldaVar: true, portalCapa: "phys-unit6-rotating-lecture" },
    { no: "7", ad: "Oscillations", sinavAgirligi: "5–8%", portaldaVar: true, portalCapa: "phys-unit7-oscillations-lecture" },
    { no: "8", ad: "Fluids", sinavAgirligi: "10–15%", portaldaVar: false }
  ]
};
