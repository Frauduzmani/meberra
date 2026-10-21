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

  var yardimci = {
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
    kul: { q: "", premium: false, sayfa: 1, boyut: 0, istek: 0, satirlar: [] },
    secili: null,          // { id, veri }
    den: { kullanici: "", eylem: "", sayfa: 1, boyut: 0, istek: 0 },
    talepIstek: 0,
    durumBilinen: {},      // detay yanıtında user.durum yoksa son başarılı /durum işleminin sonucu
    soru: { durum: "bekliyor", sayfa: 1, istek: 0, secili: null },
    veri: { tablolar: null, tablo: "", q: "", alan: "", deger: "", sirala: "", yon: "desc", sayfa: 1, istek: 0, sonuc: null, secili: null },
    lig: { hafta: "", istek: 0 }
  };
  var SEKMELER = [
    { id: "ozet", ad: "Özet" },
    { id: "talepler", ad: "Ödeme talepleri", sayac: "adm-bekleyen" },
    { id: "sorular", ad: "Sorular", sayac: "adm-soru-bekleyen" },
    { id: "kullanicilar", ad: "Kullanıcılar" },
    { id: "duyuru", ad: "Duyuru" },
    { id: "lig", ad: "Lig" },
    { id: "veri", ad: "Veri" },
    { id: "denetim", ad: "Denetim kaydı" }
  ];
  var main, bildirimEl, bildirimZaman;
  var $ = function (sel, kap) { return (kap || document).querySelector(sel); };

  function yukleniyor(metin) {
    return '<p class="adm-yukleniyor" role="status"><span class="adm-spin" aria-hidden="true"></span>' + esc(metin || "Yükleniyor…") + "</p>";
  }
  function bos(metin) { return '<p class="adm-bos">' + esc(metin) + "</p>"; }
  function hataKutusu(metin) {
    return '<div class="adm-hata" role="alert"><p>' + esc(metin) + '</p><button type="button" class="btn-ghost btn-sm" data-tekrar>Yeniden dene</button></div>';
  }
  function rozet(metin, ton) { return '<span class="adm-rozet is-' + esc(ton || "notr") + '">' + esc(metin) + "</span>"; }

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
      '<header class="page-head adm-head">' +
        '<span class="eyebrow">Yönetim</span>' +
        "<h1>Yönetici paneli</h1>" +
        "<p>Ödeme taleplerini onayla, kullanıcıları ve üyelikleri yönet, işlem kayıtlarını incele. " +
        '<span class="adm-alt">Oturum: ' + esc(adSoyad(me.user)) + "</span></p>" +
      "</header>" +
      '<div class="adm-bildirim" role="status" aria-live="polite" hidden></div>' +
      '<div class="adm-sekme-kap"><div class="adm-sekmeler" role="tablist" aria-label="Yönetici bölümleri">' +
        SEKMELER.map(function (s) {
          return '<button type="button" role="tab" class="adm-sekme" id="sekme-' + s.id + '" aria-controls="panel-' + s.id + '" aria-selected="false" tabindex="-1" data-sekme="' + s.id + '">' +
            esc(s.ad) + (s.sayac ? ' <span class="adm-sayac" id="' + s.sayac + '" hidden></span>' : "") + "</button>";
        }).join("") +
      "</div></div>" +
      SEKMELER.map(function (s) {
        return '<section class="adm-panel" role="tabpanel" id="panel-' + s.id + '" aria-labelledby="sekme-' + s.id + '" tabindex="0" hidden></section>';
      }).join("");
    bildirimEl = $(".adm-bildirim", main);

    var liste = $(".adm-sekmeler", main);
    liste.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sekme]"); if (b) sekmeAc(b.getAttribute("data-sekme"));
    });
    liste.addEventListener("keydown", function (e) {
      var tabs = Array.prototype.slice.call(liste.querySelectorAll("[role=tab]"));
      var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      sekmeAc(tabs[j].getAttribute("data-sekme"));
      tabs[j].focus();
    });

    panelOzetKur(); panelTalepKur(); panelSoruKur(); panelKulKur(); panelDuyuruKur(); panelLigKur(); panelVeriKur(); panelDenKur();

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
    });
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* file:// vb. */ }
    if (id === "ozet") ozetYukle();
    else if (id === "talepler") talepYukle();
    else if (id === "kullanicilar") { if (!S.yuklendi.kullanicilar) kulYukle(); }
    else if (id === "denetim") denYukle();
    else if (id === "sorular") { if (!S.soru.secili) soruYukle(); }
    else if (id === "duyuru") duyuruOnizle();
    else if (id === "lig") ligYukle();
    else if (id === "veri") { if (!S.veri.tablolar) veriTablolarYukle(); }
  }

  /* ------------------------------------------------------------------------
     5. ÖZET
     ------------------------------------------------------------------------ */
  function panelOzetKur() {
    var p = $("#panel-ozet");
    p.innerHTML = '<div class="adm-panel-ust"><h2>Özet</h2><button type="button" class="btn-ghost" data-yenile>Yenile</button></div><div class="adm-ozet-icerik"></div>';
    p.addEventListener("click", function (e) {
      if (e.target.closest("[data-yenile],[data-tekrar]")) ozetYukle();
      var git = e.target.closest("[data-git]"); if (git) { sekmeAc(git.getAttribute("data-git")); $("#sekme-" + git.getAttribute("data-git")).focus(); }
    });
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
    if (!sessiz) { kap.innerHTML = yukleniyor("Özet yükleniyor…"); kap.setAttribute("aria-busy", "true"); }
    return api("/api/admin/stats").then(function (v) {
      bekleyenRozet(v.talep && v.talep.bekleyen);
      bekleyenRozet(v.soru && v.soru.bekleyen, "adm-soru-bekleyen");
      if (sessiz && S.sekme !== "ozet") return;
      var k = v.kullanici || {}, pr = v.premium || {}, t = v.talep || {}, c = v.cevap || {}, g = v.gelirTahmini || {}, sq = v.soru || {};
      var kart = function (etiket, deger, alt, ton, git) {
        var ic = '<span class="adm-tile-etiket">' + esc(etiket) + '</span><span class="adm-tile-deger">' + deger + "</span>" +
          (alt ? '<span class="adm-tile-alt">' + alt + "</span>" : "");
        return git
          ? '<li><button type="button" class="adm-tile is-' + (ton || "notr") + ' is-tik" data-git="' + git + '">' + ic + "</button></li>"
          : '<li><div class="adm-tile is-' + (ton || "notr") + '">' + ic + "</div></li>";
      };
      kap.innerHTML = '<ul class="adm-tiles">' +
        kart("Bekleyen ödeme talebi", esc(sayi(t.bekleyen)), Number(t.bekleyen) > 0 ? "İncelemek için tıkla" : "Bekleyen talep yok", Number(t.bekleyen) > 0 ? "enerji" : "notr", "talepler") +
        kart("Bekleyen soru", esc(sayi(sq.bekleyen)), Number(sq.bekleyen) > 0 ? "Yanıtlamak için tıkla" : "Bekleyen soru yok", Number(sq.bekleyen) > 0 ? "enerji" : "notr", "sorular") +
        kart("Aktif Premium", esc(sayi(pr.aktif)), "Aylık " + esc(sayi(pr.aylik)) + " · Yıllık " + esc(sayi(pr.yillik)), "mor") +
        kart("Tahmini aylık gelir", esc(tl(g.aylikTL)), "Aktif aboneliklere göre", "ok") +
        kart("Toplam kullanıcı", esc(sayi(k.toplam)), "", "notr", "kullanicilar") +
        kart("Son 7 gün yeni kayıt", esc(sayi(k.son7gun)), "", "notr") +
        kart("Son 7 gün aktif", esc(sayi(k.aktif7gun)), "", "notr") +
        kart("Toplam cevap", esc(sayi(c.toplam)), "Son 7 gün: " + esc(sayi(c.son7gun)), "notr") +
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
    if (!kap.querySelector("table")) kap.innerHTML = yukleniyor("Kullanıcılar yükleniyor…");
    else kap.classList.add("is-soluk");
    return api("/api/admin/users" + sorgu({ q: S.kul.q, sayfa: S.kul.sayfa, premium: S.kul.premium ? 1 : "" })).then(function (v) {
      if (no !== S.kul.istek) return;
      var liste = Array.isArray(v.kullanicilar) ? v.kullanicilar : [];
      S.kul.satirlar = liste;
      S.kul.boyut = boyutCikar(v, liste, S.kul.boyut);
      var b = sayfaBilgisi(v.toplam, v.sayfa || S.kul.sayfa, S.kul.boyut, liste.length);
      oz.tabIndex = -1;
      oz.textContent = b.toplam ? sayi(b.toplam) + " kullanıcı bulundu" + (S.kul.q ? " (“" + S.kul.q + "”)" : "") + "." : "";
      if (!liste.length) {
        kap.innerHTML = bos(S.kul.q || S.kul.premium ? "Aramaya uyan kullanıcı yok." : "Henüz kayıtlı kullanıcı yok.");
        say.innerHTML = "";
        return;
      }
      kap.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo adm-kartlas">' +
        '<caption class="visually-hidden">Kullanıcılar, sayfa ' + esc(sayi(b.sayfa)) + "</caption>" +
        '<thead><tr><th scope="col">Kullanıcı</th><th scope="col">Kayıt</th><th scope="col">Son giriş</th>' +
        '<th scope="col">Hesap</th><th scope="col">Premium</th><th scope="col" class="adm-sag">Cevap</th></tr></thead><tbody>' +
        liste.map(function (u) {
          var pr = u.premium
            ? rozet(planAd(u.plan), "mor") + (u.bitis ? ' <span class="adm-alt">' + esc(gunTarih(u.bitis)) + " bitiş</span>" : "")
            : '<span class="adm-alt">Yok</span>';
          return '<tr data-satir="' + esc(u.id) + '">' +
            '<td data-label="Kullanıcı" class="adm-hucre-kisi"><button type="button" class="adm-link" data-kul="' + esc(u.id) + '">' + esc(adSoyad(u)) + "</button>" +
              '<span class="adm-alt adm-kir">' + esc(u.eposta || "") + "</span></td>" +
            '<td data-label="Kayıt">' + esc(gunTarih(u.olusturma)) + "</td>" +
            '<td data-label="Son giriş">' + esc(tarih(u.sonGiris)) + "</td>" +
            '<td data-label="Hesap">' + rozet(hesapDurumAd(u.durum), u.durum === "askida" ? "bad" : "ok") + "</td>" +
            '<td data-label="Premium">' + pr + "</td>" +
            '<td data-label="Cevap" class="adm-sag">' + esc(sayi(u.cevapSayisi)) + "</td>" +
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
          '<div class="adm-rozetler">' + rozet(hesapDurumAd(durum), askida ? "bad" : "ok") + uyelikDurum +
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
          '<div class="adm-islem"><h4>Hesap durumu</h4><p class="adm-alt">' +
            (askida ? "Hesap askıda: kullanıcı giriş yapamaz." : "Hesap etkin. Askıya alınırsa kullanıcı giriş yapamaz.") + "</p>" +
            '<div class="adm-eylem"><button type="button" class="' + (askida ? "btn-primary" : "btn-ghost adm-ghost-tehlike") + '" data-eylem="durum" data-hedef="' + (askida ? "aktif" : "askida") + '" aria-expanded="false">' +
              (askida ? "Hesabı etkinleştir" : "Hesabı askıya al") + "</button></div><div class=\"adm-onay\" hidden></div></div>" +
        "</div>" +
      "</section>" +

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
    var b = e.target.closest("[data-eylem]");
    if (!b) return;
    var kap = b.closest(".adm-islem").querySelector(".adm-onay");
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
    kap.innerHTML = yukleniyor("Kayıtlar yükleniyor…");
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
    }).then(function () { kap.removeAttribute("aria-busy"); });
  }

  /* ------------------------------------------------------------------------
     9. SORULAR (öğrenci soruları: gelen kutusu, yazışma, yanıt, SSS)
     ------------------------------------------------------------------------ */
  function panelSoruKur() {
    var p = $("#panel-sorular");
    p.innerHTML =
      '<div class="adm-soru-liste-gorunum">' +
        '<div class="adm-panel-ust"><h2>Sorular</h2>' +
          '<div class="adm-arac">' +
            '<div class="field adm-field-dar"><label for="soru-durum">Durum</label>' +
              '<select id="soru-durum" class="text-input">' +
                '<option value="bekliyor">Yanıt bekleyenler</option><option value="cevaplandi">Yanıtlananlar</option>' +
                '<option value="kapandi">Kapananlar</option><option value="hepsi">Tümü</option>' +
              "</select></div>" +
            '<button type="button" class="btn-ghost" data-yenile>Yenile</button>' +
          "</div></div>" +
        '<p class="adm-ipucu">Öğrencilerin sorularını yanıtla. Yanıt, öğrenciye uygulama içi bildirim (ve tercih ettiyse e-posta) olarak gider. Bekleyenler en eski önce listelenir.</p>' +
        '<p class="adm-sonuc" id="soru-ozet" aria-live="polite"></p>' +
        '<div class="adm-soru-liste"></div><div class="adm-soru-sayfa"></div>' +
      "</div>" +
      '<div class="adm-detay adm-soru-detay" hidden></div>';
    $("#soru-durum").addEventListener("change", function (e) { S.soru.durum = e.target.value; S.soru.sayfa = 1; soruYukle(); });
    $(".adm-soru-liste-gorunum", p).addEventListener("click", function (e) {
      if (e.target.closest("[data-yenile],[data-tekrar]")) { soruYukle(); return; }
      var sb = e.target.closest("[data-sayfa]");
      if (sb && !sb.disabled) { S.soru.sayfa = Number(sb.getAttribute("data-sayfa")); soruYukle().then(function () { $("#soru-ozet").focus(); }); return; }
      var a = e.target.closest("[data-soru]"); if (a) soruAc(a.getAttribute("data-soru"));
    });
    $(".adm-soru-detay", p).addEventListener("click", soruDetayTik);
    $(".adm-soru-detay", p).addEventListener("submit", soruDetayGonder);
    $(".adm-soru-detay", p).addEventListener("input", function (e) {
      var t = e.target.closest("[data-sayac-icin]"); if (!t) return;
      var c = $("#" + t.getAttribute("data-sayac-icin")); if (c) c.textContent = sayi(t.value.length) + " / " + sayi(t.maxLength);
    });
  }
  function soruYukle() {
    var kap = $("#panel-sorular .adm-soru-liste"), say = $("#panel-sorular .adm-soru-sayfa"), oz = $("#soru-ozet");
    var no = ++S.soru.istek;
    kap.setAttribute("aria-busy", "true");
    kap.innerHTML = yukleniyor("Sorular yükleniyor…");
    return api("/api/admin/sorular" + sorgu({ durum: S.soru.durum, sayfa: S.soru.sayfa > 1 ? S.soru.sayfa : "" })).then(function (v) {
      if (no !== S.soru.istek) return;
      var liste = Array.isArray(v.sorular) ? v.sorular : [];
      if (S.soru.durum === "bekliyor") bekleyenRozet(v.toplam, "adm-soru-bekleyen");
      var b = sayfaBilgisi(v.toplam, v.sayfa || S.soru.sayfa, v.sayfaBoyu || 25, liste.length);
      oz.tabIndex = -1;
      oz.textContent = b.toplam ? sayi(b.toplam) + " soru." : "";
      if (!liste.length) { kap.innerHTML = bos(S.soru.durum === "bekliyor" ? "Yanıt bekleyen soru yok." : "Bu filtreye uyan soru yok."); say.innerHTML = ""; return; }
      kap.innerHTML = '<ul class="adm-sorular">' + liste.map(function (q) {
        var u = q.kullanici || {};
        return '<li class="adm-soru surface is-' + esc(soruDurumTon(q.durum)) + '">' +
          '<div class="adm-talep-ust"><div class="adm-min0"><h3 class="adm-talep-ad">' + esc(adSoyad(u)) + "</h3>" +
            '<p class="adm-alt adm-kir">' + esc(u.eposta || "—") + " · " + esc(dersAd(q.sayfa)) + (q.soruRef ? " · " + esc(q.soruRef) : "") + "</p></div>" +
            '<div class="adm-rozetler">' + rozet(soruDurumAd(q.durum), soruDurumTon(q.durum)) + (u.premium ? rozet("Premium", "mor") : "") + "</div></div>" +
          '<p class="adm-soru-metin adm-kir">' + esc(kisalt(q.metin, 280)) + "</p>" +
          '<div class="adm-soru-alt"><span class="adm-alt">' + esc(tarih(q.guncelleme)) + " · " + esc(sayi(q.mesajSayisi)) + " mesaj" +
            (q.sonMesajRol === "ogrenci" && q.durum !== "bekliyor" ? " · son mesaj öğrenciden" : "") + "</span>" +
            '<button type="button" class="btn-primary btn-sm" data-soru="' + esc(q.id) + '">Aç ve yanıtla</button></div>' +
          "</li>";
      }).join("") + "</ul>";
      say.innerHTML = sayfalamaHtml(b, "Soru sayfaları", "soru");
    }).catch(function (e) {
      if (no === S.soru.istek) { kap.innerHTML = hataKutusu(e.message); say.innerHTML = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); });
  }
  function soruAc(id) {
    var p = $("#panel-sorular"), d = $(".adm-soru-detay", p);
    $(".adm-soru-liste-gorunum", p).hidden = true; d.hidden = false;
    S.soru.secili = { id: id, veri: null };
    d.innerHTML = '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Soru listesine dön</button></div>' + yukleniyor("Soru yükleniyor…");
    $("[data-geri]", d).focus();
    return soruDetayYukle();
  }
  function soruDetayYukle(odakla) {
    var d = $("#panel-sorular .adm-soru-detay"), id = S.soru.secili && S.soru.secili.id;
    if (!id) return Promise.resolve();
    d.setAttribute("aria-busy", "true");
    return api("/api/admin/sorular/" + encodeURIComponent(id)).then(function (v) {
      if (!S.soru.secili || S.soru.secili.id !== id) return;
      S.soru.secili.veri = v.soru;
      d.innerHTML = soruDetayHtml(v.soru);
      mathDiz(d);
      var h = $(odakla || "#soru-detay-baslik", d); if (h) h.focus();
    }).catch(function (e) {
      d.innerHTML = '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Soru listesine dön</button></div>' + hataKutusu(e.message);
    }).then(function () { d.removeAttribute("aria-busy"); });
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
    S.soru.secili = null;
    $(".adm-soru-detay", p).hidden = true; $(".adm-soru-detay", p).innerHTML = "";
    $(".adm-soru-liste-gorunum", p).hidden = false;
    soruYukle().then(function () { var h = $("#panel-sorular h2"); if (h) { h.tabIndex = -1; h.focus(); } });
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
    return '<section class="surface adm-baglam" aria-labelledby="soru-baglam-b"><h3 id="soru-baglam-b">Soru bağlamı</h3>' +
      (satir.length ? '<dl class="adm-dl">' + satir.join("") + "</dl>" : "") + ek + "</section>";
  }
  function soruDetayHtml(q) {
    var u = q.kullanici || {}, msj = Array.isArray(q.mesajlar) ? q.mesajlar : [];
    var sonYanit = msj.filter(function (m) { return m.rol === "yonetici"; }).pop();
    var sssVar = Array.isArray(q.sss) ? q.sss : [];
    return '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-geri>‹ Soru listesine dön</button>' +
        (u.id ? '<button type="button" class="btn-ghost" data-kul-git="' + esc(u.id) + '">Öğrenci profili</button>' : "") + "</div>" +
      '<header class="surface adm-kisi">' +
        '<div class="adm-kisi-ust"><h2 id="soru-detay-baslik" tabindex="-1">Soru #' + esc(q.id) + " · " + esc(adSoyad(u)) + "</h2>" +
          '<div class="adm-rozetler">' + rozet(soruDurumAd(q.durum), soruDurumTon(q.durum)) + (u.premium ? rozet("Premium", "mor") : rozet("Ücretsiz", "notr")) + "</div></div>" +
        '<p class="adm-alt adm-kir">' + esc(u.eposta || "—") + " · " + esc(dersAd(q.sayfa)) + (q.soruRef ? " · " + esc(q.soruRef) : "") + " · " + esc(tarih(q.olusturma)) + "</p>" +
      "</header>" +
      baglamHtml(q.baglam) +
      '<section class="surface" aria-labelledby="soru-yazisma-b"><h3 id="soru-yazisma-b">Yazışma</h3>' +
        '<ol class="adm-mesajlar">' + msj.map(function (m) {
          var yon = m.rol === "yonetici";
          return '<li class="adm-mesaj ' + (yon ? "is-yonetici" : "is-ogrenci") + '">' +
            '<p class="adm-mesaj-ust"><strong>' + esc(yon ? "Meberra ekibi" + (m.yazan ? " (" + adSoyad(m.yazan) + ")" : "") : adSoyad(u)) + "</strong> · " + esc(tarih(m.tarih)) +
              (yon ? " · " + (m.okundu ? "okundu" : "henüz okunmadı") : "") + "</p>" +
            '<p class="adm-mesaj-metin adm-kir">' + esc(m.metin) + "</p></li>";
        }).join("") + "</ol>" +
      "</section>" +
      '<section class="surface" aria-labelledby="soru-yanit-b"><h3 id="soru-yanit-b">Yanıtla</h3>' +
        '<form class="adm-islem adm-yanit-form" data-form="yanit" novalidate>' +
          '<div class="field"><label for="soru-yanit">Yanıtın (öğrenci "Meberra ekibi" imzasıyla görür)</label>' +
            '<textarea id="soru-yanit" class="text-input adm-not" rows="6" maxlength="2000" data-sayac-icin="soru-yanit-sayac" required></textarea>' +
            '<p class="field-hint" id="soru-yanit-sayac" aria-live="polite">0 / 2.000</p></div>' +
          '<p class="field-error" id="soru-yanit-hata" role="alert" hidden></p>' +
          '<div class="adm-eylem"><button type="submit" class="btn-primary">Yanıtı gönder</button>' +
            (q.durum !== "kapandi"
              ? '<button type="button" class="btn-ghost" data-soru-durum="kapandi" aria-expanded="false">Soruyu kapat</button>'
              : '<button type="button" class="btn-ghost" data-soru-durum="bekliyor" aria-expanded="false">Yeniden aç</button>') +
          "</div><div class=\"adm-onay\" hidden></div>" +
        "</form>" +
      "</section>" +
      '<section class="surface" aria-labelledby="soru-sss-b"><h3 id="soru-sss-b">SSS\'ye ekle</h3>' +
        (sssVar.length ? '<p class="adm-alt">Bu sorudan yayınlanan: ' + sssVar.map(function (f) { return esc(kisalt(f.soru, 60)) + " (" + esc(f.durum === "gizli" ? "gizli" : "yayında") + ")"; }).join(", ") + "</p>" : "") +
        '<form class="adm-islem" data-form="sss" novalidate>' +
          '<p class="adm-alt">Öğrencinin adı ve kişisel bilgisi SSS\'ye girmesin; soruyu genel bir dille yaz.</p>' +
          '<div class="field"><label for="sss-soru">Soru</label><textarea id="sss-soru" class="text-input adm-not" rows="2" maxlength="500">' + esc(kisalt(q.metin, 500)) + "</textarea></div>" +
          '<div class="field"><label for="sss-cevap">Cevap</label><textarea id="sss-cevap" class="text-input adm-not" rows="5" maxlength="4000">' + esc(sonYanit ? sonYanit.metin : "") + "</textarea></div>" +
          '<div class="field"><label for="sss-sayfa">Sayfa (boş: genel)</label><input id="sss-sayfa" class="text-input" maxlength="80" value="' + esc(q.sayfa || "") + '" placeholder="ör. ap-calculus"></div>' +
          '<p class="field-error" id="sss-hata" role="alert" hidden></p>' +
          '<div class="adm-eylem"><button type="submit" class="btn-primary">SSS\'de yayınla</button></div>' +
        "</form>" +
      "</section>";
  }
  function soruDetayTik(e) {
    if (e.target.closest("[data-geri]")) { soruKapat(); return; }
    if (e.target.closest("[data-tekrar]")) { soruDetayYukle(); return; }
    var kg = e.target.closest("[data-kul-git]");
    if (kg) { sekmeAc("kullanicilar"); detayAc(kg.getAttribute("data-kul-git")); return; }
    var b = e.target.closest("[data-soru-durum]");
    if (!b || !S.soru.secili) return;
    var hedef = b.getAttribute("data-soru-durum"), id = S.soru.secili.id;
    onayAc(b.closest("form").querySelector(".adm-onay"), b, {
      baslik: hedef === "kapandi" ? "Soru kapatılsın mı?" : "Soru yeniden açılsın mı?",
      metin: hedef === "kapandi" ? "Öğrenci bu soruya artık yazamaz; gerekirse yeni soru açar." : "Soru yeniden yanıt bekleyenlere döner.",
      onayMetni: hedef === "kapandi" ? "Evet, kapat" : "Evet, yeniden aç",
      onayla: function () {
        return api("/api/admin/sorular/" + encodeURIComponent(id) + "/durum", "POST", { durum: hedef }).then(function () {
          bildir(hedef === "kapandi" ? "Soru kapatıldı." : "Soru yeniden açıldı.", "ok");
          soruDetayYukle(); ozetYukle(true);
        });
      }
    });
  }
  function soruDetayGonder(e) {
    var f = e.target.closest("form"); if (!f) return;
    e.preventDefault();
    var q = S.soru.secili && S.soru.secili.veri; if (!q) return;
    var dugme = f.querySelector("[type=submit]");
    if (f.getAttribute("data-form") === "yanit") {
      var t = $("#soru-yanit", f), h = $("#soru-yanit-hata", f), metin = t.value.trim();
      if (!metin) { h.textContent = "Yanıtı yaz."; h.hidden = false; t.setAttribute("aria-invalid", "true"); t.focus(); return; }
      h.hidden = true; t.removeAttribute("aria-invalid");
      dugme.disabled = true; dugme.textContent = "Gönderiliyor…";
      api("/api/admin/sorular/" + encodeURIComponent(q.id) + "/yanit", "POST", { metin: metin }).then(function () {
        bildir("Yanıt gönderildi; öğrenciye bildirim gitti.", "ok");
        ozetYukle(true);
        return soruDetayYukle("#soru-yazisma-b");
      }).catch(function (err) {
        dugme.disabled = false; dugme.textContent = "Yanıtı gönder";
        h.textContent = err.message; h.hidden = false;
      });
    } else if (f.getAttribute("data-form") === "sss") {
      var hs = $("#sss-hata", f), govde = { soru: $("#sss-soru", f).value.trim(), cevap: $("#sss-cevap", f).value.trim(), sayfa: $("#sss-sayfa", f).value.trim(), kaynakSoruId: q.id };
      if (!govde.soru || !govde.cevap) { hs.textContent = "Soru ve cevap gerekli."; hs.hidden = false; return; }
      hs.hidden = true;
      dugme.disabled = true; dugme.textContent = "Yayınlanıyor…";
      api("/api/admin/sss", "POST", govde).then(function () {
        bildir("SSS'de yayınlandı.", "ok");
        return soruDetayYukle("#soru-sss-b");
      }).catch(function (err) {
        dugme.disabled = false; dugme.textContent = "SSS'de yayınla";
        hs.textContent = err.message; hs.hidden = false;
      });
    }
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
     13. BAŞLAT
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
