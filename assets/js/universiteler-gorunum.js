/**
 * Meberra — Üniversiteler görünümü (sade kart düzeni)
 * universiteler.html tarafından app.js'ten SONRA yüklenir.
 * Giriş: universiteler.html?ulke=<cc>&duzey=<lisans|yl>&dil=<en|yerel|hepsi>
 * Sorgu yoksa profilden doldurur (aktifRota / ulkeler[0], egitimDili, ogrenciModeli).
 * Veri: data/mevzuat/ulke-dizini.js, data/mevzuat/ulke/<cc>.js (SUI.veriYukle), data/mevzuat/ulkeler.js (seçilmiş programlar).
 */
(function () {
  "use strict";
  var ME = window.APMEBERRA_ME, A = window.APMEBERRA;
  var GUEST = !ME;
  if (!GUEST && !ME.profile) return;
  var PROF = GUEST ? null : ME.profile;
  var root = document.getElementById("uni-root");
  var MO = window.APMEBERRA_SARTLAR_MOTOR, SUI = window.APMEBERRA_SARTLAR_UI;
  var UIST = window.APMEBERRA_UNI_ISTERLERI, E = window.APMEBERRA_EPOSTA;
  if (!root || !SUI) return;
  var esc = SUI.esc;
  var AZ = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DZ = window.APMEBERRA_ULKE_DIZINI && Array.isArray(window.APMEBERRA_ULKE_DIZINI.ulkeler) ? window.APMEBERRA_ULKE_DIZINI.ulkeler : [];
  var DZK = {}; DZ.forEach(function (u) { DZK[u.kod] = u; });
  var SIRALI = DZ.filter(function (u) { return u.grup === "ana"; }).concat(DZ.filter(function (u) { return u.grup !== "ana"; })
    .sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); })).map(function (u) { return u.kod; });
  var SECILMIS = {};
  (Array.isArray(window.APMEBERRA_ULKELER) ? window.APMEBERRA_ULKELER : []).forEach(function (c) { if (c && c.id) SECILMIS[c.id] = c; });
  var SINAV = {};
  (Array.isArray(window.APMEBERRA_SINAVLAR) ? window.APMEBERRA_SINAVLAR : []).forEach(function (s) { if (s && s.id) SINAV[s.id] = s; });
  var GUIDE = { de: "/rehber/almanya", it: "/rehber/italya" };
  function ulkeAd(cc) { return (DZK[cc] && DZK[cc].ad) || (MO && MO.ULKE_ADLARI && MO.ULKE_ADLARI[cc]) || cc.toUpperCase(); }

  /*
   * AP'nin rolü ve genel şartlar — ülke dizini özetlerinden ve ülke dosyalarındaki "apEtkisi" maddelerinden
   * (Doğrulandı / Teyit gerekir) özetlenmiştir. Kaynaklar sayfanın altındaki "Kaynaklar ve notlar" bölümünde.
   * ap: ülkenin genel durumu; apUni: kurum bazında istisnalar (ad eşleşmesi); apVars: listede adı geçmeyen üniversiteler.
   * yks: yerlesme (YKS yerleşmesi şart) | sonuc (YKS sonuç belgesi) | yok (istenmez) | null (bilinmiyor / üniversiteye göre)
   */
  var KURAL = {
    de: { ap: "gerekmez", apMetin: "Türk diplomasıyla AP tek başına yetmez: giriş hakkı için YKS'de 180'in üzerinde puan ve en az 4 yıllık bir lisans programına yerleşme gerekir.",
      yks: "yerlesme", yksMetin: "YKS'de 180+ puan ve 4 yıllık programa yerleşme", giris: null },
    at: { ap: "gerekmez", apMetin: "AP, YKS şartının yerine geçmiyor: YKS'de en az 180 yerleşme puanı ve bir lisans programına yerleşme gerekir.",
      yks: "yerlesme", yksMetin: "YKS'de en az 180 puan ve yerleşme", giris: null },
    ch: { ap: "gerekmez", apMetin: "AP kuralları yalnızca ABD diploması için yazılmış; Türk diplomasıyla şart YKS yerleşmesidir (EPFL'de giriş sınavı ya da CMS hazırlık yılı).",
      yks: "yerlesme", yksMetin: "YKS yerleşmesi (EPFL hariç)", giris: "ETH: indirgenmiş giriş sınavı · EPFL: giriş sınavı ya da CMS" },
    it: { ap: "gerekmez", apMetin: "AP şart değil ve resmi avantaj da sağlamaz; girişi üniversitenin sınavı belirler: CEnT-S / TOLC-I, PoliMi TOL ya da PoliTo TIL-I.",
      yks: "sonuc", yksMetin: "YKS'ye girip geçtiğini gösteren sonuç belgesi", giris: "CEnT-S, TOLC-I, PoliMi TOL, PoliTo TIL-I ya da SAT (programa göre)" },
    nl: { ap: "gerekli", apVars: "bilinmiyor", apMetin: "Türk diploması araştırma üniversitesine tek başına yetmez. Bazı üniversiteler (Twente, Groningen) en az 4 AP (her biri 3–5) ister; Delft'te Türk diplomasıyla AP'li bir yol yok.",
      apUni: [
        { re: /twente/i, durum: "gerekli", not: "Türk diplomasını en az 4 AP (3–5) ile kabul ediyor; mühendislikte Calculus BC ve fizik şart." },
        { re: /groningen/i, durum: "gerekli", not: "Türk diplomasını en az 4 AP (3–5) ile kabul ediyor; programa göre ek AP istiyor." },
        { re: /delft/i, durum: "gerekmez", not: "AP yolu yalnızca ABD diploması için; Türk diplomasıyla ilgili alanda bir yıl üniversite istiyor." }
      ], yks: null, yksMetin: "Üniversiteye göre", giris: null },
    be: { ap: "ise-yarar", apVars: "bilinmiyor", apMetin: "AP, YKS şartının yerine geçmiyor. KU Leuven bazı programlarda AP Calculus sonucunu matematik kanıtı olarak sayabilir.",
      apUni: [{ re: /leuven/i, durum: "ise-yarar", not: "Program gerektiriyorsa AP Calculus sonucu matematik kanıtı olarak sayılıyor." }],
      yks: "sonuc", yksMetin: "KU Leuven: diploma ile birlikte YKS sonuçları", giris: "ULB / UCLouvain mühendislik: özel giriş sınavı" },
    fr: { ap: "gerekmez", apMetin: "Campus France (DAP) başvurusunda YKS ve AP istenmez; AP puanı en fazla destekleyici belge olarak eklenebilir.",
      yks: "yok", yksMetin: "YKS istenmez", giris: null },
    es: { ap: "bilinmiyor", apMetin: "AP'nin PCE sınavlarının yerine geçtiğine dair resmi ifade yok; Early Admission'daki diğer başarılar kısmında sayılıp sayılmadığı yazılı değil.",
      yks: "yok", yksMetin: "YKS istenmez", giris: "PCE sınavları (UNEDasiss)" },
    se: { ap: "bilinmiyor", apMetin: "İsveç'in AP kuralları ABD diploması için; Türk diplomasının eksik özel şartlarını AP'nin tamamlayıp tamamlamadığını yazılı sor.",
      yks: "yok", yksMetin: "YKS istenmez", giris: null },
    fi: { ap: "bilinmiyor", apMetin: "Aalto İngilizce lisansta seçim yalnızca SAT/ACT ile; AP kullanılmıyor. Diğer üniversiteler için resmi bir ifade bulunamadı.",
      apUni: [{ re: /aalto/i, durum: "gerekmez", not: "İngilizce lisansta seçim yalnız SAT ya da ACT ile; AP değerlendirilmiyor." }],
      yks: null, yksMetin: "Resmi ifade yok", giris: "Aalto İngilizce lisans: SAT / ACT" },
    dk: { ap: "bilinmiyor", apMetin: "AP'nin ders düzeyi şartlarını (ör. DTU'da Matematik A) karşılayıp karşılamadığı yazılı değil; ön değerlendirmede sor.",
      yks: null, yksMetin: "Resmi ifade yok", giris: null },
    ie: { ap: "bilinmiyor", apMetin: "Türk diplomasına eklenen AP'lerin doğrudan kabul yolunu açıp açmadığı yazılı değil; Trinity'ye yazılı olarak sor.",
      yks: null, yksMetin: "Resmi ifade yok", giris: null },
    hu: { ap: "bilinmiyor", apMetin: "Kabul giriş sınavıyla; AP'nin bu sınavdan muafiyet sağlayıp sağlamadığını üniversiteye sor.",
      yks: "yok", yksMetin: "BME YKS istemiyor", giris: "Üniversitenin giriş sınavı" },
    pl: { ap: "bilinmiyor", apMetin: "Gdańsk, Rzeszów ve Varşova belgelerinde AP'nin kabulde kullanıldığına dair ifade bulunamadı.",
      yks: null, yksMetin: "Üniversiteye göre (Gdańsk'ta zorunlu değil)", giris: "Gdańsk: belirli adaylar için matematik sınavı" },
    cz: { ap: "bilinmiyor", apMetin: "ÇVUT ve VSB kabul belgelerinde AP geçmiyor; seçim mülakat ya da SCIO matematik sınavıyla.",
      yks: null, yksMetin: "Resmi ifade yok", giris: "Mülakat ya da SCIO matematik sınavı" }
  };
  var AP = {
    "gerekli": { etiket: "Gerekli", uzun: "AP gerekli", simge: "!" },
    "ise-yarar": { etiket: "İşe yarar", uzun: "AP işe yarar", simge: "+" },
    "gerekmez": { etiket: "Gerekmez", uzun: "AP gerekmez", simge: "–" },
    "bilinmiyor": { etiket: "Bilinmiyor", uzun: "AP etkisi bilinmiyor", simge: "?" }
  };
  var DURUM = {
    ok: { simge: "✓", etiket: "Tamam" }, eksik: { simge: "!", etiket: "Eksik" },
    bilinmiyor: { simge: "?", etiket: "Bilinmiyor" }, bekliyor: { simge: "…", etiket: "Zamanı gelince" }
  };
  var IC = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
    liste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6M9 4a2 2 0 0 0-2 2H5v15h14V6h-2a2 2 0 0 0-2-2"/><path d="M8 12l2 2 4-4"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
    ok_kucuk: '<svg class="uv-chip-tik" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
    takvim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    yildiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
    kilit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    ok_asagi: '<svg class="uk-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    bekle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };

  function arr(x) { return Array.isArray(x) ? x : []; }
  function isUrl(u) { return typeof u === "string" && /^https?:\/\//i.test(u); }
  // Veri metinlerinde geçebilecek iç dosya göndermelerini gösterimden çıkar (ör. "(ulkeler.js > de-tum)")
  function temiz(s) { return String(s == null ? "" : s).replace(/\s*\([^()]*\b[\w-]+\.js\b[^()]*\)/g, "").replace(/\s{2,}/g, " ").trim(); }
  function q(k) { var m = new RegExp("[?&]" + k + "=([^&#]*)").exec(location.search); try { return m ? decodeURIComponent(m[1]) : ""; } catch (e) { return ""; } }
  function siraNo(s) { var m = /(\d+)/.exec(String(s || "")); return m ? +m[1] : null; }
  function siraYaz(s) { return String(s || "").replace(/^=\s*/, "").replace(/-/g, "–"); }

  // ---------- Seçim (adres > profil > varsayılan) ----------
  var qU = q("ulke").toLowerCase(), qD = q("duzey"), qL = q("dil");
  var hedefler = PROF ? arr(PROF.ulkeler).filter(function (u) { return DZK[u]; }) : [];
  var hm = /^#(?:c-)?([a-z]{2})(?:-|$)/.exec(location.hash || "");
  var F = {
    duzey: qD === "yl" || qD === "lisans" ? qD : (PROF && PROF.ogrenciModeli === "uni-mezun" ? "yl" : "lisans"),
    dil: qL === "en" || qL === "yerel" || qL === "hepsi" ? qL : (PROF && (PROF.egitimDili === "en" || PROF.egitimDili === "yerel") ? PROF.egitimDili : "hepsi"),
    ilk100: false, ap: false, muh: false, listem: false
  };
  var ulke = DZK[qU] ? qU : (hm && DZK[hm[1]] ? hm[1] : (PROF && hedefler.indexOf(PROF.aktifRota) >= 0 ? PROF.aktifRota : (hedefler[0] || (A && A.rota && A.rota.aktif ? A.rota.aktif() : null) || SIRALI[0] || "de")));
  if (!DZK[ulke]) ulke = SIRALI[0] || "de";

  // Ziyaret: yol haritası 1. adım
  if (!GUEST && A && A.panel) A.panel.update(function (o) { if (!o.universiteGoruldu) o.universiteGoruldu = new Date().toISOString(); });

  if (GUEST) {
    var eb = document.querySelector(".page-head .eyebrow"); if (eb) eb.textContent = "Üniversiteler · Giriş gerekmez";
    document.querySelectorAll('.footer a[href="/takvim"]').forEach(function (a) { a.setAttribute("href", "/giris#kayit"); a.textContent = "Kayıt ol →"; });
    var back = document.querySelector(".footer a.uni-geri");
    if (back && A && A.erisim && A.erisim.secimSorgusu) { back.setAttribute("href", "/ulkem" + A.erisim.secimSorgusu()); back.textContent = "← Ülke şartları"; }
  }

  function listemOku() { var L = !GUEST && A && A.panel ? A.panel.get().universitelerim : null; return Array.isArray(L) ? L : []; }
  function yalnizEn(cc) { return MO ? MO.yalnizIngilizce(cc, DZK[cc]) : cc === "ie"; }
  function yerelAd(cc) { return MO ? MO.dilAd("yerel", DZK[cc], (window.APMEBERRA_ULKE_DIZINI || {}).dilAd) : "Yerel dil"; }
  function adresYaz(hashKoru) {
    var h = hashKoru && /^#c-[a-z]{2}-/.test(location.hash) ? location.hash : "";
    try { history.replaceState(null, "", "/universiteler?ulke=" + ulke + "&duzey=" + F.duzey + "&dil=" + F.dil + h); } catch (e) { /* file:// */ }
  }

  // ---------- Ülke seçici ----------
  var secici = document.getElementById("uv-ulke");
  function seciciCiz() {
    if (!secici) return;
    var hizli = (hedefler.length ? hedefler.slice(0, 5) : SIRALI.filter(function (k) { return DZK[k].grup === "ana"; }));
    if (hizli.indexOf(ulke) < 0) hizli = hizli.concat([ulke]);
    var digerleri = SIRALI.filter(function (k) { return hizli.indexOf(k) < 0; });
    secici.innerHTML = hizli.map(function (k) {
      return '<button type="button" class="uv-chip uv-ulke-chip" data-ulke="' + k + '" aria-pressed="' + (k === ulke) + '">' +
        '<span class="cc-rozet" aria-hidden="true">' + k.toUpperCase() + '</span>' + esc(ulkeAd(k)) + '</button>';
    }).join("") +
      (digerleri.length ? '<label class="visually-hidden" for="uv-diger">Başka bir ülke seç</label><select class="calc-select uv-diger" id="uv-diger">' +
        '<option value="">Diğer ülkeler…</option>' + digerleri.map(function (k) { return '<option value="' + k + '">' + esc(ulkeAd(k)) + '</option>'; }).join("") + '</select>' : "");
  }
  if (secici) {
    secici.addEventListener("click", function (e) { var b = e.target.closest("[data-ulke]"); if (b) goster(b.getAttribute("data-ulke"), true); });
    secici.addEventListener("change", function (e) { if (e.target.id === "uv-diger" && e.target.value) goster(e.target.value, true); });
  }
  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-git-ulke]");
    if (b) { goster(b.getAttribute("data-git-ulke"), true); var h = document.getElementById("uv-h1"); if (h) h.scrollIntoView({ behavior: AZ ? "auto" : "smooth", block: "start" }); }
  });

  // ---------- AP durumu ----------
  function apDurum(cc, u) {
    var K = KURAL[cc] || { ap: "bilinmiyor" };
    var ad = String(u.ad || "") + " " + String(u.qsAd || "");
    var o = arr(K.apUni).filter(function (x) { return x.re.test(ad); })[0];
    if (o) return { durum: o.durum, not: o.not };
    return { durum: K.apVars || K.ap, not: K.apMetin };
  }
  function apRozet(d, ek) {
    var a = AP[d] || AP.bilinmiyor;
    return '<span class="uk-ap uk-ap-' + d + '"' + (ek ? ' title="' + esc(ek) + '"' : "") + '><span class="uk-ap-s" aria-hidden="true">' + a.simge + '</span>AP: ' + a.etiket + '</span>';
  }

  // ---------- Avatar ----------
  var AV_RENK = 6;
  function basHarf(ad) {
    var m = /\(([^)]+)\)/.exec(ad || ""), k = m ? m[1].split(",")[0].trim() : "";
    if (k && /^[A-ZÀ-ÞÇĞİÖŞÜ]/.test(k)) {
      var buyuk = k.replace(/[^A-ZÀ-ÞÇĞİÖŞÜ]/g, "");
      if (buyuk.length >= 2 && buyuk.length <= 4) return buyuk;
      if (k.length <= 4) return k;
    }
    var s = String(ad || "?").replace(/^(Technische|Universit\S*|Universidad|Université|Università|University|Uniwersytet|Politechnika|Politecnico|Rijksuniversiteit|Hochschule|Alma Mater Studiorum)\s+(of\s+|de\s+|di\s+|degli Studi di\s+|zu\s+|van\s+|Wien\s+)?/i, "");
    return (s.charAt(0) || ad.charAt(0) || "?").toUpperCase();
  }
  function avRenk(ad) { var h = 0; for (var i = 0; i < ad.length; i++) h = (h * 31 + ad.charCodeAt(i)) >>> 0; return h % AV_RENK; }

  // ---------- Seçilmiş programlar (ulkeler.js) ile eşleştirme ----------
  function kokAlan(u) { var m = /^https?:\/\/([^\/?#]+)/i.exec(u || ""); if (!m) return ""; var p = m[1].toLowerCase().split("."); return p.slice(-2).join("."); }
  function secilmisEsle(cc, liste) {
    var c = SECILMIS[cc], es = {}, kalan = [];
    if (!c) return { es: es, kalan: kalan };
    var kok = {}; liste.forEach(function (u, i) { var k = kokAlan(u.url); if (k) kok[k] = i; });
    arr(c.universiteler).forEach(function (s) {
      var k = kokAlan(s.web || s.kaynak), i = kok[k];
      if (k && i != null && !es[i]) es[i] = s; else kalan.push(s);
    });
    return { es: es, kalan: kalan };
  }

  // ---------- Kart ----------
  function dilHucre(u) { var b = u[F.duzey === "yl" ? "yuksekLisans" : "lisans"] || {}; return b; }
  function kaynakListesi(b) { return (Array.isArray(b.kaynak) ? b.kaynak : (b.kaynak ? [b.kaynak] : [])).map(function (x) { return typeof x === "string" ? { ad: "Program kataloğu", url: x } : x; }); }
  var LOG_MAX = Math.log(1500);
  function kartHtml(cc, u, i, s, tip) {
    var id = "uk-" + cc + "-" + i;
    var ap = apDurum(cc, u);
    var b = dilHucre(u);
    var no = siraNo(u.qsSira);
    var w = no ? Math.max(6, Math.round((1 - Math.log(Math.max(1, no)) / LOG_MAX) * 100)) : 0;
    var kim = E && E.universiteKimligi && tip !== "secilmis" ? E.universiteKimligi(cc, u) : "";
    var muh = u.muhendislik === true;
    var dilEn = b.en, dilYerel = b.yerel;
    var hazirlik = UIST ? UIST.isterleriCoz(u, cc, { dil: F.dil === "yerel" ? "yerel" : "en", duzey: F.duzey }) : null;

    var ust =
      '<div class="uk-ust">' +
        '<span class="uk-av uk-av-' + avRenk(u.ad || "") + '" aria-hidden="true">' + esc(basHarf(u.ad)) + '</span>' +
        '<div class="uk-ad"><h3 id="' + id + '-h">' + esc(u.ad) + '</h3><span class="uk-sehir">' + IC.pin + esc(u.sehir || "—") + '</span></div>' +
      '</div>';
    var sira = no
      ? '<div class="uk-sira"><div class="uk-sira-ust"><span>QS dünya sırası</span><b>#' + esc(siraYaz(u.qsSira)) + '</b></div>' +
        '<div class="uk-bar" aria-hidden="true"><span style="--w:' + w + '%"></span></div></div>'
      : '<div class="uk-sira uk-sira-yok"><span>' + (tip === "secilmis" ? "Seçilmiş program · QS ilk 20 dışında" : "QS sırası yok") + '</span></div>';
    var alt = '<div class="uk-alt">' + apRozet(ap.durum, ap.not) +
      (u._teyit ? '<span class="uk-teyit" title="Program dili resmi katalogdan doğrulanamadı">Dil doğrulanamadı</span>' : "") +
      '<button type="button" class="uk-detay-btn" aria-expanded="false" aria-controls="' + id + '-d">Detay<span class="visually-hidden">: ' + esc(u.ad) + '</span>' + IC.ok_asagi + '</button></div>';

    // ---- Detay ----
    var d = '';
    d += '<p class="uk-satir"><b>AP: ' + esc((AP[ap.durum] || AP.bilinmiyor).etiket) + '.</b> ' + esc(ap.not || "") + '</p>';
    if (tip !== "secilmis") {
      var zAd = F.duzey === "yl" ? "yüksek lisans" : "lisans";
      d += '<div class="uk-satir"><b>Program dili (' + zAd + '):</b> <span class="uk-rozetler">' + SUI.uniDilRozet(dilEn, "İngilizce") +
        (yalnizEn(cc) ? "" : SUI.uniDilRozet(dilYerel, yerelAd(cc))) + '</span></div>';
      if (b.not) d += '<p class="uk-not">' + esc(temiz(b.not)) + '</p>';
      d += '<p class="uk-satir"><b>Mühendislik:</b> ' + (u.muhendislik === true ? "Var" : u.muhendislik === false ? "Yok" : "Bilinmiyor") + '</p>';
    }
    if (s) {
      var progs = arr(s.programlar), ist = arr(s.isterler);
      if (progs.length) d += '<div class="uk-blok"><h4>Seçilmiş programlar</h4><ul class="uk-liste">' + progs.map(function (p) {
        return '<li><strong>' + esc(p.ad) + '</strong> <span class="uk-meta">' + [p.derece, p.dil, p.sure].filter(Boolean).map(esc).join(" · ") + '</span> ' + SUI.src(p.kaynak, "Program sayfası") + '</li>';
      }).join("") + '</ul></div>';
      d += '<dl class="uk-dl"><div><dt>Başvuru dönemi</dt><dd>' + esc(temiz(s.basvuruDonemi || "Doğrulanamadı")) + '</dd></div><div><dt>Ücret</dt><dd>' + esc(temiz(s.ucret || "Doğrulanamadı")) + '</dd></div></dl>';
      if (ist.length) d += '<div class="uk-blok"><h4>Üniversiteye özel isterler</h4><ul class="uk-liste">' + ist.map(function (r) {
        return '<li><strong>' + esc(r.baslik) + '</strong> ' + esc(temiz(r.detay)) + ' ' + SUI.src(r.kaynak, "Kaynak") + '</li>';
      }).join("") + '</ul></div>';
    }
    if (u.harcNotu) d += '<p class="uk-satir"><b>Harç:</b> ' + esc(temiz(u.harcNotu)) + '</p>';
    if (hazirlik) {
      var ozel = arr(hazirlik.ozelIsterler);
      if (ozel.length && !s) d += '<div class="uk-blok"><h4>Kuruma özel</h4><ul class="uk-liste">' + ozel.map(function (o) {
        return '<li><strong>' + esc(o.baslik) + '</strong> ' + esc(o.detay) + ' ' + SUI.src(o.kaynak, "Resmi şartname") + '</li>';
      }).join("") + '</ul></div>';
      var gor = {}, dersler = arr(hazirlik.bilimSinavlari).filter(function (x) { if (!x || gor[x.kod]) return false; gor[x.kod] = 1; return true; });
      if (dersler.length) d += '<div class="uk-blok"><h4>Hazırlan</h4><div class="uk-dersler">' + dersler.map(function (x) {
        return '<a class="uk-ders" href="' + esc(x.konuUrl) + '">' + esc(x.ad) + '</a>';
      }).join("") + '</div></div>';
    }
    var kay = kaynakListesi(b);
    var srcs = kay.map(function (x) { return SUI.src(x.url, x.ad); }).join("") + SUI.src(u.url || (s && s.web), "Üniversite sitesi") +
      SUI.src(u.basvuruUrl, "Başvuru sayfası") + SUI.src(u.qsProfil, "QS profili") + (s ? SUI.src(s.kaynak, "Resmi kaynak") : "");
    if (srcs || u.kesinlik) d += '<div class="uk-kaynak">' + SUI.kes(u.kesinlik) + srcs + '</div>';

    // ---- Eylemler ----
    var adGizli = '<span class="visually-hidden">: ' + esc(u.ad) + '</span>';
    var rotaVar = hedefler.indexOf(cc) >= 0 && DZK[cc] && DZK[cc].tarihliRota && DZK[cc].tarihliRota[F.duzey === "yl" ? "yl" : "lisans"];
    var ey = '';
    if (GUEST) {
      ey += '<a class="btn-ghost btn-sm uk-eylem" href="/giris?donus=' + encodeURIComponent("/takvim?ulke=" + cc) + '">' + IC.kilit + '<span>Takvimime ekle</span>' + adGizli + '<span class="visually-hidden"> (giriş gerekir)</span></a>';
      if (kim) ey += '<a class="btn-ghost btn-sm uk-eylem" data-ilk-eposta="' + esc(kim) + '" href="/giris?donus=' + encodeURIComponent("/basvurular?uni=" + kim + "&amac=ilk-iletisim") + '">' + IC.kilit + '<span>E-posta taslağı</span>' + adGizli + '<span class="visually-hidden"> (giriş gerekir)</span></a>';
      ey += '<span class="uk-eylem-not">Giriş gerekir</span>';
    } else {
      ey += (rotaVar
        ? '<a class="btn-ghost btn-sm uk-eylem" href="/takvim?ulke=' + cc + '">' + IC.takvim + '<span>Takvimime ekle</span>' + adGizli + '</a>'
        : '<a class="btn-ghost btn-sm uk-eylem" href="' + (hedefler.indexOf(cc) >= 0 ? "/takvim?ulke=" + cc : "/profil") + '">' + IC.takvim + '<span>' + (hedefler.indexOf(cc) >= 0 ? "Takvimime ekle" : "Ülkeyi rotama ekle") + '</span>' + adGizli + '</a>');
      if (kim) {
        var on = listemOku().indexOf(kim) >= 0;
        ey += '<a class="btn-ghost btn-sm uk-eylem" data-ilk-eposta="' + esc(kim) + '" href="/basvurular?uni=' + encodeURIComponent(kim) + '&amp;amac=ilk-iletisim">' + IC.mail + '<span>E-posta taslağı</span>' + adGizli + '</a>' +
          '<button type="button" class="btn-ghost btn-sm uk-eylem uni-listem" data-listem="' + esc(kim) + '" aria-pressed="' + on + '">' + IC.yildiz + '<span class="uni-listem-t">' + (on ? "Listemde" : "Listeme ekle") + '</span>' + adGizli + '</button>';
      }
    }

    return '<article class="uk' + (u._teyit ? " is-teyit" : "") + '" style="--i:' + (typeof i === "number" ? Math.min(i, 12) : 0) + '" data-k="' + i + '" aria-labelledby="' + id + '-h"' +
      ' data-en="' + esc(dilEn || "") + '" data-yerel="' + esc(dilYerel || "") + '" data-ap="' + ap.durum + '" data-no="' + (no || "") + '" data-muh="' + muh + '" data-kim="' + esc(kim) + '">' +
      ust + sira + alt +
      '<div class="uk-detay" id="' + id + '-d" role="region" aria-labelledby="' + id + '-h"><div class="uk-detay-ic"><div class="uk-detay-govde">' + d +
        '<div class="uk-eylemler">' + ey + '</div></div></div></div>' +
    '</article>';
  }

  // ---------- Şartlar listesi ----------
  function sartlarHtml(cc) {
    var K = KURAL[cc] || {};
    var model = PROF ? PROF.ogrenciModeli : null;
    var yl = F.duzey === "yl";
    var m = [];
    function ek(ad, durum, metin) { m.push({ ad: ad, durum: durum, metin: metin }); }
    if (yl) {
      var ld = PROF && PROF.lisansDurumu;
      ek("Lisans diploması", !PROF ? "bilinmiyor" : ld === "mezun" ? "ok" : ld ? "bekliyor" : "bilinmiyor", !PROF ? "Lisans diploması (YÖK, 4 yıl)" : ld === "mezun" ? "Mezunsun" : ld ? "Mezun olunca" : "Profilinde yok");
    } else {
      ek("Lise diploması", !PROF ? "bilinmiyor" : model === "lise" ? "bekliyor" : "ok",
        (!PROF ? "En az 12 yıllık lise diploması" : model === "lise" ? "12. sınıf sonunda" : "Var") + (cc === "nl" ? " · araştırma üniversitesine tek başına yetmez" : ""));
      var yd = PROF && PROF.yerlesmeDurumu;
      if (K.yks === "yok") ek("YKS", "ok", K.yksMetin || "İstenmez");
      else if (K.yks === "yerlesme" || K.yks === "sonuc") {
        var dd = "bilinmiyor", mt = K.yksMetin;
        if (PROF && model === "lise") dd = "bekliyor";
        else if (PROF && model === "lise-mezun") {
          if (yd === "uygun") { dd = "ok"; mt = K.yks === "yerlesme" ? "Yerleştin" : "Sonuç belgen var"; }
          else if (yd === "alan-uyumsuz") { dd = K.yks === "yerlesme" ? "eksik" : "ok"; mt = K.yks === "yerlesme" ? "Alan uyumsuz: hak yalnızca yerleştiğin alan için" : "Sonuç belgen var"; }
          else if (yd === "yok") { dd = K.yks === "yerlesme" ? "eksik" : "bilinmiyor"; mt = K.yks === "yerlesme" ? "Yerleşme yok — " + K.yksMetin : K.yksMetin; }
        }
        ek(K.yks === "yerlesme" ? "YKS yerleşmesi" : "YKS sonucu", dd, mt);
      } else ek("YKS", "bilinmiyor", K.yksMetin || "Resmi ifade yok");
    }
    var dilMetin = F.dil === "en" ? "İngilizce: IELTS / TOEFL" : F.dil === "yerel" ? yerelAd(cc) + " belgesi (çoğunlukla B2–C1)" : "Programın dilinde belge";
    ek("Dil belgesi", "bilinmiyor", dilMetin);
    if (!yl) {
      var apD = K.ap || "bilinmiyor";
      ek("AP", apD === "gerekmez" ? "ok" : "bilinmiyor", apD === "gerekmez" ? "Gerekmez" : apD === "gerekli" ? "Bazı üniversitelerde gerekli" : apD === "ise-yarar" ? "Bazı programlarda işe yarar" : "Etkisi yazılı değil");
      if (K.giris) ek("Giriş sınavı", "bilinmiyor", K.giris);
    }
    return '<section class="uv-kutu uv-sartlar" aria-labelledby="uv-sartlar-h">' +
      '<div class="uv-kutu-ust"><span class="uv-kutu-ikon" aria-hidden="true">' + IC.liste + '</span><h2 id="uv-sartlar-h">Şartların</h2></div>' +
      '<ul class="uv-check">' + m.map(function (x, i) {
        var D = DURUM[x.durum];
        return '<li class="uv-c uv-c-' + x.durum + '" style="--i:' + i + '"><span class="uv-c-s" aria-hidden="true">' + D.simge + '</span>' +
          '<span class="uv-c-ad">' + esc(x.ad) + '</span><span class="uv-c-m"><span class="visually-hidden">' + D.etiket + ': </span>' + esc(x.metin) + '</span></li>';
      }).join("") + '</ul>' +
      '<p class="uv-lejant" aria-hidden="true"><span class="uv-c-ok">✓ tamam</span><span class="uv-c-eksik">! eksik</span><span class="uv-c-bilinmiyor">? bilinmiyor</span></p>' +
      (GUEST ? '<p class="uv-ipucu"><a href="/giris' + esc(A && A.erisim && A.erisim.secimSorgusu ? A.erisim.secimSorgusu() : "") + '">Giriş yap</a>, profiline göre işaretleyelim.</p>'
        : '<p class="uv-ipucu"><a href="' + esc(MO ? MO.secimAdres("/ulkem", { model: PROF.ogrenciModeli, sinif: PROF.sinif, ulke: cc, dil: F.dil === "yerel" ? "yerel" : "en" }) : "/ulkem?ulke=" + cc) + '">Tüm şartlar ve tarihler →</a></p>') +
    '</section>';
  }

  // ---------- AP özeti + ülkeler arası şerit ----------
  function apHtml(cc, veri) {
    var K = KURAL[cc] || { ap: "bilinmiyor", apMetin: "" };
    var ilk = veri && veri.lisans && arr(veri.lisans.apEtkisi)[0];
    var kay = ilk && arr(ilk.kaynak)[0];
    var gruplar = ["gerekli", "ise-yarar", "gerekmez", "bilinmiyor"].map(function (d) {
      return { d: d, l: SIRALI.filter(function (k) { return (KURAL[k] || { ap: "bilinmiyor" }).ap === d; }) };
    });
    var top = SIRALI.length || 1;
    var serit = '<div class="uv-serit" aria-hidden="true">' + gruplar.filter(function (g) { return g.l.length; }).map(function (g) {
      return '<span class="uv-serit-p uk-ap-' + g.d + '" style="flex:' + g.l.length + ' 1 0">' + g.l.length + '</span>';
    }).join("") + '</div>';
    var satirlar = gruplar.filter(function (g) { return g.l.length; }).map(function (g) {
      return '<li><span class="uv-g-ad">' + apRozet(g.d).replace("AP: ", "") + ' <span class="uv-g-say">' + g.l.length + '/' + top + '</span></span><span class="uv-g-ulkeler">' + g.l.map(function (k) {
        return '<button type="button" class="uv-mini' + (k === cc ? " is-on" : "") + '" data-git-ulke="' + k + '"' + (k === cc ? ' aria-current="true"' : "") + '>' + esc(ulkeAd(k)) + '</button>';
      }).join("") + '</span></li>';
    }).join("");
    return '<section class="uv-kutu uv-ap uv-ap-' + K.ap + '" aria-labelledby="uv-ap-h">' +
      '<div class="uv-kutu-ust"><span class="uv-kutu-ikon" aria-hidden="true">' + IC.cap + '</span><h2 id="uv-ap-h">AP burada ne işe yarar?</h2>' + apRozet(K.ap) + '</div>' +
      '<p class="uv-ap-metin">' + esc(K.apMetin) + '</p>' +
      (kay && isUrl(kay.url) ? '<p class="uv-ap-kaynak">' + SUI.kes(ilk.kesinlik) + SUI.src(kay.url, kay.ad) + '</p>' : "") +
      '<details class="uv-karsi"><summary>15 ülkede AP karşılaştırması</summary>' +
        '<p class="uv-karsi-lead">Türk lise diplomasıyla lisans başvurusunda AP\'nin rolü (ülke geneli; istisnalar kartlarda).</p>' + serit +
        '<ul class="uv-gruplar">' + satirlar + '</ul></details>' +
    '</section>';
  }

  // ---------- Kaynaklar ve notlar ----------
  function kaynakHtml(cc, veri) {
    var k = DZK[cc] || {}, c = SECILMIS[cc], p = "c-" + cc + "-";
    var parcalar = [];
    var ozet = F.duzey === "yl" ? (k.ylOzet || "") : (k.ozet || "");
    if (ozet) parcalar.push('<div class="uv-not"><h3>' + esc(ulkeAd(cc)) + ' özeti</h3><p>' + esc(temiz(ozet)) + '</p>' + (k.portal ? SUI.src(k.portal.url, k.portal.ad) : "") + '</div>');
    var uy = MO ? MO.ozetUyari(k, F.duzey, F.dil === "yerel" ? "yerel" : "en") : null;
    if (uy) parcalar.push(SUI.ozetUyariHtml(uy));
    var apE = veri && veri.lisans ? arr(veri.lisans.apEtkisi) : [];
    if (apE.length && F.duzey !== "yl") parcalar.push('<details class="uv-alt" id="' + p + 'ap"><summary>AP notları (' + apE.length + ')</summary><ul class="sr-items">' + apE.map(function (m) { return SUI.maddeHtml(m); }).join("") + '</ul></details>');
    var sir = veri && veri.universiteler ? veri.universiteler.siralama : k.siralama;
    if (sir) parcalar.push('<p class="uv-sira-not">' + SUI.siralamaHtml(sir) + '</p>');
    if (c) {
      var kabul = arr(c.kabulYolu), gi = arr(c.genelIsterler), tk = arr(c.takvim).slice().sort(function (a, b) { return String(a.tarih).localeCompare(String(b.tarih)); }), sn = arr(c.sinavlar);
      if (kabul.length) parcalar.push('<details class="uv-alt" id="' + p + 'kabul"><summary>Kabul yolu (' + kabul.length + ')</summary><ol class="uv-adimlar">' + kabul.map(function (x) {
        return '<li><h4>' + esc(x.baslik) + '</h4><p>' + esc(temiz(x.detay)) + '</p>' + SUI.src(x.kaynak) + '</li>';
      }).join("") + '</ol></details>');
      if (gi.length) parcalar.push('<details class="uv-alt" id="' + p + 'isterler"><summary>Genel isterler (' + gi.length + ')</summary><ul class="uv-adimlar">' + gi.map(function (x) {
        return '<li><h4>' + esc(x.baslik) + '</h4><p>' + esc(temiz(x.detay)) + '</p>' + SUI.src(x.kaynak) + '</li>';
      }).join("") + '</ul></details>');
      if (sn.length) parcalar.push('<details class="uv-alt" id="' + p + 'sinavlar"><summary>İlgili sınavlar (' + sn.length + ')</summary><div class="uk-dersler">' + sn.map(function (id) {
        var s = SINAV[id]; return '<a class="uk-ders" href="/sinavlar#' + encodeURIComponent(id) + '">' + esc(s ? s.ad : id) + '</a>';
      }).join("") + '</div></details>');
      if (tk.length) parcalar.push('<details class="uv-alt" id="' + p + 'takvim"><summary>Takvim (' + tk.length + ')</summary><ul class="uv-takvim">' + tk.map(function (t) {
        return '<li><b>' + esc(SUI.gunYaz(String(t.tarih).slice(0, 10)) || t.tarih) + '</b> ' + esc(temiz(t.olay)) + ' ' + SUI.src(t.kaynak, "Kaynak") + '</li>';
      }).join("") + '</ul></details>');
      var kl = arr(c.kaynaklar).filter(isUrl);
      if (kl.length) parcalar.push('<details class="uv-alt" id="' + p + 'kaynaklar"><summary>Resmi kaynaklar (' + kl.length + ')</summary><ul class="uv-takvim">' + kl.map(function (u) { return '<li>' + SUI.src(u, u) + '</li>'; }).join("") + '</ul></details>');
    }
    var bag = [];
    bag.push('<a href="' + esc(MO ? MO.secimAdres("/ulkem", { model: PROF && PROF.ogrenciModeli, sinif: PROF && PROF.sinif, ulke: cc, dil: F.dil === "yerel" ? "yerel" : "en" }) : "/ulkem?ulke=" + cc) + '">' + esc(ulkeAd(cc)) + ': tüm şartlar →</a>');
    if (GUIDE[cc]) bag.push('<a href="' + GUIDE[cc] + '">Ayrıntılı ' + esc(ulkeAd(cc)) + ' rehberi →</a>');
    if (!GUEST && hedefler.indexOf(cc) >= 0) bag.push('<a href="/takvim?ulke=' + cc + '">' + esc(ulkeAd(cc)) + ' takvimim →</a>');
    parcalar.push('<p class="uv-baglar">' + bag.join("") + '</p>');
    return '<details class="uv-kaynaklar" id="' + p + 'notlar"><summary><span>Kaynaklar ve notlar</span></summary><div class="uv-kaynaklar-ic">' + parcalar.join("") + '</div></details>';
  }

  // ---------- Çizim ----------
  var durum = { cc: null, kartlar: [], say: null };
  function goster(cc, kullanici) {
    if (!DZK[cc]) return;
    ulke = cc;
    seciciCiz();
    if (kullanici) adresYaz();
    root.setAttribute("aria-busy", "true");
    root.innerHTML = '<div class="uv-yukleniyor"><span class="spinner" aria-hidden="true"></span> ' + esc(ulkeAd(cc)) + ' yükleniyor…</div>';
    SUI.veriYukle(cc, DZK[cc]).then(function (r) { if (ulke === cc) ciz(cc, r.veri); });
  }

  function ciz(cc, veri) {
    root.removeAttribute("aria-busy");
    var U = veri && veri.universiteler && arr(veri.universiteler.liste).length ? veri.universiteler : null;
    var liste = U ? arr(U.liste).filter(function (u) { return u && u.ad; }).slice().sort(function (a, b) { return (+a.sira || 99) - (+b.sira || 99); }) : [];
    var es = secilmisEsle(cc, liste);
    var k = DZK[cc] || {};
    var yerelVar = !yalnizEn(cc);
    if (F.dil === "yerel" && !yerelVar) F.dil = "en";
    var zAd = F.duzey === "yl" ? "Yüksek lisans" : "";

    var apVar = liste.some(function (u) { var d = apDurum(cc, u).durum; return d === "gerekli" || d === "ise-yarar"; });
    var ilk100Var = liste.some(function (u) { var n = siraNo(u.qsSira); return n && n <= 100; });
    function chip(ad, anahtar, deger, metin) {
      return '<button type="button" class="uv-chip uv-filtre" data-f="' + anahtar + '"' + (deger != null ? ' data-v="' + deger + '"' : "") + ' aria-pressed="false">' + IC.ok_kucuk + '<span>' + esc(metin) + '</span></button>';
    }
    var filtreler = '<div class="uv-filtreler" role="group" aria-label="Üniversiteleri süz">' +
      chip("dil", "dil", "en", "İngilizce program") +
      (yerelVar ? chip("dil", "dil", "yerel", yerelAd(cc) + " program") : "") +
      (apVar ? chip("ap", "ap", null, "AP isteyen / işe yarayan") : "") +
      (ilk100Var ? chip("ilk100", "ilk100", null, "Dünyada ilk 100") : "") +
      chip("muh", "muh", null, "Mühendislik") +
      (GUEST ? "" : '<button type="button" class="uv-chip uv-filtre" data-f="listem" aria-pressed="false">' + IC.ok_kucuk + '<span>Listem <span class="uv-chip-say" data-listem-say>' + listemOku().length + '</span></span></button>') +
    '</div>';

    var bolum = '<section class="uv-liste" aria-labelledby="uv-liste-h">' +
      '<div class="uv-liste-ust"><h2 id="uv-liste-h">' + esc(ulkeAd(cc)) + ': en iyi ' + (liste.length || "") + ' üniversite</h2>' +
        (F.duzey === "yl" ? '<span class="uv-duzey">' + zAd + ' <a href="/universiteler?ulke=' + cc + '&amp;duzey=lisans&amp;dil=' + F.dil + '">Lisansa geç</a></span>' : "") + '</div>' +
      (liste.length ? filtreler + '<p class="uv-say" id="uv-say" aria-live="polite"></p>' +
        '<div class="uk-grid" id="uk-grid">' + liste.map(function (u, i) { return kartHtml(cc, u, i, es.es[i]); }).join("") + '</div>' +
        '<div class="uv-bos" id="uv-bos" hidden><p><strong>Bu filtrelerle üniversite yok.</strong></p><button type="button" class="btn-ghost btn-sm" data-temizle>Filtreleri temizle</button></div>'
        : '<div class="uv-bos"><p><strong>İlk 20 listesi hazırlanıyor.</strong> ' + esc(ulkeAd(cc)) + ' için QS sıralamasına göre üniversiteler resmi sayfalarından doğrulanıyor.</p></div>') +
    '</section>';

    var secBolum = "";
    if (es.kalan.length && F.duzey !== "yl") {
      secBolum = '<details class="uv-secilmis"><summary>Rotaya uygun seçilmiş programlar <span class="uv-chip-say">' + es.kalan.length + '</span></summary>' +
        '<p class="uv-karsi-lead">QS ilk 20 dışında kalan, İngilizce lisans programı doğrulanmış üniversiteler.</p>' +
        '<div class="uk-grid">' + es.kalan.map(function (s, i) {
          var u = { ad: s.ad, sehir: s.sehir, url: s.web, muhendislik: null };
          return kartHtml(cc, u, "s" + i, s, "secilmis");
        }).join("") + '</div></details>';
    }

    root.innerHTML = '<div class="uv-ust-izgara">' + apHtml(cc, veri) + sartlarHtml(cc) + '</div>' + bolum + secBolum + kaynakHtml(cc, veri);

    // Filtre çiplerinin başlangıç durumu
    root.querySelectorAll(".uv-filtre").forEach(function (b) {
      var f = b.getAttribute("data-f"), v = b.getAttribute("data-v");
      b.setAttribute("aria-pressed", String(f === "dil" ? F.dil === v : !!F[f]));
    });
    durum.cc = cc;
    durum.kartlar = Array.prototype.slice.call(root.querySelectorAll("#uk-grid > .uk"));
    uygula(false);

    // Eski çapa (#c-de-kabul, #c-de-takvim …): Kaynaklar bölümünü ve alt bölümü açar
    var h = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
    if (h && h.tagName === "DETAILS" && root.contains(h)) {
      var ust = h.closest(".uv-kaynaklar"); if (ust) ust.open = true;
      h.open = true; h.scrollIntoView({ block: "start" });
    }
  }

  // Süzme + FLIP sıralama animasyonu
  function uygula(anim) {
    var grid = document.getElementById("uk-grid"); if (!grid) return;
    var kartlar = durum.kartlar;
    var L = F.listem ? listemOku() : null;
    var ilk = {};
    if (anim && !AZ) kartlar.forEach(function (el) { if (!el.hidden) ilk[el.dataset.k] = el.getBoundingClientRect(); });
    var gor = [], teyit = [];
    kartlar.forEach(function (el) {
      var ok = true, ty = false;
      if (F.dil === "en" || F.dil === "yerel") {
        var v = el.dataset[F.dil];
        if (v === "teyit") ty = true; else if (v !== "var" && v !== "kismi") ok = false;
      }
      if (F.ap && el.dataset.ap !== "gerekli" && el.dataset.ap !== "ise-yarar") ok = false;
      if (F.ilk100 && !(+el.dataset.no && +el.dataset.no <= 100)) ok = false;
      if (F.muh && el.dataset.muh !== "true") ok = false;
      if (L && L.indexOf(el.dataset.kim) < 0) ok = false;
      el.hidden = !ok;
      el.classList.toggle("is-teyit", ok && ty);
      if (ok) (ty ? teyit : gor).push(el);
    });
    // Doğrulanamayan dil hücreleri gizlenmez, sona alınır (karar K-B)
    gor.concat(teyit).forEach(function (el) { grid.appendChild(el); });
    kartlar.filter(function (el) { return el.hidden; }).forEach(function (el) { grid.appendChild(el); });
    var n = gor.length + teyit.length;
    var say = document.getElementById("uv-say");
    if (say) say.textContent = kartlar.length + " üniversiteden " + n + " gösteriliyor" + (teyit.length ? " (" + teyit.length + " tanesinin program dili doğrulanamadı, sonda)" : "");
    var bos = document.getElementById("uv-bos"); if (bos) bos.hidden = n > 0;
    if (!anim || AZ || typeof Element.prototype.animate !== "function") return;
    gor.concat(teyit).forEach(function (el) {
      var once = ilk[el.dataset.k], son = el.getBoundingClientRect();
      if (once) {
        var dx = once.left - son.left, dy = once.top - son.top;
        if (dx || dy) el.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" });
      } else {
        el.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
    });
  }

  root.addEventListener("click", function (e) {
    var t = e.target;
    var fb = t.closest(".uv-filtre");
    if (fb) {
      var f = fb.getAttribute("data-f"), v = fb.getAttribute("data-v");
      if (f === "dil") { F.dil = F.dil === v ? "hepsi" : v; adresYaz(); }
      else F[f] = !F[f];
      root.querySelectorAll(".uv-filtre").forEach(function (b) {
        var ff = b.getAttribute("data-f"), vv = b.getAttribute("data-v");
        b.setAttribute("aria-pressed", String(ff === "dil" ? F.dil === vv : !!F[ff]));
      });
      uygula(true);
      return;
    }
    if (t.closest("[data-temizle]")) {
      F.dil = "hepsi"; F.ap = F.ilk100 = F.muh = F.listem = false; adresYaz();
      root.querySelectorAll(".uv-filtre").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      uygula(true);
      var ilkC = root.querySelector(".uv-filtre"); if (ilkC) ilkC.focus();
      return;
    }
    var db = t.closest(".uk-detay-btn");
    if (db) {
      var acik = db.getAttribute("aria-expanded") === "true";
      db.setAttribute("aria-expanded", String(!acik));
      var p = document.getElementById(db.getAttribute("aria-controls"));
      if (p) p.classList.toggle("is-acik", !acik);
      var kart = db.closest(".uk"); if (kart) kart.classList.toggle("is-acik", !acik);
      return;
    }
    var lb = t.closest(".uni-listem");
    if (lb && A && A.panel) {
      var kim = lb.getAttribute("data-listem");
      var o = A.panel.update(function (pn) {
        var Ls = Array.isArray(pn.universitelerim) ? pn.universitelerim : [];
        var i = Ls.indexOf(kim);
        if (i >= 0) Ls.splice(i, 1); else Ls.push(kim);
        pn.universitelerim = Ls;
      });
      var on = o.universitelerim.indexOf(kim) >= 0;
      lb.setAttribute("aria-pressed", String(on));
      lb.querySelector(".uni-listem-t").textContent = on ? "Listemde" : "Listeme ekle";
      document.querySelectorAll("[data-listem-say]").forEach(function (x) { x.textContent = String(o.universitelerim.length); });
      if (F.listem && !on) uygula(true);
    }
  });

  seciciCiz();
  if (!DZ.length) {
    root.innerHTML = '<div class="uv-bos"><p><strong>Üniversite verisi hazırlanıyor.</strong></p><a class="btn-primary" href="/sinavlar">Sınavlara geç</a></div>';
    return;
  }
  adresYaz(true);
  goster(ulke, false);
})();
