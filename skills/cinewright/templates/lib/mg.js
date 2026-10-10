/* mg.js — the motion-graphics kit: themes, backgrounds, icons, animated type, cards, counters, charts, wipes and ten ready-made SCENE TYPES,
   all drawn on a 2D canvas as pure functions of time. Needs kit.js. Classic script → window.MG.
   It exists for the everyday jobs — introduce a person, a channel intro, a social promo, an infographic, an event promo, a lower-third pack —
   where the film is a handful of well-designed scenes, not a render farm. You describe the film as DATA (the spec in <script id="cues">), the kit draws it
   and audio.mjs scores it from the same spec:

     const film = MG.film(SPEC, { W, H });          // SPEC = JSON.parse(document.getElementById('cues').textContent)
     film.draw(g, t);                               // one frame onto a 2D context (camera, background, scene, wipe)
     film.hits                                      // scene starts + spec.hits (for K.punch / audio)

   Spec:  { bpm, duration, theme: { preset: 'pop'|'night'|'studio'|'mint'|'warm'|'ocean'|'poster', a, b, c, d, bg, bg2, ink, head: 'grotesk'|'display'|'rounded'|'serif' }, mood, wipe,
            scenes: [ { type, at, wipe?, bg?, … type-specific fields } ] }
   Scene types (MG.scenes): title · hit · fact · words · quote · logo · cta · chart · chips · stats · list  (+ register your own: MG.scenes.mine = (g, lt, t, sc, X) => …)
   Shots, not slides: hit / fact / words are ONE idea filling the frame for 1–2 s (they compress their entrances to the shot length, MG.shotK); chips / stats / list are rows of cards — a slide layout, use sparingly.
   Continuity (what separates motion design from a slideshow): spec.transition 'whip' | 'push' | 'zoom' | 'iris' | 'blinds' | 'cut' (per scene or spec-wide; default whip) — both scenes travel on one camera strip; spec.carry = one object that
   lives above the scenes and moves/morphs between them; title lines take "styles": ['slideL', 'slam', 'drop', 'rise']. Legacy colour wipes ('stripes', 'circle', …) still work as `wipe`.
   Right-to-left (Persian, Arabic, Hebrew): spec.lang 'fa' | 'ar' | 'he' (or spec.dir 'rtl') mirrors the whole layout; Persian digits with spec.digits 'fa' (default for 'fa'). In custom scenes draw text with MG.text(g, str, x, y, opts) — same signature as K.text.
   Timing convention shared with audio.mjs: item i of a scene appears at  sc.at + (sc.lead ?? .3) + i * (sc.step ?? beat / 2)  seconds. */
(() => {
  'use strict';
  const { E, clamp, lerp, prog } = K, TAU = Math.PI * 2, MG = {}; window.MG = MG;

  /* ───────────────────────── themes ───────────────────────── */
  const PRESETS = {
    pop:    { mode: 'light', bg: '#fff3e2', bg2: '#ffe0b8', ink: '#1a1530', a: '#ff5a5f', b: '#3d5afe', c: '#ffc933', d: '#13c296', bgKind: 'blobs' },
    night:  { mode: 'dark',  bg: '#0c0e22', bg2: '#1b1f4d', ink: '#f6f3ff', a: '#7a5cff', b: '#2fe0e8', c: '#ffb84d', d: '#ff4fa3', bgKind: 'blobs' },
    studio: { mode: 'light', bg: '#f4f1ea', bg2: '#e6e0d3', ink: '#14120f', a: '#ff6a00', b: '#1f4fff', c: '#ffd23f', d: '#0f9d7a', bgKind: 'dots' },
    mint:   { mode: 'light', bg: '#e9fff3', bg2: '#c9f7de', ink: '#0b3a2c', a: '#00b37e', b: '#ff7a59', c: '#ffcf4a', d: '#3b82f6', bgKind: 'blobs' },
    warm:   { mode: 'dark',  bg: '#2a1810', bg2: '#4a2b1b', ink: '#fff1dc', a: '#f0a35e', b: '#d4553f', c: '#f6d9a8', d: '#8fc9a0', bgKind: 'grad' },
    ocean:  { mode: 'dark',  bg: '#081230', bg2: '#12285c', ink: '#eaf2ff', a: '#5b8cff', b: '#a07bff', c: '#43e0c0', d: '#ffd166', bgKind: 'blobs' },
    poster: { mode: 'light', bg: '#fbf1dc', bg2: '#fbf1dc', ink: '#1d1a16', a: '#f24e29', b: '#1f3b2f', c: '#f7b63b', d: '#bfe3c6', bgKind: 'flat', head: 'display', caps: true, grad: ['a', 'c'] },
  };
  MG.themes = PRESETS;
  const lum = c => { const [r, g, b] = K.rgb(c); return (.2126 * r + .7152 * g + .0722 * b) / 255; };
  const onColor = c => lum(c) > .58 ? '#14112b' : '#ffffff';
  MG.onColor = onColor;
  MG.theme = (spec = {}) => {
    const T = { ...(PRESETS[spec.preset || 'pop'] || PRESETS.pop), ...spec }; T.light = T.mode === 'light';
    T.card = spec.card || (T.light ? '#ffffff' : 'rgba(255,255,255,.08)');
    T.mut = spec.mut || (T.light ? 'rgba(26,21,48,.62)' : 'rgba(246,243,255,.68)');
    T.line = T.light ? 'rgba(20,16,40,.12)' : 'rgba(255,255,255,.16)';
    const FF = { grotesk: K.FONTS.grotesk, display: K.FONTS.display, rounded: K.FONTS.rounded, serif: K.FONTS.serif, sans: K.FONTS.sans, mono: K.FONTS.mono };
    T.fonts = { head: FF[spec.head || 'grotesk'] || FF.grotesk, body: FF[spec.body || 'sans'] || FF.sans, mono: FF.mono };
    const hd = spec.head || T.head || 'grotesk'; T.fonts.head = FF[hd] || FF.grotesk; T.hw = hd === 'display' ? 400 : hd === 'serif' ? 700 : 800; T.accents = [T.a, T.b, T.c, T.d]; T.caps = spec.caps ?? T.caps ?? false;
    return T;
  };
  const F = (X, k = 'head', w) => ({ family: X.T.fonts[k], weight: w ?? (k === 'head' ? X.T.hw : k === 'mono' ? 500 : 600) });
  MG.font = F;
  const cap = (X, s, font = 'head') => X.T.caps && font === 'head' ? String(s).toUpperCase() : s;
  const textW = (g, X, str, size, k = 'head', w) => K.measure(g, str, { ...F(X, k, w), size }).w;
  /** Text for every scene. In a right-to-left film the whole layout is mirrored (see MG.film), so each run is flipped back about its own centre to keep its glyphs readable
      — left-aligned text then ends up right-aligned at the mirrored anchor. Persian digits when spec.digits / lang say so. Custom scenes: use MG.text instead of K.text. */
  const faDig = s => /[\u0600-\u06FF]/.test(s) || /^[\d\s.,+%€$£:\-–—\/×x]+$/.test(s) ? K.faDigits(s.replace(/(\d),(?=\d{3})/g, '$1٬').replace(/(\d)\.(?=\d)/g, '$1٫')) : s;
  const TX = (g, str, x, y, o = {}) => {
    str = String(str); if (MG.fa) str = faDig(str);
    if (/[\u0600-\u06FF]/.test(str) && /^"?Anton/.test(o.family || '') && (o.weight || 700) < 700) o = { ...o, weight: 800 };
    if (!MG.mirror) return K.text(g, str, x, y, o);
    const sp = K.dirOf(str) === 'rtl' ? 0 : (o.spacing || 0) * [...str].length, w = Math.min(K.measure(g, str, o).w + sp, o.max || 1e9), al = o.align || 'center', c = al === 'center' ? x : al === 'left' ? x + w / 2 : x - w / 2;
    g.save(); g.translate(c, 0); g.scale(-1, 1); g.translate(-c, 0); const r = K.text(g, str, x, y, o); g.restore(); return r;
  };
  MG.text = TX;

  /* ───────────────────────── small drawing helpers ───────────────────────── */
  const soft = (g, x, y, r, color, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); const [cr, cg, cb] = K.rgb(color); gr.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  MG.soft = soft;
  MG.card = (g, X, x, y, w, h, o = {}) => {
    const r = o.r ?? 36 * X.U; g.save(); if (o.shadow !== false) { g.shadowColor = X.T.light ? 'rgba(40,20,80,.20)' : 'rgba(0,0,0,.5)'; g.shadowBlur = 54 * X.U; g.shadowOffsetY = 22 * X.U; }
    K.rr(g, x, y, w, h, r); g.fillStyle = o.fill || X.T.card; g.fill(); g.restore();
    if (o.stroke) { g.save(); K.rr(g, x, y, w, h, r); g.strokeStyle = o.stroke; g.lineWidth = 2.5 * X.U; g.stroke(); g.restore(); }
  };
  /** A soft diagonal light sweep that crosses a card every ~2.8 s (k offsets the phase per card) — secondary motion for scenes whose items have landed. */
  MG.shine = (g, X, x, y, w, h, r, t, k = 0) => {
    const per = 2.8, ph = (((t + k * .55) % per) + per) % per / per; if (ph > .5) return; const q = ph / .5, bx = x - h * .6 + (w + h * 1.2) * q;
    g.save(); K.rr(g, x, y, w, h, r); g.clip(); g.translate(bx, y + h / 2); g.rotate(-.35); g.globalAlpha = (X.T.light ? .55 : .2) * Math.sin(Math.PI * q);
    const gr = g.createLinearGradient(-h * .3, 0, h * .3, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, '#ffffff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-h * .3, -h * 1.6, h * .6, h * 3.2); g.restore();
  };
  MG.underline = (g, x0, y, w, p, color, th) => { if (p <= 0) return; g.save(); g.strokeStyle = color; g.lineWidth = th; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w * clamp(p), y); g.stroke(); g.restore(); };
  /** Line of text that slides up from behind an invisible mask (the classic motion-design reveal). Returns { w, x0 }. */
  MG.mask = (g, X, str, x, y, lt, o = {}) => {
    str = o.caps === false ? str : cap(X, str, o.font || 'head'); const size = o.size || 80, d = o.delay || 0, p = E.outExpo(prog(lt, d, d + (o.dur || .75))); if (p <= 0.001) return { w: 0, x0: x };
    const f = { ...F(X, o.font || 'head', o.weight), size }, w = K.measure(g, str, f).w + (o.spacing || 0) * [...str].length, align = o.align || 'left', x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const st = o.style || 'rise', ink = o.fill || X.T.ink;
    if (st === 'slam' || st === 'drop') {          // no mask: the line lands — scaled up and tilted (slam) or dropped from above (drop) — and settles with overshoot
      const q = E.outBack(prog(lt, d, d + (o.dur || .6))); if (q <= 0) return { w: 0, x0: x };
      g.save(); g.translate(x, y + (st === 'drop' ? -(1 - q) * size * 1.6 : 0)); if (st === 'slam') { const sc2 = 1 + (1 - q) * .6; g.rotate((1 - q) * (o.tilt ?? -.07)); g.scale(sc2, sc2); } g.globalAlpha *= clamp(q * 3);
      TX(g, str, 0, 0, { ...f, fill: ink, align, spacing: o.spacing }); g.restore(); return { w, x0 };
    }
    const side = st === 'slideL' ? -1 : st === 'slideR' ? 1 : 0;       // slideL / slideR: the line slides in from its own left / right edge behind the mask, skewed by its speed
    g.save(); g.beginPath(); g.rect(x0 - size * .3, y - size * .85, w + size * .6, size * 1.7); g.clip();
    if (side) { g.translate(x, y); g.transform(1, 0, side * -.22 * (1 - p), 1, 0, 0); g.translate(side * (1 - p) * (w + size * .8), 0); TX(g, str, 0, 0, { ...f, fill: ink, align, spacing: o.spacing }); }
    else TX(g, str, x, y + (1 - p) * size * (o.dir === 'down' ? -1.2 : 1.2), { ...f, fill: ink, align, spacing: o.spacing });
    g.restore(); return { w, x0 };
  };
  /** Text that pops in with overshoot. */
  MG.pop = (g, X, str, x, y, lt, o = {}) => {
    str = o.caps === false ? str : cap(X, str, o.font || 'head'); const size = o.size || 80, d = o.delay || 0, p = E.outBack(prog(lt, d, d + (o.dur || .55))); if (p <= 0) return;
    g.save(); g.translate(x, y); g.scale(p, p); g.globalAlpha *= clamp(p * 2); TX(g, str, 0, 0, { ...F(X, o.font || 'head', o.weight), size, fill: o.fill || X.T.ink, align: o.align || 'center', spacing: o.spacing, shadow: o.shadow }); g.restore();
  };
  /** Wrap `str` to maxW with the given font size → lines. */
  MG.lines = (g, X, str, maxW, size, k = 'head', w) => K.wrap(g, str, maxW, { ...F(X, k, w), size });

  /* ───────────────────────── icons (24×24 grid, stroke) ───────────────────────── */
  const ICONS = {
    check: 'M5 12.5l4.5 4.5L19 7.5', plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14M13 6l6 6-6 6', star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z',
    heart: 'M12 20.5C5 15.5 3 12 3 8.8A4.8 4.8 0 0 1 12 6.6 4.8 4.8 0 0 1 21 8.8c0 3.2-2 6.7-9 11.7z', bolt: 'M13 2.5L5 13.5h6l-1 8 8-11h-6z',
    moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z', sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3.5 2', user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5',
    users: 'M9 5.5a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16.5 6.2a2.8 2.8 0 0 1 0 5.4M18 14c2 .7 3.5 2.4 3.5 5',
    briefcase: 'M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18',
    pen: 'M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19zM14 7l3 3', layers: 'M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5', code: 'M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 5l-3 14',
    search: 'M10.5 3.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5', bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
    rocket: 'M12 2.5c3 2 4.5 5.5 4.5 9.5l-2 3.5h-5L7.5 12C7.5 8 9 4.5 12 2.5zM9.5 15.5L7 19l3.5-1M14.5 15.5L17 19l-3.5-1M12 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
    trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20.5h7M10 17h4',
    award: 'M12 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8.5 14l-1.5 6.5 5-2.5 5 2.5-1.5-6.5', calendar: 'M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1zM4 10h16M8.5 3.5v4M15.5 3.5v4',
    ticket: 'M3.5 8a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.2a1.8 1.8 0 0 0 0 3.6V16a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-2.2a1.8 1.8 0 0 0 0-3.6zM14.5 7v10',
    mic: 'M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7', pin: 'M12 21s6.5-5.7 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.3 6.5 11 6.5 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z', mail: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3.5 7.5L12 13.5l8.5-6',
    play: 'M7 4.5l12 7.5-12 7.5z', camera: 'M4 7.5h3l1.5-2.5h7L17 7.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1zM12 10a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6z',
    music: 'M9 17.5V5.5l10-2v12M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z', coffee: 'M5 9h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c0 1.5 1.5 1.5 1.5 3M12 3.5c0 1.5 1.5 1.5 1.5 3',
    cup: 'M5 10h11v6a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 16zM16 11.5h1.6a2.5 2.5 0 0 1 0 5H16M8 3.2c-1.2 1.4 1.2 2.6 0 4.2M12 3.2c-1.2 1.4 1.2 2.6 0 4.2', leaf: 'M5 19c0-8 4.5-13 14-14 0 9.5-5 14-12.5 14M5 19c2-4 5-7 9-9',
    bean: 'M12 3.5c-4 0-7 3.5-7 8s3 9 7 9 7-4.5 7-9-3-8-7-8zM12 4c-2 3-2 5.5 0 8s2 5 0 8.5', brain: 'M12 5.5V19M9.5 4A3.5 3.5 0 0 0 6 7.2 3.3 3.3 0 0 0 4.5 10c0 1 .4 1.9 1 2.5A3.4 3.4 0 0 0 6.5 18 3 3 0 0 0 12 18.2M14.5 4A3.5 3.5 0 0 1 18 7.2 3.3 3.3 0 0 1 19.5 10c0 1-.4 1.9-1 2.5A3.4 3.4 0 0 1 17.5 18 3 3 0 0 1 12 18.2',
    chart: 'M5 20V11M12 20V5M19 20v-7M3 20.5h18', trend: 'M3.5 17l5.5-5.5 3.5 3.5L20.5 6.5M15 6.5h5.5V12', target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z',
    smile: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 14.5c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2M9 9.8v.4M15 9.8v.4', bell: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
    bag: 'M5.5 8h13l1 12h-15zM9 8V6.5a3 3 0 0 1 6 0V8', tag: 'M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7L21 12.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0zM8 8h.01',
    gift: 'M4 11h16v9H4zM3 7.5h18V11H3zM12 7.5V20M12 7.5c-1-3.5-5-4-5-1.5 0 1.5 2 1.5 5 1.5zM12 7.5c1-3.5 5-4 5-1.5 0 1.5-2 1.5-5 1.5z', zzz: 'M4 7h5L4 13h5M13 12h4l-4 5h4M18 4h3l-3 3.5h3',
    battery: 'M3 8.5h15a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zM21.5 11v2M5 11v2M8 11v2M11 11v2', wifi: 'M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9.2 16.3a4 4 0 0 1 5.6 0M12 19.5h.01',
    shield: 'M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z', book: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5', eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', pulse: 'M2.5 12h4l2.5-6 4 12 2.5-6h6',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', cube: 'M12 3l8 4.5v9L12 21 4 16.5v-9zM12 12v9M4 7.5l8 4.5 8-4.5', home: 'M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  };
  MG.icons = ICONS;
  const iconCache = {};
  const iconInfo = name => iconCache[name] ||= (() => {
    const d = ICONS[name] || ICONS.star, subs = d.split(/(?=M)/).filter(Boolean);
    const lens = subs.map(s => { try { const el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', s); return el.getTotalLength() || 30; } catch { return 30; } });
    return { path: new Path2D(d), subs: subs.map(s => new Path2D(s)), lens };
  })();
  /** Stroke icon centred on (cx, cy); p = draw-on progress 0…1 (every sub-path finishes together); lw in 24-grid units. */
  MG.icon = (g, name, cx, cy, size, color, p = 1, lw = 1.9) => {
    if (p <= 0) return; const I = iconInfo(name); g.save(); g.translate(cx - size / 2, cy - size / 2); g.scale(size / 24, size / 24); g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color;
    if (p >= .999) g.stroke(I.path); else I.subs.forEach((sp, i) => { const L = I.lens[i] + .5; g.setLineDash([L, L]); g.lineDashOffset = L * (1 - p); g.stroke(sp); });
    g.restore();
  };
  /** Icon inside a filled disc that pops in; the icon draws itself on a beat later. */
  MG.iconDisc = (g, X, name, cx, cy, r, bg, fg, lt, delay = 0) => {
    const p = E.outBack(prog(lt, delay, delay + .5)); if (p <= 0) return; g.save(); g.translate(cx, cy); g.scale(p, p); g.fillStyle = bg; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    MG.icon(g, name, 0, 0, r * 1.15, fg, E.outCubic(prog(lt, delay + .2, delay + .8)), 1.9); g.restore();
  };

  /* ───────────────────────── backgrounds ───────────────────────── */
  MG.bg = (g, X, t, kind) => {
    const { W, H, T, U } = X; kind = kind || T.bgKind || 'blobs';
    g.fillStyle = kind === 'flat' ? T.bg : K.gradient(g, 0, 0, W, H, [[0, T.bg], [1, T.bg2]]); g.fillRect(0, 0, W, H);
    const cols = T.accents, al = T.light ? .30 : .26;
    if ((kind === 'blobs' || kind === 'grad') && T.light) {
      [[.86, .12, .30], [.08, .92, .26], [.58, 1.04, .20], [.02, .08, .12]].forEach(([x, y, r], k) => { const dx = Math.sin(t * (.18 + .05 * k) + k * 2) * .028, dy = Math.cos(t * (.14 + .04 * k) + k) * .028; g.fillStyle = K.rgba(cols[k], k === 3 ? .16 : .2); g.beginPath(); g.arc((x + dx) * W, (y + dy) * H, r * Math.max(W, H), 0, TAU); g.fill(); });
    } else if (kind === 'blobs' || kind === 'grad') {
      for (let i = 0; i < 4; i++) { const sp = .18 + i * .05, cx = W * (.15 + .7 * (.5 + .5 * Math.sin(t * sp + i * 1.7))), cy = H * (.15 + .7 * (.5 + .5 * Math.cos(t * sp * .8 + i * 2.3))), r = Math.max(W, H) * (.32 + .05 * i); soft(g, cx, cy, r, cols[i], (kind === 'grad' ? .6 : 1) * al); }
    } else if (kind === 'dots') {
      const s = 62 * U, ox = (t * 14 * U) % s; g.fillStyle = T.light ? 'rgba(20,16,40,.13)' : 'rgba(255,255,255,.12)';
      for (let x = -s + ox; x < W + s; x += s) for (let y = s / 2; y < H + s; y += s) { g.beginPath(); g.arc(x, y, 2.6 * U, 0, TAU); g.fill(); }
      soft(g, W * .85, H * .2, Math.max(W, H) * .5, cols[0], al); soft(g, W * .1, H * .9, Math.max(W, H) * .45, cols[1], al);
    } else if (kind === 'grid') {
      const s = 96 * U, ox = (t * 18 * U) % s; g.strokeStyle = T.light ? 'rgba(20,16,40,.08)' : 'rgba(255,255,255,.08)'; g.lineWidth = 2 * U; g.beginPath();
      for (let x = -s + ox; x < W + s; x += s) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = -s + ox; y < H + s; y += s) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); soft(g, W * .5, H * .5, Math.max(W, H) * .6, cols[0], al * .7);
    } else if (kind === 'stripes') {
      g.save(); g.translate(W / 2, H / 2); g.rotate(-.42); const s = 120 * U, off = (t * 30 * U) % (s * 2); g.fillStyle = T.light ? 'rgba(20,16,40,.05)' : 'rgba(255,255,255,.05)';
      for (let x = -W - s * 2 + off; x < W + s * 2; x += s * 2) g.fillRect(x, -H * 1.2, s, H * 2.4); g.restore(); soft(g, W * .2, H * .8, Math.max(W, H) * .5, cols[1], al);
    } else if (kind === 'rays') {
      g.save(); g.translate(W / 2, H * .55); g.rotate(t * .06); g.fillStyle = T.light ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.06)'; const R = Math.hypot(W, H);
      for (let i = 0; i < 16; i++) { const a = i * TAU / 16; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a, a + TAU / 32); g.closePath(); g.fill(); } g.restore();
    } else if (kind === 'waves') {
      for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 24) g.lineTo(x, H * (.78 + .05 * k) + Math.sin(x / (200 * U) + t * (.6 + k * .25) + k) * 34 * U); g.lineTo(W, H); g.closePath(); g.fillStyle = K.rgba(cols[k], T.light ? .22 : .2); g.fill(); }
    }
  };
  /** A wide soft light band that glides diagonally across the frame every `per` seconds — cheap ambient motion that registers on every pixel it crosses. Draw it UNDER the content. */
  MG.sheen = (g, X, t, per = 5.2) => {
    const { W, H, T } = X, ph = (((t % per) + per) % per) / per; if (ph > .6) return; const q = ph / .6, bw = Math.max(W, H) * .4, cx = -bw + (W + H * .7 + bw * 2) * q, a = (T.light ? .3 : .085) * Math.sin(Math.PI * q);
    g.save(); g.translate(cx, H / 2); g.rotate(-.5); const gr = g.createLinearGradient(-bw / 2, 0, bw / 2, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-bw / 2, -H * 1.2, bw, H * 2.4); g.restore();
  };
  /** Drifting rings / squares / plusses / dots in the accent colours — the cheapest way to keep every frame alive. */
  MG.floaters = (g, X, t, o = {}) => {
    const { W, H, T, U } = X, n = o.n ?? 12, R = K.rng(o.seed ?? 7), cols = o.colors || T.accents; g.save();
    for (let i = 0; i < n; i++) {
      const x0 = R(), y0 = R(), sz = (16 + R() * 34) * U, sp = .25 + R() * .45, ph = R() * TAU, rot0 = R() * TAU, dir = R() < .5 ? -1 : 1, kind = i % 4, col = cols[i % cols.length];
      const x = (x0 + .025 * Math.sin(t * sp + ph)) * W, y = (((y0 + dir * t * sp * .02) % 1) + 1) % 1 * H;
      g.save(); g.translate(x, y); g.rotate(rot0 + t * sp * .5); g.globalAlpha = o.alpha ?? (T.light ? .55 : .4); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 4.5 * U; g.lineCap = 'round';
      if (kind === 0) { g.beginPath(); g.arc(0, 0, sz / 2, 0, TAU); g.stroke(); } else if (kind === 1) { K.rr(g, -sz / 2, -sz / 2, sz, sz, sz * .22); g.stroke(); }
      else if (kind === 2) { g.beginPath(); g.moveTo(-sz / 2, 0); g.lineTo(sz / 2, 0); g.moveTo(0, -sz / 2); g.lineTo(0, sz / 2); g.stroke(); } else { g.beginPath(); g.arc(0, 0, sz / 4, 0, TAU); g.fill(); }
      g.restore();
    }
    g.restore();
  };

  /* ───────────────────────── transitions (wipes between scenes) ───────────────────────── */
  const eio = x => E.inOutCubic(clamp(x));
  /** p 0→1: cover the frame (p < .5), the scene changes underneath at p = .5, then uncover. kinds: stripes · circle · slide · flood · blocks · diagonal */
  MG.wipe = (g, X, p, kind = 'stripes') => {
    const { W, H, T, U } = X, cols = [T.a, T.b, T.c, T.d, T.light ? T.ink : '#ffffff']; if (p <= 0 || p >= 1) return; g.save();
    if (kind === 'stripes') {
      const n = X.V ? 7 : 6, vertical = X.V; // bars sweep across; vertical formats use horizontal bars sweeping down
      for (let i = 0; i < n; i++) {
        const d = i * .035, lead = eio((p - d) / .28), trail = eio((p - d - .5) / .28); g.fillStyle = cols[i % 4];
        if (!vertical) { const h = H / n + 2, x0 = trail * W, x1 = lead * W; if (x1 > x0) g.fillRect(x0, i * H / n, x1 - x0, h); }
        else { const w = W / n + 2, y0 = trail * H, y1 = lead * H; if (y1 > y0) g.fillRect(i * W / n, y0, w, y1 - y0); }
      }
    } else if (kind === 'circle') {
      const R = Math.hypot(W, H) * .62; g.fillStyle = cols[0];
      if (p < .5) { g.beginPath(); g.arc(W / 2, H / 2, R * E.inOutCubic(p * 2), 0, TAU); g.fill(); }
      else { g.beginPath(); g.rect(0, 0, W, H); g.arc(W / 2, H / 2, R * E.inOutCubic((p - .5) * 2), 0, TAU, true); g.fill('evenodd'); }
    } else if (kind === 'slide') {
      const a = X.V ? H : W, q = p < .5 ? eio(p * 2) : 1, q2 = p < .5 ? 0 : eio((p - .5) * 2);
      [[cols[1], .0], [cols[0], .06]].forEach(([c, dl], k) => { const lead = eio((p - dl) * 2), trail = eio((p - dl - .5) * 2); g.fillStyle = c; if (!X.V) g.fillRect(trail * W, 0, Math.max(0, lead * W - trail * W), H); else g.fillRect(0, trail * H, W, Math.max(0, lead * H - trail * H)); });
      void a; void q; void q2;
    } else if (kind === 'flood') {
      g.fillStyle = cols[0]; g.globalAlpha = p < .5 ? E.outCubic(p * 2) : 1 - E.inCubic((p - .5) * 2); g.fillRect(0, 0, W, H);
    } else if (kind === 'blocks') {
      const cw = X.V ? 4 : 8, ch = X.V ? 7 : 5, bw = W / cw, bh = H / ch;
      for (let r = 0; r < ch; r++) for (let c = 0; c < cw; c++) { const d = (c + r) / (cw + ch) * .35, s = p < .5 ? E.outBack(clamp((p - d) / .22)) : 1 - E.inCubic(clamp((p - .5 - d) / .22)); if (s <= 0) continue; g.fillStyle = cols[(r + c) % 4]; const w = bw * s, h = bh * s; g.fillRect(c * bw + (bw - w) / 2 - 1, r * bh + (bh - h) / 2 - 1, w + 2, h + 2); }
    } else if (kind === 'diagonal') {
      g.fillStyle = cols[0]; const lead = eio(p / .55), trail = eio((p - .45) / .55), k = (W + H); g.beginPath();
      g.moveTo(trail * k - H, 0); g.lineTo(lead * k, 0); g.lineTo(lead * k - H, H); g.lineTo(trail * k - 2 * H, H); g.closePath(); g.fill();
    }
    g.restore();
  };

  /* ───────────────────────── stat counter ───────────────────────── */
  /** Number counting up: draws prefix + number (+ suffix at half size), centred / left aligned at (x, y). */
  MG.stat = (g, X, value, x, y, o = {}) => {
    const size = o.size || 160, dec = o.decimals || 0, num = K.fmtNum(Math.round(value * 10 ** dec) / 10 ** dec, { decimals: dec }), pre = o.prefix || '', suf = o.suffix || '', sf = size * .5, f = F(X, 'head');
    const w1 = K.measure(g, pre + num, { ...f, size }).w, w2 = suf ? K.measure(g, suf, { ...f, size: sf }).w : 0, tot = w1 + w2, x0 = (o.align || 'center') === 'center' ? x - tot / 2 : (o.align === 'right' ? x - tot : x);
    TX(g, pre + num, x0, y, { ...f, size, fill: o.fill || X.T.ink, align: 'left' }); if (suf) TX(g, suf, x0 + w1 + size * .03, y + size * .12, { ...f, size: sf, fill: o.sufFill || o.fill || X.T.ink, align: 'left' });
    return tot;
  };

  /* ───────────────────────── scenes ───────────────────────── */
  const S = MG.scenes = {};
  const tm = (sc, X) => ({ lead: sc.lead ?? .3, step: sc.step ?? X.B / 2 });
  /** Shot scale: a one-second shot cannot run the 2.4-second entrance choreography of a calm scene, so scenes built for ONE idea (hit, fact) compress their entrances to fit
      (k = shot length ÷ 2.8 s, never below .45). audio.mjs uses the same formula, so the sound follows. */
  const shotK = sc => clamp(((sc.end ?? (sc.at + 3)) - sc.at) / (sc.nominal ?? 2.8), .45, 1);
  MG.shotK = shotK;
  /** Tone-on-tone decoration for flood scenes: sunburst · dot grid · diagonal stripes · pulsing rings (colour = the text colour at low alpha). */
  const decor = (g, X, kind, t, fg, ax, ay) => {
    const { W, H, U } = X; g.save();
    if (kind === 'rays') { g.translate(ax, ay); g.rotate(t * .08); g.fillStyle = K.rgba(fg, .07); const R = Math.hypot(W, H); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a, a + TAU / 28); g.closePath(); g.fill(); } }
    else if (kind === 'dots') { const s = 70 * U, ox = (t * 16 * U) % s; g.fillStyle = K.rgba(fg, .17); for (let x = -s + ox; x < W + s; x += s) for (let y = s / 2; y < H + s; y += s) { g.beginPath(); g.arc(x, y, 3.2 * U, 0, TAU); g.fill(); } }
    else if (kind === 'stripes') { g.translate(W / 2, H / 2); g.rotate(-.42); const s = 130 * U, off = (t * 34 * U) % (s * 2); g.fillStyle = K.rgba(fg, .07); for (let x = -W - s * 2 + off; x < W + s * 2; x += s * 2) g.fillRect(x, -H * 1.2, s, H * 2.4); }
    else if (kind === 'rings') { g.strokeStyle = K.rgba(fg, .2); g.lineWidth = 6 * U; for (let q = 0; q < 4; q++) { const p = (((t * .3 + q / 4) % 1) + 1) % 1; g.globalAlpha = 1 - p; g.beginPath(); g.arc(ax, ay, (.12 + p * .95) * Math.max(W, H) * .8, 0, TAU); g.stroke(); } }
    g.restore();
  };
  /** Split one long statement into two balanced lines (the break nearest the middle). */
  const balance = s => { const ws = String(s).split(' '); if (ws.length < 2) return [s]; let best = 1, bd = 1e9; for (let i = 1; i < ws.length; i++) { const d = Math.abs(ws.slice(0, i).join(' ').length - ws.slice(i).join(' ').length); if (d < bd) { bd = d; best = i; } } return [ws.slice(0, best).join(' '), ws.slice(best).join(' ')]; };

  /* title — kicker · big stacked lines · accent underline · sub · avatar / icon with orbiting badges */
  MG.avatar = (g, X, cx, cy, r, text, lt, o = {}) => {
    const { T, U } = X, d = o.delay ?? .2, p = E.outBack(prog(lt, d, d + .8)); if (p <= 0) return; g.save(); g.translate(cx, cy);
    g.save(); g.scale(p, p); soft(g, 0, 0, r * 2.1, T.c, T.light ? .5 : .3);
    g.rotate(lt * .22); g.setLineDash([26 * U, 20 * U]); g.strokeStyle = T.b; g.lineWidth = 7 * U; g.beginPath(); g.arc(0, 0, r * 1.17, 0, TAU); g.stroke(); g.setLineDash([]); g.rotate(-lt * .22);
    g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 60 * U; g.shadowOffsetY = 26 * U; const gp = T.grad || ['a', 'b'], gr = g.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, T[gp[0]]); gr.addColorStop(1, T[gp[1]]); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 8 * U; g.beginPath(); g.arc(0, 0, r * .86, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
    if (o.icon) MG.icon(g, o.icon, 0, 0, r * 1.0, onColor(T.a), E.outCubic(prog(lt, d + .3, d + 1.1)), 1.7); else TX(g, text || '', 0, 0, { ...F(X, 'head'), size: r * .9, fill: onColor(T.a), ink: true });
    g.restore();
    (o.badges || []).forEach((name, i, a) => { const bp = E.outBack(prog(lt, d + .5 + i * .15, d + 1.05 + i * .15)); if (bp <= 0) return; const ang = i * TAU / a.length - 1.1 + lt * .32, rr = r * (X.V ? 1.3 : 1.42), bx = Math.cos(ang) * rr, by = Math.sin(ang) * rr, br = r * .27;
      g.save(); g.translate(bx, by); g.scale(bp, bp); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 30 * U; g.shadowOffsetY = 12 * U; g.fillStyle = T.accents[(i + 2) % 4]; g.beginPath(); g.arc(0, 0, br, 0, TAU); g.fill(); g.shadowBlur = 0; MG.icon(g, name, 0, 0, br * 1.15, onColor(T.accents[(i + 2) % 4]), 1, 1.9); g.restore(); });
    g.restore();
  };
  S.title = (g, lt, t, sc, X) => {
    const { W, H, U, V, T } = X, lines = sc.lines || [sc.text || 'Title'], n = lines.length, hasArt = !!(sc.avatar || sc.icon || sc.art), maxW = V ? W * .86 : W * (hasArt ? .5 : .82);
    const w100 = Math.max(...lines.map(s => textW(g, X, s, 100))), base = (V ? 270 : 230) * U * (n === 1 ? 1.12 : n === 2 ? 1 : .78), size = Math.min(base, maxW / w100 * 100), lh = size * 1.02;
    const kick = sc.kicker, sub = sc.sub, kh = kick ? 74 * U : 0, sh = sub ? 112 * U : 0, uh = 56 * U, total = kh + n * lh + uh + sh, cy = V ? (hasArt ? H * .7 : H * .5) : H * .5, top = cy - total / 2;
    const x0 = V ? W / 2 : W * .085, al = V ? 'center' : 'left';
    if (hasArt) { const ar = (V ? 270 : 270) * U; MG.avatar(g, X, V ? W / 2 : W * .745, V ? H * .235 : H * .5, ar, sc.avatar, lt, { icon: sc.icon, badges: sc.badges, delay: .25 }); }
    if (kick) MG.mask(g, X, kick, x0, top + 22 * U, lt, { size: 36 * U, font: 'body', weight: 800, fill: T.a, align: al, spacing: 7 * U, delay: .15 });
    let lastW = 0; lines.forEach((s, i) => { const r = MG.mask(g, X, s, x0, top + kh + (i + .5) * lh, lt, { size, align: al, fill: i === n - 1 && n > 1 && sc.accentLast !== false ? T.a : T.ink, delay: .25 + i * .12, style: (sc.styles || [])[i] }); lastW = r.w; });
    const uy = top + kh + n * lh + 22 * U, uw = Math.min(lastW || 400 * U, 640 * U), up = E.outExpo(prog(lt, .25 + n * .12 + .1, .25 + n * .12 + .65));
    MG.underline(g, V ? x0 - uw / 2 : x0, uy, uw, up, T.c, 16 * U);
    if (sub) MG.mask(g, X, sub, x0, uy + 62 * U, lt, { size: 50 * U, font: 'body', weight: 600, fill: T.mut, align: al, delay: .25 + n * .12 + .35 });
  };

  /* chips — a row of big accent cards, each with a self-drawing icon */
  S.chips = (g, lt, t, sc, X) => {
    const { W, H, U, V, T } = X, items = sc.items || [], n = items.length, { lead, step } = tm(sc, X), mx = W * (V ? .08 : .085);
    if (sc.title) { MG.mask(g, X, sc.title, mx, H * (V ? .12 : .17), lt, { size: (V ? 110 : 112) * U, fill: T.ink }); MG.underline(g, mx, H * (V ? .12 : .17) + 76 * U, 300 * U, E.outExpo(prog(lt, .55, 1.1)), T.c, 16 * U); }
    const ax = mx, aw = W - mx * 2, ay = V ? H * .24 : H * .36, ah = V ? H * .68 : H * .56, gap = 34 * U;
    items.forEach((it, i) => {
      const st = lead + i * step, p = E.outExpo(prog(lt, st, st + .75)); if (p <= 0) return; const col = T.accents[i % 4], fg = onColor(col);
      const cw = V ? aw : (aw - gap * (n - 1)) / n, ch = V ? (ah - gap * (n - 1)) / n : ah, cx = V ? ax : ax + i * (cw + gap), cy = (V ? ay + i * (ch + gap) : ay) + (1 - p) * H * .22 + Math.sin(t * 1.7 + i * 1.3) * 7 * U * p;
      g.save(); g.translate(cx + cw / 2, cy + ch / 2); g.rotate((1 - p) * (i % 2 ? .1 : -.1)); g.translate(-cw / 2, -ch / 2); g.globalAlpha *= clamp(p * 1.6);
      MG.card(g, X, 0, 0, cw, ch, { fill: col, r: 44 * U }); MG.shine(g, X, 0, 0, cw, ch, 44 * U, t, i);
      const ir = Math.min(cw, ch) * (V ? .2 : .2), ix = V ? ir + 54 * U : cw / 2, iy = V ? ch / 2 : ch * .36;
      g.fillStyle = K.rgba(fg, .16); g.beginPath(); g.arc(ix, iy, ir * 1.28, 0, TAU); g.fill(); MG.icon(g, it.icon || 'star', ix, iy, ir * 1.5, fg, E.outCubic(prog(lt, st + .25, st + .95)), 1.7);
      const tx = V ? ix + ir * 1.28 + 46 * U : cw / 2, al = V ? 'left' : 'center', ty = V ? ch / 2 - (it.note ? 26 * U : 0) : ch * .74;
      TX(g, cap(X, it.label || ''), tx, ty, { ...F(X, 'head'), size: (V ? 64 : 58) * U, fill: fg, align: al, max: V ? cw - tx - 40 * U : cw - 60 * U });
      if (it.note) TX(g, it.note, tx, ty + (V ? 56 : 62) * U, { ...F(X, 'body', 500), size: 32 * U, fill: K.rgba(fg, .8), align: al, max: V ? cw - tx - 40 * U : cw - 60 * U });
      g.restore();
    });
  };

  /* stats — counters in cards */
  S.stats = (g, lt, t, sc, X) => {
    const { W, H, U, V, T } = X, items = sc.items || [], n = items.length, { lead, step } = tm(sc, X), mx = W * (V ? .08 : .085);
    if (sc.title) { MG.mask(g, X, sc.title, mx, H * (V ? .12 : .17), lt, { size: 112 * U }); MG.underline(g, mx, H * (V ? .12 : .17) + 76 * U, 300 * U, E.outExpo(prog(lt, .55, 1.1)), T.c, 16 * U); }
    const ay = V ? H * .24 : H * .36, ah = V ? H * .68 : H * .52, aw = W - mx * 2, gap = 34 * U;
    items.forEach((it, i) => {
      const st = lead + i * step, p = E.outExpo(prog(lt, st, st + .75)); if (p <= 0) return; const col = T.accents[i % 4], cw = V ? aw : (aw - gap * (n - 1)) / n, ch = V ? (ah - gap * (n - 1)) / n : ah, cx = V ? mx : mx + i * (cw + gap), cy = (V ? ay + i * (ch + gap) : ay) + (1 - p) * H * .2;
      g.save(); g.globalAlpha *= clamp(p * 1.8); MG.card(g, X, cx, cy, cw, ch, { r: 44 * U }); MG.shine(g, X, cx, cy, cw, ch, 44 * U, t, i);
      g.fillStyle = col; K.rr(g, cx, cy, cw, 18 * U, [44 * U, 44 * U, 0, 0]); g.fill();
      const v = (it.value ?? 0) * E.outExpo(prog(lt, st + .15, st + 1.6)), size = Math.min((V ? 190 : 200) * U, cw * .5);
      const tx = V ? cx + 70 * U : cx + cw / 2, al = V ? 'left' : 'center', ty = V ? cy + ch * .45 : cy + ch * .44;
      MG.stat(g, X, v, tx, ty, { size, decimals: it.decimals || 0, prefix: it.prefix, suffix: it.suffix, fill: col === T.c && T.light ? T.ink : col, sufFill: T.ink, align: V ? 'left' : 'center' });
      TX(g, it.label || '', tx, ty + size * .72, { ...F(X, 'body', 700), size: (V ? 44 : 40) * U, fill: T.mut, align: al, max: cw - 60 * U });
      if (it.icon) MG.icon(g, it.icon, cx + cw - 66 * U, cy + 78 * U + Math.sin(t * 2 + i) * 4 * U * clamp((p - .9) * 10), 64 * U, col, E.outCubic(prog(lt, st + .3, st + 1)), 1.8);
      g.restore();
    });
  };

  /* quote — big quote mark, wrapped lines that slide up, attribution */
  S.quote = (g, lt, t, sc, X) => {
    const { W, H, U, V, T } = X, flood = sc.flood ? T[sc.flood] || T.a : null, fg = flood ? onColor(flood) : T.ink, mx = W * (V ? .09 : .12), maxW = W - mx * 2 - (V ? 0 : W * .06), len = (sc.text || '').length, size = (len < 60 ? 108 : len < 110 ? 90 : 74) * U * (V ? .82 : 1) * (T.hw === 400 ? 1.28 : 1);
    if (flood) { const cp = E.outExpo(prog(lt, -.1, .6)); g.fillStyle = flood; g.save(); g.beginPath(); g.arc(W / 2, H / 2, Math.hypot(W, H) * .6 * cp, 0, TAU); g.fill(); g.restore(); }
    const lines = MG.lines(g, X, sc.text || '', maxW, size, 'head', 700), lh = size * 1.16, top = H * .5 - (lines.length * lh) / 2 + (V ? 0 : 10 * U);
    g.save(); g.globalAlpha = E.outCubic(prog(lt, .1, .7)) * (flood ? .22 : .85); TX(g, '“', mx - 6 * U, top + size * .12, { family: K.FONTS.serif, weight: 700, size: size * 3.6, fill: flood ? fg : T.a, align: 'left', ink: false }); g.restore();
    lines.forEach((s, i) => MG.mask(g, X, s, mx, top + (i + .5) * lh, lt, { size, weight: 700, fill: fg, delay: .35 + i * .16 }));
    if (sc.who) { const wy = top + lines.length * lh + 70 * U, d = .35 + lines.length * .16 + .15; MG.underline(g, mx, wy - 46 * U, 90 * U, E.outExpo(prog(lt, d, d + .5)), flood ? fg : T.a, 10 * U); MG.mask(g, X, sc.who, mx, wy + 14 * U, lt, { size: 52 * U, weight: 800, fill: fg, delay: d + .1, font: 'head' }); if (sc.role) MG.mask(g, X, sc.role, mx, wy + 70 * U, lt, { size: 36 * U, font: 'body', weight: 600, fill: flood ? K.rgba(fg, .78) : T.mut, delay: d + .2 }); }
  };

  /* list — rows with an icon, a label, a note and a value pill (menus, agendas, speakers, steps) */
  S.list = (g, lt, t, sc, X) => {
    const { W, H, U, V, T } = X, items = sc.items || [], n = items.length, { lead, step } = tm(sc, X), mx = W * (V ? .07 : .1);
    if (sc.kicker) MG.mask(g, X, sc.kicker, mx, H * (V ? .09 : .13), lt, { size: 34 * U, font: 'body', weight: 800, fill: T.a, spacing: 7 * U, delay: .1 });
    if (sc.title) { MG.mask(g, X, sc.title, mx, H * (V ? .15 : .22), lt, { size: (V ? 132 : 118) * U, delay: .15 }); }
    const ay = H * (V ? .25 : .34), ah = H * (V ? .68 : .62), gap = 24 * U, rh = Math.min((ah - gap * (n - 1)) / n, V ? 360 * U : 235 * U), rw = W - mx * 2;
    items.forEach((it, i) => {
      const st = lead + .1 + i * step, p = E.outExpo(prog(lt, st, st + .7)); if (p <= 0) return; const col = T.accents[i % 4], y = ay + i * (rh + gap), dx = (1 - p) * (i % 2 ? 1 : -1) * W * .35;
      const bob = Math.sin(t * 2.2 + i * 1.1) * 3.5 * U * clamp((p - .9) * 10); g.save(); g.translate(dx, 0); g.globalAlpha *= clamp(p * 1.6); MG.card(g, X, mx, y, rw, rh, { r: rh / 2.6 }); MG.shine(g, X, mx, y, rw, rh, rh / 2.6, t, i);
      const ir = rh * (V ? .22 : .3), pad = (V ? 34 : 30) * U, vs = rh * (V ? .25 : .3), vw = it.value ? textW(g, X, it.value, vs, 'head', 800) + vs * 1.1 : 0, tx = mx + pad + ir * 2 + pad, lmax = Math.max(160 * U, rw - (tx - mx) - vw - pad * 2);
      MG.iconDisc(g, X, it.icon || 'star', mx + pad + ir, y + rh / 2 + bob, ir, col, onColor(col), lt, st + .1);
      TX(g, cap(X, it.label || ''), tx, y + rh / 2 - (it.note ? rh * .12 : 0), { ...F(X, 'head', 800), size: rh * (V ? .27 : .36), fill: T.ink, align: 'left', max: lmax });
      if (it.note) TX(g, it.note, tx, y + rh / 2 + rh * .2, { ...F(X, 'body', 500), size: rh * (V ? .15 : .2), fill: T.mut, align: 'left', max: lmax });
      if (it.value) { const pp = E.outBack(prog(lt, st + .3, st + .85)), ph = vs * 1.7; g.save(); g.translate(mx + rw - pad - vw / 2, y + rh / 2 - bob); g.scale(pp, pp); K.rr(g, -vw / 2, -ph / 2, vw, ph, ph / 2); g.fillStyle = col; g.fill(); TX(g, it.value, 0, 2 * U, { ...F(X, 'head', 800), size: vs, fill: onColor(col) }); g.restore(); }
      g.restore();
    });
  };

  /* hit — ONE idea filling the frame: a colour flood, a statement that lands (slam / slide / rise), a ghost copy of it drifting behind, tone-on-tone decoration, an optional icon disc
     and a small caption. The workhorse of a fast film: three skills are three hits of one second each, not a heading above three cards.
     Fields: text (or lines: [..]) · sub · kicker · icon (a disc beside the text; `carried: true` leaves that spot to the carried object) · color 'a'|'b'|'c'|'d' (default: cycles by scene index)
             · layout 'left' (text left, icon right) | 'right' | 'center' (forced in vertical films) · styles ['slideL', 'slam', …] · decor 'rays'|'dots'|'stripes'|'rings' · ghost: false · flood: false (keep the background) */
  S.hit = (g, lt0, t, sc, X) => {
    const { W, H, U, V, T } = X, k = shotK(sc), lt = lt0 / k, i = sc.i || 0, flood = sc.flood === false ? null : (T[sc.color || ['a', 'b', 'c', 'd'][i % 4]] || sc.color), fg = flood ? onColor(flood) : T.ink;
    const hasIcon = !!(sc.icon || sc.carried), layout = V ? 'center' : (sc.layout || (i % 2 ? 'right' : 'left')), C = layout === 'center', dir = layout === 'right' ? -1 : 1, mx = W * (V ? .08 : .075), r = (V ? 270 : C ? 200 : 270) * U, side = hasIcon && !C ? r * 2.1 + 60 * U : 0;
    const icx = C ? W / 2 : dir > 0 ? W - mx - r * 1.05 : mx + r * 1.05, icy = V ? H * .27 : C ? H * .29 : H * .5, maxW = C ? W - mx * 2 : W - mx * 2 - side, tx = C ? W / 2 : dir > 0 ? mx : mx + side, al = C ? 'center' : 'left';
    if (flood) { g.fillStyle = flood; g.fillRect(0, 0, W, H); }
    if (sc.decor !== false) decor(g, X, sc.decor || ['rays', 'dots', 'stripes', 'rings'][i % 4], t, fg, icx, icy);
    if (flood && sc.float !== false) MG.floaters(g, X, t, { seed: 21 + i, n: V ? 6 : 8, colors: [fg], alpha: .26 });
    let lines = (sc.lines || String(sc.text ?? '').split('\n')).map(s => cap(X, String(s)));
    const w100 = ls => Math.max(...ls.map(s => textW(g, X, s, 100))), baseSize = (V ? 300 : C ? 300 : 330) * U, fit = ls => Math.min(baseSize, maxW / w100(ls) * 100);
    if (lines.length === 1 && (V || fit(lines) < baseSize * .8) && /\s/.test(lines[0]) && lines[0].split(' ').length <= 4) lines = balance(lines[0]);      // a tall frame stacks a short phrase
    else if (lines.length === 1 && lines[0].split(' ').length > 4) { const full = lines[0], cap2 = H * (V ? .34 : C ? .3 : .56); for (let sz = baseSize; sz >= 56 * U; sz *= .92) { lines = MG.lines(g, X, full, maxW, sz, 'head'); if (lines.length <= 4 && lines.length * sz * 1.04 <= cap2) break; } }      // a long statement wraps at the largest size that fits (up to four lines)
    const n = lines.length, size = Math.min(fit(lines), H * (V ? .34 : C ? .3 : .56) / (n * 1.04)), lh = size * 1.02, kh = sc.kicker ? 70 * U : 0, sh = sc.sub ? 112 * U : 0, total = kh + n * lh + sh, top = (V ? H * .64 : C ? H * .67 : H * .5) - total / 2;
    if (sc.ghost !== false) { const gs = size * 2.1, gx = (C ? W * .5 : dir > 0 ? W * .55 : W * .45) - (t - sc.at) * 55 * U * dir; g.save(); g.globalAlpha = 1; TX(g, lines.join(' '), gx, H * .5, { ...F(X, 'head'), size: gs, fill: K.rgba(fg, .075), align: 'center' }); g.restore(); }
    if (hasIcon && !sc.carried) { const dp = E.outBack(prog(lt, .15, .8)); g.save(); g.translate(icx, icy); g.scale(dp, dp); g.fillStyle = K.rgba(fg, .16); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); MG.icon(g, sc.icon, 0, 0, r * 1.05, fg, E.outCubic(prog(lt, .3, 1.1)), 1.5); g.restore(); }
    if (sc.kicker) MG.mask(g, X, sc.kicker, tx, top + 24 * U, lt, { size: 34 * U, font: 'body', weight: 800, fill: K.rgba(fg, .72), align: al, spacing: 7 * U, delay: .1 });
    let last = { w: 0, x0: tx };
    lines.forEach((s, j) => { last = MG.mask(g, X, s, tx, top + kh + (j + .5) * lh + size * .08, lt, { size, align: al, fill: fg, delay: .12 + j * .1, caps: false, style: (sc.styles || [])[j] || (n === 1 || j === n - 1 ? 'slam' : layout === 'right' ? 'slideR' : layout === 'center' ? 'rise' : 'slideL') }); });
    const uy = top + kh + n * lh + 6 * U; if (sc.underline !== false && !sc.sub) MG.underline(g, last.x0, uy + 10 * U, Math.min(last.w, 520 * U), E.outExpo(prog(lt, .5, 1)), K.rgba(fg, .85), 14 * U);
    if (sc.sub) MG.mask(g, X, sc.sub, tx, top + kh + n * lh + 66 * U, lt, { size: (V ? 58 : 52) * U, font: 'body', weight: 700, fill: K.rgba(fg, .88), align: al, delay: .55, caps: false });
  };

  /* fact — a colour flood, one big self-drawing icon, one big number, one caption (infographic beat) */
  S.fact = (g, lt0, t, sc, X) => {
    const { W, H, U, V, T } = X, k = shotK(sc), lt = lt0 / k, col = T[sc.color || 'a'] || T.a, fg = onColor(col), flip = !V && sc.layout === 'right', ic = V ? [W / 2, H * .3] : [W * (flip ? .74 : .26), H * .5], r = (V ? 260 : 300) * U;
    const cp = E.outExpo(prog(lt, -.15, .65)); g.fillStyle = col; g.fillRect(0, 0, W, H); // the flood hides the scene background; wipes cover the cut
    MG.sheen(g, X, t, 4.6); g.save(); g.translate(ic[0], ic[1]); g.rotate(t * .1); g.fillStyle = K.rgba(fg, .07); { const R = Math.hypot(W, H); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a, a + TAU / 28); g.closePath(); g.fill(); } } g.restore();
    g.save(); g.globalAlpha = .18; g.fillStyle = fg; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(ic[0], ic[1], r * (1.35 + i * .42) * (.85 + .15 * Math.sin(t * 1.2 - i)), 0, TAU); g.lineWidth = 6 * U; g.strokeStyle = fg; g.stroke(); } g.restore();
    const dp = E.outBack(prog(lt, .15, .8)), bt = Math.exp(-(((t % X.B) / X.B)) * 5.5) * clamp((lt - 1) * 2); { const oa = t * .9, orr = r * 1.35 * (.85 + .15 * Math.sin(t * 1.2)); g.fillStyle = fg; g.globalAlpha = .5 * clamp(lt * 2); g.beginPath(); g.arc(ic[0] + Math.cos(oa) * orr, ic[1] + Math.sin(oa) * orr, 11 * U, 0, TAU); g.fill(); g.globalAlpha = 1; }
    if (!sc.carried) { g.save(); g.translate(ic[0], ic[1]); g.scale(dp * cp * (1 + .045 * bt), dp * cp * (1 + .045 * bt)); g.fillStyle = K.rgba(fg, .16); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); MG.icon(g, sc.icon || 'star', 0, 0, r * 1.1, fg, E.outCubic(prog(lt, .35, 1.2)), 1.5); g.restore(); }
    const ty = V ? H * .56 : H * .4, al = V ? 'center' : 'left', x0 = V ? W / 2 : flip ? W * .075 : W * .5, availW = V ? W * .84 : flip ? W * .56 : W * .43;
    const hasNum = sc.value != null, v = (sc.value ?? 0) * E.outExpo(prog(lt, .5, 1.7)), dec = sc.decimals || 0; let extra = 0;
    if (sc.kicker) MG.mask(g, X, sc.kicker, x0, ty - 150 * U, lt, { size: 34 * U, font: 'body', weight: 800, fill: K.rgba(fg, .75), align: al, spacing: 7 * U, delay: .4 });
    if (hasNum) {                                                                                  // the number scales in, then counts; it shrinks to fit the free width
      const full = (sc.prefix || '') + K.fmtNum(Math.round(sc.value * 10 ** dec) / 10 ** dec, { decimals: dec }), nsz = Math.min((V ? 250 : 300) * U, availW / (textW(g, X, full, 100) + (sc.suffix ? textW(g, X, sc.suffix, 50) : 0)) * 100), np = E.outBack(prog(lt, .1, .6));
      g.save(); g.translate(x0, ty); g.scale(.88 + .12 * np, .88 + .12 * np); g.globalAlpha *= clamp(np * 2.5); MG.stat(g, X, v, 0, 0, { size: nsz, decimals: dec, prefix: sc.prefix, suffix: sc.suffix, fill: fg, align: V ? 'center' : 'left' }); g.restore();
    } else {                                                                                       // a word or a short phrase instead of a number: wrapped to two lines and fitted
      const bsz0 = (V ? 200 : 230) * U, wd = ls => Math.max(...ls.map(s => textW(g, X, s, 100))); let bl = String(sc.big || '').split('\n').map(s => cap(X, s));
      if (bl.length === 1 && availW / wd(bl) * 100 < bsz0 * .6 && /\s/.test(bl[0])) bl = balance(bl[0]); const bsz = Math.min(bsz0, availW / wd(bl) * 100); extra = (bl.length - 1) * bsz * .5;
      bl.forEach((s, j) => MG.mask(g, X, s, x0, ty + (j - (bl.length - 1) / 2) * bsz * 1.02, lt, { size: bsz, fill: fg, align: al, delay: .45 + j * .1, caps: false, style: sc.style }));
    }
    const lines = MG.lines(g, X, sc.text || '', V ? W * .8 : W * .4, (V ? 60 : 62) * U, 'body', 700);
    lines.forEach((s, i) => MG.mask(g, X, s, x0, ty + extra + (V ? 190 : 200) * U + i * 76 * U, lt, { size: (V ? 60 : 62) * U, font: 'body', weight: 700, fill: K.rgba(fg, .92), align: al, delay: .8 + i * .12 }));
  };

  /* chart — bars | ring | line, with a highlighted value */
  S.chart = (g, lt, t, sc, X) => {
    const { W, H, U, V, T } = X, data = sc.data || [], n = data.length, mx = W * (V ? .08 : .085), kind = sc.kind || 'bars', hi = sc.highlight ?? (n - 1);
    if (sc.title) { MG.mask(g, X, sc.title, mx, H * (V ? .12 : .17), lt, { size: 100 * U }); MG.underline(g, mx, H * (V ? .12 : .17) + 70 * U, 300 * U, E.outExpo(prog(lt, .5, 1.1)), T.c, 16 * U); }
    const ax = mx, aw = W - mx * 2, ay = H * (V ? .26 : .34), ah = H * (V ? .56 : .5), mxv = Math.max(...data.map(d => d.value), 1);
    if (kind === 'bars') {
      const gap = 30 * U, bw = Math.min((aw - gap * (n - 1)) / n, 190 * U), x0 = ax + (aw - (bw * n + gap * (n - 1))) / 2;
      g.strokeStyle = T.line; g.lineWidth = 2 * U; for (let k = 0; k <= 3; k++) { g.beginPath(); g.moveTo(ax, ay + ah - ah * k / 3); g.lineTo(ax + aw, ay + ah - ah * k / 3); g.stroke(); }
      data.forEach((d, i) => { const st = .35 + i * .14, p = E.outExpo(prog(lt, st, st + .9)), h = ah * (d.value / mxv) * p * (1 + .012 * Math.sin(t * 2.2 + i * 1.3) * clamp((lt - 1.4) * 2)), x = x0 + i * (bw + gap), col = i === hi ? T.a : (T.light ? T.b : T.accents[1]);
        g.save(); g.shadowColor = K.rgba(col, .35); g.shadowBlur = 30 * U; K.rr(g, x, ay + ah - h, bw, h, [bw * .25, bw * .25, 0, 0]); g.fillStyle = col; g.fill(); g.restore();
        TX(g, d.label || '', x + bw / 2, ay + ah + 46 * U, { ...F(X, 'body', 700), size: 36 * U, fill: T.mut, max: bw + gap - 8 * U });
        if (p > .15) TX(g, K.fmtNum(Math.round(d.value * p)) + (sc.unit || ''), x + bw / 2, ay + ah - h - 34 * U, { ...F(X, 'head', 800), size: 46 * U, fill: i === hi ? T.a : T.ink }); });
    } else if (kind === 'ring') {
      const d = data[0] || { value: 0 }, r = Math.min(aw * (V ? .38 : .2), ah * .5), cx = V ? W / 2 : W * .3, cy = ay + ah / 2, p = E.outExpo(prog(lt, .35, 1.8)), v = d.value * p;
      if (p > .5) { g.save(); g.strokeStyle = T.a; g.lineWidth = 5 * U; for (let q = 0; q < 2; q++) { const pp = (((t * .45 + q * .5) % 1) + 1) % 1; g.globalAlpha = .3 * (1 - pp) * clamp((p - .5) * 3); g.beginPath(); g.arc(cx, cy, r * (1.2 + pp * .55), 0, TAU); g.stroke(); } g.restore(); }   // radar pings: a hold on the ring is never still
      g.lineWidth = r * .22; g.lineCap = 'round'; g.strokeStyle = T.line; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); g.strokeStyle = T.a; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(v / (sc.max || 100)), false); g.stroke();
      if (p > .9) { const ga = t * 1.1 - Math.PI / 2; g.save(); g.fillStyle = T.light ? '#ffffff' : 'rgba(255,255,255,.95)'; g.shadowColor = T.a; g.shadowBlur = 24 * U; g.globalAlpha = .9 * clamp((p - .9) * 10); g.beginPath(); g.arc(cx + Math.cos(ga) * r, cy + Math.sin(ga) * r, r * .075, 0, TAU); g.fill(); g.restore(); }
      MG.stat(g, X, v, cx, cy, { size: r * .78, suffix: sc.unit || '%', fill: T.ink, sufFill: T.mut });
      data.slice(1).forEach((d2, i) => { const st = .9 + i * .16, pp = E.outExpo(prog(lt, st, st + .6)); g.save(); g.globalAlpha *= pp; const lx = V ? mx : W * .55, ly = (V ? cy + r + 120 * U : ay + 40 * U) + i * 116 * U; g.fillStyle = T.accents[(i + 1) % 4]; g.beginPath(); g.arc(lx + 18 * U, ly, 18 * U, 0, TAU); g.fill();
        TX(g, d2.label || '', lx + 60 * U, ly, { ...F(X, 'body', 700), size: 46 * U, fill: T.ink, align: 'left', max: aw * .45 }); TX(g, K.fmtNum(d2.value) + (sc.unit || ''), V ? W - mx : W * .55 + aw * .42, ly, { ...F(X, 'head', 800), size: 52 * U, fill: T.accents[(i + 1) % 4], align: 'right' }); g.restore(); });
    } else {
      const pts = data.map((d, i) => [ax + aw * i / Math.max(1, n - 1), ay + ah - ah * d.value / mxv]), p = E.inOutCubic(prog(lt, .35, 1.8));
      g.strokeStyle = T.line; g.lineWidth = 2 * U; for (let k = 0; k <= 3; k++) { g.beginPath(); g.moveTo(ax, ay + ah - ah * k / 3); g.lineTo(ax + aw, ay + ah - ah * k / 3); g.stroke(); }
      g.save(); g.beginPath(); g.rect(ax - 30 * U, ay - 90 * U, (aw + 60 * U) * p, ah + 300 * U); g.clip(); g.lineWidth = 12 * U; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = T.a; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
      g.lineTo(pts[n - 1][0], ay + ah); g.lineTo(pts[0][0], ay + ah); g.closePath(); g.fillStyle = K.rgba(T.a, .14); g.fill(); g.restore();
      pts.forEach((q, i) => { if (q[0] > ax + aw * p + 1) return; g.fillStyle = i === hi ? T.a : T.card; g.strokeStyle = T.a; g.lineWidth = 7 * U; g.beginPath(); g.arc(q[0], q[1], (i === hi ? 17 : 12) * U, 0, TAU); g.fill(); g.stroke(); TX(g, data[i].label || '', q[0], ay + ah + 50 * U, { ...F(X, 'body', 700), size: 34 * U, fill: T.mut }); });
    }
    if (sc.caption) MG.mask(g, X, sc.caption, mx, H * (V ? .92 : .9), lt, { size: 44 * U, font: 'body', weight: 600, fill: T.mut, delay: 1.2 });
  };

  /* logo — a mark that builds itself from shapes, the name, a tagline, a shine */
  const mark = (g, X, kind, s, p, letter) => {
    const { T, U } = X, grad = () => { const gr = g.createLinearGradient(-s, -s, s, s); gr.addColorStop(0, T.a); gr.addColorStop(1, T.b); return gr; }, ea = E.outBack(clamp(p)), fg = onColor(T.a);
    g.save(); g.scale(ea, ea); g.rotate((1 - clamp(p)) * -.5); g.shadowColor = K.rgba(T.a, .5); g.shadowBlur = 50 * U; g.shadowOffsetY = 16 * U;
    if (kind === 'ring' || kind === 'orbit') { g.lineWidth = s * .2; g.strokeStyle = grad(); g.beginPath(); g.arc(0, 0, s * .72, 0, TAU * clamp(p * 1.2)); g.stroke(); g.shadowBlur = 0; g.fillStyle = T.c; for (let i = 0; i < 2; i++) { const a = p * 3 + i * Math.PI; g.beginPath(); g.arc(Math.cos(a) * s * .72, Math.sin(a) * s * .72, s * .12, 0, TAU); g.fill(); } g.fillStyle = grad(); g.beginPath(); g.arc(0, 0, s * .24, 0, TAU); g.fill(); }
    else { K.rr(g, -s, -s, s * 2, s * 2, s * .46); g.fillStyle = grad(); g.fill(); g.shadowBlur = 0; g.lineCap = 'round'; g.lineJoin = 'round';
      if (kind === 'pulse') { g.strokeStyle = fg; g.lineWidth = s * .13; const pts = [[-.68, 0], [-.3, 0], [-.12, -.5], [.12, .5], [.3, 0], [.68, 0]], k = clamp((p - .25) / .6); g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0] * s, q[1] * s) : g.moveTo(q[0] * s, q[1] * s)); g.setLineDash([s * 4.2, s * 4.2]); g.lineDashOffset = s * 4.2 * (1 - k); g.stroke(); g.setLineDash([]); }
      else if (kind === 'bolt') MG.icon(g, 'bolt', 0, 0, s * 1.35, fg, clamp((p - .2) / .6), 2.2);
      else if (kind === 'play') MG.icon(g, 'play', s * .06, 0, s * 1.2, fg, clamp((p - .2) / .6), 2.2);
      else if (kind === 'letter') TX(g, letter || '?', 0, 0, { ...F(X, 'head'), size: s * 1.5, fill: fg, ink: true });
      else MG.icon(g, kind, 0, 0, s * 1.3, fg, clamp((p - .2) / .6), 2); }
    g.restore();
  };
  S.logo = (g, lt0, t, sc, X) => {
    const lk = clamp(((sc.end ?? sc.at + 4) - sc.at) / 3.4, .6, 1), lt = lt0 / lk;                    // a short logo shot compresses its build (audio.mjs uses the same factor)
    const { W, H, U, V, T } = X, s = (V ? 250 : 200) * U, cx = W / 2, cy = V ? H * .4 : H * .42, bp = prog(lt, .2, 1.2), name = cap(X, sc.name || 'Brand'), nsz = Math.min((V ? 170 : 190) * U, (W * .84) / textW(g, X, name, 100) * 100);
    g.save(); soft(g, cx, cy, s * 3.2, T.a, (T.light ? .35 : .3) * E.outCubic(bp)); g.restore();
    for (let i = 0; i < 3; i++) { const rp = prog(lt, .9 + i * .12, 1.7 + i * .12); if (rp > 0 && rp < 1) { g.save(); g.globalAlpha = (1 - rp) * .5; g.strokeStyle = T.accents[i]; g.lineWidth = 6 * U; g.beginPath(); g.arc(cx, cy, s * (1 + E.outCubic(rp) * (1.2 + i * .35)), 0, TAU); g.stroke(); g.restore(); } }
    if (lt > 2.2) for (let i = 0; i < 2; i++) { const rp = (((lt - 2.2) / 2.4 + i * .5) % 1 + 1) % 1; g.save(); g.globalAlpha = (1 - rp) * .32; g.strokeStyle = T.accents[i]; g.lineWidth = 5 * U; g.beginPath(); g.arc(cx, cy, s * (1.05 + E.outCubic(rp) * 1.1), 0, TAU); g.stroke(); g.restore(); }
    if (sc.mark !== 'none') { const bt = 1 + .05 * Math.exp(-(((t % X.B) / X.B)) * 5.5) * clamp((lt - 1.6) * 2); g.save(); g.translate(cx, cy); g.scale(bt, bt); mark(g, X, sc.mark || 'pulse', s, bp, sc.letter || name[0]); g.restore(); }
    const ny = cy + s + nsz * .78; [...name].forEach((ch, i) => { const q = E.outBack(prog(lt, 1.05 + i * .045, 1.55 + i * .045)); if (q <= 0) return; const w = textW(g, X, ch, nsz), pre = textW(g, X, name.slice(0, i), nsz), all = textW(g, X, name, nsz);
      g.save(); g.translate(cx - all / 2 + pre + w / 2, ny + (1 - q) * 40 * U); g.scale(q, q); g.globalAlpha *= clamp(q * 2); TX(g, ch, 0, 0, { ...F(X, 'head'), size: nsz, fill: T.ink, ink: true }); g.restore(); });
    if (sc.tag) MG.mask(g, X, sc.tag, cx, ny + nsz * .78, lt, { size: 54 * U, font: 'body', weight: 700, fill: T.a, align: 'center', delay: 1.75 });
    const sp = prog(lt < 4.4 ? lt : 1.9 + ((lt - 1.9) % 3), 1.9, 2.5); if (sp > 0 && sp < 1) { g.save(); g.globalAlpha = .55 * Math.sin(sp * Math.PI); g.translate(cx - nsz * 3 + sp * nsz * 6, ny); g.rotate(.4); g.fillStyle = '#fff'; g.fillRect(-18 * U, -nsz, 36 * U, nsz * 2); g.restore(); }
  };

  /* cta — a closing line, a handle in a pulsing pill, a button, confetti */
  S.cta = (g, lt, t, sc, X) => {
    const { W, H, U, V, T } = X, cx = W / 2, hs = ((sc.handle || '').length > 14 ? 96 : 120) * (V ? 1.15 : 1);
    const burst = prog(lt, .25, 1.6); if (burst > 0 && burst < 1) { const R = K.rng(11); for (let i = 0; i < 26; i++) { const a = R() * TAU, sp = (260 + R() * 760) * U, d = E.outCubic(burst) * sp, y0 = H * .46, col = T.accents[i % 4], sz = (12 + R() * 22) * U, rot = R() * TAU + burst * 6;
      g.save(); g.globalAlpha = 1 - E.inCubic(burst); g.translate(cx + Math.cos(a) * d, y0 + Math.sin(a) * d + burst * burst * 160 * U); g.rotate(rot); g.fillStyle = col; if (i % 3 === 0) { g.beginPath(); g.arc(0, 0, sz / 2, 0, TAU); g.fill(); } else g.fillRect(-sz / 2, -sz / 4, sz, sz / 2); g.restore(); } }
    const lsz = (V ? 140 : 135) * U * (T.hw === 400 ? 1.25 : 1), hl = sc.line ? MG.lines(g, X, cap(X, sc.line), W * .84, lsz, 'head') : [], hb = Math.max(0, hl.length - 1) * lsz * 1.12, y1 = H * (V ? .27 : .26) - (hl.length > 1 ? hb * .35 : 0);
    hl.forEach((s, i) => MG.mask(g, X, s, cx, y1 + i * lsz * 1.12, lt, { size: lsz, align: 'center', delay: .2 + i * .12, caps: false }));
    const py = Math.max(H * (V ? .5 : .56), hl.length ? y1 + hb + lsz * .5 + 50 * U + hs * U * .775 : 0), pp = E.outBack(prog(lt, .55, 1.2)); if (pp > 0 && sc.handle !== false) { const f = { ...F(X, 'head'), size: hs * U }, w = K.measure(g, sc.handle || '', f).w + 130 * U, h = hs * U * 1.55;
      g.save(); g.translate(cx, py); g.scale(pp, pp); const pulse = .5 + .5 * Math.sin(lt * 4.2); g.strokeStyle = K.rgba(T.a, .4 * (1 - pulse)); g.lineWidth = 8 * U; K.rr(g, -w / 2 - pulse * 40 * U, -h / 2 - pulse * 40 * U, w + pulse * 80 * U, h + pulse * 80 * U, h); g.stroke();
      g.shadowColor = K.rgba(T.a, .5); g.shadowBlur = 50 * U; g.shadowOffsetY = 18 * U; K.rr(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = T.a; g.fill(); g.shadowBlur = 0; TX(g, sc.handle || '', 0, 3 * U, { ...f, fill: onColor(T.a) }); g.restore(); }
    if (sc.sub) MG.mask(g, X, sc.sub, cx, py + (V ? 210 : 170) * U, lt, { size: (V ? 62 : 52) * U, font: 'body', weight: 600, fill: T.mut, align: 'center', delay: 1.0 });
    if (sc.button) { const bp = E.outBack(prog(lt, 1.35, 1.9)); if (bp > 0) { const f = { ...F(X, 'body', 800), size: (V ? 62 : 48) * U }, w = K.measure(g, sc.button, f).w + 130 * U, h = (V ? 140 : 108) * U; g.save(); g.translate(cx, H * (V ? .78 : .84)); g.scale(bp, bp); K.rr(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = T.ink; g.fill(); TX(g, sc.button, 0, 2 * U, { ...f, fill: T.light ? '#fff' : T.bg }); g.restore(); } }
  };

  /* words — rapid full-frame words on colour floods (energy between the calm scenes) */
  S.words = (g, lt, t, sc, X) => {
    const { W, H, U, V, T } = X, words = sc.words || [], n = words.length, per = sc.step ?? X.B, i = clamp(Math.floor(lt / per), 0, n - 1), local = lt - i * per, col = T.accents[(i + (sc.shift || 0)) % 4];
    g.fillStyle = col; g.fillRect(0, 0, W, H); const fg = onColor(col), w = cap(X, words[i] || ''), size = Math.min((V ? 300 : 340) * U, (W * .88) / textW(g, X, w, 100) * 100);
    g.save(); g.fillStyle = K.rgba(fg, .12); for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(W * (.2 + .2 * k), H * (.25 + .5 * ((k * 37 + i * 13) % 5) / 5), (60 + k * 24) * U * (1 + local), 0, TAU); g.fill(); } g.restore();
    const p = E.outBack(prog(local, 0, .28)); g.save(); g.translate(W / 2, H / 2); g.scale(.7 + .3 * p, .7 + .3 * p); g.rotate((1 - p) * (i % 2 ? .08 : -.08)); g.globalAlpha *= clamp(p * 3); TX(g, w, 0, 0, { ...F(X, 'head'), size, fill: fg, ink: true }); g.restore();
    if (sc.sub && i === n - 1) MG.mask(g, X, sc.sub, W / 2, H * .72, local, { size: 54 * U, font: 'body', weight: 700, fill: K.rgba(fg, .85), align: 'center', delay: .25 });
  };

  /* ───────────────────────── continuity: easing curves, camera-travel transitions, a carried object ───────────────────────── */
  /** cubic-bezier(x1, y1, x2, y2) easing — the same curve language designers use in After Effects / CSS. */
  const bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t, dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => { x = clamp(x); let t = x; for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-5) break; const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; } return sy(clamp(t)); };
  };
  /** One curve per kind of move: entrances decelerate hard, exits accelerate and travel less, a whip winds up and settles, a settle eases in softly. */
  MG.ease = { bezier, enter: bezier(.16, 1, .3, 1), exit: bezier(.7, 0, .84, 0), whip: bezier(.62, -.14, .18, 1), settle: bezier(.2, .7, .1, 1), io: bezier(.65, 0, .35, 1) };
  const TRDUR = { whip: .7, push: .7, zoom: .75, iris: .8, blinds: .65, cut: 0 };
  const hexLerp = (a, b, q) => { const A = K.rgb(a), B = K.rgb(b); return `rgb(${Math.round(lerp(A[0], B[0], q))},${Math.round(lerp(A[1], B[1], q))},${Math.round(lerp(A[2], B[2], q))})`; };

  /** The carried object: ONE shape that lives above the scenes and never unmounts — it travels, resizes and changes colour/content between scenes, so the eye follows it instead of re-reading a new slide.
      spec.carry = { fill: 'a', fill2?: 'c', keys: [ { at, dur?, x, y, size, w?, h?, r?, rot?, fill?, letter?|icon?|text? }, … ] }  (x, y = fractions of the frame; size/w/h/r = fractions of min(W, H);
      the first key is where it appears, every later key is a move that starts at `at`, takes `dur` (default .75 s) and ends in that state). */
  const cdist = (a, b) => { const A = K.rgb(a), B = K.rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  const makeCarry = (spec, X, bgAt) => {
    const C = spec.carry; if (!C || !(C.keys || []).length) return null;
    const keys = C.keys.map(k => ({ dur: .75, rot: 0, ...k })).sort((a, b) => a.at - b.at), { W, H, U, T } = X, M = Math.min(W, H);
    const col = c => c == null ? T.a : (T[c] || c);
    const geom = k => { const w = (k.w ?? k.size ?? .2) * M, h = (k.h ?? k.size ?? k.w ?? .2) * M; return { x: k.x * W, y: k.y * H, w, h, r: (k.r != null ? k.r * M : Math.min(w, h) / 2), rot: k.rot || 0, fill: col(k.fill ?? C.fill), fill2: col(k.fill2 ?? C.fill2 ?? T.c) }; };
    const gk = keys.map(geom);
    const state = t => {
      let i = 0; while (i + 1 < keys.length && t >= keys[i + 1].at) i++;
      const k = keys[i], G = gk[i], prev = i > 0 ? gk[i - 1] : null;
      if (!prev) { const q = MG.ease.enter(prog(t, k.at, k.at + k.dur)), pop = E.outBack(prog(t, k.at, k.at + k.dur * .9)); return { ...G, a: clamp(q * 3), s: Math.max(0, pop), label: k, label2: null, mix: 1, moving: 0, vx: 0, vy: 0 }; }
      const q = prog(t, k.at, k.at + k.dur), e = MG.ease.whip(q), P = prev, mix = x => lerp(P[x], G[x], e);
      const st = { x: mix('x'), y: mix('y'), w: mix('w'), h: mix('h'), r: mix('r'), rot: mix('rot'), fill: hexLerp(P.fill, G.fill, clamp(e)), fill2: hexLerp(P.fill2, G.fill2, clamp(e)), a: 1, s: 1, label: k, label2: keys[i - 1], mix: clamp((q - .35) / .3), moving: q > 0 && q < 1 ? 1 : 0 };
      const e2 = MG.ease.whip(clamp(q + .02)), dt = .02 * k.dur; st.vx = (lerp(P.x, G.x, e2) - lerp(P.x, G.x, e)) / dt; st.vy = (lerp(P.y, G.y, e2) - lerp(P.y, G.y, e)) / dt;   // px per second
      return st;
    };
    const draw = (g, X2, t) => {
      const S0 = state(t); if (S0.a <= 0 || S0.s <= 0) return; const sp = Math.hypot(S0.vx, S0.vy), ang = Math.atan2(S0.vy, S0.vx), str = 1 + clamp(sp / (W * 4.2), 0, .3);
      const bgc = bgAt ? bgAt(t) : null; if (bgc) { if (cdist(S0.fill, bgc) < 105) S0.fill = [...T.accents, T.ink, '#ffffff'].find(c => cdist(c, bgc) >= 150) || (lum(bgc) > .5 ? T.ink : '#ffffff'); if (cdist(S0.fill2, bgc) < 105) S0.fill2 = S0.fill; }   // a badge never vanishes into a flood of its own colour
      const bt = Math.exp(-(((t % X.B) / X.B)) * 5.5) * (S0.moving ? 0 : 1), idle = S0.moving ? 0 : Math.sin(t * 1.9) * 4 * U;
      g.save(); g.globalAlpha *= S0.a; g.translate(S0.x, S0.y + idle); g.rotate(S0.rot); g.scale(S0.s * (1 + .04 * bt), S0.s * (1 + .04 * bt));
      if (S0.moving) { g.rotate(ang - S0.rot); g.scale(str, 1 / Math.sqrt(str)); g.rotate(-(ang - S0.rot)); }
      g.shadowColor = 'rgba(10,8,30,.35)'; g.shadowBlur = 46 * U; g.shadowOffsetY = 18 * U; K.rr(g, -S0.w / 2, -S0.h / 2, S0.w, S0.h, S0.r); const gr = g.createLinearGradient(-S0.w / 2, -S0.h / 2, S0.w / 2, S0.h / 2); gr.addColorStop(0, S0.fill); gr.addColorStop(1, S0.fill2); g.fillStyle = gr; g.fill(); g.shadowBlur = 0; g.shadowOffsetY = 0;
      if (Math.min(S0.w, S0.h) > 40 * U) {                                                          // a gloss: an arc on a disc, a thin line along the top edge once the shape stretches into a pill
        const mn = Math.min(S0.w, S0.h), pill = clamp((Math.max(S0.w, S0.h) / mn - 1.1) / .5); g.save(); K.rr(g, -S0.w / 2, -S0.h / 2, S0.w, S0.h, S0.r); g.clip(); g.lineWidth = mn * .035; g.lineCap = 'round';
        if (pill < 1) { g.strokeStyle = `rgba(255,255,255,${.35 * (1 - pill)})`; g.beginPath(); g.arc(0, 0, mn * .38, -Math.PI * .85, -Math.PI * .2); g.stroke(); }
        if (pill > 0) { g.strokeStyle = `rgba(255,255,255,${.34 * pill})`; g.beginPath(); g.moveTo(-S0.w * .3, -S0.h / 2 + mn * .13); g.lineTo(S0.w * .3, -S0.h / 2 + mn * .13); g.stroke(); }
        g.restore(); }
      const fg = onColor(S0.fill), put = (k, alpha) => { if (!k || alpha <= .01) return; g.save(); g.globalAlpha *= alpha; const sz = Math.min(S0.w, S0.h);
        if (k.icon) MG.icon(g, k.icon, 0, 0, sz * .56, fg, 1, 1.7); else if (k.letter || k.text) TX(g, k.letter || k.text, 0, 0, { ...F(X, 'head'), size: k.ts != null ? k.ts * Math.min(W, H) : k.text ? Math.min(sz * .5, S0.w / (String(k.text).length * .62)) : sz * .46, fill: fg, ink: true }); g.restore(); };
      if (S0.label2) { put(S0.label2, 1 - S0.mix); put(S0.label, S0.mix); } else put(S0.label, 1);
      g.restore();
    };
    return { state, draw, at: t => { const s = state(t); return { x: s.x, y: s.y }; } };
  };

  /* ───────────────────────── the film: scheduling, camera, transitions ───────────────────────── */
  MG.film = (spec, o) => {
    MG.mirror = spec.dir ? spec.dir === 'rtl' : /^(fa|ar|he|ur)/i.test(spec.lang || ''); MG.fa = spec.digits ? spec.digits === 'fa' : /^fa/i.test(spec.lang || '');
    const W = o.W, H = o.H, T = MG.theme(spec.theme), B = 60 / (spec.bpm || 120), U = Math.min(W, H) / 1080, V = H > W * 1.05, X = { W, H, U, V, T, B, spec };
    const dur = spec.duration, beats = Array.from({ length: Math.ceil(spec.duration / B) + 1 }, (_, i) => i * B), scenes = spec.scenes.map((s, i, a) => ({ ...s, i, at: s.at ?? 0, end: a[i + 1]?.at ?? dur })), hits = [...scenes.map(s => s.at), ...(spec.hits || [])], wd = spec.wipeDur ?? .5;
    const themeFor = sc => { const c = sc.bgColor; if (!c) return T; const col = T[c] || (c === 'ink' ? T.ink : c), fg = onColor(col), l = lum(col) > .5, Ts = { ...T, bg: col, bg2: col, ink: fg, mut: K.rgba(fg, .72), light: l, card: l ? '#ffffff' : 'rgba(255,255,255,.12)', line: K.rgba(fg, .22) };
      for (const k of ['a', 'b', 'c', 'd']) if (T[k] === col) Ts[k] = T.ink; Ts.accents = [Ts.a, Ts.b, Ts.c, Ts.d]; return Ts; };
    const at = t => { let i = scenes.length - 1; while (i > 0 && t < scenes[i].at) i--; return i; };
    const bgOfScene = (sc, t) => { const FL = sc.flood !== false; if (sc.type === 'fact' && FL) return T[sc.color || 'a'] || T.a; if (sc.type === 'hit' && FL) return T[sc.color || ['a', 'b', 'c', 'd'][sc.i % 4]] || sc.color; if (sc.type === 'words') { const per = sc.step ?? B, n = (sc.words || []).length, w = clamp(Math.floor((t - sc.at) / per), 0, Math.max(0, n - 1)); return T.accents[(w + (sc.shift || 0)) % 4]; } return themeFor(sc).bg; };
    const bgAtT = t => { const j = at(t), s = scenes[j], c1 = bgOfScene(s, t); if (j === 0) return c1; const q = clamp((t - (s.at - .15)) / .4); return q >= 1 ? c1 : hexLerp(bgOfScene(scenes[j - 1], t), c1, q); };
    const carry = makeCarry(spec, X, bgAtT);
    /** the transition INTO scene j: a camera whip / push (both scenes travel on one strip), a zoom-through, an iris or blinds reveal (the next scene is visible inside the shape), a punch-in cut — or a legacy colour wipe (cover) */
    const COVERS = ['stripes', 'circle', 'slide', 'flood', 'blocks', 'diagonal'];
    const trOf = j => { const s = scenes[j], raw = s.transition ?? (s.wipe ? null : spec.transition);
      if (raw) { const kind = String(raw); return { kind, dur: s.transitionDur ?? (COVERS.includes(kind) ? wd : TRDUR[kind]) ?? .7, cover: COVERS.includes(kind) }; }
      const w = s.wipe || spec.wipe; if (w) return { kind: w, dur: s.transitionDur ?? wd, cover: true };
      return { kind: V ? 'push' : 'whip', dur: s.transitionDur ?? .7, cover: false }; };
    /** one scene as a full-frame panel: camera drift + punches, background, floaters, the scene itself (local time lt = t − scene.at, negative while the panel is still arriving) */
    const panel = (g, i, t) => {
      const sc = scenes[i], lt = t - sc.at, fn = S[sc.type] || S.custom; if (!fn) throw new Error('unknown scene type "' + sc.type + '"');
      const qz = clamp(lt / Math.max(.5, sc.end - sc.at)), pz = sc.push ?? (i % 2 ? .02 : .034);          // the camera breathes through every shot: a push-in (or, with a negative push, a pull-out)
      g.save(); K.camera(g, W, H, { zoom: (1 + (pz >= 0 ? pz * qz : -pz * (1 - qz)) + .01 * Math.sin(t * .5)) * K.punch(t, hits, { amp: .012, decay: .2 }) * (1 + (spec.beatPulse ?? .006) * K.pulse(t, beats, .16, 1)), x: Math.sin(t * .7) * 3 * U, y: Math.cos(t * .6) * 3 * U });
      if (MG.mirror) { g.translate(W, 0); g.scale(-1, 1); }
      const Ts = themeFor(sc), Xs = Ts === T ? X : { ...X, T: Ts };
      const flooded = ['fact', 'words', 'hit'].includes(sc.type) && sc.flood !== false;                    // these scenes paint their own full-frame colour
      MG.bg(g, Xs, t, sc.bgColor ? 'flat' : sc.bg); if (!flooded) MG.sheen(g, Xs, t); if (sc.float !== false && !flooded) MG.floaters(g, Xs, t, { seed: 3 + i, n: V ? 9 : 12 });
      fn(g, lt, t, sc, Xs); g.restore();
    };
    const boxed = (g, dx, dy, sc_, fx, fy, fn) => { g.save(); g.translate(dx, dy); if (sc_ !== 1) { g.translate(fx, fy); g.scale(sc_, sc_); g.translate(-fx, -fy); } g.beginPath(); g.rect(0, 0, W, H); g.clip(); fn(); g.restore(); };
    const focusOf = (j, t) => { const s = scenes[j]; if (s.focus) return [s.focus[0] * W, s.focus[1] * H]; if (carry) { const c = carry.at(t); return [MG.mirror ? W - c.x : c.x, c.y]; } return [W / 2, H / 2]; };
    function transition(g, j, t, tr) {
      const o2 = j - 1, p = clamp((t - (scenes[j].at - tr.dur / 2)) / tr.dur), sgn = MG.mirror ? -1 : 1, bgOf = i => themeFor(scenes[i]).bg;
      if (tr.kind === 'whip' || tr.kind === 'push') {
        const e = MG.ease.whip(p), L = V ? H : W, dip = 1 - .04 * Math.sin(Math.PI * clamp(p)), off = V ? [0, L] : [L * sgn, 0];
        g.fillStyle = bgOf(o2); g.fillRect(0, 0, W, H);
        boxed(g, -off[0] * .55 * e, -off[1] * .55 * e, dip, W / 2, H / 2, () => panel(g, o2, t));
        const ix = off[0] * (1 - e), iy = off[1] * (1 - e);            // the incoming panel casts a soft shadow on the outgoing one along its leading edge
        if (p > .02 && p < .98) { const sh = 90 * U, a = .34 * Math.sin(Math.PI * clamp(p)); g.save(); if (!V) { const edge = sgn > 0 ? ix : ix + W, gr = g.createLinearGradient(edge, 0, edge - sgn * sh, 0); gr.addColorStop(0, `rgba(8,6,24,${a})`); gr.addColorStop(1, 'rgba(8,6,24,0)'); g.fillStyle = gr; g.fillRect(Math.min(edge, edge - sgn * sh), 0, sh, H); }
          else { const gr = g.createLinearGradient(0, iy, 0, iy - sh); gr.addColorStop(0, `rgba(8,6,24,${a})`); gr.addColorStop(1, 'rgba(8,6,24,0)'); g.fillStyle = gr; g.fillRect(0, iy - sh, W, sh); } g.restore(); }
        boxed(g, ix, iy, dip, W / 2, H / 2, () => panel(g, j, t));
      } else if (tr.kind === 'zoom') {
        const e = MG.ease.io(p), [fx, fy] = focusOf(j, scenes[j].at); g.fillStyle = bgOf(j); g.fillRect(0, 0, W, H);
        boxed(g, 0, 0, .78 + .22 * MG.ease.enter(p), fx, fy, () => { g.globalAlpha = clamp((p - .12) / .55); panel(g, j, t); });
        boxed(g, 0, 0, 1 + 1.1 * e * e, fx, fy, () => { g.globalAlpha = 1 - clamp((p - .3) / .55); panel(g, o2, t); });
      } else if (tr.kind === 'iris') {
        const e = MG.ease.io(p), [fx, fy] = focusOf(j, scenes[j].at), R = Math.hypot(Math.max(fx, W - fx), Math.max(fy, H - fy)) * 1.04;
        boxed(g, 0, 0, 1 - .035 * e, fx, fy, () => panel(g, o2, t));
        g.save(); g.beginPath(); g.arc(fx, fy, Math.max(.001, R * e), 0, TAU); g.clip(); boxed(g, 0, 0, 1.07 - .07 * e, fx, fy, () => panel(g, j, t)); g.restore();
        g.save(); g.strokeStyle = themeFor(scenes[j]).a; g.globalAlpha = 1 - p; g.lineWidth = 14 * U * (1 - p) + 2; g.beginPath(); g.arc(fx, fy, Math.max(.001, R * e), 0, TAU); g.stroke(); g.restore();
      } else if (tr.kind === 'blinds') {
        const n = V ? 5 : 7; boxed(g, 0, 0, 1, W / 2, H / 2, () => panel(g, o2, t));
        g.save(); g.beginPath(); for (let k = 0; k < n; k++) { const q = MG.ease.io(clamp((p - k * .05) / .6)); const bw = (V ? H : W) / n, up = k % 2 === 0; if (!V) g.rect(k * bw, up ? 0 : H * (1 - q), bw + 1, H * q); else g.rect(up ? 0 : W * (1 - q), k * bw, W * q, bw + 1); }
        g.clip(); panel(g, j, t); g.restore();
      } else panel(g, j, t);
    }
    function draw(g, t) {
      const i = at(t); let j = -1, tr = null;
      for (const c of [i, i + 1]) { if (c < 1 || c >= scenes.length) continue; const T2 = trOf(c); if (!T2.cover && T2.kind !== 'cut' && T2.dur > 0 && Math.abs(t - scenes[c].at) < T2.dur / 2) { j = c; tr = T2; break; } }
      if (j >= 0) transition(g, j, t, tr);
      else if (i > 0 && trOf(i).kind === 'cut' && t - scenes[i].at < .4) { const d = t - scenes[i].at; boxed(g, 0, 0, 1 + .07 * Math.exp(-d / .09), W / 2, H / 2, () => panel(g, i, t)); }
      else panel(g, i, t);
      if (carry) { g.save(); if (MG.mirror) { g.translate(W, 0); g.scale(-1, 1); } carry.draw(g, X, t); g.restore(); }
      for (const c of [i, i + 1]) { if (c < 1 || c >= scenes.length) continue; const T2 = trOf(c); if (!T2.cover) continue; const p = (t - (scenes[c].at - T2.dur / 2)) / T2.dur; if (p > 0 && p < 1) MG.wipe(g, X, p, T2.kind); }
    }
    return { X, scenes, hits, draw, B, T, carry };
  };
})();
