// İlk başvuru e-postası birim testi (Tur 14, Ajan 14 Faz 1). Node, bağımlılık yok.
// Çalıştır (proje klasöründen): node araclar/testler/ilk-basvuru-birim-test.js
// Denetler: şablon şeması, yönerge dayanakları, koşullu blok motoru, 3 model × 7 ülke × gerçek üniversite verisi,
// kelime sınırı (120–220), kişisel veri sızıntısı, AP dürüstlüğü, kaynaklı alıcı, eksik profilde [eksik: …].
"use strict";
const path = require("path");
const fs = require("fs");
const vm = require("vm");

const KOK = path.join(__dirname, "..", "..");
const oku = (p) => fs.readFileSync(path.join(KOK, p), "utf8");

// Tarayıcı verilerini tek bir bağlamda yükle (window = global)
global.window = global;
["data/mevzuat/ulkeler.js", "data/mevzuat/sinavlar.js", "data/kocluk/eposta-sablonlari.js", "data/kocluk/teyit-taslaklari.js"]
  .forEach((f) => vm.runInThisContext(oku(f), { filename: f }));
const ULKELER = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];
ULKELER.forEach((c) => vm.runInThisContext(oku("data/mevzuat/ulke/" + c + ".js"), { filename: c }));
const E = require(path.join(KOK, "assets", "js", "eposta.js"));
const S = require(path.join(KOK, "data", "kocluk", "ilk-basvuru-sablonlari.js"));
const SABLON_METNI = oku("data/kocluk/ilk-basvuru-sablonlari.js");
const YONERGE = oku("kaynaklar/eposta-ornekleri/anonim/yonergeler.md");
const VERI = window.APMEBERRA_ULKE_VERI;

let gecen = 0, kalan = 0;
function ok(kosul, ad, detay) {
  if (kosul) { gecen++; return; }
  kalan++; console.log("✗ " + ad + (detay !== undefined ? "  → " + JSON.stringify(detay).slice(0, 600) : ""));
}
function esit(a, b, ad) { ok(a === b, ad, { beklenen: b, gelen: a }); }

// ------------------------------------------------------------------ 1) Şablon kütüphanesi
ok(Array.isArray(S) && S === window.APMEBERRA_ILK_BASVURU_SABLONLARI, "şablonlar hem module.exports hem window üzerinde");
const BILINEN = new Set(Object.keys(E.ETIKETLER));
const idler = new Set();
S.forEach((s) => {
  const p = E.ilkBasvuruSablonDogrula(s);
  ok(p.length === 0, "şema: " + s.id, p);
  ok(!idler.has(s.id), "tekrarsız id: " + s.id); idler.add(s.id);
  E.yerTutucular(s.konu + "\n" + s.govde).concat(s.zorunluAlanlar).forEach((y) => ok(BILINEN.has(y), "tanımlı değişken (" + s.id + "): " + y));
  s.dayanak.forEach((u) => ok(YONERGE.indexOf(u) >= 0, "dayanak yonergeler.md'de (" + s.id + "): " + u));
  ok(E.numaraliSoruSayisi(s.govde) <= 3, "en fazla 3 soru: " + s.id);
});
const MODELLER = ["lise", "lise-mezun", "uni-mezun"], AMACLAR = ["ilk-iletisim", "takip"], VARYANT = ["*", "de", "it", "nl", "fr", "se"];
VARYANT.forEach((u) => MODELLER.forEach((m) => AMACLAR.forEach((a) =>
  ok(S.some((s) => s.ulke === u && s.amac === a && s.modeller.indexOf(m) >= 0), "kapsam: " + u + " × " + m + " × " + a))));
// Kaynak dürüstlüğü (PM 19 Ekim 2026): gerçek örnek yok; şablon metninde "gerçek örnek" iddiası geçmez
ok(!/gerçek örnekten|gerçek örneklerden|real example/i.test(SABLON_METNI), "şablon dosyasında 'gerçek örnekten türetildi' iddiası yok");
// Sabit metinlerde kişisel veri yok: e-posta adresi, telefon/numara dizisi, yıl, test kurgu adları
S.forEach((s) => {
  const sabit = s.konu + "\n" + s.govde;
  ok(!/@/.test(sabit), "sabit metinde e-posta yok: " + s.id);
  ok(!/\d{5,}/.test(sabit), "sabit metinde numara dizisi yok: " + s.id);
  ok(!/\b(19|20)\d{2}\b/.test(sabit), "sabit metinde sabit yıl yok: " + s.id);
  ok(!/Ayşe|Yılmaz|Meberra|Kadıköy/.test(sabit), "sabit metinde kişi/okul adı yok: " + s.id);
});

// ------------------------------------------------------------------ 2) Koşullu blok motoru
const dk = { a: { dolu: "X", bos: "", liste: [], dizi: ["p", "q"] } };
esit(E.kosullariCoz("1{{#if a.dolu}}E{{else}}H{{/if}}2", dk), "1E2", "koşul: dolu -> if dalı");
esit(E.kosullariCoz("1{{#if a.bos}}E{{else}}H{{/if}}2", dk), "1H2", "koşul: boş -> else dalı");
esit(E.kosullariCoz("{{#if a.liste}}E{{/if}}", dk), "", "koşul: boş dizi yanlış, else yoksa boş");
esit(E.kosullariCoz("{{#if a.yok}}E{{else}}H{{/if}}", dk), "H", "koşul: tanımsız yol yanlış");
esit(E.kosullariCoz("{{#if a}}E{{/if}}", dk), "", "koşul: nesne (yaprak değil) yanlış");
esit(E.kosullariCoz("{{#if a.dolu}}A{{#if a.bos}}B{{else}}C{{/if}}D{{/if}}", dk), "ACD", "koşul: iç içe blok");
esit(E.kosullariCoz("{{#if a.bos}}A{{#if a.dolu}}B{{/if}}{{else}}Z{{/if}}", dk), "Z", "koşul: iç içe, dış yanlış");
const r0 = E.olustur({ konu: "K {{#if a.dolu}}({{a.dolu}}){{/if}}", govde: "A {{#if a.bos}}gizli {{/if}}B.\n\n\n\nC {{#if a.dizi}}{{a.dizi}}{{/if}}" }, dk);
esit(r0.konu, "K (X)", "olustur: konuda koşul");
esit(r0.govde, "A B.\n\nC p and q", "olustur: koşul + boşluk toplama");
esit(JSON.stringify(r0.eksikler), "[]", "olustur: koşul içindeki boş alan eksik sayılmaz");
esit(JSON.stringify(E.yerTutucular("{{#if x.y}}{{a.b}}{{else}}{{c.d}}{{/if}}")), JSON.stringify(["a.b", "c.d", "x.y"]), "yerTutucular: else atlanır, koşul yolu eklenir");
// Geriye uyum: koşulsuz şablonda çıktı bozulmaz (boşluk toplama uygulanmaz)
const eski = E.olustur({ konu: "A", govde: "x  y\n\n\n\nz " }, {});
esit(eski.govde, "x  y\n\n\n\nz ", "geriye uyum: koşulsuz gövde birebir");
esit(E.ilkBasvuruSablonDogrula(Object.assign({}, S[0], { govde: S[0].govde + "{{#if a.b}}" })).some((x) => /dengesiz/.test(x)), true, "şema: dengesiz koşul yakalanır");
esit(E.ilkBasvuruSablonDogrula(Object.assign({}, S[0], { govde: "1. a\n2. b\n3. c\n4. d" })).some((x) => /3 numaralı/.test(x)), true, "şema: 4 soru yakalanır");
esit(E.ilkBasvuruSablonDogrula(Object.assign({}, S[0], { dayanak: ["http://x"] })).some((x) => /dayanak/.test(x)), true, "şema: https olmayan dayanak yakalanır");

// ------------------------------------------------------------------ 3) Üniversite kimliği
esit(E.universiteKimligi("de", VERI.de.universiteler.liste[0]), "de-technical-university-of-munich", "universiteKimligi: TUM");
ULKELER.forEach((c) => {
  const L = VERI[c].universiteler.liste, ids = L.map((u) => E.universiteKimligi(c, u));
  esit(new Set(ids).size, ids.length, "kimlikler tekrarsız: " + c);
  ok(ids.every((id) => /^[a-z]{2}-[a-z0-9-]+$/.test(id)), "kimlik biçimi: " + c, ids.filter((id) => !/^[a-z]{2}-[a-z0-9-]+$/.test(id)));
  ok(ids.every((id, i) => { const b = E.universiteBul(VERI, id); return b && b.universite === L[i]; }), "universiteBul geri bulur: " + c);
});

// ------------------------------------------------------------------ 4) 3 model × 7 ülke × gerçek üniversite
const KULLANICI = { ad: "Ayşe", soyad: "Yılmaz" }; // kurgusal
const PROFIL = {
  "lise": { ogrenciModeli: "lise", sinif: "11", okul: "Kadıköy Anadolu Lisesi", okulSehir: "İstanbul", dogumTarihi: "2009-03-02", egitimDili: "en", ulkeler: ["de"] },
  "lise-mezun": { ogrenciModeli: "lise-mezun", sinif: "mezun", okul: "Kadıköy Anadolu Lisesi", mezuniyetYili: "2025", hedefBaslangicYili: "2027", yerlesmeDurumu: "uygun", dogumTarihi: "2007-03-02", egitimDili: "en", ulkeler: ["de"] },
  "uni-mezun": { ogrenciModeli: "uni-mezun", sinif: "lisans-mezun", lisansAlani: "Mechanical Engineering", lisansUniversitesi: "Yildiz Technical University", lisansDurumu: "son-sinif", lisansMezuniyetYili: "2027", gpa4: "3.4", dogumTarihi: "2004-03-02", egitimDili: "en", ulkeler: ["de"] }
};
const SINAV_AP = ["ap-calculus-ab", "ap-physics-1", "ielts-academic", "sat"], SINAV_APSIZ = ["ielts-academic"];
const TEST_ULKELER = ["de", "it", "nl", "fr", "es", "ie", "se"];
const VARYANTLI = new Set(["de", "it", "nl", "fr", "se"]);
// Kaynaklı adres havuzu (yalnız bunlar alıcı olabilir)
const KAYNAKLI = new Set();
(window.APMEBERRA_EPOSTA_SABLONLARI || []).forEach((s) => (s.alici && s.alici.secenekler || []).forEach((x) => { if (x.eposta && /^https?:\/\//.test(x.kaynak || "")) KAYNAKLI.add(x.eposta); }));
(window.APMEBERRA_TEYIT_TASLAKLARI.taslaklar || []).forEach((t) => { const a = E.taslakAlicisi(t); if (a.eposta) KAYNAKLI.add(a.eposta); });

let uretilen = 0, kelimeMin = 1e9, kelimeMax = 0, adresli = 0;
TEST_ULKELER.forEach((c) => {
  const L = VERI[c].universiteler.liste;
  [L[0], L[Math.min(L.length - 1, 4)]].forEach((uni) => {
    MODELLER.forEach((m) => {
      [["AP'li", SINAV_AP], ["AP'siz", SINAV_APSIZ], ["sınavsız", []]].forEach(([tur, sinavlar]) => {
        AMACLAR.forEach((amac) => {
          const ad = c + "/" + E.universiteKimligi(c, uni) + "/" + m + "/" + tur + "/" + amac;
          const r = E.ilkBasvuruHazirla(PROFIL[m], KULLANICI, uni, c, amac, { bugun: "2026-10-19", sinavlarim: sinavlar, ilkGonderim: "2026-10-20" });
          uretilen++;
          ok(r.sablonId, "şablon seçildi: " + ad);
          esit(r.sablonId, (amac === "takip" ? "takip-" : "ilk-") + (VARYANTLI.has(c) ? c : "genel") + "-" + m, "şablon önceliği (ülke > genel): " + ad);
          esit(JSON.stringify(r.eksikler), "[]", "tam profilde eksik yok: " + ad);
          ok(r.hazir, "hazır: " + ad);
          ok(r.kelimeSayisi >= 120 && r.kelimeSayisi <= 220, "kelime 120–220: " + ad, r.kelimeSayisi);
          kelimeMin = Math.min(kelimeMin, r.kelimeSayisi); kelimeMax = Math.max(kelimeMax, r.kelimeSayisi);
          ok(!/\{\{|\}\}|\[eksik:/.test(r.konu + r.govde), "yer tutucu kalmadı: " + ad);
          ok(E.numaraliSoruSayisi(r.govde) === 3, "3 numaralı soru: " + ad);
          ok(r.govde.indexOf("Ayşe Yılmaz") >= 0 && r.govde.indexOf(E.resmiAd(uni.ad)) >= 0, "ad ve üniversite metinde: " + ad);
          ok(/\b(winter semester|academic year) 20\d\d\/\d\d\b/.test(r.konu), "konu dönem içerir: " + ad, r.konu);
          if (sinavlar.indexOf("ap-calculus-ab") < 0) ok(!/\bAP\b|Advanced Placement/.test(r.konu + r.govde), "profilde AP yoksa 'AP' geçmez: " + ad);
          else if (amac === "ilk-iletisim") ok(/AP Calculus AB/.test(r.govde), "profilde AP varsa listelenir: " + ad);
          if (!sinavlar.length) ok(!/taken or planned/.test(r.govde), "sınav yoksa sınav cümlesi yok: " + ad);
          if (m !== "uni-mezun") ok(!/GPA|bachelor's degree in/.test(r.govde), "lise modelinde lisans bilgisi yok: " + ad);
          // Alıcı yalnızca kaynaklı
          if (r.alici.eposta) {
            adresli++;
            ok(KAYNAKLI.has(r.alici.eposta), "adres kaynaklı havuzda: " + ad, r.alici);
            ok(/^https:\/\//.test(r.alici.kaynak || ""), "adresin kaynak URL'si var: " + ad, r.alici);
            ok(r.mailto.url.indexOf("mailto:" + r.alici.eposta + "?") === 0, "mailto alıcılı: " + ad);
          } else {
            ok(r.alici.kaynak === null && /^https?:\/\//.test(r.alici.iletisimSayfasi || ""), "adres yoksa iletişim sayfası: " + ad, r.alici);
            ok(r.mailto.url.indexOf("mailto:?subject=") === 0, "mailto alıcısız: " + ad);
          }
          ok(r.dayanak.length > 0 && r.not, "dayanak ve not döner: " + ad);
        });
      });
    });
  });
});
// Bilinen kaynaklı eşleşmeler
const tum = E.ilkBasvuruHazirla(PROFIL.lise, KULLANICI, VERI.de.universiteler.liste[0], "de", "ilk-iletisim", { bugun: "2026-10-19" });
esit(tum.alici.eposta, "studium@tum.de", "TUM: eposta-sablonlari secenekler (de-tum) adresi");
const tcd = E.ilkBasvuruHazirla(PROFIL.lise, KULLANICI, VERI.ie.universiteler.liste[0], "ie", "ilk-iletisim", { bugun: "2026-10-19" });
esit(tcd.alici.eposta, "study@tcd.ie", "TCD: teyit taslağı (epostaKaynak) adresi");
const tcdYl = E.ilkBasvuruHazirla(PROFIL["uni-mezun"], KULLANICI, VERI.ie.universiteler.liste[0], "ie", "ilk-iletisim", { bugun: "2026-10-19" });
ok(tcdYl.alici.eposta === null || KAYNAKLI.has(tcdYl.alici.eposta), "TCD YL: lisans taslağının adresi düzey dışına taşınmaz", tcdYl.alici);

// Program seçilirse konu ve gövde programı yazar
const prog = E.ilkBasvuruHazirla(PROFIL.lise, KULLANICI, VERI.it.universiteler.liste[0], "it", "ilk-iletisim", { bugun: "2026-10-19", program: { ad: "Mechanical Engineering" } });
ok(/– Mechanical Engineering, academic year 2028\/29$/.test(prog.konu) && /the Mechanical Engineering programme/.test(prog.govde) && /this programme/.test(prog.govde), "program seçimi konu/gövdeye girer", prog.konu);
// Eğitim dili yerel -> "German-taught"
const yerel = E.ilkBasvuruHazirla(Object.assign({}, PROFIL.lise, { egitimDili: "yerel" }), KULLANICI, VERI.de.universiteler.liste[0], "de", "ilk-iletisim", { bugun: "2026-10-19" });
ok(/German-taught bachelor's programmes/.test(yerel.govde), "eğitim dili yerel: German-taught");
// Lise mezunu YKS yerleşmesi yoksa cümle çıkmaz
const yksYok = E.ilkBasvuruHazirla(Object.assign({}, PROFIL["lise-mezun"], { yerlesmeDurumu: "yok" }), KULLANICI, VERI.de.universiteler.liste[0], "de", "ilk-iletisim", { bugun: "2026-10-19" });
ok(!/YKS placement|placed in a four-year/.test(yksYok.govde), "YKS yerleşmesi yoksa yerleşme cümlesi yok");
// Üniversite mezunu: mezun durumunda "hold", GPA yoksa GPA cümlesi yok
const uniMez = E.ilkBasvuruHazirla(Object.assign({}, PROFIL["uni-mezun"], { lisansDurumu: "mezun", lisansMezuniyetYili: "2024", gpa4: "", lisansUniversitesi: "" }), KULLANICI, VERI.nl.universiteler.liste[0], "nl", "ilk-iletisim", { bugun: "2026-10-19" });
ok(/I hold a bachelor's degree in Mechanical Engineering in Türkiye, awarded in 2024\./.test(uniMez.govde) && !/GPA/.test(uniMez.govde), "uni-mezun mezun: hold + GPA yok + üniversite adı yok", uniMez.govde.slice(0, 300));
esit(JSON.stringify(uniMez.eksikler), "[]", "uni-mezun isteğe bağlı alanlar boşken eksik yok");
// Türkçe lisans alanı uyarısı
const trAlan = E.ilkBasvuruHazirla(Object.assign({}, PROFIL["uni-mezun"], { lisansAlani: "Makine Mühendisliği" }), KULLANICI, VERI.de.universiteler.liste[0], "de", "ilk-iletisim", { bugun: "2026-10-19" });
ok(trAlan.uyarilar.some((u) => /Türkçe/.test(u)), "Türkçe lisans alanı uyarısı");

// ------------------------------------------------------------------ 5) Eksik profil -> [eksik: …]
const eksikLise = E.ilkBasvuruHazirla({ ogrenciModeli: "lise", sinif: "11" }, { ad: "", soyad: "" }, VERI.de.universiteler.liste[0], "de", "ilk-iletisim", { bugun: "2026-10-19" });
["ogrenci.adSoyad", "ogrenci.okul"].forEach((y) => {
  ok(eksikLise.eksikler.indexOf(y) >= 0, "eksik profil eksikler: " + y, eksikLise.eksikler);
  ok(eksikLise.govde.indexOf("[eksik: " + y + "]") >= 0, "eksik profil metinde [eksik: " + y + "]");
});
ok(!eksikLise.hazir, "eksik profil hazır değil");
ok(!/Date of birth/.test(eksikLise.govde), "doğum tarihi yoksa satır çıkmaz");
const eksikMezun = E.ilkBasvuruHazirla({ ogrenciModeli: "lise-mezun", sinif: "mezun", okul: "X Lisesi" }, KULLANICI, VERI.it.universiteler.liste[0], "it", "ilk-iletisim", { bugun: "2026-10-19" });
ok(eksikMezun.eksikler.indexOf("ogrenci.mezuniyetAyYil") >= 0 && eksikMezun.govde.indexOf("[eksik: ogrenci.mezuniyetAyYil]") >= 0, "lise mezunu: mezuniyet yılı yoksa [eksik]", eksikMezun.eksikler);
const eksikUni = E.ilkBasvuruHazirla({ ogrenciModeli: "uni-mezun", sinif: "lisans-mezun", lisansDurumu: "mezun" }, KULLANICI, VERI.fr.universiteler.liste[0], "fr", "ilk-iletisim", { bugun: "2026-10-19" });
["ogrenci.lisansAlani", "ogrenci.lisansMezuniyetYili"].forEach((y) =>
  ok(eksikUni.eksikler.indexOf(y) >= 0 && eksikUni.govde.indexOf("[eksik: " + y + "]") >= 0, "uni-mezun eksik: " + y, eksikUni.eksikler));
const eksikTakip = E.ilkBasvuruHazirla(PROFIL.lise, KULLANICI, VERI.es.universiteler.liste[0], "es", "takip", { bugun: "2026-10-19" });
ok(eksikTakip.eksikler.indexOf("takip.ilkTarih") >= 0 && eksikTakip.govde.indexOf("[eksik: takip.ilkTarih]") >= 0, "takip: ilk gönderim tarihi yoksa [eksik]");
const sablonsuz = E.ilkBasvuruHazirla({}, KULLANICI, VERI.de.universiteler.liste[0], "de", "ilk-iletisim", { bugun: "2026-10-19" });
esit(sablonsuz.sablonId, null, "model yoksa şablon seçilmez");

// ------------------------------------------------------------------ 6) Örnek arşivi dürüstlüğü
const ham = fs.existsSync(path.join(KOK, "kaynaklar/eposta-ornekleri/ham")) ? fs.readdirSync(path.join(KOK, "kaynaklar/eposta-ornekleri/ham")).filter((f) => !/^\.gitkeep$/.test(f)) : [];
ok(/Gerçek e-posta örneği yok/.test(YONERGE), "yonergeler.md gerçek örnek olmadığını açıkça yazar");

// ------------------------------------------------------------------ 7) v1.1.1: yönerge kodu sızıntısı yok + profil çapaları
esit(E.SURUM, "1.1.1", "eposta.js sürümü 1.1.1");
const KOD_RE = /\((Y|K)\d/;
const YONERGE_KODLARI = new Set((YONERGE.match(/\b[YK]\d{1,2}\b/g) || []));
let kodDenetlenen = 0;
S.forEach((s) => {
  ok(!KOD_RE.test(s.not || "") && !KOD_RE.test(s.baslik || ""), "şablon not/baslik kodsuz: " + s.id, s.not);
  ok(Array.isArray(s.yonergeKodlari) && s.yonergeKodlari.length > 0, "yonergeKodlari makine alanı dolu: " + s.id);
  (s.yonergeKodlari || []).forEach((k) => ok(YONERGE_KODLARI.has(k), "yonergeKodlari yonergeler.md'de (" + s.id + "): " + k));
});
// Tüm şablonların hazırlanmış çıktısı: öğrenciye görünen alanlarda (konu, govde, not, uyarilar, alici.not) kod yok
const ORNEK_UNI = { de: VERI.de.universiteler.liste[0], it: VERI.it.universiteler.liste[0], nl: VERI.nl.universiteler.liste[0], fr: VERI.fr.universiteler.liste[0], se: VERI.se.universiteler.liste[0], "*": VERI.es.universiteler.liste[0] };
S.forEach((s) => {
  const c = s.ulke === "*" ? "es" : s.ulke;
  s.modeller.forEach((m) => {
    [PROFIL[m], { ogrenciModeli: m }].forEach((pr, i) => {
      const r = E.ilkBasvuruHazirla(pr, i ? {} : KULLANICI, ORNEK_UNI[s.ulke], c, s.amac, { bugun: "2026-10-19", sinavlarim: SINAV_AP, ilkGonderim: "2026-10-20" });
      esit(r.sablonId, s.id, "çıktı şablonu: " + s.id + (i ? " (eksik profil)" : ""));
      const ogrenciAlanlari = [r.konu, r.govde, r.not || "", (r.uyarilar || []).join("\n"), (r.alici && r.alici.not) || ""].join("\n");
      ok(!KOD_RE.test(ogrenciAlanlari), "öğrenci alanlarında yönerge kodu yok: " + s.id + (i ? " (eksik profil)" : ""), (ogrenciAlanlari.match(/.{0,40}\((Y|K)\d.{0,10}/) || [])[0]);
      ok(Array.isArray(r.yonergeKodlari) && r.yonergeKodlari.join() === s.yonergeKodlari.join(), "çıktı yonergeKodlari makine alanında: " + s.id);
      kodDenetlenen++;
    });
  });
});
// Doğrulayıcı kodlu notu yakalar
ok(E.ilkBasvuruSablonDogrula(Object.assign({}, S[0], { not: "Formu kullan (Y1)." })).some((p) => /yönerge kodu/.test(p)), "doğrulayıcı: kodlu not reddedilir");
ok(E.ilkBasvuruSablonDogrula(Object.assign({}, S[0], { yonergeKodlari: ["X9"] })).some((p) => /yonergeKodlari/.test(p)), "doğrulayıcı: geçersiz yönerge kodu reddedilir");
// KAYNAK.capa: profil.html'de gerçekten var olan kimlik; capa yoksa "pf-" + alan da var olmalı (profil türü)
const PROFIL_HTML = oku("profil.html");
const HTML_IDLER = new Set([...PROFIL_HTML.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]));
esit(E.KAYNAK["ogrenci.sinif"].capa, "pf-sinif-group", "KAYNAK sinif capa");
esit(E.KAYNAK["ogrenci.yksYerlesme"].capa, "pf-yerlesmeDurumu-group", "KAYNAK yksYerlesme capa");
Object.keys(E.KAYNAK).forEach((yol) => {
  const k = E.KAYNAK[yol];
  if (k.capa) ok(HTML_IDLER.has(k.capa), "capa profil.html'de var: " + yol + " -> " + k.capa);
  if (k.tur === "profil") ok(HTML_IDLER.has(k.capa || "pf-" + k.alan), "profil çapası çözülür: " + yol + " -> " + (k.capa || "pf-" + k.alan));
});
console.log("Kod sızıntısı denetlenen çıktı: " + kodDenetlenen);
console.log("Şablon: " + S.length + " (" + S.filter((s) => s.amac === "ilk-iletisim").length + " ilk-iletisim, " + S.filter((s) => s.amac === "takip").length + " takip; ülke varyantı: " + [...new Set(S.map((s) => s.ulke))].join(", ") + ")");
console.log("Üretilen e-posta: " + uretilen + " · kelime aralığı " + kelimeMin + "–" + kelimeMax + " · kaynaklı adresle çözülen: " + adresli + " · ham/ dosya sayısı: " + ham.length);
console.log("\nilk-basvuru birim testi: " + gecen + " geçti, " + kalan + " kaldı");
process.exit(kalan ? 1 : 0);
