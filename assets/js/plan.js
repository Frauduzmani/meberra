/**
 * Meberra 1.18.0 — Çalışma planım (/plan) ve "Bu haftanın planı" küçük kartı.
 * Veri: GET /api/plan · PUT /api/plan/ayar {saat} · POST /api/plan/gorev/:id {tamam}. Hesap sunucuda (server/plan.js +
 * assets/js/plan-motor.js); bu dosya yalnızca çizer. Kitaplık yok.
 *
 * Küçük kart (Bugün / veli sayfalarına yerleştirmek için):
 *   window.MeberraPlan.buHafta(el)   → el içine kompakt "Bu haftanın planı" kartı çizer (Promise). Gerekenler: plan.css,
 *                                       plan-motor.js, plan.js. Görevler kartta da işaretlenebilir.
 *   window.MeberraPlan.yenile()      → /plan sayfasını ve yerleştirilmiş kartları yeniden yükler.
 */
(function () {
  "use strict";
  var M = window.MeberraPlanMotor || null;
  var kartlar = [];      // buHafta() ile çizilen yerler
  var sonPlan = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function azHareket() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function api(yontem, yol, govde) {
    var h = { Accept: "application/json" };
    if (yontem !== "GET") { h["Content-Type"] = "application/json"; h["X-Meberra"] = "1"; }
    return fetch(yol, { method: yontem, credentials: "same-origin", headers: h, body: govde === undefined ? undefined : JSON.stringify(govde) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.__durum = r.status; return j; }); });
  }
  var AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  function kisaTarih(g) { var p = String(g || "").split("-"); return p.length === 3 ? +p[2] + " " + AY_KISA[+p[1] - 1] : ""; }
  function uzunTarih(g, yil) { return M ? M.trTarih(g, yil) : g; }
  function aralik(a, b) { return kisaTarih(a) + " – " + kisaTarih(b); }

  // Basit, dolgusuz ikonlar (currentColor; 20×20)
  var YOL_SVG = {
    unite: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H16v12H5.5A1.5 1.5 0 0 0 4 16.5zM4 16.5A1.5 1.5 0 0 0 5.5 18H16"/>',
    tekrar: '<path d="M4 10a6 6 0 0 1 10.2-4.2L16 7.5M16 3.5v4h-4M16 10a6 6 0 0 1-10.2 4.2L4 12.5M4 16.5v-4h4"/>',
    deneme: '<path d="M7 3.5h6M7.5 2.5h5v2h-5zM5 4h10v13.5H5zM8 9h4M8 12.5h4"/>',
    frq: '<path d="M4 16l1-4L13.5 3.5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L8 15zM11.5 5.5l3 3"/>',
    tam: '<path d="M10 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 7.5V11l2.5 1.5M8 2h4"/>',
    onde: '<path d="M4 13l4-4 3 3 5-6M12 6h4v4"/>', yolunda: '<path d="M4 10.5l4 4 8-9"/>', geride: '<path d="M10 6v5M10 14h.01M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/>',
    kilit: '<path d="M6 9V7a4 4 0 1 1 8 0v2M5 9h10v8H5z"/>', tik: '<path d="M5 10.5l3.5 3.5L15 7"/>'
  };
  function ikon(ad, sinif) { return '<svg class="pl-ikon ' + (sinif || "") + '" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (YOL_SVG[ad] || "") + "</svg>"; }

  function durumChip(d) {
    if (!d) return "";
    return '<span class="pl-durum is-' + esc(d.durum) + '">' + ikon(d.durum) + "<span>" + esc(d.metin) + "</span></span>";
  }

  // ---- görev kartı ------------------------------------------------------------------------------------------------
  function gorevHtml(g, o) {
    o = o || {};
    var duz = !!o.saltOkunur;
    var meta = [g.aciklama, g.dk ? "~" + g.dk + " dk" : ""].filter(Boolean).join(" · ");
    var rozet = (g.kilitli ? '<span class="pl-rozet is-premium">' + ikon("kilit") + "Premium ile</span>" : "") +
      (g.devir ? '<span class="pl-rozet is-devir">Geçen haftadan</span>' : "");
    var onay = duz ? '<span class="pl-onay is-duz" aria-hidden="true">' + ikon("tik") + "</span>"
      : '<button type="button" class="pl-onay" role="checkbox" aria-checked="' + (g.tamam ? "true" : "false") + '" data-id="' + esc(g.id) + '" aria-label="' + esc((g.tamam ? "Tamamlandı: " : "Tamamlandı olarak işaretle: ") + g.baslik) + '">' + ikon("tik") + "</button>";
    return '<li class="pl-gorev' + (g.tamam ? " is-tamam" : "") + '" data-id="' + esc(g.id) + '">' + onay +
      '<div class="pl-gorev-govde"><div class="pl-gorev-ust"><span class="pl-tur is-' + esc(g.tur) + '">' + ikon(g.tur) + esc(g.turAd) + '</span><span class="pl-gorev-ders">' + esc(g.dersAd) + "</span>" + rozet + "</div>" +
      '<h3 class="pl-gorev-baslik">' + esc(g.baslik) + "</h3>" + (o.kompakt ? "" : '<p class="pl-gorev-meta">' + esc(meta) + "</p>") + "</div>" +
      (g.link && !duz ? '<a class="' + (g.tamam ? "btn-ghost" : "btn-primary") + ' btn-sm pl-git" href="' + esc(g.link) + '">' + (g.tamam ? "Aç" : "Başla") + '<span class="visually-hidden">: ' + esc(g.baslik) + "</span></a>" : "") +
      "</li>";
  }

  // ---- hero -------------------------------------------------------------------------------------------------------
  function heroCiz(p) {
    var el = document.getElementById("pl-hero"); if (!el) return;
    el.removeAttribute("aria-busy");
    if (p.bos) {
      var ders = p.bos === "ders-yok";
      el.innerHTML = '<div class="pl-hero-sayac"><span class="pl-sayi">–</span></div><div class="pl-hero-metin"><h2>' +
        (ders ? "Önce derslerini seç" : "Bu dönemin sınavları bitti") + "</h2><p>" +
        (ders ? "Planı kurmak için hangi AP derslerine gireceğini ve hedef puanını profilinde seç." : "Yeni sınav yılını profilinden seçersen plan yeniden kurulur.") +
        '</p><p><a class="btn-primary" href="/profil">Profilime git</a></p></div>';
      return;
    }
    var e = p.enYakin || {}, kesin = e.kesin && e.gun;
    var sayi = kesin ? '<span class="pl-sayi">' + esc(e.kalanGun) + '</span><span class="pl-birim">gün</span>'
      : '<span class="pl-sayi is-yazi">' + esc(e.etiket) + "</span>";
    var digerleri = (p.sinavlar || []).map(function (s) {
      return '<li><span class="pl-s-ad">AP ' + esc(s.ad) + "</span> " + (s.kesin ? esc(uzunTarih(s.gun, false)) : esc(s.etiket) + " · tarih açıklanmadı") + "</li>";
    }).join("");
    el.innerHTML = '<div class="pl-hero-sayac">' + sayi + "</div>" +
      '<div class="pl-hero-metin"><p class="pl-hero-ust">' + (kesin ? "En yakın sınavın: <strong>AP " + esc(e.ad) + "</strong> · " + esc(uzunTarih(e.gun)) : "Sınav dönemi: <strong>" + esc(e.etiket) + "</strong> — College Board kesin günü henüz açıklamadı") + "</p>" +
      '<div class="pl-hero-durum">' + durumChip(p.durum) + '<span class="pl-hero-yuk">Haftada ' + esc(p.gorevSayisi) + " görev · " + esc(p.saat) + " saat</span></div>" +
      (digerleri ? '<ul class="pl-sinav-liste" aria-label="Sınav günlerin">' + digerleri + "</ul>" : "") + "</div>";
  }

  // ---- bu hafta ---------------------------------------------------------------------------------------------------
  function gorevlerCiz(p) {
    var ol = document.getElementById("pl-gorevler"); if (!ol) return;
    ol.removeAttribute("aria-busy");
    var h = p.haftalar && p.haftalar[0], alt = document.getElementById("pl-hafta-alt");
    if (!h) { ol.innerHTML = '<li class="pl-bos">Bu hafta için görev yok.</li>'; if (alt) alt.textContent = ""; return; }
    var biten = h.gorevler.filter(function (g) { return g.tamam; }).length;
    if (alt) alt.innerHTML = esc(aralik(h.bas, h.bit)) + ' · <strong class="h-sayac">' + biten + "/" + h.gorevler.length + "</strong> tamam" + (h.evre === "tekrar" ? " · yalnızca tekrar haftası" : h.evre === "deneme" ? " · tam sınav dönemi" : "");
    ol.innerHTML = h.gorevler.map(function (g) { return gorevHtml(g); }).join("");
  }

  // ---- sınava giden yol (zaman çizelgesi) --------------------------------------------------------------------------
  var EVRE_AD = { calisma: "Konu çalışma", deneme: "Tam sınav dönemi", tekrar: "Yalnızca tekrar" };
  var seciliHafta = 0;
  function yolCiz(p) {
    var kap = document.getElementById("pl-yol"); if (!kap) return;
    var hl = p.haftalar || [];
    if (!hl.length) { kap.innerHTML = '<p class="pl-bos">Plan kurulunca haftaların burada görünür.</p>'; return; }
    var ilk = true;
    try { ilk = !sessionStorage.getItem("pl:cizildi"); sessionStorage.setItem("pl:cizildi", "1"); } catch (e) { /* özel pencere */ }
    var oncekiAy = null;
    var li = hl.map(function (h, i) {
      var ay = h.bas.slice(0, 7), ayEtiket = ay !== oncekiAy ? AY_KISA[+h.bas.slice(5, 7) - 1] + (h.bas.slice(5, 7) === "01" || i === 0 ? " ’" + h.bas.slice(2, 4) : "") : "";
      oncekiAy = ay;
      var taslar = h.kilometre.map(function (k) { return '<span class="pl-tas is-' + esc(k.tur) + '" title="' + esc(uzunTarih(k.gun) + " · " + k.ad) + '"></span>'; }).join("");
      var tasMetin = h.kilometre.map(function (k) { return uzunTarih(k.gun, false) + ": " + k.ad; }).join("; ");
      var etiket = aralik(h.bas, h.bit) + ", " + h.gorevler.length + " görev, " + EVRE_AD[h.evre] + (i === 0 ? ", bu hafta" : "") + (tasMetin ? ". " + tasMetin : "");
      return '<li class="pl-h is-' + esc(h.evre) + (i === 0 ? " is-bugun" : "") + (i === seciliHafta ? " is-secili" : "") + '" style="--sira:' + Math.min(i, 40) + ";--n:" + h.gorevler.length + '">' +
        '<button type="button" class="pl-h-dugme" data-i="' + i + '" aria-pressed="' + (i === seciliHafta) + '" aria-label="' + esc(etiket) + '" data-ipucu="' + esc(etiket) + '">' +
        '<span class="pl-h-ay" aria-hidden="true">' + esc(ayEtiket) + "</span>" +
        '<span class="pl-h-taslar" aria-hidden="true">' + taslar + "</span>" +
        '<span class="pl-h-cubuk" aria-hidden="true"></span>' +
        '<span class="pl-h-tarih" aria-hidden="true">' + esc(kisaTarih(h.bas)) + "</span>" +
        '<span class="pl-h-liste" aria-hidden="true"><strong>' + h.gorevler.length + " görev</strong>" + (tasMetin ? " · " + esc(tasMetin) : "") + "</span>" +
        "</button></li>";
    }).join("");
    kap.innerHTML = '<div class="pl-yol-kaydir" tabindex="0" aria-label="Haftalar (yatay kaydırılır)"><ol class="pl-hafta-list' + (ilk && !azHareket() ? " pl-ciz" : "") + '" id="pl-hafta-list">' + li + "</ol></div>" +
      '<div class="pl-ipucu" id="pl-ipucu" role="tooltip" hidden></div>' +
      '<div class="pl-hafta-detay" id="pl-hafta-detay" aria-live="polite"></div>';
    var list = document.getElementById("pl-hafta-list");
    if (list && list.classList.contains("pl-ciz")) requestAnimationFrame(function () { requestAnimationFrame(function () { list.classList.add("is-cizildi"); }); });
    else if (list) list.classList.add("is-cizildi");
    detayCiz(p);
    var not = document.getElementById("pl-yol-not");
    if (not) {
      var bel = (p.sinavlar || []).filter(function (s) { return !s.kesin; });
      not.textContent = (bel.length ? bel.map(function (s) { return "AP " + s.ad; }).join(", ") + ": kesin sınav günü açıklanmadı; plan Mayıs başına göre kuruldu. " : "") +
        "Gelecek haftalar her açılışta ilerlemene göre yeniden hesaplanır.";
    }
  }
  function detayCiz(p) {
    var el = document.getElementById("pl-hafta-detay"), h = p.haftalar[seciliHafta]; if (!el || !h) return;
    el.innerHTML = '<h3 class="pl-detay-baslik">' + (seciliHafta === 0 ? "Bu hafta" : seciliHafta + 1 + ". hafta") + " · " + esc(aralik(h.bas, h.bit)) + ' <span class="pl-evre-etiket is-' + esc(h.evre) + '">' + esc(EVRE_AD[h.evre]) + "</span></h3>" +
      (h.kilometre.length ? '<ul class="pl-detay-tas">' + h.kilometre.map(function (k) { return '<li><i class="pl-im-tas" aria-hidden="true"></i>' + esc(uzunTarih(k.gun)) + " · " + esc(k.ad) + "</li>"; }).join("") + "</ul>" : "") +
      '<ol class="pl-gorevler is-kompakt">' + h.gorevler.map(function (g) { return gorevHtml(g, { kompakt: true, saltOkunur: seciliHafta > 0 }); }).join("") + "</ol>" +
      (seciliHafta > 0 ? '<p class="pl-not">Bu hafta geldiğinde ilerlemene göre güncellenir.</p>' : "");
  }
  function ipucuBagla() {
    var kap = document.getElementById("pl-yol"); if (!kap || kap.__bagli) return; kap.__bagli = true;
    function goster(b) {
      var ip = document.getElementById("pl-ipucu"); if (!ip || !b) return;
      ip.textContent = b.getAttribute("data-ipucu"); ip.hidden = false;
      var kr = kap.getBoundingClientRect(), br = b.getBoundingClientRect();
      var x = Math.max(8, Math.min(kr.width - ip.offsetWidth - 8, br.left - kr.left + br.width / 2 - ip.offsetWidth / 2));
      ip.style.transform = "translate(" + Math.round(x) + "px," + Math.round(br.top - kr.top - ip.offsetHeight - 6) + "px)";
    }
    function gizle() { var ip = document.getElementById("pl-ipucu"); if (ip) ip.hidden = true; }
    kap.addEventListener("pointerover", function (e) { var b = e.target.closest && e.target.closest(".pl-h-dugme"); if (b && e.pointerType !== "touch") goster(b); });
    kap.addEventListener("pointerleave", gizle);
    kap.addEventListener("focusin", function (e) { var b = e.target.closest && e.target.closest(".pl-h-dugme"); if (b) goster(b); });
    kap.addEventListener("focusout", gizle);
    kap.addEventListener("keydown", function (e) { if (e.key === "Escape") gizle(); });
    kap.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".pl-h-dugme"); if (!b || !sonPlan) return;
      seciliHafta = +b.getAttribute("data-i") || 0;
      kap.querySelectorAll(".pl-h").forEach(function (l, i) { l.classList.toggle("is-secili", i === seciliHafta); l.firstChild.setAttribute("aria-pressed", String(i === seciliHafta)); });
      detayCiz(sonPlan);
    });
  }

  // ---- ayarlar ----------------------------------------------------------------------------------------------------
  function ayarCiz(p) {
    var r = document.querySelectorAll('input[name="pl-saat"]');
    r.forEach(function (x) { x.checked = +x.value === +p.saat; });
    var ul = document.getElementById("pl-dersler");
    if (ul) ul.innerHTML = (p.dersler || []).length ? p.dersler.map(function (d) {
      return "<li><strong>" + esc(d.tamAd) + "</strong> · hedef " + esc(d.hedef) + (d.kilitliUnite && !p.premium ? ' · <span class="pl-yardim">' + d.kilitliUnite + " ünite Premium ile</span>" : "") + "</li>";
    }).join("") : '<li class="pl-yardim">Henüz ders seçmedin.</li>';
  }

  // ---- küçük kart -------------------------------------------------------------------------------------------------
  function kartHtml(p) {
    if (!p) return '<div class="pl-kart surface"><p class="pl-bos">Plan şu an yüklenemedi.</p></div>';
    if (p.bos) return '<div class="pl-kart surface"><div class="pl-kart-bas"><h2>Bu haftanın planı</h2></div><p class="pl-bos">' +
      (p.bos === "ders-yok" ? "Derslerini seçince sana haftalık bir plan kuralım." : "Bu dönemin sınavları bitti.") + '</p><a class="btn-ghost btn-sm" href="' + (p.bos === "ders-yok" ? "/profil" : "/plan") + '">' + (p.bos === "ders-yok" ? "Ders seç" : "Plana git") + "</a></div>";
    var h = p.haftalar[0], biten = h.gorevler.filter(function (g) { return g.tamam; }).length, e = p.enYakin || {};
    return '<div class="pl-kart surface"><div class="pl-kart-bas"><h2>Bu haftanın planı</h2>' + durumChip(p.durum) + "</div>" +
      '<p class="pl-kart-alt">' + biten + "/" + h.gorevler.length + " tamam" + (e.kesin ? " · AP " + esc(e.ad) + " sınavına " + esc(e.kalanGun) + " gün" : e.etiket ? " · Sınav: " + esc(e.etiket) : "") + "</p>" +
      '<ol class="pl-gorevler is-kompakt">' + h.gorevler.map(function (g) { return gorevHtml(g, { kompakt: true }); }).join("") + "</ol>" +
      '<a class="btn-ghost btn-sm pl-kart-link" href="/plan">Planın tamamı</a></div>';
  }
  function buHafta(el) {
    if (!el) return Promise.resolve(null);
    if (kartlar.indexOf(el) < 0) { kartlar.push(el); el.addEventListener("click", onayTik); }
    if (!el.innerHTML.trim()) el.innerHTML = '<div class="pl-kart surface pl-kart-isk"><span class="iskelet iskelet-satir"></span><span class="iskelet iskelet-satir is-kisa"></span></div>';
    return yukle().then(function (p) { el.innerHTML = kartHtml(p); return p; });
  }

  // ---- işaretleme -------------------------------------------------------------------------------------------------
  function hepsiniCiz(p) {
    sonPlan = p;
    if (document.getElementById("pl-gorevler")) { heroCiz(p); gorevlerCiz(p); yolCiz(p); ayarCiz(p); ipucuBagla(); }
    kartlar.forEach(function (el) { el.innerHTML = kartHtml(p); });
  }
  function haftaBittiKutla(p) {
    var h = p && p.haftalar && p.haftalar[0];
    if (!h || !h.gorevler.length || !h.gorevler.every(function (g) { return g.tamam; })) return;
    var k = "pl:kutlandi:" + h.bas;
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1"); } catch (e) { return; }
    if (window.MeberraKutlama && window.MeberraKutlama.kutla) window.MeberraKutlama.kutla({ tur: "gorev", baslik: "Haftanın planı tamam!", metin: "Bu haftanın " + h.gorevler.length + " görevini bitirdin. Gelecek hafta seni bekliyor.", adet: h.gorevler.length });
  }
  function onayTik(e) {
    var b = e.target.closest && e.target.closest("button.pl-onay"); if (!b) return;
    var id = b.getAttribute("data-id"), yeni = b.getAttribute("aria-checked") !== "true";
    // iyimser güncelleme: tüm görünümlerde aynı görev
    document.querySelectorAll('button.pl-onay[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]').forEach(function (x) {
      x.setAttribute("aria-checked", String(yeni));
      var li = x.closest(".pl-gorev"); if (li) li.classList.toggle("is-tamam", yeni);
      if (yeni && !azHareket()) { x.classList.remove("h-zipla"); void x.offsetWidth; x.classList.add("h-zipla"); x.addEventListener("animationend", function () { x.classList.remove("h-zipla"); }, { once: true }); }
    });
    b.disabled = true;
    api("POST", "/api/plan/gorev/" + encodeURIComponent(id), { tamam: yeni }).then(function (j) {
      b.disabled = false;
      if (j && j.ok && j.plan) { setTimeout(function () { hepsiniCiz(j.plan); haftaBittiKutla(j.plan); }, azHareket() ? 0 : 380); }
      else yukle().then(function (p) { if (p) hepsiniCiz(p); });
    }).catch(function () { b.disabled = false; yukle().then(function (p) { if (p) hepsiniCiz(p); }); });
  }

  var yukleniyor = null;
  function yukle() {
    if (yukleniyor) return yukleniyor;
    yukleniyor = api("GET", "/api/plan").then(function (j) { yukleniyor = null; if (j && j.ok) { sonPlan = j.plan; return j.plan; } return j && j.__durum === 401 ? { __oturum: true } : null; })
      .catch(function () { yukleniyor = null; return null; });
    return yukleniyor;
  }
  function yenile() { return yukle().then(function (p) { if (p && !p.__oturum) hepsiniCiz(p); return p; }); }

  function sayfaBaslat() {
    var ol = document.getElementById("pl-gorevler"); if (!ol) return;
    ol.addEventListener("click", onayTik);
    var yol = document.getElementById("pl-yol"); if (yol) yol.addEventListener("click", onayTik);
    document.querySelectorAll('input[name="pl-saat"]').forEach(function (x) {
      x.addEventListener("change", function () {
        if (!x.checked) return;
        api("PUT", "/api/plan/ayar", { saat: +x.value }).then(function (j) { if (j && j.ok) { hepsiniCiz(j.plan); duyur("Plan haftada " + j.plan.gorevSayisi + " göreve göre yeniden kuruldu."); } });
      });
    });
    yukle().then(function (p) {
      if (!p || p.__oturum) {
        var h = document.getElementById("pl-hero");
        if (h) { h.removeAttribute("aria-busy"); h.innerHTML = '<div class="pl-hero-metin"><h2>' + (p ? "Planını görmek için giriş yap" : "Bağlantı kurulamadı") + "</h2><p>" + (p ? '<a class="btn-primary" href="/giris?donus=/plan">Giriş yap</a>' : "Biraz sonra sayfayı yenile.") + "</p></div>"; }
        ol.removeAttribute("aria-busy"); ol.innerHTML = "";
        return;
      }
      hepsiniCiz(p);
    });
    // Etkinlikten dönünce (ders sayfası, deneme) otomatik işaretler tazelensin
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") yenile(); });
    window.addEventListener("pageshow", function (e) { if (e.persisted) yenile(); });
  }
  function duyur(m) {
    var c = document.getElementById("pl-canli");
    if (!c) { c = document.createElement("div"); c.id = "pl-canli"; c.className = "visually-hidden"; c.setAttribute("aria-live", "polite"); document.body.appendChild(c); }
    c.textContent = ""; setTimeout(function () { c.textContent = m; }, 30);
  }

  window.MeberraPlan = { buHafta: buHafta, yenile: yenile };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sayfaBaslat); else sayfaBaslat();
})();
