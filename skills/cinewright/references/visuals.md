# Visuals reference — recipes for looks that read as "produced"

Contents: [1 Layers](#1-layers-and-backgrounds) · [2 Post stack](#2-the-post-stack-postjs) · [3 Glow, glass](#3-glow-neon-and-glass) · [4 Particles & morphs](#4-particles-and-morphs) · [5 Draw-on strokes](#5-draw-on-strokes-and-paths) · [6 3D](#6-3d-without-a-library) · [7 Shaders](#7-shaders-and-raymarching) · [8 Geometry](#8-generative-geometry-girih-rosettes-flow) · [9 UI, data-viz](#9-ui-mockups-and-data-viz) · [10 Characters](#10-characters-and-illustration) · [11 Film look](#11-film-look) · [12 Textures](#12-procedural-textures) · [13 Performance](#13-performance) · [14 Assets](#14-images-video-and-data)

`K` = kit.js, `Post` = post.js, `UI` = ui.js, `G` = geometry.js. Draw the scene into an offscreen 2D canvas (`scene`), then `post.render(scene, opts)` onto the output canvas — that is the default architecture (see `templates/basic`).

## 1. Layers and backgrounds
Compose at least three layers: **background** (gradient + soft glows + texture), **subject**, **foreground** (dust, bokeh, light leaks, vignette). Give each a different parallax factor and blur.
```js
g.fillStyle = K.gradient(g, 0, 0, 0, H, [[0, pal.bg], [1, K.mix(pal.bg, pal.bg2, .9)]]); g.fillRect(0, 0, W, H);
K.glow(g, W*.2 + 140*u*Math.sin(t*.35), H*.3, 900*u, pal.a, .30);                    // drifting colour pools (additive sprites, cheap)
dust.draw(g, t, {glow:true, alpha:.7});                                               // const dust = K.field({n:180, life:[3,7], t0:-3, spawn:(i,r)=>({x:r()*W,y:r()*H,vx:..,vy:..,size:..,color:..})})
```
Ready backgrounds: aurora (3 `K.glow` blobs moving on sines), grid (`for` lines with alpha falling off with distance), perspective floor (`K.cam3` + horizontal lines), gradient mesh (blurred `K.glow` blobs on a dark base), textured paper (`K.paper(W,H)`), noise clouds (`K.fbm` baked with `K.bake`), starfield (`K.field` with tiny `size`).
`K.oklch(l,c,h)` gives evenly bright colours across hues; `K.palette(hue,{mode})` returns `{bg,bg2,ink,muted,a,b,c,glow}`.

## 2. The post stack (`post.js`)
`post.render(scene, opts)` runs bloom (dual-filter pyramid, soft knee) → streaks → zoom blur → chromatic aberration → grade → vignette → grain → dither. Pass `frame: K.frameIndex(t, FPS)` so grain/glitch are deterministic.
| Option (default) | Range | Use |
|---|---|---|
| `bloom` (.5) | 0–1.2 | glow amount; ≥ .8 is dreamy, > 1 washes out |
| `threshold` (.62) `knee` (.4) | .4–.8 | what starts to glow; raise it if text turns to blobs |
| `streak` (0) | .1–.35 | horizontal anamorphic streaks (cinematic) |
| `ca` (.0025) | .001–.015 | RGB fringing; spike on hits `+ .012*K.pulse(...)`; keep low on Persian text |
| `zoomBlur` (0) | .2–.5 | radial blur from `center` on hits |
| `glitch` (0) | .3–.6 for ≤ .12 s | horizontal slice offsets |
| `scan` (0) | .1–.4 | scanlines (CRT) |
| `grain` (.045) `dither` (1.4) | .02–.08 | film grain; dither kills banding in dark gradients |
| `vignette` (.38) `vignetteSoft` | .3–.6 | focus |
| `sat contrast exposure` (1) | | grade |
| `tint [r,g,b]` `lift [r,g,b]` | | colour grade: tint multiplies, lift adds in shadows |
| `shoulder` (.5) | 0–1 | soft highlight roll-off |
| `flash [r,g,b]` `fade` `fadeColor` | | additive flash; fade to colour (0→1) |
| `shock [[cx,cy,radius,strength],…]` `shockWidth` | up to 4 | refraction rings (uv units) |
| `warp` `pixelate` `center` | | lens barrel, mosaic, effect origin |
**WebGL scenes:** `post.begin()` (HDR target) → draw with `post.gl` → optional `post.overlay(canvas2d)` (captions, alpha-blended so they bloom too) → `post.end(opts)`; see `templates/particles`, `templates/shader`.
**Layer order for light:** `K.glow` is additive — draw it *before* (behind) the subject it lights. A halo drawn after a moon/logo/product washes the subject's detail out to a flat white disc (seen in practice: the moon's surface only appeared once the halo moved behind it).
**Exposure discipline:** pure white + bloom + additive glow = blown blob. Keep text off-white (`#dcdcf0`), keep glow blur < 0.25 × font size, lower `bloom` when text sits on bright things. Compare against reference photos mid-way.

## 3. Glow, neon and glass
```js
K.glow(g, x, y, r, color, alpha)          // additive radial sprite (cached) — the cheap way to light things
g.beginPath(); …path…; K.neon(g, color, 5*u, 1)   // wide faint halo + hot core stroke
K.text(g, str, x, y, {glow:{color, blur:30*u}})   // glow behind text
frost.snap(scene, 8); frost.glass(g, x, y, w, h, 34*u, {tint:K.rgba(pal.a,.1), glow:K.rgba(pal.a,.45)});   // const frost = new K.Frost(W,H)
K.shine(g, x, y, w, h, r, k)              // diagonal specular sweep, k = 0→1
```
Order for glass: draw everything that should appear *behind* the glass → `frost.snap(scene)` → glass panels → content on top. Glass needs something colourful behind it; on flat black it looks like grey plastic.

## 4. Particles and morphs
- **Closed-form fields:** `K.field({n, seed, life, t0, spawn, drag, gravity}).draw(g, t, {glow|streak})` — every particle position is a function of `t` (no state). Use `spawn` to shape emission (rain, embers, dust, snow).
- **Bursts:** `K.sparks(g, lt, x, y, {n, speed, drag, color, seed})` (streaks), `K.rings(...)`, `K.confetti(...)`.
- **Text/logo → particles:** 
```js
const A = K.sampleText('hello', {size:260, w:1800, h:640, step:3});            // points around (0,0)
const im = (await K.loadImages({logo:'assets/logo.png'})).logo;
const B = K.samplePoints(im.width, im.height, g2 => g2.drawImage(im, 0, 0), 4);  // any drawing → points
const m = K.morph(A, B, {dirA:1, dirB:-1});                                     // dirB:-1 = Persian writes right→left
K.dots(g, m.at(K.seg(t, 4, 6, K.E.inOutCubic), {swirl:1}), W/2, H/2, {size:2.2, color:'#9fe', glow:1});
```
- **70 k+ particles with motion blur/DOF on the GPU:** start from `templates/particles` (positions are a pure function of attributes + `t` in the vertex shader; morph chain, curl-noise smoke, 180° shutter, bokeh).
- Colour particles by *position* (a gradient across the word) — it reads richer than random hues.

## 5. Draw-on strokes and paths
```js
const sp = K.svgPath('M0 0 C…');                          // measure any SVG path
g.setLineDash([sp.length * p, sp.length + 1]); g.stroke(sp.path2d);   // p = 0→1 draws it on; K.undash(g) after
const {x, y, angle} = sp.at(u);                           // a pen tip / arrow / car riding the path
```
Use for logos, routes/maps, signatures, underlines, chart lines (`UI.lineChart(..., p)`), circuit traces. Combine with `K.neon` for glowing lines, and `K.glow` at the pen tip.

## 6. 3D without a library
- **Painter's algorithm:** `const cam = K.cam3({x,y,z:-900,yaw,pitch,fov:.9,W,H}); K.drawFaces(g, cam, faces, {light, fog})` with `faces = [{pts:[[x,y,z]…], color, stroke}]` (world: x right, y up, z forward). Rotate points with `K.rotX/rotY/rotZ`. Good for cubes, cities, terrain, isometric scenes, low-poly. No intersecting faces (sort is per-face).
- **Fake 3D that sells:** tilt cards with `ctx.transform` + shadow, parallax layers, perspective floor lines, scaled sprites by depth.
- **Real 3D:** the `shader` template (SDF raymarching) or a vendored `three.module.js` in the project (a `<script type=module>`; render one frame per `renderFrame(t)`, keep `preserveDrawingBuffer:true`, no clocks).

## 7. Shaders and raymarching
`templates/shader` is a complete fullscreen-fragment-shader film (torus knot assemblage, smooth-min blend, glow accumulation, tetrahedron normals, AO, fresnel, brand-colour ramp). Snippets to reuse:
```glsl
float smin(float a, float b, float k){ float h = max(k-abs(a-b),0.)/k; return min(a,b) - h*h*k*.25; }   // organic blends
vec3  pal(float x){ return mix(mix(uColA,uColB,smoothstep(0.,.5,fract(x))),uColC,smoothstep(.5,1.,fract(x))); }
// glow along the ray: glow += exp(-d*5.5)*.018;  colour += glow*pal(id*.17+t*.05);   (neon without extra passes)
// kaleidoscope fold: p.xz = abs(p.xz) - .6; p.xz *= rot(t*.2);        // domain repetition: p = mod(p+.5*c,c)-.5*c;
```
**Shadertoy adapter** — most public shaders drop in:
```glsl
#version 300 es
precision highp float; uniform vec2 uRes; uniform float uT; out vec4 outColor;
#define iResolution vec3(uRes, 1.)
#define iTime uT
/* paste mainImage(out vec4 fragColor, in vec2 fragCoord) here (declare its helper functions above it) */
void main(){ vec4 c; mainImage(c, gl_FragCoord.xy); outColor = vec4(c.rgb, 1.); }
```
Cost control: ≤ 96 march steps, early exit at `t > far`, resolution scale (`--w 1280 --h 720`), avoid `sin` in inner loops. Determinism: hashes built from `fract/dot` (no `sin(big)`) behave identically across GPUs.

## 8. Generative geometry (girih, rosettes, flow)
`lib/geometry.js` builds *exact* Islamic star patterns with Hankin's method and reveals them from the centre like a compass drawing:
```js
const pat = G.pattern('octsquare', 67.5, {size: 60, cols: 3, rows: 3});         // 'square' | 'hex' | 'tri' | 'octsquare'
G.draw(g, pat, {cx:W/2, cy:H/2, reveal: K.seg(t,.5,4,K.E.inOutCubic), width:3, color:'#f2c14e', glow:.8,
                fill:(poly,i) => i%3===0 ? 'rgba(30,140,170,.55)' : null, rotate: t*.05});
```
Good angles: hex 60 (6-point star) · 45 · 30; octsquare 67.5 (8-point star) · 45; square 22.5 · 30 · 67.5 (45° is degenerate); tri 30 · 45 · 75. Rosettes/shamsa: `G.polar(pts, n, {mirror:true})` replicates a motif n-fold; `G.starPolygon(n,k,r)` gives {8/3}, {10/3}…; `G.spiro`, `G.lissajous` for curves; `G.flow({n,steps,scale,seed})` for deterministic curl-noise streamlines (ink, hair, wind). Construct → fill with tile colours → light up on music notes: the structure of the Naqsh-e Jahan film. Add an automated invariant check (e.g. polygon areas add up to the cell area) when geometry must be exact.

## 9. UI mockups and data-viz
`templates/explainer` shows the pattern: **design the UI at a comfortable "screen" size (about 1000×620 units, fonts 15–30) and scale it to the frame with `UI.fit(g, x, y, w, 1000, 620, () => {…})`** — otherwise 14 px text is unreadable in a video. Components: `UI.browser/window/phone/card`, `UI.button/toggle/slider/progress/input/pill/avatar`, `UI.code` (typewriter + syntax colours), `UI.chat` (+`typingDots`), `UI.toast`, `UI.cursor` (keyframed path + click ripples → cue times), `UI.lineChart/barChart/donut`, `UI.icon`. Theme via `UI.theme`. Put click times in `cues` and let `audio.mjs` play the sounds from the same list. Use the project's *real* copy and screenshots when available.
Charts: label directly, avoid legends, animate with ease-out, show one number big.

## 10. Characters and illustration
Flat vector characters from ellipses, rounded rectangles and Béziers; limbs with `K.ik2(x0,y0,x1,y1,l1,l2,±1)` (hand follows a target such as a pen tip); walk cycles from `sin` phases; blinks at hash-based irregular times (`K.hash(Math.floor(t*.6)) > .8`); head sway with `K.noise1`; a 0.14 s lag on secondary parts. Keep shapes simple and a strict palette; add rim light with a lighter offset stroke.

## 11. Film look
grain .04–.06 · vignette .35–.5 · subtle CA .002 (hits: spike) · halation (bloom tinted warm: `bloomTint:[1,.85,.7]`) · gate weave (translate ±0.7 px by `K.noise1(t*24)`) · colour grade (`tint`, `lift`, `contrast 1.05`) · letterbox bars (2.39:1 → black rects 12 % top/bottom) · light leaks (`K.glow` orange at an edge) · flicker (brightness ×(1+.02*noise1(t*12))) · dust and hair (a few `K.field` streaks). Apply *less* on UI explainers and kinetic type; *more* on cinematic pieces.

## 12. Procedural textures
Bake once, reuse (`K.bake(key,w,h,fn)` — it paints on a *software* canvas on purpose; seeds via `K.rng`): paper (`K.paper(W,H,{base,ink})`), tile glaze (two noise octaves + speckle), halftone (dot grid sized by luminance), scanlines, concrete (fbm + specks), brushed metal (long horizontal strokes), cracks (random walks with branching). Bake at load, not per frame.

## 13. Performance
Prefer `K.glow` sprites to `shadowBlur`; avoid `g.filter` on large areas per frame; cache static layers with `K.bake`; keep gradients small; batch strokes into one path; skip work for things off-screen; precompute point sets at load; use `willReadFrequently` for canvases you read. **GPU memory trap:** on the main (GPU-accelerated) canvas, thousands of small draws with a blend mode other than `source-over`/`lighter` (`multiply`, `screen`, `overlay`…) make Skia allocate GPU memory per draw — 16 000 `multiply` rects grabbed 3.7 GB *per worker* and stalled a 30 GB machine. Paint such layers once on a software canvas (`K.bake`, or `K.canvas(w,h,{cpu:true})`) and `drawImage` the result; the renderer's `probe:` line shows what one worker costs. Profile with `node tools/render.mjs --profile`; for WebGL check whether time is in `pixel readback` (GPU work) or `renderFrame`.

## 14. Images, video and data
- Images: `await K.loadImages({logo:'assets/logo.png'})` in `window.ready`; keep aspect ratio; premultiplied alpha is handled by canvas.
- Video files are **not seekable deterministically** in headless Chrome: pre-extract frames (`ffmpeg -i in.mp4 -vf fps=30 frames/%05d.png`) and draw `frames[Math.floor(t*fps)]`, or avoid them.
- Data: `fetch('data.json')` inside `window.ready`; never at render time. Real numbers only.

## 10. v2: cinema-grade looks in a few lines
Use the GPU stack instead of hand-built 2D tricks: **Stage** for scenes and transitions, **Scene3D** for objects with reflections and depth of field (`atlas show text3d-chrome`, `city-night-flight`, `glass-gems`), **Parts** for morphs and bursts (`particles-morph-word`, `particles-burst-spark`), **FX** for shader backgrounds (`bg-catalog`) and filters (`looks` family: ascii, dither, hatch, mosaic, vhs, crt, riso…), **Type** for kinetic typography (`atlas list type`), **Cine** for camera moves (`atlas list camera`). Each atlas entry has tested code; `atlas.mjs sheet <ids>` shows it first. Light and atmosphere: `atlas list light`. Looks and grades: `atlas list looks`, `atlas show grade-recipes`.
