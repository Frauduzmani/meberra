"use strict";
/**
 * Meberra 1.23.0 — Konu anlatımı verisi (data/dersler/<ders>/unite-<n>.json) denetimi.
 * Ünite sayfası "konu modu" bu dosyaları okur (assets/js/konu-modu.js). Birim testi: araclar/testler/ders-veri-birim-test.js
 *
 * Biçim:
 *   { ders: "calculus", unite: 1, baslik: "Limits and Continuity", baslikTr: "Limitler ve süreklilik",
 *     konular: [{ kod: "1.1", baslik, baslikTr, sadeceBC?: bool, hedefler: [str],
 *                 anlatim: html, ornekler: [{ soru: html, cozum: [html, ...] }], ipuclari: [str], sikHatalar: [str],
 *                 terimler?: [{ en, tr }] }] }
 * Matematik: \( … \) ve \[ … \] (MathJax). HTML yalnız izinli etiketlerle; betik ve olay özniteliği yok.
 */
const fs = require("fs");
const path = require("path");

const DERSLER = ["calculus", "physics", "chemistry", "biology", "english", "secmeli"];
const ETIKETLER = ["p", "strong", "em", "b", "i", "u", "ul", "ol", "li", "br", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
  "code", "sub", "sup", "h4", "h5", "blockquote", "figure", "figcaption", "hr", "small", "mark"];
const SINIF_ONEK = /^(kn-|u-|formul|akis)/;
const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
const metin = v => typeof v === "string" && v.trim().length > 0;

function htmlDenetle(h, yer, s) {
  if (typeof h !== "string") { s.push(yer + ": metin olmalı"); return; }
  if (/<script|javascript:|\son[a-z]+\s*=/i.test(h)) s.push(yer + ": betik / olay özniteliği yasak");
  (h.match(/<\/?([a-zA-Z0-9]+)[^>]*>/g) || []).forEach(t => {
    const ad = /<\/?([a-zA-Z0-9]+)/.exec(t)[1].toLowerCase();
    if (ETIKETLER.indexOf(ad) < 0) s.push(yer + ": izinsiz etiket <" + ad + ">");
    const sinif = /class=["']([^"']*)["']/.exec(t);
    if (sinif) sinif[1].split(/\s+/).filter(Boolean).forEach(c => { if (!SINIF_ONEK.test(c)) s.push(yer + ": izinsiz sınıf " + c); });
    if (/\sstyle=/i.test(t)) s.push(yer + ": style özniteliği yasak");
  });
  const ac = (h.match(/\\\(/g) || []).length, kap = (h.match(/\\\)/g) || []).length;
  if (ac !== kap) s.push(yer + ": \\( \\) dengesiz");
  const ac2 = (h.match(/\\\[/g) || []).length, kap2 = (h.match(/\\\]/g) || []).length;
  if (ac2 !== kap2) s.push(yer + ": \\[ \\] dengesiz");
  if ((h.replace(/\\\$/g, "").match(/\$/g) || []).length % 2) s.push(yer + ": $ sayısı tek");
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(h)) s.push(yer + ": kontrol karakteri (tek ters bölü kaçışı?)");
}

function denetle(o, dosya) {
  const s = [], d = dosya || "veri";
  if (!isObj(o)) return [d + ": nesne olmalı"];
  if (DERSLER.indexOf(o.ders) < 0) s.push(d + ": ders " + DERSLER.join("|") + " olmalı");
  if (!Number.isInteger(o.unite) || o.unite < 1 || o.unite > 12) s.push(d + ": unite 1–12 tam sayı olmalı");
  if (!metin(o.baslik) || !metin(o.baslikTr)) s.push(d + ": baslik ve baslikTr zorunlu");
  if (!Array.isArray(o.konular) || !o.konular.length) { s.push(d + ": konular boş"); return s; }
  const kodlar = {};
  o.konular.forEach((k, i) => {
    const y = d + " konu[" + i + "]" + (k && k.kod ? " " + k.kod : "");
    if (!isObj(k)) { s.push(y + ": nesne olmalı"); return; }
    if (!/^\d{1,2}\.\d{1,2}$/.test(k.kod || "")) s.push(y + ": kod N.M biçiminde olmalı");
    else if (String(k.kod).split(".")[0] !== String(o.unite)) s.push(y + ": kod ünite numarasıyla başlamalı");
    if (kodlar[k.kod]) s.push(y + ": kod tekrarlanmış"); kodlar[k.kod] = 1;
    if (!metin(k.baslik) || !metin(k.baslikTr)) s.push(y + ": baslik ve baslikTr zorunlu");
    if (k.sadeceBC != null && typeof k.sadeceBC !== "boolean") s.push(y + ": sadeceBC boolean olmalı");
    if (!Array.isArray(k.hedefler) || !k.hedefler.length || !k.hedefler.every(metin)) s.push(y + ": en az 1 hedef");
    htmlDenetle(k.anlatim, y + " anlatim", s);
    if (typeof k.anlatim === "string" && k.anlatim.replace(/<[^>]+>/g, "").length < 1200) s.push(y + ": anlatım en az 1200 karakter olmalı (" + k.anlatim.replace(/<[^>]+>/g, "").length + ")");
    if (!Array.isArray(k.ornekler) || k.ornekler.length < 2) s.push(y + ": en az 2 çözümlü örnek");
    (k.ornekler || []).forEach((e, j) => {
      htmlDenetle(e && e.soru, y + " ornek[" + j + "].soru", s);
      if (!e || !Array.isArray(e.cozum) || e.cozum.length < 2) s.push(y + " ornek[" + j + "]: çözüm en az 2 adım");
      else e.cozum.forEach((c, m) => htmlDenetle(c, y + " ornek[" + j + "].cozum[" + m + "]", s));
    });
    if (!Array.isArray(k.ipuclari) || k.ipuclari.length < 3) s.push(y + ": en az 3 ipucu");
    (k.ipuclari || []).forEach((t, j) => htmlDenetle(t, y + " ipucu[" + j + "]", s));
    if (!Array.isArray(k.sikHatalar) || k.sikHatalar.length < 2) s.push(y + ": en az 2 sık hata");
    (k.sikHatalar || []).forEach((t, j) => htmlDenetle(t, y + " sikHata[" + j + "]", s));
    if (k.terimler != null && (!Array.isArray(k.terimler) || !k.terimler.every(t => isObj(t) && metin(t.en) && metin(t.tr)))) s.push(y + ": terimler [{en,tr}] olmalı");
    const fazla = Object.keys(k).filter(a => ["kod", "baslik", "baslikTr", "sadeceBC", "hedefler", "anlatim", "ornekler", "ipuclari", "sikHatalar", "terimler"].indexOf(a) < 0);
    if (fazla.length) s.push(y + ": bilinmeyen alan " + fazla.join(","));
  });
  return s;
}

/** data/dersler altındaki tüm dosyalar: [{ dosya, veri, sorunlar }] */
function hepsi(kok) {
  const K = path.join(kok || path.join(__dirname, ".."), "data", "dersler"), out = [];
  if (!fs.existsSync(K)) return out;
  fs.readdirSync(K).forEach(ders => {
    const D = path.join(K, ders);
    if (!fs.statSync(D).isDirectory()) return;
    fs.readdirSync(D).filter(f => /^unite-\d+\.json$/.test(f)).forEach(f => {
      const dosya = "data/dersler/" + ders + "/" + f;
      let veri = null, sorunlar;
      try { veri = JSON.parse(fs.readFileSync(path.join(D, f), "utf8")); sorunlar = denetle(veri, dosya); }
      catch (e) { sorunlar = [dosya + ": JSON okunamadı (" + e.message + ")"]; }
      if (veri && veri.ders !== ders) sorunlar.push(dosya + ": ders alanı klasörle uyuşmuyor");
      if (veri && "unite-" + veri.unite + ".json" !== f) sorunlar.push(dosya + ": unite alanı dosya adıyla uyuşmuyor");
      out.push({ dosya, veri, sorunlar });
    });
  });
  return out;
}

/** Konu modunun okuduğu dizin: {ders: [ünite numaraları]} — yalnız sorunsuz dosyalar. */
function dizinOlustur(kok) {
  const D = {};
  hepsi(kok).filter(x => x.veri && !x.sorunlar.length).forEach(x => { (D[x.veri.ders] = D[x.veri.ders] || []).push(x.veri.unite); });
  Object.keys(D).forEach(k => D[k].sort((a, b) => a - b));
  return D;
}

module.exports = { denetle, hepsi, htmlDenetle, dizinOlustur, ETIKETLER };

if (require.main === module) {
  if (process.argv.includes("--dizin")) {
    fs.mkdirSync(path.join(__dirname, "..", "data", "dersler"), { recursive: true });
    fs.writeFileSync(path.join(__dirname, "..", "data", "dersler", "dizin.json"), JSON.stringify(dizinOlustur(), null, 1) + "\n", "utf8");
  }
  const r = hepsi();
  let n = 0;
  r.forEach(x => { x.sorunlar.forEach(m => console.log("  - " + m)); n += x.sorunlar.length; });
  console.log("DERS VERİSİ: " + r.length + " dosya, " + r.reduce((t, x) => t + (x.veri && x.veri.konular ? x.veri.konular.length : 0), 0) + " konu, " + n + " sorun");
  process.exit(n ? 1 : 0);
}
