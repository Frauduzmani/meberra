// Mezun öğrenci birim testi (Ajan 11, Tur 10, kararlar K4-a / K5-a / K5-b / K5-c). Bağımlılık yok.
// Çalıştır (proje klasöründen): node araclar/testler/mezun-birim-test.js
// Kapsam: auth.js profil doğrulaması (sahte localStorage ile), eposta.js takvim yılı, rota.js koşul/kesinlik/
// "Şimdi" kuralı ve gerçek data/mevzuat/ulke-rotalari.js, sartlar-motor.js yıla bağlı kesinlik. Dosya yazmaz.
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const BUGUN = "2026-10-14";

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); if (c) pass++; else fail++; };

function yukle(dosya, ad) { global.window = {}; require(path.join(ROOT, dosya)); const v = global.window[ad]; const w = global.window; delete global.window; return { v, w }; }
const ROTA = yukle("data/mevzuat/ulke-rotalari.js", "APMEBERRA_ROTALAR");
const RT = ROTA.v, UYARILAR = ROTA.w.APMEBERRA_ROTA_UYARILARI;
const R = require(path.join(ROOT, "assets", "js", "rota.js"));
const E = require(path.join(ROOT, "assets", "js", "eposta.js"));
const M = require(path.join(ROOT, "assets", "js", "sartlar-motor.js"));

(async () => {
  // =====================================================================
  // A. auth.js — mezun profil alanları (K5-a)
  // =====================================================================
  const depo = {};
  const ls = { getItem: k => (k in depo ? depo[k] : null), setItem: (k, v) => { depo[k] = String(v); }, removeItem: k => { delete depo[k]; }, key: i => Object.keys(depo)[i] || null, get length() { return Object.keys(depo).length; } };
  global.window = { localStorage: ls, crypto: require("crypto").webcrypto };
  require(path.join(ROOT, "assets", "js", "auth.js"));
  const AUTH = global.window.APMEBERRA_AUTH; // global.window auth bölümünün sonuna kadar kalır (auth.js depoya çağrı anında erişir)
  const now = new Date(), Y = now.getFullYear();
  const vars = (now.getMonth() >= 8 ? Y : Y - 1) + 1;
  const PK = id => "apmeberra-hesap:v1:profil:" + id;
  const oku = id => JSON.parse(depo[PK(id)] || "null");
  const temel = { okul: "Test Lisesi", ulkeler: ["de", "it"] };

  ok(AUTH.varsayilanHedefYili(new Date(2026, 9, 14)) === 2027 && AUTH.varsayilanHedefYili(new Date(2027, 2, 15)) === 2027 && AUTH.varsayilanHedefYili(new Date(2027, 8, 1)) === 2028, "auth varsayilanHedefYili eposta.js ile aynı kural");
  ok(JSON.stringify(AUTH.MEZUN_FIELDS) === '["hedefBaslangicYili","yerlesmeDurumu"]' && AUTH.YERLESME_ETIKET["uygun"] === "Hedef alanla uyumlu bir lisans programına yerleştim" && AUTH.YERLESME_ETIKET["yok"] === "Yerleşmem yok" && AUTH.YERLESME_ETIKET["alan-uyumsuz"] === "Yerleştim ama alan farklı", "auth: alan adları ve onaylı etiketler");

  let r = await AUTH.saveProfile("m1", Object.assign({ sinif: "mezun", mezuniyetYili: String(Y), hedefBaslangicYili: String(Y + 1), yerlesmeDurumu: "uygun" }, temel));
  ok(r.ok && oku("m1").hedefBaslangicYili === String(Y + 1) && oku("m1").yerlesmeDurumu === "uygun" && oku("m1").mezuniyetYili === String(Y), "mezun: iki alan kaydedildi", r);
  r = await AUTH.saveProfile("m2", Object.assign({ sinif: "mezun", hedefBaslangicYili: "", yerlesmeDurumu: "yok" }, temel));
  ok(r.ok && oku("m2").hedefBaslangicYili === String(vars), "mezun: boş hedef yıl -> bir sonraki akademik yıl (" + vars + ")", oku("m2"));
  for (const bad of [String(Y - 1), String(Y + 4), "20a7", "1999"]) {
    r = await AUTH.saveProfile("m3", Object.assign({ sinif: "mezun", hedefBaslangicYili: bad, yerlesmeDurumu: "yok" }, temel));
    ok(!r.ok && /arasından seç/.test(r.errors.hedefBaslangicYili || "") && !oku("m3"), "mezun: geçersiz hedef yıl reddedildi (" + bad + ")", r.errors);
  }
  r = await AUTH.saveProfile("m4", Object.assign({ sinif: "mezun", hedefBaslangicYili: String(Y + 3), yerlesmeDurumu: "" }, temel));
  ok(!r.ok && r.errors.yerlesmeDurumu === "Yerleşme durumunu seç.", "mezun: boş yerleşme durumu reddedildi", r.errors);
  r = await AUTH.saveProfile("m4", Object.assign({ sinif: "mezun", hedefBaslangicYili: String(Y + 3), yerlesmeDurumu: "belki" }, temel));
  ok(!r.ok && /listeden/.test(r.errors.yerlesmeDurumu || ""), "mezun: tanınmayan yerleşme durumu reddedildi", r.errors);
  r = await AUTH.saveProfile("m4", Object.assign({ sinif: "mezun", hedefBaslangicYili: String(Y), yerlesmeDurumu: "alan-uyumsuz" }, temel));
  ok(r.ok && oku("m4").hedefBaslangicYili === String(Y), "mezun: bu yıl (" + Y + ") ve +3 sınırları kabul");
  // Mezun değilse: alanlar sorulmaz ve saklanmaz; sınıf değişince silinir
  r = await AUTH.saveProfile("m1", Object.assign({ sinif: "11" }, temel));
  const p11 = oku("m1");
  ok(r.ok && !("hedefBaslangicYili" in p11) && !("yerlesmeDurumu" in p11) && !("mezuniyetYili" in p11), "mezundan 11'e geçince üç mezun alanı silindi", p11);
  r = await AUTH.saveProfile("s12", Object.assign({ sinif: "12", hedefBaslangicYili: String(Y + 1), yerlesmeDurumu: "uygun" }, temel));
  ok(r.ok && !("hedefBaslangicYili" in oku("s12")) && !("yerlesmeDurumu" in oku("s12")), "12. sınıf: mezun alanları gönderilse de saklanmaz");
  // Eski profil uyumu: alanları olmayan mezun profili
  depo[PK("eski")] = JSON.stringify({ okul: "Eski Lise", sinif: "mezun", ulkeler: ["it"], mezuniyetYili: "2025", tamamlandi: true, ozelAlan: 7 });
  r = await AUTH.updateProfileExtras("eski", { eposta: "a.b@ornek.com" });
  ok(r.ok && !("hedefBaslangicYili" in oku("eski")) && !("yerlesmeDurumu" in oku("eski")) && oku("eski").eposta === "a.b@ornek.com", "eski mezun profili: Yazışmalarım güncellemesi alan eklemeden çalışır");
  r = await AUTH.setAktifRota("eski", "it");
  ok(r.ok, "eski mezun profili: aktif rota değişir");
  r = await AUTH.saveProfile("eski", { okul: "Eski Lise", sinif: "mezun", ulkeler: ["it"] });
  ok(r.ok && oku("eski").ozelAlan === 7 && oku("eski").mezuniyetYili === "2025" && !("yerlesmeDurumu" in oku("eski")), "eski mezun profili: alanlar gönderilmeden kaydedilir, bilinmeyen alan ve mezuniyet yılı korunur", oku("eski"));
  r = await AUTH.saveProfile("eski", { okul: "Eski Lise", sinif: "mezun", ulkeler: ["it"], yerlesmeDurumu: "yok" });
  ok(r.ok && oku("eski").yerlesmeDurumu === "yok" && !("hedefBaslangicYili" in oku("eski")), "eski mezun profili: yalnızca yerleşme eklenebilir (hedef yıl okumada varsayılan)");

  delete global.window;

  // =====================================================================
  // B. eposta.js / rota.js — takvim yılı ve okuma tarafı varsayılanı
  // =====================================================================
  ok(R.takvimYili({ sinif: "mezun", mezuniyetYili: "2026", hedefBaslangicYili: "2027" }, BUGUN) === 2027, "rota takvimYili: 2026 mezunu, hedef 2027 -> 2027");
  ok(R.takvimYili({ sinif: "mezun", mezuniyetYili: "2025" }, BUGUN) === 2027, "rota takvimYili: eski profil (hedef yok) -> 2027");
  ok(R.takvimYili({ sinif: "11" }, BUGUN) === 2028 && R.mezuniyetYili({ sinif: "mezun", mezuniyetYili: "2025" }, BUGUN) === 2025, "takvimYili öğrencide mezuniyet yılı; mezuniyetYili mezunda gerçek yıl");

  // =====================================================================
  // C. Gerçek data/mevzuat/ulke-rotalari.js — mezun zaman çizelgesi
  // =====================================================================
  const YENI = ["de-diploma-notu", "de-mezun-yerlesme-kontrol", "de-mezun-ap-uyari", "de-mezun-aday-vizesi", "it-diploma-notu", "it-mezun-uygunluk", "it-mezun-yks-belgesi", "it-mezun-dsu-ilk-kayit"];
  const tumAdim = RT.de.adimlar.concat(RT.it.adimlar);
  const yeni = YENI.map(id => tumAdim.find(a => a.id === id));
  ok(yeni.every(Boolean), "8 yeni adım veride var");
  ok(RT.de.adimlar.length === 20 && RT.it.adimlar.length === 21, `adım sayısı DE ${RT.de.adimlar.length}, IT ${RT.it.adimlar.length} (beklenen 20 / 21)`);
  const kes = yeni.filter(Boolean).reduce((o, a) => (o[a.kesinlik] = (o[a.kesinlik] || 0) + 1, o), {});
  ok(kes["Doğrulandı"] === 7 && kes["Teyit gerekir"] === 1, "yeni adımlarda kesinlik: Doğrulandı 7, Teyit gerekir 1 (karar notu §1.10)", kes);
  ok(yeni.filter(Boolean).every(a => /^https:\/\//.test(a.kaynak)), "yeni adımların hepsi resmi kaynak URL'si taşır");
  ok(["de", "it"].every(u => R.rotaDogrula(RT[u]).length === 0), "gerçek veri şeması (kosul, kesinlikYila dahil) geçerli", ["de", "it"].map(u => R.rotaDogrula(RT[u])));
  ok(!/Meberra/i.test(JSON.stringify(yeni)), "yeni adım metinlerinde kişi adı yok");
  const YKS = ["de-yks-gec-teslim", "de-yks-basvuru", "de-yks-sinav", "de-yks-tercih", "de-yks-yerlesme"];
  ok(YKS.every(id => RT.de.adimlar.find(a => a.id === id).kosul === "yerlesme-yok"), "§4.1: beş YKS adımında kosul yerlesme-yok");
  ok(JSON.stringify(RT.de.adimlar.find(a => a.id === "de-yks-gec-teslim").siniflar) === '["11","12","mezun"]', "§4.1: de-yks-gec-teslim siniflar 11, 12, mezun");

  const mz = yd => ({ sinif: "mezun", mezuniyetYili: "2026", hedefBaslangicYili: "2027", yerlesmeDurumu: yd, ulkeler: ["de", "it"] });
  const cU = R.zamanCizelgesi(RT.de, mz("uygun"), BUGUN);
  const idsU = cU.adimlar.map(a => a.id);
  ok(cU.mezun && cU.takvimYili === 2027 && cU.hedefYil === 2027 && cU.mezuniyetYili === 2026, "2026 mezunu + hedef 2027: takvim 2027, gerçek mezuniyet 2026");
  ok(cU.adimlar.every(a => a.zamanDurumu !== "gecmis") && cU.sayac.gecikmis === 0, "2026 mezunu + hedef 2027: hiçbir adım Geçmiş değil, gecikmiş 0", cU.adimlar.filter(a => a.zamanDurumu === "gecmis").map(a => a.id));
  ok(cU.adimlar.filter(a => a.zaman && a.zaman.mezuniyetGore === 0).every(a => a.tarih.yil === 2027), "mezuniyetGore 0 adımları 2027 tarihli (ör. de-basvuru-kis " + (cU.adimlar.find(a => a.id === "de-basvuru-kis") || {}).tarih.etiket + ")");
  ok(YKS.every(id => !idsU.includes(id)) && cU.gizlenenKosul === 5, "yerleşmesi uygun mezun: 5 YKS adımı gizli", { gizlenenKosul: cU.gizlenenKosul });
  const hp = cU.adimlar.find(a => a.id === "de-hedef-program");
  ok(hp && hp.tarih.simdi === true && hp.tarih.etiket === "Şimdi · Ekim 2026" && hp.zamanDurumu === "buay", "mezunda okul dönemi adımı (de-hedef-program) Şimdi olarak bu aya alındı", hp && hp.tarih);
  const cA = R.zamanCizelgesi(RT.de, mz("alan-uyumsuz"), BUGUN), cY = R.zamanCizelgesi(RT.de, mz("yok"), BUGUN), cB = R.zamanCizelgesi(RT.de, mz(undefined), BUGUN);
  ok(YKS.every(id => cA.adimlar.some(a => a.id === id)) && cA.adimlar.find(a => a.id === "de-yks-basvuru").tarih.etiket === "Şubat 2027", "alan-uyumsuz mezun: YKS adımları görünür, başvuru Şubat 2027");
  ok(YKS.every(id => cY.adimlar.some(a => a.id === id)), "yerleşmesi yok mezun: YKS adımları görünür");
  ok(YKS.every(id => cB.adimlar.some(a => a.id === id)) && cB.yerlesmeDurumu === null, "yerleşme durumu girilmemiş (eski) mezun: YKS adımları görünür");
  ok(R.zamanCizelgesi(RT.de, { sinif: "12" }, BUGUN).adimlar.some(a => a.id === "de-yks-basvuru"), "mezun olmayan (12): YKS adımları normal");
  // K5-b: AP
  const apAdim = c => c.adimlar.filter(a => /(^|-)ap(-|$)/.test(a.id) && a.id !== "de-mezun-ap-uyari" || (a.bagli && R.apMi(a.bagli.sinav)));
  ok(apAdim(cU).length === 0 && apAdim(R.zamanCizelgesi(RT.it, mz("uygun"), BUGUN)).length === 0, "mezunda AP adımı yok (DE ve IT)", apAdim(cU).map(a => a.id));
  ok(idsU.includes("de-mezun-ap-uyari") && !R.zamanCizelgesi(RT.de, { sinif: "11" }, BUGUN).adimlar.some(a => a.id === "de-mezun-ap-uyari"), "de-mezun-ap-uyari bilgi notu yalnızca mezunda");
  const gM = R.sinavGruplari(RT.de, mz("uygun")), g11 = R.sinavGruplari(RT.de, { sinif: "11" });
  ok(![].concat(...gM.zorunlu, ...gM.secmeli).some(R.apMi) && [].concat(...g11.secmeli).some(R.apMi) && [].concat(...gM.zorunlu).includes("ielts-academic"), "rotanın sınavları: mezunda AP yok, 11'de var, dil sınavı korunur");
  ok(R.sinavRolu(RT.it, "ap-calculus-ab", mz("yok")) === null && R.sinavRolu(RT.it, "ap-calculus-ab", { sinif: "12" }) === "secmeli" && R.sinavRolu(RT.it, "ap-calculus-ab") === "secmeli", "sinavRolu: mezunda AP null, profil verilmezse eski davranış");
  // Sınıf filtreleri
  const c9 = R.zamanCizelgesi(RT.de, { sinif: "9" }, BUGUN), c11 = R.zamanCizelgesi(RT.de, { sinif: "11" }, BUGUN);
  ok(c9.adimlar.some(a => a.id === "de-diploma-notu") && !c9.adimlar.some(a => a.id === "de-yks-gec-teslim") && !c11.adimlar.some(a => a.id === "de-diploma-notu") && c11.adimlar.some(a => a.id === "de-yks-gec-teslim"), "9: diploma notu var, geç teslim yok; 11: tersi");
  ok(!c11.adimlar.some(a => /mezun/.test(a.id)) && c11.gizlenenKosul === 0, "11. sınıf: mezun adımı yok, koşul nedeniyle gizlenen yok");
  // Hedef yılı ileride olan mezun: okul dönemi adımı Şimdi'ye alınmaz
  const c29 = R.zamanCizelgesi(RT.de, { sinif: "mezun", hedefBaslangicYili: "2029", yerlesmeDurumu: "yok" }, BUGUN);
  const hp29 = c29.adimlar.find(a => a.id === "de-hedef-program");
  ok(hp29.tarih.etiket === "Eylül 2028" && !hp29.tarih.simdi && c29.adimlar.find(a => a.id === "de-yks-sinav").tarih.etiket === "Haziran 2029", "hedef 2029 mezunu: de-hedef-program Eylül 2028, YKS Haziran 2029");

  // =====================================================================
  // D. K5-c: yıla bağlı kesinlik
  // =====================================================================
  const vize = RT.it.adimlar.find(a => a.id === "it-vize");
  ok(vize.kesinlik === "Yayımlanmadı" && vize.kesinlikYila && vize.kesinlikYila["2027"] === "Doğrulandı", "it-vize: varsayılan Yayımlanmadı, kesinlikYila 2027 Doğrulandı");
  const kv = p => R.zamanCizelgesi(RT.it, p, BUGUN).adimlar.find(a => a.id === "it-vize");
  ok(kv(mz("uygun")).kesinlik === "Doğrulandı" && kv(mz("uygun")).kesinlikVeri === "Yayımlanmadı", "hedef 2027 mezun: it-vize Doğrulandı");
  ok(kv({ sinif: "12" }).kesinlik === "Doğrulandı", "12. sınıf (2027 mezunu): it-vize Doğrulandı");
  ok(kv({ sinif: "11" }).kesinlik === "Yayımlanmadı" && kv({ sinif: "mezun", hedefBaslangicYili: "2028" }).kesinlik === "Yayımlanmadı", "11. sınıf ve hedef 2028 mezunu: it-vize Yayımlanmadı");
  ok(R.adimKesinlik({ kesinlik: "Teyit gerekir", kesinlikYila: { "2027": "Uydurma" } }, 2027) === "Teyit gerekir" && R.adimKesinlik({ kesinlik: "Doğrulandı" }, 2027) === "Doğrulandı", "adimKesinlik: tanınmayan etiket yok sayılır");
  const bozuk = { ad: "x", temelKural: {}, adimlar: [{ id: "a", baslik: "a", kosul: "uydurma", kesinlikYila: { "27": "Doğrulandı", "2028": "Belki" } }] };
  ok(R.rotaDogrula(bozuk).length === 3, "rotaDogrula: tanınmayan kosul ve bozuk kesinlikYila bildirilir", R.rotaDogrula(bozuk));
  const yhIt = M.yolHaritasi(RT.it, "mezun", BUGUN), yh11 = M.yolHaritasi(RT.it, "11", BUGUN), yh12 = M.yolHaritasi(RT.it, "12", BUGUN);
  const sv = y => y.adimlar.find(a => a.id === "it-vize").kesinlik;
  ok(yhIt.hedefYili === 2027 && sv(yhIt) === "Doğrulandı" && sv(yh12) === "Doğrulandı" && sv(yh11) === "Yayımlanmadı", "sartlar.html yol haritası: it-vize mezun/12 Doğrulandı, 11 Yayımlanmadı");
  ok(yhIt.adimlar.every(a => a.tarih === null), "sartlar.html mezun: takvim tarihi yine göreli (yalnızca kesinlik hedef yıla göre)");
  const yhDe = M.yolHaritasi(RT.de, "mezun", BUGUN), yhDe11 = M.yolHaritasi(RT.de, "11", BUGUN);
  ok(yhDe.adimlar.filter(a => a.kosul).length === 5 && yhDe.adimlar.filter(a => a.kosul).every(a => /yerleşmen yoksa/.test(a.kosulNotu)) && yhDe11.adimlar.every(a => !a.kosulNotu), "sartlar.html mezun: koşullu YKS adımları gizlenmez, koşul notu taşır; 11'de not yok");

  // =====================================================================
  // E. K4-a: iki ülkeli mezun uyarısı
  // =====================================================================
  ok(Array.isArray(UYARILAR) && UYARILAR.length === 1, "APMEBERRA_ROTA_UYARILARI: 1 uyarı");
  const u0 = UYARILAR[0];
  ok(u0.metin === "Almanya için Türkiye'de bir lisans programına kayıt yaptırman gerekmez. Kayıt yaptırmak İtalya'da 1. sınıf DSU bursunu etkileyebilir (PoliMi DSU 2026/27 Md. 4.2; diğer bölgeler için teyit gerekir)." && u0.kaynaklar.every(k => /^https:\/\//.test(k.url)) && u0.kaynaklar.some(k => /DSU_Call/.test(k.url)), "K4-a metni onaylı metinle aynı, kaynaklar resmi");
  ok(R.profilUyarilari(UYARILAR, mz("uygun")).length === 1, "mezun + DE + IT: uyarı var");
  ok(R.profilUyarilari(UYARILAR, Object.assign(mz("uygun"), { ulkeler: ["de"] })).length === 0 && R.profilUyarilari(UYARILAR, Object.assign(mz("uygun"), { ulkeler: ["it"] })).length === 0, "mezun + tek ülke: uyarı yok");
  ok(R.profilUyarilari(UYARILAR, { sinif: "12", ulkeler: ["de", "it"] }).length === 0, "12. sınıf + DE + IT: uyarı yok");

  // E-posta: mezunun başvuru yılı hedef yıla göre
  const dv = E.degiskenler(mz("uygun"), { ad: "A", soyad: "B" }, { bugun: BUGUN, ulke: "it" });
  ok(dv.basvuru.yil === "2027" && dv.basvuru.donem === "academic year 2027/28" && dv.ogrenci.mezuniyetYili === "2026", "e-posta: mezunun başvuru yılı 2027/28, mezuniyet yılı 2026");

  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
