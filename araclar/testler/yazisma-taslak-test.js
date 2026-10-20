// Tur 12 — Yazışmalarım v2 tarayıcı testi: süzgeç (durum × ülke, 15 ülke), şablonsuz ülke boş durumu,
// 72 hazır teyit taslağı (kullan, kopyala, mailto yalnız kaynaklı adresle, geçmişe kayıt), 360/390/1280 px, PM ekran görüntüleri.
// Çalıştır (node_modules olan çalışma klasöründe): node yazisma-taslak-test.js
"use strict";
const { chromium } = require("playwright-core");
const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = "C:/Users/hp/Desktop/projelerim/AP MEBERRA";
const SHOTS = path.join(__dirname, "..", "shots");
const EXE = "C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const seed = require("./oturum-tohum");
fs.mkdirSync(SHOTS, { recursive: true });

let gecen = 0, kalan = 0;
function ok(c, ad, detay) { if (c) { gecen++; console.log("  ✓ " + ad); } else { kalan++; console.log("  ✗ " + ad + (detay !== undefined ? "  → " + JSON.stringify(detay).slice(0, 400) : "")); } }
const ctxV = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data", "kocluk", "teyit-taslaklari.js"), "utf8"), ctxV);
const TL = ctxV.window.APMEBERRA_TEYIT_TASLAKLARI.taslaklar;
const T = id => TL.find(t => t.id === id);

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" };
function sunucu() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const f = path.join(ROOT, path.normalize(u).replace(/^([\\/])+/, ""));
      if (!f.startsWith(path.normalize(ROOT)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end("yok"); }
      rsp.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, "127.0.0.1", () => res(srv));
  });
}

(async () => {
  const srv = await sunucu();
  const base = "http://127.0.0.1:" + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  async function baglam(o = {}) {
    const ctx = await browser.newContext({ viewport: { width: o.width || 1280, height: 900 }, colorScheme: o.theme === "dark" ? "dark" : "light" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    await seed(ctx);
    if (o.yok) await ctx.route("**/data/kocluk/teyit-taslaklari.js", r => r.fulfill({ status: 404, body: "" }));
    // v14.1: gerçek veride kaynaksız adres adayı kalmadı; Y3 kuralı, verilen taslağın adresi kaynaksız adaya çevrilerek sınanır.
    if (o.adayYap) await ctx.route("**/data/kocluk/teyit-taslaklari.js", r => r.fulfill({ status: 200, contentType: "application/javascript; charset=utf-8",
      body: fs.readFileSync(path.join(ROOT, "data", "kocluk", "teyit-taslaklari.js"), "utf8") + "\n;(function(){var t=window.APMEBERRA_TEYIT_TASLAKLARI.taslaklar.find(function(x){return x.id===" + JSON.stringify(o.adayYap) + ";});t.adresAdayi=t.eposta;t.eposta=null;t.epostaKaynak=null;})();\n" }));
    const p = await ctx.newPage(); p._errs = [];
    p.on("pageerror", e => p._errs.push(e.message));
    p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) p._errs.push("console: " + m.text()); });
    return { ctx, p };
  }
  // Tur 14 A5: varsayılan sekme "Üniversiteye ilk e-posta"; şablon ve taslaklar "Teyit taslakları" sekmesinde
  const git = async (p, u) => { await p.goto(base + "/" + u); await p.click("#sek-teyit"); await p.waitForSelector("#tt-root .tt-card, #tt-root .empty-state"); await p.waitForTimeout(60); };
  const durum = p => p.evaluate(() => ({
    url: location.pathname.split("/").pop() + location.search,
    model: (document.querySelector('input[name="yz-model"]:checked') || {}).value,
    ulke: document.getElementById("yz-ulke").value,
    sablon: document.querySelectorAll("#sb-root .tpl-card").length,
    sbBos: (document.querySelector('#sb-root [data-bos] h3') || {}).textContent || null,
    taslak: [...document.querySelectorAll("#tt-root .tt-card")].map(c => c.dataset.taslak),
    ttBos: (document.querySelector('#tt-root [data-bos] h3') || {}).textContent || null,
    gruplar: [...document.querySelectorAll("#tt-root .tt-grup")].map(g => g.dataset.grup || "genel"),
    ozet: document.getElementById("yz-ozet").textContent,
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth
  }));
  const LS = (p, k) => p.evaluate(k => localStorage.getItem(k), k);

  // ===================== A. Varsayılan: profil (lise · 11 · de+it) =====================
  console.log("A. Profil varsayılanı");
  {
    const { ctx, p } = await baglam();
    await git(p, "yazismalar.html");
    let d = await durum(p);
    ok(d.model === "lise" && d.ulke === "profil" && d.sablon === 9 && d.taslak.length === 7 && d.gruplar.join() === "de,it", "lise · hedef ülkelerim: 9 şablon + 7 taslak (DE, IT grupları)", d);
    ok(d.ozet.includes("Lise öğrencisi (lisans) · Hedef ülkelerin (Almanya, İtalya)") && d.ozet.includes("9 kişisel şablon, 7 hazır taslak"), "özet satırı", d.ozet);
    ok(d.url === "yazismalar.html", "varsayılanda adres değişmez");
    // Model -> üniversite mezunu
    await p.check('input[name="yz-model"][value="uni-mezun"]', { force: true }); await p.waitForTimeout(60);
    d = await durum(p);
    ok(d.sbBos === "Yüksek lisans için kişisel şablon yok" && d.taslak.length === 17 && d.gruplar.join() === "de,it,genel" && d.url === "yazismalar.html?model=uni-mezun", "uni-mezun: şablon boş durumu, 17 YL taslağı (DE 7 + IT 5 + genel 5), adres", d);
    // Ülke: Hollanda, lise
    await p.check('input[name="yz-model"][value="lise"]', { force: true }); await p.selectOption("#yz-ulke", "nl"); await p.waitForTimeout(60);
    d = await durum(p);
    ok(d.sbBos === "Hollanda için kişisel şablon yok" && d.taslak.length === 2 && d.url === "yazismalar.html?model=lise&ulke=nl", "nl: şablonsuz ülke boş durumu + 2 lisans taslağı", d);
    ok(await p.isVisible('#sb-root [data-git="taslaklar"]') && (await p.textContent('#sb-root [data-git="taslaklar"]')).includes("(2)"), "boş durumda 'Hazır taslaklara git (2)'");
    await p.click('#sb-root [data-git="taslaklar"]'); await p.waitForTimeout(80);
    ok(await p.evaluate(() => document.activeElement.id) === "tt-title", "taslaklara git: bölüm başlığına odak");
    await p.click('#sb-root [data-ulke-sec="hepsi"]'); await p.waitForTimeout(60);
    d = await durum(p);
    ok(d.ulke === "hepsi" && d.sablon === 9 && d.taslak.length === 32, "'Tüm ülkelerin şablonları': 9 şablon, 32 lisans taslağı", d);
    // 15 ülke × 2 düzey: her ülkede taslak var ya da açıklayıcı boş durum
    for (const u of ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"]) {
      for (const m of ["lise", "uni-mezun"]) {
        await git(p, `yazismalar.html?model=${m}&ulke=${u}`);
        const x = await durum(p);
        const bek = TL.filter(t => (t.ulke === u || t.ulke === "genel") && t.duzey === (m === "uni-mezun" ? "yl" : "lisans")).length;
        ok(x.taslak.length === bek && (x.taslak.some(id => !/genel/.test(id)) ? !x.ttBos : !!x.ttBos) && (x.sablon > 0 || !!x.sbBos), `${u} · ${m}: ${x.taslak.length} taslak${x.sbBos ? " · şablon boş durumu" : " · " + x.sablon + " şablon"}`, x);
      }
    }
    ok(p._errs.length === 0, "A: hata yok", p._errs);
    await p.evaluate(() => localStorage.clear()); await ctx.close();
  }

  // ===================== B. Taslağı kullan → oluşturucu → kayıt =====================
  console.log("B. Taslak akışı");
  {
    const { ctx, p } = await baglam();
    await git(p, "yazismalar.html?model=uni-mezun&ulke=dk");
    let d = await durum(p);
    ok(d.taslak.length === 7 && d.gruplar.join() === "dk,genel", "uni-mezun · dk: 2 Danimarka + 5 genel", d);
    const t = T("tt-dk-yl-1");
    await p.click('[data-taslak-kullan="tt-dk-yl-1"]'); await p.waitForSelector("#olustur:not([hidden])");
    const o = await p.evaluate(() => ({ kicker: document.getElementById("ol-kicker").textContent, konu: document.getElementById("ol-konu").value, govde: document.getElementById("ol-govde").value, alici: document.getElementById("ol-alici").value, bilgi: document.getElementById("ol-alici-bilgi").textContent, href: document.getElementById("ol-mailto").getAttribute("href"), eksik: document.getElementById("ol-eksik").textContent, uni: document.getElementById("ol-uni-wrap").hidden, pressed: document.querySelector('[data-taslak-kullan="tt-dk-yl-1"]').getAttribute("aria-pressed") }));
    ok(o.kicker === "Hazır teyit taslağı" && o.konu === t.konu && o.govde === t.metin && o.uni && o.pressed === "true", "oluşturucu taslakla doldu (konu, metin), üniversite seçimi yok, kart seçili", o);
    ok(o.alici === "" && /^mailto:\?subject=/.test(o.href) && o.bilgi.includes("Doğrulanmış adres yok"), "kaynaklı adres yok: alıcı boş, mailto alıcısız, açıklama", o);
    ok(o.eksik.includes(t.yerTutucular.length + " yer tutucu doldurulmadı") && o.eksik.includes(t.yerTutucular[0]), "yer tutucular listelendi", o.eksik);
    ok(await p.getAttribute("#ms-2", "aria-current") === "step", "adım 2 (yer tutucular dolmadan)");
    await p.click("#ol-kopyala"); await p.waitForSelector("#ol-durum.is-ok");
    ok((await p.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n") === t.metin, "Kopyala: metin panoya");
    await p.click("#ol-gonderildi"); await p.waitForTimeout(60);
    ok((await p.textContent("#ol-durum")).includes("bir kez daha") && (await LS(p, "apmeberra:yazisma:v1")) === null, "yer tutucu varken 'gönderildi' onay ister, kayıt yazılmaz");
    const dolu = (await p.inputValue("#ol-govde")).split(t.yerTutucular[0]).join("Deniz Kaya");
    await p.fill("#ol-govde", dolu); await p.waitForTimeout(60);
    ok((await p.textContent("#ol-eksik")).includes("Yer tutucular dolduruldu") && await p.getAttribute("#ms-3", "aria-current") === "step", "yer tutucular dolunca adım 3");
    await p.click("#ol-taslak"); await p.waitForSelector("#ol-durum.is-ok");
    const dep = JSON.parse(await LS(p, "apmeberra:yazisma:v1"));
    ok(dep.kayitlar.length === 1 && dep.kayitlar[0].taslakId === "tt-dk-yl-1" && dep.kayitlar[0].sablonId === null && dep.kayitlar[0].aliciAd === t.kime && dep.kayitlar[0].durum === "taslak", "geçmişe kayıt: taslakId, alıcı adı", dep.kayitlar[0]);
    ok((await p.textContent(".mail-item .mail-meta")).includes("Hazır teyit taslağı"), "geçmiş satırında taslak türü");
    await p.click("#ol-kapat"); await p.waitForTimeout(40);
    await p.click("#sek-gecmis"); // Tur 14 A5: geçmiş kendi sekmesinde; "Aç ve düzenle" oluşturucuyu Teyit sekmesinde açar
    await p.click('.mail-item [data-act="ac"]'); await p.waitForSelector("#olustur:not([hidden])");
    ok(await p.getAttribute("#sek-teyit", "aria-selected") === "true", "A5: geçmişten açınca Teyit taslakları sekmesine geçildi");
    ok((await p.textContent("#ol-alici-bilgi")).includes(t.kime) && (await p.inputValue("#ol-govde")).includes("Deniz Kaya"), "geçmişten açınca taslak bağlamı ve düzenlenmiş metin geri gelir");
    // Kartta "Metni kopyala"
    await p.click('[data-taslak-kopyala="tt-genel-yl-1"]'); await p.waitForTimeout(150);
    ok((await p.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n") === T("tt-genel-yl-1").metin && (await p.textContent('[data-taslak="tt-genel-yl-1"] .tt-durum')).includes("panoya kopyalandı"), "kart 'Metni kopyala' + durum mesajı");
    ok(p._errs.length === 0, "B: hata yok", p._errs);
    await p.evaluate(() => localStorage.clear()); await ctx.close();
  }

  // ===================== C. Alıcı adresi kuralı (Y3) =====================
  console.log("C. Alıcı adresi kuralı");
  {
    const { ctx, p } = await baglam();
    await git(p, "yazismalar.html?model=lise&ulke=ie");
    const tcd = TL.find(t => t.eposta === "study@tcd.ie");
    ok(TL.filter(t => t.adresAdayi).length === 0 && TL.filter(t => t.eposta).length === 15, "v14.1: gerçek veride kaynaksız aday 0, kaynaklı alıcı 15");
    ok(await p.isVisible(`[data-taslak="${tcd.id}"] .tt-adres.is-ok`) && (await p.textContent(`[data-taslak="${tcd.id}"] .tt-adres`)).includes(tcd.eposta), "kaynaklı adres kartta 'Resmi adres' + kaynak bağlantısı");
    await p.click(`[data-taslak-kullan="${tcd.id}"]`); await p.waitForSelector("#olustur:not([hidden])");
    ok(await p.inputValue("#ol-alici") === tcd.eposta && (await p.getAttribute("#ol-mailto", "href")).startsWith("mailto:" + tcd.eposta + "?"), "kaynaklı adres: alıcı dolu, mailto alıcılı");
    const aalto = TL.find(t => t.eposta === "admissions@aalto.fi" && t.duzey === "lisans" && t.ulke === "fi");
    await git(p, "yazismalar.html?model=lise&ulke=fi");
    ok(await p.isVisible(`[data-taslak="${aalto.id}"] .tt-adres.is-ok`) && await p.$$eval("#tt-root .tt-adres.is-warn", l => l.length) === 0, "v14.1: Aalto adresi artık kaynaklı (is-ok), fi'de uyarı yok");
    {
      const k2 = await baglam({ adayYap: aalto.id });
      await git(k2.p, "yazismalar.html?model=lise&ulke=fi");
      ok((await k2.p.textContent(`[data-taslak="${aalto.id}"] .tt-adres.is-warn`)).includes("resmi bir kaynakla eşleşmedi"), "kaynaksız aday adres: uyarı (yapay aday)");
      await k2.p.click(`[data-taslak-kullan="${aalto.id}"]`); await k2.p.waitForSelector("#olustur:not([hidden])");
      ok(await k2.p.inputValue("#ol-alici") === "" && /^mailto:\?/.test(await k2.p.getAttribute("#ol-mailto", "href")), "kaynaksız aday adres mailto'ya yazılmaz (yapay aday)");
      ok(k2.p._errs.length === 0, "C (yapay aday): hata yok", k2.p._errs);
      await k2.ctx.close();
    }
    // ?taslak= ile doğrudan açılış
    await git(p, "yazismalar.html?model=uni-mezun&ulke=se&taslak=tt-se-yl-1"); await p.waitForSelector("#olustur:not([hidden])");
    ok(await p.inputValue("#ol-konu") === T("tt-se-yl-1").konu, "?taslak=<id> ile doğrudan açılış");
    ok(await p.$$eval('#tt-root [lang="de"], #tt-root [lang="en"], #tt-root [lang="fr"], #tt-root [lang="it"], #tt-root [lang="es"]', l => l.length) > 0, "yabancı dildeki metinlerde lang özniteliği");
    ok(p._errs.length === 0, "C: hata yok", p._errs);
    await p.evaluate(() => localStorage.clear()); await ctx.close();
  }

  // ===================== D. Taslak dosyası yok =====================
  console.log("D. Taslak dosyası yok");
  {
    const { ctx, p } = await baglam({ yok: true });
    await git(p, "yazismalar.html");
    const d = await durum(p);
    ok(d.ttBos === "Teyit taslakları yüklenemedi" && d.sablon === 9, "taslak dosyası yok: açıklama, şablonlar çalışır", d);
    ok(p._errs.length === 0, "D: hata yok", p._errs);
    await ctx.close();
  }

  // ===================== E. Duyarlılık + PM ekran görüntüleri =====================
  console.log("E. Ekran görüntüleri");
  for (const [ad, u] of [["uni-mezun-dk", "yazismalar.html?model=uni-mezun&ulke=dk"], ["lise-11-it", "yazismalar.html?model=lise&ulke=it"]]) {
    for (const [w, theme] of [[1280, "light"], [1280, "dark"], [390, "light"], [390, "dark"]]) {
      const { ctx, p } = await baglam({ width: w, theme });
      await git(p, u);
      let d = await durum(p);
      ok(d.sw <= d.cw, `${ad} ${w}px ${theme}: liste taşmıyor (${d.sw}/${d.cw})`);
      await p.screenshot({ path: path.join(SHOTS, `t12-yazismalar-${ad}-${w}-${theme}.png`), fullPage: w === 1280 });
      await p.locator("#taslaklar").screenshot({ path: path.join(SHOTS, `t12-yazismalar-${ad}-${w}-${theme}-taslaklar.png`) });
      await p.locator("[data-taslak-kullan]").first().click(); await p.waitForSelector("#olustur:not([hidden])"); await p.waitForTimeout(80);
      d = await durum(p);
      ok(d.sw <= d.cw, `${ad} ${w}px ${theme}: oluşturucu taşmıyor (${d.sw}/${d.cw})`);
      await p.locator("#olustur").screenshot({ path: path.join(SHOTS, `t12-yazismalar-${ad}-${w}-${theme}-olusturucu.png`) });
      ok(p._errs.length === 0, `${ad} ${w} ${theme}: hata yok`, p._errs);
      await p.evaluate(() => localStorage.clear()); await ctx.close();
    }
  }
  {
    const { ctx, p } = await baglam({ width: 360, theme: "dark" });
    await git(p, "yazismalar.html?model=lise&ulke=hepsi");
    const d = await durum(p);
    ok(d.sw <= d.cw && d.taslak.length === 32, `360px tüm ülkeler: taşma yok (${d.sw}/${d.cw}), 32 taslak`);
    await p.evaluate(() => localStorage.clear()); await ctx.close();
  }
  // file://
  {
    const ctx = await browser.newContext(); await seed(ctx); const p = await ctx.newPage(); const e = [];
    p.on("pageerror", x => e.push(x.message));
    await p.goto("file:///" + ROOT + "/yazismalar.html?model=uni-mezun&ulke=dk#taslaklar"); await p.waitForSelector("#tt-root .tt-card");
    ok(e.length === 0, "file:// açılış: hata yok", e);
    await p.evaluate(() => localStorage.clear()); await ctx.close();
  }

  await browser.close(); srv.close();
  console.log(`\nyazisma-taslak-test: ${gecen} geçti, ${kalan} kaldı`);
  process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
