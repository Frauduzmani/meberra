/**
 * Meberra 1.7.0 — Profil sayfası ekleri: "AP derslerin ve hedefin" düzenleyici ve "Velin" (veli daveti, bağlı veliler, kaldırma).
 * Yalnızca profil düzenleme görünümünde çalışır (karşılama sihirbazında değil). Sunucu uçları: server/API.md › Veli paneli.
 */
(function () {
  "use strict";
  var AUTH = window.APMEBERRA_AUTH, ME = window.APMEBERRA_ME, UI = AUTH && AUTH.ui;
  var $ = function (id) { return document.getElementById(id); };
  if (!AUTH || !ME || !ME.user || !$("profile") || $("profile").hidden) return;
  var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var p = ME.profile || {};

  // --- AP dersleri ------------------------------------------------------------------------
  var APUI = window.APMEBERRA_AP_HEDEF_UI;
  if (APUI && p.ogrenciModeli !== "uni-mezun") {
    $("ap-dersler").hidden = false;
    var secici = APUI.ciz($("apd-secici"), { apDersleri: p.apDersleri, sinavYili: p.sinavYili, sinif: p.sinif, onek: "pf" });
    $("apd-kaydet").addEventListener("click", function () {
      var btn = this, v = secici.deger();
      v.apHedefSoruldu = p.apHedefSoruldu || new Date().toISOString();
      if (UI) UI.busy(btn, true, "Kaydediliyor…");
      AUTH.setApHedef(ME.user.id, v).then(function (r) {
        if (UI) UI.busy(btn, false);
        if (!r.ok) { UI.alert($("apd-alert"), Object.keys(r.errors || {}).map(function (k) { return r.errors[k]; }).join(" ") || "Kaydedilemedi."); return; }
        ME.profile = r.profile; p = r.profile;
        UI.alert($("apd-alert"), v.apDersleri.length ? "AP seçimin kaydedildi. Bugün’deki planın bu derslerle başlar." : "Kaydedildi. Ders seçmediğin için plan tüm derslerden gelir.", "ok");
      });
    });
  }

  // --- Velin -------------------------------------------------------------------------------
  if (!AUTH.sunucu) return;
  var kap = $("veli-govde");
  $("veli").hidden = false;
  function istek(yontem, yol, govde) {
    return fetch(yol, { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: govde ? JSON.stringify(govde) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.durum = r.status; return j; }); }, function () { return { ok: false, error: "Sunucuya ulaşılamadı." }; });
  }
  var tarih = function (iso) { return iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : ""; };
  function ciz(veliler, mesaj, tur) {
    kap.innerHTML = (veliler.length ? '<ul class="vo-liste">' + veliler.map(function (v) {
      var aktif = v.durum === "aktif";
      return '<li class="vo-oge"><div class="u-min0"><strong>' + esc(aktif && v.ad ? v.ad : v.eposta) + '</strong><span>' +
        esc(aktif ? (v.ad ? v.eposta + " · " : "") + "bağlandı: " + tarih(v.kabul) : "Davet gönderildi: " + tarih(v.olusturma) + " · bağlantı " + tarih(v.davetBitis) + " tarihine kadar geçerli") +
        '</span></div><span class="vo-rozet' + (aktif ? "" : " is-davet") + '">' + (aktif ? "Bağlı" : "Davet bekliyor") + '</span>' +
        '<button type="button" class="btn-ghost btn-sm btn-danger" data-kaldir="' + v.id + '">' + (aktif ? "Bağlantıyı kaldır" : "Daveti geri çek") + '</button></li>';
    }).join("") + '</ul>' : '<p class="field-hint">Henüz bağlı bir velin yok.</p>') +
      '<div class="form-alert" id="vo-alert" role="status" aria-live="polite" tabindex="-1" hidden></div>' +
      (veliler.length < 3 ? '<form class="vo-form" id="vo-form" novalidate><div class="field"><label for="vo-eposta">Velinin e-posta adresi</label>' +
        '<input class="text-input" id="vo-eposta" type="email" inputmode="email" autocomplete="off" maxlength="120" placeholder="veli@ornek.com" aria-describedby="vo-eposta-err">' +
        '<p class="field-error" id="vo-eposta-err"></p></div><button type="submit" class="btn-primary" id="vo-gonder" style="margin-top:26px">Veliyi davet et</button></form>' +
        '<p class="field-hint">Veline bir bağlantı gider; bağlantıyla kısa bir veli hesabı açar. Ödemeyi velin kendi hesabından da yapabilir.</p>' : "");
    if (mesaj) UI.alert($("vo-alert"), mesaj, tur);
    var f = $("vo-form");
    if (f) f.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = $("vo-gonder");
      UI.busy(btn, true, "Gönderiliyor…");
      istek("POST", "/api/veli/davet", { eposta: $("vo-eposta").value }).then(function (j) {
        UI.busy(btn, false);
        if (!j.ok) { $("vo-eposta-err").textContent = (j.errors && j.errors.eposta) || j.error || "Davet gönderilemedi."; $("vo-eposta").focus(); return; }
        ciz(j.veliler, "Davet gönderildi. Velin e-postasındaki bağlantıyla hesabını açınca burada “Bağlı” görünür.", "ok");
      });
    });
    kap.querySelectorAll("[data-kaldir]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!window.confirm(b.textContent === "Bağlantıyı kaldır" ? "Velin artık çalışma özetini göremeyecek. Emin misin?" : "Davet geri çekilsin mi?")) return;
        b.disabled = true;
        istek("POST", "/api/veli/baglantilar/" + encodeURIComponent(b.getAttribute("data-kaldir")) + "/iptal").then(function (j) {
          if (!j.ok) { b.disabled = false; UI.alert($("vo-alert"), j.error || "Kaldırılamadı."); return; }
          ciz(j.veliler, "Kaldırıldı.", "ok");
        });
      });
    });
  }
  kap.innerHTML = '<div class="iskelet-grup" aria-hidden="true"><span class="iskelet iskelet-satir"></span><span class="iskelet iskelet-blok is-kisa"></span></div>';
  istek("GET", "/api/veli/baglantilar").then(function (j) {
    if (!j.ok) { kap.innerHTML = '<p class="field-hint">' + esc(j.error || "Veli bilgisi yüklenemedi.") + '</p>'; return; }
    ciz(j.veliler || []);
    if (location.hash === "#veli") setTimeout(function () { $("veli").scrollIntoView({ block: "start" }); }, 50);
  });
})();
