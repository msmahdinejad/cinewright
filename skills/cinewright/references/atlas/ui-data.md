# UI & data — interfaces, numbers and charts that look designed

Product films live or die on whether the interface *looks real* and *behaves* (cursor moves with intent, buttons press, text types, things respond). The `UI` library draws windows, browsers, phones, cards, buttons, toggles, inputs, chat, code, toasts, cursors, charts and 25 icons — all as pure functions of time, with Persian/Arabic labels shaped and right-to-left automatically (`UI.input` and `UI.chat` flip alignment on RTL text).
Design the interface at a comfortable "screen" size (≈ 1000 × 620 units) and scale it with `UI.fit(g, x, y, w, dw, dh, draw)` so one design fits any aspect ratio; convert cursor targets with the returned scale. Don't show a whole app: show **one flow** (type → click → result), zoom into the detail that matters, and let the camera move across it (Stage camera, or map the UI on a 3D device: `phone-ui-3d`).
Numbers: ease them (`value = target · outExpo(p)`), group digits, and keep units visible. Charts draw themselves (`p` 0→1). Theme colours live in `UI.theme` — set them once to the brand palette.

## ui-app-flow — Type, click, result (with a real cursor)
tags: ui app flow window browser cursor click input button type explainer product demo 2d medium
use: the core of any product explainer: "paste text → press Translate → result appears"; shows the product doing its job in 4 seconds
how: `UI.browser`/`UI.window` returns the content rect; `UI.input` with `K.typed` text and caret, `UI.button` with a `press` value that peaks at the click time, `UI.cursor(g, t, path, clicks)` (keyframed pointer with click ripples), then the result card pops in (`K.pop`). All times in one small timeline.
pair: sfx-ui-ticks (type + click sounds at the same times), cam-push-in
```js scene
//@ {"peak":2.35,"bg":"#0c0e16"}
const tt = lt, r = UI.browser(g, W * .12, H * .1, W * .76, H * .8, { url: 'avorythm.app/translate', tabs: ['Avorythm'] });
const txt = K.typed('Hello, how are you today?', K.prog(tt, .2, 1.3)), press = Math.max(0, 1 - Math.abs(tt - 1.75) * 8);
UI.input(g, r.x + r.w * .08, r.y + r.h * .12, r.w * .84, r.h * .14, txt, { placeholder: 'Type something…', focus: K.prog(tt, .1, .3), caret: tt < 1.7, t: tt, size: r.h * .06 });
UI.button(g, r.x + r.w * .08, r.y + r.h * .34, r.w * .3, r.h * .13, 'Translate', { press, hover: K.prog(tt, 1.4, 1.7), size: r.h * .055 });
if (tt > 1.8) K.pop(g, tt - 1.8, r.x + r.w * .5, r.y + r.h * .7, () => { UI.card(g, -r.w * .42, -r.h * .12, r.w * .84, r.h * .24, { radius: 18 }); K.text(g, 'سلام، امروز حالت چطوره؟', 0, 0, { size: r.h * .075, weight: 700, fill: '#fff' }); }, { dur: .5, over: 1.4 });
UI.cursor(g, tt, [[0, r.x + r.w * .9, r.y + r.h * .8], [.15, r.x + r.w * .4, r.y + r.h * .19], [1.5, r.x + r.w * .2, r.y + r.h * .405, K.E.inOutCubic, .1], [2.3, r.x + r.w * .7, r.y + r.h * .88]], [1.75], { scale: 1.1 * u * 2 });
```

## ui-chat-bubbles — Conversation with typing dots
tags: ui chat messages bubbles conversation persian rtl typing social 2d cheap
use: communication products, social proof, "two people, two languages" (mix Persian and English bubbles); the typing indicator builds anticipation
how: `UI.chat(g, x, y, w, items, t, {size})` pops bubbles in at their `at` times (`who: 'me' | 'them'`); right-to-left text aligns right automatically; `UI.typingDots` before the reply. Put the thread in a `UI.phone` screen.
```js scene
//@ {"peak":2.3,"bg":"#10122a"}
const s = UI.phone(g, W * .36, H * .04, H * .92); g.save(); g.beginPath(); K.rr(g, s.x, s.y, s.w, s.h, s.r); g.clip(); g.fillStyle = '#0f111a'; g.fillRect(s.x, s.y, s.w, s.h);
const y1 = UI.chat(g, s.x + s.w * .05, s.y + s.h * .1, s.w * .9, [{ who: 'them', text: 'Can you hear me clearly?', at: .2 }, { who: 'me', text: 'بله، کاملاً واضح!', at: 1.0 }, { who: 'them', text: 'Amazing — live translation!', at: 1.9 }], lt, { size: s.w * .078, gap: s.w * .035 });
if (lt > 2.4) UI.typingDots(g, s.x + s.w * .12, y1 + s.w * .04, lt); g.restore();
```

## ui-code-typing — Code being typed with syntax colours
tags: ui code typing editor terminal developer syntax open source 2d cheap
use: developer/open-source/API stories ("it's just three lines"), tutorials; makes abstract capabilities concrete
how: `UI.code(g, x, y, w, h, codeString, {t, speed, size, title})` types characters at `speed` per second with tokenised colouring and a caret; pair it with a result panel that appears when the last line completes.
```js scene
//@ {"peak":2.8,"bg":"#0b0d14"}
UI.code(g, W * .1, H * .12, W * .8, H * .76, "import { translate } from 'avorythm'\n\nconst stream = translate({\n  from: 'en', to: 'fa',\n  live: true,\n})\n\nstream.on('text', t => console.log(t))", { t: lt, speed: 48, size: H * .042, title: 'quickstart.js' });
```

## ui-dashboard-kpis — KPIs, line chart and bars
tags: ui dashboard kpi numbers chart line bar data analytics counter 2d medium
use: growth/metrics stories, "it works" evidence; three numbers + one chart is the whole language of data in 4 seconds
how: `Type.counter` per KPI (eased values), `UI.lineChart(g, x, y, w, h, data, p)` draws itself with glow, `UI.barChart(g, x, y, w, h, data, t)` grows bars with stagger. Keep one accent colour for "up".
```js scene
//@ {"peak":2.0,"bg":"#0d0f18"}
const p = K.prog(lt, 0, 1.8), kp = [['Users', 1284500], ['Languages', 42], ['Latency ms', 180]];
kp.forEach(([label, v], i) => { const x = W * (.2 + i * .3); Type.counter(g, v * K.E.outExpo(K.prog(lt, i * .15, i * .15 + 1.6)), x, H * .2, { size: H * .11, weight: 800, pad: String(v).length, fill: '#fff' }); K.text(g, label, x, H * .31, { size: H * .035, weight: 500, fill: UI.theme.muted }); });
UI.card(g, W * .06, H * .4, W * .52, H * .5, { radius: 22 }); UI.lineChart(g, W * .1, H * .46, W * .44, H * .3, [3, 5, 4, 7, 6, 9, 8, 12, 11, 15], p, { color: '#27f0ff', labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'], size: H * .028 });
UI.card(g, W * .62, H * .4, W * .32, H * .5, { radius: 22 }); UI.barChart(g, W * .65, H * .5, W * .26, H * .3, [4, 7, 5, 9, 8], lt, { size: H * .026, labels: ['A', 'B', 'C', 'D', 'E'] });
```

## ui-notification-stack — Toasts sliding in
tags: ui notification toast alert badge social proof 2d cheap
use: "things happening in real time" (messages, payments, translations arriving), social-proof moments, phone lock-screen looks
how: `UI.toast(g, x, y, w, p, {title, body, icon, color})` slides/bounces in from the top; stack three with staggered `p` and increasing y.
```js scene
//@ {"peak":2.2,"bg":"#101428"}
[['New translation', 'سلام دنیا → Hello world', 'globe', '#27f0ff', .2], ['Live captions on', 'English · Persian · Arabic', 'mic', '#7a5cff', .8], ['Export ready', 'dubbed-video.mp4 · 48 MB', 'download', '#7dff9b', 1.4]].forEach(([title, body, icon, col, at], i) => UI.toast(g, W * .3, H * (.14 + i * .22), W * .4, lt - at, { title, body, icon, color: col, life: 9 }));
```

## ui-glass-panels — Frosted glass cards over a living background
tags: ui glass frosted glassmorphism blur panels modern aurora cards 2d medium
use: modern, premium UI looks; floating cards over a colourful shader background; feature grids
how: paint the background to the canvas first (`c.paint` / a shader frame via `drawImage`), `fr.snap(canvas)` blurs a downsampled copy, then `fr.glass(g, x, y, w, h, radius, {tint, glow})` draws panels that sample it (frosted) with a bright border and soft shadow.
```js scene
//@ {"peak":1.6}
c.paint(g); const fr = store.fr ||= new K.Frost(W, H, 4); fr.snap(g.canvas, 9);
[[.12, .18, .36, .3, 'Live captions'], [.52, .14, .36, .22, '42 languages'], [.52, .42, .36, .3, 'Open source']].forEach(([x, y, w, h, label], i) => { const e = K.E.outBack(K.prog(lt, i * .15, i * .15 + .7)); g.save(); g.translate(0, (1 - e) * H * .06); g.globalAlpha = Math.min(1, e * 2); fr.glass(g, W * x, H * y, W * w, H * h, H * .035, { glow: 'rgba(120,160,255,.35)' }); K.text(g, label, W * (x + w / 2), H * (y + h / 2), { size: H * .06, weight: 800, fill: '#fff' }); g.restore(); });
```

## ui-donut-progress — Ring progress with a big number
tags: ui donut ring progress percent chart radial score loading 2d cheap
use: "98 % accuracy", loading/processing, shares, completion; a ring + number is instantly readable
how: `UI.donut(g, cx, cy, r, [{v,color}], p, {thick})` sweeps its segments; draw a faint full ring behind, a glowing head dot, and `Type.counter` in the middle.
```js scene
//@ {"peak":2.5,"bg":"#0b0e1c","look":{"bloom":0.8}}
const p = K.prog(lt, 0, 2), cx = W / 2, cy = H / 2, r = H * .3; g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = H * .06; g.beginPath(); g.arc(cx, cy, r, 0, K.TAU); g.stroke();
UI.donut(g, cx, cy, r, [{ v: 98, color: '#27f0ff' }, { v: 2, color: 'rgba(0,0,0,0)' }], p, { thick: H * .06, gapDeg: 0 });
const a = -Math.PI / 2 + K.TAU * .98 * K.E.outCubic(p); K.glow(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, H * .09, '#9ff7ff', .9);
Type.counter(g, 98 * K.E.outExpo(p), cx - H * .02, cy, { size: H * .2, weight: 800, fill: '#fff' }); K.text(g, '%', cx + H * .17, cy + H * .02, { size: H * .09, weight: 700, fill: '#27f0ff' });
```

## ui-waveform-voice — Voice waveform → text
tags: ui waveform audio voice speech equalizer bars microphone translation dubbing 2d medium
use: any story about voice, speech, music, dubbing, podcasts; the waveform is the universal "sound" glyph; here it turns into subtitle text (voice → words)
how: `K.bars(g, x, y, w, h, n, fn, {gap, color, mirror})` with an amplitude function built from smooth noise × an envelope (loud while "speaking", quiet after); the words appear with `K.words` as the voice envelope peaks. Drive `fn` from real audio data with `K.audioData()` + `analyze-audio.mjs` when you have a soundtrack.
```js scene
//@ {"peak":1.6,"bg":"#0a0c1a","look":{"bloom":0.7}}
const env = K.smoothstep(0, .4, lt) * (1 - K.smoothstep(2.0, 2.6, lt)); UI.icon(g, 'mic', W * .5, H * .22, H * .06, '#9ab0ff');
K.bars(g, W * .15, H * .5, W * .7, H * .3, 56, (uu, i) => (.12 + .88 * Math.abs(K.noise2(i * .45, lt * 5.5))) * env * (.35 + .65 * Math.sin(Math.PI * uu)) + .03, { gap: .45, color: K.gradient(g, W * .15, 0, W * .85, 0, [[0, '#7a5cff'], [1, '#27f0ff']]), mirror: true });
K.words(g, 'Hello, how are you today?', W / 2, H * .82, lt - .7, { size: H * .06, weight: 700, fill: '#fff', each: .16, max: W * .8 });
```

## ui-network-graph — Nodes, links and travelling signals
tags: ui network graph nodes links signal connection languages community diagram 2d medium
use: "everything is connected", communities, languages, servers, supply chains; signals travelling along edges read as live data
how: place nodes on rings with a deterministic RNG, link nearest neighbours, draw edges faintly, then send bright pulses along random edges (`K.trail` / a moving dot with `K.glow`). Label nodes with names in several scripts — Persian/Arabic via Vazirmatn, Cyrillic/Greek via Inter (no CJK glyphs are bundled).
```js scene
//@ {"peak":1.6,"bg":"#070a16","look":{"bloom":0.9}}
const R = K.rng(9), names = ['English', 'فارسی', 'Español', 'العربية', 'Русский', 'Deutsch', 'Türkçe', 'Français', 'Ελληνικά', 'Italiano', 'Polski', 'Nederlands'], N = names.length;
const nodes = names.map((n, i) => { const a = i / N * K.TAU + .3, r = H * (.2 + .13 * ((i * 7) % 3)); return [W / 2 + Math.cos(a) * r * 1.6 + Math.sin(lt * .4 + i) * 8 * u, H / 2 + Math.sin(a) * r + Math.cos(lt * .5 + i) * 8 * u]; });
const edges = []; nodes.forEach((p, i) => nodes.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < H * .62) edges.push([i, j]); }));
g.strokeStyle = 'rgba(120,150,255,.22)'; g.lineWidth = 1.5 * u; edges.forEach(([i, j]) => { g.beginPath(); g.moveTo(...nodes[i]); g.lineTo(...nodes[j]); g.stroke(); });
edges.forEach(([i, j], k) => { const ph = (lt * .5 + k * .137) % 1; if (K.hash(k) > .45) return; const [a, b] = [nodes[i], nodes[j]], x = a[0] + (b[0] - a[0]) * ph, y = a[1] + (b[1] - a[1]) * ph; K.glow(g, x, y, 26 * u, '#7dfcff', .9); });
nodes.forEach(([x, y], i) => { K.glow(g, x, y, 46 * u, '#7a5cff', .5); g.fillStyle = '#fff'; K.circle(g, x, y, 6 * u); g.fill(); K.text(g, names[i], x, y + 26 * u, { size: H * .034, weight: 700, fill: '#cfd8ff' }); });
```

## ui-toggles-settings — Switches and sliders flipping
tags: ui toggle switch slider settings controls preferences product 2d cheap
use: "customise everything", feature lists as live controls, privacy/settings stories; each toggle flips on a beat for rhythm
how: `UI.toggle(g, x, y, on01)` (animate `on` 0→1 with an ease) and `UI.slider(g, x, y, w, v)`; stack in a `UI.card`, label with `K.text`; flip one every 0.35 s and add a tick sound.
```js scene
//@ {"peak":2.0,"bg":"#101324"}
UI.card(g, W * .28, H * .1, W * .44, H * .8, { radius: 26 }); ['Live captions', 'Dub my voice', 'Offline mode', 'Open source'].forEach((label, i) => { const y = H * (.2 + i * .15); K.text(g, label, W * .33, y + H * .025, { size: H * .042, weight: 600, fill: '#e6e9ff', align: 'left' }); UI.toggle(g, W * .6, y, K.prog(lt, .3 + i * .35, .6 + i * .35), { w: W * .08, h: W * .045, color: ['#27f0ff', '#ff4fd8', '#ffd23f', '#7dff9b'][i] }); });
UI.slider(g, W * .33, H * .82, W * .34, .35 + .45 * K.E.inOutCubic(K.prog(lt, 1.2, 2.4)));
```

## ui-isotype-grid — "73 of 100": a grid of people that fills to a statistic
tags: infographic data statistic icons grid isotype percentage counter explainer stat persian-ok 2d cheap
use: ONE statistic that must be felt, not read — "7 of 10 …", "1 in 4 …". The grid makes the number physical; the counter and one headline do the rest. Place it in the middle third of an explainer
how: a 10 × 10 grid of simple person icons (circle head + rounded body). Icons light up from the first to the value, the leading icon pops with overshoot, the big counter counts to the same value in the same time. Persian digits: `K.faDigits(Math.round(v))`. Use your REAL number and label — never a placeholder in a delivered film.
pair: counter-odometer, ui-glass-panels, sfx-ui-tick (one tick per 5 icons)
avoid: more than one statistic per screen; a grid that fills linearly (ease it); colours that do not come from the palette
```js scene
//@ {"peak":1.8,"bg":"#0b0d1a"}
const N = 100, val = 73, cols = 10, cell = H * .062, gx = W * .34, gy = H * .5, shown = val * K.E.inOutCubic(K.prog(lt, .2, 1.9));
for (let i = 0; i < N; i++) { const c = i % cols, r = Math.floor(i / cols), x = gx + (c - (cols - 1) / 2) * cell, y = gy + (r - (cols - 1) / 2) * cell, on = shown - i, pop = on > 0 ? 1 + .35 * Math.exp(-on * 4) * Math.min(1, on * 6) : 1, lit = K.clamp(on * 4);
  g.save(); g.translate(x, y); g.scale(pop, pop); g.fillStyle = lit > 0 ? K.mix('#2b3160', '#40f5f5', lit) : '#2b3160';
  g.beginPath(); g.arc(0, -cell * .22, cell * .13, 0, K.TAU); g.fill(); g.beginPath(); g.roundRect(-cell * .17, -cell * .06, cell * .34, cell * .34, cell * .12); g.fill(); g.restore(); }
K.text(g, Math.round(shown) + '%', W * .73, H * .46, { size: H * .26, weight: 900, fill: '#fff', glow: { color: '#40f5f5', blur: H * .03 } }); K.text(g, 'your statistic goes here', W * .73, H * .66, { size: H * .04, weight: 600, fill: '#aab4ff', max: W * .3 });
```
