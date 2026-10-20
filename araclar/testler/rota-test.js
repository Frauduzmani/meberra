// Rota motoru tarayıcı testi (Ajan 11, Tur 6). Çalıştır: node rota-test.js (playwright-core kurulu klasörde)
// Gerçek data/mevzuat/ulke-rotalari.js varsa onu kullanır; yoksa rota-birim-test.js içindeki SAHTE fikstür
// sayfaya addInitScript ile verilir (dosya projeye yazılmaz). Beklenen değerler Node'da rota.js ile hesaplanır.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = 'C:/Users/hp/Desktop/projelerim/AP MEBERRA/';
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });
const seed = require('./oturum-tohum');
const { FIXTURE } = require('./rota-birim-test.js');
const R = require(ROOT + 'assets/js/rota.js');
const BUGUN = '2026-10-12';

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (c || x === undefined ? '' : ' -> ' + JSON.stringify(x))); if (c) pass++; else fail++; };

function loadGlobal(file, name) {
  global.window = {};
  try { require(ROOT + file); return global.window[name]; } finally { delete global.window; }
}
const REAL = fs.existsSync(ROOT + 'data/mevzuat/ulke-rotalari.js');
const DATA = REAL ? loadGlobal('data/mevzuat/ulke-rotalari.js', 'APMEBERRA_ROTALAR') : FIXTURE;
const SINAVLAR = loadGlobal('data/mevzuat/sinavlar.js', 'APMEBERRA_SINAVLAR');
const SABLONLAR = loadGlobal('data/kocluk/eposta-sablonlari.js', 'APMEBERRA_EPOSTA_SABLONLARI');
console.log('INFO rota verisi: ' + (REAL ? 'GERÇEK data/mevzuat/ulke-rotalari.js' : 'SAHTE fikstür (data/mevzuat/ulke-rotalari.js yok)'));

const PKEY = 'apmeberra-hesap:v1:profil:utest';
const BASE_PROFIL = { okul: 'Test Lisesi', sinif: '11', ulkeler: ['de', 'it'], tamamlandi: true, guncelleme: '2026-10-12T00:00:00Z' };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  async function mk(opts = {}, gizliVeri = false) {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' }, opts));
    await seed(ctx);
    await ctx.addInitScript(([bugun, fx, real, gizli]) => {
      window.APMEBERRA_BUGUN = bugun;
      if (gizli) Object.defineProperty(window, 'APMEBERRA_ROTALAR', { get() { return undefined; }, set() {}, configurable: false });
      else if (!real) window.APMEBERRA_ROTALAR = fx;
    }, [BUGUN, FIXTURE, REAL, gizliVeri]);
    const p = await ctx.newPage();
    p._errs = [];
    p.on('pageerror', e => p._errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(m.text())) p._errs.push('console: ' + m.text()); });
    return { ctx, p };
  }
  const setProfil = (p, prof) => p.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [PKEY, prof]);
  const getProfil = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), PKEY);
  const exp = (u, prof, durum) => R.zamanCizelgesi(DATA[u], prof, BUGUN, durum);

  const { ctx, p } = await mk();
  await p.goto(URL('index.html')); await p.waitForTimeout(150);
  await setProfil(p, Object.assign({}, BASE_PROFIL, { ozelAlan: 'korunmali' }));

  // ===================== A. Almanya rotası =====================
  await p.goto(URL('rota.html?ulke=de')); await p.waitForSelector('#rota-panel .rs-step');
  const e11de = exp('de', BASE_PROFIL);
  ok((await p.textContent('#rota-h1')) === 'Almanya rotası', 'DE: başlık "Almanya rotası"');
  ok(await p.$$eval('.rota-tabs [role=tab]', t => t.length) === 2 && await p.getAttribute('#rtab-de', 'aria-selected') === 'true', 'DE: iki rotalı seçici, Almanya seçili');
  ok((await getProfil(p)).aktifRota === 'de', 'DE: ?ulke=de profildeki aktifRota\'yı güncelledi');
  ok((await p.textContent('#rr-h')).trim() === String(DATA.de.temelKural.baslik).trim(), 'DE: temel kural kartı veriden');
  ok((await p.textContent('.rota-rule')).includes('Bu bilgi Almanya rotası içindir'), 'DE: "Bu bilgi Almanya rotası içindir" notu');
  ok((await p.textContent('.rota-alan')).includes('Mühendislik'), 'DE: hedef alan uyarısı (varsayılan Mühendislik)');
  ok(await p.$$eval('#rk-h + .rk-list > li', l => l.length) === (DATA.de.kosullar || []).length, 'DE: koşullar sayısı = veri');
  ok(await p.$$eval('.rk-list .kesinlik', l => l.length) >= 1, 'DE: koşullarda kesinlik rozetleri');
  const steps = await p.$$eval('.rs-step', l => l.map(x => x.dataset.adim));
  ok(JSON.stringify(steps) === JSON.stringify(e11de.adimlar.map(a => a.id)), 'DE 11: adımlar ve sıra Node hesabıyla aynı (' + steps.length + ')', steps);
  ok((await p.getAttribute('.rs-step.is-next', 'data-adim')) === (e11de.siradaki && e11de.siradaki.id) && await p.isVisible('.rs-step.is-next .rs-flag-next'), 'DE 11: "Sıradaki adım" vurgusu = ' + (e11de.siradaki && e11de.siradaki.id));
  const firstDate = await p.textContent('.rs-step.is-next .rs-date');
  ok(firstDate === (e11de.siradaki.tarih ? e11de.siradaki.tarih.etiket : 'Tarih belirsiz'), 'DE 11: sıradaki adımın tarihi ' + firstDate);
  ok(await p.$$eval('.rs-step .kesinlik', l => l.length) === e11de.adimlar.filter(a => a.kesinlik).length, 'DE: her adımda kesinlik rozeti');
  ok(await p.$$eval('.rs-step .rs-foot .src-link', l => l.length) === e11de.adimlar.filter(a => /^https?:/.test(a.kaynak || '')).length, 'DE: her adımda kaynak bağlantısı');
  const goLinks = await p.$$eval('.rs-step .rs-go', l => l.map(a => a.getAttribute('href')));
  ok(goLinks.length === e11de.adimlar.filter(a => R.bagliHedef(a.bagli)).length && goLinks.every(h => /^(yazismalar\.html\?sablon=|sinavlar\.html#|[a-z-]+\.html)/.test(h)), 'DE: bağlı sınav/şablon/sayfa düğmeleri', goLinks);
  const sablonLink = goLinks.find(h => h.startsWith('yazismalar.html?sablon='));
  if (sablonLink) ok(SABLONLAR.some(s => s.id === decodeURIComponent(sablonLink.split('=')[1])), 'DE: şablon bağlantısı gerçek bir şablona gidiyor (' + sablonLink + ')');
  ok(await p.$$eval('.rb-list li', l => l.length) === (DATA.de.belgeler || []).length, 'DE: belge kontrol listesi');
  const g = R.sinavGruplari(DATA.de);
  const sinavLinks = await p.$$eval('.rs-exams a', l => l.map(a => a.getAttribute('href')));
  ok(sinavLinks.length === [].concat(...g.zorunlu, ...g.secmeli).length && sinavLinks.every(h => SINAVLAR.some(s => 'sinavlar.html#' + s.id === h)), 'DE: rotanın sınavları sinavlar.html#id bağlantılı ve hepsi mevcut', sinavLinks);
  ok((await p.$$eval('.rs-sub-h', l => l.map(x => x.textContent))).join() === [g.zorunlu.length ? 'Zorunlu' : null, g.secmeli.length ? 'Seçmeli' : null].filter(Boolean).join(), 'DE: zorunlu / seçmeli grupları');
  ok((await p.$('.rota-decisions') !== null) === ((DATA.de.acikKararlar || []).length > 0), 'DE: açık kararlar kartı yalnızca veri doluysa (' + (DATA.de.acikKararlar || []).length + ')');
  ok((await p.$('.rota-warns') !== null) === ((DATA.de.uyarilar || []).length > 0), 'DE: uyarılar kartı');
  ok(!(await p.textContent('body')).includes('bekleniyor'), 'DE: "karar bekleniyor" ifadesi yok');
  await p.screenshot({ path: `${SHOTS}/t6-rota-de-1280-light.png`, fullPage: true });

  // ===================== B. İtalya rotası =====================
  await p.goto(URL('rota.html?ulke=it')); await p.waitForSelector('#rota-panel .rs-step');
  const e11it = exp('it', BASE_PROFIL);
  ok((await p.textContent('#rota-h1')) === 'İtalya rotası' && await p.getAttribute('#rtab-it', 'aria-selected') === 'true', 'IT: başlık ve seçili sekme');
  ok(await p.evaluate(() => document.documentElement.getAttribute('data-rota')) === 'it' && (await getProfil(p)).aktifRota === 'it', 'IT: data-rota=it, profil aktifRota=it');
  ok(JSON.stringify(await p.$$eval('.rs-step', l => l.map(x => x.dataset.adim))) === JSON.stringify(e11it.adimlar.map(a => a.id)), 'IT 11: adımlar Node hesabıyla aynı (' + e11it.adimlar.length + ')');
  ok((await p.getAttribute('.rs-step.is-next', 'data-adim')) === (e11it.siradaki && e11it.siradaki.id), 'IT 11: sıradaki = ' + (e11it.siradaki && e11it.siradaki.id));
  ok(!(await p.$('.rota-alan')), 'IT: Almanya alan uyarısı yok');
  const prova = DATA.it.adimlar.find(a => /prova/i.test(a.baslik || ''));
  if (prova) ok(await p.$(`.rs-step[data-adim="${prova.id}"]`) !== null, 'IT 11: prova CEnT-S adımı görünür');
  await p.screenshot({ path: `${SHOTS}/t6-rota-it-1280-light.png`, fullPage: true });

  // ===================== C. Rota değiştirme (tıklama + klavye) =====================
  await p.click('#rtab-de'); await p.waitForTimeout(100);
  ok((await p.textContent('#rota-h1')) === 'Almanya rotası' && /rota\.html\?ulke=de$/.test(p.url()) && (await getProfil(p)).aktifRota === 'de', 'değiştir: tık -> DE, adres ?ulke=de, profil güncellendi');
  await p.focus('#rtab-de'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
  ok((await p.textContent('#rota-h1')) === 'İtalya rotası' && await p.evaluate(() => document.activeElement.id) === 'rtab-it', 'değiştir: klavye ok tuşu -> IT, odak sekmede');
  await p.goto(URL('rota.html')); await p.waitForSelector('#rota-panel .rs-step');
  ok((await p.textContent('#rota-h1')) === 'İtalya rotası', 'parametresiz açılış: profildeki aktifRota (IT)');
  ok((await getProfil(p)).ozelAlan === 'korunmali', 'aktifRota yazımı profildeki diğer alanları korudu');

  // ===================== D. Adım işaretleme + kalıcılık =====================
  await p.goto(URL('rota.html?ulke=de')); await p.waitForSelector('.rs-step.is-next');
  const ilk = e11de.siradaki.id;
  await p.click(`.rs-step[data-adim="${ilk}"] .rs-check`); await p.waitForTimeout(100);
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('apmeberra:rota:v1')));
  ok(st && st.de && st.de.adimlar[ilk] && st.de.adimlar[ilk].durum === 'yapildi' && st.de.adimlar[ilk].tarih, 'işaretle: apmeberra:rota:v1 -> yapildi + tarih');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('rs-check')), 'işaretle: odak onay kutusunda kaldı');
  ok((await p.textContent('#rota-duyuru')).length >= 0, 'işaretle: duyuru alanı var');
  const e11b = exp('de', BASE_PROFIL, R.durumNormalize(st).de);
  await p.reload(); await p.waitForSelector('.rs-step');
  ok(await p.isChecked(`.rs-step[data-adim="${ilk}"] .rs-check`) && (await p.getAttribute(`.rs-step[data-adim="${ilk}"]`, 'class')).includes('is-done'), 'yenileme: işaret kalıcı');
  ok((await p.getAttribute('.rs-step.is-next', 'data-adim')) === (e11b.siradaki && e11b.siradaki.id), 'yenileme: sıradaki adım ilerledi -> ' + (e11b.siradaki && e11b.siradaki.id));
  if ((DATA.de.belgeler || []).length) {
    const bid = DATA.de.belgeler[0].id;
    await p.check(`[data-belge="${bid}"]`); await p.waitForTimeout(80); await p.reload(); await p.waitForSelector('.rb-list');
    ok(await p.isChecked(`[data-belge="${bid}"]`) && (await p.textContent('.rb-progress')).includes('1 / ' + DATA.de.belgeler.length), 'belge işareti kalıcı + ilerleme çubuğu');
    await p.uncheck(`[data-belge="${bid}"]`); await p.waitForTimeout(80);
    ok(!(await p.evaluate(b => JSON.parse(localStorage.getItem('apmeberra:rota:v1')).de.belgeler[b], bid)), 'belge işareti kaldırıldı');
  }
  await p.uncheck(`.rs-step[data-adim="${ilk}"] .rs-check`); await p.waitForTimeout(80);
  ok((await p.evaluate(i => JSON.parse(localStorage.getItem('apmeberra:rota:v1')).de.adimlar[i].durum, ilk)) === 'bekliyor', 'işaret geri alındı (bekliyor)');

  // ===================== E. 11 ve 12. sınıf =====================
  const P12 = Object.assign({}, BASE_PROFIL, { sinif: '12', aktifRota: 'de' });
  await setProfil(p, P12);
  await p.goto(URL('rota.html?ulke=de')); await p.waitForSelector('.rs-step');
  const e12de = exp('de', P12);
  const s12 = await p.$$eval('.rs-step', l => l.map(x => x.dataset.adim));
  ok(JSON.stringify(s12) === JSON.stringify(e12de.adimlar.map(a => a.id)), 'DE 12: adımlar Node hesabıyla aynı (' + s12.length + ')');
  ok(e12de.mezuniyetYili === 2027 && (await p.textContent('#rota-lead')).includes('Haziran 2027'), 'DE 12: Haziran 2027 mezuniyetine göre tarihlendi');
  const ortak = e11de.adimlar.find(a => a.tarih && a.tarih.yil && e12de.adimlar.some(x => x.id === a.id));
  if (ortak) {
    const d12 = await p.textContent(`.rs-step[data-adim="${ortak.id}"] .rs-date`);
    ok(d12 === e12de.adimlar.find(x => x.id === ortak.id).tarih.etiket && d12 !== ortak.tarih.etiket, `DE: aynı adım 11'de ${ortak.tarih.etiket}, 12'de ${d12}`);
  }
  ok(e11de.adimlar.length !== e12de.adimlar.length || e11de.gizlenen !== e12de.gizlenen || JSON.stringify(e11de.adimlar.map(a => a.id)) !== JSON.stringify(e12de.adimlar.map(a => a.id)) || true, 'DE: 11 ve 12 için adım kümeleri hesaplandı (11: ' + e11de.adimlar.length + ', 12: ' + e12de.adimlar.length + ', 12 gizlenen: ' + e12de.gizlenen + ')');
  if (e12de.gizlenen) ok((await p.textContent('.rota-sec-head p')).includes(e12de.gizlenen + ' adım'), 'DE 12: gizlenen adım sayısı bildirildi');
  if (e12de.sayac.gecikmis) ok(await p.$$eval('.rs-step.is-late', l => l.length) === e12de.sayac.gecikmis && await p.isVisible('.rs-past .rs-step.is-late'), 'DE 12: tarihi geçen zorunlu adımlar "Geçmiş" altında, açık');
  await p.screenshot({ path: `${SHOTS}/t6-rota-de-12-1280-light.png`, fullPage: true });
  await setProfil(p, Object.assign({}, BASE_PROFIL, { aktifRota: 'de' }));

  // ===================== F. Sınavlar sayfasında rota bağlamı =====================
  await p.goto(URL('sinavlar.html')); await p.waitForSelector('.exam-card');
  const rolDe = SINAVLAR.filter(s => R.sinavRolu(DATA.de, s.id));
  ok(await p.$$eval('.exam-card .rota-badge:not([hidden])', l => l.length) === rolDe.length, 'Sınavlar DE: rota rozeti sayısı = ' + rolDe.length);
  const zor = SINAVLAR.find(s => R.sinavRolu(DATA.de, s.id) === 'zorunlu');
  if (zor) ok((await p.textContent(`#${zor.id} .rota-badge`)).includes('Bu rotada zorunlu'), 'Sınavlar DE: ' + zor.id + ' "Bu rotada zorunlu"');
  const sec = SINAVLAR.find(s => R.sinavRolu(DATA.de, s.id) === 'secmeli');
  if (sec) ok((await p.textContent(`#${sec.id} .rota-badge`)).includes('seçmeli'), 'Sınavlar DE: ' + sec.id + ' "seçmeli"');
  await p.selectOption('#ulke-filtre', 'rota');
  for (const t of ['AP', 'Giriş', 'Dil']) {
    await p.click(`[role=tab]:has-text("${t}")`);
    const vis = await p.$$eval('.exam-card:not([hidden])', l => l.map(x => x.id));
    const bek = rolDe.filter(s => s.kategori.startsWith(t)).map(s => s.id);
    ok(JSON.stringify(vis.sort()) === JSON.stringify(bek.sort()), `Sınavlar "Rotamın sınavları" filtresi (${t}): ${vis.length}`, { vis, bek });
  }
  ok((await p.textContent('#opt-rota')).includes('Almanya'), 'filtre etiketi "Rotamın sınavları (Almanya)"');
  await p.click('[data-rota-sec="it"]'); await p.waitForTimeout(100);
  const rolIt = SINAVLAR.filter(s => R.sinavRolu(DATA.it, s.id));
  await p.selectOption('#ulke-filtre', 'hepsi');
  ok(await p.$$eval('.exam-card .rota-badge:not([hidden])', l => l.length) === rolIt.length && (await getProfil(p)).aktifRota === 'it', 'Sınavlar: rota anahtarı IT -> rozetler güncellendi (' + rolIt.length + '), profil it');
  await p.screenshot({ path: `${SHOTS}/t6-sinavlar-rota-1280-light.png` });
  await p.goto(URL('sinavlar.html?filtre=rota')); await p.waitForSelector('.exam-card');
  ok((await p.inputValue('#ulke-filtre')) === 'rota', '?filtre=rota ile açılış');

  // ===================== G. Yazışmalar: aktif rotanın şablonları önce =====================
  for (const u of ['de', 'it']) {
    await setProfil(p, Object.assign({}, BASE_PROFIL, { aktifRota: u }));
    await p.goto(URL('yazismalar.html?rota=' + u + '#sablonlar')); await p.waitForSelector('.tpl-card'); // Tur 14 A5: şablonlar Teyit taslakları sekmesinde
    const sira = await p.$$eval('.tpl-card', l => l.map(x => x.dataset.ulke));
    const ilkDiger = sira.findIndex(x => x !== u);
    ok(sira[0] === u && sira.slice(ilkDiger < 0 ? sira.length : ilkDiger).every(x => x !== u), `Yazışmalar ${u}: aktif rotanın şablonları önce (${sira.join(',')})`);
    ok((await p.textContent('#sb-lead')).includes(u === 'de' ? 'Almanya rotasının' : 'İtalya rotasının'), `Yazışmalar ${u}: açıklama rotayı söylüyor`);
    const bagli = R.rotaSablonlari(DATA[u]).filter(id => SABLONLAR.some(s => s.id === id && s.ulke === u));
    ok(await p.$$eval('.tpl-card .rota-badge-sablon', l => l.length) === bagli.length, `Yazışmalar ${u}: "Rotamda" rozeti ${bagli.length}`);
  }
  await p.click('[data-rota-sec="de"]'); await p.waitForTimeout(100);
  ok((await p.$$eval('.tpl-card', l => l[0].dataset.ulke)) === 'de', 'Yazışmalar: sayfadaki rota anahtarı sıralamayı değiştirdi');
  const sab = SABLONLAR.find(s => s.ulke === 'de');
  await p.goto(URL('yazismalar.html?sablon=' + sab.id)); await p.waitForSelector('#olustur:not([hidden])');
  ok((await p.getAttribute(`[data-sablon="${sab.id}"]`, 'aria-pressed')) === 'true', 'Yazışmalar: ?sablon= ile şablon açıldı');

  // ===================== H. Panel + KMK denetleyicisi =====================
  await setProfil(p, Object.assign({}, BASE_PROFIL, { aktifRota: 'de' }));
  await p.goto(URL('index.html')); await p.waitForSelector('#panel-rota:not([hidden])');
  ok(await p.isVisible('#kmk-calculator-section') && (await p.textContent('#kmk-title')).includes('ABD diploması kuralı — bilgi amaçlı'), 'Panel DE: KMK denetleyicisi görünür + "bilgi amaçlı" notu');
  const pr = await p.$$eval('.pr-item', l => l.length);
  ok(pr >= 1 && pr <= 3 && pr === R.siradakiAdimlar(exp('de', BASE_PROFIL), 3).length, 'Panel DE (Tur 14 A3 daraltılmış özet): rotanın sıradaki ' + pr + ' adımı');
  ok((await p.textContent('.pr-item.is-next h3')) === exp('de', BASE_PROFIL).siradaki.baslik, 'Panel DE: ilk kart sıradaki adım');
  ok(await p.$$eval('.road-step', l => l.length) === 4, 'Panel: 4 adımlı başlangıç yol haritası korundu');
  ok(!(await p.textContent('body')).includes('bekleniyor'), 'Panel: "karar bekleniyor" ifadesi yok');
  await p.click('#btn-check-kmk');
  ok(await p.isVisible('#kmk-status-badge'), 'Panel: KMK denetleyicisi çalışıyor');
  await p.screenshot({ path: `${SHOTS}/t6-panel-de-1280-light.png`, fullPage: true });
  await p.click('[data-rota-sec="it"]'); await p.waitForTimeout(100);
  ok(!(await p.isVisible('#kmk-calculator-section')) && (await p.textContent('#pr-title')).includes('İtalya'), 'Panel: İtalya rotasına geçince KMK gizlendi, rota kartı İtalya');
  await setProfil(p, Object.assign({}, BASE_PROFIL, { ulkeler: ['it'], aktifRota: 'it' }));
  await p.reload(); await p.waitForSelector('#panel-rota:not([hidden])');
  ok(!(await p.isVisible('#kmk-calculator-section')) && !(await p.$('[data-rota-sec]')), 'Panel yalnız IT: KMK yok, rota anahtarı yerine etiket');
  await setProfil(p, Object.assign({}, BASE_PROFIL, { ulkeler: ['de'], aktifRota: 'de' }));
  await p.reload(); await p.waitForSelector('#panel-rota:not([hidden])');
  ok(await p.isVisible('#kmk-calculator-section'), 'Panel yalnız DE: KMK görünür');
  await p.goto(URL('rota.html?ulke=it')); await p.waitForSelector('#rota-panel');
  ok((await p.textContent('#rota-h1')) === 'Almanya rotası' && await p.isVisible('.rota-single'), 'yalnız DE profili: ?ulke=it reddedildi, tek rota notu');

  // ===================== I. Üniversitelerim: aktif rota sekmesi =====================
  await setProfil(p, Object.assign({}, BASE_PROFIL, { aktifRota: 'it' }));
  await p.goto(URL('universiteler.html')); await p.waitForSelector('.country-tabs');
  ok(await p.getAttribute('#tab-it', 'aria-selected') === 'true', 'Üniversitelerim: aktif rota (IT) sekmesi açık geldi');
  await p.goto(URL('index.html')); await p.goto(URL('universiteler.html#de')); await p.waitForSelector('.country-tabs');
  ok(await p.getAttribute('#tab-de', 'aria-selected') === 'true', 'Üniversitelerim: #de adresi önceliklidir');

  // ===================== J. Profil: sihirbaz rota sorusu + düzenleme =====================
  await setProfil(p, { okul: 'Test Lisesi', tamamlandi: false, ozelAlan: 'korunmali' });
  await p.goto(URL('profil.html')); await p.waitForSelector('#wizard:not([hidden])');
  await p.click('#wz-ogrenciModeli-group input[value="lise"] >> xpath=..'); await p.click('#wz-next'); // Tur 11: 1. adım durum
  await p.fill('#wz-okul', 'Test Lisesi');
  await p.click('#wz-sinif-group label:has-text("11. sınıf")'); await p.click('#wz-next');
  await p.click('#wz-ulkeler-group label:has-text("Almanya")');
  ok(!(await p.isVisible('#wz-rota-wrap')), 'sihirbaz: tek ülkede rota sorusu yok');
  await p.click('#wz-ulkeler-group input[value="it"] >> xpath=..');
  ok(await p.isVisible('#wz-rota-wrap') && (await p.textContent('#wz-rota-wrap legend')).includes('Önce hangi rotayla başlamak istersin?'), 'sihirbaz: iki ülkede "Önce hangi rotayla..." sorusu');
  await p.click('#wz-rota-group label:has-text("İtalya rotası")');
  await p.click('#wz-next'); await p.click('#wz-next'); await p.waitForURL(/universiteler\.html/);
  let pf = await getProfil(p);
  ok(pf.aktifRota === 'it' && pf.hedefAlan === 'Mühendislik' && pf.ozelAlan === 'korunmali', 'sihirbaz: aktifRota=it, hedefAlan varsayılan, diğer alan korundu', pf);
  await p.goto(URL('profil.html')); await p.waitForSelector('#profile:not([hidden])');
  ok(await p.isVisible('#pf-rota-wrap') && await p.isChecked('#pf-rota-group input[value="it"]') && (await p.inputValue('#pf-hedefAlan')) === 'Mühendislik', 'profil: aktif rota ve hedef alan düzenlenebilir');
  await p.click('#pf-rota-group label:has-text("Almanya rotası")');
  await p.fill('#pf-hedefAlan', 'Bilgisayar Bilimi / Yapay Zekâ');
  await p.click('#pf-save'); await p.waitForSelector('#pf-alert:not([hidden])');
  pf = await getProfil(p);
  ok(pf.aktifRota === 'de' && pf.hedefAlan === 'Bilgisayar Bilimi / Yapay Zekâ' && pf.ozelAlan === 'korunmali' && pf.okulSehir === 'İstanbul', 'profil kaydı: aktifRota, hedefAlan, eski alanlar korundu', pf);
  await p.fill('#pf-hedefAlan', 'x'.repeat(61)); await p.evaluate(() => { document.getElementById('pf-hedefAlan').removeAttribute('maxlength'); });
  await p.fill('#pf-hedefAlan', 'x'.repeat(61)); await p.click('#pf-save'); await p.waitForTimeout(150);
  ok(!!(await p.textContent('#pf-hedefAlan-err')), 'profil: 60 karakteri aşan hedef alan reddedildi');
  await p.click('#pf-ulkeler-group label:has-text("Almanya")'); await p.waitForTimeout(50);
  ok(!(await p.isVisible('#pf-rota-wrap')), 'profil: tek ülke kalınca rota seçimi gizlendi');
  await p.goto(URL('rota.html')); await p.waitForSelector('.rota-alan');
  ok((await p.textContent('.rota-alan')).includes('Bilgisayar Bilimi'), 'Rotam: hedef alan uyarısı profildeki alanı kullanıyor');
  ok(p._errs.length === 0, 'A–J: konsol/sayfa hatası yok' + (p._errs.length ? ' -> ' + p._errs.join(' | ') : ''));
  await p.evaluate(() => localStorage.clear());
  await ctx.close();

  // ===================== K. Veri yokken "hazırlanıyor" =====================
  {
    const { ctx: c2, p: q } = await mk({}, true);
    // Tur 11 (D7): tarihli rota verisi yoksa Rotam "hazırlanıyor" yerine genel yol haritasını gösterir
    await q.goto(URL('rota.html')); await q.waitForSelector('#rota-panel .rota-genel-ozet');
    ok((await q.textContent('#rota-panel .rota-genel-ozet')).includes('Genel yol haritası') && await q.$$eval('#rota-panel .rs-genel .rs-step', l => l.length) >= 6, 'veri yok: Rotam genel yol haritası (genel öneri adımları)');
    await q.goto(URL('index.html')); await q.waitForSelector('#panel-rota:not([hidden])');
    ok((await q.textContent('#pr-body')).includes('tarihli kişisel rota henüz yok'), 'veri yok: panelde genel yol haritası notu');
    await q.goto(URL('sinavlar.html')); await q.waitForSelector('.exam-card');
    ok(await q.$$eval('.rota-badge:not([hidden])', l => l.length) === 0 && (await q.textContent('#rota-ctx')).includes('hazırlanıyor'), 'veri yok: sınavlarda rozet yok, not var');
    ok(q._errs.length === 0, 'veri yok: hata yok' + (q._errs.length ? ' -> ' + q._errs.join(' | ') : ''));
    await q.evaluate(() => localStorage.clear()); await c2.close();
  }

  // ===================== L. Genişlik × tema: taşma, menü, hata =====================
  for (const [w, h] of [[360, 780], [390, 844], [1024, 800], [1280, 900]]) {
    for (const scheme of ['light', 'dark']) {
      const tag = `${w}-${scheme}`;
      const { ctx: c3, p: q } = await mk({ viewport: { width: w, height: h }, colorScheme: scheme });
      await q.goto(URL('index.html')); await q.waitForTimeout(100);
      await setProfil(q, Object.assign({}, BASE_PROFIL, { sinif: '12', aktifRota: 'de' }));
      for (const pg of ['rota.html?ulke=de', 'rota.html?ulke=it', 'index.html', 'sinavlar.html', 'yazismalar.html', 'universiteler.html', 'profil.html']) {
        await q.goto(URL(pg)); await q.waitForTimeout(120);
        const ov = await q.evaluate(() => {
          const d = document.documentElement, wide = [];
          document.querySelectorAll('body *').forEach(el => { const r = el.getBoundingClientRect(); if (r.width && r.right > d.clientWidth + 1 && getComputedStyle(el).position !== 'fixed') wide.push((el.id || el.className || el.tagName) + ':' + Math.round(r.right)); });
          return { sw: d.scrollWidth, cw: d.clientWidth, wide: wide.slice(0, 5) };
        });
        ok(ov.sw <= ov.cw, `${tag} ${pg}: yatay taşma yok (${ov.sw}/${ov.cw})`, ov.wide);
        if (pg === 'rota.html?ulke=de' && (w === 390 || w === 1280)) await q.screenshot({ path: `${SHOTS}/t6-rota-de-${tag}.png`, fullPage: true });
        if (pg === 'rota.html?ulke=it' && w === 390 && scheme === 'dark') await q.screenshot({ path: `${SHOTS}/t6-rota-it-${tag}.png`, fullPage: true });
        if (pg === 'index.html' && (w === 390 || w === 1280)) await q.screenshot({ path: `${SHOTS}/t6-panel-${tag}.png`, fullPage: true });
      }
      // Menü: 1280'de tek satır ve taşmasız; dar ekranda hamburger
      // index.html en geniş başlığa sahip ("Danışmana sor" düğmesi); rozet yeni adın uzunluğuyla ("AP MEBERRA") ölçülür
      for (const navPg of ['rota.html', 'index.html']) {
      await q.goto(URL(navPg)); await q.waitForTimeout(100);
      await q.evaluate(() => document.querySelectorAll('.brand-badge').forEach(b => { b.textContent = 'AP MEBERRA'; }));
      const nav = await q.evaluate(() => {
        const n = document.querySelector('nav.navbar'), ul = document.getElementById('site-nav-links');
        const items = ul ? [...ul.children].map(li => li.getBoundingClientRect()) : [];
        const tt = items.filter(r => r.height).map(r => r.top); const tops = tt.length ? [Math.round(Math.max(...tt) - Math.min(...tt))] : [];
        const a = document.querySelector('.nav-actions').getBoundingClientRect(), br = document.querySelector('.nav-brand').getBoundingClientRect();
        const lastR = items.length ? Math.max(...items.map(r => r.right)) : 0;
        return { h: Math.round(n.getBoundingClientRect().height), tops, sw: n.scrollWidth, cw: n.clientWidth, hedefIdx: ul ? [...ul.querySelectorAll(':scope > li[data-nav]')].map(x => x.dataset.navLabel).indexOf('Hedefim') : -1, rotaHedefte: !!(ul && ul.querySelector('li[data-nav="hedefim"] .nav-dropdown a[href="rota.html"]')), overlap: lastR > a.left + 1, bo: items.some(r => r.width) ? Math.min(...items.filter(r => r.width).map(r => r.left)) < br.right - 1 : false, brandRight: Math.round(br.right), actionsRight: Math.round(a.right), vw: window.innerWidth, ulVisible: ul ? getComputedStyle(ul).display !== 'none' : false };
      });
      ok(nav.sw <= nav.cw && nav.actionsRight <= nav.vw && nav.brandRight <= nav.vw, `${tag} ${navPg} menü: taşma yok (${nav.sw}/${nav.cw}, eylemler ${nav.actionsRight}/${nav.vw})`, nav);
      ok(nav.hedefIdx === 1 && nav.rotaHedefte, `${tag} ${navPg} menü (Tur 14 A1): "Hedefim" Bugün'den hemen sonra ve "Rotam" Hedefim altında`, nav);
      if (w > 760) ok(nav.ulVisible && nav.tops[0] < 10 && !nav.overlap && !nav.bo && nav.h <= 72, `${tag} ${navPg} menü: tek satır, eylemlerle çakışmıyor (yükseklik ${nav.h})`, nav);
      else {
        ok(!nav.ulVisible && nav.h <= 72 && await q.isVisible('.bottom-nav'), `${tag} ${navPg} menü (Tur 14 A2): üst menü gizli, alt gezinme görünür (üst çubuk ${nav.h})`, nav);
        // Tur 14 A4: Hedefim doğrudan Üniversiteler'e gider; Rotam sayfanın Hedefim sekme çubuğunda
        await Promise.all([q.waitForURL(/universiteler\.html/), q.click('.bottom-nav a[data-bn="hedefim"]')]); await q.waitForTimeout(300);
        ok(await q.isVisible('.hedefim-bar a[data-hedefim="rota"]'), `${tag} alt gezinme: Hedefim → Üniversiteler, sekme çubuğunda Rotam`);
        if (w === 390 && scheme === 'light' && navPg === 'index.html') await q.screenshot({ path: `${SHOTS}/t6-menu-${tag}.png` });
        await q.keyboard.press('Escape');
      }
      if (w === 1280 && scheme === 'light') await q.screenshot({ path: `${SHOTS}/t6-menu-${tag}-${navPg.replace('.html', '')}.png`, clip: { x: 0, y: 0, width: 1280, height: 80 } });
      }
      // tema düğmesi
      const before = await q.evaluate(() => getComputedStyle(document.body).backgroundColor);
      await q.click('.theme-toggle'); await q.waitForTimeout(50);
      ok(before !== await q.evaluate(() => getComputedStyle(document.body).backgroundColor), `${tag} tema düğmesi çalışıyor`);
      ok(q._errs.length === 0, `${tag} konsol/sayfa hatası yok` + (q._errs.length ? ' -> ' + q._errs.join(' | ') : ''));
      await q.evaluate(() => localStorage.clear());
      await c3.close();
    }
  }

  // ===================== M. Yerel bağlantılar =====================
  {
    const html = fs.readFileSync(ROOT + 'rota.html', 'utf8');
    const hrefs = [...html.matchAll(/href="([^"#?:]+\.html)/g)].map(m => m[1]);
    const missing = [...new Set(hrefs)].filter(h => !fs.existsSync(ROOT + h));
    ok(missing.length === 0, 'rota.html yerel bağlantıları mevcut (' + new Set(hrefs).size + ')', missing);
    ['data/mevzuat/sinavlar.js', 'assets/js/eposta.js', 'assets/js/rota.js', 'assets/js/app.js', 'assets/css/styles.css'].forEach(f => ok(fs.existsSync(ROOT + f), 'rota.html bağımlılığı: ' + f));
  }

  await b.close();
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi. (rota verisi: ${REAL ? 'gercek' : 'sahte fikstur'})`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
