/* trans.js — GPU scene transitions (32 of them). Used by Stage, but usable alone:

     Trans.run(gfx, 'whip', texA, texB, p01, { dir:[1,0], par:[…], color:[…], center:[.5,.5], to: rt })
     Trans.list            → names          Trans.info('glitch') → { par: defaults, look: Post pulses, desc }          Trans.define(name, {glsl, …}) → add your own

   texA = outgoing scene, texB = incoming scene (GFX textures / render targets), p01 = linear progress 0→1 (eased inside).
   `par` = [soft/size, strength, scale/count, seed/flag] — the meaning per transition is in its desc.
   Every transition also returns a `look` hint (Post options to pulse with sin(π·p): chromatic aberration, zoom blur, glitch, flash) that
   Stage applies automatically. Needs gfx.js. Classic script → window.Trans. */
(() => {
  'use strict';
  const EASE = {
    lin: x => x, io3: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), io5: x => (x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
    out3: x => 1 - Math.pow(1 - x, 3), outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)), ioExpo: x => (x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
  };
  const PRE = `
//#use math,noise,color
uniform sampler2D uA, uB; uniform float uP; uniform vec2 uDir, uCen; uniform vec4 uPar; uniform vec3 uCol;
vec4 sA(vec2 uv){ return texture(uA, uv); }
vec4 sB(vec2 uv){ return texture(uB, uv); }
bool inside(vec2 uv){ return uv.x >= 0. && uv.x <= 1. && uv.y >= 0. && uv.y <= 1.; }
float asp(){ return uRes.x / uRes.y; }
float halfDiag(){ return length(vec2(asp(), 1.)) * .5; }
`;
  const MAIN = `\nvoid main(){ o = tr(vUv); o.a = 1.; }`;

  // each: { ease, par:[x,y,z,w], dir?, color?, look?, desc, glsl:`vec4 tr(vec2 uv){…}` }
  const T = {
    fade: { ease: 'lin', par: [0, 1, 0, 0], desc: 'plain cross-fade (calm sections only)',
      glsl: `vec4 tr(vec2 uv){ return mix(sA(uv), sB(uv), uP); }` },
    dip: { ease: 'lin', par: [0, 1, 0, 0], color: [0, 0, 0], desc: 'dip through colour (color); y = depth',
      glsl: `vec4 tr(vec2 uv){ float k = 1. - abs(uP * 2. - 1.); vec4 c = uP < .5 ? sA(uv) : sB(uv); return mix(c, vec4(uCol, 1.), smoothstep(0., 1., k) * uPar.y); }` },
    flash: { ease: 'lin', par: [0, 1.4, 0, 0], color: [1, .95, .85], look: { flash: .0 }, desc: 'hard cut hidden by a flash (color); y = brightness',
      glsl: `vec4 tr(vec2 uv){ vec4 c = mix(sA(uv), sB(uv), smoothstep(.44, .56, uP)); float f = exp(-pow((uP - .5) * 6., 2.)); c.rgb += uCol * f * uPar.y; return c; }` },
    slide: { ease: 'io5', par: [0, 1, 0, 0], dir: [1, 0], desc: 'push: content moves along dir; y = motion blur',
      glsl: `vec4 tr(vec2 uv){ vec2 d = normalize(uDir); float blur = uPar.y * sin(3.14159 * uP) * .10; vec4 acc = vec4(0.);
        for (int i = 0; i < 10; i++) { float s = (float(i) / 9. - .5) * blur; vec2 q = uv - d * (uP + s), r = uv - d * (uP + s - 1.); vec4 c = inside(r) ? sB(r) : vec4(0.); if (inside(q)) c = sA(q); acc += c; } return acc / 10.; }` },
    whip: { ease: 'ioExpo', par: [0, 2.2, 0, 0], dir: [1, 0], look: { ca: .014 }, desc: 'fast whip-pan with heavy blur + chromatic spike; y = blur',
      glsl: `vec4 tr(vec2 uv){ vec2 d = normalize(uDir); float blur = uPar.y * sin(3.14159 * uP) * .16; vec4 acc = vec4(0.);
        for (int i = 0; i < 14; i++) { float s = (float(i) / 13. - .5) * blur; vec2 q = uv - d * (uP + s), r = uv - d * (uP + s - 1.); vec4 c = inside(r) ? sB(r) : vec4(0.); if (inside(q)) c = sA(q); acc += c; } return acc / 14.; }` },
    zoom: { ease: 'io3', par: [0, 2.6, 0, 0], look: { zoomBlur: .32, ca: .006 }, desc: 'zoom-through (dive into A, emerge from B); y = zoom factor',
      glsl: `vec4 tr(vec2 uv){ vec2 c = uCen; float s = uPar.y; float zA = mix(1., s, ein3(uP)), zB = mix(s, 1., eout3(uP)); float w = smoothstep(.38, .62, uP); float bl = sin(3.14159 * uP) * .12; vec4 acc = vec4(0.);
        for (int i = 0; i < 12; i++) { float k = 1. - bl * float(i) / 11.; vec2 d = (uv - c) * k; vec4 a = texture(uA, c + d / zA), b = texture(uB, c + d / zB); acc += mix(a, b, w); } return acc / 12.; }` },
    spin: { ease: 'io3', par: [0, 1, 0, 0], look: { zoomBlur: .2 }, desc: 'rotate + zoom swap; y = turns (1 = 69°)',
      glsl: `vec4 tr(vec2 uv){ vec2 p = (uv - uCen) * vec2(asp(), 1.); float aA = uP * uPar.y * 1.2, aB = (uP - 1.) * uPar.y * 1.2, zA = 1. + uP * 1.2, zB = 1. + (1. - uP) * 1.2; float w = smoothstep(.4, .6, uP); vec4 acc = vec4(0.);
        for (int i = 0; i < 8; i++) { float j = (float(i) / 7. - .5) * .08 * sin(3.14159 * uP); vec2 qa = (rot(aA + j) * p) / zA / vec2(asp(), 1.) + uCen, qb = (rot(aB + j) * p) / zB / vec2(asp(), 1.) + uCen; acc += mix(sA(qa), sB(qb), w); } return acc / 8.; }` },
    wipe: { ease: 'io3', par: [.08, 0, 0, 0], dir: [1, .15], color: [1, 1, 1], desc: 'soft linear wipe along dir; x = softness, y = glow line',
      glsl: `vec4 tr(vec2 uv){ vec2 d = normalize(uDir); float s = dot(uv - .5, d) * .85 + .5, soft = max(uPar.x, .002), e = mix(-soft, 1. + soft, uP); float m = 1. - smoothstep(e - soft, e + soft, s); vec4 c = mix(sA(uv), sB(uv), m); c.rgb += uCol * exp(-pow((s - e) / (soft * .6 + .004), 2.)) * uPar.y; return c; }` },
    iris: { ease: 'io3', par: [.04, .8, 0, 0], color: [1, 1, 1], desc: 'circle wipe from center; x = softness, y = ring glow',
      glsl: `vec4 tr(vec2 uv){ vec2 p = (uv - uCen) * vec2(asp(), 1.); float soft = max(uPar.x, .002), R = mix(-soft, halfDiag() * 1.25 + soft, uP), d = length(p); float m = 1. - smoothstep(R - soft, R + soft, d); vec4 c = mix(sA(uv), sB(uv), m); c.rgb += uCol * exp(-pow((d - R) / (soft + .006), 2.)) * uPar.y * sin(3.14159 * uP); return c; }` },
    diamond: { ease: 'io3', par: [.04, 0, 0, 0], desc: 'diamond wipe from center',
      glsl: `vec4 tr(vec2 uv){ vec2 p = abs(uv - uCen) * vec2(asp(), 1.); float soft = max(uPar.x, .002), R = mix(-soft, (asp() + 1.) * .6 + soft, uP), d = p.x + p.y; return mix(sA(uv), sB(uv), 1. - smoothstep(R - soft, R + soft, d)); }` },
    clock: { ease: 'io3', par: [.02, 0, 0, 0], desc: 'radial clock wipe',
      glsl: `vec4 tr(vec2 uv){ vec2 p = (uv - uCen) * vec2(asp(), 1.); float a = (atan(p.x, p.y) + 3.14159) / 6.28318, soft = max(uPar.x, .002), e = mix(-soft, 1. + soft, uP); return mix(sA(uv), sB(uv), 1. - smoothstep(e - soft, e + soft, a)); }` },
    spiral: { ease: 'io3', par: [.03, 1.2, 0, 0], desc: 'spiral wipe; y = twist',
      glsl: `vec4 tr(vec2 uv){ vec2 p = (uv - uCen) * vec2(asp(), 1.); float s = fract(atan(p.y, p.x) / 6.28318 + length(p) * uPar.y), soft = max(uPar.x, .002); float t = mix(-soft, 1. + soft, uP); return mix(sA(uv), sB(uv), 1. - smoothstep(t - soft, t + soft, s)); }` },
    blinds: { ease: 'io3', par: [0, 0, 10, 0], dir: [0, 1], desc: 'venetian blinds; z = strips',
      glsl: `vec4 tr(vec2 uv){ float n = max(uPar.z, 2.); float f = abs(uDir.x) > .5 ? fract(uv.x * n) : fract(uv.y * n); return mix(sA(uv), sB(uv), smoothstep(0., .04, uP * 1.04 - f)); }` },
    checker: { ease: 'io3', par: [0, 0, 12, 0], desc: 'checkerboard reveal; z = columns',
      glsl: `vec4 tr(vec2 uv){ float n = max(uPar.z, 2.); vec2 g = floor(uv * vec2(n * asp(), n)); float h = hash21(g + uPar.w * 13.); float f = fract(uv.x * n * asp()) * .0 + h; return mix(sA(uv), sB(uv), smoothstep(f - .06, f, uP * 1.12 - .06)); }` },
    dots: { ease: 'io3', par: [0, 0, 28, 0], desc: 'halftone dots grow to reveal B; z = dots across',
      glsl: `vec4 tr(vec2 uv){ float n = max(uPar.z, 4.); vec2 g = uv * vec2(n * asp(), n); float d = length(fract(g) - .5); return mix(sA(uv), sB(uv), 1. - smoothstep(uP * .78 - .03, uP * .78 + .03, d)); }` },
    glitch: { ease: 'lin', par: [.4, 1, 0, 0], look: { glitch: .45, ca: .01 }, desc: 'digital glitch: slice offsets + RGB split + noise; x = slice density, y = strength, w = seed',
      glsl: `vec4 tr(vec2 uv){ float k = sin(3.14159 * uP), fr = floor(uT * 24.) + uPar.w; float bands = 8. + uPar.x * 40.; float band = floor(uv.y * bands), r = hash21(vec2(band, fr)); vec2 u = uv;
        if (r < k * .85) u.x += (hash21(vec2(band, fr + 9.)) - .5) * .35 * k * uPar.y; float blk = hash21(floor(uv * vec2(16., 9.)) + fr * .13);
        float pickB = step(blk, smoothstep(.2, .8, uP + (hash21(vec2(band, fr + 3.)) - .5) * .4)); float s = k * .016 * uPar.y;
        vec4 c = mix(sA(u), sB(u), pickB); c.r = mix(sA(u + vec2(s, 0.)).r, sB(u + vec2(s, 0.)).r, pickB); c.b = mix(sA(u - vec2(s, 0.)).b, sB(u - vec2(s, 0.)).b, pickB);
        c.rgb += (hash21(uv * uRes + fr) - .5) * .09 * k; return c; }` },
    pixelate: { ease: 'lin', par: [0, 1, 0, 0], desc: 'mosaic: pixels grow then shrink; y = max size',
      glsl: `vec4 tr(vec2 uv){ float k = sin(3.14159 * uP); float size = mix(1., uPar.y * 110. + 10., k * k); vec2 q = size < 1.6 ? uv : (floor(uv * (uRes / size)) + .5) / (uRes / size); return mix(sA(q), sB(q), smoothstep(.42, .58, uP)); }` },
    dissolve: { ease: 'io3', par: [.06, 0, 3, 0], desc: 'noise dissolve; x = softness, z = noise scale, w = seed',
      glsl: `vec4 tr(vec2 uv){ float n = fbm(uv * vec2(asp(), 1.) * (1.5 + uPar.z) + uPar.w * 7.1), w = max(uPar.x, .005), t = uP * (1. + 2. * w) - w; return mix(sA(uv), sB(uv), 1. - smoothstep(t - w, t + w, n)); }` },
    burn: { ease: 'io3', par: [.05, 1, 3, 0], color: [1, .45, .08], desc: 'burning edge dissolve; color = flame, y = intensity',
      glsl: `vec4 tr(vec2 uv){ float n = fbm(uv * vec2(asp(), 1.) * (1.5 + uPar.z) + uPar.w * 7.1), w = max(uPar.x, .005), t = uP * (1. + 3. * w) - w; float m = 1. - smoothstep(t - w * .3, t, n); vec4 c = mix(sA(uv), sB(uv), m);
        float e = exp(-pow((n - t) / (w * 1.4), 2.)); c.rgb *= 1. - .7 * e * (1. - m); c.rgb += uCol * e * 3.2 * uPar.y + vec3(1., .9, .6) * pow(e, 4.) * uPar.y; return c; }` },
    ink: { ease: 'io3', par: [.04, 1, 2.2, 0], desc: 'ink bleed reveal (domain-warped noise); z = scale',
      glsl: `vec4 tr(vec2 uv){ vec2 p = uv * vec2(asp(), 1.) * uPar.z + uPar.w * 5.3; float n = fbm(warp(p, 0., .9)), w = max(uPar.x, .005), t = uP * (1. + 3. * w) - w; float m = 1. - smoothstep(t - w, t, n); vec4 c = mix(sA(uv), sB(uv), m); float e = exp(-pow((n - t + w * .5) / (w * 1.2), 2.)); c.rgb *= 1. - .55 * e * uPar.y; return c; }` },
    liquid: { ease: 'io3', par: [0, 1, 0, 0], look: { ca: .004 }, desc: 'ripples + wobble distort both scenes; y = amount',
      glsl: `vec4 tr(vec2 uv){ float k = sin(3.14159 * uP); vec2 d = uv - uCen; float r = length(d * vec2(asp(), 1.)); float w = sin(r * 38. - uP * 26.) * exp(-r * 2.2) * k * .05 * uPar.y;
        vec2 o2 = normalize(d + 1e-5) * w + vec2(sin(uv.y * 14. + uP * 9.), cos(uv.x * 11. + uP * 8.)) * k * .03 * uPar.y; return mix(sA(uv + o2), sB(uv - o2), smoothstep(.3, .7, uP)); }` },
    swirl: { ease: 'io3', par: [0, 1, 0, 0], desc: 'twirl into the next scene; y = twist',
      glsl: `vec4 tr(vec2 uv){ vec2 p = (uv - uCen) * vec2(asp(), 1.); float r = length(p), k = sin(3.14159 * uP) * uPar.y * 4.; p = rot(k * (1. - smoothstep(0., .9, r))) * p; vec2 q = p / vec2(asp(), 1.) + uCen; return mix(sA(q), sB(q), smoothstep(.35, .65, uP)); }` },
    shatter: { ease: 'io3', par: [0, 1, 11, 0], desc: 'glass shards fall away revealing B; z = cells across',
      glsl: `vec4 tr(vec2 uv){ float n = max(uPar.z, 4.); vec2 g = uv * vec2(asp(), 1.) * n, cell; float d = voronoi(g, cell); float h = hash21(cell + 3.7); float q = clamp((uP * 1.5 - h * .5) / 1., 0., 1.); q = q * q * (3. - 2. * q);
        vec2 dir = normalize(hash22(cell) - .5 + 1e-3); vec2 off = (dir * q * .18 + vec2(0., -1.) * q * q * .35) * uPar.y; vec4 a = sA(uv - off / vec2(asp(), 1.) * vec2(1., 1.)); float keep = 1. - smoothstep(mix(1.3, .08, q), mix(1.5, .2, q), d) * step(.001, q); a *= (1. - q * .9) * (inside(uv - off) ? 1. : 0.);
        vec4 b = sB(uv); return b * (1. - a.a * 0.) + a * (q < .999 ? 1. : 0.) * (1. - smoothstep(.55, 1., q)); }` },
    doors: { ease: 'io5', par: [0, 1, 0, 0], desc: 'two halves slide apart revealing B',
      glsl: `vec4 tr(vec2 uv){ float s = uP * .5; float xa = uv.x < .5 ? uv.x + s : uv.x - s; bool ok = uv.x < .5 ? xa <= .5 : xa >= .5; vec4 b = sB((uv - .5) * (1.08 - .08 * uP) + .5); vec4 a = ok ? sA(vec2(xa, uv.y)) : vec4(0.); float sh = uv.x < .5 ? smoothstep(.5 - s - .06, .5 - s, uv.x) : smoothstep(.5 + s + .06, .5 + s, uv.x); a.rgb *= ok ? 1. : 0.; vec4 c = ok ? a : b; c.rgb *= ok ? 1. : (.55 + .45 * smoothstep(0., .25, abs(uv.x - .5) - s)); return c; }` },
    flip: { ease: 'io3', par: [0, 1, 0, 0], desc: 'card flip around the vertical axis',
      glsl: `vec4 tr(vec2 uv){ float a = uP * 3.14159265, cs = cos(a); bool front = uP < .5; float sx = max(abs(cs), .001); float persp = 1. + (uv.x - .5) * sin(a) * .45 * (front ? 1. : -1.);
        vec2 q = vec2((uv.x - .5) / sx + .5, (uv.y - .5) / persp + .5); vec4 c = vec4(0., 0., 0., 1.); if (inside(q)) c = front ? sA(q) : sB(q); c.rgb *= .55 + .45 * sx; return c; }` },
    luma: { ease: 'io3', par: [.12, 0, 0, 0], desc: 'luma wipe: bright parts of A go first (w=1 inverts); x = softness',
      glsl: `vec4 tr(vec2 uv){ float l = luma(sA(uv).rgb); if (uPar.w > .5) l = 1. - l; float soft = max(uPar.x, .01), t = uP * (1. + 2. * soft) - soft; return mix(sA(uv), sB(uv), 1. - smoothstep(t - soft, t + soft, l)); }` },
    lightleak: { ease: 'io3', par: [0, 1, 0, 0], dir: [.5, .3], look: { bloom: .0 }, desc: 'warm light leak sweeps through the cut; dir = leak origin, w=1 uses color',
      glsl: `vec4 tr(vec2 uv){ float k = sin(3.14159 * uP); vec4 c = mix(sA(uv), sB(uv), smoothstep(.34, .66, uP)); vec2 p = uv - vec2(.5) + uDir * .6; float r = length(p * vec2(asp(), 1.)); float leak = exp(-r * 2.0) * k;
        vec3 warm = mix(vec3(1., .3, .08), vec3(1., .85, .5), exp(-r * 4.)); c.rgb += (uPar.w > .5 ? uCol : warm) * leak * 1.7 * uPar.y; return c; }` },
    chroma: { ease: 'io3', par: [0, 1, 0, 0], desc: 'RGB-split push cross-fade (tech/glossy)',
      glsl: `vec4 tr(vec2 uv){ float k = sin(3.14159 * uP) * uPar.y; vec2 d = uv - .5; float w = smoothstep(.3, .7, uP); vec3 c; for (int i = 0; i < 3; i++) { float s = 1. + (float(i) - 1.) * k * .07; vec2 q = .5 + d * s; c[i] = mix(sA(q)[i], sB(q)[i], w); } return vec4(c, 1.); }` },
    blur: { ease: 'io3', par: [0, 1, 0, 0], desc: 'soft-focus blur cross-fade (dreamy)',
      glsl: `vec4 bt(sampler2D t, vec2 uv, float rad){ vec4 s = vec4(0.); for (int i = 0; i < 24; i++) { float a = float(i) * 2.399963, r = sqrt(float(i) / 24.) * rad; s += texture(t, uv + vec2(cos(a), sin(a) * asp()) * r); } return s / 24.; }
        vec4 tr(vec2 uv){ float rad = sin(3.14159 * uP) * .05 * uPar.y; return mix(bt(uA, uv, rad), bt(uB, uv, rad), smoothstep(.35, .65, uP)); }` },
    slice: { ease: 'io3', par: [0, 0, 8, 0], desc: 'horizontal slices slide in alternating directions; z = slices',
      glsl: `vec4 tr(vec2 uv){ float n = max(uPar.z, 2.), i = floor(uv.y * n), sgn = mod(i, 2.) < 1. ? 1. : -1., lag = hash21(vec2(i, uPar.w)) * .35; float q = eio3((uP - lag) / .65);
        vec2 qa = uv - vec2(sgn * q, 0.), qb = uv - vec2(sgn * (q - 1.), 0.); vec4 c = vec4(0.); if (inside(qb)) c = sB(qb); if (inside(qa)) c = sA(qa); return c; }` },
    scan: { ease: 'io3', par: [0, 1.6, 0, 0], dir: [1, 0], color: [.6, .9, 1], desc: 'hard scan-line wipe with a glowing edge; y = glow',
      glsl: `vec4 tr(vec2 uv){ vec2 d = normalize(uDir); float s = dot(uv - .5, d) * .9 + .5, e = mix(-.05, 1.05, uP); vec4 c = mix(sA(uv), sB(uv), step(s, e)); c.rgb += uCol * exp(-pow((s - e) * 55., 2.)) * uPar.y * 1.6; return c; }` },
    zoomBlurCut: { ease: 'ioExpo', par: [0, 1.5, 0, 0], look: { zoomBlur: .5 }, desc: 'punchy zoom with radial blur, B settles from a bigger scale; y = zoom',
      glsl: `vec4 tr(vec2 uv){ vec2 c = uCen; float w = smoothstep(.45, .55, uP), z = mix(uPar.y, 1., eout3(uP)); float bl = sin(3.14159 * uP) * .14; vec4 acc = vec4(0.);
        for (int i = 0; i < 12; i++) { float k = 1. - bl * float(i) / 11.; vec2 d = (uv - c) * k; acc += mix(texture(uA, c + d / mix(1., uPar.y, uP)), texture(uB, c + d / z), w); } return acc / 12.; }` },
  };

  const Trans = {
    list: Object.keys(T),
    info(name) { const d = T[name]; return d && { par: d.par.slice(), look: d.look || {}, desc: d.desc, ease: d.ease }; },
    ease: EASE,
    /** Register your own transition: Trans.define('stripes', { ease: 'io3', par: [10, 0, 0, 0], dir: [1, 0], color: [1, 1, 1], look: { ca: .004 }, desc: '…',
        glsl: `vec4 tr(vec2 uv){ … sA(uv) sB(uv) uP uPar uDir uCol uCen inside(uv) asp() and the //#use math,noise,color helpers … }` })  → then Trans.run(gfx, 'stripes', A, B, p) or Stage enter: ['stripes', .6]. */
    define(name, def) { T[name] = { ease: 'io3', par: [0, 1, 0, 0], desc: '', ...def }; if (!Trans.list.includes(name)) Trans.list.push(name); return Trans; },
    /** Draw the transition into `to` (default: Post's HDR scene). Returns { p, look } (look = Post pulses to multiply by sin(π·p)). */
    run(gfx, name, A, B, p, o = {}) {
      const d = T[name]; if (!d) throw new Error(`Trans: unknown transition "${name}". Available: ${Trans.list.join(', ')}`);
      const P = gfx.prog(PRE + d.glsl + MAIN, { tag: 'transition ' + name }), e = (EASE[d.ease] || EASE.io3)(Math.min(1, Math.max(0, p)));
      const par = d.par.map((v, i) => (o.par && o.par[i] != null ? o.par[i] : v));
      gfx.pass(P, { uA: A, uB: B, uP: e, uDir: o.dir || d.dir || [1, 0], uPar: par, uCol: o.color || d.color || [1, 1, 1], uCen: o.center || [.5, .5] }, { to: o.to });
      return { p: e, look: d.look || {} };
    },
  };
  window.Trans = Trans;
})();
