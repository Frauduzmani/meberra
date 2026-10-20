// eposta.js birim testi (Node, bağımlılık yok). Çalıştır: node araclar/testler/eposta-birim-test.js
// İsteğe bağlı: SABLON_DOSYASI=<yol> verilirse o şablon dosyası da şemaya göre denetlenir.
"use strict";
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const E = require(path.join(__dirname, "..", "..", "assets", "js", "eposta.js"));

let gecen = 0, kalan = 0;
function ok(kosul, ad, detay) {
  if (kosul) { gecen++; return; }
  kalan++; console.log("✗ " + ad + (detay !== undefined ? "  → " + JSON.stringify(detay) : ""));
}
function esit(a, b, ad) { ok(a === b, ad, { beklenen: b, gelen: a }); }

// 1) Öğretim yılı: Eylül ve sonrası yeni öğretim yılı (sabit kod yok)
[["2026-10-12", 2026], ["2026-09-01", 2026], ["2026-08-31", 2025], ["2027-03-15", 2026], ["2027-06-30", 2026], ["2027-09-01", 2027], ["2026-01-01", 2025]]
  .forEach(([t, y]) => esit(E.ogretimYili(t), y, "ogretimYili " + t));
// Bugünün tarihiyle (parametresiz) aynı kural
const now = new Date();
esit(E.ogretimYili(), now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1, "ogretimYili bugün");

// 2) Mezuniyet yılı tablosu (spec §7.2, 2026-27 referansı)
const TABLO = { "12": 2027, "11": 2028, "10": 2029, "9": 2030 };
Object.keys(TABLO).forEach(s => esit(E.mezuniyetYili(s, null, "2026-10-12"), TABLO[s], "mezuniyet 2026-27 sınıf " + s));
// Bir sonraki öğretim yılında her şey bir yıl kayar; aynı öğretim yılının baharı değişmez
esit(E.mezuniyetYili("11", null, "2027-09-15"), 2029, "mezuniyet 2027-28 sınıf 11");
esit(E.mezuniyetYili("11", null, "2027-05-20"), 2028, "mezuniyet 2026-27 bahar sınıf 11");
esit(E.mezuniyetYili("mezun", "2025", "2026-10-12"), 2025, "mezun: profildeki yıl");
esit(E.mezuniyetYili("mezun", "", "2026-10-12"), null, "mezun: yıl yoksa null");
esit(E.mezuniyetYili("", null, "2026-10-12"), null, "sınıf yoksa null");

// 3) Değişkenler
const katalog = [
  { id: "ap-calculus-ab", ad: "AP Calculus AB", kategori: "AP" },
  { id: "ap-physics-1", ad: "AP Physics 1: Algebra-Based", kategori: "AP" },
  { id: "ap-chemistry", ad: "AP Chemistry", kategori: "AP" },
  { id: "ielts-academic", ad: "IELTS Academic", kategori: "Dil Sınavı" }
];
const profil = { okul: "Hisar Okulları", sinif: "11", ulkeler: ["de", "it"], eposta: "azra@example.com", dogumTarihi: "2009-05-14" };
const kullanici = { ad: "Meberra", soyad: "Yılmaz" };
const uni = { id: "de-tuhh", ad: "TUHH — Hamburg University of Technology", sehir: "Hamburg" };
const prog = { ad: "Engineering Science (9 uzmanlıktan 6'sı yalnızca İngilizce; Biomedical, Electrical ve Mechanical Engineering iki dilli)" };
const sec = { dil: "en", ulke: "de", bugun: "2026-10-12", universite: uni, program: prog, sinavlarim: ["ap-calculus-ab", "ielts-academic", "ap-physics-1", "ap-chemistry"], sinavKatalogu: katalog };
const d = E.degiskenler(profil, kullanici, sec);
esit(d.ogrenci.adSoyad, "Meberra Yılmaz", "adSoyad");
esit(d.ogrenci.mezuniyetYili, "2028", "mezuniyetYili");
esit(d.ogrenci.mezuniyetAyYil, "June 2028", "mezuniyetAyYil en");
esit(d.ogrenci.dogumTarihi, "14 May 2009", "dogumTarihi en");
esit(d.ogrenci.okulSehir, "Istanbul", "okulSehir varsayılan");
esit(d.ogrenci.diploma, "Turkish Lise Diplomasi", "diploma");
esit(d.ogrenci.sinif, "Grade 11", "sinif en");
esit(d.ogrenci.apSinavlari, "AP Calculus AB, AP Physics 1: Algebra-Based and AP Chemistry", "apSinavlari (yalnız AP, İngilizce ad)");
esit(d.basvuru.yil, "2028", "basvuru.yil");
esit(d.basvuru.donem, "winter semester 2028/29", "basvuru.donem de");
esit(d.universite.ad, "Hamburg University of Technology", "universite.ad: kısaltma — uzun ad -> uzun ad");
// resmiAd (PM notu): üniversite adındaki " (…)" ve " — …" ekleri temizlenir
[["Politecnico di Torino (PoliTo)", "Politecnico di Torino"],
 ["Saarland University (Universität des Saarlandes)", "Saarland University"],
 ["KIT — Karlsruhe Institute of Technology (Carl Benz School)", "Karlsruhe Institute of Technology"],
 ["Deggendorf Institute of Technology (DIT / THD)", "Deggendorf Institute of Technology"],
 ["Università degli Studi di Milano + Milano-Bicocca + Pavia (ortak program)", "Università degli Studi di Milano + Milano-Bicocca + Pavia"],
 ["Sapienza Università di Roma — main campus", "Sapienza Università di Roma"],
 ["Università di Trento", "Università di Trento"]
].forEach(([a, b]) => esit(E.resmiAd(a), b, "resmiAd: " + a));
esit(E.degiskenler(profil, kullanici, { universite: { ad: "Politecnico di Torino (PoliTo)" } }).universite.ad, "Politecnico di Torino", "universite.ad değişkeni resmiAd'dan geçer");
esit(d.program.ad, "Engineering Science", "program.ad: Türkçe açıklama parantezi atılır");
esit(d.bugun, "12 October 2026", "bugun en");
esit(E.programAdi("Mechanical Engineering (International)"), "Mechanical Engineering (International)", "programAdi: İngilizce parantez kalır");
esit(E.programAdi("Management and Technology (Campus München)"), "Management and Technology (Campus München)", "programAdi: Almanca parantez kalır");
esit(E.programAdi("Robotics (TWIN, Almanca ve İngilizce paralel modüller)"), "Robotics", "programAdi: Türkçe açıklama atılır");
const dIt = E.degiskenler(profil, kullanici, { dil: "it", ulke: "it", bugun: "2026-10-12" });
esit(dIt.basvuru.donem, "anno accademico 2028/29", "basvuru.donem it");
esit(dIt.ogrenci.mezuniyetAyYil, "giugno 2028", "mezuniyetAyYil it");
esit(dIt.bugun, "12 ottobre 2026", "bugun it");
const dDe = E.degiskenler(profil, kullanici, { dil: "de", ulke: "de", bugun: "2026-10-12" });
esit(dDe.bugun, "12. Oktober 2026", "bugun de");
esit(dDe.basvuru.donem, "Wintersemester 2028/29", "basvuru.donem de-de");
const dMez = E.degiskenler({ okul: "X", sinif: "mezun", mezuniyetYili: "2025", okulSehir: "Ankara" }, kullanici, { bugun: "2026-10-12", ulke: "it" });
esit(dMez.ogrenci.mezuniyetAyYil, "June 2025", "mezun mezuniyetAyYil");
esit(dMez.ogrenci.okulSehir, "Ankara", "okulSehir profilden");
// Tur 10 (K5-a, karar notu §4.3): mezunun başvuru yılı geçmiş mezuniyet yılı değil, hedef başlangıç yılıdır.
// hedefBaslangicYili yoksa (eski profil) bir sonraki akademik yıl: 12 Ekim 2026 -> 2027/28.
esit(dMez.basvuru.donem, "academic year 2027/28", "mezun dönem: hedef yıl yoksa bir sonraki akademik yıl");
esit(dMez.basvuru.yil, "2027", "mezun basvuru.yil varsayılan 2027");
esit(dMez.ogrenci.sinif, "High school graduate (2025)", "mezun sinif metni gerçek mezuniyet yılını yazar");
const dMez28 = E.degiskenler({ okul: "X", sinif: "mezun", mezuniyetYili: "2026", hedefBaslangicYili: "2028" }, kullanici, { bugun: "2026-10-14", ulke: "de" });
esit(dMez28.basvuru.yil, "2028", "mezun basvuru.yil = hedefBaslangicYili");
esit(dMez28.basvuru.donem, "winter semester 2028/29", "mezun dönem de: hedef yıl");

// K5-a yardımcıları
esit(E.varsayilanHedefYili("2026-10-14"), 2027, "varsayilanHedefYili Ekim 2026 -> 2027");
esit(E.varsayilanHedefYili("2027-03-15"), 2027, "varsayilanHedefYili Mart 2027 -> 2027");
esit(E.varsayilanHedefYili("2027-09-01"), 2028, "varsayilanHedefYili Eylül 2027 -> 2028");
esit(E.hedefBaslangicYili({ sinif: "mezun", hedefBaslangicYili: "2029" }, "2026-10-14"), 2029, "hedefBaslangicYili profilden");
esit(E.hedefBaslangicYili({ sinif: "mezun", hedefBaslangicYili: "abc" }, "2026-10-14"), 2027, "hedefBaslangicYili geçersizse varsayılan");
esit(E.hedefBaslangicYili({ sinif: "11", hedefBaslangicYili: "2029" }, "2026-10-14"), null, "hedefBaslangicYili mezun değilse null");
esit(E.takvimYili({ sinif: "mezun", mezuniyetYili: "2026", hedefBaslangicYili: "2027" }, "2026-10-14"), 2027, "takvimYili mezun = hedef");
esit(E.takvimYili({ sinif: "12" }, "2026-10-14"), 2027, "takvimYili 12 = mezuniyet yılı");
esit(E.takvimYili({}, "2026-10-14"), null, "takvimYili sınıf yoksa null");

// 4) Doldurma ve eksik tespiti
const sablon = {
  id: "t", baslik: "t", ulke: "de", alici: { tur: "universite" },
  konu: "Admission – {{ ogrenci.diploma }} – {{program.ad}}\n({{basvuru.donem}})",
  govde: "Dear Team,\r\n\r\nI am {{ogrenci.adSoyad}}, born {{ogrenci.dogumTarihi}}.\nAP: {{ogrenci.apSinavlari}}\n{{ogrenci.bilinmeyenAlan}}\n{{ogrenci.eposta}}",
  zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "universite.ad", "ogrenci.telefon"]
};
const r1 = E.olustur(sablon, d);
esit(r1.konu, "Admission – Turkish Lise Diplomasi – Engineering Science (winter semester 2028/29)", "konu dolduruldu, satır sonu tek satıra indi");
ok(r1.govde.indexOf("I am Meberra Yılmaz, born 14 May 2009.") >= 0, "gövde dolduruldu", r1.govde);
ok(r1.govde.indexOf("\r") < 0, "gövdede satır sonu \\n'e normalize");
ok(r1.govde.indexOf("[eksik: ogrenci.bilinmeyenAlan]") >= 0, "bilinmeyen değişken [eksik: …] olarak kalır");
esit(JSON.stringify(r1.bilinmeyenler), JSON.stringify(["ogrenci.bilinmeyenAlan", "ogrenci.telefon"]), "bilinmeyenler listesi");
esit(JSON.stringify(r1.eksikler), JSON.stringify(["ogrenci.bilinmeyenAlan", "ogrenci.telefon"]), "eksikler: yalnız tanımsızlar (dolu profil)");

const bosProfil = { okul: "Hisar Okulları", sinif: "11", ulkeler: ["de"] };
const d2 = E.degiskenler(bosProfil, kullanici, { bugun: "2026-10-12", ulke: "de", sinavlarim: [], sinavKatalogu: katalog });
const r2 = E.olustur(sablon, d2);
["ogrenci.dogumTarihi", "ogrenci.apSinavlari", "ogrenci.eposta", "program.ad", "universite.ad"].forEach(y =>
  ok(r2.eksikler.indexOf(y) >= 0, "eksik tespit: " + y, r2.eksikler));
ok(r2.govde.indexOf("born [eksik: ogrenci.dogumTarihi].") >= 0, "boş değişken [eksik: …]", r2.govde);
ok(r2.konu.indexOf("[eksik: program.ad]") >= 0, "konuda eksik işareti");
esit(r2.eksikler.length, new Set(r2.eksikler).size, "eksikler tekrarsız");
// Yalnız IELTS seçiliyse AP listesi boş -> eksik
const d3 = E.degiskenler(profil, kullanici, { bugun: "2026-10-12", sinavlarim: ["ielts-academic"], sinavKatalogu: katalog });
esit(d3.ogrenci.apSinavlari, "", "AP olmayan sınavlar sayılmaz");
esit(JSON.stringify(E.kalanEksikler("a [eksik: x.y] b [eksik: x.y] [eksik: z]")), JSON.stringify(["x.y", "z"]), "kalanEksikler");
esit(JSON.stringify(E.yerTutucular("{{a.b}} {{ c }} {{a.b}}")), JSON.stringify(["a.b", "c"]), "yerTutucular");

// 5) mailto kodlaması
const m = E.mailto("admission@tuhh.de", "Başvuru – Çağrı & Şule?", "Satır 1: İğüşöç\nSatır 2\r\nSon (bitti)!");
esit(m.url, "mailto:admission@tuhh.de?subject=" + "Ba%C5%9Fvuru%20%E2%80%93%20%C3%87a%C4%9Fr%C4%B1%20%26%20%C5%9Eule%3F" +
  "&body=" + "Sat%C4%B1r%201%3A%20%C4%B0%C4%9F%C3%BC%C5%9F%C3%B6%C3%A7%0D%0ASat%C4%B1r%202%0D%0ASon%20%28bitti%29%21", "mailto: Türkçe karakter + CRLF + ayraçlar");
// Çözünce özgün metin (CRLF ile) geri gelmeli
const q = new URL(m.url.replace(/^mailto:[^?]*/, "http://x/"));
esit(q.searchParams.get("subject"), "Başvuru – Çağrı & Şule?", "mailto konu geri çözülür");
esit(q.searchParams.get("body"), "Satır 1: İğüşöç\r\nSatır 2\r\nSon (bitti)!", "mailto gövde geri çözülür");
ok(m.url.indexOf("+") < 0, "boşluk + değil %20");
esit(E.mailto("", "Konu", "").url, "mailto:?subject=Konu", "alıcısız mailto");
esit(E.mailto(["a@b.de", "geçersiz", "c@d.it"], "", "").url, "mailto:a@b.de,c@d.it", "çoklu alıcı, geçersiz atılır");
ok(!m.uzun, "kısa metin uzun değil");
const uzun = E.mailto("a@b.de", "K", "ğ".repeat(400));
ok(uzun.uzun && uzun.uzunluk > E.MAILTO_SINIR, "uzun gövde (≈2000+) işaretlenir", uzun.uzunluk);
ok(E.epostaGecerli("azra.y+ap@example.com.tr") && !E.epostaGecerli("azra@") && !E.epostaGecerli("a b@c.de"), "e-posta biçim doğrulaması");

// 6) Şablon şeması, süzme, depo
esit(E.sablonDogrula(sablon).length, 0, "örnek şablon geçerli");
ok(E.sablonDogrula({ id: "x", baslik: "x", konu: "x", govde: "x", ulke: "fr", alici: {} }).length === 2, "bozuk şablon yakalanır");
const liste = [Object.assign({}, sablon, { id: "a", ulke: "de" }), Object.assign({}, sablon, { id: "b", ulke: "it" }), Object.assign({}, sablon, { id: "c", ulke: "genel" })];
esit(E.sablonlariSuz(liste, ["it"]).map(s => s.id).join(","), "b,c", "ülkeye göre süzme + genel");
// siniflar (PM notu): isteğe bağlı sınıf kısıtı
const s11 = Object.assign({}, sablon, { id: "s11", ulke: "it", siniflar: ["11"] });
esit(E.sablonlariSuz([s11], ["it"], "11").length, 1, "siniflar: 11. sınıf görür");
esit(E.sablonlariSuz([s11], ["it"], "12").length, 0, "siniflar: 12. sınıf görmez");
esit(E.sablonlariSuz([s11], ["it"], "mezun").length, 0, "siniflar: mezun görmez");
esit(E.sablonlariSuz([s11], ["it"]).length, 1, "siniflar: sınıf verilmezse süzme yok");
ok(E.sablonDogrula(Object.assign({}, s11, { siniflar: "11" })).length === 1, "siniflar dizi değilse şema hatası");
// alici.secenekler (PM notu)
const sSec = Object.assign({}, sablon, { alici: { tur: "universite", eposta: null, iletisimSayfasi: null, not: "genel not",
  secenekler: [{ universiteId: "de-saarland", kurum: "Saarland – Sekretariat", eposta: "studium@uni-saarland.de", iletisimSayfasi: "https://x.de/c", kaynak: "https://x.de/k", not: "özel not" },
               { universiteId: "de-fau", kurum: "FAU", eposta: null, iletisimSayfasi: "https://fau.de/c" }] } });
const a1 = E.aliciCoz(sSec, "de-saarland");
ok(a1.secenektenMi && a1.eposta === "studium@uni-saarland.de" && a1.kurum === "Saarland – Sekretariat" && a1.not === "özel not" && a1.genelNot === "genel not", "aliciCoz: seçenekten", a1);
const a2 = E.aliciCoz(sSec, "de-tum");
ok(!a2.secenektenMi && a2.eposta === null && a2.not === "genel not", "aliciCoz: listede yoksa genel alici", a2);
esit(E.aliciCoz(sSec, "de-fau").iletisimSayfasi, "https://fau.de/c", "aliciCoz: e-postasız seçenek iletişim sayfası");
esit(JSON.stringify(E.universiteSecimi(sSec)), JSON.stringify({ gerekli: true, izinli: ["de-saarland", "de-fau"] }), "universiteSecimi: seçeneklerle sınırlı");
esit(JSON.stringify(E.universiteSecimi(sablon)), JSON.stringify({ gerekli: true, izinli: null }), "universiteSecimi: seçenek yoksa tüm üniversiteler");
const kurumUni = { id: "k", baslik: "k", ulke: "it", alici: { tur: "kurum", kurum: "X" }, konu: "a", govde: "{{universite.ad}}" };
esit(E.universiteSecimi(kurumUni).gerekli, true, "universiteSecimi: kurum şablonu universite.ad kullanıyorsa seçim gerekir");
esit(E.universiteSecimi({ id: "k", baslik: "k", ulke: "it", alici: { tur: "kurum" }, konu: "a", govde: "b" }).gerekli, false, "universiteSecimi: gerekmez");
const depo = E.depoNormalize({ kayitlar: [{ id: "1", durum: "garip" }, null, { durum: "gonderildi" }, { id: "2", durum: "yanit", konu: "K" }] });
esit(depo.kayitlar.length, 2, "depo: bozuk kayıt atılır");
esit(depo.kayitlar[0].durum, "taslak", "depo: bilinmeyen durum taslak olur");
esit(JSON.stringify(E.depoNormalize(null)), JSON.stringify({ kayitlar: [] }), "depo boş");
const k = E.yeniKayit({ sablonId: "a", konu: "K", govde: "G", alici: "x@y.de" }, "2026-10-12T10:00:00Z");
["id", "sablonId", "alici", "universiteId", "programAd", "konu", "govde", "durum", "olusturma", "gonderim", "yanitNotu"].forEach(f =>
  ok(Object.prototype.hasOwnProperty.call(k, f), "kayıt alanı (§7.4): " + f));
esit(k.durum, "taslak", "yeni kayıt taslak");

// 7) (İsteğe bağlı) gerçek şablon dosyası şema denetimi
const dosya = process.env.SABLON_DOSYASI || path.join(__dirname, "..", "..", "data", "kocluk", "eposta-sablonlari.js");
if (fs.existsSync(dosya)) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(dosya, "utf8"), ctx);
  const S = ctx.window.APMEBERRA_EPOSTA_SABLONLARI || [];
  const tumYollar = new Set(Object.keys(E.ETIKETLER));
  let sorun = 0;
  S.forEach(s => {
    const p = E.sablonDogrula(s);
    const yollar = E.yerTutucular((s && s.konu) + " " + (s && s.govde)).concat((s && s.zorunluAlanlar) || []);
    yollar.filter(y => !tumYollar.has(y)).forEach(y => p.push("tanımsız değişken: " + y));
    if (p.length) { sorun++; console.log("  şablon " + (s && s.id) + ": " + p.join("; ")); }
  });
  console.log("Şablon dosyası " + path.basename(dosya) + ": " + S.length + " şablon, " + sorun + " sorunlu");
  ok(sorun === 0 || !!process.env.SABLON_DOSYASI, "gerçek şablon dosyası şemaya uygun");
} else {
  console.log("Şablon dosyası yok (data/kocluk/eposta-sablonlari.js) — şema denetimi atlandı.");
}

console.log("\neposta.js birim testi: " + gecen + " geçti, " + kalan + " kaldı");
process.exit(kalan ? 1 : 0);
