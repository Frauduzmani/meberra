// 1.4.0 canlı katman (assets/js/canli.js) saf çekirdeği — Node birim testi.
// Alev kademesi, seri eşiği / tehlike, Bugün karşılaması, bağlamsal kart seçici, bulunma eki, üst üste sayacı,
// öğrenme yolu yerleşimi ve HTML'i; ayrıca oyun.js ile ortak hesapların (İstanbul günü, vadesi gelen tekrar) birebir aynı olduğu.
// Kullanım (proje klasöründen): node araclar/testler/canli-birim-test.js
"use strict";
const path = require("path");
const fs = require("fs");
const ROOT = path.resolve(__dirname, "../..");
const C = require(path.join(ROOT, "assets/js/canli.js"));
const O = require(path.join(ROOT, "assets/js/oyun.js"));

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };

// 1) Alev kademesi (CSS ölçek basamağı)
ok([0, 1, 2, 3, 6, 7, 29, 30, 99, 100, 365].map(C.alevKademe).join(",") === "0,1,1,2,2,3,3,4,4,5,5", "alev kademesi: 0 | 1–2 | 3–6 | 7–29 | 30–99 | 100+", [0, 1, 2, 3, 6, 7, 29, 30, 99, 100, 365].map(C.alevKademe));
ok(C.alevKademe(-3) === 0 && C.alevKademe("abc") === 0 && C.alevKademe("12") === 3, "alev kademesi: geçersiz/negatif 0, metin sayı kabul");
let artan = true;
for (let g = 1; g < 400; g++) if (C.alevKademe(g) < C.alevKademe(g - 1)) artan = false;
ok(artan, "alev seri uzadıkça hiç küçülmez");

// 2) Seri eşiği ve tehlike
ok([7, 30, 100, 200, 365].every(C.seriEsikMi) && ![1, 6, 8, 29, 31, 99, 101].some(C.seriEsikMi), "seri eşikleri 7/30/100/200/365 (kutlama.js SERI_ESIK ile aynı)");
const K = require(path.join(ROOT, "assets/js/kutlama.js"));
ok(JSON.stringify(K.SERI_ESIK) === JSON.stringify(C.SERI_ESIK), "canli.js ve kutlama.js seri eşikleri birebir");
ok(C.seriTehlikede({ seri: 4, bugunVar: false, saat: 18 }) === true, "18:00, serisi var, bugün çalışmamış → tehlike");
ok(C.seriTehlikede({ seri: 4, bugunVar: false, saat: 17 }) === false, "17:59 öncesi tehlike yok");
ok(C.seriTehlikede({ seri: 4, bugunVar: true, saat: 22 }) === false, "bugün çalıştıysa tehlike yok");
ok(C.seriTehlikede({ seri: 0, bugunVar: false, saat: 22 }) === false, "serisi yoksa tehlike yok (suçlama yok)");

// 3) Bugün karşılaması
const s1 = C.selamDurumu({ saat: 8, ilkZiyaret: true, seri: 3, bugunVar: false });
ok(s1.metin === "Günaydın" && s1.ifade === "selam" && !s1.tehlike, "sabah, günün ilk ziyareti → Günaydın + el sallama", s1);
const s2 = C.selamDurumu({ saat: 14, ilkZiyaret: false, seri: 3, bugunVar: false });
ok(s2.metin === "İyi günler" && s2.ifade === "sevincli", "öğleden sonra tekrar ziyaret → sevinçli", s2);
const s3 = C.selamDurumu({ saat: 20, ilkZiyaret: true, seri: 5, bugunVar: false });
ok(s3.metin === "İyi akşamlar" && s3.ifade === "uykulu" && s3.tehlike && s3.mesaj === "Serin bu gece bitiyor, tek bir soru yeter. 2 dakika?", "akşam, seri tehlikede → uykulu + dostça hatırlatma", s3);
const s4 = C.selamDurumu({ saat: 20, ilkZiyaret: false, seri: 5, bugunVar: true });
ok(s4.ifade === "sevincli" && !s4.mesaj, "akşam ama bugün çalışmış → normal karşılama");
ok(!/(utan|ayıp|tembel|hayal kırıklığı|neden çalışmadın)/i.test(C.TEHLIKE_MESAJ), "hatırlatma metni suçlayıcı değil");

// 4) Bağlamsal kart seçici (en acil olan)
ok(C.baglamKartiSec({ tekrar: 8, yaklasanGun: 2, denemeGun: 0 }) === "yaklasan", "3 gün içinde son tarih her şeyden önce");
ok(C.baglamKartiSec({ tekrar: 8, yaklasanGun: 10, denemeGun: 0 }) === "tekrar", "tekrar vadesi, 10 gün sonraki tarihten ve taze denemeden önce");
ok(C.baglamKartiSec({ tekrar: 1, yaklasanGun: 6, denemeGun: 1 }) === "yaklasan", "7 gün içindeki tarih tekrardan önce");
ok(C.baglamKartiSec({ tekrar: 0, yaklasanGun: 40, denemeGun: 1 }) === "deneme", "tekrar yoksa taze deneme sonucu uzak tarihten önce");
ok(C.baglamKartiSec({ tekrar: 0, yaklasanGun: 40, denemeGun: 9 }) === "deneme", "eski deneme (30) uzak tarihten (15) önce");
ok(C.baglamKartiSec({ tekrar: 0, yaklasanGun: 40, denemeGun: null, cevap: 3 }) === "yaklasan", "deneme yok, az soru: uzak tarih");
ok(C.baglamKartiSec({ tekrar: 0, yaklasanGun: 40, denemeGun: null, cevap: 25 }) === "deneme", "deneme yok ama 20+ soru: ilk deneme önerisi uzak tarihten önce");
ok(C.baglamKartiSec({}) === "deneme" && C.baglamKartiSec() === "deneme", "aday yoksa son deneme kartı (boş durumu: Denemeye başla)");
ok(C.baglamKartiSec({ tekrar: 3, yaklasanGun: null, denemeGun: null }) === "tekrar", "yalnızca tekrar varsa tekrar");
ok(C.baglamKartiSec({ tekrar: 50, yaklasanGun: 14, denemeGun: 0 }) === "tekrar", "tekrar puanı 80'i geçmez (14 gün: 50 < 80)");
ok(C.baglamKartiSec({ tekrar: 50, yaklasanGun: 7, denemeGun: 0 }) === "yaklasan" && C.baglamKartiSec({ tekrar: 9, yaklasanGun: 8 }) === "tekrar", "eşitlikte (tekrar 80 = 7 gün 80) yaklaşan önce; 8 gün (50) tekrardan sonra");

// 5) Bulunma eki ve ders yüzdesi metni
const ek = { Calculus: "ta", Physics: "te", Chemistry: "de", Biology: "de", English: "te", "Seçmeliler": "de", "CEnT-S": "te", "Bu ders": "te", Kimya: "da", Fizik: "te" };
Object.keys(ek).forEach(k => ok(C.bulunmaEki(k) === ek[k], "bulunma eki: " + k + "’" + ek[k], C.bulunmaEki(k)));
ok(C.dersYuzdeMetni("Calculus", 40) === "Calculus’ta %40!", "ünite kartı başlığı: Calculus’ta %40!", C.dersYuzdeMetni("Calculus", 40));
ok(C.dersYuzdeMetni("Physics", 140) === "Physics’te %100!" && C.dersYuzdeMetni("", 12.6) === "Bu ders’te %13!", "yüzde 0–100 arası, yuvarlanır; ad yoksa 'Bu ders'");

// 6) Üst üste doğru sayacı
let n = 0, kutla = [];
[true, true, true, true, false, true, true, true].forEach(d => { n = C.ustUsteIlerle(n, d); kutla.push(C.ustUsteKutlansinMi(n)); });
ok(JSON.stringify(kutla) === JSON.stringify([false, false, true, false, false, false, false, true]), "üst üste 3: tam eşikte bir kez; yanlış sıfırlar, yeniden 3'te", kutla);

// 7) İstanbul günü ve vadesi gelen tekrar: oyun.js ile birebir
["2026-10-20T20:59:59Z", "2026-10-20T21:00:00Z", "2026-12-31T21:30:00Z", 0, "bozuk"].forEach(v => ok(C.istGun(v) === O.istGun(v), "istGun oyun.js ile aynı: " + v));
const tk = {
  "ap-calculus|a": { kutu: 1, sonraki: "2026-10-20", guncelleme: 1 },
  "ap-calculus|b": { kutu: 2, sonraki: "2026-10-21", guncelleme: 1 },
  "ap-calculus|c": { kutu: 3, sonraki: "2026-10-25", guncelleme: 1 },
  "ap-calculus|d": { silindi: true, guncelleme: 1 },
  "ap-calculus|e": null, "ap-calculus|f": { kutu: 0, sonraki: "2026-10-01" }
};
ok(C.vadeSay(tk, "2026-10-21") === O.tekrarZamani(tk, "2026-10-21").length && C.vadeSay(tk, "2026-10-21") === 2, "vadeSay = oyun.js tekrarZamani(...).length (2)");
ok(C.vadeSay(null, "2026-10-21") === 0 && C.vadeSay([], "2026-10-21") === 0, "vadeSay: boş/bozuk depo 0");

// 8) Öğrenme yolu yerleşimi
const d1 = C.yolDuzeni(10, { mod: "dikey" });
ok(d1.noktalar.length === 10 && d1.segmentler.length === 10 && /^M/.test(d1.segmentler[0]) && d1.segmentler.slice(1).every(s => /^ C/.test(s)), "dikey: 10 nokta, M + 9 eğri");
ok(d1.noktalar.every((p, i) => !i || p.y > d1.noktalar[i - 1].y) && d1.yukseklik === C.YOL_UST + 10 * 76, "dikey: her düğüm bir öncekinin altında; yükseklik = üst boşluk + 10 satır");
ok(new Set(d1.noktalar.map(p => p.x)).size === 3 && d1.noktalar.every(p => p.x >= 22 && p.x <= d1.genislik - 22), "dikey: zikzak (3 farklı x), düğümler şeritten taşmaz");
const s5 = C.yolDuzeni(10, { mod: "serit", sutun: 4 });
ok(s5.genislik === 4 * 56 && s5.yukseklik === C.YOL_UST + 3 * 72, "serit: 4 sütun × 3 satır", { g: s5.genislik, y: s5.yukseklik });
ok(s5.noktalar.every(p => p.x >= 22 && p.x <= s5.genislik - 22), "serit: düğümler kart genişliğinden taşmaz");
ok(s5.noktalar[3].x === s5.noktalar[4].x && s5.noktalar[4].satir === 1 && s5.noktalar[5].x < s5.noktalar[4].x, "serit: yılan — 2. satır sağdan sola döner");
const dDon = s5.segmentler[4].match(/-?\d+(\.\d+)?/g).map(Number);
ok(dDon[0] > s5.noktalar[3].x && dDon[0] <= s5.genislik, "serit: satır sonu dönüşü dışa doğru kıvrılır, kartı aşmaz", dDon);
ok(C.yolDuzeni(3, { mod: "serit", sutun: 9 }).genislik === 3 * 56, "serit: düğüm sayısı sütundan azsa tek satır, gereksiz genişlik yok");
ok(C.yolDuzeni(0).segmentler.length === 0 && C.yolDuzeni(1).segmentler.join("") === "M56 62", "boş yol ve tek düğüm", C.yolDuzeni(1).segmentler);

// 9) Yol HTML'i (oyun.js düğümleriyle)
const liste = O.yolListesi("ap-calculus");
const pr = { units: { "calc-unit1-quiz-container": { total: 2, answers: { a: { c: true }, b: { c: false } } }, "calc-unit2-quiz-container": { total: 15, answers: { a: { c: true } } } } };
const dug = O.yolDugumleri(liste, pr, no => no > 4);
const h = C.yolHtml(dug, { mod: "dikey", adres: "ap-calculus.html", ciz: true, basHtml: "<svg class=\"tilo\"></svg>" });
ok((h.match(/class="cn-dugum__git"/g) || []).length === liste.length, "yol HTML: her ünite bir bağlantı (" + liste.length + ")");
ok((h.match(/aria-current="step"/g) || []).length === 1 && /is-simdi[^>]*>\s*<span class="cn-tilo"/.test(h), "tek 'sıradaki' düğüm ve maskot başı onun üstünde");
ok(/href="ap-calculus\.html\?unite=1"/.test(h) && /is-bitti/.test(h), "biten ünite: ?unite=1, dolu düğüm");
ok((h.match(/data-ipucu="Premium ile açılır"/g) || []).length === liste.length - 4 && /cn-yol__not/.test(h), "kilitli üniteler Premium ipucuyla, altta not");
ok(/class="cn-yol cn-yol--dikey is-ciz"/.test(h) && /class="cn-yol__dolu"/.test(h), "ilk görüşte çizim sınıfı; dolu yol şimdiki düğüme kadar");
ok(!/<img|<script/i.test(C.yolHtml([{ no: 1, ad: "<img onerror=x>", etiket: "1", durum: "acik", toplam: 0, cevap: 0 }], { adres: "x.html" })), "ünite adı kaçışlı (HTML enjeksiyonu yok)");
const tumuBitti = C.yolHtml([{ no: 1, ad: "A", durum: "bitti" }, { no: 2, ad: "B", durum: "bitti" }], { mod: "serit", sutun: 5 });
ok(/cn-yol__dolu/.test(tumuBitti) && !/aria-current/.test(tumuBitti) && !/is-ciz/.test(tumuBitti), "hepsi bittiyse yol tamamen dolu, şimdiki düğüm yok; çizim istenmediyse sınıf yok");
ok(C.doluSon([{ durum: "acik" }]) === -1 && C.doluSon([{ durum: "simdi" }, { durum: "acik" }]) === 0, "dolu yol: başlamamışsa yok");

// 10) Kaynak denetimi: süreler hareket.css tokenlarından, azaltılmış hareket blokları var
const css = fs.readFileSync(path.join(ROOT, "assets/css/canli.css"), "utf8");
const msler = (css.replace(/\/\*[\s\S]*?\*\//g, "").match(/\b\d+(\.\d+)?m?s\b/g) || []).filter(x => !/^(0|1\.8s)$/.test(x));
ok(msler.length === 0, "canli.css: animasyon süreleri yalnızca --hiz-* tokenları (tek istisna: 3 kez nabız 1.8s)", msler);
ok(/@media \(prefers-reduced-motion: reduce\)/.test(css), "canli.css: azaltılmış hareket bloğu var");
const oy = fs.readFileSync(path.join(ROOT, "assets/js/oyun.js"), "utf8");
ok(!/function konfeti|function toast\(|className = "oy-(toast|konfeti)/.test(oy) && /window\.MeberraKutlama\.kutla/.test(oy), "oyun.js: eski konfeti ve balon kopyaları kaldırıldı (tek kutlama kuyruğu)");

console.log("\nSONUC: " + pass + " gecti, " + fail + " kaldi.");
process.exit(fail ? 1 : 0);
