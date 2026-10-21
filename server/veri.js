"use strict";
// Öğrenci verisi: tarayıcı deposu anahtarlarının sunucuda birleştirilmesi ve ilişkisel tablolara ayrıştırılması.
// Birleştirme kuralları istemcideki yedek birleştirmesiyle (assets/js/app.js, backup.merge*) aynıdır; ek olarak
// silinen anahtarlar için silme izi (state_tombstones) tutulur ki eski bir cihaz silinen veriyi geri getirmesin.
const { islem, simdi } = require("./db");

const ANAHTAR = {
  ilerleme: "apmeberra:quiz:v1",
  hatalar: "apmeberra:errors:v1",
  deneme: "apmeberra:deneme:v1",
  seviye: "apmeberra:seviye:v1",
  denemeHak: "apmeberra:deneme-hak:v1",
  seri: "apmeberra:seri:v1",
  tekrar: "apmeberra:tekrar:v1",
  oyun: "apmeberra:oyun:v1"
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

// Kayıt listeleri (deneme geçmişi, seviye raporları): id ile birleşir (id yoksa tarih), aynı kayıtta daha yeni
// "guncelleme" kazanır; tarihe göre yeniden eskiye sıralanıp en yeni `enFazla` tanesi tutulur (istemcideki sınırla aynı).
function damga(x) { return isObj(x) ? (x.guncelleme || x.tarih || x.t || null) : null; }
function yenisi(a, b) { const ma = ms(damga(a)), mb = ms(damga(b)); return mb !== null && (ma === null || mb > ma) ? b : a; }
function listeBirlestir(cur, inc, enFazla) {
  const harita = new Map();
  [cur, inc].forEach(l => (Array.isArray(l) ? l : []).forEach(r => {
    if (!isObj(r)) return;
    const k = r.id ? "id:" + r.id : r.tarih ? "t:" + r.tarih : null;
    if (!k) return;
    harita.set(k, harita.has(k) ? yenisi(harita.get(k), clone(r)) : clone(r));
  }));
  return Array.from(harita.values()).sort((a, b) => (ms(b.tarih) || 0) - (ms(a.tarih) || 0)).slice(0, enFazla);
}

// Deneme (apmeberra:deneme:v1): geçmiş birleşir (başka cihazdaki denemeler kaybolmaz). Yarım deneme (aktif) son yazana
// aittir; ancak geçmişte bitmiş görünen bir deneme yarım olarak geri gelmez.
const EN_FAZLA_DENEME = 50, EN_FAZLA_RAPOR = 5;
function denemeBirlestir(cur, inc) {
  const c = isObj(cur) ? cur : {}, i = isObj(inc) ? inc : {};
  const out = Object.assign(clone(c), clone(i));
  out.v = 1;
  out.gecmis = listeBirlestir(c.gecmis, i.gecmis, EN_FAZLA_DENEME);
  const aktif = "aktif" in i ? i.aktif : c.aktif;
  out.aktif = isObj(aktif) && !out.gecmis.some(r => r.id === aktif.id) ? clone(aktif) : null;
  return out;
}

// Seviye testi (apmeberra:seviye:v1): raporlar birleşir; kontrol listesi işaretinde daha yeni damga kazanır;
// yarım test (devam) son yazana aittir (ikisi de varsa daha yeni "guncelleme").
function seviyeBirlestir(cur, inc) {
  const c = isObj(cur) ? cur : {}, i = isObj(inc) ? inc : {};
  const out = Object.assign(clone(c), clone(i));
  out.v = 1;
  out.raporlar = listeBirlestir(c.raporlar, i.raporlar, EN_FAZLA_RAPOR);
  const devam = "devam" in i ? i.devam : c.devam;
  out.devam = isObj(devam) ? clone(isObj(c.devam) && isObj(i.devam) && c.devam.id === i.devam.id ? yenisi(c.devam, i.devam) : devam) : null;
  out.kontrol = isObj(c.kontrol) ? clone(c.kontrol) : {};
  if (isObj(i.kontrol)) Object.keys(i.kontrol).forEach(k => {
    const b = i.kontrol[k];
    if (isObj(b)) out.kontrol[k] = isObj(out.kontrol[k]) ? yenisi(out.kontrol[k], clone(b)) : clone(b);
  });
  return out;
}

// Ücretsiz deneme hakkı (apmeberra:deneme-hak:v1): { "<sayfa>": { t: ms, kod } }. Birleşim; aynı sayfada en erken t kalır.
// Kayıt hiçbir zaman silinmez (istemci eksik gönderse de) — hak bir kez kullanılınca kullanılmış kalır.
function hakBirlestir(cur, inc) {
  const out = isObj(cur) ? clone(cur) : {};
  if (isObj(inc)) Object.keys(inc).forEach(s => {
    const v = inc[s], o = out[s];
    if (!isObj(v)) return;
    const tv = Number(v.t), to = isObj(o) ? Number(o.t) : NaN;
    if (!isObj(o) || (isFinite(tv) && (!isFinite(to) || tv < to))) out[s] = clone(v);
  });
  return out;
}

// Seri (apmeberra:seri:v1): { donmus: ["YYYY-MM-DD"], hakKullanim: { "YYYY-Www": n } } → donmus birleşim (sıralı, en yeni 400),
// hakKullanim hafta başına en büyük sayı. Bilinmeyen alanlar: gelen kazanır.
const GUN_RE = /^\d{4}-\d{2}-\d{2}$/;
function seriBirlestir(cur, inc) {
  const c = isObj(cur) ? cur : {}, i = isObj(inc) ? inc : {};
  const out = Object.assign(clone(c), clone(i));
  const gunler = new Set();
  [c.donmus, i.donmus].forEach(l => (Array.isArray(l) ? l : []).forEach(d => { if (typeof d === "string" && GUN_RE.test(d)) gunler.add(d); }));
  out.donmus = Array.from(gunler).sort().slice(-400);
  const hak = {};
  [c.hakKullanim, i.hakKullanim].forEach(h => { if (isObj(h)) Object.keys(h).forEach(k => { const n = Number(h[k]); if (isFinite(n)) hak[k] = Math.max(hak[k] == null ? -Infinity : hak[k], n); }); });
  out.hakKullanim = hak;
  return out;
}

// Tekrar kutusu (apmeberra:tekrar:v1): { "<sayfa>|<soruId>": { kutu, sonraki, guncelleme(ms), silindi? } } → anahtar başına
// "guncelleme" değeri büyük olan kayıt kalır (eşitse mevcut). Silme için kayıt { silindi:true, guncelleme } ile işaretlenir.
function tekrarBirlestir(cur, inc) {
  const out = isObj(cur) ? clone(cur) : {};
  if (isObj(inc)) Object.keys(inc).forEach(k => {
    const v = inc[k], o = out[k];
    if (!isObj(v)) return;
    const tv = Number(v.guncelleme), to = isObj(o) ? Number(o.guncelleme) : NaN;
    if (!isObj(o) || (isFinite(tv) && (!isFinite(to) || tv > to))) out[k] = clone(v);
  });
  return out;
}

// Oyunlaştırma (apmeberra:oyun:v1): { xp, rozetler: { id: { t } }, gorevler: { "YYYY-MM-DD": { id: { tamam, t } } }, hedef }
// xp: en büyük; rozetler: birleşim, aynı rozette en erken t; gorevler: birleşim, tamam:true kazanır (ikisi de tamamsa en erken t),
// en yeni 120 gün tutulur; hedef: son yazan (gelen değerde varsa). Bilinmeyen alanlar: gelen kazanır.
function oyunBirlestir(cur, inc) {
  const c = isObj(cur) ? cur : {}, i = isObj(inc) ? inc : {};
  const out = Object.assign(clone(c), clone(i));
  out.xp = Math.max(Number(c.xp) || 0, Number(i.xp) || 0);
  const roz = {};
  [c.rozetler, i.rozetler].forEach(r => { if (isObj(r)) Object.keys(r).forEach(id => {
    const v = r[id]; if (!isObj(v)) return;
    const tv = Number(v.t), to = roz[id] ? Number(roz[id].t) : NaN;
    if (!roz[id] || (isFinite(tv) && (!isFinite(to) || tv < to))) roz[id] = clone(v);
  }); });
  out.rozetler = roz;
  const gor = {};
  [c.gorevler, i.gorevler].forEach(g => { if (isObj(g)) Object.keys(g).forEach(gun => {
    if (!isObj(g[gun])) return;
    if (!gor[gun]) gor[gun] = {};
    Object.keys(g[gun]).forEach(id => {
      const v = g[gun][id], o = gor[gun][id];
      if (!isObj(v)) return;
      if (!o) { gor[gun][id] = clone(v); return; }
      if (v.tamam === true && o.tamam !== true) gor[gun][id] = clone(v);
      else if (v.tamam === true && o.tamam === true && isFinite(Number(v.t)) && (!isFinite(Number(o.t)) || Number(v.t) < Number(o.t))) gor[gun][id] = clone(v);
    });
  }); });
  const gunler = Object.keys(gor).sort().slice(-120);
  out.gorevler = {};
  gunler.forEach(g => { out.gorevler[g] = gor[g]; });
  out.hedef = "hedef" in i ? clone(i.hedef) : (c.hedef === undefined ? null : clone(c.hedef));
  return out;
}

const BIRLESTIRICI = {
  [ANAHTAR.ilerleme]: ilerlemeBirlestir,
  [ANAHTAR.hatalar]: hatalarBirlestir,
  [ANAHTAR.deneme]: denemeBirlestir,
  [ANAHTAR.seviye]: seviyeBirlestir,
  [ANAHTAR.denemeHak]: hakBirlestir,
  [ANAHTAR.seri]: seriBirlestir,
  [ANAHTAR.tekrar]: tekrarBirlestir,
  [ANAHTAR.oyun]: oyunBirlestir
};
// Silinince sunucuda kalan boş değer: diğer cihazlar sonraki çekmede bunu alır, silme yayılır
const BOS = {
  [ANAHTAR.ilerleme]: { v: 1, pages: {} },
  [ANAHTAR.hatalar]: { v: 1, items: {} },
  [ANAHTAR.deneme]: { v: 1, aktif: null, gecmis: [] },
  [ANAHTAR.seviye]: { v: 1, devam: null, raporlar: [], kontrol: {} }
};

/** Silme izi (tombstone): silme anından önce oluşmuş kayıtlar atılır; eski cihaz silinen veriyi geri getiremez. */
function izleriAyikla(anahtar, v, silinme) {
  const sm = ms(silinme);
  if (sm === null || !isObj(v)) return v;
  const sonra = t => { const m = ms(t); return m !== null && m > sm; };
  v = clone(v);
  if (anahtar === ANAHTAR.hatalar && isObj(v.items)) {
    Object.keys(v.items).forEach(k => { const e = v.items[k]; if (!isObj(e) || !sonra(e.date)) delete v.items[k]; });
  } else if (anahtar === ANAHTAR.ilerleme && isObj(v.pages)) {
    Object.keys(v.pages).forEach(p => {
      const units = isObj(v.pages[p]) && isObj(v.pages[p].units) ? v.pages[p].units : {};
      Object.keys(units).forEach(u => {
        const ans = isObj(units[u]) && isObj(units[u].answers) ? units[u].answers : {};
        Object.keys(ans).forEach(q => { if (!isObj(ans[q]) || !sonra(ans[q].t)) delete ans[q]; });
        if (!Object.keys(ans).length) delete units[u];
      });
      if (!Object.keys(units).length) delete v.pages[p];
    });
  } else if (anahtar === ANAHTAR.deneme) {
    if (Array.isArray(v.gecmis)) v.gecmis = v.gecmis.filter(r => isObj(r) && sonra(r.tarih));
    if (isObj(v.aktif) && !sonra(v.aktif.baslangic)) v.aktif = null;
  } else if (anahtar === ANAHTAR.seviye) {
    if (Array.isArray(v.raporlar)) v.raporlar = v.raporlar.filter(r => isObj(r) && sonra(r.tarih));
    if (isObj(v.devam) && !sonra(v.devam.guncelleme || v.devam.baslangic)) v.devam = null;
    if (isObj(v.kontrol)) Object.keys(v.kontrol).forEach(k => { if (!isObj(v.kontrol[k]) || !sonra(v.kontrol[k].t)) delete v.kontrol[k]; });
  }
  return v;
}

/** Bir anahtarın yeni ham değerini mevcutla birleştirir. silinme: varsa anahtarın son silme zamanı. Dönüş: birleşmiş ham dize. */
function birlestir(anahtar, eskiHam, yeniHam, silinme) {
  const f = BIRLESTIRICI[anahtar];
  if (!f) return yeniHam; // son yazan kazanır
  if (eskiHam == null && !silinme) return yeniHam;
  let y = coz(yeniHam);
  if (y === undefined) return eskiHam == null ? yeniHam : eskiHam;
  if (silinme) y = izleriAyikla(anahtar, y, silinme);
  const e = eskiHam == null ? undefined : coz(eskiHam);
  return JSON.stringify(f(e === undefined ? null : e, y));
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
    hataSatirlari: db.prepare("SELECT id, sayfa, soru FROM wrong_answers WHERE user_id = ?"),
    hataSil: db.prepare("DELETE FROM wrong_answers WHERE id = ?"),
    dokun: db.prepare("UPDATE user_state SET guncelleme = ? WHERE user_id = ? AND anahtar = ?"),
    iz: db.prepare("SELECT zaman FROM state_tombstones WHERE user_id = ? AND anahtar = ?"),
    izYaz: db.prepare(`INSERT INTO state_tombstones (user_id, anahtar, zaman) VALUES (?, ?, ?)
      ON CONFLICT(user_id, anahtar) DO UPDATE SET zaman = excluded.zaman`),
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
      const kalan = new Set();
      Object.keys(v.items).forEach(k => {
        const e = v.items[k];
        if (!isObj(e)) return;
        const sayfa = e.page || String(k).split("|")[0], soru = e.id || String(k).split("|")[1];
        if (!sayfa || !soru) return;
        kalan.add(metin(sayfa, 80) + "|" + metin(soru, 120));
        st.hata.run(userId, metin(sayfa, 80), metin(soru, 120), metin(e.unit, 120), metin(e.topic, 300), metin(e.errorTag, 500), metin(e.selected, 20),
          metin(e.correct, 20), metin(e.firstDate || e.date, 40), metin(e.date, 40), Math.max(1, Number(e.count) || 1), e.resolved ? metin(e.resolvedDate || e.date, 40) || simdi() : null);
      });
      // Durumda artık olmayan (silme iziyle atılmış) kayıtlar tablodan da kalkar: tablo her zaman durumun aynısıdır
      st.hataSatirlari.all(userId).forEach(r => { if (!kalan.has(r.sayfa + "|" + r.soru)) st.hataSil.run(r.id); });
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

  // Anahtar silme. Birleştirilen anahtarlarda silme izi yazılır, boş değer saklanır (diğer cihazlar çekince kendi
  // kopyalarını boşaltır) ve ayrıştırılmış satırlar da silinir. Deneme hakkı kaydı silinmez: yalnızca zamanı
  // tazelenir ki istemci bir sonraki çekmede kaydı geri alsın.
  function sil(userId, k) {
    const z = simdi();
    if (k === ANAHTAR.denemeHak) { st.dokun.run(z, userId, k); return; }
    if (!BOS[k]) { st.sil.run(userId, k); return; }
    st.izYaz.run(userId, k, z);
    st.yaz.run(userId, k, JSON.stringify(BOS[k]), z);
    if (k === ANAHTAR.hatalar) st.hataSilHepsi.run(userId);
    else if (k === ANAHTAR.ilerleme) db.prepare("DELETE FROM answers WHERE user_id = ?").run(userId);
    else if (k === ANAHTAR.deneme) db.prepare("DELETE FROM exams WHERE user_id = ?").run(userId);
    else if (k === ANAHTAR.seviye) db.prepare("DELETE FROM level_tests WHERE user_id = ?").run(userId);
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
          if (yeni === null) { sil(userId, k); return; }
          if (coz(yeni) === undefined) { reddedilen.push(k); return; }
          const eski = st.tek.get(userId, k);
          if (!eski && st.say.get(userId).n >= EN_FAZLA_ANAHTAR) { reddedilen.push(k); return; }
          const iz = BIRLESTIRICI[k] ? st.iz.get(userId, k) : null;
          const son = birlestir(k, eski ? eski.deger : null, yeni, iz ? iz.zaman : null);
          st.yaz.run(userId, k, son, simdi());
          if (son !== yeni) birlesen[k] = son;
          ayristir(userId, k, son);
        });
      });
      return { birlesen, reddedilen };
    }
  };
}

module.exports = { veriServisi, ilerlemeBirlestir, hatalarBirlestir, denemeBirlestir, seviyeBirlestir, hakBirlestir, seriBirlestir, tekrarBirlestir, oyunBirlestir, birlestir, ANAHTAR };
