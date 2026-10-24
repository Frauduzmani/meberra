"use strict";
// v1.11.0 FRQ (free-response) pratiği. Bkz. server/API.md "FRQ".
// - Banka: frq tablosu (tohum server/tohum/frq.json; sürümlü, geçmiş frq_gecmis). Taslak FRQ öğrenciye görünmez; yönetici onaylar.
// - Liste ve soru yanıtlarında rubrik / örnek çözüm / sık hatalar YOKTUR; yalnızca teslimden sonra (POST …/teslim) gönderilir.
// - Ücretsiz plan: her ders anahtarında (calculus-ab, physics-1 …) 1 FRQ; hak teslimde yazılır (aynı FRQ yeniden çözülebilir).
//   Premium (ve yönetici) sınırsız. Hak dolunca 402 { premiumGerekli: true }.
// - Öz puanlama: öğrenci ölçüt başına puan işaretler (POST …/puanla); toplam + sınav katkısı tahmini döner.
const fs = require("fs");
const path = require("path");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const sekilM = require("./sekil");

const TOHUM = path.join(__dirname, "tohum", "frq.json");
const TOHUM_AYAR = "frq_tohum_surum";
const DURUMLAR = ["taslak", "aktif", "arsiv"];
const ZORLUKLAR = ["easy", "medium", "hard"];
const UCRETSIZ_HAK = 1; // ders başına

/** Ders anahtarları. agirlik: FRQ bölümünün sınav puanındaki yaklaşık payı (%); bolumPuan: gerçek sınavdaki FRQ bölümü toplam puanı (yaklaşık). */
const DERSLER = {
  "calculus-ab": { ad: "AP Calculus AB", kisa: "calculus", sayfa: "ap-calculus", agirlik: 50, bolumPuan: 54 },
  "calculus-bc": { ad: "AP Calculus BC", kisa: "calculus", sayfa: "ap-calculus", agirlik: 50, bolumPuan: 54 },
  "physics-1": { ad: "AP Physics 1", kisa: "physics", sayfa: "ap-physics", agirlik: 50, bolumPuan: 40 },
  "chemistry": { ad: "AP Chemistry", kisa: "chemistry", sayfa: "ap-chemistry", agirlik: 50, bolumPuan: 46 },
  "biology": { ad: "AP Biology", kisa: "biology", sayfa: "ap-biology", agirlik: 50, bolumPuan: 34 },
  "english-language": { ad: "AP English Language", kisa: "english", sayfa: "ap-english", agirlik: 55, bolumPuan: 18 },
  "macroeconomics": { ad: "AP Macroeconomics", kisa: "macro", sayfa: "ap-electives", agirlik: 33, bolumPuan: 20 },
  "microeconomics": { ad: "AP Microeconomics", kisa: "micro", sayfa: "ap-electives", agirlik: 33, bolumPuan: 20 },
  "computer-science-a": { ad: "AP Computer Science A", kisa: "csa", sayfa: "ap-electives", agirlik: 45, bolumPuan: 25 }
};

const kirp = s => String(s == null ? "" : s).trim();
function jsonCoz(v, d) { if (v == null) return d; try { return JSON.parse(v); } catch (e) { return d; } }
const sirala = o => Array.isArray(o) ? o.map(sirala) : o && typeof o === "object" ? Object.keys(o).sort().reduce((a, k) => (a[k] = sirala(o[k]), a), {}) : o;
const esit = (a, b) => JSON.stringify(sirala(a)) === JSON.stringify(sirala(b));
const tamSayi = v => Number.isInteger(v) && v >= 0;

/**
 * Yapı denetimi (sunucu kaydı + araclar/pm-denetim.js). Dönüş: sorun metinleri dizisi (boş = geçerli).
 * Kurallar: zorunlu alanlar; ders bilinen anahtar ve sayfası tutarlı; her parçada rubrik puanları toplamı = parça puanı;
 * toplam_puan = parça puanları toplamı; harfler a, b, c… sırasıyla; $ sınırlayıcısı yok (MathJax yalnız \( \) ve \[ \]).
 */
function dogrula(f) {
  const s = [];
  const ad = f && f.id ? f.id : "(kimliksiz)";
  const e = m => s.push(ad + ": " + m);
  if (!f || typeof f !== "object" || Array.isArray(f)) return ["FRQ bir nesne olmalı"];
  if (!/^frq-[a-z0-9-]{2,60}$/.test(String(f.id || ""))) e("id biçimi frq-… olmalı");
  ["sayfa", "ders", "tur", "baslik", "giris", "kaynak"].forEach(k => { if (!kirp(f[k])) e(k + " boş"); });
  const d = DERSLER[f.ders];
  if (!d) e("bilinmeyen ders: " + f.ders); else if (f.sayfa !== d.sayfa) e("sayfa " + d.sayfa + " olmalı");
  if (!Number.isInteger(f.sure_dk) || f.sure_dk < 1 || f.sure_dk > 120) e("sure_dk 1–120 tam sayı olmalı");
  if (typeof f.hesapMakinesi !== "boolean") e("hesapMakinesi true/false olmalı");
  if (ZORLUKLAR.indexOf(f.zorluk) < 0) e("zorluk easy|medium|hard olmalı");
  if (DURUMLAR.indexOf(f.durum) < 0) e("durum taslak|aktif|arsiv olmalı");
  if (/official|college board (released|exam)|past exam/i.test(String(f.kaynak || ""))) e("kaynak resmî sınav olamaz (özgün içerik)");
  if (!Array.isArray(f.parcalar) || !f.parcalar.length) { e("parcalar boş"); return s; }
  let top = 0;
  f.parcalar.forEach((p, i) => {
    const h = String.fromCharCode(97 + i), pa = "(" + (p && p.harf) + ")";
    if (!p || typeof p !== "object") { e("parça " + i + " nesne değil"); return; }
    if (p.harf !== h) e("parça " + i + " harfi '" + h + "' olmalı");
    if (!kirp(p.soru)) e(pa + " soru boş");
    if (!kirp(p.ornek_cozum)) e(pa + " ornek_cozum boş");
    if (!Array.isArray(p.sik_hatalar) || !p.sik_hatalar.length || p.sik_hatalar.some(x => !kirp(x))) e(pa + " sik_hatalar boş");
    if (!Number.isInteger(p.puan) || p.puan < 1) e(pa + " puan ≥ 1 tam sayı olmalı");
    if (!Array.isArray(p.rubrik) || !p.rubrik.length) { e(pa + " rubrik boş"); return; }
    let rt = 0;
    p.rubrik.forEach((r, j) => {
      if (!r || !Number.isInteger(r.puan) || r.puan < 1) e(pa + " rubrik " + (j + 1) + " puanı ≥ 1 tam sayı olmalı");
      if (!r || !kirp(r.olcut)) e(pa + " rubrik " + (j + 1) + " ölçütü boş");
      rt += r && Number.isInteger(r.puan) ? r.puan : 0;
    });
    if (rt !== p.puan) e(pa + " rubrik toplamı " + rt + " ≠ parça puanı " + p.puan);
    top += Number.isInteger(p.puan) ? p.puan : 0;
  });
  if (f.toplam_puan !== top) e("toplam_puan " + f.toplam_puan + " ≠ parça toplamı " + top);
  // v1.13.0 şekiller (FRQ girişi f.sekil, parça p.sekil): beyaz liste temizleyicisinden DEĞİŞMEDEN geçmeli, alt zorunlu
  const sekilDenet = (v, yer) => {
    if (v == null) return;
    const k = sekilM.sekilleriDogrula(v);
    k.hatalar.forEach(m => e(yer + " şekli: " + m));
    if (!k.hatalar.length && k.kaldirilan.length) e(yer + " şekli temizleyiciden değişerek geçiyor: " + k.kaldirilan.slice(0, 3).join(", "));
  };
  sekilDenet(f.sekil, "giriş");
  f.parcalar.forEach(p => { if (p && typeof p === "object") sekilDenet(p.sekil, "(" + p.harf + ")"); });
  const metin = JSON.stringify([f.giris, f.parcalar.map(p => p && typeof p === "object" ? Object.assign({}, p, { sekil: null }) : p)]);
  if (/(^|[^\\])\$/.test(metin)) e("'$' karakteri var (LaTeX için \\( \\) kullan; para için USD yaz)");
  return s;
}

/** v1.13.0: FRQ'daki şekilleri temizlenmiş (kararlı) biçime çevirir; geçersiz olanı olduğu gibi bırakır (dogrula yakalar). */
function sekilTemizle(f) {
  if (!f || typeof f !== "object") return f;
  const t = v => { if (v == null) return v; const k = sekilM.sekilleriDogrula(v); return k.hatalar.length ? v : k.deger; };
  const y = Object.assign({}, f);
  if (f.sekil != null) y.sekil = t(f.sekil);
  if (Array.isArray(f.parcalar)) y.parcalar = f.parcalar.map(p => p && typeof p === "object" && p.sekil != null ? Object.assign({}, p, { sekil: t(p.sekil) }) : p);
  return y;
}
/** Öğrenciye giden şekil alanları: sekiller (her zaman), cozumSekiller (yalnız teslimden sonra; konum "aciklama") */
function sekilAlanlari(hedef, kaynak, cozumde) {
  const g = sekilM.govdeSekilleri(kaynak && kaynak.sekil), c = sekilM.cozumSekilleri(kaynak && kaynak.sekil);
  if (g.length) hedef.sekiller = g;
  if (cozumde && c.length) hedef.cozumSekiller = c;
  return hedef;
}

// --- veri biçimleri ------------------------------------------------------------------------------
const satirCoz = r => r ? Object.assign(jsonCoz(r.veri, {}), { durum: r.durum, surum: r.surum, guncelleme: r.guncelleme, elle: !!r.elle }) : null;
/** Kart özeti (liste) — rubrik/çözüm yok */
function ozet(f) {
  return { id: f.id, sayfa: f.sayfa, ders: f.ders, dersAd: (DERSLER[f.ders] || {}).ad || f.ders, kisa: (DERSLER[f.ders] || {}).kisa || null, tur: f.tur, baslik: f.baslik,
    sure_dk: f.sure_dk, hesapMakinesi: !!f.hesapMakinesi, zorluk: f.zorluk, toplam_puan: f.toplam_puan, parcaSayisi: (f.parcalar || []).length };
}
/** Soru (çözmeye başlarken) — rubrik/çözüm yok */
function acik(f) {
  return sekilAlanlari(Object.assign(ozet(f), { giris: f.giris, kaynak: f.kaynak, parcalar: (f.parcalar || []).map(p => sekilAlanlari(Object.assign({ harf: p.harf, soru: p.soru, puan: p.puan },
    p.ne_soruyor ? { ne_soruyor: p.ne_soruyor } : {}), p, false)) }), f, false); // 1.24.0: ne_soruyor cevabı vermez, önceden gider
}
/** Teslimden sonra: rubrik + örnek çözüm + sık hatalar */
function tam(f) {
  return sekilAlanlari(Object.assign(ozet(f), { giris: f.giris, kaynak: f.kaynak, parcalar: (f.parcalar || []).map(p => sekilAlanlari({ harf: p.harf, soru: p.soru, puan: p.puan,
    rubrik: (p.rubrik || []).map(r => { const o = { puan: r.puan, olcut: r.olcut }; if (r.ornek_cevap) o.ornek_cevap = r.ornek_cevap; return o; }),
    ornek_cozum: p.ornek_cozum, sik_hatalar: p.sik_hatalar || [] }, p, true)) }), f, true);
}
const ICERIK_DISI = ["durum", "surum", "guncelleme", "elle"];
function icerik(f) { const o = Object.assign({}, f); ICERIK_DISI.forEach(k => delete o[k]); return o; }

/** Tahmini sınav katkısı notu (öz puan → bileşik puandaki yaklaşık pay). */
function katkiNotu(f, toplam) {
  const d = DERSLER[f.ders] || { agirlik: 50, bolumPuan: f.toplam_puan * 4 };
  const pay = d.agirlik * f.toplam_puan / Math.max(d.bolumPuan, f.toplam_puan);
  const kazanc = pay * (toplam / Math.max(1, f.toplam_puan));
  const yuvarla = x => (Math.round(x * 10) / 10).toLocaleString("tr-TR");
  return { soruPayi: Math.round(pay * 10) / 10, kazanilan: Math.round(kazanc * 10) / 10,
    metin: (d.ad || "Bu ders") + " sınavında serbest yanıt bölümünün payı: yaklaşık %" + d.agirlik + ". Bu sorunun bileşik puandaki payı: ≈ %" + yuvarla(pay) +
      "; öz puanınla kazandığın: ≈ %" + yuvarla(kazanc) + ". Tahmindir: resmî ölçekleme yıldan yıla değişir." };
}

// --- tohum eşitleme (açılışta) ---------------------------------------------------------------------
function tohumOku(dosya) {
  const f = dosya || TOHUM;
  if (!fs.existsSync(f)) return null;
  const t = JSON.parse(fs.readFileSync(f, "utf8"));
  return { surum: Number(t.surum) || 1, frq: Array.isArray(t.frq) ? t.frq : [] };
}
const yoneticiKimligi = v => v != null && /^\d+$/.test(String(v));
/** FRQ yönetici tarafından düzenlendi/onaylandı/arşivlendi mi (son yazan ya da geçmişte herhangi bir sürümü yazan kullanıcı)? */
function yoneticiDokundu(db, r) {
  if (yoneticiKimligi(r.guncelleyen)) return true;
  return db.prepare("SELECT degistiren FROM frq_gecmis WHERE frq_id = ?").all(r.id).some(h => yoneticiKimligi(h.degistiren));
}
function ayarOku(db) { const r = db.prepare("SELECT deger FROM ayarlar WHERE anahtar = ?").get(TOHUM_AYAR); return r ? Number(r.deger) || 0 : 0; }
function ayarYaz(db, v) {
  db.prepare(`INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, NULL)
    ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme, guncelleyen = NULL`).run(TOHUM_AYAR, String(v), simdi());
}
/**
 * Tohum sürümü veritabanındakinden yeniyse: yeni FRQ'lar eklenir (tohumdaki durumla); yönetici içerik düzenlemesi olmayanların
 * içeriği güncellenir. Durum (onay/arşiv) yönetici FRQ'ya hiç dokunmadıysa tohumdan gelir, dokunduysa korunur.
 * Dönüş: { mod, eklenen, guncellenen, korunan }
 */
function tohumEsitle(db, dosya, gunluk) {
  const t = tohumOku(dosya);
  if (!t) return { mod: "yok" };
  const dbSurum = ayarOku(db);
  if (t.surum <= dbSurum) return { mod: "guncel", surum: dbSurum };
  const s = { mod: dbSurum ? "guncelleme" : "ilk", surum: t.surum, eklenen: 0, guncellenen: 0, korunan: [] };
  const tek = db.prepare("SELECT * FROM frq WHERE id = ?");
  islem(db, () => {
    for (const f0 of t.frq) {
      const f = sekilTemizle(f0);
      if (dogrula(f).length) continue; // bozuk tohum kaydı yüklenmez (pm-denetim yakalar)
      const r = tek.get(f.id), z = simdi();
      if (!r) {
        db.prepare("INSERT INTO frq (id, sayfa, ders, baslik, toplam_puan, veri, durum, surum, elle, olusturma, guncelleme, guncelleyen) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, 'tohum')")
          .run(f.id, f.sayfa, f.ders, f.baslik, f.toplam_puan, JSON.stringify(icerik(f)), f.durum, z, z);
        s.eklenen++; continue;
      }
      // 1.11.0: durum da tohumdan gelir (onay/ret kararları) — ama yalnız yönetici bu FRQ'ya hiç dokunmadıysa
      // (içerik düzenlemesi, onay ya da arşiv). Dokunduysa içerik düzenlemesi yoksa içerik güncellenir, durum korunur.
      const dokundu = yoneticiDokundu(db, r);
      const durum = dokundu ? r.durum : f.durum;
      if (esit(jsonCoz(r.veri, {}), icerik(f)) && durum === r.durum) continue;
      if (r.elle) { s.korunan.push(f.id); continue; }
      surumYaz(db, r, icerik(f), durum, "tohum", "tohum sürümü " + t.surum, false);
      s.guncellenen++;
    }
    ayarYaz(db, t.surum);
  });
  if (gunluk && s.mod === "guncelleme") gunluk.bilgi("sunucu", `FRQ tohumu ${dbSurum} → ${t.surum}: ${s.eklenen} eklendi, ${s.guncellenen} güncellendi, ${s.korunan.length} yönetici düzenlemesi korundu`);
  return s;
}
/** Eski hâli geçmişe yazar, satırı surum+1 yapar (iyimser kilit). */
function surumYaz(db, r, veri, durum, kim, not, elle) {
  const z = simdi();
  db.prepare("INSERT INTO frq_gecmis (frq_id, surum, veri, durum, not_, degistiren, zaman) VALUES (?, ?, ?, ?, ?, ?, ?)").run(r.id, r.surum, r.veri, r.durum, not || null, kim == null ? null : String(kim), z);
  const n = Number(db.prepare("UPDATE frq SET sayfa = ?, ders = ?, baslik = ?, toplam_puan = ?, veri = ?, durum = ?, surum = ?, elle = ?, guncelleme = ?, guncelleyen = ? WHERE id = ? AND surum = ?")
    .run(veri.sayfa, veri.ders, veri.baslik, veri.toplam_puan, JSON.stringify(veri), durum, r.surum + 1, elle ? 1 : r.elle, z, kim == null ? null : String(kim), r.id, r.surum).changes);
  if (n !== 1) throw new HttpHata(409, "FRQ bu sırada başka biri tarafından değiştirildi. Sayfayı yenileyip tekrar dene.");
  return r.surum + 1;
}

// --- rotalar ---------------------------------------------------------------------------------------
/** bag: { db, hesap, denetim, oturumGerekli, yoneticiGerekli, teslimSiniri? } */
function frqRotalari(r, bag) {
  const { db, hesap, denetim, oturumGerekli, yoneticiGerekli } = bag;
  const sinir = { teslim: hizSinirlayici(bag.teslimSiniri || 60, 60 * 60e3) };
  const q = {
    tek: db.prepare("SELECT * FROM frq WHERE id = ?"),
    liste: db.prepare("SELECT * FROM frq WHERE durum IN (SELECT value FROM json_each(?)) ORDER BY sayfa, ders, id"),
    hakFrq: db.prepare("SELECT DISTINCT frq_id FROM frq_denemeleri WHERE user_id = ? AND ders = ? AND ucretsiz_hak = 1"),
    hakTum: db.prepare("SELECT ders, frq_id FROM frq_denemeleri WHERE user_id = ? AND ucretsiz_hak = 1 GROUP BY ders, frq_id"),
    ekle: db.prepare("INSERT INTO frq_denemeleri (user_id, frq_id, ders, frq_surum, cevaplar, toplam_puan, sure_sn, ucretsiz_hak, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),
    deneme: db.prepare("SELECT * FROM frq_denemeleri WHERE id = ? AND user_id = ?"),
    puanla: db.prepare("UPDATE frq_denemeleri SET puanlar = ?, toplam = ?, puanlama = ? WHERE id = ? AND user_id = ?"),
    sonlar: db.prepare(`SELECT d.frq_id, COUNT(*) AS adet, MAX(d.id) AS son_id FROM frq_denemeleri d WHERE d.user_id = ? GROUP BY d.frq_id`),
    gecmis: db.prepare(`SELECT d.id, d.frq_id, d.ders, d.toplam, d.toplam_puan, d.sure_sn, d.created, d.puanlama, f.baslik, f.sayfa FROM frq_denemeleri d
      LEFT JOIN frq f ON f.id = d.frq_id WHERE d.user_id = ? ORDER BY d.id DESC LIMIT ?`),
    gecmisler: db.prepare("SELECT surum, durum, not_, degistiren, zaman FROM frq_gecmis WHERE frq_id = ? ORDER BY surum DESC LIMIT 50"),
    gecmisVeri: db.prepare("SELECT veri, durum FROM frq_gecmis WHERE frq_id = ? AND surum = ?"),
    denemeSay: db.prepare("SELECT frq_id, COUNT(*) AS n, AVG(CASE WHEN toplam IS NOT NULL THEN 100.0 * toplam / toplam_puan END) AS ort FROM frq_denemeleri GROUP BY frq_id")
  };
  const ozel = res => res.setHeader("Cache-Control", "private, no-store");
  const yoneticiMi = req => !!req.kullanici && req.kullanici.rol === "yonetici";
  const premiumMu = req => yoneticiMi(req) || (!!req.kullanici && hesap.uyelik(req.kullanici.id).premium);
  const premiumHata = (mesaj, ek) => new HttpHata(402, mesaj, null, Object.assign({ premiumGerekli: true }, ek || {}));
  /** Öğrencinin görebileceği FRQ (taslak/arşiv yalnız yöneticiye) */
  function getir(req, id) {
    const f = satirCoz(q.tek.get(String(id || "")));
    if (!f || (f.durum !== "aktif" && !yoneticiMi(req))) throw new HttpHata(404, "FRQ bulunamadı.");
    return f;
  }
  /** Ücretsiz hak: { kullanildi, frqId } — bu FRQ'ya erişim var mı? */
  function hakDurum(uid, ders) { const l = q.hakFrq.all(uid, ders).map(x => x.frq_id); return { kullanilan: l, dolu: l.length >= UCRETSIZ_HAK }; }
  function erisimVar(req, f) {
    if (premiumMu(req)) return true;
    const h = hakDurum(req.kullanici.id, f.ders);
    return !h.dolu || h.kullanilan.indexOf(f.id) >= 0;
  }
  const kilitHata = f => premiumHata("Ücretsiz planda her dersten 1 FRQ çözebilirsin. Premium ile tüm FRQ'lar açık.", { hakKullanildi: true, ders: f.ders });

  // ==== öğrenci ====================================================================================
  r.get("/api/frq", (req, res) => {
    oturumGerekli(req); ozel(res);
    const sayfa = kirp(req.sorgu.get("sayfa")).replace(/\.html?$/i, ""), ders = kirp(req.sorgu.get("ders"));
    const prem = premiumMu(req), uid = req.kullanici.id;
    const durumlar = yoneticiMi(req) ? ["aktif", "taslak"] : ["aktif"];
    const hak = {};
    q.hakTum.all(uid).forEach(x => { (hak[x.ders] = hak[x.ders] || []).push(x.frq_id); });
    const son = {};
    q.sonlar.all(uid).forEach(x => { son[x.frq_id] = x; });
    const sonDeneme = id => { const x = son[id]; if (!x) return null; const d = q.deneme.get(x.son_id, uid); return { adet: x.adet, denemeId: d.id, toplam: d.toplam, toplam_puan: d.toplam_puan, tarih: d.created }; };
    const liste = q.liste.all(JSON.stringify(durumlar)).map(satirCoz)
      .filter(f => (!sayfa || f.sayfa === sayfa) && (!ders || f.ders === ders || (DERSLER[f.ders] || {}).kisa === ders))
      .map(f => {
        const h = hak[f.ders] || [];
        return Object.assign(ozet(f), { durum: f.durum, kilitli: !prem && h.length >= UCRETSIZ_HAK && h.indexOf(f.id) < 0, son: sonDeneme(f.id) });
      });
    const haklar = {};
    Object.keys(DERSLER).forEach(k => { haklar[k] = { hak: UCRETSIZ_HAK, kullanilan: (hak[k] || []).length }; });
    return { ok: true, premium: prem, haklar, dersler: DERSLER, frq: liste };
  });

  r.get("/api/frq/gecmis", (req, res) => {
    oturumGerekli(req); ozel(res);
    const n = Math.min(200, Math.max(1, Number(req.sorgu.get("adet")) || 50));
    return { ok: true, gecmis: q.gecmis.all(req.kullanici.id, n).map(x => ({ id: x.id, frqId: x.frq_id, ders: x.ders, baslik: x.baslik || x.frq_id, sayfa: x.sayfa,
      toplam: x.toplam, toplam_puan: x.toplam_puan, yuzde: x.toplam == null ? null : Math.round(100 * x.toplam / x.toplam_puan), sure_sn: x.sure_sn, tarih: x.created, puanlandi: x.toplam != null })) };
  });

  /** Geçmiş bir deneme (yalnızca sahibine): cevaplar + puanlar + rubrik (teslim edilmiş olduğu için) */
  r.get("/api/frq/deneme/:id", (req, res) => {
    oturumGerekli(req); ozel(res);
    const d = q.deneme.get(Number(req.params.id) || 0, req.kullanici.id);
    if (!d) throw new HttpHata(404, "Deneme bulunamadı.");
    const f = satirCoz(q.tek.get(d.frq_id));
    if (!f) throw new HttpHata(404, "FRQ artık yok.");
    return { ok: true, deneme: { id: d.id, frqId: d.frq_id, cevaplar: jsonCoz(d.cevaplar, {}), puanlar: jsonCoz(d.puanlar, null), toplam: d.toplam, toplam_puan: d.toplam_puan,
      sure_sn: d.sure_sn, tarih: d.created }, frq: tam(f), katki: d.toplam == null ? null : katkiNotu(f, d.toplam) };
  });

  r.get("/api/frq/:id", (req, res) => {
    oturumGerekli(req); ozel(res);
    const f = getir(req, req.params.id);
    if (!erisimVar(req, f)) throw kilitHata(f);
    return { ok: true, premium: premiumMu(req), frq: acik(f) };
  });

  r.post("/api/frq/:id/teslim", (req, res) => {
    oturumGerekli(req); ozel(res);
    if (!sinir.teslim.dene("u:" + req.kullanici.id)) throw new HttpHata(429, "Çok sık teslim ediyorsun. Biraz sonra tekrar dene.");
    const f = getir(req, req.params.id), uid = req.kullanici.id, b = req.body || {};
    const gelen = b.cevaplar && typeof b.cevaplar === "object" && !Array.isArray(b.cevaplar) ? b.cevaplar : {};
    const cevaplar = {};
    f.parcalar.forEach(p => { cevaplar[p.harf] = String(gelen[p.harf] == null ? "" : gelen[p.harf]).slice(0, 20000); });
    const sure = Number.isFinite(Number(b.sure_sn)) ? Math.max(0, Math.min(6 * 3600, Math.round(Number(b.sure_sn)))) : null;
    let id, hakli = 0;
    islem(db, () => {
      if (!premiumMu(req)) {
        const h = hakDurum(uid, f.ders);
        if (h.kullanilan.indexOf(f.id) < 0) { if (h.dolu) throw kilitHata(f); hakli = 1; }
        else hakli = 1;
      }
      id = Number(q.ekle.run(uid, f.id, f.ders, f.surum, JSON.stringify(cevaplar), f.toplam_puan, sure, hakli, simdi()).lastInsertRowid);
    });
    denetim({ eylem: "frq.teslim", kullanici: uid, istek: req, varlik: "frq_denemeleri", varlikId: id, ayrinti: { frq: f.id, ucretsizHak: !!hakli, bos: Object.keys(cevaplar).filter(k => !cevaplar[k].trim()).length } });
    return { ok: true, denemeId: id, cevaplar, frq: tam(f) };
  });

  r.post("/api/frq/:id/puanla", (req, res) => {
    oturumGerekli(req); ozel(res);
    const b = req.body || {}, uid = req.kullanici.id;
    const d = q.deneme.get(Number(b.denemeId) || 0, uid);
    if (!d || d.frq_id !== String(req.params.id)) throw new HttpHata(404, "Deneme bulunamadı.");
    const f = satirCoz(q.tek.get(d.frq_id));
    if (!f) throw new HttpHata(404, "FRQ bulunamadı.");
    const gelen = b.puanlar && typeof b.puanlar === "object" && !Array.isArray(b.puanlar) ? b.puanlar : null;
    if (!gelen) throw new HttpHata(400, "puanlar nesnesi gerekli: { harf: [ölçüt başına puan] }.");
    const puanlar = {};
    let toplam = 0;
    f.parcalar.forEach(p => {
      const l = Array.isArray(gelen[p.harf]) ? gelen[p.harf] : [];
      puanlar[p.harf] = p.rubrik.map((rb, i) => {
        let v = l[i];
        if (v === true) v = rb.puan; else if (v === false || v == null) v = 0;
        v = Math.round(Number(v));
        if (!Number.isFinite(v) || v < 0 || v > rb.puan) throw new HttpHata(400, "(" + p.harf + ") ölçüt " + (i + 1) + " için puan 0–" + rb.puan + " olmalı.");
        toplam += v; return v;
      });
    });
    q.puanla.run(JSON.stringify(puanlar), toplam, simdi(), d.id, uid);
    denetim({ eylem: "frq.puanla", kullanici: uid, istek: req, varlik: "frq_denemeleri", varlikId: d.id, ayrinti: { frq: f.id, toplam, toplamPuan: d.toplam_puan } });
    return { ok: true, denemeId: d.id, puanlar, toplam, toplam_puan: d.toplam_puan, yuzde: Math.round(100 * toplam / d.toplam_puan), katki: katkiNotu(f, toplam) };
  });

  // ==== yönetici ===================================================================================
  r.get("/api/admin/frq", (req, res) => {
    yoneticiGerekli(req); ozel(res);
    const durum = kirp(req.sorgu.get("durum")), ders = kirp(req.sorgu.get("ders"));
    const say = {};
    q.denemeSay.all().forEach(x => { say[x.frq_id] = { n: x.n, ort: x.ort == null ? null : Math.round(x.ort) }; });
    const liste = q.liste.all(JSON.stringify(DURUMLAR)).map(satirCoz).filter(f => (!durum || f.durum === durum) && (!ders || f.ders === ders))
      .map(f => Object.assign(ozet(f), { durum: f.durum, surum: f.surum, guncelleme: f.guncelleme, elle: f.elle, deneme: (say[f.id] || {}).n || 0, ortalama: (say[f.id] || {}).ort == null ? null : say[f.id].ort, sorunlar: dogrula(f).length }));
    const durumSay = { taslak: 0, aktif: 0, arsiv: 0 };
    q.liste.all(JSON.stringify(DURUMLAR)).forEach(x => { durumSay[x.durum]++; });
    return { ok: true, dersler: DERSLER, durumSay, frq: liste };
  });
  r.get("/api/admin/frq/:id", (req, res) => {
    yoneticiGerekli(req); ozel(res);
    const f = satirCoz(q.tek.get(String(req.params.id)));
    if (!f) throw new HttpHata(404, "FRQ bulunamadı.");
    const hs = Number(req.sorgu.get("surum")) || 0;
    let eski = null;
    if (hs) { const g = q.gecmisVeri.get(f.id, hs); if (!g) throw new HttpHata(404, "Bu sürüm yok."); eski = Object.assign(jsonCoz(g.veri, {}), { durum: g.durum }); }
    return { ok: true, frq: f, gecmis: q.gecmisler.all(f.id), eskiSurum: eski, sorunlar: dogrula(f) };
  });
  r.put("/api/admin/frq/:id", (req, res) => {
    yoneticiGerekli(req); ozel(res);
    const b = req.body || {}, r0 = q.tek.get(String(req.params.id));
    if (!r0) throw new HttpHata(404, "FRQ bulunamadı.");
    if (Number(b.surum) !== r0.surum) throw new HttpHata(409, "FRQ bu sırada değişti (sürüm " + r0.surum + "). Sayfayı yenileyip tekrar dene.");
    const v = b.veri && typeof b.veri === "object" && !Array.isArray(b.veri) ? Object.assign({}, b.veri) : null;
    if (!v) throw new HttpHata(400, "veri nesnesi gerekli.");
    v.id = r0.id; v.durum = r0.durum; // kimlik ve durum düzenleyiciden değişmez (onay/arşiv ayrı)
    Object.assign(v, sekilTemizle(v)); // v1.13.0: şekiller beyaz listeyle temizlenmiş hâliyle saklanır
    const sorun = dogrula(v);
    if (sorun.length) throw new HttpHata(400, "FRQ geçersiz: " + sorun.slice(0, 5).join("; "), null, { sorunlar: sorun });
    const yeni = icerik(v);
    if (esit(jsonCoz(r0.veri, {}), yeni)) return { ok: true, degisiklik: false, surum: r0.surum };
    const surum = surumYaz(db, r0, yeni, r0.durum, req.kullanici.id, kirp(b.not).slice(0, 200) || "düzenleme", true);
    denetim({ eylem: "frq.duzenle", yapan: req.kullanici.id, istek: req, varlik: "frq", varlikId: r0.id, ayrinti: { surum } });
    return { ok: true, degisiklik: true, surum };
  });
  r.post("/api/admin/frq/:id/durum", (req, res) => {
    yoneticiGerekli(req); ozel(res);
    const b = req.body || {}, r0 = q.tek.get(String(req.params.id));
    if (!r0) throw new HttpHata(404, "FRQ bulunamadı.");
    const hedef = String(b.durum || "");
    if (DURUMLAR.indexOf(hedef) < 0) throw new HttpHata(400, "durum taslak|aktif|arsiv olmalı.");
    if (hedef === r0.durum) return { ok: true, degisiklik: false, durum: hedef, surum: r0.surum };
    if (hedef === "aktif") { const s = dogrula(satirCoz(r0)); if (s.length) throw new HttpHata(400, "Onaylanamaz, yapı sorunlu: " + s.slice(0, 3).join("; "), null, { sorunlar: s }); }
    const surum = surumYaz(db, r0, jsonCoz(r0.veri, {}), hedef, req.kullanici.id, r0.durum + " → " + hedef, false);
    const eylem = hedef === "aktif" ? "frq.onayla" : hedef === "arsiv" ? "frq.arsiv" : "frq.taslaga-al";
    denetim({ eylem, yapan: req.kullanici.id, istek: req, varlik: "frq", varlikId: r0.id, ayrinti: { onceki: r0.durum, durum: hedef, surum } });
    return { ok: true, degisiklik: true, durum: hedef, surum };
  });

  return { sinir };
}

module.exports = { frqRotalari, tohumEsitle, dogrula, sekilTemizle, sekilAlanlari, DERSLER, TOHUM, UCRETSIZ_HAK };
