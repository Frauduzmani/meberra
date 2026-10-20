// AP MEBERRA — Seviye Testi (Tanı Sınavı): AP Chemistry
// Hazırlayan: Doç. Dr. Selin Erdem (AP Kimya Baş Eğitmeni). Şema: PM Tur 3 seviye şeması.
// Her CED ünitesi için 3 yeni tanı sorusu (easy / medium / hard). Tüm sayısal cevaplar Python 3.11 ile bağımsız doğrulandı.
// Not: AP Chemistry'de hesap makinesi sınavın TAMAMINDA (MCQ + FRQ) serbesttir; soru düzeyindeki
// hesapMakinesi alanı, o sorunun hesap makinesiyle hesaplama gerektirip gerektirmediğini gösterir.
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
  ],
  sorular: [
    // ---------------- UNIT 1 ----------------
    {
      id: "sv_chem_u1_1", unite: "1", beceri: "Mass spectra of elements (average atomic mass)", zorluk: "easy", sureSn: 75, hesapMakinesi: true,
      source: "AP-style original (CED Topic 1.2)",
      question: "A mass spectrum of naturally occurring chlorine shows two peaks: Cl-35 (isotopic mass 34.969 amu, relative abundance 75.78%) and Cl-37 (isotopic mass 36.966 amu, relative abundance 24.22%). What is the average atomic mass of chlorine?",
      options: [
        { id: "A", text: "35.97 amu", isCorrect: false, errorTag: "Ağırlıksız (basit) ortalama", remediation: "İki izotop kütlesinin basit ortalamasını aldın. <strong>Average atomic mass</strong> bolluk oranlarıyla ağırlıklandırılmış ortalamadır." },
        { id: "B", text: "35.45 amu", isCorrect: true },
        { id: "C", text: "36.48 amu", isCorrect: false, errorTag: "Bolluk oranları ters eşleştirildi", remediation: "%75.78'i Cl-37'ye, %24.22'yi Cl-35'e bağladın. Spektrumdaki yüksek tepe hafif izotopa (Cl-35) aittir." },
        { id: "D", text: "35.00 amu", isCorrect: false, errorTag: "En bol izotopun kütle numarası", remediation: "Yalnızca en bol izotopun kütle numarasını yazdın. Ortalama, tüm izotopların katkısını içerir." }
      ],
      generalRemediation: "Mass spectrum'da her tepenin yüksekliği relative abundance'ı verir; average atomic mass = Σ (abundance × isotopic mass).",
      stepByStepSolution: "1) 0.7578 × 34.969 = 26.50 amu.<br/>2) 0.2422 × 36.966 = 8.953 amu.<br/>3) Toplam = 35.45 amu. Doğru şık B."
    },
    {
      id: "sv_chem_u1_2", unite: "1", beceri: "Periodic trends: ionization energy (Coulomb's law)", zorluk: "medium", sureSn: 75, hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.7)",
      question: "The first ionization energy of oxygen (1314 kJ/mol) is lower than that of nitrogen (1402 kJ/mol), even though oxygen has a greater nuclear charge. Which of the following best explains this observation?",
      options: [
        { id: "A", text: "The electron removed from O is in a higher-energy 3s sublevel.", isCorrect: false, errorTag: "Yanlış elektron konfigürasyonu", remediation: "O: 1s² 2s² 2p⁴. Koparılan elektron 2p'dedir; 3s'de elektron yoktur." },
        { id: "B", text: "Oxygen has a greater effective nuclear charge than nitrogen.", isCorrect: false, errorTag: "Doğru bilgi, ters sonuç", remediation: "Daha büyük effective nuclear charge iyonlaşma enerjisini <strong>artırır</strong>; düşüşü açıklayamaz." },
        { id: "C", text: "Oxygen has more core electrons shielding its valence electrons.", isCorrect: false, errorTag: "Perdeleme hatası", remediation: "N ve O aynı periyottadır; ikisinin de core electron sayısı 2'dir (1s²). Perdeleme farkı yoktur." },
        { id: "D", text: "In O, the removed 2p electron is paired, and electron–electron repulsion makes it easier to remove.", isCorrect: true }
      ],
      generalRemediation: "Periyot boyunca IE genel olarak artar; N→O düşüşü, 2p⁴'teki ilk eşleşmiş elektronun yaşadığı ek electron–electron repulsion ile açıklanır.",
      stepByStepSolution: "1) N: 2p³ — üç orbitalde birer elektron, eşleşme yok.<br/>2) O: 2p⁴ — bir orbitalde iki elektron eşleşmiş.<br/>3) Eşleşmiş elektronlar arasındaki itme, koparılan elektronun enerjisini yükseltir, yani koparmak kolaylaşır.<br/>Doğru şık D."
    },
    {
      id: "sv_chem_u1_3", unite: "1", beceri: "Elemental composition: empirical and molecular formula", zorluk: "hard", sureSn: 150, hesapMakinesi: true,
      source: "AP-style original (CED Topic 1.3)",
      question: "An oxide of phosphorus is 43.64% P and 56.36% O by mass. Its molar mass is 283.9 g/mol. What is the molecular formula of the compound? (P = 30.97 g/mol, O = 16.00 g/mol)",
      options: [
        { id: "A", text: "P<sub>4</sub>O<sub>10</sub>", isCorrect: true },
        { id: "B", text: "P<sub>2</sub>O<sub>5</sub>", isCorrect: false, errorTag: "Empirical formula'da durmak", remediation: "P₂O₅ empirical formula'dır (141.94 g/mol). Molar mass / empirical mass = 2 olduğundan alt indisleri 2 ile çarpmalısın." },
        { id: "C", text: "PO<sub>2</sub>", isCorrect: false, errorTag: "1 : 2.5 oranını aşağı yuvarlamak", remediation: "Mol oranı 1 : 2.50 çıkar; .5 kesirli oranlar yuvarlanmaz, tüm oran 2 ile çarpılarak tam sayıya çevrilir." },
        { id: "D", text: "PO<sub>3</sub>", isCorrect: false, errorTag: "1 : 2.5 oranını yukarı yuvarlamak", remediation: "2.50'yi 3'e yuvarladın. Kesirli oranı tam sayıya çevirmek için 2 ile çarp: P₂O₅." }
      ],
      generalRemediation: "Kütle yüzdesi → 100 g varsay → mol → en küçük mole böl → tam sayı oranı (gerekirse çarp) → molar mass oranıyla molecular formula.",
      stepByStepSolution: "1) mol P = 43.64 / 30.97 = 1.409; mol O = 56.36 / 16.00 = 3.523.<br/>2) Oran O/P = 2.50 → ×2 → P₂O₅ (empirical, 141.94 g/mol).<br/>3) 283.9 / 141.94 = 2.00 → P₄O₁₀. Doğru şık A."
    },
    // ---------------- UNIT 2 ----------------
    {
      id: "sv_chem_u2_1", unite: "2", beceri: "Structure of ionic solids (Coulombic attraction)", zorluk: "easy", sureSn: 60, hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.3)",
      question: "Which of the following ionic compounds is expected to have the highest melting point?",
      options: [
        { id: "A", text: "NaF", isCorrect: false, errorTag: "Yalnızca iyon boyutuna bakmak", remediation: "F⁻ küçük bir iyondur ama NaF'de yükler yalnızca +1/−1'dir. Coulomb's law'da yük çarpımı boyuttan daha baskındır." },
        { id: "B", text: "KBr", isCorrect: false, errorTag: "Büyük iyonlar = güçlü çekim sanmak", remediation: "K⁺ ve Br⁻ büyük, tek yüklü iyonlardır; çekim kuvveti en zayıf olanlardan biridir." },
        { id: "C", text: "MgO", isCorrect: true },
        { id: "D", text: "NaCl", isCorrect: false, errorTag: "En tanıdık bileşiği seçmek", remediation: "NaCl +1/−1 yüklüdür; Mg²⁺/O²⁻ çiftinin yük çarpımı 4 kat büyüktür." }
      ],
      generalRemediation: "Coulomb's law: F ∝ q₁q₂ / r². İyonik katılarda erime noktası önce iyon yüklerine, sonra iyon yarıçaplarına bağlıdır.",
      stepByStepSolution: "1) MgO: +2 ve −2 yükler, küçük iyonlar → yük çarpımı 4.<br/>2) Diğerleri +1/−1 → yük çarpımı 1.<br/>3) En güçlü Coulombic attraction MgO'dadır. Doğru şık C."
    },
    {
      id: "sv_chem_u2_2", unite: "2", beceri: "VSEPR and bond hybridization; molecular polarity", zorluk: "medium", sureSn: 90, hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.7)",
      question: "What are the molecular geometry and polarity of SF<sub>4</sub>?",
      options: [
        { id: "A", text: "Seesaw; polar", isCorrect: true },
        { id: "B", text: "Tetrahedral; nonpolar", isCorrect: false, errorTag: "Lone pair'i saymamak", remediation: "S'nin 6 valence electron'unun 4'ü bağda, 2'si bir lone pair'dedir: 5 electron domain → trigonal bipyramidal electron geometry." },
        { id: "C", text: "Square planar; nonpolar", isCorrect: false, errorTag: "XeF₄ ile karıştırmak", remediation: "Square planar, 6 domain ve 2 lone pair (XeF₄) içindir. SF₄'te 5 domain ve 1 lone pair vardır." },
        { id: "D", text: "Trigonal pyramidal; polar", isCorrect: false, errorTag: "NH₃ kalıbını uygulamak", remediation: "Trigonal pyramidal 4 domain + 1 lone pair içindir. SF₄'te 4 bağ + 1 lone pair = 5 domain vardır." }
      ],
      generalRemediation: "Lewis structure → electron domain sayısı → electron geometry → lone pair'leri çıkararak molecular geometry. Asimetrik şekil + polar bağlar = polar molekül.",
      stepByStepSolution: "1) Valence electron: 6 + 4×7 = 34.<br/>2) S etrafında 4 S–F bağı + 1 lone pair = 5 domain.<br/>3) Lone pair ekvatoral konumda → seesaw.<br/>4) Dipoller birbirini götürmez → polar. Doğru şık A."
    },
    {
      id: "sv_chem_u2_3", unite: "2", beceri: "Resonance, bond order and hybridization", zorluk: "hard", sureSn: 120, hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.6)",
      question: "In the nitrate ion, NO<sub>3</sub><sup>−</sup>, what is the average N–O bond order, and what is the hybridization of the nitrogen atom?",
      options: [
        { id: "A", text: "Bond order 2; sp<sup>2</sup>", isCorrect: false, errorTag: "Tek resonance yapısına bakmak", remediation: "Tek bir Lewis yapısındaki çift bağı tüm bağlara genelledin. 3 eşdeğer resonance yapısı vardır; çift bağ üç bağa dağılır." },
        { id: "B", text: "Bond order 1.5; sp<sup>2</sup>", isCorrect: false, errorTag: "O₃ / NO₂⁻ ile karıştırmak", remediation: "1.5, iki resonance yapısı olan iyonlar (NO₂⁻, O₃) içindir. NO₃⁻'de 4 bağ çifti 3 bağa dağılır: 4/3." },
        { id: "C", text: "Bond order 4/3; sp<sup>3</sup>", isCorrect: false, errorTag: "Pi bağını domain olarak saymak", remediation: "Çift bağ tek bir electron domain sayılır. N etrafında 3 domain vardır → sp²." },
        { id: "D", text: "Bond order 4/3; sp<sup>2</sup>", isCorrect: true }
      ],
      generalRemediation: "Average bond order = toplam bağ sayısı / bağlı atom sayısı (resonance üzerinden). Hybridization, sigma bağları + lone pair'lerden oluşan electron domain sayısından bulunur.",
      stepByStepSolution: "1) Her resonance yapısında 1 çift + 2 tekli bağ = 4 bağ.<br/>2) 4 bağ / 3 N–O = 4/3.<br/>3) N etrafında 3 domain, lone pair yok → trigonal planar, sp². Doğru şık D."
    },
    // ---------------- UNIT 3 ----------------
    {
      id: "sv_chem_u3_1", unite: "3", beceri: "Intermolecular forces and boiling point", zorluk: "easy", sureSn: 60, hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.1)",
      question: "The following substances have similar molar masses (44–46 g/mol). Which has the highest normal boiling point?",
      options: [
        { id: "A", text: "CH<sub>3</sub>OCH<sub>3</sub> (dimethyl ether)", isCorrect: false, errorTag: "O atomu = hydrogen bonding sanmak", remediation: "Dimethyl ether'de H atomları yalnızca C'ye bağlıdır; O–H yoktur, bu yüzden saf maddede hydrogen bonding oluşmaz." },
        { id: "B", text: "CH<sub>3</sub>CH<sub>2</sub>OH (ethanol)", isCorrect: true },
        { id: "C", text: "CH<sub>3</sub>CHO (acetaldehyde)", isCorrect: false, errorTag: "Dipole–dipole'u en güçlü sanmak", remediation: "Acetaldehyde polardır (dipole–dipole) ama O–H bağı yoktur; hydrogen bonding ethanol'den güçlü IMF sağlar." },
        { id: "D", text: "CH<sub>3</sub>CH<sub>2</sub>CH<sub>3</sub> (propane)", isCorrect: false, errorTag: "Yalnızca molar mass'a bakmak", remediation: "Propane apolardır; yalnızca London dispersion forces içerir. Benzer kütlede en düşük kaynama noktası onundur." }
      ],
      generalRemediation: "Benzer molar mass'ta kaynama noktası IMF türüyle belirlenir: hydrogen bonding (H–N, H–O, H–F) > dipole–dipole > yalnızca London dispersion.",
      stepByStepSolution: "1) Ethanol'de O–H bağı var → hydrogen bonding.<br/>2) Acetaldehyde ve dimethyl ether yalnızca dipole–dipole; propane yalnızca LDF.<br/>3) En güçlü IMF ethanol'dedir. Doğru şık B."
    },
    {
      id: "sv_chem_u3_2", unite: "3", beceri: "Ideal gas law: molar mass from gas data", zorluk: "medium", sureSn: 90, hesapMakinesi: true,
      source: "AP-style original (CED Topic 3.4)",
      question: "A 1.60 g sample of an unknown gas occupies 1.00 L at 27°C and 1.00 atm. What is the molar mass of the gas? (R = 0.08206 L·atm·mol<sup>−1</sup>·K<sup>−1</sup>)",
      options: [
        { id: "A", text: "3.54 g/mol", isCorrect: false, errorTag: "Sıcaklığı Kelvin'e çevirmemek", remediation: "T = 27°C değil, 27 + 273 = 300 K kullanılmalı. Gaz yasalarında sıcaklık daima Kelvin'dir." },
        { id: "B", text: "0.0254 g/mol", isCorrect: false, errorTag: "Formülü ters kurmak", remediation: "M = mRT / PV olmalı; PV / (mRT) yazdın. Birim kontrolü: g/mol çıkmalı." },
        { id: "C", text: "39.4 g/mol", isCorrect: true },
        { id: "D", text: "3990 g/mol", isCorrect: false, errorTag: "Yanlış R sabiti", remediation: "Basınç atm, hacim L ise R = 0.08206 kullanılır; 8.314 J·mol⁻¹·K⁻¹ SI birimleri içindir." }
      ],
      generalRemediation: "PV = nRT ve n = m/M birleştirilirse M = mRT / (PV). R'nin birimleri P ve V birimleriyle uyumlu olmalı, T Kelvin olmalı.",
      stepByStepSolution: "1) T = 300 K.<br/>2) M = (1.60)(0.08206)(300) / (1.00 × 1.00) = 39.4 g/mol.<br/>Doğru şık C."
    },
    {
      id: "sv_chem_u3_3", unite: "3", beceri: "Beer–Lambert law", zorluk: "hard", sureSn: 120, hesapMakinesi: true,
      source: "AP-style original (CED Topic 3.13)",
      question: "A 2.0 × 10<sup>−4</sup> M solution of a dye has an absorbance of 0.600 in a 1.00 cm cuvette. A solution of the same dye at an unknown concentration has an absorbance of 0.450 when measured at the same wavelength in a 2.00 cm cuvette. What is the unknown concentration?",
      options: [
        { id: "A", text: "7.5 × 10<sup>−5</sup> M", isCorrect: true },
        { id: "B", text: "1.5 × 10<sup>−4</sup> M", isCorrect: false, errorTag: "Path length'i ihmal etmek", remediation: "A = εbc'de b = 2.00 cm. Işık yolu iki katına çıkınca aynı absorbans için konsantrasyon yarıya iner." },
        { id: "C", text: "2.7 × 10<sup>−4</sup> M", isCorrect: false, errorTag: "Absorbans oranını ters kurmak", remediation: "Absorbans konsantrasyonla doğru orantılıdır. Daha düşük absorbans (0.450 < 0.600) daha düşük konsantrasyon demektir." },
        { id: "D", text: "3.0 × 10<sup>−4</sup> M", isCorrect: false, errorTag: "Path length ile çarpmak", remediation: "b paydadadır: c = A / (εb). Path length ile bölmek yerine çarptın." }
      ],
      generalRemediation: "Beer–Lambert law: A = εbc. Önce standart çözeltiden ε'yi bul, sonra bilinmeyen için c = A / (εb) uygula.",
      stepByStepSolution: "1) ε = 0.600 / (1.00 cm × 2.0 × 10⁻⁴ M) = 3.0 × 10³ M⁻¹cm⁻¹.<br/>2) c = 0.450 / (3.0 × 10³ × 2.00) = 7.5 × 10⁻⁵ M.<br/>Doğru şık A."
    },
    // ---------------- UNIT 4 ----------------
    {
      id: "sv_chem_u4_1", unite: "4", beceri: "Net ionic equations", zorluk: "easy", sureSn: 60, hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.2)",
      question: "Aqueous solutions of AgNO<sub>3</sub> and NaCl are mixed, and a white precipitate forms. Which is the correct net ionic equation?",
      options: [
        { id: "A", text: "Ag<sup>+</sup>(aq) + NO<sub>3</sub><sup>−</sup>(aq) + Na<sup>+</sup>(aq) + Cl<sup>−</sup>(aq) → AgCl(s) + Na<sup>+</sup>(aq) + NO<sub>3</sub><sup>−</sup>(aq)", isCorrect: false, errorTag: "Spectator ion'ları silmemek", remediation: "Bu complete ionic equation'dır. Na⁺ ve NO₃⁻ iki tarafta aynı kaldığı için net ionic equation'dan çıkarılır." },
        { id: "B", text: "Na<sup>+</sup>(aq) + NO<sub>3</sub><sup>−</sup>(aq) → NaNO<sub>3</sub>(s)", isCorrect: false, errorTag: "Yanlış çökelek", remediation: "Na⁺ ve NO₃⁻ tuzları her zaman suda çözünür. Çökelek AgCl'dir." },
        { id: "C", text: "AgNO<sub>3</sub>(aq) + Cl<sup>−</sup>(aq) → AgCl(s) + NO<sub>3</sub><sup>−</sup>(aq)", isCorrect: false, errorTag: "Güçlü elektroliti ayrıştırmamak", remediation: "AgNO₃(aq) çözeltide tamamen iyonlarına ayrışır; formül birimi olarak yazılmaz." },
        { id: "D", text: "Ag<sup>+</sup>(aq) + Cl<sup>−</sup>(aq) → AgCl(s)", isCorrect: true }
      ],
      generalRemediation: "Net ionic equation: güçlü elektrolitleri iyonlara ayır, çökelek/gaz/zayıf elektroliti molekül olarak bırak, spectator ion'ları sil.",
      stepByStepSolution: "1) Complete ionic: Ag⁺ + NO₃⁻ + Na⁺ + Cl⁻ → AgCl(s) + Na⁺ + NO₃⁻.<br/>2) Na⁺ ve NO₃⁻ spectator.<br/>3) Net: Ag⁺(aq) + Cl⁻(aq) → AgCl(s). Doğru şık D."
    },
    {
      id: "sv_chem_u4_2", unite: "4", beceri: "Stoichiometry: limiting reactant", zorluk: "medium", sureSn: 120, hesapMakinesi: true,
      source: "AP-style original (CED Topic 4.5)",
      question: "Aluminum reacts with chlorine gas: 2 Al(s) + 3 Cl<sub>2</sub>(g) → 2 AlCl<sub>3</sub>(s). If 5.40 g of Al reacts with 10.65 g of Cl<sub>2</sub>, what is the maximum mass of AlCl<sub>3</sub> (133.33 g/mol) that can form? (Al = 26.98 g/mol, Cl<sub>2</sub> = 70.90 g/mol)",
      options: [
        { id: "A", text: "26.7 g", isCorrect: false, errorTag: "Limiting reactant'ı yanlış seçmek", remediation: "Al'dan hesap yaptın. 0.200 mol Al için 0.300 mol Cl₂ gerekir ama yalnızca 0.150 mol var; limiting reactant Cl₂'dir." },
        { id: "B", text: "13.4 g", isCorrect: true },
        { id: "C", text: "20.0 g", isCorrect: false, errorTag: "Mol oranını 1:1 almak", remediation: "Cl₂ : AlCl₃ oranı 3 : 2'dir. mol AlCl₃ = 0.150 × 2/3 = 0.100 mol." },
        { id: "D", text: "16.1 g", isCorrect: false, errorTag: "Kütleleri toplamak", remediation: "Kütlelerin toplamı ancak iki reaktif de tamamen tükenirse ürün kütlesine eşittir. Burada Al artar." }
      ],
      generalRemediation: "Limiting reactant: her reaktifin molünü stoichiometric katsayısına bölüp en küçük olanı bul; ürünü o reaktiften hesapla.",
      stepByStepSolution: "1) mol Al = 5.40 / 26.98 = 0.200; mol Cl₂ = 10.65 / 70.90 = 0.150.<br/>2) 0.200/2 = 0.100 ; 0.150/3 = 0.050 → Cl₂ limiting.<br/>3) mol AlCl₃ = 0.150 × 2/3 = 0.100 mol → 0.100 × 133.33 = 13.4 g. Doğru şık B."
    },
    {
      id: "sv_chem_u4_3", unite: "4", beceri: "Redox titration", zorluk: "hard", sureSn: 150, hesapMakinesi: true,
      source: "AP-style original (CED Topic 4.6)",
      question: "In acidic solution, permanganate oxidizes iron(II): MnO<sub>4</sub><sup>−</sup> + 5 Fe<sup>2+</sup> + 8 H<sup>+</sup> → Mn<sup>2+</sup> + 5 Fe<sup>3+</sup> + 4 H<sub>2</sub>O. A 25.00 mL sample of Fe<sup>2+</sup> solution requires 20.00 mL of 0.0200 M KMnO<sub>4</sub> to reach the equivalence point. What is [Fe<sup>2+</sup>] in the sample?",
      options: [
        { id: "A", text: "0.0160 M", isCorrect: false, errorTag: "Mol oranını 1:1 almak", remediation: "Denklemde 1 MnO₄⁻, 5 Fe²⁺ ile tepkimeye girer. mol Fe²⁺ = 5 × mol MnO₄⁻." },
        { id: "B", text: "0.00320 M", isCorrect: false, errorTag: "Oranı ters uygulamak", remediation: "5'e böldün; oysa her MnO₄⁻ beş Fe²⁺ tükettiği için 5 ile çarpmalısın." },
        { id: "C", text: "0.0800 M", isCorrect: true },
        { id: "D", text: "0.125 M", isCorrect: false, errorTag: "Hacimleri karıştırmak", remediation: "MnO₄⁻ molünü titrant hacmiyle (20.00 mL), [Fe²⁺]'yi örnek hacmiyle (25.00 mL) hesapla. Hacimleri yer değiştirdin." }
      ],
      generalRemediation: "Titrasyon: mol titrant = M × V → denklem katsayılarıyla analit molü → analit hacmine böl.",
      stepByStepSolution: "1) mol MnO₄⁻ = 0.0200 × 0.02000 = 4.00 × 10⁻⁴ mol.<br/>2) mol Fe²⁺ = 5 × 4.00 × 10⁻⁴ = 2.00 × 10⁻³ mol.<br/>3) [Fe²⁺] = 2.00 × 10⁻³ / 0.02500 = 0.0800 M. Doğru şık C."
    },
    // ---------------- UNIT 5 ----------------
    {
      id: "sv_chem_u5_1", unite: "5", beceri: "Introduction to rate law (method of initial rates)", zorluk: "easy", sureSn: 75, hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.2)",
      question: "For the reaction A + B → products, doubling [A] while holding [B] constant quadruples the initial rate. Doubling [B] while holding [A] constant leaves the initial rate unchanged. What is the rate law?",
      options: [
        { id: "A", text: "Rate = k[A]<sup>2</sup>", isCorrect: true },
        { id: "B", text: "Rate = k[A][B]", isCorrect: false, errorTag: "Katsayılardan rate law yazmak", remediation: "Rate law deneysel verilerden belirlenir, denklem katsayılarından değil. [B] değişince hız değişmiyorsa B'nin derecesi 0'dır." },
        { id: "C", text: "Rate = k[A]<sup>2</sup>[B]", isCorrect: false, errorTag: "Sıfırıncı dereceyi gözden kaçırmak", remediation: "[B] iki katına çıktığında hız değişmedi: 2ⁿ = 1 → n = 0. [B] rate law'da yer almaz." },
        { id: "D", text: "Rate = k[A]<sup>4</sup>", isCorrect: false, errorTag: "Hız çarpanını üs olarak yazmak", remediation: "Hız 4 katına çıktı: 2ᵐ = 4 → m = 2. Çarpanın kendisi (4) üs değildir." }
      ],
      generalRemediation: "Method of initial rates: konsantrasyon çarpanı^n = hız çarpanı. n, o reaktifin derecesidir.",
      stepByStepSolution: "1) [A] ×2 → hız ×4 → 2ᵐ = 4 → m = 2.<br/>2) [B] ×2 → hız ×1 → n = 0.<br/>3) Rate = k[A]². Doğru şık A."
    },
    {
      id: "sv_chem_u5_2", unite: "5", beceri: "Concentration changes over time (first-order integrated rate law)", zorluk: "medium", sureSn: 100, hesapMakinesi: true,
      source: "AP-style original (CED Topic 5.3)",
      question: "A first-order reaction has k = 0.0150 s<sup>−1</sup>. If the initial concentration of reactant is 0.800 M, what is its concentration after 60.0 s?",
      options: [
        { id: "A", text: "0.465 M", isCorrect: false, errorTag: "Second-order denklemi kullanmak", remediation: "1/[A] = kt + 1/[A]₀ second-order içindir. First-order: ln[A] = −kt + ln[A]₀." },
        { id: "B", text: "1.97 M", isCorrect: false, errorTag: "Üs işaretini kaçırmak", remediation: "Reaktif tüketildiği için [A] azalmalı: [A] = [A]₀e^(−kt). Pozitif üs konsantrasyonu artırır; bu fiziksel olarak imkânsız." },
        { id: "C", text: "0.101 M", isCorrect: false, errorTag: "ln yerine log₁₀", remediation: "Integrated rate law doğal logaritma (ln) içerir; 10^(−kt) değil e^(−kt) kullanılır." },
        { id: "D", text: "0.325 M", isCorrect: true }
      ],
      generalRemediation: "First-order: [A]ₜ = [A]₀e^(−kt). Sonucun [A]₀'dan küçük olduğunu kontrol et.",
      stepByStepSolution: "1) kt = 0.0150 × 60.0 = 0.900.<br/>2) [A] = 0.800 × e^(−0.900) = 0.800 × 0.4066 = 0.325 M.<br/>Doğru şık D."
    },
    {
      id: "sv_chem_u5_3", unite: "5", beceri: "Reaction mechanism and rate law (fast pre-equilibrium)", zorluk: "hard", sureSn: 120, hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.9)",
      question: "The proposed mechanism for 2 NO(g) + O<sub>2</sub>(g) → 2 NO<sub>2</sub>(g) is:<br/>Step 1 (fast, reversible): 2 NO ⇌ N<sub>2</sub>O<sub>2</sub><br/>Step 2 (slow): N<sub>2</sub>O<sub>2</sub> + O<sub>2</sub> → 2 NO<sub>2</sub><br/>Which rate law is consistent with this mechanism?",
      options: [
        { id: "A", text: "Rate = k[N<sub>2</sub>O<sub>2</sub>][O<sub>2</sub>]", isCorrect: false, errorTag: "Intermediate'i rate law'da bırakmak", remediation: "N₂O₂ bir intermediate'tir; deneysel rate law'da yer alamaz. Hızlı ön dengeyi kullanarak [N₂O₂] = K[NO]² yerine koy." },
        { id: "B", text: "Rate = k[NO]<sup>2</sup>[O<sub>2</sub>]", isCorrect: true },
        { id: "C", text: "Rate = k[NO]<sup>2</sup>", isCorrect: false, errorTag: "Hızlı adımı rate-determining sanmak", remediation: "Hızı en yavaş adım (Step 2) belirler; O₂ bu adımda yer aldığı için rate law'da bulunmalıdır." },
        { id: "D", text: "Rate = k[NO][O<sub>2</sub>]", isCorrect: false, errorTag: "Ön dengenin derecesini yanlış almak", remediation: "Step 1'de 2 NO tükenir, bu yüzden [N₂O₂] ∝ [NO]²; NO'nun derecesi 2'dir." }
      ],
      generalRemediation: "Rate law slow (rate-determining) step'ten yazılır; intermediate varsa önceki hızlı dengeden ifade edilip yerine konur.",
      stepByStepSolution: "1) Slow step: Rate = k₂[N₂O₂][O₂].<br/>2) Fast equilibrium: [N₂O₂] = K₁[NO]².<br/>3) Rate = k₂K₁[NO]²[O₂] = k[NO]²[O₂]. Doğru şık B."
    },
    // ---------------- UNIT 6 ----------------
    {
      id: "sv_chem_u6_1", unite: "6", beceri: "Heat capacity and calorimetry", zorluk: "easy", sureSn: 75, hesapMakinesi: true,
      source: "AP-style original (CED Topic 6.4)",
      question: "How much heat is absorbed when 50.0 g of water is warmed from 22.0°C to 30.0°C? (specific heat of water = 4.18 J·g<sup>−1</sup>·°C<sup>−1</sup>)",
      options: [
        { id: "A", text: "0.400 kJ", isCorrect: false, errorTag: "Specific heat'i unutmak", remediation: "q = mcΔT; c = 4.18 J·g⁻¹·°C⁻¹ çarpanını atladın (50.0 × 8.0 = 400 J)." },
        { id: "B", text: "6.27 kJ", isCorrect: false, errorTag: "ΔT yerine son sıcaklık", remediation: "ΔT = T_son − T_ilk = 8.0°C olmalı; 30.0°C'yi doğrudan kullandın." },
        { id: "C", text: "1.67 kJ", isCorrect: true },
        { id: "D", text: "63.4 kJ", isCorrect: false, errorTag: "Kelvin'e çevrilmiş son sıcaklık", remediation: "ΔT, °C veya K cinsinden aynıdır (8.0). Mutlak sıcaklık (303 K) kullanılmaz." }
      ],
      generalRemediation: "q = mcΔT. ΔT bir farktır; °C ve K'de sayısal olarak eşittir.",
      stepByStepSolution: "1) ΔT = 30.0 − 22.0 = 8.0°C.<br/>2) q = 50.0 × 4.18 × 8.0 = 1672 J = 1.67 kJ.<br/>Doğru şık C."
    },
    {
      id: "sv_chem_u6_2", unite: "6", beceri: "Bond enthalpies", zorluk: "medium", sureSn: 90, hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.7)",
      question: "Use the average bond enthalpies H–H = 436 kJ/mol, Cl–Cl = 242 kJ/mol, and H–Cl = 431 kJ/mol to estimate ΔH for H<sub>2</sub>(g) + Cl<sub>2</sub>(g) → 2 HCl(g).",
      options: [
        { id: "A", text: "−184 kJ/mol<sub>rxn</sub>", isCorrect: true },
        { id: "B", text: "+184 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "Products − reactants sırası", remediation: "Bond enthalpy ile ΔH = Σ(kırılan bağlar) − Σ(oluşan bağlar). Ürün − reaktif sırası ΔH°f verisi içindir." },
        { id: "C", text: "+247 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "Katsayıyı atlamak", remediation: "2 mol HCl oluşur, yani 2 H–Cl bağı: 2 × 431 = 862 kJ." },
        { id: "D", text: "−1540 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "Tüm bağ enerjilerini toplamak", remediation: "Bağ kırmak endotermik (+), bağ oluşturmak ekzotermiktir (−). Tüm değerleri aynı işaretle toplayamazsın." }
      ],
      generalRemediation: "ΔH ≈ Σ BE(broken) − Σ BE(formed). Kırılan bağlar enerji gerektirir, oluşan bağlar enerji açığa çıkarır.",
      stepByStepSolution: "1) Kırılan: 436 + 242 = 678 kJ.<br/>2) Oluşan: 2 × 431 = 862 kJ.<br/>3) ΔH = 678 − 862 = −184 kJ/mol. Doğru şık A."
    },
    {
      id: "sv_chem_u6_3", unite: "6", beceri: "Enthalpy of formation", zorluk: "hard", sureSn: 120, hesapMakinesi: true,
      source: "AP-style original (CED Topic 6.8)",
      question: "Using standard enthalpies of formation, ΔH°<sub>f</sub>[CH<sub>4</sub>(g)] = −74.8 kJ/mol, ΔH°<sub>f</sub>[CO<sub>2</sub>(g)] = −393.5 kJ/mol, and ΔH°<sub>f</sub>[H<sub>2</sub>O(l)] = −285.8 kJ/mol, calculate ΔH° for CH<sub>4</sub>(g) + 2 O<sub>2</sub>(g) → CO<sub>2</sub>(g) + 2 H<sub>2</sub>O(l).",
      options: [
        { id: "A", text: "+890.3 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "Reactants − products", remediation: "ΔH° = Σ ΔH°f(products) − Σ ΔH°f(reactants). Sırayı ters kurunca işaret değişir; yanma ekzotermiktir." },
        { id: "B", text: "−604.5 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "Stoichiometric katsayıyı atlamak", remediation: "2 mol H₂O oluşur: 2 × (−285.8) = −571.6 kJ." },
        { id: "C", text: "−1039.9 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "Reaktifi çıkarmak yerine eklemek", remediation: "CH₄'ün ΔH°f değeri çıkarılır: −(−74.8) = +74.8 kJ. İşaretlere dikkat." },
        { id: "D", text: "−890.3 kJ/mol<sub>rxn</sub>", isCorrect: true }
      ],
      generalRemediation: "ΔH°rxn = Σ n·ΔH°f(products) − Σ n·ΔH°f(reactants). Elementlerin standart hâli (O₂) için ΔH°f = 0.",
      stepByStepSolution: "1) Ürünler: −393.5 + 2(−285.8) = −965.1 kJ.<br/>2) Reaktifler: −74.8 + 0 = −74.8 kJ.<br/>3) ΔH° = −965.1 − (−74.8) = −890.3 kJ/mol. Doğru şık D."
    },
    // ---------------- UNIT 7 ----------------
    {
      id: "sv_chem_u7_1", unite: "7", beceri: "Reaction quotient and equilibrium constant (Q vs K)", zorluk: "easy", sureSn: 60, hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.3)",
      question: "For a reversible reaction at constant temperature, K = 0.50. At a certain moment the reaction quotient is Q = 0.020. Which statement is correct?",
      options: [
        { id: "A", text: "The system is at equilibrium because both values are below 1.", isCorrect: false, errorTag: "Q ile K'yi karşılaştırmamak", remediation: "Denge yalnızca Q = K iken vardır. 0.020 ≠ 0.50." },
        { id: "B", text: "The reaction proceeds net forward until Q equals K.", isCorrect: true },
        { id: "C", text: "The reaction proceeds net in reverse until Q equals K.", isCorrect: false, errorTag: "Yön ters", remediation: "Q < K ise ürün oranı dengeye göre azdır; sistem ürün oluşturacak yönde (forward) ilerler." },
        { id: "D", text: "K decreases until it equals Q, at which point the reaction stops.", isCorrect: false, errorTag: "K'yı değişken sanmak", remediation: "K yalnızca sıcaklıkla değişir. Değişen Q'dur; dengede tepkime durmaz, ileri ve geri hızlar eşitlenir." }
      ],
      generalRemediation: "Q < K → net forward; Q > K → net reverse; Q = K → dynamic equilibrium.",
      stepByStepSolution: "1) Q = 0.020 < K = 0.50.<br/>2) Ürünler dengeye göre eksik → net forward reaction, Q artarak K'ya ulaşır. Doğru şık B."
    },
    {
      id: "sv_chem_u7_2", unite: "7", beceri: "Calculating equilibrium concentrations (ICE table)", zorluk: "medium", sureSn: 150, hesapMakinesi: true,
      source: "AP-style original (CED Topic 7.7)",
      question: "For H<sub>2</sub>(g) + I<sub>2</sub>(g) ⇌ 2 HI(g), K<sub>c</sub> = 49.0 at a certain temperature. A flask initially contains 0.100 M H<sub>2</sub> and 0.100 M I<sub>2</sub> and no HI. What is [HI] at equilibrium?",
      options: [
        { id: "A", text: "0.0778 M", isCorrect: false, errorTag: "x'i [HI] sanmak", remediation: "ICE tablosunda [HI] = 2x'tir. x = 0.0778 bulduktan sonra 2 ile çarpmayı unuttun." },
        { id: "B", text: "0.700 M", isCorrect: false, errorTag: "Geçersiz 'x küçük' yaklaşımı", remediation: "K = 49 büyüktür; 0.100 − x ≈ 0.100 yaklaşımı geçersizdir. Sonuç başlangıç miktarından fazla HI verir, bu imkânsız." },
        { id: "C", text: "0.156 M", isCorrect: true },
        { id: "D", text: "0.0875 M", isCorrect: false, errorTag: "Katsayıyı ICE'a yansıtmamak", remediation: "HI'nin katsayısı 2'dir: değişim +2x olmalı. Değişimi +x alınca ifade x² / (0.100 − x)² olur ve yanlış sonuç verir." }
      ],
      generalRemediation: "ICE: Initial, Change (stoichiometric katsayılarla), Equilibrium. Mükemmel kare ifadelerde karekök alarak çözmek en hızlı yoldur.",
      stepByStepSolution: "1) Denge: [H₂] = [I₂] = 0.100 − x, [HI] = 2x.<br/>2) (2x)² / (0.100 − x)² = 49.0 → 2x / (0.100 − x) = 7.00.<br/>3) 2x = 0.700 − 7x → x = 0.0778.<br/>4) [HI] = 2x = 0.156 M. Doğru şık C."
    },
    {
      id: "sv_chem_u7_3", unite: "7", beceri: "Common-ion effect on solubility", zorluk: "hard", sureSn: 120, hesapMakinesi: true,
      source: "AP-style original (CED Topic 7.12)",
      question: "K<sub>sp</sub> for CaF<sub>2</sub> is 3.9 × 10<sup>−11</sup>. What is the molar solubility of CaF<sub>2</sub> in 0.010 M NaF solution?",
      options: [
        { id: "A", text: "3.9 × 10<sup>−7</sup> M", isCorrect: true },
        { id: "B", text: "2.1 × 10<sup>−4</sup> M", isCorrect: false, errorTag: "Common ion'u ihmal etmek", remediation: "Bu, saf sudaki çözünürlüktür (∛(Ksp/4)). NaF'den gelen F⁻ dengeyi sola iter ve çözünürlüğü düşürür." },
        { id: "C", text: "3.9 × 10<sup>−9</sup> M", isCorrect: false, errorTag: "[F⁻]'nin karesini almamak", remediation: "Ksp = [Ca²⁺][F⁻]²; [F⁻] = 0.010 M'nin karesi 1.0 × 10⁻⁴'tür, 0.010 değil." },
        { id: "D", text: "6.2 × 10<sup>−6</sup> M", isCorrect: false, errorTag: "1:1 tuz gibi karekök almak", remediation: "√Ksp yalnızca AB tipi (1:1) tuzların saf sudaki çözünürlüğüdür; CaF₂ AB₂ tipindedir ve ortamda common ion var." }
      ],
      generalRemediation: "Common-ion effect: ortamdaki iyonun konsantrasyonunu Ksp ifadesine koy; s küçük olduğundan [F⁻] ≈ ortamdaki değer alınır.",
      stepByStepSolution: "1) CaF₂ ⇌ Ca²⁺ + 2 F⁻; [Ca²⁺] = s, [F⁻] = 0.010 + 2s ≈ 0.010.<br/>2) 3.9 × 10⁻¹¹ = s(0.010)².<br/>3) s = 3.9 × 10⁻¹¹ / 1.0 × 10⁻⁴ = 3.9 × 10⁻⁷ M. Doğru şık A."
    },
    // ---------------- UNIT 8 ----------------
    {
      id: "sv_chem_u8_1", unite: "8", beceri: "pH of a strong acid solution", zorluk: "easy", sureSn: 60, hesapMakinesi: true,
      source: "AP-style original (CED Topic 8.2)",
      question: "What is the pH of a 0.0050 M HNO<sub>3</sub> solution at 25°C?",
      options: [
        { id: "A", text: "11.70", isCorrect: false, errorTag: "pOH ile pH'yi karıştırmak", remediation: "HNO₃ güçlü asittir; −log[H₃O⁺] doğrudan pH verir. 14 − 2.30 = 11.70 bir baz için pH olurdu." },
        { id: "B", text: "2.00", isCorrect: false, errorTag: "HNO₃'ü diprotik sanmak", remediation: "HNO₃ monoprotiktir: [H₃O⁺] = 0.0050 M, 0.010 M değil." },
        { id: "C", text: "3.30", isCorrect: false, errorTag: "Bilimsel gösterim hatası", remediation: "0.0050 = 5.0 × 10⁻³ (5.0 × 10⁻⁴ değil). −log(5.0 × 10⁻³) = 2.30." },
        { id: "D", text: "2.30", isCorrect: true }
      ],
      generalRemediation: "Güçlü monoprotik asitte [H₃O⁺] = C_asit; pH = −log[H₃O⁺].",
      stepByStepSolution: "1) HNO₃ tamamen iyonlaşır: [H₃O⁺] = 5.0 × 10⁻³ M.<br/>2) pH = −log(5.0 × 10⁻³) = 2.30. Doğru şık D."
    },
    {
      id: "sv_chem_u8_2", unite: "8", beceri: "Weak acid equilibria", zorluk: "medium", sureSn: 100, hesapMakinesi: true,
      source: "AP-style original (CED Topic 8.3)",
      question: "What is the pH of 0.10 M acetic acid, CH<sub>3</sub>COOH (K<sub>a</sub> = 1.8 × 10<sup>−5</sup>), at 25°C?",
      options: [
        { id: "A", text: "1.00", isCorrect: false, errorTag: "Zayıf asidi güçlü asit gibi işlemek", remediation: "Acetic acid zayıf asittir; çok küçük bir kısmı iyonlaşır. [H₃O⁺] ≠ 0.10 M." },
        { id: "B", text: "2.87", isCorrect: true },
        { id: "C", text: "5.74", isCorrect: false, errorTag: "Karekökü almamak", remediation: "x² = Ka·C = 1.8 × 10⁻⁶; x = √(1.8 × 10⁻⁶) = 1.34 × 10⁻³. −log(Ka·C) karekök almadan pH vermez." },
        { id: "D", text: "4.74", isCorrect: false, errorTag: "pH = pKa sanmak", remediation: "pH = pKa yalnızca [HA] = [A⁻] olan tamponda (half-equivalence) geçerlidir; saf zayıf asit çözeltisinde değil." }
      ],
      generalRemediation: "Zayıf asit: Ka = x² / (C − x) ≈ x² / C (x, C'nin %5'inden küçükse). [H₃O⁺] = √(Ka·C).",
      stepByStepSolution: "1) x = √(1.8 × 10⁻⁵ × 0.10) = 1.34 × 10⁻³ M (%1.3 < %5, yaklaşım geçerli).<br/>2) pH = −log(1.34 × 10⁻³) = 2.87. Doğru şık B."
    },
    {
      id: "sv_chem_u8_3", unite: "8", beceri: "Acid–base titrations and buffers (Henderson–Hasselbalch)", zorluk: "hard", sureSn: 150, hesapMakinesi: true,
      source: "AP-style original (CED Topic 8.5)",
      question: "A 50.0 mL sample of 0.100 M CH<sub>3</sub>COOH (K<sub>a</sub> = 1.8 × 10<sup>−5</sup>) is titrated with 0.100 M NaOH. What is the pH after 40.0 mL of NaOH has been added?",
      options: [
        { id: "A", text: "4.14", isCorrect: false, errorTag: "Henderson–Hasselbalch oranını ters kurmak", remediation: "pH = pKa + log([A⁻]/[HA]). Baz eklendikçe A⁻ fazlalaşır; oran 4.00/1.00 olmalı, 1.00/4.00 değil." },
        { id: "B", text: "4.74", isCorrect: false, errorTag: "Her noktayı half-equivalence sanmak", remediation: "pH = pKa yalnızca 25.0 mL NaOH eklendiğinde (half-equivalence) geçerlidir. 40.0 mL'de A⁻ çoğunluktadır." },
        { id: "C", text: "5.35", isCorrect: true },
        { id: "D", text: "8.72", isCorrect: false, errorTag: "Equivalence point pH'ı", remediation: "Equivalence 50.0 mL'dedir. 40.0 mL'de hâlâ 1.00 mmol HA kalır; çözelti bir tampondur." }
      ],
      generalRemediation: "Titrasyonda önce mol (mmol) hesabı yap: OH⁻ ile HA tepkimeye girer, kalan HA ve oluşan A⁻ tamponu oluşturur. Sonra Henderson–Hasselbalch uygula.",
      stepByStepSolution: "1) mmol HA = 50.0 × 0.100 = 5.00; mmol OH⁻ = 40.0 × 0.100 = 4.00.<br/>2) Tepkime sonrası: HA = 1.00 mmol, A⁻ = 4.00 mmol.<br/>3) pKa = −log(1.8 × 10⁻⁵) = 4.74.<br/>4) pH = 4.74 + log(4.00/1.00) = 5.35. Doğru şık C."
    },
    // ---------------- UNIT 9 ----------------
    {
      id: "sv_chem_u9_1", unite: "9", beceri: "Introduction to entropy", zorluk: "easy", sureSn: 60, hesapMakinesi: false,
      source: "AP-style original (CED Topic 9.1)",
      question: "Which of the following processes has a negative entropy change (ΔS° &lt; 0)?",
      options: [
        { id: "A", text: "2 SO<sub>2</sub>(g) + O<sub>2</sub>(g) → 2 SO<sub>3</sub>(g)", isCorrect: true },
        { id: "B", text: "H<sub>2</sub>O(l) → H<sub>2</sub>O(g)", isCorrect: false, errorTag: "Faz değişimini ters yorumlamak", remediation: "Sıvıdan gaza geçiş, parçacıkların hareket serbestliğini ve olası microstate sayısını büyük ölçüde artırır: ΔS > 0." },
        { id: "C", text: "CaCO<sub>3</sub>(s) → CaO(s) + CO<sub>2</sub>(g)", isCorrect: false, errorTag: "Gaz oluşumunu gözden kaçırmak", remediation: "Katıdan bir gaz ürünü oluşur; gaz mol sayısı 0'dan 1'e çıkar: ΔS > 0." },
        { id: "D", text: "NaCl(s) → Na<sup>+</sup>(aq) + Cl<sup>−</sup>(aq)", isCorrect: false, errorTag: "Çözünmeyi düzenlenme sanmak", remediation: "İyonik katının çözünmesi düzenli kristal kafesi dağıtır; NaCl için ΔS° > 0'dır." }
      ],
      generalRemediation: "ΔS'yi tahmin etmenin en güçlü ipucu gaz mol sayısının değişimidir (Δn_gas). Gaz molü azalırsa ΔS < 0.",
      stepByStepSolution: "1) Seçenek A: 3 mol gaz → 2 mol gaz, Δn_gas = −1.<br/>2) Daha az gaz parçacığı → daha az microstate → ΔS° < 0.<br/>3) Diğer üç süreçte dağılma/gaz oluşumu vardır (ΔS > 0). Doğru şık A."
    },
    {
      id: "sv_chem_u9_2", unite: "9", beceri: "Thermodynamic favorability and temperature (ΔG° = ΔH° − TΔS°)", zorluk: "medium", sureSn: 100, hesapMakinesi: true,
      source: "AP-style original (CED Topic 9.3)",
      question: "For CaCO<sub>3</sub>(s) → CaO(s) + CO<sub>2</sub>(g), ΔH° = +178 kJ/mol<sub>rxn</sub> and ΔS° = +161 J/(mol<sub>rxn</sub>·K). Assuming ΔH° and ΔS° are independent of temperature, under which condition is the reaction thermodynamically favorable?",
      options: [
        { id: "A", text: "At temperatures below 1106 K", isCorrect: false, errorTag: "Eşitsizliğin yönü ters", remediation: "ΔH > 0 ve ΔS > 0 iken −TΔS terimi ancak yüksek T'de ΔH'yi yener. Düşük T'de ΔG > 0'dır." },
        { id: "B", text: "At temperatures above 1.11 K", isCorrect: false, errorTag: "kJ → J dönüşümü unutuldu", remediation: "ΔH kJ, ΔS J cinsindendir. 178 kJ = 178 000 J'e çevirmeden bölünce 1000 kat küçük T bulunur." },
        { id: "C", text: "At temperatures above 1106 K", isCorrect: true },
        { id: "D", text: "At all temperatures, because ΔS° is positive", isCorrect: false, errorTag: "Yalnızca ΔS'ye bakmak", remediation: "Favorability ΔG ile belirlenir; endotermik tepkimede pozitif ΔS tek başına yetmez." }
      ],
      generalRemediation: "ΔG° = ΔH° − TΔS°. ΔH ve ΔS aynı işaretliyse eşik sıcaklık T = ΔH°/ΔS°; birimleri (kJ ↔ J) eşitlemeyi unutma.",
      stepByStepSolution: "1) ΔG° = 0 eşiği: T = ΔH°/ΔS° = 178 000 J / 161 J·K⁻¹ = 1106 K.<br/>2) ΔH > 0, ΔS > 0 → T > 1106 K'de ΔG° < 0. Doğru şık C."
    },
    {
      id: "sv_chem_u9_3", unite: "9", beceri: "Galvanic cells: cell potential and free energy (ΔG° = −nFE°)", zorluk: "hard", sureSn: 150, hesapMakinesi: true,
      source: "AP-style original (CED Topic 9.9)",
      question: "A galvanic cell is built from Zn|Zn<sup>2+</sup> and Cu|Cu<sup>2+</sup> half-cells. Standard reduction potentials: Cu<sup>2+</sup> + 2e<sup>−</sup> → Cu, E° = +0.34 V; Zn<sup>2+</sup> + 2e<sup>−</sup> → Zn, E° = −0.76 V. What is ΔG° for the spontaneous cell reaction? (F = 96 485 C/mol e<sup>−</sup>)",
      options: [
        { id: "A", text: "−106 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "n = 1 almak", remediation: "Zn → Zn²⁺ + 2e⁻ ve Cu²⁺ + 2e⁻ → Cu: transfer edilen elektron sayısı n = 2'dir." },
        { id: "B", text: "−212 kJ/mol<sub>rxn</sub>", isCorrect: true },
        { id: "C", text: "+212 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "Eksi işaretini unutmak", remediation: "ΔG° = −nFE°. E°cell > 0 olan galvanic cell'de ΔG° < 0 olmalıdır." },
        { id: "D", text: "+81.0 kJ/mol<sub>rxn</sub>", isCorrect: false, errorTag: "Potansiyelleri toplamak", remediation: "E°cell = E°cathode − E°anode = 0.34 − (−0.76) = +1.10 V. 0.34 + (−0.76) = −0.42 V yanlış yöntemdir." }
      ],
      generalRemediation: "E°cell = E°(cathode) − E°(anode); cathode daha pozitif reduction potential'a sahip yarı hücredir. ΔG° = −nFE°cell, sonucu kJ'e çevir.",
      stepByStepSolution: "1) Cathode: Cu²⁺/Cu; anode: Zn/Zn²⁺.<br/>2) E°cell = 0.34 − (−0.76) = 1.10 V; n = 2.<br/>3) ΔG° = −2 × 96 485 × 1.10 = −212 267 J ≈ −212 kJ/mol. Doğru şık B."
    }
  ]
};
