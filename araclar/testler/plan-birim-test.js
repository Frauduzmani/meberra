// 1.18.0 Kişisel çalışma planı motoru (assets/js/plan-motor.js) birim testi.
// Kullanım (proje klasöründen): node araclar/testler/plan-birim-test.js
// Denetlenen: haftalık görev sayısı, CED ağırlığına göre ünite dağılımı, zayıf ünite tekrarı, son 6 hafta tam sınav (2 haftada bir),
// son 2 hafta yalnızca tekrar, derslerin dönüşümlü sıralanması, devretme, durum (önde/yolunda/geride), tarih uydurmama, tamamMi.
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const M = require(path.join(ROOT, "assets/js/plan-motor.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };

function ders(k, gun, agirliklar, o) {
  return Object.assign({
    ders: k, ad: k, hedef: 4, sinav: gun ? { gun, yil: +gun.slice(0, 4), kesin: true } : { gun: null, yil: 2028, kesin: false },
    denemeKodu: k, denemeLink: "/deneme?ders=" + k, tamLink: "/deneme?tam=" + k, frqLink: "/frq?ders=" + k, link: "/ders/" + k,
    uniteler: agirliklar.map((w, i) => ({ id: k + "#" + (i + 1), no: i + 1, ad: "Ünite " + (i + 1), agirlik: w, kapsam: 0, dogruluk: null, cevap: 0, soru: 20, kilitli: i >= 2, link: "/ders/" + k + "?unite=" + (i + 1) }))
  }, o || {});
}
const BUGUN = "2026-10-21";
const A = ders("calculus-ab", "2027-05-10", [11, 11, 11, 12.5, 16.5, 18.5, 9, 12.5]);
const C = ders("chemistry", "2027-05-06", [8, 8, 20, 8, 8, 8, 8, 13, 8]);

// 1) Tarih yardımcıları
ok(M.pazartesi("2026-10-21") === "2026-10-19" && M.pazartesi("2026-10-19") === "2026-10-19" && M.pazartesi("2026-10-25") === "2026-10-19", "pazartesi");
ok(M.kalanHafta("2027-05-10", "2027-05-10") === 1 && M.kalanHafta("2027-05-03", "2027-05-10") === 2 && M.kalanHafta("2027-05-17", "2027-05-10") === 0, "kalanHafta: sınav haftası 1");
ok(M.gorevSayisi(3) === 2 && M.gorevSayisi(5) === 3 && M.gorevSayisi(8) === 4 && M.gorevSayisi(12) === 5 && M.gorevSayisi(99) === 3, "saat → görev sayısı (varsayılan 5 saat)");
ok(M.trTarih("2027-05-10") === "10 Mayıs 2027" && M.trTarih("2027-02-30") === "", "trTarih");

// 2) Plan iskeleti
const p = M.planla({ bugun: BUGUN, saat: 5, dersler: [A, C], kilometre: [{ gun: "2026-11-13", ad: "Kayıt son günü", tur: "kayit" }, { gun: "2026-01-01", ad: "Geçmiş", tur: "kayit" }] });
ok(p.haftalar[0].bas === "2026-10-19", "ilk hafta bu haftanın pazartesisi");
const son = p.haftalar[p.haftalar.length - 1];
ok(son.bas <= "2027-05-10" && son.bit >= "2027-05-10", "son hafta en geç sınavı içerir", son);
ok(p.haftalar.every(h => h.gorevler.length >= 2 && h.gorevler.length <= 5), "her hafta 2–5 görev");
ok(p.haftalar.every(h => h.gorevler.length === 3), "5 saat → haftada 3 görev");
ok(p.haftalar.some(h => h.kilometre.some(k => k.gun === "2026-11-13")) && !p.haftalar.some(h => h.kilometre.some(k => k.ad === "Geçmiş")), "kilometre taşı doğru haftada, geçmiş olan yok");
ok(p.haftalar.some(h => h.kilometre.some(k => k.tur === "sinav" && k.gun === "2027-05-06")), "sınav günü kilometre taşı");
ok(p.sinavlar[0].ders === "chemistry" && p.sinavlar[0].kalanGun === M.gunFark(BUGUN, "2027-05-06"), "en yakın sınav ve kalan gün");
const ids = p.haftalar.map(h => h.gorevler.map(g => g.id)); ok(ids.every(l => new Set(l).size === l.length), "hafta içinde görev kimlikleri tekil");

// 3) Dönüşümlü dersler
const dersSirasi = p.haftalar.slice(0, 8).map(h => h.gorevler.map(g => g.ders));
ok(dersSirasi.every(l => l.indexOf("calculus-ab") >= 0 && l.indexOf("chemistry") >= 0), "her hafta iki ders de var (interleave)", dersSirasi);
ok(dersSirasi[0][0] !== dersSirasi[1][0], "haftanın ilk dersi dönüşümlü", dersSirasi.slice(0, 2));

// 4) Ağırlıklar: yüksek CED ağırlıklı ünite daha çok görev alır
const tum = p.haftalar.flatMap(h => h.gorevler);
const say = id => tum.filter(g => g.unite && g.unite.id === id).length;
// Ücretsiz planda kilitli Ünite 3 (%20) açık Ünite 2'nin önüne geçmez; ilk haftanın ünite görevleri açık ünitelerden
ok(say("chemistry#2") >= say("chemistry#3"), "Ücretsiz planda açık Ünite 2 kilitli Ünite 3'ten önce", [say("chemistry#2"), say("chemistry#3")]);
ok(p.haftalar[0].gorevler.filter(g => g.tur === "unite").every(g => !g.kilitli), "ilk haftanın ünite görevleri kilitsiz", p.haftalar[0].gorevler.map(g => g.id + (g.kilitli ? "🔒" : "")));
ok(say("calculus-ab#6") >= say("calculus-ab#7"), "Calculus Ünite 6 (%18.5) ≥ Ünite 7 (%9)", [say("calculus-ab#6"), say("calculus-ab#7")]);
const ilkUnite = p.haftalar.slice(0, 10).flatMap(h => h.gorevler).filter(g => g.tur === "unite").map(g => g.unite.id);
ok(new Set(ilkUnite).size >= 8, "ilk haftalarda farklı üniteler (aynı ünite üst üste değil)", ilkUnite);
ok(tum.some(g => g.kilitli) && tum.some(g => !g.kilitli), "kilitli üniteler planda (Premium ile) — açıklarla birlikte");
ok(tum.some(g => g.tur === "deneme") && tum.some(g => g.tur === "frq"), "ders denemesi ve FRQ görevleri var");

// 5) Son 6 hafta / son 2 hafta kuralları (ders başına)
p.haftalar.forEach(h => {
  [A, C].forEach(d => {
    const k = M.kalanHafta(h.bas, d.sinav.gun), dg = h.gorevler.filter(g => g.ders === d.ders);
    if (k <= 2 && k >= 1 && dg.length) ok(dg.every(g => g.tur === "tekrar"), "son 2 hafta yalnızca tekrar: " + d.ders + " " + h.bas, dg.map(g => g.tur));
    if ((k === 6 || k === 4) && dg.length) ok(dg.filter(g => g.tur === "tam").length === 1, "tam sınav haftası (kalan " + k + "): " + d.ders, dg.map(g => g.tur));
    if (k > 6 || k === 5 || k === 3) ok(!dg.some(g => g.tur === "tam"), "tam sınav yalnızca kalan 6 ve 4. haftada: " + d.ders + " " + k);
  });
});
ok(son.evre === "tekrar" && p.haftalar[0].evre === "calisma", "evreler: başta çalışma, sonda tekrar");

// 6) Zayıf ünite tekrarı
const Z = ders("biology", "2027-05-03", [10, 10, 10, 10]);
Z.uniteler[1].cevap = 12; Z.uniteler[1].dogruluk = 33; Z.uniteler[1].kapsam = 60;
const pz = M.planla({ bugun: BUGUN, saat: 8, dersler: [Z] });
const ilk3 = pz.haftalar.slice(0, 3).flatMap(h => h.gorevler);
ok(ilk3.some(g => g.tur === "tekrar" && g.unite && g.unite.id === "biology#2"), "zayıf ünite (%33) erken tekrar görevi alır", ilk3.map(g => g.tur + ":" + (g.unite && g.unite.id)));
ok(pz.haftalar[0].gorevler.length === 4, "8 saat → 4 görev (tek ders)");

// 7) Devretme
const devreden = [
  Object.assign({}, p.haftalar[0].gorevler[0], { hafta: "2026-10-12", ilkHafta: "2026-10-12", id: "2026-10-12:unite:calculus-ab:calculus-ab#1" }),
  Object.assign({}, p.haftalar[0].gorevler[1], { hafta: "2026-10-12", ilkHafta: "2026-10-12", id: "2026-10-12:unite:chemistry:chemistry#1" })
];
const pd = M.planla({ bugun: BUGUN, saat: 5, dersler: [A, C], devreden, buHafta: [], yenile: true });
ok(pd.haftalar[0].gorevler.length === 3 && pd.haftalar[0].gorevler[0].devir && pd.haftalar[0].gorevler[0].id === devreden[0].id, "devreden görevler haftanın başına, toplam görev sayısı korunur", pd.haftalar[0].gorevler.map(g => g.id));
const cok = [];
for (let i = 0; i < 7; i++) cok.push(Object.assign({}, devreden[0], { id: "2026-10-05:x:" + i, ilkHafta: "2026-10-05" }));
const pc = M.planla({ bugun: BUGUN, saat: 5, dersler: [A, C], devreden: cok, buHafta: [], yenile: true });
ok(pc.haftalar[0].gorevler.length === 5 && pc.haftalar[1].gorevler.filter(g => g.devir).length === 2, "haftada en çok 5; fazlası bir sonraki haftaya devreder", [pc.haftalar[0].gorevler.length, pc.haftalar[1].gorevler.filter(g => g.devir).length]);
const sabit = p.haftalar[0].gorevler.map(g => Object.assign({}, g, { tamam: true }));
const ps = M.planla({ bugun: BUGUN, saat: 12, dersler: [A, C], buHafta: sabit, yenile: false });
ok(ps.haftalar[0].gorevler.length === 3 && ps.haftalar[0].gorevler.every(g => g.tamam), "dondurulmuş hafta olduğu gibi kalır (yenile: false)");
ok(ps.haftalar[1].gorevler.length === 5, "süre değişimi gelecek haftalara hemen yansır");

// 8) Durum
const d0 = M.durum({ gorevSayisi: 3, haftaGunu: 0, buHaftaToplam: 3, buHaftaTamam: 0 });
ok(d0.durum === "yolunda", "hafta başı, hiç görev yok → yolunda", d0);
const d1 = M.durum({ gorevSayisi: 3, haftaGunu: 3, gecmisPlanlanan: 6, gecmisTamam: 3, buHaftaToplam: 3, buHaftaTamam: 0 });
ok(d1.durum === "geride" && d1.gun >= 7 && /geride · \d+ gün/.test(d1.metin), "3 görev borç → geride ~10 gün", d1);
const d2 = M.durum({ gorevSayisi: 3, haftaGunu: 1, gecmisPlanlanan: 3, gecmisTamam: 3, buHaftaToplam: 3, buHaftaTamam: 3 });
ok(d2.durum === "onde" && d2.gun >= 2, "hafta görevleri erkenden bitti → önde", d2);
ok(M.durum({ gorevSayisi: 3, haftaGunu: 2, buHaftaToplam: 3, buHaftaTamam: 1 }).durum === "yolunda", "orantılı ilerleme → yolunda");

// 9) Tarih uydurmama: kesin tarihi olmayan yıl
const P8 = M.planla({ bugun: BUGUN, saat: 5, dersler: [ders("physics-1", null, [10, 10, 10])] });
ok(P8.sinavlar[0].gun === null && P8.sinavlar[0].etiket === "Mayıs 2028" && P8.sinavlar[0].kalanGun === null, "kesin tarih yoksa gün yok, etiket Mayıs 2028", P8.sinavlar[0]);
ok(!P8.haftalar.some(h => h.kilometre.some(k => k.tur === "sinav")), "kesin olmayan sınav için kilometre taşı uydurulmaz");
ok(P8.haftalar[P8.haftalar.length - 1].bit >= "2028-05-01" && P8.haftalar[P8.haftalar.length - 1].bas <= "2028-05-01", "ufuk Mayıs başı");
ok(M.planla({ bugun: "2027-06-01", dersler: [A] }).bos === "sinav-gecti" && M.planla({ bugun: BUGUN, dersler: [] }).bos === "ders-yok", "boş planlar");

// 10) tamamMi
const gU = { tur: "unite", ilkHafta: "2026-10-19", unite: { id: "calculus-ab#1" }, hedefSoru: 10, ders: "calculus-ab" };
const cev = n => Array.from({ length: n }, () => ({ unite: "calculus-ab#1", ders: "calculus-ab", gun: "2026-10-20" }));
ok(M.tamamMi(gU, { cevaplar: cev(10) }) && !M.tamamMi(gU, { cevaplar: cev(9) }), "ünite görevi 10 soruda tamam");
ok(!M.tamamMi(gU, { cevaplar: cev(10).map(c => Object.assign(c, { gun: "2026-10-18" })) }), "görev haftasından önceki çalışma sayılmaz");
ok(M.tamamMi({ tur: "deneme", ilkHafta: "2026-10-19", denemeKodu: "chemistry" }, { denemeler: [{ kod: "chemistry", tam: false, gun: "2026-10-21" }] }), "deneme görevi");
ok(!M.tamamMi({ tur: "tam", ilkHafta: "2026-10-19", denemeKodu: "chemistry" }, { denemeler: [{ kod: "chemistry", tam: false, gun: "2026-10-21" }] }), "ders denemesi tam sınav sayılmaz");
ok(M.tamamMi({ tur: "frq", ilkHafta: "2026-10-19", ders: "chemistry" }, { frq: [{ ders: "chemistry", gun: "2026-10-22" }] }), "FRQ görevi");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
