const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
const DL = path.resolve(__dirname, '../dl-backup');
fs.mkdirSync(DL, { recursive: true });
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const dumpLS = p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('apmeberra:')) o[k] = localStorage.getItem(k); } return o; });
const J = s => JSON.parse(s);

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', acceptDownloads: true }); await require('./oturum-tohum')(ctx);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('dialog', d => d.accept());

  // 1) Quiz'de 2 cevap
  await p.goto(URL('ap-physics.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(2000);
  const q = await p.evaluate(() => PHYS_UNIT1_QUESTIONS.slice(0, 4).map(q => ({ id: q.id, correct: q.options.find(o => o.isCorrect).id, wrong: q.options.find(o => !o.isCorrect).id })));
  await p.click(`#opt-btn-${q[0].id}-${q[0].correct}`);
  await p.click(`#opt-btn-${q[1].id}-${q[1].wrong}`);
  const orig = await dumpLS(p);
  ok(Object.keys(J(orig['apmeberra:quiz:v1']).pages['ap-physics'].units['phys-unit1-quiz-container'].answers).length === 2, 'quiz: 2 cevap kaydedildi');

  // 2) Ana sayfa hatırlatması
  await p.goto(URL('index.html')); await p.waitForTimeout(300);
  ok(await p.isVisible('#home-backup-nudge'), 'index: hic yedek yokken hatirlatma gorunur');
  await p.locator('#home-backup-nudge').screenshot({ path: `${SHOTS}/yedek-index-nudge-light.png` });
  await p.screenshot({ path: `${SHOTS}/yedek-index-desktop-light.png` });

  // 3) Dışa aktar
  await p.goto(URL('ilerleme.html')); await p.waitForTimeout(300);
  ok(await p.isVisible('#backup-nudge'), 'ilerleme: ozet hatirlatmasi gorunur');
  ok((await p.textContent('#backup-last-text')).includes('henüz'), 'son yedek: henuz yok');
  await p.screenshot({ path: `${SHOTS}/yedek-ilerleme-desktop-light.png`, fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#backup-export')]);
  const fname = dl.suggestedFilename();
  ok(/^apmeberra-ilerleme-\d{4}-\d{2}-\d{2}\.json$/.test(fname), 'dosya adi: ' + fname);
  const file = path.join(DL, fname); await dl.saveAs(file);
  const data = J(fs.readFileSync(file, 'utf8'));
  ok(data.format === 'apmeberra-yedek' && data.surum === 1 && !isNaN(Date.parse(data.olusturma)), 'format/surum/olusturma');
  ok(Object.keys(data.anahtarlar).every(k => k.startsWith('apmeberra:')) && data.anahtarlar['apmeberra:quiz:v1'] && data.anahtarlar['apmeberra:errors:v1'], 'anahtarlar apmeberra: onekli, quiz+errors var');
  ok(JSON.stringify(data.ozet) === JSON.stringify({ cozulen: 2, dogru: 1, yanlis: 1, acikHata: 1 }), 'ozet: ' + JSON.stringify(data.ozet));
  await p.waitForTimeout(100);
  ok(!(await p.isVisible('#backup-nudge')), 'yedekten sonra hatirlatma kayboldu');
  ok(await p.evaluate(() => !!localStorage.getItem('apmeberra:lastBackup')), 'apmeberra:lastBackup yazildi');
  ok((await p.textContent('#backup-msg')).includes(fname), 'aria-live mesaji dosya adini soyluyor');

  // 4) Temizle -> yükle -> aynen geri gelsin
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  ok((await p.textContent('#k-answered')) === '0', 'temizlendi: cozulen=0');
  await p.setInputFiles('#backup-file', file);
  await p.waitForSelector('#backup-preview:not([hidden])');
  ok((await p.textContent('#bp-answered')) === '2' && (await p.textContent('#bp-open')) === '1', 'onizleme ozeti 2 cozulen / 1 acik hata');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'backup-preview-title'), 'odak onizleme basligina tasindi');
  ok(await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('apmeberra:')).length === 0), 'onaydan once hicbir sey yazilmadi (apmeberra: anahtarlari)');
  await p.screenshot({ path: `${SHOTS}/yedek-onizleme-desktop-light.png`, fullPage: true });
  await p.click('#backup-apply'); await p.waitForTimeout(150);
  const restored = await dumpLS(p);
  ok(restored['apmeberra:quiz:v1'] === orig['apmeberra:quiz:v1'], 'quiz verisi birebir geri geldi');
  ok(restored['apmeberra:errors:v1'] === orig['apmeberra:errors:v1'], 'Hata Defteri birebir geri geldi');
  ok((await p.textContent('#k-answered')) === '2' && (await p.textContent('#k-open')) === '1', 'ilerleme ekrani guncellendi');
  ok(!!restored['apmeberra:lastBackup'] && !(await p.isVisible('#backup-nudge')), 'bos cihaza yukleme sonrasi lastBackup = yedek tarihi');
  ok((await p.textContent('#backup-msg')).includes('birleştirildi'), 'basari mesaji');
  // quiz sayfası da geri gelen veriyi gösteriyor mu
  await p.goto(URL('ap-physics.html')); await p.waitForTimeout(1800);
  ok(await p.isVisible(`#feedback-${q[1].id}.wrong-box`) && (await p.textContent('#phys-unit1-quiz-container-answered-count')) === '2', 'quiz sayfasi geri yuklenen cevaplari gosteriyor');

  // 5) Birleştir: çakışan veri
  await p.goto(URL('ilerleme.html')); await p.waitForTimeout(200);
  const T = s => new Date(Date.parse('2026-10-01T10:00:00Z') + s * 1000).toISOString();
  const page = 'ap-physics', unit = 'phys-unit1-quiz-container';
  await p.evaluate(({ q, T0, T1, T2, page, unit }) => {
    localStorage.clear();
    localStorage.setItem('apmeberra:theme', 'light');
    localStorage.setItem('apmeberra:quiz:v1', JSON.stringify({ v: 1, pages: { [page]: { units: { [unit]: { title: 'Unit 1', total: 10, answers: {
      [q[0].id]: { s: q[0].correct, c: true, t: T1 },   // gelen daha yeni -> kaybeder
      [q[1].id]: { s: q[1].wrong, c: false, t: T2 },    // gelen daha eski -> kazanir (mevcut)
      [q[2].id]: { s: q[2].wrong, c: false }            // damgasiz -> mevcut korunur
    } } } } } }));
    localStorage.setItem('apmeberra:errors:v1', JSON.stringify({ v: 1, items: {
      [page + '|' + q[1].id]: { id: q[1].id, page, unit, topic: 'T1', errorTag: 'x', selected: q[1].wrong, correct: q[1].correct, date: T2, firstDate: T1, count: 2, resolved: false },
      [page + '|' + q[2].id]: { id: q[2].id, page, unit, topic: 'T2', errorTag: 'x', selected: q[2].wrong, correct: q[2].correct, date: T1, firstDate: T1, count: 1, resolved: false },
      [page + '|' + q[3].id]: { id: q[3].id, page, unit, topic: 'T3', errorTag: 'x', selected: q[3].wrong, correct: q[3].correct, date: T0, firstDate: T0, count: 1, resolved: true, resolvedDate: T1 }
    } }));
  }, { q, T0: T(0), T1: T(100), T2: T(200), page, unit });
  const inc = { format: 'apmeberra-yedek', surum: 1, olusturma: T(500), anahtarlar: {
    'apmeberra:theme': 'dark',
    'apmeberra:quiz:v1': { v: 1, pages: { [page]: { units: { [unit]: { title: 'Unit 1', total: 12, answers: {
      [q[0].id]: { s: q[0].wrong, c: false, t: T(300) },
      [q[1].id]: { s: q[1].correct, c: true, t: T(150) },
      [q[2].id]: { s: q[2].correct, c: true, t: T(400) },
      [q[3].id]: { s: q[3].wrong, c: false, t: T(50) }
    } } } }, 'ap-chemistry': { units: { 'chem-unit1-quiz-container': { title: 'Chem U1', total: 5, answers: { 'c1': { s: 'A', c: true, t: T(10) } } } } } } },
    'apmeberra:errors:v1': { v: 1, items: {
      [page + '|' + q[0].id]: { id: q[0].id, page, unit, topic: 'T0', errorTag: 'y', selected: q[0].wrong, correct: q[0].correct, date: T(300), firstDate: T(300), count: 1, resolved: false },
      [page + '|' + q[1].id]: { id: q[1].id, page, unit, topic: 'T1', errorTag: 'y', selected: q[1].wrong, correct: q[1].correct, date: T(50), firstDate: T(5), count: 5, resolved: true, resolvedDate: T(150) },
      [page + '|' + q[2].id]: { id: q[2].id, page, unit, topic: 'T2', errorTag: 'y', selected: q[2].wrong, correct: q[2].correct, date: T(90), firstDate: T(90), count: 3, resolved: true, resolvedDate: T(400) },
      [page + '|' + q[3].id]: { id: q[3].id, page, unit, topic: 'T3', errorTag: 'y', selected: q[3].wrong, correct: q[3].correct, date: T(50), firstDate: T(50), count: 4, resolved: false }
    } }
  } };
  const incFile = path.join(DL, 'cakisan.json'); fs.writeFileSync(incFile, JSON.stringify(inc));
  await p.reload(); await p.waitForTimeout(200);
  await p.setInputFiles('#backup-file', incFile);
  await p.waitForSelector('#backup-preview:not([hidden])');
  await p.click('#backup-apply'); await p.waitForTimeout(150);
  const m = await dumpLS(p); const mq = J(m['apmeberra:quiz:v1']); const me = J(m['apmeberra:errors:v1']).items;
  const A = mq.pages[page].units[unit].answers;
  ok(A[q[0].id].s === q[0].wrong && A[q[0].id].t === T(300), 'birlestir: daha yeni damgali gelen cevap kazandi');
  ok(A[q[1].id].s === q[1].wrong && A[q[1].id].t === T(200), 'birlestir: daha eski gelen cevap mevcut kaydi ezmedi');
  ok(A[q[2].id].s === q[2].wrong && !A[q[2].id].t, 'birlestir: damgasiz mevcut kayit korundu');
  ok(A[q[3].id] && A[q[3].id].t === T(50), 'birlestir: yalniz yedekte olan cevap eklendi');
  ok(mq.pages['ap-chemistry'] && mq.pages['ap-chemistry'].units['chem-unit1-quiz-container'].answers.c1, 'birlestir: yalniz yedekte olan sayfa eklendi');
  ok(mq.pages[page].units[unit].total === 12, 'birlestir: unite toplam soru = max');
  const e1 = me[page + '|' + q[1].id];
  ok(e1.count === 5 && e1.date === T(200) && e1.firstDate === T(5) && e1.resolved === false, 'hata: count max, son tarih en yeni, ilk tarih en eski, sonraki yanlis duzeltmeyi gecersiz kildi');
  const e2 = me[page + '|' + q[2].id];
  ok(e2.count === 3 && e2.resolved === true && e2.resolvedDate === T(400), 'hata: son yanlistan sonra yapilan duzeltme korundu');
  const e3 = me[page + '|' + q[3].id];
  ok(e3.count === 4 && e3.resolved === true && e3.resolvedDate === T(100), 'hata: mevcut duzeltildi bilgisi korundu (count=4)');
  ok(me[page + '|' + q[0].id] && me[page + '|' + q[0].id].resolved === false, 'hata: yeni kayit eklendi');
  ok(m['apmeberra:theme'] === 'light', 'birlestir: bu cihazdaki tema tercihi korundu');
  ok(!errs.length, 'birlestirme sirasinda hata yok');

  // 5c) FRQ birleştirme (Tur 14): apmeberra:frq:v1 tür bazında, apmeberra:calc-frq:v1 soru bazında
  const fr = await p.evaluate(({ T1, T2, T3 }) => {
    const mk = (m, g) => ({ metin: m, kontrol: { A: [true], B: [false, false, false, false], C: [false, false] }, guncelleme: g });
    localStorage.setItem('apmeberra:frq:v1', JSON.stringify({ surum: 1, aktif: 'rhetorical', guncelleme: T2, yazilar: { synthesis: mk('cihaz-yeni', T2), rhetorical: mk('cihaz-eski', T1) } }));
    localStorage.setItem('apmeberra:calc-frq:v1', JSON.stringify({ surum: 1, guncelleme: T1, isaretler: { '2025-1': [true, false], '2025-2': [true] } }));
    const inc = { olusturma: T3, anahtarlar: {
      'apmeberra:frq:v1': { surum: 1, aktif: 'argument', guncelleme: T3, yazilar: { synthesis: mk('yedek-eski', T1), rhetorical: mk('yedek-yeni', T3), argument: mk('yedek-tek', T3) } },
      'apmeberra:calc-frq:v1': { surum: 1, guncelleme: T3, isaretler: { '2025-1': [false, true], '2026-6': [true, true] } }
    } };
    const B = window.APMEBERRA.backup;
    const n = B.plan(inc, 'merge').next;
    const bozuk = B.plan({ olusturma: T3, anahtarlar: { 'apmeberra:frq:v1': { surum: 1 }, 'apmeberra:calc-frq:v1': 'x' } }, 'merge').next;
    const r = { f: n['apmeberra:frq:v1'], c: n['apmeberra:calc-frq:v1'], bf: bozuk['apmeberra:frq:v1'], bc: bozuk['apmeberra:calc-frq:v1'] };
    localStorage.removeItem('apmeberra:frq:v1'); localStorage.removeItem('apmeberra:calc-frq:v1');
    const bos = B.plan(inc, 'merge').next;
    r.bosF = bos['apmeberra:frq:v1']; r.bosC = bos['apmeberra:calc-frq:v1'];
    return r;
  }, { T1: T(100), T2: T(200), T3: T(300) });
  ok(fr.f.yazilar.synthesis.metin === 'cihaz-yeni' && fr.f.yazilar.rhetorical.metin === 'yedek-yeni' && fr.f.yazilar.argument.metin === 'yedek-tek', 'frq: tur bazinda daha yeni taslak kazandi, yalniz yedekteki tur eklendi');
  ok(fr.f.aktif === 'argument' && fr.f.guncelleme === T(300), 'frq: aktif sekme ve guncelleme daha yeni taraftan');
  ok(JSON.stringify(fr.c.isaretler) === JSON.stringify({ '2025-1': [false, true], '2025-2': [true], '2026-6': [true, true] }), 'calc-frq: yeni yedek cakisan soruda kazandi, iki taraftaki sorular birlesti');
  ok(fr.bf.yazilar && fr.bf.yazilar.synthesis.metin === 'cihaz-yeni' && fr.bc.isaretler && fr.bc.isaretler['2025-2'], 'frq/calc-frq: bozuk yedek mevcut veriyi bozmadi');
  ok(fr.bosF && fr.bosF.yazilar.argument && fr.bosC && fr.bosC.isaretler['2026-6'], 'frq/calc-frq: bos cihaza yedek aynen yazildi');
  await p.evaluate(() => { localStorage.removeItem('apmeberra:frq:v1'); localStorage.removeItem('apmeberra:calc-frq:v1'); });

  // 5b) Değiştir modu
  await p.setInputFiles('#backup-file', file);
  await p.waitForSelector('#backup-preview:not([hidden])');
  await p.check('input[name="backup-mode"][value="replace"]');
  await p.screenshot({ path: `${SHOTS}/yedek-degistir-desktop-light.png`, fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 900 } });
  await p.locator('#backup-preview').screenshot({ path: `${SHOTS}/yedek-onizleme-degistir-light.png` });
  await p.click('#backup-apply'); await p.waitForTimeout(150);
  const r = await dumpLS(p);
  ok(r['apmeberra:quiz:v1'] === orig['apmeberra:quiz:v1'] && r['apmeberra:errors:v1'] === orig['apmeberra:errors:v1'], 'degistir: veriler yedektekiyle birebir');
  ok(!J(r['apmeberra:quiz:v1']).pages['ap-chemistry'], 'degistir: yedekte olmayan veri silindi');

  // 6) Bozuk / yabancı dosyalar
  const before = await dumpLS(p);
  const cases = [
    ['bozuk.json', '{"format":"apmeberra-yedek", surum: 1,', 'geçerli bir JSON değil'],
    ['yabanci.json', JSON.stringify({ name: 'package', version: '1.0.0' }), 'yedeği değil'],
    ['onek.json', JSON.stringify({ format: 'apmeberra-yedek', surum: 1, olusturma: T(0), anahtarlar: { 'apmeberra:quiz:v1': { v: 1, pages: {} }, 'evil:key': 'x' } }), 'ait olmayan'],
    ['surum.json', JSON.stringify({ format: 'apmeberra-yedek', surum: 9, anahtarlar: {} }), 'daha yeni'],
    ['yapi.json', JSON.stringify({ format: 'apmeberra-yedek', surum: 1, anahtarlar: { 'apmeberra:quiz:v1': [1, 2] } }), 'geçersiz'],
    ['bos.json', '', 'boş']
  ];
  for (const [n, txt, expect] of cases) {
    const f = path.join(DL, n); fs.writeFileSync(f, txt);
    await p.setInputFiles('#backup-file', f); await p.waitForTimeout(200);
    const msg = await p.textContent('#backup-msg');
    const role = await p.getAttribute('#backup-msg', 'role');
    ok(msg.includes(expect) && role === 'alert' && !(await p.isVisible('#backup-preview')), `${n}: hata mesaji (“${msg.slice(0, 70)}…”)`);
  }
  ok(JSON.stringify(await dumpLS(p)) === JSON.stringify(before), 'bozuk dosyalar hicbir seyi degistirmedi');
  await p.screenshot({ path: `${SHOTS}/yedek-hata-desktop-light.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
  await p.locator('#yedek-section').screenshot({ path: `${SHOTS}/yedek-hata-kart-light.png` });

  // 7) Koyu tema + telefon + iptal
  await p.evaluate(() => { localStorage.setItem('apmeberra:theme', 'dark'); localStorage.removeItem('apmeberra:lastBackup'); });
  await p.reload(); await p.waitForTimeout(200);
  await p.setInputFiles('#backup-file', file); await p.waitForSelector('#backup-preview:not([hidden])');
  await p.locator('#yedek-section').screenshot({ path: `${SHOTS}/yedek-kart-desktop-dark.png` });
  await p.screenshot({ path: `${SHOTS}/yedek-ilerleme-desktop-dark.png`, fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'telefon: yatay kaydirma yok (koyu)');
  await p.screenshot({ path: `${SHOTS}/yedek-ilerleme-phone-dark.png`, fullPage: true });
  await p.click('#backup-cancel'); await p.waitForTimeout(100);
  ok(!(await p.isVisible('#backup-preview')) && (await p.textContent('#backup-msg')).includes('iptal'), 'vazgec: onizleme kapandi, mesaj verildi');
  await p.evaluate(() => localStorage.setItem('apmeberra:theme', 'light')); await p.reload(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'telefon: yatay kaydirma yok (acik)');
  await p.screenshot({ path: `${SHOTS}/yedek-ilerleme-phone-light.png`, fullPage: true });
  await p.goto(URL('index.html')); await p.waitForTimeout(200);
  ok(await p.isVisible('#home-backup-nudge'), 'index telefon: hatirlatma gorunur');
  await p.screenshot({ path: `${SHOTS}/yedek-index-phone-light.png`, fullPage: false });
  // 7 gün kuralı
  await p.evaluate(() => localStorage.setItem('apmeberra:lastBackup', new Date(Date.now() - 8 * 864e5).toISOString())); await p.reload(); await p.waitForTimeout(200);
  ok(await p.isVisible('#home-backup-nudge') && (await p.textContent('#home-backup-text')).includes('8 gün'), 'index: 8 gunluk yedekte hatirlatma');
  await p.evaluate(() => localStorage.setItem('apmeberra:lastBackup', new Date(Date.now() - 2 * 864e5).toISOString())); await p.reload(); await p.waitForTimeout(200);
  ok(!(await p.isVisible('#home-backup-nudge')), 'index: 2 gunluk yedekte hatirlatma yok');
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);
  ok(!(await p.isVisible('#home-backup-nudge')), 'index: cevap yokken hatirlatma yok');

  // 8) MathJax yokken quiz sayfası çökmüyor
  await p.route(/mathjax|tex-svg|tex-mml/i, route => route.abort());
  const errs2 = []; p.on('pageerror', e => errs2.push(e.message));
  await p.goto(URL('ap-physics.html')); await p.waitForTimeout(1500);
  await p.click(`#opt-btn-${q[0].id}-${q[0].wrong}`);
  ok(await p.isVisible(`#feedback-${q[0].id}`) && !errs2.length, 'MathJax yuklenemezken quiz calisiyor, sayfa hatasi yok');
  await p.unroute(/mathjax|tex-svg|tex-mml/i);

  // Temizlik
  await p.evaluate(() => localStorage.clear());
  ok(!errs.filter(e => !/net::ERR_FAILED|Failed to load resource/.test(e)).length, 'konsol/sayfa hatasi yok' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  for (const f of fs.readdirSync(DL)) fs.unlinkSync(path.join(DL, f));
  console.log(fail ? `\n${fail} FAIL` : '\nTUM TESTLER GECTI');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
