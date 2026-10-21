// Meberra — 1.11.0 onay ve içerik kararları uygulama aracı
// Girdiler:
//   araclar/onay/{calculus,physics,chemistry,biology-english-electives}.json  bağımsız denetçi kararları (onay | duzelt | red)
//   araclar/icerik-denetim/KARARLAR.md                                           sahip adına verilen içerik kararları (aşağıda kodlandı)
//   araclar/onay/yeniden-yazim.js                                                yeniden yazılan soruların tam içeriği
// Çıktılar: server/tohum/soru-bankasi.json (surum SORU_SURUM), server/tohum/frq.json (surum FRQ_SURUM), araclar/onay/UYGULANAN.md
//
// Kullanım (proje klasöründen):
//   node araclar/onay-uygula.js --kuru   Değişiklikleri sayar; dosyalara dokunmaz
//   node araclar/onay-uygula.js          Uygular (idempotent: ikinci çalıştırma 0 yeni değişiklik verir)
//
// Kurallar: dogru (anahtar) ASLA değişmez (araç durur). onay → aktif; duzelt → duzeltme alanları birebir uygulanır, sonra aktif;
// red → arsiv + ek.redNedeni. Her kararlı kayda ek.onay = { tarih, kaynak } yazılır. Zorluk önerileri (ek.zorlukOnerisi) zorluk
// alanına taşınır ve ek.zorlukNotu'nda iz bırakır. Yeniden yazılan sorular bağımsız çözümle doğrulanır (sayısal sağlama aşağıda).
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SORU = path.join(ROOT, "server", "tohum", "soru-bankasi.json");
const FRQ = path.join(ROOT, "server", "tohum", "frq.json");
const ONAY_DIR = path.join(ROOT, "araclar", "onay");
const RAPOR = path.join(ONAY_DIR, "UYGULANAN.md");
const ONAY_DOSYALAR = ["calculus", "physics", "chemistry", "biology-english-electives"];
const TARIH = "2026-10-21";
const KAYNAK = "bağımsız denetim (sahip yetkisiyle)";
const SORU_SURUM = 4, FRQ_SURUM = 2;
const KURU = process.argv.includes("--kuru");
const YENIDEN = require("./onay/yeniden-yazim.js");

// ---- KARARLAR.md › Ürün kararları ------------------------------------------------------------------------------------
const PHYSICS_C = ["phys_u2_q7", "phys_u1_q6", "phys_wep_q16", "phys_wep_q21", "phys_mom_q21"];
const PHYSICS_C_ONEK = "Physics C · ileri · ";
const CALC_U6_Q32_KONU = "6.10 Integrating Using Long Division: Simplify Before Integrating";
const KIMYA_CED = ["chem_u1_q5", "chem_u2_q10", "chem_u3_q6", "chem_u5_q15", "chem_u7_q25", "chem_u9_q13", "chem_u9_q14", "chem_u9_q15", "chem_u9_q16",
  "chem_u9_q17", "chem_u9_q18", "chem_u9_q19", "chem_u9_q20", "chem_u9_q21", "chem_u9_q22", "chem_u9_q23", "chem_u9_q24", "chem_u9_q25", "chem_u9_q26",
  "chem_u9_q27", "chem_u9_q28"];
// eng_read_q12 pasaj başlığı (ap-english.html + server/tohum/deneme-meta.json) elle nötrleştirildi: "From an address on communication in engineering".

const kopya = o => JSON.parse(JSON.stringify(o));
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** "a.b[2].c" yolunu ayrıştırır; ara düğümler var olmalı (duzeltme yalnız mevcut alanı değiştirir). */
function yolAta(o, yol, deger) {
  const p = yol.replace(/\[(\d+)\]/g, ".$1").split(".");
  let n = o;
  for (let i = 0; i < p.length - 1; i++) {
    if (n[p[i]] == null || typeof n[p[i]] !== "object") throw new Error("yol yok: " + yol);
    n = n[p[i]];
  }
  if (!(p[p.length - 1] in n)) throw new Error("alan yok: " + yol);
  const eski = n[p[p.length - 1]];
  n[p[p.length - 1]] = deger;
  return !esit(eski, deger);
}

// ---- yeniden yazım sağlaması: matematiksel soruların anahtarı sayısal olarak yeniden çözülür -----------------------
function sayisalSaglama() {
  const yakin = (a, b, t) => Math.abs(a - b) < (t || 1e-6);
  const lim = (f, x0) => { const h = [1e-2, 5e-3, 2.5e-3]; const v = h.map(d => (f(x0 + d) + f(x0 - d)) / 2); return v[2] + (v[2] - v[1]) / 3; };
  const simpson = (f, a, b, n) => { n = n || 2000; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
  const s = [];
  // sv_calcab_u3_2: x² − xy + y² = 7, (−1, 2): eğri üzerinde ve dy/dx = −F_x/F_y = 4/5
  { const x = -1, y = 2; const Fx = 2 * x - y, Fy = 2 * y - x; s.push(["sv_calcab_u3_2", x * x - x * y + y * y === 7 && yakin(-Fx / Fy, 4 / 5)]); }
  // sv_calcab_u4_3: (e^{3x} − 1 − 3x)/x² → 9/2
  s.push(["sv_calcab_u4_3", yakin(lim(x => (Math.exp(3 * x) - 1 - 3 * x) / (x * x), 0), 4.5, 1e-3)]);
  // sv_calcbc_u3_2: y = √(169 − x²), y''(5) = −169/1728
  { const f = x => Math.sqrt(169 - x * x), d = 1e-3; s.push(["sv_calcbc_u3_2", yakin((f(5 + d) - 2 * f(5) + f(5 - d)) / (d * d), -169 / 1728, 1e-5)]); }
  // sv_calcbc_u6_3: ∫₃⁴ 2/(x² − 4) dx = ½ ln(5/3)
  s.push(["sv_calcbc_u6_3", yakin(simpson(x => 2 / (x * x - 4), 3, 4), 0.5 * Math.log(5 / 3), 1e-9)]);
  // calc_u4_q14: (x − sin x)/x³ → 1/6
  s.push(["calc_u4_q14", yakin(lim(x => (x - Math.sin(x)) / (x * x * x), 0), 1 / 6, 1e-4)]);
  // phys_u3_q3: v = √(r g tanθ) ≈ 20.7; C çeldiricisi √(rg)·tanθ ≈ 12.5
  s.push(["phys_u3_q3", yakin(Math.sqrt(120 * 9.8 * 0.364), 20.7, 0.05) && yakin(Math.sqrt(120 * 9.8) * 0.364, 12.5, 0.05) && yakin(Math.sqrt(120 * 9.8), 34.3, 0.05)]);
  // chem_u1_q6: 63.55 (A), 63.93 (B basit ortalama), 64.31 (C ters), 64.93 (D ağır izotop)
  s.push(["chem_u1_q6", yakin(62.93 * 0.6917 + 64.93 * 0.3083, 63.55, 0.005) && yakin((62.93 + 64.93) / 2, 63.93, 0.005) && yakin(62.93 * 0.3083 + 64.93 * 0.6917, 64.31, 0.005)]);
  // sv_chem_u6_2: (945 + 3·436) − 6·391 = −93; +93; 2253 − 3·391 = 1080; −(2253 + 2346) = −4599
  { const k = 945 + 3 * 436, o = 6 * 391; s.push(["sv_chem_u6_2", k - o === -93 && o - k === 93 && k - 3 * 391 === 1080 && -(k + o) === -4599]); }
  // sv_bio_u1_3: %A 28 → G 22; sv_bio_u4_2: 45/300 × 20 = 3.0
  s.push(["sv_bio_u1_3", (100 - 2 * 28) / 2 === 22]);
  s.push(["sv_bio_u4_2", yakin(45 / 300 * 20, 3) && yakin(255 / 300 * 20, 17)]);
  // chem_u2_q3: formal yükler (V − LP·2 − bağ)
  { const fc = (v, lp, bag) => v - 2 * lp - bag;
    s.push(["chem_u2_q3", fc(6, 3, 1) === -1 && fc(5, 1, 3) === 0 && fc(6, 2, 2) === 0 && fc(5, 2, 2) === -1 && fc(6, 1, 3) === 1 && fc(5, 3, 1) === -2]); }
  return s;
}

function normal(r) { return (r.govde || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase(); }

function main() {
  const tohum = JSON.parse(fs.readFileSync(SORU, "utf8"));
  const frqT = JSON.parse(fs.readFileSync(FRQ, "utf8"));
  const once = kopya(tohum.sorular), frqOnce = kopya(frqT.frq);
  const byId = new Map(tohum.sorular.map(r => [r.id, r]));
  const frqById = new Map(frqT.frq.map(f => [f.id, f]));
  const rapor = { dersler: {}, frq: {}, yeniden: [], physicsC: [], kimya: [], zorluk: [], duzelt: [], red: [], uyari: [] };
  const hata = m => { throw new Error(m); };

  // 1) Zorluk önerileri (121) → zorluk; iz ek.zorlukNotu'nda
  for (const r of tohum.sorular) {
    const e = r.ek || {};
    if (e.zorlukOnerisi !== undefined) {
      if (!["easy", "medium", "hard"].includes(e.zorlukOnerisi)) hata(r.id + ": geçersiz zorluk önerisi");
      e.zorlukNotu = r.zorluk + " → " + e.zorlukOnerisi + " (bağımsız denetim önerisi, sahip kararı " + TARIH + ")";
      rapor.zorluk.push({ id: r.id, eski: r.zorluk, yeni: e.zorlukOnerisi });
      r.zorluk = e.zorlukOnerisi; delete e.zorlukOnerisi;
    } else if (e.zorlukNotu && / → /.test(e.zorlukNotu) && /bağımsız denetim önerisi/.test(e.zorlukNotu)) {
      const m = /^(\w+) → (\w+)/.exec(e.zorlukNotu); rapor.zorluk.push({ id: r.id, eski: m[1], yeni: m[2] });
    }
  }

  // 2) Physics C: 5 soru ileri düzey, Physics 1 denemesinden çıkar
  for (const id of PHYSICS_C) {
    const r = byId.get(id) || hata(id + " yok");
    const onceKonu = r.konu;
    const govdeKonu = r.konu.replace(/^Physics C · (ileri · )?/, "").replace(/\s*\(Physics C[^)]*\)\s*$/, "").trim();
    r.konu = PHYSICS_C_ONEK + govdeKonu;
    r.deneme_kodlari = (r.deneme_kodlari || []).filter(k => k !== "physics-1");
    r.ek = Object.assign({}, r.ek, { ileri: true });
    rapor.physicsC.push({ id, eski: onceKonu, yeni: r.konu });
  }

  // 3) calc_u6_q32 → AB 6.10 (BC rozeti eklenmez; AB denemesine de girer)
  { const r = byId.get("calc_u6_q32"); const eski = r.konu;
    r.konu = CALC_U6_Q32_KONU; r.ek = Object.assign({}, r.ek, { cedKonu: "6.10" });
    for (const k of ["calculus-ab", "calculus-bc"]) if (!r.deneme_kodlari.includes(k)) r.deneme_kodlari.push(k);
    r.deneme_kodlari.sort(); rapor.calc32 = { eski, yeni: r.konu, kodlar: r.deneme_kodlari.slice() }; }

  // 4) Kimya konu ← ek.cedKonu numarası (21)
  for (const id of KIMYA_CED) {
    const r = byId.get(id) || hata(id + " yok");
    const m = /^(\d+\.\d+)\b/.exec(r.ek.cedKonu || "") || hata(id + ": ek.cedKonu numarası yok");
    const eski = r.konu;
    let baslik = r.konu.replace(/^\d+\.\d+\s+/, "");
    if (id === "chem_u7_q25") baslik = baslik.replace(/^Preview:\s*/, "");
    r.konu = m[1] + " " + baslik;
    rapor.kimya.push({ id, eski, yeni: r.konu });
  }

  // 5) Yeniden yazımlar
  const ALANLAR = ["govde", "secenekler", "dogru", "aciklama", "genel_hatirlatma", "hata_aciklamalari", "konu"];
  for (const [id, y] of Object.entries(YENIDEN)) {
    const r = byId.get(id) || hata(id + " yok");
    if (y.dogru !== r.dogru) hata(id + ": yeniden yazım anahtarı değiştiriyor (" + r.dogru + " → " + y.dogru + ")");
    const ids = y.secenekler.map(o => o.id).join("");
    if (ids !== "ABCD") hata(id + ": şık harfleri ABCD olmalı");
    if (new Set(y.secenekler.map(o => o.text.trim())).size !== 4) hata(id + ": 4 farklı şık olmalı");
    const yanlis = y.secenekler.map(o => o.id).filter(k => k !== y.dogru);
    if (!esit(Object.keys(y.hata_aciklamalari).sort(), yanlis)) hata(id + ": her yanlış şık için hata açıklaması olmalı");
    for (const k of yanlis) if (!y.hata_aciklamalari[k].etiket || !y.hata_aciklamalari[k].aciklama) hata(id + ": hata." + k + " boş");
    const eskiOzet = { govde: r.govde, secenekler: r.secenekler.map(o => o.text) };
    for (const k of ALANLAR) if (y[k] !== undefined) r[k] = kopya(y[k]);
    if (y.zorluk) {
      if (r.zorluk !== y.zorluk) r.ek = Object.assign({}, r.ek, { zorlukNotu: (r.ek.zorlukNotu ? r.ek.zorlukNotu + "; " : "") + "yeniden yazımda " + r.zorluk + " → " + y.zorluk + " (" + y.zorlukNedeni + ")" });
      r.zorluk = y.zorluk;
    }
    const ek = Object.assign({}, r.ek, y.ek);
    if (r.tur === "seviye") { ek.beceri = r.konu; if (typeof r.ek.hesapMakinesi === "boolean") ek.hesapMakinesi = r.ek.hesapMakinesi; }
    ek.yenidenYazim = { tarih: TARIH, neden: y.neden };
    r.ek = ek;
    rapor.yeniden.push({ id, sayfa: r.sayfa, neden: y.neden, eski: eskiOzet, yeni: { govde: r.govde, secenekler: r.secenekler.map(o => o.text) }, dogru: r.dogru });
  }

  // 6) Onay kararları (sorular + FRQ)
  const kararlar = [];
  for (const d of ONAY_DOSYALAR) for (const k of JSON.parse(fs.readFileSync(path.join(ONAY_DIR, d + ".json"), "utf8"))) kararlar.push(Object.assign({ dosya: d }, k));
  for (const k of kararlar) {
    const r = k.tur === "frq" ? frqById.get(k.id) : byId.get(k.id);
    if (!r) hata(k.id + ": kayıt yok (" + k.tur + ")");
    if (!["onay", "duzelt", "red"].includes(k.karar)) hata(k.id + ": bilinmeyen karar " + k.karar);
    const anahtar = r.dogru;
    if (k.karar === "duzelt") {
      for (const [yol, deger] of Object.entries(k.duzeltme || hata(k.id + ": duzeltme yok"))) yolAta(r, yol, deger);
      rapor.duzelt.push({ id: k.id, tur: k.tur, alanlar: Object.keys(k.duzeltme), neden: k.neden });
    }
    if (k.tur !== "frq" && r.dogru !== anahtar) hata(k.id + ": anahtar değişti");
    r.durum = k.karar === "red" ? "arsiv" : "aktif";
    r.ek = Object.assign({}, r.ek || {}, { onay: { tarih: TARIH, kaynak: KAYNAK } });
    if (k.karar === "red") { r.ek.redNedeni = k.neden; rapor.red.push({ id: k.id, tur: k.tur, sayfa: r.sayfa, neden: k.neden }); }
    const anah = k.tur === "frq" ? "frq:" + r.ders : r.sayfa;
    const say = (k.tur === "frq" ? rapor.frq : rapor.dersler)[anah] = (k.tur === "frq" ? rapor.frq : rapor.dersler)[anah] || { onay: 0, duzelt: 0, red: 0 };
    say[k.karar]++;
  }

  // 7) Doğrulamalar
  const onceById = new Map(once.map(r => [r.id, r]));
  const hatalar = [];
  for (const r of tohum.sorular) {
    const o = onceById.get(r.id);
    if (o.dogru !== r.dogru) hatalar.push(r.id + ": dogru değişti (yasak)");
    if (new Set(r.secenekler.map(x => x.text.replace(/\s+/g, " ").trim())).size !== r.secenekler.length) hatalar.push(r.id + ": aynı metinli iki şık");
    if (r.durum === "taslak") hatalar.push(r.id + ": hâlâ taslak (karar yok)");
  }
  for (const f of frqT.frq) if (f.durum === "taslak") hatalar.push(f.id + ": FRQ hâlâ taslak");
  // yeniden yazılan köklerin aktif bankada kopyası yok
  const aktif = tohum.sorular.filter(r => r.durum === "aktif");
  for (const id of Object.keys(YENIDEN)) {
    const r = byId.get(id), n = normal(r);
    const kopyaOlan = aktif.filter(x => x.id !== id && normal(x) === n);
    if (kopyaOlan.length) hatalar.push(id + ": aktif bankada aynı kök: " + kopyaOlan.map(x => x.id).join(", "));
  }
  const saglama = sayisalSaglama();
  saglama.filter(x => !x[1]).forEach(x => hatalar.push(x[0] + ": sayısal sağlama başarısız"));
  if (hatalar.length) { console.error("HATA:\n" + hatalar.join("\n")); process.exit(1); }

  tohum.surum = Math.max(tohum.surum, SORU_SURUM);
  frqT.surum = Math.max(frqT.surum, FRQ_SURUM);
  const soruDegisti = !esit(once, tohum.sorular), frqDegisti = !esit(frqOnce, frqT.frq);
  const degisen = tohum.sorular.filter(r => !esit(r, onceById.get(r.id))).length;
  const frqDegisen = frqT.frq.filter((f, i) => !esit(f, frqOnce[i])).length;
  console.log(`Soru: ${degisen} kayıt değişti · FRQ: ${frqDegisen} kayıt değişti · sağlama ${saglama.length}/${saglama.length} · tohum sürümü ${tohum.surum}, FRQ ${frqT.surum}`);
  if (KURU) return;
  if (soruDegisti || JSON.parse(fs.readFileSync(SORU, "utf8")).surum !== tohum.surum) fs.writeFileSync(SORU, JSON.stringify(tohum, null, 1) + "\n", "utf8");
  if (frqDegisti || JSON.parse(fs.readFileSync(FRQ, "utf8")).surum !== frqT.surum) fs.writeFileSync(FRQ, JSON.stringify(frqT, null, 1) + "\n", "utf8");
  const ri = process.argv.indexOf("--rapor"); // isteğe bağlı: ayrıntılı rapor JSON'u (UYGULANAN.md hazırlığı için)
  if (ri > 0 && process.argv[ri + 1]) fs.writeFileSync(process.argv[ri + 1], JSON.stringify(rapor, null, 1) + "\n", "utf8");
}

main();
