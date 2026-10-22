"use strict";
// 1.15.0 Çevrimdışı (PWA): sw.js sürümlü önbellek adıyla sunulur (__SURUM__ → package.json sürümü), kabuk dosyalarının
// hepsi 200 döner, /api/* önbelleğe alınmaz, push/notificationclick korunur; /cevrimdisi sayfası (uykulu maskot) bakımda da açık.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { olustur } = require("../uygulama");
const SURUM = require("../../package.json").version;

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

/** sw.js'yi sahte service worker ortamında çalıştırır: olay dinleyicileri ve genel değişkenler döner */
function swCalistir(kod) {
  const dinleyiciler = {};
  const ortam = { self: { addEventListener: (ad, f) => { dinleyiciler[ad] = f; }, location: { origin: "https://meberra.test" } }, URL, Request: function () {}, Response: function () {}, caches: { open: () => new Promise(() => {}), match: () => new Promise(() => {}) }, fetch: () => new Promise(() => {}) };
  vm.createContext(ortam);
  vm.runInContext(kod, ortam);
  return { dinleyiciler, ortam };
}

test("sw.js: sürüm yerleştirilir, önbellek adları sürümlü, ETag/304, eski önbellekleri siler, push korunur", async () => {
  const r = await fetch(base + "/sw.js");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /javascript/);
  assert.match(r.headers.get("cache-control"), /no-cache/);
  assert.equal(r.headers.get("service-worker-allowed"), "/");
  const kod = await r.text();
  assert.ok(!kod.includes("__SURUM__"), "yer tutucu doldurulmalı");
  assert.ok(kod.includes('var SURUM = "' + SURUM + '"'));
  // Diskteki dosyada yer tutucu durur (sürüm elle yazılmaz)
  assert.ok(fs.readFileSync(path.join(__dirname, "..", "..", "sw.js"), "utf8").includes('var SURUM = "__SURUM__"'));
  const etag = r.headers.get("etag");
  assert.ok(etag);
  assert.equal((await fetch(base + "/sw.js", { headers: { "If-None-Match": etag } })).status, 304);
  assert.equal((await fetch(base + "/sw.js", { method: "HEAD" })).status, 200);

  const { dinleyiciler, ortam } = swCalistir(kod);
  for (const ad of ["install", "activate", "fetch", "push", "notificationclick"]) assert.equal(typeof dinleyiciler[ad], "function", ad);
  assert.equal(ortam.KABUK, "meberra-kabuk-" + SURUM);
  assert.equal(ortam.VARLIK, "meberra-varlik-" + SURUM);

  // activate: yalnızca bu sürüme ait olmayan meberra-* önbellekleri silinir
  const silinen = [];
  ortam.caches.keys = async () => ["meberra-sw-1", "meberra-kabuk-0.0.1", ortam.KABUK, ortam.VARLIK, "baska-site"];
  ortam.caches.delete = async a => { silinen.push(a); return true; };
  ortam.self.clients = { claim: async () => {} };
  let bekle;
  dinleyiciler.activate({ waitUntil: p => { bekle = p; } });
  await bekle;
  assert.deepEqual(silinen.sort(), ["meberra-kabuk-0.0.1", "meberra-sw-1"]);
});

test("sw.js fetch: /api/* ve POST ele alınmaz; gezinme ve /assets/* yanıtlanır; dış köken karışmaz", () => {
  const kod = fs.readFileSync(path.join(__dirname, "..", "..", "sw.js"), "utf8").replace(/__SURUM__/g, "t");
  const { dinleyiciler } = swCalistir(kod);
  const dene = (url, mode, method) => {
    let yanitlandi = false;
    dinleyiciler.fetch({ request: { url, mode: mode || "cors", method: method || "GET" }, respondWith() { yanitlandi = true; }, waitUntil() {} });
    return yanitlandi;
  };
  assert.equal(dene("https://meberra.test/api/me"), false);
  assert.equal(dene("https://meberra.test/api/state", "cors", "PUT"), false);
  assert.equal(dene("https://meberra.test/api/sorular", "navigate"), false);
  assert.equal(dene("https://meberra.test/bugun", "navigate", "POST"), false);
  assert.equal(dene("https://cdn.jsdelivr.net/npm/mathjax.js"), false);
  assert.equal(dene("https://meberra.test/bugun", "navigate"), true);
  assert.equal(dene("https://meberra.test/assets/css/styles.css?v=1"), true);
  assert.equal(dene("https://meberra.test/data/x.json"), false);
});

test("kabuk dosyalarının hepsi sunucuda 200; çevrimdışı sayfa uykulu maskotu ve yeniden dene düğmesini içerir", async () => {
  const kod = fs.readFileSync(path.join(__dirname, "..", "..", "sw.js"), "utf8");
  const liste = JSON.parse("[" + /var KABUK_DOSYALARI = \[([\s\S]*?)\];/.exec(kod)[1].replace(/CEVRIMDISI/, '"/cevrimdisi"').replace(/,\s*$/, "") + "]");
  assert.ok(liste.length >= 20);
  assert.ok(liste.includes("/cevrimdisi"));
  assert.ok(liste.includes("/assets/img/maskot/korkut-uykulu.svg"));
  assert.ok(!liste.some(u => u.startsWith("/api/")), "API kabukta olamaz");
  for (const u of liste) assert.equal((await fetch(base + u)).status, 200, u);

  const s = await (await fetch(base + "/cevrimdisi")).text();
  assert.match(s, /<meta name="meberra-sayfa" content="cevrimdisi">/);
  assert.match(s, /korkut-uykulu.svg/);
  assert.match(s, /id="cd-dene"/);
  assert.match(s, /eşitlenir/);
  assert.match(s, /noindex/);
  // Eski adres 301; site haritasında yok (herkese açık değil)
  const eski = await fetch(base + "/cevrimdisi.html", { redirect: "manual" });
  assert.equal(eski.status, 301);
  assert.equal(eski.headers.get("location"), "/cevrimdisi");
  assert.ok(!(await (await fetch(base + "/sitemap.xml")).text()).includes("cevrimdisi"));
});

test("bakım modunda /cevrimdisi açık kalır (service worker kurulumu bozulmasın), diğer sayfalar 503", async () => {
  app.bakim.ayarla({ acik: true, mesaj: null, bitis: null }, null);
  try {
    assert.equal((await fetch(base + "/cevrimdisi")).status, 200);
    assert.equal((await fetch(base + "/sw.js")).status, 200);
    assert.equal((await fetch(base + "/bugun")).status, 503);
  } finally {
    app.bakim.ayarla({ acik: false, mesaj: null, bitis: null }, null);
  }
});
