/* 1.17.0 — İnteraktif konu anlatımı: AP Calculus + AP Physics 1 (etkilesim-mf.js)
   - Hesap çekirdeği (MF.hesap) saf fonksiyonlardır; araclar/testler/etkilesim-mf-birim-test.js Node'da doğrular.
   - Sayfada: [data-emf="..."] laboratuvarlar, [data-emf-dene="..."] Kendini dene, [data-emf-adim] Adım adım.
   - Kabuk (başlık, denetimler, tuval kutusu) DOMContentLoaded'da kurulur → yer önceden ayrılır (CLS yok);
     çizim/animasyon IntersectionObserver ile görünür olunca başlar. Harici kütüphane yok. */
(function (kok) {
  "use strict";

  // ---------------------------------------------------------------- Hesap çekirdeği (saf)
  var H = {};
  H.LIMIT = {
    delik: { ad: "f(x) = (x² − 4)/(x − 2), x → 2", a: 2, f: function (x) { return (x * x - 4) / (x - 2); }, sol: 4, sag: 4, fa: null, x: [-0.5, 4.5], y: [-0.5, 7] },
    sicrama: { ad: "Parçalı: x < 1 iken x + 1, x ≥ 1 iken 4 − x; x → 1", a: 1, f: function (x) { return x < 1 ? x + 1 : 4 - x; }, sol: 2, sag: 3, fa: 3, x: [-1.5, 3.5], y: [-0.5, 4.5] },
    sinc: { ad: "f(x) = sin(x)/x, x → 0", a: 0, f: function (x) { return Math.sin(x) / x; }, sol: 1, sag: 1, fa: null, x: [-9, 9], y: [-0.5, 1.4] }
  };
  /** a − h ve a + h noktalarındaki değerler */
  H.limitTablo = function (anahtar, h) {
    var L = H.LIMIT[anahtar];
    return { solX: L.a - h, sol: L.f(L.a - h), sagX: L.a + h, sag: L.f(L.a + h) };
  };

  H.turevF = function (x) { return 0.25 * x * x * x - x + 0.5; };
  H.turevFp = function (x) { return 0.75 * x * x - 1; };
  H.kesenEgim = function (f, a, h) { return (f(a + h) - f(a)) / h; };

  H.RIEMANN = {
    kare: { ad: "f(x) = x² · [0, 2]", f: function (x) { return x * x; }, a: 0, b: 2, kesin: 8 / 3, y: [0, 4.4] },
    sin: { ad: "f(x) = sin x · [0, π]", f: Math.sin, a: 0, b: Math.PI, kesin: 2, y: [0, 1.2] },
    ters: { ad: "f(x) = 1/x · [1, 3]", f: function (x) { return 1 / x; }, a: 1, b: 3, kesin: Math.log(3), y: [0, 1.15] }
  };
  /** tur: "sol" | "sag" | "orta" | "yamuk" */
  H.riemann = function (f, a, b, n, tur) {
    var dx = (b - a) / n, t = 0;
    for (var i = 0; i < n; i++) {
      var x0 = a + i * dx, x1 = x0 + dx;
      if (tur === "sol") t += f(x0);
      else if (tur === "sag") t += f(x1);
      else if (tur === "orta") t += f((x0 + x1) / 2);
      else t += (f(x0) + f(x1)) / 2;
    }
    return t * dx;
  };
  H.simpson = function (f, a, b, n) {
    if (n % 2) n++;
    var dx = (b - a) / n, t = f(a) + f(b);
    for (var i = 1; i < n; i++) t += (i % 2 ? 4 : 2) * f(a + i * dx);
    return t * dx / 3;
  };

  H.birikimF = function (t) { return (t - 1) * (t - 3); };
  H.birikimG = function (x) { return x * x * x / 3 - 2 * x * x + 3 * x; };

  H.EGIM = {
    xmy: { ad: "dy/dx = x − y", F: function (x, y) { return x - y; } },
    xpy: { ad: "dy/dx = x + y", F: function (x, y) { return x + y; } },
    daire: { ad: "dy/dx = −x / y", F: function (x, y) { return -x / y; } },
    ustel: { ad: "dy/dx = 0.5y", F: function (x, y) { return 0.5 * y; }, kesin: function (x0, y0, x) { return y0 * Math.exp(0.5 * (x - x0)); } }
  };
  /** Euler: y_{k+1} = y_k + h·F(x_k, y_k); n adım. Noktalar dizisi döner. */
  H.euler = function (F, x0, y0, h, n) {
    var p = [[x0, y0]], x = x0, y = y0;
    for (var i = 0; i < n; i++) {
      var m = F(x, y);
      if (!isFinite(m)) break;
      y = y + h * m; x = x + h;
      p.push([x, y]);
    }
    return p;
  };

  H.TAYLOR = {
    sin: { ad: "sin x", f: Math.sin, x: [-7, 7], y: [-2.6, 2.6], k: function (j) { return j % 2 === 0 ? 0 : (((j - 1) / 2) % 2 ? -1 : 1) / H.fakt(j); } },
    cos: { ad: "cos x", f: Math.cos, x: [-7, 7], y: [-2.6, 2.6], k: function (j) { return j % 2 ? 0 : ((j / 2) % 2 ? -1 : 1) / H.fakt(j); } },
    ustel: { ad: "eˣ", f: Math.exp, x: [-4, 3], y: [-2, 10], k: function (j) { return 1 / H.fakt(j); } }
  };
  H.fakt = function (n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; };
  H.taylor = function (anahtar, n, x) {
    var T = H.TAYLOR[anahtar], t = 0, p = 1;
    for (var j = 0; j <= n; j++) { t += T.k(j) * p; p *= x; }
    return t;
  };

  H.g = 9.8;
  H.atis = function (v0, acDer, g) {
    g = g || H.g;
    var t = acDer * Math.PI / 180, vx = v0 * Math.cos(t), vy = v0 * Math.sin(t), T = 2 * vy / g;
    return { vx: vx, vy: vy, T: T, H: vy * vy / (2 * g), R: vx * T };
  };
  H.atisKonum = function (v0, acDer, t, g) {
    g = g || H.g;
    var a = acDer * Math.PI / 180;
    return { x: v0 * Math.cos(a) * t, y: v0 * Math.sin(a) * t - 0.5 * g * t * t, vx: v0 * Math.cos(a), vy: v0 * Math.sin(a) - g * t };
  };

  /** Eğik düzlem: blok başlangıçta durgun. μs ≥ tanθ ise statik denge. */
  H.egik = function (m, acDer, muS, muK, g) {
    g = g || H.g;
    var t = acDer * Math.PI / 180, W = m * g, Wpar = W * Math.sin(t), Wdik = W * Math.cos(t), N = Wdik;
    if (Wpar <= muS * N + 1e-12) return { W: W, N: N, Wpar: Wpar, Wdik: Wdik, f: Wpar, fMax: muS * N, durgun: true, net: 0, a: 0 };
    var f = muK * N, net = Wpar - f;
    return { W: W, N: N, Wpar: Wpar, Wdik: Wdik, f: f, fMax: muS * N, durgun: false, net: net, a: net / m };
  };

  /** Rampa (θ, yükseklik Hh) + yatay zemin; tüm yolda kinetik sürtünme μ. s = yol boyunca alınan mesafe. */
  H.rampa = function (m, Hh, acDer, mu, s, g) {
    g = g || H.g;
    var t = acDer * Math.PI / 180, L = Hh / Math.sin(t), E = m * g * Hh;
    var fR = mu * m * g * Math.cos(t), fZ = mu * m * g;
    var KL = Math.max(0, E - fR * L), sDur = mu > 0 ? L + KL / fZ : Infinity;
    s = Math.max(0, Math.min(s, sDur));
    var Ug, Eth;
    if (s <= L) { Ug = m * g * (Hh - s * Math.sin(t)); Eth = fR * s; }
    else { Ug = 0; Eth = fR * L + fZ * (s - L); }
    var K = Math.max(0, E - Ug - Eth);
    return { L: L, E: E, s: s, sDur: sDur, Ug: Ug, Eth: Eth, K: K, v: Math.sqrt(2 * K / m) };
  };

  /** Bir boyutta çarpışma; tur: "esnek" | "yapiskan" */
  H.carpisma = function (m1, v1, m2, v2, tur) {
    var u1, u2;
    if (!(v1 > v2)) { u1 = v1; u2 = v2; }
    else if (tur === "esnek") {
      u1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
      u2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
    } else { u1 = u2 = (m1 * v1 + m2 * v2) / (m1 + m2); }
    return {
      yaklasiyor: v1 > v2, u1: u1, u2: u2,
      pOnce: m1 * v1 + m2 * v2, pSonra: m1 * u1 + m2 * u2,
      KOnce: 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2, KSonra: 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2
    };
  };

  /** Basit harmonik hareket: x = A cos(ωt) (t = 0'da x = +A, durgun) */
  H.bhh = function (A, k, m, t) {
    var w = Math.sqrt(k / m);
    return { w: w, T: 2 * Math.PI / w, f: w / (2 * Math.PI), x: A * Math.cos(w * t), v: -A * w * Math.sin(w * t), a: -w * w * A * Math.cos(w * t), vMax: A * w, aMax: w * w * A, E: 0.5 * k * A * A };
  };

  /** Kaldırma: blok hacmi V (m³) */
  H.kaldirma = function (rhoC, rhoS, V, g) {
    g = g || H.g;
    var W = rhoC * V * g, yuzer = rhoC < rhoS, oran = yuzer ? rhoC / rhoS : 1, Fb = rhoS * V * oran * g;
    return { W: W, Fb: Fb, oran: oran, yuzer: yuzer, N: yuzer ? 0 : W - Fb, gorunur: yuzer ? 0 : W - Fb };
  };
  /** Yatay boru: süreklilik + Bernoulli */
  H.bernoulli = function (P1, v1, A1, A2, rho) {
    var v2 = v1 * A1 / A2;
    return { v2: v2, P2: P1 + 0.5 * rho * (v1 * v1 - v2 * v2), Q: A1 * v1 };
  };

  // ---------------------------------------------------------------- Kendini dene (özgün sorular; soru bankasından değil)
  var DENE = {
    "calc-u1": [
      { s: "lim(x→3⁻) f(x) = 5, lim(x→3⁺) f(x) = 5 ve f(3) = 2 veriliyor. Hangisi doğrudur?", o: [
        ["lim(x→3) f(x) = 2, çünkü limit f(3) değerine eşittir.", "Limit, x = 3'teki değere değil yakınındaki davranışa bakar."],
        ["lim(x→3) f(x) = 5 ve f, x = 3'te süreksizdir (kaldırılabilir).", "Doğru. Sol ve sağ limit 5'te buluşur; ama f(3) ≠ 5 olduğundan süreklilik bozulur."],
        ["Limit yoktur, çünkü f(3) ≠ 5.", "Limitin varlığı için yalnız iki tek taraflı limitin eşitliği gerekir."],
        ["f, x = 3'te süreklidir.", "Süreklilik için lim = f(c) gerekir; burada 5 ≠ 2."]], d: 1 },
      { s: "lim(x→0) sin(3x)/(2x) kaçtır?", o: [
        ["0", "Doğrudan yerine koyma 0/0 verir; bu belirsizliktir, sonuç değil."],
        ["1", "sin(ax)/(bx) → a/b; katsayıları unutma."],
        ["3/2", "Doğru. sin(3x)/(2x) = (3/2)·sin(3x)/(3x) → 3/2."],
        ["Yoktur", "Sol ve sağ taraftan aynı değere yaklaşır; limit vardır."]], d: 2 }
    ],
    "calc-u2": [
      { s: "f, x = a'da sürekli ama grafiğinde köşe (corner) var. Hangisi kesindir?", o: [
        ["f′(a) vardır.", "Köşede sol ve sağ türevler farklıdır; f′(a) yoktur."],
        ["f, x = a'da türevlenemez.", "Doğru. Süreklilik türevlenebilirliği garanti etmez; köşe tipik örnektir."],
        ["f, x = a'da süreksizdir.", "Soruda sürekli olduğu verildi; köşe süreksizlik değildir."],
        ["lim(x→a) f(x) yoktur.", "Sürekli fonksiyonda limit vardır ve f(a)'ya eşittir."]], d: 1 }
    ],
    "calc-u3": [
      { s: "f(2) = 5 ve f′(2) = 4 ise (f⁻¹)′(5) kaçtır?", o: [
        ["4", "Türev değil, onun tersi gerekir."],
        ["1/4", "Doğru. (f⁻¹)′(b) = 1 / f′(a), burada f(2) = 5 olduğundan a = 2."],
        ["−1/4", "Ters fonksiyon türevinde işaret değişmez; yalnız tersini alırız."],
        ["1/5", "f′'yü 5'te değil, f(a) = 5 olan a = 2'de değerlendir."]], d: 1 }
    ],
    "calc-u4": [
      { s: "Bir parçacık için t = 2'de v(2) = −3 ve a(2) = 4. Bu anda hızlanma (speed) için ne söylenir?", o: [
        ["Speed artıyor, çünkü a > 0.", "İvmenin işareti tek başına yetmez; v ile karşılaştır."],
        ["Speed azalıyor, çünkü v ile a zıt işaretli.", "Doğru. v < 0, a > 0: hız vektörü yavaşlatılıyor."],
        ["Parçacık duruyor.", "v(2) = −3 ≠ 0; hareket ediyor."],
        ["Bilgi yetersiz.", "v ve a işaretleri karar için yeterlidir."]], d: 1 }
    ],
    "calc-u5": [
      { s: "f″(c) = 0 ise hangisi kesinlikle doğrudur?", o: [
        ["x = c bir dönüm (inflection) noktasıdır.", "Gerekli değil: f(x) = x⁴ için f″(0) = 0 ama içbükeylik değişmez."],
        ["x = c bir yerel ekstremumdur.", "f″(c) = 0 ikinci türev testini sonuçsuz bırakır."],
        ["Tek başına hiçbir sonuç çıkmaz; f″'nün işaret değiştirip değiştirmediğine bakılmalı.", "Doğru. Dönüm noktası için f″ işaret değiştirmelidir."],
        ["f′(c) = 0'dır.", "f″ ile f′ arasında böyle bir zorunluluk yoktur."]], d: 2 }
    ],
    "calc-u6": [
      { s: "f, [a, b] üzerinde artan ise sol Riemann toplamı L ve sağ toplam R için hangisi doğrudur?", o: [
        ["L ≤ ∫f ≤ R", "Doğru. Artan f'de sol uç en küçük değeri, sağ uç en büyük değeri verir."],
        ["R ≤ ∫f ≤ L", "Bu, azalan fonksiyon için geçerlidir."],
        ["L = R = ∫f", "Yalnız sabit fonksiyon için."],
        ["Karşılaştırma yapılamaz.", "Monotonluk, sıralamayı belirler."]], d: 0 },
      { s: "g(x) = ∫₀^(x²) cos(t) dt ise g′(x) nedir?", o: [
        ["cos(x²)", "Üst sınır x² olduğundan zincir kuralı gerekir."],
        ["2x·cos(x²)", "Doğru. FTC 1 + zincir kuralı: f(u(x))·u′(x)."],
        ["sin(x²)", "Bu g(x)'in kendisidir, türevi değil."],
        ["−2x·sin(x²)", "cos'un türevini almıyoruz; integrandı üst sınırda değerlendiriyoruz."]], d: 1 }
    ],
    "calc-u7": [
      { s: "dy/dx = x − y, y(0) = 1. h = 0.5 ile Euler yönteminin bir adımı y(0.5) için ne verir?", o: [
        ["1.5", "Eğim 0 − 1 = −1; artış değil azalış."],
        ["0.5", "Doğru. y ≈ 1 + 0.5·(0 − 1) = 0.5."],
        ["0", "Adım boyu h = 0.5 ile çarpmayı unutma."],
        ["1", "Eğim sıfır değil, −1."]], d: 1 }
    ],
    "calc-u8": [
      { s: "v(t), [0, 4]'te bir kez işaret değiştiriyor. Toplam yol (distance) hangisidir?", o: [
        ["∫₀⁴ v(t) dt", "Bu yer değiştirmedir (displacement)."],
        ["∫₀⁴ |v(t)| dt", "Doğru. Yol için hızın mutlak değeri integrallenir."],
        ["|∫₀⁴ v(t) dt|", "Önce integral sonra mutlak değer, geri dönüşleri götürür."],
        ["v(4) − v(0)", "Bu hızdaki değişimdir."]], d: 1 }
    ],
    "calc-u9": [
      { s: "x(t) = t², y(t) = t³ için t = 1'de dy/dx kaçtır?", o: [
        ["3", "dy/dt'yi dx/dt'ye bölmeyi unutma."],
        ["3/2", "Doğru. dy/dx = (3t²)/(2t) = 3/2 (t = 1)."],
        ["2/3", "Oranı ters aldın: (dy/dt)/(dx/dt)."],
        ["6", "Çarpım değil bölüm alınır."]], d: 1 }
    ],
    "calc-u10": [
      { s: "Σ (−1)ⁿ⁺¹/n serisi için doğru ifade hangisidir?", o: [
        ["Mutlak yakınsaktır.", "|aₙ| = 1/n harmonik seridir ve ıraksar."],
        ["Koşullu yakınsaktır.", "Doğru. Alternating Series Test ile yakınsar, mutlak değer serisi ıraksar."],
        ["Iraksaktır, çünkü harmonik seri ıraksar.", "İşaret değişimi yakınsamayı sağlar."],
        ["n'inci terim testi yakınsadığını kanıtlar.", "aₙ → 0 olması yakınsamayı kanıtlamaz."]], d: 1 },
      { s: "eˣ'in Maclaurin polinomunda x³ teriminin katsayısı nedir?", o: [
        ["1/3", "Katsayı f‴(0)/3! = 1/6."],
        ["1/6", "Doğru. f⁽ᵏ⁾(0) = 1, katsayı 1/k!."],
        ["1", "k! ile bölmeyi unutma."],
        ["3", "Katsayı türevin k!'e bölümüdür."]], d: 1 }
    ],
    "phys-u1": [
      { s: "Eğik atışta top en yüksek noktadayken hangisi doğrudur?", o: [
        ["Hız sıfır, ivme sıfırdır.", "Yatay hız sabit kalır; ivme her an g."],
        ["Düşey hız sıfır, ivme g (aşağı) kalır.", "Doğru. vᵧ = 0 ama yerçekimi etkisi sürer."],
        ["Yatay hız sıfırdır.", "Hava direnci yoksa vₓ değişmez."],
        ["İvme yukarı yönlüdür.", "Yerçekimi ivmesi hep aşağıdır."]], d: 1 },
      { s: "Düz zeminde 30° ve 60° ile aynı v₀ hızıyla atılan iki cismin menzili için ne söylenir?", o: [
        ["60° iki kat uzağa gider.", "R ∝ sin(2θ); sin60° = sin120°."],
        ["Menziller eşittir.", "Doğru. Tümler açılar aynı sin(2θ) değerini verir."],
        ["30° daha uzağa gider.", "İki açı için sin(2θ) eşittir."],
        ["Kütleye bağlıdır.", "Menzil formülünde kütle yoktur."]], d: 1 }
    ],
    "phys-u2": [
      { s: "Sürtünmesiz eğik düzlemde (θ) serbest bırakılan bloğun ivmesi nedir?", o: [
        ["g", "Yalnız ağırlığın eğime paralel bileşeni ivmelendirir."],
        ["g·sinθ", "Doğru. mg·sinθ = ma."],
        ["g·cosθ", "cos bileşeni normal kuvvetle dengelenir."],
        ["g·tanθ", "Normal kuvvet yönündeki bileşen ivme oluşturmaz."]], d: 1 },
      { s: "Masa üstünde duran kitap için ağırlığın (Dünya'nın kitabı çekmesi) üçüncü yasa eşi hangisidir?", o: [
        ["Masanın kitaba uyguladığı normal kuvvet", "Bunlar aynı cisme etki eder; üçüncü yasa çifti değildir."],
        ["Kitabın Dünya'yı yukarı çekmesi", "Doğru. Aynı tür kuvvet, farklı cisimler, eşit ve zıt."],
        ["Kitabın masaya uyguladığı kuvvet", "O, normal kuvvetin eşidir."],
        ["Eşi yoktur.", "Her kuvvetin bir etkileşim eşi vardır."]], d: 1 }
    ],
    "phys-u2c": [
      { s: "Düzgün çembersel harekette serbest cisim diyagramına neler çizilir?", o: [
        ["Gerçek kuvvetler + ayrı bir “merkezcil kuvvet” oku", "Merkezcil kuvvet yeni bir kuvvet değildir; net kuvvetin adıdır."],
        ["Yalnız gerçek kuvvetler (ağırlık, gerilme, normal...)", "Doğru. Bu kuvvetlerin merkeze doğru toplamı mv²/r'dir."],
        ["Dışa doğru merkezkaç kuvveti", "Eylemsiz çerçevede böyle bir kuvvet yoktur."],
        ["Hiç kuvvet çizilmez; hız sabittir.", "Hız yönü değişir; ivme ve net kuvvet vardır."]], d: 1 }
    ],
    "phys-u3": [
      { s: "Kutu yatay zeminde sabit hızla çekiliyor. Normal kuvvetin yaptığı iş nedir?", o: [
        ["Pozitif", "Normal kuvvet yer değiştirmeye diktir."],
        ["Sıfır", "Doğru. W = F·d·cos90° = 0."],
        ["Negatif", "Negatif iş yapan sürtünmedir."],
        ["mgd", "Düşey yer değiştirme yoktur."]], d: 1 }
    ],
    "phys-u4": [
      { s: "İki araba çarpışıp birbirine yapışıyor (dış kuvvet yok). Hangisi doğrudur?", o: [
        ["Momentum da kinetik enerji de korunur.", "Yapışan çarpışmada kinetik enerji kaybolur."],
        ["Momentum korunur, kinetik enerji azalır.", "Doğru. Tam esnek olmayan çarpışmanın tanımı."],
        ["Kinetik enerji korunur, momentum azalır.", "Yalıtılmış sistemde momentum her çarpışmada korunur."],
        ["Hiçbiri korunmaz.", "Dış impuls yoksa toplam momentum sabittir."]], d: 1 }
    ],
    "phys-u5": [
      { s: "Kapıyı menteşeden iki kat uzaktan, aynı kuvvetle ve kapıya dik iterek açarsan tork ne olur?", o: [
        ["Yarıya iner.", "τ = r⊥F; r artınca tork artar."],
        ["İki katına çıkar.", "Doğru. Moment kolu iki kat."],
        ["Değişmez.", "Tork, kuvvetin uygulandığı uzaklığa bağlıdır."],
        ["Dört katına çıkar.", "τ, r ile doğru orantılıdır (r² değil)."]], d: 1 }
    ],
    "phys-u6": [
      { s: "Dönen tabureteki öğrenci kollarını içe çekiyor (dış tork yok). Hangisi doğrudur?", o: [
        ["L sabit, ω artar, dönme kinetik enerjisi artar.", "Doğru. I azalır, Iω sabit; K = L²/2I artar (kas işi)."],
        ["L sabit, ω artar, kinetik enerji sabit.", "K = L²/(2I); I küçülünce K büyür."],
        ["ω sabit kalır.", "I değişirse ω da değişir."],
        ["L azalır.", "Dış tork yokken L korunur."]], d: 0 }
    ],
    "phys-u7": [
      { s: "Yay–kütle sisteminde genlik iki katına çıkarılırsa periyot ne olur?", o: [
        ["İki katına çıkar.", "T = 2π√(m/k) genliğe bağlı değildir."],
        ["Değişmez.", "Doğru. Enerji ve vₘₐₓ değişir, periyot değişmez."],
        ["√2 katına çıkar.", "Bu, kütle iki katına çıktığında olur."],
        ["Yarıya iner.", "Genlik periyodu etkilemez."]], d: 1 }
    ],
    "phys-u8": [
      { s: "Yoğunluğu 600 kg/m³ olan tahta blok suda (1000 kg/m³) yüzüyor. Hacminin ne kadarı su altındadır?", o: [
        ["%40", "Bu, su üstünde kalan kısımdır."],
        ["%60", "Doğru. Batan oran = ρ_cisim / ρ_sıvı = 0.6."],
        ["%100", "ρ_cisim < ρ_sıvı olduğundan yüzer."],
        ["Bloğun kütlesine bağlı", "Oran yalnız yoğunluklar oranına bağlıdır."]], d: 1 }
    ]
  };

  // ---------------------------------------------------------------- Tarayıcı katmanı
  if (typeof document === "undefined") { if (typeof module === "object" && module.exports) module.exports = { hesap: H, dene: DENE, siraKaristir: siraKaristir }; return; }

  var HAREKETSIZ = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sayac = 0;
  function yid(p) { return "emf-" + p + "-" + (++sayac); }
  function el(etiket, sinif, metin) { var e = document.createElement(etiket); if (sinif) e.className = sinif; if (metin != null) e.textContent = metin; return e; }
  function sayi(x, b) { if (!isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "tanımsız"; b = b == null ? 3 : b; var s = (Math.abs(x) < 1e-9 ? 0 : x).toFixed(b); return s.replace(/^-/, "−"); }
  function renkler() {
    var cs = getComputedStyle(document.documentElement), g = function (n, y) { var v = cs.getPropertyValue(n).trim(); return v || y; };
    return {
      metin: g("--text", "#1a1033"), soluk: g("--text-muted", "#5e5873"), sonuk: g("--text-dim", "#6b6585"),
      cizgi: g("--border", "#e3def2"), cizgi2: g("--border-strong", "#cec7e3"), yuzey: g("--surface", "#fff"),
      vurgu: g("--accent", "#5b3df5"), ikinci: g("--accent-amber", "#a54a07"), ucuncu: g("--accent-cyan", "#0e6f86"),
      dorduncu: g("--accent-pink", "#be185d"), yesil: g("--accent-emerald", "#047857"),
      font: getComputedStyle(document.body).fontFamily || "system-ui, sans-serif"
    };
  }
  function seffaf(renk, a) { return "color-mix(in srgb, " + renk + " " + Math.round(a * 100) + "%, transparent)"; }

  // Canlı bölge: ekran okuyucuya sakin (gecikmeli) duyuru
  function canli(bolge) {
    var z = null;
    return function (metin) { clearTimeout(z); z = setTimeout(function () { bolge.textContent = metin; }, 350); };
  }

  // Tuval: en-boy oranı CSS ile sabit → çizimden önce yer ayrılır
  function Tuval(kap, oran, etiket) {
    var sar = el("div", "emf-tuval"); sar.style.aspectRatio = oran;
    var c = document.createElement("canvas"); c.setAttribute("role", "img"); c.setAttribute("aria-label", etiket);
    sar.appendChild(c); kap.appendChild(sar);
    var o = { sar: sar, c: c, x: c.getContext("2d"), w: 0, h: 0 };
    o.boyutla = function () {
      var r = sar.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      if (r.width < 2) return false;
      var W = Math.round(r.width * d), Hh = Math.round(r.height * d);
      if (c.width !== W || c.height !== Hh) { c.width = W; c.height = Hh; }
      o.x.setTransform(d, 0, 0, d, 0, 0); o.w = r.width; o.h = r.height; return true;
    };
    return o;
  }
  // Koordinat düzlemi
  function Duzlem(t, xr, yr, pad) {
    pad = pad || { l: 34, r: 10, t: 10, b: 22 };
    var X = function (x) { return pad.l + (x - xr[0]) / (xr[1] - xr[0]) * (t.w - pad.l - pad.r); };
    var Y = function (y) { return t.h - pad.b - (y - yr[0]) / (yr[1] - yr[0]) * (t.h - pad.t - pad.b); };
    var Xi = function (px) { return xr[0] + (px - pad.l) / (t.w - pad.l - pad.r) * (xr[1] - xr[0]); };
    var Yi = function (py) { return yr[0] + (t.h - pad.b - py) / (t.h - pad.t - pad.b) * (yr[1] - yr[0]); };
    return { X: X, Y: Y, Xi: Xi, Yi: Yi, xr: xr, yr: yr, pad: pad };
  }
  function adimSec(aralik) { var h = aralik / 6, p = Math.pow(10, Math.floor(Math.log10(h))), m = h / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
  function eksenCiz(t, D, R, opt) {
    var c = t.x; opt = opt || {};
    c.save(); c.clearRect(0, 0, t.w, t.h);
    c.font = "11px " + R.font; c.lineWidth = 1;
    var sx = opt.xAdim || adimSec(D.xr[1] - D.xr[0]), sy = opt.yAdim || adimSec(D.yr[1] - D.yr[0]);
    c.strokeStyle = R.cizgi; c.fillStyle = R.sonuk;
    c.textAlign = "center"; c.textBaseline = "top";
    var atla = Math.max(1, Math.ceil(30 / Math.max(1, D.X(sx) - D.X(0)))), sira = 0; // dar ekranda etiketler çakışmasın
    for (var x = Math.ceil(D.xr[0] / sx) * sx; x <= D.xr[1] + 1e-9; x += sx) {
      var px = Math.round(D.X(x)) + 0.5; c.beginPath(); c.moveTo(px, D.pad.t); c.lineTo(px, t.h - D.pad.b); c.stroke();
      if (!opt.xEtiketYok && (sira++ % atla === 0)) c.fillText(opt.xBicim ? opt.xBicim(x) : sayi(x, sx < 1 ? 1 : 0), px, t.h - D.pad.b + 4);
    }
    c.textAlign = "right"; c.textBaseline = "middle";
    for (var y = Math.ceil(D.yr[0] / sy) * sy; y <= D.yr[1] + 1e-9; y += sy) {
      var py = Math.round(D.Y(y)) + 0.5; c.beginPath(); c.moveTo(D.pad.l, py); c.lineTo(t.w - D.pad.r, py); c.stroke();
      c.fillText(sayi(y, sy < 1 ? 1 : 0), D.pad.l - 5, py);
    }
    c.strokeStyle = R.cizgi2; c.lineWidth = 1.25;
    if (D.yr[0] <= 0 && D.yr[1] >= 0) { c.beginPath(); c.moveTo(D.pad.l, D.Y(0)); c.lineTo(t.w - D.pad.r, D.Y(0)); c.stroke(); }
    if (D.xr[0] <= 0 && D.xr[1] >= 0) { c.beginPath(); c.moveTo(D.X(0), D.pad.t); c.lineTo(D.X(0), t.h - D.pad.b); c.stroke(); }
    c.restore();
  }
  function egriCiz(t, D, f, renk, opt) {
    var c = t.x, n = Math.max(200, Math.round(t.w * 1.5)), ilk = true, onceki = null; opt = opt || {};
    var a = opt.a != null ? opt.a : D.xr[0], b = opt.b != null ? opt.b : D.xr[1];
    c.save(); c.strokeStyle = renk; c.lineWidth = opt.kalin || 2; c.lineJoin = "round";
    if (opt.kesik) c.setLineDash([5, 4]);
    var ust = D.yr[1] + (D.yr[1] - D.yr[0]) * 2, alt = D.yr[0] - (D.yr[1] - D.yr[0]) * 2;
    c.beginPath();
    for (var i = 0; i <= n; i++) {
      var x = a + (b - a) * i / n, y = f(x);
      if (!isFinite(y) || y > ust || y < alt || (opt.kirik && onceki != null && opt.kirik(onceki, x))) { ilk = true; onceki = x; continue; }
      if (ilk) { c.moveTo(D.X(x), D.Y(y)); ilk = false; } else c.lineTo(D.X(x), D.Y(y));
      onceki = x;
    }
    c.stroke(); c.restore();
  }
  function nokta(c, x, y, r, dolgu, cevre, bos) {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI);
    c.fillStyle = bos ? cevre : dolgu; c.fill();
    c.lineWidth = 2; c.strokeStyle = bos ? dolgu : cevre; c.stroke();
    if (bos) { c.beginPath(); c.arc(x, y, r - 2, 0, 2 * Math.PI); c.fillStyle = cevre; c.fill(); }
    c.restore();
  }
  function ok(c, x1, y1, x2, y2, renk, kalin, etiket, R, etiketYon) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    c.save(); c.strokeStyle = renk; c.fillStyle = renk; c.lineWidth = kalin || 2.5; c.lineCap = "round";
    if (L > 1) {
      var u = dx / L, v = dy / L, bas = Math.min(9, L * 0.45);
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - u * bas * 0.8, y2 - v * bas * 0.8); c.stroke();
      c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - u * bas - v * bas * 0.55, y2 - v * bas + u * bas * 0.55); c.lineTo(x2 - u * bas + v * bas * 0.55, y2 - v * bas - u * bas * 0.55); c.closePath(); c.fill();
    }
    if (etiket && R) {
      c.font = "600 12px " + R.font; c.fillStyle = R.metin; c.textAlign = "center"; c.textBaseline = "middle";
      var ex = x2 + (L > 1 ? dx / L * 12 : 0), ey = y2 + (L > 1 ? dy / L * 12 : 0);
      if (etiketYon) { ex += etiketYon[0]; ey += etiketYon[1]; }
      yazi(c, etiket, ex, ey, R);
    }
    c.restore();
  }
  function yazi(c, m, x, y, R, hiza) {
    c.save(); c.font = c.font || "12px " + R.font; if (hiza) c.textAlign = hiza;
    c.lineWidth = 3; c.strokeStyle = R.yuzey; c.lineJoin = "round"; c.strokeText(m, x, y);
    c.fillStyle = R.metin; c.fillText(m, x, y); c.restore();
  }

  // Denetim üreticileri
  function kaydirici(kap, o) {
    var d = el("div", "emf-kontrol"), id = yid("k"), lb = el("label", null, o.etiket), out = el("output"), inp = document.createElement("input");
    lb.htmlFor = id; inp.type = "range"; inp.id = id; inp.min = o.min; inp.max = o.max; inp.step = o.adim; inp.value = o.deger;
    out.htmlFor = id; out.setAttribute("aria-hidden", "true");
    d.appendChild(lb); d.appendChild(out); d.appendChild(inp); kap.appendChild(d);
    var bic = o.bicim || function (v) { return String(v); };
    function yaz() { var m = bic(+inp.value); out.textContent = m; inp.setAttribute("aria-valuetext", m); }
    yaz();
    inp.addEventListener("input", function () { yaz(); if (o.degisti) o.degisti(+inp.value); });
    if (o.birakti) inp.addEventListener("change", function () { o.birakti(+inp.value); });
    return { inp: inp, al: function () { return +inp.value; }, ver: function (v) { inp.value = v; yaz(); }, yaz: yaz };
  }
  function secici(kap, o) {
    var d = el("div", "emf-kontrol"), id = yid("s"), lb = el("label", null, o.etiket), s = document.createElement("select");
    lb.htmlFor = id; s.id = id;
    o.secenekler.forEach(function (p) { var op = document.createElement("option"); op.value = p[0]; op.textContent = p[1]; s.appendChild(op); });
    s.value = o.deger; d.appendChild(lb); d.appendChild(el("span")); d.appendChild(s); kap.appendChild(d);
    s.addEventListener("change", function () { o.degisti(s.value); });
    return s;
  }
  function anahtarlar(kap, o) {
    var d = el("div", "emf-kontrol"), ad = el("span", "emf-k-ad", o.etiket), g = el("div", "emf-grup"), gid = yid("g");
    ad.id = gid; g.setAttribute("role", "group"); g.setAttribute("aria-labelledby", gid);
    var dugmeler = o.secenekler.map(function (p) {
      var b = el("button", "emf-dugme", p[1]); b.type = "button"; b.dataset.deger = p[0]; b.setAttribute("aria-pressed", String(p[0] === o.deger));
      b.addEventListener("click", function () { dugmeler.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); o.degisti(p[0]); });
      g.appendChild(b); return b;
    });
    d.appendChild(ad); d.appendChild(el("span")); d.appendChild(g); kap.appendChild(d);
    return dugmeler;
  }
  function dugme(kap, metin, fn) { var b = el("button", "emf-dugme", metin); b.type = "button"; b.addEventListener("click", fn); kap.appendChild(b); return b; }
  function okumalar(kap, adlar) {
    var g = el("div", "emf-okumalar"), r = {};
    adlar.forEach(function (p) { var k = el("div", "emf-okuma"); k.appendChild(el("span", null, p[1])); var b = el("b", null, "—"); k.appendChild(b); g.appendChild(k); r[p[0]] = b; });
    kap.appendChild(g); return r;
  }
  function lejant(kap, ogeler) {
    var u = el("ul", "emf-lejant");
    ogeler.forEach(function (p) { var li = el("li"); var i = el("i", p[2] || ""); i.style.color = p[0]; li.appendChild(i); li.appendChild(document.createTextNode(p[1])); u.appendChild(li); });
    kap.appendChild(u); return u;
  }
  function kabuk(host, baslik, aciklama, etiket) {
    host.textContent = "";
    host.setAttribute("role", "group");
    var bas = el("div", "emf-w-bas"), h = el("p", "emf-w-baslik", baslik), hid = yid("b");
    h.id = hid; host.setAttribute("aria-labelledby", hid);
    bas.appendChild(h); bas.appendChild(el("span", "emf-w-etiket", etiket || "Etkileşimli")); host.appendChild(bas);
    if (aciklama) host.appendChild(el("p", "emf-w-aciklama", aciklama));
  }
  function sonucBolge(host) { var p = el("p", "emf-sonuc"); p.setAttribute("aria-live", "polite"); host.appendChild(p); return p; }

  // ---------------------------------------------------------------- Laboratuvarlar
  var W = {};

  // (C1) Limit gezgini
  W.limit = function (host) {
    kabuk(host, "Limit gezgini: x → a", "Fonksiyon seç, sonra h kaydırıcısıyla x'i a'ya iki yandan yaklaştır. Sol ve sağ değerler aynı sayıya yaklaşıyorsa limit vardır; f(a) değeri bu kararı etkilemez.");
    var S = { k: "delik", kk: 10 };
    var t = Tuval(host, "16 / 9", "Seçili fonksiyonun grafiği; a noktasının solunda ve sağında iki işaretli nokta");
    var R0 = renkler();
    var lj = lejant(host, [[R0.vurgu, "x = a − h (soldan)", "emf-nokta"], [R0.ikinci, "x = a + h (sağdan)", "emf-nokta"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    secici(k, { etiket: "Fonksiyon", deger: S.k, secenekler: Object.keys(H.LIMIT).map(function (a) { return [a, H.LIMIT[a].ad]; }), degisti: function (v) { S.k = v; ciz(); } });
    var hK = kaydirici(k, { etiket: "Uzaklık h = |x − a|", min: 0, max: 30, adim: 1, deger: S.kk, bicim: function (v) { return "h = " + hDeger(v).toPrecision(2).replace(/\.?0+$/, ""); }, degisti: function (v) { S.kk = v; ciz(); } });
    var tk = el("div", "emf-tablo-kap"), tb = el("table", "emf-tablo"); tk.appendChild(tb); host.appendChild(tk);
    var son = sonucBolge(host), duy = canli(son);
    function hDeger(v) { return Math.pow(10, -v / 10); }
    function ciz() {
      if (!t.boyutla()) return;
      var R = renkler(), L = H.LIMIT[S.k], D = Duzlem(t, L.x, L.y), c = t.x, h = hDeger(S.kk), r = H.limitTablo(S.k, h);
      lj.children[0].querySelector("i").style.color = R.vurgu; lj.children[1].querySelector("i").style.color = R.ikinci;
      eksenCiz(t, D, R);
      egriCiz(t, D, L.f, R.metin, { kirik: function (x0, x1) { return (x0 - L.a) * (x1 - L.a) <= 0; } });
      // a'daki işaretler: delik (boş daire) ve tanımlı değer (dolu)
      c.save(); c.setLineDash([3, 4]); c.strokeStyle = R.soluk; c.lineWidth = 1;
      c.beginPath(); c.moveTo(D.X(L.a), D.pad.t); c.lineTo(D.X(L.a), t.h - D.pad.b); c.stroke(); c.restore();
      nokta(c, D.X(L.a), D.Y(L.sol), 5, R.metin, R.yuzey, true);
      if (L.sag !== L.sol) nokta(c, D.X(L.a), D.Y(L.sag), 5, R.metin, R.yuzey, L.fa !== L.sag);
      if (L.fa != null) nokta(c, D.X(L.a), D.Y(L.fa), 5, R.metin, R.metin, false);
      [[r.solX, r.sol, R.vurgu], [r.sagX, r.sag, R.ikinci]].forEach(function (p) {
        if (!isFinite(p[1])) return;
        c.save(); c.setLineDash([4, 4]); c.strokeStyle = p[2]; c.lineWidth = 1.25;
        c.beginPath(); c.moveTo(D.X(p[0]), D.Y(p[1])); c.lineTo(D.pad.l, D.Y(p[1])); c.stroke(); c.restore();
        nokta(c, D.X(p[0]), D.Y(p[1]), 6, p[2], R.yuzey, false);
      });
      c.save(); c.font = "600 12px " + R.font; c.textAlign = "center"; c.textBaseline = "top"; yazi(c, "a = " + L.a, D.X(L.a), D.pad.t + 2, R); c.restore();
      // Tablo
      var hs = [h, 0.1, 0.01, 0.001]; // ilk satır: seçili h (satır sayısı sabit → yükseklik değişmez)
      var html = "<caption class=\"emf-gorsel-gizli\">a'nın iki yanındaki değerler</caption><thead><tr><th scope=\"col\">h</th><th scope=\"col\">x = a − h</th><th scope=\"col\">f(x)</th><th scope=\"col\">x = a + h</th><th scope=\"col\">f(x)</th></tr></thead><tbody>";
      hs.forEach(function (hh, hi) {
        var q = H.limitTablo(S.k, hh);
        html += "<tr" + (hi === 0 ? " class=\"emf-secili\"" : "") + "><td>" + sayi(hh, 4) + "</td><td>" + sayi(q.solX, 4) + "</td><td>" + sayi(q.sol, 5) + "</td><td>" + sayi(q.sagX, 4) + "</td><td>" + sayi(q.sag, 5) + "</td></tr>";
      });
      tb.innerHTML = html + "</tbody>";
      var m = "h = " + sayi(h, 4) + ": soldan f ≈ " + sayi(r.sol, 4) + ", sağdan f ≈ " + sayi(r.sag, 4) + ". ";
      if (L.sol === L.sag) m += "İki yan da " + L.sol + " değerine yaklaşıyor → limit " + L.sol + (L.fa == null ? "; f(" + L.a + ") tanımsız (delik), limit yine de vardır." : ".");
      else m += "Sol limit " + L.sol + ", sağ limit " + L.sag + " → iki taraflı limit yoktur (sıçrama süreksizliği). f(" + L.a + ") = " + L.fa + ".";
      son.dataset.m = m; duy(m);
    }
    return { ciz: ciz, t: [t] };
  };

  // (C2) Kesen → teğet ve f′ izi
  W.teget = function (host) {
    kabuk(host, "Kesenden teğete: türev", "P noktasını seç ve h'yi küçült: kesen doğrusu teğete döner, eğimi f′(a)'ya yaklaşır. Alttaki grafik, gezdirdiğin her a için kesen eğimini işaretleyerek f′'nün izini çıkarır. f(x) = 0.25x³ − x + 0.5");
    var S = { a: -1.5, kk: 0, iz: {} };
    var t = Tuval(host, "16 / 9", "f(x) grafiği, P ve Q noktaları ve PQ kesen doğrusu");
    var t2 = Tuval(host, "16 / 6", "f türevinin grafiği ve kaydırıcıyla bırakılan iz noktaları");
    var R0 = renkler();
    lejant(host, [[R0.metin, "f(x)"], [R0.vurgu, "kesen / teğet"], [R0.soluk, "gerçek f′(x)", "emf-kesik"], [R0.ikinci, "iz: kesen eğimi", "emf-nokta"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    kaydirici(k, { etiket: "Nokta a", min: -2.5, max: 2.5, adim: 0.05, deger: S.a, bicim: function (v) { return "a = " + sayi(v, 2); }, degisti: function (v) { S.a = v; izEkle(); ciz(); } });
    kaydirici(k, { etiket: "Kesen aralığı h", min: 0, max: 30, adim: 1, deger: S.kk, bicim: function (v) { return "h = " + sayi(hD(v), 3); }, degisti: function (v) { S.kk = v; izEkle(); ciz(); } });
    var ey = el("div", "emf-eylemler"); host.appendChild(ey);
    dugme(ey, "İzi temizle", function () { S.iz = {}; ciz(); });
    var o = okumalar(host, [["m", "Kesen eğimi"], ["d", "f′(a) (kesin)"], ["e", "Fark"]]);
    var son = sonucBolge(host), duy = canli(son);
    function hD(v) { return 2 * Math.pow(10, -v / 10); }
    function izEkle() { S.iz[S.a.toFixed(2)] = H.kesenEgim(H.turevF, S.a, hD(S.kk)); }
    izEkle();
    function ciz() {
      if (!t.boyutla() || !t2.boyutla()) return;
      var R = renkler(), D = Duzlem(t, [-3, 3], [-3, 4.5]), c = t.x, h = hD(S.kk), a = S.a, f = H.turevF;
      var m = H.kesenEgim(f, a, h), d = H.turevFp(a);
      eksenCiz(t, D, R);
      egriCiz(t, D, f, R.metin);
      egriCiz(t, D, function (x) { return f(a) + m * (x - a); }, R.vurgu, { kalin: 2 });
      nokta(c, D.X(a), D.Y(f(a)), 6, R.vurgu, R.yuzey);
      if (h > 0.03) nokta(c, D.X(a + h), D.Y(f(a + h)), 5, R.ikinci, R.yuzey);
      c.save(); c.font = "600 12px " + R.font; c.textAlign = "left"; c.textBaseline = "bottom";
      yazi(c, "P", D.X(a) + 8, D.Y(f(a)) - 6, R); if (h > 0.03) yazi(c, "Q", D.X(a + h) + 8, D.Y(f(a + h)) - 6, R); c.restore();
      var D2 = Duzlem(t2, [-3, 3], [-1.5, 4.5], { l: 34, r: 10, t: 8, b: 20 });
      eksenCiz(t2, D2, R, { yAdim: 1.5 });
      egriCiz(t2, D2, H.turevFp, R.soluk, { kesik: true, kalin: 1.5 });
      Object.keys(S.iz).forEach(function (x) { var y = S.iz[x]; if (y > -1.5 && y < 4.5) nokta(t2.x, D2.X(+x), D2.Y(y), 3, R.ikinci, R.ikinci); });
      nokta(t2.x, D2.X(a), D2.Y(Math.max(-1.5, Math.min(4.5, m))), 5.5, R.vurgu, R.yuzey);
      t2.x.save(); t2.x.font = "600 11px " + R.font; t2.x.textAlign = "left"; t2.x.textBaseline = "top"; yazi(t2.x, "f′(x)", D2.pad.l + 6, D2.pad.t + 2, R); t2.x.restore();
      o.m.textContent = sayi(m, 4); o.d.textContent = sayi(d, 4); o.e.textContent = sayi(m - d, 4);
      var msj = "a = " + sayi(a, 2) + ", h = " + sayi(h, 3) + ": kesen eğimi " + sayi(m, 3) + ", f′(a) = " + sayi(d, 3) + (h < 0.01 ? ". h → 0 iken kesen teğet oldu." : ". h'yi küçültmeye devam et.");
      son.textContent !== msj && duy(msj);
    }
    return { ciz: ciz, t: [t, t2] };
  };

  // (C3) Riemann toplamları
  W.riemann = function (host) {
    kabuk(host, "Riemann toplamları", "Dikdörtgen sayısı n'yi artır ve yöntem değiştir: yaklaşık alanın kesin integrale nasıl yaklaştığını izle.");
    var S = { k: "kare", n: 4, tur: "sol" };
    var t = Tuval(host, "16 / 9", "Fonksiyon grafiği ve altındaki Riemann dikdörtgenleri ya da yamukları");
    var R0 = renkler();
    var lj = lejant(host, [[R0.metin, "f(x)"], [R0.vurgu, "yaklaşık alan", "emf-alan"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    secici(k, { etiket: "Fonksiyon ve aralık", deger: S.k, secenekler: Object.keys(H.RIEMANN).map(function (a) { return [a, H.RIEMANN[a].ad]; }), degisti: function (v) { S.k = v; ciz(); } });
    kaydirici(k, { etiket: "Alt aralık sayısı n", min: 1, max: 40, adim: 1, deger: S.n, bicim: function (v) { return "n = " + v; }, degisti: function (v) { S.n = v; ciz(); } });
    anahtarlar(k, { etiket: "Yöntem", deger: S.tur, secenekler: [["sol", "Left"], ["sag", "Right"], ["orta", "Midpoint"], ["yamuk", "Trapezoid"]], degisti: function (v) { S.tur = v; ciz(); } });
    var o = okumalar(host, [["y", "Yaklaşık"], ["k", "Kesin ∫"], ["e", "Hata (yaklaşık − kesin)"]]);
    var son = sonucBolge(host), duy = canli(son);
    function ciz() {
      if (!t.boyutla()) return;
      var R = renkler(), F = H.RIEMANN[S.k], pay = (F.b - F.a) * 0.08, D = Duzlem(t, [F.a - pay, F.b + pay], [-0.05 * F.y[1], F.y[1]]), c = t.x, n = S.n, dx = (F.b - F.a) / n;
      lj.children[1].querySelector("i").style.color = R.vurgu;
      eksenCiz(t, D, R, S.k === "sin" ? { xAdim: Math.PI / 4, xBicim: function (x) { var q = Math.round(x / (Math.PI / 4)); return q === 0 ? "0" : q === 4 ? "π" : q === 2 ? "π/2" : q + "π/4"; } } : null);
      c.save(); c.fillStyle = seffaf(R.vurgu, 0.22); c.strokeStyle = R.vurgu; c.lineWidth = 1.25;
      for (var i = 0; i < n; i++) {
        var x0 = F.a + i * dx, x1 = x0 + dx;
        c.beginPath();
        if (S.tur === "yamuk") { c.moveTo(D.X(x0), D.Y(0)); c.lineTo(D.X(x0), D.Y(F.f(x0))); c.lineTo(D.X(x1), D.Y(F.f(x1))); c.lineTo(D.X(x1), D.Y(0)); c.closePath(); }
        else {
          var xs = S.tur === "sol" ? x0 : S.tur === "sag" ? x1 : (x0 + x1) / 2, y = F.f(xs);
          c.rect(D.X(x0), D.Y(y), D.X(x1) - D.X(x0), D.Y(0) - D.Y(y));
        }
        c.fill(); c.stroke();
      }
      c.restore();
      egriCiz(t, D, F.f, R.metin, { a: F.a - pay * 0.5, b: F.b + pay * 0.5 });
      var yk = H.riemann(F.f, F.a, F.b, n, S.tur), e = yk - F.kesin;
      o.y.textContent = sayi(yk, 5); o.k.textContent = sayi(F.kesin, 5); o.e.textContent = sayi(e, 5);
      var ad = { sol: "Left", sag: "Right", orta: "Midpoint", yamuk: "Trapezoid" }[S.tur];
      duy(ad + ", n = " + n + ": yaklaşık " + sayi(yk, 4) + ", kesin " + sayi(F.kesin, 4) + " → " + (Math.abs(e) < 5e-4 ? "neredeyse eşit." : e > 0 ? "üst tahmin (overestimate)." : "alt tahmin (underestimate)."));
    }
    return { ciz: ciz, t: [t] };
  };

  // (C4) Birikim fonksiyonu g(x) = ∫₀ˣ f(t) dt
  W.birikim = function (host) {
    kabuk(host, "Birikim fonksiyonu g(x) = ∫₀ˣ f(t) dt", "x'i sağa sürükle: f'nin eksen üstündeki alanı g'yi artırır, altındaki alan azaltır. g′(x) = f(x) (FTC Part 1). f(t) = (t − 1)(t − 3)");
    var S = { x: 0.5 };
    var t = Tuval(host, "16 / 8", "f(t) grafiği ve 0'dan x'e kadar işaretli alan");
    var t2 = Tuval(host, "16 / 6", "g(x) birikim fonksiyonunun 0'dan x'e kadar çizilen grafiği");
    var R0 = renkler();
    var lj = lejant(host, [[R0.vurgu, "pozitif alan (+)", "emf-alan"], [R0.ikinci, "negatif alan (−)", "emf-alan"], [R0.metin, "f(t) ve g(x)"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    kaydirici(k, { etiket: "Üst sınır x", min: 0, max: 4, adim: 0.02, deger: S.x, bicim: function (v) { return "x = " + sayi(v, 2); }, degisti: function (v) { S.x = v; ciz(); } });
    var o = okumalar(host, [["g", "g(x)"], ["f", "g′(x) = f(x)"], ["d", "g'nin davranışı"]]);
    var son = sonucBolge(host), duy = canli(son);
    function ciz() {
      if (!t.boyutla() || !t2.boyutla()) return;
      var R = renkler(), D = Duzlem(t, [-0.2, 4.2], [-1.5, 3.3]), c = t.x, x = S.x, f = H.birikimF;
      lj.children[0].querySelector("i").style.color = R.vurgu; lj.children[1].querySelector("i").style.color = R.ikinci;
      eksenCiz(t, D, R);
      var n = 160;
      for (var i = 0; i < n; i++) {
        var a = x * i / n, b = x * (i + 1) / n, ya = f(a), yb = f(b);
        c.beginPath(); c.moveTo(D.X(a), D.Y(0)); c.lineTo(D.X(a), D.Y(ya)); c.lineTo(D.X(b), D.Y(yb)); c.lineTo(D.X(b), D.Y(0)); c.closePath();
        c.fillStyle = seffaf((ya + yb) / 2 >= 0 ? R.vurgu : R.ikinci, 0.35); c.fill();
      }
      egriCiz(t, D, f, R.metin);
      c.save(); c.strokeStyle = R.metin; c.lineWidth = 1.5; c.beginPath(); c.moveTo(D.X(x), D.Y(0)); c.lineTo(D.X(x), D.Y(f(x))); c.stroke(); c.restore();
      nokta(c, D.X(x), D.Y(f(x)), 5, R.metin, R.yuzey);
      var D2 = Duzlem(t2, [-0.2, 4.2], [-0.3, 1.8], { l: 34, r: 10, t: 8, b: 20 });
      eksenCiz(t2, D2, R, { yAdim: 0.5 });
      egriCiz(t2, D2, H.birikimG, R.cizgi2, { kalin: 1.25, kesik: true, a: 0, b: 4 });
      egriCiz(t2, D2, H.birikimG, R.metin, { a: 0, b: x });
      nokta(t2.x, D2.X(x), D2.Y(H.birikimG(x)), 5.5, R.vurgu, R.yuzey);
      t2.x.save(); t2.x.font = "600 11px " + R.font; t2.x.textAlign = "left"; t2.x.textBaseline = "top"; yazi(t2.x, "g(x)", D2.pad.l + 6, D2.pad.t + 2, R); t2.x.restore();
      var g = H.birikimG(x), fx = f(x), dv = Math.abs(fx) < 0.02 ? "yatay teğet (f = 0)" : fx > 0 ? "artıyor" : "azalıyor";
      o.g.textContent = sayi(g, 4); o.f.textContent = sayi(fx, 4); o.d.textContent = dv;
      duy("x = " + sayi(x, 2) + ": g(x) = " + sayi(g, 3) + ", f(x) = " + sayi(fx, 3) + "; g " + dv + ".");
    }
    return { ciz: ciz, t: [t, t2] };
  };

  // (C5) Eğim alanı + Euler
  W.egim = function (host) {
    kabuk(host, "Eğim alanı ve Euler yöntemi", "Bir diferansiyel denklem seç. Tuvale tıklayarak (ya da x₀, y₀ seçip düğmeyle) başlangıç noktası bırak: ince eğri çözümü, kalın kırık çizgi seçtiğin h ile Euler tahminini gösterir.");
    var S = { k: "xmy", x0: -2, y0: 1, h: 0.5, egriler: [] };
    var t = Tuval(host, "1 / 1", "Eğim alanı; bırakılan başlangıç noktalarından geçen çözüm eğrileri ve Euler kırık çizgisi");
    t.sar.classList.add("emf-tikla"); t.sar.style.maxWidth = "520px"; t.sar.style.marginInline = "auto";
    var R0 = renkler();
    lejant(host, [[R0.soluk, "eğim segmentleri"], [R0.vurgu, "çözüm eğrisi"], [R0.ikinci, "Euler (adım h)", "emf-nokta"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    secici(k, { etiket: "Denklem", deger: S.k, secenekler: Object.keys(H.EGIM).map(function (a) { return [a, H.EGIM[a].ad]; }), degisti: function (v) { S.k = v; S.egriler = []; ciz(); } });
    var kx = kaydirici(k, { etiket: "Başlangıç x₀", min: -3, max: 2, adim: 0.25, deger: S.x0, bicim: function (v) { return sayi(v, 2); }, degisti: function (v) { S.x0 = v; } });
    var ky = kaydirici(k, { etiket: "Başlangıç y₀", min: -3, max: 3, adim: 0.25, deger: S.y0, bicim: function (v) { return sayi(v, 2); }, degisti: function (v) { S.y0 = v; } });
    anahtarlar(k, { etiket: "Euler adımı h", deger: "0.5", secenekler: [["0.5", "0.5"], ["0.25", "0.25"], ["0.1", "0.1"]], degisti: function (v) { S.h = +v; ciz(); } });
    var ey = el("div", "emf-eylemler"); host.appendChild(ey);
    dugme(ey, "Bu noktadan eğri bırak", function () { birak(S.x0, S.y0); });
    dugme(ey, "Eğrileri temizle", function () { S.egriler = []; ciz(); });
    var o = okumalar(host, [["e", "Euler: y(x₀ + 1)"], ["c", "Çözüm: y(x₀ + 1)"], ["f", "Fark"]]);
    var son = sonucBolge(host), duy = canli(son);
    var DX = [-3, 3], DY = [-3, 3];
    function birak(x, y) { S.egriler.push([x, y]); if (S.egriler.length > 6) S.egriler.shift(); S.x0 = x; S.y0 = y; ciz(); }
    t.c.addEventListener("click", function (e) {
      var r = t.c.getBoundingClientRect(), D = Duzlem(t, DX, DY, { l: 26, r: 8, t: 8, b: 20 });
      var x = D.Xi(e.clientX - r.left), y = D.Yi(e.clientY - r.top);
      if (x < DX[0] || x > DX[1] || y < DY[0] || y > DY[1]) return;
      x = Math.round(x * 20) / 20; y = Math.round(y * 20) / 20;
      kx.ver(Math.max(-3, Math.min(2, Math.round(x * 4) / 4))); ky.ver(Math.round(y * 4) / 4);
      birak(x, y);
    });
    function cozum(F, x0, y0, yon) {
      var p = [], x = x0, y = y0, h = 0.005 * yon;
      for (var i = 0; i < 1400; i++) {
        p.push([x, y]); var m = F(x, y); if (!isFinite(m) || Math.abs(m) > 60) break;
        var ym = y + h / 2 * m, mm = F(x + h / 2, ym); if (!isFinite(mm)) break; // orta nokta (RK2): çözüme yakın ince eğri
        y += h * mm; x += h;
        if (x < DX[0] - 0.1 || x > DX[1] + 0.1 || y < DY[0] - 1 || y > DY[1] + 1) { p.push([x, y]); break; }
      }
      return p;
    }
    function yol(c, D, p) { c.beginPath(); p.forEach(function (q, i) { var X = D.X(q[0]), Y = D.Y(q[1]); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); }
    function ciz() {
      if (!t.boyutla()) return;
      var R = renkler(), D = Duzlem(t, DX, DY, { l: 26, r: 8, t: 8, b: 20 }), c = t.x, F = H.EGIM[S.k].F;
      eksenCiz(t, D, R, { xAdim: 1, yAdim: 1 });
      var bx = (D.X(1) - D.X(0)) * 0.36;
      c.save(); c.strokeStyle = R.soluk; c.lineWidth = 1.4; c.lineCap = "round";
      for (var i = -6; i <= 6; i++) for (var j = -6; j <= 6; j++) {
        var x = i / 2, y = j / 2, m = F(x, y), px = D.X(x), py = D.Y(y);
        var ux, uy;
        if (!isFinite(m)) { ux = 0; uy = 1; } else { var L = Math.hypot(1, m); ux = 1 / L; uy = m / L; }
        var s = bx * 0.5;
        c.beginPath(); c.moveTo(px - ux * s, py + uy * s); c.lineTo(px + ux * s, py - uy * s); c.stroke();
      }
      c.restore();
      c.save(); c.lineCap = "round"; c.lineJoin = "round";
      S.egriler.forEach(function (q, idx) {
        var son = idx === S.egriler.length - 1;
        c.strokeStyle = son ? R.vurgu : seffaf(R.vurgu, 0.55); c.lineWidth = son ? 2.25 : 1.6;
        yol(c, D, cozum(F, q[0], q[1], 1)); yol(c, D, cozum(F, q[0], q[1], -1));
      });
      c.restore();
      if (S.egriler.length) {
        var q = S.egriler[S.egriler.length - 1], n = Math.round(1 / S.h), e = H.euler(F, q[0], q[1], S.h, n);
        c.save(); c.strokeStyle = R.ikinci; c.lineWidth = 2.25; yol(c, D, e); c.restore();
        e.forEach(function (p) { if (p[1] >= DY[0] && p[1] <= DY[1]) nokta(c, D.X(p[0]), D.Y(p[1]), 3.5, R.ikinci, R.yuzey); });
        nokta(c, D.X(q[0]), D.Y(q[1]), 5.5, R.vurgu, R.yuzey);
        var ince = cozum(F, q[0], q[1], 1), hedef = q[0] + 1, yc = null;
        for (var z = 1; z < ince.length; z++) if (ince[z][0] >= hedef - 1e-9) { var a0 = ince[z - 1], a1 = ince[z]; yc = a0[1] + (a1[1] - a0[1]) * (hedef - a0[0]) / (a1[0] - a0[0]); break; }
        var ye = e[e.length - 1][1];
        o.e.textContent = sayi(ye, 4); o.c.textContent = yc == null ? "pencere dışı" : sayi(yc, 4); o.f.textContent = yc == null ? "—" : sayi(ye - yc, 4);
        duy("(" + sayi(q[0], 2) + ", " + sayi(q[1], 2) + ") noktasından: Euler h = " + S.h + " ile " + n + " adımda y(" + sayi(hedef, 2) + ") ≈ " + sayi(ye, 3) + (yc == null ? "." : "; çözüm eğrisi " + sayi(yc, 3) + "."));
      } else { o.e.textContent = o.c.textContent = o.f.textContent = "—"; duy("Başlangıç noktası bırakmak için tuvale tıkla ya da düğmeyi kullan."); }
    }
    return { ciz: ciz, t: [t] };
  };

  // (C6) Taylor polinomu
  W.taylor = function (host) {
    kabuk(host, "Taylor (Maclaurin) polinomu", "Derece n arttıkça Pₙ(x), x = 0 çevresinde fonksiyonu giderek daha geniş bir aralıkta izler.", "BC · Etkileşimli");
    var S = { k: "sin", n: 3 };
    var t = Tuval(host, "16 / 9", "Fonksiyon ve seçili dereceden Maclaurin polinomu");
    var R0 = renkler();
    var lj = lejant(host, [[R0.metin, "f(x)"], [R0.vurgu, "Pₙ(x)"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    secici(k, { etiket: "Fonksiyon", deger: S.k, secenekler: Object.keys(H.TAYLOR).map(function (a) { return [a, H.TAYLOR[a].ad]; }), degisti: function (v) { S.k = v; ciz(); } });
    kaydirici(k, { etiket: "Derece n", min: 0, max: 13, adim: 1, deger: S.n, bicim: function (v) { return "n = " + v; }, degisti: function (v) { S.n = v; ciz(); } });
    var o = okumalar(host, [["p", "Pₙ(1)"], ["f", "f(1)"], ["e", "|hata| x = 1"], ["e2", "|hata| x = 2"]]);
    var son = sonucBolge(host), duy = canli(son);
    function ciz() {
      if (!t.boyutla()) return;
      var R = renkler(), T = H.TAYLOR[S.k], D = Duzlem(t, T.x, T.y), n = S.n;
      lj.children[1].querySelector("i").style.color = R.vurgu;
      eksenCiz(t, D, R);
      egriCiz(t, D, T.f, R.metin, { kalin: 2.25 });
      egriCiz(t, D, function (x) { return H.taylor(S.k, n, x); }, R.vurgu, { kalin: 2 });
      var p1 = H.taylor(S.k, n, 1), f1 = T.f(1), p2 = H.taylor(S.k, n, 2), f2 = T.f(2);
      o.p.textContent = sayi(p1, 6); o.f.textContent = sayi(f1, 6); o.e.textContent = Math.abs(p1 - f1).toExponential(2); o.e2.textContent = Math.abs(p2 - f2).toExponential(2);
      duy(T.ad + ", n = " + n + ": Pₙ(1) = " + sayi(p1, 6) + ", f(1) = " + sayi(f1, 6) + "; x = 1'de hata " + Math.abs(p1 - f1).toExponential(1) + ", x = 2'de " + Math.abs(p2 - f2).toExponential(1) + ". Merkezden uzaklaştıkça hata büyür.");
    }
    return { ciz: ciz, t: [t] };
  };

  // (P1) Eğik atış
  W.atis = function (host) {
    kabuk(host, "Eğik atış laboratuvarı", "Açı ve hızı değiştir; yörüngeyi, menzili ve tepe yüksekliğini izle. Zaman kaydırıcısı ya da “Fırlat” düğmesi topu hareket ettirir: vₓ hep aynı kalır, vᵧ düzgün azalır. (g = 9.8 m/s², hava direnci yok, düz zemin)");
    var S = { ac: 45, v: 20, f: 0.35, eski: null, oyn: false };
    var t = Tuval(host, "16 / 9", "Yörünge, top ve hız vektörleri");
    var R0 = renkler();
    var lj = lejant(host, [[R0.metin, "yörünge"], [R0.soluk, "önceki yörünge", "emf-kesik"], [R0.vurgu, "vₓ"], [R0.ikinci, "vᵧ"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    function sakla() { S.eski = { ac: S.ac, v: S.v }; }
    kaydirici(k, { etiket: "Atış açısı θ", min: 5, max: 85, adim: 1, deger: S.ac, bicim: function (v) { return v + "°"; }, degisti: function (v) { S.ac = v; ciz(); } });
    kaydirici(k, { etiket: "İlk hız v₀", min: 5, max: 30, adim: 0.5, deger: S.v, bicim: function (v) { return sayi(v, 1) + " m/s"; }, degisti: function (v) { S.v = v; ciz(); } });
    var kt = kaydirici(k, { etiket: "Uçuş anı (t / T)", min: 0, max: 1, adim: 0.01, deger: S.f, bicim: function (v) { return "%" + Math.round(v * 100); }, degisti: function (v) { S.f = v; dur(); ciz(); } });
    [0, 1].forEach(function (i) { var g = k.querySelectorAll("input")[i]; g.addEventListener("pointerdown", sakla); g.addEventListener("focus", sakla); });
    var ey = el("div", "emf-eylemler"); host.appendChild(ey);
    var bF = dugme(ey, "Fırlat", function () { if (S.oyn) { dur(); return; } if (HAREKETSIZ) { S.f = 1; kt.ver(1); ciz(); return; } S.f = 0; S.oyn = true; bF.textContent = "Durdur"; var t0 = null, T = H.atis(S.v, S.ac).T;
      function adim(z) { if (!S.oyn) return; if (t0 == null) t0 = z; S.f = Math.min(1, (z - t0) / 1000 / T * 1.5); kt.ver(S.f); ciz(); if (S.f < 1) requestAnimationFrame(adim); else dur(); } requestAnimationFrame(adim); });
    function dur() { S.oyn = false; bF.textContent = "Fırlat"; }
    var o = okumalar(host, [["R", "Menzil R"], ["H", "Tepe yüksekliği H"], ["T", "Uçuş süresi T"], ["vx", "vₓ"], ["vy", "vᵧ (o an)"]]);
    var son = sonucBolge(host), duy = canli(son);
    function ciz() {
      if (!t.boyutla()) return;
      var R = renkler(), D = Duzlem(t, [0, 95], [0, 48], { l: 34, r: 12, t: 10, b: 22 }), c = t.x, A = H.atis(S.v, S.ac);
      lj.children[2].querySelector("i").style.color = R.vurgu; lj.children[3].querySelector("i").style.color = R.ikinci;
      eksenCiz(t, D, R, { xAdim: 10, yAdim: 10 });
      c.save(); c.font = "11px " + R.font; c.fillStyle = R.sonuk; c.textAlign = "right"; c.textBaseline = "bottom"; c.fillText("x (m)", t.w - 14, t.h - 24); c.textAlign = "left"; c.textBaseline = "top"; c.fillText("y (m)", 38, 12); c.restore();
      function yorunge(v, ac, renk, kesik) {
        var B = H.atis(v, ac); c.save(); c.strokeStyle = renk; c.lineWidth = kesik ? 1.5 : 2.25; if (kesik) c.setLineDash([5, 5]);
        c.beginPath(); for (var i = 0; i <= 120; i++) { var q = H.atisKonum(v, ac, B.T * i / 120); i ? c.lineTo(D.X(q.x), D.Y(Math.max(0, q.y))) : c.moveTo(D.X(q.x), D.Y(q.y)); } c.stroke(); c.restore();
      }
      if (S.eski && (S.eski.ac !== S.ac || S.eski.v !== S.v)) yorunge(S.eski.v, S.eski.ac, R.soluk, true);
      yorunge(S.v, S.ac, R.metin, false);
      // tepe ve menzil işaretleri
      c.save(); c.setLineDash([2, 4]); c.strokeStyle = R.soluk; c.beginPath(); c.moveTo(D.X(A.R / 2), D.Y(A.H)); c.lineTo(D.X(A.R / 2), D.Y(0)); c.stroke(); c.restore();
      var q = H.atisKonum(S.v, S.ac, A.T * S.f), px = D.X(q.x), py = D.Y(Math.max(0, q.y)), olc = 2.2;
      ok(c, px, py, px + q.vx * olc, py, R.vurgu, 2.5, "vₓ", R, [0, -10]);
      ok(c, px, py, px, py - q.vy * olc, R.ikinci, 2.5, "vᵧ", R, [16, 0]);
      nokta(c, px, py, 7, R.metin, R.yuzey);
      o.R.textContent = sayi(A.R, 1) + " m"; o.H.textContent = sayi(A.H, 1) + " m"; o.T.textContent = sayi(A.T, 2) + " s"; o.vx.textContent = sayi(q.vx, 1) + " m/s"; o.vy.textContent = sayi(q.vy, 1) + " m/s";
      if (!S.oyn) duy("θ = " + S.ac + "°, v₀ = " + sayi(S.v, 1) + " m/s: menzil " + sayi(A.R, 1) + " m, tepe " + sayi(A.H, 1) + " m, uçuş " + sayi(A.T, 2) + " s." + (S.ac === 45 ? " 45°'de menzil bu hız için en büyüktür." : " Tümler açı " + (90 - S.ac) + "° aynı menzili verir."));
    }
    return { ciz: ciz, t: [t], durdur: dur };
  };

  // (P2) Eğik düzlem serbest cisim diyagramı
  W.egik = function (host) {
    kabuk(host, "Serbest cisim diyagramı: eğik düzlemde blok", "Açıyı ve sürtünme katsayılarını değiştir. Oklar ölçeklidir (uzunluk ∝ büyüklük). Blok başta durgun: mg·sinθ ≤ μₛN ise statik sürtünme bloğu tutar, değilse kinetik sürtünmeyle kayar. m = 2.0 kg, g = 9.8 m/s²");
    var S = { ac: 25, muS: 0.5, muK: 0.3, bil: true };
    var t = Tuval(host, "4 / 3", "Eğik düzlem üzerinde blok ve ölçekli kuvvet okları");
    t.sar.style.maxWidth = "560px"; t.sar.style.marginInline = "auto";
    var R0 = renkler();
    var lj = lejant(host, [[R0.metin, "ağırlık mg"], [R0.vurgu, "normal N"], [R0.ikinci, "sürtünme f"], [R0.soluk, "mg bileşenleri", "emf-kesik"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    kaydirici(k, { etiket: "Eğim açısı θ", min: 0, max: 60, adim: 1, deger: S.ac, bicim: function (v) { return v + "°"; }, degisti: function (v) { S.ac = v; ciz(); } });
    var kS = kaydirici(k, { etiket: "Statik sürtünme μₛ", min: 0, max: 1, adim: 0.05, deger: S.muS, bicim: function (v) { return sayi(v, 2); }, degisti: function (v) { S.muS = v; if (S.muK > v) { S.muK = v; kK.ver(v); } ciz(); } });
    var kK = kaydirici(k, { etiket: "Kinetik sürtünme μₖ (≤ μₛ)", min: 0, max: 1, adim: 0.05, deger: S.muK, bicim: function (v) { return sayi(v, 2); }, degisti: function (v) { if (v > S.muS) { v = S.muS; kK.ver(v); } S.muK = v; ciz(); } });
    anahtarlar(k, { etiket: "Ağırlık bileşenleri", deger: "evet", secenekler: [["evet", "Göster"], ["hayir", "Gizle"]], degisti: function (v) { S.bil = v === "evet"; ciz(); } });
    var o = okumalar(host, [["N", "Normal N"], ["f", "Sürtünme f"], ["F", "Net kuvvet"], ["a", "İvme a"], ["d", "Durum"]]);
    var son = sonucBolge(host), duy = canli(son);
    function ciz() {
      if (!t.boyutla()) return;
      var R = renkler(), c = t.x, r = H.egik(2, S.ac, S.muS, S.muK), th = S.ac * Math.PI / 180;
      lj.children[1].querySelector("i").style.color = R.vurgu; lj.children[2].querySelector("i").style.color = R.ikinci;
      c.clearRect(0, 0, t.w, t.h);
      var x0 = t.w * 0.06, y0 = t.h * 0.9, taban = t.w * 0.88, yuk = Math.min(taban * Math.tan(th), t.h * 0.8), bx = yuk / Math.max(Math.tan(th), 1e-6);
      if (S.ac === 0) bx = taban;
      c.save(); c.fillStyle = R.cizgi; c.strokeStyle = R.cizgi2; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + bx, y0); c.lineTo(x0 + bx, y0 - yuk); c.closePath(); c.fill(); c.stroke(); c.restore();
      if (S.ac > 0) { c.save(); c.strokeStyle = R.soluk; c.beginPath(); c.arc(x0, y0, 30, -th, 0); c.stroke(); c.font = "12px " + R.font; c.fillStyle = R.metin; c.fillText("θ", x0 + 36, y0 - 6); c.restore(); }
      // blok: eğimin ortasında, yüzeye oturur
      var ux = Math.cos(th), uy = -Math.sin(th), nx = Math.sin(th), ny = Math.cos(th) * -1; // yukarı eğim yönü (ux,uy); yüzey normali (nx,-ny)
      nx = -Math.sin(th); ny = -Math.cos(th);
      var mx = x0 + bx * 0.55, my = y0 - yuk * 0.55, bs = Math.min(t.w, t.h) * 0.13;
      var cx = mx + nx * bs / 2, cy = my + ny * bs / 2;
      c.save(); c.translate(cx, cy); c.rotate(-th); c.fillStyle = R.yuzey; c.strokeStyle = R.metin; c.lineWidth = 2; c.beginPath(); c.rect(-bs / 2, -bs / 2, bs, bs); c.fill(); c.stroke();
      c.font = "600 12px " + R.font; c.fillStyle = R.metin; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("2 kg", 0, 0); c.restore();
      var olc = (t.h * 0.32) / r.W; // mg okunun uzunluğu yüksekliğin %32'si
      if (S.bil && S.ac > 0) {
        c.save(); c.setLineDash([4, 4]);
        ok(c, cx, cy, cx - ux * r.Wpar * olc, cy - uy * r.Wpar * olc, R.soluk, 1.5, "mg sinθ", R, [0, 12]);
        ok(c, cx, cy, cx - nx * r.Wdik * olc, cy - ny * r.Wdik * olc, R.soluk, 1.5, "mg cosθ", R, [26, 0]);
        c.restore();
      }
      ok(c, cx, cy, cx, cy + r.W * olc, R.metin, 2.75, "mg", R);
      ok(c, cx, cy, cx + nx * r.N * olc, cy + ny * r.N * olc, R.vurgu, 2.75, "N", R);
      if (r.f > 0.01) { var fx = mx, fy = my; ok(c, fx, fy, fx + ux * r.f * olc, fy + uy * r.f * olc, R.ikinci, 2.75, r.durgun ? "fₛ" : "fₖ", R, [0, -8]); }
      o.N.textContent = sayi(r.N, 1) + " N"; o.f.textContent = sayi(r.f, 1) + " N"; o.F.textContent = sayi(r.net, 1) + " N"; o.a.textContent = sayi(r.a, 2) + " m/s²"; o.d.textContent = r.durgun ? "durgun" : "kayıyor";
      duy("θ = " + S.ac + "°: N = " + sayi(r.N, 1) + " N, mg sinθ = " + sayi(r.Wpar, 1) + " N, en büyük statik sürtünme μₛN = " + sayi(r.fMax, 1) + " N. " + (r.durgun ? "Blok durgun: fₛ = mg sinθ, net kuvvet 0." : "Blok kayıyor: fₖ = μₖN = " + sayi(r.f, 1) + " N, a = g(sinθ − μₖcosθ) = " + sayi(r.a, 2) + " m/s² eğim boyunca aşağı."));
    }
    return { ciz: ciz, t: [t] };
  };

  // (P3) Enerji çubuk grafiği (rampa + sürtünmeli zemin)
  W.enerji = function (host) {
    kabuk(host, "Enerji çubuk grafiği (LOL)", "Blok 2.0 m yükseklikten 35°'lik rampadan durgun bırakılıyor, sonra yatay zemine geçiyor. Sürtünme katsayısı tüm yolda μₖ. Konum kaydırıcısıyla bloğu ilerlet: Ug → K dönüşümünü ve sürtünmenin ürettiği ısıl enerjiyi izle. Toplam sabit kalır. (m = 1.0 kg)");
    var S = { mu: 0.2, s: 1.5 };
    var t = Tuval(host, "16 / 5", "Rampa, zemin ve blok");
    var t2 = Tuval(host, "16 / 7", "Kinetik, kütle çekim potansiyel, ısıl ve toplam enerji çubukları");
    var R0 = renkler();
    var lj = lejant(host, [[R0.vurgu, "K", "emf-alan"], [R0.ucuncu, "Ug", "emf-alan"], [R0.ikinci, "E_ısıl", "emf-alan"], [R0.soluk, "Toplam", "emf-alan"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    var ks;
    kaydirici(k, { etiket: "Sürtünme katsayısı μₖ", min: 0, max: 0.6, adim: 0.05, deger: S.mu, bicim: function (v) { return sayi(v, 2); }, degisti: function (v) { S.mu = v; ciz(); } });
    ks = kaydirici(k, { etiket: "Alınan yol s (rampa boyunca, sonra zeminde)", min: 0, max: 9.5, adim: 0.05, deger: S.s, bicim: function (v) { return sayi(v, 2) + " m"; }, degisti: function (v) { S.s = v; ciz(); } });
    var o = okumalar(host, [["K", "K"], ["U", "Ug"], ["T", "E_ısıl"], ["v", "Sürat v"]]);
    var son = sonucBolge(host), duy = canli(son);
    var HH = 2, AC = 35, ZEMIN = 6;
    function ciz() {
      if (!t.boyutla() || !t2.boyutla()) return;
      var R = renkler(), r = H.rampa(1, HH, AC, S.mu, S.s), c = t.x, th = AC * Math.PI / 180;
      var renkK = R.vurgu, renkU = R.ucuncu, renkT = R.ikinci;
      [renkK, renkU, renkT, R.soluk].forEach(function (rk, i) { lj.children[i].querySelector("i").style.color = rk; });
      var sMax = Math.min(r.sDur, r.L + ZEMIN); if (S.s > sMax) { S.s = Math.floor(sMax * 20) / 20; ks.ver(S.s); } r = H.rampa(1, HH, AC, S.mu, S.s);
      c.clearRect(0, 0, t.w, t.h);
      var gx = r.L * Math.cos(th) + ZEMIN, olc = Math.min((t.w - 30) / gx, (t.h - 30) / HH), x0 = 15, y0 = t.h - 14;
      c.save(); c.fillStyle = R.cizgi; c.strokeStyle = R.cizgi2; c.lineWidth = 1.5; c.beginPath();
      c.moveTo(x0, y0 - HH * olc); c.lineTo(x0 + r.L * Math.cos(th) * olc, y0); c.lineTo(x0 + gx * olc, y0); c.lineTo(x0 + gx * olc, y0 + 10); c.lineTo(x0, y0 + 10); c.closePath(); c.fill(); c.stroke(); c.restore();
      if (isFinite(r.sDur) && r.sDur < r.L + ZEMIN) { var dX = x0 + (r.L * Math.cos(th) + (r.sDur - r.L)) * olc; c.save(); c.setLineDash([3, 3]); c.strokeStyle = R.ikinci; c.beginPath(); c.moveTo(dX, y0 - 30); c.lineTo(dX, y0); c.stroke(); c.font = "11px " + R.font; c.textAlign = "center"; yazi(c, "durma", dX, y0 - 36, R); c.restore(); }
      var px, py, ang;
      if (r.s <= r.L) { px = x0 + r.s * Math.cos(th) * olc; py = y0 - (HH - r.s * Math.sin(th)) * olc; ang = th; } else { px = x0 + (r.L * Math.cos(th) + r.s - r.L) * olc; py = y0; ang = 0; }
      var bs = 18;
      c.save(); c.translate(px, py); c.rotate(ang); c.fillStyle = R.yuzey; c.strokeStyle = R.metin; c.lineWidth = 2; c.beginPath(); c.rect(-bs / 2, -bs, bs, bs); c.fill(); c.stroke(); c.restore();
      // Çubuklar
      var c2 = t2.x; c2.clearRect(0, 0, t2.w, t2.h);
      var veri = [["K", r.K, renkK], ["Ug", r.Ug, renkU], ["E_ısıl", r.Eth, renkT], ["Toplam", r.E, R.soluk]];
      var ust = 12, alt = 26, en = t2.w / veri.length, maxE = r.E * 1.05;
      c2.save(); c2.strokeStyle = R.cizgi2; c2.beginPath(); c2.moveTo(8, t2.h - alt + 0.5); c2.lineTo(t2.w - 8, t2.h - alt + 0.5); c2.stroke(); c2.restore();
      veri.forEach(function (d, i) {
        var bw = Math.min(56, en * 0.5), bx = en * i + (en - bw) / 2, bh = (t2.h - ust - alt) * d[1] / maxE, by = t2.h - alt - bh;
        c2.save(); c2.fillStyle = d[2]; c2.beginPath();
        if (c2.roundRect) c2.roundRect(bx, by, bw, bh, [4, 4, 0, 0]); else c2.rect(bx, by, bw, bh);
        c2.fill(); c2.font = "600 12px " + R.font; c2.textAlign = "center"; c2.fillStyle = R.metin; c2.textBaseline = "top";
        c2.fillText(d[0], bx + bw / 2, t2.h - alt + 6); c2.textBaseline = "bottom"; c2.fillText(sayi(d[1], 1) + " J", bx + bw / 2, Math.max(ust + 12, by - 3)); c2.restore();
      });
      o.K.textContent = sayi(r.K, 2) + " J"; o.U.textContent = sayi(r.Ug, 2) + " J"; o.T.textContent = sayi(r.Eth, 2) + " J"; o.v.textContent = sayi(r.v, 2) + " m/s";
      var yer = r.s <= r.L ? "rampada" : "zeminde";
      duy("s = " + sayi(r.s, 2) + " m (" + yer + "): K = " + sayi(r.K, 1) + " J, Ug = " + sayi(r.Ug, 1) + " J, E_ısıl = " + sayi(r.Eth, 1) + " J; toplam " + sayi(r.E, 1) + " J sabit." + (isFinite(r.sDur) && r.s >= r.sDur - 1e-6 ? " Blok durdu: tüm mekanik enerji ısıl enerjiye dönüştü." : ""));
    }
    return { ciz: ciz, t: [t, t2] };
  };

  // (P4) Momentum: çarpışma
  W.carpisma = function (host) {
    kabuk(host, "Çarpışma: momentum korunumu", "İki arabanın kütle ve hızlarını seç (sağa +). Esnek çarpışmada kinetik enerji de korunur; yapışan (tam esnek olmayan) çarpışmada arabalar birlikte hareket eder ve K azalır. Her iki durumda toplam momentum aynı kalır.");
    var S = { m1: 2, v1: 3, m2: 1, v2: -1, tur: "esnek" };
    var t = Tuval(host, "16 / 8", "Çarpışmadan önce ve sonra iki araba ve hız okları");
    var t2 = Tuval(host, "16 / 6", "Toplam momentum ve kinetik enerji: önce ve sonra çubukları");
    var R0 = renkler();
    var lj = lejant(host, [[R0.vurgu, "Araba 1", "emf-alan"], [R0.ikinci, "Araba 2", "emf-alan"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    kaydirici(k, { etiket: "m₁", min: 0.5, max: 5, adim: 0.5, deger: S.m1, bicim: function (v) { return sayi(v, 1) + " kg"; }, degisti: function (v) { S.m1 = v; ciz(); } });
    kaydirici(k, { etiket: "v₁", min: -5, max: 5, adim: 0.5, deger: S.v1, bicim: function (v) { return sayi(v, 1) + " m/s"; }, degisti: function (v) { S.v1 = v; ciz(); } });
    kaydirici(k, { etiket: "m₂", min: 0.5, max: 5, adim: 0.5, deger: S.m2, bicim: function (v) { return sayi(v, 1) + " kg"; }, degisti: function (v) { S.m2 = v; ciz(); } });
    kaydirici(k, { etiket: "v₂", min: -5, max: 5, adim: 0.5, deger: S.v2, bicim: function (v) { return sayi(v, 1) + " m/s"; }, degisti: function (v) { S.v2 = v; ciz(); } });
    anahtarlar(k, { etiket: "Çarpışma türü", deger: S.tur, secenekler: [["esnek", "Esnek"], ["yapiskan", "Yapışan"]], degisti: function (v) { S.tur = v; ciz(); } });
    var o = okumalar(host, [["u1", "v₁′"], ["u2", "v₂′"], ["p", "p önce → sonra"], ["K", "K önce → sonra"]]);
    var son = sonucBolge(host), duy = canli(son);
    function araba(c, x, y, m, renk, R, ad) {
      var w = 34 + 10 * Math.sqrt(m) * 2, h = 26;
      c.save(); c.fillStyle = renk; c.beginPath(); if (c.roundRect) c.roundRect(x - w / 2, y - h, w, h, 5); else c.rect(x - w / 2, y - h, w, h); c.fill();
      c.fillStyle = R.yuzey; c.beginPath(); c.arc(x - w / 3, y + 2, 5, 0, 7); c.arc(x + w / 3, y + 2, 5, 0, 7); c.fill(); c.strokeStyle = R.metin; c.lineWidth = 1.5; c.beginPath(); c.arc(x - w / 3, y + 2, 5, 0, 7); c.stroke(); c.beginPath(); c.arc(x + w / 3, y + 2, 5, 0, 7); c.stroke();
      c.font = "600 11px " + R.font; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = R.yuzey; c.fillText(ad, x, y - h / 2); c.restore();
      return w;
    }
    function ciz() {
      if (!t.boyutla() || !t2.boyutla()) return;
      var R = renkler(), r = H.carpisma(S.m1, S.v1, S.m2, S.v2, S.tur), c = t.x, olc = t.w * 0.045;
      lj.children[0].querySelector("i").style.color = R.vurgu; lj.children[1].querySelector("i").style.color = R.ikinci;
      c.clearRect(0, 0, t.w, t.h);
      [["Önce", S.v1, S.v2, 0.42], ["Sonra", r.u1, r.u2, 0.88]].forEach(function (sat, i) {
        var y = t.h * sat[3];
        c.save(); c.strokeStyle = R.cizgi2; c.lineWidth = 1.5; c.beginPath(); c.moveTo(10, y + 8); c.lineTo(t.w - 10, y + 8); c.stroke();
        c.font = "600 12px " + R.font; c.fillStyle = R.soluk; c.textBaseline = "bottom"; c.fillText(sat[0], 12, y - 38); c.restore();
        var yap = i === 1 && S.tur === "yapiskan" && r.yaklasiyor;
        var x1 = t.w * (i === 0 ? 0.3 : 0.44), x2 = t.w * (i === 0 ? 0.7 : 0.56);
        var w1 = 34 + 20 * Math.sqrt(S.m1), w2 = 34 + 20 * Math.sqrt(S.m2);
        if (yap) { x1 = t.w / 2 - w1 / 2; x2 = t.w / 2 + w2 / 2; }
        else if (i === 1) { x1 = t.w / 2 - w1 / 2 - 14; x2 = t.w / 2 + w2 / 2 + 14; }
        araba(c, x1, y, S.m1, R.vurgu, R, "1"); araba(c, x2, y, S.m2, R.ikinci, R, "2");
        var yy = y - 34;
        if (Math.abs(sat[1]) > 0.01) ok(c, x1, yy, x1 + sat[1] * olc, yy, R.vurgu, 2.5, sayi(sat[1], 2), R, [0, -10]);
        if (Math.abs(sat[2]) > 0.01 && !yap) ok(c, x2, yy, x2 + sat[2] * olc, yy, R.ikinci, 2.5, sayi(sat[2], 2), R, [0, -10]);
      });
      // Çubuklar: p ve K önce/sonra (aynı ölçekte değil; iki ayrı küçük grafik)
      var c2 = t2.x; c2.clearRect(0, 0, t2.w, t2.h);
      function grup(x0, gen, ad, a, b, birim) {
        var mx = Math.max(Math.abs(a), Math.abs(b), 1e-6), orta = t2.h * (a < 0 || b < 0 ? 0.55 : 0.8), yuk = t2.h * (a < 0 || b < 0 ? 0.3 : 0.6);
        c2.save(); c2.font = "600 12px " + R.font; c2.fillStyle = R.metin; c2.textAlign = "center"; c2.textBaseline = "top"; c2.fillText(ad, x0 + gen / 2, 4);
        c2.strokeStyle = R.cizgi2; c2.beginPath(); c2.moveTo(x0 + 6, orta + 0.5); c2.lineTo(x0 + gen - 6, orta + 0.5); c2.stroke();
        [["önce", a], ["sonra", b]].forEach(function (d, i) {
          var bw = Math.min(46, gen * 0.28), bx = x0 + gen * (i ? 0.62 : 0.38) - bw / 2, bh = yuk * Math.abs(d[1]) / mx, by = d[1] >= 0 ? orta - bh : orta;
          c2.fillStyle = i ? R.soluk : R.metin; c2.globalAlpha = i ? 0.9 : 0.75; c2.fillRect(bx, by, bw, bh); c2.globalAlpha = 1;
          c2.fillStyle = R.metin; c2.font = "11px " + R.font; c2.textBaseline = d[1] >= 0 ? "bottom" : "top";
          c2.fillText(sayi(d[1], 1) + " " + birim, bx + bw / 2, d[1] >= 0 ? by - 2 : by + bh + 2);
          c2.textBaseline = "top"; c2.fillStyle = R.soluk; c2.fillText(d[0], bx + bw / 2, t2.h - 14);
        });
        c2.restore();
      }
      grup(0, t2.w / 2, "Toplam momentum p", r.pOnce, r.pSonra, "kg·m/s");
      grup(t2.w / 2, t2.w / 2, "Toplam kinetik enerji K", r.KOnce, r.KSonra, "J");
      o.u1.textContent = sayi(r.u1, 2) + " m/s"; o.u2.textContent = sayi(r.u2, 2) + " m/s"; o.p.textContent = sayi(r.pOnce, 1) + " → " + sayi(r.pSonra, 1); o.K.textContent = sayi(r.KOnce, 1) + " → " + sayi(r.KSonra, 1);
      var m = !r.yaklasiyor ? "Arabalar birbirine yaklaşmıyor (v₁ ≤ v₂): çarpışma olmaz, hızlar değişmez." :
        (S.tur === "esnek" ? "Esnek: v₁′ = " + sayi(r.u1, 2) + ", v₂′ = " + sayi(r.u2, 2) + " m/s. p ve K korundu." :
          "Yapışan: ortak hız " + sayi(r.u1, 2) + " m/s. p korundu; K " + sayi(r.KOnce - r.KSonra, 1) + " J azaldı (ısı, ses, şekil değişimi).");
      duy(m + " Toplam momentum " + sayi(r.pOnce, 1) + " kg·m/s.");
    }
    return { ciz: ciz, t: [t, t2] };
  };

  // (P5) Basit harmonik hareket
  W.bhh = function (host) {
    kabuk(host, "Basit harmonik hareket: x, v, a eş zamanlı", "Yay–blok sistemi t = 0'da x = +A'dan durgun bırakılır: x = A cos(ωt). Oynat ya da zaman kaydırıcısını sürükle. Üç grafikteki dikey çizgi aynı anı gösterir: x en büyükken v = 0 ve a en büyük (zıt yönde).");
    var S = { A: 0.15, k: 50, m: 0.5, t: 0, oyn: false };
    var t = Tuval(host, "16 / 4", "Yatay yaya bağlı blok");
    var t2 = Tuval(host, "16 / 11", "Konum, hız ve ivmenin zamana göre grafikleri; şimdiki an imleci");
    var R0 = renkler();
    var lj = lejant(host, [[R0.vurgu, "x(t)"], [R0.ikinci, "v(t)"], [R0.ucuncu, "a(t)"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    kaydirici(k, { etiket: "Genlik A", min: 0.05, max: 0.2, adim: 0.01, deger: S.A, bicim: function (v) { return sayi(v, 2) + " m"; }, degisti: function (v) { S.A = v; ciz(); } });
    kaydirici(k, { etiket: "Yay sabiti k", min: 10, max: 200, adim: 5, deger: S.k, bicim: function (v) { return v + " N/m"; }, degisti: function (v) { S.k = v; ciz(); } });
    kaydirici(k, { etiket: "Kütle m", min: 0.2, max: 2, adim: 0.1, deger: S.m, bicim: function (v) { return sayi(v, 1) + " kg"; }, degisti: function (v) { S.m = v; ciz(); } });
    var kt = kaydirici(k, { etiket: "Zaman t (periyodun kesri)", min: 0, max: 2, adim: 0.01, deger: 0, bicim: function (v) { return sayi(v, 2) + " T"; }, degisti: function (v) { dur(); S.t = v; ciz(); } });
    var ey = el("div", "emf-eylemler"); host.appendChild(ey);
    var bO = dugme(ey, "Oynat", function () { if (S.oyn) { dur(); return; } S.oyn = true; bO.textContent = "Duraklat"; var once = null;
      function adim(z) { if (!S.oyn) return; if (once != null) { S.t = (S.t + (z - once) / 1000 / H.bhh(S.A, S.k, S.m, 0).T) % 2; kt.ver(Math.round(S.t * 100) / 100); ciz(); } once = z; requestAnimationFrame(adim); } requestAnimationFrame(adim); });
    function dur() { S.oyn = false; bO.textContent = "Oynat"; }
    var o = okumalar(host, [["T", "Periyot T"], ["x", "x"], ["v", "v"], ["a", "a"], ["vm", "vₘₐₓ = Aω"]]);
    var son = sonucBolge(host), duy = canli(son);
    function ciz() {
      if (!t.boyutla() || !t2.boyutla()) return;
      var R = renkler(), B0 = H.bhh(S.A, S.k, S.m, 0), tt = S.t * B0.T, B = H.bhh(S.A, S.k, S.m, tt), c = t.x;
      [R.vurgu, R.ikinci, R.ucuncu].forEach(function (rk, i) { lj.children[i].querySelector("i").style.color = rk; });
      c.clearRect(0, 0, t.w, t.h);
      var duvar = 14, denge = t.w * 0.55, olc = (t.w * 0.3) / 0.2, bx = denge + B.x * olc, yy = t.h * 0.55, bs = Math.min(t.h * 0.5, 40);
      c.save(); c.fillStyle = R.cizgi2; c.fillRect(0, 6, duvar, t.h - 12); c.strokeStyle = R.cizgi2; c.beginPath(); c.moveTo(0, t.h - 6.5); c.lineTo(t.w, t.h - 6.5); c.stroke();
      c.strokeStyle = R.metin; c.lineWidth = 1.5; c.beginPath(); c.moveTo(duvar, yy); var bob = 14, uz = bx - bs / 2 - duvar;
      for (var i = 0; i <= bob; i++) { var px = duvar + uz * i / bob; c.lineTo(px, yy + (i === 0 || i === bob ? 0 : (i % 2 ? -8 : 8))); } c.stroke();
      c.setLineDash([3, 4]); c.strokeStyle = R.soluk; c.lineWidth = 1; c.beginPath(); c.moveTo(denge, 4); c.lineTo(denge, t.h - 8); c.stroke(); c.setLineDash([]);
      c.fillStyle = R.yuzey; c.strokeStyle = R.metin; c.lineWidth = 2; c.beginPath(); c.rect(bx - bs / 2, yy - bs / 2, bs, bs); c.fill(); c.stroke();
      c.font = "11px " + R.font; c.fillStyle = R.soluk; c.textAlign = "center"; c.fillText("x = 0", denge, 12); c.restore();
      // grafikler
      var c2 = t2.x; c2.clearRect(0, 0, t2.w, t2.h);
      var satir = [["x (m)", function (q) { return q.x; }, null, S.A, R.vurgu], ["v (m/s)", function (q) { return q.v; }, null, B0.vMax, R.ikinci], ["a (m/s²)", function (q) { return q.a; }, null, B0.aMax, R.ucuncu]];
      var hh = t2.h / 3, l = 44, rr = 10;
      satir.forEach(function (s, i) {
        var y0 = hh * i + hh / 2, yk = hh * 0.36;
        c2.save(); c2.strokeStyle = R.cizgi; c2.beginPath(); c2.moveTo(l, y0 + 0.5); c2.lineTo(t2.w - rr, y0 + 0.5); c2.stroke();
        c2.font = "600 11px " + R.font; c2.fillStyle = R.metin; c2.textAlign = "left"; c2.textBaseline = "top"; c2.fillText(s[0], 4, hh * i + 4);
        c2.font = "10px " + R.font; c2.fillStyle = R.sonuk; c2.textAlign = "right"; c2.textBaseline = "middle"; c2.fillText("+" + sayi(s[3], 2), l - 4, y0 - yk); c2.fillText("−" + sayi(s[3], 2), l - 4, y0 + yk);
        c2.strokeStyle = s[4]; c2.lineWidth = 2; c2.beginPath();
        for (var j = 0; j <= 240; j++) { var tj = 2 * B0.T * j / 240, q = H.bhh(S.A, S.k, S.m, tj), px = l + (t2.w - l - rr) * j / 240, py = y0 - yk * s[1](q) / s[3]; j ? c2.lineTo(px, py) : c2.moveTo(px, py); }
        c2.stroke();
        var cx = l + (t2.w - l - rr) * S.t / 2; c2.fillStyle = s[4]; c2.beginPath(); c2.arc(cx, y0 - yk * s[1](B) / s[3], 4.5, 0, 7); c2.fill(); c2.restore();
      });
      var cx = l + (t2.w - l - rr) * S.t / 2;
      c2.save(); c2.strokeStyle = R.metin; c2.globalAlpha = 0.55; c2.lineWidth = 1; c2.beginPath(); c2.moveTo(cx + 0.5, 0); c2.lineTo(cx + 0.5, t2.h); c2.stroke(); c2.restore();
      o.T.textContent = sayi(B0.T, 3) + " s"; o.x.textContent = sayi(B.x, 3) + " m"; o.v.textContent = sayi(B.v, 3) + " m/s"; o.a.textContent = sayi(B.a, 2) + " m/s²"; o.vm.textContent = sayi(B0.vMax, 3) + " m/s";
      if (!S.oyn) duy("T = 2π√(m/k) = " + sayi(B0.T, 3) + " s (genlikten bağımsız). t = " + sayi(S.t, 2) + "T: x = " + sayi(B.x, 3) + " m, v = " + sayi(B.v, 3) + " m/s, a = " + sayi(B.a, 2) + " m/s².");
    }
    return { ciz: ciz, t: [t, t2], durdur: dur };
  };

  // (P6a) Kaldırma kuvveti
  W.kaldirma = function (host) {
    kabuk(host, "Kaldırma kuvveti: yüzme ve batma", "Cismin yoğunluğunu ve sıvıyı değiştir. Yüzen cisimde batan hacim oranı ρ_cisim / ρ_sıvı; F_b = ρ_sıvı·V_batan·g ağırlığa eşittir. Batan cisimde F_b = ρ_sıvı·V·g ağırlıktan küçüktür ve fark tabandan gelen normal kuvvetle dengelenir. (Küp: V = 1.0 L, g = 9.8 m/s²)", "Unit 8 · Etkileşimli");
    var S = { rc: 600, rs: 1000 };
    var t = Tuval(host, "16 / 9", "Sıvı dolu kap ve içindeki küp");
    t.sar.style.maxWidth = "560px"; t.sar.style.marginInline = "auto";
    var R0 = renkler();
    var lj = lejant(host, [[R0.metin, "ağırlık W"], [R0.vurgu, "kaldırma F_b"], [R0.ikinci, "normal N (tabandan)"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    kaydirici(k, { etiket: "Cismin yoğunluğu ρ_cisim", min: 100, max: 2000, adim: 10, deger: S.rc, bicim: function (v) { return v + " kg/m³"; }, degisti: function (v) { S.rc = v; ciz(); } });
    secici(k, { etiket: "Sıvı", deger: "1000", secenekler: [["800", "Yağ (800 kg/m³)"], ["1000", "Su (1000 kg/m³)"], ["1025", "Deniz suyu (1025 kg/m³)"], ["1260", "Gliserin (1260 kg/m³)"]], degisti: function (v) { S.rs = +v; ciz(); } });
    var o = okumalar(host, [["W", "Ağırlık W"], ["F", "Kaldırma F_b"], ["o", "Batan oran"], ["N", "Normal N"]]);
    var son = sonucBolge(host), duy = canli(son);
    function ciz() {
      if (!t.boyutla()) return;
      var R = renkler(), r = H.kaldirma(S.rc, S.rs, 0.001), c = t.x;
      lj.children[1].querySelector("i").style.color = R.vurgu; lj.children[2].querySelector("i").style.color = R.ikinci;
      c.clearRect(0, 0, t.w, t.h);
      var kx = t.w * 0.2, kw = t.w * 0.6, ky = t.h * 0.12, kh = t.h * 0.8, yuzey = ky + kh * 0.38, bs = Math.min(kh * 0.3, kw * 0.25);
      c.save(); c.fillStyle = seffaf(R.ucuncu, 0.16); c.fillRect(kx, yuzey, kw, ky + kh - yuzey);
      c.strokeStyle = R.ucuncu; c.lineWidth = 1.5; c.beginPath(); c.moveTo(kx, yuzey); c.lineTo(kx + kw, yuzey); c.stroke();
      c.strokeStyle = R.metin; c.lineWidth = 2; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx, ky + kh); c.lineTo(kx + kw, ky + kh); c.lineTo(kx + kw, ky); c.stroke(); c.restore();
      var bx = kx + kw / 2 - bs / 2, by = r.yuzer ? yuzey - bs * (1 - r.oran) : ky + kh - bs;
      c.save(); c.fillStyle = R.yuzey; c.strokeStyle = R.metin; c.lineWidth = 2; c.fillRect(bx, by, bs, bs); c.strokeRect(bx, by, bs, bs);
      if (r.yuzer) { c.fillStyle = seffaf(R.ucuncu, 0.22); c.fillRect(bx, yuzey, bs, by + bs - yuzey); }
      c.restore();
      var cx = bx + bs / 2, cy = by + bs / 2, olc = (t.h * 0.28) / Math.max(r.W, 9.8 * 1.26);
      ok(c, cx - 10, cy, cx - 10, cy + r.W * olc, R.metin, 2.75, "W", R);
      ok(c, cx + 10, cy, cx + 10, cy - r.Fb * olc, R.vurgu, 2.75, "F_b", R);
      if (!r.yuzer && r.N > 0.01) ok(c, cx + 30, by + bs, cx + 30, by + bs - r.N * olc, R.ikinci, 2.5, "N", R, [10, 0]);
      o.W.textContent = sayi(r.W, 2) + " N"; o.F.textContent = sayi(r.Fb, 2) + " N"; o.o.textContent = "%" + Math.round(r.oran * 100); o.N.textContent = sayi(r.N, 2) + " N";
      duy(r.yuzer ? "ρ_cisim < ρ_sıvı: cisim yüzer; batık hacim oranı %" + Math.round(r.oran * 100) + ", F_b = W = " + sayi(r.W, 2) + " N." : "ρ_cisim ≥ ρ_sıvı: cisim batar; F_b = " + sayi(r.Fb, 2) + " N < W = " + sayi(r.W, 2) + " N" + (r.N > 0.005 ? ", taban " + sayi(r.N, 2) + " N normal kuvvet uygular." : " (eşit yoğunlukta askıda kalır)."));
    }
    return { ciz: ciz, t: [t] };
  };

  // (P6b) Bernoulli: daralan boru
  W.bernoulli = function (host) {
    kabuk(host, "Daralan boru: süreklilik ve Bernoulli", "Yatay boruda su akıyor. Kesit daralınca hız artar (A₁v₁ = A₂v₂); yükseklik aynı olduğundan basınç düşer: P₁ + ½ρv₁² = P₂ + ½ρv₂². Dikey tüplerdeki su sütunları basıncı gösterir. (ρ = 1000 kg/m³, P₁ = 120 kPa)", "Unit 8 · Etkileşimli");
    var S = { v1: 1.5, r: 0.5, faz: 0, oyn: false, id: 0 };
    var t = Tuval(host, "16 / 8", "Geniş ve dar bölümlü yatay boru, akış parçacıkları ve basınç tüpleri");
    var R0 = renkler();
    lejant(host, [[R0.ucuncu, "su", "emf-alan"], [R0.metin, "akış parçacıkları", "emf-nokta"]]);
    var k = el("div", "emf-kontroller"); host.appendChild(k);
    kaydirici(k, { etiket: "Giriş hızı v₁", min: 0.5, max: 3, adim: 0.1, deger: S.v1, bicim: function (v) { return sayi(v, 1) + " m/s"; }, degisti: function (v) { S.v1 = v; ciz(); } });
    kaydirici(k, { etiket: "Kesit oranı A₂ / A₁", min: 0.2, max: 1, adim: 0.05, deger: S.r, bicim: function (v) { return sayi(v, 2); }, degisti: function (v) { S.r = v; ciz(); } });
    var ey = el("div", "emf-eylemler"); host.appendChild(ey);
    var bO = dugme(ey, "Akışı oynat", function () { if (S.oyn) dur(); else bas(); });
    function bas() { S.oyn = true; bO.textContent = "Akışı durdur"; var once = null; function adim(z) { if (!S.oyn) return; if (once != null) S.faz += (z - once) / 1000; once = z; ciz(); S.id = requestAnimationFrame(adim); } S.id = requestAnimationFrame(adim); }
    function dur() { S.oyn = false; bO.textContent = "Akışı oynat"; cancelAnimationFrame(S.id); }
    var o = okumalar(host, [["v2", "Dar kısımda v₂"], ["P1", "P₁"], ["P2", "P₂"], ["d", "ΔP = P₁ − P₂"]]);
    var son = sonucBolge(host), duy = canli(son);
    function ciz() {
      if (!t.boyutla()) return;
      var R = renkler(), b = H.bernoulli(120000, S.v1, 1, S.r, 1000), c = t.x;
      c.clearRect(0, 0, t.w, t.h);
      var orta = t.h * 0.68, gen = t.h * 0.2, dar = gen * Math.sqrt(S.r), x1 = t.w * 0.36, x2 = t.w * 0.46, x3 = t.w * 0.66, x4 = t.w * 0.76;
      function yari(x) { if (x <= x1 || x >= x4) return gen; if (x >= x2 && x <= x3) return dar; var u = x < x2 ? (x - x1) / (x2 - x1) : (x4 - x) / (x4 - x3); return gen + (dar - gen) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
      c.save(); c.fillStyle = seffaf(R.ucuncu, 0.18); c.strokeStyle = R.metin; c.lineWidth = 2;
      c.beginPath(); for (var x = 0; x <= t.w; x += 2) c.lineTo(x, orta - yari(x)); for (x = t.w; x >= 0; x -= 2) c.lineTo(x, orta + yari(x)); c.closePath(); c.fill();
      c.beginPath(); for (x = 0; x <= t.w; x += 2) x ? c.lineTo(x, orta - yari(x)) : c.moveTo(x, orta - yari(x)); c.stroke();
      c.beginPath(); for (x = 0; x <= t.w; x += 2) x ? c.lineTo(x, orta + yari(x)) : c.moveTo(x, orta + yari(x)); c.stroke(); c.restore();
      // basınç tüpleri (yükseklik ∝ P; ölçek: 120 kPa → tam boy)
      var tepe = 6, olcP = (orta - gen - tepe - 4) / 130000;
      [[t.w * 0.18, 120000, "P₁"], [(x2 + x3) / 2, b.P2, "P₂"]].forEach(function (p) {
        var ust = orta - yari(p[0]), h = Math.max(0, p[1]) * olcP;
        c.save(); c.strokeStyle = R.metin; c.lineWidth = 1.5; c.strokeRect(p[0] - 6, tepe, 12, ust - tepe);
        c.fillStyle = seffaf(R.ucuncu, 0.55); c.fillRect(p[0] - 5, ust - h, 10, h);
        c.font = "600 11px " + R.font; c.textAlign = "left"; c.textBaseline = "middle"; yazi(c, p[2] + " = " + sayi(p[1] / 1000, 1) + " kPa", p[0] + 12, Math.max(tepe + 8, ust - h), R); c.restore();
      });
      // parçacıklar (hacim debisi korunur: hız ∝ 1/yarıçap²... 2B çizimde ∝ 1/A)
      c.save(); c.fillStyle = R.metin;
      // Parçacık konumu: geçiş zamanı τ(x) = ∫ dx / v(x), v ∝ 1/A ∝ 1/yarıçap² (A₂/A₁ = r ile tutarlı). Eşit τ aralıklı parçacıklar.
      var N = 160, tab = [0];
      for (var j = 1; j <= N; j++) { var xm = t.w * (j - 0.5) / N, ym = yari(xm); tab.push(tab[j - 1] + (ym * ym) / (gen * gen) / N); }
      var Tt = tab[N];
      function konum(tau) { var lo = 0, hi = N; while (hi - lo > 1) { var md = (lo + hi) >> 1; if (tab[md] < tau) lo = md; else hi = md; } var f = (tau - tab[lo]) / ((tab[hi] - tab[lo]) || 1); return t.w * (lo + f) / N; }
      for (var sat = -1; sat <= 1; sat++) for (var i = 0; i < 16; i++) {
        var s0 = ((i + sat * 0.33) / 16 + (HAREKETSIZ ? 0 : S.faz * S.v1 * 0.12) + 1) % 1, xs = konum(s0 * Tt);
        c.globalAlpha = 0.7; c.beginPath(); c.arc(xs, orta + sat * yari(xs) * 0.55, 2.4, 0, 7); c.fill();
      }
      c.restore();
      o.v2.textContent = sayi(b.v2, 2) + " m/s"; o.P1.textContent = "120.0 kPa"; o.P2.textContent = sayi(b.P2 / 1000, 2) + " kPa"; o.d.textContent = sayi((120000 - b.P2) / 1000, 2) + " kPa";
      if (!S.oyn) duy("A₂/A₁ = " + sayi(S.r, 2) + ": v₂ = v₁/" + sayi(S.r, 2) + " = " + sayi(b.v2, 2) + " m/s; P₂ = " + sayi(b.P2 / 1000, 2) + " kPa. Hız arttıkça basınç azalır.");
    }
    return { ciz: ciz, t: [t], durdur: dur };
  };

  // ---------------------------------------------------------------- Kendini dene
  /** Şık sırası: soru metninden türetilen kararlı karıştırma (etkilesim-kbe.js siraKaristir ile aynı). Görünen sıra → asıl indis. */
  function siraKaristir(n, anahtar) {
    var h = 2166136261, t = String(anahtar || ""), i;
    for (i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var rnd = function () { h = (h + 0x6D2B79F5) >>> 0; var x = Math.imul(h ^ (h >>> 15), 1 | h); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    var p = []; for (i = 0; i < n; i++) p.push(i);
    for (i = n - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), g = p[i]; p[i] = p[j]; p[j] = g; }
    return p;
  }
  function dene(host) {
    var sorular = DENE[host.getAttribute("data-emf-dene")];
    if (!sorular) return;
    host.textContent = "";
    host.appendChild(el("p", "emf-dene-ust", "Kendini dene"));
    sorular.forEach(function (q, qi) {
      var kut = el("div", "emf-soru"), sid = yid("q");
      var m = el("p", "emf-soru-metin", (sorular.length > 1 ? (qi + 1) + ". " : "") + q.s); m.id = sid; kut.appendChild(m);
      var g = el("div", "emf-secenekler"); g.setAttribute("role", "group"); g.setAttribute("aria-labelledby", sid);
      var geri = el("p", "emf-geri"); geri.setAttribute("aria-live", "polite");
      var sira = siraKaristir(q.o.length, q.s); // görünen konum k → asıl şık sira[k]
      var dugmeler = sira.map(function (i, k) {
        var s = q.o[i];
        var b = el("button", "emf-secenek"); b.type = "button";
        b.appendChild(el("span", "emf-harf", "ABCD"[k])); b.appendChild(el("span", null, s[0]));
        b.addEventListener("click", function () {
          var dogru = i === q.d;
          dugmeler.forEach(function (x) { x.classList.remove("emf-dogru", "emf-yanlis"); x.removeAttribute("aria-describedby"); });
          b.classList.add(dogru ? "emf-dogru" : "emf-yanlis");
          geri.className = "emf-geri " + (dogru ? "emf-g-dogru" : "emf-g-yanlis");
          geri.textContent = "";
          geri.appendChild(el("span", "emf-isaret", dogru ? "Doğru. " : "Tekrar düşün. "));
          geri.appendChild(document.createTextNode(dogru ? s[1].replace(/^Doğru\.\s*/, "") : s[1]));
          var gid = geri.id || (geri.id = yid("gb")); b.setAttribute("aria-describedby", gid);
        });
        g.appendChild(b); return b;
      });
      kut.appendChild(g); kut.appendChild(geri); host.appendChild(kut);
    });
  }

  // ---------------------------------------------------------------- Adım adım çözüm
  function adimAdim(kut) {
    if (kut.dataset.emfHazir) return; kut.dataset.emfHazir = "1";
    var parcalar = [[]];
    Array.prototype.slice.call(kut.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName === "BR") { parcalar.push([]); return; }
      parcalar[parcalar.length - 1].push(n);
    });
    parcalar = parcalar.filter(function (p) { return p.some(function (n) { return n.nodeType === 1 || /\S/.test(n.textContent); }); });
    if (parcalar.length < 3) return;
    kut.textContent = ""; kut.classList.add("emf-adimli");
    var adimlar = parcalar.map(function (p, i) { var d = el("div", "emf-adim" + (i > 1 ? " emf-gizli" : "")); p.forEach(function (n) { d.appendChild(n); }); kut.appendChild(d); return d; });
    var acik = 2, top = adimlar.length;
    var cub = el("div", "emf-adim-cubuk"), sayacEl = el("span", "emf-adim-sayac"); sayacEl.setAttribute("aria-live", "polite");
    var ileri = dugme(cub, "Sonraki adım", function () { goster(acik + 1); var a = adimlar[acik - 1]; if (a) { a.setAttribute("tabindex", "-1"); a.focus({ preventScroll: true }); } });
    var hepsi = dugme(cub, "Tümünü göster", function () { goster(top); });
    var bastan = dugme(cub, "Baştan", function () { goster(2); ileri.focus(); });
    cub.appendChild(sayacEl); kut.appendChild(cub);
    function goster(n) {
      acik = Math.max(2, Math.min(top, n));
      adimlar.forEach(function (a, i) { a.classList.toggle("emf-gizli", i >= acik); a.setAttribute("aria-hidden", String(i >= acik)); });
      ileri.disabled = hepsi.disabled = acik >= top; bastan.hidden = acik <= 2;
      sayacEl.textContent = "Adım " + (acik - 1) + " / " + (top - 1);
    }
    goster(2);
  }

  // ---------------------------------------------------------------- Yaşam döngüsü (tembel başlatma)
  var orn = [];
  function baslat() {
    Array.prototype.slice.call(document.querySelectorAll("[data-emf-adim]")).forEach(adimAdim);
    Array.prototype.slice.call(document.querySelectorAll("[data-emf-dene]")).forEach(dene);
    var gorunur = "IntersectionObserver" in window ? new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        var o = g.target.__emf; if (!o) return;
        var gor = g.isIntersecting && g.intersectionRect.height > 0;
        o.gor = gor;
        if (gor && !o.hazir) { o.hazir = true; o.ciz(); }
        if (!gor && o.durdur) o.durdur();
      });
    }, { rootMargin: "120px 0px", threshold: [0, 0.01] }) : null;
    var boyut = "ResizeObserver" in window ? new ResizeObserver(function (girdiler) {
      girdiler.forEach(function (g) { var o = g.target.__emfSahip; if (o && o.hazir) o.ciz(); });
    }) : null;
    Array.prototype.slice.call(document.querySelectorAll("[data-emf]")).forEach(function (host) {
      var tur = host.getAttribute("data-emf"); if (!W[tur] || host.__emf) return;
      try {
        var o = W[tur](host); host.__emf = o; orn.push(o);
        if (boyut) o.t.forEach(function (tv) { tv.sar.__emfSahip = o; boyut.observe(tv.sar); });
        if (gorunur) gorunur.observe(host); else { o.hazir = true; o.ciz(); }
      } catch (e) { if (window.console) console.warn("etkilesim-mf:", tur, e); }
    });
    // Tema değişimi: çizimleri yeni renklerle yenile
    var yenile = function () { orn.forEach(function (o) { if (o.hazir) o.ciz(); }); };
    if ("MutationObserver" in window) new MutationObserver(yenile).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (window.matchMedia) { var mq = window.matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", yenile); }
  }
  kok.MF = { hesap: H, dene: DENE, siraKaristir: siraKaristir };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat); else baslat();
})(typeof window !== "undefined" ? window : globalThis);
