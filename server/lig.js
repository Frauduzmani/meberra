"use strict";
// Haftalık lig: isteğe bağlı katılım, yalnızca takma ad görünür. XP sunucuda cevap/deneme tablolarından hesaplanır.
// Hafta: ISO hafta, pazartesi 00:00 (Europe/Istanbul). Gruplar kademe başına en fazla 30 kişi; haftanın ilk
// görüntülenmesinde tembel (lazy) kurulur. Hafta kapanınca (tembel ya da zamanlayıcıda) ilk 5 yükselir, son 5 düşer.
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const zaman = require("./zaman");

const KADEMELER = ["Bronz", "Gümüş", "Altın", "Elmas", "Şampiyon"];
const XP = { soru: 5, dogru: 5, deneme: 50 };
const KURAL = { grupBoyu: 30, yukselen: 5, dusen: 5, enAzGrup: 10 };
const kademeAd = k => KADEMELER[k - 1] || "Bronz";

// --- takma ad denetimi ---------------------------------------------------------------
const TAKMA_RE = /^[A-Za-z0-9_ÇĞİÖŞÜçğıöşü]{3,20}$/;
const TR_ASCII = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", 9: "g" };
function normal(s) {
  return String(s).toLocaleLowerCase("tr-TR").replace(/[çğıöşüâîû]/g, c => TR_ASCII[c]).replace(/[0-9]/g, c => LEET[c] || c);
}
const tekille = s => s.replace(/(.)\1+/g, "$1");
// Küçük ve basit bir liste (çocuk kullanıcılar): alt dize olarak aranır (harf tekrarı ve rakam hilesi normalleştirilir)
const YASAK_ALT = [
  "orospu", "orosbu", "siktir", "sikerim", "sikis", "sikik", "yarrak", "amcik", "amcuk", "aminako", "aminak", "gotveren", "gotlek", "kahpe",
  "pezevenk", "ibne", "serefsiz", "gavat", "kaltak", "surtuk", "fahise", "dalyarak", "pust", "gerizekali", "aptal", "salak", "kancik",
  "fuck", "shit", "bitch", "cunt", "asshole", "nigger", "nigga", "faggot", "whore", "slut", "porn", "dick", "pussy", "bastard",
  "hitler", "nazi", "pedofil", "pedo",
  "admin", "meberra", "yonetici", "moderator", "destek", "sistem"
].map(x => tekille(normal(x)));
// Kısa kelimeler yalnızca tam parça olarak (alt çizgiyle ayrılmış) yasak: "amk" yasak, "amkara" değil
const YASAK_TAM = ["amk", "amq", "aq", "awk", "oc", "pic", "sik", "got", "mal", "ass", "sex", "fck", "wtf", "kys"].map(normal);

function takmaAdTemiz(ad) {
  const s = String(ad == null ? "" : ad).trim();
  if (!TAKMA_RE.test(s)) throw new HttpHata(400, "Takma ad 3–20 karakter olmalı; yalnızca harf, rakam ve alt çizgi (_) kullan.", { takmaAd: "3–20 karakter: harf, rakam, _" });
  const n = normal(s), parcali = n.split("_").filter(Boolean), duz = tekille(n.replace(/_/g, ""));
  if (YASAK_ALT.some(y => duz.includes(y)) || parcali.some(p => YASAK_TAM.indexOf(p) >= 0 || YASAK_TAM.indexOf(tekille(p)) >= 0) || YASAK_TAM.indexOf(duz) >= 0)
    throw new HttpHata(400, "Bu takma ad kullanılamaz. Başka bir ad dene.", { takmaAd: "Bu takma ad kullanılamaz." });
  return { ad: s, anahtar: s.toLocaleLowerCase("tr-TR") };
}

function ligServisi(db, bildirim, denetim) {
  const q = {
    uye: db.prepare("SELECT * FROM lig_uyeleri WHERE user_id = ?"),
    anahtar: db.prepare("SELECT user_id FROM lig_uyeleri WHERE takma_anahtar = ?"),
    uyeEkle: db.prepare(`INSERT INTO lig_uyeleri (user_id, takma_ad, takma_anahtar, kademe, durum, katilma, guncelleme) VALUES (?, ?, ?, 1, 'aktif', ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET takma_ad = excluded.takma_ad, takma_anahtar = excluded.takma_anahtar, durum = 'aktif', guncelleme = excluded.guncelleme`),
    yer: db.prepare("SELECT * FROM lig_haftalik WHERE hafta = ? AND user_id = ?"),
    yerEkle: db.prepare("INSERT OR IGNORE INTO lig_haftalik (hafta, user_id, kademe, grup) VALUES (?, ?, ?, ?)"),
    yerSil: db.prepare("DELETE FROM lig_haftalik WHERE hafta = ? AND user_id = ?"),
    grupBos: db.prepare("SELECT grup, COUNT(*) AS n FROM lig_haftalik WHERE hafta = ? AND kademe = ? GROUP BY grup HAVING n < ? ORDER BY grup LIMIT 1"),
    grupMax: db.prepare("SELECT COALESCE(MAX(grup), 0) AS g FROM lig_haftalik WHERE hafta = ? AND kademe = ?"),
    grup: db.prepare(`SELECT h.*, u.takma_ad, u.durum AS uye_durum FROM lig_haftalik h JOIN lig_uyeleri u ON u.user_id = h.user_id
      WHERE h.hafta = ? AND h.kademe = ? AND h.grup = ?`),
    yerlesmemis: db.prepare(`SELECT u.user_id, u.kademe FROM lig_uyeleri u JOIN users k ON k.id = u.user_id
      WHERE u.durum IN ('aktif', 'gizli') AND k.durum = 'aktif' AND NOT EXISTS (SELECT 1 FROM lig_haftalik h WHERE h.hafta = ? AND h.user_id = u.user_id)
      ORDER BY u.kademe, u.katilma, u.user_id`),
    acikHaftalar: db.prepare("SELECT DISTINCT hafta FROM lig_haftalik WHERE hafta < ? AND hafta NOT IN (SELECT hafta FROM lig_haftalar) ORDER BY hafta"),
    kapat: db.prepare("INSERT OR IGNORE INTO lig_haftalar (hafta, kapanis) VALUES (?, ?)"),
    sonSonuc: db.prepare("SELECT hafta, sonuc, kademe, xp FROM lig_haftalik WHERE user_id = ? AND sonuc IS NOT NULL ORDER BY hafta DESC LIMIT 1")
  };

  /** userIds için [bas, bit) aralığında XP: cevap 5, doğru +5, biten deneme 50 */
  function xpHesapla(userIds, aralik) {
    const m = new Map(userIds.map(id => [id, 0]));
    if (!userIds.length) return m;
    for (let i = 0; i < userIds.length; i += 500) {
      const parca = userIds.slice(i, i + 500), yer = parca.map(() => "?").join(",");
      db.prepare(`SELECT user_id, COUNT(*) AS n, COALESCE(SUM(dogru), 0) AS d FROM answers WHERE zaman >= ? AND zaman < ? AND user_id IN (${yer}) GROUP BY user_id`)
        .all(aralik.bas, aralik.bit, ...parca).forEach(r => m.set(r.user_id, m.get(r.user_id) + r.n * XP.soru + r.d * XP.dogru));
      db.prepare(`SELECT user_id, COUNT(*) AS n FROM exams WHERE tarih >= ? AND tarih < ? AND user_id IN (${yer}) GROUP BY user_id`)
        .all(aralik.bas, aralik.bit, ...parca).forEach(r => m.set(r.user_id, m.get(r.user_id) + r.n * XP.deneme));
    }
    return m;
  }

  function yerlestir(hafta, userId, kademe) {
    if (q.yer.get(hafta, userId)) return;
    const b = q.grupBos.get(hafta, kademe, KURAL.grupBoyu);
    q.yerEkle.run(hafta, userId, kademe, b ? b.grup : q.grupMax.get(hafta, kademe).g + 1);
  }
  /** Haftanın grupları: henüz yerleşmemiş tüm aktif üyeler kademelerine göre 30'luk gruplara dağıtılır */
  function haftaHazirla(hafta) {
    islem(db, () => { q.yerlesmemis.all(hafta).forEach(u => yerlestir(hafta, u.user_id, u.kademe)); });
  }

  /** Bir haftayı kapatır (bir kez): XP kesinleşir, yükselme/düşme uygulanır, üyelere bildirim gider. */
  function haftaKapat(hafta) {
    const bildirimler = [];
    islem(db, () => {
      if (Number(q.kapat.run(hafta, simdi()).changes) !== 1) return;
      const satirlar = db.prepare(`SELECT h.*, u.durum AS uye_durum FROM lig_haftalik h JOIN lig_uyeleri u ON u.user_id = h.user_id WHERE h.hafta = ?`).all(hafta);
      const xp = xpHesapla(satirlar.map(s => s.user_id), zaman.haftaAraligi(hafta));
      const gruplar = new Map();
      satirlar.forEach(s => {
        s.xp = xp.get(s.user_id) || 0;
        const k = s.kademe + ":" + s.grup;
        if (!gruplar.has(k)) gruplar.set(k, []);
        gruplar.get(k).push(s);
      });
      for (const liste of gruplar.values()) {
        const aktif = liste.filter(s => s.uye_durum !== "ayrildi").sort((a, b) => b.xp - a.xp || a.user_id - b.user_id);
        const sonuc = new Map();
        if (aktif.length >= KURAL.enAzGrup) {
          aktif.slice(0, KURAL.yukselen).forEach(s => { if (s.xp > 0 && s.kademe < KADEMELER.length) sonuc.set(s.user_id, "yukseldi"); });
          aktif.slice(-KURAL.dusen).forEach(s => { if (!sonuc.has(s.user_id) && s.kademe > 1) sonuc.set(s.user_id, "dustu"); });
        }
        liste.forEach(s => {
          const so = sonuc.get(s.user_id) || "kaldi";
          const yeniKademe = so === "yukseldi" ? s.kademe + 1 : so === "dustu" ? s.kademe - 1 : s.kademe;
          db.prepare("UPDATE lig_haftalik SET xp = ?, sonuc = ? WHERE hafta = ? AND user_id = ?").run(s.xp, so, hafta, s.user_id);
          if (so !== "kaldi") db.prepare("UPDATE lig_uyeleri SET kademe = ?, guncelleme = ? WHERE user_id = ?").run(yeniKademe, simdi(), s.user_id);
          if (s.uye_durum !== "ayrildi") bildirimler.push({ userId: s.user_id, so, xp: s.xp, kademe: yeniKademe });
        });
      }
    });
    bildirimler.forEach(b => {
      const ad = kademeAd(b.kademe);
      const metin = b.so === "yukseldi"
        ? { baslik: "Tebrikler! " + ad + " ligine yükseldin", metin: "Geçen hafta " + b.xp + " XP topladın ve grubunda ilk 5'e girdin. Yeni haftada başarılar!" }
        : b.so === "dustu"
          ? { baslik: "Yeni hafta, yeni fırsat", metin: "Bu hafta " + ad + " liginde devam ediyorsun. Çözdüğün her soru seni yeniden yukarı taşır." }
          : { baslik: "Haftalık lig sonuçlandı", metin: "Geçen hafta " + b.xp + " XP topladın. " + ad + " liginde yeni hafta başladı!" };
      bildirim.olustur(b.userId, { tur: "lig", baslik: metin.baslik, metin: metin.metin, link: "/profil#lig" });
    });
    return bildirimler.length;
  }

  /** Geçmiş ve kapanmamış haftaları kapatır (tembel devir; zamanlayıcı da çağırır). */
  function devir(simdiMs) {
    const h = zaman.hafta(simdiMs);
    let n = 0;
    q.acikHaftalar.all(h).forEach(r => { n += haftaKapat(r.hafta); });
    return n;
  }

  function durum(u, simdiMs) {
    simdiMs = simdiMs == null ? Date.now() : simdiMs;
    devir(simdiMs);
    const hafta = zaman.hafta(simdiMs), aralik = zaman.haftaAraligi(hafta);
    const uye = q.uye.get(u.id);
    const temel = {
      ok: true, hafta, bitis: aralik.bit, kalanSn: Math.max(0, Math.round((Date.parse(aralik.bit) - simdiMs) / 1000)),
      kurallar: { xp: XP, grupBoyu: KURAL.grupBoyu, yukselen: KURAL.yukselen, dusen: KURAL.dusen, enAzGrup: KURAL.enAzGrup, kademeler: KADEMELER }
    };
    if (!uye || uye.durum === "ayrildi") return Object.assign(temel, { katildi: false, uye: uye ? { takmaAd: uye.takma_ad, kademe: uye.kademe, kademeAd: kademeAd(uye.kademe), durum: uye.durum } : null, grup: null, benimXp: null, sonSonuc: null });
    haftaHazirla(hafta);
    const yer = q.yer.get(hafta, u.id);
    const uyeler = yer ? q.grup.all(hafta, yer.kademe, yer.grup).filter(s => s.uye_durum !== "ayrildi") : [];
    const xp = xpHesapla(uyeler.map(s => s.user_id), aralik);
    const siralama = uyeler.map(s => ({ userId: s.user_id, takmaAd: s.uye_durum === "gizli" ? "Gizli üye" : s.takma_ad, xp: xp.get(s.user_id) || 0 }))
      .sort((a, b) => b.xp - a.xp || a.userId - b.userId)
      .map((s, i) => ({ sira: i + 1, takmaAd: s.takmaAd, xp: s.xp, ben: s.userId === u.id }));
    const son = q.sonSonuc.get(u.id);
    return Object.assign(temel, {
      katildi: true,
      uye: { takmaAd: uye.takma_ad, kademe: uye.kademe, kademeAd: kademeAd(uye.kademe), durum: uye.durum,
        uyari: uye.durum === "gizli" ? "Takma adın gizlendi. Lütfen yeni bir takma ad seç." : null },
      grup: yer ? { no: yer.grup, kademe: yer.kademe, kademeAd: kademeAd(yer.kademe), uyeSayisi: siralama.length, siralama } : null,
      benimXp: xp.get(u.id) || 0,
      sonSonuc: son ? { hafta: son.hafta, sonuc: son.sonuc, kademe: son.kademe, kademeAd: kademeAd(son.kademe), xp: son.xp } : null
    });
  }

  function katil(u, takmaAd, req, simdiMs) {
    const t = takmaAdTemiz(takmaAd);
    islem(db, () => {
      const sahip = q.anahtar.get(t.anahtar);
      if (sahip && sahip.user_id !== u.id) throw new HttpHata(409, "Bu takma ad alınmış. Başka bir ad dene.", { takmaAd: "Bu takma ad alınmış." });
      const z = simdi();
      q.uyeEkle.run(u.id, t.ad, t.anahtar, z, z);
    });
    denetim({ eylem: "lig.katil", kullanici: u.id, istek: req, ayrinti: { takmaAd: t.ad } });
    return durum(u, simdiMs);
  }

  function ayril(u, req, simdiMs) {
    const uye = q.uye.get(u.id);
    if (!uye || uye.durum === "ayrildi") throw new HttpHata(409, "Ligde değilsin.");
    islem(db, () => {
      db.prepare("UPDATE lig_uyeleri SET durum = 'ayrildi', guncelleme = ? WHERE user_id = ?").run(simdi(), u.id);
      q.yerSil.run(zaman.hafta(simdiMs == null ? Date.now() : simdiMs), u.id);
    });
    denetim({ eylem: "lig.ayril", kullanici: u.id, istek: req });
    return durum(u, simdiMs);
  }

  /** Yönetici görünümü: haftanın tüm grupları (gerçek adlarla) */
  function yonetici(hafta, simdiMs) {
    simdiMs = simdiMs == null ? Date.now() : simdiMs;
    devir(simdiMs);
    const h = /^\d{4}-W\d{2}$/.test(String(hafta || "")) ? hafta : zaman.hafta(simdiMs);
    const satirlar = db.prepare(`SELECT h.*, l.takma_ad, l.durum AS uye_durum, l.kademe AS simdiki_kademe, u.public_id, u.ad, u.soyad
      FROM lig_haftalik h JOIN lig_uyeleri l ON l.user_id = h.user_id JOIN users u ON u.id = h.user_id WHERE h.hafta = ? ORDER BY h.kademe DESC, h.grup`).all(h);
    const kapali = !!db.prepare("SELECT 1 FROM lig_haftalar WHERE hafta = ?").get(h);
    const xp = kapali ? null : xpHesapla(satirlar.map(s => s.user_id), zaman.haftaAraligi(h));
    const gruplar = [];
    satirlar.forEach(s => {
      let g = gruplar.find(x => x.kademe === s.kademe && x.grup === s.grup);
      if (!g) { g = { kademe: s.kademe, kademeAd: kademeAd(s.kademe), grup: s.grup, uyeler: [] }; gruplar.push(g); }
      g.uyeler.push({ userId: s.user_id, kullaniciId: s.public_id, ad: s.ad, soyad: s.soyad, takmaAd: s.takma_ad, durum: s.uye_durum, xp: xp ? xp.get(s.user_id) || 0 : s.xp, sonuc: s.sonuc });
    });
    gruplar.forEach(g => g.uyeler.sort((a, b) => b.xp - a.xp));
    const uyeSayisi = db.prepare("SELECT durum, COUNT(*) AS n FROM lig_uyeleri GROUP BY durum").all().reduce((o, r) => { o[r.durum] = r.n; return o; }, {});
    return { ok: true, hafta: h, kapandi: kapali, gruplar, uyeSayisi, haftalar: db.prepare("SELECT DISTINCT hafta FROM lig_haftalik ORDER BY hafta DESC LIMIT 12").all().map(r => r.hafta) };
  }

  return { durum, katil, ayril, devir, haftaKapat, haftaHazirla, xpHesapla, yonetici, takmaAdTemiz };
}

function ligRotalari(r, c) {
  const { lig, oturumGerekli, yoneticiGerekli } = c;
  r.get("/api/lig", req => { oturumGerekli(req); return lig.durum(req.kullanici); });
  r.post("/api/lig/katil", req => { oturumGerekli(req); return lig.katil(req.kullanici, (req.body || {}).takmaAd, req); });
  r.post("/api/lig/ayril", req => { oturumGerekli(req); return lig.ayril(req.kullanici, req); });
  r.get("/api/admin/lig", req => { yoneticiGerekli(req); return lig.yonetici(req.sorgu.get("hafta")); });
}

module.exports = { ligServisi, ligRotalari, takmaAdTemiz, KADEMELER, XP, KURAL };
