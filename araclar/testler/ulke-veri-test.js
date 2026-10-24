// Tur 11 (D6/D8) — ülke verisi testi (tarayıcı gerekmez). Çalıştır (proje klasöründen): node araclar/testler/ulke-veri-test.js
// Kapsam: üretici şema denetimi, üretilen dosyaların güncelliği, sartlar.js (74) + mezun-ulkeler.js (26) taşıma eşdeğerliği,
// dizin (15 ülke), tekil id, kaynak URL'leri, program durumu türetme kuralı, Ajan 13 çıktıları (varsa) için --kontrol.
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..", "..");
const M = require(path.join(ROOT, "assets", "js", "sartlar-motor.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x).slice(0, 400))); c ? pass++ : fail++; };
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function yukle(dosyalar) {
  global.window = {};
  dosyalar.forEach(d => { const f = path.join(ROOT, d); delete require.cache[require.resolve(f)]; require(f); });
  const w = global.window; delete global.window; return w;
}
const uret = argv => { try { return { kod: 0, cikti: execFileSync(process.execPath, [path.join(ROOT, "araclar", "ulke-veri-olustur.js")].concat(argv), { encoding: "utf8" }) }; } catch (e) { return { kod: e.status, cikti: String(e.stdout || "") + String(e.stderr || "") }; } };

// 1) Üretici: 0 sorun ve üretilen dosyalar güncel
const k = uret(["--kontrol"]);
ok(k.kod === 0 && /0 sorun/.test(k.cikti), "üretici --kontrol: 0 sorun", k.cikti.split("\n").slice(-6).join(" | "));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ulke-veri-"));
const u = uret(["--cikti", tmp]);
ok(u.kod === 0, "üretici geçici klasöre yazdı");
const MEV = path.join(ROOT, "data", "mevzuat");
const karsilastir = ad => fs.existsSync(path.join(MEV, ad)) && fs.readFileSync(path.join(tmp, ad), "utf8") === fs.readFileSync(path.join(MEV, ad), "utf8");
const ulkeDosyalari = fs.readdirSync(path.join(tmp, "ulke")).sort();
ok(["ulke-dizini.js", "yl-genel.js", "duyurular.js"].every(karsilastir) && ulkeDosyalari.every(f => karsilastir("ulke/" + f)) &&
  esit(fs.readdirSync(path.join(MEV, "ulke")).sort(), ulkeDosyalari), "data/mevzuat üretilmiş dosyaları kaynakla güncel (" + ulkeDosyalari.join(", ") + ")");
fs.rmSync(tmp, { recursive: true, force: true });

// 2) Yeni veri dosyaları
const W = yukle(["data/mevzuat/ulke-dizini.js", "data/mevzuat/duyurular.js", "data/mevzuat/yl-genel.js"].concat(fs.readdirSync(path.join(MEV, "ulke")).filter(f => /^[a-z]{2}.js$/.test(f)).map(f => "data/mevzuat/ulke/" + f)));
const D = W.APMEBERRA_ULKE_DIZINI, V = W.APMEBERRA_ULKE_VERI || {}, DUY = W.APMEBERRA_DUYURULAR;
ok(M.dizinDogrula(D).length === 0, "ulke-dizini.js şeması", M.dizinDogrula(D));
ok(esit(D.ulkeler.map(x => x.kod), M.ULKE_KODLARI), "dizin 15 ülke, motor ile aynı sırada");
ok(D.ulkeler.filter(x => x.grup === "ana").map(x => x.kod).join() === "de,it", "ana grup: de, it (tarihli rota)");
ok(D.ulkeler.every(x => esit(x.tarihliRota, { lisans: x.kod === "de" || x.kod === "it", yl: false })), "tarihliRota yalnızca de/it lisans");
const ie = D.ulkeler.find(x => x.kod === "ie");
ok(esit(ie.yerelDil, ["en"]) && M.yalnizIngilizce("ie", ie) && D.ulkeler.filter(x => M.yalnizIngilizce(x.kod, x)).length === 1, "İrlanda: yerel dil İngilizce (tek ülke)");
ok(["ch", "be", "fi"].every(c => D.ulkeler.find(x => x.kod === c).yerelDil.length > 1), "İsviçre, Belçika, Finlandiya: birden çok yerel dil");
ok(Array.isArray(D.genelAdimlar) && D.genelAdimlar.length >= 6 && D.genelAdimlar.every(s => !s.kaynak && !s.kesinlik), "genel yol haritası şablonu: " + D.genelAdimlar.length + " adım, mevzuat iddiası (kaynak/kesinlik) yok");
const ids = {};
let maddeSay = 0, urlHata = [];
Object.keys(V).forEach(cc => {
  const s = M.ulkeVeriDogrula(V[cc], ids);
  ok(s.length === 0, "ulke/" + cc + ".js şeması", s);
  (function gez(o) { if (Array.isArray(o)) o.forEach(gez); else if (o && typeof o === "object") { if (typeof o.metin === "string" && Array.isArray(o.kaynak)) { maddeSay++; o.kaynak.forEach(k => { if (!/^https?:\/\//.test(k.url)) urlHata.push(o.id); }); } else Object.values(o).forEach(gez); } })(V[cc]);
  const dk = D.ulkeler.find(x => x.kod === cc);
  const turet = (z, d) => M.programDurumuTuret(V[cc].universiteler ? V[cc].universiteler.liste : [], z, d);
  ok(["lisans", "yl"].every(z => ["en", "yerel"].every(d => turet(z, d) === "veri-yok" || dk.program[z][d] === turet(z, d))), cc + ": dizin program durumu ilk 20 listesinden türetildi");
});
ok(urlHata.length === 0, "tüm madde kaynakları http(s) (" + maddeSay + " madde)", urlHata);
ok(M.duyuruDogrula(DUY).length === 0 && DUY.length >= 1, "duyurular.js şeması (" + DUY.length + " duyuru)");

// 3) Taşıma eşdeğerliği: sartlar.js (74) + mezun-ulkeler.js (26) maddelerinin hepsi yeni veride (eski dosyalar silinmedi).
// PM aktarımından (araclar/mevzuat-aktar.js) sonra da geçerli: eski maddeler aynı id ile kalır; yalnızca dil alanı eklenebilir
// (Ajan 13 sınıflandırması) ve Ajan 13 maddeleri eklenir. Bu yüzden içerik dil alanı yok sayılarak, bölümler alt küme olarak denetlenir.
{
const E = yukle(["data/mevzuat/sartlar.js", "data/mevzuat/mezun-ulkeler.js"]);
const S = E.APMEBERRA_SARTLAR, MZ = E.APMEBERRA_MEZUN_ULKELER;
const eskiMaddeler = [];
["de", "it"].forEach(u => { S.ulkeler[u].ortak.forEach(m => eskiMaddeler.push(m)); Object.values(S.ulkeler[u].siniflar).forEach(sn => ["gerekenler", "buYil", "tarihler", "hatalar"].forEach(a => sn[a].forEach(m => eskiMaddeler.push(m)))); });
const sartlarSay = eskiMaddeler.length;
["hu", "pl"].forEach(u => ["ortak", "buYil", "tarihler", "hatalar"].forEach(a => MZ.ulkeler[u][a].forEach(m => eskiMaddeler.push(m))));
MZ.duyurular.forEach(m => eskiMaddeler.push(m));
const yeniId = {};
(function gez(o) { if (Array.isArray(o)) o.forEach(gez); else if (o && typeof o === "object") { if (typeof o.metin === "string" && o.id) yeniId[o.id] = o; else Object.values(o).forEach(gez); } })([V, DUY]);
const eksik = eskiMaddeler.filter(m => !m.id || !yeniId[m.id]);
// 1.23.0: kaynak bağlantıları URL ile karşılaştırılır; görünen ad kısaltılabilir (9107493: anabin adlarından "TUR-BV…" eki kaldırıldı)
const kaynakUrl = k => Array.isArray(k) ? k.map(x => x && x.url) : k;
const degisti = (y, m) => !esit(Object.assign({}, y, { hedef: undefined, bitis: m.bitis, dil: undefined, kaynak: kaynakUrl(y.kaynak) }), Object.assign({}, m, { hedef: undefined, dil: undefined, kaynak: kaynakUrl(m.kaynak) }));
// PM bir maddeyi güncellediyse sonKontrol ilerler: bu "güncellendi" sayılır; tarih aynıyken içerik değişmişse hata
const guncel = eskiMaddeler.filter(m => m.id && yeniId[m.id] && degisti(yeniId[m.id], m) && yeniId[m.id].sonKontrol > m.sonKontrol);
const farkli = eskiMaddeler.filter(m => m.id && yeniId[m.id] && degisti(yeniId[m.id], m) && !(yeniId[m.id].sonKontrol > m.sonKontrol));
if (guncel.length) console.log("INFO PM tarafından güncellenen eski maddeler (sonKontrol ilerledi): " + guncel.map(m => m.id).join(", "));
const dilli = eskiMaddeler.filter(m => m.id && yeniId[m.id] && yeniId[m.id].dil).length;
if (dilli) console.log("INFO eski maddelerden " + dilli + " tanesine dil alanı eklenmiş (Ajan 13 sınıflandırması)");
ok(sartlarSay === 74 && eskiMaddeler.length === 100, "eski veri: sartlar.js " + sartlarSay + " + mezun-ulkeler.js " + (eskiMaddeler.length - sartlarSay) + " = " + eskiMaddeler.length + " madde");
ok(eksik.length === 0 && farkli.length === 0, "taşıma: 100 maddenin tamamı yeni dosyalarda; içerik (dil alanı hariç) birebir ya da sonKontrol ilerletilerek güncellenmiş", { eksik: eksik.map(m => m.id), farkli: farkli.map(m => m.id) });
// Bölüm eşdeğerliği: eski motorun (bolumler / mezunBolumler) verdiği her madde yeni motorda (ulkeBolumleri, İngilizce) aynı bölümde
const idler = l => l.map(m => m.id || m.metin.slice(0, 30));
const altKume = (a, b) => idler(a).every(x => idler(b).indexOf(x) >= 0);
let esd = true;
["de", "it"].forEach(u => ["9", "10", "11", "12", "mezun"].forEach(s => {
  const eski = M.bolumler(S, u, s);
  const yeni = M.ulkeBolumleri(V[u], s === "mezun" ? { model: "lise-mezun", ulke: u, dil: "en" } : { model: "lise", sinif: s, ulke: u, dil: "en" });
  ["gerekenler", "buYil", "tarihler", "hatalar"].forEach(b => { if (!altKume(eski[b], yeni[b])) { esd = false; console.log("  fark " + u + "/" + s + "/" + b); } });
}));
ok(esd, "de/it × 9–12, mezun: eski bolumler() maddelerinin tümü ulkeBolumleri() içinde aynı bölümde");
// PM notu 2: Almanca (yerel) seçilince "en" maddeleri düşer, yerel maddeler gelir; ortak maddeler iki dilde de kalır
{
  const s = { model: "lise", sinif: "11", ulke: "de" };
  const en = M.ulkeBolumleri(V.de, Object.assign({ dil: "en" }, s)), yr = M.ulkeBolumleri(V.de, Object.assign({ dil: "yerel" }, s));
  const tum = b => ["gerekenler", "buYil", "tarihler", "hatalar", "apEtkisi", "burslar"].reduce((l, k) => l.concat(b[k]), []);
  const enIds = tum(en).map(m => m.id), yrIds = tum(yr).map(m => m.id);
  const enDilli = tum(en).filter(m => m.dil === "en").length, yerelDilli = tum(yr).filter(m => m.dil === "yerel").length;
  // Dil iki yoldan gelir: madde.dil alanı ya da bulunduğu blok (lisans.en / lisans.yerel). Ortak = lisans.ortak içinde dil alanı olmayanlar
  const ortak = V.de.lisans.ortak.filter(m => !m.dil).map(m => m.id);
  const enBlok = ["gerekenler", "tarihler", "hatalar"].reduce((l, k) => l.concat(V.de.lisans.en[k] || []), []).map(m => m.id);
  ok(enDilli > 0 && yerelDilli > 0 && !tum(yr).some(m => m.dil === "en") && !tum(en).some(m => m.dil === "yerel") && ortak.every(id => yrIds.indexOf(id) >= 0 && enIds.indexOf(id) >= 0) && !enBlok.some(id => yrIds.indexOf(id) >= 0),
    "de/11 dil süzgeci: İngilizce " + enIds.length + " madde, Almanca " + yrIds.length + " madde; en alanlı ve en bloğundaki maddeler Almancada yok, " + ortak.length + " ortak madde ikisinde");
  const eskiDe11 = M.bolumler(S, "de", "11"), eskiTum = ["gerekenler", "buYil", "tarihler", "hatalar"].reduce((l, k) => l.concat(eskiDe11[k]), []).map(m => m.id);
  ok(eskiTum.every(id => enIds.indexOf(id) >= 0), "lise·11·de·en: Tur 10 içeriğinin tamamı (" + eskiTum.length + " madde) görünür");
}
let esd2 = true;
["hu", "pl"].forEach(u => {
  const eski = M.mezunBolumler(MZ, u), yeni = M.ulkeBolumleri(V[u], { model: "lise-mezun", ulke: u, dil: "en" });
  ["gerekenler", "buYil", "tarihler", "hatalar"].forEach(b => { if (!altKume(eski[b], yeni[b])) { esd2 = false; console.log("  fark " + u + "/" + b); } });
});
ok(esd2, "hu/pl lise mezunu: Mezun Menüsü maddelerinin tümü aynı bölümde");
const rozetler = D.ulkeler.filter(x => x.rozet).map(x => x.kod + ":" + x.rozet).join(",");
ok(rozetler === "dk:Teyit gerekir,ie:Teyit gerekir" && !V.pl.rozet, "ülke rozetleri meta'dan (PM kararı): yalnız dk ve ie \"Teyit gerekir\", pl rozetsiz", rozetler);
const notDegisen = MZ.digerleri.filter(d => { const x = D.ulkeler.find(u => u.ad === d.ad); return x && x.mezunNotu && x.mezunNotu.metin !== d.neden; }).map(d => d.ad);
if (notDegisen.length) console.log("INFO PM tarafından düzeltilen ön değerlendirme notları: " + notDegisen.join(", "));
ok(MZ.digerleri.every(d => D.ulkeler.some(x => x.ad === d.ad && x.mezunNotu && x.mezunNotu.metin && x.mezunNotu.kaynak.length)), "menüye alınmayan 9 ülkenin değerlendirmesi dizinde mezunNotu olarak duruyor (kaynaklı)");
ok(M.duyuruSuz(DUY, { model: "lise-mezun", ulke: "hu", dil: "en" }, "2026-11-15").length === 1 && M.duyuruSuz(DUY, { model: "lise-mezun", ulke: "hu", dil: "en" }, "2026-11-16").length === 0 &&
  M.duyuruSuz(DUY, { model: "lise", ulke: "hu", dil: "en" }, "2026-10-15").length === 0 && M.duyuruSuz(DUY, { model: "lise-mezun", ulke: "de", dil: "en" }, "2026-10-15").length === 0 &&
  M.duyuruSuz(DUY, { model: "lise-mezun" }, "2026-10-15").length === 1, "BME duyurusu: yalnızca lise mezunu + Macaristan (Panelim'de ülke süzülmez), 15 Kasım dahil");
}

// 4) Ajan 13 çıktıları (varsa): üretici biçimiyle doğrulanır, kaynak/ klasörüne YAZILMAZ
const DOG = path.join(ROOT, ".agents", "mevzuat", "dogrulama");
const ajan = fs.existsSync(DOG) ? fs.readdirSync(DOG).filter(f => /^(lisans|yl|uni)-[a-z]{2}\.json$|^yl-genel\.json$/.test(f)) : [];
if (ajan.length) {
  const r = uret(["--kontrol", "--kaynak", DOG]);
  ok(r.kod === 0, "Ajan 13 çıktıları (" + ajan.length + " dosya) üretici şemasına uygun", r.cikti.split("\n").filter(x => /^\s+-/.test(x)).slice(0, 10));
  // PM K-A: eşleme üreticide; üretilen dosyada kısıtlı/Doğrulanamadı hücre değeri kalmaz, kaynak JSON değişmez
  const t2 = fs.mkdtempSync(path.join(os.tmpdir(), "ulke-ajan-"));
  const r2 = uret(["--kaynak", DOG, "--cikti", t2]);
  global.window = {};
  fs.readdirSync(path.join(t2, "ulke")).forEach(f => require(path.join(t2, "ulke", f)));
  require(path.join(t2, "ulke-dizini.js"));
  const W2 = global.window; delete global.window;
  const hucreler = [];
  Object.values(W2.APMEBERRA_ULKE_VERI || {}).forEach(v => ((v.universiteler || {}).liste || []).forEach(u => ["lisans", "yuksekLisans"].forEach(a => ["en", "yerel"].forEach(d => { if (u[a] && u[a][d] != null) hucreler.push(u[a][d]); }))));
  const hamDeger = fs.readdirSync(DOG).filter(f => /^uni-/.test(f)).some(f => /"kısıtlı"|"Doğrulanamadı"/.test(fs.readFileSync(path.join(DOG, f), "utf8")));
  ok(r2.kod === 0 && hucreler.length > 0 && hucreler.every(h => ["var", "kismi", "yok", "teyit"].indexOf(h) >= 0) && hamDeger, "K-A: " + hucreler.length + " hücre var|kismi|yok|teyit olarak üretildi; kaynak JSON'larda ham değerler duruyor");
  const teyitHucre = hucreler.filter(h => h === "teyit").length;
  const teyitli = Object.values(W2.APMEBERRA_ULKE_VERI || {}).reduce((n, v) => n + [["lisans", "en"], ["lisans", "yerel"], ["yl", "en"], ["yl", "yerel"]].reduce((k, z) => {
    const r = M.universiteSuz((v.universiteler || {}).liste, { duzey: z[0], dil: z[1] });
    return k + (r.liste.slice(r.eslesen).every(u => u._teyit) ? r.teyit : -999);
  }, 0), 0);
  // v14.1: Tur 14 ilk-20 düzeltmeleriyle Doğrulanamadı hücresi 0'a indi; kural (varsa sonda, gizlenmeden) eşitlikle sınanır.
  ok(teyitHucre >= 0 && teyitli === teyitHucre, "K-B: " + teyitHucre + " Doğrulanamadı hücresinin tamamı dil süzgecinde gizlenmeden, listenin sonunda (" + teyitli + ")");
  ok(W2.APMEBERRA_ULKE_DIZINI.ulkeler.filter(x => x.siralama).length > 0 && W2.APMEBERRA_ULKE_DIZINI.ulkeler.filter(x => x.siralama).every(x => /2027/.test(x.siralama.ad) && /^https:\/\/www\.topuniversities\.com\//.test(x.siralama.url)), "siralama alanları üretilen dizine taşındı (QS WUR 2027)");
  fs.rmSync(t2, { recursive: true, force: true });
} else console.log("INFO .agents/mevzuat/dogrulama altında henüz lisans/yl/uni JSON yok; Ajan 13 çıktısı denetimi atlandı.");

console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
process.exit(fail ? 1 : 0);
