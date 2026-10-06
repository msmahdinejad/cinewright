/* parts.js — GPU particles with closed-form motion (a pure function of time: deterministic, any frame renders alone). Needs gfx.js.
   Classic script → window.Parts.

   1) MORPH — tens of thousands of particles that flow between shapes (word → logo → sphere), with curl-noise smoke in between, per-particle
      motion blur, depth-of-field bokeh, HDR additive glow:
        const M = new Parts.Morph(gfx, { count: 60000 });
        M.shapes([ Parts.cloud(60000, { w: 1800, h: 900 }), Parts.text('hello', { height: 260 }), Parts.text('سلام', { height: 260, rtl: true }), Parts.mesh(Geo.torusKnot(), { scale: 220 }) ]);
        M.draw({ progress: 1.4 (= 40% of the way from shape 1 to shape 2), t, colors: ['#6a4cff', '#23e7f2'], flow: 220, size: 1.7, glow: .14 }, { to });
   2) EMITTER — bursts, streams and ambient dust: sparks, confetti, embers, snow, fireflies, explosions at cue times:
        const E = new Parts.Emitter(gfx, { count: 30000 });
        E.burst({ t0: 2.0, pos: [0, 0, 0], n: 6000, speed: [200, 1100], drag: 2.4, gravity: [0, -380, 0], life: [.9, 1.8], size: [1.5, 5], colors: ['#fff2c4', '#ff9a3c', '#ff3d3d'] });
        E.stream({ t0: 0, t1: 12, n: 3000, spawn: { box: [1900, 1100, 600] }, speed: [10, 40], life: [4, 7], dir: [0, 1, 0], angle: 1.2, flow: 60, size: [1, 3], colors: ['#ffffff'], loop: true });   // ambient dust (spawn.box = where; dir + angle = which way; no dir = drifts sideways)
        E.draw({ t, cam: { yaw: .2 * Math.sin(t), pitch: .1 } }, { to });
   Coordinates: pixels around the frame centre (x right, y UP, z away from the camera), perspective with `cam.dist` (default 1500).
   Pass cam.vp (a view-projection matrix from Scene3D) and cam.ps to put particles inside a 3D scene (then units are world units).
   Point helpers: Parts.text  Parts.image  Parts.shape('ring'|'circle'|'star'|'grid'|'spiral'|'sphere'|'torus'|'box'|'line')  Parts.mesh(geo)  Parts.cloud */
(() => {
  'use strict';
  const rgb = c => { if (Array.isArray(c) || ArrayBuffer.isView(c)) return Array.from(c); if (typeof c === 'string') { let h = c.replace('#', ''); if (h.length === 3) h = h.replace(/./g, m => m + m); const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; } return [1, 1, 1]; };
  const rng = (seed = 1) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const TW = 2048;   // target texture width (particle i lives at x = i % TW, y = i / TW + shape * rows)

  /* ───────────────────────── point helpers (CPU, run once at load) ───────────────────────── */
  const Parts = {
    /** n points on a text outline/fill. height = px height of the text block. rtl: sort so the "writing" sweep goes right→left. Needs kit.js K.sampleText. */
    text(str, { height = 260, weight = 800, step = 2, n, seed = 1, w = 2400, h = 700, depth = 0, rtl, family } = {}) {
      const pts = K.sampleText(str, { size: 260, weight, w, h, step, family }); if (!pts.length) throw new Error(`Parts.text: no pixels for "${str}" (fonts loaded?)`);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const s = height / (y1 - y0 || 1), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; const out = pts.map(([x, y]) => [(x - cx) * s, -(y - cy) * s, 0]);
      out.rtl = rtl ?? /[؀-ۿ]/.test(str); out.width = (x1 - x0) * s; return out;
    },
    /** points from any 2D drawing/image: draw(g, w, h) paints with alpha; or pass an image/canvas. Returns pixel-space points with .colors (per point rgb 0–1). */
    image(src, { height = 300, step = 3, alpha = 40 } = {}) {
      const iw = src.width || src.naturalWidth, ih = src.height || src.naturalHeight, c = document.createElement('canvas'); c.width = iw; c.height = ih; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0);
      const d = g.getImageData(0, 0, iw, ih).data, pts = [], cols = [], s = height / ih; for (let y = 0; y < ih; y += step) for (let x = 0; x < iw; x += step) { const i = (y * iw + x) * 4; if (d[i + 3] > alpha) { pts.push([(x - iw / 2) * s, -(y - ih / 2) * s, 0]); cols.push([d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]); } }
      pts.colors = cols; return pts;
    },
    /** n random points on the surface of a Geo (area-weighted) — morph into any 3D object. */
    mesh(geo, { scale = 200, n = 40000, seed = 3 } = {}) {
      const R = rng(seed), P = geo.pos, I = geo.idx, tri = I.length / 3, area = new Float32Array(tri); let tot = 0;
      for (let t = 0; t < tri; t++) { const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
        tot += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2; area[t] = tot; }
      const out = []; for (let k = 0; k < n; k++) { let lo = 0, hi = tri - 1; const r = R() * tot; while (lo < hi) { const m = (lo + hi) >> 1; area[m] < r ? lo = m + 1 : hi = m; }
        const a = I[lo * 3] * 3, b = I[lo * 3 + 1] * 3, c = I[lo * 3 + 2] * 3; let u = R(), v = R(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const w = 1 - u - v;
        out.push([(P[a] * w + P[b] * u + P[c] * v) * scale, (P[a + 1] * w + P[b + 1] * u + P[c + 1] * v) * scale, (P[a + 2] * w + P[b + 2] * u + P[c + 2] * v) * scale]); } return out;
    },
    /** parametric shapes in pixels */
    shape(kind, { n = 40000, r = 300, seed = 5, h = 0, thickness = 12 } = {}) {
      const R = rng(seed), out = [];
      for (let i = 0; i < n; i++) { const u = R(), v = R(), a = u * Math.PI * 2;
        switch (kind) {
          case 'circle': { const rr = Math.sqrt(v) * r; out.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]); break; }
          case 'ring': { const rr = r + (v - .5) * thickness * 2; out.push([Math.cos(a) * rr, Math.sin(a) * rr, (R() - .5) * thickness]); break; }
          case 'sphere': { const z = v * 2 - 1, q = Math.sqrt(1 - z * z); out.push([Math.cos(a) * q * r, z * r, Math.sin(a) * q * r]); break; }
          case 'torus': { const b = v * Math.PI * 2, rr = r * .7 + Math.cos(b) * r * .3; out.push([Math.cos(a) * rr, Math.sin(b) * r * .3, Math.sin(a) * rr]); break; }
          case 'box': out.push([(R() - .5) * 2 * r, (R() - .5) * 2 * (h || r), (R() - .5) * 2 * r]); break;
          case 'spiral': { const t = u * 5, rr = t / 5 * r; out.push([Math.cos(t * Math.PI * 2) * rr, Math.sin(t * Math.PI * 2) * rr, (R() - .5) * thickness]); break; }
          case 'star': { const k = 5, t = u * Math.PI * 2, rr = r * (.55 + .45 * Math.cos(k * t)) * Math.sqrt(v); out.push([Math.cos(t) * rr, Math.sin(t) * rr, 0]); break; }
          case 'grid': { const m = Math.ceil(Math.sqrt(n)), gx = i % m, gy = Math.floor(i / m); out.push([(gx / (m - 1) - .5) * r * 2, (gy / (m - 1) - .5) * r * 2, 0]); break; }
          case 'line': out.push([(u - .5) * r * 2, (v - .5) * thickness, (R() - .5) * thickness]); break;
          default: throw new Error('Parts.shape: unknown "' + kind + '"');
        } }
      return out;
    },
    /** a formless starting cloud (gaussian blob). w/h/d = extent in px. */
    cloud(n = 40000, { w = 1800, h = 900, d = 400, seed = 11 } = {}) { const R = rng(seed), out = []; for (let i = 0; i < n; i++) { const a = R() * 6.283, r = Math.sqrt(R()); out.push([Math.cos(a) * r * w * .5, Math.sin(a) * r * h * .5, (R() - .5) * d]); } return out; },
    rng, rgb,
  };

  /* ───────────────────────── shared GLSL ───────────────────────── */
  const COMMON_VS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
layout(location=0) in vec2 aCorner; layout(location=1) in vec4 aR; layout(location=2) in vec4 aR2;
uniform vec2 uRes; uniform float uT, uShutter, uBase, uDof, uFocus; uniform vec4 uCam; uniform mat4 uVP; uniform float uWorld, uPS;
out vec2 vLocal; out float vLen; out float vRad; out vec4 vCol;
const float PI = 3.14159265;
float h13(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y), mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z) * 2. - 1.; }
vec2 curl(vec2 p, float t){ float e = .05; return vec2(vn(vec3(p.x, p.y + e, t)) - vn(vec3(p.x, p.y - e, t)), -(vn(vec3(p.x + e, p.y, t)) - vn(vec3(p.x - e, p.y, t)))) / (2. * e); }
vec3 curl3(vec3 p, float t){ float e = .08; vec3 a = vec3(vn(p + vec3(0, e, 0) + t) - vn(p - vec3(0, e, 0) + t), vn(p + vec3(0, 0, e) + t) - vn(p - vec3(0, 0, e) + t), vn(p + vec3(e, 0, 0) + t) - vn(p - vec3(e, 0, 0) + t)); return a / (2. * e); }
float ease(float x){ x = clamp(x, 0., 1.); return x * x * x * (x * (x * 6. - 15.) + 10.); }
// project a world/pixel position: xy = pixel offset from the frame centre, z = depth scale (perspective factor), w = camera-space depth
vec4 project(vec3 p){
  if (uWorld > .5) { vec4 c = uVP * vec4(p, 1.); vec2 ndc = c.xy / max(c.w, .001); return vec4(ndc * uRes * .5, uPS * uRes.y * .5 / max(c.w, .001), c.w); }
  float cy = cos(uCam.x), sy = sin(uCam.x), cp = cos(uCam.y), sp = sin(uCam.y);
  vec3 q = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z); q = vec3(q.x, cp * q.y - sp * q.z, sp * q.y + cp * q.z);
  float s = uCam.z / (uCam.z + q.z); return vec4(q.xy * s, s, q.z);
}
`;
  const COMMON_FS = `#version 300 es
precision highp float; in vec2 vLocal; in float vLen; in float vRad; in vec4 vCol; out vec4 o; uniform float uSprite;
void main(){ vec2 d = vLocal - vec2(clamp(vLocal.x, 0., vLen), 0.); float r = length(d) / vRad; float m;
  if (uSprite < .5) m = exp(-2.2 * r * r); else if (uSprite < 1.5) m = smoothstep(1., .75, r) * smoothstep(.35, .6, r) * 1.4; else if (uSprite < 2.5) m = smoothstep(1., .9, r); else m = exp(-6. * r * r) + .6 * exp(-14. * abs(d.x) / vRad) * exp(-2. * abs(d.y) / vRad);
  o = vec4(vCol.rgb * m * vCol.a, 1.); }`;
  // turn two projected endpoints into a screen-space capsule quad (motion blur) and set varyings
  const QUAD = `
  vec4 qa = project(PA), qb = project(PB); vec2 dd = qb.xy - qa.xy; float len = length(dd); if (len > 420.) { qa = qb; dd = vec2(0.); len = 0.; }
  vec2 dir = len > .01 ? dd / len : vec2(1., 0.), nrm = vec2(-dir.y, dir.x); float sc = qb.z;
  float base = SIZE * sc * uRes.y / 1080.; float coc = uDof > 0. ? abs(qb.w - uFocus) * uDof * sc * .01 : 0.; float rad = clamp(sqrt(base * base + coc * coc), .8, 60.);
  float energy = (base * base) / (rad * rad) / (1. + len * 1.1 / rad); float ext = rad * 1.3; float along = aCorner.x < 0. ? -ext : len + ext, across = aCorner.y * ext;
  vec2 pix = qa.xy + dir * along + nrm * across; vLocal = vec2(along, across); vLen = len; vRad = rad;
  gl_Position = vec4(pix / (uRes * .5), 0., 1.);`;

  /* ───────────────────────── Morph ───────────────────────── */
  const MORPH_VS = COMMON_VS + `
uniform sampler2D uTgt, uCols; uniform int uN, uRows; uniform float uProg, uFlow, uSpread, uSize, uGlow, uPulse, uMix; uniform vec3 uColA, uColB; uniform vec2 uWob;
vec3 shapePos(int k, int id){ return texelFetch(uTgt, ivec2(id % ${TW}, id / ${TW} + k * uRows), 0).xyz; }
vec3 shapeCol(int k, int id){ return texelFetch(uCols, ivec2(id % ${TW}, id / ${TW} + k * uRows), 0).rgb; }
float stag(float m){ return ease((m - aR.x * uSpread) / max(1. - uSpread, .001)); }
vec3 pos(float t, out float rest){
  int id = gl_InstanceID; float m = clamp(uProg, 0., float(uN - 1)); int i = min(int(floor(m)), uN - 1), j = min(i + 1, uN - 1); float f = m - float(i); float e = stag(f);
  vec3 a = shapePos(i, id), b = shapePos(j, id); vec3 p = mix(a, b, e); float mv = sin(PI * e);
  p.xy += curl(p.xy * .004 + float(i) * 1.3, t * .6) * mv * uFlow; p.z += curl(p.xy * .004 + 9., t * .5).x * mv * uFlow * .6;
  rest = 1. - mv; float cloudW = (i == 0 ? 1. - e : 0.) + (j == 0 ? e : 0.); p.xy += (1. - .6 * rest) * uWob.x * vec2(sin(t * 2.3 + aR.z * 40.), cos(t * 1.9 + aR.x * 30.)) + cloudW * uWob.y * curl(a.xy * .003, t * .22);
  p.z += aR.w * 120. * (1. - .8 * rest) * uWob.x * .0 + 30. * sin(t * .8 + aR.x * 9.) * uWob.x * .2; return p; }
void main(){
  float r0, r1; vec3 a = pos(uT - uShutter * .5, r0), b = pos(uT + uShutter * .5, r1);
  float m = clamp(uProg, 0., float(uN - 1)); int i = min(int(floor(m)), uN - 1), j = min(i + 1, uN - 1); float e = stag(m - float(i));
  vec3 col = mix(uColA, uColB, smoothstep(.15, .85, mix(aR.z, clamp(.5 + a.x / (uRes.x * .8), 0., 1.), .7)));
  if (uMix > .5) col = mix(shapeCol(i, gl_InstanceID), shapeCol(j, gl_InstanceID), e) * 1.2;
  vCol = vec4(col * (uGlow + uPulse * .8) * (1. + 2.4 * (1. - r1) * 0.), 1.);
  vec3 PA = a, PB = b; float SIZE = 1.7 * aR2.x * uSize;
  ${QUAD.replace('vec3 PA', '')}
  vCol.rgb *= energy * (1. + len * .015) * (1. + 1.6 * (1. - r1));
}`;
  class Morph {
    constructor(gfx, { count = 60000, seed = 7 } = {}) {
      this.gfx = gfx; this.gl = gfx.gl; this.count = count; this.n = 0; this.rows = Math.ceil(count / TW); this.prog = gfx.prog(COMMON_FS, { vs: MORPH_VS.replace(/^#version 300 es\n/, '#version 300 es\n'), tag: 'particles morph' });
      const gl = this.gl, R = rng(seed), attr = new Float32Array(count * 8); for (let i = 0; i < count; i++) { attr.set([i / count * .85 + R() * .15, .6 + R() * .9, R(), R() * 2 - 1], i * 8); attr.set([.6 + R() * .9, R(), R(), R()], i * 8 + 4); }
      this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao); const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const ab = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ab); gl.bufferData(gl.ARRAY_BUFFER, attr, gl.STATIC_DRAW); for (let k = 0; k < 2; k++) { gl.enableVertexAttribArray(1 + k); gl.vertexAttribPointer(1 + k, 4, gl.FLOAT, false, 32, k * 16); gl.vertexAttribDivisor(1 + k, 1); } gl.bindVertexArray(null);
      this.tgt = null; this.cols = null;
    }
    /** shapes: array of point arrays ([x,y,z] px). Each is resampled to `count` points and sorted along its writing direction so neighbours stay neighbours (rtl: right→left). */
    shapes(list, { seed = 21 } = {}) {
      const gl = this.gl, N = this.count, rows = this.rows, R = rng(seed); this.n = list.length; const data = new Float32Array(TW * rows * list.length * 4), cdata = new Float32Array(TW * rows * list.length * 4); let anyCol = false;
      list.forEach((pts, k) => { if (!pts.length) throw new Error('Parts.Morph.shapes: shape ' + k + ' has no points');
        const idx = new Uint32Array(N); for (let i = 0; i < N; i++) idx[i] = pts.length >= N ? Math.floor(i * pts.length / N + R() * pts.length / N) % pts.length : Math.floor(R() * pts.length);
        const arr = Array.from(idx); const dir = pts.rtl ? -1 : 1; arr.sort((a, b) => dir * (pts[a][0] - pts[b][0]) || pts[a][1] - pts[b][1]);
        const base = k * rows * TW * 4; for (let i = 0; i < N; i++) { const p = pts[arr[i]], o = base + i * 4; data[o] = p[0]; data[o + 1] = p[1]; data[o + 2] = p[2] || 0; data[o + 3] = 1; if (pts.colors) { const c = pts.colors[arr[i]]; cdata[o] = c[0]; cdata[o + 1] = c[1]; cdata[o + 2] = c[2]; anyCol = true; } else { cdata[o] = cdata[o + 1] = cdata[o + 2] = 1; } } });
      const mk = (d) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TW, rows * list.length, 0, gl.RGBA, gl.FLOAT, d); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return { t }; };
      this.tgt = mk(data); this.cols = mk(cdata); this.hasCols = anyCol; return this;
    }
    /** o: { progress (0…n-1), t, colors:[a,b], flow (px of smoke while moving), size, glow, pulse, spread (0–.9 stagger), shutter (s, default 1/60), dof {focus, amount}, cam {yaw,pitch,dist} | {vp,ps}, wobble [px, drift], sprite 0–3, perColor:bool } */
    draw(o, { to } = {}) {
      const g = this.gfx, gl = this.gl, c = o.cam || {}, col = (o.colors || ['#5a3cff', '#22e8f0']).map(rgb); if (!this.tgt) throw new Error('Parts.Morph: call shapes([...]) first');
      g.bind(to); gl.disable(gl.DEPTH_TEST); g.blend('add'); gl.bindVertexArray(this.vao);
      g.set(this.prog, { uRes: [g.W, g.H], uT: o.t ?? g.t, uShutter: o.shutter ?? 1 / 60, uBase: 1, uDof: o.dof ? o.dof.amount ?? 1 : 0, uFocus: o.dof ? o.dof.focus ?? 0 : 0, uCam: [c.yaw || 0, c.pitch || 0, c.dist || 1500, 0], uVP: c.vp || new Float32Array(16), uWorld: c.vp ? 1 : 0, uPS: c.ps || 1,
        uTgt: this.tgt, uCols: this.cols, uN: this.n, uRows: this.rows, uProg: o.progress ?? 0, uFlow: o.flow ?? 220, uSpread: o.spread ?? .5, uSize: o.size ?? 1, uGlow: o.glow ?? .14, uPulse: o.pulse ?? 0, uMix: (o.perColor ?? this.hasCols) ? 1 : 0, uColA: col[0], uColB: col[1], uWob: o.wobble || [2, 70], uSprite: o.sprite ?? 0 });
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.count); gl.bindVertexArray(null); g.blend('none');
    }
  }

  /* ───────────────────────── Emitter ───────────────────────── */
  const EM_VS = COMMON_VS + `
uniform float uT0, uLife0, uLife1, uDrag, uSp0, uSp1, uS0, uS1, uTime1, uLoop, uFlow, uNum, uSpreadAng, uAlphaFade, uSpawnMode, uBoxOn; uniform vec3 uPos, uGrav, uDir, uBox; uniform vec3 uC0, uC1, uC2; uniform float uGlow;
vec3 dirOf(vec4 r, vec4 r2){ float a = r.y * 6.2831853, z = r2.x * 2. - 1.; vec3 sph = vec3(sqrt(1. - z * z) * cos(a), z, sqrt(1. - z * z) * sin(a));
  if (uSpawnMode > 2.5) return normalize(vec3(cos(a), 0., sin(a)) + .001);
  if (uSpawnMode > 1.5) { vec3 d = normalize(uDir); vec3 u = normalize(abs(d.y) < .99 ? cross(d, vec3(0, 1, 0)) : cross(d, vec3(1, 0, 0))), v = cross(d, u); float cs = mix(1., cos(uSpreadAng), r2.y), sn = sqrt(1. - cs * cs); return normalize(d * cs + (u * cos(a) + v * sin(a)) * sn); }
  return sph; }
vec3 pos(float t, out float age01, out float alive){
  float life = mix(uLife0, uLife1, aR.w); float birth = uT0 + aR.x * max(uTime1 - uT0, 0.); float age = t - birth;
  if (uLoop > .5) { age = mod(age, life); if (t < birth) age = -1.; }
  alive = (age >= 0. && age <= life) ? 1. : 0.; age01 = clamp(age / life, 0., 1.); float a = max(age, 0.);
  vec3 d = dirOf(aR, aR2); float sp = mix(uSp0, uSp1, aR.z); float k = max(uDrag, .001);
  vec3 p0 = uPos; if (uBoxOn > .5) p0 += (vec3(aR2.y, aR2.z, aR2.w) - .5) * uBox;
  vec3 p = p0 + d * sp * (1. - exp(-k * a)) / k + .5 * uGrav * a * a; p += curl3(p * .004 + aR.xyz * 7., t * .3) * uFlow * min(a, 2.) * .5; return p; }
void main(){
  float a01, alive, b01, aliveB; vec3 a = pos(uT - uShutter * .5, a01, alive), b = pos(uT + uShutter * .5, b01, aliveB); float vis = aliveB * alive; if (uLoop > .5) vis = aliveB;
  float s01 = b01; float fade = (1. - smoothstep(.6, 1., s01)) * smoothstep(0., .08, s01);
  vec3 col = s01 < .5 ? mix(uC0, uC1, s01 * 2.) : mix(uC1, uC2, s01 * 2. - 1.);
  vCol = vec4(col * uGlow * fade * vis * (.6 + .8 * aR2.x), 1.); vec3 PA = a, PB = b; float SIZE = mix(uS0, uS1, aR.z) * (1. - .5 * s01) * vis;
  ${QUAD.replace('vec3 PA', '')}
  vCol.rgb *= energy;
}`;
  class Emitter {
    constructor(gfx, { count = 30000, seed = 13 } = {}) {
      this.gfx = gfx; this.gl = gfx.gl; this.count = count; this.items = []; this.used = 0; this.prog = gfx.prog(COMMON_FS, { vs: EM_VS, tag: 'particles emitter' });
      const gl = this.gl, R = rng(seed), attr = new Float32Array(count * 8); for (let i = 0; i < count; i++) attr.set([R(), R(), R(), R(), R(), R(), R(), R()], i * 8);
      this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao); const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const ab = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ab); gl.bufferData(gl.ARRAY_BUFFER, attr, gl.STATIC_DRAW); for (let k = 0; k < 2; k++) { gl.enableVertexAttribArray(1 + k); gl.vertexAttribPointer(1 + k, 4, gl.FLOAT, false, 32, k * 16); gl.vertexAttribDivisor(1 + k, 1); } gl.bindVertexArray(null);
    }
    _add(o, stream) {
      const n = Math.min(o.n ?? 2000, this.count), spawn = o.spawn || {}; const it = { t0: o.t0 ?? 0, t1: stream ? (o.t1 ?? o.t0 + 5) : (o.t0 ?? 0), n, pos: o.pos || [0, 0, 0], speed: o.speed || [200, 800], drag: o.drag ?? 2, grav: o.gravity || [0, 0, 0], life: o.life || [1, 2], size: o.size || [2, 4], colors: (o.colors || ['#ffffff', '#ffd27a', '#ff5a3c']).map(rgb),
        flow: o.flow ?? 0, loop: !!o.loop, glow: o.glow ?? .5, mode: o.ring ? 3 : o.dir ? 2 : spawn.box ? 4 : 1, boxOn: spawn.box ? 1 : 0, dir: o.dir || [0, 1, 0], angle: o.angle ?? .5, box: spawn.box || [0, 0, 0], sprite: o.sprite ?? 0, seedOffset: this.used };
      while (it.colors.length < 3) it.colors.push(it.colors[it.colors.length - 1]); this.items.push(it); return it;
    }
    /** one explosion/burst at time t0 (closed-form flight: velocity decays with drag, gravity pulls, curl noise swirls it) */
    burst(o) { return this._add(o, false); }
    /** continuous emission between t0 and t1 (or a looping ambient field: spawn:{box:[w,h,d]}, loop:true) */
    stream(o) { return this._add(o, true); }
    clear() { this.items.length = 0; }
    draw(o = {}, { to } = {}) {
      const g = this.gfx, gl = this.gl, c = o.cam || {}, t = o.t ?? g.t; g.bind(to); gl.disable(gl.DEPTH_TEST); g.blend('add'); gl.bindVertexArray(this.vao);
      for (const it of this.items) { const maxLife = it.life[1]; if (!it.loop && (t < it.t0 - .05 || t > it.t1 + maxLife + .1)) continue;
        g.set(this.prog, { uRes: [g.W, g.H], uT: t, uShutter: o.shutter ?? 1 / 60, uBase: 1, uDof: o.dof ? o.dof.amount ?? 1 : 0, uFocus: o.dof ? o.dof.focus ?? 0 : 0, uCam: [c.yaw || 0, c.pitch || 0, c.dist || 1500, 0], uVP: c.vp || new Float32Array(16), uWorld: c.vp ? 1 : 0, uPS: c.ps || 1,
          uT0: it.t0, uTime1: it.t1, uLife0: it.life[0], uLife1: it.life[1], uDrag: it.drag, uSp0: it.speed[0], uSp1: it.speed[1], uS0: it.size[0], uS1: it.size[1], uLoop: it.loop ? 1 : 0, uFlow: it.flow, uSpreadAng: it.angle, uSpawnMode: it.mode, uBoxOn: it.boxOn, uPos: it.pos, uGrav: it.grav, uDir: it.dir, uBox: it.box, uC0: it.colors[0], uC1: it.colors[1], uC2: it.colors[2], uGlow: it.glow * (o.glow ?? 1), uSprite: it.sprite });
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, it.n); }
      gl.bindVertexArray(null); g.blend('none');
    }
  }

  Parts.Morph = Morph; Parts.Emitter = Emitter; window.Parts = Parts;
})();
