// Tur 11 (D5, plan §4) — profil şeması birim testi (tarayıcı gerekmez). Çalıştır: node araclar/testler/profil-v2-birim-test.js
// Kapsam: auth.js profilNormallestir (eski kayıt taşıma), model / 15 ülke / en fazla 5 / eğitim dili / üniversite mezunu
// doğrulamaları, model değişiminde alan temizliği, current() normalleştirmesi, app.js apProfilNorm ile aynılık. Dosya yazmaz.
"use strict";
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };

const depo = {};
const ls = { getItem: k => (k in depo ? depo[k] : null), setItem: (k, v) => { depo[k] = String(v); }, removeItem: k => { delete depo[k]; }, key: i => Object.keys(depo)[i] || null, get length() { return Object.keys(depo).length; } };
global.window = { localStorage: ls, crypto: require("crypto").webcrypto };
require(path.join(ROOT, "assets", "js", "auth.js"));
const AUTH = global.window.APMEBERRA_AUTH;
const PK = id => "apmeberra-hesap:v1:profil:" + id;
const oku = id => JSON.parse(depo[PK(id)] || "null");
const Y = new Date().getFullYear();

// app.js apProfilNorm (tarayıcı kodu): sabitler ve işlev metinden çıkarılıp çalıştırılır
const app = fs.readFileSync(path.join(ROOT, "assets", "js", "app.js"), "utf8");
const sabit = ad => new RegExp("const " + ad + " = ([^;]+);").exec(app)[1];
const apProfilNorm = new Function("return (function(){ const APMEBERRA_MODELLER = " + sabit("APMEBERRA_MODELLER") + "; const APMEBERRA_ULKE_ADLARI = " + sabit("APMEBERRA_ULKE_ADLARI") + "; " +
  /function apProfilNorm\(p\) \{[\s\S]*?\n\}/.exec(app)[0] + " return apProfilNorm; })();")();

(async () => {
  // 1) Normalleştirme (okuma anında; depoya yazmaz)
  const N = AUTH.profilNormallestir;
  const ORNEK = [
    [{ okul: "L", sinif: "mezun", ulkeler: ["de", "it"], tamamlandi: true }, { ogrenciModeli: "lise-mezun", sinif: "mezun", egitimDili: "en", ulkeler: ["de", "it"] }],
    [{ okul: "L", sinif: "11", ulkeler: ["de"], tamamlandi: true }, { ogrenciModeli: "lise", sinif: "11", egitimDili: "en", ulkeler: ["de"] }],
    [{ sinif: "lisans-mezun", ulkeler: ["nl", "xx", "nl", "se"] }, { ogrenciModeli: "uni-mezun", sinif: "lisans-mezun", egitimDili: "en", ulkeler: ["nl", "se"] }],
    [{ ogrenciModeli: "uni-mezun", sinif: "11", egitimDili: "yerel" }, { ogrenciModeli: "uni-mezun", sinif: "lisans-mezun", egitimDili: "yerel" }],
    [{ sinif: "", egitimDili: "fr" }, { ogrenciModeli: null, sinif: "", egitimDili: "en" }]
  ];
  ORNEK.forEach(([g, b], i) => {
    const n = N(g), a = apProfilNorm(g);
    const uy = Object.keys(b).every(k => JSON.stringify(n[k]) === JSON.stringify(b[k]));
    ok(uy && JSON.stringify(n) === JSON.stringify(a), "normalleştirme " + (i + 1) + " (auth = app.js)", { auth: n, app: a });
  });
  const eski = { okul: "L", sinif: "mezun", ulkeler: ["de"], tamamlandi: true, ozelAlan: 7 };
  ok(JSON.stringify(N(N(eski))) === JSON.stringify(N(eski)) && !("ogrenciModeli" in eski) && N(eski).ozelAlan === 7, "normalleştirme idempotent, girdiyi değiştirmez, bilinmeyen alanı korur");
  depo[PK("eski")] = JSON.stringify(eski);
  depo["apmeberra-hesap:v1:kullanicilar"] = JSON.stringify([{ id: "eski", ad: "E", soyad: "S", kullaniciAdi: "e" }]);
  depo["apmeberra-hesap:v1:oturum"] = JSON.stringify({ id: "eski" });
  const cur = await AUTH.current();
  ok(cur.profile.ogrenciModeli === "lise-mezun" && cur.profile.egitimDili === "en" && !("ogrenciModeli" in oku("eski")), "current(): normalleştirilmiş profil döner, depoya yazılmaz");

  // 2) Eski çağrı biçimi (yalnızca sinif) çalışmaya devam eder
  let r = await AUTH.saveProfile("a1", { okul: "Test Lisesi", sinif: "mezun", ulkeler: ["de", "it"], yerlesmeDurumu: "yok" });
  ok(r.ok && oku("a1").ogrenciModeli === "lise-mezun" && oku("a1").sinif === "mezun" && oku("a1").egitimDili === "en", "eski çağrı {sinif: mezun}: model türetildi, dil varsayılan en", r.errors);
  r = await AUTH.saveProfile("a2", { okul: "Test Lisesi", sinif: "11", ulkeler: ["de"] });
  ok(r.ok && oku("a2").ogrenciModeli === "lise", "eski çağrı {sinif: 11}: lise");

  // 3) 15 ülke, en fazla 5, geçersiz kodlar atılır
  r = await AUTH.saveProfile("u1", { ogrenciModeli: "lise", okul: "L", sinif: "10", ulkeler: ["nl", "xx", "ie", "nl"], egitimDili: "en" });
  ok(r.ok && JSON.stringify(oku("u1").ulkeler) === '["nl","ie"]' && oku("u1").aktifRota === "nl", "15 ülke: nl+ie kabul, xx ve tekrar atıldı, aktif rota ilk ülke");
  r = await AUTH.saveProfile("u2", { ogrenciModeli: "lise", okul: "L", sinif: "10", ulkeler: ["de", "it", "at", "ch", "nl", "be"] });
  ok(!r.ok && /En fazla 5/.test(r.errors.ulkeler), "6 ülke reddedildi (en fazla 5)", r.errors);
  r = await AUTH.saveProfile("u3", { ogrenciModeli: "lise", okul: "L", sinif: "10", ulkeler: ["de"], egitimDili: "fr" });
  ok(!r.ok && r.errors.egitimDili === "Eğitim dilini seç.", "geçersiz eğitim dili reddedildi");
  r = await AUTH.saveProfile("u4", { ogrenciModeli: "lise", okul: "L", ulkeler: ["de"] });
  ok(!r.ok && r.errors.sinif === "Sınıfını seç.", "lise modelinde sınıf zorunlu");
  r = await AUTH.saveProfile("u5", { ogrenciModeli: "uzay", okul: "L", ulkeler: ["de"] });
  ok(!r.ok && r.errors.sinif, "tanınmayan model ve sınıf reddedildi");
  ok(AUTH.ulkeAd("cz") === "Çekya" && AUTH.sinifLabel("lisans-mezun") === "Üniversite mezunu" && AUTH.sinifLabel("mezun") === "Mezun", "ulkeAd 15 ülke, sinifLabel modeller");

  // 4) Üniversite mezunu
  const UNI = { ogrenciModeli: "uni-mezun", ulkeler: ["se", "nl"], egitimDili: "en", lisansAlani: "  Makine   Mühendisliği ", lisansDurumu: "mezun", lisansMezuniyetYili: String(Y - 1), gpa4: "3,45", hedefBaslangicYili: String(Y + 1) };
  r = await AUTH.saveProfile("y1", UNI);
  const y1 = oku("y1");
  ok(r.ok && y1.sinif === "lisans-mezun" && !("okul" in y1) && y1.lisansAlani === "Makine Mühendisliği" && y1.gpa4 === "3.45" && y1.hedefBaslangicYili === String(Y + 1) && !("yerlesmeDurumu" in y1), "uni-mezun: okul gerekmez, alan boşlukları sadeleşti, GPA virgül→nokta, hedef yıl", r.ok ? y1 : r.errors);
  for (const [alan, deger, desen] of [["lisansAlani", "", /Lisans alanını/], ["lisansDurumu", "belki", /durumunu seç/], ["lisansMezuniyetYili", "20x5", /4 haneli/], ["lisansMezuniyetYili", String(Y + 1), /arasında/], ["gpa4", "4.5", /4'lük/], ["gpa4", "3.456", /4'lük/], ["hedefBaslangicYili", String(Y + 4), /arasından/]]) {
    r = await AUTH.saveProfile("y2", Object.assign({}, UNI, { [alan]: deger }));
    ok(!r.ok && desen.test(r.errors[alan] || ""), "uni-mezun reddedilir: " + alan + "=" + JSON.stringify(deger), r.errors);
  }
  r = await AUTH.saveProfile("y3", Object.assign({}, UNI, { lisansDurumu: "son-sinif", lisansMezuniyetYili: String(Y) }));
  ok(r.ok, "son sınıf: beklenen mezuniyet bu yıl kabul");
  r = await AUTH.saveProfile("y3", Object.assign({}, UNI, { lisansDurumu: "son-sinif", lisansMezuniyetYili: String(Y - 2) }));
  ok(!r.ok && /Beklenen/.test(r.errors.lisansMezuniyetYili), "son sınıf: geçmiş yıl reddedildi");
  r = await AUTH.saveProfile("y4", Object.assign({}, UNI, { hedefBaslangicYili: "" }));
  ok(r.ok && oku("y4").hedefBaslangicYili === String(AUTH.varsayilanHedefYili()), "uni-mezun: boş hedef yıl → bir sonraki akademik yıl");

  // 5) Model değişimi: modele ait alanlar temizlenir, bilinmeyen alanlar korunur
  depo[PK("m1")] = JSON.stringify(Object.assign({}, oku("y1"), { ozelAlan: "korunmali" }));
  r = await AUTH.saveProfile("m1", { ogrenciModeli: "lise", okul: "Test Lisesi", sinif: "12", ulkeler: ["se"] });
  const m1 = oku("m1");
  ok(r.ok && AUTH.UNI_FIELDS.every(k => !(k in m1)) && !("hedefBaslangicYili" in m1) && m1.ozelAlan === "korunmali" && m1.sinif === "12", "uni-mezun → lise: üniversite alanları ve hedef yıl silindi, bilinmeyen alan korundu", m1);
  r = await AUTH.saveProfile("m1", { ogrenciModeli: "lise-mezun", okul: "Test Lisesi", ulkeler: ["se"], yerlesmeDurumu: "uygun", hedefBaslangicYili: String(Y + 2) });
  ok(r.ok && oku("m1").sinif === "mezun" && oku("m1").yerlesmeDurumu === "uygun", "lise → lise mezunu: sinif türetildi, yerleşme kaydedildi");
  r = await AUTH.saveProfile("m1", Object.assign({}, UNI));
  ok(r.ok && !("yerlesmeDurumu" in oku("m1")) && oku("m1").lisansAlani === "Makine Mühendisliği", "lise mezunu → üniversite mezunu: yerleşme silindi");
  ok(r.ok && oku("m1").okul === "Test Lisesi", "üniversite mezununda eski okul adı silinmez (gönderilmedi)");

  delete global.window;
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
