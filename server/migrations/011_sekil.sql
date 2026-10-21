-- v1.13.0: Şekilli sorular (server/sekil.js; biçim araclar/yeni-sorular2/SEKIL-BICIMI.md).
-- Soru kökü şekli: JSON (null | {tur:"svg", svg, alt, baslik?, konum:"govde"|"aciklama"} | [en çok 4 tane]).
-- Şık şekilleri secenekler JSON'unda (secenekler[i].sekil). Saklanan SVG her zaman beyaz liste temizleyicisinden geçmiştir.
ALTER TABLE questions_bank ADD COLUMN sekil TEXT;
