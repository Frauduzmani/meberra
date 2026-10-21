/* ==========================================================================
   Meberra — Yönetici paneli (admin.html)
   Sözleşme: server/API.md, "Yönetici" ve "Premium" bölümleri.
   Bağımlılık yok. Kullanıcıdan gelen her metin esc() ile kaçırılarak HTML'e girer.
   Saf yardımcılar node ile test edilir: module.exports (tarayıcıda window.MeberraAdmin).
   ========================================================================== */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------------------
     1. SAF YARDIMCILAR
     ------------------------------------------------------------------------ */
  var ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/[&<>"'`]/g, function (c) { return ESC_MAP[c]; });
  }
  function sayiMi(n) { return n !== null && n !== "" && typeof n !== "boolean" && Number.isFinite(Number(n)); }
  function sayi(n) { return sayiMi(n) ? Number(n).toLocaleString("tr-TR") : "—"; }
  function tl(n) {
    if (!sayiMi(n)) return "—";
    return "₺" + Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function tarih(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString("tr-TR");
  }
  function gunTarih(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("tr-TR");
  }
  /** Türkçe yüzde biçimi: "%85". Payda 0 ya da geçersizse "—". */
  function yuzde(pay, payda) {
    var a = Number(pay), b = Number(payda);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return "—";
    return "%" + Math.round((a / b) * 100).toLocaleString("tr-TR");
  }
  function planAd(p) {
    if (p === "aylik") return "Aylık";
    if (p === "yillik") return "Yıllık";
    return p ? String(p) : "—";
  }
  var TALEP_DURUM = { bekliyor: "Bekliyor", onaylandi: "Onaylandı", reddedildi: "Reddedildi" };
  function talepDurumAd(d) { return TALEP_DURUM[d] || (d ? String(d) : "—"); }
  function talepDurumTon(d) { return d === "onaylandi" ? "ok" : d === "reddedildi" ? "bad" : d === "bekliyor" ? "warn" : "notr"; }
  function hesapDurumAd(d) { return d === "askida" ? "Askıda" : d === "aktif" ? "Aktif" : d ? String(d) : "—"; }

  var MODEL = { "lise": "Lise öğrencisi", "lise-mezun": "Lise mezunu", "uni-mezun": "Üniversite mezunu" };
  function modelAd(m) { return MODEL[m] || (m ? String(m) : "—"); }
  var ULKE = {
    de: "Almanya", it: "İtalya", at: "Avusturya", ch: "İsviçre", nl: "Hollanda", be: "Belçika", fr: "Fransa",
    es: "İspanya", se: "İsveç", fi: "Finlandiya", dk: "Danimarka", ie: "İrlanda", hu: "Macaristan", pl: "Polonya", cz: "Çekya"
  };
  function ulkeListesi(list) {
    if (!Array.isArray(list) || !list.length) return "—";
    return list.map(function (k) { return ULKE[k] || String(k).toUpperCase(); }).join(", ");
  }
  function dilAd(d) { return d === "en" ? "İngilizce" : d === "yerel" ? "Yerel dil" : d ? String(d) : "—"; }
  var DERS = {
    "ap-calculus": "AP Calculus", "ap-physics": "AP Physics", "ap-chemistry": "AP Chemistry",
    "ap-biology": "AP Biology", "ap-english": "AP English", "ap-electives": "AP Seçmeliler"
  };
  function dersAd(sayfa) {
    var k = String(sayfa || "").replace(/^.*\//, "").replace(/\.html?$/i, "");
    return DERS[k] || (sayfa ? String(sayfa) : "—");
  }
  /** Boş/null değerleri atlayarak sorgu dizesi kurar: {q:"a b", sayfa:2} → "?q=a%20b&sayfa=2" */
  function sorgu(p) {
    var parts = [];
    Object.keys(p || {}).forEach(function (k) {
      var v = p[k];
      if (v === undefined || v === null || v === "" || v === false) return;
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v === true ? "1" : v));
    });
    return parts.length ? "?" + parts.join("&") : "";
  }
  /**
   * Sayfalama bilgisi. API sayfa boyutu döndürmüyor (bkz. rapor); boyut, yanıttaki
   * sayfaBoyutu/boyut/limit alanından ya da ilk sayfanın satır sayısından çıkarılır.
   */
  function sayfaBilgisi(toplam, sayfa, boyut, satirSayisi) {
    var t = Math.max(0, Number(toplam) || 0);
    var s = Math.max(1, Number(sayfa) || 1);
    var b = Math.max(1, Number(boyut) || 50);
    var sayfaSayisi = Math.max(1, Math.ceil(t / b));
    var n = Number(satirSayisi);
    var ilk = t === 0 ? 0 : (s - 1) * b + 1;
    var son = t === 0 ? 0 : Math.min(t, (s - 1) * b + (Number.isFinite(n) ? n : b));
    return { toplam: t, sayfa: s, boyut: b, sayfaSayisi: sayfaSayisi, ilk: ilk, son: son, onceki: s > 1, sonraki: s < sayfaSayisi };
  }
  function boyutCikar(veri, liste, eskiBoyut) {
    var acik = veri && (veri.sayfaBoyutu || veri.boyut || veri.limit);
    if (sayiMi(acik) && Number(acik) > 0) return Number(acik);
    var s = Number(veri && veri.sayfa) || 1;
    var n = Array.isArray(liste) ? liste.length : 0;
    var t = Number(veri && veri.toplam) || 0;
    if (s === 1 && n > 0 && n < t) return n;
    return eskiBoyut || 50;
  }
  /** Denetim ayrıntısını okunur JSON'a çevirir (dize JSON ise ayrıştırır). */
  function ayrintiMetni(v) {
    if (v == null || v === "") return "";
    if (typeof v === "string") {
      try { return JSON.stringify(JSON.parse(v), null, 2); } catch (e) { return v; }
    }
    try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); }
  }
  /** Denetim kaydındaki kullanici / yapan: nesne, kimlik ya da metin olabilir. */
  function kisiAd(v) {
    if (v == null || v === "") return "—";
    if (typeof v === "object") {
      var ad = [v.ad, v.soyad].filter(Boolean).join(" ");
      var ek = v.eposta ? " (" + v.eposta + ")" : "";
      return (ad || (v.id != null ? "#" + v.id : "—")) + ek;
    }
    if (sayiMi(v)) return "#" + v;
    return String(v);
  }
  function adSoyad(u) {
    if (!u) return "—";
    var s = [u.ad, u.soyad].filter(Boolean).join(" ").trim();
    return s || u.kullaniciAdi || u.eposta || (u.id != null ? "#" + u.id : "—");
  }
  /** "Ödeyen adı" hesap sahibinden farklı mı? (Türkçe büyük/küçük harf ve boşluk duyarsız) */
  function adFarkli(odeyen, u) {
    var n = function (s) { return String(s || "").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim(); };
    var a = n(odeyen), b = n(u ? (u.ad || "") + " " + (u.soyad || "") : "");
    return !!(a && b && a !== b);
  }
  /** Premium gün alanı: boş → null (plana göre), 1–3650 tamsayı → sayı, aksi → hata metni. */
  function gunDogrula(v) {
    var s = String(v == null ? "" : v).trim();
    if (!s) return { ok: true, gun: null };
    if (!/^\d+$/.test(s)) return { ok: false, hata: "Gün sayısı tam sayı olmalı." };
    var n = Number(s);
    if (n < 1 || n > 3650) return { ok: false, hata: "Gün sayısı 1 ile 3650 arasında olmalı." };
    return { ok: true, gun: n };
  }

  var SORU_DURUM = { bekliyor: "Bekliyor", cevaplandi: "Yanıtlandı", kapandi: "Kapandı" };
  function soruDurumAd(d) { return SORU_DURUM[d] || (d ? String(d) : "—"); }
  function soruDurumTon(d) { return d === "bekliyor" ? "warn" : d === "cevaplandi" ? "ok" : "notr"; }
  var HEDEF = { hepsi: "Tüm kullanıcılar", premium: "Yalnızca Premium üyeler", ucretsiz: "Yalnızca ücretsiz üyeler" };
  function hedefAd(h) { return HEDEF[h] || (h ? String(h) : "—"); }
  var KADEME = ["Bronz", "Gümüş", "Altın", "Elmas", "Şampiyon"];
  function kademeAd(k) { return KADEME[Number(k) - 1] || (k ? String(k) : "—"); }
  function kisalt(v, n) {
    var s = v == null ? "" : String(v);
    return s.length > n ? s.slice(0, Math.max(1, n - 1)) + "…" : s;
  }
  /** Veri hücresi metni: null → "∅", nesne → JSON, uzun metin kısaltılır */
  function hucreMetni(v, n) {
    if (v === null || v === undefined) return "∅";
    if (typeof v === "object") { try { v = JSON.stringify(v); } catch (e) { v = String(v); } }
    return kisalt(v, n || 60);
  }
  /** Düzenleme farkı: yalnızca değişen alanlar ({alan, once, sonra}). null ve "" eşit sayılır. */
  function farkHesapla(orijinal, yeni) {
    var n = function (v) { return v == null ? "" : String(v); };
    return Object.keys(yeni || {}).filter(function (k) { return n((orijinal || {})[k]) !== n(yeni[k]); })
      .map(function (k) { return { alan: k, once: (orijinal || {})[k], sonra: yeni[k] }; });
  }
  /** Duyuru bağlantısı: boş ya da site içi göreli yol ("/..."); "//", "http:", "javascript:" geçmez */
  function linkGecerli(l) { return !l || /^\/(?![/\\])[^\s<>"']*$/.test(String(l)); }
  /** Veri tablosu adresi (liste ya da CSV) */
  function veriYolu(tablo, f, csv) {
    f = f || {};
    return "/api/admin/veri/" + encodeURIComponent(tablo) + (csv ? ".csv" : "") +
      sorgu({ q: f.q, alan: f.alan && f.deger !== undefined ? f.alan : "", deger: f.alan ? f.deger : "", sirala: f.sirala, yon: f.sirala ? f.yon : "", sayfa: csv ? "" : (f.sayfa > 1 ? f.sayfa : "") });
  }

  /* --- Sistem logları ---------------------------------------------------- */
  var SEVIYE = { hata: "Hata", uyari: "Uyarı", bilgi: "Bilgi" };
  function seviyeAd(s) { return SEVIYE[s] || (s ? String(s) : "—"); }
  var KAYNAK = { sunucu: "Sunucu", istemci: "Tarayıcı", zamanlayici: "Zamanlayıcı", eposta: "E-posta", push: "Push", guvenlik: "Güvenlik" };
  function kaynakAd(k) { return KAYNAK[k] || (k ? String(k) : "—"); }
  var LOG_DURUM = { yeni: "Yeni", incelendi: "İncelendi", cozuldu: "Çözüldü" };
  function logDurumAd(d) { return LOG_DURUM[d] || (d ? String(d) : "—"); }
  /** Saniye → "3 g 4 sa" / "2 sa 5 dk" / "7 dk" */
  function sureMetni(sn) {
    if (!sayiMi(sn)) return "—";
    var t = Math.max(0, Math.floor(Number(sn)));
    var g = Math.floor(t / 86400), s = Math.floor((t % 86400) / 3600), d = Math.floor((t % 3600) / 60);
    if (g) return g + " g " + s + " sa";
    if (s) return s + " sa " + d + " dk";
    return d + " dk";
  }
  /** Bayt → "12,4 MB" */
  function boyutMetni(b) {
    if (!sayiMi(b)) return "—";
    var birim = ["B", "KB", "MB", "GB", "TB"], i = 0, n = Math.max(0, Number(b));
    while (n >= 1024 && i < birim.length - 1) { n /= 1024; i++; }
    return n.toLocaleString("tr-TR", { maximumFractionDigits: i ? 1 : 0 }) + " " + birim[i];
  }
  /** ISO → "az önce" / "5 dk önce" / "3 sa önce" / "2 gün önce" */
  function goreceZaman(iso, simdiMs) {
    var t = iso ? Date.parse(iso) : NaN;
    if (isNaN(t)) return "—";
    var f = Math.round(((simdiMs == null ? Date.now() : simdiMs) - t) / 1000);
    if (f < 45) return "az önce";
    if (f < 3600) return Math.max(1, Math.round(f / 60)) + " dk önce";
    if (f < 86400) return Math.round(f / 3600) + " sa önce";
    return Math.round(f / 86400) + " gün önce";
  }
  /** ISO'dan bu yana geçen saat (geçersizse null) */
  function saatFarki(iso, simdiMs) {
    var t = iso ? Date.parse(iso) : NaN;
    return isNaN(t) ? null : ((simdiMs == null ? Date.now() : simdiMs) - t) / 3600e3;
  }
  /** Mini çubuk yükseklikleri (%): en büyük 100; sıfır olmayan değer en az 8 */
  function cubukOranlari(dizi) {
    var l = (Array.isArray(dizi) ? dizi : []).map(function (x) { return Math.max(0, Number(x) || 0); });
    var m = Math.max.apply(null, [0].concat(l));
    return l.map(function (x) { return m ? Math.max(x ? 8 : 0, Math.round((x / m) * 100)) : 0; });
  }
  /** Yedek yaşı durumu: yok | eski (> 36 sa) | ok */
  function yedekDurumu(sonYedek, simdiMs) {
    if (!sonYedek || !sonYedek.zaman) return "yok";
    var s = saatFarki(sonYedek.zaman, simdiMs);
    return s == null || s > 36 ? "eski" : "ok";
  }

  /* --- Varlık, SLA, engel ------------------------------------------------ */
  var VARLIK = { cevrimici: "Çevrimiçi", yakin: "Son 30 dk", cevrimdisi: "Çevrimdışı" };
  /** Son görülmeden varlık durumu (sunucuyla aynı eşikler: 5 dk / 30 dk) */
  function varlikHesapla(iso, simdiMs) {
    var t = iso ? Date.parse(iso) : NaN;
    if (isNaN(t)) return "cevrimdisi";
    var f = (simdiMs == null ? Date.now() : simdiMs) - t;
    return f <= 5 * 60e3 ? "cevrimici" : f <= 30 * 60e3 ? "yakin" : "cevrimdisi";
  }
  function varlikAd(v) { return VARLIK[v] || VARLIK.cevrimdisi; }
  /** Bekleme süresi rozeti: < 24 sa ok, 24–48 sa warn (amber), > 48 sa bad (kırmızı) */
  function slaDurumu(iso, simdiMs) {
    var s = saatFarki(iso, simdiMs);
    if (s == null) return null;
    var ton = s > 48 ? "bad" : s > 24 ? "warn" : "ok";
    var metin = s < 1 ? Math.max(1, Math.round(s * 60)) + " dk" : s < 48 ? Math.floor(s) + " sa" : Math.floor(s / 24) + " gün";
    return { ton: ton, metin: metin, saat: s };
  }
  var ENGEL_SURE = { suresiz: "Süresiz", "1g": "1 gün", "7g": "7 gün", "30g": "30 gün" };
  function engelSureAd(s) { return ENGEL_SURE[s] || "Süresiz"; }
  /** Yüzde (0–1) → "%1,5" */
  function oranMetni(x) {
    if (!sayiMi(x)) return "—";
    return "%" + (Number(x) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 });
  }

  var yardimci = {
    varlikHesapla: varlikHesapla, varlikAd: varlikAd, slaDurumu: slaDurumu, engelSureAd: engelSureAd, oranMetni: oranMetni,
    seviyeAd: seviyeAd, kaynakAd: kaynakAd, logDurumAd: logDurumAd, sureMetni: sureMetni, boyutMetni: boyutMetni,
    goreceZaman: goreceZaman, saatFarki: saatFarki, cubukOranlari: cubukOranlari, yedekDurumu: yedekDurumu,
    soruDurumAd: soruDurumAd, soruDurumTon: soruDurumTon, hedefAd: hedefAd, kademeAd: kademeAd, kisalt: kisalt, hucreMetni: hucreMetni,
    farkHesapla: farkHesapla, linkGecerli: linkGecerli, veriYolu: veriYolu,
    esc: esc, sayi: sayi, tl: tl, tarih: tarih, gunTarih: gunTarih, yuzde: yuzde, planAd: planAd,
    talepDurumAd: talepDurumAd, talepDurumTon: talepDurumTon, hesapDurumAd: hesapDurumAd, modelAd: modelAd,
    ulkeListesi: ulkeListesi, dilAd: dilAd, dersAd: dersAd, sorgu: sorgu, sayfaBilgisi: sayfaBilgisi,
    boyutCikar: boyutCikar, ayrintiMetni: ayrintiMetni, kisiAd: kisiAd, adSoyad: adSoyad, adFarkli: adFarkli,
    gunDogrula: gunDogrula
  };
  if (typeof module !== "undefined" && module.exports) module.exports = yardimci;
  root.MeberraAdmin = yardimci;
  if (typeof document === "undefined") return;

  /* ------------------------------------------------------------------------
     2. API
     ------------------------------------------------------------------------ */
  var GIRIS = "giris.html?donus=admin.html";
  yardimci.yonlendir = function (url) { window.location.href = url; };

  function ApiHata(mesaj, durum, veri) {
    var e = new Error(mesaj); e.durum = durum; e.veri = veri; return e;
  }
  function api(yol, yontem, govde) {
    var opts = {
      method: yontem || "GET",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Meberra": "1" }
    };
    if (govde !== undefined) opts.body = JSON.stringify(govde);
    return fetch(yol, opts).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (veri) {
        if (res.status === 401) {
          yardimci.yonlendir(GIRIS);
          throw ApiHata("Oturumun sona erdi. Giriş sayfasına yönlendiriliyorsun.", 401, veri);
        }
        if (!res.ok || !veri || veri.ok === false) {
          var m = (veri && veri.error) || (res.status === 403 ? "Bu işlem için yetkin yok." : "İstek tamamlanamadı (HTTP " + res.status + ").");
          if (veri && veri.errors && typeof veri.errors === "object") {
            var alanlar = Object.keys(veri.errors).map(function (k) { return veri.errors[k]; }).filter(Boolean);
            if (alanlar.length && !veri.error) m = alanlar.join(" ");
          }
          throw ApiHata(m, res.status, veri);
        }
        return veri;
      });
    }, function () {
      throw ApiHata("Sunucuya ulaşılamadı. Bağlantını kontrol edip yeniden dene.", 0, null);
    });
  }

  /* ------------------------------------------------------------------------
     3. DURUM VE KÜÇÜK ARAYÜZ PARÇALARI
     ------------------------------------------------------------------------ */
  var S = {
    sekme: "ozet",
    yuklendi: {},
    talepDurum: "bekliyor",
    kul: { q: "", premium: false, varlik: "", sirala: "", sayfa: 1, boyut: 0, istek: 0, satirlar: [] },
    surum: "",
    hazir: null,           // hazır yanıtlar (önbellek)
    yoneticiler: null,
    secili: null,          // { id, veri }
    den: { kullanici: "", eylem: "", sayfa: 1, boyut: 0, istek: 0 },
    talepIstek: 0,
    durumBilinen: {},      // detay yanıtında user.durum yoksa son başarılı /durum işleminin sonucu
    soru: { durum: "bekliyor", q: "", sirala: "", atanan: "", sayfa: 1, istek: 0, secili: null, liste: [] },
    ops: { istek: 0, son: null },
    veri: { tablolar: null, tablo: "", q: "", alan: "", deger: "", sirala: "", yon: "desc", sayfa: 1, istek: 0, sonuc: null, secili: null },
    lig: { hafta: "", istek: 0 },
    sis: { seviye: "", kaynak: "", durum: "yeni", q: "", sayfa: 1, boyut: 0, istek: 0, ozetIstek: 0, secili: {}, satirlar: [], sonGuncelleme: null, acikLog: null }
  };
  var SEKMELER = [
    { id: "ozet", ad: "Özet", ikon: "ozet" },
    { id: "talepler", ad: "Ödeme talepleri", sayac: "adm-bekleyen", ikon: "talepler" },
    { id: "sorular", ad: "Destek merkezi", sayac: "adm-soru-bekleyen", ikon: "sorular" },
    { id: "kullanicilar", ad: "Kullanıcılar", ikon: "kullanicilar" },
    { id: "duyuru", ad: "Duyuru", ikon: "duyuru" },
    { id: "lig", ad: "Lig", ikon: "lig" },
    { id: "sistem", ad: "Sistem", sayac: "adm-sistem-yeni", sayacTon: "bad", ikon: "sistem" },
    { id: "veri", ad: "Veri", ikon: "veri" },
    { id: "denetim", ad: "Denetim kaydı", ikon: "denetim" }
  ];
  var main, bildirimEl, bildirimZaman;
  var $ = function (sel, kap) { return (kap || document).querySelector(sel); };

  /* Satır içi SVG simgeler (Lucide çizgi stili; currentColor, dekoratif → aria-hidden) */
  var IKON = {
    ozet: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    talepler: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    sorular: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9.5 8.5a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 2-2.4 3.3M12 14h.01"/>',
    kullanicilar: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    duyuru: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    lig: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.5 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    veri: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    sistem: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    denetim: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    hata: '<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><path d="M12 8v4M12 16h.01"/>',
    uyari: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    bilgi: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    yenile: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
    kopya: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    kapat: '<path d="M18 6 6 18M6 6l12 12"/>',
    saat: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    disk: '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01M10 16h.01"/>',
    yedek: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    posta: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    ok: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
    grafik: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    kayit: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    tac: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>',
    cevap: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    nabiz: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    ok_sag: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    engel: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    bakim: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
    hiz: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    sil: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    not: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
    cihaz: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    cikis: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    kuyruk: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    kalkan: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/>',
    arti: '<path d="M12 5v14M5 12h14"/>',
    ara: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'
  };
  function ikon(ad, sinif) {
    return '<svg class="adm-ikon' + (sinif ? " " + sinif : "") + '" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (IKON[ad] || "") + "</svg>";
  }

  function yukleniyor(metin) {
    return '<p class="adm-yukleniyor" role="status"><span class="adm-spin" aria-hidden="true"></span>' + esc(metin || "Yükleniyor…") + "</p>";
  }
  /** İskelet yükleme (yerleşim kaymasını önler). tur: kart | tablo | saglik | cekmece */
  function iskelet(tur, n) {
    var tekrar = function (k, s) { var o = ""; for (var i = 0; i < k; i++) o += s; return o; };
    var durum = '<p class="visually-hidden" role="status">Yükleniyor…</p>';
    if (tur === "kart") return durum + '<ul class="adm-tiles" aria-hidden="true">' + tekrar(n || 8, '<li><div class="adm-tile adm-isk-kart"><span class="adm-isk adm-isk-y"></span><span class="adm-isk adm-isk-b"></span><span class="adm-isk adm-isk-k"></span></div></li>') + "</ul>";
    if (tur === "saglik") return durum + '<ul class="adm-saglik" aria-hidden="true">' + tekrar(n || 5, '<li class="adm-saglik-kart adm-isk-kart"><span class="adm-isk adm-isk-y"></span><span class="adm-isk adm-isk-b"></span><span class="adm-isk adm-isk-k"></span></li>') + "</ul>";
    if (tur === "cekmece") return durum + '<div class="adm-isk-cekmece" aria-hidden="true"><span class="adm-isk adm-isk-b"></span>' + tekrar(6, '<span class="adm-isk adm-isk-k"></span>') + '<span class="adm-isk adm-isk-blok"></span></div>';
    return durum + '<div class="adm-isk-tablo" aria-hidden="true">' + tekrar(n || 6, '<div class="adm-isk-satir"><span class="adm-isk"></span><span class="adm-isk"></span><span class="adm-isk"></span><span class="adm-isk"></span></div>') + "</div>";
  }
  function bos(metin, baslik, ikonAd) {
    if (!baslik) return '<p class="adm-bos">' + esc(metin) + "</p>";
    return '<div class="adm-bos adm-bos-zengin">' + ikon(ikonAd || "ok", "adm-bos-ikon") + '<p class="adm-bos-baslik">' + esc(baslik) + "</p><p>" + esc(metin) + "</p></div>";
  }
  function hataKutusu(metin) {
    return '<div class="adm-hata" role="alert"><p>' + esc(metin) + '</p><button type="button" class="btn-ghost btn-sm" data-tekrar>Yeniden dene</button></div>';
  }
  function rozet(metin, ton) { return '<span class="adm-rozet is-' + esc(ton || "notr") + '">' + esc(metin) + "</span>"; }
  /** Varlık çipi: nokta + metin (renk tek başına anlam taşımaz) */
  function varlikCip(v, sonGorulme) {
    v = VARLIK[v] ? v : varlikHesapla(sonGorulme);
    var baslik = sonGorulme ? "Son görülme: " + tarih(sonGorulme) : "Hiç görülmedi";
    return '<span class="adm-varlik is-' + esc(v) + '" title="' + esc(baslik) + '"><span class="adm-varlik-nokta" aria-hidden="true"></span>' + esc(varlikAd(v)) + "</span>";
  }
  function slaRozet(iso) {
    var s = slaDurumu(iso);
    if (!s) return "";
    return '<span class="adm-sla is-' + s.ton + '" title="' + esc("Bekliyor: " + tarih(iso)) + '">' + ikon("saat") + "<span>" + esc(s.metin) + "</span></span>";
  }
  function zamanHucre(iso) {
    return iso ? '<time datetime="' + esc(iso) + '" title="' + esc(tarih(iso)) + '">' + esc(goreceZaman(iso)) + "</time>" : '<span class="adm-alt">—</span>';
  }

  /** Görünür, aria-live bildirim şeridi. ton: ok | bad | info */
  function bildir(metin, ton) {
    if (!bildirimEl) return;
    clearTimeout(bildirimZaman);
    bildirimEl.className = "adm-bildirim is-" + (ton || "info");
    bildirimEl.textContent = metin;
    bildirimEl.hidden = false;
    bildirimZaman = setTimeout(function () { bildirimEl.hidden = true; bildirimEl.textContent = ""; }, ton === "bad" ? 12000 : 7000);
  }

  /**
   * Satır içi onay kutusu (window.confirm yerine).
   * kap: boş bir <div>; tetik: odağın döneceği düğme.
   * o: { baslik, metin, onayMetni, tehlike, notEtiketi, onayla(not) → Promise }
   */
  var onaySayac = 0;
  function onayAc(kap, tetik, o) {
    var id = "adm-onay-" + (++onaySayac);
    kap.hidden = false;
    kap.innerHTML =
      '<div class="adm-onay-ic' + (o.tehlike ? " is-tehlike" : "") + '" role="group" aria-labelledby="' + id + '-b">' +
        '<p class="adm-onay-baslik" id="' + id + '-b" tabindex="-1">' + esc(o.baslik) + "</p>" +
        (o.metin ? '<p class="adm-onay-metin">' + esc(o.metin) + "</p>" : "") +
        (o.notEtiketi ? '<div class="field"><label for="' + id + '-not">' + esc(o.notEtiketi) + '</label>' +
          '<textarea class="text-input adm-not" id="' + id + '-not" rows="2" maxlength="500"></textarea></div>' : "") +
        '<p class="adm-onay-hata" role="alert" hidden></p>' +
        '<div class="adm-eylem">' +
          '<button type="button" class="btn-primary' + (o.tehlike ? " adm-tehlike" : "") + '" data-evet>' + esc(o.onayMetni || "Onayla") + "</button>" +
          '<button type="button" class="btn-ghost" data-vazgec>Vazgeç</button>' +
        "</div>" +
      "</div>";
    var baslik = $("#" + id + "-b", kap), evet = $("[data-evet]", kap), vazgec = $("[data-vazgec]", kap);
    var hataEl = $(".adm-onay-hata", kap), notEl = $("textarea", kap);
    if (tetik) tetik.setAttribute("aria-expanded", "true");
    function kapat(odakla) {
      kap.hidden = true; kap.innerHTML = "";
      if (tetik) { tetik.setAttribute("aria-expanded", "false"); if (odakla && document.body.contains(tetik)) tetik.focus(); }
    }
    vazgec.addEventListener("click", function () { kapat(true); });
    kap.addEventListener("keydown", function k(e) {
      if (e.key === "Escape" && !evet.disabled) { e.stopPropagation(); kap.removeEventListener("keydown", k); kapat(true); }
    });
    evet.addEventListener("click", function () {
      evet.disabled = true; vazgec.disabled = true;
      var eskiMetin = evet.textContent; evet.textContent = "İşleniyor…";
      hataEl.hidden = true;
      Promise.resolve().then(function () { return o.onayla(notEl ? notEl.value.trim() : ""); }).then(function () {
        kapat(false);
      }, function (err) {
        evet.disabled = false; vazgec.disabled = false; evet.textContent = eskiMetin;
        hataEl.textContent = (err && err.message) || "İşlem tamamlanamadı.";
        hataEl.hidden = false;
        evet.focus();
      });
    });
    baslik.focus();
    return { kapat: kapat };
  }

  function sayfalamaHtml(b, etiket, birim) {
    if (b.toplam === 0) return "";
    return '<nav class="adm-sayfa" aria-label="' + esc(etiket) + '">' +
      '<button type="button" class="btn-ghost" data-sayfa="' + (b.sayfa - 1) + '"' + (b.onceki ? "" : " disabled") + '>‹ Önceki</button>' +
      '<span class="adm-sayfa-bilgi">Sayfa ' + sayi(b.sayfa) + " / " + sayi(b.sayfaSayisi) +
        ' <span class="adm-alt">· ' + sayi(b.ilk) + "–" + sayi(b.son) + " / " + sayi(b.toplam) + " " + esc(birim) + "</span></span>" +
      '<button type="button" class="btn-ghost" data-sayfa="' + (b.sayfa + 1) + '"' + (b.sonraki ? "" : " disabled") + ">Sonraki ›</button>" +
      "</nav>";
  }

  /* ------------------------------------------------------------------------
     4. KABUK: BAŞLIK, SEKMELER, PANELLER
     ------------------------------------------------------------------------ */
  function kabukKur(me) {
    main.innerHTML =
      '<header class="adm-ust">' +
        '<div class="adm-ust-metin">' +
          '<span class="adm-ust-eyebrow">' + ikon("nabiz") + 'Yönetim <span class="adm-ust-surum" id="adm-surum" hidden></span></span>' +
          "<h1>Yönetici paneli</h1>" +
          "<p>Talepler, kullanıcılar, içerik ve sistem sağlığı tek yerde. " +
          '<span class="adm-ust-kim">Oturum: ' + esc(adSoyad(me.user)) + "</span></p>" +
        "</div>" +
        '<button type="button" class="adm-durum-pill" id="adm-durum-pill" data-git="sistem" hidden></button>' +
      "</header>" +
      '<div class="adm-bakim-serit" id="adm-bakim-serit" role="status" hidden></div>' +
      '<div class="adm-bildirim" role="status" aria-live="polite" hidden></div>' +
      '<div class="adm-kabuk">' +
        '<div class="adm-yan"><div class="adm-sekme-kap"><div class="adm-sekmeler" role="tablist" aria-label="Yönetici bölümleri">' +
          SEKMELER.map(function (s) {
            return '<button type="button" role="tab" class="adm-sekme" id="sekme-' + s.id + '" aria-controls="panel-' + s.id + '" aria-selected="false" tabindex="-1" data-sekme="' + s.id + '">' +
              '<span class="adm-sekme-ikon">' + ikon(s.ikon) + '</span><span class="adm-sekme-ad">' + esc(s.ad) + "</span>" +
              (s.sayac ? ' <span class="adm-sayac' + (s.sayacTon ? " is-" + s.sayacTon : "") + '" id="' + s.sayac + '" hidden></span>' : "") + "</button>";
          }).join("") +
        "</div></div></div>" +
        '<div class="adm-icerik">' +
          SEKMELER.map(function (s) {
            return '<section class="adm-panel" role="tabpanel" id="panel-' + s.id + '" aria-labelledby="sekme-' + s.id + '" tabindex="0" hidden></section>';
          }).join("") +
        "</div>" +
      "</div>" +
      '<footer class="adm-alt-bilgi"><span>Meberra yönetici paneli</span><span id="adm-alt-surum"></span></footer>';
    bildirimEl = $(".adm-bildirim", main);
    $("#adm-durum-pill").addEventListener("click", function () { sekmeAc("sistem"); $("#sekme-sistem").focus(); });
    $("#adm-bakim-serit").addEventListener("click", function (e) {
      if (e.target.closest("[data-bakim-git]")) { sekmeAc("sistem"); var k = $("#ops-bakim"); if (k) k.scrollIntoView({ block: "start" }); }
    });
    surumYukle();

    var liste = $(".adm-sekmeler", main);
    liste.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sekme]"); if (b) sekmeAc(b.getAttribute("data-sekme"));
    });
    liste.addEventListener("keydown", function (e) {
      var tabs = Array.prototype.slice.call(liste.querySelectorAll("[role=tab]"));
      var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var j = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      sekmeAc(tabs[j].getAttribute("data-sekme"));
      tabs[j].focus();
    });

    panelOzetKur(); panelTalepKur(); panelSoruKur(); panelKulKur(); panelDuyuruKur(); panelLigKur(); panelVeriKur(); panelDenKur(); panelSistemKur();
    // Canlı yenileme: sekme görünürken 30 sn'de bir (Sistem: loglar + sağlık; diğerleri: sayaçlar ve özet). Çekmece açıkken beklenir.
    setInterval(function () {
      if (document.visibilityState !== "visible" || cekmeceAcik()) return;
      if (S.sekme === "sistem") sistemYukle(true); else ozetYukle(true);
      if (S.sekme !== "sistem") bakimSeridi();
    }, 30000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && S.sekme === "sistem" && !cekmeceAcik()) sistemYukle(true);
    });

    var ilk = (location.hash || "").replace(/^#/, "");
    sekmeAc(SEKMELER.some(function (s) { return s.id === ilk; }) ? ilk : "ozet");
    // Sayfa açıkken admin.html#veri gibi bir adrese gidilirse eşleşen sekme açılır
    window.addEventListener("hashchange", function () {
      var h = (location.hash || "").replace(/^#/, "");
      if (h !== S.sekme && SEKMELER.some(function (s) { return s.id === h; })) sekmeAc(h);
    });
    // Bekleyen talep sayısı her sekmede görünsün
    if (S.sekme !== "ozet") ozetYukle(true);
  }

  function sekmeAc(id) {
    S.sekme = id;
    SEKMELER.forEach(function (s) {
      var t = $("#sekme-" + s.id), p = $("#panel-" + s.id), etkin = s.id === id;
      t.setAttribute("aria-selected", etkin ? "true" : "false");
      t.tabIndex = etkin ? 0 : -1;
      p.hidden = !etkin;
      // Dar ekranda yatay sekme şeridinde seçili sekme görünür kalsın
      var kap = t.closest(".adm-sekme-kap");
      if (etkin && kap && kap.scrollWidth > kap.clientWidth + 2) { try { t.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) { /* eski tarayıcı */ } }
    });
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* file:// vb. */ }
    if (id === "ozet") ozetYukle();
    else if (id === "talepler") talepYukle();
    else if (id === "kullanicilar") { if (!S.yuklendi.kullanicilar) kulYukle(); }
    else if (id === "denetim") denYukle();
    else if (id === "sorular") soruYukle(!!S.soru.secili);
    else if (id === "duyuru") duyuruOnizle();
    else if (id === "lig") ligYukle();
    else if (id === "veri") { if (!S.veri.tablolar) veriTablolarYukle(); }
    else if (id === "sistem") sistemYukle();
  }

  /** Sürüm (başlık + alt bilgi) ve bakım şeridi: /api/health (sürüm package.json'dan) */
  function surumYukle() {
    fetch("/api/health", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (v) {
      if (!v || !v.surum) return;
      S.surum = v.surum;
      var a = $("#adm-surum"); if (a) { a.textContent = "v" + v.surum; a.hidden = false; }
      var b = $("#adm-alt-surum"); if (b) b.textContent = "Sürüm " + v.surum;
      if (v.bakim) bakimSeridi(); else bakimSeridiCiz(null);
    }).catch(function () { /* sürüm gösterilmezse panel yine çalışır */ });
  }
  function bakimSeridi() {
    return api("/api/admin/bakim").then(function (v) { bakimSeridiCiz(v.bakim); }).catch(function () {});
  }
  function bakimSeridiCiz(b) {
    var s = $("#adm-bakim-serit"); if (!s) return;
    if (!b || !b.acik) { s.hidden = true; s.innerHTML = ""; return; }
    s.hidden = false;
    s.innerHTML = ikon("bakim") + '<span class="adm-bakim-metin"><strong>Bakım modu açık</strong> · Ziyaretçiler bakım sayfasını görüyor' +
      (b.bitis ? ", planlanan bitiş " + esc(tarih(b.bitis)) : "") + ". Sen yönetici olarak siteyi normal kullanıyorsun.</span>" +
      '<button type="button" class="btn-ghost btn-sm" data-bakim-git>Yönet</button>';
  }

  /* ------------------------------------------------------------------------
     5. ÖZET
     ------------------------------------------------------------------------ */
  function panelOzetKur() {
    var p = $("#panel-ozet");
    p.innerHTML = '<div class="adm-panel-ust"><h2>Özet</h2><button type="button" class="btn-ghost" data-yenile>Yenile</button></div><div class="adm-ozet-icerik"></div>';
    p.addEventListener("click", function (e) {
      if (e.target.closest("[data-yenile],[data-tekrar]")) ozetYukle();
      var git = e.target.closest("[data-git]");
      if (git) {
        var gv = git.getAttribute("data-git-varlik");
        if (gv) { S.kul.varlik = gv; S.kul.sayfa = 1; S.yuklendi.kullanicilar = false; var sel = $("#kul-varlik"); if (sel) sel.value = gv; }
        sekmeAc(git.getAttribute("data-git")); $("#sekme-" + git.getAttribute("data-git")).focus();
      }
    });
  }
  /** Mini çubuklar (son 7 gün). Veri yoksa ya da hepsi 0 ise çizilmez. */
  function miniCubuklar(dizi, etiket) {
    if (!Array.isArray(dizi) || !dizi.some(function (x) { return Number(x) > 0; })) return "";
    var o = cubukOranlari(dizi), son = dizi.length - 1;
    return '<span class="adm-mini" role="img" aria-label="' + esc(etiket + ": " + dizi.map(function (x) { return sayi(x); }).join(", ")) + '">' +
      o.map(function (h, i) { return '<span class="adm-mini-cubuk' + (i === son ? " is-son" : "") + '" style="height:' + h + '%"></span>'; }).join("") + "</span>";
  }
  /** Sistem sekmesi sayacı + başlıktaki durum düğmesi */
  function sistemSayac(yeniHata, yeniUyari) {
    var h = Number(yeniHata) || 0, u = Number(yeniUyari) || 0;
    var r = $("#adm-sistem-yeni");
    if (r) { r.hidden = h <= 0; r.textContent = sayi(h); r.setAttribute("aria-label", sayi(h) + " yeni hata"); }
    var p = $("#adm-durum-pill");
    if (!p) return;
    p.hidden = false;
    p.className = "adm-durum-pill " + (h ? "is-bad" : u ? "is-warn" : "is-ok");
    p.innerHTML = ikon(h ? "hata" : u ? "uyari" : "ok") + "<span>" + (h ? esc(sayi(h)) + " yeni hata" : u ? esc(sayi(u)) + " yeni uyarı" : "Sistem sağlıklı") + "</span>";
    p.setAttribute("aria-label", (h ? sayi(h) + " yeni hata" : u ? sayi(u) + " yeni uyarı" : "Sistem sağlıklı") + ". Sistem sekmesini aç.");
  }
  function bekleyenRozet(n, id) {
    var r = $("#" + (id || "adm-bekleyen")); if (!r) return;
    var x = Number(n) || 0;
    r.hidden = x <= 0;
    r.textContent = sayi(x);
    r.setAttribute("aria-label", sayi(x) + " bekleyen");
  }
  function ozetYukle(sessiz) {
    var kap = $("#panel-ozet .adm-ozet-icerik");
    if (!kap) return Promise.resolve();
    if (!sessiz) { kap.innerHTML = iskelet("kart", 8); kap.setAttribute("aria-busy", "true"); }
    return api("/api/admin/stats").then(function (v) {
      bekleyenRozet(v.talep && v.talep.bekleyen);
      bekleyenRozet(v.soru && v.soru.bekleyen, "adm-soru-bekleyen");
      var sis = v.sistem || null;
      if (sis) sistemSayac(sis.yeniHata, sis.yeniUyari);
      if (sessiz && S.sekme !== "ozet") return;
      var k = v.kullanici || {}, pr = v.premium || {}, t = v.talep || {}, c = v.cevap || {}, g = v.gelirTahmini || {}, sq = v.soru || {}, seri = v.seri || {};
      var kart = function (o) {
        var ic = '<span class="adm-tile-ust"><span class="adm-tile-ikon">' + ikon(o.ikon || "grafik") + '</span><span class="adm-tile-etiket">' + esc(o.etiket) + "</span></span>" +
          '<span class="adm-tile-deger">' + o.deger + "</span>" +
          (o.alt ? '<span class="adm-tile-alt">' + o.alt + "</span>" : "") + miniCubuklar(o.seri, o.etiket + ", son 7 gün");
        return o.git
          ? '<li><button type="button" class="adm-tile is-' + (o.ton || "notr") + ' is-tik" data-git="' + o.git + '"' + (o.gitVarlik ? ' data-git-varlik="' + o.gitVarlik + '"' : "") + ">" + ic + "</button></li>"
          : '<li><div class="adm-tile is-' + (o.ton || "notr") + '">' + ic + "</div></li>";
      };
      var yeniHata = sis ? Number(sis.yeniHata) || 0 : 0;
      var alarm = yeniHata > 0
        ? '<button type="button" class="adm-alarm" data-git="sistem">' + ikon("hata", "adm-alarm-ikon") +
            '<span class="adm-alarm-metin"><strong>' + esc(sayi(yeniHata)) + " yeni hata</strong>" +
            "<span>Sistem loglarında incelenmeyi bekleyen hata var. İncelemek için tıkla.</span></span>" + ikon("ok_sag", "adm-alarm-ok") + "</button>"
        : "";
      kap.innerHTML = alarm + '<ul class="adm-tiles">' +
        kart({ etiket: "Bekleyen ödeme talebi", ikon: "talepler", deger: esc(sayi(t.bekleyen)), alt: Number(t.bekleyen) > 0 ? "İncelemek için tıkla" : "Bekleyen talep yok", ton: Number(t.bekleyen) > 0 ? "enerji" : "notr", git: "talepler" }) +
        kart({ etiket: "Bekleyen soru", ikon: "sorular", deger: esc(sayi(sq.bekleyen)), alt: Number(sq.bekleyen) > 0 ? "Yanıtlamak için tıkla" : "Bekleyen soru yok", ton: Number(sq.bekleyen) > 0 ? "enerji" : "notr", git: "sorular" }) +
        kart({ etiket: "Aktif Premium", ikon: "tac", deger: esc(sayi(pr.aktif)), alt: "Aylık " + esc(sayi(pr.aylik)) + " · Yıllık " + esc(sayi(pr.yillik)), ton: "mor" }) +
        kart({ etiket: "Tahmini aylık gelir", ikon: "grafik", deger: esc(tl(g.aylikTL)), alt: "Aktif aboneliklere göre", ton: "ok" }) +
        (sayiMi(k.cevrimici) ? kart({ etiket: "Şu an çevrimiçi", ikon: "nabiz", deger: esc(sayi(k.cevrimici)),
          alt: "Son 30 dk: " + esc(sayi(k.yakin)) + " · Bugün giriş: " + esc(sayi(k.bugunGiris)), ton: Number(k.cevrimici) > 0 ? "ok" : "notr", git: "kullanicilar", gitVarlik: "cevrimici" }) : "") +
        kart({ etiket: "Toplam kullanıcı", ikon: "kullanicilar", deger: esc(sayi(k.toplam)), alt: "Listeyi açmak için tıkla", git: "kullanicilar" }) +
        kart({ etiket: "Son 7 gün yeni kayıt", ikon: "kayit", deger: esc(sayi(k.son7gun)), seri: seri.kayit }) +
        kart({ etiket: "Son 7 gün aktif", ikon: "nabiz", deger: esc(sayi(k.aktif7gun)) }) +
        kart({ etiket: "Toplam cevap", ikon: "cevap", deger: esc(sayi(c.toplam)), alt: "Son 7 gün: " + esc(sayi(c.son7gun)), seri: seri.cevap }) +
        "</ul>";
    }).catch(function (e) {
      if (!sessiz) kap.innerHTML = hataKutusu(e.message);
    }).then(function () { kap.removeAttribute("aria-busy"); });
  }

  /* ------------------------------------------------------------------------
     6. ÖDEME TALEPLERİ
     ------------------------------------------------------------------------ */
  function panelTalepKur() {
    var p = $("#panel-talepler");
    p.innerHTML =
      '<div class="adm-panel-ust"><h2>Ödeme talepleri</h2>' +
        '<div class="adm-arac">' +
          '<div class="field adm-field-dar"><label for="talep-durum">Durum</label>' +
            '<select id="talep-durum" class="text-input">' +
              '<option value="bekliyor">Bekleyenler</option><option value="onaylandi">Onaylananlar</option>' +
              '<option value="reddedildi">Reddedilenler</option><option value="tumu">Tümü</option>' +
            "</select></div>" +
          '<button type="button" class="btn-ghost" data-yenile>Yenile</button>' +
        "</div></div>" +
      '<p class="adm-ipucu">Havale/EFT dekontunu bankada doğruladıktan sonra onayla. Onay, kullanıcıya planın süresi kadar Premium verir.</p>' +
      '<div class="adm-talep-liste"></div>';
    $("#talep-durum").addEventListener("change", function (e) { S.talepDurum = e.target.value; talepYukle(); });
    p.addEventListener("click", function (e) {
      if (e.target.closest("[data-yenile],[data-tekrar]")) { talepYukle(); return; }
      var b = e.target.closest("[data-islem]"); if (!b) return;
      var kart = b.closest("[data-talep]");
      talepOnay(kart, b, b.getAttribute("data-islem"));
    });
  }
  function talepYukle() {
    var kap = $("#panel-talepler .adm-talep-liste");
    var no = ++S.talepIstek;
    kap.innerHTML = yukleniyor("Talepler yükleniyor…"); kap.setAttribute("aria-busy", "true");
    return api("/api/admin/talepler" + sorgu({ durum: S.talepDurum })).then(function (v) {
      if (no !== S.talepIstek) return;
      var liste = Array.isArray(v.talepler) ? v.talepler : [];
      if (S.talepDurum === "bekliyor") bekleyenRozet(liste.length);
      if (!liste.length) {
        kap.innerHTML = bos(S.talepDurum === "bekliyor" ? "Bekleyen ödeme talebi yok." : "Bu filtreye uyan talep yok.");
        return;
      }
      kap.innerHTML = '<p class="adm-sonuc">' + esc(sayi(liste.length)) + " talep</p>" +
        '<ul class="adm-talepler">' + liste.map(talepKart).join("") + "</ul>";
    }).catch(function (e) {
      if (no === S.talepIstek) kap.innerHTML = hataKutusu(e.message);
    }).then(function () { kap.removeAttribute("aria-busy"); });
  }
  function talepKart(t) {
    var u = t.kullanici || {};
    var farkli = adFarkli(t.odeyenAd, u);
    var id = esc(t.id);
    return '<li class="adm-talep surface" data-talep="' + id + '" data-plan="' + esc(t.plan) + '" data-tutar="' + esc(t.tutar) + '" data-ad="' + esc(adSoyad(u)) + '">' +
      '<div class="adm-talep-ust">' +
        '<div class="adm-min0"><h3 class="adm-talep-ad">' + esc(adSoyad(u)) + "</h3>" +
          '<p class="adm-alt adm-kir">' + esc(u.eposta || "—") + "</p></div>" +
        rozet(talepDurumAd(t.durum), talepDurumTon(t.durum)) +
      "</div>" +
      '<dl class="adm-dl">' +
        "<div><dt>Plan</dt><dd>" + esc(planAd(t.plan)) + "</dd></div>" +
        '<div><dt>Tutar</dt><dd class="adm-tutar">' + esc(tl(t.tutar)) + "</dd></div>" +
        "<div><dt>Ödeyen adı</dt><dd>" + esc(t.odeyenAd || "—") +
          (farkli ? ' <span class="adm-uyari-not">Hesap sahibinden farklı</span>' : "") + "</dd></div>" +
        "<div><dt>Tarih</dt><dd>" + esc(tarih(t.olusturma)) + "</dd></div>" +
        '<div class="adm-dl-genis"><dt>Açıklama</dt><dd class="adm-kir">' + esc(t.aciklama || "—") + "</dd></div>" +
        '<div><dt>Talep no</dt><dd>#' + id + "</dd></div>" +
      "</dl>" +
      (t.durum === "bekliyor"
        ? '<div class="adm-eylem">' +
            '<button type="button" class="btn-primary" data-islem="onayla" aria-expanded="false">Onayla</button>' +
            '<button type="button" class="btn-ghost adm-ghost-tehlike" data-islem="reddet" aria-expanded="false">Reddet</button>' +
          "</div><div class=\"adm-onay\" hidden></div>"
        : "") +
      "</li>";
  }
  function talepOnay(kart, tetik, islem) {
    var kap = $(".adm-onay", kart);
    kart.querySelectorAll("[data-islem]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    var ad = kart.getAttribute("data-ad"), plan = planAd(kart.getAttribute("data-plan")), tutar = tl(kart.getAttribute("data-tutar"));
    var onay = islem === "onayla";
    onayAc(kap, tetik, {
      baslik: onay ? ad + " için ödemeyi onaylıyor musun?" : ad + " için talebi reddediyor musun?",
      metin: onay
        ? plan + " plan, " + tutar + ". Onaylayınca Premium hemen açılır."
        : "Kullanıcıya Premium verilmez. Reddetme nedenini nota yazabilirsin.",
      onayMetni: onay ? "Evet, onayla" : "Evet, reddet",
      tehlike: !onay,
      notEtiketi: "Not (isteğe bağlı)",
      onayla: function (not) {
        var govde = { islem: islem }; if (not) govde.not = not;
        return api("/api/admin/talepler/" + encodeURIComponent(kart.getAttribute("data-talep")), "POST", govde).then(function () {
          bildir(onay ? ad + " için ödeme onaylandı; Premium açıldı." : ad + " için talep reddedildi.", "ok");
          talepYukle().then(function () { var h = $("#panel-talepler h2"); if (h) { h.tabIndex = -1; h.focus(); } });
          ozetYukle(true);
          S.yuklendi.kullanicilar = false;
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
     7. KULLANICILAR
     ------------------------------------------------------------------------ */
  function panelKulKur() {
    var p = $("#panel-kullanicilar");
    p.innerHTML =
      '<div class="adm-kul-liste-gorunum">' +
        '<div class="adm-panel-ust"><h2>Kullanıcılar</h2></div>' +
        '<form class="adm-arac adm-arac-genis" role="search" aria-label="Kullanıcı ara" novalidate>' +
          '<div class="field adm-field-esnek"><label for="kul-q">Ara</label>' +
            '<input type="search" id="kul-q" class="text-input" placeholder="Ad, soyad ya da e-posta" autocomplete="off" maxlength="100"></div>' +
          '<div class="field adm-field-dar"><label for="kul-varlik">Durum</label><select id="kul-varlik" class="text-input">' +
            '<option value="">Tümü</option><option value="cevrimici">Çevrimiçi (5 dk)</option><option value="yakin">Son 30 dk aktif</option><option value="engelli">Engelli / askıda</option></select></div>' +
          '<div class="field adm-field-dar"><label for="kul-sirala">Sırala</label><select id="kul-sirala" class="text-input">' +
            '<option value="">Kayıt (yeni önce)</option><option value="gorulme">Son görülme</option><option value="giris">Son giriş</option></select></div>' +
          '<label class="adm-check"><input type="checkbox" id="kul-premium"> <span>Yalnızca Premium</span></label>' +
        "</form>" +
        '<p class="adm-sonuc" id="kul-ozet" aria-live="polite"></p>' +
        '<div class="adm-kul-liste"></div>' +
        '<div class="adm-kul-sayfa"></div>' +
      "</div>" +
      '<div class="adm-detay" hidden></div>';

    var zaman = null;
    $("#kul-q").addEventListener("input", function (e) {
      clearTimeout(zaman);
      var v = e.target.value.trim();
      zaman = setTimeout(function () { if (v !== S.kul.q) { S.kul.q = v; S.kul.sayfa = 1; kulYukle(); } }, 350);
    });
    $("form", p).addEventListener("submit", function (e) {
      e.preventDefault(); clearTimeout(zaman);
      S.kul.q = $("#kul-q").value.trim(); S.kul.sayfa = 1; kulYukle();
    });
    $("#kul-premium").addEventListener("change", function (e) { S.kul.premium = e.target.checked; S.kul.sayfa = 1; kulYukle(); });
    $("#kul-varlik").addEventListener("change", function (e) { S.kul.varlik = e.target.value; S.kul.sayfa = 1; kulYukle(); });
    $("#kul-sirala").addEventListener("change", function (e) { S.kul.sirala = e.target.value; S.kul.sayfa = 1; kulYukle(); });

    $(".adm-kul-liste-gorunum", p).addEventListener("click", function (e) {
      if (e.target.closest("[data-tekrar]")) { kulYukle(); return; }
      var sb = e.target.closest("[data-sayfa]");
      if (sb && !sb.disabled) { S.kul.sayfa = Number(sb.getAttribute("data-sayfa")); kulYukle().then(function () { $("#kul-ozet").focus(); }); return; }
      var kb = e.target.closest("[data-kul]");
      if (kb) { detayAc(kb.getAttribute("data-kul")); return; }
      var tr = e.target.closest("tr[data-satir]");
      if (tr && !e.target.closest("a,button,input")) detayAc(tr.getAttribute("data-satir"));
    });
    $(".adm-detay", p).addEventListener("click", detayTik);
  }

  function kulYukle() {
    S.yuklendi.kullanicilar = true;
    var kap = $("#panel-kullanicilar .adm-kul-liste"), say = $("#panel-kullanicilar .adm-kul-sayfa"), oz = $("#kul-ozet");
    var no = ++S.kul.istek;
    kap.setAttribute("aria-busy", "true");
    if (!kap.querySelector("table")) kap.innerHTML = iskelet("tablo", 8);
    else kap.classList.add("is-soluk");
    var vs = $("#kul-varlik"); if (vs && vs.value !== S.kul.varlik) vs.value = S.kul.varlik;
    return api("/api/admin/users" + sorgu({ q: S.kul.q, sayfa: S.kul.sayfa, premium: S.kul.premium ? 1 : "", varlik: S.kul.varlik, sirala: S.kul.sirala })).then(function (v) {
      if (no !== S.kul.istek) return;
      var liste = Array.isArray(v.kullanicilar) ? v.kullanicilar : [];
      S.kul.satirlar = liste;
      S.kul.boyut = boyutCikar(v, liste, S.kul.boyut);
      var b = sayfaBilgisi(v.toplam, v.sayfa || S.kul.sayfa, S.kul.boyut, liste.length);
      oz.tabIndex = -1;
      oz.textContent = b.toplam ? sayi(b.toplam) + " kullanıcı bulundu" + (S.kul.q ? " (“" + S.kul.q + "”)" : "") + "." : "";
      if (!liste.length) {
        kap.innerHTML = bos(S.kul.q || S.kul.premium || S.kul.varlik ? "Bu filtreye uyan kullanıcı yok." : "Henüz kayıtlı kullanıcı yok.");
        say.innerHTML = "";
        return;
      }
      var ipVar = liste.some(function (u) { return "sonIp" in u || "sonGorulme" in u; });
      kap.innerHTML = '<div class="adm-tablo-kap adm-kul-kap"><table class="adm-tablo adm-kartlas adm-kul-tablo">' +
        '<caption class="visually-hidden">Kullanıcılar, sayfa ' + esc(sayi(b.sayfa)) + "</caption>" +
        '<thead><tr><th scope="col">Kullanıcı</th>' + (ipVar ? '<th scope="col">Durum</th><th scope="col">Son görülme</th><th scope="col">IP</th><th scope="col" class="adm-sag">Bugün giriş</th>' : "") +
        '<th scope="col">Son giriş</th><th scope="col">Hesap</th><th scope="col">Premium</th><th scope="col" class="adm-sag">Cevap</th><th scope="col">Kayıt</th></tr></thead><tbody>' +
        liste.map(function (u) {
          var pr = u.premium
            ? rozet(planAd(u.plan), "mor") + (u.bitis ? ' <span class="adm-alt">' + esc(gunTarih(u.bitis)) + " bitiş</span>" : "")
            : '<span class="adm-alt">Yok</span>';
          var hesapR = u.engel ? rozet(u.engel.dolmus ? "Engel süresi doldu" : "Engelli", u.engel.dolmus ? "warn" : "bad") : rozet(hesapDurumAd(u.durum), u.durum === "askida" ? "bad" : "ok");
          return '<tr data-satir="' + esc(u.id) + '">' +
            '<td data-label="Kullanıcı" class="adm-hucre-kisi"><button type="button" class="adm-link" data-kul="' + esc(u.id) + '">' + esc(adSoyad(u)) + "</button>" +
              '<span class="adm-alt adm-kir">' + esc(u.eposta || "") + "</span></td>" +
            (ipVar
              ? '<td data-label="Durum">' + varlikCip(u.varlik, u.sonGorulme) + "</td>" +
                '<td data-label="Son görülme" class="adm-nowrap">' + zamanHucre(u.sonGorulme) + "</td>" +
                '<td data-label="IP"><code class="adm-kod adm-ip">' + esc(u.sonIp || u.sonGirisIp || "—") + "</code></td>" +
                '<td data-label="Bugün giriş" class="adm-sag">' + (Number(u.bugunGiris) ? "<strong>" + esc(sayi(u.bugunGiris)) + "</strong>" : '<span class="adm-alt">0</span>') + "</td>"
              : "") +
            '<td data-label="Son giriş" class="adm-nowrap">' + zamanHucre(u.sonGiris) + "</td>" +
            '<td data-label="Hesap">' + hesapR + "</td>" +
            '<td data-label="Premium">' + pr + "</td>" +
            '<td data-label="Cevap" class="adm-sag">' + esc(sayi(u.cevapSayisi)) + "</td>" +
            '<td data-label="Kayıt" class="adm-nowrap">' + esc(gunTarih(u.olusturma)) + "</td>" +
            "</tr>";
        }).join("") + "</tbody></table></div>";
      say.innerHTML = sayfalamaHtml(b, "Kullanıcı sayfaları", "kullanıcı");
    }).catch(function (e) {
      if (no === S.kul.istek) { kap.innerHTML = hataKutusu(e.message); say.innerHTML = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); kap.classList.remove("is-soluk"); });
  }

  function detayAc(id) {
    var p = $("#panel-kullanicilar");
    var listeG = $(".adm-kul-liste-gorunum", p), d = $(".adm-detay", p);
    listeG.hidden = true; d.hidden = false;
    d.innerHTML = '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Kullanıcı listesine dön</button></div>' + yukleniyor("Kullanıcı yükleniyor…");
    $("[data-geri]", d).focus();
    S.secili = { id: id, veri: null };
    return detayYukle();
  }
  function detayYukle() {
    var d = $("#panel-kullanicilar .adm-detay"), id = S.secili && S.secili.id;
    if (!id) return Promise.resolve();
    d.setAttribute("aria-busy", "true");
    return api("/api/admin/users/" + encodeURIComponent(id)).then(function (v) {
      if (!S.secili || S.secili.id !== id) return;
      S.secili.veri = v;
      d.innerHTML = detayHtml(v);
      var h = $("#kul-detay-baslik", d); if (h) h.focus();
    }).catch(function (e) {
      d.innerHTML = '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Kullanıcı listesine dön</button></div>' + hataKutusu(e.message);
    }).then(function () { d.removeAttribute("aria-busy"); });
  }
  function detayKapat() {
    var p = $("#panel-kullanicilar");
    var id = S.secili && S.secili.id;
    S.secili = null;
    $(".adm-detay", p).hidden = true; $(".adm-detay", p).innerHTML = "";
    $(".adm-kul-liste-gorunum", p).hidden = false;
    var btn = id != null ? p.querySelector('[data-kul="' + (window.CSS && CSS.escape ? CSS.escape(String(id)) : String(id)) + '"]') : null;
    if (btn) btn.focus(); else $("#kul-q").focus();
  }

  /** Bir kullanıcının hesap durumu: detay yanıtında user.durum yoksa liste satırından alınır. */
  function hesapDurumu(v) {
    if (v.user && v.user.durum) return v.user.durum;
    if (v.durum) return v.durum;
    var id = String(v.user && v.user.id);
    if (S.durumBilinen[id]) return S.durumBilinen[id];
    var sat = S.kul.satirlar.filter(function (x) { return String(x.id) === String(v.user && v.user.id); })[0];
    return sat ? sat.durum : "aktif";
  }

  function genelTablo(satirlar, sutunlar, baslik) {
    if (!Array.isArray(satirlar) || !satirlar.length) return bos("Kayıt yok.");
    var var_ = sutunlar.filter(function (s) { return satirlar.some(function (r) { return r && r[s.k] != null && r[s.k] !== ""; }); });
    if (!var_.length) var_ = sutunlar.slice(0, 1);
    return '<div class="adm-tablo-kap"><table class="adm-tablo adm-kartlas"><caption class="visually-hidden">' + esc(baslik) + "</caption><thead><tr>" +
      var_.map(function (s) { return '<th scope="col"' + (s.sag ? ' class="adm-sag"' : "") + ">" + esc(s.ad) + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      satirlar.map(function (r) {
        return "<tr>" + var_.map(function (s) {
          var h = s.f ? s.f(r[s.k], r) : esc(r[s.k] == null ? "—" : r[s.k]);
          return '<td data-label="' + esc(s.ad) + '"' + (s.sag ? ' class="adm-sag"' : "") + ">" + h + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  /** İşlemler → engelle / engeli kaldır (eski "askıya al" da desteklenir) */
  function engelIslemHtml(u, askida) {
    if (u.engel) {
      var e = u.engel;
      return '<div class="adm-islem adm-islem-engel"><h4>' + ikon("engel") + " Hesap engelli</h4>" +
        '<dl class="adm-dl adm-dl-sik"><div class="adm-dl-genis"><dt>Neden</dt><dd>' + esc(e.neden || "—") + "</dd></div>" +
          "<div><dt>Başlangıç</dt><dd>" + esc(tarih(e.zaman)) + "</dd></div>" +
          "<div><dt>Bitiş</dt><dd>" + (e.bitis ? esc(tarih(e.bitis)) + (e.dolmus ? " " + rozet("süresi doldu", "warn") : "") : "Süresiz") + "</dd></div></dl>" +
        '<div class="adm-eylem"><button type="button" class="btn-primary" data-eylem="engel-kaldir" aria-expanded="false">Engeli kaldır</button></div><div class="adm-onay" hidden></div></div>';
    }
    if (askida) {
      return '<div class="adm-islem"><h4>Hesap durumu</h4><p class="adm-alt">Hesap askıda: kullanıcı giriş yapamaz.</p>' +
        '<div class="adm-eylem"><button type="button" class="btn-primary" data-eylem="durum" data-hedef="aktif" aria-expanded="false">Hesabı etkinleştir</button></div><div class="adm-onay" hidden></div></div>';
    }
    if (u.rol === "yonetici") return '<div class="adm-islem"><h4>Engelle</h4><p class="adm-alt">Yönetici hesapları buradan engellenmez; önce rolünü Veri sekmesinden değiştir.</p></div>';
    return '<form class="adm-islem" data-form="engel" novalidate><h4>Engelle</h4>' +
      '<p class="adm-alt">Tüm oturumları kapanır, giriş yapamaz; eski oturumla gelen istekler 403 alır.</p>' +
      '<div class="field"><label for="en-neden">Neden <span class="adm-alt">(yalnızca yöneticiler görür)</span></label>' +
        '<input id="en-neden" name="neden" class="text-input" maxlength="300" placeholder="Örn. spam mesaj, hesap paylaşımı" aria-describedby="en-hata"></div>' +
      '<div class="field"><label for="en-sure">Süre</label><select id="en-sure" name="sure" class="text-input">' +
        '<option value="suresiz">Süresiz</option><option value="1g">1 gün</option><option value="7g">7 gün</option><option value="30g">30 gün</option></select></div>' +
      '<p class="field-error" id="en-hata" hidden></p>' +
      '<div class="adm-eylem"><button type="submit" class="btn-ghost adm-ghost-tehlike" aria-expanded="false">' + ikon("engel") + "Engelle…</button></div>" +
      '<div class="adm-onay" hidden></div></form>';
  }

  /** Erişim: varlık, IP, girişler (14 gün), oturumlar */
  function erisimHtml(v) {
    var u = v.user || {};
    if (!("sonGorulme" in u) && !v.oturumlar) return "";
    var g = v.girisler || { gunler: [], adet: [], basarisiz: [] };
    var top = function (l) { return (l || []).reduce(function (t, x) { return t + (Number(x) || 0); }, 0); };
    var bugun = g.adet && g.adet.length ? g.adet[g.adet.length - 1] : 0;
    var oran = cubukOranlari(g.adet || []);
    var son = (g.adet || []).length - 1;
    var grafik = (g.gunler || []).length
      ? '<figure class="adm-giris-grafik"><figcaption>Son 14 gün giriş <span class="adm-alt">· toplam ' + esc(sayi(top(g.adet))) + (top(g.basarisiz) ? " · " + esc(sayi(top(g.basarisiz))) + " hatalı şifre" : "") + "</span></figcaption>" +
        '<div class="adm-giris-cubuklar" role="img" aria-label="' + esc("Son 14 gün giriş: " + g.gunler.map(function (d, i) { return gunTarih(d + "T12:00:00Z") + " " + sayi(g.adet[i]) + (g.basarisiz[i] ? " (+" + g.basarisiz[i] + " hatalı)" : ""); }).join("; ")) + '">' +
        g.gunler.map(function (d, i) {
          var h = Number(g.basarisiz[i]) || 0;
          return '<span class="adm-giris-sutun' + (i === son ? " is-son" : "") + '" title="' + esc(gunTarih(d + "T12:00:00Z") + ": " + sayi(g.adet[i]) + " giriş" + (h ? ", " + h + " hatalı şifre" : "")) + '">' +
            '<span class="adm-giris-cubuk" style="height:' + oran[i] + '%"></span>' + (h ? '<span class="adm-giris-hata" aria-hidden="true"></span>' : "") + "</span>";
        }).join("") + "</div>" +
        '<div class="adm-lejant"><span><i class="is-giris"></i>Başarılı giriş</span><span><i class="is-hata"></i>Hatalı şifre olan gün</span></div></figure>'
      : "";
    var ot = Array.isArray(v.oturumlar) ? v.oturumlar : [];
    return '<section class="surface" aria-labelledby="d-erisim"><div class="adm-bolum-ust"><h3 id="d-erisim">Erişim ve oturumlar</h3>' +
        (ot.length ? '<button type="button" class="btn-ghost btn-sm adm-ghost-tehlike adm-ikonlu" data-oturum-hepsi aria-expanded="false">' + ikon("cikis") + "<span>Tüm oturumları kapat</span></button>" : "") + "</div>" +
      '<div class="adm-onay adm-onay-oturum" hidden></div>' +
      '<div class="adm-erisim">' +
        '<dl class="adm-dl">' +
          "<div><dt>Durum</dt><dd>" + varlikCip(u.varlik, u.sonGorulme) + "</dd></div>" +
          "<div><dt>Son görülme</dt><dd>" + zamanHucre(u.sonGorulme) + "</dd></div>" +
          '<div><dt>Son IP</dt><dd><code class="adm-kod adm-ip">' + esc(u.sonIp || "—") + "</code></dd></div>" +
          "<div><dt>Son giriş</dt><dd>" + zamanHucre(u.sonGiris) + (u.sonGirisIp ? ' <code class="adm-kod adm-ip">' + esc(u.sonGirisIp) + "</code>" : "") + "</dd></div>" +
          "<div><dt>Bugünkü giriş</dt><dd>" + esc(sayi(bugun)) + "</dd></div>" +
        "</dl>" + grafik +
      "</div>" +
      (ot.length
        ? '<div class="adm-tablo-kap"><table class="adm-tablo adm-kartlas adm-oturum-tablo"><caption class="visually-hidden">Açık oturumlar</caption>' +
          '<thead><tr><th scope="col">Cihaz / tarayıcı</th><th scope="col">IP</th><th scope="col">Açılış</th><th scope="col">Son görülme</th><th scope="col"><span class="visually-hidden">İşlem</span></th></tr></thead><tbody>' +
          ot.map(function (s) {
            return "<tr>" +
              '<td data-label="Cihaz" class="adm-oturum-ua"><span class="adm-ikonlu">' + ikon("cihaz") + '<span class="adm-kir">' + esc(tarayiciOzet(s.tarayici)) + "</span></span></td>" +
              '<td data-label="IP"><code class="adm-kod adm-ip">' + esc(s.ip || "—") + "</code></td>" +
              '<td data-label="Açılış" class="adm-nowrap">' + zamanHucre(s.olusturma) + "</td>" +
              '<td data-label="Son görülme" class="adm-nowrap">' + zamanHucre(s.sonGorulme) + "</td>" +
              '<td data-label="İşlem"><button type="button" class="btn-ghost btn-sm" data-oturum-kapat="' + esc(s.id) + '">Oturumu kapat</button></td>' +
              "</tr>";
          }).join("") + "</tbody></table></div>"
        : bos("Açık oturum yok.")) +
      '<p class="adm-alt adm-kvkk-not">IP adresleri kişisel veridir: 90 günden eski olanlar otomatik silinir.</p>' +
      "</section>";
  }
  /** User-Agent → "Chrome · Android" gibi kısa özet */
  function tarayiciOzet(ua) {
    var s = String(ua || "");
    if (!s) return "Bilinmeyen tarayıcı";
    var t = /Edg\//.test(s) ? "Edge" : /OPR\//.test(s) ? "Opera" : /SamsungBrowser/.test(s) ? "Samsung Internet" : /Chrome\//.test(s) ? "Chrome" : /Firefox\//.test(s) ? "Firefox" : /Safari\//.test(s) ? "Safari" : /node|undici/i.test(s) ? "Sunucu / betik" : "Tarayıcı";
    var i = /Android/.test(s) ? "Android" : /iPhone|iPad/.test(s) ? "iOS" : /Windows/.test(s) ? "Windows" : /Mac OS X/.test(s) ? "macOS" : /Linux/.test(s) ? "Linux" : "";
    if (/; wv\)/.test(s)) t += " (uygulama)";
    return t + (i ? " · " + i : "");
  }

  function detayHtml(v) {
    var u = v.user || {}, pr = v.profile || {}, uy = v.uyelik || {}, ist = v.istatistik || {};
    var durum = hesapDurumu(v), askida = durum === "askida";
    var sinif = pr.sinif == null || pr.sinif === "" ? "—" : (/^\d+$/.test(String(pr.sinif)) ? pr.sinif + ". sınıf" : String(pr.sinif));
    var dl = function (rows) {
      return '<dl class="adm-dl">' + rows.map(function (r) { return '<div' + (r[2] ? ' class="adm-dl-genis"' : "") + "><dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>";
    };
    var bek = uy.bekleyenTalep;
    var uyelikDurum = uy.premium
      ? rozet("Premium · " + planAd(uy.plan), "mor")
      : rozet("Ücretsiz", "notr");
    var dersler = Array.isArray(v.dersler) ? v.dersler : [];

    return '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Kullanıcı listesine dön</button>' +
        '<button type="button" class="btn-ghost" data-den="' + esc(u.id) + '">Bu kullanıcının kayıtları</button></div>' +
      '<header class="surface adm-kisi">' +
        '<div class="adm-kisi-ust"><h2 id="kul-detay-baslik" tabindex="-1">' + esc(adSoyad(u)) + "</h2>" +
          '<div class="adm-rozetler">' + ("varlik" in u || "sonGorulme" in u ? varlikCip(u.varlik, u.sonGorulme) : "") +
            (u.engel ? rozet("Engelli", "bad") : rozet(hesapDurumAd(durum), askida ? "bad" : "ok")) + uyelikDurum +
            (u.rol === "yonetici" ? rozet("Yönetici", "info") : "") + "</div></div>" +
        '<p class="adm-alt adm-kir">' + esc(u.eposta || "—") + (u.kullaniciAdi ? " · @" + esc(u.kullaniciAdi) : "") +
          " · Kayıt: " + esc(tarih(u.olusturma)) + " · Kimlik #" + esc(u.id) + "</p>" +
      "</header>" +

      '<div class="adm-izgara">' +
        '<section class="surface" aria-labelledby="d-profil"><h3 id="d-profil">Profil</h3>' +
          (v.profile ? dl([
            ["Durum", esc(modelAd(pr.ogrenciModeli))],
            ["Sınıf", esc(sinif)],
            ["Hedef ülkeler", esc(ulkeListesi(pr.ulkeler)), true],
            ["Eğitim dili", esc(dilAd(pr.egitimDili))],
            ["Okul", esc(pr.okul || "—")],
            ["Şehir", esc(pr.okulSehir || "—")]
          ]) : bos("Profil henüz doldurulmamış.")) +
        "</section>" +
        '<section class="surface" aria-labelledby="d-uyelik"><h3 id="d-uyelik">Üyelik</h3>' +
          dl([
            ["Durum", uy.premium ? "Premium" : "Ücretsiz"],
            ["Plan", esc(planAd(uy.plan))],
            ["Bitiş", esc(tarih(uy.bitis))],
            ["Bekleyen talep", bek ? esc(planAd(bek.plan)) + " · " + esc(tarih(bek.olusturma)) + ' <button type="button" class="adm-link" data-git-talep>Taleplere git</button>' : "Yok", true]
          ]) +
        "</section>" +
      "</div>" +

      '<section class="surface" aria-labelledby="d-islem"><h3 id="d-islem">İşlemler</h3>' +
        '<div class="adm-islemler">' +
          '<form class="adm-islem" data-form="premium" novalidate>' +
            '<h4>' + (uy.premium ? "Premium ver / süreyi değiştir" : "Premium ver") + "</h4>" +
            '<div class="adm-form-satir">' +
              '<div class="field"><label for="pv-plan">Plan</label><select id="pv-plan" class="text-input" name="plan">' +
                '<option value="aylik">Aylık (30 gün)</option><option value="yillik">Yıllık (365 gün)</option></select></div>' +
              '<div class="field"><label for="pv-gun">Gün (isteğe bağlı)</label><input id="pv-gun" name="gun" class="text-input" type="number" inputmode="numeric" min="1" max="3650" step="1" placeholder="Plana göre" aria-describedby="pv-gun-ip pv-gun-hata"></div>' +
            "</div>" +
            '<p class="field-hint" id="pv-gun-ip">Boş bırakılırsa plana göre 30 ya da 365 gün verilir.</p>' +
            '<p class="field-error" id="pv-gun-hata" hidden></p>' +
            '<div class="field"><label for="pv-not">Not (isteğe bağlı)</label><input id="pv-not" name="not" class="text-input" maxlength="500" placeholder="Örn. elden ödeme, telafi"></div>' +
            '<div class="adm-eylem"><button type="submit" class="btn-primary" aria-expanded="false">Premium ver…</button></div>' +
            '<div class="adm-onay" hidden></div>' +
          "</form>" +
          (uy.premium
            ? '<div class="adm-islem"><h4>Premium\'u iptal et</h4><p class="adm-alt">Üyelik hemen sona erer; ücret iadesi bu panelden yapılmaz.</p>' +
              '<div class="adm-eylem"><button type="button" class="btn-ghost adm-ghost-tehlike" data-eylem="iptal" aria-expanded="false">Premium\'u iptal et</button></div><div class="adm-onay" hidden></div></div>'
            : "") +
          engelIslemHtml(u, askida) +
        "</div>" +
      "</section>" +
      erisimHtml(v) +

      '<section class="surface" aria-labelledby="d-ist"><h3 id="d-ist">İstatistik</h3>' +
        '<ul class="adm-tiles adm-tiles-kucuk">' +
          '<li><div class="adm-tile"><span class="adm-tile-etiket">Cevap</span><span class="adm-tile-deger">' + esc(sayi(ist.cevap)) + "</span></div></li>" +
          '<li><div class="adm-tile is-ok"><span class="adm-tile-etiket">Doğru</span><span class="adm-tile-deger">' + esc(yuzde(ist.dogru, ist.cevap)) + '</span><span class="adm-tile-alt">' + esc(sayi(ist.dogru)) + " doğru</span></div></li>" +
          '<li><div class="adm-tile is-enerji"><span class="adm-tile-etiket">Açık yanlış</span><span class="adm-tile-deger">' + esc(sayi(ist.yanlisAcik)) + "</span></div></li>" +
          '<li><div class="adm-tile"><span class="adm-tile-etiket">Deneme</span><span class="adm-tile-deger">' + esc(sayi(ist.deneme)) + "</span></div></li>" +
          '<li><div class="adm-tile"><span class="adm-tile-etiket">Son etkinlik</span><span class="adm-tile-deger adm-tile-metin">' + esc(tarih(ist.sonEtkinlik)) + "</span></div></li>" +
        "</ul></section>" +

      '<section class="surface" aria-labelledby="d-ders"><h3 id="d-ders">Dersler</h3>' +
        genelTablo(dersler, [
          { k: "sayfa", ad: "Ders", f: function (x) { return esc(dersAd(x)); } },
          { k: "cevap", ad: "Cevap", sag: true, f: function (x) { return esc(sayi(x)); } },
          { k: "dogru", ad: "Doğru", sag: true, f: function (x) { return esc(sayi(x)); } },
          { k: "dogru", ad: "Başarı", sag: true, f: function (x, r) { return esc(yuzde(x, r.cevap)); } }
        ], "Ders bazında cevaplar") +
      "</section>" +

      '<section class="surface" aria-labelledby="d-abo"><h3 id="d-abo">Abonelik geçmişi</h3>' +
        genelTablo(v.abonelikler, [
          { k: "plan", ad: "Plan", f: function (x) { return esc(planAd(x)); } },
          { k: "baslangic", ad: "Başlangıç", f: function (x) { return esc(tarih(x)); } },
          { k: "bitis", ad: "Bitiş", f: function (x) { return esc(tarih(x)); } },
          { k: "durum", ad: "Durum", f: function (x) { return esc(x); } },
          { k: "kaynak", ad: "Kaynak", f: function (x) { return esc(x); } },
          { k: "tutar", ad: "Tutar", sag: true, f: function (x) { return esc(tl(x)); } },
          { k: "not", ad: "Not", f: function (x) { return '<span class="adm-kir">' + esc(x) + "</span>"; } },
          { k: "olusturma", ad: "Oluşturma", f: function (x) { return esc(tarih(x)); } }
        ], "Abonelik geçmişi") +
      "</section>" +

      '<section class="surface" aria-labelledby="d-tal"><h3 id="d-tal">Ödeme talepleri</h3>' +
        genelTablo(v.talepler, [
          { k: "id", ad: "No", f: function (x) { return "#" + esc(x); } },
          { k: "plan", ad: "Plan", f: function (x) { return esc(planAd(x)); } },
          { k: "tutar", ad: "Tutar", sag: true, f: function (x) { return esc(tl(x)); } },
          { k: "odeyenAd", ad: "Ödeyen", f: function (x) { return esc(x); } },
          { k: "durum", ad: "Durum", f: function (x) { return rozet(talepDurumAd(x), talepDurumTon(x)); } },
          { k: "olusturma", ad: "Tarih", f: function (x) { return esc(tarih(x)); } }
        ], "Kullanıcının ödeme talepleri") +
      "</section>";
  }

  function detayTik(e) {
    var d = e.currentTarget;
    if (e.target.closest("[data-geri]")) { detayKapat(); return; }
    if (e.target.closest("[data-tekrar]")) { detayYukle(); return; }
    var den = e.target.closest("[data-den]");
    if (den) {
      S.den.kullanici = den.getAttribute("data-den"); S.den.eylem = ""; S.den.sayfa = 1;
      $("#den-kullanici").value = S.den.kullanici; $("#den-eylem").value = "";
      sekmeAc("denetim"); $("#sekme-denetim").focus();
      return;
    }
    if (e.target.closest("[data-git-talep]")) {
      S.talepDurum = "bekliyor"; $("#talep-durum").value = "bekliyor";
      sekmeAc("talepler"); $("#sekme-talepler").focus();
      return;
    }
    var v = S.secili && S.secili.veri; if (!v) return;
    var u = v.user || {}, ad = adSoyad(u), uid = encodeURIComponent(u.id);
    var ok_ = e.target.closest("[data-oturum-kapat]");
    if (ok_) {
      ok_.disabled = true;
      api("/api/admin/users/" + uid + "/oturumlar/" + encodeURIComponent(ok_.getAttribute("data-oturum-kapat")) + "/kapat", "POST", {}).then(function () {
        bildir("Oturum kapatıldı. Kullanıcı o cihazda yeniden giriş yapmalı.", "ok"); detayYukle();
      }).catch(function (er) { ok_.disabled = false; bildir(er.message, "bad"); });
      return;
    }
    var oh = e.target.closest("[data-oturum-hepsi]");
    if (oh) {
      onayAc($(".adm-onay-oturum", d), oh, {
        baslik: ad + " için tüm oturumlar kapatılsın mı?", metin: "Kullanıcı tüm cihazlarda çıkış yapmış olur; hesabı açık kalır.",
        onayMetni: "Evet, hepsini kapat", tehlike: true,
        onayla: function () {
          return api("/api/admin/users/" + uid + "/oturumlar/kapat", "POST", {}).then(function (r) {
            bildir(sayi(r.kapanan) + " oturum kapatıldı.", "ok"); detayYukle();
          });
        }
      });
      return;
    }
    var b = e.target.closest("[data-eylem]");
    if (!b) return;
    var kap = b.closest(".adm-islem").querySelector(".adm-onay");
    if (b.getAttribute("data-eylem") === "engel-kaldir") {
      onayAc(kap, b, {
        baslik: ad + " için engel kaldırılsın mı?", metin: "Kullanıcı yeniden giriş yapabilir.", onayMetni: "Evet, engeli kaldır",
        onayla: function () {
          return api("/api/admin/users/" + uid + "/engel-kaldir", "POST", {}).then(function () {
            S.durumBilinen[String(u.id)] = "aktif";
            bildir(ad + " için engel kaldırıldı.", "ok"); islemSonrasi();
          });
        }
      });
      return;
    }
    if (b.getAttribute("data-eylem") === "iptal") {
      onayAc(kap, b, {
        baslik: ad + " için Premium iptal edilsin mi?",
        metin: "Premium erişimi hemen kapanır.",
        onayMetni: "Evet, iptal et", tehlike: true, notEtiketi: "Not (isteğe bağlı)",
        onayla: function (not) {
          return api("/api/admin/users/" + uid + "/premium/iptal", "POST", not ? { not: not } : {}).then(function () {
            bildir(ad + " için Premium iptal edildi.", "ok"); islemSonrasi();
          });
        }
      });
    } else if (b.getAttribute("data-eylem") === "durum") {
      var hedef = b.getAttribute("data-hedef");
      onayAc(kap, b, {
        baslik: hedef === "askida" ? ad + " hesabı askıya alınsın mı?" : ad + " hesabı yeniden etkinleştirilsin mi?",
        metin: hedef === "askida" ? "Kullanıcı giriş yapamaz; açık oturumları kapanır." : "Kullanıcı yeniden giriş yapabilir.",
        onayMetni: hedef === "askida" ? "Evet, askıya al" : "Evet, etkinleştir", tehlike: hedef === "askida",
        onayla: function () {
          return api("/api/admin/users/" + uid + "/durum", "POST", { durum: hedef }).then(function () {
            S.durumBilinen[String(u.id)] = hedef;
            bildir(hedef === "askida" ? ad + " hesabı askıya alındı." : ad + " hesabı etkinleştirildi.", "ok"); islemSonrasi();
          });
        }
      });
    }
  }
  // Engelle formu
  document.addEventListener("submit", function (e) {
    var f = e.target.closest && e.target.closest('[data-form="engel"]');
    if (!f) return;
    e.preventDefault();
    var v = S.secili && S.secili.veri; if (!v) return;
    var u = v.user || {}, ad = adSoyad(u);
    var neden = f.neden.value.trim(), sure = f.sure.value, hataEl = $("#en-hata", f);
    if (!neden) { hataEl.textContent = "Engelleme nedenini yaz."; hataEl.hidden = false; f.neden.setAttribute("aria-invalid", "true"); f.neden.focus(); return; }
    hataEl.hidden = true; f.neden.removeAttribute("aria-invalid");
    onayAc($(".adm-onay", f), f.querySelector("[type=submit]"), {
      baslik: ad + " " + (sure === "suresiz" ? "süresiz" : engelSureAd(sure).toLocaleLowerCase("tr-TR") + " süreyle") + " engellensin mi?",
      metin: "Tüm oturumları hemen kapanır ve giriş yapamaz" + (sure === "suresiz" ? "." : "; süre dolunca engel kendiliğinden kalkar.") + " Neden: " + neden,
      onayMetni: "Evet, engelle", tehlike: true,
      onayla: function () {
        return api("/api/admin/users/" + encodeURIComponent(u.id) + "/engel", "POST", { neden: neden, sure: sure }).then(function (r) {
          S.durumBilinen[String(u.id)] = "askida";
          bildir(ad + " engellendi" + (r.kapananOturum ? "; " + sayi(r.kapananOturum) + " oturum kapandı." : "."), "ok"); islemSonrasi();
        });
      }
    });
  });
  // Premium ver formu (submit ayrı dinlenir: Enter tuşu da çalışsın)
  document.addEventListener("submit", function (e) {
    var f = e.target.closest && e.target.closest('[data-form="premium"]');
    if (!f) return;
    e.preventDefault();
    var v = S.secili && S.secili.veri; if (!v) return;
    var u = v.user || {}, ad = adSoyad(u);
    var plan = f.plan.value, g = gunDogrula(f.gun.value), not = f.not.value.trim();
    var hataEl = $("#pv-gun-hata", f);
    if (!g.ok) { hataEl.textContent = g.hata; hataEl.hidden = false; f.gun.setAttribute("aria-invalid", "true"); f.gun.focus(); return; }
    hataEl.hidden = true; f.gun.removeAttribute("aria-invalid");
    var sure = g.gun ? sayi(g.gun) + " gün" : (plan === "yillik" ? "365 gün" : "30 gün");
    var tetik = f.querySelector("[type=submit]");
    onayAc($(".adm-onay", f), tetik, {
      baslik: ad + " kullanıcısına " + planAd(plan) + " Premium (" + sure + ") verilsin mi?",
      metin: (v.uyelik && v.uyelik.premium ? "Kullanıcının etkin Premium üyeliği var. " : "") + "Bu işlem ödeme talebi olmadan Premium açar ve denetim kaydına yazılır.",
      onayMetni: "Evet, Premium ver",
      onayla: function () {
        var govde = { plan: plan }; if (g.gun) govde.gun = g.gun; if (not) govde.not = not;
        return api("/api/admin/users/" + encodeURIComponent(u.id) + "/premium", "POST", govde).then(function () {
          bildir(ad + " kullanıcısına " + planAd(plan) + " Premium verildi (" + sure + ").", "ok"); islemSonrasi();
        });
      }
    });
  });
  function islemSonrasi() {
    detayYukle();
    ozetYukle(true);
    // Liste arka planda tazelenir (Premium/hesap sütunları değişti)
    kulYukle();
  }

  /* ------------------------------------------------------------------------
     8. DENETİM KAYDI
     ------------------------------------------------------------------------ */
  function panelDenKur() {
    var p = $("#panel-denetim");
    p.innerHTML =
      '<div class="adm-panel-ust"><h2>Denetim kaydı</h2></div>' +
      '<form class="adm-arac adm-arac-genis" aria-label="Denetim kaydı filtreleri" novalidate>' +
        '<div class="field adm-field-esnek"><label for="den-eylem">Eylem</label><input id="den-eylem" class="text-input" placeholder="Örn. talep.onay" autocomplete="off" maxlength="80"></div>' +
        '<div class="field adm-field-dar"><label for="den-kullanici">Kullanıcı kimliği</label><input id="den-kullanici" class="text-input" inputmode="numeric" autocomplete="off" maxlength="40" placeholder="Tümü"></div>' +
        '<div class="adm-eylem adm-eylem-alt"><button type="submit" class="btn-primary">Filtrele</button><button type="button" class="btn-ghost" data-temizle>Temizle</button></div>' +
      "</form>" +
      '<p class="adm-sonuc" id="den-ozet" aria-live="polite"></p>' +
      '<div class="adm-den-liste"></div><div class="adm-den-sayfa"></div>';
    $("form", p).addEventListener("submit", function (e) {
      e.preventDefault();
      S.den.eylem = $("#den-eylem").value.trim(); S.den.kullanici = $("#den-kullanici").value.trim(); S.den.sayfa = 1;
      denYukle();
    });
    p.addEventListener("click", function (e) {
      if (e.target.closest("[data-temizle]")) {
        $("#den-eylem").value = ""; $("#den-kullanici").value = ""; S.den.eylem = ""; S.den.kullanici = ""; S.den.sayfa = 1; denYukle(); return;
      }
      if (e.target.closest("[data-tekrar]")) { denYukle(); return; }
      var sb = e.target.closest("[data-sayfa]");
      if (sb && !sb.disabled) { S.den.sayfa = Number(sb.getAttribute("data-sayfa")); denYukle().then(function () { $("#den-ozet").focus(); }); return; }
      var fk = e.target.closest("[data-filtre-kul]");
      if (fk) { S.den.kullanici = fk.getAttribute("data-filtre-kul"); $("#den-kullanici").value = S.den.kullanici; S.den.sayfa = 1; denYukle(); }
    });
  }
  function kisiHucre(v) {
    var id = v && typeof v === "object" ? v.id : (sayiMi(v) ? v : null);
    var ad = esc(kisiAd(v));
    return id != null
      ? '<button type="button" class="adm-link" data-filtre-kul="' + esc(id) + '" title="Bu kullanıcıya göre filtrele">' + ad + "</button>"
      : ad;
  }
  function denYukle() {
    var kap = $("#panel-denetim .adm-den-liste"), say = $("#panel-denetim .adm-den-sayfa"), oz = $("#den-ozet");
    var no = ++S.den.istek;
    kap.setAttribute("aria-busy", "true");
    if (!kap.querySelector("table")) kap.innerHTML = iskelet("tablo", 8); else kap.classList.add("is-soluk");
    return api("/api/admin/audit" + sorgu({ kullanici: S.den.kullanici, eylem: S.den.eylem, sayfa: S.den.sayfa })).then(function (v) {
      if (no !== S.den.istek) return;
      var liste = Array.isArray(v.kayitlar) ? v.kayitlar : [];
      S.den.boyut = boyutCikar(v, liste, S.den.boyut);
      var b = sayfaBilgisi(v.toplam, v.sayfa || S.den.sayfa, S.den.boyut, liste.length);
      var filtre = [S.den.eylem ? "eylem “" + S.den.eylem + "”" : "", S.den.kullanici ? "kullanıcı #" + S.den.kullanici : ""].filter(Boolean).join(", ");
      oz.tabIndex = -1;
      oz.textContent = sayi(b.toplam) + " kayıt" + (filtre ? " (" + filtre + ")" : "") + ".";
      if (!liste.length) { kap.innerHTML = bos("Bu filtreye uyan kayıt yok."); say.innerHTML = ""; return; }
      kap.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo adm-kartlas adm-den-tablo">' +
        '<caption class="visually-hidden">Denetim kayıtları, sayfa ' + esc(sayi(b.sayfa)) + "</caption>" +
        '<thead><tr><th scope="col">Zaman</th><th scope="col">Eylem</th><th scope="col">Kullanıcı</th><th scope="col">Yapan</th><th scope="col">IP</th><th scope="col">Ayrıntı</th></tr></thead><tbody>' +
        liste.map(function (r) {
          var ay = ayrintiMetni(r.ayrinti);
          var varlik = r.varlik ? '<span class="adm-alt">' + esc(r.varlik) + (r.varlikId != null ? " #" + esc(r.varlikId) : "") + "</span>" : "";
          return "<tr>" +
            '<td data-label="Zaman" class="adm-nowrap">' + esc(tarih(r.zaman)) + "</td>" +
            '<td data-label="Eylem"><code class="adm-kod">' + esc(r.eylem || "—") + "</code>" + varlik + "</td>" +
            '<td data-label="Kullanıcı">' + kisiHucre(r.kullanici) + "</td>" +
            '<td data-label="Yapan">' + esc(kisiAd(r.yapan)) + "</td>" +
            '<td data-label="IP"><span class="adm-kir">' + esc(r.ip || "—") + "</span></td>" +
            '<td data-label="Ayrıntı" class="adm-hucre-ayrinti">' + (ay
              ? '<details class="adm-ayrinti"><summary>Göster</summary><pre>' + esc(ay) + "</pre></details>"
              : '<span class="adm-alt">—</span>') + "</td>" +
            "</tr>";
        }).join("") + "</tbody></table></div>";
      say.innerHTML = sayfalamaHtml(b, "Denetim kaydı sayfaları", "kayıt");
    }).catch(function (e) {
      if (no === S.den.istek) { kap.innerHTML = hataKutusu(e.message); say.innerHTML = ""; oz.textContent = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); kap.classList.remove("is-soluk"); });
  }

  /* ------------------------------------------------------------------------
     9. DESTEK MERKEZİ (öğrenci soruları: gelen kutusu + konuşma, hazır yanıtlar, iç not, atama, SLA)
     ------------------------------------------------------------------------ */
  var SORU_FILTRE = [["bekliyor", "Bekleyen"], ["cevaplandi", "Cevaplandı"], ["kapandi", "Kapandı"], ["hepsi", "Tümü"]];
  function panelSoruKur() {
    var p = $("#panel-sorular");
    p.innerHTML =
      '<div class="adm-panel-ust"><div class="adm-min0"><h2>Destek merkezi</h2>' +
        '<p class="adm-ipucu">Öğrenci sorularını yanıtla. Yanıt öğrenciye "Meberra ekibi" imzasıyla, uygulama içi bildirim (ve tercih ettiyse e-posta) olarak gider. İç notları yalnızca yöneticiler görür.</p></div>' +
        '<div class="adm-eylem"><button type="button" class="btn-ghost adm-ikonlu" data-hazir-yonet>' + ikon("not") + "<span>Hazır yanıtlar</span></button>" +
          '<button type="button" class="btn-ghost adm-ikonlu" data-yenile>' + ikon("yenile") + "<span>Yenile</span></button></div></div>" +
      '<div class="adm-destek">' +
        '<div class="adm-destek-liste" role="region" aria-label="Konuşmalar">' +
          '<div class="adm-cip-grup adm-destek-cipler" role="group" aria-label="Durum">' + SORU_FILTRE.map(function (f) {
            return '<button type="button" class="adm-cip" data-soru-filtre="' + f[0] + '" aria-pressed="' + (S.soru.durum === f[0] ? "true" : "false") + '"><span>' + esc(f[1]) +
              '</span><span class="adm-cip-sayi" data-soru-sayi="' + f[0] + '"></span></button>';
          }).join("") + "</div>" +
          '<form class="adm-destek-arac" role="search" aria-label="Konuşma ara" novalidate>' +
            '<div class="field adm-field-esnek"><label for="soru-q" class="visually-hidden">Ara</label>' +
              '<input type="search" id="soru-q" class="text-input" placeholder="Öğrenci, e-posta, ders ya da metin" autocomplete="off" maxlength="80"></div>' +
            '<div class="field adm-field-dar"><label for="soru-sirala" class="visually-hidden">Sırala</label><select id="soru-sirala" class="text-input">' +
              '<option value="">Varsayılan sıra</option><option value="eski">En uzun bekleyen önce</option><option value="yeni">En yeni önce</option></select></div>' +
            '<label class="adm-check"><input type="checkbox" id="soru-bana"> <span>Bana atananlar</span></label>' +
          "</form>" +
          '<p class="adm-sonuc" id="soru-ozet" aria-live="polite"></p>' +
          '<div class="adm-soru-liste"></div><div class="adm-soru-sayfa"></div>' +
        "</div>" +
        '<div class="adm-destek-konu adm-soru-detay" role="region" aria-label="Konuşma">' + konuBosHtml() + "</div>" +
      "</div>";
    var zaman = null;
    $("#soru-q").addEventListener("input", function (e) {
      clearTimeout(zaman);
      var v = e.target.value.trim();
      zaman = setTimeout(function () { if (v !== S.soru.q) { S.soru.q = v; S.soru.sayfa = 1; soruYukle(); } }, 350);
    });
    $("form", p).addEventListener("submit", function (e) { e.preventDefault(); clearTimeout(zaman); S.soru.q = $("#soru-q").value.trim(); S.soru.sayfa = 1; soruYukle(); });
    $("#soru-sirala").addEventListener("change", function (e) { S.soru.sirala = e.target.value; S.soru.sayfa = 1; soruYukle(); });
    $("#soru-bana").addEventListener("change", function (e) { S.soru.atanan = e.target.checked ? "ben" : ""; S.soru.sayfa = 1; soruYukle(); });
    p.addEventListener("click", function (e) {
      if (e.target.closest("[data-hazir-yonet]")) { hazirYonet(e.target.closest("[data-hazir-yonet]")); return; }
      if (e.target.closest(".adm-panel-ust [data-yenile]")) { soruYukle(); if (S.soru.secili) soruDetayYukle(); return; }
    });
    $(".adm-destek-liste", p).addEventListener("click", function (e) {
      if (e.target.closest("[data-tekrar]")) { soruYukle(); return; }
      var fb = e.target.closest("[data-soru-filtre]");
      if (fb) {
        S.soru.durum = fb.getAttribute("data-soru-filtre"); S.soru.sayfa = 1;
        p.querySelectorAll("[data-soru-filtre]").forEach(function (x) { x.setAttribute("aria-pressed", x === fb ? "true" : "false"); });
        soruYukle(); return;
      }
      var sb = e.target.closest("[data-sayfa]");
      if (sb && !sb.disabled) { S.soru.sayfa = Number(sb.getAttribute("data-sayfa")); soruYukle().then(function () { $("#soru-ozet").focus(); }); return; }
      var a = e.target.closest("[data-soru]"); if (a) soruAc(a.getAttribute("data-soru"));
    });
    var d = $(".adm-soru-detay", p);
    d.addEventListener("click", soruDetayTik);
    d.addEventListener("submit", soruDetayGonder);
    d.addEventListener("change", function (e) {
      var h = e.target.closest("#soru-hazir");
      if (h && h.value) { hazirEkle(h.value); h.value = ""; return; }
      var at = e.target.closest("#soru-atanan");
      if (at) soruAta(at.value, at);
    });
    d.addEventListener("input", function (e) {
      var t = e.target.closest("[data-sayac-icin]"); if (!t) return;
      var c = $("#" + t.getAttribute("data-sayac-icin")); if (c) c.textContent = sayi(t.value.length) + " / " + sayi(t.maxLength);
    });
    d.addEventListener("keydown", function (e) {
      // Ctrl/Cmd + Enter: yanıtı gönder
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && e.target.id === "soru-yanit") { e.preventDefault(); var f = e.target.closest("form"); if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })); }
    });
  }
  function konuBosHtml() {
    return '<div class="adm-destek-bos">' + ikon("sorular", "adm-bos-ikon") + '<p class="adm-bos-baslik">Bir konuşma seç</p><p class="adm-alt">Soldaki listeden bir soruyu açınca yazışma, öğrenci bilgisi ve yanıt kutusu burada görünür.</p></div>';
  }
  function soruSayilari(s) {
    if (!s) return;
    var tum = (Number(s.bekliyor) || 0) + (Number(s.cevaplandi) || 0) + (Number(s.kapandi) || 0);
    var deg = { bekliyor: s.bekliyor, cevaplandi: s.cevaplandi, kapandi: s.kapandi, hepsi: tum };
    Object.keys(deg).forEach(function (k) { var el = $('[data-soru-sayi="' + k + '"]'); if (el) el.textContent = Number(deg[k]) ? sayi(deg[k]) : ""; });
    bekleyenRozet(s.bekliyor, "adm-soru-bekleyen");
    var r = $("#adm-soru-bekleyen");
    if (r && Number(s.okunmamis)) r.setAttribute("aria-label", sayi(s.bekliyor) + " bekleyen, " + sayi(s.okunmamis) + " okunmamış");
  }
  function soruYukle(sessiz) {
    var kap = $("#panel-sorular .adm-soru-liste"), say = $("#panel-sorular .adm-soru-sayfa"), oz = $("#soru-ozet");
    if (!kap) return Promise.resolve();
    var no = ++S.soru.istek;
    kap.setAttribute("aria-busy", "true");
    if (!sessiz) { if (!kap.querySelector("ul")) kap.innerHTML = iskelet("tablo", 5); else kap.classList.add("is-soluk"); }
    return api("/api/admin/sorular" + sorgu({ durum: S.soru.durum, q: S.soru.q, sirala: S.soru.sirala, atanan: S.soru.atanan, sayfa: S.soru.sayfa > 1 ? S.soru.sayfa : "" })).then(function (v) {
      if (no !== S.soru.istek) return;
      var liste = Array.isArray(v.sorular) ? v.sorular : [];
      S.soru.liste = liste;
      if (v.sayilar) soruSayilari(v.sayilar);
      else if (S.soru.durum === "bekliyor") bekleyenRozet(v.toplam, "adm-soru-bekleyen");
      var b = sayfaBilgisi(v.toplam, v.sayfa || S.soru.sayfa, v.sayfaBoyu || 25, liste.length);
      oz.tabIndex = -1;
      oz.textContent = b.toplam ? sayi(b.toplam) + " konuşma" + (S.soru.q ? " (“" + S.soru.q + "”)" : "") + "." : "";
      if (!liste.length) {
        kap.innerHTML = S.soru.durum === "bekliyor" && !S.soru.q && !S.soru.atanan
          ? bos("Yanıt bekleyen soru yok. Harika iş!", "Gelen kutusu boş", "ok")
          : bos("Bu filtreye uyan konuşma yok.");
        say.innerHTML = ""; return;
      }
      var secili = S.soru.secili && String(S.soru.secili.id);
      kap.innerHTML = '<ul class="adm-destek-ogeler">' + liste.map(function (q) {
        var u = q.kullanici || {};
        var aktif = secili === String(q.id);
        return '<li><button type="button" class="adm-destek-oge is-' + esc(soruDurumTon(q.durum)) + (aktif ? " is-secili" : "") + (q.okunmamis ? " is-okunmamis" : "") + '" data-soru="' + esc(q.id) + '"' + (aktif ? ' aria-current="true"' : "") + ">" +
          '<span class="adm-destek-oge-ust">' +
            '<span class="adm-destek-ad">' + (u.varlik ? '<span class="adm-varlik-nokta is-' + esc(u.varlik) + '" title="' + esc(varlikAd(u.varlik)) + '"></span>' : "") +
              '<span class="adm-kir">' + esc(adSoyad(u)) + "</span>" + (u.premium ? ' <span class="adm-mini-rozet">Premium</span>' : "") + "</span>" +
            '<span class="adm-destek-zaman">' + esc(goreceZaman(q.guncelleme)) + "</span></span>" +
          '<span class="adm-destek-ozet adm-kir">' + (q.okunmamis ? '<span class="adm-yeni-nokta" aria-hidden="true"></span><span class="visually-hidden">Okunmamış. </span>' : "") + esc(kisalt(q.metin, 140)) + "</span>" +
          '<span class="adm-destek-oge-alt">' +
            '<span class="adm-alt">' + esc(dersAd(q.sayfa)) + " · #" + esc(q.id) + " · " + esc(sayi(q.mesajSayisi)) + " mesaj" + (Number(q.notSayisi) ? " · " + esc(sayi(q.notSayisi)) + " not" : "") + "</span>" +
            (q.durum === "bekliyor" && q.beklemeBaslangic ? slaRozet(q.beklemeBaslangic) : rozet(soruDurumAd(q.durum), soruDurumTon(q.durum))) +
          "</span>" +
          (q.atanan ? '<span class="adm-destek-atanan adm-alt">' + ikon("kullanicilar") + esc(adSoyad(q.atanan)) + "</span>" : "") +
        "</button></li>";
      }).join("") + "</ul>";
      say.innerHTML = b.sayfaSayisi > 1 ? sayfalamaHtml(b, "Konuşma sayfaları", "konuşma") : "";
    }).catch(function (e) {
      if (no === S.soru.istek && !sessiz) { kap.innerHTML = hataKutusu(e.message); say.innerHTML = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); kap.classList.remove("is-soluk"); });
  }
  function soruAc(id) {
    var p = $("#panel-sorular"), d = $(".adm-soru-detay", p);
    S.soru.secili = { id: id, veri: null };
    $(".adm-destek", p).classList.add("is-konu-acik");
    p.querySelectorAll("[data-soru]").forEach(function (x) {
      var a = x.getAttribute("data-soru") === String(id);
      x.classList.toggle("is-secili", a);
      if (a) { x.setAttribute("aria-current", "true"); x.classList.remove("is-okunmamis"); } else x.removeAttribute("aria-current");
    });
    d.innerHTML = '<div class="adm-destek-geri"><button type="button" class="btn-ghost btn-sm" data-geri>‹ Konuşmalar</button></div>' + iskelet("cekmece");
    return soruDetayYukle(null, true);
  }
  function soruDetayYukle(odakla, ilk) {
    var d = $("#panel-sorular .adm-soru-detay"), id = S.soru.secili && S.soru.secili.id;
    if (!id) return Promise.resolve();
    d.setAttribute("aria-busy", "true");
    return Promise.all([
      api("/api/admin/sorular/" + encodeURIComponent(id)),
      hazirlar().catch(function () { return []; }),
      yoneticilerAl().catch(function () { return null; })
    ]).then(function (r) {
      var v = r[0];
      if (!S.soru.secili || S.soru.secili.id !== id) return;
      S.soru.secili.veri = v.soru;
      soruDetayCiz(v.soru, !ilk);
      var h = $(odakla || "#soru-detay-baslik", d); if (h) h.focus({ preventScroll: !ilk && !odakla });
      if (ilk) soruYukle(true); // okunmamış işareti ve sayaçlar tazelensin
    }).catch(function (e) {
      d.innerHTML = '<div class="adm-destek-geri"><button type="button" class="btn-ghost btn-sm" data-geri>‹ Konuşmalar</button></div>' + hataKutusu(e.message);
    }).then(function () { d.removeAttribute("aria-busy"); });
  }
  /** Konuşmayı çizer; taslakKoru: yanıt/not kutusundaki yazılmamış metin korunur */
  function soruDetayCiz(q, taslakKoru) {
    var d = $("#panel-sorular .adm-soru-detay");
    var ty = taslakKoru && $("#soru-yanit", d) ? $("#soru-yanit", d).value : "", tn = taslakKoru && $("#soru-not", d) ? $("#soru-not", d).value : "";
    d.innerHTML = soruDetayHtml(q);
    if (ty) { $("#soru-yanit", d).value = ty; $("#soru-yanit", d).dispatchEvent(new Event("input", { bubbles: true })); }
    if (tn) $("#soru-not", d).value = tn;
    mathDiz(d);
  }
  /**
   * Soru bağlamındaki LaTeX'i dizer. admin.html MathJax yüklemez: yalnızca "$" ya da "\(" içeren bir konuşma
   * açılınca ders sayfalarıyla aynı yapılandırmayla (tex-svg, cdn.jsdelivr.net — CSP izinli) tembel yüklenir.
   */
  var mathBekleyen = null;
  function mathDiz(el) {
    if (!el || !/\$|\\\(/.test(el.textContent || "")) return;
    var M = window.MathJax;
    if (M && typeof M.typesetPromise === "function") { M.typesetPromise([el]).catch(function () {}); return; }
    mathBekleyen = el;
    if (document.getElementById("MathJax-script")) return; // yükleniyor; bitince bekleyen dizilir
    window.MathJax = {
      tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], displayMath: [["$$", "$$"], ["\\[", "\\]"]] },
      svg: { fontCache: "global" },
      startup: {
        typeset: false,
        ready: function () {
          window.MathJax.startup.defaultReady();
          window.MathJax.startup.promise.then(function () {
            if (mathBekleyen && document.contains(mathBekleyen)) return window.MathJax.typesetPromise([mathBekleyen]);
          }).catch(function () {});
        }
      }
    };
    var sc = document.createElement("script");
    sc.id = "MathJax-script"; sc.async = true;
    sc.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    document.head.appendChild(sc);
  }
  function soruKapat() {
    var p = $("#panel-sorular");
    var id = S.soru.secili && S.soru.secili.id;
    S.soru.secili = null;
    $(".adm-destek", p).classList.remove("is-konu-acik");
    $(".adm-soru-detay", p).innerHTML = konuBosHtml();
    soruYukle(true).then(function () {
      var b = id != null ? p.querySelector('[data-soru="' + String(id).replace(/[^0-9]/g, "") + '"]') : null;
      if (b) { b.classList.remove("is-secili"); b.removeAttribute("aria-current"); b.focus(); }
    });
  }
  /** Soru bağlamı: bilinen alanlar okunur biçimde, gerisi JSON */
  function baglamHtml(b) {
    if (!b || typeof b !== "object") return "";
    var bilinen = [["soru", "Soru"], ["soruMetni", "Soru"], ["secenekler", "Seçenekler"], ["ogrenciCevabi", "Öğrencinin cevabı"], ["secilen", "Öğrencinin cevabı"], ["dogruCevap", "Doğru cevap"], ["dogru", "Doğru cevap"], ["unite", "Ünite"], ["konu", "Konu"]];
    var kalan = Object.assign({}, b), satir = [];
    bilinen.forEach(function (k) {
      if (b[k[0]] === undefined || b[k[0]] === null || b[k[0]] === "") return;
      var v = b[k[0]];
      var h = Array.isArray(v)
        ? '<ol class="adm-baglam-secenek">' + v.map(function (x) { return "<li>" + esc(typeof x === "object" ? JSON.stringify(x) : x) + "</li>"; }).join("") + "</ol>"
        : esc(typeof v === "object" ? JSON.stringify(v) : v);
      satir.push('<div class="adm-dl-genis"><dt>' + esc(k[1]) + "</dt><dd>" + h + "</dd></div>");
      delete kalan[k[0]];
    });
    var ek = Object.keys(kalan).length ? '<details class="adm-ayrinti"><summary>Diğer bağlam alanları</summary><pre>' + esc(ayrintiMetni(kalan)) + "</pre></details>" : "";
    return '<details class="adm-baglam adm-destek-kutu" open><summary><span class="adm-ikonlu">' + ikon("bilgi") + "<span>Soru bağlamı</span></span></summary>" +
      (satir.length ? '<dl class="adm-dl">' + satir.join("") + "</dl>" : "") + ek + "</details>";
  }
  function soruDetayHtml(q) {
    var u = q.kullanici || {}, msj = Array.isArray(q.mesajlar) ? q.mesajlar : [], notlar = Array.isArray(q.notlar) ? q.notlar : [];
    var sonYanit = msj.filter(function (m) { return m.rol === "yonetici"; }).pop();
    var sssVar = Array.isArray(q.sss) ? q.sss : [];
    // Mesajlar ve iç notlar tek zaman çizelgesinde
    var akis = msj.map(function (m) { return { t: m.tarih, m: m }; }).concat(notlar.map(function (n) { return { t: n.tarih, n: n }; }))
      .sort(function (a, b) { return String(a.t).localeCompare(String(b.t)); });
    var yon = S.yoneticiler;
    var atananSec = yon && yon.yoneticiler && yon.yoneticiler.length
      ? '<div class="field adm-atanan"><label for="soru-atanan">Atanan</label><select id="soru-atanan" class="text-input">' +
          '<option value=""' + (!q.atanan ? " selected" : "") + ">Atanmadı</option>" +
          yon.yoneticiler.map(function (y) { return '<option value="' + esc(y.id) + '"' + (q.atanan && q.atanan.id === y.id ? " selected" : "") + ">" + esc(adSoyad(y)) + (y.id === yon.ben ? " (sen)" : "") + "</option>"; }).join("") +
        "</select></div>"
      : (q.atanan ? '<p class="adm-alt">Atanan: ' + esc(adSoyad(q.atanan)) + "</p>" : "");
    var hz = S.hazir || [];
    return '<div class="adm-destek-geri"><button type="button" class="btn-ghost btn-sm" data-geri>‹ Konuşmalar</button></div>' +
      '<header class="adm-destek-kart">' +
        '<div class="adm-destek-kart-ust"><div class="adm-min0">' +
          '<h3 id="soru-detay-baslik" tabindex="-1">' + esc(adSoyad(u)) + ' <span class="adm-alt">· Soru #' + esc(q.id) + "</span></h3>" +
          '<p class="adm-alt adm-kir">' + esc(u.eposta || "—") + "</p></div>" +
          '<div class="adm-rozetler">' + (q.durum === "bekliyor" && q.beklemeBaslangic ? slaRozet(q.beklemeBaslangic) : "") + rozet(soruDurumAd(q.durum), soruDurumTon(q.durum)) + "</div></div>" +
        '<dl class="adm-dl adm-dl-sik">' +
          "<div><dt>Plan</dt><dd>" + (u.premium ? rozet("Premium · " + planAd(u.plan), "mor") : rozet("Ücretsiz", "notr")) + "</dd></div>" +
          "<div><dt>Durum</dt><dd>" + varlikCip(u.varlik, u.sonGorulme) + "</dd></div>" +
          "<div><dt>Ders</dt><dd>" + esc(dersAd(q.sayfa)) + (q.soruRef ? ' <span class="adm-alt adm-kir">' + esc(q.soruRef) + "</span>" : "") + "</dd></div>" +
          "<div><dt>Açılış</dt><dd>" + zamanHucre(q.olusturma) + "</dd></div>" +
        "</dl>" +
        '<div class="adm-destek-kart-alt">' + atananSec +
          (u.id ? '<button type="button" class="btn-ghost btn-sm adm-ikonlu" data-kul-git="' + esc(u.id) + '">' + ikon("kullanicilar") + "<span>Öğrenci profili</span></button>" : "") + "</div>" +
      "</header>" +
      baglamHtml(q.baglam) +
      '<section class="adm-destek-akis" aria-labelledby="soru-yazisma-b"><h3 id="soru-yazisma-b" class="visually-hidden" tabindex="-1">Yazışma</h3>' +
        '<ol class="adm-mesajlar">' + akis.map(function (a) {
          if (a.n) {
            return '<li class="adm-mesaj is-not"><p class="adm-mesaj-ust">' + ikon("not") + "<strong>İç not</strong> · " + esc(a.n.yazan ? adSoyad(a.n.yazan) : "Yönetici") + " · " + esc(tarih(a.n.tarih)) +
              ' · <span class="adm-alt">öğrenci görmez</span></p><p class="adm-mesaj-metin adm-kir">' + esc(a.n.metin) + "</p></li>";
          }
          var m = a.m, y = m.rol === "yonetici";
          return '<li class="adm-mesaj ' + (y ? "is-yonetici" : "is-ogrenci") + '">' +
            '<p class="adm-mesaj-ust"><strong>' + esc(y ? "Meberra ekibi" + (m.yazan ? " (" + adSoyad(m.yazan) + ")" : "") : adSoyad(u)) + "</strong> · " + esc(tarih(m.tarih)) +
              (y ? " · " + (m.okundu ? "okundu" : "henüz okunmadı") : "") + "</p>" +
            '<p class="adm-mesaj-metin adm-kir">' + esc(m.metin) + "</p></li>";
        }).join("") + "</ol>" +
      "</section>" +
      '<section class="adm-destek-yanit" aria-labelledby="soru-yanit-b"><h3 id="soru-yanit-b" class="visually-hidden">Yanıtla</h3>' +
        '<div class="adm-segment" role="group" aria-label="Yazma türü">' +
          '<button type="button" class="adm-segment-dugme" data-mod="yanit" aria-pressed="true">Yanıt</button>' +
          '<button type="button" class="adm-segment-dugme" data-mod="not" aria-pressed="false">' + ikon("not") + "İç not</button></div>" +
        '<form class="adm-yanit-form" data-form="yanit" novalidate>' +
          (hz.length
            ? '<div class="field adm-hazir-sec"><label for="soru-hazir">Hazır yanıt ekle</label><select id="soru-hazir" class="text-input"><option value="">Seç…</option>' +
              hz.map(function (h) { return '<option value="' + esc(h.id) + '">' + esc(h.baslik) + "</option>"; }).join("") + "</select></div>"
            : '<p class="adm-alt">Sık kullandığın yanıtları <button type="button" class="adm-link" data-hazir-yonet>hazır yanıt</button> olarak kaydedebilirsin.</p>') +
          '<div class="field"><label for="soru-yanit">Yanıtın <span class="adm-alt">(öğrenci "Meberra ekibi" imzasıyla görür · Ctrl+Enter gönderir)</span></label>' +
            '<textarea id="soru-yanit" class="text-input adm-not" rows="5" maxlength="2000" data-sayac-icin="soru-yanit-sayac" required></textarea>' +
            '<p class="field-hint" id="soru-yanit-sayac" aria-live="polite">0 / 2.000</p></div>' +
          '<p class="field-error" id="soru-yanit-hata" role="alert" hidden></p>' +
          '<div class="adm-eylem"><button type="submit" class="btn-primary" data-gonder="yanit">Yanıtla</button>' +
            '<button type="submit" class="btn-ghost" data-gonder="kapat">Cevapla &amp; kapat</button>' +
            '<span class="adm-eylem-ayrac" aria-hidden="true"></span>' +
            (q.durum !== "bekliyor" ? '<button type="button" class="btn-ghost" data-soru-durum="bekliyor" aria-expanded="false">Bekliyor\'a al</button>' : "") +
            (q.durum !== "kapandi" ? '<button type="button" class="btn-ghost" data-soru-durum="kapandi" aria-expanded="false">Kapat</button>' : "") +
          "</div><div class=\"adm-onay\" hidden></div>" +
        "</form>" +
        '<form class="adm-yanit-form is-not" data-form="not" novalidate hidden>' +
          '<div class="field"><label for="soru-not">İç not <span class="adm-alt">(yalnızca yöneticiler görür; öğrenciye bildirim gitmez)</span></label>' +
            '<textarea id="soru-not" class="text-input adm-not" rows="3" maxlength="2000"></textarea></div>' +
          '<p class="field-error" id="soru-not-hata" role="alert" hidden></p>' +
          '<div class="adm-eylem"><button type="submit" class="btn-primary">Not ekle</button></div>' +
        "</form>" +
      "</section>" +
      '<details class="adm-destek-kutu" id="soru-sss-kutu"><summary><span class="adm-ikonlu">' + ikon("cevap") + "<span>SSS'ye ekle</span></span>" +
          (sssVar.length ? ' <span class="adm-alt">· ' + esc(sayi(sssVar.length)) + " yayın</span>" : "") + "</summary>" +
        (sssVar.length ? '<p class="adm-alt">Bu sorudan yayınlanan: ' + sssVar.map(function (f) { return esc(kisalt(f.soru, 60)) + " (" + esc(f.durum === "gizli" ? "gizli" : "yayında") + ")"; }).join(", ") + "</p>" : "") +
        '<form class="adm-islem" data-form="sss" novalidate>' +
          '<p class="adm-alt">Öğrencinin adı ve kişisel bilgisi SSS\'ye girmesin; soruyu genel bir dille yaz.</p>' +
          '<div class="field"><label for="sss-soru">Soru</label><textarea id="sss-soru" class="text-input adm-not" rows="2" maxlength="500">' + esc(kisalt(q.metin, 500)) + "</textarea></div>" +
          '<div class="field"><label for="sss-cevap">Cevap</label><textarea id="sss-cevap" class="text-input adm-not" rows="5" maxlength="4000">' + esc(sonYanit ? sonYanit.metin : "") + "</textarea></div>" +
          '<div class="field"><label for="sss-sayfa">Sayfa (boş: genel)</label><input id="sss-sayfa" class="text-input" maxlength="80" value="' + esc(q.sayfa || "") + '" placeholder="ör. ap-calculus"></div>' +
          '<p class="field-error" id="sss-hata" role="alert" hidden></p>' +
          '<div class="adm-eylem"><button type="submit" class="btn-primary">SSS\'de yayınla</button></div>' +
        "</form>" +
      "</details>";
  }
  function soruDetayTik(e) {
    if (e.target.closest("[data-geri]")) { soruKapat(); return; }
    if (e.target.closest("[data-tekrar]")) { soruDetayYukle(); return; }
    if (e.target.closest("[data-hazir-yonet]")) { hazirYonet(e.target.closest("[data-hazir-yonet]")); return; }
    var kg = e.target.closest("[data-kul-git]");
    if (kg) { sekmeAc("kullanicilar"); detayAc(kg.getAttribute("data-kul-git")); return; }
    var md = e.target.closest("[data-mod]");
    if (md) {
      var d = e.currentTarget, not = md.getAttribute("data-mod") === "not";
      d.querySelectorAll("[data-mod]").forEach(function (x) { x.setAttribute("aria-pressed", x === md ? "true" : "false"); });
      $('[data-form="yanit"]', d).hidden = not; $('[data-form="not"]', d).hidden = !not;
      $(not ? "#soru-not" : "#soru-yanit", d).focus();
      return;
    }
    var gb = e.target.closest("[data-gonder]");
    if (gb) { var f = gb.closest("form"); if (f) f.setAttribute("data-kapat", gb.getAttribute("data-gonder") === "kapat" ? "1" : ""); return; }
    var b = e.target.closest("[data-soru-durum]");
    if (!b || !S.soru.secili) return;
    var hedef = b.getAttribute("data-soru-durum"), id = S.soru.secili.id;
    onayAc(b.closest("form").querySelector(".adm-onay"), b, {
      baslik: hedef === "kapandi" ? "Konuşma kapatılsın mı?" : "Konuşma \"Bekliyor\" durumuna alınsın mı?",
      metin: hedef === "kapandi" ? "Öğrenci bu soruya artık yazamaz; gerekirse yeni soru açar." : "Konuşma yeniden yanıt bekleyenler listesine döner.",
      onayMetni: hedef === "kapandi" ? "Evet, kapat" : "Evet, bekliyor'a al",
      onayla: function () {
        return api("/api/admin/sorular/" + encodeURIComponent(id) + "/durum", "POST", { durum: hedef }).then(function () {
          bildir(hedef === "kapandi" ? "Konuşma kapatıldı." : "Konuşma bekliyor'a alındı.", "ok");
          soruDetayYukle(); soruYukle(true); ozetYukle(true);
        });
      }
    });
  }
  function soruDetayGonder(e) {
    var f = e.target.closest("form"); if (!f) return;
    e.preventDefault();
    var q = S.soru.secili && S.soru.secili.veri; if (!q) return;
    var tur = f.getAttribute("data-form");
    if (tur === "yanit") {
      var kapat = f.getAttribute("data-kapat") === "1"; f.setAttribute("data-kapat", "");
      var t = $("#soru-yanit", f), h = $("#soru-yanit-hata", f), metin = t.value.trim();
      if (!metin) { h.textContent = "Yanıtı yaz."; h.hidden = false; t.setAttribute("aria-invalid", "true"); t.focus(); return; }
      h.hidden = true; t.removeAttribute("aria-invalid");
      var dugmeler = f.querySelectorAll("[data-gonder]");
      dugmeler.forEach(function (x) { x.disabled = true; });
      var asil = f.querySelector(kapat ? '[data-gonder="kapat"]' : '[data-gonder="yanit"]'), eski = asil.textContent;
      asil.textContent = "Gönderiliyor…";
      api("/api/admin/sorular/" + encodeURIComponent(q.id) + "/yanit", "POST", { metin: metin, kapat: kapat }).then(function () {
        bildir(kapat ? "Yanıt gönderildi ve konuşma kapatıldı." : "Yanıt gönderildi; öğrenciye bildirim gitti.", "ok");
        t.value = "";
        ozetYukle(true); soruYukle(true);
        return soruDetayYukle("#soru-yazisma-b");
      }).catch(function (err) {
        dugmeler.forEach(function (x) { x.disabled = false; }); asil.textContent = eski;
        h.textContent = err.message; h.hidden = false;
      });
    } else if (tur === "not") {
      var nt = $("#soru-not", f), nh = $("#soru-not-hata", f), nm = nt.value.trim(), nd = f.querySelector("[type=submit]");
      if (!nm) { nh.textContent = "Notu yaz."; nh.hidden = false; nt.focus(); return; }
      nh.hidden = true; nd.disabled = true; nd.textContent = "Ekleniyor…";
      api("/api/admin/sorular/" + encodeURIComponent(q.id) + "/not", "POST", { metin: nm }).then(function () {
        bildir("İç not eklendi.", "ok"); soruYukle(true); nt.value = "";
        return soruDetayYukle("#soru-yazisma-b");
      }).catch(function (err) { nd.disabled = false; nd.textContent = "Not ekle"; nh.textContent = err.message; nh.hidden = false; });
    } else if (tur === "sss") {
      var dugme = f.querySelector("[type=submit]");
      var hs = $("#sss-hata", f), govde = { soru: $("#sss-soru", f).value.trim(), cevap: $("#sss-cevap", f).value.trim(), sayfa: $("#sss-sayfa", f).value.trim(), kaynakSoruId: q.id };
      if (!govde.soru || !govde.cevap) { hs.textContent = "Soru ve cevap gerekli."; hs.hidden = false; return; }
      hs.hidden = true;
      dugme.disabled = true; dugme.textContent = "Yayınlanıyor…";
      api("/api/admin/sss", "POST", govde).then(function () {
        bildir("SSS'de yayınlandı.", "ok");
        return soruDetayYukle("#soru-sss-kutu summary");
      }).catch(function (err) {
        dugme.disabled = false; dugme.textContent = "SSS'de yayınla";
        hs.textContent = err.message; hs.hidden = false;
      });
    }
  }
  function soruAta(deger, el) {
    var q = S.soru.secili && S.soru.secili.veri; if (!q) return;
    el.disabled = true;
    api("/api/admin/sorular/" + encodeURIComponent(q.id) + "/ata", "POST", { atanan: deger || null }).then(function (v) {
      S.soru.secili.veri = v.soru;
      bildir(v.soru.atanan ? "Konuşma " + adSoyad(v.soru.atanan) + " kişisine atandı." : "Atama kaldırıldı.", "ok");
      soruYukle(true);
    }).catch(function (e) { bildir(e.message, "bad"); }).then(function () { el.disabled = false; });
  }
  function yoneticilerAl() {
    if (S.yoneticiler) return Promise.resolve(S.yoneticiler);
    return api("/api/admin/yoneticiler").then(function (v) { S.yoneticiler = v; return v; });
  }

  /* --- Hazır yanıtlar ------------------------------------------------------ */
  function hazirlar(tazele) {
    if (S.hazir && !tazele) return Promise.resolve(S.hazir);
    return api("/api/admin/hazir-yanitlar").then(function (v) { S.hazir = Array.isArray(v.yanitlar) ? v.yanitlar : []; return S.hazir; });
  }
  /** Seçilen hazır yanıtı imleç konumuna ekler (boş kutuda doğrudan yazar) */
  function hazirEkle(id) {
    var h = (S.hazir || []).filter(function (x) { return String(x.id) === String(id); })[0];
    var t = $("#soru-yanit"); if (!h || !t) return;
    var a = t.selectionStart != null ? t.selectionStart : t.value.length, b = t.selectionEnd != null ? t.selectionEnd : t.value.length;
    var once = t.value.slice(0, a), sonra = t.value.slice(b);
    var ek = (once && !/\n$/.test(once) ? "\n" : "") + h.metin;
    t.value = (once + ek + sonra).slice(0, t.maxLength || 2000);
    t.focus();
    var konum = Math.min(t.value.length, (once + ek).length);
    try { t.setSelectionRange(konum, konum); } catch (e) { /* eski tarayıcı */ }
    t.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function hazirListeHtml(l) {
    return (l.length
      ? '<ul class="adm-hazir-liste">' + l.map(function (h) {
          return '<li class="adm-hazir-oge"><div class="adm-min0"><p class="adm-hazir-baslik">' + esc(h.baslik) + '</p><p class="adm-alt adm-kir adm-hazir-metin">' + esc(kisalt(h.metin, 160)) + "</p></div>" +
            '<div class="adm-eylem"><button type="button" class="btn-ghost btn-sm" data-hazir-duzen="' + esc(h.id) + '">Düzenle</button>' +
            '<button type="button" class="btn-ghost btn-sm adm-ghost-tehlike" data-hazir-sil="' + esc(h.id) + '" aria-label="Sil: ' + esc(h.baslik) + '">' + ikon("sil") + "</button></div></li>";
        }).join("") + "</ul>"
      : bos("Henüz hazır yanıt yok. Aşağıdan ilkini ekle.")) +
      '<form class="adm-cek-form" data-hazir-form novalidate><h3 class="adm-hazir-form-baslik">Yeni hazır yanıt</h3>' +
        '<input type="hidden" name="id" value="">' +
        '<div class="field"><label for="hz-baslik">Başlık</label><input id="hz-baslik" name="baslik" class="text-input" maxlength="80" placeholder="ör. Teşekkür + kaynak önerisi"></div>' +
        '<div class="field"><label for="hz-metin">Metin</label><textarea id="hz-metin" name="metin" class="text-input adm-not" rows="6" maxlength="2000"></textarea></div>' +
        '<p class="adm-onay-hata" role="alert" hidden></p>' +
        '<div class="adm-eylem"><button type="submit" class="btn-primary">Kaydet</button><button type="button" class="btn-ghost" data-hazir-vazgec hidden>Vazgeç</button></div>' +
      "</form>";
  }
  function hazirYonet(tetik) {
    var c = cekmeceAc("Hazır yanıtlar", iskelet("cekmece"), tetik, function () {
      // Konuşma açıksa seçim listesi tazelensin
      if (S.soru.secili && S.soru.secili.veri) soruDetayCiz(S.soru.secili.veri, true);
    });
    c.mod = "hazir";
    if (!c.hazirBagli) {
      c.hazirBagli = true;
      c.govde.addEventListener("click", function (e) {
        if (c.mod !== "hazir") return;
        var f = $("[data-hazir-form]", c.govde); if (!f) return;
        var du = e.target.closest("[data-hazir-duzen]");
        if (du) {
          var h = (S.hazir || []).filter(function (x) { return String(x.id) === du.getAttribute("data-hazir-duzen"); })[0]; if (!h) return;
          f.id.value = h.id; f.baslik.value = h.baslik; f.metin.value = h.metin;
          $(".adm-hazir-form-baslik", f).textContent = "Düzenle: " + h.baslik; $("[data-hazir-vazgec]", f).hidden = false;
          f.baslik.focus(); return;
        }
        if (e.target.closest("[data-hazir-vazgec]")) { hazirCiz(c); return; }
        var sl = e.target.closest("[data-hazir-sil]");
        if (sl) {
          sl.disabled = true;
          api("/api/admin/hazir-yanitlar/" + encodeURIComponent(sl.getAttribute("data-hazir-sil")), "DELETE").then(function () {
            bildir("Hazır yanıt silindi.", "ok"); return hazirlar(true).then(function () { hazirCiz(c); });
          }).catch(function (er) { sl.disabled = false; bildir(er.message, "bad"); });
        }
      });
      c.govde.addEventListener("submit", function (e) {
        if (c.mod !== "hazir") return;
        var f = e.target.closest("[data-hazir-form]"); if (!f) return;
        e.preventDefault();
        var hata = $(".adm-onay-hata", f), dg = f.querySelector("[type=submit]");
        var govde = { baslik: f.baslik.value.trim(), metin: f.metin.value.trim() };
        if (!govde.baslik || !govde.metin) { hata.textContent = "Başlık ve metin gerekli."; hata.hidden = false; (govde.baslik ? f.metin : f.baslik).focus(); return; }
        hata.hidden = true; dg.disabled = true;
        var id = f.id.value;
        api("/api/admin/hazir-yanitlar" + (id ? "/" + encodeURIComponent(id) : ""), id ? "PUT" : "POST", govde).then(function () {
          bildir(id ? "Hazır yanıt güncellendi." : "Hazır yanıt kaydedildi.", "ok");
          return hazirlar(true).then(function () { hazirCiz(c); });
        }).catch(function (er) { dg.disabled = false; hata.textContent = er.message; hata.hidden = false; });
      });
    }
    hazirlar(true).then(function () { if (cekmeceAcik() && c.mod === "hazir") hazirCiz(c); }).catch(function (e) {
      c.govde.innerHTML = '<div class="adm-hata" role="alert"><p>' + esc(e.message) + "</p></div>";
    });
  }
  function hazirCiz(c) {
    c.govde.innerHTML = '<p class="adm-alt">Hazır yanıtlar tüm yöneticiler arasında ortaktır. Yanıt kutusundaki "Hazır yanıt ekle" listesinden seçince metin imlecin olduğu yere eklenir.</p>' + hazirListeHtml(S.hazir || []);
  }

  /* ------------------------------------------------------------------------
     10. DUYURU
     ------------------------------------------------------------------------ */
  function panelDuyuruKur() {
    var p = $("#panel-duyuru");
    p.innerHTML =
      '<div class="adm-panel-ust"><h2>Duyuru</h2></div>' +
      '<p class="adm-ipucu">Duyuru, seçilen kitledeki her etkin kullanıcıya uygulama içi bildirim olarak gider; tarayıcı bildirimini açmış olanlara (sessiz saatler 22:00–08:00 dışında) anlık bildirim de gönderilir. Kısa, nazik ve bilgilendirici yaz; reklam/kampanya için ayrıca ticari ileti onayı gerekir.</p>' +
      '<div class="adm-izgara">' +
        '<form class="surface adm-islem adm-duyuru-form" novalidate>' +
          '<div class="field"><label for="duy-hedef">Kime</label><select id="duy-hedef" class="text-input">' +
            '<option value="hepsi">Tüm kullanıcılar</option><option value="ucretsiz">Yalnızca ücretsiz üyeler</option><option value="premium">Yalnızca Premium üyeler</option></select></div>' +
          '<div class="field"><label for="duy-baslik">Başlık</label><input id="duy-baslik" class="text-input" maxlength="120" autocomplete="off" placeholder="ör. Yeni AP Physics denemeleri eklendi"></div>' +
          '<div class="field"><label for="duy-metin">Metin</label><textarea id="duy-metin" class="text-input adm-not" rows="5" maxlength="1000"></textarea>' +
            '<p class="field-hint" id="duy-sayac">0 / 1.000</p></div>' +
          '<div class="field"><label for="duy-link">Bağlantı (isteğe bağlı, site içi)</label><input id="duy-link" class="text-input" maxlength="300" autocomplete="off" placeholder="/sinavlar.html" aria-describedby="duy-link-hata"></div>' +
          '<p class="field-error" id="duy-hata" role="alert" hidden></p>' +
          '<div class="adm-eylem"><button type="submit" class="btn-primary" aria-expanded="false">Gönder…</button></div>' +
          '<div class="adm-onay" hidden></div>' +
        "</form>" +
        '<section class="surface" aria-labelledby="duy-onizleme-b"><h3 id="duy-onizleme-b">Önizleme</h3>' +
          '<div class="adm-onizleme" aria-live="polite"></div>' +
          '<p class="adm-sonuc" id="duy-alici"></p>' +
        "</section>" +
      "</div>";
    var f = $(".adm-duyuru-form", p), zaman = null;
    f.addEventListener("input", function () {
      $("#duy-sayac").textContent = sayi($("#duy-metin").value.length) + " / 1.000";
      onizlemeCiz();
      clearTimeout(zaman); zaman = setTimeout(duyuruOnizle, 400);
    });
    f.addEventListener("change", function (e) { if (e.target.id === "duy-hedef") duyuruOnizle(); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var g = duyuruGovde(), h = $("#duy-hata");
      var hata = !g.baslik ? "Başlık yaz." : !g.metin ? "Metin yaz." : !linkGecerli(g.link) ? "Bağlantı / ile başlayan site içi bir yol olmalı (ör. /sinavlar.html)." : "";
      if (hata) { h.textContent = hata; h.hidden = false; return; }
      h.hidden = true;
      var tetik = f.querySelector("[type=submit]");
      api("/api/admin/duyuru", "POST", Object.assign({ onizleme: true }, g)).then(function (v) {
        onayAc($(".adm-onay", f), tetik, {
          baslik: hedefAd(g.hedef) + " (" + sayi(v.alici) + " kişi) için duyuru gönderilsin mi?",
          metin: "“" + g.baslik + "” — gönderilen duyuru geri alınamaz.",
          onayMetni: "Evet, gönder",
          onayla: function () {
            return api("/api/admin/duyuru", "POST", g).then(function (r) {
              bildir("Duyuru " + sayi(r.alici) + " kişiye gönderildi (" + sayi(r.push) + " anlık bildirim).", "ok");
              $("#duy-baslik").value = ""; $("#duy-metin").value = ""; $("#duy-link").value = ""; onizlemeCiz();
            });
          }
        });
      }).catch(function (err) { h.textContent = err.message; h.hidden = false; });
    });
    onizlemeCiz();
  }
  function duyuruGovde() {
    var g = { hedef: $("#duy-hedef").value, baslik: $("#duy-baslik").value.trim(), metin: $("#duy-metin").value.trim() };
    var l = $("#duy-link").value.trim(); if (l) g.link = l;
    return g;
  }
  function onizlemeCiz() {
    var g = duyuruGovde(), k = $("#panel-duyuru .adm-onizleme"); if (!k) return;
    k.innerHTML = '<div class="adm-bildirim-kart"><span class="adm-bildirim-ikon" aria-hidden="true">M</span><div class="adm-min0">' +
      '<p class="adm-bildirim-baslik">' + esc(g.baslik || "Başlık") + "</p>" +
      '<p class="adm-bildirim-metin adm-kir">' + esc(g.metin || "Duyuru metni burada görünecek.") + "</p>" +
      (g.link ? '<p class="adm-alt adm-kir">' + (linkGecerli(g.link) ? "Bağlantı: " + esc(g.link) : '<span class="adm-uyari-not">Geçersiz bağlantı</span>') + "</p>" : "") +
      "</div></div>";
  }
  function duyuruOnizle() {
    var a = $("#duy-alici"); if (!a) return;
    var g = duyuruGovde();
    api("/api/admin/duyuru", "POST", { onizleme: true, hedef: g.hedef, baslik: g.baslik || "x", metin: g.metin || "x" }).then(function (v) {
      a.textContent = hedefAd(g.hedef) + ": " + sayi(v.alici) + " alıcı.";
    }).catch(function () { a.textContent = ""; });
  }

  /* ------------------------------------------------------------------------
     11. LİG (haftalık gruplar, takma ad moderasyonu)
     ------------------------------------------------------------------------ */
  function panelLigKur() {
    var p = $("#panel-lig");
    p.innerHTML =
      '<div class="adm-panel-ust"><h2>Lig</h2><div class="adm-arac">' +
        '<div class="field adm-field-dar"><label for="lig-hafta">Hafta</label><select id="lig-hafta" class="text-input"><option value="">Bu hafta</option></select></div>' +
        '<button type="button" class="btn-ghost" data-yenile>Yenile</button></div></div>' +
      '<p class="adm-ipucu">Öğrenciler birbirini yalnızca takma adla görür. Uygunsuz bir takma adı gizle (öğrenciden yeni ad seçmesi istenir) ya da yeniden adlandır. XP: her cevap 5, doğru cevap +5, biten deneme 50.</p>' +
      '<p class="adm-sonuc" id="lig-ozet" aria-live="polite"></p><div class="adm-lig-icerik"></div>';
    $("#lig-hafta").addEventListener("change", function (e) { S.lig.hafta = e.target.value; ligYukle(); });
    p.addEventListener("click", function (e) {
      if (e.target.closest("[data-yenile],[data-tekrar]")) { ligYukle(); return; }
      var b = e.target.closest("[data-lig-islem]"); if (!b) return;
      var satir = b.closest("[data-lig-uye]"), uid = satir.getAttribute("data-lig-uye"), ad = satir.getAttribute("data-takma");
      var kap = satir.querySelector(".adm-onay") || b.closest("li,tr").querySelector(".adm-onay");
      var islem = b.getAttribute("data-lig-islem");
      if (islem === "adlandir") {
        kap.hidden = false;
        kap.innerHTML = '<form class="adm-onay-ic" data-lig-ad-form novalidate><div class="field"><label for="lig-ad-' + esc(uid) + '">Yeni takma ad</label>' +
          '<input id="lig-ad-' + esc(uid) + '" class="text-input" maxlength="20" value="' + esc(ad) + '"></div>' +
          '<p class="adm-onay-hata" role="alert" hidden></p><div class="adm-eylem"><button type="submit" class="btn-primary">Kaydet</button><button type="button" class="btn-ghost" data-lig-vazgec>Vazgeç</button></div></form>';
        $("input", kap).focus();
        return;
      }
      var hedef = islem === "gizle" ? "gizli" : "aktif";
      onayAc(kap, b, {
        baslik: islem === "gizle" ? "“" + ad + "” takma adı gizlensin mi?" : "“" + ad + "” yeniden görünür olsun mu?",
        metin: islem === "gizle" ? "Diğer öğrenciler “Gizli üye” görür; öğrenciden yeni bir takma ad seçmesi istenir." : "Takma ad sıralamada yeniden görünür.",
        onayMetni: islem === "gizle" ? "Evet, gizle" : "Evet, göster", tehlike: islem === "gizle",
        onayla: function () {
          return api("/api/admin/veri/lig_uyeleri/" + encodeURIComponent(uid), "PUT", { degisiklikler: { durum: hedef } }).then(function () {
            bildir(islem === "gizle" ? "Takma ad gizlendi." : "Takma ad görünür.", "ok"); ligYukle();
          });
        }
      });
    });
    p.addEventListener("submit", function (e) {
      var f = e.target.closest("[data-lig-ad-form]"); if (!f) return;
      e.preventDefault();
      var uid = f.closest("[data-lig-uye]").getAttribute("data-lig-uye"), h = $(".adm-onay-hata", f), v = $("input", f).value.trim();
      api("/api/admin/veri/lig_uyeleri/" + encodeURIComponent(uid), "PUT", { degisiklikler: { takma_ad: v } }).then(function () {
        bildir("Takma ad “" + v + "” olarak değiştirildi.", "ok"); ligYukle();
      }).catch(function (err) { h.textContent = err.message; h.hidden = false; });
    });
    p.addEventListener("click", function (e) {
      var v = e.target.closest("[data-lig-vazgec]"); if (!v) return;
      var k = v.closest(".adm-onay"); k.hidden = true; k.innerHTML = "";
    });
  }
  function ligYukle() {
    var kap = $("#panel-lig .adm-lig-icerik"), oz = $("#lig-ozet");
    var no = ++S.lig.istek;
    kap.setAttribute("aria-busy", "true");
    kap.innerHTML = yukleniyor("Lig yükleniyor…");
    return api("/api/admin/lig" + sorgu({ hafta: S.lig.hafta })).then(function (v) {
      if (no !== S.lig.istek) return;
      var sec = $("#lig-hafta"), haftalar = Array.isArray(v.haftalar) ? v.haftalar : [];
      sec.innerHTML = '<option value="">Bu hafta</option>' + haftalar.map(function (h) { return '<option value="' + esc(h) + '"' + (h === S.lig.hafta ? " selected" : "") + ">" + esc(h) + "</option>"; }).join("");
      var us = v.uyeSayisi || {};
      oz.textContent = v.hafta + (v.kapandi ? " (kapandı)" : " (sürüyor)") + " · Üyeler: " + sayi(us.aktif || 0) + " aktif, " + sayi(us.gizli || 0) + " gizli, " + sayi(us.ayrildi || 0) + " ayrıldı.";
      var gruplar = Array.isArray(v.gruplar) ? v.gruplar : [];
      if (!gruplar.length) { kap.innerHTML = bos("Bu hafta için henüz grup yok. Gruplar, bir üye ligi ilk açtığında kurulur."); return; }
      kap.innerHTML = '<div class="adm-lig-gruplar">' + gruplar.map(function (g) {
        return '<section class="surface adm-lig-grup" aria-label="' + esc(g.kademeAd + " ligi, grup " + g.grup) + '">' +
          "<h3>" + esc(g.kademeAd) + ' <span class="adm-alt">· Grup ' + esc(g.grup) + " · " + esc(sayi(g.uyeler.length)) + " üye</span></h3>" +
          '<ol class="adm-lig-liste">' + g.uyeler.map(function (u, i) {
            var gizli = u.durum === "gizli";
            return '<li data-lig-uye="' + esc(u.userId) + '" data-takma="' + esc(u.takmaAd) + '">' +
              '<div class="adm-lig-satir"><span class="adm-lig-sira">' + (i + 1) + "</span>" +
                '<span class="adm-min0 adm-lig-ad"><strong class="adm-kir">' + esc(u.takmaAd) + "</strong>" +
                  '<span class="adm-alt adm-kir">' + esc(adSoyad(u)) + "</span></span>" +
                '<span class="adm-lig-xp">' + esc(sayi(u.xp)) + " XP</span>" +
                (gizli ? rozet("Gizli", "bad") : "") + (u.durum === "ayrildi" ? rozet("Ayrıldı", "notr") : "") +
                (u.sonuc ? rozet(u.sonuc === "yukseldi" ? "Yükseldi" : u.sonuc === "dustu" ? "Düştü" : "Kaldı", u.sonuc === "yukseldi" ? "ok" : u.sonuc === "dustu" ? "warn" : "notr") : "") +
                '<span class="adm-eylem">' +
                  '<button type="button" class="btn-ghost btn-sm" data-lig-islem="adlandir">Yeniden adlandır</button>' +
                  (u.durum !== "ayrildi" ? '<button type="button" class="btn-ghost btn-sm' + (gizli ? "" : " adm-ghost-tehlike") + '" data-lig-islem="' + (gizli ? "goster" : "gizle") + '" aria-expanded="false">' + (gizli ? "Göster" : "Gizle") + "</button>" : "") +
                "</span></div>" +
              '<div class="adm-onay" hidden></div></li>';
          }).join("") + "</ol></section>";
      }).join("") + "</div>";
    }).catch(function (e) {
      if (no === S.lig.istek) kap.innerHTML = hataKutusu(e.message);
    }).then(function () { kap.removeAttribute("aria-busy"); });
  }

  /* ------------------------------------------------------------------------
     12. VERİ (tablo tarayıcı / düzenleyici)
     ------------------------------------------------------------------------ */
  function panelVeriKur() {
    var p = $("#panel-veri");
    p.innerHTML =
      '<div class="adm-veri-liste-gorunum">' +
        '<div class="adm-panel-ust"><h2>Veri</h2></div>' +
        '<p class="adm-ipucu">Tabloları incele, ara, CSV olarak indir. Yalnızca izin verilen alanlar düzenlenebilir; hiçbir şey silinmez. Gizli alanlar (şifre özeti, belirteçler, push anahtarları) “••••” görünür. Her düzenleme denetim kaydına önceki/sonraki değerle yazılır.</p>' +
        '<form class="adm-arac adm-arac-genis adm-veri-arac" role="search" aria-label="Veri ara" novalidate>' +
          '<div class="field adm-field-dar"><label for="veri-tablo">Tablo</label><select id="veri-tablo" class="text-input"><option value="">Yükleniyor…</option></select></div>' +
          '<div class="field adm-field-esnek"><label for="veri-q">Ara (metin sütunlarında)</label><input type="search" id="veri-q" class="text-input" maxlength="100" autocomplete="off"></div>' +
          '<div class="field adm-field-dar"><label for="veri-alan">Süz: sütun</label><select id="veri-alan" class="text-input"><option value="">—</option></select></div>' +
          '<div class="field adm-field-dar"><label for="veri-deger">Değer</label><input id="veri-deger" class="text-input" maxlength="200" autocomplete="off" placeholder="__null__ = boş"></div>' +
          '<div class="field adm-field-dar"><label for="veri-sirala">Sırala</label><select id="veri-sirala" class="text-input"><option value="">Varsayılan</option></select></div>' +
          '<div class="field adm-field-dar"><label for="veri-yon">Yön</label><select id="veri-yon" class="text-input"><option value="desc">Azalan</option><option value="asc">Artan</option></select></div>' +
          '<div class="adm-eylem adm-eylem-alt"><button type="submit" class="btn-primary">Uygula</button><a class="btn-ghost" id="veri-csv" href="#" download>CSV indir</a></div>' +
        "</form>" +
        '<p class="adm-alt" id="veri-aciklama"></p>' +
        '<p class="adm-sonuc" id="veri-ozet" aria-live="polite"></p>' +
        '<div class="adm-veri-liste"></div><div class="adm-veri-sayfa"></div>' +
      "</div>" +
      '<div class="adm-detay adm-veri-detay" hidden></div>';
    var f = $(".adm-veri-arac", p);
    $("#veri-tablo").addEventListener("change", function (e) {
      S.veri.tablo = e.target.value; S.veri.q = ""; S.veri.alan = ""; S.veri.deger = ""; S.veri.sirala = ""; S.veri.yon = "desc"; S.veri.sayfa = 1;
      $("#veri-q").value = ""; $("#veri-deger").value = ""; $("#veri-yon").value = "desc";
      veriSutunSecenekleri(); veriYukle();
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      S.veri.q = $("#veri-q").value.trim(); S.veri.alan = $("#veri-alan").value; S.veri.deger = $("#veri-deger").value;
      S.veri.sirala = $("#veri-sirala").value; S.veri.yon = $("#veri-yon").value; S.veri.sayfa = 1;
      veriYukle();
    });
    $(".adm-veri-liste-gorunum", p).addEventListener("click", function (e) {
      if (e.target.closest("[data-tekrar]")) { if (S.veri.tablolar) veriYukle(); else veriTablolarYukle(); return; }
      var sb = e.target.closest("[data-sayfa]");
      if (sb && !sb.disabled) { S.veri.sayfa = Number(sb.getAttribute("data-sayfa")); veriYukle().then(function () { $("#veri-ozet").focus(); }); return; }
      var tr = e.target.closest("[data-veri-satir]");
      if (tr) veriSatirAc(tr.getAttribute("data-veri-satir"));
    });
    $(".adm-veri-liste-gorunum", p).addEventListener("keydown", function (e) {
      var tr = e.target.closest("[data-veri-satir]");
      if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); veriSatirAc(tr.getAttribute("data-veri-satir")); }
    });
    var d = $(".adm-veri-detay", p);
    d.addEventListener("click", function (e) {
      if (e.target.closest("[data-geri]")) { veriDetayKapat(); return; }
    });
    d.addEventListener("submit", veriKaydet);
  }
  function veriTablo() { return (S.veri.tablolar || []).filter(function (t) { return t.ad === S.veri.tablo; })[0] || null; }
  function veriTablolarYukle() {
    var kap = $("#panel-veri .adm-veri-liste");
    kap.innerHTML = yukleniyor("Tablolar yükleniyor…");
    return api("/api/admin/veri/tablolar").then(function (v) {
      S.veri.tablolar = Array.isArray(v.tablolar) ? v.tablolar : [];
      if (!S.veri.tablo && S.veri.tablolar.length) S.veri.tablo = S.veri.tablolar[0].ad;
      $("#veri-tablo").innerHTML = S.veri.tablolar.map(function (t) {
        return '<option value="' + esc(t.ad) + '"' + (t.ad === S.veri.tablo ? " selected" : "") + ">" + esc(t.ad) + " (" + esc(sayi(t.satir)) + ")" + (t.saltOkunur ? " · salt okunur" : "") + "</option>";
      }).join("");
      veriSutunSecenekleri();
      return veriYukle();
    }).catch(function (e) { kap.innerHTML = hataKutusu(e.message); });
  }
  function veriSutunSecenekleri() {
    var t = veriTablo(); if (!t) return;
    var acik = t.sutunlar.filter(function (s) { return !s.gizli; });
    $("#veri-alan").innerHTML = '<option value="">—</option>' + acik.map(function (s) { return '<option value="' + esc(s.ad) + '">' + esc(s.ad) + "</option>"; }).join("");
    $("#veri-sirala").innerHTML = '<option value="">Varsayılan</option>' + acik.map(function (s) { return '<option value="' + esc(s.ad) + '">' + esc(s.ad) + "</option>"; }).join("");
    $("#veri-aciklama").textContent = (t.aciklama || "") + (t.saltOkunur ? "" : " · Düzenlenebilir: " + t.duzenlenebilir.join(", "));
  }
  function veriYukle() {
    var t = veriTablo(); if (!t) return Promise.resolve();
    var kap = $("#panel-veri .adm-veri-liste"), say = $("#panel-veri .adm-veri-sayfa"), oz = $("#veri-ozet");
    var no = ++S.veri.istek;
    var f = { q: S.veri.q, alan: S.veri.alan, deger: S.veri.alan ? S.veri.deger : undefined, sirala: S.veri.sirala, yon: S.veri.yon, sayfa: S.veri.sayfa };
    $("#veri-csv").setAttribute("href", veriYolu(t.ad, f, true));
    kap.setAttribute("aria-busy", "true");
    if (!kap.querySelector("table")) kap.innerHTML = yukleniyor("Satırlar yükleniyor…"); else kap.classList.add("is-soluk");
    return api(veriYolu(t.ad, f, false)).then(function (v) {
      if (no !== S.veri.istek) return;
      S.veri.sonuc = v;
      var liste = Array.isArray(v.satirlar) ? v.satirlar : [], sut = Array.isArray(v.sutunlar) ? v.sutunlar : [];
      var b = sayfaBilgisi(v.toplam, v.sayfa || S.veri.sayfa, v.sayfaBoyu || 50, liste.length);
      oz.tabIndex = -1;
      oz.textContent = sayi(b.toplam) + " satır" + (v.saltOkunur ? " · salt okunur" : " · düzenlemek için satıra tıkla") + ".";
      if (!liste.length) { kap.innerHTML = bos("Bu filtreye uyan satır yok."); say.innerHTML = ""; return; }
      kap.innerHTML = '<div class="adm-tablo-kap adm-veri-kap"><table class="adm-tablo adm-veri-tablo">' +
        '<caption class="visually-hidden">' + esc(t.ad) + " tablosu, sayfa " + esc(sayi(b.sayfa)) + "</caption>" +
        "<thead><tr>" + sut.map(function (s) {
          return '<th scope="col"' + (s.duzenlenebilir ? ' class="is-duzen" title="Düzenlenebilir"' : "") + ">" + esc(s.ad) + (s.duzenlenebilir ? " ✎" : "") + "</th>";
        }).join("") + "</tr></thead><tbody>" +
        liste.map(function (r) {
          return '<tr data-veri-satir="' + esc(r._id) + '" tabindex="0" aria-label="Satır ' + esc(r._id) + ' ayrıntısı">' + sut.map(function (s) {
            var v2 = r[s.ad];
            return "<td" + (v2 === null ? ' class="is-null"' : s.gizli ? ' class="is-gizli"' : "") + ">" + esc(hucreMetni(v2, 60)) + "</td>";
          }).join("") + "</tr>";
        }).join("") + "</tbody></table></div>";
      say.innerHTML = sayfalamaHtml(b, "Veri sayfaları", "satır");
    }).catch(function (e) {
      if (no === S.veri.istek) { kap.innerHTML = hataKutusu(e.message); say.innerHTML = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); kap.classList.remove("is-soluk"); });
  }
  function veriSatirAc(id) {
    var t = veriTablo(); if (!t) return;
    var p = $("#panel-veri"), d = $(".adm-veri-detay", p);
    $(".adm-veri-liste-gorunum", p).hidden = true; d.hidden = false;
    S.veri.secili = { id: id, satir: null };
    d.innerHTML = '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Tabloya dön</button></div>' + yukleniyor("Satır yükleniyor…");
    $("[data-geri]", d).focus();
    return api("/api/admin/veri/" + encodeURIComponent(t.ad) + "/" + encodeURIComponent(id)).then(function (v) {
      if (!S.veri.secili || S.veri.secili.id !== id) return;
      S.veri.secili.satir = v.satir;
      d.innerHTML = veriFormHtml(t, v);
      var h = $("#veri-detay-baslik", d); if (h) h.focus();
    }).catch(function (e) {
      d.innerHTML = '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Tabloya dön</button></div>' + hataKutusu(e.message);
    });
  }
  function veriDetayKapat() {
    var p = $("#panel-veri"), id = S.veri.secili && S.veri.secili.id;
    S.veri.secili = null;
    $(".adm-veri-detay", p).hidden = true; $(".adm-veri-detay", p).innerHTML = "";
    $(".adm-veri-liste-gorunum", p).hidden = false;
    var tr = id != null ? p.querySelector('[data-veri-satir="' + (window.CSS && CSS.escape ? CSS.escape(String(id)) : String(id)) + '"]') : null;
    if (tr) tr.focus(); else $("#veri-tablo").focus();
  }
  function alanGirdisi(s, deger) {
    var id = "veri-f-" + s.ad, k = s.kural || {};
    var v = deger == null ? "" : typeof deger === "object" ? JSON.stringify(deger) : String(deger);
    var giris;
    if (k.tur === "secim") {
      giris = '<select id="' + esc(id) + '" class="text-input" name="' + esc(s.ad) + '">' + k.degerler.map(function (x) { return '<option value="' + esc(x) + '"' + (x === v ? " selected" : "") + ">" + esc(x) + "</option>"; }).join("") +
        (k.degerler.indexOf(v) < 0 ? '<option value="' + esc(v) + '" selected>' + esc(v) + " (mevcut)</option>" : "") + "</select>";
    } else if (k.tur === "bool") {
      giris = '<select id="' + esc(id) + '" class="text-input" name="' + esc(s.ad) + '"><option value="1"' + (v === "1" ? " selected" : "") + '>1 (evet)</option><option value="0"' + (v !== "1" ? " selected" : "") + ">0 (hayır)</option></select>";
    } else if (k.tur === "tamsayi") {
      giris = '<input id="' + esc(id) + '" class="text-input" name="' + esc(s.ad) + '" type="number" step="1" min="' + esc(k.min) + '" max="' + esc(k.max) + '" value="' + esc(v) + '">';
    } else if (k.tur === "json" || (k.max && k.max > 200)) {
      if (k.tur === "json") { try { v = JSON.stringify(JSON.parse(v), null, 2); } catch (e) { /* olduğu gibi */ } }
      giris = '<textarea id="' + esc(id) + '" class="text-input adm-not' + (k.tur === "json" ? " adm-kod-alan" : "") + '" name="' + esc(s.ad) + '" rows="' + (k.tur === "json" ? 8 : 4) + '"' + (k.max ? ' maxlength="' + esc(k.max) + '"' : "") + ">" + esc(v) + "</textarea>";
    } else {
      giris = '<input id="' + esc(id) + '" class="text-input" name="' + esc(s.ad) + '" value="' + esc(v) + '"' + (k.max ? ' maxlength="' + esc(k.max) + '"' : "") + (k.tur === "tarih" ? ' placeholder="2026-12-31T21:00:00.000Z"' : "") + ">";
    }
    var ipucu = k.tur === "secim" ? "Seçenekler: " + k.degerler.join(", ") : k.tur === "tarih" ? "ISO tarih (UTC)" : k.tur === "tamsayi" ? k.min + "–" + k.max : k.tur === "takmaAd" ? "3–20 karakter; harf, rakam, _" : k.max ? "En fazla " + k.max + " karakter" + (k.min ? "" : " (boş: ∅)") : "";
    return '<div class="field"><label for="' + esc(id) + '">' + esc(s.ad) + "</label>" + giris + (ipucu ? '<p class="field-hint">' + esc(ipucu) + "</p>" : "") + "</div>";
  }
  function veriFormHtml(t, v) {
    var r = v.satir || {}, sut = Array.isArray(v.sutunlar) ? v.sutunlar : [];
    var duzen = sut.filter(function (s) { return s.duzenlenebilir; }), diger = sut.filter(function (s) { return !s.duzenlenebilir; });
    return '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Tabloya dön</button></div>' +
      '<header class="surface adm-kisi"><div class="adm-kisi-ust"><h2 id="veri-detay-baslik" tabindex="-1">' + esc(t.ad) + " · #" + esc(r._id) + "</h2>" +
        (v.saltOkunur ? rozet("Salt okunur", "notr") : rozet("Düzenlenebilir", "mor")) + "</div></header>" +
      (duzen.length && !v.saltOkunur
        ? '<section class="surface" aria-labelledby="veri-duzen-b"><h3 id="veri-duzen-b">Düzenle</h3>' +
            '<form class="adm-islem adm-veri-form" novalidate>' + duzen.map(function (s) { return alanGirdisi(s, r[s.ad]); }).join("") +
              '<p class="field-error" id="veri-hata" role="alert" hidden></p>' +
              '<div class="adm-eylem"><button type="submit" class="btn-primary" aria-expanded="false">Değişiklikleri gözden geçir…</button></div>' +
              '<div class="adm-onay" hidden></div></form></section>'
        : "") +
      '<section class="surface" aria-labelledby="veri-tum-b"><h3 id="veri-tum-b">Tüm alanlar</h3><dl class="adm-dl adm-veri-dl">' +
        (v.saltOkunur ? sut : diger).map(function (s) {
          var x = r[s.ad], uzun = typeof x === "string" && x.length > 120;
          return '<div class="' + (uzun ? "adm-dl-genis" : "") + '"><dt>' + esc(s.ad) + "</dt><dd>" +
            (uzun ? '<details class="adm-ayrinti"><summary>' + esc(kisalt(x, 80)) + "</summary><pre>" + esc(ayrintiMetni(x)) + "</pre></details>" : '<span class="adm-kir">' + esc(hucreMetni(x, 200)) + "</span>") +
            "</dd></div>";
        }).join("") + "</dl></section>";
  }
  function veriKaydet(e) {
    var f = e.target.closest(".adm-veri-form"); if (!f) return;
    e.preventDefault();
    var t = veriTablo(), sec = S.veri.secili; if (!t || !sec || !sec.satir) return;
    var yeni = {};
    Array.prototype.forEach.call(f.querySelectorAll("[name]"), function (el) {
      var v = el.value;
      var s = t.sutunlar.filter(function (x) { return x.ad === el.name; })[0];
      if (s && s.kural && s.kural.tur === "json") { try { v = JSON.stringify(JSON.parse(v)); } catch (err) { /* sunucu doğrular */ } }
      yeni[el.name] = v;
    });
    var orijinal = {};
    Object.keys(yeni).forEach(function (k) {
      var o = sec.satir[k], s = t.sutunlar.filter(function (x) { return x.ad === k; })[0];
      if (s && s.kural && s.kural.tur === "json" && typeof o === "string") { try { o = JSON.stringify(JSON.parse(o)); } catch (err) { /* */ } }
      orijinal[k] = o;
    });
    var fark = farkHesapla(orijinal, yeni), h = $("#veri-hata", f);
    if (!fark.length) { h.textContent = "Değişiklik yok."; h.hidden = false; return; }
    h.hidden = true;
    var tetik = f.querySelector("[type=submit]"), kap = $(".adm-onay", f);
    onayAc(kap, tetik, {
      baslik: t.ad + " #" + sec.id + ": " + fark.length + " alan değişecek. Onaylıyor musun?",
      metin: "Değişiklik denetim kaydına önceki ve sonraki değerleriyle yazılır.",
      onayMetni: "Evet, kaydet",
      onayla: function () {
        var degisiklikler = {}, onceki = {};
        fark.forEach(function (x) { degisiklikler[x.alan] = x.sonra; onceki[x.alan] = sec.satir[x.alan]; });
        return api("/api/admin/veri/" + encodeURIComponent(t.ad) + "/" + encodeURIComponent(sec.id), "PUT", { degisiklikler: degisiklikler, onceki: onceki }).then(function (r) {
          bildir(t.ad + " #" + sec.id + " güncellendi (" + (r.degisen || []).join(", ") + ").", "ok");
          veriSatirAc(sec.id);
          veriYukle();
        });
      }
    });
    // Fark önizlemesi onay kutusunun içine
    var ic = $(".adm-onay-ic", kap);
    if (ic) {
      var tablo = document.createElement("div");
      tablo.className = "adm-tablo-kap";
      tablo.innerHTML = '<table class="adm-tablo adm-fark"><caption class="visually-hidden">Değişiklik önizlemesi</caption><thead><tr><th scope="col">Alan</th><th scope="col">Önce</th><th scope="col">Sonra</th></tr></thead><tbody>' +
        fark.map(function (x) { return "<tr><td><code class=\"adm-kod\">" + esc(x.alan) + '</code></td><td class="is-once adm-kir">' + esc(hucreMetni(x.once, 300)) + '</td><td class="is-sonra adm-kir">' + esc(hucreMetni(x.sonra === "" ? null : x.sonra, 300)) + "</td></tr>"; }).join("") +
        "</tbody></table>";
      ic.insertBefore(tablo, $(".adm-onay-hata", ic));
    }
  }

  /* ------------------------------------------------------------------------
     13. ÇEKMECE (sağdan kayan ayrıntı paneli; Escape/arka plan kapatır, odak içeride kalır)
     ------------------------------------------------------------------------ */
  var cek = null;
  function cekmeceAcik() { return !!(cek && !cek.el.hidden); }
  function cekmeceAc(baslik, govdeHtml, tetik, kapaninca) {
    if (!cek) {
      var arka = document.createElement("div");
      arka.className = "adm-cekmece-arka"; arka.hidden = true;
      var el = document.createElement("div");
      el.className = "adm-cekmece"; el.hidden = true;
      el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "adm-cek-baslik");
      el.innerHTML = '<div class="adm-cekmece-ust"><h2 id="adm-cek-baslik" tabindex="-1"></h2>' +
        '<button type="button" class="adm-ikon-dugme" data-cek-kapat aria-label="Kapat">' + ikon("kapat") + "</button></div>" +
        '<div class="adm-cekmece-govde"></div>';
      document.body.appendChild(arka); document.body.appendChild(el);
      cek = { el: el, arka: arka, govde: $(".adm-cekmece-govde", el), baslik: $("#adm-cek-baslik", el), tetik: null, kapaninca: null, zaman: null };
      arka.addEventListener("click", function () { cekmeceKapat(); });
      el.addEventListener("click", function (e) { if (e.target.closest("[data-cek-kapat]")) cekmeceKapat(); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); cekmeceKapat(); return; }
        if (e.key !== "Tab") return;
        var odak = Array.prototype.filter.call(el.querySelectorAll('button:not([disabled]), [href], textarea, input, select, [tabindex]:not([tabindex="-1"])'), function (x) { return x.offsetParent !== null; });
        if (!odak.length) return;
        var ilk = odak[0], son = odak[odak.length - 1];
        if (e.shiftKey && (document.activeElement === ilk || document.activeElement === cek.baslik)) { e.preventDefault(); son.focus(); }
        else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
      });
    }
    clearTimeout(cek.zaman);
    cek.tetik = tetik || document.activeElement; cek.kapaninca = kapaninca || null;
    cek.baslik.textContent = baslik;
    cek.govde.innerHTML = govdeHtml;
    cek.el.hidden = false; cek.arka.hidden = false;
    document.documentElement.classList.add("adm-kilit");
    requestAnimationFrame(function () { requestAnimationFrame(function () { cek.el.classList.add("is-acik"); cek.arka.classList.add("is-acik"); }); });
    cek.baslik.focus();
    return cek;
  }
  function cekmeceKapat() {
    if (!cekmeceAcik()) return;
    cek.el.classList.remove("is-acik"); cek.arka.classList.remove("is-acik");
    document.documentElement.classList.remove("adm-kilit");
    var c = cek;
    c.zaman = setTimeout(function () { c.el.hidden = true; c.arka.hidden = true; c.govde.innerHTML = ""; }, 220);
    var t = c.tetik; c.tetik = null;
    if (c.kapaninca) { var f = c.kapaninca; c.kapaninca = null; f(); }
    if (t && document.body.contains(t)) t.focus();
  }

  /* ------------------------------------------------------------------------
     14. SİSTEM (loglar + sağlık)
     ------------------------------------------------------------------------ */
  function seviyeCip(sv) {
    return '<span class="adm-seviye is-' + esc(sv) + '">' + ikon(SEVIYE[sv] ? sv : "bilgi") + "<span>" + esc(seviyeAd(sv)) + "</span></span>";
  }
  function logDurumRozet(d) { return rozet(logDurumAd(d), d === "yeni" ? "info" : d === "cozuldu" ? "ok" : "mor"); }

  function panelSistemKur() {
    var p = $("#panel-sistem");
    var cip = function (deger, ad) {
      return '<button type="button" class="adm-cip' + (deger ? " is-" + deger : "") + '" data-seviye="' + deger + '" aria-pressed="' + (S.sis.seviye === deger ? "true" : "false") + '">' +
        (deger ? ikon(deger) : "") + "<span>" + esc(ad) + '</span><span class="adm-cip-sayi" data-cip-sayi="' + (deger || "tum") + '"></span></button>';
    };
    p.innerHTML =
      '<div class="adm-panel-ust"><div class="adm-min0"><h2>Sistem</h2>' +
        '<p class="adm-ipucu">Sunucu sağlığı, kuyruklar, bakım modu, IP engelleri ve hata logları. Bu sekme açıkken 30 saniyede bir kendiliğinden yenilenir.</p></div>' +
        '<div class="adm-eylem"><span class="adm-canli" id="sis-guncel"></span>' +
          '<button type="button" class="btn-ghost adm-ikonlu" data-yenile>' + ikon("yenile") + "<span>Yenile</span></button></div></div>" +
      '<div id="sis-saglik">' + iskelet("saglik", 8) + "</div>" +
      '<div id="sis-ops" class="adm-ops"></div>' +
      '<h3 class="adm-sis-alt-baslik">Loglar</h3>' +
      '<div id="sis-ozet"></div>' +
      '<form class="adm-arac adm-arac-genis adm-log-filtre" role="search" aria-label="Log filtreleri" novalidate>' +
        '<div class="adm-cip-grup" role="group" aria-label="Seviye">' + cip("", "Tümü") + cip("hata", "Hata") + cip("uyari", "Uyarı") + cip("bilgi", "Bilgi") + "</div>" +
        '<div class="field adm-field-dar"><label for="sis-kaynak">Kaynak</label><select id="sis-kaynak" class="text-input"><option value="">Tümü</option>' +
          Object.keys(KAYNAK).map(function (k) { return '<option value="' + k + '">' + esc(KAYNAK[k]) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field adm-field-dar"><label for="sis-durum">Durum</label><select id="sis-durum" class="text-input">' +
          '<option value="yeni">Yeni</option><option value="acik">Açık (yeni + incelendi)</option><option value="incelendi">İncelendi</option><option value="cozuldu">Çözüldü</option><option value="">Tümü</option></select></div>' +
        '<div class="field adm-field-esnek"><label for="sis-q">Ara</label><input type="search" id="sis-q" class="text-input" placeholder="Mesaj, yol, hata kodu…" autocomplete="off" maxlength="100"></div>' +
      "</form>" +
      '<div class="adm-toplu" id="sis-toplu" role="region" aria-label="Toplu işlem" hidden><span class="adm-toplu-sayi" aria-live="polite"></span>' +
        '<div class="adm-eylem"><button type="button" class="btn-ghost btn-sm" data-toplu="incelendi">İncelendi</button>' +
        '<button type="button" class="btn-primary btn-sm" data-toplu="cozuldu">Çözüldü</button>' +
        '<button type="button" class="btn-ghost btn-sm" data-toplu="yeni">Yeniden aç</button>' +
        '<button type="button" class="btn-ghost btn-sm" data-toplu-temizle>Seçimi kaldır</button></div></div>' +
      '<p class="adm-sonuc" id="sis-sonuc" aria-live="polite"></p>' +
      '<div class="adm-log-liste"></div><div class="adm-log-sayfa"></div>';

    $("#sis-ops").addEventListener("click", function (e) { e.stopPropagation(); opsTik(e); });
    $("#sis-ops").addEventListener("submit", opsGonder);
    var zaman = null;
    $("#sis-q").addEventListener("input", function (e) {
      clearTimeout(zaman);
      var v = e.target.value.trim();
      zaman = setTimeout(function () { if (v !== S.sis.q) { S.sis.q = v; S.sis.sayfa = 1; logYukle(); } }, 350);
    });
    $("form", p).addEventListener("submit", function (e) { e.preventDefault(); clearTimeout(zaman); S.sis.q = $("#sis-q").value.trim(); S.sis.sayfa = 1; logYukle(); });
    $("#sis-kaynak").addEventListener("change", function (e) { S.sis.kaynak = e.target.value; S.sis.sayfa = 1; logYukle(); });
    $("#sis-durum").addEventListener("change", function (e) { S.sis.durum = e.target.value; S.sis.sayfa = 1; logYukle(); });
    p.addEventListener("change", function (e) {
      var c = e.target.closest("[data-sec]");
      if (c) { if (c.checked) S.sis.secili[c.getAttribute("data-sec")] = true; else delete S.sis.secili[c.getAttribute("data-sec")]; topluGuncelle(); return; }
      if (e.target.closest("[data-sec-hepsi]")) {
        var acik = e.target.checked;
        p.querySelectorAll("[data-sec]").forEach(function (x) { x.checked = acik; if (acik) S.sis.secili[x.getAttribute("data-sec")] = true; else delete S.sis.secili[x.getAttribute("data-sec")]; });
        topluGuncelle();
      }
    });
    p.addEventListener("click", function (e) {
      if (e.target.closest("[data-yenile]")) { sistemYukle(); return; }
      if (e.target.closest("[data-tekrar]")) { logYukle(); return; }
      var cb = e.target.closest("[data-seviye]");
      if (cb) {
        S.sis.seviye = cb.getAttribute("data-seviye"); S.sis.sayfa = 1;
        p.querySelectorAll("[data-seviye]").forEach(function (x) { x.setAttribute("aria-pressed", x === cb ? "true" : "false"); });
        logYukle(); return;
      }
      var sb = e.target.closest("[data-sayfa]");
      if (sb && !sb.disabled) { S.sis.sayfa = Number(sb.getAttribute("data-sayfa")); logYukle().then(function () { $("#sis-sonuc").focus(); }); return; }
      var tb = e.target.closest("[data-toplu]");
      if (tb) { topluIslem(tb.getAttribute("data-toplu"), tb); return; }
      if (e.target.closest("[data-toplu-temizle]")) { S.sis.secili = {}; p.querySelectorAll("[data-sec],[data-sec-hepsi]").forEach(function (x) { x.checked = false; }); topluGuncelle(); return; }
      var la = e.target.closest("[data-log-ac]");
      if (la) { logAc(la.getAttribute("data-log-ac"), la); return; }
      var tr = e.target.closest("tr[data-log]");
      if (tr && !e.target.closest("a,button,input,label")) logAc(tr.getAttribute("data-log"), tr.querySelector("[data-log-ac]"));
    });
  }

  function topluGuncelle() {
    var n = Object.keys(S.sis.secili).length, kap = $("#sis-toplu");
    if (!kap) return;
    kap.hidden = n === 0;
    $(".adm-toplu-sayi", kap).textContent = n ? sayi(n) + " kayıt seçildi" : "";
    var hepsi = $("[data-sec-hepsi]");
    if (hepsi) {
      var tumu = document.querySelectorAll("#panel-sistem [data-sec]"), secik = document.querySelectorAll("#panel-sistem [data-sec]:checked");
      hepsi.checked = tumu.length > 0 && secik.length === tumu.length;
      hepsi.indeterminate = secik.length > 0 && secik.length < tumu.length;
    }
  }

  function sistemYukle(sessiz) {
    if (!$("#panel-sistem .adm-log-liste")) return Promise.resolve(); // panel kurulmadı ya da sayfa değişti
    return Promise.all([saglikYukle(sessiz), logYukle(sessiz)]).then(function () {
      S.sis.sonGuncelleme = Date.now();
      var g = $("#sis-guncel");
      if (g) g.textContent = "Güncellendi " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    });
  }

  function saglikKart(o) {
    var etiket = o.ton === "bad" ? "Sorun" : o.ton === "warn" ? "Dikkat" : o.ton === "ok" ? "İyi" : "";
    return '<li class="adm-saglik-kart is-' + (o.ton || "notr") + '">' +
      '<span class="adm-saglik-ust"><span class="adm-saglik-ikon">' + ikon(o.ikon) + '</span><span class="adm-saglik-etiket">' + esc(o.etiket) + "</span></span>" +
      '<span class="adm-saglik-deger">' + esc(o.deger) + "</span>" +
      (o.alt ? '<span class="adm-saglik-alt">' + o.alt + "</span>" : "") +
      (etiket ? '<span class="adm-saglik-durum">' + esc(etiket) + "</span>" : "") +
      "</li>";
  }
  function saglikYukle(sessiz) {
    var kap = $("#sis-saglik"), oz = $("#sis-ozet"), no = ++S.sis.ozetIstek;
    if (!sessiz && !kap.querySelector(".adm-saglik-kart:not(.adm-isk-kart)")) kap.innerHTML = iskelet("saglik", 8);
    return Promise.all([api("/api/admin/loglar/ozet"), api("/api/admin/sistem").catch(function () { return null; })]).then(function (r) {
      if (no !== S.sis.ozetIstek) return;
      var v = r[0], sys = r[1];
      var sg = v.saglik || {}, ep = sg.eposta || {}, z = sg.zamanlayici, y = sg.sonYedek, b = sg.bellek || {};
      if (sys) { S.ops.son = sys; y = sys.yedek && sys.yedek.son; }
      var yd = yedekDurumu(y);
      var zTon = "ok", zDeger, zAlt;
      if (!z || !z.acik) { zTon = "warn"; zDeger = "Kapalı"; zAlt = "ZAMANLAYICI=0: hatırlatmalar ve log temizliği çalışmaz."; }
      else if (!z.sonCalisma) { zDeger = "Bekliyor"; zAlt = "İlk çalışma birkaç dakika içinde. Aralık: " + esc(sayi(z.aralikDk)) + " dk"; zTon = "notr"; }
      else {
        zDeger = goreceZaman(z.sonCalisma);
        var gec = saatFarki(z.sonCalisma) * 60 > (Number(z.aralikDk) || 10) * 3;
        zTon = gec ? "warn" : "ok";
        zAlt = esc(tarih(z.sonCalisma)) + " · " + esc(sayi(z.sonSureMs)) + " ms" + (gec ? " · gecikti" : "");
      }
      if (z && z.sonHata) { zTon = "bad"; zAlt = (zAlt ? zAlt + "<br>" : "") + "Son hata: " + esc(z.sonHata.is) + " · " + esc(goreceZaman(z.sonHata.zaman)); }
      var kartlar = "";
      if (sys) {
        var bl = sys.bellek || {}, od = sys.olayDongusu, dk = sys.disk, ist = sys.istek || {}, ot = sys.oturum || {}, vt = sys.veritabani || {}, kq = (sys.kuyruk || {}).eposta || {};
        var heapOran = bl.heapToplam ? bl.heapKullanilan / bl.heapToplam : 0;
        var odTon = !od ? "notr" : od.p99Ms > 500 ? "bad" : od.p99Ms > 100 ? "warn" : "ok";
        var diskOran = dk && dk.toplam ? dk.bos / dk.toplam : null;
        var hataOran = Number(ist.hataOrani5dk) || 0;
        kartlar =
          saglikKart({ etiket: "Çalışma süresi", ikon: "saat", deger: sureMetni(sys.calismaSn), alt: "Sürüm " + esc(sys.surum || "—") + " · Node " + esc(sys.node || "—") + "<br>Başlangıç: " + esc(tarih(sys.baslangic)), ton: "ok" }) +
          saglikKart({ etiket: "Bellek", ikon: "cpu", deger: boyutMetni(bl.rss), alt: "Heap " + esc(boyutMetni(bl.heapKullanilan)) + " / " + esc(boyutMetni(bl.heapToplam)) + cubukHtml(heapOran, "Heap kullanımı"), ton: heapOran > 0.9 ? "warn" : "ok" }) +
          saglikKart({ etiket: "Olay döngüsü", ikon: "hiz", deger: od ? sayi(od.p99Ms) + " ms" : "—", alt: od ? "p99 gecikme · ort. " + esc(sayi(od.ortalamaMs)) + " ms · en çok " + esc(sayi(od.enCokMs)) + " ms" : "Ölçüm başlıyor", ton: odTon }) +
          saglikKart({ etiket: "CPU yükü", ikon: "nabiz", deger: sys.cpu && sys.cpu.yuk ? sys.cpu.yuk.map(function (x) { return x.toLocaleString("tr-TR"); }).join(" · ") : "—",
            alt: sys.cpu && sys.cpu.yuk ? "1 / 5 / 15 dk ortalama · " + esc(sayi(sys.cpu.cekirdek)) + " çekirdek" : "Bu işletim sisteminde yük ortalaması yok · " + esc(sayi(sys.cpu && sys.cpu.cekirdek)) + " çekirdek",
            ton: sys.cpu && sys.cpu.yuk && sys.cpu.cekirdek && sys.cpu.yuk[0] > sys.cpu.cekirdek ? "warn" : "notr" }) +
          saglikKart({ etiket: "Veritabanı", ikon: "disk", deger: boyutMetni(vt.boyut), alt: "WAL: " + esc(vt.walBoyut == null ? "—" : boyutMetni(vt.walBoyut)) + " · " + esc(vt.dosya || ""), ton: vt.walBoyut > 64 * 1048576 ? "warn" : "notr" }) +
          saglikKart({ etiket: "Disk (veri klasörü)", ikon: "disk", deger: dk ? boyutMetni(dk.bos) + " boş" : "—", alt: dk ? "Toplam " + esc(boyutMetni(dk.toplam)) + cubukHtml(1 - diskOran, "Disk doluluğu") : "Ölçülemedi", ton: diskOran == null ? "notr" : diskOran < 0.05 ? "bad" : diskOran < 0.1 ? "warn" : "ok" }) +
          saglikKart({ etiket: "API istek / dk", ikon: "grafik", deger: sayi(ist.dakikada), alt: "5xx oranı (5 dk): " + esc(oranMetni(hataOran)) + (ist.ortSureMs != null ? " · ort. " + esc(sayi(ist.ortSureMs)) + " ms" : "") +
            miniCubuklar((ist.seri || []).map(function (x) { return x.istek; }), "Son 15 dakika istek sayısı"), ton: hataOran > 0.05 ? "bad" : hataOran > 0.01 ? "warn" : "ok" }) +
          saglikKart({ etiket: "Kullanıcılar şu an", ikon: "kullanicilar", deger: sayi(ot.cevrimici) + " çevrimiçi", alt: "Son 30 dk: " + esc(sayi(ot.yakin)) + " · açık oturum: " + esc(sayi(ot.aktif)), ton: "notr" }) +
          saglikKart({ etiket: "Son yedek", ikon: "yedek", deger: yd === "yok" ? "Bulunamadı" : goreceZaman(y.zaman),
            alt: yd === "yok" ? "Henüz yedek yok. Aşağıdan \"Yedek al\"." : esc(tarih(y.zaman)) + " · " + esc(boyutMetni(y.boyut)) + (yd === "eski" ? " · 36 saatten eski" : ""), ton: yd === "ok" ? "ok" : "warn" }) +
          saglikKart({ etiket: "E-posta kuyruğu", ikon: "posta", deger: sayi(kq.bekleyen) + " bekleyen",
            alt: (kq.smtp ? "SMTP açık" : "SMTP ayarlı değil (yalnızca kuyruk)") + " · " + esc(sayi(kq.hata)) + " hatalı · 24 sa gönderilen " + esc(sayi(kq.gonderilen24s)),
            ton: Number(kq.hata) ? "bad" : !kq.smtp ? "warn" : Number(kq.bekleyen) > 20 ? "warn" : "ok" }) +
          saglikKart({ etiket: "Zamanlayıcı", ikon: "nabiz", deger: zDeger, alt: zAlt, ton: zTon });
        bakimSeridiCiz(sys.bakim);
      } else {
        kartlar =
          saglikKart({ etiket: "Çalışma süresi", ikon: "saat", deger: sureMetni(sg.calismaSn), alt: "Başlangıç: " + esc(tarih(sg.baslangic)) + " · Node " + esc(sg.node || "—"), ton: "ok" }) +
          saglikKart({ etiket: "Veritabanı", ikon: "disk", deger: boyutMetni(sg.dbBoyut), alt: "Bellek (RSS): " + esc(boyutMetni(b.rss)) + " · heap " + esc(boyutMetni(b.heapKullanilan)), ton: "notr" }) +
          saglikKart({ etiket: "Son yedek", ikon: "yedek", deger: yd === "yok" ? "Bulunamadı" : goreceZaman(y.zaman),
            alt: yd === "yok" ? "DATA_DIR/yedekler boş. <code class=\"adm-kod\">npm run yedek</code> ile alın." : esc(tarih(y.zaman)) + " · " + esc(boyutMetni(y.boyut)) + (yd === "eski" ? " · 36 saatten eski" : ""),
            ton: yd === "ok" ? "ok" : "warn" }) +
          saglikKart({ etiket: "E-posta kuyruğu", ikon: "posta", deger: sayi(ep.bekleyen) + " bekleyen",
            alt: (ep.smtp ? "SMTP açık" : "SMTP ayarlı değil (yalnızca kuyruk)") + (Number(ep.hatali24s) ? " · son 24 sa " + esc(sayi(ep.hatali24s)) + " gönderilemedi" : ""),
            ton: Number(ep.hatali24s) ? "bad" : !ep.smtp ? "warn" : Number(ep.bekleyen) > 20 ? "warn" : "ok" }) +
          saglikKart({ etiket: "Zamanlayıcı", ikon: "nabiz", deger: zDeger, alt: zAlt, ton: zTon });
      }
      kap.innerHTML = '<ul class="adm-saglik">' + kartlar + "</ul>";
      // Operasyon kartları: ilk yüklemede ve elle yenilemede çizilir; sessiz yenilemede formlar bozulmasın diye yalnızca odak dışındayken
      var ops = $("#sis-ops");
      if (ops && sys && (!sessiz || !ops.contains(document.activeElement))) opsCiz(sys);
      // Son 24 saat / 7 gün sayıları + 7 günlük hata/uyarı çubukları
      var s24 = v.son24s || {}, s7 = v.son7g || {}, gun = Array.isArray(v.gunluk) ? v.gunluk : [];
      var enCok = Math.max.apply(null, [1].concat(gun.map(function (d) { return (Number(d.hata) || 0) + (Number(d.uyari) || 0); })));
      var sayiKutu = function (sv, ad) {
        return '<div class="adm-sayi-kutu is-' + sv + '">' + ikon(sv) + '<span class="adm-sayi-kutu-d">' + esc(sayi(s24[sv] || 0)) + '</span><span class="adm-sayi-kutu-e">' + esc(ad) + " · 24 sa</span>" +
          '<span class="adm-sayi-kutu-a">7 gün: ' + esc(sayi(s7[sv] || 0)) + "</span></div>";
      };
      oz.innerHTML = '<div class="adm-sis-ozet surface">' +
        '<div class="adm-sayi-kutular">' + sayiKutu("hata", "Hata") + sayiKutu("uyari", "Uyarı") + sayiKutu("bilgi", "Bilgi") + "</div>" +
        (gun.length ? '<figure class="adm-gunluk-grafik"><figcaption>Son 7 gün · hata ve uyarı</figcaption>' +
          '<div class="adm-gunluk-cubuklar" role="img" aria-label="' + esc("Son 7 gün: " + gun.map(function (d) { return gunTarih(d.gun) + " " + sayi(d.hata) + " hata, " + sayi(d.uyari) + " uyarı"; }).join("; ")) + '">' +
          gun.map(function (d) {
            var h = Number(d.hata) || 0, u = Number(d.uyari) || 0;
            return '<div class="adm-gunluk-sutun" title="' + esc(gunTarih(d.gun) + ": " + h + " hata, " + u + " uyarı") + '"><div class="adm-gunluk-yigin">' +
              '<span class="is-uyari" style="height:' + Math.round((u / enCok) * 100) + '%"></span><span class="is-hata" style="height:' + Math.round((h / enCok) * 100) + '%"></span></div>' +
              '<span class="adm-gunluk-gun">' + esc(new Date(d.gun + "T12:00:00Z").toLocaleDateString("tr-TR", { weekday: "short" })) + "</span></div>";
          }).join("") + "</div>" +
          '<div class="adm-lejant"><span><i class="is-hata"></i>Hata</span><span><i class="is-uyari"></i>Uyarı</span></div></figure>' : "") +
        "</div>";
      var yeni = v.yeni || {};
      sistemSayac(yeni.hata, yeni.uyari);
      ["hata", "uyari", "bilgi"].forEach(function (sv) {
        var el = $('[data-cip-sayi="' + sv + '"]');
        if (el) { var n = Number(yeni[sv]) || 0; el.textContent = n ? sayi(n) : ""; el.title = n ? sayi(n) + " yeni" : ""; }
      });
    }).catch(function (e) {
      if (no === S.sis.ozetIstek && !sessiz) kap.innerHTML = hataKutusu(e.message);
    });
  }
  /** İnce doluluk çubuğu (0–1) */
  function cubukHtml(oran, etiket) {
    var o = Math.max(0, Math.min(1, Number(oran) || 0));
    return '<span class="adm-doluluk" role="img" aria-label="' + esc(etiket + ": %" + Math.round(o * 100)) + '"><span style="width:' + Math.round(o * 100) + '%"' + (o > 0.9 ? ' class="is-dolu"' : "") + "></span></span>";
  }

  /* --- Operasyon kartları: bakım, önbellek, kuyruk, zamanlayıcı, yedek, IP engelleri ---------- */
  function opsCiz(sys) {
    var ops = $("#sis-ops"); if (!ops) return;
    var bk = sys.bakim || {}, ob = sys.onbellek || {}, kq = (sys.kuyruk || {}).eposta || {}, pu = (sys.kuyruk || {}).push || {}, zm = sys.zamanlayici || {}, yd = sys.yedek || {};
    var isabetOran = (ob.isabet + ob.iska) ? ob.isabet / (ob.isabet + ob.iska) : null;
    var yerel = function (iso) { if (!iso) return ""; var d = new Date(iso); if (isNaN(d)) return ""; var p = function (n) { return String(n).padStart(2, "0"); }; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()); };
    var hiz = sys.hizSinirlari || {}, HIZ_AD = { giris: "Giriş", kayit: "Kayıt", sifre: "Şifre sıfırlama", soru: "Soru", hataRaporu: "Hata raporu" };
    ops.innerHTML =
      '<section class="surface adm-ops-kart adm-ops-bakim' + (bk.acik ? " is-acik" : "") + '" id="ops-bakim" aria-labelledby="ops-bakim-b">' +
        '<div class="adm-bolum-ust"><h3 id="ops-bakim-b" class="adm-ikonlu">' + ikon("bakim") + "<span>Bakım modu</span></h3>" + rozet(bk.acik ? "Açık" : "Kapalı", bk.acik ? "warn" : "ok") + "</div>" +
        '<p class="adm-alt">' + (bk.acik ? "Ziyaretçiler ve öğrenciler bakım sayfasını görüyor (HTTP 503); yöneticiler siteyi normal kullanır. Başlangıç: " + esc(tarih(bk.baslangic)) + "."
          : "Açınca yönetici olmayan herkes bakım sayfasını görür; API 503 döner. Giriş ve yönetici paneli açık kalır.") + "</p>" +
        '<form class="adm-ops-form" data-ops-form="bakim" novalidate>' +
          '<div class="field"><label for="bk-mesaj">Mesaj <span class="adm-alt">(isteğe bağlı, bakım sayfasında görünür)</span></label>' +
            '<textarea id="bk-mesaj" name="mesaj" class="text-input adm-not" rows="2" maxlength="500" placeholder="Ör. Yeni özellikler ekliyoruz, 30 dakika içinde döneceğiz.">' + esc(bk.mesaj || "") + "</textarea></div>" +
          '<div class="field"><label for="bk-bitis">Planlanan bitiş <span class="adm-alt">(isteğe bağlı)</span></label><input id="bk-bitis" name="bitis" type="datetime-local" class="text-input" value="' + esc(yerel(bk.bitis)) + '"></div>' +
          '<p class="adm-onay-hata" role="alert" hidden></p>' +
          '<div class="adm-eylem">' + (bk.acik
            ? '<button type="submit" class="btn-ghost" data-bakim="guncelle">Mesajı güncelle</button><button type="submit" class="btn-primary" data-bakim="kapat">Bakımı kapat</button>'
            : '<button type="submit" class="btn-primary adm-tehlike" data-bakim="ac" aria-expanded="false">' + ikon("bakim") + "Bakıma al…</button>") + "</div>" +
          '<div class="adm-onay" hidden></div>' +
        "</form></section>" +

      '<section class="surface adm-ops-kart" aria-labelledby="ops-kuyruk-b"><div class="adm-bolum-ust"><h3 id="ops-kuyruk-b" class="adm-ikonlu">' + ikon("kuyruk") + "<span>Kuyruklar</span></h3></div>" +
        '<dl class="adm-dl adm-dl-sik">' +
          "<div><dt>E-posta bekleyen</dt><dd>" + esc(sayi(kq.bekleyen)) + "</dd></div>" +
          "<div><dt>Hatalı</dt><dd>" + (Number(kq.hata) ? rozet(sayi(kq.hata), "bad") : "0") + "</dd></div>" +
          "<div><dt>Gönderilen (24 sa)</dt><dd>" + esc(sayi(kq.gonderilen24s)) + "</dd></div>" +
          "<div><dt>SMTP</dt><dd>" + (kq.smtp ? rozet("Açık", "ok") : rozet("Ayarlı değil", "warn")) + "</dd></div>" +
          "<div><dt>Push aboneliği</dt><dd>" + esc(sayi(pu.abonelik)) + ' <span class="adm-alt">(' + esc(sayi(pu.kullanici)) + " kişi)</span></dd></div>" +
        "</dl>" +
        '<div class="adm-eylem"><button type="button" class="btn-primary btn-sm" data-ops="eposta-isle"' + (kq.smtp ? "" : ' disabled title="SMTP ayarlı değil"') + ">Kuyruğu şimdi işle</button>" +
          '<button type="button" class="btn-ghost btn-sm" data-ops="eposta-liste" data-durum="' + (Number(kq.hata) ? "hata" : "bekleyen") + '">Kuyruğu görüntüle</button></div>' +
      "</section>" +

      '<section class="surface adm-ops-kart" aria-labelledby="ops-onbellek-b"><div class="adm-bolum-ust"><h3 id="ops-onbellek-b" class="adm-ikonlu">' + ikon("hiz") + "<span>Önbellek ve hız sınırları</span></h3></div>" +
        '<dl class="adm-dl adm-dl-sik">' +
          "<div><dt>Sayfa önbelleği</dt><dd>" + esc(sayi(ob.girdi)) + " sayfa · " + esc(boyutMetni(ob.bayt)) + "</dd></div>" +
          "<div><dt>İsabet oranı</dt><dd>" + esc(isabetOran == null ? "—" : oranMetni(isabetOran)) + ' <span class="adm-alt">(' + esc(sayi(ob.isabet)) + " / " + esc(sayi(ob.iska)) + " ıska)</span></dd></div>" +
          "<div><dt>Son temizleme</dt><dd>" + (ob.sonTemizleme ? zamanHucre(ob.sonTemizleme) : '<span class="adm-alt">Hiç</span>') + "</dd></div>" +
          '<div class="adm-dl-genis"><dt>Hız sınırlayıcılar (izlenen anahtar)</dt><dd class="adm-rozetler">' + Object.keys(hiz).map(function (k) { return rozet((HIZ_AD[k] || k) + ": " + sayi(hiz[k]), "notr"); }).join("") + "</dd></div>" +
        "</dl>" +
        '<div class="adm-eylem"><button type="button" class="btn-ghost btn-sm" data-ops="onbellek" aria-expanded="false">Önbelleği temizle</button></div><div class="adm-onay" hidden></div>' +
      "</section>" +

      '<section class="surface adm-ops-kart" aria-labelledby="ops-yedek-b"><div class="adm-bolum-ust"><h3 id="ops-yedek-b" class="adm-ikonlu">' + ikon("yedek") + "<span>Yedek</span></h3></div>" +
        '<dl class="adm-dl adm-dl-sik">' +
          "<div><dt>Son yedek</dt><dd>" + (yd.son ? zamanHucre(yd.son.zaman) + ' <span class="adm-alt">' + esc(boyutMetni(yd.son.boyut)) + "</span>" : '<span class="adm-alt">Yok</span>') + "</dd></div>" +
          "<div><dt>Saklanan</dt><dd>" + esc(sayi(yd.adet)) + " / " + esc(sayi(yd.sakla || 14)) + "</dd></div>" +
        "</dl>" +
        '<p class="adm-alt">Çalışan sunucuyu durdurmadan DATA_DIR/yedekler klasörüne alınır; en yeni 14 yedek tutulur. Sunucu dışına kopyalamayı unutma.</p>' +
        '<div class="adm-eylem"><button type="button" class="btn-primary btn-sm" data-ops="yedek">Yedek al</button></div>' +
      "</section>" +

      '<section class="surface adm-ops-kart adm-ops-genis" aria-labelledby="ops-zm-b"><div class="adm-bolum-ust"><h3 id="ops-zm-b" class="adm-ikonlu">' + ikon("saat") + "<span>Zamanlayıcı işleri</span></h3>" +
        rozet(zm.acik ? "Açık · " + sayi(zm.aralikDk) + " dk" : "Kapalı", zm.acik ? "ok" : "warn") + "</div>" +
        '<div class="adm-tablo-kap"><table class="adm-tablo adm-kartlas"><caption class="visually-hidden">Zamanlayıcı işleri</caption>' +
          '<thead><tr><th scope="col">İş</th><th scope="col">Son çalışma</th><th scope="col" class="adm-sag">Süre</th><th scope="col">Sonuç</th><th scope="col"><span class="visually-hidden">İşlem</span></th></tr></thead><tbody>' +
          (zm.isler || []).map(function (i) {
            var sonuc = i.hata ? '<span class="adm-seviye is-hata">' + ikon("hata") + "<span>" + esc(kisalt(i.hata, 80)) + "</span></span>"
              : i.sonuc == null ? '<span class="adm-alt">—</span>' : '<code class="adm-kod">' + esc(kisalt(typeof i.sonuc === "object" ? JSON.stringify(i.sonuc) : String(i.sonuc), 80)) + "</code>";
            return "<tr><td data-label=\"İş\"><strong>" + esc(i.baslik) + "</strong></td>" +
              '<td data-label="Son çalışma" class="adm-nowrap">' + zamanHucre(i.sonCalisma) + "</td>" +
              '<td data-label="Süre" class="adm-sag">' + (sayiMi(i.sureMs) ? esc(sayi(i.sureMs)) + " ms" : "—") + "</td>" +
              '<td data-label="Sonuç">' + sonuc + "</td>" +
              '<td data-label="İşlem"><button type="button" class="btn-ghost btn-sm" data-ops="zamanlayici" data-is="' + esc(i.ad) + '">Şimdi çalıştır</button></td></tr>';
          }).join("") + "</tbody></table></div>" +
        '<p class="adm-alt">Hatırlatma ve veli raporu kendi kurallarına uyar: sessiz saatlerde (22:00–08:00) gönderilmez, kişi başına günde en fazla bir kez.</p>' +
      "</section>" +

      '<section class="surface adm-ops-kart adm-ops-genis" id="ops-ip" aria-labelledby="ops-ip-b"><div class="adm-bolum-ust"><h3 id="ops-ip-b" class="adm-ikonlu">' + ikon("kalkan") + "<span>IP engel listesi</span></h3></div>" +
        '<div id="ops-ip-liste">' + iskelet("tablo", 2) + "</div>" +
        '<form class="adm-ops-form adm-ip-form" data-ops-form="ip" novalidate>' +
          '<div class="field"><label for="ip-kapsam">IP ya da /24 aralığı</label><input id="ip-kapsam" name="kapsam" class="text-input" maxlength="45" placeholder="203.0.113.7 ya da 203.0.113.0/24" autocomplete="off" spellcheck="false"></div>' +
          '<div class="field"><label for="ip-neden">Neden</label><input id="ip-neden" name="neden" class="text-input" maxlength="300" placeholder="Ör. kaba kuvvet giriş denemesi"></div>' +
          '<div class="field"><label for="ip-sure">Süre</label><select id="ip-sure" name="sure" class="text-input"><option value="1g">1 gün</option><option value="7g">7 gün</option><option value="30g">30 gün</option><option value="suresiz">Süresiz</option></select></div>' +
          '<div class="adm-eylem adm-eylem-alt"><button type="submit" class="btn-primary">Engelle</button></div>' +
          '<p class="adm-onay-hata" role="alert" hidden></p>' +
        "</form>" +
        '<p class="adm-alt">Engellenen adres giriş, kayıt ve tüm API isteklerinde 403 alır (yönetici oturumları etkilenmez). Kendi IP\'ni engelleyemezsin.</p>' +
      "</section>";
    ipEngelYukle();
  }
  function ipEngelYukle() {
    var kap = $("#ops-ip-liste"); if (!kap) return Promise.resolve();
    return api("/api/admin/ip-engelleri").then(function (v) {
      var l = Array.isArray(v.engeller) ? v.engeller : [];
      kap.innerHTML = (v.sizinIp ? '<p class="adm-alt">Senin IP adresin: <code class="adm-kod adm-ip">' + esc(v.sizinIp) + "</code></p>" : "") + (l.length
        ? '<div class="adm-tablo-kap"><table class="adm-tablo adm-kartlas"><caption class="visually-hidden">Engellenen IP adresleri</caption>' +
          '<thead><tr><th scope="col">Kapsam</th><th scope="col">Neden</th><th scope="col">Bitiş</th><th scope="col">Ekleyen</th><th scope="col"><span class="visually-hidden">İşlem</span></th></tr></thead><tbody>' +
          l.map(function (x) {
            return "<tr><td data-label=\"Kapsam\"><code class=\"adm-kod adm-ip\">" + esc(x.kapsam) + "</code>" + (x.etkin ? "" : " " + rozet("süresi doldu", "notr")) + "</td>" +
              '<td data-label="Neden" class="adm-kir">' + esc(x.neden || "—") + "</td>" +
              '<td data-label="Bitiş" class="adm-nowrap">' + (x.bitis ? esc(tarih(x.bitis)) : "Süresiz") + "</td>" +
              '<td data-label="Ekleyen">' + esc(x.olusturan ? adSoyad(x.olusturan) : "—") + ' <span class="adm-alt">' + esc(gunTarih(x.olusturma)) + "</span></td>" +
              '<td data-label="İşlem"><button type="button" class="btn-ghost btn-sm" data-ip-kaldir="' + esc(x.id) + '">Engeli kaldır</button></td></tr>';
          }).join("") + "</tbody></table></div>"
        : bos("Engellenen IP adresi yok."));
    }).catch(function (e) { kap.innerHTML = hataKutusu(e.message); });
  }
  function opsTik(e) {
    var ops = e.currentTarget;
    if (e.target.closest("[data-tekrar]")) { ipEngelYukle(); return; }
    var bk = e.target.closest("[data-bakim]");
    if (bk) { var f0 = bk.closest("form"); if (f0) f0.setAttribute("data-islem", bk.getAttribute("data-bakim")); return; }
    var ik = e.target.closest("[data-ip-kaldir]");
    if (ik) {
      ik.disabled = true;
      api("/api/admin/ip-engelleri/" + encodeURIComponent(ik.getAttribute("data-ip-kaldir")), "DELETE").then(function () {
        bildir("IP engeli kaldırıldı.", "ok"); ipEngelYukle();
      }).catch(function (er) { ik.disabled = false; bildir(er.message, "bad"); });
      return;
    }
    var b = e.target.closest("[data-ops]"); if (!b) return;
    var t = b.getAttribute("data-ops");
    if (t === "onbellek") {
      onayAc(b.closest(".adm-ops-kart").querySelector(".adm-onay"), b, {
        baslik: "Sayfa önbelleği temizlensin mi?", metin: "Sayfalar bir sonraki istekte diskten yeniden okunur. Güvenli bir işlemdir; içerik güncellemesi görünmüyorsa kullanılır.",
        onayMetni: "Evet, temizle",
        onayla: function () { return api("/api/admin/sistem/onbellek-temizle", "POST", {}).then(function (r) { bildir(sayi(r.temizlenen) + " sayfa önbellekten çıkarıldı.", "ok"); saglikYukle(); }); }
      });
      return;
    }
    if (t === "eposta-liste") { epostaKuyrukAc(b.getAttribute("data-durum") || "bekleyen", b); return; }
    var eski = b.textContent;
    b.disabled = true; b.textContent = "Çalışıyor…";
    var is = null;
    if (t === "eposta-isle") is = api("/api/admin/sistem/eposta/isle", "POST", {}).then(function (r) { bildir(sayi(r.denenen) + " e-posta denendi: " + sayi(r.gonderilen) + " gönderildi" + (r.hatali ? ", " + sayi(r.hatali) + " hatalı." : "."), r.hatali ? "bad" : "ok"); });
    else if (t === "yedek") is = api("/api/admin/sistem/yedek", "POST", {}).then(function (r) { bildir("Yedek alındı: " + r.yedek.dosya + " (" + boyutMetni(r.yedek.boyut) + ", " + sayi(r.yedek.sureMs) + " ms).", "ok"); });
    else if (t === "zamanlayici") is = api("/api/admin/sistem/zamanlayici/" + encodeURIComponent(b.getAttribute("data-is")), "POST", {}).then(function (r) {
      bildir(r.calisti ? "İş çalıştırıldı" + (r.sonuc != null ? ": " + (typeof r.sonuc === "object" ? JSON.stringify(r.sonuc) : r.sonuc) : ".") : (r.neden || "İş çalıştırılmadı."), r.calisti ? "ok" : "info");
    });
    if (!is) { b.disabled = false; b.textContent = eski; return; }
    is.catch(function (er) { bildir(er.message, "bad"); }).then(function () { b.disabled = false; b.textContent = eski; saglikYukle(); });
    void ops;
  }
  function opsGonder(e) {
    var f = e.target.closest("[data-ops-form]"); if (!f) return;
    e.preventDefault();
    var hata = $(".adm-onay-hata", f), tur = f.getAttribute("data-ops-form");
    hata.hidden = true;
    if (tur === "ip") {
      var govde = { kapsam: f.kapsam.value.trim(), neden: f.neden.value.trim(), sure: f.sure.value };
      if (!govde.kapsam || !govde.neden) { hata.textContent = "IP adresi ve neden gerekli."; hata.hidden = false; (govde.kapsam ? f.neden : f.kapsam).focus(); return; }
      var d = f.querySelector("[type=submit]"); d.disabled = true;
      api("/api/admin/ip-engelleri", "POST", govde).then(function (r) {
        bildir(r.engel.kapsam + " engellendi.", "ok"); f.reset(); ipEngelYukle();
      }).catch(function (er) { hata.textContent = er.message; hata.hidden = false; }).then(function () { d.disabled = false; });
      return;
    }
    if (tur === "bakim") {
      var islem = f.getAttribute("data-islem") || "ac";
      var bitisV = f.bitis.value ? new Date(f.bitis.value) : null;
      if (bitisV && isNaN(bitisV.getTime())) { hata.textContent = "Geçerli bir bitiş zamanı seç."; hata.hidden = false; return; }
      var g = { acik: islem !== "kapat", mesaj: f.mesaj.value.trim(), bitis: bitisV ? bitisV.toISOString() : null };
      var gonder = function () {
        return api("/api/admin/bakim", "POST", g).then(function (r) {
          bildir(r.bakim.acik ? (islem === "ac" ? "Bakım modu açıldı. Ziyaretçiler bakım sayfasını görüyor." : "Bakım mesajı güncellendi.") : "Bakım modu kapatıldı; site herkese açık.", "ok");
          bakimSeridiCiz(r.bakim); saglikYukle();
        });
      };
      if (islem === "ac") {
        onayAc($(".adm-onay", f), f.querySelector('[data-bakim="ac"]'), {
          baslik: "Site bakıma alınsın mı?", metin: "Yönetici olmayan herkes (öğrenciler dahil) bakım sayfasını görür ve API istekleri 503 alır. Açık sayfalar bir sonraki istekte bakım uyarısı alır.",
          onayMetni: "Evet, bakıma al", tehlike: true, onayla: gonder
        });
      } else {
        var dg = f.querySelectorAll("button"); dg.forEach(function (x) { x.disabled = true; });
        gonder().catch(function (er) { hata.textContent = er.message; hata.hidden = false; dg.forEach(function (x) { x.disabled = false; }); });
      }
    }
  }
  function epostaKuyrukAc(durum, tetik) {
    var c = cekmeceAc("E-posta kuyruğu", iskelet("cekmece"), tetik);
    c.mod = "eposta";
    var ciz = function (d) {
      c.govde.innerHTML = '<div class="adm-cip-grup" role="group" aria-label="Kuyruk durumu">' +
        [["bekleyen", "Bekleyen"], ["hata", "Hatalı"], ["gonderilen", "Gönderilen"]].map(function (x) {
          return '<button type="button" class="adm-cip" data-ep-durum="' + x[0] + '" aria-pressed="' + (x[0] === d ? "true" : "false") + '">' + esc(x[1]) + "</button>";
        }).join("") + "</div>" + iskelet("tablo", 4);
      api("/api/admin/sistem/eposta?durum=" + encodeURIComponent(d)).then(function (v) {
        if (!cekmeceAcik() || c.mod !== "eposta") return;
        var l = Array.isArray(v.epostalar) ? v.epostalar : [];
        var liste = l.length ? '<ul class="adm-ep-liste">' + l.map(function (m) {
          return '<li class="adm-ep-oge"><div class="adm-min0"><p class="adm-ep-konu adm-kir">' + esc(m.konu) + '</p><p class="adm-alt adm-kir">' + esc(m.alici) + " · " + esc(tarih(m.olusturma)) +
            (m.gonderim ? " · gönderildi " + esc(goreceZaman(m.gonderim)) : "") + "</p>" + (m.hata ? '<p class="adm-ep-hata adm-kir">' + esc(kisalt(m.hata, 200)) + "</p>" : "") + "</div>" +
            (!m.gonderim ? '<button type="button" class="btn-ghost btn-sm" data-ep-tekrar="' + esc(m.id) + '"' + (v.smtp ? "" : " disabled") + ">Yeniden dene</button>" : "") + "</li>";
        }).join("") + "</ul>" : bos(d === "gonderilen" ? "Gönderilmiş e-posta yok." : "Bu durumda e-posta yok.");
        c.govde.innerHTML = c.govde.querySelector(".adm-cip-grup").outerHTML + (v.smtp ? "" : '<p class="adm-alt">SMTP ayarlı değil: e-postalar yalnızca kuyrukta tutulur, gönderilemez.</p>') + liste +
          '<p class="adm-alt">En yeni 100 kayıt. E-posta metinleri burada gösterilmez (içlerinde tek kullanımlık bağlantılar olabilir).</p>';
      }).catch(function (e) { c.govde.innerHTML = '<div class="adm-hata" role="alert"><p>' + esc(e.message) + "</p></div>"; });
    };
    if (!c.epBagli) {
      c.epBagli = true;
      c.govde.addEventListener("click", function (e) {
        if (c.mod !== "eposta") return;
        var dc = e.target.closest("[data-ep-durum]"); if (dc) { ciz(dc.getAttribute("data-ep-durum")); return; }
        var tk = e.target.closest("[data-ep-tekrar]");
        if (tk) {
          tk.disabled = true; tk.textContent = "Gönderiliyor…";
          api("/api/admin/sistem/eposta/" + encodeURIComponent(tk.getAttribute("data-ep-tekrar")) + "/tekrar", "POST", {}).then(function (r) {
            bildir(r.gonderildi ? "E-posta gönderildi." : "Gönderilemedi; hata kaydedildi.", r.gonderildi ? "ok" : "bad");
            var aktif = c.govde.querySelector('[data-ep-durum][aria-pressed="true"]'); ciz(aktif ? aktif.getAttribute("data-ep-durum") : "bekleyen");
          }).catch(function (er) { tk.disabled = false; tk.textContent = "Yeniden dene"; bildir(er.message, "bad"); });
        }
      });
    }
    ciz(durum);
  }

  function logYukle(sessiz) {
    var kap = $("#panel-sistem .adm-log-liste"), say = $("#panel-sistem .adm-log-sayfa"), oz = $("#sis-sonuc");
    var no = ++S.sis.istek;
    kap.setAttribute("aria-busy", "true");
    if (!kap.querySelector("table")) { if (!sessiz) kap.innerHTML = iskelet("tablo", 6); }
    else if (!sessiz) kap.classList.add("is-soluk");
    return api("/api/admin/loglar" + sorgu({ seviye: S.sis.seviye, kaynak: S.sis.kaynak, durum: S.sis.durum, q: S.sis.q, sayfa: S.sis.sayfa > 1 ? S.sis.sayfa : "" })).then(function (v) {
      if (no !== S.sis.istek) return;
      var liste = Array.isArray(v.loglar) ? v.loglar : [];
      S.sis.satirlar = liste;
      S.sis.boyut = boyutCikar(v, liste, S.sis.boyut);
      var b = sayfaBilgisi(v.toplam, v.sayfa || S.sis.sayfa, S.sis.boyut, liste.length);
      // Seçim yalnızca görünen kayıtlarda tutulur
      var gorunen = {}; liste.forEach(function (l) { gorunen[l.id] = true; });
      Object.keys(S.sis.secili).forEach(function (k) { if (!gorunen[k]) delete S.sis.secili[k]; });
      oz.tabIndex = -1;
      oz.textContent = b.toplam ? sayi(b.toplam) + " kayıt" + (S.sis.durum ? " · durum: " + (S.sis.durum === "acik" ? "açık" : logDurumAd(S.sis.durum).toLocaleLowerCase("tr-TR")) : "") + "." : "";
      if (!liste.length) {
        var filtreli = S.sis.seviye || S.sis.kaynak || S.sis.q;
        kap.innerHTML = filtreli
          ? bos("Filtreleri değiştirmeyi ya da aramayı temizlemeyi dene.", "Bu filtreye uyan kayıt yok", "bilgi")
          : S.sis.durum === "yeni"
            ? bos("Yeni hata ya da uyarı yok. Her şey yolunda görünüyor.", "Temiz", "ok")
            : bos("Bu durumda kayıt yok.", "Kayıt yok", "bilgi");
        say.innerHTML = ""; topluGuncelle();
        return;
      }
      kap.innerHTML = '<div class="adm-tablo-kap adm-kaydir"><table class="adm-tablo adm-kartlas adm-log-tablo">' +
        '<caption class="visually-hidden">Sistem logları, sayfa ' + esc(sayi(b.sayfa)) + "</caption>" +
        '<thead><tr><th scope="col" class="adm-sec-hucre"><input type="checkbox" class="adm-secim" data-sec-hepsi aria-label="Bu sayfadaki tüm kayıtları seç"></th>' +
        '<th scope="col">Seviye</th><th scope="col">Mesaj</th><th scope="col" class="adm-sag">Adet</th><th scope="col">Son görülme</th><th scope="col">Durum</th></tr></thead><tbody>' +
        liste.map(function (l) {
          var o = l.ozet || {};
          var yer = [kaynakAd(l.kaynak), o.method && o.path ? o.method + " " + o.path : (o.url || ""), o.status ? "HTTP " + o.status : ""].filter(Boolean).join(" · ");
          var sec = !!S.sis.secili[l.id];
          return '<tr data-log="' + esc(l.id) + '" class="is-sv-' + esc(l.seviye) + (S.sis.acikLog === String(l.id) ? " is-acik" : "") + '">' +
            '<td data-label="Seç" class="adm-sec-hucre"><input type="checkbox" class="adm-secim" data-sec="' + esc(l.id) + '"' + (sec ? " checked" : "") + ' aria-label="Seç: ' + esc(kisalt(l.mesaj, 80)) + '"></td>' +
            '<td data-label="Seviye" class="adm-hucre-seviye">' + seviyeCip(l.seviye) + "</td>" +
            '<td data-label="Mesaj" class="adm-log-mesaj"><button type="button" class="adm-link adm-log-baslik" data-log-ac="' + esc(l.id) + '">' + esc(kisalt(l.mesaj, 160)) + "</button>" +
              '<span class="adm-alt adm-kir">' + esc(yer) + "</span></td>" +
            '<td data-label="Adet" class="adm-sag">' + (Number(l.adet) > 1 ? '<span class="adm-adet" title="' + esc(sayi(l.adet)) + ' kez görüldü">×' + esc(sayi(l.adet)) + "</span>" : '<span class="adm-alt">1</span>') + "</td>" +
            '<td data-label="Son görülme" class="adm-nowrap"><time datetime="' + esc(l.sonZaman) + '" title="' + esc(tarih(l.sonZaman)) + '">' + esc(goreceZaman(l.sonZaman)) + "</time></td>" +
            '<td data-label="Durum">' + logDurumRozet(l.durum) + "</td>" +
            "</tr>";
        }).join("") + "</tbody></table></div>";
      say.innerHTML = sayfalamaHtml(b, "Log sayfaları", "kayıt");
      topluGuncelle();
    }).catch(function (e) {
      if (no === S.sis.istek && !sessiz) { kap.innerHTML = hataKutusu(e.message); say.innerHTML = ""; oz.textContent = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); kap.classList.remove("is-soluk"); });
  }

  function topluIslem(durum, tetik) {
    var ids = Object.keys(S.sis.secili).map(Number).filter(Boolean);
    if (!ids.length) return;
    tetik.disabled = true;
    api("/api/admin/loglar/toplu", "POST", { ids: ids, durum: durum }).then(function (r) {
      bildir(sayi(r.guncellenen) + " kayıt “" + logDurumAd(durum) + "” olarak işaretlendi.", "ok");
      S.sis.secili = {};
      return sistemYukle(true);
    }).catch(function (e) { bildir(e.message, "bad"); }).then(function () { tetik.disabled = false; topluGuncelle(); });
  }

  var AYRINTI_GOSTERILEN = ["stack", "method", "path", "status", "url", "satir", "sutun", "user_id", "ipOzet", "ua", "sureMs"];
  function logDetayHtml(l) {
    var a = l.ayrinti || {};
    var dl = function (rows) {
      return '<dl class="adm-dl adm-cek-dl">' + rows.filter(function (r) { return r[1] != null && r[1] !== ""; }).map(function (r) {
        return '<div' + (r[2] ? ' class="adm-dl-genis"' : "") + "><dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd></div>";
      }).join("") + "</dl>";
    };
    var diger = {};
    Object.keys(a).forEach(function (k) { if (AYRINTI_GOSTERILEN.indexOf(k) < 0) diger[k] = a[k]; });
    var digerMetin = Object.keys(diger).length ? JSON.stringify(diger, null, 2) : "";
    var kul = l.kullanici ? esc(adSoyad(l.kullanici)) + ' <span class="adm-alt">' + esc(l.kullanici.id) + "</span>" : (a.user_id ? "#" + esc(a.user_id) : "");
    return '<div class="adm-rozetler">' + seviyeCip(l.seviye) + rozet(kaynakAd(l.kaynak), "notr") + logDurumRozet(l.durum) +
        (Number(l.adet) > 1 ? '<span class="adm-adet">×' + esc(sayi(l.adet)) + "</span>" : "") + "</div>" +
      '<p class="adm-cek-mesaj adm-kir">' + esc(l.mesaj) + "</p>" +
      dl([
        ["İlk görülme", esc(tarih(l.zaman))],
        ["Son görülme", esc(tarih(l.sonZaman)) + ' <span class="adm-alt">(' + esc(goreceZaman(l.sonZaman)) + ")</span>"],
        ["İstek", a.method || a.path ? '<code class="adm-kod">' + esc((a.method || "") + " " + (a.path || "")) + "</code>" : ""],
        ["HTTP", a.status ? esc(a.status) : ""],
        ["Süre", sayiMi(a.sureMs) ? esc(sayi(a.sureMs)) + " ms" : ""],
        ["Sayfa", a.url ? '<span class="adm-kir">' + esc(a.url) + "</span>" + (a.satir ? ' <span class="adm-alt">satır ' + esc(a.satir) + (a.sutun ? ":" + esc(a.sutun) : "") + "</span>" : "") : "", true],
        ["Kullanıcı", kul],
        ["IP özeti", a.ipOzet ? '<code class="adm-kod">' + esc(a.ipOzet) + "</code>" : ""],
        ["Tarayıcı", a.ua ? '<span class="adm-kir adm-alt">' + esc(a.ua) + "</span>" : "", true],
        ["İşleyen", l.isleyen ? esc(adSoyad(l.isleyen)) + ' <span class="adm-alt">' + esc(tarih(l.islemZamani)) + "</span>" : ""]
      ]) +
      (a.stack ? '<section class="adm-yigin"><div class="adm-yigin-ust"><h3>Yığın izi</h3>' +
        '<button type="button" class="btn-ghost btn-sm adm-ikonlu" data-kopyala="yigin">' + ikon("kopya") + "<span>Kopyala</span></button></div>" +
        '<pre class="adm-yigin-pre" id="adm-yigin" tabindex="0">' + esc(a.stack) + "</pre></section>" : "") +
      (digerMetin ? '<details class="adm-ayrinti adm-cek-diger"><summary>Diğer ayrıntılar</summary><pre>' + esc(digerMetin) + "</pre></details>" : "") +
      '<form class="adm-cek-form" novalidate>' +
        '<div class="field"><label for="adm-cek-not">Çözüm notu <span class="adm-alt">(isteğe bağlı)</span></label>' +
          '<textarea id="adm-cek-not" class="text-input adm-not" rows="3" maxlength="500" placeholder="Ne yapıldı? Örn. SMTP şifresi yenilendi.">' + esc(l.cozumNotu || "") + "</textarea></div>" +
        '<p class="adm-onay-hata" role="alert" hidden></p>' +
        '<div class="adm-eylem">' +
          (l.durum !== "cozuldu" ? '<button type="button" class="btn-primary" data-log-durum="cozuldu">Çözüldü</button>' : "") +
          (l.durum !== "incelendi" ? '<button type="button" class="btn-ghost" data-log-durum="incelendi">İncelendi</button>' : "") +
          (l.durum !== "yeni" ? '<button type="button" class="btn-ghost" data-log-durum="yeni">Yeniden aç</button>' : "") +
        "</div>" +
      "</form>";
  }

  function logAc(id, tetik) {
    S.sis.acikLog = String(id);
    document.querySelectorAll("#panel-sistem tr[data-log]").forEach(function (tr) { tr.classList.toggle("is-acik", tr.getAttribute("data-log") === String(id)); });
    var c = cekmeceAc("Log #" + id, iskelet("cekmece"), tetik, function () {
      S.sis.acikLog = null;
      document.querySelectorAll("#panel-sistem tr.is-acik").forEach(function (tr) { tr.classList.remove("is-acik"); });
    });
    if (!c.bagli) {
      c.bagli = true;
      c.govde.addEventListener("click", function (e) {
        var k = e.target.closest("[data-kopyala]");
        if (k) { kopyala($("#adm-yigin", c.govde), k); return; }
        var d = e.target.closest("[data-log-durum]");
        if (d && c.logId) logDurumDegistir(c.logId, d.getAttribute("data-log-durum"), d);
      });
    }
    c.logId = id; c.mod = "log";
    return api("/api/admin/loglar/" + encodeURIComponent(id)).then(function (v) {
      if (!cekmeceAcik() || c.logId !== id) return;
      c.baslik.textContent = seviyeAd(v.log.seviye) + " · " + kaynakAd(v.log.kaynak) + " #" + v.log.id;
      c.govde.innerHTML = logDetayHtml(v.log);
    }).catch(function (e) {
      if (cekmeceAcik() && c.logId === id) c.govde.innerHTML = '<div class="adm-hata" role="alert"><p>' + esc(e.message) + "</p></div>";
    });
  }

  function logDurumDegistir(id, durum, tetik) {
    var f = $(".adm-cek-form", cek.govde), h = $(".adm-onay-hata", f), not = $("#adm-cek-not", f).value.trim();
    var dugmeler = f.querySelectorAll("button");
    dugmeler.forEach(function (b) { b.disabled = true; });
    var eski = tetik.textContent; tetik.textContent = "Kaydediliyor…";
    h.hidden = true;
    api("/api/admin/loglar/" + encodeURIComponent(id) + "/durum", "POST", { durum: durum, not: not }).then(function (v) {
      bildir("Log #" + id + " “" + logDurumAd(durum) + "” olarak işaretlendi.", "ok");
      if (cekmeceAcik() && cek.logId === id) {
        cek.govde.innerHTML = logDetayHtml(v.log);
        var ilk = cek.govde.querySelector("[data-log-durum]"); if (ilk) ilk.focus();
      }
      saglikYukle(true); logYukle(true);
    }).catch(function (e) {
      dugmeler.forEach(function (b) { b.disabled = false; }); tetik.textContent = eski;
      h.textContent = e.message; h.hidden = false;
    });
  }

  function kopyala(el, dugme) {
    if (!el) return;
    var metin = el.textContent, etiket = $("span", dugme);
    var tamam = function (m) { if (etiket) { etiket.textContent = m; setTimeout(function () { etiket.textContent = "Kopyala"; }, 2000); } };
    var yedek = function () {
      try {
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        tamam(document.execCommand && document.execCommand("copy") ? "Kopyalandı" : "Seçildi, Ctrl+C");
      } catch (e) { tamam("Kopyalanamadı"); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(function () { tamam("Kopyalandı"); }, yedek);
    else yedek();
  }

  /* ------------------------------------------------------------------------
     15. BAŞLAT
     ------------------------------------------------------------------------ */
  function yetkisiz(metin, girisLinki) {
    main.innerHTML = '<section class="surface adm-yetkisiz" role="alert">' +
      "<h1>" + esc(metin) + "</h1>" +
      "<p>" + (girisLinki
        ? 'Devam etmek için <a href="' + GIRIS + '">yönetici hesabınla giriş yap</a>.'
        : 'Ana sayfaya dönmek için <a href="index.html">buraya tıkla</a>.') + "</p>" +
      "</section>";
  }
  function baslat() {
    main = document.getElementById("adm-root") || document.getElementById("main-content");
    if (!main) return;
    main.innerHTML = yukleniyor("Yetki denetleniyor…");
    api("/api/me").then(function (me) {
      if (!me || !me.user || me.user.rol !== "yonetici") { yetkisiz("Bu sayfa yalnızca yöneticiler içindir"); return; }
      kabukKur(me);
    }).catch(function (e) {
      if (e.durum === 401) { yetkisiz("Oturumun yok ya da süresi doldu", true); return; }
      if (e.durum === 403) { yetkisiz("Bu sayfa yalnızca yöneticiler içindir"); return; }
      main.innerHTML = hataKutusu(e.message);
      var b = $("[data-tekrar]", main); if (b) b.addEventListener("click", baslat);
    });
  }
  yardimci._baslat = baslat;
  yardimci._durum = S;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat);
  else baslat();
})(typeof window !== "undefined" ? window : globalThis);
