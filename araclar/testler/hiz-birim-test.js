// 1.17.0 Hız turu / odak sayacı saf çekirdeği — Node birim testi.
// Puan + kombo çarpanı, süre toleransı, günün sorusu seçimi ve seri (server/hiz.js); odak sayacı durum makinesi ve odakDk yazımı (assets/js/odak.js).
// Kullanım (proje klasöründen): node araclar/testler/hiz-birim-test.js
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const H = require(path.join(ROOT, "server/hiz.js"));
const O = require(path.join(ROOT, "assets/js/odak.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };

// Puan / kombo
ok([0, 1, 2].every(k => H.carpan(k) === 1), "ilk üç doğru ×1");
ok([3, 4, 5].every(k => H.carpan(k) === 2), "3 doğrudan sonra ×2");
ok([6, 9, 50].every(k => H.carpan(k) === 3), "6 doğrudan sonra ×3");
ok(H.puanla(5, true).kazanilan === 20 && H.puanla(6, true).kazanilan === 30, "kazanılan = 10 × çarpan");
ok(H.puanla(8, false).kombo === 0 && H.puanla(8, false).kazanilan === 0, "yanlış komboyu sıfırlar");
ok(H.toplamPuan([1, 1, 1, 1, 0, 1]).puan === 60 && H.toplamPuan([1, 1, 1, 1, 0, 1]).enKombo === 4, "dizi toplamı");
ok(H.toplamPuan(Array(10).fill(1)).puan === 30 + 60 + 120, "10 doğru = 210");
// Süre
const s = H.sureDurum(10000, 9000);
ok(s.kalanMs === 1000 && !s.bitti && !s.gecikti, "süre içinde");
ok(H.sureDurum(10000, 10000 + H.KURAL.toleransMs).gecikti && !H.sureDurum(10000, 10000 + H.KURAL.toleransMs).bitti, "tolerans içinde kabul");
ok(H.sureDurum(10000, 10001 + H.KURAL.toleransMs).bitti, "tolerans sonrası bitti");
ok(H.KURAL.sureMs === 60000 && H.KURAL.toleransMs <= 5000, "60 sn + küçük tolerans");
// Hesap makinesi
ok(H.hmDuzey({ hesapMakinesiDurum: "gerekmez" }) === "gerekmez" && H.hmDuzey({ hesapMakinesi: "basit hesap" }) === "yardımcı" && H.hmDuzey({ hesapMakinesi: true }) === "gerekli", "hesap makinesi düzeyi");
// Günün sorusu
const havuz = [{ id: "c1", sayfa: "ap-calculus" }, { id: "c2", sayfa: "ap-calculus" }, { id: "p1", sayfa: "ap-physics" }, { id: "b1", sayfa: "ap-biology" }];
ok(H.gununSorusuSec(havuz, "2026-10-21") === H.gununSorusuSec(havuz.slice().reverse(), "2026-10-21"), "belirlenimli (sıra bağımsız)");
const hafta = ["2026-10-19", "2026-10-20", "2026-10-21"].map(t => havuz.find(x => x.id === H.gununSorusuSec(havuz, t)).sayfa);
ok(new Set(hafta).size === 3, "ders her gün döner", hafta);
ok(H.gunSerisi(["2026-10-21", "2026-10-20", "2026-10-19", "2026-10-17"], "2026-10-21") === 3, "seri 3");
ok(H.gunSerisi(["2026-10-20"], "2026-10-21") === 1 && H.gunSerisi(["2026-10-18"], "2026-10-21") === 0, "dünden sayılır; boşluk sıfırlar");

// Odak sayacı
const t0 = 1_000_000;
const d = O.yeniDurum({ dk: 25 }, t0);
ok(d.mod === "odak" && d.bitis === t0 + 25 * 60000 && d.mola === 5, "25/5 varsayılan");
ok(O.secenekNormal({ dk: 99 }).dk === 25 && O.secenekNormal({ dk: 45 }).mola === 10 && O.secenekNormal({ dk: 15 }).mola === 3, "seçenekler 15/25/45");
ok(O.kalanHesap(d, t0 + 60000).kalanMs === 24 * 60000, "kalan");
ok(O.gecenDk(d, t0 + 10.5 * 60000) === 10, "geçen tam dakika");
const dur = Object.assign({}, d, { kalan: 5 * 60000 });
ok(O.kalanHesap(dur, t0 + 99e6).kalanMs === 5 * 60000 && !O.kalanHesap(dur, t0 + 99e6).bitti, "duraklatınca süre akmaz");
const r1 = O.ilerle(d, d.bitis + 1);
ok(r1.olay === "odakBitti" && r1.kredi === 25 && r1.durum.mod === "mola" && r1.durum.bitis === d.bitis + 5 * 60000, "odak bitince molaya geçer, 25 dk kredi");
const r2 = O.ilerle(r1.durum, r1.durum.bitis + 1);
ok(r2.olay === "molaBitti" && r2.durum.mod === "bos" && r2.kredi === 0, "mola bitince boş");
ok(O.ilerle(d, t0 + 1000).olay === null, "süre dolmadan olay yok");
const oy = O.dakikaEkle({ xp: 50, odakDk: { "2026-10-20": 15 } }, "2026-10-21", 25);
ok(oy.xp === 50 && oy.odakDk["2026-10-21"] === 25 && oy.odakDk["2026-10-20"] === 15, "odakDk eklenir, diğer alanlar korunur");
ok(O.dakikaEkle(oy, "2026-10-21", 5).odakDk["2026-10-21"] === 30 && O.dakikaEkle(null, "x", 5).odakDk.x === undefined, "toplanır; geçersiz gün yok sayılır");
ok(O.sureYaz(65000) === "1:05" && O.sureYaz(0) === "0:00", "süre biçimi");

console.log(`\n${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
