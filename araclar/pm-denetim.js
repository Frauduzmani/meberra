// AP MEBERRA — PM Doğruluk Kapısı denetim aracı (AGENTS.md §2.1)
// Kullanım (proje klasöründen): node araclar/pm-denetim.js
// v1.5.0: sorular sunucu veritabanında; kaynak = tohum dosyası server/tohum/soru-bankasi.json (araclar/soru-aktar.js üretir,
// yönetici dışa aktarımı aynı biçimdedir). 1) Ders sayfası soru istasyonları (kutu başına), 2) seviye testi bankaları
// (meta: data/sorular/seviye/*.js, sorular: tohum) şema/kalite kurallarıyla denetlenir. Arşivlenmiş sorular sayılmaz. Teslim şartı: 0 sorun.
// İsteğe bağlı: --tohum <dosya.json> (ör. yönetici panelinden dışa aktarılan banka).
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { eskiSema } = require("./soru-aktar.js");

const ROOT = path.resolve(__dirname, "..");
const TOHUM = (() => { const i = process.argv.indexOf("--tohum"); return i > 0 ? path.resolve(process.argv[i + 1]) : path.join(ROOT, "server", "tohum", "soru-bankasi.json"); })();
const TUM = JSON.parse(fs.readFileSync(TOHUM, "utf8")).sorular;
// v1.11.0: taslak sorular öğrenciye sunulmaz → sayfa/istasyon denetimi yalnız AKTİF sorularla yapılır; taslaklar ayrıca
// (onaylandıktan sonraki hâl: aktif + taslak birlikte) kalite kurallarıyla denetlenir ve ayrı sayılır.
const BANKA = TUM.filter(r => r.durum !== "arsiv" && r.durum !== "taslak");
const TASLAK = TUM.filter(r => r.durum === "taslak");
const PAGES = fs.readdirSync(ROOT).filter(f => /^(ap|sinav)-.*.html$/.test(f));
const SEVIYE_DIR = path.join(ROOT, "data", "sorular", "seviye");
const FORBIDDEN_SOURCE = /official|past exam|canonical|college board exam/i;
const BANK_FIELDS = ["id", "topic", "difficulty", "source", "question", "options", "generalRemediation", "stepByStepSolution"];
const SEVIYE_FIELDS = ["id", "unite", "beceri", "zorluk", "source", "question", "options", "generalRemediation", "stepByStepSolution"];
const LETTER_REF = /(?:doğru\s+(?:cevap|yanıt|şık|seçenek)(?:\s+(?:budur|ise))?|cevap|answer|correct\s+(?:answer|choice|option)|sonuç)\s*(?:is|=|:|→|⇒|\\implies)?\s*\(?\s*([A-D])\s*\)?(?![\p{L}\d])|(?<![\p{L}\d])([A-D])\s*şıkkı\s*(?:doğru|doğrudur)/giu;

/** Bir ders sayfasının soru istasyonları: [[kutu, eski şemada sorular]] (tohum sırasıyla). */
function loadArrays(file) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const sayfa = file.replace(/.html$/, ""), by = new Map();
  for (const r of BANKA) if (r.tur === "ders" && r.sayfa === sayfa) { if (!by.has(r.kutu)) by.set(r.kutu, []); by.get(r.kutu).push(eskiSema(r)); }
  const arrays = Array.from(by.entries());
  return { html, arrays, containers: arrays.map(([k]) => [k, k]) };
}

const textOf = o => String(o.text).replace(/<[^>]+>|\$/g, "");
const norm = t => String(t).replace(/<[^>]+>|\$|\\\\?[a-z]+|\s+/gi, "").toLowerCase();

// Shared per-question checks. Returns { pos, longest } and pushes into issues.
function checkQuestions(qs, fields, seen, issues) {
  const pos = { A: 0, B: 0, C: 0, D: 0 };
  let longest = 0;
  for (const q of qs) {
    const tag = q.id || `#${q.number}`;
    if (seen.has(q.id)) issues.push(`${tag}: tekrar eden id`);
    seen.add(q.id);
    for (const k of fields) if (!q[k]) issues.push(`${tag}: eksik alan ${k}`);
    const opts = q.options || [];
    const correct = opts.filter(o => o.isCorrect);
    if (correct.length !== 1) issues.push(`${tag}: ${correct.length} doğru şık`);
    else pos[correct[0].id] = (pos[correct[0].id] || 0) + 1;
    if (opts.map(o => o.id).join("") !== "ABCD".slice(0, opts.length)) issues.push(`${tag}: şık harf sırası bozuk`);
    for (const o of opts) if (!o.isCorrect && (!o.errorTag || !o.remediation)) issues.push(`${tag}: ${o.id} şıkkında errorTag/remediation eksik`);
    if (FORBIDDEN_SOURCE.test(q.source || "")) issues.push(`${tag}: yanıltıcı source "${q.source}"`);
    if (/\*\*[^*]+\*\*/.test(JSON.stringify(q))) issues.push(`${tag}: ham Markdown **`);
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(Object.values(q).filter(v => typeof v === "string").join("") + opts.map(o => o.text + (o.remediation || "")).join(""))) issues.push(`${tag}: kontrol karakteri (tek ters bölü kaçışı?)`);
    for (const field of [q.question, q.stepByStepSolution, q.generalRemediation]) {
      const dollars = (String(field).replace(/\\\$/g, "").match(/\$/g) || []).length;
      if (dollars % 2) { issues.push(`${tag}: tek sayıda $`); break; }
    }
    if (correct.length === 1) {
      // Çözüm/açıklama metni doğru şıkkı harfle anıyorsa, işaretli doğru şıkla aynı olmalı.
      const expl = [q.stepByStepSolution, q.generalRemediation].join(" ").replace(/<[^>]+>/g, " ");
      for (const m of expl.matchAll(LETTER_REF)) {
        const L = m[1] || m[2];
        if (L !== L.toUpperCase()) continue; // şık adları büyük harf; "a", "c" gibi küçük harfler kelime parçasıdır
        if (L !== correct[0].id) { issues.push(`${tag}: çözüm metni "${m[0].trim()}" diyor, işaretli doğru şık ${correct[0].id}`); break; }
      }
      const lens = opts.map(o => textOf(o).length);
      const cl = textOf(correct[0]).length;
      if (cl === Math.max(...lens) && lens.filter(l => l === cl).length === 1 && cl > 1.25 * Math.max(...lens.filter(l => l !== cl))) longest++;
    }
  }
  if (qs.length >= 8 && Math.max(...Object.values(pos)) > qs.length * 0.5) issues.push(`doğru şık dağılımı dengesiz ${JSON.stringify(pos)}`);
  if (qs.length >= 8 && longest / qs.length > 0.4) issues.push(`doğru şık belirgin en uzun: ${longest}/${qs.length}`);
  return { pos, longest };
}

let total = 0, problems = 0;
const rows = [], uyarilar = [];
const bankTexts = new Map(); // normalized question text → id (kopya tanı sorusu yakalamak için)

// 1) Ders sayfalarındaki soru bankası
for (const file of PAGES) {
  let data;
  try { data = loadArrays(file); } catch (e) { console.log(`✗ ${file}: script hatası — ${e.message}`); problems++; continue; }
  const { html, arrays, containers } = data;
  const seen = new Set();
  for (const [cid] of containers) {
    if (!html.includes(`id="${cid}"`)) { console.log(`✗ ${file}: soru istasyonu (container) sayfada yok: ${cid}`); problems++; }
  }
  // Sayfadaki her soru istasyonunun bankada sorusu olmalı (boş istasyon öğrenciye "soru yok" gösterir).
  // Yalnız taslak sorusu olan istasyon sorun değil, uyarıdır (onay kuyruğunda bekliyor).
  const sayfaAdi = file.replace(/.html$/, "");
  for (const m of html.matchAll(/id="([^"]*-quiz-container)"/g)) {
    if (arrays.some(([k]) => k === m[1])) continue;
    if (TASLAK.some(r => r.tur === "ders" && r.sayfa === sayfaAdi && r.kutu === m[1])) { uyarilar.push(`${file}: ${m[1]} sayfada var ama yalnız taslak sorusu var (onaylanana dek öğrenci boş istasyon görür)`); continue; }
    console.log(`✗ ${file}: ${m[1]} için bankada aktif soru yok`); problems++;
  }
  // Taslak istasyonları: sayfada henüz yoksa uyarı (arayüz ekleyecek); kalite denetimi aşağıda (TASLAK bölümü)
  for (const k of new Set(TASLAK.filter(r => r.tur === "ders" && r.sayfa === sayfaAdi).map(r => r.kutu))) {
    if (!html.includes(`id="${k}"`)) uyarilar.push(`${file}: taslak istasyonu sayfada henüz yok: ${k}`);
  }
  if (/_QUESTIONSs*=|isCorrect|stepByStepSolution/.test(html)) { console.log(`✗ ${file}: sayfada cevap anahtarı / soru dizisi izi var (sorular yalnız veritabanında olmalı)`); problems++; }
  for (const [name, qs] of arrays) {
    const issues = [];
    const { pos, longest } = checkQuestions(qs, BANK_FIELDS, seen, issues);
    for (const q of qs) bankTexts.set(norm(q.question), q.id);
    total += qs.length;
    problems += issues.length;
    rows.push({ file, name, n: qs.length, pos, longest, issues });
  }
}

// 2) Seviye testi bankaları (data/sorular/seviye/*.js)
let seviyeTotal = 0;
const seviyeFiles = fs.existsSync(SEVIYE_DIR) ? fs.readdirSync(SEVIYE_DIR).filter(f => f.endsWith(".js") && !f.startsWith("_")) : [];
const seviyeSeen = new Set();
for (const f of seviyeFiles) {
  const ctx = { window: {}, console: { log() {}, warn() {} } };
  try { vm.runInNewContext(fs.readFileSync(path.join(SEVIYE_DIR, f), "utf8"), ctx, { filename: f }); }
  catch (e) { console.log(`✗ seviye/${f}: script hatası — ${e.message}`); problems++; continue; }
  for (const [key, c] of Object.entries(ctx.window.APMEBERRA_SEVIYE || {})) {
    const issues = [];
    if (c.sorular) issues.push("herkese açık seviye dosyasında sorular var (cevap anahtarı yalnız veritabanında olmalı)");
    const qs = BANKA.filter(r => r.tur === "seviye" && r.ders === key).map(eskiSema);
    if (c.ders !== key) issues.push(`ders alanı (${c.ders}) anahtarla (${key}) aynı değil`);
    for (const k of ["ad", "portalSayfasi", "uniteler"]) if (!c[k]) issues.push(`eksik alan ${k}`);
    if (c.portalSayfasi && !fs.existsSync(path.join(ROOT, c.portalSayfasi))) issues.push(`portalSayfasi yok: ${c.portalSayfasi}`);
    const units = (c.uniteler || []).map(u => String(u.no));
    const portalHtml = c.portalSayfasi && fs.existsSync(path.join(ROOT, c.portalSayfasi)) ? fs.readFileSync(path.join(ROOT, c.portalSayfasi), "utf8") : null;
    for (const u of c.uniteler || []) {
      const uq = qs.filter(q => String(q.unite) === String(u.no));
      if (uq.length < 3) issues.push(`ünite ${u.no} (${u.ad}): ${uq.length} soru (en az 3)`);
      const diffs = new Set(uq.map(q => q.zorluk));
      if (uq.length >= 3 && diffs.size < 2) issues.push(`ünite ${u.no}: zorluk çeşitliliği yok`);
      if (typeof u.portaldaVar !== "boolean") issues.push(`ünite ${u.no}: portaldaVar true/false olmalı`);
      if (u.portaldaVar && !u.portalCapa) issues.push(`ünite ${u.no}: portaldaVar true ama portalCapa yok`);
      if (u.portalCapa && portalHtml !== null && !portalHtml.includes(`id="${u.portalCapa}"`)) issues.push(`ünite ${u.no}: portalCapa "${u.portalCapa}" ${c.portalSayfasi} içinde yok`);
    }
    for (const q of qs) {
      if (!units.includes(String(q.unite))) issues.push(`${q.id}: tanımsız ünite "${q.unite}"`);
      if (!["easy", "medium", "hard"].includes(q.zorluk)) issues.push(`${q.id}: zorluk easy/medium/hard olmalı`);
      if (!(q.sureSn > 0)) issues.push(`${q.id}: sureSn eksik`);
      if (typeof q.hesapMakinesi !== "boolean") issues.push(`${q.id}: hesapMakinesi true/false olmalı`);
      const dup = bankTexts.get(norm(q.question));
      if (dup) issues.push(`${q.id}: soru bankasındaki ${dup} ile aynı metin (tanı sorusu yeni olmalı)`);
    }
    const { pos, longest } = checkQuestions(qs, SEVIYE_FIELDS, seviyeSeen, issues);
    seviyeTotal += qs.length;
    problems += issues.length;
    rows.push({ file: "seviye/" + f, name: `${key} (${units.length} ünite)`, n: qs.length, pos, longest, issues });
  }
}

// 2b) v1.11.0 taslaklar (onay kuyruğu): istasyon başına, onaylandıktan sonraki hâl (aktif + taslak) kalite kurallarıyla denetlenir.
const taslakRows = [];
{
  const by = new Map();
  for (const r of TASLAK) { if (r.tur !== "ders") continue; const k = r.sayfa + "|" + r.kutu; if (!by.has(k)) by.set(k, []); by.get(k).push(r); }
  for (const [k, ts] of by) {
    const [sayfa, kutu] = k.split("|");
    const aktif = BANKA.filter(r => r.tur === "ders" && r.sayfa === sayfa && r.kutu === kutu);
    const issues = [];
    const { pos, longest } = checkQuestions(aktif.concat(ts).map(eskiSema), BANK_FIELDS, new Set(), issues);
    problems += issues.length;
    taslakRows.push({ file: sayfa, name: kutu, n: ts.length, aktif: aktif.length, pos, longest, issues });
  }
  for (const r of TASLAK) if (r.tur !== "ders") { console.log(`✗ ${r.id}: taslak yalnız ders sorusu için denetlenir (tur ${r.tur})`); problems++; }
  const ids = new Map();
  for (const r of TUM) ids.set(r.id, (ids.get(r.id) || 0) + 1);
  for (const [id, n] of ids) if (n > 1) { console.log(`✗ ${id}: tohumda ${n} kez`); problems++; }
}

// 3) v1.10.0 içerik sağlığı: durum sayıları, ek zenginleştirme kapsamı, tekrar sorular (normalleştirilmiş kök + şık kümesi özeti).
//    Tekrar özeti: HTML/$/biçim komutları (\displaystyle, \left, \text, \dfrac…) ve BC etiketleri atılır, şıklar sıralanır.
//    Aktif (arşivlenmemiş) iki soru aynı özeti taşıyorsa sorun sayılır; arşivlenmiş kopya sayılmaz.
const crypto = require("crypto");
const BICIM = /\\(?:displaystyle|textstyle|left|right|big|Big|bigg|Bigg|mathrm|text|mathbf|operatorname|,|;|!|:|quad|qquad)(?![a-zA-Z])/g;
function tekrarNorm(t) {
  return String(t == null ? "" : t)
    .replace(/<span class='card-badge[^>]*>[^<]*<\/span>/g, " ").replace(/\[BC ONLY\]/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\\[dt]frac/g, "\\frac").replace(BICIM, "").replace(/[$\s{}]/g, "")
    .replace(/[−–]/g, "-").replace(/[.?:;,]+$/g, "").toLowerCase();
}
const tekrarOzet = r => crypto.createHash("sha256").update(tekrarNorm(r.govde) + "\u0001" + (r.secenekler || []).map(o => tekrarNorm(o.text)).sort().join("\u0002")).digest("hex").slice(0, 16);
const durumSay = {}, ozetler = new Map();
let ekTam = 0;
for (const r of TUM) {
  durumSay[r.durum || "aktif"] = (durumSay[r.durum || "aktif"] || 0) + 1;
  const ek = r.ek || {};
  if (r.tur !== "vitrin" && ek.kavram && ek.ipucu && ek.sikHata && ek.cedKonu && ek.hesapMakinesi != null) ekTam++;
  if (r.durum === "arsiv") continue;
  const h = tekrarOzet(r);
  if (!ozetler.has(h)) ozetler.set(h, []);
  ozetler.get(h).push(r.id);
}
const tekrarlar = Array.from(ozetler.values()).filter(l => l.length > 1);
const denetlenen = TUM.filter(r => r.tur !== "vitrin").length;

for (const r of rows) {
  const mark = r.issues.length ? "✗" : "✓";
  console.log(`${mark} ${r.file.padEnd(18)} ${r.name.padEnd(26)} ${String(r.n).padStart(3)} soru  A${r.pos.A} B${r.pos.B} C${r.pos.C} D${r.pos.D}  en-uzun-doğru:${r.longest}`);
  for (const i of r.issues) console.log(`    - ${i}`);
}
console.log(`\nSEVİYE TESTİ: ${seviyeTotal} soru (${seviyeFiles.length} dosya)`);
const taslakToplam = taslakRows.reduce((s, r) => s + r.n, 0);
console.log(`\nTASLAK (onay kuyruğu, öğrenciye sunulmaz): ${taslakToplam} soru, ${taslakRows.length} istasyon — denetim: aktif + taslak birlikte`);
for (const r of taslakRows) {
  console.log(`${r.issues.length ? "✗" : "✓"} ${r.file.padEnd(14)} ${r.name.padEnd(36)} +${String(r.n).padStart(3)} taslak (aktif ${r.aktif})  A${r.pos.A} B${r.pos.B} C${r.pos.C} D${r.pos.D}  en-uzun-doğru:${r.longest}`);
  for (const i of r.issues) console.log(`    - ${i}`);
}
for (const u of uyarilar) console.log(`  uyarı: ${u}`);
console.log(`DURUM: ${Object.entries(durumSay).map(([k, v]) => k + " " + v).join(" · ")} (toplam ${TUM.length})`);
console.log(`EK ZENGİNLEŞTİRME: ${ekTam}/${denetlenen} soru (%${denetlenen ? Math.round(ekTam / denetlenen * 1000) / 10 : 0}; kavram, ipucu, sikHata, cedKonu, hesapMakinesi; vitrin hariç)`);
console.log(`TEKRAR (normalleştirilmiş kök + şık kümesi): ${tekrarlar.length} aktif tekrar grubu`);
for (const l of tekrarlar) { console.log(`✗ tekrar soru: ${l.join(", ")} (birini arşivle ya da yeniden yaz)`); problems++; }
// v1.11.0 FRQ tohumu (server/tohum/frq.json): yapı (server/frq.js dogrula — rubrik puanları toplamı = parça puanı,
// toplam_puan = parça toplamı, $ yok, ders/sayfa tutarlı), benzersiz kimlik, özgün kaynak.
{
  const FRQ_DOSYA = path.join(ROOT, "server", "tohum", "frq.json");
  if (fs.existsSync(FRQ_DOSYA)) {
    const { dogrula: frqDogrula } = require("../server/frq.js");
    const frqT = JSON.parse(fs.readFileSync(FRQ_DOSYA, "utf8")), frqL = Array.isArray(frqT.frq) ? frqT.frq : [];
    const frqSay = {}, frqId = new Set();
    let frqSorun = 0;
    for (const f of frqL) {
      const s = frqDogrula(f);
      if (frqId.has(f.id)) s.push(f.id + ": kimlik tekrarı");
      frqId.add(f.id);
      if (FORBIDDEN_SOURCE.test(String(f.kaynak || ""))) s.push(f.id + ": kaynak resmî sınav gibi görünüyor");
      frqSay[f.ders] = (frqSay[f.ders] || 0) + 1;
      s.forEach(x => console.log(`✗ FRQ ${x}`));
      frqSorun += s.length;
    }
    console.log(`FRQ: ${frqL.length} soru (${Object.entries(frqSay).map(([k, v]) => k + " " + v).join(" · ")}), ${frqSorun} sorun`);
    problems += frqSorun;
  }
}
console.log(`TOPLAM: ${total} soru, ${problems} sorun`);
process.exitCode = problems ? 1 : 0;
