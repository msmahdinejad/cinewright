# Particles — tens of thousands of points, closed-form, deterministic

Two GPU systems (`Parts.Morph` for shape-to-shape flows, `Parts.Emitter` for bursts / streams / ambience) plus cheap 2D helpers (`K.sparks`, `K.confetti`, `K.field`, `K.trail`).
All motion is a pure function of time — a frame renders alone, in any worker, in any order. Coordinates are **pixels from the frame centre** (y up): multiply by `u = H/1080` (or use `Math.min(W,H)`) so one design fits 16:9, 9:16 and 1:1.
Particles are additive light: they need a dark-ish background and Post bloom ≥ 0.8 to feel luminous. Never put thousands of small draws with `globalCompositeOperation` on a GPU 2D canvas — that is what these are for.

## particles-morph-word — Smoke becomes a word, then another word, then an object
tags: particles morph text logo reveal persian-ok hero gpu medium
use: brand/logo reveals, "chaos → order" metaphors, translating one word into another (English → Persian is the perfect demo of this engine)
how: `M.shapes([cloud, text A, text B, mesh])` uploads target point sets once; `progress` 0…N−1 moves continuously through them (1.4 = 40 % of the way from shape 1 to 2). In between, particles swirl on curl noise (`flow`), sorted so the move sweeps coherently. Persian points keep correct letter shapes (it samples the real rendered text).
pair: bg-aurora/bg-nebula behind, text3d-chrome as the "solid" finale, sfx riser into the word forming
avoid: fewer than 30 000 points for text (letters turn grainy); leaving the word half-formed for the whole beat — hold the formed shape ≥ 0.5 s
```js gl
//@ {"peak":1.0,"look":{"bloom":0.9}}
const M = store.M ||= (() => { const N = 50000, M = new Parts.Morph(gfx, { count: N });
  M.shapes([Parts.cloud(N, { w: W * 1.2, h: H }), Parts.text('AVORYTHM', { height: H * .2, n: N }), Parts.text('آووریتم', { height: H * .24, n: N }), Parts.mesh(Geo.torusKnot(), { scale: H * .2, n: N })]); return M; })();
fx.bg('nebula', { c: ['#010108', '#0e0a30', '#2a1a78', '#5a4ad0'], speed: .6, amt: .2 }, { to: rt });
M.draw({ progress: lt, t: lt, colors: ['#7a5cff', '#27f0ff'], flow: 220 * u, size: 1.7, glow: .14, cam: { yaw: lt > 2 ? (lt - 2) * .8 : 0 } }, { to: rt });
```

## particles-dissolve — A word disintegrates into dust
tags: particles dissolve disintegrate text logo exit outro gpu medium
use: exits and transitions ("it all dissolves into the next scene"), emotional endings, the Thanos snap
how: same Morph, shapes `[text, cloud]` and a high `flow` + `spread`: particles leave in a wave from one side with curl-noise drift. Run it in reverse (`progress = 1 − p`) for a reassembly.
```js gl
//@ {"peak":1.3,"look":{"bloom":0.9}}
const M = store.M ||= (() => { const N = 45000, M = new Parts.Morph(gfx, { count: N }); M.shapes([Parts.text('FADE AWAY', { height: H * .22, n: N }), Parts.cloud(N, { w: W * 1.4, h: H * 1.1, d: 800 })]); return M; })();
fx.bg('gradient', { c: ['#06070d', '#12163a', '#241a4a', '#06070d'], speed: .2 }, { to: rt });
M.draw({ progress: K.prog(lt, .4, 2.6), t: lt, colors: ['#ffe9b8', '#ff8a5c'], flow: 520 * u, spread: .7, size: 1.5, glow: .16 }, { to: rt });
```

## particles-burst-spark — Explosion of sparks
tags: particles burst explosion sparks impact fire hit emitter gpu cheap
use: the loud beat (logo hit, drop, "boom"), cut on impact, anything that needs a physical exclamation mark
how: `E.burst({t0, n, speed:[min,max], drag, gravity, life, size, colors})` — closed-form with drag, so no state. Layer 2–3 bursts: hard sparks, big soft flashes, slow embers. Add a Post `shock` ring and `flash` for the first 3 frames.
pair: cam-punch-hits (shake), sfx impact+sub drop, trans-flash
avoid: bursting continuously — one hit, then silence/space
```js gl
//@ {"peak":0.75,"look":{"bloom":1.2}}
const E = store.E ||= (() => { const E = new Parts.Emitter(gfx, { count: 20000 });
  E.burst({ t0: .3, n: 9000, speed: [260 * u, 1400 * u], drag: 2.4, gravity: [0, -380 * u, 0], life: [.9, 1.8], size: [1.4, 5], colors: ['#fff2c4', '#ff9a3c', '#ff3d3d'] });
  E.burst({ t0: .3, n: 700, speed: [60 * u, 420 * u], drag: 1.4, life: [.5, 1.1], size: [5, 11], colors: ['#ffffff', '#ffcf80', '#ff7a3c'], glow: .8 }); return E; })();
fx.bg('gradient', { c: ['#050308', '#1a0a1e', '#3a1228', '#050308'], speed: .1, amt: .8 }, { to: rt });
E.draw({ t: lt }, { to: rt });
return rt;
```

## particles-confetti — Confetti cannons (true colours)
tags: particles confetti celebration party gravity flip colours 2d cheap
use: wins, launches, "it worked", birthdays, the end of an explainer's happy path
how: `K.confetti(g, p, x, y, {n, life, speed, gravity, colors, size, angle, spread, seed})` — rectangles that flip, spin and fall, closed-form from `p` = seconds since the pop. Two cannons from the bottom corners, the second 0.25 s later. The GPU emitter is additive light (glows), so it can't show true colours — use this for confetti.
pair: sfx success chime + pop, a big word-slam
```js scene
//@ {"peak":1.1,"bg":"#14163a"}
const cols = ['#ff4d6d', '#ffd23f', '#27f0ff', '#7a5cff', '#7dff9b', '#ffffff'];
K.confetti(g, lt - .2, W * .12, H * 1.02, { n: 110, life: 2.6, speed: 1500 * u, gravity: 1700 * u, colors: cols, size: 20 * u, angle: -1.15, spread: .9, seed: 1 });
K.confetti(g, lt - .45, W * .88, H * 1.02, { n: 110, life: 2.6, speed: 1500 * u, gravity: 1700 * u, colors: cols, size: 20 * u, angle: -2.0, spread: .9, seed: 2 });
K.text(g, 'IT WORKED', W / 2, H / 2, { size: H * .16, weight: 900, fill: '#fff', alpha: K.prog(lt, 0, .3) });
```

## particles-dust-ambient — Floating dust in light shafts
tags: particles dust ambient atmosphere rays light shafts bokeh calm emitter gpu cheap
use: depth and air behind almost any scene; makes a static background feel photographed; hero/product/quiet moments
how: a looping `stream` over a big box with slow drift, tiny sizes, depth-of-field bokeh (`dof`) and a `rays` shader behind. Looks best at 3–6 % brightness — atmosphere, not decoration.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.7}}
const E = store.E ||= (() => { const E = new Parts.Emitter(gfx, { count: 8000 });
  E.stream({ t0: 0, t1: 12, n: 5000, spawn: { box: [W * 1.3, H * 1.1, 700] }, speed: [8 * u, 30 * u], life: [5, 9], dir: [0.3, 1, 0], angle: 1.4, flow: 40 * u, size: [1, 4], colors: ['#fff4dc', '#ffe0a8', '#bcd6ff'], loop: true, glow: .8 }); return E; })();
fx.bg('rays', { c: ['#04050c', '#2a3a7a', '#ffd9a0', '#ffffff'], speed: .25, amt: .22, center: [.8, 1.1] }, { to: rt });
E.draw({ t: lt + 3, dof: { amount: 1, focus: 0 } }, { to: rt });
return rt;
```

## particles-fireflies — Slow glowing fireflies
tags: particles fireflies glow night calm magic dreamy emitter gpu cheap
use: dreamy night scenes, "magic", forests, a gentle loop under a title
how: few, big, soft, warm particles with strong curl-noise `flow` and long life; DOF makes them bokeh. Contrast with a deep blue/green gradient.
```js gl
//@ {"peak":1.5,"look":{"bloom":1.1}}
const E = store.E ||= (() => { const E = new Parts.Emitter(gfx, { count: 3000 });
  E.stream({ t0: 0, t1: 12, n: 220, spawn: { box: [W * 1.1, H * .9, 600] }, speed: [10 * u, 40 * u], life: [4, 8], dir: [0, 1, 0], angle: 3, flow: 160 * u, size: [6, 16], colors: ['#d8ff6a', '#8aff9a', '#ffe98a'], loop: true, glow: 1.3 }); return E; })();
fx.bg('gradient', { c: ['#020a0a', '#07241f', '#0b3a34', '#030a10'], speed: .15, amt: .9 }, { to: rt });
E.draw({ t: lt + 2, dof: { amount: 1, focus: 0 } }, { to: rt });
return rt;
```

## particles-snow-rain — Snow, rain, falling things
tags: particles snow rain weather falling streaks atmosphere emitter gpu cheap
use: mood weather, winter/rainy tones, "falling" metaphors (data, letters, stars); rain = long motion-blur streaks, snow = soft slow dots
how: emit from a wide box above the frame along `dir`, with `flow` for wind. Rain = high `speed` + a long `shutter` (streaks) — streaks spread their light, so raise `size` and `glow` (≈ 5) or they vanish; snow = low speed, round soft dots, `flow` for drift.
```js gl
//@ {"peak":1.4,"look":{"bloom":0.5}}
const E = store.E ||= (() => { const E = new Parts.Emitter(gfx, { count: 16000 });
  E.stream({ t0: 0, t1: 12, n: 9000, spawn: { box: [W * 1.4, 40, 900] }, pos: [0, H * .62, 0], speed: [1500 * u, 2300 * u], drag: 0, life: [.5, .8], dir: [-.12, -1, 0], angle: .03, size: [3, 5], colors: ['#bcd8ff', '#e8f1ff'], loop: true, glow: 5 }); return E; })();
fx.bg('clouds', { c: ['#05070f', '#14203a', '#2a3a5a', '#4a5a7a'], speed: .3, amt: .6 }, { to: rt });
E.draw({ t: lt + 1, shutter: 1 / 18 }, { to: rt });
return rt;
```

## particles-snow — Soft falling snow with drift
tags: particles snow winter calm falling dreamy soft emitter gpu cheap
use: winter/quiet/emotional moods, "falling" letters or stars, a soft layer over a night-blue gradient or a 3D scene
how: box spawn above the frame + `dir` downward with a wide `angle`, low speed, large soft sprites, `flow` for wind swirl, DOF bokeh on the near flakes. Add a second stream with bigger/blurrier flakes for foreground depth.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.6}}
const E = store.E ||= (() => { const E = new Parts.Emitter(gfx, { count: 9000 });
  E.stream({ t0: 0, t1: 12, n: 3500, spawn: { box: [W * 1.3, 30, 700] }, pos: [0, H * .6, 0], speed: [50 * u, 110 * u], drag: 0, life: [6, 9], dir: [0, -1, 0], angle: .5, flow: 90 * u, size: [2, 6], colors: ['#ffffff', '#dfe9ff'], loop: true, glow: 1.4 }); return E; })();
fx.bg('gradient', { c: ['#070a18', '#10203c', '#1c3558', '#070a18'], speed: .1 }, { to: rt });
E.draw({ t: lt + 8, dof: { amount: 1, focus: 0 } }, { to: rt });
return rt;
```

## particles-galaxy-swirl — A spiral galaxy of points
tags: particles galaxy spiral swirl space rotate cam morph gpu medium
use: openers and transitions in space/AI/"universe of data" stories; rotating logo-like object made of light
how: `Parts.shape('spiral')` points, slow `cam.yaw/pitch` rotation gives parallax for free, two warm/cool colours blend by position. Add a tilted camera for the galaxy look.
```js gl
//@ {"peak":1.5,"look":{"bloom":1.0}}
const M = store.M ||= (() => { const N = 60000, M = new Parts.Morph(gfx, { count: N }); M.shapes([Parts.shape('spiral', { n: N, r: H * .55, thickness: 60 * (H / 1080) })]); return M; })();
fx.bg('nebula', { c: ['#010108', '#120a40', '#4a1a78', '#1a2a6a'], speed: .3, amt: .15 }, { to: rt });
M.draw({ progress: 0, t: lt, colors: ['#ffb27a', '#6aa8ff'], flow: 0, size: 1.1, glow: .2, wobble: [0, 0], cam: { yaw: lt * .25, pitch: 1.0, dist: 1400 } }, { to: rt });
```

## particles-mesh-surface — A 3D object made of light points
tags: particles mesh surface pointcloud 3d knot hologram rotate gpu medium
use: tech/hologram/scan looks, "data object", a model that should feel digital; reveal by morphing from a cloud
how: `Parts.mesh(geo, {scale, n})` samples points on the surface of any `Geo.*`; rotate with `cam.yaw`; small bright points + glow read as a point cloud scan.
```js gl
//@ {"peak":1.5,"look":{"bloom":1.1}}
const M = store.M ||= (() => { const N = 50000, M = new Parts.Morph(gfx, { count: N }); M.shapes([Parts.cloud(N, { w: W, h: H }), Parts.mesh(Geo.torusKnot({ radius: 1.2, tube: .38 }), { scale: H * .27, n: N })]); return M; })();
fx.bg('gradient', { c: ['#02050a', '#06182a', '#0a2a40', '#02050a'], speed: .2 }, { to: rt });
M.draw({ progress: K.prog(lt, 0, 1.4) , t: lt, colors: ['#27f0ff', '#7affd9'], flow: 180 * u, size: 1.3, glow: .22, wobble: [0, 0], cam: { yaw: lt * .7, pitch: .35 } }, { to: rt });
```

## particles-image-sample — Any picture as coloured particles
tags: particles image pixels icon logo colour sample reveal gpu medium
use: a multi-coloured logo/icon/illustration built from light; "pixel" reveals; turning a drawing into a living object
how: draw anything on a 2D canvas, `Parts.image(canvas, {height, step})` returns points WITH per-point colours; the morph then keeps the artwork's colours (`perColor` is automatic).
```js init
const c = store.art = K.canvas(600, 400), g2 = c.getContext('2d'); const gr = g2.createLinearGradient(0, 0, 600, 400); gr.addColorStop(0, '#ff4d6d'); gr.addColorStop(.5, '#ffd23f'); gr.addColorStop(1, '#27f0ff');
g2.fillStyle = gr; K.rr(g2, 60, 60, 480, 280, 70); g2.fill(); g2.fillStyle = '#10122a'; K.circle(g2, 300, 200, 80); g2.fill(); g2.fillStyle = '#fff'; K.circle(g2, 300, 200, 38); g2.fill();
```
```js gl
//@ {"peak":1.6,"look":{"bloom":0.8}}
const M = store.M ||= (() => { const N = 40000, M = new Parts.Morph(gfx, { count: N }); const img = Parts.image(store.art, { height: H * .72, step: 3 }); M.shapes([Parts.cloud(N, { w: W * 1.2, h: H }), img]); return M; })();
fx.bg('gradient', { c: ['#05060e', '#10122a', '#1a1646', '#05060e'], speed: .2 }, { to: rt });
M.draw({ progress: K.prog(lt, 0, 1.5), t: lt, flow: 200 * u, size: 2.3, glow: .16 }, { to: rt });
```

## particles-comet-trail — A glowing comet with a tapering trail (2D)
tags: particles trail comet path glow sparks 2d cheap
use: guiding the eye along a path (from A to B), "signal travels", loading arcs, drawing a connection between two nodes
how: `K.trail(g, fn, t, {span, n, width, color})` re-evaluates the position function at past times → perfect motion-blur-like trail without any state. Add `K.glow` at the head and a few `K.sparks`.
```js scene
//@ {"peak":1.5,"bg":"#07070f","look":{"bloom":1.1}}
const path = tt => [W * (.12 + .76 * K.E.inOutCubic(K.prog(tt, 0, 2.6))), H * (.5 + .28 * Math.sin(tt * 2.2) * Math.sin(Math.PI * K.prog(tt, 0, 2.6)))];
K.trail(g, path, lt, { span: .55, n: 36, width: 16 * u, color: '#7df9ff' }); const [x, y] = path(lt); K.glow(g, x, y, 90 * u, '#bff6ff', .9);
K.sparks(g, lt - .4, x, y, { n: 40, life: 1.1, speed: 220 * u, drag: 3, color: ['#7df9ff', '#ffffff'], width: 2 * u });
```

## particles-bokeh-field — Soft bokeh lights (2D, cheap)
tags: particles bokeh lights field background glow dreamy 2d cheap
use: a cheap, always-pretty background for titles, lower thirds and end cards; "city lights out of focus"
how: `K.field({n, life, spawn})` is a looping particle field as a pure function of t; draw with `{glow:true}`. Ten lines, thousands of lights.
```js scene
//@ {"peak":1.5,"bg":"#07081a","look":{"bloom":0.8}}
const F = store.F ||= K.field({ n: 160, seed: 3, life: [4, 8], spawn: (i, r) => ({ x: r() * W, y: H * (.2 + r() * .9), vx: (r() - .5) * 20 * u, vy: -(10 + r() * 30) * u, size: (6 + r() * 22) * u, color: K.pick(['#ff6ad5', '#6aa8ff', '#ffd27a', '#7dffea'], r()) }) });
F.draw(g, lt + 3, { glow: true, alpha: .55 });
K.text(g, 'City Lights', W / 2, H / 2, { size: H * .14, weight: 800, fill: '#fff', alpha: .95 });
```
