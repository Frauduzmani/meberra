"use strict";
// 1.18.0 Kişisel uyarlanır çalışma planı. Saf motor: assets/js/plan-motor.js (istemciyle ortak). Bu modül girdileri toplar:
//   - profil: apDersleri [{ders, hedef}] + sinavYili (assets/js/ap-hedef.js kuralları)
//   - sınav günleri: data/mevzuat/sinav-takvimi.js (server/veli.js takvim(); kesin değilse "Mayıs <yıl>", gün uydurulmaz)
//   - ünite listesi: assets/js/oyun.js YOL (ünite sırası = soru bankası unite_no) + soru bankası soru sayısı
//   - CED ağırlıkları: server/tohum/sinav-formatlari.json > uniteAgirlik
//   - ilerleme: answers, exams (ts-… = tam sınav), frq_denemeleri
// Kalıcı durum (migrations/015_calisma_plani.sql): plan_ayar (saat, dondurulmuş hafta, imza), plan_gorevler (haftaya yazılmış
// görevler; tamam/manuel). Bu haftanın görevleri ilk açılışta yazılır (sabit kontrol listesi); gelecek haftalar her istekte
// güncel ilerlemeden yeniden hesaplanır. Biten olmayan görevler sonraki haftaya devreder.
// Uçlar: GET /api/plan · PUT /api/plan/ayar {saat} · POST /api/plan/gorev/:id {tamam}. Veli paneli: veliPlanOzeti(db, hesap, uid).
const fs = require("fs");
const path = require("path");
const { HttpHata } = require("./http");
const zaman = require("./zaman");
const ADRES = require("./adresler");
const AP = require("../assets/js/ap-hedef");
const M = require("../assets/js/plan-motor");
const KURAL = require("../assets/js/ucretsiz-kural");
const OYUN = require("../assets/js/oyun");
const { takvim } = require("./veli");

const FORMAT_DOSYA = path.join(__dirname, "tohum", "sinav-formatlari.json");
let formatOnbellek = null;
function formatlar() {
  if (formatOnbellek) return formatOnbellek;
  try { formatOnbellek = JSON.parse(fs.readFileSync(FORMAT_DOSYA, "utf8")).sinavlar || {}; } catch (e) { formatOnbellek = {}; }
  return formatOnbellek;
}
// FRQ ders → /frq?ders=<kısa> (server/frq.js DERSLER.kisa)
let frqKisa = null;
function frqLink(ders) {
  if (!frqKisa) { try { const D = require("./frq").DERSLER || {}; frqKisa = {}; Object.keys(D).forEach(k => { frqKisa[k] = D[k].kisa; }); } catch (e) { frqKisa = {}; } }
  return frqKisa[ders] ? "/frq?ders=" + encodeURIComponent(frqKisa[ders]) : null;
}

/** Ünite adındaki CED ünite numaraları: "Ünite 5 · … and Ünite 6" → [5, 6]; "Ünite 1–4" → [1,2,3,4] */
function adNumaralari(ad) {
  const out = [], re = /Ünite\s+(\d+)(?:\s*[–-]\s*(\d+))?/g;
  let m;
  while ((m = re.exec(String(ad || "")))) { const a = +m[1], b = m[2] ? +m[2] : a; for (let i = a; i <= b && i - a < 20; i++) out.push(i); }
  return out;
}

/**
 * Bir AP dersinin plan üniteleri (saf; testler doğrudan çağırır).
 * x: AP.secilenler() öğesi · bankaSay: kutu → aktif soru sayısı (yoksa YOL sayısı) · premium
 * Dönüş: [{ id, no, ad, kutular, agirlik (ders içinde toplam 100), soru, kilitli, link }]
 */
function dersUniteleri(x, bankaSay, premium) {
  const yol = (OYUN.YOL && OYUN.YOL[x.sayfa]) || [];
  const re = x.kutu ? new RegExp(x.kutu) : null;
  const ua = (formatlar()[x.ders] || {}).uniteAgirlik || {};
  const onek = x.ders === "microeconomics" ? "Micro " : x.ders === "macroeconomics" ? "Macro " : "";
  const temel = ADRES.sayfaAdres(x.sayfa) || "/" + x.sayfa;
  let l = yol.map((u, i) => ({ no: i + 1, ad: String(u[0]).replace(/^Ünite\s+\S+\s+·\s+/, "").trim() || u[0], tamAd: u[0], num: u[1], etiket: u[2] || "", kutular: u[3] || [], yolSoru: u[4] || 0 }))
    .filter(u => !re || u.kutular.some(k => re.test(k)))
    .filter(u => !(x.ders === "calculus-ab" && /Calculus BC$/.test(u.etiket)))
    .filter(u => !(x.ders === "physics-1" && u.etiket && !/Physics 1/.test(u.etiket)));
  l.forEach(u => {
    u.soru = u.kutular.reduce((s, k) => s + (bankaSay && bankaSay[k] != null ? bankaSay[k] : 0), 0);
    if (!bankaSay) u.soru = u.yolSoru;
    const nolar = u.num != null && !adNumaralari(u.tamAd).length ? [+u.num] : adNumaralari(u.tamAd);
    u.anahtarlar = nolar.map(n => onek + n).filter(k => ua[k] > 0);
  });
  l = l.filter(u => u.soru > 0);
  const sayac = {};
  l.forEach(u => u.anahtarlar.forEach(k => { sayac[k] = (sayac[k] || 0) + 1; }));
  const degerler = Object.keys(ua).map(k => ua[k]).filter(v => v > 0);
  const ort = degerler.length ? degerler.reduce((a, b) => a + b, 0) / degerler.length : 10;
  l.forEach(u => { u.ham = u.anahtarlar.length ? u.anahtarlar.reduce((s, k) => s + ua[k] / sayac[k], 0) : ort; });
  const top = l.reduce((s, u) => s + u.ham, 0) || 1;
  return l.map(u => ({
    id: x.sayfa + "#" + u.no, no: u.no, ad: u.ad, kutular: u.kutular, agirlik: Math.round(u.ham / top * 1000) / 10, soru: u.soru,
    kilitli: !premium && !u.kutular.some(k => KURAL.apKutuUcretsizMi(x.sayfa, k)),
    link: temel + "?unite=" + u.no
  }));
}

/** Takvimden kilometre taşları (yalnızca veride olan tarihler) */
function kilometreTaslari(t) {
  const k = (t && t.kayit) || {}, out = [];
  if (M.gecerliGun(k.sonGun)) out.push({ gun: k.sonGun, ad: "AP kayıt (sipariş) son günü", tur: "kayit" });
  if (M.gecerliGun(k.gecKayitSon)) out.push({ gun: k.gecKayitSon, ad: "Geç kayıt son günü", tur: "kayit" });
  return out;
}

function planServisi(db, c) {
  c = c || {};
  const hesap = c.hesap;
  const saatF = c.saat || Date.now;
  const q = {
    ayar: db.prepare("SELECT * FROM plan_ayar WHERE user_id = ?"),
    ayarEkle: db.prepare(`INSERT INTO plan_ayar (user_id, saat, hafta, imza, created, updated) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET saat = excluded.saat, hafta = excluded.hafta, imza = excluded.imza, updated = excluded.updated`),
    gorevler: db.prepare("SELECT * FROM plan_gorevler WHERE user_id = ? ORDER BY ilk_hafta, created, id"),
    gorev: db.prepare("SELECT * FROM plan_gorevler WHERE user_id = ? AND id = ?"),
    gorevEkle: db.prepare("INSERT OR IGNORE INTO plan_gorevler (user_id, id, hafta, ilk_hafta, veri, tamam, manuel, created) VALUES (?, ?, ?, ?, ?, 0, 0, ?)"),
    gorevTasi: db.prepare("UPDATE plan_gorevler SET hafta = ? WHERE user_id = ? AND id = ?"),
    gorevSil: db.prepare("DELETE FROM plan_gorevler WHERE user_id = ? AND id = ?"),
    otoTamam: db.prepare("UPDATE plan_gorevler SET tamam = 1, tamam_zaman = ? WHERE user_id = ? AND id = ? AND manuel = 0 AND tamam = 0"),
    elle: db.prepare("UPDATE plan_gorevler SET tamam = ?, manuel = 1, tamam_zaman = ? WHERE user_id = ? AND id = ?"),
    banka: db.prepare("SELECT sayfa, kutu, COUNT(*) AS n FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND kutu IS NOT NULL GROUP BY sayfa, kutu"),
    cevaplar: db.prepare("SELECT sayfa, unite, soru, dogru, zaman FROM answers WHERE user_id = ?"),
    denemeler: db.prepare("SELECT istemci_id, kod, tarih FROM exams WHERE user_id = ? AND tarih IS NOT NULL"),
    frq: db.prepare("SELECT ders, created FROM frq_denemeleri WHERE user_id = ?")
  };
  const gunOf = iso => { const t = Date.parse(iso); return isNaN(t) ? null : zaman.gun(t); };

  function bankaSayilari() {
    const m = {};
    try { q.banka.all().forEach(r => { (m[r.sayfa] = m[r.sayfa] || {})[r.kutu] = r.n; }); } catch (e) { /* tablo yoksa YOL */ }
    return m;
  }

  /** Planın girdileri (salt okunur) */
  function girdiler(uid, simdiMs) {
    const profil = hesap.profilAl(uid) || {};
    const uyelik = hesap.uyelik(uid) || {};
    const premium = !!uyelik.premium;
    const bugun = zaman.gun(simdiMs);
    const tk = takvim();
    const tarihler = AP.sinavTarihleri(profil, tk, new Date(simdiMs));
    const banka = bankaSayilari();
    const bos = !Object.keys(banka).length;
    const cev = q.cevaplar.all(uid);
    const fm = formatlar();
    const dersler = AP.secilenler(profil).map(x => {
      const uniteler = dersUniteleri(x, bos ? null : (banka[x.sayfa] || {}), premium);
      const kutuUnite = {};
      uniteler.forEach(u => u.kutular.forEach(k => { kutuUnite[k] = u; }));
      const ist = {};
      cev.forEach(a => {
        if (a.sayfa !== x.sayfa) return;
        const u = kutuUnite[a.unite]; if (!u) return;
        const s = ist[u.id] || (ist[u.id] = { cevap: 0, dogru: 0, sorular: new Set() });
        s.cevap++; if (a.dogru) s.dogru++; s.sorular.add(a.soru);
      });
      uniteler.forEach(u => {
        const s = ist[u.id];
        u.cevap = s ? s.cevap : 0;
        u.dogruluk = s && s.cevap ? Math.round(s.dogru / s.cevap * 100) : null;
        u.kapsam = s && u.soru ? Math.min(100, Math.round(s.sorular.size / u.soru * 100)) : 0;
      });
      const t = tarihler.filter(z => z.ders === x.ders)[0] || {};
      const f = fm[x.ders];
      return { ders: x.ders, ad: x.kisa || x.ad, tamAd: "AP " + x.ad, hedef: x.hedef, sayfa: x.sayfa, kutu: x.kutu,
        sinav: { gun: t.gun || null, yil: t.yil, kesin: !!t.kesin },
        denemeKodu: x.deneme, denemeLink: "/deneme?ders=" + encodeURIComponent(x.deneme),
        tamLink: f ? "/deneme?tam=" + encodeURIComponent(x.ders) : null, frqLink: frqLink(x.ders),
        link: ADRES.sayfaAdres(x.sayfa), uniteler };
    });
    return { profil, premium, bugun, dersler, tk, cev, imza: JSON.stringify([AP.secilenler(profil).map(x => [x.ders, x.hedef]), tarihler.map(z => z.yil)[0] || null]) };
  }

  /** Görev tamamlanma olayları (motor.tamamMi girdisi) */
  function olaylar(uid, g) {
    const kutu = {}; // sayfa|kutu → [{ unite, ders }]
    g.dersler.forEach(d => d.uniteler.forEach(u => u.kutular.forEach(k => { (kutu[d.sayfa + "|" + k] = kutu[d.sayfa + "|" + k] || []).push({ unite: u.id, ders: d.ders }); })));
    const cevaplar = [];
    g.cev.forEach(a => { const l = kutu[a.sayfa + "|" + a.unite]; if (!l) return; const gun = gunOf(a.zaman); if (gun) l.forEach(x => cevaplar.push({ unite: x.unite, ders: x.ders, gun })); });
    const denemeler = q.denemeler.all(uid).map(e => ({ kod: e.kod, tam: /^ts-/.test(String(e.istemci_id || "")), gun: gunOf(e.tarih) })).filter(e => e.gun);
    const frq = q.frq.all(uid).map(f => ({ ders: f.ders, gun: gunOf(f.created) })).filter(f => f.gun);
    return { cevaplar, denemeler, frq };
  }

  const satirGorev = r => { let v = {}; try { v = JSON.parse(r.veri); } catch (e) { /* bozuk */ } return Object.assign(v, { id: r.id, hafta: r.hafta, ilkHafta: r.ilk_hafta, tamam: !!r.tamam, manuel: !!r.manuel, devir: r.ilk_hafta < r.hafta }); };

  /**
   * Planı hesaplar. yaz: false → veritabanına hiçbir şey yazılmaz (veli paneli / önizleme).
   */
  function hesapla(uid, secenek) {
    secenek = secenek || {};
    const yaz = secenek.yaz !== false;
    const simdiMs = saatF();
    const g = girdiler(uid, simdiMs);
    const cur = M.pazartesi(g.bugun);
    const ayar = q.ayar.get(uid) || null;
    const saat = M.saatNormal(ayar ? ayar.saat : M.VARSAYILAN_SAAT);
    const imza = g.imza + "|" + saat;
    const secili = new Set(g.dersler.map(d => d.ders));
    const ol = olaylar(uid, g);
    const z = new Date(simdiMs).toISOString();
    let satirlar = q.gorevler.all(uid);
    // 1) otomatik işaret: etkinlikle biten görevler (elle değiştirilmemişse)
    satirlar.forEach(r => {
      if (r.tamam || r.manuel) return;
      if (M.tamamMi(satirGorev(r), ol)) { r.tamam = 1; if (yaz) q.otoTamam.run(z, uid, r.id); }
    });
    const temelGirdi = { bugun: g.bugun, saat, dersler: g.dersler, kilometre: kilometreTaslari(g.tk) };
    let plan;
    const dondu = ayar && ayar.hafta === cur && ayar.imza === imza;
    if (dondu) {
      plan = M.planla(Object.assign({}, temelGirdi, { buHafta: satirlar.filter(r => r.hafta === cur).map(satirGorev), yenile: false }));
    } else {
      // Bu haftayı (yeniden) kur: ayar/profil değiştiyse bu haftanın elle dokunulmamış, bitmemiş yeni görevleri silinir;
      // seçimden çıkan derslerin bitmemiş görevleri de düşer. Geçmiş haftaların bitmemiş görevleri devreder.
      const yenidenKur = ayar && ayar.hafta === cur && ayar.imza !== imza;
      const silinecek = satirlar.filter(r => !r.tamam && ((yenidenKur && r.ilk_hafta === cur && !r.manuel) || !secili.has(satirGorev(r).ders)));
      const silSet = new Set(silinecek.map(r => r.id));
      satirlar = satirlar.filter(r => !silSet.has(r.id));
      const kalan = satirlar.filter(r => r.hafta === cur).map(satirGorev);
      const devreden = satirlar.filter(r => r.hafta < cur && !r.tamam).map(satirGorev);
      plan = M.planla(Object.assign({}, temelGirdi, { buHafta: kalan, devreden, yenile: true }));
      if (yaz) {
        require("./db").islem(db, () => {
          silinecek.forEach(r => q.gorevSil.run(uid, r.id));
          const h0 = plan.haftalar[0];
          if (h0 && h0.bas === cur) h0.gorevler.forEach(t => {
            const var_ = satirlar.filter(r => r.id === t.id)[0];
            if (var_) { if (var_.hafta !== cur) q.gorevTasi.run(cur, uid, t.id); }
            else {
              const v = Object.assign({}, t); delete v.tamam; delete v.manuel; delete v.devir; delete v.hafta; delete v.ilkHafta;
              q.gorevEkle.run(uid, t.id, cur, t.ilkHafta || cur, JSON.stringify(v), z);
            }
          });
          q.ayarEkle.run(uid, saat, cur, imza, ayar ? ayar.created : z, z);
        });
        satirlar = q.gorevler.all(uid);
        plan = M.planla(Object.assign({}, temelGirdi, { buHafta: satirlar.filter(r => r.hafta === cur).map(satirGorev), yenile: false }));
      }
    }
    // 2) durum: geçmiş haftalar tam, bu hafta haftanın gününe göre orantılı beklenir
    const gecmis = satirlar.filter(r => r.ilk_hafta < cur), bu = satirlar.filter(r => r.ilk_hafta === cur);
    const bh = plan.haftalar[0];
    const buToplam = dondu || yaz ? bu.length : (bh ? bh.gorevler.filter(t => !t.devir).length : 0);
    // plan bu hafta başladıysa beklenti başladığı günden ölçülür (Çarşamba açan öğrenci geride başlamaz)
    const ay2 = q.ayar.get(uid), ilkGun = ay2 && gunOf(ay2.created) > cur ? gunOf(ay2.created) : cur;
    const durum = M.durum({ gorevSayisi: plan.gorevSayisi, haftaGunu: Math.max(0, M.gunFark(ilkGun, g.bugun)), haftaUzunluk: 7 - M.gunFark(cur, ilkGun),
      gecmisPlanlanan: gecmis.length, gecmisTamam: gecmis.filter(r => r.tamam).length,
      buHaftaToplam: buToplam, buHaftaTamam: bu.filter(r => r.tamam).length });
    const enYakin = plan.sinavlar.filter(s => !s.kesin || s.kalanGun >= 0)[0] || null;
    return {
      bugun: g.bugun, buHafta: cur, saat, saatler: M.SAATLER, gorevSayisi: plan.gorevSayisi, premium: g.premium,
      bos: plan.bos || null, durum, enYakin, sinavlar: plan.sinavlar, haftalar: plan.haftalar,
      dersler: g.dersler.map(d => ({ ders: d.ders, ad: d.ad, tamAd: d.tamAd, hedef: d.hedef, link: d.link, uniteSayisi: d.uniteler.length,
        kilitliUnite: d.uniteler.filter(u => u.kilitli).length })),
      kaynak: { takvim: (g.tk && g.tk.guncelleme) || null }
    };
  }

  function saatKaydet(uid, saat) {
    if (M.SAATLER.indexOf(+saat) < 0) throw new HttpHata(400, "Haftalık süre 3, 5, 8 ya da 12 saat olmalı.", { saat: "Geçersiz süre." });
    const a = q.ayar.get(uid), z = new Date(saatF()).toISOString();
    // imza saat içerir: bir sonraki hesaplamada bu haftanın elle dokunulmamış görevleri yeni süreye göre yeniden kurulur
    q.ayarEkle.run(uid, +saat, a ? a.hafta : null, a ? a.imza : null, a ? a.created : z, z);
  }
  function gorevIsaretle(uid, id, tamam) {
    const r = q.gorev.get(uid, String(id || "").slice(0, 200));
    if (!r) throw new HttpHata(404, "Görev bulunamadı. Planı yenileyip tekrar dene.");
    q.elle.run(tamam ? 1 : 0, tamam ? new Date(saatF()).toISOString() : null, uid, r.id);
    return { id: r.id, tamam: !!tamam };
  }
  return { hesapla, saatKaydet, gorevIsaretle };
}

function planRotalari(r, c) {
  const { db, hesap, oturumGerekli, denetim } = c;
  const s = planServisi(db, { hesap, saat: c.saat });
  const ozel = res => res.setHeader("Cache-Control", "private, no-store");
  r.get("/api/plan", (req, res) => { oturumGerekli(req); ozel(res); return { ok: true, plan: s.hesapla(req.kullanici.id) }; });
  r.put("/api/plan/ayar", (req, res) => {
    oturumGerekli(req); ozel(res);
    s.saatKaydet(req.kullanici.id, req.body && req.body.saat);
    if (denetim) denetim({ eylem: "plan.ayar", kullanici: req.kullanici.id, istek: req, ayrinti: { saat: +req.body.saat } });
    return { ok: true, plan: s.hesapla(req.kullanici.id) };
  });
  r.post("/api/plan/gorev/:id", (req, res) => {
    oturumGerekli(req); ozel(res);
    const b = req.body || {};
    if (typeof b.tamam !== "boolean") throw new HttpHata(400, "tamam alanı true ya da false olmalı.");
    const gorev = s.gorevIsaretle(req.kullanici.id, req.params.id, b.tamam);
    return { ok: true, gorev, plan: s.hesapla(req.kullanici.id) };
  });
  return s;
}

/**
 * Veli paneli için salt okunur özet (veritabanına yazmaz). Dönüş: { durum, enYakin, buHafta: { bas, bit, gorevler: [{ baslik, turAd, dersAd, tamam }] } }
 * Kullanım (server/veli.js içinden): require("./plan").veliPlanOzeti(db, hesap, ogrenciId)
 */
function veliPlanOzeti(db, hesap, uid, simdi) {
  const p = planServisi(db, { hesap, saat: simdi ? () => +simdi : undefined }).hesapla(uid, { yaz: false });
  const h = p.haftalar[0] || null;
  return { durum: p.durum, enYakin: p.enYakin, bos: p.bos, saat: p.saat,
    buHafta: h ? { bas: h.bas, bit: h.bit, evre: h.evre, gorevler: h.gorevler.map(g => ({ baslik: g.baslik, turAd: g.turAd, dersAd: g.dersAd, tamam: !!g.tamam })) } : null };
}

module.exports = { planServisi, planRotalari, veliPlanOzeti, dersUniteleri, kilometreTaslari, adNumaralari };
