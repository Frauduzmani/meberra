// İnteraktif konu anlatımı (assets/js/etkilesim-kbe.js) saf çekirdeği — Node birim testi (v1.17.0).
// Kimya (titrasyon, Le Châtelier, Maxwell–Boltzmann, ideal gaz, PES), Biyoloji (lojistik, Hardy–Weinberg, χ², Michaelis–Menten, %10),
// Ekonomi (arz–talep, esneklik, AD–AS, para piyasası, maliyet eğrileri), CS A (Java izleri), içerik şeması ve sayfa yerleşimi.
// Kullanım (proje klasöründen): node araclar/testler/etkilesim-kbe-birim-test.js
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const K = require(path.join(ROOT, "assets/js/etkilesim-kbe.js"));
const Ç = K.Ç;

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };
const yakin = (a, b, t) => Math.abs(a - b) <= (t == null ? 1e-6 : t);

// 1) Titrasyon (yük denkliği, tam çözüm)
const zayif = { Va: 25, Ca: 0.1, Cb: 0.1, Ka: 2.0e-5 }, asetik = Object.assign({}, zayif, { Ka: 1.8e-5 }), kuvvetli = Object.assign({}, zayif, { Ka: null });
ok(Ç.esdegerlikHacmi(zayif) === 25, "eşdeğerlik hacmi 25,0 mL");
ok(yakin(Ç.titrasyonPH(zayif, 0), 2.85, 0.01), "HA (Ka 2,0e-5) başlangıç pH ≈ 2,85 (FRQ a)", Ç.titrasyonPH(zayif, 0));
ok(yakin(Ç.titrasyonPH(zayif, 12.5), 4.70, 0.01), "yarı-eşdeğerlik pH = pKa ≈ 4,70 (FRQ b)", Ç.titrasyonPH(zayif, 12.5));
ok(yakin(Ç.titrasyonPH(asetik, 12.5), -Math.log10(1.8e-5), 0.01), "asetik asit yarı-eşdeğerlik pH = pKa = 4,74", Ç.titrasyonPH(asetik, 12.5));
ok(yakin(Ç.titrasyonPH(asetik, 25), 8.72, 0.02), "asetik asit eşdeğerlik pH ≈ 8,72 (> 7)", Ç.titrasyonPH(asetik, 25));
ok(yakin(Ç.titrasyonPH(asetik, 0), 2.87, 0.01), "asetik asit başlangıç pH ≈ 2,87", Ç.titrasyonPH(asetik, 0));
ok(yakin(Ç.titrasyonPH(kuvvetli, 0), 1.00, 0.005) && yakin(Ç.titrasyonPH(kuvvetli, 25), 7.00, 0.01), "HCl: başlangıç pH 1,00, eşdeğerlik pH 7,00");
ok(yakin(Ç.titrasyonPH(kuvvetli, 50), 14 + Math.log10(0.1 * 25 / 75), 0.01), "HCl: 50 mL'de fazla OH⁻ → pH ≈ 12,52", Ç.titrasyonPH(kuvvetli, 50));
let mono = true, onceki = -1;
for (let v = 0; v <= 50; v += 0.5) { const p = Ç.titrasyonPH(asetik, v); if (p < onceki - 1e-9) mono = false; onceki = p; }
ok(mono, "pH eğrisi monoton artar");
ok(Ç.titrasyonPH(asetik, 24.5) < 7 && Ç.titrasyonPH(asetik, 25.5) > 10, "eşdeğerlik çevresinde dik sıçrama");

// 2) Le Châtelier (N2 + 3H2 ⇌ 2NH3, ekzotermik)
const d0 = { c: Object.assign({}, Ç.DENGE.c0), T: Ç.DENGE.T0 };
ok(yakin(Ç.dengeQ(d0.c), Ç.dengeK(700), 1e-12) && Ç.kaymaYonu(Ç.dengeQ(d0.c), Ç.dengeK(700)) === "denge", "başlangıç Q = K");
const yon = e => { const d = Ç.dengeBoz(d0, e); return Ç.kaymaYonu(Ç.dengeQ(d.c), Ç.dengeK(d.T)); };
ok(yon("+N2") === "ileri" && yon("+H2") === "ileri" && yon("-NH3") === "ileri", "giren ekle / ürün çek → ileri");
ok(yon("+NH3") === "geri", "ürün ekle → geri");
ok(yon("T+") === "geri" && yon("T-") === "ileri", "ekzotermik: ısıtma → geri, soğutma → ileri");
ok(Ç.dengeK(750) < Ç.dengeK(700) && Ç.dengeK(650) > Ç.dengeK(700), "ekzotermik tepkimede K sıcaklıkla azalır");
ok(yon("P+") === "ileri" && yon("P-") === "geri", "basınç ↑ (V/2) → az gaz molü yönü (ileri); basınç ↓ → geri");
ok(yakin(Ç.dengeQ(Ç.dengeBoz(d0, "P+").c), Ç.dengeQ(d0.c) / 4, 1e-12), "V/2 → Q = Q₀/4 (2² / 2⁴)");
ok(yon("Ar") === "denge", "sabit hacimde Ar → kayma yok");
for (const e of ["+N2", "+NH3", "T+", "P+"]) {
  const d = Ç.dengeBoz(d0, e), y = Ç.dengeyeGetir(d.c, Ç.dengeK(d.T));
  ok(yakin(Math.log(Ç.dengeQ(y)), Math.log(Ç.dengeK(d.T)), 1e-6) && y.N2 > 0 && y.H2 > 0 && y.NH3 > 0, "yeni denge Q = K, derişimler pozitif (" + e + ")", y);
}
ok(Ç.dengeyeGetir(Ç.dengeBoz(d0, "+N2").c, Ç.dengeK(700)).NH3 > d0.c.NH3, "N₂ eklenince yeni dengede [NH₃] artar");

// 3) Maxwell–Boltzmann
ok(yakin(Ç.erfc(0), 1, 1e-6) && yakin(Ç.erfc(1), 0.157299, 1e-6), "erfc yaklaşımı (A&S 7.1.26)");
let alan = 0; for (let E = 0.0005; E < 200; E += 0.001) alan += Ç.mbYogunluk(E, 500) * 0.001;
ok(yakin(alan, 1, 2e-3), "dağılımın altındaki alan = 1", alan);
let sayisal = 0; for (let E = 15; E < 300; E += 0.001) sayisal += Ç.mbYogunluk(E, 300) * 0.001;
ok(yakin(sayisal, Ç.mbKesir(15, 300), 1e-4), "Ea üstü kesir: kapalı form = sayısal integral", [sayisal, Ç.mbKesir(15, 300)]);
let artan = true; for (let T = 200; T < 1200; T += 50) if (!(Ç.mbKesir(15, T + 50) > Ç.mbKesir(15, T))) artan = false;
ok(artan, "Ea üstü kesir sıcaklıkla monoton artar");
let azalan = true; for (let E = 5; E < 35; E++) if (!(Ç.mbKesir(E + 1, 400) < Ç.mbKesir(E, 400))) azalan = false;
ok(azalan, "Ea üstü kesir Ea ile monoton azalır");
const tepe = T => { let b = 0, eb = 0; for (let E = 0.01; E < 40; E += 0.01) { const f = Ç.mbYogunluk(E, T); if (f > b) { b = f; eb = E; } } return { b, eb }; };
ok(tepe(600).b < tepe(300).b && tepe(600).eb > tepe(300).eb && yakin(tepe(300).eb, 0.008314 * 300 / 2, 0.02), "T ↑: tepe alçalır, sağa kayar (tepe E = RT/2)");

// 4) İdeal gaz
ok(yakin(Ç.gazCoz("P", { V: 22.41, T: 273.15, n: 1 }), 1, 0.002), "STP: 1 mol, 22,41 L, 273,15 K → 1,00 atm");
const g = { P: 2.5, V: 10, T: 400, n: 0 }; g.n = Ç.gazCoz("n", g);
ok(yakin(Ç.gazCoz("P", g), 2.5) && yakin(Ç.gazCoz("V", g), 10) && yakin(Ç.gazCoz("T", g), 400), "dört bilinmeyen tutarlı (PV = nRT)");
ok(yakin(Ç.gazCoz("P", { V: 10, T: 600, n: 1 }) / Ç.gazCoz("P", { V: 10, T: 300, n: 1 }), 2) && yakin(Ç.gazCoz("P", { V: 5, T: 300, n: 1 }) / Ç.gazCoz("P", { V: 10, T: 300, n: 1 }), 2), "Gay-Lussac ve Boyle oranları");

// 5) PES
ok(Ç.PES.length === 20 && Ç.PES.every((e, i) => e[2].reduce((s, k) => s + k[1], 0) === i + 1), "20 element, elektron sayıları = Z");
const IE1 = { H: 1.31, He: 2.37, Li: 0.52, Na: 0.50, Mg: 0.74, Al: 0.58, K: 0.42, Ca: 0.59, Ne: 2.08, Ar: 1.52 };
ok(Object.keys(IE1).every(s => { const e = Ç.PES.find(x => x[0] === s); return yakin(e[2][e[2].length - 1][2], IE1[s], 0.03); }), "en dış tepe = birinci iyonlaşma enerjisi (MJ/mol)");
ok(Ç.PES.every((e, i) => !i || e[2][0][2] > Ç.PES[i - 1][2][0][2]), "1s bağlanma enerjisi Z ile artar");
ok(Ç.PES.every(e => e[2].every((k, j) => !j || k[2] < e[2][j - 1][2] || (e[0] === "S" && k[0] === "3p"))), "alt kabuklar azalan enerji sırasında");
ok(Ç.PES.every(e => e[2].every(k => k[1] <= (k[0][1] === "s" ? 2 : 6))), "s ≤ 2, p ≤ 6 elektron");

// 6) Nüfus
ok(yakin(Ç.lojistikN(10, 0.3, 800, 0), 10) && yakin(Ç.lojistikN(10, 0.3, 800, 200), 800, 1e-6), "lojistik: N(0) = N₀, N(∞) → K");
const tY = Math.log((800 - 10) / 10) / 0.3;
ok(yakin(Ç.lojistikN(10, 0.3, 800, tY), 400, 1e-6), "bükülme noktasında N = K/2");
let enb = 0, enbN = 0; for (let N = 1; N < 800; N++) { const h = Ç.lojistikHiz(N, 0.3, 800); if (h > enb) { enb = h; enbN = N; } }
ok(enbN === 400 && yakin(Ç.lojistikHiz(800, 0.3, 800), 0), "dN/dt en büyük N = K/2'de, N = K'de 0");
ok([1, 5, 10, 20].every(t => Ç.lojistikN(10, 0.3, 800, t) < Ç.ustelN(10, 0.3, t)), "lojistik < üstel (t > 0)");
ok(yakin(Ç.ustelN(10, Math.log(2), 3), 80, 1e-9), "üstel: r = ln2 → her nesil 2 kat");

// 7) Hardy–Weinberg + χ²
const h7 = Ç.hw(0.7);
ok(yakin(h7.AA, 0.49) && yakin(h7.Aa, 0.42) && yakin(h7.aa, 0.09) && yakin(h7.AA + h7.Aa + h7.aa, 1), "p = 0,7 → 0,49 / 0,42 / 0,09");
ok(yakin(Ç.hw(0.6).Aa, 0.48) && yakin(Ç.hw(0.6).aa, 0.16), "ders örneği: q² = 0,16 → 2pq = 0,48");
const x2 = Ç.kiKare([38, 52, 10], [49, 42, 9]);
ok(yakin(x2, 121 / 49 + 100 / 42 + 1 / 9, 1e-9) && x2 < Ç.KRITIK_005[2], "χ²(38/52/10 | p = 0,7) ≈ 4,96 < 5,99", x2);
ok(yakin(Ç.kiKare([98, 28, 26, 8], [90, 30, 30, 10]), 1.78, 0.01), "ders örneği (dihibrit) χ² ≈ 1,78");
ok(Ç.KRITIK_005[1] === 3.84 && Ç.KRITIK_005[2] === 5.99 && Ç.KRITIK_005[3] === 7.81, "kritik değerler (p = 0,05)");

// 8) Enzim
ok(yakin(Ç.mm(2, 100, 2), 50) && Ç.mm(1000, 100, 2) > 99 && Ç.mm(0, 100, 2) === 0, "Michaelis–Menten: v(Km) = Vmax/2, doygunluk");
let mmArt = true; for (let s = 0; s < 20; s += 0.5) if (!(Ç.mm(s + 0.5, 100, 2) > Ç.mm(s, 100, 2))) mmArt = false;
ok(mmArt, "v, [S] ile monoton artar");
ok(Ç.enzimT(37, 37, 60) === 1 && yakin(Ç.enzimT(27, 37, 60), 0.5) && Ç.enzimT(60, 37, 60) === 0 && Ç.enzimT(70, 37, 60) === 0, "sıcaklık: optimum 1, Q10 = 2, 60 °C'de denatüre");
ok(Ç.enzimPH(2, 2) === 1 && Ç.enzimPH(8, 2) < 0.01, "pepsin pH 2'de en etkin, pH 8'de ~0");

// 9) Enerji piramidi
const pr = Ç.piramit(20000, 0.1, 4);
ok(pr.every((v, i) => yakin(v, 20000 * Math.pow(0.1, i))) && yakin(pr[3], 20), "%10 kuralı: 20000 → 2000 → 200 → 20");

// 10) Ekonomi
const st = Ç.arzTalep(120, 1, 30, 1);
ok(yakin(st.Q, 45) && yakin(st.P, 75) && yakin(st.TF, 1012.5) && yakin(st.UF, 1012.5), "P = 120 − Q, P = 30 + Q → Q* = 45, P* = 75, TF = ÜF = 1012,5");
const st2 = Ç.arzTalep(135, 1, 30, 1);
ok(st2.Q > st.Q && st2.P > st.P, "talep artışı: P ↑, Q ↑");
const st3 = Ç.arzTalep(120, 1, 15, 1);
ok(st3.Q > st.Q && st3.P < st.P, "arz artışı: P ↓, Q ↑");
ok(yakin(Ç.arzTalep(100, 2, 10, 1).Q, 30) && yakin(Ç.arzTalep(100, 2, 10, 1).P, 40), "genel eğim: (A − C)/(B + D)");
const e1 = Ç.esneklik(10, 100, 12, 70);
ok(yakin(e1.E, (30 / 85) / (2 / 11), 1e-9) && e1.tur === "esnek" && e1.TG2 < e1.TG1, "orta nokta esnekliği ≈ 1,94: esnek, TG düşer", e1);
ok(Ç.esneklik(40, 1000, 60, 980).tur === "inelastik" && Ç.esneklik(40, 1000, 60, 980).TG2 > 40000, "inelastik: fiyat ↑ → TG ↑");
ok(yakin(Ç.esneklik(10, 120, 12, 100).E, 1, 1e-12) && Ç.esneklik(10, 120, 12, 100).tur === "birim", "birim esnek (orta nokta) ve TG sabit");
ok(yakin(Ç.esneklik(12, 70, 10, 100).E, e1.E), "orta nokta yönden bağımsız");
const a0 = Ç.adas(200, 0), a1 = Ç.adas(220, 0), lr = Ç.adas(220, Ç.adasUzunDonem(220));
ok(a0.Y === 100 && a0.P === 100 && a1.Y === 110 && a1.P === 110 && lr.Y === 100 && lr.P === 120, "AD ↑: kısa dönem Y 110 (enflasyonist açık), uzun dönem Y = Yf, PL 120");
const sr = Ç.adas(200, 20);
ok(sr.Y < 100 && sr.P > 100, "negatif arz şoku: stagflasyon (Y ↓, PL ↑)");
const rd = Ç.adas(180, 0), rdl = Ç.adas(180, Ç.adasUzunDonem(180));
ok(rd.Y === 90 && rdl.Y === 100 && rdl.P < rd.P, "resesyon açığı kendiliğinden kapanır: PL düşer");
ok(Ç.paraFaizi(100) === 5 && Ç.paraFaizi(120) === 4 && Ç.paraFaizi(80) === 6, "para piyasası: MS ↑ → i ↓");
ok(yakin(Ç.malMC(7.5), Ç.malAVC(7.5), 1e-12) && yakin(Ç.MIN_AVC, 8.75), "MC, AVC'yi minimumunda keser (q = 7,5; 8,75)");
let qa = 1, ma = Infinity; for (let q = 1; q <= 15; q += 0.0001) { const v = Ç.malATC(q); if (v < ma) { ma = v; qa = q; } }
ok(yakin(Ç.malMC(qa), ma, 0.01), "MC, ATC'yi minimumunda keser", [qa, ma]);
ok(yakin(Ç.malMC(Ç.karMaksQ(25)), 25, 1e-9) && Ç.karMaksQ(25) > 5, "MR = MC (artan kol) çözümü");
ok(yakin(Ç.malVC(2) - Ç.malVC(1), (Ç.malMC(1) + Ç.malMC(2)) / 2, 0.15), "MC ≈ ΔVC");

// 11) Java izleri
const javaBeklenen = ["16", "[6, 3]", "142536", "2 a"];
Ç.KODLAR.forEach((k, i) => {
  const s = k.adimlar(), son = s[s.length - 1];
  ok(son.out.trim() === k.beklenen && k.beklenen === javaBeklenen[i], "iz " + (i + 1) + " (" + k.ad + "): çıktı " + k.beklenen, son.out);
  ok(s.every(x => x.satir >= 1 && x.satir <= k.satirlar.length && typeof x.not === "string" && x.not), "iz " + (i + 1) + ": satır numaraları geçerli, her adımda açıklama");
  ok(JSON.stringify(k.adimlar()) === JSON.stringify(s), "iz " + (i + 1) + ": belirlenimli");
});
// Bağımsız yeniden hesap
let t1 = 0; for (let i = 1; i <= 7; i += 2) t1 += i;
const l2 = [4, 6, 6, 3, 8]; for (let i = 0; i < l2.length; i++) if (l2[i] % 2 === 0) l2.splice(i, 1);
let t3 = ""; const gg = [[1, 2, 3], [4, 5, 6]]; for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) t3 += gg[r][c];
ok(String(t1) === "16" && "[" + l2.join(", ") + "]" === "[6, 3]" && t3 === "142536", "izler bağımsız JS çalıştırmasıyla aynı");
ok(Ç.KODLAR[1].adimlar().some(x => /ATLANIR/.test(x.not)), "ArrayList izi atlama tuzağını açıklar");

// 12) İçerik şeması: Kendini dene + Akılda kal
const B = K.BIRIM;
const beklenenBirim = ["chem-u1", "chem-u2", "chem-u3", "chem-u4", "chem-u5", "chem-u6", "chem-u7", "chem-u8", "chem-u9", "bio-u1", "bio-u2", "bio-u3", "bio-u4", "bio-u5", "bio-u6", "bio-u7", "bio-u8", "eko-temel", "csa", "micro56", "macro16", "eng-temel", "eng-okuma", "eng-yazma"];
ok(beklenenBirim.every(k => B[k]), "24 ünite kutusu tanımlı");
let sema = [];
for (const [k, b] of Object.entries(B)) {
  if (!(b.akil.length >= 3 && b.akil.length <= 5)) sema.push(k + ": akılda kal 3–5 madde");
  if (!(b.sorular.length >= 1 && b.sorular.length <= 2)) sema.push(k + ": 1–2 soru");
  b.sorular.forEach(([s, sik, d, geri], j) => {
    if (sik.length !== 4 || geri.length !== 4 || !(d >= 0 && d < 4) || !s) sema.push(k + "#" + j + ": şık/geri bildirim");
    if (new Set(sik).size !== 4) sema.push(k + "#" + j + ": tekrarlı şık");
    if (/\$/.test(s + sik.join("") + geri.join(""))) sema.push(k + "#" + j + ": $ (MathJax çakışması)");
  });
  if (/\$/.test(b.akil.join(""))) sema.push(k + ": akılda kal içinde $");
}
ok(!sema.length, "soru ve madde şeması (4 şık, 4 geri bildirim, $ yok)", sema);
ok(K.TEZLER.length === 4 && K.PARAGRAF.length === 5 && Object.keys(K.ROL).length === 5, "English: 4 tez, 5 cümle, 5 retorik öğe");
ok(Object.values(K.ROL).every(r => r.yanlis.length === 2 && !r.yanlis.includes(r.dogru)), "retorik durum seçenekleri tutarlı");

// 13) Sayfa yerleşimi: yuvalar, ünite kutuları, adım adım işaretleri, kutu konteynerleri korunur
const SAYFA = {
  "ap-chemistry": { tur: ["titrasyon", "denge", "mb", "gaz", "pes"], birim: beklenenBirim.filter(k => k.startsWith("chem")), adim: 3 },
  "ap-biology": { tur: ["nufus", "hw", "enzim", "piramit"], birim: beklenenBirim.filter(k => k.startsWith("bio")), adim: 3 },
  "ap-electives": { tur: ["arztalep", "esneklik", "adas", "para", "maliyet", "kodiz"], birim: ["eko-temel", "csa", "micro56", "macro16"], adim: 2 },
  "ap-english": { tur: ["retorik", "tez", "akis"], birim: ["eng-temel", "eng-okuma", "eng-yazma"], adim: 2 }
};
const W = K._W;
for (const [s, p] of Object.entries(SAYFA)) {
  const h = fs.readFileSync(path.join(ROOT, s + ".html"), "utf8");
  ok(/<script src="\/assets\/js\/etkilesim-kbe\.js[^"]*" defer><\/script>/.test(h) && /href="\/assets\/css\/etkilesim-kbe\.css/.test(h), s + ": JS (defer) ve CSS bağlı");
  ok(p.tur.every(t => (h.match(new RegExp('data-kbe="' + t + '"', "g")) || []).length === 1 && W[t]), s + ": etkileşimli araçlar yerleşik (" + p.tur.join(", ") + ")");
  ok(p.birim.every(b => h.includes('data-kbe="birim" data-birim="' + b + '"')), s + ": ünite kutuları (" + p.birim.length + ")");
  ok((h.match(/data-kbe-adim/g) || []).length === p.adim, s + ": " + p.adim + " adım adım çözüm");
  const kutular = [...h.matchAll(/id="([^"]*quiz-container)"/g)].map(m => m[1]);
  ok(kutular.length > 0 && kutular.every(id => new RegExp('<div class="u-mt-6" id="' + id + '"( data-sb-yeni-kutu)?>\\s*</div>').test(h)), s + ": soru kutuları boş ve dokunulmamış (" + kutular.length + ")");
  ok(!/<h2[^>]*kbe|kbe[^>]*<h2/.test(h) && !/class="lecture-card[^"]*kbe/.test(h), s + ": yeni h2/lecture-card eklenmedi (ünite gruplaması korunur)");
}

console.log(`\n${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
