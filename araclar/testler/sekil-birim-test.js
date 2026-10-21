// v1.13.0 şekilli sorular — istemci temizleyici kuralları (assets/js/sekil.js, saf kısım) + sunucu (server/sekil.js) ile eşlik
// + app.js yer tutucu yardımcısı (apSekilHtml) kaçışı. Kullanım (proje klasöründen): node araclar/testler/sekil-birim-test.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const S = require(path.join(ROOT, "server", "sekil.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };

// 1) istemci modülü DOM olmadan yüklenir; saf kurallar dışa açık
const w = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/js/sekil.js"), "utf8"), { window: w }, { filename: "sekil.js" });
const K = w.MeberraSekil && w.MeberraSekil._kural;
ok(!!K && typeof K.ozDeger === "function" && typeof w.MeberraSekil.ciz === "function", "window.MeberraSekil (ciz, _kural) tanımlı");

// 2) beyaz listeler sunucuyla aynı
const kume = o => Object.keys(o).sort().join(",");
ok(kume(K.ETIKET) === Array.from(S.ETIKETLER).sort().join(","), "izinli etiketler sunucuyla aynı");
ok(kume(K.OZ) === Array.from(S.OZNITELIKLER).sort().join(","), "izinli öznitelikler sunucuyla aynı");
ok(kume(K.MARKER_OZ) === Array.from(S.MARKER_OZ).sort().join(","), "marker öznitelikleri sunucuyla aynı");

// 3) yasaklar
const red = [["path", "onload", "alert(1)"], ["path", "href", "#a"], ["path", "xlink:href", "javascript:alert(1)"], ["rect", "style", "fill:red"],
  ["rect", "fill", "url(https://evil.example/x)"], ["rect", "fill", "url(javascript:alert(1))"], ["rect", "fill", "expression(alert(1))"],
  ["line", "marker-end", "url(http://x/#m)"], ["svg", "width", "800"], ["svg", "height", "600"], ["g", "viewBox", "0 0 1 1"], ["g", "xmlns", "http://www.w3.org/2000/svg"],
  ["svg", "xmlns", "http://www.w3.org/1999/xhtml"], ["text", "x", "1\"><script>"], ["path", "d", "M0 0 <script>"], ["g", "transform", "translate(javascript:1)"],
  ["g", "id", "1abc"], ["g", "class", "modal fixed"], ["circle", "opacity", "2"], ["text", "text-anchor", "evil"], ["g", "role", "button"], ["g", "refX", "5"]];
red.forEach(([e, a, v]) => ok(K.ozDeger(e, a, v, e === "svg") === null, "istemci reddeder: <" + e + " " + a + "=\"" + v + "\">"));
ok(!K.etiketIzinli("g", "script") && !K.etiketIzinli("g", "foreignObject") && !K.etiketIzinli("g", "image") && !K.etiketIzinli("g", "use") && !K.etiketIzinli("g", "style"), "yasak etiketler");
ok(!K.etiketIzinli("g", "svg"), "iç içe svg yasak");
ok(!K.etiketIzinli("text", "rect") && K.etiketIzinli("text", "tspan") && !K.etiketIzinli("title", "tspan"), "metin öğelerinde yalnız tspan");
ok(K.viewBoxOku("0 0 481 100") === null && K.viewBoxOku("0 0 100 361") === null && K.viewBoxOku("0 0 0 1") === null && !!K.viewBoxOku("0 0 480 360"), "viewBox ≤ 480×360");

// 4) izinliler + sınıf süzme
ok(K.ozDeger("marker", "refX", "5", false) === "5" && K.ozDeger("marker", "viewBox", "0 0 10 10", false) === "0 0 10 10", "marker öznitelikleri izinli");
ok(K.ozDeger("line", "marker-end", "url(#ok)", false) === "url(#ok)" && K.ozDeger("path", "stroke", "currentColor", false) === "currentColor", "url(#id) ve currentColor");
ok(K.ozDeger("g", "class", "sk-vurgu kirmizi sk-eksen", false) === "sk-vurgu sk-eksen", "sınıf: yalnız sk-… kalır");
ok(K.ozDeger("g", "transform", "rotate(30 50 50) translate(1,2)", false) !== null && K.ozDeger("polyline", "points", "1,2 3,4", false) !== null, "transform ve points");

// 5) eşlik: aynı öznitelik/değer istemcide ve sunucuda aynı karar (sunucu temizle çıktısında kalıyor mu?)
const ornek = [["rect", "x", "1"], ["rect", "x", "1%"], ["text", "x", "1 2 3"], ["path", "d", "M0 0L1 1z"], ["path", "fill", "#000"], ["path", "fill", "red"],
  ["path", "fill", "rgb(1,2,3)"], ["path", "stroke-width", "1.5"], ["path", "stroke-dasharray", "4 2"], ["path", "stroke-dasharray", "4,2,1"],
  ["path", "stroke-linecap", "round"], ["path", "stroke-linejoin", "bevel"], ["text", "font-size", "12"], ["text", "font-size", "12px"], ["text", "font-weight", "700"],
  ["text", "dominant-baseline", "middle"], ["circle", "opacity", "0.5"], ["circle", "fill-opacity", "1"], ["g", "id", "a-1_b"], ["g", "role", "img"],
  ["path", "onclick", "x"], ["path", "fill", "url(http://x)"], ["text", "x", "1;2"], ["g", "transform", "translate(1 2) skewX(3)"], ["g", "transform", "translate(1 2); x"],
  ["line", "marker-start", "none"], ["path", "d", "M0 0 Q 1 2 3 4 A 1 1 0 0 1 5 5"], ["circle", "r", "-1e2"], ["circle", "r", "abc"]];
ornek.forEach(([e, a, v]) => {
  const ic = e === "text" ? "<" + e + " " + a + '="' + v.replace(/"/g, "&quot;") + '">t</' + e + ">" : "<" + e + " " + a + '="' + v.replace(/"/g, "&quot;") + '"/>';
  const r = S.temizle('<svg viewBox="0 0 10 10">' + ic + "</svg>");
  const sunucu = r.ok && r.svg.indexOf(" " + a + "=") >= 0, istemci = K.ozDeger(e, a, v, false) !== null;
  ok(sunucu === istemci, "eşlik <" + e + " " + a + "=\"" + v + "\"> (" + (istemci ? "kalır" : "atılır") + ")", { sunucu, istemci });
});

// 6) app.js apSekilHtml: yer tutucu, öznitelik kaçışı, oran viewBox'tan
const app = fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8");
const bas = app.indexOf("// --- v1.13.0 Şekilli sorular: ortak yardımcılar"), son = app.indexOf("// --- 1.10.0 Zenginleştirme (ek)");
ok(bas > 0 && son > bas, "app.js şekil yardımcıları bölümü bulundu");
const ctx = { window: {}, document: undefined };
vm.createContext(ctx);
vm.runInContext(app.slice(bas, son) + "\nthis.F = { apSekilHtml, apSekilSecenekli, apSekilSiklarDugme };", ctx);
const F = ctx.F;
ok(F.apSekilHtml(null) === "" && F.apSekilHtml([]) === "" && F.apSekilHtml({ alt: "x" }) === "", "şekil yoksa boş dize");
const kotu = { tur: "svg", svg: '<svg viewBox="0 0 320 220"><text>"></div><script>alert(1)</script></text></svg>', alt: '"><img src=x onerror=alert(1)>', baslik: "<b>Graph</b>" };
const h = F.apSekilHtml(kotu);
ok(!/<script|<img|<b>/.test(h), "yer tutucuda ham etiket yok (svg/alt/başlık kaçışlı)", h);
ok(/aspect-ratio:320 \/ 220/.test(h) && /class="sk-bekle sk"/.test(h) && /data-sk-veri="\{/.test(h), "oran viewBox'tan, veri özniteliği JSON");
const geri = JSON.parse((/data-sk-veri="([^"]*)"/.exec(h)[1]).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
ok(geri.svg === kotu.svg && geri.alt === kotu.alt, "veri özniteliği kayıpsız geri okunur");
const sik = F.apSekilHtml(kotu, true);
ok(/^<span class="sk-bekle sk sk-secenek"/.test(sik) && /data-sk-sik="1"/.test(sik) && !/<div/.test(sik), "şıkta span (düğme içinde geçerli)");
ok(F.apSekilHtml([kotu, kotu]).split("sk-bekle").length === 3, "birden çok kök şekli");
const opts = [{ id: "A", text: "", sekil: kotu }, { id: "B", text: "x" }];
ok(F.apSekilSecenekli(opts) === true && F.apSekilSecenekli([{ id: "A", text: "x" }]) === false, "apSekilSecenekli");
ok(/data-sk-siklar=/.test(F.apSekilSiklarDugme(opts)) && !/<script/.test(F.apSekilSiklarDugme(opts)) && F.apSekilSiklarDugme([{ id: "A", text: "x" }]) === "", "Şıkları büyüt düğmesi");

// 7) entegrasyon: her soru çizicisi şekil yardımcısını kullanır
[["assets/js/app.js", /apSekilHtml\(q\.sekiller\)/], ["assets/js/app.js", /apSekilHtml\(q\.cozumSekiller\)/], ["assets/js/oyun.js", /skHtml\(q\.sekiller\)/],
  ["assets/js/deneme.js", /skHtml\(q\.sekiller\)/], ["assets/js/deneme.js", /skHtml\(q\.cozumSekiller\)/], ["assets/js/tam-sinav.js", /skHtml\(q\.sekiller\)/],
  ["assets/js/tam-sinav.js", /skHtml\(p\.cozumSekiller\)/], ["assets/js/seviye.js", /skHtml\(q\.sekiller\)/], ["assets/js/vitrin.js", /skHtml\(q\.sekiller\)/],
  ["assets/js/frq.js", /skHtml\(p\.sekiller\)/], ["assets/js/admin-soru-bankasi.js", /\/api\/admin\/sekil\/onizle/], ["assets/js/admin-onay.js", /skHtml\(o\.sekil, true\)/],
  ["admin.html", /\/assets\/js\/sekil\.js/], ["deneme.html", /\/assets\/css\/sekil\.css/]].forEach(([f, re]) => ok(re.test(fs.readFileSync(path.join(ROOT, f), "utf8")), f + " " + re));

console.log(`\n${pass} geçti, ${fail} kaldı`);
process.exitCode = fail ? 1 : 0;
