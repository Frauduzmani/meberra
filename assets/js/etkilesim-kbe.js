/* ==========================================================================
   MEBERRA — İnteraktif konu anlatımı (v1.17.0): Kimya · Biyoloji · Seçmeliler (Ekonomi + CS A) · English Language
   Kitaplık yok. Satır içi SVG. Renkler tokenlardan (CSS sınıfları) gelir → açık/koyu tema kendiliğinden.
   Sayfada <div class="kbe-yuva" data-kbe="tur" ...></div> yuvaları görünüme yaklaşınca (IntersectionObserver) kurulur.
   Ayrıca [data-kbe-adim] işaretli çözümler "Adım adım" gösterime dönüşür (JS yoksa çözüm olduğu gibi görünür).
   Saf hesaplar (Ç) Node'da da çalışır: araclar/testler/etkilesim-kbe-birim-test.js
   ========================================================================== */
(function (kok, kur) {
  "use strict";
  const api = kur();
  if (typeof module === "object" && module.exports) module.exports = api;
  else kok.MeberraKBE = api;
  if (typeof document !== "undefined") api.baslat();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1) SAF HESAPLAR                                                      */
  /* ------------------------------------------------------------------ */
  const KW = 1e-14;
  const R_KJ = 0.008314;      // kJ/(mol·K)
  const R_J = 8.314;          // J/(mol·K)
  const R_ATM = 0.08206;      // L·atm/(mol·K)

  /** Şık sırası: soru metninden türetilen kararlı karıştırma (her açılışta aynı, sorular arasında farklı). Dönüş: görünen sıra → asıl şık indisi. */
  function siraKaristir(n, anahtar) {
    let h = 2166136261;
    const t = String(anahtar || "");
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const rnd = () => { h = (h + 0x6D2B79F5) >>> 0; let x = Math.imul(h ^ (h >>> 15), 1 | h); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const p = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const g = p[i]; p[i] = p[j]; p[j] = g; }
    return p;
  }

  /** İkiye bölme: f artan, [a,b] aralığında kök. */
  function ikiyeBol(f, a, b, n) {
    let fa = f(a);
    for (let i = 0; i < (n || 200); i++) {
      const m = (a + b) / 2, fm = f(m);
      if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m;
    }
    return (a + b) / 2;
  }

  /** Titrasyon: Va mL Ca M asit (Ka: null → kuvvetli) + Vb mL Cb M NaOH. Yük denkliği tam çözüm. */
  function titrasyonPH(o, Vb) {
    const Vt = o.Va + Vb;
    const Ct = o.Ca * o.Va / Vt, Na = o.Cb * Vb / Vt;
    const f = lh => {
      const h = Math.pow(10, lh);
      const A = o.Ka == null ? Ct : Ct * o.Ka / (o.Ka + h);
      return h + Na - KW / h - A;
    };
    return -ikiyeBol(f, -15, 1, 120);
  }
  const esdegerlikHacmi = o => o.Ca * o.Va / o.Cb;

  /** Haber–Bosch dengesi: N2 + 3H2 ⇌ 2NH3, ΔH° = −92 kJ/mol. */
  const DENGE = { dH: -92000, T0: 700, c0: { N2: 0.5, H2: 1.5, NH3: 0.5 } };
  const dengeQ = c => (c.NH3 * c.NH3) / (c.N2 * Math.pow(c.H2, 3));
  DENGE.K0 = dengeQ(DENGE.c0);
  const dengeK = T => DENGE.K0 * Math.exp(-DENGE.dH / R_J * (1 / T - 1 / DENGE.T0));
  function kaymaYonu(Q, K) {
    const r = Math.log(Q / K);
    if (Math.abs(r) < 1e-6) return "denge";
    return r < 0 ? "ileri" : "geri";
  }
  /** Q = K olana dek tepkime ilerler (x: ileri yönde mol/L). */
  function dengeyeGetir(c, K) {
    const lo = -c.NH3 / 2 + 1e-12, hi = Math.min(c.N2, c.H2 / 3) - 1e-12;
    const g = x => Math.log(dengeQ({ N2: c.N2 - x, H2: c.H2 - 3 * x, NH3: c.NH3 + 2 * x })) - Math.log(K);
    const x = ikiyeBol(g, lo, hi, 200);
    return { N2: c.N2 - x, H2: c.H2 - 3 * x, NH3: c.NH3 + 2 * x, x };
  }
  /** Bozucu etki uygula → yeni derişimler ve T. */
  function dengeBoz(durum, etki) {
    const c = Object.assign({}, durum.c);
    let T = durum.T;
    switch (etki) {
      case "+N2": c.N2 += 0.5; break;
      case "+H2": c.H2 += 0.5; break;
      case "+NH3": c.NH3 += 0.5; break;
      case "-NH3": c.NH3 = c.NH3 * 0.4; break;
      case "T+": T += 50; break;
      case "T-": T -= 50; break;
      case "P+": Object.keys(c).forEach(k => { c[k] *= 2; }); break;
      case "P-": Object.keys(c).forEach(k => { c[k] /= 2; }); break;
      case "Ar": break;
    }
    return { c, T };
  }

  /** Maxwell–Boltzmann enerji dağılımı (kJ/mol başına olasılık yoğunluğu) ve Ea üstü kesir. */
  function erfc(x) {
    const t = 1 / (1 + 0.3275911 * x);
    const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    return y * Math.exp(-x * x);
  }
  const mbYogunluk = (E, T) => { const kT = R_KJ * T; return 2 * Math.sqrt(E / Math.PI) * Math.pow(1 / kT, 1.5) * Math.exp(-E / kT); };
  const mbKesir = (Ea, T) => { const x = Ea / (R_KJ * T); return erfc(Math.sqrt(x)) + 2 * Math.sqrt(x / Math.PI) * Math.exp(-x); };

  /** İdeal gaz: bilinmeyeni PV = nRT'den çöz. */
  function gazCoz(bilinmeyen, d) {
    const { P, V, T, n } = d;
    if (bilinmeyen === "P") return n * R_ATM * T / V;
    if (bilinmeyen === "V") return n * R_ATM * T / P;
    if (bilinmeyen === "T") return P * V / (n * R_ATM);
    return P * V / (R_ATM * T);
  }

  /** PES: ilk 20 element, alt kabuk bağlanma enerjileri (MJ/mol, yaklaşık; AP PES tablolarında kullanılan değerler). */
  const PES = [
    ["H", "Hidrojen", [["1s", 1, 1.31]]],
    ["He", "Helyum", [["1s", 2, 2.37]]],
    ["Li", "Lityum", [["1s", 2, 6.26], ["2s", 1, 0.52]]],
    ["Be", "Berilyum", [["1s", 2, 11.5], ["2s", 2, 0.90]]],
    ["B", "Bor", [["1s", 2, 19.3], ["2s", 2, 1.36], ["2p", 1, 0.80]]],
    ["C", "Karbon", [["1s", 2, 28.6], ["2s", 2, 1.72], ["2p", 2, 1.09]]],
    ["N", "Azot", [["1s", 2, 39.6], ["2s", 2, 2.45], ["2p", 3, 1.40]]],
    ["O", "Oksijen", [["1s", 2, 52.6], ["2s", 2, 3.12], ["2p", 4, 1.31]]],
    ["F", "Flor", [["1s", 2, 67.2], ["2s", 2, 3.88], ["2p", 5, 1.68]]],
    ["Ne", "Neon", [["1s", 2, 84.0], ["2s", 2, 4.68], ["2p", 6, 2.08]]],
    ["Na", "Sodyum", [["1s", 2, 104], ["2s", 2, 6.84], ["2p", 6, 3.67], ["3s", 1, 0.50]]],
    ["Mg", "Magnezyum", [["1s", 2, 126], ["2s", 2, 9.07], ["2p", 6, 5.31], ["3s", 2, 0.74]]],
    ["Al", "Alüminyum", [["1s", 2, 151], ["2s", 2, 12.1], ["2p", 6, 7.79], ["3s", 2, 1.09], ["3p", 1, 0.58]]],
    ["Si", "Silisyum", [["1s", 2, 178], ["2s", 2, 15.1], ["2p", 6, 10.3], ["3s", 2, 1.46], ["3p", 2, 0.79]]],
    ["P", "Fosfor", [["1s", 2, 208], ["2s", 2, 18.7], ["2p", 6, 13.5], ["3s", 2, 1.95], ["3p", 3, 1.01]]],
    ["S", "Kükürt", [["1s", 2, 239], ["2s", 2, 22.7], ["2p", 6, 16.5], ["3s", 2, 2.05], ["3p", 4, 1.00]]],
    ["Cl", "Klor", [["1s", 2, 273], ["2s", 2, 26.8], ["2p", 6, 20.2], ["3s", 2, 2.44], ["3p", 5, 1.25]]],
    ["Ar", "Argon", [["1s", 2, 309], ["2s", 2, 31.5], ["2p", 6, 24.1], ["3s", 2, 2.82], ["3p", 6, 1.52]]],
    ["K", "Potasyum", [["1s", 2, 347], ["2s", 2, 37.1], ["2p", 6, 29.1], ["3s", 2, 4.73], ["3p", 6, 2.38], ["4s", 1, 0.42]]],
    ["Ca", "Kalsiyum", [["1s", 2, 390], ["2s", 2, 42.7], ["2p", 6, 34.0], ["3s", 2, 5.13], ["3p", 6, 3.21], ["4s", 2, 0.59]]]
  ];

  /** Nüfus büyümesi. */
  const ustelN = (N0, r, t) => N0 * Math.exp(r * t);
  const lojistikN = (N0, r, K, t) => K / (1 + ((K - N0) / N0) * Math.exp(-r * t));
  const lojistikHiz = (N, r, K) => r * N * (1 - N / K);

  /** Hardy–Weinberg ve ki-kare (H0: kaydırıcıdaki p; df = 3 − 1 = 2). */
  const hw = p => { const q = 1 - p; return { p, q, AA: p * p, Aa: 2 * p * q, aa: q * q }; };
  function kiKare(gozlenen, beklenen) {
    return gozlenen.reduce((s, o, i) => s + (beklenen[i] > 0 ? (o - beklenen[i]) * (o - beklenen[i]) / beklenen[i] : 0), 0);
  }
  const KRITIK_005 = { 1: 3.84, 2: 5.99, 3: 7.81, 4: 9.49 };

  /** Enzim: Michaelis–Menten × sıcaklık × pH etkinlik katsayıları. */
  const mm = (S, Vmax, Km) => Vmax * S / (Km + S);
  const enzimT = (T, Topt, Tden) => T <= Topt ? Math.pow(2, (T - Topt) / 10) : Math.max(0, 1 - Math.pow((T - Topt) / (Tden - Topt), 2));
  const enzimPH = (pH, opt) => Math.exp(-Math.pow((pH - opt) / 1.5, 2));

  /** Enerji piramidi. */
  const piramit = (E0, verim, n) => Array.from({ length: n }, (_, i) => E0 * Math.pow(verim, i));

  /** Doğrusal arz–talep: talep P = A − B·Q, arz P = C + D·Q. */
  function arzTalep(A, B, C, D) {
    const Q = (A - C) / (B + D), P = A - B * Q;
    return { Q, P, TF: 0.5 * Q * (A - P), UF: 0.5 * Q * (P - C) };
  }
  /** Orta nokta (yay) esnekliği. */
  function esneklik(P1, Q1, P2, Q2) {
    const yQ = (Q2 - Q1) / ((Q1 + Q2) / 2), yP = (P2 - P1) / ((P1 + P2) / 2);
    const E = Math.abs(yQ / yP);
    const tur = Math.abs(E - 1) < 1e-9 ? "birim" : E > 1 ? "esnek" : "inelastik";
    return { E, yQ, yP, tur, TG1: P1 * Q1, TG2: P2 * Q2 };
  }
  /** AD–AS: AD: P = a − Y, SRAS: P = c + Y, LRAS: Y = Yf. */
  const ADAS_YF = 100;
  const adas = (a, c) => ({ Y: (a - c) / 2, P: (a + c) / 2 });
  const adasUzunDonem = a => a - 2 * ADAS_YF;   // yeni c
  /** Para piyasası: MD: i = 10 − 0.05·M (%), MS dikey. */
  const paraFaizi = M => Math.max(0.5, 10 - 0.05 * M);
  /** Maliyet eğrileri: TC = 100 + 20q − 3q² + 0.2q³. */
  const MAL = { FC: 100 };
  const malVC = q => 20 * q - 3 * q * q + 0.2 * q * q * q;
  const malMC = q => 20 - 6 * q + 0.6 * q * q;
  const malAVC = q => 20 - 3 * q + 0.2 * q * q;
  const malATC = q => malAVC(q) + MAL.FC / q;
  function karMaksQ(P) {
    const d = 36 - 2.4 * (20 - P);
    if (d < 0) return null;
    return (6 + Math.sqrt(d)) / 1.2;
  }
  const MIN_AVC = malAVC(7.5);

  /* ---- Java iz sürücü: 4 özgün kod parçası, belirlenimli adımlar ---- */
  const kopya = o => JSON.parse(JSON.stringify(o));
  const listeYaz = a => "[" + a.join(", ") + "]";
  const KODLAR = [
    {
      ad: "Döngü ve toplam",
      satirlar: [
        "int sum = 0;",
        "for (int i = 1; i <= 7; i += 2) {",
        "  sum += i;",
        "}",
        "System.out.println(sum);"
      ],
      adimlar() {
        const s = [], v = {};
        let out = "";
        const ad = (satir, not) => s.push({ satir, v: kopya(v), out, not });
        v.sum = 0; ad(1, "sum 0 ile başlar.");
        let i = 1; v.i = i; ad(2, "i = 1; koşul 1 <= 7 doğru.");
        while (i <= 7) {
          v.sum += i; ad(3, "sum += i → sum = " + v.sum + ".");
          i += 2; v.i = i;
          ad(2, "i += 2 → i = " + i + "; koşul " + i + " <= 7 " + (i <= 7 ? "doğru." : "yanlış, döngü biter."));
        }
        out += v.sum + "\n"; delete v.i; ad(5, "i döngü dışında artık yok (kapsam). Çıktı: " + v.sum + ".");
        return s;
      },
      beklenen: "16"
    },
    {
      ad: "ArrayList: dolaşırken silme tuzağı",
      satirlar: [
        "ArrayList<Integer> nums = new ArrayList<Integer>(); // [4, 6, 6, 3, 8]",
        "for (int i = 0; i < nums.size(); i++) {",
        "  if (nums.get(i) % 2 == 0) {",
        "    nums.remove(i);",
        "  }",
        "}",
        "System.out.println(nums);"
      ],
      adimlar() {
        const s = [], v = {};
        let out = "";
        const nums = [4, 6, 6, 3, 8];
        const ad = (satir, not) => { v.nums = listeYaz(nums); s.push({ satir, v: kopya(v), out, not }); };
        ad(1, "Liste 5 elemanla hazır (add çağrıları kısaltıldı).");
        let i = 0; v.i = i;
        ad(2, "i = 0; 0 < size() = " + nums.length + " doğru.");
        while (i < nums.length) {
          const x = nums[i];
          ad(3, "nums.get(" + i + ") = " + x + (x % 2 === 0 ? " çift → koşul doğru." : " tek → koşul yanlış."));
          if (x % 2 === 0) {
            nums.splice(i, 1);
            ad(4, "remove(" + i + "): sağdaki elemanlar bir sola kayar." + (i < nums.length ? " Yeni nums.get(" + i + ") = " + nums[i] + " ama i artacak, bu eleman ATLANIR!" : ""));
          }
          i++; v.i = i;
          ad(2, "i++ → i = " + i + "; " + i + " < size() = " + nums.length + (i < nums.length ? " doğru." : " yanlış, döngü biter."));
        }
        out += listeYaz(nums) + "\n"; delete v.i;
        ad(7, "Çıktı " + listeYaz(nums) + ": ikinci 6 atlandığı için listede kaldı. Çözüm: sondan başa dolaş (i = size() − 1; i >= 0; i--).");
        return s;
      },
      beklenen: "[6, 3]"
    },
    {
      ad: "2D dizi: sütun öncelikli dolaşma",
      satirlar: [
        "int[][] grid = {{1, 2, 3}, {4, 5, 6}};",
        "String out = \"\";",
        "for (int c = 0; c < grid[0].length; c++) {",
        "  for (int r = 0; r < grid.length; r++) {",
        "    out += grid[r][c];",
        "  }",
        "}",
        "System.out.println(out);"
      ],
      adimlar() {
        const s = [], v = {};
        let konsol = "";
        const g = [[1, 2, 3], [4, 5, 6]];
        const ad = (satir, not) => s.push({ satir, v: kopya(v), out: konsol, not });
        v.grid = "2 satır × 3 sütun"; ad(1, "grid.length = 2 (satır), grid[0].length = 3 (sütun).");
        v.out = "\"\""; ad(2, "Boş String.");
        let o = "";
        for (let c = 0; c < 3; c++) {
          v.c = c; delete v.r; ad(3, "c = " + c + ": dış döngü SÜTUNLARI dolaşır.");
          for (let r = 0; r < 2; r++) {
            v.r = r; ad(4, "r = " + r + "; r < 2 doğru.");
            o += g[r][c]; v.out = "\"" + o + "\""; ad(5, "grid[" + r + "][" + c + "] = " + g[r][c] + " eklendi.");
          }
          delete v.r; ad(4, "r = 2; 2 < 2 yanlış, iç döngü biter.");
        }
        delete v.c; konsol += o + "\n"; ad(8, "Sütun öncelikli sıra: " + o + " (satır öncelikli olsaydı 123456).");
        return s;
      },
      beklenen: "142536"
    },
    {
      ad: "String yöntemleri: indexOf ve substring",
      satirlar: [
        "String s = \"banana\";",
        "int count = 0;",
        "while (s.indexOf(\"an\") >= 0) {",
        "  int p = s.indexOf(\"an\");",
        "  count++;",
        "  s = s.substring(p + 2);",
        "}",
        "System.out.println(count + \" \" + s);"
      ],
      adimlar() {
        const st = [], v = {};
        let konsol = "";
        const ad = (satir, not) => st.push({ satir, v: kopya(v), out: konsol, not });
        let s = "banana", count = 0;
        v.s = "\"" + s + "\""; ad(1, "s = \"banana\" (indeksler 0–5).");
        v.count = 0; ad(2, "count = 0.");
        for (;;) {
          const k = s.indexOf("an");
          ad(3, "s.indexOf(\"an\") = " + k + (k >= 0 ? " → koşul doğru." : " → bulunamadı (−1), döngü biter."));
          if (k < 0) break;
          v.p = k; ad(4, "p = " + k + ".");
          count++; v.count = count; ad(5, "count = " + count + ".");
          s = s.substring(k + 2); v.s = "\"" + s + "\"";
          ad(6, "substring(" + (k + 2) + ") → \"" + s + "\" (String değişmez; s yeni nesneye bağlanır).");
          delete v.p;
        }
        konsol += count + " " + s + "\n";
        ad(8, "Çıktı: " + count + " " + s + ". Not: p döngü bloğunda tanımlıydı; dışarıda erişilemez.");
        return st;
      },
      beklenen: "2 a"
    }
  ];

  const Ç = {
    titrasyonPH, esdegerlikHacmi, DENGE, dengeQ, dengeK, kaymaYonu, dengeyeGetir, dengeBoz,
    erfc, mbYogunluk, mbKesir, gazCoz, PES, ustelN, lojistikN, lojistikHiz, hw, kiKare, KRITIK_005,
    mm, enzimT, enzimPH, piramit, arzTalep, esneklik, adas, adasUzunDonem, ADAS_YF, paraFaizi,
    malVC, malMC, malAVC, malATC, karMaksQ, MIN_AVC, MAL, KODLAR
  };

  /* ------------------------------------------------------------------ */
  /* 2) ARAYÜZ YARDIMCILARI                                               */
  /* ------------------------------------------------------------------ */
  const SVGNS = "http://www.w3.org/2000/svg";
  let sayac = 0;
  const yeniId = on => "kbe-" + on + "-" + (++sayac);
  const azHareket = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, at, ...cocuk) {
    const e = document.createElement(tag);
    if (at) for (const k in at) {
      if (at[k] == null || at[k] === false) continue;
      if (k === "class") e.className = at[k];
      else if (k === "text") e.textContent = at[k];
      else if (k === "html") e.innerHTML = at[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), at[k]);
      else e.setAttribute(k, at[k] === true ? "" : at[k]);
    }
    cocuk.flat().forEach(c => { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function sv(tag, at) {
    const e = document.createElementNS(SVGNS, tag);
    if (at) for (const k in at) if (at[k] != null) e.setAttribute(k, at[k]);
    return e;
  }
  const fmt = (x, d) => (x == null || !isFinite(x)) ? "—" : Number(x).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const yuzde = (x, d) => "%" + fmt(x * 100, d == null ? 1 : d);

  /** Etiketli kaydırıcı + canlı değer (<output>). */
  function kaydirici(o) {
    const id = yeniId("k");
    const cikti = el("output", { class: "kbe-deger", for: id });
    const inp = el("input", { type: "range", id, min: o.min, max: o.max, step: o.step, value: o.deger, "aria-describedby": o.aciklama ? id + "-a" : null });
    const yaz = () => { cikti.textContent = o.bicim(+inp.value); inp.setAttribute("aria-valuetext", o.bicim(+inp.value)); };
    inp.addEventListener("input", () => { yaz(); o.degisti(+inp.value); });
    yaz();
    const sar = el("div", { class: "kbe-kaydir" },
      el("div", { class: "kbe-kaydir__ust" }, el("label", { for: id, text: o.etiket }), cikti),
      inp,
      o.aciklama ? el("p", { class: "kbe-ipucu", id: id + "-a", text: o.aciklama }) : null);
    return { sar, inp, ayarla(v) { inp.value = v; yaz(); }, deger: () => +inp.value };
  }
  function secim(etiket, secenekler, deger, degisti) {
    const id = yeniId("s");
    const s = el("select", { id, class: "kbe-select" }, secenekler.map(([v, t]) => el("option", { value: v, text: t })));
    s.value = deger;
    s.addEventListener("change", () => degisti(s.value));
    return { sar: el("div", { class: "kbe-alan" }, el("label", { for: id, text: etiket }), s), s };
  }
  const dugme = (metin, tik, ek) => el("button", Object.assign({ type: "button", class: "kbe-btn", onclick: tik }, ek || {}), metin);
  const canli = () => el("p", { class: "kbe-sonuc", "aria-live": "polite", role: "status" });

  /** Kutu iskeleti. */
  function kutu(yuva, baslik, alt) {
    const hid = yeniId("b");
    const f = el("figure", { class: "kbe", role: "group", "aria-labelledby": hid },
      el("figcaption", { class: "kbe-bas" },
        el("span", { class: "kbe-rozet", "aria-hidden": "true", text: "Etkileşimli" }),
        el("strong", { id: hid, class: "kbe-baslik", text: baslik }),
        alt ? el("span", { class: "kbe-alt", text: alt }) : null));
    yuva.appendChild(f);
    return f;
  }

  /** SVG grafik iskeleti: sabit viewBox (yükseklik önceden ayrılır → CLS yok). */
  function grafik(o) {
    const W = o.w || 340, H = o.h || 210, p = Object.assign({ l: 44, r: 12, t: 12, b: 34 }, o.pad || {});
    const svg = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "kbe-svg", role: "img", "aria-label": o.etiket || "" });
    const iw = W - p.l - p.r, ih = H - p.t - p.b;
    const xd = o.x, yd = o.y;
    const xlog = !!o.xlog, xters = !!o.xters;
    const lx = v => xlog ? Math.log10(v) : v;
    let sx = v => { const t = (lx(v) - lx(xd[0])) / (lx(xd[1]) - lx(xd[0])); return p.l + (xters ? 1 - t : t) * iw; };
    const sy = v => p.t + (1 - (v - yd[0]) / (yd[1] - yd[0])) * ih;
    const kid = yeniId("c");
    const defs = sv("defs");
    const cp = sv("clipPath", { id: kid });
    cp.appendChild(sv("rect", { x: p.l, y: p.t, width: iw, height: ih }));
    defs.appendChild(cp); svg.appendChild(defs);
    const izgara = sv("g", { class: "kbe-izgara" }), eksen = sv("g", { class: "kbe-eksen" });
    (o.yt || []).forEach(v => {
      izgara.appendChild(sv("line", { x1: p.l, x2: p.l + iw, y1: sy(v), y2: sy(v) }));
      const t = sv("text", { x: p.l - 6, y: sy(v) + 4, "text-anchor": "end" }); t.textContent = o.ybic ? o.ybic(v) : v; eksen.appendChild(t);
    });
    (o.xt || []).forEach(v => {
      const t = sv("text", { x: sx(v), y: p.t + ih + 15, "text-anchor": "middle" }); t.textContent = o.xbic ? o.xbic(v) : v; eksen.appendChild(t);
    });
    eksen.appendChild(sv("line", { x1: p.l, x2: p.l + iw, y1: p.t + ih, y2: p.t + ih, class: "kbe-taban" }));
    eksen.appendChild(sv("line", { x1: p.l, x2: p.l, y1: p.t, y2: p.t + ih, class: "kbe-taban" }));
    if (o.xad) { const t = sv("text", { x: p.l + iw / 2, y: H - 3, "text-anchor": "middle", class: "kbe-eksen-ad" }); t.textContent = o.xad; eksen.appendChild(t); }
    if (o.yad) { const t = sv("text", { x: 11, y: p.t + ih / 2, "text-anchor": "middle", class: "kbe-eksen-ad", transform: `rotate(-90 11 ${p.t + ih / 2})` }); t.textContent = o.yad; eksen.appendChild(t); }
    svg.appendChild(izgara); svg.appendChild(eksen);
    const ic = sv("g", { "clip-path": `url(#${kid})` });
    const ust = sv("g");
    svg.appendChild(ic); svg.appendChild(ust);
    const yol = pts => pts.filter(q => isFinite(q[1])).map((q, i) => (i ? "L" : "M") + sx(q[0]).toFixed(1) + " " + sy(q[1]).toFixed(1)).join("");
    return { svg, sx, sy, ic, ust, yol, p, iw, ih, W, H };
  }
  function cizgi(g, sinif, ust) { const e = sv("path", { class: sinif, fill: "none" }); (ust ? g.ust : g.ic).appendChild(e); return e; }
  function yazi(g, sinif, anchor) { const e = sv("text", { class: sinif, "text-anchor": anchor || "start" }); g.ust.appendChild(e); return e; }
  function konum(e, x, y, metin) { e.setAttribute("x", x); e.setAttribute("y", y); if (metin != null) e.textContent = metin; }
  function lejant(ogeler) {
    return el("ul", { class: "kbe-lejant" }, ogeler.map(([sinif, ad]) => el("li", null, el("span", { class: "kbe-lj " + sinif, "aria-hidden": "true" }), ad)));
  }

  /* ------------------------------------------------------------------ */
  /* 3) KİMYA                                                             */
  /* ------------------------------------------------------------------ */
  const W = {};

  W.titrasyon = function (y) {
    const f = kutu(y, "Titrasyon simülatörü", "25,0 mL 0,100 M asit + 0,100 M NaOH");
    const ASIT = { kuvvetli: { ad: "HCl", Ka: null }, asetik: { ad: "CH₃COOH", Ka: 1.8e-5 }, ha: { ad: "HA", Ka: 2.0e-5 } };
    let tur = "asetik";
    const g = grafik({ x: [0, 50], y: [0, 14], xt: [0, 10, 20, 25, 30, 40, 50], yt: [0, 2, 4, 7, 10, 12, 14], xad: "Eklenen NaOH (mL)", yad: "pH", etiket: "pH – hacim titrasyon eğrisi" });
    const egri = cizgi(g, "kbe-s1");
    const esd = sv("line", { class: "kbe-kilavuz" }); g.ic.appendChild(esd);
    const yari = sv("line", { class: "kbe-kilavuz kbe-kilavuz--2" }); g.ic.appendChild(yari);
    const yariY = sv("line", { class: "kbe-kilavuz kbe-kilavuz--2" }); g.ic.appendChild(yariY);
    const esdE = yazi(g, "kbe-not-yazi"), yariE = yazi(g, "kbe-not-yazi");
    const nokta = sv("circle", { r: 5, class: "kbe-nokta" }); g.ust.appendChild(nokta);
    const sonuc = canli();
    const o = () => ({ Va: 25, Ca: 0.1, Cb: 0.1, Ka: ASIT[tur].Ka });
    const sec = secim("Asit", [["kuvvetli", "Kuvvetli asit: HCl"], ["asetik", "Zayıf asit: CH₃COOH (Ka = 1,8 × 10⁻⁵)"], ["ha", "Zayıf asit: HA (Ka = 2,0 × 10⁻⁵, FRQ örneği)"]], tur, v => { tur = v; ciz(); guncel(); });
    const k = kaydirici({ etiket: "Eklenen NaOH hacmi", min: 0, max: 50, step: 0.5, deger: 12.5, bicim: v => fmt(v, 1) + " mL", degisti: guncel });
    function ciz() {
      const oo = o(), pts = [];
      for (let v = 0; v <= 50.001; v += 0.25) pts.push([v, titrasyonPH(oo, v)]);
      egri.setAttribute("d", g.yol(pts));
      const ve = esdegerlikHacmi(oo), phe = titrasyonPH(oo, ve);
      esd.setAttribute("x1", g.sx(ve)); esd.setAttribute("x2", g.sx(ve)); esd.setAttribute("y1", g.sy(0)); esd.setAttribute("y2", g.sy(14));
      konum(esdE, g.sx(ve) + 5, g.sy(phe) + 4, "Eşdeğerlik: pH " + fmt(phe, 2));
      const zayif = oo.Ka != null;
      [yari, yariY, yariE].forEach(e => e.style.display = zayif ? "" : "none");
      if (zayif) {
        const pKa = -Math.log10(oo.Ka), vh = ve / 2;
        yari.setAttribute("x1", g.sx(vh)); yari.setAttribute("x2", g.sx(vh)); yari.setAttribute("y1", g.sy(0)); yari.setAttribute("y2", g.sy(pKa));
        yariY.setAttribute("x1", g.sx(0)); yariY.setAttribute("x2", g.sx(vh)); yariY.setAttribute("y1", g.sy(pKa)); yariY.setAttribute("y2", g.sy(pKa));
        konum(yariE, g.sx(vh) - 4, g.sy(pKa) - 7, "Yarı-eşdeğerlik: pH = pKa = " + fmt(pKa, 2));
        yariE.setAttribute("text-anchor", "middle");
      }
    }
    function guncel() {
      const oo = o(), v = k.deger(), ph = titrasyonPH(oo, v), ve = esdegerlikHacmi(oo);
      nokta.setAttribute("cx", g.sx(v)); nokta.setAttribute("cy", g.sy(ph));
      let bolge;
      if (v === 0) bolge = oo.Ka == null ? "yalnız kuvvetli asit: [H⁺] = 0,100 M" : "yalnız zayıf asit: ICE tablosu ile x = √(Ka·C)";
      else if (Math.abs(v - ve / 2) < 0.26 && oo.Ka != null) bolge = "yarı-eşdeğerlik: [HA] = [A⁻] olduğundan pH = pKa";
      else if (Math.abs(v - ve) < 0.26) bolge = oo.Ka == null ? "eşdeğerlik: yalnız Na⁺ ve Cl⁻ kalır, pH = 7" : "eşdeğerlik: A⁻ hidrolizi OH⁻ üretir, pH > 7";
      else if (v < ve) bolge = oo.Ka == null ? "asit fazlası" : "tampon bölgesi (HA / A⁻): Henderson–Hasselbalch geçerli";
      else bolge = "fazla OH⁻ pH'ı belirler";
      sonuc.textContent = fmt(v, 1) + " mL NaOH: pH = " + fmt(ph, 2) + " — " + bolge + ".";
    }
    f.append(el("div", { class: "kbe-kontrol" }, sec.sar, k.sar), el("div", { class: "kbe-cizim" }, g.svg), sonuc,
      el("p", { class: "kbe-ipucu", text: "Eğri yük denkliğinden tam çözülür (yaklaşım yok). Eşdeğerlik hacmi asit türünden bağımsızdır: 25,0 mL." }));
    ciz(); guncel();
  };

  W.denge = function (y) {
    const f = kutu(y, "Denge ve Le Châtelier", "N₂(g) + 3H₂(g) ⇌ 2NH₃(g), ΔH° = −92 kJ/mol");
    let durum = { c: Object.assign({}, DENGE.c0), T: DENGE.T0 };
    let onceki = null, zaman = null;
    const sonuc = canli();
    const tur = ["N2", "H2", "NH3"], ad = { N2: "N₂", H2: "H₂", NH3: "NH₃" };
    const W_ = 340, H_ = 168;
    const svg = sv("svg", { viewBox: `0 0 ${W_} ${H_}`, class: "kbe-svg", role: "img", "aria-label": "Derişim çubukları ve Q–K karşılaştırması" });
    const cub = {}, cubY = {}, cubD = {};
    tur.forEach((t, i) => {
      const x = 20 + i * 62;
      const zemin = sv("rect", { x, y: 14, width: 40, height: 110, rx: 4, class: "kbe-zemin" });
      cub[t] = sv("rect", { x, width: 40, rx: 4, class: "kbe-bar kbe-bar--" + (i + 1) });
      cubD[t] = sv("text", { x: x + 20, "text-anchor": "middle", class: "kbe-deger-yazi" });
      cubY[t] = sv("text", { x: x + 20, y: 140, "text-anchor": "middle", class: "kbe-etiket-yazi" }); cubY[t].textContent = "[" + ad[t] + "]";
      svg.append(zemin, cub[t], cubD[t], cubY[t]);
    });
    // Q–K ölçeği (log)
    const ox = 214, ow = 112;
    const lg = v => Math.max(-3, Math.min(3, Math.log10(v)));
    const olcek = sv("line", { x1: ox, x2: ox + ow, y1: 70, y2: 70, class: "kbe-taban" });
    const kIsa = sv("line", { y1: 50, y2: 90, class: "kbe-k-cizgi" });
    const kYaz = sv("text", { y: 44, "text-anchor": "middle", class: "kbe-etiket-yazi" });
    const qIsa = sv("circle", { r: 6, cy: 70, class: "kbe-nokta" });
    const qYaz = sv("text", { y: 108, "text-anchor": "middle", class: "kbe-etiket-yazi" });
    const ok = sv("text", { x: ox + ow / 2, y: 150, "text-anchor": "middle", class: "kbe-ok-yazi" });
    const baslikQ = sv("text", { x: ox + ow / 2, y: 18, "text-anchor": "middle", class: "kbe-eksen-ad" }); baslikQ.textContent = "Q ve K (log ölçek)";
    svg.append(olcek, kIsa, kYaz, qIsa, qYaz, ok, baslikQ);
    const ciz = () => {
      const max = Math.max(3, ...tur.map(t => durum.c[t]));
      tur.forEach(t => {
        const h = 110 * durum.c[t] / max;
        cub[t].setAttribute("y", 124 - h); cub[t].setAttribute("height", Math.max(1, h));
        cubD[t].setAttribute("y", 124 - h - 4); cubD[t].textContent = fmt(durum.c[t], 2);
      });
      const K = dengeK(durum.T), Q = dengeQ(durum.c);
      const sx = v => ox + ow / 2 + lg(v / DENGE.K0) / 3 * (ow / 2);
      kIsa.setAttribute("x1", sx(K)); kIsa.setAttribute("x2", sx(K));
      konum(kYaz, sx(K), 44, "K = " + K.toPrecision(2).replace(".", ","));
      qIsa.setAttribute("cx", sx(Q));
      konum(qYaz, sx(Q), 108, "Q = " + Q.toPrecision(2).replace(".", ","));
      const yon = kaymaYonu(Q, K);
      ok.textContent = yon === "ileri" ? "Q < K → ileri (→ NH₃)" : yon === "geri" ? "Q > K → geri (← N₂ + H₂)" : "Q = K → denge";
      return yon;
    };
    const ACIK = {
      "+N2": "N₂ eklendi: Q küçüldü.", "+H2": "H₂ eklendi: Q küçüldü.", "+NH3": "NH₃ eklendi: Q büyüdü.", "-NH3": "NH₃ uzaklaştırıldı: Q küçüldü.",
      "T+": "Sıcaklık arttı: tepkime ekzotermik olduğu için K küçülür (Q değişmez).", "T-": "Sıcaklık azaldı: ekzotermik tepkimede K büyür.",
      "P+": "Hacim yarıya indi: tüm derişimler 2 katı; gaz mol sayısı 4 → 2 olduğundan Q, 4'te birine düşer.",
      "P-": "Hacim 2 katı: derişimler yarıya iner; Q 4 katına çıkar.", "Ar": "Sabit hacimde argon: kısmi basınçlar ve derişimler değişmez, Q = K kalır."
    };
    function uygula(etki) {
      if (zaman) { clearTimeout(zaman); zaman = null; }
      if (etki === "sifir") { durum = { c: Object.assign({}, DENGE.c0), T: DENGE.T0 }; ciz(); sonuc.textContent = "Başlangıç dengesi (700 K)."; return; }
      if ((etki === "T-" && durum.T <= 500) || (etki === "T+" && durum.T >= 900)) { sonuc.textContent = "Sıcaklık 500–900 K aralığında tutulur."; return; }
      onceki = Object.assign({}, durum.c);
      durum = dengeBoz(durum, etki);
      const yon = ciz();
      sonuc.textContent = ACIK[etki] + " " + (yon === "ileri" ? "Q < K olduğu için denge ürünler yönüne (ileri) kayar." : yon === "geri" ? "Q > K olduğu için denge girenler yönüne (geri) kayar." : "Kayma olmaz.");
      if (yon !== "denge") zaman = setTimeout(() => {
        const yeni = dengeyeGetir(durum.c, dengeK(durum.T));
        durum.c = { N2: yeni.N2, H2: yeni.H2, NH3: yeni.NH3 };
        ciz();
        sonuc.textContent += " Yeni denge: [NH₃] " + fmt(onceki.NH3, 2) + " → " + fmt(durum.c.NH3, 2) + " M, T = " + durum.T + " K.";
      }, azHareket() ? 0 : 900);
    }
    const B = (m, e, a) => dugme(m, () => uygula(e), { "aria-label": a || m });
    f.append(
      el("div", { class: "kbe-cizim kbe-cizim--kisa" }, svg), sonuc,
      el("div", { class: "kbe-dugmeler", role: "group", "aria-label": "Derişim" }, B("+ N₂", "+N2", "N₂ ekle"), B("+ H₂", "+H2", "H₂ ekle"), B("+ NH₃", "+NH3", "NH₃ ekle"), B("− NH₃", "-NH3", "NH₃ uzaklaştır")),
      el("div", { class: "kbe-dugmeler", role: "group", "aria-label": "Sıcaklık ve basınç" }, B("T ↑", "T+", "Sıcaklığı 50 K artır"), B("T ↓", "T-", "Sıcaklığı 50 K azalt"), B("P ↑ (V/2)", "P+", "Hacmi yarıya indirerek basıncı artır"), B("P ↓ (2V)", "P-", "Hacmi iki katına çıkararak basıncı azalt"), B("+ Ar (sabit V)", "Ar", "Sabit hacimde argon ekle"), B("Sıfırla", "sifir")));
    ciz(); sonuc.textContent = "Başlangıç dengesi (700 K). Bir değişiklik seç; önce Q–K karşılaştırması, ardından yeni denge görünür.";
  };

  W.mb = function (y) {
    const f = kutu(y, "Maxwell–Boltzmann dağılımı", "Sıcaklık ve aktivasyon enerjisi");
    const g = grafik({ x: [0, 40], y: [0, 0.2], xt: [0, 10, 20, 30, 40], yt: [0, 0.1, 0.2], ybic: v => fmt(v, 1), xad: "Kinetik enerji (kJ/mol)", yad: "Molekül kesri", etiket: "Enerji dağılımı" });
    const alan = sv("path", { class: "kbe-alan" }); g.ic.appendChild(alan);
    const ref = cizgi(g, "kbe-s2 kbe-kesik"), egri = cizgi(g, "kbe-s1");
    const ea = sv("line", { class: "kbe-k-cizgi" }); g.ic.appendChild(ea);
    const eaY = yazi(g, "kbe-not-yazi");
    const sonuc = canli();
    const kT = kaydirici({ etiket: "Sıcaklık", min: 200, max: 1200, step: 10, deger: 300, bicim: v => v + " K", degisti: ciz });
    const kE = kaydirici({ etiket: "Aktivasyon enerjisi Ea", min: 5, max: 35, step: 1, deger: 15, bicim: v => v + " kJ/mol", degisti: ciz });
    function ciz() {
      const T = kT.deger(), Ea = kE.deger(), pts = [], rp = [];
      for (let E = 0; E <= 40.01; E += 0.25) { pts.push([E, mbYogunluk(E, T)]); rp.push([E, mbYogunluk(E, 300)]); }
      egri.setAttribute("d", g.yol(pts)); ref.setAttribute("d", g.yol(rp));
      const sag = pts.filter(q => q[0] >= Ea);
      alan.setAttribute("d", "M" + g.sx(Ea) + " " + g.sy(0) + g.yol([[Ea, mbYogunluk(Ea, T)]].concat(sag)).replace(/^M/, "L") + "L" + g.sx(40) + " " + g.sy(0) + "Z");
      ea.setAttribute("x1", g.sx(Ea)); ea.setAttribute("x2", g.sx(Ea)); ea.setAttribute("y1", g.sy(0)); ea.setAttribute("y2", g.sy(0.2));
      konum(eaY, g.sx(Ea) + 4, g.sy(0.185), "Ea");
      const fr = mbKesir(Ea, T), f300 = mbKesir(Ea, 300);
      sonuc.textContent = "T = " + T + " K: Ea'yı aşan moleküller " + (fr < 0.001 ? "%" + (fr * 100).toPrecision(2).replace(".", ",") : yuzde(fr, 1)) +
        (T !== 300 ? " (300 K'de " + (f300 < 0.001 ? "%" + (f300 * 100).toPrecision(2).replace(".", ",") : yuzde(f300, 1)) + ", " + fmt(fr / f300, 1) + " kat)" : "") + ". Eğrinin altındaki toplam alan hep 1'dir.";
    }
    f.append(el("div", { class: "kbe-kontrol" }, kT.sar, kE.sar), el("div", { class: "kbe-cizim" }, g.svg),
      lejant([["kbe-lj--1", "Seçilen sıcaklık"], ["kbe-lj--2 kbe-lj--kesik", "300 K (karşılaştırma)"], ["kbe-lj--alan", "E ≥ Ea kesri"]]), sonuc,
      el("p", { class: "kbe-ipucu", text: "Sıcaklık artınca tepe alçalır ve sağa kayar; Ea'yı aşan kesir hızla büyür. Katalizör eğriyi değil Ea çizgisini sola taşır." }));
    ciz();
  };

  W.gaz = function (y) {
    const f = kutu(y, "Gaz yasaları: PV = nRT", "Birini hesaplat, diğer üçünü değiştir");
    let bil = "P";
    const d = { P: 1.0, V: 24.6, T: 300, n: 1.0 };
    const AYAR = {
      P: { etiket: "Basınç P", min: 0.2, max: 10, step: 0.1, bic: v => fmt(v, 2) + " atm" },
      V: { etiket: "Hacim V", min: 2, max: 50, step: 0.5, bic: v => fmt(v, 1) + " L" },
      T: { etiket: "Sıcaklık T", min: 100, max: 1000, step: 10, bic: v => fmt(v, 0) + " K" },
      n: { etiket: "Madde miktarı n", min: 0.2, max: 4, step: 0.1, bic: v => fmt(v, 2) + " mol" }
    };
    const sonuc = canli();
    const kd = {};
    Object.keys(AYAR).forEach(k => {
      const a = AYAR[k];
      kd[k] = kaydirici({ etiket: a.etiket, min: a.min, max: a.max, step: a.step, deger: d[k], bicim: a.bic, degisti: v => { d[k] = v; hesap(); } });
    });
    const rid = yeniId("r");
    const radyo = el("fieldset", { class: "kbe-radyo" }, el("legend", { text: "Hesaplanan değişken" }),
      ["P", "V", "T", "n"].map(k => el("label", null, el("input", { type: "radio", name: rid, value: k, checked: k === bil, onchange: () => { bil = k; hesap(); } }), " " + k)));
    // Parçacık kutusu (SVG)
    const BW = 340, BH = 150;
    const svg = sv("svg", { viewBox: `0 0 ${BW} ${BH}`, class: "kbe-svg", role: "img", "aria-label": "Parçacık kutusu: genişlik hacmi, parçacık sayısı n'yi, hız sıcaklığı gösterir" });
    const kap = sv("rect", { x: 4, y: 4, height: BH - 8, rx: 6, class: "kbe-kap" });
    const piston = sv("rect", { y: 4, width: 6, height: BH - 8, rx: 2, class: "kbe-piston" });
    const pg = sv("g", { class: "kbe-parcacik" });
    svg.append(kap, pg, piston);
    let parc = [], genislik = 200, anim = null, gorunur = false;
    const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    function parcacikAyarla() {
      const N = Math.round(d.n * 12);
      while (parc.length < N) { const c = sv("circle", { r: 3.5 }); pg.appendChild(c); parc.push({ c, x: 10 + rnd() * 100, y: 10 + rnd() * (BH - 20), a: rnd() * 6.283 }); }
      while (parc.length > N) parc.pop().c.remove();
      genislik = 40 + (d.V / 50) * (BW - 60);
      kap.setAttribute("width", genislik); piston.setAttribute("x", 4 + genislik - 3);
      parc.forEach(q => { q.x = Math.min(q.x, genislik - 4); q.c.setAttribute("cx", q.x); q.c.setAttribute("cy", q.y); });
    }
    function adim() {
      const hiz = 0.9 * Math.sqrt(d.T / 300);
      parc.forEach(q => {
        q.x += Math.cos(q.a) * hiz; q.y += Math.sin(q.a) * hiz;
        if (q.x < 9 || q.x > genislik - 2) { q.a = Math.PI - q.a; q.x = Math.max(9, Math.min(genislik - 2, q.x)); }
        if (q.y < 9 || q.y > BH - 9) { q.a = -q.a; q.y = Math.max(9, Math.min(BH - 9, q.y)); }
        q.c.setAttribute("cx", q.x.toFixed(1)); q.c.setAttribute("cy", q.y.toFixed(1));
      });
      anim = gorunur && !document.hidden ? requestAnimationFrame(adim) : null;
    }
    const baslatAnim = () => { if (!anim && gorunur && !azHareket()) anim = requestAnimationFrame(adim); };
    if (typeof IntersectionObserver === "function") new IntersectionObserver(e => { gorunur = e[0].isIntersecting; baslatAnim(); }).observe(svg);
    document.addEventListener("visibilitychange", baslatAnim);
    function hesap() {
      const v = gazCoz(bil, d);
      d[bil] = v;
      Object.keys(kd).forEach(k => { kd[k].inp.disabled = k === bil; kd[k].sar.classList.toggle("kbe-kilitli", k === bil); });
      kd[bil].ayarla(Math.max(AYAR[bil].min, Math.min(AYAR[bil].max, v)));
      kd[bil].sar.querySelector("output").textContent = AYAR[bil].bic(v) + " (hesaplandı)";
      const disari = v < AYAR[bil].min || v > AYAR[bil].max;
      parcacikAyarla();
      sonuc.textContent = bil + " = " + AYAR[bil].bic(v) + (disari ? " — kaydırıcı aralığının dışında, değer yine de doğru." : "") +
        " (R = 0,08206 L·atm/(mol·K)). " + ({ P: "Hacim azalırsa çarpışmalar sıklaşır, P artar.", V: "Sabit P'de ısınan gaz genleşir (Charles).", T: "Sıkıştırılan gazın sabit P'de soğuması gerekir.", n: "Avogadro: aynı P, V, T → aynı mol sayısı." })[bil];
    }
    f.append(radyo, el("div", { class: "kbe-kontrol kbe-kontrol--2" }, kd.P.sar, kd.V.sar, kd.T.sar, kd.n.sar), el("div", { class: "kbe-cizim kbe-cizim--kisa" }, svg), sonuc,
      el("p", { class: "kbe-ipucu", text: "Kutu genişliği = V, parçacık sayısı ∝ n, hız ∝ √T. Azaltılmış hareket tercihinde parçacıklar durağan kalır." }));
    hesap();
  };

  W.pes = function (y) {
    const f = kutu(y, "PES gezgini", "İlk 20 element · bağlanma enerjisi (MJ/mol)");
    let i = 10;
    const g = grafik({ x: [0.3, 600], y: [0, 7], xlog: true, xters: true, xt: [500, 100, 10, 1, 0.5], xbic: v => fmt(v, v < 1 ? 1 : 0), yt: [0, 2, 4, 6], xad: "Bağlanma enerjisi (MJ/mol) — solda yüksek", yad: "Göreli e⁻ sayısı", etiket: "Fotoelektron spektrumu" });
    const tepeG = sv("g"); g.ust.appendChild(tepeG);
    const sonuc = canli();
    const tablo = el("table", { class: "kbe-tablo" });
    const sec = secim("Element", PES.map((e, j) => [j, (j + 1) + " " + e[0] + " — " + e[1]]), i, v => { i = +v; ciz(); });
    const ust = ["", "¹", "²", "³", "⁴", "⁵", "⁶"];
    function ciz() {
      tepeG.textContent = "";
      const [sem, ad, kab] = PES[i];
      kab.forEach(([alt, n, E], j) => {
        const x = g.sx(E), h = g.sy(0) - g.sy(n);
        tepeG.appendChild(sv("rect", { x: x - 4, y: g.sy(n), width: 8, height: h, rx: 3, class: "kbe-bar kbe-bar--" + ((j % 3) + 1) }));
        const t = sv("text", { x, y: g.sy(n) - 5, "text-anchor": "middle", class: "kbe-deger-yazi" }); t.textContent = alt + ust[n];
        tepeG.appendChild(t);
      });
      const konf = kab.map(([a, n]) => a + ust[n]).join(" ");
      const dis = kab[kab.length - 1];
      sonuc.textContent = sem + " (" + ad + ", Z = " + (i + 1) + "): " + konf + ". En sağdaki tepe (" + dis[0] + ", " + fmt(dis[2], 2) + " MJ/mol) değerlik elektronudur; birinci iyonlaşma enerjisine eşittir.";
      tablo.innerHTML = "<caption>Tepe verisi</caption><thead><tr><th scope=\"col\">Alt kabuk</th><th scope=\"col\">e⁻</th><th scope=\"col\">MJ/mol</th></tr></thead><tbody>" +
        kab.map(([a, n, E]) => "<tr><td>" + a + "</td><td>" + n + "</td><td>" + fmt(E, E < 10 ? 2 : 1) + "</td></tr>").join("") + "</tbody>";
    }
    const onc = dugme("◀ Önceki", () => { i = (i + 19) % 20; sec.s.value = i; ciz(); }, { "aria-label": "Önceki element" });
    const snr = dugme("Sonraki ▶", () => { i = (i + 1) % 20; sec.s.value = i; ciz(); }, { "aria-label": "Sonraki element" });
    f.append(el("div", { class: "kbe-kontrol kbe-kontrol--satir" }, sec.sar, el("div", { class: "kbe-dugmeler" }, onc, snr)), el("div", { class: "kbe-cizim" }, g.svg), sonuc,
      el("details", { class: "kbe-detay" }, el("summary", { text: "Tepe tablosu" }), tablo),
      el("p", { class: "kbe-ipucu", text: "Aynı kabuk için Z arttıkça tepe sola kayar (Coulomb çekimi ↑). 2p tepesi 2s'den sağdadır: 2p elektronları daha iyi perdelenir. Değerler yaklaşıktır." }));
    ciz();
  };

  /* ------------------------------------------------------------------ */
  /* 4) BİYOLOJİ                                                          */
  /* ------------------------------------------------------------------ */
  W.nufus = function (y) {
    const f = kutu(y, "Nüfus büyümesi: üstel ve lojistik", "N₀ = 10 birey");
    const N0 = 10;
    const g = grafik({ x: [0, 40], y: [0, 1200], xt: [0, 10, 20, 30, 40], yt: [0, 400, 800, 1200], ybic: v => fmt(v, 0), xad: "Zaman (nesil)", yad: "N", etiket: "Nüfus – zaman" });
    const us = cizgi(g, "kbe-s2 kbe-kesik"), lo = cizgi(g, "kbe-s1");
    const kc = sv("line", { class: "kbe-kilavuz" }); g.ic.appendChild(kc);
    const kY = yazi(g, "kbe-not-yazi", "end");
    const tc = sv("line", { class: "kbe-kilavuz kbe-kilavuz--2" }); g.ic.appendChild(tc);
    const nk = sv("circle", { r: 5, class: "kbe-nokta" }); g.ust.appendChild(nk);
    const sonuc = canli();
    const kr = kaydirici({ etiket: "Kişi başı büyüme hızı r", min: 0.05, max: 1, step: 0.01, deger: 0.3, bicim: v => fmt(v, 2), degisti: ciz });
    const kK = kaydirici({ etiket: "Taşıma kapasitesi K", min: 100, max: 1000, step: 50, deger: 800, bicim: v => fmt(v, 0) + " birey", degisti: ciz });
    const kt = kaydirici({ etiket: "Zaman t", min: 0, max: 40, step: 1, deger: 12, bicim: v => v + ". nesil", degisti: ciz });
    function ciz() {
      const r = kr.deger(), K = kK.deger(), t = kt.deger(), a = [], b = [];
      for (let x = 0; x <= 40; x += 0.25) { a.push([x, Math.min(5000, ustelN(N0, r, x))]); b.push([x, lojistikN(N0, r, K, x)]); }
      us.setAttribute("d", g.yol(a)); lo.setAttribute("d", g.yol(b));
      kc.setAttribute("x1", g.sx(0)); kc.setAttribute("x2", g.sx(40)); kc.setAttribute("y1", g.sy(K)); kc.setAttribute("y2", g.sy(K));
      konum(kY, g.sx(40) - 4, g.sy(K) - 5, "K = " + K);
      tc.setAttribute("x1", g.sx(t)); tc.setAttribute("x2", g.sx(t)); tc.setAttribute("y1", g.sy(0)); tc.setAttribute("y2", g.sy(1200));
      const Nl = lojistikN(N0, r, K, t), Ne = ustelN(N0, r, t);
      nk.setAttribute("cx", g.sx(t)); nk.setAttribute("cy", g.sy(Nl));
      const tYari = Math.log((K - N0) / N0) / r;
      sonuc.textContent = "t = " + t + ": lojistik N = " + fmt(Nl, 0) + ", üstel N = " + (Ne > 1e6 ? "1 milyonun üstünde" : fmt(Ne, 0)) +
        ". Lojistik hız dN/dt = rN(1 − N/K) = " + fmt(lojistikHiz(Nl, r, K), 1) + " birey/nesil. En hızlı büyüme N = K/2 = " + fmt(K / 2, 0) + " iken (t ≈ " + fmt(tYari, 1) + ").";
    }
    f.append(el("div", { class: "kbe-kontrol" }, kr.sar, kK.sar, kt.sar), el("div", { class: "kbe-cizim" }, g.svg),
      lejant([["kbe-lj--1", "Lojistik (dN/dt = rN(K − N)/K)"], ["kbe-lj--2 kbe-lj--kesik", "Üstel (dN/dt = rN)"]]), sonuc);
    ciz();
  };

  W.hw = function (y) {
    const f = kutu(y, "Hardy–Weinberg hesaplayıcı", "p kaydırıcısı + ki-kare kontrolü");
    const sonuc = canli(), kiSonuc = canli();
    const svg = sv("svg", { viewBox: "0 0 340 150", class: "kbe-svg", role: "img", "aria-label": "Genotip frekansları çubuk grafiği" });
    const ad = [["AA", "p²"], ["Aa", "2pq"], ["aa", "q²"]], bar = {}, yaz = {};
    ad.forEach(([k, e], i) => {
      const x = 30 + i * 100;
      svg.appendChild(sv("rect", { x, y: 10, width: 70, height: 100, rx: 4, class: "kbe-zemin" }));
      bar[k] = sv("rect", { x, width: 70, rx: 4, class: "kbe-bar kbe-bar--" + (i + 1) });
      yaz[k] = sv("text", { x: x + 35, "text-anchor": "middle", class: "kbe-deger-yazi" });
      const t = sv("text", { x: x + 35, y: 128, "text-anchor": "middle", class: "kbe-etiket-yazi" }); t.textContent = k + " (" + e + ")";
      svg.append(bar[k], yaz[k], t);
    });
    const kp = kaydirici({ etiket: "A alelinin frekansı p", min: 0.01, max: 0.99, step: 0.01, deger: 0.7, bicim: v => fmt(v, 2) + "  (q = " + fmt(1 - v, 2) + ")", degisti: () => { ciz(); ki(); } });
    function ciz() {
      const h = hw(kp.deger());
      ["AA", "Aa", "aa"].forEach(k => { const v = h[k]; bar[k].setAttribute("y", 110 - 100 * v); bar[k].setAttribute("height", Math.max(1, 100 * v)); yaz[k].setAttribute("y", 110 - 100 * v - 4); yaz[k].textContent = yuzde(v, 1); });
      sonuc.textContent = "p = " + fmt(h.p, 2) + ", q = " + fmt(h.q, 2) + " → AA " + yuzde(h.AA) + ", Aa " + yuzde(h.Aa) + ", aa " + yuzde(h.aa) + " (toplam %100). Taşıyıcılar (Aa) çekinik fenotipten " + fmt(h.Aa / h.aa, 1) + " kat fazla.";
    }
    const giris = {};
    const satir = ["AA", "Aa", "aa"].map((k, i) => {
      const id = yeniId("g");
      giris[k] = el("input", { type: "number", id, min: 0, max: 100000, step: 1, value: [38, 52, 10][i], inputmode: "numeric", class: "kbe-sayi" });
      giris[k].addEventListener("input", ki);
      return el("div", { class: "kbe-alan" }, el("label", { for: id, text: "Gözlenen " + k }), giris[k]);
    });
    function ki() {
      const o = ["AA", "Aa", "aa"].map(k => Math.max(0, Math.round(+giris[k].value || 0)));
      const N = o[0] + o[1] + o[2];
      if (!N) { kiSonuc.textContent = "Gözlenen sayıları gir."; return; }
      const h = hw(kp.deger()), e = [h.AA * N, h.Aa * N, h.aa * N];
      const x2 = kiKare(o, e), red = x2 > KRITIK_005[2];
      kiSonuc.textContent = "Beklenen (N = " + N + "): " + e.map(v => fmt(v, 1)).join(" / ") + ". χ² = Σ(O − E)²/E = " + fmt(x2, 2) + "; df = 2, kritik değer 5,99 → " +
        (red ? "H₀ reddedilir: popülasyon bu p ile Hardy–Weinberg dengesinde değil (bir koşul ihlal ediliyor olabilir)." : "H₀ reddedilemez: sapma şansla açıklanabilir.");
    }
    f.append(el("div", { class: "kbe-kontrol" }, kp.sar), el("div", { class: "kbe-cizim kbe-cizim--kisa" }, svg), sonuc,
      el("fieldset", { class: "kbe-alt-kutu" }, el("legend", { text: "Ki-kare mini kontrol (H₀: kaydırıcıdaki p)" }), el("div", { class: "kbe-kontrol kbe-kontrol--3" }, satir), kiSonuc,
        el("p", { class: "kbe-ipucu", text: "p hipotezden geldiği için df = sınıf − 1 = 2. p verinin kendisinden tahmin edilseydi df bir azalırdı (1)." })));
    ciz(); ki();
  };

  W.enzim = function (y) {
    const f = kutu(y, "Enzim aktivitesi", "Michaelis–Menten · sıcaklık · pH");
    const ENZ = { pepsin: { ad: "Pepsin (mide)", pH: 2 }, amilaz: { ad: "Tükürük amilazı", pH: 6.8 }, tripsin: { ad: "Tripsin (ince bağırsak)", pH: 8 } };
    const Km = 2, Vmax = 100, Topt = 37, Tden = 60;
    let enz = "amilaz";
    const g = grafik({ x: [0, 20], y: [0, 100], xt: [0, 5, 10, 15, 20], yt: [0, 50, 100], xad: "[S] substrat (mM)", yad: "Hız (% Vmax)", etiket: "Michaelis–Menten eğrisi" });
    const ref = cizgi(g, "kbe-s2 kbe-kesik"), egri = cizgi(g, "kbe-s1");
    const km = sv("line", { class: "kbe-kilavuz kbe-kilavuz--2" }); g.ic.appendChild(km);
    const kmY = yazi(g, "kbe-not-yazi");
    const nk = sv("circle", { r: 5, class: "kbe-nokta" }); g.ust.appendChild(nk);
    const mini = (x, ad, xt, fn) => {
      const m = grafik({ w: 165, h: 110, pad: { l: 26, r: 6, t: 8, b: 30 }, x, y: [0, 1], xt, yt: [0, 1], ybic: v => v ? "maks" : "0", xad: ad, etiket: ad + " – aktivite" });
      const c = cizgi(m, "kbe-s1"), n = sv("circle", { r: 4, class: "kbe-nokta" }); m.ust.appendChild(n);
      return { m, ciz(vv) { const p = []; for (let q = x[0]; q <= x[1] + 1e-9; q += (x[1] - x[0]) / 80) p.push([q, fn(q)]); c.setAttribute("d", m.yol(p)); n.setAttribute("cx", m.sx(vv)); n.setAttribute("cy", m.sy(fn(vv))); } };
    };
    const mT = mini([0, 80], "Sıcaklık (°C)", [0, 37, 80], T => enzimT(T, Topt, Tden));
    const mP = mini([0, 14], "pH", [0, 7, 14], p => enzimPH(p, ENZ[enz].pH));
    const sonuc = canli();
    const sec = secim("Enzim", Object.keys(ENZ).map(k => [k, ENZ[k].ad + " — optimum pH " + fmt(ENZ[k].pH, 1)]), enz, v => { enz = v; kp.ayarla(ENZ[v].pH); ciz(); });
    const kS = kaydirici({ etiket: "Substrat derişimi [S]", min: 0, max: 20, step: 0.5, deger: 2, bicim: v => fmt(v, 1) + " mM", degisti: ciz });
    const kT = kaydirici({ etiket: "Sıcaklık", min: 0, max: 80, step: 1, deger: 37, bicim: v => v + " °C", degisti: ciz });
    const kp = kaydirici({ etiket: "pH", min: 0, max: 14, step: 0.1, deger: 6.8, bicim: v => fmt(v, 1), degisti: ciz });
    function ciz() {
      const S = kS.deger(), T = kT.deger(), ph = kp.deger();
      const ft = enzimT(T, Topt, Tden), fp = enzimPH(ph, ENZ[enz].pH), Ve = Vmax * ft * fp;
      const a = [], b = [];
      for (let s = 0; s <= 20.01; s += 0.2) { a.push([s, mm(s, Ve, Km)]); b.push([s, mm(s, Vmax, Km)]); }
      egri.setAttribute("d", g.yol(a)); ref.setAttribute("d", g.yol(b));
      km.setAttribute("x1", g.sx(Km)); km.setAttribute("x2", g.sx(Km)); km.setAttribute("y1", g.sy(0)); km.setAttribute("y2", g.sy(50));
      konum(kmY, g.sx(Km) + 4, g.sy(50) - 4, "Km: v = Vmax/2");
      const v = mm(S, Ve, Km);
      nk.setAttribute("cx", g.sx(S)); nk.setAttribute("cy", g.sy(v));
      mT.ciz(T); mP.ciz(ph);
      let not = "";
      if (T > 45) not = " 45 °C üstünde hidrojen bağları kopar, aktif bölge bozulur (denatürasyon).";
      else if (T < 20) not = " Düşük sıcaklıkta çarpışmalar seyrek: enzim bozulmaz, yalnızca yavaşlar.";
      if (Math.abs(ph - ENZ[enz].pH) > 2.5) not += " Optimumdan uzak pH, aktif bölgedeki R gruplarının yükünü değiştirir.";
      if (S >= 15 && Ve > 1) not += " Yüksek [S]'de enzimler doyar: hız Vmax'a yaklaşır, [S] artışı az etki eder.";
      sonuc.textContent = "Hız = " + fmt(v, 1) + " (% maks. Vmax). Etkin Vmax = " + fmt(Ve, 0) + " (sıcaklık katsayısı " + fmt(ft, 2) + " × pH katsayısı " + fmt(fp, 2) + ")." + not;
    }
    f.append(el("div", { class: "kbe-kontrol" }, sec.sar, kS.sar, kT.sar, kp.sar), el("div", { class: "kbe-cizim" }, g.svg),
      lejant([["kbe-lj--1", "Seçilen koşullar"], ["kbe-lj--2 kbe-lj--kesik", "Optimum koşullar"]]),
      el("div", { class: "kbe-mini" }, mT.m.svg, mP.m.svg), sonuc,
      el("p", { class: "kbe-ipucu", text: "Model öğretim amaçlıdır: Km = 2 mM, optimum 37 °C, 60 °C'de tamamen denatüre. Yarışmalı inhibitör Km'yi büyütür, Vmax'ı değiştirmez." }));
    ciz();
  };

  W.piramit = function (y) {
    const f = kutu(y, "Enerji piramidi: %10 kuralı", "Trofik düzeyler arası aktarım");
    const AD = ["Üreticiler", "Birincil tüketiciler", "İkincil tüketiciler", "Üçüncül tüketiciler"];
    const svg = sv("svg", { viewBox: "0 0 340 180", class: "kbe-svg", role: "img", "aria-label": "Enerji piramidi çubukları" });
    const bar = [], yz = [];
    for (let i = 0; i < 4; i++) {
      const yy = 140 - i * 40;
      bar.push(sv("rect", { y: yy, height: 32, rx: 4, class: "kbe-bar kbe-bar--" + ((i % 3) + 1) }));
      yz.push(sv("text", { x: 170, y: yy + 21, "text-anchor": "middle", class: "kbe-pir-yazi" }));
      svg.append(bar[i], yz[i]);
    }
    const sonuc = canli();
    const kE = kaydirici({ etiket: "Üreticilerin net enerjisi", min: 1000, max: 50000, step: 1000, deger: 20000, bicim: v => fmt(v, 0) + " kJ/m²/yıl", degisti: ciz });
    const kv = kaydirici({ etiket: "Aktarım verimi", min: 5, max: 20, step: 1, deger: 10, bicim: v => "%" + v, degisti: ciz });
    function ciz() {
      const E = piramit(kE.deger(), kv.deger() / 100, 4);
      E.forEach((v, i) => {
        const w = Math.max(3, 320 * v / E[0]);
        bar[i].setAttribute("x", 170 - w / 2); bar[i].setAttribute("width", w);
        yz[i].textContent = AD[i] + ": " + fmt(v, v < 100 ? 1 : 0);
        yz[i].setAttribute("class", "kbe-pir-yazi" + (w < 200 ? " kbe-pir-yazi--dis" : ""));
        if (w < 200) yz[i].setAttribute("y", 140 - i * 40 + 21);
      });
      sonuc.textContent = "Üçüncül tüketicilere ulaşan enerji: " + fmt(E[3], 1) + " kJ/m²/yıl = üreticilerin " + yuzde(E[3] / E[0], 2) +
        ". Her basamakta kalan %" + (100 - kv.deger()) + " çoğunlukla hücresel solunumla ısı olarak kaybolur; bir kısmı sindirilmeden atılır ya da ayrıştırıcılara gider.";
    }
    f.append(el("div", { class: "kbe-kontrol" }, kE.sar, kv.sar), el("div", { class: "kbe-cizim kbe-cizim--kisa" }, svg), sonuc,
      el("p", { class: "kbe-ipucu", text: "Çubuk genişlikleri doğrusal ölçektedir; üst basamakların ne kadar daraldığı gerçek orandır. Bu yüzden besin zincirleri genellikle 4–5 basamağı geçmez." }));
    ciz();
  };

  /* ------------------------------------------------------------------ */
  /* 5) EKONOMİ                                                           */
  /* ------------------------------------------------------------------ */
  W.arztalep = function (y) {
    const f = kutu(y, "Arz–talep kaydırıcı", "Talep P = A − Q · Arz P = C + Q");
    const A0 = 120, C0 = 30;
    let dA = 0, dC = 0;
    const g = grafik({ x: [0, 100], y: [0, 150], xt: [0, 25, 50, 75, 100], yt: [0, 50, 100, 150], xad: "Miktar Q", yad: "Fiyat P", etiket: "Arz–talep grafiği" });
    const tf = sv("path", { class: "kbe-alan kbe-alan--1" }), uf = sv("path", { class: "kbe-alan kbe-alan--2" });
    g.ic.append(tf, uf);
    const D0 = cizgi(g, "kbe-s0 kbe-kesik"), S0 = cizgi(g, "kbe-s0 kbe-kesik"), D = cizgi(g, "kbe-s1"), S = cizgi(g, "kbe-s2");
    const pL = sv("line", { class: "kbe-kilavuz" }), qL = sv("line", { class: "kbe-kilavuz" }); g.ic.append(pL, qL);
    const nk = sv("circle", { r: 5, class: "kbe-nokta" }); g.ust.appendChild(nk);
    const dY = yazi(g, "kbe-seri-yazi"), sY = yazi(g, "kbe-seri-yazi");
    const sonuc = canli();
    const kD = kaydirici({ etiket: "Talep kayması", min: -25, max: 25, step: 1, deger: 0, bicim: v => (v > 0 ? "+" : "") + v + (v ? (v > 0 ? " (sağa)" : " (sola)") : " (yok)"), degisti: v => { dA = v; ciz(); } });
    const kS = kaydirici({ etiket: "Arz kayması", min: -25, max: 25, step: 1, deger: 0, bicim: v => (v > 0 ? "+" : "") + v + (v ? (v > 0 ? " (sağa)" : " (sola)") : " (yok)"), degisti: v => { dC = v; ciz(); } });
    const ONAY = [
      ["Gelir ↑ (normal mal)", 15, null, "Gelir artışı normal malın talebini artırır."],
      ["Girdi maliyeti ↑", null, -15, "Girdi maliyeti artınca her fiyatta daha az arz edilir."],
      ["Teknoloji gelişir", null, 15, "Verimlilik artışı arzı sağa kaydırır."],
      ["İkame malın fiyatı ↓", -15, null, "Ucuzlayan ikame mala geçilir: talep azalır."],
      ["Sıfırla", 0, 0, "Başlangıç dengesi."]
    ];
    let neden = "";
    const bas = ONAY.map(([m, a, c, n]) => dugme(m, () => { if (a != null) { dA = a; kD.ayarla(a); } if (c != null) { dC = c; kS.ayarla(c); } neden = n + " "; ciz(); neden = ""; }));
    function ciz() {
      const A = A0 + dA, C = C0 - dC;
      const e0 = arzTalep(A0, 1, C0, 1), e = arzTalep(A, 1, C, 1);
      D0.setAttribute("d", g.yol([[0, A0], [A0, 0]])); S0.setAttribute("d", g.yol([[0, C0], [120, C0 + 120]]));
      D0.style.display = S0.style.display = (dA || dC) ? "" : "none";
      D.setAttribute("d", g.yol([[0, A], [A, 0]])); S.setAttribute("d", g.yol([[0, C], [120, C + 120]]));
      tf.setAttribute("d", `M${g.sx(0)} ${g.sy(A)}L${g.sx(e.Q)} ${g.sy(e.P)}L${g.sx(0)} ${g.sy(e.P)}Z`);
      uf.setAttribute("d", `M${g.sx(0)} ${g.sy(C)}L${g.sx(e.Q)} ${g.sy(e.P)}L${g.sx(0)} ${g.sy(e.P)}Z`);
      pL.setAttribute("x1", g.sx(0)); pL.setAttribute("x2", g.sx(e.Q)); pL.setAttribute("y1", g.sy(e.P)); pL.setAttribute("y2", g.sy(e.P));
      qL.setAttribute("x1", g.sx(e.Q)); qL.setAttribute("x2", g.sx(e.Q)); qL.setAttribute("y1", g.sy(e.P)); qL.setAttribute("y2", g.sy(0));
      nk.setAttribute("cx", g.sx(e.Q)); nk.setAttribute("cy", g.sy(e.P));
      konum(dY, g.sx(Math.min(95, A - 8)) , g.sy(Math.max(8, 8)) - 2, "D");
      konum(sY, g.sx(Math.min(95, 150 - C - 10)), g.sy(Math.min(145, C + Math.min(95, 150 - C - 10))) - 6, "S");
      const ok = (a, b) => Math.abs(a - b) < 1e-9 ? "değişmedi" : a > b ? "↑" : "↓";
      sonuc.textContent = neden + "Denge: P* = " + fmt(e.P, 1) + ", Q* = " + fmt(e.Q, 1) + " (P " + ok(e.P, e0.P) + ", Q " + ok(e.Q, e0.Q) + "). Tüketici fazlası = " + fmt(e.TF, 1) + ", üretici fazlası = " + fmt(e.UF, 1) + ".";
    }
    f.append(el("div", { class: "kbe-dugmeler" }, bas), el("div", { class: "kbe-kontrol kbe-kontrol--2" }, kD.sar, kS.sar), el("div", { class: "kbe-cizim" }, g.svg),
      lejant([["kbe-lj--1", "Talep D"], ["kbe-lj--2", "Arz S"], ["kbe-lj--0 kbe-lj--kesik", "Başlangıç eğrileri"], ["kbe-lj--alan1", "Tüketici fazlası"], ["kbe-lj--alan2", "Üretici fazlası"]]), sonuc);
    ciz();
  };

  W.esneklik = function (y) {
    const f = kutu(y, "Esneklik hesaplayıcı", "Orta nokta (midpoint) yöntemi");
    const sonuc = canli();
    const alan = {}, varsay = { P1: 10, Q1: 100, P2: 12, Q2: 70 };
    const ad = { P1: "Fiyat P₁", Q1: "Miktar Q₁", P2: "Fiyat P₂", Q2: "Miktar Q₂" };
    const kutular = Object.keys(varsay).map(k => {
      const id = yeniId("e");
      alan[k] = el("input", { type: "number", id, min: 0, step: "any", value: varsay[k], class: "kbe-sayi", inputmode: "decimal" });
      alan[k].addEventListener("input", hesap);
      return el("div", { class: "kbe-alan" }, el("label", { for: id, text: ad[k] }), alan[k]);
    });
    const ORN = [["Lüks restoran", [50, 200, 60, 120]], ["İnsülin", [40, 1000, 60, 980]], ["Birim esnek", [10, 120, 12, 100]]];
    const orn = ORN.map(([m, v]) => dugme(m, () => { ["P1", "Q1", "P2", "Q2"].forEach((k, i) => { alan[k].value = v[i]; }); hesap(); }));
    function hesap() {
      const v = ["P1", "Q1", "P2", "Q2"].map(k => +alan[k].value);
      if (v.some(x => !(x > 0)) || v[0] === v[2]) { sonuc.textContent = "Pozitif değerler gir; iki fiyat farklı olmalı."; return; }
      const e = esneklik(v[0], v[1], v[2], v[3]);
      const ttur = { esnek: "esnek (|E| > 1): fiyat ve toplam gelir ters yönde", inelastik: "inelastik (|E| < 1): fiyat ve toplam gelir aynı yönde", birim: "birim esnek (|E| = 1): toplam gelir değişmez" }[e.tur];
      const tg = e.TG2 > e.TG1 + 1e-9 ? "arttı" : e.TG2 < e.TG1 - 1e-9 ? "azaldı" : "değişmedi";
      sonuc.textContent = "%ΔQ = " + fmt(e.yQ * 100, 1) + ", %ΔP = " + fmt(e.yP * 100, 1) + " → |Ed| = " + fmt(e.E, 2) + ": " + ttur + ". Toplam gelir " + fmt(e.TG1, 0) + " → " + fmt(e.TG2, 0) + " (" + tg + ").";
    }
    f.append(el("div", { class: "kbe-dugmeler" }, orn), el("div", { class: "kbe-kontrol kbe-kontrol--2" }, kutular), sonuc,
      el("p", { class: "kbe-ipucu", text: "Orta nokta: %ΔQ = (Q₂ − Q₁)/[(Q₁ + Q₂)/2]. Yön ne olursa olsun aynı sonucu verir. Talep esnekliği mutlak değerle yorumlanır." }));
    hesap();
  };

  W.adas = function (y) {
    const f = kutu(y, "AD–AS modeli", "Şoklar, kısa dönem ve uzun dönem");
    let a = 200, c = 0, a0 = 200, c0 = 0;
    const g = grafik({ x: [60, 140], y: [60, 160], xt: [60, 80, 100, 120, 140], yt: [60, 100, 140], xad: "Reel GSYH (Y)", yad: "Fiyat düzeyi (PL)", etiket: "AD–AS grafiği" });
    const lr = sv("line", { class: "kbe-k-cizgi" }); g.ic.appendChild(lr);
    const AD0 = cizgi(g, "kbe-s0 kbe-kesik"), AS0 = cizgi(g, "kbe-s0 kbe-kesik"), AD = cizgi(g, "kbe-s1"), AS = cizgi(g, "kbe-s2");
    const nk = sv("circle", { r: 5, class: "kbe-nokta" }); g.ust.appendChild(nk);
    const lY = yazi(g, "kbe-seri-yazi", "middle"), adY = yazi(g, "kbe-seri-yazi"), asY = yazi(g, "kbe-seri-yazi");
    const sonuc = canli();
    function ciz(neden) {
      lr.setAttribute("x1", g.sx(ADAS_YF)); lr.setAttribute("x2", g.sx(ADAS_YF)); lr.setAttribute("y1", g.sy(60)); lr.setAttribute("y2", g.sy(160));
      konum(lY, g.sx(ADAS_YF), g.sy(156), "LRAS");
      AD0.setAttribute("d", g.yol([[40, a0 - 40], [160, a0 - 160]])); AS0.setAttribute("d", g.yol([[40, c0 + 40], [160, c0 + 160]]));
      AD0.style.display = a !== a0 ? "" : "none"; AS0.style.display = c !== c0 ? "" : "none";
      AD.setAttribute("d", g.yol([[40, a - 40], [160, a - 160]])); AS.setAttribute("d", g.yol([[40, c + 40], [160, c + 160]]));
      konum(adY, g.sx(Math.min(136, a - 64)), g.sy(Math.max(64, 64)) - 4, "AD");
      konum(asY, g.sx(Math.min(132, 156 - c)) + 4, g.sy(Math.min(156, 156)) + 10, "SRAS");
      const e = adas(a, c);
      nk.setAttribute("cx", g.sx(e.Y)); nk.setAttribute("cy", g.sy(e.P));
      const acik = e.Y > ADAS_YF + 1e-9 ? "enflasyonist açık (Y > Yf): işsizlik doğal oranın altında" : e.Y < ADAS_YF - 1e-9 ? "resesyon açığı (Y < Yf): işsizlik doğal oranın üstünde" : "tam istihdam (Y = Yf)";
      sonuc.textContent = (neden ? neden + " " : "") + "Y = " + fmt(e.Y, 0) + ", PL = " + fmt(e.P, 0) + " → " + acik + ".";
    }
    const S = (m, fn, n) => dugme(m, () => { fn(); ciz(n); });
    f.append(el("div", { class: "kbe-cizim" }, g.svg),
      lejant([["kbe-lj--1", "AD"], ["kbe-lj--2", "SRAS"], ["kbe-lj--k", "LRAS (Yf = 100)"], ["kbe-lj--0 kbe-lj--kesik", "Önceki konum"]]), sonuc,
      el("div", { class: "kbe-dugmeler" },
        S("AD ↑ (G ↑ / vergi ↓)", () => { a0 = a; c0 = c; a += 20; }, "AD sağa kaydı."),
        S("AD ↓ (tüketici güveni ↓)", () => { a0 = a; c0 = c; a -= 20; }, "AD sola kaydı."),
        S("SRAS ↓ (petrol şoku)", () => { a0 = a; c0 = c; c += 20; }, "Negatif arz şoku: SRAS sola kaydı (stagflasyon: PL ↑, Y ↓)."),
        S("SRAS ↑ (girdi fiyatı ↓)", () => { a0 = a; c0 = c; c -= 20; }, "Pozitif arz şoku: SRAS sağa kaydı."),
        S("Uzun döneme geç", () => { a0 = a; c0 = c; c = adasUzunDonem(a); }, "Uzun dönem: nominal ücretler ve girdi fiyatları uyum sağlar, SRAS ekonomi Yf'ye dönene dek kayar."),
        S("Sıfırla", () => { a = a0 = 200; c = c0 = 0; }, "Başlangıç: uzun dönem dengesi.")));
    ciz("Başlangıç: uzun dönem dengesi.");
  };

  W.para = function (y) {
    const f = kutu(y, "Para piyasası", "Merkez bankası araçları (sınırlı rezerv modeli)");
    let M = 100, M0 = 100;
    const g = grafik({ x: [0, 200], y: [0, 10], xt: [0, 50, 100, 150, 200], yt: [0, 2, 4, 6, 8, 10], ybic: v => "%" + v, xad: "Para miktarı (milyar)", yad: "Nominal faiz", etiket: "Para piyasası grafiği" });
    const md = cizgi(g, "kbe-s1"), ms0 = sv("line", { class: "kbe-s0 kbe-kesik" }), ms = sv("line", { class: "kbe-s2" });
    g.ic.append(ms0, ms);
    const iL = sv("line", { class: "kbe-kilavuz" }); g.ic.appendChild(iL);
    const nk = sv("circle", { r: 5, class: "kbe-nokta" }); g.ust.appendChild(nk);
    const msY = yazi(g, "kbe-seri-yazi", "middle"), mdY = yazi(g, "kbe-seri-yazi", "end");
    const sonuc = canli();
    md.setAttribute("d", g.yol([[0, 10], [190, 0.5]]));
    konum(mdY, g.sx(190), g.sy(1.6), "MD");
    function ciz(neden) {
      const i = paraFaizi(M), i0 = paraFaizi(M0);
      [[ms, M], [ms0, M0]].forEach(([e, m]) => { e.setAttribute("x1", g.sx(m)); e.setAttribute("x2", g.sx(m)); e.setAttribute("y1", g.sy(0)); e.setAttribute("y2", g.sy(10)); });
      ms0.style.display = M !== M0 ? "" : "none";
      konum(msY, g.sx(M), g.sy(9.6), "MS");
      iL.setAttribute("x1", g.sx(0)); iL.setAttribute("x2", g.sx(M)); iL.setAttribute("y1", g.sy(i)); iL.setAttribute("y2", g.sy(i));
      nk.setAttribute("cx", g.sx(M)); nk.setAttribute("cy", g.sy(i));
      const zincir = M > M0 ? " Zincir: MS ↑ → i ↓ → yatırım (I) ↑ ve faize duyarlı tüketim ↑ → AD ↑ → reel GSYH ↑, PL ↑ (genişletici)." : M < M0 ? " Zincir: MS ↓ → i ↑ → I ↓ → AD ↓ → enflasyon baskısı azalır (daraltıcı)." : "";
      sonuc.textContent = (neden ? neden + " " : "") + "Nominal faiz: %" + fmt(i0, 1) + " → %" + fmt(i, 1) + "." + zincir;
    }
    const aksiyon = (m, d, n) => dugme(m, () => { M0 = M; M = Math.max(30, Math.min(180, M + d)); ciz(n); });
    f.append(el("div", { class: "kbe-cizim" }, g.svg), lejant([["kbe-lj--1", "Para talebi MD"], ["kbe-lj--2", "Para arzı MS"], ["kbe-lj--0 kbe-lj--kesik", "Önceki MS"]]), sonuc,
      el("div", { class: "kbe-dugmeler" },
        aksiyon("Tahvil al (OMO)", 20, "Açık piyasa alımı: bankalara rezerv girer."),
        aksiyon("Tahvil sat (OMO)", -20, "Açık piyasa satışı: rezervler çekilir."),
        aksiyon("İskonto oranı ↓", 10, "Bankalar merkez bankasından daha ucuz borçlanır."),
        aksiyon("İskonto oranı ↑", -10, "Borçlanma pahalılaşır."),
        aksiyon("Zorunlu karşılık ↓", 15, "Fazla rezerv ve para çarpanı (1/rr) büyür."),
        aksiyon("Zorunlu karşılık ↑", -15, "Para çarpanı küçülür."),
        dugme("Sıfırla", () => { M = M0 = 100; ciz("Başlangıç."); })),
      el("p", { class: "kbe-ipucu", text: "Bu grafik sınırlı rezerv çerçevesidir. Bol rezerv çerçevesinde Fed faizi esas olarak rezerv faizini (IORB) değiştirerek yönetir; AP Macro ikisini de bekler." }));
    ciz("Başlangıç.");
  };

  W.maliyet = function (y) {
    const f = kutu(y, "Maliyet eğrileri: MC · ATC · AVC", "TC = 100 + 20q − 3q² + 0,2q³");
    const g = grafik({ x: [0, 15], y: [0, 60], xt: [0, 5, 10, 15], yt: [0, 20, 40, 60], xad: "Miktar q", yad: "Birim maliyet / fiyat", etiket: "Maliyet eğrileri" });
    const pts = fn => { const p = []; for (let q = 0.5; q <= 15.01; q += 0.1) p.push([q, fn(q)]); return p; };
    cizgi(g, "kbe-s1").setAttribute("d", g.yol(pts(malMC)));
    cizgi(g, "kbe-s2").setAttribute("d", g.yol(pts(malATC)));
    cizgi(g, "kbe-s3").setAttribute("d", g.yol(pts(malAVC)));
    konum(yazi(g, "kbe-seri-yazi"), g.sx(12.6), g.sy(malMC(12.6)), "MC");
    konum(yazi(g, "kbe-seri-yazi"), g.sx(14.2), g.sy(malATC(14.2)) - 6, "ATC");
    konum(yazi(g, "kbe-seri-yazi"), g.sx(14.2), g.sy(malAVC(14.2)) + 14, "AVC");
    const pL = sv("line", { class: "kbe-k-cizgi" }), qL = sv("line", { class: "kbe-kilavuz" }); g.ic.append(pL, qL);
    const kar = sv("rect", { class: "kbe-alan kbe-alan--1" }); g.ic.insertBefore(kar, g.ic.firstChild);
    const nk = sv("circle", { r: 5, class: "kbe-nokta" }); g.ust.appendChild(nk);
    const sonuc = canli();
    const kq = kaydirici({ etiket: "Üretim miktarı q", min: 1, max: 15, step: 0.5, deger: 6, bicim: v => fmt(v, 1), degisti: ciz });
    const kp = kaydirici({ etiket: "Piyasa fiyatı P = MR (tam rekabet)", min: 5, max: 45, step: 1, deger: 25, bicim: v => fmt(v, 0) + " ₺", degisti: ciz });
    const git = dugme("q'yu MR = MC noktasına getir", () => { const q = karMaksQ(kp.deger()); if (q) { kq.ayarla(Math.round(Math.min(15, q) * 2) / 2); ciz(); } });
    function ciz() {
      const q = kq.deger(), P = kp.deger();
      pL.setAttribute("x1", g.sx(0)); pL.setAttribute("x2", g.sx(15)); pL.setAttribute("y1", g.sy(P)); pL.setAttribute("y2", g.sy(P));
      qL.setAttribute("x1", g.sx(q)); qL.setAttribute("x2", g.sx(q)); qL.setAttribute("y1", g.sy(0)); qL.setAttribute("y2", g.sy(60));
      nk.setAttribute("cx", g.sx(q)); nk.setAttribute("cy", g.sy(malMC(q)));
      const atc = malATC(q), kr = (P - atc) * q;
      kar.setAttribute("x", g.sx(0)); kar.setAttribute("width", g.sx(q) - g.sx(0));
      kar.setAttribute("y", g.sy(Math.max(P, atc))); kar.setAttribute("height", Math.abs(g.sy(P) - g.sy(atc)));
      kar.setAttribute("class", "kbe-alan " + (kr >= 0 ? "kbe-alan--2" : "kbe-alan--3"));
      const qs = karMaksQ(P);
      const karar = P < MIN_AVC ? "P < min AVC (" + fmt(MIN_AVC, 2) + "): kısa dönemde üretimi durdur (shutdown)." :
        "Kâr maksimize eden miktar: MR = MC → q* ≈ " + fmt(qs, 2) + (P < malATC(qs) ? " (zarar var ama P ≥ AVC: üretmeye devam)." : ".");
      sonuc.textContent = "q = " + fmt(q, 1) + ": MC = " + fmt(malMC(q), 2) + ", AVC = " + fmt(malAVC(q), 2) + ", ATC = " + fmt(atc, 2) + ", TC = " + fmt(MAL.FC + malVC(q), 1) +
        ". Kâr = (P − ATC)·q = " + fmt(kr, 1) + ". " + karar;
    }
    f.append(el("div", { class: "kbe-kontrol kbe-kontrol--2" }, kq.sar, kp.sar), el("div", { class: "kbe-dugmeler" }, git), el("div", { class: "kbe-cizim" }, g.svg),
      lejant([["kbe-lj--1", "MC"], ["kbe-lj--2", "ATC"], ["kbe-lj--3", "AVC"], ["kbe-lj--k", "P = MR"]]), sonuc,
      el("p", { class: "kbe-ipucu", text: "MC, AVC'yi ve ATC'yi en düşük noktalarından keser. ATC ile AVC arasındaki fark AFC = 100/q'dur ve q arttıkça daralır." }));
    ciz();
  };

  /* ------------------------------------------------------------------ */
  /* 6) CS A — KOD İZLEYİCİ                                               */
  /* ------------------------------------------------------------------ */
  W.kodiz = function (y) {
    const f = kutu(y, "Kod izleyici (Java)", "Adım adım çalıştır, değişken tablosunu izle");
    let k = 0, a = 0, adimlar = KODLAR[0].adimlar();
    const sekme = el("div", { class: "kbe-sekmeler", role: "group", "aria-label": "Kod parçası" });
    const kod = el("pre", { class: "kbe-kod", tabindex: "0", "aria-label": "Java kodu" });
    const tablo = el("table", { class: "kbe-tablo" });
    const konsol = el("pre", { class: "kbe-konsol", "aria-label": "Konsol çıktısı" });
    const not = canli();
    const sayacE = el("span", { class: "kbe-sayac" });
    const geri = dugme("◀ Geri", () => git(a - 1), { "aria-label": "Önceki adım" });
    const ileri = dugme("İleri ▶", () => git(a + 1), { "aria-label": "Sonraki adım", class: "kbe-btn kbe-btn--ana" });
    const bas = dugme("Başa dön", () => git(0));
    const son = dugme("Sona git", () => git(adimlar.length - 1));
    const sekmeler = KODLAR.map((kd, i) => dugme(kd.ad, () => sec(i), { "aria-pressed": String(i === 0) }));
    sekme.append(...sekmeler);
    function sec(i) {
      k = i; adimlar = KODLAR[i].adimlar(); sekmeler.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
      kod.innerHTML = "";
      KODLAR[i].satirlar.forEach((s, j) => kod.appendChild(el("span", { class: "kbe-kod-satir", "data-no": j + 1 }, s)));
      git(0);
    }
    function git(n) {
      a = Math.max(0, Math.min(adimlar.length - 1, n));
      const s = adimlar[a];
      kod.querySelectorAll(".kbe-kod-satir").forEach(e => { const ak = +e.dataset.no === s.satir; e.classList.toggle("kbe-kod-satir--aktif", ak); if (ak) e.setAttribute("aria-current", "step"); else e.removeAttribute("aria-current"); });
      const v = Object.keys(s.v);
      tablo.innerHTML = "<caption>Değişkenler</caption><thead><tr><th scope=\"col\">Ad</th><th scope=\"col\">Değer</th></tr></thead><tbody>" +
        (v.length ? v.map(n2 => "<tr><td><code>" + n2 + "</code></td><td><code>" + String(s.v[n2]).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</code></td></tr>").join("") : "<tr><td colspan=\"2\">—</td></tr>") + "</tbody>";
      konsol.textContent = s.out || " ";
      sayacE.textContent = "Adım " + (a + 1) + " / " + adimlar.length + " · satır " + s.satir;
      not.textContent = s.not;
      geri.disabled = a === 0; ileri.disabled = a === adimlar.length - 1;
    }
    kod.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); git(a + 1); } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); git(a - 1); } });
    f.append(sekme, el("div", { class: "kbe-iz" }, el("div", null, kod, el("p", { class: "kbe-ipucu", text: "Kod alanındayken ← → tuşlarıyla da ilerleyebilirsin." })),
      el("div", null, tablo, el("p", { class: "kbe-etiket", text: "Konsol" }), konsol)),
      el("div", { class: "kbe-dugmeler kbe-dugmeler--iz" }, bas, geri, sayacE, ileri, son), not);
    sec(0);
  };

  /* ------------------------------------------------------------------ */
  /* 7) ENGLISH LANGUAGE                                                  */
  /* ------------------------------------------------------------------ */
  const METIN = [
    ["(1) I have spent ", null], ["eleven summers as a night-shift nurse at Riverside Clinic", "konusmaci"], [", and I have never seen ", null],
    ["a July like this one", "baglam"], [". (2) Last Tuesday, ", null],
    ["when the cooling center closed at six because of budget cuts, three of our elderly neighbors were carried into my ward by midnight", "durum"],
    [". (3) ", null], ["You, the readers of this paper, vote on the library levy next month", "dinleyici"], ["; I am asking you to ", null],
    ["vote yes so the center can stay open after dark", "amac"], [". (4) A city that cools its stadium for a weekend game can surely cool a room for its grandparents.", null]
  ];
  const ROL = {
    konusmaci: { ad: "Speaker (konuşmacı)", dogru: "Deneyimli bir gece vardiyası hemşiresi", yanlis: ["Belediye başkanı", "Klinik müdürü"], neden: "\"eleven summers as a night-shift nurse\" ifadesi deneyime dayalı ethos kurar." },
    dinleyici: { ad: "Audience (dinleyici)", dogru: "Gazetenin oy verecek okurları", yanlis: ["Hastanedeki hastalar", "Şehir meclisi üyeleri"], neden: "\"You, the readers of this paper, vote on the library levy\" doğrudan okura seslenir." },
    amac: { ad: "Purpose (amaç)", dogru: "Okurları vergi önerisine evet oyu vermeye ikna etmek", yanlis: ["Sıcak hava dalgası hakkında bilgi vermek", "Kliniği eleştirmek"], neden: "\"vote yes so the center can stay open after dark\": eylem çağrısı." },
    durum: { ad: "Exigence (tetikleyici durum)", dogru: "Bütçe kesintisiyle erken kapanan serinleme merkezi ve hastaneye kaldırılan yaşlılar", yanlis: ["Hemşirenin terfi alması", "Yeni bir stadyumun açılması"], neden: "Metni şimdi yazdıran olay geçen salı yaşanan kapanış ve sonuçlarıdır." },
    baglam: { ad: "Context (bağlam)", dogru: "Rekor sıcak bir yaz ve yaklaşan yerel oylama", yanlis: ["Kış tatili", "Ulusal seçim kampanyası"], neden: "\"a July like this one\" ve \"next month\" zamanı ve ortamı belirler." }
  };
  W.retorik = function (y) {
    const f = kutu(y, "Retorik durum kurucu", "Speaker · Audience · Purpose · Exigence · Context");
    const metin = el("blockquote", { class: "kbe-metin", lang: "en" });
    METIN.forEach(([t, r]) => metin.appendChild(r ? el("span", { class: "kbe-parca", "data-rol": r, tabindex: "0", title: ROL[r].ad }, t) : document.createTextNode(t)));
    const not = el("p", { class: "kbe-ipucu", text: "Özgün kısa metin: yerel gazeteye yazılmış bir okur mektubu (2026). Bir satırın üzerine gel ya da odaklan: metindeki ilgili kısım vurgulanır." });
    const vurgula = (r, ac) => metin.querySelectorAll('[data-rol="' + r + '"]').forEach(e => e.classList.toggle("kbe-parca--vurgu", ac));
    const sonuc = canli();
    const secimler = {};
    const satirlar = Object.keys(ROL).map((r, i) => {
      const id = yeniId("r");
      const sec = [ROL[r].dogru].concat(ROL[r].yanlis);
      const sirali = [sec[(i) % 3], sec[(i + 1) % 3], sec[(i + 2) % 3]];
      const s = el("select", { id, class: "kbe-select" }, el("option", { value: "", text: "Seç…" }), sirali.map(t => el("option", { value: t, text: t })));
      secimler[r] = s;
      const satir = el("div", { class: "kbe-alan kbe-rol", "data-rol": r }, el("label", { for: id, text: ROL[r].ad }), s, el("span", { class: "kbe-geri", "aria-live": "polite" }));
      ["mouseenter", "focusin"].forEach(ev => satir.addEventListener(ev, () => vurgula(r, true)));
      ["mouseleave", "focusout"].forEach(ev => satir.addEventListener(ev, () => vurgula(r, false)));
      return satir;
    });
    metin.querySelectorAll(".kbe-parca").forEach(p => {
      const r = p.dataset.rol;
      ["mouseenter", "focus"].forEach(ev => p.addEventListener(ev, () => { vurgula(r, true); sonuc.textContent = ROL[r].ad + ": " + ROL[r].neden; }));
      ["mouseleave", "blur"].forEach(ev => p.addEventListener(ev, () => vurgula(r, false)));
    });
    const kontrol = dugme("Kontrol et", () => {
      let d = 0;
      satirlar.forEach(s => {
        const r = s.dataset.rol, ok = secimler[r].value === ROL[r].dogru;
        if (ok) d++;
        s.classList.toggle("kbe-dogru", ok); s.classList.toggle("kbe-yanlis", !ok);
        s.querySelector(".kbe-geri").textContent = ok ? "✓ Doğru" : "✗ " + ROL[r].neden;
      });
      sonuc.textContent = d + " / 5 doğru." + (d === 5 ? " Harika: tezinde bu durumu (exigence + audience) yazarın seçimlerine bağla." : " İpucu: metindeki vurgulu ifadelere bak.");
    }, { class: "kbe-btn kbe-btn--ana" });
    f.append(metin, not, el("div", { class: "kbe-kontrol kbe-kontrol--2" }, satirlar), el("div", { class: "kbe-dugmeler" }, kontrol), sonuc);
  };

  /** Sıralanabilir liste: sürükle-bırak + klavye (↑/↓ düğmeleri). */
  function siralanabilir(ogeler, duyur) {
    const ul = el("ol", { class: "kbe-sira" });
    let surukle = null;
    const yenile = () => Array.from(ul.children).forEach((li, i) => {
      li.querySelector(".kbe-sira-no").textContent = i + 1;
      li.querySelector(".kbe-yukari").disabled = i === 0;
      li.querySelector(".kbe-asagi").disabled = i === ul.children.length - 1;
    });
    const tasi = (li, yon) => {
      const hedef = yon < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!hedef) return;
      if (yon < 0) ul.insertBefore(li, hedef); else ul.insertBefore(hedef, li);
      yenile();
      (yon < 0 ? li.querySelector(".kbe-yukari") : li.querySelector(".kbe-asagi")).focus();
      if (li.querySelector(yon < 0 ? ".kbe-yukari" : ".kbe-asagi").disabled) li.querySelector(yon < 0 ? ".kbe-asagi" : ".kbe-yukari").focus();
      duyur(li.dataset.kisa + ": " + (Array.from(ul.children).indexOf(li) + 1) + ". sıraya taşındı.");
    };
    ogeler.forEach(o => {
      const li = el("li", { class: "kbe-sira-oge", draggable: "true", "data-id": o.id, "data-kisa": o.kisa },
        el("span", { class: "kbe-sira-no", "aria-hidden": "true" }),
        el("span", { class: "kbe-sira-metin", lang: o.lang || null }, o.metin),
        el("span", { class: "kbe-sira-btn" },
          dugme("↑", () => tasi(li, -1), { class: "kbe-btn kbe-btn--ikon kbe-yukari", "aria-label": "Yukarı taşı: " + o.kisa }),
          dugme("↓", () => tasi(li, 1), { class: "kbe-btn kbe-btn--ikon kbe-asagi", "aria-label": "Aşağı taşı: " + o.kisa })));
      li.addEventListener("dragstart", e => { surukle = li; li.classList.add("kbe-sira-oge--tasiniyor"); try { e.dataTransfer.setData("text/plain", o.id); e.dataTransfer.effectAllowed = "move"; } catch (_) {} });
      li.addEventListener("dragend", () => { li.classList.remove("kbe-sira-oge--tasiniyor"); surukle = null; yenile(); });
      li.addEventListener("dragover", e => {
        if (!surukle || surukle === li) return;
        e.preventDefault();
        const r = li.getBoundingClientRect();
        ul.insertBefore(surukle, e.clientY > r.top + r.height / 2 ? li.nextSibling : li);
      });
      li.addEventListener("drop", e => e.preventDefault());
      ul.appendChild(li);
    });
    yenile();
    return { ul, sira: () => Array.from(ul.children).map(li => li.dataset.id), ogeler: () => Array.from(ul.children) };
  }

  const TEZLER = [
    { id: "a", kisa: "Tez A", metin: "By grounding her plea in eleven years of night shifts and closing with a pointed contrast between a cooled stadium and an uncooled room for \"grandparents,\" the nurse recasts a routine levy vote as a test of the city's priorities, urging readers to vote yes.", neden: "En güçlü: savunulabilir bir iddia, belirli seçimler (ethos, kapanış karşıtlığı) ve bu seçimlerin amaca nasıl hizmet ettiği (oyu bir öncelik sınavına dönüştürmek)." },
    { id: "b", kisa: "Tez B", metin: "The nurse uses her personal experience and a comparison to convince readers to vote for the levy.", neden: "Kabul edilebilir ama genel: seçimleri adlandırıyor, bunların NASIL ikna ettiğini açıklamıyor. Satır A puanı alabilir, gövdeyi zayıf yönlendirir." },
    { id: "c", kisa: "Tez C", metin: "In her letter, the nurse uses ethos, pathos, and logos.", neden: "Zayıf: yalnızca çekicilikleri listeliyor; amaç ve savunulabilir bir iddia yok. Rubrikte tez puanı almaz." },
    { id: "d", kisa: "Tez D", metin: "Cooling centers are important, and every city should pay to keep them open.", neden: "Görev dışı: retorik analiz yerine konunun kendisi hakkında görüş bildiriyor (argument essay'e kayıyor)." }
  ];
  W.tez = function (y) {
    const f = kutu(y, "Tez gücü sıralayıcı", "Hemşirenin mektubu için 4 retorik analiz tezi");
    const sonuc = canli();
    const karisik = [TEZLER[2], TEZLER[0], TEZLER[3], TEZLER[1]];
    const s = siralanabilir(karisik, m => { sonuc.textContent = m; });
    const kontrol = dugme("Sıralamamı kontrol et", () => {
      const dogru = ["a", "b", "c", "d"], sr = s.sira();
      let d = 0;
      s.ogeler().forEach((li, i) => {
        const ok = sr[i] === dogru[i]; if (ok) d++;
        li.classList.toggle("kbe-dogru", ok); li.classList.toggle("kbe-yanlis", !ok);
        let ac = li.querySelector(".kbe-aciklama");
        if (!ac) { ac = el("span", { class: "kbe-aciklama" }); li.querySelector(".kbe-sira-metin").appendChild(ac); }
        const t = TEZLER.find(x => x.id === li.dataset.id);
        ac.textContent = (ok ? "✓ " : "✗ Doğru sıra: " + (dogru.indexOf(t.id) + 1) + ". — ") + t.neden;
      });
      sonuc.textContent = d + " / 4 tez doğru sırada." + (d === 4 ? " Güçlü tez = iddia + seçimler + amaç." : " Ölçüt: Savunulabilir mi? Seçimleri adlandırıyor mu? Amaçla bağlantı kuruyor mu?");
    }, { class: "kbe-btn kbe-btn--ana" });
    f.append(el("p", { class: "kbe-ipucu", text: "En güçlüden en zayıfa sırala. Sürükleyebilir ya da ↑ ↓ düğmelerini kullanabilirsin." }), s.ul, el("div", { class: "kbe-dugmeler" }, kontrol), sonuc);
  };

  const PARAGRAF = [
    { id: "1", kisa: "İddia cümlesi", metin: "The nurse first earns the right to be heard by presenting herself as a witness rather than an activist." },
    { id: "2", kisa: "Kanıt bağlamı", metin: "Before she mentions the levy at all, she reminds readers of her long service at the clinic." },
    { id: "3", kisa: "Gömülü kanıt", metin: "She has spent \"eleven summers as a night-shift nurse,\" and she has \"never seen a July like this one.\"" },
    { id: "4", kisa: "Yorum (commentary)", metin: "Because her claim rests on years of first-hand observation, readers who might dismiss a political appeal are more likely to trust her account of the crisis." },
    { id: "5", kisa: "Teze bağlantı", metin: "This credibility prepares the audience to accept her later request as practical common sense, not partisanship." }
  ];
  W.akis = function (y) {
    const f = kutu(y, "Line of reasoning: paragrafı kur", "5 cümleyi mantıklı sıraya diz");
    const sonuc = canli();
    const karisik = [PARAGRAF[3], PARAGRAF[0], PARAGRAF[4], PARAGRAF[2], PARAGRAF[1]];
    const s = siralanabilir(karisik.map(p => Object.assign({ lang: "en" }, p)), m => { sonuc.textContent = m; });
    const kontrol = dugme("Paragrafı kontrol et", () => {
      const sr = s.sira();
      let d = 0;
      s.ogeler().forEach((li, i) => {
        const ok = sr[i] === String(i + 1); if (ok) d++;
        li.classList.toggle("kbe-dogru", ok); li.classList.toggle("kbe-yanlis", !ok);
        let ac = li.querySelector(".kbe-aciklama");
        if (!ac) { ac = el("span", { class: "kbe-aciklama" }); li.querySelector(".kbe-sira-metin").appendChild(ac); }
        ac.textContent = (ok ? "✓ " : "✗ ") + li.dataset.kisa + (ok ? "" : " — doğru yeri " + li.dataset.id + ". sıra");
      });
      sonuc.textContent = d + " / 5 cümle doğru yerde." + (d === 5 ? " İddia → bağlam → kanıt → yorum → teze bağlantı: Satır B'de 4 puanın yolu budur." : " Kanıt, yorumdan önce gelmeli; yorum kanıtın NEDEN etkili olduğunu açıklar.");
    }, { class: "kbe-btn kbe-btn--ana" });
    f.append(el("p", { class: "kbe-ipucu", text: "Özgün bir gövde paragrafı karıştırıldı. Sürükle ya da ↑ ↓ ile sırala, sonra kontrol et." }), s.ul, el("div", { class: "kbe-dugmeler" }, kontrol), sonuc);
  };

  /* ------------------------------------------------------------------ */
  /* 8) KENDİNİ DENE + AKILDA KAL (ünite kutusu)                          */
  /* ------------------------------------------------------------------ */
  // Her soru: [soru, [şıklar], doğru indeks, [şık başına geri bildirim]]
  const BIRIM = {
    "chem-u1": {
      ad: "Unit 1: Atomic Structure and Properties",
      akil: ["Mol, kütle ile tanecik sayısını bağlar: n = m / M, 1 mol = 6,022 × 10²³ tanecik.", "Kütle spektrumunda tepe yüksekliği izotop bolluğunu verir; ortalama atom kütlesi bolluk ağırlıklı ortalamadır.", "PES'te tepe konumu bağlanma enerjisini, tepe yüksekliği o alt kabuktaki elektron sayısını gösterir.", "Periyotta soldan sağa Zeff artar: atom yarıçapı küçülür, iyonlaşma enerjisi genelde artar.", "Coulomb yasası: çekim ∝ q₁q₂ / r²; yük büyük ve mesafe kısa ise enerji yüksektir."],
      sorular: [
        ["Bir elementin PES spektrumunda tepeler 1s (en yüksek enerji), 2s ve 2p'dir; 2p tepesi 2s'nin üç katı yüksekliktedir. Element hangisidir?", ["Neon", "Oksijen", "Karbon", "Sodyum"], 0, ["Doğru: 2s² 2p⁶ → 2p tepesi 2s'nin 3 katı (6/2).", "Oksijende 2p⁴: oran 4/2 = 2 olurdu.", "Karbonda 2p²: tepeler eşit yükseklikte olurdu.", "Sodyumda 3s tepesi de bulunurdu."]],
        ["Mg'nin birinci iyonlaşma enerjisinin Al'dan büyük olmasının en iyi açıklaması nedir?", ["Al'daki çıkan elektron 3p alt kabuğundadır; 3s'ten daha yüksek enerjilidir ve 3s elektronlarınca kısmen perdelenir.", "Al'ın çekirdek yükü Mg'den küçüktür.", "Mg'nin atom yarıçapı Al'dan büyüktür.", "Al'da elektronlar eşleşmiş olduğundan itilirler."], 0, ["Doğru: 3p elektronu daha zayıf bağlıdır.", "Yanlış: Al'ın Z'si 13, Mg'ninki 12.", "Büyük yarıçap IE'yi düşürür, açıklamayı ters çevirir.", "Al'ın tek 3p elektronu eşleşmemiştir; bu açıklama O–N için geçerlidir."]]
      ]
    },
    "chem-u2": {
      ad: "Unit 2: Compound Structure and Properties",
      akil: ["Elektronegatiflik farkı arttıkça bağın iyonik karakteri artar; keskin bir sınır yoktur.", "Potansiyel enerji eğrisinin minimumu bağ uzunluğunu, derinliği bağ enerjisini verir.", "Formal yük = değerlik e⁻ − (bağ yapmamış e⁻ + bağ sayısı); en iyi Lewis yapısı formal yükleri sıfıra yaklaştırır.", "VSEPR: elektron bölgesi sayısı geometriyi belirler; ortaklanmamış çiftler bağ açılarını daraltır.", "Ara-yer (interstitial) alaşımlarda küçük atomlar boşluklara girer, metal sertleşir; yer-değiştirme alaşımlarında benzer boyutlu atomlar yer değiştirir."],
      sorular: [["NH₃ molekülünün geometrisi ve yaklaşık bağ açısı nedir?", ["Üçgen piramit, ~107°", "Düzlem üçgen, 120°", "Dörtyüzlü, 109,5°", "Açısal, 104,5°"], 0, ["Doğru: 4 elektron bölgesi, 1 ortaklanmamış çift.", "Ortaklanmamış çift düzlemi bozar.", "109,5° elektron geometrisidir; ortaklanmamış çift açıyı daraltır.", "104,5° iki ortaklanmamış çiftli H₂O içindir."]]]
    },
    "chem-u3": {
      ad: "Unit 3: Properties of Substances and Mixtures",
      akil: ["IMF gücü kaynama noktasını belirler: London (her molekül) < dipol–dipol < hidrojen bağı (N, O, F'ye bağlı H).", "Polarlanabilirlik elektron bulutu büyüdükçe artar; büyük apolar moleküllerde London kuvvetleri baskın olabilir.", "İdeal gaz: PV = nRT; sıcaklık daima Kelvin cinsinden.", "Ortalama kinetik enerji yalnızca sıcaklığa bağlıdır; aynı T'de hafif gazlar daha hızlıdır.", "Gerçek gazlar yüksek basınç ve düşük sıcaklıkta idealden sapar (IMF ve tanecik hacmi)."],
      sorular: [
        ["Aynı sıcaklıkta He ve Ar gazları için hangisi doğrudur?", ["Ortalama kinetik enerjileri eşittir; He atomları ortalamada daha hızlıdır.", "Ar'ın ortalama kinetik enerjisi daha büyüktür.", "Her iki gazın atomları aynı ortalama hızdadır.", "He'nin ortalama kinetik enerjisi daha büyüktür."], 0, ["Doğru: KE ∝ T; KE = ½mv² olduğundan hafif atom daha hızlı.", "KE kütleye değil sıcaklığa bağlıdır.", "Aynı KE'de hafif olan daha hızlıdır.", "KE kütleden bağımsızdır."]],
        ["Sabit n ve V'de bir gazın sıcaklığı 300 K'den 600 K'e çıkarılırsa basınç nasıl değişir?", ["İki katına çıkar", "Yarıya iner", "Değişmez", "Dört katına çıkar"], 0, ["Doğru: P ∝ T (Gay-Lussac).", "Ters orantı yok; P ile T doğru orantılı.", "T değişince çarpışmaların şiddeti ve sıklığı artar.", "Kare bağıntısı yok."]]
      ]
    },
    "chem-u4": {
      ad: "Unit 4: Chemical Reactions",
      akil: ["Net iyonik denklemde seyirci iyonlar yazılmaz; yalnızca değişime uğrayan türler kalır.", "Sınırlayıcı reaktif, mol oranına göre en az ürün veren reaktiftir.", "Yüzde verim = gerçek / kuramsal × 100.", "Titrasyonda eşdeğerlik noktası: eklenen mol baz = başlangıçtaki mol asit (stokiyometrik oran).", "Redoks: yükseltgenen tür e⁻ verir (yükseltgenme basamağı artar), indirgenen tür e⁻ alır."],
      sorular: [["2,0 mol H₂ ve 2,0 mol O₂ tepkimeye girer: 2H₂ + O₂ → 2H₂O. Sınırlayıcı reaktif ve oluşan su nedir?", ["H₂; 2,0 mol H₂O", "O₂; 4,0 mol H₂O", "H₂; 1,0 mol H₂O", "O₂; 2,0 mol H₂O"], 0, ["Doğru: 2,0 mol H₂ yalnızca 1,0 mol O₂ kullanır.", "4,0 mol H₂O için 4,0 mol H₂ gerekirdi.", "2:2 oranı: 2,0 mol H₂ → 2,0 mol H₂O.", "O₂ artandır (1,0 mol fazla)."]]]
    },
    "chem-u5": {
      ad: "Unit 5: Kinetics",
      akil: ["Hız yasası deneysel bulunur: rate = k[A]^m[B]^n; üsler denklem katsayılarından okunmaz (yalnız temel basamakta okunur).", "Birinci derece: ln[A] – t doğrusal, t½ = 0,693 / k ve derişimden bağımsız.", "İkinci derece: 1/[A] – t doğrusal; sıfırıncı derece: [A] – t doğrusal.", "Çarpışma modeli: etkili çarpışma için yeterli enerji (≥ Ea) ve uygun yönelim gerekir.", "Katalizör daha düşük Ea'lı yeni bir mekanizma sunar; ΔH ve K'yi değiştirmez."],
      sorular: [["[A] iki katına çıkınca başlangıç hızı dört katına çıkıyor. A'ya göre tepkime derecesi nedir?", ["2", "1", "4", "0"], 0, ["Doğru: 2ⁿ = 4 → n = 2.", "Birinci derecede hız 2 katına çıkardı.", "2⁴ = 16 olurdu.", "Sıfırıncı derecede hız değişmezdi."]]]
    },
    "chem-u6": {
      ad: "Unit 6: Thermochemistry",
      akil: ["Ekzotermik: ΔH < 0, sistem çevreye ısı verir; endotermik: ΔH > 0.", "q = mcΔT; kalorimetrede q(tepkime) = −q(çözelti).", "Faz değişimi sırasında sıcaklık sabittir; enerji IMF'yi değiştirmeye gider.", "Bağ enerjisiyle: ΔH = Σ(kırılan bağlar) − Σ(oluşan bağlar).", "Hess yasası: tepkime ters çevrilirse ΔH işaret değiştirir, katsayıyla çarpılırsa ΔH de çarpılır."],
      sorular: [["50,0 g su 20,0 °C'den 30,0 °C'ye ısınıyor (c = 4,18 J/g·°C). Suyun aldığı ısı nedir?", ["2090 J", "209 J", "4180 J", "20,9 J"], 0, ["Doğru: q = 50,0 × 4,18 × 10,0 = 2090 J.", "Bir sıfır kaybolmuş: ΔT = 10,0 °C.", "Bu 100 g için olurdu.", "Birimleri yeniden kontrol et."]]]
    },
    "chem-u7": {
      ad: "Unit 7: Equilibrium",
      akil: ["Dengede ileri ve geri hızlar eşittir; derişimler sabittir ama eşit olmak zorunda değildir.", "Q < K → ileri; Q > K → geri; Q = K → denge.", "Saf katı ve sıvılar K ifadesine yazılmaz.", "Tepkime ters çevrilirse K → 1/K; katsayılar n ile çarpılırsa K → Kⁿ.", "Yalnızca sıcaklık K'yi değiştirir; derişim ve basınç değişimi Q'yu değiştirir."],
      sorular: [
        ["N₂ + 3H₂ ⇌ 2NH₃ (ΔH < 0) dengesindeyken sıcaklık artırılıyor. Ne olur?", ["K azalır ve denge geri yöne kayar.", "K artar ve denge ileri yöne kayar.", "K değişmez, denge ileri kayar.", "Q azalır, denge ileri kayar."], 0, ["Doğru: ekzotermik tepkimede ısı 'ürün' gibidir.", "Bu endotermik tepkime için geçerli olurdu.", "Sıcaklık K'yi değiştiren tek etkendir.", "Sıcaklık değişimi anında Q'yu değiştirmez, K'yi değiştirir."]],
        ["Aynı dengede hacim yarıya indiriliyor (sabit T). Q'ya ne olur?", ["Q küçülür (Q < K), denge ileri kayar.", "Q büyür, denge geri kayar.", "Q ve K birlikte büyür.", "Hiçbir şey değişmez."], 0, ["Doğru: derişimler 2 katı; Q, 2² / 2⁴ = 1/4 katına iner.", "Gaz mol sayısı ürün tarafında az olduğu için tersi olur.", "K sabit sıcaklıkta değişmez.", "Δn(gaz) ≠ 0 olduğu için kayma olur."]]
      ]
    },
    "chem-u8": {
      ad: "Unit 8: Acids and Bases",
      akil: ["25 °C'de Kw = [H⁺][OH⁻] = 1,0 × 10⁻¹⁴ ve pH + pOH = 14.", "Zayıf asit: [H⁺] ≈ √(Ka·C), %5 kuralı ile kontrol.", "Yarı-eşdeğerlik noktasında [HA] = [A⁻] ve pH = pKa.", "Zayıf asit–kuvvetli baz titrasyonunda eşdeğerlik pH'ı 7'den büyüktür (A⁻ hidrolizi).", "Tampon kapasitesi, HA ve A⁻ miktarları büyük ve birbirine yakınken en yüksektir."],
      sorular: [
        ["25,0 mL 0,100 M CH₃COOH (Ka = 1,8 × 10⁻⁵) 0,100 M NaOH ile titre ediliyor. 12,5 mL NaOH eklendiğinde pH nedir?", ["4,74", "7,00", "2,87", "8,72"], 0, ["Doğru: yarı-eşdeğerlik → pH = pKa = −log(1,8 × 10⁻⁵).", "7,00 kuvvetli asit–kuvvetli baz eşdeğerliğidir.", "2,87 başlangıç pH'ıdır.", "8,72 eşdeğerlik noktasıdır (25,0 mL)."]],
        ["Hangi karışım bir tampondur?", ["0,10 M HF + 0,10 M NaF", "0,10 M HCl + 0,10 M NaCl", "0,10 M NaOH + 0,10 M NaCl", "0,10 M HF + 0,10 M HCl"], 0, ["Doğru: zayıf asit ve konjuge bazı.", "HCl kuvvetli asit; Cl⁻ anlamlı baz değildir.", "Konjuge çift yok.", "İkisi de asit; konjuge baz yok."]]
      ]
    },
    "chem-u9": {
      ad: "Unit 9: Thermodynamics and Electrochemistry",
      akil: ["ΔG° = ΔH° − TΔS°; ΔG° < 0 ise süreç termodinamik olarak kendiliğindendir (favorable).", "ΔG° = −RT ln K: ΔG° < 0 ⇔ K > 1.", "ΔG° = −nFE°: galvanik hücrede E° > 0.", "Anotta yükseltgenme, katotta indirgenme olur (her iki hücre türünde de).", "Faraday: yük q = I·t; mol e⁻ = q / 96 485 C."],
      sorular: [["ΔH° > 0 ve ΔS° > 0 olan bir süreç için hangisi doğrudur?", ["Yalnızca yüksek sıcaklıkta kendiliğindendir.", "Her sıcaklıkta kendiliğindendir.", "Hiçbir sıcaklıkta kendiliğinden değildir.", "Yalnızca düşük sıcaklıkta kendiliğindendir."], 0, ["Doğru: T büyüyünce −TΔS terimi ΔH'yi yener.", "Bu ΔH < 0, ΔS > 0 içindir.", "Bu ΔH > 0, ΔS < 0 içindir.", "Bu ΔH < 0, ΔS < 0 içindir."]]]
    },
    "bio-u1": {
      ad: "Unit 1: Chemistry of Life",
      akil: ["Su polar bir moleküldür; hidrojen bağları kohezyon, adezyon, yüksek özgül ısı ve yüzey gerilimini açıklar.", "Polimerler dehidrasyon sentezi ile kurulur, hidroliz ile yıkılır.", "Proteinin birincil yapısı amino asit dizisidir; R grupları katlanmayı belirler.", "Nükleik asitler 5' → 3' yönlüdür; zincirler antiparaleldir.", "G–C çiftinde 3, A–T çiftinde 2 hidrojen bağı vardır: G–C oranı yüksek DNA daha kararlıdır."],
      sorular: [["Bir proteinde tek bir amino asidin değişmesi neden işlevi bozabilir?", ["Birincil yapı değişir; R grubu etkileşimleri ve dolayısıyla katlanma ve şekil değişebilir.", "Peptit bağları hidrojen bağlarına dönüşür.", "Protein bir lipide dönüşür.", "Yalnızca dördüncül yapı etkilenir, işlev etkilenmez."], 0, ["Doğru: yapı → işlev.", "Peptit bağının türü değişmez.", "Monomer türü değişmez.", "Değişiklik tüm yapı seviyelerini etkileyebilir."]]]
    },
    "bio-u2": {
      ad: "Unit 2: Cell Structure and Function",
      akil: ["Hücre büyüdükçe yüzey alanı / hacim oranı küçülür; madde alışverişi verimsizleşir.", "Endomembran sistemi: ER → Golgi → veziküller → zar ya da salgı.", "Pasif taşıma derişim farkı yönünde ve ATP'siz; aktif taşıma (ör. Na⁺/K⁺ pompası) ATP harcar.", "Su, su potansiyeli yüksekten düşüğe akar: Ψ = Ψs + Ψp, Ψs = −iCRT.", "Endosimbiyoz kanıtı: mitokondri ve kloroplastın çift zarı, kendi dairesel DNA'sı ve 70S ribozomları."],
      sorular: [["Bir bitki hücresi saf suya konuyor. Ne olur?", ["Su hücreye girer; hücre turgor kazanır, hücre çeperi patlamayı önler.", "Hücre su kaybeder ve plazmoliz olur.", "Su hareketi olmaz.", "Hücre patlar (liziz)."], 0, ["Doğru: saf suyun Ψ'si (0) hücreninkinden yüksektir.", "Plazmoliz hipertonik ortamda olur.", "Ψ farkı vardır.", "Hayvan hücresi patlayabilir; bitki hücresini çeper korur."]]]
    },
    "bio-u3": {
      ad: "Unit 3: Cellular Energetics",
      akil: ["Enzimler aktivasyon enerjisini düşürür; ΔG'yi değiştirmez.", "Sıcaklık ve pH optimumdan uzaklaşınca aktif bölgenin şekli bozulabilir (denatürasyon).", "Yarışmalı inhibitör aktif bölgeye bağlanır ve yüksek [S] ile aşılabilir; yarışmasız inhibitör allosterik bölgeye bağlanır.", "Kemiozmoz: H⁺ gradyanı ATP sentaz üzerinden geri akarken ATP üretir (mitokondri ve kloroplast).", "O₂ ETC'nin son elektron alıcısıdır; O₂ yoksa fermentasyon NAD⁺'yı yeniler."],
      sorular: [
        ["Substrat derişimi çok yüksekken tepkime hızı artık artmıyor. Nedeni nedir?", ["Tüm aktif bölgeler doludur (enzim doygunluğu); hız Vmax'a ulaşmıştır.", "Enzimler denatüre olmuştur.", "Substrat inhibitör gibi davranır.", "Aktivasyon enerjisi yükselmiştir."], 0, ["Doğru: Michaelis–Menten platosu.", "Denatürasyon sıcaklık/pH ile olur, [S] ile değil.", "Genel durumda substrat inhibitör değildir.", "Ea enzim varlığında sabittir."]],
        ["Yarışmalı bir inhibitör eklenince hangisi beklenir?", ["Yüksek [S]'de hız yine Vmax'a yaklaşır.", "Vmax kalıcı olarak düşer, [S] artışı işe yaramaz.", "Enzim denatüre olur.", "Tepkimenin ΔG'si pozitif olur."], 0, ["Doğru: substrat inhibitörle yarışıp onu geçebilir.", "Bu yarışmasız inhibisyonun özelliğidir.", "İnhibitör yapıyı bozmaz.", "Enzimler ΔG'yi değiştirmez."]]
      ]
    },
    "bio-u4": {
      ad: "Unit 4: Cell Communication and Cell Cycle",
      akil: ["Sinyal yolu: alım (reseptör) → iletim (kaskad, ikincil haberciler) → yanıt.", "Kaskadlar sinyali yükseltir; bir ligand çok sayıda ürün molekülüne yol açabilir.", "Negatif geri bildirim dengeyi korur (ör. kan şekeri); pozitif geri bildirim yanıtı büyütür (ör. doğum sancısı).", "Hücre döngüsü G1, S, G2 ve M evrelerinden oluşur; kontrol noktaları siklin–CDK kompleksleriyle yönetilir.", "p53 gibi tümör baskılayıcıların kaybı kontrolsüz bölünmeye (kansere) yol açabilir."],
      sorular: [["Bir mutasyon, reseptör ligand olmadan da sürekli aktif kalmasına yol açıyor. Olası sonuç nedir?", ["Hedef genler sinyal olmadan da sürekli ifade edilir; hücre örneğin kontrolsüz bölünebilir.", "Hücre sinyale hiç yanıt veremez.", "Ligand üretimi durur ve yol kapanır.", "Etki olmaz, çünkü ligand yoktur."], 0, ["Doğru: yol sürekli açık kalır.", "Bu, işlev kaybı mutasyonu olurdu.", "Reseptör mutasyonu ligand üretimini doğrudan etkilemez.", "Reseptör ligandsız da aktif."]]]
    },
    "bio-u5": {
      ad: "Unit 5: Heredity",
      akil: ["Mayoz I homolog kromozomları, mayoz II kardeş kromatitleri ayırır.", "Çeşitlilik kaynakları: krossing-over, bağımsız dağılım ve rastgele döllenme.", "Dihibrit çaprazlamada bağımsız genler için F₂ oranı 9 : 3 : 3 : 1'dir.", "Bağlı genler bu oranlardan sapar; rekombinasyon sıklığı uzaklıkla artar.", "χ² = Σ(O − E)² / E; df = sınıf − 1; χ² > kritik değer ise H₀ reddedilir."],
      sorular: [["χ² = 1,78, df = 3, kritik değer 7,81 (p = 0,05). Doğru sonuç hangisidir?", ["H₀ reddedilemez; sapma şansla açıklanabilir.", "H₀ kanıtlanmıştır.", "H₀ reddedilir; genler bağlıdır.", "df yanlış; karar verilemez."], 0, ["Doğru: 1,78 < 7,81.", "H₀ hiçbir zaman 'kanıtlanmaz'.", "Ret için χ² kritik değerden büyük olmalı.", "4 fenotip sınıfı → df = 3 doğru."]]]
    },
    "bio-u6": {
      ad: "Unit 6: Gene Expression and Regulation",
      akil: ["DNA replikasyonu yarı-korunumludur; DNA polimeraz yalnızca 3' ucuna nükleotit ekler.", "Öncü zincir kesintisiz, geri kalan zincir Okazaki parçalarıyla sentezlenir.", "Ökaryotlarda pre-mRNA işlenir: 5' şapka, poli-A kuyruğu ve intronların çıkarılması (splicing).", "lac operonu indüklenebilir, trp operonu baskılanabilir.", "Çerçeve kayması (ekleme/silme) genellikle nokta değişiminden daha yıkıcıdır."],
      sorular: [["Laktoz varken ve glukoz yokken lac operonu için hangisi doğrudur?", ["Allolaktoz baskılayıcıya bağlanır, baskılayıcı operatörden ayrılır; transkripsiyon yüksektir.", "Baskılayıcı operatöre bağlı kalır; transkripsiyon durur.", "trp operonu devreye girer.", "RNA polimeraz promotere bağlanamaz."], 0, ["Doğru: indüklenebilir operon + düşük glukozda cAMP–CAP desteği.", "Bu laktoz yokken olur.", "trp operonu farklı bir sistemdir.", "Glukoz yokken CAP bağlanmayı kolaylaştırır."]]]
    },
    "bio-u7": {
      ad: "Unit 7: Natural Selection",
      akil: ["Doğal seçilim bireyler üzerinde etki eder ama evrimleşen popülasyondur.", "Hardy–Weinberg: p + q = 1 ve p² + 2pq + q² = 1; beş koşul (büyük popülasyon, göç yok, mutasyon yok, rastgele çiftleşme, seçilim yok).", "Çekinik fenotip frekansı q²'dir; q'yu bulmak için karekök alınır (yalnızca dengedeyse).", "Genetik sürüklenme küçük popülasyonlarda güçlüdür (kurucu etkisi, darboğaz).", "Kladogramda dallanma noktası ortak atayı, paylaşılan türetilmiş karakterler akrabalığı gösterir."],
      sorular: [["Dengedeki bir popülasyonda bireylerin %9'u çekinik fenotipte. Heterozigot oranı nedir?", ["%42", "%9", "%49", "%21"], 0, ["Doğru: q = 0,3, p = 0,7 → 2pq = 0,42.", "%9 = q² (aa) oranıdır.", "%49 = p² (AA) oranıdır.", "2pq'deki 2 çarpanı unutulmuş."]]]
    },
    "bio-u8": {
      ad: "Unit 8: Ecology",
      akil: ["Üstel büyüme: dN/dt = rN, sınırsız kaynakta J eğrisi.", "Lojistik büyüme: dN/dt = rN(K − N)/K; N = K/2 iken büyüme en hızlıdır, N → K iken sıfıra yaklaşır.", "Trofik düzeyler arasında enerjinin yaklaşık %10'u aktarılır; kalan çoğunlukla solunumla ısı olarak kaybolur.", "Yoğunluğa bağlı etkenler (rekabet, hastalık) popülasyon büyüdükçe güçlenir.", "Biyolojik çeşitliliği yüksek ekosistemler bozulmalara karşı daha dirençlidir."],
      sorular: [
        ["Lojistik bir popülasyon K = 600'e sahip. Büyüme hızı (dN/dt) hangi N değerinde en yüksektir?", ["300", "600", "150", "Her N'de aynıdır"], 0, ["Doğru: rN(1 − N/K), N = K/2'de en büyük.", "N = K'de büyüme sıfırdır.", "Bu noktada hız daha düşüktür.", "Bu üstel modelde kişi başı hız için doğrudur."]],
        ["Üreticiler 10 000 kJ enerji bağlıyor. %10 kuralına göre ikincil tüketicilere yaklaşık ne kadar ulaşır?", ["100 kJ", "1000 kJ", "10 kJ", "9000 kJ"], 0, ["Doğru: 10 000 → 1000 → 100.", "Bu birincil tüketiciler için.", "Bu üçüncül tüketiciler için.", "Bu kaybolan miktardır."]]
      ]
    },
    "eko-temel": {
      ad: "Temel kavramlar: CS A ve Ekonomi",
      akil: ["Kapsülleme: örnek değişkenleri private, erişim public metotlarla.", "ArrayList'ten silerken sondan başa dolaş; yoksa kayan eleman atlanır.", "Binary search O(log N) ve sıralı dizi ister; selection/insertion sort O(N²).", "Her firma MR = MC noktasında üretir; tam rekabette uzun dönemde P = min ATC.", "Harcama çarpanı = 1 / MPS; vergi çarpanı = −MPC / MPS."],
      sorular: [["MPC = 0,8 iken hükümet harcaması 10 milyar artıyor. GSYH'deki en büyük olası artış nedir?", ["50 milyar", "8 milyar", "40 milyar", "12,5 milyar"], 0, ["Doğru: çarpan 1 / 0,2 = 5 → 10 × 5.", "Bu yalnızca ilk turdaki tüketimdir.", "40 milyar vergi indirimi (−MPC/MPS = −4) etkisidir.", "Çarpan 1/MPC değil 1/MPS'dir."]]]
    },
    "csa": {
      ad: "AP CSA Units 1–4",
      akil: ["String değişmezdir; substring(a, b) a dahil, b hariç (uzunluk b − a).", "equals içeriği, == ise referansı karşılaştırır.", "Java değerle aktarır: nesnelerde referansın kopyası gider (alias oluşur).", "ArrayList remove(i) sonrası sağdaki elemanlar sola kayar; ileri dolaşırken i'yi artırmak elemanı atlatır.", "Satır öncelikli 2D dolaşma: dış döngü satır (grid.length), iç döngü sütun (grid[0].length)."],
      sorular: [
        ["String w = \"COMPUTER\"; System.out.println(w.substring(2, 5)); çıktısı nedir?", ["MPU", "OMP", "MPUT", "OMPU"], 0, ["Doğru: indeks 2, 3, 4 → M, P, U.", "İndeksler 0'dan başlar: 'O' indeks 1'dir.", "b hariçtir: 5 dahil değil.", "Başlangıç ve bitiş birlikte kaydırılmış."]],
        ["nums = [2, 4, 5]; for (int i = 0; i < nums.size(); i++) if (nums.get(i) % 2 == 0) nums.remove(i); sonra nums nedir?", ["[4, 5]", "[5]", "[2, 4, 5]", "IndexOutOfBoundsException"], 0, ["Doğru: 2 silinir, 4 indeks 0'a kayar, i = 1 ile 5 kontrol edilir; 4 atlanır.", "Bu doğru silme (sondan başa) sonucudur.", "İlk eleman çift olduğundan silinir.", "Koşul her turda size() ile denetlenir; taşma olmaz."]]
      ]
    },
    "micro56": {
      ad: "AP Micro Units 5–6",
      akil: ["Firma, MRP = MRC olana dek işçi çalıştırır (tam rekabetçi işgücü piyasasında MRC = ücret).", "Monopson daha az işçi ve rekabetçi piyasadan daha düşük ücretle çalıştırır.", "Negatif dışsallıkta MSC > MPC: piyasa aşırı üretir; Pigouvian vergi t = MEC dengeyi düzeltir.", "Kamu malları dışlanamaz ve rakip değildir: bedavacı (free rider) sorunu.", "Doğal tekelde P = MC zarara yol açar; adil getiri fiyatı P = ATC'dir."],
      sorular: [["Pozitif tüketim dışsallığı olan bir malda (ör. aşı) serbest piyasa için hangisi doğrudur?", ["MSB > MPB; piyasa az üretir, sübvansiyon etkinliği artırır.", "MSC > MPC; piyasa aşırı üretir.", "Piyasa sosyal optimumda üretir.", "Vergi en etkin politikadır."], 0, ["Doğru: dışsal fayda dikkate alınmaz.", "Bu negatif üretim dışsallığıdır.", "Ölü ağırlık kaybı oluşur.", "Vergi miktarı daha da azaltır."]]]
    },
    "macro16": {
      ad: "AP Macro Units 1 ve 6",
      akil: ["Fırsat maliyeti, vazgeçilen en iyi alternatiftir; PPC üzerindeki noktalar etkindir.", "Karşılaştırmalı üstünlük: daha düşük fırsat maliyetiyle üreten uzmanlaşmalıdır.", "Talep değişimi eğriyi kaydırır; fiyat değişimi eğri üzerinde hareket ettirir.", "Cari işlemler + finans hesabı ≈ 0 (ödemeler dengesi).", "Bir ülkenin faizi yükselirse yabancı fon girer: para birimine talep artar, değer kazanır."],
      sorular: [["Talep ve arz aynı anda artıyor (ikisi de sağa kayıyor). Kesin olarak ne söylenebilir?", ["Denge miktarı artar; fiyatın yönü belirsizdir.", "Fiyat ve miktar kesin artar.", "Fiyat kesin düşer.", "Miktar belirsiz, fiyat artar."], 0, ["Doğru: iki kayma da miktarı artırır, fiyatı ters yönde iter.", "Fiyat kayma büyüklüklerine bağlı.", "Talep artışı fiyatı yükseltir; kesin değil.", "İki kayma da miktarı aynı yönde etkiler."]]]
    },
    "eng-temel": {
      ad: "Rhetoric foundations",
      akil: ["Rhetorical situation: speaker, audience, purpose, exigence, context ve message.", "Seçimleri (choices) amaçla bağla: \"The writer does X in order to Y\".", "Tez savunulabilir olmalı ve yazarın seçimlerini amaçla ilişkilendirmeli; çekicilik listesi yetmez.", "Line of reasoning: iddia → kanıt → yorum (commentary) → teze bağlantı.", "Sophistication puanı karmaşıklık, bağlam ve tutarlı üslupla kazanılır, süslü kelimeyle değil."],
      sorular: [["Hangisi rhetorical analysis için en iyi tezdir?", ["By pairing vivid images of child laborers with collective pronouns, Kelley makes her listeners feel complicit and urges them to act.", "Kelley uses pathos, ethos, and logos.", "Child labor was a serious problem in 1905.", "Kelley's speech is very persuasive and effective."], 0, ["Doğru: seçimler + etki + amaç.", "Liste: neden/nasıl yok.", "Konu hakkında bilgi, analiz değil.", "Savunulabilir ama seçim ve gerekçe yok."]]]
    },
    "eng-okuma": {
      ad: "Unit A: Rhetorical Analysis & Reading",
      akil: ["Soruyu okumadan önce paragrafın işlevini (claim, concession, example) belirle.", "\"Primarily serves to\" sorularında cümlenin argümandaki görevini seç, içeriğini değil.", "Ton sorularında metindeki belirli kelime seçimlerine dayan; aşırı uç tonlardan kaçın.", "Concession and rebuttal: yazar karşı görüşü kabul eder, sonra zayıflatır."],
      sorular: [["\"Some will say the clinic can wait another year. They are right that budgets are tight; they are wrong that patients can wait.\" Bu cümleler öncelikle ne işe yarar?", ["Karşı görüşü kısmen kabul edip sonra çürütmek (concession and rebuttal)", "Yeni bir kanıt sunmak", "Yazarın kişisel deneyimini anlatmak", "Ana iddiayı geri çekmek"], 0, ["Doğru: 'They are right… they are wrong…' yapısı.", "İstatistik ya da örnek yok.", "Anekdot değil.", "İddia güçlendirilir, geri çekilmez."]]]
    },
    "eng-yazma": {
      ad: "Unit B: Writing (Revision & Composition)",
      akil: ["Revizyon sorularında önce yazarın amacını (purpose) oku; en iyi seçenek o amaca hizmet eder.", "Bir cümle eklemek/çıkarmak sorularında paragrafın odağını korur mu diye bak.", "Geçiş ifadeleri (however, therefore, for example) iki fikir arasındaki ilişkiyi doğru adlandırmalı.", "Kanıt, iddiayı doğrudan desteklemelidir; ilginç ama ilgisiz bilgi zayıflatır."],
      sorular: [["İki cümle arasında zıtlık varsa hangisi en uygun geçiştir?", ["However,", "Therefore,", "For example,", "Similarly,"], 0, ["Doğru: zıtlık bildirir.", "Sonuç ilişkisi bildirir.", "Örnek verir.", "Benzerlik bildirir."]]]
    }
  };

  W.birim = function (y) {
    const b = BIRIM[y.dataset.birim];
    if (!b) return;
    const sar = el("div", { class: "kbe-birim" });
    const akil = el("section", { class: "kbe-akil", "aria-label": "Akılda kal: " + b.ad },
      el("h3", { class: "kbe-akil__bas" }, el("span", { class: "kbe-ikon", "aria-hidden": "true", html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/></svg>' }), "Akılda kal"),
      el("ul", null, b.akil.map(t => el("li", null, t))));
    const dene = el("section", { class: "kbe-dene", "aria-label": "Kendini dene: " + b.ad },
      el("h3", { class: "kbe-akil__bas" }, el("span", { class: "kbe-ikon", "aria-hidden": "true", html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>' }), "Kendini dene"));
    b.sorular.forEach(([soru, siklar, dogru, geri], si) => {
      const gid = yeniId("q");
      const geriE = el("p", { class: "kbe-sonuc", "aria-live": "polite", role: "status" });
      const liste = el("div", { class: "kbe-siklar", role: "group", "aria-labelledby": gid });
      const sira = siraKaristir(siklar.length, soru); // görünen konum k → asıl şık sira[k]; doğru cevap hep A olmasın
      const btn = sira.map((i, k) => dugme(el("span", { class: "kbe-harf", "aria-hidden": "true", text: "ABCD"[k] }), () => {
        btn.forEach((x, m) => { x.disabled = true; x.classList.toggle("kbe-dogru", sira[m] === dogru); x.classList.toggle("kbe-yanlis", sira[m] === i && i !== dogru); x.setAttribute("aria-pressed", String(sira[m] === i)); });
        geriE.textContent = (i === dogru ? "Doğru! " : "Yanlış. ") + geri[i] + (i === dogru ? "" : " (Doğru cevap: " + "ABCD"[sira.indexOf(dogru)] + ")");
        tekrar.hidden = false;
      }, { class: "kbe-btn kbe-sik", "aria-pressed": "false" }));
      btn.forEach((x, k) => x.appendChild(document.createTextNode(siklar[sira[k]])));
      const tekrar = dugme("Tekrar dene", () => { btn.forEach(x => { x.disabled = false; x.classList.remove("kbe-dogru", "kbe-yanlis"); x.setAttribute("aria-pressed", "false"); }); geriE.textContent = ""; tekrar.hidden = true; btn[0].focus(); }, { class: "kbe-btn kbe-btn--ghost" });
      tekrar.hidden = true;
      liste.append(...btn);
      dene.append(el("div", { class: "kbe-soru" }, el("p", { id: gid, class: "kbe-soru__metin" }, el("strong", null, (si + 1) + ". "), soru), liste, geriE, tekrar));
    });
    sar.append(akil, dene);
    y.appendChild(sar);
  };

  /* ------------------------------------------------------------------ */
  /* 9) ADIM ADIM (mevcut çözümler)                                       */
  /* ------------------------------------------------------------------ */
  function adimAdim(kap) {
    if (kap.dataset.kbeHazir) return;
    kap.dataset.kbeHazir = "1";
    // Üst düzey <br> sınırlarından satır grupları
    const satirlar = [[]];
    Array.from(kap.childNodes).forEach(n => { if (n.nodeName === "BR") satirlar.push([]); else satirlar[satirlar.length - 1].push(n); });
    const metinOf = g => g.map(n => n.textContent).join("").trim();
    const dolu = satirlar.filter(g => metinOf(g) || g.some(n => n.nodeType === 1));
    if (dolu.length < 3) return;
    const baslangic = s => /^(•|\d+\.\s|\(\w\)|Step\s|Adım\s)/.test(s);
    const sinirli = dolu.slice(1).some(x => baslangic(metinOf(x)));
    const gruplar = [];
    dolu.forEach((g, i) => {
      if (i === 0 || !sinirli || baslangic(metinOf(g))) gruplar.push([g]);
      else gruplar[gruplar.length - 1].push(g);
    });
    if (gruplar.length < 3) return;
    kap.textContent = "";
    kap.classList.add("kbe-adimli");
    const bloklar = gruplar.map((grp, i) => {
      const d = el("div", { class: i === 0 ? "kbe-adim kbe-adim--bas" : "kbe-adim" });
      grp.forEach((satir, j) => { if (j) d.appendChild(document.createElement("br")); satir.forEach(n => d.appendChild(n)); });
      kap.appendChild(d);
      return d;
    });
    let acik = 1;
    const toplam = bloklar.length - 1;
    const sayacE = el("span", { class: "kbe-sayac", "aria-live": "polite" });
    const ileri = dugme("Sonraki adım", () => goster(acik + 1), { class: "kbe-btn kbe-btn--ana" });
    const hepsi = dugme("Tümünü göster", () => goster(toplam));
    const bas = dugme("Baştan", () => goster(1));
    function goster(n) {
      acik = Math.max(1, Math.min(toplam, n));
      bloklar.forEach((b, i) => {
        const g = i <= acik;
        b.classList.toggle("kbe-adim--gizli", !g);
        if (g) b.removeAttribute("aria-hidden"); else b.setAttribute("aria-hidden", "true");
        b.classList.toggle("kbe-adim--yeni", i === acik && i > 0);
      });
      sayacE.textContent = "Adım " + acik + " / " + toplam;
      ileri.disabled = acik === toplam; hepsi.disabled = acik === toplam;
    }
    kap.appendChild(el("div", { class: "kbe-adim-bar", role: "group", "aria-label": "Adım adım çözüm" }, el("span", { class: "kbe-rozet", text: "Adım adım" }), sayacE, bas, hepsi, ileri));
    goster(1);
  }

  /* ------------------------------------------------------------------ */
  /* 10) BAŞLATMA                                                         */
  /* ------------------------------------------------------------------ */
  function kur(y) {
    if (y.dataset.kbeKuruldu) return;
    y.dataset.kbeKuruldu = "1";
    const fn = W[y.dataset.kbe];
    if (!fn) return;
    try { fn(y); y.classList.add("kbe-yuva--hazir"); }
    catch (e) { if (typeof console !== "undefined") console.warn("[kbe] " + y.dataset.kbe, e); }
  }
  function baslat() {
    const calis = () => {
      const yuvalar = Array.from(document.querySelectorAll(".kbe-yuva[data-kbe]"));
      const adimlar = Array.from(document.querySelectorAll("[data-kbe-adim]"));
      if (typeof IntersectionObserver !== "function") { yuvalar.forEach(kur); adimlar.forEach(adimAdim); return; }
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (e.target.classList.contains("kbe-yuva")) kur(e.target); else adimAdim(e.target);
      }), { rootMargin: "600px 0px" });
      yuvalar.concat(adimlar).forEach(x => io.observe(x));
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", calis); else calis();
  }

  return { Ç, BIRIM, TEZLER, PARAGRAF, ROL, siraKaristir, baslat, _W: W };
});
