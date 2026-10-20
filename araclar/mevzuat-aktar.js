#!/usr/bin/env node
/**
 * Meberra — Mevzuat aktarımı (PM aracı, Tur 11, 15 Ekim 2026)
 *
 * Ajan 13'ün PM doğrulamasından geçen bulgularını (.agents/mevzuat/dogrulama/) üreticinin girdi klasörüne
 * (data/mevzuat/kaynak/) aktarır. Sonra `node araclar/ulke-veri-olustur.js` sayfaların okuduğu dosyaları üretir.
 *
 *   Girdi:  .agents/mevzuat/dogrulama/{lisans,yl,uni}-<cc>.json, yl-genel.json
 *           .agents/mevzuat/tasima/lisans-{de,it,hu,pl}.json  (Ajan 11'in eski sartlar.js / mezun-ulkeler.js taşıması)
 *   Çıktı:  data/mevzuat/kaynak/{lisans,yl,uni}-<cc>.json, yl-genel.json
 *           .agents/mevzuat/teyit-taslaklari-tur11.json (ajanların yazdığı teyit e-postası taslakları, tek listede)
 *
 * Kurallar (PM kararları, proje.md §27):
 *  - Eski maddeler (taşıma tabanı) Ajan 13'ün mevcutSiniflandirma'sına göre etiketlenir: yol "en" → madde.dil = "en".
 *  - Ajan 13'ün yeni maddeleri ilgili bloğa eklenir. Sınıf notlarında id'si "-yerel" içeren madde dil="yerel",
 *    "-en-" içeren madde dil="en" alır; diğerleri iki yola da aittir.
 *  - Üniversite dil hücresi kaynağı metin ise içindeki https adresleri ayrıştırılır (uni-fr).
 *  - PM düzeltmeleri DUZELTMELER tablosunda; her biri kaynaklıdır.
 *  - Bu araç idempotenttir: her çalıştırmada aynı çıktıyı üretir. Kaynak dosyalar elle düzenlenmez.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const DOG = path.join(ROOT, ".agents", "mevzuat", "dogrulama");
const TAS = path.join(ROOT, ".agents", "mevzuat", "tasima");
const OUT = path.join(ROOT, "data", "mevzuat", "kaynak");
const ULKELER = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];
const BUGUN = "2026-10-15";

const oku = f => JSON.parse(fs.readFileSync(f, "utf8"));
const yaz = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + "\n");
const arr = x => (Array.isArray(x) ? x : []);
const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
const sorunlar = [];
const taslaklar = [];
let kaynaksizHucre = 0;

// PM düzeltmeleri (Ajan 13 karar notları; dosya sahibi PM)
const DUZELTMELER = {
  // karar-notu-2026-10-15-lisans-de-it-dil.md §3/1 — "İngilizce B2" yalnızca İngilizce programlar için doğru (MUR genelgesi §6)
  "it-sartlar": m => Object.assign(m, {
    metin: "En az 12 yıllık lise diploması, YKS'ye girip geçtiğini gösteren sonuç belgesi, üniversitenin giriş testi (CEnT-S, TIL-I, TOL, TOLC ya da SAT; programa göre) ve programın öğretim dilinde en az B2: İngilizce programda İngilizce, İtalyanca programda İtalyanca (CLIQ belgesi ya da üniversite sınavı). Dil düzeyi vizeden önce Universitaly'ye işlenir. Vize gereken aday Universitaly ön başvurusu yapar ve yalnızca bir program seçebilir.",
    sonKontrol: BUGUN
  }),
  // aynı not §3/2 — CEnT kuralı İngilizce yola ait; TOLC (İtalyanca yol) için ek madde lis-it-tolc-gecerlilik aşağıda eklenir
  "it-test-suresi": m => Object.assign(m, { dil: "en" })
};
const EK_MADDELER = {
  it: [{
    blok: "yerel.gerekenler",
    madde: {
      id: "lis-it-tolc-gecerlilik", dil: "yerel", baslik: "TOLC sonucunun geçerliliği",
      metin: "TOLC sonucu en az girildiği yıl için geçerlidir. Daha uzun süre geçerli sayılıp sayılmadığını her üniversite kendi çağrısında belirler; başvuracağın üniversitenin çağrısından kontrol et.",
      kaynak: [{ ad: "CISIA — TOLC yönetmeliği", url: "https://www.cisiaonline.it/tolc/tutto-sul-TOLC/regolamento-tolc" }],
      kesinlik: "Doğrulandı", sonKontrol: BUGUN
    }
  }]
};
// PM kararı K-D (15 Ekim 2026): sayımın yanıltıcı olabileceği ülke özetleri
const OZET_UYARI = {
  se: { "lisans-en": { metin: "İngilizce lisans az; mühendislikte çok dar (Chalmers'ta yok, KTH'de 1–2 program). İsveç fiilen bir yüksek lisans ülkesi.", kaynak: [{ ad: "universityadmissions.se — program arama", url: "https://www.universityadmissions.se/intl/search" }] } },
  dk: { "lisans-en": { metin: "İngilizce lisans az; Kopenhag Üniversitesi'nin bütün lisans programları Danca, DTU'da 1–2 İngilizce lisans var.", kaynak: [{ ad: "Study in Denmark — program veritabanı", url: "https://studyindenmark.dk/portal" }] } },
  de: { "lisans-en": { metin: "Lisans programlarının yalnızca yüzde 3,7'si İngilizce (HRK 2025/26); ilk 20 üniversitenin 9'unda İngilizce lisans yok. RWTH, TU Berlin ve TU Darmstadt'ta İngilizce lisans bulunmuyor.", kaynak: [{ ad: "DAAD — International Programmes", url: "https://www2.daad.de/deutschland/studienangebote/international-programmes/en/" }] } },
  ch: { "lisans-en": { metin: "ETH Zürich ve EPFL'de İngilizce lisans yok; lisans dili Almanca ya da Fransızca.", kaynak: [{ ad: "ETH Zürich — lisans programları", url: "https://ethz.ch/en/studies/bachelor.html" }] } },
  fr: { "lisans-en": { metin: "İngilizce programların çoğu L2 ya da L3'ten giriş alıyor; liseden doğrudan İngilizce lisans seçeneği çok az (ör. École polytechnique Bachelor, DAP dışında ve ücretli).", kaynak: [{ ad: "Campus France — Taught in English kataloğu", url: "https://taughtie.campusfrance.org/tiesearch/" }] } }
};

function maddeleriGez(o, fn) {
  (function w(x) {
    if (Array.isArray(x)) x.forEach(w);
    else if (isObj(x)) { if (typeof x.id === "string" && typeof x.metin === "string") fn(x); else Object.values(x).forEach(w); }
  })(o);
}
function dilCikar(m) {
  if (m.dil) return m;
  if (/-yerel/.test(m.id)) m.dil = "yerel";
  else if (/-en-|-en$/.test(m.id)) m.dil = "en";
  return m;
}
function taslakTopla(cc, tur, j) {
  arr(j.teyitTaslaklari).forEach(t => taslaklar.push(Object.assign({ ulke: cc, tur }, t)));
  delete j.teyitTaslaklari;
}
const blokEkle = (hedef, kaynak) => ["gerekenler", "tarihler", "hatalar"].forEach(k => { hedef[k] = arr(hedef[k]).concat(arr(kaynak && kaynak[k])); });

function lisans(cc) {
  const yeni = oku(path.join(DOG, `lisans-${cc}.json`));
  taslakTopla(cc, "lisans", yeni);
  const tabanDosya = path.join(TAS, `lisans-${cc}.json`);
  const sinifla = new Map(arr(yeni.mevcutSiniflandirma).map(s => [s.id, s.yol]));
  delete yeni.mevcutSiniflandirma;
  let L;
  if (fs.existsSync(tabanDosya)) {
    L = oku(tabanDosya);
    const gorulen = new Set();
    maddeleriGez(L, m => {
      gorulen.add(m.id);
      const yol = sinifla.get(m.id);
      if (yol === "en" || yol === "yerel") m.dil = yol;
      else if (yol !== "ortak") sorunlar.push(`${cc}: taşınan madde ${m.id} sınıflandırılmamış`);
    });
    sinifla.forEach((_, id) => { if (!gorulen.has(id) && !/^duyuru-/.test(id)) sorunlar.push(`${cc}: sınıflandırmadaki ${id} tabanda yok`); });
    L.ozet = yeni.ozet || L.ozet;
    L.ortak = arr(L.ortak).concat(arr(yeni.ortak));
    L.en = L.en || {}; L.yerel = L.yerel || {};
    blokEkle(L.en, yeni.en); blokEkle(L.yerel, yeni.yerel);
    L.sinifNotlari = isObj(L.sinifNotlari) ? L.sinifNotlari : {};
    Object.entries(yeni.sinifNotlari || {}).forEach(([s, liste]) => {
      const hedef = L.sinifNotlari[s] = isObj(L.sinifNotlari[s]) ? L.sinifNotlari[s] : { gerekenler: [], buYil: [], tarihler: [], hatalar: [] };
      hedef.buYil = arr(hedef.buYil).concat(arr(liste).map(dilCikar));
    });
    L.apEtkisi = arr(L.apEtkisi).concat(arr(yeni.apEtkisi));
    L.burslar = arr(L.burslar).concat(arr(yeni.burslar));
    L.tasima = (L.tasima || "") + ` + Ajan 13 Tur 11 lisans araştırması (${BUGUN}), mevzuat-aktar.js ile birleştirildi.`;
  } else {
    L = yeni;
    Object.values(L.sinifNotlari || {}).forEach(liste => arr(liste).forEach(dilCikar));
  }
  maddeleriGez(L, m => { if (DUZELTMELER[m.id]) DUZELTMELER[m.id](m); });
  arr(EK_MADDELER[cc]).forEach(e => { const [a, b] = e.blok.split("."); L[a][b].push(e.madde); });
  if (OZET_UYARI[cc]) L.ozetUyari = Object.assign({}, L.ozetUyari, OZET_UYARI[cc]);
  return L;
}

function yl(cc) {
  const Y = oku(path.join(DOG, `yl-${cc}.json`));
  taslakTopla(cc, "yl", Y);
  return Y;
}

function uni(cc) {
  const U = oku(path.join(DOG, `uni-${cc}.json`));
  // Şehir alanında posta kodu kalmış kayıtlar (ör. uni-de "69117 Heidelberg") temizlenir
  arr(U.universiteler).forEach(u => { if (typeof u.sehir === "string") u.sehir = u.sehir.replace(/^\s*(D-)?\d{4,5}\s+/, "").trim(); });
  arr(U.universiteler).forEach(u => ["lisans", "yuksekLisans"].forEach(a => {
    if (!isObj(u[a])) return;
    const k = u[a].kaynak;
    if (typeof k === "string") u[a].kaynak = k.match(/https?:\/\/[^\s)]+/g) || [];
    // PM kuralı (AGENTS.md §2.1/3): kaynaksız hücre değer taşıyamaz. Ajan sayfaya erişemediyse hücre "Doğrulanamadı" olur;
    // kaynak olarak üniversitenin resmi sitesi verilir (öğrenci oradan kontrol eder). Üniversite listeden düşmez (karar K-B).
    if (!arr(u[a].kaynak).length) {
      if (!/^https?:\/\//.test(u.url || "")) { sorunlar.push(`${cc}: ${u.ad} ${a} kaynaksız ve resmi site yok`); return; }
      ["en", "yerel"].forEach(d => { if (u[a][d] != null) u[a][d] = "Doğrulanamadı"; });
      u[a].not = "Program dili resmi katalogdan okunamadı; üniversitenin sitesinden kontrol et." + (u[a].not && !/Kontrol edilmedi/.test(u[a].not) ? " " + u[a].not : "");
      u[a].kaynak = [u.url];
      kaynaksizHucre++;
    }
  }));
  return U;
}

fs.mkdirSync(OUT, { recursive: true });
const sayac = { lisans: 0, yl: 0, uni: 0 };
const yazilacak = [];
for (const cc of ULKELER) {
  const L = lisans(cc), Y = yl(cc), U = uni(cc);
  maddeleriGez(L, () => sayac.lisans++); maddeleriGez(Y, () => sayac.yl++); sayac.uni += arr(U.universiteler).length;
  yazilacak.push([`lisans-${cc}.json`, L], [`yl-${cc}.json`, Y], [`uni-${cc}.json`, U]);
}
const G = oku(path.join(DOG, "yl-genel.json"));
taslakTopla("genel", "yl", G);
yazilacak.push(["yl-genel.json", G]);

if (sorunlar.length) { console.error("AKTARIM SORUNLARI:\n  - " + sorunlar.join("\n  - ") + "\nHiçbir dosya yazılmadı."); process.exit(1); }
yazilacak.forEach(([f, o]) => yaz(path.join(OUT, f), o));
yaz(path.join(ROOT, ".agents", "mevzuat", "teyit-taslaklari-tur11.json"), { olusturma: BUGUN, sayi: taslaklar.length, taslaklar });
console.log(`✓ Aktarıldı: ${ULKELER.length} ülke · lisans ${sayac.lisans} madde · YL ${sayac.yl} madde · ilk 20 ${sayac.uni} üniversite · ${yazilacak.length} dosya`);
console.log(`  Kaynaksız üniversite hücresi → "Doğrulanamadı": ${kaynaksizHucre}`);
console.log(`  Teyit taslakları: ${taslaklar.length} (.agents/mevzuat/teyit-taslaklari-tur11.json)`);
