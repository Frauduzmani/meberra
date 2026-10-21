/**
 * Meberra yönetici paneli — "Büyüme" sekmesi (v1.6.0)
 * Dönüşüm hunisi (Ziyaret → … → Premium; adım dönüşüm oranı; 7/30/90 gün; utm kaynağı süzgeci), kayıt haftası kohortu
 * (hafta 1–8 etkin %), günlük etkin kullanıcı / yeni kayıt / Premium dönüşümü / deneme (ayrı küçük grafikler, tek eksen),
 * en çok paywall görülen yerler, 7 günlük denemeler (uzat / iptal), indirim kodları (oluştur / düzenle / pasifleştir,
 * kullanım), davetler (dolandırıcılık bayrakları). Grafikler satır içi SVG/HTML; kütüphane yok.
 * admin.js ortak yardımcıları window.MEBERRA_ADMIN ile verir; bu dosya window.MEBERRA_ADMIN_BUYUME = { kur, ac } tanımlar.
 * Uçlar: GET /api/admin/buyume/analiz?gun=&kaynak=, /buyume/ozet, /buyume/denemeler, POST /buyume/denemeler/:id/(uzat|iptal),
 *        GET/POST /api/admin/kuponlar, PUT /api/admin/kuponlar/:id, GET /api/admin/davetler
 */
(function () {
  "use strict";
  var A = null, P = null;
  var S = { gun: 30, kaynak: "", istek: 0, kuponDuzen: null };
  var NEDEN = { "kendi-kodu": "Kendi kodu", "ayni-ip": "Aynı IP (24 sa)", "tekrar-eposta": "Aynı e-posta yeniden", "yogun-davet": "24 saatte 5+ davet", "hesap-silindi": "Hesap silindi" };
  var DAVET_DURUM = { bekliyor: ["Seviye testi bekleniyor", "warn"], odullendi: ["Ödüllendi", "ok"], reddedildi: ["Reddedildi", "bad"] };
  var $ = function (s) { return P.querySelector(s); };
  function esc(v) { return A.esc(v); }
  function sayi(n) { return A.sayi(n); }
  function gunAd(iso) { var d = new Date(iso + "T12:00:00Z"); return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); }
  function tl(n) { return n == null ? "—" : Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " ₺"; }

  function kur(panel) {
    A = window.MEBERRA_ADMIN; P = panel;
    if (!A || !P) return;
    if (!document.querySelector('link[href*="admin-buyume.css"]')) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "assets/css/admin-buyume.css?v=20261021b"; document.head.appendChild(l);
    }
    P.innerHTML =
      '<div class="adm-panel-ust"><h2>Büyüme</h2></div>' +
      '<p class="adm-ipucu">Birinci taraf ölçüm (üçüncü taraf betik yok). Huni her adımda önceki adımların hepsini yapmış kişileri sayar; kişi = kayıtlıysa hesap, değilse tarayıcıdaki rastgele ziyaretçi kimliği. ' +
        "Ölçümü kapatan ya da tarayıcısında Do Not Track / GPC açık olan kullanıcılar sayılmaz. Gelir tahmini denemeleri saymaz, indirimli tutarı kullanır.</p>" +
      '<div class="bu-filtre" role="group" aria-label="Süzgeçler">' +
        '<div class="field"><span class="field-hint" id="bu-gun-l">Tarih aralığı</span><div class="bu-seg" role="group" aria-labelledby="bu-gun-l">' +
          [7, 30, 90].map(function (g) { return '<button type="button" data-gun="' + g + '" aria-pressed="' + (g === S.gun) + '">' + g + " gün</button>"; }).join("") + "</div></div>" +
        '<div class="field adm-field-dar"><label for="bu-kaynak" class="field-hint">Kaynak (utm_source)</label><select id="bu-kaynak" class="text-input"><option value="">Tümü</option></select></div>' +
      "</div>" +
      '<div class="bu-viz" id="bu-viz">' + A.iskelet("kart", 4) + "</div>" +
      '<section class="bu-kart" aria-labelledby="bu-den-h"><div class="bu-kart-ust"><h3 id="bu-den-h">7 günlük denemeler</h3>' +
        '<label class="check-row"><input type="checkbox" id="bu-den-hepsi"> <span>Bitenleri de göster</span></label></div><div id="bu-den"></div></section>' +
      '<section class="bu-kart" aria-labelledby="bu-kup-h"><div class="bu-kart-ust"><h3 id="bu-kup-h">İndirim kodları</h3></div>' +
        '<form class="bu-form" id="bu-kup-form" novalidate>' +
          '<div class="field"><label for="bu-k-kod">Kod</label><input id="bu-k-kod" class="text-input" maxlength="30" autocapitalize="characters" required></div>' +
          '<div class="field"><label for="bu-k-tur">Tür</label><select id="bu-k-tur" class="text-input"><option value="yuzde">Yüzde (%)</option><option value="tutar">Tutar (₺)</option></select></div>' +
          '<div class="field"><label for="bu-k-deger">Değer</label><input id="bu-k-deger" class="text-input" type="number" min="1" step="1" required></div>' +
          '<div class="field"><label for="bu-k-plan">Plan</label><select id="bu-k-plan" class="text-input"><option value="hepsi">Hepsi</option><option value="aylik">Aylık</option><option value="yillik">Yıllık</option></select></div>' +
          '<div class="field"><label for="bu-k-bas">Başlangıç</label><input id="bu-k-bas" class="text-input" type="date"></div>' +
          '<div class="field"><label for="bu-k-bit">Bitiş</label><input id="bu-k-bit" class="text-input" type="date"></div>' +
          '<div class="field"><label for="bu-k-max">En çok kullanım</label><input id="bu-k-max" class="text-input" type="number" min="1" placeholder="Sınırsız"></div>' +
          '<div class="field"><label for="bu-k-kisi">Kişi başı</label><input id="bu-k-kisi" class="text-input" type="number" min="1" value="1"></div>' +
          '<div class="field"><label for="bu-k-ac">Açıklama</label><input id="bu-k-ac" class="text-input" maxlength="200"></div>' +
          '<div class="field"><button type="submit" class="btn-primary btn-sm" id="bu-k-kaydet">Kodu oluştur</button> <button type="button" class="btn-ghost btn-sm" id="bu-k-vazgec" hidden>Vazgeç</button></div>' +
        '</form><p class="field-error" id="bu-k-hata" role="alert"></p><div id="bu-kup"></div></section>' +
      '<section class="bu-kart" aria-labelledby="bu-dav-h"><div class="bu-kart-ust"><h3 id="bu-dav-h">Davetler</h3>' +
        '<select id="bu-dav-durum" class="text-input" aria-label="Davet durumu"><option value="">Tümü</option><option value="bekliyor">Bekleyen</option><option value="odullendi">Ödüllenen</option><option value="reddedildi">Reddedilen</option></select></div>' +
        '<p class="adm-ipucu">Davet edilen kayıt olup seviye testini bitirince iki tarafa 7 gün Premium (davet edene yılda en çok 10). Kendi kodu, 24 saat içinde aynı IP ve silinip aynı e-postayla yeniden kayıt reddedilir.</p><div id="bu-dav"></div></section>';

    P.addEventListener("click", function (e) {
      var g = e.target.closest("[data-gun]");
      if (g) { S.gun = +g.getAttribute("data-gun"); P.querySelectorAll("[data-gun]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === g)); }); analizYukle(); return; }
      var u = e.target.closest("[data-den-uzat]");
      if (u) { denemeIslem(u.getAttribute("data-den-uzat"), "uzat", u); return; }
      var i = e.target.closest("[data-den-iptal]");
      if (i) { denemeIslem(i.getAttribute("data-den-iptal"), "iptal", i); return; }
      var kd = e.target.closest("[data-kup-duzen]");
      if (kd) { kuponDuzenle(+kd.getAttribute("data-kup-duzen")); return; }
      var ka = e.target.closest("[data-kup-aktif]");
      if (ka) { kuponAktif(+ka.getAttribute("data-kup-aktif"), ka.getAttribute("data-deger") === "1", ka); return; }
      if (e.target.closest("[data-tekrar]")) ac();
    });
    $("#bu-kaynak").addEventListener("change", function () { S.kaynak = this.value; analizYukle(); });
    $("#bu-den-hepsi").addEventListener("change", denemeYukle);
    $("#bu-dav-durum").addEventListener("change", davetYukle);
    $("#bu-kup-form").addEventListener("submit", function (e) { e.preventDefault(); kuponKaydet(); });
    $("#bu-k-vazgec").addEventListener("click", kuponFormSifirla);
  }

  function ac() { analizYukle(); denemeYukle(); kuponYukle(); davetYukle(); }

  // ============================================================================ analiz
  function analizYukle() {
    var n = ++S.istek, kap = $("#bu-viz");
    Promise.all([
      A.api("/api/admin/buyume/analiz?gun=" + S.gun + (S.kaynak ? "&kaynak=" + encodeURIComponent(S.kaynak) : "")),
      A.api("/api/admin/buyume/ozet")
    ]).then(function (r) {
      if (n !== S.istek) return;
      var a = r[0], o = r[1];
      var sec = $("#bu-kaynak"), eski = S.kaynak;
      sec.innerHTML = '<option value="">Tümü</option>' + a.kaynaklar.map(function (k) { return '<option value="' + esc(k.ad) + '">' + esc(k.ad === "(yok)" ? "Doğrudan / bilinmiyor" : k.ad) + " (" + sayi(k.kisi) + ")</option>"; }).join("") +
        (eski && !a.kaynaklar.some(function (k) { return k.ad === eski; }) ? '<option value="' + esc(eski) + '">' + esc(eski) + "</option>" : "");
      sec.value = eski;
      kap.innerHTML = ozetHtml(o) + huniHtml(a.huni) + gunlukHtml(a.gunluk) + kohortHtml(a.kohort) + paywallHtml(a.paywall);
      cizgiEtkilesim(kap, a.gunluk);
    }).catch(function (e) { if (n === S.istek) kap.innerHTML = A.hataKutusu(e.message); });
  }

  function ozetHtml(o) {
    var t = function (et, deger, alt, ton) { return '<li><div class="adm-tile is-' + (ton || "mor") + '"><span class="adm-tile-etiket">' + esc(et) + '</span><span class="adm-tile-deger">' + deger + '</span><span class="adm-tile-alt">' + esc(alt) + "</span></div></li>"; };
    return '<ul class="adm-tiles adm-tiles-kucuk" aria-label="Büyüme özeti">' +
      t("Aktif deneme", sayi(o.deneme.aktif), "toplam " + sayi(o.deneme.toplam) + " deneme", "enerji") +
      t("Denemeden ücretliye", o.deneme.donusum == null ? "—" : "%" + o.deneme.donusum.toLocaleString("tr-TR"), sayi(o.deneme.ucretliyeGecen) + " kişi ödeme yaptı", "ok") +
      t("İndirim kodu kullanımı", sayi(o.kupon.kullanim), sayi(o.kupon.aktif) + " aktif kod") +
      t("Ödüllü davet", sayi(o.davet.odullendi), sayi(o.davet.bekliyor) + " bekleyen · " + sayi(o.davet.reddedildi) + " reddedilen") + "</ul>";
  }

  /** Huni: tek seri yatay çubuk, ilk adıma göre ölçek; adım dönüşüm oranı sağda. Tablo okunur (sayılar metin). */
  function huniHtml(adimlar) {
    var ilk = adimlar[0] ? adimlar[0].kisi : 0;
    return '<section class="bu-kart" aria-labelledby="bu-huni-h"><div class="bu-kart-ust"><h3 id="bu-huni-h">Dönüşüm hunisi</h3><span class="adm-alt">Son ' + S.gun + " gün" + (S.kaynak ? " · " + esc(S.kaynak) : "") + "</span></div>" +
      '<ol class="bu-huni" aria-describedby="bu-huni-h">' +
      '<li aria-hidden="true"><span class="bu-huni-bas">Adım</span><span></span><span class="bu-huni-bas bu-huni-sayi">Kişi</span><span class="bu-huni-bas bu-huni-oran">Adım %</span></li>' +
      adimlar.map(function (a, i) {
        var w = ilk ? Math.max(0, a.kisi / ilk * 100) : 0;
        var ipucu = a.ad + ": " + sayi(a.kisi) + " kişi" + (i ? " · önceki adımdan %" + a.adimOrani : "") + " · yalnız bu adımı yapan: " + sayi(a.ham);
        return '<li tabindex="0" title="' + esc(ipucu) + '" aria-label="' + esc(ipucu) + '"><span class="bu-huni-ad">' + esc(a.ad) + "</span>" +
          '<span class="bu-huni-iz" aria-hidden="true"><span class="bu-huni-cubuk' + (a.kisi ? "" : " is-sifir") + '" style="width:' + w.toFixed(2) + '%"></span></span>' +
          '<span class="bu-huni-sayi">' + sayi(a.kisi) + '</span><span class="bu-huni-oran">' + (i ? "%" + Number(a.adimOrani).toLocaleString("tr-TR") : "—") + "</span></li>";
      }).join("") + "</ol></section>";
  }

  var SERILER = [["etkin", "Günlük etkin kullanıcı"], ["kayit", "Yeni kayıt"], ["premium", "Premium dönüşümü (ödemeli)"], ["deneme", "Başlayan deneme"]];
  /** Küçük çoklu grafikler: her ölçü kendi grafiğinde (tek y ekseni), 2px çizgi + hafif alan, artı imleç + ipucu */
  function gunlukHtml(g) {
    return '<section class="bu-kart" aria-labelledby="bu-gun-h"><div class="bu-kart-ust"><h3 id="bu-gun-h">Günlük</h3><span class="adm-alt">UTC günü</span></div><div class="bu-coklu">' +
      SERILER.map(function (s) {
        var v = g[s[0]], max = Math.max.apply(null, v.concat([1])), n = v.length, W = 300, H = 110, top = v.reduce(function (t, x) { return t + x; }, 0);
        var x = function (i) { return n > 1 ? i / (n - 1) * W : W / 2; }, y = function (d) { return H - d / max * (H - 8); };
        var nok = v.map(function (d, i) { return x(i).toFixed(1) + "," + y(d).toFixed(1); });
        var ust = Math.ceil(max);
        return '<figure class="bu-cizgi" data-seri="' + s[0] + '"><figcaption>' + esc(s[1]) + "<span>toplam " + sayi(top) + "</span></figcaption>" +
          '<svg viewBox="0 0 ' + W + " " + (H + 2) + '" preserveAspectRatio="none" role="img" aria-label="' + esc(s[1] + ": son " + n + " gün, toplam " + top + ", en yüksek " + max) + '">' +
          '<line class="bu-izgara" x1="0" x2="' + W + '" y1="' + y(ust) + '" y2="' + y(ust) + '"/><line class="bu-izgara" x1="0" x2="' + W + '" y1="' + H + '" y2="' + H + '"/>' +
          '<text class="bu-eksen-y" x="2" y="' + (y(ust) + 10) + '">' + sayi(ust) + "</text>" +
          '<path class="bu-alan" d="M0,' + H + " L" + nok.join(" L") + " L" + W + "," + H + ' Z"/>' +
          '<polyline class="bu-hat" vector-effect="non-scaling-stroke" points="' + nok.join(" ") + '"/>' +
          '<line class="bu-imlec" x1="0" x2="0" y1="0" y2="' + H + '" vector-effect="non-scaling-stroke" visibility="hidden"/>' +
          '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent" data-alan/></svg>' +
          '<div class="bu-tarih-ekseni" aria-hidden="true"><span>' + esc(gunAd(g.gunler[0])) + "</span><span>" + esc(gunAd(g.gunler[n - 1])) + "</span></div>" +
          '<div class="bu-ipucu" hidden></div></figure>';
      }).join("") + "</div>" +
      '<details><summary>Tablo olarak göster</summary><div class="adm-tablo-kap"><table class="adm-tablo"><caption class="visually-hidden">Günlük ölçüler</caption><thead><tr><th>Gün</th>' +
        SERILER.map(function (s) { return '<th class="adm-sag">' + esc(s[1]) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        g.gunler.slice().reverse().map(function (d, j) { var i = g.gunler.length - 1 - j; return "<tr><td>" + esc(d) + "</td>" + SERILER.map(function (s) { return '<td class="adm-sag">' + sayi(g[s[0]][i]) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div></details></section>";
  }
  function cizgiEtkilesim(kap, g) {
    kap.querySelectorAll(".bu-cizgi").forEach(function (f) {
      var seri = g[f.getAttribute("data-seri")], n = seri.length, svg = f.querySelector("svg"), imlec = f.querySelector(".bu-imlec"), ip = f.querySelector(".bu-ipucu");
      var goster = function (cx) {
        var r = svg.getBoundingClientRect(); if (!r.width) return;
        var i = Math.max(0, Math.min(n - 1, Math.round((cx - r.left) / r.width * (n - 1))));
        var px = n > 1 ? i / (n - 1) * 300 : 150;
        imlec.setAttribute("x1", px); imlec.setAttribute("x2", px); imlec.setAttribute("visibility", "visible");
        ip.hidden = false; ip.textContent = gunAd(g.gunler[i]) + ": " + sayi(seri[i]);
        ip.style.left = (svg.offsetLeft + (n > 1 ? i / (n - 1) : 0.5) * svg.clientWidth) + "px";
        ip.style.top = (svg.offsetTop + 8) + "px";
      };
      var gizle = function () { imlec.setAttribute("visibility", "hidden"); ip.hidden = true; };
      svg.addEventListener("pointermove", function (e) { goster(e.clientX); });
      svg.addEventListener("pointerleave", gizle);
    });
  }

  /** Kohort: kayıt haftası × hafta 1–8 etkin %; tek ton sıralı ısı (açık → koyu), değer hücrede yazılı */
  function kohortHtml(k) {
    var seviye = function (p) { return p == null ? null : p <= 0 ? 0 : Math.min(6, 1 + Math.floor(p / 100 * 6)); };
    var govde = k.length ? k.map(function (r) {
      return "<tr><th scope=\"row\">" + esc(gunAd(r.hafta)) + ' <span class="adm-alt">(' + sayi(r.kisi) + ")</span></th>" + r.oranlar.map(function (p, i) {
        var s = seviye(p);
        return s == null ? '<td class="bu-bos" title="Henüz başlamadı">·</td>' :
          '<td class="bu-hucre" style="background:var(--bu-isi-' + s + ");color:var(--bu-y" + s + ')" title="' + esc(gunAd(r.hafta) + " kohortu, hafta " + (i + 1) + ": %" + p) + '">%' + p + "</td>";
      }).join("") + "</tr>";
    }).join("") : '<tr><td colspan="9">' + esc("Son 9 haftada kayıt yok.") + "</td></tr>";
    return '<section class="bu-kart" aria-labelledby="bu-koh-h"><div class="bu-kart-ust"><h3 id="bu-koh-h">Kohort elde tutma</h3>' +
      '<span class="bu-lejant" aria-hidden="true">%0 <i style="background:var(--bu-isi-1)"></i><i style="background:var(--bu-isi-3)"></i><i style="background:var(--bu-isi-5)"></i><i style="background:var(--bu-isi-6)"></i> %100</span></div>' +
      '<p class="adm-ipucu">Satır: kayıt haftası (öğrenci sayısı). Hafta k: kayıttan sonraki 7k–7k+6. günlerde etkin (olay, cevap ya da giriş) olanların oranı.</p>' +
      '<div class="adm-tablo-kap"><table class="adm-tablo bu-kohort"><caption class="visually-hidden">Kayıt haftasına göre haftalık etkinlik yüzdesi</caption><thead><tr><th>Kayıt haftası</th>' +
      [1, 2, 3, 4, 5, 6, 7, 8].map(function (h) { return '<th class="adm-sag">H' + h + "</th>"; }).join("") + "</tr></thead><tbody>" + govde + "</tbody></table></div></section>";
  }

  function paywallHtml(l) {
    var max = l.reduce(function (m, x) { return Math.max(m, x.kisi); }, 0) || 1;
    return '<section class="bu-kart" aria-labelledby="bu-pw-h"><div class="bu-kart-ust"><h3 id="bu-pw-h">En çok paywall görülen yerler</h3><span class="adm-alt">kişi · gösterim</span></div>' +
      (l.length ? '<ol class="bu-huni">' + l.map(function (x) {
        var ipucu = x.yer + ": " + sayi(x.kisi) + " kişi, " + sayi(x.gosterim) + " gösterim";
        return '<li tabindex="0" title="' + esc(ipucu) + '" aria-label="' + esc(ipucu) + '"><span class="bu-huni-ad">' + esc(x.yer) + '</span><span class="bu-huni-iz" aria-hidden="true"><span class="bu-huni-cubuk" style="width:' + (x.kisi / max * 100).toFixed(1) + '%"></span></span>' +
          '<span class="bu-huni-sayi">' + sayi(x.kisi) + '</span><span class="bu-huni-oran">' + sayi(x.gosterim) + "</span></li>";
      }).join("") + "</ol>" : A.bos("Bu aralıkta paywall görülmedi.")) + "</section>";
  }

  // ============================================================================ denemeler
  function denemeYukle() {
    var kap = $("#bu-den");
    kap.innerHTML = A.yukleniyor();
    A.api("/api/admin/buyume/denemeler" + ($("#bu-den-hepsi").checked ? "?durum=hepsi" : "")).then(function (j) {
      if (!j.denemeler.length) { kap.innerHTML = A.bos("Gösterilecek deneme yok."); return; }
      var DUR = { aktif: ["Aktif", "ok"], bitti: ["Bitti", "notr"], iptal: ["İptal", "bad"] };
      kap.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo"><caption class="visually-hidden">Premium denemeleri</caption><thead><tr><th>Öğrenci</th><th>Başlangıç</th><th>Bitiş</th><th>Durum</th><th>Bildirim</th><th>İşlem</th></tr></thead><tbody>' +
        j.denemeler.map(function (d) {
          var k = d.kullanici, du = DUR[d.durum] || [d.durum, "notr"];
          return "<tr><td><strong>" + esc(k.ad + " " + k.soyad) + '</strong><br><span class="adm-alt">' + esc(k.eposta || "—") + "</span></td><td>" + A.zamanHucre(d.baslangic) + "</td><td>" + esc(A.tarih(d.bitis)) + "</td>" +
            "<td>" + A.rozet(du[0], du[1]) + (d.ucretliyeGecti ? " " + A.rozet("Ücretliye geçti", "mor") : "") + "</td>" +
            "<td>" + (d.hatirlatma ? A.rozet("2 gün kaldı", "info") + " " : "") + (d.bittiBildirim ? A.rozet("Bitti", "info") : "") + "</td>" +
            "<td>" + (d.durum !== "iptal" ? '<button type="button" class="btn-ghost btn-sm" data-den-uzat="' + esc(k.id) + '">+7 gün</button> ' : "") +
              (d.durum === "aktif" ? '<button type="button" class="btn-ghost btn-sm" data-den-iptal="' + esc(k.id) + '">İptal et</button>' : "") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }).catch(function (e) { kap.innerHTML = A.hataKutusu(e.message); });
  }
  function denemeIslem(id, islem, btn) {
    if (islem === "iptal" && !window.confirm("Deneme iptal edilsin mi? Öğrencinin Premium erişimi hemen kapanır.")) return;
    btn.disabled = true;
    A.api("/api/admin/buyume/denemeler/" + encodeURIComponent(id) + "/" + islem, "POST", islem === "uzat" ? { gun: 7 } : {}).then(function () {
      A.bildir(islem === "uzat" ? "Deneme 7 gün uzatıldı." : "Deneme iptal edildi.", "ok"); denemeYukle();
    }).catch(function (e) { btn.disabled = false; A.bildir(e.message, "bad"); });
  }

  // ============================================================================ kuponlar
  var kuponlar = [];
  function kuponYukle() {
    var kap = $("#bu-kup");
    A.api("/api/admin/kuponlar").then(function (j) {
      kuponlar = j.kuponlar;
      if (!kuponlar.length) { kap.innerHTML = A.bos("Henüz indirim kodu yok."); return; }
      kap.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo"><caption class="visually-hidden">İndirim kodları</caption><thead><tr><th>Kod</th><th>İndirim</th><th>Plan</th><th>Geçerlilik</th><th class="adm-sag">Kullanım</th><th class="adm-sag">Gelir</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>' +
        kuponlar.map(function (k) {
          var sure = (k.baslangic ? A.tarih(k.baslangic).split(" ")[0] : "…") + " – " + (k.bitis ? A.tarih(k.bitis).split(" ")[0] : "…");
          var bitti = k.bitis && Date.parse(k.bitis) <= Date.now();
          return "<tr><td><strong>" + esc(k.kod) + "</strong>" + (k.aciklama ? '<br><span class="adm-alt">' + esc(k.aciklama) + "</span>" : "") + "</td>" +
            "<td>" + (k.tur === "yuzde" ? "%" + esc(k.deger) : tl(k.deger)) + "</td><td>" + esc({ hepsi: "Hepsi", aylik: "Aylık", yillik: "Yıllık" }[k.plan]) + "</td><td>" + esc(sure) + "</td>" +
            '<td class="adm-sag">' + sayi(k.kullanim) + (k.maxKullanim ? " / " + sayi(k.maxKullanim) : "") + (k.bekleyen ? '<br><span class="adm-alt">' + sayi(k.bekleyen) + " bekleyen</span>" : "") + "</td>" +
            '<td class="adm-sag">' + tl(k.gelir) + '<br><span class="adm-alt">−' + tl(k.toplamIndirim) + "</span></td>" +
            "<td>" + (k.aktif ? (bitti ? A.rozet("Süresi doldu", "warn") : A.rozet("Aktif", "ok")) : A.rozet("Pasif", "notr")) + "</td>" +
            '<td><button type="button" class="btn-ghost btn-sm" data-kup-duzen="' + k.id + '">Düzenle</button> <button type="button" class="btn-ghost btn-sm" data-kup-aktif="' + k.id + '" data-deger="' + (k.aktif ? "0" : "1") + '">' + (k.aktif ? "Pasifleştir" : "Etkinleştir") + "</button></td></tr>";
        }).join("") + "</tbody></table></div>";
    }).catch(function (e) { kap.innerHTML = A.hataKutusu(e.message); });
  }
  var tarihGir = function (iso) { return iso ? iso.slice(0, 10) : ""; };
  function kuponDuzenle(id) {
    var k = kuponlar.filter(function (x) { return x.id === id; })[0];
    if (!k) return;
    S.kuponDuzen = id;
    $("#bu-k-kod").value = k.kod; $("#bu-k-tur").value = k.tur; $("#bu-k-deger").value = k.deger; $("#bu-k-plan").value = k.plan;
    $("#bu-k-bas").value = tarihGir(k.baslangic); $("#bu-k-bit").value = tarihGir(k.bitis); $("#bu-k-max").value = k.maxKullanim || ""; $("#bu-k-kisi").value = k.kisiBasi; $("#bu-k-ac").value = k.aciklama || "";
    $("#bu-k-kaydet").textContent = "Değişiklikleri kaydet"; $("#bu-k-vazgec").hidden = false; $("#bu-k-kod").focus();
  }
  function kuponFormSifirla() {
    S.kuponDuzen = null; $("#bu-kup-form").reset(); $("#bu-k-kisi").value = "1";
    $("#bu-k-kaydet").textContent = "Kodu oluştur"; $("#bu-k-vazgec").hidden = true; $("#bu-k-hata").textContent = "";
  }
  function kuponKaydet() {
    var gov = { kod: $("#bu-k-kod").value, tur: $("#bu-k-tur").value, deger: +$("#bu-k-deger").value, plan: $("#bu-k-plan").value,
      baslangic: $("#bu-k-bas").value ? $("#bu-k-bas").value + "T00:00:00+03:00" : null, bitis: $("#bu-k-bit").value ? $("#bu-k-bit").value + "T23:59:59+03:00" : null,
      maxKullanim: $("#bu-k-max").value ? +$("#bu-k-max").value : null, kisiBasi: +$("#bu-k-kisi").value || 1, aciklama: $("#bu-k-ac").value };
    var btn = $("#bu-k-kaydet"); btn.disabled = true;
    A.api(S.kuponDuzen ? "/api/admin/kuponlar/" + S.kuponDuzen : "/api/admin/kuponlar", S.kuponDuzen ? "PUT" : "POST", gov).then(function (j) {
      btn.disabled = false; A.bildir(j.kupon.kod + " kaydedildi.", "ok"); kuponFormSifirla(); kuponYukle();
    }).catch(function (e) { btn.disabled = false; $("#bu-k-hata").textContent = e.message; });
  }
  function kuponAktif(id, aktif, btn) {
    btn.disabled = true;
    A.api("/api/admin/kuponlar/" + id, "PUT", { aktif: aktif }).then(function () { A.bildir(aktif ? "Kod etkinleştirildi." : "Kod pasifleştirildi.", "ok"); kuponYukle(); })
      .catch(function (e) { btn.disabled = false; A.bildir(e.message, "bad"); });
  }

  // ============================================================================ davetler
  function davetYukle() {
    var kap = $("#bu-dav"), d = $("#bu-dav-durum").value;
    A.api("/api/admin/davetler" + (d ? "?durum=" + d : "")).then(function (j) {
      if (!j.davetler.length) { kap.innerHTML = A.bos("Davet yok."); return; }
      var kisi = function (k) { return k ? esc(k.ad + " " + k.soyad) : '<span class="adm-alt">—</span>'; };
      kap.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo"><caption class="visually-hidden">Davetler</caption><thead><tr><th>Davet eden</th><th>Davet edilen</th><th>Kayıt</th><th>Durum</th><th>Bayraklar</th></tr></thead><tbody>' +
        j.davetler.map(function (x) {
          var du = DAVET_DURUM[x.durum] || [x.durum, "notr"];
          return "<tr><td>" + kisi(x.davetEden) + '<br><span class="adm-alt">' + esc(x.kod) + "</span></td><td>" + kisi(x.davetEdilen) + "</td><td>" + A.zamanHucre(x.olusturma) + "</td>" +
            "<td>" + A.rozet(du[0], du[1]) + (x.durum === "odullendi" && !x.edenOdul ? ' <span class="adm-alt">(davet eden yıllık sınırda)</span>' : "") + "</td>" +
            '<td><span class="bu-bayrak">' + (x.bayraklar.length ? x.bayraklar.map(function (b) { return A.rozet(NEDEN[b] || b, b === "hesap-silindi" ? "notr" : "bad"); }).join("") : '<span class="adm-alt">—</span>') + "</span></td></tr>";
        }).join("") + "</tbody></table></div>";
    }).catch(function (e) { kap.innerHTML = A.hataKutusu(e.message); });
  }

  window.MEBERRA_ADMIN_BUYUME = { kur: kur, ac: ac };
})();
