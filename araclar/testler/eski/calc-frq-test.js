// Tur 12 — ap-calculus.html resmi FRQ arşivi, hesap makinesi kartı ve referans kitaplığı tarayıcı testi.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const URL = 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/ap-calculus.html';
const SHOTS = path.resolve(__dirname, 'shots-t12');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
async function shot(p, sel, file) { const bb = await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: Math.min(r.height, 3000) }; }, sel); await p.screenshot({ path: file, clip: bb, fullPage: true, animations: 'disabled', timeout: 90000 }); }
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  for (const [w, scheme] of [[1280, 'light'], [360, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    await require('./oturum-tohum')(ctx);
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|MathJax|cdn\.jsdelivr/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(4000);
    const info = await p.evaluate(() => ({
      frq: document.querySelectorAll('#calc-official-frq-section details[id^="calc-frq-"]').length,
      boxes: document.querySelectorAll('#calc-official-frq-section fieldset[data-calc-frq] input[type=checkbox]').length,
      lib: document.querySelectorAll('#calc-reference-library-section .formula-card').length,
      rows: document.querySelectorAll('#calc-calculator-card-section tbody tr').length,
      ids: [1,2,3,4,5,6,7,8,9,10].every(n => !!document.getElementById('calc-unit' + n + '-lecture-section')),
      quiz: document.querySelectorAll('#calc-unit10-quiz-container *').length > 0
    }));
    ok(info.frq === 12, `${w}: 12 FRQ kartı (${info.frq})`);
    ok(info.boxes === 108, `${w}: 108 ölçüt kutusu (${info.boxes})`);
    ok(info.lib === 9 && info.rows === 4, `${w}: kitaplık 9 belge, komut kartı 4 satır`);
    ok(info.ids, `${w}: Unit 1–10 lecture id'leri`);
    ok(info.quiz, `${w}: Unit 10 soru motoru hâlâ yükleniyor`);
    // Etkileşim: 2025-1 kartını ve ölçütleri aç, 3 kutu işaretle
    await p.evaluate(() => { const d = document.getElementById('calc-frq-2025-1'); d.open = true; d.querySelector('details').open = true; });
    const cbs = p.locator('fieldset[data-calc-frq="2025-1"] input[type=checkbox]');
    await cbs.nth(0).check(); await cbs.nth(1).check(); await cbs.nth(8).check();
    let s = await p.evaluate(() => ({ q: document.querySelector('[data-calc-frq-puan="2025-1"]').textContent, y: document.querySelector('[data-calc-frq-yil="2025"]').textContent, st: localStorage.getItem('apmeberra:calc-frq:v1') }));
    ok(s.q === '3' && s.y === '3' && /"2025-1":\[true,true,false/.test(s.st), `${w}: puan 3/9, yıl 3/54, depoya yazıldı`);
    await p.reload({ waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForTimeout(2500);
    s = await p.evaluate(() => ({ q: document.querySelector('[data-calc-frq-puan="2025-1"]').textContent, y26: document.querySelector('[data-calc-frq-yil="2026"]').textContent }));
    ok(s.q === '3' && s.y26 === '0', `${w}: yeniden yüklemede işaretler korunuyor`);
    await p.evaluate(() => { const d = document.getElementById('calc-frq-2025-1'); d.open = true; d.querySelector('details').open = true; });
    await p.click('[data-calc-frq-temizle="2025-1"]');
    s = await p.evaluate(() => ({ q: document.querySelector('[data-calc-frq-puan="2025-1"]').textContent, st: JSON.parse(localStorage.getItem('apmeberra:calc-frq:v1')).isaretler }));
    ok(s.q === '0' && !('2025-1' in s.st), `${w}: temizle çalışıyor`);
    // Yatay taşma
    const ov = await p.evaluate(() => {
      const W = document.documentElement.clientWidth, bad = [];
      document.querySelectorAll('#calc-official-frq-section *, #calc-reference-library-section *, #calc-calculator-card-section *').forEach(el => {
        if (el.closest('.u-scroll-x')) return; const r = el.getBoundingClientRect(); if (r.width > 0 && r.right > W + 1) bad.push(el.tagName);
      });
      return { bad: bad.slice(0, 5) };
    });
    ok(ov.bad.length === 0, `${w}: yatay taşma yok ${JSON.stringify(ov)}`);
    ok(errs.length === 0, `${w}: sayfa hatası yok ${errs[0] || ''}`);
    await p.evaluate(() => { const d = document.getElementById('calc-frq-2026-2'); d.open = true; d.querySelector('details').open = true; });
    await shot(p, '#calc-frq-2026-2', `${SHOTS}/frq-2026-2-${w}-${scheme}.png`);
    await shot(p, '#calc-calculator-card-section', `${SHOTS}/hesap-karti-${w}-${scheme}.png`);
    await shot(p, '#calc-reference-library-section', `${SHOTS}/kitaplik-${w}-${scheme}.png`);
    await ctx.close();
  }
  await b.close();
  console.log(`\n${pass} geçti, ${fail} kaldı`);
  process.exit(fail ? 1 : 0);
})();
