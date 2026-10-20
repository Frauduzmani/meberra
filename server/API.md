# Meberra API sözleşmesi (v1)

Sunucu: `node server/index.js` (Node.js 22.5+; yerleşik `node:sqlite`). Varsayılan port `3000`.
Tüm uç noktalar JSON alır/verir (`Content-Type: application/json`). Oturum, `meberra_sid` adlı
HttpOnly çerezle taşınır. Değiştiren isteklerde (POST/PUT/DELETE) `X-Meberra: 1` başlığı zorunludur (CSRF koruması).

Hata biçimi: `{ "ok": false, "error": "Türkçe mesaj", "errors": { "alan": "mesaj" } }` + uygun HTTP kodu
(400 doğrulama, 401 oturum yok, 403 yetki yok, 404, 409 çakışma, 429 çok fazla deneme).
Başarı: `{ "ok": true, ... }`.

## Genel
- `GET /api/health` → `{ ok, surum, zaman }`
- `GET /api/public/config` → `{ ok, marka, planlar:[{id,ad,fiyat,donem,aciklama,oneCikan}], para, ucretsiz:{uniteSayisi,dersDenemesi}, banka:{banka,iban,hesapSahibi,aciklamaNotu}, destekEposta }`

## Hesap
- `POST /api/auth/register` `{ ad, soyad, eposta, sifre, sifre2, kosullar:true, kvkk:true, veliOnay?:bool }`
  → `{ ok, user, profile:null, uyelik, state:{} }` + çerez
- `POST /api/auth/login` `{ kimlik, sifre }` (kimlik: e-posta ya da kullanıcı adı) → `{ ok, user, profile, uyelik, state }`
- `POST /api/auth/logout` → `{ ok }`
- `GET /api/me` → `{ ok, user, profile, uyelik }` (401: oturum yok)
- `PUT /api/profile` `{ profile }` → `{ ok, profile }`
- `POST /api/auth/password` `{ eski, yeni, yeni2 }`
- `POST /api/auth/forgot` `{ eposta }` → her zaman `{ ok:true }` (e-posta varsa sıfırlama bağlantısı gider)
- `POST /api/auth/reset` `{ token, yeni, yeni2 }`
- `GET /api/account/export` → kullanıcının tüm verisi (KVKK veri taşınabilirliği)
- `POST /api/account/delete` `{ sifre }` → hesap silinir (kişisel veriler anonimleştirilir)

`user` = `{ id, ad, soyad, kullaniciAdi, eposta, rol: "ogrenci"|"yonetici", olusturma }`
`uyelik` = `{ premium: bool, plan: "aylik"|"yillik"|null, bitis: ISO|null, bekleyenTalep: {id, plan, olusturma}|null }`

## Öğrenci verisi (tarayıcı deposu senkronu)
- `GET /api/state` → `{ ok, keys: { "<anahtar>": { deger: "<ham JSON dizesi>", guncelleme: ISO } } }`
- `PUT /api/state` `{ degisiklikler: { "<anahtar>": "<ham JSON dizesi>" | null } }`
  → `{ ok, birlesen: { "<anahtar>": "<sunucuda birleşmiş ham dize>" } }`
  Yalnızca `apmeberra:` ile başlayan anahtarlar kabul edilir. `apmeberra:quiz:v1` ve `apmeberra:errors:v1`
  sunucuda birleştirilir (cevap başına en yeni kazanır); diğerleri son yazan kazanır. Sunucu, ilerlemeyi
  `answers`, `wrong_answers`, `exams`, `level_tests` tablolarına da ayrıştırır.

## Premium (elle onay; havale/EFT)
- `GET /api/premium` → `{ ok, uyelik, talepler:[...] }`
- `POST /api/premium/talep` `{ plan: "aylik"|"yillik", odeyenAd, aciklama? }` → `{ ok, talep }`

## Yönetici (rol: yonetici)
- `GET /api/admin/stats` → `{ ok, kullanici:{toplam, son7gun, aktif7gun}, premium:{aktif, aylik, yillik}, talep:{bekleyen}, cevap:{toplam, son7gun}, gelirTahmini:{aylikTL} }`
- `GET /api/admin/users?q=&sayfa=1&premium=1` → `{ ok, toplam, sayfa, kullanicilar:[{id, ad, soyad, eposta, olusturma, sonGiris, durum, premium, plan, bitis, cevapSayisi}] }`
- `GET /api/admin/users/:id` → `{ ok, user, profile, uyelik, abonelikler:[...], talepler:[...], istatistik:{cevap, dogru, yanlisAcik, deneme, sonEtkinlik}, dersler:[{sayfa, cevap, dogru}] }`
- `POST /api/admin/users/:id/premium` `{ plan, gun?, not? }` → Premium verir (gun yoksa plana göre 30/365)
- `POST /api/admin/users/:id/premium/iptal` `{ not? }`
- `POST /api/admin/users/:id/durum` `{ durum: "aktif"|"askida" }`
- `GET /api/admin/talepler?durum=bekliyor` → `{ ok, talepler:[{id, kullanici:{id,ad,soyad,eposta}, plan, tutar, odeyenAd, aciklama, durum, olusturma}] }`
- `POST /api/admin/talepler/:id` `{ islem: "onayla"|"reddet", not? }`
- `GET /api/admin/audit?kullanici=&eylem=&sayfa=1` → `{ ok, toplam, kayitlar:[{id, zaman, kullanici, yapan, eylem, varlik, varlikId, ip, ayrinti}] }`

## Sayfalar
Sunucu proje kökündeki statik sayfaları da sunar. HTML yanıtlarına `<meta name="meberra-api" content="1">`
eklenir; istemci bu etiketi görünce sunucu modunda çalışır (yoksa eski tarayıcı-içi mod).
