/* scene3d.js — a compact real-time 3D engine for videos (WebGL2, no assets, deterministic). Needs gfx.js (and fx.js for depth of field).
   Classic script → window.Scene3D, Geo, Mat, Env, Cam3, M4.

     const S3 = new Scene3D(gfx, { W, H });                         // ss: 1.5 supersampling by default (clean edges)
     S3.env = Env.studio({ colors: ['#0a0a0c', '#fff4de', '#d6ff1f', '#ff4b2e'] });   // what shiny things reflect (analytic, no textures)
     S3.light(0, { dir: [-.5, .8, .6], color: [1, .95, .9], intensity: 2.5 });
     const knot = S3.mesh(Geo.torusKnot({ p: 2, q: 3, radius: 1.6, tube: .42 }), Mat.chrome());
     const name = S3.mesh(Geo.relief(textCanvas, { w: 9, depth: .6 }), Mat.chrome({ tint: '#ffd27a' }));   // puffy 3D text/logo from any canvas drawing (Persian too)
     S3.floor({ y: -1.6, color: '#0a0a10', reflect: .45 });          // glossy floor with real reflections
     S3.fog = { color: '#07070c', density: .035 };

     // every frame (pure function of t):
     S3.cam.pos = [Math.cos(t * .4) * 7, 1.5, Math.sin(t * .4) * 7]; S3.cam.target = [0, 0, 0];
     knot.rot = [t * .3, t * .5, 0];
     const tex = S3.render({ clear: [0, 0, 0, 1], dof: { focus: 7, range: 1.5, blur: 14 } });   // → texture (HDR). Draw it with gfx.blit(tex) or return it from a Stage `gl` scene.

   Geometry: Geo.box sphere icosphere plane cylinder cone torus torusKnot capsule lathe tube param terrain relief text merge flat   (+ .withBary() for wireframes; Geo.flat = faceted gems / low-poly)
   Materials: Mat.pbr chrome gold copper glass toon clay emissive holo iridescent wire     (colour params accept '#hex' or [r,g,b])
   Environments: Env.studio sunset night softbox space sky gradient custom
   Instancing (cities, forests, particles-as-meshes): S3.instances(geo, mat, [{ pos, scale, rot, color }, …])
   Camera rigs: Cam3.orbit  Cam3.path  Cam3.shake      Projection helper: S3.toScreen([x,y,z]) → [px, py] for pinning 2D text to 3D points. */
(() => {
  'use strict';
  const D2R = Math.PI / 180;
  const rgb = c => { if (Array.isArray(c) || ArrayBuffer.isView(c)) return Array.from(c); if (typeof c === 'string') { let h = c.replace('#', ''); if (h.length === 3) h = h.replace(/./g, m => m + m); const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; } return [1, 1, 1]; };
  const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len: a => Math.hypot(a[0], a[1], a[2]),
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] };

  /* ───────────────────────── matrices (column-major, like GL) ───────────────────────── */
  const M4 = {
    ident: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
    persp(fov, asp, n, f) { const t = 1 / Math.tan(fov * D2R / 2), nf = 1 / (n - f); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]); },
    lookAt(e, c, up) { const z = v3.norm(v3.sub(e, c)); let x = v3.cross(up, z); if (v3.len(x) < 1e-6) x = [1, 0, 0]; x = v3.norm(x); const y = v3.cross(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -v3.dot(x, e), -v3.dot(y, e), -v3.dot(z, e), 1]); },
    trs(p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) { // Euler XYZ (R = Rz·Ry·Rx), then scale, then translate
      const cx = Math.cos(r[0]), sx = Math.sin(r[0]), cy = Math.cos(r[1]), sy = Math.sin(r[1]), cz = Math.cos(r[2]), sz = Math.sin(r[2]);
      const r00 = cz * cy, r01 = cz * sy * sx - sz * cx, r02 = cz * sy * cx + sz * sx, r10 = sz * cy, r11 = sz * sy * sx + cz * cx, r12 = sz * sy * cx - cz * sx, r20 = -sy, r21 = cy * sx, r22 = cy * cx;
      return new Float32Array([r00 * s[0], r10 * s[0], r20 * s[0], 0, r01 * s[1], r11 * s[1], r21 * s[1], 0, r02 * s[2], r12 * s[2], r22 * s[2], 0, p[0], p[1], p[2], 1]);
    },
    inv(m) { const o = new Float32Array(16), a = m; const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6],
        b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; if (!det) return M4.ident(); det = 1 / det;
      o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * det; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * det;
      o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * det; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * det; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
      o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * det; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * det;
      o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * det; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * det; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det; return o; },
    /** inverse-transpose of the upper 3×3 (for normals), as a column-major mat3 */
    normal(m) { const a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10]; const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g; let det = a * A + b * B + c * C; if (!det) det = 1; det = 1 / det;
      return new Float32Array([A * det, B * det, C * det, -(b * i - c * h) * det, (a * i - c * g) * det, -(a * h - b * g) * det, (b * f - c * e) * det, -(a * f - c * d) * det, (a * e - b * d) * det]); },
    xform(m, p) { const x = p[0], y = p[1], z = p[2], w = m[3] * x + m[7] * y + m[11] * z + m[15]; return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w]; },
  };

  /* ───────────────────────── geometry ───────────────────────── */
  const mkGeo = (pos, nor, uv, idx, extra = {}) => ({ pos: Float32Array.from(pos), nor: Float32Array.from(nor), uv: Float32Array.from(uv), idx: Uint32Array.from(idx), ...extra,
    withBary() { return Geo.unindex(this); } });
  const Geo = {
    /** Parametric surface fn(u,v) → [x,y,z], u,v ∈ [0,1]; smooth normals by finite differences (no seams). */
    param(fn, nu = 64, nv = 64, { flip = false } = {}) {
      const pos = [], nor = [], uv = [], idx = [], e = 1e-3;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const u = i / nu, v = j / nv, p = fn(u, v), pu = fn(u + e, v), pu2 = fn(u - e, v), pv = fn(u, v + e), pv2 = fn(u, v - e);
        let n = v3.cross(v3.sub(pu, pu2), v3.sub(pv, pv2)); n = v3.norm(n); if (flip) n = v3.scale(n, -1); pos.push(...p); nor.push(...n); uv.push(u, v);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; flip ? idx.push(a, c, b, b, c, d) : idx.push(a, b, c, b, d, c); }
      return mkGeo(pos, nor, uv, idx);
    },
    sphere(r = 1, seg = 48) { return Geo.param((u, v) => { const a = u * Math.PI * 2, b = v * Math.PI; return [-r * Math.cos(a) * Math.sin(b), r * Math.cos(b), r * Math.sin(a) * Math.sin(b)]; }, seg, Math.max(8, seg >> 1), { flip: true }); },
    torus(R = 1, r = .35, seg = 64, tseg = 28) { return Geo.param((u, v) => { const a = u * Math.PI * 2, b = v * Math.PI * 2; return [(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]; }, seg, tseg); },
    /** curve fn(u) → [x,y,z] swept with a circular section. closed: u wraps (Frenet frame, seamless). */
    tube(curve, { radius = .3, seg = 240, radial = 28, radiusFn } = {}) {
      const h = 1e-3, frame = u => { const p = curve(u), p2 = curve(u + h), p1 = curve(u - h); const t = v3.norm(v3.sub(p2, p1)); const acc = v3.sub(v3.add(p2, p1), v3.scale(p, 2)); let n = v3.sub(acc, v3.scale(t, v3.dot(acc, t)));
        n = v3.len(n) < 1e-9 ? v3.norm(v3.cross(t, Math.abs(t[1]) < .9 ? [0, 1, 0] : [1, 0, 0])) : v3.norm(n); return { p, n, b: v3.cross(t, n) }; };
      return Geo.param((u, v) => { const f = frame(u), a = v * Math.PI * 2, r = radiusFn ? radiusFn(u) : radius, c = Math.cos(a) * r, s = Math.sin(a) * r; return [f.p[0] + f.n[0] * c + f.b[0] * s, f.p[1] + f.n[1] * c + f.b[1] * s, f.p[2] + f.n[2] * c + f.b[2] * s]; }, seg, radial);
    },
    torusKnot({ p = 2, q = 3, radius = 1.5, tube = .38, seg = 320, radial = 30 } = {}) {
      return Geo.tube(u => { const a = u * Math.PI * 2, r = (2 + Math.cos(q * a)) * .5; return [radius * r * Math.cos(p * a), radius * r * Math.sin(p * a), -radius * .5 * Math.sin(q * a)]; }, { radius: tube, seg, radial });
    },
    plane(w = 1, h = 1, sx = 1, sy = 1) { const pos = [], nor = [], uv = [], idx = []; for (let j = 0; j <= sy; j++) for (let i = 0; i <= sx; i++) { pos.push((i / sx - .5) * w, (j / sy - .5) * h, 0); nor.push(0, 0, 1); uv.push(i / sx, j / sy); }
      for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) { const a = j * (sx + 1) + i, b = a + 1, c = a + sx + 1, d = c + 1; idx.push(a, b, c, b, d, c); } return mkGeo(pos, nor, uv, idx); },
    box(w = 1, h = 1, d = 1) { const pos = [], nor = [], uv = [], idx = []; const F = [[[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]], [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]]];
      F.forEach(([n, u, v], f) => { const o = pos.length / 3; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { pos.push((n[0] + u[0] * a + v[0] * b) * w / 2, (n[1] + u[1] * a + v[1] * b) * h / 2, (n[2] + u[2] * a + v[2] * b) * d / 2); nor.push(...n); uv.push(a * .5 + .5, b * .5 + .5); } idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }); return mkGeo(pos, nor, uv, idx); },
    cylinder(rt = 1, rb = 1, h = 2, seg = 48, cap = true) {
      const side = Geo.param((u, v) => { const a = u * Math.PI * 2, r = rb + (rt - rb) * v; return [r * Math.cos(a), (v - .5) * h, r * Math.sin(a)]; }, seg, 1, { flip: true }); if (!cap) return side;
      const parts = [side]; for (const [y, r, s] of [[h / 2, rt, 1], [-h / 2, rb, -1]]) { const pos = [0, y, 0], nor = [0, s, 0], uv = [.5, .5], idx = []; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; pos.push(r * Math.cos(a), y, r * Math.sin(a)); nor.push(0, s, 0); uv.push(.5 + .5 * Math.cos(a), .5 + .5 * Math.sin(a)); if (i < seg) s > 0 ? idx.push(0, i + 2, i + 1) : idx.push(0, i + 1, i + 2); } parts.push(mkGeo(pos, nor, uv, idx)); }
      return Geo.merge(parts); },
    cone(r = 1, h = 2, seg = 48) { return Geo.cylinder(0, r, h, seg, true); },
    capsule(r = .5, len = 1.5, seg = 32) { return Geo.param((u, v) => { const a = u * Math.PI * 2, b = v * Math.PI; const y = Math.cos(b) * r + (v < .5 ? len / 2 : -len / 2); return [-r * Math.cos(a) * Math.sin(b), y, r * Math.sin(a) * Math.sin(b)]; }, seg, seg, { flip: true }); },
    icosphere(r = 1, sub = 2) { const t = (1 + Math.sqrt(5)) / 2; let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v3.norm);
      let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
      for (let s = 0; s < sub; s++) { const cache = new Map(), mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (!cache.has(k)) { V.push(v3.norm(v3.scale(v3.add(V[a], V[b]), .5))); cache.set(k, V.length - 1); } return cache.get(k); }; const nf = []; for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = nf; }
      const pos = [], nor = [], uv = [], idx = []; V.forEach(v => { pos.push(v[0] * r, v[1] * r, v[2] * r); nor.push(...v); uv.push(Math.atan2(v[2], v[0]) / (2 * Math.PI) + .5, Math.asin(v[1]) / Math.PI + .5); }); F.forEach(f => idx.push(...f)); return mkGeo(pos, nor, uv, idx); },
    /** Surface of revolution from a 2D profile [[r,y],…] (vase, bottle, chess piece, lamp). */
    lathe(profile, seg = 48) { const n = profile.length - 1; return Geo.param((u, v) => { const k = Math.max(0, Math.min(n - 1e-6, v * n)), i = Math.floor(k), f = k - i, a = profile[i], b = profile[Math.min(n, i + 1)], r = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, an = u * Math.PI * 2; return [r * Math.cos(an), y, r * Math.sin(an)]; }, seg, Math.max(8, n * 6), { flip: true }); },
    /** height field: heightFn(x, z) → y over w×d. */
    terrain(w = 20, d = 20, nx = 120, nz = 120, heightFn = () => 0) { return Geo.param((u, v) => { const x = (u - .5) * w, z = (v - .5) * d; return [x, heightFn(x, z), z]; }, nx, nz, { flip: true }); },
    /** Bas-relief / "inflated" 3D from any 2D drawing: the alpha of `canvas` (text in any script, logo, shape) becomes a soft raised surface.
        w = world width, depth = thickness, blur = bevel softness in px, mirror = also a back side (closed puffy shape). */
    relief(canvas, { w = 8, depth = .6, blur = 7, seg = 240, mirror = true, curve = .62 } = {}) {
      const cw = canvas.width, ch = canvas.height, tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = ch; const t = tmp.getContext('2d', { willReadFrequently: true }); t.filter = `blur(${blur}px)`; t.drawImage(canvas, 0, 0); t.filter = 'none';
      const A = t.getImageData(0, 0, cw, ch).data, al = (x, y) => A[(Math.min(ch - 1, Math.max(0, y | 0)) * cw + Math.min(cw - 1, Math.max(0, x | 0))) * 4 + 3] / 255;
      const sample = (u, v) => { const x = u * (cw - 1), y = (1 - v) * (ch - 1), x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0; return (al(x0, y0) * (1 - fx) + al(x0 + 1, y0) * fx) * (1 - fy) + (al(x0, y0 + 1) * (1 - fx) + al(x0 + 1, y0 + 1) * fx) * fy; };
      const h = w * ch / cw, sx = seg, sy = Math.max(2, Math.round(seg * ch / cw)), pos = [], nor = [], uv = [], aux = [], idx = [], H = new Float32Array((sx + 1) * (sy + 1));
      for (let j = 0; j <= sy; j++) for (let i = 0; i <= sx; i++) H[j * (sx + 1) + i] = Math.pow(sample(i / sx, j / sy), curve) * depth;
      const hh = (i, j) => H[Math.min(sy, Math.max(0, j)) * (sx + 1) + Math.min(sx, Math.max(0, i))], dx = w / sx, dy = h / sy;
      for (const side of mirror ? [1, -1] : [1]) { const o = pos.length / 3;
        for (let j = 0; j <= sy; j++) for (let i = 0; i <= sx; i++) { const z = hh(i, j) * side, dzx = (hh(i + 1, j) - hh(i - 1, j)) / (2 * dx) * side, dzy = (hh(i, j + 1) - hh(i, j - 1)) / (2 * dy) * side, n = v3.norm([-dzx * side, -dzy * side, side]);
          pos.push((i / sx - .5) * w, (j / sy - .5) * h, z); nor.push(...n); uv.push(i / sx, j / sy); aux.push(sample(i / sx, j / sy)); }
        for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) { const a = o + j * (sx + 1) + i, b = a + 1, c = a + sx + 1, d = c + 1; side > 0 ? idx.push(a, b, c, b, d, c) : idx.push(a, c, b, b, c, d); } }
      return mkGeo(pos, nor, uv, idx, { aux: Float32Array.from(aux), size: [w, h] });
    },
    /** Puffy 3D text/logo geometry (chrome letters, Persian included). Draws `str` with K.text, crops to the ink, and inflates it with relief().
        height = world height of the text block; depth = thickness (fraction of height); size = raster font px; extra opts go to relief(). Needs kit.js (K.text). */
    text(str, { height = 2, depth = .22, size = 420, weight = 800, blur, seg = 300, mirror = true, curve = .62, fill = '#fff', fontOpts = {} } = {}) {
      if (typeof K === 'undefined' || !K.text) throw new Error('Geo.text needs kit.js (K.text)'); const pad = Math.round(size * .12), cw = Math.round(size * Math.max(3, str.length * .8)), ch = Math.round(size * 1.8);
      const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d', { willReadFrequently: true }); K.text(g, str, cw / 2, ch / 2, { size, weight, fill, ...fontOpts });
      const d = g.getImageData(0, 0, cw, ch).data; let x0 = cw, x1 = 0, y0 = ch, y1 = 0; for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 <= x0) throw new Error('Geo.text: nothing was drawn for "' + str + '" (fonts loaded? call after window.ready)'); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(cw - 1, x1 + pad); y1 = Math.min(ch - 1, y1 + pad);
      const w = x1 - x0 + 1, h = y1 - y0 + 1, tight = document.createElement('canvas'); tight.width = w; tight.height = h; tight.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
      const worldW = height * w / h; return Geo.relief(tight, { w: worldW, depth: depth * height, blur: blur ?? Math.max(3, h * .05), seg: Math.min(seg, Math.round(w / 2.5)), mirror, curve });
    },
    merge(list, mats = []) { const pos = [], nor = [], uv = [], idx = []; list.forEach((g, k) => { const o = pos.length / 3, m = mats[k], nm = m ? M4.normal(m) : null;
        for (let i = 0; i < g.pos.length; i += 3) { const p = [g.pos[i], g.pos[i + 1], g.pos[i + 2]], n = [g.nor[i], g.nor[i + 1], g.nor[i + 2]]; pos.push(...(m ? M4.xform(m, p) : p)); nor.push(...(nm ? v3.norm([nm[0] * n[0] + nm[3] * n[1] + nm[6] * n[2], nm[1] * n[0] + nm[4] * n[1] + nm[7] * n[2], nm[2] * n[0] + nm[5] * n[1] + nm[8] * n[2]]) : n)); }
        for (let i = 0; i < g.uv.length; i++) uv.push(g.uv[i]); for (const i of g.idx) idx.push(i + o); }); return mkGeo(pos, nor, uv, idx); },
    /** faceted copy: every triangle gets its own vertices and its own face normal — gems, low-poly, crystals (Geo.flat(Geo.icosphere(1, 1)), Geo.flat(Geo.cone(1, 2, 6))). */
    flat(g) {
      const pos = [], nor = [], uv = [], I = g.idx;
      for (let t = 0; t < I.length; t += 3) { const ix = [I[t], I[t + 1], I[t + 2]], P = ix.map(i => [g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]]); let n = v3.norm(v3.cross(v3.sub(P[1], P[0]), v3.sub(P[2], P[0])));
        const avg = [0, 1, 2].map(k => ix.reduce((a, i) => a + g.nor[i * 3 + k], 0)); if (v3.dot(n, avg) < 0) n = v3.scale(n, -1);          // follow the smooth normals' side, whatever the winding was
        ix.forEach((i, k) => { pos.push(...P[k]); nor.push(...n); uv.push(g.uv[i * 2], g.uv[i * 2 + 1]); }); }
      return mkGeo(pos, nor, uv, Array.from({ length: pos.length / 3 }, (_, i) => i));
    },
    /** unindexed copy with barycentric coordinates (needed by Mat.wire for true triangle wireframes) */
    unindex(g) { const pos = [], nor = [], uv = [], bary = [], aux = [], B = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; for (let t = 0; t < g.idx.length; t += 3) for (let k = 0; k < 3; k++) { const i = g.idx[t + k]; pos.push(g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]); nor.push(g.nor[i * 3], g.nor[i * 3 + 1], g.nor[i * 3 + 2]); uv.push(g.uv[i * 2], g.uv[i * 2 + 1]); bary.push(...B[k]); aux.push(g.aux ? g.aux[i] : 1); }
      return mkGeo(pos, nor, uv, Array.from({ length: pos.length / 3 }, (_, i) => i), { bary: Float32Array.from(bary), aux: Float32Array.from(aux) }); },
  };

  /* ───────────────────────── environments (what shiny things reflect) ─────────────────────────
     Each is GLSL  vec3 env(vec3 d, float r)  with palette uniforms uE0..uE3 (+ uEP.x = amount). r = roughness (0 sharp … 1 fully blurred). */
  const ENV = {
    studio: { c: ['#0b0b0e', '#fff3dc', '#d8ff2a', '#ff4a2a'], desc: 'photo studio: softboxes + strip lights; c0 floor/dark, c1 key light, c2/c3 coloured accents',
      glsl: `float band(float x, float c, float w){ return exp(-pow(abs((x - c) / w), 4.)); }
vec3 env(vec3 d, float r){ float s = 1. + r * 3.5, en = 1. / (1. + r * 2.6); vec3 base = mix(uE0 * .55, uE0 * 1.6, d.y * .5 + .5);
  float key = band(d.x, -.42, .27 * s) * smoothstep(-.55, -.2, d.y) * (1. - smoothstep(.68, .96, d.y));
  float top = band(d.y, .76, .15 * s) * (.55 + .45 * d.z); float strip = band(d.x, .32, .04 * s) * band(d.y, .06, .8);
  float a1 = band(d.x, .72, .1 * s) * band(d.y, -.06, .66), a2 = band(d.y, -.64, .06 * s) * band(d.x, -.24, .56), back = smoothstep(.2, 1., -d.z);
  vec3 c = base + en * (uE1 * (key * 1.05 + top * .78 + strip * 1.1) + uE2 * a1 * 1. + uE3 * a2 * .6) + vec3(.14, .17, .15) * back * en;
  return mix(c, vec3(luma(c)), r * .35) * uEP.x; }` },
    softbox: { c: ['#101014', '#ffffff', '#ffd9b0', '#9ec7ff'], desc: 'clean product shot: big white top light, soft gradient; c0 dark, c1 light, c2/c3 warm/cool fill',
      glsl: `vec3 env(vec3 d, float r){ float s = 1. + r * 2.5, en = 1. / (1. + r * 2.2); vec3 c = mix(uE0 * .8, uE0 * 2., smoothstep(-.4, .9, d.y)); float top = smoothstep(.5 - .12 * (s - 1.), .8, d.y) * (1. - smoothstep(.97, 1.01, d.y)); float side = exp(-pow((d.x + .55) / (.32 * s), 2.)) * exp(-pow((d.y - .1) / (.55 * s), 2.));
  float rimL = exp(-pow((d.x - .8) / (.12 * s), 2.)) * exp(-pow(d.y / (.7 * s), 2.));
  c += en * (uE1 * (top * 1.5 + side * .8) + uE2 * rimL * .7) + uE3 * smoothstep(.3, -.9, d.y) * .2; return c * uEP.x; }` },
    sunset: { c: ['#0d0a14', '#ff6a2c', '#b43a8f', '#1a2a6c'], desc: 'sunset sky; c0 ground, c1 horizon glow, c2 mid sky, c3 zenith',
      glsl: `vec3 env(vec3 d, float r){ float h = d.y; vec3 sky = h > 0. ? mix(uE1, mix(uE2, uE3, smoothstep(.1, .9, h)), smoothstep(-.02, .4, h)) : mix(uE1 * .5, uE0, smoothstep(0., -.4, h));
  vec3 sun = normalize(vec3(.35, .09, -.93)); float sd = max(dot(d, sun), 0.); float disc = pow(sd, 900. / (1. + r * 60.)) * 6., glow = pow(sd, 6. / (1. + r * 2.)) * .9; return (sky + vec3(1., .85, .6) * (disc + glow)) * uEP.x; }` },
    night: { c: ['#04040a', '#ff2d95', '#18e0ff', '#7b3bff'], desc: 'night city neon: dark with magenta/cyan strips; c1/c2/c3 neon colours',
      glsl: `vec3 env(vec3 d, float r){ float s = 1. + r * 3., en = 1. / (1. + r * 2.4); vec3 c = uE0 * (1. + 2. * smoothstep(-.2, .6, d.y)); c += uE1 * exp(-pow((d.y - .25) / (.05 * s), 2.)) * (.5 + .5 * smoothstep(-.3, .8, d.x)) * 1.6; c += uE2 * exp(-pow((d.x + .7) / (.08 * s), 2.)) * exp(-pow(d.y / (.8 * s), 2.)) * 1.4;
  c += uE3 * exp(-pow((d.y + .35) / (.07 * s), 2.)) * exp(-pow(d.z / (.8 * s), 2.)) * 1.2; c = uE0 * (1. + 2. * smoothstep(-.2, .6, d.y)) + (c - uE0 * (1. + 2. * smoothstep(-.2, .6, d.y))) * en; float win = step(.985 + .01 * r, hash31(floor(d * 60.))) * smoothstep(-.2, .1, d.y) * (1. - r); return (c + win * uE2 * .6) * uEP.x; }` },
    space: { c: ['#02020a', '#7a5cff', '#ff7ac8', '#ffe2a8'], desc: 'deep space: stars, nebula, a bright planet glow; c1/c2 nebula, c3 star-planet',
      glsl: `vec3 env(vec3 d, float r){ float n = fbm3(d * 2.2 + 3.), n2 = fbm3(d * 5. + 8.); vec3 c = uE0 + mix(uE1, uE2, n2) * pow(n, 3.) * 1.8; float st = step(.994 + .005 * r, hash31(floor(d * 220.))) * (1. - r); c += vec3(.9, .95, 1.) * st;
  vec3 p = normalize(vec3(-.5, .35, .8)); c += uE3 * (pow(max(dot(d, p), 0.), 40. / (1. + r * 12.)) * 2.5 + pow(max(dot(d, p), 0.), 4.) * .25); return c * uEP.x; }` },
    sky: { c: ['#5a5f66', '#9ec9ff', '#e8f3ff', '#fff2cc'], desc: 'bright daylight; c0 ground, c1 zenith, c2 horizon, c3 sun',
      glsl: `vec3 env(vec3 d, float r){ float h = d.y; vec3 c = h > 0. ? mix(uE2, uE1, pow(h, .6)) : mix(uE2 * .9, uE0, smoothstep(0., -.3, h)); vec3 sun = normalize(vec3(-.4, .55, .5)); float sd = max(dot(d, sun), 0.); c += uE3 * (pow(sd, 700. / (1. + r * 60.)) * 8. + pow(sd, 8. / (1. + r * 2.)) * .35); return c * uEP.x; }` },
    gradient: { c: ['#0a0a12', '#3b4cff', '#ff5ca8', '#ffe29a'], desc: 'smooth 4-stop vertical gradient, plus a soft key light; abstract & colourful',
      glsl: `vec3 env(vec3 d, float r){ float t = clamp(d.y * .5 + .5, 0., 1.); vec3 c = ramp4(t, uE0, uE1, uE2, uE3); c += uE3 * exp(-pow((d.x + .5) / (.4 + r), 2.)) * exp(-pow((d.y - .3) / (.4 + r), 2.)) * .8 / (1. + r * 1.5); return c * uEP.x; }` },
  };
  const Env = {};
  for (const k of Object.keys(ENV)) Env[k] = (o = {}) => ({ name: k, glsl: ENV[k].glsl, colors: (o.colors || ENV[k].c).map(rgb), amt: o.amount ?? 1 });
  Env.custom = (glsl, colors = ['#000', '#fff', '#888', '#444'], amount = 1) => ({ name: 'custom:' + glsl.length, glsl, colors: colors.map(rgb), amt: amount });
  Env.info = Object.fromEntries(Object.entries(ENV).map(([k, v]) => [k, { colors: v.c, desc: v.desc }]));

  /* ───────────────────────── materials ───────────────────────── */
  const TYPE = { pbr: 0, glass: 1, toon: 2, unlit: 3, holo: 4, irid: 5, wire: 6, clay: 7 };
  const mat = (type, o) => ({ type, base: rgb(o.base ?? o.tint ?? '#ffffff'), metal: o.metal ?? 0, rough: o.rough ?? .5, emis: rgb(o.emissive ?? '#000000'), coat: o.coat ?? 0, alpha: o.alpha ?? 1, ior: o.ior ?? 1.45, absorb: rgb(o.absorb ?? '#000000'),
    rim: rgb(o.rim ?? '#ffffff'), win: o.windows ? { on: o.windows.on ?? .35, size: o.windows.size || [.28, .42], color: rgb(o.windows.color ?? '#ffd9a0'), seed: o.windows.seed ?? 0 } : null, rimPow: o.rimPow ?? 3, rimAmt: o.rimAmt ?? 0, map: o.map || null, blend: o.blend || 'none', disp: o.dispersion ?? .02, thick: o.thickness ?? 1, bands: o.bands ?? 3, line: o.line ?? 1.2, twoSided: o.twoSided ?? false, specAmt: o.spec ?? 1 });
  const Mat = {
    pbr: (o = {}) => mat(TYPE.pbr, o),
    chrome: (o = {}) => mat(TYPE.pbr, { metal: 1, rough: .04, ...o }),
    gold: (o = {}) => mat(TYPE.pbr, { metal: 1, rough: .16, base: '#ffc65c', ...o }),
    copper: (o = {}) => mat(TYPE.pbr, { metal: 1, rough: .22, base: '#f08a5d', ...o }),
    silver: (o = {}) => mat(TYPE.pbr, { metal: 1, rough: .1, base: '#e8eaf2', ...o }),
    plastic: (o = {}) => mat(TYPE.pbr, { metal: 0, rough: .28, coat: .6, ...o }),
    /** refractive glass: needs something behind it (other meshes / sky) — it bends the scene rendered so far. thickness 0.3–3, absorb tints thick parts. */
    glass: (o = {}) => { const c = rgb(o.color ?? '#ffffff'), d = o.density ?? 1; return mat(TYPE.glass, { rough: .02, ior: 1.5, absorb: o.absorb ?? c.map(v => -Math.log(Math.max(.01, v)) * d / 6), base: '#ffffff', ...o }); },
    toon: (o = {}) => mat(TYPE.toon, { rimAmt: .5, rim: '#ffffff', ...o }),
    clay: (o = {}) => mat(TYPE.clay, { rough: .8, ...o }),
    emissive: (color = '#ffffff', intensity = 1.5, o = {}) => mat(TYPE.unlit, { emissive: rgb(color).map(v => v * intensity), ...o }),
    holo: (o = {}) => mat(TYPE.holo, { base: '#0a3a4a', rim: '#6ef3ff', rimPow: 2.2, rimAmt: 1.6, blend: 'add', alpha: .85, ...o }),
    iridescent: (o = {}) => mat(TYPE.irid, { metal: .7, rough: .08, ...o }),
    wire: (o = {}) => mat(TYPE.wire, { base: '#0a0d12', rim: '#9dffd9', line: 1.3, ...o }),
  };

  /* ───────────────────────── shaders ───────────────────────── */
  const VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec2 aUv; layout(location=3) in vec4 aI0; layout(location=4) in vec4 aI1; layout(location=5) in vec4 aI2; layout(location=6) in vec4 aI3; layout(location=7) in vec4 aCol;
layout(location=8) in float aAux; layout(location=9) in vec3 aBary;
uniform mat4 uVP, uModel; uniform mat3 uNM; uniform float uInst, uMirror, uFloorY; uniform vec4 uTint;
out vec3 vPos, vNor, vBary; out vec2 vUv; out vec4 vCol; out float vAux;
void main(){
  mat4 M = uInst > .5 ? mat4(aI0, aI1, aI2, aI3) : uModel; vec4 wp = M * vec4(aPos, 1.); vec3 n;
  if (uInst > .5) { vec3 s2 = vec3(dot(M[0].xyz, M[0].xyz), dot(M[1].xyz, M[1].xyz), dot(M[2].xyz, M[2].xyz)); n = mat3(M) * (aNor / max(s2, vec3(1e-6))); } else n = uNM * aNor;
  if (uMirror > .5) { wp.y = 2. * uFloorY - wp.y; n.y = -n.y; }
  vPos = wp.xyz; vNor = n; vUv = aUv; vCol = (uInst > .5 ? aCol : vec4(1.)) * uTint; vAux = aAux; vBary = aBary; gl_Position = uVP * wp; }`;

  const FS_HEAD = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
//#use math,noise,color
in vec3 vPos, vNor, vBary; in vec2 vUv; in vec4 vCol; in float vAux; out vec4 o;
uniform vec3 uCam; uniform vec3 uLDir[3], uLCol[3]; uniform vec3 uE0, uE1, uE2, uE3; uniform vec4 uEP; uniform vec2 uRes; uniform float uT, uMirror, uFloorY;
uniform int uMat; uniform vec3 uBase, uEmis, uAbsorb, uRim, uWC; uniform vec4 uP, uP2, uQ, uW; uniform vec4 uFog; uniform vec3 uFogCol; uniform sampler2D uMap, uBg; uniform mat3 uViewM;
`;
  const FS_BODY = `
vec3 fogIt(vec3 c, float d, float y){ float f = 1. - exp(-pow(d * uFog.x, 2.)); f = max(f, 1. - exp(-max(uFog.w - y, 0.) * uFog.y * (d > 0. ? 1. : 0.))); f = clamp(f, 0., 1.) * step(1e-5, uFog.x + uFog.y); return mix(c, uFogCol, f); }
void main(){
  if (uMirror > .5 && vPos.y > uFloorY + .001) discard; if (vAux < .03) discard;
  vec3 N = normalize(vNor); bool backF = !gl_FrontFacing; if (uMirror > .5) backF = !backF; if (backF) N = -N; vec3 V = normalize(uCam - vPos); float NV = max(dot(N, V), 0.);
  float metal = uP.x, rough = clamp(uP.y, .02, 1.), coat = uP.z, alpha = uP.w; vec4 mp = uP2.x > .5 ? texture(uMap, vUv) : vec4(1.);
  vec3 base = srgb2lin(uBase * vCol.rgb * mp.rgb); vec3 col = vec3(0.); float outA = 1.;
  if (uMat == 3) { col = uEmis * vCol.rgb * mp.rgb * (.5 + .5 * NV); }
  else if (uMat == 6) { vec3 d = fwidth(vBary); vec3 a = smoothstep(vec3(0.), d * uP2.z, vBary); float edge = 1. - min(min(a.x, a.y), a.z); vec3 fill = base * (.3 + .7 * NV); col = mix(fill, srgb2lin(uRim) * 1.6, edge); }
  else if (uMat == 1) {
    vec3 nv = uViewM * N; float thick = (.25 + .75 * (1. - NV)) * uP2.w; vec2 suv = gl_FragCoord.xy / uRes; float eta = (uP2.y - 1.) * .09 * thick;
    vec3 bg; bg.r = texture(uBg, suv + nv.xy * eta * (1. + uP2.z)).r; bg.g = texture(uBg, suv + nv.xy * eta).g; bg.b = texture(uBg, suv + nv.xy * eta * (1. - uP2.z)).b;
    vec3 tint = exp(-uAbsorb * thick * 6.); vec3 R = reflect(-V, N); float F = .04 + .96 * pow(1. - NV, 5.); vec3 refl = env(R, rough);
    col = srgb2lin(bg) * tint * (1. - F) + refl * F * 1.2;
    for (int i = 0; i < 3; i++) { vec3 L = normalize(uLDir[i]); vec3 H = normalize(L + V); col += uLCol[i] * pow(max(dot(N, H), 0.), 220. / (rough * 6. + .2)) * .9; }
  } else {
    vec3 F0 = mix(vec3(.04), base, metal); vec3 R = reflect(-V, N); vec3 fres = F0 + (max(vec3(1. - rough), F0) - F0) * pow(1. - NV, 5.); float spA = uQ.x;
    if (uMat == 2) { float bands = max(uP2.y, 2.); vec3 L0 = normalize(uLDir[0]); float nl = max(dot(N, L0), 0.); float q = floor(nl * bands + .5) / bands; col = base * (.22 + q * 1.1) * uLCol[0] * .6 + base * .18; float rim = pow(1. - NV, uQ.z); col += srgb2lin(uRim) * rim * uQ.y * smoothstep(.2, .9, nl + .3); }
    else if (uMat == 7) { vec3 L0 = normalize(uLDir[0]); float w = .55; float nl = (dot(N, L0) + w) / (1. + w); nl = max(nl, 0.); col = base * (env(N, 1.) * .65 + uLCol[0] * nl * .7) + base * pow(1. - NV, 2.) * .12 + env(R, rough) * fres * .3; }
    else if (uMat == 4) { float fr = pow(1. - NV, uQ.z); float scan = .75 + .25 * sin(vPos.y * 90. + uT * 3.); col = (base * .25 + srgb2lin(uRim) * fr * uQ.y * .55) * scan * alpha; outA = alpha * clamp(.25 + fr * 1.4, 0., 1.); }
    else if (uMat == 5) { float ph = NV * 3.2 + dot(N, vec3(.3, .5, .2)); vec3 irid = .5 + .5 * cos(6.28318 * (ph + vec3(0., .33, .67))); vec3 e = env(R, rough); col = e * mix(vec3(1.), irid * 1.6, .85) * mix(vec3(1.), base, .35) + base * (1. - metal) * env(N, 1.) * .3; }
    else { vec3 diff = base * (1. - metal) * env(N, 1.) * .9; vec3 spec = env(R, rough) * fres * spA; if (coat > 0.) { float Fc = .04 + .96 * pow(1. - NV, 5.); spec += env(R, .05) * Fc * coat; diff *= 1. - Fc * coat; }
      col = diff + spec; for (int i = 0; i < 3; i++) { vec3 L = normalize(uLDir[i]); float NL = max(dot(N, L), 0.); vec3 H = normalize(L + V); float NH = max(dot(N, H), 0.); float a = rough * rough, a2 = a * a, dd = NH * NH * (a2 - 1.) + 1., D = a2 / (3.14159 * dd * dd + 1e-4);
        vec3 Fl = F0 + (1. - F0) * pow(1. - max(dot(H, V), 0.), 5.); col += uLCol[i] * (base * (1. - metal) * NL / 3.14159 + D * Fl * .25 * NL * spA); } }
    if (uW.x > 0. && uMat != 4) { vec3 an = abs(N); float side = 1. - smoothstep(.2, .5, an.y); vec2 q = an.x > an.z ? vPos.zy : vPos.xy; vec2 cs = max(uW.yz, vec2(.01)); vec2 cell = floor(q / cs), f = fract(q / cs); float win = smoothstep(.12, .2, f.x) * smoothstep(.88, .8, f.x) * smoothstep(.16, .24, f.y) * smoothstep(.86, .78, f.y); float fl = floor(vPos.x * .31 + vPos.z * .17 + vCol.r * 13.);
      float on = step(1. - uW.x, hash21(cell + vec2(fl, uW.w) * 1.7)); float flick = .75 + .5 * hash21(cell + 9.3); col += srgb2lin(uWC) * win * on * side * flick * 1.4; }
    if (uMat != 4 && uMat != 3) { col += uEmis; if (uQ.y > 0. && uMat != 2) col += srgb2lin(uRim) * pow(1. - NV, uQ.z) * uQ.y; }
  }
  col = fogIt(col, length(uCam - vPos), vPos.y);
  o = vec4(lin2srgb(col), outA);
}`;
  const SKY_FS = `#version 300 es
precision highp float; precision highp int; in vec2 vUv; out vec4 o; uniform vec2 uRes; uniform float uT;
//#use math,noise,color
uniform mat4 uInvVP; uniform vec3 uCam; uniform vec3 uE0, uE1, uE2, uE3; uniform vec4 uEP; uniform vec4 uSky; uniform vec3 uFogCol; uniform vec4 uFog; uniform float uFlip;
ENVFN
void main(){ vec4 p = uInvVP * vec4(vUv * 2. - 1., 1., 1.); vec3 d = normalize(p.xyz / p.w - uCam); if (uFlip > .5) d.y = -d.y; vec3 c = uSky.x < 0. ? uFogCol : lin2srgb(env(d, uSky.y) * uSky.x); o = vec4(c, 1.); }`;
  const GROUND_FS = `#version 300 es
precision highp float; precision highp int; in vec2 vUv; out vec4 o; uniform vec2 uRes; uniform float uT;
//#use math,noise,color
uniform mat4 uInvVP; uniform vec3 uCam; uniform float uY; uniform vec4 uG; uniform vec3 uGC; uniform sampler2D uRefl; uniform mat4 uVP; uniform vec3 uFogCol; uniform vec4 uFog;
void main(){ vec4 p = uInvVP * vec4(vUv * 2. - 1., 1., 1.); vec3 far = p.xyz / p.w, d = normalize(far - uCam); float tt = (uY - uCam.y) / d.y; if (d.y * (uY - uCam.y) <= 0. || tt <= 0.) discard; vec3 w = uCam + d * tt; if (uG.w > .5 && uG.w < 1.5) { o = vec4(1., 0., 1., 1.); return; } if (uG.w > 1.5) { o = vec4(texture(uRefl, vUv).rgb, 1.); return; }
  vec4 cl = uVP * vec4(w, 1.); float depth = cl.z / cl.w * .5 + .5; gl_FragDepth = depth; float dist = length(w - uCam), fade = exp(-pow(dist * uG.z, 2.)); float F = .04 + .96 * pow(1. - abs(d.y), 5.);
  vec3 refl = uG.x > .001 ? texture(uRefl, vUv).rgb : vec3(0.); vec3 c = mix(uGC, refl, clamp(uG.x * (.35 + .65 * F + .35), 0., 1.) * fade); c *= 1. - .0 * dist; float a = uG.y;
  c = mix(c, uFogCol, (1. - exp(-pow(dist * uFog.x, 2.))) * step(1e-5, uFog.x)); o = vec4(c * 1., a * fade + (1. - fade) * a * .0); o.rgb *= o.a; }`;
  const DOWN_FS = `uniform sampler2D uSrc; uniform vec2 uTexel;
void main(){ vec4 c = texture(uSrc, vUv + uTexel * vec2(-.5, -.5)) + texture(uSrc, vUv + uTexel * vec2(.5, -.5)) + texture(uSrc, vUv + uTexel * vec2(-.5, .5)) + texture(uSrc, vUv + uTexel * vec2(.5, .5)); o = c * .25; }`;
  const REFL_COMPOSITE = `uniform sampler2D uSrc; void main(){ o = texture(uSrc, vUv); }`;

  /* ───────────────────────── the engine ───────────────────────── */
  class Scene3D {
    constructor(gfx, { W, H, ss = 1.5 } = {}) {
      this.id = (Scene3D._n = (Scene3D._n || 0) + 1); this.gfx = gfx; this.gl = gfx.gl; this.W = W || gfx.W; this.H = H || gfx.H; this.ss = ss; this.w = Math.round(this.W * ss); this.h = Math.round(this.H * ss);
      this.cam = { pos: [0, 0, 8], target: [0, 0, 0], up: [0, 1, 0], fov: 35, near: .1, far: 120 }; this.env = Env.studio();
      this.lights = [{ dir: [-.5, .8, .6], color: [1, .95, .9], intensity: 2.2 }, { dir: [.7, .3, .5], color: [.55, .7, 1], intensity: .7 }, { dir: [0, -.4, -1], color: [1, .6, .5], intensity: .5 }];
      this.fog = null; this.sky = { amt: 1, rough: .25 }; this._floor = null; this.objects = []; this.rt = null; this.out = null; this.bgRT = null; this.rflRT = null; this._geo = new Map(); this._tex = new Map(); this.progs = new Map();
    }
    light(i, o) { const L = this.lights[i] || (this.lights[i] = {}); Object.assign(L, o); if (o.color) L.color = rgb(o.color); return this; }
    floor(o = null) { this._floor = o ? { y: o.y ?? -1.5, color: rgb(o.color ?? '#0a0a10'), reflect: o.reflect ?? .4, alpha: o.alpha ?? 1, fade: o.fade ?? .02, debug: o.debug || false } : null; return this; }
    mesh(geo, material = Mat.pbr(), o = {}) { const m = { geo, mat: material, pos: o.pos || [0, 0, 0], rot: o.rot || [0, 0, 0], scale: o.scale || [1, 1, 1], tint: o.tint || [1, 1, 1, 1], visible: true, inst: null }; this.objects.push(m); return m; }
    /** many copies of one geometry in one draw call: list of { pos, scale (number|[x,y,z]), rot (number = Y | [x,y,z]), color } */
    instances(geo, material, list, o = {}) {
      const gl = this.gl, n = list.length, data = new Float32Array(n * 20);
      list.forEach((it, i) => { const sc = typeof it.scale === 'number' ? [it.scale, it.scale, it.scale] : it.scale || [1, 1, 1], r = typeof it.rot === 'number' ? [0, it.rot, 0] : it.rot || [0, 0, 0], m = M4.trs(it.pos || [0, 0, 0], r, sc), c = it.color ? rgb(it.color) : [1, 1, 1];
        data.set(m, i * 20); data.set([c[0], c[1], c[2], it.color && it.color.length > 3 ? it.color[3] : 1], i * 20 + 16); });
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const m = { geo, mat: material, pos: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1], tint: [1, 1, 1, 1], visible: true, inst: { buf, n } }; this.objects.push(m); return m;
    }
    remove(obj) { const i = this.objects.indexOf(obj); if (i >= 0) this.objects.splice(i, 1); }
    /** upload a canvas/image as a texture usable as Mat map */
    tex(source) { return this.gfx.up(source); }
    toScreen(p) { const vp = this._matrices().vp, c = M4.xform(vp, p);        // always from the CURRENT camera (set cam.pos/target first, then project)
      return [(c[0] * .5 + .5) * this.W, (1 - (c[1] * .5 + .5)) * this.H]; }

    _matrices() {
      const c = this.cam, view = M4.lookAt(c.pos, c.target, c.up), proj = M4.persp(c.fov, this.W / this.H, c.near, c.far), vp = M4.mul(proj, view);
      this._vp = vp; return { view, proj, vp, inv: M4.inv(vp) };
    }
    _buffers(geo) {
      let G = this._geo.get(geo); if (G) return G; const gl = this.gl, mk = (arr, loc, size) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); return b; };
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao); mk(geo.pos, 0, 3); mk(geo.nor, 1, 3); mk(geo.uv, 2, 2); if (geo.aux) mk(geo.aux, 8, 1); if (geo.bary) mk(geo.bary, 9, 3);
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW); gl.bindVertexArray(null);
      G = { vao, n: geo.idx.length, hasAux: !!geo.aux, hasBary: !!geo.bary }; this._geo.set(geo, G); return G;
    }
    _prog() { const key = this.env.name + '|' + this.env.glsl.length; let P = this.progs.get(key);
      if (!P) { const fs = FS_HEAD + this.env.glsl + FS_BODY; P = { mesh: this.gfx.prog(fs, { vs: VS, tag: '3d ' + this.env.name }), sky: this.gfx.prog(SKY_FS.replace('ENVFN', this.env.glsl), { tag: 'sky' }) }; this.progs.set(key, P); } return P; }
    _targets() {
      const g = this.gfx, sh = g._s3 || (g._s3 = {}), key = this.w + 'x' + this.h;      // scratch targets are shared by every Scene3D of this size (they are only used inside render())
      if (sh.key !== key) { sh.key = key; sh.rt = g.rt(this.w, this.h, { depth: 'tex' }); sh.bgRT = g.rt(this.w, this.h); sh.rflRT = null; }
      if (this._floor && this._floor.reflect > 0 && !sh.rflRT) sh.rflRT = g.rt(this.w, this.h, { depth: 'rb' });
      this.rt = sh.rt; this.bgRT = sh.bgRT; this.rflRT = sh.rflRT; if (!this.out) this.out = g.rt(this.W, this.H, { depth: false });
    }
    _drawObj(P, o, m, light, mirror) {
      const gl = this.gl, G = this._buffers(o.geo), mt = o.mat, g = this.gfx; if (!o.visible) return; const E = this.env, c = this.cam, Mx = o.inst ? M4.ident() : M4.trs(o.pos, o.rot, typeof o.scale === 'number' ? [o.scale, o.scale, o.scale] : o.scale);
      const u = { uVP: m.vp, uModel: Mx, uNM: o.inst ? new Float32Array(9) : M4.normal(Mx), uInst: o.inst ? 1 : 0, uMirror: mirror ? 1 : 0, uFloorY: this._floor ? this._floor.y : 0, uTint: o.tint.length === 4 ? o.tint : [...o.tint, 1],
        uCam: c.pos, uLDir: light.dir, uLCol: light.col, uE0: E.colors[0], uE1: E.colors[1], uE2: E.colors[2], uE3: E.colors[3], uEP: [E.amt, 0, 0, 0], uT: g.t, uRes: [this.w, this.h], uMat: mt.type, uBase: mt.base, uEmis: mt.emis, uAbsorb: mt.absorb, uRim: mt.rim,
        uP: [mt.metal, mt.rough, mt.coat, mt.alpha], uP2: [mt.map ? 1 : 0, mt.type === 1 ? mt.ior : mt.bands, mt.type === 1 ? mt.disp : mt.line, mt.thick], uQ: [mt.specAmt, mt.rimAmt, mt.rimPow, 0], uW: mt.win ? [mt.win.on, mt.win.size[0], mt.win.size[1], mt.win.seed] : [0, 1, 1, 0], uWC: mt.win ? mt.win.color : [1, 1, 1], uFog: this._fogU, uFogCol: this._fogC, uViewM: m.viewM };
      u.uMap = mt.map || (this.dummy || (this.dummy = g.tex(1, 1))); u.uBg = mt.type === 1 ? this.bgRT : this.dummy; g.set(P, u);
      gl.bindVertexArray(G.vao);
      if (!G.hasAux) { gl.disableVertexAttribArray(8); gl.vertexAttrib1f(8, 1); } if (!G.hasBary) { gl.disableVertexAttribArray(9); gl.vertexAttrib3f(9, 1, 1, 1); }
      if (o.inst) { gl.bindBuffer(gl.ARRAY_BUFFER, o.inst.buf); for (let i = 0; i < 4; i++) { gl.enableVertexAttribArray(3 + i); gl.vertexAttribPointer(3 + i, 4, gl.FLOAT, false, 80, i * 16); gl.vertexAttribDivisor(3 + i, 1); } gl.enableVertexAttribArray(7); gl.vertexAttribPointer(7, 4, gl.FLOAT, false, 80, 64); gl.vertexAttribDivisor(7, 1); gl.drawElementsInstanced(gl.TRIANGLES, G.n, gl.UNSIGNED_INT, 0, o.inst.n); for (let i = 3; i <= 7; i++) { gl.vertexAttribDivisor(i, 0); gl.disableVertexAttribArray(i); } }
      else { for (let i = 3; i <= 6; i++) { gl.disableVertexAttribArray(i); gl.vertexAttrib4f(i, 0, 0, 0, 0); } gl.disableVertexAttribArray(7); gl.vertexAttrib4f(7, 1, 1, 1, 1); gl.drawElements(gl.TRIANGLES, G.n, gl.UNSIGNED_INT, 0); }
      gl.bindVertexArray(null);
    }
    _scene(P, m, light, rt, opts, mirror) {
      const gl = this.gl, g = this.gfx; g.bind(rt); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.CULL_FACE);
      const opaque = this.objects.filter(o => o.mat.type !== 1 && o.mat.blend === 'none'), glass = this.objects.filter(o => o.mat.type === 1), blended = this.objects.filter(o => o.mat.type !== 1 && o.mat.blend !== 'none');
      for (const o of opaque) this._drawObj(P, o, m, light, mirror);
      if (glass.length && !mirror) { g.blit(rt, { to: this.bgRT }); g.bind(rt); gl.enable(gl.DEPTH_TEST); for (const o of glass) this._drawObj(P, o, m, light, false); }
      if (blended.length) { gl.depthMask(false); gl.enable(gl.CULL_FACE); gl.cullFace(mirror ? gl.FRONT : gl.BACK); for (const o of blended) { g.blend(o.mat.blend === 'add' ? 'add' : 'alpha'); this._drawObj(P, o, m, light, mirror); } gl.disable(gl.CULL_FACE); g.blend('none'); gl.depthMask(true); }
      gl.disable(gl.DEPTH_TEST);
    }
    /** Render the scene. opts: { clear:[r,g,b,a] (default: draw sky/env as background), dof:{focus,range,blur}, to: rt }. Returns the colour texture to composite. */
    render(opts = {}) {
      const g = this.gfx, gl = this.gl, fx = opts.fx || this.fx || (this.fx = new FX(g)); this._targets(); const m = this._matrices(); m.viewM = (() => { const v = M4.lookAt(this.cam.pos, this.cam.target, this.cam.up); return new Float32Array([v[0], v[1], v[2], v[4], v[5], v[6], v[8], v[9], v[10]]); })();
      const P = this._prog(), E = this.env, f = this.fog; this._fogU = f ? [f.density ?? 0, f.hDensity ?? 0, 0, f.hRef ?? 0] : [0, 0, 0, 0]; this._fogC = f ? rgb(f.color ?? '#000000').map(v => Math.pow(v, 2.2)) : [0, 0, 0];
      const light = { dir: this.lights.slice(0, 3).map(l => v3.norm(l.dir || [0, 1, 0])).flat(), col: this.lights.slice(0, 3).map(l => { const c = rgb(l.color || [1, 1, 1]), k = l.intensity ?? 1; return [c[0] * k, c[1] * k, c[2] * k]; }).flat() };
      while (light.dir.length < 9) light.dir.push(0, 1, 0); while (light.col.length < 9) light.col.push(0, 0, 0);
      // background: clear colour or the environment as a backdrop
      g.bind(this.rt); gl.disable(gl.DEPTH_TEST); gl.clearColor(...(opts.clear || [0, 0, 0, 1])); gl.clearDepth(1); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!opts.clear && this.sky !== false) { g.pass(P.sky, { uInvVP: m.inv, uCam: this.cam.pos, uE0: E.colors[0], uE1: E.colors[1], uE2: E.colors[2], uE3: E.colors[3], uEP: [E.amt, 0, 0, 0], uSky: [this.sky.amt ?? 1, this.sky.rough ?? .25, 0, 0], uFogCol: this._fogC, uFog: this._fogU }, { to: this.rt }); }
      const fl = this._floor;
      if (fl && fl.reflect > 0) { g.bind(this.rflRT); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (!opts.clear && this.sky !== false) g.pass(P.sky, { uInvVP: m.inv, uCam: this.cam.pos, uFlip: 1, uE0: E.colors[0], uE1: E.colors[1], uE2: E.colors[2], uE3: E.colors[3], uEP: [E.amt, 0, 0, 0], uSky: [this.sky.amt ?? 1, (this.sky.rough ?? .25) + .15, 0, 0], uFogCol: this._fogC, uFog: this._fogU }, { to: this.rflRT });
        this._scene(P.mesh, m, light, this.rflRT, opts, true); }
      if (fl) { const G = g.prog(GROUND_FS, { tag: 'ground' }); g.bind(this.rt); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); g.blend('alpha');
        g.pass(G, { uInvVP: m.inv, uVP: m.vp, uCam: this.cam.pos, uY: fl.y, uG: [fl.reflect, fl.alpha, fl.fade, fl.debug === 2 ? 2 : fl.debug ? 1 : 0], uGC: fl.color, uRefl: fl.reflect > 0 ? this.rflRT : this.rt, uFogCol: this._fogC.map(v => Math.pow(v, 1 / 2.2)), uFog: this._fogU }, { to: this.rt, blend: 'alpha' }); g.blend('none'); gl.disable(gl.DEPTH_TEST); }
      this._scene(P.mesh, m, light, this.rt, opts, false);
      // resolve supersampling → W×H
      const down = g.prog(DOWN_FS, { tag: 'down' }); g.pass(down, { uSrc: this.rt, uTexel: [.5 / this.w * this.ss, .5 / this.h * this.ss] }, { to: this.out }); let tex = this.out;
      if (opts.dof) { const t2 = g.tmp('s3dof' + this.id, this.W, this.H); fx.dof(this.out, this.rt.d, { near: this.cam.near, far: this.cam.far, ...opts.dof }, { to: t2 }); tex = t2; }
      return opts.to ? (g.blit(tex, { to: opts.to }), opts.to) : tex;
    }
  }

  /* ───────────────────────── camera rigs ───────────────────────── */
  const Cam3 = {
    /** orbit around `center`: returns { pos, target } — assign to S3.cam */
    orbit(t, { center = [0, 0, 0], radius = 8, speed = .25, elev = .25, phase = 0, height = 0, wobble = 0 } = {}) {
      const a = phase + t * speed, e = elev + wobble * Math.sin(t * .7); return { pos: [center[0] + Math.cos(a) * Math.cos(e) * radius, center[1] + height + Math.sin(e) * radius, center[2] + Math.sin(a) * Math.cos(e) * radius], target: center };
    },
    /** Catmull-Rom through points at u ∈ [0,1] (open path). Use for fly-throughs: pos = Cam3.path(P, u), target = Cam3.path(P, u + .03). */
    path(pts, u) { const n = pts.length - 1, x = Math.min(Math.max(u, 0), 1) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i, p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)], f2 = f * f, f3 = f2 * f;
      return [0, 1, 2].map(k => .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f3)); },
    /** deterministic hand-held shake offsets (add to cam.pos and target) */
    shake(t, amp = .05, freq = 9) { const h = (x, s) => Math.sin(x * freq * 1.7 + s) * .5 + Math.sin(x * freq * 2.9 + s * 2.3) * .3 + Math.sin(x * freq * .7 + s * .4) * .2; return [h(t, 1.3) * amp, h(t, 4.1) * amp, h(t, 7.7) * amp]; },
  };

  window.Scene3D = Scene3D; window.Geo = Geo; window.Mat = Mat; window.Env = Env; window.Cam3 = Cam3; window.M4 = M4;
})();
