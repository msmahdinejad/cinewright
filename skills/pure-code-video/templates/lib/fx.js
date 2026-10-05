/* fx.js — a library of ready-made GPU looks. Needs gfx.js.   Classic script → window.FX.

   BACKGROUNDS — full-screen procedural images (colour them with 4 colours, drive them with time):
     const fx = new FX(gfx);
     fx.bg('aurora', { c: ['#02040c', '#33ff99', '#22ccff', '#a566ff'], speed: 1, scale: 1, amt: 1, seed: 0, center: [.5, .5] }, { to: rt });
     FX.bgs → names:  aurora nebula marble gradient plasma caustics cells hex topo synth tunnel kaleido blobs bokeh rays flow halftone galaxy rain clouds waves fire blueprint chrome dots
   (c = [c0,c1,c2,c3]; every background documents what the colours mean in FX.info(name).desc. Time comes from gfx.t — call gfx.time(t) once per frame.)

   FILTERS — take a texture / render target and write a new image (all HDR-safe):
     fx.filter('blur', src, { radius: 24 }, { to })        blur radial kaleido mirror ripple halftone pixelate posterize gradmap edge vhs crt lens tilt glitch chroma tile polar
                                                           ascii dither hatch bulge mosaic emboss swirl mosh   dof
     fx.dof(color, depthTex, { focus, range, blur, near, far })      depth of field for Scene3D renders (rt created with depth:'tex')
   fx.filterCanvas(canvas2d, name, params, { to })   run a filter straight over a 2D canvas (2D scene → VHS / ASCII / mosaic …)
   FX.filters → names, FX.info(name).par → parameters.

   Colours may be '#rrggbb' strings or [r,g,b] arrays (0–1). */
(() => {
  'use strict';
  const rgb = c => { if (Array.isArray(c) || ArrayBuffer.isView(c)) return c; if (typeof c === 'string') { let h = c.replace('#', ''); if (h.length === 3) h = h.replace(/./g, m => m + m); const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; } return [0, 0, 0]; };

  const BG_PRE = `
//#use math,noise,color,sdf
uniform vec3 uC0, uC1, uC2, uC3; uniform float uSpeed, uScale, uAmt, uSeed; uniform vec2 uCen;
`;
  const BG_MAIN = `\nvoid main(){ vec2 p = aspectUv(vUv, uRes); float t = uT * uSpeed + uSeed * 10.; o = vec4(max(bgfn(p, t), 0.), 1.); }`;

  /* name: { c:[4 colours], speed, scale, amt, desc, glsl:'vec3 bgfn(vec2 p, float t){…}' }   p = centred, aspect-corrected (y in −.5….5) */
  const BG = {
    aurora: { c: ['#02040c', '#33ff99', '#22ccff', '#a566ff'], desc: 'c0 sky, c1/c2/c3 the three curtains; amt = brightness',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale; vec3 col = mix(uC0 * 1.6, uC0 * .4, smoothstep(-.5, .6, p.y));
        float st = hash21(floor(p * 380.)); col += step(.9972, st) * vec3(.8, .9, 1.) * (.4 + .6 * sin(t * 3. + st * 60.) * .5 + .3) * smoothstep(-.1, .4, p.y);
        for (int i = 0; i < 3; i++) { float fi = float(i), fr = 1.05 + fi * .32;
          float curve = sin(q.x * fr + t * (.16 + fi * .05) + fi * 2.1) * .12 + sin(q.x * fr * 2.3 - t * .11 + fi) * .05 + sfbm(vec2(q.x * .9 + fi * 7., t * .05)) * .2;
          float y = q.y - (.02 + fi * .1) + .18 - curve; float body = exp(-max(y, 0.) * (3. + fi * .8)) * smoothstep(-.05, .0, y);
          float rays = .5 + .5 * vnoise(vec2(q.x * 26. + fi * 9., t * .45)); float fl = .78 + .22 * sin(t * 1.2 + fi * 2. + q.x * 3.);
          vec3 c = fi < .5 ? uC1 : fi < 1.5 ? uC2 : uC3; col += c * body * rays * fl * (.38 + .3 * uAmt); }
        return col; }` },
    nebula: { c: ['#050414', '#4a1a9a', '#e0457b', '#ffd27a'], desc: 'c0 space, c1→c3 dust colours; amt = star density',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 1.6; float a = fbm(q + t * .03), b = fbm(q * 1.7 - vec2(t * .02, 3.1) + a * 1.3), c = fbm(q * 2.6 + b * 2. + vec2(1.7, t * .015)); float d = smoothstep(.25, .85, c * (.6 + .6 * b));
        vec3 col = uC0 + ramp3(d, uC1, uC2, uC3) * (.15 + 1.5 * d * d); col *= .65 + .6 * smoothstep(.9, 0., length(p));
        float st = hash21(floor(p * 320.)); col += step(1. - .0045 * (.4 + uAmt), st) * (.4 + .6 * st) * vec3(.85, .92, 1.) * (1. - d * .75); return col; }` },
    marble: { c: ['#0a0a1a', '#1d3fbd', '#c24dff', '#ffd9a0'], desc: 'domain-warped liquid marble/ink; c0..c3 dark→light',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 1.4; vec2 w = vec2(fbm(q + vec2(0., t * .07)), fbm(q + vec2(5.2, 1.3 + t * .07))); vec2 w2 = vec2(fbm(q + 3. * w + vec2(1.7, 9.2)), fbm(q + 3. * w + vec2(8.3, 2.8)));
        float f = fbm(q + 3.5 * w2); vec3 col = ramp4(f, uC0, uC1, uC2, uC3); col = mix(col, uC3 * 1.2, smoothstep(.55, .95, length(w2)) * .45); col *= .5 + 1.1 * f * f;
        col += pow(max(0., sin(f * 20. + w.x * 6.)), 28.) * .22 * uC3 * uAmt; return col; }` },
    gradient: { c: ['#ff4d6d', '#ffb86b', '#6b6bff', '#00d4ff'], desc: 'animated mesh gradient (the soft modern look); amt = grain',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec3 acc = vec3(0.); float ws = 0.;
        for (int i = 0; i < 5; i++) { float fi = float(i); vec2 c = vec2(sin(t * (.21 + fi * .07) + fi * 1.9) * .6, cos(t * (.17 + fi * .05) + fi * 2.7) * .36) * uScale;
          vec3 col = i % 4 == 0 ? uC0 : i % 4 == 1 ? uC1 : i % 4 == 2 ? uC2 : uC3; float d = length(p - c); float w = 1. / (d * d * 7. + .05); acc += col * w; ws += w; }
        return acc / ws + (hash21(p * 913. + t) - .5) * .025 * uAmt; }` },
    plasma: { c: ['#10002b', '#7b2cbf', '#ff6b9d', '#ffd166'], desc: 'smooth sine plasma through a 4-colour ramp',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 3.; float v = sin(q.x * 1.3 + t) + sin(q.y * 1.7 - t * 1.2) + sin((q.x + q.y) * 1.1 + t * .7) + sin(length(q + vec2(sin(t * .5), cos(t * .4)) * 2.) * 2.);
        v = v * .25 + .5; return ramp4(fract(v + t * .02), uC0, uC1, uC2, uC3) * (.6 + .6 * v); }` },
    caustics: { c: ['#021a2b', '#0a5c8a', '#bff6ff', '#ffffff'], desc: 'underwater light net; c0/c1 water, c2 light lines; amt = intensity',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 3.; float c = 0.;
        for (int i = 0; i < 3; i++) { float fi = float(i); vec2 w = q * (1. + fi * .6) + vec2(t * (.15 + fi * .05), -t * .11); w += vec2(snoise(w * .7 + t * .2), snoise(w * .7 - t * .2 + 4.)) * .8; float n = 1. - abs(snoise(w)); c += pow(n, 6. + fi * 2.) * (.75 - fi * .15); }
        vec3 water = mix(uC1, uC0, smoothstep(-.5, .5, p.y)); return water + uC2 * c * 1.1 * uAmt; }` },
    cells: { c: ['#150a2e', '#ff3d81', '#ffb347', '#ffffff'], desc: 'moving voronoi / stained glass; c3 = cell borders',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 5.; vec2 i = floor(q), f = fract(q); float d1 = 8., d2 = 8.; vec2 id = vec2(0.);
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o2 = hash22(i + g); o2 = .5 + .5 * sin(t * .6 + 6.2831 * o2); vec2 r = g + o2 - f; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; id = i + g; } else if (d < d2) d2 = d; }
        float edge = smoothstep(.0, .07, sqrt(d2) - sqrt(d1)); float h = hash21(id); vec3 cell = ramp3(h, uC0 * 2., uC1, uC2) * (.3 + .7 * (1. - sqrt(d1))); return mix(uC3 * 1.6 * uAmt, cell, edge); }` },
    hex: { c: ['#040814', '#2b6cff', '#7cf2ff', '#ffffff'], desc: 'hex grid with travelling pulses; c1 lines, c2 glow',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 6.; vec2 r = vec2(1., 1.7320508), h = r * .5; vec2 a = mod(q, r) - h, b = mod(q - h, r) - h; vec2 gv = dot(a, a) < dot(b, b) ? a : b; vec2 id = q - gv;
        float d = max(abs(gv.x) * .866025 + abs(gv.y) * .5, abs(gv.y)); float edge = smoothstep(.42, .49, d); float wave = .5 + .5 * sin(length(id) * 1.1 - t * 2.); float rnd = hash21(floor(id * 3.));
        return uC0 + uC1 * edge * (.35 + .65 * wave) + uC2 * pow(wave, 8.) * (1. - edge) * .3 * step(.55, rnd) * uAmt; }` },
    topo: { c: ['#06110f', '#1fbf8f', '#e7ffb0', '#ffffff'], desc: 'topographic contour lines; c1 minor, c2 every 5th',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 1.8; float h = fbm(q + vec2(t * .03, 0.)) * 9.; float l = abs(fract(h) - .5) * 2.; float line = 1. - smoothstep(.0, .06 + .1 * uAmt, l); float major = 1. - smoothstep(0., .05, abs(fract(h * .2) - .5) * 2.);
        vec3 col = mix(uC0 * .6, uC0 * 1.5, fbm(q * .5)); return col + uC1 * line * .6 + uC2 * major * line * .9; }` },
    synth: { c: ['#12002e', '#ff2a9d', '#ffb800', '#00e5ff'], desc: 'retro sun + perspective grid; c0 sky top, c1 horizon, c2/c3 sun/grid',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec3 col = mix(uC1 * .8, uC0, smoothstep(-.06, .5, p.y)); float hz = -.06 + (uCen.y - .5) * .4;
        vec2 sp = p - vec2(0., hz + .2); float sd = length(sp); float sun = smoothstep(.2, .196, sd); float stripes = step(0., sin(sp.y * 90. - t * 1.2)); sun *= mix(1., stripes, smoothstep(.08, -.12, sp.y));
        col = mix(col, mix(uC2, uC1 * 1.2, clamp((.2 - sp.y) / .4, 0., 1.)), sun); col += uC1 * exp(-sd * 4.5) * .35 * uAmt;
        if (p.y < hz) { float z = .05 / (hz - p.y + .0005), x = p.x * z * 10.; float gx = abs(fract(x) - .5), gz = abs(fract(z * 3. + t * .6) - .5); float w = .012 + z * .004; float line = max(1. - smoothstep(0., w * 10., .5 - gx), 1. - smoothstep(0., w * 10., .5 - gz)); line = pow(line, 1.5);
          float fade = 1. / (1. + z * .25); col = uC0 * .5 + uC3 * line * fade * 1.6 * uAmt + uC1 * exp(-(hz - p.y) * 14.) * .35; }
        return col; }` },
    tunnel: { c: ['#030312', '#7b3cff', '#ff4fa3', '#37e5ff'], desc: 'infinite tunnel of rings and rays',
      glsl: `vec3 bgfn(vec2 p, float t){
        float r = length(p) + 1e-4, a = atan(p.y, p.x); float z = .35 / r + t * .6 * uScale; float rings = pow(abs(sin(z * 6.)), 10.), rays = pow(abs(sin(a * 8. + z * 1.4)), 14.);
        vec3 col = ramp3(.5 + .5 * sin(z * .75 + a * 2.), uC1, uC2, uC3) * (rings * .9 + rays * .5 * uAmt); return (uC0 + col) * smoothstep(.0, .3, r); }` },
    kaleido: { c: ['#080414', '#4b2bd6', '#ff5a8a', '#ffe08a'], desc: 'kaleidoscope of animated noise; amt = number of mirrors/2',
      glsl: `vec3 bgfn(vec2 p, float t){
        float n = 3. + floor(uAmt * 3. + .5) * 1.; float a = atan(p.y, p.x), r = length(p); a = abs(mod(a, 6.28318 / n) - 3.14159 / n); vec2 q = vec2(cos(a), sin(a)) * r * uScale * 3.;
        float f = fbm(q + t * .1), g = fbm(q * 2. - t * .13 + f); return ramp4(g, uC0, uC1, uC2, uC3) * (.4 + 1.2 * f); }` },
    blobs: { c: ['#0b0b1a', '#ff3b7f', '#ffb347', '#fff1c1'], desc: 'metaballs: c0 bg, c1→c3 inside/rim',
      glsl: `vec3 bgfn(vec2 p, float t){
        float f = 0.; for (int i = 0; i < 7; i++) { float fi = float(i); vec2 c = vec2(sin(t * (.3 + fi * .09) + fi * 2.), cos(t * (.27 + fi * .07) + fi * 3.1)) * vec2(.6, .3) * uScale; float r = .09 + .05 * sin(fi * 7. + t); f += r * r / (dot(p - c, p - c) + 1e-4); }
        float edge = smoothstep(1., 1.03, f), rim = exp(-abs(f - 1.) * 14.); vec3 col = uC0; col = mix(col, ramp3(clamp((f - 1.) * .3, 0., 1.), uC1, uC2, uC3), edge); return col + uC3 * rim * .55 * uAmt; }` },
    bokeh: { c: ['#070812', '#ff8a5c', '#6ec9ff', '#ff6ad5'], desc: 'out-of-focus lights drifting; amt = density',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec3 col = mix(uC0 * 1.8, uC0 * .4, smoothstep(-.4, .5, p.y));
        for (int L = 0; L < 3; L++) { float fl = float(L), sc = (3. + fl * 2.2) * uScale; vec2 q = p * sc + vec2(t * (.04 + fl * .02), t * .03 * (1. + fl)); vec2 i = floor(q), f = fract(q) - .5; float h = hash21(i + fl * 17.); vec2 o2 = (hash22(i + fl * 5.) - .5) * .5; float r = .1 + .25 * h, d = length(f - o2);
          float disc = smoothstep(r, r * .86, d) * .55 + (1. - smoothstep(r * .8, r, d)) * smoothstep(r * .7, r, d) * 1.2; float tw = .6 + .4 * sin(t * (.6 + h) + h * 40.); vec3 c = ramp3(fract(h * 3.7), uC1, uC2, uC3); col += c * disc * tw * (.55 / (1. + fl)) * step(.5 - .25 * uAmt, h); }
        return col; }` },
    rays: { c: ['#04030a', '#ff8a3d', '#ffd9a0', '#ffffff'], desc: 'god rays from `center`; c1 outer, c3 core',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 c = (uCen - .5) * vec2(uRes.x / uRes.y, 1.); vec2 d = p - c; float r = length(d), a = atan(d.y, d.x); float rays = 0.;
        for (int i = 0; i < 3; i++) { float fi = float(i); rays += vnoise(vec2(a * (8. + fi * 6.) * uScale + t * (.15 + fi * .1) * (mod(fi, 2.) < 1. ? 1. : -1.), fi * 3.7 + t * .05)); }
        rays = pow(rays / 3., 2.4) * 3.2; float fall = exp(-r * 1.8); return uC0 + (ramp3(fall, uC1, uC2, uC3) * rays * fall * 1.3 + uC3 * exp(-r * 9.) * 1.2) * uAmt; }` },
    flow: { c: ['#07080d', '#4cc9f0', '#f72585', '#ffffff'], desc: 'flow-field streaks (ink / wind / hair)',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 2.; float acc = 0.; vec2 s = q; for (int i = 0; i < 18; i++) { float ang = snoise(s * .8 + t * .05) * 6.2831; s += vec2(cos(ang), sin(ang)) * .045; acc += hash21(floor(s * 70.)); }
        acc /= 18.; float lines = smoothstep(.45, .75, acc), h = fbm(q + 4.); return mix(uC0, ramp3(h, uC1, uC2, uC3), lines * .9 * uAmt) * (.5 + .7 * h) + uC0; }` },
    halftone: { c: ['#f4efe6', '#161616', '#ff4d2e', '#ffffff'], desc: 'halftone dot field (print look); c0 paper, c1 ink, c2 accent',
      glsl: `vec3 bgfn(vec2 p, float t){
        float s = 46. * uScale; vec2 q = rot(.6) * p * s; vec2 f = fract(q) - .5; float v = smoothstep(.18, .85, fbm(p * 1.6 + vec2(t * .05, 0.))); float d = length(f); float dt = smoothstep(v * .78, v * .78 - .12, d);
        return mix(uC0, uC1, dt) + uC2 * pow(v, 7.) * .5 * uAmt; }` },
    galaxy: { c: ['#03030a', '#6a5cff', '#ff7ac8', '#ffd9a0'], desc: 'spiral galaxy; c3 = core',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = rot(t * .02) * p * uScale; float r = length(q), a = atan(q.y, q.x); float spiral = .5 + .5 * cos(2. * (a - log(r + .02) * 3.2)); float core = exp(-r * 6.); float arm = spiral * exp(-r * 2.2) * smoothstep(0., .08, r); float dust = fbm(q * 5.);
        vec3 col = uC0 + ramp3(clamp(r * 2.2, 0., 1.), uC3 * 1.5, uC2, uC1) * arm * (.4 + .9 * dust) * .95 * uAmt + vec3(1., .9, .75) * core * 1.2; float st = hash21(floor(p * 420.));
        return col + step(.9965, st) * vec3(.9, .95, 1.) * (.4 + st) * (.5 + .5 * sin(t * 2. + st * 60.)); }` },
    rain: { c: ['#010503', '#00ff7f', '#d6ffe9', '#ffffff'], desc: 'digital rain columns; c1 trail, c2 head',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * vec2(34., 20.); vec2 cell = floor(q); float colR = hash11(cell.x * 7.13 + uSeed), speed = .5 + hash11(cell.x * 3.7) * 1.6; float yy = q.y + t * speed * 6. * colR; float head = fract(yy / 24. + colR * 9.);
        float tr = pow(1. - head, 3.), glyph = step(.35, hash21(vec2(cell.x, floor(yy)))); vec2 f = fract(q) - .5; float shape = step(abs(f.x), .32) * step(abs(f.y), .38) * glyph; return uC0 + mix(uC1, uC2, step(.97, head)) * shape * tr * 1.7 * uAmt; }` },
    clouds: { c: ['#2a4a8f', '#ff9a6b', '#ffe9d6', '#ffffff'], desc: 'sky + clouds; c0 zenith, c1 horizon, c2 shadow side, c3 lit side',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 2.4 + vec2(t * .04, 0.); float c = fbm(q * vec2(1., 1.6) + fbm(q * 1.3 + t * .02)); c = smoothstep(.42, .78, c); vec3 sky = mix(uC1, uC0, smoothstep(-.4, .5, p.y));
        vec3 cloud = mix(uC2, uC3, smoothstep(.0, 1., c)) * (.65 + .5 * fbm(q * 2. + 3.)); return mix(sky, cloud * .85, c * .9 * uAmt); }` },
    waves: { c: ['#06080f', '#4aa8ff', '#ff6bd6', '#ffffff'], desc: 'stacked flowing sine lines (minimal/elegant)',
      glsl: `vec3 bgfn(vec2 p, float t){
        float v = 0.; for (int i = 0; i < 14; i++) { float fi = float(i); float yy = (fi - 7.) * .075 * uScale; float w = sin(p.x * (2.2 + fi * .13) * uScale + t * (.5 + fi * .06) + fi) * .04 + sin(p.x * 6.1 * uScale - t * .8 + fi * 2.) * .012;
          float d = abs(p.y - yy - w * (.6 + uAmt)); v += smoothstep(.007, .0, d) * (.4 + .6 * fi / 14.); } return uC0 + ramp3(p.x * .5 + .5, uC1, uC2, uC3) * v; }` },
    fire: { c: ['#000000', '#c1121f', '#ff8c1a', '#fff1a8'], desc: 'rising fire/embers; c1 deep red → c3 white-hot',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = vec2(p.x * 2.2, p.y * 1.6 - t * .6) * uScale; float n = fbm(q + vec2(0., fbm(q * 1.7 + t * .2))); float h = smoothstep(.55, -.45, p.y) * 1.2; float f = clamp(n * 1.5 * h - .25, 0., 1.);
        vec3 col = ramp4(f, vec3(0.), uC1, uC2, uC3); float sp = step(.998, hash21(floor(vec2(p.x * 160., p.y * 90. - t * 12.)))); return col * uAmt + sp * uC3 * .8 * smoothstep(-.5, .2, p.y); }` },
    blueprint: { c: ['#0a2a5e', '#7fb2ff', '#e8f1ff', '#ffffff'], desc: 'engineering grid; c1 minor, c2 major lines',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 12.; vec2 g = abs(fract(q) - .5); float minor = smoothstep(.49, .5, max(g.x, g.y)); vec2 gm = abs(fract(q / 5.) - .5); float major = smoothstep(.495, .5, max(gm.x, gm.y));
        vec3 col = uC0 * (.8 + .25 * fbm(p * 2.)) + uC1 * minor * .25 + uC2 * major * .6 * uAmt; return col + uC1 * .08 * smoothstep(1., 0., length(p)); }` },
    chrome: { c: ['#050505', '#7a7f8a', '#e8ecf5', '#ffffff'], desc: 'flowing liquid-metal surface; c0 dark reflections → c3 highlights',
      glsl: `float H_(vec2 q, float t){ return fbm(q + vec2(t * .05, t * .03) + 2. * vec2(fbm(q + t * .04), fbm(q + 7.3 - t * .04))); }
        vec3 bgfn(vec2 p, float t){ vec2 q = p * uScale * 1.5; float e = .01, h = H_(q, t), hx = H_(q + vec2(e, 0.), t), hy = H_(q + vec2(0., e), t); vec3 n = normalize(vec3(-(hx - h) / e * .35 * uAmt, -(hy - h) / e * .35 * uAmt, 1.));
          vec3 r = reflect(vec3(0., 0., -1.), n); float s = r.y * .5 + .5; float band = pow(abs(sin(s * 7. + r.x * 3.)), 3.); vec3 col = ramp4(clamp(s * s + band * .5, 0., 1.), uC0, uC1, uC2, uC3); return col * (.7 + .5 * h); }` },
    dots: { c: ['#0b0b14', '#ff4d8d', '#ffd166', '#ffffff'], desc: 'dot grid with a travelling wave of size',
      glsl: `vec3 bgfn(vec2 p, float t){
        vec2 q = p * uScale * 28.; vec2 i = floor(q), f = fract(q) - .5; float d = length(i / 28. / uScale); float s = .5 + .5 * sin(d * 9. - t * 2.4 + snoise(i * .05) * 2.); float r = mix(.08, .42, s);
        return uC0 + mix(uC1, uC2, s) * smoothstep(r, r - .08, length(f)) * uAmt; }` },
  };

  /* ───────── filters ───────── */
  const F_PRE = `\n//#use math,noise,color\nuniform sampler2D uSrc; uniform vec2 uCen; uniform vec4 uPar; uniform vec3 uC0, uC1, uC2;\nvec4 S(vec2 uv){ return texture(uSrc, uv); }\nfloat asp(){ return uRes.x / uRes.y; }\n`;
  const F_MAIN = `\nvoid main(){ o = fx(vUv); }`;
  const FILT = {
    radial: { par: { strength: .25, samples: 16 }, desc: 'zoom/radial blur from center; strength .1–.5',
      glsl: `vec4 fx(vec2 uv){ vec4 acc = vec4(0.); for (int i = 0; i < 16; i++) { float k = float(i) / 15.; acc += S(uCen + (uv - uCen) * (1. - uPar.x * k)); } return acc / 16.; }`, map: p => [p.strength] },
    kaleido: { par: { n: 6, angle: 0, zoom: 1 }, desc: 'kaleidoscope: n mirror segments, rotate by angle, zoom',
      glsl: `vec4 fx(vec2 uv){ vec2 p = (uv - uCen) * vec2(asp(), 1.); float r = length(p), a = atan(p.y, p.x) + uPar.y, n = max(uPar.x, 2.); a = abs(mod(a, 6.28318 / n) - 3.14159 / n); p = vec2(cos(a), sin(a)) * r / max(uPar.z, .01); return S(p / vec2(asp(), 1.) + uCen); }`, map: p => [p.n, p.angle, p.zoom] },
    mirror: { par: { axis: 0, pos: .5 }, desc: 'mirror one side onto the other (axis 0 = vertical line at pos, 1 = horizontal)',
      glsl: `vec4 fx(vec2 uv){ vec2 p = uv; if (uPar.x < .5) { if (p.x > uPar.y) p.x = 2. * uPar.y - p.x; } else { if (p.y > uPar.y) p.y = 2. * uPar.y - p.y; } return S(p); }`, map: p => [p.axis, p.pos] },
    ripple: { par: { amp: .012, freq: 28, speed: 3 }, desc: 'water ripples emanating from center',
      glsl: `vec4 fx(vec2 uv){ vec2 d = (uv - uCen) * vec2(asp(), 1.); float r = length(d); vec2 o2 = normalize(d + 1e-5) * sin(r * uPar.y - uT * uPar.z) * uPar.x * exp(-r * 1.4); return S(uv + o2 / vec2(asp(), 1.)); }`, map: p => [p.amp, p.freq, p.speed] },
    halftone: { par: { size: 7, soft: .5, mono: 0 }, desc: 'print halftone dots from luminance (size in px; mono = 1 for black dots)',
      glsl: `vec4 fx(vec2 uv){ vec2 g = uv * uRes / uPar.x; vec2 f = fract(rot(.52) * g) - .5; vec3 c = S(uv).rgb; float l = luma(c); float r = sqrt(l) * .72; float d = length(f); float m = smoothstep(r, r - uPar.y * .25 - .02, d); vec3 ink = uPar.z > .5 ? vec3(0.) : c * 1.4; return vec4(mix(vec3(uPar.z > .5 ? 1. : 0.), ink, m), 1.) * (uPar.z > .5 ? 1. : 1.) ; }`, map: p => [p.size, p.soft, p.mono] },
    pixelate: { par: { size: 12 }, desc: 'mosaic pixels (size in px)',
      glsl: `vec4 fx(vec2 uv){ vec2 g = uRes / max(uPar.x, 1.); return S((floor(uv * g) + .5) / g); }`, map: p => [p.size] },
    posterize: { par: { levels: 5, mix: 1 }, desc: 'colour banding (levels per channel)',
      glsl: `vec4 fx(vec2 uv){ vec4 c = S(uv); vec3 q = floor(c.rgb * uPar.x + .5) / uPar.x; return vec4(mix(c.rgb, q, uPar.y), c.a); }`, map: p => [p.levels, p.mix] },
    gradmap: { par: { amt: 1 }, color: ['#05010f', '#a12bff', '#ffe08a'], desc: 'map luminance through 3 colours (c0 shadows, c1 mids, c2 highlights): duotone/tritone looks',
      glsl: `vec4 fx(vec2 uv){ vec4 c = S(uv); float l = clamp(luma(c.rgb), 0., 1.); vec3 g = l < .5 ? mix(uC0, uC1, l * 2.) : mix(uC1, uC2, l * 2. - 1.); return vec4(mix(c.rgb, g * (.6 + .8 * l), uPar.x), c.a); }`, map: p => [p.amt] },
    edge: { par: { strength: 4, glow: 1 }, color: ['#7fe9ff', '#ff4fd8', '#ffffff'], desc: 'neon outline from edges (draw plain shapes, get glowing lines); c0/c1 colours',
      glsl: `vec4 fx(vec2 uv){ vec2 e = 1. / uRes; float tl = luma(S(uv + vec2(-e.x, e.y)).rgb), t = luma(S(uv + vec2(0., e.y)).rgb), tr = luma(S(uv + e).rgb), l = luma(S(uv + vec2(-e.x, 0.)).rgb), r = luma(S(uv + vec2(e.x, 0.)).rgb), bl = luma(S(uv - e).rgb), b = luma(S(uv - vec2(0., e.y)).rgb), br = luma(S(uv + vec2(e.x, -e.y)).rgb);
        float gx = -tl - 2. * l - bl + tr + 2. * r + br, gy = -tl - 2. * t - tr + bl + 2. * b + br; float m = clamp(length(vec2(gx, gy)) * uPar.x, 0., 1.); vec3 c = mix(uC0, uC1, smoothstep(0., 1., uv.x + .3 * sin(uT))); return vec4(c * m * uPar.y * 2., 1.); }`, map: p => [p.strength, p.glow] },
    vhs: { par: { amt: 1 }, desc: 'VHS: tracking wobble, colour bleed, noise',
      glsl: `vec4 fx(vec2 uv){ float k = uPar.x; float band = floor(uv.y * 240.); float wob = (hash21(vec2(band, floor(uT * 12.))) - .5) * .004 * k + sin(uv.y * 40. + uT * 8.) * .0015 * k; float jit = step(.985, hash21(vec2(floor(uT * 7.), floor(uv.y * 14.)))) * .02 * k;
        vec2 u = uv + vec2(wob + jit, 0.); vec3 c = vec3(S(u + vec2(.003 * k, 0.)).r, S(u).g, S(u - vec2(.003 * k, 0.)).b); c = mix(c, vec3(luma(c)), .15); c += (hash21(uv * uRes + uT * 60.) - .5) * .09 * k; c *= .92 + .08 * sin(uv.y * uRes.y * 1.5); return vec4(c, 1.); }`, map: p => [p.amt] },
    crt: { par: { curve: .12, mask: .35, scan: .4 }, desc: 'CRT monitor: barrel curvature, phosphor mask, scanlines',
      glsl: `vec4 fx(vec2 uv){ vec2 p = uv * 2. - 1.; p *= 1. + dot(p, p) * uPar.x * .5; vec2 u = p * .5 + .5; if (u.x < 0. || u.x > 1. || u.y < 0. || u.y > 1.) return vec4(0., 0., 0., 1.); vec3 c = S(u).rgb; float sl = .5 + .5 * sin(u.y * uRes.y * 3.14159); c *= 1. - uPar.z * (1. - sl);
        float m = mod(floor(u.x * uRes.x), 3.); vec3 mk = vec3(m < 1., m >= 1. && m < 2., m >= 2.) * .5 + .5; c *= mix(vec3(1.), mk * 1.5, uPar.y); c *= 1. - .6 * dot(p, p) * .35; return vec4(c, 1.); }`, map: p => [p.curve, p.mask, p.scan] },
    lens: { par: { k: .25 }, desc: 'barrel (k>0) / pincushion (k<0) lens distortion',
      glsl: `vec4 fx(vec2 uv){ vec2 d = (uv - uCen) * vec2(asp(), 1.); d *= 1. + uPar.x * dot(d, d); return S(d / vec2(asp(), 1.) + uCen); }`, map: p => [p.k] },
    tilt: { par: { y: .5, band: .15, blur: 6 }, desc: 'tilt-shift miniature blur away from a horizontal band',
      glsl: `vec4 fx(vec2 uv){ float d = smoothstep(uPar.y, uPar.y + .3, abs(uv.y - uPar.x)); float rad = d * uPar.z / uRes.y * 2.; vec4 acc = vec4(0.); for (int i = 0; i < 20; i++) { float a = float(i) * 2.399963, r = sqrt(float(i) / 20.); acc += S(uv + vec2(cos(a), sin(a)) * r * rad * vec2(1., 1.)); } return acc / 20.; }`, map: p => [p.y, p.band, p.blur] },
    glitch: { par: { amt: .5, seed: 0 }, desc: 'slice glitch + RGB split (amt 0–1)',
      glsl: `vec4 fx(vec2 uv){ float fr = floor(uT * 24.) + uPar.y; float band = floor(uv.y * 28.), r = hash21(vec2(band, fr)); vec2 u = uv; if (r < uPar.x * .6) u.x += (hash21(vec2(band, fr + 7.)) - .5) * .12 * uPar.x; float s = uPar.x * .012; return vec4(S(u + vec2(s, 0.)).r, S(u).g, S(u - vec2(s, 0.)).b, 1.); }`, map: p => [p.amt, p.seed] },
    chroma: { par: { amt: .01 }, desc: 'radial chromatic aberration',
      glsl: `vec4 fx(vec2 uv){ vec2 d = uv - uCen; return vec4(S(uCen + d * (1. + uPar.x)).r, S(uv).g, S(uCen + d * (1. - uPar.x)).b, 1.); }`, map: p => [p.amt] },
    tile: { par: { nx: 3, ny: 3, mirror: 0 }, desc: 'repeat the image nx × ny (mirror = 1 for mirrored tiles)',
      glsl: `vec4 fx(vec2 uv){ vec2 q = uv * vec2(uPar.x, uPar.y); vec2 f = fract(q); if (uPar.z > .5) { vec2 m = mod(floor(q), 2.); f = mix(f, 1. - f, m); } return S(f); }`, map: p => [p.nx, p.ny, p.mirror] },
    polar: { par: { turns: 1, zoom: 1, mode: 0 }, desc: 'polar coordinates: mode 0 = rect→polar (wrap the image into a ring/tunnel), 1 = polar→rect',
      glsl: `vec4 fx(vec2 uv){ vec2 p = (uv - uCen) * vec2(asp(), 1.); if (uPar.z < .5) { float a = atan(p.y, p.x) / 6.28318 * uPar.x + .5, r = length(p) * uPar.y; return S(vec2(fract(a), clamp(r, 0., 1.))); } vec2 q = vec2(uv.x * 6.28318 * uPar.x, uv.y / max(uPar.y, .01)); return S(uCen + vec2(cos(q.x), sin(q.x)) * q.y * .5 / vec2(asp(), 1.)); }`, map: p => [p.turns, p.zoom, p.mode] },
    ascii: { par: { size: 10, gain: 1.15, mono: 1 }, color: ['#02060a', '#7dff9b', '#ffffff'], desc: 'ASCII-art rendering: the picture becomes characters (size = cell width px; mono 1 = single ink colour c1 on c0, 0 = keep the picture colours)',
      extra: fx => ({ uAtlas: asciiAtlas(fx) }),
      glsl: `uniform sampler2D uAtlas; vec4 fx(vec2 uv){ float cs = uPar.x; vec2 cells = uRes / vec2(cs, cs * 1.8), e = vec2(.25) / cells; vec2 id = floor(uv * cells), f = fract(uv * cells), cuv = (id + .5) / cells;
        vec3 c = (S(cuv).rgb * 2. + S(cuv + e).rgb + S(cuv - e).rgb + S(cuv + vec2(e.x, -e.y)).rgb + S(cuv + vec2(-e.x, e.y)).rgb) / 6.; float l = clamp(luma(c) * uPar.y, 0., 1.), idx = floor(l * 9.999);
        float gl = texture(uAtlas, vec2((idx + f.x) / 10., f.y)).a; vec3 ink = uPar.z > .5 ? uC1 * (.55 + .7 * l) : c * 1.5; return vec4(mix(uC0, ink, gl), 1.); }`, map: p => [p.size, p.gain, p.mono] },
    dither: { par: { size: 3, levels: 2, keep: 0 }, color: ['#0b0f14', '#e8f1ff', '#ffffff'], desc: 'ordered (Bayer) dithering: 1-bit / few-level bitmap look (size = pixel block px, levels >= 2, keep = share of the original colour 0-1; c0 dark, c1 light)',
      glsl: `float bayer4(vec2 p){ const float M[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.); int i = int(mod(p.x, 4.)) + int(mod(p.y, 4.)) * 4; return (M[i] + .5) / 16.; }
        vec4 fx(vec2 uv){ float s = max(uPar.x, 1.); vec2 g = uRes / s, id = floor(uv * g); vec3 c = S((id + .5) / g).rgb; float l = luma(c), lv = max(uPar.y, 2.) - 1., q = clamp(floor(l * lv + bayer4(id)) / lv, 0., 1.); vec3 col = mix(uC0, uC1, q); return vec4(mix(col, c * (.4 + 1.2 * q), uPar.z), 1.); }`, map: p => [p.size, p.levels, p.keep] },
    hatch: { par: { size: 9, width: .16 }, color: ['#14110d', '#f0e6d2', '#ffffff'], desc: 'engraving / cross-hatch drawing: lines in 4 directions get denser in the shadows (size = line spacing px; c0 ink, c1 paper)',
      glsl: `float ln(float x, float w){ float d = abs(fract(x) - .5); return smoothstep(.5 - w, .5 - w + .12, d); }
        vec4 fx(vec2 uv){ float l = luma(S(uv).rgb); vec2 p = uv * uRes / uPar.x; float w = uPar.y, ink = 0.; if (l < .78) ink += ln((p.x + p.y) * .7071, w); if (l < .55) ink += ln((p.x - p.y) * .7071, w); if (l < .34) ink += ln(p.y, w); if (l < .18) ink += ln(p.x, w);
        ink += 1. - smoothstep(0., .06, l); return vec4(mix(uC1, uC0, clamp(ink, 0., 1.)), 1.); }`, map: p => [p.size, p.width] },
    bulge: { par: { k: .5, r: .35 }, desc: 'magnifier: pushes the picture out around the centre (k > 0 magnify, k < 0 pinch; r = radius as a fraction of the height) with a thin glass rim',
      glsl: `vec4 fx(vec2 uv){ vec2 d = (uv - uCen) * vec2(asp(), 1.); float r = length(d), t = r / max(uPar.y, 1e-3), s = t < 1. ? mix(1. - uPar.x, 1., t * t) : 1.; vec4 c = S(d * s / vec2(asp(), 1.) + uCen); float rim = exp(-pow((t - 1.) * 22., 2.)) * .35; return vec4(c.rgb + rim, 1.); }`, map: p => [p.k, p.r] },
    mosaic: { par: { cells: 14, border: .8, speed: .4 }, desc: 'stained-glass / low-poly mosaic: Voronoi cells, each filled with the picture colour at its centre (cells = cells across the height; border 0-1 darkens the seams)',
      glsl: `vec4 fx(vec2 uv){ vec2 p = uv * vec2(asp(), 1.) * uPar.x, ip = floor(p), fp = fract(p); float md = 8.; vec2 mc, mr, mg;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(i, j), h = hash22(ip + g); h = .5 + .5 * sin(uT * uPar.z + 6.2831 * h); vec2 r = g + h - fp; float d = dot(r, r); if (d < md) { md = d; mr = r; mg = g; mc = ip + g + h; } }
        float b = 8.; for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) { vec2 g = mg + vec2(i, j), h = hash22(ip + g); h = .5 + .5 * sin(uT * uPar.z + 6.2831 * h); vec2 r = g + h - fp; if (dot(mr - r, mr - r) > 1e-5) b = min(b, dot(.5 * (mr + r), normalize(r - mr))); }
        vec3 c = S(mc / uPar.x / vec2(asp(), 1.)).rgb; return vec4(c * mix(1., smoothstep(0., .05, b), uPar.y), 1.); }`, map: p => [p.cells, p.border, p.speed] },
    emboss: { par: { strength: 3, width: 1.5, angle: .8 }, desc: 'relief / bevel lighting from luminance (angle = light direction in radians): metal-plate and paper-cut feel',
      glsl: `vec4 fx(vec2 uv){ vec2 d = vec2(cos(uPar.z), sin(uPar.z)) * uPar.y / uRes; float k = (luma(S(uv + d).rgb) - luma(S(uv - d).rgb)) * uPar.x; vec3 c = S(uv).rgb; return vec4(c * (1. + k) + k * .35, 1.); }`, map: p => [p.strength, p.width, p.angle] },
    swirl: { par: { angle: 2.2, r: .5 }, desc: 'twirl the picture around the centre (angle radians at the middle, r = radius as a fraction of the height)',
      glsl: `vec4 fx(vec2 uv){ vec2 d = (uv - uCen) * vec2(asp(), 1.); float f = smoothstep(uPar.y, 0., length(d)); d = rot(uPar.x * f * f) * d; return S(d / vec2(asp(), 1.) + uCen); }`, map: p => [p.angle, p.r] },
    mosh: { par: { amt: .12, block: 48, seed: 0 }, desc: 'data-mosh blocks: random macro-blocks slip sideways/up for a few frames with an RGB tear (amt = share of blocks, block = px)',
      glsl: `vec4 fx(vec2 uv){ float fr = floor(uT * 12.) + uPar.z; vec2 g = floor(uv * uRes / uPar.y); float r = hash21(g + fr), on = step(r, uPar.x); vec2 h = hash22(g + fr * 3.); vec2 u = uv + (h - .5) * .22 * on; float s = .004 * on; return vec4(S(u + vec2(s, 0.)).r, S(u).g, S(u - vec2(s, 0.)).b, 1.); }`, map: p => [p.amt, p.block, p.seed] },
  };
  const FILT_COLOR_DEFAULT = ['#000000', '#888888', '#ffffff'];

  // depth of field: gather blur with circle of confusion from linear depth
  const DOF = `
//#use math
uniform sampler2D uSrc, uDepth; uniform vec4 uPar; uniform vec2 uNF;       // par: focus, range, maxBlur(px), samples ; uNF: near, far
float lin(float d){ float z = d * 2. - 1.; return 2. * uNF.x * uNF.y / (uNF.y + uNF.x - z * (uNF.y - uNF.x)); }
float coc(vec2 uv){ float z = lin(texture(uDepth, uv).r); float c = clamp((abs(z - uPar.x) - uPar.y) / max(uPar.x, .001), 0., 1.); return texture(uDepth, uv).r >= .9999 ? 1. : c; }
void main(){ float c0 = coc(vUv); float rad = c0 * uPar.z / uRes.y; vec4 acc = texture(uSrc, vUv); float ws = 1.;
  for (int i = 1; i < 28; i++) { float a = float(i) * 2.399963, r = sqrt(float(i) / 28.); vec2 uv = vUv + vec2(cos(a) * uRes.y / uRes.x, sin(a)) * r * rad; float cs = coc(uv); float w = smoothstep(0., .15, max(cs, c0 * .6)) ; acc += texture(uSrc, uv) * w; ws += w; }
  o = acc / ws; }`;
  const BLUR = `uniform sampler2D uSrc; uniform vec2 uDir;
void main(){ float w[5]; w[0] = .227027; w[1] = .1945946; w[2] = .1216216; w[3] = .054054; w[4] = .016216; vec4 c = texture(uSrc, vUv) * w[0];
  for (int i = 1; i < 5; i++) { vec2 d = uDir * float(i) / uRes; c += texture(uSrc, vUv + d) * w[i]; c += texture(uSrc, vUv - d) * w[i]; } o = c; }`;

  // glyph atlas for the ascii filter: ten characters from empty to dense in one row (JetBrains Mono when loaded, any monospace otherwise)
  const asciiAtlas = fx => fx._ascii || (fx._ascii = (() => { const chars = ' .:-=+*#%@', cw = 40, ch = 72, c = document.createElement('canvas'); c.width = cw * chars.length; c.height = ch; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.font = `700 ${Math.round(ch * .74)}px "JetBrains Mono", ui-monospace, Consolas, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...chars].forEach((q, i) => g.fillText(q, cw * i + cw / 2, ch * .54)); return fx.gfx.up(c); })());

  class FX {
    constructor(gfx) { this.gfx = gfx; }
    /** Draw a background into `to` (default: the HDR scene). p: {c:[4 colours], speed, scale, amt, seed, center}. */
    bg(name, p = {}, o = {}) {
      const d = BG[name]; if (!d) throw new Error(`FX.bg: unknown background "${name}". Available: ${Object.keys(BG).join(', ')}`);
      const P = this.gfx.prog(BG_PRE + d.glsl + BG_MAIN, { tag: 'bg ' + name }), c = p.c || d.c;
      this.gfx.pass(P, { uC0: rgb(c[0]), uC1: rgb(c[1]), uC2: rgb(c[2]), uC3: rgb(c[3] || c[2]), uSpeed: p.speed ?? 1, uScale: p.scale ?? 1, uAmt: p.amt ?? 1, uSeed: p.seed ?? 0, uCen: p.center || [.5, .5] }, { to: o.to, blend: o.blend || 'none' });
    }
    /** Apply a filter to `src` (texture / render target) → `to`. p: filter parameters (FX.info(name).par), plus center:[x,y] and c:[3 colours] where used. */
    filter(name, src, p = {}, o = {}) {
      if (name === 'blur') return this.blur(src, p.radius ?? 16, o);
      const d = FILT[name]; if (!d) throw new Error(`FX.filter: unknown filter "${name}". Available: ${Object.keys(FILT).join(', ')}, blur, dof`);
      const P = this.gfx.prog(F_PRE + d.glsl + F_MAIN, { tag: 'filter ' + name }), par = d.map({ ...d.par, ...p }), cols = p.c || d.color || FILT_COLOR_DEFAULT;
      this.gfx.pass(P, { uSrc: src, uCen: p.center || [.5, .5], uPar: [par[0] ?? 0, par[1] ?? 0, par[2] ?? 0, par[3] ?? 0], uC0: rgb(cols[0]), uC1: rgb(cols[1]), uC2: rgb(cols[2] || cols[1]), ...(d.extra ? d.extra(this) : {}) }, { to: o.to, blend: o.blend || 'none' });
    }
    /** Run a filter over a 2D canvas (uploads it first; the texture is cached per canvas): any 2D scene can go through vhs / ascii / mosaic / crt … → fx.filterCanvas(cv, 'vhs', { amt: 1 }, { to: rt }). Fill the canvas background first. */
    filterCanvas(cv, name, p = {}, o = {}) { const m = this._ct || (this._ct = new WeakMap()), t = this.gfx.up(cv, m.get(cv)); m.set(cv, t); return this.filter(name, t, p, o); }
    /** Gaussian blur, radius in output pixels (large radii run on a downsampled copy). */
    blur(src, radius = 16, o = {}) {
      const g = this.gfx, s = Math.max(1, Math.min(8, Math.floor(radius / 5))), w = Math.max(2, Math.round(g.W / s)), h = Math.max(2, Math.round(g.H / s)), P = g.prog(BLUR, { tag: 'blur' });
      const A = g.tmp('fxBlurA', w, h), B = g.tmp('fxBlurB', w, h), r = Math.max(.5, radius / s / 2.2);
      g.pass(P, { uSrc: src, uDir: [r, 0] }, { to: A }); g.pass(P, { uSrc: A, uDir: [0, r] }, { to: B }); if (r > 3) { g.pass(P, { uSrc: B, uDir: [r * .6, 0] }, { to: A }); g.pass(P, { uSrc: A, uDir: [0, r * .6] }, { to: B }); }
      g.blit(B, { to: o.to, blend: o.blend || 'none' });
    }
    /** Depth of field: color + depth textures (Scene3D rt created with depth:'tex' → rt.d). opts: focus (world units), range (in-focus half-depth), blur (max px), near, far. */
    dof(color, depth, p = {}, o = {}) {
      const g = this.gfx, P = g.prog(DOF, { tag: 'dof' });
      g.pass(P, { uSrc: color, uDepth: depth, uPar: [p.focus ?? 8, p.range ?? 1.5, p.blur ?? 18, 28], uNF: [p.near ?? .1, p.far ?? 100] }, { to: o.to, blend: o.blend || 'none' });
    }
  }
  FX.bgs = Object.keys(BG); FX.filters = [...Object.keys(FILT), 'blur', 'dof'];
  FX.info = name => (BG[name] ? { kind: 'bg', colors: BG[name].c, desc: BG[name].desc } : FILT[name] ? { kind: 'filter', par: FILT[name].par, desc: FILT[name].desc } : name === 'blur' ? { kind: 'filter', par: { radius: 16 }, desc: 'gaussian blur (px)' } : null);
  FX.rgb = rgb;
  window.FX = FX;
})();
