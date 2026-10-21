// 1.18.0 Kavram kartları — saf birim testleri: zamanlama (server/kart.js planla), ücretsiz deste kuralı (ucretsiz-kural.js),
// tohum doğrulaması (araclar/kart-uret.js denetle + latexDenetle) ve gerçek server/tohum/kartlar.json.
// Kullanım (proje klasöründen): node araclar/testler/kart-birim-test.js
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const K = require(path.join(ROOT, "server/kart.js"));
const U = require(path.join(ROOT, "araclar/kart-uret.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };
const G = "2026-10-21";

// --- planla ---
ok(K.planla(null, "tekrar", G).aralik === 1 && K.planla(null, "tekrar", G).sonraki === "2026-10-22", "yeni kart tekrar → 1 gün");
ok(K.planla({ aralik: 14 }, "tekrar", G).aralik === 1, "14 günlük kart tekrar → 1 güne döner");
ok(K.planla(null, "biliyorum", G).aralik === 1, "yeni kart biliyorum → ilk adım 1");
ok(K.planla({ aralik: 1 }, "biliyorum", G).aralik === 3, "1 → 3");
ok(K.planla({ aralik: 3 }, "biliyorum", G).aralik === 7, "3 → 7");
ok(K.planla({ aralik: 7 }, "biliyorum", G).aralik === 14, "7 → 14");
ok(K.planla({ aralik: 14 }, "biliyorum", G).aralik === 30, "14 → 30");
ok(K.planla({ aralik: 30 }, "biliyorum", G).aralik === 30 && K.planla({ aralik: 30 }, "biliyorum", G).sonraki === "2026-11-20", "30'da kalır, ay geçişi doğru");
ok(K.planla({ aralik: 4 }, "biliyorum", G).aralik === 7, "ara değer (zor sonrası 4) → sonraki adım 7");
ok(K.planla({ aralik: 10 }, "zor", G).aralik === 12, "zor: 10 × 1,2 = 12");
ok(K.planla({ aralik: 3 }, "zor", G).aralik === 4, "zor: 3 × 1,2 = 3,6 → 4");
ok(K.planla({ aralik: 1 }, "zor", G).aralik === 1 && K.planla(null, "zor", G).aralik === 1, "zor en az 1 gün");
ok(K.planla({ aralik: 30 }, "zor", "2026-12-31").sonraki === "2027-02-05", "yıl geçişi (30 × 1,2 = 36 gün)");
let atti = false; try { K.planla(null, "kolay", G); } catch (e) { atti = true; }
ok(atti, "geçersiz sonuç hata verir");

// --- tohum + ücretsiz kural ---
const V = K.yukle();
ok(V.kartlar.length >= 300, "en az 300 kart", V.kartlar.length);
const say = {}; V.kartlar.forEach(k => { say[k.ders] = (say[k.ders] || 0) + 1; });
ok(say.calculus >= 80 && say.physics >= 48 && say.chemistry >= 54 && say.biology >= 48 && say.micro >= 30 && say.macro >= 30 && say.csa >= 20 && say.english >= 15, "ders başına hedef sayılar", say);
V.dersler.forEach(d => {
  const ilk2 = d.uniteler.slice(0, 2).map(u => u.unite);
  ok(d.uniteler.every(u => K.desteUcretsizMi(V, d.ders, u.unite) === (ilk2.indexOf(u.unite) >= 0)), d.ders + ": yalnız ilk 2 deste ücretsiz (" + ilk2.join(", ") + ")");
});
ok(!K.desteUcretsizMi(V, "calculus", "10") && K.desteUcretsizMi(V, "micro", "Micro 2") && !K.desteUcretsizMi(V, "macro", "Macro 3"), "örnek desteler");
ok(!K.desteUcretsizMi(V, "yok", "1"), "bilinmeyen ders kilitli");
ok(V.kartlar.every(k => V.dersler.some(d => d.ders === k.ders && d.uniteler.some(u => u.unite === k.unite))), "her kart tanımlı bir destede");
ok(Object.values(K.PROFIL_DERS).every(d => V.dersler.some(x => x.ders === d)), "profil ders eşlemesi tohumdaki derslere gider");

// --- doğrulayıcı ---
ok(U.latexDenetle("$x^2$ ve $\\frac{a}{b}$") === null, "LaTeX dengeli");
ok(U.latexDenetle("$x^2") === "tek sayıda $", "tek $ yakalanır");
ok(U.latexDenetle("$\\frac{a}{b$") === "kapanmamış {", "açık { yakalanır");
ok(U.latexDenetle("küme \\{1\\} $x$") === null, "kaçışlı süslü parantez sayılmaz");
ok(U.konuNo("1.6 Nucleic Acids") === "1.6" && U.konuNo("4.A Thesis") === "4.A" && U.konuNo("Rubric Row B") === null, "konu numarası çözümü");
const gercek = U.denetle(require(U.HEDEF), U.bankaKonulari());
ok(gercek.hatalar.length === 0, "gerçek kartlar.json doğrulamadan geçer", gercek.hatalar.slice(0, 5));
ok(gercek.uyarilar.length === 0, "CED çapraz denetimi uyarısız", gercek.uyarilar.slice(0, 5));
const bozuk = { dersler: [{ ders: "x", sayfa: "ap-x", uniteler: [{ unite: "1", ad: "A" }] }],
  kartlar: [{ id: "x-u1-01", ders: "x", sayfa: "ap-x", unite: "1", on: "a", arka: Array(70).fill("s").join(" "), etiket: "tanim", kaynakKonu: "1.1 A" },
    { id: "x-u1-01", ders: "x", sayfa: "ap-y", unite: "2", on: "a", arka: "$x", etiket: "bilgi", kaynakKonu: "1.1 A" }] };
const b = U.denetle(bozuk, null).hatalar.join(" | ");
ok(/60\)/.test(b) && /yinelenen id/.test(b) && /bilinmeyen deste/.test(b) && /etiket bilgi/.test(b) && /tek sayıda/.test(b), "bozuk tohum hataları yakalanır", b);
ok(U.denetle(bozuk, null).uyarilar.some(u => /yanılgı/.test(u)), "yanılgı kartı olmayan deste uyarısı");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
