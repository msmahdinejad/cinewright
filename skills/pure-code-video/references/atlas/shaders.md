# Shaders — backgrounds you can name, and GLSL you can write in ten lines

Two ways in. (1) `fx.bg(name, { c: [4 colours], speed, scale, amt, seed, center }, { to: rt })` — 25 ready-made animated backgrounds (see `bg-catalog`).
(2) Write your own fragment shader: `gfx.pass(gfx.prog(GLSL), { uniforms }, { to: rt })`. The header is added for you (`in vec2 vUv; out vec4 o; uniform vec2 uRes; uniform float uT;`);
`//#use math,noise,color,sdf` pulls in helper chunks (hash/noise/fbm/voronoi, palettes, SDF shapes, easing, `aspectUv(vUv, uRes)` → centred y∈[−.5,.5]).
Everything must be a **pure function of `uT`** — no feedback buffers, no accumulation across frames (frames render independently and in parallel). Want trails or motion blur? Sample several past times inside the shader (see `glsl-motion-blur`).
Shader recipes below are complete programs — copy, change numbers, change palette. Output linear-ish display colour; Post (bloom, grain, grade) is applied after.

## bg-catalog — The 25 built-in backgrounds
tags: shader background fx aurora nebula marble gradient plasma caustics cells hex topo synth tunnel kaleido blobs bokeh rays flow halftone galaxy rain clouds waves fire blueprint chrome dots cheap
use: choose a mood in one line; every scene needs a background that is not flat black. `FX.bgs` lists names, `FX.info(name).desc` says what the four colours mean
how: colours `c:[c0 (darkest/base), c1, c2, c3]`; `speed` scales time, `scale` zooms the pattern, `amt` is intensity, `seed` changes the layout, `center` moves the focus. Mood map — calm: aurora, gradient, clouds, waves, caustics · cosmic: nebula, galaxy, rays · tech: hex, topo, blueprint, synth, cells, dots, tunnel · organic: marble, blobs, flow, plasma, fire · graphic: halftone, kaleido, bokeh, chrome, rain.
pair: contact sheet of all of them = `references/gallery/backgrounds.jpg` (look at it before choosing)
```js gl
//@ {"peak":1.5,"look":{"bloom":0.6}}
fx.bg('aurora', { c: ['#02040c', '#33ff99', '#22ccff', '#a566ff'], speed: 1, scale: 1, amt: 1 }, { to: rt });
```

## glsl-raymarch-metaballs — Liquid metal blobs (raymarched SDF)
tags: glsl raymarch sdf metaballs liquid metal blobs chrome organic hero medium
use: an abstract hero object with no mesh: merging liquid-metal blobs; "fluid", "alive", "melting" ideas; backgrounds behind a title
how: 5 spheres orbiting on sines, joined with `opSmoothUnion`; sphere-trace 64 steps; normal by central differences; shading = a hand-made studio environment function sampled along the reflection vector (key softbox + magenta/cyan accents) + Fresnel. ACES tone-mapping keeps highlights from clipping.
```glsl
//@ {"peak":1.5,"look":{"bloom":0.7}}
//#use math,noise,color,sdf
float map(vec3 p){ float t = uT * .8, d = 1e3;
  for (int i = 0; i < 5; i++) { float fi = float(i); vec3 c = vec3(sin(t * (.7 + fi * .21) + fi * 2.1) * 1.3, cos(t * (.5 + fi * .17) + fi * 1.3) * .8, sin(t * .4 + fi) * .6); d = opSmoothUnion(d, sdSphere(p - c, .55 + .1 * sin(t + fi)), .6); }
  return d; }
vec3 nrm(vec3 p){ vec2 e = vec2(.002, 0.); return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx))); }
vec3 env(vec3 d){ float k = max(dot(d, normalize(vec3(-.5, .8, .4))), 0.); vec3 c = mix(vec3(.015, .015, .03), vec3(.3, .36, .55), d.y * .5 + .5);
  c += vec3(1., .95, .85) * pow(k, 5.) * 2.2; c += vec3(1., .2, .5) * pow(max(sin(d.x * 5. + 1.) * .5 + .5, 0.), 8.) * .6 * smoothstep(-.3, .5, d.y); c += vec3(.2, .8, 1.) * pow(max(dot(d, normalize(vec3(.8, .1, -.4))), 0.), 14.) * 1.6; return c; }
void main(){ vec2 p = aspectUv(vUv, uRes); vec3 ro = vec3(0., 0., 4.), rd = normalize(vec3(p, -1.8)); float t = 0.; bool hit = false;
  for (int i = 0; i < 64; i++) { float d = map(ro + rd * t); if (d < .002) { hit = true; break; } t += d; if (t > 9.) break; }
  vec3 col = mix(vec3(.01, .01, .03), vec3(.06, .03, .12), vUv.y);
  if (hit) { vec3 pos = ro + rd * t, n = nrm(pos), r = reflect(rd, n); float fres = pow(1. - max(dot(n, -rd), 0.), 4.); col = env(r) * (.6 + .5 * fres); }
  o = vec4(aces(col * 1.1), 1.); }
```

## glsl-voronoi-cracks — Glowing cell borders
tags: glsl voronoi cells cracks borders tech organic network shatter cheap
use: "network", "cells", glass shatter, cracked earth/lava, a restless tech background
how: two-pass Voronoi (nearest cell, then exact border distance); cells drift on sines; borders glow with a palette that shifts per cell.
```glsl
//@ {"peak":1.5,"look":{"bloom":0.9}}
//#use math,noise,color
void main(){ vec2 p = aspectUv(vUv, uRes) * 5. + vec2(uT * .15, 0.), ip = floor(p), fp = fract(p); float md = 8.; vec2 mr, mg;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(i, j), h = hash22(ip + g); h = .5 + .5 * sin(uT * .8 + 6.2831 * h); vec2 r = g + h - fp; float d = dot(r, r); if (d < md) { md = d; mr = r; mg = g; } }
  float b = 8.; for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) { vec2 g = mg + vec2(i, j), h = hash22(ip + g); h = .5 + .5 * sin(uT * .8 + 6.2831 * h); vec2 r = g + h - fp; if (dot(mr - r, mr - r) > 1e-5) b = min(b, dot(.5 * (mr + r), normalize(r - mr))); }
  float id = hash21(ip + mg); vec3 cell = pal(id * .35 + .55, vec3(.06), vec3(.1), vec3(1.), vec3(.0, .15, .3));
  vec3 edge = pal(id * .5 + uT * .05, vec3(.5), vec3(.5), vec3(1.), vec3(.0, .33, .67)) * (exp(-b * 38.) * 1.6 + .03);
  o = vec4(cell + edge, 1.); }
```

## glsl-julia-zoom — Endless fractal zoom
tags: glsl fractal julia mandelbrot zoom infinite hypnotic colour medium
use: psychedelic/"infinite" transitions, science/maths tone, a hypnotic loop under a title. Smooth colouring (no banding) is what makes it look expensive
how: iterate z → z²+c; the escape count is smoothed with log2(log2|z|²) and mapped through a cosine palette. Zoom toward a boundary point with exponential scale so the speed feels constant.
```glsl
//@ {"peak":1.5}
//#use math,color
void main(){ vec2 p = aspectUv(vUv, uRes); float z = exp(-uT * .45) * 1.5; vec2 c = vec2(-.7269, .1889) + .004 * vec2(cos(uT * .6), sin(uT * .5)), zc = p * z + vec2(-.0, .0) + vec2(.12, .03) * (1. - z) * .6; float it = 0.;
  for (int i = 0; i < 110; i++) { zc = vec2(zc.x * zc.x - zc.y * zc.y, 2. * zc.x * zc.y) + c; if (dot(zc, zc) > 256.) break; it += 1.; }
  float s = it - log2(log2(max(dot(zc, zc), 2.))) + 4.; vec3 col = pal(s * .03 + uT * .04, vec3(.5), vec3(.5), vec3(1.), vec3(.0, .33, .67)); col *= it > 108. ? 0. : 1.; o = vec4(col * smoothstep(0., 6., it), 1.); }
```

## glsl-truchet-weave — Woven arcs that flip
tags: glsl truchet tiles pattern weave arcs geometric graphic cheap
use: a graphic, rhythmic background; maze/flow/"connections" metaphors; Islamic-inspired interlace feel without heavy geometry
how: each tile draws two quarter-circle arcs; a hash decides which diagonal; a time-driven flip animates tiles on a staggered schedule. Colour by hashed palette + soft glow.
```glsl
//@ {"peak":1.5,"look":{"bloom":0.7}}
//#use math,noise,color
void main(){ vec2 p = aspectUv(vUv, uRes) * 7. + vec2(uT * .3, uT * .12), id = floor(p), f = fract(p) - .5; float r = hash21(id), k = floor(uT * .7 + r * 6.);
  if (mod(k + step(.5, r), 2.) > .5) f.x = -f.x; float d = min(abs(length(f - vec2(.5)) - .5), abs(length(f + vec2(.5)) - .5));
  vec3 base = vec3(.03, .025, .08), ink = pal(hash21(id + 3.) * .35 + uT * .04, vec3(.55), vec3(.45), vec3(1.), vec3(.0, .1, .25));
  o = vec4(base + ink * (smoothstep(.085, .06, d) + exp(-d * 18.) * .35), 1.); }
```

## glsl-shape-contours — Morphing SDF shape with ripple contours
tags: glsl sdf shape morph contour ripple graphic topographic geometry clean cheap
use: calm abstract graphics, logo-adjacent backgrounds, "pulse/ripple" under a title, an elegant way to morph circle → square → star
how: signed distance fields mix linearly (`mix(sdfA, sdfB, ease(t))`), which morphs shapes for free; `sin(d * freq − t)` turns the distance into travelling contour lines; a bright fill shows the current shape.
```glsl
//@ {"peak":1.5,"look":{"bloom":0.6}}
//#use math,color,sdf
void main(){ vec2 p = rot(uT * .25) * aspectUv(vUv, uRes); float ph = uT * .6, k = ease(fract(ph)); int i = int(mod(floor(ph), 3.));
  float a = sdCircle(p, .24), b = sdRBox(p, vec2(.22), .05), c = sdStar(p, .27, 5., 2.7); float f0 = i == 0 ? a : i == 1 ? b : c, f1 = i == 0 ? b : i == 1 ? c : a, d = mix(f0, f1, k);
  float lines = smoothstep(.5, .9, sin(d * 70. - uT * 3.) * .5 + .5) * exp(-max(d, 0.) * 3.5); vec3 bg = mix(vec3(.02, .02, .07), vec3(.07, .04, .16), vUv.y);
  vec3 fillc = pal(uT * .08 + p.y * .6, vec3(.6), vec3(.4), vec3(1.), vec3(.0, .2, .45)); vec3 col = bg + vec3(.35, .5, 1.) * lines + fillc * smoothstep(.006, -.006, d) + fillc * exp(-max(d, 0.) * 18.) * .5;
  o = vec4(col, 1.); }
```

## glsl-starfield-warp — Hyperspace star streaks
tags: glsl stars warp hyperspace speed streaks space transition cheap
use: speed ramps, transitions into "the future", scene changes in sci-fi/tech tones, loading screens that aren't boring
how: polar bins around the centre, one star per bin per layer; each star's radius grows quadratically with time and leaves a tail proportional to its speed. 4 layers = parallax.
```glsl
//@ {"peak":1.5,"look":{"bloom":1.0,"zoomBlur":0.08}}
//#use math,noise
void main(){ vec2 p = aspectUv(vUv, uRes); float a = atan(p.y, p.x), r = length(p); vec3 col = vec3(.005, .006, .02) + vec3(.02, .03, .08) * (1. - r);
  for (int l = 0; l < 4; l++) { float fl = float(l), n = 70. + fl * 55., ang = a * n / TAU, id = floor(ang), h = hash11(id + fl * 71.), z = fract(h + uT * (.22 + fl * .1)), rr = z * z * 1.1, len = .015 + z * .22 * (1. + fl * .3);
    float across = smoothstep(.07 + z * .05, 0., abs(fract(ang) - .5)), along = smoothstep(rr - len, rr, r) * smoothstep(rr + .004, rr, r);
    col += mix(vec3(.55, .75, 1.), vec3(1., .85, .7), hash11(id * 3. + fl)) * across * along * (.35 + 1.2 * z); }
  o = vec4(col, 1.); }
```

## glsl-retro-sun — Striped sun over a perspective grid
tags: glsl retro synthwave sun grid horizon 80s neon outrun cheap
use: 80s/synthwave/music tones, "going somewhere", a ready-made hero background that needs only a title over it
how: sky gradient; a sun disc with horizontal cut-outs that thicken toward the bottom (`sin(y·55)` vs a ramp); below the horizon a perspective grid: `z = k/y` gives depth, `fract(x·z)`/`fract(z+t)` give the lines, fading with distance.
```glsl
//@ {"peak":1.5,"look":{"bloom":0.55}}
//#use math
void main(){ vec2 p = aspectUv(vUv, uRes); float hz = -.06; vec3 col = mix(vec3(.02, 0., .07), vec3(.55, .06, .42), smoothstep(-.1, .55, p.y));
  if (p.y > hz) { vec2 sp = p - vec2(0., .16); float sd = length(sp) - .3, cut = sin(sp.y * 60. + uT * 1.2) * .5 + .5, ramp = clamp(-sp.y * 3. + .15, 0., .95), m = smoothstep(.01, -.01, sd) * smoothstep(ramp - .02, ramp + .02, cut);
    vec3 sun = mix(vec3(1., .25, .45), vec3(1., .9, .3), smoothstep(-.25, .25, sp.y)); col = mix(col, sun * 1.3, m); col += vec3(1., .3, .6) * exp(-max(sd, 0.) * 7.) * .35; }
  else { float y = hz - p.y, z = .35 / y, x = p.x * z; float gx = abs(fract(x * 1.1) - .5), gz = abs(fract(z * .55 + uT * .9) - .5); float g = max(smoothstep(.04 + z * .003, 0., gx), smoothstep(.05, 0., gz)) * exp(-z * .09);
    col = mix(vec3(.04, 0., .1), vec3(.25, .0, .3), smoothstep(0., .5, y)) + vec3(.9, .2, .9) * g * 1.4 + vec3(1., .3, .6) * exp(-y * 14.) * .4; }
  o = vec4(col, 1.); }
```

## glsl-ripples — Water rings that bend a pattern
tags: glsl ripples water rings refraction wave interactive calm cheap
use: a drop/tap/click moment, "signal spreads", sound waves, calm product backgrounds; the ripples also distort whatever you draw under them (use the same maths on a texture UV)
how: distance from a wandering centre → damped sine; the sine's gradient displaces the lookup into a striped palette (fake refraction). Replace the stripes with `texture(uTex, uv + offset)` to distort a real scene.
```glsl
//@ {"peak":1.5,"look":{"bloom":0.5}}
//#use math,color
void main(){ vec2 p = aspectUv(vUv, uRes), c = vec2(sin(uT * .6) * .25, cos(uT * .5) * .1), d = p - c; float r = length(d), w = sin(r * 40. - uT * 6.) * exp(-r * 2.6); vec2 q = p + normalize(d + 1e-5) * w * .05;
  float stripes = smoothstep(.45, .55, abs(fract(q.x * 7. + q.y * 2.) - .5) * 2.); vec3 col = mix(pal(q.y * .7 + uT * .05, vec3(.45), vec3(.4), vec3(1.), vec3(.0, .2, .5)) * .35, vec3(.9, .95, 1.), stripes * .35);
  col += vec3(.5, .8, 1.) * pow(max(w, 0.), 2.) * 2.; o = vec4(col, 1.); }
```

## glsl-motion-blur — Closed-form motion blur by sampling time
tags: glsl motion blur shutter accumulate temporal technique fast cheap
use: ANY fast-moving shader/graphic: instead of feedback buffers (forbidden: frames are independent), evaluate the scene at N times inside the shutter window and average. Same idea powers `Parts` motion blur and the renderer's `--blur`
how: loop over 24 sub-times `t − k·dt`; accumulate colour/coverage; the dots get natural comet tails. Increase the loop count for smoother tails; make dt proportional to speed to taste.
```glsl
//@ {"peak":1.5,"look":{"bloom":0.8}}
//#use math,color
vec2 pos(int i, float t){ float fi = float(i); return vec2(cos(t * (2.2 + fi * .5) + fi * 1.7) * .55, sin(t * (1.7 + fi * .4) + fi) * .27); }
void main(){ vec2 p = aspectUv(vUv, uRes); vec3 acc = vec3(0.);
  for (int s = 0; s < 24; s++) { float tt = uT - float(s) * .0042; for (int i = 0; i < 5; i++) { float d = length(p - pos(i, tt)) - .045; acc += pal(float(i) * .2 + .1, vec3(.55), vec3(.45), vec3(1.), vec3(.0, .33, .67)) * smoothstep(.012, -.004, d) / 24. * 1.6; } }
  o = vec4(vec3(.02, .02, .06) + acc, 1.); }
```

## glsl-halftone-wave — Pop-art halftone dots
tags: glsl halftone dots pop art print riso graphic comic wave cheap
use: playful/graphic/print looks (riso, comic, poster), a bold light background that is not another dark gradient
how: a grid of dots whose radius follows a travelling wave; two colours on cream paper. For a CMYK print feel draw three offset layers with slightly rotated grids.
```glsl
//@ {"peak":1.5}
//#use math
void main(){ vec2 p = aspectUv(vUv, uRes), g = p * 34., id = floor(g) + .5, f = fract(g) - .5; vec2 cc = id / 34.; float v = .5 + .5 * sin(length(cc - vec2(.15, .0)) * 11. - uT * 3.2 + cc.y * 2.), r = .1 + .42 * v;
  float dotm = smoothstep(r + .06, r - .06, length(f)); vec3 col = mix(vec3(.96, .92, .83), vec3(.93, .22, .3), dotm); o = vec4(col, 1.); }
```
