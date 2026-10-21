// Tur 14 A3 (Ajan 11): Bugün ekranı saf fonksiyonları — apSiradakiAdim / apYaklasanTarihler / apKaldiginYer / apTrTarihCoz
// (assets/js/app.js) Node birim testi. Kullanım (proje klasöründen): node araclar/testler/bugun-birim-test.js
// Ek olarak GERÇEK veriyle (data/mevzuat/sinav-takvimi.js, sinavlar.js, ulke-rotalari.js + assets/js/rota.js) uçtan uca kontrol:
// gösterilen her tarih veride vardır (uydurma tarih yok).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const src = fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8");
const bas = src.indexOf("// --- Bugün ekranı (Tur 14 A3"), son = src.indexOf("// --- Bugün ekranı sonu");
if (bas < 0 || son < bas) { console.error("FAIL Bugün ekranı bölümü app.js içinde bulunamadı"); process.exit(1); }
// 1.8.0: temiz adres tablosu (tarayıcıda window.MEBERRA_ADRES) — app.js apAdres() bununla "/ders/calculus" üretir
const ctx = { MEBERRA_ADRES: require(path.join(ROOT, "assets/js/adresler.js")) };
vm.createContext(ctx);
vm.runInContext(src.slice(bas, son) + "\nthis.F = { apSiradakiAdim, apYaklasanTarihler, apKaldiginYer, apTrTarihCoz, apGunNo, apAySonuNo, apCalismaPlani };", ctx);
const { apSiradakiAdim, apYaklasanTarihler, apKaldiginYer, apTrTarihCoz, apGunNo, apAySonuNo, apCalismaPlani } = ctx.F;

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (!c && x !== undefined ? " -> " + JSON.stringify(x) : "")); c ? pass++ : fail++; };
const BUGUN = "2026-10-20";
const adim = (id, yil, ay, o) => Object.assign({ id, baslik: "Adım " + id, tarih: yil ? { yil, ay, etiket: ay + "/" + yil } : null, yapildi: false, zorunlu: true }, o || {});

// ---------------------------------------------------------------- 1) Tarih yardımcıları
ok(apTrTarihCoz("10 Mayıs 2027 Pazartesi, Session 1 (Türkiye saatiyle 10:00). Sipariş son günü 13 Kasım 2026.") === "2027-05-10", "apTrTarihCoz: baştaki tarih okunur, sondaki atlanır");
ok(apTrTarihCoz("26 Kasım 2026, 25 Şubat 2027, 18 Mart 2027.") === "2026-11-26", "apTrTarihCoz: listenin ilk tarihi");
ok(apTrTarihCoz("2026-27 tarihleri: 7 Kasım 2026") === null, "apTrTarihCoz: metin tarihle başlamıyorsa null (SAT)");
ok(apTrTarihCoz("Her an; sonuç yaklaşık 2 gün.") === null && apTrTarihCoz("") === null && apTrTarihCoz(null) === null, "apTrTarihCoz: tarihsiz / boş");
ok(apTrTarihCoz("31 Şubat 2027") === null, "apTrTarihCoz: geçersiz gün reddedilir");
ok(apTrTarihCoz("22–23 Mayıs 2026") === null, "apTrTarihCoz: gün aralığı okunmaz");
ok(apAySonuNo(2026, 10) - apGunNo(BUGUN) === 11 && apAySonuNo(2027, 2) - apGunNo("2027-02-01") === 27, "apAySonuNo: ayın son günü (Ekim 31, Şubat 28)");

// ---------------------------------------------------------------- 2) apSiradakiAdim öncelik sırası
const tam = {
  bugun: BUGUN,
  yarimDeneme: { ad: "AP Calculus AB", cevaplanan: 12, toplam: 30 },
  rotaAdimlari: [adim("ekim", 2026, 10), adim("kasim", 2026, 11)], rotaUlke: "Almanya",
  acikHata: 9, sonHata: "Limits",
  plan: [{ baslik: "Zayıf üniteni güçlendir", aciklama: "x", href: "ap-physics.html#u1", etiket: "Üniteye git" }],
  profilEksik: ["okul"]
};
let r = apSiradakiAdim(tam);
ok(r.tur === "deneme" && r.href === "/deneme" && /12\/30/.test(r.baslik) && r.neden, "1. öncelik: yarım deneme (12/30)", r);
r = apSiradakiAdim(Object.assign({}, tam, { yarimDeneme: null }));
ok(r.tur === "rota" && r.baslik === "Adım ekim" && r.kalanGun === 11 && /Almanya rotası/.test(r.aciklama) && /11 gün/.test(r.aciklama), "2. öncelik: ayı 14 gün içinde biten rota adımı (Ekim → 11 gün)", r);
r = apSiradakiAdim(Object.assign({}, tam, { yarimDeneme: { ad: "X", cevaplanan: 0, toplam: 0 } }));
ok(r.tur === "rota", "toplamı 0 olan deneme yarım sayılmaz", r);
r = apSiradakiAdim(Object.assign({}, tam, { yarimDeneme: null, rotaAdimlari: [adim("ekim", 2026, 10, { yapildi: true }), adim("kasim", 2026, 11)] }));
ok(r.tur === "hata" && r.baslik === "9 yanlış soruyu tekrar çöz" && /Limits/.test(r.aciklama) && r.href === "/deneme?mod=yanlislar", "yapılmış rota adımı atlanır; 3. öncelik: açık hata ≥ 5", r);
r = apSiradakiAdim(Object.assign({}, tam, { yarimDeneme: null, rotaAdimlari: [], acikHata: 4 }));
ok(r.tur === "plan" && r.href === "ap-physics.html#u1" && r.etiket === "Üniteye git", "4 açık hata eşiğin altında; 4. öncelik: plan görevi", r);
r = apSiradakiAdim(Object.assign({}, tam, { yarimDeneme: null, rotaAdimlari: [], acikHata: 0, plan: [] }));
ok(r.tur === "profil" && /okul/.test(r.aciklama) && r.href === "/profil", "5. öncelik: profil eksiği", r);
r = apSiradakiAdim({ bugun: BUGUN, bosHref: "rota.html?ulke=nl" });
ok(r.tur === "bos" && r.href === "rota.html?ulke=nl", "6. boş durum: rota bağlantısı", r);
// Sınır: 14 gün dahil, 15 gün hariç; geçmiş ay hariç
ok(apSiradakiAdim({ bugun: "2026-10-17", rotaAdimlari: [adim("e", 2026, 10)] }).kalanGun === 14, "rota sınırı: 14 gün dahil");
ok(apSiradakiAdim({ bugun: "2026-10-16", rotaAdimlari: [adim("e", 2026, 10)] }).tur === "bos", "rota sınırı: 15 gün hariç");
ok(apSiradakiAdim({ bugun: "2026-11-01", rotaAdimlari: [adim("e", 2026, 10)] }).tur === "bos", "rota: ayı geçmiş adım (gecikmiş) sıradaki adım olmaz");
ok(apSiradakiAdim({ bugun: "2026-10-31", rotaAdimlari: [adim("e", 2026, 10)] }).kalanGun === 0, "rota: ayın son günü 0 gün");
ok(apSiradakiAdim({ bugun: BUGUN, rotaAdimlari: [adim("t", null, null)] }).tur === "bos", "rota: tarihsiz adım atlanır");
r = apSiradakiAdim({ bugun: BUGUN, rotaAdimlari: [adim("secmeli", 2026, 10, { zorunlu: false }), adim("zorunlu", 2026, 10)] });
ok(r.baslik === "Adım zorunlu", "aynı ayda zorunlu adım isteğe bağlıdan önce gelir", r);
r = apSiradakiAdim({ bugun: BUGUN, rotaAdimlari: [adim("b", 2026, 10, { href: "yazismalar.html?sablon=x", etiket: "E-postayı hazırla" })] });
ok(r.href === "yazismalar.html?sablon=x" && r.etiket === "E-postayı hazırla", "rota adımının bağlı hedefi düğmeye taşınır", r);

// ---------------------------------------------------------------- 3) apYaklasanTarihler
const AP = { kayitSon: "2026-11-13", gecKayitBas: "2026-11-14", gecKayitSon: "2027-03-12", sinavBas: "2027-05-03" };
let y = apYaklasanTarihler({ bugun: BUGUN, apTakvim: AP, rotaAdimlari: [adim("de-ap-profil", 2026, 11, { bagli: { sinav: "ap-calculus-bc" } }), adim("hedef", 2026, 10)] });
ok(y.length === 3 && y[0].anahtar === "rota-hedef" && y[0].ayDuzeyi && y[0].tarihMetni === "Ekim 2026" && y[0].gun === null && y[0].kalanGun === 11, "rota adımı ay düzeyinde, gün uydurulmaz (Ekim 2026)", y[0]);
ok(y[1].anahtar === "ap-kayit" && y[1].gun === "2026-11-13" && y[1].tarihMetni === "13 Kasım 2026" && y[1].kalanGun === 24 && y[1].ust === "13" && y[1].alt === "Kas", "AP sipariş son günü 13 Kasım 2026 (24 gün)", y[1]);
ok(!y.some(x => x.anahtar === "rota-de-ap-profil"), "AP kayıt son günüyle aynı aydaki AP'ye bağlı rota adımı yinelenmez");
ok(y[2].anahtar === "ap-donem" && y[2].gun === "2027-05-03", "üçüncü: AP sınav dönemi 3 Mayıs 2027", y[2]);
y = apYaklasanTarihler({ bugun: "2026-11-20", apTakvim: AP });
ok(y[0].anahtar === "ap-gec-kayit" && y[0].gun === "2027-03-12" && !y.some(x => x.anahtar === "ap-kayit" && !x.suresiDoldu), "standart kayıt geçince geç sipariş son günü yaklaşanlarda", y);
// K14-5 (kullanıcı kararı, 20 Ekim 2026): süresi dolan tarih düşmez; "Süresi doldu" + sonraki dönem (yoksa "henüz açıklanmadı"), sona dizilir
const dolan = y.filter(x => x.suresiDoldu);
ok(dolan.length === 1 && dolan[0].anahtar === "ap-kayit" && y[y.length - 1] === dolan[0] && dolan[0].gecenGun === 7 && dolan[0].tarihMetni === "13 Kasım 2026" &&
  dolan[0].sonraki === null && dolan[0].sonrakiMetni === "Sonraki dönem tarihi henüz açıklanmadı" && dolan[0].kalanGun === undefined, "K14-5: geçmiş tarih (13 Kasım, bugün 20 Kasım) → Süresi doldu, 'henüz açıklanmadı', yaklaşanların arkasında", dolan);
y = apYaklasanTarihler({ bugun: "2026-11-20", apTakvim: Object.assign({}, AP, { kayitSonraki: "2027-11-12" }) });
let d1 = y.find(x => x.anahtar === "ap-kayit");
ok(d1 && d1.suresiDoldu && d1.sonraki && d1.sonraki.gun === "2027-11-12" && d1.sonrakiMetni === "Sonraki dönem: 12 Kasım 2027" && !y.some(x => x.gun === "2027-11-12" && !x.suresiDoldu), "K14-5: isteğe bağlı sonrakiTarih okunur (12 Kasım 2027); yaklaşanlara ayrı tarih olarak eklenmez", d1);
y = apYaklasanTarihler({ bugun: "2026-11-20", apTakvim: Object.assign({}, AP, { kayitSonraki: "2026-11-01" }) });
ok(y.find(x => x.anahtar === "ap-kayit").sonrakiMetni === "Sonraki dönem tarihi henüz açıklanmadı", "K14-5: sonrakiTarih de geçmişse kullanılmaz (uydurma/gün ekleme yok)");
y = apYaklasanTarihler({ bugun: "2026-11-20", apTakvim: Object.assign({}, AP, { kayitSonraki: "12 Kasım 2027" }) });
ok(y.find(x => x.anahtar === "ap-kayit").sonrakiMetni === "Sonraki dönem: 12 Kasım 2027", "K14-5: sonrakiTarih Türkçe metin biçiminde de okunur");
ok(apYaklasanTarihler({ bugun: "2026-11-20", apTakvim: AP, nGecmis: 0 }).every(x => !x.suresiDoldu), "nGecmis: 0 → süresi dolanlar listelenmez");
y = apYaklasanTarihler({ bugun: "2027-06-01", apTakvim: AP, n: 1, nGecmis: 2 });
ok(y.length === 2 && y.every(x => x.suresiDoldu) && y[0].anahtar === "ap-donem" && y[1].anahtar === "ap-gec-kayit", "nGecmis sınırı; en yeni dolan önce (yaklaşan yoksa liste yalnız süresi dolanlar)", y.map(x => x.anahtar));
y = apYaklasanTarihler({ bugun: BUGUN, sinavlar: [
  { id: "ap-physics-1", ad: "AP Physics 1", tarih: "5 Mayıs 2027 Çarşamba, Session 2" },
  { id: "sat", ad: "SAT", tarih: "2026-27 tarihleri: 7 Kasım 2026, 5 Aralık 2026" },
  { id: "testas", ad: "TestAS", tarih: "26 Kasım 2026, 25 Şubat 2027, 18 Mart 2027." },
  { id: "eski", ad: "Eski", tarih: "3 Ekim 2026 Cumartesi" }
] });
ok(y.filter(x => !x.suresiDoldu).map(x => x.anahtar).join() === "sinav-testas,sinav-ap-physics-1" && y[1].href === "/sinavlar#ap-physics-1", "kayıtlı sınavlar: tarihle başlayanlar sıralı; SAT (tarihle başlamıyor) yok", y);
ok(y.length === 3 && y[2].anahtar === "sinav-eski" && y[2].suresiDoldu && /henüz açıklanmadı/.test(y[2].sonrakiMetni), "K14-5: geçmiş sınav tarihi (3 Ekim) 'Süresi doldu' olarak sonda", y[2]);
y = apYaklasanTarihler({ bugun: BUGUN, duyurular: [{ id: "bme", baslik: "BME Şubat 2027", bitis: "2026-11-15" }, { id: "eski", baslik: "E", bitis: "2026-10-19" }] });
ok(y[0].tur === "duyuru" && y[0].gun === "2026-11-15" && /^Son gün: BME/.test(y[0].baslik) && y[0].href === "/ulkem#mezun-panel", "duyuru bitişi; bağlantı Hedefim › Şartlar duyuru paneli (A4)", y);
ok(y.length === 2 && y[1].anahtar === "duyuru-eski" && y[1].suresiDoldu, "K14-5: bitişi geçen duyuru sonda 'Süresi doldu'", y[1]);
ok(apYaklasanTarihler({ bugun: BUGUN, duyuruHref: "sartlar.html?model=lise-mezun&ulke=it&dil=en#mezun-panel", duyurular: [{ id: "bme", baslik: "B", bitis: "2026-11-15" }] })[0].href === "sartlar.html?model=lise-mezun&ulke=it&dil=en#mezun-panel", "duyuru bağlantısı çağırandan (kendi seçimiyle şartlar)");
y = apYaklasanTarihler({ bugun: BUGUN, n: 2, apTakvim: AP, rotaAdimlari: [adim("a", 2026, 12), adim("b", 2027, 1), adim("c", 2026, 9)] });
ok(y.length === 2 && y[0].anahtar === "ap-kayit" && y[1].anahtar === "rota-a", "n sınırı ve geçmiş ay (Eylül) atlanır", y);
ok(apYaklasanTarihler({ bugun: BUGUN }).length === 0, "veri yoksa boş liste (uydurma yok)");
y = apYaklasanTarihler({ bugun: "2026-11-13", apTakvim: AP });
ok(y[0].anahtar === "ap-kayit" && y[0].kalanGun === 0, "son gün bugünse listede (0 gün)", y[0]);
y = apYaklasanTarihler({ bugun: BUGUN, rotaAdimlari: [adim("x", 2026, 11)], apTakvim: { kayitSon: "2026-11-30" } });
ok(y[0].anahtar === "ap-kayit" && y[1].anahtar === "rota-x", "aynı gün: gün düzeyindeki tarih ay düzeyindekinden önce", y);

// ---------------------------------------------------------------- 4) apKaldiginYer
const PR = { pages: {
  "ap-calculus": { units: { u1: { title: "Unit 1", total: 20, seen: "2026-10-19T10:00:00Z", answers: { a: { c: 1, t: "2026-10-10T09:00:00Z" }, b: { c: 0, t: "2026-10-10T09:05:00Z" } } } } },
  "ap-physics": { units: { u3: { title: "Unit 3", total: 25, seen: "2026-10-01T10:00:00Z", answers: { a: { c: 1, t: "2026-10-18T12:00:00Z" } } }, u4: { title: "Unit 4", total: 10, seen: "2026-10-19T11:00:00Z", answers: {} } } }
} };
const k = apKaldiginYer(PR, [{ page: "ap-physics", name: "AP Physics 1" }]);
ok(k && k.page === "ap-physics" && k.unitId === "u3" && k.ders === "AP Physics 1" && k.answered === 1 && k.correct === 1 && k.total === 25, "kaldığın yer: en yeni CEVAP damgası (seen değil)", k);
ok(apKaldiginYer({ pages: {} }, []) === null && apKaldiginYer(null) === null, "kaldığın yer: veri yoksa null");


// ---------------------------------------------------------------- 4b) Tur 14 A6: apCalismaPlani (Bugün + Çalış ortak çalışma planı)
{
  const bosOzet = { courses: [{ page: "ap-calculus", name: "AP Calculus AB / BC", units: [] }], openErrors: [], answered: 0 };
  let pl = apCalismaPlani({ summary: bosOzet, kayitSon: "2026-11-13", seviye: null, bugun: BUGUN });
  ok(pl.length === 3 && pl[0].title === "Seviye testini çöz" && pl[0].desc.includes("(13 Kasım) 24 gün kaldı") && pl[0].href === "/seviye-testi" && pl[1].title === "İlk soru bankanı çöz" && pl[2].ikon === "book", "çalışma planı (boş): ≤ 60 gün → seviye testi başta (24 gün), ilk soru bankası, son tarihler", pl);
  pl = apCalismaPlani({ summary: bosOzet, mezun: true, kayitSon: "2026-11-13", bugun: BUGUN });
  ok(!pl.some(x => /seviye/.test(x.href)), "çalışma planı: mezunda AP kayıt / seviye hatırlatması yok (K5-b)", pl);
  pl = apCalismaPlani({ summary: bosOzet, kayitSon: "2026-11-13", seviye: { raporlar: [{ id: "r" }] }, bugun: BUGUN });
  ok(!pl.some(x => /seviye/.test(x.href)), "çalışma planı: rapor var ve > 21 gün → seviye görevi yok", pl);
  pl = apCalismaPlani({ summary: bosOzet, kayitSon: "2026-11-13", seviye: { raporlar: [{ id: "r" }] }, bugun: "2026-11-01" });
  ok(pl[0].href === "/seviye-testi#rapor" && /12 gün/.test(pl[0].desc), "çalışma planı: rapor var ve ≤ 21 gün → kayıt kararı (12 gün)", pl[0]);
  pl = apCalismaPlani({ summary: bosOzet, kayitSon: "2026-11-13", seviye: { devam: { sira: [1] } }, bugun: "2026-08-01" });
  ok(pl[0].title === "Yarım kalan seviye testini bitir" && pl[1].title === "İlk soru bankanı çöz", "çalışma planı: rapor yoksa (> 60 gün de) yarım seviye testi başta", pl);
  pl = apCalismaPlani({ summary: bosOzet, kayitSon: "2026-10-01", bugun: BUGUN });
  ok(pl[0].title === "Seviye testini çöz" && !/kayıt/.test(pl[0].desc), "çalışma planı: kayıt son günü geçse de rapor yoksa seviye testi başta (kayıt metni yok)", pl);
  pl = apCalismaPlani({ summary: bosOzet, kayitSon: "2026-10-01", seviye: { raporlar: [{ id: "r" }] }, bugun: BUGUN });
  ok(!pl.some(x => /seviye/.test(x.href)), "çalışma planı: rapor var ve kayıt son günü geçti → seviye hatırlatması yok", pl);
  // Yeni AP öğrencisi (lise, rapor yok, takvim yok): ana görev seviye testi, sonra ders; üniversite incelemesi ikincil (sonda)
  pl = apCalismaPlani({ summary: bosOzet, kayitSon: null, seviye: null, bugun: BUGUN });
  ok(pl[0].title === "Seviye testini çöz" && pl[1].title === "İlk soru bankanı çöz", "çalışma planı (yeni öğrenci): seviye testi, ilk soru bankası", pl);
  const yeniPlan = pl.map(t => ({ baslik: t.title, aciklama: t.desc, href: t.href, etiket: t.linkText })).concat([{ baslik: "Üniversiteleri incele", href: "universiteler.html" }]);
  const yeniSa = apSiradakiAdim({ bugun: BUGUN, acikHata: 0, plan: yeniPlan });
  ok(yeniSa.tur === "plan" && yeniSa.baslik === "Seviye testini çöz", "Sıradaki adım (yeni AP öğrencisi): 'Seviye testini çöz', üniversite incelemesi değil", yeniSa);
  const dolu = { answered: 12, openErrors: [{ id: "q9", topic: "Limits", page: "ap-calculus" }, { id: "q8", page: "ap-calculus" }], courses: [
    { page: "ap-calculus", name: "AP Calculus AB / BC", units: [{ id: "u1", title: "Unit 1", total: 10, answered: 10, correct: 9 }, { id: "u2", title: "Unit 2", total: 10, answered: 2, correct: 1 }] },
    { page: "ap-physics", name: "AP Physics 1", units: [{ id: "p1", title: "Unit 1 Kinematics", total: 20, answered: 4, correct: 1 }] }] };
  pl = apCalismaPlani({ summary: dolu, kayitSon: null, seviye: { raporlar: [{ id: "r" }] }, bugun: BUGUN });
  ok(pl.map(x => x.ikon).join() === "redo,target,play,book" && pl[0].title === "Yanlışlarım’daki 2 soruyu tekrar çöz" && pl[0].href === "/deneme?mod=yanlislar" && /Limits/.test(pl[0].desc) &&
    pl[1].title === "Zayıf üniteni güçlendir: Unit 1 Kinematics" && pl[1].href === "/ders/physics#p1" && /%25 doğru/.test(pl[1].desc) &&
    pl[2].title === "Kaldığın yerden devam et: Unit 2" && pl[2].href === "/ders/calculus#u2", "çalışma planı (dolu): hata, en zayıf ünite (%25), ilk eksik ünite, son tarihler", pl);
  const sa = apSiradakiAdim({ bugun: BUGUN, acikHata: 2, plan: pl.map(t => ({ baslik: t.title, aciklama: t.desc, href: t.href, etiket: t.linkText })) });
  ok(sa.tur === "plan" && sa.baslik === pl[0].title, "Sıradaki adım (< 5 hata): çalışma planının ilk görevi", sa);
  // Ücretsiz plan: kilitli üniteler (kutuUcretsiz → false) önerilmez; ücretsizler bitince açılmamış ders, o da yoksa Premium önerisi
  const acikKutu = (p, id) => id === "u1" || id === "p1";
  const ucretsiz = { answered: 30, openErrors: [], courses: [
    { page: "ap-calculus", name: "AP Calculus AB / BC", visited: true, units: [{ id: "u1", title: "Unit 1", total: 10, answered: 10, correct: 10 }, { id: "u3", title: "Unit 3", total: 10, answered: 2, correct: 0 }] },
    { page: "ap-physics", name: "AP Physics 1", visited: true, units: [{ id: "p1", title: "Unit 1 Kinematics", total: 20, answered: 20, correct: 19 }] }] };
  pl = apCalismaPlani({ summary: ucretsiz, kayitSon: null, bugun: BUGUN, premium: false, kutuUcretsiz: acikKutu });
  ok(!pl.some(x => /#u3/.test(x.href)) && pl.some(x => x.href === "/premium" && x.ikon === "play"), "çalışma planı (ücretsiz): kilitli Unit 3 önerilmez, ücretsizler bitti → Premium önerisi", pl);
  ucretsiz.courses.push({ page: "ap-biology", name: "AP Biology", visited: false, units: [] });
  pl = apCalismaPlani({ summary: ucretsiz, kayitSon: null, bugun: BUGUN, premium: false, kutuUcretsiz: acikKutu });
  ok(pl.some(x => x.href === "/ders/biology") && !pl.some(x => x.href === "/premium"), "çalışma planı (ücretsiz): açılmamış ders varsa önce o", pl);
  pl = apCalismaPlani({ summary: ucretsiz, kayitSon: null, bugun: BUGUN, premium: true, kutuUcretsiz: acikKutu });
  ok(pl.some(x => x.href === "/ders/calculus#u3"), "çalışma planı (premium): kilit yok", pl);
}
// ---------------------------------------------------------------- 4c) 1.7.0: AP ders seçimi (assets/js/ap-hedef.js filtre → apCalismaPlani secim)
{
  const APH = require(path.join(ROOT, "assets/js/ap-hedef.js"));
  const ozet = { answered: 20, openErrors: [], courses: [
    { page: "ap-calculus", name: "AP Calculus AB / BC", visited: true, units: [{ id: "calc-unit1-quiz-container", title: "Unit 1", total: 10, answered: 4, correct: 1 }, { id: "calc-unit2-quiz-container", title: "Unit 2", total: 10, answered: 0, correct: 0 }] },
    { page: "ap-electives", name: "AP Seçmeliler", visited: true, units: [{ id: "csa-quiz-container", title: "CS A", total: 10, answered: 10, correct: 10 }, { id: "micro34-quiz-container", title: "Micro 3–4", total: 10, answered: 2, correct: 0 }, { id: "macro14-quiz-container", title: "Macro 1–4", total: 10, answered: 0, correct: 0 }] },
    { page: "ap-biology", name: "AP Biology", visited: false, units: [] }] };
  const secim = APH.filtre({ apDersleri: [{ ders: "macroeconomics", hedef: 5 }, { ders: "biology", hedef: 4 }] });
  ok(secim.var && secim.sayfalar.join() === "ap-electives,ap-biology" && secim.uniteUygun("ap-electives", "macro14-quiz-container") && !secim.uniteUygun("ap-electives", "micro34-quiz-container") &&
    !secim.uniteUygun("ap-calculus", "calc-unit1-quiz-container") && secim.denemeKodlari.join() === "economics,biology", "ap-hedef filtre: Macro seçiliyse Micro kutusu ve Calculus dışarıda", secim);
  let pl = apCalismaPlani({ summary: ozet, kayitSon: null, seviye: { raporlar: [{ id: "r" }] }, bugun: BUGUN, secim });
  ok(!pl.some(x => /\/ders\/calculus|micro34/.test(x.href)) && pl.some(x => x.href === "/ders/secmeli#macro14-quiz-container"), "seçim: zayıf/sıradaki ünite yalnızca seçilen derslerden (Calculus %25 ve Micro %0 önerilmez; sıradaki Macro)", pl);
  pl = apCalismaPlani({ summary: ozet, kayitSon: null, seviye: { raporlar: [{ id: "r" }] }, bugun: BUGUN });
  ok(pl.some(x => /micro34/.test(x.href)), "seçim yoksa davranış eskisi gibi (en zayıf Micro önerilir)", pl);
  const yalnizBio = APH.filtre({ apDersleri: [{ ders: "biology", hedef: 4 }] });
  pl = apCalismaPlani({ summary: ozet, kayitSon: null, seviye: { raporlar: [{ id: "r" }] }, bugun: BUGUN, secim: yalnizBio });
  ok(pl.some(x => x.href === "/ders/biology" && /Seçtiğin derse başla/.test(x.title)), "seçim: hiç açılmamış seçili ders → 'Seçtiğin derse başla'", pl);
  pl = apCalismaPlani({ summary: { courses: [{ page: "ap-calculus", units: [] }, { page: "ap-biology", name: "AP Biology", units: [] }], openErrors: [], answered: 0 }, kayitSon: null, seviye: { raporlar: [{ id: "r" }] }, bugun: BUGUN, secim: yalnizBio });
  ok(pl.some(x => x.title === "İlk soru bankanı çöz" && x.href === "/ders/biology"), "seçim (yeni öğrenci): ilk soru bankası seçilen dersten", pl);
  // Geri sayım ve sınav tarihleri: 2027 takvimden kesin, 2028 yalnızca ay (uydurma tarih yok)
  const tkCtx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data/mevzuat/sinav-takvimi.js"), "utf8"), tkCtx); // require önbelleğine girmesin (5. bölüm aynı dosyayı yükler)
  const TK = tkCtx.window.APMEBERRA_TAKVIM;
  const gs = APH.geriSayim({ sinif: "11", sinavYili: 2027, apDersleri: [{ ders: "chemistry", hedef: 4 }, { ders: "microeconomics", hedef: 3 }] }, TK, new Date("2026-10-20"));
  ok(gs.kesin && gs.gun === "2027-05-04" && /Microeconomics/.test(gs.ders), "geri sayım: seçilen derslerin en erken 2027 sınavı (Micro 4 Mayıs)", gs);
  const gs2 = APH.geriSayim({ sinif: "10", apDersleri: [{ ders: "chemistry", hedef: 4 }] }, TK, new Date("2026-10-20"));
  ok(gs2.yil === 2028 && gs2.gun === null && !gs2.kesin, "geri sayım: 10. sınıf varsayılan 2028 → tarih uydurulmaz", gs2);
  const st = APH.sinavTarihleri({ sinavYili: 2027, apDersleri: [{ ders: "calculus-bc", hedef: 5 }] }, TK);
  ok(st.length === 1 && st[0].gun === TK.sinavlar["calculus-bc"].tarih && st[0].hedef === 5, "sınav tarihleri: takvimdeki tarih ve hedef", st);
  ok(APH.oneAl([{ page: "ap-calculus" }, { page: "ap-biology" }, { page: "ap-electives" }], { apDersleri: [{ ders: "biology" }, { ders: "computer-science-a" }] }).map(x => x.page).join() === "ap-biology,ap-electives,ap-calculus", "oneAl: seçilen dersler önce (seçim sırası)");
  ok(APH.secimEksik({ ogrenciModeli: "lise" }) && !APH.secimEksik({ apHedefSoruldu: "2026-10-20T10:00:00Z" }) && !APH.secimEksik({ apDersleri: [{ ders: "biology", hedef: 4 }] }), "secimEksik: Bugün kartı yalnızca hiç seçim/atlama yoksa");
}
// ---------------------------------------------------------------- 5) Gerçek veriyle uçtan uca (uydurma tarih yok)
global.window = {};
require(path.join(ROOT, "data/mevzuat/sinav-takvimi.js"));
require(path.join(ROOT, "data/mevzuat/sinavlar.js"));
require(path.join(ROOT, "data/mevzuat/ulke-rotalari.js"));
const R = require(path.join(ROOT, "assets/js/rota.js"));
const T = window.APMEBERRA_TAKVIM, S = window.APMEBERRA_SINAVLAR;
const profil = { sinif: "11", ogrenciModeli: "lise", ulkeler: ["de"], egitimDili: "en" };
const c = R.zamanCizelgesi(window.APMEBERRA_ROTALAR.de, profil, BUGUN, {});
const rotaAdimlari = c.adimlar.map(a => ({ id: a.id, baslik: a.baslik, tarih: a.tarih, yapildi: a.yapildi, zorunlu: a.zorunlu, bagli: a.bagli }));
const kayitli = ["ap-calculus-ab", "ap-physics-1", "testas", "ielts-academic"].map(id => S.find(s => s.id === id));
y = apYaklasanTarihler({ bugun: BUGUN, rotaAdimlari, apTakvim: { kayitSon: T.kayit.sonGun, gecKayitBas: T.kayit.gecKayitBas, gecKayitSon: T.kayit.gecKayitSon, sinavBas: T.sinavDonemi.bas }, sinavlar: kayitli, n: 10 });
const veriTarihleri = new Set([T.kayit.sonGun, T.kayit.gecKayitSon, T.sinavDonemi.bas].concat(S.map(s => apTrTarihCoz(s.tarih)).filter(Boolean)));
ok(y.length > 0 && y.filter(x => !x.ayDuzeyi).every(x => veriTarihleri.has(x.gun)), "gerçek veri: gün düzeyindeki her tarih veride var (" + y.filter(x => !x.ayDuzeyi).map(x => x.gun).join(", ") + ")");
ok(y.filter(x => x.ayDuzeyi).every(x => c.adimlar.some(a => "rota-" + a.id === x.anahtar && a.tarih && x.tarihMetni === R.AYLAR[a.tarih.ay - 1] + " " + a.tarih.yil)), "gerçek veri: ay düzeyindeki her tarih rota çizelgesinden (" + y.filter(x => x.ayDuzeyi).map(x => x.tarihMetni).join(", ") + ")");
ok(y.some(x => x.gun === "2026-11-13") && !y.some(x => x.anahtar === "rota-de-ap-profil"), "gerçek veri (DE, 11. sınıf): AP sipariş son günü 13 Kasım 2026; Kasım 2026 AP rota adımı yinelenmedi");
const yg = y.filter(x => !x.suresiDoldu), yd = y.filter(x => x.suresiDoldu);
ok(yg.every((x, i) => i === 0 || x.kalanGun >= yg[i - 1].kalanGun) && yg.every(x => x.kalanGun >= 0) && y.slice(yg.length).every(x => x.suresiDoldu), "gerçek veri: yaklaşanlar sıralı, süresi dolanlar (" + yd.length + ") sonda");
ok(yd.every(x => x.gecenGun > 0 && veriTarihleri.has(x.gun) && (x.sonraki === null ? /henüz açıklanmadı/.test(x.sonrakiMetni) : true)), "gerçek veri: süresi dolan her tarih veride var; sonraki dönem verisi yoksa 'henüz açıklanmadı'");
const sa = apSiradakiAdim({ bugun: BUGUN, rotaAdimlari: c.adimlar.map(a => ({ id: a.id, baslik: a.baslik, tarih: a.tarih, yapildi: false, zorunlu: a.zorunlu })), plan: [{ baslik: "P", href: "x.html" }] });
ok(sa.tur === "plan" || (sa.tur === "rota" && sa.kalanGun <= 14), "gerçek veri: rota adımı yalnızca 14 gün içindeyse öne geçer (" + sa.tur + ")", sa);
const mezunC = R.zamanCizelgesi(window.APMEBERRA_ROTALAR.de, { sinif: "mezun", ogrenciModeli: "lise-mezun", ulkeler: ["de"], hedefBaslangicYili: "2027", yerlesmeDurumu: "yok" }, BUGUN, {});
const ms = apSiradakiAdim({ bugun: BUGUN, rotaAdimlari: mezunC.adimlar.map(a => ({ id: a.id, baslik: a.baslik, tarih: a.tarih, yapildi: false, zorunlu: a.zorunlu })) });
ok(ms.tur === "rota" && ms.kalanGun === 11, "gerçek veri (lise mezunu): 'Şimdi · Ekim 2026' adımı sıradaki adım (11 gün)", ms);

console.log("SONUC: " + pass + " gecti, " + fail + " kaldi.");
process.exit(fail ? 1 : 0);
