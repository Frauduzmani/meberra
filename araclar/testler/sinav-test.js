// Tur 12 — Sınavlar v2 tarayıcı testi (Ajan 11; plan .agents/rules/tur12-ekran-plani.md §5)
// Çalıştır (node_modules olan çalışma klasöründe): node sinav-test.js
// Sayfalar yerel HTTP sunucusundan açılır. "Önizleme" bölümlerinde data/mevzuat/sinavlar.js isteği route ile
// gerçek dosya + yl-genel.dilSinavlari (16) ve yl-genel.gre'den türetilmiş TEST fixture'ı olarak sunulur (projeye yazılmaz):
// Ajan 13'ün sinavlar-tur12.json kayıtları gelmeden 15 ülke × 2 dil davranışını ve PM ekran görüntülerini doğrular.
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
const SM = require(path.join(ROOT, "assets", "js", "sinav-motor.js"));
fs.mkdirSync(SHOTS, { recursive: true });

let gecen = 0, kalan = 0;
function ok(c, ad, detay) { if (c) { gecen++; console.log("  ✓ " + ad); } else { kalan++; console.log("  ✗ " + ad + (detay !== undefined ? "  → " + JSON.stringify(detay).slice(0, 400) : "")); } }

const yukle = rel => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx); return ctx.window; };
const DK = {}; yukle("data/mevzuat/ulke-dizini.js").APMEBERRA_ULKE_DIZINI.ulkeler.forEach(u => { DK[u.kod] = u; });
const YLG = yukle("data/mevzuat/yl-genel.js").APMEBERRA_YL_GENEL;
// SINAV_VERI=<yol>: gerçek dosya yerine bu sinavlar.js sunulur (ör. PM aktarımı önizlemesi: node araclar/sinav-aktar.js --cikti <yol>)
const VERI_YOLU = process.env.SINAV_VERI && fs.existsSync(process.env.SINAV_VERI) ? process.env.SINAV_VERI : path.join(ROOT, "data", "mevzuat", "sinavlar.js");
const GERCEK = fs.readFileSync(VERI_YOLU, "utf8");
const GERCEK_LISTE = (() => { const c = { window: {} }; vm.runInNewContext(GERCEK, c); return c.window.APMEBERRA_SINAVLAR; })();
const VERIDE = (secim) => SM.suz(GERCEK_LISTE, secim, { dizin: DK }).map(x => x.id);
if (VERI_YOLU !== path.join(ROOT, "data", "mevzuat", "sinavlar.js")) console.log("Veri: " + VERI_YOLU + " (" + GERCEK_LISTE.length + " kayıt)");
const GRE = YLG.gre.find(m => /ucret/.test(m.id));
const FIX = YLG.dilSinavlari.map(m => SM.ylGenelKaydi(m, DK)).concat([{
  id: "gre-onizleme", ad: "GRE General Test (önizleme)", kategori: "Giriş Sınavı", kurum: "ETS", ulkeler: SM.ULKE_KODLARI.slice(), format: "", sure: "", puanlama: "", tarih: "",
  dersSayfasi: null, denemeKodu: null, durum: "yakinda", not: GRE ? GRE.metin : "", kaynak: GRE ? GRE.kaynak[0].url : "https://www.ets.org/gre.html",
  dil: "en", duzey: ["yl"], kesinlik: "Doğrulandı", sonKontrol: "2026-10-15", ucret: "249 ABD doları (ETS, 1 Ağustos 2026'dan itibaren)"
}]);
const ONIZLEME = GERCEK + "\n// TEST FIXTURE (sinav-test.js): yl-genel önizlemesi\nwindow.APMEBERRA_SINAVLAR = window.APMEBERRA_SINAVLAR.concat(" + JSON.stringify(FIX) + ");\n";

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
    if (o.oturum) await seed(ctx);
    if (o.profil) await ctx.addInitScript(p => { try { const k = "apmeberra-hesap:v1:profil:utest"; if (!sessionStorage.getItem("prof12")) { localStorage.setItem(k, JSON.stringify(p)); sessionStorage.setItem("prof12", "1"); } } catch (e) {} }, o.profil);
    if (o.onizleme) await ctx.route("**/data/mevzuat/sinavlar.js", r => r.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: ONIZLEME }));
    else if (process.env.SINAV_VERI) await ctx.route("**/data/mevzuat/sinavlar.js", r => r.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: GERCEK }));
    const p = await ctx.newPage(); p._errs = [];
    p.on("pageerror", e => p._errs.push(e.message));
    p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) p._errs.push("console: " + m.text()); });
    return { ctx, p };
  }
  const git = async (p, u) => { await p.goto(base + "/" + u); await p.waitForSelector("#sn-form"); await p.waitForTimeout(80); };
  const durum = p => p.evaluate(() => ({
    url: location.pathname.split("/").pop() + location.search + location.hash,
    model: (document.querySelector('input[name="model"]:checked') || {}).value || null,
    sinif: (document.querySelector('input[name="sinif"]:checked') || {}).value || null,
    sinifGizli: document.getElementById("sn-sinif").hidden,
    ulke: document.getElementById("ulke-filtre").value,
    dil: (document.querySelector('input[name="dil"]:checked') || {}).value || null,
    sekmeler: [...document.querySelectorAll('[role=tab]')].filter(t => !t.hidden).map(t => t.dataset.kat),
    secili: (document.querySelector('[role=tab][aria-selected=true]') || {}).dataset.kat,
    gorunen: [...document.querySelectorAll('.exam-card:not([hidden])')].map(x => x.id),
    bos: document.getElementById("exam-empty").hidden ? null : document.querySelector("#exam-empty h3").textContent,
    ozet: document.getElementById("sn-ozet-metin").textContent,
    apBand: !document.getElementById("sn-ap-band").hidden,
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth
  }));
  const sekmeyeGec = async (p, kat) => { await p.click(`[role=tab][data-kat="${kat}"]`); await p.waitForTimeout(40); };

  // ===================== A. Ziyaretçi, gerçek veri =====================
  console.log("A. Ziyaretçi (gerçek sinavlar.js)");
  {
    const { ctx, p } = await baglam();
    await git(p, "sinavlar.html");
    let d = await durum(p);
    ok(!d.model && d.ulke === "hepsi" && d.dil === "hepsi" && d.secili === "AP" && d.sekmeler.join() === "AP,Giriş Sınavı,Dil Sınavı", "boş seçim: durum yok, tüm ülkeler, dil hepsi, AP sekmesi önde", d);
    ok(d.url === "sinavlar.html" && d.sinifGizli, "boş seçimde adres değişmez; sınıf grubu gizli");
    await git(p, "sinavlar.html?ulke=it");
    ok((await durum(p)).ulke === "it", "eski adres ?ulke=it -> ülke İtalya");
    // Model: üniversite mezunu
    await p.check('input[name="model"][value="uni-mezun"]', { force: true }); await p.waitForTimeout(60);
    d = await durum(p);
    ok(d.sekmeler.join() === "Dil Sınavı,Giriş Sınavı" && d.secili === "Dil Sınavı" && d.apBand, "uni-mezun: AP sekmesi gizli, Dil önde, AP bandı görünür", d);
    ok(/model=uni-mezun/.test(d.url) && /ulke=it/.test(d.url), "seçim adrese yazıldı: " + d.url);
    ok((await p.textContent('[role=tab][data-kat="Giriş Sınavı"] .tab-ad')) === "GRE / GMAT", "uni-mezun: giriş sekmesi GRE / GMAT adını alır");
    await sekmeyeGec(p, "Giriş Sınavı");
    d = await durum(p);
    const greIt = VERIDE({ model: "uni-mezun", ulke: "it", kategori: "Giriş Sınavı" });
    if (greIt.length) ok(d.gorunen.sort().join() === greIt.sort().join() && !d.bos, "uni-mezun · it: GRE/GMAT kayıtları (" + greIt.join(", ") + ")", d.gorunen);
    else ok(d.bos === "Yüksek lisans giriş sınavı (GRE/GMAT) kaydı henüz yok" && await p.isVisible('#exam-empty a[href*="sartlar.html?model=uni-mezun"]'), "uni-mezun GRE kaydı yok: boş durum + YL notları bağlantısı", d.bos);
    await p.click("#sn-ap-ac"); await p.waitForTimeout(60);
    d = await durum(p);
    ok(d.sekmeler.join() === "Dil Sınavı,Giriş Sınavı,AP" && d.secili === "AP" && d.gorunen.length === 11, "AP bandı: 'göster' AP sekmesini sonda açar (11 AP)", d);
    ok((await p.getAttribute("#sn-ap-ac", "aria-expanded")) === "true", "AP düğmesi aria-expanded=true");
    await p.click("#sn-ap-ac"); await p.waitForTimeout(60);
    ok((await durum(p)).sekmeler.join() === "Dil Sınavı,Giriş Sınavı", "AP tekrar gizlendi");
    // Lise mezunu sırası
    await p.check('input[name="model"][value="lise-mezun"]', { force: true }); await p.waitForTimeout(60);
    d = await durum(p);
    ok(d.sekmeler.join() === "Giriş Sınavı,Dil Sınavı,AP" && !d.apBand && d.sinifGizli, "lise mezunu: Giriş · Dil · AP; AP bandı yok", d);
    // Lise + sınıf
    await p.check('input[name="model"][value="lise"]', { force: true }); await p.check('input[name="sinif"][value="11"]', { force: true }); await p.waitForTimeout(60);
    d = await durum(p);
    ok(!d.sinifGizli && d.sinif === "11" && /model=lise&sinif=11&ulke=it/.test(d.url), "lise: sınıf grubu görünür, sınıf adrese yazılır", d.url);
    // Dil: yerel + ülke İsveç (veri yok) -> boş durum ve eylem
    await p.selectOption("#ulke-filtre", "se");
    await p.check('input[name="dil"][value="yerel"]', { force: true }); await sekmeyeGec(p, "Dil Sınavı");
    d = await durum(p);
    const seYerel = VERIDE({ model: "lise", ulke: "se", dil: "yerel", kategori: "Dil Sınavı" });
    if (seYerel.length) { ok(d.gorunen.sort().join() === seYerel.sort().join(), "se + yerel: İsveççe sınavlar (" + seYerel.join(", ") + ")", d.gorunen); await p.selectOption("#ulke-filtre", "ie"); await p.selectOption("#ulke-filtre", "se"); }
    // Boş durumu her veride sınamak için kayıt olmayan bir seçim: Çekya + yerel + YL olmayan giriş sınavı yoksa dil sekmesi
    const bosUlke = SM.ULKE_KODLARI.find(u => !VERIDE({ model: "lise", ulke: u, dil: "yerel", kategori: "Dil Sınavı" }).length && u !== "ie");
    if (bosUlke) { await p.selectOption("#ulke-filtre", bosUlke); await p.waitForTimeout(40); d = await durum(p); }
    if (bosUlke) ok(d.bos === (await p.evaluate(u => window.APMEBERRA.ulkeAdlari[u], bosUlke)) + " için yerel dil sınavı kaydı henüz yok", bosUlke + " + yerel (kayıt yok): açıklayıcı boş durum", d.bos);
    else ok(true, "her ülkede yerel dil sınavı kaydı var (boş durum sınanamadı)");
    ok(/^Yerel dil \(.+\)$/.test(await p.textContent("#sn-yerel-ad")), "yerel dil etiketi ülkenin dilini gösterir");
    if (bosUlke) await p.click('#exam-empty [data-sn="dil-en"]'); else await p.check('input[name="dil"][value="en"]', { force: true });
    await p.waitForTimeout(60);
    d = await durum(p);
    ok(d.dil === "en" && /dil=en/.test(d.url), "“İngilizce sınavları gör” dili en yapar", d);
    // İrlanda: yerel kapalı
    await p.selectOption("#ulke-filtre", "ie");
    ok(await p.isDisabled('input[name="dil"][value="yerel"]') && (await p.textContent("#sn-dil-not")).includes("İrlanda"), "İrlanda: yerel dil seçeneği kapalı + not");
    // Klavye: sekmeler arasında ok tuşu
    await p.selectOption("#ulke-filtre", "hepsi"); await sekmeyeGec(p, "AP");
    await p.focus('[role=tab][data-kat="AP"]'); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(40);
    ok(await p.evaluate(() => document.activeElement.dataset.kat) === "Giriş Sınavı" && (await durum(p)).secili === "Giriş Sınavı", "klavye: ArrowRight sonraki sekmeye geçer");
    await p.keyboard.press("End"); await p.waitForTimeout(40);
    ok(await p.evaluate(() => document.activeElement.dataset.kat) === "Dil Sınavı", "klavye: End son görünür sekme");
    // Temizle
    await p.click("#sn-temizle"); await p.waitForTimeout(60);
    d = await durum(p);
    ok(!d.model && d.ulke === "hepsi" && d.dil === "hepsi" && d.url === "sinavlar.html", "“Seçimi temizle” her şeyi sıfırlar", d);
    // Doğrudan bağlantılar
    await git(p, "sinavlar.html?model=uni-mezun#ap-calculus-ab"); await p.waitForTimeout(150);
    d = await durum(p);
    ok(d.secili === "AP" && d.gorunen.includes("ap-calculus-ab") && await p.evaluate(() => document.activeElement.id) === "ap-calculus-ab", "uni-mezun + #ap-calculus-ab: AP sekmesi açılır, karta odaklanır", d);
    await git(p, "sinavlar.html?model=lise&ulke=it#ielts-academic"); await p.waitForTimeout(150);
    d = await durum(p);
    ok(d.secili === "Dil Sınavı" && d.gorunen.includes("ielts-academic"), "#ielts-academic -> Dil sekmesi");
    ok((await p.getAttribute('.footer a[data-geri]', "href")).startsWith("sartlar.html?model=lise"), "ziyaretçi: alt bağlantı seçimle şartlara döner");
    ok(await p.isVisible("#sn-sartlar a") && (await p.getAttribute("#sn-sartlar a", "href")) === "sartlar.html?model=lise&ulke=it&dil=en", "tek ülke seçiliyken şartlar bağlantısı (dil=hepsi -> en)");
    ok(await p.$$eval(".exam-card", l => l.every(c => c.querySelector(".exam-actions") || c.querySelector(".exam-noprep"))), "her kartta eylem satırı ya da 'portalda içerik yok' notu");
    ok(await p.$('#ap-physics-c-em .exam-actions [aria-disabled="true"]') !== null && await p.$eval("#til-i", c => !!c.querySelector(".exam-noprep")), "AP'de pasif 'Yakında' düğmeleri korunur; AP dışı içeriksiz kartta tek not");
    ok(p._errs.length === 0, "ziyaretçi: sayfa hatası yok", p._errs);
    await ctx.close();
  }

  // ===================== B. Önizleme fixture'ı: 15 ülke × 2 dil =====================
  console.log("B. Önizleme (yl-genel fixture, 15 ülke)");
  {
    const { ctx, p } = await baglam({ onizleme: true });
    await git(p, "sinavlar.html?model=lise&sinif=11&ulke=de&dil=yerel"); await sekmeyeGec(p, "Dil Sınavı");
    let d = await durum(p);
    ok(["yl-dil-dsh-telc-osd", "yl-dil-goethe", "yl-dil-testdaf"].every(id => d.gorunen.includes(id)) && await p.$$eval(".exam-card:not([hidden])", l => l.every(c => c.dataset.dil.split(" ").includes("de"))), "lise·11·de·yerel: yalnız Almanca sınavlar (" + d.gorunen.length + ")", d.gorunen);
    ok(d.ozet.includes("Lise öğrencisi · 11. sınıf · Almanya · Yerel dil sınavları (Almanca)"), "özet satırı seçimi yazar", d.ozet);
    await git(p, "sinavlar.html?model=uni-mezun&ulke=se&dil=en");
    d = await durum(p);
    ok(d.secili === "Dil Sınavı" && d.gorunen.length >= 5 && await p.$$eval(".exam-card:not([hidden])", l => l.every(c => c.dataset.dil.split(" ").includes("en"))), "uni-mezun·se·en: yalnız İngilizce sınavlar (" + d.gorunen.length + "), İsveççe yok", d.gorunen);
    await sekmeyeGec(p, "Giriş Sınavı");
    ok((await durum(p)).gorunen.includes("gre-onizleme") && await p.$$eval(".exam-card:not([hidden])", l => l.every(c => c.dataset.duzey === "yl")), "uni-mezun: GRE/GMAT sekmesinde yalnız YL sınavları (lisans giriş sınavları yok)");
    ok(await p.$eval("#gre-onizleme", c => c.querySelector(".pill-yl") && c.querySelector(".kesinlik-ok") && /Son kontrol/.test(c.textContent) && /Ücret/.test(c.textContent)), "ek alanlar kartta: YL rozeti, kesinlik, son kontrol, ücret");
    ok(await p.$eval("#yl-dil-ielts", c => c.querySelector(".pill-more") && /\+\d+ ülke/.test(c.querySelector(".pill-more").textContent)), "15 ülkeli kartta ülke pilleri kısaltılır (+n ülke)");
    await git(p, "sinavlar.html?model=lise-mezun&ulke=fr&dil=yerel");
    d = await durum(p);
    ok(d.sekmeler[0] === "Giriş Sınavı", "lise-mezun: Giriş sekmesi önde (boşsa ve dil seçiliyse Dil sekmesi açılır)", d);
    await sekmeyeGec(p, "Dil Sınavı");
    ok((await durum(p)).gorunen.includes("yl-dil-fransizca") && await p.$$eval(".exam-card:not([hidden])", l => l.every(c => c.dataset.dil.split(" ").includes("fr"))), "lise-mezun·fr·yerel: Fransızca sınavlar (DELF/DALF/TCF)");
    // 15 ülke × yerel/en
    for (const u of SM.ULKE_KODLARI) {
      await git(p, `sinavlar.html?model=uni-mezun&ulke=${u}&dil=yerel`);
      const y = await durum(p);
      await p.check('input[name="dil"][value="en"]', { force: true }); await p.waitForTimeout(30);
      const e = await durum(p);
      ok(y.gorunen.length >= 1 && e.gorunen.length >= 5 && !y.bos, `${u}: yerel ${y.gorunen.length} · İngilizce ${e.gorunen.length}`, { y: y.gorunen, e: e.gorunen });
    }
    // Şartlar sayfası: Dil sınavları bölümü 15 ülkede
    for (const u of SM.ULKE_KODLARI) {
      await p.goto(base + `/sartlar.html?model=uni-mezun&ulke=${u}&dil=${u === "ie" ? "en" : "yerel"}`); await p.waitForSelector("#sr-sinavlar", { timeout: 8000 }).catch(() => {});
      const s = await p.evaluate(() => { const x = document.getElementById("sr-sinavlar"); return x ? { h: x.querySelector("h2").textContent, n: x.querySelectorAll("a.chip").length, href: (x.querySelector("a.chip") || {}).getAttribute ? x.querySelector("a.chip").getAttribute("href") : "" } : null; });
      ok(s && s.n >= 1 && s.h === "Dil sınavları ve GRE/GMAT" && new RegExp("^sinavlar\\.html\\?model=uni-mezun&ulke=" + u + "&dil=(yerel|en)#").test(s.href), `şartlar ${u}: dil sınavları bölümü (${s && s.n})`, s);
    }
    ok(await p.$$eval('.sr-jump a[href="#sr-sinavlar"]', l => l.length) === 1, "şartlar: atlama çubuğunda bölüm çipi");
    await p.goto(base + "/sartlar.html?model=uni-mezun&ulke=se&dil=en"); await p.waitForSelector("#sr-sinavlar");
    ok(await p.$$eval("#sr-sinavlar a.chip", l => l.some(a => /#gre-onizleme$/.test(a.getAttribute("href")))), "şartlar YL·se·en: GRE çipi var");
    await p.click('#sr-sinavlar a.chip[href$="#yl-dil-ielts"]'); await p.waitForSelector("#sn-form"); await p.waitForTimeout(200);
    const d2 = await durum(p);
    ok(d2.model === "uni-mezun" && d2.ulke === "se" && d2.dil === "en" && d2.gorunen.includes("yl-dil-ielts") && await p.evaluate(() => document.activeElement.id) === "yl-dil-ielts", "şartlardan çip -> sınavlar aynı seçimle, karta odak", d2);
    await p.goto(base + "/sartlar.html?model=lise&sinif=11&ulke=de&dil=yerel"); await p.waitForSelector("#sr-sinavlar");
    ok((await p.textContent("#sr-sinavlar h2")) === "Dil sınavları" && await p.$$eval("#sr-sinavlar a.chip", l => l.length) >= 3, "şartlar lise·de·yerel: Almanca sınavlar");
    ok(p._errs.length === 0, "önizleme: sayfa hatası yok", p._errs);
    await ctx.close();
  }
  // Gerçek veride şartlar: kayıt olmayan ülkede "hazırlanıyor"
  {
    const { ctx, p } = await baglam();
    await p.goto(base + "/sartlar.html?model=lise&sinif=11&ulke=nl&dil=en"); await p.waitForSelector("#sr-sinavlar");
    // Gerçek sinavlar.js'te IELTS/TOEFL yalnız de, it için kayıtlı (PM aktarımı bekleniyor): bölüm boş durumla görünür
    const nl = await p.evaluate(() => ({ t: document.getElementById("sr-sinavlar").textContent, n: document.querySelectorAll("#sr-sinavlar a.chip").length, jump: !!document.querySelector('.sr-jump a[href="#sr-sinavlar"]') }));
    const nlBek = VERIDE({ model: "lise", ulke: "nl", dil: "en", kategori: "Dil Sınavı" }).length;
    ok(nl.jump && (nlBek ? nl.n === nlBek : nl.t.includes("Bu ülke için dil sınavı kaydı hazırlanıyor") && nl.n === 0), "şartlar nl·en: " + (nlBek ? nlBek + " dil sınavı çipi" : "kayıt yok, 'hazırlanıyor' notu"), nl);
    await p.goto(base + "/sartlar.html?model=lise&sinif=11&ulke=de&dil=en"); await p.waitForSelector("#sr-sinavlar");
    const deEn = VERIDE({ model: "lise", ulke: "de", dil: "en", kategori: "Dil Sınavı" });
    ok(await p.$$eval("#sr-sinavlar a.chip", l => l.map(a => a.getAttribute("href")).join()) === deEn.map(id => "sinavlar.html?model=lise&sinif=11&ulke=de&dil=en#" + id).join(), "şartlar de·en: " + deEn.join(", ") + " seçimle bağlı");
    ok(p._errs.length === 0, "şartlar gerçek veri: hata yok", p._errs);
    await ctx.close();
  }

  // ===================== C. Oturumlu: profil varsayılanı =====================
  console.log("C. Oturumlu (profil varsayılanı)");
  {
    const { ctx, p } = await baglam({ oturum: true });
    await git(p, "sinavlar.html");
    let d = await durum(p);
    const prof = await p.evaluate(() => window.APMEBERRA_ME.profile);
    ok(d.model === "lise" && d.sinif === "11" && d.ulke === "profil" && d.dil === (prof.egitimDili || "hepsi"), "profil varsayılanı: lise · 11 · hedef ülkelerim · dil " + d.dil, d);
    ok(await p.$$eval(".pin-btn", l => l.length) > 0 && await p.$("option[value=listem]") !== null, "oturumlu: Listeme ekle ve 'Yalnızca listem'");
    await p.check('input[name="model"][value="uni-mezun"]', { force: true }); await p.waitForTimeout(60);
    await p.reload(); await p.waitForSelector("#sn-form");
    d = await durum(p);
    ok(d.model === "uni-mezun" && /model=uni-mezun/.test(d.url), "URL seçimi profile üstün gelir (yeniden yüklemede korunur)");
    ok(await p.evaluate(() => JSON.parse(localStorage.getItem("apmeberra-hesap:v1:profil:utest")).ogrenciModeli !== "uni-mezun"), "seçim profile yazılmaz");
    await p.check('input[name="dil"][value="hepsi"]', { force: true }); await p.waitForTimeout(40);
    await p.reload(); await p.waitForSelector("#sn-form");
    ok((await durum(p)).dil === "hepsi", "oturumluda dil=hepsi adreste korunur");
    await p.click("#sn-temizle"); await p.waitForTimeout(60);
    d = await durum(p);
    ok(d.model === "lise" && d.ulke === "profil", "“Profilime göre göster” profile döner");
    await p.selectOption("#ulke-filtre", "listem"); await p.waitForTimeout(40);
    ok((await p.textContent("#sn-dil-not")).includes("süzgeci uygulanmaz"), "liste görünümünde süzgeç notu");
    ok(p._errs.length === 0, "oturumlu: hata yok", p._errs);
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }
  {
    const { ctx, p } = await baglam({ oturum: true, onizleme: true, profil: { okul: "", sinif: "lisans-mezun", ogrenciModeli: "uni-mezun", egitimDili: "yerel", ulkeler: ["se"], tamamlandi: true, lisansAlani: "Makine", lisansDurumu: "mezun", lisansMezuniyetYili: "2025", hedefBaslangicYili: "2027" } });
    await git(p, "sinavlar.html");
    const d = await durum(p);
    ok(d.model === "uni-mezun" && d.dil === "yerel" && d.ulke === "profil" && !d.sekmeler.includes("AP") && d.apBand && d.gorunen.includes("yl-dil-tisus") && await p.$$eval(".exam-card:not([hidden])", l => l.every(c => /\b(sv|fi|yerel)\b/.test(c.dataset.dil))), "uni-mezun profili (se, yerel): İsveççe/Fince sınavlar, AP gizli, bant görünür", d);
    ok(p._errs.length === 0, "uni-mezun profili: hata yok", p._errs);
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // ===================== D. Duyarlılık + PM ekran görüntüleri =====================
  console.log("D. 360/390/1280 · açık/koyu · ekran görüntüleri");
  const EKRAN = [["uni-mezun-se-en", "sinavlar.html?model=uni-mezun&ulke=se&dil=en"], ["lise-11-de-yerel", "sinavlar.html?model=lise&sinif=11&ulke=de&dil=yerel"], ["lise-mezun-fr-yerel", "sinavlar.html?model=lise-mezun&ulke=fr&dil=yerel"]];
  for (const [ad, u] of EKRAN) {
    for (const [w, theme] of [[1280, "light"], [1280, "dark"], [390, "light"], [390, "dark"]]) {
      const { ctx, p } = await baglam({ width: w, theme, onizleme: !process.env.SINAV_VERI && GERCEK_LISTE.length <= 18 });
      await git(p, u);
      if (ad !== "uni-mezun-se-en") await sekmeyeGec(p, "Dil Sınavı");
      const d = await durum(p);
      ok(d.sw <= d.cw, `${ad} ${w}px ${theme}: yatay taşma yok (${d.sw}/${d.cw})`);
      await p.screenshot({ path: path.join(SHOTS, `t12-sinavlar-${ad}-${w}-${theme}.png`), fullPage: w === 390 ? false : true });
      if (w === 390) await p.screenshot({ path: path.join(SHOTS, `t12-sinavlar-${ad}-${w}-${theme}-tam.png`), fullPage: true });
      ok(p._errs.length === 0, `${ad} ${w} ${theme}: hata yok`, p._errs);
      await ctx.close();
    }
  }
  {
    const { ctx, p } = await baglam({ width: 360, onizleme: true });
    for (const u of ["sinavlar.html", "sinavlar.html?model=uni-mezun&ulke=ch&dil=yerel", "sartlar.html?model=uni-mezun&ulke=ch&dil=yerel"]) {
      await p.goto(base + "/" + u); await p.waitForTimeout(500);
      const t = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      ok(t.sw <= t.cw, `360px ${u}: taşma yok (${t.sw}/${t.cw})`);
    }
    await ctx.close();
  }

  // ===================== E. file:// açılış =====================
  {
    const ctx = await browser.newContext(); const p = await ctx.newPage(); const e = [];
    p.on("pageerror", x => e.push(x.message));
    await p.goto("file:///" + ROOT + "/sinavlar.html?model=lise&ulke=de&dil=en"); await p.waitForSelector(".exam-card");
    ok(e.length === 0 && await p.$$eval(".exam-card:not([hidden])", l => l.length) > 0, "file:// açılış: hata yok, kartlar görünür", e);
    await ctx.close();
  }

  await browser.close(); srv.close();
  console.log(`\nsinav-test: ${gecen} geçti, ${kalan} kaldı`);
  process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
