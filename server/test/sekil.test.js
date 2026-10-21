"use strict";
// v1.13.0 şekilli sorular: SVG beyaz liste temizleyicisi (server/sekil.js) — XSS vektörleri, izinli içeriğin korunması, boyut sınırları;
// saklama yolları (tohum yükleme/yükseltme, yönetici POST/PUT, FRQ) ve gizlilik: konum "aciklama" şekli yalnız cevaptan / teslimden sonra.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const S = require("../sekil");
const { olustur } = require("../uygulama");
const dbM = require("../db");
const sb = require("../sorubankasi");
const frqM = require("../frq");

const FIXTURE = path.join(__dirname, "fixture", "sekil-tohum.json");
const temiz = s => S.temizle(s);
const sv = ic => '<svg viewBox="0 0 100 80">' + ic + "</svg>";

// ---------------------------------------------------------------------------------------------- temizleyici
test("XSS: <script>, olay öznitelikleri, javascript: href, foreignObject, image, use, style atılır", () => {
  const vektorler = [
    [sv("<script>alert(1)</script><line x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"/>"), /script|alert/i],
    ['<svg viewBox="0 0 10 10" onload="alert(1)"><circle cx="1" cy="1" r="1" onclick="x()" onmouseover="y()"/></svg>', /on(load|click|mouseover)|alert/i],
    [sv('<a href="javascript:alert(1)"><text x="1" y="1">t</text></a>'), /javascript|<a\b|href/i],
    [sv('<path d="M0 0L1 1" href="javascript:alert(1)" xlink:href="javascript:alert(2)"/>'), /javascript|href/i],
    [sv('<foreignObject width="10" height="10"><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></div></foreignObject>'), /foreignObject|img|onerror/i],
    [sv('<image href="https://evil.example/x.png" width="10" height="10"/>'), /image|evil/i],
    [sv('<use href="https://evil.example/s.svg#a"/><use xlink:href="#a"/>'), /<use|evil/i],
    [sv("<style>@import url(https://evil.example/a.css); *{fill:red}</style>"), /style|import|evil/i],
    [sv('<rect width="5" height="5" style="background:url(javascript:alert(1))"/>'), /style|javascript/i],
    [sv('<rect width="5" height="5" fill="url(https://evil.example/p#g)"/>'), /evil|url\(/i],
    [sv('<rect width="5" height="5" fill="&#x75;rl(javascript:alert(1))"/>'), /javascript|url\(/i],
    [sv('<SCRIPT>alert(1)</SCRIPT><svg:script>alert(2)</svg:script>'), /script|alert/i],
    [sv('<svg viewBox="0 0 5 5"><script>alert(1)</script></svg><g/>'), /<svg[^>]*><svg|script|alert/i],
    [sv('<text x="1" y="1"><script>alert(1)</script>ok</text>'), /<script|alert/i],
    [sv('<g class=\'sk-vurgu" onload="alert(1)\'><circle cx="1" cy="1" r="1"/></g>'), /onload|alert/i],
    [sv('<animate attributeName="href" to="javascript:alert(1)"/><set attributeName="onload" to="alert(1)"/>'), /animate|set|javascript/i],
    [sv('<a xlink:href="data:text/html,<script>"><text>x</text></a>'), null] // < öznitelik değerinde → bozuk, reddedilir
  ];
  // Kaçışlı metin metin olarak kalır (etiket olmaz), yeniden kaçışlanır
  assert.equal(temiz(sv('<text x="1" y="1">&lt;script&gt;alert(1)&lt;/script&gt;</text>')).svg, sv('<text x="1" y="1">&lt;script&gt;alert(1)&lt;/script&gt;</text>'));
  for (const [g, yasak] of vektorler) {
    const r = temiz(g);
    if (yasak === null) { assert.equal(r.ok, false, g); continue; }
    if (!r.ok) continue; // reddetmek de güvenli
    assert.doesNotMatch(r.svg, yasak, g + " → " + r.svg);
    assert.ok(r.kaldirilan.length > 0, "atılan bildirilmeli: " + g);
    // Çıktı yeniden temizlenince değişmez (kararlı) ve hiçbir şey atılmaz
    const r2 = temiz(r.svg);
    assert.equal(r2.svg, r.svg); assert.deepEqual(r2.kaldirilan, []);
  }
});

test("bozuk / tehlikeli yapı reddedilir: DOCTYPE/ENTITY, CDATA, işlem talimatı, bilinmeyen varlık, tırnaksız/yinelenen öznitelik, kapanmamış etiket", () => {
  const red = [
    '<!DOCTYPE svg [<!ENTITY x "&#60;script&#62;">]><svg viewBox="0 0 10 10"><text>&x;</text></svg>',
    sv("<text><![CDATA[<script>alert(1)</script>]]></text>"),
    sv('<?xml-stylesheet href="evil.css"?>'),
    sv("<text>&nbsp;</text>"),
    sv("<text>a & b</text>"),
    sv("<g x=1></g>"),
    sv('<g id="a" id="b"></g>'),
    sv('<g id></g>'),
    sv("<g><path d=\"M0 0\"></g>"),
    sv("</g>"),
    '<svg viewBox="0 0 10 10">',
    '<div><svg viewBox="0 0 10 10"></svg></div>',
    '<svg viewBox="0 0 10 10"></svg><svg viewBox="0 0 10 10"></svg>',
    sv("<text>&#0;</text>"),
    sv("<!-- a -- b -->"),
    "<svg viewBox=\"0 0 10 10\"><text>\u0001</text></svg>",
    null, 42, ""
  ];
  for (const g of red) { const r = temiz(g); assert.equal(r.ok, false, String(g)); assert.ok(r.hata); assert.equal(r.svg, ""); }
});

test("boyut sınırları: viewBox zorunlu ve ≤ 480×360; ≤ 30 KB; kökte width/height atılır", () => {
  assert.equal(temiz('<svg><g/></svg>').ok, false);
  assert.equal(temiz('<svg viewBox="0 0 481 100"></svg>').ok, false);
  assert.equal(temiz('<svg viewBox="0 0 100 361"></svg>').ok, false);
  assert.equal(temiz('<svg viewBox="0 0 0 100"></svg>').ok, false);
  assert.equal(temiz('<svg viewBox="0 0 abc 100"></svg>').ok, false);
  assert.equal(temiz('<svg viewBox="0 0 480 360"></svg>').ok, true);
  assert.deepEqual(temiz('<svg viewBox="-10 -5 480 360"></svg>').viewBox, { x: -10, y: -5, w: 480, h: 360 });
  const buyuk = sv('<path d="' + "M0 0L1 1 ".repeat(3500) + '"/>');
  assert.ok(Buffer.byteLength(buyuk) > 30 * 1024);
  assert.equal(temiz(buyuk).ok, false);
  assert.match(temiz(buyuk).hata, /30 KB/);
  const r = temiz('<svg viewBox="0 0 100 80" width="800" height="600"><rect x="1" y="1" width="10" height="5"/></svg>');
  assert.equal(r.svg, '<svg viewBox="0 0 100 80"><rect x="1" y="1" width="10" height="5"/></svg>');
  assert.ok(r.kaldirilan.some(m => /width/.test(m)));
  // çok derin iç içe öğe
  assert.equal(temiz(sv("<g>".repeat(40) + "</g>".repeat(40))).ok, false);
});

test("izinli içerik birebir korunur (etiketler, öznitelikler, marker, metin, sk- sınıfları); uyarılar: sabit renk, font-size, sk- dışı sınıf", () => {
  const g = '<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" role="img"><title>Graph of f</title><desc>Line</desc>' +
    '<defs><marker id="ok" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>' +
    '<g class="sk-izgara" stroke="currentColor" stroke-width="0.5"><line x1="0" y1="10" x2="320" y2="10"/></g>' +
    '<line x1="20" y1="200" x2="300" y2="200" class="sk-eksen" stroke="currentColor" marker-end="url(#ok)"/>' +
    '<polyline points="20,200 100,120 180,160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 2"/>' +
    '<polygon points="1,1 5,1 3,4" class="sk-dolgu" opacity="0.5" fill-opacity="0.4"/><circle cx="100" cy="120" r="3" class="sk-vurgu sk-nokta"/>' +
    '<ellipse cx="50" cy="50" rx="4" ry="2" transform="rotate(30 50 50) translate(1,2)"/><rect x="1" y="1" width="5" height="5" rx="1" ry="1"/>' +
    '<text x="160" y="215" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="hanging" class="sk-ikincil">x <tspan x="170" y="215">&lt;2 &amp; f′(x)</tspan></text></svg>';
  const r = temiz(g);
  assert.equal(r.ok, true, r.hata);
  assert.deepEqual(r.kaldirilan, []);
  assert.deepEqual(r.uyarilar, []);
  assert.equal(r.svg, g);
  // biçimlendirme boşlukları ve yorumlar: içerik aynı kalır (yorum atılır ve bildirilir)
  const r2 = temiz('<svg viewBox="0 0 10 10">\n  <!-- not -->\n  <line x1="0" y1="0" x2="1" y2="1"/>\n</svg>');
  assert.equal(r2.svg, '<svg viewBox="0 0 10 10"><line x1="0" y1="0" x2="1" y2="1"/></svg>');
  assert.ok(r2.kaldirilan.some(m => /yorum/.test(m)));
  // varlıklar çözülüp güvenli biçimde yeniden kaçışlanır
  assert.equal(temiz(sv('<text x="1" y="1">&#8242; &#x2032; &quot;a&apos;</text>')).svg, sv('<text x="1" y="1">′ ′ "a\'</text>'));
  const u = temiz(sv('<line x1="0" y1="0" x2="1" y2="1" stroke="#000" class="sk-vurgu kirmizi"/><text font-size="20">a</text>'));
  assert.ok(u.ok);
  assert.ok(u.uyarilar.some(m => /sabit renk/.test(m)));
  assert.ok(u.uyarilar.some(m => /font-size 20/.test(m)));
  assert.ok(u.kaldirilan.some(m => /kirmizi/.test(m)));
  assert.match(u.svg, /class="sk-vurgu"/);
});

test("sekil nesnesi: alt zorunlu, tur svg, konum govde|aciklama, şıkta konum yok, başlık düz metin; bilinmeyen alan atılır", () => {
  const svg = sv('<line x1="0" y1="0" x2="1" y2="1"/>');
  assert.ok(S.sekilDogrula({ tur: "svg", svg, alt: "" }).hatalar.some(m => /alt/.test(m)));
  assert.ok(S.sekilDogrula({ tur: "png", svg, alt: "a" }).hatalar.length);
  assert.ok(S.sekilDogrula({ tur: "svg", svg, alt: "a", konum: "yan" }).hatalar.length);
  assert.ok(S.sekilDogrula({ tur: "svg", svg, alt: "a", konum: "aciklama" }, { secenek: true }).hatalar.length);
  assert.ok(S.sekilDogrula({ tur: "svg", svg, alt: "a", baslik: "<b>x</b>" }).hatalar.length);
  assert.ok(S.sekilDogrula({ tur: "svg", svg, alt: "a<img>" }).hatalar.length);
  assert.ok(S.sekilDogrula("<svg/>").hatalar.length);
  const k = S.sekilDogrula({ tur: "svg", svg, alt: " Doğru. ", baslik: "Graph of f", ekstra: 1 });
  assert.deepEqual(k.sekil, { tur: "svg", svg, alt: "Doğru.", baslik: "Graph of f", konum: "govde" });
  assert.ok(k.kaldirilan.some(m => /ekstra/.test(m)));
  assert.deepEqual(S.sekilDogrula({ tur: "svg", svg, alt: "a" }, { secenek: true }).sekil, { tur: "svg", svg, alt: "a" });
  // kök: nesne → nesne, dizi → dizi (en çok 4)
  assert.equal(Array.isArray(S.sekilleriDogrula({ tur: "svg", svg, alt: "a" }).deger), false);
  assert.equal(S.sekilleriDogrula([{ tur: "svg", svg, alt: "a" }]).deger.length, 1);
  assert.ok(S.sekilleriDogrula(Array(5).fill({ tur: "svg", svg, alt: "a" })).hatalar.length);
  assert.equal(S.sekilleriDogrula(null).deger, null);
  // gizlilik yardımcıları
  const l = [{ tur: "svg", svg, alt: "g", konum: "govde" }, { tur: "svg", svg, alt: "c", konum: "aciklama" }];
  assert.deepEqual(S.govdeSekilleri(l).map(x => x.alt), ["g"]);
  assert.deepEqual(S.cozumSekilleri(l).map(x => x.alt), ["c"]);
  assert.ok(S.govdeSekilleri(l).every(x => !("konum" in x)));
});

// ---------------------------------------------------------------------------------------------- tohum yolları
test("tohum yükleme şekilleri temizler; aynı tohum yeniden sürüm üretmez; yükseltmede yeni şekil temizlenerek yazılır", () => {
  const db = dbM.ac(":memory:");
  const r = sb.tohumEsitle(db, FIXTURE);
  assert.equal(r.mod, "ilk"); assert.equal(r.eklenen, 2);
  const s1 = sb.satirCoz(db.prepare("SELECT * FROM questions_bank WHERE id = 'sekil_test_1'").get());
  assert.equal(s1.sekil.length, 2);
  assert.doesNotMatch(s1.sekil[0].svg, /script|onload|alert/);
  assert.equal(S.temizle(s1.sekil[0].svg).kaldirilan.length, 0);
  const s2 = sb.satirCoz(db.prepare("SELECT * FROM questions_bank WHERE id = 'sekil_test_2'").get());
  assert.equal(s2.sekil, null);
  assert.ok(s2.secenekler.every(o => o.sekil && o.sekil.alt));
  // idempotent upsert (ham tohumla karşılaştırma da temizlenmiş biçimle yapılır)
  const t = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  const u = sb.tohumUpsert(db, t.sorular, { guncelleyen: "test" });
  assert.equal(u.ayni, 2); assert.equal(u.guncellenen, 0);
  // yükseltme: geçersiz şekil atılır (soru yine yüklenir), değişen şekil yeni sürüm olur
  const klasor = fs.mkdtempSync(path.join(os.tmpdir(), "meberra-sekil-"));
  const f2 = path.join(klasor, "t.json");
  t.surum = 2;
  t.sorular[1].secenekler[0].sekil.svg = sv('<path d="M10 100 L90 10" stroke="currentColor" onclick="x()"/>');
  t.sorular[1].secenekler[1].sekil = { tur: "svg", svg: '<svg viewBox="0 0 999 999"></svg>', alt: "büyük" };
  fs.writeFileSync(f2, JSON.stringify(t));
  const uyarilar = [];
  const r2 = sb.tohumEsitle(db, f2, { bilgi() {}, uyari: (k, m) => uyarilar.push(m) });
  assert.equal(r2.guncellenen, 1);
  const s2b = sb.satirCoz(db.prepare("SELECT * FROM questions_bank WHERE id = 'sekil_test_2'").get());
  assert.doesNotMatch(s2b.secenekler[0].sekil.svg, /onclick/);
  assert.equal(s2b.secenekler[1].sekil, undefined);
  assert.ok(uyarilar.some(m => /sekil_test_2/.test(m)));
  db.close();
  try { fs.rmSync(klasor, { recursive: true, force: true }); } catch (e) { /* */ }
});

test("FRQ: dogrula şekli denetler (alt, değişmeden geçme), sekilTemizle kararlı; çözüm şekli yalnız teslimden sonraki biçimde", () => {
  const f = JSON.parse(JSON.stringify(JSON.parse(fs.readFileSync(frqM.TOHUM, "utf8")).frq[0]));
  assert.deepEqual(frqM.dogrula(f), []);
  f.sekil = { tur: "svg", svg: sv('<line x1="0" y1="0" x2="1" y2="1" onclick="x()"/>'), alt: "a" };
  assert.ok(frqM.dogrula(f).some(m => /değişerek/.test(m)));
  const t = frqM.sekilTemizle(f);
  assert.deepEqual(frqM.dogrula(t), []);
  f.parcalar[0].sekil = { tur: "svg", svg: sv(""), alt: "" };
  assert.ok(frqM.dogrula(f).some(m => /alt/.test(m)));
  f.parcalar[0].sekil = [{ tur: "svg", svg: sv("<g/>"), alt: "soru", konum: "govde" }, { tur: "svg", svg: sv("<g/>"), alt: "cozum", konum: "aciklama" }];
  const acik = frqM.sekilAlanlari({}, f.parcalar[0], false), tam = frqM.sekilAlanlari({}, f.parcalar[0], true);
  assert.deepEqual(acik.sekiller.map(x => x.alt), ["soru"]); assert.equal(acik.cozumSekiller, undefined);
  assert.deepEqual(tam.cozumSekiller.map(x => x.alt), ["cozum"]);
});

// ---------------------------------------------------------------------------------------------- uçlar (gizlilik + yönetici)
let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false, soruTohumDosyasi: FIXTURE });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));
function istemci() {
  let cerez = "";
  return async function iste(yontem, yol, govde) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde === undefined ? undefined : JSON.stringify(govde) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); if (m) cerez = m[1] ? "meberra_sid=" + m[1] : ""; }
    return { durum: r.status, govde: (r.headers.get("content-type") || "").includes("json") ? await r.json() : await r.text() };
  };
}
let sayac = 0;
async function ogrenci() {
  const c = istemci();
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: "sk" + (++sayac) + "@ornek.com", sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  const uid = app.db.prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  app.hesap.premiumVer(uid, "aylik", null, { kaynak: "elle" });
  return c;
}
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("skyon@ornek.com", "Yonetici-12345");
  yonC = istemci();
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "skyon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  return yonC;
}

test("gizlilik: konum \"aciklama\" şekli soru listesinde / getir'de yok, yalnız cevaptan sonra; şık şekilleri ve kök şekli listede", async () => {
  const c = await ogrenci();
  const l = await c("GET", "/api/sorular-bankasi/ap-calculus/sekil-test-quiz-container");
  assert.equal(l.durum, 200, JSON.stringify(l.govde));
  const ham = JSON.stringify(l.govde);
  assert.doesNotMatch(ham, /GIZLI_COZUM_SEKLI/);
  assert.doesNotMatch(ham, /"konum"/);
  const [q1, q2] = l.govde.kutular[0].sorular;
  assert.equal(q1.sekiller.length, 1); assert.equal(q1.sekiller[0].baslik, "Graph of f");
  assert.doesNotMatch(q1.sekiller[0].svg, /script|onload/);
  assert.ok(q2.options.every(o => o.sekil && o.sekil.svg.startsWith("<svg") && o.sekil.alt));
  const g = await c("POST", "/api/sorular-bankasi/getir", { anahtarlar: ["ap-calculus|sekil_test_1"] });
  assert.doesNotMatch(JSON.stringify(g.govde), /GIZLI_COZUM_SEKLI/);
  const v = await c("POST", "/api/sorular-bankasi/cevap", { soruId: "sekil_test_1", secim: "A" });
  assert.equal(v.durum, 200);
  assert.equal(v.govde.cozum.sekiller.length, 1);
  assert.match(v.govde.cozum.sekiller[0].svg, /GIZLI_COZUM_SEKLI/);
  // cevaplandıktan sonra liste çözümü (ve çözüm şeklini) içerir
  const l2 = await c("GET", "/api/sorular-bankasi/ap-calculus/sekil-test-quiz-container");
  assert.match(JSON.stringify(l2.govde.kutular[0].sorular[0].cozum), /GIZLI_COZUM_SEKLI/);
});

test("yönetici: önizleme ucu temizler/uyarır; POST/PUT şekli temizleyerek saklar, alt'sız / bozuk şekli 400 ile reddeder", async () => {
  const y = await yonetici();
  const on = await y("POST", "/api/admin/sekil/onizle", { sekil: { tur: "svg", alt: "a", svg: sv('<line x1="0" y1="0" x2="1" y2="1" stroke="#f00" onclick="x()"/><script>1</script>') } });
  assert.equal(on.durum, 200);
  assert.equal(on.govde.gecerli, true);
  assert.ok(on.govde.kaldirilan.length >= 2 && on.govde.uyarilar.length >= 1);
  assert.doesNotMatch(on.govde.sekil.svg, /onclick|script/);
  assert.equal((await istemci()("POST", "/api/admin/sekil/onizle", { sekil: {} })).durum >= 401, true);

  const temel = { tur: "ders", sayfa: "ap-calculus", kutu: "sekil-test-quiz-container", govde: "Which?", dogru: "A", zorluk: "easy", durum: "taslak", aciklama: "x", genel_hatirlatma: "y", konu: "k", kaynak: "Meberra original" };
  const sik = (i, alt) => ({ text: "", sekil: { tur: "svg", alt, svg: sv('<circle cx="' + (10 + i) + '" cy="10" r="3"/>') } });
  const r400 = await y("POST", "/api/admin/soru-bankasi/soru", Object.assign({}, temel, { secenekler: [sik(1, "a"), sik(2, "")], sekil: null }));
  assert.equal(r400.durum, 400); assert.ok(r400.govde.errors && r400.govde.errors.sekil_B, JSON.stringify(r400.govde));
  const rBoz = await y("POST", "/api/admin/soru-bankasi/soru", Object.assign({}, temel, { secenekler: [{ text: "1" }, { text: "2" }], sekil: { tur: "svg", alt: "a", svg: "<svg viewBox='0 0 9999 10'></svg>" } }));
  assert.equal(rBoz.durum, 400); assert.ok(rBoz.govde.errors.sekil);
  const r = await y("POST", "/api/admin/soru-bankasi/soru", Object.assign({}, temel, {
    secenekler: [sik(1, "a"), sik(2, "b"), sik(3, "c"), sik(4, "d")],
    sekil: { tur: "svg", alt: "kök", konum: "govde", svg: '<svg viewBox="0 0 100 80" onload="alert(1)"><rect width="5" height="5"/></svg>' } }));
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  const kayit = sb.satirCoz(app.db.prepare("SELECT * FROM questions_bank WHERE id = ?").get(r.govde.id));
  assert.doesNotMatch(kayit.sekil.svg, /onload/);
  assert.equal(kayit.secenekler.length, 4);
  assert.ok(kayit.secenekler.every(o => o.sekil && o.sekil.alt));
  // PUT: alan gönderilmezse şekil korunur; null → kaldırılır
  const tam = (await y("GET", "/api/admin/soru-bankasi/soru/" + r.govde.id)).govde.soru;
  const put1 = await y("PUT", "/api/admin/soru-bankasi/soru/" + tam.id, Object.assign({}, temel, { surum: tam.surum, secenekler: tam.secenekler, govde: "Which one?" }));
  assert.equal(put1.durum, 200, JSON.stringify(put1.govde));
  assert.ok(put1.govde.soru.sekil && put1.govde.soru.sekil.alt === "kök");
  const put2 = await y("PUT", "/api/admin/soru-bankasi/soru/" + tam.id, Object.assign({}, temel, { surum: put1.govde.surum, secenekler: tam.secenekler, govde: "Which one?", sekil: null }));
  assert.equal(put2.durum, 200);
  assert.equal(put2.govde.soru.sekil, null);
  assert.deepEqual(put2.govde.fark, ["sekil"]);
  // taslak öğrenciye görünmez
  const c = await ogrenci();
  const l = await c("GET", "/api/sorular-bankasi/ap-calculus/sekil-test-quiz-container");
  assert.ok(!l.govde.kutular[0].sorular.some(x => x.id === r.govde.id));
});

test("FRQ ucu: giriş/parça şekli öğrenciye temizlenmiş; çözüm şekli yalnız teslimden sonra", async () => {
  const y = await yonetici();
  const aktif = app.db.prepare("SELECT id, surum, veri FROM frq WHERE durum = 'aktif' LIMIT 1").get();
  assert.ok(aktif, "aktif FRQ olmalı");
  const veri = JSON.parse(aktif.veri);
  veri.sekil = [{ tur: "svg", alt: "giriş grafiği", konum: "govde", svg: '<svg viewBox="0 0 100 80" onload="x()"><line x1="0" y1="0" x2="9" y2="9"/></svg>' },
    { tur: "svg", alt: "çözüm", konum: "aciklama", svg: sv('<text x="1" y="9" font-size="12">FRQ_GIZLI_SEKIL</text>') }];
  const p = await y("PUT", "/api/admin/frq/" + aktif.id, { veri, surum: aktif.surum, not: "şekil testi" });
  assert.equal(p.durum, 200, JSON.stringify(p.govde));
  const c = await ogrenci();
  const g = await c("GET", "/api/frq/" + aktif.id);
  assert.equal(g.durum, 200);
  assert.doesNotMatch(JSON.stringify(g.govde), /FRQ_GIZLI_SEKIL|onload/);
  assert.equal(g.govde.frq.sekiller.length, 1);
  const t = await c("POST", "/api/frq/" + aktif.id + "/teslim", { cevaplar: {} });
  assert.equal(t.durum, 200);
  assert.match(JSON.stringify(t.govde.frq.cozumSekiller), /FRQ_GIZLI_SEKIL/);
  const v = JSON.parse(app.db.prepare("SELECT veri FROM frq WHERE id = ?").get(aktif.id).veri);
  assert.doesNotMatch(v.sekil[0].svg, /onload/);
});
