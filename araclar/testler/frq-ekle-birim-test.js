// 1.24.0 — FRQ taslaklarının bağımsız denetim kararlarıyla tohuma eklenmesi. Çalıştır: node araclar/testler/frq-ekle-birim-test.js
"use strict";
const path = require("path");
const F = require(path.join(__dirname, "..", "frq-ekle.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };
const kopya = o => JSON.parse(JSON.stringify(o));

const parca = h => ({ harf: h, soru: "Find \\(f'(2)\\). Justify your answer.", puan: 2,
  rubrik: [{ puan: 1, olcut: "Türev kuralı" }, { puan: 1, olcut: "Cevap", ornek_cevap: "f'(2) = 4" }],
  ornek_cozum: "<p>\\(f'(x)=2x\\), \\(f'(2)=4\\).</p>", sik_hatalar: ["Zincir kuralını unutmak."] });
const frq = id => ({ id, sayfa: "ap-calculus", ders: "calculus-ab", tur: "Türev", baslik: "Test " + id, sure_dk: 15, hesapMakinesi: false,
  zorluk: "medium", giris: "<p>Let \\(f(x)=x^2\\).</p>", parcalar: [parca("a"), parca("b")], toplam_puan: 4,
  kaynak: "AP-style original (Meberra 1.24.0)", durum: "taslak", ek: { uretim: "1.24.0", cedKonu: "2.5" } });
const tohum = () => ({ surum: 3, olusturma: "x", aciklama: "y", frq: [Object.assign(frq("frq-calc-ab-1"), { durum: "aktif", baslik: "Eski" })] });
const SEC = { tarih: "2026-10-25", kaynak: "bağımsız denetim" };

// 1) onay + duzelt eklenir, red eklenmez; aktif + ek.onay; surum +1
{
  const t = [frq("frq-calc-ab-k1"), frq("frq-calc-ab-k2"), frq("frq-calc-ab-k3")];
  const k = [{ id: "frq-calc-ab-k1", karar: "onay" },
    { id: "frq-calc-ab-k2", karar: "duzelt", duzeltme: { "parcalar[1].soru": "Find \\(f'(3)\\).", "baslik": "Yeni" } },
    { id: "frq-calc-ab-k3", karar: "red", neden: "iki doğru yorum" }];
  const r = F.uygula(tohum(), t, k, SEC);
  ok(r.hatalar.length === 0, "geçerli parti hatasız", r.hatalar);
  ok(r.tohum.surum === 4, "tohum surum +1");
  ok(r.eklenen.join() === "frq-calc-ab-k1,frq-calc-ab-k2" && r.red.join() === "frq-calc-ab-k3", "onay+düzelt eklendi, red eklenmedi", r);
  const k2 = r.tohum.frq.find(f => f.id === "frq-calc-ab-k2");
  ok(k2.durum === "aktif" && k2.baslik === "Yeni" && k2.parcalar[1].soru === "Find \\(f'(3)\\).", "düzeltme uygulandı, aktif");
  ok(k2.ek.onay && k2.ek.onay.tarih === "2026-10-25" && k2.ek.uretim === "1.24.0", "ek.onay yazıldı, uretim korundu");
  // idempotent: aynı parti ikinci kez → değişiklik yok
  const r2 = F.uygula(r.tohum, t, k, SEC);
  ok(r2.hatalar.length === 0 && r2.eklenen.length === 0 && r2.tohum.surum === 4, "ikinci çalıştırma değişiklik yapmaz", r2);
}
// 2) Hatalar: kararı eksik, bilinmeyen karar, korunan alan düzeltmesi, şema, kontrol karakteri, ters bölüsüz LaTeX, var olan id farklı içerik
const hata = (t, k, re, m, th) => { const r = F.uygula(th || tohum(), t, k, SEC); ok(r.hatalar.some(x => re.test(x)) && r.eklenen.length === 0, m, r.hatalar); };
hata([frq("frq-calc-ab-k1")], [], /kararı yok/, "kararı olmayan taslak");
hata([frq("frq-calc-ab-k1")], [{ id: "frq-calc-ab-k1", karar: "belki" }], /bilinmeyen karar/, "bilinmeyen karar");
hata([frq("frq-calc-ab-k1")], [{ id: "frq-calc-ab-k1", karar: "duzelt", duzeltme: { id: "frq-x" } }], /düzeltilemez/, "id düzeltilemez");
hata([frq("frq-calc-ab-k1")], [{ id: "frq-calc-ab-k1", karar: "duzelt", duzeltme: { "parcalar[0].puan": 3 } }], /rubrik toplamı/, "şema (rubrik toplamı)");
hata([Object.assign(frq("frq-calc-ab-k1"), { giris: "<p>\\(\text{x}\\)</p>".replace("\\t", "\t") })], [{ id: "frq-calc-ab-k1", karar: "onay" }], /kontrol karakteri/, "kontrol karakteri");
hata([Object.assign(frq("frq-calc-ab-k1"), { giris: "<p>\\(frac{1}{2}\\)</p>" })], [{ id: "frq-calc-ab-k1", karar: "onay" }], /ters bölüsü eksik/, "ters bölüsü eksik LaTeX");
hata([frq("frq-calc-ab-1")], [{ id: "frq-calc-ab-1", karar: "onay" }], /zaten var/, "tohumda farklı içerikle var olan id");
hata([Object.assign(frq("frq-calc-ab-k1"), { durum: "aktif" })], [{ id: "frq-calc-ab-k1", karar: "onay" }], /taslak olmalı/, "taslak dışı girdi");
// 3) Herhangi bir hata varsa hiçbir şey eklenmez (parti bütün)
{
  const r = F.uygula(tohum(), [frq("frq-calc-ab-k1"), Object.assign(frq("frq-calc-ab-k2"), { zorluk: "zor" })],
    [{ id: "frq-calc-ab-k1", karar: "onay" }, { id: "frq-calc-ab-k2", karar: "onay" }], SEC);
  ok(r.hatalar.length > 0 && r.eklenen.length === 0 && r.tohum.frq.length === 1 && r.tohum.surum === 3, "hata varsa parti eklenmez", r);
}
// 4) Gerçek tohum geçerli
{
  const T = require(path.join(__dirname, "..", "..", "server", "tohum", "frq.json"));
  const s = [].concat(...T.frq.map(f => F.icerikDenetle(f)));
  ok(s.length === 0, "server/tohum/frq.json içerik denetimi 0 sorun (" + T.frq.length + " FRQ)", s.slice(0, 5));
}
console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
