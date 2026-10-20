// AP MEBERRA — Deneme soru bankası üreticisi (Tur 5, Ajan 12 + Ajan 3 Canan Yılmaz)
// Kullanım (proje klasöründen): node araclar/deneme-bankasi-olustur.js
//
// ap-*.html ve sinav-*.html sayfalarındaki tüm `const X_QUESTIONS = [...]` dizilerini
// node `vm` ile çıkarır (yöntem araclar/pm-denetim.js loadArrays ile aynıdır; ona
// bağımlılık kurulmaz), her soruyu yalnızca ETİKETLER ve data/sorular/deneme-bankasi.js'e yazar:
//   window.APMEBERRA_DENEME_BANKASI = { olusturma, kodlar: {<kod>: {...}}, pasajlar: {...}, sorular: [...] }
// Soru şeması değişmez; eklenen alanlar: sayfa, dizi, kap, kapBaslik, unite, denemeKodlari, (pasaj).
// Eşlenemeyen soru sessizce atlanmaz: uyarı basılır ve raporlanır (çıkış kodu 0, uyarı listesi ekranda).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "sorular", "deneme-bankasi.js");
const PAGES = fs.readdirSync(ROOT).filter(f => /^(ap|sinav)-.*\.html$/.test(f)).sort();

// --- CED ünite adları (College Board Course and Exam Description, güncel sürümler) ---
const CALC_UNITS = {
  1: "Limits and Continuity",
  2: "Differentiation: Definition and Fundamental Properties",
  3: "Differentiation: Composite, Implicit, and Inverse Functions",
  4: "Contextual Applications of Differentiation",
  5: "Analytical Applications of Differentiation",
  6: "Integration and Accumulation of Change",
  7: "Differential Equations",
  8: "Applications of Integration",
  9: "Parametric Equations, Polar Coordinates, and Vector-Valued Functions (BC)",
  10: "Infinite Sequences and Series (BC)"
};
const UNITS = {
  "calculus-ab": pick(CALC_UNITS, 1, 8),
  "calculus-bc": CALC_UNITS,
  "physics-1": {
    1: "Kinematics", 2: "Force and Translational Dynamics", 3: "Work, Energy, and Power",
    4: "Linear Momentum", 5: "Torque and Rotational Dynamics", 6: "Energy and Momentum of Rotating Systems",
    7: "Oscillations", 8: "Fluids"
  },
  chemistry: {
    1: "Atomic Structure and Properties", 2: "Compound Structure and Properties",
    3: "Properties of Substances and Mixtures", 4: "Chemical Reactions", 5: "Kinetics",
    6: "Thermochemistry", 7: "Equilibrium", 8: "Acids and Bases", 9: "Thermodynamics and Electrochemistry"
  },
  biology: {
    1: "Chemistry of Life", 2: "Cells", 3: "Cellular Energetics", 4: "Cell Communication and Cell Cycle",
    5: "Heredity", 6: "Gene Expression and Regulation", 7: "Natural Selection", 8: "Ecology"
  },
  // AP English Language CED soruları ünite değil BECERİ KATEGORİSİ (Skill Category 1–8) ile etiketler.
  "english-language": {
    1: "Skill Cat. 1 — Rhetorical Situation (Reading)", 2: "Skill Cat. 2 — Rhetorical Situation (Writing)",
    3: "Skill Cat. 3 — Claims and Evidence (Reading)", 4: "Skill Cat. 4 — Claims and Evidence (Writing)",
    5: "Skill Cat. 5 — Reasoning and Organization (Reading)", 6: "Skill Cat. 6 — Reasoning and Organization (Writing)",
    7: "Skill Cat. 7 — Style (Reading)", 8: "Skill Cat. 8 — Style (Writing)"
  },
  // AP CSA CED (2025–26 sürümü, 4 ünite)
  "cs-a": { 1: "Using Objects and Methods", 2: "Selection and Iteration", 3: "Class Creation", 4: "Data Collections" },
  // Ekonomi: Micro ve Macro iki ayrı AP sınavıdır; ünite anahtarı "Micro 2" / "Macro 3" biçimindedir.
  economics: {
    "Micro 1": "Micro · Basic Economic Concepts", "Micro 2": "Micro · Supply and Demand",
    "Micro 3": "Micro · Production, Cost, and the Perfect Competition Model", "Micro 4": "Micro · Imperfect Competition",
    "Micro 5": "Micro · Factor Markets", "Micro 6": "Micro · Market Failure and the Role of Government",
    "Macro 1": "Macro · Basic Economic Concepts", "Macro 2": "Macro · Economic Indicators and the Business Cycle",
    "Macro 3": "Macro · National Income and Price Determination", "Macro 4": "Macro · Financial Sector",
    "Macro 5": "Macro · Long-Run Consequences of Stabilization Policies", "Macro 6": "Macro · Open Economy — International Trade and Finance"
  }
};
function pick(obj, a, b) { const o = {}; for (let i = a; i <= b; i++) o[i] = obj[i]; return o; }

const CODES = {
  "calculus-ab": { ad: "AP Calculus AB", sayfa: "ap-calculus.html", uniteTuru: "CED Unit" },
  "calculus-bc": { ad: "AP Calculus BC", sayfa: "ap-calculus.html", uniteTuru: "CED Unit" },
  "physics-1": { ad: "AP Physics 1: Algebra-Based", sayfa: "ap-physics.html", uniteTuru: "CED Unit" },
  chemistry: { ad: "AP Chemistry", sayfa: "ap-chemistry.html", uniteTuru: "CED Unit" },
  biology: { ad: "AP Biology", sayfa: "ap-biology.html", uniteTuru: "CED Unit" },
  "english-language": { ad: "AP English Language and Composition", sayfa: "ap-english.html", uniteTuru: "CED Skill Category" },
  "cs-a": { ad: "AP Computer Science A", sayfa: "ap-electives.html", uniteTuru: "CED Unit" },
  economics: { ad: "AP Micro/Macroeconomics", sayfa: "ap-electives.html", uniteTuru: "CED Unit (Micro/Macro)" }
};
// CEnT-S yalnızca sinav-cents.html varsa eklenir.
const HAS_CENTS = fs.existsSync(path.join(ROOT, "sinav-cents.html"));
if (HAS_CENTS) { CODES.cents = { ad: "CEnT-S (CISIA)", sayfa: "sinav-cents.html", uniteTuru: "Bölüm" }; UNITS.cents = {}; }

// Calculus BC'ye özgü CED konuları (AB denemesine girmez)
const BC_ONLY_TOPICS = new Set(["6.11", "6.12", "6.13", "7.5", "7.9", "8.13"]);

function loadPage(file) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const ctx = { document: { addEventListener() {} }, window: {}, console: { log() {}, warn() {} } };
  vm.createContext(ctx);
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    vm.runInContext(m[1].replace(/\bconst (\w+_QUESTIONS\w*)/g, "var $1"), ctx, { filename: file });
  }
  const arrays = Object.keys(ctx).filter(k => /_QUESTIONS/.test(k)).map(k => [k, ctx[k]]);
  const containers = [...html.matchAll(/initInteractiveQuiz\(\s*"([^"]+)"\s*,\s*(\w+)\s*\)/g)].map(m => [m[1], m[2]]);
  return { html, arrays, containers };
}

const strip = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// app.js apUnitTitle ile aynı kural: konteynerin bölümündeki .panel-title, "İnteraktif ..." eki atılır.
function sectionOf(html, containerId) {
  const at = html.indexOf(`id="${containerId}"`);
  if (at < 0) return null;
  const start = html.lastIndexOf("<section", at);
  const end = html.indexOf("</section>", at);
  return { start, end, text: html.slice(start, end < 0 ? html.length : end) };
}
function unitTitle(html, containerId) {
  const sec = sectionOf(html, containerId);
  const at = html.indexOf(`id="${containerId}"`);
  const chunk = sec ? html.slice(sec.start, at) : "";
  const all = [...chunk.matchAll(/class="panel-title"[^>]*>([\s\S]*?)<\/h2>/g)];
  if (all.length) {
    const t = strip(all[all.length - 1][1]).replace(/\s*[:\-–—]?\s*(İnteraktif|Interactive)\b.*$/i, "").trim();
    if (t) return t;
  }
  return containerId;
}
// Pasaj/taslak metinleri (English): bölümdeki lecture-card'lar "Passage N — ..." / "Draft N — ..."
function passagesOf(html, containerId) {
  const sec = sectionOf(html, containerId);
  if (!sec) return {};
  const out = {};
  const re = /<div class="theory-title"><span>(((?:Passage|Draft|Text|Source)\s+\d+)[^<]*)<\/span>[\s\S]*?<\/div>\s*<div class="theory-body">([\s\S]*?)<\/div>\s*<\/div>/g;
  for (const m of sec.text.matchAll(re)) out[m[2]] = { baslik: strip(m[1]), html: m[3].trim() };
  return out;
}

// Ünite çıkarımı: öncelik source "CED Topic x.y" / "CED Unit n" / "CED Skill n.X" → topic "x.y" → dizi adı
function unitOf(q, dizi) {
  const src = String(q.source || ""), top = String(q.topic || "");
  let m;
  if ((m = src.match(/CED Topics?\s+(Micro|Macro)\s+(\d+)\.\d+/i))) return { unite: cap(m[1]) + " " + m[2], neden: "source" };
  if ((m = src.match(/CED Topics?\s+(\d+)\.(\d+)/i))) return { unite: m[1], konu: m[1] + "." + m[2], neden: "source" };
  if ((m = src.match(/CED Skill\s+(\d)\.[A-Z]/i))) return { unite: m[1], neden: "source-skill" };
  if ((m = src.match(/CED Unit\s+(\d+)/i))) return { unite: m[1], neden: "source-unit" };
  if ((m = top.match(/^(?:\[[^\]]*\]\s*)?(Micro|Macro)\s+(\d+)\.\d+/i))) return { unite: cap(m[1]) + " " + m[2], neden: "topic" };
  if ((m = top.match(/^(?:\[[^\]]*\]\s*)?(\d+)\.(\d+)/))) return { unite: m[1], konu: m[1] + "." + m[2], neden: "topic" };
  if ((m = dizi.match(/UNIT(\d+)/))) return { unite: m[1], neden: "dizi" };
  // CEnT-S: CED ünitesi yok; bölüm adı dizi adından gelir (CENTS_<BOLUM>_QUESTIONS).
  if ((m = dizi.match(/^CENTS_([A-Z]+)_QUESTIONS/))) {
    const BOLUM = { READING: "Reading", MATH: "Mathematics", REASONING: "Reasoning", BIOLOGY: "Biology", CHEMISTRY: "Chemistry", PHYSICS: "Physics" };
    return { unite: BOLUM[m[1]] || cap(m[1].toLowerCase()), neden: "dizi-cents" };
  }
  return null;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
function topicNo(q) {
  const m = (String(q.source).match(/CED Topics?\s+(\d+\.\d+)/i) || String(q.topic).match(/(?:^|\]\s*)(\d+\.\d+)/));
  return m ? m[1] : null;
}

// Hangi deneme kodlarına girer? Dönüş: { kodlar: [...], neden?: "..." }
function codesOf(file, dizi, q, u) {
  const txt = String(q.source) + " " + String(q.topic);
  if (file === "ap-calculus.html") {
    const n = Number(u.unite);
    const bcOnly = /BC\s*ONLY/i.test(txt) || BC_ONLY_TOPICS.has(topicNo(q)) || n >= 9;
    const k = [];
    if (n >= 1 && n <= 8 && !bcOnly) k.push("calculus-ab");
    if (n >= 1 && n <= 10) k.push("calculus-bc");
    return { kodlar: k };
  }
  if (file === "ap-physics.html") {
    if (/Physics C/i.test(txt)) return { kodlar: [], neden: "Physics C kapsamı (physics-1 denemesine girmez; physics-c deneme kodu yok)" };
    return { kodlar: ["physics-1"] };
  }
  if (file === "ap-chemistry.html") return { kodlar: ["chemistry"] };
  if (file === "ap-biology.html") return { kodlar: ["biology"] };
  if (file === "ap-english.html") return { kodlar: ["english-language"] };
  if (file === "ap-electives.html") {
    if (/^CSA_/.test(dizi)) return { kodlar: ["cs-a"] };
    if (/^ECON_/.test(dizi)) return { kodlar: ["economics"] };
  }
  if (file === "sinav-cents.html" && HAS_CENTS) return { kodlar: ["cents"] };
  return { kodlar: [], neden: "sayfa/dizi için deneme kodu tanımlı değil" };
}

const sorular = [];
const pasajlar = {};
const uyarilar = [];
const diziFarki = [];
for (const file of PAGES) {
  let data;
  try { data = loadPage(file); } catch (e) { uyarilar.push(`${file}: script çalıştırılamadı — ${e.message}`); continue; }
  const kapOf = Object.fromEntries(data.containers.map(([cid, arr]) => [arr, cid]));
  for (const [dizi, qs] of data.arrays) {
    const kap = kapOf[dizi] || null;
    const kapBaslik = kap ? unitTitle(data.html, kap) : dizi;
    const pas = kap ? passagesOf(data.html, kap) : {};
    for (const [label, p] of Object.entries(pas)) pasajlar[`${dizi}:${label}`] = p;
    if (!kap) uyarilar.push(`${file} ${dizi}: initInteractiveQuiz konteyneri bulunamadı (ders sayfası bağlantısı yalnız sayfaya gider)`);
    for (const q of qs) {
      const u = unitOf(q, dizi);
      if (!u) { uyarilar.push(`${q.id} (${file} ${dizi}): ünite çıkarılamadı — atlandı`); continue; }
      const { kodlar, neden } = codesOf(file, dizi, q, u);
      if (!kodlar.length) { uyarilar.push(`${q.id} (${file} ${dizi}): ${neden} — atlandı`); continue; }
      const dm = dizi.match(/UNIT(\d+)/);
      if (dm && /^\d+$/.test(u.unite) && dm[1] !== u.unite) diziFarki.push(`${q.id}: dizi ${dizi} → CED ünite ${u.unite}`);
      for (const k of kodlar) {
        if (!UNITS[k][u.unite] && k !== "cents") uyarilar.push(`${q.id}: ${k} için tanımsız ünite "${u.unite}"`);
      }
      const extra = { sayfa: file, dizi, kap, kapBaslik, unite: String(u.unite), denemeKodlari: kodlar };
      const pm = (String(q.topic) + " " + strip(q.question).slice(0, 80)).match(/\b(Passage|Draft|Text|Source)\s+(\d+)\b/);
      if (pm && pasajlar[`${dizi}:${pm[1]} ${pm[2]}`]) extra.pasaj = `${dizi}:${pm[1]} ${pm[2]}`;
      else if (Object.keys(pas).length) uyarilar.push(`${q.id}: bölümde pasaj var ama soru bir pasaja bağlanamadı`);
      sorular.push(Object.assign({}, q, extra));
    }
  }
}

// Tekrar eden id kontrolü (sayfa|id benzersiz olmalı)
const seen = new Set();
for (const q of sorular) { const k = q.sayfa + "|" + q.id; if (seen.has(k)) uyarilar.push(`tekrar eden id: ${k}`); seen.add(k); }

const kodlar = {};
for (const [kod, meta] of Object.entries(CODES)) {
  const qs = sorular.filter(q => q.denemeKodlari.includes(kod));
  const sayim = {};
  for (const q of qs) sayim[q.unite] = (sayim[q.unite] || 0) + 1;
  const names = UNITS[kod] || {};
  const keys = Object.keys(names).length ? Object.keys(names) : Object.keys(sayim);
  for (const k of Object.keys(sayim)) if (!keys.includes(k)) keys.push(k);
  kodlar[kod] = Object.assign({}, meta, {
    soruSayisi: qs.length,
    uniteler: keys.map(no => ({ no, ad: names[no] || ("Bölüm " + no), soruSayisi: sayim[no] || 0 }))
  });
}

const bank = { olusturma: new Date().toISOString(), surum: 1, kodlar, pasajlar, sorular };
const body = "// OTOMATİK ÜRETİLDİ — elle düzenlemeyin. Kaynak: ap-*.html / sinav-*.html soru dizileri.\n" +
  "// Üretici: node araclar/deneme-bankasi-olustur.js\n" +
  "window.APMEBERRA_DENEME_BANKASI = " + JSON.stringify(bank) + ";\n";
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, body, "utf8");

console.log(`Sayfalar: ${PAGES.join(", ")}`);
console.log(`Toplam etiketlenen soru: ${sorular.length} · pasaj: ${Object.keys(pasajlar).length} · CEnT-S: ${HAS_CENTS ? "var" : "yok (sinav-cents.html bulunamadı)"}`);
for (const [kod, k] of Object.entries(kodlar)) {
  const cov = k.uniteler.filter(u => u.soruSayisi).map(u => `${u.no}:${u.soruSayisi}`).join(" ");
  console.log(`  ${kod.padEnd(17)} ${String(k.soruSayisi).padStart(4)} soru  [${cov}]`);
}
if (diziFarki.length) console.log(`\nBilgi — dizi adı ile CED ünitesi farklı (${diziFarki.length} soru, CED ünitesi kullanıldı):\n  ` + summarize(diziFarki));
console.log(`\nUyarılar / eşlenemeyen: ${uyarilar.length}`);
for (const w of uyarilar) console.log("  ! " + w);
console.log(`\nYazıldı: ${path.relative(ROOT, OUT)} (${(Buffer.byteLength(body) / 1024).toFixed(0)} KB)`);

function summarize(list) {
  const by = {};
  for (const s of list) { const k = s.replace(/^[^:]+: /, ""); by[k] = (by[k] || 0) + 1; }
  return Object.entries(by).map(([k, n]) => `${k} (${n})`).join("\n  ");
}
