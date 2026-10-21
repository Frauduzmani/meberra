# Şekilli soru biçimi (1.13.0)

Soru (ve gerekirse şık) bir şekil taşıyabilir. Alan adı `sekil`:

```json
"sekil": {
  "tur": "svg",
  "svg": "<svg viewBox=\"0 0 320 220\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\">…</svg>",
  "alt": "Türkçe kısa betim: y = f(x) grafiği; x = 2'de sıçrama süreksizliği var…",
  "baslik": "Graph of f",          // isteğe bağlı, şeklin altında görünür (İngilizce, AP'deki gibi)
  "konum": "govde"                // "govde" (kökün altında) | "aciklama" (yalnız çözümde)
}
```

Şıklar şekil olabilir: `secenekler[i].sekil` aynı yapıda (ör. "Which graph could be f′?").

## SVG kuralları (sunucu bu listeyle temizler; dışındaki her şey silinir)
- İzinli etiketler: `svg, g, path, line, polyline, polygon, rect, circle, ellipse, text, tspan, defs, marker, title, desc`.
- İzinli öznitelikler: `viewBox, xmlns, role, d, x, y, x1, y1, x2, y2, cx, cy, r, rx, ry, width, height, points, transform,
  fill, stroke, stroke-width, stroke-dasharray, stroke-linecap, stroke-linejoin, opacity, fill-opacity, font-size, font-weight,
  text-anchor, dominant-baseline, marker-end, marker-start, id, class`.
- Yasak: `script`, `foreignObject`, `image`, `use` (dış), `on*` olayları, `href`/`xlink:href`, `style` etiketi, harici URL.
- Renkler tema uyumlu olsun: çizgiler için `currentColor`; vurgu için yalnızca `class="sk-vurgu"` (mor) ve `class="sk-ikincil"` (turuncu),
  ızgara için `class="sk-izgara"`, eksenler için `class="sk-eksen"`. Sabit renk (#000 gibi) kullanma; istemci CSS'i açık/koyu temaya göre boyar.
- Boyut: `viewBox` en çok 480×360; `width/height` verme (istemci duyarlı ölçekler). Metin `font-size` 11–14.
- Eksen etiketleri ve sayılar okunur olmalı; AP'deki gibi "Graph of f" başlığı `baslik` alanında.
- Erişilebilirlik: `alt` zorunlu; grafiği görmeyen biri soruyu çözebilecek kadar bilgi versin (anahtar noktalar, eğim işaretleri, değerler).

## Veri tabloları
Tablo gereken sorularda SVG yerine kökte basit HTML `<table>` kullanılmaya devam edilir.
