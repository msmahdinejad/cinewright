# Logos & title stings — ten ways to reveal a mark

A logo reveal is the most requested video there is, and the easiest to make forgettable. What separates a good one: **it is motivated by the brand's idea** (a mark made of two voices should *meet*, a mark that is a bolt should *strike*), it **lands on a hit** (sound + camera punch + light at the same frame), it **holds** for ≥ 1 s afterwards, and the surroundings (light, particles, a shock ring) react to it.
In the recipes `c.logo` is a placeholder mark (a 600 × 600 transparent canvas). In a real film use your own: a PNG on white → `K.keyWhite(img)`, or draw it in code, or `Geo.relief(canvas)` for 3D (`relief-logo`), or `Parts.image(canvas)` for particles (`particles-image-sample`, `pipe-logo-cutout`).
Pair every reveal with `sfx-hit-stack` (sound) and a Post bloom/flash on the landing frame.

## logo-stamp-shockwave — Slam, ring, sparks, shake
tags: logo reveal stamp slam shockwave impact sparks shake hit sting 2d cheap
use: the classic, punchy sting: the mark drops from large, lands with squash, a ring and sparks leave it, the frame shakes. 1.2 s, works for any mark
how: `K.slam` (scale from 2.6 with stretch + squash on impact) + `K.rings` + `K.sparks` timed to the landing, `K.shake` decaying over 0.3 s.
```js scene
//@ {"peak":0.7,"look":{"bloom":0.8}}
const hit = .5, p = lt - hit, sh = lt > hit ? K.shake(p, 22 * u * 2 * Math.exp(-p * 12), 30, 3) : [0, 0, 0], s = H * .55;
g.save(); g.translate(sh[0], sh[1]); K.slam(g, lt - .15, W / 2, H / 2, () => g.drawImage(c.logo, -s / 2, -s / 2, s, s), { from: 2.6, d: hit - .15 }); g.restore();
K.rings(g, p, W / 2, H / 2, { n: 2, gap: .1, life: .8, r0: s * .2, r1: s * 1.3, color: ['#8a63ff', '#40f5f5'], width: 10 * u * 2 }); K.sparks(g, p, W / 2, H / 2, { n: 90, life: 1, speed: 1100 * u * 2, color: ['#ffffff', '#40f5f5', '#8a63ff'], width: 3 * u * 2 });
```

## logo-stroke-trace — The mark draws itself, then fills
tags: logo reveal stroke draw trace outline neon elegant line art 2d cheap
use: elegant/technical brands; the line draws, the fill fades in, a glint passes. Best for marks built from clean geometry
how: stroke the mark's own geometry with a dash that grows (`K.drawOn`) — here two arcs and a star outline — then fade the solid fill in over the last 30 %. For an arbitrary SVG path use `K.svgPath(d)`.
```js scene
//@ {"peak":1.0,"look":{"bloom":0.9}}
const cx = W / 2, cy = H / 2, R = H * .3, p = K.E.inOutCubic(K.prog(lt, .1, 1.7)), fill = K.prog(lt, 1.4, 2.2); g.lineCap = 'round'; g.lineJoin = 'round';
const arc = (a0, a1, col) => { g.beginPath(); g.arc(cx, cy, R, a0, a1); const L = R * (a1 - a0); K.drawOn(g, L, p); g.lineWidth = 10 * u * 2; g.strokeStyle = col; g.stroke(); K.undash(g); };
arc(2.25, 4.03, '#8a63ff'); arc(-.89, .89, '#40f5f5'); g.beginPath(); K.star(g, cx, cy, R * .59, R * .23, 4); K.drawOn(g, R * 3.7, p); g.strokeStyle = '#fff'; g.lineWidth = 5 * u * 2; g.stroke(); K.undash(g);
g.globalAlpha = fill; g.drawImage(c.logo, cx - R * 1.5, cy - R * 1.5, R * 3, R * 3); g.globalAlpha = 1;
```

## logo-light-sweep — A glint of light crosses the mark
tags: logo reveal light sweep shine glint metallic polish luxury 2d cheap
use: premium, calm brands; after the mark has appeared, a soft diagonal band of light passes over it ONLY where the mark is — the finishing touch of most expensive-looking stings
how: draw the mark into an offscreen canvas, fill a moving gradient band with `source-atop` (so it only touches mark pixels), then draw the offscreen on top. Move the band with an ease and repeat every ~2.5 s.
```js scene
//@ {"peak":0.9,"look":{"bloom":0.6}}
const s = H * .6, o = store.o ||= K.canvas(W, H, { cpu: true }), q = o.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, W, H); q.drawImage(c.logo, W / 2 - s / 2, H / 2 - s / 2, s, s);
const x = K.lerp(W / 2 - s * .8, W / 2 + s * .8, K.E.inOutCubic(K.prog(lt, .3, 1.8))), gr = q.createLinearGradient(x - s * .22, 0, x + s * .22, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
q.globalCompositeOperation = 'source-atop'; q.save(); q.translate(x, H / 2); q.rotate(.4); q.translate(-x, -H / 2); q.fillStyle = gr; q.fillRect(x - s * .3, -H, s * .6, H * 3); q.restore(); g.drawImage(o, 0, 0);
```

## logo-shatter-in — Shards converge and lock
tags: logo reveal shatter shards tiles converge assemble reverse explosion 2d medium
use: tech/energetic brands; the inverse of an explosion: dozens of tiles fly in from everywhere with spin, scale and stagger, lock into the mark, a flash seals it
how: cut the mark into an N × N grid with `drawImage(src, sx, sy, sw, sh, …)`; each tile has a hashed start offset/rotation/scale and its own delay; ease-out expo to the final cell; add a quick white flash on completion.
```js scene
//@ {"peak":0.55,"look":{"bloom":0.7}}
const n = 8, s = H * .6, x0 = W / 2 - s / 2, y0 = H / 2 - s / 2, ts = c.logo.width / n, td = s / n;
for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const h = K.hash2(i, j), q = K.E.outExpo(K.prog(lt, h * .6, h * .6 + .9)), a = h * K.TAU, d = (1 - q) * H * (.5 + h);
  g.save(); g.translate(x0 + (i + .5) * td + Math.cos(a) * d, y0 + (j + .5) * td + Math.sin(a) * d); g.rotate((1 - q) * (h - .5) * 9); g.globalAlpha = Math.min(1, q * 2); g.scale(.6 + .4 * q, .6 + .4 * q); g.drawImage(c.logo, i * ts, j * ts, ts, ts, -td / 2 - .5, -td / 2 - .5, td + 1, td + 1); g.restore(); }
g.fillStyle = `rgba(255,255,255,${.7 * Math.exp(-Math.max(0, lt - 1.5) * 10) * (lt > 1.5 ? 1 : 0)})`; g.fillRect(0, 0, W, H);
```

## logo-split-reveal — Two halves slide apart
tags: logo reveal split doors curtain slide mask clean corporate 2d cheap
use: corporate/clean intros, "opening" metaphors (doors, curtains, a book), a transition INTO the brand scene
how: two clip rectangles (left/right halves of the frame) slide outwards with an in-out expo while the mark scales up from 0.8 behind them; a thin vertical light line marks the seam and fades.
```js scene
//@ {"peak":1.2,"bg":"#08091c","look":{"bloom":0.7}}
const e = K.E.inOutExpo(K.prog(lt, .35, 1.4)), s = H * .55 * (.8 + .2 * e); g.globalAlpha = .4 + .6 * e; g.drawImage(c.logo, W / 2 - s / 2, H / 2 - s / 2, s, s); g.globalAlpha = 1;
[-1, 1].forEach(side => { g.save(); g.beginPath(); g.rect(side < 0 ? 0 : W / 2, 0, W / 2, H); g.clip(); g.translate(side * e * W * .52, 0); g.fillStyle = side < 0 ? '#101536' : '#161c48'; g.fillRect(0, 0, W, H); K.text(g, 'BRAND', W / 2, H / 2, { size: H * .16, weight: 800, fill: 'rgba(255,255,255,.9)', ink: true }); g.restore(); });
g.fillStyle = `rgba(160,230,255,${.9 * (1 - K.prog(lt, 1.3, 1.9)) * K.prog(lt, .2, .4)})`; g.fillRect(W / 2 - 2 * u, 0, 4 * u, H);
```

## logo-liquid-fill — Liquid rises inside the mark
tags: logo reveal liquid fill water wave level progress loading organic 2d medium
use: loading → brand ("charging up"), water/drink/energy/wellness brands, progress metaphors. The silhouette is the container
how: offscreen canvas: draw the mark, then fill a sine-wave polygon with `source-atop` so colour appears only inside the mark; the wave level rises with an ease; a faint empty mark (alpha .15) shows the container beforehand.
```js scene
//@ {"peak":1.3,"look":{"bloom":0.6}}
const s = H * .6, x0 = W / 2 - s / 2, y0 = H / 2 - s / 2, lvl = K.E.inOutCubic(K.prog(lt, .2, 2.4)), o = store.o ||= K.canvas(W, H, { cpu: true }), q = o.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, W, H); q.drawImage(c.logo, x0, y0, s, s);
q.globalCompositeOperation = 'source-atop'; const base = y0 + s * (1.05 - 1.1 * lvl); q.beginPath(); q.moveTo(x0 - 20, y0 + s + 20); for (let x = x0 - 20; x <= x0 + s + 20; x += 6) q.lineTo(x, base + Math.sin(x * .03 + lt * 5) * s * .02 * (1 - lvl * .5)); q.lineTo(x0 + s + 20, y0 + s + 20); q.closePath();
q.fillStyle = K.gradient(q, 0, y0, 0, y0 + s, [[0, '#7df9ff'], [1, '#3a63ff']]); q.fill(); g.globalAlpha = .15; g.drawImage(c.logo, x0, y0, s, s); g.globalAlpha = 1; g.drawImage(o, 0, 0);
```

## logo-glitch-in — Slices and RGB split settle into the mark
tags: logo reveal glitch rgb split slices digital cyber tech sting 2d medium
use: cyber/tech/gaming/security brands, "signal found" stories; 0.6 s of corruption that resolves into a clean mark on the hit
how: draw the mark three times (red / green / blue tinted copies, `lighter`) with horizontal offsets that shrink to 0, and slice the frame into bands with random x-jitter that also decays; deterministic from the frame number.
```js scene
//@ {"peak":0.35,"look":{"bloom":0.6,"ca":0.003}}
const s = H * .55, dec = 1 - K.E.outCubic(K.prog(lt, .1, 1.1)), fr = Math.round(t * 30), tint = store.tint ||= ['#ff2a55', '#00ff9a', '#2a6bff'].map(col => { const o2 = K.canvas(c.logo.width, c.logo.height, { cpu: true }), q2 = o2.getContext('2d'); q2.drawImage(c.logo, 0, 0); q2.globalCompositeOperation = 'source-atop'; q2.fillStyle = col; q2.fillRect(0, 0, o2.width, o2.height); return o2; });
g.drawImage(c.logo, W / 2 - s / 2, H / 2 - s / 2, s, s);
g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, dec * 1.6); tint.forEach((o2, k) => g.drawImage(o2, W / 2 - s / 2 + (k - 1) * 30 * u * 2 * dec, H / 2 - s / 2, s, s)); g.restore();
const n = 14, bh = H / n; for (let i = 0; i < n; i++) if (K.hash2(i, fr) < dec * .8) { g.save(); g.beginPath(); g.rect(0, i * bh, W, bh); g.clip(); g.translate((K.hash2(fr, i + 9) - .5) * W * .2 * dec, 0); g.drawImage(g.canvas, 0, 0); g.restore(); }
```

## logo-orbit-lockup — Mark + wordmark lock-up with orbiting accents
tags: logo reveal lockup wordmark orbit dots underline name end card tagline 2d cheap
use: the end card of almost any film: mark above, name below, a tagline, small accents that keep moving so the hold never goes dead
how: mark scales in with overshoot, the wordmark letters track in (letter-spacing animates — Latin only), an underline draws on, three dots orbit the mark on different radii (secondary motion for the 2–3 s hold).
```js scene
//@ {"peak":2.0,"look":{"bloom":0.6}}
const e = K.E.outBack(K.prog(lt, 0, .8)), s = H * .38 * e, cy = H * .38; for (let k = 0; k < 3; k++) { const a = lt * (1.1 + k * .4) + k * 2.1, r = H * (.27 + k * .04); K.glow(g, W / 2 + Math.cos(a) * r, cy + Math.sin(a) * r * .55, 26 * u * 2, ['#8a63ff', '#40f5f5', '#ffffff'][k], .9); }
g.drawImage(c.logo, W / 2 - s / 2, cy - s / 2, s, s); K.text(g, 'BRANDNAME', W / 2, H * .7, { size: H * .1, weight: 800, fill: '#fff', spacing: (1 - K.E.outCubic(K.prog(lt, .5, 1.5))) * 40 * u * 2 + 4 * u, alpha: K.prog(lt, .5, 1) });
g.beginPath(); g.moveTo(W * .36, H * .78); g.lineTo(W * .64, H * .78); K.drawOn(g, W * .28, K.E.inOutCubic(K.prog(lt, 1.1, 1.9))); g.strokeStyle = '#40f5f5'; g.lineWidth = 4 * u * 2; g.stroke(); K.undash(g); K.text(g, 'a tagline that earns its place', W / 2, H * .85, { size: H * .04, weight: 500, fill: '#aab4ff', alpha: K.prog(lt, 1.5, 2.1) });
```

## logo-gl-bloom-ring — The mark inside a growing light ring (GPU)
tags: logo reveal gl light ring bloom shader glow halo anamorphic premium 3d-lite cheap
use: cinematic stings: a thin ring of light expands from the centre as the mark fades up, anamorphic streaks ride the bloom; works in dark scenes with a coloured accent
how: a small SDF ring shader draws the expanding ring with a soft falloff, the mark is blitted on top with an ease-in; Post `streak` + bloom make the anamorphic flare. Add `Parts.Emitter` sparks at the landing for more.
```js gl
//@ {"peak":0.9,"bg":"#04040e","look":{"bloom":1.1,"streak":0.35,"threshold":0.6}}
const P = store.P ||= gfx.prog(`//#use math,sdf
uniform float uK; void main(){ vec2 p = aspectUv(vUv, uRes); float r = length(p), R = .1 + uK * .55; float ring = exp(-pow((r - R) / (.006 + .02 * uK), 2.)) * (1. - uK * .6); vec3 col = mix(vec3(.4, .3, 1.), vec3(.25, .96, .96), smoothstep(-.4, .4, p.x)) * ring * 2.4 + vec3(.05, .03, .12) * exp(-r * 3.); o = vec4(col, 1.); }`);
gfx.pass(P, { uK: K.E.outCubic(K.prog(lt, .1, 1.6)) }, { to: rt }); const s = H * .5 * (.8 + .2 * K.E.outBack(K.prog(lt, .3, 1.1))); g.globalAlpha = K.prog(lt, .35, .9); g.drawImage(c.logo, W / 2 - s / 2, H / 2 - s / 2, s, s);
```

## logo-confetti-pop — Playful pop with confetti
tags: logo reveal pop confetti playful bounce friendly kids social bright 2d cheap
use: friendly/consumer/kids/social brands; bouncy spring scale (`K.spring`), confetti cannons, a wobble on settle
how: the mark scales with a spring (overshoot, damped), wobbles by ±4° while settling; two `K.confetti` cannons fire on the pop; bright flat background.
```js scene
//@ {"peak":1.2,"bg":"#ff5d8f"}
const p = lt - .25, s = H * .5 * K.spring(p, { f: 2.2, z: .3 }), rot = Math.sin(p * 14) * .07 * Math.exp(-p * 3.5);
g.save(); g.translate(W / 2, H / 2); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 40 * u * 2; g.shadowOffsetY = 16 * u * 2; if (p > 0) g.drawImage(c.logo, -s / 2, -s / 2, s, s); g.restore();
const cols = ['#ffd23f', '#27f0ff', '#ffffff', '#7dff9b', '#7a5cff']; K.confetti(g, p, W * .1, H * 1.02, { n: 90, life: 2.4, speed: 1500 * u * 2, gravity: 1700 * u * 2, colors: cols, size: 20 * u * 2, angle: -1.15, spread: .9, seed: 1 }); K.confetti(g, p, W * .9, H * 1.02, { n: 90, life: 2.4, speed: 1500 * u * 2, gravity: 1700 * u * 2, colors: cols, size: 20 * u * 2, angle: -2.0, spread: .9, seed: 2 });
```

## mg-logo-build — A mark that builds itself and a name that pops letter by letter
tags: motion graphics logo intro channel sting brand mark build letters tagline shine
use: channel / brand intros of 5–8 s (`logo` scene): the mark assembles with an overshoot, three rings pulse out, the name pops letter by letter, a tagline slides up, a shine crosses it
how: pair with a 3-word `words` hook before it and a short `cta` after it; sound: riser into the hit, impact on the first letter, chime on the tagline (audio.mjs)
avoid: a logo that is only text; more than one shine
