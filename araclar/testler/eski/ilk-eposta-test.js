// Tur 14 A5 — Üniversiteye ilk e-posta (Ajan 14 Faz 2) + Başvuru sekmeleri + Son tarihler tarayıcı testi.
// Derin bağlantı, misafir yönlendirmesi, 3 öğrenci modeli, eksik alan, kaynaksız alıcı, kopyala / mailto / taslak / gönderildi,
// geçmişten yeniden açma, takip, sekmeler klavye, eski çapalar, K14-5 (süresi dolan tarih), 360 px taşma, ağ isteği yok.
// Çalıştır (node_modules olan çalışma klasöründe): node ilk-eposta-test.js
"use strict";
const { chromium } = require("playwright-core");
const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/hp/Desktop/projelerim/AP MEBERRA";
const SHOTS = path.join(__dirname, "..", "shots");
const EXE = "C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
fs.mkdirSync(SHOTS, { recursive: true });

let gecen = 0, kalan = 0;
function ok(c, ad, detay) { if (c) { gecen++; console.log("  ✓ " + ad); } else { kalan++; console.log("  ✗ " + ad + (detay !== undefined ? "  → " + JSON.stringify(detay).slice(0, 500) : "")); } }

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
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

const PROF = {
  lise: { okul: "Kadıköy Anadolu Lisesi", okulSehir: "İstanbul", dogumTarihi: "2009-03-02", sinif: "11", ogrenciModeli: "lise", ulkeler: ["de", "it"], aktifRota: "de", egitimDili: "en", tamamlandi: true },
  liseEksik: { sinif: "11", ogrenciModeli: "lise", ulkeler: ["de"], aktifRota: "de", egitimDili: "en", tamamlandi: true },
  liseMezun: { okul: "Kadıköy Anadolu Lisesi", okulSehir: "İstanbul", sinif: "mezun", ogrenciModeli: "lise-mezun", mezuniyetYili: "2025", hedefBaslangicYili: "2027", yerlesmeDurumu: "uygun", ulkeler: ["de"], aktifRota: "de", egitimDili: "en", tamamlandi: true },
  uniMezun: { ogrenciModeli: "uni-mezun", sinif: "lisans-mezun", ulkeler: ["de", "nl"], aktifRota: "de", egitimDili: "en", hedefBaslangicYili: "2027", lisansAlani: "Mechanical Engineering", lisansUniversitesi: "Yildiz Technical University", lisansDurumu: "son-sinif", lisansMezuniyetYili: "2027", gpa4: "3.4", dogumTarihi: "2004-03-02", tamamlandi: true }
};
const TUM = "de-technical-university-of-munich", POLIMI = "it-politecnico-di-milano";
const DERIN = id => "yazismalar.html?uni=" + id + "&amac=ilk-iletisim";

(async () => {
  const srv = await sunucu();
  const base = "http://127.0.0.1:" + srv.address().port;
  const host = new URL(base).host;
  const browser = await chromium.launch({ executablePath: EXE });
  const disari = [];
  async function baglam(prof, o = {}) {
    const ctx = await browser.newContext({ viewport: { width: o.width || 1280, height: o.height || 900 }, colorScheme: o.theme || "light" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    if (prof) await ctx.addInitScript(([pr, bugun, panel]) => {
      if (bugun) window.APMEBERRA_BUGUN = bugun;
      const P = "apmeberra-hesap:v1:";
      if (!localStorage.getItem(P + "oturum")) {
        localStorage.setItem(P + "kullanicilar", JSON.stringify([{ id: "utest", ad: "Ayşe", soyad: "Yılmaz", kullaniciAdi: "test", salt: "00", hash: "00", iter: 150000, olusturma: "2026-10-12T00:00:00Z" }]));
        localStorage.setItem(P + "oturum", JSON.stringify({ id: "utest", baslangic: "2026-10-12T00:00:00Z" }));
        localStorage.setItem(P + "aktif", JSON.stringify("utest"));
        localStorage.setItem(P + "profil:utest", JSON.stringify(pr));
        localStorage.setItem("apmeberra:panel:v1", JSON.stringify(panel));
      }
    }, [prof, o.bugun || "2026-10-20", o.panel || { universiteGoruldu: "2026-10-12T00:00:00Z", sinavlarim: ["ap-calculus-ab", "ap-physics-1", "ielts-academic"] }]);
    const p = await ctx.newPage(); p._errs = [];
    p.on("pageerror", e => p._errs.push(e.message));
    p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) p._errs.push("console: " + m.text()); });
    // Portal e-posta GÖNDERMEZ: yerel sunucu dışında hiçbir istek olmamalı
    p.on("request", r => { const u = r.url(); if (!u.startsWith(base) && !/^(data|blob|about):/.test(u)) disari.push(u); });
    return { ctx, p };
  }
  const bekle = async p => { await p.waitForFunction(() => !document.getElementById("ie-grid").hidden || !!document.querySelector("#ie-durum:not([hidden])") || !document.getElementById("ie-bos").hidden); await p.waitForTimeout(80); };
  const oku = p => p.evaluate(() => ({
    sekme: document.querySelector('.yz-sekmeler [aria-selected="true"]').id,
    ulke: document.getElementById("ie-ulke").value, uni: document.getElementById("ie-uni").value,
    konu: document.getElementById("ie-konu").value, govde: document.getElementById("ie-govde").value,
    alici: document.getElementById("ie-alici").textContent, aliciOk: !!document.querySelector("#ie-alici .ie-alici.is-ok"), aliciLink: [...document.querySelectorAll("#ie-alici a")].map(a => a.getAttribute("href")),
    eksik: [...document.querySelectorAll("#ie-eksik [data-eksik]")].map(li => ({ yol: li.dataset.eksik, href: (li.querySelector("a") || { getAttribute: () => null }).getAttribute("href") })),
    sayac: document.getElementById("ie-sayac").textContent, sayacOk: document.getElementById("ie-sayac").classList.contains("is-ok"),
    mailto: document.getElementById("ie-mailto").getAttribute("href"),
    dayanak: document.querySelectorAll("#ie-dayanak li a").length, hatirlat: /kendi e-posta adresinden/.test(document.querySelector(".ie-hatirlat").textContent),
    not: document.getElementById("ie-not").hidden ? "" : document.getElementById("ie-not").textContent,
    url: location.pathname.split("/").pop() + location.search + location.hash,
    durum: document.getElementById("ie-durum").hidden ? "" : document.getElementById("ie-durum").className + " | " + document.getElementById("ie-durum").textContent
  }));
  const depo = p => p.evaluate(() => JSON.parse(localStorage.getItem("apmeberra:yazisma:v1") || '{"kayitlar":[]}').kayitlar);

  // ---------- 1) Misafir: kilitli sayfa, derin bağlantı girişte korunur (K4) ----------
  console.log("1) Misafir yönlendirmesi");
  {
    const { ctx, p } = await baglam(null);
    await p.goto(base + "/" + DERIN(TUM)); await p.waitForURL(/giris\.html/); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({ donus: new URLSearchParams(location.search).get("donus"), ctx: !document.getElementById("auth-context").hidden, metin: document.getElementById("auth-context-text").textContent }));
    ok(r.donus === DERIN(TUM) && r.ctx && /Yazışmalarım/.test(r.metin), "misafir → giris.html?donus=yazismalar.html?uni=…&amac=ilk-iletisim, bağlam kartı", r);
    ok(p._errs.length === 0, "misafir: sayfa hatası yok", p._errs);
    await ctx.close();
  }

  // ---------- 2) Lise öğrencisi: derin bağlantı TUM (kaynaklı alıcı) ----------
  console.log("2) Lise öğrencisi · TUM derin bağlantı");
  {
    const { ctx, p } = await baglam(PROF.lise);
    await p.goto(base + "/" + DERIN(TUM)); await bekle(p);
    let r = await oku(p);
    ok(r.sekme === "sek-ilk" && r.ulke === "de" && r.uni === TUM, "derin bağlantı: İlk e-posta sekmesi, Almanya ve TUM seçili", r);
    ok(/^Prospective bachelor's applicant \(Turkish high school student\)/.test(r.konu) && /Kadıköy Anadolu Lisesi/.test(r.govde) && /AP Calculus AB/.test(r.govde) && !/\[eksik:/.test(r.govde), "lise: İngilizce konu ve profil bilgileriyle dolu gövde (okul, AP sınavları), eksik yok", r.konu);
    ok(r.aliciOk && /studium@tum\.de/.test(r.alici) && r.aliciLink.some(h => /^https:\/\/www\.tum\.de\//.test(h)), "alıcı yalnızca kaynaklı adres: studium@tum.de + kaynak bağlantısı", r.alici);
    ok(r.eksik.length === 0 && r.sayacOk && /^\d+ kelime$/.test(r.sayac) && +r.sayac.split(" ")[0] >= 120 && +r.sayac.split(" ")[0] <= 220, "Bilgiler tamam; kelime sayacı hedef aralıkta (" + r.sayac + ")");
    ok(r.dayanak >= 1 && r.hatirlat && /^mailto:studium@tum\.de\?subject=/.test(r.mailto), "Dayanak listesi (" + r.dayanak + "), 'kendi adresinden gönder' hatırlatması, mailto alıcılı", r.mailto.slice(0, 60));
    // Düzenlenebilir: sayaç canlı güncellenir, yeniden oluştur geri getirir
    await p.fill("#ie-govde", "Short text."); r = await oku(p);
    ok(!r.sayacOk && r.sayac === "2 kelime" && await p.isVisible("#ie-yeniden"), "düzenleme: sayaç canlı (2 kelime, uyarı), 'Şablondan yeniden oluştur' görünür");
    await p.click("#ie-yeniden"); r = await oku(p);
    ok(r.sayacOk && /Dear Admissions Team/.test(r.govde), "Şablondan yeniden oluştur metni geri getirdi");
    // Program (isteğe bağlı) metne girer
    await p.fill("#ie-prog", "Mechanical Engineering"); await p.waitForTimeout(350); r = await oku(p);
    ok(/the Mechanical Engineering programme/.test(r.govde), "program alanı metne girdi");
    await p.fill("#ie-prog", ""); await p.waitForTimeout(350);
    // Kopyala
    await p.click("#ie-kopyala"); await p.waitForSelector("#ie-durum.is-ok");
    const pano = await p.evaluate(() => navigator.clipboard.readText());
    ok(/^Prospective bachelor's applicant/.test(pano) && /Dear Admissions Team/.test(pano), "Kopyala: konu + metin panoya", pano.slice(0, 50));
    // mailto: yalnızca bağlantı; tıklama durumu yazar (gezinme engellenir — gerçek e-posta programı açılmaz)
    await p.evaluate(() => { const a = document.getElementById("ie-mailto"); a.addEventListener("click", e => e.preventDefault(), { once: true }); a.click(); });
    r = await oku(p);
    ok(/is-info/.test(r.durum) && /E-posta programın açılıyor/.test(r.durum), "E-posta programında aç: durum iletisi (gönderim kullanıcıda)", r.durum);
    // Taslak olarak kaydet → apmeberra:yazisma:v1 (E.yeniKayit)
    await p.click("#ie-taslak"); await p.waitForSelector("#ie-durum.is-ok");
    let d = await depo(p);
    ok(d.length === 1 && d[0].sablonId === "ilk-de-lise" && d[0].universiteId === TUM && d[0].durum === "taslak" && d[0].alici === "studium@tum.de" && /^y/.test(d[0].id), "Taslak kaydet: apmeberra:yazisma:v1'e kayıt (ilk-de-lise, TUM, taslak)", d[0]);
    ok((await p.textContent("#sek-gecmis-say")) === "1", "Yazışma geçmişi sekmesi sayacı 1");
    // Gönderildi olarak işaretle (aynı kayıt)
    await p.click("#ie-gonderildi"); await p.waitForTimeout(150);
    d = await depo(p);
    ok(d.length === 1 && d[0].durum === "gonderildi" && !!d[0].gonderim, "Gönderildi olarak işaretle: aynı kayıt gönderildi + tarih", d[0] && d[0].durum);
    // Geçmiş sekmesi → Aç ve düzenle → İlk e-posta sekmesinde açılır
    await p.click("#sek-gecmis");
    ok(await p.isVisible('.mail-item[data-durum="gonderildi"]') && /Üniversiteye ilk e-posta/.test(await p.textContent(".mail-item .mail-meta")), "Geçmiş: kayıt 'Üniversiteye ilk e-posta' etiketiyle");
    await p.click('.mail-item [data-act="ac"]'); await p.waitForTimeout(400); r = await oku(p);
    ok(r.sekme === "sek-ilk" && r.uni === TUM && /Kayıtlı yazışma açıldı/.test(r.durum), "Geçmişten aç: İlk e-posta sekmesinde TUM ve kayıtlı metin", r.durum);
    // Takip: ilk gönderim tarihi geçmişten gelir, takip şablonu seçilir
    await p.check('input[name="ie-amac"][value="takip"]'); await p.waitForTimeout(150); r = await oku(p);
    const takip = await p.inputValue("#ie-takip");
    ok(/amac=takip/.test(r.url) && /^\d{4}-\d{2}-\d{2}$/.test(takip) && !/\[eksik: takip/.test(r.govde), "Takip: ilk gönderim tarihi geçmişten (" + takip + "), adres ?amac=takip", r.url);
    await p.click("#ie-yeniden"); await p.click("#ie-taslak"); await p.waitForSelector("#ie-durum.is-ok");
    d = await depo(p);
    ok(d.length === 2 && d[0].sablonId === "takip-de-lise", "Takip taslağı ayrı kayıt (takip-de-lise)", d.map(x => x.sablonId));
    ok(p._errs.length === 0, "lise: sayfa hatası yok", p._errs);
    await ctx.close();
  }

  // ---------- 3) Kaynaksız alıcı (PoliMi) ----------
  console.log("3) Kaynaksız alıcı");
  {
    const { ctx, p } = await baglam(PROF.lise);
    await p.goto(base + "/" + DERIN(POLIMI)); await bekle(p);
    const r = await oku(p);
    ok(r.uni === POLIMI && !r.aliciOk && /doğrulanmış e-posta adresi yok/.test(r.alici) && r.aliciLink.some(h => /^https:\/\/www\.polimi\.it\//.test(h)), "PoliMi: alıcı yok uyarısı + iletişim/başvuru sayfası bağlantısı", r.alici);
    ok(/^mailto:\?subject=/.test(r.mailto) && /Alıcı adresi boş/.test(await p.textContent("#ie-uyari")), "mailto alıcısız (adres uydurulmaz) ve uyarı", r.mailto.slice(0, 30));
    ok(/Universitaly|CISIA/.test(r.govde) && r.not.length > 0, "İtalya varyantı ve prosedür notu");
    await ctx.close();
  }

  // ---------- 4) Eksik profil alanı ----------
  console.log("4) Eksik alan");
  {
    const { ctx, p } = await baglam(PROF.liseEksik, { panel: { sinavlarim: [] } });
    await p.goto(base + "/" + DERIN(TUM)); await bekle(p);
    const r = await oku(p);
    const okul = r.eksik.find(x => x.yol === "ogrenci.okul");
    ok(okul && okul.href === "profil.html#pf-okul" && /\[eksik: ogrenci\.okul\]/.test(r.govde), "eksik okul: '[eksik: ogrenci.okul]' metinde, 'Profilini tamamla' → profil.html#pf-okul", r.eksik);
    ok(!/AP Calculus/.test(r.govde), "profilde olmayan sınav metne girmez (koşullu blok)");
    await p.click("#ie-gonderildi"); await p.waitForTimeout(100);
    ok((await depo(p)).length === 0 && /is-bad/.test((await oku(p)).durum), "eksikle 'Gönderildi': önce uyarı, kayıt yok");
    await p.click("#ie-gonderildi"); await p.waitForTimeout(100);
    ok((await depo(p)).length === 1, "ikinci basışta işaretlendi");
    await ctx.close();
  }

  // ---------- 5) Üç öğrenci modeli ----------
  console.log("5) Üç model");
  for (const [ad, prof, re] of [["lise mezunu", PROF.liseMezun, /^Prospective bachelor's applicant \(Turkish high school graduate\)/], ["üniversite mezunu", PROF.uniMezun, /^Prospective master's applicant \(Turkish bachelor's degree\)/]]) {
    const { ctx, p } = await baglam(prof, { panel: { sinavlarim: ["ielts-academic"] } });
    await p.goto(base + "/" + DERIN(TUM)); await bekle(p);
    const r = await oku(p);
    ok(re.test(r.konu) && r.eksik.length === 0 && r.aliciOk, ad + ": doğru şablon (" + r.konu.slice(0, 60) + "…), eksik yok", r.eksik);
    await ctx.close();
  }

  // ---------- 6) Sekmeler: klavye, çapalar, varsayılan ----------
  console.log("6) Sekmeler");
  {
    const { ctx, p } = await baglam(PROF.lise);
    await p.goto(base + "/yazismalar.html"); await p.waitForTimeout(500);
    let r = await oku(p);
    ok(r.sekme === "sek-ilk" && r.ulke === "de" && await p.isHidden("#pnl-teyit") && await p.isHidden("#pnl-gecmis"), "varsayılan sekme: İlk e-posta (aktif rota ülkesi seçili)", r);
    await p.focus("#sek-ilk"); await p.keyboard.press("ArrowRight");
    ok(await p.evaluate(() => document.activeElement.id === "sek-teyit" && document.getElementById("sek-teyit").getAttribute("aria-selected") === "true" && !document.getElementById("pnl-teyit").hidden && location.hash === "#teyit"), "ArrowRight → Teyit taslakları (odak, aria-selected, panel, #teyit)");
    await p.keyboard.press("End");
    ok(await p.evaluate(() => document.activeElement.id === "sek-gecmis" && !document.getElementById("pnl-gecmis").hidden), "End → Yazışma geçmişi");
    await p.keyboard.press("Home");
    ok(await p.evaluate(() => document.activeElement.id === "sek-ilk" && document.getElementById("sek-gecmis").tabIndex === -1), "Home → İlk e-posta; kayan tabindex");
    for (const [h, sek] of [["#taslaklar", "sek-teyit"], ["#sablonlar", "sek-teyit"], ["#gecmis", "sek-gecmis"]]) {
      await p.goto(base + "/yazismalar.html" + h); await p.waitForTimeout(300);
      ok((await p.getAttribute('.yz-sekmeler [aria-selected="true"]', "id")) === sek, "eski çapa " + h + " → " + sek);
    }
    await p.goto(base + "/yazismalar.html?sablon=it-uni-cimea-dov"); await p.waitForSelector("#olustur:not([hidden])");
    ok((await p.getAttribute('.yz-sekmeler [aria-selected="true"]', "id")) === "sek-teyit", "?sablon= derin bağlantısı Teyit sekmesinde oluşturucuyu açar");
    await ctx.close();
  }

  // ---------- 7) Son tarihler şeridi + Bugün bağlantısı + K14-5 ----------
  console.log("7) Son tarihler");
  {
    const { ctx, p } = await baglam(PROF.lise);
    await p.goto(base + "/index.html"); await p.waitForTimeout(500);
    ok((await p.getAttribute("#yt-tumu", "href")) === "yazismalar.html#son-tarihler", "Bugün 'Tümü →' → yazismalar.html#son-tarihler");
    await Promise.all([p.waitForURL(/yazismalar\.html/), p.click("#yt-tumu")]); await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ ilk: [...document.querySelectorAll("#st-list .st-item")].map(x => x.dataset.st), metin: document.getElementById("st-list").textContent, gecmis: document.getElementById("st-gecmis").hidden, odak: document.activeElement.id }));
    ok(r.ilk[0] === "ap-kayit" && /AP sınav siparişi son günü/.test(r.metin) && r.ilk.length >= 3 && r.gecmis && r.odak === "son-tarihler", "Son tarihler (20 Ekim): ilk AP sipariş son günü, ≥ 3 tarih, süresi dolan yok, odak şeritte", r);
    const g4 = await p.evaluate(() => ({ gorunen: [...document.querySelectorAll("#st-list .st-item")].filter(x => !x.hidden).length, toplam: document.querySelectorAll("#st-list .st-item").length, btn: !document.getElementById("st-daha").hidden }));
    await p.click("#st-daha");
    const g5 = await p.evaluate(() => ({ gorunen: [...document.querySelectorAll("#st-list .st-item")].filter(x => !x.hidden).length, exp: document.getElementById("st-daha").getAttribute("aria-expanded") }));
    ok(g4.toplam > 4 ? (g4.gorunen === 4 && g4.btn && g5.gorunen === g4.toplam && g5.exp === "true") : (!g4.btn && g4.gorunen === g4.toplam), "Son tarihler: ilk 4 görünür, '+N tarih daha' kalanı açar (" + g4.toplam + " tarih)", { g4, g5 });
    await ctx.close();
    // K14-5: 20 Kasım 2026 — AP sipariş son günü (13 Kasım) geçti → "Süresi doldu" + "henüz açıklanmadı"; geç sipariş yaklaşanlarda
    const c2 = await baglam(PROF.lise, { bugun: "2026-11-20" });
    await c2.p.goto(base + "/yazismalar.html"); await c2.p.waitForTimeout(500);
    const k = await c2.p.evaluate(() => ({ gelen: [...document.querySelectorAll("#st-list .st-item")].map(x => x.dataset.st), gecen: [...document.querySelectorAll("#st-gecmis li")].map(x => x.dataset.st + ": " + x.textContent) }));
    ok(k.gelen.includes("ap-gec-kayit") && !k.gelen.includes("ap-kayit") && k.gecen.length >= 1 && /^ap-kayit: Süresi doldu.*13 Kasım 2026.*Sonraki dönem tarihi henüz açıklanmadı/.test(k.gecen[0]), "K14-5: süresi dolan tarih ayrı satırda 'Süresi doldu' + 'henüz açıklanmadı'; yaklaşanların önüne geçmez", k);
    await c2.ctx.close();
  }

  // ---------- 8) Üniversiteler kartından 1 tık (G2) ----------
  console.log("8) Üniversite kartından");
  {
    const { ctx, p } = await baglam(PROF.lise);
    await p.goto(base + "/universiteler.html?ulke=it&duzey=lisans&dil=en"); await p.waitForSelector(".uni-tablo");
    const kim = await p.getAttribute(".uni-tablo [data-ilk-eposta]", "data-ilk-eposta");
    await Promise.all([p.waitForURL(/yazismalar\.html/), p.click(".uni-tablo [data-ilk-eposta]")]); await bekle(p);
    const r = await oku(p);
    ok(r.uni === kim && r.ulke === "it" && r.konu.length > 20, "Üniversiteler › İlk e-posta (1 tık) → hazır e-posta (" + kim + ")", r.uni);
    await ctx.close();
  }

  // ---------- 9) 360 px ve koyu tema: taşma yok, Kontrol önizlemenin üstünde, ≥ 44 px, alt gezinme Başvuru doğrudan ----------
  console.log("9) 360 px");
  for (const theme of ["light", "dark"]) {
    const { ctx, p } = await baglam(PROF.lise, { width: 360, height: 780, theme });
    await p.goto(base + "/" + DERIN(TUM)); await bekle(p);
    const m = await p.evaluate(() => ({
      ov: document.documentElement.scrollWidth - innerWidth,
      sira: document.querySelector(".ie-kontrol").getBoundingClientRect().top < document.querySelector(".ie-onizleme").getBoundingClientRect().top,
      btn: Math.min(...[...document.querySelectorAll(".ie-actions > *")].map(b => b.getBoundingClientRect().height)),
      sekme: [...document.querySelectorAll(".yz-sekmeler .tab")].every(t => t.getBoundingClientRect().height >= 40),
      bn: (document.querySelector('.bottom-nav a[data-bn="basvuru"]') || { getAttribute: () => null }).getAttribute("href"),
      cur: (document.querySelector('.bottom-nav [data-bn="basvuru"]') || { getAttribute: () => null }).getAttribute("aria-current")
    }));
    ok(m.ov <= 0 && m.sira && m.btn >= 44 && m.sekme, "360 " + theme + ": taşma yok, Kontrol önizlemenin üstünde, düğmeler ≥ 44 px", m);
    ok(m.bn === "yazismalar.html" && m.cur === "page", "360 " + theme + ": alt gezinmede Başvuru doğrudan bağlantı ve etkin", m);
    await p.screenshot({ path: path.join(SHOTS, "t14-ilk-eposta-360-" + theme + ".png"), fullPage: true });
    ok(p._errs.length === 0, "360 " + theme + ": sayfa hatası yok", p._errs);
    await ctx.close();
  }
  {
    const { ctx, p } = await baglam(PROF.lise);
    await p.goto(base + "/" + DERIN(TUM)); await bekle(p);
    await p.screenshot({ path: path.join(SHOTS, "t14-ilk-eposta-1280-light.png"), fullPage: true });
    await ctx.close();
  }

  ok(disari.length === 0, "ağ: yerel dosyalar dışında istek yok (portal e-posta göndermez)", disari.slice(0, 5));
  await browser.close(); srv.close();
  console.log("ilk-eposta-test: " + gecen + " geçti, " + kalan + " kaldı");
  process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
