"use strict";
// 1.23.0 konu modu: öğrenciye giden soru listesinde makinece okunur konu kodu (konuKod: "1.6") — ünite sayfası soruları konuya göre süzer.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { acikSoru, konuKodu, TOHUM } = require("../sorubankasi");

const T = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
const S = id => T.sorular.find(q => q.id === id);

test("konuKodu: cedKonu ya da konu metninden ilk N.M numarası", () => {
  assert.equal(konuKodu({ ek: { cedKonu: "1.6" } }), "1.6");
  assert.equal(konuKodu({ ek: { cedKonu: "Unit 1 · 1.6 Nucleic Acids" } }), "1.6");
  assert.equal(konuKodu({ ek: { cedKonu: "Micro Unit 5 · 5.4 Monopsony" } }), "5.4");
  assert.equal(konuKodu({ ek: {}, konu: "[BC ONLY] 6.11 Integrating Using Integration by Parts" }), "6.11");
  assert.equal(konuKodu({ ek: { cedKonu: "Skill Cat. 1 · 1.A Rhetorical situation" }, konu: "Rhetoric" }), null);
  assert.equal(konuKodu({}), null);
});

test("acikSoru konuKod taşır, cevap ve çözüm taşımaz", () => {
  const o = acikSoru(S("calc_u4_q6"));
  assert.equal(o.konuKod, "4.5");
  assert.equal(o.dogru, undefined);
  assert.equal(o.aciklama, undefined);
});

test("ders sorularının neredeyse tamamında konu kodu var (Calculus, Physics, Chemistry, Biology)", () => {
  for (const sayfa of ["ap-calculus", "ap-physics", "ap-chemistry", "ap-biology"]) {
    const L = T.sorular.filter(q => q.tur === "ders" && q.sayfa === sayfa && q.durum === "aktif");
    const kodlu = L.filter(q => konuKodu(q)).length;
    assert.ok(kodlu / L.length >= 0.97, sayfa + ": " + kodlu + "/" + L.length);
  }
});

// 1.25.0 A2 köprüsü: ek.neSoruyor (cevabı vermeyen Türkçe tek cümle) cevaptan önce de gönderilir; diğer ek alanları gönderilmez
test("acikSoru neSoruyor taşır; kavram/ipucu/sikHata taşımaz", () => {
  const q = JSON.parse(JSON.stringify(S("calc_u4_q6")));
  q.ek = Object.assign({}, q.ek, { neSoruyor: "Bir noktadaki anlık değişim hızını soruyor.", kavram: "gizli", ipucu: "gizli" });
  const o = acikSoru(q);
  assert.equal(o.neSoruyor, "Bir noktadaki anlık değişim hızını soruyor.");
  assert.ok(!JSON.stringify(o).includes("gizli"));
  const bos = JSON.parse(JSON.stringify(S("calc_u4_q6"))); delete bos.ek.neSoruyor;
  assert.equal(acikSoru(bos).neSoruyor, undefined, "alan yoksa gönderilmez");
});
