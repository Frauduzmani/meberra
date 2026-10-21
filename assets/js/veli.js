/**
 * Meberra 1.7.0 — Veli paneli (veli.html). app.js/auth.js yüklemez: kendi küçük istemcisi var; öğrenci özellikleri yok.
 * Akış: ?t=<davet belirteci> → davet bilgisi → (hesap yoksa) veli kaydı | (varsa) giriş + kabul → panel.
 * Panel: GET /api/veli/panel → çocuk başına salt-okunur özet. Premium: çocuğun hesabına ödeme bildirimi (yönetici onayı aynı).
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var AG = "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  function istek(yontem, yol, govde) {
    return fetch(yol, { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: govde ? JSON.stringify(govde) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.durum = r.status; if (j.ok === undefined) j.ok = r.ok; return j; }); },
        function () { return { ok: false, durum: 0, error: AG }; });
  }
  function uyari(el, metin, tur) {
    if (!metin) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false; el.textContent = metin;
    el.className = "form-alert" + (tur === "ok" ? " is-ok" : "");
  }
  function alanHata(onek, hatalar, alanlar) {
    var ilk = null;
    alanlar.forEach(function (k) {
      var e = $(onek + "-" + k + "-err"), i = $(onek + "-" + k), m = hatalar && hatalar[k];
      if (e) e.textContent = m || "";
      if (i) { if (m) { i.setAttribute("aria-invalid", "true"); ilk = ilk || i; } else i.removeAttribute("aria-invalid"); }
    });
    return ilk;
  }
  function mesgul(btn, acik, metin) {
    if (acik) { btn.dataset.metin = btn.textContent; btn.textContent = metin || "Bekleyin…"; btn.disabled = true; }
    else { btn.textContent = btn.dataset.metin || btn.textContent; btn.disabled = false; }
  }
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  function gunMetni(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? +m[3] + " " + AYLAR[+m[2] - 1] + " " + m[1] : ""; }
  function kalanGun(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); if (!m) return null;
    var b = new Date(); b.setHours(0, 0, 0, 0);
    return Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - b) / 864e5);
  }
  function goreli(iso) {
    if (!iso) return "henüz yok";
    var d = new Date(iso), fark = Date.now() - d.getTime(), g = Math.floor(fark / 864e5);
    if (fark < 36e5) return "bir saatten az önce";
    if (g < 1) return "bugün";
    if (g === 1) return "dün";
    if (g < 7) return g + " gün önce";
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  }
  var params = new URLSearchParams(location.search);
  var DAVET = params.get("t");
  var ME = null, KONFIG = null, PANEL = null;

  function goster(id) {
    ["vp-yukleniyor", "vp-giris", "vp-panel", "vp-odeme"].forEach(function (x) { $(x).hidden = x !== id; });
  }
  function hesapCubugu() {
    $("vp-hesap").hidden = !ME;
    if (ME) $("vp-ad").textContent = ME.ad + " " + ME.soyad;
  }
  $("vp-cikis").addEventListener("click", function () {
    istek("POST", "/api/auth/logout").then(function () { location.replace("veli.html"); });
  });

  // --- Başlangıç -------------------------------------------------------------------------------
  istek("GET", "/api/public/config").then(function (c) { if (c.ok) { KONFIG = c; if (c.destekEposta) { $("vp-destek").textContent = c.destekEposta; $("vp-destek").href = "mailto:" + c.destekEposta; } } });
  istek("GET", "/api/me").then(function (j) {
    ME = j.ok && j.user ? j.user : null;
    hesapCubugu();
    if (DAVET) return davetAkisi();
    if (!ME) return girisGoster(null);
    if (ME.rol !== "veli") return ogrenciUyarisi();
    panelYukle();
  });

  function ogrenciUyarisi() {
    goster("vp-giris");
    $("vp-giris-baslik").textContent = "Bu sayfa veliler içindir";
    $("vp-giris-lead").innerHTML = "Şu an bir öğrenci hesabıyla giriş yapılmış. Veli panelini kullanmak için önce çıkış yapın. Öğrenciysen: velini <a href=\"profil.html#veli\">Profil › Velin</a> bölümünden davet edebilirsin.";
    $("vp-kabul").hidden = false;
    $("vp-kabul-btn").textContent = "Çıkış yap";
    $("vp-kabul-btn").onclick = function () { istek("POST", "/api/auth/logout").then(function () { location.reload(); }); };
  }

  function girisGoster(davet) {
    goster("vp-giris");
    $("vp-login").hidden = false;
    if (davet) $("vl-eposta").value = davet.eposta;
    $("vl-eposta").focus();
  }
  $("vp-login").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("vl-btn");
    mesgul(btn, true, "Giriş yapılıyor…");
    istek("POST", "/api/auth/login", { kimlik: $("vl-eposta").value, sifre: $("vl-sifre").value }).then(function (j) {
      mesgul(btn, false);
      if (!j.ok) { uyari($("vp-giris-alert"), j.error || "E-posta veya şifre hatalı."); $("vp-giris-alert").focus(); return; }
      ME = j.user; hesapCubugu();
      if (ME.rol !== "veli") { $("vp-login").hidden = true; uyari($("vp-giris-alert"), ""); return ogrenciUyarisi(); }
      if (DAVET) return kabulEt();
      panelYukle();
    });
  });

  // --- Davet ------------------------------------------------------------------------------------
  function davetAkisi() {
    istek("GET", "/api/public/veli-davet?t=" + encodeURIComponent(DAVET)).then(function (j) {
      goster("vp-giris");
      if (!j.ok) {
        $("vp-giris-baslik").textContent = "Davet bağlantısı geçersiz";
        $("vp-giris-lead").textContent = j.error || "Bu bağlantının süresi dolmuş ya da daha önce kullanılmış. Öğrenciden yeni bir davet isteyin.";
        if (ME && ME.rol === "veli") { $("vp-kabul").hidden = false; $("vp-kabul-btn").textContent = "Panelime git"; $("vp-kabul-btn").onclick = function () { location.replace("veli.html"); }; }
        else if (!ME) $("vp-login").hidden = false;
        return;
      }
      var d = j.davet, ad = d.ogrenci.ad + " " + d.ogrenci.soyad;
      $("vp-giris-baslik").textContent = ad + " sizi veli olarak ekledi";
      $("vp-giris-lead").textContent = "Bağlandığınızda haftalık çalışma süresini, çözülen soruları, doğruluğu, ders ilerlemesini, deneme sonuçlarını, yaklaşan AP tarihlerini ve Premium durumunu görürsünüz. Öğrencinin soruları, yazışmaları ve notları paylaşılmaz; öğrenci bağlantıyı istediği an kaldırabilir.";
      $("vk-ogrenci-ad").textContent = ad;
      if (ME && ME.rol === "veli") {
        $("vp-kabul").hidden = false;
        $("vp-kabul-btn").onclick = kabulEt;
        return;
      }
      if (ME) return ogrenciUyarisi();
      if (d.hesapVar) {
        uyari($("vp-giris-alert"), "Bu e-posta ile bir hesabınız var. Giriş yapınca davet kabul edilir.", "ok");
        return girisGoster(d);
      }
      $("vp-kayit").hidden = false;
      $("vk-eposta").value = d.eposta;
      $("vk-ad").focus();
    });
  }
  function kabulEt() {
    var btn = $("vp-kabul-btn");
    btn.disabled = true;
    istek("POST", "/api/veli/kabul", { t: DAVET }).then(function (j) {
      btn.disabled = false;
      if (!j.ok) { $("vp-login").hidden = true; uyari($("vp-giris-alert"), j.error || "Davet kabul edilemedi."); $("vp-giris-alert").focus(); return; }
      history.replaceState(null, "", "veli.html");
      DAVET = null;
      panelYukle("Bağlantı kuruldu.");
    });
  }
  var KAYIT_ALANLAR = ["ad", "soyad", "sifre", "sifre2", "veliRiza", "kvkk", "kosullar"];
  $("vp-kayit").addEventListener("submit", function (e) {
    e.preventDefault();
    var b = { t: DAVET, ad: $("vk-ad").value, soyad: $("vk-soyad").value, sifre: $("vk-sifre").value, sifre2: $("vk-sifre2").value,
      veliRiza: $("vk-veliRiza").checked, kvkk: $("vk-kvkk").checked, kosullar: $("vk-kosullar").checked };
    var h = {};
    if (!b.ad.trim()) h.ad = "Adınızı yazın.";
    if (!b.soyad.trim()) h.soyad = "Soyadınızı yazın.";
    if (b.sifre.length < 8) h.sifre = "Şifre en az 8 karakter olmalı."; else if (b.sifre !== b.sifre2) h.sifre2 = "Şifreler eşleşmiyor.";
    if (!b.veliRiza) h.veliRiza = "Devam etmek için onaylayın.";
    if (!b.kvkk) h.kvkk = "Devam etmek için onaylayın.";
    if (!b.kosullar) h.kosullar = "Devam etmek için kabul edin.";
    var ilk = alanHata("vk", h, KAYIT_ALANLAR);
    if (ilk) { ilk.focus(); return; }
    var btn = $("vk-btn");
    mesgul(btn, true, "Hesap açılıyor…");
    istek("POST", "/api/veli/kayit", b).then(function (j) {
      mesgul(btn, false);
      if (!j.ok) {
        var f = alanHata("vk", j.errors || {}, KAYIT_ALANLAR);
        uyari($("vp-giris-alert"), j.error || AG);
        (f || $("vp-giris-alert")).focus();
        return;
      }
      ME = j.user; hesapCubugu();
      history.replaceState(null, "", "veli.html");
      DAVET = null;
      panelYukle("Hoş geldiniz! Veli hesabınız açıldı ve bağlantı kuruldu.");
    });
  });

  // --- Panel -----------------------------------------------------------------------------------
  var SECILI = null;
  function panelYukle(mesaj) {
    goster("vp-yukleniyor");
    istek("GET", "/api/veli/panel").then(function (j) {
      if (j.durum === 401) { ME = null; hesapCubugu(); return girisGoster(null); }
      if (!j.ok) { goster("vp-giris"); uyari($("vp-giris-alert"), j.error || AG); return; }
      PANEL = j;
      ME = Object.assign(ME || {}, j.veli); hesapCubugu();
      goster("vp-panel");
      $("vp-baslik").textContent = "Merhaba " + j.veli.ad;
      var cs = j.cocuklar || [];
      $("vp-bos").hidden = cs.length > 0;
      if (!SECILI || !cs.some(function (c) { return c.id === SECILI; })) SECILI = cs[0] ? cs[0].id : null;
      var sec = $("vp-cocuk-sec");
      sec.hidden = cs.length < 2;
      sec.innerHTML = cs.map(function (c) {
        return '<button type="button" class="vp-sekme" aria-pressed="' + (c.id === SECILI) + '" data-cocuk="' + esc(c.id) + '">' + esc(c.ad) + '</button>';
      }).join("");
      sec.querySelectorAll("[data-cocuk]").forEach(function (b) { b.addEventListener("click", function () { SECILI = b.getAttribute("data-cocuk"); panelCiz(); sec.querySelectorAll("[data-cocuk]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); }); });
      panelCiz(mesaj);
      $("vp-baslik").focus();
    });
  }

  function puanCubugu(d) {
    // 1–5 ölçeği: tahmini puan dolgusu + hedef işareti
    var t = d.tahmini, h = d.hedef;
    var dolu = t ? (t / 5 * 100) : 0, hedefYuzde = h ? (h / 5 * 100) : null;
    var durum = t == null ? "Henüz tahmin için yeterli veri yok" : h ? (t >= h ? "Hedefte" : "Hedefe " + (h - t) + " puan") : "Tahmini puan " + t;
    return '<div class="vp-ders">' +
      '<div class="vp-ders-ust"><strong>' + esc(d.ad) + '</strong><span class="vp-ders-durum' + (t != null && h && t >= h ? " is-iyi" : "") + '">' + esc(durum) + '</span></div>' +
      '<div class="vp-olcek" role="img" aria-label="' + esc(d.ad + ": tahmini puan " + (t == null ? "yok" : t) + (h ? ", hedef " + h : "") + " (1–5 ölçeği)") + '">' +
        '<span class="vp-olcek-dolu" style="width:' + dolu + '%"></span>' +
        (hedefYuzde !== null ? '<span class="vp-olcek-hedef" style="left:' + hedefYuzde + '%"></span>' : "") +
        '<span class="vp-olcek-cizgi" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>' +
      '<div class="vp-ders-alt"><span>Tahmini ' + (t == null ? "–" : t) + (h ? " · Hedef " + h : "") + '</span><span>' +
        [d.dogruluk != null ? "Doğruluk %" + d.dogruluk : "", d.kapsam != null ? "Soru bankası %" + d.kapsam : "", d.cevap ? d.cevap + " cevap" : "Henüz başlanmadı"].filter(Boolean).join(" · ") +
      '</span></div></div>';
  }

  function panelCiz(mesaj) {
    var c = (PANEL.cocuklar || []).filter(function (x) { return x.id === SECILI; })[0];
    var kap = $("vp-cocuklar");
    if (!c) { kap.innerHTML = ""; return; }
    var h = c.hafta, u = c.uyelik;
    var tarihler = c.tarihler.slice(0, 6).map(function (t) {
      var k = t.gun ? kalanGun(t.gun) : null;
      return '<li><span class="vp-tarih-gun">' + esc(t.gun ? gunMetni(t.gun) : t.ay) + '</span><span class="vp-tarih-ad">' + esc(t.baslik) +
        (t.tur === "kayit" ? ' <small>(okulun AP koordinatörü üzerinden)</small>' : "") + '</span><span class="vp-tarih-kalan">' +
        esc(k == null ? "tarih henüz açıklanmadı" : k === 0 ? "bugün" : k + " gün kaldı") + '</span></li>';
    }).join("");
    var denemeler = c.denemeler.map(function (d) {
      return '<li><div class="u-min0"><strong>' + esc(d.ad) + '</strong><span>' + esc(new Date(d.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })) +
        (d.soru ? " · " + d.dogru + "/" + d.soru + " doğru" : "") + (d.sureDk ? " · " + d.sureDk + " dk" : "") + '</span></div>' +
        '<span class="vp-deneme-yuzde">%' + esc(d.yuzde) + '</span>' + (d.tahminiPuan != null ? '<span class="vp-bant" title="Tahmini AP puanı">' + d.tahminiPuan + '</span>' : "") + '</li>';
    }).join("");
    var premium = u.premium
      ? '<p class="vp-premium-durum is-acik">Premium açık · bitiş ' + esc(new Date(u.bitis).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })) + '</p>'
      : '<p class="vp-premium-durum">Ücretsiz plan: her dersin ilk üniteleri ve ders başına bir deneme.</p>';
    if (u.bekleyenTalep) premium += '<p class="vp-not">Ödeme bildirimi alındı (' + esc(u.bekleyenTalep.plan === "yillik" ? "yıllık" : "aylık") + ' plan); onay bekleniyor.</p>';
    kap.innerHTML =
      (mesaj ? '<div class="form-alert is-ok" role="status">' + esc(mesaj) + '</div>' : "") +
      '<section class="vp-kart vp-ozet" aria-labelledby="vc-ad">' +
        '<div class="vp-cocuk-bas"><span class="vp-avatar" aria-hidden="true">' + esc((c.ad[0] || "") + (c.soyad[0] || "")) + '</span><div class="u-min0"><h2 id="vc-ad">' + esc(c.ad + " " + c.soyad) + '</h2>' +
        '<p>' + esc([c.sinif && /^\d+$/.test(c.sinif) ? c.sinif + ". sınıf" : "", "AP sınavları: Mayıs " + c.sinavYili, "Son etkinlik: " + goreli(c.sonAktif)].filter(Boolean).join(" · ")) + '</p></div></div>' +
        '<h3 class="vp-alt-baslik">Bu hafta</h3>' +
        '<dl class="vp-sayilar">' +
          '<div><dt>Çalışma süresi <small>(tahmini)</small></dt><dd>' + (h.calismaDk >= 60 ? Math.floor(h.calismaDk / 60) + " sa " + (h.calismaDk % 60) + " dk" : h.calismaDk + " dk") + '</dd></div>' +
          '<div><dt>Çözülen soru</dt><dd>' + h.soru + '</dd></div>' +
          '<div><dt>Doğruluk</dt><dd>' + (h.dogruluk == null ? "–" : "%" + h.dogruluk) + '</dd></div>' +
          '<div><dt>Çalışma serisi</dt><dd>' + c.seri + ' gün</dd></div>' +
        '</dl>' +
        '<p class="vp-not">Toplam ' + c.toplam.soru + ' soru' + (c.toplam.dogruluk != null ? ' · genel doğruluk %' + c.toplam.dogruluk : "") + (h.deneme ? ' · bu hafta ' + h.deneme + ' deneme' : "") + '. Süre, çözülen soru (soru başına ~1,5 dk) ve deneme sürelerinden tahmin edilir.</p>' +
      '</section>' +
      '<div class="vp-izgara">' +
        '<section class="vp-kart" aria-labelledby="vc-dersler"><h2 id="vc-dersler">Derslere göre hedef</h2>' +
          (c.dersler.length ? c.dersler.map(puanCubugu).join("") : '<p class="vp-not">Öğrenci henüz ders seçmedi ve soru çözmedi.</p>') +
          '<p class="vp-not">Tahmini puan 1–5 ölçeğindedir: son ders denemesinden, deneme yoksa en az 10 sorunun doğruluğundan hesaplanır. Kesin sonuç değildir.</p></section>' +
        '<section class="vp-kart" aria-labelledby="vc-deneme"><h2 id="vc-deneme">Son denemeler</h2>' +
          (denemeler ? '<ul class="vp-denemeler">' + denemeler + '</ul>' : '<p class="vp-not">Henüz deneme çözülmedi.</p>') + '</section>' +
        '<section class="vp-kart" aria-labelledby="vc-tarih"><h2 id="vc-tarih">Yaklaşan tarihler</h2>' +
          (tarihler ? '<ul class="vp-tarihler">' + tarihler + '</ul>' : '<p class="vp-not">Yaklaşan kayıtlı tarih yok.</p>') +
          '<p class="vp-not">AP sınavına kayıt (sipariş), öğrencinin sınava gireceği okulun AP koordinatörü üzerinden yapılır.</p></section>' +
        '<section class="vp-kart vp-premium" aria-labelledby="vc-premium"><h2 id="vc-premium">Üyelik</h2>' + premium +
          (u.bekleyenTalep ? "" : '<button type="button" class="btn-primary" id="vc-premium-btn">' + (u.premium ? "Premium’u uzat" : "Premium al") + '</button>') + '</section>' +
      '</div>' +
      '<section class="vp-kart vp-ayarlar" aria-labelledby="vc-ayar"><h2 id="vc-ayar">Ayarlar</h2>' +
        '<label class="check-row"><input type="checkbox" id="vc-rapor"' + (c.rapor ? " checked" : "") + '> <span>Her pazar akşamı bu özeti e-postayla gönder</span></label>' +
        '<p class="form-alert" id="vc-ayar-alert" role="status" hidden></p>' +
        '<details class="u-mt-2"><summary class="link-btn">Bu öğrenciyle bağlantımı kaldır</summary><p class="vp-not">Kaldırırsanız bu öğrencinin özetini göremezsiniz; yeniden bağlanmak için öğrencinin yeni davet göndermesi gerekir.</p>' +
        '<button type="button" class="btn-ghost btn-danger btn-sm" id="vc-ayril">Bağlantıyı kaldır</button></details></section>';
    var pb = $("vc-premium-btn");
    if (pb) pb.addEventListener("click", function () { odemeGoster(c); });
    $("vc-rapor").addEventListener("change", function () {
      var cb = this;
      istek("POST", "/api/veli/cocuk/" + encodeURIComponent(c.id) + "/rapor", { rapor: cb.checked }).then(function (j) {
        if (!j.ok) { cb.checked = !cb.checked; uyari($("vc-ayar-alert"), j.error || AG); return; }
        c.rapor = j.rapor;
        uyari($("vc-ayar-alert"), j.rapor ? "Haftalık e-posta açık." : "Haftalık e-posta kapatıldı.", "ok");
      });
    });
    $("vc-ayril").addEventListener("click", function () {
      if (!window.confirm(c.ad + " ile bağlantınız kaldırılsın mı?")) return;
      istek("POST", "/api/veli/cocuk/" + encodeURIComponent(c.id) + "/ayril").then(function (j) { if (j.ok) { SECILI = null; panelYukle("Bağlantı kaldırıldı."); } else uyari($("vc-ayar-alert"), j.error || AG); });
    });
  }

  // --- Premium (çocuğun hesabına) -------------------------------------------------------------------
  var ODEME_COCUK = null;
  function odemeGoster(c) {
    ODEME_COCUK = c;
    goster("vp-odeme");
    $("vp-odeme-baslik").textContent = c.ad + " için Premium";
    $("vp-odeme-lead").textContent = "Premium ile tüm ünitelere, sınırsız ders denemesine, genel denemeye ve sınırsız soru sormaya erişilir. Ödemeyi havale/EFT ile yapıp burada bildirin; onaylanınca Premium öğrencinin hesabında (" + c.ad + ") otomatik açılır.";
    var planlar = (KONFIG && KONFIG.planlar) || [];
    $("vp-planlar").innerHTML = planlar.map(function (p, i) {
      return '<label class="vp-plan"><input type="radio" name="vo-plan" value="' + esc(p.id) + '"' + ((p.oneCikan || (!planlar.some(function (x) { return x.oneCikan; }) && i === 0)) ? " checked" : "") + '>' +
        '<span><strong>' + esc(p.ad) + ' · ' + esc(p.fiyat) + ' ₺</strong><small>' + esc(p.aciklama || p.donem || "") + '</small></span></label>';
    }).join("") || '<p class="vp-not">Planlar yüklenemedi; sayfayı yenileyin.</p>';
    var b = (KONFIG && KONFIG.banka) || {};
    $("vb-iban").textContent = b.iban || "—";
    $("vb-sahip").textContent = b.hesapSahibi || "—";
    $("vb-banka").textContent = b.banka || "—";
    $("vb-aciklama").textContent = c.ad + " " + c.soyad + " · Meberra";
    $("vo-odeyenAd").value = ME ? (ME.ad + " " + ME.soyad) : "";
    uyari($("vp-odeme-alert"), "");
    $("vp-odeme-baslik").focus();
  }
  $("vp-odeme-geri").addEventListener("click", function () { panelYukle(); });
  $("vp-odeme-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var plan = (document.querySelector('input[name="vo-plan"]:checked') || {}).value;
    var h = {};
    if (!plan) h.plan = "Bir plan seçin.";
    if (!$("vo-odeyenAd").value.trim()) h.odeyenAd = "Ödemeyi yapan kişinin adını yazın.";
    if (!$("vo-sozlesme").checked) h.sozlesme = "Devam etmek için onaylayın.";
    var ilk = alanHata("vo", h, ["plan", "odeyenAd", "sozlesme"]);
    if (ilk) { ilk.focus(); return; }
    var btn = $("vo-btn");
    mesgul(btn, true, "Bildiriliyor…");
    istek("POST", "/api/veli/cocuk/" + encodeURIComponent(ODEME_COCUK.id) + "/premium-talep", { plan: plan, odeyenAd: $("vo-odeyenAd").value.trim(), aciklama: $("vo-aciklama").value.trim() }).then(function (j) {
      mesgul(btn, false);
      if (!j.ok) { alanHata("vo", j.errors || {}, ["plan", "odeyenAd"]); uyari($("vp-odeme-alert"), j.error || AG); $("vp-odeme-alert").focus(); return; }
      panelYukle("Ödeme bildiriminiz alındı. Kontrol edilip onaylanınca Premium öğrencinin hesabında (" + ODEME_COCUK.ad + ") açılır; genelde 1 iş günü.");
    });
  });
})();
