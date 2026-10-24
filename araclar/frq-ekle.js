// Meberra 1.24.0 — FRQ taslaklarını bağımsız denetim kararlarıyla server/tohum/frq.json'a ekler.
// Girdiler: --taslak araclar/frq-yeni/<ders>.json (FRQ dizisi, durum "taslak"), --karar araclar/frq-onay/<ders>.json
//   ([{ id, karar: onay|duzelt|red, neden, duzeltme: { "alan.yolu": yeniDeğer } }])
// Akış: duzeltme yolları taslağa uygulanır (id/durum/ders/sayfa değişmez) → server/frq.js dogrula + içerik denetimi (kontrol
// karakteri, ters bölüsü kaybolmuş LaTeX) → hata yoksa onaylananlar "aktif" + ek.onay ile eklenir, tohum surum +1.
// Parti bütündür: tek hata varsa hiçbir şey yazılmaz. İdempotent: aynı içerikle zaten eklenmiş FRQ atlanır.
// Kullanım: node araclar/frq-ekle.js --taslak <dosya> --karar <dosya> [--tarih YYYY-AA-GG] [--onay-kaynak "..."] [--kuru]
"use strict";
const fs = require("fs");
const path = require("path");
const { dogrula } = require("../server/frq.js");

const KORUNAN = /^(id|durum|ders|sayfa)$/;
const KONTROL = /[\u0000-\u0009\u000b\u000c\u000e-\u001f]/; // sekme dahil: "\text" tek kaçışla sekme+"ext" olur
const LATEX = /(^|[^\\a-zA-Z])(frac|dfrac|tfrac|sqrt|cdot|infty|theta|Delta|text|lim|int|approx|times|vec)(?=[{_^])/;

function yolAta(o, yol, deger) {
  const p = yol.replace(/\[(\d+)\]/g, ".$1").split(".");
  let n = o;
  for (let i = 0; i < p.length - 1; i++) { if (n[p[i]] == null || typeof n[p[i]] !== "object") throw new Error("yol yok: " + yol); n = n[p[i]]; }
  if (!(p[p.length - 1] in n)) throw new Error("alan yok: " + yol);
  n[p[p.length - 1]] = deger;
}

/** Tüm metin alanlarında kontrol karakteri ve matematik içinde ters bölüsü kaybolmuş LaTeX komutu. */
function icerikDenetle(f) {
  const s = [];
  (function gez(v, yer) {
    if (typeof v === "string") {
      if (KONTROL.test(v)) s.push(f.id + " " + yer + ": kontrol karakteri (tek ters bölü kaçışı?)");
      v.replace(/\\\((.*?)\\\)|\\\[(.*?)\\\]/gs, (m, a, b) => { const k = LATEX.exec(a || b || ""); if (k) s.push(f.id + " " + yer + ": ters bölüsü eksik LaTeX '" + k[2] + "'"); return m; });
    } else if (Array.isArray(v)) v.forEach((x, i) => gez(x, yer + "[" + i + "]"));
    else if (v && typeof v === "object") Object.keys(v).forEach(k => gez(v[k], yer ? yer + "." + k : k));
  })(f, "");
  return s;
}

const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const onaysiz = f => { const o = JSON.parse(JSON.stringify(f)); delete o.durum; if (o.ek) delete o.ek.onay; return o; };

function uygula(tohum0, taslaklar, kararlar, secenek) {
  const tohum = JSON.parse(JSON.stringify(tohum0));
  const hatalar = [], eklenen = [], red = [], yeni = [];
  const K = new Map((kararlar || []).map(k => [k.id, k]));
  const mevcut = new Map(tohum.frq.map(f => [f.id, f]));
  const gorulen = new Set();
  for (const f0 of taslaklar) {
    const id = f0 && f0.id;
    if (gorulen.has(id)) { hatalar.push(id + ": partide tekrar"); continue; }
    gorulen.add(id);
    const k = K.get(id);
    if (!k) { hatalar.push(id + ": kararı yok"); continue; }
    if (["onay", "duzelt", "red"].indexOf(k.karar) < 0) { hatalar.push(id + ": bilinmeyen karar " + k.karar); continue; }
    if (k.karar === "red") { red.push(id); continue; }
    if (f0.durum !== "taslak") { hatalar.push(id + ": girdi durum taslak olmalı"); continue; }
    const f = JSON.parse(JSON.stringify(f0));
    if (k.karar === "duzelt") {
      const yollar = Object.keys(k.duzeltme || {});
      if (!yollar.length) { hatalar.push(id + ": duzelt kararında duzeltme yok"); continue; }
      let bozuk = false;
      for (const y of yollar) {
        if (KORUNAN.test(y)) { hatalar.push(id + ": " + y + " düzeltilemez"); bozuk = true; continue; }
        try { yolAta(f, y, k.duzeltme[y]); } catch (e) { hatalar.push(id + ": " + e.message); bozuk = true; }
      }
      if (bozuk) continue;
    }
    f.durum = "aktif";
    f.ek = Object.assign({}, f.ek, { onay: { tarih: secenek.tarih, kaynak: secenek.kaynak } });
    const s = dogrula(f).concat(icerikDenetle(f));
    // 1.24.0 FRQ'larında her parçada ne_soruyor: A2 öğrencisi için cevabı ele vermeyen Türkçe tek cümle (HTML yok)
    f.parcalar.forEach(p => { if (typeof p.ne_soruyor !== "string" || !p.ne_soruyor.trim() || /[<>]/.test(p.ne_soruyor) || p.ne_soruyor.length > 300)
      s.push(id + " (" + p.harf + "): ne_soruyor zorunlu (Türkçe tek cümle, HTML yok, ≤ 300 karakter)"); });
    if (s.length) { s.forEach(x => hatalar.push(x)); continue; }
    if (mevcut.has(id)) {
      if (esit(onaysiz(mevcut.get(id)), onaysiz(f))) continue; // zaten eklenmiş
      hatalar.push(id + ": tohumda farklı içerikle zaten var");
      continue;
    }
    yeni.push(f); eklenen.push(id);
  }
  for (const k of K.keys()) if (!gorulen.has(k)) hatalar.push(k + ": taslağı olmayan karar");
  if (hatalar.length) return { tohum: tohum0, hatalar, eklenen: [], red };
  if (yeni.length) { tohum.frq = tohum.frq.concat(yeni); tohum.surum = (Number(tohum.surum) || 1) + 1; }
  return { tohum, hatalar, eklenen, red };
}

module.exports = { uygula, icerikDenetle, yolAta };

if (require.main === module) {
  const arg = ad => { const i = process.argv.indexOf(ad); return i > 1 && process.argv[i + 1] ? process.argv[i + 1] : null; };
  const ROOT = path.resolve(__dirname, "..");
  const TOHUM = path.join(ROOT, "server", "tohum", "frq.json");
  if (!arg("--taslak") || !arg("--karar")) { console.error("Kullanım: node araclar/frq-ekle.js --taslak <dosya> --karar <dosya> [--kuru]"); process.exit(2); }
  const oku = p => JSON.parse(fs.readFileSync(path.resolve(p), "utf8"));
  const t = oku(TOHUM);
  const r = uygula(t, oku(arg("--taslak")), oku(arg("--karar")), {
    tarih: arg("--tarih") || new Date().toISOString().slice(0, 10), kaynak: arg("--onay-kaynak") || "bağımsız denetim (sahip yetkisiyle)" });
  r.hatalar.forEach(h => console.log("✗ " + h));
  console.log(`${r.hatalar.length} hata, ${r.eklenen.length} eklenecek, ${r.red.length} red` + (r.eklenen.length ? `; tohum sürümü ${t.surum} → ${r.tohum.surum}` : ""));
  if (r.hatalar.length) process.exit(1);
  if (!process.argv.includes("--kuru") && r.eklenen.length) { fs.writeFileSync(TOHUM, JSON.stringify(r.tohum, null, 1) + "\n", "utf8"); console.log("yazıldı: server/tohum/frq.json"); }
}
