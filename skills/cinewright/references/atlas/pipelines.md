# Pipelines — the glue patterns that make a film feel like one piece

The atlas families above are *what* to draw. These are *how to wire it together*: patterns discovered while building the Avorythm film (`references/case-studies/avorythm/`) that every serious film needs and that no single library function hides.
Most are 5–15 lines. The runnable ones render in `atlas.mjs sheet`; the rest are reference code.

## pipe-global-atmosphere — One foreground layer over every scene
tags: pipeline atmosphere dust particles foreground stage render post overlay global depth
use: ambient dust/bokeh/sparks that drift across ALL scenes (including during transitions) so the film has one consistent air; the cheapest way to lift every static-ish 2D scene
how: let Stage compose the frame without finishing it (`S.render(t, false)` returns the merged look), draw the particles straight into the HDR target, then finish with Post yourself. The dust sits above the scenes and below grain/bloom, and a defocus (`dof`) turns the big ones into bokeh.
```js
const DUST = new Parts.Emitter(gfx, { count: 8000 });                 // build once
DUST.stream({ t0: 0, t1: DUR, n: 6000, spawn: { box: [W * 1.3, H * 1.2, 900] }, speed: [14 * u, 60 * u], life: [4, 8], dir: [0, 1, 0], angle: 1.4, flow: 70 * u, size: [1.2, 4.5], colors: ['#9fb4ff', '#ffffff', '#9ff7ff'], loop: true, glow: .35, drag: .3 });
function renderFrame(t) { const look = S.render(t, false); DUST.draw({ t, dof: { amount: 1, focus: 0 } }, {}); post.end(look); }
```

## pipe-camera-per-scene — A different slow move for every scene
tags: pipeline camera stage cine path keyframes push drift roll per scene motion energy
use: gives every scene its own camera gesture (push, pull-out, drift, roll) without hand-animating each draw function; the single biggest cure for "slideshow" energy warnings
how: build one keyframed path from scene start/end times (`T.*` from the cues) and mix it with the hit punches/shakes. The path interpolates across the cut in 2 ms, which the transition hides.
```js
const camKeys = []; const move = (a, b, z0, z1, x0 = 0, x1 = 0, y0 = 0, y1 = 0, r0 = 0, r1 = 0) => camKeys.push({ t: a + .001, zoom: z0, x: x0, y: y0, rot: r0 }, { t: b - .001, zoom: z1, x: x1, y: y1, rot: r1 });
move(T.open, T.hero, 1.0, 1.09, -.006, .006); move(T.hero, T.poster, 1.0, 1.04, -.01, .01, 0, 0, .004, -.004); move(T.poster, T.city, 1.03, 1.0); move(T.end, DUR, 1.0, 1.06);
const baseCam = Cine.path(camKeys, { ease: 'inOutSine' });
S.camera = t => Cine.mix(baseCam(t), Cine.punch(t, HITS, { amp: .016 }), Cine.shake(t, HITS, { amp: .007 }), Cine.handheld(t, { amp: .0035, roll: .004 }));
```

## pipe-2d-through-filter — Run any 2D scene through a shader filter
tags: pipeline filter 2d canvas vhs ascii mosaic crt look scene gl cheap
use: a scene drawn with canvas 2D that should look like VHS (the "problem" scene), ASCII (the machine's view), a mosaic (shatter-in), a CRT… without rewriting it in GLSL
how: draw into an offscreen canvas (opaque background!), then `fx.filterCanvas(cv, name, params, { to: rt })` in a Stage `gl` scene; captions drawn in the scene's own `draw` stay crisp because they are composited afterwards. Animate the filter parameters (e.g. VHS amount fading to 0 at the moment the problem is solved).
```js gl
//@ {"peak":1.5,"look":{"bloom":0.4,"grain":0.06}}
const cv = store.cv ||= K.canvas(W, H), k = cv.getContext('2d'); k.setTransform(1, 0, 0, 1, 0, 0); k.globalCompositeOperation = 'source-over'; c.paint(k);
fx.filterCanvas(cv, 'vhs', { amt: 1.2 - .9 * K.prog(lt, 1, 2.8) }, { to: rt });
```

## pipe-logo-cutout — A PNG logo on white becomes a transparent mark (and particles)
tags: pipeline logo png keying transparent brand image particles cutout white background
use: the client's logo exists only as a PNG on white; you need it on dark backgrounds, glowing, and dissolving into particles
how: `K.keyWhite(img, { size, lo, hi, recolor })` turns whiteness into transparency (and can re-map colours — e.g. lift a navy part to white); draw the result with a shadow glow; `Parts.image(canvas, { height, step })` samples it into coloured particle targets for a morph. Load the PNG with `K.loadImages({ logo: 'assets/logo.png' })` inside `window.ready`.
```js scene
//@ {"peak":1.5,"bg":"#05061a","look":{"bloom":0.7}}
const src = store.src ||= (() => { const c0 = K.canvas(600, 600), q = c0.getContext('2d'); q.fillStyle = '#fff'; q.fillRect(0, 0, 600, 600); q.lineWidth = 60; q.lineCap = 'round';
  q.strokeStyle = '#6a2fff'; q.beginPath(); q.arc(300, 300, 190, 2.2, 4.2); q.stroke(); q.strokeStyle = '#40f5f5'; q.beginPath(); q.arc(300, 300, 190, -.9, 1.1); q.stroke(); q.fillStyle = '#0a1155'; K.star(q, 300, 300, 110, 46, 4); q.fill(); return c0; })();
const logo = store.logo ||= K.keyWhite(src, { size: 520, recolor: (r, g, b) => (Math.max(r, g, b) < 150 && b > r * 1.8 ? [225, 233, 255] : null) });
const s = H * .7 * K.E.outBack(K.prog(lt, 0, .8)); g.save(); g.shadowColor = 'rgba(120,110,255,.8)'; g.shadowBlur = 50 * u * 2; g.drawImage(logo, W / 2 - s / 2, H / 2 - s / 2, s, s); g.restore();
```

## pipe-3d-pin-2d — Pin 2D beams and labels to a point on a 3D object
tags: pipeline 3d 2d toscreen pin label beam overlay hud annotate projection layering
use: callouts, laser beams, sound waves entering/leaving a 3D object, HUD labels that follow a rotating model; the engine's depth ordering is 3D-only, so you choose the layering yourself
how: set `S3.cam` for the frame, then `S3.toScreen([x,y,z])` gives pixel coordinates (always from the current camera). Draw beams into a 2D layer and composite it BEFORE the 3D render (beams go behind the object) or AFTER (labels in front); `gfx.blit(S3.render({clear:[0,0,0,0]}), {to: rt, blend:'alpha'})` keeps the background visible.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.45,"threshold":0.9}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }); S.env = Env.studio({ colors: ['#080a2a', '#8aa0e8', '#6a3cff', '#2fd6e8'] }); S.light(0, { intensity: .35 }); S.light(1, { intensity: .2 }); S.cam.fov = 30;
  S.prism = S.mesh(Geo.flat(Geo.cylinder(1.35, 1.35, 3.6, 3, true)), Mat.chrome({ base: '#dfe8ff', rough: .06, rim: '#7feaff', rimAmt: .75, rimPow: 2.6 }), { scale: [.66, .66, .66] }); return S; })();
fx.bg('aurora', { c: ['#03041a', '#6a2fff', '#40f5f5', '#8d6bff'], speed: 1.1, amt: .85 }, { to: rt });
S.prism.rot = [Math.PI / 2 - .38, .55 + .3 * Math.sin(lt * 1.1), .28 * lt]; S.cam.pos = [Math.sin(lt * .9) * 2.2, .35, 8.8]; S.cam.target = [0, 0, 0];
const [x0, y0] = S.toScreen([-.42, 0, 0]), [x1, y1] = S.toScreen([.46, 0, 0]);
const L = store.L ||= K.canvas(W, H), q = L.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, W, H); q.globalCompositeOperation = 'lighter'; q.lineCap = 'round';
for (const [w, a] of [[26, .08], [10, .25], [4, 1]]) { q.lineWidth = w * u * 2; q.strokeStyle = `rgba(235,240,255,${a})`; q.beginPath(); q.moveTo(0, y0); q.lineTo(x0, y0); q.stroke(); }
for (let i = 0; i < 4; i++) { const ty = H * (.2 + i * .2), col = ['#6a2fff', '#40f5f5', '#a58bff', '#9ff7ff'][i]; for (const [w, a] of [[18, .1], [6, .4], [3, 1]]) { q.lineWidth = w * u * 2; q.strokeStyle = K.rgba(col, a); q.beginPath(); q.moveTo(x1, y1); q.bezierCurveTo(x1 + W * .1, y1, W * .7, ty, W * .78, ty); q.stroke(); } }
gfx.layer(L, { to: rt }); gfx.blit(S.render({ clear: [0, 0, 0, 0] }), { to: rt, blend: 'alpha' });
```

## pipe-procedural-footage — Fake "video" for UI scenes, drawn in code
tags: pipeline footage video placeholder procedural player screen content ui explainer aurora hills moon
use: a UI scene needs moving picture inside a player/browser/phone and you have no footage: generate it — a night sky with aurora ribbons, a moon, parallax hills — so the UI looks alive and on-brand; `tint` 0 → grey (an un-translated, meaningless video) … 1 → full colour (after the product "turns it on")
how: clip to the video rectangle; gradient sky, three sine ribbons with `lighter`-like translucent strokes, a glow + disc moon, two noise hills. The `saturation` composite mode desaturates the whole thing in one fill — animate `tint` to make the "colour floods in" moment.
```js scene
//@ {"peak":2.2,"bg":"#05061a"}
const x = W * .15, y = H * .12, w = W * .7, h = w * 9 / 16, tint = K.prog(lt, .8, 2.4), t2 = lt * 2.4;
g.save(); g.beginPath(); K.rr(g, x, y, w, h, 18 * u * 2); g.clip(); const sky = g.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#0b1240'); sky.addColorStop(.6, '#2a2c7a'); sky.addColorStop(1, '#6a2fff'); g.fillStyle = sky; g.fillRect(x, y, w, h);
for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 40; i++) { const px = x + w * i / 40, py = y + h * (.34 + .08 * k + .09 * Math.sin(i * .33 + t2 * (.6 + k * .2) + k * 2)); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.strokeStyle = ['rgba(64,245,245,.6)', 'rgba(130,90,255,.65)', 'rgba(170,205,255,.4)'][k]; g.lineWidth = h * .05; g.lineCap = 'round'; g.stroke(); }
K.glow(g, x + w * .74, y + h * .26, h * .3, '#cfe8ff', .55); g.fillStyle = '#eaf3ff'; K.circle(g, x + w * .74, y + h * .26, h * .06); g.fill();
[['#0a0f33', .7, .07, 1.2], ['#05061a', .84, .07, 3.4]].forEach(([c, y0, amp, sd]) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y + h); for (let i = 0; i <= 60; i++) g.lineTo(x + w * i / 60, y + h * (y0 - amp * (.5 + .5 * K.noise1(i * .13 + sd + t2 * .1)))); g.lineTo(x + w, y + h); g.fill(); });
g.globalCompositeOperation = 'saturation'; g.globalAlpha = 1 - tint; g.fillStyle = 'hsl(0,0%,50%)'; g.fillRect(x, y, w, h); g.restore();
```

## pipe-cue-events — Name every sound-and-picture event in the cues
tags: pipeline cues sync audio events timeline names clicks bells hits one timeline picture sound
use: any moment where the picture and the soundtrack must meet exactly — a click, a label pop-in, a logo chime. Hard-coded seconds drift apart the moment you retime a scene
how: put scene starts AND in-scene events in `<script id="cues">` (`"click": 7.5, "o1": 9.7, "o2": 9.9`), read them in the page (`T.click`) and in `audio.mjs` (`T.click`) — change one number and both move. Derive in-scene animation times from them (`lt = t − T.click`), never the other way round. `markers` for contact sheets are created from the same table, so every event is reviewable.
```js
// video.html: UI.cursor(g, lt, path, [T.click - T.tab], …)        audio.mjs: s.click(T.click, { vel: .8 }); s.success(T.click + .07);
// cues:  { "t": { "tab": 4, "click": 7.5, "prism": 8, "o1": 9.7 }, "hits": [0.8, 4, 8, 12] }
```

## pipe-direction-theme — Left/right as meaning (bilingual films)
tags: pipeline direction rtl ltr bilingual persian english left right source target colour twist concept
use: films about translation, two languages, two parties, before/after — give each side a colour and a direction and let EVERY scene be a negotiation between them (the Avorythm film: violet = source, enters left→right; cyan = target, enters right→left in Persian RTL; the logo is the two locked together)
how: decide the two tokens (colour + side + reading direction) in the style bible; apply them to transitions (`dir`), text entrances (`K.words` already reads Persian right→left), sound panning (source voice left, answer right), UI placement (source panel left, result panel right) and the final lock-up. Rules: never mix the two colours in one element until the payoff; one side may appear alone at the start (the "problem").
