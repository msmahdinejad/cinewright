# 3D — a real-time engine, no assets, any script (Scene3D)

Everything here is built from code: primitives (`Geo.*`), shiny/glass/toon/holo materials (`Mat.*`), analytic reflection environments (`Env.*`), real floor reflections, fog, depth of field, instancing.
Rules of thumb: **3D sells only with (1) a reflective environment that has contrast, (2) a floor/fog that grounds the object, (3) depth of field, (4) a camera that moves.** Build the Scene3D once
(`store.S ||= …` in recipes, a module-level `const` in a video) — never inside `renderFrame`. Cost: a Scene3D at 1080p ≈ 10–30 ms/frame on integrated graphics; render time is rarely the problem.
Persian/Arabic text works in `Geo.text` exactly like Latin. 3D props that must fit a vertical (9:16) frame: scale them by `W/H` (see the cinema template: `vs = vertical ? .68 : 1`).

## text3d-chrome — Puffy chrome word on a glossy floor
tags: 3d text chrome hero logo floor reflection dof persian-ok medium
use: THE hero shot — brand name / title as a polished 3D object; opening or end card; works for Persian (`Geo.text('سلام')`)
how: `Geo.text` inflates any string into a bevelled mesh; `Mat.chrome()` reflects `Env.studio` (4 colours: floor, key light, two accents). Gentle yaw wobble + slow camera drift + depth of field = "expensive".
pair: bg-nebula, particles-morph-word, cam-orbit-3d, trans-zoomblur
avoid: a plain black background (chrome needs something colourful to reflect: use the studio colours and a shader background behind)
```js gl
//@ {"peak":1.5,"look":{"bloom":0.6}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.studio({ colors: ['#0a0a10', '#fff2dc', '#ff3d8b', '#38d6ff'] }); S.floor({ y: -1.5, color: '#0a0a12', reflect: .5, fade: .02 }); S.cam.fov = 30; S.fog = { color: '#07070d', density: .015 };
  S.word = S.mesh(Geo.text('AURA', { height: 2.5 }), Mat.chrome()); return S; })();
fx.bg('nebula', { c: ['#04030c', '#3b1a8a', '#d8337a', '#ffcf80'], speed: .6 }, { to: rt });
S.cam.pos = [Math.sin(lt * .7) * 3, .5, 11]; S.cam.target = [0, -.1, 0]; S.word.rot = [0, Math.sin(lt * 1.1) * .45, 0];
gfx.blit(S.render({ clear: [0, 0, 0, 0], dof: { focus: 11, range: 3.5, blur: 9 } }), { to: rt, blend: 'alpha' });
```

## glass-gems — Faceted glass jewels refracting the sky
tags: 3d glass gems crystal refraction luxury floor medium
use: premium/luxury, "clarity", crystals, abstract hero objects, end-card ornaments
how: `Geo.flat(Geo.icosphere(1,1))` gives facets (flat normals); `Mat.glass({color, density})` bends the scene behind it (the environment sky + floor), tints thick parts and splits colours a little. Needs something to refract: keep the env sky visible (no `clear`).
```js gl
//@ {"peak":1.4,"look":{"bloom":0.5}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.night({ colors: ['#04040a', '#ff2d95', '#18e0ff', '#7b3bff'] }); S.sky = { amt: .9, rough: .05 }; S.cam.fov = 34; S.cam.pos = [0, .6, 9]; S.floor({ y: -1.6, color: '#06060e', reflect: .5, fade: .02 });
  S.gems = ['#7affd9', '#ff9ad5', '#9ab6ff'].map((c, i) => S.mesh(Geo.flat(Geo.icosphere(1, 1)), Mat.glass({ color: c, density: 1.4, thickness: 1.5 }), { pos: [(i - 1) * 2.7, 0, 0], scale: [1.15, 1.15, 1.15] })); return S; })();
S.gems.forEach((m, i) => { m.rot = [lt * .5 + i, lt * .7 + i * 2, 0]; m.pos[1] = Math.sin(lt * 1.4 + i * 1.7) * .35; });
return S.render({ dof: { focus: 9, range: 4, blur: 6 } });
```

## material-wall — A palette of materials
tags: 3d materials chrome gold copper glass clay toon holo iridescent product medium
use: showing "range", a brand-material moodboard, choosing a look; a rotating nine-ball shot is also a strong abstract hero
how: one sphere per `Mat.*`; the same studio environment makes the differences obvious. Pick two or three materials per film — mixing nine is a catalogue, not a style.
```js gl
//@ {"peak":1.5}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.studio({ colors: ['#0b0b10', '#fff3e0', '#5a7bff', '#ff6a3a'] }); S.sky = { amt: .2, rough: .5 }; S.cam.fov = 30; S.floor({ y: -2.0, color: '#0a0a10', reflect: .35, fade: .03 });
  const M = [Mat.chrome(), Mat.gold(), Mat.copper(), Mat.glass({ color: '#99ffee', density: 1, thickness: 1.2 }), Mat.plastic({ base: '#ff4d6d' }), Mat.clay({ base: '#ffb48a' }), Mat.toon({ base: '#6a5cff', bands: 4 }), Mat.iridescent({ base: '#ffffff' }), Mat.holo()];
  S.balls = M.map((m, i) => S.mesh(Geo.sphere(.82, 40), m, { pos: [(i % 3 - 1) * 2.15, (1 - Math.floor(i / 3)) * 2.05 - .05, 0] })); return S; })();
S.cam.pos = [Math.sin(lt * .5) * 2.2, .6, 13]; S.cam.target = [0, 0, 0]; S.balls.forEach((m, i) => { m.rot = [lt * .3, lt * .5 + i, 0]; });
return S.render();
```

## city-night-flight — Neon city fly-through
tags: 3d city night neon fly camera fog instancing windows dof medium
use: tech/scale/ambition beats, "the world", a travelling scene between two ideas; the single most cinematic 3D shot you can get cheaply
how: ~3000 boxes in ONE instanced draw call with a procedural lit-windows shader (`windows:{on,size,color}`), height-fog (`hDensity`), a magenta/cyan night environment and a camera on a gentle S-curve at 6 m/s. Depth of field at ~18 units sells scale.
pair: sfx riser + whoosh, trans-glitch, type poster over it
```js gl
//@ {"peak":1.8,"look":{"bloom":0.55,"ca":0.0015}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }), R = K.rng(7), list = [];
  S.env = Env.night({ colors: ['#05060e', '#ff4fa3', '#3ad7ff', '#7b4bff'] }); S.sky = { amt: 1, rough: .1 }; S.fog = { color: '#1b1030', density: .02, hDensity: .08, hRef: 1.5 }; S.cam.fov = 42; S.cam.far = 400;
  for (let gx = -22; gx <= 22; gx++) for (let gz = -60; gz <= 8; gz++) { if (Math.abs(gx % 4) < 1) continue; const h = .5 + Math.pow(R(), 3) * 9 * (1 - Math.abs(gx) / 30), w = .7 + R() * .8; list.push({ pos: [gx * 1.6, h / 2, gz * 1.6], scale: [w, h, w], color: [.12 + R() * .15, .1 + R() * .12, .2 + R() * .2] }); }
  S.instances(Geo.box(1, 1, 1), Mat.pbr({ base: '#ffffff', metal: .2, rough: .35, coat: .4, windows: { on: .38, size: [.3, .45], color: '#ffd9a0' } }), list);
  S.mesh(Geo.plane(400, 400), Mat.pbr({ base: '#15121c', rough: .5 }), { pos: [0, 0, -40], rot: [-Math.PI / 2, 0, 0] }); return S; })();
const u2 = lt / 3; S.cam.pos = [Math.sin(u2 * 3) * .35, 2.4 + Math.sin(u2 * 5) * .5, 6 - u2 * 30]; S.cam.target = [Math.sin(u2 * 3 + .6) * 1.2, 2.6 + u2, 6 - u2 * 30 - 14];
return S.render({ dof: { focus: 18, range: 8, blur: 12 } });
```

## terrain-synthwave — Wireframe terrain under a low sun
tags: 3d terrain wireframe synthwave retro sunset fly grid medium
use: retro-future, music, "journey", data landscapes; wireframe = abstract and cheap, no textures needed
how: `Geo.terrain` with an fbm height function (flat in the middle lane so the camera has a road), `Mat.wire` for true triangle edges (needs `.withBary()`), `Env.sunset` supplies the sun disc and glow behind it, exponential fog hides the far edge.
```js gl
//@ {"peak":1.6,"look":{"bloom":0.55}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.sunset({ colors: ['#08050f', '#b8341a', '#52167a', '#0a0624'] }); S.sky = { amt: .38, rough: 0 }; S.cam.fov = 58; S.fog = { color: '#1a0b2e', density: .014 };
  S.mesh(Geo.terrain(70, 170, 140, 340, (x, z) => { const k = Math.min(1, Math.abs(x) / 8); return (K.fbm(x * .11, z * .11, 4) + .2) * 8 * k * k; }).withBary(), Mat.wire({ base: '#12051f', rim: '#ff4fd8', line: 1.3 })); return S; })();
S.cam.pos = [0, 2.2, 60 - lt * 9]; S.cam.target = [Math.sin(lt * .7) * 2, 2.6, 40 - lt * 9];
return S.render();
```

## orbit-rings — Hero orb with orbiting rings
tags: 3d rings orbit sphere hero emissive gold glass logo medium
use: a "system" or "platform" metaphor, loading/processing, planet/atom look, background for a title
how: one chrome sphere, three thin tori at different tilts spinning at different speeds (emissive tubes bloom nicely), small glass satellites on elliptical paths.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.8}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.studio({ colors: ['#06070d', '#fff1dc', '#7a5cff', '#27f0ff'] }); S.floor({ y: -2.4, color: '#06070c', reflect: .45, fade: .02 }); S.cam.fov = 32; S.cam.pos = [0, .8, 11];
  S.core = S.mesh(Geo.sphere(1.1, 56), Mat.chrome());
  S.rings = [[2.2, '#7a5cff'], [2.9, '#27f0ff'], [3.6, '#ffd23f']].map(([r, c], i) => S.mesh(Geo.torus(r, .035, 160, 10), Mat.emissive(c, 1.6), { rot: [Math.PI / 2 + i * .5, i * .8, 0] }));
  S.sats = [0, 1, 2, 3].map(i => S.mesh(Geo.sphere(.2, 24), i % 2 ? Mat.gold() : Mat.glass({ color: '#99ffee', density: 1 }))); return S; })();
S.core.rot = [0, lt * .4, 0]; S.rings.forEach((m, i) => { m.rot = [Math.PI / 2 + i * .5 + Math.sin(lt * .6 + i) * .25, lt * (.3 + i * .15), 0]; });
S.sats.forEach((m, i) => { const a = lt * (.9 + i * .22) + i * 1.6, r = 2.4 + i * .35; m.pos = [Math.cos(a) * r, Math.sin(a * .7 + i) * 1.2, Math.sin(a) * r]; });
return S.render({ clear: [.012, .014, .03, 1], dof: { focus: 11, range: 4, blur: 7 } });
```

## tunnel-rings — Fly through a tunnel of glowing rings
tags: 3d tunnel rings hyperspace speed fly neon instancing cheap
use: speed, transition between sections, "going deeper", music drops, loading → reveal
how: 40 instanced emissive tori along −z with per-instance colour, dense fog so far rings fade, camera moving at constant speed with slight roll. Cheap and always looks great with bloom ≥ 0.9.
```js gl
//@ {"peak":1.4,"look":{"bloom":1.1,"zoomBlur":0.15}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }), pal = ['#27f0ff', '#7a5cff', '#ff4fd8', '#ffd23f'], list = [];
  S.env = Env.night(); S.sky = { amt: 0 }; S.fog = { color: '#02030a', density: .035 }; S.cam.fov = 70;
  for (let i = 0; i < 60; i++) list.push({ pos: [0, 0, -i * 3], rot: [Math.PI / 2, 0, 0], scale: [1 + .12 * Math.sin(i * .7), 1, 1 + .12 * Math.cos(i * .9)], color: pal[i % 4] });
  S.instances(Geo.torus(2.4, .045, 96, 10), Mat.emissive('#ffffff', 1.5), list); return S; })();
S.cam.pos = [Math.sin(lt * 1.3) * .25, Math.cos(lt * 1.1) * .2, 3 - lt * 9]; S.cam.target = [Math.sin(lt * .9) * .6, Math.cos(lt * .7) * .4, -20 - lt * 9]; S.cam.up = [Math.sin(lt * .5) * .25, 1, 0];
return S.render({ clear: [.01, .01, .03, 1] });
```

## helix-ribbon — Twisting tube ribbons (DNA / data helix)
tags: 3d helix dna tube ribbon iridescent chrome spiral dof medium
use: biology/data/flow metaphors, abstract hero, "two things intertwined" (two languages, two people)
how: `Geo.tube(curveFn, {radius})` sweeps a circle along any 3D curve (Frenet frame, seamless). Two phase-shifted helices, iridescent + chrome, slow spin, strong DOF.
```js gl
//@ {"peak":1.4,"look":{"bloom":0.6}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }), helix = ph => u => { const a = u * Math.PI * 6 + ph; return [Math.cos(a) * 2, (u - .5) * 7, Math.sin(a) * 2]; };
  S.env = Env.night({ colors: ['#05040c', '#ff4fa3', '#3ad7ff', '#7b4bff'] }); S.cam.fov = 36; S.cam.pos = [0, 0, 10.5];
  S.a = S.mesh(Geo.tube(helix(0), { radius: .26, seg: 420, radial: 24 }), Mat.iridescent({ base: '#ffffff' })); S.b = S.mesh(Geo.tube(helix(Math.PI), { radius: .26, seg: 420, radial: 24 }), Mat.chrome());
  S.rungs = S.instances(Geo.cylinder(.05, .05, 4, 12), Mat.emissive('#ffffff', 1.2), Array.from({ length: 28 }, (_, i) => { const u = (i + .5) / 28, a = u * Math.PI * 6; return { pos: [0, (u - .5) * 7, 0], rot: [0, -a, Math.PI / 2], color: i % 2 ? '#27f0ff' : '#ff4fd8' }; })); return S; })();
for (const m of [S.a, S.b, S.rungs]) m.rot = [0, lt * .7, .25];
return S.render({ dof: { focus: 10.5, range: 3, blur: 10 } });
```

## relief-logo — Any 2D drawing becomes a 3D object
tags: 3d relief logo inflate gold chrome brand emboss medium
use: turn a logo/glyph/icon into a metal object without a 3D model; seals, coins, emblems; end cards
how: draw the shape (white on transparent) on a canvas — in `init` — and pass it to `Geo.relief(canvas, {w, depth, blur})`: alpha → soft raised surface (+ mirrored back). Gold/chrome + studio env + floor.
```js init
const c = store.logo = K.canvas(700, 700), g2 = c.getContext('2d'); g2.lineWidth = 70; g2.strokeStyle = '#fff'; g2.lineCap = 'round'; g2.beginPath(); g2.arc(350, 350, 235, .5, K.TAU * .93); g2.stroke(); g2.fillStyle = '#fff'; K.star(g2, 350, 350, 130, 55, 4); g2.fill();
```
```js gl
//@ {"peak":1.5,"look":{"bloom":0.5}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.studio({ colors: ['#0a0a0e', '#fff3de', '#ff8a3a', '#6a8bff'] }); S.floor({ y: -2.2, color: '#0a0a0e', reflect: .5, fade: .02 }); S.cam.fov = 30; S.cam.pos = [0, .4, 11];
  S.logo = S.mesh(Geo.relief(store.logo, { w: 4, depth: .55, blur: 9 }), Mat.gold()); return S; })();
fx.bg('gradient', { c: ['#07060a', '#2a1650', '#8a2c6a', '#ff9a4a'], speed: .3, amt: .8 }, { to: rt });
S.logo.rot = [0, Math.sin(lt * 1.2) * .6, 0]; gfx.blit(S.render({ clear: [0, 0, 0, 0], dof: { focus: 11, range: 4, blur: 8 } }), { to: rt, blend: 'alpha' });
```

## phone-ui-3d — A live 2D interface mapped onto a 3D device
tags: 3d phone ui screen product texture map device explainer medium
use: app demos with a camera move (the 2D UI stays pixel-perfect and animated while the phone tilts/orbits); "feature" shots
how: draw the UI on a 2D canvas every frame, upload it with `gfx.up(canvas, tex)` (same texture object, updated in place) and use it as `map` of an emissive plane in front of a dark phone body.
```js init
store.cv = K.canvas(540, 1080); store.tex = gfx.up(store.cv);
```
```js gl
//@ {"peak":1.5,"look":{"bloom":0.4}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.softbox({ colors: ['#0d0e14', '#ffffff', '#ffd9b0', '#9ec7ff'] }); S.sky = { amt: .12, rough: .4 }; S.floor({ y: -2.7, color: '#0c0d12', reflect: .4, fade: .03 }); S.cam.fov = 28;
  S.body = S.mesh(Geo.box(2.35, 4.75, .24), Mat.pbr({ base: '#0b0c10', metal: .7, rough: .22 })); S.screen = S.mesh(Geo.plane(2.15, 4.55), Mat.emissive('#ffffff', 1.05, { map: store.tex }), { pos: [0, 0, .125] }); return S; })();
const g2 = store.cv.getContext('2d'), w = 540, h = 1080, p = K.prog(lt, 0, 1.6);
g2.fillStyle = K.gradient(g2, 0, 0, w, h, [[0, '#2b1a6e'], [1, '#0b1030']]); g2.fillRect(0, 0, w, h);
K.text(g2, 'Today', 60, 130, { size: 44, weight: 600, fill: '#a9b4ff', align: 'left' }); Type.counter(g2, 1284 * K.E.outExpo(p), w / 2, 260, { size: 130, weight: 800, pad: 4 });
UI.lineChart(g2, 70, 440, w - 140, 260, [3, 5, 4, 7, 6, 9, 8, 12], p, { color: '#27f0ff', labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'S'], size: 20 });
[0, 1, 2].forEach(i => UI.card(g2, 50, 790 + i * 100, w - 100, 84, { radius: 22, fill: 'rgba(255,255,255,.08)', shadow: false }));
store.tex = gfx.up(store.cv, store.tex);
S.cam.pos = [Math.sin(lt * .8) * 3.6, .6, 11.5]; S.cam.target = [0, 0, 0]; S.body.rot = S.screen.rot = [0, Math.sin(lt * .8) * .25, 0]; S.screen.pos = [Math.sin(lt * .8) * .25 * .125, 0, .125];
return S.render({ dof: { focus: 11.5, range: 4, blur: 6 } });
```

## planet-atmosphere — Planet with glowing atmosphere and moon
tags: 3d planet space atmosphere rim glow moon orbit stars cheap
use: scale, "global" ideas (translation between countries!), science/space, night-sky openers
how: a `Mat.pbr` sphere with a rim light (`rimAmt`, `rimPow`) fakes scattering; a slightly larger additive `Mat.holo` shell adds the atmosphere glow; `Env.space` gives stars + nebula behind and in reflections.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.5}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.space({ colors: ['#02020a', '#3a24b0', '#b03a78', '#8aa6d8'] }); S.cam.fov = 34; S.cam.pos = [4.2, 1.2, 8]; S.cam.target = [0, 0, 0]; S.lights[0].dir = [-.8, .35, .5]; S.lights[0].intensity = 1.1;
  S.planet = S.mesh(Geo.sphere(2, 72), Mat.pbr({ base: '#1a3fa8', metal: 0, rough: .65, rimAmt: .55, rim: '#5fb0ff', rimPow: 3, coat: 0 }));
  S.air = S.mesh(Geo.sphere(2, 72), Mat.holo({ base: '#000000', rim: '#4fa6ff', rimAmt: 1.1, rimPow: 3.4, alpha: .3 }), { scale: [1.07, 1.07, 1.07] });
  S.moon = S.mesh(Geo.sphere(.42, 40), Mat.clay({ base: '#cfcac2' })); return S; })();
S.planet.rot = [0, lt * .12, 0]; const a = lt * .5 + 1; S.moon.pos = [Math.cos(a) * 3.6, .4, Math.sin(a) * 3.6]; S.cam.pos = [4.2 - lt * .25, 1.2, 8];
return S.render();
```

## cubes-wave — A grid of blocks rippling
tags: 3d cubes grid wave ripple clay rhythm abstract medium
use: rhythm/data/"many voices" metaphors, beat-synced backgrounds (drive the wave with hits), abstract skylines
how: a grid of separate meshes (not instanced — instances are static) whose height follows a travelling sine; colour via `tint` per mesh; clay material + soft environment gives a calm, tactile look.
```js gl
//@ {"peak":1.4,"look":{"bloom":0.3}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }), geo = Geo.box(.78, 1, .78);
  S.env = Env.softbox({ colors: ['#101018', '#ffffff', '#ffd2b0', '#a8c8ff'] }); S.cam.fov = 32; S.floor({ y: -.02, color: '#0e0e16', reflect: .2, fade: .02 });
  S.cubes = []; for (let i = 0; i < 17; i++) for (let j = 0; j < 9; j++) { const m = S.mesh(geo, Mat.clay({ base: '#ffffff' })); m.gx = i - 8; m.gz = j - 4; m.tint = K.rgb(K.mix('#ff4d6d', '#27f0ff', i / 16)).map(v => v / 255).concat(1); S.cubes.push(m); } return S; })();
for (const m of S.cubes) { const d = Math.hypot(m.gx, m.gz), h = .35 + 1.6 * (.5 + .5 * Math.sin(d * .9 - lt * 3.2)) * Math.exp(-d * .07); m.scale = [1, h, 1]; m.pos = [m.gx, h / 2, m.gz]; }
S.cam.pos = [Math.sin(lt * .5) * 3, 8, 15]; S.cam.target = [0, .3, 0];
return S.render({ dof: { focus: 16, range: 6, blur: 8 } });
```

## lowpoly-forest — Faceted pastel forest in fog
tags: 3d lowpoly forest trees fog dreamy calm instancing toon cheap
use: calm, nature, "peaceful", children/indie tones; a dreamy alternative to neon cities
how: `Geo.flat(Geo.cone(1, 2, 6))` gives crystal-faceted pine trees, one instanced draw for 800 of them, pastel clay material, a thick light fog and a soft sky gradient. Drift the camera slowly through.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.3,"grain":0.04}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }), R = K.rng(11), list = [];
  S.env = Env.gradient({ colors: ['#3a2f55', '#a05a78', '#b8845a', '#3a5a8a'], amount: .7 }); S.sky = { amt: .8, rough: .6 }; S.fog = { color: '#8a6a9a', density: .018 }; S.cam.fov = 45; S.cam.far = 200;
  for (let i = 0; i < 900; i++) { const x = (R() - .5) * 90, z = -R() * 120 + 10, s = .6 + R() * 1.3; list.push({ pos: [x, s, z], scale: [s, s * (1 + R() * .7), s], rot: R() * 6, color: [.35 + R() * .25, .6 + R() * .25, .5 + R() * .25] }); }
  S.instances(Geo.flat(Geo.cone(1, 2, 6)), Mat.clay({ base: '#ffffff' }), list); S.mesh(Geo.plane(300, 300), Mat.clay({ base: '#8a6a98' }), { rot: [-Math.PI / 2, 0, 0] }); return S; })();
S.cam.pos = [Math.sin(lt * .4) * 2, 3.2, 8 - lt * 3]; S.cam.target = [Math.sin(lt * .4 + .5) * 3, 2.2, -10 - lt * 3];
return S.render({ dof: { focus: 20, range: 12, blur: 8 } });
```

## product-pedestal — Product turntable on a pedestal
tags: 3d product pedestal turntable gold lathe studio floor luxury medium
use: product reveals, "the thing itself" shots, trophies/vases/bottles; `Geo.lathe` turns a 2D profile into a bottle, vase, chess piece, lamp
how: a lathe-profile object in gold (or glass), a dark cylinder pedestal, softbox environment, slow turntable rotation + camera push, floor reflection. Add a caption in a Stage overlay.
```js gl
//@ {"peak":1.5,"look":{"bloom":0.45}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.softbox({ colors: ['#0d0d12', '#ffffff', '#ffd9b0', '#9ec7ff'] }); S.floor({ y: -2.0, color: '#0c0c12', reflect: .45, fade: .025 }); S.cam.fov = 28;
  S.ped = S.mesh(Geo.cylinder(1.5, 1.6, .5, 64), Mat.pbr({ base: '#15151c', metal: .5, rough: .25 }), { pos: [0, -1.75, 0] });
  S.vase = S.mesh(Geo.lathe([[0, -1.5], [.55, -1.5], [.9, -1.0], [.95, -.2], [.6, .5], [.32, 1.0], [.34, 1.5], [.5, 1.7], [.36, 1.75], [.0, 1.75]], 64), Mat.gold({ rough: .12 }), { pos: [0, -.2, 0], scale: [1, 1.05, 1] }); return S; })();
fx.bg('gradient', { c: ['#08080c', '#1a1f3a', '#3a2a55', '#08080c'], speed: .15 }, { to: rt });
S.vase.rot = [0, lt * .9, 0]; S.cam.pos = [Math.sin(lt * .4) * 1.5, 1.2, 10 - lt * .5]; S.cam.target = [0, -.2, 0];
gfx.blit(S.render({ clear: [0, 0, 0, 0], dof: { focus: 12, range: 4, blur: 8 } }), { to: rt, blend: 'alpha' });
```

## product-ring-macro — A hero ring in brushed titanium: macro camera, coloured light pools, exploded view
tags: 3d product ring titanium metal macro exploded view wearable watch band torus hero luxury medium
use: launch films for a physical object (smart ring, watch band, bracelet, a washer-shaped part); any "the thing itself" shot where a 2D outline would look cheap; the exploded view (`ex` 0 → 1) is the "what's inside" beat
how: a torus (`Geo.torus(R, r)`) in `Mat.pbr` metal (rough .3 = brushed; .05 = mirror), a darker sleeve inside it, tiny emissive sensors; a softbox environment with a cool key, a warm rim and a violet accent (coloured pools of light, not a grey studio); glossy floor; fov 26 and a slow dolly = macro; depth of field follows the ring. The object must be LIT and FILL the frame (≥ 40 % of its height) — never draw it as an outline.
avoid: a thin glowing 2D circle on black (reads as a loading spinner); mirror-smooth metal with nothing to reflect (needs the coloured env); a static camera.
```js gl
//@ {"peak":2.2,"look":{"bloom":0.28,"grain":0.04}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.softbox({ colors: ['#06090d', '#bfe6ff', '#ff9a4d', '#6a5cff'] }); S.sky = { amt: .2 };
  S.floor({ y: -1.7, color: '#121923', reflect: .6, fade: .03 }); S.cam.fov = 26;
  S.shell = S.mesh(Geo.torus(1.5, .36, 128, 48), Mat.pbr({ base: '#a7b0b8', metal: 1, rough: .3 }));
  S.sleeve = S.mesh(Geo.torus(1.5, .30, 128, 40), Mat.pbr({ base: '#0b0e13', metal: .2, rough: .55 }), { scale: [.96, .96, .96] });
  S.dots = [0, 1, 2].map(i => S.mesh(Geo.sphere(.07, 20, 14), Mat.emissive('#37f0d8', 2.2)));
  return S; })();
fx.bg('gradient', { c: ['#05070c', '#0c3340', '#2a1650', '#05070c'], speed: .12 }, { to: rt });   // a coloured backdrop, never flat black
const ex = Math.min(1, Math.max(0, (lt - .9) / 1.6));          // 0 = assembled, 1 = exploded (the "what's inside" beat)
S.shell.rot = [1.05 + .1 * Math.sin(lt * .6), lt * .5, .3]; S.shell.pos = [0, .35 * ex, 0];
S.sleeve.rot = S.shell.rot; S.sleeve.pos = [0, -.7 * ex, 0];
S.dots.forEach((d, i) => { const a = i * 2.1 + lt * .5; d.pos = [Math.cos(a) * 1.43, -.35 * ex - .1, Math.sin(a) * 1.43]; });
const dist = 9.5 - lt * .8;                                     // slow macro dolly
S.cam.pos = [Math.sin(lt * .35) * dist * .6, 1.6 - lt * .08, dist]; S.cam.target = [0, 0, 0];
gfx.blit(S.render({ clear: [0, 0, 0, 0], dof: { focus: dist, range: 3.2, blur: 7 } }), { to: rt, blend: 'alpha' });
```

## wire-hologram — Holographic wireframe object
tags: 3d hologram wireframe holo scifi scan cyber torusknot cheap
use: sci-fi interfaces, "analysis", blueprint/AI/network tones, anything that should feel digital rather than physical
how: `Mat.wire` (true triangle edges via `.withBary()`) plus a larger translucent additive `Mat.holo` copy gives the glowing-hull look; night environment; slow rotation.
```js gl
//@ {"peak":1.5,"look":{"bloom":1.0,"ca":0.002}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H });
  S.env = Env.night({ colors: ['#02050a', '#18e0ff', '#ff2d95', '#7b3bff'] }); S.sky = { amt: .0 }; S.cam.fov = 34; S.cam.pos = [0, .4, 9];
  S.core = S.mesh(Geo.torusKnot({ radius: 1.5, tube: .42, seg: 200, radial: 22 }).withBary(), Mat.wire({ base: '#031018', rim: '#7dfcff', line: 1.4 }));
  S.hull = S.mesh(Geo.torusKnot({ radius: 1.5, tube: .42, seg: 200, radial: 22 }), Mat.holo({ base: '#052a3a', rim: '#6ef3ff' }), { scale: [1.03, 1.03, 1.03] }); return S; })();
for (const m of [S.core, S.hull]) m.rot = [lt * .35, lt * .55, 0];
return S.render({ clear: [.01, .02, .04, 1] });
```
