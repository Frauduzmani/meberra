"use strict";
/**
 * Meberra 1.22.0 — Yapılandırılmış isterler (data/mevzuat/kaynak/isterler-<cc>.json) denetimi.
 * Üretici (araclar/ulke-veri-olustur.js) --kontrol dahil her çalışmada kullanır; birim testi: araclar/testler/isterler-birim-test.js
 *
 *   baglam()                         -> {apKodlari[], sinavKimlikleri[], uniKimlikleri{cc: []}}
 *   isterlerDenetle(obj, cc, baglam) -> sorun listesi (boşsa geçerli)
 * Kural: durum ok|uyari|kapali olan her hücrede kaynak[] ve kesinlik zorunlu; emin olunmayan hücre "teyit" olur.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");
const H = require(path.join(ROOT, "assets", "js", "hedef-motor.js"));
const A = require(path.join(ROOT, "assets", "js", "ap-hedef.js"));
const E = require(path.join(ROOT, "assets", "js", "eposta.js"));

const DURUMLAR = ["ok", "uyari", "kapali", "teyit"];
const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);

function baglam(kaynakKlasoru) {
  const K = kaynakKlasoru || path.join(ROOT, "data", "mevzuat", "kaynak");
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data", "mevzuat", "sinavlar.js"), "utf8"), ctx);
  const S = ctx.window.APMEBERRA_SINAVLAR;
  const sinavlar = Array.isArray(S) ? S : (S && (S.sinavlar || S.liste)) || [];
  const uniKimlikleri = {};
  fs.readdirSync(K).forEach(f => {
    const m = /^uni-([a-z]{2})\.json$/.exec(f);
    if (!m) return;
    const U = JSON.parse(fs.readFileSync(path.join(K, f), "utf8"));
    uniKimlikleri[m[1]] = (U.universiteler || U.liste || []).map(u => E.universiteKimligi(m[1], u));
  });
  return { apKodlari: A.DERSLER.map(d => d.ders), sinavKimlikleri: sinavlar.map(s => s.id), uniKimlikleri };
}

function hucreDenetle(h, yer, B, s) {
  if (!isObj(h)) { s.push(yer + ": hücre nesne olmalı"); return; }
  if (DURUMLAR.indexOf(h.durum) < 0) { s.push(yer + ": durum ok|uyari|kapali|teyit olmalı"); return; }
  if (typeof h.metin !== "string" || !h.metin.trim()) s.push(yer + ": metin boş");
  if (h.durum !== "teyit") {
    if (!Array.isArray(h.kaynak) || !h.kaynak.length || !h.kaynak.every(k => k && /^https?:\/\//.test(k.url || ""))) s.push(yer + ": " + h.durum + " hücresinde kaynak bağlantısı zorunlu");
    if (!h.kesinlik) s.push(yer + ": kesinlik zorunlu");
  }
  (h.dersler || []).forEach(d => { if (B.apKodlari.indexOf(d) < 0) s.push(yer + ": geçersiz AP kodu " + d); });
  if (h.sayi != null && !(Number.isInteger(h.sayi) && h.sayi >= 0 && h.sayi <= 6)) s.push(yer + ": sayi 0–6 tam sayı olmalı");
  (h.sinavlar || []).forEach(x => { if (B.sinavKimlikleri.indexOf(x) < 0) s.push(yer + ": sinavlar.js içinde olmayan sınav " + x); });
  if (h.esik != null) {
    const e = Array.isArray(h.esik) ? h.esik : [h.esik];
    if (!e.length || !e.every(x => typeof x === "number" && x > 0)) s.push(yer + ": esik sayı ya da [alt, üst] olmalı");
  }
}

function satirlarDenetle(o, yer, B, s, alanIzin) {
  if (!isObj(o)) { s.push(yer + ": nesne olmalı"); return; }
  Object.keys(o).forEach(k => {
    if (k === "alanlar" && alanIzin) {
      if (!isObj(o.alanlar)) { s.push(yer + ".alanlar: nesne olmalı"); return; }
      Object.keys(o.alanlar).forEach(a => {
        if (H.ALANLAR.indexOf(a) < 0) s.push(yer + ".alanlar: bilinmeyen alan " + a);
        else satirlarDenetle(o.alanlar[a], yer + ".alanlar." + a, B, s, false);
      });
      return;
    }
    if (H.SATIRLAR.indexOf(k) < 0) { s.push(yer + ": bilinmeyen satır " + k); return; }
    hucreDenetle(o[k], yer + "." + k, B, s);
  });
}

function isterlerDenetle(obj, cc, B) {
  const s = [];
  if (!isObj(obj)) return ["isterler nesne olmalı"];
  Object.keys(obj).forEach(k => { if (["ulke", "sonKontrol", "not", "varsayilan", "alanlar", "universite"].indexOf(k) < 0) s.push("bilinmeyen anahtar " + k); });
  if (obj.ulke && obj.ulke !== cc) s.push("ulke alanı '" + obj.ulke + "' dosya adıyla uyuşmuyor");
  if (obj.varsayilan) satirlarDenetle(obj.varsayilan, "varsayilan", B, s, false);
  if (obj.alanlar) satirlarDenetle({ alanlar: obj.alanlar }, "", B, s, true);
  if (obj.universite) {
    if (!isObj(obj.universite)) s.push("universite: nesne olmalı");
    else Object.keys(obj.universite).forEach(id => {
      if ((B.uniKimlikleri[cc] || []).indexOf(id) < 0) s.push("universite: uni-" + cc + ".json içinde olmayan kimlik " + id);
      else satirlarDenetle(obj.universite[id], "universite." + id, B, s, true);
    });
  }
  return s;
}

module.exports = { baglam, isterlerDenetle, DURUMLAR };
