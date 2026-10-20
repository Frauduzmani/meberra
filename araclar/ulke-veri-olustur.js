#!/usr/bin/env node
/**
 * Meberra — Ülke verisi üreticisi (Ajan 11, Tur 11, kararlar D6/D8; PM onayı 15 Ekim 2026)
 *
 * TEK KAYNAK: data/mevzuat/kaynak/*.json (PM onaylı). Sayfalar bu klasörü OKUMAZ; bu araç şunları üretir:
 *   data/mevzuat/ulke-dizini.js   window.APMEBERRA_ULKE_DIZINI  (15 ülke özeti; her açık sayfada)
 *   data/mevzuat/ulke/<cc>.js     window.APMEBERRA_ULKE_VERI[cc] (lisans + yl + ilk 20; seçilince yüklenir)
 *   data/mevzuat/yl-genel.js      window.APMEBERRA_YL_GENEL
 *   data/mevzuat/duyurular.js     window.APMEBERRA_DUYURULAR
 * Üretilen dosyalar elle düzenlenmez. Şema hatasında hiçbir dosya yazılmaz ve çıkış kodu 1 olur.
 *
 * Girdi dosyaları (Ajan 13 biçimi, .agents/rules/tur11-ekran-plani.md §5):
 *   ulkeler-meta.json            ülke adları, yerel diller, grup, portal, genel yol haritası şablonu (ZORUNLU)
 *   lisans-<cc>.json             {ulke, ad, yerelDil, ozet, ortak[], en{gerekenler,tarihler,hatalar}, yerel{...},
 *                                 sinifNotlari{"9".."12","mezun": madde[] | {gerekenler,buYil,tarihler,hatalar}},
 *                                 apEtkisi[], burslar[], uyarilar[]?, rozet?, programDurumu?{en,yerel}}
 *   yl-<cc>.json                 {ulke, ad, yerelDil, ozet, ortak[], en{...}, yerel{...}, burslar[], ornekProgramlar[], rozet?}
 *   uni-<cc>.json                {ulke, siralama{ad,yayin,url}, universiteler[{sira, ad, sehir, qsSira, url, lisans{en,yerel,not,kaynak},
 *                                 yuksekLisans{...}, muhendislik, harcNotu, basvuruUrl, kesinlik, rotaUniId?}]}
 *   yl-genel.json                {belgeler, turkiyeBurslari, abBurslari, askerlik, takvim, gre, dilSinavlari}
 *   duyurular.json               {duyurular: [madde + bitis + hedef{modeller, ulkeler, diller}]}
 *   mezun-notlari.json           {notlar: {cc: {baslik, metin, kaynak[], sonKontrol}}}
 *
 * Kullanım:
 *   node araclar/ulke-veri-olustur.js                 üret (data/mevzuat/kaynak)
 *   node araclar/ulke-veri-olustur.js --kontrol       yalnızca doğrula, yazma
 *   node araclar/ulke-veri-olustur.js --kaynak <dir>  başka klasörü doğrula (ör. .agents/mevzuat/dogrulama; --kontrol ile)
 *   node araclar/ulke-veri-olustur.js --cikti <dir>   çıktıyı başka klasöre yaz (ulke-veri-test güncellik denetimi)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const M = require(path.join(ROOT, "assets", "js", "sartlar-motor.js"));

const args = process.argv.slice(2);
const KONTROL = args.includes("--kontrol");
const ki = args.indexOf("--kaynak");
const KAYNAK = ki >= 0 && args[ki + 1] ? path.resolve(args[ki + 1]) : path.join(ROOT, "data", "mevzuat", "kaynak");
const META_DOSYA = fs.existsSync(path.join(KAYNAK, "ulkeler-meta.json")) ? path.join(KAYNAK, "ulkeler-meta.json") : path.join(ROOT, "data", "mevzuat", "kaynak", "ulkeler-meta.json");
const ci = args.indexOf("--cikti");
const CIKTI = ci >= 0 && args[ci + 1] ? path.resolve(args[ci + 1]) : path.join(ROOT, "data", "mevzuat");

const sorunlar = [];
const uyar = (dosya, list) => list.forEach(s => sorunlar.push(dosya + ": " + s));
function oku(ad) {
  const f = path.join(KAYNAK, ad);
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { sorunlar.push(ad + ": JSON okunamadı (" + e.message + ")"); return null; }
}
const arr = x => (Array.isArray(x) ? x : []);
const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
const enGec = (...g) => g.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x || "")).sort().pop() || null;
const dilBlok = b => (isObj(b) ? { gerekenler: arr(b.gerekenler), tarihler: arr(b.tarihler), hatalar: arr(b.hatalar) } : { gerekenler: [], tarihler: [], hatalar: [] });
// yerelDil kaynakta dil kodu dizisi (["sv"]) ya da ad ("İsveççe") olabilir; kod değilse meta'daki kodlar kullanılır
const yerelDilNorm = (v, meta) => (Array.isArray(v) && v.length && v.every(x => /^[a-z]{2}$/.test(x)) ? v : meta.yerelDil);
/**
 * PM kararı K-A (15 Ekim 2026): üniversite dil hücresi eşlemesi üreticide yapılır, kaynak JSON olduğu gibi kalır.
 * "kısıtlı"/"kisitli" -> "kismi", "Doğrulanamadı" -> "teyit". Kaynak alanı URL dizisi ise {ad, url} dizisine çevrilir.
 */
const HUCRE = { "var": "var", "kismi": "kismi", "kısmi": "kismi", "kısıtlı": "kismi", "kisitli": "kismi", "yok": "yok", "teyit": "teyit", "Doğrulanamadı": "teyit", "Teyit gerekir": "teyit" };
function kaynakNorm(k, ad) {
  // Metin içindeki adresler ayıklanır: "https://a/ (veri: https://b/x)" -> iki bağlantı (uni-fr.json biçimi)
  const ham = (Array.isArray(k) ? k : (typeof k === "string" && k ? [k] : []))
    .reduce((l, x) => l.concat(typeof x === "string" ? (x.match(/https?:\/\/[^\s()<>"']+/g) || []) : [x]), []);
  return ham.map((x, i) => typeof x === "string" ? { ad: ad + (ham.length > 1 ? " " + (i + 1) : ""), url: x } : x).filter(x => x && typeof x.url === "string");
}
function uniNorm(u) {
  const o = Object.assign({}, u);
  ["lisans", "yuksekLisans"].forEach(a => {
    if (!isObj(u[a])) return;
    const b = Object.assign({}, u[a]);
    ["en", "yerel"].forEach(d => { if (b[d] != null) { const h = HUCRE[String(b[d]).trim()]; if (h) { if (h !== b[d]) b[d + "Ham"] = b[d]; b[d] = h; } } });
    b.kaynak = kaynakNorm(b.kaynak, "Program kataloğu");
    o[a] = b;
  });
  if (Array.isArray(u.harcKaynak)) o.harcKaynak = kaynakNorm(u.harcKaynak, "Harç kaynağı");
  if (typeof o.qsSira === "string" && o.qsSira.startsWith("=")) {
    o.qsSira = o.qsSira.replace(/^=\s*/, "");
  }
  return o;
}
/** PM kararı K-D: ülke özet uyarısı, ör. ozetUyari: {"lisans-en": "Mühendislikte İngilizce lisans çok dar"} (metin ya da {metin, kaynak}) */
function ozetUyariTopla(kaynaklar, dosya) {
  const o = {};
  kaynaklar.forEach(x => {
    if (!x || x.ozetUyari == null) return;
    if (!isObj(x.ozetUyari)) { sorunlar.push(dosya + ": ozetUyari nesne olmalı"); return; }
    Object.keys(x.ozetUyari).forEach(k => {
      if (!/^(lisans|yl)-(en|yerel)$/.test(k)) { sorunlar.push(dosya + ": ozetUyari anahtarı lisans-en | lisans-yerel | yl-en | yl-yerel olmalı (" + k + ")"); return; }
      const v = x.ozetUyari[k];
      const m = typeof v === "string" ? { metin: v } : isObj(v) ? { metin: String(v.metin || ""), kaynak: kaynakNorm(v.kaynak, "Kaynak") } : null;
      if (!m || !m.metin.trim()) sorunlar.push(dosya + ": ozetUyari." + k + " metin gerekli"); else o[k] = m;
    });
  });
  return Object.keys(o).length ? o : null;
}
/** yl-genel.dilSinavlari: sınav kaydı ({ad, cefr, gecerlilik, ...}) madde biçimine çevrilir; madde ise aynen kalır. */
const SINAV_ALAN = [["cefr", "Ölçek"], ["gecerlilik", "Geçerlilik"], ["turkiyeMerkez", "Türkiye"], ["ucret", "Ücret"], ["sonucSuresi", "Sonuç"], ["kabul", "Kabul"]];
function sinavMadde(x) {
  if (!isObj(x) || typeof x.metin === "string") return x;
  const m = { id: x.id, baslik: x.ad + (x.dil ? " (" + x.dil + ")" : ""), metin: SINAV_ALAN.filter(a => x[a[0]]).map(a => a[1] + ": " + String(x[a[0]]).trim()).join(" "),
    kaynak: kaynakNorm(x.kaynak, "Kaynak"), kesinlik: x.kesinlik, sonKontrol: x.sonKontrol };
  if (x.dil) m.sinavDili = x.dil;
  return m;
}
function maddeSay(o) {
  let n = 0;
  (function gez(x) { if (Array.isArray(x)) x.forEach(gez); else if (isObj(x)) { if (typeof x.metin === "string" && Array.isArray(x.kaynak) && x.kesinlik) n++; else Object.values(x).forEach(gez); } })(o);
  return n;
}

const META = JSON.parse(fs.readFileSync(META_DOSYA, "utf8"));
const dosyalar = fs.existsSync(KAYNAK) ? fs.readdirSync(KAYNAK) : [];
const tanimsiz = dosyalar.filter(f => /\.json$/.test(f) && !/^(ulkeler-meta|yl-genel|duyurular|mezun-notlari|bulgular-[a-z]{2}|(lisans|yl|uni)-[a-z]{2})\.json$/.test(f));
if (tanimsiz.length) console.log("Bilgi: tanınmayan dosyalar atlandı: " + tanimsiz.join(", "));
// Not: kaynak dosyalardaki teyitTaslaklari, mevcutSiniflandirma, _meta, kural, motorEslemesi gibi alanlar sayfalara taşınmaz.

const notlar = (oku("mezun-notlari.json") || {}).notlar || {};
const ids = {};
const veriler = {};
const dizin = [];

for (const mu of META.ulkeler) {
  const cc = mu.kod;
  const L = oku("lisans-" + cc + ".json"), Y = oku("yl-" + cc + ".json"), U = oku("uni-" + cc + ".json");
  [["lisans", L], ["yl", Y], ["uni", U]].forEach(([t, x]) => { if (x && x.ulke && x.ulke !== cc) sorunlar.push(t + "-" + cc + ".json: ulke alanı '" + x.ulke + "' dosya adıyla uyuşmuyor"); });
  const v = { ulke: cc, ad: mu.ad, yerelDil: yerelDilNorm((L && L.yerelDil) || (Y && Y.yerelDil), mu), sonKontrol: null, rozet: null };
  if (L) {
    v.lisans = {
      ozet: L.ozet || "", ortak: arr(L.ortak), en: dilBlok(L.en), yerel: dilBlok(L.yerel),
      sinifNotlari: isObj(L.sinifNotlari) ? L.sinifNotlari : {}, apEtkisi: arr(L.apEtkisi), burslar: arr(L.burslar), uyarilar: arr(L.uyarilar)
    };
  }
  if (Y) {
    v.yl = {
      ozet: Y.ozet || "", ortak: arr(Y.ortak), en: dilBlok(Y.en), yerel: dilBlok(Y.yerel),
      burslar: arr(Y.burslar), uyarilar: arr(Y.uyarilar), ornekProgramlar: arr(Y.ornekProgramlar)
    };
  }
  if (U) v.universiteler = { siralama: U.siralama || null, qsToplam: U.qsToplam != null ? U.qsToplam : null, kural: U.kural || null, liste: arr(U.universiteler || U.liste).map(uniNorm) };
  // Rozet: meta (PM kararı) önce gelir; meta'da alan yoksa kaynak dosyadaki rozet
  v.rozet = Object.prototype.hasOwnProperty.call(mu, "rozet") ? (mu.rozet || null) : ((L && L.rozet) || (Y && Y.rozet) || null);
  v.sonKontrol = enGec(L && L.sonKontrol, Y && Y.sonKontrol, U && U.sonKontrol);
  const var_ = !!(L || Y || U);
  if (var_) {
    uyar("ulke/" + cc + ".js", M.ulkeVeriDogrula(v, ids));
    veriler[cc] = v;
  }
  const liste = U ? v.universiteler.liste : [];
  const durum = (duzey, dil, kaynak) => {
    const t = M.programDurumuTuret(liste, duzey, dil);
    if (t !== "veri-yok") return t;
    const o = kaynak && isObj(kaynak.programDurumu) ? kaynak.programDurumu[dil] : null;
    return M.PROGRAM_DURUM[o] ? o : "veri-yok";
  };
  const ie = v.yerelDil.every(d => d === "en");
  const program = {
    lisans: { en: durum("lisans", "en", L), yerel: ie ? durum("lisans", "en", L) : durum("lisans", "yerel", L) },
    yl: { en: durum("yl", "en", Y), yerel: ie ? durum("yl", "en", Y) : durum("yl", "yerel", Y) }
  };
  const mn = isObj(notlar[cc]) ? notlar[cc] : null;
  const ou = ozetUyariTopla([L, Y, U], cc);
  if (mn) uyar("mezun-notlari.json " + cc, M.maddeDogrula(Object.assign({ kesinlik: "Doğrulandı" }, mn)).filter(x => !/kesinlik/.test(x)));
  dizin.push({
    kod: cc, ad: mu.ad, bulunma: mu.bulunma, yerelDil: v.yerelDil,
    yerelDilAd: v.yerelDil.map(d => (META.dilAd || {})[d] || d).join(" / "),
    grup: mu.grup, rozet: v.rozet, portal: mu.portal || null,
    ozet: (L && L.ozet) || "", ylOzet: (Y && Y.ozet) || "",
    program,
    tarihliRota: { lisans: cc === "de" || cc === "it", yl: false },
    veri: { lisans: L ? maddeSay(v.lisans) : 0, yl: Y ? maddeSay(v.yl) : 0, uni: liste.length, dosya: var_ },
    siralama: U && U.siralama ? U.siralama : null,
    ozetUyari: ou,
    mezunNotu: mn,
    sonKontrol: v.sonKontrol
  });
}

const DIZIN = { surum: META.surum, uretim: "araclar/ulke-veri-olustur.js", dilAd: META.dilAd || {}, ulkeler: dizin, genelAdimlar: arr(META.genelAdimlar) };
DIZIN.sonKontrol = enGec(...dizin.map(d => d.sonKontrol));
uyar("ulke-dizini.js", M.dizinDogrula(DIZIN));

const YG = oku("yl-genel.json");
const YL_GENEL = YG ? {
  surum: YG.surum || "1.0.0", sonKontrol: YG.sonKontrol || null,
  belgeler: arr(YG.belgeler), turkiyeBurslari: arr(YG.turkiyeBurslari), abBurslari: arr(YG.abBurslari),
  askerlik: arr(YG.askerlik), takvim: arr(YG.takvim), gre: arr(YG.gre), dilSinavlari: arr(YG.dilSinavlari).map(sinavMadde)
} : null;
if (YL_GENEL && !YL_GENEL.sonKontrol && isObj(YG._meta)) YL_GENEL.sonKontrol = YG._meta.sonKontrol || YG._meta.erisim || null;
if (YL_GENEL) uyar("yl-genel.js", M.ylGenelDogrula(YL_GENEL));
const DY = oku("duyurular.json");
const DUYURULAR = DY ? arr(DY.duyurular || DY) : [];
uyar("duyurular.js", M.duyuruDogrula(DUYURULAR));

// ---------------- Rapor ----------------
console.log("Kaynak: " + path.relative(ROOT, KAYNAK));
dizin.forEach(d => console.log(
  "  " + d.kod + " " + d.ad.padEnd(11) + " lisans " + String(d.veri.lisans).padStart(3) + " · yl " + String(d.veri.yl).padStart(3) + " · ilk20 " + String(d.veri.uni).padStart(2) +
  " · EN lisans " + d.program.lisans.en + " · EN YL " + d.program.yl.en + (d.rozet ? " · [" + d.rozet + "]" : "")));
const toplam = dizin.reduce((n, d) => n + d.veri.lisans + d.veri.yl, 0);
console.log("Toplam madde: " + toplam + " (ülke dosyaları) + yl-genel " + (YL_GENEL ? maddeSay(YL_GENEL) : 0) + " + duyuru " + DUYURULAR.length + " · ülke dosyası: " + Object.keys(veriler).length + "/15");
if (sorunlar.length) {
  console.log("\nŞEMA SORUNLARI (" + sorunlar.length + "):");
  sorunlar.slice(0, 60).forEach(s => console.log("  - " + s));
  if (sorunlar.length > 60) console.log("  … " + (sorunlar.length - 60) + " sorun daha");
  console.log("\nDosya yazılmadı.");
  process.exit(1);
}
if (KONTROL) { console.log("\n--kontrol: 0 sorun, dosya yazılmadı."); process.exit(0); }

// ---------------- Yazım ----------------
const BASLIK = "// ÜRETİLEN DOSYA — elle düzenlemeyin. Kaynak: data/mevzuat/kaynak/*.json · Üretici: node araclar/ulke-veri-olustur.js\n" +
  "// Meberra Tur 11 (kararlar D6/D8). Şema: .agents/rules/tur11-ekran-plani.md §5\n";
const js = v => JSON.stringify(v, null, 1);
fs.mkdirSync(path.join(CIKTI, "ulke"), { recursive: true });
fs.writeFileSync(path.join(CIKTI, "ulke-dizini.js"), BASLIK + "window.APMEBERRA_ULKE_DIZINI = " + js(DIZIN) + ";\n", "utf8");
for (const [cc, v] of Object.entries(veriler)) {
  fs.writeFileSync(path.join(CIKTI, "ulke", cc + ".js"), BASLIK + "(window.APMEBERRA_ULKE_VERI = window.APMEBERRA_ULKE_VERI || {})[\"" + cc + "\"] = " + js(v) + ";\n", "utf8");
}
// Kaynağı kalkan ülke dosyalarını sil (klasör tamamen üretilir)
fs.readdirSync(path.join(CIKTI, "ulke")).forEach(f => { const m = /^([a-z]{2})\.js$/.exec(f); if (m && !veriler[m[1]]) fs.unlinkSync(path.join(CIKTI, "ulke", f)); });
fs.writeFileSync(path.join(CIKTI, "yl-genel.js"), BASLIK + "window.APMEBERRA_YL_GENEL = " + js(YL_GENEL) + ";\n", "utf8");
fs.writeFileSync(path.join(CIKTI, "duyurular.js"), BASLIK + "window.APMEBERRA_DUYURULAR = " + js(DUYURULAR) + ";\n", "utf8");
console.log("\nYazıldı: ulke-dizini.js, ulke/{" + Object.keys(veriler).join(",") + "}.js, yl-genel.js, duyurular.js · 0 sorun");
