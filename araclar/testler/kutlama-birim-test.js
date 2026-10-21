// Kutlama kuyruğu (assets/js/kutlama.js) ve maskot (assets/js/maskot.js) saf çekirdeği — Node birim testi.
// Kuyruk önceliği / birleştirme / sınır, paylaşım kartı yerleşimi, sayaç eğrisi, maskot SVG üretimi.
// Kullanım (proje klasöründen): node araclar/testler/kutlama-birim-test.js
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const K = require(path.join(ROOT, "assets/js/kutlama.js"));
const M = require(path.join(ROOT, "assets/js/maskot.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };

// 1) Normalleştirme ve büyük/küçük ayrımı
ok(K.olayNormal({ tur: "bilinmez" }).tur === "rozet", "bilinmeyen tür → rozet");
ok(K.olayNormal({ tur: "gorev" }).baslik === "Görev tamam!", "görev varsayılan başlığı");
ok(K.olayNormal({ tur: "xp", xp: 10 }).baslik === "+10 XP", "xp varsayılan başlığı");
ok(K.buyukMu(K.olayNormal({ tur: "unite" })) && K.buyukMu(K.olayNormal({ tur: "deneme" })) && K.buyukMu(K.olayNormal({ tur: "hedef" })), "ünite/deneme/hedef büyük kart");
ok(!K.buyukMu(K.olayNormal({ tur: "xp" })) && !K.buyukMu(K.olayNormal({ tur: "gorev" })), "xp/görev balon");
ok(K.buyukMu(K.olayNormal({ tur: "seri", gun: 7 })) && K.buyukMu(K.olayNormal({ tur: "seri", gun: 30 })) && K.buyukMu(K.olayNormal({ tur: "seri", gun: 100 })), "seri 7/30/100 büyük");
ok(!K.buyukMu(K.olayNormal({ tur: "seri", gun: 8 })), "seri 8 balon");
ok(K.buyukMu(K.olayNormal({ tur: "xp", buyuk: true })) && !K.buyukMu(K.olayNormal({ tur: "unite", buyuk: false })), "buyuk alanı önceliklidir");
ok(K.ifadeSec(K.olayNormal({ tur: "unite" })) === "kutlama" && K.ifadeSec(K.olayNormal({ tur: "xp" })) === "sevincli" && K.ifadeSec(K.olayNormal({ tur: "xp", ifade: "selam" })) === "selam", "ifade seçimi");

// 2) Kuyruk: birleştirme
let q = [];
const ekle = (o) => { const r = K.kuyrugaEkle(q, o, 5); q = r.kuyruk; return r; };
const r1 = ekle({ tur: "gorev", metin: "10 soru", xp: 20, bekleyenler: ["a"] });
const r2 = ekle({ tur: "gorev", metin: "hedef", xp: 20, bekleyenler: ["b"] });
ekle({ tur: "gorev", metin: "tekrar", xp: 20, bekleyenler: ["c"] });
ok(!r1.birlesti && r2.birlesti && q.length === 1, "üç görev tek öğede", q.length);
ok(q[0].adet === 3 && q[0].baslik === "3 görev tamam!" && q[0].xp === 60, "birleşik başlık ve XP toplamı", q[0]);
ok(q[0].bekleyenler.join("") === "abc", "tüm Promise çözücüleri korunur");
ekle({ tur: "xp", xp: 10 }); ekle({ tur: "xp", xp: 5 });
ok(q.length === 2 && q[1].xp === 15 && q[1].baslik === "+15 XP", "xp'ler toplanır", q[1]);
const r3 = ekle({ tur: "rozet", baslik: "Erkenci", metin: "x", bekleyenler: ["d"] });
const r4 = ekle({ tur: "rozet", baslik: "Erkenci", metin: "x", bekleyenler: ["e"] });
ok(!r3.birlesti && r4.birlesti && q.length === 3 && q[2].bekleyenler.join("") === "de", "aynı rozet yinelenmez");

// 3) Kuyruk: sınır ve öncelik
const once = q.slice();
ok(K.kuyrugaEkle(once, { tur: "unite", baslik: "U" }).kuyruk !== once && once.length === 3, "girdi kuyruğu değişmez");
q = [];
["deneme", "unite", "hedef", "seri", "rozet"].forEach((t, i) => ekle({ tur: t, baslik: t + i, gun: 7 }));
let r = ekle({ tur: "xp", xp: 10 });
ok(q.length === 5 && r.dusen.length === 1 && r.dusen[0].tur === "xp", "dolu kuyrukta yeni düşük öncelikli (xp) düşer", r.dusen.map(d => d.tur));
r = ekle({ tur: "unite", baslik: "U2" });
ok(q.length === 5 && r.dusen[0].tur === "rozet" && q.some(x => x.baslik === "U2"), "yeni büyük olay için en düşük (rozet) düşer", q.map(x => x.tur));
q = [];
["unite", "rozet", "rozet", "seri", "deneme"].forEach((t, i) => ekle({ tur: t, baslik: t + i }));
r = ekle({ tur: "hedef", baslik: "H" });
ok(r.dusen[0].tur === "rozet" && r.dusen[0].baslik === "rozet2" && q.filter(x => x.tur === "rozet").length === 1, "eşitlikte en yeni yinelenen düşer", r.dusen[0]);
ok(K.kuyrugaEkle([], { tur: "xp" }).kuyruk.length === 1 && K.KUYRUK_EN_COK === 5, "varsayılan sınır 5");
// Demo senaryosu: 6 olay → 4 öğe (xp, 3 görev, ünite, rozet)
q = [];
[{ tur: "xp", xp: 10 }, { tur: "gorev" }, { tur: "gorev" }, { tur: "unite", baslik: "Ü" }, { tur: "gorev" }, { tur: "rozet", baslik: "R" }].forEach(ekle);
ok(q.map(x => x.tur).join(",") === "xp,gorev,unite,rozet" && q[1].baslik === "3 görev tamam!", "demo: 6 olay → 4 gösterim, görevler birleşik", q.map(x => x.baslik));

// 4) Duyuru metni
ok(K.duyuruMetni(K.olayNormal({ tur: "unite", baslik: "Ünite tamam!", metin: "Harika.", xp: 50 })) === "Ünite tamam! Harika. +50 XP", "duyuru noktalaması yinelenmez");
ok(K.duyuruMetni(K.olayNormal({ tur: "rozet", baslik: "Rozet", metin: "Erkenci" })) === "Rozet. Erkenci", "duyuru: eksik nokta eklenir");

// 5) Sayaç eğrisi
ok(K.yumusat(0) === 0 && K.yumusat(1) === 1 && K.yumusat(-1) === 0 && K.yumusat(2) === 1, "yumusat uçlar ve sıkıştırma");
let artan = true; for (let t = 0.05; t <= 1; t += 0.05) if (K.yumusat(t) < K.yumusat(t - 0.05)) artan = false;
ok(artan && K.yumusat(0.5) > 0.5, "yumusat tekdüze artar ve yavaşlayarak biter", K.yumusat(0.5));
ok(K.sayiAra(100, 200, 0) === 100 && K.sayiAra(100, 200, 1) === 200 && K.sayiAra(100, 200, 0.5) === 188 && K.sayiAra(50, 0, 1) === 0, "sayiAra tam sayı ara değerler (geri sayım dahil)");

// 6) Paylaşım kartı yerleşimi (saf; yaklaşık ölçü)
ok(K.ilkAd("  Elif Naz Yılmaz ") === "Elif" && K.ilkAd("") === "" && K.ilkAd("<b>Ali") === "bAli" && K.ilkAd("Ayşe@x.com") === "Ayşexcom", "yalnızca ilk ad, işaretler atılır");
let d = K.paylasDuzeni({ baslik: "Calculus'ta %40!", alt: "Ünite 3 tamam", yuzde: 40, ders: "AP Calculus AB", ad: "Elif Yılmaz" });
ok(d.G === 1080 && d.Y === 1920 && d.ad === "Elif" && d.ders === "AP Calculus AB", "kart boyutu, ilk ad, ders");
ok(d.baslik.punto === 150 && d.baslik.satirlar.length <= 2, "kısa başlık en büyük puntoda", d.baslik);
ok(d.yuzde.metin === "%40" && d.yuzde.deger === 40, "yüzde Türkçe biçimde (%40)");
ok(d.maskot.boyut === 560 && d.maskot.y >= 100, "kısa içerikte maskot tam boy", d.maskot);
const uzun = K.paylasDuzeni({ baslik: "AP Physics 1'de otuz günlük kesintisiz çalışma serisi başarıyla tamamlandı ve rekor kırıldı", alt: "Her gün en az bir soru çözdün; disiplin kazanır ve sen bunu kanıtladın. Böyle devam et!", yuzde: 140, ders: "AP Physics 1" });
ok(uzun.baslik.satirlar.length <= 3 && uzun.baslik.punto < 150, "uzun başlık küçülür, en çok 3 satır", uzun.baslik);
ok(uzun.alt.satirlar.length <= 3, "alt metin en çok 3 satır", uzun.alt.satirlar);
ok(uzun.yuzde.deger === 100, "yüzde 0–100 aralığına kırpılır");
ok(uzun.bitis <= 1700 && uzun.bitis < uzun.slogan.y - 40, "içerik alt bilgiyle çakışmaz", uzun.bitis);
ok(uzun.maskot.boyut < 560 && uzun.maskot.y + uzun.maskot.boyut <= uzun.baslik.y, "taşmada maskot küçülür ve metnin üstünde kalır", uzun.maskot);
const olcAll = (m, p) => m.length * p * 0.58;
let tasan = false;
[d, uzun].forEach(x => x.baslik.satirlar.forEach(s => { if (olcAll(s, x.baslik.punto) > 920 + 1) tasan = true; }));
ok(!tasan, "başlık satırları 920 px'e sığar");
const asiri = K.sigdir("Ç".repeat(200), 920, [150, 76], 3, olcAll, true);
ok(asiri.satirlar.length === 3 && /…$/.test(asiri.satirlar[2]), "sığmayan metin üç nokta ile kesilir");
ok(K.paylasDuzeni({}).baslik.satirlar[0] === "Harika iş!" && K.paylasDuzeni({}).yuzde === null && K.paylasDuzeni({}).ad === null, "boş paylaşım varsayılanları");

// 7) Maskot SVG
ok(M.MASKOT_ADI === "Tilo" && M.IFADELER.length === 6, "maskot adı ve 6 ifade");
M.IFADELER.forEach(f => {
  const s = M.html(f, { boyut: 64 });
  ok(/^<svg[^>]+viewBox="0 0 200 200"/.test(s) && s.includes("maskot--" + f) && /width="64"/.test(s) && (s.match(/<svg/g) || []).length === 1, "html(" + f + ") tek SVG, doğru sınıf ve boyut");
});
const a1 = M.html("sevincli"), a2 = M.html("sevincli");
const id1 = /clipPath id="([^"]+)"/.exec(a1)[1], id2 = /clipPath id="([^"]+)"/.exec(a2)[1];
ok(id1 !== id2, "her örnekte benzersiz clipPath kimliği");
ok(M.html("bilinmez").includes("maskot--sevincli"), "bilinmeyen ifade → sevincli");
ok(M.html("selam", { etiket: false }).includes('aria-hidden="true"') && M.html("selam").includes('aria-label="Tilo el sallıyor"'), "erişilebilir ad / dekoratif kip");
ok(M.html("uykulu", { sadeceBas: true }).includes('viewBox="20 -4 160 160"') && !M.html("uykulu", { sadeceBas: true }).includes("mk-kuyruk"), "yalnız baş varyantı");
ok(M.html("kutlama", { animasyon: false }).indexOf("maskot--anim") < 0, "animasyon: false sınıfı kaldırır");
ok(/<mask/.test(M.tekRenk({ renk: "#5B3DF5" })) && M.tekRenk({ renk: "#5B3DF5" }).includes('fill="#5B3DF5"'), "tek renkli varyant");
ok(M.kisalt("a ".repeat(80), 90).length <= 90 && M.kisalt("kısa", 90) === "kısa" && /…$/.test(M.kisalt("kelime ".repeat(30), 90)), "balon metni ~90 karakterde kısaltılır");

console.log("\n" + pass + " geçti, " + fail + " başarısız");
process.exit(fail ? 1 : 0);
