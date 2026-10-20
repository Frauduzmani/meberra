"use strict";
// Öğrenci verisi: tarayıcı deposu anahtarlarının sunucuda birleştirilmesi ve ilişkisel tablolara ayrıştırılması.
// Birleştirme kuralları istemcideki yedek birleştirmesiyle (assets/js/app.js, backup.merge*) aynıdır.
const { islem, simdi } = require("./db");

const ANAHTAR = {
  ilerleme: "apmeberra:quiz:v1",
  hatalar: "apmeberra:errors:v1",
  deneme: "apmeberra:deneme:v1",
  seviye: "apmeberra:seviye:v1"
};
const ANAHTAR_RE = /^apmeberra:[a-z0-9:._-]{1,60}$/i;
const EN_FAZLA_DEGER = 2 * 1024 * 1024; // anahtar başına 2 MB
const EN_FAZLA_ANAHTAR = 60;              // kullanıcı başına (disk doldurmaya karşı)

function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
function ms(iso) { const n = Date.parse(iso); return isNaN(n) ? null : n; }
function maxIso(a, b) { const ma = ms(a), mb = ms(b); if (ma === null) return mb === null ? (a || b) : b; if (mb === null) return a; return mb > ma ? b : a; }
function minIso(a, b) { const ma = ms(a), mb = ms(b); if (ma === null) return mb === null ? (a || b) : b; if (mb === null) return a; return mb < ma ? b : a; }
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function coz(raw) { try { return JSON.parse(raw); } catch (e) { return undefined; } }

// Cevaplar: aynı soru için zaman damgası (t) daha yeni olan kazanır
function ilerlemeBirlestir(cur, inc) {
  const out = isObj(cur) && isObj(cur.pages) ? clone(cur) : { v: 1, pages: {} };
  if (!isObj(inc) || !isObj(inc.pages)) return out;
  Object.keys(inc.pages).forEach(p => {
    const ip = inc.pages[p];
    if (!isObj(ip) || !isObj(ip.units)) return;
    if (!isObj(out.pages[p]) || !isObj(out.pages[p].units)) out.pages[p] = Object.assign({}, isObj(out.pages[p]) ? out.pages[p] : {}, { units: {} });
    Object.keys(ip).forEach(k => { if (k !== "units" && out.pages[p][k] === undefined) out.pages[p][k] = clone(ip[k]); });
    const ou = out.pages[p].units;
    Object.keys(ip.units).forEach(u => {
      const iu = ip.units[u];
      if (!isObj(iu)) return;
      if (!isObj(ou[u])) { ou[u] = clone(iu); if (!isObj(ou[u].answers)) ou[u].answers = {}; return; }
      const cu = ou[u];
      if (!cu.title && iu.title) cu.title = iu.title;
      cu.total = Math.max(Number(cu.total) || 0, Number(iu.total) || 0);
      if (iu.seen) cu.seen = maxIso(cu.seen, iu.seen);
      if (typeof cu.order !== "number" && typeof iu.order === "number") cu.order = iu.order;
      if (!isObj(cu.answers)) cu.answers = {};
      const ia = isObj(iu.answers) ? iu.answers : {};
      Object.keys(ia).forEach(q => {
        const inA = ia[q], cuA = cu.answers[q];
        if (!isObj(inA)) return;
        if (!isObj(cuA)) { cu.answers[q] = clone(inA); return; }
        const ti = ms(inA.t), tc = ms(cuA.t);
        if (ti !== null && (tc === null || ti > tc)) cu.answers[q] = clone(inA);
      });
    });
  });
  // Bilinmeyen üst düzey alanlar korunur
  Object.keys(inc).forEach(k => { if (k !== "pages" && out[k] === undefined) out[k] = clone(inc[k]); });
  return out;
}

function hataBirlestirKayit(a, b) {
  const latestWrong = maxIso(a.date, b.date);
  const bNewer = ms(b.date) !== null && ms(a.date) !== null && ms(b.date) > ms(a.date);
  const base = Object.assign({}, bNewer ? b : a);
  base.date = latestWrong;
  base.firstDate = minIso(a.firstDate || a.date, b.firstDate || b.date);
  base.count = Math.max(Number(a.count) || 1, Number(b.count) || 1);
  let resolvedDate = null;
  [a, b].forEach(r => {
    if (!r.resolved) return;
    const when = r.resolvedDate || r.date || "";
    const mw = ms(when), ml = ms(latestWrong);
    if (mw === null || ml === null || mw >= ml) resolvedDate = resolvedDate ? maxIso(resolvedDate, when) : when;
  });
  if (resolvedDate !== null) { base.resolved = true; if (resolvedDate) base.resolvedDate = resolvedDate; }
  else { base.resolved = false; delete base.resolvedDate; }
  return base;
}
function hatalarBirlestir(cur, inc) {
  const out = isObj(cur) && isObj(cur.items) ? clone(cur) : { v: 1, items: {} };
  if (!isObj(inc) || !isObj(inc.items)) return out;
  Object.keys(inc.items).forEach(k => {
    const ib = inc.items[k];
    if (!isObj(ib)) return;
    const ca = out.items[k];
    out.items[k] = isObj(ca) ? hataBirlestirKayit(ca, ib) : clone(ib);
  });
  return out;
}

/** Bir anahtarın yeni ham değerini mevcutla birleştirir. Dönüş: birleşmiş ham dize. */
function birlestir(anahtar, eskiHam, yeniHam) {
  if (eskiHam == null) return yeniHam;
  if (anahtar === ANAHTAR.ilerleme || anahtar === ANAHTAR.hatalar) {
    const e = coz(eskiHam), y = coz(yeniHam);
    if (y === undefined) return eskiHam;
    if (e === undefined) return yeniHam;
    return JSON.stringify(anahtar === ANAHTAR.ilerleme ? ilerlemeBirlestir(e, y) : hatalarBirlestir(e, y));
  }
  return yeniHam; // son yazan kazanır
}

function veriServisi(db) {
  const st = {
    hepsi: db.prepare("SELECT anahtar, deger, guncelleme FROM user_state WHERE user_id = ?"),
    tek: db.prepare("SELECT deger FROM user_state WHERE user_id = ? AND anahtar = ?"),
    yaz: db.prepare(`INSERT INTO user_state (user_id, anahtar, deger, guncelleme) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme`),
    sil: db.prepare("DELETE FROM user_state WHERE user_id = ? AND anahtar = ?"),
    say: db.prepare("SELECT COUNT(*) AS n FROM user_state WHERE user_id = ?"),
    cevap: db.prepare(`INSERT OR IGNORE INTO answers (user_id, sayfa, unite, unite_baslik, soru, secim, dogru, zaman) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
    hata: db.prepare(`INSERT INTO wrong_answers (user_id, sayfa, soru, unite, konu, hata_etiketi, secilen, dogru_cevap, ilk_yanlis, son_yanlis, yanlis_sayisi, cozuldu)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, sayfa, soru) DO UPDATE SET unite = excluded.unite, konu = excluded.konu, hata_etiketi = excluded.hata_etiketi,
        secilen = excluded.secilen, dogru_cevap = excluded.dogru_cevap, ilk_yanlis = excluded.ilk_yanlis, son_yanlis = excluded.son_yanlis,
        yanlis_sayisi = excluded.yanlis_sayisi, cozuldu = excluded.cozuldu`),
    hataSilHepsi: db.prepare("DELETE FROM wrong_answers WHERE user_id = ?"),
    deneme: db.prepare(`INSERT INTO exams (user_id, istemci_id, kod, ad, tarih, soru_sayisi, dogru, yanlis, bos, yuzde, sure_sn, tahmini_band, veri)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, istemci_id) DO UPDATE SET kod = excluded.kod, ad = excluded.ad, tarih = excluded.tarih, soru_sayisi = excluded.soru_sayisi,
        dogru = excluded.dogru, yanlis = excluded.yanlis, bos = excluded.bos, yuzde = excluded.yuzde, sure_sn = excluded.sure_sn,
        tahmini_band = excluded.tahmini_band, veri = excluded.veri`),
    seviye: db.prepare("INSERT OR IGNORE INTO level_tests (user_id, tarih, veri) VALUES (?, ?, ?)")
  };
  const metin = (v, n) => (v == null ? null : String(v).slice(0, n || 300));
  const sayiYa = v => (v === null || v === undefined || v === "" || isNaN(+v) ? null : +v);

  // Ham değerden ilişkisel tablolara (idempotent: tekrar çalışınca aynı satırlar oluşmaz)
  function ayristir(userId, anahtar, ham) {
    const v = coz(ham);
    if (!isObj(v)) return;
    if (anahtar === ANAHTAR.ilerleme && isObj(v.pages)) {
      Object.keys(v.pages).forEach(p => {
        const units = isObj(v.pages[p]) && isObj(v.pages[p].units) ? v.pages[p].units : {};
        Object.keys(units).forEach(u => {
          const un = units[u] || {}, ans = isObj(un.answers) ? un.answers : {};
          Object.keys(ans).forEach(q => {
            const a = ans[q];
            if (!isObj(a) || ms(a.t) === null) return;
            st.cevap.run(userId, metin(p, 80), metin(u, 120), metin(un.title, 200), metin(q, 120), metin(a.s, 20), a.c ? 1 : 0, new Date(ms(a.t)).toISOString());
          });
        });
      });
    } else if (anahtar === ANAHTAR.hatalar && isObj(v.items)) {
      Object.keys(v.items).forEach(k => {
        const e = v.items[k];
        if (!isObj(e)) return;
        const sayfa = e.page || String(k).split("|")[0], soru = e.id || String(k).split("|")[1];
        if (!sayfa || !soru) return;
        st.hata.run(userId, metin(sayfa, 80), metin(soru, 120), metin(e.unit, 120), metin(e.topic, 300), metin(e.errorTag, 500), metin(e.selected, 20),
          metin(e.correct, 20), metin(e.firstDate || e.date, 40), metin(e.date, 40), Math.max(1, Number(e.count) || 1), e.resolved ? metin(e.resolvedDate || e.date, 40) || simdi() : null);
      });
    } else if (anahtar === ANAHTAR.deneme && Array.isArray(v.gecmis)) {
      v.gecmis.forEach(r => {
        if (!isObj(r) || !r.id) return;
        st.deneme.run(userId, metin(r.id, 80), metin(r.kod, 60), metin(r.ad, 200), metin(r.tarih, 40), sayiYa(r.soruSayisi), sayiYa(r.dogru), sayiYa(r.yanlis),
          sayiYa(r.bos), sayiYa(r.yuzde), sayiYa(r.sureSn), r.tahminiBand == null ? null : metin(typeof r.tahminiBand === "object" ? JSON.stringify(r.tahminiBand) : r.tahminiBand, 200),
          JSON.stringify(r).slice(0, 20000));
      });
    } else if (anahtar === ANAHTAR.seviye && Array.isArray(v.raporlar)) {
      v.raporlar.forEach(r => { if (isObj(r) && r.tarih) st.seviye.run(userId, metin(r.tarih, 40), JSON.stringify(r).slice(0, 50000)); });
    }
  }

  return {
    ANAHTAR,
    hepsi(userId) {
      const o = {};
      st.hepsi.all(userId).forEach(r => { o[r.anahtar] = { deger: r.deger, guncelleme: r.guncelleme }; });
      return o;
    },
    /**
     * degisiklikler: { anahtar: hamDize | null }. Dönüş: { birlesen: {anahtar: ham} (istemcinin gönderdiğinden farklıysa), reddedilen: [anahtar] }
     */
    uygula(userId, degisiklikler) {
      const birlesen = {}, reddedilen = [];
      islem(db, () => {
        Object.keys(degisiklikler || {}).forEach(k => {
          const yeni = degisiklikler[k];
          if (!ANAHTAR_RE.test(k) || (yeni !== null && (typeof yeni !== "string" || yeni.length > EN_FAZLA_DEGER))) { reddedilen.push(k); return; }
          if (yeni === null) {
            st.sil.run(userId, k);
            if (k === ANAHTAR.hatalar) st.hataSilHepsi.run(userId);
            return;
          }
          if (coz(yeni) === undefined) { reddedilen.push(k); return; }
          const eski = st.tek.get(userId, k);
          if (!eski && st.say.get(userId).n >= EN_FAZLA_ANAHTAR) { reddedilen.push(k); return; }
          const son = birlestir(k, eski ? eski.deger : null, yeni);
          st.yaz.run(userId, k, son, simdi());
          if (son !== yeni) birlesen[k] = son;
          ayristir(userId, k, son);
        });
      });
      return { birlesen, reddedilen };
    }
  };
}

module.exports = { veriServisi, ilerlemeBirlestir, hatalarBirlestir, birlestir, ANAHTAR };
