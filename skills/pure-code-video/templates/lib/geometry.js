/* geometry.js — generative geometry for Islamic-style (girih / Hankin) star patterns, rosettes and curves. Classic script → window.G. Needs kit.js.
   The construction is exact: regular tilings + "polygons in contact" (Hankin's method): from the midpoint of every polygon edge two rays leave
   at the contact angle θ; neighbouring rays meet on the vertex bisector; the segments to those meeting points draw the star pattern.
     const pat = G.pattern('hex', 60, { size: 130, cols: 9, rows: 7 });          // kinds: 'square' | 'hex' | 'tri' | 'octsquare'; θ in degrees
     G.draw(g, pat, { cx: W/2, cy: H/2, reveal: t / 4, width: 3, color: '#f5c76b' });  // reveal 0→1 grows the pattern outward from the centre, like a compass drawing it  */
(() => {
  'use strict';
  const G = {}; window.G = G; const { clamp, lerp, TAU } = K;
  const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const ngon = (cx, cy, r, n, a0 = 0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(a0 + i * TAU / n), cy + r * Math.sin(a0 + i * TAU / n)]);
  const rOf = (edge, n) => edge / (2 * Math.sin(Math.PI / n));                                  // circumradius of a regular n-gon with the given edge

  /** Regular tilings, edge length `size`, centred on the origin. Returns polygons (arrays of [x,y]). */
  G.tiling = (kind, { size = 100, cols = 7, rows = 5 } = {}) => {
    const P = [], a = size;
    if (kind === 'square') { for (let j = -rows; j <= rows; j++) for (let i = -cols; i <= cols; i++) P.push(ngon(i * a, j * a, rOf(a, 4), 4, Math.PI / 4)); }
    else if (kind === 'hex') { const w = a * Math.sqrt(3), h = a * 1.5; for (let j = -rows; j <= rows; j++) for (let i = -cols; i <= cols; i++) P.push(ngon(i * w + (j & 1 ? w / 2 : 0), j * h, a, 6, Math.PI / 6)); }
    else if (kind === 'tri') { const h = a * Math.sqrt(3) / 2; for (let j = -rows; j <= rows; j++) for (let i = -cols * 2; i <= cols * 2; i++) { const x = i * a / 2 + (j & 1 ? a / 4 : 0), y = j * h, up = ((i + j) & 1) === 0; P.push(up ? [[x - a / 2, y + h / 2], [x + a / 2, y + h / 2], [x, y - h / 2]] : [[x - a / 2, y - h / 2], [x + a / 2, y - h / 2], [x, y + h / 2]]); } }
    else if (kind === 'octsquare') { const s = a * (1 + Math.SQRT2); for (let j = -rows; j <= rows; j++) for (let i = -cols; i <= cols; i++) { P.push(ngon(i * s, j * s, rOf(a, 8), 8, Math.PI / 8)); P.push(ngon((i + .5) * s, (j + .5) * s, rOf(a, 4), 4, 0)); } }
    else throw new Error('unknown tiling ' + kind);
    return P;
  };

  /** Hankin construction on convex polygons. Returns line segments [x0,y0,x1,y1] (deduplicated per polygon). */
  G.hankin = (polys, angleDeg = 60) => {
    const th = angleDeg * Math.PI / 180, segs = [];
    for (const poly of polys) {
      const n = poly.length, cx = poly.reduce((s, p) => s + p[0], 0) / n, cy = poly.reduce((s, p) => s + p[1], 0) / n, rays = [];
      for (let i = 0; i < n; i++) {
        const a = poly[i], b = poly[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ex = b[0] - a[0], ey = b[1] - a[1], el = Math.hypot(ex, ey) || 1; let nx = -ey / el, ny = ex / el;
        if (nx * (cx - mx) + ny * (cy - my) < 0) { nx = -nx; ny = -ny; }                                                   // inward normal
        const ux = ex / el, uy = ey / el;
        rays.push({ o: [mx, my], toB: [Math.cos(th) * ux + Math.sin(th) * nx, Math.cos(th) * uy + Math.sin(th) * ny], toA: [-Math.cos(th) * ux + Math.sin(th) * nx, -Math.cos(th) * uy + Math.sin(th) * ny] });
      }
      for (let i = 0; i < n; i++) {                                                                                        // ray heading to vertex i+1 meets the next edge's ray heading back to it
        const r1 = rays[i], r2 = rays[(i + 1) % n], d = r1.toB[0] * r2.toA[1] - r1.toB[1] * r2.toA[0]; if (Math.abs(d) < 1e-9) continue;
        const dx = r2.o[0] - r1.o[0], dy = r2.o[1] - r1.o[1], t = (dx * r2.toA[1] - dy * r2.toA[0]) / d, s = (dx * r1.toB[1] - dy * r1.toB[0]) / d; if (t <= 0 || s <= 0) continue;
        const px = r1.o[0] + r1.toB[0] * t, py = r1.o[1] + r1.toB[1] * t; segs.push([r1.o[0], r1.o[1], px, py], [r2.o[0], r2.o[1], px, py]);
      }
    }
    return segs;
  };
  /** Ready-made pattern: {polys, segs, radius}. */
  G.pattern = (kind, angleDeg, opt = {}) => { const polys = G.tiling(kind, opt), segs = G.hankin(polys, angleDeg); return { kind, polys, segs, radius: Math.max(...segs.map(s => Math.hypot((s[0] + s[2]) / 2, (s[1] + s[3]) / 2))) }; };

  /** Draw a pattern. reveal 0→1 grows it outward from the centre (each segment draws itself with a stagger by distance); opts: cx, cy, width, color, glow (0..1), fill (colour per polygon fn(poly,i)), rotate, scale. */
  G.draw = (ctx, pat, { cx = 0, cy = 0, reveal = 1, width = 3, color = '#fff', glow = 0, fill, rotate = 0, scale = 1, softness = .18, ease = K.E.outCubic } = {}) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotate); ctx.scale(scale, scale); const R = pat.radius || 1;
    if (fill) pat.polys.forEach((p, i) => { const d = Math.hypot(...p.reduce((s, q) => [s[0] + q[0] / p.length, s[1] + q[1] / p.length], [0, 0])) / R, k = ease(clamp((reveal * (1 + softness) - d) / softness)); if (k <= 0) return; const c = fill(p, i); if (!c) return; ctx.globalAlpha = k; ctx.fillStyle = c; ctx.beginPath(); p.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); });
    ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.strokeStyle = color; ctx.lineWidth = width / scale;
    ctx.beginPath(); for (const [x0, y0, x1, y1] of pat.segs) { const d = Math.hypot((x0 + x1) / 2, (y0 + y1) / 2) / R, k = ease(clamp((reveal * (1 + softness) - d) / softness)); if (k <= 0) continue; ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); } ctx.stroke();
    if (glow) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .35 * glow; ctx.lineWidth = width * 3 / scale; ctx.stroke(); }
    ctx.restore();
  };

  /** n-fold rotational (+ optional mirror) symmetry of a polyline: returns an array of polylines (mandalas, rosettes, shamsa medallions). */
  G.polar = (pts, n, { mirror = true } = {}) => { const out = []; for (let k = 0; k < n; k++) { const a = k * TAU / n; out.push(pts.map(([x, y]) => rot(x, y, a))); if (mirror) out.push(pts.map(([x, y]) => rot(x, -y, a))); } return out; };
  /** Regular star polygon {n/k} points (k=1 convex, k>1 star: e.g. {8/3}, {10/3}). */
  G.starPolygon = (n, k, r, cx = 0, cy = 0, a0 = -Math.PI / 2) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(a0 + i * k * TAU / n), cy + r * Math.sin(a0 + i * k * TAU / n)]);
  /** Spirograph (hypotrochoid) point at parameter u ∈ [0, turns·2π]. */
  G.spiro = (R, r, d, u) => [(R - r) * Math.cos(u) + d * Math.cos((R - r) / r * u), (R - r) * Math.sin(u) - d * Math.sin((R - r) / r * u)];
  G.lissajous = (a, b, delta, u, A = 1, B = 1) => [A * Math.sin(a * u + delta), B * Math.sin(b * u)];
  /** Flow-field polylines: deterministic streamlines through curl noise (for ink / hair / wind graphics). Returns arrays of points. */
  G.flow = ({ n = 300, steps = 60, step = 6, scale = .0025, seed = 1, w = 1920, h = 1080, z = 0 } = {}) => { const r = K.rng(seed), out = []; for (let i = 0; i < n; i++) { let x = r() * w, y = r() * h; const line = [[x, y]]; for (let s = 0; s < steps; s++) { const [vx, vy] = K.curl(x * scale, y * scale, z); const l = Math.hypot(vx, vy) || 1; x += vx / l * step; y += vy / l * step; line.push([x, y]); } out.push(line); } return out; };
})();
