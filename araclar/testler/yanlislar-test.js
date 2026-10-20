// Tur 14 A7 (Ajan 11) — Yanlışlarım modu (deneme.html?mod=yanlislar) + deneme sonuç ekranı eylemleri, uçtan uca.
// Senaryolar: boş durum; 6 açık hata + 1 bankada olmayan hata tohumlanır; mod açılır (özet, ders süzgeci, ?ders=); tek oturum;
// yenilemede devam; teslim → doğru cevap hatayı kapatır (resolved), yanlış açık kalır (count+1), boş değişmez; sonuç eylemleri
// (Yanlışlarımı tekrar çöz, Konu anlatımına dön → ünite anlatım başlığı, Bugün'e dön); hepsi kapanınca "Açık hatan kalmadı";
// normal deneme sonucunda "Yanlış N soruyu şimdi çöz" (&deneme=); yarım deneme varken uyarı; Bugün/Çalış/İlerleme bağlantıları;
// 360 px açık/koyu taşma yok. Ağ isteği yok (MathJax CDN engellenir). Çalıştır: node yanlislar-test.js (playwright-core kurulu klasörde).
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (!c && x !== undefined ? ' -> ' + JSON.stringify(x).slice(0, 400) : '')); c ? pass++ : fail++; };
const DKEY = 'apmeberra:deneme:v1', EKEY = 'apmeberra:errors:v1';

global.window = {};
require('C:/Users/hp/Desktop/projelerim/AP MEBERRA/data/sorular/deneme-bankasi.js');
const BANK = global.window.APMEBERRA_DENEME_BANKASI;
const BY = {}; BANK.sorular.forEach(q => { BY[q.sayfa + '|' + q.id] = q; });
const correctOf = k => BY[k].options.find(o => o.isCorrect).id;
const wrongOf = k => BY[k].options.find(o => !o.isCorrect).id;
const phys = BANK.sorular.filter(q => q.sayfa === 'ap-physics.html' && q.unite === '1' && !q.pasaj).slice(0, 4);
const chem = BANK.sorular.filter(q => q.sayfa === 'ap-chemistry.html' && q.unite === '1' && !q.pasaj).slice(0, 2);
const HATA = { v: 1, items: {} };
[...phys, ...chem].forEach((q, i) => {
  const page = q.sayfa.replace('.html', '');
  HATA.items[page + '|' + q.id] = { id: q.id, page, unit: q.kap, unitTitle: q.kapBaslik, number: q.number || null, topic: 'Seed ' + i, errorTag: 'x', selected: wrongOf(q.sayfa + '|' + q.id), correct: correctOf(q.sayfa + '|' + q.id), date: '2026-10-1' + i + 'T10:00:00Z', firstDate: '2026-10-1' + i + 'T10:00:00Z', count: 1, resolved: false };
});
HATA.items['ap-physics|bankada_yok_q1'] = { id: 'bankada_yok_q1', page: 'ap-physics', unit: 'phys-unit1-quiz-container', topic: 'Dışarıda', date: '2026-10-01T10:00:00Z', count: 1, resolved: false };
// Oturum sırası (deneme.js yanlisSirala ile aynı kural): ders sırası (banka kodu) → ünite → numara
const SIRA = [...phys, ...chem].map(q => q.sayfa + '|' + q.id);

const SEED = () => {
  try {
    if (localStorage.getItem('apmeberra-hesap:v1:oturum')) return;
    const id = 'u_test_yanlis';
    localStorage.setItem('apmeberra-hesap:v1:kullanicilar', JSON.stringify([{ id, ad: 'Test', soyad: 'Yanlış', kullaniciAdi: 'testyanlis', salt: '00', hash: '00', iter: 150000, olusturma: '2026-10-12T00:00:00Z' }]));
    localStorage.setItem('apmeberra-hesap:v1:oturum', JSON.stringify({ id, baslangic: '2026-10-12T00:00:00Z' }));
    localStorage.setItem('apmeberra-hesap:v1:aktif', JSON.stringify(id));
    localStorage.setItem('apmeberra-hesap:v1:profil:' + id, JSON.stringify({ okul: 'Test Lisesi', sinif: '11', ogrenciModeli: 'lise', ulkeler: ['de', 'it'], aktifRota: 'de', egitimDili: 'en', tamamlandi: true }));
  } catch (e) {}
};
const get = (p, k) => p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), k);
const set = (p, k, v) => p.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [k, v]);
const ov = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  await ctx.addInitScript(SEED);
  const ag = [];
  await ctx.route(/^https?:/, r => { ag.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());

  // ---------- 1) Boş durum ----------
  await p.goto(URL('deneme.html'));
  await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('apmeberra:') && k !== 'apmeberra:theme').forEach(k => localStorage.removeItem(k)));
  await p.goto(URL('deneme.html?mod=yanlislar')); await p.waitForSelector('#dn-yanlis-bos');
  const bos = await p.evaluate(() => ({ h: document.querySelector('#dn-yanlis-bos h2').textContent, a: [...document.querySelectorAll('#dn-yanlis-bos a')].map(a => a.getAttribute('href')), h1: document.activeElement.id }));
  ok(bos.h === 'Açık hatan yok' && bos.a.join() === 'deneme.html,calis.html,index.html' && bos.h1 === 'dn-h1', '1) boş durum: "Açık hatan yok", Deneme çöz · Çalış · Bugün’e dön, odak başlıkta', bos);
  await p.goto(URL('deneme.html')); await p.waitForSelector('#dn-yanlis-kart');
  ok(await p.evaluate(() => document.getElementById('dn-yanlis-kart').classList.contains('is-bos') && !document.querySelector('#dn-yanlis-kart a.btn-primary')), '1) giriş ekranı: Yanlışlarım kartı boş durumda (düğme yok)');

  // ---------- 2) 6 açık hata (+1 bankada yok) tohumlanır; mod açılır ----------
  await set(p, EKEY, HATA);
  await p.goto(URL('deneme.html')); await p.waitForSelector('#dn-yanlis-kart');
  ok(await p.evaluate(() => /6/.test(document.querySelector('#dn-yanlis-kart strong').textContent) && document.querySelector('#dn-yanlis-kart a.btn-primary').getAttribute('href') === 'deneme.html?mod=yanlislar'), '2) giriş ekranı: "6 açık hatan deneme havuzunda" + Yanlışlarımı çöz');
  await p.goto(URL('deneme.html?mod=yanlislar&ders=chemistry')); await p.waitForSelector('#dn-yform');
  ok(await p.evaluate(() => [...document.querySelectorAll('input[name="yders"]:checked')].map(i => i.value).join()) === 'chemistry' && /\(2 soru\)/.test(await p.textContent('#dn-ystart')), '2) ?ders=chemistry yalnız Chemistry seçili → 2 soru');
  await p.goto(URL('deneme.html?mod=yanlislar')); await p.waitForSelector('#dn-yform');
  const oz = await p.evaluate(() => ({ dd: [...document.querySelectorAll('.dn-y-ozet dd')].map(x => x.textContent), ders: [...document.querySelectorAll('input[name="yders"]')].map(i => i.value + (i.checked ? '+' : '-')), btn: document.getElementById('dn-ystart').textContent, h1: document.getElementById('dn-h1').textContent, not: document.querySelector('.dn-y-panel .dn-note').textContent }));
  ok(oz.dd.join() === '7,6,1' && oz.ders.join() === 'physics-1+,chemistry+' && /\(6 soru\)/.test(oz.btn) && /tek oturumda/.test(oz.h1) && /1 açık hata ders sayfalarındaki/.test(oz.not), '2) mod: özet 7 açık · 6 çözülebilir · 1 ders sayfasında; 2 ders seçili; Başlat (6 soru)', oz);
  await noFlow(p, '2) mod 1280');
  await p.screenshot({ path: path.join(SHOTS, 't14-A7-yanlislar-kurulum-1280-light.png'), fullPage: true });
  await p.uncheck('input[name="yders"][value="physics-1"]');
  ok(/\(2 soru\)/.test(await p.textContent('#dn-ystart')), '2) ders süzgeci: Physics kaldırılınca 2 soru');
  await p.uncheck('input[name="yders"][value="chemistry"]');
  ok(await p.isDisabled('#dn-ystart') && (await p.textContent('#dn-yform-msg')).includes('En az bir ders'), '2) hiç ders yokken Başlat kapalı + ileti');
  await p.check('input[name="yders"][value="physics-1"]'); await p.check('input[name="yders"][value="chemistry"]');

  // ---------- 3) Tek oturum ----------
  await p.click('#dn-ystart'); await p.waitForSelector('#dn-exam');
  let st = await get(p, DKEY);
  ok(st.aktif && st.aktif.mod === 'yanlislar' && st.aktif.kod === 'yanlislar' && st.aktif.sureModu === 'suresiz' && JSON.stringify(st.aktif.sorular.map(x => x.k)) === JSON.stringify(SIRA) &&
    st.aktif.sorular.every(x => BY[x.k].denemeKodlari[0] === x.kod) && p.url().endsWith('deneme.html?mod=yanlislar'), '3) oturum: 6 soru, açık hatalar (ders → ünite sırası), her sorunun kendi ders kodu, süresiz', st.aktif && st.aktif.sorular);
  ok(await p.$('.dn-q-course') !== null && /geçti/.test(await p.textContent('#dn-timer')) && await p.$('.feedback-box, .option-btn.correct') === null, '3) sınav ekranı: ders etiketi, geçen süre, doğru/yanlış gösterilmez');
  const plan = ['c', 'c', 'c', 'w', null, 'c'];
  for (let i = 0; i < 3; i++) { await p.click(`#dn-stage .dn-opt[data-opt="${correctOf(SIRA[i])}"]`); await p.click('#dn-next'); }
  await p.reload(); await p.waitForSelector('#dn-exam');
  ok((await p.textContent('#dn-q-title')).trim() === 'Soru 4 / 6', '3) yenilemede yanlışlar oturumu kaldığı yerden sürüyor (Soru 4 / 6)');
  await p.click(`#dn-stage .dn-opt[data-opt="${wrongOf(SIRA[3])}"]`); await p.click('#dn-next'); await p.click('#dn-next');
  await p.click(`#dn-stage .dn-opt[data-opt="${correctOf(SIRA[5])}"]`);
  await p.click('#dn-review-open'); await p.click('#dn-submit'); await p.waitForSelector('.dn-stats');

  st = await get(p, DKEY); const e1 = await get(p, EKEY);
  const rec = st.gecmis[0];
  ok(rec.kod === 'yanlislar' && rec.mod === 'yanlislar' && rec.tahminiBand === null && rec.dogru === 4 && rec.yanlis === 1 && rec.bos === 1 && st.aktif === null, '3) kayıt: kod/mod yanlislar, bant yok, 4 doğru · 1 yanlış · 1 boş', rec);
  const durum = SIRA.map(k => { const q = BY[k], e = e1.items[q.sayfa.replace('.html', '') + '|' + q.id]; return [e.resolved, e.count, !!e.resolvedDate]; });
  ok(JSON.stringify(durum) === JSON.stringify([[true, 1, true], [true, 1, true], [true, 1, true], [false, 2, false], [false, 1, false], [true, 1, true]]) && e1.items['ap-physics|bankada_yok_q1'].resolved === false,
    '3) Hata Defteri: doğru 4 hata kapandı (resolvedDate), yanlış açık + count 2, boş değişmedi, bankada olmayan dokunulmadı', durum);
  const r1 = await p.evaluate(() => ({ son: document.getElementById('dn-y-sonuc').textContent, band: !!document.querySelector('.dn-band-num:not(.is-ok)'),
    ey: [...document.querySelectorAll('.dn-sonuc-eylem [data-eylem]')].map(a => a.dataset.eylem + '=' + (a.getAttribute('href') || '') + '=' + a.textContent.trim()),
    alt: [...document.querySelectorAll('.dn-result-actions a')].map(a => a.getAttribute('href')), konuSira: (() => { const s = document.querySelector('.dn-sonuc-eylem'), st2 = document.querySelector('.dn-stats'); return !!(st2.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING); })() }));
  const kap = BY[SIRA[4]].kap;
  ok(/4 hata kapandı/.test(r1.son) && /2 hata açık kaldı/.test(r1.son) && !r1.band, '3) sonuç: "4 hata kapandı · 2 hata açık kaldı" (tahmini bant yerine)', r1.son);
  ok(r1.ey[0] === 'yanlislar=deneme.html?mod=yanlislar=Yanlışlarımı tekrar çöz (2)' && r1.ey[1].startsWith('konu=ap-chemistry.html#konu-' + kap + '=Konu anlatımı: Unit 1') && r1.ey[2] === 'bugun=index.html=Bugün’e dön' && r1.konuSira && r1.alt[0] === 'deneme.html?mod=yanlislar',
    '3) eylemler: Yanlışlarımı tekrar çöz (2) · Konu anlatımı (en zayıf ünite: Chemistry Unit 1) · Bugün’e dön; özetin hemen altında', r1);
  await p.screenshot({ path: path.join(SHOTS, 't14-A7-yanlislar-sonuc-1280-light.png'), fullPage: true });
  await p.click('#dn-se-incele'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.activeElement.id === 'dn-rev-title' && Math.abs(document.getElementById('dn-rev-title').getBoundingClientRect().top) < 120) && p.url().includes('sonuc='), '3) "Soru soru incele" incelemeye kaydırır ve odaklar (sayfa yeniden çizilmez)');

  // ---------- 4) Konu anlatımına dön → ünitenin anlatım başlığı ----------
  await p.route(/mathjax|tex-svg/i, r => r.abort());
  await p.click('.dn-sonuc-eylem a[data-eylem="konu"]'); await p.waitForURL(/ap-chemistry\.html#konu-/); await p.waitForTimeout(1500);
  const kh = await p.evaluate(k => { const h = document.querySelector('[data-konu-hedef]'), c = document.getElementById(k); return h ? { tag: h.tagName, t: h.textContent.trim().slice(0, 70), once: !!(h.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING), top: Math.round(h.getBoundingClientRect().top), odak: document.activeElement === h } : null; }, kap);
  ok(kh && kh.tag === 'H2' && !/Soru İstasyonu/i.test(kh.t) && /Unit 1/.test(kh.t) && kh.once && kh.top >= 0 && kh.top < 300 && kh.odak, '4) Konu anlatımına dön: soru istasyonundan önceki ünite anlatım başlığı görünür ve odakta (' + (kh && kh.t) + ')', kh);

  // ---------- 5) Kalanları da çöz → hepsi kapandı ----------
  await p.goto(URL('deneme.html?mod=yanlislar')); await p.waitForSelector('#dn-yform');
  ok(/\(2 soru\)/.test(await p.textContent('#dn-ystart')), '5) mod yeniden: yalnız açık kalan 2 hata');
  await p.click('#dn-ystart'); await p.waitForSelector('#dn-exam');
  st = await get(p, DKEY);
  for (let i = 0; i < st.aktif.sorular.length; i++) { await p.click(`#dn-stage .dn-opt[data-opt="${correctOf(st.aktif.sorular[i].k)}"]`); if (i < st.aktif.sorular.length - 1) await p.click('#dn-next'); }
  await p.click('#dn-review-open'); await p.click('#dn-submit'); await p.waitForSelector('.dn-stats');
  const e2 = await get(p, EKEY);
  ok(SIRA.every(k => e2.items[BY[k].sayfa.replace('.html', '') + '|' + BY[k].id].resolved === true) && await p.isVisible('.dn-sonuc-eylem [data-eylem="yanlislar-yok"]') && !(await p.$('.dn-sonuc-eylem a[data-eylem="yanlislar"]')),
    '5) iki doğru → 6 hatanın hepsi kapandı; sonuçta "Açık hatan kalmadı" (yanlış düğmesi yok)');
  await p.goto(URL('deneme.html?mod=yanlislar')); await p.waitForSelector('#dn-yanlis-bos');
  ok((await p.textContent('#dn-yanlis-bos h2')) === 'Açık hataların deneme havuzunda değil' && await p.getAttribute('#dn-yanlis-bos a.btn-primary', 'href') === 'ilerleme.html#hata-title', '5) yalnız bankada olmayan hata kaldı → Hata Defteri’ne yönlendirme');

  // ---------- 6) Normal deneme: yarım deneme uyarısı + "Yanlış N soruyu şimdi çöz" (&deneme=) ----------
  await p.goto(URL('deneme.html?ders=physics-1')); await p.waitForSelector('#dn-setup');
  await p.check('input[name="adet"][value="10"]'); await p.check('input[name="sure"][value="suresiz"]');
  await p.click('#dn-start'); await p.waitForSelector('#dn-exam');
  await p.goto(URL('deneme.html?mod=yanlislar')); await p.waitForSelector('#dn-exam');
  ok(await p.isVisible('#dn-y-once') && !(await p.$('#dn-yform')), '6) yarım deneme varken Yanlışlarım: önce o deneme + uyarı (tek aktif deneme)');
  for (let i = 0; i < 10; i++) { await p.keyboard.press('a'); if (i < 9) await p.keyboard.press('ArrowRight'); }
  await p.click('#dn-review-open'); await p.click('#dn-submit'); await p.waitForSelector('.dn-stats');
  st = await get(p, DKEY);
  const r2 = st.gecmis[0], beklenenY = r2.inceleme.filter(it => correctOf(it.k) !== 'A').length;
  const ey2 = await p.evaluate(() => [...document.querySelectorAll('.dn-sonuc-eylem [data-eylem]')].map(a => a.dataset.eylem + '=' + (a.getAttribute('href') || '') + '=' + a.textContent.trim()));
  if (beklenenY) {
    ok(ey2[0] === 'yanlislar=deneme.html?mod=yanlislar&deneme=' + encodeURIComponent(r2.id) + '=Yanlış ' + beklenenY + ' soruyu şimdi çöz' && r2.tahminiBand !== null && /^konu=ap-physics\.html#konu-/.test(ey2[1]), '6) normal deneme sonucu: "Yanlış ' + beklenenY + ' soruyu şimdi çöz" (bu denemenin yanlışları), Konu anlatımı Physics', ey2);
    await p.click('.dn-sonuc-eylem a[data-eylem="yanlislar"]'); await p.waitForSelector('#dn-yform');
    ok((await p.textContent('#dn-h1')) === 'Bu denemenin yanlışlarını çöz' && new RegExp('\\(' + beklenenY + ' soru\\)').test(await p.textContent('#dn-ystart')), '6) &deneme= ile yalnız o denemenin ' + beklenenY + ' açık yanlışı (1 tık)');
  } else ok(ey2[0] && ey2[0].startsWith('yanlislar-yok'), '6) normal deneme: yanlış yok → Açık hatan kalmadı', ey2);

  // ---------- 7) Bugün / Çalış / İlerleme bağlantıları → mod (G5: 1 tık + Başlat) ----------
  await p.goto(URL('index.html')); await p.waitForTimeout(500);
  const bag = { bugun: await p.getAttribute('#dv-yanlis', 'href') };
  await p.click('#dv-yanlis'); await p.waitForSelector('#dn-yform, #dn-yanlis-bos');
  bag.acildi = p.url().endsWith('deneme.html?mod=yanlislar');
  await p.goto(URL('calis.html')); await p.waitForTimeout(400); bag.calis = await p.getAttribute('#co-yanlis', 'href');
  await p.goto(URL('ilerleme.html')); await p.waitForTimeout(400); bag.ilerleme = await p.getAttribute('#err-oturum', 'href');
  ok(bag.bugun === 'deneme.html?mod=yanlislar' && bag.acildi && bag.calis === bag.bugun && bag.ilerleme === bag.bugun, '7) Bugün (Yanlışlarım kartı), Çalış ve İlerleme → deneme.html?mod=yanlislar; Bugün’den 1 tıkla açılır', bag);

  // ---------- 8) 360 px açık / koyu ----------
  for (const sc of ['light', 'dark']) {
    const c2 = await b.newContext({ viewport: { width: 360, height: 780 }, colorScheme: sc });
    await c2.addInitScript(SEED); await c2.route(/^https?:/, r => { ag.push(r.request().url()); r.abort(); });
    const m = await c2.newPage(); m.on('pageerror', e => errs.push('360 ' + e.message)); m.on('dialog', d => d.accept());
    await m.goto(URL('deneme.html')); await set(m, EKEY, HATA);
    await m.goto(URL('deneme.html?mod=yanlislar')); await m.waitForSelector('#dn-yform');
    const b360 = await m.evaluate(() => { const r = document.getElementById('dn-ystart').getBoundingClientRect(); return { h: r.height, ov: document.documentElement.scrollWidth - innerWidth }; });
    ok(b360.ov <= 0 && b360.h >= 40, `8) 360 ${sc}: kurulum taşma yok, Başlat ${Math.round(b360.h)} px`, b360);
    await m.screenshot({ path: path.join(SHOTS, `t14-A7-yanlislar-kurulum-360-${sc}.png`), fullPage: true });
    await m.click('#dn-ystart'); await m.waitForSelector('#dn-exam'); await m.waitForTimeout(300);
    ok(await ov(m) <= 0, `8) 360 ${sc}: sınav ekranı taşma yok`);
    if (sc === 'light') await m.screenshot({ path: path.join(SHOTS, 't14-A7-yanlislar-sinav-360-light.png') });
    await m.click('#dn-review-open'); await m.click('#dn-submit'); await m.waitForSelector('.dn-sonuc-eylem');
    const s360 = await m.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, min: Math.min(...[...document.querySelectorAll('.dn-sonuc-eylem a, .dn-sonuc-eylem button')].map(x => x.getBoundingClientRect().height)), w: [...document.querySelectorAll('.dn-sonuc-eylem a')].every(a => a.getBoundingClientRect().width > 280) }));
    ok(s360.ov <= 0 && s360.min >= 44 && s360.w, `8) 360 ${sc}: sonuç eylemleri tam genişlik, ≥ 44 px, taşma yok`, s360);
    await m.screenshot({ path: path.join(SHOTS, `t14-A7-yanlislar-sonuc-360-${sc}.png`), fullPage: true });
    await m.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('apmeberra')).forEach(k => localStorage.removeItem(k)));
    await m.goto(URL('assets/css/styles.css')); await m.evaluate(() => localStorage.clear()).catch(() => {});
    await c2.close();
  }

  ok(errs.length === 0, 'sayfa hatası yok' + (errs.length ? ': ' + errs.join(' | ') : ''));
  ok(ag.filter(u => !/mathjax|jsdelivr/i.test(u)).length === 0, 'ağ isteği yok (yalnız mevcut MathJax CDN girişimi engellendi: ' + ag.length + ')', ag);
  // Test durumunu temizle
  await p.evaluate(() => localStorage.clear()).catch(() => {});
  await b.close();
  console.log(`\nSONUÇ: ${pass} geçti, ${fail} kaldı`);
  process.exitCode = fail ? 1 : 0;

  async function noFlow(pg, label) { const o = await ov(pg); ok(o <= 0, label + ': yatay taşma yok (' + o + ')'); }
})();
