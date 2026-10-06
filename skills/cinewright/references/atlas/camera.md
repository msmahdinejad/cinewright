# Camera — the difference between "slides" and "film"

A camera that never moves makes a slideshow, even with great graphics. Every scene should have **some** camera motion all the time (a slow push-in is enough) and **one clear move** at its important moment.
2D scenes get a virtual camera through `Stage.camera = t => ({ zoom, rot, x, y })` (uv units) built from `Cine` helpers (`Cine.path` keyframes, `Cine.punch` pulses on hits, `Cine.shake`, `Cine.handheld`, `Cine.ramp` speed ramps, `Cine.mix` to layer them);
3D scenes move `S.cam.pos/target/fov` (`Cam3.orbit`, `Cam3.path`, `Cam3.shake`). Rules of thumb: moves should ease in and out (`inOutCubic`), a push-in is calm and a whip is energy, always move *toward* what matters,
add a micro handheld drift to anything that is "real", and put a subtle punch (+1.5–3 % scale, 0.2 s) on every hit. In the recipes below the camera is applied with `K.camera(g, W, H, {…})` (2D) or on a `Scene3D` (3D). Use `--strip` to see motion: `atlas.mjs sheet cam-push-in --strip`.

## cam-push-in — Slow push-in with ease
tags: camera push in dolly zoom calm 2d cinematic cheap
use: the default for any held beat (titles, product, quotes): the frame is never dead; the move tells the viewer where to look
how: `Cine.path(keys)` interpolates {zoom, x, y, rot} between keyframes with easing; start slightly zoomed (1.0) and end at 1.08–1.15. Drift x/y a little so it is not a flat scale.
```js scene
//@ {"peak":2.0}
const cam = Cine.path([{ t: 0, zoom: 1.0, x: -.015, y: .01 }, { t: 3, zoom: 1.14, x: .01, y: -.01 }], { ease: 'inOutCubic' })(lt);
K.camera(g, W, H, { zoom: cam.zoom, x: cam.x * W, y: cam.y * H, rot: cam.rot }); c.paint(g);
```

## cam-punch-hits — Punch + shake on every hit
tags: camera punch shake hits beat impact rhythm 2d music cheap
use: sync the picture to the music: every kick/snare/word-slam gets a 0.2 s scale pop and a short shake; this single trick makes any scene feel "edited to the beat"
how: `Cine.punch(t, HITS, {amp, decay})` + `Cine.shake(t, HITS, {amp, decay, freq})`, layered with `Cine.mix`. HITS = the same cue times your audio uses (read them from the shared `<script id="cues">`).
pair: sound recipes `sfx-hit-stack`, `word-slam`
```js scene
//@ {"peak":1.3}
const HITS = [.5, 1.0, 1.5, 2.0, 2.5], cam = Cine.mix(Cine.punch(lt, HITS, { amp: .035, decay: .22 }), Cine.shake(lt, HITS, { amp: .012, decay: .2 }), { zoom: 1.04 });
K.camera(g, W, H, { zoom: cam.zoom, x: cam.x * W, y: cam.y * H, rot: cam.rot }); c.paint(g);
```

## cam-handheld — Hand-held drift and Dutch tilt
tags: camera handheld drift tilt dutch roll organic documentary 2d cheap
use: make 2D/3D feel photographed (documentary, UI-as-reality); a Dutch tilt (3–8°) adds unease or energy
how: `Cine.handheld(t, {amp, speed, roll})` is smooth noise (not random jitter); combine with a slow roll via `Cine.path`.
```js scene
//@ {"peak":1.5}
const cam = Cine.mix(Cine.handheld(lt, { amp: .006, speed: .9, roll: .006 }), Cine.path([{ t: 0, rot: 0, zoom: 1.12 }, { t: 3, rot: .09, zoom: 1.16 }])(lt));
K.camera(g, W, H, { zoom: cam.zoom, x: cam.x * W, y: cam.y * H, rot: cam.rot }); c.paint(g);
```

## cam-whip-pan — Whip pan with motion blur
tags: camera whip pan fast blur transition energy 2d cheap
use: a fast sideways move between two beats — the camera "snaps" to the next scene; stronger than a slide, cheaper than any 3D
how: ease the x-offset hard (`inOutExpo`), draw 8 copies at slightly earlier times with decreasing alpha (cheap directional blur). In a Stage, the `whip` transition does this on the GPU.
```js scene
//@ {"peak":1.25}
const xAt = tt => -W * 1.0 * K.E.inOutExpo(K.prog(tt, 1.0, 1.5)); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
for (let k = 9; k >= 0; k--) { const tt = lt - k * .012; g.save(); g.globalAlpha = k ? .16 : 1; g.translate(xAt(tt), 0); c.A(g); g.translate(W, 0); c.B(g); g.restore(); }
```

## cam-speed-ramp — Slow-motion around the impact
tags: camera speed ramp slow motion time remap impact hero 2d cheap
use: freeze-ish emphasis (the moment a ball hits, a logo lands, a word slams) — run at 100 %, ramp to 15–30 % for ~0.4 s, ramp back; sells weight like nothing else
how: `Cine.ramp(t, [[videoTime, sceneTime], …])` returns scene time; evaluate your animation at that time instead of `t`. Slope < 1 = slow-mo. Everything inside the scene (particles, shakes) must also use the remapped time.
```js scene
//@ {"peak":1.5}
const T = Cine.ramp(lt, [[0, 0], [.9, .9], [1.15, .98], [1.9, 1.12], [2.2, 1.3], [3, 2.1]]), hitAt = 1.1, x = W * (.1 + .8 * K.E.inCubic(Math.min(1, T / hitAt)));
c.B(g); K.trail(g, tt => [W * (.1 + .8 * K.E.inCubic(Math.min(1, tt / hitAt))), H * .5], T, { span: .25, n: 20, width: 40 * u, color: '#ffd23f' });
K.circle(g, x, H * .5, 46 * u); g.fillStyle = '#fff'; g.fill(); K.sparks(g, T - hitAt, W * .9, H * .5, { n: 90, life: 1.2, speed: 900 * u, color: ['#ffd23f', '#fff'], width: 3 * u, spread: 2.6, angle: Math.PI });
K.text(g, 'SLOW-MO', W / 2, H * .85, { size: H * .06, weight: 800, spacing: 12 * u, fill: '#fff', alpha: K.prog(lt, .9, 1.2) * (1 - K.prog(lt, 2.3, 2.7)) });
```

## cam-parallax-layers — 2.5D depth from flat layers
tags: camera parallax layers 2.5d depth paper cutout drift 2d cheap
use: illustrated/flat scenes that need depth: landscapes, skylines, paper-cut worlds, title cards over layered art
how: `Cine.parallax(g, layers, camX, camY)` shifts every layer by `depth × camera` (0 = far, barely moves; 1 = camera plane; > 1 = foreground, moves more). Four layers + a slow horizontal move is a whole scene.
```js scene
//@ {"peak":1.5}
const hill = (col, y0, amp, seed, depth) => ({ depth, draw: g => { g.fillStyle = col; g.beginPath(); g.moveTo(-W, H); for (let x = -W; x <= 2 * W; x += 10) g.lineTo(x, H * y0 - amp * H * K.noise1(x / W * 2.2 + seed)); g.lineTo(2 * W, H); g.fill(); } });
g.fillStyle = K.gradient(g, 0, 0, 0, H, [[0, '#20154a'], [.6, '#e0508a'], [1, '#ffb070']]); g.fillRect(0, 0, W, H); K.glow(g, W * .62, H * .55, H * .5, '#ffcf90', .8);
Cine.parallax(g, [hill('#6a3a8a', .66, .09, 1.3, .15), hill('#432468', .74, .1, 4.1, .4), hill('#27144a', .84, .09, 7.7, .8), hill('#0e0720', .96, .08, 2.2, 1.6)], lt * 70 * u, 0);
```

## cam-orbit-3d — Orbit around a hero object
tags: camera orbit 3d hero chrome dolly elevation dof cinematic medium
use: the standard 3D hero move: slow orbit + slight rise + slight push; reveals reflections changing on chrome/gold/glass, which is what makes 3D look 3D
how: `Cam3.orbit(t, {center, radius, speed, elev, phase, height, wobble})` returns {pos, target}; ease the radius and elevation (not just the angle) so it isn't a turntable; keep `dof.focus` equal to the camera distance.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.5}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }); S.env = Env.studio({ colors: ['#08080c', '#fff1dc', '#7a5cff', '#27f0ff'] }); S.floor({ y: -1.7, color: '#08080c', reflect: .4, fade: .03 }); S.cam.fov = 32; S.mesh(Geo.torusKnot({ radius: 1.3, tube: .4 }), Mat.chrome()); return S; })();
const r = 8.5 - lt * .5, cam = Cam3.orbit(lt, { center: [0, -.1, 0], radius: r, speed: .6, elev: .1 + .1 * lt, phase: .6 }); S.cam.pos = cam.pos; S.cam.target = cam.target;
return S.render({ clear: [.02, .02, .035, 1], dof: { focus: r, range: 3, blur: 7 } });
```

## cam-dolly-zoom — The vertigo effect
tags: camera dolly zoom vertigo fov perspective 3d tension drama medium
use: a moment of realisation, "the world changes around the subject", tension; the subject stays the same size while the background stretches
how: move the camera back/forward while changing `fov` so that `2·d·tan(fov/2)` stays constant. Place objects at different depths behind the subject so the perspective change is visible.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.5}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }); S.env = Env.night({ colors: ['#05040c', '#ff4fa3', '#3ad7ff', '#7b4bff'] }); S.sky = { amt: .6, rough: .2 }; S.floor({ y: -1.5, color: '#07060c', reflect: .35, fade: .02 });
  S.mesh(Geo.flat(Geo.icosphere(1.1, 1)), Mat.chrome()); for (let i = 0; i < 14; i++) S.mesh(Geo.box(.8, 2 + (i % 4), .8), Mat.pbr({ base: '#1a1030', metal: .3, rough: .3, coat: .5, windows: { on: .5, size: [.3, .4], color: '#ffd9a0' } }), { pos: [(i % 2 ? 1 : -1) * (2.4 + (i >> 1) * .5), (1 + (i % 4)) - 1.5, -3 - i * 1.6] }); return S; })();
const d = 14 - 8 * K.E.inOutCubic(K.prog(lt, 0, 3)); S.cam.pos = [0, .3, d]; S.cam.target = [0, 0, 0]; S.cam.fov = 2 * Math.atan(3.1 / d) * 180 / Math.PI;
return S.render({ dof: { focus: d, range: 4, blur: 6 } });
```

## cam-rack-focus — Pull focus from near to far
tags: camera rack focus dof depth of field pull cinematic 3d medium
use: direct attention without cutting: first the foreground object is sharp, then the focus slides to the one behind it (and the story with it)
how: `S.render({ dof: { focus, range, blur } })` — animate `focus` (world units from the camera) with `Cine.track(t, [[0, near], [1.4, far]])`. A small `range` (0.6–1.2) and large `blur` (12–18 px) gives the shallow, lens-like look.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.6}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }); S.env = Env.studio({ colors: ['#08080c', '#fff1dc', '#ff4d6d', '#27f0ff'] }); S.sky = { amt: .2, rough: .4 }; S.floor({ y: -1.4, color: '#08080c', reflect: .35, fade: .03 }); S.cam.fov = 30; S.cam.pos = [0, .5, 10]; S.cam.target = [0, 0, 0];
  S.near = S.mesh(Geo.sphere(.9, 48), Mat.gold(), { pos: [-1.6, -.2, 3] }); S.far = S.mesh(Geo.torusKnot({ radius: .9, tube: .28 }), Mat.chrome(), { pos: [2.0, .1, -5] }); S.mid = S.mesh(Geo.icosphere(.5, 2), Mat.plastic({ base: '#ff4d6d' }), { pos: [.2, -.8, -1] }); return S; })();
S.far.rot = [lt * .4, lt * .6, 0]; const f = Cine.track(lt, [[0, 7], [1.0, 7], [2.0, 15], [3, 15]]);
return S.render({ dof: { focus: f, range: .9, blur: 16 } });
```

## cam-flythrough-gates — Fly through a path of gates
tags: camera flythrough path gates rings catmull spline speed 3d neon medium
use: journeys and progress ("step 1 → 2 → 3"), levels, tunnels with turns; a camera path you can author with five points
how: `Cam3.path(points, u)` is a Catmull-Rom spline; set `pos = path(u)` and `target = path(u + .04)`. Place rings along the spline so the viewer feels the route. Add a little `Cam3.shake` for energy.
```js gl
//@ {"peak":1.5,"look":{"bloom":1.0,"zoomBlur":0.08}}
const P = [[0, 0, 4], [1.2, .5, -6], [-1.4, -.2, -16], [1.0, .6, -27], [-.8, 0, -38], [0, .3, -50]];
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }); S.env = Env.night(); S.sky = { amt: 0 }; S.fog = { color: '#02030a', density: .03 }; S.cam.fov = 66;
  for (let i = 0; i < 34; i++) S.mesh(Geo.torus(2.1 + .25 * Math.sin(i), .055, 96, 10), Mat.emissive(['#27f0ff', '#ff4fd8', '#ffd23f'][i % 3], 1.5), { pos: Cam3.path(P, i / 33), rot: [Math.PI / 2, 0, 0] }); return S; })();
const u2 = .06 + lt * .22, sh = Cam3.shake(lt, .04, 8); S.cam.pos = Cam3.path(P, u2).map((v, i) => v + sh[i]); S.cam.target = Cam3.path(P, u2 + .05); S.cam.up = [Math.sin(lt) * .15, 1, 0];
return S.render({ clear: [.01, .012, .03, 1] });
```

## cam-crane-reveal — Rise from the floor to reveal
tags: camera crane rise reveal hero 3d text floor reflection cinematic medium
use: opening reveals of a title/logo/product: start low (floor-level, looking up, object looming) and rise while the camera tilts down onto it
how: animate camera height from just above the floor to 4–5 units with an ease-out while the target stays on the object and the radius grows slightly. Floor reflections make the low start spectacular.
```js gl
//@ {"peak":1.8,"look":{"bloom":0.6}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }); S.env = Env.studio({ colors: ['#08080c', '#fff1dc', '#ff3d8b', '#38d6ff'] }); S.floor({ y: -1.5, color: '#07070b', reflect: .55, fade: .02 }); S.fog = { color: '#06060a', density: .02 }; S.cam.fov = 34; S.word = S.mesh(Geo.text('RISE', { height: 2.4 }), Mat.chrome()); return S; })();
const e = K.E.outCubic(K.prog(lt, 0, 3)); S.cam.pos = [Math.sin(lt * .5) * 2.5, -1.15 + 5.2 * e, 10.5 + 2.5 * e]; S.cam.target = [0, .1, 0];
return S.render({ clear: [.012, .012, .02, 1], dof: { focus: 11 + 2 * e, range: 3.5, blur: 8 } });
```
