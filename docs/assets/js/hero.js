/* Hero background: one fragment shader — domain-warped flow in violet/cyan with stars, a mouse "lens" and film grain. Renders at reduced resolution,
   pauses when off-screen or hidden, and falls back to a CSS gradient without WebGL or with reduced motion. */
(() => {
  'use strict';
  const hero = document.getElementById('hero'), cv = document.getElementById('hero-gl') || document.querySelector('#hero-gl');
  const root = document.querySelector('.hero');
  if (!cv || !root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = !reduce && (cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }));
  if (!gl) { root.classList.add('no-gl'); return; }
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
uniform vec2 uRes,uM;uniform float uT,uS;uniform vec3 uC1,uC2;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
void main(){
  vec2 R=uRes;vec2 uv=gl_FragCoord.xy/R;vec2 p=(gl_FragCoord.xy-.5*R)/R.y;
  vec2 m=(uM-.5*R)/R.y;float dm=length(p-m);
  p+=(p-m)*exp(-dm*5.)*.10;                                   /* lens around the pointer */
  float t=uT*.055;
  vec2 q=vec2(fbm(p*1.5+t),fbm(p*1.5+vec2(5.2,1.3)-t));
  vec2 r=vec2(fbm(p*1.7+2.*q+vec2(1.7,9.2)+t*1.3),fbm(p*1.7+2.*q+vec2(8.3,2.8)-t));
  float f=fbm(p*1.35+2.4*r);
  vec3 col=mix(vec3(.018,.014,.045),uC1,smoothstep(.15,.85,f));
  col=mix(col,uC2,smoothstep(.45,1.1,length(q))*.5);
  col+=vec3(.95,.22,.58)*pow(clamp(r.x,0.,1.),3.)*.30;
  col+=vec3(.5,.7,1.)*exp(-dm*4.5)*.20;                       /* pointer glow */
  col*=.78+.22*smoothstep(1.2,.0,length(p*vec2(.8,1.)));       /* vignette */
  vec2 g=floor(gl_FragCoord.xy/3.2);float st=step(.9965,h(g));st*=.55+.45*sin(uT*1.6+h(g+3.)*40.);col+=st*vec3(.85,.9,1.)*.9;
  col*=1.-smoothstep(.55,1.,uv.y)*.0;
  col+=(h(gl_FragCoord.xy+fract(uT)*91.)-.5)*.035;           /* grain */
  gl_FragColor=vec4(col,1.);
}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : (console.warn(gl.getShaderInfoLog(o)), null); };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) { root.classList.add('no-gl'); return; }
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), uRes = U('uRes'), uM = U('uM'), uT = U('uT'), uS = U('uS');
  const hex = (h, d) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return d; const n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };   // colours from data-c1 / data-c2 on the canvas (defaults: violet, cyan)
  gl.uniform3fv(U('uC1'), hex(cv.dataset.c1, [.27, .12, .72])); gl.uniform3fv(U('uC2'), hex(cv.dataset.c2, [.08, .80, .88]));
  let mx = 0, my = 0, tx = 0, ty = 0, vis = true, W = 0, H = 0;
  let q = 1; const scale = () => Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 700 ? .5 : .62) * q;
  const size = () => { const s = scale(); W = Math.max(2, Math.round(cv.clientWidth * s)); H = Math.max(2, Math.round(cv.clientHeight * s)); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); mx = tx = W * .62; my = ty = H * .55; };
  size(); addEventListener('resize', size);
  addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(), s = W / r.width; tx = (e.clientX - r.left) * s; ty = (r.height - (e.clientY - r.top)) * s; }, { passive: true });
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) frame(); }).observe(root);
  const t0 = performance.now(); let raf = 0;
  let last = 0, avg = 16, slow = 0;
  function frame() {
    cancelAnimationFrame(raf); if (!vis || document.hidden) return;
    const now = performance.now(); if (last) { avg += ((now - last) - avg) * .08; if (avg > 34) { if (++slow > 40 && q > .4) { q *= .8; slow = 0; size(); } } else slow = 0; } last = now;
    mx += (tx - mx) * .06; my += (ty - my) * .06;
    gl.uniform2f(uRes, W, H); gl.uniform2f(uM, mx, my); gl.uniform1f(uT, (performance.now() - t0) / 1000); gl.uniform1f(uS, scrollY / innerHeight);
    gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', frame); frame();
})();
