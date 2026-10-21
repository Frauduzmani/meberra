// Mezun Menüsü testi — Tur 11 sürümü (karar D2): mezun.html artık sartlar.html?model=lise-mezun'a yönlendirir.
// Kapsam: eski yer imleri (?ulke=hu|pl, #m-<id>), Macaristan/Polonya içeriğinin "Lise mezunu" modelinde görünmesi, Polonya
// "Teyit gerekir" rozeti, BME duyurusu (bitiş tarihine kadar; yalnızca lise mezunu + Macaristan), menüde "Mezunlar" yok,
// Panelim duyuru kartı (lise mezununda), 360 px taşma. Çalıştır: node mezun-menu-test.js. Ekran görüntüleri ../shots/.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = 'C:/Users/hp/Desktop/projelerim/AP MEBERRA/';
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });
const P = 'apmeberra-hesap:v1:';
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (c || x === undefined ? '' : ' -> ' + JSON.stringify(x))); if (c) pass++; else fail++; };
const rel = u => decodeURIComponent(u.split('AP%20MEBERRA/')[1] || u);

// Node: yeni veri (ulke/hu.js, ulke/pl.js, duyurular.js) ve motor
global.window = {};
require(ROOT + 'data/mevzuat/ulke-dizini.js'); require(ROOT + 'data/mevzuat/duyurular.js');
['hu', 'pl'].forEach(c => { if (fs.existsSync(ROOT + 'data/mevzuat/ulke/' + c + '.js')) require(ROOT + 'data/mevzuat/ulke/' + c + '.js'); });
const W = global.window; delete global.window;
const M = require(ROOT + 'assets/js/sartlar-motor.js');
const say = u => { const B = M.ulkeBolumleri(W.APMEBERRA_ULKE_VERI[u], { model: 'lise-mezun', ulke: u, dil: 'en' }); return ['gerekenler', 'buYil', 'tarihler', 'hatalar'].reduce((n, a) => n + B[a].length, 0); };

(async () => {
  ok(M.duyuruDogrula(W.APMEBERRA_DUYURULAR).length === 0 && W.APMEBERRA_DUYURULAR.some(d => d.id === 'duyuru-bme-subat-2027'), 'duyurular.js geçerli, BME duyurusu var');
  ok(say('hu') > 0 && say('pl') > 0, `Lise mezunu modelinde Macaristan ${say('hu')}, Polonya ${say('pl')} madde`);

  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const errs = [];
  async function mk(bugun, profil, opts = {}) {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' }, opts));
    await ctx.addInitScript(([bg, pre, prof]) => {
      window.APMEBERRA_BUGUN = bg;
      if (prof && !localStorage.getItem(pre + 'oturum')) {
        localStorage.setItem(pre + 'kullanicilar', JSON.stringify([{ id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 1 }]));
        localStorage.setItem(pre + 'oturum', JSON.stringify({ id: 'utest' })); localStorage.setItem(pre + 'aktif', JSON.stringify('utest'));
        localStorage.setItem(pre + 'profil:utest', JSON.stringify(prof));
      }
    }, [bugun, P, profil || null]);
    return ctx;
  }
  async function git(ctx, f, bekle) {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(f + ' console: ' + m.text()); });
    await p.goto(URL(f)); await p.waitForTimeout(bekle || 600);
    return p;
  }
  const tasma = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  // 1) Yönlendirme: eski yer imleri korunur
  {
    const ctx = await mk('2026-10-14');
    for (const [eski, yeni] of [['mezun.html', 'sartlar.html?model=lise-mezun'], ['mezun.html?ulke=pl', 'sartlar.html?model=lise-mezun&ulke=pl&dil=en'], ['mezun.html?ulke=HU', 'sartlar.html?model=lise-mezun&ulke=hu&dil=en'], ['mezun.html?ulke=xx', 'sartlar.html?model=lise-mezun']]) {
      const p = await git(ctx, eski);
      ok(rel(p.url()) === yeni, `yönlendirme: ${eski} -> ${rel(p.url())}`);
      await p.close();
    }
    // Yönlendirme kapalıyken (noscript benzeri) sayfa açıklama ve bağlantı gösterir
    const c2 = await b.newContext(); await c2.addInitScript(() => { window.APMEBERRA_YONLENDIRME_YOK = true; });
    const p2 = await git(c2, 'mezun.html?ulke=pl');
    ok(await p2.evaluate(() => document.querySelector('h1').textContent === 'Lise mezunları sayfası taşındı' && document.getElementById('mz-git').getAttribute('href') === 'sartlar.html?model=lise-mezun&ulke=pl&dil=en'), 'yönlendirme sayfası: başlık ve hedef bağlantı');
    await c2.close();
    await ctx.close();
  }
  // 2) Lise mezunu × Macaristan: içerik, BME duyurusu, menü
  {
    const ctx = await mk('2026-10-14');
    const p = await git(ctx, 'sartlar.html?model=lise-mezun&ulke=hu&dil=en');
    const r = await p.evaluate(() => ({
      guest: !!document.querySelector('.navbar-guest'),
      items: document.querySelectorAll('.sr-grid:not(.sr-grid-ek) .sr-item').length,
      secs: [...document.querySelectorAll('.sr-grid:not(.sr-grid-ek) .sr-sec h2')].map(h => h.textContent),
      kaynakli: [...document.querySelectorAll('.sr-grid:not(.sr-grid-ek) .sr-item')].every(li => li.querySelector('.kesinlik') && li.querySelector('.src-link[href^="http"]')),
      duyuru: !!document.querySelector('[data-duyuru="duyuru-bme-subat-2027"]'),
      nav: [...document.querySelectorAll('#site-nav-links a')].map(a => a.getAttribute('href')),
      h1: document.getElementById('sr-h1').textContent
    }));
    ok(r.guest && r.h1 === 'Macaristan’da İngilizce lisans: lise mezunları için şartlar', 'hu/lise mezunu: ziyaretçide açık, başlık', r.h1);
    ok(r.items === say('hu') && r.secs.join('|') === 'Ne gerekiyor|Bu yıl ne yapmalısın|Kaçırılmaması gereken tarihler|Sık yapılan hatalar', `hu: ${r.items} madde dört bölümde (motor ${say('hu')})`);
    ok(r.kaynakli, 'her madde kesinlik etiketi + resmi kaynak taşır');
    ok(r.duyuru, '14 Ekim 2026: BME duyurusu (lise mezunu + Macaristan)');
    ok(!r.nav.includes('mezun.html'), 'ziyaretçi menüsünde "Mezunlar" bağlantısı yok (D2)', r.nav);
    await p.screenshot({ path: path.join(SHOTS, 't11-mezun-hu-1280-light.png'), fullPage: true });
    await p.goto(URL('sartlar.html?model=lise&sinif=12&ulke=hu&dil=en')); await p.waitForTimeout(600);
    ok(!(await p.$('[data-duyuru]')), 'hu/12. sınıf: BME duyurusu gösterilmez (hedef lise mezunu)');
    await ctx.close();
  }
  // 3) Ülke rozetleri (PM kararı 15 Ekim 2026: pl rozetsiz, dk ve ie "Teyit gerekir"); duyuru bitiş tarihi
  {
    const ctx = await mk('2026-11-16');
    const p = await git(ctx, 'mezun.html?ulke=pl', 900);
    const r = await p.evaluate(() => ({ rozet: [...document.querySelectorAll('.sr-summary .kesinlik')].map(x => x.textContent), bant: !!document.querySelector('[data-bant="rozet"]'), kart: (document.querySelector('.sr-ulke[data-ulke="pl"] .mz-rozet') || {}).textContent }));
    ok(!r.rozet.includes('Teyit gerekir') && !r.bant && !r.kart, 'pl: rozet yok (Gdańsk TÜ muafiyeti doğrulandı)', r);
    await p.goto(URL('sartlar.html?model=lise-mezun&ulke=dk&dil=en')); await p.waitForTimeout(700);
    const dk = await p.evaluate(() => ({ rozet: [...document.querySelectorAll('.sr-summary .kesinlik')].map(x => x.textContent), bant: !!document.querySelector('[data-bant="rozet"]'), kart: (document.querySelector('.sr-ulke[data-ulke="dk"] .mz-rozet') || {}).textContent, ie: (document.querySelector('.sr-ulke[data-ulke="ie"] .mz-rozet') || {}).textContent }));
    ok(dk.rozet.includes('Teyit gerekir') && dk.bant && dk.kart === 'Teyit gerekir' && dk.ie === 'Teyit gerekir', 'dk: özet ve ülke kartında "Teyit gerekir" rozeti + bant; ie kartında rozet', dk);
    await p.goto(URL('sartlar.html?model=lise-mezun&ulke=hu&dil=en')); await p.waitForTimeout(600);
    ok(await p.evaluate(() => document.querySelectorAll('[data-duyuru]').length) === 0, '16 Kasım 2026: BME duyurusu gösterilmez');
    await ctx.close();
    const c2 = await mk('2026-11-15'); const p2 = await git(c2, 'sartlar.html?model=lise-mezun&ulke=hu&dil=en');
    ok(await p2.evaluate(() => document.querySelectorAll('[data-duyuru]').length) === 1, '15 Kasım 2026 (son gün): duyuru görünür');
    await c2.close();
  }
  // 4) 360 px, koyu ve açık tema
  for (const scheme of ['dark', 'light']) {
    const ctx = await mk('2026-10-14', null, { viewport: { width: 360, height: 800 }, colorScheme: scheme });
    const p = await git(ctx, 'mezun.html?ulke=pl', 900);
    ok(await tasma(p) <= 0, `360px ${scheme}: lise mezunu/Polonya yatay taşma yok`);
    await p.screenshot({ path: path.join(SHOTS, `t11-mezun-pl-360-${scheme}.png`) });
    await ctx.close();
  }
  // 5) Oturumlu: menüde Mezunlar yok; duyuru kartı (Tur 14 A4: Hedefim › Şartlar'da, Bugün'de şerit) lise mezununda var, 12. sınıfta yok, bitişten sonra duyurusuz
  {
    const MEZ = { okul: 'Test Lisesi', sinif: 'mezun', ulkeler: ['de'], aktifRota: 'de', hedefBaslangicYili: '2027', yerlesmeDurumu: 'yok', tamamlandi: true };
    const ctx = await mk('2026-10-14', MEZ);
    const p0 = await git(ctx, 'index.html');
    const r0 = await p0.evaluate(() => ({ nav: !!document.querySelector('#site-nav-links a[href="mezun.html"]'), sartlar: !!document.querySelector('#site-nav-links a[href="sartlar.html"]'), panel: !!document.getElementById('mezun-panel'), serit: (document.querySelector('#bugun-serit a') || { getAttribute: () => '' }).getAttribute('href') }));
    ok(!r0.nav && r0.sartlar, 'oturumlu menü: Hedefim > Ülke şartları var, Mezunlar yok');
    ok(!r0.panel && r0.serit === 'sartlar.html?model=lise-mezun&ulke=de&dil=en#mezun-panel', 'Bugün: duyuru kartı yok, şerit Hedefim › Şartlar #mezun-panel bağlantısı', r0);
    await Promise.all([p0.waitForURL(/sartlar\.html/), p0.click('#bugun-serit a')]); await p0.waitForTimeout(500);
    const p = p0;
    const r = await p.evaluate(() => ({ kart: !!document.getElementById('mezun-panel') && document.getElementById('mezun-panel').open, duyuru: !!document.querySelector('#mezun-panel [data-duyuru="duyuru-bme-subat-2027"]'), link: (document.querySelector('#mezun-panel a[data-tum-sartlar]') || {}).getAttribute ? document.querySelector('#mezun-panel a[data-tum-sartlar]').getAttribute('href') : null }));
    ok(r.kart && r.duyuru && r.link === 'sartlar.html?model=lise-mezun', 'lise mezunu Şartlar: duyuru paneli açık geldi, BME duyurusu ve tüm ülkeler bağlantısı (eski profil, ülke süzülmeden)', r);
    await p.screenshot({ path: path.join(SHOTS, 't11-mezun-panel-1280-light.png') });
    await p.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [P + 'profil:utest', Object.assign({}, MEZ, { sinif: '12' })]);
    await p.goto(URL('sartlar.html?model=lise&sinif=12&ulke=fr&dil=en')); await p.waitForTimeout(500);
    ok(await p.evaluate(() => !document.getElementById('mezun-panel') && !document.querySelector('#sr-kisisel [data-duyuru]')), '12. sınıf Şartlar: kişisel duyuru kartı yok');
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
    const c2 = await mk('2026-11-16', MEZ); const p2 = await git(c2, 'sartlar.html?model=lise-mezun&ulke=de&dil=en');
    ok(await p2.evaluate(() => !!document.getElementById('mezun-panel') && !document.querySelector('#mezun-panel [data-duyuru]')), 'lise mezunu Şartlar 16 Kasım: kart var, duyuru yok');
    await p2.evaluate(() => localStorage.clear());
    await c2.close();
  }
  ok(errs.length === 0, 'konsol/sayfa hatası yok', errs);
  await b.close();
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
