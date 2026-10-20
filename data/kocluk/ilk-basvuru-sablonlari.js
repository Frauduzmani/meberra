// AP MEBERRA — Üniversiteye ilk başvuru e-postası şablonları (Tur 14, Ajan 14 eposta-uzmani, Faz 1). Hazırlanma: 19 Ekim 2026.
// Motor: assets/js/eposta.js > ilkBasvuruHazirla(profil, kullanici, universite, ulkeKod, amac)
// Plan: .agents/rules/tur14-ilk-basvuru-eposta-plani.md · Yönergeler: kaynaklar/eposta-ornekleri/anonim/yonergeler.md (Y1–Y11, K1–K10)
//
// KAYNAK DÜRÜSTLÜĞÜ: Elimizde gönderilmiş gerçek bir e-posta örneği yok (kullanıcı teyidi, 19 Ekim 2026; ham/ klasörü boş).
// Şablonlar YALNIZCA üniversitelerin ve resmi başvuru kurumlarının yayımladığı iletişim yönergelerine dayanır;
// her şablonun "dayanak" alanında yalnızca bu yönergelerin URL'leri vardır (erişim: 19 Ekim 2026).
//
// KURALLAR (yonergeler.md K1–K10):
//  - Gövde 120–220 kelime, en fazla 3 numaralı soru; SSS'de cevabı olan soru sorulmaz (K1, K10).
//  - Konu: aday türü + program (ya da program türü) + başlangıç dönemi (K2).
//  - Profilde olmayan belge/sınav yazılmaz: {{#if yol}} … {{/if}} koşullu blokları (K10). AP ve dil sınavları
//    "taken or planned" diye geçer; puan yazılmaz.
//  - Mevzuat (kabul yolu, tarih, ücret) varsayılmaz, SORU olarak sorulur (K9; içerik Ajan 13'ün).
//  - Sabit metinde kişisel veri ve e-posta adresi yok. Alıcı adresi motor tarafından yalnızca kaynaklı kanaldan çözülür (K8).
//  - Ek dosya istenmez/gönderilmez; belgeler resmi portala yüklenir (K5).
//
// Şema (her öğe): id, baslik (TR), amac ("ilk-iletisim" | "takip"), modeller ["lise" | "lise-mezun" | "uni-mezun"],
//   ulke ("*" genel | ülke kodu), dil "en", konu, govde, zorunluAlanlar, dayanak [URL], not (TR | null), alici {not} (isteğe bağlı), guncelleme,
//   yonergeKodlari ["Y1", "K8", …] (isteğe bağlı, v1.1.1) — yalnız makine/izlenebilirlik alanı: yonergeler.md kodları.
//   Öğrenciye görünen metinlerde (not, baslik) yönerge kodu YAZILMAZ; kod yalnızca bu alanda tutulur.
(function (root) {
  "use strict";

  // ------------------------------------------------------------------ Yönerge URL'leri (yonergeler.md)
  var Y = {
    uniassist: "https://www.uni-assist.de/en/contact/",
    tumEtiket: "https://www.tum.de/en/studies/support-and-advice/support-during-studies/student-information/e-mail-etiquette",
    tumBasvuru: "https://www.tum.de/en/studies/international-students/application-and-admission",
    eth: "https://ethz.ch/en/studies/registration-application/bachelor/other-certificates.html",
    polimi: "https://www.polimi.it/en/prospective-students/contacts/contacts-for-international-prospective-students",
    unipi: "https://www.unipi.it/en/education/registration/enrolment-and-registration/enrolment-for-international-students/pre-registration-on-universitaly/",
    tudelft: "https://www.tudelft.nl/en/onderwijs/opleidingen/bachelors/ae/bsc-aerospace-engineering/from-application-to-enrolment/application-procedure",
    eur: "https://www.eur.nl/en/eshcc/bachelor/international-bachelor-arts-and-culture-studies/contact",
    campusFrance: "https://www.turquie.campusfrance.org/",
    campusFranceFaq: "https://www.turquie.campusfrance.org/fr/faq",
    uhrSe: "https://www.universityadmissions.se/en/contact/"
  };
  var GENEL_DAYANAK = [Y.tumEtiket, Y.eth, Y.polimi];

  // ------------------------------------------------------------------ Ortak parçalar
  var SELAM = "Dear Admissions Team,\n\n";
  var PROGRAM = "{{#if program.ad}}the {{program.ad}} programme{{else}}your {{program.dil}} {{basvuru.duzey}} programmes{{/if}}";
  var BU_PROGRAM = "{{#if program.ad}}this programme{{else}}these programmes{{/if}}";

  var GIRIS = {
    "lise":
      "My name is {{ogrenci.adSoyad}}. I am a {{ogrenci.sinif}} student at {{ogrenci.okul}} in {{ogrenci.okulSehir}}, Türkiye, " +
      "and I expect to receive the Turkish high school diploma (Lise Diplomasi) in {{ogrenci.mezuniyetAyYil}}. " +
      "I am interested in " + PROGRAM + " at {{universite.ad}}, starting in the {{basvuru.donem}}.",
    "lise-mezun":
      "My name is {{ogrenci.adSoyad}}. I graduated from {{ogrenci.okul}} in {{ogrenci.okulSehir}}, Türkiye, in {{ogrenci.mezuniyetAyYil}} " +
      "with the Turkish high school diploma (Lise Diplomasi). " +
      "I am interested in " + PROGRAM + " at {{universite.ad}}, starting in the {{basvuru.donem}}.",
    "uni-mezun":
      "My name is {{ogrenci.adSoyad}}. " +
      "{{#if ogrenci.lisansSonSinif}}I am in the final year of a bachelor's degree in {{ogrenci.lisansAlani}}" +
      "{{#if ogrenci.lisansUniversitesi}} at {{ogrenci.lisansUniversitesi}}{{/if}} in Türkiye and expect to graduate in {{ogrenci.lisansMezuniyetYili}}." +
      "{{else}}I hold a bachelor's degree in {{ogrenci.lisansAlani}}{{#if ogrenci.lisansUniversitesi}} from {{ogrenci.lisansUniversitesi}}{{/if}} " +
      "in Türkiye, awarded in {{ogrenci.lisansMezuniyetYili}}.{{/if}}" +
      "{{#if ogrenci.gpa4}} My cumulative GPA is {{ogrenci.gpa4}} out of 4.00.{{/if}} " +
      "I am interested in " + PROGRAM + " at {{universite.ad}}, starting in the {{basvuru.donem}}."
  };
  // Almanya lise mezunu: YKS yerleşmesi profilde varsa (giriş hakkı sorusunun bağlamı) tek cümle eklenir.
  var GIRIS_DE_LISE_MEZUN = GIRIS["lise-mezun"].replace(
    "with the Turkish high school diploma (Lise Diplomasi). ",
    "with the Turkish high school diploma (Lise Diplomasi).{{#if ogrenci.yksYerlesme}} I have also been placed in a four-year Lisans programme through the Turkish university entrance examination (YKS).{{/if}} "
  );

  var SSS = "\n\nI have read your admission pages but could not find a clear answer to these questions:\n\n";

  // Belgeler/sınavlar: yalnızca profilde (Sınavlarım) varsa; puan yazılmaz (K10).
  var BELGELER =
    "\n\n{{#if ogrenci.apSinavlari}}Advanced Placement (AP) examinations, taken or planned: {{ogrenci.apSinavlari}}. {{/if}}" +
    "{{#if ogrenci.dilSinavlari}}Language tests, taken or planned: {{ogrenci.dilSinavlari}}. {{/if}}" +
    "{{#if ogrenci.girisSinavlari}}Other admission tests, taken or planned: {{ogrenci.girisSinavlari}}.{{/if}}";

  var KAPANIS =
    "\n\nThank you for your time. I will submit all documents through the official application portal." +
    "\n\nKind regards,\n{{ogrenci.adSoyad}}{{#if ogrenci.dogumTarihi}}\nDate of birth: {{ogrenci.dogumTarihi}}{{/if}}";

  // Takip (K6): tek seferlik, ilk e-postanın tarihini anar, soruları tekrarlar.
  var TAKIP_GIRIS =
    "On {{takip.ilkTarih}} I wrote to you about " + PROGRAM + " at {{universite.ad}} for the {{basvuru.donem}}. " +
    "I understand that you receive many enquiries, and I am sending this short reminder only once. " +
    "If my questions should go to another office, or are answered on a page I have missed, I would be grateful for a link." +
    "\n\nFor convenience, my questions were:\n\n";
  var TAKIP_KIMLIK = {
    "lise": "\n\nFor reference: I am a {{ogrenci.sinif}} student at {{ogrenci.okul}} in {{ogrenci.okulSehir}}, Türkiye, expecting to graduate in {{ogrenci.mezuniyetAyYil}}.",
    "lise-mezun": "\n\nFor reference: I graduated from {{ogrenci.okul}} in {{ogrenci.okulSehir}}, Türkiye, in {{ogrenci.mezuniyetAyYil}} with the Lise Diplomasi.",
    "uni-mezun": "\n\nFor reference: my bachelor's degree is in {{ogrenci.lisansAlani}}{{#if ogrenci.lisansUniversitesi}} from {{ogrenci.lisansUniversitesi}}{{/if}} ({{#if ogrenci.lisansSonSinif}}expected {{else}}awarded {{/if}}{{ogrenci.lisansMezuniyetYili}})."
  };
  var TAKIP_KAPANIS = "\n\nThank you for your help.\n\nKind regards,\n{{ogrenci.adSoyad}}{{#if ogrenci.dogumTarihi}}\nDate of birth: {{ogrenci.dogumTarihi}}{{/if}}";

  var KONU_ADAY = {
    "lise": "Prospective bachelor's applicant (Turkish high school student)",
    "lise-mezun": "Prospective bachelor's applicant (Turkish high school graduate)",
    "uni-mezun": "Prospective master's applicant (Turkish bachelor's degree)"
  };
  var KONU_PROGRAM = " – {{#if program.ad}}{{program.ad}}{{else}}{{program.dil}} programmes{{/if}}, {{basvuru.donem}}";

  var ZORUNLU = {
    "lise": ["ogrenci.adSoyad", "ogrenci.sinif", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.mezuniyetAyYil", "universite.ad", "basvuru.donem"],
    "lise-mezun": ["ogrenci.adSoyad", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.mezuniyetAyYil", "universite.ad", "basvuru.donem"],
    "uni-mezun": ["ogrenci.adSoyad", "ogrenci.lisansAlani", "ogrenci.lisansMezuniyetYili", "universite.ad", "basvuru.donem"]
  };

  // ------------------------------------------------------------------ Sorular (en fazla 3; ülke × model)
  var SON_SINIF_YA_DA = function (evet, hayir) { return "{{#if ogrenci.lisansSonSinif}}" + evet + "{{else}}" + hayir + "{{/if}}"; };
  var SORULAR = {
    "*": {
      "lise": [
        "Is the Turkish Lise Diplomasi accepted for direct admission to " + BU_PROGRAM + ", or are additional qualifications required, such as a national entrance examination result or a foundation year?",
        "Which application channel and deadline apply to applicants with a Turkish diploma for the {{basvuru.donem}}?",
        "Can I apply during my final school year with my transcripts and submit the diploma after the application deadline?"
      ],
      "lise-mezun": [
        "Is the Turkish Lise Diplomasi accepted for direct admission to " + BU_PROGRAM + ", or are additional qualifications required, such as a national entrance examination result or a foundation year?",
        "Which application channel and deadline apply to applicants with a Turkish diploma for the {{basvuru.donem}}?",
        "Does the time since my graduation affect my eligibility, and do you require any document in addition to my diploma and transcripts?"
      ],
      "uni-mezun": [
        "Does my bachelor's degree in {{ogrenci.lisansAlani}} meet the academic entry requirements, and is a preliminary assessment possible before I submit a formal application?",
        "Which application channel and deadline apply to applicants with a Turkish bachelor's degree for the {{basvuru.donem}}?",
        SON_SINIF_YA_DA("Can I apply before graduation with my current transcript and submit the degree certificate later?",
          "Do my degree certificate and transcript need to be evaluated by an external body before I apply?")
      ]
    },
    "de": {
      "lise": [
        "Does your university evaluate a Turkish Lise Diplomasi itself, or should I apply through uni-assist, and is a uni-assist VPD required?",
        "Which documents do you require to establish a higher education entrance qualification with a Turkish Lise Diplomasi (for example, YKS results and placement), and can a document published after your deadline be submitted later?",
        "Which application deadline applies to international applicants for the {{basvuru.donem}}?"
      ],
      "lise-mezun": [
        "Does your university evaluate a Turkish Lise Diplomasi itself, or should I apply through uni-assist, and is a uni-assist VPD required?",
        "Which documents do you require from an applicant with a Turkish Lise Diplomasi{{#if ogrenci.yksYerlesme}} and a YKS placement{{/if}} to establish a higher education entrance qualification for " + BU_PROGRAM + "?",
        "Which application deadline applies to international applicants for the {{basvuru.donem}}?"
      ],
      "uni-mezun": [
        "Should I apply directly to your university or through uni-assist, and is a uni-assist VPD required for a Turkish bachelor's degree?",
        "Does my bachelor's degree in {{ogrenci.lisansAlani}} meet the subject-specific entry requirements, and is a preliminary assessment possible before the formal application?",
        SON_SINIF_YA_DA("Can I apply before graduation with my current transcript, and which deadline applies for the {{basvuru.donem}}?",
          "Which application deadline applies to international applicants for the {{basvuru.donem}}?")
      ]
    },
    "it": {
      "lise": [
        "Does admission to " + BU_PROGRAM + " require an entrance test (for example, a CISIA test or your own test), and when can international applicants take it for the {{basvuru.donem}}?",
        "After an admission decision, should I complete the pre-enrolment on Universitaly, and what is your deadline for it?",
        "Is the Turkish Lise Diplomasi (12 years of schooling) accepted, and do you require a Declaration of Value or a CIMEA statement of comparability?"
      ],
      "lise-mezun": [
        "Does admission to " + BU_PROGRAM + " require an entrance test (for example, a CISIA test or your own test), and when can international applicants take it for the {{basvuru.donem}}?",
        "After an admission decision, should I complete the pre-enrolment on Universitaly, and what is your deadline for it?",
        "Is the Turkish Lise Diplomasi (12 years of schooling) accepted, and do you require a Declaration of Value or a CIMEA statement of comparability?"
      ],
      "uni-mezun": [
        "Does my bachelor's degree in {{ogrenci.lisansAlani}} meet the curricular requirements, and do you assess them before or during the call for applications?",
        "After receiving an admission letter, should I complete the pre-enrolment on Universitaly, and what is your deadline for it?",
        "Do you require a Declaration of Value or a CIMEA statement of comparability for my bachelor's degree?"
      ]
    },
    "nl": {
      "lise": [
        "After registering in Studielink, which further steps and which portal apply to applicants with a Turkish diploma?",
        "Is the Turkish Lise Diplomasi accepted for direct admission, or are additional requirements needed, such as a specific mathematics level or a foundation year?",
        "Is " + BU_PROGRAM + " subject to a numerus fixus or selection procedure, and which deadline applies for the {{basvuru.donem}}?"
      ],
      "lise-mezun": [
        "After registering in Studielink, which further steps and which portal apply to applicants with a Turkish diploma?",
        "Is the Turkish Lise Diplomasi accepted for direct admission, or are additional requirements needed, such as a specific mathematics level or a foundation year?",
        "Is " + BU_PROGRAM + " subject to a numerus fixus or selection procedure, and which deadline applies for the {{basvuru.donem}}?"
      ],
      "uni-mezun": [
        "After registering in Studielink, which further steps and which portal apply to applicants with a Turkish bachelor's degree?",
        "Does my bachelor's degree in {{ogrenci.lisansAlani}} give direct access, or would a pre-master's programme be required?",
        "Which application deadline applies to non-EU applicants for the {{basvuru.donem}}?"
      ]
    },
    "fr": {
      "lise": [
        "As an applicant living in Türkiye, should I apply through the Études en France procedure of Campus France, or directly to your institution?",
        "Which documents and language certificates are required for " + BU_PROGRAM + "?",
        "Which application deadline applies for the {{basvuru.donem}}?"
      ],
      "lise-mezun": [
        "As an applicant living in Türkiye, should I apply through the Études en France procedure of Campus France, or directly to your institution?",
        "Which documents and language certificates are required for " + BU_PROGRAM + "?",
        "Which application deadline applies for the {{basvuru.donem}}?"
      ],
      "uni-mezun": [
        "As an applicant living in Türkiye, should I apply through the Études en France procedure of Campus France, or directly to your institution?",
        "Does my bachelor's degree in {{ogrenci.lisansAlani}} meet the entry requirements, and which documents are required?",
        "Which application deadline applies for the {{basvuru.donem}}?"
      ]
    },
    "se": {
      "lise": [
        "Is the application made only through universityadmissions.se, and which deadline applies for the {{basvuru.donem}}?",
        "Does a Turkish Lise Diplomasi meet the general entry requirements, or is an individual assessment by University Admissions in Sweden needed?",
        "How are the specific entry requirements, for example in mathematics, assessed for a Turkish diploma?"
      ],
      "lise-mezun": [
        "Is the application made only through universityadmissions.se, and which deadline applies for the {{basvuru.donem}}?",
        "Does a Turkish Lise Diplomasi meet the general entry requirements, or is an individual assessment by University Admissions in Sweden needed?",
        "How are the specific entry requirements, for example in mathematics, assessed for a Turkish diploma?"
      ],
      "uni-mezun": [
        "Is the application made only through universityadmissions.se, and which deadline applies for the {{basvuru.donem}}?",
        "Does my bachelor's degree in {{ogrenci.lisansAlani}} meet the specific entry requirements of " + BU_PROGRAM + "?",
        "Are my documents assessed by University Admissions in Sweden or by your university?"
      ]
    }
  };

  // ------------------------------------------------------------------ Ülke bilgileri (dayanak + not)
  var ULKE = {
    "*": { ad: "Genel (ülkeye özel varyantı olmayan ülkeler)", dayanak: GENEL_DAYANAK, kodlar: ["K1", "K8"],
      not: "Göndermeden önce üniversitenin sık sorulan sorular ve başvuru sayfalarını oku; cevabı orada olan soruyu sil. Üniversite iletişim formu kullanıyorsa metni forma yapıştır." },
    "de": { ad: "Almanya", dayanak: [Y.uniassist, Y.tumBasvuru, Y.tumEtiket], kodlar: ["Y1", "Y2"],
      not: "Almanya: başvuru çoğu programda uni-assist ya da üniversitenin kendi portalı üzerinden yapılır; uni-assist soruları yalnızca iletişim formuyla alır. Başvuru numaran olduktan sonra her yazışmaya ekle." },
    "it": { ad: "İtalya", dayanak: [Y.polimi, Y.unipi, Y.tumEtiket], kodlar: ["Y5", "Y6"],
      not: "İtalya: Universitaly ön kaydı üniversitenin kabul sürecinden sonra gelir ve son tarihi üniversiteye göre değişir. Bazı üniversiteler (ör. Politecnico di Milano) e-posta yerine mesaj ya da sohbet kanalı kullanır." },
    "nl": { ad: "Hollanda", dayanak: [Y.tudelft, Y.eur, Y.tumEtiket], kodlar: ["Y7", "Y8"],
      not: "Hollanda: ilk adım Studielink kaydıdır. Üniversite yalnızca Studielink'te verdiğin e-posta adresiyle yazışır; bu e-postayı da aynı adresten gönder." },
    "fr": { ad: "Fransa", dayanak: [Y.campusFrance, Y.campusFranceFaq, Y.tumEtiket], kodlar: ["Y9"],
      not: "Fransa: Türkiye'de yaşayan adayların başvurusu Campus France Türkiye 'Études en France' platformu üzerinden yürür; usul soruları Campus France iletişim formuna da sorulabilir. Ücret ve tarihler bu e-postada varsayılmaz." },
    "se": { ad: "İsveç", dayanak: [Y.uhrSe, Y.tumEtiket, Y.eth], kodlar: ["Y10"],
      not: "İsveç: uygunluk ve giriş şartı soruları University Admissions in Sweden iletişim formuna gider; üniversiteye yalnızca programa özel sorular için yaz." }
  };

  var MODEL_AD = { "lise": "lise öğrencisi", "lise-mezun": "lise mezunu", "uni-mezun": "üniversite mezunu (YL)" };

  function numarala(liste) { return liste.map(function (q, i) { return (i + 1) + ". " + q; }).join("\n"); }

  var SABLONLAR = [];
  Object.keys(SORULAR).forEach(function (ulke) {
    ["lise", "lise-mezun", "uni-mezun"].forEach(function (model) {
      var u = ULKE[ulke], sorular = numarala(SORULAR[ulke][model]);
      var giris = ulke === "de" && model === "lise-mezun" ? GIRIS_DE_LISE_MEZUN : GIRIS[model];
      var ek = ulke === "*" ? "genel" : ulke;
      SABLONLAR.push({
        id: "ilk-" + ek + "-" + model,
        baslik: "İlk başvuru e-postası — " + u.ad + ", " + MODEL_AD[model],
        amac: "ilk-iletisim",
        modeller: [model],
        ulke: ulke,
        dil: "en",
        konu: KONU_ADAY[model] + KONU_PROGRAM,
        govde: SELAM + giris + SSS + sorular + BELGELER + KAPANIS,
        zorunluAlanlar: ZORUNLU[model].slice(),
        dayanak: u.dayanak.slice(),
        not: u.not,
        yonergeKodlari: ["K1", "K2", "K5", "K8", "K9", "K10"].concat(u.kodlar.filter(function (k) { return ["K1", "K8"].indexOf(k) < 0; })),
        alici: { not: "Alıcı motor tarafından yalnızca kaynaklı kanaldan çözülür (eposta-sablonlari.js alici.secenekler, teyit-taslaklari.js epostaKaynak); yoksa üniversitenin başvuru/iletişim sayfası gösterilir." },
        guncelleme: "2026-10-19"
      });
      SABLONLAR.push({
        id: "takip-" + ek + "-" + model,
        baslik: "Takip (10 iş günü cevapsız) — " + u.ad + ", " + MODEL_AD[model],
        amac: "takip",
        modeller: [model],
        ulke: ulke,
        dil: "en",
        konu: "Follow-up: " + KONU_ADAY[model] + KONU_PROGRAM,
        govde: SELAM + TAKIP_GIRIS + sorular + TAKIP_KIMLIK[model] + TAKIP_KAPANIS,
        zorunluAlanlar: ZORUNLU[model].concat(["takip.ilkTarih"]),
        dayanak: [Y.tumEtiket].concat(u.dayanak.filter(function (x) { return x !== Y.tumEtiket; })),
        not: "Yalnızca bir kez, ilk e-postadan en az 10 iş günü sonra ve aynı yazışma zincirine yanıt olarak gönder. 10 iş günü bu portalın önerisidir; bazı üniversiteler (ör. TUM) aynı isteğin tekrar gönderilmemesini açıkça ister. " + u.not,
        yonergeKodlari: ["K6", "Y2"].concat(u.kodlar.filter(function (k) { return k !== "Y2"; })),
        alici: { not: "İlk e-postanın gönderildiği adres/form kullanılır." },
        guncelleme: "2026-10-19"
      });
    });
  });

  root.APMEBERRA_ILK_BASVURU_SABLONLARI = SABLONLAR;
  root.APMEBERRA_ILK_BASVURU_YONERGELER = Y;
  if (typeof module === "object" && module && module.exports) module.exports = SABLONLAR;
})(typeof window !== "undefined" ? window : globalThis);
