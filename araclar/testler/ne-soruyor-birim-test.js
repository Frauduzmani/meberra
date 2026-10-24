// 1.25.0 — "Ne soruyor?" cümlelerinin soru bankasına eklenmesi ve cevap sızıntısı denetimi.
// Çalıştır: node araclar/testler/ne-soruyor-birim-test.js
"use strict";
const path = require("path");
const N = require(path.join(__dirname, "..", "ne-soruyor-ekle.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };

const q = {
  id: "bio_t1", durum: "aktif", dogru: "A", govde: "Sample 1 has a higher melting temperature than Sample 2. Which of the following best explains this difference?",
  secenekler: [{ id: "A", text: "Sample 1 has more guanine-cytosine pairs." }, { id: "B", text: "Sample 1 contains ribose." },
    { id: "C", text: "Sample 2 has peptide bonds." }, { id: "D", text: "Sample 2 is 4.5 times longer." }], ek: { kavram: "x" }
};
const iyi = "Örnek 1'in erime sıcaklığının (melting temperature) neden daha yüksek olduğunu en iyi açıklayan seçeneği soruyor.";

// 1) Sızıntı denetimi
ok(N.sorunlar(q, iyi).length === 0, "iyi cümle temiz", N.sorunlar(q, iyi));
ok(N.sorunlar(q, "Guanine-cytosine çiftlerine göre erime sıcaklığını soruyor.").some(s => /sızıntı/.test(s)), "doğru şıkka özgü kelime → sızıntı");
ok(N.sorunlar(Object.assign({}, q, { dogru: "D" }), "Örnek 2 4.5 kat uzun mu diye soruyor.").some(s => /sayı/.test(s)), "doğru şıktaki kökte olmayan sayı → sızıntı");
ok(N.sorunlar(q, "x".repeat(230)).some(s => /uzun/.test(s)), "çok uzun");
ok(N.sorunlar(q, "Bunu <b>soruyor</b>.").some(s => /HTML/.test(s)), "HTML yasak");
ok(N.sorunlar(q, "Fiyatı $5 olan …").some(s => /\$/.test(s)), "$ yasak");
ok(N.sorunlar(q, "").some(s => /boş/.test(s)), "boş");
// Tam kelime eşleşir: "because" içinde "cause" sızıntı değil
{ const q2 = Object.assign({}, q, { secenekler: q.secenekler.map(o => o.id === "A" ? { id: "A", text: "each effect becomes the next cause" } : o) });
  ok(N.sorunlar(q2, "“Because … because” yapısının işlevini soruyor.").length === 0, "alt dize sızıntı sayılmaz", N.sorunlar(q2, "“Because … because” yapısının işlevini soruyor.")); }
// Kökte de geçen kelime sızıntı sayılmaz
ok(N.sorunlar(q, "Örnek 1'in (sample) neden daha yüksek erime sıcaklığına sahip olduğunu soruyor.").length === 0, "kökte geçen kelime serbest");

// 2) Uygula: temizler eklenir, sorunlular atlanır, var olan değişmez (zorla yoksa), surum +1
{
  const tohum = { surum: 7, sorular: [JSON.parse(JSON.stringify(q)), Object.assign(JSON.parse(JSON.stringify(q)), { id: "bio_t2" }),
    Object.assign(JSON.parse(JSON.stringify(q)), { id: "bio_t3", ek: { neSoruyor: "Eski cümle soruyor." } })] };
  const r = N.uygula(tohum, { bio_t1: iyi, bio_t2: "Guanine-cytosine soruyor.", bio_t3: iyi, yok_id: iyi });
  ok(r.eklenen === 1 && r.atlanan.length === 1 && r.atlanan[0].id === "bio_t2", "temiz eklenir, sızıntılı atlanır", r);
  ok(r.bilinmeyen.join() === "yok_id", "bilinmeyen id raporlanır");
  ok(r.tohum.sorular[0].ek.neSoruyor === iyi && r.tohum.sorular[0].ek.kavram === "x", "ek.neSoruyor yazıldı, diğer ek alanları korundu");
  ok(r.tohum.sorular[2].ek.neSoruyor === "Eski cümle soruyor." && r.korunan === 1, "var olan korunur");
  ok(r.tohum.surum === 8, "surum +1");
  const r2 = N.uygula(r.tohum, { bio_t1: iyi });
  ok(r2.eklenen === 0 && r2.tohum.surum === 8, "ikinci çalıştırma değişiklik yapmaz");
}
console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
