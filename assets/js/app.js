/**
 * Meberra — ortak istemci uygulaması: oturum koruması, sunucu senkronu (MEBERRA_SYNC), menü,
 * Bugün ekranı yardımcıları, ünite görünümü ve Premium kilitleri, soru motoru, ilerleme ve yedekleme.
 *
 * v2 (Ajan 11 — Frontend & UX): tema (açık/koyu), ortak gezinme menüsü (tüm
 * sayfalara JS ile enjekte edilir), kalıcı soru bankası ilerlemesi + Yanlışlarım
 * (localStorage), klavye ile şık seçimi ve aria-live geri bildirim.
 */

// ==========================================================================
// 0. GÜVENLİ DEPOLAMA, TEMA, ORTAK GEZİNME
// ==========================================================================
const APMEBERRA_KEYS = {
  theme: "apmeberra:theme",
  progress: "apmeberra:quiz:v1",
  errors: "apmeberra:errors:v1",
  lastBackup: "apmeberra:lastBackup",
  seviye: "apmeberra:seviye:v1",
  deneme: "apmeberra:deneme:v1",   // Tur 5: deneme geçmişi (şema deneme ajanına ait)
  panel: "apmeberra:panel:v1",     // Tur 5: yol haritası durumu (Ajan 11)
  rota: "apmeberra:rota:v1"        // Tur 6: rota adım/belge işaretleri (Ajan 11)
};

function apStoreGet(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function apStoreSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}
function apStoreRemove(key) {
  try { window.localStorage.removeItem(key); } catch (e) { /* yok say */ }
}

// --- Kod adı taşıması (Tur 10, 14 Ekim 2026): eski "apazra" anahtarları -> "apmeberra" ---------------
// Tek yerde, her sayfada ilk depolama okumasından önce çalışır (app.js tüm sayfalarda yüklenir).
// Kural: eski anahtar varsa ve yeni anahtar YOKSA değer kopyalanır (yeni anahtar varsa ona dokunulmaz).
// Hesap kasaları (…:veri:<id>) ve sahipsiz veri içindeki anahtar adları da yeni öneke çevrilir.
// Her kopya geri okunarak doğrulanır; hepsi başarılıysa eski anahtarlar silinir ve sürüm işareti yazılır.
// Bir hata olursa (ör. depolama dolu) eski anahtarlar silinmez; bir sonraki açılışta yeniden denenir.
// İşaret anahtarı "apmeberra-tasima" canlı veri önekinin ("apmeberra:") dışındadır: kişi verisi takasına girmez.
const APMEBERRA_TASIMA = Object.freeze({
  isaret: "apmeberra-tasima",
  surum: "1",
  onekler: [["apazra:", "apmeberra:"], ["apazra-hesap:", "apmeberra-hesap:"]] // ad-denetimi izin listesinde
});
function apMeberraTasima(ls) {
  const out = { tasinan: 0, silinen: 0, atlanan: 0, tamam: false };
  try {
    ls = ls || window.localStorage;
    if (ls.getItem(APMEBERRA_TASIMA.isaret) === APMEBERRA_TASIMA.surum) { out.tamam = true; return out; }
    const yeniAd = k => { for (const [e, y] of APMEBERRA_TASIMA.onekler) if (k.indexOf(e) === 0) return y + k.slice(e.length); return null; };
    // Kasa / sahipsiz veri içindeki { anahtarlar: { "apazra:…": … } } adlarını çevirir
    const icCevir = raw => {
      try {
        const v = JSON.parse(raw);
        if (!v || typeof v !== "object" || !v.anahtarlar || typeof v.anahtarlar !== "object") return raw;
        const yeni = {};
        Object.keys(v.anahtarlar).forEach(k => { const y = yeniAd(k) || k; if (!(y in yeni) || y === k) yeni[y] = v.anahtarlar[k]; });
        v.anahtarlar = yeni;
        return JSON.stringify(v);
      } catch (e) { return raw; }
    };
    const eski = [];
    for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && yeniAd(k)) eski.push(k); }
    let hata = false;
    eski.forEach(k => {
      const y = yeniAd(k);
      if (ls.getItem(y) !== null) { out.atlanan++; return; }
      let deger = ls.getItem(k);
      if (/^apmeberra-hesap:v1:(veri:|sahipsiz$)/.test(y)) deger = icCevir(deger);
      try { ls.setItem(y, deger); } catch (e) { hata = true; return; }
      if (ls.getItem(y) === deger) out.tasinan++; else hata = true;
    });
    if (!hata) {
      eski.forEach(k => { ls.removeItem(k); out.silinen++; });
      ls.setItem(APMEBERRA_TASIMA.isaret, APMEBERRA_TASIMA.surum);
      out.tamam = true;
    }
  } catch (e) { /* depolama kapalı: taşınacak bir şey yok */ }
  return out;
}
window.APMEBERRA_TASIMA_SONUC = apMeberraTasima();

// --- Tema: kullanıcı seçimi varsa data-theme, yoksa sistem tercihi (CSS) ---
(function applyStoredThemeEarly() {
  try {
    const t = window.localStorage.getItem(APMEBERRA_KEYS.theme);
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) { /* localStorage kapalı olabilir */ }
})();

// --- Oturum koruması (Tur 5) ---------------------------------------------
// app.js tüm sayfalarda yüklendiği için koruma burada, eşzamanlı yapılır.
// styles.css, html[data-apz-auth] işaretlenene kadar <body>'yi gizler; böylece
// yönlendirilecek sayfanın içeriği bir an görünüp kaybolmaz. (app.js hiç
// yüklenemezse CSS 4 sn sonra sayfayı yine de gösterir.)
// Hesap mantığı (kayıt, giriş, takas) auth.js'tedir; burada yalnızca okunur.
const APMEBERRA_ACCOUNT_KEYS = {
  users: "apmeberra-hesap:v1:kullanicilar",
  session: "apmeberra-hesap:v1:oturum",
  active: "apmeberra-hesap:v1:aktif",
  profilePrefix: "apmeberra-hesap:v1:profil:"
};
// --- Sayfa bazında erişim (Tur 10, Karar K4) ---------------------------------
// AÇIK sayfalar giriş yapmadan görülür (ülke şartları ve genel bilgi). Listede OLMAYAN her sayfa
// kilitlidir (kişisel koçluk: ders, soru, deneme, seviye testi, ilerleme, rota, yazışmalar).
// Bu yerel (localStorage) bir oturumdur: güvenlik değil, ürün ayrımıdır. Sunucuya geçişte aynı
// liste sunucu tarafındaki yetkilendirmeye taşınır; tek kaynak burasıdır (bkz. auth.js adaptörü).
const APMEBERRA_ACIK_SAYFALAR = Object.freeze([
  "giris", "sartlar", "mezun", "almanya-muhendislik", "italya-muhendislik", "universiteler",
  "sinavlar", "istanbul-sinav-rehberi", "bilgi-merkezi",
  // Meberra ürün sayfaları: tanıtım, fiyatlar, şifre sıfırlama ve yasal metinler
  "vitrin", "fiyatlar", "sifre-sifirla", "kvkk", "gizlilik", "kosullar", "mesafeli-satis", "cerez"
]);
/** Oturumsuz ziyaretçinin açık giriş noktası (index.html'e oturumsuz gelen buraya gider). */
const APMEBERRA_ACIK_GIRIS = "vitrin.html";
function apSayfaAcik(page) { return APMEBERRA_ACIK_SAYFALAR.indexOf(String(page || "")) >= 0; }
window.APMEBERRA_ACIK_SAYFALAR = APMEBERRA_ACIK_SAYFALAR;

// --- Tur 11 (karar D5): öğrenci modeli ve 15 ülke -------------------------------------------
// Aynı listeler sartlar-motor.js (ULKE_KODLARI, MODELLER) ve auth.js'te de var; app.js her sayfada yüklendiği için
// menü süzgeci ve profil okuma burada da yapılır. Değişiklik üç dosyada birlikte yapılmalı (profil-v2-birim-test denetler).
const APMEBERRA_MODELLER = ["lise", "lise-mezun", "uni-mezun"];
const APMEBERRA_MODEL_AD = { "lise": "Lise öğrencisi", "lise-mezun": "Lise mezunu", "uni-mezun": "Üniversite mezunu" };
const APMEBERRA_ULKE_ADLARI = { de: "Almanya", it: "İtalya", at: "Avusturya", ch: "İsviçre", nl: "Hollanda", be: "Belçika", fr: "Fransa", es: "İspanya", se: "İsveç", fi: "Finlandiya", dk: "Danimarka", ie: "İrlanda", hu: "Macaristan", pl: "Polonya", cz: "Çekya" };
/**
 * Eski profil kaydını OKUMA anında yeni şemaya taşır (plan §4.3); depoya yazmaz. auth.js profilNormallestir ile aynı kural:
 * ogrenciModeli yoksa sinif "mezun" -> lise-mezun, 9–12 -> lise; egitimDili yoksa "en"; tanınmayan ülke kodları atılır;
 * sinif modelden türetilir (uni-mezun -> "lisans-mezun").
 */
function apProfilNorm(p) {
  if (!p || typeof p !== "object") return p;
  const o = Object.assign({}, p);
  if (APMEBERRA_MODELLER.indexOf(o.ogrenciModeli) < 0) {
    o.ogrenciModeli = o.sinif === "mezun" ? "lise-mezun" : (/^(9|10|11|12)$/.test(String(o.sinif || "")) ? "lise" : (o.sinif === "lisans-mezun" ? "uni-mezun" : null));
  }
  if (o.ogrenciModeli === "lise-mezun") o.sinif = "mezun";
  if (o.ogrenciModeli === "uni-mezun") o.sinif = "lisans-mezun";
  if (o.egitimDili !== "en" && o.egitimDili !== "yerel") o.egitimDili = "en";
  if (Array.isArray(o.ulkeler)) o.ulkeler = o.ulkeler.filter((u, i, a) => APMEBERRA_ULKE_ADLARI[u] && a.indexOf(u) === i);
  return o;
}
/** Profil sınıf/model etiketi: "11. sınıf" | "Lise mezunu" | "Üniversite mezunu" */
function apSinifEtiket(p) {
  p = p || {};
  if (p.ogrenciModeli === "uni-mezun" || p.sinif === "lisans-mezun") return "Üniversite mezunu";
  if (p.ogrenciModeli === "lise-mezun" || p.sinif === "mezun") return "Mezun";
  return p.sinif ? p.sinif + ". sınıf" : "";
}

const APMEBERRA_ME = (function apSessionGuard() {
  const page = apCurrentPage();
  const reveal = () => document.documentElement.setAttribute("data-apz-auth", "ok");
  let me = null;
  try {
    const ls = window.localStorage;
    const parse = k => { const r = ls.getItem(k); return r == null ? null : JSON.parse(r); };
    const s = parse(APMEBERRA_ACCOUNT_KEYS.session);
    const users = parse(APMEBERRA_ACCOUNT_KEYS.users);
    const u = s && s.id && Array.isArray(users) ? users.find(x => x && x.id === s.id) : null;
    if (u && parse(APMEBERRA_ACCOUNT_KEYS.active) === s.id) {
      me = {
        user: { id: u.id, ad: String(u.ad || ""), soyad: String(u.soyad || ""), kullaniciAdi: String(u.kullaniciAdi || ""), eposta: u.eposta || "", rol: u.rol || "ogrenci" },
        profile: apProfilNorm(parse(APMEBERRA_ACCOUNT_KEYS.profilePrefix + u.id)),
        // Sunucu modu: üyelik önbelleği (yöneticiye her şey açık)
        uyelik: parse("apmeberra-hesap:v1:uyelik") || { premium: false }
      };
      if (me.user.rol === "yonetici") me.uyelik = Object.assign({}, me.uyelik, { premium: true, yonetici: true });
    }
  } catch (e) {
    // Depolama kapalı: hesap sistemi çalışamaz; sayfa yine de açılır (giris.html uyarır)
    reveal();
    return null;
  }
  if (page !== "giris") {
    const here = (window.location.pathname.split("/").pop() || "index.html") + window.location.search + window.location.hash;
    if (!me) {
      // Oturumsuz: açık sayfa görünür; Panelim açık giriş noktasına, diğer kilitli sayfalar girişe gider
      if (apSayfaAcik(page)) { document.documentElement.setAttribute("data-apz-misafir", ""); reveal(); return null; }
      if (page === "index") { window.location.replace(APMEBERRA_ACIK_GIRIS); return null; }
      window.location.replace("giris.html?donus=" + encodeURIComponent(decodeURIComponent(here)));
      return null;
    }
    if (!(me.profile && me.profile.tamamlandi) && page !== "profil") {
      window.location.replace("profil.html");
      return me;
    }
  }
  reveal();
  return me;
})();
window.APMEBERRA_ME = APMEBERRA_ME;

// --- Meberra sunucu senkronu ----------------------------------------------------------------
// Sunucu sayfaya <meta name="meberra-api"> ekler. Bu durumda tarayıcı deposundaki her "apmeberra:*" yazımı yakalanır,
// kuyruğa alınır (kuyruk da depoda tutulur; sayfa değişse de kaybolmaz) ve toplu olarak PUT /api/state ile gönderilir.
// Sayfa açılışında oturum sunucuda doğrulanır (GET /api/me) ve başka cihazdan gelen yeni veriler çekilir.
// Mevcut sayfa kodu değişmeden çalışır: depo hâlâ eşzamanlı önbellektir, doğruluk kaynağı sunucudur.
const MEBERRA_SUNUCU = !!document.querySelector('meta[name="meberra-api"]');
// Depolama kipine göre metin/arayüz (styles.css): .yalniz-dosya yalnız dosya kipinde (file://, tarayıcı deposu), .yalniz-sunucu
// yalnız sunucu kipinde görünür. Kurtarma kodu, kullanıcı adı, "Yedek al / yükle" gibi eski yerel özellikler .yalniz-dosya taşır.
document.documentElement.classList.add(MEBERRA_SUNUCU ? "mod-sunucu" : "mod-dosya");
const MEBERRA_SYNC = (function () {
  if (!MEBERRA_SUNUCU) return null;
  let ls;
  try { ls = window.localStorage; ls.getItem("x"); } catch (e) { return null; }
  const P = "apmeberra-hesap:v1:";
  const KUYRUK = P + "kuyruk", SON_CEKME = P + "son-cekme", OTURUM = P + "oturum";
  const proto = Object.getPrototypeOf(ls);
  const setO = proto.setItem, remO = proto.removeItem;
  const izle = k => typeof k === "string" && k.indexOf("apmeberra:") === 0;
  const oturumVar = () => !!ls.getItem(OTURUM);
  let kuyruk = {};
  try { kuyruk = JSON.parse(ls.getItem(KUYRUK) || "{}") || {}; } catch (e) { kuyruk = {}; }
  let sessizMi = 0, zaman = null, suruyor = null, bekleme = 2000;
  const kuyrukYaz = () => { try { setO.call(ls, KUYRUK, JSON.stringify(kuyruk)); } catch (e) { /* depo dolu */ } };
  const basliklar = { "Content-Type": "application/json", "X-Meberra": "1" };

  function isaretle(k, v) {
    if (sessizMi || !oturumVar()) return;
    kuyruk[k] = v;
    kuyrukYaz();
    clearTimeout(zaman);
    zaman = setTimeout(gonder, 1200);
  }
  proto.setItem = function (k, v) { setO.call(this, k, v); if (this === ls && izle(k)) isaretle(k, String(v)); };
  proto.removeItem = function (k) { remO.call(this, k); if (this === ls && izle(k)) isaretle(k, null); };

  function sessiz(fn) { sessizMi++; try { return fn(); } finally { sessizMi--; } }
  function oturumBitti() {
    sessiz(() => {
      for (let i = ls.length - 1; i >= 0; i--) { const k = ls.key(i); if (k && (k.indexOf(P) === 0 || (izle(k) && k !== "apmeberra:theme"))) remO.call(ls, k); }
    });
    kuyruk = {};
    const page = apCurrentPage();
    if (page !== "giris" && !apSayfaAcik(page)) window.location.replace("giris.html?donus=" + encodeURIComponent((window.location.pathname.split("/").pop() || "index.html") + window.location.search));
  }

  /** Bekleyen değişiklikleri gönderir. Dönüş: Promise. keepalive: sayfa kapanırken (kuyruk silinmez; sonraki açılışta yeniden denenir) */
  function gonder(keepalive) {
    clearTimeout(zaman);
    if (!Object.keys(kuyruk).length || !oturumVar()) return Promise.resolve();
    if (keepalive) {
      try { fetch("/api/state", { method: "PUT", credentials: "same-origin", keepalive: true, headers: basliklar, body: JSON.stringify({ degisiklikler: kuyruk }) }); } catch (e) { /* yok say */ }
      return Promise.resolve();
    }
    if (suruyor) return suruyor.then(() => gonder());
    const paket = kuyruk;
    kuyruk = {};
    kuyrukYaz();
    suruyor = fetch("/api/state", { method: "PUT", credentials: "same-origin", headers: basliklar, body: JSON.stringify({ degisiklikler: paket }) })
      .then(r => r.json().catch(() => ({})).then(j => {
        if (r.status === 401) { oturumBitti(); return; }
        if (!r.ok) throw new Error(j.error || "senkron hatası");
        bekleme = 2000;
        // Sunucuda birleşen değer (başka cihazın cevaplarıyla) depoya yazılır; bu arada yerelde yeniden değişmediyse
        const b = j.birlesen || {};
        if (!oturumVar()) return; // bu arada çıkış yapıldıysa temizlenen depoyu yeniden doldurma
        sessiz(() => Object.keys(b).forEach(k => { if (!(k in kuyruk) && typeof b[k] === "string") setO.call(ls, k, b[k]); }));
      }))
      .catch(() => {
        Object.keys(paket).forEach(k => { if (!(k in kuyruk)) kuyruk[k] = paket[k]; });
        kuyrukYaz();
        bekleme = Math.min(bekleme * 2, 60000);
        zaman = setTimeout(gonder, bekleme);
      })
      .finally(() => { suruyor = null; });
    return suruyor;
  }
  window.addEventListener("pagehide", () => gonder(true));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") gonder(true); });
  window.addEventListener("online", () => gonder());

  // Açılış: oturumu doğrula, üyeliği tazele, başka cihazdan gelen veriyi çek, bekleyen kuyruğu gönder.
  // Çıkış sayfasında (giris.html?cikis=1) ve oturumsuz açılışta atlanır: çıkış önbelleği temizlerken bu zincir onu
  // yeniden doldurmasın. Async yazımlar da yazmadan hemen önce oturumVar() ile korunur.
  const cikisSayfasi = apCurrentPage() === "giris" && /[?&]cikis=1(?:&|#|$)/.test(window.location.search);
  if (oturumVar() && APMEBERRA_ME && !cikisSayfasi) {
    fetch("/api/me", { credentials: "same-origin" }).then(r => {
      if (r.status === 401) { oturumBitti(); return null; }
      return r.ok ? r.json() : null;
    }).then(j => {
      if (!j || !j.ok || !oturumVar()) return null;
      const oncePremium = apPremiumMu();
      sessiz(() => {
        try {
          const users = JSON.parse(ls.getItem(P + "kullanicilar") || "[]");
          if (users[0] && users[0].id === j.user.id) { users[0].rol = j.user.rol; users[0].ad = j.user.ad; users[0].soyad = j.user.soyad; setO.call(ls, P + "kullanicilar", JSON.stringify(users)); }
          setO.call(ls, P + "uyelik", JSON.stringify(j.uyelik || { premium: false }));
          if (j.profile) setO.call(ls, P + "profil:" + j.user.id, JSON.stringify(j.profile));
        } catch (e) { /* önbellek bozuksa bir sonraki girişte düzelir */ }
      });
      // Bellekteki üyeliği de tazele; premium durumu değiştiyse kilitli görünümler yeniden çizilir (sayfa yenilemeden)
      if (APMEBERRA_ME && APMEBERRA_ME.user && APMEBERRA_ME.user.id === j.user.id) {
        APMEBERRA_ME.user.rol = j.user.rol;
        APMEBERRA_ME.uyelik = Object.assign({}, j.uyelik || { premium: false }, j.user.rol === "yonetici" ? { premium: true, yonetici: true } : {});
        if (apPremiumMu() !== oncePremium) apUyelikDegisti();
      }
      return fetch("/api/state", { credentials: "same-origin" }).then(r => (r.ok ? r.json() : null));
    }).then(s => {
      if (!s || !s.ok || !oturumVar()) return;
      const son = ls.getItem(SON_CEKME) || "";
      sessiz(() => Object.keys(s.keys || {}).forEach(k => {
        const v = s.keys[k];
        if (!izle(k) || k in kuyruk || !v || v.guncelleme <= son) return;
        if (ls.getItem(k) !== v.deger) setO.call(ls, k, v.deger);
      }));
      setO.call(ls, SON_CEKME, new Date().toISOString());
      gonder();
    }).catch(() => { /* çevrimdışı: kuyruk sonra gönderilir */ });
  }

  return { gonder, sessiz, bekleyen: () => Object.keys(kuyruk).length };
})();
window.MEBERRA_SYNC = MEBERRA_SYNC;
/**
 * Premium mu? Sunucu modu dışında (tarayıcı modu) her şey açıktır. Yönetici her zaman premium.
 * Önbellekteki üyelik süresi dolmuşsa (bitis < şimdi) premium sayılmaz; /api/me tazelemesi beklenmez.
 */
function apPremiumMu() {
  if (!MEBERRA_SUNUCU) return true;
  const u = APMEBERRA_ME && APMEBERRA_ME.uyelik;
  if (!u) return false;
  if (u.yonetici) return true;
  if (!u.premium) return false;
  const b = u.bitis ? Date.parse(u.bitis) : NaN;
  return isNaN(b) || b >= Date.now();
}
window.apPremiumMu = apPremiumMu;
/** Üyelik değişti: ünite görünümünü yeniden çiz ve diğer modüllere (deneme.js) "meberra:uyelik" olayıyla haber ver. */
function apUyelikDegisti() {
  try { if (typeof apUniteGorunumuYenile === "function") apUniteGorunumuYenile(); } catch (e) { /* görünüm yoksa yok say */ }
  try { window.dispatchEvent(new CustomEvent("meberra:uyelik", { detail: { premium: apPremiumMu() } })); } catch (e) { /* eski tarayıcı */ }
}

/** Oturumdaki öğrencinin adı (yoksa boş). */
function apStudentName() { return APMEBERRA_ME && APMEBERRA_ME.user ? APMEBERRA_ME.user.ad : ""; }

function getEffectiveTheme() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
}
function apThemeLabels() {
  const lbl = getEffectiveTheme() === "dark" ? "Açık temaya geç" : "Koyu temaya geç";
  document.querySelectorAll(".theme-toggle").forEach(btn => { btn.setAttribute("aria-label", lbl); btn.title = lbl; });
}
function toggleTheme() {
  const next = getEffectiveTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { window.localStorage.setItem(APMEBERRA_KEYS.theme, next); } catch (e) { /* yok say */ }
  apThemeLabels();
}
// Tur 14: başka sekmede tema değişince bu sekme de aynı temaya geçer (seçim silinirse sistem tercihine döner).
window.addEventListener("storage", e => {
  if (e.key !== APMEBERRA_KEYS.theme && e.key !== null) return;
  let t = null;
  try { t = window.localStorage.getItem(APMEBERRA_KEYS.theme); } catch (x) { /* yok say */ }
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  else document.documentElement.removeAttribute("data-theme");
  apThemeLabels();
});

// --- Ders kayıt defteri (ilerleme ve gezinme için ortak) ---
const APMEBERRA_COURSES = [
  { page: "ap-calculus",  name: "AP Calculus AB / BC", short: "Calculus",   cls: "c-calculus" },
  { page: "ap-physics",   name: "AP Physics 1 / C",    short: "Physics",    cls: "c-physics" },
  { page: "ap-chemistry", name: "AP Chemistry",        short: "Chemistry",  cls: "c-chemistry" },
  { page: "ap-biology",   name: "AP Biology",          short: "Biology",    cls: "c-biology" },
  { page: "ap-english",   name: "AP English Language", short: "English",    cls: "c-english" },
  { page: "ap-electives", name: "AP Seçmeliler (Ekonomi & CS A)", short: "Seçmeliler", cls: "c-electives" }
];

// Menü (v4): 4 ana öğe — Bugün · Çalış · Hedefim · Ben (üniversite mezununda Çalış yerine Sınavlar).
// Ana öğe: { id, label, href?, children?, modeller? }. href + children = "bölünmüş" öğe (etiket sayfaya gider, ok düğmesi
// alt menüyü açar); yalnızca children = açılır düğme; yalnızca href = bağlantı. { group } satırı liste içi başlıktır.
// Tur 11: modeller alanı olan öğe yalnızca o öğrenci modellerinde görünür (üniversite mezununda AP araçları gizli;
// "Çalış" yerine "Sınavlar"). Etkin öğe: href'i ya da #'sız alt bağlantılarından biri bu sayfa olan ana öğe.
const AP_MODELLER = ["lise", "lise-mezun"];
const APMEBERRA_NAV = [
  { id: "bugun", href: "index.html", label: "Bugün" },
  // Tur 14 A6: Çalış merkezi (calis.html) — A1'deki geçici açılır menü kalktı; dersler, denemeler, yanlışlarım ve seviye testi
  // merkez sayfada. Ders/deneme/seviye sayfalarında da Çalış etkin görünür (etkinSayfalar).
  { id: "calis", href: "calis.html", label: "Çalış", modeller: AP_MODELLER,
    etkinSayfalar: APMEBERRA_COURSES.map(c => c.page + ".html").concat(["sinav-cents.html", "deneme.html", "seviye-testi.html", "istanbul-sinav-rehberi.html"]) },
  // Sade Hedefim (3 görünüm): Ülkem (sartlar + üniversiteler + ülke rehberleri) · Takvimim (rota + sınavlar) · Başvurularım
  { id: "hedefim", href: "sartlar.html", label: "Hedefim", mobilBaglanti: true,
    etkinSayfalar: ["universiteler.html", "sinavlar.html", "almanya-muhendislik.html", "italya-muhendislik.html", "bilgi-merkezi.html"], children: [
    { href: "sartlar.html", label: "Ülkem", desc: "Hedef ülkenin şartları ve en iyi üniversiteleri" },
    { href: "rota.html", label: "Takvimim", desc: "Tarihli adımlar ve sınav tarihleri" },
    { href: "yazismalar.html", label: "Başvurularım", desc: "Üniversitelere hazır e-posta taslakları" }
  ] },
  { id: "sinavlar", href: "sinavlar.html?model=uni-mezun", label: "Sınavlar", modeller: ["uni-mezun"] },
  { id: "ben", href: "ilerleme.html", label: "Ben", modeller: AP_MODELLER, mobilBaglanti: true, children: [
    { href: "ilerleme.html", label: "İlerleme", desc: "Ders sonuçların ve Yanlışlarım" },
    { href: "profil.html", label: "Profil ve hesap" }
  ].concat(MEBERRA_SUNUCU ? [] : [{ href: "profil.html#yedek", label: "Yedek al / yükle" }]) },
  { id: "ben", href: "profil.html", label: "Ben", modeller: ["uni-mezun"] }
];
/** Tur 11 (plan §1.2): menü öğesi bu öğrenci modeline gösterilir mi? (modeller yoksa herkese) */
function apNavUygun(item, model) { return !item || !Array.isArray(item.modeller) || !model || item.modeller.indexOf(model) >= 0; }
/**
 * Tur 14 A1: modele göre süzülmüş ana menü (saf; DOM'suz). Alt öğeleri süzer, tek alt öğesi kalan bölünmüş öğeyi düz
 * bağlantıya çevirir, boş kalan grup başlıklarını atar. Dönüş: [{id, label, href|null, children|null}]
 */
function apNavListesi(nav, model) {
  return (nav || []).filter(it => apNavUygun(it, model)).map(it => {
    if (!it.children) return Object.assign({}, it, { children: null });
    let ch = it.children.filter(c => apNavUygun(c, model));
    ch = ch.filter((c, i) => !c.group || (ch[i + 1] && !ch[i + 1].group));
    const links = ch.filter(c => !c.group);
    if (it.href && links.length <= 1) return Object.assign({}, it, { children: null });
    return Object.assign({}, it, { children: ch });
  });
}
/** Ana öğe bu sayfada etkin mi? (href ya da #'sız alt bağlantı; sorgu yok sayılır) */
function apNavEtkin(item, current) {
  const yol = h => String(h || "").split(/[?#]/)[0];
  if (item.href && yol(item.href) === current) return true;
  if (Array.isArray(item.etkinSayfalar) && item.etkinSayfalar.indexOf(current) >= 0) return true;
  return !!(item.children && item.children.some(c => c.href && c.href.indexOf("#") < 0 && yol(c.href) === current));
}

// Oturumsuz ziyaretçi menüsü (K4): yalnızca APMEBERRA_ACIK_SAYFALAR'daki sayfalar. Rehberler altbilgide (APMEBERRA_REHBERLER).
const APMEBERRA_NAV_ACIK = [
  { id: "sartlar", href: "sartlar.html", label: "Ülkeler" },
  { id: "sinavlar", href: "sinavlar.html", label: "Sınavlar" },
  { id: "fiyatlar", href: "fiyatlar.html", label: "Fiyatlar" }
];
// Tur 14 A1: Rehberler üst menüden çıktı; her sayfanın altbilgisinde (initFooterRehber) durur.
const APMEBERRA_REHBERLER = [
  { href: "almanya-muhendislik.html", label: "Almanya rehberi" },
  { href: "italya-muhendislik.html", label: "İtalya rehberi" },
  { href: "istanbul-sinav-rehberi.html", label: "İstanbul sınav rehberi", modeller: AP_MODELLER }
];

const APMEBERRA_ICONS = {
  crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/></svg>',
  caret: '<svg class="nav-caret" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 8l5 5 5-5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  // v3 ikon seti (tek çizgi kalınlığı, 24'lük ızgara, currentColor) — emoji yerine arayüz kromunda kullanılır
  check: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  cross: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  alert: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  info: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
  book: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/></svg>',
  target: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  chat: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  toc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  // Tur 14 A2: alt gezinme ikonları (24'lük ızgara, 2 px çizgi)
  bn_bugun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  bn_hedefim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  bn_calis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z"/><path d="M22 5.5A1.5 1.5 0 0 0 20.5 4H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z"/></svg>',
  bn_basvuru: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  bn_ben: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  bn_sinavlar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  bn_sartlar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  bn_universiteler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  bn_kayit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 13-6.2M19 14v6M16 17h6"/></svg>'
};

function apEsc(x) {
  return String(x == null ? "" : x).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function apInitials(u) {
  const a = (u && u.ad ? u.ad.trim()[0] : "") || "";
  const b = (u && u.soyad ? u.soyad.trim()[0] : "") || "";
  return ((a + b) || "?").toLocaleUpperCase("tr-TR");
}

function apCurrentPage() {
  const file = (window.location.pathname.split("/").pop() || "index.html").split("?")[0];
  const decoded = decodeURIComponent(file || "index.html");
  return decoded.replace(/\.html?$/i, "") || "index";
}

/**
 * Adres satırındaki şartlar seçimini giriş bağlantısına taşınacak kanonik sorgu olarak döndürür
 * (Tur 11, plan §2.2–2.3): "?model=lise&sinif=11&ulke=nl&dil=en" ya da "". Eski biçim uyumlu:
 * ?ulke=de&sinif=11 -> model=lise; ?sinif=mezun -> model=lise-mezun; uni-mezun'da sınıf yazılmaz; İrlanda'da dil=en.
 * (sartlar-motor.js secimCoz ile aynı kurallar; app.js her sayfada yüklendiği için burada da durur.)
 */
function apSecimCoz(search) {
  const s = String(search == null ? window.location.search : search);
  const al = k => { const m = new RegExp("[?&]" + k + "=([^&#]*)").exec(s); try { return m ? decodeURIComponent(m[1]).toLowerCase() : ""; } catch (e) { return ""; } };
  let model = APMEBERRA_MODELLER.indexOf(al("model")) >= 0 ? al("model") : null;
  let sinif = /^(9|10|11|12|mezun)$/.test(al("sinif")) ? al("sinif") : null;
  if (sinif === "mezun") { if (!model || model === "lise") model = "lise-mezun"; sinif = null; }
  else if (sinif && !model) model = "lise";
  if (model !== "lise") sinif = null;
  const ulke = APMEBERRA_ULKE_ADLARI[al("ulke")] ? al("ulke") : null;
  const dil = al("dil") === "yerel" && ulke !== "ie" ? "yerel" : "en";
  return { model, sinif, ulke, dil };
}
function apSecimSorgusu(search) {
  const c = apSecimCoz(search);
  const q = [c.model ? "model=" + c.model : "", c.sinif ? "sinif=" + c.sinif : "", c.ulke ? "ulke=" + c.ulke : "", c.ulke ? "dil=" + c.dil : ""].filter(Boolean).join("&");
  return q ? "?" + q : "";
}
/** Seçimin okunur özeti: "Almanya · 11. sınıf · İngilizce" (giriş sayfası bağlamı için). */
function apSecimMetni(search) {
  const c = apSecimCoz(search);
  return [c.ulke ? APMEBERRA_ULKE_ADLARI[c.ulke] : "", c.model === "lise" ? (c.sinif ? c.sinif + ". sınıf" : "Lise öğrencisi") : (APMEBERRA_MODEL_AD[c.model] || ""),
    c.ulke ? (c.dil === "yerel" ? "Yerel dil" : "İngilizce") : ""].filter(Boolean).join(" · ");
}

/** Ziyaretçi menüsü mü? Oturum yoksa ya da giris.html?cikis=1 (çıkış o sayfada tamamlanır). */
function apMisafirMi() {
  return !APMEBERRA_ME || (apCurrentPage() === "giris" && /[?&]cikis=1(?:&|#|$)/.test(window.location.search));
}

function initGlobalNav() {
  const current = apCurrentPage() + ".html";
  const guest = apMisafirMi();
  const me = guest ? null : APMEBERRA_ME;
  // Profil sihirbazı bitmediyse sade başlık: yalnızca logo + tema + hesap.
  // Oturumsuz ziyaretçi (K4): yalnızca açık sayfalar + "Giriş yap / Kayıt ol".
  const minimal = !guest && !(me.profile && me.profile.tamamlandi);
  const NAV = guest ? APMEBERRA_NAV_ACIK : APMEBERRA_NAV;
  let nav = document.querySelector("nav.navbar");
  if (!nav) {
    nav = document.createElement("nav");
    nav.className = "navbar";
    nav.innerHTML = '<a href="index.html" class="nav-brand"><div class="brand-badge">Meberra</div></a>';
    document.body.insertBefore(nav, document.body.firstChild);
  }
  if (nav.dataset.navEnhanced) return;
  nav.setAttribute("aria-label", "Ana gezinme");
  nav.id = nav.id || "site-nav";

  // Menü listesi
  let ul = nav.querySelector(".nav-links");
  if (!ul) {
    ul = document.createElement("ul");
    ul.className = "nav-links";
    const brand = nav.querySelector(".nav-brand");
    if (brand && brand.nextSibling) nav.insertBefore(ul, brand.nextSibling); else nav.appendChild(ul);
  }
  ul.id = "site-nav-links";
  ul.innerHTML = "";
  if (minimal) { ul.remove(); nav.classList.add("navbar-minimal"); }

  // Açılır liste davranışı (disclosure deseni): tıklama, ok tuşları, Home/End, Tab ile çıkınca kapanma
  const wireDropdown = (btn, dd) => {
    const links = () => Array.from(dd.querySelectorAll("a, button"));
    const open = (focusWhich) => {
      closeAllNavDropdowns();
      btn.setAttribute("aria-expanded", "true"); dd.classList.add("open");
      const l = links();
      if (focusWhich && l.length) (focusWhich === "last" ? l[l.length - 1] : l[0]).focus();
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.getAttribute("aria-expanded") === "true") closeAllNavDropdowns(); else open(null);
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); open("first"); }
      if (e.key === "ArrowUp") { e.preventDefault(); open("last"); }
    });
    dd.addEventListener("keydown", (e) => {
      const l = links(); const i = l.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (l[i + 1] || l[0]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (l[i - 1] || l[l.length - 1]).focus(); }
      else if (e.key === "Home") { e.preventDefault(); l[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); l[l.length - 1].focus(); }
    });
    btn.parentElement.addEventListener("focusout", (e) => {
      if (e.relatedTarget && !btn.parentElement.contains(e.relatedTarget)) {
        btn.setAttribute("aria-expanded", "false"); dd.classList.remove("open");
      }
    });
  };

  const navModel = me && me.profile ? me.profile.ogrenciModeli : null;
  const ddHtml = (item, menuId) =>
    '<ul class="nav-dropdown" id="' + menuId + '">' +
      item.children.map(c => c.group
        ? '<li class="nav-dd-label" role="presentation">' + apEsc(c.group) + '</li>'
        : '<li><a href="' + c.href + '"' + (c.cls ? ' class="' + c.cls + '"' : "") + (c.href === current ? ' aria-current="page"' : "") + '>' +
            (c.cls ? '<span class="nav-dot" style="--dot:var(--' + c.cls + ')"></span>' : "") +
            '<span class="nav-dd-text"><span>' + apEsc(c.label) + '</span>' + (c.desc ? '<small>' + apEsc(c.desc) + '</small>' : "") + '</span></a></li>'
      ).join("") +
    '</ul>';
  if (!minimal) apNavListesi(NAV, navModel).forEach((item, idx) => {
    const li = document.createElement("li");
    li.dataset.nav = item.id;
    li.dataset.navLabel = item.label;
    const isActive = apNavEtkin(item, current);
    const here = item.href && item.href.split(/[?#]/)[0] === current;
    if (isActive) li.classList.add("is-active");
    if (item.children) {
      const menuId = "nav-dd-" + idx;
      if (item.href) {
        // Bölünmüş öğe: etiket tek tıkla ana sayfaya gider, ok düğmesi alt menüyü açar
        li.className += " nav-split";
        li.innerHTML =
          '<a href="' + item.href + '" class="nav-link nav-split-link' + (isActive ? " active" : "") + '"' + (here ? ' aria-current="page"' : "") + '>' + apEsc(item.label) + '</a>' +
          '<button type="button" class="nav-link nav-split-btn' + (isActive ? " active" : "") + '" aria-expanded="false" aria-controls="' + menuId + '" aria-label="' + apEsc(item.label) + ' alt menüsü" title="' + apEsc(item.label) + ' alt menüsü">' + APMEBERRA_ICONS.caret + '</button>' +
          ddHtml(item, menuId);
      } else {
        li.innerHTML =
          '<button type="button" class="nav-link' + (isActive ? " active" : "") + '" aria-expanded="false" aria-controls="' + menuId + '">' +
            apEsc(item.label) + APMEBERRA_ICONS.caret + '</button>' + ddHtml(item, menuId);
      }
      ul.appendChild(li);
      wireDropdown(li.querySelector("button"), li.querySelector(".nav-dropdown"));
      return;
    }
    const a = document.createElement("a");
    a.href = item.href;
    a.className = "nav-link";
    a.textContent = item.label;
    if (isActive) a.classList.add("active");
    if (here) a.setAttribute("aria-current", "page");
    li.appendChild(a);
    ul.appendChild(li);
  });

  // Sağ eylemler: tema düğmesi + hesap menüsü + mobil menü düğmesi
  let actions = nav.querySelector(".nav-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "nav-actions";
    nav.appendChild(actions);
  }
  if (minimal) actions.querySelectorAll(".btn-consult").forEach(b => b.remove());
  if (guest) {
    nav.classList.add("navbar-guest");
    // Giriş / Kayıt: giriş sayfasının kendisinde gösterilmez. Şartlar sayfasındaki seçim (ülke, sınıf) taşınır.
    if (current !== "giris.html" && !actions.querySelector(".nav-guest")) {
      const q = apSecimSorgusu();
      const box = document.createElement("div");
      box.className = "nav-guest";
      box.innerHTML =
        '<a class="btn-ghost btn-sm nav-login" href="giris.html' + q + '">Giriş yap</a>' +
        '<a class="btn-primary btn-sm nav-signup" href="giris.html' + q + '#kayit">Kayıt ol</a>';
      actions.appendChild(box);
      // Dar ekranda "Kayıt ol" açılır menünün sonunda durur
      const li = document.createElement("li");
      li.className = "nav-guest-mobile";
      li.innerHTML = '<a class="btn-primary btn-block" href="giris.html' + q + '#kayit">Kayıt ol</a><a class="btn-ghost btn-block" href="giris.html' + q + '">Giriş yap</a>';
      ul.appendChild(li);
    }
  }
  if (!actions.querySelector(".theme-toggle")) {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "icon-btn theme-toggle";
    const label = getEffectiveTheme() === "dark" ? "Açık temaya geç" : "Koyu temaya geç";
    t.setAttribute("aria-label", label);
    t.title = label;
    t.innerHTML = APMEBERRA_ICONS.moon + APMEBERRA_ICONS.sun;
    t.addEventListener("click", toggleTheme);
    actions.insertBefore(t, actions.firstChild);
  }
  if (me && !actions.querySelector(".account")) {
    const u = me.user, p = me.profile || {};
    const full = (u.ad + " " + u.soyad).trim();
    const sinif = apSinifEtiket(p);
    const sub = [p.okul, sinif].filter(Boolean).join(" · ");
    const acc = document.createElement("div");
    acc.className = "account";
    acc.innerHTML =
      '<button type="button" class="account-btn" aria-expanded="false" aria-controls="account-menu">' +
        '<span class="avatar" aria-hidden="true">' + apEsc(apInitials(u)) + '</span>' +
        '<span class="account-name"><span class="visually-hidden">Hesap menüsü: </span>' + apEsc(u.ad) + '</span>' + APMEBERRA_ICONS.caret +
      '</button>' +
      '<div class="nav-dropdown account-menu" id="account-menu">' +
        '<div class="account-head">' +
          '<span class="avatar avatar-lg" aria-hidden="true">' + apEsc(apInitials(u)) + '</span>' +
          '<div class="account-id"><strong>' + apEsc(full) + '</strong><span>' + apEsc(sub || "Profil tamamlanmadı") + '</span></div>' +
        '</div>' +
        '<ul>' +
          (minimal ? "" : '<li><a href="profil.html"' + (current === "profil.html" ? ' aria-current="page"' : "") + '>' + APMEBERRA_ICONS.user + '<span>Profil ve hesap</span></a></li>' +
          (MEBERRA_SUNUCU ? "" : '<li><a href="profil.html#yedek">' + APMEBERRA_ICONS.save + '<span>Yedek al / yükle</span></a></li>') +
          // Meberra: Premium durumu ve yönetici paneli (sunucu modu)
          (MEBERRA_SUNUCU ? (me.uyelik && me.uyelik.premium && !me.uyelik.yonetici
            ? '<li><a href="premium.html">' + APMEBERRA_ICONS.crown + '<span>Premium · aktif</span></a></li>'
            : me.uyelik && me.uyelik.yonetici ? "" : '<li><a href="premium.html" class="account-premium">' + APMEBERRA_ICONS.crown + '<span>Premium' + "'" + 'a geç</span></a></li>') : "") +
          (me.user.rol === "yonetici" ? '<li><a href="admin.html">' + APMEBERRA_ICONS.crown + '<span>Yönetici paneli</span></a></li>' : "")) +
          '<li><a href="giris.html?cikis=1" class="account-logout">' + APMEBERRA_ICONS.logout + '<span>Çıkış yap</span></a></li>' +
        '</ul>' +
      '</div>';
    const menuBtn = actions.querySelector(".nav-menu-btn");
    actions.insertBefore(acc, menuBtn || null);
    wireDropdown(acc.querySelector(".account-btn"), acc.querySelector(".account-menu"));
  }
  if (!minimal && !actions.querySelector(".nav-menu-btn")) {
    const m = document.createElement("button");
    m.type = "button";
    m.className = "icon-btn nav-menu-btn";
    m.setAttribute("aria-label", "Menüyü aç");
    m.setAttribute("aria-expanded", "false");
    m.setAttribute("aria-controls", "site-nav-links");
    m.innerHTML = APMEBERRA_ICONS.menu;
    m.addEventListener("click", () => {
      const open = nav.classList.toggle("nav-open");
      m.setAttribute("aria-expanded", String(open));
      m.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    });
    actions.appendChild(m);
  }
  nav.querySelectorAll(".btn-consult").forEach(b => {
    if (!b.getAttribute("type")) b.setAttribute("type", "button");
    // Dar ekranda yalnızca ikon görünür; erişilebilir ad metinden gelir
    const label = b.textContent.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
    if (label && !b.querySelector(".consult-ico")) {
      b.setAttribute("aria-label", label); b.title = label;
      b.insertAdjacentHTML("afterbegin", '<svg class="consult-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>');
    }
  });

  // Tur 14 A2: telefonda (≤ 760 px) alt gezinme — aynı ana öğeler, ikon + kısa etiket
  if (!minimal) initBottomNav(guest ? APMEBERRA_NAV_ACIK.concat([{ id: "kayit", href: "giris.html" + apSecimSorgusu() + "#kayit", label: "Kayıt ol" }]) : apNavListesi(NAV, navModel), current);

  // Dışarı tıklama ve Escape ile kapanış
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-links > li, .account")) closeAllNavDropdowns();
    if (!e.target.closest(".bn-sheet, .bottom-nav")) apBnSheetKapat(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (apBnSheetKapat(true)) return;
    const openBtn = nav.querySelector('button[aria-expanded="true"]:not(.nav-menu-btn)');
    closeAllNavDropdowns();
    if (openBtn) openBtn.focus();
  });

  // "İçeriğe atla" bağlantısı
  const main = document.querySelector("main, .main-container");
  if (main && !document.querySelector(".skip-link")) {
    if (!main.id) main.id = "main-content";
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.style.outline = "none";
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#" + main.id;
    skip.textContent = "İçeriğe atla";
    document.body.insertBefore(skip, document.body.firstChild);
  }

  nav.dataset.navEnhanced = "1";
}

/**
 * Tur 14 A2 (plan §2.2): telefon alt gezinmesi. ≤ 760 px'te görünür (CSS); üst çubuk yalnız logo + tema + hesap kalır.
 * Alt öğesi olan ve mobilBaglanti taşımayan ana öğe alttan açılan bir liste açar (Tur 14 A6 itibarıyla hiçbiri: Hedefim, Başvuru, Ben
 * mobilBaglanti, Çalış düz bağlantı — liste kodu ileride gerekirse diye yerinde); mobilBaglanti ve alt öğesiz
 * öğeler doğrudan sayfaya gider. Etkin öğe aria-current="page" taşır. Yükseklik: --bottom-nav-h + güvenli alan.
 */
function initBottomNav(items, current) {
  if (document.querySelector(".bottom-nav") || !items || !items.length) return;
  const bn = document.createElement("nav");
  bn.className = "bottom-nav";
  bn.setAttribute("aria-label", "Alt gezinme");
  bn.innerHTML = '<ul style="--bn-n:' + items.length + '">' + items.map(it => {
    const etkin = apNavEtkin(it, current) || (it.id === "kayit" && current === "giris.html");
    const ic = APMEBERRA_ICONS["bn_" + it.id] || APMEBERRA_ICONS.bn_bugun;
    const ic2 = '<span class="bn-ico">' + ic + '</span><span class="bn-label">' + apEsc(it.label) + '</span>';
    const cur = etkin ? ' aria-current="page"' : "";
    if (it.children && !it.mobilBaglanti) {
      return '<li><button type="button" class="bn-item" data-bn="' + it.id + '" aria-expanded="false" aria-controls="bn-sheet"' + cur + '>' + ic2 + '</button></li>';
    }
    return '<li><a class="bn-item" data-bn="' + it.id + '" href="' + it.href + '"' + cur + '>' + ic2 + '</a></li>';
  }).join("") + '</ul>';
  const sheet = document.createElement("div");
  sheet.className = "bn-sheet";
  sheet.id = "bn-sheet";
  sheet.setAttribute("role", "region");
  sheet.setAttribute("aria-labelledby", "bn-sheet-title");
  sheet.hidden = true;
  document.body.appendChild(sheet);
  document.body.appendChild(bn);
  document.body.classList.add("has-bottom-nav");
  bn.addEventListener("click", (e) => {
    const b = e.target.closest("button.bn-item");
    if (!b) return;
    const acik = b.getAttribute("aria-expanded") === "true";
    apBnSheetKapat(false);
    if (acik) return;
    const it = items.find(x => x.id === b.dataset.bn);
    if (!it || !it.children) return;
    sheet.innerHTML = '<div class="bn-sheet-head"><strong id="bn-sheet-title">' + apEsc(it.label) + '</strong>' +
      '<button type="button" class="icon-btn bn-sheet-close" aria-label="Kapat">' + APMEBERRA_ICONS.cross + '</button></div>' +
      '<ul class="bn-sheet-list">' + it.children.map(c => c.group
        ? '<li class="nav-dd-label" role="presentation">' + apEsc(c.group) + '</li>'
        : '<li><a href="' + c.href + '"' + (c.href === current ? ' aria-current="page"' : "") + '>' +
            (c.cls ? '<span class="nav-dot" style="--dot:var(--' + c.cls + ')"></span>' : "") +
            '<span class="nav-dd-text"><span>' + apEsc(c.label) + '</span>' + (c.desc ? '<small>' + apEsc(c.desc) + '</small>' : "") + '</span></a></li>').join("") + '</ul>';
    sheet.querySelector(".bn-sheet-close").addEventListener("click", () => apBnSheetKapat(true));
    sheet.hidden = false;
    sheet.dataset.kaynak = it.id;
    b.setAttribute("aria-expanded", "true");
    const ilk = sheet.querySelector(".bn-sheet-list a");
    if (ilk) ilk.focus();
  });
}
/** Alt gezinme listesini kapatır; açıksa true döner. odakGeri: odağı listeyi açan düğmeye taşı. */
function apBnSheetKapat(odakGeri) {
  const sheet = document.getElementById("bn-sheet");
  if (!sheet || sheet.hidden) return false;
  const b = document.querySelector('.bottom-nav button[data-bn="' + sheet.dataset.kaynak + '"]');
  sheet.hidden = true;
  if (b) { b.setAttribute("aria-expanded", "false"); if (odakGeri) b.focus(); }
  return true;
}

/**
 * Tur 14 A1 (plan §2.2): Rehberler üst menüden çıktı; her sayfanın altbilgisinde bir "Rehberler" satırı durur.
 * Altbilgisi olmayan sayfaya (giris.html) küçük bir altbilgi eklenir. Profil sihirbazı bitmeden gösterilmez.
 */
function initFooterRehber() {
  const guest = apMisafirMi();
  const me = guest ? null : APMEBERRA_ME;
  if (!guest && !(me && me.profile && me.profile.tamamlandi)) return;
  if (document.querySelector(".footer-rehber")) return;
  if (apCurrentPage() === "index") return; // Bugün sade kalır: altbilgide yalnızca "Hedefim" bağlantısı
  const model = me && me.profile ? me.profile.ogrenciModeli : null;
  const current = apCurrentPage() + ".html";
  let footer = document.querySelector("footer.footer");
  if (!footer) {
    footer = document.createElement("footer");
    footer.className = "footer footer-mini";
    document.body.appendChild(footer);
  }
  const navEl = document.createElement("nav");
  navEl.className = "footer-rehber";
  navEl.setAttribute("aria-label", "Rehberler");
  navEl.innerHTML = '<span class="footer-rehber-title" aria-hidden="true">Rehberler</span><ul>' +
    APMEBERRA_REHBERLER.filter(r => guest || apNavUygun(r, model)).map(r =>
      '<li><a href="' + r.href + '"' + (r.href === current ? ' aria-current="page"' : "") + '>' + apEsc(r.label) + '</a></li>').join("") + '</ul>';
  footer.insertBefore(navEl, footer.firstChild);
}

/**
 * Tur 14 A4 (plan §2.3-B): Hedefim alanı — sartlar.html · universiteler.html · rota.html üstünde ortak sekme çubuğu.
 * Sayfalar arası gezinme olduğu için bağlantı listesidir (aria-current="page", role=tab değil). Seçim (ülke, durum, dil)
 * adres satırından, yoksa profilden taşınır. Ziyaretçi (K4): yalnızca Şartlar · Üniversiteler (Takvimim kilitli sayfa).
 */
// v4: 4 sekmeli menü — Başvuru ana öğesi kalktı; Sınavlar ve Başvurularım Hedefim sekme çubuğunda
// Sade Hedefim: 3 görünüm. altSayfalar: o sekmenin altındaki sayfalar (sekme çubuğu orada da görünür, sekme etkin olur).
const APMEBERRA_HEDEFIM = [
  { id: "sartlar", label: "Ülkem", altSayfalar: ["universiteler"] },
  { id: "rota", label: "Takvimim", oturum: true, altSayfalar: ["sinavlar"] },
  { id: "yazismalar", label: "Başvurularım", oturum: true }
];
/** Profildeki kendi seçimi {model, sinif, ulke, dil} | null (sartlar.html "Kendi profilime göre göster" ile aynı kural). */
function apKendiSecim(p) {
  if (!p || APMEBERRA_MODELLER.indexOf(p.ogrenciModeli) < 0 || !Array.isArray(p.ulkeler) || !p.ulkeler.length) return null;
  return {
    model: p.ogrenciModeli,
    sinif: p.ogrenciModeli === "lise" && /^(9|10|11|12)$/.test(String(p.sinif || "")) ? String(p.sinif) : null,
    ulke: p.ulkeler.indexOf(p.aktifRota) >= 0 ? p.aktifRota : p.ulkeler[0],
    dil: p.egitimDili === "yerel" ? "yerel" : "en"
  };
}
/**
 * Hedefim sekmesinin adresi (saf: adres sorgusu + profil). Adresteki seçim önce gelir, eksik parça profilden tamamlanır.
 * sartlar: ?model&sinif&ulke&dil · universiteler: ?ulke&duzey&dil (dil: en|yerel|hepsi) · rota: ?ulke (yalnız profildeki ülke).
 */
function apHedefimHref(id, search, profil) {
  const s = String(search || "");
  const al = k => { const m = new RegExp("[?&]" + k + "=([^&#]*)").exec(s); try { return m ? decodeURIComponent(m[1]).toLowerCase() : ""; } catch (e) { return ""; } };
  const c = apSecimCoz(s), k = apKendiSecim(profil) || {};
  const duzeyQ = al("duzey"), dilQ = al("dil");
  const ulke = c.ulke || k.ulke || null;
  const model = c.model || (duzeyQ === "yl" ? "uni-mezun" : null) || k.model || null;
  if (id === "sartlar") {
    const sinif = model === "lise" ? (c.sinif || (k.model === "lise" ? k.sinif : null)) : null;
    const dil = ulke === "ie" ? "en" : (dilQ === "yerel" || dilQ === "en" ? dilQ : (k.dil || "en"));
    const q = [model ? "model=" + model : "", sinif ? "sinif=" + sinif : "", ulke ? "ulke=" + ulke : "", ulke ? "dil=" + dil : ""].filter(Boolean).join("&");
    return "sartlar.html" + (q ? "?" + q : "");
  }
  if (id === "universiteler") {
    if (!ulke) return "universiteler.html";
    const duzey = duzeyQ === "yl" || duzeyQ === "lisans" ? duzeyQ : (model === "uni-mezun" ? "yl" : "lisans");
    const dil = /^(en|yerel|hepsi)$/.test(dilQ) ? dilQ : (k.dil || "hepsi");
    return "universiteler.html?ulke=" + ulke + "&duzey=" + duzey + "&dil=" + dil;
  }
  if (id === "rota") {
    const pu = profil && Array.isArray(profil.ulkeler) ? profil.ulkeler : [];
    return ulke && pu.indexOf(ulke) >= 0 ? "rota.html?ulke=" + ulke : "rota.html";
  }
  if (id === "sinavlar" || id === "yazismalar") return id + ".html";
  return "#";
}
function initHedefimSekmeler() {
  const page = apCurrentPage();
  const guest = apMisafirMi();
  const me = guest ? null : APMEBERRA_ME;
  const model = me && me.profile ? me.profile.ogrenciModeli : null;
  if (guest) return; // ziyaretçi yalnızca Ülkem'i görür; tek sekmelik çubuk gereksiz
  const items = APMEBERRA_HEDEFIM.filter(h => (!h.oturum || !guest) && apNavUygun(h, model));
  const sekmeMi = h => h.id === page || (Array.isArray(h.altSayfalar) && h.altSayfalar.indexOf(page) >= 0);
  if (!items.some(sekmeMi)) return;
  if (!guest && !(me && me.profile && me.profile.tamamlandi)) return;
  const main = document.querySelector("main.main-container");
  if (!main || main.querySelector(".hedefim-bar")) return;
  const nav = document.createElement("nav");
  nav.className = "hedefim-bar";
  nav.setAttribute("aria-label", "Hedefim");
  nav.innerHTML = '<span class="hedefim-ad" aria-hidden="true">Hedefim</span><ul class="hedefim-tabs" style="--hb-n:' + items.length + '">' +
    items.map(h => '<li><a class="hedefim-tab" data-hedefim="' + h.id + '" href="' + h.id + '.html"' + (sekmeMi(h) ? ' aria-current="page"' : "") + '>' + apEsc(h.label) + '</a></li>').join("") + '</ul>';
  main.insertBefore(nav, main.firstChild);
  // v4: telefonda sekmeler yatay kayar; etkin sekme görünür alana getirilir (sayfa dikey kaymaz)
  const ul = nav.querySelector(".hedefim-tabs"), etkin = nav.querySelector('[aria-current="page"]');
  if (ul && etkin && ul.scrollWidth > ul.clientWidth) {
    ul.scrollLeft += etkin.getBoundingClientRect().left - ul.getBoundingClientRect().left - (ul.clientWidth - etkin.offsetWidth) / 2;
  }
  // Sayfa seçimi değiştirince (history.replaceState) adresler eskimesin: etkileşimden hemen önce tazelenir
  const tazele = () => nav.querySelectorAll("a[data-hedefim]").forEach(a => a.setAttribute("href", apHedefimHref(a.dataset.hedefim, window.location.search, me && me.profile)));
  tazele();
  ["pointerdown", "mouseover", "focusin", "keydown"].forEach(ev => nav.addEventListener(ev, tazele));
}

/**
 * Tur 14 A4: yüksek lisans başvuru dosyası özeti (saf). belgeler: yl-genel.js belgeler (geçerli maddeler),
 * durum: rota durumu genel.belgeler ({id: true}). Dönüş: {toplam, hazir, ilk} | null (liste boşsa).
 */
function apYlKalan(belgeler, durum) {
  const L = Array.isArray(belgeler) ? belgeler : [];
  if (!L.length) return null;
  durum = durum || {};
  const acik = L.filter(m => !durum[m.id]);
  return { toplam: L.length, hazir: L.length - acik.length, ilk: acik[0] ? (acik[0].baslik || acik[0].metin || null) : null };
}

function closeAllNavDropdowns() {
  document.querySelectorAll(".nav-links button[aria-expanded='true'], .account-btn[aria-expanded='true']").forEach(b => b.setAttribute("aria-expanded", "false"));
  document.querySelectorAll(".nav-dropdown.open").forEach(d => d.classList.remove("open"));
}


// --- INITIALIZATION ON DOM LOAD ---
document.addEventListener("DOMContentLoaded", () => {
  const rotaAktif = window.APMEBERRA.rota.aktif();
  if (rotaAktif) document.documentElement.setAttribute("data-rota", rotaAktif);
  initGlobalNav();
  initFooterRehber();
  initHedefimSekmeler();
  initPageChrome();
  initUniteGorunumu();
  initDocToc();
  initQuizHashFocus();
  initCountdown();
  initKMKChecker();
  initFormulaCopies();
  initUniteMetinleri();
});

// --- Sayfa kabuğu (v3): tek tip marka satırı, ders sayfası vurgu rengi ---
function initPageChrome() {
  const page = apCurrentPage();
  // Marka satırı her sayfada aynı: yalnızca "Meberra" rozeti (eski sayfa başlıkları büyük harfli "STUDIO" adları taşıyordu)
  document.querySelectorAll(".navbar .nav-brand").forEach(b => {
    const t = b.querySelector(".brand-title");
    if (t) t.remove();
    b.querySelectorAll(".brand-subtitle").forEach(x => x.remove());
    if (apMisafirMi()) {
      // Ziyaretçi için marka bağlantısı açık giriş noktasına gider (Bugün ekranı kilitli)
      b.setAttribute("href", APMEBERRA_ACIK_GIRIS);
      b.setAttribute("aria-label", "Meberra — Ülkeler");
    } else {
      b.setAttribute("aria-label", "Meberra — Bugün");
    }
  });
  if (/^ap-/.test(page)) {
    document.body.classList.add("page-course");
    document.body.setAttribute("data-course", page);
  }
  if (/^ap-|^sinav-|-muhendislik$|^istanbul-|^bilgi-merkezi$|^ajanlar$/.test(page)) document.body.classList.add("page-doc");
}

// --- Bugün ekranı (Tur 14 A3, plan §2.3-A): saf fonksiyonlar ----------------------------------------
// DOM ve depolama okumaz; girdiyi index.html toplar. Node birim testi: araclar/testler/bugun-birim-test.js
// (test bu bölümü başlık satırı ile bölüm sonu işaret satırı arasından okur).
// Tarih kuralı: yalnızca veride olan tarih gösterilir. Rota adımları ay düzeyindedir (gün uydurulmaz; "Kasım 2026"),
// sınav ve duyuru tarihleri gün düzeyindedir. Ay düzeyindeki adımın son günü o ayın son günü sayılır.
const AP_AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const AP_AYLAR_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
/** "YYYY-MM-DD" | Date -> gün numarası (UTC, 1970'ten beri) | null */
function apGunNo(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : Math.floor(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()) / 864e5);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? Math.floor(d.getTime() / 864e5) : null;
}
/** Gün numarası -> "YYYY-MM-DD" */
function apGunIso(n) { return new Date(n * 864e5).toISOString().slice(0, 10); }
/** Ayın son günü -> gün numarası */
function apAySonuNo(yil, ay) { return Math.floor(Date.UTC(yil, ay, 0) / 864e5); }
/**
 * Serbest metnin BAŞINDAKİ Türkçe tarihi okur: "10 Mayıs 2027 Pazartesi, …" -> "2027-05-10".
 * Metin bir tarihle başlamıyorsa null (metnin ortasındaki tarihler bilerek okunmaz: aralık, geçmiş yıl ya da
 * başka sınavın tarihi olabilir).
 */
function apTrTarihCoz(metin) {
  const m = /^\s*(\d{1,2})\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+(\d{4})(?![\d–-])/.exec(String(metin || ""));
  if (!m) return null;
  const iso = m[3] + "-" + String(AP_AYLAR.indexOf(m[2]) + 1).padStart(2, "0") + "-" + String(+m[1]).padStart(2, "0");
  return apGunNo(iso) === null ? null : iso;
}
function apDiz(x) { return Array.isArray(x) ? x : []; }

/**
 * Bugün ekranının "Sıradaki adım" kartı (plan §2.3-A.1). Öncelik:
 *   1) yarım kalan deneme > 2) son günü 14 gün içinde olan rota adımı > 3) açık hata ≥ 5 > 4) çalışma planı görevi >
 *   5) profil eksiği > 6) boş durum.
 * g = { bugun: "YYYY-MM-DD"|Date,
 *       yarimDeneme: {ad, cevaplanan, toplam} | null,
 *       rotaAdimlari: [{id, baslik, tarih:{yil, ay, etiket}|null, yapildi, zorunlu, href?, etiket?}], rotaUlke: "Almanya",
 *       acikHata: number, sonHata: "konu" | null,
 *       plan: [{baslik, aciklama, href, etiket}],
 *       profilEksik: ["okul", …],
 *       bosHref: "rota.html?ulke=de" }
 * Dönüş: { tur: "deneme"|"rota"|"hata"|"plan"|"profil"|"bos", baslik, aciklama, href, etiket, neden, kalanGun? }
 */
function apSiradakiAdim(g) {
  g = g || {};
  const bugun = apGunNo(g.bugun) != null ? apGunNo(g.bugun) : apGunNo(new Date());
  const yd = g.yarimDeneme;
  if (yd && +yd.toplam > 0) {
    const n = Math.max(0, Math.min(+yd.cevaplanan || 0, +yd.toplam));
    return { tur: "deneme", baslik: (yd.ad || "Deneme") + " yarım kaldı (" + n + "/" + yd.toplam + ")",
      aciklama: "Kaldığın sorudan devam et; cevapların hesabında kayıtlı.", href: "deneme.html", etiket: "Denemeye devam et",
      neden: "Yarım kalan deneme önce gelir: cevapların ve süren kaldığın yerde bekliyor." };
  }
  const yakin = apDiz(g.rotaAdimlari)
    .filter(a => a && !a.yapildi && a.tarih && +a.tarih.yil && +a.tarih.ay >= 1 && +a.tarih.ay <= 12)
    .map((a, i) => ({ a, i, kalan: apAySonuNo(+a.tarih.yil, +a.tarih.ay) - bugun }))
    .filter(x => x.kalan >= 0 && x.kalan <= 14)
    .sort((x, y) => (x.kalan - y.kalan) || ((x.a.zorunlu === false) - (y.a.zorunlu === false)) || (x.i - y.i))[0];
  if (yakin) {
    const a = yakin.a;
    const etiket = a.tarih.etiket || (AP_AYLAR[a.tarih.ay - 1] + " " + a.tarih.yil);
    return { tur: "rota", baslik: a.baslik, kalanGun: yakin.kalan,
      aciklama: [g.rotaUlke ? g.rotaUlke + " rotası" : "", etiket, yakin.kalan === 0 ? "ayın son günü" : "ay bitimine " + yakin.kalan + " gün"].filter(Boolean).join(" · "),
      href: a.href || "rota.html", etiket: a.etiket || "Takvimimi aç",
      neden: "Bu rota adımının ayı " + yakin.kalan + " gün içinde bitiyor. Adımın tarihi ay düzeyindedir; kesin son gün için adımın kaynağına bak." };
  }
  const hata = Math.max(0, +g.acikHata || 0);
  if (hata >= 5) {
    return { tur: "hata", baslik: hata + " yanlış soruyu tekrar çöz", aciklama: g.sonHata ? "En son yanlışın: " + g.sonHata : "Yanlışlarım’daki açık sorular",
      href: "deneme.html?mod=yanlislar", etiket: "Yanlışlarımı çöz",
      neden: "Yanlışlarım’da 5 ya da daha fazla açık soru var; yanlışları kapatmak yeni konudan önce gelir. Hepsi tek oturumda gelir; doğru çözdüğün hata kapanır." };
  }
  const p0 = apDiz(g.plan).find(x => x && x.baslik && x.href);
  if (p0) {
    return { tur: "plan", baslik: p0.baslik, aciklama: p0.aciklama || "", href: p0.href, etiket: p0.etiket || "Başla",
      neden: "Çalışma planındaki sıradaki görev; liste sonuçlarına göre her açılışta yeniden hesaplanır." };
  }
  const eksik = apDiz(g.profilEksik).filter(Boolean);
  if (eksik.length) {
    return { tur: "profil", baslik: "Profilini tamamla", aciklama: "Eksik: " + eksik.join(", "), href: "profil.html", etiket: "Profili düzenle",
      neden: "Öneriler ve tarihler profilindeki bilgilere göre hesaplanır." };
  }
  return { tur: "bos", baslik: "Acil bir işin yok", aciklama: "Takvimindeki sonraki adımlara ve yaklaşan tarihlere göz at.", href: g.bosHref || "rota.html", etiket: "Takvimimi aç",
    neden: "Yarım deneme, yakın tarihli rota adımı, birikmiş hata ya da plan görevi yok." };
}

/**
 * Bugün ekranının "Yaklaşan tarihler" listesi (plan §2.3-A.2): en yakın n tarih (varsayılan 3).
 * g = { bugun, n,
 *       rotaAdimlari: [{id, baslik, tarih:{yil, ay}|null, yapildi, bagli, href?}], rotaUlke: "Almanya",
 *       apTakvim: {kayitSon, gecKayitBas, gecKayitSon, sinavBas} | null   (data/mevzuat/sinav-takvimi.js; yalnızca AP gösterilecekse),
 *       sinavlar: [{id, ad, tarih (serbest metin)}]                        (öğrencinin "Listem"e eklediği sınavlar),
 *       duyurular: [{id, baslik, bitis: "YYYY-MM-DD"}] }                   (modele uyan açık duyurular)
 * Kurallar: geçmiş tarih yok; rota adımı ay düzeyinde (son günü ayın son günü, gün uydurulmaz); sınav tarihi yalnızca
 * metin bir tarihle başlıyorsa okunur; AP kayıt son günü varken aynı aydaki AP'ye bağlı rota adımı yinelenmez.
 * Dönüş: [{ anahtar, tur: "ap"|"sinav"|"rota"|"duyuru", gun: "YYYY-MM-DD"|null, ayDuzeyi, ust: "13"|"KAS", alt: "Kas"|"2026",
 *          tarihMetni: "13 Kasım 2026"|"Kasım 2026", baslik, href, kalanGun }]
 */
function apYaklasanTarihler(g) {
  g = g || {};
  const bugun = apGunNo(g.bugun) != null ? apGunNo(g.bugun) : apGunNo(new Date());
  const n = +g.n > 0 ? +g.n : 3;
  const nGecmis = g.nGecmis != null && +g.nGecmis >= 0 ? +g.nGecmis : 3;
  const out = [], gecmis = [];
  const isoOku = v => (apGunNo(v) != null && /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : apTrTarihCoz(v));
  const metin = iso => { const ay = +iso.slice(5, 7); return +iso.slice(8, 10) + " " + AP_AYLAR[ay - 1] + " " + iso.slice(0, 4); };
  // K14-5 (kullanıcı kararı, 20 Ekim 2026): süresi dolan gün düzeyindeki tarih sessizce düşmez; "Süresi doldu" + sonraki dönem
  // (isteğe bağlı sonrakiTarih alanı; yoksa "henüz açıklanmadı" — tarih uydurulmaz, gün eklenmez). Yaklaşanların önüne geçmez.
  const gunluk = (anahtar, tur, iso, baslik, href, sonrakiTarih) => {
    const no = apGunNo(iso);
    if (no == null) return;
    const ay = +iso.slice(5, 7), gun = +iso.slice(8, 10);
    const ortak = { anahtar, tur, gun: iso, ayDuzeyi: false, ust: String(gun), alt: AP_AYLAR_KISA[ay - 1], tarihMetni: metin(iso), baslik, href };
    if (no < bugun) {
      const s2 = isoOku(sonrakiTarih), sNo = s2 ? apGunNo(s2) : null;
      const sonraki = sNo != null && sNo >= bugun ? { gun: s2, tarihMetni: metin(s2), kalanGun: sNo - bugun } : null;
      gecmis.push(Object.assign(ortak, { suresiDoldu: true, gecenGun: bugun - no, sonraki,
        sonrakiMetni: sonraki ? "Sonraki dönem: " + sonraki.tarihMetni : "Sonraki dönem tarihi henüz açıklanmadı", _sira: no }));
      return;
    }
    out.push(Object.assign(ortak, { kalanGun: no - bugun, _sira: no, _ayKey: iso.slice(0, 7) }));
  };
  const T = g.apTakvim;
  if (T) {
    const kayitNo = apGunNo(T.kayitSon);
    if (kayitNo != null) gunluk("ap-kayit", "ap", T.kayitSon, "AP sınav siparişi son günü", "istanbul-sinav-rehberi.html", T.kayitSonraki);
    if (kayitNo != null && kayitNo < bugun && apGunNo(T.gecKayitSon) != null) gunluk("ap-gec-kayit", "ap", T.gecKayitSon, "AP geç sipariş son günü (sınav başına ek ücret)", "istanbul-sinav-rehberi.html", T.gecKayitSonraki);
    if (T.sinavBas) gunluk("ap-donem", "ap", T.sinavBas, "AP sınav dönemi başlıyor", "sinavlar.html", T.sinavSonraki);
  }
  apDiz(g.sinavlar).forEach(s => {
    if (!s || !s.id) return;
    const iso = apTrTarihCoz(s.tarih);
    if (iso) gunluk("sinav-" + s.id, "sinav", iso, (s.ad || s.id) + " sınavı", "sinavlar.html#" + encodeURIComponent(s.id), s.sonrakiTarih);
  });
  const duyuruHref = typeof g.duyuruHref === "string" && g.duyuruHref ? g.duyuruHref : "sartlar.html#mezun-panel";
  apDiz(g.duyurular).forEach(d => {
    if (d && d.id && d.bitis) gunluk("duyuru-" + d.id, "duyuru", d.bitis, "Son gün: " + (d.baslik || "duyuru"), duyuruHref, d.sonrakiTarih);
  });
  const apAylari = out.filter(x => x.tur === "ap").map(x => x._ayKey);
  apDiz(g.rotaAdimlari).forEach(a => {
    if (!a || a.yapildi || !a.tarih || !(+a.tarih.yil) || !(+a.tarih.ay >= 1 && +a.tarih.ay <= 12)) return;
    const yil = +a.tarih.yil, ay = +a.tarih.ay, son = apAySonuNo(yil, ay);
    if (son < bugun) return; // geciken rota adımı bir görevdir (Takvimim'de "tarihi geçti"), dönemlik son tarih değil
    const ayKey = yil + "-" + String(ay).padStart(2, "0");
    if (a.bagli && /^ap-/.test(String(a.bagli.sinav || "")) && apAylari.indexOf(ayKey) >= 0) return; // AP kayıt son günüyle aynı iş
    out.push({ anahtar: "rota-" + a.id, tur: "rota", gun: null, ayDuzeyi: true, ust: AP_AYLAR_KISA[ay - 1].toLocaleUpperCase("tr-TR"), alt: String(yil),
      tarihMetni: AP_AYLAR[ay - 1] + " " + yil, baslik: a.baslik, href: a.href || "rota.html", kalanGun: son - bugun, _sira: son, _ayKey: ayKey });
  });
  const temiz = x => { const o = Object.assign({}, x); delete o._sira; delete o._ayKey; return o; };
  const tekil = (x, i, arr) => arr.findIndex(y => y.anahtar === x.anahtar) === i;
  const gelen = out.sort((x, y) => (x._sira - y._sira) || (x.ayDuzeyi - y.ayDuzeyi)).filter(tekil).slice(0, n).map(temiz);
  const gecen = gecmis.sort((x, y) => y._sira - x._sira).filter(tekil).slice(0, nGecmis).map(temiz); // en yeni dolan önce
  return gelen.concat(gecen);
}

/**
 * Tur 14 A5: Son tarihler girdisi (Bugün dışındaki sayfalar için; yazismalar.html "Son tarihler" şeridi).
 * Globalden okur: profil, rota (APMEBERRA_ROTA + ulke-rotalari), AP takvimi (APMEBERRA_TAKVIM, yalnızca lise — K5-b),
 * Listem'deki sınavlar (APMEBERRA_SINAVLAR + panel), modele uyan duyurular (APMEBERRA_DUYURULAR + sartlar-motor).
 * Dönüş: apYaklasanTarihler girdisi + {rotaU} | null (oturum yoksa).
 */
function apSonTarihGirdisi(opt) {
  opt = opt || {};
  const p = APMEBERRA_ME && APMEBERRA_ME.profile;
  if (!p) return null;
  const A = window.APMEBERRA, R = window.APMEBERRA_ROTA, model = p.ogrenciModeli;
  const bugun = typeof opt.bugun === "string" ? opt.bugun : new Date();
  const rotaU = A.rota.aktif();
  let rotaAdimlari = [];
  if (rotaU && R && model !== "uni-mezun") {
    const v = A.rota.veri(rotaU);
    if (v) {
      const c = R.zamanCizelgesi(v, p, apGunNo(bugun) != null && typeof bugun === "string" ? bugun : new Date(), A.rota.durum()[rotaU]);
      rotaAdimlari = c.adimlar.map(a => { const h = R.bagliHedef(a.bagli); return { id: a.id, baslik: a.baslik, tarih: a.tarih, yapildi: a.yapildi, zorunlu: a.zorunlu, bagli: a.bagli, href: h ? h.href : "rota.html?ulke=" + rotaU }; });
    }
  }
  const T = window.APMEBERRA_TAKVIM, S = Array.isArray(window.APMEBERRA_SINAVLAR) ? window.APMEBERRA_SINAVLAR : [];
  const SM = window.APMEBERRA_SARTLAR_MOTOR, D = window.APMEBERRA_DUYURULAR;
  return {
    bugun, rotaU, rotaUlke: rotaU ? APMEBERRA_ULKE_ADLARI[rotaU] || rotaU : "", rotaAdimlari,
    apTakvim: model === "lise" && T && T.kayit ? { kayitSon: T.kayit.sonGun, gecKayitBas: T.kayit.gecKayitBas, gecKayitSon: T.kayit.gecKayitSon, sinavBas: T.sinavDonemi && T.sinavDonemi.bas,
      kayitSonraki: T.kayit.sonrakiTarih, gecKayitSonraki: T.kayit.gecKayitSonrakiTarih, sinavSonraki: T.sinavDonemi && T.sinavDonemi.sonrakiTarih } : null,
    sinavlar: A.panel.get().sinavlarim.map(id => S.find(x => x && x.id === id)).filter(Boolean),
    duyurular: SM && Array.isArray(D) ? SM.duyuruSuz(D, { model }, bugun) : [],
    duyuruHref: apHedefimHref("sartlar", "", p) + "#mezun-panel"
  };
}

/**
 * "Devam et" satırı için son çalışılan ünite: quiz ilerlemesindeki en yeni cevap damgası (answers[*].t).
 * (Ünitenin `seen` alanı sayfa açılınca tüm ünitelere birden yazıldığı için kullanılmaz.)
 * progress: apmeberra:quiz:v1 ({pages:{<sayfa>:{units:{<id>:{title, total, answers:{<q>:{c, t}}}}}}}), dersler: [{page, name}]
 * Dönüş: {page, unitId, title, ders, answered, correct, total, son: ISO} | null
 */
function apKaldiginYer(progress, dersler) {
  const pages = progress && progress.pages && typeof progress.pages === "object" ? progress.pages : {};
  const ad = {}; apDiz(dersler).forEach(c => { if (c && c.page) ad[c.page] = c.name || c.page; });
  let en = null;
  Object.keys(pages).forEach(p => {
    const units = pages[p] && pages[p].units && typeof pages[p].units === "object" ? pages[p].units : {};
    Object.keys(units).forEach(id => {
      const u = units[id] || {};
      const ans = u.answers && typeof u.answers === "object" ? u.answers : {};
      let t = -Infinity, son = null, correct = 0;
      Object.keys(ans).forEach(q => { const x = ans[q] || {}; if (x.c) correct++; const v = Date.parse(x.t || ""); if (!isNaN(v) && v > t) { t = v; son = x.t; } });
      if (son && (!en || t > en.t)) en = { t, page: p, unitId: id, title: u.title || id, ders: ad[p] || p, answered: Object.keys(ans).length, correct, total: +u.total || 0, son };
    });
  });
  if (!en) return null;
  delete en.t;
  return en;
}

/**
 * Tur 14 A6: çalışma planı görevleri — Bugün'deki "Çalışma planın" listesi ve Sıradaki adım kartının 4. önceliği;
 * Çalış merkezi (calis.html) aynı listeyi kullanır ("bugün ne çalışayım" iki ekranda aynı cevabı verir).
 * index.html'deki satır içi hesaptan taşındı; sıra ve metinler aynıdır. Saf: DOM ve depolama okumaz.
 * g = { summary: APMEBERRA.summary() çıktısı ({courses:[{page,name,units:[{id,title,total,answered,correct}]}], openErrors, answered}),
 *       mezun: bool (K5-b: mezunda AP kayıt hatırlatması yok), kayitSon: "YYYY-MM-DD" | null (AP sipariş son günü),
 *       seviye: apmeberra:seviye:v1 ({devam, raporlar}) | null, bugun: "YYYY-MM-DD" | Date,
 *       premium: bool (false: ücretsiz plan → kilitli ünitelere yönlendirme yok; verilmezse kısıt yok),
 *       kutuUcretsiz: (sayfa, kutuId) => bool (isteğe bağlı; yoksa apKutuUcretsizMi) }
 * Dönüş: [{ ikon: "redo"|"target"|"play"|"book", title, desc, href, linkText }]
 */
function apCalismaPlani(g) {
  g = g || {};
  const s = g.summary || {};
  const courses = apDiz(s.courses), acik = apDiz(s.openErrors);
  const out = [];
  const gorev = (ikon, title, desc, href, linkText) => ({ ikon, title, desc, href, linkText });
  // Ücretsiz planda kilitli ünite (AP_UCRETSIZ_KUTULAR) önerilmez
  const kutuAcik = typeof g.kutuUcretsiz === "function" ? g.kutuUcretsiz : (typeof apKutuUcretsizMi === "function" ? apKutuUcretsizMi : () => true);
  const kilitli = (c, u) => g.premium === false && !kutuAcik(c.page, u.id);
  if (acik.length) {
    const e0 = acik[0];
    out.push(gorev("redo", "Yanlışlarım’daki " + acik.length + " soruyu tekrar çöz", "En son yanlışın: " + (e0.topic || e0.id), "deneme.html?mod=yanlislar", "Yanlışlarımı çöz"));
  }
  let weakest = null;
  courses.forEach(c => apDiz(c.units).forEach(u => {
    if (!(u.answered >= 1) || kilitli(c, u)) return;
    const r = u.correct / u.answered;
    if (r < 0.75 && (!weakest || r < weakest.r)) weakest = { r, c, u };
  }));
  if (weakest) {
    out.push(gorev("target", "Zayıf üniteni güçlendir: " + weakest.u.title,
      weakest.c.name + " · şu an %" + Math.round(weakest.r * 100) + " doğru (" + weakest.u.answered + "/" + weakest.u.total + " çözüldü)",
      weakest.c.page + ".html#" + weakest.u.id, "Üniteye git"));
  }
  let next = null;
  courses.some(c => apDiz(c.units).some(u => { if (u.answered < u.total && !kilitli(c, u)) { next = { c, u }; return true; } return false; }));
  if (next) {
    out.push(gorev("play", (s.answered ? "Kaldığın yerden devam et: " : "Buradan başla: ") + next.u.title,
      next.c.name + " · " + next.u.answered + " / " + next.u.total + " soru çözüldü", next.c.page + ".html#" + next.u.id, "Devam et"));
  } else if (!s.answered) {
    out.push(gorev("play", "İlk soru bankanı çöz", "AP Calculus ile başla: her yanlışta konu hatırlatması ve adım adım çözüm görürsün.", "ap-calculus.html", "Calculus’u aç"));
  } else if (g.premium === false) {
    // Ücretsiz plan: açılmış derslerin ücretsiz üniteleri bitti → henüz açılmamış bir ders, o da yoksa Premium önerisi
    const yeni = courses.find(c => c && c.page && c.visited === false);
    if (yeni) out.push(gorev("play", "Yeni bir derse başla: " + yeni.name, "Her dersin ilk üniteleri ücretsiz: konu anlatımı ve AP tarzı sorular.", yeni.page + ".html", "Dersi aç"));
    else out.push(gorev("play", "Ücretsiz ünitelerin bitti, tebrikler!", "Açık ünitelerin hepsini çözdün. Premium ile kalan ünitelere, sınırsız ders denemesine ve genel denemeye geç.", "premium.html", "Premium’u incele"));
  }
  // Seviye testi: henüz rapor yoksa (AP odaklı ürün) her zaman listenin başında; rapor varsa AP kayıt son gününe ≤ 21 gün kala kayıt kararı
  const sonNo = apGunNo(g.kayitSon), bugunNo = apGunNo(g.bugun) != null ? apGunNo(g.bugun) : apGunNo(new Date());
  if (!g.mezun) {
    const kalan = sonNo != null && sonNo - bugunNo >= 0 ? sonNo - bugunNo : null;
    const sv = g.seviye && typeof g.seviye === "object" ? g.seviye : {};
    const raporlar = apDiz(sv.raporlar);
    let gunMetni = "";
    if (kalan != null) {
      const iso = String(g.kayitSon);
      const tarihTR = +iso.slice(8, 10) + " " + AP_AYLAR[+iso.slice(5, 7) - 1];
      gunMetni = (kalan === 0 ? "AP kaydının son günü bugün" : "AP kaydının son gününe (" + tarihTR + ") " + kalan + " gün kaldı") + ". ";
    }
    let it = null;
    if (sv.devam && apDiz(sv.devam.sira).length) it = gorev("target", "Yarım kalan seviye testini bitir", gunMetni + "Kaldığın yerden devam edebilirsin.", "seviye-testi.html", "Devam et");
    else if (!raporlar.length) it = gorev("target", "Seviye testini çöz", gunMetni + "Rapor, hangi derste ne kadar hazır olduğunu" + (kalan != null ? " ve kayıt kararını" : "") + " gösterir.", "seviye-testi.html", "Teste başla");
    else if (kalan != null && kalan <= 21) it = gorev("target", "Seviye raporuna göre kayıt kararını ver", gunMetni + "Son raporunu öğretmeninle gözden geçir.", "seviye-testi.html#rapor", "Raporu aç");
    if (it) out.unshift(it);
  }
  out.push(gorev("book", "Son tarihleri kontrol et", "Kayıt ve sınav tarihleri Takvimim’de kaynaklarıyla birlikte tutulur.", "rota.html", "Takvimim"));
  return out;
}

/**
 * v4: çalışma serisi (saf). Çalışma günü = en az bir soru cevabı (progress cevap zamanı `t`) ya da deneme (`tarih`)
 * olan yerel takvim günü. Bugün henüz çalışılmadıysa seri dünden geriye sayılır (gün bitene kadar kırılmaz).
 * bugun: Date | "YYYY-MM-DD". Dönüş: { seri, bugunVar, hafta: [{ etiket, gun, var, bugun, gelecek, donmus }] (Pzt–Paz) }
 * OYUN HOOK (seri koruma): donmus = apmeberra:seri:v1.donmus ["YYYY-MM-DD"] (isteğe bağlı). Bu günler seriyi bozmaz
 * ama sayılmaz da (sunucu hatırlatma kuralıyla aynı: server/API.md). oyun.js boş günlere korumayı otomatik uygular.
 */
function apCalismaSerisi(progress, denemeler, bugun, donmus) {
  const pad = n => String(n).padStart(2, "0");
  const anahtar = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const gunler = new Set();
  const ekle = t => { const v = Date.parse(t || ""); if (!isNaN(v)) gunler.add(anahtar(new Date(v))); };
  const pages = progress && progress.pages && typeof progress.pages === "object" ? progress.pages : {};
  Object.keys(pages).forEach(p => {
    const units = pages[p] && pages[p].units && typeof pages[p].units === "object" ? pages[p].units : {};
    Object.keys(units).forEach(u => {
      const ans = units[u] && units[u].answers && typeof units[u].answers === "object" ? units[u].answers : {};
      Object.keys(ans).forEach(q => ekle(ans[q] && ans[q].t));
    });
  });
  apDiz(denemeler).forEach(d => ekle(d && d.tarih));
  const m = typeof bugun === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(bugun) : null;
  const b0 = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(bugun || Date.now());
  const gun = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const bugunK = anahtar(b0);
  const bugunVar = gunler.has(bugunK);
  const korunan = new Set(apDiz(donmus).filter(x => typeof x === "string"));
  let seri = 0;
  // Korunan (dondurulmuş) gün zinciri kesmez; en eski korunan günden geriye de çalışılmış gün yoksa seri orada biter
  for (let d = bugunVar ? b0 : gun(b0, -1), i = 0; i < 4000; d = gun(d, -1), i++) {
    const k = anahtar(d);
    if (gunler.has(k)) seri++;
    else if (!korunan.has(k)) break;
  }
  const pzt = gun(b0, -((b0.getDay() + 6) % 7));
  const ETIKET = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const hafta = ETIKET.map((etiket, i) => {
    const k = anahtar(gun(pzt, i));
    return { etiket, gun: k, var: gunler.has(k), bugun: k === bugunK, gelecek: k > bugunK, donmus: !gunler.has(k) && korunan.has(k) };
  });
  return { seri, bugunVar, hafta };
}
// --- Bugün ekranı sonu ---

// --- Ders başlıklarının öğrenciye görünen hâli (saf) ---
// Kaynak başlıklar İngilizce CED adlarıyla kalır (apTocParse, deneme bankası üreticisi ve testler onları okur); ekranda
// "Unit 1: Limits — Ultra-Comprehensive Concept Mastery" → "Ünite 1 · Limits", "…: İnteraktif Soru İstasyonu" → "… · Sorular".
function apUniteGorunenAd(text) {
  let t = String(text || "").replace(/\s+/g, " ").trim();
  const quiz = /İnteraktif Soru İstasyonu/i.test(t);
  t = t.replace(/\s*[:\-–—]?\s*İnteraktif Soru İstasyonu.*$/i, "");
  let birim = false;
  t = t.replace(/\b(Units?|Section) ([0-9A-Z]+(?:\s*[–&-]\s*[0-9]+)?)\b( \(cont\.\))?(\s*(?::|—|–)\s*|\s+(?=[A-Z(]))?/g, (m, k, n, c, ayr) => {
    birim = true;
    return (/^Section/.test(k) ? "Bölüm " : "Ünite ") + n.replace(/\s+/g, " ") + (c ? " (devam)" : "") + (ayr ? " · " : "");
  });
  if (!birim) return quiz ? (t ? t + " · Sorular" : "Sorular") : t;
  if (!quiz) {
    // Anlatım başlığında konu adından sonraki pazarlama/alt başlık kuyruğu atılır ("— Ultra-Comprehensive Concept Mastery")
    const i = t.search(/(Ünite|Bölüm) [^·]*· /);
    if (i >= 0) { const j = t.indexOf(" · ", i) + 3; t = t.slice(0, j) + t.slice(j).split(" — ")[0]; }
  }
  return quiz ? t.replace(/\s*·\s*$/, "") + " · Sorular" : t;
}
/** Ders sayfasındaki h2 başlıklarını görünen hâline çevirir; asıl metin data-orijinal'de kalır (soru kaydı ve odak kodu onu okur). */
function initUniteMetinleri() {
  if (!/^ap-|^sinav-cents$/.test(apCurrentPage())) return;
  document.querySelectorAll(".main-container h2").forEach(h => {
    if (h.children.length || h.closest(".question-card, .feedback-box, .modal-overlay, .doc-toc, .ug-panel")) return;
    const yeni = apUniteGorunenAd(h.textContent);
    if (yeni && yeni !== h.textContent.replace(/\s+/g, " ").trim()) { h.dataset.orijinal = h.textContent; h.textContent = yeni; }
  });
}

// --- İçindekiler veri modeli (Tur 14): başlık metninden ünite anahtarı, numara ve kısa ad çıkarılır ---
// Yeni ünite eklemek için yalnızca ders sayfasına h2 yazmak yeter ("Unit 7: …" ve "Unit 7 …: İnteraktif Soru İstasyonu");
// İçindekiler ünite listesini, "Sorular" çipini ve grup başlığını kendisi kurar. Saf fonksiyonlar (DOM'suz).
const AP_TOC_QUIZ = /Soru İstasyonu|Question Station|Soru Bankası/i;
function apTocParse(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  const quiz = AP_TOC_QUIZ.test(raw);
  let t = raw.replace(/^AP [A-Za-z ]+?(AB\/BC|AB|BC|1|C)?\s*—\s*(?=(Units?|Section)\b)/, "").replace(/^AP [A-Za-z ]+(AB\/BC|1|C)?\s*—\s*/, "");
  const km = /\b(Units?|Section)\s+([0-9A-Z]+(?:\s*[–&-]\s*\d+)?)/.exec(t);
  const kind = km ? (/^Section/.test(km[1]) ? "section" : "unit") : null;
  const key = km ? kind + ":" + km[2].replace(/\s+/g, "") : null;
  const bc = /\bBC ONLY\b/.test(t);
  t = t.replace(/\s*\bBC ONLY\b/, "").trim();
  let num = null, label;
  if (quiz) {
    label = t.replace(/\s*[:\-–—]?\s*İnteraktif Soru İstasyonu.*$/i, "").replace(/\s*[:\-–—]?\s*(Soru İstasyonu|Question Station|Soru Bankası).*$/i, "").trim() || "Soru istasyonu";
  } else {
    const um = /^(?:Unit|Section)\s+([0-9A-Z]+)(?:\s*\(cont\.\))?\s*(?::|—|–|-)\s*(.+)$/.exec(t);
    if (um) { num = um[1]; label = um[2]; } else label = t;
    if (label.indexOf(" — ") > 6) label = label.split(" — ")[0];
  }
  if (label.length > 64) label = label.slice(0, 61).replace(/\s+\S*$/, "") + "…";
  return { raw, quiz, key, kind, num, bc, label };
}
/** Satırlar: ünite anlatımı + hemen ardından gelen aynı anahtarlı soru istasyonu tek satır (bağlantı + "Sorular" çipi). */
function apTocHtml(items) {
  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i], nx = items[i + 1];
    if (!it.quiz && it.num && nx && nx.quiz && nx.key && nx.key === it.key) { rows.push({ main: it, quiz: nx }); i++; }
    else rows.push({ main: it });
  }
  const unitRows = rows.filter(r => !r.main.quiz && r.main.num);
  const grouped = unitRows.length >= 3;
  const kind = grouped && unitRows.every(r => r.main.kind === "section") ? "section" : "unit";
  const unitWord = kind === "section" ? "bölüm" : "ünite";
  const a = (it, cls, inner, aria) => '<a href="#' + apEsc(it.id) + '"' + (cls ? ' class="' + cls + '"' : "") + (aria ? ' aria-label="' + apEsc(aria) + '"' : "") + ">" + inner + "</a>";
  let html = "", inUnits = false, afterUnits = false;
  rows.forEach(r => {
    const m = r.main, isUnit = grouped && !m.quiz && !!m.num;
    if (isUnit && !inUnits) { html += '<li class="toc-kicker" aria-hidden="true">' + (kind === "section" ? "Bölümler" : "Üniteler") + "</li>"; inUnits = true; }
    else if (grouped && inUnits && !isUnit && !m.quiz && !afterUnits) { html += '<li class="toc-kicker" aria-hidden="true">Ek bölümler</li>'; afterUnits = true; inUnits = false; }
    if (m.quiz) { html += '<li class="toc-quiz">' + a(m, "", '<span class="toc-q">Sorular</span> ' + apEsc(m.label)) + "</li>"; return; }
    const unitName = (m.kind === "section" ? "Section " : "Unit ") + (m.num || "");
    const tag = m.bc ? ' <span class="toc-tag">BC</span>' : "";
    const inner = isUnit ? '<span class="toc-num" aria-hidden="true">' + apEsc(m.num) + '</span><span class="toc-label"><span class="visually-hidden">' + apEsc(unitName) + ": </span>" + apEsc(m.label) + tag + "</span>"
      : apEsc(m.num ? unitName + ": " + m.label : m.label) + tag;
    html += "<li" + (r.quiz || isUnit ? ' class="toc-unit"' : "") + ">" + a(m, r.quiz || isUnit ? "toc-main" : "", inner) +
      (r.quiz ? a(r.quiz, "toc-chip", "Sorular", unitName + " soru istasyonu") : "") + "</li>";
  });
  return { list: html, units: grouped ? unitRows.length : 0, unitWord };
}

/**
 * v4 ünite görünümü (saf): ders sayfasının üst düzey bloklarını sıraya göre ünitelere ayırır.
 * bloklar: [{ baslik: apTocParse çıktısı | null }] (null: başlıksız blok, ör. eğitmen notu).
 * Kural: konu anlatımı yeni ünite açar; ardından gelen soru istasyonları o üniteye katılır; önünde anlatım olmayan
 * istasyon kendi ünitesidir; başlıklı diğer bloklar "ek bölüm"dür ve zinciri keser; başlıksız bloklar zinciri kesmez.
 * Ders adıyla başlayan istasyon ("AP Microeconomics & Macroeconomics: İnteraktif Soru İstasyonu") açık ünitenin dersinden
 * farklı bir derse aitse anlatımın ardından gelse bile kendi ünitesidir (Seçmeliler: CS A anlatımından sonra Ekonomi istasyonu).
 * Dönüş: { uniteler: [{ no, baslik, bloklar, anlatim, sorular, ders, num }], ekler: [{ blok, baslik }], genel: [blok] }
 * num: başlıktaki ünite/bölüm numarası ("Unit 2 (cont.)" → "2", "Unit A" → "A"; çoğul/numarasız başlıkta null).
 */
function apUniteGrupla(bloklar) {
  const uniteler = [], ekler = [], genel = [];
  let acik = null;
  const keyNum = p => (p.num ? String(p.num) : p.key && /^[0-9A-Z]+$/.test(p.key.split(":")[1]) ? p.key.split(":")[1] : null);
  (Array.isArray(bloklar) ? bloklar : []).forEach((b, i) => {
    const p = b && b.baslik;
    if (!p) { if (acik) acik.bloklar.push(i); else genel.push(i); return; }
    const anlatim = !p.quiz && (!!p.num || /^(AP [^—]+—\s*)?Units?\s+\d/.test(p.raw));
    if (anlatim) {
      const ad = String(p.label).split(" — ")[0];
      const dm = /^AP ([^—]+?)\s*—/.exec(p.raw);
      acik = { no: uniteler.length + 1, baslik: p.num ? (p.kind === "section" ? "Section " : "Unit ") + p.num + ": " + ad : ad, bloklar: [i], anlatim: true, sorular: 0, ders: dm ? "AP " + dm[1] : "", num: keyNum(p) };
      uniteler.push(acik);
    } else if (p.quiz) {
      // Anlatımlı ünite ardından gelen istasyonları toplar; anlatımsız (ya da başka derse ait) her istasyon ayrı ünitedir
      const qm = /^AP ([^:(—]+?)\s*(?:\(|:|—)/.exec(p.raw);
      const qDers = qm ? "AP " + qm[1] : "";
      if (!acik || !acik.anlatim || (qDers && acik.ders && qDers !== acik.ders)) {
        acik = { no: uniteler.length + 1, baslik: p.label, bloklar: [], anlatim: false, sorular: 0, ders: qDers, num: keyNum(p) };
        uniteler.push(acik);
      }
      acik.bloklar.push(i); acik.sorular++;
    } else {
      acik = null;
      ekler.push({ blok: i, baslik: p.label });
    }
  });
  return { uniteler, ekler, genel };
}

/**
 * Meberra ücretsiz ünite kuralı (açık ve belgeli; sıra numarasına göre DEĞİL).
 * Varsayılan: sayfadaki ilk N farklı ünite numarası açık (N = MEBERRA_URUN.ucretsiz.uniteSayisi, yoksa 2). Aynı numaralı
 * devam üniteleri ("Unit 2 (cont.): Circular Motion") o ünitenin parçasıdır → Physics'te Unit 1, Unit 2 ve Unit 2 (cont.) açık.
 * Numarasız ünite kendi sırasıyla sayılır. Sayfa istisnaları AP_UCRETSIZ_KURALI'nda:
 *   - ap-electives: tek sayfada birden çok ders var → her dersin (CS A, Ekonomi istasyonu, Micro, Macro) ilk ünitesi açık
 *   - ap-english: yalnızca 2 ünite (A, B) → ilki açık
 *   - sinav-cents: ilk 2 bölüm (Section 1–2) açık (ap- dışındaki tek ünite görünümlü sayfa)
 * Sayfa dışı kullanım (Bugün/Çalış görevleri, seviye testi önerileri) için ücretsiz soru kutuları AP_UCRETSIZ_KUTULAR'da;
 * araclar/testler/unite-birim-test.js bu listenin gerçek sayfalardaki kurala birebir uyduğunu denetler.
 */
const AP_UCRETSIZ_KURALI = {
  "ap-electives": { dersBasina: true },
  "ap-english": { n: 1 },
  "sinav-cents": { n: 2 }
};
/** Ücretsiz ünitelerin `no` değerleri (apUniteGrupla çıktısının uniteler dizisi üzerinde; saf). */
function apUcretsizUniteNolari(page, uniteler, n) {
  const k = AP_UCRETSIZ_KURALI[page] || {};
  const list = Array.isArray(uniteler) ? uniteler : [];
  if (k.dersBasina) {
    const gor = {};
    return list.filter(u => { const d = u.ders || ""; if (gor[d]) return false; gor[d] = 1; return true; }).map(u => u.no);
  }
  const sinir = k.n || n || 2, nolar = [], out = [];
  list.forEach(u => {
    const a = u.num != null ? "n:" + u.num : "#" + u.no;
    if (nolar.indexOf(a) < 0) nolar.push(a);
    if (nolar.indexOf(a) < sinir) out.push(u.no);
  });
  return out;
}
/** Ücretsiz ünitelerdeki soru kutuları (sayfa → kutu kimlikleri). Listede olmayan sayfa = kural yok (hepsi açık). */
const AP_UCRETSIZ_KUTULAR = {
  "ap-calculus": ["calc-unit1-quiz-container", "calc-unit2-quiz-container"],
  "ap-physics": ["phys-unit1-quiz-container", "phys-unit2-quiz-container", "phys-unit3-quiz-container"], // unit3 kutusu = Unit 2 (cont.)
  "ap-chemistry": ["chem-unit1-quiz-container", "chem-unit2-quiz-container"],
  "ap-biology": ["bio-unit1-quiz-container", "bio-unit2-quiz-container"],
  "ap-english": ["eng-reading-quiz-container"],
  "ap-electives": ["csa-quiz-container", "econ-quiz-container", "micro34-quiz-container", "micro56-quiz-container", "macro14-quiz-container", "macro56-quiz-container"],
  "sinav-cents": ["cents-reading-quiz-container", "cents-math-quiz-container"]
};
/** Bu soru kutusu ücretsiz planda açık mı? (saf; premium kontrolü çağırana aittir) */
function apKutuUcretsizMi(page, kutuId) {
  const l = AP_UCRETSIZ_KUTULAR[String(page || "").replace(/\.html?$/i, "")];
  return !l || l.indexOf(kutuId) >= 0;
}
/**
 * Sayfa içi çapa (ör. seviye testi portalCapa: "phys-unit3-wep-lecture", "unit1-quiz-section", "bio-unit3-lecture-section")
 * ücretsiz bir üniteye mi düşer? Çapa kökü ("…-quiz-section", "…-lecture(-section)" ekleri atılır) ile kutu kökü eşleşir.
 * Saf. Kuralı olmayan sayfada (ya da çapa yoksa) true; kurallı sayfada ücretsiz kutuyla eşleşmeyen çapa kilitli (false).
 */
function apCapaUcretsizMi(page, capa) {
  const l = AP_UCRETSIZ_KUTULAR[String(page || "").replace(/\.html?$/i, "")];
  if (!l || !capa) return true;
  const kok = String(capa).replace(/-(quiz-section|quiz-container|lecture-section|lecture|section)$/, "");
  const es = id => id === kok + "-quiz-container" || id.slice(-(kok.length + 16)) === "-" + kok + "-quiz-container";
  return l.some(es);
}

// --- v4 ünite görünümü (ders sayfaları): özet (?) · tek ünite (?unite=N) · tek ek bölüm (?bolum=K) ---
// İçerik tek dosyada kalır; bloklar yalnızca gizlenir/gösterilir. Eski #bağlantılar hedefin ünitesini açar.
// İlerleme kaydı değişmez (ünite kimliği = soru kutusu kimliği).
// Üyelik değişince (/api/me tazelemesi) ünite görünümünü yeniden çizer; initUniteGorunumu kurar.
let apUniteGorunumuYenile = null;
function initUniteGorunumu() {
  const page = apCurrentPage();
  if (!/^ap-|^sinav-cents$/.test(page)) return;
  const main = document.querySelector(".main-container");
  if (!main || document.body.classList.contains("has-unite")) return;
  const hero = main.querySelector(":scope > .hero-section, :scope > .page-head");
  const els = Array.from(main.children).filter(el => el !== hero && !/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName));
  const g = apUniteGrupla(els.map(el => {
    const h = Array.from(el.querySelectorAll("h2")).find(x => !x.closest(".question-card, .feedback-box, .modal-overlay"));
    return { baslik: h ? apTocParse(h.textContent) : null };
  }));
  if (g.uniteler.length < 2) return;
  document.body.classList.add("has-unite");

  // Ünite ilerlemesi: ünitedeki soru kutuları (initInteractiveQuiz'in işaretlediği _questionsData) + progress kaydı
  const kayit = ((apLoadProgress().pages || {})[page] || {}).units || {};
  g.uniteler.forEach(u => {
    let toplam = 0, cevap = 0, dogru = 0;
    u.bloklar.forEach(i => els[i].querySelectorAll("[id]").forEach(k => {
      if (!k._questionsData) return;
      const r = kayit[k.id] || {}, ans = r.answers && typeof r.answers === "object" ? r.answers : {};
      toplam += +r.total || k._questionsData.length;
      Object.keys(ans).forEach(q => { cevap++; if (ans[q] && ans[q].c) dogru++; });
    }));
    Object.assign(u, { toplam, cevap, dogru });
  });
  const ders = (APMEBERRA_COURSES.find(c => c.page === page) || {}).name || document.title.split("|")[0].trim();
  const base = page + ".html";
  // Ders adı üst etiketi yalnızca birden çok dersi karıştıran sayfada (Seçmeliler: CSA · Mikro · Makro), tutarlı olduğunda
  const anlatimlar = g.uniteler.filter(u => u.anlatim);
  const dersFarkli = anlatimlar.every(u => u.ders) && new Set(anlatimlar.map(u => u.ders)).size > 1;
  const yuzde = (a, b) => (b ? Math.round(a / b * 100) : 0);
  // Meberra: ücretsiz kullanıcıya açık üniteler AP_UCRETSIZ_KURALI ile (varsayılan ilk N ünite numarası; urun.js, yoksa 2).
  // Tarayıcı modunda hepsi açık. kilitli() her çağrıda üyeliği okur: üyelik tazelenince yeniden çizim doğru sonucu verir.
  const ucretsizN = (window.MEBERRA_URUN && window.MEBERRA_URUN.ucretsiz && window.MEBERRA_URUN.ucretsiz.uniteSayisi) || 2;
  const ucretsizNolar = apUcretsizUniteNolari(page, g.uniteler, ucretsizN);
  const kilitli = u => !apPremiumMu() && ucretsizNolar.indexOf(u.no) < 0;
  const bolumMu = g.uniteler.every(u => /^Section /.test(u.baslik));
  const birim = bolumMu ? "bölüm" : "ünite";

  // Özet paneli: ünite kartları + ek bölümler
  const panel = document.createElement("section");
  panel.className = "surface ug-panel";
  panel.setAttribute("aria-labelledby", "ug-baslik");
  const T = g.uniteler.reduce((a, u) => ({ t: a.t + u.toplam, c: a.c + u.cevap }), { t: 0, c: 0 });
  const panelCiz = () => { panel.innerHTML = '<div class="bg-sec-h"><h2 id="ug-baslik">' + (bolumMu ? "Bölümler" : "Üniteler") + '</h2><span class="ug-ozet">' + g.uniteler.length + " " + birim +
    (T.t ? " · " + T.c + " / " + T.t + " soru çözüldü" : "") + '</span></div><ol class="ug-liste">' +
    g.uniteler.map(u => {
      const durum = u.cevap ? u.cevap + " / " + u.toplam + " soru · %" + yuzde(u.dogru, u.cevap) + " doğru" : u.toplam ? u.toplam + " soru · başlanmadı" : "Konu anlatımı";
      const git = kilitli(u) ? APMEBERRA_ICONS.crown + "Premium" : !u.cevap ? "Başla" : u.cevap >= u.toplam ? "Tekrar et" : "Sürdür";
      return '<li><a class="ug-kart' + (u.cevap && u.cevap >= u.toplam ? " is-bitti" : "") + (kilitli(u) ? " is-kilitli" : "") + '" href="' + base + "?unite=" + u.no + '">' +
        '<span class="ug-no" aria-hidden="true">' + u.no + '</span><span class="ug-govde">' +
        (dersFarkli && u.ders ? '<span class="ug-ders">' + apEsc(u.ders) + "</span>" : "") + "<b>" + apEsc(apUniteGorunenAd(u.baslik)) + "</b><small>" + apEsc(durum) + "</small>" +
        (u.toplam ? '<span class="ug-cubuk" aria-hidden="true"><i style="--w:' + yuzde(u.cevap, u.toplam) + '%"></i></span>' : "") +
        '</span><span class="ug-git">' + git + " →</span></a></li>";
    }).join("") + "</ol>" +
    (g.ekler.length ? '<h3 class="ug-ek-h">Ek bölümler</h3><ul class="ug-ekler">' +
      g.ekler.map((e, k) => '<li><a class="ug-ek" href="' + base + "?bolum=" + (k + 1) + '">' + apEsc(apUniteGorunenAd(e.baslik)) + "</a></li>").join("") + "</ul>" : ""); };
  panelCiz();
  main.insertBefore(panel, hero ? hero.nextSibling : main.firstChild);

  // Ünite / ek bölüm üst ve alt şeritleri
  const ust = document.createElement("nav");
  ust.className = "ug-ust";
  ust.setAttribute("aria-label", "Ünite gezinmesi");
  const alt = document.createElement("nav");
  alt.className = "ug-alt";
  alt.setAttribute("aria-label", "Önceki ve sonraki ünite");

  const duvar = document.createElement("section");
  duvar.className = "surface ug-duvar";
  const tumu = [hero, panel, ust, alt, duvar].concat(els).filter(Boolean);
  const goster = liste => tumu.forEach(el => el.classList.toggle("ug-gizli", liste.indexOf(el) < 0));
  const baslik0 = document.title;
  function ciz(mod, n) {
    if (mod === "unite") {
      const u = g.uniteler[n - 1], o = g.uniteler[n - 2], s = g.uniteler[n];
      // Uzun anlatımda doğrudan sorulara inen kısayol (ünitenin ilk soru kutusu)
      let kutu = null;
      u.bloklar.some(i => (kutu = Array.from(els[i].querySelectorAll("[id]")).find(k => k._questionsData)));
      ust.innerHTML = '<a class="ug-geri" href="' + base + '">← ' + apEsc(ders) + " üniteleri</a>" +
        '<span class="ug-sag">' + (u.anlatim && kutu && !kilitli(u) ? '<a class="ug-sorular" href="#' + apEsc(kutu.id) + '">Sorulara geç ↓</a>' : "") +
        '<span class="ug-sayac">' + (bolumMu ? "Bölüm " : "Ünite ") + n + " / " + g.uniteler.length + "</span></span>";
      alt.innerHTML = (o ? '<a class="btn-ghost ug-onceki" href="' + base + "?unite=" + o.no + '">← Önceki: ' + apEsc(o.baslik) + "</a>" : "<span></span>") +
        (s ? '<a class="btn-energy ug-sonraki" href="' + base + "?unite=" + s.no + '">Sonraki ünite →</a>' : '<a class="btn-primary" href="' + base + '">Ünite listesine dön</a>');
      const ilk = els[u.bloklar[0]], son = els[u.bloklar[u.bloklar.length - 1]];
      ilk.parentNode.insertBefore(ust, ilk);
      if (kilitli(u)) {
        // Premium ünitesi: içerik gösterilmez, tanıtım paneli çıkar
        duvar.innerHTML = '<span class="ug-duvar-ico" aria-hidden="true">' + APMEBERRA_ICONS.crown + '</span>' +
          "<h2>" + apEsc(apUniteGorunenAd(u.baslik)) + " Premium'da</h2>" +
          "<p>Ücretsiz planda bu sayfada " + ucretsizNolar.length + " " + birim + " açık. Premium ile tüm " + (bolumMu ? "bölümlere" : "ünitelere") + ", sınırsız ders denemesine ve genel denemeye eriş.</p>" +
          '<ul class="ug-duvar-liste"><li>Tüm üniteler: konu anlatımı + AP tarzı sorular</li><li>Sınırsız ders denemesi ve genel deneme</li><li>Yanlışlarını tekrar et, ilerlemeni takip et</li></ul>' +
          '<div class="ug-duvar-eylem"><a class="btn-energy" href="premium.html">Premium' + "'" + 'a geç</a><a class="btn-ghost" href="fiyatlar.html">Planları karşılaştır</a></div>' +
          '<p class="ug-duvar-not">Ücretsiz üniteler: ' + g.uniteler.filter(x => !kilitli(x)).map(x => '<a href="' + base + "?unite=" + x.no + '">' + apEsc(apUniteGorunenAd(x.baslik)) + "</a>").join(" · ") + "</p>";
        ilk.parentNode.insertBefore(duvar, ilk);
        ilk.parentNode.insertBefore(alt, duvar.nextSibling);
        goster([ust, duvar, alt]);
        document.title = apUniteGorunenAd(u.baslik) + " — " + baslik0;
        return;
      }
      son.parentNode.insertBefore(alt, son.nextSibling);
      if (duvar.parentNode) duvar.parentNode.removeChild(duvar);
      goster([ust, alt].concat(u.bloklar.map(i => els[i])));
      konulariKatla(u);
      document.title = apUniteGorunenAd(u.baslik) + " — " + baslik0;
    } else if (mod === "bolum") {
      const e = g.ekler[n - 1];
      ust.innerHTML = '<a class="ug-geri" href="' + base + '">← ' + apEsc(ders) + "</a>";
      els[e.blok].parentNode.insertBefore(ust, els[e.blok]);
      goster([ust, els[e.blok]]);
      document.title = apUniteGorunenAd(e.baslik) + " — " + baslik0;
    } else {
      goster([hero, panel].concat(g.genel.map(i => els[i])));
      document.title = baslik0;
    }
  }
  // Uzun anlatım: konu kartları (.lecture-card) katlanır, ilki açık. İçerik yükseklik 0 ile gizlenir (display:none değil),
  // böylece MathJax gizli konuyu da doğru ölçüyle çizer. Hedef bağlantı kapalı konudaysa konu açılır.
  let kartSayac = 0;
  function konulariKatla(u) {
    const kartlar = [];
    u.bloklar.forEach(i => els[i].querySelectorAll(".lecture-card").forEach(k => kartlar.push(k)));
    if (kartlar.length < 2) return;
    const ac = (k, acik) => {
      k.classList.toggle("ug-kapali", !acik);
      const b = k.querySelector(":scope > .theory-title");
      if (b) b.setAttribute("aria-expanded", String(acik));
    };
    kartlar.forEach((k, j) => {
      if (k.dataset.ugKatla) return;
      const baslik = k.querySelector(":scope > .theory-title"), govde = k.querySelector(":scope > .theory-body");
      if (!baslik || !govde) return;
      k.dataset.ugKatla = "1";
      govde.id = govde.id || "ug-konu-" + (++kartSayac);
      baslik.setAttribute("role", "button");
      baslik.setAttribute("tabindex", "0");
      baslik.setAttribute("aria-controls", govde.id);
      baslik.classList.add("ug-konu-btn");
      const cevir = () => ac(k, k.classList.contains("ug-kapali"));
      baslik.addEventListener("click", cevir);
      baslik.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cevir(); } });
      ac(k, j === 0);
    });
    const hepsi = document.createElement("button");
    hepsi.type = "button";
    hepsi.className = "btn-ghost btn-sm ug-hepsi";
    const etiket = () => { hepsi.textContent = kartlar.every(k => !k.classList.contains("ug-kapali")) ? "Konuları kapat" : "Tüm konuları aç"; };
    hepsi.addEventListener("click", () => { const acilsin = kartlar.some(k => k.classList.contains("ug-kapali")); kartlar.forEach(k => ac(k, acilsin)); etiket(); });
    kartlar.forEach(k => k.querySelector(":scope > .theory-title") && k.querySelector(":scope > .theory-title").addEventListener("click", etiket));
    etiket();
    const sag = ust.querySelector(".ug-sag");
    if (sag) sag.insertBefore(hepsi, sag.firstChild);
    hedefKonuyuAc();
  }
  function hedefKonuyuAc() {
    const id = decodeURIComponent((window.location.hash || "").slice(1));
    const h = id ? document.getElementById(id) : null;
    const k = h && h.closest(".lecture-card.ug-kapali");
    if (k) { k.classList.remove("ug-kapali"); const b = k.querySelector(":scope > .theory-title"); if (b) b.setAttribute("aria-expanded", "true"); }
  }

  // Görünüm seçimi: ?unite / ?bolum; yoksa #hedef hangi bloktaysa o (eski bağlantılar ve sayfa içi çapalar)
  function coz() {
    const q = new URLSearchParams(window.location.search);
    const un = +q.get("unite"), bn = +q.get("bolum");
    const id = decodeURIComponent((window.location.hash || "").slice(1));
    const hedef = id ? document.getElementById(id) : null;
    if (hedef && !panel.contains(hedef)) {
      const i = els.findIndex(el => el.contains(hedef));
      const u = g.uniteler.find(x => x.bloklar.indexOf(i) >= 0);
      if (u) return ["unite", u.no];
      const k = g.ekler.findIndex(e => e.blok === i);
      if (k >= 0) return ["bolum", k + 1];
    }
    if (un >= 1 && un <= g.uniteler.length) return ["unite", un];
    if (bn >= 1 && bn <= g.ekler.length) return ["bolum", bn];
    return ["ozet", 0];
  }
  ciz.apply(null, coz());
  apUniteGorunumuYenile = () => { panelCiz(); ciz.apply(null, coz()); };
  // OYUN HOOK: öğrenme yolu (oyun.js) bu sayfanın gerçek ünite listesini okur (apUniteGrupla çıktısı + ücretsiz kuralı)
  window.APMEBERRA_UNITELER = {
    page, panel,
    uniteler: g.uniteler.map(u => ({ no: u.no, ad: apUniteGorunenAd(u.baslik), toplam: u.toplam, cevap: u.cevap, kilitli: kilitli(u),
      kutular: [].concat.apply([], u.bloklar.map(i => Array.from(els[i].querySelectorAll("[id]")).filter(k => k._questionsData).map(k => k.id))) }))
  };
  window.addEventListener("hashchange", () => {
    ciz.apply(null, coz());
    const h = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (h) h.scrollIntoView();
  });
}

// --- İçindekiler (uzun sayfalar): geniş ekranda yapışkan yan sütun, dar ekranda açılır liste ---
// Ağır DOM işlemi yok: yalnızca ana kabın üst düzey çocukları bir sarmalayıcıya taşınır (tek seferlik).
function initDocToc() {
  const page = apCurrentPage();
  if (!/^ap-|^sinav-cents$|-muhendislik$|^istanbul-sinav-rehberi$/.test(page)) return;
  const main = document.querySelector(".main-container");
  if (!main || main.querySelector(".doc-layout") || document.body.classList.contains("has-unite")) return;
  const heads = Array.from(main.querySelectorAll("h2")).filter(h => !h.closest(".modal-overlay, .hero-section, .question-card, .feedback-box"));
  // Ders sayfalarında her zaman (uzun anlatım); kısa rehber sayfalarında yan sütun yer kaplamasın
  if (heads.length < (/^ap-/.test(page) ? 3 : 6)) return;

  const items = heads.map((h, i) => {
    if (!h.id) h.id = "bolum-" + (i + 1);
    return Object.assign(apTocParse(h.textContent), { id: h.id, el: h });
  });
  const html = apTocHtml(items);
  // Görünen metin: "Unit 5: …" → "Ünite 5 · …" (apTocHtml çıktısı testlerde İngilizce kalır)
  html.list = html.list.replace(/>([^<]+)</g, (m, x) => /\b(Units?|Section) [0-9A-Z]/.test(x) ? ">" + (x.match(/^\s*/)[0]) + apUniteGorunenAd(x) + (/\s$/.test(x) ? " " : "") + "<" : m)
    .replace(/aria-label="(Unit|Section) ([^"]*?) soru istasyonu"/g, (m, k, n) => 'aria-label="' + (k === "Section" ? "Bölüm " : "Ünite ") + n + ' soruları"');

  const hero = main.querySelector(":scope > .hero-section, :scope > .page-head");
  const layout = document.createElement("div");
  layout.className = "doc-layout";
  const toc = document.createElement("nav");
  toc.className = "doc-toc";
  toc.setAttribute("aria-label", "Sayfa içeriği");
  toc.innerHTML = '<details><summary><span>İçindekiler' + (html.units ? ' <span class="toc-meta">· ' + html.units + " " + html.unitWord + "</span>" : "") +
    '</span><span class="visually-hidden"> (' + items.length + ' bölüm)</span>' + APMEBERRA_ICONS.toc + '</summary><ol>' + html.list + '</ol></details>';
  const body = document.createElement("div");
  body.className = "doc-body";
  const kids = Array.from(main.childNodes);
  const start = hero ? kids.indexOf(hero) + 1 : 0;
  kids.slice(start).forEach(n => body.appendChild(n));
  layout.appendChild(toc);
  layout.appendChild(body);
  main.appendChild(layout);
  document.body.classList.add("has-toc");

  const det = toc.querySelector("details");
  const mq = window.matchMedia("(min-width: 1200px)");
  const sync = () => { det.open = mq.matches; };
  sync();
  if (mq.addEventListener) mq.addEventListener("change", sync);
  // Geniş ekranda özet satırı başlıktır, katlanmaz
  det.querySelector("summary").addEventListener("click", e => { if (mq.matches) e.preventDefault(); });
  // Dar ekranda bağlantı seçilince listeyi kapat
  toc.addEventListener("click", e => { if (e.target.closest("a") && !mq.matches) det.open = false; });

  // Etkin bölüm vurgusu (IntersectionObserver; yoksa sessizce atlanır)
  if (!("IntersectionObserver" in window)) return;
  const links = new Map(items.map(it => [it.id, toc.querySelector('a[href="#' + CSS.escape(it.id) + '"]')]));
  let current = null;
  const olEl = toc.querySelector("ol");
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      if (current) current.classList.remove("is-active");
      current = links.get(en.target.id);
      if (current) {
        current.classList.add("is-active");
        current.setAttribute("aria-current", "true");
        links.forEach(l => { if (l !== current) l.removeAttribute("aria-current"); });
        // Tur 14: uzun ünite listesinde etkin satır yan sütunun kendi kaydırma alanında görünür kalır (pencere kaydırılmaz)
        if (mq.matches && olEl.scrollHeight > olEl.clientHeight) {
          const row = current.closest("li") || current, top = row.offsetTop, bottom = top + row.offsetHeight;
          if (top < olEl.scrollTop || bottom > olEl.scrollTop + olEl.clientHeight) olEl.scrollTop = Math.max(0, top - olEl.clientHeight / 3);
        }
      }
    });
  }, { rootMargin: "-72px 0px -70% 0px" });
  items.forEach(it => io.observe(it.el));
}

// --- LIVE COUNTDOWN TIMER ---
function initCountdown() {
  const elDays = document.getElementById("timer-days");
  const elHours = document.getElementById("timer-hours");
  const elMins = document.getElementById("timer-mins");

  if (!elDays) return;

  // Varsayılan hedef: Mayıs 2027 AP sınav dönemi. Sayfa isterse data-target ile değiştirebilir.
  const targetDate = new Date(elDays.dataset.target || "2027-05-03T08:00:00").getTime();

  // "GÜN" gibi alt öğeleri silmeden yalnızca sayıyı güncelle
  const daysSink = (function () {
    const tn = Array.from(elDays.childNodes).find(n => n.nodeType === 3);
    if (elDays.children.length && tn) return { set: v => { tn.nodeValue = v + " "; } };
    return { set: v => { elDays.textContent = v; } };
  })();

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      daysSink.set(days);
      if (elHours) elHours.textContent = String(hours).padStart(2, '0');
      if (elMins) elMins.textContent = String(mins).padStart(2, '0');
    } else {
      daysSink.set("0");
      if (elHours) elHours.textContent = "00";
      if (elMins) elMins.textContent = "00";
    }
  }

  update();
  setInterval(update, 60000);
}

// --- ALMANYA KMK ELIGIBILITY CHECKER ---
function initKMKChecker() {
  const btn = document.getElementById("btn-check-kmk");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const math = document.getElementById("kmk-math").value;
    const science = document.getElementById("kmk-science").value;
    const lang = document.getElementById("kmk-lang").value;
    const elective = document.getElementById("kmk-elective").value;

    const mathScore = parseInt(document.getElementById("kmk-math-score").value) || 0;
    const scienceScore = parseInt(document.getElementById("kmk-science-score").value) || 0;
    const langScore = parseInt(document.getElementById("kmk-lang-score").value) || 0;
    const electiveScore = parseInt(document.getElementById("kmk-elective-score").value) || 0;

    const resultBox = document.getElementById("kmk-result");
    const statusBadge = document.getElementById("kmk-status-badge");
    const statusText = document.getElementById("kmk-status-text");

    // anabin USA-BV07 (12 Ekim 2026 mevzuat düzeltmesi): fen dersi yalnızca Biology, Chemistry
    // ya da Physics C (Mechanics + E&M birlikte). Physics 1 fen dersi sayılmaz.
    // Ek ders: ör. tarih, CS A ya da Micro + Macro BİRLİKTE (tek başına Micro/Macro sayılmaz).
    const hasMath = (math === "calc_ab" || math === "calc_bc");
    const hasScience = (science === "physics_c" || science === "chemistry" || science === "biology");
    const hasLang = (lang === "eng_lang" || lang === "eng_lit" || lang === "german" || lang === "french" || lang === "spanish" || lang === "latin");
    const hasElective = (elective === "cs_a" || elective === "economics" || elective === "history" || elective === "second_science");

    const allScoresValid = (mathScore >= 3 && scienceScore >= 3 && langScore >= 3 && electiveScore >= 3);

    const kuralNotu = `• <em>Önemli:</em> Bu kural (anabin USA-BV07) yalnızca <strong>ABD High School Diploma ile birlikte</strong> uygulanır ve <strong>Türk lise diplomasına giriş hakkı vermez</strong>; anabin'in notuna göre AP belgesi tek başına giriş hakkı açmaz. Türk diplomasıyla Almanya'da giriş hakkı: YKS'de ilgili puan türünde 180'in üzerinde puan ve en az 4 yıllık örgün bir lisans programına <strong>yerleşme</strong> (anabin TUR-BV05); bu yalnızca yerleşilen alan ve komşu alanlar için geçerlidir. Yerleşme yoksa Studienkolleg yolu da yoktur. Kaynak: <a href="https://anabin.kmk.org" target="_blank" rel="noopener">anabin.kmk.org</a>.<br/>`;

    if (hasMath && hasScience && hasLang && hasElective && allScoresValid) {
      statusBadge.textContent = "Ders kombinasyonu KMK AP kuralına uygun (yalnızca ABD diploması için; Türk diplomasına giriş hakkı vermez)";
      statusBadge.classList.remove("is-bad");
      statusBadge.classList.add("is-ok");
      statusText.innerHTML = `
        <strong>Ders kombinasyonun ABD diploması için tanımlı kurala uyuyor</strong> (${mathScore}, ${scienceScore}, ${langScore}, ${electiveScore} puan).<br/>
        ${kuralNotu}
        • <em>Doğa bilimi notu:</em> Fizik yalnızca <strong>Physics C: Mechanics + Physics C: E&amp;M birlikte</strong> sayılır; Physics 1 fen dersi sayılmaz.${elective === "second_science" ? " İkinci bir fen dersinin (ör. Physics C ile Chemistry birlikte) 4. ek ders olarak sayılıp sayılmayacağı: <strong>Yoruma açık</strong> (anabin'de teyit gerekir). Güvenli 4. ders: CS A ya da Micro + Macro birlikte." : " Physics C ve Chemistry ayrı derslerdir; ikisini de alabilirsin, ikisi de fen şartını karşılar."}<br/>
        • <em>Dil:</em> İngilizce programlar için genellikle IELTS/TOEFL istenir; kesin puan her programın sayfasında yazar. Kaynaklar için <a href="sartlar.html?ulke=de">Ülkem</a> sayfasına bak.
      `;
    } else {
      let missing = [];
      if (!hasMath) missing.push("Calculus AB veya BC");
      if (!hasScience) missing.push(science === "physics_1" ? "Doğa Bilimi (Physics 1 sayılmaz; Biology, Chemistry ya da Physics C Mechanics + E&M birlikte)" : "Doğa Bilimi (Biology, Chemistry ya da Physics C Mechanics + E&M birlikte)");
      if (!hasLang) missing.push("Dil (English Lang/Lit, French, Spanish, Latin ya da German)");
      if (!hasElective) missing.push((elective === "micro_only" || elective === "macro_only") ? "Ek ders (Micro ya da Macro tek başına sayılmaz; ikisi birlikte gerekir)" : "Ek ders (ör. CS A, tarih ya da Micro + Macro birlikte)");
      if (!allScoresValid) missing.push("Her 4 dersten de en az 3 ve üzeri puan alınması");

      statusBadge.textContent = "Ders kombinasyonu KMK AP kuralını karşılamıyor";
      statusBadge.classList.remove("is-ok");
      statusBadge.classList.add("is-bad");
      statusText.innerHTML = `
        <strong>Dikkat${apStudentName() ? " " + escapeHtml(apStudentName()) : ""}:</strong> Mevcut seçiminde KMK (anabin USA-BV07) kuralına göre eksikler bulunuyor:<br/>
        • <em>Eksik Kriterler:</em> ${missing.join(", ")}.<br/>
        ${kuralNotu}
        • Ayrıntı ve kaynaklar için <a href="almanya-muhendislik.html">Almanya detaylı rehberine</a> bak.
      `;
    }

    resultBox.style.display = "block";
  });
}

// (İtalya eşleştirici kaldırıldı — doğrulanmış program listesi italya-muhendislik.html içindedir.)

// --- FORMULA COPY HELPER ---
function initFormulaCopies() {
  document.querySelectorAll(".formula-card").forEach(card => {
    card.style.cursor = "pointer";
    card.title = "Kopyalamak için tıkla";
    card.addEventListener("click", () => {
      const code = card.querySelector(".formula-code");
      if (code) {
        navigator.clipboard.writeText(code.innerText).then(() => {
          const original = card.style.borderColor;
          card.style.borderColor = "#10b981";
          setTimeout(() => { card.style.borderColor = original; }, 1000);
        });
      }
    });
  });
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ==========================================================================
// INTERACTIVE QUESTION BANK & DIAGNOSTIC REMEDIATION ENGINE (v2)
// - Cevaplar ve Yanlışlarım localStorage'da (try/catch) saklanır.
// - Her quiz kendi istatistiğini tutar (birden çok ünite aynı sayfada).
// - Klavye: şıklar <button>; odak bir soru kartındayken A–E tuşları seçer,
//   ↑/↓ şıklar arasında gezinir. Geri bildirim aria-live ile duyurulur.
// Soru şeması DEĞİŞMEDİ: {id, number, topic, difficulty, source, question,
//   options:[{id,text,isCorrect,errorTag,remediation}], generalRemediation, stepByStepSolution}
// ==========================================================================

// Konteyner bazlı durum: quizStats[containerId] = {total, answered, correct, wrong}.
// Geriye uyum: üst düzey total/answered/correct/wrong alanları son güncellenen quiz'i yansıtır.
let quizStats = {
  total: 0,
  answered: 0,
  correct: 0,
  wrong: 0
};
let apQuizInitOrder = 0;

// --- Depolama yardımcıları ---
function apLoadProgress() {
  const p = apStoreGet(APMEBERRA_KEYS.progress, null);
  return (p && typeof p === "object" && p.pages) ? p : { v: 1, pages: {} };
}
function apLoadErrors() {
  const e = apStoreGet(APMEBERRA_KEYS.errors, null);
  return (e && typeof e === "object" && e.items) ? e : { v: 1, items: {} };
}
function apUnitRecord(progress, page, containerId) {
  if (!progress.pages[page]) progress.pages[page] = { units: {} };
  const units = progress.pages[page].units;
  if (!units[containerId]) units[containerId] = { title: "", total: 0, answers: {} };
  if (!units[containerId].answers) units[containerId].answers = {};
  return units[containerId];
}
function apUnitTitle(container, containerId) {
  const section = container.closest("section");
  const t = section && section.querySelector(".panel-title");
  const tMetin = t ? (t.dataset.orijinal || t.textContent) : "";
  if (tMetin.trim()) {
    const clean = tMetin.replace(/\s+/g, " ").trim()
      .replace(/\s*[:\-–—]?\s*(İnteraktif|Interactive)\b.*$/i, "").trim();
    if (clean) return clean;
  }
  // Yedek: konteyner kimliğinden türet (ör. phys-unit3-wep-quiz-container -> "Unit 3 · WEP")
  const m = containerId.match(/unit[-_]?(\d+)(?:[-_]([a-z0-9]+))?[-_]quiz/i);
  if (m) return "Unit " + m[1] + (m[2] ? " · " + m[2].toUpperCase() : "");
  return containerId;
}
function apStripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = String(html || "");
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

/** Bir quiz konteynerinin istatistiğini depodan hesaplar. */
function apComputeUnitStats(containerId) {
  const container = document.getElementById(containerId);
  const data = (container && container._questionsData) || [];
  const rec = apLoadProgress().pages[apCurrentPage()];
  const answers = (rec && rec.units[containerId] && rec.units[containerId].answers) || {};
  const validIds = new Set(data.map(q => q.id));
  let answered = 0, correct = 0, wrong = 0;
  const wrongIds = [];
  Object.keys(answers).forEach(id => {
    if (!validIds.has(id)) return;
    answered++;
    if (answers[id].c) correct++; else { wrong++; wrongIds.push(id); }
  });
  return { total: data.length, answered, correct, wrong, wrongIds };
}

// --- Ekran okuyucu duyurusu ---
function apAnnounce(containerId, message) {
  const live = document.getElementById(`${containerId}-live`);
  if (!live) return;
  live.textContent = "";
  window.setTimeout(() => { live.textContent = message; }, 30);
}

function initInteractiveQuiz(containerId, questionsData) {
  const container = document.getElementById(containerId);
  if (!container || !questionsData || !questionsData.length) return;

  container._questionsData = questionsData;
  container._wrongOnly = false;

  // Ünite meta verisini kaydet (İlerleme sayfası toplam soru sayısını buradan öğrenir)
  const page = apCurrentPage();
  const progress = apLoadProgress();
  const unit = apUnitRecord(progress, page, containerId);
  unit.title = apUnitTitle(container, containerId);
  unit.total = questionsData.length;
  unit.seen = new Date().toISOString();
  // Sayfadaki görünüm sırası (İlerleme sayfası üniteleri bu sırayla listeler)
  const domIdx = Array.from(document.querySelectorAll("[id$=\"-quiz-container\"]")).indexOf(container);
  unit.order = domIdx >= 0 ? domIdx : (100 + apQuizInitOrder++);
  apStoreSet(APMEBERRA_KEYS.progress, progress);

  // Gösterge paneli (eski id'ler korunur: -total-count, -answered-count, -correct-count, -wrong-count, -accuracy-rate)
  const dashboard = document.createElement("div");
  dashboard.className = "quiz-dashboard-bar";
  dashboard.id = `${containerId}-dashboard`;
  dashboard.innerHTML = `
    <div class="quiz-dash-row">
      <div class="quiz-dash-stats">
        <div class="quiz-stat-pill"><span>Toplam</span><span class="quiz-stat-val" id="${containerId}-total-count">${questionsData.length}</span></div>
        <div class="quiz-stat-pill"><span>Çözülen</span><span class="quiz-stat-val" id="${containerId}-answered-count">0</span></div>
        <div class="quiz-stat-pill is-ok"><span>Doğru</span><span class="quiz-stat-val" id="${containerId}-correct-count">0</span></div>
        <div class="quiz-stat-pill is-bad"><span>Yanlış</span><span class="quiz-stat-val" id="${containerId}-wrong-count">0</span></div>
        <div class="quiz-stat-pill"><span>Başarı</span><span class="quiz-stat-val" id="${containerId}-accuracy-rate">-%</span></div>
      </div>
      <div class="quiz-dash-actions">
        <button type="button" class="btn-ghost" id="${containerId}-wrong-only" aria-pressed="false" onclick="toggleWrongOnly('${containerId}')" disabled>
          Sadece yanlışlarımı tekrar çöz
        </button>
        <button type="button" class="btn-ghost btn-danger" onclick="resetQuiz('${containerId}')" title="Bu ünitedeki cevaplarını sil (Yanlışlarım korunur)">
          Sıfırla
        </button>
      </div>
    </div>
    <div class="quiz-progress">
      <div class="quiz-progress-track" role="progressbar" aria-label="Ünite ilerlemesi" aria-valuemin="0" aria-valuemax="${questionsData.length}" aria-valuenow="0" id="${containerId}-progressbar">
        <span class="quiz-progress-ok" id="${containerId}-progress-ok" style="width:0%"></span>
        <span class="quiz-progress-bad" id="${containerId}-progress-bad" style="width:0%"></span>
      </div>
      <span class="quiz-progress-label" id="${containerId}-progress-label">0 / ${questionsData.length}</span>
    </div>
    <div class="quiz-filter-note" id="${containerId}-filter-note" hidden></div>
    <div class="visually-hidden" aria-live="polite" role="status" id="${containerId}-live"></div>
  `;
  container.innerHTML = "";
  container.appendChild(dashboard);
  const hintEl = document.createElement("p");
  hintEl.className = "kbd-hint";
  hintEl.innerHTML = "İpucu: Bir şıkka odaklanıp <kbd>A</kbd>–<kbd>D</kbd> tuşlarıyla seçebilir, <kbd>↑</kbd>/<kbd>↓</kbd> ile şıklar arasında gezinebilirsin. İlerlemen otomatik kaydedilir.";
  container.appendChild(hintEl);

  const frag = document.createDocumentFragment();
  questionsData.forEach((q, qIndex) => frag.appendChild(apBuildQuestionCard(containerId, q, qIndex)));
  container.appendChild(frag);

  const empty = document.createElement("div");
  empty.className = "quiz-empty";
  empty.id = `${containerId}-empty`;
  empty.hidden = true;
  empty.innerHTML = "<strong>Bu ünitede yanlış sorun kalmadı.</strong><br>Tüm sorulara dönmek için yukarıdaki düğmeyi kullan.";
  container.appendChild(empty);

  // Kayıtlı cevapları geri yükle
  const answers = unit.answers || {};
  questionsData.forEach(q => {
    const a = answers[q.id];
    if (a && a.s) apApplyAnswer(containerId, q, a.s, false);
  });

  // Klavye ile şık seçimi (tek dinleyici / konteyner)
  if (!container._keyHandler) {
    container._keyHandler = true;
    container.addEventListener("keydown", (e) => apQuizKeydown(containerId, e));
  }

  updateQuizDashboard(containerId);

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([container]).catch(() => {});
  }
}

function apBuildQuestionCard(containerId, q, qIndex) {
  const card = document.createElement("article");
  card.className = "question-card";
  card.id = `q-card-${q.id}`;
  card.dataset.qid = q.id;
  card.setAttribute("aria-labelledby", `q-title-${q.id}`);

  const optionsHtml = q.options.map(opt => `
      <button type="button" class="option-btn" id="opt-btn-${q.id}-${opt.id}" data-opt="${opt.id}" onclick="handleOptionClick('${containerId}', '${q.id}', '${opt.id}')">
        <span class="option-letter" aria-hidden="true">${opt.id}</span>
        <span class="visually-hidden">Şık ${opt.id}: </span>
        <span>${opt.text}</span>
      </button>`).join("");

  const diff = String(q.difficulty || "").toLowerCase();
  const diffLabel = { easy: "KOLAY", medium: "ORTA", hard: "ZOR" }[diff] || String(q.difficulty || "").toUpperCase();

  card.innerHTML = `
    <div class="question-header">
      <div class="question-head-main">
        <span class="question-num-badge" id="q-title-${q.id}">Soru ${q.number || qIndex + 1}</span>
        <span class="question-topic">${q.topic || ""}</span>
      </div>
      <div class="question-tags">
        ${diff ? `<span class="question-tag ${diff}" title="${q.difficulty}">${diffLabel}</span>` : ""}
        ${q.source ? `<span class="question-tag source">${q.source}</span>` : ""}
      </div>
    </div>
    <div class="question-body">${q.question}</div>
    <div class="options-container" id="opts-container-${q.id}" role="group" aria-label="Soru ${q.number || qIndex + 1} seçenekleri">
      ${optionsHtml}
    </div>
    <div class="feedback-box" id="feedback-${q.id}" style="display:none;"></div>
  `;
  return card;
}

function apQuizKeydown(containerId, e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  if (!t || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
  const card = t.closest && t.closest(".question-card");
  if (!card) return;
  const qid = card.dataset.qid;
  const opts = Array.from(card.querySelectorAll(".option-btn"));

  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    const i = opts.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    const next = e.key === "ArrowDown" ? (opts[i + 1] || opts[0]) : (opts[i - 1] || opts[opts.length - 1]);
    next.focus();
    return;
  }
  const key = (e.key || "").toUpperCase();
  if (!/^[A-E]$/.test(key)) return;
  const btn = opts.find(b => (b.dataset.opt || "").toUpperCase() === key);
  if (!btn) return;
  const optsContainer = document.getElementById(`opts-container-${qid}`);
  if (optsContainer && optsContainer.dataset.answered === "true") return;
  e.preventDefault();
  btn.focus();
  handleOptionClick(containerId, qid, btn.dataset.opt);
}

/**
 * Bir soru cevabını kaydeder: quiz ilerlemesi (apmeberra:quiz:v1) + Yanlışlarım (apmeberra:errors:v1).
 * Ders sayfası (handleOptionClick) ve İlerleme › Bugünkü tekrar (oyun.js) aynı kaydı kullanır.
 * meta: { title, total } — total verilmezse kayıtlı değer korunur. Dönüş: doğru mu (bool).
 */
function apCevapKaydet(page, containerId, q, selectedOptionId, meta) {
  meta = meta || {};
  const selectedOpt = q.options.find(o => o.id === selectedOptionId);
  const correctOpt = q.options.find(o => o.isCorrect);
  const isCorrect = !!(selectedOpt && selectedOpt.isCorrect);
  const questionId = q.id;
  const now = new Date().toISOString();

  // 1) Cevabı kaydet
  const progress = apLoadProgress();
  const unit = apUnitRecord(progress, page, containerId);
  if (!unit.title && meta.title) unit.title = meta.title;
  if (meta.total) unit.total = meta.total;
  const yeniCevap = !unit.answers[questionId];
  unit.answers[questionId] = { s: selectedOptionId, c: isCorrect, t: now };
  apStoreSet(APMEBERRA_KEYS.progress, progress);
  // 2) Yanlışlarım
  const errors = apLoadErrors();
  const key = page + "|" + questionId;
  if (!isCorrect) {
    const prev = errors.items[key];
    errors.items[key] = {
      id: questionId,
      page: page,
      unit: containerId,
      unitTitle: unit.title,
      number: q.number || null,
      topic: apStripHtml(q.topic),
      errorTag: apStripHtml(selectedOpt && selectedOpt.errorTag ? selectedOpt.errorTag : "Kavramsal veya işlemsel eksiklik."),
      selected: selectedOptionId,
      correct: correctOpt ? correctOpt.id : "",
      date: now,
      firstDate: prev ? (prev.firstDate || prev.date) : now,
      count: prev ? (prev.count || 1) + 1 : 1,
      resolved: false
    };
    apStoreSet(APMEBERRA_KEYS.errors, errors);
  } else if (errors.items[key] && !errors.items[key].resolved) {
    errors.items[key].resolved = true;
    errors.items[key].resolvedDate = now;
    apStoreSet(APMEBERRA_KEYS.errors, errors);
  }

  // OYUN HOOK: oyunlaştırma katmanı (assets/js/oyun.js) cevapları bu olaylarla izler (XP, hedef, görev, akıllı tekrar).
  // "meberra:unite-bitti" yalnızca ünitenin son cevapsız sorusu cevaplandığında bir kez gider.
  try {
    window.dispatchEvent(new CustomEvent("meberra:cevap", { detail: { sayfa: page, soruId: questionId, dogru: isCorrect, kap: containerId, yeni: yeniCevap } }));
    const cevapSay = Object.keys(unit.answers).length;
    if (yeniCevap && unit.total > 0 && cevapSay >= unit.total) {
      let dogruSay = 0;
      Object.keys(unit.answers).forEach(k => { if (unit.answers[k] && unit.answers[k].c) dogruSay++; });
      window.dispatchEvent(new CustomEvent("meberra:unite-bitti", { detail: { sayfa: page, kap: containerId, baslik: unit.title || containerId, cevap: cevapSay, dogru: dogruSay, toplam: unit.total } }));
    }
  } catch (e) { /* eski tarayıcı: olay yok, kayıt yine yapıldı */ }
  return isCorrect;
}

function handleOptionClick(containerId, questionId, selectedOptionId) {
  const container = document.getElementById(containerId);
  if (!container || !container._questionsData) return;

  const q = container._questionsData.find(item => item.id === questionId);
  if (!q) return;

  const optsContainer = document.getElementById(`opts-container-${questionId}`);
  if (!optsContainer || optsContainer.dataset.answered === "true") return;

  const correctOpt = q.options.find(o => o.isCorrect);
  const isCorrect = apCevapKaydet(apCurrentPage(), containerId, q, selectedOptionId,
    { title: apUnitTitle(container, containerId), total: container._questionsData.length });

  // 3) Arayüz
  const feedbackBox = apApplyAnswer(containerId, q, selectedOptionId, true);

  apAnnounce(containerId, isCorrect
    ? `Doğru cevap. Seçenek ${selectedOptionId}.`
    : `Yanlış cevap. Seçtiğin ${selectedOptionId}, doğru seçenek ${correctOpt ? correctOpt.id : ""}. Açıklama aşağıda.`);

  if (feedbackBox && window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([feedbackBox]).catch(() => {});
  }

  updateQuizDashboard(containerId);
}

/** Bir sorunun cevaplanmış görünümünü uygular (yeni tıklama ya da geri yükleme). */
function apApplyAnswer(containerId, q, selectedOptionId, isNew) {
  const optsContainer = document.getElementById(`opts-container-${q.id}`);
  const feedbackBox = document.getElementById(`feedback-${q.id}`);
  const card = document.getElementById(`q-card-${q.id}`);
  if (!optsContainer || !feedbackBox) return null;

  optsContainer.dataset.answered = "true";
  const selectedOpt = q.options.find(o => o.id === selectedOptionId);
  const correctOpt = q.options.find(o => o.isCorrect);
  const isCorrect = !!(selectedOpt && selectedOpt.isCorrect);

  optsContainer.querySelectorAll(".option-btn").forEach(btn => {
    btn.classList.add("disabled");
    btn.setAttribute("aria-disabled", "true");
  });
  const selectedBtn = document.getElementById(`opt-btn-${q.id}-${selectedOptionId}`);
  const correctBtn = correctOpt ? document.getElementById(`opt-btn-${q.id}-${correctOpt.id}`) : null;

  const addMark = (btn, text) => {
    if (!btn || btn.querySelector(".option-mark")) return;
    const m = document.createElement("span");
    m.className = "option-mark";
    m.textContent = text;
    btn.appendChild(m);
  };

  if (card) {
    card.classList.remove("state-correct", "state-wrong");
    card.classList.add(isCorrect ? "state-correct" : "state-wrong");
  }

  if (isCorrect) {
    if (selectedBtn) { selectedBtn.classList.add("correct"); addMark(selectedBtn, "Doğru — senin cevabın"); }
    feedbackBox.className = "feedback-box correct-box";
    feedbackBox.innerHTML = `
      <div class="feedback-head">
        <span class="feedback-verdict">${APMEBERRA_ICONS.check}Doğru cevap</span>
        <span class="feedback-chip">+1 Puan</span>
      </div>
      <div class="feedback-text">Tebrikler${apStudentName() ? " " + escapeHtml(apStudentName()) : ""}! Kavramı ve işlem adımlarını doğru uyguladın.</div>
      <div class="solution-panel">
        <div class="solution-title">Adım adım tam çözüm (Explanatory Solution)</div>
        <div class="solution-steps">${q.stepByStepSolution || ""}</div>
      </div>
    `;
  } else {
    if (selectedBtn) { selectedBtn.classList.add("wrong"); addMark(selectedBtn, "Senin cevabın"); }
    if (correctBtn) { correctBtn.classList.add("correct"); addMark(correctBtn, "Doğru cevap"); }
    feedbackBox.className = "feedback-box wrong-box";
    feedbackBox.innerHTML = `
      <div class="feedback-head">
        <span class="feedback-verdict">${APMEBERRA_ICONS.cross}Yanlış cevap</span>
        <span class="feedback-chip">Doğru Seçenek: ${correctOpt ? correctOpt.id : ""}</span>
      </div>
      <div class="feedback-text">
        <strong>Düştüğün çeldirici / hata nedeni:</strong> ${selectedOpt && selectedOpt.errorTag ? selectedOpt.errorTag : "Kavramsal veya işlemsel eksiklik."}
      </div>

      <div class="remediation-panel">
        <div class="remediation-title">
          <span>${APMEBERRA_ICONS.book}İlgili konu hatırlatması ve teorem kuralı (Topic Remediation)</span>
        </div>
        <div class="remediation-text">
          ${selectedOpt && selectedOpt.remediation ? selectedOpt.remediation : (q.generalRemediation || "")}
        </div>
      </div>

      <div class="solution-panel">
        <div class="solution-title">
          <span>Adım adım ayrıntılı çözüm (Step-by-step Solution)</span>
        </div>
        <div class="solution-steps">
          ${q.stepByStepSolution || ""}
        </div>
      </div>
    `;
  }
  feedbackBox.style.display = "block";
  if (isNew) feedbackBox.setAttribute("tabindex", "-1");
  return feedbackBox;
}

function updateQuizDashboard(containerId) {
  const st = apComputeUnitStats(containerId);
  quizStats[containerId] = { total: st.total, answered: st.answered, correct: st.correct, wrong: st.wrong };
  quizStats.total = st.total;
  quizStats.answered = st.answered;
  quizStats.correct = st.correct;
  quizStats.wrong = st.wrong;

  const ansEl = document.getElementById(`${containerId}-answered-count`);
  const corEl = document.getElementById(`${containerId}-correct-count`);
  const wrgEl = document.getElementById(`${containerId}-wrong-count`);
  const accEl = document.getElementById(`${containerId}-accuracy-rate`);

  if (ansEl) ansEl.textContent = st.answered;
  if (corEl) corEl.textContent = st.correct;
  if (wrgEl) wrgEl.textContent = st.wrong;

  if (accEl) {
    if (st.answered > 0) {
      const rate = Math.round((st.correct / st.answered) * 100);
      accEl.textContent = `${rate}%`;
      accEl.style.color = rate >= 75 ? "var(--ok)" : (rate >= 50 ? "var(--warn)" : "var(--bad)");
    } else {
      accEl.textContent = "-%";
      accEl.style.color = "";
    }
  }

  const okBar = document.getElementById(`${containerId}-progress-ok`);
  const badBar = document.getElementById(`${containerId}-progress-bad`);
  const label = document.getElementById(`${containerId}-progress-label`);
  const pb = document.getElementById(`${containerId}-progressbar`);
  if (st.total > 0) {
    if (okBar) okBar.style.width = (st.correct / st.total * 100) + "%";
    if (badBar) badBar.style.width = (st.wrong / st.total * 100) + "%";
    if (label) label.textContent = `${st.answered} / ${st.total} çözüldü`;
    if (pb) { pb.setAttribute("aria-valuenow", String(st.answered)); pb.setAttribute("aria-valuetext", `${st.answered} / ${st.total} soru çözüldü`); }
  }

  const container = document.getElementById(containerId);
  const wrongBtn = document.getElementById(`${containerId}-wrong-only`);
  if (wrongBtn && container) {
    if (container._wrongOnly) {
      wrongBtn.disabled = false;
      wrongBtn.textContent = "Tüm sorulara dön";
      wrongBtn.setAttribute("aria-pressed", "true");
    } else {
      wrongBtn.disabled = st.wrong === 0;
      wrongBtn.textContent = st.wrong ? `Sadece yanlışlarımı tekrar çöz (${st.wrong})` : "Sadece yanlışlarımı tekrar çöz";
      wrongBtn.setAttribute("aria-pressed", "false");
    }
  }
}

/** "Sadece yanlışlarımı tekrar çöz" filtresi: yanlış soruları cevapsız hale getirip yalnızca onları gösterir. */
function toggleWrongOnly(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !container._questionsData) return;
  const note = document.getElementById(`${containerId}-filter-note`);
  const empty = document.getElementById(`${containerId}-empty`);
  const cards = container.querySelectorAll(".question-card");

  if (container._wrongOnly) {
    container._wrongOnly = false;
    cards.forEach(c => c.classList.remove("is-hidden"));
    if (note) note.hidden = true;
    if (empty) empty.hidden = true;
    // Tekrar modunda cevaplanmadan bırakılan kartlara kayıtlı (eski) cevabı geri uygula
    const pr = apLoadProgress().pages[apCurrentPage()];
    const answers = (pr && pr.units[containerId] && pr.units[containerId].answers) || {};
    let restored = false;
    container._questionsData.forEach(q => {
      const oc = document.getElementById(`opts-container-${q.id}`);
      if (oc && oc.dataset.answered !== "true" && answers[q.id] && answers[q.id].s) {
        apApplyAnswer(containerId, q, answers[q.id].s, false);
        restored = true;
      }
    });
    if (restored && window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([container]).catch(() => {});
    }
    updateQuizDashboard(containerId);
    apAnnounce(containerId, "Tüm sorular gösteriliyor.");
    return;
  }

  const st = apComputeUnitStats(containerId);
  if (!st.wrongIds.length) return;
  const wrongSet = new Set(st.wrongIds);
  container._wrongOnly = true;

  container._questionsData.forEach((q, idx) => {
    const card = document.getElementById(`q-card-${q.id}`);
    if (!card) return;
    if (wrongSet.has(q.id)) {
      // Kartı cevapsız haliyle yeniden kur (kayıt, yeni cevap verilene kadar korunur)
      const fresh = apBuildQuestionCard(containerId, q, idx);
      card.replaceWith(fresh);
    } else {
      card.classList.add("is-hidden");
    }
  });

  if (note) {
    note.hidden = false;
    note.textContent = `Tekrar modu: yalnızca yanlış yaptığın ${st.wrongIds.length} soru gösteriliyor. Yeni cevabın eskisinin yerine kaydedilir.`;
  }
  updateQuizDashboard(containerId);
  apAnnounce(containerId, `Tekrar modu açıldı. ${st.wrongIds.length} yanlış soru gösteriliyor.`);

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([container]).catch(() => {});
  }
  const first = container.querySelector(".question-card:not(.is-hidden) .option-btn");
  if (first) first.focus({ preventScroll: true });
  const dash = document.getElementById(`${containerId}-dashboard`);
  if (dash) dash.scrollIntoView({ block: "start", behavior: "smooth" });
}

function resetQuiz(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !container._questionsData) return;
  const ok = window.confirm("Bu ünitedeki tüm cevapların silinecek. Yanlışlarım kayıtların korunur. Devam edilsin mi?");
  if (!ok) return;
  const progress = apLoadProgress();
  const pageRec = progress.pages[apCurrentPage()];
  if (pageRec && pageRec.units[containerId]) {
    pageRec.units[containerId].answers = {};
    apStoreSet(APMEBERRA_KEYS.progress, progress);
  }
  initInteractiveQuiz(containerId, container._questionsData);
}

/** İlerleme / Yanlışlarım bağlantısıyla gelindiğinde (#q-card-...) soruyu bul ve vurgula. */
function initQuizHashFocus() {
  const hash = decodeURIComponent(window.location.hash || "");
  // Tur 14 A7: #konu-<soru kabı> → o ünitenin soru istasyonundan önceki en yakın konu anlatımı başlığı (deneme sonucu "Konu anlatımına dön")
  const km = /^#konu-([A-Za-z0-9_-]+-quiz-container)$/.exec(hash);
  if (km) {
    const git = () => {
      const kap = document.getElementById(km[1]);
      if (!kap) return;
      const heads = Array.from(document.querySelectorAll(".main-container h2")).filter(h => !h.closest(".modal-overlay, .hero-section, .question-card, .feedback-box, .doc-toc"));
      const once = heads.filter(h => h.compareDocumentPosition(kap) & Node.DOCUMENT_POSITION_FOLLOWING);
      let hedef = null;
      for (let i = once.length - 1; i >= 0; i--) { if (!AP_TOC_QUIZ.test(once[i].dataset.orijinal || once[i].textContent)) { hedef = once[i]; break; } }
      const el = hedef || kap;
      el.scrollIntoView({ block: "start" });
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
      el.setAttribute("data-konu-hedef", "");
    };
    window.addEventListener("load", () => {
      git();
      const mj = window.MathJax;
      if (mj && mj.startup && mj.startup.promise) mj.startup.promise.then(() => window.setTimeout(git, 50)).catch(() => {});
    });
    return;
  }
  if (!/^#(q-card-|[A-Za-z0-9_-]+-quiz-container$)/.test(hash)) return;
  const go = () => {
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    el.classList.remove("is-hidden");
    el.scrollIntoView({ block: "start" });
    el.classList.add("is-flash");
    window.setTimeout(() => el.classList.remove("is-flash"), 2200);
    const firstOpt = el.querySelector(".option-btn:not(.disabled)") || el.querySelector(".option-btn");
    if (firstOpt) firstOpt.focus({ preventScroll: true });
    if (el.classList.contains("question-card") === false) el.classList.remove("is-flash");
  };
  window.addEventListener("load", () => {
    go();
    // MathJax dizgisi düzeni kaydırabilir: dizgi bitince yeniden hizala
    const mj = window.MathJax;
    if (mj && mj.startup && mj.startup.promise) mj.startup.promise.then(() => window.setTimeout(go, 50)).catch(() => {});
  });
}

// --- İlerleme/Ana sayfa için okunur özet API'si ---
window.APMEBERRA = {
  keys: APMEBERRA_KEYS,
  courses: APMEBERRA_COURSES,
  /** Tur 14 A3: Bugün ekranı saf fonksiyonları (index.html; Node testi araclar/testler/bugun-birim-test.js) */
  bugun: { siradakiAdim: apSiradakiAdim, yaklasanTarihler: apYaklasanTarihler, kaldiginYer: apKaldiginYer, trTarihCoz: apTrTarihCoz, calismaPlani: apCalismaPlani },
  /** Tur 14 A4: Hedefim alanı (sekme adresleri, profildeki kendi seçim, YL dosyası özeti) */
  hedefim: { href: apHedefimHref, kendiSecim: apKendiSecim, ylKalan: apYlKalan },
  /** Tur 14 A5: Son tarihler şeridi girdisi (yazismalar.html) */
  sonTarihGirdisi: apSonTarihGirdisi,
  /** Sayfa bazında erişim (K4): açık sayfa listesi, ziyaretçi durumu, şartlar seçimini taşıyan sorgu. */
  erisim: {
    acikSayfalar: APMEBERRA_ACIK_SAYFALAR,
    girisNoktasi: APMEBERRA_ACIK_GIRIS,
    acik: apSayfaAcik,
    misafir: apMisafirMi,
    secimSorgusu: apSecimSorgusu,
    secimCoz: apSecimCoz,
    secimMetni: apSecimMetni
  },
  /** Tur 11: model ve ülke sabitleri, profil okuma normalleştirmesi */
  modeller: APMEBERRA_MODELLER,
  modelAd: APMEBERRA_MODEL_AD,
  ulkeAdlari: APMEBERRA_ULKE_ADLARI,
  profilNorm: apProfilNorm,
  sinifEtiket: apSinifEtiket,
  loadProgress: apLoadProgress,
  loadErrors: apLoadErrors,
  storeGet: apStoreGet,
  storeSet: apStoreSet,
  storeRemove: apStoreRemove,
  zone: function (rate) {
    if (rate === null || rate === undefined || isNaN(rate)) return { cls: "zone-none", label: "Veri yok" };
    if (rate >= 75) return { cls: "zone-green", label: "Yeşil bölge" };
    if (rate >= 50) return { cls: "zone-yellow", label: "Sarı bölge" };
    return { cls: "zone-red", label: "Kırmızı bölge" };
  },
  /** Ders/ünite bazında özet. */
  summary: function () {
    const progress = apLoadProgress();
    const errors = apLoadErrors();
    const courses = APMEBERRA_COURSES.map(c => {
      const pr = progress.pages[c.page];
      const units = pr ? Object.keys(pr.units).map(uid => {
        const u = pr.units[uid];
        const ans = u.answers || {};
        let answered = 0, correct = 0;
        Object.keys(ans).forEach(k => { answered++; if (ans[k].c) correct++; });
        return { id: uid, title: u.title || uid, order: (typeof u.order === "number" ? u.order : 999), total: u.total || 0, answered, correct, wrong: answered - correct };
      }).sort((a, b) => (a.order - b.order) || a.id.localeCompare(b.id, "tr", { numeric: true })) : [];
      const tot = units.reduce((s, u) => ({ total: s.total + u.total, answered: s.answered + u.answered, correct: s.correct + u.correct }), { total: 0, answered: 0, correct: 0 });
      return Object.assign({}, c, { units, total: tot.total, answered: tot.answered, correct: tot.correct, wrong: tot.answered - tot.correct, visited: !!pr });
    });
    // Ders listesinde olmayan sayfalardaki quiz'ler de kaybolmasın
    Object.keys(progress.pages).forEach(p => {
      if (courses.some(c => c.page === p)) return;
      const pr = progress.pages[p];
      const units = Object.keys(pr.units).map(uid => {
        const u = pr.units[uid]; const ans = u.answers || {};
        let answered = 0, correct = 0;
        Object.keys(ans).forEach(k => { answered++; if (ans[k].c) correct++; });
        return { id: uid, title: u.title || uid, total: u.total || 0, answered, correct, wrong: answered - correct };
      });
      const tot = units.reduce((s, u) => ({ total: s.total + u.total, answered: s.answered + u.answered, correct: s.correct + u.correct }), { total: 0, answered: 0, correct: 0 });
      courses.push({ page: p, name: p, short: p, cls: "", units, total: tot.total, answered: tot.answered, correct: tot.correct, wrong: tot.answered - tot.correct, visited: true });
    });
    const errList = Object.keys(errors.items).map(k => errors.items[k]).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const all = courses.reduce((s, c) => ({ answered: s.answered + c.answered, correct: s.correct + c.correct, total: s.total + c.total }), { answered: 0, correct: 0, total: 0 });
    return {
      courses,
      errors: errList,
      openErrors: errList.filter(e => !e.resolved),
      answered: all.answered,
      correct: all.correct,
      wrong: all.answered - all.correct,
      total: all.total
    };
  },
  resetAll: function () {
    apStoreRemove(APMEBERRA_KEYS.progress);
    apStoreRemove(APMEBERRA_KEYS.errors);
  },
  /** Kişisel panel durumu (apmeberra:panel:v1): {universiteGoruldu, sinavlarim:[id], guncelleme}. */
  panel: {
    get: function () {
      const v = apStoreGet(APMEBERRA_KEYS.panel, null);
      const o = v && typeof v === "object" && !Array.isArray(v) ? v : {};
      if (!Array.isArray(o.sinavlarim)) o.sinavlarim = [];
      return o;
    },
    update: function (fn) {
      const o = window.APMEBERRA.panel.get();
      fn(o);
      o.guncelleme = new Date().toISOString();
      apStoreSet(APMEBERRA_KEYS.panel, o);
      return o;
    }
  },
  /**
   * Rota bağlamı (Tur 6, §8.2). Hesaplar rota.js'te (window.APMEBERRA_ROTA), kurallar
   * data/mevzuat/ulke-rotalari.js'te (window.APMEBERRA_ROTALAR); ikisi de yüklenmemiş olabilir.
   */
  rota: {
    KEY: "apmeberra:rota:v1",
    /** Profildeki ülkeler (Tur 11: 15 ülke; tarihli rota yalnızca de/it, diğerlerinde genel yol haritası). */
    ulkeler: function () {
      const p = APMEBERRA_ME && APMEBERRA_ME.profile;
      return (p && Array.isArray(p.ulkeler) ? p.ulkeler : []).filter(u => !!APMEBERRA_ULKE_ADLARI[u]);
    },
    /** Gösterilecek rota: istenen (ör. ?ulke=) profildeyse o, yoksa profildeki aktifRota, yoksa ilk ülke. */
    aktif: function (istenen) {
      const ul = window.APMEBERRA.rota.ulkeler();
      const p = (APMEBERRA_ME && APMEBERRA_ME.profile) || {};
      if (istenen && ul.indexOf(istenen) >= 0) return istenen;
      if (ul.indexOf(p.aktifRota) >= 0) return p.aktifRota;
      return ul[0] || null;
    },
    /**
     * Aktif rotayı profile yazar (aynı anahtarı app.js oturum korumasında okur).
     * Sunucuya geçişte bu çağrı APMEBERRA_AUTH.setAktifRota üzerinden yapılmalıdır.
     */
    sec: function (ulke) {
      if (!APMEBERRA_ME || !APMEBERRA_ME.user || window.APMEBERRA.rota.ulkeler().indexOf(ulke) < 0) return false;
      const key = APMEBERRA_ACCOUNT_KEYS.profilePrefix + APMEBERRA_ME.user.id;
      const p = apStoreGet(key, null);
      if (!p || typeof p !== "object") return false;
      if (p.aktifRota === ulke) { APMEBERRA_ME.profile = apProfilNorm(p); return true; }
      p.aktifRota = ulke;
      p.guncelleme = new Date().toISOString();
      if (!apStoreSet(key, p)) return false;
      APMEBERRA_ME.profile = apProfilNorm(p);
      document.documentElement.setAttribute("data-rota", ulke);
      return true;
    },
    /** Kural verisi (yoksa null). */
    veri: function (ulke) {
      const R = window.APMEBERRA_ROTALAR;
      return R && typeof R === "object" && R[ulke] && typeof R[ulke] === "object" ? R[ulke] : null;
    },
    /** apmeberra:rota:v1 (normalize edilmiş). */
    durum: function () {
      const raw = apStoreGet("apmeberra:rota:v1", null);
      return window.APMEBERRA_ROTA ? window.APMEBERRA_ROTA.durumNormalize(raw) : (raw && typeof raw === "object" ? raw : {});
    },
    durumYaz: function (d) { return apStoreSet("apmeberra:rota:v1", d); },
    /**
     * Küçük rota anahtarı (Panel, Sınavlar, Yazışmalar). Tek ülkede yalnızca etiket gösterir.
     * onChange(ulke) seçim değişince çağrılır; seçim profile (aktifRota) yazılır.
     */
    anahtar: function (container, onChange) {
      if (!container) return;
      const ul = window.APMEBERRA.rota.ulkeler();
      const AD = APMEBERRA_ULKE_ADLARI;
      const ciz = () => {
        const akt = window.APMEBERRA.rota.aktif();
        container.innerHTML = '<div class="rota-switch" role="group" aria-label="Odaklandığın hedef ülke">' +
          '<span class="rota-switch-label">Hedef ülke:</span>' +
          (ul.length > 1
            ? ul.map(u => '<button type="button" data-rota-sec="' + u + '" aria-pressed="' + (u === akt) + '"><span class="rota-dot rota-dot-' + u + '" aria-hidden="true"></span>' + AD[u] + '</button>').join("")
            : '<span class="rota-static"><span class="rota-dot rota-dot-' + akt + '" aria-hidden="true"></span>' + (AD[akt] || "—") + '</span>') +
          '</div>';
      };
      ciz();
      container.addEventListener("click", (e) => {
        const b = e.target.closest("[data-rota-sec]");
        if (!b || b.getAttribute("aria-pressed") === "true") return;
        if (!window.APMEBERRA.rota.sec(b.dataset.rotaSec)) return;
        ciz();
        const nb = container.querySelector('[data-rota-sec="' + b.dataset.rotaSec + '"]');
        if (nb) nb.focus();
        if (typeof onChange === "function") onChange(b.dataset.rotaSec);
      });
    }
  },
  /**
   * Deneme geçmişi (apmeberra:deneme:v1) — şema deneme ajanına ait; savunmacı okunur.
   * Dönüş: [{ders, tarih, dogru, toplam, yuzde}] (yeniden eskiye) — tanınmayan kayıtlar atlanır.
   */
  denemeler: function () {
    const raw = apStoreGet(APMEBERRA_KEYS.deneme, null);
    let list = Array.isArray(raw) ? raw : null;
    if (!list && raw && typeof raw === "object") {
      ["sonuclar", "gecmis", "denemeler", "kayitlar", "items", "results"].some(k => Array.isArray(raw[k]) ? (list = raw[k], true) : false);
      if (!list) { const k = Object.keys(raw).find(x => Array.isArray(raw[x])); if (k) list = raw[k]; }
    }
    const num = v => (typeof v === "number" && isFinite(v)) ? v : (typeof v === "string" && v.trim() !== "" && isFinite(+v) ? +v : null);
    return (list || []).filter(r => r && typeof r === "object").map(r => {
      const tarih = r.tarih || r.bitis || r.bitti || r.date || r.zaman || r.t || r.baslangic || null;
      const dogru = num(r.dogru != null ? r.dogru : r.correct);
      const toplam = num(r.toplam != null ? r.toplam : (r.soruSayisi != null ? r.soruSayisi : r.total));
      let yuzde = num(r.yuzde != null ? r.yuzde : r.oran);
      if (yuzde === null && dogru !== null && toplam) yuzde = Math.round(dogru / toplam * 100);
      if (yuzde !== null && yuzde > 0 && yuzde <= 1 && r.yuzde == null) yuzde = Math.round(yuzde * 100);
      return { ders: String(r.dersAd || r.ad || r.ders || r.denemeKodu || r.kod || r.dersKodu || "Deneme"), tarih: typeof tarih === "string" ? tarih : (typeof tarih === "number" ? new Date(tarih).toISOString() : null), dogru, toplam, yuzde };
    }).sort((a, b) => (Date.parse(b.tarih) || 0) - (Date.parse(a.tarih) || 0));
  }
};

// ==========================================================================
// YEDEKLE / TAŞI — localStorage'daki tüm "apmeberra:" anahtarlarını JSON dosyasına
// aktarır ve geri yükler. file:// altında çalışır (Blob + <a download>).
// Dosya: {format:"apmeberra-yedek", surum:1, olusturma, anahtarlar:{...}, ozet:{...}}
// Anahtar değerleri: ham değer JSON nesne/dizi ise ayrıştırılmış nesne, değilse
// ham dize (ör. tema "dark") olarak saklanır; geri yüklemede aynen yazılır.
// ==========================================================================
(function () {
  "use strict";
  const PREFIX = "apmeberra:";
  const FORMAT = "apmeberra-yedek";
  const ESKI_PREFIX = "apazra:", ESKI_FORMAT = "apazra-yedek"; // Tur 10 öncesi yedekler (ad-denetimi izin listesinde)
  const VERSION = 1;
  const MAX_BYTES = 5 * 1024 * 1024;
  const REMIND_DAYS = 7;

  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
  function ms(iso) { const n = Date.parse(iso); return isNaN(n) ? null : n; }
  function maxIso(a, b) {
    const ma = ms(a), mb = ms(b);
    if (ma === null) return mb === null ? (a || b) : b;
    if (mb === null) return a;
    return mb > ma ? b : a;
  }
  function minIso(a, b) {
    const ma = ms(a), mb = ms(b);
    if (ma === null) return mb === null ? (a || b) : b;
    if (mb === null) return a;
    return mb < ma ? b : a;
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function lsKeys() {
    const out = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) out.push(k);
      }
    } catch (e) { /* depolama kapalı */ }
    return out.sort();
  }
  function readRaw(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function decode(raw) {
    if (raw == null) return null;
    try { const v = JSON.parse(raw); if (v !== null && typeof v === "object") return v; } catch (e) { /* ham dize */ }
    return raw;
  }
  function encode(v) { return typeof v === "string" ? v : JSON.stringify(v); }

  /** Bir anahtar kümesinden (çözülen/doğru/yanlış/açık hata) özeti hesaplar. */
  function summarize(keys) {
    const pr = keys[APMEBERRA_KEYS.progress];
    const er = keys[APMEBERRA_KEYS.errors];
    let cozulen = 0, dogru = 0, acikHata = 0, hata = 0;
    const pages = isObj(pr) && isObj(pr.pages) ? pr.pages : {};
    Object.keys(pages).forEach(p => {
      const units = isObj(pages[p]) && isObj(pages[p].units) ? pages[p].units : {};
      Object.keys(units).forEach(u => {
        const ans = isObj(units[u]) && isObj(units[u].answers) ? units[u].answers : {};
        Object.keys(ans).forEach(q => { cozulen++; if (ans[q] && ans[q].c) dogru++; });
      });
    });
    const items = isObj(er) && isObj(er.items) ? er.items : {};
    Object.keys(items).forEach(k => { hata++; if (items[k] && !items[k].resolved) acikHata++; });
    return { cozulen, dogru, yanlis: cozulen - dogru, acikHata, hataKaydi: hata };
  }

  function snapshot() {
    const keys = {};
    lsKeys().forEach(k => { keys[k] = decode(readRaw(k)); });
    return keys;
  }

  function build() {
    const anahtarlar = snapshot();
    const s = summarize(anahtarlar);
    return {
      format: FORMAT,
      surum: VERSION,
      olusturma: new Date().toISOString(),
      anahtarlar,
      ozet: { cozulen: s.cozulen, dogru: s.dogru, yanlis: s.yanlis, acikHata: s.acikHata }
    };
  }

  function fileName(d) {
    const p = n => String(n).padStart(2, "0");
    d = d || new Date();
    return "apmeberra-ilerleme-" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + ".json";
  }

  /** Dosyayı indirir ve son yedek tarihini kaydeder. Dönüş: {name, data}. */
  function exportFile() {
    const data = build();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    try { window.localStorage.setItem(APMEBERRA_KEYS.lastBackup, data.olusturma); } catch (e) { /* yok say */ }
    return { name: a.download, data };
  }

  function fail(msg) { const e = new Error(msg); e.userMessage = msg; throw e; }

  /** Dosya metnini doğrular. Hata durumunda e.userMessage içeren Error fırlatır. */
  function parse(text) {
    if (typeof text !== "string" || !text.trim()) fail("Dosya boş. Lütfen Meberra’dan dışa aktarılmış bir .json yedeği seç.");
    if (text.length > MAX_BYTES) fail("Dosya çok büyük (5 MB üstü). Bu bir Meberra yedeği gibi görünmüyor.");
    let data;
    try { data = JSON.parse(text.replace(/^﻿/, "")); } catch (e) { fail("Dosya okunamadı: geçerli bir JSON değil ya da bozulmuş. Hiçbir veri değiştirilmedi."); }
    // Tur 10: kod adı taşımasından önce alınmış yedekler (format "apazra-yedek", anahtarlar "apazra:…") da kabul edilir;
    // anahtar adları yeni öneke çevrilir. Aynı ad iki biçimde de varsa yeni biçimdeki değer kazanır.
    if (isObj(data) && data.format === ESKI_FORMAT && isObj(data.anahtarlar)) {
      const yeni = {};
      Object.keys(data.anahtarlar).forEach(k => {
        const y = k.indexOf(ESKI_PREFIX) === 0 ? PREFIX + k.slice(ESKI_PREFIX.length) : k;
        if (!(y in yeni) || y === k) yeni[y] = data.anahtarlar[k];
      });
      data.anahtarlar = yeni;
      data.format = FORMAT;
    }
    if (!isObj(data) || data.format !== FORMAT) fail("Bu dosya bir Meberra ilerleme yedeği değil (format alanı “" + FORMAT + "” olmalı). Hiçbir veri değiştirilmedi.");
    if (typeof data.surum !== "number" || data.surum < 1 || Math.floor(data.surum) !== data.surum) fail("Yedek sürümü tanınmadı. Hiçbir veri değiştirilmedi.");
    if (data.surum > VERSION) fail("Bu yedek portalın daha yeni bir sürümüyle oluşturulmuş (sürüm " + data.surum + "). Portalı güncelleyip tekrar dene. Hiçbir veri değiştirilmedi.");
    if (!isObj(data.anahtarlar)) fail("Yedekte “anahtarlar” bölümü yok ya da bozuk. Hiçbir veri değiştirilmedi.");
    const keys = Object.keys(data.anahtarlar);
    const bad = keys.filter(k => k.indexOf(PREFIX) !== 0);
    if (bad.length) fail("Yedekte Meberra’ya ait olmayan anahtarlar var (" + bad.slice(0, 3).join(", ") + "). Güvenlik için yükleme durduruldu; hiçbir veri değiştirilmedi.");
    keys.forEach(k => {
      const v = data.anahtarlar[k];
      if (typeof v !== "string" && !isObj(v)) fail("“" + k + "” anahtarının değeri geçersiz. Hiçbir veri değiştirilmedi.");
    });
    const pr = data.anahtarlar[APMEBERRA_KEYS.progress];
    if (pr !== undefined && !(isObj(pr) && isObj(pr.pages))) fail("Yedekteki soru cevapları bozuk görünüyor. Hiçbir veri değiştirilmedi.");
    const er = data.anahtarlar[APMEBERRA_KEYS.errors];
    if (er !== undefined && !(isObj(er) && isObj(er.items))) fail("Yedekteki Yanlışlarım bozuk görünüyor. Hiçbir veri değiştirilmedi.");
    const sv = data.anahtarlar[APMEBERRA_KEYS.seviye];
    if (sv !== undefined && !(isObj(sv) && (sv.raporlar === undefined || (Array.isArray(sv.raporlar) && sv.raporlar.every(isObj))) &&
        (sv.kontrol === undefined || isObj(sv.kontrol)) && (sv.devam === undefined || sv.devam === null || isObj(sv.devam)))) {
      fail("Yedekteki seviye testi raporları bozuk görünüyor. Hiçbir veri değiştirilmedi.");
    }
    return { olusturma: typeof data.olusturma === "string" ? data.olusturma : null, anahtarlar: data.anahtarlar, ozet: summarize(data.anahtarlar) };
  }

  // --- Birleştirme ---
  // Cevaplar: aynı soru için zaman damgası (t) daha yeni olan kazanır; damga
  // herhangi bir tarafta eksikse ya da eşitse mevcut kayıt korunur.
  function mergeProgress(cur, inc) {
    const out = isObj(cur) && isObj(cur.pages) ? clone(cur) : { v: 1, pages: {} };
    const pages = inc.pages;
    Object.keys(pages).forEach(p => {
      const ip = pages[p];
      if (!isObj(ip) || !isObj(ip.units)) return;
      if (!isObj(out.pages[p]) || !isObj(out.pages[p].units)) out.pages[p] = { units: {} };
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
          if (ti !== null && tc !== null && ti > tc) cu.answers[q] = clone(inA);
        });
      });
    });
    return out;
  }

  // Yanlışlarım: kayıtlar "sayfa|soru id" ile birleşir; yanlış sayısı = en
  // büyüğü, ilk tarih = en eski, son yanlış = en yeni. "Düzeltildi" bilgisi,
  // düzeltme bilinen en son yanlıştan sonra (ya da aynı anda) yapıldıysa korunur.
  function mergeErrorItem(a, b) {
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
  function mergeErrors(cur, inc) {
    const out = isObj(cur) && isObj(cur.items) ? clone(cur) : { v: 1, items: {} };
    Object.keys(inc.items).forEach(k => {
      const ib = inc.items[k];
      if (!isObj(ib)) return;
      const ca = out.items[k];
      out.items[k] = isObj(ca) ? mergeErrorItem(ca, ib) : clone(ib);
    });
    return out;
  }

  // Seviye testi: raporlar id ile birleşir (aynı rapor için daha yeni "guncelleme"
  // kazanır), tarihe göre yeniden eskiye sıralanıp en yeni 5 tanesi tutulur.
  // Yarım test (devam) ve kontrol listesi işaretlerinde daha yeni damga kazanır.
  function stamp(x) { return isObj(x) ? (x.guncelleme || x.tarih || x.t || null) : null; }
  function newer(a, b) { const ma = ms(stamp(a)), mb = ms(stamp(b)); return mb !== null && (ma === null || mb > ma) ? b : a; }
  function mergeSeviye(cur, inc) {
    if (!isObj(cur)) return clone(inc); // bu cihazda seviye verisi yok: yedek aynen yazılır
    const out = clone(cur);
    const byId = {};
    (Array.isArray(out.raporlar) ? out.raporlar : []).forEach(r => { if (isObj(r) && r.id) byId[r.id] = r; });
    (Array.isArray(inc.raporlar) ? inc.raporlar : []).forEach(r => {
      if (!isObj(r) || !r.id) return;
      byId[r.id] = byId[r.id] ? newer(byId[r.id], clone(r)) : clone(r);
    });
    out.raporlar = Object.keys(byId).map(k => byId[k])
      .sort((a, b) => (ms(b.tarih) || 0) - (ms(a.tarih) || 0)).slice(0, 5);
    if (isObj(inc.devam)) out.devam = isObj(out.devam) ? newer(out.devam, clone(inc.devam)) : clone(inc.devam);
    else if (!("devam" in out)) out.devam = null;
    out.kontrol = isObj(out.kontrol) ? out.kontrol : {};
    if (isObj(inc.kontrol)) Object.keys(inc.kontrol).forEach(k => {
      const b = inc.kontrol[k];
      if (!isObj(b)) return;
      out.kontrol[k] = isObj(out.kontrol[k]) ? newer(out.kontrol[k], clone(b)) : clone(b);
    });
    if (!isObj(out.sonSecim) && isObj(inc.sonSecim)) out.sonSecim = clone(inc.sonSecim);
    out.v = 1;
    return out;
  }

  // Rota durumu (apmeberra:rota:v1): adım işaretinde daha yeni tarih kazanır; belge işaretleri birleşir.
  function mergeRota(cur, inc) {
    if (!isObj(cur)) return clone(inc);
    const out = clone(cur);
    Object.keys(inc).forEach(u => {
      const iu = inc[u]; if (!isObj(iu)) return;
      if (!isObj(out[u])) { out[u] = clone(iu); return; }
      const ou = out[u];
      ou.adimlar = isObj(ou.adimlar) ? ou.adimlar : {};
      ou.belgeler = isObj(ou.belgeler) ? ou.belgeler : {};
      if (isObj(iu.adimlar)) Object.keys(iu.adimlar).forEach(id => {
        const b = iu.adimlar[id]; if (!isObj(b)) return;
        const a = ou.adimlar[id];
        ou.adimlar[id] = isObj(a) ? newer(a, clone(b)) : clone(b);
      });
      if (isObj(iu.belgeler)) Object.keys(iu.belgeler).forEach(id => { if (iu.belgeler[id] === true) ou.belgeler[id] = true; });
    });
    return out;
  }

  // FRQ yazım istasyonu (ap-english.html, apmeberra:frq:v1 = {surum, aktif, yazilar:{tür:{metin, kontrol, guncelleme}}, guncelleme}):
  // her essay türü ayrı birleşir; iki tarafta da varsa "guncelleme" damgası daha yeni olan kazanır (eşit/eksikse mevcut korunur).
  // Etkin sekme (aktif) daha yeni kaydedilmiş taraftan gelir. Şeması bozuk taraf yok sayılır.
  const FRQ_KEY = "apmeberra:frq:v1", CALC_FRQ_KEY = "apmeberra:calc-frq:v1";
  function mergeFrq(cur, inc) {
    const ok = x => isObj(x) && isObj(x.yazilar);
    if (!ok(inc)) return ok(cur) ? cur : inc;
    if (!ok(cur)) return clone(inc);
    const out = clone(cur);
    Object.keys(inc.yazilar).forEach(t => {
      const b = inc.yazilar[t]; if (!isObj(b)) return;
      const a = out.yazilar[t];
      out.yazilar[t] = isObj(a) ? newer(a, clone(b)) : clone(b);
    });
    if (newer(cur, inc) === inc && typeof inc.aktif === "string") out.aktif = inc.aktif;
    const g = maxIso(cur.guncelleme || null, inc.guncelleme || null); if (g) out.guncelleme = g;
    if (typeof out.surum !== "number") out.surum = 1;
    return out;
  }
  // Calculus resmî FRQ öz değerlendirmesi (ap-calculus.html, apmeberra:calc-frq:v1 = {surum, isaretler:{"2025-1":[bool…]}, guncelleme}):
  // soru başına damga olmadığı için yalnız bir tarafta işaretlenmiş sorular eklenir; iki tarafta da varsa
  // genel "guncelleme" damgası daha yeni olan tarafın işaretleri kazanır (eşit/eksikse mevcut korunur).
  // Not: bu cihazda "İşaretleri temizle" ile silinmiş bir soru birleştirmede yedekten geri gelir; birebir geri dönüş için "Değiştir" modu.
  function mergeCalcFrq(cur, inc) {
    const ok = x => isObj(x) && isObj(x.isaretler);
    if (!ok(inc)) return ok(cur) ? cur : inc;
    if (!ok(cur)) return clone(inc);
    const out = clone(cur);
    const incWins = newer(cur, inc) === inc;
    Object.keys(inc.isaretler).forEach(k => {
      const b = inc.isaretler[k]; if (!Array.isArray(b)) return;
      if (!Array.isArray(out.isaretler[k]) || incWins) out.isaretler[k] = b.slice();
    });
    const g = maxIso(cur.guncelleme || null, inc.guncelleme || null); if (g) out.guncelleme = g;
    if (typeof out.surum !== "number") out.surum = 1;
    return out;
  }

  /** Mevcut depo + yedek -> yazılacak anahtar kümesi (henüz yazmaz). */
  function plan(parsed, mode) {
    const cur = snapshot();
    const inc = parsed.anahtarlar;
    if (mode === "replace") {
      const next = clone(inc);
      // Geri yüklenen veri, yedeğin alındığı ana kadar yedeklenmiş sayılır
      const lb = maxIso(typeof next[APMEBERRA_KEYS.lastBackup] === "string" ? next[APMEBERRA_KEYS.lastBackup] : null, parsed.olusturma);
      if (lb) next[APMEBERRA_KEYS.lastBackup] = lb;
      return { next, remove: Object.keys(cur).filter(k => !(k in next)) };
    }
    const next = Object.assign({}, cur);
    Object.keys(inc).forEach(k => {
      if (k === APMEBERRA_KEYS.progress) next[k] = mergeProgress(cur[k], inc[k]);
      else if (k === APMEBERRA_KEYS.errors) next[k] = mergeErrors(cur[k], inc[k]);
      else if (k === APMEBERRA_KEYS.seviye) next[k] = mergeSeviye(cur[k], inc[k]);
      else if (k === "apmeberra:rota:v1") next[k] = mergeRota(cur[k], inc[k]);
      else if (k === FRQ_KEY) next[k] = mergeFrq(cur[k], inc[k]);
      else if (k === CALC_FRQ_KEY) next[k] = mergeCalcFrq(cur[k], inc[k]);
      else if (!(k in cur)) next[k] = inc[k]; // tema, son yedek vb.: bu cihazdaki değer korunur
    });
    // Boş bir cihaza yüklenen veri, yedeğin alındığı ana kadar yedeklenmiş sayılır
    if (!(APMEBERRA_KEYS.lastBackup in next) && summarize(cur).cozulen === 0 && ms(parsed.olusturma) !== null) {
      next[APMEBERRA_KEYS.lastBackup] = parsed.olusturma;
    }
    return { next, remove: [] };
  }

  /** Planı yazar. Yazma başarısız olursa önceki durumu geri koyar. Dönüş: yeni özet. */
  function apply(parsed, mode) {
    const before = {};
    lsKeys().forEach(k => { before[k] = readRaw(k); });
    const p = plan(parsed, mode === "replace" ? "replace" : "merge");
    try {
      p.remove.forEach(k => window.localStorage.removeItem(k));
      Object.keys(p.next).forEach(k => window.localStorage.setItem(k, encode(p.next[k])));
    } catch (e) {
      try {
        lsKeys().forEach(k => { if (!(k in before)) window.localStorage.removeItem(k); });
        Object.keys(before).forEach(k => window.localStorage.setItem(k, before[k]));
      } catch (e2) { /* yok say */ }
      fail("Tarayıcı depolamasına yazılamadı (depolama kapalı ya da dolu olabilir). Önceki veriler korundu.");
    }
    const t = readRaw(APMEBERRA_KEYS.theme);
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    return summarize(snapshot());
  }

  function lastBackup() { const v = readRaw(APMEBERRA_KEYS.lastBackup); return v && ms(v) !== null ? v : null; }
  /** En az 1 cevap ya da seviye raporu varsa ve hiç yedek yoksa / son yedek 7 günden eskiyse true. */
  function needsReminder() {
    const snap = snapshot();
    const sv = snap[APMEBERRA_KEYS.seviye];
    const hasSeviye = isObj(sv) && Array.isArray(sv.raporlar) && sv.raporlar.length > 0;
    if (summarize(snap).cozulen < 1 && !hasSeviye) return false;
    const lb = lastBackup();
    return !lb || (Date.now() - ms(lb)) > REMIND_DAYS * 864e5;
  }

  window.APMEBERRA.backup = {
    PREFIX, FORMAT, VERSION, REMIND_DAYS,
    build, exportFile, fileName, parse, plan, apply, summarize, mergeSeviye, mergeRota, mergeFrq, mergeCalcFrq,
    lastBackup, needsReminder
  };
})();

/* ===================================================================
   EK MODÜLLER: bildirimler / soru–cevap / lig (bildirim.js) ve oyunlaştırma (oyun.js).
   Her sayfada app.js'den sonra yüklenir; dosya modunda modüller kendi içlerinde neyin çalışacağına karar verir.
   =================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var SURUM = "20261021a";
  var kok = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/assets\/js\/app\.js.*$/, "") : "";
  if (/admin\.html$/.test(location.pathname)) return;
  [["link", "assets/css/oyun.css"], ["link", "assets/css/bildirim.css"], ["script", "assets/js/oyun.js"], ["script", "assets/js/bildirim.js"]].forEach(function (m) {
    var el = document.createElement(m[0]);
    if (m[0] === "link") { el.rel = "stylesheet"; el.href = kok + m[1] + "?v=" + SURUM; }
    else { el.src = kok + m[1] + "?v=" + SURUM; el.defer = true; }
    document.head.appendChild(el);
  });
})();
