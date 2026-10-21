/**
 * Meberra 1.19.0 — Öğretmen paneli (ogretmen.html). app.js yüklemez (veli paneli gibi kendi küçük istemcisi): öğretmen rolü
 * yalnızca /api/ogretmen/*, /api/auth/*, /api/public/*, /api/me uçlarını kullanabilir (sunucu denetler).
 * Akış: ?t=<davet> → davet bilgisi → kayıt | giriş + kabul → sınıflar. #sinif-<id> → sınıf panosu (öğrenciler, ünite kapsamı
 * ısı haritası, ödevler, CSV). Öğrenciler ad + soyadın baş harfiyle görünür; e-posta yalnızca yönetici açtıysa.
 */
(function () {
  "use strict";
  document.documentElement.setAttribute("data-apz-auth", "ok");
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
    el.hidden = false; el.textContent = metin; el.className = "form-alert" + (tur === "ok" ? " is-ok" : "");
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
  function tarih(iso) { return iso ? new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short", year: "numeric" }) : "—"; }
  function goreli(iso) {
    if (!iso) return "henüz yok";
    var d = new Date(iso), fark = Date.now() - d.getTime(), g = Math.floor(fark / 864e5);
    if (fark < 36e5) return "1 saatten az önce";
    if (g < 1) return "bugün"; if (g === 1) return "dün"; if (g < 7) return g + " gün önce";
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  }
  var yuzde = function (v) { return v == null ? "—" : "%" + v; };
  var tokenParam = new URLSearchParams(location.search).get("t");
  var S = { ben: null, panel: null, pano: null, davet: null };

  function goster(id) {
    ["og-yukleniyor", "og-giris", "og-panel", "og-sinif"].forEach(function (x) { $(x).hidden = x !== id; });
  }
  function odak(id) { var h = $(id); if (h) try { h.focus({ preventScroll: false }); } catch (e) { h.focus(); } }

  // ------------------------------------------------------------ oturum / davet
  function basla() {
    istek("GET", "/api/me").then(function (m) {
      S.ben = m.ok ? m.user : null;
      if (S.ben) { $("og-hesap").hidden = false; $("og-ad").textContent = (S.ben.ad + " " + S.ben.soyad).trim(); }
      if (tokenParam) return davetAc();
      if (!S.ben) return girisGoster();
      if (S.ben.rol !== "ogretmen") { girisGoster("Bu sayfa öğretmen hesapları içindir. Öğrenci hesabıyla giriş yaptınız."); $("og-login").hidden = true; return; }
      yonlendir();
    });
  }
  function girisGoster(mesaj) {
    goster("og-giris");
    $("og-login").hidden = false; $("og-kayit").hidden = true; $("og-kabul").hidden = true;
    uyari($("og-giris-alert"), mesaj || "");
  }
  function davetAc() {
    istek("GET", "/api/public/ogretmen-davet?t=" + encodeURIComponent(tokenParam)).then(function (j) {
      goster("og-giris");
      if (!j.ok) { girisGoster(j.error || "Davet bağlantısı geçersiz."); return; }
      S.davet = j.davet;
      $("og-giris-baslik").textContent = j.davet.okul + " · öğretmen daveti";
      if (S.ben && S.ben.rol === "ogretmen") {
        $("og-giris-lead").textContent = "Daveti kabul edince " + j.davet.okul + " lisansıyla sınıf açabilirsiniz.";
        $("og-kabul").hidden = false; $("og-login").hidden = true; $("og-kayit").hidden = true; return;
      }
      if (j.davet.hesapVar) {
        $("og-giris-lead").textContent = "Bu adresle bir hesap var. Giriş yapıp daveti kabul edin.";
        $("og-login").hidden = false; $("og-kayit").hidden = true; $("ol-eposta").value = j.davet.eposta; return;
      }
      $("og-giris-lead").textContent = j.davet.okul + " için öğretmen hesabınızı açın. Adınızı ve bir şifre belirlemeniz yeterli.";
      $("og-kayit").hidden = false; $("og-login").hidden = true; $("ok-eposta").value = j.davet.eposta;
    });
  }
  $("og-kayit").addEventListener("submit", function (e) {
    e.preventDefault();
    var b = $("ok-btn"), f = { t: tokenParam, ad: $("ok-ad").value, soyad: $("ok-soyad").value, sifre: $("ok-sifre").value, sifre2: $("ok-sifre2").value, kvkk: $("ok-kvkk").checked, kosullar: $("ok-kosullar").checked };
    mesgul(b, true, "Hesap açılıyor…");
    istek("POST", "/api/ogretmen/kayit", f).then(function (j) {
      mesgul(b, false);
      var ilk = alanHata("ok", j.errors, ["ad", "soyad", "sifre", "sifre2", "kvkk", "kosullar"]);
      if (!j.ok) { uyari($("og-giris-alert"), j.error); if (ilk) ilk.focus(); return; }
      history.replaceState(null, "", "/ogretmen"); tokenParam = null; basla();
    });
  });
  $("og-login").addEventListener("submit", function (e) {
    e.preventDefault();
    var b = $("ol-btn");
    mesgul(b, true, "Giriş yapılıyor…");
    istek("POST", "/api/auth/login", { kimlik: $("ol-eposta").value, sifre: $("ol-sifre").value }).then(function (j) {
      mesgul(b, false);
      if (!j.ok) { uyari($("og-giris-alert"), j.error || "Giriş yapılamadı."); return; }
      if (tokenParam) return istek("POST", "/api/ogretmen/kabul", { t: tokenParam }).then(function (k) {
        if (!k.ok) { uyari($("og-giris-alert"), k.error); return; }
        history.replaceState(null, "", "/ogretmen"); tokenParam = null; basla();
      });
      basla();
    });
  });
  $("og-kabul-btn").addEventListener("click", function () {
    var b = this; mesgul(b, true);
    istek("POST", "/api/ogretmen/kabul", { t: tokenParam }).then(function (k) {
      mesgul(b, false);
      if (!k.ok) { uyari($("og-giris-alert"), k.error); return; }
      history.replaceState(null, "", "/ogretmen"); tokenParam = null; basla();
    });
  });
  $("og-cikis").addEventListener("click", function () { istek("POST", "/api/auth/logout").then(function () { location.href = "/ogretmen"; }); });

  // ------------------------------------------------------------ yönlendirme
  function yonlendir() {
    var m = /^#sinif-(\d+)$/.exec(location.hash || "");
    if (m) sinifAc(+m[1]); else panelAc();
  }
  window.addEventListener("hashchange", function () { if (S.ben && S.ben.rol === "ogretmen") yonlendir(); });

  // ------------------------------------------------------------ sınıflar
  function panelAc() {
    istek("GET", "/api/ogretmen/panel").then(function (j) {
      if (!j.ok) { girisGoster(j.error); return; }
      S.panel = j; goster("og-panel");
      $("og-baslik").textContent = "Merhaba " + j.ogretmen.ad;
      var k = j.okul;
      $("og-okul").textContent = k ? k.ad + (k.sehir ? " · " + k.sehir : "") : "Hesabınız şu an etkin bir okula bağlı değil. Okulunuzun yöneticisiyle iletişime geçin.";
      $("og-koltuk").innerHTML = k ? '<div><dt>Premium koltuk</dt><dd>' + k.kullanilan + " / " + k.koltuk + "</dd></div><div><dt>Lisans bitişi</dt><dd>" + esc(k.gecerli ? tarih(k.bitis) : "Lisans yok") + "</dd></div>" : "";
      var sel = $("oy-ders");
      if (!sel.options.length) j.dersler.forEach(function (d) { var o = document.createElement("option"); o.value = d.ders; o.textContent = d.ad; sel.appendChild(o); });
      $("og-yeni").closest("section").hidden = !k;
      var l = j.siniflar;
      $("og-siniflar").innerHTML = l.length ? l.map(function (s) {
        return '<article class="vp-kart ogt-sinif-kart"><h3><a href="#sinif-' + s.id + '">' + esc(s.ad) + '</a></h3><p class="vp-not">' + esc(s.dersAd) + '</p>' +
          '<dl class="ogt-mini"><div><dt>Öğrenci</dt><dd>' + s.uye + '</dd></div><div><dt>Ödev</dt><dd>' + s.odev + '</dd></div><div><dt>Kod</dt><dd class="ogt-kod-kucuk">' + esc(s.kod) + "</dd></div></dl>" +
          '<a class="btn-ghost btn-sm" href="#sinif-' + s.id + '">Panoyu aç</a></article>';
      }).join("") : (k ? '<section class="vp-kart vp-bos"><h2>Henüz sınıf yok</h2><p>Yukarıdan bir sınıf açın; size 6 karakterlik bir katılım kodu verilir.</p></section>' : "");
      odak("og-baslik");
    });
  }
  $("og-yeni").addEventListener("submit", function (e) {
    e.preventDefault();
    var b = $("oy-btn"); mesgul(b, true, "Açılıyor…");
    istek("POST", "/api/ogretmen/siniflar", { ad: $("oy-ad").value, ders: $("oy-ders").value }).then(function (j) {
      mesgul(b, false);
      var ilk = alanHata("oy", j.errors, ["ad", "ders"]);
      if (!j.ok) { uyari($("og-panel-alert"), j.error); if (ilk) ilk.focus(); return; }
      $("oy-ad").value = ""; location.hash = "#sinif-" + j.sinif.id;
    });
  });

  // ------------------------------------------------------------ sınıf panosu
  var DURUM = { tamam: ["Tamamlandı", "ok"], devam: ["Devam ediyor", "info"], baslamadi: ["Başlamadı", "notr"], gecikti: ["Gecikti", "warn"] };
  var IKON = { tamam: "✓", devam: "◐", baslamadi: "○", gecikti: "!" };
  function rozet(d) { var x = DURUM[d] || [d, "notr"]; return '<span class="ogt-durum is-' + x[1] + '"><span aria-hidden="true">' + IKON[d] + "</span> " + x[0] + "</span>"; }
  function sinifAc(id) {
    istek("GET", "/api/ogretmen/siniflar/" + id).then(function (j) {
      if (!j.ok) { location.hash = ""; uyari($("og-panel-alert"), j.error); return; }
      S.pano = j; goster("og-sinif"); ciz(); odak("os-baslik");
    });
  }
  function ciz() {
    var j = S.pano, s = j.sinif;
    $("os-baslik").textContent = s.ad;
    $("os-alt").textContent = s.dersAd + " · " + s.uye + " öğrenci";
    $("os-kod").textContent = s.kod;
    $("os-link").value = s.link;
    $("os-csv").href = "/api/ogretmen/siniflar/" + s.id + "/csv";
    // Öğrenciler
    var ep = j.okul.epostaGorunur;
    $("os-liste").innerHTML = j.ogrenciler.length ? '<div class="ogt-tablo-kap" tabindex="0" role="region" aria-label="Öğrenci listesi"><table class="ogt-tablo"><thead><tr><th scope="col">Öğrenci</th>' + (ep ? '<th scope="col">E-posta</th>' : "") +
      '<th scope="col">Son etkinlik</th><th scope="col" class="sayi">Bu hafta soru</th><th scope="col" class="sayi">Doğruluk</th><th scope="col" class="sayi">Seri</th><th scope="col" class="sayi">Tahmini AP</th><th scope="col"><span class="sr-only">İşlem</span></th></tr></thead><tbody>' +
      j.ogrenciler.map(function (o) {
        return '<tr><th scope="row">' + esc(o.ad) + "</th>" + (ep ? "<td>" + esc(o.eposta || "—") + "</td>" : "") + "<td>" + esc(goreli(o.sonAktif)) + '</td><td class="sayi">' + o.haftaSoru +
          (o.haftaDogruluk != null ? ' <span class="ogt-alt">(' + yuzde(o.haftaDogruluk) + ")</span>" : "") + '</td><td class="sayi">' + yuzde(o.dogruluk) + '</td><td class="sayi">' + o.seri + ' gün</td><td class="sayi">' +
          (o.tahminiPuan != null ? '<strong>' + o.tahminiPuan + "</strong>" : "—") + '</td><td><button type="button" class="link-btn ogt-cikar" data-cikar="' + o.id + '" data-ad="' + esc(o.ad) + '">Çıkar</button></td></tr>';
      }).join("") + "</tbody></table></div>" : '<p class="vp-not">Henüz öğrenci yok. Katılım kodunu paylaşın; öğrenciler onay verip katılınca burada görünür.</p>';
    // Isı haritası (öğrenci × ünite; tek renk tonu, hücrede metin değer)
    var b = j.birimler;
    $("os-isi").innerHTML = j.ogrenciler.length && b.length ? '<div class="ogt-tablo-kap" tabindex="0" role="region" aria-label="Ünite kapsamı tablosu"><table class="ogt-isi"><thead><tr><th scope="col">Öğrenci</th>' +
      b.map(function (u, i) { return '<th scope="col" title="' + esc(u.ad) + '"><span class="ogt-isi-bas">' + esc(u.no ? "Ü" + u.no : u.ad) + "</span></th>"; }).join("") + "</tr></thead><tbody>" +
      j.ogrenciler.map(function (o) {
        return '<tr><th scope="row">' + esc(o.ad) + "</th>" + o.kapsam.map(function (k, i) {
          var kat = k == null || k === 0 ? 0 : Math.min(5, Math.ceil(k / 20));
          return '<td class="isi-' + kat + '" title="' + esc(o.ad + " · " + b[i].ad + ": " + (k ? "%" + k : "henüz yok")) + '">' + (k ? k : "—") + "</td>";
        }).join("") + "</tr>";
      }).join("") + '</tbody></table></div><div class="ogt-lejant" aria-hidden="true"><span>Az</span>' + [1, 2, 3, 4, 5].map(function (n) { return '<i class="isi-' + n + '"></i>'; }).join("") + "<span>Çok</span></div>" +
      '<ul class="ogt-isi-ad">' + b.map(function (u) { return "<li><strong>" + esc(u.no ? "Ü" + u.no : "") + "</strong> " + esc(u.ad) + "</li>"; }).join("") + "</ul>"
      : '<p class="vp-not">Öğrenciler soru çözdükçe ünite kapsamı burada görünür.</p>';
    // Ödevler
    $("os-odevler").innerHTML = j.odevler.length ? j.odevler.map(function (od, i) {
      return '<article class="ogt-odev"><div class="ogt-odev-bas"><div><h3>' + esc(od.baslik) + '</h3><p class="vp-not">' + esc(od.turAd) + (od.sonTarih ? " · son gün " + esc(tarih(od.sonTarih)) : "") + "</p></div>" +
        '<div class="ogt-odev-oran"><strong>' + (od.yuzde == null ? "—" : "%" + od.yuzde) + '</strong><span class="ogt-alt">' + od.tamam + " / " + od.toplam + " tamamladı</span></div></div>" +
        '<div class="ogt-cubuk" role="img" aria-label="Tamamlanma %' + (od.yuzde || 0) + '"><span style="width:' + (od.yuzde || 0) + '%"></span></div>' +
        '<details><summary>Öğrenci durumları</summary><ul class="ogt-odev-liste">' + j.ogrenciler.map(function (o) {
          var d = o.odevler[i]; return "<li><span>" + esc(o.ad) + "</span>" + rozet(d.durum) + (d.hedef > 1 ? ' <span class="ogt-alt">' + d.ilerleme + "/" + d.hedef + "</span>" : "") + "</li>";
        }).join("") + '</ul></details><button type="button" class="link-btn ogt-cikar" data-iptal="' + od.id + '">Ödevi kaldır</button></article>';
    }).join("") : '<p class="vp-not">Henüz ödev yok.</p>';
    hedefDoldur();
  }
  function hedefDoldur() {
    var tur = $("od-tur").value, sec = S.pano.secenekler, sel = $("od-hedef"), l = [];
    if (tur === "unite") l = sec.uniteler.map(function (u) { return { v: JSON.stringify({ sayfa: u.sayfa, kutu: u.kutu }), t: (u.no ? "Ünite " + u.no + " · " : "") + u.ad + " (" + u.banka + " soru)" }; });
    else if (tur === "deneme") l = sec.denemeler.map(function (d) { return { v: JSON.stringify({ kod: d.kod }), t: d.ad }; });
    else if (tur === "tam_sinav") l = sec.tamSinavlar.map(function (d) { return { v: JSON.stringify({ kod: d.kod }), t: d.ad }; });
    else if (tur === "frq") l = sec.frq.map(function (d) { return { v: JSON.stringify({ ders: d.ders }), t: d.ad }; });
    sel.innerHTML = l.map(function (x) { return '<option value="' + esc(x.v) + '">' + esc(x.t) + "</option>"; }).join("");
    $("od-hedef-alan").hidden = tur === "kart";
    $("od-adet-alan").hidden = !(tur === "unite" || tur === "kart");
    $("od-adet").placeholder = tur === "kart" ? "20" : "10";
  }
  $("od-tur").addEventListener("change", hedefDoldur);
  $("os-odev-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var tur = $("od-tur").value, h = {};
    try { h = tur === "kart" ? {} : JSON.parse($("od-hedef").value || "{}"); } catch (x) { h = {}; }
    if ($("od-adet").value) h.adet = +$("od-adet").value;
    var b = $("od-btn"); mesgul(b, true, "Veriliyor…");
    istek("POST", "/api/ogretmen/siniflar/" + S.pano.sinif.id + "/odevler", { tur: tur, hedef: h, sonTarih: $("od-son").value || null, baslik: $("od-baslik").value }).then(function (j) {
      mesgul(b, false);
      var ilk = alanHata("od", j.errors, ["tur", "hedef", "sonTarih", "baslik"]);
      if (!j.ok) { uyari($("os-odev-alert"), j.error); if (ilk) ilk.focus(); return; }
      uyari($("os-odev-alert"), ""); $("od-baslik").value = ""; $("od-adet").value = ""; $("od-son").value = "";
      $("os-odev-ac").open = false; sinifAc(S.pano.sinif.id);
    });
  });
  $("og-sinif").addEventListener("click", function (e) {
    var c = e.target.closest("[data-cikar]"), i = e.target.closest("[data-iptal]");
    if (c) {
      if (!window.confirm(c.getAttribute("data-ad") + " sınıftan çıkarılsın mı? Okul Premium'u (varsa) sona erer; öğrenci isterse kodla yeniden katılabilir.")) return;
      istek("POST", "/api/ogretmen/siniflar/" + S.pano.sinif.id + "/uyeler/" + c.getAttribute("data-cikar") + "/cikar").then(function () { sinifAc(S.pano.sinif.id); });
    } else if (i) {
      if (!window.confirm("Bu ödev kaldırılsın mı?")) return;
      istek("POST", "/api/ogretmen/odevler/" + i.getAttribute("data-iptal") + "/iptal").then(function () { sinifAc(S.pano.sinif.id); });
    }
  });
  $("os-kopya").addEventListener("click", function () {
    var v = $("os-link").value, d = $("os-kopya-durum");
    var bitti = function () { d.textContent = "Bağlantı kopyalandı."; setTimeout(function () { d.textContent = ""; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(bitti, function () { $("os-link").select(); d.textContent = "Seçildi: Ctrl+C ile kopyalayın."; });
    else { $("os-link").select(); d.textContent = "Seçildi: Ctrl+C ile kopyalayın."; }
  });

  basla();
})();
