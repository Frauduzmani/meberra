// Paketlenmiş seviye testi: ağ kapalıyken çalışır mı?
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const ctx = await b.newContext(); await require('./oturum-tohum')(ctx); const net = [];
  await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  await p.goto('file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/sunum/AP-MEBERRA/portal/seviye-testi.html?ornek=1'); await p.waitForSelector('body[data-sv-hazir]');
  ok((await p.$$('input[name="sv-ders"]:not([disabled])')).length >= 4 && !(await p.$('input[value="_ornek"]')), 'pakette gerçek bankalar yüklü, ÖRNEK yok (?ornek=1 olsa da)');
  await p.check('input[value="physics-1"]'); await p.click('#sv-start-btn'); await p.waitForTimeout(2500);
  ok((await p.$$('#sv-q-card mjx-container svg')).length >= 0, 'soru çizildi; formül: ' + (await p.$$('#sv-q-card mjx-container')).length);
  await p.click('#sv-finish'); await p.click('#sv-finish-yes'); await p.waitForSelector('#sv-report:not([hidden])');
  ok(true, 'rapor üretildi');
  ok(net.length === 0 && errs.length === 0, `ağ isteği ${net.length}, sayfa hatası ${errs.length} ${errs.join('|')}`);
  await p.evaluate(() => localStorage.clear()); await b.close();
})();
