/**
 * Meberra 1.11.0 — Yönetici paneli "FRQ" sekmesi: FRQ bankası listesi, onay (taslak → aktif), arşiv, taslağa alma,
 * JSON düzenleyici (sürümlü; eski sürümü düzenleyiciye yükleme). Uçlar: GET/PUT /api/admin/frq…, POST /api/admin/frq/:id/durum.
 * admin.js'e dokunmadan kendini kaydeder: kabuk çizilince sekme düğmesi ve paneli ekler, sekme geçişlerini kendisi yönetir.
 * Ortak yardımcılar window.MEBERRA_ADMIN'den (api, esc, rozet, bildir, iskelet, bos, hataKutusu, tarih).
 */
(function () {
  "use strict";
  var ID = "frq";
  var ilkHash = (location.hash || "").replace(/^#/, "");
  var A = null, P = null, S = { durum: "taslak", ders: "", istek: 0, secili: null };
  var DURUM = { taslak: ["Taslak", "warn"], aktif: ["Yayında", "ok"], arsiv: ["Arşiv", "notr"] };
  var IKON = '<svg class="adm-ikon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/><path d="M4 4h7M4 8h4"/></svg>';
  function esc(v) { return A ? A.esc(v) : String(v == null ? "" : v); }
  function $(s) { return P.querySelector(s); }

  // ---------------- sekme kaydı (admin.js değişmeden) ----------------
  function kaydet() {
    var liste = document.querySelector(".adm-sekmeler"), icerik = document.querySelector(".adm-icerik");
    if (!liste || !icerik || document.getElementById("sekme-" + ID)) return !!document.getElementById("sekme-" + ID);
    A = window.MEBERRA_ADMIN;
    var b = document.createElement("button");
    b.type = "button"; b.className = "adm-sekme"; b.id = "sekme-" + ID; b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", "panel-" + ID); b.setAttribute("aria-selected", "false"); b.tabIndex = -1; b.setAttribute("data-frq-sekme", "");
    b.innerHTML = '<span class="adm-sekme-ikon">' + IKON + '</span><span class="adm-sekme-ad">FRQ</span> <span class="adm-sayac" id="adm-frq-taslak" hidden></span>';
    var sonra = document.getElementById("sekme-soru-bankasi");
    if (sonra && sonra.parentNode === liste) sonra.insertAdjacentElement("afterend", b); else liste.appendChild(b);
    P = document.createElement("section");
    P.className = "adm-panel"; P.id = "panel-" + ID; P.setAttribute("role", "tabpanel"); P.setAttribute("aria-labelledby", "sekme-" + ID); P.tabIndex = 0; P.hidden = true;
    icerik.appendChild(P);
    // Benim sekmem: tıklama / klavye ile geldiğinde aç; başka sekmeye geçilince kapan
    liste.addEventListener("click", function (e) {
      var t = e.target.closest("[role=tab]");
      if (!t) return;
      if (t === b) ac(); else kapat();
    });
    liste.addEventListener("keydown", function () { setTimeout(function () { if (document.activeElement === b) ac(); else if (!P.hidden && document.activeElement && document.activeElement.getAttribute("role") === "tab") kapat(); }, 0); });
    window.addEventListener("hashchange", function () { if ((location.hash || "").replace(/^#/, "") === ID) ac(); });
    kur();
    sayacYukle();
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
  function kapat() {
    var b = document.getElementById("sekme-" + ID);
    if (b) { b.setAttribute("aria-selected", "false"); b.tabIndex = -1; }
    if (P) P.hidden = true;
  }
  function sayacYukle() {
    A.api("/api/admin/frq?durum=taslak").then(function (v) {
      var s = document.getElementById("adm-frq-taslak"); if (!s) return;
      var n = (v.durumSay && v.durumSay.taslak) || 0;
      s.textContent = n; s.hidden = !n;
    }).catch(function () {});
  }

  // ---------------- panel ----------------
  function kur() {
    P.innerHTML =
      '<div class="adm-panel-ust"><h2>FRQ bankası</h2></div>' +
      '<p class="adm-ipucu">AP tarzı özgün serbest yanıt soruları. Tohumdan gelenler <strong>taslak</strong> başlar; içeriği ve rubriği kontrol edip onaylayınca öğrencinin /frq sayfasında görünür. ' +
        "Rubrik ve çözümler öğrenciye yalnızca teslimden sonra gider. Her değişiklik yeni sürüm olur ve denetim kaydına yazılır (silme yok, arşiv var).</p>" +
      '<div class="adm-filtre" role="group" aria-label="Süzgeçler" style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px">' +
        '<select id="frq-a-durum" class="text-input" aria-label="Durum"><option value="taslak">Taslak</option><option value="aktif">Yayında</option><option value="arsiv">Arşiv</option><option value="">Tümü</option></select>' +
        '<select id="frq-a-ders" class="text-input" aria-label="Ders"><option value="">Tüm dersler</option></select>' +
        '<span class="adm-alt" id="frq-a-say" style="align-self:center"></span></div>' +
      '<div id="frq-a-liste"></div>' +
      '<section id="frq-a-duzen" class="surface" hidden style="margin-top:16px;padding:16px"></section>';
    $("#frq-a-durum").addEventListener("change", function () { S.durum = this.value; listeYukle(); });
    $("#frq-a-ders").addEventListener("change", function () { S.ders = this.value; listeYukle(); });
    P.addEventListener("click", tikla);
  }
  function listeYukle() {
    if (!P) return;
    var no = ++S.istek, k = $("#frq-a-liste");
    k.innerHTML = A.iskelet ? A.iskelet("tablo", 6) : "Yükleniyor…";
    A.api("/api/admin/frq?durum=" + encodeURIComponent(S.durum) + "&ders=" + encodeURIComponent(S.ders)).then(function (v) {
      if (no !== S.istek) return;
      var sel = $("#frq-a-ders");
      if (sel.options.length === 1) Object.keys(v.dersler || {}).forEach(function (d) { var o = document.createElement("option"); o.value = d; o.textContent = v.dersler[d].ad; sel.appendChild(o); });
      var ds = v.durumSay || {};
      $("#frq-a-say").textContent = "Taslak " + (ds.taslak || 0) + " · Yayında " + (ds.aktif || 0) + " · Arşiv " + (ds.arsiv || 0);
      var s = document.getElementById("adm-frq-taslak"); if (s) { s.textContent = ds.taslak || 0; s.hidden = !ds.taslak; }
      var l = v.frq || [];
      if (!l.length) { k.innerHTML = A.bos("Bu süzgeçte FRQ yok.", "Liste boş", "ok"); return; }
      k.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo"><thead><tr><th scope="col">FRQ</th><th scope="col">Ders · tür</th><th scope="col">Puan</th>' +
        '<th scope="col">Durum</th><th scope="col">Deneme</th><th scope="col">İşlem</th></tr></thead><tbody>' + l.map(function (f) {
          var d = DURUM[f.durum] || [f.durum, "notr"];
          return "<tr><td><strong>" + esc(f.baslik) + '</strong><br><span class="adm-alt">' + esc(f.id) + " · v" + f.surum + (f.elle ? " · elle düzenlendi" : "") + "</span>" +
            (f.sorunlar ? " " + A.rozet(f.sorunlar + " sorun", "bad") : "") + "</td><td>" + esc(f.dersAd) + '<br><span class="adm-alt">' + esc(f.tur) + "</span></td><td>" + f.toplam_puan +
            "</td><td>" + A.rozet(d[0], d[1]) + "</td><td>" + f.deneme + (f.ortalama != null ? ' <span class="adm-alt">· ort %' + f.ortalama + "</span>" : "") + '</td><td><div class="adm-rozetler">' +
            (f.durum !== "aktif" ? '<button type="button" class="btn-primary btn-sm" data-durum="aktif" data-id="' + esc(f.id) + '"' + (f.sorunlar ? " disabled" : "") + ">Onayla</button>" : "") +
            (f.durum !== "arsiv" ? '<button type="button" class="btn-ghost btn-sm" data-durum="arsiv" data-id="' + esc(f.id) + '">Arşivle</button>' : "") +
            (f.durum !== "taslak" ? '<button type="button" class="btn-ghost btn-sm" data-durum="taslak" data-id="' + esc(f.id) + '">Taslağa al</button>' : "") +
            '<button type="button" class="btn-ghost btn-sm" data-duzenle="' + esc(f.id) + '">Düzenle</button>' +
            '<a class="btn-ghost btn-sm" href="/frq?id=' + encodeURIComponent(f.id) + '" target="_blank" rel="noopener">Önizle</a></div></td></tr>';
        }).join("") + "</tbody></table></div>";
    }).catch(function (e) { if (no === S.istek) k.innerHTML = A.hataKutusu(e.message || "Yüklenemedi."); });
  }
  function tikla(e) {
    var t;
    if (e.target.closest("[data-tekrar]")) return listeYukle();
    if ((t = e.target.closest("[data-durum]"))) {
      t.disabled = true;
      A.api("/api/admin/frq/" + encodeURIComponent(t.getAttribute("data-id")) + "/durum", "POST", { durum: t.getAttribute("data-durum") }).then(function (v) {
        A.bildir(t.getAttribute("data-id") + ": " + (DURUM[v.durum] || [v.durum])[0] + " (v" + v.surum + ")", "ok");
        listeYukle();
      }).catch(function (x) { t.disabled = false; A.bildir(x.message || "İşlem yapılamadı.", "bad"); });
      return;
    }
    if ((t = e.target.closest("[data-duzenle]"))) return duzenleAc(t.getAttribute("data-duzenle"));
    if ((t = e.target.closest("[data-surum-yukle]"))) {
      A.api("/api/admin/frq/" + encodeURIComponent(S.secili.id) + "?surum=" + t.getAttribute("data-surum-yukle")).then(function (v) {
        var o = Object.assign({}, v.eskiSurum); delete o.durum;
        $("#frq-a-json").value = JSON.stringify(o, null, 2);
        A.bildir("v" + t.getAttribute("data-surum-yukle") + " düzenleyiciye yüklendi. Kaydedersen yeni sürüm olur.", "info");
      }).catch(function (x) { A.bildir(x.message || "Yüklenemedi.", "bad"); });
      return;
    }
    if (e.target.closest("[data-duzen-kapat]")) { $("#frq-a-duzen").hidden = true; S.secili = null; return; }
    if (e.target.closest("[data-duzen-kaydet]")) return kaydetJson();
  }
  function duzenleAc(id) {
    var k = $("#frq-a-duzen");
    k.hidden = false; k.innerHTML = A.yukleniyor ? A.yukleniyor() : "Yükleniyor…";
    A.api("/api/admin/frq/" + encodeURIComponent(id)).then(function (v) {
      var f = v.frq; S.secili = { id: f.id, surum: f.surum };
      var veri = Object.assign({}, f); ["durum", "surum", "guncelleme", "elle"].forEach(function (x) { delete veri[x]; });
      k.innerHTML = '<h3 style="margin-top:0">' + esc(f.baslik) + ' <span class="adm-alt">' + esc(f.id) + " · v" + f.surum + "</span></h3>" +
        (v.sorunlar.length ? '<div class="adm-hata" role="alert"><p>' + v.sorunlar.map(esc).join("<br>") + "</p></div>" : "") +
        '<p class="adm-ipucu">Kurallar: her parçada rubrik puanları toplamı = parça puanı; toplam_puan = parça puanları toplamı; LaTeX için \\( \\) ve \\[ \\] (dolar işareti yok). Kimlik ve durum buradan değişmez.</p>' +
        '<label for="frq-a-json" class="field-hint">FRQ JSON</label><textarea id="frq-a-json" class="text-input" rows="22" spellcheck="false" style="width:100%;font-family:var(--font-mono);font-size:13px">' + esc(JSON.stringify(veri, null, 2)) + "</textarea>" +
        '<div class="adm-sk-frq" aria-live="polite"><h4>Şekil önizlemesi <span class="adm-alt">(giriş: "sekil", parça: parcalar[i].sekil — {tur:"svg", svg, alt, baslik?, konum:"govde"|"aciklama"})</span></h4><div id="frq-a-sekil"></div></div>' +
        '<div class="field" style="margin-top:8px"><label for="frq-a-not" class="field-hint">Değişiklik notu</label><input id="frq-a-not" class="text-input" maxlength="200"></div>' +
        '<div class="adm-rozetler" style="margin-top:8px"><button type="button" class="btn-primary btn-sm" data-duzen-kaydet>Yeni sürüm olarak kaydet</button><button type="button" class="btn-ghost btn-sm" data-duzen-kapat>Kapat</button></div>' +
        '<p class="field-error" id="frq-a-hata" role="alert"></p>' +
        (v.gecmis.length ? '<h4>Sürüm geçmişi</h4><ul class="adm-alt">' + v.gecmis.map(function (g) {
          return "<li>v" + g.surum + " · " + esc((DURUM[g.durum] || [g.durum])[0]) + " · " + esc(A.tarih ? A.tarih(g.zaman) : g.zaman) + " · " + esc(g.not_ || "") +
            ' <button type="button" class="btn-ghost btn-sm" data-surum-yukle="' + g.surum + '">Düzenleyiciye yükle</button></li>';
        }).join("") + "</ul>" : "");
      var ta = $("#frq-a-json"), zz = null;
      ta.addEventListener("input", function () { clearTimeout(zz); zz = setTimeout(sekilOnizle, 600); });
      sekilOnizle();
      k.scrollIntoView({ block: "start" });
    }).catch(function (x) { k.innerHTML = A.hataKutusu(x.message || "Yüklenemedi."); });
  }
  /** v1.13.0: JSON'daki şekilleri çizer (sekil.js) ve sunucu temizleyicisinin sonucunu altına yazar (POST /api/admin/sekil/onizle) */
  function sekilOnizle() {
    var kap = $("#frq-a-sekil"); if (!kap) return;
    var f; try { f = JSON.parse($("#frq-a-json").value); } catch (e) { kap.innerHTML = '<p class="adm-alt">JSON geçersiz; şekiller çizilemedi.</p>'; return; }
    var l = [], liste = function (v) { return Array.isArray(v) ? v : v ? [v] : []; };
    liste(f && f.sekil).forEach(function (s, i) { l.push({ ad: "Giriş şekli " + (i + 1), s: s }); });
    ((f && f.parcalar) || []).forEach(function (p) { liste(p && p.sekil).forEach(function (s, i) { l.push({ ad: "(" + (p.harf || "?") + ") şekli " + (i + 1), s: s }); }); });
    if (!l.length) { kap.innerHTML = '<p class="adm-alt">Bu FRQ’da şekil yok.</p>'; return; }
    kap.innerHTML = l.map(function (x, i) {
      return '<div class="adm-sk-frq-oge"><p><strong>' + esc(x.ad) + "</strong> · " + esc((x.s && x.s.konum) === "aciklama" ? "yalnız çözümde" : "soruda") + "</p>" +
        (typeof window.apSekilHtml === "function" ? window.apSekilHtml(x.s) : "") + '<div class="adm-sk-durum" data-frq-sk="' + i + '"></div></div>';
    }).join("");
    l.forEach(function (x, i) {
      A.api("/api/admin/sekil/onizle", "POST", { sekil: x.s }).then(function (v) {
        var d = kap.querySelector('[data-frq-sk="' + i + '"]'); if (!d) return;
        var m = [].concat(v.hatalar.map(function (t) { return "✗ " + t; }), v.kaldirilan.map(function (t) { return "atılacak: " + t; }), v.uyarilar.map(function (t) { return "uyarı: " + t; }));
        d.innerHTML = m.length ? '<ul class="adm-sk-not ' + (v.gecerli ? "is-uyari" : "is-hata") + '">' + m.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : '<p class="adm-sk-not is-ok">✓ Temizleyiciden değişmeden geçiyor.</p>';
      }).catch(function () {});
    });
  }
  function kaydetJson() {
    var h = $("#frq-a-hata"), veri;
    h.textContent = "";
    try { veri = JSON.parse($("#frq-a-json").value); } catch (e) { h.textContent = "JSON geçersiz: " + e.message; return; }
    A.api("/api/admin/frq/" + encodeURIComponent(S.secili.id), "PUT", { veri: veri, surum: S.secili.surum, not: $("#frq-a-not").value }).then(function (v) {
      A.bildir(v.degisiklik ? "Kaydedildi: v" + v.surum : "Değişiklik yok.", v.degisiklik ? "ok" : "info");
      duzenleAc(S.secili.id); listeYukle();
    }).catch(function (x) { h.textContent = x.message || "Kaydedilemedi."; });
  }

  // ---------------- başlat: kabuk çizilene kadar bekle ----------------
  function baslat() {
    if (kaydet()) return;
    if (!window.MutationObserver) return;
    var g = new MutationObserver(function () { if (kaydet()) g.disconnect(); });
    g.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat); else baslat();
})();
