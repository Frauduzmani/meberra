// Kod adı taşıma testi (Ajan 11, Tur 10, Aşama 4): eski "apazra" anahtarlarıyla tohumlanmış tarayıcıda hesap, profil,
// ilerleme, Hata Defteri, deneme geçmişi, rota işaretleri, FRQ yazımları, tema ve hesap kasaları korunuyor mu?
// Eski formatlı ("apazra-yedek") yedek dosyası kabul ediliyor mu? Çalıştır: node tasima-test.js
// Bu dosya bilinçli olarak eski anahtar adlarını içerir (araclar/ad-denetimi.js KOD_ADI_IZIN listesinde).
const { chromium } = require('playwright-core');
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (c || x === undefined ? '' : ' -> ' + JSON.stringify(x))); if (c) pass++; else fail++; };

const T = '2026-10-14T10:00:00.000Z';
const ESKI = {
  'apazra-hesap:v1:kullanicilar': JSON.stringify([
    { id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 1 },
    { id: 'u2', ad: 'İkinci', soyad: 'Kişi', kullaniciAdi: 'ikinci', salt: '00', hash: '00', iter: 1 }]),
  'apazra-hesap:v1:oturum': JSON.stringify({ id: 'utest', baslangic: T }),
  'apazra-hesap:v1:aktif': JSON.stringify('utest'),
  'apazra-hesap:v1:profil:utest': JSON.stringify({ okul: 'Eski Lise', sinif: 'mezun', ulkeler: ['de', 'it'], aktifRota: 'de', mezuniyetYili: '2026', hedefBaslangicYili: '2027', yerlesmeDurumu: 'yok', tamamlandi: true }),
  'apazra-hesap:v1:veri:u2': JSON.stringify({ kaydedildi: T, anahtarlar: { 'apazra:quiz:v1': JSON.stringify({ v: 1, pages: { 'ap-physics': { units: { u1: { total: 5, answers: { q1: { c: true, t: T } } } } } } }) } }),
  'apazra:theme': 'dark',
  'apazra:quiz:v1': JSON.stringify({ v: 1, pages: { 'ap-calculus': { units: { 'calc-unit1': { title: 'Limits', total: 10, answers: { q1: { c: true, t: T }, q2: { c: false, t: T } } } } } } }),
  'apazra:errors:v1': JSON.stringify({ items: { 'ap-calculus|q2': { page: 'ap-calculus', id: 'q2', topic: 'Limits', date: T, count: 1, resolved: false } } }),
  'apazra:deneme:v1': JSON.stringify({ v: 1, aktif: null, gecmis: [{ id: 'd1', kod: 'calc-ab', ad: 'AP Calculus AB', tarih: T, soruSayisi: 20, dogru: 15, yanlis: 5, bos: 0, yuzde: 75 }] }),
  'apazra:frq:v1': JSON.stringify({ v: 1, kayitlar: { synthesis: { metin: 'My thesis is that cities should invest in bike lanes.', guncelleme: T } } }),
  'apazra:rota:v1': JSON.stringify({ de: { adimlar: { 'de-hedef-program': { durum: 'yapildi', tarih: T } }, belgeler: {} }, it: { adimlar: {}, belgeler: {} } }),
  'apazra:panel:v1': JSON.stringify({ sinavlarim: ['ielts-academic'], universiteGoruldu: true })
};

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  // Tohum yalnızca ilk yüklemeden önce bir kez (sessionStorage bayrağı)
  await ctx.addInitScript(eski => {
    window.APMEBERRA_BUGUN = '2026-10-14';
    try { if (!sessionStorage.getItem('tohum')) { localStorage.clear(); Object.keys(eski).forEach(k => localStorage.setItem(k, eski[k])); sessionStorage.setItem('tohum', '1'); } } catch (e) {}
  }, ESKI);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL('index.html')); await p.waitForTimeout(500);
  const ls = () => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
  const s1 = await ls();
  const yeniAd = k => k.replace(/^apazra-hesap:/, 'apmeberra-hesap:').replace(/^apazra:/, 'apmeberra:');

  ok(!Object.keys(s1).some(k => /^apazra/.test(k)), 'eski apazra anahtarlarının hepsi silindi');
  ok(s1['apmeberra-tasima'] === '1', 'sürüm işareti apmeberra-tasima = 1');
  const kopya = Object.keys(ESKI).filter(k => !/:veri:/.test(k)).filter(k => s1[yeniAd(k)] !== ESKI[k]);
  ok(kopya.length === 0, 'tüm değerler yeni anahtarlara birebir kopyalandı (hesap, profil, ilerleme, hata, deneme, FRQ, rota, panel, tema)', kopya);
  const kasa = JSON.parse(s1['apmeberra-hesap:v1:veri:u2'] || '{}');
  ok(kasa.anahtarlar && Object.keys(kasa.anahtarlar).join() === 'apmeberra:quiz:v1', 'ikinci hesabın kasasındaki anahtar adları yeni öneke çevrildi', kasa.anahtarlar && Object.keys(kasa.anahtarlar));
  ok(await p.evaluate(() => window.APMEBERRA_TASIMA_SONUC && window.APMEBERRA_TASIMA_SONUC.tamam && window.APMEBERRA_TASIMA_SONUC.silinen === 12), 'taşıma sonucu: tamam, ' + Object.keys(ESKI).length + ' eski anahtarın hepsi (12) silindi', await p.evaluate(() => window.APMEBERRA_TASIMA_SONUC));
  const ui = await p.evaluate(() => ({
    url: location.pathname.split('/').pop(), hello: document.getElementById('today-title').textContent,
    pills: document.getElementById('hello-pills').textContent, theme: document.documentElement.getAttribute('data-theme'),
    nums: document.getElementById('home-nums').textContent, exam: document.getElementById('last-exam-body').textContent,
    rota: document.querySelector('.panel-rota-foot') ? document.querySelector('.panel-rota-foot').textContent : ''
  }));
  ok(ui.url === 'index.html' && ui.hello === 'Merhaba Test' && /Eski Lise/.test(ui.pills) && /Mezun/.test(ui.pills), 'oturum ve profil korundu (Panelim açık, okul ve mezun bilgisi)', ui);
  ok(ui.theme === 'dark', 'tema tercihi korundu (dark)');
  ok(/2 soru çözüldü · 1 doğru · 1 yanlış · 1 açık hata/.test(ui.nums), 'ilerleme ve Hata Defteri korundu: ' + ui.nums);
  ok(/AP Calculus AB/.test(ui.exam) && /%75/.test(ui.exam), 'deneme geçmişi korundu');
  ok(/^1 \/ \d+ adım yapıldı/.test(ui.rota.trim()), 'rota işareti korundu: ' + ui.rota.trim().slice(0, 30));
  // FRQ sayfası yeni anahtarı okuyor (ham değer korunuyor)
  await p.goto(URL('ap-english.html')); await p.waitForTimeout(500);
  ok((await p.evaluate(() => localStorage.getItem('apmeberra:frq:v1'))) === ESKI['apazra:frq:v1'], 'FRQ yazımları (apmeberra:frq:v1) korundu');
  // İkinci açılış: işaret varken hiçbir şey değişmez; çıkış/giriş takası yeni önekle çalışır
  const s2 = await ls();
  ok(JSON.stringify(Object.keys(s2).sort()) === JSON.stringify(Object.keys(s1).sort()), 'taşıma ikinci açılışta tekrar çalışmaz (anahtar kümesi aynı)');
  // Yeni anahtar zaten varsa üzerine yazılmaz
  await p.evaluate(() => { localStorage.removeItem('apmeberra-tasima'); localStorage.setItem('apazra:theme', 'light'); });
  await p.goto(URL('index.html')); await p.waitForTimeout(400);
  ok(await p.evaluate(() => localStorage.getItem('apmeberra:theme') === 'dark' && localStorage.getItem('apazra:theme') === null), 'yeni anahtar varsa eski değer üzerine yazılmaz, eski anahtar yine silinir');

  // Eski formatlı yedek dosyası kabul edilir
  const eskiYedek = JSON.stringify({ format: 'apazra-yedek', surum: 1, olusturma: T, anahtarlar: {
    'apazra:quiz:v1': { v: 1, pages: { 'ap-biology': { units: { b1: { total: 4, answers: { x1: { c: true, t: T } } } } } } },
    'apazra:theme': 'light' } });
  const r = await p.evaluate(txt => { try { const d = window.APMEBERRA.backup.parse(txt); return { ok: true, keys: Object.keys(d.anahtarlar), cozulen: d.ozet.cozulen }; } catch (e) { return { ok: false, e: e.userMessage || e.message }; } }, eskiYedek);
  ok(r.ok && r.keys.sort().join() === 'apmeberra:quiz:v1,apmeberra:theme' && r.cozulen === 1, 'eski formatlı yedek (apazra-yedek) okunur, anahtarlar yeni öneke çevrilir', r);
  const ap = await p.evaluate(txt => { const d = window.APMEBERRA.backup.parse(txt); window.APMEBERRA.backup.apply(d, 'merge'); const q = JSON.parse(localStorage.getItem('apmeberra:quiz:v1')); return { bio: !!q.pages['ap-biology'], calc: !!q.pages['ap-calculus'], eski: localStorage.getItem('apazra:quiz:v1') }; }, eskiYedek);
  ok(ap.bio && ap.calc && ap.eski === null, 'eski yedek birleştirilir: yeni ve mevcut ilerleme birlikte, eski anahtar yazılmaz', ap);
  const yabanci = await p.evaluate(() => { try { window.APMEBERRA.backup.parse(JSON.stringify({ format: 'baska', surum: 1, anahtarlar: {} })); return 'kabul'; } catch (e) { return 'red'; } });
  ok(yabanci === 'red', 'tanınmayan format yine reddedilir');
  ok(errs.length === 0, 'sayfa hatası yok', errs);
  await p.evaluate(() => localStorage.clear());
  await b.close();
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
