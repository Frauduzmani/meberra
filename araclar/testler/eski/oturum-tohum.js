// Eski regresyon testleri için: her sayfa yüklemesinden önce test oturumu açar (oturum koruması geçilsin).
module.exports = async function seed(ctxOrPage) {
  await ctxOrPage.addInitScript(() => {
    try {
      const P = 'apmeberra-hesap:v1:';
      if (!localStorage.getItem(P + 'oturum')) {
        localStorage.setItem(P + 'kullanicilar', JSON.stringify([{ id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 150000, olusturma: '2026-10-12T00:00:00Z' }]));
        localStorage.setItem(P + 'oturum', JSON.stringify({ id: 'utest', baslangic: '2026-10-12T00:00:00Z' }));
        localStorage.setItem(P + 'aktif', JSON.stringify('utest'));
        localStorage.setItem(P + 'profil:utest', JSON.stringify({ okul: 'Test Lisesi', sinif: '11', ulkeler: ['de', 'it'], tamamlandi: true, guncelleme: '2026-10-12T00:00:00Z' }));
      }
    } catch (e) {}
  });
};
