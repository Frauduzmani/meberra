/**
 * Meberra 1.19.0 — Yönetici paneli "Okullar" sekmesi: okul oluşturma, lisans (koltuk + tarih), öğretmen daveti (e-posta),
 * koltuk kullanımı, öğretmen/lisans iptali, öğretmene öğrenci e-postası gösterme izni. Uçlar: /api/admin/okullar…
 * admin.js'e dokunmadan kendini kaydeder (admin-frq.js ile aynı yol). Her işlem sunucuda denetim kaydına yazılır.
 */
(function () {
  "use strict";
  var ID = "okullar";
  var ilkHash = (location.hash || "").replace(/^#/, "");
  var A = null, P = null, S = { secili: null };
  var IKON = '<svg class="adm-ikon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/></svg>';
  function esc(v) { return A ? A.esc(v) : String(v == null ? "" : v); }
  function $(s) { return P.querySelector(s); }
  var tarih = function (iso) { return iso ? new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short", year: "numeric" }) : "—"; };
  var gun = function (n) { return new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); };

  function kaydet() {
    var liste = document.querySelector(".adm-sekmeler"), icerik = document.querySelector(".adm-icerik");
    if (!liste || !icerik || document.getElementById("sekme-" + ID)) return !!document.getElementById("sekme-" + ID);
    A = window.MEBERRA_ADMIN;
    if (!document.querySelector('link[href^="/assets/css/admin-okul.css"]')) { var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/assets/css/admin-okul.css?v=1190"; document.head.appendChild(css); }
    var b = document.createElement("button");
    b.type = "button"; b.className = "adm-sekme"; b.id = "sekme-" + ID; b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", "panel-" + ID); b.setAttribute("aria-selected", "false"); b.tabIndex = -1;
    b.innerHTML = '<span class="adm-sekme-ikon">' + IKON + '</span><span class="adm-sekme-ad">Okullar</span>';
    liste.appendChild(b);
    P = document.createElement("section");
    P.className = "adm-panel adm-okul"; P.id = "panel-" + ID; P.setAttribute("role", "tabpanel"); P.setAttribute("aria-labelledby", "sekme-" + ID); P.tabIndex = 0; P.hidden = true;
    icerik.appendChild(P);
    liste.addEventListener("click", function (e) { var t = e.target.closest("[role=tab]"); if (!t) return; if (t === b) ac(); else kapat(); });
    liste.addEventListener("keydown", function () { setTimeout(function () { if (document.activeElement === b) ac(); else if (!P.hidden && document.activeElement && document.activeElement.getAttribute("role") === "tab") kapat(); }, 0); });
    window.addEventListener("hashchange", function () { if ((location.hash || "").replace(/^#/, "") === ID) ac(); });
    kur();
    if (ilkHash === ID) ac();
    return true;
  }
  function ac() {
    var b = document.getElementById("sekme-" + ID);
    document.querySelectorAll(".adm-sekmeler [role=tab]").forEach(function (t) { t.setAttribute("aria-selected", String(t === b)); t.tabIndex = t === b ? 0 : -1; });
    document.querySelectorAll(".adm-icerik > .adm-panel").forEach(function (p) { p.hidden = p !== P; });
    try { history.replaceState(null, "", "#" + ID); } catch (e) { /* */ }
    listeYukle();
  }
  function kapat() { var b = document.getElementById("sekme-" + ID); if (b) { b.setAttribute("aria-selected", "false"); b.tabIndex = -1; } if (P) P.hidden = true; }

  function kur() {
    P.innerHTML = '<div class="adm-panel-ust"><h2>Okullar</h2></div>' +
      '<p class="adm-ipucu">Okul lisansı: koltuk sayısı kadar öğrenci, öğretmenin sınıfına katılınca Premium olur (kaynak <code>okul</code>, bitiş = lisans bitişi). ' +
      'Okul Premium’u gelir istatistiğine girmez; okulun ödediği tutar lisansta tutulur. Öğretmenler öğrencilerin yalnızca toplu özetini görür.</p>' +
      '<form class="surface adm-okul-form" id="ok-yeni" novalidate><h3>Yeni okul</h3><div class="adm-okul-alanlar">' +
      '<label>Okul adı<input class="text-input" name="ad" maxlength="120" required></label><label>Şehir<input class="text-input" name="sehir" maxlength="60"></label>' +
      '<label>İletişim e-postası<input class="text-input" name="iletisimEposta" type="email" maxlength="120"></label>' +
      '<button type="submit" class="btn-primary">Okul ekle</button></div><p class="adm-okul-hata" role="alert"></p></form>' +
      '<div id="ok-liste"></div><section id="ok-detay" class="surface adm-okul-detay" hidden></section>';
    $("#ok-yeni").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, h = f.querySelector(".adm-okul-hata");
      A.api("/api/admin/okullar", "POST", { ad: f.ad.value, sehir: f.sehir.value, iletisimEposta: f.iletisimEposta.value }).then(function (v) {
        h.textContent = ""; f.reset(); A.bildir("Okul eklendi.", "ok"); listeYukle(); detay(v.okul.id);
      }).catch(function (x) { h.textContent = x.message || "Eklenemedi."; });
    });
    P.addEventListener("click", tikla);
    P.addEventListener("submit", gonder);
  }
  function listeYukle() {
    var k = $("#ok-liste");
    k.innerHTML = A.iskelet ? A.iskelet("tablo", 4) : "Yükleniyor…";
    A.api("/api/admin/okullar").then(function (v) {
      var l = v.okullar || [];
      if (!l.length) { k.innerHTML = A.bos("Henüz okul yok.", "Liste boş", "ok"); return; }
      k.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo"><thead><tr><th scope="col">Okul</th><th scope="col">Durum</th><th scope="col">Koltuk</th>' +
        '<th scope="col">Lisans bitişi</th><th scope="col">Öğretmen · sınıf · öğrenci</th><th scope="col">İşlem</th></tr></thead><tbody>' + l.map(function (o) {
          var kb = o.koltuk, oran = kb.koltuk ? Math.round(kb.kullanilan / kb.koltuk * 100) : 0;
          return "<tr><td><strong>" + esc(o.ad) + '</strong><br><span class="adm-alt">' + esc(o.sehir || "—") + "</span></td><td>" + A.rozet(o.durum === "aktif" ? "Aktif" : "Pasif", o.durum === "aktif" ? "ok" : "notr") +
            "</td><td>" + (kb.gecerli ? kb.kullanilan + " / " + kb.koltuk + ' <span class="adm-alt">(%' + oran + ")</span>" : '<span class="adm-alt">Lisans yok</span>') +
            "</td><td>" + esc(kb.gecerli ? tarih(kb.bitis) : (o.sonLisans ? tarih(o.sonLisans.bitis) + " (geçerli değil)" : "—")) + "</td><td>" + o.ogretmen + " · " + o.sinif + " · " + o.ogrenci +
            '</td><td><button type="button" class="btn-ghost btn-sm" data-detay="' + o.id + '">Yönet</button></td></tr>';
        }).join("") + "</tbody></table></div>";
    }).catch(function (e) { k.innerHTML = A.hataKutusu(e.message || "Yüklenemedi."); });
  }
  function detay(id) {
    var d = $("#ok-detay");
    S.secili = id; d.hidden = false; d.innerHTML = "Yükleniyor…";
    A.api("/api/admin/okullar/" + id).then(function (v) {
      var o = v.okul, kb = o.koltuk;
      d.innerHTML = '<div class="adm-okul-bas"><h3>' + esc(o.ad) + '</h3><button type="button" class="btn-ghost btn-sm" data-kapat>Kapat</button></div>' +
        '<p class="adm-alt">' + esc(o.iletisimEposta || "İletişim e-postası yok") + " · Koltuk: " + (kb.gecerli ? kb.kullanilan + " / " + kb.koltuk + " (bitiş " + tarih(kb.bitis) + ")" : "geçerli lisans yok") + "</p>" +
        '<div class="adm-okul-ayar"><label class="check-row"><input type="checkbox" data-eposta' + (o.epostaGorunur ? " checked" : "") + '> <span>Öğretmenler öğrenci e-postalarını görebilir (okulun yazılı talebiyle açın)</span></label>' +
        '<label class="check-row"><input type="checkbox" data-durum' + (o.durum === "aktif" ? " checked" : "") + "> <span>Okul aktif (pasifte okul Premium’u ve öğretmen erişimi durur)</span></label></div>" +
        '<form data-form="lisans" class="adm-okul-form" novalidate><h4>Lisans ' + (o.sonLisans ? "yenile / değiştir" : "tanımla") + "</h4><div class=\"adm-okul-alanlar\">" +
        '<label>Koltuk<input class="text-input" name="koltuk" type="number" min="1" max="10000" value="' + (o.sonLisans ? o.sonLisans.koltuk : 30) + '"></label>' +
        '<label>Başlangıç<input class="text-input" name="baslangic" type="date" value="' + (o.sonLisans ? o.sonLisans.baslangic.slice(0, 10) : gun(0)) + '"></label>' +
        '<label>Bitiş<input class="text-input" name="bitis" type="date" value="' + (o.sonLisans ? o.sonLisans.bitis.slice(0, 10) : gun(365)) + '"></label>' +
        '<label>Tutar (TL, isteğe bağlı)<input class="text-input" name="tutarTl" type="number" min="0" step="1"></label>' +
        '<label class="genis">Plan notu<input class="text-input" name="planNotu" maxlength="300"></label>' +
        '<button type="submit" class="btn-primary">Lisansı kaydet</button>' + (kb.gecerli ? '<button type="button" class="btn-ghost" data-lisans-iptal>Lisansı iptal et</button>' : "") + '</div><p class="adm-okul-hata" role="alert"></p></form>' +
        '<form data-form="davet" class="adm-okul-form" novalidate><h4>Öğretmen davet et</h4><div class="adm-okul-alanlar"><label class="genis">Öğretmen e-postası<input class="text-input" name="eposta" type="email" maxlength="120"></label>' +
        '<button type="submit" class="btn-primary">Davet gönder</button></div><p class="adm-alt">Bağlantı 7 gün geçerli; öğretmen açıp şifresini belirler.</p><p class="adm-okul-hata" role="alert"></p></form>' +
        "<h4>Öğretmenler</h4>" + (o.ogretmenler.length ? '<div class="adm-tablo-kap"><table class="adm-tablo"><thead><tr><th scope="col">Öğretmen</th><th scope="col">Durum</th><th scope="col">Sınıf</th><th scope="col">Tarih</th><th scope="col">İşlem</th></tr></thead><tbody>' +
          o.ogretmenler.map(function (t) {
            return "<tr><td>" + esc(t.ad || "—") + '<br><span class="adm-alt">' + esc(t.eposta || "") + "</span></td><td>" + A.rozet(t.durum === "aktif" ? "Bağlı" : "Davet bekliyor", t.durum === "aktif" ? "ok" : "warn") +
              "</td><td>" + t.sinif + "</td><td>" + esc(t.durum === "aktif" ? tarih(t.kabul) : "son " + tarih(t.davetBitis)) + '</td><td><button type="button" class="btn-ghost btn-sm" data-ogt-iptal="' + t.id + '">Erişimi kaldır</button></td></tr>';
          }).join("") + "</tbody></table></div>" : '<p class="adm-alt">Öğretmen yok.</p>') +
        "<h4>Sınıflar</h4>" + (o.siniflar.length ? '<div class="adm-tablo-kap"><table class="adm-tablo"><thead><tr><th scope="col">Sınıf</th><th scope="col">Öğretmen</th><th scope="col">Ders</th><th scope="col">Öğrenci</th><th scope="col">Kod</th></tr></thead><tbody>' +
          o.siniflar.map(function (s) { return "<tr><td>" + esc(s.ad) + "</td><td>" + esc(s.ogretmen) + "</td><td>" + esc(A.dersAd ? A.dersAd(s.ders) || s.ders : s.ders) + "</td><td>" + s.uye + "</td><td><code>" + esc(s.kod) + "</code></td></tr>"; }).join("") +
          "</tbody></table></div>" : '<p class="adm-alt">Sınıf yok.</p>') +
        "<h4>Lisans geçmişi</h4>" + (o.lisanslar.length ? '<ul class="adm-okul-gecmis">' + o.lisanslar.map(function (l) {
          return "<li>" + esc(tarih(l.baslangic) + " – " + tarih(l.bitis)) + " · " + l.koltuk + " koltuk" + (l.tutarTl != null ? " · " + l.tutarTl + " TL" : "") + " · " + esc(l.durum) + (l.planNotu ? " · " + esc(l.planNotu) : "") + "</li>";
        }).join("") + "</ul>" : '<p class="adm-alt">Lisans yok.</p>');
    }).catch(function (e) { d.innerHTML = A.hataKutusu(e.message || "Yüklenemedi."); });
  }
  function yenile() { listeYukle(); if (S.secili) detay(S.secili); }
  function tikla(e) {
    var t;
    if ((t = e.target.closest("[data-detay]"))) { detay(+t.getAttribute("data-detay")); return; }
    if (e.target.closest("[data-kapat]")) { $("#ok-detay").hidden = true; S.secili = null; return; }
    if (e.target.closest("[data-lisans-iptal]")) {
      if (!window.confirm("Lisans iptal edilsin mi? Okulun tüm öğrencilerinde okul Premium’u hemen sona erer.")) return;
      A.api("/api/admin/okullar/" + S.secili + "/lisans/iptal", "POST", {}).then(function () { A.bildir("Lisans iptal edildi.", "ok"); yenile(); }).catch(function (x) { A.bildir(x.message, "bad"); });
      return;
    }
    if ((t = e.target.closest("[data-ogt-iptal]"))) {
      if (!window.confirm("Öğretmenin bu okuldaki erişimi kaldırılsın mı?")) return;
      A.api("/api/admin/ogretmenler/" + t.getAttribute("data-ogt-iptal") + "/iptal", "POST", {}).then(function () { A.bildir("Erişim kaldırıldı.", "ok"); yenile(); }).catch(function (x) { A.bildir(x.message, "bad"); });
      return;
    }
    if ((t = e.target.closest("[data-eposta]")) || (t = e.target.closest("[data-durum]"))) {
      var g = t.hasAttribute("data-eposta") ? { epostaGorunur: t.checked } : { durum: t.checked ? "aktif" : "pasif" };
      A.api("/api/admin/okullar/" + S.secili, "PUT", g).then(function () { A.bildir("Kaydedildi.", "ok"); yenile(); }).catch(function (x) { A.bildir(x.message, "bad"); t.checked = !t.checked; });
    }
  }
  function gonder(e) {
    var f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    var h = f.querySelector(".adm-okul-hata"), tur = f.getAttribute("data-form");
    var p = tur === "lisans" ? A.api("/api/admin/okullar/" + S.secili + "/lisans", "POST", { koltuk: +f.koltuk.value, baslangic: f.baslangic.value, bitis: f.bitis.value, tutarTl: f.tutarTl.value === "" ? null : +f.tutarTl.value, planNotu: f.planNotu.value })
      : A.api("/api/admin/okullar/" + S.secili + "/ogretmen-davet", "POST", { eposta: f.eposta.value });
    p.then(function () { h.textContent = ""; A.bildir(tur === "lisans" ? "Lisans kaydedildi; koltuklar eşitlendi." : "Davet e-postası kuyruğa alındı.", "ok"); yenile(); })
      .catch(function (x) { h.textContent = x.message || "Kaydedilemedi."; });
  }

  function baslat() {
    if (kaydet()) return;
    if (!window.MutationObserver) return;
    var g = new MutationObserver(function () { if (kaydet()) g.disconnect(); });
    g.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat); else baslat();
})();
