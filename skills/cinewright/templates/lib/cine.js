/* cine.js — cinematography helpers: closed-form camera paths, shakes, speed ramps, letterbox, parallax, focus pulls.
   Pure functions of time (no state). Works with Stage.camera (2D camera in uv units) and Scene3D (3D camera). Classic script → window.Cine.

   S.camera = Cine.path([{ t: 0, zoom: 1.0 }, { t: 3, zoom: 1.12, x: .02 }, { t: 3.4, zoom: 1.0, rot: .01 }], { ease: 'inOutCubic' });      // keyframed camera
   S.camera = t => Cine.mix(Cine.path(keys)(t), Cine.punch(t, HITS), Cine.handheld(t));                                                       // layer several sources
   const tt = Cine.ramp(t, [[0, 0], [2, 2], [2.4, 2.1], [4, 4]]);     // speed ramp: video time → scene time (slow-mo around 2 s)
   Cine.letterbox(g, W, H, 2.39, p);   Cine.parallax(layers, camX, camY, draw);   Cine.focus(t, [[0, 6], [2, 14], [3, 6]]) → focus distance track */
(() => {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const EASE = { lin: x => x, inOutCubic: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), outCubic: x => 1 - Math.pow(1 - x, 3), inCubic: x => x * x * x, inOutQuint: x => (x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2), outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)), inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2 };
  const h1 = x => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const sn = (x, s = 0) => { const i = Math.floor(x), f = x - i, a = h1(i + s * 17.3) * 2 - 1, b = h1(i + 1 + s * 17.3) * 2 - 1, u = f * f * (3 - 2 * f); return a + (b - a) * u; };   // smooth 1D noise −1…1
  const Cine = {
    EASE,
    /** keyframed camera: keys [{t, x, y, zoom, rot, ease?}] → fn(t) → {zoom, rot, x, y}. Between keys: eased interpolation (default inOutCubic). */
    path(keys, { ease = 'inOutCubic' } = {}) {
      const K_ = keys.slice().sort((a, b) => a.t - b.t), d = { zoom: 1, rot: 0, x: 0, y: 0 };
      return t => { if (t <= K_[0].t) return { ...d, ...K_[0] }; for (let i = 0; i < K_.length - 1; i++) { const a = K_[i], b = K_[i + 1]; if (t <= b.t) { const e = (EASE[b.ease || ease] || EASE.inOutCubic)(clamp((t - a.t) / (b.t - a.t))); const o = {}; for (const k in d) o[k] = (a[k] ?? d[k]) + ((b[k] ?? d[k]) - (a[k] ?? d[k])) * e; return o; } } return { ...d, ...K_[K_.length - 1] }; };
    },
    /** add camera contributions: zoom multiplies, rot/x/y add */
    mix(...cams) { return cams.reduce((a, c) => ({ zoom: (a.zoom ?? 1) * (c.zoom ?? 1), rot: (a.rot || 0) + (c.rot || 0), x: (a.x || 0) + (c.x || 0), y: (a.y || 0) + (c.y || 0) }), { zoom: 1, rot: 0, x: 0, y: 0 }); },
    /** a small push on every hit: scale up by amp, decay over `decay` seconds */
    punch(t, hits, { amp = .02, decay = .25 } = {}) { let z = 0; for (const h of hits) if (t >= h) z = Math.max(z, Math.exp(-(t - h) / decay)); return { zoom: 1 + amp * z }; },
    /** smooth hand-held drift (uv units) */
    handheld(t, { amp = .004, speed = .8, roll = .003 } = {}) { return { x: sn(t * speed, 1) * amp, y: sn(t * speed * 1.13, 2) * amp, rot: sn(t * speed * .7, 3) * roll }; },
    /** impact shake that decays after each hit */
    shake(t, hits, { amp = .012, decay = .22, freq = 28 } = {}) { let k = 0; for (const h of hits) if (t >= h) k = Math.max(k, Math.exp(-(t - h) / decay)); return { x: sn(t * freq, 4) * amp * k, y: sn(t * freq, 5) * amp * k, rot: sn(t * freq, 6) * amp * .4 * k }; },
    /** speed ramp: keys [[videoTime, sceneTime], …] → sceneTime(t) by monotone interpolation (slow-mo = scene time advances slower than video time) */
    ramp(t, keys) { const k = keys; if (t <= k[0][0]) return k[0][1] + (t - k[0][0]); for (let i = 0; i < k.length - 1; i++) { const [t0, s0] = k[i], [t1, s1] = k[i + 1]; if (t <= t1) { const u = (t - t0) / (t1 - t0); return s0 + (s1 - s0) * (u * u * (3 - 2 * u) * .5 + u * .5); } } const l = k[k.length - 1]; return l[1] + (t - l[0]); },
    /** interpolate a scalar track [[t, v], …] with easing (focus distance, light intensity, fog density …) */
    track(t, keys, ease = 'inOutCubic') { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, v0] = keys[i], [t1, v1] = keys[i + 1]; if (t <= t1) return v0 + (v1 - v0) * (EASE[ease] || EASE.inOutCubic)(clamp((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; },
    focus(t, keys) { return Cine.track(t, keys); },
    /** cinema bars (draw in a Stage overlay): ratio 2.39 → bars; p = 0…1 how far they have closed */
    letterbox(g, W, H, ratio = 2.39, p = 1, color = '#000') { const bar = Math.max(0, (H - W / ratio) / 2) * clamp(p); g.fillStyle = color; g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar); },
    /** draw layers with parallax: layers [{depth, draw(g, i)}]; depth 0 = far (barely moves) … 1 = on the camera plane … >1 = foreground */
    parallax(g, layers, camX, camY) { layers.forEach((L, i) => { g.save(); g.translate(-camX * (L.depth ?? 1), -camY * (L.depth ?? 1)); L.draw(g, i); g.restore(); }); },
    /** beat helpers for cut-on-beat editing: bpm → time of beat n (and bars) */
    beats(bpm, offset = 0) { const B = 60 / bpm; return { B, time: n => offset + n * B, bar: n => offset + n * B * 4, phase: t => ((t - offset) / B) % 1, index: t => Math.floor((t - offset) / B) }; },
    noise: sn,
  };
  window.Cine = Cine;
})();
