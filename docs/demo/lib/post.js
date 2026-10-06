/* post.js — WebGL2 post-processing for canvas videos: bloom, anamorphic streaks, chromatic aberration, glitch,
   shockwave, zoom blur, colour grade, vignette, film grain, dither, flash/fade. Classic script → window.Post.

   const out  = document.getElementById('out');            // <canvas> that render.mjs captures (gets the WebGL2 context)
   const post = new Post(out);                              // once
   post.render(sceneCanvas, { frame, bloom: .6, ca: .003, grain: .05, vignette: .5 });   // every frame, at the end of renderFrame(t)

   Purity: pass `frame` (integer frame index, e.g. Math.round(t*fps)) so grain/glitch are a pure function of time.
   Colour space: works on the sRGB canvas directly (like most motion-graphics tools) — thresholds are in display values. */
(() => {
  'use strict';
  const VS = `#version 300 es
  out vec2 vUv; void main(){ vec2 p = vec2(gl_VertexID == 1 ? 3. : -1., gl_VertexID == 2 ? 3. : -1.); vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

  const DOWN = `#version 300 es
  precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uSrc; uniform vec2 uTexel; uniform vec2 uThr; uniform int uFirst;
  vec3 pf(vec3 c){ if (uFirst == 0) return c; float b = max(c.r, max(c.g, c.b)); float k = max(uThr.y, 1e-3);
    float s = clamp(b - uThr.x + k, 0., 2. * k); s = s * s / (4. * k); float w = max(s, b - uThr.x) / max(b, 1e-4); return c * w; }
  vec3 T(vec2 d){ return pf(texture(uSrc, vUv + uTexel * d).rgb); }
  void main(){
    vec3 a = T(vec2(-2,2)), b = T(vec2(0,2)), c = T(vec2(2,2)), d = T(vec2(-2,0)), e = T(vec2(0,0)), f = T(vec2(2,0)), g = T(vec2(-2,-2)), h = T(vec2(0,-2)), i = T(vec2(2,-2));
    vec3 j = T(vec2(-1,1)), k = T(vec2(1,1)), l = T(vec2(-1,-1)), m = T(vec2(1,-1));
    vec3 r = e * .125 + (a + c + g + i) * .03125 + (b + d + f + h) * .0625 + (j + k + l + m) * .125;
    o = vec4(r, 1.); }`;

  const UP = `#version 300 es
  precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uSrc; uniform vec2 uTexel;
  void main(){
    vec3 s = texture(uSrc, vUv + uTexel * vec2(-1, 1)).rgb + texture(uSrc, vUv + uTexel * vec2(1, 1)).rgb + texture(uSrc, vUv + uTexel * vec2(-1, -1)).rgb + texture(uSrc, vUv + uTexel * vec2(1, -1)).rgb
      + 2. * (texture(uSrc, vUv + uTexel * vec2(0, 1)).rgb + texture(uSrc, vUv + uTexel * vec2(0, -1)).rgb + texture(uSrc, vUv + uTexel * vec2(-1, 0)).rgb + texture(uSrc, vUv + uTexel * vec2(1, 0)).rgb)
      + 4. * texture(uSrc, vUv).rgb;
    o = vec4(s / 16., 1.); }`;

  const COMP = `#version 300 es
  precision highp float; in vec2 vUv; out vec4 o;
  uniform sampler2D uSrc, uBloom, uWide; uniform vec2 uRes;
  uniform float uFrame, uBloomAmt, uStreak, uCA, uGrain, uVig, uVigSoft, uGlitch, uZoomBlur, uScan, uSat, uContrast, uExposure, uFade, uShoulder, uWarp, uDither, uPix;
  uniform vec3 uTint, uLift, uFlash, uFadeCol, uBloomTint; uniform vec2 uCenter; uniform vec4 uShock[4]; uniform float uShockW;
  float h1(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  vec3 samp(vec2 uv){ return texture(uSrc, uv).rgb; }
  void main(){
    vec2 uv = vUv; float asp = uRes.x / uRes.y;
    if (uPix > 1.) { vec2 g = uRes / uPix; uv = (floor(uv * g) + .5) / g; }
    if (uWarp != 0.) { vec2 d = uv - .5; d.x *= asp; uv = .5 + (d * (1. + uWarp * dot(d, d))) * vec2(1. / asp, 1.); }
    for (int i = 0; i < 4; i++) { vec4 s = uShock[i]; if (s.w > 0.) { vec2 d = uv - s.xy; d.x *= asp; float r = length(d); float ring = exp(-pow((r - s.z) / max(uShockW, 1e-4), 2.));
        uv -= normalize(d + 1e-6) * ring * s.w * .05 * vec2(1. / asp, 1.); } }
    if (uGlitch > 0.) { float band = floor(uv.y * 36.); float r = h1(vec2(band, uFrame)); if (r < uGlitch * .6) uv.x += (h1(vec2(band, uFrame + 7.)) - .5) * .18 * uGlitch; }
    vec2 cc = uv - uCenter; float r2 = dot(cc * vec2(asp, 1.), cc * vec2(asp, 1.));
    vec2 off = cc * uCA * (.35 + r2 * 2.) ;
    vec3 c;
    if (uZoomBlur > 0.) { vec3 acc = vec3(0.); for (int i = 0; i < 12; i++) { float k = float(i) / 11.; vec2 u2 = uCenter + cc * (1. - uZoomBlur * k * .25); acc += vec3(samp(u2 + off).r, samp(u2).g, samp(u2 - off).b); } c = acc / 12.; }
    else c = vec3(samp(uv + off).r, samp(uv).g, samp(uv - off).b);
    vec3 bl = texture(uBloom, uv).rgb;
    c += bl * uBloomAmt * uBloomTint;
    if (uStreak > 0.) { vec3 s = vec3(0.); float wsum = 0.; for (int i = -10; i <= 10; i++) { float w = exp(-float(i * i) / 40.); s += texture(uWide, uv + vec2(float(i) * .012, 0.)).rgb * w; wsum += w; } c += s / wsum * uStreak * vec3(.75, .85, 1.); }
    c *= uExposure;
    c = (c - .5) * uContrast + .5;
    float l = dot(c, vec3(.2126, .7152, .0722)); c = mix(vec3(l), c, uSat);
    c = c * uTint + uLift * (1. - c);
    if (uShoulder > 0.) c = c / (1. + max(c - .82, 0.) * uShoulder);
    if (uScan > 0.) c *= 1. - uScan * (.5 + .5 * sin(uv.y * uRes.y * 3.14159));
    c *= 1. - uVig * smoothstep(.25, .25 + uVigSoft + .6, sqrt(r2) * 1.25);
    c += uFlash;
    c = mix(c, uFadeCol, uFade);
    float lum = dot(c, vec3(.299, .587, .114));
    float n = h1(gl_FragCoord.xy + uFrame * vec2(17.13, 31.7)) + h1(gl_FragCoord.xy * 1.37 + uFrame * vec2(53.1, 11.9)) - 1.;
    c += n * uGrain * (.35 + .65 * (1. - lum) * (1. - lum * .5));
    c += (h1(gl_FragCoord.xy + 91.7) - .5) * uDither / 255.;
    o = vec4(clamp(c, 0., 1.), 1.); }`;

  const OVERLAY = `#version 300 es
  precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform float uA;
  void main(){ o = texture(uTex, vUv) * uA; }`;

  const DEFAULTS = { frame: 0, bloom: .5, threshold: .62, knee: .4, streak: 0, ca: .0025, grain: .045, vignette: .38, vignetteSoft: .25, glitch: 0, zoomBlur: 0, scan: 0, sat: 1, contrast: 1, exposure: 1, fade: 0,
    shoulder: .5, warp: 0, dither: 1.4, pixelate: 0, tint: [1, 1, 1], lift: [0, 0, 0], flash: [0, 0, 0], fadeColor: [0, 0, 0], bloomTint: [1, 1, 1], center: [.5, .5], shock: [], shockWidth: .05 };

  class Post {
    constructor(canvas, opts = {}) {
      const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL2 is not available. Render with --gpu off (SwiftShader) or use a GPU-enabled Chrome.');
      this.gl = gl; this.canvas = canvas; this.levels = opts.levels || 6;
      const ext = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');
      this.float = !!ext; gl.getExtension('OES_texture_float_linear');
      this.prog = { down: this.#prog(DOWN), up: this.#prog(UP), comp: this.#prog(COMP), overlay: this.#prog(OVERLAY) }; this.scene = null; this.ovTex = null;
      this.vao = gl.createVertexArray();
      this.src = this.#tex(gl.RGBA8, 4, 4, false);
      this.chain = []; this.w = 0; this.h = 0;
      this.#resize(canvas.width, canvas.height);
    }
    #prog(fs) {
      const gl = this.gl, mk = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x) || 'shader compile failed with an empty log — the WebGL context was lost (GPU process crashed?). Re-render with --gpu off'); return x; };
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'shader link failed with an empty log — the WebGL context was lost (GPU process crashed?). Re-render with --gpu off');
      const u = {}; for (let i = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i--;) { const a = gl.getActiveUniform(p, i), n = a.name.replace(/\[0\]$/, ''); u[n] = gl.getUniformLocation(p, a.name); }
      return { p, u };
    }
    #tex(fmt, w, h, linear = true) {
      const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      if (fmt === gl.RGBA16F) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      return t;
    }
    #resize(w, h) {
      const gl = this.gl; this.w = w; this.h = h;
      for (const l of this.chain) { gl.deleteTexture(l.t); gl.deleteFramebuffer(l.f); }
      this.chain = []; let cw = w, ch = h; const fmt = this.float ? gl.RGBA16F : gl.RGBA8;
      for (let i = 0; i < this.levels; i++) {
        cw = Math.max(2, cw >> 1); ch = Math.max(2, ch >> 1);
        const t = this.#tex(fmt, cw, ch), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        this.chain.push({ t, f, w: cw, h: ch });
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    #set(P, o) {
      const gl = this.gl; gl.useProgram(P.p);
      for (const k in o) { const loc = P.u[k]; if (loc == null) continue; const v = o[k];
        if (typeof v === 'number') gl.uniform1f(loc, v); else if (v.length === 2) gl.uniform2fv(loc, v); else if (v.length === 3) gl.uniform3fv(loc, v); else if (v.length === 4) gl.uniform4fv(loc, v); }
    }
    #bind(unit, tex) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); }
    /** Draw `source` (a canvas / image / video) through the effect stack onto this.canvas. */
    render(source, o = {}) {
      const gl = this.gl, W = this.canvas.width, H = this.canvas.height;
      if (W !== this.w || H !== this.h) this.#resize(W, H);
      gl.disable(gl.BLEND); gl.bindVertexArray(this.vao);
      gl.bindTexture(gl.TEXTURE_2D, this.src); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      this.#run(this.src, o);
    }
    /** WebGL scenes: post.begin() → draw with post.gl into the HDR target → (optional) post.overlay(canvas2d) → post.end(opts). */
    begin(clear = [0, 0, 0, 1]) {
      const gl = this.gl, W = this.canvas.width, H = this.canvas.height;
      if (W !== this.w || H !== this.h) this.#resize(W, H);
      if (!this.scene || this.scene.w !== W || this.scene.h !== H) {
        if (this.scene) { gl.deleteTexture(this.scene.t); gl.deleteFramebuffer(this.scene.f); }
        const t = this.#tex(this.float ? gl.RGBA16F : gl.RGBA8, W, H), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); this.scene = { t, f, w: W, h: H };
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene.f); gl.viewport(0, 0, W, H); gl.clearColor(...clear); gl.clear(gl.COLOR_BUFFER_BIT); return this.scene;
    }
    /** Alpha-blend a 2D canvas (captions, UI, logos) over the HDR scene target. */
    overlay(canvas, alpha = 1) {
      const gl = this.gl; if (!this.ovTex) this.ovTex = this.#tex(gl.RGBA8, 4, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene.f); gl.viewport(0, 0, this.scene.w, this.scene.h); gl.bindVertexArray(this.vao);
      gl.bindTexture(gl.TEXTURE_2D, this.ovTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); this.#set(this.prog.overlay, { uA: alpha }); this.#bind(0, this.ovTex); gl.uniform1i(this.prog.overlay.u.uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disable(gl.BLEND);
    }
    end(o = {}) { this.#run(this.scene.t, o); }
    #run(srcTex, o) {
      const gl = this.gl, P = { ...DEFAULTS, ...o }, W = this.canvas.width, H = this.canvas.height;
      gl.disable(gl.BLEND); gl.bindVertexArray(this.vao);
      const doBloom = P.bloom > 0 || P.streak > 0;
      if (doBloom) {
        let prev = { t: srcTex, w: W, h: H };
        this.chain.forEach((l, i) => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, l.f); gl.viewport(0, 0, l.w, l.h); this.#bind(0, prev.t);
          this.#set(this.prog.down, { uSrc: 0, uTexel: [1 / prev.w, 1 / prev.h], uThr: [P.threshold, P.knee] }); gl.uniform1i(this.prog.down.u.uFirst, i === 0 ? 1 : 0); gl.uniform1i(this.prog.down.u.uSrc, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 3); prev = l;
        });
        // the wide texture for streaks is level 2 (before it is blurred further); tent-upsample the rest back into level 0
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        for (let i = this.chain.length - 1; i > 0; i--) {
          const s = this.chain[i], d = this.chain[i - 1];
          gl.bindFramebuffer(gl.FRAMEBUFFER, d.f); gl.viewport(0, 0, d.w, d.h); this.#bind(0, s.t);
          this.#set(this.prog.up, { uTexel: [1 / s.w, 1 / s.h] }); gl.uniform1i(this.prog.up.u.uSrc, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        gl.disable(gl.BLEND);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      const c = this.prog.comp; this.#set(c, {
        uRes: [W, H], uFrame: P.frame, uBloomAmt: doBloom ? P.bloom : 0, uStreak: P.streak, uCA: P.ca, uGrain: P.grain, uVig: P.vignette, uVigSoft: P.vignetteSoft, uGlitch: P.glitch, uZoomBlur: P.zoomBlur,
        uScan: P.scan, uSat: P.sat, uContrast: P.contrast, uExposure: P.exposure, uFade: P.fade, uShoulder: P.shoulder, uWarp: P.warp, uDither: P.dither, uPix: P.pixelate,
        uTint: P.tint, uLift: P.lift, uFlash: P.flash, uFadeCol: P.fadeColor, uBloomTint: P.bloomTint, uCenter: P.center, uShockW: P.shockWidth,
      });
      const sh = new Float32Array(16); P.shock.slice(0, 4).forEach((s, i) => sh.set([s[0], s[1], s[2], s[3]], i * 4)); gl.uniform4fv(c.u.uShock, sh);
      this.#bind(0, srcTex); this.#bind(1, doBloom ? this.chain[0].t : srcTex); this.#bind(2, doBloom ? this.chain[Math.min(2, this.chain.length - 1)].t : srcTex);
      gl.uniform1i(c.u.uSrc, 0); gl.uniform1i(c.u.uBloom, 1); gl.uniform1i(c.u.uWide, 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
  window.Post = Post;
})();
