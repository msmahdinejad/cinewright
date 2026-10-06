# Engine cheat sheet — every library on one page

Load order in a page (the `cinema` and `showreel` templates already do this): `kit.js` → `post.js` → `gfx.js` → `trans.js` → `fx.js` → `scene3d.js` → `parts.js` → `type.js` → `cine.js` → `stage.js` (+ `ui.js`, `geometry.js` for 2D UI / ornament). Classic scripts (no modules) → globals `K Post GFX Trans FX Scene3D Geo Mat Env Cam3 M4 Parts Type Cine Stage UI G`.
Rules of the house: every function is a **pure function of time** (no `Math.random`, `Date.now`, no state that survives between frames — use `K.hash/K.rng/K.noise`); build heavy objects (Scene3D, Parts, geometry, textures) **once** at load; fonts must be loaded before the first frame (`window.ready`). `u = H / 1080` scales sizes to the frame; positions in 2D are pixels, in particles pixels from the centre (y up).

## The page contract
```js
window.VIDEO = { width: W, height: H, fps: 30, duration: 20, title: '…', markers: [{ t: 3, label: 'hero' }] };   // markers label contact sheets
window.ready = Promise.all([K.loadFonts(['800 Vazirmatn', '800 Inter']), S.ready()]);                           // everything async
window.renderFrame = t => { … };                                                                                 // pure function of t → draws the frame
// ?w=&h=&fps=&dur=&lang= re-compose: const Q = K.params(); const W = Q.w || 1920, H = Q.h || 1080;
// <script id="cues" type="application/json">{ "duration": 20, "bpm": 120, "t": { "hero": 3, … }, "hits": [3, 6, …] }</script>   shared with audio.mjs (readCues)
```

## K — kit.js (math, noise, easing, colour, text, shapes, effects)
`K.clamp lerp prog(t,a,b) smoothstep map(x,a,b,c,d,ease) mod fract TAU` · `K.hash(n) hash2 hash3 rng(seed) noise1 noise2 noise3 fbm curl pick` · easing `K.E.outCubic inOutExpo outBack outElastic …` (`in|out|inOut` × `Quad Cubic Quart Quint Sine Expo Circ Back Elastic Bounce`) · `K.spring(t,{f,z}) wobble keyframes seg(t,a,b,ease) fade stagger pulse(t,hits,decay) grid(bpm)`.
Colour: `K.rgb rgba(c,a) mix(a,b,k) hsl(h,s,l,a) oklch(l,c,h,a) palette(hue,{mode,dark})`. Canvas: `K.canvas(w,h,{cpu}) rr circle poly star regular gradient glow(g,x,y,r,colour,a) neon(g,colour,width,glow) drawOn undash svgPath(d) vignette bake(key,w,h,fn) paper(w,h,opts) keyWhite(img,{size,lo,hi,recolor})` (logo on white → transparent mark).
Text (Persian/Arabic shaped, RTL-aware): `K.text(g, str, x, y, { size, weight, family, fill, stroke, strokeW, align, max, spacing, glow, shadow, alpha, rot, skew, dir })` · `K.measure K.lay K.words(g,str,cx,y,lt,{each,dur}) K.chars K.typed(str,p) K.scramble(str,p,seed,frame) K.wrap` · `K.FONTS.sans|grotesk|display|serif|hand|rounded|mono|fa|faDisplay|faClassic|faKufi|faRuqaa|faNastaliq|faFun` · `K.loadFonts(['800 Vazirmatn'])` · `K.faDigits K.fmtNum(n,{fa,decimals,compact})`.
Motion/FX: `K.slam K.slide K.pop K.shake(t,amp,freq,seed) K.punch(t,hits) K.camera(g,W,H,{zoom,rot,x,y,shake}) K.iris K.wipe K.rings K.sparks K.confetti K.trail K.Frost(frosted glass) K.shine K.bars K.field` · particles-lite `K.samplePoints K.sampleText K.morph K.dots` · 3D-lite `K.cam3 K.drawFaces`. `K.params()` URL params · `K.layout(W,H)`.

## Post — post.js (the final image: bloom, grade, grain, glitch…)
```js
const post = new Post(canvasOut);                 // once; owns the WebGL2 context + HDR target
post.begin([0,0,0,1]);  /* draw with GFX / Stage / Scene3D into the HDR target */  post.end({ frame, bloom: .6, threshold: .62, streak: 0, ca: .0025, grain: .045, vignette: .38, tint: [1,1,1], lift: [0,0,0],
  contrast: 1, sat: 1, exposure: 1, fade: 0, fadeColor: [0,0,0], glitch: 0, zoomBlur: 0, scan: 0, pixelate: 0, warp: 0, flash: [0,0,0], bloomTint: [1,1,1], center: [.5,.5], shock: [[x,y,radius,strength]] });
post.render(canvas2d, opts)                       // simple path: a 2D canvas in, graded frame out
```
Always pass `frame: Math.round(t*fps)` (grain/glitch must be a function of time).

## GFX — gfx.js (WebGL toolkit on Post's context)
`const gfx = new GFX(post); gfx.time(t)` (once per frame) · `gfx.prog(fragSrc, {tag})` (header added: `in vec2 vUv; out vec4 o; uniform vec2 uRes; uniform float uT;` + `//#use math,noise,color,sdf`) · `gfx.pass(P, uniforms, {to, blend, clear})` (uniform types are read from the program; textures/render targets just work) · `gfx.rt(w,h,{float,depth:false|'rb'|'tex'})` · `gfx.tmp(name,w,h)` scratch targets · `gfx.up(canvas, tex)` upload a 2D canvas (returns the texture; pass it back to update in place) · `gfx.blit(tex,{to,blend:'none|alpha|add|screen|mul|max',alpha})` · `gfx.layer(canvas,{to,alpha})` · `gfx.clear(colour, rt)` · `gfx.bind`.
GLSL chunks: math (`rot sat remap smin ease eio3 aspectUv`) · noise (`hash11/21/22/31 vnoise snoise fbm fbm3 curl warp voronoi`) · color (`hsv2rgb pal ramp3 ramp4 aces luma srgb2lin lin2srgb`) · sdf (`sdCircle sdBox sdRBox sdSeg sdRing sdHex sdStar sdSphere sdBox3 sdTorus opSmoothUnion`). Gotchas: unset sampler uniforms read texture unit 0 (the target itself → INVALID_OPERATION): always set every sampler; no feedback between frames; avoid thousands of blend-mode draws on a GPU 2D canvas.

## FX — fx.js (25 backgrounds, 26 filters, DOF)
`const fx = new FX(gfx); fx.bg(name, { c: [4 colours], speed, scale, amt, seed, center }, { to })` — `FX.bgs`: aurora nebula marble gradient plasma caustics cells hex topo synth tunnel kaleido blobs bokeh rays flow halftone galaxy rain clouds waves fire blueprint chrome dots.
`fx.filter(name, srcTex, params, { to })` · `fx.filterCanvas(canvas2d, name, params, { to })` (2D scene → shader filter) — `FX.filters`: blur radial kaleido mirror ripple halftone pixelate posterize gradmap edge vhs crt lens tilt glitch chroma tile polar ascii dither hatch bulge mosaic emboss swirl mosh dof. `FX.info(name)` → parameters. `fx.dof(color, depthTex, {focus, range, blur, near, far})`.

## Trans — trans.js (32 GPU transitions)
`Trans.run(gfx, name, texA, texB, p01, { dir, par, color, center, to })` → `{ p, look }` · `Trans.list` · `Trans.info(name)` · `Trans.define(name, { ease, par, glsl: 'vec4 tr(vec2 uv){…sA(uv) sB(uv) uP uPar uDir uCol uCen…}' })`.
Names: fade dip flash slide whip zoom spin wipe iris diamond clock spiral blinds checker dots glitch pixelate dissolve burn ink liquid swirl shatter doors flip luma lightleak chroma blur slice scan zoomBlurCut.

## Stage — stage.js (the film editor)
```js
const S = new Stage(post, gfx, { fps });
S.timeline([
  { id: 'open',  at: 0,   draw: (g, lt, t, S) => { … 2D … }, look: { bloom: .8 } },                         // draw = 2D canvas scene (lt = seconds since start, may be slightly < 0 in a transition)
  { id: 'hero',  at: 3.0, enter: ['zoomBlurCut', .5, { dir: [1,0], par: [], color: [1,1,1], center: [.5,.5] }], gl: ({ gfx, post, rt, W, H, S, u }, lt, t) => { … GPU draw into rt … }, init: async ctx => {…} },
]);                                                                    // a scene may have both gl (below) and draw (2D on top)
S.overlay((g, t) => { … persistent 2D: captions, bug, letterbox … });
S.camera = t => ({ zoom: 1 + .03 * K.punch(t, HITS), rot: 0, x: 0, y: 0 });         // global 2D camera in uv units (or Cine.mix(...))
S.look((t, base) => ({ ca: (base.ca ?? .0025) + .006 * K.pulse(t, HITS, .1) }));    // global Post options; sees the scene/transition look
window.ready = Promise.all([K.loadFonts([…]), S.ready()]);   function renderFrame(t) { S.render(t, { bloom: .6 }); }
```
Scenes overlap during transitions (centred on `at`); each is drawn with its own `lt`; scenes must be pure in `(lt, t)`.

## Scene3D — scene3d.js (WebGL2 3D engine)
```js
const S3 = new Scene3D(gfx, { W, H, ss: 1.5 });  S3.env = Env.studio({ colors: [floor, key, accent1, accent2] });  // Env.studio softbox sunset night space sky gradient custom
S3.light(0, { dir, color, intensity });  S3.floor({ y, color, reflect, fade });  S3.fog = { color, density, hDensity, hRef };  S3.sky = { amt, rough };
S3.cam.pos = [x,y,z]; S3.cam.target = [0,0,0]; S3.cam.fov = 32;           // also cam.up, cam.near, cam.far — assign the properties, don't replace the object
const m = S3.mesh(Geo.torusKnot({ radius, tube }), Mat.chrome(), { pos, rot, scale, tint });   m.rot = [x,y,z];                 // per frame: assign pos/rot/scale/visible
S3.instances(geo, mat, [{ pos, scale, rot, color }, …]);                                                                    // static, one draw call
const tex = S3.render({ clear: [r,g,b,a] /* omit = env sky */, dof: { focus, range, blur }, to });   gfx.blit(tex, { to: rt, blend: 'alpha' });   S3.toScreen([x,y,z]) → pixels (always from the CURRENT camera: set cam.pos/target first)
```
Geo: `box sphere icosphere plane cylinder cone torus torusKnot capsule lathe(profile) tube(curveFn) param terrain relief(canvas) text(str,{height,depth}) merge flat` (+ `.withBary()` for wire) · Mat: `pbr chrome gold copper silver plastic glass({color,density,thickness}) toon clay emissive(colour,intensity,{map}) holo iridescent wire` — options `base metal rough coat rim rimAmt rimPow windows:{on,size,color,seed} map alpha` · Env colours are *light intensities*: first dark, second near-white key, others saturated · Cam3: `orbit(t,{center,radius,speed,elev,phase,height,wobble}) path(points,u) shake(t,amp,freq)`.

## Parts — parts.js (GPU particles)
`const M = new Parts.Morph(gfx, { count: 50000 }); M.shapes([Parts.cloud(N,{w,h}), Parts.text('word',{height}), Parts.image(canvas,{height}), Parts.mesh(geo,{scale}), Parts.shape('ring'|'circle'|'star'|'grid'|'spiral'|'sphere'|'torus'|'box'|'line',{r,n})]);`
`M.draw({ progress, t, colors:[a,b], flow, size, glow, spread, wobble, cam:{yaw,pitch,dist}, dof, shutter, sprite }, { to })` · `const E = new Parts.Emitter(gfx, { count }); E.burst({ t0, pos, n, speed:[a,b], drag, gravity, life, size, colors, sprite, glow }); E.stream({ t0, t1, n, spawn:{box}, dir, angle, speed, life, flow, loop }); E.draw({ t, cam, dof, shutter }, { to })`.

## Type — type.js (kinetic typography)
`Type.poster stack outline reveal slice glitch extrude marquee weight wave ring counter marker assemble fillWith units` — see `atlas/type.md` for each in action.

## Cine — cine.js (cinematography)
`Cine.path(keys,{ease})(t) mix(...cams) punch(t,hits,{amp,decay}) shake(t,hits,{amp,decay,freq}) handheld(t,{amp,speed,roll}) ramp(t, [[videoT, sceneT],…]) track(t,[[t,v],…]) focus letterbox(g,W,H,ratio,p) parallax(g,layers,camX,camY) beats(bpm)`.

## UI (ui.js) and G (geometry.js)
`UI.window browser phone card button toggle slider progress input pill avatar code chat typingDots toast cursor lineChart barChart donut icon(name) fit theme` · `G.pattern(kind, angle, {size,cols,rows}) G.draw(g, pat, {cx,cy,reveal,width,color,glow,rotate,fill}) G.polar G.starPolygon G.spiro G.lissajous G.flow`.

## Audio — synth.mjs (Node)
`import { Song, readCues, chord, note, scale, progression, PERSIAN } from './lib/synth.mjs'; const s = new Song({ dur, bpm, seed }); …instruments…; s.write('audio.wav', { lufs: -14, reverb: { rt60: 3, mix: .3 }, fadeOut: .5 })`.
Instruments: drums `kick snare clap hat tom rim` · Persian `tombak daf` · `bass sub pad lead pluck santur keys(kind: ep|bell|marimba|organ) strings brass flute ney choir arp` · FX `whoosh riser downlifter impact hit click pop tick type swipe chime sparkle glitch zap success error heartbeat shutter drone gong ambience crackle babble` · `groove('house'|'trap'|'dnb'|'breakbeat'|'lofi'|'halftime'|'sixeight', t0, bars)` · `duck(bus, times, {depth, attack, release})` · `pattern(t0, 'x..o.X..', fn)`. Details: `references/sound.md`, recipes: `atlas/sound.md`.

## Tools
`render.mjs` (full render, `sheet`, `still`, `verify`, `serve`, `--detach`/`status`/`stop`) · `qc.mjs check|energy|audio|sheet` · `scaffold.mjs` · `atlas.mjs` (search/show/sheet/test/wav/gallery) · `inspire.mjs` · `doctor.mjs` (environment check) · `analyze-audio.mjs` (envelopes for audio-reactive visuals).
