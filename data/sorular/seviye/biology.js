// Meberra — AP Biology Seviye Testi (Tanı Sınavı)
// Hazırlayan: Dr. Zeynep Aksoy (AP Biology). 8 CED ünitesi × 3 soru = 24 soru.
// Soru metinleri %100 İngilizce (Kural 13); açıklamalar Türkçe + İngilizce terimler.
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
  ],
  sorular: [
    // ───────────── UNIT 1: Chemistry of Life ─────────────
    {
      id: "sv_bio_u1_1",
      unite: "1",
      beceri: "1.1 Structure of Water and Hydrogen Bonding",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.1)",
      question: "Coastal cities have milder temperature swings than inland cities at the same latitude, because large bodies of water warm and cool slowly. Which property of water best explains this?",
      options: [
        { id: "A", text: "Water is nonpolar, so it absorbs little energy from sunlight.", isCorrect: false, errorTag: "Polarite Hatası: Suyu apolar sanmak.", remediation: "Su molekülü polardır (O kısmen negatif, H'ler kısmen pozitif). Bu polarite hydrogen bonding'in kaynağıdır." },
        { id: "B", text: "Hydrogen bonds must be broken before water molecules move faster.", isCorrect: true },
        { id: "C", text: "Covalent O–H bonds in water break whenever water is heated.", isCorrect: false, errorTag: "Bağ Türü Karışıklığı: Molekül içi kovalent bağ ile moleküller arası hidrojen bağını karıştırmak.", remediation: "Isıtma sırasında kırılan bağlar moleküller ARASI hydrogen bonds'tur; O–H kovalent bağları ısıtmayla kırılmaz." },
        { id: "D", text: "Water has low cohesion, so heat spreads quickly through it.", isCorrect: false, errorTag: "Cohesion Hatası: Suyun kohezyonunu düşük sanmak.", remediation: "Su yüksek cohesion gösterir (hidrojen bağları sayesinde). Ayrıca ılıman iklimin sebebi kohezyon değil high specific heat'tir." }
      ],
      generalRemediation: "Suyun yüksek özgül ısısı (high specific heat) hidrojen bağlarından gelir: eklenen enerjinin önemli kısmı önce hidrojen bağlarını kırmaya harcanır, moleküllerin kinetik enerjisi (sıcaklık) yavaş artar. Bu, okyanusların ve organizmaların sıcaklığını tamponlar.",
      stepByStepSolution: "1. Sıcaklık = moleküllerin ortalama kinetik enerjisi.<br/>2. Suda moleküller birbirine hydrogen bonds ile bağlıdır.<br/>3. Isı enerjisinin bir kısmı önce bu bağları kırmaya gider, sıcaklık yavaş yükselir (high specific heat).<br/>4. Soğurken bağlar yeniden oluşur ve ısı salınır; deniz kıyısı ılıman kalır.<br/>5. Doğru cevap: B."
    },
    {
      id: "sv_bio_u1_2",
      unite: "1",
      beceri: "1.3 Introduction to Biological Macromolecules (dehydration synthesis)",
      zorluk: "medium",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.3)",
      question: "A plant cell assembles <strong>two</strong> triglyceride (fat) molecules, each from one glycerol and three fatty acids. How many water molecules are released in total?",
      options: [
        { id: "A", text: "3", isCorrect: false, errorTag: "Kapsam Hatası: Yalnızca bir triglyceride için hesaplamak.", remediation: "Bir triglyceride 3 ester bağı (3 H₂O) içerir; soru İKİ molekül soruyor: 2 × 3 = 6." },
        { id: "B", text: "2", isCorrect: false, errorTag: "Bağ Sayma Hatası: Her molekül başına tek bir dehidrasyon saymak.", remediation: "Her fatty acid glycerol'e ayrı bir ester bağıyla bağlanır; her bağ bir H₂O açığa çıkarır. Molekül başına 3 H₂O." },
        { id: "C", text: "6", isCorrect: true },
        { id: "D", text: "8", isCorrect: false, errorTag: "Monomer–Bağ Karışıklığı: Su sayısını monomer sayısına eşitlemek.", remediation: "Bir triglyceride'da 4 bileşen (1 glycerol + 3 fatty acid) vardır ama 3 bağ vardır. Su sayısı = bağ sayısı = 3; iki molekül için 6." }
      ],
      generalRemediation: "Dehydration synthesis: oluşan her kovalent bağ (glycosidic, peptide, ester, phosphodiester) için bir H₂O açığa çıkar. Hydrolysis tam tersidir: her bağ için bir H₂O harcanır. Sayılacak olan monomerler değil, bağlardır.",
      stepByStepSolution: "1. Glycerol'ün 3 –OH grubu, 3 fatty acid'in –COOH grubuyla ester bağı kurar.<br/>2. Her ester bağı = 1 H₂O.<br/>3. Bir triglyceride: 3 H₂O.<br/>4. İki triglyceride: 2 × 3 = 6 H₂O.<br/>5. Doğru cevap: C."
    },
    {
      id: "sv_bio_u1_3",
      unite: "1",
      beceri: "1.6 Nucleic Acids (base pairing data)",
      zorluk: "hard",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.6) — data analysis",
      question: "A sample of double-stranded DNA from a newly discovered bacterium is analyzed, and 18% of its nitrogenous bases are adenine. Based on base-pairing rules, what percentage of the bases in this sample are guanine?",
      options: [
        { id: "A", text: "18%", isCorrect: false, errorTag: "Eşleşme Hatası: G'yi A'ya eşit sanmak.", remediation: "Base pairing: A = T ve G = C. Adenine'e eşit olan thymine'dir, guanine değil." },
        { id: "B", text: "64%", isCorrect: false, errorTag: "Yarılama Unutma: G + C toplamını G sanmak.", remediation: "A + T = 36%, kalan G + C = 64%. Bu toplam G ve C arasında eşit paylaşılır: G = 32%." },
        { id: "C", text: "36%", isCorrect: false, errorTag: "Yanlış Toplam: A + T değerini G sanmak.", remediation: "36% adenine + thymine toplamıdır. G, kalan 64%'ün yarısıdır." },
        { id: "D", text: "32%", isCorrect: true }
      ],
      generalRemediation: "Çift sarmallı DNA'da Chargaff kuralları geçerlidir: %A = %T ve %G = %C (purine = pyrimidine). Bir baz biliniyorsa önce eşini ekle, kalanı diğer çiftin iki bazına eşit böl. Tek sarmallı DNA/RNA'da bu kural geçerli değildir.",
      stepByStepSolution: "1. %A = 18% ⟹ %T = 18%.<br/>2. A + T = 36%.<br/>3. G + C = 100% − 36% = 64%.<br/>4. %G = %C = 64% / 2 = 32%.<br/>5. Doğru cevap: D."
    },

    // ───────────── UNIT 2: Cell Structure and Function ─────────────
    {
      id: "sv_bio_u2_1",
      unite: "2",
      beceri: "2.3 Cell Size (surface area-to-volume ratio)",
      zorluk: "easy",
      sureSn: 75,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 2.3)",
      question: "A cell is modeled as a cube with a side length of $3\\,\\mu\\text{m}$. What is its surface area-to-volume ratio?",
      options: [
        { id: "A", text: "$2\\,\\mu\\text{m}^{-1}$", isCorrect: true },
        { id: "B", text: "$0.5\\,\\mu\\text{m}^{-1}$", isCorrect: false, errorTag: "Oran Ters Çevirme: V/SA hesaplamak.", remediation: "İstenen SA:V'dir: 54 / 27 = 2. 27 / 54 = 0.5 değeri volume-to-surface oranıdır." },
        { id: "C", text: "$6\\,\\mu\\text{m}^{-1}$", isCorrect: false, errorTag: "Formül Hatası: Yüzey alanını tek yüzün alanına bölmek.", remediation: "SA = 6s² = 54 µm², V = s³ = 27 µm³. 54'ü bir yüzün alanına (9) bölmek 6 verir; bu SA:V değildir." },
        { id: "D", text: "$18\\,\\mu\\text{m}^{-1}$", isCorrect: false, errorTag: "Formül Hatası: Hacim yerine kenar uzunluğunu kullanmak.", remediation: "54 / 3 = 18, yüzey alanını kenara bölmektir. Hacim s³ = 27 µm³ olmalı: 54 / 27 = 2." }
      ],
      generalRemediation: "Küp için SA = 6s², V = s³, dolayısıyla SA:V = 6/s. Hücre büyüdükçe SA:V küçülür; madde alışverişi ve ısı kaybı için birim hacim başına daha az yüzey kalır. Bu yüzden hücreler küçüktür veya katlanmış zarlar (microvilli) kullanır.",
      stepByStepSolution: "1. SA = 6 × 3² = 54 µm².<br/>2. V = 3³ = 27 µm³.<br/>3. SA:V = 54 / 27 = 2 µm⁻¹ (kontrol: 6/s = 6/3 = 2).<br/>4. Doğru cevap: A."
    },
    {
      id: "sv_bio_u2_2",
      unite: "2",
      beceri: "2.8 Tonicity and Osmoregulation (solute potential)",
      zorluk: "medium",
      sureSn: 90,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 2.8)",
      question: "Calculate the solute potential of a 0.20 M sucrose solution in an open beaker at 27°C. Use $\\Psi_s = -iCRT$, with $R = 0.0831\\ \\text{L·bar/(mol·K)}$. Sucrose does not ionize in water.",
      options: [
        { id: "A", text: "$-10.0$ bar", isCorrect: false, errorTag: "Ionization Constant Hatası: Sucrose için i = 2 almak.", remediation: "Sucrose suda iyonlaşmaz: i = 1. i = 2, NaCl gibi iki iyona ayrışan maddeler içindir." },
        { id: "B", text: "$-5.0$ bar", isCorrect: true },
        { id: "C", text: "$-0.45$ bar", isCorrect: false, errorTag: "Birim Hatası: Sıcaklığı Kelvin'e çevirmemek.", remediation: "R'nin birimi K içerir; T = 27 + 273 = 300 K olmalı. 27 kullanmak sonucu yaklaşık 11 kat küçültür." },
        { id: "D", text: "$+5.0$ bar", isCorrect: false, errorTag: "İşaret Hatası: Formüldeki eksi işaretini atlamak.", remediation: "Çözünen eklemek water potential'ı düşürür; solute potential her zaman sıfır veya negatiftir." }
      ],
      generalRemediation: "Ψ = Ψs + Ψp. Açık kapta Ψp = 0, dolayısıyla Ψ = Ψs = −iCRT. i: iyonlaşma sabiti (sucrose/glucose için 1, NaCl için 2), C: mol/L, R = 0.0831 L·bar/(mol·K), T: Kelvin. Su yüksek Ψ'den düşük Ψ'ye akar.",
      stepByStepSolution: "1. i = 1 (sucrose iyonlaşmaz).<br/>2. T = 27 + 273 = 300 K.<br/>3. Ψs = −(1)(0.20)(0.0831)(300) = −4.99 ≈ −5.0 bar.<br/>4. Doğru cevap: B."
    },
    {
      id: "sv_bio_u2_3",
      unite: "2",
      beceri: "2.8 Tonicity and Osmoregulation (isotonic point from data)",
      zorluk: "hard",
      sureSn: 120,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 2.8) — data analysis",
      question: "Zucchini cylinders were weighed, soaked for 24 h in sucrose solutions, and reweighed. Mean percent change in mass:<br/>• 0.0 M: +18%<br/>• 0.2 M: +6%<br/>• 0.4 M: −4%<br/>• 0.6 M: −12%<br/>• 0.8 M: −17%<br/>Assuming a linear trend between adjacent points, which sucrose concentration is closest to isotonic with the zucchini cells?",
      options: [
        { id: "A", text: "0.20 M", isCorrect: false, errorTag: "Veri Okuma Hatası: Son pozitif değeri izotonik nokta sanmak.", remediation: "0.2 M'de doku hâlâ +6% kütle kazanıyor (su giriyor), yani çözelti hâlâ hipotonik. İzotonik nokta kütle değişiminin 0 olduğu yerdir." },
        { id: "B", text: "0.40 M", isCorrect: false, errorTag: "Veri Okuma Hatası: İlk negatif değeri izotonik nokta sanmak.", remediation: "0.4 M'de doku −4% kaybediyor, yani çözelti zaten hipertonik. Sıfır noktası 0.2 ile 0.4 arasında interpolasyonla bulunur." },
        { id: "C", text: "0.32 M", isCorrect: true },
        { id: "D", text: "0.80 M", isCorrect: false, errorTag: "Kavram Hatası: En büyük kütle değişimini izotonik sanmak.", remediation: "İzotonik = net su hareketi yok = kütle değişimi 0. En büyük kütle kaybı en hipertonik çözeltide görülür." }
      ],
      generalRemediation: "Kütle değişimi–konsantrasyon grafiğinde x eksenini kestiği nokta (0% değişim), dokunun water potential'ına eşit olan çözeltiyi verir. İki komşu nokta arasında doğrusal interpolasyon: C = C₁ + (C₂ − C₁) × Δm₁ / (Δm₁ − Δm₂).",
      stepByStepSolution: "1. İşaret değişimi 0.2 M (+6%) ile 0.4 M (−4%) arasında.<br/>2. Toplam düşüş: 6 − (−4) = 10 puan, 0.2 M aralıkta.<br/>3. Sıfıra ulaşmak için 6/10 = 0.6 aralık gerekir: 0.2 + 0.6 × 0.2 = 0.32 M.<br/>4. Doğru cevap: C."
    },

    // ───────────── UNIT 3: Cellular Energetics ─────────────
    {
      id: "sv_bio_u3_1",
      unite: "3",
      beceri: "3.3 Environmental Impacts on Enzyme Function (inhibition)",
      zorluk: "easy",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.3) — experimental results",
      question: "Reaction rates of an enzyme were measured with and without compound X. At low substrate concentrations, the rate with X was much lower than without X. At very high substrate concentrations, both conditions reached the same maximum rate. Which explanation is best supported?",
      options: [
        { id: "A", text: "X binds an allosteric site and permanently lowers the maximum rate.", isCorrect: false, errorTag: "İnhibisyon Türü Hatası: Noncompetitive inhibition ile karıştırmak.", remediation: "Noncompetitive inhibitor maksimum hızı (Vmax) düşürür ve yüksek substrat bunu telafi etmez. Verilerde maksimum hız değişmiyor." },
        { id: "B", text: "X denatures the enzyme, destroying the shape of its active site.", isCorrect: false, errorTag: "Denatürasyon Hatası: Geri dönüşümlü inhibisyonu denatürasyon sanmak.", remediation: "Denatüre enzim yüksek substratta da çalışamaz. Maksimum hızın korunması enzimin sağlam olduğunu gösterir." },
        { id: "C", text: "X is an activator that speeds the reaction at all substrate levels.", isCorrect: false, errorTag: "Veri Okuma Hatası: X'in hızı düşürdüğünü görmemek.", remediation: "Düşük substratta X varken hız DAHA DÜŞÜK; X bir inhibitördür, aktivatör değil." },
        { id: "D", text: "X competes with substrate for the active site, so excess substrate overcomes it.", isCorrect: true }
      ],
      generalRemediation: "Competitive inhibitor active site için substratla yarışır: düşük [S]'de hızı belirgin düşürür, yüksek [S]'de substrat inhibitörü saf dışı bırakır ve aynı Vmax'a ulaşılır. Noncompetitive (allosteric) inhibitor ise Vmax'ı düşürür ve substrat artışıyla telafi edilemez.",
      stepByStepSolution: "1. Düşük [S]: X ile hız düşük ⟹ X inhibitör.<br/>2. Yüksek [S]: hızlar eşit ⟹ inhibisyon substratla aşılabiliyor; Vmax değişmemiş.<br/>3. Bu tablo competitive inhibition'a özgüdür.<br/>4. Doğru cevap: D."
    },
    {
      id: "sv_bio_u3_2",
      unite: "3",
      beceri: "3.6 Cellular Respiration (respirometry data)",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 3.6) — data analysis",
      question: "A respirometer with germinating seeds and a control respirometer with glass beads were kept in a 25°C water bath. Cumulative O₂ consumed (mL):<br/>• 0 min: seeds 0.00, beads 0.00<br/>• 10 min: seeds 0.19, beads 0.02<br/>• 20 min: seeds 0.40, beads 0.04<br/>Using the control to correct for changes not caused by respiration, what is the rate of O₂ consumption by the seeds over 20 minutes?",
      options: [
        { id: "A", text: "0.018 mL/min", isCorrect: true },
        { id: "B", text: "0.020 mL/min", isCorrect: false, errorTag: "Kontrol Düzeltmesi Eksik: Glass beads değerini çıkarmamak.", remediation: "Kontroldeki 0.04 mL değişim solunumdan değil, sıcaklık/basınç oynamasından kaynaklanır; tohum değerinden çıkarılmalı: 0.40 − 0.04 = 0.36 mL." },
        { id: "C", text: "0.022 mL/min", isCorrect: false, errorTag: "İşaret Hatası: Kontrol değerini çıkarmak yerine eklemek.", remediation: "Düzeltme = deney − kontrol. 0.40 + 0.04 kullanmak gerçek solunumu abartır." },
        { id: "D", text: "0.36 mL/min", isCorrect: false, errorTag: "Birim Hatası: Toplam hacmi zamana bölmemek.", remediation: "0.36 mL, 20 dakikada tüketilen toplam O₂'dir. Hız = 0.36 mL / 20 min = 0.018 mL/min." }
      ],
      generalRemediation: "Respirometrede tohumların hacim değişimi O₂ tüketimini ölçer (CO₂, KOH ile tutulur). Glass beads kontrolü, solunumla ilgisi olmayan sıcaklık/basınç değişimlerini düzeltmek için kullanılır: düzeltilmiş değer = deney − kontrol. Hız = Δhacim / Δzaman.",
      stepByStepSolution: "1. 20 dakikada tohum: 0.40 mL; kontrol: 0.04 mL.<br/>2. Düzeltilmiş O₂ tüketimi = 0.40 − 0.04 = 0.36 mL.<br/>3. Hız = 0.36 / 20 = 0.018 mL/min.<br/>4. Doğru cevap: A."
    },
    {
      id: "sv_bio_u3_3",
      unite: "3",
      beceri: "3.6 Cellular Respiration (chemiosmosis and uncouplers)",
      zorluk: "hard",
      sureSn: 105,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.6)",
      question: "An uncoupling agent makes the inner mitochondrial membrane freely permeable to H⁺ but does not inhibit any enzyme or electron carrier. If isolated mitochondria with ample substrate, O₂, ADP and Pᵢ are treated with the uncoupler, which outcome is predicted?",
      options: [
        { id: "A", text: "O₂ use stops at once, since electron transport needs ATP synthase to work.", isCorrect: false, errorTag: "Yön Hatası: ETC'nin ATP synthase'e bağlı çalıştığını sanmak.", remediation: "Electron transport chain, gradyanı OLUŞTURAN taraftır. Gradyan sızıntıyla dağıldığında ETC'nin önündeki 'geri basınç' kalkar; O₂ tüketimi devam eder hatta artar." },
        { id: "B", text: "O₂ use continues or rises, but ATP synthesis by ATP synthase falls sharply.", isCorrect: true },
        { id: "C", text: "ATP synthesis rises, because more H⁺ now enters the matrix overall.", isCorrect: false, errorTag: "Chemiosmosis Hatası: Her H⁺ girişinin ATP ürettiğini sanmak.", remediation: "ATP yalnızca H⁺ ATP synthase'ten geçerken üretilir. Uncoupler H⁺'yı zardan doğrudan geçirir; enerji ATP yerine ısı olarak kaybolur." },
        { id: "D", text: "Glycolysis stops at once, since it depends on the mitochondrial H⁺ gradient.", isCorrect: false, errorTag: "Lokasyon Hatası: Glycolysis'in yerini ve enerji kaynağını karıştırmak.", remediation: "Glycolysis sitoplazmada, substrate-level phosphorylation ile ATP üretir; proton gradyanına bağlı değildir. Ayrıca deneyde izole mitokondri kullanılıyor." }
      ],
      generalRemediation: "Oxidative phosphorylation iki bağlı süreçtir: ETC, H⁺'yı intermembrane space'e pompalar (gradyan kurar); ATP synthase, H⁺'nın geri akışını ATP sentezine bağlar. Uncoupler (ör. DNP) bu bağı koparır: elektron taşınımı ve O₂ tüketimi sürer, gradyan ısı olarak boşa harcanır, ATP üretimi düşer.",
      stepByStepSolution: "1. Uncoupler ETC enzimlerini engellemiyor ⟹ elektronlar O₂'ye akmaya devam eder.<br/>2. H⁺ zardan sızdığı için gradyan dağılır; ATP synthase'i çalıştıracak proton-motive force kalmaz.<br/>3. Gradyanın geri basıncı kalktığından O₂ tüketimi artabilir.<br/>4. Sonuç: O₂ tüketimi sürer/artar, ATP sentezi düşer.<br/>5. Doğru cevap: B."
    },

    // ───────────── UNIT 4: Cell Communication and Cell Cycle ─────────────
    {
      id: "sv_bio_u4_1",
      unite: "4",
      beceri: "4.6 Cell Cycle (G0 phase)",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.6)",
      question: "Mature nerve cells in an adult human remain metabolically active for decades but do not divide. Which statement best describes these cells?",
      options: [
        { id: "A", text: "They are arrested in metaphase, waiting for spindle fibers to attach.", isCorrect: false, errorTag: "Faz Karışıklığı: Bölünmeyen hücreyi mitoz evresinde sanmak.", remediation: "Metaphase mitozun parçasıdır; bölünmeyen hücre mitoza hiç girmez. Metaphase'de onlarca yıl beklemek mümkün değildir." },
        { id: "B", text: "They stay in S phase permanently, copying their DNA again and again.", isCorrect: false, errorTag: "S Fazı Hatası: Sürekli DNA replikasyonu varsaymak.", remediation: "DNA her döngüde yalnızca bir kez kopyalanır. Nöronlar S fazına girmez." },
        { id: "C", text: "They have exited the cell cycle into a nondividing state called G0.", isCorrect: true },
        { id: "D", text: "They have lost all their DNA, so they cannot enter the cell cycle.", isCorrect: false, errorTag: "Genom Hatası: Bölünmeyen hücrenin DNA'sını kaybettiğini sanmak.", remediation: "Nöronlar tam genomu korur ve sürekli gen ifadesi yapar; bölünmemeleri G1 checkpoint'inde döngüden çıkmalarındandır." }
      ],
      generalRemediation: "Hücre döngüsü: G1 → S → G2 → M (mitosis + cytokinesis). G1 checkpoint'inde uygun sinyal yoksa hücre G0'a geçer: metabolik olarak aktif ama bölünmeyen durum. Nöronlar ve kas hücreleri çoğunlukla kalıcı olarak G0'dadır; karaciğer hücreleri uyarıyla döngüye geri dönebilir.",
      stepByStepSolution: "1. Hücre canlı ve aktif ⟹ DNA ve gen ifadesi var.<br/>2. Bölünmüyor ⟹ S veya M fazında değil.<br/>3. Döngüden çıkmış, bölünmeyen durum = G0.<br/>4. Doğru cevap: C."
    },
    {
      id: "sv_bio_u4_2",
      unite: "4",
      beceri: "4.6 Cell Cycle (estimating phase duration from counts)",
      zorluk: "medium",
      sureSn: 105,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 4.6) — data analysis",
      question: "In a microscope slide of an onion root tip, students counted 200 cells: 180 were in interphase and 20 were in a stage of mitosis. The complete cell cycle in these cells takes 24 hours. Assuming the proportion of cells in each stage reflects the time spent in that stage, about how long does mitosis last?",
      options: [
        { id: "A", text: "21.6 hours", isCorrect: false, errorTag: "Yanlış Faz: Interphase süresini hesaplamak.", remediation: "180/200 × 24 = 21.6 saat interphase süresidir. Soru mitozu soruyor: 20/200 × 24." },
        { id: "B", text: "1.2 hours", isCorrect: false, errorTag: "Gereksiz Yarılama: Sonucu iki yavru hücre için ikiye bölmek.", remediation: "Hücre oranı doğrudan zaman oranını verir; ek bir 2'ye bölme gerekmez." },
        { id: "C", text: "4.8 hours", isCorrect: false, errorTag: "Gereksiz İkiye Katlama: Sonucu iki yavru hücre için ikiyle çarpmak.", remediation: "Mitoz evresindeki hücre sayısı zaten tek hücre olarak sayılır. Süre = (20/200) × 24 = 2.4 saat." },
        { id: "D", text: "2.4 hours", isCorrect: true }
      ],
      generalRemediation: "Asenkron bölünen dokuda bir evredeki hücre oranı, o evrede geçen zamanın döngüye oranına yaklaşık eşittir: t(evre) = (evredeki hücre / toplam hücre) × döngü süresi. Bu yöntem kök ucu (root tip) laboratuvarının temel hesabıdır.",
      stepByStepSolution: "1. Mitozdaki oran = 20 / 200 = 0.10.<br/>2. Süre = 0.10 × 24 h = 2.4 h.<br/>3. Kontrol: interphase 0.90 × 24 = 21.6 h; 21.6 + 2.4 = 24 h.<br/>4. Doğru cevap: D."
    },
    {
      id: "sv_bio_u4_3",
      unite: "4",
      beceri: "4.4 Changes in Signal Transduction Pathways",
      zorluk: "hard",
      sureSn: 105,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.4)",
      question: "Ras is a G protein in a growth-factor pathway: it is active when bound to GTP and becomes inactive when it hydrolyzes GTP to GDP. A mutation leaves Ras unable to hydrolyze GTP. What is the most likely effect on a cell carrying this mutation?",
      options: [
        { id: "A", text: "Ras stays active, so division signals continue even with no growth factor.", isCorrect: true },
        { id: "B", text: "Ras stays inactive, so the cell cannot divide even with growth factor.", isCorrect: false, errorTag: "Açma/Kapama Karışıklığı: GTP hidrolizini aktivasyon sanmak.", remediation: "GTP hidrolizi Ras'ı KAPATIR. Hidroliz yapamayan Ras GTP'ye bağlı, yani sürekli AÇIK kalır." },
        { id: "C", text: "The pathway works only when growth factor binds, as in a normal cell.", isCorrect: false, errorTag: "Etkisiz Mutasyon Varsayımı: Kapanma basamağının önemini atlamak.", remediation: "Sinyalin kapanması da yolun parçasıdır. Kapanamayan Ras, reseptör uyarısı bitse de sinyal göndermeye devam eder." },
        { id: "D", text: "The receptor can no longer bind its ligand, so no signal is relayed.", isCorrect: false, errorTag: "Basamak Karışıklığı: Hücre içi bir mutasyonu reseptöre atfetmek.", remediation: "Mutasyon Ras'ta (reseptörün aşağısında) ve reseptörün ligand bağlamasını etkilemez." }
      ],
      generalRemediation: "Signal transduction'da her aktif bileşenin bir kapatma mekanizması vardır (GTPase aktivitesi, phosphatase'lar). Kapatma başarısız olursa yol ligand olmadan da çalışır: hiperaktif Ras gibi oncogene mutasyonları kontrolsüz hücre bölünmesine (cancer) yol açar.",
      stepByStepSolution: "1. Ras-GTP = aktif; GTP → GDP hidrolizi = inaktivasyon.<br/>2. Mutant Ras hidroliz yapamaz ⟹ GTP'ye bağlı kalır ⟹ sürekli aktif.<br/>3. Aşağı akış kinaz kaskadı (MAPK) sürekli uyarılır; bölünme sinyali büyüme faktörü olmadan sürer.<br/>4. Doğru cevap: A."
    },

    // ───────────── UNIT 5: Heredity ─────────────
    {
      id: "sv_bio_u5_1",
      unite: "5",
      beceri: "5.1 Meiosis (chromosome and chromatid number)",
      zorluk: "easy",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.1)",
      question: "A diploid cell with $2n = 16$ chromosomes undergoes meiosis. Immediately after meiosis I (after cytokinesis), how many chromosomes and chromatids does each daughter cell contain?",
      options: [
        { id: "A", text: "8 chromosomes and 16 chromatids", isCorrect: true },
        { id: "B", text: "16 chromosomes and 32 chromatids", isCorrect: false, errorTag: "Mitoz Karışıklığı: Mayoz I'de kromozom sayısının korunduğunu sanmak.", remediation: "Mayoz I'de homolog kromozomlar ayrılır; kromozom sayısı yarıya iner (16 → 8). 16/32, G2'deki ana hücreye aittir." },
        { id: "C", text: "8 chromosomes and 8 chromatids", isCorrect: false, errorTag: "Evre Karışıklığı: Mayoz II sonucunu vermek.", remediation: "Kardeş kromatitler mayoz II'de ayrılır. Mayoz I sonunda her kromozom hâlâ iki kromatitlidir: 8 × 2 = 16." },
        { id: "D", text: "4 chromosomes and 8 chromatids", isCorrect: false, errorTag: "Çift Yarılama: n değerini bir kez daha bölmek.", remediation: "2n = 16 ise n = 8'dir. Mayoz I kromozom sayısını yalnızca bir kez yarıya indirir." }
      ],
      generalRemediation: "Mayoz öncesi S fazında DNA kopyalanır (16 kromozom, 32 kromatit). Mayoz I: homologlar ayrılır ⟹ n = 8 kromozom, her biri 2 kromatitli (16 kromatit). Mayoz II: kardeş kromatitler ayrılır ⟹ 8 kromozom, 8 kromatit.",
      stepByStepSolution: "1. G2: 16 kromozom × 2 kromatit = 32 kromatit.<br/>2. Mayoz I: homolog çiftler ayrılır ⟹ her hücrede 8 kromozom.<br/>3. Kardeş kromatitler hâlâ bağlı ⟹ 8 × 2 = 16 kromatit.<br/>4. Doğru cevap: A."
    },
    {
      id: "sv_bio_u5_2",
      unite: "5",
      beceri: "5.3 Mendelian Genetics (chi-square test)",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 5.3) — chi-square data analysis",
      question: "A dihybrid cross (AaBb × AaBb) produced 160 offspring. The null hypothesis is independent assortment (9:3:3:1). Observed phenotype counts:<br/>• dominant A, dominant B: 98<br/>• dominant A, recessive b: 28<br/>• recessive a, dominant B: 24<br/>• recessive a, recessive b: 10<br/>Critical values at $p = 0.05$: df 1 = 3.84; df 2 = 5.99; df 3 = 7.81. Which conclusion is correct?",
      options: [
        { id: "A", text: "$\\chi^2 \\approx 2.04$; since it exceeds 0.05, the null hypothesis is rejected.", isCorrect: false, errorTag: "p ile χ² Karışıklığı: χ² değerini 0.05 ile karşılaştırmak.", remediation: "0.05 bir olasılık eşiğidir (p-value). χ² değeri, df'ye karşılık gelen kritik değerle (7.81) karşılaştırılır." },
        { id: "B", text: "$\\chi^2 \\approx 2.04$; it is below 7.81, so we fail to reject the null hypothesis.", isCorrect: true },
        { id: "C", text: "$\\chi^2 = 104$; it is above 7.81, so the genes are not assorting independently.", isCorrect: false, errorTag: "Formül Hatası: (O − E)² değerlerini E'ye bölmemek.", remediation: "χ² = Σ (O − E)² / E. Kareler toplamı 64 + 4 + 36 + 0 = 104'tür; her terim kendi beklenen değerine bölünmelidir." },
        { id: "D", text: "$\\chi^2 \\approx 2.04$; this proves that the two genes assort independently.", isCorrect: false, errorTag: "Hipotez Mantığı Hatası: Null hipotezi 'kanıtlanmış' saymak.", remediation: "İstatistiksel test null hipotezi kanıtlamaz; yalnızca reddetmek için yeterli kanıt olmadığını söyler (fail to reject)." }
      ],
      generalRemediation: "Chi-square adımları: (1) beklenenleri oranla hesapla, (2) χ² = Σ (O − E)² / E, (3) df = kategori sayısı − 1, (4) χ² < kritik değer ⟹ fail to reject (sapma şansla açıklanabilir); χ² > kritik değer ⟹ reject. Null hipotez asla 'kanıtlanmaz'.",
      stepByStepSolution: "1. Beklenen: 160 × 9/16 = 90; 160 × 3/16 = 30; 30; 160 × 1/16 = 10.<br/>2. (98−90)²/90 = 0.711; (28−30)²/30 = 0.133; (24−30)²/30 = 1.200; (10−10)²/10 = 0.<br/>3. χ² = 2.04; df = 4 − 1 = 3; kritik değer 7.81.<br/>4. 2.04 < 7.81 ⟹ fail to reject; veriler bağımsız dağılımla uyumlu.<br/>5. Doğru cevap: B."
    },
    {
      id: "sv_bio_u5_3",
      unite: "5",
      beceri: "5.4 Non-Mendelian Genetics (linkage and recombination frequency)",
      zorluk: "hard",
      sureSn: 120,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 5.4) — data analysis",
      question: "A fruit fly heterozygous for two genes (AaBb, with alleles A and B inherited on the same chromosome from one parent) is test-crossed with an aabb fly. The offspring are:<br/>• AaBb: 410<br/>• aabb: 390<br/>• Aabb: 95<br/>• aaBb: 105<br/>What is the distance between the two genes in map units?",
      options: [
        { id: "A", text: "80 map units", isCorrect: false, errorTag: "Sınıf Karışıklığı: Parental sınıfların oranını kullanmak.", remediation: "Uzaklık RECOMBINANT yavruların oranıdır. (410 + 390)/1000 = 80% parental orandır." },
        { id: "B", text: "25 map units", isCorrect: false, errorTag: "Payda Hatası: Rekombinantları yalnızca parental sayıya bölmek.", remediation: "Recombination frequency = rekombinant / TOPLAM yavru = 200 / 1000. 200 / 800 yanlış paydadır." },
        { id: "C", text: "20 map units", isCorrect: true },
        { id: "D", text: "10 map units", isCorrect: false, errorTag: "Eksik Sayım: Yalnızca bir rekombinant sınıfı saymak.", remediation: "İki rekombinant sınıf vardır (Aabb ve aaBb); ikisi de toplanmalı: 95 + 105 = 200." }
      ],
      generalRemediation: "Test cross'ta en kalabalık iki sınıf parental, en az iki sınıf recombinant'tır. Recombination frequency (%) = rekombinant yavru / toplam yavru × 100; 1% = 1 map unit (centimorgan). Bağımsız dağılımda dört sınıf yaklaşık eşit (1:1:1:1) olurdu.",
      stepByStepSolution: "1. Parental (en kalabalık): AaBb 410, aabb 390.<br/>2. Recombinant: Aabb 95 + aaBb 105 = 200.<br/>3. Toplam = 410 + 390 + 95 + 105 = 1000.<br/>4. RF = 200 / 1000 = 0.20 = 20 map units.<br/>5. Doğru cevap: C."
    },

    // ───────────── UNIT 6: Gene Expression and Regulation ─────────────
    {
      id: "sv_bio_u6_1",
      unite: "6",
      beceri: "6.3 Transcription and RNA Processing",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.3)",
      question: "The template strand of a DNA segment reads 3′-TACCGT-5′. What is the sequence of the mRNA transcribed from it?",
      options: [
        { id: "A", text: "5′-ATGGCA-3′", isCorrect: false, errorTag: "RNA Bazı Hatası: Urasil yerine timin yazmak.", remediation: "RNA'da thymine yoktur; A'nın karşısına uracil (U) gelir. ATGGCA, coding strand'in DNA dizisidir." },
        { id: "B", text: "5′-UACCGU-3′", isCorrect: false, errorTag: "Kopyalama Hatası: Template strand'i tamamlamak yerine kopyalamak.", remediation: "mRNA, template strand'in TAMAMLAYICISIDIR: T→A, A→U, C→G, G→C." },
        { id: "C", text: "5′-ACGGUA-3′", isCorrect: false, errorTag: "Yön Hatası: Diziyi ters yönde okumak.", remediation: "Tamamlayıcı dizi antiparalel yazılır: template 3′→5′ okunurken mRNA 5′→3′ sentezlenir. Sıra AUGGCA olur, ters çevrilmez." },
        { id: "D", text: "5′-AUGGCA-3′", isCorrect: true }
      ],
      generalRemediation: "RNA polymerase template strand'i 3′→5′ yönünde okur ve mRNA'yı 5′→3′ yönünde sentezler. Eşleşme kuralları: A→U, T→A, G→C, C→G. mRNA dizisi coding (non-template) strand ile aynıdır; yalnızca T yerine U vardır.",
      stepByStepSolution: "1. Template: 3′-T A C C G T-5′.<br/>2. Tamamlayıcı (U kullanarak): A U G G C A.<br/>3. Antiparalel yön: 5′-AUGGCA-3′ (AUG = start codon).<br/>4. Doğru cevap: D."
    },
    {
      id: "sv_bio_u6_2",
      unite: "6",
      beceri: "6.5 Regulation of Gene Expression (lac operon)",
      zorluk: "medium",
      sureSn: 105,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.5)",
      question: "In <em>E. coli</em>, a mutation in the <em>lacI</em> gene produces a repressor protein that still binds the operator normally but can no longer bind allolactose (the inducer). Glucose is absent. How will expression of the <em>lac</em> structural genes be affected?",
      options: [
        { id: "A", text: "They will not be transcribed, whether or not lactose is present.", isCorrect: true },
        { id: "B", text: "They will be transcribed all the time, even without lactose.", isCorrect: false, errorTag: "Mutant Tipi Karışıklığı: Operatöre bağlanamayan repressor ile karıştırmak.", remediation: "Sürekli (constitutive) ifade, repressor operatöre BAĞLANAMADIĞINDA görülür. Burada repressor operatöre bağlanıyor ama inducer onu sökemiyor." },
        { id: "C", text: "They will be transcribed only when lactose is present, as normal.", isCorrect: false, errorTag: "Etkisiz Mutasyon Varsayımı: Inducer bağlanmasının rolünü atlamak.", remediation: "Normalde allolactose repressor'a bağlanıp onu operatörden ayırır. Bu mutantta allolactose bağlanamaz, repressor operatörde kalır." },
        { id: "D", text: "They will be transcribed only when glucose is added to the medium.", isCorrect: false, errorTag: "Glukoz Rolü Hatası: Glukozun lac operonunu uyardığını sanmak.", remediation: "Glukoz cAMP–CAP aktivasyonunu azaltarak lac ifadesini DÜŞÜRÜR; repressor'ı operatörden ayıramaz." }
      ],
      generalRemediation: "lac operon inducible bir operondur: repressor (lacI ürünü) operatöre bağlıyken RNA polymerase transkripsiyon yapamaz. Allolactose repressor'a bağlanıp şeklini değiştirir (allosteric) ve operatörden ayırır. Inducer'ı bağlayamayan repressor (super-repressor) operonu kalıcı olarak kapatır.",
      stepByStepSolution: "1. Repressor operatöre bağlanıyor ⟹ transkripsiyon engellenir.<br/>2. Normalde allolactose repressor'ı söker; mutant repressor allolactose bağlayamaz.<br/>3. Laktoz olsa da olmasa da repressor operatörde kalır.<br/>4. Glukoz yokluğu (yüksek cAMP) repressor varken tek başına yetmez.<br/>5. Doğru cevap: A."
    },
    {
      id: "sv_bio_u6_3",
      unite: "6",
      beceri: "6.7 Mutations (sequence and codon-table analysis)",
      zorluk: "hard",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.7) — data analysis",
      question: "A normal mRNA reads 5′-AUG GCU UGG AAA GGC UAA-3′. In a mutant, the ninth nucleotide changes from G to A, producing 5′-AUG GCU UGA AAA GGC UAA-3′. Codon table excerpt: AUG = Met; GCU = Ala; UGG = Trp; AAA = Lys; GGC = Gly; UAA, UAG, UGA = Stop. Which describes the mutant polypeptide?",
      options: [
        { id: "A", text: "Met-Ala-Trp-Lys-Gly; the change is silent because it is in a third position.", isCorrect: false, errorTag: "Wobble Aşırı Genellemesi: Üçüncü baz değişiminin hep sessiz olduğunu sanmak.", remediation: "Üçüncü pozisyon değişimleri ÇOĞU ZAMAN sessizdir ama her zaman değil. Tabloya bak: UGA = Stop." },
        { id: "B", text: "Met-Ala only; a nonsense mutation creates an early stop codon.", isCorrect: true },
        { id: "C", text: "Met-Ala-Lys-Gly; only the Trp is removed and the rest is unchanged.", isCorrect: false, errorTag: "Stop Kodon Hatası: Stop kodonunu atlanan bir kodon sanmak.", remediation: "Ribozom stop codon'a ulaşınca release factor bağlanır ve translasyon BİTER; sonraki kodonlar okunmaz." },
        { id: "D", text: "A frameshift changes every amino acid after Ala in the chain.", isCorrect: false, errorTag: "Mutasyon Türü Karışıklığı: Substitution'ı frameshift sanmak.", remediation: "Frameshift yalnızca 3'ün katı olmayan insertion/deletion ile olur. Burada tek baz değişmiş; okuma çerçevesi korunur." }
      ],
      generalRemediation: "Point mutation türleri: silent (aynı amino asit), missense (farklı amino asit), nonsense (erken stop codon ⟹ kısalmış, genellikle işlevsiz protein). Frameshift ise insertion/deletion ile oluşur. Etkiyi her zaman codon table ile kontrol et.",
      stepByStepSolution: "1. Normal: AUG-GCU-UGG-AAA-GGC-UAA ⟹ Met-Ala-Trp-Lys-Gly-Stop.<br/>2. Mutant 3. kodon: UGG → UGA.<br/>3. Tabloya göre UGA = Stop ⟹ translasyon Ala'dan sonra durur.<br/>4. Ürün: Met-Ala (nonsense mutation).<br/>5. Doğru cevap: B."
    },

    // ───────────── UNIT 7: Natural Selection ─────────────
    {
      id: "sv_bio_u7_1",
      unite: "7",
      beceri: "7.2 Natural Selection",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.2)",
      question: "After an insecticide is sprayed on a field for several years, most of the beetles in the field are resistant to it. Which statement best explains this change?",
      options: [
        { id: "A", text: "Each beetle built up resistance during its life and passed it on.", isCorrect: false, errorTag: "Lamarckçı Hata: Kazanılmış özelliklerin kalıtıldığını sanmak.", remediation: "Bireyin yaşamı boyunca kazandığı özellikler genetik değildir ve yavruya aktarılmaz. Seçilim var olan kalıtsal varyasyon üzerinde işler." },
        { id: "B", text: "The insecticide caused the exact mutations that the beetles needed.", isCorrect: false, errorTag: "Yönlendirilmiş Mutasyon Hatası: Çevrenin ihtiyaç duyulan mutasyonu ürettiğini sanmak.", remediation: "Mutasyonlar rastgeledir ve ihtiyaca göre oluşmaz. Direnç alleli büyük olasılıkla ilaçlamadan önce de popülasyonda vardı." },
        { id: "C", text: "Beetles with inherited resistance survived and reproduced more.", isCorrect: true },
        { id: "D", text: "The beetles evolved on purpose so that their species would survive.", isCorrect: false, errorTag: "Teleoloji Hatası: Evrime amaç veya niyet atfetmek.", remediation: "Natural selection amaçsızdır; yalnızca farklı hayatta kalma ve üreme başarısının (differential reproductive success) sonucudur." }
      ],
      generalRemediation: "Natural selection için üç koşul: (1) kalıtsal varyasyon, (2) aşırı üreme ve rekabet, (3) farklı hayatta kalma/üreme başarısı. Bireyler evrimleşmez; popülasyonların allel frekansları nesiller boyunca değişir.",
      stepByStepSolution: "1. İlaçlamadan önce bazı böcekler kalıtsal direnç alleli taşıyordu (rastgele mutasyon).<br/>2. İnsektisit direnç taşımayanları öldürdü.<br/>3. Dirençli bireyler daha çok yavru bıraktı ⟹ direnç allelinin frekansı arttı.<br/>4. Doğru cevap: C."
    },
    {
      id: "sv_bio_u7_2",
      unite: "7",
      beceri: "7.5 Hardy-Weinberg Equilibrium (calculation)",
      zorluk: "medium",
      sureSn: 105,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 7.5) — data analysis",
      question: "In a population of 500 snapdragon-like plants in Hardy-Weinberg equilibrium, flower color is controlled by one gene with two alleles. 80 plants show the recessive white phenotype. What is the expected frequency of heterozygous plants?",
      options: [
        { id: "A", text: "0.24", isCorrect: false, errorTag: "Formül Hatası: 2pq yerine pq kullanmak.", remediation: "Heterozigot frekansı 2pq'dur (Aa ve aA iki yoldan oluşur): 2 × 0.6 × 0.4 = 0.48." },
        { id: "B", text: "0.36", isCorrect: false, errorTag: "Genotip Karışıklığı: p² (homozigot dominant) değerini vermek.", remediation: "0.36 = p² = homozygous dominant frekansıdır. Heterozigot 2pq'dur." },
        { id: "C", text: "0.84", isCorrect: false, errorTag: "Fenotip–Genotip Karışıklığı: Dominant fenotip frekansını vermek.", remediation: "1 − q² = 0.84, dominant fenotipli (AA + Aa) bitkilerin toplamıdır; içinde AA da var." },
        { id: "D", text: "0.48", isCorrect: true }
      ],
      generalRemediation: "Hardy-Weinberg: p + q = 1 ve p² + 2pq + q² = 1. Başlangıç noktası her zaman resesif fenotiptir, çünkü yalnızca onun genotipi (q²) kesin bilinir. q = √(q²), p = 1 − q, heterozigot = 2pq.",
      stepByStepSolution: "1. q² = 80 / 500 = 0.16.<br/>2. q = √0.16 = 0.4; p = 1 − 0.4 = 0.6.<br/>3. 2pq = 2 × 0.6 × 0.4 = 0.48.<br/>4. Doğru cevap: D."
    },
    {
      id: "sv_bio_u7_3",
      unite: "7",
      beceri: "7.5 Hardy-Weinberg Equilibrium (testing for deviation)",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 7.5) — data analysis",
      question: "A field survey of 100 individuals of a plant species found these genotypes at one locus: AA = 50, Aa = 20, aa = 30. Which statement is best supported by the data?",
      options: [
        { id: "A", text: "The population is in equilibrium, because the allele frequencies add up to 1.", isCorrect: false, errorTag: "Kanıt Hatası: p + q = 1'i denge kanıtı sanmak.", remediation: "p + q = 1 her popülasyonda tanım gereği doğrudur. Denge testi, gözlenen genotip sayılarını p², 2pq, q²'den beklenenlerle karşılaştırmaktır." },
        { id: "B", text: "Heterozygotes are in excess, which fits heterozygote advantage.", isCorrect: false, errorTag: "Yön Hatası: Heterozigot eksikliğini fazlalık sanmak.", remediation: "Beklenen Aa = 48, gözlenen 20: heterozigotlar EKSİK. Heterozygote advantage tam tersi bir sapma üretirdi." },
        { id: "C", text: "p = 0.70 and q = 0.30, so the expected numbers are 49 AA, 42 Aa and 9 aa.", isCorrect: false, errorTag: "Allel Sayma Hatası: Heterozigotları tam bir A alleli olarak saymak.", remediation: "Her Aa bireyi bir A ve bir a taşır. p = (2 × 50 + 20) / 200 = 0.60; AA + Aa frekansını toplamak (0.70) yanlıştır." },
        { id: "D", text: "p = 0.60; only 20 Aa are seen versus 48 expected, which fits inbreeding.", isCorrect: true }
      ],
      generalRemediation: "Hardy-Weinberg sapma testi: (1) allel frekanslarını gözlenen genotiplerden hesapla, (2) beklenen sayılar p²N, 2pqN, q²N, (3) karşılaştır (gerekirse chi-square). Heterozigot eksikliği nonrandom mating (inbreeding, self-fertilization) veya alt popülasyon yapısına işaret eder.",
      stepByStepSolution: "1. Toplam allel = 200. A sayısı = 2 × 50 + 20 = 120 ⟹ p = 0.60, q = 0.40.<br/>2. Beklenen: AA = 0.36 × 100 = 36; Aa = 0.48 × 100 = 48; aa = 0.16 × 100 = 16.<br/>3. Gözlenen: 50, 20, 30 ⟹ homozigot fazlası, heterozigot eksikliği.<br/>4. Bu desen inbreeding gibi nonrandom mating ile uyumlu.<br/>5. Doğru cevap: D."
    },

    // ───────────── UNIT 8: Ecology ─────────────
    {
      id: "sv_bio_u8_1",
      unite: "8",
      beceri: "8.2 Energy Flow Through Ecosystems (10% rule)",
      zorluk: "easy",
      sureSn: 60,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 8.2)",
      question: "Producers in a lake ecosystem store 20,000 kcal of energy per year in new biomass. Assuming about 10% of energy is transferred between trophic levels, how much energy reaches the tertiary consumers?",
      options: [
        { id: "A", text: "2,000 kcal", isCorrect: false, errorTag: "Trofik Basamak Sayma Hatası: Yalnızca bir aktarım yapmak.", remediation: "2,000 kcal birincil tüketicilere ulaşan enerjidir. Tertiary consumers'a kadar üç aktarım vardır." },
        { id: "B", text: "200 kcal", isCorrect: false, errorTag: "Trofik Basamak Sayma Hatası: Üreticileri ilk tüketici basamağı saymak.", remediation: "200 kcal secondary consumers'ın payıdır. Üretici → primary → secondary → tertiary: üç kez 10%." },
        { id: "C", text: "20 kcal", isCorrect: true },
        { id: "D", text: "2 kcal", isCorrect: false, errorTag: "Fazla Aktarım: Dört kez 10% uygulamak.", remediation: "2 kcal quaternary consumers düzeyine karşılık gelir. Tertiary için 20,000 × 0.1³ = 20 kcal." }
      ],
      generalRemediation: "Enerji trofik basamaklar arasında yaklaşık %10 verimle aktarılır; kalan büyük kısım hücresel solunumla ısı olarak kaybolur. Bu yüzden besin zincirleri genellikle 4–5 basamakla sınırlıdır ve enerji piramidi her zaman tabanı geniştir.",
      stepByStepSolution: "1. Primary consumers: 20,000 × 0.1 = 2,000 kcal.<br/>2. Secondary consumers: 2,000 × 0.1 = 200 kcal.<br/>3. Tertiary consumers: 200 × 0.1 = 20 kcal.<br/>4. Doğru cevap: C."
    },
    {
      id: "sv_bio_u8_2",
      unite: "8",
      beceri: "8.2 Energy Flow Through Ecosystems (interpreting ±2 SE error bars)",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 8.2) — data analysis",
      question: "To test whether added nitrogen increases primary productivity, researchers measured seedling height in 20 control plots and 20 nitrogen-fertilized plots. Results (mean ± 2 SE):<br/>• Control: 10.9 ± 0.9 cm<br/>• Nitrogen: 12.4 ± 1.1 cm<br/>Which conclusion is best supported?",
      options: [
        { id: "A", text: "The ±2 SE intervals overlap, so the difference is not statistically supported.", isCorrect: true },
        { id: "B", text: "Nitrogen clearly increased growth, because its mean is 1.5 cm higher.", isCorrect: false, errorTag: "Değişkenlik İhmali: Yalnızca ortalamaları karşılaştırmak.", remediation: "Ortalamalar arasındaki fark, örnekleme belirsizliğiyle birlikte değerlendirilmelidir. ±2 SE aralıkları (10.0–11.8 ve 11.3–13.5) örtüşüyor." },
        { id: "C", text: "The intervals do not overlap, so nitrogen had a significant effect.", isCorrect: false, errorTag: "Aralık Hesaplama Hatası: Hata çubuklarının sınırlarını yanlış hesaplamak.", remediation: "Kontrol üst sınırı 10.9 + 0.9 = 11.8; nitrogen alt sınırı 12.4 − 1.1 = 11.3. 11.3 < 11.8 olduğundan aralıklar örtüşür." },
        { id: "D", text: "The data prove that nitrogen has no effect on seedling growth at all.", isCorrect: false, errorTag: "Aşırı Genelleme: Anlamsız farkı 'etki yok' kanıtı saymak.", remediation: "Örtüşen hata çubukları etkinin OLMADIĞINI kanıtlamaz; yalnızca bu veriyle farkın desteklenmediğini gösterir. Daha büyük örneklem farklı sonuç verebilir." }
      ],
      generalRemediation: "AP Biology'de ±2 SE hata çubukları yaklaşık %95 güven aralığı gibi yorumlanır: çubuklar örtüşmüyorsa fark muhtemelen istatistiksel olarak anlamlıdır; örtüşüyorsa fark desteklenmez (ama 'etki yok' da kanıtlanmaz). Önce her grubun alt–üst sınırını hesapla.",
      stepByStepSolution: "1. Kontrol aralığı: 10.9 ± 0.9 ⟹ 10.0–11.8 cm.<br/>2. Nitrogen aralığı: 12.4 ± 1.1 ⟹ 11.3–13.5 cm.<br/>3. 11.3–11.8 bölgesinde örtüşme var.<br/>4. Fark istatistiksel olarak desteklenmez; etki olmadığı da kanıtlanmaz.<br/>5. Doğru cevap: A."
    },
    {
      id: "sv_bio_u8_3",
      unite: "8",
      beceri: "8.4 Effect of Density of Populations (logistic growth)",
      zorluk: "hard",
      sureSn: 120,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 8.4)",
      question: "A deer population on an island has $r_{max} = 0.4$ per year and a carrying capacity of $K = 1000$. Using the logistic model $\\frac{dN}{dt} = r_{max}N\\frac{K - N}{K}$, what is the population growth rate when $N = 300$?",
      options: [
        { id: "A", text: "120 deer per year", isCorrect: false, errorTag: "Model Hatası: Exponential model kullanmak.", remediation: "r × N = 0.4 × 300 = 120 exponential büyümedir. Logistic modelde (K − N)/K = 0.7 çarpanı eklenmelidir." },
        { id: "B", text: "84 deer per year", isCorrect: true },
        { id: "C", text: "36 deer per year", isCorrect: false, errorTag: "Çarpan Hatası: (K − N)/K yerine N/K kullanmak.", remediation: "N/K = 0.3 doluluk oranıdır; büyümeyi sınırlayan çarpan kalan kapasitedir: (1000 − 300)/1000 = 0.7." },
        { id: "D", text: "0.28 deer per year", isCorrect: false, errorTag: "Eksik Terim: N ile çarpmayı unutmak.", remediation: "0.4 × 0.7 = 0.28 kişi başına büyüme hızıdır. Popülasyon büyüme hızı için N = 300 ile çarp: 84." }
      ],
      generalRemediation: "Logistic growth: dN/dt = r_max N (K − N)/K. N küçükken büyüme neredeyse exponential; N = K/2'de en hızlı; N → K iken büyüme sıfıra yaklaşır. (K − N)/K terimi density-dependent sınırlamayı (kaynak, rekabet) temsil eder.",
      stepByStepSolution: "1. (K − N)/K = (1000 − 300)/1000 = 0.7.<br/>2. dN/dt = 0.4 × 300 × 0.7.<br/>3. = 120 × 0.7 = 84 deer/year.<br/>4. Doğru cevap: B."
    }
  ]
};
