// AP MEBERRA — Seviye Testi (Tanı Sınavı): AP English Language and Composition
// Hazırlayan: Claire Bennett (MA, Oxon) — Kural 13: soru metinleri %100 İngilizce.
// Yapı: CED üniteleri beceri sarmalı (spiral) olduğundan tanı "ünitesi" = Big Idea × Bölüm.
//   R1–R4: Reading (Skill 1, 3, 5, 7)   W1–W4: Writing (Skill 2, 4, 6, 8)
// MCQ bölümü: Reading 23–25 soru, Writing 20–22 soru (toplam 45 soru, sınav puanının %45'i).
// Big Idea × Bölüm düzeyinde resmi ağırlık aralığı burada doğrulanamadığı için sinavAgirligi = null.
// Tüm pasajlar bu tanı testi için yazılmış ÖZGÜN metinlerdir; alıntı ya da telifli metin içermez.
// Tur 9 (Faz 28): ap-english.html'e FRQ yazım istasyonu eklendi (#eng-frq-station). Tanı üniteleri
// MCQ becerilerini ölçtüğü için portalCapa değerleri MCQ istasyonlarında bırakıldı (W4 Style → yeni
// Draft 5–6 soruları #eng-writing-quiz-section içinde). FRQ istasyonu bir tanı ünitesi değildir.
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
  ],
  sorular: [
    // ===================== R1 — Reading: Rhetorical Situation =====================
    {
      id: "sv_eng_r1_1",
      unite: "R1",
      beceri: "Skill 1.A: Exigence",
      zorluk: "easy",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 1.A — Rhetorical Situation)",
      question: "<strong>Passage</strong> (a parent's letter to a local newspaper): <em>“Last Tuesday, the footbridge over Kestrel Creek was closed after an inspector found a cracked support beam. For the four hundred students who cross it each morning, the detour adds nearly two kilometers along a road with no sidewalk. I am writing because the county has announced no date for repairs, and a temporary crossing could be built within weeks.”</em><br/><br/>Which of the following best identifies the exigence of the letter?",
      options: [
        { id: "A", text: "The county's long-standing policy of inspecting every bridge once a year", isCorrect: false, errorTag: "Arka Plan–Exigence Karışıklığı: Metinde olmayan bir arka planı tetikleyici sanmak.", remediation: "Metin yıllık bir denetim politikasından söz etmez; yalnızca tek bir denetimin (crack bulunması) sonucunu verir. Exigence, yazmayı <em>şimdi</em> gerekli kılan olaydır." },
        { id: "B", text: "The bridge's closure and the county's failure to set a repair date", isCorrect: true },
        { id: "C", text: "A recent editorial praising the county's record on road safety", isCorrect: false, errorTag: "Uydurma Bağlam: Pasajda geçmeyen bir metne yanıt verildiğini varsaymak.", remediation: "Pasajda hiçbir editoryale gönderme yoktur. Exigence sorusunda yalnızca metnin kendi verdiği tetikleyiciyi kullan: “closed... no date for repairs”." },
        { id: "D", text: "Students' complaints that the walk to school has always been too long", isCorrect: false, errorTag: "Aşırı Genelleme: “always” gibi metinde olmayan bir süreklilik eklemek.", remediation: "Sorun “always” değil, “Last Tuesday” başlayan yeni bir durumdur. Ayrıca öğrencilerin şikâyeti aktarılmaz; yazar ebeveyndir." }
      ],
      generalRemediation: "Exigence = yazarı tam bu anda yazmaya iten sorun veya olay. Metinde zaman işaretlerini (“Last Tuesday”) ve “I am writing because...” gibi gerekçe cümlelerini ara.",
      stepByStepSolution: "1. Zaman işareti: “Last Tuesday, the footbridge... was closed”.<br/>2. Gerekçe cümlesi: “I am writing because the county has announced no date for repairs”.<br/>3. İkisini birleştiren şık: köprünün kapanması + onarım tarihi verilmemesi.<br/>4. Doğru cevap B. Diğer şıklar metinde olmayan bağlamlar (politika, editoryal, “always”) ekler."
    },
    {
      id: "sv_eng_r1_2",
      unite: "R1",
      beceri: "Skill 1.B: Audience and rhetorical choices",
      zorluk: "medium",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 1.B — Rhetorical Situation)",
      question: "<strong>Passage</strong> (a soil scientist speaking to a meeting of local farmers): <em>“I have spent ten years studying soil in laboratories, but none of you needs me to tell you that the ground on the eastern ridge has changed. You have watched it crust over after every dry August. What I can offer is the measurement behind what you already know.”</em><br/><br/>The speaker's acknowledgment that the farmers “have watched it crust over” primarily serves to",
      options: [
        { id: "A", text: "concede that laboratory research on soil is less reliable than farming", isCorrect: false, errorTag: "Aşırı Okuma: Ortak zemin kurmayı tam bir taviz/geri çekilme sanmak.", remediation: "Konuşmacı laboratuvar çalışmasını küçümsemez; tersine “the measurement behind what you already know” diyerek iki bilgiyi birleştirir." },
        { id: "B", text: "shift responsibility for the soil's decline from scientists to farmers", isCorrect: false, errorTag: "Ton Hatası: Takdir eden bir ifadeyi suçlama olarak okumak.", remediation: "“You have watched it” bir gözlemi onaylar, bir suçu yüklemez. Pasajda sorumluluk ya da kusur tartışması yoktur." },
        { id: "C", text: "establish the speaker's authority by stressing ten years of research", isCorrect: false, errorTag: "Yanlış Cümle Parçası: Sorulan ifade yerine yakındaki başka bir ifadeyi analiz etmek.", remediation: "On yıllık araştırma ilk cümlenin <em>başında</em> geçer ve hemen “but” ile geri plana itilir. Sorulan ifade otoriteyi konuşmacıdan dinleyicilere kaydırır." },
        { id: "D", text: "build common ground by validating the audience's firsthand experience", isCorrect: true }
      ],
      generalRemediation: "Rhetorical choice sorularında üç adım: (1) izleyici kim, (2) izleyicinin olası tutumu ne, (3) bu seçim o tutuma nasıl hitap ediyor? Uzman bir konuşmacının dinleyicinin deneyimini onaylaması tipik bir ortak zemin (common ground) stratejisidir.",
      stepByStepSolution: "1. İzleyici: deneyimli çiftçiler; “laboratuvar uzmanı”na şüpheyle bakabilirler.<br/>2. “none of you needs me to tell you” + “You have watched it” = onların gözlemini doğrular.<br/>3. Son cümle bilimsel ölçümü bu gözlemin <em>destekçisi</em> olarak sunar.<br/>4. Doğru cevap D: dinleyicinin doğrudan deneyimini onaylayarak ortak zemin kurmak."
    },
    {
      id: "sv_eng_r1_3",
      unite: "R1",
      beceri: "Skill 1.A: Purpose",
      zorluk: "hard",
      sureSn: 105,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 1.A — Rhetorical Situation)",
      question: "<strong>Passage</strong> (a museum director writing to the museum's donors): <em>“The exhibition closed three weeks early. Attendance reached barely half of our projection, and I will not dress that number in kinder language. Yet the visitors who did come stayed, on average, twice as long as at any show we have mounted. I share both figures because you have trusted us with your money, and you deserve the whole account before we ask you to trust us again with our next proposal.”</em><br/><br/>Which of the following best describes the director's purpose in presenting both figures?",
      options: [
        { id: "A", text: "To keep the donors' trust by reporting candidly before seeking new support", isCorrect: true },
        { id: "B", text: "To argue that attendance is an unreliable measure of an exhibition's value", isCorrect: false, errorTag: "Aşırı Genelleme: Tek bir karşı veriyi genel bir teze dönüştürmek.", remediation: "Direktör katılım verisini geçersiz saymaz; “I will not dress that number in kinder language” diyerek onu ciddiye alır. Genel bir ölçüm tezi kurulmaz." },
        { id: "C", text: "To apologize for the early closing and promise that no new shows will follow", isCorrect: false, errorTag: "Metinle Çelişki: Son cümledeki “next proposal” ifadesini gözden kaçırmak.", remediation: "Mektup açıkça yeni bir teklif yapılacağını söyler (“before we ask you to trust us again with our next proposal”). Yeni sergi olmayacağı vaadi metinle çelişir." },
        { id: "D", text: "To convince donors that the show succeeded despite its weak attendance", isCorrect: false, errorTag: "Kısmi Okuma: Olumlu veriyi tek başına amaç sanmak.", remediation: "Olumlu veri (“twice as long”) sunulur ama yazar başarısızlığı örtmeyi reddeder. Kendi gerekçesi dürüst ve eksiksiz hesap vermektir: “you deserve the whole account”." }
      ],
      generalRemediation: "Purpose sorusunda yazar amacını açıkça söylüyorsa (“I share both figures because...”) o cümle anahtardır. Çeldiriciler genellikle metindeki tek bir veriyi (olumlu ya da olumsuz) abartır.",
      stepByStepSolution: "1. Olumsuz veri dürüstçe verilir: “I will not dress that number in kinder language”.<br/>2. Olumlu veri “Yet” ile eklenir ama başarı ilanı yapılmaz.<br/>3. Gerekçe cümlesi: güven (“trusted us with your money”) + tam hesap (“the whole account”) + gelecek talep (“next proposal”).<br/>4. Doğru cevap A: yeni destek istemeden önce açık sözlü raporla güveni korumak."
    },

    // ===================== R2 — Reading: Claims and Evidence =====================
    {
      id: "sv_eng_r2_1",
      unite: "R2",
      beceri: "Skill 3.A: Identifying the claim",
      zorluk: "easy",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 3.A — Claims and Evidence)",
      question: "<strong>Passage</strong>: <em>“Cities often treat trees as decoration, to be planted when budgets are generous and cut when they are not. This is a mistake. A mature street tree lowers the surrounding air temperature by several degrees, absorbs stormwater that would otherwise flood drains, and, according to one city's survey, raises nearby property values. Trees are infrastructure, and they should be budgeted as such.”</em><br/><br/>Which statement best expresses the writer's central claim?",
      options: [
        { id: "A", text: "Mature street trees lower the nearby air temperature by several degrees.", isCorrect: false, errorTag: "Kanıt–İddia Karışıklığı: Destekleyici bir veriyi ana iddia sanmak.", remediation: "Sıcaklık bilgisi, iddiayı destekleyen üç kanıttan biridir. Ana iddia kanıtların neyi kanıtladığıdır: ağaçların altyapı olarak bütçelenmesi." },
        { id: "B", text: "Cities should cut trees in lean years to protect more essential services.", isCorrect: false, errorTag: "Tersine Okuma: Yazarın reddettiği görüşü yazarın iddiası sanmak.", remediation: "İlk cümle bu yaklaşımı tanımlar, ikinci cümle “This is a mistake.” diyerek reddeder." },
        { id: "C", text: "Trees should be funded as infrastructure rather than treated as decoration.", isCorrect: true },
        { id: "D", text: "Property values rise in neighborhoods that have many mature street trees.", isCorrect: false, errorTag: "Kanıt–İddia Karışıklığı: Tek bir anketi ana iddia sanmak.", remediation: "Mülk değeri, “according to one city's survey” ile sunulan bir kanıttır; yazarın vardığı sonuç değildir." }
      ],
      generalRemediation: "Ana iddia (claim) tartışılabilir bir görüştür; kanıt ise onu destekleyen veri ve örneklerdir. Pasajın son cümlesi çoğu zaman kanıtları bir sonuca bağlar.",
      stepByStepSolution: "1. Karşı görüş: ağaçlar süs olarak görülüyor (sentence 1).<br/>2. Reddetme: “This is a mistake.”<br/>3. Üç kanıt: sıcaklık, yağmur suyu, mülk değeri.<br/>4. Sonuç: “Trees are infrastructure, and they should be budgeted as such.” Doğru cevap C."
    },
    {
      id: "sv_eng_r2_2",
      unite: "R2",
      beceri: "Skill 3.B: Function of evidence",
      zorluk: "medium",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 3.B — Claims and Evidence)",
      question: "<strong>Passage</strong>: <em>“Supporters of the four-day school week claim that it improves attendance. In the district that adopted it in 2019, attendance did rise—by less than one percentage point—while the share of students reading at grade level fell for three consecutive years.”</em><br/><br/>The writer includes the statistic about reading levels primarily to",
      options: [
        { id: "A", text: "suggest that a small gain in attendance came with a more serious cost", isCorrect: true },
        { id: "B", text: "prove that the shorter week was the only cause of falling reading scores", isCorrect: false, errorTag: "Aşırı İddia: Yan yana sunulan veriyi kesin nedensellik kanıtı saymak.", remediation: "Yazar “while” ile iki eğilimi yan yana koyar; tek neden olduğunu iddia etmez. “Prove” ve “only cause” metnin söylemediği bir kesinlik ekler." },
        { id: "C", text: "support the supporters' claim that the four-day week raises attendance", isCorrect: false, errorTag: "Yön Hatası: Kanıtın hangi iddiaya hizmet ettiğini ters kurmak.", remediation: "Okuma verisi katılımla ilgili değildir; destekçilerin iddiasını güçlendirmez, tersine bedelini gösterir. “did rise—by less than one percentage point” ifadesi de kazanımı küçültür." },
        { id: "D", text: "show that the district reported inaccurate attendance figures in 2019", isCorrect: false, errorTag: "Desteksiz Çıkarım: Metinde olmayan bir veri hatası iddiası.", remediation: "Yazar katılım verisini kabul eder (“attendance did rise”); doğruluğunu sorgulamaz." }
      ],
      generalRemediation: "Kanıtın işlevini sorarken: Bu kanıt hangi iddiaya hizmet ediyor ve o iddiayı güçlendiriyor mu, zayıflatıyor mu? “while” gibi karşıtlık bağlaçları kanıtın bir bedeli ya da gerilimi gösterdiğini işaret eder.",
      stepByStepSolution: "1. Destekçilerin iddiası: katılım artar.<br/>2. Yazar kabul eder ama küçültür: “less than one percentage point”.<br/>3. “while” ile ciddi bir olumsuz eğilim eklenir: okuma seviyesi üç yıl düşer.<br/>4. Doğru cevap A: küçük kazanımın daha ağır bir bedelle geldiğini düşündürmek."
    },
    {
      id: "sv_eng_r2_3",
      unite: "R2",
      beceri: "Skill 3.C: Qualifying a claim",
      zorluk: "hard",
      sureSn: 105,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 3.C — Claims and Evidence)",
      question: "<strong>Passage</strong>: <em>“Remote work, in many offices, has not lowered productivity; for some kinds of focused tasks, it may even have raised it. But the evidence is thinner for work that depends on chance conversations, and a firm that sends everyone home permanently is betting on data that does not yet exist.”</em><br/><br/>The phrases “in many offices” and “for some kinds of focused tasks” primarily function to",
      options: [
        { id: "A", text: "undermine the writer's claim by admitting that remote work lowers output", isCorrect: false, errorTag: "Niteleme–Reddetme Karışıklığı: Sınırlamayı iddiadan vazgeçme sanmak.", remediation: "Bu ifadeler iddiayı geri almaz, yalnızca kapsamını daraltır. Yazar uzaktan çalışmanın verimliliği düşürdüğünü söylemez." },
        { id: "B", text: "introduce a counterargument that the final sentence goes on to refute", isCorrect: false, errorTag: "Yapı Hatası: İkinci cümleyi çürütme sanmak.", remediation: "İkinci cümle (“But the evidence is thinner...”) ilk iddiayı çürütmez; onu ek bir sınırla daha da niteler. Bu ifadeler de karşı argüman değil, yazarın kendi iddiasının parçasıdır." },
        { id: "C", text: "appeal to the reader's feelings about the stress of office conversations", isCorrect: false, errorTag: "Yanlış Strateji Etiketi: Mantıksal niteleyiciyi duygusal çağrı sanmak.", remediation: "Pasajda stres ya da duygu dili yoktur; “in many”, “some”, “may” kanıtın gücünü ölçen mantıksal sınırlayıcılardır." },
        { id: "D", text: "limit the scope of the claim so that it does not go beyond the evidence", isCorrect: true }
      ],
      generalRemediation: "Qualifier (niteleyici) = “many, some, may, often, likely” gibi kelimelerle iddianın kapsamını kanıtın taşıyabileceği ölçüye çekmek. Bu, iddiayı zayıflatmaz; güvenilirliğini artırır.",
      stepByStepSolution: "1. Niteleyicisiz hâl: “Remote work has not lowered productivity; it has raised it.” (kanıtın ötesinde).<br/>2. “in many offices” ve “for some kinds of focused tasks” kapsamı daraltır; “may even” kesinliği yumuşatır.<br/>3. İkinci cümle, kanıtın zayıf olduğu alanı açıkça belirterek aynı mantığı sürdürür.<br/>4. Doğru cevap D: iddianın kapsamını kanıtla sınırlamak."
    },

    // ===================== R3 — Reading: Reasoning and Organization =====================
    {
      id: "sv_eng_r3_1",
      unite: "R3",
      beceri: "Skill 5.B: Transitions",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 5.B — Reasoning and Organization)",
      question: "<strong>Passage</strong>: <em>“The new bus route was designed to cut travel times for commuters in the northern suburbs. Nevertheless, ridership on the route has fallen every month since it opened.”</em><br/><br/>The word “Nevertheless” signals that the second sentence",
      options: [
        { id: "A", text: "gives an example that illustrates the claim made in the first sentence", isCorrect: false, errorTag: "Geçiş İşlevi Hatası: Karşıtlık bağlacını örnekleme bağlacı sanmak.", remediation: "Örnek vermek için “For example / For instance” kullanılır. “Nevertheless” beklentiye ters düşen bir bilgiyi işaret eder." },
        { id: "B", text: "explains the cause of the route design described in the first sentence", isCorrect: false, errorTag: "Geçiş İşlevi Hatası: Karşıtlığı neden–sonuç sanmak.", remediation: "Neden açıklayan geçişler “because / since” gibidir. Yolcu sayısının düşmesi tasarımın nedeni değildir." },
        { id: "C", text: "restates the information in the first sentence in more specific terms", isCorrect: false, errorTag: "Geçiş İşlevi Hatası: Karşıtlığı yeniden ifade etme sanmak.", remediation: "Yeniden ifade için “In other words” kullanılır. İkinci cümle yeni ve ters yönde bir bilgi verir." },
        { id: "D", text: "reports a result that runs counter to the route's intended purpose", isCorrect: true }
      ],
      generalRemediation: "Geçiş kelimeleri cümleler arasındaki mantıksal ilişkiyi kurar: karşıtlık (however, nevertheless), örnek (for example), neden (because), sonuç (therefore), yeniden ifade (in other words).",
      stepByStepSolution: "1. Cümle 1: rotanın amacı (seyahat süresini kısaltmak → yolcu çekmek beklenir).<br/>2. Cümle 2: yolcu sayısı her ay düşüyor.<br/>3. “Nevertheless” = buna rağmen; beklenti ile sonuç çelişir.<br/>4. Doğru cevap D."
    },
    {
      id: "sv_eng_r3_2",
      unite: "R3",
      beceri: "Skill 5.C: Method of development",
      zorluk: "medium",
      sureSn: 105,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 5.C — Reasoning and Organization)",
      question: "<strong>Passage</strong>: <em>“When my grandmother learned to drive at sixty-three, she practiced in an empty parking lot every Sunday for a year. She never drove on a highway, but she drove herself to the market, the clinic, and her sister's house until she was ninety. Her story is not unusual. Surveys of older adults suggest that the ability to travel independently is one of the strongest predictors of whether they remain socially connected. Policies that help older people keep driving safely, or reach shops and clinics without driving at all, are therefore not luxuries but public health measures.”</em><br/><br/>Which of the following best describes the organization of the passage?",
      options: [
        { id: "A", text: "A general claim is stated first and then supported by unrelated anecdotes.", isCorrect: false, errorTag: "Sıra Hatası: Tümevarımsal yapıyı tümdengelimsel sanmak.", remediation: "Genel iddia sonda gelir (“are therefore...”). Pasajda yalnızca bir anekdot vardır ve doğrudan iddiaya bağlanır." },
        { id: "B", text: "A personal anecdote is broadened through survey evidence into a policy claim.", isCorrect: true },
        { id: "C", text: "Two opposing policies are compared, and neither is judged to be effective.", isCorrect: false, errorTag: "Uydurma Yapı: Metinde olmayan bir karşılaştırma görmek.", remediation: "Pasaj iki politikayı karşılaştırmaz ve hiçbirini reddetmez; “driving safely” ve “without driving” birlikte savunulan seçeneklerdir." },
        { id: "D", text: "A chronological history of driving laws explains a recent change in policy.", isCorrect: false, errorTag: "Yüzeysel Okuma: Kişisel zaman çizgisini yasal tarihçe sanmak.", remediation: "“sixty-three... ninety” bir kişinin hayatına aittir; hiçbir trafik yasası ya da politika değişikliği anlatılmaz." }
      ],
      generalRemediation: "Organizasyon sorusunda her cümlenin işlevini etiketle (anekdot, geçiş, kanıt, iddia) ve sıralamayı oku. “Her story is not unusual” gibi köprü cümleler özelden genele geçişi işaret eder.",
      stepByStepSolution: "1. Sentences 1–2: kişisel anekdot (büyükanne).<br/>2. Sentence 3: köprü — “Her story is not unusual.”<br/>3. Sentence 4: genel kanıt (surveys).<br/>4. Sentence 5: politika iddiası, “therefore” ile.<br/>5. Doğru cevap B: anekdot → anket kanıtı → politika iddiası."
    },
    {
      id: "sv_eng_r3_3",
      unite: "R3",
      beceri: "Skill 5.A: Line of reasoning",
      zorluk: "hard",
      sureSn: 110,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 5.A — Reasoning and Organization)",
      question: "<strong>Passage</strong>: <em>“(1) Many students assume that rereading their notes is an effective way to study. (2) It certainly feels effective: each pass through the material is smoother than the last. (3) But that smoothness is familiarity, not memory. (4) In experiments, students who tested themselves on a text remembered far more a week later than students who reread it, even though the rereaders predicted they would do better. (5) The method that feels easiest, in other words, may be the one that teaches least.”</em><br/><br/>Sentence 3 contributes to the line of reasoning primarily by",
      options: [
        { id: "A", text: "offering experimental evidence that confirms the assumption in sentence 1", isCorrect: false, errorTag: "İşlev Kayması: Sentence 4'ün işlevini sentence 3'e vermek.", remediation: "Deney kanıtı sentence 4'tedir ve sentence 1'deki varsayımı <em>çürütür</em>, doğrulamaz." },
        { id: "B", text: "raising a new topic that the passage then abandons in sentences 4 and 5", isCorrect: false, errorTag: "Bağlantı Kaçırma: Cümleler arası mantık zincirini görmemek.", remediation: "Familiarity–memory ayrımı sentence 4'teki deneyle test edilir ve sentence 5'te sonuca bağlanır; konu terk edilmez." },
        { id: "C", text: "reinterpreting the experience in sentence 2 to set up the evidence in 4", isCorrect: true },
        { id: "D", text: "summarizing a conclusion that sentence 5 then limits with an exception", isCorrect: false, errorTag: "Yapı Hatası: Sonuç cümlesini istisna sanmak.", remediation: "Sentence 5 “in other words” ile argümanın sonucunu yeniden ifade eder; bir istisna getirmez. Sentence 3 ise sonuç değil, bir yeniden yorumdur." }
      ],
      generalRemediation: "Line of reasoning sorularında bir cümlenin işlevini önceki ve sonraki cümleyle ilişkisi üzerinden tanımla. “But” ile başlayan bir cümle çoğu zaman önceki gözlemi yeniden yorumlar ve gelecek kanıta zemin hazırlar.",
      stepByStepSolution: "1. Sentence 2: deneyim — tekrar okumak “smoother” hissettirir.<br/>2. Sentence 3: bu his yeniden yorumlanır — familiarity ≠ memory.<br/>3. Sentence 4: deney bu ayrımı destekler.<br/>4. Sentence 5: sonuç.<br/>5. Doğru cevap C: sentence 2'deki deneyimi yeniden yorumlayıp sentence 4'teki kanıta zemin hazırlar."
    },

    // ===================== R4 — Reading: Style =====================
    {
      id: "sv_eng_r4_1",
      unite: "R4",
      beceri: "Skill 7.A: Diction and connotation",
      zorluk: "easy",
      sureSn: 70,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 7.A — Style)",
      question: "<strong>Passage</strong> (from a newspaper column): <em>“In its announcement, the company described the closing of three factories and the loss of 1,200 jobs as a ‘strategic realignment of resources.’”</em><br/><br/>The columnist most likely quotes the company's phrase in order to",
      options: [
        { id: "A", text: "draw attention to how the wording softens the human cost of the closures", isCorrect: true },
        { id: "B", text: "show that the columnist accepts the company's reasons for the closures", isCorrect: false, errorTag: "Ton Kaçırma: Eleştirel alıntıyı onay sanmak.", remediation: "Köşe yazarı somut kaybı (“three factories”, “1,200 jobs”) soyut ifadeyle yan yana koyar; bu karşıtlık onay değil, eleştiri üretir." },
        { id: "C", text: "define a technical business term that readers might not understand", isCorrect: false, errorTag: "İşlev Hatası: Alıntıyı tanım sanmak.", remediation: "Yazar ifadeyi tanımlamaz; aksine ifadenin neyi gizlediğini (iş kaybı) önce kendisi söyler." },
        { id: "D", text: "suggest that the company has denied closing any of its factories", isCorrect: false, errorTag: "Aşırı Çıkarım: Örtmeyi inkâr sanmak.", remediation: "Şirket kapanışı inkâr etmez, onu yumuşak bir dille adlandırır (euphemism). İnkâr ile örtmeceli dil farklıdır." }
      ],
      generalRemediation: "Örtmece (euphemism) olumsuz bir gerçeği nötr ya da olumlu kelimelerle anlatır. Yazar böyle bir ifadeyi tırnak içinde, somut gerçeğin yanına koyduğunda amaç genellikle bu kontrastı göstermektir.",
      stepByStepSolution: "1. Somut gerçek: üç fabrika kapanıyor, 1.200 iş kayboluyor.<br/>2. Şirketin ifadesi: “strategic realignment of resources” — insanî kayıp hiç geçmez.<br/>3. Yan yana koyma + tırnak = dikkat çekme ve örtük eleştiri.<br/>4. Doğru cevap A."
    },
    {
      id: "sv_eng_r4_2",
      unite: "R4",
      beceri: "Skill 7.B: Tone and shifts",
      zorluk: "medium",
      sureSn: 80,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 7.B — Style)",
      question: "<strong>Passage</strong>: <em>“For the first hour, the town meeting was almost festive: neighbors traded jokes, someone passed around a plate of cookies, and the mayor thanked everyone by name. Then the engineer stood up with the flood maps. No one reached for a cookie after that.”</em><br/><br/>Which of the following best describes the shift in tone in the passage?",
      options: [
        { id: "A", text: "From hostile to reconciled, as neighbors settle their disagreements", isCorrect: false, errorTag: "Ters Yön: Değişimin yönünü tersine çevirmek.", remediation: "Başlangıç düşmanca değil “almost festive”dir; son durum uzlaşma değil, sessiz bir endişedir." },
        { id: "B", text: "From formal to casual, as the mayor relaxes the rules of the meeting", isCorrect: false, errorTag: "Yanlış Eksen: Resmiyet eksenini ruh hâli ekseniyle karıştırmak.", remediation: "Pasaj resmiyet kurallarından söz etmez. Değişim, toplantının havasıyla ilgilidir: neşeden ciddiyete." },
        { id: "C", text: "From lighthearted to somber, as the danger of flooding becomes clear", isCorrect: true },
        { id: "D", text: "From confused to confident, as the engineer explains the flood maps", isCorrect: false, errorTag: "Ayrıntı Atlama: Kapanış görüntüsünün imasını kaçırmak.", remediation: "“No one reached for a cookie after that” güven değil, tedirginlik ima eder. Başlangıçta da bir kafa karışıklığı yoktur." }
      ],
      generalRemediation: "Ton değişimi sorularında (1) değişimden önceki ve sonraki tonu ayrı ayrı adlandır, (2) değişimi tetikleyen anı bul (“Then...”). Somut bir ayrıntı (kurabiye) çoğu zaman tonu dolaylı olarak taşır.",
      stepByStepSolution: "1. Önce: “almost festive”, şakalar, kurabiye → lighthearted.<br/>2. Tetikleyici: “Then the engineer stood up with the flood maps.”<br/>3. Sonra: “No one reached for a cookie” → somber, kaygılı.<br/>4. Doğru cevap C."
    },
    {
      id: "sv_eng_r4_3",
      unite: "R4",
      beceri: "Skill 7.A: Syntax",
      zorluk: "hard",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 7.A — Style)",
      question: "<strong>Passage</strong>: <em>“We have built roads that let us cross a state in an afternoon, networks that let us speak to a stranger on another continent in an instant, and machines that answer almost any question we think to ask. We have not built more hours in the day.”</em><br/><br/>The brevity of the final sentence, following the long first sentence, primarily serves to",
      options: [
        { id: "A", text: "summarize the achievements in the first sentence in simpler language", isCorrect: false, errorTag: "İşlev Hatası: Karşıtlığı özet sanmak.", remediation: "Son cümle başarıları özetlemez; “have not built” ile onların ulaşamadığı bir şeyi söyler." },
        { id: "B", text: "emphasize a limit that none of the listed achievements has overcome", isCorrect: true },
        { id: "C", text: "introduce a new achievement that the writer regards as most important", isCorrect: false, errorTag: "Olumsuzluğu Kaçırma: “not” kelimesini atlamak.", remediation: "“We have not built” bir başarı değil, bir eksikliktir. Yeni bir başarı tanıtılmaz." },
        { id: "D", text: "suggest that the writer doubts that the listed achievements are real", isCorrect: false, errorTag: "Aşırı Çıkarım: Sınırı vurgulamayı inkâr sanmak.", remediation: "Yazar başarıları sorgulamaz (“We have built...”); yalnızca zamanı çoğaltamadığımızı vurgular." }
      ],
      generalRemediation: "Sözdizimi (syntax) sorularında cümle uzunluğu karşıtlığına dikkat et: uzun, birikimli (cumulative) bir listeden sonra gelen kısa cümle vurgu yaratır ve çoğu zaman listeyi tersine çeviren bir gerçeği öne çıkarır. Paralel yapı (“We have built... / We have not built...”) bu karşıtlığı güçlendirir.",
      stepByStepSolution: "1. Cümle 1: üç paralel öğeli uzun liste — teknolojik başarılar.<br/>2. Cümle 2: aynı yapı, olumsuz: “We have not built more hours in the day.”<br/>3. Kısalık + paralellik = ani durma ve vurgu: tüm bu başarılar zamanın sınırını aşamamıştır.<br/>4. Doğru cevap B."
    },

    // ===================== W1 — Writing: Rhetorical Situation =====================
    {
      id: "sv_eng_w1_1",
      unite: "W1",
      beceri: "Skill 2.A: Audience-appropriate choices",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 2.A — Rhetorical Situation)",
      question: "A student is writing an email to the school principal to request permission to start a robotics club. Which of the following sentences is most appropriate as the opening of the email, given its audience and purpose?",
      options: [
        { id: "A", text: "Hey! So a bunch of us really want a robotics club. Can we do it?", isCorrect: false, errorTag: "Register Hatası: Resmî izleyiciye gündelik dil kullanmak.", remediation: "Müdüre yazılan bir talep e-postası resmî bir register ister; “Hey! So a bunch of us” arkadaş mesajı dilidir." },
        { id: "B", text: "Robotics is a field that has grown rapidly since the twentieth century.", isCorrect: false, errorTag: "Amaç Kaçırma: Talebi geciktiren genel giriş.", remediation: "Bu cümle bir deneme girişi gibidir; e-postanın amacı (izin istemek) hiç belirtilmez." },
        { id: "C", text: "I am writing to request your approval to start a robotics club this term.", isCorrect: true },
        { id: "D", text: "Many schools have robotics clubs, and it is unfair that ours still does not.", isCorrect: false, errorTag: "Ton Hatası: Karar vericiyi suçlayan saldırgan açılış.", remediation: "İzin istenen kişiye “unfair” diye başlamak izleyiciyi savunmaya iter; amaç ikna olduğunda ton işbirlikçi olmalıdır." }
      ],
      generalRemediation: "Writing sorularında “audience and purpose” ifadesini gör: önce izleyiciyi (müdür: resmî, karar verici), sonra amacı (izin istemek) belirle; bu ikisine birden uyan seçeneği seç.",
      stepByStepSolution: "1. İzleyici: okul müdürü → resmî ve saygılı dil.<br/>2. Amaç: izin istemek → açılışta açıkça belirtilmeli.<br/>3. Bu iki ölçüte birlikte uyan tek cümle resmî ve doğrudan talep cümlesidir.<br/>4. Doğru cevap C."
    },
    {
      id: "sv_eng_w1_2",
      unite: "W1",
      beceri: "Skill 2.A: Purpose-driven selection",
      zorluk: "medium",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 2.A — Rhetorical Situation)",
      question: "A student is drafting a brochure for parents of incoming ninth graders. The student wants to convince these parents that the school's after-school math tutoring program is worth joining. Which sentence would best accomplish this goal?",
      options: [
        { id: "A", text: "Last year, ninth graders who came twice a week raised their math grades by nearly a full letter.", isCorrect: true },
        { id: "B", text: "Tutoring sessions are held in Room 214, which was fully renovated during the summer break.", isCorrect: false, errorTag: "Lojistik–İkna Karışıklığı: Bilgilendirici ama ikna etmeyen ayrıntı.", remediation: "Oda bilgisi broşürde yer alabilir ama programın <em>değerini</em> kanıtlamaz. Amaç velileri ikna etmektir." },
        { id: "C", text: "Tutors are chosen each spring from among the juniors and seniors who submit applications.", isCorrect: false, errorTag: "Zayıf Kanıt: Amaca dolaylı hizmet eden süreç bilgisi.", remediation: "Seçim süreci bir miktar güven verebilir ama programın sonuç ürettiğini göstermez; velilerin asıl sorusu “işe yarıyor mu?”dur." },
        { id: "D", text: "Many people believe that education is the most important investment a society can make.", isCorrect: false, errorTag: "Genel Geçer İfade: Spesifik amaca bağlanmayan klişe.", remediation: "Bu cümle herhangi bir eğitim metnine uyar; bu programa özgü hiçbir şey söylemez." }
      ],
      generalRemediation: "“Which sentence best accomplishes this goal?” sorularında soru kökündeki hedefi kelime kelime oku (convince + parents + worth joining). Hedefe en doğrudan hizmet eden, izleyicinin önemsediği somut sonucu veren seçenektir.",
      stepByStepSolution: "1. İzleyici: veliler — çocuklarının başarısını önemser.<br/>2. Amaç: programın değerli olduğuna ikna etmek.<br/>3. Ölçülebilir başarı sonucu (not artışı) bu iki ölçüte doğrudan hizmet eder.<br/>4. Doğru cevap A."
    },
    {
      id: "sv_eng_w1_3",
      unite: "W1",
      beceri: "Skill 2.B: Adding a sentence for the audience",
      zorluk: "hard",
      sureSn: 95,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 2.B — Rhetorical Situation)",
      question: "A student is writing to the city council, which is reviewing budget cuts, to argue that the Elm Street community garden should be kept open. The draft describes how the garden brings neighbors together and supplies fresh vegetables to a nearby food bank. The student is considering adding this sentence: <em>“Because volunteers provide all of the labor, the garden costs the city only about 2,000 dollars a year in water.”</em> Should the student add this sentence?",
      options: [
        { id: "A", text: "Yes, because it shows that the garden is popular with the city's volunteers.", isCorrect: false, errorTag: "Doğru Karar, Yanlış Gerekçe: Cümlenin asıl işlevini kaçırmak.", remediation: "Gönüllülerden söz edilir ama cümlenin vurgusu popülerlik değil, maliyettir (“costs the city only about 2,000 dollars”). Gerekçe izleyicinin bütçe kaygısına bağlanmalı." },
        { id: "B", text: "No, because cost details distract from the argument about community benefit.", isCorrect: false, errorTag: "İzleyiciyi Unutma: Bağlamdaki bütçe incelemesini göz ardı etmek.", remediation: "Meclis tam olarak bütçe kesintilerini inceliyor; maliyet bilgisi dikkat dağıtmaz, izleyicinin karar ölçütüne doğrudan yanıt verir." },
        { id: "C", text: "No, because the council is likely to see any cost as a reason to cut the garden.", isCorrect: false, errorTag: "Yanlış Varsayım: Düşük maliyeti dezavantaj saymak.", remediation: "“only about 2,000 dollars” düşük bir rakamı vurgular; bütçe yapan bir meclis için bu, bahçeyi korumanın ucuz olduğunu gösteren bir avantajdır." },
        { id: "D", text: "Yes, because it speaks to the council's budget concerns by showing a low cost.", isCorrect: true }
      ],
      generalRemediation: "“Should the writer add this sentence?” sorularında hem karar (Yes/No) hem gerekçe doğru olmalı. Gerekçeyi her zaman soru kökündeki izleyici ve bağlamla (burada: budget cuts) karşılaştır.",
      stepByStepSolution: "1. İzleyici: bütçe kesintilerini inceleyen meclis.<br/>2. Taslak sosyal faydayı anlatıyor ama meclisin ana ölçütü (maliyet) eksik.<br/>3. Eklenecek cümle düşük maliyeti gösterir → karar: Yes.<br/>4. Doğru gerekçe meclisin bütçe kaygısına yanıt vermesidir. Doğru cevap D."
    },

    // ===================== W2 — Writing: Claims and Evidence =====================
    {
      id: "sv_eng_w2_1",
      unite: "W2",
      beceri: "Skill 4.A: Writing a defensible thesis",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 4.A — Claims and Evidence)",
      question: "A student is writing an argumentative essay about whether high schools should start classes later in the morning. Which of the following would best serve as the essay's thesis statement?",
      options: [
        { id: "A", text: "Many high schools in the country begin classes before eight o'clock in the morning.", isCorrect: false, errorTag: "Olgu–Tez Karışıklığı: Tartışılamaz bir bilgiyi tez sanmak.", remediation: "Bu bir olgudur; kimse “karşı” çıkamaz. Tez, savunulabilir (defensible) ve tartışılabilir bir konum almalıdır." },
        { id: "B", text: "High schools should start later because it would improve students' sleep and grades.", isCorrect: true },
        { id: "C", text: "This essay will discuss school start times and what different people think about them.", isCorrect: false, errorTag: "Duyuru Tezi: Konum almadan konuyu duyurmak.", remediation: "“This essay will discuss” bir plan duyurusudur; yazarın konumunu (should / should not) belirtmez." },
        { id: "D", text: "Sleep is important for everyone, whether they are teenagers, adults, or young children.", isCorrect: false, errorTag: "Kapsam Hatası: Konuya bağlanmayan aşırı geniş genelleme.", remediation: "Uyku hakkında genel bir doğru, okul başlama saati tartışmasında bir konum almaz." }
      ],
      generalRemediation: "Güçlü tez = savunulabilir konum + akıl yürütmenin yönü (because...). Olgu, duyuru ve aşırı geniş genelleme tez değildir.",
      stepByStepSolution: "1. Konum alan tek seçenek: “should start later”.<br/>2. Gerekçe (line of reasoning) içerir: “because it would improve... sleep and grades”.<br/>3. Diğerleri olgu, duyuru ya da genel geçer ifadedir.<br/>4. Doğru cevap B."
    },
    {
      id: "sv_eng_w2_2",
      unite: "W2",
      beceri: "Skill 4.B: Selecting relevant evidence",
      zorluk: "medium",
      sureSn: 70,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 4.B — Claims and Evidence)",
      question: "In an essay, a student claims that the town's new recycling program has reduced the amount of waste the town produces. Which piece of evidence would most directly support this claim?",
      options: [
        { id: "A", text: "The program was approved by a 5–2 vote of the town council in March.", isCorrect: false, errorTag: "Alakasız Kanıt: Programın kabul sürecini sonucu sanmak.", remediation: "Oylama sonucu programın onaylandığını gösterir, atığı azalttığını değil." },
        { id: "B", text: "Residents received blue bins and a printed guide to sorting their waste.", isCorrect: false, errorTag: "Girdi–Çıktı Karışıklığı: Uygulama adımını sonuç sanmak.", remediation: "Kutu ve rehber dağıtılması programın <em>yapıldığını</em> gösterir; atık miktarının düştüğünü ölçmez." },
        { id: "C", text: "Several neighboring towns have asked about adopting a similar program.", isCorrect: false, errorTag: "Dolaylı Kanıt: İlgiyi etkililik sanmak.", remediation: "Komşu kasabaların ilgisi itibar gösterir; bu kasabadaki atık miktarı hakkında veri vermez." },
        { id: "D", text: "In the first year, the tonnage sent to the town landfill fell by 18 percent.", isCorrect: true }
      ],
      generalRemediation: "Kanıt seçerken iddiadaki ölçülebilir değişkeni bul (burada: atık miktarı) ve o değişkeni doğrudan ölçen veriyi seç. Süreç, onay ve itibar bilgileri dolaylıdır.",
      stepByStepSolution: "1. İddia: program atığı <em>azalttı</em>.<br/>2. Gerekli kanıt: atık miktarında önce–sonra değişim.<br/>3. Çöp sahasına giden tonajın %18 düşmesi bunu doğrudan ölçer.<br/>4. Doğru cevap D."
    },
    {
      id: "sv_eng_w2_3",
      unite: "W2",
      beceri: "Skill 4.C: Qualifying a claim",
      zorluk: "hard",
      sureSn: 80,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 4.C — Claims and Evidence)",
      question: "A student's draft contains this claim: <em>“Banning phones in classrooms will improve every student's concentration.”</em> A peer reviewer says the claim is overstated. Which revision best qualifies the claim while preserving the student's position?",
      options: [
        { id: "A", text: "Banning phones in classrooms is likely to help many students concentrate.", isCorrect: true },
        { id: "B", text: "Banning phones in classrooms may or may not affect students in various ways.", isCorrect: false, errorTag: "Konumu Kaybetme: Nitelemeyi belirsizliğe dönüştürmek.", remediation: "“may or may not... in various ways” hiçbir konum almaz; iddia nitelenmez, ortadan kalkar." },
        { id: "C", text: "Banning phones in classrooms will certainly improve all students' focus.", isCorrect: false, errorTag: "Ters Yön: Abartıyı azaltmak yerine artırmak.", remediation: "“certainly” ve “all” iddiayı daha da mutlak yapar; hakem eleştirisini derinleştirir." },
        { id: "D", text: "Some people think phone bans are a good idea, but others disagree.", isCorrect: false, errorTag: "Konumu Kaybetme: Kendi iddiası yerine görüşleri aktarmak.", remediation: "Bu cümle yazarın konumunu siler ve yalnızca tartışmayı özetler." }
      ],
      generalRemediation: "Niteleme (qualification) = mutlak kelimeleri (every, all, will) ölçülü kelimelerle (many, likely, often) değiştirerek konumu korumak. Konumu yok eden ya da abartıyı artıran revizyonlar yanlıştır.",
      stepByStepSolution: "1. Sorun: “will” ve “every” mutlak.<br/>2. Gerekli değişim: “likely” + “many” — kapsam ve kesinlik ölçülü hâle gelir.<br/>3. Konum korunur: yasak hâlâ olumlu bir adım olarak savunulur.<br/>4. Doğru cevap A."
    },

    // ===================== W3 — Writing: Reasoning and Organization =====================
    {
      id: "sv_eng_w3_1",
      unite: "W3",
      beceri: "Skill 6.B: Choosing a transition",
      zorluk: "easy",
      sureSn: 50,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 6.B — Reasoning and Organization)",
      question: "Which choice best completes the text with the most logical transition?<br/><br/><em>“Volunteers planted two hundred young trees along the river in April. ______, by October nearly a third of them had died during the summer drought.”</em>",
      options: [
        { id: "A", text: "However", isCorrect: true },
        { id: "B", text: "Similarly", isCorrect: false, errorTag: "Benzerlik–Karşıtlık Karışıklığı.", remediation: "“Similarly” iki benzer fikri bağlar. Ağaç dikmek ile ağaçların ölmesi benzer değil, beklentiye ters düşen iki olaydır." },
        { id: "C", text: "For example", isCorrect: false, errorTag: "Örnekleme Hatası.", remediation: "İkinci cümle birinci cümlenin bir örneği değildir; dikimden sonra ne olduğunu, beklentinin tersini anlatır." },
        { id: "D", text: "Therefore", isCorrect: false, errorTag: "Sahte Nedensellik: Dikimi ölümün nedeni yapmak.", remediation: "“Therefore” dikimin ağaçların ölmesine yol açtığını ima eder; cümlenin kendisi nedeni “the summer drought” olarak verir." }
      ],
      generalRemediation: "Geçiş sorularında iki cümlenin ilişkisini önce kendi sözlerinle adlandır (benzer mi, örnek mi, sonuç mu, karşıt mı?), sonra o ilişkiyi kuran kelimeyi seç.",
      stepByStepSolution: "1. Cümle 1: 200 ağaç dikildi (beklenti: büyüyecekler).<br/>2. Cümle 2: üçte biri kuraklıktan öldü.<br/>3. İlişki: beklentiye karşıtlık.<br/>4. Doğru cevap A (However)."
    },
    {
      id: "sv_eng_w3_2",
      unite: "W3",
      beceri: "Skill 6.A: Sentence placement",
      zorluk: "medium",
      sureSn: 80,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 6.A — Reasoning and Organization)",
      question: "<em>“(1) Our school cafeteria throws away roughly forty kilograms of food each day. (2) Much of this waste comes from trays of untouched side dishes. (3) A pilot program last spring let students choose their side dishes instead of receiving them automatically. (4) During the pilot, daily food waste dropped to twenty-five kilograms.”</em><br/><br/>The writer wants to add this sentence: <em>“Students reported that they often left the vegetables untouched because the vegetables were placed on every tray whether they wanted them or not.”</em> Where would the sentence best be placed?",
      options: [
        { id: "A", text: "Before sentence 1", isCorrect: false, errorTag: "Bağlam Eksikliği: Açıklamayı açıklanan şeyden önce koymak.", remediation: "Cümle “the vegetables” ve israftan söz eder; okur henüz israf sorununu (sentence 1) görmeden bu açıklama anlamsız kalır." },
        { id: "B", text: "After sentence 1", isCorrect: false, errorTag: "Erken Yerleştirme: Ara adımı atlamak.", remediation: "Sentence 1 genel miktarı verir; dokunulmamış yan yemekler fikri sentence 2'de gelir. Ek cümle tam o fikri açıklar, bu yüzden ondan sonra gelmelidir." },
        { id: "C", text: "After sentence 2", isCorrect: true },
        { id: "D", text: "After sentence 4", isCorrect: false, errorTag: "Sonuçtan Sonra Neden: Mantık zincirini bozmak.", remediation: "Sentence 4 pilot programın sonucudur; sorunun nedenini sonuçtan sonra vermek çözüm → neden sırasını ters çevirir." }
      ],
      generalRemediation: "Cümle yerleştirme sorularında eklenecek cümlenin neye <em>bağlandığını</em> bul (burada: “untouched side dishes” → neden dokunulmadığı). Cümle, açıkladığı fikrin hemen ardından gelmelidir.",
      stepByStepSolution: "1. Eklenecek cümle: sebzelerin neden dokunulmadan kaldığını açıklar.<br/>2. Bu, sentence 2'deki “untouched side dishes” fikrinin açıklamasıdır.<br/>3. Ayrıca sentence 3'teki çözümü (seçme hakkı) gerekçelendirir.<br/>4. Doğru cevap C: sentence 2'den sonra."
    },
    {
      id: "sv_eng_w3_3",
      unite: "W3",
      beceri: "Skill 6.A: Commentary linking evidence to claim",
      zorluk: "hard",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 6.A — Reasoning and Organization)",
      question: "A student argues that the public library's extended weekend hours should be made permanent. The paragraph presents this evidence: <em>“During the six-week trial, Saturday visits rose from 300 to 750, and most of the new visitors were students who work on weekdays.”</em> Which sentence, placed immediately after the evidence, best explains how it supports the claim?",
      options: [
        { id: "A", text: "The library also hosted a well-attended author event during the trial period.", isCorrect: false, errorTag: "Yeni Kanıt ≠ Yorum: Açıklama yerine başka bir bilgi eklemek.", remediation: "Bu cümle yeni ve ilgisiz bir bilgi ekler; mevcut kanıtın iddiayı <em>nasıl</em> desteklediğini açıklamaz." },
        { id: "B", text: "These numbers suggest the new hours reach people whom the old hours excluded.", isCorrect: true },
        { id: "C", text: "Saturday visits more than doubled, rising from 300 to 750 during the trial.", isCorrect: false, errorTag: "Özetleme Tuzağı: Kanıtı yorum yerine tekrar etmek.", remediation: "Bu cümle kanıtı yeniden söyler; commentary kanıtın <em>anlamını</em> ve iddiayla bağını açıklamalıdır." },
        { id: "D", text: "Libraries have been important public institutions for more than a century.", isCorrect: false, errorTag: "Genel Geçer İfade: Kanıta ve iddiaya bağlanmayan klişe.", remediation: "Kütüphanelerin tarihî önemi, bu ek saatlerin kalıcı olması gerektiğine dair bir gerekçe sunmaz." }
      ],
      generalRemediation: "Commentary = kanıt + “bu ne anlama geliyor ve iddiayı neden destekliyor?” AP rubriğinde puan, kanıtı tekrar etmekten değil, kanıtı iddiaya bağlayan akıl yürütmeden gelir.",
      stepByStepSolution: "1. İddia: hafta sonu saatleri kalıcı olmalı.<br/>2. Kanıt: ziyaret artışı + yeni ziyaretçilerin hafta içi çalışan öğrenciler olması.<br/>3. Bağlantı: mevcut saatler bu grubu dışarıda bırakıyordu; yeni saatler onlara ulaşıyor.<br/>4. Doğru cevap B."
    },

    // ===================== W4 — Writing: Style =====================
    {
      id: "sv_eng_w4_1",
      unite: "W4",
      beceri: "Skill 8.A: Precise word choice",
      zorluk: "easy",
      sureSn: 45,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 8.A — Style)",
      question: "The writer wants a word that conveys the researcher's careful, deliberate approach. Which choice best completes the sentence?<br/><br/><em>“The researcher ______ recorded the temperature of each sample at five-minute intervals for six hours.”</em>",
      options: [
        { id: "A", text: "quickly", isCorrect: false, errorTag: "Anlam Uyumsuzluğu: Hız ile özeni karıştırmak.", remediation: "“quickly” hızı vurgular; hedef özen ve titizliktir (careful, deliberate)." },
        { id: "B", text: "casually", isCorrect: false, errorTag: "Ters Çağrışım.", remediation: "“casually” gelişigüzellik çağrıştırır; istenen anlamın tam tersidir." },
        { id: "C", text: "occasionally", isCorrect: false, errorTag: "Bağlamla Çelişki.", remediation: "“occasionally” ara sıra demektir; cümle düzenli aralıklarla (“at five-minute intervals”) ölçüm anlatır." },
        { id: "D", text: "meticulously", isCorrect: true }
      ],
      generalRemediation: "Kelime seçimi sorularında soru kökündeki hedef sıfatları (careful, deliberate) not al ve bunları en kesin karşılayan kelimeyi seç; cümlenin geri kalanıyla çelişen kelimeleri ele.",
      stepByStepSolution: "1. Hedef: careful + deliberate.<br/>2. Bağlam: düzenli, uzun süreli ölçüm.<br/>3. “meticulously” = son derece titiz ve özenli biçimde.<br/>4. Doğru cevap D."
    },
    {
      id: "sv_eng_w4_2",
      unite: "W4",
      beceri: "Skill 8.B: Combining sentences concisely",
      zorluk: "medium",
      sureSn: 70,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 8.B — Style)",
      question: "Which choice most effectively combines the following sentences into one clear, concise sentence?<br/><br/><em>“The museum reopened in May. The museum had been closed for renovations. The renovations lasted two years.”</em>",
      options: [
        { id: "A", text: "The museum reopened in May, and it had been closed, and the renovations lasted two years.", isCorrect: false, errorTag: "Zincirleme “and”: Birleştirme yerine sadece yan yana dizme.", remediation: "Üç cümle “and” ile art arda bağlanmış; ilişki (neden kapalıydı?) kurulmamış ve tekrar sürüyor." },
        { id: "B", text: "In May, the museum reopened after two years of renovations.", isCorrect: true },
        { id: "C", text: "The museum, which reopened in May, it had been closed for two years of renovations.", isCorrect: false, errorTag: "Gramer Hatası: Özne tekrarı (subject duplication).", remediation: "“The museum... it had been closed” cümlesinde özne iki kez yazılmıştır; “it” çıkarılmalıdır." },
        { id: "D", text: "Having been closed, the renovations lasted two years, and the museum reopened in May.", isCorrect: false, errorTag: "Dangling Modifier: Niteleyicinin yanlış özneye bağlanması.", remediation: "“Having been closed” müzeyi nitelemeli, ama ardından gelen özne “the renovations”dır; anlam bozulur." }
      ],
      generalRemediation: "Birleştirme sorularında en iyi seçenek: gramer olarak doğru, tekrarsız ve fikirler arası ilişkiyi (zaman, neden) açıkça kuran cümledir. En kısa doğru cümle çoğu zaman en etkilidir.",
      stepByStepSolution: "1. Ana olay: müze Mayıs'ta yeniden açıldı.<br/>2. Arka plan: iki yıllık renovasyon nedeniyle kapalıydı.<br/>3. “after two years of renovations” her iki ek bilgiyi tek ifadede toplar.<br/>4. Doğru cevap B."
    },
    {
      id: "sv_eng_w4_3",
      unite: "W4",
      beceri: "Skill 8.A: Maintaining a consistent tone",
      zorluk: "hard",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Skill 8.A — Style)",
      question: "A student is writing a formal, objective report on the town's drinking water. One sentence in the draft reads: <em>“The test results were, frankly, a total disaster for the town.”</em> Which revision best maintains the formal, objective tone of the report?",
      options: [
        { id: "A", text: "The test results were, to put it mildly, really bad news for the town.", isCorrect: false, errorTag: "Gündelik Register: Öznel ve konuşma dili ifadeleri korumak.", remediation: "“to put it mildly” ve “really bad news” hâlâ öznel ve gündeliktir; nesnel bir raporda veri konuşmalıdır." },
        { id: "B", text: "The test results were shocking and should alarm everyone in the town.", isCorrect: false, errorTag: "Duygusal Dil: Nesnellik yerine duygu çağrısı.", remediation: "“shocking” ve “should alarm everyone” okuru duygusal olarak yönlendirir; nesnel tonla çelişir." },
        { id: "C", text: "The test results showed contaminant levels well above the state limit.", isCorrect: true },
        { id: "D", text: "The test results were not great, as anyone who saw them could tell.", isCorrect: false, errorTag: "Belirsiz ve Gündelik: Ölçülebilir bilgi vermemek.", remediation: "“not great” belirsiz ve gündeliktir; “anyone could tell” kanıt yerine varsayım sunar." }
      ],
      generalRemediation: "Formal, objective ton = duygu ve abartı kelimeleri yerine ölçülebilir, doğrulanabilir bilgi. Revizyon hem tonu düzeltmeli hem de anlamı (sonuçların kötü olduğu) korumalıdır.",
      stepByStepSolution: "1. Sorunlu kelimeler: “frankly”, “total disaster” — öznel ve duygusal.<br/>2. Anlam korunmalı: sonuçlar ciddi biçimde olumsuz.<br/>3. Nesnel karşılık: kirletici düzeyinin yasal sınırın üstünde olması.<br/>4. Doğru cevap C."
    }
  ]
};
