// Meberra — Seviye Testi (Tanı Sınavı): AP English Language and Composition
// Hazırlayan: Claire Bennett (MA, Oxon) — Kural 13: soru metinleri %100 İngilizce.
// Yapı: CED üniteleri beceri sarmalı (spiral) olduğundan tanı "ünitesi" = Big Idea × Bölüm.
//   R1–R4: Reading (Skill 1, 3, 5, 7)   W1–W4: Writing (Skill 2, 4, 6, 8)
// MCQ bölümü: Reading 23–25 soru, Writing 20–22 soru (toplam 45 soru, sınav puanının %45'i).
// Big Idea × Bölüm düzeyinde resmi ağırlık aralığı burada doğrulanamadığı için sinavAgirligi = null.
// Tüm pasajlar bu tanı testi için yazılmış ÖZGÜN metinlerdir; alıntı ya da telifli metin içermez.
// Tur 9 (Faz 28): ap-english.html'e FRQ yazım istasyonu eklendi (#eng-frq-station). Tanı üniteleri
// MCQ becerilerini ölçtüğü için portalCapa değerleri MCQ istasyonlarında bırakıldı (W4 Style → yeni
// Draft 5–6 soruları #eng-writing-quiz-section içinde). FRQ istasyonu bir tanı ünitesi değildir.
// v1.5.0: sorular (cevap anahtarıyla) sunucu veritabanında; bu dosya yalnızca ünite meta verisi taşır (GET /api/seviye/bankalar).
window.APMEBERRA_SEVIYE = window.APMEBERRA_SEVIYE || {};
window.APMEBERRA_SEVIYE["english-language"] = {
  ders: "english-language",
  ad: "AP English Language and Composition",
  cedSurum: "CED (güncel, 2024-25 sonrası; dijital Bluebook formatı)",
  portalSayfasi: "ap-english.html",
  uniteler: [
    { no: "R1", ad: "Reading — Rhetorical Situation (Skill 1)", sinavAgirligi: null, portaldaVar: true, portalCapa: "eng-reading-quiz-section" },
    { no: "R2", ad: "Reading — Claims and Evidence (Skill 3)", sinavAgirligi: null, portaldaVar: true, portalCapa: "eng-reading-quiz-section" },
    { no: "R3", ad: "Reading — Reasoning and Organization (Skill 5)", sinavAgirligi: null, portaldaVar: true, portalCapa: "eng-reading-quiz-section" },
    { no: "R4", ad: "Reading — Style (Skill 7)", sinavAgirligi: null, portaldaVar: true, portalCapa: "eng-reading-quiz-section" },
    { no: "W1", ad: "Writing — Rhetorical Situation (Skill 2)", sinavAgirligi: null, portaldaVar: true, portalCapa: "eng-writing-quiz-section" },
    { no: "W2", ad: "Writing — Claims and Evidence (Skill 4)", sinavAgirligi: null, portaldaVar: true, portalCapa: "eng-writing-quiz-section" },
    { no: "W3", ad: "Writing — Reasoning and Organization (Skill 6)", sinavAgirligi: null, portaldaVar: true, portalCapa: "eng-writing-quiz-section" },
    { no: "W4", ad: "Writing — Style (Skill 8)", sinavAgirligi: null, portaldaVar: true, portalCapa: "eng-writing-quiz-section" }
  ]
};
