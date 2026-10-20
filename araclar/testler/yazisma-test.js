// Resmi Yazışmalarım (yazismalar.html) akış testi — Tur 5b, Ajan 11
// Çalıştır (node_modules olan çalışma klasöründe): node yazisma-test.js
// İsteğe bağlı: SAHTE_SABLON=<yol> -> şablon dosyası yerine bu dosya sunulur (projeye yazılmaz).
// Sayfa yerel bir HTTP sunucusundan açılır; böylece şablon dosyası "yok" / "sahte" durumları
// proje dosyalarına dokunmadan route ile denenebilir ve pano (clipboard) izni verilebilir.
"use strict";
const { chromium } = require("playwright-core");
const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/hp/Desktop/projelerim/AP MEBERRA";
const SHOTS = path.join(__dirname, "..", "shots");
const EXE = "C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const seed = require("./oturum-tohum");
fs.mkdirSync(SHOTS, { recursive: true });

let gecen = 0, kalan = 0;
function ok(c, ad, detay) { if (c) { gecen++; console.log("  ✓ " + ad); } else { kalan++; console.log("  ✗ " + ad + (detay !== undefined ? "  → " + JSON.stringify(detay).slice(0, 400) : "")); } }

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

async function yeniBaglam(browser, base, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: o.width || 1280, height: 900 }, colorScheme: o.theme === "dark" ? "dark" : "light" });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
  await seed(ctx);
  await ctx.addInitScript(([t, sinif]) => {
    try {
      localStorage.setItem("apmeberra:theme", t);
      if (sinif) { const k = "apmeberra-hesap:v1:profil:utest"; const p = JSON.parse(localStorage.getItem(k)); if (p && p.sinif !== sinif && !sessionStorage.getItem("sinifAyarli")) { p.sinif = sinif; localStorage.setItem(k, JSON.stringify(p)); sessionStorage.setItem("sinifAyarli", "1"); } }
    } catch (e) {}
  }, [o.theme || "light", o.sinif || null]);
  if (o.sablon === "yok") await ctx.route("**/data/kocluk/eposta-sablonlari.js", r => r.fulfill({ status: 404, body: "" }));
  else if (o.sablon) await ctx.route("**/data/kocluk/eposta-sablonlari.js", r => r.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: fs.readFileSync(o.sablon, "utf8") }));
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
  return { ctx, page, errs };
}
const LS = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
async function tasma(page) {
  return page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    return { sw: document.documentElement.scrollWidth, cw, wide: [...document.querySelectorAll("body *")].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > cw + 1 && !e.closest("[hidden]"); }).slice(0, 4).map(e => e.tagName + "#" + e.id + "." + String(e.className).slice(0, 40)) };
  });
}

(async () => {
  const srv = await sunucu();
  const base = "http://127.0.0.1:" + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  const gercekVar = fs.existsSync(path.join(ROOT, "data", "kocluk", "eposta-sablonlari.js"));

  // ================= A. Ana akış (gerçek şablon dosyası) =================
  if (gercekVar) {
    console.log("A. Ana akış — gerçek data/kocluk/eposta-sablonlari.js");
    const { ctx, page: p, errs } = await yeniBaglam(browser, base);
    // 1) Profil alanlarını doldur
    await p.goto(base + "/profil.html#iletisim");
    await p.waitForSelector("#profile:not([hidden])");
    ok(await p.waitForFunction(() => document.activeElement && document.activeElement.id === "pf-eposta", null, { timeout: 2000 }).then(() => true, () => false), "profil.html#iletisim e-posta alanına odaklanır");
    ok(await p.inputValue("#pf-okulSehir") === "İstanbul", "okul şehri varsayılan İstanbul");
    ok(await p.isHidden("#pf-mezuniyetYili-wrap"), "mezuniyet yılı alanı mezun değilken gizli");
    await p.click('#pf-sinif-group label:has-text("Mezun")');
    ok(await p.isVisible("#pf-mezuniyetYili-wrap"), "Mezun seçilince mezuniyet yılı alanı görünür");
    await p.click('#pf-sinif-group label:has-text("11. sınıf")');
    await p.fill("#pf-eposta", "azra@ornek");
    await p.click("#pf-save");
    await p.waitForSelector("#pf-eposta-err:not(:empty)");
    ok(await p.getAttribute("#pf-eposta", "aria-invalid") === "true", "geçersiz e-posta reddedildi ve alan işaretlendi");
    await p.fill("#pf-eposta", "azra.yilmaz@ornek.com");
    await p.fill("#pf-dogumTarihi", "2009-05-14");
    await p.click("#pf-save");
    await p.waitForSelector("#pf-alert.is-ok");
    const prof = JSON.parse(await LS(p, "apmeberra-hesap:v1:profil:utest"));
    ok(prof.eposta === "azra.yilmaz@ornek.com" && prof.dogumTarihi === "2009-05-14" && prof.okulSehir === "İstanbul" && prof.okul === "Test Lisesi" && prof.tamamlandi, "profil ekleri kaydedildi, zorunlu alanlar korundu", prof);

    // 2) Sınavlarım: iki AP + IELTS
    await p.goto(base + "/sinavlar.html");
    await p.waitForSelector(".exam-card");
    for (const id of ["ap-calculus-ab", "ap-physics-1"]) await p.click(`[data-pin="${id}"]`);
    await p.evaluate(() => window.APMEBERRA.panel.update(o => { if (o.sinavlarim.indexOf("ielts-academic") < 0) o.sinavlarim.push("ielts-academic"); }));

    // 3) Yazışmalar: şablon seç
    await p.goto(base + "/yazismalar.html#sablonlar");
    await p.waitForSelector(".tpl-card");
    // Tur 14 A5: not tüm sekmelerin üstünde; gönderimin kullanıcıda ve kendi adresinden olduğunu söyler
    ok(/Portal e-posta göndermez\..*kendi adresinden sen gönderirsin/.test(await p.textContent("#durust-not")) && await p.isVisible("#durust-not"), "dürüst not sayfada (portal göndermez, kendi adresinden)");
    const kartlar = await p.$$eval(".tpl-card", a => a.length);
    ok(kartlar >= 1, "şablon kartları listelendi (" + kartlar + ")");
    ok(await p.$('[data-sablon="it-polimi-erken-giris"]') !== null, "11. sınıf: it-polimi-erken-giris görünür");
    const kartIcerik = await p.$eval('[data-sablon="de-uni-ap-yks-teyit"]', b => { const c = b.closest(".tpl-card"); return { h: c.querySelector("h3").textContent, karar: (c.querySelector(".decision-badge") || {}).textContent, ne: c.querySelector(".tpl-facts").textContent, kay: c.querySelectorAll(".src-details a").length }; });
    // K1–K3 kapandı (spec §8.3): şablonlarda kararNotu null olabilir. Rozet varsa veriyle aynı olmalı; yoksa da ne zaman + kaynak alanları bulunmalı.
    const beklenenKarar = await p.evaluate(() => (window.APMEBERRA_EPOSTA_SABLONLARI.find(s => s.id === "de-uni-ap-yks-teyit") || {}).kararNotu || null);
    const rozetUyumlu = beklenenKarar ? new RegExp("Karar notu " + beklenenKarar).test(kartIcerik.karar || "") : !kartIcerik.karar;
    ok(rozetUyumlu && /Ne zaman/.test(kartIcerik.ne) && kartIcerik.kay >= 1, "kartta başlık, amaç, ne zaman, dayanak bağlantıları; karar notu rozeti yalnızca veride varsa (" + (beklenenKarar || "yok") + ")", kartIcerik);
    // Klavye ile seçim
    await p.focus('[data-sablon="de-uni-ap-yks-teyit"]');
    await p.keyboard.press("Enter");
    await p.waitForSelector("#olustur:not([hidden])");
    ok(await p.evaluate(() => document.activeElement.id) === "ol-title", "Enter ile şablon seçildi, odak oluşturucu başlığında");
    ok(await p.getAttribute('[data-sablon="de-uni-ap-yks-teyit"]', "aria-pressed") === "true", "seçili kart aria-pressed=true");
    ok(await p.getAttribute("#ms-2", "aria-current") === "step", "adım göstergesi 2. adımda");

    // 4) Üniversite seç (yalnız alici.secenekler)
    const secenekSayisi = await p.evaluate(() => window.APMEBERRA_EPOSTA_SABLONLARI.find(s => s.id === "de-uni-ap-yks-teyit").alici.secenekler.length);
    const opsiyon = await p.$$eval("#ol-uni option", o => o.filter(x => x.value).map(x => x.value));
    ok(opsiyon.length === secenekSayisi, "üniversite listesi alici.secenekler ile sınırlı (" + opsiyon.length + "/" + secenekSayisi + ")", opsiyon);
    ok((await p.$$eval(".missing-list li", l => l.map(x => x.textContent))).some(t => /Üniversite/.test(t)), "üniversite seçilmeden eksik listesinde");
    await p.selectOption("#ol-uni", "de-saarland");
    ok(await p.inputValue("#ol-prog") !== "", "tek programlı üniversitede program otomatik seçildi");
    ok(await p.inputValue("#ol-alici") === "studium@uni-saarland.de", "alıcı e-postası seçenekten dolduruldu");
    ok((await p.textContent("#ol-alici-bilgi")).includes("Studierendensekretariat"), "alıcı kurumu ve notu gösterildi");

    // 5) Önizlemede eksik yok
    await p.waitForSelector("#ol-eksik.is-ok");
    const konu = await p.inputValue("#ol-konu"), govde = await p.inputValue("#ol-govde");
    ok(!/\[eksik:/.test(konu + govde), "önizlemede [eksik: …] yok");
    ok(govde.includes("AP Calculus AB") && govde.includes("AP Physics 1") && !govde.includes("IELTS"), "AP sınavları Sınavlarım listesinden (yalnız AP)");
    ok(/Saarland University/.test(konu + govde) && !/\(Universität des Saarlandes\)/.test(konu + govde), "universite.ad resmiAd ile temiz");
    ok(govde.includes("2028") && govde.includes("Istanbul"), "mezuniyet yılı 2028 ve şehir");
    ok(await p.getAttribute("#ms-3", "aria-current") === "step", "adım göstergesi 3. adımda");

    // 6) Kopyala
    await p.click("#ol-kopyala");
    await p.waitForSelector("#ol-durum.is-ok");
    const pano = await p.evaluate(() => navigator.clipboard.readText());
    ok(pano.replace(/\r\n/g, "\n") === govde, "Kopyala gövdeyi panoya yazdı", { pano: pano.slice(0, 120), govde: govde.slice(0, 120), lp: pano.length, lg: govde.length });
    // mailto bağlantısı
    const href = await p.getAttribute("#ol-mailto", "href");
    const q = new URL(href.replace(/^mailto:[^?]*/, "http://x/"));
    ok(href.startsWith("mailto:studium@uni-saarland.de?subject="), "mailto alıcı + konu", href.slice(0, 80));
    if (href.length <= 2000) ok(q.searchParams.get("body") === govde.replace(/\n/g, "\r\n"), "mailto gövde CRLF ile doğru kodlandı");
    else ok(!q.searchParams.get("body") && await p.isVisible("#ol-uyari"), "uzun metin: mailto gövdesiz + uyarı (" + href.length + ")");

    // 7) Gönderildi işaretle
    await p.click("#ol-gonderildi");
    await p.waitForSelector("#ol-durum.is-ok");
    let depo = JSON.parse(await LS(p, "apmeberra:yazisma:v1"));
    ok(depo.kayitlar.length === 1 && depo.kayitlar[0].durum === "gonderildi" && depo.kayitlar[0].gonderim && depo.kayitlar[0].universiteId === "de-saarland" && depo.kayitlar[0].alici === "studium@uni-saarland.de", "kayıt gönderildi olarak yazıldı", depo.kayitlar[0]);
    const alanlar = ["id", "sablonId", "alici", "universiteId", "programAd", "konu", "govde", "durum", "olusturma", "gonderim", "yanitNotu"];
    ok(alanlar.every(f => f in depo.kayitlar[0]), "kayıt şeması §7.4 alanlarını içeriyor");

    // 8) Sayfayı yenile -> geçmişte durur
    await p.reload();
    await p.click("#sek-gecmis"); // Tur 14 A5: geçmiş kendi sekmesinde
    await p.waitForSelector(".mail-item");
    ok(await p.$eval(".mail-item .mail-state", e => e.textContent) === "Gönderildi", "yenilemeden sonra geçmişte 'Gönderildi'");
    ok((await p.$eval(".mail-item h3", e => e.textContent)) === konu, "geçmişte konu doğru");

    // 9) Yanıt notu
    await p.click('.mail-item [data-act="not"]');
    await p.fill(".mail-item .reply-form textarea", "Yanıt geldi: AP + diploma ile doğrudan kabul mümkün; belge listesi istendi.");
    await p.click('.mail-item .reply-form button[type="submit"]');
    await p.waitForSelector(".mail-state-yanit");
    depo = JSON.parse(await LS(p, "apmeberra:yazisma:v1"));
    ok(depo.kayitlar[0].durum === "yanit" && /belge listesi/.test(depo.kayitlar[0].yanitNotu) && depo.kayitlar[0].yanitTarihi, "yanıt notu kaydedildi, durum 'yanıt geldi'");

    // 10) Yeniden aç
    await p.click('.mail-item [data-act="ac"]');
    await p.waitForSelector("#olustur:not([hidden])");
    ok(await p.inputValue("#ol-konu") === konu && await p.inputValue("#ol-uni") === "de-saarland", "kayıt yeniden açıldı (konu + üniversite)");

    // 11) Kurum şablonu: taslak kaydet, sonra sil
    await p.click('[data-sablon="de-uniassist-ap-yks"]');
    ok(await p.isHidden("#ol-uni-wrap"), "kurum şablonunda üniversite seçimi yok");
    ok((await p.textContent("#ol-alici-bilgi")).includes("uni-assist"), "kurum alıcısı ve notu gösterildi");
    await p.fill("#ol-govde", (await p.inputValue("#ol-govde")) + "\nP.S. test");
    ok((await p.textContent("#ol-duzen-not")).includes("elle düzenledin"), "elle düzenleme bildirimi");
    await p.click("#ol-taslak");
    await p.waitForSelector("#ol-durum.is-ok");
    ok(await p.$$eval(".mail-item", a => a.length) === 2, "taslak geçmişe eklendi (2 kayıt)");
    ok((await p.textContent("#sek-gecmis-say")) === "2", "A5: Yazışma geçmişi sekme sayacı 2");
    await p.click("#sek-gecmis");
    await p.click('.chip[data-filtre="taslak"]');
    ok(await p.$$eval(".mail-item", a => a.length) === 1, "durum süzgeci: taslak");
    await p.click('.mail-item [data-act="sil"]');
    ok((await p.textContent('.mail-item [data-act="sil"]')).includes("Emin misin"), "silme iki adımlı onay ister");
    await p.click('.mail-item [data-act="sil"]');
    await p.click('.chip[data-filtre="hepsi"]');
    ok(await p.$$eval(".mail-item", a => a.length) === 1, "taslak silindi");

    // Ekran görüntüleri (masaüstü açık + koyu)
    await p.click('.mail-item [data-act="ac"]');
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${SHOTS}/t5b-yazisma-desktop-light.png`, fullPage: true });
    ok(errs.length === 0, "konsol/sayfa hatası yok", errs);
    await ctx.close();

    // B. Eksik alan: sayfada doldur -> profile kaydet (yeni bağlam, boş profil ekleri)
    console.log("B. Eksik bilgiyi sayfada tamamlama");
    const B = await yeniBaglam(browser, base, { theme: "dark" });
    await B.page.goto(base + "/yazismalar.html?sablon=it-uni-cimea-dov");
    await B.page.waitForSelector("#olustur:not([hidden])");
    ok(await B.page.isVisible("#ol-uni-wrap"), "?sablon= ile doğrudan açıldı");
    await B.page.selectOption("#ol-uni", { index: 1 });
    const eks = await B.page.$$eval(".missing-list li", l => l.map(x => x.textContent));
    ok(eks.some(t => /Doğum tarihin/.test(t)), "eksik listesinde doğum tarihi", eks);
    ok(/\[eksik: ogrenci\.dogumTarihi\]/.test(await B.page.inputValue("#ol-govde")), "metinde [eksik: ogrenci.dogumTarihi]");
    ok(await B.page.$('.missing-list a[href="profil.html#pf-dogumTarihi"]') !== null, "profile tek tıkla gitme bağlantısı");
    await B.page.fill("#fx-dogumTarihi", "2009-05-14");
    await B.page.click("#fx-kaydet");
    await B.page.waitForSelector("#ol-durum.is-ok");
    ok(!/\[eksik: ogrenci\.dogumTarihi\]/.test(await B.page.inputValue("#ol-govde")), "kaydedince metin güncellendi");
    ok(JSON.parse(await LS(B.page, "apmeberra-hesap:v1:profil:utest")).dogumTarihi === "2009-05-14", "sayfadan girilen alan profile yazıldı");
    // ekran görüntüleri: masaüstü koyu
    await B.page.screenshot({ path: `${SHOTS}/t5b-yazisma-desktop-dark.png`, fullPage: true });
    // eksikle gönderildi -> ikinci basış ister
    await B.page.selectOption("#ol-prog", { index: 0 });
    await B.page.selectOption("#ol-uni", { index: 0 });
    await B.page.click("#ol-gonderildi");
    ok((await B.page.textContent("#ol-durum")).includes("bir kez daha"), "eksik varken 'gönderildi' onay ister");
    ok(B.errs.length === 0, "konsol/sayfa hatası yok", B.errs);
    await B.ctx.close();

    // C. 12. sınıf: sınıfa özel şablon gizli
    console.log("C. Sınıf süzmesi");
    const C = await yeniBaglam(browser, base, { sinif: "12" });
    await C.page.goto(base + "/yazismalar.html#sablonlar");
    await C.page.waitForSelector(".tpl-card");
    ok(await C.page.$('[data-sablon="it-polimi-erken-giris"]') === null, "12. sınıf: it-polimi-erken-giris gizli");
    if (await C.page.isVisible("#sb-all-wrap")) await C.page.check("#sb-all");
    ok(await C.page.$('[data-sablon="it-polimi-erken-giris"]') === null, "'tüm ülkeler' açıkken de gizli");
    await C.ctx.close();
  } else {
    console.log("A–C atlandı: data/kocluk/eposta-sablonlari.js yok");
  }

  // D. Şablon dosyası yok -> "Şablonlar hazırlanıyor"
  console.log("D. Şablon dosyası yok");
  const D = await yeniBaglam(browser, base, { sablon: "yok" });
  await D.page.goto(base + "/yazismalar.html#sablonlar");
  await D.page.waitForSelector("#sb-root .empty-state h3");
  ok((await D.page.textContent("#sb-root h3")) === "Şablonlar hazırlanıyor", "boş durum: Şablonlar hazırlanıyor");
  await D.page.click("#sek-gecmis");
  ok(await D.page.isVisible("#gecmis"), "geçmiş bölümü yine görünür (kendi sekmesinde)");
  ok(D.errs.length === 0, "konsol/sayfa hatası yok", D.errs);
  await D.ctx.close();

  // E. Sahte şablon (scratchpad, isteğe bağlı)
  if (process.env.SAHTE_SABLON && fs.existsSync(process.env.SAHTE_SABLON)) {
    console.log("E. Sahte şablon dosyası");
    const S = await yeniBaglam(browser, base, { sablon: process.env.SAHTE_SABLON });
    await S.page.goto(base + "/yazismalar.html#sablonlar");
    await S.page.waitForSelector(".tpl-card");
    ok((await S.page.textContent("#sb-lead")).includes("şema hatası"), "bozuk şablon gizlendi ve sayıldı");
    await S.page.click('[data-sablon="it-polimi-ofa"]');
    ok(await S.page.inputValue("#ol-alici") === "test-ofis@example.org", "genel alici.eposta kullanıldı");
    ok(/giugno \d{4}/.test(await S.page.inputValue("#ol-govde")), "İtalyanca şablonda tarih dili it");
    ok(S.errs.length === 0, "konsol/sayfa hatası yok", S.errs);
    await S.ctx.close();
  }

  // F. Duyarlılık: 360/390 px, açık/koyu; taşma yok + ekran görüntüleri
  if (gercekVar) {
    console.log("F. Telefon genişliği");
    for (const [w, theme] of [[390, "dark"], [390, "light"], [360, "dark"]]) {
      const F = await yeniBaglam(browser, base, { width: w, theme });
      await F.page.goto(base + "/yazismalar.html#sablonlar");
      await F.page.waitForSelector(".tpl-card");
      let t = await tasma(F.page);
      ok(t.sw <= t.cw, `${w}px ${theme}: liste taşmıyor (${t.sw}/${t.cw})`, t.wide);
      await F.page.click('[data-sablon="de-uni-ap-yks-teyit"]');
      await F.page.selectOption("#ol-uni", "de-saarland");
      await F.page.click("#ol-taslak");
      await F.page.waitForTimeout(100);
      t = await tasma(F.page);
      ok(t.sw <= t.cw, `${w}px ${theme}: oluşturucu + geçmiş taşmıyor (${t.sw}/${t.cw})`, t.wide);
      if (w === 390) await F.page.screenshot({ path: `${SHOTS}/t5b-yazisma-phone-${theme}.png`, fullPage: true });
      ok(F.errs.length === 0, "konsol/sayfa hatası yok", F.errs);
      await F.ctx.close();
    }
    // Profil sayfası telefonda
    const P = await yeniBaglam(browser, base, { width: 390, theme: "dark" });
    await P.page.goto(base + "/profil.html#iletisim");
    await P.page.waitForSelector("#profile:not([hidden])");
    const t = await tasma(P.page);
    ok(t.sw <= t.cw, `profil 390px koyu taşmıyor (${t.sw}/${t.cw})`, t.wide);
    await P.page.locator("#iletisim").screenshot({ path: `${SHOTS}/t5b-profil-ekleri-phone-dark.png` });
    await P.ctx.close();
  }

  // G. file:// ile açılış (gerçek kullanım)
  console.log("G. file:// açılış");
  const G = await browser.newContext(); await seed(G);
  const gp = await G.newPage(); const gerr = [];
  gp.on("pageerror", e => gerr.push(e.message));
  await gp.goto("file:///" + ROOT + "/yazismalar.html#sablonlar");
  await gp.waitForSelector("#sb-root .tpl-card, #sb-root .empty-state h3");
  ok(gerr.length === 0, "file:// sayfa hatası yok", gerr);
  await G.close();

  await browser.close(); srv.close();
  console.log(`\nyazisma-test: ${gecen} geçti, ${kalan} kaldı`);
  process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
