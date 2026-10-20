// AP MEBERRA — Seviye Testi (Tanı Sınavı): AP Physics 1 — Dr. Emre Yıldız
// 8 CED ünitesi × 3 soru (easy / medium / hard). Aksi belirtilmedikçe g = 10 m/s² (AP Physics 1 kuralı).
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
  ],
  sorular: [
    // ===================== UNIT 1: KINEMATICS =====================
    {
      id: "sv_phys1_u1_1",
      unite: "1",
      beceri: "Displacement from a velocity–time graph",
      zorluk: "easy",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.3)",
      question: "A cart's velocity–time graph is a straight line rising from $v = 0$ at $t = 0$ to $v = 8\\text{ m/s}$ at $t = 4\\text{ s}$, followed by a horizontal segment at $v = 8\\text{ m/s}$ from $t = 4\\text{ s}$ to $t = 6\\text{ s}$. What is the cart's displacement from $t = 0$ to $t = 6\\text{ s}$?",
      options: [
        { id: "A", text: "$32\\text{ m}$", isCorrect: true },
        { id: "B", text: "$48\\text{ m}$", isCorrect: false, errorTag: "Son hızı tüm süreyle çarpma", remediation: "$8 \\times 6$ yalnızca hız baştan beri 8 m/s olsaydı doğru olurdu. İlk 4 s'de hız artıyor; displacement = <strong>area under the v–t graph</strong> (üçgen + dikdörtgen)." },
        { id: "C", text: "$16\\text{ m}$", isCorrect: false, errorTag: "Alanın yalnızca bir parçası", remediation: "Sadece üçgen alanını (0–4 s) aldın. 4–6 s arasındaki dikdörtgen alanını ($8 \\times 2 = 16$ m) da eklemelisin." },
        { id: "D", text: "$2\\text{ m}$", isCorrect: false, errorTag: "Slope ile area karıştırma", remediation: "$8/4 = 2$ v–t grafiğinin <strong>slope</strong>'u, yani acceleration'dır (m/s²). Displacement için eğim değil, alan gerekir." }
      ],
      generalRemediation: "v–t grafiğinde: eğim (slope) = acceleration, eğrinin altındaki alan (area) = displacement. Parçalı grafiklerde alanı geometrik parçalara böl.",
      stepByStepSolution: "1) 0–4 s üçgen alanı: $\\frac{1}{2}(4)(8) = 16\\text{ m}$.<br/>2) 4–6 s dikdörtgen alanı: $(2)(8) = 16\\text{ m}$.<br/>3) Toplam displacement $= 32\\text{ m}$. Doğru cevap: (A)."
    },
    {
      id: "sv_phys1_u1_2",
      unite: "1",
      beceri: "Horizontally launched projectile",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.5)",
      question: "A ball is thrown horizontally at $15\\text{ m/s}$ from the top of a cliff that is $20\\text{ m}$ high. Air resistance is negligible and $g = 10\\text{ m/s}^2$. How far from the base of the cliff does the ball land?",
      options: [
        { id: "A", text: "$21\\text{ m}$", isCorrect: false, errorTag: "½ katsayısını unutma", remediation: "$h = gt^2$ yazınca $t = \\sqrt{2}\\text{ s}$ çıkar. Doğrusu $h = \\frac{1}{2}gt^2$, yani $t = \\sqrt{2h/g} = 2\\text{ s}$." },
        { id: "B", text: "$30\\text{ m}$", isCorrect: true },
        { id: "C", text: "$60\\text{ m}$", isCorrect: false, errorTag: "Karekökü almayı unutma", remediation: "$t^2 = 2h/g = 4$ bulduktan sonra $t = 4$ değil $t = 2\\text{ s}$ olur. Birim kontrolü yap: $2h/g$ birimi s²'dir." },
        { id: "D", text: "$50\\text{ m}$", isCorrect: false, errorTag: "Yatayda ivme varsayma", remediation: "Yatay eksende hiçbir kuvvet yok; $a_x = 0$. Gravity yalnızca dikey bileşeni değiştirir, bu yüzden $x = v_x t$ (ek $\\frac{1}{2}gt^2$ terimi yok)." }
      ],
      generalRemediation: "Projectile motion'da iki eksen bağımsızdır; ortak tek değişken zamandır. Süreyi dikey hareketten, menzili yatay sabit hızdan bul.",
      stepByStepSolution: "1) Dikey: $20 = \\frac{1}{2}(10)t^2 \\Rightarrow t = 2\\text{ s}$.<br/>2) Yatay: $x = v_x t = 15 \\times 2 = 30\\text{ m}$.<br/>Doğru cevap: (B)."
    },
    {
      id: "sv_phys1_u1_3",
      unite: "1",
      beceri: "Linearizing data (d vs t²) to find acceleration",
      zorluk: "hard",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 1.2 — Experimental Design)",
      question: "In a lab, a cart is released from rest at the top of a ramp. Students measure the distance $d$ traveled at several times $t$ and plot $d$ (vertical axis) versus $t^2$ (horizontal axis). The data fall on a straight line through the origin with slope $0.60\\text{ m/s}^2$. What is the cart's acceleration?",
      options: [
        { id: "A", text: "$0.60\\text{ m/s}^2$", isCorrect: false, errorTag: "Slope'u doğrudan ivme sanma", remediation: "$d = \\frac{1}{2}at^2$ ile $y = mx$ karşılaştır: slope $= \\frac{1}{2}a$, ivmenin kendisi değil." },
        { id: "B", text: "$0.30\\text{ m/s}^2$", isCorrect: false, errorTag: "Ters yönde 2 ile bölme", remediation: "Slope $= a/2$ ise $a = 2 \\times \\text{slope}$ olur; slope'u ikiye bölmek ilişkiyi tersine çevirmektir." },
        { id: "C", text: "$1.2\\text{ m/s}^2$", isCorrect: true },
        { id: "D", text: "$0.77\\text{ m/s}^2$", isCorrect: false, errorTag: "t² yüzünden karekök alma", remediation: "Yatay eksende $t^2$ olması slope'un karekökünün alınacağı anlamına gelmez; birim zaten m/s²'dir. Linearization'da teorik denklemi $y = mx$ biçimine eşle." }
      ],
      generalRemediation: "Linearization: teorik denklemi $y = (\\text{slope})\\,x$ biçimine getir ve slope'un hangi fiziksel niceliklere eşit olduğunu sembolik olarak yaz.",
      stepByStepSolution: "1) Durgun başlangıç: $d = \\frac{1}{2}a\\,t^2$.<br/>2) $y = d$, $x = t^2$ $\\Rightarrow$ slope $= \\frac{1}{2}a$.<br/>3) $a = 2(0.60) = 1.2\\text{ m/s}^2$. Doğru cevap: (C)."
    },

    // ===================== UNIT 2: FORCE AND TRANSLATIONAL DYNAMICS =====================
    {
      id: "sv_phys1_u2_1",
      unite: "2",
      beceri: "Newton's second law — apparent weight in an elevator",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.6)",
      question: "A $60\\text{ kg}$ person stands on a scale in an elevator that is moving <strong>downward</strong> and <strong>slowing down</strong> at a rate of $2\\text{ m/s}^2$. Using $g = 10\\text{ m/s}^2$, what does the scale read?",
      options: [
        { id: "A", text: "$480\\text{ N}$", isCorrect: false, errorTag: "İvme yönünü hareket yönü sanma", remediation: "Aşağı doğru hareket edip <strong>yavaşlayan</strong> cismin acceleration'ı yukarı doğrudur. Bu durumda normal force ağırlıktan büyük olur." },
        { id: "B", text: "$600\\text{ N}$", isCorrect: false, errorTag: "Hareket varsa denge varsayma", remediation: "$N = mg$ yalnızca $a = 0$ iken geçerlidir. Burada ivme sıfır değil; $\\sum F = ma$ yazmalısın." },
        { id: "C", text: "$120\\text{ N}$", isCorrect: false, errorTag: "Yalnızca ma'yı alma", remediation: "$ma = 120\\text{ N}$ net kuvvettir, normal force değil. Free-body diagram'da hem $N$ hem $mg$ var: $N - mg = ma$." },
        { id: "D", text: "$720\\text{ N}$", isCorrect: true }
      ],
      generalRemediation: "Önce acceleration yönünü belirle (hız azalıyorsa ivme hıza zıttır), sonra FBD çiz ve o yönü pozitif alarak $\\sum F = ma$ yaz.",
      stepByStepSolution: "1) Aşağı hareket + yavaşlama $\\Rightarrow$ $a = 2\\text{ m/s}^2$ yukarı.<br/>2) Yukarı pozitif: $N - mg = ma$.<br/>3) $N = 60(10 + 2) = 720\\text{ N}$. Doğru cevap: (D)."
    },
    {
      id: "sv_phys1_u2_2",
      unite: "2",
      beceri: "Connected objects — system vs. individual FBD",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 2.6)",
      question: "A $3.0\\text{ kg}$ block on a horizontal frictionless table is connected by a light string over an ideal pulley to a hanging $2.0\\text{ kg}$ block. The system is released from rest ($g = 10\\text{ m/s}^2$). What is the tension in the string while the blocks move?",
      options: [
        { id: "A", text: "$12\\text{ N}$", isCorrect: true },
        { id: "B", text: "$20\\text{ N}$", isCorrect: false, errorTag: "T = asılı kütlenin ağırlığı", remediation: "Tension asılı bloğun ağırlığına eşit olsaydı asılı blok hızlanmazdı. Asılı blok aşağı ivmelendiği için $T < m_2 g$." },
        { id: "C", text: "$8.0\\text{ N}$", isCorrect: false, errorTag: "Yanlış kütleyle ma", remediation: "$m_2 a = 8\\text{ N}$ asılı bloğun net kuvvetidir. Masadaki bloğun tek yatay kuvveti tension olduğu için $T = m_1 a$." },
        { id: "D", text: "$30\\text{ N}$", isCorrect: false, errorTag: "Masadaki bloğun ağırlığını kullanma", remediation: "Masadaki bloğun ağırlığı normal force ile dengelenir; ipe aktarılmaz. Önce sistem ivmesini bul." }
      ],
      generalRemediation: "Bağlı sistemlerde önce tüm sistemi tek cisim gibi alıp ivmeyi bul ($a = F_{ext}/m_{total}$), sonra tek bir bloğun FBD'sinden iç kuvveti (tension) hesapla.",
      stepByStepSolution: "1) Sistem: $a = \\frac{m_2 g}{m_1 + m_2} = \\frac{20}{5} = 4\\text{ m/s}^2$.<br/>2) Masadaki blok: $T = m_1 a = 3(4) = 12\\text{ N}$.<br/>3) Kontrol: $m_2 g - T = 20 - 12 = 8 = m_2 a$ ✓. Doğru cevap: (A)."
    },
    {
      id: "sv_phys1_u2_3",
      unite: "2",
      beceri: "Circular orbits — speed and period vs. radius",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topics 2.8–2.9)",
      question: "A satellite moves in a circular orbit of radius $r$ around a planet with speed $v$ and period $T$. If it is moved to a circular orbit of radius $2r$, what are its new speed and new period?",
      options: [
        { id: "A", text: "Speed $v/2$; period $2T$", isCorrect: false, errorTag: "Doğrusal orantı varsayımı", remediation: "Orbital speed $r$ ile ters orantılı değil: $\\frac{GMm}{r^2} = \\frac{mv^2}{r} \\Rightarrow v = \\sqrt{GM/r}$, yani $v \\propto 1/\\sqrt{r}$." },
        { id: "B", text: "Speed $v/\\sqrt{2}$; period $2\\sqrt{2}\\,T$", isCorrect: true },
        { id: "C", text: "Speed $v/\\sqrt{2}$; period $2T$", isCorrect: false, errorTag: "Period'da hız değişimini unutma", remediation: "Çevre 2 katına çıkarken hız da $\\sqrt{2}$ kat azalır: $T = 2\\pi r/v \\propto r^{3/2}$ (Kepler's third law)." },
        { id: "D", text: "Speed $\\sqrt{2}\\,v$; period $T/(2\\sqrt{2})$", isCorrect: false, errorTag: "Büyük yörünge = hızlı yörünge sanma", remediation: "Uzak yörüngede gravitational force daha zayıf; gerekli centripetal force'u sağlamak için daha <strong>düşük</strong> hız yeter." }
      ],
      generalRemediation: "Dairesel yörüngede gravity = centripetal force: $\\frac{GMm}{r^2} = \\frac{mv^2}{r}$. Buradan $v \\propto r^{-1/2}$ ve $T \\propto r^{3/2}$.",
      stepByStepSolution: "1) $v = \\sqrt{GM/r}$ $\\Rightarrow$ $v' = \\sqrt{GM/2r} = v/\\sqrt{2}$.<br/>2) $T = 2\\pi r / v$ $\\Rightarrow$ $T' = \\frac{2\\pi(2r)}{v/\\sqrt{2}} = 2\\sqrt{2}\\,T \\approx 2.83\\,T$.<br/>Doğru cevap: (B)."
    },

    // ===================== UNIT 3: WORK, ENERGY, AND POWER =====================
    {
      id: "sv_phys1_u3_1",
      unite: "3",
      beceri: "Work–kinetic energy theorem",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.3)",
      question: "A $2.0\\text{ kg}$ box initially at rest on a frictionless floor is pushed by a constant horizontal force of $10\\text{ N}$ through a distance of $5.0\\text{ m}$. What is the box's final speed?",
      options: [
        { id: "A", text: "$5.0\\text{ m/s}$", isCorrect: false, errorTag: "½ katsayısını unutma", remediation: "$W = mv^2$ değil $W = \\frac{1}{2}mv^2$. $50 = \\frac{1}{2}(2)v^2 \\Rightarrow v^2 = 50$." },
        { id: "B", text: "$25\\text{ m/s}$", isCorrect: false, errorTag: "Kareyi atlama", remediation: "$Fd/m = 25$ değeri $v^2/2$'ye karşılık gelir, $v$'ye değil. Kinetic energy hızın <strong>karesiyle</strong> orantılı." },
        { id: "C", text: "$7.1\\text{ m/s}$", isCorrect: true },
        { id: "D", text: "$50\\text{ m/s}$", isCorrect: false, errorTag: "İş değerini hız sanma", remediation: "$W = 50\\text{ J}$ bir enerji; hız değil. Work–energy theorem ile $W_{net} = \\Delta K$ yazıp $v$'yi çöz." }
      ],
      generalRemediation: "Work–energy theorem: $W_{net} = \\Delta K = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2$.",
      stepByStepSolution: "1) $W = Fd = 10 \\times 5 = 50\\text{ J}$.<br/>2) $50 = \\frac{1}{2}(2)v^2 \\Rightarrow v = \\sqrt{50} \\approx 7.1\\text{ m/s}$.<br/>Doğru cevap: (C)."
    },
    {
      id: "sv_phys1_u3_2",
      unite: "3",
      beceri: "Conservation of energy — spring to gravitational PE",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.4)",
      question: "A vertical spring launcher with spring constant $k = 200\\text{ N/m}$ is compressed $0.10\\text{ m}$ and fires a $0.050\\text{ kg}$ ball straight up. Neglecting air resistance and taking $g = 10\\text{ m/s}^2$, how high above the release point does the ball rise?",
      options: [
        { id: "A", text: "$4.0\\text{ m}$", isCorrect: false, errorTag: "Spring PE'de ½ eksik", remediation: "Elastic potential energy $U_s = \\frac{1}{2}kx^2 = 1.0\\text{ J}$, $kx^2 = 2.0\\text{ J}$ değil." },
        { id: "B", text: "$20\\text{ m}$", isCorrect: false, errorTag: "g'yi unutma", remediation: "$U_g = mgh$; $1.0 / 0.050 = 20$ bulduysan $g$ ile bölmeyi atladın. Birim kontrolü: J/kg ≠ m." },
        { id: "C", text: "$40\\text{ m}$", isCorrect: false, errorTag: "Kuvveti enerji gibi kullanma", remediation: "$kx = 20\\text{ N}$ bir kuvvettir, enerji değil. Yay enerjisi $\\frac{1}{2}kx^2$ ile bulunur." },
        { id: "D", text: "$2.0\\text{ m}$", isCorrect: true }
      ],
      generalRemediation: "Sürtünmesiz sistemde mekanik enerji korunur: $\\frac{1}{2}kx^2 = mgh$ (başlangıçta ve tepe noktasında $K = 0$).",
      stepByStepSolution: "1) $U_s = \\frac{1}{2}(200)(0.10)^2 = 1.0\\text{ J}$.<br/>2) $1.0 = (0.050)(10)h \\Rightarrow h = 2.0\\text{ m}$.<br/>Doğru cevap: (D)."
    },
    {
      id: "sv_phys1_u3_3",
      unite: "3",
      beceri: "Power at constant velocity on an incline",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 3.5)",
      question: "A winch pulls a $50\\text{ kg}$ crate up a frictionless $30^\\circ$ incline at a <strong>constant</strong> speed of $0.40\\text{ m/s}$, with the cable parallel to the incline. Using $g = 10\\text{ m/s}^2$, at what rate does the winch do work on the crate?",
      options: [
        { id: "A", text: "$100\\text{ W}$", isCorrect: true },
        { id: "B", text: "$200\\text{ W}$", isCorrect: false, errorTag: "Eğimi yok sayma", remediation: "Dikey kaldırma için $mg$ gerekirdi. Eğik düzlemde ipe paralel gereken kuvvet $mg\\sin\\theta = 250\\text{ N}$." },
        { id: "C", text: "$173\\text{ W}$", isCorrect: false, errorTag: "sin yerine cos", remediation: "Eğim boyunca aşağı çeken bileşen $mg\\sin\\theta$; $mg\\cos\\theta$ yüzeye dik bileşendir ve normal force ile dengelenir." },
        { id: "D", text: "$0\\text{ W}$", isCorrect: false, errorTag: "Net iş ile tek kuvvetin işini karıştırma", remediation: "Sabit hızda <strong>net</strong> work sıfırdır, ama winch pozitif iş yapar; gravity ise eşit miktarda negatif iş yapar. Soru winch'in gücünü soruyor." }
      ],
      generalRemediation: "Sabit hızda tek bir kuvvetin gücü $P = Fv\\cos\\phi$. Kuvveti $\\sum F = 0$ koşulundan bul.",
      stepByStepSolution: "1) Sabit hız: $T = mg\\sin 30^\\circ = 50(10)(0.5) = 250\\text{ N}$.<br/>2) $P = Tv = 250 \\times 0.40 = 100\\text{ W}$.<br/>Doğru cevap: (A)."
    },

    // ===================== UNIT 4: LINEAR MOMENTUM =====================
    {
      id: "sv_phys1_u4_1",
      unite: "4",
      beceri: "Impulse from a force–time graph",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.2)",
      question: "A $0.50\\text{ kg}$ ball at rest is struck by a bat. The force–time graph of the hit is a triangle that rises from $0$ to a peak of $400\\text{ N}$ and returns to $0$; the whole contact lasts $0.050\\text{ s}$. What is the ball's speed just after the hit?",
      options: [
        { id: "A", text: "$40\\text{ m/s}$", isCorrect: false, errorTag: "Üçgeni dikdörtgen gibi alma", remediation: "$F_{max} \\cdot \\Delta t$ dikdörtgen alanıdır. Üçgenin alanı $\\frac{1}{2}F_{max}\\Delta t = 10\\text{ N·s}$." },
        { id: "B", text: "$20\\text{ m/s}$", isCorrect: true },
        { id: "C", text: "$5.0\\text{ m/s}$", isCorrect: false, errorTag: "Kütleyle çarpma", remediation: "$J = m\\Delta v \\Rightarrow \\Delta v = J/m$. Impulse'u kütleyle çarpmak yerine kütleye bölmelisin." },
        { id: "D", text: "$10\\text{ m/s}$", isCorrect: false, errorTag: "Impulse'u hız sanma", remediation: "$10\\text{ N·s}$ momentum değişimidir (kg·m/s). Hıza geçmek için $m = 0.50\\text{ kg}$'a böl." }
      ],
      generalRemediation: "Impulse = F–t grafiğinin altındaki alan = $\\Delta p$. Hız değişimi $\\Delta v = J/m$.",
      stepByStepSolution: "1) $J = \\frac{1}{2}(400)(0.050) = 10\\text{ N·s}$.<br/>2) $v = J/m = 10/0.50 = 20\\text{ m/s}$.<br/>Doğru cevap: (B)."
    },
    {
      id: "sv_phys1_u4_2",
      unite: "4",
      beceri: "Perfectly inelastic collision — kinetic energy loss",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 4.4)",
      question: "A $2.0\\text{ kg}$ cart moving at $3.0\\text{ m/s}$ collides with a $1.0\\text{ kg}$ cart at rest on a level, frictionless track. The carts stick together. How much kinetic energy is converted to other forms in the collision?",
      options: [
        { id: "A", text: "$0\\text{ J}$", isCorrect: false, errorTag: "Momentum korunumu = enerji korunumu sanma", remediation: "Momentum her çarpışmada korunur (dış kuvvet yoksa), kinetic energy ise yalnızca elastic çarpışmada. Yapışan arabalar perfectly inelastic çarpışma yapar." },
        { id: "B", text: "$9.0\\text{ J}$", isCorrect: false, errorTag: "Yapışınca tüm KE kaybolur sanma", remediation: "Arabalar yapıştıktan sonra durmaz; momentum korunduğu için birlikte $2.0\\text{ m/s}$ ile hareket ederler ve 6 J KE kalır." },
        { id: "C", text: "$3.0\\text{ J}$", isCorrect: true },
        { id: "D", text: "$6.0\\text{ J}$", isCorrect: false, errorTag: "Son KE ile kaybı karıştırma", remediation: "6 J çarpışma <strong>sonrasındaki</strong> kinetic energy'dir. Kayıp $K_i - K_f$ farkıdır." }
      ],
      generalRemediation: "Çarpışmalarda: 1) momentum korunumundan son hızı bul, 2) KE'yi önce/sonra ayrı hesapla, 3) farkı al.",
      stepByStepSolution: "1) $(2)(3) = (3)v_f \\Rightarrow v_f = 2.0\\text{ m/s}$.<br/>2) $K_i = \\frac{1}{2}(2)(3^2) = 9\\text{ J}$, $K_f = \\frac{1}{2}(3)(2^2) = 6\\text{ J}$.<br/>3) Kayıp $= 3.0\\text{ J}$. Doğru cevap: (C)."
    },
    {
      id: "sv_phys1_u4_3",
      unite: "4",
      beceri: "Analyzing collision data — momentum and energy",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topics 4.3–4.4 — Data Analysis)",
      question: "On a level, low-friction track, motion sensors record the following. Cart A ($0.50\\text{ kg}$) moves at $+0.80\\text{ m/s}$ toward cart B ($0.50\\text{ kg}$), which is at rest. After the collision, A moves at $+0.20\\text{ m/s}$ and B at $+0.60\\text{ m/s}$. Which conclusion is best supported by the data?",
      options: [
        { id: "A", text: "Momentum is not conserved, because cart A slowed down.", isCorrect: false, errorTag: "Tek cisme bakıp sistem hakkında karar verme", remediation: "Korunum <strong>sistem</strong> için geçerlidir. A'nın kaybettiği momentum (0.30 kg·m/s) B'nin kazandığı momentuma eşit; toplam 0.40 kg·m/s önce ve sonra." },
        { id: "B", text: "Momentum and kinetic energy are both conserved.", isCorrect: false, errorTag: "KE'yi hesaplamadan elastic deme", remediation: "$K_i = 0.16\\text{ J}$, $K_f = \\frac{1}{2}(0.5)(0.2^2 + 0.6^2) = 0.10\\text{ J}$. KE azalmış; çarpışma elastic değil." },
        { id: "C", text: "Momentum is conserved; the collision is perfectly inelastic.", isCorrect: false, errorTag: "Inelastic ile perfectly inelastic karıştırma", remediation: "Perfectly inelastic çarpışmada cisimler ortak hızla hareket eder. Burada son hızlar farklı (0.20 ve 0.60 m/s)." },
        { id: "D", text: "Momentum is conserved; the collision is inelastic.", isCorrect: true }
      ],
      generalRemediation: "Veri analizinde hem toplam momentumu hem toplam KE'yi önce/sonra sayısal olarak hesapla; sınıflandırmayı (elastic / inelastic / perfectly inelastic) sayılara dayandır.",
      stepByStepSolution: "1) $p_i = 0.5(0.80) = 0.40$, $p_f = 0.5(0.20) + 0.5(0.60) = 0.40\\text{ kg·m/s}$ → korunuyor.<br/>2) $K_i = 0.16\\text{ J}$, $K_f = 0.10\\text{ J}$ → KE azalıyor.<br/>3) Cisimler ayrı hızlarla hareket ediyor → inelastic (perfectly değil). Doğru cevap: (D)."
    },

    // ===================== UNIT 5: TORQUE AND ROTATIONAL DYNAMICS =====================
    {
      id: "sv_phys1_u5_1",
      unite: "5",
      beceri: "Torque — perpendicular component of force",
      zorluk: "easy",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.3)",
      question: "A $40\\text{ N}$ force is applied to the end of a wrench $0.25\\text{ m}$ from the bolt. The force makes an angle of $30^\\circ$ with the wrench handle. What is the magnitude of the torque about the bolt?",
      options: [
        { id: "A", text: "$5.0\\text{ N·m}$", isCorrect: true },
        { id: "B", text: "$10\\text{ N·m}$", isCorrect: false, errorTag: "Açıyı yok sayma", remediation: "$\\tau = rF$ yalnızca kuvvet kola dik iken geçerli. Genel ifade $\\tau = rF\\sin\\theta$." },
        { id: "C", text: "$8.7\\text{ N·m}$", isCorrect: false, errorTag: "sin yerine cos", remediation: "$\\theta$ kuvvet ile kol arasındaki açı olduğunda dik bileşen $F\\sin\\theta$'dır. Kola paralel bileşen ($F\\cos\\theta$) tork üretmez." },
        { id: "D", text: "$160\\text{ N·m}$", isCorrect: false, errorTag: "Kola bölme", remediation: "Tork moment kolu ile <strong>çarpılır</strong>: uzun anahtar daha fazla tork verir. $F/r$ fiziksel bir tork değildir." }
      ],
      generalRemediation: "$\\tau = rF\\sin\\theta$, burada $\\theta$ position vector ($\\vec r$) ile kuvvet arasındaki açıdır.",
      stepByStepSolution: "$\\tau = (0.25)(40)\\sin 30^\\circ = 10 \\times 0.5 = 5.0\\text{ N·m}$. Doğru cevap: (A)."
    },
    {
      id: "sv_phys1_u5_2",
      unite: "5",
      beceri: "Rotational equilibrium — balancing torques",
      zorluk: "medium",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 5.5)",
      question: "A uniform seesaw is pivoted at its center. A $30\\text{ kg}$ child sits $1.2\\text{ m}$ to the <strong>left</strong> of the pivot. Where must a $40\\text{ kg}$ child sit for the seesaw to be balanced horizontally?",
      options: [
        { id: "A", text: "$1.6\\text{ m}$ right of the pivot", isCorrect: false, errorTag: "Oranı ters kurma", remediation: "Ağır çocuk pivot'a <strong>daha yakın</strong> oturmalı. $m_1 r_1 = m_2 r_2 \\Rightarrow r_2 = (30/40)(1.2)$." },
        { id: "B", text: "$1.2\\text{ m}$ right of the pivot", isCorrect: false, errorTag: "Eşit mesafe varsayımı", remediation: "Eşit mesafe yalnızca kütleler eşitse dengeler. Dengede net torque sıfır olmalı: kütle × kol eşit." },
        { id: "C", text: "$0.90\\text{ m}$ right of the pivot", isCorrect: true },
        { id: "D", text: "$0.90\\text{ m}$ left of the pivot", isCorrect: false, errorTag: "Tork yönünü unutma", remediation: "Aynı tarafta oturan iki çocuk aynı yönde (counterclockwise) tork üretir; denge için zıt tarafta olmalı." }
      ],
      generalRemediation: "Rotational equilibrium: pivot'a göre $\\sum \\tau = 0$. Uniform tahtanın ağırlığı pivot'tan geçtiği için tork üretmez.",
      stepByStepSolution: "1) Sol çocuk CCW tork: $30g(1.2)$.<br/>2) Sağdaki çocuk CW tork: $40g\\,x$.<br/>3) $36 = 40x \\Rightarrow x = 0.90\\text{ m}$ sağda. Doğru cevap: (C)."
    },
    {
      id: "sv_phys1_u5_3",
      unite: "5",
      beceri: "Newton's second law for rotation — pulley with mass",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: false,
      source: "AP-style original (CED Topics 5.4 & 5.6)",
      question: "A light string is wrapped around a uniform solid disk pulley of mass $2.0\\text{ kg}$ and radius $0.10\\text{ m}$ ($I = \\frac{1}{2}MR^2$) that turns on a frictionless axle. A $1.0\\text{ kg}$ block hangs from the string and is released from rest. The string does not slip. Using $g = 10\\text{ m/s}^2$, what is the block's acceleration?",
      options: [
        { id: "A", text: "$10\\text{ m/s}^2$", isCorrect: false, errorTag: "Pulley'in eylemsizliğini yok sayma", remediation: "Pulley'i döndürmek için tork gerekir; bu da tension'ın sıfırdan büyük olduğu, yani $a < g$ olduğu anlamına gelir." },
        { id: "B", text: "$5.0\\text{ m/s}^2$", isCorrect: true },
        { id: "C", text: "$3.3\\text{ m/s}^2$", isCorrect: false, errorTag: "Diski hoop / öteleme kütlesi gibi alma", remediation: "$I = MR^2$ (hoop) ya da $M$'yi doğrudan payda kullanmak $a = 10/3$ verir. Solid disk için $I/R^2 = M/2 = 1.0\\text{ kg}$." },
        { id: "D", text: "$9.1\\text{ m/s}^2$", isCorrect: false, errorTag: "Boyut hatası: I/R", remediation: "$TR = I\\alpha$ ve $a = \\alpha R$ birleşince $T = (I/R^2)a$ olur. $I/R$ kullanmak birim olarak kg vermez." }
      ],
      generalRemediation: "Blok için $mg - T = ma$, disk için $TR = I\\alpha$ ve no-slip koşulu $a = \\alpha R$. Bunları birleştir: $a = \\frac{mg}{m + I/R^2}$.",
      stepByStepSolution: "1) $I/R^2 = \\frac{1}{2}M = 1.0\\text{ kg}$.<br/>2) $a = \\frac{(1.0)(10)}{1.0 + 1.0} = 5.0\\text{ m/s}^2$.<br/>3) Kontrol: $T = mg - ma = 5\\text{ N}$, $\\alpha = 50\\text{ rad/s}^2$, $TR = 0.5 = I\\alpha = (0.010)(50)$ ✓. Doğru cevap: (B)."
    },

    // ===================== UNIT 6: ENERGY AND MOMENTUM OF ROTATING SYSTEMS =====================
    {
      id: "sv_phys1_u6_1",
      unite: "6",
      beceri: "Conservation of angular momentum",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 6.4)",
      question: "A figure skater spins at $2.0\\text{ rad/s}$ with rotational inertia $4.0\\text{ kg·m}^2$. She pulls her arms in, reducing her rotational inertia to $2.5\\text{ kg·m}^2$. Friction with the ice is negligible. What is her new angular speed?",
      options: [
        { id: "A", text: "$1.25\\text{ rad/s}$", isCorrect: false, errorTag: "Oranı ters kurma", remediation: "Rotational inertia azalınca angular speed <strong>artar</strong>: $I_i\\omega_i = I_f\\omega_f \\Rightarrow \\omega_f = (I_i/I_f)\\omega_i$." },
        { id: "B", text: "$2.0\\text{ rad/s}$", isCorrect: false, errorTag: "Kütle değişmedi, hız da değişmez sanma", remediation: "Kütle aynı olsa da kütlenin eksene uzaklığı değişti; korunan nicelik $\\omega$ değil $L = I\\omega$." },
        { id: "C", text: "$2.5\\text{ rad/s}$", isCorrect: false, errorTag: "Kinetic energy'yi korunan sanma", remediation: "$\\frac{1}{2}I\\omega^2$ sabit varsayımı $\\omega \\approx 2.5$ verir. Kollarını çekerken patenci iş yapar, rotational KE <strong>artar</strong>; korunan nicelik angular momentum." },
        { id: "D", text: "$3.2\\text{ rad/s}$", isCorrect: true }
      ],
      generalRemediation: "Dış tork yoksa $L = I\\omega$ korunur. $I$ azalırsa $\\omega$ aynı oranda artar.",
      stepByStepSolution: "$(4.0)(2.0) = (2.5)\\omega_f \\Rightarrow \\omega_f = 3.2\\text{ rad/s}$. Doğru cevap: (D)."
    },
    {
      id: "sv_phys1_u6_2",
      unite: "6",
      beceri: "Rolling without slipping — energy sharing",
      zorluk: "medium",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topics 6.1 & 6.5)",
      question: "A uniform solid sphere ($I = \\frac{2}{5}MR^2$) is released from rest and rolls without slipping down a ramp, dropping a vertical height of $1.4\\text{ m}$. Using $g = 10\\text{ m/s}^2$, what is the speed of its center at the bottom?",
      options: [
        { id: "A", text: "$4.5\\text{ m/s}$", isCorrect: true },
        { id: "B", text: "$5.3\\text{ m/s}$", isCorrect: false, errorTag: "Rotational KE'yi unutma", remediation: "$\\sqrt{2gh}$ kayan (sürtünmesiz) cisim içindir. Yuvarlanan cisimde $mgh$ hem translational hem rotational KE'ye paylaşılır." },
        { id: "C", text: "$3.7\\text{ m/s}$", isCorrect: false, errorTag: "Hoop formülünü kullanma", remediation: "$v = \\sqrt{gh}$ ince halka ($I = MR^2$) içindir. Solid sphere için $K_{tot} = \\frac{7}{10}Mv^2$." },
        { id: "D", text: "$4.3\\text{ m/s}$", isCorrect: false, errorTag: "Silindir formülünü kullanma", remediation: "$\\sqrt{4gh/3}$ solid cylinder ($I = \\frac{1}{2}MR^2$) içindir. Verilen cisim sphere: $\\frac{1}{2}Mv^2 + \\frac{1}{2}\\cdot\\frac{2}{5}Mv^2$." }
      ],
      generalRemediation: "Rolling without slipping: $v = \\omega R$ ve $Mgh = \\frac{1}{2}Mv^2 + \\frac{1}{2}I\\omega^2$. Statik sürtünme iş yapmaz, mekanik enerji korunur.",
      stepByStepSolution: "1) $Mgh = \\frac{1}{2}Mv^2 + \\frac{1}{5}Mv^2 = \\frac{7}{10}Mv^2$.<br/>2) $v = \\sqrt{\\frac{10gh}{7}} = \\sqrt{\\frac{10(10)(1.4)}{7}} = \\sqrt{20} \\approx 4.5\\text{ m/s}$.<br/>Doğru cevap: (A)."
    },
    {
      id: "sv_phys1_u6_3",
      unite: "6",
      beceri: "Rotational collision — angular momentum vs. kinetic energy",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: false,
      source: "AP-style original (CED Topics 6.1 & 6.4)",
      question: "A disk spins freely at angular speed $\\omega_0$ on a frictionless axle. An identical, non-rotating disk is dropped onto it along the same axis, and friction between the disks soon makes them rotate together. What is the final angular speed, and what happens to the rotational kinetic energy?",
      options: [
        { id: "A", text: "$\\omega_0/2$; kinetic energy is conserved", isCorrect: false, errorTag: "L korunumu = KE korunumu sanma", remediation: "Diskler arasındaki kinetic friction iç enerji (ısı) üretir. Bu bir rotational perfectly inelastic collision'dır; $L$ korunur, KE korunmaz." },
        { id: "B", text: "$\\omega_0/\\sqrt{2}$; kinetic energy is conserved", isCorrect: false, errorTag: "Yanlış korunum yasasını seçme", remediation: "KE'yi koruyarak $\\omega$ bulmak $L$'nin azalmasını gerektirir; ama eksen sürtünmesiz olduğundan dış tork yok ve $L$ korunmak <strong>zorunda</strong>." },
        { id: "C", text: "$\\omega_0/2$; half of the kinetic energy is lost", isCorrect: true },
        { id: "D", text: "$\\omega_0/4$; three-quarters is lost", isCorrect: false, errorTag: "I'yı iki kez sayma", remediation: "$I_{tot} = 2I$ olduğundan $\\omega_f = \\omega_0/2$; $\\omega_0/4$ inertia'nın 4 katına çıktığı varsayımından gelir." }
      ],
      generalRemediation: "Dış tork yoksa $L$ korunur; iç sürtünme olan \"birlikte dönme\" olaylarında rotational KE ise kesinlikle azalır.",
      stepByStepSolution: "1) $I\\omega_0 = (2I)\\omega_f \\Rightarrow \\omega_f = \\omega_0/2$.<br/>2) $K_i = \\frac{1}{2}I\\omega_0^2$, $K_f = \\frac{1}{2}(2I)(\\omega_0/2)^2 = \\frac{1}{4}I\\omega_0^2 = K_i/2$.<br/>3) Enerjinin yarısı ısıya dönüşür. Doğru cevap: (C)."
    },

    // ===================== UNIT 7: OSCILLATIONS =====================
    {
      id: "sv_phys1_u7_1",
      unite: "7",
      beceri: "Period of a mass–spring oscillator",
      zorluk: "easy",
      sureSn: 75,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 7.2)",
      question: "A $0.50\\text{ kg}$ block on a horizontal spring oscillates with period $0.60\\text{ s}$. The block is replaced with a $2.0\\text{ kg}$ block on the same spring. What is the new period?",
      options: [
        { id: "A", text: "$2.4\\text{ s}$", isCorrect: false, errorTag: "T ∝ m varsayımı", remediation: "$T_s = 2\\pi\\sqrt{m/k}$; period kütlenin <strong>karekökü</strong> ile orantılı. Kütle 4 kat → period 2 kat." },
        { id: "B", text: "$1.2\\text{ s}$", isCorrect: true },
        { id: "C", text: "$0.30\\text{ s}$", isCorrect: false, errorTag: "Ters orantı varsayımı", remediation: "Daha ağır blok daha yavaş salınır (daha fazla inertia), bu yüzden period büyür, küçülmez." },
        { id: "D", text: "$0.60\\text{ s}$", isCorrect: false, errorTag: "Sarkaçla karıştırma", remediation: "Kütleden bağımsızlık simple pendulum'a aittir ($T = 2\\pi\\sqrt{L/g}$). Mass–spring sisteminde $T$ kütleye bağlıdır." }
      ],
      generalRemediation: "Mass–spring: $T = 2\\pi\\sqrt{m/k}$ (genlikten bağımsız). Pendulum: $T = 2\\pi\\sqrt{L/g}$ (kütleden bağımsız).",
      stepByStepSolution: "$T' = T\\sqrt{m'/m} = 0.60\\sqrt{4} = 1.2\\text{ s}$. Doğru cevap: (B)."
    },
    {
      id: "sv_phys1_u7_2",
      unite: "7",
      beceri: "Simple pendulum — designing a target period",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: true,
      source: "AP-style original (CED Topic 7.2 — Experimental Design)",
      question: "A student wants to build a simple pendulum with a period of $2.0\\text{ s}$ (small amplitude) at a location where $g = 9.8\\text{ m/s}^2$. What string length should she use?",
      options: [
        { id: "A", text: "$0.99\\text{ m}$", isCorrect: true },
        { id: "B", text: "$0.50\\text{ m}$", isCorrect: false, errorTag: "T'nin karesini almama", remediation: "$T = 2\\pi\\sqrt{L/g}$ her iki tarafın karesi alınınca $L = gT^2/(4\\pi^2)$ olur; $T$ yerine $T^2$ kullan." },
        { id: "C", text: "$3.1\\text{ m}$", isCorrect: false, errorTag: "Karekökü yanlış kaldırma", remediation: "$L = gT/(2\\pi)$ ifadesi karekök kaldırılmadan yapılan bir cebir hatası. Önce $T/(2\\pi) = \\sqrt{L/g}$, sonra kare al." },
        { id: "D", text: "$6.2\\text{ m}$", isCorrect: false, errorTag: "2π'nin karesini almama", remediation: "Kare alırken $2\\pi$ de $4\\pi^2$ olur. $gT^2/(2\\pi)$ yalnızca $T$'nin karesini alır." }
      ],
      generalRemediation: "Small-angle pendulum: $T = 2\\pi\\sqrt{L/g} \\Rightarrow L = \\frac{gT^2}{4\\pi^2}$. Period kütleden ve küçük genlikte genlikten bağımsızdır.",
      stepByStepSolution: "$L = \\frac{(9.8)(2.0)^2}{4\\pi^2} = \\frac{39.2}{39.48} \\approx 0.99\\text{ m}$. Doğru cevap: (A)."
    },
    {
      id: "sv_phys1_u7_3",
      unite: "7",
      beceri: "Reading SHM graphs — maximum speed",
      zorluk: "hard",
      sureSn: 150,
      hesapMakinesi: true,
      source: "AP-style original (CED Topics 7.1 & 7.3 — Graph Analysis)",
      question: "A position–time graph of a block in simple harmonic motion shows a cosine curve that starts at $x = +0.10\\text{ m}$ at $t = 0$, first reaches $x = -0.10\\text{ m}$ at $t = 0.20\\text{ s}$, and returns to $x = +0.10\\text{ m}$ at $t = 0.40\\text{ s}$. What is the block's maximum speed?",
      options: [
        { id: "A", text: "$0.25\\text{ m/s}$", isCorrect: false, errorTag: "Genliği period'a bölme", remediation: "$A/T$ bir hız ölçeği verir ama SHM'de $v_{max} = A\\omega$, burada $\\omega = 2\\pi/T$. $2\\pi$ çarpanını kaçırdın." },
        { id: "B", text: "$1.6\\text{ m/s}$", isCorrect: true },
        { id: "C", text: "$1.0\\text{ m/s}$", isCorrect: false, errorTag: "Ortalama hızı maksimum sanma", remediation: "$4A/T = 1.0\\text{ m/s}$ bir tam salınımdaki <strong>ortalama</strong> sürattir. Blok denge noktasında bundan daha hızlıdır." },
        { id: "D", text: "$3.1\\text{ m/s}$", isCorrect: false, errorTag: "Yarım periyodu period sanma", remediation: "+A'dan −A'ya gitmek yarım salınımdır (0.20 s). Tam period, bloğun +A'ya geri döndüğü $0.40\\text{ s}$." }
      ],
      generalRemediation: "Grafikten amplitude (tepe değeri) ve period'u (aynı faza dönüş süresi) oku; sonra $v_{max} = A\\omega = 2\\pi A/T$.",
      stepByStepSolution: "1) $A = 0.10\\text{ m}$, $T = 0.40\\text{ s}$.<br/>2) $\\omega = 2\\pi/0.40 \\approx 15.7\\text{ rad/s}$.<br/>3) $v_{max} = (0.10)(15.7) \\approx 1.6\\text{ m/s}$. Doğru cevap: (B)."
    },

    // ===================== UNIT 8: FLUIDS =====================
    {
      id: "sv_phys1_u8_1",
      unite: "8",
      beceri: "Absolute pressure at depth",
      zorluk: "easy",
      sureSn: 90,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 8.2)",
      question: "A diver is $5.0\\text{ m}$ below the surface of a freshwater lake ($\\rho = 1000\\text{ kg/m}^3$). Atmospheric pressure is $1.01 \\times 10^5\\text{ Pa}$ and $g = 10\\text{ m/s}^2$. What is the absolute pressure on the diver?",
      options: [
        { id: "A", text: "$5.0 \\times 10^4\\text{ Pa}$", isCorrect: false, errorTag: "Yalnızca gauge pressure", remediation: "$\\rho g h$ gauge pressure'dır. Absolute pressure için yüzeydeki atmosfer basıncını ekle: $P = P_0 + \\rho g h$." },
        { id: "B", text: "$1.01 \\times 10^5\\text{ Pa}$", isCorrect: false, errorTag: "Derinliği yok sayma", remediation: "Statik akışkanda basınç derinlikle doğrusal artar; üstteki su sütununun ağırlığı ek basınç oluşturur." },
        { id: "C", text: "$1.51 \\times 10^5\\text{ Pa}$", isCorrect: true },
        { id: "D", text: "$1.06 \\times 10^5\\text{ Pa}$", isCorrect: false, errorTag: "g'yi unutma", remediation: "$\\rho h = 5000$ birimi kg/m²'dir, Pa değil. Hidrostatik basınç $\\rho g h$; $g$ çarpanını ekle." }
      ],
      generalRemediation: "$P_{abs} = P_0 + \\rho g h$; $P_{gauge} = \\rho g h$. Sorunun hangisini istediğini dikkatle oku.",
      stepByStepSolution: "1) $\\rho g h = (1000)(10)(5.0) = 5.0 \\times 10^4\\text{ Pa}$.<br/>2) $P = 1.01 \\times 10^5 + 0.50 \\times 10^5 = 1.51 \\times 10^5\\text{ Pa}$.<br/>Doğru cevap: (C)."
    },
    {
      id: "sv_phys1_u8_2",
      unite: "8",
      beceri: "Buoyancy — floating object",
      zorluk: "medium",
      sureSn: 120,
      hesapMakinesi: false,
      source: "AP-style original (CED Topic 8.3)",
      question: "A wooden block of volume $2.0 \\times 10^{-3}\\text{ m}^3$ and density $600\\text{ kg/m}^3$ floats at rest in water ($\\rho_w = 1000\\text{ kg/m}^3$, $g = 10\\text{ m/s}^2$). What is the buoyant force on the block?",
      options: [
        { id: "A", text: "$20\\text{ N}$", isCorrect: false, errorTag: "Tamamen batmış varsayma", remediation: "$\\rho_w g V_{total} = 20\\text{ N}$ blok tamamen batırılsaydı geçerli olurdu. Yüzen blok yalnızca ağırlığına eşit su yerinden oynatır." },
        { id: "B", text: "$8.0\\text{ N}$", isCorrect: false, errorTag: "Fark kuvvetini alma", remediation: "$(\\rho_w - \\rho)gV = 8\\text{ N}$, blok tamamen batırıldığında gereken ek itme kuvvetidir; serbestçe yüzen bloğun buoyant force'u değil." },
        { id: "C", text: "$1.2\\text{ N}$", isCorrect: false, errorTag: "g'yi unutma", remediation: "$\\rho V = 1.2\\text{ kg}$ bir kütledir. Kuvvet için $g$ ile çarp: $mg = 12\\text{ N}$." },
        { id: "D", text: "$12\\text{ N}$", isCorrect: true }
      ],
      generalRemediation: "Yüzen cisim dengede: $F_B = mg$. Archimedes: $F_B = \\rho_{fluid} g V_{submerged}$. Batan hacim oranı $\\rho/\\rho_{fluid}$.",
      stepByStepSolution: "1) $m = \\rho V = 600(2.0 \\times 10^{-3}) = 1.2\\text{ kg}$.<br/>2) Dengede $F_B = mg = 12\\text{ N}$ (batan hacim %60).<br/>Doğru cevap: (D)."
    },
    {
      id: "sv_phys1_u8_3",
      unite: "8",
      beceri: "Continuity and Bernoulli's equation",
      zorluk: "hard",
      sureSn: 180,
      hesapMakinesi: false,
      source: "AP-style original (CED Topics 8.4–8.5)",
      question: "Water ($\\rho = 1000\\text{ kg/m}^3$) flows steadily through a horizontal pipe. At point 1 the cross-sectional area is $0.020\\text{ m}^2$ and the speed is $2.0\\text{ m/s}$; at point 2 the area narrows to $0.010\\text{ m}^2$. By how much is the pressure at point 2 lower than at point 1?",
      options: [
        { id: "A", text: "$2000\\text{ Pa}$", isCorrect: false, errorTag: "Hız farkının karesini alma", remediation: "Bernoulli'de kareler farkı vardır: $v_2^2 - v_1^2 = 16 - 4 = 12$, $(v_2 - v_1)^2 = 4$ değil." },
        { id: "B", text: "$12\\,000\\text{ Pa}$", isCorrect: false, errorTag: "½ katsayısını unutma", remediation: "Bernoulli'deki kinetik terim $\\frac{1}{2}\\rho v^2$; $\\rho v^2$ kullanmak farkı iki katına çıkarır." },
        { id: "C", text: "$0\\text{ Pa}$", isCorrect: false, errorTag: "Yatay boru = basınç değişmez sanma", remediation: "Yükseklik sabit olsa da hız değişiyor; dar kısımda akışkan hızlanır ve basınç düşer (Venturi effect)." },
        { id: "D", text: "$6000\\text{ Pa}$", isCorrect: true }
      ],
      generalRemediation: "Önce continuity ($A_1v_1 = A_2v_2$) ile yeni hızı bul, sonra Bernoulli: $P_1 + \\frac{1}{2}\\rho v_1^2 = P_2 + \\frac{1}{2}\\rho v_2^2$ (yatay boru).",
      stepByStepSolution: "1) $v_2 = \\frac{A_1}{A_2}v_1 = 2(2.0) = 4.0\\text{ m/s}$.<br/>2) $P_1 - P_2 = \\frac{1}{2}(1000)(4.0^2 - 2.0^2) = 500(12) = 6000\\text{ Pa}$.<br/>Doğru cevap: (D)."
    }
  ]
};
