/**
 * Meberra 1.7.0 — Yönetici: kullanıcı ayrıntısına "Veli bağlantıları" bölümü (GET /api/admin/veli-baglantilari?kullanici=).
 * admin.js'e dokunmadan çalışır: kullanıcı ayrıntısı çizildiğinde (MutationObserver) bölüm eklenir. Salt okunur.
 */
(function () {
  "use strict";
  var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var DURUM = { davet: "Davet bekliyor", aktif: "Bağlı", iptal: "Kaldırıldı" };
  var tarih = function (iso) { return iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "—"; };
  function ekle(detay) {
    var ust = detay.querySelector("header.adm-kisi"), den = detay.querySelector("[data-den]");
    if (!ust || !den || detay.querySelector(".adm-veli-bag")) return;
    var id = den.getAttribute("data-den");
    var s = document.createElement("section");
    s.className = "surface adm-veli-bag";
    s.setAttribute("aria-labelledby", "d-veli-bag");
    s.innerHTML = '<h3 id="d-veli-bag">Veli bağlantıları</h3><p class="adm-alt">Yükleniyor…</p>';
    ust.insertAdjacentElement("afterend", s);
    fetch("/api/admin/veli-baglantilari?kullanici=" + encodeURIComponent(id), { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
      var l = (j && j.baglantilar) || [];
      if (!j || !j.ok) { s.querySelector("p").textContent = (j && j.error) || "Yüklenemedi."; return; }
      if (!l.length) { s.querySelector("p").textContent = "Bağlantı yok."; return; }
      s.innerHTML = '<h3 id="d-veli-bag">Veli bağlantıları</h3><div class="adm-tablo-kap"><table class="adm-tablo"><thead><tr><th scope="col">Öğrenci</th><th scope="col">Veli</th>' +
        '<th scope="col">Durum</th><th scope="col">Davet</th><th scope="col">Kabul / kaldırma</th><th scope="col">Rapor</th></tr></thead><tbody>' +
        l.map(function (b) {
          return "<tr><td>" + esc(b.ogrenci.ad) + "</td><td>" + esc(b.veli.ad ? b.veli.ad + " · " : "") + '<span class="adm-alt">' + esc(b.veli.eposta || "—") + "</span></td><td>" +
            esc(DURUM[b.durum] || b.durum) + "</td><td>" + esc(tarih(b.olusturma)) + "</td><td>" + esc(b.durum === "iptal" ? tarih(b.iptal) : tarih(b.kabul)) + "</td><td>" +
            (b.durum === "aktif" ? (b.rapor ? "Açık" : "Kapalı") : "—") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }).catch(function () { s.querySelector("p").textContent = "Yüklenemedi."; });
  }
  function baslat() {
    if (!window.MutationObserver) return;
    new MutationObserver(function () {
      var d = document.querySelector("#panel-kullanicilar .adm-detay");
      if (d && !d.hidden) ekle(d);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat); else baslat();
})();
