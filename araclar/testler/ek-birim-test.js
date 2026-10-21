// 1.10.0 zenginleştirme (ek) geri bildirim satırları + 1.11.0 "Yakında" istasyon ve genel deneme kilit kartı.
// Kullanım (proje klasöründen): node araclar/testler/ek-birim-test.js
// apEkHtml / apEkHesapDuzey saf (app.js'ten kesilip çalıştırılır); diğerleri kaynak düzeyinde bağlantı denetimi.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const oku = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const app = oku("assets/js/app.js");

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };

const bas = app.indexOf("// --- 1.10.0 Zenginleştirme (ek)"), son = app.indexOf("/** Yeni açılan geri bildirim kutusu");
if (bas < 0 || son < bas) { console.error("FAIL apEkHtml bölümü app.js içinde bulunamadı"); process.exit(1); }
const ctx = {};
vm.createContext(ctx);
vm.runInContext(app.slice(bas, son) + "\nthis.F = { apEkHtml, apEkHesapDuzey };", ctx);
const { apEkHtml, apEkHesapDuzey } = ctx.F;

// 1) Boş / eksik ek: hiçbir şey çizilmez (cevaptan önce ve eski sorularda kutu değişmez)
ok(apEkHtml(null) === "" && apEkHtml(undefined) === "" && apEkHtml({}) === "" && apEkHtml({ kavram: "  " }) === "", "boş ek → boş dize");

// 2) Tam ek: Kavram + hesap makinesi görünür; İpucu ve Sık hata "Daha fazla" altında (aria-expanded/controls)
const h = apEkHtml({ kavram: "Arşimet ilkesi", ipucu: "r<sub>max</sub>N ile çarp", sikHata: "Hacmi kütle sanmak", hesapMakinesi: "yardımcı" });
ok(/Kavram<\/dt><dd>Arşimet ilkesi/.test(h) && /İpucu<\/dt><dd>r<sub>max<\/sub>N/.test(h) && /Sık hata<\/dt><dd>Hacmi kütle sanmak/.test(h), "dört satır: Kavram, İpucu (HTML korunur), Sık hata", h);
ok(/sb-ek-hm is-yardimci/.test(h) && /Hesap makinesi yardımcı/.test(h) && /<svg class="sb-ek-ikon"/.test(h), "hesap makinesi simgesi + etiket");
const id = (/aria-controls="([^"]+)"/.exec(h) || [])[1];
ok(!!id && h.indexOf('id="' + id + '"') >= 0 && /aria-expanded="false"/.test(h) && />Daha fazla</.test(h), "Daha fazla düğmesi katlanmış bölgeyi denetler (başta kapalı)");
ok(h.indexOf("İpucu") > h.indexOf('class="sb-ek-daha"') && h.indexOf("Kavram") < h.indexOf('class="sb-ek-daha"'), "kavram görünür, ipucu katlanmış bölgede");
const h2 = apEkHtml({ kavram: "B", ipucu: "C" });
ok((/aria-controls="([^"]+)"/.exec(h2) || [])[1] !== id, "her kutuda benzersiz kimlik");

// 3) Kavram yoksa katlama yok (ipucu / sık hata doğrudan görünür); yalnız hesap makinesi de çizilir
const h3 = apEkHtml({ ipucu: "İ", sikHata: "S" });
ok(!/data-sb-ek-btn/.test(h3) && /İpucu<\/dt>/.test(h3) && /Sık hata<\/dt>/.test(h3), "kavram yokken düğme yok, satırlar açık");
ok(/Hesap makinesi gerekmez/.test(apEkHtml({ hesapMakinesi: "gerekmez" })) && !/data-sb-ek-btn/.test(apEkHtml({ hesapMakinesi: "gerekmez" })), "yalnız hesap makinesi");
ok(!/data-sb-ek-btn/.test(apEkHtml({ kavram: "K" })), "yalnız kavram: düğme yok");

// 4) Hesap makinesi düzeyi: üç düzey + eski değerler
ok(apEkHesapDuzey("gerekli") === "gerekli" && apEkHesapDuzey("gerekir") === "gerekli" && apEkHesapDuzey("Yardımcı") === "yardımcı" &&
  apEkHesapDuzey("basit hesap") === "yardımcı" && apEkHesapDuzey("gerekmez") === "gerekmez" && apEkHesapDuzey("") === "" && apEkHesapDuzey(true) === "", "hesap makinesi düzeyi normalleşir");

// 5) Bağlantılar: tüm çözüm görünümleri ek'i yalnız çözümden (cevaptan sonra) alır
ok(/q\.ek = c\.ek && typeof c\.ek === "object"/.test(app), "app.js apCozumUygula çözümdeki ek'i soruya işler");
const fbDogru = app.slice(app.indexOf("if (isCorrect) {\n    if (selectedBtn)"), app.indexOf('feedbackBox.style.display = "block";\n  if (isNew)'));
ok((fbDogru.match(/\$\{apEkHtml\(q\.ek\)\}/g) || []).length === 2, "ders sayfası: doğru ve yanlış geri bildirim kutusunda ek satırları");
ok(/apYumusakAc\(feedbackBox\)/.test(app), "yeni geri bildirim kutusu yükseklik animasyonuyla açılır");
ok(/window\.apEkHtml\(q\.ek \|\| \(yanit && yanit\.ek\)\)/.test(oku("assets/js/oyun.js")), "Bugünkü tekrar (oyun.js) ek satırları");
const den = oku("assets/js/deneme.js");
ok(/q\.ek = c\.ek \|\| null/.test(den) && /answerLine \+ \(window\.apEkHtml \? window\.apEkHtml\(q\.ek\)/.test(den), "deneme incelemesi ek satırları");
const sev = oku("assets/js/seviye.js");
ok(/ek: c\.ek \|\| null/.test(sev) && /window\.apEkHtml\(q\.ek\)/.test(sev), "seviye çözümleri ek satırları");
const css = oku("assets/css/styles.css");
ok(/\.sb-ek-daha \{[^}]*grid-template-rows: 0fr/.test(css) && /\.sb-ek-daha\.is-acik \{ grid-template-rows: 1fr/.test(css) && /prefers-reduced-motion[^}]*\.sb-ek-daha/.test(css), "katlama yüksekliği CSS ile animasyonlu (azaltılmış harekette kapalı)");

// 6) 1.11.0 yeni istasyonlar: sayfada kutu var, "Yakında" durumu (404 / boş), öğrenme yolunda sayılmaz
for (const [f, kutu] of [["ap-physics.html", "phys-unit8-quiz-container"], ["ap-biology.html", "bio-unit8-quiz-container"]]) {
  ok(new RegExp('id="' + kutu + '" data-sb-yeni-kutu').test(oku(f)), f + ": " + kutu + " yeni istasyon işaretli");
}
ok(/r\.durum === 404\) \{ kutu\._sbDurum = "yakinda"; apSbYakinda\(kutu\); \}/.test(app) && /if \(!sorular\.length\) \{ apSbYakinda\(kutu\); return; \}/.test(app), "404 / boş istasyon hata değil Yakında");
ok(/yakinda: !!u\.yakinda/.test(app) && /U\.uniteler\.filter\(function \(u\) \{ return !u\.yakinda; \}\)/.test(oku("assets/js/oyun.js")), "Yakında ünite ders sayfası öğrenme yolunda yok");
ok(/const acik = g\.uniteler\.filter\(u => !kilitli\(u\) && !u\.yakinda\)/.test(app), "hub'ın birincil eylemi Yakında üniteyi hedeflemez");

// 7) Genel deneme: ücretsiz planda tam form yerine kilitli kart
ok(/\(ucretsiz \? genelKilitKarti\(\) :/.test(den) && /function genelKilitKarti\(\)[\s\S]*?href="\/premium"/.test(den), "deneme: ücretsiz planda genel deneme kilitli kart (Premium CTA)");

console.log("SONUC: " + pass + " gecti, " + fail + " kaldi.");
process.exit(fail ? 1 : 0);
