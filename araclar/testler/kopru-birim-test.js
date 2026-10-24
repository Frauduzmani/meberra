// 1.25.0 — A2 İngilizce köprüsü: sözlük arama (çekim ekleri, kök), çok kelimeli terimler, metinden kelime ayıklama.
// Çalıştır: node araclar/testler/kopru-birim-test.js
"use strict";
const path = require("path");
const K = require(path.join(__dirname, "..", "..", "assets", "js", "kelime-kopru.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };

const S = K.sozlukHazirla({
  kelimeler: {
    increase: { tr: "artmak; artış", t: "akademik" }, increases: { tr: "artar", t: "akademik", l: "increase" },
    derivative: { tr: "türev", t: "ap" }, rate: { tr: "oran; hız", t: "ap" }, the: { tr: "", t: "temel" }, measure: { tr: "ölçmek", t: "akademik" }
  },
  ifadeler: { "instantaneous rate of change": "anlık değişim hızı", "rate of change": "değişim hızı" }
});

// 1) kelime arama
ok(K.kelimeBul(S, "Derivative").tr === "türev", "büyük harf duyarsız");
ok(K.kelimeBul(S, "increases").tr === "artar" && K.kelimeBul(S, "increases").kok === "increase", "kayıtlı çekimli biçim + kök");
ok(K.kelimeBul(S, "derivatives").tr === "türev", "kayıtsız -s eki köke iner");
ok(K.kelimeBul(S, "measured").tr === "ölçmek" && K.kelimeBul(S, "measuring").tr === "ölçmek", "-ed / -ing (sessiz e) köke iner");
ok(K.kelimeBul(S, "increasing").tr === "artmak; artış", "-ing + e");
ok(K.kelimeBul(S, "the") === null, "anlamı boş kelime null");
ok(K.kelimeBul(S, "xyzzy") === null, "bilinmeyen null");
ok(K.kelimeBul(S, "rate's").tr === "oran; hız" && K.kelimeBul(S, "“rate,”").tr === "oran; hız", "noktalama ve iyelik temizlenir");

// 2) metinden dokunulan kelime
const m = "Find the instantaneous rate of change of f.";
const a = K.kelimeAyikla(m, m.indexOf("rate") + 2);
ok(a && a.kelime === "rate" && a.sira === 3, "ofsetteki kelime ve sırası", a);
ok(K.kelimeAyikla(m, m.indexOf(" of") ) === null || K.kelimeAyikla(m, m.indexOf(" of")).kelime !== " ", "boşlukta null ya da komşu kelime");
ok(K.kelimeAyikla("x = 2", 0) === null, "harf olmayan / tek harf null");

// 3) çok kelimeli terim: en uzun eşleşme dokunulan kelimeyi kapsar
const w = K.kelimeler(m);
ok(K.ifadeBul(S, w, 3).en === "instantaneous rate of change", "en uzun ifade (rate)", K.ifadeBul(S, w, 3));
ok(K.ifadeBul(S, w, 2).tr === "anlık değişim hızı", "ifadenin ilk kelimesine dokunma");
ok(K.ifadeBul(S, w, 0) === null, "ifade dışında null");

// 4) arama sonucu birleşik: önce ifade, yoksa kelime
const s = K.ara(S, m, m.indexOf("change") + 1);
ok(s && s.ifade && s.ifade.en === "instantaneous rate of change" && s.kelime === "change", "ara: ifade + dokunulan kelime", s);
const s2 = K.ara(S, "The derivative increases.", 6);
ok(s2 && s2.anlam && s2.anlam.tr === "türev" && !s2.ifade, "ara: tek kelime");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
