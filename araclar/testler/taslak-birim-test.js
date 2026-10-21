// Tur 12 — hazır teyit taslakları birim testi (tarayıcı gerekmez). Çalıştır: node araclar/testler/taslak-birim-test.js
// Kapsam: üretici çıktısı güncel (data/kocluk/teyit-taslaklari.js = üreticinin yazacağı metin), 72 taslak, şema, tekil id,
// kişisel veri yok, e-posta yalnız kaynaklı (Y3), model/ülke süzgeci (Y5), yer tutucu sayımı, şablon ülke süzgeci (15 ülke).
"use strict";
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const ROOT = path.join(__dirname, "..", "..");
const E = require(path.join(ROOT, "assets", "js", "eposta.js"));
const U = require(path.join(ROOT, "araclar", "teyit-taslak-olustur.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { if (!c) console.log("FAIL " + m + (x === undefined ? "" : " -> " + JSON.stringify(x).slice(0, 400))); c ? pass++ : fail++; };
const yukle = rel => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx); return ctx.window; };

const HAM = JSON.parse(fs.readFileSync(path.join(ROOT, ".agents", "mevzuat", "teyit-taslaklari-tur11.json"), "utf8"));
const DOSYA = path.join(ROOT, "data", "kocluk", "teyit-taslaklari.js");
ok(fs.existsSync(DOSYA), "data/kocluk/teyit-taslaklari.js var");
const TT = yukle("data/kocluk/teyit-taslaklari.js").APMEBERRA_TEYIT_TASLAKLARI;
const L = TT.taslaklar;

// 1) Üretici: 0 sorun ve çıktı güncel
const r = U.uret();
ok(r.sorunlar.length === 0, "üretici 0 sorun", r.sorunlar);
ok(fs.readFileSync(DOSYA, "utf8") === U.yazilacak(r), "çıktı güncel (üretici yeniden çalıştırılınca aynı dosya)");
ok(L.length === 72 && TT.sayi === 72 && HAM.taslaklar.length === 72, "72 taslak (girdi = çıktı = sayi)");

// 2) Şema ve kimlik
ok(L.every(t => E.taslakDogrula(t).length === 0), "her taslak şemadan geçer", L.map(t => E.taslakDogrula(t)).filter(x => x.length));
ok(new Set(L.map(t => t.id)).size === 72 && L.every(t => /^tt-(de|it|at|ch|nl|be|fr|es|se|fi|dk|ie|hu|pl|cz|genel)-(l|yl)-\d+$/.test(t.id)), "id tekil ve biçimi tt-<ulke>-<l|yl>-<n>");
ok(L.every((t, i) => t.konu === HAM.taslaklar[i].konu.trim() && t.metin === HAM.taslaklar[i].metin && t.ulke === HAM.taslaklar[i].ulke), "konu, metin ve ülke girdiyle birebir (içerik değişmedi)");
ok(L.every(t => JSON.stringify(t.modeller) === (t.duzey === "yl" ? '["uni-mezun"]' : '["lise","lise-mezun"]')), "düzey -> model eşlemesi (Y5)");
const ULK = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];
ULK.forEach(u => ok(L.some(t => t.ulke === u), "ülkede en az bir taslak: " + u));
ok(L.filter(t => t.ulke === "genel").length === 5 && L.filter(t => t.ulke === "genel").every(t => t.duzey === "yl" && !/^[a-z-]+$/.test(t.kime)), "5 genel taslak; kime kod değil okunur etiket");
const DILLER = {}; L.forEach(t => { DILLER[t.dil] = (DILLER[t.dil] || 0) + 1; });
ok(["en", "de", "it", "fr", "es", "tr"].every(d => DILLER[d] > 0) && Object.keys(DILLER).length === 6, "dil tespiti 6 dil", DILLER);
ok(U.dilBul("Sehr geehrte Damen") === "de" && U.dilBul("Gentile Ufficio,") === "it" && U.dilBul("Madame, Monsieur,") === "fr" && U.dilBul("Estimados señores:") === "es" && U.dilBul("Sayın Yetkili,") === "tr" && U.dilBul("Dear X,") === "en", "dilBul");

// 3) Kişisel veri ve adres kuralı (Y3, Y4)
ok(!L.some(t => /\b(Meberra|Azra)\b/i.test(t.konu + t.metin + t.kime)), "öğrenci adı geçmez");
ok(!L.some(t => /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(t.metin + t.konu)), "metin ve konuda e-posta adresi yok");
ok(!L.some(t => /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(t.kime)), "kime etiketinden adres ayrıldı (Apply@polito portal adıdır, adres değil)");
const kaynakli = L.filter(t => t.eposta);
ok(kaynakli.length >= 1 && kaynakli.every(t => /^https?:\/\//.test(t.epostaKaynak.url)), "eposta yalnız kaynaklıysa ve kaynak URL'siyle (" + kaynakli.length + ")");
const ADR = U.kaynakliAdresler();
ok(kaynakli.every(t => ADR[t.eposta.toLowerCase()] && ADR[t.eposta.toLowerCase()].url === t.epostaKaynak.url), "eposta adresi data/mevzuat/kaynak/*.json içindeki kaynaklı maddeden");
ok(L.filter(t => t.adresAdayi).every(t => !t.eposta && !ADR[t.adresAdayi.toLowerCase()]), "kaynaksız adres yalnız adresAdayi (mailto'ya yazılmaz)");
ok(L.filter(t => t.eposta || t.adresAdayi).length === HAM.taslaklar.filter(t => /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(t.kime)).length, "girdideki her adres ya eposta ya adresAdayi olarak işlendi");
const tcd = L.find(t => t.eposta === "study@tcd.ie");
ok(tcd && tcd.ulke === "ie" && tcd.duzey === "lisans", "study@tcd.ie (lisans-ie.json, TCD kabul rehberi) kaynaklı alıcı");

// 4) Motor: taslakAlicisi, yerTutucuKalan
const a1 = E.taslakAlicisi(tcd);
ok(a1.eposta === "study@tcd.ie" && /^https:/.test(a1.kaynak) && a1.adresAdayi === null, "taslakAlicisi kaynaklı");
// v14.1 (Tur 14 adres aktarımı): gerçek veride kaynaksız adres adayı kalmadı; kural yapay bir adayla sınanır.
ok(L.filter(t => t.adresAdayi).length === 0 && kaynakli.length === 15, "v14.1: kaynaksız adres adayı 0, kaynaklı alıcı 15 (" + kaynakli.length + ")");
const aday = L.find(t => t.adresAdayi) || Object.assign({}, L.find(t => !t.eposta), { eposta: null, epostaKaynak: null, adresAdayi: "ornek@kaynaksiz.example" });
const a2 = E.taslakAlicisi(aday);
ok(a2.eposta === null && a2.adresAdayi === aday.adresAdayi, "taslakAlicisi kaynaksız adres -> eposta null");
ok(E.taslakAlicisi({ eposta: "x@y.de", epostaKaynak: null }).eposta === null, "taslakAlicisi kaynak URL'si yoksa eposta kullanılmaz");
ok(E.mailto(E.taslakAlicisi(aday).eposta, aday.konu, "").url.startsWith("mailto:?"), "kaynaksız adreste mailto alıcısız");
ok(E.mailto(a1.eposta, tcd.konu, "").url.startsWith("mailto:study@tcd.ie?"), "kaynaklı adreste mailto alıcılı");
ok(JSON.stringify(E.yerTutucuKalan("Dear [Name], [year] [Name] [eksik: ogrenci.ad]")) === '["[Name]","[year]"]', "yerTutucuKalan: tekrarsız, [eksik: …] hariç");
ok(L.every(t => JSON.stringify(t.yerTutucular) === JSON.stringify(E.yerTutucuKalan(t.metin))), "üretici yerTutucular = motor yerTutucuKalan");
ok(L.filter(t => t.yerTutucular.length).length >= 70, "taslakların neredeyse hepsinde doldurulacak yer var (" + L.filter(t => t.yerTutucular.length).length + ")");

// 5) Süzgeç (model × ülke)
const S = (m, u) => E.taslaklariSuz(L, { model: m, ulke: u });
ok(S(null, null).length === 72 && S(null, "hepsi").length === 72, "süzgeç yok: 72");
ok(S("uni-mezun", "hepsi").length === 40 && S("lise", "hepsi").length === 32 && S("lise-mezun", "hepsi").length === 32, "model -> düzey: YL 40, lisans 32");
ok(S("uni-mezun", "dk").map(t => t.ulke).sort().join() === "dk,dk,genel,genel,genel,genel,genel", "uni-mezun · dk: 2 Danimarka + 5 genel");
ok(S("lise", "it").length === 4 && S("lise", "it").every(t => t.ulke === "it"), "lise · it: 4 İtalya lisans taslağı (genel YL gelmez)");
ok(S("lise", ["de", "it"]).length === 7, "lise · hedef ülkelerim de+it: 7");
ok(S("uni-mezun", ["de", "it"]).length === 17, "uni-mezun · de+it: 7 + 5 + 5 genel = 17");
ok(S("lise", []).length === 32, "boş ülke dizisi -> tümü");
ok(E.taslaklariSuz([{ id: "x" }, null], {}).length === 0, "geçersiz taslak süzülür");
ok(E.taslakDogrula({ id: "a", kime: "k", konu: "k", metin: "m", ulke: "us", duzey: "phd", eposta: "bozuk" }).length === 4, "taslakDogrula: ülke, düzey, e-posta (geçersiz + kaynaksız)");

// 6) Şablon ülke süzgeci (15 ülke; mevcut 9 şablon)
const SB = yukle("data/kocluk/eposta-sablonlari.js").APMEBERRA_EPOSTA_SABLONLARI;
ok(SB.length === 9, "mevcut 9 şablon korunuyor");
const s1 = E.sablonUlkeSuz(SB, "dk", "11");
ok(s1.liste.length === 0 && s1.ozelSayi === 0, "dk: kişisel şablon yok -> boş durum");
ok(E.sablonUlkeSuz(SB, "it", "11").ozelSayi === 6 && E.sablonUlkeSuz(SB, "it", "12").liste.length === 5, "it: 6 şablon (11), 12. sınıfta erken giriş şablonu gizli");
ok(E.sablonUlkeSuz(SB, ["de", "it"], "11").liste.length === E.sablonlariSuz(SB, ["de", "it"], "11").length, "sablonUlkeSuz dizi = eski sablonlariSuz (geriye uyum)");
ok(E.sablonUlkeSuz(SB, "hepsi").liste.length === 9, "hepsi: 9");

// 7) Sayfa bağlantısı
const H = fs.readFileSync(path.join(ROOT, "yazismalar.html"), "utf8");
ok(H.includes('src="/data/kocluk/teyit-taslaklari.js"') && H.indexOf("teyit-taslaklari.js") < H.indexOf("assets/js/app.js"), "yazismalar.html taslak dosyasını yükler");

console.log(`\ntaslak-birim-test: ${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
