/* kit.js — building blocks for deterministic canvas videos. Classic script → window.K. No dependencies.
   Rule of the house: every function is a PURE function of its arguments (time in, pixels out).
   No Math.random, no Date.now, no state that survives between frames — use K.hash / K.rng / K.noise instead.

   Sections: math · random & noise · easing & springs · timeline · colour · canvas shapes & glow · text (RTL-aware) ·
             motion primitives · effects (rings, sparks, trails, glass) · particles & point morphing · 3D-lite · preview */
(() => {
  'use strict';
  const K = {}; window.K = K;
  const TAU = Math.PI * 2; K.TAU = TAU;

  /* ───────────────────────── math ───────────────────────── */
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, x) => (x - a) / (b - a);
  const prog = (t, a, b) => clamp((t - a) / (b - a));                        // 0..1 progress of t inside [a,b]
  const mod = (a, n) => ((a % n) + n) % n;
  const fract = x => x - Math.floor(x);
  const smoothstep = (a, b, x) => { x = prog(x, a, b); return x * x * (3 - 2 * x); };
  const smootherstep = (a, b, x) => { x = prog(x, a, b); return x * x * x * (x * (x * 6 - 15) + 10); };
  const map = (x, a, b, c, d, ease) => lerp(c, d, ease ? ease(prog(x, a, b)) : prog(x, a, b));   // clamped remap
  const angleLerp = (a, b, t) => { const d = mod(b - a + Math.PI, TAU) - Math.PI; return a + d * t; };
  Object.assign(K, { clamp, lerp, invLerp, prog, mod, fract, smoothstep, smootherstep, map, angleLerp, dist: Math.hypot, deg: Math.PI / 180 });

  /* ───────────────────────── deterministic randomness ───────────────────────── */
  const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
  const mix32 = x => { x = Math.imul(x ^ (x >>> 16), 0x7feb352d); x = Math.imul(x ^ (x >>> 15), 0x846ca68b); return (x ^ (x >>> 16)) >>> 0; };
  const hash = n => { f32[0] = n; return mix32(u32[0] + 0x9e3779b9) / 4294967296; };              // any float → [0,1)
  const hash2 = (x, y) => { f32[0] = x; const a = u32[0]; f32[0] = y; return mix32(mix32(a + 0x85ebca6b) ^ (u32[0] + 0xc2b2ae35)) / 4294967296; };
  const hash3 = (x, y, z) => { f32[0] = z; return mix32(Math.floor(hash2(x, y) * 4294967296) ^ (u32[0] + 0x27d4eb2f)) / 4294967296; };
  const rng = seed => { let s = (seed | 0) + 0x6D2B79F5; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const fade5 = t => t * t * t * (t * (t * 6 - 15) + 10);
  const grad2 = (h, x, y) => { const a = h * TAU; return Math.cos(a) * x + Math.sin(a) * y; };
  const noise1 = x => { const i = Math.floor(x), f = x - i; return lerp(hash(i) , hash(i + 1), fade5(f)) * 2 - 1; };
  const noise2 = (x, y) => {                      // gradient noise, ≈ [-1,1]
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fade5(fx), v = fade5(fy);
    const a = grad2(hash2(ix, iy), fx, fy), b = grad2(hash2(ix + 1, iy), fx - 1, fy), c = grad2(hash2(ix, iy + 1), fx, fy - 1), d = grad2(hash2(ix + 1, iy + 1), fx - 1, fy - 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v) * 1.41;
  };
  const noise3 = (x, y, z) => { const ix = Math.floor(z), f = fade5(z - ix); return lerp(noise2(x + ix * 17.13, y + ix * 9.71), noise2(x + (ix + 1) * 17.13, y + (ix + 1) * 9.71), f); };
  const fbm = (x, y, oct = 4, lac = 2, gain = .5) => { let s = 0, a = .5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise2(x * f + i * 31.7, y * f + i * 17.3); f *= lac; a *= gain; } return s; };
  const curl = (x, y, z = 0, e = .01) => { const dx = noise3(x, y + e, z) - noise3(x, y - e, z), dy = noise3(x + e, y, z) - noise3(x - e, y, z); return [dx / (2 * e), -dy / (2 * e)]; };   // divergence-free flow
  Object.assign(K, { hash, hash2, hash3, rng, noise1, noise2, noise3, fbm, curl, pick: (list, r) => list[Math.floor(r * list.length) % list.length] });

  /* ───────────────────────── easing & springs ───────────────────────── */
  const E = { lin: x => x };
  const c1 = 1.70158, c3 = c1 + 1, c4 = TAU / 3, c5 = TAU / 4.5;
  const outBounce = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };
  const base = {
    Quad: [x => x * x, x => 1 - (1 - x) * (1 - x)], Cubic: [x => x ** 3, x => 1 - (1 - x) ** 3], Quart: [x => x ** 4, x => 1 - (1 - x) ** 4], Quint: [x => x ** 5, x => 1 - (1 - x) ** 5],
    Sine: [x => 1 - Math.cos(x * Math.PI / 2), x => Math.sin(x * Math.PI / 2)], Expo: [x => x === 0 ? 0 : 2 ** (10 * x - 10), x => x === 1 ? 1 : 1 - 2 ** (-10 * x)],
    Circ: [x => 1 - Math.sqrt(1 - x * x), x => Math.sqrt(1 - (x - 1) ** 2)], Back: [x => c3 * x ** 3 - c1 * x * x, x => 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2],
    Elastic: [x => x === 0 ? 0 : x === 1 ? 1 : -(2 ** (10 * x - 10)) * Math.sin((x * 10 - 10.75) * c4), x => x === 0 ? 0 : x === 1 ? 1 : 2 ** (-10 * x) * Math.sin((x * 10 - .75) * c4) + 1],
    Bounce: [x => 1 - outBounce(1 - x), outBounce],
  };
  for (const [n, [i, o]] of Object.entries(base)) {
    E['in' + n] = x => i(clamp(x)); E['out' + n] = x => o(clamp(x));
    E['inOut' + n] = x => { x = clamp(x); return x < .5 ? (1 - o(1 - 2 * x)) / 2 : (1 + o(2 * x - 1)) / 2; };
  }
  E.inOutBack = x => { x = clamp(x); const c = c1 * 1.525; return x < .5 ? ((2 * x) ** 2 * ((c + 1) * 2 * x - c)) / 2 : ((2 * x - 2) ** 2 * ((c + 1) * (x * 2 - 2) + c) + 2) / 2; };
  E.smooth = x => smoothstep(0, 1, x); E.smoother = x => smootherstep(0, 1, x);
  E.backOut = (s = 1.9) => x => { x = clamp(x); return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2; };   // tunable overshoot: E.backOut(1) subtle … 3 big
  E.steps = n => x => Math.floor(clamp(x) * n) / n;
  E.bezier = (x1, y1, x2, y2) => {                                                                       // CSS cubic-bezier()
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => { x = clamp(x); let t = x; for (let i = 0; i < 8; i++) { const e = X(t) - x; if (Math.abs(e) < 1e-6) break; const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= e / d; } return Y(clamp(t)); };
  };
  E.io = E.inOutCubic; E.o = E.outCubic; E.i = E.inCubic; E.expo = E.outExpo; E.back = E.outBack; E.elastic = E.outElastic;
  K.E = E;
  /** Closed-form damped spring step response 0→1 (overshoots for z<1). f: Hz, z: damping ratio. Pure function of t. */
  K.spring = (t, { f = 2.4, z = .32 } = {}) => {
    if (t <= 0) return 0; const w = TAU * f;
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
  };
  /** Decaying wobble that starts at 0 amplitude-1 and rings out — squash & stretch, hit reactions. */
  K.wobble = (t, { f = 4, decay = 6 } = {}) => t < 0 ? 0 : Math.exp(-t * decay) * Math.cos(t * TAU * f);

  /* ───────────────────────── timeline ───────────────────────── */
  /** Interpolate keyframes [[t, value, ease?], …]. Values may be numbers or arrays. Ease belongs to the segment ENDING at that key. */
  K.keyframes = (t, keys) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, ease] = keys[i];
      if (t <= t1) { const [t0, v0] = keys[i - 1], p = (ease || E.inOutCubic)(prog(t, t0, t1)); return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], p)) : lerp(v0, v1, p); }
    }
    return keys[keys.length - 1][1];
  };
  /** 0→1 over [a,b] with easing (default outCubic) — the workhorse for entrances. */
  K.seg = (t, a, b, ease = E.outCubic) => ease(prog(t, a, b));
  /** In-then-out envelope: rises over [a0,a1], holds, falls over [b0,b1]. */
  K.fade = (t, a0, a1, b0, b1) => Math.min(E.outCubic(prog(t, a0, a1)), 1 - E.inCubic(prog(t, b0, b1)));
  /** Start time for item i of n so the whole cascade takes `total` seconds (or `each` seconds apart). */
  K.stagger = (i, { each = .08, total, n } = {}) => total != null && n > 1 ? i * total / (n - 1) : i * each;
  /** Sum of exponentially decaying pulses after each hit time (seconds). Great for beat-driven scale/flash. */
  K.pulse = (t, hits, decay = .12, strength = 1) => { let s = 0; for (let i = hits.length - 1; i >= 0; i--) { const d = t - hits[i]; if (d >= 0) { s += Math.exp(-d / decay); if (d > decay * 8) break; } } return s * strength; };
  /** Musical grid. beat(t) → fractional beat; time(beat) → seconds; phase(t) → 0..1 inside the beat. */
  K.grid = (bpm, offset = 0) => { const B = 60 / bpm; return { B, bpm, beat: t => (t - offset) / B, time: b => offset + b * B, phase: t => fract((t - offset) / B), bar: (t, n = 4) => Math.floor((t - offset) / B / n) }; };
  /** Scene list: [['intro',0],['main',4],['outro',9]] + total duration → at(t) = {i,id,t0,t1,lt,p,left}. */
  K.scenes = (list, dur) => ({
    list, at(t) { let i = list.length - 1; while (i > 0 && t < list[i][1]) i--; const t0 = list[i][1], t1 = i + 1 < list.length ? list[i + 1][1] : dur; return { i, id: list[i][0], t0, t1, lt: t - t0, p: prog(t, t0, t1), left: t1 - t }; },
  });
  K.frameIndex = (t, fps) => Math.round(t * fps);

  /* ───────────────────────── colour ───────────────────────── */
  const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const toRgb = c => Array.isArray(c) ? c : typeof c === 'string' && c[0] === '#' ? hex2rgb(c) : (/rgba?\(([^)]+)\)/.exec(c) || [0, '0,0,0'])[1].split(',').slice(0, 3).map(Number);
  K.rgb = toRgb;
  K.rgba = (c, a = 1) => { const [r, g, b] = toRgb(c); return `rgba(${r | 0},${g | 0},${b | 0},${a})`; };
  K.mix = (a, b, k) => { const A = toRgb(a), B = toRgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
  K.hsl = (h, s = .8, l = .55, a = 1) => `hsla(${mod(h, 360)},${s * 100}%,${l * 100}%,${a})`;
  /** OKLCH → CSS rgb(). l 0..1, c 0..~.4, h degrees. Perceptually even: equal l looks equally bright across hues. */
  K.oklch = (l, c, h, a = 1) => {
    const hr = h * Math.PI / 180, A = c * Math.cos(hr), B = c * Math.sin(hr);
    const l_ = (l + .3963377774 * A + .2158037573 * B) ** 3, m_ = (l - .1055613458 * A - .0638541728 * B) ** 3, s_ = (l - .0894841775 * A - 1.291485548 * B) ** 3;
    const lin = [4.0767416621 * l_ - 3.3077115913 * m_ + .2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - .3413193965 * s_, -.0041960863 * l_ - .7034186147 * m_ + 1.707614701 * s_];
    const g = lin.map(v => { v = clamp(v); return Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055)); });
    return a < 1 ? `rgba(${g},${a})` : `rgb(${g})`;
  };
  /** A coherent palette from one hue: {bg, bg2, ink, muted, a, b, c, glow}. mode: 'analogous' | 'complementary' | 'triad' | 'mono'. */
  K.palette = (hue, { mode = 'analogous', dark = true } = {}) => {
    const off = { analogous: [0, 35, -35], complementary: [0, 180, 160], triad: [0, 120, 240], mono: [0, 0, 0] }[mode], L = dark ? .74 : .55;
    return { bg: K.oklch(dark ? .13 : .97, .03, hue), bg2: K.oklch(dark ? .2 : .92, .05, hue + 20), ink: dark ? '#f5f3ff' : '#15121f', muted: K.oklch(dark ? .7 : .45, .03, hue),
      a: K.oklch(L, .17, hue + off[0]), b: K.oklch(L, .16, hue + off[1]), c: K.oklch(L + .06, .15, hue + off[2]), glow: K.oklch(.82, .13, hue) };
  };

  /* ───────────────────────── canvas: shapes, glow, strokes ───────────────────────── */
  /** Off-screen canvas. `cpu: true` makes it software-backed — use it for textures painted once with many small draws or blend modes:
      on a GPU canvas 16 000 tiny `multiply` rects grabbed 3.7 GB of GPU memory on the first frame (measured), and with several workers that stalls the machine. */
  K.canvas = (w, h, { cpu = false } = {}) => { const c = document.createElement('canvas'); c.width = w; c.height = h; if (cpu) c.getContext('2d', { willReadFrequently: true }); return c; };
  K.rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  K.circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };
  K.poly = (ctx, pts, close = true) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (close) ctx.closePath(); };
  K.star = (ctx, x, y, r1, r2, n = 5, rot = -Math.PI / 2) => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); };
  K.regular = (ctx, x, y, r, n, rot = -Math.PI / 2) => { ctx.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i * TAU / n; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); };
  K.save = (ctx, fn) => { ctx.save(); try { fn(); } finally { ctx.restore(); } };
  const glowCache = new Map();
  /** Additive soft light: cached radial-gradient sprite. Draw with ctx.globalCompositeOperation='lighter' for bloom-like halos. */
  K.glow = (ctx, x, y, r, color = '#fff', a = 1) => {
    const key = color + '|' + (Math.round(r / 8) * 8 || 8); let s = glowCache.get(key);
    if (!s) { const R = Math.max(8, Math.round(r / 8) * 8), c = K.canvas(R * 2, R * 2), g = c.getContext('2d'), gr = g.createRadialGradient(R, R, 0, R, R, R);
      const [cr, cg, cb] = toRgb(color); gr.addColorStop(0, `rgba(${cr},${cg},${cb},1)`); gr.addColorStop(.25, `rgba(${cr},${cg},${cb},.45)`); gr.addColorStop(.6, `rgba(${cr},${cg},${cb},.1)`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, R * 2, R * 2); s = { c, R }; glowCache.set(key, s); }
    ctx.save(); ctx.globalAlpha *= a; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(s.c, x - r, y - r, r * 2, r * 2); ctx.restore();
  };
  /** Layered neon stroke of the current path: wide faint halo + core. Call after building the path. */
  K.neon = (ctx, color, width = 4, glow = 1) => {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'lighter';
    for (const [w, a] of [[width * 6, .06 * glow], [width * 3, .12 * glow], [width * 1.6, .35 * glow], [width * .7, 1]]) { ctx.lineWidth = w; ctx.strokeStyle = K.rgba(color, a); ctx.stroke(); }
    ctx.restore();
  };
  /** Draw-on: stroke only the first p (0..1) of a path of known length. */
  K.drawOn = (ctx, length, p) => { ctx.setLineDash([length * clamp(p), length + 1]); ctx.lineDashOffset = 0; };
  K.undash = ctx => ctx.setLineDash([]);
  /** SVG path helper: const s = K.svgPath('M0 0 C…'); s.length; s.at(u) → {x,y,angle}; s.path2d for ctx.stroke(s.path2d). */
  K.svgPath = d => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); const length = p.getTotalLength(); const path2d = new Path2D(d);
    return { length, path2d, at(u) { const l = clamp(u) * length, a = p.getPointAtLength(l), b = p.getPointAtLength(Math.min(length, l + .5)), c = p.getPointAtLength(Math.max(0, l - .5)); return { x: a.x, y: a.y, angle: Math.atan2(b.y - c.y, b.x - c.x) }; } };
  };
  K.vignette = (ctx, W, H, a = .5) => { const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .55); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  K.gradient = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };

  /* ───────────────────────── text (Latin + Persian/Arabic, RTL-aware) ───────────────────────── */
  // Font stacks (all bundled offline, OFL — see fonts/fonts.css). Latin fonts fall back to Vazirmatn for Persian/Arabic glyphs, Persian display fonts fall back to Anton/Inter for Latin.
  // Load what you use:  await K.loadFonts(['800 Vazirmatn', '400 Anton', '400 Lalezar'])      Specimen: examples/fonts.html (gallery/fonts.jpg)
  K.FONTS = { sans: '"Inter","Vazirmatn",system-ui,"Segoe UI",sans-serif', fa: '"Vazirmatn","Inter",system-ui,"Segoe UI",sans-serif', mono: '"JetBrains Mono","Vazirmatn",ui-monospace,monospace',
    display: '"Anton","Vazirmatn",Impact,sans-serif', serif: '"Playfair Display","Amiri",Georgia,serif', grotesk: '"Space Grotesk","Vazirmatn",system-ui,sans-serif', hand: '"Caveat","Vazirmatn",cursive', rounded: '"Fredoka","Vazirmatn",system-ui,sans-serif',
    faDisplay: '"Lalezar","Anton","Vazirmatn",sans-serif', faClassic: '"Amiri","Playfair Display",serif', faKufi: '"Reem Kufi","Vazirmatn",sans-serif', faRuqaa: '"Aref Ruqaa","Amiri",serif', faNastaliq: '"Noto Nastaliq Urdu","Amiri",serif', faFun: '"Rakkas","Lalezar","Vazirmatn",sans-serif' };
  const RTL_CH = /[֐-ࣿיִ-﷿ﹰ-﻿]/, LTR_CH = /[A-Za-zÀ-ɏ]/;
  K.isRTL = s => RTL_CH.test(s);
  K.dirOf = s => { for (const ch of s) { if (RTL_CH.test(ch)) return 'rtl'; if (LTR_CH.test(ch)) return 'ltr'; } return 'ltr'; };
  K.faDigits = s => String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  K.fmtNum = (n, { fa = false, decimals = 0, compact = false } = {}) => {
    let s = compact && Math.abs(n) >= 1000 ? (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K') : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return fa ? K.faDigits(s).replace(/,/g, '٬').replace(/\./g, '٫') : s;
  };
  const fontStr = (o, size) => `${o.style || ''} ${o.weight || 700} ${size}px ${o.family || (K.isRTL(o._s || '') ? K.FONTS.fa : K.FONTS.sans)}`.trim();
  K.measure = (ctx, str, o = {}) => { const rtl = (o.dir || K.dirOf(str)) === 'rtl'; ctx.save(); ctx.font = fontStr({ ...o, _s: str }, o.size || 64); ctx.direction = rtl ? 'rtl' : 'ltr'; const m = ctx.measureText(str); ctx.restore(); return { w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, rtl }; };
  /** Draw a line of text. o: size, weight, family, fill (colour | gradient | (ctx,{x0,x1})=>style), stroke, strokeW, align ('center'|'left'|'right'),
      max (shrink to fit width), spacing (px, Latin only), glow (colour | {color,blur}), shadow {color,blur,x,y}, alpha, rot, sx, sy, ink (centre on ink bounds), dir.  Returns {w,x0,x1,size,rtl}. */
  K.text = (ctx, str, x, y, o = {}) => {
    const rtl = (o.dir || K.dirOf(str)) === 'rtl'; let size = o.size || 64; ctx.save();
    ctx.font = fontStr({ ...o, _s: str }, size); ctx.direction = rtl ? 'rtl' : 'ltr';
    if (o.spacing && !rtl) ctx.letterSpacing = o.spacing + 'px'; else if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    let m = ctx.measureText(str);
    if (o.max && m.width > o.max) { size *= o.max / m.width; ctx.font = fontStr({ ...o, _s: str }, size); m = ctx.measureText(str); }
    const w = m.width, align = o.align || 'center'; ctx.textAlign = align; ctx.textBaseline = o.ink ? 'alphabetic' : (o.baseline || 'middle');
    const yy = o.ink ? y + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 : y;
    const x0 = align === 'center' ? x - w / 2 : align === 'left' ? x : x - w, x1 = x0 + w;
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.sx || o.sy) ctx.scale(o.sx ?? 1, o.sy ?? 1); if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0); ctx.translate(-x, -y);
    const fill = typeof o.fill === 'function' ? o.fill(ctx, { x0, x1, y0: yy - size / 2, y1: yy + size / 2, size }) : (o.fill ?? '#fff');
    if (o.shadow) { ctx.shadowColor = o.shadow.color || 'rgba(0,0,0,.5)'; ctx.shadowBlur = o.shadow.blur ?? 20; ctx.shadowOffsetX = o.shadow.x || 0; ctx.shadowOffsetY = o.shadow.y || 0; }
    if (o.glow) { const g = typeof o.glow === 'string' ? { color: o.glow, blur: size * .3 } : o.glow; ctx.shadowColor = g.color; ctx.shadowBlur = g.blur ?? size * .3; ctx.fillStyle = fill; ctx.fillText(str, x, yy); ctx.shadowBlur = (g.blur ?? size * .3) * .4; }
    if (o.stroke) { ctx.lineWidth = o.strokeW || Math.max(2, size * .04); ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, yy); }
    ctx.fillStyle = fill; ctx.fillText(str, x, yy);
    ctx.restore(); return { w, x0, x1, size, rtl };
  };
  /** Lay out words of a line in reading order (Persian: first word rightmost). Returns [{s, x, w}] centred on cx. */
  K.lay = (ctx, str, cx, o = {}) => {
    const base = o.dir || K.dirOf(str), rtl = base === 'rtl', gap = (o.gap ?? .28), segs = [];
    // runs of opposite-direction words ("Google AI Studio" inside a Persian line, or a Persian phrase inside English) stay ONE unit so their internal order survives
    for (const tk of str.split(/\s+/).filter(Boolean)) { const last = segs[segs.length - 1], foreign = K.dirOf(tk) !== base; if (foreign && last && last.foreign) last.s += ' ' + tk; else segs.push({ s: tk, foreign }); }
    const ws = segs.map(q => q.s);
    let size = o.size || 64; const measure = sz => ws.map(w => K.measure(ctx, w, { ...o, size: sz }).w);
    let W = measure(size), tot = W.reduce((a, b) => a + b, 0) + (ws.length - 1) * gap * size;
    if (o.max && tot > o.max) { const k = o.max / tot; size *= k; W = measure(size); tot = W.reduce((a, b) => a + b, 0) + (ws.length - 1) * gap * size; }
    let x = rtl ? cx + tot / 2 : cx - tot / 2; const out = [];
    ws.forEach((s, i) => { const w = W[i]; if (rtl) { x -= w; out.push({ s, x: x + w / 2, w }); x -= gap * size; } else { out.push({ s, x: x + w / 2, w }); x += w + gap * size; } });
    return { words: out, size, total: tot, rtl };
  };
  /** Word-by-word entrance (safe for Persian: words keep their joined letters). lt = seconds since the line started. */
  K.words = (ctx, str, cx, y, lt, o = {}) => {
    const L = K.lay(ctx, str, cx, o), each = o.each ?? .07, dur = o.dur ?? .55, ease = o.ease || E.outExpo, dy = o.dy ?? .35 * L.size, blur = o.blur;
    L.words.forEach((w, i) => {
      const p = ease(prog(lt - i * each, 0, dur)); if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= clamp(p * 2.2); if (blur) ctx.filter = `blur(${(1 - p) * blur}px)`;
      K.text(ctx, w.s, w.x, y + (1 - p) * dy, { ...o, size: L.size, align: 'center', max: 0 }); ctx.restore();
    });
    return L;
  };
  /** Per-character entrance — LATIN ONLY (splitting Arabic-script letters breaks their joining; K.words is used automatically instead). */
  K.chars = (ctx, str, cx, y, lt, o = {}) => {
    if (K.isRTL(str)) return K.words(ctx, str, cx, y, lt, o);
    const size = o.size || 64, ch = [...str], each = o.each ?? .04, dur = o.dur ?? .5, ease = o.ease || E.outBack; let total = 0; const ws = ch.map(c => { const w = K.measure(ctx, c, o).w; total += w; return w; });
    const sp = o.spacing || 0; total += sp * (ch.length - 1); let x = cx - total / 2;
    ch.forEach((c, i) => { const p = ease(prog(lt - i * each, 0, dur)); if (p > 0) { ctx.save(); ctx.globalAlpha *= clamp(p * 3); K.text(ctx, c, x + ws[i] / 2, y + (1 - p) * (o.dy ?? size * .5), { ...o, align: 'center', spacing: 0 }); ctx.restore(); } x += ws[i] + sp; });
    return { total };
  };
  /** Typewriter substring by grapheme (Intl.Segmenter). For RTL it types in reading order (start = right edge). */
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  K.typed = (str, p) => { const g = seg ? [...seg.segment(str)].map(s => s.segment) : [...str]; return g.slice(0, Math.round(clamp(p) * g.length)).join(''); };
  /** Decode/scramble reveal: characters resolve left→right (Latin) while the rest flicker. Deterministic via seed+frame. */
  K.scramble = (str, p, seed = 1, frame = 0, set = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/') => {
    const ch = [...str], n = Math.floor(clamp(p) * ch.length); return ch.map((c, i) => i < n || c === ' ' ? c : set[Math.floor(hash2(i + seed * 7.1, Math.floor(frame / 2)) * set.length)]).join('');
  };
  /** Break text into lines that fit maxW (space-separated; works for RTL because logical order is kept). */
  K.wrap = (ctx, str, maxW, o = {}) => {
    const words = str.split(/\s+/), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (line && K.measure(ctx, t, o).w > maxW) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  };
  /** Wait until every "weight family" is really loaded (throws — never silently fall back to a system font). */
  K.loadFonts = async list => {
    const sample = 'Aa Bb 0123 ۰۱۲۳ ابپتثجچ سلام';
    await Promise.all(list.map(f => { const m = /^(\d+|normal|bold)?\s*(.+)$/.exec(f.trim()); return document.fonts.load(`${m[1] || 400} 40px ${m[2]}`, sample); }));
    await document.fonts.ready;
    for (const f of list) { const m = /^(\d+|normal|bold)?\s*(.+)$/.exec(f.trim()); if (!document.fonts.check(`${m[1] || 400} 40px ${m[2]}`, sample)) throw new Error(`font not loaded: ${f} — check the @font-face url() in the page`); }
  };
  K.loadImages = async map => { const out = {}; await Promise.all(Object.entries(map).map(async ([k, src]) => { const im = new Image(); im.src = src; await im.decode(); out[k] = im; })); return out; };

  /* ───────────────────────── motion primitives ───────────────────────── */
  /** Slam-in: scales down from `from`×, stretched while flying, squashes on impact and wobbles to rest. p = seconds since start. */
  K.slam = (ctx, p, x, y, draw, { from = 2.4, d = .28 } = {}) => {
    if (p < 0) return; const q = clamp(p / d), e = E.outExpo(q); let sx = 1 - .14 * (1 - e), sy = 1 + .3 * (1 - e);
    if (p > d) { const k = .17 * Math.exp(-(p - d) * 8) * Math.cos((p - d) * 26); sx = 1 + k; sy = 1 - k; }
    const s = lerp(from, 1, e); ctx.save(); ctx.translate(x, y); ctx.scale(s * sx, s * sy); ctx.globalAlpha *= clamp(q * 3); draw(); ctx.restore();
  };
  /** Whip-in from a side with a ghost trail (cheap motion blur). dx/dy = start offset. */
  K.slide = (ctx, p, x, y, draw, { dx = 380, dy = 0, dur = .42, ghosts = 3 } = {}) => {
    if (p < 0) return;
    for (let k = ghosts; k >= 0; k--) {
      const q = clamp((p - k * .014) / dur), v = 1 - E.outExpo(q); if (k && v < .03) continue;
      ctx.save(); ctx.globalAlpha *= (k ? .22 : 1) * clamp(q * 5); ctx.translate(x + dx * v, y + dy * v); if (dx) ctx.transform(1, 0, -.4 * v * Math.sign(dx), 1, 0, 0); draw(); ctx.restore();
    }
  };
  /** Pop with overshoot (outBack). */
  K.pop = (ctx, p, x, y, draw, { dur = .45, over = 1.9 } = {}) => { if (p < 0) return; const q = clamp(p / dur), s = E.backOut(over)(q); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= clamp(q * 3); draw(); ctx.restore(); };
  /** Smooth pseudo-random shake: returns [dx, dy, rot]. amp in px; multiply by a decay envelope yourself. */
  K.shake = (t, amp = 10, freq = 24, seed = 0) => [noise1(t * freq + seed * 13.1) * amp, noise1(t * freq + seed * 29.7 + 100) * amp, noise1(t * freq * .7 + seed * 7.3 + 200) * amp * .0009];
  /** Beat-driven camera scale: 1 + amp on every hit, decaying. */
  K.punch = (t, hits, { amp = .03, decay = .12 } = {}) => 1 + K.pulse(t, hits, decay, amp);
  /** Apply a camera about the canvas centre: zoom, rotation (rad), pan (px), shake [dx,dy,rot]. Call inside ctx.save()/restore(). */
  K.camera = (ctx, W, H, { zoom = 1, rot = 0, x = 0, y = 0, shake = [0, 0, 0] } = {}) => { ctx.translate(W / 2 + x + shake[0], H / 2 + y + shake[1]); ctx.rotate(rot + shake[2]); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); };
  K.iris = (ctx, W, H, p, cx = W / 2, cy = H / 2) => { const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * clamp(p); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); };
  K.wipe = (ctx, W, H, p, angle = 0) => { ctx.translate(W / 2, H / 2); ctx.rotate(angle); const L = Math.hypot(W, H); ctx.beginPath(); ctx.rect(-L / 2, -L / 2, L * clamp(p), L); ctx.clip(); ctx.rotate(-angle); ctx.translate(-W / 2, -H / 2); };
  /** Layout in "1080 units": u = min(W,H)/1080 keeps sizes consistent in every aspect ratio. safe = social-UI safe rectangle. */
  K.layout = (W, H, kind = 'auto') => {
    const vertical = H > W * 1.2, u = Math.min(W, H) / 1080, k = kind === 'auto' ? (vertical ? 'reel' : 'tv') : kind;
    const m = { reel: [.06, .14, .06, .2], tv: [.05, .06, .05, .06], square: [.06, .07, .06, .1] }[k] || [.05, .06, .05, .06];
    return { W, H, cx: W / 2, cy: H / 2, u, vertical, safe: { l: W * m[0], t: H * m[1], r: W * (1 - m[2]), b: H * (1 - m[3]), w: W * (1 - m[0] - m[2]), h: H * (1 - m[1] - m[3]) } };
  };
  K.params = () => { const q = new URLSearchParams(location.search); return { render: q.has('render'), play: q.has('play') || location.hash === '#play', w: +q.get('w') || 0, h: +q.get('h') || 0, fps: +q.get('fps') || 0, dur: +q.get('dur') || 0, t: q.has('t') ? +q.get('t') : null, q }; };

  /* ───────────────────────── effects ───────────────────────── */
  /** Expanding rings. p = seconds since the hit. */
  K.rings = (ctx, p, x, y, { n = 3, gap = .09, life = .9, r0 = 60, r1 = 720, color = '#fff', width = 14 } = {}) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < n; k++) { const q = (p - k * gap) / life; if (q < 0 || q > 1) continue; ctx.globalAlpha = (1 - q) ** 2; ctx.lineWidth = width * (1 - q) + 2; ctx.strokeStyle = Array.isArray(color) ? color[k % color.length] : color; ctx.beginPath(); ctx.arc(x, y, lerp(r0, r1, E.outExpo(q)), 0, TAU); ctx.stroke(); }
    ctx.restore();
  };
  /** Sparks with drag, drawn as streaks (motion blur for free). Closed-form: pos(t) = v(1-e^{-kt})/k. */
  K.sparks = (ctx, p, x, y, { n = 120, life = 1.2, speed = 1400, drag = 3.2, color = '#fff', width = 3, seed = 1, spread = TAU, angle = 0, gravity = 0 } = {}) => {
    if (p < 0 || p > life) return;
    const P = (i, t) => { const a = angle + (hash2(i, seed) - .5) * spread, v = speed * (.3 + .7 * hash2(i + .5, seed)), d = v * (1 - Math.exp(-t * drag)) / drag; return [x + Math.cos(a) * d, y + Math.sin(a) * d + .5 * gravity * t * t]; };
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineWidth = width; ctx.globalAlpha = (1 - p / life) ** 1.5;
    const cols = Array.isArray(color) ? color : [color];
    cols.forEach((col, c) => { ctx.strokeStyle = col; ctx.beginPath(); for (let i = c; i < n; i += cols.length) { const [x0, y0] = P(i, Math.max(0, p - .03)), [x1, y1] = P(i, p); ctx.moveTo(x0, y0); ctx.lineTo(x1 + .01, y1); } ctx.stroke(); });
    ctx.restore();
  };
  /** Confetti / debris with gravity and spin (closed form). */
  K.confetti = (ctx, p, x, y, { n = 90, life = 2.4, speed = 900, gravity = 1800, colors = ['#fff'], size = 14, seed = 1, spread = TAU, angle = -Math.PI / 2 } = {}) => {
    if (p < 0 || p > life) return; ctx.save();
    for (let i = 0; i < n; i++) {
      const a = angle + (hash2(i, seed) - .5) * spread, v = speed * (.35 + .65 * hash2(i + .3, seed)), px = x + Math.cos(a) * v * p * (1 - .25 * p), py = y + Math.sin(a) * v * p + .5 * gravity * p * p;
      const sz = size * (.5 + hash2(i + .7, seed)), rot = hash2(i + .9, seed) * TAU + p * (hash2(i + .1, seed) - .5) * 14, flip = Math.cos(p * (6 + hash2(i + .2, seed) * 8));
      ctx.globalAlpha = clamp((life - p) * 2); ctx.fillStyle = colors[i % colors.length]; ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(1, flip); ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2); ctx.restore();
    }
    ctx.restore();
  };
  /** Trail of a moving point: fn(t) → [x,y]. Samples the last `span` seconds; fades and tapers. */
  K.trail = (ctx, fn, t, { span = .35, n = 24, width = 8, color = '#fff' } = {}) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    let prev = fn(t - span); for (let i = 1; i <= n; i++) { const q = i / n, cur = fn(t - span * (1 - q)); ctx.globalAlpha = q * q; ctx.lineWidth = width * q; ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke(); prev = cur; }
    ctx.restore();
  };
  /** Frosted glass: snap() the frame drawn so far (downsampled + blurred), then glass() panels sample it. */
  K.Frost = class {
    constructor(W, H, s = 4) { this.W = W; this.H = H; this.c = K.canvas(Math.ceil(W / s), Math.ceil(H / s)); this.g = this.c.getContext('2d'); this.s = s; }
    snap(src, blur = 7) { const g = this.g; g.clearRect(0, 0, this.c.width, this.c.height); g.filter = `blur(${blur}px)`; g.drawImage(src, 0, 0, this.c.width, this.c.height); g.filter = 'none'; }
    glass(ctx, x, y, w, h, r = 36, { tint, glow, glowBlur = 60, smoke = .34, border = 'rgba(255,255,255,.55)' } = {}) {
      ctx.save(); ctx.shadowColor = glow || 'rgba(0,0,0,.5)'; ctx.shadowBlur = glow ? glowBlur : 60; ctx.shadowOffsetY = glow ? 0 : 24; K.rr(ctx, x, y, w, h, r); ctx.fillStyle = '#0a0c26'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.clip();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.c, 0, 0, this.W, this.H); ctx.restore();
      ctx.fillStyle = `rgba(6,8,28,${smoke})`; ctx.fillRect(x, y, w, h);
      const g = ctx.createLinearGradient(x, y, x + w * .6, y + h); g.addColorStop(0, 'rgba(255,255,255,.17)'); g.addColorStop(1, 'rgba(255,255,255,.04)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      if (tint) { ctx.fillStyle = tint; ctx.fillRect(x, y, w, h); } ctx.restore();
      const s = ctx.createLinearGradient(x, y, x + w, y + h); s.addColorStop(0, border); s.addColorStop(.45, 'rgba(255,255,255,.1)'); s.addColorStop(1, 'rgba(255,255,255,.3)');
      K.rr(ctx, x + 1, y + 1, w - 2, h - 2, r); ctx.strokeStyle = s; ctx.lineWidth = 2.5; ctx.stroke();
    }
  };
  /** Diagonal specular sweep across a rounded rect. k = 0..1. */
  K.shine = (ctx, x, y, w, h, r, k, a = .35) => {
    if (k <= 0 || k >= 1) return; ctx.save(); K.rr(ctx, x, y, w, h, r); ctx.clip(); const c = lerp(x - 200, x + w + 200, k), g = ctx.createLinearGradient(c - 140, y, c + 140, y + h * .6);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
  };
  /** Waveform bars/line driven by fn(u∈0..1, i) → 0..1 amplitude. */
  K.bars = (ctx, x, y, w, h, n, fn, { gap = .45, color = '#fff', round = true, mirror = true } = {}) => {
    const bw = w / n; ctx.save(); ctx.fillStyle = color;
    for (let i = 0; i < n; i++) { const a = clamp(fn(i / (n - 1), i)), bh = Math.max(2, a * h), bx = x + i * bw + bw * gap / 2, ww = bw * (1 - gap); if (round) { K.rr(ctx, bx, mirror ? y - bh / 2 : y - bh, ww, bh, ww / 2); ctx.fill(); } else ctx.fillRect(bx, mirror ? y - bh / 2 : y - bh, ww, bh); }
    ctx.restore();
  };

  /* ───────────────────────── particles & point morphing ───────────────────────── */
  /** Looping particle field as a pure function of t. spawn(i, r) → {x,y,vx,vy,size,color?}; r = seeded rng for that particle. */
  K.field = ({ n = 200, seed = 1, life = [1.5, 3], rate, t0 = 0, spawn, drag = 0, gravity = 0, fadeIn = .1 }) => ({
    draw(ctx, t, { glow = false, streak = false, alpha = 1 } = {}) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const r = rng(seed * 100003 + i), L = lerp(life[0], life[1], r()), period = rate ? n / rate : L * 1.3, phase = r() * period, age = mod(t - t0 - phase, period);
        if (t < t0 || age > L) continue; const s = spawn(i, r), d = drag ? (1 - Math.exp(-drag * age)) / drag : age, a = (1 - age / L) * clamp(age / fadeIn) * alpha;
        const px = s.x + s.vx * d, py = s.y + s.vy * d + .5 * gravity * age * age;
        if (streak) { const d2 = drag ? (1 - Math.exp(-drag * Math.max(0, age - .03))) / drag : Math.max(0, age - .03); ctx.strokeStyle = s.color || '#fff'; ctx.globalAlpha = a; ctx.lineWidth = s.size || 2; ctx.beginPath(); ctx.moveTo(s.x + s.vx * d2, s.y + s.vy * d2 + .5 * gravity * (age - .03) ** 2); ctx.lineTo(px, py); ctx.stroke(); }
        else if (glow) K.glow(ctx, px, py, (s.size || 4) * 4, s.color || '#fff', a);
        else { ctx.globalAlpha = a; ctx.fillStyle = s.color || '#fff'; ctx.beginPath(); ctx.arc(px, py, s.size || 2, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    },
  });
  /** Sample the covered pixels of any drawing into points (for text/logo → particle morphs). draw(g) paints white on a transparent canvas of w×h. */
  K.samplePoints = (w, h, draw, step = 4, threshold = 140) => {
    const c = K.canvas(w, h), g = c.getContext('2d', { willReadFrequently: true }); draw(g); const d = g.getImageData(0, 0, w, h).data, pts = [];
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > threshold) pts.push([x - w / 2, y - h / 2]);
    return pts;
  };
  K.sampleText = (str, { size = 200, weight = 800, family, w = 1600, h = 500, step = 4, dir } = {}) =>
    K.samplePoints(w, h, g => { const rtl = (dir || K.dirOf(str)) === 'rtl'; g.font = `${weight} ${size}px ${family || (rtl ? K.FONTS.fa : K.FONTS.sans)}`; g.direction = rtl ? 'rtl' : 'ltr'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(str, w / 2, h / 2); }, step);
  /** Pair two point sets (any sizes) and interpolate. order: sort both by x so the morph sweeps coherently (dirB: 1 = LTR, -1 = RTL). */
  K.morph = (A, B, { n = Math.max(A.length, B.length), dirA = 1, dirB = 1, seed = 3 } = {}) => {
    const sa = [...A].sort((p, q) => dirA * (p[0] - q[0]) || p[1] - q[1]), sb = [...B].sort((p, q) => dirB * (p[0] - q[0]) || p[1] - q[1]), r = rng(seed), items = [];
    for (let i = 0; i < n; i++) { const a = sa[Math.floor(i * sa.length / n)], b = sb[Math.floor(i * sb.length / n)]; items.push({ a, b, ang: r() * TAU, mag: 50 + 160 * r(), lag: r() }); }
    return { items, at(p, { swirl = 1, ease = E.inOutCubic, spread = .35 } = {}) { return items.map(it => { const q = ease(prog(p, it.lag * spread, it.lag * spread + (1 - spread))), s = Math.sin(Math.PI * q) * swirl; return [lerp(it.a[0], it.b[0], q) + Math.cos(it.ang) * it.mag * s, lerp(it.a[1], it.b[1], q) + Math.sin(it.ang) * it.mag * s]; }); } };
  };
  K.dots = (ctx, pts, cx, cy, { size = 2.2, color = '#fff', glow = 0, alpha = 1 } = {}) => {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; if (glow) ctx.globalCompositeOperation = 'lighter';
    for (const [x, y] of pts) ctx.fillRect(cx + x - size / 2, cy + y - size / 2, size, size); ctx.restore();
  };

  /* ───────────────────────── 3D-lite (no libraries) ───────────────────────── */
  /** Perspective camera: {x,y,z position, yaw, pitch, fov (rad), W, H}. World axes: x right, y UP, z forward. project(p) → {x,y (screen px), s (scale), z (depth)} or null behind the camera. */
  K.cam3 = ({ x = 0, y = 0, z = -800, yaw = 0, pitch = 0, fov = 1, W = 1920, H = 1080 } = {}) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), f = (H / 2) / Math.tan(fov / 2);
    return { project: (p) => { let dx = p[0] - x, dy = p[1] - y, dz = p[2] - z; const x1 = cy * dx - sy * dz, z1 = sy * dx + cy * dz; const y2 = cp * dy - sp * z1, z2 = sp * dy + cp * z1; if (z2 < 1) return null; const s = f / z2; return { x: W / 2 + x1 * s, y: H / 2 - y2 * s, s, z: z2 }; } };
  };
  K.rotY = (p, a) => [Math.cos(a) * p[0] + Math.sin(a) * p[2], p[1], -Math.sin(a) * p[0] + Math.cos(a) * p[2]];
  K.rotX = (p, a) => [p[0], Math.cos(a) * p[1] - Math.sin(a) * p[2], Math.sin(a) * p[1] + Math.cos(a) * p[2]];
  K.rotZ = (p, a) => [Math.cos(a) * p[0] - Math.sin(a) * p[1], Math.sin(a) * p[0] + Math.cos(a) * p[1], p[2]];
  /** Painter's-algorithm flat-shaded polygons. faces: [{pts:[[x,y,z]…], color:'#rrggbb', alpha?, stroke?}]. light = unit vector towards the light. */
  K.drawFaces = (ctx, cam, faces, { light = [.4, .8, -.45], ambient = .35, fog = 0 } = {}) => {
    const ll = Math.hypot(...light), L = light.map(v => v / ll), out = [];
    for (const f of faces) {
      const pr = f.pts.map(cam.project); if (pr.some(p => !p)) continue;
      const [a, b, c] = f.pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const nl = Math.hypot(...n) || 1; n = n.map(q => q / nl);
      const lit = clamp(ambient + (1 - ambient) * Math.abs(n[0] * L[0] + n[1] * L[1] + n[2] * L[2])), depth = pr.reduce((s, p) => s + p.z, 0) / pr.length; out.push({ f, pr, lit, depth });
    }
    out.sort((p, q) => q.depth - p.depth);
    for (const { f, pr, lit, depth } of out) {
      const [r, g, b] = toRgb(f.color), k = fog ? Math.exp(-depth * fog) : 1; ctx.beginPath(); pr.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      ctx.globalAlpha = f.alpha ?? 1; ctx.fillStyle = `rgb(${(r * lit * k) | 0},${(g * lit * k) | 0},${(b * lit * k) | 0})`; ctx.fill(); if (f.stroke) { ctx.strokeStyle = f.stroke; ctx.lineWidth = f.lineWidth || 1; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  };

  /** Build an expensive static layer ONCE (per page load) and reuse it every frame. Deterministic because fn must be seeded/pure.
      It is painted on a software canvas on purpose (see K.canvas): per-pixel loops and blend modes are safe there, and drawImage() uploads the result to the GPU once. */
  const bakeCache = new Map();
  K.bake = (key, w, h, fn) => { let c = bakeCache.get(key); if (!c) { c = K.canvas(w, h, { cpu: true }); fn(c.getContext('2d', { willReadFrequently: true }), w, h); bakeCache.set(key, c); } return c; };
  /** Procedural paper/parchment texture (fibres, stains, soft light falloff). base/ink are colours; returns a cached canvas. */
  K.paper = (w, h, { base = '#efe6d2', ink = '90,64,34', seed = 11, stains = 90, fibres = 1800, edge = .35 } = {}) => K.bake(`paper|${w}|${h}|${base}|${seed}`, w, h, (g) => {
    const R = K.rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < stains; i++) { const x = R() * w, y = R() * h, r = 60 + R() * Math.min(w, h) * .35, gr = g.createRadialGradient(x, y, 0, x, y, r), dark = R() < .6; gr.addColorStop(0, dark ? `rgba(${ink},${.04 + R() * .07})` : `rgba(255,250,235,${.05 + R() * .08})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (let i = 0; i < fibres; i++) { const x = R() * w, y = R() * h, a = R() * Math.PI, l = 4 + R() * 22; g.strokeStyle = R() < .5 ? `rgba(${ink},${.04 + R() * .07})` : `rgba(255,250,235,${.05 + R() * .08})`; g.lineWidth = .6 + R(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    const e = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.hypot(w, h) * .55); e.addColorStop(0, 'rgba(60,35,10,0)'); e.addColorStop(1, `rgba(60,35,10,${edge})`); g.fillStyle = e; g.fillRect(0, 0, w, h);
  });

  /** Two-bone inverse kinematics (arms, legs, robot arms): root (x0,y0) → target (x1,y1) with bone lengths l1,l2. Returns [jointX, jointY]; bend = ±1 picks the elbow side. */
  /** Cut a logo/icon (PNG/JPG on a white background) out of its background: returns a canvas whose alpha = how un-white each pixel is (lo…hi = the whiteness range that fades out).
      recolor(r,g,b) → [r,g,b] | null lets you re-map colours, e.g. lift a navy part to white so the mark lives on dark backgrounds. size = output px (square-fit). */
  K.keyWhite = (src, { size = 760, lo = 175, hi = 245, recolor } = {}) => {
    const w0 = src.naturalWidth || src.width, h0 = src.naturalHeight || src.height, k = size / Math.max(w0, h0), c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0, c.width, c.height); const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const mn = Math.min(p[i], p[i + 1], p[i + 2]); if (recolor) { const o = recolor(p[i], p[i + 1], p[i + 2]); if (o) { p[i] = o[0]; p[i + 1] = o[1]; p[i + 2] = o[2]; } } p[i + 3] = Math.round(p[i + 3] * (1 - clamp((mn - lo) / (hi - lo)))); }
    g.putImageData(d, 0, 0); return c;
  };
  K.ik2 = (x0, y0, x1, y1, l1, l2, bend = 1) => {
    let dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy); d = clamp(d, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
    const a = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), t = a + bend * Math.acos(c); return [x0 + Math.cos(t) * l1, y0 + Math.sin(t) * l1];
  };

  /** Audio-driven visuals. Run `node tools/analyze-audio.mjs audio.wav` first, then: const A = await K.audioData('envelopes.json');
      A.level('sub'|'low'|'mid'|'high'|'master', t) → 0..1 · A.pulse(t, {band:'sub', decay:.12}) → kick-style envelope · A.beatPhase(t) → 0..1 inside the beat · A.beats / A.onsets / A.bpm */
  K.audioData = async (url = 'envelopes.json') => {
    const d = await (await fetch(url)).json(), rate = d.rate;
    const lv = (arr, t) => { if (!arr) return 0; const x = clamp(t, 0, (arr.length - 1) / rate) * rate, i = Math.floor(x); return lerp(arr[i], arr[Math.min(i + 1, arr.length - 1)], x - i) / 1000; };
    const beats = d.beats || [];
    return { ...d,
      level: (name, t) => lv((d.levels || {})[name], t),
      stemLevel: (stem, name, t) => lv(d.stems?.[stem]?.levels?.[name], t),
      pulse(t, { band, stem, decay = .12, min = 0 } = {}) { let s = 0; const list = stem ? d.stems?.[stem]?.onsets : d.onsets; for (const o of list || []) { if (o.t > t) break; if (t - o.t > decay * 8) continue; if (band && o.band !== band) continue; if (o.v < min) continue; s += o.v * Math.exp(-(t - o.t) / decay); } return s; },
      /** 32 log-spaced spectrum bands (40 Hz–12 kHz), 0..1, interpolated at time t → Float32Array. */
      spectrum(t, out = new Float32Array(d.spectrum?.bands || 0)) { const S = d.spectrum; if (!S) return out; const n = S.data.length / S.bands, x = clamp(t, 0, (n - 1) / S.rate) * S.rate, i = Math.floor(x), f = x - i, j = Math.min(n - 1, i + 1); for (let b = 0; b < S.bands; b++) out[b] = lerp(S.data[i * S.bands + b], S.data[j * S.bands + b], f) / 1000; return out; },
      beatIndex(t) { let i = 0; while (i + 1 < beats.length && beats[i + 1] <= t) i++; return t < (beats[0] ?? 0) ? -1 : i; },
      beatPhase(t) { const i = this.beatIndex(t); if (i < 0 || !beats.length) return 0; const a = beats[i], b = beats[i + 1] ?? a + 60 / d.bpm; return clamp((t - a) / (b - a)); },
    };
  };

  /* ───────────────────────── page plumbing ───────────────────────── */
  /** Preview harness: ?play (live, synced to the audio file, click to start), ?t=12.5 (one frame). Keys: space, ←/→ (1 s), shift+←/→ (0.1 s), ,/. (frame), h HUD, l loop. */
  K.play = (renderFrame, { dur, fps = 60, audio = 'audio.wav', grid } = {}) => {
    const P = K.params(); if (P.render) return;
    Promise.resolve(window.ready).then(() => {
      if (P.t != null) return renderFrame(P.t);
      renderFrame(0); if (!P.play) return;
      const hud = Object.assign(document.createElement('div'), { style: 'position:fixed;left:12px;top:10px;font:600 13px ui-monospace,monospace;color:#fff;background:#0009;padding:4px 8px;border-radius:6px;z-index:9' });
      const btn = Object.assign(document.createElement('button'), { textContent: '▶  Play (click, then Space to pause)', style: 'position:fixed;inset:0;border:0;background:#000b;color:#fff;font:700 28px system-ui;cursor:pointer;z-index:10' });
      document.body.append(hud, btn); let a = null, t0 = 0, playing = false, tt = 0, loop = true;
      try { a = new Audio(audio); a.preload = 'auto'; } catch { a = null; }
      const now = () => (a && a.readyState > 1 && !a.paused ? a.currentTime : playing ? tt + (performance.now() - t0) / 1000 : tt);
      const seek = t => { tt = clamp(t, 0, dur - 1 / fps); t0 = performance.now(); if (a) try { a.currentTime = tt; } catch { /* audio not ready */ } };
      const setPlay = on => { if (on === playing) return; if (on) { seek(tt); t0 = performance.now(); a && a.play().catch(() => {}); } else { tt = now(); a && a.pause(); } playing = on; };
      btn.onclick = () => { btn.remove(); setPlay(true); };
      addEventListener('keydown', e => { const k = e.key; if (k === ' ') { e.preventDefault(); setPlay(!playing); } else if (k === 'ArrowLeft') { seek(now() - (e.shiftKey ? .1 : 1)); } else if (k === 'ArrowRight') { seek(now() + (e.shiftKey ? .1 : 1)); }
        else if (k === ',') { setPlay(false); seek(tt - 1 / fps); } else if (k === '.') { setPlay(false); seek(tt + 1 / fps); } else if (k === 'h') hud.style.display = hud.style.display === 'none' ? '' : 'none'; else if (k === 'l') loop = !loop; });
      (function frame() { let t = now(); if (playing && t >= dur) { if (loop) { seek(0); a && a.play().catch(() => {}); t = 0; } else setPlay(false); } renderFrame(clamp(t, 0, dur)); hud.textContent = `${t.toFixed(2)}s  f${Math.round(t * fps)}` + (grid ? `  beat ${grid.beat(t).toFixed(2)}` : ''); requestAnimationFrame(frame); })();
    });
  };
})();
