/* pcv-page.js — injected by render.mjs into the page being rendered (never loaded by your video code).
   Grabs the finished frame from the page's output canvas and POSTs it to the renderer.

   modes:
     'yuv'  (default) WebGL2 packs the frame to planar YUV420 BT.709 on the GPU → 3.1 MB per 1080p frame (2.7× less than RGBA),
            and accumulates motion-blur sub-frames in a float texture.
     'rgba' getImageData fallback (8.3 MB per 1080p frame), sub-frames accumulated on the CPU.
     'png'  PNG blob (slowest; used for stills).                                                                               */
(() => {
  if (window.__PCV) return window.__PCV;
  const P = window.__PCV = { W: 0, H: 0, mode: 'rgba', acc: null, out: null, gpuError: null };

  P.pick = () => {
    const V = window.VIDEO || {}; let c = null;
    if (V.canvas) c = typeof V.canvas === 'string' ? document.querySelector(V.canvas) : V.canvas;
    if (!c) for (const s of ['#out', '#c', '#gl', '#canvas', '#stage']) { const e = document.querySelector(s); if (e && e.tagName === 'CANVAS') { c = e; break; } }
    if (!c) { let best = 0; for (const e of document.querySelectorAll('canvas')) { const a = e.width * e.height; if (a > best) { best = a; c = e; } } }
    return c;
  };

  P.inspect = () => {
    const V = window.VIDEO || {}, c = P.pick();
    const out = { video: JSON.parse(JSON.stringify(V, (k, v) => (typeof v === 'function' || v instanceof Element) ? undefined : v)), hasRender: typeof window.renderFrame === 'function', viewport: [innerWidth, innerHeight] };
    if (c) { const r = c.getBoundingClientRect(); out.canvas = { w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), id: c.id }; out.canvasCoversViewport = r.width * r.height >= 0.85 * innerWidth * innerHeight; }
    const bad = []; if (document.fonts) document.fonts.forEach(f => { if (f.status === 'error') bad.push(f.family); });
    out.fontErrors = bad; out.fontsLoaded = document.fonts ? [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight) : [];
    try { const g = document.createElement('canvas').getContext('webgl2'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); out.webgl = g ? (e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)) : null; } catch (e) { out.webgl = null; }
    return out;
  };

  /* ---------- CPU path helpers ---------- */
  P.prepCPU = () => {
    P.g = document.createElement('canvas'); P.g.width = P.W; P.g.height = P.H;
    P.gx = P.g.getContext('2d', { willReadFrequently: true, alpha: false });
  };
  const runFrame = async t => { const r = window.renderFrame(t); if (r && typeof r.then === 'function') await r; };
  const paintCPU = () => { P.gx.fillStyle = '#000'; P.gx.fillRect(0, 0, P.W, P.H); P.gx.drawImage(P.canvas, 0, 0, P.W, P.H); };

  /* ---------- GPU path (WebGL2): RGB → planar YUV420 BT.709, limited range ---------- */
  const VS = '#version 300 es\nvoid main(){ vec2 p = vec2(gl_VertexID == 1 ? 3. : -1., gl_VertexID == 2 ? 3. : -1.); gl_Position = vec4(p, 0., 1.); }';
  const FS_ADD = '#version 300 es\nprecision highp float; precision highp int; uniform sampler2D uSrc; uniform ivec2 uSize; uniform float uW; out vec4 o;\n' +
    'void main(){ ivec2 p = ivec2(gl_FragCoord.xy); o = vec4(texelFetch(uSrc, ivec2(p.x, uSize.y - 1 - p.y), 0).rgb * uW, 1.); }';
  // gl_FragCoord.y counts from the bottom; texture row 0 is the TOP of the canvas → flip while accumulating so the accumulator is stored top-down.
  const FS_PACK = '#version 300 es\nprecision highp float; precision highp int; uniform sampler2D uSrc; uniform ivec2 uSize; out vec4 o;\n' +
    'vec3 px(int x, int y){ return texelFetch(uSrc, ivec2(clamp(x, 0, uSize.x - 1), clamp(y, 0, uSize.y - 1)), 0).rgb; }\n' +
    'void main(){\n' +
    '  ivec2 p = ivec2(gl_FragCoord.xy); int W = uSize.x, H = uSize.y; float v;\n' +
    '  if (p.y < H) { vec3 c = px(p.x, H - 1 - p.y); v = (16. + 219. * dot(c, vec3(.2126, .7152, .0722))) / 255.; }\n' +
    '  else {\n' +
    '    int idx = (p.y - H) * W + p.x, plane = (W / 2) * (H / 2); int isV = idx >= plane ? 1 : 0; int k = idx - isV * plane;\n' +
    '    if (k >= plane) { v = 128. / 255.; }\n' +
    '    else { int cx = k % (W / 2), cy = k / (W / 2); int y0 = H - 1 - 2 * cy;\n' +
    '      vec3 c = (px(2 * cx, y0) + px(2 * cx + 1, y0) + px(2 * cx, y0 - 1) + px(2 * cx + 1, y0 - 1)) * .25;\n' +
    '      float y = dot(c, vec3(.2126, .7152, .0722)); float ch = isV == 1 ? (c.r - y) / (2. * (1. - .2126)) : (c.b - y) / (2. * (1. - .0722));\n' +
    '      v = (128. + 224. * ch) / 255.; }\n' +
    '  }\n' +
    '  o = vec4(v, 0., 0., 1.); }';

  P.initGPU = () => {
    try {
      const c = document.createElement('canvas'); c.width = 8; c.height = 8;
      const gl = c.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error('no WebGL2');
      const floatOK = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
      const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
      const prog = fs => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
      const W = P.W, H = P.H, PH = Math.ceil(H * 1.5);
      const tex = (fmt, w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
        if (fmt === 'r8') gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, null);
        else if (fmt === 'f16') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
        else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; };
      const fbo = t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incomplete'); return f; };
      const G = P.gl = { gl, add: prog(FS_ADD), pack: prog(FS_PACK), vao: gl.createVertexArray() };
      G.src = tex('rgba8', W, H); G.acc = tex(floatOK ? 'f16' : 'rgba8', W, H); G.accF = fbo(G.acc); G.out = tex('r8', W, PH); G.outF = fbo(G.out);
      G.u = { addSrc: gl.getUniformLocation(G.add, 'uSrc'), addSize: gl.getUniformLocation(G.add, 'uSize'), addW: gl.getUniformLocation(G.add, 'uW'), packSrc: gl.getUniformLocation(G.pack, 'uSrc'), packSize: gl.getUniformLocation(G.pack, 'uSize') };
      G.buf = new Uint8Array(W * PH); G.PH = PH; G.floatOK = floatOK;
      P.mode = 'yuv'; return true;
    } catch (e) { P.gpuError = String(e && e.message || e); P.gl = null; P.mode = 'rgba'; return false; }
  };

  P.prep = (wantGPU) => {
    P.canvas = P.pick(); if (!P.canvas) throw new Error('no <canvas> found — declare VIDEO.canvas or use --capture screenshot');
    P.W = P.canvas.width; P.H = P.canvas.height; P.prepCPU();
    if (wantGPU && P.W % 2 === 0 && P.H % 2 === 0) P.initGPU();
    return [P.W, P.H, P.mode, P.gpuError];
  };

  P.tick = async t => { await runFrame(t); return 1; };

  // upload the page canvas as a texture, add it (weighted) into the accumulator
  const gpuAdd = (w, first) => {
    const { gl } = P.gl, G = P.gl, W = P.W, H = P.H;
    gl.bindVertexArray(G.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G.src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, P.canvas);
    gl.bindFramebuffer(gl.FRAMEBUFFER, G.accF); gl.viewport(0, 0, W, H);
    if (first) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(G.add); gl.uniform1i(G.u.addSrc, 0); gl.uniform2i(G.u.addSize, W, H); gl.uniform1f(G.u.addW, w);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disable(gl.BLEND);
  };
  const gpuPack = () => {
    const G = P.gl, { gl } = G, W = P.W, H = P.H;
    gl.bindFramebuffer(gl.FRAMEBUFFER, G.outF); gl.viewport(0, 0, W, G.PH); gl.disable(gl.BLEND);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G.acc);
    gl.useProgram(G.pack); gl.uniform1i(G.u.packSrc, 0); gl.uniform2i(G.u.packSize, W, H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.pixelStorei(gl.PACK_ALIGNMENT, 1); gl.readPixels(0, 0, W, G.PH, gl.RED, gl.UNSIGNED_BYTE, G.buf);
    return G.buf;
  };

  /** Render frame t, upload it to /__pcv/f/<id>. o: {K, shutter, dt, dur, fmt:'yuv'|'raw'|'png', label}. Returns timing breakdown (ms). */
  P.frame = async (t, id, o) => {
    o = o || {}; const K = Math.max(1, Math.round(o.K || 1)), W = P.W, H = P.H, t0 = performance.now(); let tr = 0, body;
    const times = k => Math.min(o.dur || 1e9, Math.max(0, t + ((k + 0.5) / K - 0.5) * (o.shutter || 0.5) * (o.dt || 0)));
    if (o.fmt === 'yuv' && P.mode === 'yuv' && !o.label) {
      for (let k = 0; k < K; k++) { const r0 = performance.now(); await runFrame(K === 1 ? t : times(k)); tr += performance.now() - r0; gpuAdd(1 / K, k === 0); }
      body = new Blob([gpuPack()]);
    } else {
      if (K === 1) { const r0 = performance.now(); await runFrame(t); tr = performance.now() - r0; paintCPU(); }
      else {
        const n = W * H * 4; if (!P.acc || P.acc.length !== n) { P.acc = new Uint16Array(n); P.out = new Uint8ClampedArray(n); }
        P.acc.fill(0);
        for (let k = 0; k < K; k++) { const r0 = performance.now(); await runFrame(times(k)); tr += performance.now() - r0; paintCPU(); const d = P.gx.getImageData(0, 0, W, H).data, a = P.acc; for (let i = 0; i < n; i++) a[i] += d[i]; }
        const a = P.acc, out = P.out, h = K >> 1; for (let i = 0; i < n; i++) out[i] = ((a[i] + h) / K) | 0;
        P.gx.putImageData(new ImageData(out, W, H), 0, 0);
      }
      if (o.label) {
        const g = P.gx, fs = Math.max(14, Math.round(H / 28)); g.font = '600 ' + fs + 'px system-ui, Segoe UI, Arial, sans-serif'; g.textBaseline = 'top';
        const w = g.measureText(o.label).width + fs * 0.9; g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(0, 0, w, fs * 1.6); g.fillStyle = '#fff'; g.fillText(o.label, fs * 0.45, fs * 0.3);
      }
      if (o.fmt === 'png') body = await new Promise(r => P.g.toBlob(r, 'image/png'));
      else body = new Blob([P.gx.getImageData(0, 0, W, H).data]);
    }
    const t2 = performance.now(), res = await fetch('/__pcv/f/' + id, { method: 'POST', body });
    if (!res.ok) throw new Error('frame upload failed: ' + res.status);
    const t3 = performance.now(); return { render: tr, read: t2 - t0 - tr, upload: t3 - t2 };
  };
  return P;
})();
