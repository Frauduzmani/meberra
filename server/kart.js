"use strict";
// 1.18.0 Kavram kartları (aralıklı tekrar). Bkz. server/API.md "Kavram kartları".
// - Kartlar: server/tohum/kartlar.json (salt okunur içerik; araclar/kart-uret.js doğrular). Veritabanına kopyalanmaz;
//   yalnızca öğrencinin tekrar durumu kart_durumu tablosunda tutulur (migrations/014_kartlar.sql).
// - Zamanlama (SM-2-lite, saf: planla): tekrar → 1 gün; zor → aralık × 1,2 (yuvarlanır, en az 1);
//   biliyorum → ADIMLAR'da (1, 3, 7, 14, 30) mevcut aralıktan büyük ilk adım (30'da kalır).
// - Ücretsiz plan: her dersin ilk 2 destesi (ünite) açık — assets/js/ucretsiz-kural.js apUcretsizUniteNolari varsayılan
//   kuralı (aynı numaralı devam üniteleri tek sayılır). Premium ve yönetici hepsine erişir. Kilitli deste → 402 premiumGerekli.
// - "Bugün": vadesi gelmiş kartlar (en eski önce) + kalan yere yeni kartlar (günde en çok YENI_GUNLUK), toplam en çok 30;
//   yalnızca seçili dersler (profil apDersleri; seçim yoksa tümü) ve erişilebilir desteler.
// - XP / günlük hedef: kart tekrarları XP'ye SAYILMAZ (XP istemci oyun.js + sunucu lig.js'te cevap tablosundan hesaplanır;
//   ayrı bir hatta bağlamak bu sürümün kapsamı dışında). Yanıtlar bugün yapılan kart tekrarı sayısını (bugunTekrar) döner.
const fs = require("fs");
const path = require("path");
const { simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const zaman = require("./zaman");
const KURAL = require("../assets/js/ucretsiz-kural.js");
const AP = require("../assets/js/ap-hedef.js");

const TOHUM = path.join(__dirname, "tohum", "kartlar.json");
const ADIMLAR = [1, 3, 7, 14, 30];
const ZOR_CARPAN = 1.2;
const SONUCLAR = ["biliyorum", "zor", "tekrar"];
const BUGUN_EN_COK = 30;
const YENI_GUNLUK = 10;
const UCRETSIZ_DESTE = 2;
const OGRENILDI_GUN = 7; // aralığı ≥ 7 gün olan kart "öğrenildi" sayılır (deste ilerleme çubuğu)
/** Profil ders anahtarı (ap-hedef.js) → kart dersi */
const PROFIL_DERS = {
  "calculus-ab": "calculus", "calculus-bc": "calculus", "physics-1": "physics", "chemistry": "chemistry", "biology": "biology",
  "english-language": "english", "computer-science-a": "csa", "microeconomics": "micro", "macroeconomics": "macro",
  "precalculus": "precalculus", "statistics": "statistics", "physics-2": "physics2" // 1.28.0
};

/**
 * Saf zamanlama. onceki: { aralik } | null; sonuc: biliyorum | zor | tekrar; bugun: "YYYY-MM-DD".
 * Dönüş: { aralik, sonraki }
 */
function planla(onceki, sonuc, bugun) {
  const a = onceki && onceki.aralik > 0 ? Number(onceki.aralik) : 0;
  let yeni;
  if (sonuc === "tekrar") yeni = ADIMLAR[0];
  else if (sonuc === "zor") yeni = Math.max(ADIMLAR[0], Math.round(a * ZOR_CARPAN));
  else if (sonuc === "biliyorum") { yeni = ADIMLAR.find(x => x > a); if (yeni === undefined) yeni = ADIMLAR[ADIMLAR.length - 1]; }
  else throw new Error("Geçersiz sonuç: " + sonuc);
  return { aralik: yeni, sonraki: zaman.gunEkle(bugun, yeni) };
}

/** Tohumu okur ve dizinler. { surum, dersler: [{ ders, ad, sayfa, uniteler: [{ unite, ad }] }], kartlar, kartBul, ucretsiz: { ders: Set } } */
function yukle(dosya) {
  const t = JSON.parse(fs.readFileSync(dosya || TOHUM, "utf8"));
  const kartlar = Array.isArray(t.kartlar) ? t.kartlar : [];
  const kartBul = new Map(kartlar.map(k => [k.id, k]));
  const ucretsiz = {};
  (t.dersler || []).forEach(d => {
    // 1.25.0: "kalip: true" (Soru kalıpları) destesi her zaman ücretsizdir ve ücretsiz deste sayısına girmez
    const list = (d.uniteler || []).filter(u => !u.kalip).map(u => { const m = /(\d+)/.exec(String(u.unite)); return { no: u.unite, num: m ? +m[1] : null }; });
    // "kartlar" sayfası AP_UCRETSIZ_KURALI'nda yok → varsayılan kural: ilk N farklı ünite numarası
    ucretsiz[d.ders] = new Set(KURAL.apUcretsizUniteNolari("kartlar", list, UCRETSIZ_DESTE).concat((d.uniteler || []).filter(u => u.kalip).map(u => u.unite)));
  });
  return { surum: t.surum || 1, dersler: t.dersler || [], kartlar, kartBul, ucretsiz };
}

/** Deste ücretsiz planda açık mı? (saf) */
function desteUcretsizMi(veri, ders, unite) { const s = veri.ucretsiz[ders]; return !!(s && s.has(String(unite))); }

function kartRotalari(r, c) {
  const { db, hesap, oturumGerekli } = c;
  const saat = c.saat || Date.now;
  const veri = yukle(c.tohumDosyasi);
  const sinir = hizSinirlayici(c.degerlendirSiniri || 900, 60 * 60e3);
  const q = {
    tum: db.prepare("SELECT kart_id, aralik, sonraki, tekrar_sayisi, son_sonuc, son_gun FROM kart_durumu WHERE user_id = ?"),
    tek: db.prepare("SELECT kart_id, aralik, sonraki, tekrar_sayisi, son_sonuc, son_gun FROM kart_durumu WHERE user_id = ? AND kart_id = ?"),
    yaz: db.prepare(`INSERT INTO kart_durumu (user_id, kart_id, aralik, sonraki, tekrar_sayisi, son_sonuc, son_gun, guncelleme)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?) ON CONFLICT(user_id, kart_id) DO UPDATE SET aralik = excluded.aralik, sonraki = excluded.sonraki,
      tekrar_sayisi = kart_durumu.tekrar_sayisi + 1, son_sonuc = excluded.son_sonuc, son_gun = excluded.son_gun, guncelleme = excluded.guncelleme`),
    bugunSay: db.prepare("SELECT COUNT(*) AS n FROM kart_durumu WHERE user_id = ? AND son_gun = ?")
  };
  const ozel = res => res.setHeader("Cache-Control", "private, no-store");
  const premiumMu = req => req.kullanici.rol === "yonetici" || !!hesap.uyelik(req.kullanici.id).premium;
  const premiumHata = () => new HttpHata(402, "Ücretsiz planda her dersin ilk 2 destesi açık. Premium ile tüm kartlar açılır.", null, { premiumGerekli: true });
  const bugunGun = () => zaman.gun(saat());
  const durumHaritasi = uid => { const m = new Map(); q.tum.all(uid).forEach(x => m.set(x.kart_id, x)); return m; };
  const durumGenel = x => (x ? { aralik: x.aralik, sonraki: x.sonraki, tekrar: x.tekrar_sayisi, sonSonuc: x.son_sonuc, sonGun: x.son_gun } : null);
  const kartGenel = (k, x) => ({ id: k.id, ders: k.ders, sayfa: k.sayfa, unite: k.unite, on: k.on, arka: k.arka, etiket: k.etiket, kaynakKonu: k.kaynakKonu || null, bc: !!k.bc, durum: durumGenel(x) });
  /** ders / sayfa sorgusunu kart derslerine çevirir ([] = hepsi) */
  function dersFiltre(req, dersMetni) {
    const d = String(dersMetni != null ? dersMetni : req.sorgu.get("ders") || "").trim(), s = String(req.sorgu.get("sayfa") || "").trim().replace(/\.html?$/i, "");
    let l = veri.dersler;
    if (d) l = l.filter(x => d.split(",").map(y => PROFIL_DERS[y.trim()] || y.trim()).indexOf(x.ders) >= 0);
    if (s) l = l.filter(x => x.sayfa === s);
    return l;
  }
  function desteOzet(dersK, u, durum, prem, bugun) {
    const ks = veri.kartlar.filter(k => k.ders === dersK && k.unite === u.unite);
    let gorulen = 0, ogrenilen = 0, vadesi = 0;
    ks.forEach(k => { const x = durum.get(k.id); if (!x) return; gorulen++; if (x.aralik >= OGRENILDI_GUN) ogrenilen++; if (x.sonraki <= bugun) vadesi++; });
    const kilitli = !prem && !desteUcretsizMi(veri, dersK, u.unite);
    return { unite: u.unite, ad: u.ad, kart: ks.length, gorulen, ogrenilen, vadesi, kilitli };
  }
  /** Bugünkü kuyruk: vadesi gelenler (en eski önce) + yeni kartlar (deste sırasıyla) */
  function bugunListe(uid, dersler, prem, bugun, durum) {
    const erisilir = k => prem || desteUcretsizMi(veri, k.ders, k.unite);
    const dset = new Set(dersler.map(d => d.ders));
    const aday = veri.kartlar.filter(k => dset.has(k.ders) && erisilir(k));
    const vadeli = aday.filter(k => { const x = durum.get(k.id); return x && x.sonraki <= bugun; })
      .sort((a, b) => durum.get(a.id).sonraki.localeCompare(durum.get(b.id).sonraki) || durum.get(a.id).aralik - durum.get(b.id).aralik);
    const bugunYeni = aday.filter(k => { const x = durum.get(k.id); return x && x.tekrar_sayisi === 1 && x.son_gun === bugun; }).length;
    const yeniHak = Math.max(0, Math.min(YENI_GUNLUK - bugunYeni, BUGUN_EN_COK - vadeli.length));
    // yeni kartlar: dersler arasında sırayla (her dersten birer), böylece tek ders kuyruğu doldurmaz
    const kuyruklar = dersler.map(d => aday.filter(k => k.ders === d.ders && !durum.has(k.id)));
    const yeni = [];
    for (let i = 0; yeni.length < yeniHak && kuyruklar.some(l => l.length > i); i++) kuyruklar.forEach(l => { if (l[i] && yeni.length < yeniHak) yeni.push(l[i]); });
    return { vadeli: vadeli.slice(0, BUGUN_EN_COK), yeni };
  }
  /** Profilde seçili dersler (seçim yoksa hepsi) */
  function profilDersleri(uid) {
    const secili = AP.secilenler(hesap.profilAl(uid) || {}).map(x => PROFIL_DERS[x.ders]).filter(Boolean);
    return secili.length ? veri.dersler.filter(d => secili.indexOf(d.ders) >= 0) : veri.dersler;
  }
  /** ?dersler=calculus,physics (ya da ?ders=) açıkça verilmişse o dersler, yoksa profil seçimi */
  function seciliDersler(req) {
    const acik = String(req.sorgu.get("dersler") || req.sorgu.get("ders") || "").trim();
    return acik ? dersFiltre(req, acik) : profilDersleri(req.kullanici.id);
  }

  r.get("/api/kartlar", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, prem = premiumMu(req), bugun = bugunGun(), durum = durumHaritasi(uid);
    const dersler = dersFiltre(req), unite = req.sorgu.get("unite");
    const bugunTekrar = q.bugunSay.get(uid, bugun).n;
    if (unite != null && unite !== "") {
      const d = dersler.find(x => (x.uniteler || []).some(u => u.unite === unite));
      if (!d) throw new HttpHata(404, "Deste bulunamadı.");
      const u = d.uniteler.find(x => x.unite === unite);
      const ozet = desteOzet(d.ders, u, durum, prem, bugun);
      if (ozet.kilitli) throw premiumHata();
      const kartlar = veri.kartlar.filter(k => k.ders === d.ders && k.unite === unite).map(k => kartGenel(k, durum.get(k.id)));
      return { ok: true, premium: prem, bugun, bugunTekrar, ders: { ders: d.ders, ad: d.ad, sayfa: d.sayfa }, deste: ozet, kartlar };
    }
    const secili = new Set(profilDersleri(uid).map(d => d.ders));
    const b = bugunListe(uid, veri.dersler.filter(d => secili.has(d.ders)), prem, bugun, durum);
    return { ok: true, premium: prem, bugun, bugunTekrar, surum: veri.surum, ucretsizDeste: UCRETSIZ_DESTE,
      bugunSayi: { vadesi: b.vadeli.length, yeni: b.yeni.length, toplam: b.vadeli.length + b.yeni.length },
      dersler: dersler.map(d => ({ ders: d.ders, ad: d.ad, sayfa: d.sayfa, secili: secili.has(d.ders),
        desteler: (d.uniteler || []).map(u => desteOzet(d.ders, u, durum, prem, bugun)) })) };
  });

  r.get("/api/kartlar/bugun", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id, prem = premiumMu(req), bugun = bugunGun(), durum = durumHaritasi(uid);
    const dersler = seciliDersler(req);
    const b = bugunListe(uid, dersler, prem, bugun, durum);
    const kartlar = b.vadeli.concat(b.yeni).slice(0, BUGUN_EN_COK).map(k => kartGenel(k, durum.get(k.id)));
    return { ok: true, premium: prem, bugun, bugunTekrar: q.bugunSay.get(uid, bugun).n, dersler: dersler.map(d => d.ders),
      vadesi: b.vadeli.length, yeni: b.yeni.length, kartlar };
  });

  r.post("/api/kartlar/:id/degerlendir", (req, res) => {
    oturumGerekli(req); ozel(res);
    const uid = req.kullanici.id;
    if (!sinir.dene("k:" + uid)) throw new HttpHata(429, "Çok fazla değerlendirme. Biraz sonra tekrar dene.");
    const k = veri.kartBul.get(String(req.params.id || ""));
    if (!k) throw new HttpHata(404, "Kart bulunamadı.");
    const sonuc = req.body && req.body.sonuc;
    if (SONUCLAR.indexOf(sonuc) < 0) throw new HttpHata(400, "sonuc: biliyorum, zor ya da tekrar olmalı.");
    if (!premiumMu(req) && !desteUcretsizMi(veri, k.ders, k.unite)) throw premiumHata();
    const bugun = bugunGun();
    const p = planla(q.tek.get(uid, k.id), sonuc, bugun);
    q.yaz.run(uid, k.id, p.aralik, p.sonraki, sonuc, bugun, simdi());
    return { ok: true, kart: k.id, durum: durumGenel(q.tek.get(uid, k.id)), bugunTekrar: q.bugunSay.get(uid, bugun).n };
  });

  return { sinir, veri };
}

module.exports = { kartRotalari, planla, yukle, desteUcretsizMi, ADIMLAR, ZOR_CARPAN, BUGUN_EN_COK, YENI_GUNLUK, UCRETSIZ_DESTE, PROFIL_DERS, TOHUM };
