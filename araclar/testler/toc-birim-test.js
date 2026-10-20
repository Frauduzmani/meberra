// Tur 14 (Ajan 11): İçindekiler veri modeli — apTocParse / apTocHtml (assets/js/app.js) Node birim testi.
// Kullanım (proje klasöründen): node araclar/testler/toc-birim-test.js
// Yeni ünite yalnızca h2 eklenerek İçindekiler'e girer; bu test gerçek ve gelecekteki başlık biçimlerini dener.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.resolve(__dirname, "../../assets/js/app.js"), "utf8");
const bas = src.indexOf("const AP_TOC_QUIZ"), son = src.indexOf("// --- İçindekiler (uzun sayfalar)");
if (bas < 0 || son < bas) { console.error("FAIL apTocParse/apTocHtml bölümü app.js içinde bulunamadı"); process.exit(1); }
const ctx = { apEsc: x => String(x == null ? "" : x).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])) };
vm.createContext(ctx);
vm.runInContext(src.slice(bas, son) + "\nthis.apTocParse = apTocParse; this.apTocHtml = apTocHtml;", ctx);
const { apTocParse, apTocHtml } = ctx;

let fail = 0, pass = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const items = arr => arr.map((t, i) => Object.assign(apTocParse(t), { id: "h" + (i + 1) }));
const linkCount = html => (html.match(/<a /g) || []).length;

// 1) Başlık ayrıştırma
let r = apTocParse("AP Calculus AB/BC — Unit 6: Integration and Accumulation of Change");
ok(r.num === "6" && r.key === "unit:6" && r.label === "Integration and Accumulation of Change" && !r.quiz, "calc U6 anlatım: numara/anahtar/ad");
r = apTocParse("Unit 1: Limits and Continuity — Ultra-Comprehensive Concept Mastery");
ok(r.num === "1" && r.label === "Limits and Continuity", "alt başlık (— …) atıldı");
r = apTocParse("AP Calculus BC — Unit 10: Infinite Sequences and Series BC ONLY");
ok(r.num === "10" && r.bc && r.label === "Infinite Sequences and Series", "BC ONLY etikete dönüştü");
r = apTocParse("Unit 10 Infinite Sequences and Series: İnteraktif Soru İstasyonu");
ok(r.quiz && r.key === "unit:10" && r.label === "Unit 10 Infinite Sequences and Series", "soru istasyonu: anahtar ve bağlamlı ad");
r = apTocParse("Unit 2 (cont.): Circular Motion & Gravitation");
ok(r.num === "2" && r.label === "Circular Motion & Gravitation", "(cont.) ünitesi");
r = apTocParse("Section 3 — Reasoning on texts and data");
ok(r.num === "3" && r.kind === "section" && r.label === "Reasoning on texts and data", "CEnT-S Section başlığı adını korur");
r = apTocParse("Unit A: Rhetorical Analysis & Reading MCQ — İnteraktif Soru İstasyonu");
ok(r.quiz && r.label === "Unit A: Rhetorical Analysis & Reading MCQ", "English harfli ünite istasyonu");

// 2) Gelecekteki üniteler (Tur 14: Physics 1 U7, Chemistry U9, Biology U7) — yalnızca h2 eklenerek
const fizik = items([
  "AP Physics 1 Ünite İlerleme Haritası", "Kritik Fizik Formülleri (Tıkla ve Kopyala)", "Laboratuvar Tasarım Kuralları",
  "Unit 1: Kinematics (1D & 2D Motion)", "Unit 1 Kinematics: İnteraktif Soru İstasyonu",
  "Unit 2: Force and Translational Dynamics", "Unit 2 Force: İnteraktif Soru İstasyonu",
  "Unit 6: Energy and Momentum of Rotating Systems", "Unit 6 Rotating Systems: İnteraktif Soru İstasyonu",
  "AP Physics 1 — Unit 7: Oscillations", "Unit 7 Oscillations: İnteraktif Soru İstasyonu"
]);
let h = apTocHtml(fizik);
ok(h.units === 4 && h.unitWord === "ünite", "fizik: 4 ünite satırı (U7 dahil)");
ok(linkCount(h.list) === fizik.length, "fizik: bağlantı sayısı = başlık sayısı (" + fizik.length + ")");
ok(/href="#h10" class="toc-main"><span class="toc-num" aria-hidden="true">7<\/span>.*Oscillations.*href="#h11" class="toc-chip"[^>]*aria-label="Unit 7 soru istasyonu">Sorular/.test(h.list), "fizik U7: anlatım + Sorular çipi tek satırda");
ok((h.list.match(/class="toc-kicker"/g) || []).length === 1 && h.list.indexOf("Üniteler") > 0, "fizik: tek Üniteler grup başlığı");

const kimya = items(["Kritik Kimya Denklemleri", "AP Kimya 9 Temel Ünite Haritası"].concat(
  [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(n => ["Unit " + n + ": Topic " + n, "Unit " + n + " Topic " + n + ": İnteraktif Soru İstasyonu"])).concat(["Official Archive"]));
h = apTocHtml(kimya);
ok(h.units === 9 && linkCount(h.list) === kimya.length, "kimya: 9 ünite, bağlantı = başlık (" + kimya.length + ")");
ok(/Ek bölümler/.test(h.list), "kimya: ünitelerden sonraki bölüm Ek bölümler başlığı altında");
const satir = (h.list.match(/<li/g) || []).length;
ok(satir === 2 + 1 + 9 + 1 + 1, "kimya: satır sayısı 14 (2 genel + başlık + 9 ünite + başlık + 1 ek); 21 başlık → 14 satır");

// 3) Eşleşmeyen istasyon ayrı satır; gruplama 3 üniteden az ise yok
const secmeli = items(["Strategy", "AP Computer Science A (Units 1–4): İnteraktif Soru İstasyonu", "AP Microeconomics — Unit 5: Factor Markets and Unit 6: Market Failure", "Unit 5–6 (AP Micro) Factor Markets: İnteraktif Soru İstasyonu"]);
h = apTocHtml(secmeli);
ok(h.units === 0 && !/toc-kicker/.test(h.list) && !/toc-num/.test(h.list), "seçmeliler: grup yok, numara rozeti yok");
ok(/class="toc-quiz"><a href="#h2"><span class="toc-q">Sorular<\/span> AP Computer Science A \(Units 1–4\)/.test(h.list), "seçmeliler: eşleşmeyen istasyon bağlamlı ayrı satır");
ok(/>Unit 5: Factor Markets/.test(h.list), "seçmeliler: gruplanmayan ünite adı Unit N: biçiminde");
ok(linkCount(h.list) === secmeli.length, "seçmeliler: bağlantı = başlık");

// 4) Kaçış
h = apTocHtml(items(['A <b>"x"</b>', "B", "C"]));
ok(h.list.indexOf("<b>") < 0 && h.list.indexOf("&lt;b&gt;") > 0, "başlık metni HTML olarak kaçışlanır");

console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
process.exit(fail ? 1 : 0);
