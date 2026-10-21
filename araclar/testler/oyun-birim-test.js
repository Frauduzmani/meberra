// Oyunlaştırma katmanı (assets/js/oyun.js) saf çekirdeği — Node birim testi.
// XP (lig kuralı), İstanbul günü / ISO hafta, seri koruma, akıllı tekrar kutuları, günün görevleri (tarihe göre belirlenimli),
// rozet koşulları, öğrenme yolu düğümleri; ayrıca oyun.js içindeki YOL listesi gerçek ders sayfalarından yeniden üretilip karşılaştırılır.
// Kullanım (proje klasöründen): node araclar/testler/oyun-birim-test.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const O = require(path.join(ROOT, "assets/js/oyun.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1) İstanbul günü ve ISO hafta
ok(O.istGun("2026-10-20T21:30:00Z") === "2026-10-21", "UTC 21:30 İstanbul'da ertesi gün (UTC+3)");
ok(O.istGun("2026-10-20T20:59:59Z") === "2026-10-20", "UTC 20:59 aynı gün");
ok(O.istGun("bozuk") === null, "geçersiz zaman null");
ok(O.isoHafta("2026-10-21") === "2026-W43", "21 Ekim 2026 → 2026-W43");
ok(O.isoHafta("2026-12-31") === "2026-W53" && O.isoHafta("2027-01-01") === "2026-W53" && O.isoHafta("2027-01-04") === "2027-W01", "yıl dönümü ISO haftaları");
ok(O.isoHafta("2025-12-29") === "2026-W01", "29 Aralık 2025 → 2026-W01");
ok(O.haftaPazartesi("2026-10-25") === "2026-10-19" && O.haftaPazartesi("2026-10-19") === "2026-10-19", "haftanın pazartesisi (Pazar → önceki Pzt)");
ok(O.gunEkle("2026-10-31", 1) === "2026-11-01" && O.gunFark("2026-10-30", "2026-11-02") === 3, "gün ekle / fark");

// 2) XP = lig kuralı (cevap 5, doğru +5, biten deneme 50)
ok(O.XP.soru === 5 && O.XP.dogru === 5 && O.XP.deneme === 50, "XP sabitleri lig kuralıyla aynı");
const lig = fs.readFileSync(path.join(ROOT, "server/lig.js"), "utf8");
const m = /XP\s*=\s*\{\s*soru:\s*(\d+),\s*dogru:\s*(\d+),\s*deneme:\s*(\d+)/.exec(lig);
ok(m && +m[1] === O.XP.soru && +m[2] === O.XP.dogru && +m[3] === O.XP.deneme, "server/lig.js XP ile birebir", m && m[0]);
const pr = { pages: { "ap-calculus": { units: {
  "calc-unit1-quiz-container": { total: 3, answers: { a: { c: true, t: "2026-10-20T09:00:00Z" }, b: { c: false, t: "2026-10-20T09:01:00Z" }, c: { c: true, t: "2026-10-12T09:00:00Z" } } }
} } } };
const cv = O.cevapListesi(pr);
ok(cv.length === 3 && cv.every(x => x.gun), "cevap listesi düzleşir, gün İstanbul'a göre");
const dn = [{ tarih: "2026-10-21T08:00:00Z" }, { tarih: "2026-10-01T08:00:00Z" }, { tarih: null }];
ok(O.xpOzet(cv, dn).xp === 3 * 5 + 2 * 5 + 2 * 50, "toplam lig XP: 3 cevap, 2 doğru, 2 deneme = 125", O.xpOzet(cv, dn));
ok(O.haftaXp(cv, dn, "2026-10-21").xp === 2 * 5 + 1 * 5 + 50, "bu hafta (19–25 Ekim): 2 cevap, 1 doğru, 1 deneme = 65", O.haftaXp(cv, dn, "2026-10-21"));
const oy = { xp: 0, gorevler: { "2026-10-20": { "soru-10": { tamam: true, t: 1 }, hedef: { tamam: true, t: 1 }, "dogru-8": { tamam: false } } } };
ok(O.gorevSayisi(oy) === 1, "görev sayısı: hedef ve tamamlanmamış sayılmaz");
ok(O.toplamXp(cv, dn, oy) === 125 + O.GOREV_XP, "toplam XP = lig XP + görev bonusu");
ok(O.toplamXp(cv, dn, { xp: 9999 }) === 9999, "kayıtlı XP düşmez (sunucu birleştirmesi: en büyük)");

// 3) Seri ve seri koruma
const G = (...g) => new Set(g);
ok(O.seriHesapla(G("2026-10-21", "2026-10-20"), [], "2026-10-21") === 2, "seri: bugün + dün");
ok(O.seriHesapla(G("2026-10-20", "2026-10-18"), ["2026-10-19"], "2026-10-21") === 2, "korunan gün zinciri kesmez, sayılmaz");
ok(O.korumaHakki(false) === 1 && O.korumaHakki(true) === 2, "haftalık hak: ücretsiz 1, Premium 2");
let r = O.korumaUygula(G("2026-10-19", "2026-10-18"), null, "2026-10-21", 1);
ok(esit(r.eklenen, ["2026-10-20"]) && esit(r.seri.donmus, ["2026-10-20"]) && r.seri.hakKullanim["2026-W43"] === 1, "dün kaçırıldı: koruma otomatik, hak 1 kullanıldı", r);
ok(O.seriHesapla(G("2026-10-19", "2026-10-18"), r.seri.donmus, "2026-10-21") === 2, "koruma sonrası seri bozulmadı (2)");
r = O.korumaUygula(G("2026-10-19", "2026-10-18"), r.seri, "2026-10-21", 1);
ok(r.eklenen.length === 0, "tekrar çalıştırmak bir şey değiştirmez (idempotent)");
r = O.korumaUygula(G("2026-10-18"), null, "2026-10-21", 1);
ok(r.eklenen.length === 0, "aynı haftada 2 boş gün, 1 hak: yarım koruma yok", r);
r = O.korumaUygula(G("2026-10-18"), null, "2026-10-21", 2);
ok(esit(r.eklenen, ["2026-10-19", "2026-10-20"]) && r.seri.hakKullanim["2026-W43"] === 2, "Premium: 2 boş gün korunur", r);
r = O.korumaUygula(G("2026-10-18"), { donmus: [], hakKullanim: { "2026-W43": 1 } }, "2026-10-21", 1);
ok(r.eklenen.length === 0, "bu haftanın hakkı bittiyse koruma yok");
r = O.korumaUygula(G("2026-10-17", "2026-10-19"), null, "2026-10-20", 1);
ok(esit(r.eklenen, ["2026-10-18"]) && r.seri.hakKullanim["2026-W42"] === 1, "Pazar boşluğu önceki haftanın (W42) hakkından", r);
r = O.korumaUygula(G(), null, "2026-10-21", 2);
ok(r.eklenen.length === 0, "hiç çalışma yoksa koruma kullanılmaz");
r = O.korumaUygula(G("2026-10-21"), null, "2026-10-21", 2);
ok(r.eklenen.length === 0, "bugün çalışıldı, öncesi boş: korunacak zincir yok");
r = O.korumaUygula(G("2026-10-01"), null, "2026-10-21", 2);
ok(r.eklenen.length === 0, "7 günden eski boşluk geriye dönük korunmaz");
ok(O.korumaKalan({ hakKullanim: { "2026-W43": 1 } }, "2026-10-21", 2) === 1 && O.korumaKalan(null, "2026-10-21", 1) === 1, "kalan hak");
const dRun = O.korumaUygula(G("2026-10-20"), { donmus: ["2026-10-19"], hakKullanim: { "2026-W43": 1 } }, "2026-10-21", 1);
ok(dRun.eklenen.length === 0, "zaten korunmuş gün yeniden sayılmaz");

// 4) Akıllı tekrar (1, 3, 7, 14 gün; 4. kutudan sonra silme izi)
const K = "ap-calculus|q1";
let t = O.tekrarCevap({}, K, false, "2026-10-21", 100);
ok(esit(t.tekrar[K], { kutu: 1, sonraki: "2026-10-22", guncelleme: 100 }) && t.durum === "yeni", "yanlış → kutu 1, yarın", t);
ok(O.tekrarZamani(t.tekrar, "2026-10-21").length === 0 && O.tekrarZamani(t.tekrar, "2026-10-22").length === 1, "vadesi yarın");
ok(O.tekrarSonraki(t.tekrar, "2026-10-21") === "2026-10-22", "sıradaki tekrar tarihi");
let t2 = O.tekrarCevap(t.tekrar, K, true, "2026-10-21", 101);
ok(t2.durum === null && t2.tekrar[K].kutu === 1, "vadesi gelmeden doğru: değişmez");
t2 = O.tekrarCevap(t.tekrar, K, true, "2026-10-22", 102);
ok(t2.tekrar[K].kutu === 2 && t2.tekrar[K].sonraki === "2026-10-25" && t2.durum === "terfi", "kutu 2: +3 gün", t2.tekrar[K]);
t2 = O.tekrarCevap(t2.tekrar, K, true, "2026-10-25", 103);
ok(t2.tekrar[K].kutu === 3 && t2.tekrar[K].sonraki === "2026-11-01", "kutu 3: +7 gün", t2.tekrar[K]);
t2 = O.tekrarCevap(t2.tekrar, K, true, "2026-11-02", 104);
ok(t2.tekrar[K].kutu === 4 && t2.tekrar[K].sonraki === "2026-11-16", "kutu 4: +14 gün (geç gelince bugünden sayılır)", t2.tekrar[K]);
ok(O.tekrarBasari(t2.tekrar) === 3, "3 başarılı tekrar");
t2 = O.tekrarCevap(t2.tekrar, K, true, "2026-11-16", 105);
ok(esit(t2.tekrar[K], { silindi: true, guncelleme: 105 }) && t2.durum === "bitti", "4. kutudan sonra silme izi", t2.tekrar[K]);
ok(O.tekrarZamani(t2.tekrar, "2027-01-01").length === 0 && O.tekrarBasari(t2.tekrar) === 4, "silinen kayıt vadeye girmez; mezun 4 sayılır");
t2 = O.tekrarCevap(t2.tekrar, K, false, "2026-11-20", 106);
ok(t2.tekrar[K].kutu === 1 && !t2.tekrar[K].silindi, "silinmiş soruda yeniden yanlış → kutu 1");
const sira = O.tekrarZamani({ a: { kutu: 2, sonraki: "2026-10-20" }, b: { kutu: 1, sonraki: "2026-10-18" }, c: { kutu: 1, sonraki: "2026-10-25" }, d: { silindi: true } }, "2026-10-21");
ok(esit(sira, ["b", "a"]), "vadesi gelenler en eski önce", sira);
const tohum = O.tekrarTohumla({ "x|1": { kutu: 3, sonraki: "2026-11-01" } }, { "x|1": { resolved: false }, "x|2": { resolved: false }, "x|3": { resolved: true } }, "2026-10-21", 7);
ok(tohum.eklenen === 1 && esit(tohum.tekrar["x|2"], { kutu: 1, sonraki: "2026-10-21", guncelleme: 7 }) && tohum.tekrar["x|1"].kutu === 3, "açık eski yanlışlar bugün tekrara eklenir; kayıtlılar korunur", tohum);

// 5) Günün görevleri: tarihe göre belirlenimli, 3 farklı görev
const g1 = O.gunlukGorevler("2026-10-21"), g1b = O.gunlukGorevler("2026-10-21");
ok(g1.length === 3 && esit(g1, g1b), "aynı gün → aynı 3 görev");
ok(/^soru-(10|15|20)$/.test(g1[0].id) && new Set(g1.map(x => x.id)).size === 3, "ilk görev 'N soru çöz', görevler farklı", g1);
const farkli = new Set(Array.from({ length: 30 }, (_, i) => O.gunlukGorevler(O.gunEkle("2026-10-01", i)).map(x => x.id).join(",")));
ok(farkli.size >= 6, "30 günde görev seti değişir (" + farkli.size + " farklı)");
const tumIdler = new Set(); Array.from({ length: 60 }, (_, i) => O.gunlukGorevler(O.gunEkle("2026-10-01", i)).forEach(x => tumIdler.add(x.id)));
ok(["dogru-8", "ust-uste-5", "tekrar-2", "unite-1"].every(id => tumIdler.has(id)), "havuzdaki her görev zamanla çıkar", [...tumIdler]);
// Açık yanlış görevin hedefinden azsa "2 yanlışını tekrar çöz" çıkmaz; yerine belirlenimli başka görev gelir
const tekrarGunleri = Array.from({ length: 60 }, (_, i) => O.gunEkle("2026-10-01", i)).filter(d => O.gunlukGorevler(d).some(x => x.id === "tekrar-2"));
ok(tekrarGunleri.length > 0 && tekrarGunleri.every(d => {
  const y0 = O.gunlukGorevler(d, 0), y1 = O.gunlukGorevler(d, 1), y2 = O.gunlukGorevler(d, 2);
  return y0.length === 3 && !y0.some(x => x.olcu === "tekrar") && new Set(y0.map(x => x.id)).size === 3 && esit(y0, O.gunlukGorevler(d, 0)) &&
    esit(y0, y1) && esit(y2, O.gunlukGorevler(d));
}), "açık yanlış < 2 → tekrar görevi yerine farklı, belirlenimli görev; ≥ 2 → değişmez (" + tekrarGunleri.length + " gün)");
ok(O.tekrarMevcut({ a: { resolved: false }, b: { resolved: true }, c: {} }, { tekrar: 1 }) === 3 && O.tekrarMevcut(null, null) === 0, "tekrarMevcut: açık hata + bugün düzeltilen");
const prG = { pages: { p: { units: {
  u1: { total: 2, answers: { a: { c: true, t: "2026-10-21T07:00:00Z" }, b: { c: true, t: "2026-10-21T07:01:00Z" } } },
  u2: { total: 5, answers: { a: { c: false, t: "2026-10-21T07:02:00Z" }, b: { c: true, t: "2026-10-21T07:03:00Z" } } },
  u3: { total: 1, answers: { a: { c: true, t: "2026-10-19T07:00:00Z" } } }
} } } };
const bg = O.gunBaglami(O.cevapListesi(prG), prG, { "p|z": { resolved: true, resolvedDate: "2026-10-21T08:00:00Z" }, "p|y": { resolved: true, resolvedDate: "2026-10-20T08:00:00Z" } }, [{ tarih: "2026-10-21T10:00:00Z" }], "2026-10-21");
ok(esit(bg, { soru: 4, dogru: 3, ustUste: 2, tekrar: 1, unite: 1, deneme: 1 }), "günün ölçüleri (soru, doğru, üst üste, düzeltilen, biten ünite, deneme)", bg);
const dur = O.gorevDurumlari([{ id: "soru-10", olcu: "soru", hedef: 10 }, { id: "unite-1", olcu: "unite", hedef: 1 }], bg);
ok(dur[0].deger === 4 && !dur[0].tamam && dur[1].tamam, "görev ilerlemesi ve tamamlanma", dur);

// 6) Rozetler
ok(O.ROZETLER.length >= 12 && new Set(O.ROZETLER.map(x => x.id)).size === O.ROZETLER.length, O.ROZETLER.length + " rozet, kimlikler benzersiz");
const bos = { soru: 0, deneme: 0, seri: 0, uniteBitti: 0, uniteTam: 0, seviye: 0, tekrarBasari: 0, hedefSeri: 0, gorevSay: 0 };
ok(O.yeniRozetler({}, bos).length === 0, "boş veride rozet yok");
ok(esit(O.yeniRozetler({}, Object.assign({}, bos, { soru: 1 })), ["ilk-soru"]), "ilk soru rozeti");
ok(esit(O.yeniRozetler({ rozetler: { "ilk-soru": { t: 1 } } }, Object.assign({}, bos, { soru: 120, seri: 7 })), ["seri-3", "seri-7", "soru-100"]), "kazanılmış rozet yeniden verilmez; seri ve soru eşikleri");
ok(O.hedefSerisi({ gorevler: { "2026-10-01": { hedef: { tamam: true } }, "2026-10-02": { hedef: { tamam: true } }, "2026-10-03": {}, "2026-10-04": { hedef: { tamam: true } } } }) === 2, "hedef serisi: en uzun ardışık");
ok(esit(O.uniteSayilari(prG), { bitti: 2, tam: 2 }), "biten ve kusursuz üniteler", O.uniteSayilari(prG));

// 7) Öğrenme yolu
const liste = O.yolListesi("ap-calculus");
ok(liste.length === 10 && liste[0].no === 1 && liste[0].kutular[0] === "calc-unit1-quiz-container", "Calculus yolu 10 ünite");
const yp = { units: { "calc-unit1-quiz-container": { total: 2, answers: { a: {}, b: {} } }, "calc-unit2-quiz-container": { total: 15, answers: { a: {} } } } };
let d = O.yolDugumleri(liste.slice(0, 4), yp, no => no > 2);
ok(esit(d.map(x => x.durum), ["bitti", "simdi", "kilitli", "kilitli"]), "bitti / sıradaki / kilitli", d.map(x => x.durum));
ok(d[1].yuzde === 7 && d[0].etiket === "1", "yüzde ve etiket", d[1]);
d = O.yolDugumleri(liste.slice(0, 3), yp, () => false);
ok(esit(d.map(x => x.durum), ["bitti", "simdi", "acik"]), "Premium: kilit yok");
ok(O.dersYuzdesi({ units: { a: { total: 10, answers: { x: {}, y: {} } }, b: { total: 10, answers: { z: {}, w: {} } } } }) === 20, "ders yüzdesi (Calculus'ta %20'tesin)");

// 7b) 1.11.0 yeni istasyon (YOL'da soru 0): kayıt ya da sunucu özeti yoksa yolda yok; özet/kayıt gelince görünür
{
  const L = () => O.yolListesi("ap-physics");
  const yeniNo = L().length;
  ok(L()[yeniNo - 1].kutular[0] === "phys-unit8-quiz-container" && L()[yeniNo - 1].soru === 0, "YOL: Physics Unit 8 Fluids yeni istasyon (soru 0)");
  ok(O.yolGorunen(L(), null, null).length === yeniNo - 1, "yeni istasyon onaylı soru yokken yolda gösterilmez");
  const oz = O.yolGorunen(L(), null, { "phys-unit8-quiz-container": 20 });
  ok(oz.length === yeniNo && oz[yeniNo - 1].soru === 20 && oz[yeniNo - 1].no === yeniNo, "sunucu özetinde varsa görünür (soru sayısı özetten, ?unite=N korunur)");
  ok(O.yolGorunen(L(), { units: { "phys-unit8-quiz-container": { total: 5, answers: {} } } }, null).length === yeniNo, "kayıtta sorusu varsa görünür");
}

// 8) YOL listesi gerçek ders sayfalarıyla aynı (unite-birim-test.js ile aynı ayrıştırma; app.js apUniteGrupla)
{
  const src = fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8");
  const bas = src.indexOf("// --- Ders başlıklarının öğrenciye"), son = src.indexOf("// --- İçindekiler (uzun sayfalar)");
  const ctx = { apEsc: x => String(x == null ? "" : x) };
  vm.createContext(ctx);
  vm.runInContext(src.slice(bas, son) + "\nthis.F = { apTocParse, apUniteGrupla, apUniteGorunenAd };", ctx);
  const { apTocParse, apUniteGrupla, apUniteGorunenAd } = ctx.F;
  for (const page of Object.keys(O.YOL)) {
    const h = fs.readFileSync(path.join(ROOT, page + ".html"), "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
    const hm = [...h.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)];
    const g = apUniteGrupla(hm.map(x => ({ baslik: apTocParse(x[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim()) })));
    const blokOnce = pos => { let b = -1; hm.forEach((x, i) => { if (x.index < pos) b = i; }); return b; };
    const kut = [...h.matchAll(/id="([^"]*quiz-container)"/g)].map(x => ({ id: x[1], u: g.uniteler.find(u => u.bloklar.indexOf(blokOnce(x.index)) >= 0) }));
    const beklenen = g.uniteler.map(u => [apUniteGorunenAd(u.baslik), u.num, u.ders || "", kut.filter(k => k.u === u).map(k => k.id)]);
    const var_ = O.YOL[page].map(u => u.slice(0, 4));
    ok(esit(var_, beklenen), page + ": öğrenme yolu ünite listesi sayfayla aynı (" + beklenen.length + " ünite)", beklenen);
  }
}

// 1.4.0 maskot/hareket: kutlamalar tek kuyruktan (kutlama.js); oyun.js'te kendi balon/konfeti kopyası kalmadı;
// büyük anlar yalnızca ünite (ve seri eşiği/deneme bandı canli.js'te), günlük hedef ve rozet küçük balon.
{
  const src = fs.readFileSync(path.join(ROOT, "assets/js/oyun.js"), "utf8");
  ok(!/function konfeti|function toast\(|requestAnimationFrame\(kare\)|getContext\("2d"\)/.test(src), "oyun.js: kendi konfeti/balon kodu yok");
  ok(/window\.MeberraKutlama\.kutla\(/.test(src) && !/\bkutla\("[^"]/.test(src), "oyun.js: tüm kutlamalar nesneyle MeberraKutlama kuyruğuna gider");
  const unite = /addEventListener\("meberra:unite-bitti"[\s\S]*?\n  \}\);/.exec(src);
  ok(unite && /tur: "unite"/.test(unite[0]) && /paylas:/.test(unite[0]) && /ad: ilkAd\(\)/.test(unite[0]) && /xp:/.test(unite[0]), "ünite bitti: büyük kart + XP + paylaşım (yalnız ilk ad)");
  ok(/tur: "hedef", buyuk: false/.test(src) && /tur: "rozet", buyuk: false/.test(src), "günlük hedef ve rozet küçük balon (ekranın tek büyük anı değil)");
  ok(!/data-sayi/.test(src), "Bugün: açılışta sayı sayacı yok (sakin ekran)");
  const css = fs.readFileSync(path.join(ROOT, "assets/css/oyun.css"), "utf8");
  ok(!/\.oy-toast|\.oy-konfeti/.test(css), "oyun.css: eski balon/konfeti stilleri kaldırıldı");
  const C = require(path.join(ROOT, "assets/js/canli.js"));
  const dug = O.yolDugumleri(O.yolListesi("ap-physics"), null, no => no > 2);
  const h = C.yolHtml(dug, { mod: "serit", sutun: 5, adres: "ap-physics.html" });
  ok((h.match(/class="cn-dugum__git"/g) || []).length === dug.length && /\?unite=1"/.test(h), "öğrenme yolu düğümleri canli.js kıvrımlı yoluna birebir aktarılır");
}

// 1.19.0 günlük hedef türü: "dakika" odak sayacı dakikalarını (odakDk) sayar; varsayılan/soru türü soru sayısını
{
  const g = "2026-10-21";
  ok(esit(O.hedefIlerleme({ hedef: { tur: "dakika", miktar: 25 }, odakDk: { [g]: 30, "2026-10-20": 99 } }, 4, g), { tur: "dakika", miktar: 25, deger: 30, birim: "dakika" }), "dakika hedefi: bugünkü odakDk");
  ok(O.hedefIlerleme({ hedef: { tur: "dakika", miktar: 7 } }, 4, g).miktar === 25 && O.hedefIlerleme({ hedef: { tur: "dakika" } }, 4, g).deger === 0, "dakika hedefi: geçersiz miktar 25, odak yoksa 0");
  ok(esit(O.hedefIlerleme({ hedef: { tur: "soru", miktar: 20 }, odakDk: { [g]: 30 } }, 4, g), { tur: "soru", miktar: 20, deger: 4, birim: "soru" }), "soru hedefi odakDk saymaz");
  ok(O.hedefIlerleme({}, 3, g).miktar === 10, "hedef seçilmemiş: 10 soru");
}

console.log("SONUC: " + pass + " gecti, " + fail + " kaldi.");
process.exit(fail ? 1 : 0);
