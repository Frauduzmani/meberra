// 1.22.0 — Hedef sihirbazı motoru birim testi (tarayıcı gerekmez). Çalıştır: node araclar/testler/hedef-birim-test.js
// Kapsam: secimCoz/secimAdres (yeni + eski adres), sutunlar, hucre çözüm sırası, ortakYol, profilYamasi birleştirme kuralları.
"use strict";
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const H = require(path.join(ROOT, "assets", "js", "hedef-motor.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m, a);

const K = (m) => ({ kaynak: [{ ad: "Kaynak", url: "https://ornek.org/" + m }], kesinlik: "resmi" });
const V = {
  it: {
    ad: "İtalya",
    universiteler: { liste: [{ ad: "Politecnico di Milano", qsAd: "Politecnico di Milano", sehir: "Milano", qsSira: "98" }] },
    isterler: {
      varsayilan: {
        diploma: Object.assign({ durum: "ok", metin: "12 yıl yeterli" }, K("d")),
        yks: Object.assign({ durum: "ok", metin: "Gerekmez" }, K("y")),
        ap: Object.assign({ durum: "ok", metin: "2 ilgili AP", sayi: 2, dersler: ["calculus-ab"] }, K("a")),
        sinav: Object.assign({ durum: "uyari", metin: "Giriş sınavı", sinavlar: ["cent-s"] }, K("s")),
        dil: Object.assign({ durum: "uyari", metin: "IELTS", belge: "IELTS", esik: 6 }, K("l"))
      },
      alanlar: { tip: { sinav: Object.assign({ durum: "uyari", metin: "IMAT", sinavlar: ["imat"] }, K("t")) } },
      universite: {
        "it-politecnico-di-milano": { sinav: Object.assign({ durum: "uyari", metin: "TOL", sinavlar: ["polimi-tol"] }, K("p")) }
      }
    }
  },
  de: {
    ad: "Almanya",
    universiteler: { liste: [{ ad: "Technische Universität München (TUM)", qsAd: "Technical University of Munich", sehir: "Munich", qsSira: "25" }] },
    isterler: {
      varsayilan: {
        yks: Object.assign({ durum: "uyari", metin: "YKS şart" }, K("dy")),
        ap: Object.assign({ durum: "uyari", metin: "AP giriş hakkı vermez", sayi: 0, dersler: [] }, K("da")),
        dil: Object.assign({ durum: "uyari", metin: "IELTS 6.0–6.5", belge: "IELTS", esik: [6, 6.5] }, K("dl"))
      }
    }
  }
};

// 1) secimCoz / secimAdres
eq(H.secimCoz("?u=it,de&o=it-politecnico-di-milano&s=12&a=tip"), { ulkeler: ["it", "de"], okullar: { it: ["it-politecnico-di-milano"] }, sinif: "12", alan: "tip" }, "secimCoz yeni");
eq(H.secimCoz("?ulke=de&sinif=11"), { ulkeler: ["de"], okullar: {}, sinif: "11", alan: "muhendislik" }, "secimCoz eski ulke");
eq(H.secimCoz("?model=lise-mezun&ulke=it").sinif, "mezun", "eski mezun");
eq(H.secimCoz("").sinif, "11", "varsayılan sınıf 11");
eq(H.secimCoz("?u=it,de,nl,at,cz,es,fr").ulkeler.length, 5, "en çok 5 ülke");
eq(H.secimCoz("?u=us,it&o=de-x").okullar, {}, "bilinmeyen ülke ve seçilmemiş ülkenin okulu düşer");
eq(H.secimCoz("?u=it,it&s=13&a=xx"), { ulkeler: ["it"], okullar: {}, sinif: "11", alan: "muhendislik" }, "tekrar ve geçersiz değerler");
const S = { ulkeler: ["it", "de"], okullar: { it: ["it-politecnico-di-milano"], de: ["de-technical-university-of-munich"] }, sinif: "mezun", alan: "isletme" };
eq(H.secimCoz(H.secimAdres(S)), S, "adres gidiş-dönüş");
eq(H.secimAdres({ ulkeler: ["nl"], okullar: {}, sinif: "12", alan: "muhendislik" }), "?u=nl&s=12&a=muhendislik", "adres boş okul yazmaz");

// 2) sutunlar
const sut = H.sutunlar({ ulkeler: ["it", "de"], okullar: { it: ["it-politecnico-di-milano"] } }, V);
eq(sut.map(c => c.tur + ":" + c.cc), ["uni:it", "ulke:de"], "sutunlar okul+ülke");
eq([sut[0].uniId, sut[0].ad, sut[1].uniId], ["it-politecnico-di-milano", "Politecnico di Milano", null], "sütun alanları");
eq(H.sutunlar({ ulkeler: ["it"], okullar: { it: ["it-yok"] } }, V).map(c => c.tur), ["ulke"], "listede olmayan okul ülke sütununa düşer");

// 3) hucre çözüm sırası
eq(H.hucre(V, "it", "it-politecnico-di-milano", "muhendislik", "sinav").sinavlar, ["polimi-tol"], "uni ezer");
eq(H.hucre(V, "it", null, "tip", "sinav").sinavlar, ["imat"], "ülke+alan");
eq(H.hucre(V, "it", null, "muhendislik", "sinav").sinavlar, ["cent-s"], "ülke varsayılanı");
eq(H.hucre(V, "de", "de-yok", "muhendislik", "donem").durum, "teyit", "veri yok → teyit");
ok(H.SATIRLAR.every(s => H.hucre({}, "it", null, "fen", s).durum === "teyit"), "boş veri her satır teyit");
ok(H.SATIRLAR.every(s => typeof H.hucre({}, "it", null, "fen", s).metin === "string"), "teyit hücresinde metin var");

// 4) ortakYol
const bugun = "2026-10-24";
const o1 = H.ortakYol(H.sutunlar({ ulkeler: ["it"], okullar: {} }, V), V, "muhendislik", "11", bugun);
eq([o1.apSayi, o1.apDersleri, o1.apOneri], [2, ["calculus-ab", "physics-1"], false], "AP sayısı ve varsayılandan tamamlama");
eq(o1.dil, { belge: "IELTS", esik: 6 }, "dil eşiği");
eq([o1.sinavlar, o1.yksUyari], [["cent-s"], false], "sınav ve YKS");
eq([o1.sinavYili, o1.haftaKaldi], [2027, 27], "11. sınıf → 2027, 27 hafta");
const o2 = H.ortakYol(H.sutunlar({ ulkeler: ["it", "de"], okullar: { it: ["it-politecnico-di-milano"] } }, V), V, "muhendislik", "12", bugun);
eq(o2.dil, { belge: "IELTS", esik: 6.5 }, "en yüksek eşik, aralığın üst ucu");
eq([o2.sinavlar, o2.yksUyari, o2.sinavYili], [["polimi-tol"], true, 2027], "birleşim, YKS uyarısı, 12 → 2027");
const o3 = H.ortakYol(H.sutunlar({ ulkeler: ["de"], okullar: {} }, V), V, "tip", "9", bugun);
eq([o3.apOneri, o3.apDersleri, o3.sinavYili], [true, ["biology", "chemistry", "calculus-ab"], 2029], "AP istenmiyorsa alan önerisi; 9 → 2029");
eq(H.ortakYol(H.sutunlar({ ulkeler: ["de"], okullar: {} }, V), V, "fen", "mezun", bugun).sinavYili, 2027, "mezun → sıradaki yıl");
eq(H.ortakYol([], {}, "muhendislik", "11", bugun).apDersleri, ["calculus-ab", "physics-1", "chemistry"], "boş seçimde de ders var");

// 5) profilYamasi
const sec = { ulkeler: ["it", "de"], okullar: { it: ["it-politecnico-di-milano"] }, sinif: "11", alan: "muhendislik" };
const p1 = H.profilYamasi(null, sec, o1);
eq([p1.tamamlandi, p1.ogrenciModeli, p1.sinif, p1.ulkeler, p1.aktifRota, p1.egitimDili, p1.hedefAlan, p1.hedefOkullar, p1.sinavYili],
  [true, "lise", "11", ["it", "de"], "it", "en", "Mühendislik", ["it-politecnico-di-milano"], 2027], "yeni profil (hedefAlan görünen ad)");
eq(H.profilYamasi(null, Object.assign({}, sec, { alan: "tip" }), o1).hedefAlan, "Tıp/Sağlık", "alan adı");
eq([H.alanKodu("Tıp/Sağlık"), H.alanKodu("Mühendislik"), H.alanKodu("Bilgisayar"), H.alanKodu(null)], ["tip", "muhendislik", "muhendislik", "muhendislik"], "profil alan adı → kod");
eq(p1.apDersleri, [{ ders: "calculus-ab", hedef: 4 }, { ders: "physics-1", hedef: 4 }], "yeni profil dersleri hedef 4");
eq(H.profilYamasi(null, Object.assign({}, sec, { sinif: "mezun" }), o1).ogrenciModeli, "lise-mezun", "mezun modeli");
const eski = { sinif: "10", ogrenciModeli: "lise", aktifRota: "nl", sinavYili: 2028, ulkeler: ["nl", "at", "cz", "es"], apDersleri: [{ ders: "biology", hedef: 5 }], hedefOkullar: ["nl-x"], tamamlandi: true };
const p2 = H.profilYamasi(eski, sec, o1);
eq([p2.sinif, p2.aktifRota, p2.sinavYili, p2.ogrenciModeli], ["10", "nl", 2028, "lise"], "dolu alanlar korunur");
eq(p2.ulkeler, ["it", "de", "nl", "at", "cz"], "ülkeler başa eklenir, en çok 5");
eq(p2.apDersleri, [{ ders: "biology", hedef: 5 }, { ders: "calculus-ab", hedef: 4 }, { ders: "physics-1", hedef: 4 }], "dersler korunur + eklenir");
eq(p2.hedefOkullar, ["nl-x", "it-politecnico-di-milano"], "okullar birleşimi");
eq(H.profilYamasi({ hedefAlan: "Mühendislik", ulkeler: ["nl"] }, Object.assign({}, sec, { alan: "fen" }), o1).hedefAlan, "Fen", "alan sihirbazdaki seçimle güncellenir");
eq(eski.ulkeler.length, 4, "eski profil değiştirilmez");

// 6) Son inceleme düzeltmeleri
eq(H.ortakYol([], {}, "muhendislik", "11", "2027-06-15").sinavYili, 2028, "Mayıs sınavı geçtiyse 11. sınıf sonraki yıla");
eq(H.ortakYol([], {}, "muhendislik", "10", "2027-06-15").sinavYili, 2029, "10. sınıf Haziran'da");
const VT = { nl: { ad: "Hollanda", isterler: { varsayilan: { yks: { durum: "teyit", metin: "?" } } } } };
const oT = H.ortakYol(H.sutunlar({ ulkeler: ["nl"], okullar: {} }, VT), VT, "muhendislik", "11", bugun);
eq([oT.yksUyari, oT.yksTeyit], [false, true], "YKS teyit 'gerekli' sayılmaz");
eq([o2.yksUyari, o2.yksTeyit], [true, false], "YKS uyari gerekli");
const ET = (s, h) => H.hucreEtiket(s, h, x => x.toUpperCase());
eq([ET("dil", { durum: "kapali" }), ET("dil", { durum: "uyari" }), ET("dil", { durum: "uyari", belge: "IELTS", esik: [6, 6.5] }), ET("dil", { durum: "ok" })],
  ["İngilizce program yok", "Belge gerekli", "IELTS 6–6.5", "Gerekmez"], "dil etiketleri");
eq([ET("yks", { durum: "teyit" }), ET("yks", { durum: "uyari" }), ET("ap", { durum: "ok", sayi: 0 }), ET("ap", { durum: "uyari", sayi: 4 }), ET("sinav", { durum: "uyari", sinavlar: ["cent-s"] })],
  ["Teyit et", "Şart", "Şart değil", "4 AP", "CENT-S"], "diğer etiketler");
eq(H.cikanUlkeler(eski, p2), ["es"], "birleştirmede düşen ülke");
eq(H.cikanUlkeler(null, p1), [], "yeni profilde düşen yok");

console.log("\n" + pass + " geçti, " + fail + " kaldı");
process.exit(fail ? 1 : 0);
