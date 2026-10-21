// Meberra — Soru bankası aktarım aracı (v1.5.0)
// Sorular (doğru cevap + açıklama dahil) artık herkese açık HTML/JS'te değil, sunucu veritabanındadır (questions_bank).
// Bu araç eski kaynakları okur ve tek doğruluk kaynağı olan tohum dosyasını yazar: server/tohum/soru-bankasi.json
// (statik klasörlerin DIŞINDA; sunucu bunu asla dosya olarak sunmaz). Sunucu ilk açılışta tablo boşsa bu dosyadan doldurur.
//
// Kaynaklar (eski düzen):
//   1) ders sayfaları ap-*.html / sinav-*.html içindeki `const X_QUESTIONS = [...]` dizileri + initInteractiveQuiz("<kutu>", X)
//   2) seviye testi bankaları data/sorular/seviye/*.js (window.APMEBERRA_SEVIYE[ders].sorular)
//   3) vitrin (tanıtım) sayfasının örnek sorusu (aşağıda VITRIN_DEMO; herkese açık tek demo sorusu)
//   (deneme bankası data/sorular/deneme-bankasi.js bu dizilerden türetilmişti; ayrı soru içermez → deneme etiketleri
//    araclar/deneme-bankasi-olustur.js yardımcılarıyla her soruya sütun olarak yazılır)
//
// Kullanım (proje klasöründen):
//   node araclar/soru-aktar.js --kuru                 Kaynakları ayrıştırır, sayfa/ünite başına sayıları yazar; hiçbir şey yazmaz
//   node araclar/soru-aktar.js                        Kaynaklardan server/tohum/soru-bankasi.json üretir
//   node araclar/soru-aktar.js --git <ref> ...        Kaynakları çalışma ağacı yerine git revizyonundan okur (ör. --git v1.4.0)
//   node araclar/soru-aktar.js --tohum --kuru         Kaynak yerine mevcut tohum dosyasını sayar
//   node araclar/soru-aktar.js --db <dosya.db>        Tohumu SQLite veritabanına upsert eder (idempotent; değişen soru yeni sürüm olur)
//   node araclar/soru-aktar.js --temizle              Tohum kaynakla birebir aynıysa kaynaklardan soru dizilerini ve cevap anahtarlarını siler
// Beklenen sayılar (pm-denetim ile aynı): ders sayfaları 977 soru, seviye testi 153 soru (+1 vitrin demo sorusu).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TOHUM = path.join(ROOT, "server", "tohum", "soru-bankasi.json");
const SEVIYE_DIR = "data/sorular/seviye";
const BEKLENEN = { ders: 977, seviye: 153 };

const arg = process.argv.slice(2);
const bayrak = a => arg.includes(a);
const deger = a => { const i = arg.indexOf(a); return i >= 0 ? arg[i + 1] : null; };
const GIT_REF = deger("--git");

// Herkese açık vitrin demo sorusu (vitrin.html'deki eski elle yazılmış örnek). GET /api/public/demo-soru yalnızca bunu verir.
const VITRIN_DEMO = {
  id: "vitrin_demo_1", tur: "vitrin", sayfa: "vitrin", ders: null, unite_no: null, unite: null, kutu: null, kutu_baslik: "Vitrin örnek soru",
  dizi: null, sira: 0, numara: 1, konu: "AP Calculus AB · 1.6", zorluk: "medium",
  govde: '<p class="vt-q-text" id="vt-q-text">Evaluate the limit:</p><p class="vt-math" aria-label="limit, x 4\'e giderken, karekök x eksi 2 bölü x eksi 4"><span class="vt-lim" aria-hidden="true"><span>lim</span><small>x → 4</small></span><span class="vt-frac" aria-hidden="true"><span>√x − 2</span><span>x − 4</span></span></p>',
  secenekler: [{ id: "A", text: "0" }, { id: "B", text: "1/4" }, { id: "C", text: "Does not exist" }, { id: "D", text: "1/2" }],
  dogru: "B",
  aciklama: "Doğrudan koyunca 0/0 çıkar. Pay ve paydayı (√x + 2) ile çarp: (x − 4) / [(x − 4)(√x + 2)]. Sadeleştir, x = 4 koy: 1/(2 + 2) = <strong>1/4</strong>.",
  genel_hatirlatma: "Doğru! 1/4. Eşlenik hamlesini buldun.",
  hata_aciklamalari: {
    A: { etiket: "0/0 belirsizliği", aciklama: "Dikkat: 0/0 bir belirsizliktir, sonucun 0 olduğu anlamına gelmez. Eşlenikle çarpıp sadeleştir." },
    C: { etiket: "Payda sıfır yanılgısı", aciklama: "Paydada 0 görmek limitin olmadığı anlamına gelmez; (x − 4) çarpanı sadeleşebilir." },
    D: { etiket: "Son adım hatası", aciklama: "Neredeyse! Sadeleşince 1/(√x + 2) kalır; x = 4 için 1/(2 + 2) = 1/4." }
  },
  kaynak: "AP-style original (CED Topic 1.6)", deneme_kodlari: [], pasaj: null, ek: {}, durum: "aktif"
};

// --- kaynak okuma (çalışma ağacı ya da git revizyonu) ------------------------------------------
function oku(rel) {
  if (GIT_REF) return execFileSync("git", ["show", GIT_REF + ":" + rel.replace(/\\/g, "/")], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function listele(relDir, re) {
  if (GIT_REF) {
    const out = execFileSync("git", ["ls-tree", "--name-only", GIT_REF, relDir ? relDir.replace(/\\/g, "/") + "/" : ""], { cwd: ROOT, encoding: "utf8" });
    return out.split(/\r?\n/).filter(Boolean).map(p => p.split("/").pop()).filter(f => re.test(f)).sort();
  }
  return fs.readdirSync(path.join(ROOT, relDir || ".")).filter(f => re.test(f)).sort();
}

// --- app.js'ten saf ünite gruplama (apTocParse + apUniteGrupla; unite-birim-test ile aynı yöntem) --------
function uniteFonksiyonlari() {
  const src = fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8");
  const bas = src.indexOf("const AP_TOC_QUIZ"), son = src.indexOf("// --- İçindekiler (uzun sayfalar)");
  if (bas < 0 || son < bas) throw new Error("app.js içinde apTocParse/apUniteGrupla bölümü bulunamadı");
  const ctx = { apEsc: x => String(x == null ? "" : x) };
  vm.createContext(ctx);
  vm.runInContext(src.slice(bas, son) + "\nthis.F = { apTocParse, apUniteGrupla };", ctx);
  return ctx.F;
}

/** Sayfadaki her soru kutusunun ünite numarası (ders sayfasındaki ünite görünümüyle aynı: apUniteGrupla `no`). */
function kutuUniteleri(html, F) {
  const h = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const hm = [...h.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)];
  const heads = hm.map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim());
  const g = F.apUniteGrupla(heads.map(t => ({ baslik: F.apTocParse(t) })));
  const blokOnce = pos => { let b = -1; hm.forEach((m, i) => { if (m.index < pos) b = i; }); return b; };
  const out = {};
  for (const m of h.matchAll(/id="([^"]*-quiz-container)"/g)) {
    const u = g.uniteler.find(x => x.bloklar.indexOf(blokOnce(m.index)) >= 0);
    out[m[1]] = u ? u.no : null;
  }
  return out;
}

function sayfaDizileri(file, html) {
  const ctx = { document: { addEventListener() {} }, window: {}, console: { log() {}, warn() {} } };
  vm.createContext(ctx);
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    vm.runInContext(m[1].replace(/\bconst (\w+_QUESTIONS\w*)/g, "var $1"), ctx, { filename: file });
  }
  const diziler = Object.keys(ctx).filter(k => /_QUESTIONS/.test(k)).map(k => [k, ctx[k]]);
  const kapOf = {};
  for (const m of html.matchAll(/initInteractiveQuiz\(\s*"([^"]+)"\s*,\s*(\w+)\s*\)/g)) kapOf[m[2]] = m[1];
  return { diziler, kapOf };
}

const kopya = v => JSON.parse(JSON.stringify(v));
/** Eski soru nesnesinden (options[].isCorrect/errorTag/remediation) satır alanları. */
function satirAlanlari(q) {
  const opts = q.options || [];
  const dogru = opts.filter(o => o.isCorrect);
  if (dogru.length !== 1) throw new Error(`${q.id}: ${dogru.length} doğru şık`);
  const hata = {};
  for (const o of opts) if (!o.isCorrect && (o.errorTag || o.remediation)) hata[o.id] = { etiket: o.errorTag || "", aciklama: o.remediation || "" };
  return {
    govde: q.question, secenekler: opts.map(o => ({ id: o.id, text: o.text })), dogru: dogru[0].id,
    aciklama: q.stepByStepSolution || "", genel_hatirlatma: q.generalRemediation || "", hata_aciklamalari: hata, kaynak: q.source || ""
  };
}
/** Satırdan eski şemayı yeniden kurar (gidiş-dönüş denetimi için; sunucudaki tamSoru ile aynı alanlar). */
function eskiSema(r) {
  const opts = r.secenekler.map(o => {
    const h = r.hata_aciklamalari[o.id];
    const x = { id: o.id, text: o.text, isCorrect: o.id === r.dogru };
    if (h) { x.errorTag = h.etiket; x.remediation = h.aciklama; }
    return x;
  });
  if (r.tur === "seviye") {
    return { id: r.id, unite: r.unite, beceri: r.ek.beceri, zorluk: r.zorluk, sureSn: r.ek.sureSn, hesapMakinesi: r.ek.hesapMakinesi, source: r.kaynak,
      question: r.govde, options: opts, generalRemediation: r.genel_hatirlatma, stepByStepSolution: r.aciklama };
  }
  return { id: r.id, number: r.numara, topic: r.konu, difficulty: r.zorluk, source: r.kaynak, question: r.govde, options: opts,
    generalRemediation: r.genel_hatirlatma, stepByStepSolution: r.aciklama };
}
const sirala = o => Array.isArray(o) ? o.map(sirala) : o && typeof o === "object" ? Object.keys(o).sort().reduce((a, k) => (a[k] = sirala(o[k]), a), {}) : o;
const esit = (a, b) => JSON.stringify(sirala(a)) === JSON.stringify(sirala(b));

function kaynaklariOku() {
  const D = require("./deneme-bankasi-olustur.js");
  const F = uniteFonksiyonlari();
  const satirlar = [], uyarilar = [], gidisDonus = [];
  const sayfalar = listele("", /^(ap|sinav)-.*\.html$/);
  for (const file of sayfalar) {
    const html = oku(file);
    const sayfa = file.replace(/\.html$/, "");
    const { diziler, kapOf } = sayfaDizileri(file, html);
    if (!diziler.length) continue;
    const kutuUnite = kutuUniteleri(html, F);
    for (const [dizi, qs] of diziler) {
      const kutu = kapOf[dizi] || null;
      if (!kutu) uyarilar.push(`${file} ${dizi}: initInteractiveQuiz kutusu yok`);
      const baslik = kutu ? D.unitTitle(html, kutu) : dizi;
      qs.forEach((q, i) => {
        const et = D.denemeEtiketleri(file, html, dizi, kutu, q);
        if (et.uyari) uyarilar.push(et.uyari);
        const r = Object.assign({
          id: q.id, tur: "ders", sayfa, ders: null, unite_no: kutu ? kutuUnite[kutu] : null, unite: et.unite, kutu, kutu_baslik: baslik,
          dizi, sira: i, numara: q.number != null ? q.number : i + 1, konu: q.topic || "", zorluk: q.difficulty || ""
        }, satirAlanlari(q), { deneme_kodlari: et.denemeKodlari, pasaj: et.pasaj, ek: {}, durum: "aktif" });
        if (kutu && r.unite_no == null) uyarilar.push(`${q.id}: kutu ${kutu} hiçbir üniteye düşmedi`);
        if (!esit(eskiSema(r), q)) gidisDonus.push(q.id);
        satirlar.push(r);
      });
    }
  }
  // Seviye testi
  for (const f of listele(SEVIYE_DIR, /^[^_].*\.js$/)) {
    const w = { APMEBERRA_SEVIYE: {} }, c = { window: w };
    vm.createContext(c);
    vm.runInContext(oku(SEVIYE_DIR + "/" + f), c, { filename: f });
    for (const [ders, b] of Object.entries(w.APMEBERRA_SEVIYE)) {
      (b.sorular || []).forEach((q, i) => {
        const r = Object.assign({
          id: q.id, tur: "seviye", sayfa: String(b.portalSayfasi || "").replace(/\.html$/, "") || null, ders, unite_no: null, unite: String(q.unite),
          kutu: null, kutu_baslik: b.ad || ders, dizi: null, sira: i, numara: i + 1, konu: q.beceri || "", zorluk: q.zorluk || ""
        }, satirAlanlari(q), { deneme_kodlari: [], pasaj: null, ek: { beceri: q.beceri, sureSn: q.sureSn, hesapMakinesi: q.hesapMakinesi }, durum: "aktif" });
        if (!esit(eskiSema(r), q)) gidisDonus.push(q.id);
        satirlar.push(r);
      });
    }
  }
  satirlar.push(kopya(VITRIN_DEMO));
  const kimlik = new Set();
  for (const r of satirlar) { if (kimlik.has(r.id)) uyarilar.push("tekrar eden id: " + r.id); kimlik.add(r.id); }
  return { satirlar, uyarilar, gidisDonus };
}

function sayimYaz(satirlar) {
  const tur = {}, sayfa = {};
  for (const r of satirlar) {
    tur[r.tur] = (tur[r.tur] || 0) + 1;
    const k = r.tur === "seviye" ? "seviye:" + r.ders : r.sayfa;
    const s = sayfa[k] || (sayfa[k] = { n: 0, u: {} });
    s.n++;
    const uk = r.tur === "seviye" ? "Unit " + r.unite : r.unite_no != null ? "ünite " + r.unite_no + " (" + r.kutu + ")" : "-";
    s.u[uk] = (s.u[uk] || 0) + 1;
  }
  for (const [k, s] of Object.entries(sayfa)) {
    console.log(`${k.padEnd(28)} ${String(s.n).padStart(4)} soru`);
    for (const [u, n] of Object.entries(s.u)) console.log(`    ${u.padEnd(48)} ${String(n).padStart(3)}`);
  }
  console.log(`\nTÜR: ders ${tur.ders || 0} · seviye ${tur.seviye || 0} · vitrin ${tur.vitrin || 0} · TOPLAM ${satirlar.length}`);
  return tur;
}

// --- kaynak temizleme: dizi literal'ini dize/yorum bilinçli parantez eşleştirmeyle bulur ---------------
function eslesenKapanis(s, ac) {
  const acan = s[ac], kapan = acan === "[" ? "]" : acan === "{" ? "}" : ")";
  let derin = 0;
  for (let i = ac; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'" || c === "`") {
      for (i++; i < s.length && s[i] !== c; i++) if (s[i] === "\\") i++;
      continue;
    }
    if (c === "/" && s[i + 1] === "/") { i = s.indexOf("\n", i); if (i < 0) return -1; continue; }
    if (c === "/" && s[i + 1] === "*") { i = s.indexOf("*/", i + 2) + 1; continue; }
    if (c === "[" || c === "{" || c === "(") derin++;
    else if (c === "]" || c === "}" || c === ")") { derin--; if (derin === 0) { if (c !== kapan) throw new Error("parantez uyuşmazlığı"); return i; } }
  }
  return -1;
}
function sayfaTemizle(html) {
  return html.replace(/([ \t]*)<script>([\s\S]*?)<\/script>([ \t]*\r?\n)?/g, (tam, ind, js, son) => {
    if (!/_QUESTIONS\w*\s*=\s*\[|initInteractiveQuiz\(/.test(js)) return tam;
    let s = js, m;
    const re = /\bconst\s+\w+_QUESTIONS\w*\s*=\s*\[/g;
    while ((m = re.exec(s))) {
      const ac = m.index + m[0].length - 1, kap = eslesenKapanis(s, ac);
      if (kap < 0) throw new Error("dizi sonu bulunamadı");
      let bit = kap + 1;
      if (s[bit] === ";") bit++;
      // satırın başındaki girintiyi ve sondaki satır sonunu da al
      let bas = m.index; while (bas > 0 && /[ \t]/.test(s[bas - 1])) bas--;
      const nl = /^\r?\n/.exec(s.slice(bit)); if (nl) bit += nl[0].length;
      s = s.slice(0, bas) + s.slice(bit);
      re.lastIndex = bas;
    }
    s = s.replace(/^[ \t]*initInteractiveQuiz\([^)]*\);?[ \t]*\r?\n?/gm, "");
    // Boş kalan DOMContentLoaded işleyicisi
    s = s.replace(/[ \t]*document\.addEventListener\(\s*"DOMContentLoaded"\s*,\s*(?:\(\)\s*=>|function\s*\(\)\s*)\s*\{\s*\}\s*\);?[ \t]*\r?\n?/g, "");
    if (!s.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "").trim()) return "";
    new vm.Script(s); // kalan betik hâlâ geçerli JavaScript olmalı
    return ind + "<script>" + s + "</script>" + (son || "");
  });
}
function seviyeTemizle(js) {
  let s = js, m;
  const re = /,(\s*)sorular:\s*\[/g;
  while ((m = re.exec(s))) {
    const ac = m.index + m[0].length - 1, kap = eslesenKapanis(s, ac);
    if (kap < 0) throw new Error("sorular dizisi sonu yok");
    s = s.slice(0, m.index) + s.slice(kap + 1);
    re.lastIndex = m.index;
  }
  return s.replace(/(window\.APMEBERRA_SEVIYE = window\.APMEBERRA_SEVIYE \|\| \{\};)/,
    "// v1.5.0: sorular (cevap anahtarıyla) sunucu veritabanında; bu dosya yalnızca ünite meta verisi taşır (GET /api/seviye/bankalar).\n$1");
}

function temizle(tohum) {
  if (GIT_REF) throw new Error("--temizle --git ile birlikte kullanılamaz");
  const { satirlar } = kaynaklariOku();
  const kaynak = new Map(satirlar.map(r => [r.id, r]));
  const t = new Map(tohum.sorular.map(r => [r.id, r]));
  const fark = [...kaynak.keys()].filter(id => !t.has(id) || !esit(kaynak.get(id), t.get(id)));
  if (fark.length) throw new Error("Tohum kaynakla aynı değil (" + fark.length + " soru, ör. " + fark.slice(0, 3).join(", ") + "). Önce `node araclar/soru-aktar.js` çalıştır.");
  let n = 0;
  for (const file of listele("", /^(ap|sinav)-.*\.html$/)) {
    const p = path.join(ROOT, file), eski = fs.readFileSync(p, "utf8"), yeni = sayfaTemizle(eski);
    if (yeni !== eski) { fs.writeFileSync(p, yeni); n++; }
    if (/_QUESTIONS\s*=|initInteractiveQuiz\(|isCorrect/.test(yeni)) throw new Error(file + ": temizlik sonrası soru izi kaldı");
  }
  for (const f of listele(SEVIYE_DIR, /^[^_].*\.js$/)) {
    const p = path.join(ROOT, SEVIYE_DIR, f), eski = fs.readFileSync(p, "utf8"), yeni = seviyeTemizle(eski);
    if (yeni !== eski) { fs.writeFileSync(p, yeni); n++; }
    if (/isCorrect|stepByStepSolution/.test(yeni)) throw new Error(f + ": temizlik sonrası cevap izi kaldı");
  }
  const eskiBanka = path.join(ROOT, "data", "sorular", "deneme-bankasi.js");
  if (fs.existsSync(eskiBanka)) { fs.unlinkSync(eskiBanka); n++; }
  console.log(`Temizlendi: ${n} dosya (soru dizileri, cevap anahtarları, eski deneme bankası).`);
}

function main() {
  if (bayrak("--temizle")) { temizle(JSON.parse(fs.readFileSync(TOHUM, "utf8"))); return; }
  let satirlar;
  if (bayrak("--tohum") || (bayrak("--db") && !bayrak("--kaynak"))) {
    satirlar = JSON.parse(fs.readFileSync(TOHUM, "utf8")).sorular;
    console.log("Kaynak: " + path.relative(ROOT, TOHUM));
  } else {
    const r = kaynaklariOku();
    satirlar = r.satirlar;
    console.log("Kaynak: " + (GIT_REF ? "git " + GIT_REF : "çalışma ağacı") + " (ders sayfaları + seviye testi + vitrin)");
    if (r.uyarilar.length) { console.log(`Uyarılar (${r.uyarilar.length}):`); r.uyarilar.slice(0, 40).forEach(u => console.log("  ! " + u)); }
    if (r.gidisDonus.length) { console.error(`HATA: ${r.gidisDonus.length} soru satırdan birebir geri kurulamıyor: ${r.gidisDonus.slice(0, 5).join(", ")}`); process.exitCode = 1; return; }
    if (satirlar.filter(x => x.tur !== "vitrin").length === 0) {
      console.log("Kaynaklarda soru dizisi yok (v1.5.0 sonrası sorular veritabanında). Mevcut tohumu saymak için --tohum, eski kaynak için --git <ref> kullan.");
      return;
    }
  }
  const tur = sayimYaz(satirlar);
  const tutar = (tur.ders || 0) === BEKLENEN.ders && (tur.seviye || 0) === BEKLENEN.seviye;
  console.log(tutar ? `Beklenen sayılarla aynı (ders ${BEKLENEN.ders}, seviye ${BEKLENEN.seviye}).` : `UYARI: beklenen ders ${BEKLENEN.ders} / seviye ${BEKLENEN.seviye}.`);
  if (bayrak("--kuru")) return;
  if (bayrak("--db")) {
    const dosya = path.resolve(deger("--db"));
    const db = require("../server/db").ac(dosya);
    const { tohumUpsert } = require("../server/sorubankasi");
    const s = tohumUpsert(db, satirlar, { guncelleyen: "aktarim" });
    db.close();
    console.log(`Veritabanı ${dosya}: ${s.eklenen} eklendi, ${s.guncellenen} güncellendi (yeni sürüm), ${s.ayni} aynı.`);
    return;
  }
  // v1.10.0: tohum sürümü geri gitmez. Sunucu, tohum sürümü veritabanındakinden (ayarlar.soru_tohum_surum) büyükse yönetici
  // düzenlemesi olmayan soruları günceller; içerik değiştiyse sürüm +1. Not: eski kaynaklardan yeniden üretim ek
  // zenginleştirmesini ve denetim düzeltmelerini içermez → ardından `node araclar/icerik-uygula.js` çalıştırılmalı.
  let surum = 1;
  try {
    const onceki = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
    surum = (Number(onceki.surum) || 1) + (JSON.stringify(onceki.sorular) === JSON.stringify(satirlar) ? 0 : 1);
  } catch (e) { /* ilk üretim */ }
  const govde = { surum, olusturma: new Date().toISOString(), aciklama: "Meberra soru bankası tohumu — tek doğruluk kaynağı. Statik olarak SUNULMAZ. Üretici: node araclar/soru-aktar.js", sorular: satirlar };
  fs.mkdirSync(path.dirname(TOHUM), { recursive: true });
  fs.writeFileSync(TOHUM, JSON.stringify(govde, null, 1) + "\n", "utf8");
  console.log(`Yazıldı: ${path.relative(ROOT, TOHUM)} (${(fs.statSync(TOHUM).size / 1024).toFixed(0)} KB, tohum sürümü ${surum}). Denetim düzeltmeleri için: node araclar/icerik-uygula.js`);
}

module.exports = { kaynaklariOku, eskiSema, satirAlanlari, sayfaTemizle, seviyeTemizle, VITRIN_DEMO };
if (require.main === module) main();
