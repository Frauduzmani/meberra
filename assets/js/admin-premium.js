/**
 * Meberra yönetici paneli — Premium yönetimi (1.16.0)
 * - "Premium" sekmesi: tüm Premium kullanıcılar (aktif / 7 gün içinde bitiyor / deneme / bitti / hepsi), kalan gün sayacı,
 *   "bitiyor" uyarısı, çoklu seçim + toplu işlemler.
 * - Kullanıcılar listesi: Premium çipi (Aktif · N gün / Deneme · N gün / Bitti / —), kalan güne göre sıralama, süzgeç çipleri,
 *   satır hızlı işlemleri (Premium ver / Uzat / İptal), çoklu seçim çubuğu.
 * - Kullanıcı ayrıntısı: "Abonelik geçmişi" zaman çizelgesi.
 * admin.js ortak yardımcıları window.MEBERRA_ADMIN ile verir; bu dosya window.MEBERRA_ADMIN_PREMIUM = { kur, ac, liste, detay } tanımlar.
 * Uçlar: GET /api/admin/premium?durum=&q=&sayfa=, POST /api/admin/premium/(ver|uzat|iptal), GET /api/admin/users/:id/abonelikler
 */
(function () {
  "use strict";
  var A = null, P = null;
  var S = { durum: "aktif", q: "", sayfa: 1, istek: 0, secili: {}, kulSecili: {}, kulSatir: {}, sayac: null };
  var KAYNAK = { talep: "Ödeme", elle: "Elle", deneme: "Deneme", davet: "Davet" };
  var SUZGEC = [["aktif", "Premium aktif"], ["bitiyor", "7 gün içinde bitiyor"], ["deneme", "Deneme"], ["bitti", "Bitti"], ["hepsi", "Hepsi"]];
  var HAZIR = [7, 30, 90, 365];
  function esc(v) { return A.esc(v); }
  function q(s, k) { return (k || P).querySelector(s); }
  function adSoyad(u) { return ((u.ad || "") + " " + (u.soyad || "")).trim() || u.eposta || "—"; }
  function gunT(iso) { return iso ? new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short", year: "numeric" }) : "—"; }
  function cssEkle() {
    if (document.querySelector('link[href*="admin-premium.css"]')) return;
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "/assets/css/admin-premium.css?v=1160"; document.head.appendChild(l);
  }

  /** Durum çipi: renk + metin (renk tek başına anlam taşımaz) */
  function durumBul(u) {
    if ("hesapDurum" in u) return u.durum === "bitti" ? { d: "bitti" } : { d: u.durum, gun: u.kalanGun }; // Premium sekmesi satırı
    if (u.premium) return { d: u.deneme ? "deneme" : "aktif", gun: u.kalanGun };
    return { d: u.premiumGecmis ? "bitti" : "yok" };
  }
  function cip(u) {
    var b = durumBul(u), az = b.gun != null && b.gun <= 7;
    if (b.d === "yok") return '<span class="pr-cip is-yok" title="Premium yok">—<span class="visually-hidden"> Premium yok</span></span>';
    var metin = b.d === "bitti" ? "Bitti" : (b.d === "deneme" ? "Deneme" : "Aktif") + " · " + b.gun + " gün";
    return '<span class="pr-cip is-' + b.d + (az ? " is-az" : "") + '"' + (az ? ' title="7 gün içinde bitiyor"' : "") + '><i aria-hidden="true"></i>' + esc(metin) +
      (az ? '<span class="visually-hidden"> (bitiyor)</span>' : "") + "</span>";
  }
  function eylemler(u, kucuk) {
    var b = durumBul(u), aktif = b.d === "aktif" || b.d === "deneme";
    var bt = function (e, m, ek) { return '<button type="button" class="pr-eylem' + (ek || "") + '" data-pr-eylem="' + e + '" data-pr-id="' + esc(u.id) + '" data-pr-ad="' + esc(adSoyad(u)) + '">' + m + "</button>"; };
    return '<span class="pr-eylemler' + (kucuk ? " is-kucuk" : "") + '">' + (aktif ? bt("uzat", "Uzat") + bt("iptal", "İptal", " is-tehlike") : bt("ver", "Premium ver")) + "</span>";
  }

  /* ------------------------------------------------------------------ Diyalog */
  var dlg = null;
  function diyalog(o) {
    // o: { eylem: ver|uzat|iptal, ids: [], ad: "Ad Soyad" | null, bitti: fn }
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "pr-dlg";
      dlg.setAttribute("aria-labelledby", "pr-dlg-b");
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    }
    var kim = o.ids.length === 1 && o.ad ? o.ad : o.ids.length + " kullanıcı";
    var baslik = o.eylem === "ver" ? "Premium ver" : o.eylem === "uzat" ? "Premium'u uzat" : "Premium'u iptal et";
    var gunlu = o.eylem !== "iptal";
    dlg.innerHTML =
      '<form method="dialog" class="pr-dlg-ic" novalidate>' +
        '<div class="pr-dlg-ust"><h2 id="pr-dlg-b">' + esc(baslik) + '</h2><button type="button" class="pr-dlg-kapat" data-kapat aria-label="Kapat">×</button></div>' +
        '<p class="pr-dlg-kim">' + esc(kim) + "</p>" +
        (gunlu
          ? '<fieldset class="pr-alan"><legend>Süre</legend><div class="pr-hazir" role="group">' +
              HAZIR.map(function (g) { return '<button type="button" data-gun="' + g + '" aria-pressed="' + (g === 30) + '">+' + g + " gün</button>"; }).join("") +
              (o.eylem === "ver" ? '<button type="button" data-plan="aylik" aria-pressed="false">Aylık plan</button><button type="button" data-plan="yillik" aria-pressed="false">Yıllık plan</button>' : "") +
            "</div>" +
            '<div class="field pr-ozel"><label for="pr-gun">Özel gün</label><input id="pr-gun" class="text-input" type="number" inputmode="numeric" min="1" max="3650" step="1" value="30" aria-describedby="pr-gun-ip"></div>' +
            '<p class="field-hint" id="pr-gun-ip">' + (o.eylem === "ver" ? "Premium'u aktif olanlarda mevcut bitişin sonuna eklenir; olmayanlarda şimdiden başlar." : "Mevcut bitiş tarihinin sonuna eklenir. Aktif Premium'u olmayanlar atlanır.") + "</p></fieldset>"
          : '<p class="pr-uyari">Premium hemen sona erer (sıradaki dönemler dahil). Ücret iadesi bu panelden yapılmaz.</p>') +
        '<div class="field"><label for="pr-not">Not <span class="adm-alt">(isteğe bağlı, denetim kaydına yazılır)</span></label><textarea id="pr-not" class="text-input" rows="2" maxlength="300" placeholder="Örn. telafi, elden ödeme"></textarea></div>' +
        '<p class="field-error" id="pr-hata" role="alert" hidden></p>' +
        '<div class="pr-dlg-alt"><button type="button" class="btn-ghost" data-kapat>Vazgeç</button>' +
          '<button type="submit" class="btn-primary' + (o.eylem === "iptal" ? " adm-tehlike" : "") + '" id="pr-evet">' + esc(o.eylem === "iptal" ? "İptal et" : o.eylem === "uzat" ? "Uzat" : "Premium ver") + "</button></div>" +
      "</form>";
    var plan = null, gunEl = q("#pr-gun", dlg), hata = q("#pr-hata", dlg), evet = q("#pr-evet", dlg);
    function bas(btn) { dlg.querySelectorAll(".pr-hazir button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); }); }
    dlg.querySelectorAll("[data-kapat]").forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    if (gunlu) {
      q(".pr-hazir", dlg).addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        bas(b);
        if (b.hasAttribute("data-plan")) { plan = b.getAttribute("data-plan"); gunEl.value = plan === "yillik" ? 365 : 30; gunEl.disabled = true; }
        else { plan = null; gunEl.disabled = false; gunEl.value = b.getAttribute("data-gun"); }
      });
      gunEl.addEventListener("input", function () { var m = null; dlg.querySelectorAll("[data-gun]").forEach(function (b) { if (b.getAttribute("data-gun") === gunEl.value) m = b; }); bas(m); });
    }
    q("form", dlg).addEventListener("submit", function (e) {
      e.preventDefault();
      hata.hidden = true;
      var govde = { userIds: o.ids }, not = q("#pr-not", dlg).value.trim();
      if (not) govde.not = not;
      if (gunlu) {
        if (plan) govde.plan = plan;
        else {
          var g = Number(gunEl.value);
          if (!(Number.isInteger(g) && g >= 1 && g <= 3650)) { hata.textContent = "Gün 1 ile 3650 arasında tam sayı olmalı."; hata.hidden = false; gunEl.focus(); return; }
          govde.gun = g;
        }
      }
      evet.disabled = true; evet.textContent = "İşleniyor…";
      A.api("/api/admin/premium/" + o.eylem, "POST", govde).then(function (r) {
        dlg.close();
        var n = r.islenen || 0, at = (r.atlanan || []).length;
        var ne = o.eylem === "iptal" ? "Premium iptal edildi" : o.eylem === "uzat" ? "Premium uzatıldı" : "Premium verildi";
        A.bildir(ne + ": " + n + " kullanıcı" + (at ? " · " + at + " atlandı (" + r.atlanan[0].neden + ")" : "") + ".", n ? "ok" : "warn");
        if (o.bitti) o.bitti(r);
      }, function (err) {
        evet.disabled = false; evet.textContent = o.eylem === "iptal" ? "İptal et" : o.eylem === "uzat" ? "Uzat" : "Premium ver";
        hata.textContent = (err && err.message) || "İşlem tamamlanamadı."; hata.hidden = false;
      });
    });
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    (gunlu ? q(".pr-hazir [aria-pressed=true]", dlg) : q("#pr-not", dlg)).focus();
  }
  function yenile() {
    if (A.kul && S.kulYuklu) A.kulYukle();
    if (P && !P.hidden) yukle();
    else S.eskidi = true;
    if (A.ozetYukle) A.ozetYukle();
  }

  /* ------------------------------------------------------------------ Toplu çubuk */
  function topluCubuk(kap, secim, temizle) {
    var ids = Object.keys(secim);
    var c = kap.querySelector(".pr-toplu");
    if (!c) {
      c = document.createElement("div"); c.className = "pr-toplu"; c.setAttribute("role", "region"); c.setAttribute("aria-label", "Toplu Premium işlemleri");
      kap.appendChild(c);
    }
    c.hidden = !ids.length;
    c.innerHTML = '<span class="pr-toplu-say" aria-live="polite"><strong>' + ids.length + "</strong> seçili</span>" +
      '<button type="button" class="btn-primary btn-sm" data-toplu="ver">Premium ver</button>' +
      '<button type="button" class="btn-ghost btn-sm" data-toplu="uzat">Uzat</button>' +
      '<button type="button" class="btn-ghost btn-sm adm-ghost-tehlike" data-toplu="iptal">İptal et</button>' +
      '<button type="button" class="btn-ghost btn-sm" data-toplu="temizle">Seçimi temizle</button>';
    c.onclick = function (e) {
      var b = e.target.closest("[data-toplu]"); if (!b) return;
      var t = b.getAttribute("data-toplu");
      if (t === "temizle") { temizle(); return; }
      diyalog({ eylem: t, ids: ids, ad: null, bitti: function () { temizle(); yenile(); } });
    };
  }

  /* ------------------------------------------------------------------ Kullanıcılar listesi eklentisi */
  function kulKur() {
    var p = document.getElementById("panel-kullanicilar");
    if (!p || q(".pr-kul-cipler", p)) return;
    var sir = q("#kul-sirala", p);
    if (sir && !q('option[value="kalan"]', sir)) { var o = document.createElement("option"); o.value = "kalan"; o.textContent = "Premium kalan gün (az önce)"; sir.appendChild(o); }
    var form = q("form.adm-arac", p);
    var d = document.createElement("div");
    d.className = "pr-cipler pr-kul-cipler"; d.setAttribute("role", "group"); d.setAttribute("aria-label", "Premium süzgeci");
    d.innerHTML = [["", "Tümü"]].concat(SUZGEC.slice(0, 4)).map(function (s) {
      return '<button type="button" data-pd="' + s[0] + '" aria-pressed="' + (s[0] === "") + '">' + esc(s[1]) + "</button>";
    }).join("");
    if (form) form.insertAdjacentElement("afterend", d);
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pd]"); if (!b) return;
      d.querySelectorAll("[data-pd]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var k = A.kul(); k.premiumDurum = b.getAttribute("data-pd"); k.sayfa = 1;
      A.kulYukle();
    });
    // Satır eylemleri, seçim kutuları, kalan gün sıralaması (liste görünümünde; satır tıklamasından önce yakala)
    var gor = q(".adm-kul-liste-gorunum", p);
    gor.addEventListener("click", function (e) {
      var ey = e.target.closest("[data-pr-eylem]");
      if (ey) {
        e.stopPropagation();
        diyalog({ eylem: ey.getAttribute("data-pr-eylem"), ids: [ey.getAttribute("data-pr-id")], ad: ey.getAttribute("data-pr-ad"), bitti: yenile });
        return;
      }
      var sr = e.target.closest("[data-pr-sirala]");
      if (sr) {
        e.stopPropagation();
        var k = A.kul(); k.sirala = k.sirala === "kalan" ? "" : "kalan"; k.sayfa = 1;
        if (sir) sir.value = k.sirala;
        A.kulYukle();
      }
    }, true);
    gor.addEventListener("change", function (e) {
      var c = e.target.closest("input[data-pr-sec]");
      if (!c) return;
      var tablo = c.closest("table");
      if (c.getAttribute("data-pr-sec") === "hepsi") {
        tablo.querySelectorAll("input[data-pr-sec]:not([data-pr-sec=hepsi])").forEach(function (x) { x.checked = c.checked; secimYaz(x); });
      } else secimYaz(c);
      kulCubuk();
    });
  }
  function secimYaz(x) { var id = x.getAttribute("data-pr-sec"); if (x.checked) S.kulSecili[id] = 1; else delete S.kulSecili[id]; var tr = x.closest("tr"); if (tr) tr.classList.toggle("is-secili", x.checked); }
  function kulCubuk() {
    var p = document.getElementById("panel-kullanicilar");
    var kap = q(".adm-kul-liste-gorunum", p);
    topluCubuk(kap, S.kulSecili, function () { S.kulSecili = {}; kap.querySelectorAll("input[data-pr-sec]").forEach(function (x) { x.checked = false; secimYaz(x); }); kulCubuk(); });
  }
  /** admin.js kulYukle() tablo çizdikten sonra çağırır */
  function liste(kap, satirlar) {
    S.kulYuklu = true;
    var t = kap.querySelector("table.adm-kul-tablo"); if (!t) return;
    var map = {}; satirlar.forEach(function (u) { map[u.id] = u; });
    var ths = t.querySelectorAll("thead th"), k = A.kul();
    ths.forEach(function (th) {
      if (th.textContent.trim() !== "Premium") return;
      th.innerHTML = '<button type="button" class="pr-sirala" data-pr-sirala aria-label="Kalan Premium gününe göre sırala"' +
        (k.sirala === "kalan" ? ' aria-sort="ascending"' : "") + '>Premium <span aria-hidden="true">' + (k.sirala === "kalan" ? "▲" : "↕") + "</span></button>";
      if (k.sirala === "kalan") th.setAttribute("aria-sort", "ascending");
    });
    var thS = document.createElement("th"); thS.scope = "col"; thS.className = "pr-sec-hucre";
    thS.innerHTML = '<input type="checkbox" data-pr-sec="hepsi" aria-label="Bu sayfadakilerin hepsini seç">';
    t.querySelector("thead tr").insertBefore(thS, t.querySelector("thead th"));
    var hepsi = true;
    t.querySelectorAll("tbody tr[data-satir]").forEach(function (tr) {
      var id = tr.getAttribute("data-satir"), u = map[id];
      var td = document.createElement("td"); td.className = "pr-sec-hucre"; td.setAttribute("data-label", "Seç");
      td.innerHTML = '<input type="checkbox" data-pr-sec="' + esc(id) + '" aria-label="' + esc(adSoyad(u || {})) + ' seç"' + (S.kulSecili[id] ? " checked" : "") + ">";
      tr.insertBefore(td, tr.firstChild);
      if (S.kulSecili[id]) tr.classList.add("is-secili"); else hepsi = false;
      var pc = tr.querySelector('td[data-label="Premium"]');
      if (pc && u && u.rol !== "yonetici" && u.rol !== "veli") {
        pc.innerHTML = '<div class="pr-hucre">' + cip(u) + (u.premium && u.bitis ? '<span class="adm-alt">' + esc(gunT(u.bitis)) + "</span>" : "") + eylemler(u, true) + "</div>";
      } else if (pc && u) pc.innerHTML = cip(u);
    });
    var h = t.querySelector('input[data-pr-sec="hepsi"]'); if (h) h.checked = hepsi && satirlar.length > 0;
    kulCubuk();
  }

  /* ------------------------------------------------------------------ Premium sekmesi */
  function kur(panel) {
    A = window.MEBERRA_ADMIN; P = panel;
    if (!A) return;
    cssEkle();
    kulKur();
    if (!P) return;
    P.innerHTML =
      '<div class="adm-panel-ust"><h2>Premium</h2></div>' +
      '<p class="adm-ipucu">Premium üyeler, kalan süreleri ve kaynakları. Elle verilen ya da uzatılan süreler gelire sayılmaz (yalnızca onaylanmış ödemeler). Kalan gün yukarı yuvarlanır; tarihler İstanbul saatiyle.</p>' +
      '<div class="pr-uyari-serit" id="pr-serit" hidden></div>' +
      '<div class="pr-ust">' +
        '<div class="pr-cipler" role="group" aria-label="Premium durumu" id="pr-cipler"></div>' +
        '<form class="pr-ara" role="search" novalidate><label for="pr-q" class="visually-hidden">Ara</label><input type="search" id="pr-q" class="text-input" placeholder="Ad, soyad ya da e-posta" maxlength="80" autocomplete="off"></form>' +
      "</div>" +
      '<p class="adm-sonuc" id="pr-ozet" aria-live="polite"></p>' +
      '<div class="pr-liste" id="pr-liste"></div><div id="pr-sayfa"></div>';
    var zm = null;
    q("#pr-q").addEventListener("input", function (e) { clearTimeout(zm); zm = setTimeout(function () { S.q = e.target.value.trim(); S.sayfa = 1; yukle(); }, 300); });
    q(".pr-ara").addEventListener("submit", function (e) { e.preventDefault(); clearTimeout(zm); S.q = q("#pr-q").value.trim(); S.sayfa = 1; yukle(); });
    P.addEventListener("click", function (e) {
      var c = e.target.closest("[data-durum]");
      if (c) { S.durum = c.getAttribute("data-durum"); S.sayfa = 1; S.secili = {}; yukle(); return; }
      var sb = e.target.closest("[data-sayfa]");
      if (sb && !sb.disabled) { S.sayfa = Number(sb.getAttribute("data-sayfa")); yukle(); return; }
      var ey = e.target.closest("[data-pr-eylem]");
      if (ey) { diyalog({ eylem: ey.getAttribute("data-pr-eylem"), ids: [ey.getAttribute("data-pr-id")], ad: ey.getAttribute("data-pr-ad"), bitti: yenile }); return; }
      var k = e.target.closest("[data-pr-kul]");
      if (k) { A.detayAc(k.getAttribute("data-pr-kul")); return; }
      if (e.target.closest("[data-tekrar]")) yukle();
    });
    P.addEventListener("change", function (e) {
      var c = e.target.closest("input[data-sec]"); if (!c) return;
      if (c.getAttribute("data-sec") === "hepsi") P.querySelectorAll("input[data-sec]:not([data-sec=hepsi])").forEach(function (x) { x.checked = c.checked; secP(x); });
      else secP(c);
      pCubuk();
    });
  }
  function secP(x) { var id = x.getAttribute("data-sec"); if (x.checked) S.secili[id] = 1; else delete S.secili[id]; var tr = x.closest("tr"); if (tr) tr.classList.toggle("is-secili", x.checked); }
  function pCubuk() { topluCubuk(P, S.secili, function () { S.secili = {}; P.querySelectorAll("input[data-sec]").forEach(function (x) { x.checked = false; secP(x); }); pCubuk(); }); }
  function cipCiz() {
    var s = S.sayac || {};
    q("#pr-cipler").innerHTML = SUZGEC.map(function (x) {
      return '<button type="button" data-durum="' + x[0] + '" aria-pressed="' + (x[0] === S.durum) + '"' + (x[0] === "bitiyor" && s.bitiyor ? ' class="is-uyari"' : "") + ">" +
        esc(x[1]) + (s[x[0]] != null ? ' <span class="pr-sayi">' + esc(A.sayi(s[x[0]])) + "</span>" : "") + "</button>";
    }).join("");
    var ser = q("#pr-serit");
    if (s.bitiyor && S.durum !== "bitiyor") {
      ser.hidden = false;
      ser.innerHTML = A.ikon("uyari") + '<span><strong>' + esc(A.sayi(s.bitiyor)) + " kullanıcının</strong> Premium'u 7 gün içinde bitiyor.</span>" +
        '<button type="button" class="btn-ghost btn-sm" data-durum="bitiyor">Göster</button>';
    } else ser.hidden = true;
  }
  function geriSayim(u) {
    if (u.durum === "bitti") return '<span class="adm-alt">' + esc(gunT(u.bitis)) + " bitti</span>";
    var oran = Math.max(4, Math.min(100, Math.round(u.kalanGun / 30 * 100)));
    return '<div class="pr-sayim' + (u.bitiyor ? " is-az" : "") + '"><span class="pr-sayim-gun"><strong>' + esc(u.kalanGun) + "</strong> gün</span>" +
      '<span class="pr-sayim-iz" aria-hidden="true"><span style="width:' + oran + '%"></span></span>' +
      '<span class="adm-alt">' + esc(gunT(u.bitis)) + "</span></div>";
  }
  function yukle() {
    if (!P) return Promise.resolve();
    S.eskidi = false;
    var kap = q("#pr-liste"), no = ++S.istek;
    kap.setAttribute("aria-busy", "true");
    if (!kap.querySelector("table")) kap.innerHTML = A.iskelet("tablo", 6); else kap.classList.add("is-soluk");
    var qs = "?durum=" + encodeURIComponent(S.durum) + "&sayfa=" + S.sayfa + (S.q ? "&q=" + encodeURIComponent(S.q) : "");
    return A.api("/api/admin/premium" + qs).then(function (v) {
      if (no !== S.istek) return;
      S.sayac = v.sayac; cipCiz();
      var l = v.kullanicilar || [];
      var b = A.sayfaBilgisi(v.toplam, v.sayfa, v.sayfaBoyu, l.length);
      q("#pr-ozet").textContent = v.toplam ? A.sayi(v.toplam) + " kullanıcı." : "";
      if (!l.length) { kap.innerHTML = A.bos(S.q ? "Bu aramaya uyan Premium kullanıcı yok." : "Bu durumda kullanıcı yok."); q("#pr-sayfa").innerHTML = ""; pCubuk(); return; }
      var hepsi = l.every(function (u) { return S.secili[u.id]; });
      kap.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo adm-kartlas pr-tablo"><caption class="visually-hidden">Premium kullanıcılar</caption><thead><tr>' +
        '<th scope="col" class="pr-sec-hucre"><input type="checkbox" data-sec="hepsi" aria-label="Bu sayfadakilerin hepsini seç"' + (hepsi ? " checked" : "") + "></th>" +
        '<th scope="col">Kullanıcı</th><th scope="col">Durum</th><th scope="col">Kalan</th><th scope="col">Plan · kaynak</th><th scope="col" class="adm-sag">Ödenen</th><th scope="col">İşlem</th></tr></thead><tbody>' +
        l.map(function (u) {
          var s = !!S.secili[u.id];
          return '<tr class="' + (u.bitiyor ? "is-bitiyor" : "") + (s ? " is-secili" : "") + '">' +
            '<td class="pr-sec-hucre" data-label="Seç"><input type="checkbox" data-sec="' + esc(u.id) + '" aria-label="' + esc(adSoyad(u)) + ' seç"' + (s ? " checked" : "") + "></td>" +
            '<td data-label="Kullanıcı" class="adm-hucre-kisi"><button type="button" class="adm-link" data-pr-kul="' + esc(u.id) + '">' + esc(adSoyad(u)) + '</button><span class="adm-alt adm-kir">' + esc(u.eposta || "") + "</span>" +
              (u.hesapDurum === "askida" ? " " + A.rozet("Askıda", "bad") : "") + "</td>" +
            '<td data-label="Durum">' + cip(u) + (u.bitiyor ? ' <span class="pr-bitiyor">Bitiyor</span>' : "") + "</td>" +
            '<td data-label="Kalan">' + geriSayim(u) + "</td>" +
            '<td data-label="Plan · kaynak">' + esc(A.planAd(u.plan === "ozel" ? "Özel" : u.plan)) + ' <span class="adm-alt">· ' + esc(KAYNAK[u.kaynak] || u.kaynak || "—") + "</span>" +
              (u.donemSayisi > 1 ? ' <span class="adm-alt">· ' + esc(u.donemSayisi) + " dönem</span>" : "") + "</td>" +
            '<td data-label="Ödenen" class="adm-sag">' + (u.toplamOdenen ? esc(A.tl(u.toplamOdenen)) : '<span class="adm-alt">—</span>') + "</td>" +
            '<td data-label="İşlem">' + eylemler(u) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      q("#pr-sayfa").innerHTML = A.sayfalamaHtml(b, "Premium sayfaları", "kullanıcı");
      pCubuk();
    }).catch(function (e) {
      if (no === S.istek) { kap.innerHTML = A.hataKutusu(e.message); q("#pr-sayfa").innerHTML = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); kap.classList.remove("is-soluk"); });
  }
  function ac() { if (!A) return; yukle(); }

  /* ------------------------------------------------------------------ Ayrıntı: abonelik geçmişi zaman çizelgesi */
  var DONEM = { aktif: ["Aktif", "ok"], sirada: ["Sırada", "info"], bitti: ["Bitti", "notr"], iptal: ["İptal", "bad"] };
  function detay(d, v) {
    var sec = d.querySelector("#d-abo"); sec = sec && sec.closest("section");
    var u = v && v.user; if (!sec || !u) return;
    sec.classList.add("pr-gecmis");
    sec.innerHTML = '<h3 id="d-abo">Abonelik geçmişi</h3>' + A.yukleniyor("Yükleniyor…");
    A.api("/api/admin/users/" + encodeURIComponent(u.id) + "/abonelikler").then(function (r) {
      var uy = r.uyelik || {}, l = r.abonelikler || [];
      var ozet = { id: u.id, ad: u.ad, soyad: u.soyad, premium: uy.premium, deneme: uy.deneme, kalanGun: uy.kalanGun, premiumGecmis: l.length > 0 };
      var ust = '<div class="pr-gecmis-ust">' + cip(ozet) +
        (uy.premium ? '<span class="adm-alt">Bitiş: ' + esc(gunT(uy.bitis)) + "</span>" : "") +
        '<span class="adm-alt">Toplam ödenen: <strong>' + esc(r.toplamOdenen ? A.tl(r.toplamOdenen) : "₺0") + "</strong></span>" +
        (u.rol === "ogrenci" || !u.rol ? eylemler(ozet) : "") + "</div>";
      var cizgi = l.length ? '<ol class="pr-zaman">' + l.map(function (s) {
        var dd = DONEM[s.durum] || [s.durum, "notr"];
        return '<li class="is-' + esc(s.durum) + '"><span class="pr-zaman-nokta" aria-hidden="true"></span><div class="pr-zaman-ic">' +
          '<div class="pr-zaman-bas"><strong>' + esc(s.plan === "ozel" ? "Özel" : A.planAd(s.plan)) + " · " + esc(s.gun) + " gün</strong>" + A.rozet(dd[0], dd[1]) +
            A.rozet(KAYNAK[s.kaynak] || s.kaynak, s.kaynak === "talep" ? "mor" : "notr") + (s.tutar ? '<span class="pr-tutar">' + esc(A.tl(s.tutar)) + "</span>" : "") + "</div>" +
          '<p class="pr-zaman-tarih">' + esc(gunT(s.baslangic)) + " → " + esc(gunT(s.etkinBitis)) +
            (s.durum === "iptal" && s.iptalZamani ? ' <span class="adm-alt">(iptal: ' + esc(A.tarih(s.iptalZamani)) + ")</span>" : "") + "</p>" +
          (s.not ? '<p class="pr-zaman-not">' + esc(s.not) + "</p>" : "") +
          '<p class="adm-alt pr-zaman-kim">' + esc(s.olusturan ? "Ekleyen: " + adSoyad(s.olusturan) : s.kaynak === "talep" ? "Ödeme onayı" : "Sistem") + " · " + esc(A.tarih(s.olusturma)) + "</p>" +
        "</div></li>";
      }).join("") + "</ol>" : A.bos("Abonelik kaydı yok.");
      sec.innerHTML = '<h3 id="d-abo">Abonelik geçmişi</h3>' + ust + cizgi;
      sec.onclick = function (e) {
        var ey = e.target.closest("[data-pr-eylem]"); if (!ey) return;
        diyalog({ eylem: ey.getAttribute("data-pr-eylem"), ids: [u.id], ad: adSoyad(u), bitti: function () { A.detayYukle(); yenile(); } });
      };
    }).catch(function (e) { sec.innerHTML = '<h3 id="d-abo">Abonelik geçmişi</h3>' + A.hataKutusu(e.message); });
  }

  window.MEBERRA_ADMIN_PREMIUM = { kur: kur, ac: ac, liste: liste, detay: detay };
})();
