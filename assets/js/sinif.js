/**
 * Meberra 1.19.0 — Öğrenci sınıf sayfası (sinif.html, /sinif?kod=XXXXXX).
 * Kod → sınıf bilgisi + öğretmenin göreceği/göremeyeceği bilgiler (açık liste) → onay → katıl. Sınıflarım + ödevlerim; istediğin an ayrıl.
 * Dışa açık: window.MeberraSinif.odevKarti(el) — Bugün sayfasına "Ödevlerim" kartı çizer (sınıf yoksa el gizli kalır).
 */
(function () {
  "use strict";
  var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  function istek(yontem, yol, govde) {
    return fetch(yol, { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: govde ? JSON.stringify(govde) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.durum = r.status; if (j.ok === undefined) j.ok = r.ok; return j; }); },
        function () { return { ok: false, durum: 0, error: "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene." }; });
  }
  var DURUM = { tamam: ["Tamamlandı", "ok", "✓"], devam: ["Devam ediyor", "info", "◐"], baslamadi: ["Başlamadı", "notr", "○"], gecikti: ["Gecikti", "warn", "!"] };
  function rozet(d) { var x = DURUM[d] || [d, "notr", ""]; return '<span class="ogt-durum is-' + x[1] + '"><span aria-hidden="true">' + x[2] + "</span> " + x[0] + "</span>"; }
  function tarih(iso) { return iso ? new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long" }) : ""; }
  function odevSatir(o) {
    return '<div class="snf-odev"><div><h4>' + esc(o.baslik) + "</h4><p>" + esc(o.turAd) + (o.sonTarih ? " · son gün " + esc(tarih(o.sonTarih)) : "") +
      (o.hedef > 1 ? " · " + o.ilerleme + "/" + o.hedef : "") + '</p></div><div class="snf-odev-sag">' + rozet(o.durum) +
      (o.durum !== "tamam" ? '<a class="btn-ghost btn-sm" href="' + esc(o.link) + '">Başla</a>' : "") + "</div></div>";
  }

  /** Bugün kartı: bekleyen ödevler (en çok 3). Öğrenci değilse ya da sınıf yoksa el gizli kalır. */
  function odevKarti(el) {
    if (!el) return Promise.resolve(false);
    el.hidden = true;
    return istek("GET", "/api/sinif/benim").then(function (j) {
      if (!j.ok || !j.siniflar || !j.siniflar.length) return false;
      var bek = [];
      j.siniflar.forEach(function (s) { s.odevler.forEach(function (o) { if (o.durum !== "tamam") bek.push(o); }); });
      bek.sort(function (a, b) { return String(a.sonTarih || "9999").localeCompare(String(b.sonTarih || "9999")); });
      el.innerHTML = '<h2 class="vp-alt-baslik">Ödevlerim</h2>' + (bek.length ? '<div class="snf-bugun">' + bek.slice(0, 3).map(odevSatir).join("") + "</div>" : '<p class="vp-not">Bekleyen ödevin yok.</p>') +
        '<p class="vp-not"><a href="/sinif">Tüm sınıflarım</a></p>';
      el.hidden = false;
      return true;
    });
  }
  window.MeberraSinif = { odevKarti: odevKarti };

  var $ = function (id) { return document.getElementById(id); };
  if (!$("sn-ana")) return; // başka sayfada yalnızca odevKarti kullanılır
  document.documentElement.setAttribute("data-apz-auth", "ok");
  var kod = (new URLSearchParams(location.search).get("kod") || "").trim().toUpperCase();
  var bekleyen = null;
  function uyari(m, tur) { var el = $("sn-alert"); el.hidden = !m; el.textContent = m || ""; el.className = "form-alert" + (tur === "ok" ? " is-ok" : ""); }
  function goster(id) { ["sn-yukleniyor", "sn-giris", "sn-ana"].forEach(function (x) { $(x).hidden = x !== id; }); }

  function basla() {
    istek("GET", "/api/me").then(function (m) {
      if (!m.ok) {
        goster("sn-giris");
        $("sn-giris-link").href = "/giris?donus=" + encodeURIComponent("/sinif" + (kod ? "?kod=" + kod : ""));
        return;
      }
      if (m.user.rol !== "ogrenci") { goster("sn-giris"); $("sn-giris-metin").textContent = "Sınıfa yalnızca öğrenci hesapları katılabilir."; $("sn-giris-link").hidden = true; return; }
      goster("sn-ana");
      liste();
      if (kod) kodAc(kod);
    });
  }
  function kodAc(k) {
    $("sn-kod-err").textContent = "";
    istek("GET", "/api/sinif/kod/" + encodeURIComponent(k)).then(function (j) {
      if (!j.ok) { $("sn-onay").hidden = true; $("sn-kod").value = k; $("sn-kod-err").textContent = j.error || "Kod bulunamadı."; $("sn-kod").focus(); return; }
      bekleyen = j;
      if (j.uye) { $("sn-onay").hidden = true; uyari(j.sinif.ad + " sınıfındasın."); return; }
      $("sn-onay").hidden = false;
      $("sn-onay-baslik").textContent = j.sinif.ad;
      $("sn-onay-alt").textContent = j.sinif.okul + " · " + j.sinif.dersAd + (j.sinif.ogretmen ? " · Öğretmen: " + j.sinif.ogretmen : "");
      $("sn-paylasilan").innerHTML = j.paylasilan.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
      $("sn-paylasilmayan").innerHTML = j.paylasilmayan.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
      $("sn-premium-not").textContent = j.premium.koltukVar ? "Okulunun lisansıyla Premium açılacak" + (j.premium.bitis ? " (" + tarih(j.premium.bitis) + " tarihine kadar)" : "") + ". Sınıftan ayrılırsan okul Premium'u sona erer."
        : j.premium.lisans ? "Okulunun Premium koltukları şu an dolu: sınıfa katılabilirsin, ücretsiz planla devam edersin." : "";
      $("sn-onay-kutu").checked = false;
      $("sn-onay-baslik").setAttribute("tabindex", "-1"); $("sn-onay-baslik").focus();
    });
  }
  $("sn-kod-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var k = $("sn-kod").value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(k)) { $("sn-kod-err").textContent = "Kod 6 karakter olmalı."; $("sn-kod").focus(); return; }
    kod = k; history.replaceState(null, "", "/sinif?kod=" + k); kodAc(k);
  });
  $("sn-katil").addEventListener("click", function () {
    if (!$("sn-onay-kutu").checked) { $("sn-onay-err").textContent = "Katılmak için onay kutusunu işaretle."; $("sn-onay-kutu").focus(); return; }
    $("sn-onay-err").textContent = "";
    var b = this; b.disabled = true;
    istek("POST", "/api/sinif/katil", { kod: bekleyen.sinif.kod, onay: true }).then(function (j) {
      b.disabled = false;
      if (!j.ok) { uyari(j.error); return; }
      $("sn-onay").hidden = true; uyari(j.mesaj, "ok");
      history.replaceState(null, "", "/sinif"); kod = "";
      try { window.dispatchEvent(new CustomEvent("meberra:uyelik")); } catch (x) { /* */ }
      liste();
    });
  });
  function liste() {
    istek("GET", "/api/sinif/benim").then(function (j) {
      if (!j.ok) { uyari(j.error); return; }
      $("sn-siniflar").innerHTML = j.siniflar.length ? j.siniflar.map(function (s) {
        return '<section class="vp-kart"><div class="snf-kart-bas"><div><h2>' + esc(s.ad) + "</h2><p>" + esc(s.okul + " · " + s.dersAd + (s.ogretmen ? " · " + s.ogretmen : "")) +
          (s.okulPremium ? " · Okul Premium'u açık" : "") + '</p></div><button type="button" class="btn-ghost btn-sm" data-ayril="' + s.id + '" data-ad="' + esc(s.ad) + '">Sınıftan ayrıl</button></div>' +
          '<h3 class="vp-alt-baslik" style="margin-top:16px">Ödevler</h3>' + (s.odevler.length ? s.odevler.map(odevSatir).join("") : '<p class="vp-not">Henüz ödev yok.</p>') + "</section>";
      }).join("") : '<section class="vp-kart vp-bos"><h2>Henüz bir sınıfta değilsin</h2><p>Öğretmeninden 6 karakterlik sınıf kodunu iste ve yukarıya yaz.</p></section>';
    });
  }
  $("sn-siniflar").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ayril]");
    if (!b) return;
    if (!window.confirm(b.getAttribute("data-ad") + " sınıfından ayrılmak istiyor musun? Öğretmenin artık özetini göremez; okul Premium'u varsa sona erer.")) return;
    istek("POST", "/api/sinif/" + b.getAttribute("data-ayril") + "/ayril").then(function (j) {
      if (!j.ok) { uyari(j.error); return; }
      uyari("Sınıftan ayrıldın.", "ok"); liste();
    });
  });
  basla();
})();
