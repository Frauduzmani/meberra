/**
 * Meberra 1.7.0 — AP ders / hedef puan / sınav yılı seçici (hızlı çipler). ap-hedef.js'ten SONRA yüklenir.
 * Kullanım: karşılama sihirbazı ve profil (profil.html), Bugün'deki tek seferlik kart (index.html).
 *   var s = APMEBERRA_AP_HEDEF_UI.ciz(kap, { apDersleri, sinavYili, sinif, onek });  s.deger() → { apDersleri, sinavYili }
 *   APMEBERRA_AP_HEDEF_UI.bugunKarti(kap, ME)  → profilde seçim yoksa ve daha önce "Sonra" denmediyse kartı gösterir
 */
(function () {
  "use strict";
  var H = window.APMEBERRA_AP_HEDEF;
  if (!H) return;
  var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var sayac = 0;

  function ciz(kap, o) {
    o = o || {};
    var on = (o.onek || "aph") + "-" + (++sayac);
    var sira = [], hedef = {};
    (Array.isArray(o.apDersleri) ? o.apDersleri : []).forEach(function (d) {
      if (d && H.dersBul(d.ders) && sira.indexOf(d.ders) < 0) { sira.push(d.ders); hedef[d.ders] = H.HEDEFLER.indexOf(+d.hedef) >= 0 ? +d.hedef : H.VARSAYILAN_HEDEF; }
    });
    var yillar = H.sinavYillari();
    var yil = /^\d{4}$/.test(String(o.sinavYili || "")) ? +o.sinavYili : H.varsayilanSinavYili(o.sinif);
    if (yillar.indexOf(yil) < 0) yil = H.varsayilanSinavYili(o.sinif);

    kap.innerHTML =
      '<fieldset class="aph-grup"><legend class="field-label">Hangi AP derslerini alacaksın?</legend>' +
      '<p class="field-hint">Birden fazla seçebilirsin. Bugün’deki planın, Çalış sayfan ve deneme önerilerin bu derslerle başlar.</p>' +
      '<div class="aph-chips" data-aph="dersler">' + H.DERSLER.map(function (d) {
        var id = on + "-d-" + d.ders, sec = sira.indexOf(d.ders) >= 0;
        return '<input class="aph-girdi" type="checkbox" id="' + id + '" value="' + d.ders + '"' + (sec ? " checked" : "") + '>' +
          '<label class="aph-chip" for="' + id + '">' + esc(d.ad) + '</label>';
      }).join("") + '</div></fieldset>' +
      '<div class="aph-hedefler" data-aph="hedefler" aria-live="polite"></div>' +
      '<fieldset class="aph-grup"><legend class="field-label">Hangi yıl sınava gireceksin?</legend>' +
      '<p class="field-hint">AP sınavları her yıl Mayıs’ta. Geri sayımın bu yıla göre.</p>' +
      '<div class="aph-chips" data-aph="yil">' + yillar.map(function (y) {
        var id = on + "-y-" + y;
        return '<input class="aph-girdi" type="radio" name="' + on + '-yil" id="' + id + '" value="' + y + '"' + (y === yil ? " checked" : "") + '>' +
          '<label class="aph-chip" for="' + id + '">Mayıs ' + y + '</label>';
      }).join("") + '</div></fieldset>';
    var hedefKap = kap.querySelector('[data-aph="hedefler"]');
    function hedefCiz() {
      if (!sira.length) { hedefKap.innerHTML = ""; return; }
      hedefKap.innerHTML = '<p class="field-label aph-hedef-bas">Hedef puanın <span class="opt-tag">varsayılan 4</span></p>' + sira.map(function (k) {
        var d = H.dersBul(k);
        return '<fieldset class="aph-hedef-satir"><legend>' + esc(d.ad) + '</legend><div class="aph-chips is-kucuk">' + H.HEDEFLER.map(function (h) {
          var id = on + "-h-" + k + "-" + h;
          return '<input class="aph-girdi" type="radio" name="' + on + "-h-" + k + '" id="' + id + '" value="' + h + '" data-ders="' + k + '"' + (hedef[k] === h ? " checked" : "") + '>' +
            '<label class="aph-chip" for="' + id + '" aria-label="' + esc(d.ad) + ' hedef puan ' + h + '">' + h + '</label>';
        }).join("") + '</div></fieldset>';
      }).join("");
    }
    hedefCiz();
    kap.querySelector('[data-aph="dersler"]').addEventListener("change", function (e) {
      var t = e.target, k = t && t.value;
      if (!k) return;
      var i = sira.indexOf(k);
      if (t.checked && i < 0) { sira.push(k); hedef[k] = hedef[k] || H.VARSAYILAN_HEDEF; }
      if (!t.checked && i >= 0) sira.splice(i, 1);
      hedefCiz();
    });
    hedefKap.addEventListener("change", function (e) { var t = e.target; if (t && t.dataset.ders) hedef[t.dataset.ders] = +t.value; });
    kap.querySelector('[data-aph="yil"]').addEventListener("change", function (e) { if (e.target && e.target.value) yil = +e.target.value; });
    return {
      deger: function () { return { apDersleri: sira.map(function (k) { return { ders: k, hedef: hedef[k] || H.VARSAYILAN_HEDEF }; }), sinavYili: yil }; },
      seciliSayi: function () { return sira.length; }
    };
  }

  /** Bugün: profilde AP seçimi yoksa (ve daha önce "Sonra" denmediyse) dostça tek seferlik kart. Engellemez. */
  function bugunKarti(kap, ME) {
    var AUTH = window.APMEBERRA_AUTH;
    var p = ME && ME.profile;
    if (!kap || !AUTH || !AUTH.setApHedef || !p || (p.ogrenciModeli !== "lise" && p.ogrenciModeli !== "lise-mezun") || !H.secimEksik(p)) return false;
    kap.hidden = false;
    kap.innerHTML = '<div class="aph-kart-ust"><span class="aph-kart-ik" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg></span>' +
      '<div class="u-min0"><h2 id="aph-kart-baslik">Hangi AP derslerine gireceksin?</h2><p>30 saniye: derslerini ve hedef puanını seç, planın ve geri sayımın sana göre olsun.</p></div></div>' +
      '<div class="aph-kart-govde"></div><p class="field-error" role="alert"></p>' +
      '<div class="aph-kart-eylem"><button type="button" class="btn-primary" data-aph-kaydet>Kaydet</button><button type="button" class="btn-ghost" data-aph-sonra>Sonra</button></div>';
    kap.setAttribute("aria-labelledby", "aph-kart-baslik");
    var s = ciz(kap.querySelector(".aph-kart-govde"), { sinif: p.sinif, onek: "bg" });
    var hata = kap.querySelector(".field-error");
    function kaydet(veri, btn) {
      btn.disabled = true;
      veri.apHedefSoruldu = new Date().toISOString();
      return AUTH.setApHedef(ME.user.id, veri).then(function (r) {
        btn.disabled = false;
        if (!r.ok) { hata.textContent = Object.keys(r.errors || {}).map(function (k) { return r.errors[k]; }).join(" ") || "Kaydedilemedi."; return false; }
        ME.profile = r.profile;
        return true;
      });
    }
    kap.querySelector("[data-aph-kaydet]").addEventListener("click", function () {
      if (!s.seciliSayi()) { hata.textContent = "En az bir ders seç ya da “Sonra”ya bas."; return; }
      kaydet(s.deger(), this).then(function (ok) { if (ok) location.reload(); });
    });
    kap.querySelector("[data-aph-sonra]").addEventListener("click", function () {
      kaydet({}, this).then(function (ok) { if (ok) { kap.hidden = true; kap.innerHTML = ""; } });
    });
    return true;
  }

  window.APMEBERRA_AP_HEDEF_UI = { ciz: ciz, bugunKarti: bugunKarti };
})();
