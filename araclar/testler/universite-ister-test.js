/**
 * AP MEBERRA — Üniversite İsterleri, Sınavlar ve Ders Bağlantıları Birim Testi (Tur 13)
 * Ajan 11 (Frontend & UX) + Ajan 12 (İçerik & Deneme) + Lead PM
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const UI_IST = require("../../assets/js/universite-isterleri.js");

console.log("Universite İsterleri ve Ders Bağlantıları Birim Testi Başlıyor...");

// 1. DERSLER ve Sınavlar Sözlüğü Testi
assert.ok(UI_IST.DERSLER, "DERSLER nesnesi var");
const beklenenDersler = ["ap-calculus", "ap-physics", "ap-chemistry", "ap-biology", "ap-cs-a", "english-language", "tolc-i", "testas"];
beklenenDersler.forEach(k => {
  const d = UI_IST.DERSLER[k];
  assert.ok(d, k + " dersi tanımlı");
  assert.ok(d.konuUrl, k + " konuUrl var: " + d.konuUrl);
  assert.ok(Array.isArray(d.denemeler) && d.denemeler.length > 0, k + " deneme sınavı bağlantısı var");
  d.denemeler.forEach(dn => {
    assert.ok(dn.url && dn.url.indexOf("deneme.html") >= 0, k + " deneme url doğru: " + dn.url);
  });
});
console.log("✓ DERSLER sözlüğü ve bağlantıları doğrulandı (8 temel ders/sınav).");

// 2. TUM İsterleri Testi
const tum = { sira: 1, ad: "Technische Universität München (TUM)", sehir: "Munich" };
const tumReqsEn = UI_IST.isterleriCoz(tum, "de", { dil: "en", duzey: "lisans" });
assert.ok(tumReqsEn.dilSinavlari.some(d => d.ad === "IELTS Academic" && d.esik === "6.5+"), "TUM IELTS var");
assert.ok(tumReqsEn.dilSinavlari.some(d => d.ad === "TOEFL iBT"), "TUM TOEFL var");
assert.ok(tumReqsEn.bilimSinavlari.some(b => b.kod === "ap-calculus"), "TUM AP Calculus var");
assert.ok(tumReqsEn.bilimSinavlari.some(b => b.kod === "ap-physics"), "TUM AP Physics var");
assert.ok(tumReqsEn.ozelIsterler.length > 0, "TUM özel yetenek isterleri var");
console.log("✓ TUM (Almanya) dil ve bilim sınav isterleri doğrulandı.");

// 3. KIT Carl Benz İsterleri Testi
const kit = { sira: 6, ad: "Karlsruher Institut für Technologie (KIT)", sehir: "Karlsruhe" };
const kitReqs = UI_IST.isterleriCoz(kit, "de", { dil: "en", duzey: "lisans" });
assert.ok(kitReqs.ozelIsterler.some(o => o.baslik.indexOf("Carl Benz") >= 0), "KIT Carl Benz özel ister var");
assert.ok(kitReqs.bilimSinavlari.some(b => b.kod === "testas"), "KIT TestAS var");
console.log("✓ KIT (Almanya) Carl Benz özel şartı ve TestAS doğrulandı.");

// 4. PoliMi (İtalya) TOLC-I İsterleri Testi
const polimi = { sira: 1, ad: "Politecnico di Milano", sehir: "Milano" };
const polimiReqs = UI_IST.isterleriCoz(polimi, "it", { dil: "en", duzey: "lisans" });
assert.ok(polimiReqs.dilSinavlari.some(d => d.ad.indexOf("OFA") >= 0 || d.ad.indexOf("IELTS") >= 0), "PoliMi OFA / IELTS var");
assert.ok(polimiReqs.bilimSinavlari.some(b => b.kod === "tolc-i"), "PoliMi TOLC-I var");
console.log("✓ Politecnico di Milano TOLC-I ve OFA şartı doğrulandı.");

// 5. Kart İster HTML Çıktısı Testi
const kartHtml = UI_IST.kartIsterHtml(tum, "de", { dil: "en", duzey: "lisans" }, "tum-test");
assert.ok(kartHtml.ozetHtml.indexOf("IELTS") >= 0, "Özet HTML IELTS içeriyor");
assert.ok(kartHtml.ozetHtml.indexOf("AP Calculus") >= 0, "Özet HTML AP Calculus içeriyor");
assert.ok(kartHtml.ozetHtml.indexOf("Dersler ve İsterler") >= 0, "Özet HTML açılır buton içeriyor");
assert.ok(kartHtml.drawerHtml.indexOf("📖 Konu Anlatımı") >= 0, "Drawer konu anlatımı butonu içeriyor");
assert.ok(kartHtml.drawerHtml.indexOf("🎯 Deneme Sınavı") >= 0 || kartHtml.drawerHtml.indexOf("🎯") >= 0, "Drawer deneme sınavı butonu içeriyor");
assert.ok(kartHtml.drawerHtml.indexOf("deneme.html?ders=calculus-ab") >= 0, "Drawer Calculus deneme linki içeriyor");
assert.ok(kartHtml.drawerHtml.indexOf("ap-calculus.html") >= 0, "Drawer ap-calculus.html konu linki içeriyor");
assert.ok(kartHtml.drawerHtml.indexOf("ap-physics.html") >= 0, "Drawer ap-physics.html konu linki içeriyor");
console.log("✓ Kart İsterleri & Ders İstasyonu HTML render ve bağlantıları doğrulandı.");

// 6. Tur 14 A4: kart eylemleri çekmece düğmesiyle aynı satırda; eylem verilmezse çıktı eskisiyle aynı
const eylem = '<a class="uni-eylem" href="yazismalar.html?uni=de-x&amac=ilk-iletisim">İlk e-posta</a>';
const k2 = UI_IST.kartIsterHtml(tum, "de", { dil: "en", duzey: "lisans" }, "tum-test", { eylemHtml: eylem });
assert.ok(/<div class="sr-uni-eylem"><button[^>]*sr-req-toggle[\s\S]*<\/button><a class="uni-eylem"[^>]*>İlk e-posta<\/a><\/div>/.test(k2.ozetHtml), "eylem satırı: çekmece düğmesi + eylem");
assert.strictEqual(UI_IST.kartIsterHtml(tum, "de", { dil: "en", duzey: "lisans" }, "tum-test", {}).ozetHtml, kartHtml.ozetHtml, "eylemsiz çıktı değişmedi");
assert.ok(kartHtml.ozetHtml.indexOf("sr-uni-eylem") < 0, "eylem sarmalayıcısı yalnızca eylem verilince");
console.log("✓ Tur 14 A4: kart eylem satırı (İlk e-posta / Listeme ekle) doğrulandı.");

console.log("\nSONUÇ: Tüm testler başarıyla geçti (0 hata).");
