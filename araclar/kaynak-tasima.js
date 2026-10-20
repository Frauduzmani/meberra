#!/usr/bin/env node
/**
 * AP MEBERRA — Tek seferlik taşıma (Ajan 11, Tur 11, karar D6/D8; PM onayı 15 Ekim 2026)
 *
 * Eski veri dosyalarını üreticinin girdi biçimine (data/mevzuat/kaynak/*.json) çevirir:
 *   data/mevzuat/sartlar.js        -> kaynak/lisans-de.json, kaynak/lisans-it.json
 *   data/mevzuat/mezun-ulkeler.js  -> kaynak/lisans-hu.json, kaynak/lisans-pl.json,
 *                                     kaynak/duyurular.json, kaynak/mezun-notlari.json
 * Madde metinleri, kaynakları, kesinlikleri ve id'leri DEĞİŞTİRİLMEDEN kopyalanır.
 * Eşleme:
 *   sartlar.js  ulkeler.<u>.ortak              -> lisans.ortak
 *               ulkeler.<u>.siniflar.<s>.{4}   -> lisans.sinifNotlari.<s> = {gerekenler, buYil, tarihler, hatalar}
 *   mezun-ulkeler.js ulkeler.<u>.ortak         -> lisans.ortak
 *               ulkeler.<u>.{buYil,tarihler,hatalar} -> lisans.sinifNotlari.mezun (lise mezunu modeli)
 *               duyurular[]                    -> duyurular.json (hedef: lise-mezun + ülke)
 *               digerleri[] {ad, neden, kaynak} -> mezun-notlari.json (ülke koduyla; "Mezun Menüsü değerlendirmesi")
 * Eski dosyalar SİLİNMEZ (PM kararı: taşıma doğrulanana kadar).
 * Çalıştır: node araclar/kaynak-tasima.js   (var olan kaynak dosyalarının üzerine yazar; --kuru ile yalnızca özet)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const KAYNAK = path.join(ROOT, "data", "mevzuat", "kaynak");
const KURU = process.argv.includes("--kuru");

function yukle(dosya, ad) {
  global.window = {};
  delete require.cache[require.resolve(path.join(ROOT, dosya))];
  require(path.join(ROOT, dosya));
  const v = global.window[ad];
  delete global.window;
  return v;
}
const S = yukle("data/mevzuat/sartlar.js", "APMEBERRA_SARTLAR");
const MZ = yukle("data/mevzuat/mezun-ulkeler.js", "APMEBERRA_MEZUN_ULKELER");
const META = JSON.parse(fs.readFileSync(path.join(KAYNAK, "ulkeler-meta.json"), "utf8"));
const kod = ad => (META.ulkeler.find(u => u.ad === ad) || {}).kod || null;
const yerel = k => (META.ulkeler.find(u => u.kod === k) || {}).yerelDil || [];
const kopya = x => JSON.parse(JSON.stringify(x));
const bosDil = () => ({ gerekenler: [], tarihler: [], hatalar: [] });

const cikti = {};
// 1) Almanya ve İtalya (sartlar.js)
for (const u of ["de", "it"]) {
  const c = S.ulkeler[u];
  const sn = {};
  for (const s of ["9", "10", "11", "12", "mezun"]) {
    const x = c.siniflar[s] || {};
    sn[s] = { gerekenler: kopya(x.gerekenler || []), buYil: kopya(x.buYil || []), tarihler: kopya(x.tarihler || []), hatalar: kopya(x.hatalar || []) };
  }
  cikti["lisans-" + u + ".json"] = {
    ulke: u, ad: c.ad, yerelDil: yerel(u), surum: S.surum, sonKontrol: S.sonKontrol,
    tasima: "data/mevzuat/sartlar.js " + S.surum + " (Tur 11 taşıması). Maddeler İngilizce lisans içindir; dil ayrımı yapılmadığı için sinifNotlari altında tutuldu.",
    ozet: "", rozet: null,
    ortak: kopya(c.ortak), en: bosDil(), yerel: bosDil(), sinifNotlari: sn, apEtkisi: [], burslar: []
  };
}
// 2) Macaristan ve Polonya (mezun-ulkeler.js)
for (const u of Object.keys(MZ.ulkeler)) {
  const c = MZ.ulkeler[u];
  cikti["lisans-" + u + ".json"] = {
    ulke: u, ad: c.ad, yerelDil: yerel(u), surum: MZ.surum, sonKontrol: MZ.sonKontrol,
    tasima: "data/mevzuat/mezun-ulkeler.js " + MZ.surum + " (Tur 11 taşıması). Maddeler lise mezunları için derlendi (Mezun Menüsü).",
    ozet: c.ozet || "", rozet: c.rozet || null,
    ortak: kopya(c.ortak), en: bosDil(), yerel: bosDil(),
    sinifNotlari: { mezun: { gerekenler: [], buYil: kopya(c.buYil), tarihler: kopya(c.tarihler), hatalar: kopya(c.hatalar) } },
    apEtkisi: [], burslar: []
  };
}
// 3) Duyurular (hedef: lise mezunu + ilgili ülke)
cikti["duyurular.json"] = {
  surum: MZ.surum, sonKontrol: MZ.sonKontrol,
  duyurular: MZ.duyurular.map(d => Object.assign(kopya(d), { hedef: { modeller: ["lise-mezun"], ulkeler: /bme|budape|macar/i.test(d.id + d.baslik) ? ["hu"] : [], diller: [] } }))
};
// 4) Menüye alınmayan ülkelerin değerlendirmesi
const notlar = {};
MZ.digerleri.forEach(d => {
  const k = kod(d.ad);
  if (!k) throw new Error("ülke kodu bulunamadı: " + d.ad);
  notlar[k] = { baslik: "Mezun Menüsü ön değerlendirmesi (14 Ekim 2026)", metin: d.neden, kaynak: kopya(d.kaynak), sonKontrol: MZ.sonKontrol };
});
cikti["mezun-notlari.json"] = { surum: MZ.surum, sonKontrol: MZ.sonKontrol, notlar };

// Özet ve yazım
let madde = 0;
const say = o => { if (Array.isArray(o)) o.forEach(say); else if (o && typeof o === "object") { if (typeof o.metin === "string" && Array.isArray(o.kaynak) && o.kesinlik) madde++; Object.values(o).forEach(say); } };
for (const [ad, v] of Object.entries(cikti)) {
  const once = madde; say(v);
  console.log((KURU ? "[kuru] " : "") + ad + ": " + (madde - once) + " madde");
  if (!KURU) fs.writeFileSync(path.join(KAYNAK, ad), JSON.stringify(v, null, 2) + "\n", "utf8");
}
console.log("Toplam madde: " + madde + " (beklenen: sartlar.js 74 + mezun-ulkeler.js 26 = 100)");
