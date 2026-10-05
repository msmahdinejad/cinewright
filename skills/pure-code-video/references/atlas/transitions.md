# Transitions — how one scene becomes the next

A transition is a piece of storytelling, not decoration: it says *how* two ideas relate (a cut = "and then", a whip = "meanwhile / faster", a zoom-through = "going deeper", a dissolve = "time passes", a glitch = "something broke").
Rules: **vary the vocabulary** (a film that uses `fade` six times is a slideshow; use ≥ 4 different transitions in 20 s) · **keep them short** (0.3–0.7 s; ≥ 0.9 s only for calm moments) · **cut on the beat** (centre the transition on a bar/beat time) ·
**match the style system** (glitch for cyber, ink/burn for fantasy, slide/doors for UI, lightleak for warm/film, iris/dots for playful) · the incoming scene should already be *moving* when the transition starts.
With `Stage`, a transition is one line: `{ id:'city', at: 9, enter: ['glitch', .45], … }` (centred on `at`). All 32 GPU transitions at 50 % progress: `references/gallery/transitions.jpg`.

## trans-catalog — The 32 GPU transitions (what each one means)
tags: transition catalog gpu stage whip zoom glitch iris burn ink liquid shatter flip blur lightleak
use: pick by meaning — energetic: whip · zoomBlurCut · zoom · spin · slide · glitch · flash · scan · slice  /  graphic: iris · diamond · clock · spiral · blinds · checker · dots · doors · flip · wipe · luma  /  organic: dissolve · burn · ink · liquid · swirl · shatter  /  soft: fade · dip · blur · lightleak · chroma · pixelate
how: `Trans.run(gfx, name, texA, texB, p, { dir, par, color, center, to })` — or `enter: [name, seconds, { dir, par, color, center }]` on a Stage scene. `par` = [x, y, z, w]; typical meaning: x = softness, y = strength/glow, z = count/scale, w = seed. `Trans.info(name)` prints defaults and what each slot does; `Trans.list` lists names.
Per-transition notes: whip `dir:[1,0]` left→right, y = blur · slide `dir`, y = blur · zoom y = zoom factor · iris/diamond/clock take `center:[x,y]` (start from the logo/cursor) · burn `color` = flame colour · scan `color` + `dir` · dots/checker/blinds/slice/shatter z = count · glitch x = density, y = strength, w = seed (change the seed per use) · lightleak `dir` = where the light enters.
Each transition also returns Post "look" pulses (`ca`, `glitch`, `zoomBlur`, `flash`) that Stage applies automatically — if you call `Trans.run` yourself, multiply them by `sin(π·p)` and pass to `post.end`.
```js gl
//@ {"peak":1.5,"look":{"ca":0.004}}
const B = store.B ||= gfx.rt(W, H);
fx.bg('aurora', { c: ['#02040c', '#33ff99', '#22ccff', '#a566ff'], speed: 1 }, { to: B });
Trans.run(gfx, 'glitch', c.demo(), B, K.prog(lt, .3, 2.7), { to: rt });
```

## trans-define-custom — Write your own transition in 5 lines
tags: transition custom glsl define stage shader technique
use: when none of the 32 says what you mean — a brand-shaped wipe, diagonal stripes, a logo-shaped iris. Your transition then works in Stage (`enter: ['stripes', .6]`) like a built-in
how: `Trans.define(name, { ease, par, glsl })` with `vec4 tr(vec2 uv)`; inside you have `sA(uv)` (outgoing), `sB(uv)` (incoming), `uP` (0→1, eased), `uPar`, `uDir`, `uCol`, `uCen`, `inside(uv)`, `asp()` and the math/noise/color helpers. Return the mixed colour.
```js gl
//@ {"peak":1.5}
if (!store.def) { Trans.define('stripes', { ease: 'io3', par: [9, 0, 0, 0], desc: 'diagonal stripes wipe', glsl: `vec4 tr(vec2 uv){ float s = (uv.x + uv.y * .6) * uPar.x, f = fract(s), t = clamp(uP * 1.5 - hash11(floor(s)) * .5, 0., 1.); float m = step(f, t); vec4 c = mix(sA(uv), sB(uv), m); c.rgb += uCol * exp(-abs(f - t) * 30.) * .6 * sin(3.14159 * uP); return c; }` }); store.def = 1; }
const B = store.B ||= gfx.rt(W, H); fx.bg('nebula', { c: ['#020208', '#2a1a78', '#d8337a', '#ffd27a'], speed: .8 }, { to: B });
Trans.run(gfx, 'stripes', c.demo(), B, K.prog(lt, .3, 2.7), { to: rt, color: [1, .8, .5] });
```

## trans-circle-reveal — Circle reveal / match cut (2D)
tags: transition 2d circle iris reveal match cut shape clip cheap
use: a shape in scene A *becomes* scene B (a sun, a button, an eye, a logo dot grows into the next scene) — the match cut, the most elegant way to change scenes
how: clip scene B to a growing circle centred on the object that links the two scenes; a thin ring on the edge reads as a lens. The same pattern works with any `Path2D` (star, logo) as the clip.
```js scene
//@ {"peak":1.3}
const p = K.E.inOutCubic(K.prog(lt, .3, 2.2)), R = Math.hypot(W, H) * .5 * p * 1.06; c.A(g);
g.save(); g.beginPath(); g.arc(W / 2, H / 2, R, 0, K.TAU); g.clip(); c.B(g); g.restore();
g.strokeStyle = '#fff'; g.lineWidth = Math.max(0, 12 * u * (1 - p)); g.beginPath(); g.arc(W / 2, H / 2, R, 0, K.TAU); g.stroke();
```

## trans-color-flood — Coloured panels sweep through (2D)
tags: transition 2d panels flood colour wipe brand graphic bold cheap
use: bold, graphic, brand-coloured cuts (explainers, social, motion-design reels); the panel colours should come from the palette
how: three slanted panels with staggered easing sweep across; B is revealed behind the last one. Because panels are opaque, the cut hides inside them — A and B need not match at all.
```js scene
//@ {"peak":1.0}
const p = K.prog(lt, .25, 2.2), e = k => -W * .3 + W * 1.7 * K.E.inOutCubic(K.prog(p, k * .11, k * .11 + .6)), tilt = H * .22; c.A(g);
const poly = x => { g.beginPath(); g.moveTo(-W, 0); g.lineTo(x + tilt, 0); g.lineTo(x - tilt, H); g.lineTo(-W, H); g.closePath(); };
['#ffd23f', '#ff4d6d', '#14142a'].forEach((col, k) => { g.fillStyle = col; poly(e(k)); g.fill(); });
g.save(); poly(e(3)); g.clip(); c.B(g); g.restore();
```

## trans-zoom-through — Fall into A, emerge from B (2D)
tags: transition 2d zoom through dive scale blur camera depth cheap
use: "going deeper", entering a screen/world, tech and dream tones; pairs with a whoosh and a hit
how: scale A up exponentially around a focal point while fading it out; B starts small and grows to 1. Doing it in 2D costs nothing; the GPU `zoom` does the same with radial blur and chromatic spike.
```js scene
//@ {"peak":1.3}
const p = K.prog(lt, .3, 2.2), e = K.E.inOutExpo(p);
g.save(); g.translate(W / 2, H / 2); const sb = Math.exp(-(1 - e) * 2.4); g.scale(sb, sb); g.translate(-W / 2, -H / 2); g.globalAlpha = K.prog(p, .3, .6); c.B(g); g.restore();
g.save(); g.translate(W / 2, H / 2); const sa = Math.exp(e * 3.2); g.scale(sa, sa); g.translate(-W / 2, -H / 2); g.globalAlpha = 1 - K.prog(p, .45, .75); c.A(g); g.restore();
```

## trans-push-parallax — Push with parallax and shadow (2D)
tags: transition 2d push slide parallax layers ui calm clean cheap
use: UI/explainer tone, calm and clear ("next step"), carousels; the depth cue (A moves slower, B casts a shadow) makes it feel like layers instead of a flat slide
```js scene
//@ {"peak":1.2}
const e = K.E.inOutCubic(K.prog(lt, .3, 1.9));
g.save(); g.translate(-W * e * .35, 0); c.A(g); g.restore();
const x = W * (1 - e), sh = g.createLinearGradient(x - 120 * u, 0, x, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = sh; g.fillRect(x - 120 * u, 0, 120 * u, H);
g.save(); g.translate(x, 0); c.B(g); g.restore();
```

## trans-hit-flash — Flash + shake + split on a hit (2D)
tags: transition 2d flash impact hit shake split beat cut punch cheap
use: the cut that lands on a drum hit; logo slams; section starts of a track. Most "pro" cuts are this: a 3–5 frame accent, not a long effect
how: at the cut time, 2–3 frames of white flash (alpha decays fast), a decaying camera shake, and an RGB split of the incoming scene. In Stage use `enter:['flash', .15]` + `Cine.shake(t, HITS)`.
```js scene
//@ {"peak":1.12}
const cut = 1.0, d = lt - cut, k = d >= 0 ? Math.exp(-d * 11) : 0, sh = K.shake(Math.max(0, d), 26 * u * k, 30, 2);
g.save(); g.translate(sh[0], sh[1]); if (lt < cut) c.A(g); else { c.B(g); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5 * k; g.translate(8 * u * k, 0); c.B(g); } g.restore();
g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(255,255,255,' + (d >= 0 ? .95 * Math.exp(-d * 20) : 0) + ')'; g.fillRect(0, 0, W, H);
```
