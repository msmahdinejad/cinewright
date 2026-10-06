/* ui.js — product-explainer building blocks drawn on canvas 2D (needs kit.js). Classic script → window.UI.
   Windows, browser, phone, buttons, toggles, inputs, chat, code/terminal typing, cursor with click ripples, toasts, charts, icons.
   Every function is pure in (time, params): pass the local time `t` (seconds) and it draws that instant.
   Text goes through K.text, so Persian/Arabic labels are shaped and right-to-left automatically. */
(() => {
  'use strict';
  const { clamp, lerp, prog, E, rr, rgba, mix } = K, TAU = Math.PI * 2, UI = {}; window.UI = UI;
  UI.theme = { bg: '#0f1117', panel: '#171a23', panel2: '#1e2230', line: 'rgba(255,255,255,.09)', ink: '#f2f3f8', muted: '#8b90a3', accent: '#6e5bff', accent2: '#3de0d0', ok: '#37d67a', warn: '#ffb020', bad: '#ff5a67' };
  const T = () => UI.theme;

  /** Design UI at a comfortable "screen" size (e.g. 1000×620 units, 15–30 px fonts), then scale it to fill w pixels of the video frame.
      draw(dw, dh, k) receives the design size and the scale factor k; convert points with x + designX * k (cursor paths need frame coordinates). */
  UI.fit = (g, x, y, w, dw, dh, draw) => { const k = w / dw; g.save(); g.translate(x, y); g.scale(k, k); draw(dw, dh, k); g.restore(); return k; };

  /* ───────── containers ───────── */
  /** macOS-style window. Returns the content rect {x,y,w,h}. */
  UI.window = (g, x, y, w, h, { title = '', radius = 16, bar = 46, shadow = true, fill } = {}) => {
    g.save(); if (shadow) { g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 60; g.shadowOffsetY = 30; }
    rr(g, x, y, w, h, radius); g.fillStyle = fill || T().panel; g.fill(); g.restore();
    g.save(); rr(g, x, y, w, h, radius); g.clip(); g.fillStyle = T().panel2; g.fillRect(x, y, w, bar);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + 24 + i * 22, y + bar / 2, 6.5, 0, TAU); g.fill(); });
    if (title) K.text(g, title, x + w / 2, y + bar / 2, { size: 15, weight: 600, fill: T().muted });
    g.restore(); g.strokeStyle = T().line; g.lineWidth = 1.5; rr(g, x + .75, y + .75, w - 1.5, h - 1.5, radius); g.stroke();
    return { x, y: y + bar, w, h: h - bar };
  };
  /** Browser: tab strip + address bar. Returns the page rect. */
  UI.browser = (g, x, y, w, h, { url = 'example.com', tabs = ['New tab'], active = 0, radius = 16 } = {}) => {
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 60; g.shadowOffsetY = 30; rr(g, x, y, w, h, radius); g.fillStyle = '#0d0f14'; g.fill(); g.restore();
    g.save(); rr(g, x, y, w, h, radius); g.clip(); g.fillStyle = '#1b1e27'; g.fillRect(x, y, w, 46);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + 22 + i * 20, y + 23, 6, 0, TAU); g.fill(); });
    tabs.forEach((tb, i) => { const tx = x + 100 + i * 230; rr(g, tx, y + 9, 216, 37, [10, 10, 0, 0]); g.fillStyle = i === active ? '#2a2e3b' : 'transparent'; g.fill(); K.text(g, tb, tx + 16, y + 28, { size: 14, weight: 500, fill: i === active ? T().ink : T().muted, align: 'left', max: 180 }); });
    g.fillStyle = '#2a2e3b'; g.fillRect(x, y + 46, w, 46); rr(g, x + 110, y + 54, w - 170, 30, 15); g.fillStyle = '#171a23'; g.fill();
    K.text(g, url, x + 150, y + 69, { size: 14, weight: 500, fill: T().muted, align: 'left', dir: 'ltr' });
    UI.icon(g, 'lock', x + 130, y + 69, 10, T().muted); g.restore(); g.strokeStyle = T().line; g.lineWidth = 1.5; rr(g, x + .75, y + .75, w - 1.5, h - 1.5, radius); g.stroke();
    return { x, y: y + 92, w, h: h - 92 };
  };
  /** Phone frame with rounded screen. Returns the screen rect. */
  UI.phone = (g, x, y, h, { ratio = .49, color = '#0b0c10', notch = true } = {}) => {
    const w = h * ratio, r = w * .16, p = w * .035; g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 70; g.shadowOffsetY = 34; rr(g, x, y, w, h, r); g.fillStyle = color; g.fill(); g.restore();
    g.strokeStyle = '#3a3e4c'; g.lineWidth = 3; rr(g, x + 1.5, y + 1.5, w - 3, h - 3, r); g.stroke();
    if (notch) { rr(g, x + w / 2 - w * .17, y + p * 1.6, w * .34, p * 2.4, p * 1.2); g.fillStyle = '#000'; g.fill(); }
    return { x: x + p, y: y + p, w: w - 2 * p, h: h - 2 * p, r: r - p };
  };
  UI.card = (g, x, y, w, h, { radius = 20, fill, stroke = true, shadow = true } = {}) => { g.save(); if (shadow) { g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 40; g.shadowOffsetY = 16; } rr(g, x, y, w, h, radius); g.fillStyle = fill || T().panel; g.fill(); g.restore(); if (stroke) { g.strokeStyle = T().line; g.lineWidth = 1.5; rr(g, x + .75, y + .75, w - 1.5, h - 1.5, radius); g.stroke(); } };

  /* ───────── controls ───────── */
  UI.button = (g, x, y, w, h, label, { primary = true, press = 0, hover = 0, radius, color, size = h * .4 } = {}) => {
    const c = color || (primary ? T().accent : T().panel2), r = radius ?? h / 2; g.save(); g.translate(x + w / 2, y + h / 2); g.scale(1 - .05 * press, 1 - .05 * press); g.translate(-w / 2, -h / 2);
    if (primary) { g.shadowColor = rgba(c, .5 + .3 * hover); g.shadowBlur = 24 + 20 * hover; g.shadowOffsetY = 8; }
    rr(g, 0, 0, w, h, r); g.fillStyle = mix(c, '#ffffff', .12 * hover); g.fill(); g.shadowColor = 'transparent'; if (!primary) { g.strokeStyle = T().line; g.lineWidth = 1.5; g.stroke(); }
    K.text(g, label, w / 2, h / 2, { size, weight: 700, fill: primary ? '#fff' : T().ink, max: w * .86 }); g.restore();
  };
  UI.toggle = (g, x, y, on, { w = 84, h = 48, color } = {}) => {
    const p = E.outBack(clamp(on)), c = color || T().accent2; rr(g, x, y, w, h, h / 2); g.fillStyle = mix('#3a3f52', c, clamp(on)); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(lerp(x + h / 2, x + w - h / 2, p), y + h / 2, h / 2 - 5, 0, TAU); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 8; g.fill(); g.shadowBlur = 0;
  };
  UI.slider = (g, x, y, w, v, { h = 8, color } = {}) => { const c = color || T().accent2; rr(g, x, y - h / 2, w, h, h / 2); g.fillStyle = '#2b2f40'; g.fill(); rr(g, x, y - h / 2, Math.max(h, w * clamp(v)), h, h / 2); g.fillStyle = c; g.fill(); g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 10; g.beginPath(); g.arc(x + w * clamp(v), y, h * 1.6, 0, TAU); g.fill(); g.shadowBlur = 0; };
  UI.progress = (g, x, y, w, v, { h = 10, color } = {}) => { rr(g, x, y, w, h, h / 2); g.fillStyle = '#2b2f40'; g.fill(); if (v > 0) { rr(g, x, y, Math.max(h, w * clamp(v)), h, h / 2); g.fillStyle = K.gradient(g, x, 0, x + w, 0, [[0, color || T().accent], [1, T().accent2]]); g.fill(); } };
  UI.input = (g, x, y, w, h, text, { placeholder = '', focus = 0, caret = false, t = 0, size = h * .38 } = {}) => {
    rr(g, x, y, w, h, 14); g.fillStyle = '#12141c'; g.fill(); g.strokeStyle = mix('#2b2f40', T().accent, clamp(focus)); g.lineWidth = 2; g.stroke();
    const rtl = K.dirOf(text || placeholder) === 'rtl', ax = rtl ? x + w - 18 : x + 18, r = K.text(g, text || placeholder, ax, y + h / 2, { size, weight: 500, fill: text ? T().ink : T().muted, align: rtl ? 'right' : 'left', max: w - 36 });
    if (caret && Math.floor(t * 2) % 2 === 0) { const cx = rtl ? r.x0 - 3 : r.x1 + 3; g.fillStyle = T().accent2; g.fillRect(cx, y + h * .22, 2.5, h * .56); }
  };
  UI.pill = (g, x, y, text, { color, size = 20, pad = 16 } = {}) => { const m = K.measure(g, text, { size, weight: 700 }), w = m.w + pad * 2, h = size * 1.9; rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = rgba(color || T().accent, .18); g.fill(); g.strokeStyle = rgba(color || T().accent, .55); g.lineWidth = 1.5; g.stroke(); K.text(g, text, x, y, { size, weight: 700, fill: color || T().accent }); return { w, h }; };
  UI.avatar = (g, x, y, r, name = '?', color) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = color || K.oklch(.62, .16, (name.charCodeAt(0) * 47) % 360); g.fill(); K.text(g, [...name][0].toUpperCase(), x, y, { size: r * 1.05, weight: 800, fill: '#fff' }); };

  /* ───────── typing & content ───────── */
  const KW = /\b(const|let|var|function|return|if|else|for|while|import|from|export|async|await|def|class|new|true|false|null|None|True|False|in|of|=>)\b/;
  UI.tokenize = line => { const out = []; let rest = line; const rules = [[/^\s+/, null], [/^(\/\/.*|#.*)/, '#6b7394'], [/^("[^"]*"|'[^']*'|`[^`]*`)/, '#9ece6a'], [/^\d+(\.\d+)?/, '#ff9e64'], [KW.source ? new RegExp('^' + KW.source) : KW, '#bb9af7'], [/^[A-Za-z_$][\w$]*(?=\()/, '#7aa2f7'], [/^[A-Za-z_$][\w$]*/, '#c0caf5'], [/^./, '#89ddff']];
    while (rest) { for (const [re, col] of rules) { const m = re.exec(rest); if (m) { out.push([m[0], col || '#c0caf5']); rest = rest.slice(m[0].length); break; } } } return out; };
  /** Code editor with typewriter reveal. t = seconds since typing started; speed = characters per second. */
  UI.code = (g, x, y, w, h, code, { t = 99, speed = 38, size = 22, title = '', line = true } = {}) => {
    const c = UI.window(g, x, y, w, h, { title, fill: '#11131a' }), lines = code.split('\n'), n = Math.floor(Math.max(0, t) * speed); let used = 0; const lh = size * 1.55;
    g.save(); g.beginPath(); g.rect(c.x, c.y, c.w, c.h); g.clip(); g.font = `500 ${size}px ${K.FONTS.mono}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.direction = 'ltr';
    lines.forEach((ln, i) => { const shown = Math.max(0, Math.min(ln.length, n - used)); used += ln.length + 1; if (shown <= 0 && i > 0 && n - (used - ln.length - 1) <= 0) return; let px = c.x + (line ? 62 : 28); const py = c.y + 30 + i * lh;
      if (line) { g.fillStyle = '#444b66'; g.textAlign = 'right'; g.fillText(String(i + 1), c.x + 44, py); g.textAlign = 'left'; }
      let count = 0; for (const [tok, col] of UI.tokenize(ln)) { const part = tok.slice(0, Math.max(0, shown - count)); count += tok.length; if (!part) break; g.fillStyle = col; g.fillText(part, px, py); px += g.measureText(part).width; }
      if (shown < ln.length || (i === lines.length - 1)) { if (Math.floor(t * 2.2) % 2 === 0 && shown <= ln.length && n < code.length + 20) { g.fillStyle = T().accent2; g.fillRect(px + 2, py - size * .55, 2.5, size * 1.1); } } });
    g.restore(); return c;
  };
  /** Chat: items [{who:'me'|'them', text, at}] (at = seconds). Bubbles pop in from their corner. Returns the y below the last bubble. */
  UI.chat = (g, x, y, w, items, t, { size = 26, gap = 18, maxw = .72 } = {}) => {
    let cy = y;
    for (const it of items) {
      const p = t - it.at; if (p < 0) break;
      const q = E.outBack(clamp(p / .35)), lines = K.wrap(g, it.text, w * maxw - 40, { size, weight: 500 }), bh = lines.length * size * 1.35 + 30, me = it.who === 'me';
      const bw = Math.min(w * maxw, Math.max(...lines.map(l => K.measure(g, l, { size, weight: 500 }).w)) + 40), bx = me ? x + w - bw : x, ox = me ? bx + bw : bx, oy = cy + bh;
      g.save(); g.globalAlpha *= clamp(p * 5); g.translate(ox, oy); g.scale(q, q); g.translate(-ox, -oy);
      rr(g, bx, cy, bw, bh, [22, 22, me ? 6 : 22, me ? 22 : 6]); g.fillStyle = me ? T().accent : T().panel2; g.fill();
      lines.forEach((l, i) => { const rtl = K.isRTL(l); K.text(g, l, rtl ? bx + bw - 20 : bx + 20, cy + 15 + size * .68 + i * size * 1.35, { size, weight: 500, fill: '#fff', align: rtl ? 'right' : 'left' }); });
      g.restore(); cy += bh + gap;
    }
    return cy;
  };
  UI.typingDots = (g, x, y, t, color) => { for (let i = 0; i < 3; i++) { g.fillStyle = color || T().muted; g.globalAlpha = .4 + .6 * (.5 + .5 * Math.sin(t * 8 - i * .9)); g.beginPath(); g.arc(x + i * 16, y, 5, 0, TAU); g.fill(); } g.globalAlpha = 1; };
  /** Toast / notification that slides in from the top-right. p = seconds since it appeared. */
  UI.toast = (g, x, y, w, p, { title = '', body = '', icon = 'bell', color, life = 3 } = {}) => {
    const a = E.outBack(clamp(p / .4)) * (1 - E.inCubic(prog(p, life - .4, life))); if (a <= 0) return; g.save(); g.translate(0, (1 - a) * -40); g.globalAlpha = clamp(a * 2);
    UI.card(g, x, y, w, 96, { radius: 22 }); g.fillStyle = rgba(color || T().accent, .2); g.beginPath(); g.arc(x + 48, y + 48, 26, 0, TAU); g.fill(); UI.icon(g, icon, x + 48, y + 48, 26, color || T().accent);
    K.text(g, title, x + 92, y + 34, { size: 22, weight: 700, fill: T().ink, align: 'left', max: w - 120 }); K.text(g, body, x + 92, y + 66, { size: 19, weight: 500, fill: T().muted, align: 'left', max: w - 120 }); g.restore();
  };

  /* ───────── cursor ───────── */
  /** Keyframed pointer. path: [[t, x, y, ease?, arc?], …] · clicks: [t…]. Draws the arrow and click ripples; returns {x, y, pressed}. */
  UI.cursor = (g, t, path, clicks = [], { scale = 1.6, color = '#fff' } = {}) => {
    let x = path[0][1], y = path[0][2];
    for (let i = 1; i < path.length; i++) { if (t <= path[i][0]) { const a = path[i - 1], b = path[i], e = (b[3] || E.inOutCubic)(prog(t, a[0], b[0])); x = lerp(a[1], b[1], e); y = lerp(a[2], b[2], e); const dx = b[1] - a[1], dy = b[2] - a[2], d = Math.hypot(dx, dy), arc = (b[4] || 0) * d * Math.sin(Math.PI * e); if (d > 1) { x += -dy / d * arc; y += dx / d * arc; } break; } if (i === path.length - 1) { x = path[i][1]; y = path[i][2]; } }
    let press = 0; for (const c of clicks) press = Math.max(press, t < c ? E.outCubic(prog(t, c - .1, c)) : 1 - E.outCubic(prog(t, c, c + .16)));
    let last = -9; for (const c of clicks) if (c <= t && c > last) last = c; const rp = prog(t, last, last + .55);
    if (last > -9 && rp < 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(T().accent2, 1 - rp); g.lineWidth = 5 * (1 - rp) + 1; g.beginPath(); g.arc(x, y, 14 + 70 * E.outExpo(rp), 0, TAU); g.stroke(); g.restore(); }
    g.save(); g.translate(x, y); g.scale(scale * (1 - .16 * press), scale * (1 - .16 * press)); g.rotate(-.1); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 27); g.lineTo(6.5, 21); g.lineTo(11, 31); g.lineTo(15, 29); g.lineTo(10.5, 19.5); g.lineTo(19, 19); g.closePath(); g.fillStyle = color; g.fill(); g.shadowColor = 'transparent'; g.strokeStyle = '#111'; g.lineWidth = 1.6; g.stroke(); g.restore();
    return { x, y, pressed: press > .5 };
  };

  /* ───────── charts ───────── */
  const nice = v => { const p = 10 ** Math.floor(Math.log10(v || 1)), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
  /** Line/area chart that draws itself: p = 0..1 progress. data: numbers. */
  UI.lineChart = (g, x, y, w, h, data, p, { color, area = true, grid = 4, labels = [], size = 18, dots = true, fa = false } = {}) => {
    const c = color || T().accent2, mx = nice(Math.max(...data) * 1.08), pts = data.map((v, i) => [x + w * i / (data.length - 1), y + h * (1 - v / mx)]);
    g.save(); g.strokeStyle = T().line; g.lineWidth = 1.5; for (let i = 0; i <= grid; i++) { const yy = y + h * i / grid; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); K.text(g, K.fmtNum(Math.round(mx * (1 - i / grid)), { fa, compact: true }), x - 12, yy, { size, weight: 500, fill: T().muted, align: 'right' }); } g.restore();
    labels.forEach((l, i) => K.text(g, l, x + w * i / (labels.length - 1), y + h + size * 1.6, { size, weight: 500, fill: T().muted }));
    const n = (data.length - 1) * clamp(p), i = Math.floor(n), f = n - i, cur = pts.slice(0, i + 1); if (i < data.length - 1) cur.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]);
    const smooth = () => { g.beginPath(); cur.forEach(([px, py], k) => { if (!k) g.moveTo(px, py); else { const [qx, qy] = cur[k - 1], mx2 = (px + qx) / 2; g.bezierCurveTo(mx2, qy, mx2, py, px, py); } }); };
    if (area && cur.length > 1) { smooth(); g.lineTo(cur.at(-1)[0], y + h); g.lineTo(x, y + h); g.closePath(); g.fillStyle = K.gradient(g, 0, y, 0, y + h, [[0, rgba(c, .38)], [1, rgba(c, 0)]]); g.fill(); }
    smooth(); K.neon(g, c, 4.5, .9); if (dots && cur.length) { const [px, py] = cur.at(-1); K.glow(g, px, py, 46, '#fff', .8); g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 6, 0, TAU); g.fill(); }
  };
  /** Animated bar chart: values grow with a stagger. */
  UI.barChart = (g, x, y, w, h, data, t, { colors = [T().accent, T().accent2], labels = [], size = 18, gap = .35, delay = .07, dur = .7, fa = false } = {}) => {
    const mx = nice(Math.max(...data) * 1.1), bw = w / data.length;
    data.forEach((v, i) => { const q = E.outBack(clamp((t - i * delay) / dur)), bh = h * v / mx * q, bx = x + i * bw + bw * gap / 2, ww = bw * (1 - gap); g.save(); rr(g, bx, y + h - bh, ww, Math.max(0, bh), [10, 10, 0, 0]); g.fillStyle = K.gradient(g, 0, y + h - bh, 0, y + h, [[0, colors[i % colors.length]], [1, rgba(colors[i % colors.length], .35)]]); g.fill(); g.restore();
      if (q > .5) K.text(g, K.fmtNum(v, { fa, compact: true }), bx + ww / 2, y + h - bh - size, { size, weight: 700, fill: T().ink, alpha: clamp((q - .5) * 2) }); if (labels[i]) K.text(g, labels[i], bx + ww / 2, y + h + size * 1.5, { size: size * .95, weight: 500, fill: T().muted, max: bw * .95 }); });
  };
  /** Donut: parts [{v, color, label}], p = 0..1 sweep. Returns nothing; centre text is yours. */
  UI.donut = (g, cx, cy, r, parts, p, { thick = r * .28, gapDeg = 2.5 } = {}) => {
    const tot = parts.reduce((s, q) => s + q.v, 0); let a = -Math.PI / 2; g.save(); g.lineCap = 'butt';
    for (const q of parts) { const sweep = q.v / tot * TAU * E.outCubic(clamp(p)); g.strokeStyle = q.color; g.lineWidth = thick; g.beginPath(); g.arc(cx, cy, r, a + gapDeg * Math.PI / 180, a + Math.max(0, sweep - gapDeg * Math.PI / 180)); g.stroke(); a += q.v / tot * TAU * E.outCubic(clamp(p)); } g.restore();
  };

  /* ───────── icons (stroke-drawn, size = half-width) ───────── */
  UI.icon = (g, name, x, y, s, color = '#fff', lw) => {
    g.save(); g.translate(x, y); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw || Math.max(2, s * .16); g.lineCap = 'round'; g.lineJoin = 'round'; const P = (...a) => { g.beginPath(); for (let i = 0; i < a.length; i += 2) i ? g.lineTo(a[i] * s, a[i + 1] * s) : g.moveTo(a[i] * s, a[i + 1] * s); };
    switch (name) {
      case 'play': P(-.5, -.75, .8, 0, -.5, .75); g.closePath(); g.fill(); break;
      case 'pause': g.fillRect(-.6 * s, -.7 * s, .4 * s, 1.4 * s); g.fillRect(.2 * s, -.7 * s, .4 * s, 1.4 * s); break;
      case 'check': P(-.7, .05, -.2, .55, .75, -.55); g.stroke(); break;
      case 'cross': P(-.6, -.6, .6, .6); g.stroke(); P(.6, -.6, -.6, .6); g.stroke(); break;
      case 'arrow': P(-.75, 0, .75, 0); g.stroke(); P(.2, -.55, .75, 0, .2, .55); g.stroke(); break;
      case 'plus': P(-.7, 0, .7, 0); g.stroke(); P(0, -.7, 0, .7); g.stroke(); break;
      case 'search': g.beginPath(); g.arc(-.15 * s, -.15 * s, .55 * s, 0, TAU); g.stroke(); P(.25, .25, .75, .75); g.stroke(); break;
      case 'bell': g.beginPath(); g.moveTo(-.6 * s, .35 * s); g.quadraticCurveTo(-.5 * s, -.1 * s, -.45 * s, -.35 * s); g.quadraticCurveTo(0, -1.0 * s, .45 * s, -.35 * s); g.quadraticCurveTo(.5 * s, -.1 * s, .6 * s, .35 * s); g.closePath(); g.stroke(); g.beginPath(); g.arc(0, .6 * s, .18 * s, 0, Math.PI); g.stroke(); break;
      case 'lock': rr(g, -.6 * s, -.1 * s, 1.2 * s, .9 * s, .18 * s); g.stroke(); g.beginPath(); g.arc(0, -.15 * s, .38 * s, Math.PI, 0); g.stroke(); break;
      case 'star': K.star(g, 0, 0, .85 * s, .36 * s, 5); g.fill(); break;
      case 'heart': g.beginPath(); g.moveTo(0, .7 * s); g.bezierCurveTo(-1.2 * s, -.1 * s, -.6 * s, -.95 * s, 0, -.35 * s); g.bezierCurveTo(.6 * s, -.95 * s, 1.2 * s, -.1 * s, 0, .7 * s); g.fill(); break;
      case 'bolt': P(.15, -.9, -.55, .1, -.05, .1, -.2, .9, .55, -.15, .05, -.15); g.closePath(); g.fill(); break;
      case 'mic': rr(g, -.25 * s, -.8 * s, .5 * s, .95 * s, .25 * s); g.stroke(); g.beginPath(); g.arc(0, -.05 * s, .55 * s, .1, Math.PI - .1); g.stroke(); P(0, .5, 0, .85); g.stroke(); break;
      case 'wave': for (let k = -2; k <= 2; k++) { const h = [.25, .55, .85, .55, .25][k + 2]; P(k * .38, -h, k * .38, h); g.stroke(); } break;
      case 'download': P(0, -.8, 0, .35); g.stroke(); P(-.45, -.1, 0, .4, .45, -.1); g.stroke(); P(-.7, .75, .7, .75); g.stroke(); break;
      case 'globe': g.beginPath(); g.arc(0, 0, .8 * s, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(0, 0, .35 * s, .8 * s, 0, 0, TAU); g.stroke(); P(-.8, 0, .8, 0); g.stroke(); break;
      case 'chat': rr(g, -.8 * s, -.65 * s, 1.6 * s, 1.1 * s, .3 * s); g.stroke(); P(-.3, .45, -.5, .85, .05, .45); g.stroke(); break;
      case 'gear': for (let k = 0; k < 8; k++) { const a = k * TAU / 8; P(Math.cos(a) * .55, Math.sin(a) * .55, Math.cos(a) * .85, Math.sin(a) * .85); g.stroke(); } g.beginPath(); g.arc(0, 0, .55 * s, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, .2 * s, 0, TAU); g.stroke(); break;
      case 'menu': P(-.7, -.5, .7, -.5); g.stroke(); P(-.7, 0, .7, 0); g.stroke(); P(-.7, .5, .7, .5); g.stroke(); break;
      default: g.beginPath(); g.arc(0, 0, .6 * s, 0, TAU); g.stroke();
    }
    g.restore();
  };
})();
