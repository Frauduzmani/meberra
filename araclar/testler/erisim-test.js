// Tur 10 (K4) — sayfa bazında erişim testi: açık / kilitli sayfalar, index -> sartlar, sartlar URL parametreleri,
// profil ön doldurma, ziyaretçi menüsü, oturumlu davranışın değişmediği. Çalıştır: node erisim-test.js
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = 'C:/Users/hp/Desktop/projelerim/AP MEBERRA/';
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const rel = u => decodeURIComponent(u.split('AP%20MEBERRA/')[1] || u);

const ACIK = ['sartlar', 'mezun', 'almanya-muhendislik', 'italya-muhendislik', 'universiteler', 'sinavlar', 'istanbul-sinav-rehberi', 'bilgi-merkezi', 'ajanlar', 'giris'];
const KILITLI = ['calis', 'rota', 'profil', 'yazismalar', 'deneme', 'ilerleme', 'seviye-testi', 'sinav-cents', 'ap-calculus', 'ap-physics', 'ap-chemistry', 'ap-biology', 'ap-english', 'ap-electives'];

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const mk = async (opts = {}, seed = false) => {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' }, opts));
    await ctx.addInitScript(() => { window.APMEBERRA_BUGUN = '2026-10-14'; });
    if (seed) await require('./oturum-tohum')(ctx);
    return ctx;
  };
  const page = async (ctx) => {
    const p = await ctx.newPage(); p._errs = [];
    p.on('pageerror', e => p._errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) p._errs.push('console: ' + m.text()); });
    return p;
  };

  // 0) Liste app.js'te tek yerde ve beklenen kümeyle aynı
  {
    const src = fs.readFileSync(ROOT + 'assets/js/app.js', 'utf8');
    const m = /APMEBERRA_ACIK_SAYFALAR = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(src);
    const list = m ? [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]).sort() : [];
    ok(JSON.stringify(list) === JSON.stringify(ACIK.slice().sort()), 'app.js APMEBERRA_ACIK_SAYFALAR = ' + list.join(', '));
    ok(ACIK.every(s => fs.existsSync(ROOT + s + '.html')), 'açık sayfaların hepsi var');
  }

  // A) Oturumsuz ziyaretçi: açık sayfalar açılıyor, menü yalnızca açık sayfalar
  const g = await mk();
  {
    for (const s of ACIK) {
      const p = await page(g);
      await p.goto(URL(s + '.html')); await p.waitForTimeout(s === 'ajanlar' ? 700 : 400);
      const r = await p.evaluate(() => ({
        auth: document.documentElement.hasAttribute('data-apz-auth'),
        guest: !!document.querySelector('.navbar-guest'),
        account: !!document.querySelector('.account'),
        hrefs: [...document.querySelectorAll('#site-nav-links a')].map(a => a.getAttribute('href').split(/[?#]/)[0]),
        ust: [...document.querySelectorAll('#site-nav-links > li[data-nav]')].map(li => li.dataset.navLabel).join('|'),
        rehber: [...document.querySelectorAll('.footer-rehber a')].map(a => a.getAttribute('href')),
        login: !!document.querySelector('.nav-login'),
        brand: document.querySelector('.nav-brand').getAttribute('href')
      }));
      const disari = r.hrefs.filter(h => !/^(sartlar|mezun|almanya-muhendislik|italya-muhendislik|universiteler|sinavlar|istanbul-sinav-rehberi|bilgi-merkezi|ajanlar|giris)\.html$/.test(h));
      ok(rel(p.url()).startsWith(s === 'mezun' ? 'sartlar.html?model=lise-mezun' : s + '.html') && r.auth && r.guest && !r.account && disari.length === 0 && r.ust === 'Şartlar|Üniversiteler|Sınavlar' && r.rehber.length === 5 && r.rehber.every(h => /^(almanya-muhendislik|italya-muhendislik|istanbul-sinav-rehberi|bilgi-merkezi|ajanlar).html$/.test(h)) && r.login === (s !== 'giris') && r.brand === 'sartlar.html' && p._errs.length === 0,
        `ziyaretçi ${s}: açık, menü ${r.ust} + altbilgi ${r.rehber.length} rehber, ${r.hrefs.length} bağlantı (kilitli: ${disari.join(',') || 'yok'}), giriş düğmesi=${r.login}, hata=${p._errs.length}${p._errs[0] ? ' ' + p._errs[0] : ''}`);
      await p.close();
    }
  }

  // B) Kilitli sayfalar girişe, index açık giriş noktasına
  {
    const p = await page(g);
    await p.goto(URL('index.html')); await p.waitForURL(/sartlar\.html/);
    ok(rel(p.url()) === 'sartlar.html', 'ziyaretçi index -> sartlar.html');
    for (const s of KILITLI) {
      await p.goto(URL(s + '.html')); await p.waitForURL(/giris\.html/);
      const u = rel(p.url());
      const ctxBox = await p.evaluate(() => { const c = document.getElementById('auth-context'); return c && !c.hidden ? c.textContent.replace(/\s+/g, ' ').trim() : ''; });
      const calisma = /^(ap-|calis|deneme|seviye-testi|sinav-cents)/.test(s);
      // profil.html dönüş adresi olarak kabul edilmez (auth.safeReturn döngü önler); kayıt sonrası zaten sihirbaza gidilir
      ok(u === 'giris.html?donus=' + s + '.html' && (s === 'profil' ? !ctxBox : !!ctxBox) && (!calisma || ctxBox.includes('Ders çalışma ve soru çözme kişisel hesabınla açılır')),
        `ziyaretçi ${s} -> ${u} · açıklama: "${ctxBox.slice(0, 70)}…"`);
    }
    await p.goto(URL('rota.html?ulke=it')); await p.waitForURL(/giris\.html/);
    ok(rel(p.url()) === 'giris.html?donus=rota.html?ulke=it', 'parametreli kilitli sayfa dönüş adresini korur');
    await p.close();
  }

  // C) sartlar.html (Tur 11 seçici): giriş ekranı, eski ve yeni URL parametreleri, değişim, özet çubuğu, geri tuşu
  {
    const p = await page(g);
    await p.goto(URL('sartlar.html')); await p.waitForSelector('.sr-intro');
    ok(await p.isVisible('.sr-intro') && !(await p.$('.sr-grid')) && (await p.textContent('#sr-intro-h')) === 'Önce durumunu seç' && await p.isVisible('#sr-f-sinif') && (await p.$$('#sr-ulke-grid .sr-ulke')).length === 15, 'parametresiz: nazik seçim ekranı, 15 ülke kartı');
    await p.goto(URL('sartlar.html?ulke=it')); await p.waitForSelector('.sr-intro');
    ok((await p.textContent('#sr-intro-h')) === 'Önce durumunu seç' && await p.isChecked('input[name=ulke][value=it]'), 'yalnızca ülke: ülke seçili, durum soruluyor');
    await p.goto(URL('sartlar.html?model=lise&ulke=it')); await p.waitForSelector('.sr-intro');
    ok((await p.textContent('#sr-intro-h')) === 'Şimdi sınıfını seç', 'lise + ülke: sınıf soruluyor');
    await p.goto(URL('sartlar.html?ulke=fr&sinif=13')); await p.waitForSelector('.sr-intro');
    ok(rel(p.url()) === 'sartlar.html?ulke=fr&dil=en', 'geçersiz sınıf atılır, Fransa (15 ülke) kalır: ' + rel(p.url()));

    // Eski bağlantı: ?ulke=de&sinif=11 -> kanonik adres, de/11 içerik
    await p.goto(URL('sartlar.html?ulke=de&sinif=11')); await p.waitForSelector('.sr-grid');
    const r = await p.evaluate(() => ({
      url: location.search,
      model: document.querySelector('input[name=model][value=lise]').checked, s11: document.querySelector('input[name=sinif][value="11"]').checked,
      kompakt: document.getElementById('sr-form').classList.contains('is-kompakt') && document.getElementById('sr-adimlar').hidden,
      ozet: document.getElementById('sr-ozet-chips').textContent,
      secs: [...document.querySelectorAll('.sr-grid:not(.sr-grid-ek) .sr-sec h2')].map(h => h.textContent),
      bosMetin: [...document.querySelectorAll('.sr-sec .sr-empty strong')].every(x => x.textContent === 'Bu bölüm hazırlanıyor'),
      steps: document.querySelectorAll('#sr-yol .sr-step').length,
      mez: document.querySelector('.sr-facts dd').textContent,
      cta: document.getElementById('sr-kocluk').getAttribute('href'),
      login: document.querySelector('.nav-login').getAttribute('href'),
      legal: document.querySelector('.sr-legal').textContent,
      title: document.title, rota: document.documentElement.getAttribute('data-rota'), h1: document.getElementById('sr-h1').textContent
    }));
    const beklenen = await p.evaluate(() => APMEBERRA_ROTALAR.de.adimlar.filter(a => !a.siniflar || a.siniflar.indexOf('11') >= 0).length);
    ok(r.url === '?model=lise&sinif=11&ulke=de&dil=en', 'eski adres kanonik adrese çevrildi: ' + r.url);
    ok(r.model && r.s11 && r.rota === 'de' && r.kompakt && /Lise · 11\. sınıf.*Almanya.*İngilizce/.test(r.ozet), 'de/11: seçim, kompakt özet çubuğu (' + r.ozet.replace(/\s+/g, ' ') + ')');
    ok(r.h1 === 'Almanya’da İngilizce lisans: 11. sınıf öğrencisi için şartlar', 'de/11 başlığı: ' + r.h1);
    ok(JSON.stringify(r.secs) === JSON.stringify(['Ne gerekiyor', 'Bu yıl ne yapmalısın', 'Kaçırılmaması gereken tarihler', 'Sık yapılan hatalar']), 'de/11: dört bölüm doğru sırada');
    const bv = await p.evaluate(() => {
      const B = APMEBERRA_SARTLAR_MOTOR.ulkeBolumleri(APMEBERRA_ULKE_VERI.de, { model: 'lise', sinif: '11', ulke: 'de', dil: 'en' });
      return ['gerekenler', 'buYil', 'tarihler', 'hatalar'].map(id => { const sec = document.getElementById('sr-' + id); return [B[id].length, sec.querySelectorAll('.sr-item').length, !!sec.querySelector('.sr-empty')]; });
    });
    ok(bv.every(([n, k, e]) => n ? (k === n && !e) : (k === 0 && e)) && r.bosMetin, 'de/11: bölümler veriyle tutarlı (madde/kart: ' + bv.map(x => x[0] + '/' + x[1]).join(', ') + ')');
    const kaynakli = await p.evaluate(() => [...document.querySelectorAll('.sr-grid:not(.sr-grid-ek) .sr-item')].every(li => li.querySelector('.kesinlik') && li.querySelector('.src-link[href^="http"]') && li.querySelector('.sr-checked')));
    ok(kaynakli, 'her madde: kesinlik etiketi + resmi kaynak + son kontrol');
    ok(r.steps === beklenen && r.steps > 0, `de/11: tarihli yol haritası ${r.steps} adım (ulke-rotalari.js sınıf filtresi: ${beklenen})`);
    ok(r.mez === 'Haziran 2028', 'de/11: mezuniyet Haziran 2028');
    ok(r.cta === 'giris.html?model=lise&sinif=11&ulke=de&dil=en#kayit' && r.login === 'giris.html?model=lise&sinif=11&ulke=de&dil=en', 'de/11: koçluk çağrısı ve menü girişi seçimi taşır');
    ok(r.legal.includes('Resmi kaynak esastır; son kararı üniversite verir.'), 'sayfa altı resmi kaynak notu');
    ok(/Almanya · 11\. sınıf · İngilizce/.test(r.title), 'başlık: ' + r.title);
    ok(await p.evaluate(() => document.querySelector('#sr-yol .sr-phase.is-now') !== null), 'de/11: "Bu yıl" dönemi vurgulu');

    // Değişim: "Seçimi değiştir" -> İtalya + Lise mezunu
    await p.click('#sr-degistir');
    ok(await p.getAttribute('#sr-degistir', 'aria-expanded') === 'true' && await p.isVisible('#sr-f-ulke'), 'özet çubuğu: seçici açıldı (aria-expanded)');
    await p.click('label.sr-ulke[data-ulke="it"]');
    await p.click('label.sr-card:has(input[value="lise-mezun"])');
    await p.waitForFunction(() => /model=lise-mezun&ulke=it&dil=en/.test(location.search));
    await p.waitForSelector('#sr-yol');
    const it = await p.evaluate(() => ({ h: document.querySelector('#sr-sum-h').textContent, sinif: document.getElementById('sr-f-sinif').hidden, cal: document.querySelectorAll('#sr-yol .sr-step-cal').length, steps: document.querySelectorAll('#sr-yol .sr-step').length, cta: document.getElementById('sr-kocluk').getAttribute('href'), rota: document.documentElement.getAttribute('data-rota') }));
    ok(it.h.includes('İtalya · Lise mezunu') && it.sinif && it.cal === 0 && it.steps > 0 && it.cta === 'giris.html?model=lise-mezun&ulke=it&dil=en#kayit' && it.rota === 'it', `seçim değişti: it/lise mezunu, sınıf adımı gizli, ${it.steps} adım, takvim tarihi yok (göreli)`, it);
    // Klavye: ok tuşu radyo seçimini değiştirir (model)
    await p.focus('input[name=model][value="lise-mezun"]'); await p.keyboard.press('ArrowLeft');
    await p.waitForFunction(() => /model=lise(&|$)/.test(location.search));
    ok(await p.isVisible('#sr-f-sinif'), 'klavye: ok tuşuyla durum değişti (lise), sınıf adımı göründü');
    // Dil geçişi: özet kartındaki düğme
    await p.click('label.sr-opt:has(input[name=sinif][value="12"])');
    await p.waitForSelector('.sr-dil-gec');
    await p.click('.sr-dil-gec');
    await p.waitForFunction(() => /dil=yerel/.test(location.search));
    ok((await p.textContent('#sr-h1')).startsWith('İtalya’da İtalyanca lisans'), 'dil geçişi: yerel dil (İtalyanca) başlığı');
    await p.goBack(); await p.waitForTimeout(300);
    ok(true, 'geri tuşu çökmedi: ' + rel(p.url()));
    // İrlanda: yerel dil yok
    await p.goto(URL('sartlar.html?model=lise&sinif=10&ulke=ie&dil=yerel')); await p.waitForSelector('[data-bant="ie"]');
    ok(rel(p.url()).endsWith('ulke=ie&dil=en') && await p.isDisabled('input[name=dil][value=yerel]'), 'İrlanda: dil=en, yerel dil seçeneği kapalı, bilgi bandı');
    // Veri dosyası olmayan ülke: hazırlanıyor durumu + genel yol haritası
    await p.goto(URL('sartlar.html?model=uni-mezun&ulke=nl&dil=en')); await p.waitForSelector('#sr-yol');
    const nl = await p.evaluate(() => ({ hazir: (document.getElementById('sr-hazir-h') || {}).textContent, ilk20: !!document.querySelector('#sr-ilk20 .sr-empty'), genel: document.querySelectorAll('#sr-yol .sr-steps-genel .sr-step').length, h1: document.getElementById('sr-h1').textContent }));
    ok((nl.hazir === 'Hollanda için yüksek lisans şartlar hazırlanıyor.' || nl.hazir === undefined) && nl.genel >= 6 && nl.h1 === 'Hollanda’da İngilizce yüksek lisans: üniversite mezunları için şartlar', 'Hollanda YL: hazırlanıyor durumu (ya da veri) + genel yol haritası ' + nl.genel + ' adım', nl);
    // Tema geçişi ziyaretçide çalışır
    await p.click('.theme-toggle');
    ok(await p.evaluate(() => document.documentElement.getAttribute('data-theme') === localStorage.getItem('apmeberra:theme')), 'ziyaretçi: tema geçişi');
    await p.evaluate(() => localStorage.removeItem('apmeberra:theme'));
    ok(p._errs.length === 0, 'sartlar: sayfa hatası yok' + (p._errs[0] ? ' ' + p._errs[0] : ''));
    await p.close();
  }

  // D) Açık sayfalar profil olmadan genel görünüm
  {
    const p = await page(g);
    await p.goto(URL('sinavlar.html?ulke=it')); await p.waitForSelector('.exam-card');
    const s = await p.evaluate(() => ({ pins: document.querySelectorAll('.pin-btn').length, f: document.getElementById('ulke-filtre').value, locks: document.querySelectorAll('.exam-actions .lock-ico').length, genel: document.querySelector('.genel-banner a').getAttribute('href'), listem: !!document.querySelector('option[value=listem]') }));
    ok(s.pins === 0 && s.f === 'it' && s.locks > 0 && !s.listem && /^giris\.html\?donus=deneme\.html/.test(s.genel), `sinavlar ziyaretçi: liste yok, filtre=${s.f}, ${s.locks} kilit simgesi, genel deneme -> giriş`);
    await p.goto(URL('universiteler.html?ulke=it')); await p.waitForSelector('.country-panel:not([hidden])');
    const u = await p.evaluate(() => ({ tabs: document.querySelectorAll('.country-tabs [role=tab]').length, sel: document.querySelector('.country-tabs [aria-selected=true]').id, panel: localStorage.getItem('apmeberra:panel:v1') }));
    ok(u.tabs === 15 && u.sel === 'tab-it' && u.panel === null, 'universiteler ziyaretçi: 15 ülke sekmesi, ?ulke=it sekmesi açık, kişisel durum yazılmadı');
    ok(p._errs.length === 0, 'açık sayfalarda hata yok' + (p._errs[0] ? ' ' + p._errs[0] : ''));
    await p.close();
  }

  // E) Ön doldurma: şartlar -> kayıt -> profil sihirbazı (de, 11)
  {
    const p = await page(g);
    await p.goto(URL('sartlar.html?ulke=de&sinif=11')); await p.waitForSelector('#sr-kocluk');
    await p.click('#sr-kocluk'); await p.waitForURL(/giris\.html/);
    const gi = await p.evaluate(() => ({ kayit: document.getElementById('tab-kayit').getAttribute('aria-selected'), ctx: document.getElementById('auth-context').textContent, acik: document.getElementById('acik-link').getAttribute('href') }));
    ok(gi.kayit === 'true' && gi.ctx.includes('Almanya · 11. sınıf · İngilizce') && gi.acik === 'sartlar.html?model=lise&sinif=11&ulke=de&dil=en', 'giris: Kayıt sekmesi, seçim açıklaması, "şartlara bak" bağlantısı seçimi korur');
    await p.fill('#kayit-ad', 'Deniz'); await p.fill('#kayit-soyad', 'Kaya'); await p.fill('#kayit-kullaniciAdi', 'deniz.k');
    await p.fill('#kayit-sifre', 'Guvenli123!'); await p.fill('#kayit-sifre2', 'Guvenli123!');
    await p.click('#kayit-submit'); await p.waitForSelector('#view-code:not([hidden])', { timeout: 60000 });
    await p.check('#code-ack'); await p.click('#code-continue');
    await p.waitForURL(/profil\.html/);
    ok(rel(p.url()) === 'profil.html?model=lise&sinif=11&ulke=de&dil=en', 'kayıt sonrası profil.html?model=lise&sinif=11&ulke=de&dil=en');
    ok(await p.isChecked('#wz-ogrenciModeli-group input[value="lise"]'), 'sihirbaz: durum (lise) ön dolu');
    await p.click('#wz-next'); await p.waitForSelector('#wz-step-2:not([hidden])');
    await p.fill('#wz-okul', 'Test Lisesi');
    ok(await p.isChecked('#wz-sinif-group input[value="11"]'), 'sihirbaz: sınıf 11 ön dolu');
    await p.click('#wz-next'); await p.waitForSelector('#wz-step-3:not([hidden])');
    ok(await p.isChecked('#wz-ulkeler-group input[value="de"]') && !(await p.isChecked('#wz-ulkeler-group input[value="it"]')), 'sihirbaz: Almanya ön dolu');
    await p.click('#wz-next'); await p.waitForSelector('#wz-step-4:not([hidden])');
    ok(await p.isChecked('#wz-egitimDili-group input[value="en"]'), 'sihirbaz: eğitim dili İngilizce ön dolu');
    await p.click('#wz-next'); await p.waitForURL(/universiteler\.html/);
    const prof = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('apmeberra-hesap:v1:oturum')); return JSON.parse(localStorage.getItem('apmeberra-hesap:v1:profil:' + s.id)); });
    ok(prof.sinif === '11' && prof.ogrenciModeli === 'lise' && prof.egitimDili === 'en' && JSON.stringify(prof.ulkeler) === '["de"]' && prof.aktifRota === 'de' && prof.tamamlandi && !('ulke' in prof), 'profil kaydı: şema değişmedi (sinif 11, ulkeler [de])');
    // Oturumlu: sartlar kişisel çağrı, menü kişisel
    await p.goto(URL('sartlar.html?ulke=de&sinif=11')); await p.waitForSelector('.sr-cta');
    const lo = await p.evaluate(() => ({ cta: document.querySelector('.sr-cta h2').textContent, rota: !!document.querySelector('.sr-cta a[href="rota.html?ulke=de"]'), guest: !!document.querySelector('.navbar-guest'), acc: !!document.querySelector('.account'), panel: !!document.querySelector('#site-nav-links a[href="index.html"]') }));
    ok(lo.cta === 'Kişisel koçluğun açık' && lo.rota && !lo.guest && lo.acc && lo.panel, 'oturumlu sartlar: kişisel çağrı (Rotamı aç), kişisel menü');
    await p.goto(URL('index.html')); await p.waitForTimeout(500);
    ok(rel(p.url()) === 'index.html', 'oturumlu index açılıyor');
    await p.goto(URL('ap-calculus.html')); await p.waitForTimeout(800);
    ok(rel(p.url()) === 'ap-calculus.html', 'oturumlu ders sayfası açılıyor');
    // Çıkış: menü ziyaretçiye döner
    await p.goto(URL('giris.html?cikis=1')); await p.waitForSelector('#auth-status:not([hidden])');
    ok(await p.evaluate(() => !!document.querySelector('.navbar-guest') && !document.querySelector('.account') && ![...document.querySelectorAll('#site-nav-links a')].some(a => /index|rota|deneme/.test(a.getAttribute('href')))), 'çıkış sonrası ziyaretçi menüsü');
    await p.goto(URL('index.html')); await p.waitForURL(/sartlar\.html/);
    ok(true, 'çıkış sonrası index -> sartlar.html');
    ok(p._errs.length === 0, 'akışta hata yok' + (p._errs[0] ? ' ' + p._errs[0] : ''));
    await p.evaluate(() => localStorage.clear());
    await p.close();
  }
  await g.close();

  // F) Oturumlu (test hesabı) davranış değişmedi
  {
    const ctx = await mk({}, true);
    const p = await page(ctx);
    await p.goto(URL('index.html')); await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ labels: [...document.querySelectorAll('#site-nav-links > li[data-nav]')].map(x => x.dataset.navLabel), sartlar: !!document.querySelector('#site-nav-links li[data-nav="hedefim"] a[href="sartlar.html"]'), rehber: document.querySelectorAll('.footer-rehber a').length, guest: !!document.querySelector('.navbar-guest') }));
    ok(rel(p.url()) === 'index.html' && r.labels.join('|') === 'Bugün|Hedefim|Çalış|Başvuru|Ben' && r.sartlar && r.rehber === 5 && !r.guest, 'oturumlu menü (Tur 14 A1): 5 öğe, Hedefim > Ülke şartları, Rehberler altbilgide: ' + r.labels.join(' | '));
    await p.screenshot({ path: `${SHOTS}/k4-oturumlu-index-1280.png`, fullPage: false });
    await p.goto(URL('sinavlar.html')); await p.waitForSelector('.exam-card');
    ok(await p.evaluate(() => document.querySelectorAll('.pin-btn').length > 0 && document.querySelectorAll('.lock-ico').length === 0 && !!document.querySelector('option[value=listem]')), 'oturumlu sinavlar: liste düğmeleri var, kilit simgesi yok');
    await p.goto(URL('universiteler.html')); await p.waitForSelector('.country-panel:not([hidden])');
    ok(await p.evaluate(() => localStorage.getItem('apmeberra:panel:v1') !== null && document.querySelector('.page-head h1').textContent.startsWith('Hedef ülkendeki')), 'oturumlu universiteler: kişisel görünüm');
    ok(p._errs.length === 0, 'oturumlu sayfalarda hata yok' + (p._errs[0] ? ' ' + p._errs[0] : ''));
    await p.close();
    const m = await mk({ viewport: { width: 360, height: 760 }, colorScheme: 'dark' }, true);
    const q = await page(m);
    await q.goto(URL('index.html')); await q.waitForTimeout(600);
    await q.screenshot({ path: `${SHOTS}/k4-oturumlu-index-360-koyu.png`, fullPage: false });
    await m.close(); await ctx.close();
  }

  // G) 360 px taşma + ekran görüntüleri (ziyaretçi, açık/koyu)
  for (const [w, scheme] of [[360, 'light'], [360, 'dark'], [1280, 'dark']]) {
    const ctx = await mk({ viewport: { width: w, height: 800 }, colorScheme: scheme });
    for (const f of ['sartlar.html', 'sartlar.html?ulke=de&sinif=11', 'sartlar.html?ulke=it&sinif=mezun', 'giris.html', 'giris.html?donus=ap-physics.html', 'sinavlar.html', 'universiteler.html']) {
      const p = await page(ctx);
      await p.goto(URL(f)); await p.waitForTimeout(400);
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (w === 360) ok(ov <= 0 && p._errs.length === 0, `${w}px ${scheme} ${f}: taşma=${ov}`);
      if (f === 'sartlar.html?ulke=de&sinif=11') {
        if (w === 360) {
          // Tur 14 A2: telefonda "Giriş yap" üst çubukta, "Kayıt ol" alt gezinmede (seçim taşınır)
          ok(await p.isVisible('.nav-login') && !(await p.isVisible('.nav-signup')) && await p.isVisible('.bottom-nav a[data-bn="kayit"]') &&
            (await p.getAttribute('.bottom-nav a[data-bn="kayit"]', 'href')) === 'giris.html?model=lise&sinif=11&ulke=de&dil=en#kayit' &&
            (await p.$$eval('.bottom-nav .bn-item', e => e.map(x => x.textContent.trim()).join('|'))) === 'Şartlar|Üniversiteler|Sınavlar|Kayıt ol' &&
            (await p.getAttribute('.bottom-nav a[data-bn="sartlar"]', 'aria-current')) === 'page', `${scheme} 360: alt gezinme Şartlar|Üniversiteler|Sınavlar|Kayıt ol, Kayıt ol seçimi taşır`);
        }
        await p.screenshot({ path: `${SHOTS}/k4-sartlar-de11-${w}-${scheme}.png`, fullPage: true });
      }
      if (f === 'sartlar.html') await p.screenshot({ path: `${SHOTS}/k4-sartlar-secim-${w}-${scheme}.png`, fullPage: true });
      if (f === 'giris.html?donus=ap-physics.html') await p.screenshot({ path: `${SHOTS}/k4-giris-kilitli-${w}-${scheme}.png`, fullPage: true });
      await p.close();
    }
    await ctx.close();
  }
  {
    const ctx = await mk({ viewport: { width: 1280, height: 900 } });
    const p = await page(ctx);
    for (const [f, n] of [['sartlar.html?ulke=de&sinif=11', 'k4-sartlar-de11-1280-light'], ['sartlar.html', 'k4-sartlar-secim-1280-light'], ['giris.html', 'k4-giris-1280-light'], ['giris.html?donus=ap-physics.html', 'k4-giris-kilitli-1280-light']]) {
      await p.goto(URL(f)); await p.waitForTimeout(400);
      await p.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true });
    }
    await ctx.close();
  }

  await b.close();
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
