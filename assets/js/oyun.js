/**
 * Meberra — oyunlaştırma katmanı (her sayfada app.js'in son bloğu yükler; ayrı derleme yok).
 *
 * Günlük hedef (halka), seri koruma, akıllı tekrar (aralıklı tekrar kutuları), günün görevleri, rozetler, kutlamalar,
 * öğrenme yolu (ünite düğümleri), XP ve lig rozeti, ince geçiş efektleri.
 * 1.4.0: kutlamaların hepsi ortak kuyruktan geçer (assets/js/kutlama.js MeberraKutlama — aynı anda tek kutlama, maskotlu);
 * buradaki eski balon + konfeti kaldırıldı. Yol çizimi assets/js/canli.js (MeberraCanli.yolCiz); yoksa eski düğüm sırası.
 * Can / kalp / sanal para YOK; dil suçlayıcı değil (veliler de görür).
 *
 * Depo anahtarları (şekiller sunucu birleştirmesiyle sabit — server/API.md "Senkron: yeni istemci anahtarları"):
 *   apmeberra:oyun:v1   { xp, rozetler: { id: { t } }, gorevler: { "YYYY-MM-DD": { id: { tamam, t } } }, hedef: { tur: "soru", miktar } }
 *   apmeberra:seri:v1   { donmus: ["YYYY-MM-DD"], hakKullanim: { "YYYY-Www": n } }
 *   apmeberra:tekrar:v1 { "<sayfa>|<soruId>": { kutu: 1..4, sonraki: "YYYY-MM-DD", guncelleme: ms } | { silindi: true, guncelleme: ms } }
 * Günler Europe/Istanbul yerel günüdür. XP kuralı lig kuralıyla aynı: her cevap 5, doğru +5, biten deneme 50
 * ("Bu hafta XP" yalnızca bu kural; toplam XP'ye ayrıca tamamlanan günlük görev başına 20 XP eklenir).
 * Sunucu ve dosya kipinde aynı çalışır: yalnızca localStorage; senkron MEBERRA_SYNC setItem yamasıyla kendiliğinden olur.
 *
 * Saf çekirdek Node'da da yüklenir (module.exports): araclar/testler/oyun-birim-test.js
 */
(function () {
  "use strict";

  // =====================================================================================
  // 1. SAF ÇEKİRDEK
  // =====================================================================================
  var K = {
    oyun: "apmeberra:oyun:v1", seri: "apmeberra:seri:v1", tekrar: "apmeberra:tekrar:v1",
    quiz: "apmeberra:quiz:v1", hata: "apmeberra:errors:v1", seviye: "apmeberra:seviye:v1"
  };
  var XP = { soru: 5, dogru: 5, deneme: 50 };   // = server/lig.js XP (API.md "Haftalık lig")
  var GOREV_XP = 20;
  var ARALIK = [1, 3, 7, 14];                    // kutu 1..4 → sonraki tekrar kaç gün sonra
  var HEDEFLER = [5, 10, 20];
  var VARSAYILAN_HEDEF = 10;
  var KORUMA_GERIYE = 7;                         // seri koruma en fazla 7 gün geriye uygulanır

  var isObj = function (v) { return v !== null && typeof v === "object" && !Array.isArray(v); };
  var GUN_RE = /^\d{4}-\d{2}-\d{2}$/;
  var IST = null;
  /** ms | ISO metin → İstanbul takvim günü "YYYY-MM-DD" (geçersizse null) */
  function istGun(v) {
    var ms = typeof v === "number" ? v : Date.parse(v || "");
    if (!isFinite(ms)) return null;
    try {
      IST = IST || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
      var p = {};
      IST.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      return p.year + "-" + p.month + "-" + p.day;
    } catch (e) {
      return new Date(ms + 3 * 3600e3).toISOString().slice(0, 10); // İstanbul 2016'dan beri sabit UTC+3
    }
  }
  function gunEkle(iso, n) {
    var a = String(iso).split("-").map(Number);
    return new Date(Date.UTC(a[0], a[1] - 1, a[2] + n)).toISOString().slice(0, 10);
  }
  function gunFark(a, b) { // b - a (gün)
    var x = String(a).split("-").map(Number), y = String(b).split("-").map(Number);
    return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 864e5);
  }
  /** "YYYY-MM-DD" → ISO hafta "YYYY-Www" (server/zaman.js isoHafta ile aynı) */
  function isoHafta(iso) {
    var a = String(iso).split("-").map(Number);
    var dt = new Date(Date.UTC(a[0], a[1] - 1, a[2]));
    var g = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - g);
    var yil = dt.getUTCFullYear();
    var no = Math.ceil(((dt - Date.UTC(yil, 0, 1)) / 864e5 + 1) / 7);
    return yil + "-W" + (no < 10 ? "0" : "") + no;
  }
  function haftaPazartesi(iso) {
    var a = String(iso).split("-").map(Number);
    var g = new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay() || 7;
    return gunEkle(iso, 1 - g);
  }

  /** quiz:v1 → düz cevap listesi [{ sayfa, kap, id, c, ms, gun }] */
  function cevapListesi(progress) {
    var out = [];
    var pages = progress && isObj(progress.pages) ? progress.pages : {};
    Object.keys(pages).forEach(function (p) {
      var units = pages[p] && isObj(pages[p].units) ? pages[p].units : {};
      Object.keys(units).forEach(function (u) {
        var ans = units[u] && isObj(units[u].answers) ? units[u].answers : {};
        Object.keys(ans).forEach(function (q) {
          var a = ans[q] || {}, ms = Date.parse(a.t || "");
          out.push({ sayfa: p, kap: u, id: q, c: !!a.c, ms: isFinite(ms) ? ms : null, gun: isFinite(ms) ? istGun(ms) : null });
        });
      });
    });
    return out;
  }
  /** Lig kuralıyla XP (gunSuz: gün → bool; verilmezse tümü). denemeler: [{ tarih }] (APMEBERRA.denemeler()) */
  function xpOzet(cevaplar, denemeler, gunSuz) {
    var r = { soru: 0, dogru: 0, deneme: 0, xp: 0 };
    cevaplar.forEach(function (a) { if (gunSuz && !(a.gun && gunSuz(a.gun))) return; r.soru++; if (a.c) r.dogru++; });
    (denemeler || []).forEach(function (d) { var g = d && istGun(d.tarih); if (!g || (gunSuz && !gunSuz(g))) return; r.deneme++; });
    r.xp = r.soru * XP.soru + r.dogru * XP.dogru + r.deneme * XP.deneme;
    return r;
  }
  /** İstanbul haftası (Pzt–Paz) içinde lig XP'si */
  function haftaXp(cevaplar, denemeler, bugun) {
    var pzt = haftaPazartesi(bugun), paz = gunEkle(pzt, 6);
    return xpOzet(cevaplar, denemeler, function (g) { return g >= pzt && g <= paz; });
  }
  function gorevSayisi(oyun) {
    var n = 0, g = oyun && isObj(oyun.gorevler) ? oyun.gorevler : {};
    Object.keys(g).forEach(function (gun) { if (isObj(g[gun])) Object.keys(g[gun]).forEach(function (id) { if (id !== "hedef" && g[gun][id] && g[gun][id].tamam === true) n++; }); });
    return n;
  }
  /** Toplam XP = lig kuralı (tüm zamanlar) + tamamlanan görev × 20; kayıtlı değer düşmez (sunucu: en büyük) */
  function toplamXp(cevaplar, denemeler, oyun) {
    var hesap = xpOzet(cevaplar, denemeler).xp + gorevSayisi(oyun) * GOREV_XP;
    return Math.max(hesap, Number(oyun && oyun.xp) || 0);
  }

  // --- Seri ve seri koruma -------------------------------------------------------------
  function calismaGunleri(cevaplar, denemeler) {
    var s = new Set();
    cevaplar.forEach(function (a) { if (a.gun) s.add(a.gun); });
    (denemeler || []).forEach(function (d) { var g = d && istGun(d.tarih); if (g) s.add(g); });
    return s;
  }
  /** Seri (İstanbul günü): bugün yoksa dünden sayılır; korunan gün zinciri kesmez ama sayılmaz (apCalismaSerisi ile aynı) */
  function seriHesapla(gunler, donmus, bugun) {
    var dz = new Set(Array.isArray(donmus) ? donmus : []), seri = 0;
    for (var d = gunler.has(bugun) ? bugun : gunEkle(bugun, -1), i = 0; i < 4000; d = gunEkle(d, -1), i++) {
      if (gunler.has(d)) seri++;
      else if (!dz.has(d)) break;
    }
    return seri;
  }
  function korumaHakki(premium) { return premium ? 2 : 1; }
  function seriNorm(v) {
    var o = isObj(v) ? v : {};
    return { donmus: Array.isArray(o.donmus) ? o.donmus.filter(function (x) { return typeof x === "string" && GUN_RE.test(x); }) : [], hakKullanim: isObj(o.hakKullanim) ? o.hakKullanim : {} };
  }
  /**
   * Kaçırılan günlere korumayı otomatik uygular (saf). Dünden geriye yürür; boş gün dizisi ancak arkasında korunan bir
   * zincir (çalışılmış ya da korunmuş gün) varsa ve her ISO haftasında hak yetiyorsa tümüyle korunur (yarım koruma yok).
   * En fazla KORUMA_GERIYE gün geriye bakılır; bugün boşluk sayılmaz (gün bitmedi).
   * Dönüş: { seri: { donmus, hakKullanim }, eklenen: ["YYYY-MM-DD"] }
   */
  function korumaUygula(gunler, seriV, bugun, limit) {
    var s = seriNorm(seriV);
    var dz = new Set(s.donmus), hak = Object.assign({}, s.hakKullanim), eklenen = [];
    var tutuldu = function (d) { return gunler.has(d) || dz.has(d); };
    var sinir = gunEkle(bugun, -KORUMA_GERIYE);
    var d = gunEkle(bugun, -1);
    while (d >= sinir) {
      if (tutuldu(d)) { d = gunEkle(d, -1); continue; }
      var run = [], e = d;
      while (!tutuldu(e) && e >= sinir) { run.push(e); e = gunEkle(e, -1); }
      if (!tutuldu(e)) break; // korunacak zincir yok ya da boşluk çok uzun
      var ihtiyac = {};
      run.forEach(function (x) { var h = isoHafta(x); ihtiyac[h] = (ihtiyac[h] || 0) + 1; });
      if (Object.keys(ihtiyac).some(function (h) { return (Number(hak[h]) || 0) + ihtiyac[h] > limit; })) break;
      run.forEach(function (x) { dz.add(x); eklenen.push(x); var h = isoHafta(x); hak[h] = (Number(hak[h]) || 0) + 1; });
      d = e;
    }
    return { seri: { donmus: Array.from(dz).sort().slice(-400), hakKullanim: hak }, eklenen: eklenen.sort() };
  }
  function korumaKalan(seriV, bugun, limit) {
    var s = seriNorm(seriV);
    return Math.max(0, limit - (Number(s.hakKullanim[isoHafta(bugun)]) || 0));
  }

  // --- Akıllı tekrar (aralıklı tekrar kutuları) ----------------------------------------
  function tekrarAktif(e) { return isObj(e) && !e.silindi && e.kutu >= 1 && typeof e.sonraki === "string"; }
  /**
   * Bir cevabı tekrar kutularına işler (saf). Yanlış → kutu 1, yarın. Vadesi gelmiş kayıtta doğru → bir üst kutu
   * (1, 3, 7, 14 gün); 4. kutudan sonra kayıt silme iziyle kaldırılır. Vadesi gelmemiş doğru cevap bir şey değiştirmez.
   * Dönüş: { tekrar, durum: "yeni" | "terfi" | "bitti" | null }
   */
  function tekrarCevap(tekrar, anahtar, dogru, bugun, simdi) {
    var t = Object.assign({}, isObj(tekrar) ? tekrar : {}), e = t[anahtar];
    if (!dogru) { t[anahtar] = { kutu: 1, sonraki: gunEkle(bugun, ARALIK[0]), guncelleme: simdi }; return { tekrar: t, durum: "yeni" }; }
    if (!tekrarAktif(e) || e.sonraki > bugun) return { tekrar: t, durum: null };
    var k = (e.kutu | 0) + 1;
    if (k > ARALIK.length) { t[anahtar] = { silindi: true, guncelleme: simdi }; return { tekrar: t, durum: "bitti" }; }
    t[anahtar] = { kutu: k, sonraki: gunEkle(bugun, ARALIK[k - 1]), guncelleme: simdi };
    return { tekrar: t, durum: "terfi" };
  }
  /** Bugün (ya da önce) vadesi gelen kayıtların anahtarları, en eski vade önce */
  function tekrarZamani(tekrar, bugun) {
    var t = isObj(tekrar) ? tekrar : {};
    return Object.keys(t).filter(function (k) { return tekrarAktif(t[k]) && t[k].sonraki <= bugun; })
      .sort(function (a, b) { return t[a].sonraki < t[b].sonraki ? -1 : t[a].sonraki > t[b].sonraki ? 1 : a < b ? -1 : 1; });
  }
  function tekrarSonraki(tekrar, bugun) {
    var t = isObj(tekrar) ? tekrar : {}, en = null;
    Object.keys(t).forEach(function (k) { if (tekrarAktif(t[k]) && t[k].sonraki > bugun && (!en || t[k].sonraki < en)) en = t[k].sonraki; });
    return en;
  }
  /** Özellikten önceki açık yanlışlar: kaydı olmayan her açık hata bugün tekrar edilecek (kutu 1) olarak eklenir */
  function tekrarTohumla(tekrar, hataItems, bugun, simdi) {
    var t = Object.assign({}, isObj(tekrar) ? tekrar : {}), n = 0;
    Object.keys(isObj(hataItems) ? hataItems : {}).forEach(function (k) {
      var h = hataItems[k];
      if (!h || h.resolved || t[k]) return;
      t[k] = { kutu: 1, sonraki: bugun, guncelleme: simdi }; n++;
    });
    return { tekrar: t, eklenen: n };
  }
  /** Başarılı tekrar sayısı (yaklaşık, veriden): aktif kayıtta kutu-1, mezun (silinmiş) kayıtta 4 */
  function tekrarBasari(tekrar) {
    var t = isObj(tekrar) ? tekrar : {}, n = 0;
    Object.keys(t).forEach(function (k) { var e = t[k]; if (!isObj(e)) return; if (e.silindi) n += ARALIK.length; else if (e.kutu > 1) n += e.kutu - 1; });
    return n;
  }

  // --- Günün görevleri (tarihe göre belirlenimli) ----------------------------------------
  function ozet32(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var GOREV_HAVUZU = [
    { id: "dogru-8", ad: "8 doğru cevap ver", olcu: "dogru", hedef: 8 },
    { id: "ust-uste-5", ad: "5 doğru üst üste", olcu: "ustUste", hedef: 5 },
    { id: "tekrar-2", ad: "2 yanlışını tekrar çöz", olcu: "tekrar", hedef: 2 },
    { id: "unite-1", ad: "1 üniteyi bitir", olcu: "unite", hedef: 1 }
  ];
  /**
   * Günün 3 görevi: her gün bir "N soru çöz" + havuzdan 2 farklı görev; aynı tarih her cihazda aynı sonucu verir.
   * mevcutTekrar (isteğe bağlı): bugün tekrar edilebilecek yanlış sayısı (açık + bugün düzeltilen). Görevin hedefinden azsa
   * "tekrar" görevi havuzda kalan görevlerden biriyle (yine tarihe göre belirlenimli) değiştirilir.
   */
  function gunlukGorevler(gun, mevcutTekrar) {
    var h = ozet32("meberra|" + gun), n = [10, 15, 20][h % 3];
    var havuz = GOREV_HAVUZU.slice(), h2 = ozet32(gun + "|gorev");
    var a = havuz.splice(h2 % havuz.length, 1)[0];
    var b = havuz.splice((h2 >>> 8) % havuz.length, 1)[0];
    var yetersiz = function (g) { return g.olcu === "tekrar" && typeof mevcutTekrar === "number" && mevcutTekrar < g.hedef; };
    if (yetersiz(a)) a = havuz[(h2 >>> 16) % havuz.length];
    else if (yetersiz(b)) b = havuz[(h2 >>> 16) % havuz.length];
    return [{ id: "soru-" + n, ad: n + " soru çöz", olcu: "soru", hedef: n }, a, b].map(function (g) { return Object.assign({}, g); });
  }
  /** Günün ölçüleri (İstanbul günü): soru, dogru, ustUste (en uzun doğru dizisi), tekrar (bugün düzeltilen yanlış), unite, deneme */
  function gunBaglami(cevaplar, progress, hataItems, denemeler, gun) {
    var bugunkiler = cevaplar.filter(function (a) { return a.gun === gun; }).sort(function (a, b) { return a.ms - b.ms; });
    var c = { soru: bugunkiler.length, dogru: 0, ustUste: 0, tekrar: 0, unite: 0, deneme: 0 }, dizi = 0;
    bugunkiler.forEach(function (a) { if (a.c) { c.dogru++; dizi++; if (dizi > c.ustUste) c.ustUste = dizi; } else dizi = 0; });
    Object.keys(isObj(hataItems) ? hataItems : {}).forEach(function (k) { var h = hataItems[k]; if (h && h.resolved && istGun(h.resolvedDate) === gun) c.tekrar++; });
    var pages = progress && isObj(progress.pages) ? progress.pages : {};
    Object.keys(pages).forEach(function (p) {
      var units = pages[p] && isObj(pages[p].units) ? pages[p].units : {};
      Object.keys(units).forEach(function (u) {
        var r = units[u] || {}, ans = isObj(r.answers) ? r.answers : {}, ks = Object.keys(ans), son = -Infinity;
        if (!(r.total > 0) || ks.length < r.total) return;
        ks.forEach(function (q) { var ms = Date.parse((ans[q] || {}).t || ""); if (ms > son) son = ms; });
        if (isFinite(son) && istGun(son) === gun) c.unite++;
      });
    });
    (denemeler || []).forEach(function (d) { if (d && istGun(d.tarih) === gun) c.deneme++; });
    return c;
  }
  /** Bugün tekrar edilebilecek yanlış sayısı: açık hatalar + bugün düzeltilenler (gün içinde görev kaybolmasın) */
  function tekrarMevcut(hataItems, baglam) {
    var n = 0;
    Object.keys(isObj(hataItems) ? hataItems : {}).forEach(function (k) { var x = hataItems[k]; if (x && !x.resolved) n++; });
    return n + ((baglam && baglam.tekrar) || 0);
  }
  function gorevDurumlari(gorevler, baglam) {
    return gorevler.map(function (g) { var v = Math.min(g.hedef, baglam[g.olcu] || 0); return Object.assign({}, g, { deger: v, tamam: v >= g.hedef }); });
  }

  // --- Rozetler ---------------------------------------------------------------------------
  var ROZETLER = [
    { id: "ilk-soru", ad: "İlk adım", acik: "İlk sorunu çözdün", ikon: "yildiz", kosul: function (c) { return c.soru >= 1; } },
    { id: "ilk-deneme", ad: "İlk deneme", acik: "İlk denemeni bitirdin", ikon: "bayrak", kosul: function (c) { return c.deneme >= 1; } },
    { id: "seri-3", ad: "3 gün seri", acik: "3 gün üst üste çalıştın", ikon: "alev", kosul: function (c) { return c.seri >= 3; } },
    { id: "seri-7", ad: "7 gün seri", acik: "Bir hafta boyunca her gün çalıştın", ikon: "alev", kosul: function (c) { return c.seri >= 7; } },
    { id: "seri-30", ad: "30 gün seri", acik: "30 gün üst üste çalıştın", ikon: "alev", kosul: function (c) { return c.seri >= 30; } },
    { id: "soru-100", ad: "100 soru", acik: "100 farklı soru çözdün", ikon: "simsek", kosul: function (c) { return c.soru >= 100; } },
    { id: "soru-500", ad: "500 soru", acik: "500 farklı soru çözdün", ikon: "simsek", kosul: function (c) { return c.soru >= 500; } },
    { id: "unite-bitir", ad: "Ünite bitti", acik: "Bir ünitenin tüm sorularını çözdün", ikon: "kitap", kosul: function (c) { return c.uniteBitti >= 1; } },
    { id: "unite-tam", ad: "Kusursuz ünite", acik: "Bir üniteyi tüm soruları doğru bitirdin", ikon: "madalya", kosul: function (c) { return c.uniteTam >= 1; } },
    { id: "seviye-testi", ad: "Seviye testi tamam", acik: "Seviye testini bitirip raporunu aldın", ikon: "hedef", kosul: function (c) { return c.seviye >= 1; } },
    { id: "tekrar-10", ad: "10 tekrar", acik: "Akıllı tekrarda 10 kez doğru çözdün", ikon: "tekrar", kosul: function (c) { return c.tekrarBasari >= 10; } },
    { id: "hedef-7", ad: "Hedef ustası", acik: "Günlük hedefe 7 gün üst üste ulaştın", ikon: "kupa", kosul: function (c) { return c.hedefSeri >= 7; } },
    { id: "gorev-10", ad: "10 görev", acik: "10 günlük görev tamamladın", ikon: "onay", kosul: function (c) { return c.gorevSay >= 10; } }
  ];
  /** Günlük hedefe en uzun ardışık ulaşma (oyun.gorevler[gun].hedef.tamam) */
  function hedefSerisi(oyun) {
    var g = oyun && isObj(oyun.gorevler) ? oyun.gorevler : {};
    var gunler = Object.keys(g).filter(function (d) { return GUN_RE.test(d) && isObj(g[d]) && g[d].hedef && g[d].hedef.tamam === true; }).sort();
    var en = 0, dizi = 0, onceki = null;
    gunler.forEach(function (d) { dizi = onceki && gunFark(onceki, d) === 1 ? dizi + 1 : 1; if (dizi > en) en = dizi; onceki = d; });
    return en;
  }
  function uniteSayilari(progress) {
    var r = { bitti: 0, tam: 0 };
    var pages = progress && isObj(progress.pages) ? progress.pages : {};
    Object.keys(pages).forEach(function (p) {
      var units = pages[p] && isObj(pages[p].units) ? pages[p].units : {};
      Object.keys(units).forEach(function (u) {
        var x = units[u] || {}, ans = isObj(x.answers) ? x.answers : {}, ks = Object.keys(ans);
        if (!(x.total > 0) || ks.length < x.total) return;
        r.bitti++;
        if (ks.every(function (q) { return ans[q] && ans[q].c; })) r.tam++;
      });
    });
    return r;
  }
  function yeniRozetler(oyun, baglam) {
    var var_ = oyun && isObj(oyun.rozetler) ? oyun.rozetler : {};
    return ROZETLER.filter(function (r) { return !var_[r.id] && r.kosul(baglam); }).map(function (r) { return r.id; });
  }

  // --- Öğrenme yolu -----------------------------------------------------------------------
  // Ders sayfalarının ünite listesi (apUniteGrupla + ünite kimlikleri): [ad, num, ders, soru kutuları, bankadaki soru sayısı].
  // ?unite=N adresi sıradaki N'dir. araclar/testler/oyun-birim-test.js bu listeyi gerçek sayfalardan yeniden üretip karşılaştırır.
  var YOL = {"ap-calculus":[["Ünite 1 · Limits and Continuity","1","",["calc-unit1-quiz-container"],22],["Ünite 2 · Differentiation","2","",["calc-unit2-quiz-container"],15],["Ünite 3 · Composite, Implicit, and Inverse Functions","3","",["calc-unit3-quiz-container"],15],["Ünite 4 · Contextual Applications of Differentiation","4","",["calc-unit4-quiz-container"],15],["Ünite 5 · Analytical Applications of Differentiation","5","",["calc-unit5-quiz-container"],17],["Ünite 6 · Integration and Accumulation of Change","6","AP Calculus AB/BC",["calc-unit6-quiz-container"],34],["Ünite 7 · Differential Equations","7","AP Calculus AB/BC",["calc-unit7-quiz-container"],31],["Ünite 8 · Applications of Integration","8","AP Calculus AB/BC",["calc-unit8-quiz-container"],28],["Ünite 9 · Parametric Equations, Polar Coordinates, and Vector-Valued…","9","AP Calculus BC",["calc-unit9-quiz-container"],25],["Ünite 10 · Infinite Sequences and Series","10","AP Calculus BC",["calc-unit10-quiz-container"],39]],"ap-physics":[["Ünite 1 · Kinematics (1D & 2D Motion)","1","",["phys-unit1-quiz-container"],14],["Ünite 2 · Force and Translational Dynamics (Newton's Laws)","2","",["phys-unit2-quiz-container"],14],["Ünite 2 · Circular Motion & Gravitation","2","",["phys-unit3-quiz-container"],14],["Ünite 3 · Work, Energy, and Power","3","",["phys-unit3-wep-quiz-container"],20],["Ünite 4 · Linear Momentum","4","AP Physics 1",["phys-unit4-momentum-quiz-container"],22],["Ünite 5 · Torque and Rotational Dynamics","5","AP Physics 1",["phys-unit5-rotation-quiz-container"],25],["Ünite 6 · Energy and Momentum of Rotating Systems","6","AP Physics 1",["phys-unit6-rotating-quiz-container"],22],["Ünite 7 · Oscillations","7","AP Physics 1",["phys-unit7-oscillations-quiz-container"],24]],"ap-chemistry":[["Ünite 1 · Atomic Structure and Properties","1","",["chem-unit1-quiz-container"],15],["Ünite 2 · Compound Structure and Properties (eski CED adı: Molecular &…","2","",["chem-unit2-quiz-container"],15],["Ünite 3 · Properties of Substances and Mixtures (eski CED adı:…","3","",["chem-unit3-quiz-container"],15],["Ünite 4 · Chemical Reactions","4","AP Chemistry",["chem-unit4-quiz-container"],24],["Ünite 5 · Kinetics","5","AP Chemistry",["chem-unit5-quiz-container"],25],["Ünite 6 · Thermochemistry","6","AP Chemistry",["chem-unit6-quiz-container"],25],["Ünite 7 · Equilibrium","7","AP Chemistry",["chem-unit7-quiz-container"],25],["Ünite 8 · Acids and Bases","8","AP Chemistry",["chem-unit8-quiz-container"],28],["Ünite 9 · Thermodynamics and Electrochemistry","9","AP Chemistry",["chem-unit9-quiz-container"],28]],"ap-biology":[["Ünite 1 · Chemistry of Life","1","",["bio-unit1-quiz-container"],15],["Ünite 2 · Cell Structure and Function","2","",["bio-unit2-quiz-container"],18],["Ünite 3 · Cellular Energetics","3","AP Biology",["bio-unit3-quiz-container"],24],["Ünite 4 · Cell Communication and Cell Cycle","4","AP Biology",["bio-unit4-quiz-container"],26],["Ünite 5 · Heredity","5","AP Biology",["bio-unit5-quiz-container"],25],["Ünite 6 · Gene Expression and Regulation","6","AP Biology",["bio-unit6-quiz-container"],26],["Ünite 7 · Natural Selection","7","AP Biology",["bio-unit7-quiz-container"],27]],"ap-english":[["Ünite A · Rhetorical Analysis & Reading MCQ","A","",["eng-reading-quiz-container"],17],["Ünite B · Writing MCQ (Revision & Composition)","B","",["eng-writing-quiz-container"],24]],"ap-electives":[["AP Computer Science A (Ünite 1–4)",null,"AP Computer Science A",["csa-quiz-container"],20],["Ünite 1–4 · Strings, Class Design, Collections, Recursion,…",null,"AP Computer Science A",["csa-core-quiz-container","csa-data-quiz-container"],28],["AP Microeconomics & Macroeconomics",null,"AP Microeconomics & Macroeconomics",["econ-quiz-container"],20],["Ünite 5 · Factor Markets and Ünite 6 · Market Failure and the Role of…","5","AP Microeconomics",["micro34-quiz-container","micro56-quiz-container"],22],["Ünite 1 · Basic Economic Concepts and Ünite 6 · Open Economy","1","AP Macroeconomics",["macro14-quiz-container","macro56-quiz-container"],23]],"sinav-cents":[["Bölüm 1 · Reading and comprehension","1","",["cents-reading-quiz-container"],10],["Bölüm 2 · Mathematics","2","",["cents-math-quiz-container"],10],["Bölüm 3 · Reasoning on texts and data","3","",["cents-reasoning-quiz-container"],10],["Bölüm 4 · Biology","4","",["cents-biology-quiz-container"],10],["Bölüm 5 · Chemistry","5","",["cents-chemistry-quiz-container"],10],["Bölüm 6 · Physics","6","",["cents-physics-quiz-container"],10]]};
  function yolListesi(page) {
    return (YOL[page] || []).map(function (u, i) { return { no: i + 1, ad: u[0], num: u[1], ders: u[2], kutular: u[3], soru: u[4] }; });
  }
  /**
   * Yol düğümleri (saf). liste: [{ no, ad, num?, kutular, soru }], sayfaKaydi: quiz:v1.pages[sayfa], kilitliMi: no → bool.
   * Durum: "bitti" (tüm sorular çözüldü) | "simdi" (ilk bitmemiş açık ünite) | "acik" | "kilitli" (ücretsiz planda kapalı).
   */
  function yolDugumleri(liste, sayfaKaydi, kilitliMi) {
    var units = sayfaKaydi && isObj(sayfaKaydi.units) ? sayfaKaydi.units : {};
    var dugumler = liste.map(function (u) {
      var top = 0, cev = 0, hepsi = (u.kutular || []).length > 0;
      (u.kutular || []).forEach(function (k) { var r = units[k]; if (!r || !(+r.total > 0)) hepsi = false; if (!r) return; cev += isObj(r.answers) ? Object.keys(r.answers).length : 0; top += +r.total || 0; });
      if (!hepsi) top = Math.max(top, +u.soru || 0); // sayfada açılmamış kutu varsa bankadaki soru sayısı
      var etiket = /^[A-Z]$/.test(String(u.num || "")) ? String(u.num) : String(u.no); // sıra no (?unite=N); harfli ünite (English A/B) harfiyle
      return { no: u.no, ad: u.ad, etiket: etiket, cevap: cev, toplam: top, yuzde: top ? Math.min(100, Math.round(cev / top * 100)) : 0,
        kilitli: !!(kilitliMi && kilitliMi(u.no)), durum: top > 0 && cev >= top ? "bitti" : "acik" };
    });
    var simdi = null;
    dugumler.forEach(function (d) { if (!simdi && d.durum !== "bitti" && !d.kilitli) simdi = d; });
    if (simdi) simdi.durum = "simdi";
    dugumler.forEach(function (d) { if (d.kilitli && d.durum !== "bitti") d.durum = "kilitli"; });
    return dugumler;
  }
  /** Ders ilerlemesi yüzdesi (kayıtlı ünitelerin toplamı üzerinden): "Calculus'ta %40'tasın" */
  function dersYuzdesi(sayfaKaydi) {
    var units = sayfaKaydi && isObj(sayfaKaydi.units) ? sayfaKaydi.units : {}, top = 0, cev = 0;
    Object.keys(units).forEach(function (u) { var r = units[u] || {}; top += +r.total || 0; cev += isObj(r.answers) ? Object.keys(r.answers).length : 0; });
    return top ? Math.min(100, Math.round(cev / top * 100)) : 0;
  }

  var CEKIRDEK = {
    K: K, XP: XP, GOREV_XP: GOREV_XP, ARALIK: ARALIK, HEDEFLER: HEDEFLER, ROZETLER: ROZETLER, YOL: YOL,
    istGun: istGun, gunEkle: gunEkle, gunFark: gunFark, isoHafta: isoHafta, haftaPazartesi: haftaPazartesi,
    cevapListesi: cevapListesi, xpOzet: xpOzet, haftaXp: haftaXp, gorevSayisi: gorevSayisi, toplamXp: toplamXp,
    calismaGunleri: calismaGunleri, seriHesapla: seriHesapla, korumaHakki: korumaHakki, korumaUygula: korumaUygula, korumaKalan: korumaKalan,
    tekrarCevap: tekrarCevap, tekrarZamani: tekrarZamani, tekrarSonraki: tekrarSonraki, tekrarTohumla: tekrarTohumla, tekrarBasari: tekrarBasari,
    gunlukGorevler: gunlukGorevler, tekrarMevcut: tekrarMevcut, gunBaglami: gunBaglami, gorevDurumlari: gorevDurumlari,
    hedefSerisi: hedefSerisi, uniteSayilari: uniteSayilari, yeniRozetler: yeniRozetler,
    yolListesi: yolListesi, yolDugumleri: yolDugumleri, dersYuzdesi: dersYuzdesi
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = CEKIRDEK; return; }
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // =====================================================================================
  // 2. TARAYICI: depo, kutlamalar, geçiş efektleri
  // =====================================================================================
  var A = window.APMEBERRA, ME = window.APMEBERRA_ME;
  window.MEBERRA_OYUN = CEKIRDEK;
  var AZ_HAREKET = false;
  try { AZ_HAREKET = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { /* eski tarayıcı */ }
  var sayfa = (location.pathname.split("/").pop() || "index.html").replace(/\.html?$/i, "") || "index";
  try { sayfa = decodeURIComponent(sayfa); } catch (e) { /* yok say */ }

  function oku(k, v) { try { var r = localStorage.getItem(k); return r == null ? v : JSON.parse(r); } catch (e) { return v; } }
  function yaz(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* depo dolu / kapalı */ } }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function sayiTR(n) { try { return Number(n).toLocaleString("tr-TR"); } catch (e) { return String(n); } }
  function premiumMu() { try { return typeof window.apPremiumMu === "function" ? !!window.apPremiumMu() : true; } catch (e) { return true; } }
  function bugunGun() { return istGun(Date.now()); }
  function oyunOku() {
    var o = oku(K.oyun, null);
    o = isObj(o) ? o : {};
    if (!isObj(o.rozetler)) o.rozetler = {};
    if (!isObj(o.gorevler)) o.gorevler = {};
    return o;
  }
  function hedefMiktar(o) { var m = o && isObj(o.hedef) ? Number(o.hedef.miktar) : NaN; return HEDEFLER.indexOf(m) >= 0 ? m : VARSAYILAN_HEDEF; }
  function denemeler() { try { return A && A.denemeler ? A.denemeler() : []; } catch (e) { return []; } }
  function veri() {
    var progress = oku(K.quiz, null) || {};
    var hata = oku(K.hata, null) || {};
    return { progress: progress, cevaplar: cevapListesi(progress), hatalar: isObj(hata.items) ? hata.items : {}, denemeler: denemeler() };
  }
  function oturumVar() { return !!(ME && ME.user); }
  function apModeli() { return !(ME && ME.profile && ME.profile.ogrenciModeli === "uni-mezun"); }
  function duyur(detay) { try { window.dispatchEvent(new CustomEvent("meberra:oyun", { detail: detay || {} })); } catch (e) { /* yok say */ } }

  var IK = {
    yildiz: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    bayrak: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    alev: '<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z"/>',
    simsek: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    kitap: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M9 7h7"/>',
    madalya: '<circle cx="12" cy="15" r="5"/><path d="M8.5 10.5 6 3h4l2 4 2-4h4l-2.5 7.5"/>',
    hedef: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    tekrar: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    kupa: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    onay: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    kilit: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    kalkan: '<path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z"/><path d="M12 8v8M9 10l6 4M15 10l-6 4"/>',
    ok: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  function svg(ad, cls) { return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IK[ad] || IK.yildiz) + "</svg>"; }

  // --- Kutlama: ortak kuyruk (assets/js/kutlama.js) -------------------------------------------
  // 1.4.0: eski oy-toast balonu ve canvas konfetisi kaldırıldı; aynı anda tek kutlama, maskot başlı balon / büyük kart.
  // Dinamik yükleyicide kutlama.js bu dosyadan sonra gelebilir: gelene kadar kısa aralıklarla bekler (en çok ~3 sn).
  var kutlaBekleyen = [];
  function kutla(o) {
    if (window.MeberraKutlama) { window.MeberraKutlama.kutla(o); return; }
    kutlaBekleyen.push(o);
    if (kutlaBekleyen.length > 1) return;
    var n = 0;
    (function dene() {
      if (window.MeberraKutlama) { var l = kutlaBekleyen; kutlaBekleyen = []; l.forEach(function (x) { window.MeberraKutlama.kutla(x); }); return; }
      if (++n < 20) setTimeout(dene, 150); else kutlaBekleyen = [];
    })();
  }
  /** "Calculus’ta %40!" — ek uyumu canli.js'te (yoksa düz biçim) */
  function dersYuzdeMetni(ad, yz) {
    var C = window.MeberraCanli;
    return C && C.dersYuzdeMetni ? C.dersYuzdeMetni(ad, yz) : ad + " · %" + yz + "!";
  }
  function ilkAd() { return ME && ME.user ? String(ME.user.ad || "").trim().split(/\s+/)[0] : ""; }

  /** Düğmelere dokunma dalgası (ripple). Azaltılmış harekette yok. */
  function dalgaKur() {
    if (AZ_HAREKET) return;
    document.addEventListener("pointerdown", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".btn-primary, .btn-energy, .btn-secondary, .btn-ghost, .oy-hedef-sec button");
      if (!b || b.disabled || e.button > 0) return;
      var cs = window.getComputedStyle(b);
      if (cs.position === "static") b.style.position = "relative";
      b.classList.add("oy-dalga-kap");
      var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
      var s = document.createElement("span");
      s.className = "oy-dalga";
      s.style.width = s.style.height = d + "px";
      s.style.left = (e.clientX - r.left - d / 2) + "px";
      s.style.top = (e.clientY - r.top - d / 2) + "px";
      b.appendChild(s);
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 450);
    }, { passive: true });
  }

  // =====================================================================================
  // 3. DEĞERLENDİRME: seri koruma, tekrar tohumlama, hedef, görevler, rozetler, XP
  // =====================================================================================
  /** Kaçırılan günlere seri korumasını uygular (yalnızca değişince yazar). Dönüş: eklenen günler */
  function korumaKontrol(v) {
    var gunler = calismaGunleri(v.cevaplar, v.denemeler);
    if (!gunler.size) return [];
    var eski = oku(K.seri, null);
    var r = korumaUygula(gunler, eski, bugunGun(), korumaHakki(premiumMu()));
    if (!r.eklenen.length) return [];
    var yeni = Object.assign({}, isObj(eski) ? eski : {}, r.seri);
    yaz(K.seri, yeni);
    return r.eklenen;
  }
  function tohumKontrol(v) {
    var t = oku(K.tekrar, null);
    var r = tekrarTohumla(t, v.hatalar, bugunGun(), Date.now());
    if (r.eklenen) yaz(K.tekrar, r.tekrar);
  }
  /**
   * Hedef, görev ve rozetleri değerlendirir; yeni kazanımları kaydeder ve kutlar. sessiz: ilk açılışta biriken
   * kazanımlar tek balonla özetlenir (geçmişte kazanılanlar için konfeti yağmuru olmasın).
   */
  function degerlendir(sessiz) {
    var v = veri(), gun = bugunGun(), o = oyunOku(), degisti = false, kut = [];
    var bg = gunBaglami(v.cevaplar, v.progress, v.hatalar, v.denemeler, gun);
    var g = isObj(o.gorevler[gun]) ? o.gorevler[gun] : (o.gorevler[gun] = {});
    var miktar = hedefMiktar(o);
    if (bg.soru >= miktar && !(g.hedef && g.hedef.tamam)) {
      g.hedef = { tamam: true, t: Date.now() }; degisti = true;
      // Günlük hedef küçük kutlamadır (büyük an: ünite, deneme bandı, seri eşiği)
      kut.push({ tur: "hedef", buyuk: false, ifade: "kutlama", baslik: "Günlük hedef tamam!", metin: miktar + " soruyu bitirdin. Harika gidiyorsun." });
    }
    gorevDurumlari(gunlukGorevler(gun, tekrarMevcut(v.hatalar, bg)), bg).forEach(function (d) {
      if (d.tamam && !(g[d.id] && g[d.id].tamam)) {
        g[d.id] = { tamam: true, t: Date.now() }; degisti = true;
        kut.push({ tur: "gorev", metin: d.ad, xp: GOREV_XP }); // ardışık görevler kuyrukta tek balonda birleşir
      }
    });
    if (!Object.keys(g).length) delete o.gorevler[gun];
    var us = uniteSayilari(v.progress), sv = oku(K.seviye, null);
    var seriV = seriNorm(oku(K.seri, null));
    var rb = {
      soru: v.cevaplar.length, deneme: v.denemeler.length, seri: seriHesapla(calismaGunleri(v.cevaplar, v.denemeler), seriV.donmus, gun),
      uniteBitti: us.bitti, uniteTam: us.tam, seviye: sv && Array.isArray(sv.raporlar) ? sv.raporlar.length : 0,
      tekrarBasari: tekrarBasari(oku(K.tekrar, null)), hedefSeri: hedefSerisi(o), gorevSay: gorevSayisi(o)
    };
    yeniRozetler(o, rb).forEach(function (id) {
      o.rozetler[id] = { t: Date.now() }; degisti = true;
      var r = ROZETLER.filter(function (x) { return x.id === id; })[0];
      kut.push({ tur: "rozet", buyuk: false, baslik: "Yeni rozet: " + r.ad, metin: r.acik });
    });
    var xp = toplamXp(v.cevaplar, v.denemeler, o);
    if (xp !== o.xp) { o.xp = xp; degisti = true; }
    if (degisti) yaz(K.oyun, o);
    if (kut.length) {
      // Bir sonraki görevde kuyruğa girer: aynı cevabın "meberra:unite-bitti" büyük kartı (eşzamanlı olay) önce gösterilir
      var liste = kut;
      if (sessiz && kut.length > 2) {
        var rz = kut.filter(function (k) { return k.tur === "rozet"; }).length, gv = kut.length - rz;
        liste = [{ tur: "rozet", buyuk: false, ifade: "sevincli", baslik: "Tebrikler!",
          metin: [rz ? rz + " rozet" : "", gv ? gv + " kazanım" : ""].filter(Boolean).join(" ve ") + " seni bekliyor. Rozetlerini İlerleme sayfasında gör." }];
      }
      setTimeout(function () { liste.forEach(kutla); }, 0);
    }
    duyur({ oyun: true });
    return { oyun: o, baglam: bg };
  }

  // Cevap olayları (app.js apCevapKaydet): akıllı tekrar kutusu + değerlendirme
  window.addEventListener("meberra:cevap", function (e) {
    var d = e.detail || {};
    if (!d.sayfa || !d.soruId) return;
    var r = tekrarCevap(oku(K.tekrar, null), d.sayfa + "|" + d.soruId, !!d.dogru, bugunGun(), Date.now());
    if (r.durum) yaz(K.tekrar, r.tekrar);
    if (r.durum === "bitti") setTimeout(function () { kutla({ tur: "rozet", buyuk: false, ifade: "sevincli", baslik: "Bu soruyu öğrendin", metin: "Akıllı tekrar listesinden çıktı." }); }, 0);
    degerlendir(false);
  });
  var KISA = { "ap-calculus": "Calculus", "ap-physics": "Physics", "ap-chemistry": "Chemistry", "ap-biology": "Biology", "ap-english": "English", "ap-electives": "Seçmeliler", "sinav-cents": "CEnT-S" };
  // Ünite bitti: sayfanın TEK büyük anı — maskot kutlar, ders yüzdesi, ünitede kazanılan XP, paylaşım kartı (yalnız ilk ad)
  window.addEventListener("meberra:unite-bitti", function (e) {
    var d = e.detail || {};
    var pr = oku(K.quiz, null) || {};
    var yz = dersYuzdesi(pr.pages && pr.pages[d.sayfa]);
    var ad = KISA[d.sayfa] || "Bu ders";
    var cevap = +d.cevap || +d.toplam || 0, dogru = +d.dogru || 0;
    kutla({
      tur: "unite", ifade: "kutlama", baslik: dersYuzdeMetni(ad, yz),
      metin: "Ünite tamam" + (d.toplam ? ": " + dogru + " / " + d.toplam + " doğru." : "!"),
      xp: cevap * XP.soru + dogru * XP.dogru,
      paylas: { baslik: "Ünite tamam!", alt: String(d.baslik || "").replace(/\s+/g, " ").trim().slice(0, 80), yuzde: yz, ders: KISA[d.sayfa] || "", ad: ilkAd() }
    });
  });

  // =====================================================================================
  // 4. BUGÜN EKRANI (1.4.0: #bg-hedef seri kartında kompakt günlük hedef · #bg-gorevler Günün görevleri · #bg-koruma)
  //    Bağlamsal tek kart (tekrar / son deneme / yaklaşan) index.html'de seçilir (MeberraCanli.baglamKartiSec).
  //    Açılışta sayı sayacı yok (sakin ekran); yalnızca hedef halkası bir kez dolar.
  // =====================================================================================
  var ligBilgi = null;
  function ligCek(sonra) {
    if (!document.querySelector('meta[name="meberra-api"]') || !window.fetch) return;
    fetch("/api/lig", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.ok || !j.katildi || !j.grup || !Array.isArray(j.grup.siralama)) return;
      var ben = j.grup.siralama.filter(function (x) { return x.ben; })[0];
      ligBilgi = { sira: ben ? ben.sira : null, kademe: j.grup.kademeAd || (j.uye && j.uye.kademeAd) || "", xp: typeof j.benimXp === "number" ? j.benimXp : null };
      sonra();
    }).catch(function () { /* lig isteğe bağlı: hata yok sayılır */ });
  }
  var hedefSeciliyor = false;
  function bugunCiz(ilk) {
    var hedefEl = document.getElementById("bg-hedef"), gorevEl = document.getElementById("bg-gorevler");
    if (!hedefEl && !gorevEl) return;
    var v = veri(), gun = bugunGun(), o = oyunOku();
    var bg = gunBaglami(v.cevaplar, v.progress, v.hatalar, v.denemeler, gun);
    var miktar = hedefMiktar(o), secili = isObj(o.hedef);
    var oran = Math.min(1, bg.soru / miktar), CEV = 2 * Math.PI * 42;
    var hx = haftaXp(v.cevaplar, v.denemeler, gun).xp;
    if (ligBilgi && ligBilgi.xp !== null) hx = ligBilgi.xp;
    var gorevler = gorevDurumlari(gunlukGorevler(gun, tekrarMevcut(v.hatalar, bg)), bg);

    if (hedefEl) {
      var secim = !secili || hedefSeciliyor;
      var secici = '<div class="oy-hedef-sec" role="group" aria-label="Günlük hedef (soru)">' + HEDEFLER.map(function (n) {
        return '<button type="button" data-hedef="' + n + '" aria-pressed="' + (n === miktar) + '">' + n + " soru</button>";
      }).join("") + "</div>";
      hedefEl.innerHTML = '<div class="oy-hedef oy-hedef--kompakt"><div class="oy-halka' + (oran >= 1 ? " is-tamam" : "") + '">' +
          '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="oy-halka-iz" cx="50" cy="50" r="42"/><circle class="oy-halka-dolu" cx="50" cy="50" r="42" stroke-dasharray="' + CEV.toFixed(1) + '" stroke-dashoffset="' + (ilk && !AZ_HAREKET ? CEV : CEV * (1 - oran)).toFixed(1) + '" data-hedef-ofset="' + (CEV * (1 - oran)).toFixed(1) + '"/></svg>' +
          '<span class="oy-halka-sayi"><b>' + bg.soru + "</b><small>/ " + miktar + "</small></span></div>" +
        '<div class="u-min0"><h2 id="oy-hedef-h" tabindex="-1">Günlük hedef · ' + Math.min(bg.soru, miktar) + " / " + miktar + "</h2>" +
          (secim
            ? '<p class="oy-alt">' + (secili ? "Yeni günlük hedefini seç:" : "Günlük hedefini seç:") + "</p>" + secici
            : '<p class="oy-alt">' + (oran >= 1 ? "Bugünkü hedefe ulaştın. Devam etmek serbest!" : bg.soru ? "Hedefe " + (miktar - bg.soru) + " soru kaldı." : "Bugün " + miktar + " soru çözmeyi hedefle.") +
              ' <button type="button" class="oy-link" data-hedef-degistir>Değiştir</button></p>') +
        "</div></div>";
    }

    if (gorevEl) {
      gorevEl.innerHTML = '<div class="oy-kart-h"><h2 id="oy-gorev-h">Günün görevleri</h2><span class="oy-rozetcik">Her biri +' + GOREV_XP + " XP</span></div>" +
        '<ul class="oy-gorev-liste">' + gorevler.map(function (d) {
          var y = Math.round(d.deger / d.hedef * 100);
          return '<li class="oy-gorev' + (d.tamam ? " is-tamam" : "") + '"><span class="oy-gorev-ik">' + (d.tamam ? svg("onay") : svg(d.olcu === "tekrar" ? "tekrar" : d.olcu === "unite" ? "kitap" : d.olcu === "ustUste" ? "alev" : "hedef")) + "</span>" +
            '<span class="oy-gorev-govde"><span class="oy-gorev-ad">' + esc(d.ad) + '<span class="oy-gorev-sayi">' + d.deger + " / " + d.hedef + "</span></span>" +
            '<span class="oy-cubuk" role="progressbar" aria-label="' + esc(d.ad) + '" aria-valuemin="0" aria-valuemax="' + d.hedef + '" aria-valuenow="' + d.deger + '"><i style="--w:' + y + '%"></i></span></span></li>';
        }).join("") + "</ul>" +
        '<div class="oy-xp"><span class="oy-xp-ik">' + svg("simsek") + '</span><span class="oy-xp-hafta">Bu hafta <b>' + sayiTR(hx) + "</b> XP</span>" +
          (ligBilgi && ligBilgi.sira ? '<a class="oy-lig" href="/profil.html#lig">' + svg("kupa") + "Ligde " + ligBilgi.sira + ". sıradasın" + (ligBilgi.kademe ? " · " + esc(ligBilgi.kademe) : "") + "</a>" : "") +
        "</div>";
      gorevEl.classList.remove("is-iskelet"); gorevEl.removeAttribute("aria-busy");
    }
    if (ilk && hedefEl && !AZ_HAREKET) {
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        var c = hedefEl.querySelector(".oy-halka-dolu");
        if (c) c.setAttribute("stroke-dashoffset", c.getAttribute("data-hedef-ofset"));
      }); });
    }
  }
  function korumaCiz() {
    var el = document.getElementById("bg-koruma");
    if (!el) return;
    var limit = korumaHakki(premiumMu()), gun = bugunGun();
    var kalan = korumaKalan(oku(K.seri, null), gun, limit);
    el.innerHTML = svg("kalkan", "oy-koruma-ik") + "<span><strong>" + (kalan ? "Bu hafta " + kalan + " koruman var" : "Bu haftaki korumanı kullandın") + "</strong>" +
      "<small>Boş kalan bir gün serini bozmaz" + (limit > 1 ? " · Premium: haftada 2" : " · haftada 1, Premium’da 2") + "</small></span>";
    el.hidden = false;
  }
  function bugunKur() {
    var hedefEl = document.getElementById("bg-hedef");
    if (!(hedefEl || document.getElementById("bg-gorevler")) || !oturumVar() || !apModeli()) return;
    bugunCiz(true);
    korumaCiz();
    if (hedefEl) hedefEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-hedef]");
      if (b) {
        var o = oyunOku();
        o.hedef = { tur: "soru", miktar: Number(b.getAttribute("data-hedef")) };
        yaz(K.oyun, o);
        hedefSeciliyor = false;
        degerlendir(false);
        bugunCiz(false);
        var y = hedefEl.querySelector("[data-hedef-degistir]") || hedefEl.querySelector("h2");
        if (y && y.focus) y.focus();
        return;
      }
      if (e.target.closest("[data-hedef-degistir]")) {
        hedefSeciliyor = true; bugunCiz(false);
        var ilkB = hedefEl.querySelector("[data-hedef]"); if (ilkB) ilkB.focus();
      }
    });
    window.addEventListener("storage", function (e) { if (!e.key || /^apmeberra:(oyun|quiz|errors|tekrar|seri|deneme)/.test(e.key)) { bugunCiz(false); korumaCiz(); } });
    ligCek(function () { bugunCiz(false); });
  }

  // =====================================================================================
  // 5. ÖĞRENME YOLU (calis.html kartları + ders sayfası ünite paneli)
  // =====================================================================================
  /** Eski düğüm sırası (canli.js yoksa yedek) */
  function yolHtml(page, dugumler, adres) {
    var kilitVar = dugumler.some(function (d) { return d.durum === "kilitli"; });
    var DURUM = { bitti: "tamamlandı", simdi: "sıradaki", acik: "açık", kilitli: "Premium" };
    return '<nav class="oy-yol" aria-label="Öğrenme yolu"><ol>' + dugumler.map(function (d) {
      var et = esc(d.ad) + " — " + DURUM[d.durum] + (d.toplam && d.durum !== "kilitli" ? " (" + d.cevap + " / " + d.toplam + " soru)" : "");
      return '<li class="is-' + d.durum + '"><a class="oy-dugum" href="' + esc(adres + "?unite=" + d.no) + '" title="' + et + '" aria-label="' + et + '"' + (d.durum === "simdi" ? ' aria-current="step"' : "") +
        ' style="--y:' + d.yuzde + '%">' + (d.durum === "kilitli" ? svg("kilit") : d.durum === "bitti" ? svg("onay") : "<span>" + esc(d.etiket) + "</span>") + "</a></li>";
    }).join("") + "</ol>" + (kilitVar ? '<p class="oy-yol-not">' + svg("kilit") + 'Kilitli üniteler <a href="premium.html">Premium ile</a> açılır.</p>' : "") + "</nav>";
  }
  /** 1.4.0: kıvrımlı yol (canli.js yolCiz) — serit: Çalış kartları, dikey: ders sayfası ünite merkezi */
  function yolYerlestir(el, page, dugumler, mod) {
    var C = window.MeberraCanli;
    if (C && C.yolCiz) C.yolCiz(el, dugumler, { mod: mod, adres: page + ".html", anahtar: location.pathname + "|" + page });
    else el.innerHTML = yolHtml(page, dugumler, page + ".html");
  }
  function ucretsizNolar(page, liste) {
    if (typeof window.apUcretsizUniteNolari !== "function") return liste.map(function (u) { return u.no; });
    var n = (window.MEBERRA_URUN && window.MEBERRA_URUN.ucretsiz && window.MEBERRA_URUN.ucretsiz.uniteSayisi) || 2;
    return window.apUcretsizUniteNolari(page, liste, n);
  }
  function calisYolu() {
    var yerler = document.querySelectorAll("[data-yol]");
    if (!yerler.length) return;
    var pr = oku(K.quiz, null) || {}, prem = premiumMu();
    yerler.forEach(function (el) {
      var page = el.getAttribute("data-yol"), liste = yolListesi(page);
      if (!liste.length) return;
      var acik = ucretsizNolar(page, liste);
      yolYerlestir(el, page, yolDugumleri(liste, pr.pages && pr.pages[page], function (no) { return !prem && acik.indexOf(no) < 0; }), "serit");
    });
  }
  function dersYolu() {
    var U = window.APMEBERRA_UNITELER;
    if (!U || !U.panel || !Array.isArray(U.uniteler)) return;
    var pr = oku(K.quiz, null) || {};
    var liste = U.uniteler.map(function (u) { return { no: u.no, ad: u.ad, kutular: u.kutular, soru: u.toplam }; });
    var kil = {}; U.uniteler.forEach(function (u) { kil[u.no] = u.kilitli; });
    var yer = U.panel.querySelector(".oy-yol-yer");
    if (!yer) {
      yer = document.createElement("div");
      yer.className = "oy-yol-yer oy-yol-ders";
      var h = U.panel.querySelector(".bg-sec-h");
      U.panel.insertBefore(yer, h ? h.nextSibling : U.panel.firstChild);
    }
    var C = window.MeberraCanli;
    yolYerlestir(yer, U.page, yolDugumleri(liste, pr.pages && pr.pages[U.page], function (no) { return !!kil[no]; }), "dikey");
    // Kıvrımlı yol ünite listesinin yerini alır (aynı bağlantılar; ek bölümler panelde kalır)
    if (C && C.yolCiz) U.panel.classList.add("has-yol");
  }

  // =====================================================================================
  // 6. İLERLEME: Bugünkü tekrar oturumu + rozetler
  // =====================================================================================
  function rozetCiz() {
    var sec = document.getElementById("rozetler"), ul = document.getElementById("rozet-liste");
    if (!sec || !ul) return;
    var o = oyunOku(), n = 0;
    ul.innerHTML = ROZETLER.map(function (r) {
      var k = o.rozetler[r.id], t = k && Number(k.t);
      if (k) n++;
      return '<li class="oy-rozet' + (k ? " is-kazanildi" : "") + '"><span class="oy-rozet-ik">' + svg(r.ikon) + "</span>" +
        "<strong>" + esc(r.ad) + "</strong><small>" + esc(r.acik) + "</small>" +
        '<span class="oy-rozet-durum">' + (k ? (isFinite(t) && t > 0 ? new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "Kazanıldı") : "Henüz kazanılmadı") + "</span></li>";
    }).join("");
    var v = veri();
    document.getElementById("rozet-ozet").innerHTML = "<b>" + n + " / " + ROZETLER.length + "</b> rozet · " + svg("simsek") + "<b>" + sayiTR(toplamXp(v.cevaplar, v.denemeler, o)) + "</b> XP";
    sec.hidden = false;
  }

  function mathjax(el) {
    var mj = window.MathJax;
    if (mj && mj.typesetPromise) { mj.typesetPromise([el]).catch(function () {}); return; }
    if (document.getElementById("MathJax-script")) return;
    window.MathJax = { tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], displayMath: [["$$", "$$"], ["\\[", "\\]"]] }, svg: { fontCache: "global" },
      startup: { typeset: false, ready: function () { window.MathJax.startup.defaultReady(); window.MathJax.startup.promise.then(function () { var k = document.getElementById("tekrar-govde"); if (k) window.MathJax.typesetPromise([k]).catch(function () {}); }); } } };
    var s = document.createElement("script");
    s.id = "MathJax-script"; s.async = true; s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    document.head.appendChild(s);
  }
  function bankaYukle(sonra) {
    if (window.APMEBERRA_DENEME_BANKASI) { sonra(window.APMEBERRA_DENEME_BANKASI); return; }
    var s = document.createElement("script");
    var kok = ((document.querySelector('script[src*="assets/js/oyun.js"]') || {}).src || "").replace(/assets\/js\/oyun\.js.*$/, "");
    s.src = kok + "data/sorular/deneme-bankasi.js";
    s.onload = function () { sonra(window.APMEBERRA_DENEME_BANKASI || null); };
    s.onerror = function () { sonra(null); };
    document.head.appendChild(s);
  }
  function tekrarKur() {
    var sec = document.getElementById("tekrar"), govde = document.getElementById("tekrar-govde");
    if (!sec || !govde || !oturumVar()) return;
    sec.hidden = false;
    var oturum = null;
    var tarihTR = function (iso) { try { return new Date(iso + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" }); } catch (e) { return iso; } };
    function giris() {
      var gun = bugunGun(), t = oku(K.tekrar, null), vade = tekrarZamani(t, gun), sonraki = tekrarSonraki(t, gun);
      govde.innerHTML = '<div class="surface oy-tekrar-giris"><span class="oy-tekrar-ik">' + svg("tekrar") + '</span><div class="u-min0">' +
        (vade.length ? "<p><strong>Bugün " + vade.length + " soru tekrar zamanında.</strong> Yanlış yaptığın sorular 1, 3, 7 ve 14 gün arayla yeniden karşına çıkar; doğru çözdükçe aralık uzar.</p>"
          : "<p><strong>Bugün tekrar edecek soru yok.</strong> " + (sonraki ? "Sıradaki tekrar: " + esc(tarihTR(sonraki)) + "." : "Yanlış yaptığın sorular burada, unutmadan önce yeniden karşına çıkar.") + "</p>") +
        "</div>" + (vade.length ? '<button type="button" class="btn-energy" data-tekrar-basla>' + svg("tekrar") + "Tekrara başla</button>" : "") + "</div>";
    }
    function basla() {
      var vade = tekrarZamani(oku(K.tekrar, null), bugunGun());
      if (!vade.length) { giris(); return; }
      govde.innerHTML = '<p class="oy-alt" role="status">Sorular yükleniyor…</p>';
      bankaYukle(function (B) {
        var by = {};
        if (B && Array.isArray(B.sorular)) B.sorular.forEach(function (q) { by[String(q.sayfa).replace(/\.html?$/i, "") + "|" + q.id] = q; });
        oturum = { sira: [], eksik: [], i: 0, dogru: 0, pasaj: (B && B.pasajlar) || {} };
        vade.forEach(function (k) { if (by[k]) oturum.sira.push({ k: k, q: by[k] }); else oturum.eksik.push(k); });
        if (!oturum.sira.length) { bitis(); return; }
        soruCiz();
      });
    }
    function soruCiz() {
      var x = oturum.sira[oturum.i], q = x.q, sp = x.k.split("|")[0];
      var pas = q.pasaj && oturum.pasaj[q.pasaj];
      govde.innerHTML = '<div class="oy-tekrar-ilerleme"><span>Soru ' + (oturum.i + 1) + " / " + oturum.sira.length + "</span>" +
        '<span class="oy-cubuk" aria-hidden="true"><i style="--w:' + Math.round(oturum.i / oturum.sira.length * 100) + '%"></i></span></div>' +
        '<article class="question-card oy-tekrar-soru" aria-labelledby="oy-tq-baslik">' +
        '<div class="question-header"><div class="question-head-main"><span class="question-num-badge" id="oy-tq-baslik">' + esc(KISA[sp] || sp) + "</span>" +
        '<span class="question-topic">' + (q.topic || "") + "</span></div></div>" +
        (pas ? '<details class="oy-pasaj"><summary>' + esc(pas.baslik || "Metni göster") + "</summary>" + (pas.html || "") + "</details>" : "") +
        '<div class="question-body">' + q.question + "</div>" +
        '<div class="options-container" role="group" aria-label="Seçenekler">' + q.options.map(function (o) {
          return '<button type="button" class="option-btn" data-sec="' + esc(o.id) + '"><span class="option-letter" aria-hidden="true">' + esc(o.id) + '</span><span class="visually-hidden">Şık ' + esc(o.id) + ": </span><span>" + o.text + "</span></button>";
        }).join("") + "</div>" +
        '<div class="feedback-box" id="oy-tq-geri" hidden></div></article>';
      mathjax(govde);
      var ilk = govde.querySelector(".option-btn");
      if (ilk) ilk.focus({ preventScroll: true });
    }
    function cevapla(secim) {
      var x = oturum.sira[oturum.i], q = x.q, sp = x.k.split("|")[0];
      var kap = govde.querySelector(".options-container");
      if (!kap || kap.getAttribute("data-cevaplandi")) return;
      kap.setAttribute("data-cevaplandi", "1");
      var dogruMu = typeof window.apCevapKaydet === "function"
        ? window.apCevapKaydet(sp, q.kap, q, secim, { title: q.kapBaslik })
        : !!(q.options.filter(function (o) { return o.id === secim; })[0] || {}).isCorrect;
      if (dogruMu) oturum.dogru++;
      var sec = q.options.filter(function (o) { return o.id === secim; })[0] || {}, dg = q.options.filter(function (o) { return o.isCorrect; })[0] || {};
      kap.querySelectorAll(".option-btn").forEach(function (b) {
        b.classList.add("disabled"); b.setAttribute("aria-disabled", "true");
        if (b.getAttribute("data-sec") === dg.id) b.classList.add("correct");
        else if (b.getAttribute("data-sec") === secim) b.classList.add("wrong");
      });
      var kart = govde.querySelector(".question-card");
      if (kart) kart.classList.add(dogruMu ? "state-correct" : "state-wrong");
      var fb = document.getElementById("oy-tq-geri"), son = oturum.i + 1 >= oturum.sira.length;
      fb.className = "feedback-box " + (dogruMu ? "correct-box" : "wrong-box");
      fb.innerHTML = '<div class="feedback-head"><span class="feedback-verdict">' + (dogruMu ? "Doğru cevap" : "Yanlış cevap") + "</span>" +
        '<span class="feedback-chip">' + (dogruMu ? "Bir sonraki tekrar daha ileride" : "Doğru seçenek: " + esc(dg.id) + " · yarın yeniden") + "</span></div>" +
        (!dogruMu ? '<div class="feedback-text"><strong>Hata nedeni:</strong> ' + (sec.errorTag || "Kavramsal veya işlemsel eksiklik.") + "</div>" +
          '<div class="remediation-panel"><div class="remediation-title"><span>Konu hatırlatması</span></div><div class="remediation-text">' + (sec.remediation || q.generalRemediation || "") + "</div></div>" : "") +
        '<div class="solution-panel"><div class="solution-title">Adım adım çözüm</div><div class="solution-steps">' + (q.stepByStepSolution || "") + "</div></div>" +
        '<p class="oy-tekrar-eylem"><button type="button" class="btn-primary" data-tekrar-sonraki>' + (son ? "Tekrarı bitir" : "Sonraki soru →") + "</button></p>";
      fb.hidden = false;
      fb.style.display = "block";
      mathjax(fb);
      var b = fb.querySelector("[data-tekrar-sonraki]"); if (b) b.focus({ preventScroll: true });
    }
    function bitis() {
      var n = oturum.sira.length;
      govde.innerHTML = '<div class="surface oy-tekrar-giris is-bitti"><span class="oy-tekrar-ik">' + svg("kupa") + '</span><div class="u-min0">' +
        (n ? "<p><strong>Bugünkü tekrar bitti!</strong> " + oturum.dogru + " / " + n + " soruyu doğru çözdün. Doğru çözdüklerin daha ileri bir güne, yanlışlar yarına taşındı.</p>" : "") +
        (oturum.eksik.length ? '<p class="oy-alt">' + oturum.eksik.length + " soru bu ekranda açılamadı; ders sayfasında çözebilirsin: " + oturum.eksik.map(function (k) {
          var p = k.split("|"); return '<a href="' + esc(p[0]) + ".html#q-card-" + encodeURIComponent(p[1]) + '">' + esc(KISA[p[0]] || p[0]) + " · " + esc(p[1]) + "</a>";
        }).join(", ") + "</p>" : "") + '<p><a href="index.html">Bugün’e dön →</a></p></div></div>';
      if (n) kutla({ tur: "rozet", buyuk: false, ifade: "kutlama", baslik: "Tekrar tamam!", metin: oturum.dogru + " / " + n + " doğru. Bilgilerin pekişiyor." });
      oturum = null;
    }
    govde.addEventListener("click", function (e) {
      if (e.target.closest("[data-tekrar-basla]")) { basla(); return; }
      var o = e.target.closest(".option-btn[data-sec]");
      if (o && oturum) { cevapla(o.getAttribute("data-sec")); return; }
      if (e.target.closest("[data-tekrar-sonraki]") && oturum) {
        oturum.i++;
        if (oturum.i >= oturum.sira.length) bitis(); else soruCiz();
        sec.scrollIntoView({ block: "start", behavior: AZ_HAREKET ? "auto" : "smooth" });
      }
    });
    govde.addEventListener("keydown", function (e) {
      if (!oturum || e.ctrlKey || e.metaKey || e.altKey) return;
      var k = (e.key || "").toUpperCase();
      if (!/^[A-E]$/.test(k) || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      var b = govde.querySelector('.option-btn[data-sec="' + k + '"]');
      if (b) { e.preventDefault(); cevapla(k); }
    });
    giris();
    if (/[?&]mod=tekrar(?:&|$)/.test(location.search)) {
      setTimeout(function () { sec.scrollIntoView({ block: "start" }); var b = govde.querySelector("[data-tekrar-basla]"); if (b) b.focus({ preventScroll: true }); }, 60);
    }
  }

  // =====================================================================================
  // 7. AÇILIŞ
  // =====================================================================================
  function ac() {
    dalgaKur();
    if (!oturumVar()) return;
    var v = veri();
    var eklenen = apModeli() ? korumaKontrol(v) : [];
    tohumKontrol(v);
    degerlendir(true);
    if (eklenen.length) {
      kutla({ tur: "seri", ifade: "sevincli", baslik: "Seri koruma serini korudu", metin: (eklenen.length === 1 ? "Çalışamadığın gün" : eklenen.length + " gün") + " serini bozmadı. Bugün devam edebilirsin." });
      duyur({ seri: true });
    }
    if (sayfa === "index") bugunKur();
    if (sayfa === "calis") calisYolu();
    if (sayfa === "ilerleme") { rozetCiz(); tekrarKur(); window.addEventListener("meberra:oyun", rozetCiz); }
    if (/^ap-|^sinav-cents$/.test(sayfa)) {
      // 1.4.0: ders sayfasında oyun.js başlıkta (defer) yüklenir; ünite paneli app.js'in DOMContentLoaded işleyicisinde kurulur.
      // Panel hazır değilse aynı olayda (app.js'ten sonra) çizilir: panel ve yol aynı karede → kayma yok.
      if (window.APMEBERRA_UNITELER || document.readyState === "complete") dersYolu();
      else document.addEventListener("DOMContentLoaded", dersYolu, { once: true });
      window.addEventListener("meberra:oyun", dersYolu);
    }
    window.addEventListener("meberra:uyelik", function () { if (sayfa === "calis") calisYolu(); if (/^ap-|^sinav-cents$/.test(sayfa)) dersYolu(); korumaCiz(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ac);
  else ac();
})();
