/* gfx.js — a small WebGL2 toolkit that sits on Post's GL context, so everything it draws lands in Post's HDR scene target
   (bloom, grain, grade … then apply to it). It is the shared foundation of Stage (scenes + transitions), FX (shader looks),
   Scene3D (meshes, materials), Parts (GPU particles).  Classic script → window.GFX.

     const post = new Post(out), gfx = new GFX(post);
     post.begin();                                              // HDR target (Post)
     gfx.pass(gfx.prog(`void main(){ o = vec4(vUv, .5 + .5*sin(uT), 1.); }`), { uT: t });     // full-screen fragment shader into it
     gfx.layer(canvas2d);                                       // alpha-composite a 2D canvas on top
     post.end({ frame, bloom: .6 });

   Fragment shaders are written WITHOUT boilerplate: the header declares `in vec2 vUv; out vec4 o; uniform vec2 uRes; uniform float uT;`
   (uRes = target size, uT = gfx.t). Add  //#use math,noise,color,sdf  to pull in GLSL helper chunks (see GFX.LIB below).
   Uniforms are set by name from an object; the type is read from the program (numbers, arrays, textures/render targets just work).
   Colour space: display values like Post (no linearisation). Premultiplied alpha everywhere. */
(() => {
  'use strict';

  /* ───────────────────────── GLSL helper chunks (//#use name) ───────────────────────── */
  const LIB = {
    math: `
const float PI = 3.14159265359, TAU = 6.28318530718;
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sat(float x){ return clamp(x, 0., 1.); }
float remap(float x, float a, float b, float c, float d){ return c + (x - a) / (b - a) * (d - c); }
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
float ease(float x){ x = clamp(x, 0., 1.); return x * x * x * (x * (x * 6. - 15.) + 10.); }
float eio3(float x){ x = clamp(x, 0., 1.); return x < .5 ? 4. * x * x * x : 1. - pow(-2. * x + 2., 3.) * .5; }
float eout3(float x){ return 1. - pow(1. - clamp(x, 0., 1.), 3.); }
float ein3(float x){ x = clamp(x, 0., 1.); return x * x * x; }
float eoutExpo(float x){ return x >= 1. ? 1. : 1. - pow(2., -10. * clamp(x, 0., 1.)); }
float pulse(float x, float a, float b, float w){ return smoothstep(a - w, a, x) * (1. - smoothstep(b, b + w, x)); }
vec2 aspectUv(vec2 uv, vec2 res){ return (uv - .5) * vec2(res.x / res.y, 1.); }`,
    noise: `
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float hash31(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec3 hash33(vec3 p3){ p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1, 0, 0)), f.x), mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x), mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
vec3 mod289v(vec3 x){ return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute3(vec3 x){ return mod289v(((x * 34.) + 1.) * x); }
float snoise(vec2 v){
  const vec4 C = vec4(.211324865405187, .366025403784439, -.577350269189626, .024390243902439);
  vec2 i = floor(v + dot(v, C.yy)), x0 = v - i + dot(i, C.xx), i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = i - floor(i * (1. / 289.)) * 289.;
  vec3 p = permute3(permute3(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.); m = m * m; m = m * m;
  vec3 x = 2. * fract(p * C.www) - 1., h = abs(x) - .5, ox = floor(x + .5), a0 = x - ox;
  m *= 1.79284291400159 - .85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw; return 130. * dot(m, g); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.3; a *= .5; } return s / .96875; }
float fbm3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * vnoise3(p); p = p * 2.03 + 17.3; a *= .5; } return s / .9375; }
float sfbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++) { s += a * snoise(p); p = p * 2.03 + 17.3; a *= .5; } return s; }
vec2 curl(vec2 p){ float e = .02; return vec2(snoise(p + vec2(0, e)) - snoise(p - vec2(0, e)), -(snoise(p + vec2(e, 0)) - snoise(p - vec2(e, 0)))) / (2. * e); }
vec2 warp(vec2 p, float t, float amt){ return p + amt * vec2(fbm(p + vec2(0., t)) - .5, fbm(p + vec2(5.2, 1.3 - t)) - .5) * 2.; }
float voronoi(vec2 p, out vec2 cell){ vec2 i = floor(p), f = fract(p); float d = 8.; cell = vec2(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), r = g + hash22(i + g) - f; float k = dot(r, r); if (k < d) { d = k; cell = i + g; } } return sqrt(d); }`,
    color: `
vec3 hsv2rgb(vec3 c){ vec3 p = abs(fract(c.xxx + vec3(1., 2. / 3., 1. / 3.)) * 6. - 3.); return c.z * mix(vec3(1.), clamp(p - 1., 0., 1.), c.y); }
vec3 rgb2hsv(vec3 c){ vec4 K = vec4(0., -1. / 3., 2. / 3., -1.), p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g)), q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y); return vec3(abs(q.z + (q.w - q.y) / (6. * d + 1e-10)), d / (q.x + 1e-10), q.x); }
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a + b * cos(6.28318 * (c * t + d)); }
vec3 ramp3(float t, vec3 a, vec3 b, vec3 c){ t = clamp(t, 0., 1.); return t < .5 ? mix(a, b, t * 2.) : mix(b, c, t * 2. - 1.); }
vec3 ramp4(float t, vec3 a, vec3 b, vec3 c, vec3 d){ t = clamp(t, 0., 1.) * 3.; return t < 1. ? mix(a, b, t) : t < 2. ? mix(b, c, t - 1.) : mix(c, d, t - 2.); }
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
float luma(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
vec3 sat3(vec3 c, float s){ return mix(vec3(luma(c)), c, s); }
vec3 srgb2lin(vec3 c){ return pow(max(c, 0.), vec3(2.2)); }
vec3 lin2srgb(vec3 c){ return pow(max(c, 0.), vec3(1. / 2.2)); }`,
    sdf: `
float sdCircle(vec2 p, float r){ return length(p) - r; }
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }
float sdRBox(vec2 p, vec2 b, float r){ return sdBox(p, b - r) - r; }
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
float sdRing(vec2 p, float r, float w){ return abs(length(p) - r) - w; }
float sdHex(vec2 p, float r){ const vec3 k = vec3(-.866025404, .5, .577350269); p = abs(p); p -= 2. * min(dot(k.xy, p), 0.) * k.xy; p -= vec2(clamp(p.x, -k.z * r, k.z * r), r); return length(p) * sign(p.y); }
float sdStar(vec2 p, float r, float n, float m){ float an = 3.141593 / n, en = 3.141593 / m; vec2 acs = vec2(cos(an), sin(an)), ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, p.y), 2. * an) - an; p = length(p) * vec2(cos(bn), abs(sin(bn))); p -= r * acs; p += ecs * clamp(-dot(p, ecs), 0., r * acs.y / ecs.y); return length(p) * sign(p.x); }
float sdSphere(vec3 p, float r){ return length(p) - r; }
float sdBox3(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)) - r; }
float opSmoothUnion(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }`,
  };
  const useRe = /\/\/#use\s+([\w, \t]+)/g;
  function expand(src) {
    const seen = new Set();
    return src.replace(useRe, (m, names) => names.split(/[\s,]+/).filter(Boolean).map(n => { if (!LIB[n]) throw new Error(`gfx: unknown GLSL chunk "${n}" (have: ${Object.keys(LIB).join(', ')})`); if (seen.has(n)) return ''; seen.add(n); return LIB[n]; }).join('\n'));
  }

  const VS_FULL = `#version 300 es
out vec2 vUv; void main(){ vec2 p = vec2(gl_VertexID == 1 ? 3. : -1., gl_VertexID == 2 ? 3. : -1.); vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
  const FS_HEAD = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
in vec2 vUv; out vec4 o; uniform vec2 uRes; uniform float uT;
`;
  const FS_BLIT = `uniform sampler2D uTex; uniform vec4 uMul; uniform vec4 uAdd;
void main(){ o = texture(uTex, vUv) * uMul + uAdd; }`;

  const BLEND = {
    none: null, alpha: [1, 'ONE', 'ONE_MINUS_SRC_ALPHA'], add: [1, 'ONE', 'ONE'], screen: [1, 'ONE', 'ONE_MINUS_SRC_COLOR'], mul: [1, 'DST_COLOR', 'ZERO'],
  };

  class GFX {
    constructor(post) {
      if (!post || !post.gl) throw new Error('GFX needs a Post instance: new GFX(new Post(canvas))');
      const gl = this.gl = post.gl; this.post = post; this.W = post.canvas.width; this.H = post.canvas.height; this.t = 0;
      this.float = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')); gl.getExtension('OES_texture_float_linear');
      this.vao = gl.createVertexArray(); this.progs = new Map(); this.named = new Map(); this._flipUp = true;
      this.blit_ = this.prog(FS_BLIT);
    }
    get scene() { return this.post.scene; }

    /* ───────── programs ───────── */
    /** Compile (cached) a fragment shader body. Boilerplate is added unless the source starts with #version. Optional {vs} for custom vertex shaders. */
    prog(fs, { vs, tag } = {}) {
      const key = (vs || '') + '\u0000' + fs; let P = this.progs.get(key); if (P) return P;
      const gl = this.gl, src = fs.trimStart().startsWith('#version') ? expand(fs) : FS_HEAD + expand(fs), vsrc = vs ? (vs.trimStart().startsWith('#version') ? expand(vs) : '#version 300 es\n' + expand(vs)) : VS_FULL;
      const mk = (t, s, label) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x);
        if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(x) || 'empty log — the WebGL context was lost (GPU process crashed?). Re-render with --gpu off';
          const numbered = s.split('\n').map((l, i) => `${String(i + 1).padStart(3)}| ${l}`).join('\n'); throw new Error(`gfx: ${label} shader${tag ? ' "' + tag + '"' : ''} failed to compile:\n${log}\n${numbered.slice(0, 6000)}`); } return x; };
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vsrc, 'vertex')); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, src, 'fragment')); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('gfx: shader link failed: ' + (gl.getProgramInfoLog(p) || 'empty log (context lost?)'));
      const info = {}; for (let i = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i--;) { const a = gl.getActiveUniform(p, i), n = a.name.replace(/\[0\]$/, ''); info[n] = { loc: gl.getUniformLocation(p, a.name), type: a.type, size: a.size }; }
      P = { p, info, src, gfx: this }; this.progs.set(key, P); return P;
    }
    /** Set uniforms from an object. Textures: pass a GFX texture/render-target (or WebGLTexture) for any sampler2D. */
    set(P, u = {}) {
      const gl = this.gl; gl.useProgram(P.p); let unit = 0; const I = P.info;
      const flat = v => (typeof v === 'number' ? [v] : ArrayBuffer.isView(v) ? v : Array.isArray(v) && Array.isArray(v[0]) ? v.flat() : v);
      for (const k in u) {
        const i = I[k]; if (!i) continue; let v = u[k]; if (v == null) continue;
        switch (i.type) {
          case gl.FLOAT: i.size > 1 ? gl.uniform1fv(i.loc, flat(v)) : gl.uniform1f(i.loc, +v); break;
          case gl.INT: case gl.BOOL: i.size > 1 ? gl.uniform1iv(i.loc, flat(v)) : gl.uniform1i(i.loc, v === true ? 1 : v === false ? 0 : v | 0); break;
          case gl.FLOAT_VEC2: gl.uniform2fv(i.loc, flat(v)); break;
          case gl.FLOAT_VEC3: gl.uniform3fv(i.loc, flat(v)); break;
          case gl.FLOAT_VEC4: gl.uniform4fv(i.loc, flat(v)); break;
          case gl.FLOAT_MAT3: gl.uniformMatrix3fv(i.loc, false, v); break;
          case gl.FLOAT_MAT4: gl.uniformMatrix4fv(i.loc, false, v); break;
          case gl.SAMPLER_2D: case gl.SAMPLER_CUBE: { const tex = v.t || v; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(i.type === gl.SAMPLER_CUBE ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, tex); gl.uniform1i(i.loc, unit++); break; }
          default: break;
        }
      }
    }

    /* ───────── textures and render targets ───────── */
    tex(w, h, { float = false, filter = 'linear', wrap = 'clamp', data = null } = {}) {
      const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      if (float && this.float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      const f = filter === 'nearest' ? gl.NEAREST : gl.LINEAR, wr = wrap === 'repeat' ? gl.REPEAT : wrap === 'mirror' ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
      return { t, w, h };
    }
    /** Render target {t (colour texture), f (framebuffer), w, h, depth?}. float: HDR half-float (default true). depth: false | 'rb' (renderbuffer) | 'tex' (a sampleable depth texture → rt.d). */
    rt(w, h, { float = true, depth = false, filter = 'linear', wrap = 'clamp' } = {}) {
      const gl = this.gl, c = this.tex(w, h, { float, filter, wrap }), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, c.t, 0); const r = { t: c.t, f, w, h, depth: !!depth };
      if (depth === 'tex') { const d = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, d); gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, d, 0); r.d = { t: d, w, h }; }
      else if (depth) { const rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb); r.rb = rb; }
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error(`gfx: render target ${w}×${h} is incomplete (float=${float}, depth=${depth}) — try --gpu off`);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); return r;
    }
    /** A named scratch render target, created on first use (and re-created if the size changes). Use for filter ping-pong. */
    tmp(name, w = this.W, h = this.H, o = {}) {
      let r = this.named.get(name); if (r && (r.w !== w || r.h !== h)) { this.free(r); r = null; }
      if (!r) { r = this.rt(w, h, o); this.named.set(name, r); } return r;
    }
    free(r) { const gl = this.gl; if (!r) return; gl.deleteTexture(r.t); gl.deleteFramebuffer(r.f); if (r.rb) gl.deleteRenderbuffer(r.rb); if (r.d) gl.deleteTexture(r.d.t); }
    /** Upload a 2D canvas / image into a texture (created on first call, pass the returned object back to reuse it). Flipped so uv (0,0) is bottom-left. */
    up(source, tex, { premult = true, filter = 'linear' } = {}) {
      const gl = this.gl; const w = source.width || source.videoWidth, h = source.height || source.videoHeight;
      if (!tex) tex = this.tex(w, h, { filter }); else if (tex.w !== w || tex.h !== h) { tex.w = w; tex.h = h; }
      gl.bindTexture(gl.TEXTURE_2D, tex.t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premult);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); return tex;
    }

    /* ───────── drawing ───────── */
    /** Bind a target: a render target, 'screen' (the canvas) or undefined (Post's HDR scene target, valid after post.begin()). Returns its size. */
    bind(to) {
      const gl = this.gl, T = to === 'screen' ? null : (to || this.post.scene); gl.bindFramebuffer(gl.FRAMEBUFFER, T ? T.f : null);
      const w = T ? T.w : this.W, h = T ? T.h : this.H; gl.viewport(0, 0, w, h); return [w, h];
    }
    clear(color = [0, 0, 0, 0], to, depth = false) { const gl = this.gl; this.bind(to); gl.clearColor(...color); if (depth) { gl.clearDepth(1); gl.depthMask(true); } gl.clear(gl.COLOR_BUFFER_BIT | (depth ? gl.DEPTH_BUFFER_BIT : 0)); }
    blend(mode) {
      const gl = this.gl, b = BLEND[mode]; if (mode === 'max') { gl.enable(gl.BLEND); gl.blendEquation(gl.MAX); gl.blendFunc(gl.ONE, gl.ONE); return; }
      gl.blendEquation(gl.FUNC_ADD); if (!b) { gl.disable(gl.BLEND); return; } gl.enable(gl.BLEND); gl.blendFunc(gl[b[1]], gl[b[2]]);
    }
    /** Run a full-screen fragment program into a target. opts: {to, blend:'none'|'alpha'|'add'|'screen'|'mul'|'max', clear:[r,g,b,a]}. uRes/uT are filled in automatically. */
    pass(P, uniforms = {}, { to, blend = 'none', clear } = {}) {
      const gl = this.gl; const [w, h] = this.bind(to); gl.disable(gl.DEPTH_TEST); if (clear) { gl.clearColor(...clear); gl.clear(gl.COLOR_BUFFER_BIT); }
      this.blend(blend); gl.bindVertexArray(this.vao); this.set(P, { uRes: [w, h], uT: this.t, ...uniforms }); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD);
    }
    /** Copy/composite a texture onto a target. alpha scales everything; mul/add are vec4 colour operations. */
    blit(tex, { to, blend = 'none', alpha = 1, mul, add } = {}) {
      this.pass(this.blit_, { uTex: tex, uMul: mul || [alpha, alpha, alpha, alpha], uAdd: add || [0, 0, 0, 0] }, { to, blend });
    }
    /** Alpha-composite a 2D canvas (UI, captions, logos) onto a target (default: the HDR scene). The texture is cached per canvas. */
    layer(canvas, { to, alpha = 1, blend = 'alpha' } = {}) {
      this._layers = this._layers || new Map(); let tx = this._layers.get(canvas); tx = this.up(canvas, tx); this._layers.set(canvas, tx); this.blit(tx, { to, blend, alpha });
    }
    /** Same as layer() but you already have a texture. */
    time(t) { this.t = t; return this; }
  }

  GFX.LIB = LIB; GFX.expand = expand; GFX.VS_FULL = VS_FULL; GFX.FS_HEAD = FS_HEAD;
  window.GFX = GFX;
})();
