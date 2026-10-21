#!/usr/bin/env node
"use strict";
/**
 * Meberra 1.18.0 — kavram kartı aracı (server/tohum/kartlar.json).
 *
 *   node araclar/kart-uret.js                     → kartlar.json'u doğrula + CED kapsam raporu
 *   node araclar/kart-uret.js --birlestir <klasör> → klasördeki ders parçalarını (calculus.json, physics.json …: kart dizisi)
 *                                                   DESTELER düzeniyle birleştirip kartlar.json'a yazar, sonra doğrular
 *   --sessiz : yalnızca hata/uyarı ve özet satırı
 *
 * Doğrulama (hata → çıkış kodu 1): yapı (id, ders, sayfa, unite, on, arka, etiket, kaynakKonu), benzersiz id, bilinen deste,
 * etiket ∈ tanim|formul|kural|yanilgi, arka ≤ 60 sözcük, on ≤ 160 karakter, LaTeX dengesi ($ çift, { } dengeli, \( \) eşli),
 * aynı destede yinelenen ön yüz yok. Uyarı: kaynakKonu konu numarası soru bankasında (ek.cedKonu / konu) o ünite için yok;
 * destede "yanilgi" kartı yok. Rapor: ünite başına bankadaki CED konu numaralarından kaçı kartlarla kapsanıyor.
 */
const fs = require("fs");
const path = require("path");

const KOK = path.join(__dirname, "..");
const HEDEF = path.join(KOK, "server", "tohum", "kartlar.json");
const BANKA = path.join(KOK, "server", "tohum", "soru-bankasi.json");
const ETIKETLER = ["tanim", "formul", "kural", "yanilgi"];
const ARKA_SOZCUK = 60, ON_KARAKTER = 160;

/** Ders ve deste (ünite) düzeni: sıra = arayüz sırası = ücretsiz kural sırası (ilk 2 deste açık) */
const DESTELER = [
  { ders: "calculus", ad: "Calculus AB/BC", sayfa: "ap-calculus", dosya: "calculus.json", uniteler: [
    ["1", "Limits and Continuity"], ["2", "Differentiation: Definition and Fundamental Properties"], ["3", "Differentiation: Composite, Implicit, and Inverse Functions"],
    ["4", "Contextual Applications of Differentiation"], ["5", "Analytical Applications of Differentiation"], ["6", "Integration and Accumulation of Change"],
    ["7", "Differential Equations"], ["8", "Applications of Integration"], ["9", "Parametric Equations, Polar Coordinates, and Vector-Valued Functions (BC)"],
    ["10", "Infinite Sequences and Series (BC)"]] },
  { ders: "physics", ad: "Physics 1", sayfa: "ap-physics", dosya: "physics.json", uniteler: [
    ["1", "Kinematics"], ["2", "Force and Translational Dynamics"], ["3", "Work, Energy, and Power"], ["4", "Linear Momentum"],
    ["5", "Torque and Rotational Dynamics"], ["6", "Energy and Momentum of Rotating Systems"], ["7", "Oscillations"], ["8", "Fluids"]] },
  { ders: "chemistry", ad: "Chemistry", sayfa: "ap-chemistry", dosya: "chemistry.json", uniteler: [
    ["1", "Atomic Structure and Properties"], ["2", "Compound Structure and Properties"], ["3", "Properties of Substances and Mixtures"],
    ["4", "Chemical Reactions"], ["5", "Kinetics"], ["6", "Thermochemistry"], ["7", "Equilibrium"], ["8", "Acids and Bases"],
    ["9", "Thermodynamics and Electrochemistry"]] },
  { ders: "biology", ad: "Biology", sayfa: "ap-biology", dosya: "biology.json", uniteler: [
    ["1", "Chemistry of Life"], ["2", "Cell Structure and Function"], ["3", "Cellular Energetics"], ["4", "Cell Communication and Cell Cycle"],
    ["5", "Heredity"], ["6", "Gene Expression and Regulation"], ["7", "Natural Selection"], ["8", "Ecology"]] },
  { ders: "english", ad: "English Language", sayfa: "ap-english", dosya: "english.json", uniteler: [
    ["A", "Rhetorical Situation and Choices"], ["B", "Argument and Style Terms"], ["C", "Essay Scoring Rubric"]] },
  { ders: "csa", ad: "Computer Science A", sayfa: "ap-electives", dosya: "csa.json", uniteler: [
    ["1", "Using Objects and Methods"], ["2", "Selection and Iteration"], ["3", "Class Creation"], ["4", "Data Collections"]] },
  { ders: "micro", ad: "Microeconomics", sayfa: "ap-electives", dosya: "micro.json", uniteler: [
    ["Micro 1", "Basic Economic Concepts"], ["Micro 2", "Supply and Demand"], ["Micro 3", "Production, Cost, and the Perfect Competition Model"],
    ["Micro 4", "Imperfect Competition"], ["Micro 5", "Factor Markets"], ["Micro 6", "Market Failure and the Role of Government"]] },
  { ders: "macro", ad: "Macroeconomics", sayfa: "ap-electives", dosya: "macro.json", uniteler: [
    ["Macro 1", "Basic Economic Concepts"], ["Macro 2", "Economic Indicators and the Business Cycle"], ["Macro 3", "National Income and Price Determination"],
    ["Macro 4", "Financial Sector"], ["Macro 5", "Long-Run Consequences of Stabilization Policies"], ["Macro 6", "Open Economy: International Trade and Finance"]] }
];

const sozcuk = s => String(s || "").trim().split(/\s+/).filter(Boolean).length;
/** LaTeX dengesi: kaçışsız $ sayısı çift, { } dengeli (\{ \} hariç), \( \) eşli. Dönüş: hata metni | null */
function latexDenetle(s) {
  s = String(s || "");
  const dolar = (s.replace(/\\\$/g, "").match(/\$/g) || []).length;
  if (dolar % 2) return "tek sayıda $";
  let d = 0;
  const t = s.replace(/\\[{}]/g, "");
  for (const ch of t) { if (ch === "{") d++; else if (ch === "}") { d--; if (d < 0) return "fazla }"; } }
  if (d) return "kapanmamış {";
  if ((s.match(/\\\(/g) || []).length !== (s.match(/\\\)/g) || []).length) return "\\( \\) eşleşmiyor";
  return null;
}
/** Konu numarası: "1.6 Nucleic Acids" → "1.6"; İngilizce beceri kodu "4.A Thesis" → "4.A"; "Rubric …" → null */
function konuNo(s) { const m = /(\d+\.(?:\d+|[A-C]))\b/.exec(String(s || "")); return m ? m[1] : null; }

/** Bankadaki ünite → konu numaraları (sayfa|unite anahtarıyla; İngilizce sayfa geneli) */
function bankaKonulari() {
  const out = {};
  let L = [];
  try { L = JSON.parse(fs.readFileSync(BANKA, "utf8")).sorular || []; } catch (e) { return out; }
  L.forEach(q => {
    const kaynak = [q.ek && q.ek.cedKonu, q.konu].filter(Boolean);
    kaynak.forEach(k => {
      const no = konuNo(String(k).replace(/^.*·\s*/, ""));
      if (!no) return;
      const anahtar = q.sayfa === "ap-english" ? "ap-english|*" : q.sayfa + "|" + q.unite;
      (out[anahtar] = out[anahtar] || new Set()).add(no);
    });
  });
  return out;
}

/** Saf doğrulama: { hatalar: [], uyarilar: [], rapor: [{ ders, unite, kart, kapsanan, bankaKonu }] } */
function denetle(veri, banka) {
  const hatalar = [], uyarilar = [], rapor = [];
  const dersler = veri.dersler || [], kartlar = veri.kartlar || [];
  const deste = {};
  dersler.forEach(d => (d.uniteler || []).forEach(u => { deste[d.ders + "|" + u.unite] = { d, u }; }));
  const idler = new Set(), onlar = new Set();
  kartlar.forEach((k, i) => {
    const yer = k && k.id ? k.id : "#" + i;
    ["id", "ders", "sayfa", "unite", "on", "arka", "etiket", "kaynakKonu"].forEach(a => { if (!k || typeof k[a] !== "string" || !k[a].trim()) hatalar.push(yer + ": " + a + " eksik"); });
    if (!k || !k.id) return;
    if (idler.has(k.id)) hatalar.push(yer + ": yinelenen id"); idler.add(k.id);
    if (!/^[a-z]+-[A-Za-z0-9]+-\d{2}$/.test(k.id)) hatalar.push(yer + ": id biçimi (ör. calc-u1-01)");
    const ds = deste[k.ders + "|" + k.unite];
    if (!ds) hatalar.push(yer + ": bilinmeyen deste " + k.ders + "/" + k.unite);
    else if (ds.d.sayfa !== k.sayfa) hatalar.push(yer + ": sayfa " + k.sayfa + " ≠ " + ds.d.sayfa);
    if (ETIKETLER.indexOf(k.etiket) < 0) hatalar.push(yer + ": etiket " + k.etiket);
    if (sozcuk(k.arka) > ARKA_SOZCUK) hatalar.push(yer + ": arka " + sozcuk(k.arka) + " sözcük (> " + ARKA_SOZCUK + ")");
    if (String(k.on || "").length > ON_KARAKTER) hatalar.push(yer + ": ön yüz " + k.on.length + " karakter (> " + ON_KARAKTER + ")");
    ["on", "arka"].forEach(a => { const h = latexDenetle(k[a]); if (h) hatalar.push(yer + ": " + a + " LaTeX: " + h); });
    const onAnahtar = k.ders + "|" + k.unite + "|" + String(k.on || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (onlar.has(onAnahtar)) hatalar.push(yer + ": aynı destede yinelenen ön yüz"); onlar.add(onAnahtar);
    if (banka) {
      const no = konuNo(k.kaynakKonu);
      const kume = banka[k.sayfa === "ap-english" ? "ap-english|*" : k.sayfa + "|" + k.unite];
      if (no && kume && !kume.has(no) && !/^Rubric/i.test(k.kaynakKonu)) uyarilar.push(yer + ": kaynakKonu " + no + " bankada bu ünite için yok");
    }
  });
  dersler.forEach(d => (d.uniteler || []).forEach(u => {
    const ks = kartlar.filter(k => k.ders === d.ders && k.unite === u.unite);
    if (!ks.length) hatalar.push(d.ders + "/" + u.unite + ": boş deste");
    if (ks.length && !ks.some(k => k.etiket === "yanilgi")) uyarilar.push(d.ders + "/" + u.unite + ": yanılgı kartı yok");
    const kume = banka && banka[d.sayfa === "ap-english" ? "ap-english|*" : d.sayfa + "|" + u.unite];
    const kapsanan = kume ? new Set(ks.map(k => konuNo(k.kaynakKonu)).filter(n => n && kume.has(n))).size : null;
    rapor.push({ ders: d.ders, unite: u.unite, kart: ks.length, kapsanan, bankaKonu: kume ? kume.size : null });
  }));
  return { hatalar, uyarilar, rapor };
}

function birlestir(klasor) {
  const kartlar = [];
  const dersler = DESTELER.map(d => {
    const dosya = path.join(klasor, d.dosya);
    const parca = JSON.parse(fs.readFileSync(dosya, "utf8"));
    const sira = d.uniteler.map(u => u[0]);
    parca.slice().sort((a, b) => sira.indexOf(a.unite) - sira.indexOf(b.unite) || String(a.id).localeCompare(String(b.id)))
      .forEach(k => {
        const o = { id: k.id, ders: d.ders, sayfa: d.sayfa, unite: String(k.unite), on: k.on, arka: k.arka, etiket: k.etiket, kaynakKonu: k.kaynakKonu };
        if (k.bc) o.bc = true;
        kartlar.push(o);
      });
    return { ders: d.ders, ad: d.ad, sayfa: d.sayfa, uniteler: d.uniteler.map(u => ({ unite: u[0], ad: u[1] })) };
  });
  let surum = 1;
  try { surum = (JSON.parse(fs.readFileSync(HEDEF, "utf8")).surum || 0) + 1; } catch (e) { /* ilk */ }
  const veri = { surum, olusturma: new Date().toISOString().slice(0, 10),
    aciklama: "Meberra kavram kartları (1.18.0). Özgün içerik; AP CED ünite/konu düzeni. araclar/kart-uret.js ile doğrulanır.", dersler, kartlar };
  fs.writeFileSync(HEDEF, JSON.stringify(veri, null, 1) + "\n");
  return veri;
}

function main() {
  const a = process.argv.slice(2), sessiz = a.includes("--sessiz");
  const bi = a.indexOf("--birlestir");
  const veri = bi >= 0 ? birlestir(path.resolve(a[bi + 1] || ".")) : JSON.parse(fs.readFileSync(HEDEF, "utf8"));
  const sonuc = denetle(veri, bankaKonulari());
  sonuc.hatalar.forEach(h => console.error("HATA  " + h));
  sonuc.uyarilar.forEach(h => console.warn("uyarı " + h));
  if (!sessiz) {
    const dersSay = {};
    sonuc.rapor.forEach(r => {
      dersSay[r.ders] = (dersSay[r.ders] || 0) + r.kart;
      console.log("  " + (r.ders + "/" + r.unite).padEnd(18) + String(r.kart).padStart(3) + " kart" + (r.bankaKonu ? "  CED kapsamı " + r.kapsanan + "/" + r.bankaKonu + " banka konusu" : ""));
    });
    console.log("Ders başına: " + Object.keys(dersSay).map(k => k + " " + dersSay[k]).join(", "));
  }
  console.log((sonuc.hatalar.length ? "BAŞARISIZ" : "TAMAM") + ": " + veri.kartlar.length + " kart, " + sonuc.hatalar.length + " hata, " + sonuc.uyarilar.length + " uyarı");
  process.exit(sonuc.hatalar.length ? 1 : 0);
}

if (require.main === module) main();
module.exports = { denetle, latexDenetle, konuNo, bankaKonulari, DESTELER, ARKA_SOZCUK, HEDEF };
