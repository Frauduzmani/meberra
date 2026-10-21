// 1.16.0 grafik yardımcıları (assets/js/grafik.js) saf çekirdeği — Node birim testi.
// Ölçek, tikler, yol üretimi, kayan doğruluk, ısı eşikleri/basamakları, takvim haftaları, halka, yorum, ince tahmin.
// Kullanım (proje klasöründen): node araclar/testler/grafik-birim-test.js
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const G = require(path.join(ROOT, "assets/js/grafik.js"));
const I = require(path.join(ROOT, "server/ilerleme.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Ölçek
const s = G.olcek(0, 100, 200, 0);
ok(s(0) === 200 && s(100) === 0 && s(50) === 100, "olcek: ters yönlü y ekseni", [s(0), s(50), s(100)]);
ok(s.ters(100) === 50 && s.ters(200) === 0, "olcek.ters");
ok(G.olcek(5, 5, 0, 10)(5) === 5, "olcek: tek değerli alan ortaya düşer");

// Tikler
ok(esit(G.tikler(0, 100, 5), [0, 25, 50, 75, 100]), "tikler 0–100", G.tikler(0, 100, 5));
ok(esit(G.tikler(1, 5, 5), [1, 2, 3, 4, 5]), "tikler 1–5", G.tikler(1, 5, 5));
ok(esit(G.tikler(0, 37, 3), [0, 20]) || esit(G.tikler(0, 37, 3), [0, 20, 40].filter(v => v <= 37)), "tikler 0–37 güzel adım", G.tikler(0, 37, 3));
ok(esit(G.tikler(3, 3), [3]) && esit(G.tikler(NaN, 1), []), "tikler: uç durumlar");
ok(G.tikler(0, 1000, 5).every(v => v % 250 === 0), "tikler: binlerde yuvarlak");

// Yollar
ok(G.cizgiYolu([[0, 10], [5, 20], [10, 5]]) === "M0 10L5 20L10 5", "cizgiYolu", G.cizgiYolu([[0, 10], [5, 20], [10, 5]]));
ok(G.cizgiYolu([[0, 10], [5, null], [10, 5], [15, 6]]) === "M0 10M10 5L15 6", "cizgiYolu: null boşluk bırakır", G.cizgiYolu([[0, 10], [5, null], [10, 5], [15, 6]]));
ok(G.cizgiYolu([[0.123, 1.456]]) === "M0.1 1.5", "cizgiYolu: 1 ondalık");
ok(G.alanYolu([[0, 10], [10, 5]], 100) === "M0 100L0 10L10 5L10 100Z", "alanYolu", G.alanYolu([[0, 10], [10, 5]], 100));
ok((G.alanYolu([[0, 1], [1, null], [2, 2]], 9).match(/Z/g) || []).length === 2, "alanYolu: boşlukta iki parça");
ok(G.cizgiYolu([]) === "" && G.alanYolu([], 0) === "", "boş girdi → boş yol");

// Kayan doğruluk
const gunler = [{ gun: "2026-10-01", cevap: 2, dogru: 1 }, { gun: "2026-10-02", cevap: 0, dogru: 0 }, { gun: "2026-10-03", cevap: 4, dogru: 4 }];
const k = G.kayanDogruluk(gunler, 7, 3);
ok(k[0].deger === null && k[1].deger === null, "kayan: penceredeki cevap < 3 → null", k);
ok(k[2].deger === 83 && k[2].cevap === 6, "kayan: 5/6 → %83", k[2]);
const k2 = G.kayanDogruluk([{ gun: "a", cevap: 10, dogru: 0 }, { gun: "b", cevap: 10, dogru: 10 }, { gun: "c", cevap: 10, dogru: 10 }], 2, 1);
ok(k2[2].deger === 100 && k2[1].deger === 50, "kayan: pencere kayar", k2);

// Isı eşikleri / basamak
const e = G.isiEsikleri([0, 0, 1, 2, 3, 4, 5, 6, 7, 8]);
ok(e.length === 3 && e[0] < e[1] && e[1] < e[2], "isiEsikleri artan", e);
ok(esit(G.isiEsikleri([]), [1, 2, 3]) && esit(G.isiEsikleri([5, 5, 5]), [5, 6, 7]), "isiEsikleri: boş / eşit değerler", G.isiEsikleri([5, 5, 5]));
ok(G.isiSeviyesi(0, e) === 0 && G.isiSeviyesi(1, e) === 1 && G.isiSeviyesi(100, e) === 4, "isiSeviyesi 0/1/4");

// Takvim haftaları (Pazartesi başlı)
ok(G.haftaGunu("2026-10-19") === 0 && G.haftaGunu("2026-10-25") === 6, "haftaGunu: Pzt=0, Paz=6");
const tg = []; for (let i = 0; i < 10; i++) tg.push({ gun: "2026-10-" + String(14 + i).padStart(2, "0"), cevap: i });
const th = G.takvimHaftalari(tg); // 14 Eki 2026 Çarşamba
ok(th.length === 2 && th[0][0] === null && th[0][1] === null && th[0][2].gun === "2026-10-14", "takvim: ilk hafta Çarşamba'dan", th[0].map(x => x && x.gun));
ok(th.every(h => h.length === 7) && th[1][6] === null, "takvim: sütunlar 7 gün, son hafta doldurulur");

// Halka
const h = G.halkaDash(0.5, 10);
ok(Math.abs(h.cevre - 62.8) < 0.05 && Math.abs(h.dolu - 31.4) < 0.05, "halkaDash yarım", h);
ok(G.halkaDash(2, 10).dolu === G.halkaDash(1, 10).cevre && G.halkaDash(-1, 10).dolu === 0, "halkaDash 0–1 kırpılır");

// Yorum ve biçim
ok(/Hedefindesin/.test(G.puanYorumu(4, 4)) && /çok yakınsın/.test(G.puanYorumu(3.6, 4)) && /1,2 puan/.test(G.puanYorumu(2.8, 4)), "puanYorumu", [G.puanYorumu(3.6, 4), G.puanYorumu(2.8, 4)]);
ok(/en az 10 soru/.test(G.puanYorumu(null, 4)) && /hedef puan seç/.test(G.puanYorumu(3, null)), "puanYorumu: veri/hedef yok");
ok(G.sayi(3.6, 1) === "3,6" && G.sayi(1234) === "1.234" && G.sayi(null) === "–", "sayi tr-TR", [G.sayi(3.6, 1), G.sayi(1234)]);
ok(G.gunEtiket("2026-10-21") === "21 Eki" && G.gunEtiket("2026-01-05", true) === "5 Oca 2026", "gunEtiket");

// Sunucu: ince tahmin ve puan okuma (server/ilerleme.js)
ok(esit([0, 30, 44, 51, 58, 72, 95].map(I.inceTahmin), [1, 2, 3, 3.5, 4, 5, 5]), "inceTahmin eşikler arası doğrusal", [0, 30, 44, 51, 58, 72, 95].map(I.inceTahmin));
ok(I.inceTahmin(null) === null && I.puanOku("4") === 4 && I.puanOku('{"a":3}') === null && I.puanOku(7) === null, "puanOku / inceTahmin uç durumlar");

console.log("\n" + pass + " geçti, " + fail + " başarısız");
process.exit(fail ? 1 : 0);
