// Meberra — Sınav kayıtları aktarımı (Ajan 11, Tur 12; plan .agents/rules/tur12-ekran-plani.md S8)
// Kullanım (proje klasöründen; PM çalıştırır):
//   node araclar/sinav-aktar.js                       -> .agents/mevzuat/dogrulama/sinavlar-tur12.json'u data/mevzuat/sinavlar.js'e aktarır
//   node araclar/sinav-aktar.js --kuru                -> yazmadan rapor verir
//   node araclar/sinav-aktar.js --girdi <json> --cikti <js>
// Kurallar:
//  - Mevcut kayıtlar korunur; aynı id gelirse yalnız izinli alanlar güncellenir (sinav-motor GUNCELLENEBILIR), ulkeler birleşir.
//  - Yeni id'ler eklenir; şema hatalı yeni kayıt eklenmez, raporlanır. Bilinmeyen alanlar yazılmaz, raporlanır.
//  - Girdi biçimi: dizi ya da Ajan 13 biçimi {mevcutGuncellemeler: [{id, alanlar, notEki, kaynak[]}], yeniKayitlar: [...]}.
//    notEki mevcut notun SONUNA eklenir (mevcut metin silinmez; yeniden çalıştırınca çiftlenmez).
//  - Normalleştirme: ulkeler küçük harf; duzey metni -> dizi ("YL", "yüksek lisans" -> "yl"); yeni kayıtta kaynak dizisi -> ilk adres
//    "kaynak", tümü "kaynaklar" ([{ad, url, belgeYili, erisim}], Tur 12 ek alanı); güncellemede kaynak dizisi yalnız kaynaklar'a eklenir.
//  - Sonuçta tüm liste şemadan geçmezse dosya yazılmaz ve çıkış kodu 1 olur.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const M = require("../assets/js/sinav-motor.js");

const ROOT = path.resolve(__dirname, "..");
const arg = (ad, vars) => { const i = process.argv.indexOf(ad); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : vars; };
const KURU = process.argv.includes("--kuru");
const GIRDI = path.resolve(ROOT, arg("--girdi", ".agents/mevzuat/dogrulama/sinavlar-tur12.json"));
const CIKTI = path.resolve(ROOT, arg("--cikti", "data/mevzuat/sinavlar.js"));
const KAYNAK_JS = path.resolve(ROOT, arg("--mevcut", "data/mevzuat/sinavlar.js"));

function mevcutOku(dosya) {
  const metin = fs.readFileSync(dosya, "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(metin, ctx, { filename: dosya });
  const i = metin.indexOf("window.APMEBERRA_SINAVLAR");
  return { liste: ctx.window.APMEBERRA_SINAVLAR, baslik: i > 0 ? metin.slice(0, i) : "" };
}

/**
 * Ajan 13 biçimi (sinavlar-tur12.json, 16 Ekim 2026): {_meta, mevcutGuncellemeler: [{id, alanlar:{...}, notEki, gerekce, kaynak:[{ad,url}]}],
 * yeniKayitlar: [tam kayıt + kaynaklar[]], tur11Duzeltmeleri (sınav kaydı değil; atlanır)}.
 * Güncellemede kaynak dizisi mevcut "kaynak" alanını DEĞİŞTİRMEZ; kaynaklar[]'a eklenir.
 */
function girdiOku(dosya) {
  const j = JSON.parse(fs.readFileSync(dosya, "utf8"));
  if (Array.isArray(j)) return j;
  const out = [];
  ["mevcutGuncellemeler", "mevcutGuncelleme", "guncellemeler", "guncelleme"].forEach(k => {
    if (!Array.isArray(j[k])) return;
    j[k].forEach(g => {
      if (!g || typeof g !== "object") return out.push(g);
      const o = Object.assign({ id: g.id }, g.alanlar && typeof g.alanlar === "object" ? g.alanlar : {});
      Object.keys(g).forEach(x => { if (x !== "alanlar" && x !== "kaynak" && !(x in o)) o[x] = g[x]; });
      const ek = (Array.isArray(g.kaynak) ? g.kaynak : g.kaynak ? [g.kaynak] : []).map(x => typeof x === "string" ? { ad: "Kaynak", url: x } : x);
      if (ek.length) o.kaynaklar = (Array.isArray(o.kaynaklar) ? o.kaynaklar : []).concat(ek);
      out.push(o);
    });
  });
  ["sinavlar", "kayitlar", "yeni", "yeniKayitlar"].forEach(k => { if (Array.isArray(j[k])) out.push(...j[k]); });
  return out;
}

function normallestir(g, rapor) {
  if (!g || typeof g !== "object") return g;
  const o = Object.assign({}, g);
  if (Array.isArray(o.ulkeler)) o.ulkeler = o.ulkeler.map(u => String(u).trim().toLowerCase());
  if (typeof o.duzey === "string") o.duzey = o.duzey.split(/[,/;+]|\bve\b/).map(s => s.trim());
  if (Array.isArray(o.duzey)) o.duzey = o.duzey.map(d => /^(yl|yüksek ?lisans|master)/i.test(String(d).trim()) ? "yl" : /^lisans|bachelor/i.test(String(d).trim()) ? "lisans" : String(d).trim()).filter((d, i, a) => a.indexOf(d) === i);
  // Yeni kayıtta kaynak dizisi: ilk http(s) adresi "kaynak" olur, tümü "kaynaklar"a girer (kaynak kaybolmaz)
  if (Array.isArray(o.kaynak)) {
    const liste = o.kaynak.map(k => typeof k === "string" ? { ad: "Kaynak", url: k } : k).filter(k => k && typeof k.url === "string" && /^https?:\/\//i.test(k.url));
    o.kaynak = liste.length ? liste[0].url : null;
    const var_ = (Array.isArray(o.kaynaklar) ? o.kaynaklar : []).map(k => k && k.url);
    o.kaynaklar = (Array.isArray(o.kaynaklar) ? o.kaynaklar : []).concat(liste.filter(k => var_.indexOf(k.url) < 0));
    if (liste.length > 1) rapor.push(o.id + ": kaynak dizisi -> kaynak + kaynaklar (" + liste.length + ")");
  }
  if (Array.isArray(o.kaynaklar)) {
    const gor = {};
    // Yalnız http(s) kaynaklar yayına girer; proje içi yollar (ör. ".agents/mevzuat/dogrulama/") atılır ve raporlanır
    o.kaynaklar.filter(k => !(k && typeof k.url === "string" && /^https?:\/\//i.test(k.url))).forEach(k => rapor.push(o.id + ": http(s) olmayan kaynak atlandı (" + (k && k.url) + ")"));
    o.kaynaklar = o.kaynaklar.filter(k => k && typeof k.url === "string" && /^https?:\/\//i.test(k.url) && !gor[k.url] && (gor[k.url] = true));
    if (!o.kaynaklar.length) delete o.kaynaklar;
  }
  if (o.gerekce != null) { o._gerekce = o.gerekce; delete o.gerekce; }
  if (o.ucret != null && typeof o.ucret !== "string") o.ucret = String(o.ucret);
  return o;
}

function jsDeger(v, girinti) {
  if (Array.isArray(v) && v.every(x => typeof x === "string")) return "[" + v.map(x => JSON.stringify(x)).join(", ") + "]";
  return JSON.stringify(v, null, 2).replace(/\n/g, "\n" + girinti);
}
function yaz(liste, baslik) {
  const govde = liste.map(s => "  {\n" + Object.keys(s).filter(k => s[k] !== undefined).map(k => "    " + k + ": " + jsDeger(s[k], "    ")).join(",\n") + "\n  }").join(",\n");
  return baslik + "window.APMEBERRA_SINAVLAR = [\n" + govde + "\n];\n";
}

function calistir() {
  if (!fs.existsSync(GIRDI)) { console.log("Girdi yok: " + path.relative(ROOT, GIRDI) + " — aktarılacak kayıt yok (0 değişiklik)."); return 0; }
  const { liste, baslik } = mevcutOku(KAYNAK_JS);
  const onceki = M.listeDogrula(liste);
  if (onceki.length) { console.log("Mevcut sinavlar.js şemadan geçmiyor (" + onceki.length + "):"); onceki.forEach(x => console.log("  ✗ " + x)); return 1; }
  const notlar = [];
  const gelen = girdiOku(GIRDI).map(g => normallestir(g, notlar));
  const r = M.birlestir(liste, gelen);
  const son = M.listeDogrula(r.liste);
  console.log("Girdi: " + path.relative(ROOT, GIRDI) + " (" + gelen.length + " kayıt)");
  console.log("Mevcut: " + liste.length + " · Eklenen: " + r.eklenen.length + " · Güncellenen: " + r.guncellenen.length + " · Atlanan: " + r.atlanan.length + " · Sonuç: " + r.liste.length + " kayıt");
  r.eklenen.forEach(x => console.log("  + " + x));
  r.guncellenen.forEach(x => console.log("  ~ " + x));
  r.atlanan.forEach(x => console.log("  - " + x));
  notlar.forEach(x => console.log("  i " + x));
  const say = {};
  r.liste.forEach(s => { M.sinavDilleri(s).forEach(d => { say[d] = (say[d] || 0) + 1; }); });
  console.log("Dil dağılımı: " + JSON.stringify(say) + " · Ülke kapsaması: " + M.ULKE_KODLARI.map(u => u + "=" + r.liste.filter(s => (s.ulkeler || []).includes(u) && s.kategori === "Dil Sınavı").length).join(" "));
  if (r.sorunlar.length || son.length) {
    console.log("Şema sorunları (" + (r.sorunlar.length + son.length) + "):");
    r.sorunlar.concat(son).forEach(x => console.log("  ✗ " + x));
  }
  if (son.length) { console.log("Sonuç listesi şemadan geçmedi; dosya YAZILMADI."); return 1; }
  if (KURU) { console.log("--kuru: dosya yazılmadı."); return r.sorunlar.length ? 1 : 0; }
  let b = baslik;
  if (!/Tur 12 aktarımı/.test(b)) b = b + "// Tur 12 aktarımı: araclar/sinav-aktar.js (ek alanlar: dil, duzey, kesinlik, sonKontrol, ucret; şema assets/js/sinav-motor.js).\n";
  fs.writeFileSync(CIKTI, yaz(r.liste, b), "utf8");
  // Yazılan dosyayı geri okuyup doğrula
  const geri = mevcutOku(CIKTI).liste;
  const ayni = JSON.stringify(geri) === JSON.stringify(JSON.parse(JSON.stringify(r.liste)));
  console.log("Yazıldı: " + path.relative(ROOT, CIKTI) + " (" + geri.length + " kayıt, geri okuma " + (ayni ? "aynı" : "FARKLI") + ")");
  return ayni && !r.sorunlar.length ? 0 : 1;
}

if (require.main === module) process.exit(calistir());
module.exports = { mevcutOku, girdiOku, normallestir, yaz };
