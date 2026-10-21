// 1.17.0 — İnteraktif konu anlatımı (AP Calculus + AP Physics 1): hesap çekirdeği ve içerik doğrulaması.
// Kullanım (proje klasöründen): node araclar/testler/etkilesim-mf-birim-test.js
// assets/js/etkilesim-mf.js Node'da yalnız saf hesap çekirdeğini ve "Kendini dene" verisini dışa verir (DOM gerekmez).
const fs = require("fs");
const path = require("path");
const KOK = path.resolve(__dirname, "../..");
const { hesap: H, dene: DENE } = require(path.join(KOK, "assets/js/etkilesim-mf.js"));

let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const yakin = (a, b, tol) => Math.abs(a - b) <= (tol == null ? 1e-9 : tol);

// --- Calculus 1: limit tabloları
(() => {
  const d = H.limitTablo("delik", 0.001);
  ok(yakin(d.sol, 3.999, 1e-9) && yakin(d.sag, 4.001, 1e-9), "delik: (x²−4)/(x−2) → 2 ± 0.001'de 3.999 / 4.001");
  ok(!isFinite(H.LIMIT.delik.f(2)), "delik: f(2) tanımsız (0/0)");
  const s = H.limitTablo("sicrama", 1e-4);
  ok(yakin(s.sol, 2, 1e-3) && yakin(s.sag, 3, 1e-3) && H.LIMIT.sicrama.f(1) === 3, "sıçrama: sol → 2, sağ → 3, f(1) = 3");
  const c = H.limitTablo("sinc", 0.001);
  ok(yakin(c.sol, 1, 1e-6) && yakin(c.sag, 1, 1e-6) && c.sol === c.sag, "sin x / x: iki yandan 1'e (çift fonksiyon, simetrik)");
  const hs = [0.1, 0.01, 0.001].map(h => Math.abs(H.limitTablo("delik", h).sag - 4));
  ok(hs[0] > hs[1] && hs[1] > hs[2], "delik: h küçüldükçe hata monoton azalır");
})();

// --- Calculus 2: kesen eğimi → türev
(() => {
  for (const a of [-2, -1, 0, 0.5, 2]) {
    const m = H.kesenEgim(H.turevF, a, 1e-6);
    ok(yakin(m, H.turevFp(a), 1e-5), "kesen eğimi h=1e-6 → f′(" + a + ") = " + H.turevFp(a));
  }
  // kübik için kesen eğimi tam: f′(a) + (3a/4)h + h²/4
  const a = 1, h = 0.5;
  ok(yakin(H.kesenEgim(H.turevF, a, h), H.turevFp(a) + 0.75 * a * h + 0.25 * h * h, 1e-12), "kesen eğimi kapalı formla eşleşir (a=1, h=0.5)");
})();

// --- Calculus 3: Riemann toplamları
(() => {
  const f = x => x * x;
  ok(yakin(H.riemann(f, 0, 2, 4, "sol"), 1.75), "x² [0,2], n=4 Left = 1.75");
  ok(yakin(H.riemann(f, 0, 2, 4, "sag"), 3.75), "x² [0,2], n=4 Right = 3.75");
  ok(yakin(H.riemann(f, 0, 2, 4, "orta"), 2.625), "x² [0,2], n=4 Midpoint = 2.625");
  ok(yakin(H.riemann(f, 0, 2, 4, "yamuk"), 2.75), "x² [0,2], n=4 Trapezoid = 2.75");
  ok(H.riemann(f, 0, 2, 10, "sol") < 8 / 3 && H.riemann(f, 0, 2, 10, "sag") > 8 / 3, "artan f: Left alt, Right üst tahmin");
  ok(H.riemann(f, 0, 2, 10, "yamuk") > 8 / 3 && H.riemann(f, 0, 2, 10, "orta") < 8 / 3, "içbükey yukarı: Trapezoid üst, Midpoint alt");
  for (const k of Object.keys(H.RIEMANN)) {
    const F = H.RIEMANN[k], e = Math.abs(H.riemann(F.f, F.a, F.b, 2000, "orta") - F.kesin);
    ok(e < 1e-6, k + ": Midpoint n=2000 kesin değere yakınsar (hata " + e.toExponential(1) + ")");
    ok(yakin(H.simpson(F.f, F.a, F.b, 200), F.kesin, 1e-7), k + ": Simpson ile kesin integral doğrulandı (" + F.kesin.toFixed(6) + ")");
  }
  const e1 = Math.abs(H.riemann(f, 0, 2, 10, "sol") - 8 / 3), e2 = Math.abs(H.riemann(f, 0, 2, 20, "sol") - 8 / 3);
  ok(yakin(e1 / e2, 2, 0.1), "Left hatası n iki katına çıkınca ≈ yarıya iner (O(1/n))");
})();

// --- Calculus 4: birikim fonksiyonu
(() => {
  for (const x of [0.5, 1, 2, 3, 4]) ok(yakin(H.birikimG(x), H.simpson(H.birikimF, 0, x, 400), 1e-9), "g(" + x + ") = ∫₀ˣ (t−1)(t−3) dt = " + H.birikimG(x).toFixed(4));
  ok(yakin(H.birikimG(1), 4 / 3) && yakin(H.birikimG(3), 0) && yakin(H.birikimG(4), 4 / 3), "g(1) = 4/3 (yerel max), g(3) = 0 (yerel min), g(4) = 4/3");
  ok(yakin((H.birikimG(2 + 1e-6) - H.birikimG(2 - 1e-6)) / 2e-6, H.birikimF(2), 1e-6), "FTC 1: g′(2) = f(2) = −1");
  // ders anlatımındaki örnek: ∫₀⁴ v = 4/3, ∫₀⁴ |v| = 4
  ok(yakin(H.simpson(t => Math.abs(H.birikimF(t)), 0, 1, 200) + H.simpson(t => Math.abs(H.birikimF(t)), 1, 3, 200) + H.simpson(t => Math.abs(H.birikimF(t)), 3, 4, 200), 4, 1e-9), "Unit 8 örneği: toplam yol ∫₀⁴|v| = 4");
})();

// --- Calculus 5: Euler
(() => {
  const p = H.euler((x, y) => x + y, 0, 1, 0.5, 2);
  ok(yakin(p[1][1], 1.5) && yakin(p[2][1], 2.5) && yakin(p[2][0], 1), "Euler dy/dx = x + y, y(0)=1, h=0.5: 1.5, 2.5 (ders örneğiyle aynı)");
  const q = H.euler(H.EGIM.xmy.F, 0, 1, 0.5, 1);
  ok(yakin(q[1][1], 0.5), "Euler dy/dx = x − y, y(0)=1, h=0.5: y(0.5) ≈ 0.5 (Kendini dene U7)");
  const ex = H.EGIM.ustel.kesin(0, 1, 1), e1 = Math.abs(H.euler(H.EGIM.ustel.F, 0, 1, 0.1, 10)[10][1] - ex), e2 = Math.abs(H.euler(H.EGIM.ustel.F, 0, 1, 0.05, 20)[20][1] - ex);
  ok(e2 < e1 && yakin(e1 / e2, 2, 0.15), "Euler birinci mertebe: h yarıya inince hata ≈ yarıya iner");
  ok(H.euler(H.EGIM.ustel.F, 0, 1, 0.1, 10)[10][1] < ex, "y′ = 0.5y (içbükey yukarı çözüm): Euler alt tahmin verir");
  const d = H.euler(H.EGIM.daire.F, 0, 2, 0.001, 1000), son = d[d.length - 1];
  ok(yakin(son[0] * son[0] + son[1] * son[1], 4, 0.01), "dy/dx = −x/y çözümleri çemberdir: x² + y² ≈ 4");
})();

// --- Calculus 6: Taylor
(() => {
  ok(yakin(H.taylor("sin", 3, 0.5), 0.5 - 0.125 / 6), "sin: P₃(0.5) = x − x³/6");
  ok(yakin(H.taylor("cos", 4, 1), 1 - 0.5 + 1 / 24), "cos: P₄(1) = 1 − 1/2 + 1/24");
  ok(yakin(H.taylor("ustel", 2, 0.1), 1.105), "eˣ: P₂(0.1) = 1.105");
  ok(yakin(H.taylor("ustel", 3, 1), 1 + 1 + 0.5 + 1 / 6), "eˣ: x³ katsayısı 1/6");
  ok(yakin(H.taylor("sin", 13, 1), Math.sin(1), 1e-12) && yakin(H.taylor("ustel", 13, 1), Math.E, 1e-9), "n = 13'te P(1) fonksiyonla örtüşür");
  for (const n of [1, 3, 5, 7]) {
    const hata = Math.abs(H.taylor("sin", n, 1) - Math.sin(1)), sinir = 1 / H.fakt(n + 2);
    ok(hata <= sinir, "sin: P" + n + "(1) hatası alternating/Lagrange sınırının altında (" + hata.toExponential(2) + " ≤ " + sinir.toExponential(2) + ")");
  }
  ok(H.taylor("sin", 4, 1) === H.taylor("sin", 3, 1), "sin: çift dereceli terim yok (P₄ = P₃)");
})();

// --- Physics 1: eğik atış
(() => {
  for (const [v, a] of [[20, 45], [20, 30], [15, 70], [30, 10]]) {
    const A = H.atis(v, a), R = v * v * Math.sin(2 * a * Math.PI / 180) / 9.8, Hh = Math.pow(v * Math.sin(a * Math.PI / 180), 2) / (2 * 9.8);
    ok(yakin(A.R, R, 1e-9) && yakin(A.H, Hh, 1e-9), "v₀=" + v + ", θ=" + a + "°: R = v₀²sin2θ/g = " + R.toFixed(2) + " m, H = " + Hh.toFixed(2) + " m");
    const son = H.atisKonum(v, a, A.T);
    ok(yakin(son.y, 0, 1e-9) && yakin(son.x, A.R, 1e-9) && yakin(son.vy, -A.vy, 1e-9), "θ=" + a + "°: t = T'de y = 0, x = R, vᵧ = −v₀ᵧ (simetri)");
  }
  ok(yakin(H.atis(20, 30).R, H.atis(20, 60).R, 1e-9), "tümler açılar (30°, 60°) aynı menzil");
  ok([10, 30, 44, 46, 60].every(a => H.atis(20, a).R < H.atis(20, 45).R), "en büyük menzil 45°'de");
  ok(yakin(H.atisKonum(20, 45, 0.7).vx, H.atis(20, 45).vx), "vₓ zamanla değişmez");
})();

// --- Physics 2: eğik düzlem
(() => {
  const r = H.egik(2, 30, 0, 0);
  ok(yakin(r.a, 9.8 * 0.5, 1e-9) && yakin(r.N, 2 * 9.8 * Math.cos(Math.PI / 6), 1e-9), "sürtünmesiz 30°: a = g sinθ = 4.9, N = mg cosθ");
  const d = H.egik(2, 20, 0.5, 0.3);
  ok(d.durgun && yakin(d.f, 2 * 9.8 * Math.sin(20 * Math.PI / 180), 1e-9) && d.a === 0, "20°, μₛ=0.5 (tan20°=0.364 < 0.5): durgun, fₛ = mg sinθ");
  const k = H.egik(2, 35, 0.5, 0.3), bek = 9.8 * (Math.sin(35 * Math.PI / 180) - 0.3 * Math.cos(35 * Math.PI / 180));
  ok(!k.durgun && yakin(k.a, bek, 1e-9) && yakin(k.f, 0.3 * k.N, 1e-12), "35°, μₛ=0.5 (tan35°=0.700 > 0.5): kayar, a = g(sinθ − μₖcosθ) = " + bek.toFixed(3));
  ok(yakin(k.net, 2 * k.a, 1e-12), "ΣF = ma");
  const s = H.egik(2, Math.atan(0.5) * 180 / Math.PI, 0.5, 0.3);
  ok(s.durgun, "tanθ = μₛ sınırında statik (eşik dahil)");
})();

// --- Physics 3: enerji (rampa)
(() => {
  const s0 = H.rampa(1, 2, 35, 0, 0);
  ok(yakin(s0.E, 19.6, 1e-9) && yakin(s0.Ug, 19.6, 1e-9) && s0.K === 0, "başlangıç: Ug = mgh = 19.6 J, K = 0");
  for (const mu of [0, 0.2, 0.5]) for (const s of [0.5, 2, 3.4, 5, 7]) {
    const r = H.rampa(1, 2, 35, mu, s);
    ok(yakin(r.K + r.Ug + r.Eth, r.E, 1e-9) && r.K >= 0, "μ=" + mu + ", s=" + s + ": K + Ug + E_ısıl = 19.6 J");
  }
  const sur = H.rampa(1, 2, 35, 0, 10);
  ok(yakin(sur.v, Math.sqrt(2 * 9.8 * 2), 1e-9), "sürtünmesiz zeminde v = √(2gh) = 6.26 m/s");
  const r = H.rampa(1, 2, 35, 0.2, 100);
  ok(yakin(r.K, 0, 1e-9) && yakin(r.Eth, 19.6, 1e-9), "sürtünmeli: blok durunca tüm enerji ısıl");
  const L = 2 / Math.sin(35 * Math.PI / 180), KL = 19.6 - 0.2 * 9.8 * Math.cos(35 * Math.PI / 180) * L;
  ok(yakin(r.sDur, L + KL / (0.2 * 9.8), 1e-9), "durma mesafesi = L + K_L/(μmg)");
})();

// --- Physics 4: çarpışma
(() => {
  for (const [m1, v1, m2, v2] of [[2, 3, 1, -1], [1, 5, 1, 0], [0.5, 4, 5, -2], [3, 2, 2, 1]]) {
    const e = H.carpisma(m1, v1, m2, v2, "esnek"), y = H.carpisma(m1, v1, m2, v2, "yapiskan");
    ok(yakin(e.pOnce, e.pSonra, 1e-9) && yakin(e.KOnce, e.KSonra, 1e-9), "esnek " + [m1, v1, m2, v2].join("/") + ": p ve K korunur");
    ok(yakin(e.u2 - e.u1, -(v2 - v1), 1e-9), "esnek: bağıl hız ters döner (v₂′ − v₁′ = v₁ − v₂)");
    ok(yakin(y.pOnce, y.pSonra, 1e-9) && y.KSonra < y.KOnce && y.u1 === y.u2, "yapışan " + [m1, v1, m2, v2].join("/") + ": p korunur, K azalır, ortak hız");
  }
  const es = H.carpisma(1, 5, 1, 0, "esnek");
  ok(yakin(es.u1, 0) && yakin(es.u2, 5), "eşit kütle esnek: hızlar değiş tokuş");
  const yok = H.carpisma(1, 1, 1, 2, "esnek");
  ok(!yok.yaklasiyor && yok.u1 === 1 && yok.u2 === 2, "yaklaşmayan arabalar: çarpışma yok");
})();

// --- Physics 5: BHH
(() => {
  const A = 0.15, k = 50, m = 0.5, B = H.bhh(A, k, m, 0);
  ok(yakin(B.T, 2 * Math.PI * Math.sqrt(m / k), 1e-12) && yakin(B.w, 10, 1e-12), "T = 2π√(m/k), ω = 10 rad/s");
  ok(yakin(H.bhh(0.05, k, m, 0).T, B.T), "periyot genlikten bağımsız");
  ok(yakin(B.vMax, 1.5, 1e-12) && yakin(B.aMax, 15, 1e-12), "vₘₐₓ = Aω = 1.5 m/s, aₘₐₓ = ω²A = 15 m/s²");
  for (const t of [0.05, 0.2, 0.37, 0.6]) {
    const q = H.bhh(A, k, m, t), dt = 1e-6, x2 = H.bhh(A, k, m, t + dt).x, x1 = H.bhh(A, k, m, t - dt).x, v2 = H.bhh(A, k, m, t + dt).v, v1 = H.bhh(A, k, m, t - dt).v;
    ok(yakin((x2 - x1) / (2 * dt), q.v, 1e-6) && yakin((v2 - v1) / (2 * dt), q.a, 1e-5), "t=" + t + ": v = dx/dt, a = dv/dt");
    ok(yakin(q.a, -(k / m) * q.x, 1e-12), "t=" + t + ": a = −(k/m)x");
    ok(yakin(0.5 * k * q.x * q.x + 0.5 * m * q.v * q.v, B.E, 1e-12), "t=" + t + ": ½kx² + ½mv² = ½kA²");
  }
  const ders = H.bhh(0.2, 50, 0.5, 0);
  ok(yakin(ders.E, 1.0, 1e-12) && yakin(ders.vMax, 2.0, 1e-12), "Unit 7 ders örneği: E = 1.0 J, vₘₐₓ = 2.0 m/s");
})();

// --- Physics 6: akışkanlar
(() => {
  const y = H.kaldirma(600, 1000, 0.001);
  ok(y.yuzer && yakin(y.oran, 0.6) && yakin(y.Fb, y.W, 1e-12), "600 kg/m³ suda: %60 batık, F_b = W");
  const b = H.kaldirma(2000, 1000, 0.001);
  ok(!b.yuzer && yakin(b.Fb, 9.8, 1e-9) && yakin(b.N, 19.6 - 9.8, 1e-9), "2000 kg/m³: batar, F_b = ρVg = 9.8 N, N = W − F_b");
  ok(yakin(H.kaldirma(800, 800, 0.001).N, 0, 1e-12), "eşit yoğunluk: askıda (N = 0)");
  const be = H.bernoulli(120000, 2, 1, 0.5, 1000);
  ok(yakin(be.v2, 4) && yakin(be.P2, 120000 - 0.5 * 1000 * (16 - 4)), "A₂ = A₁/2: v₂ = 2v₁ = 4 m/s, P₂ = 114 kPa");
  ok(yakin(1 * 2, 0.5 * be.v2), "süreklilik A₁v₁ = A₂v₂");
  ok(yakin(120000 + 0.5 * 1000 * 4, be.P2 + 0.5 * 1000 * be.v2 * be.v2, 1e-9), "Bernoulli: P + ½ρv² sabit");
  ok(H.bernoulli(120000, 3, 1, 0.2, 1000).P2 > 0, "kaydırıcı uç değerlerinde P₂ > 0 (fiziksel)");
})();

// --- Kendini dene verisi: yapı + sayfalarla eşleşme
(() => {
  let hata = 0, toplam = 0;
  for (const [k, qs] of Object.entries(DENE)) {
    if (!Array.isArray(qs) || qs.length < 1 || qs.length > 2) { hata++; console.log("  ! " + k + ": 1–2 soru olmalı"); }
    for (const q of qs) {
      toplam++;
      if (!q.s || !Array.isArray(q.o) || q.o.length !== 4 || !(q.d >= 0 && q.d < 4)) { hata++; console.log("  ! " + k + ": şema"); continue; }
      if (!/^Doğru\./.test(q.o[q.d][1])) { hata++; console.log("  ! " + k + ": doğru şıkkın geri bildirimi 'Doğru.' ile başlamalı"); }
      if (q.o.some((o, i) => i !== q.d && /^Doğru\./.test(o[1]))) { hata++; console.log("  ! " + k + ": yanlış şıkta 'Doğru.'"); }
      if (q.o.some(o => !o[0] || !o[1])) { hata++; console.log("  ! " + k + ": boş şık/geri bildirim"); }
    }
  }
  ok(hata === 0, "Kendini dene: " + toplam + " soru, şema ve geri bildirim tutarlı");
  const calc = fs.readFileSync(path.join(KOK, "ap-calculus.html"), "utf8"), phys = fs.readFileSync(path.join(KOK, "ap-physics.html"), "utf8");
  const sayfadaki = (calc + phys).match(/data-emf-dene="([^"]+)"/g).map(x => x.slice(15, -1));
  ok(sayfadaki.length === Object.keys(DENE).length && sayfadaki.every(k => DENE[k]), "her Kendini dene kutusunun verisi var (" + sayfadaki.length + ")");
  const tur = (calc + phys).match(/data-emf="([^"]+)"/g).map(x => x.slice(10, -1)).sort().join(",");
  ok(tur === "atis,bernoulli,bhh,birikim,carpisma,egik,egim,enerji,kaldirma,limit,riemann,taylor,teget", "13 laboratuvar sayfalarda: " + tur);
  ok((calc.match(/data-emf-adim/g) || []).length === 3 && (phys.match(/data-emf-adim/g) || []).length === 3, "her sayfada 3 Adım adım örnek");
  ok((calc.match(/class="emf-akilda"/g) || []).length === 10 && (phys.match(/class="emf-akilda"/g) || []).length === 9, "Akılda kal: Calculus 10 ünite, Physics 8 ünite + Fluids");
  ok(/etkilesim-mf\.js/.test(calc) && /etkilesim-mf\.css/.test(calc) && /etkilesim-mf\.js/.test(phys) && /etkilesim-mf\.css/.test(phys), "iki sayfa da JS/CSS dosyalarını bağlıyor");
  const kutular = ["calc-unit1-quiz-container", "calc-unit10-quiz-container", "phys-unit1-quiz-container", "phys-unit8-quiz-container"];
  ok(kutular.every(id => (calc + phys).includes('id="' + id + '"')), "soru kutuları yerinde");
  ok(!/isCorrect|stepByStepSolution|_QUESTIONS/.test(fs.readFileSync(path.join(KOK, "assets/js/etkilesim-mf.js"), "utf8")), "JS dosyasında soru bankası izi yok");
})();

console.log("\n" + pass + " PASS, " + fail + " FAIL");
process.exit(fail ? 1 : 0);
