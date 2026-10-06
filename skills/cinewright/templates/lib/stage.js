/* stage.js — a film editor in code: scenes on a timeline, GPU transitions between them, a global camera, persistent overlay, per-scene
   colour/look, all composited in Post's HDR target. Replaces "one giant renderFrame with if/else on time".  Needs kit.js? no — only post.js, gfx.js, trans.js.

     const post = new Post(out), gfx = new GFX(post), S = new Stage(post, gfx, { fps: FPS });
     S.timeline([
       { id: 'intro', at: 0,   draw: (g, lt, t) => { … 2D canvas drawing, lt = seconds since the scene started … } },
       { id: 'hero',  at: 3.0, enter: ['whip', .35, { dir: [1, 0] }],                 // transition INTO this scene, centred on `at`
         gl: ({ gfx, rt, W, H }, lt, t) => { … draw into rt with GFX / FX / Scene3D / Parts … },   // GPU scene (optionally + a 2D `draw` on top)
         look: { bloom: .9, grain: .05 } },                                           // Post options for this scene (mixed during transitions)
       { id: 'end',   at: 9.0, enter: ['iris', .6], draw: … },
     ]);
     S.overlay((g, t) => { … persistent 2D on top: captions, logo bug, frame, letterbox … });
     S.camera = t => ({ zoom: 1 + .03 * K.punch(t, HITS), rot: 0, x: 0, y: 0 });      // optional global camera (uv units)
     S.look((t, base) => ({ ca: (base.ca ?? .0025) + .006 * K.pulse(t, HITS, .1) }));   // optional global Post look: sees the scene's look, returns overrides
     window.ready = Promise.all([fonts…, S.ready()]);
     function renderFrame(t) { S.render(t, { bloom: .6 }); }                           // → post.end()

   Scenes live from (at − enter/2) to the next scene's (at + enter/2); during the overlap both are drawn (each with its own lt) and mixed by the
   transition. lt can therefore be slightly negative (pre-roll): clamp with K.seg. Scenes must be pure functions of (lt, t). Classic script → window.Stage. */
(() => {
  'use strict';
  const XFORM = `
//#use math
uniform sampler2D uTex; uniform vec4 uXf;
void main(){ float a = uRes.x / uRes.y; vec2 p = (vUv - .5) * vec2(a, 1.); p = rot(-uXf.y) * p / uXf.x; p = p / vec2(a, 1.) + .5 - uXf.zw; o = texture(uTex, p); }`;
  const mixLook = (a, b, w) => {
    const o = { ...a }; for (const k in b) { const x = a[k], y = b[k];
      if (typeof y === 'number' && typeof x === 'number') o[k] = x + (y - x) * w;
      else if (Array.isArray(y) && Array.isArray(x) && x.length === y.length && typeof y[0] === 'number') o[k] = x.map((v, i) => v + (y[i] - v) * w);
      else if (x === undefined || w > .5) o[k] = y; } return o;
  };
  const addLook = (look, pulse, k) => { for (const key in pulse) { const v = pulse[key]; if (typeof v === 'number') look[key] = (look[key] ?? ({ ca: .0025, flash: 0, glitch: 0, zoomBlur: 0, bloom: .5 })[key] ?? 0) + v * k; } return look; };

  class Stage {
    constructor(post, gfx, { fps, W, H } = {}) {
      this.post = post; this.gfx = gfx; this.W = W || gfx.W; this.H = H || gfx.H; this.u = this.H / 1080; this.fps = fps || (window.VIDEO && window.VIDEO.fps) || 30;
      const mk = () => { const c = document.createElement('canvas'); c.width = this.W; c.height = this.H; return c; };
      this.cv = mk(); this.g = this.cv.getContext('2d'); this.ovc = mk(); this.ovg = this.ovc.getContext('2d');
      this.scenes = []; this.slotTex = [null, null]; this.slotRT = [null, null]; this.comp = null; this.xform = gfx.prog(XFORM); this._ov = null; this._look = null; this.camera = null; this.last = null;
    }
    /** Add one scene (see header). Returns it. Keeps scenes sorted by `at`. */
    scene(def) {
      if (!def.id) def.id = 'scene' + this.scenes.length; if (def.at == null) throw new Error(`Stage: scene "${def.id}" needs an \`at\` time`);
      if (!def.draw && !def.gl) throw new Error(`Stage: scene "${def.id}" needs draw(g, lt, t) and/or gl(ctx, lt, t)`);
      this.scenes.push(def); this.scenes.sort((a, b) => a.at - b.at); this._win(); return def;
    }
    timeline(list) { list.forEach(s => this.scene(s)); return this; }
    overlay(fn) { this._ov = fn; return this; }
    look(fn) { this._look = fn; return this; }
    /** Run every scene's optional async init({gfx, post, W, H, S}) once — put this in window.ready so frames render identically in every worker. */
    async ready() { const ctx = { gfx: this.gfx, post: this.post, W: this.W, H: this.H, S: this }; for (const s of this.scenes) if (s.init && !s._inited) { s._inited = true; await s.init(ctx); } return true; }
    _win() {
      const S = this.scenes; S.forEach((s, i) => { const prev = S[i - 1], next = S[i + 1]; s._d = prev && s.enter ? s.enter[1] : 0; s.start = i === 0 ? -Infinity : s.at - s._d / 2; s.end = next ? next.at + (next.enter ? next.enter[1] / 2 : 0) : Infinity; });
    }
    _rt(i) { return this.slotRT[i] || (this.slotRT[i] = this.gfx.rt(this.W, this.H, { depth: false })); }
    _draw(s, slot, t) {
      const gfx = this.gfx, lt = t - s.at, ctx = { gfx, post: this.post, W: this.W, H: this.H, S: this, u: this.u }; let tex;
      if (s.gl) {
        const rt = this._rt(slot); ctx.rt = rt; gfx.clear(s.bgGL || [0, 0, 0, 1], rt); const r = s.gl(ctx, lt, t, this); tex = r && r.t ? r : rt;
        if (s.draw) { this._d2(s, lt, t); if (tex !== rt) { gfx.blit(tex, { to: rt }); tex = rt; } gfx.layer(this.cv, { to: rt }); }
      } else { this._d2(s, lt, t); tex = this.slotTex[slot] = gfx.up(this.cv, this.slotTex[slot]); }
      return tex;
    }
    _d2(s, lt, t) {
      const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0; g.filter = 'none'; g.clearRect(0, 0, this.W, this.H);
      if (!s.gl && s.bg !== null) { g.fillStyle = s.bg || '#000'; g.fillRect(0, 0, this.W, this.H); }
      g.save(); s.draw(g, lt, t, this); g.restore();
    }
    /** Which scene(s) are alive at t: { a, b, p, tr } (b/p/tr only during a transition). */
    at(t) {
      const S = this.scenes; if (!S.length) throw new Error('Stage: no scenes'); const alive = S.filter(s => t >= s.start && t < s.end); const live = alive.length ? alive : [t < S[0].at ? S[0] : S[S.length - 1]];
      if (live.length === 1) return { a: live[0] }; const b = live[live.length - 1], a = live[live.length - 2], d = b.enter[1];
      return { a, b, p: Math.min(1, Math.max(0, (t - (b.at - d / 2)) / d)), tr: b.enter };
    }
    /** Compose frame t and finish it through Post. opts: extra Post options (merged last); pass false to skip post.end() (you draw more yourself). */
    render(t, opts = {}) {
      const { gfx, post } = this; gfx.time(t); post.begin([0, 0, 0, 1]);
      const cam = this.camera ? this.camera(t) : null, useCam = cam && (cam.zoom !== 1 || cam.rot || cam.x || cam.y || cam.zoom == null), target = useCam ? (this.comp || (this.comp = gfx.rt(this.W, this.H))) : undefined;
      const st = this.at(t); let look = { frame: Math.round(t * this.fps) }; let texA, texB;
      if (!st.b) { texA = this._draw(st.a, 0, t); gfx.blit(texA, { to: target }); look = mixLook(look, st.a.look || {}, 1); }
      else {
        texA = this._draw(st.a, 0, t); texB = this._draw(st.b, 1, t); const [name, , o] = st.tr; const r = Trans.run(gfx, name, texA, texB, st.p, { ...(o || {}), to: target });
        look = mixLook(mixLook(look, st.a.look || {}, 1), st.b.look || {}, r.p); addLook(look, r.look, Math.sin(Math.PI * r.p)); look.__tr = { name, p: r.p };
      }
      if (useCam) { const c = { zoom: 1, rot: 0, x: 0, y: 0, ...cam }; gfx.pass(this.xform, { uTex: this.comp, uXf: [c.zoom, c.rot, c.x, c.y] }); }
      if (this._ov) { const g = this.ovg; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, this.W, this.H); g.save(); this._ov(g, t, this); g.restore(); gfx.layer(this.ovc); }
      delete look.__tr; this.last = st;
      if (this._look) look = { ...look, ...this._look(t, look) };        // the global look() sees the scene/transition look as its 2nd argument and can add to it (e.g. pulse ca on hits)
      if (opts !== false) post.end({ ...look, ...opts });
      return look;
    }
  }
  window.Stage = Stage;
})();
