# Light & atmosphere — what makes a frame feel photographed

Real footage has light that *comes from somewhere*, air that catches it, and imperfections (flare, grain, halation). Flat colour shapes have none of that. Fake it in four layers:
(1) a **light source** you can point at (sun disc, neon tube, window, spotlight) · (2) **atmosphere** between camera and subject (dust, haze, fog, rays) · (3) **glow/bloom** on everything brighter than the rest (Post `bloom` 0.6–1.2 with `threshold` 0.55–0.7) · (4) **lens/film** (grain, chromatic aberration, vignette, flare, light leaks).
Rim light (a bright edge on the dark side) separates a subject from its background; backlight + haze = god-rays. Keep the *darks* dark — contrast is what lets light read.

## light-godrays — Backlit title with god-rays
tags: light rays godrays backlit silhouette title haze cinematic gl cheap
use: epic/serious title reveals, "dawn" moments, anything that should feel important; a black title silhouette against a radiant source
how: `fx.bg('rays', {center})` puts the source behind the text (centre slightly above), the title is drawn dark on top with a subtle warm rim (a second copy, blurred and brighter, offset toward the light). Post bloom bleeds the light around the letters.
pair: particles-dust-ambient (dust floats through the rays), cam-push-in
```js gl
//@ {"peak":1.5,"look":{"bloom":1.0,"streak":0.2}}
fx.bg('rays', { c: ['#05060c', '#c8742e', '#ffd9a0', '#ffffff'], speed: .3, amt: .8, center: [.5, .62] }, { to: rt });
g.clearRect(0, 0, W, H); K.text(g, 'DAWN', W / 2, H * .5, { size: H * .34, weight: 900, fill: '#07070c', glow: { color: '#ffb36a', blur: 30 * u } });
```

## light-lens-flare — Anamorphic lens flare with ghosts
tags: light lens flare ghosts anamorphic streak sun 2d cinematic cheap
use: a bright light entering frame (sun, headlight, logo reveal glint); sells "camera" instantly. One pass per hero moment — not constantly
how: additive layers on a line through the frame centre: a hot core, a long horizontal streak, and ghost discs (hexagons for the bokeh look) at mirrored positions along the line, each slightly tinted. Animate the source position along a path.
```js scene
//@ {"peak":1.5,"look":{"bloom":0.8,"ca":0.003}}
c.paint(g); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H);
const lx = W * (.15 + .7 * K.E.inOutCubic(K.prog(lt, 0, 3))), ly = H * (.3 + .1 * Math.sin(lt)), cx = W / 2, cy = H / 2; g.save(); g.globalCompositeOperation = 'lighter';
K.glow(g, lx, ly, H * .25, '#ffe2b0', 1); K.glow(g, lx, ly, H * .08, '#ffffff', 1);
const sg = g.createLinearGradient(lx - W * .5, 0, lx + W * .5, 0); sg.addColorStop(0, 'rgba(120,170,255,0)'); sg.addColorStop(.5, 'rgba(160,200,255,.55)'); sg.addColorStop(1, 'rgba(120,170,255,0)'); g.fillStyle = sg; g.fillRect(lx - W * .5, ly - 2 * u, W, 4 * u);
[[.4, .05, '#ffb36a'], [.8, .09, '#6aa8ff'], [1.3, .035, '#ff6ad5'], [1.8, .12, '#7dffcf'], [-.5, .06, '#ffd27a']].forEach(([k, r, col]) => { const gx = lx + (cx - lx) * k * 2, gy = ly + (cy - ly) * k * 2; K.glow(g, gx, gy, r * H, col, .45); });
g.restore();
```

## light-leaks — Warm light leaks over footage
tags: light leaks film analog warm overlay transition organic 2d cheap
use: warm, organic, nostalgic or hopeful scenes; between-scene accents; a cheap way to make digital graphics feel like film
how: 3–4 huge soft radial gradients (orange, magenta, yellow) drifting slowly with `lighter` blending at 25–40 % alpha over the picture; pulse their alpha on cuts. Or use the GPU `lightleak` transition.
```js scene
//@ {"peak":1.5,"look":{"bloom":0.5}}
c.paint(g); g.globalCompositeOperation = 'lighter';
[['#ff7a2a', .1, .2, .9, 1.1], ['#ff2a7a', .9, .8, .8, 1.7], ['#ffd23a', .6, .05, .7, .9]].forEach(([col, px, py, r, sp], i) => { const x = W * (px + .12 * Math.sin(lt * sp + i * 2)), y = H * (py + .1 * Math.cos(lt * sp * .8 + i)); K.glow(g, x, y, H * r, col, .55 * (.7 + .3 * Math.sin(lt * 1.3 + i))); });
```

## light-spotlight-reveal — A searching spotlight
tags: light spotlight reveal dark mystery stage follow 2d cheap
use: reveal content gradually (mystery, stage, "find the detail"), a lens-of-attention metaphor, noir/thriller or theatrical tone
how: draw the scene, then a near-black layer with a radial hole at the light position (transparent centre → opaque edge) and an additive warm cone glow. Move the hole on a smooth Lissajous/path; make it linger on the important element.
```js scene
//@ {"peak":1.5}
c.paint(g); const x = W * (.5 + .3 * Math.sin(lt * .9)), y = H * (.55 + .12 * Math.sin(lt * 1.3)), r = H * .34;
const dark = g.createRadialGradient(x, y, r * .15, x, y, r * 1.25); dark.addColorStop(0, 'rgba(2,2,8,0)'); dark.addColorStop(.55, 'rgba(2,2,8,.55)'); dark.addColorStop(1, 'rgba(2,2,8,.96)'); g.fillStyle = dark; g.fillRect(0, 0, W, H);
g.save(); g.globalCompositeOperation = 'lighter'; K.glow(g, x, y, r * 1.1, '#ffe6b8', .25); g.restore();
```

## light-lightning — Procedural lightning strike
tags: light lightning bolt flash storm electric branching energy 2d fx medium
use: power, shock, "idea!" beats, storm moods, electric transitions, impact of a big reveal
how: midpoint-displacement polyline from the sky to a target, 2–3 branches, drawn with `K.neon` (core + wide glow); the screen flashes white for 2–3 frames and decays; the bolt re-seeds every strike so each is unique but deterministic.
pair: sfx-hit-stack (thunder-like impact), cam-punch-hits
```js scene
//@ {"peak":0.12,"bg":"#07080f","look":{"bloom":1.3}}
const strike = Math.floor(lt / 1.5), t0 = lt - strike * 1.5, R = K.rng(40 + strike), fl = Math.exp(-t0 * 12);
const bolt = (x0, y0, x1, y1, d, amp) => { if (d === 0) return [[x0, y0], [x1, y1]]; const mx = (x0 + x1) / 2 + (R() - .5) * amp, my = (y0 + y1) / 2 + (R() - .5) * amp * .4; return bolt(x0, y0, mx, my, d - 1, amp / 2).concat(bolt(mx, my, x1, y1, d - 1, amp / 2).slice(1)); };
const sx = W * (.3 + R() * .4), pts = bolt(sx, -10, sx + (R() - .5) * W * .3, H * .85, 6, H * .35);
if (t0 < .5) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); K.neon(g, '#9fc4ff', 5 * u, fl); for (let b = 0; b < 3; b++) { const k = Math.floor(pts.length * (.25 + R() * .5)), [bx, by] = pts[k], br = bolt(bx, by, bx + (R() - .5) * W * .35, by + H * (.15 + R() * .25), 4, H * .12); g.beginPath(); br.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); K.neon(g, '#9fc4ff', 2.5 * u, fl * .8); } }
g.fillStyle = 'rgba(190,210,255,' + (.5 * fl) + ')'; g.fillRect(0, 0, W, H);
```

## light-neon-rim-3d — Rim-lit silhouette in the dark
tags: light rim 3d neon silhouette edge glow dark dramatic medium
use: dramatic product/character shots: the object is almost black, defined only by coloured edge light — premium, moody, techy
how: `Mat.pbr({base:'#050508', rough:.35, rimAmt:1.6, rim:'#27f0ff', rimPow:2.4})` lights only the grazing edges; `Env.night` adds magenta/cyan reflections; render on a near-black clear colour; bloom ≥ 0.9.
```js gl
//@ {"peak":1.5,"look":{"bloom":1.1}}
const S = store.S ||= (() => { const S = new Scene3D(gfx, { W, H }); S.env = Env.night({ colors: ['#010103', '#ff2d95', '#18e0ff', '#7b3bff'] }); S.floor({ y: -1.6, color: '#020204', reflect: .45, fade: .03 }); S.cam.fov = 32; S.cam.pos = [0, .3, 9];
  S.obj = S.mesh(Geo.torusKnot({ radius: 1.2, tube: .42, seg: 240, radial: 28 }), Mat.pbr({ base: '#040407', metal: .6, rough: .3, rimAmt: 1.8, rim: '#27f0ff', rimPow: 2.2 })); return S; })();
S.obj.rot = [lt * .3, lt * .5, 0]; return S.render({ clear: [.005, .005, .012, 1], dof: { focus: 9, range: 3, blur: 6 } });
```

## light-floor-reflection-2d — Glossy floor reflection (2D)
tags: light reflection floor glossy mirror 2d text logo cheap
use: titles and logos that should look like objects standing on glass; premium/tech feel without 3D
how: draw the object, then the same drawing flipped vertically below a floor line, faded by a gradient mask (`destination-out`) and slightly blurred by lowering alpha; add a faint horizon glow.
```js scene
//@ {"peak":1.5,"bg":"#07080f"}
const fy = H * .62, grd = g.createLinearGradient(0, fy, 0, H); grd.addColorStop(0, '#14172e'); grd.addColorStop(1, '#07080f'); g.fillStyle = grd; g.fillRect(0, fy, W, H - fy); K.glow(g, W / 2, fy, W * .45, '#4a5cff', .35);
const draw = ctx => K.text(ctx, 'MIRROR', W / 2, fy - H * .13, { size: H * .24, weight: 900, fill: K.gradient(ctx, 0, fy - H * .3, 0, fy, [[0, '#ffffff'], [1, '#7a9cff']]) });
const off = store.off ||= K.canvas(W, H, { cpu: true }), o = off.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H);
o.save(); o.translate(0, 2 * fy); o.scale(1, -1); draw(o); o.restore();                                             // the flipped copy…
o.globalCompositeOperation = 'destination-in'; const m = o.createLinearGradient(0, fy, 0, fy + H * .3); m.addColorStop(0, 'rgba(0,0,0,.55)'); m.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = m; o.fillRect(0, fy, W, H);   // …faded out with distance
g.drawImage(off, 0, 0); draw(g);
```

## light-long-shadow — Flat design long shadow
tags: light shadow long flat design graphic bold stacked depth 2d cheap
use: flat/bold graphic styles, icons, sticker-like titles; adds depth without gradients
how: `Type.extrude` with a shadow colour and a long depth in the light's opposite direction gives the classic 45° long shadow; grow the depth from 0 on entry.
```js scene
//@ {"peak":1.5,"bg":"#ffcf3a"}
const p = K.E.outCubic(K.prog(lt, 0, 1)); Type.extrude(g, 'Flat', W / 2, H / 2, { size: H * .34, weight: 900, depth: H * .5 * p, angle: Math.PI * .25, steps: 90, colors: ['#ffffff', '#c98a00'] });
```

## light-neon-sign — A neon sign that flickers on
tags: light neon sign flicker glow tube night brand retro cyber city 2d cheap
use: a brand name or a word in a dark room with a retro / night-city / cyber mood. The ON sequence carries the drama — dead, stutter, steady — and the coloured light it throws on the wall sells the space
how: the sign is OUTLINE text in three layers — wide soft halo (stroke + big shadow blur), coloured tube, white-hot core — drawn with `K.text` (`fill` transparent, `stroke`, `shadow`). Flicker is closed form: a hash of the frame-rate-quantised time chooses dropouts for the first second, then steady with a 1.5 % hum. Two lines with different colours and start times feel like two tubes. Add a `K.glow` pool on the wall in the sign's colour.
pair: bg-night-city, look-chromatic-aberration, sfx-hum (low drone) + a crackle at each dropout
avoid: flicker after the sign is meant to be "on" for the whole hold (it reads as a bug); white-pink glow on a white background (it needs a dark room); bloom threshold above 0.7 (the halo disappears) or bloom above 1 (the tube fills in and the letters lose their shape)
```js scene
//@ {"peak":1.9,"bg":"#07060d","look":{"bloom":0.7,"threshold":0.65}}
const cx = W / 2, fl = t0 => { const q = lt - t0; return q < 0 ? 0 : q < 1.1 ? (K.hash2(Math.floor(q * 16), t0 * 7) > .5 ? 1 : .1) : 1; }, hum = 1 + .015 * Math.sin(lt * 90);
[['OPEN', H * .4, '#ff2a8a', '#ff7ab8', .3], ['24 H', H * .64, '#27f0ff', '#9ffaff', .75]].forEach(([str, y, col, tube, t0]) => { const on = fl(t0) * hum, size = H * .22;
  K.glow(g, cx, y, H * .8, col, .22 * on);
  const o = { size, weight: 700, family: K.FONTS.rounded, fill: 'rgba(0,0,0,0)', alpha: on };
  K.text(g, str, cx, y, { ...o, stroke: col, strokeW: 8 * u * 2, shadow: { color: col, blur: 40 * u * 2 } }); K.text(g, str, cx, y, { ...o, stroke: tube, strokeW: 4 * u * 2, shadow: { color: col, blur: 14 * u * 2 } }); K.text(g, str, cx, y, { ...o, stroke: '#fff4fa', strokeW: 1.6 * u * 2 }); });
```

## light-dusk-landscape — A dusk landscape with depth: aerial perspective, mist, moon, aurora, fireflies
tags: landscape dusk mountains ridges mist fog aurora moon fireflies stars ambient meditative loop no text calm generative 2d cinematic
use: meditative / ambient films, loops, wallpapers, calm openers, "breathing" backgrounds behind a title — anywhere the picture itself is the hero and nothing should shout. Flat silhouettes of the same dark colour look like clip art; this recipe is about DEPTH
how: six fbm ridges from far to near — each one darker, sharper and less hazy than the one behind it (aerial perspective: far = closer to the sky colour), a mist band resting in every valley and drifting at its own speed, a sky gradient with a warm horizon, twinkling stars that fade toward the horizon, three additive aurora ribbons, a moon that rises with a two-layer halo, fireflies that blink in the foreground; a slow crane (everything moves up, near layers more) gives parallax. Grade with grain + vignette; keep the score as slow as the picture
avoid: one dark colour for every ridge; a moon without a halo; mist as a uniform grey veil; anything moving faster than a breath; text
pair: particles-fireflies, edit-seamless-loop (for loops make every motion periodic in the loop length), cam-push-in, sound pad-cinematic-swell
```js scene
//@ {"peak":5,"look":{"bloom":0.4,"threshold":0.85,"grain":0.035,"vignette":0.35}}
const R = K.rng(7), cr = K.E.inOutCubic(K.prog(lt, 0, 10));                                           // a slow crane over ten seconds
g.fillStyle = K.gradient(g, 0, 0, 0, H, [[0, '#0a0c27'], [.36, '#2e2457'], [.52, '#a8607a'], [.62, '#e7a07e'], [.72, '#f6c79a']]); g.fillRect(0, 0, W, H);
for (let i = 0; i < 160; i++) { const x = R() * W, y = R() * H * .55, ph = R() * 6.28, sp = 1 + R() * 2, a = (.25 + .55 * (.5 + .5 * Math.sin(t * sp + ph))) * (1 - y / (H * .55)); g.fillStyle = `rgba(255,236,226,${a.toFixed(3)})`; g.fillRect(x, y + cr * H * .04, 1.8 * u, 1.8 * u); }
g.save(); g.globalCompositeOperation = 'lighter';                                                    // aurora: vertical curtains hanging from a wandering ribbon, brightest at the lower edge
[['#5ff2c4', .15, .14, 1], ['#ff9ac0', .23, .045, .35]].forEach(([col, y0, hh, am], k) => { const st = W / 150; for (let x = 0; x < W; x += st) { const y = H * y0 + cr * H * .04 + Math.sin(x / W * 4.2 + t * .22 + k * 1.7) * H * .045 + K.noise2(x / W * 2.2 + k * 3, t * .07) * H * .04, h = H * hh * (.55 + .45 * (.5 + .5 * K.noise2(x / W * 6 + k, t * .15))), fl = .5 + .5 * Math.sin(x / W * 40 + t * 1.3 + k), env = Math.max(0, Math.min(1, .45 + 1.3 * K.noise2(x / W * 1.6 + k * 5, t * .05))); const gr = g.createLinearGradient(0, y - h, 0, y + H * .01); gr.addColorStop(0, K.rgba(col, 0)); gr.addColorStop(.75, K.rgba(col, (.05 + .05 * fl) * am * env)); gr.addColorStop(.93, K.rgba(col, (.14 + .06 * fl) * am * env)); gr.addColorStop(1, K.rgba(col, (.04 + .02 * fl) * am * env)); g.fillStyle = gr; g.fillRect(x, y - h, st + 1, h + H * .01); } });
const mx = W * .72, my = H * (.62 - .3 * K.E.outCubic(K.prog(lt, .5, 9))) + cr * H * .05;
K.glow(g, mx, my, H * .45, '#f3c8a8', .22); K.glow(g, mx, my, H * .14, '#fff1dc', .38); g.restore();
g.fillStyle = '#fff6ea'; g.beginPath(); g.arc(mx, my, H * .055, 0, Math.PI * 2); g.fill();
const L = 6; for (let i = 0; i < L; i++) { const d = i / (L - 1), base = H * (.6 + d * .27) - cr * H * (.02 + d * .12), amp = H * (.09 + d * .05);   // far → near: darker, sharper, less hazy
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += W / 160) { const n = 1 - Math.abs(K.fbm(x / W * (1.4 + d * 1.1) + i * 7.3 + t * .004 * (1 + d * 4), i * 3.1, 4)); g.lineTo(x, base - amp * Math.pow(n, 1.6 - d * .6)); } g.lineTo(W, H); g.closePath(); g.fillStyle = K.mix('#9a7aa6', '#0b0a1a', Math.pow(d, .75)); g.fill();
  if (i < L - 1) { const vy = base + amp * .1, a = (.16 - d * .08).toFixed(3), mg = g.createLinearGradient(0, vy - H * .06, 0, vy + H * .05); mg.addColorStop(0, 'rgba(240,190,200,0)'); mg.addColorStop(.5, `rgba(240,190,200,${a})`); mg.addColorStop(1, 'rgba(240,190,200,0)'); g.fillStyle = mg; g.fillRect(-W + (t * W * .01 * (1 + d)) % W, vy - H * .06, W * 3, H * .11); } }
g.save(); g.globalCompositeOperation = 'lighter';
for (let i = 0; i < 40; i++) { const bx = R() * W, by = H * (.8 + R() * .18), ph = R() * 6.28, sp = 1.2 + R(), x = bx + Math.sin(t * .4 + ph) * W * .02, y = by + Math.cos(t * .5 + ph * 1.3) * H * .015 - cr * H * .1, bl = Math.max(0, Math.sin(t * sp + ph)); if (bl > .05) K.glow(g, x, y, H * .018 * (.6 + bl), '#ffd88a', .8 * bl); }
g.restore();
```
