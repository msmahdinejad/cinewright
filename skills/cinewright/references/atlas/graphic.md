# Graphic — 2D motion-design vocabulary (no 3D, no shaders needed)

Flat/graphic styles are won by **shape language and rhythm**, not by rendering: a limited palette, one geometric idea repeated, strong easing, overshoot, anticipation and follow-through.
Everything here is plain canvas 2D (`g`), deterministic, and cheap — it also composes with the GPU stack (draw it in a Stage scene `draw(g, lt, t)` or as an overlay).
The `G` library (geometry.js) adds **Islamic star patterns** (Hankin construction: `G.pattern`), polar/rotational symmetry, star polygons, spirographs, Lissajous curves and curl-noise flow fields — an ornamental vocabulary most generated videos never use. For Persian audiences it is the strongest "this was made for us" signal there is.

## gfx-girih-reveal — Islamic star pattern grows from the centre
tags: graphic girih islamic geometric pattern ornament persian star gold reveal tiling 2d medium
use: Persian/Islamic visual identity, "knowledge/tradition meets technology" stories, premium backgrounds and end cards; the pattern is mathematically exact, so it looks hand-crafted
how: `G.pattern(kind, contactAngle°, {size, cols, rows})` builds a tiling (`square`, `hex`, `tri`, `octsquare`) and the star lines by Hankin's polygons-in-contact method; build it once (it is heavy), draw with `G.draw(g, pat, {cx, cy, reveal, width, color, glow, rotate, fill})` — `reveal` 0→1 draws the lattice outward from the centre like a compass. Angle 45–72° changes the character; fill alternate polygons with translucent colour.
pair: bg-hex/bg-topo behind, particles-dust-ambient, sound `persian-santur-melody`
```js scene
//@ {"peak":1.8,"bg":"#07122b","look":{"bloom":0.7}}
const pat = store.pat ||= G.pattern('hex', 56, { size: H * .1, cols: 9, rows: 8 });
G.draw(g, pat, { cx: W / 2, cy: H / 2, reveal: K.prog(lt, 0, 2.4), width: 2.4 * u * 2, color: '#f5c76b', glow: 1, rotate: lt * .03, fill: (p, i) => i % 3 === 0 ? 'rgba(30,70,150,.5)' : null });
```

## gfx-star-mandala — Counter-rotating star polygons
tags: graphic mandala star polygon rotate symmetry geometric neon sacred 2d cheap
use: ornamental centrepieces, loading/"thinking" visuals, logo halos, meditation/intelligence metaphors
how: `G.starPolygon(n, k, r)` returns the vertices of {n/k} stars ({12/5}, {8/3}, {16/7}…). Stack 4–5 of them at growing radii, rotate neighbours in opposite directions, stroke with `K.neon` in a gradient of two hues.
```js scene
//@ {"peak":1.8,"bg":"#0a0820","look":{"bloom":0.6}}
const cols = ['#7a5cff', '#27f0ff', '#ff4fd8', '#ffd23f', '#7dff9b'];
[[12, 5, .08], [8, 3, .14], [16, 7, .2], [10, 3, .27], [20, 9, .34]].forEach(([n, k, r], i) => { const pts = G.starPolygon(n, k, H * r * K.E.outCubic(K.prog(lt, i * .12, i * .12 + 1.2)), 0, 0, lt * (i % 2 ? .35 : -.28)); g.save(); g.translate(W / 2, H / 2); g.beginPath(); pts.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); K.neon(g, cols[i], 1.6 * u * 2, .8); g.restore(); });
```

## gfx-spirograph — Hypotrochoid curves drawn live
tags: graphic spirograph curve spiral hypotrochoid math draw neon line 2d cheap
use: elegant "drawing itself" backgrounds, maths/engineering/art tones, a hypnotic idle animation
how: `G.spiro(R, r, d, u)` gives a point; sample u from 0 to `2π·r/gcd(R,r)` and draw only the first `p` of the polyline; add a glowing pen dot at the head. Vary `d` over time for a morphing figure.
```js scene
//@ {"peak":2.0,"bg":"#070a1a","look":{"bloom":1.0}}
const p = K.prog(lt, 0, 2.6), turns = 3, N = 700, k = H * .042, d = 4 + 1.5 * Math.sin(lt * .6); g.save(); g.translate(W / 2, H / 2); g.beginPath();
for (let i = 0; i <= N * p; i++) { const [x, y] = G.spiro(7, 3, d, i / N * turns * K.TAU); i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k); } K.neon(g, '#27f0ff', 2.2 * u * 2, 1);
const [hx, hy] = G.spiro(7, 3, d, p * turns * K.TAU); K.glow(g, hx * k, hy * k, 34 * u, '#ffffff', .9); g.restore();
```

## gfx-flow-field — Ink streamlines in a curl-noise wind
tags: graphic flow field streamlines ink curl noise generative lines wind hair 2d medium
use: generative-art backgrounds, wind/hair/water/fabric metaphors, "data stream" abstractions; calm and expensive-looking
how: `G.flow({n, steps, step, scale, seed, w, h})` returns deterministic polylines that follow divergence-free curl noise; draw a moving window along each line so strokes appear to flow. Colour by line index with a 2–3 colour gradient; low alpha, thin lines, bloom.
```js scene
//@ {"peak":1.8,"bg":"#0a0a14","look":{"bloom":0.6}}
const L = store.L ||= G.flow({ n: 360, steps: 70, step: 8 * u * 2, scale: .0032 / (H / 540), seed: 7, w: W, h: H, z: 1.3 }), p = K.prog(lt, 0, 2.6) * 1.35; g.lineCap = 'round'; g.lineWidth = 1.6 * u * 2;
L.forEach((ln, i) => { const head = Math.floor(p * ln.length), tail = Math.max(0, head - 26); if (head < 2) return; g.strokeStyle = K.hsl(190 + (i / L.length) * 120, .85, .62, .55); g.beginPath(); for (let k = tail; k < Math.min(head, ln.length); k++) k === tail ? g.moveTo(...ln[k]) : g.lineTo(...ln[k]); g.stroke(); });
```

## gfx-lissajous — Lissajous ribbons
tags: graphic lissajous curves ribbons oscilloscope neon math audio 2d cheap
use: oscilloscope/audio/retro-tech looks, "signals", a continuously evolving abstract centrepiece
how: `G.lissajous(a, b, delta, u, A, B)` traces a figure; animate `delta`; draw three curves with different frequency ratios and colours using `K.neon`.
```js scene
//@ {"peak":1.5,"bg":"#050810","look":{"bloom":1.1}}
[['#27f0ff', 3, 2, 0], ['#ff4fd8', 5, 4, 1.3], ['#ffd23f', 2, 3, 2.1]].forEach(([col, a, b, ph]) => { g.save(); g.translate(W / 2, H / 2); g.beginPath(); for (let i = 0; i <= 400; i++) { const [x, y] = G.lissajous(a, b, lt * .8 + ph, i / 400 * K.TAU, W * .34, H * .34); i ? g.lineTo(x, y) : g.moveTo(x, y); } K.neon(g, col, 2 * u * 2, .9); g.restore(); });
```

## gfx-blob-morph — Soft organic blobs
tags: graphic blob organic morph gradient soft liquid shapes background friendly 2d cheap
use: friendly, modern product backgrounds, calm hero scenes, "liquid" brand feels; sits under type without competing
how: a closed curve through N points whose radius = base · (1 + amp · noise(angle·k + t)); draw smooth with quadratic midpoints; fill with a 2-colour gradient; layer 3 blobs with `screen`/`lighter` blend so they glow where they overlap.
```js scene
//@ {"peak":1.5,"bg":"#14122b","look":{"bloom":0.5}}
const blob = (cx, cy, r, seed, c0, c1) => { const N = 14, pts = Array.from({ length: N }, (_, i) => { const a = i / N * K.TAU, rr = r * (1 + .28 * K.noise2(Math.cos(a) * 1.3 + seed, Math.sin(a) * 1.3 + lt * .55 + seed)); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
  g.beginPath(); pts.forEach((p, i) => { const q = pts[(i + 1) % N], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; i ? g.quadraticCurveTo(p[0], p[1], m[0], m[1]) : g.moveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }); g.closePath(); g.fillStyle = K.gradient(g, cx - r, cy - r, cx + r, cy + r, [[0, c0], [1, c1]]); g.fill(); };
g.globalCompositeOperation = 'screen'; blob(W * .36, H * .5, H * .3, 1, '#ff4d8d', '#ffb347'); blob(W * .62, H * .45, H * .27, 5, '#6a5cff', '#27f0ff'); blob(W * .52, H * .66, H * .22, 9, '#00d4a0', '#7dff9b');
```

## gfx-sunburst — Pop-art rays behind a hero word
tags: graphic sunburst rays pop art burst comic retro energy background bold 2d cheap
use: bold/playful/retro-pop styles, "announcement" moments, sale/launch/hero-word beats; rotates slowly, scales with a punch on the hit
how: N wedges from the centre alternating two colours, rotating; a halftone vignette; the hero word on top with an extruded shadow; punch the scale on the beat.
```js scene
//@ {"peak":1.3,"bg":"#ff5a3c"}
const N = 24, R = Math.hypot(W, H), pc = 1 + .05 * Math.exp(-((lt - .3) % 1) * 9); g.save(); g.translate(W / 2, H / 2); g.rotate(lt * .12);
for (let i = 0; i < N; i += 2) { g.fillStyle = '#ff8a3c'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, i / N * K.TAU, (i + 1) / N * K.TAU); g.closePath(); g.fill(); } g.restore();
g.save(); g.translate(W / 2, H / 2); g.scale(pc, pc); Type.extrude(g, 'BOOM!', 0, 0, { size: H * .36, weight: 900, depth: 26 * u * 2, angle: Math.PI * .7, colors: ['#fff6d6', '#1a1a2e'] }); g.restore();
```

## gfx-stroke-draw — A line that draws itself (SVG path draw-on)
tags: graphic stroke draw on path svg line arrow signature handwriting neon 2d cheap
use: arrows/connections, underlines, signatures, route lines, "this leads to that"; one of the most satisfying primitives in motion design
how: `K.svgPath(d)` gives `.length`, `.path2d` and `.at(u)` (point + angle); `K.drawOn(g, length, p)` sets the dash so only the first `p` shows. Add a glowing head with `K.glow` and an arrowhead rotated by `.at(p).angle` at the end.
```js scene
//@ {"peak":1.6,"bg":"#0b0d1a","look":{"bloom":0.9}}
const sp = store.sp ||= K.svgPath('M 90 400 C 220 120, 430 110, 500 290 S 760 520, 870 190'), p = K.E.inOutCubic(K.prog(lt, .2, 2.4));
g.save(); g.scale(W / 960, H / 540); g.lineCap = 'round'; K.drawOn(g, sp.length, p); g.globalCompositeOperation = 'lighter';
for (const [w, a] of [[34, .06], [18, .12], [9, .35], [4, 1]]) { g.lineWidth = w; g.strokeStyle = K.rgba('#7df9ff', a); g.stroke(sp.path2d); }                 // layered neon: wide faint → thin bright
K.undash(g); g.globalCompositeOperation = 'source-over'; const h = sp.at(p); K.glow(g, h.x, h.y, 60, '#ffffff', .9); g.restore();
```

## gfx-isometric-blocks — Isometric block city rising
tags: graphic isometric blocks cubes city grid wave pop 3d-lite explainer data 2d medium
use: "building up" stories, data-as-architecture, clean explainer visuals with depth but no 3D engine
how: project (x, y, z) with a 2:1 isometric transform, draw each column as three shaded faces (top, left, right), painter's order by x+y. Heights follow a travelling wave + a pop-in stagger.
```js scene
//@ {"peak":1.8,"bg":"#101730"}
const iso = (x, y, z) => [W / 2 + (x - y) * H * .052, H * .3 + (x + y) * H * .026 - z * H * .052], N = 8; const faces = [];
for (let s = 0; s <= 2 * (N - 1); s++) for (let x = 0; x < N; x++) { const y = s - x; if (y < 0 || y >= N) continue; const grow = K.E.outBack(K.prog(lt, (x + y) * .05, (x + y) * .05 + .6)), h = grow * (1 + 2.6 * (.5 + .5 * Math.sin((x - y) * .7 + lt * 2.2)) * Math.exp(-Math.hypot(x - 3.5, y - 3.5) * .18));
  const A = iso(x, y, h), B = iso(x + 1, y, h), C = iso(x + 1, y + 1, h), D = iso(x, y + 1, h), B0 = iso(x + 1, y, 0), C0 = iso(x + 1, y + 1, 0), D0 = iso(x, y + 1, 0), hue = 215 + (x + y) * 6;
  [[[D, C, C0, D0], K.hsl(hue, .6, .38)], [[B, C, C0, B0], K.hsl(hue, .6, .29)], [[A, B, C, D], K.hsl(hue, .75, .62)]].forEach(([pts, col]) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); }); }
```

## gfx-grid-warp — A grid bent by gravity wells
tags: graphic grid warp distortion gravity wave mesh tech lines field 2d medium
use: tech/physics/"attention" backgrounds; a field being disturbed by a moving point (cursor, planet, signal)
how: draw a regular grid of polylines; displace every vertex toward/away from a moving centre with a Gaussian falloff. Two wells + thin cyan lines on dark = instantly "spacetime".
```js scene
//@ {"peak":1.5,"bg":"#070a16","look":{"bloom":0.8}}
const wells = [[W * (.5 + .22 * Math.sin(lt * .9)), H * (.5 + .12 * Math.cos(lt * 1.1)), 1], [W * (.5 - .25 * Math.sin(lt * .7 + 1)), H * .5, -.7]], nx = 40, ny = 23, dp = (x, y) => { let X = x, Y = y; for (const [wx, wy, s] of wells) { const dx = x - wx, dy = y - wy, d = Math.hypot(dx, dy) + 1e-3, f = s * H * .16 * Math.exp(-d * d / (H * H * .06)); X -= dx / d * f; Y -= dy / d * f; } return [X, Y]; };
g.strokeStyle = 'rgba(90,200,255,.55)'; g.lineWidth = 1.3 * u * 2;
for (let j = 0; j <= ny; j++) { g.beginPath(); for (let i = 0; i <= nx * 3; i++) { const [x, y] = dp(i / (nx * 3) * W, j / ny * H); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
for (let i = 0; i <= nx; i++) { g.beginPath(); for (let j = 0; j <= ny * 3; j++) { const [x, y] = dp(i / nx * W, j / (ny * 3) * H); j ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
```

## gfx-radial-equalizer — Circular audio bars
tags: graphic radial equalizer audio bars circle music visualizer logo halo 2d cheap
use: music/voice/podcast scenes, logos that "breathe" with sound; with real audio use `K.audioData()` envelopes (see sound.md) instead of noise
how: 96 rounded bars around a circle, length from smooth noise × an envelope, colour by angle; a logo disc in the centre. Bloom ≥ 0.8.
```js scene
//@ {"peak":1.5,"bg":"#080a18","look":{"bloom":0.9}}
const cx = W / 2, cy = H / 2, r0 = H * .2, N = 96; g.lineCap = 'round'; g.lineWidth = H * .012;
for (let i = 0; i < N; i++) { const a = i / N * K.TAU - Math.PI / 2, amp = (.15 + .85 * Math.abs(K.noise2(Math.cos(a) * 1.6 + 3, Math.sin(a) * 1.6 + lt * 3.2))) * (.6 + .4 * Math.sin(lt * 2)), r1 = r0 + H * .02 + amp * H * .2; g.strokeStyle = K.hsl(200 + i / N * 160, .9, .62); g.beginPath(); g.moveTo(cx + Math.cos(a) * (r0 + H * .02), cy + Math.sin(a) * (r0 + H * .02)); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke(); }
g.fillStyle = '#fff'; K.circle(g, cx, cy, r0 * .8); g.fill(); K.text(g, 'FM', cx, cy, { size: H * .16, weight: 900, fill: '#080a18' });
```

## gfx-paper-cutout — Layered paper with soft shadows
tags: graphic paper cutout layers shadow tactile craft warm handmade collage 2d medium
use: handmade/craft/children/storybook tones — the antidote to glossy tech; feels tactile because every layer casts a soft shadow
how: `K.paper(w, h, opts)` bakes a fibre/stain texture once; each shape is a filled path with `shadowBlur` + `shadowOffsetY`; layers drift at different speeds; keep the palette warm and limited (4–5 colours).
```js scene
//@ {"peak":1.5,"bg":"#efe6d2"}
g.drawImage(K.paper(W, H, { base: '#efe6d2' }), 0, 0);
const layer = (col, y0, amp, sd, sp) => { g.save(); g.shadowColor = 'rgba(60,35,10,.35)'; g.shadowBlur = 22 * u * 2; g.shadowOffsetY = 8 * u * 2; g.fillStyle = col; g.beginPath(); g.moveTo(-20, H + 20); for (let x = -20; x <= W + 20; x += 8) g.lineTo(x, H * y0 - amp * H * K.noise1((x + lt * sp) / W * 2.4 + sd)); g.lineTo(W + 20, H + 20); g.fill(); g.restore(); };
g.save(); g.shadowColor = 'rgba(60,35,10,.3)'; g.shadowBlur = 24 * u * 2; g.shadowOffsetY = 8 * u * 2; g.fillStyle = '#f2a65a'; K.circle(g, W * .7, H * .32 + 6 * Math.sin(lt), H * .14); g.fill(); g.restore();
layer('#e07a5f', .6, .08, 1.1, 18 * u); layer('#3d405b', .72, .09, 4.2, 34 * u); layer('#81b29a', .86, .07, 7.3, 60 * u);
```

## gfx-sticker-pop — Sticker pack popping in
tags: graphic sticker pop outline white border playful emoji shapes bounce social 2d cheap
use: playful/social/Gen-Z tones, feature highlights as "stickers", reaction bursts; the white outline + soft shadow is what makes shapes read as stickers
how: each sticker = a path filled with a flat colour, stroked white (round joins, thick) with a drop shadow; enter with `K.pop` (overshoot scale + rotation), staggered 0.12 s; tiny idle wobble.
```js scene
//@ {"peak":1.5,"bg":"#7a5cff"}
const S = [[.28, .42, '#ffd23f', 'star'], [.5, .55, '#ff4d6d', 'heart'], [.72, .4, '#27f0ff', 'bolt'], [.5, .28, '#7dff9b', 'circle']];
S.forEach(([x, y, col, kind], i) => { const pr = lt - .15 - i * .14; K.pop(g, pr, W * x, H * y, () => { g.rotate((i - 1.5) * .12 + .05 * Math.sin(lt * 3 + i)); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 20 * u * 2; g.shadowOffsetY = 8 * u * 2; g.lineJoin = 'round'; g.lineWidth = H * .03; g.strokeStyle = '#fff'; g.fillStyle = col; const r = H * .11;
  if (kind === 'star') K.star(g, 0, 0, r, r * .5, 5); else if (kind === 'circle') K.circle(g, 0, 0, r * .85); else if (kind === 'heart') { g.beginPath(); g.moveTo(0, r * .8); g.bezierCurveTo(-r * 1.5, -r * .1, -r * .8, -r * 1.1, 0, -r * .4); g.bezierCurveTo(r * .8, -r * 1.1, r * 1.5, -r * .1, 0, r * .8); } else { g.beginPath(); [[.15, -.9], [-.55, .1], [-.05, .1], [-.2, .9], [.55, -.15], [.05, -.15]].forEach(([a, b], j) => j ? g.lineTo(a * r * 1.3, b * r * 1.3) : g.moveTo(a * r * 1.3, b * r * 1.3)); g.closePath(); }
  g.stroke(); g.fill(); }, { dur: .55, over: 2.2 }); });
```

## gfx-liquid-wave — Liquid rising and sloshing
tags: graphic liquid wave water fill rise sine layers transition background 2d cheap
use: fill-the-screen transitions, loading, "level up", water/ocean/emotion metaphors; a rising wave is also a great wipe because it reveals the next scene behind it
how: 3–4 sine layers with different frequencies, phases and speeds; `level` rises with an ease; fill with gradients; the front layer is semi-transparent for depth.
```js scene
//@ {"peak":1.5,"bg":"#0b1230"}
const lvl = K.E.inOutCubic(K.prog(lt, .1, 2.8)), base = H * (1.1 - 1.2 * lvl);
[['rgba(39,240,255,.55)', 1.0, 1.6, 0], ['rgba(122,92,255,.65)', 1.4, -1.2, 1.7], ['rgba(255,79,216,.6)', 1.9, 1.0, 3.4]].forEach(([col, f, sp, ph], i) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 6) g.lineTo(x, base + i * H * .035 + Math.sin(x / W * K.TAU * f + lt * sp + ph) * H * .035 * (1 - .4 * lvl)); g.lineTo(W, H); g.fill(); });
```

## gfx-dot-globe — A dotted globe with glowing arcs between cities
tags: globe world map dots arcs network global connect travel reach languages translation sphere 3d-lite 2d medium persian-ok
use: "worldwide", "any language", networks, travel, shipping, social reach — the shape people recognise instantly. Dots make the land without map data, the slow turn gives cheap convincing 3D, arcs between pins say "connection"
how: Fibonacci-sphere points; land = where a 3-octave tri-planar noise exceeds a threshold (a stylised planet, seam-free; for the REAL Earth bake a land mask from an equirectangular PNG into a `K.canvas` and test pixels). Rotate about Y, tilt about X, project orthographically; front-facing dots bright and larger, back-facing faint (that is what gives volume). Arcs: spherical interpolation between two unit vectors, lifted by `sin(πs)` so they bulge off the surface, drawn partially so they GROW; pins ping with a ring. Everything is a function of `lt`, so it stays deterministic.
pair: bg-starfield, particles-orbit-dust, look-anamorphic, ui-glass-panels (language bubbles)
avoid: real borders/flags unless you have the data (a wrong coastline is worse than none); arcs that all start at once; more than ~7 pins
```js scene
//@ {"peak":1.8,"bg":"#05060f","look":{"bloom":0.8}}
const R = H * .36, cx = W / 2, cy = H / 2, rot = lt * .45 + .5, tilt = .38, cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
const land = (x, y, z) => { let n = 0, a = .5, f = 1.7; for (let o = 0; o < 3; o++) { n += a * (K.noise2(x * f + 5 + o * 13, y * f + o * 7) + K.noise2(y * f + 9 + o * 5, z * f + 3) + K.noise2(z * f + 1 + o * 3, x * f + 7)); f *= 2.1; a *= .5; } return n; };
const pts = store.pts ||= (() => { const out = []; for (let i = 0, n = 3200; i < n; i++) { const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), a = i * 2.399963, x = Math.cos(a) * r, z = Math.sin(a) * r; if (land(x, y, z) > .1) out.push([x, y, z]); } return out; })();
const city = store.city ||= [[-.55, .38, .74], [.62, .25, .74], [.1, -.35, .93], [-.9, .1, .43], [.88, -.1, .46], [0, .75, .66]].map(v => { const l = Math.hypot(...v); return v.map(c => c / l); });
const proj = (v, k = 1) => { const x = v[0] * cr + v[2] * sr, z0 = -v[0] * sr + v[2] * cr, y = v[1] * ct - z0 * st, z = v[1] * st + z0 * ct; return [cx + x * R * k, cy - y * R * k, z]; };
K.glow(g, cx, cy, R * 1.5, '#3a5bff', .3); g.fillStyle = K.gradient(g, cx - R, cy - R, cx + R, cy + R, [[0, 'rgba(60,80,200,.22)'], [1, 'rgba(5,6,15,.0)']]); g.beginPath(); g.arc(cx, cy, R, 0, K.TAU); g.fill();
pts.forEach(v => { const [x, y, z] = proj(v), s = (1 + 1.6 * Math.max(0, z)) * u * 2.2; g.fillStyle = z > 0 ? `rgba(127,214,255,${.25 + .75 * z})` : 'rgba(127,214,255,.07)'; g.fillRect(x - s / 2, y - s / 2, s, s); });
g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
[[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [2, 5]].forEach(([i, j], n) => { const a = city[i], b = city[j], om = Math.acos(K.clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)), q = K.E.inOutCubic(K.prog(lt, .25 + n * .16, 1.3 + n * .16)); let open = false; g.beginPath();
  for (let k = 0, S = 56; k <= S * q; k++) { const s = k / S, w0 = Math.sin((1 - s) * om) / Math.sin(om), w1 = Math.sin(s * om) / Math.sin(om), lift = 1 + .22 * Math.sin(Math.PI * s), [x, y, z] = proj([(a[0] * w0 + b[0] * w1) * lift, (a[1] * w0 + b[1] * w1) * lift, (a[2] * w0 + b[2] * w1) * lift]); if (z < -.02) { open = false; continue; } open ? g.lineTo(x, y) : g.moveTo(x, y); open = true; }
  g.strokeStyle = 'rgba(185,163,255,.9)'; g.lineWidth = 2.4 * u * 2; g.stroke(); });
city.forEach((c, i) => { const [x, y, z] = proj(c); if (z < 0) return; const ph = (lt * 1.1 + i * .3) % 1; g.strokeStyle = `rgba(64,245,245,${(1 - ph) * .8})`; g.lineWidth = 2 * u * 2; g.beginPath(); g.arc(x, y, (6 + 26 * ph) * u * 2, 0, K.TAU); g.stroke(); K.glow(g, x, y, 14 * u * 2, '#ffffff', 1); });
g.restore();
```

## mg-poster-system — A bold flat-poster system (colour blocks, condensed caps)
tags: motion graphics poster flat colour blocks theme palette caps display anton bold promo intro social
use: person / brand intros, promos, menus, event announcements — anything that should feel confident, friendly and designed rather than "techy"
how: the `motion` template with `theme: { preset: 'poster' }` (cream · tomato · mustard · forest · mint, Anton caps) and a different `bgColor` on every scene or two (`a`/`b`/`c`/`d`); the kit picks readable text colours and never lets an accent equal the background. Three or four colours total, one big idea per scene
avoid: more than four colours; the same background on every scene (the colour change IS the rhythm); thin light type on a saturated block

## mg-icon-draw-on — Stroke icons that draw themselves
tags: motion graphics icons draw on stroke line icon animation infographic chips fact
use: any scene that needs a pictogram (skills, features, facts, menu items): `MG.icon(g, name, x, y, size, color, p)` with p = 0…1, 50 built-in icons (`MG.icons`)
how: every icon is an SVG path on a 24-unit grid; each sub-path is dashed to its own length so all strokes finish together; `MG.iconDisc` puts it in a popping disc. Draw the icon ~0.25 s after its card appears so the eye gets two beats
avoid: icons smaller than 5 % of the frame height; mixing stroke and filled icon styles in one film

## mg-wipes — Colour wipes between scenes
tags: motion graphics transition wipe stripes circle slide flood blocks diagonal cut between scenes
use: the glue of every motion-graphics film: the scene changes while a coloured shape covers the frame (`wipe` per scene in the spec)
how: `stripes` (bars sweeping), `circle` (iris out and in), `slide` (two panels), `flood` (a colour fills and clears), `blocks` (a tile grid scaling in), `diagonal` (a slanted band). The cut happens at the exact middle of the wipe; entrances start 0.3 s after it. Vary them, use `flood` before a calm scene and `stripes` before a busy one
avoid: the same wipe for every cut; wipes longer than 0.6 s (they eat the scene)
