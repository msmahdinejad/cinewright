/* type.js — kinetic-typography recipes for 2D canvas scenes (built on K.text, so Persian/Arabic shaping, RTL and fonts just work).
   Needs kit.js. Classic script → window.Type.  Every function is a pure function of its progress argument(s).

   Type.poster(g, 'Make it move now', cx, cy, width, lt, opts)      justified poster: every line scaled to the same width, lines slide up in masks
   Type.stack(g, str, x, y, { n, dy, size, fill, outline, phase })   echo stack (solid / outline / solid …) — the "RHYTHM RHYTHM RHYTHM" poster look
   Type.outline(g, str, x, y, p, opts)                               strokes draw on (all letters write themselves), then the fill fades in
   Type.reveal(g, str, x, y, p, { dir:'up'|'down'|'left'|'right' })  text rises out of an invisible mask line
   Type.slice(g, str, x, y, p, { n })                                horizontal slices slide in from alternating sides and snap together
   Type.glitch(g, str, x, y, amt, frame, opts)                       RGB split + slice jitter (deterministic from `frame`)
   Type.extrude(g, str, x, y, { depth, angle, colors })              faux-3D block letters from stacked copies
   Type.marquee(g, str, y, t, { speed, gap })                        endless ticker
   Type.weight(g, str, x, y, p, { from: 200, to: 900 })              variable-font weight animation (Vazirmatn/Inter are variable)
   Type.wave(g, str, x, y, t, { amp, speed })                        per-letter (Latin) / per-word (Persian) wave
   Type.ring(g, str, cx, cy, r, ang, opts)                           text around a circle (spin it with ang)
   Type.counter(g, value, x, y, opts)                                odometer: digits roll to `value` (Persian digits: { fa: true })
   Type.marker(g, str, x, y, p, opts)                                highlighter sweep behind the text
   Type.assemble(g, str, x, y, p, opts)                              letters/words fly in from everywhere and snap into place
   Type.fillWith(g, str, x, y, paint, opts)                          text as a window onto any painting (gradient, noise, photo, shader frame)
   Type.units(str)                                                   letters for Latin, whole words for Arabic script (joins must not break)
   Persian: never animate letters individually, never letter-space (the helpers respect this automatically). */
(() => {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), E = () => (window.K && K.E) || { outCubic: x => 1 - Math.pow(1 - x, 3), outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)), inOutCubic: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) };
  const seg = (t, a, b, f) => { const x = clamp((t - a) / (b - a)); return f ? f(x) : x; };
  const hash = (a, b = 0) => { let h = Math.imul(a * 374761393 + b * 668265263 + 1013904223, 1274126177); h = (h ^ (h >>> 13)) >>> 0; return h / 4294967296; };
  const Type = {
    units(str) { return K.isRTL(str) ? str.split(/\s+/).filter(Boolean) : [...str]; },
    /** Justified poster: lines of text each scaled so all have the same width; lines slide up from masks with stagger. Returns total height. */
    poster(g, text, cx, cy, width, lt, { lines, height, weight = 800, lineGap = .06, each = .12, dur = .7, fills, family, dir, ease } = {}) {
      const words = text.split(/\s+/).filter(Boolean), H_ = height || (g.canvas.height * .8), nat = s => K.measure(g, s, { size: 100, weight, family, dir }).w; let L = lines ? lines.slice() : words.slice();
      const total = () => L.reduce((a, s) => a + 100 * width / Math.max(nat(s), 1) * (1 + lineGap), 0);
      while (!lines && L.length > 1 && total() > H_) { let best = 0, bw = 1e9; for (let i = 0; i < L.length - 1; i++) { const w = nat(L[i] + ' ' + L[i + 1]); if (w < bw) { bw = w; best = i; } } L.splice(best, 2, L[best] + ' ' + L[best + 1]); }
      const sizes = L.map(s => 100 * width / Math.max(nat(s), 1)); let tot = 0; sizes.forEach(z => (tot += z * (1 + lineGap))); let y = cy - tot / 2; const e = ease || E().outExpo;
      L.forEach((s, i) => { const sz = sizes[i], p = seg(lt - i * each, 0, dur, e), h = sz * .95; y += sz * (1 + lineGap) / 2;
        g.save(); g.beginPath(); g.rect(cx - width / 2 - 40, y - h * .62, width + 80, h * 1.24); g.clip(); K.text(g, s, cx, y + (1 - p) * h * 1.15, { size: sz, weight, family, dir, fill: fills ? fills[i % fills.length] : '#fff', max: width }); g.restore(); y += sz * (1 + lineGap) / 2; });
      return tot;
    },
    stack(g, str, x, y, { n = 3, dy = 1, dx = 0, size = 160, weight = 900, fill = '#fff', outline = fill, phase = 0, alt = true, gap = .86, family, strokeW } = {}) {
      for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2, o = { size, weight, family, align: 'center' }, yy = y + (k + phase * 0) * size * gap * dy, xx = x + (k + phase) * size * gap * dx;
        if (alt && i % 2 === 1) K.text(g, str, xx, yy, { ...o, fill: 'rgba(0,0,0,0)', stroke: outline, strokeW: strokeW || Math.max(2, size * .03) }); else K.text(g, str, xx, yy, { ...o, fill }); }
    },
    outline(g, str, x, y, p, { size = 160, weight = 800, stroke = '#fff', strokeW, fill = '#fff', family, glow } = {}) {
      const sw = strokeW || Math.max(2, size * .035), L = size * 4.2; g.save(); g.lineWidth = sw; g.lineJoin = 'round'; g.lineCap = 'round'; g.setLineDash([L * clamp(p / .72), L * 2]);
      K.text(g, str, x, y, { size, weight, family, fill: 'rgba(0,0,0,0)', stroke, strokeW: sw, glow: glow ? { color: glow, blur: size * .2 } : undefined }); g.restore();
      const f = clamp((p - .62) / .38); if (f > 0) K.text(g, str, x, y, { size, weight, family, fill, alpha: f });
    },
    reveal(g, str, x, y, p, { dir = 'up', size = 160, weight = 800, fill = '#fff', family, pad = .15, ease } = {}) {
      const m = K.measure(g, str, { size, weight, family }), w = m.w, h = size * (1 + pad * 2), e = (ease || E().outExpo)(clamp(p)); g.save(); g.beginPath(); g.rect(x - w / 2 - size * .2, y - h / 2, w + size * .4, h); g.clip();
      const off = (1 - e) * (dir === 'up' || dir === 'down' ? h : w * .6) * (dir === 'up' || dir === 'left' ? 1 : -1); K.text(g, str, x + (dir === 'left' || dir === 'right' ? off : 0), y + (dir === 'up' || dir === 'down' ? off : 0), { size, weight, family, fill }); g.restore();
    },
    slice(g, str, x, y, p, { n = 7, size = 160, weight = 800, fill = '#fff', family, spread = 1.2 } = {}) {
      const m = K.measure(g, str, { size, weight, family }), w = m.w, h = size * 1.1, sh = h / n; for (let i = 0; i < n; i++) { const lag = hash(i, 3) * .35, q = clamp((p - lag) / (1 - .35)), e = 1 - Math.pow(1 - q, 3), sgn = i % 2 ? 1 : -1;
        g.save(); g.beginPath(); g.rect(x - w / 2 - size, y - h / 2 + i * sh, w + size * 2, sh + .5); g.clip(); K.text(g, str, x + sgn * (1 - e) * (w + size) * spread, y, { size, weight, family, fill, alpha: q > 0 ? 1 : 0 }); g.restore(); }
    },
    glitch(g, str, x, y, amt, frame, { size = 160, weight = 800, family, fill = '#fff', colors = ['#ff2a55', '#27f0ff'] } = {}) {
      const a = clamp(amt), f = Math.floor(frame); g.save(); g.globalCompositeOperation = 'lighter';
      [[colors[0], -1], [colors[1], 1]].forEach(([c, s]) => K.text(g, str, x + s * a * size * .05 * (.5 + hash(f, s)), y + (hash(f, 5) - .5) * a * size * .02, { size, weight, family, fill: c, alpha: .8 })); g.restore();
      const m = K.measure(g, str, { size, weight, family }), w = m.w, n = 9, sh = size * 1.1 / n; for (let i = 0; i < n; i++) { const jit = hash(f, i + 11) < a * .6 ? (hash(f, i + 40) - .5) * a * size * .5 : 0; g.save(); g.beginPath(); g.rect(x - w / 2 - size, y - size * .55 + i * sh, w + size * 2, sh + .5); g.clip(); K.text(g, str, x + jit, y, { size, weight, family, fill }); g.restore(); }
    },
    extrude(g, str, x, y, { size = 160, weight = 900, depth = 28, angle = Math.PI * .75, colors = ['#fff', '#7a5cff'], family, steps } = {}) {
      const nStep = steps || Math.max(6, Math.round(depth)); for (let i = nStep; i >= 1; i--) { const d = depth * i / nStep; K.text(g, str, x + Math.cos(angle) * d, y + Math.sin(angle) * d, { size, weight, family, fill: colors[1] }); }
      K.text(g, str, x, y, { size, weight, family, fill: colors[0] });
    },
    marquee(g, str, y, t, { speed = 240, gap = 120, size = 120, weight = 800, fill = '#fff', outline, family, W = g.canvas.width, dir = -1 } = {}) {
      const m = K.measure(g, str, { size, weight, family }), unit = m.w + gap, off = ((t * speed * dir) % unit + unit) % unit; for (let x = -unit + off; x < W + unit; x += unit) K.text(g, str, x + m.w / 2, y, { size, weight, family, fill: outline ? 'rgba(0,0,0,0)' : fill, stroke: outline, align: 'center' });
    },
    weight(g, str, x, y, p, { from = 200, to = 900, size = 160, fill = '#fff', family, ease } = {}) { const e = (ease || E().inOutCubic)(clamp(p)); K.text(g, str, x, y, { size, weight: Math.round(from + (to - from) * e), family, fill }); },
    wave(g, str, x, y, t, { amp = 18, speed = 3, size = 120, weight = 800, fill = '#fff', family, phase = .5 } = {}) {
      const U = Type.units(str), rtl = K.isRTL(str), ws = U.map(u => K.measure(g, u + (rtl ? ' ' : ''), { size, weight, family }).w), total = ws.reduce((a, b) => a + b, 0); let cx = rtl ? x + total / 2 : x - total / 2;
      U.forEach((u, i) => { const w = ws[i], px = rtl ? cx - w / 2 : cx + w / 2; K.text(g, u, px, y + Math.sin(t * speed + i * phase) * amp, { size, weight, family, fill }); cx += rtl ? -w : w; });
    },
    /** Text on a circle (Latin: letters, Arabic script: whole words). ang = rotation in radians (animate it), r = radius to the baseline centre. */
    ring(g, str, cx, cy, r, ang = 0, { size = 60, weight = 700, fill = '#fff', family, gap = .12, outside = true } = {}) {
      const U = Type.units(str), rtl = K.isRTL(str), ws = U.map(u => K.measure(g, u, { size, weight, family }).w + (rtl ? size * .3 : size * gap)), total = ws.reduce((a, b) => a + b, 0); let acc = 0;
      U.forEach((u, i) => { const mid = acc + ws[i] / 2; acc += ws[i]; const aa = ang + (rtl ? -1 : 1) * (mid - total / 2) / r;      // ang = 0 puts the middle of the text at 12 o'clock; positive turns clockwise
        g.save(); g.translate(cx + Math.sin(aa) * r, cy - Math.cos(aa) * r); g.rotate(aa + (outside ? 0 : Math.PI)); K.text(g, u, 0, 0, { size, weight, family, fill, align: 'center' }); g.restore(); });
    },
    /** Odometer: digits roll to `value` (float ok — ease it yourself: value = to * K.E.outExpo(p)). fa: Persian digits · decimals: fixed decimals · pad: reserve width for that many integer digits
        (leading zeros stay invisible, so a counting-up number doesn't jump around). Returns the drawn width. */
    counter(g, value, x, y, { size = 160, weight = 800, fill = '#fff', family, fa = false, decimals = 0, pad = 0, sep = true } = {}) {
      const V = Math.max(0, value) * 10 ** decimals, nInt = String(Math.floor(V + 1e-6)).length, nd = Math.max(nInt, pad + decimals, decimals + 1), cw = K.measure(g, '0', { size, weight, family }).w * 1.04, sw = size * .3, h = size * 1.05, cells = [];
      for (let k = nd - 1; k >= 0; k--) { cells.push({ k }); const j = k - decimals; if (decimals && k === decimals) cells.push({ ch: fa ? '٫' : '.' }); else if (sep && j > 0 && j % 3 === 0) cells.push({ ch: fa ? '٬' : ',' }); }
      const total = cells.reduce((a, c) => a + (c.ch ? sw : cw), 0), smooth = q => q * q * (3 - 2 * q); let xx = x - total / 2;
      g.save(); g.beginPath(); g.rect(x - total / 2 - size * .2, y - h / 2, total + size * .4, h); g.clip();
      for (const c of cells) {
        if (c.ch) { K.text(g, c.ch, xx + sw / 2, y + size * .1, { size: size * .8, weight, family, fill, align: 'center' }); xx += sw; continue; }
        if (c.k < nInt) { const pos = V / 10 ** c.k, d = Math.floor(pos + 1e-9) % 10, fr = pos - Math.floor(pos + 1e-9), e = smooth(Math.max(0, (fr - (c.k === 0 ? .55 : .9)) / (c.k === 0 ? .45 : .1))), t = n => (fa ? K.faDigits(String(n)) : String(n));
          K.text(g, t(d), xx + cw / 2, y - e * h, { size, weight, family, fill, align: 'center' }); if (e > 0) K.text(g, t((d + 1) % 10), xx + cw / 2, y + (1 - e) * h, { size, weight, family, fill, align: 'center' }); }
        xx += cw;
      }
      g.restore(); return total;
    },
    /** Highlighter sweep behind text (skewed bar that grows left→right), then the text on top. p = 0…1 */
    marker(g, str, x, y, p, { size = 120, weight = 800, color = '#ffe14a', ink = '#111', family, skew = .22, pad = .18, ease } = {}) {
      const m = K.measure(g, str, { size, weight, family }), w = m.w * (1 + pad), h = size * .92, e = (ease || E().outExpo)(clamp(p)), x0 = x - w / 2; g.save(); g.fillStyle = color; g.beginPath();
      g.moveTo(x0 + h * skew, y - h / 2); g.lineTo(x0 + w * e + h * skew, y - h / 2); g.lineTo(x0 + w * e, y + h / 2); g.lineTo(x0, y + h / 2); g.closePath(); g.fill(); g.restore(); K.text(g, str, x, y, { size, weight, family, fill: ink });
    },
    /** Letters (Arabic script: words) fly in from random places/rotations/scales and assemble. p = 0…1, seed varies the scatter. */
    assemble(g, str, x, y, p, { size = 150, weight = 800, fill = '#fff', family, seed = 1, spread = 1.4, ease, each = .5 } = {}) {
      const U = Type.units(str), rtl = K.isRTL(str), ws = U.map(u => K.measure(g, u + (rtl ? ' ' : ''), { size, weight, family }).w), total = ws.reduce((a, b) => a + b, 0), e = ease || E().outExpo; let cx = rtl ? x + total / 2 : x - total / 2;
      U.forEach((u, i) => { const w = ws[i], px = rtl ? cx - w / 2 : cx + w / 2, lag = hash(i, seed) * each, q = e(clamp((p - lag * .5) / (1 - each * .5)));
        const ox = (hash(i, seed + 1) - .5) * size * 14 * spread, oy = (hash(i, seed + 2) - .5) * size * 9 * spread, rot = (hash(i, seed + 3) - .5) * 6, sc = 1 + hash(i, seed + 4) * 4;
        if (q > 0) { g.save(); g.globalAlpha *= clamp(q * 2.5); g.translate(px + ox * (1 - q), y + oy * (1 - q)); g.rotate(rot * (1 - q)); g.scale(1 + (sc - 1) * (1 - q), 1 + (sc - 1) * (1 - q)); K.text(g, u, 0, 0, { size, weight, family, fill, align: 'center' }); g.restore(); } cx += rtl ? -w : w; });
    },
    /** Text as a window onto anything: paint(ctx, {x0,x1,y0,y1,size,W,H}) draws whatever shows THROUGH the letters (gradient, noise, a photo, a shader frame via drawImage) — any number of draw calls.
        The word itself is applied last as a mask (destination-in), so the paint can be as complicated as you like. */
    fillWith(g, str, x, y, paint, { size = 200, weight = 900, family, W = g.canvas.width, H = g.canvas.height } = {}) {
      const key = W + 'x' + H; let c = MASKS.get(key); if (!c) { c = K.canvas(W, H, { cpu: true }); MASKS.set(key, c); }
      const k = c.getContext('2d'); k.setTransform(1, 0, 0, 1, 0, 0); k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1; k.clearRect(0, 0, W, H);
      const m = K.measure(k, str, { size, weight, family }); k.save(); paint(k, { x0: x - m.w / 2, x1: x + m.w / 2, y0: y - size * .6, y1: y + size * .6, size, W, H }); k.restore();
      k.globalCompositeOperation = 'destination-in'; K.text(k, str, x, y, { size, weight, family, fill: '#fff' }); k.globalCompositeOperation = 'source-over'; g.drawImage(c, 0, 0);
    },
  };
  const MASKS = new Map();
  window.Type = Type;
})();
