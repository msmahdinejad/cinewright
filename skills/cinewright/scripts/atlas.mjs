#!/usr/bin/env node
// atlas.mjs — the technique atlas: search it, read it, and SEE every recipe in it before you use it.
//
//   node atlas.mjs families                          the families (files in references/atlas/) with entry counts
//   node atlas.mjs list [family]                     every entry: id · title · tags
//   node atlas.mjs search <words…> [--n 8]           ranked entries for what you want to do         e.g.  search liquid chrome 3d text
//   node atlas.mjs show <id> […]                     the full recipe (use, how, code, pitfalls)
//   node atlas.mjs random [n] [--seed 7]             n entries you did not think of (inspiration)
//   node atlas.mjs sheet <id|family|all> … [--cols 5] [--tile 380] [--out file.png] [--strip] [--project dir]
//                                                    renders the recipes and writes ONE contact sheet; open it with your image viewer.
//                                                    --strip: 6 frames of one recipe (to see its motion)
//   node atlas.mjs clip <id|family> … [--w 640 --h 360 --fps 24 --quality web|high] [--gif] [--reel name] [--out dir]
//                                                    renders REAL MOTION: one MP4 (3 s) per recipe, or --reel = all selected recipes in one video; --gif also writes a small GIF
//   node atlas.mjs gallery [--only family]            regenerate references/gallery/*.jpg (contact sheets of every family + the engine examples)
//   node atlas.mjs wav <audio-recipe-id> [--out f.wav]  renders a sound recipe to a WAV (check it with: node qc.mjs audio f.wav)
//   node atlas.mjs test [family|all]                 runs every recipe (picture + sound) and reports errors; exit code 1 on failure
//
// Entry format (references/atlas/<family>.md):   ## id — Title   then  key: value lines (tags, use, how, avoid, pair)  then fenced code:
//   ```js scene   2D canvas scene body   (g, lt, t, c, W, H, u, store)          lt = seconds since the recipe started (0…3), u = H/1080
//   ```js gl      GPU scene body         same params + rt; may `return` a texture (Scene3D render, fx output …); g draws a 2D layer on top
//   ```glsl       a fragment shader      (same header as GFX: vUv, o, uRes, uT; //#use math,noise,color,sdf)
//   ```js audio   sound recipe body      (s, B, lib)   s = Song, B = seconds per beat, lib = { note, chord, scale, progression, PERSIAN, hzOf }
//   ```js         reference code (not executed)
// The first line of a runnable block may be  //@ {"peak":1.4,"bg":"#0b0b12","look":{"bloom":.8}}  (frame to show in sheets, background, Post look).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadAtlas, search, ATLAS } from './atlas-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), SKILL = path.resolve(HERE, '..');
const argv = process.argv.slice(2), cmd = argv[0] || 'help', pos = [], opt = {};
for (let i = 1; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); if (['strip', 'json', 'keep', 'quiet', 'gif'].includes(k)) opt[k] = true; else opt[k] = argv[++i]; } else pos.push(a); }

/* ───────────────────────── load + search (shared with inspire.mjs) ───────────────────────── */
const A = loadAtlas();
const oneLine = e => `${e.id.padEnd(22)} ${('[' + e.family + ']').padEnd(18)} ${e.title}`;
const searchA = (q, n = 8) => search(A, q, { n });

/* ───────────────────────── runnable recipes → harness page ───────────────────────── */
const KIND = { 'js scene': 'scene', 'js gl': 'gl', glsl: 'glsl', 'js init': 'init', 'js audio': 'audio' };
function recipesOf(entries) {
  const out = [];
  for (const e of entries) {
    const vis = e.blocks.filter(b => ['scene', 'gl', 'glsl'].includes(KIND[b.info])), init = e.blocks.find(b => KIND[b.info] === 'init');
    vis.forEach((b, i) => {
      let code = b.code, meta = {}; const m = /^\s*\/\/@\s*(\{.*\})\s*\n?/.exec(code); if (m) { try { meta = new Function('return (' + m[1] + ')')(); } catch (err) { console.warn(`warning: bad //@ meta in ${e.id}: ${err.message}`); } code = code.slice(m[0].length); }
      out.push({ id: vis.length > 1 ? `${e.id}#${i + 1}` : e.id, entry: e.id, kind: KIND[b.info], code, meta, init: i === 0 && init ? init.code : null });
    });
  }
  return out;
}
const D = 3;                 // seconds per recipe slot
function page(R, W, H, strip) {
  const libs = ['kit', 'post', 'gfx', 'trans', 'fx', 'scene3d', 'parts', 'type', 'cine', 'ui', 'geometry', 'stage'].map(n => `<script src="lib/${n}.js"></script>`).join('');
  const data = JSON.stringify(R).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8"><title>atlas harness</title><link rel="stylesheet" href="fonts/fonts.css">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{display:block;position:absolute;inset:0;margin:auto;max-width:100vw;max-height:100vh}</style></head><body><canvas id="out"></canvas>${libs}
<script>
'use strict';
const Q = K.params(), W = Q.w || ${W}, H = Q.h || ${H}, FPS = 30, D = ${D}, u = H / 1080, R = ${data}, STRIP = ${strip ? 'true' : 'false'};
window.VIDEO = { width: W, height: H, fps: FPS, duration: R.length * D, markers: R.map((r, i) => ({ t: i * D + (r.meta.peak ?? 1.4), label: r.id })) };
const out = document.getElementById('out'); out.width = W; out.height = H;
const post = new Post(out), gfx = new GFX(post), fx = new FX(gfx); window.post = post; window.gfx = gfx; window.fx = fx;
const cv = K.canvas(W, H), g = cv.getContext('2d'), rt = gfx.rt(W, H); let tex2d = null;
const ctx = { W, H, u, gfx, fx, post, rt };
// ctx.logo — a placeholder brand mark (two arcs + a star, transparent canvas 600×600): the stand-in for "your logo canvas" in logo recipes (real logo: K.keyWhite(img) or draw your own)
ctx.logo = (() => { const c2 = K.canvas(600, 600), q = c2.getContext('2d'); q.lineWidth = 64; q.lineCap = 'round'; q.strokeStyle = '#8a63ff'; q.beginPath(); q.arc(300, 300, 200, 2.25, 4.03); q.stroke(); q.strokeStyle = '#40f5f5'; q.beginPath(); q.arc(300, 300, 200, -.89, .89); q.stroke(); q.fillStyle = '#ffffff'; K.star(q, 300, 300, 118, 46, 4); q.fill(); return c2; })();
// ctx.A(g) / ctx.B(g) — two plainly different 2D test scenes (orange "A", teal "B") for transition recipes
ctx.A = g => { g.fillStyle = K.gradient(g, 0, 0, W, H, [[0, '#ff5e3a'], [1, '#7a1fa2']]); g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 0; x < W; x += 60 * u * 2) g.fillRect(x, 0, 3 * u, H); K.text(g, 'A', W * .5, H * .5, { size: H * .7, weight: 900, fill: 'rgba(255,255,255,.92)' }); };
ctx.B = g => { g.fillStyle = K.gradient(g, 0, 0, W, H, [[0, '#00c2ff'], [1, '#0b2a6f']]); g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.18)'; for (let y = 0; y < H; y += 60 * u * 2) g.fillRect(0, y, W, 3 * u); K.text(g, 'B', W * .5, H * .5, { size: H * .7, weight: 900, fill: 'rgba(255,255,255,.92)' }); };
// ctx.paint(g) draws a colourful test picture (sky, sun, mountains, word, badges); ctx.demo() returns it as a texture: the stand-in for "your composed scene" in filter / look recipes
let demoTex = null;
ctx.paint = d => { const R = K.rng(5), gr = d.createLinearGradient(0, 0, 0, H); [[0, '#150d3a'], [.4, '#c43c6e'], [.68, '#ff9a4a'], [1, '#ffd98a']].forEach(([o, c]) => gr.addColorStop(o, c)); d.fillStyle = gr; d.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { d.fillStyle = 'rgba(255,255,255,' + (.3 + R() * .6) + ')'; d.beginPath(); d.arc(R() * W, R() * H * .42, (.5 + R() * 1.6) * u, 0, 6.283); d.fill(); }
  K.glow(d, W * .5, H * .6, H * .42, '#ffb066', .55); d.fillStyle = '#ffe2a8'; d.beginPath(); d.arc(W * .5, H * .6, H * .15, 0, 6.283); d.fill();
  [['#4a2a7a', .66, .09, 1.3], ['#2c1a58', .74, .12, 2.1], ['#150e33', .84, .08, 3.4]].forEach(([col, y0, amp, sd]) => { d.fillStyle = col; d.beginPath(); d.moveTo(0, H); for (let x = 0; x <= W; x += 8) d.lineTo(x, H * (y0 - amp * (.5 + .5 * K.noise1(x / W * 3.2 + sd)) ** 1.5)); d.lineTo(W, H); d.closePath(); d.fill(); });
  K.text(d, 'DREAM', W / 2, H * .2, { size: H * .2, weight: 900, fill: '#ffffff', shadow: { color: 'rgba(0,0,0,.35)', blur: 18 * u, y: 6 * u } }); K.text(d, 'hello, world', W / 2, H * .9, { size: H * .075, weight: 700, fill: '#ffe9c4' });
  [['#27f0ff', .14], ['#ff4d8d', .86]].forEach(([c, x]) => { d.fillStyle = c; K.rr(d, W * x - H * .07, H * .74 - H * .07, H * .14, H * .14, H * .035); d.fill(); d.fillStyle = '#fff'; K.circle(d, W * x, H * .74, H * .028); d.fill(); }); };
ctx.demo = () => { if (demoTex) return demoTex; const c2 = K.canvas(W, H); ctx.paint(c2.getContext('2d')); return demoTex = gfx.up(c2); };
const fail = (id, m) => console.error('RECIPE ' + id + ' FAILED: ' + String(m).replace(/\\s+/g, ' ').slice(0, 400));
for (const r of R) { r.store = {}; r.err = null; if (r.kind !== 'glsl') try { r.fn = new Function('g', 'lt', 't', 'c', 'W', 'H', 'u', 'store', 'rt', r.code); } catch (e) { r.err = e.message; fail(r.id, 'syntax: ' + e.message); }
  if (r.init) { try { r.initFn = new Function('c', 'W', 'H', 'u', 'store', 'return (async () => {' + r.init + '\\n})()'); } catch (e) { r.err = e.message; fail(r.id, 'init syntax: ' + e.message); } } }
const bgOf = r => { const b = r.meta.bg || '#0b0b12'; return typeof b === 'string' ? b : '#' + b.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
const hex2rgba = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, 1]; };
function renderFrame(t) {
  const i = Math.min(R.length - 1, Math.max(0, Math.floor(t / D))), lt = t - i * D, r = R[i], meta = r.meta || {};
  gfx.time(lt); post.begin([0, 0, 0, 1]);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0; g.filter = 'none'; g.clearRect(0, 0, W, H);
  try {
    if (r.err || (!r.fn && r.kind !== 'glsl')) throw new Error(r.err || 'no function');
    const bg = bgOf(r);
    if (r.kind === 'scene') { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.save(); r.fn(g, lt, t, ctx, W, H, u, r.store, rt); g.restore(); tex2d = gfx.up(cv, tex2d); gfx.blit(tex2d); }
    else if (r.kind === 'gl') { gfx.clear(hex2rgba(bg), rt); g.save(); const res = r.fn(g, lt, t, ctx, W, H, u, r.store, rt); g.restore(); gfx.blit(res && res.t ? res : rt); tex2d = gfx.up(cv, tex2d); gfx.layer(cv); }
    else { const P = r.store.P || (r.store.P = gfx.prog(r.code)); gfx.pass(P, { uT: lt }); }
  } catch (e) { fail(r.id, e.stack ? e.message : e); gfx.clear([.35, 0, .05, 1]); g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '600 ' + Math.round(22 * u * 2) + 'px sans-serif'; g.fillText(r.id + ': ' + String(e.message).slice(0, 80), 30, H / 2); tex2d = gfx.up(cv, tex2d); gfx.layer(cv); }
  post.end({ frame: Math.round(t * FPS), bloom: .3, grain: .025, vignette: .22, ...(meta.look || {}) });
}
window.renderFrame = renderFrame;
window.ready = (async () => { await K.loadFonts(['800 Vazirmatn', '500 Vazirmatn', '800 Inter', '500 Inter', '700 JetBrains Mono', '400 Anton', '800 Playfair Display', '500 Playfair Display', '700 Space Grotesk', '700 Caveat', '700 Fredoka', '400 Lalezar', '700 Amiri', '700 Reem Kufi', '700 Aref Ruqaa', '700 Noto Nastaliq Urdu', '400 Rakkas']); for (const r of R) if (r.initFn) { try { await r.initFn(ctx, W, H, u, r.store); } catch (e) { r.err = 'init: ' + e.message; fail(r.id, r.err); } } return true; })();
</script></body></html>`;
}

function ensureProject(dir) {
  const stamp = path.join(dir, 'lib', 'kit.js'), newest = Math.max(...fs.readdirSync(path.join(SKILL, 'templates', 'lib')).map(f => fs.statSync(path.join(SKILL, 'templates', 'lib', f)).mtimeMs));
  if (!fs.existsSync(stamp) || fs.statSync(stamp).mtimeMs < newest - 1 || process.env.PCV_ATLAS_REFRESH) {
    const r = spawnSync(process.execPath, [path.join(HERE, 'scaffold.mjs'), dir, '--template', 'basic', '--force'], { encoding: 'utf8' });
    if (r.status !== 0) { console.error(r.stdout + r.stderr); process.exit(1); }
    for (const f of fs.readdirSync(path.join(dir, 'lib'))) fs.utimesSync(path.join(dir, 'lib', f), new Date(), new Date());
  }
}
function pick(ids) {
  if (!ids.length || ids[0] === 'all') return A.entries;
  const out = []; for (const id of ids) { const fam = A.entries.filter(e => e.family === id), one = A.entries.find(e => e.id === id); if (fam.length) out.push(...fam); else if (one) out.push(one); else { console.error(`unknown id/family "${id}". Try: atlas.mjs families | list | search …`); process.exit(1); } }
  return [...new Set(out)];
}
function runSheet(R, { cols, tile, out, W = 960, H = 540, strip, quiet }) {
  const dir = path.resolve(opt.project || path.join(os.tmpdir(), 'pcv-atlas')); ensureProject(dir);
  fs.writeFileSync(path.join(dir, 'atlas_page.html'), page(R, W, H, strip));
  const times = strip ? [.1, .55, 1.0, 1.5, 2.1, 2.8] : R.map((r, i) => i * D + (r.meta.peak ?? 1.4));
  const outFile = path.resolve(out || path.join(dir, 'qc', strip ? `atlas-${R[0].id}-strip.png` : 'atlas.png')); fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const args = [path.join(dir, 'tools', 'render.mjs'), 'sheet', '--root', dir, '--page', 'atlas_page.html', '--cols', String(cols), '--tile', String(tile), '--w', String(W), '--h', String(H), '--out', outFile, '--workers', opt.workers || '2'];
  args.push(...(strip ? ['--times', times.join(',')] : ['--markers']));
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 1 << 26, cwd: dir }), log = (r.stdout || '') + (r.stderr || '');
  const failed = [...new Set([...log.matchAll(/RECIPE (\S+) FAILED: (.*)/g)].map(m => `${m[1]}: ${m[2]}`))];
  const other = log.split('\n').filter(l => /^error:|\[page error\]/.test(l) && !/RECIPE .* FAILED/.test(l));
  if (!quiet) { if (r.status === 0) console.log(`✔ atlas sheet: ${outFile}   (${R.length} recipe${R.length > 1 ? 's' : ''}${strip ? ', strip' : ', one frame each at its peak'})`); }
  if (r.status !== 0) { console.error(log.split('\n').slice(-25).join('\n')); }
  return { ok: r.status === 0 && !failed.length, failed, other, outFile };
}

/* ───────────────────────── audio recipes ───────────────────────── */
async function runAudio(entries) {
  const lib = await import(pathToFileURL(path.join(SKILL, 'templates', 'lib', 'synth.mjs')).href), res = [];
  for (const e of entries) for (const [i, b] of e.blocks.entries()) {
    if (KIND[b.info] !== 'audio') continue; const id = e.id + (e.blocks.filter(x => KIND[x.info] === 'audio').length > 1 ? `#${i + 1}` : '');
    try {
      const s = new lib.Song({ dur: 8, bpm: 120, seed: 3, tail: 1 }), fn = new Function('s', 'B', 'lib', b.code); fn(s, s.B, lib);
      const m = s.mixdown({ lufs: -16, quiet: true }); let pk = 0, e2 = 0; for (let c = 0; c < 2; c++) for (let k = 0; k < m[c].length; k++) { const v = m[c][k]; if (!Number.isFinite(v)) throw new Error('NaN in output'); pk = Math.max(pk, Math.abs(v)); e2 += v * v; }
      if (pk < 1e-4) throw new Error('silent (no sound produced)'); res.push({ id, ok: true, peak: pk });
    } catch (err) { res.push({ id, ok: false, err: err.message }); }
  }
  return res;
}

/* ───────────────────────── commands ───────────────────────── */
const num = (v, d) => (v == null || isNaN(+v) ? d : +v);
switch (cmd) {
  case 'families': {
    for (const f of A.families) console.log(`${f.family.padEnd(18)} ${String(f.count).padStart(3)}  ${f.title}`);
    console.log(`\n${A.entries.length} entries.  atlas.mjs list <family> · search <words> · show <id> · sheet <family>`); break;
  }
  case 'list': {
    const L = pos[0] ? A.entries.filter(e => e.family === pos[0]) : A.entries; if (!L.length) { console.error(`no family "${pos[0]}". families: ${A.families.map(f => f.family).join(', ')}`); process.exit(1); }
    let fam = ''; for (const e of L) { if (e.family !== fam) { fam = e.family; console.log(`\n── ${fam} ─ ${A.families.find(f => f.family === fam)?.title || ''}`); } console.log(`  ${e.id.padEnd(22)} ${e.title}  ${e.tags.length ? '· ' + e.tags.slice(0, 6).join(' ') : ''}`); }
    break;
  }
  case 'search': {
    if (!pos.length) { console.error('usage: atlas.mjs search <words…>'); process.exit(1); }
    const L = searchA(pos, num(opt.n, 8)); if (!L.length) { console.log('nothing found — try broader words (e.g. "text", "3d", "transition", "particles", "persian") or: atlas.mjs families'); break; }
    if (opt.json) { console.log(JSON.stringify(L.map(e => ({ id: e.id, family: e.family, title: e.title, use: e.fields.use, tags: e.tags })), null, 1)); break; }
    L.forEach((e, i) => { console.log(`${String(i + 1).padStart(2)}. ${oneLine(e)}`); if (e.fields.use) console.log(`      use: ${e.fields.use}`); if (e.fields.pair) console.log(`      pairs with: ${e.fields.pair}`); });
    console.log(`\natlas.mjs show <id>   ·   atlas.mjs sheet ${L.slice(0, 4).map(e => e.id).join(' ')}   (see them)`); break;
  }
  case 'show': {
    if (!pos.length) { console.error('usage: atlas.mjs show <id> […]'); process.exit(1); }
    for (const id of pos) { const e = A.entries.find(x => x.id === id) || searchA([id], 1)[0]; if (!e) { console.error(`no entry "${id}"`); continue; } console.log(e.raw + '\n'); }
    break;
  }
  case 'random': {
    let s = num(opt.seed, Date.now() % 100000) >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const n = num(pos[0], 5), pool = [...A.entries], out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    out.forEach(e => { console.log(oneLine(e)); if (e.fields.use) console.log(`      use: ${e.fields.use}`); }); break;
  }
  case 'sheet': {
    const entries = pick(pos); let R = recipesOf(entries); if (!R.length) { console.error('no runnable (```js scene / gl / glsl) recipes in that selection'); process.exit(1); }
    if (opt.strip) R = [R[0]];
    const cols = num(opt.cols, opt.strip ? 3 : 5), tile = num(opt.tile, opt.strip ? 560 : 380);
    const r = runSheet(R, { cols, tile, out: opt.out, W: num(opt.w, 960), H: num(opt.h, 540), strip: !!opt.strip });
    if (r.failed.length) { console.error('\nFAILED recipes:\n  ' + r.failed.join('\n  ')); process.exit(1); } if (!r.ok) process.exit(1); break;
  }
  case 'clip': {
    // real motion instead of one still: MP4 (and optional GIF) of the selected recipes, rendered by the same harness page as `sheet`
    const entries = pick(pos); const R = recipesOf(entries); if (!R.length) { console.error('no runnable (```js scene / gl / glsl) recipes in that selection'); process.exit(1); }
    const W = num(opt.w, 640), H = num(opt.h, 360), fps = num(opt.fps, 24), outDir = path.resolve(opt.out || 'atlas-clips'); fs.mkdirSync(outDir, { recursive: true });
    const dir = path.resolve(opt.project || path.join(os.tmpdir(), 'pcv-atlas')); ensureProject(dir);
    const jobs = opt.reel ? [[String(opt.reel), R]] : R.map(r => [r.id.replace(/[^\w-]+/g, '_'), [r]]);
    for (const [name, rs] of jobs) {
      fs.writeFileSync(path.join(dir, 'atlas_page.html'), page(rs, W, H, false));
      const mp4 = path.join(outDir, name + '.mp4');
      const r = spawnSync(process.execPath, [path.join(dir, 'tools', 'render.mjs'), '--root', dir, '--page', 'atlas_page.html', '--out', mp4, '--no-audio', '--quality', String(opt.quality || 'web'), '--w', String(W), '--h', String(H), '--fps', String(fps), '--workers', opt.workers || '2'], { encoding: 'utf8', cwd: dir, maxBuffer: 1 << 26 });
      const log = (r.stdout || '') + (r.stderr || ''), failed = [...new Set([...log.matchAll(/RECIPE (\S+) FAILED: (.*)/g)].map(m => `${m[1]}: ${m[2]}`))];
      if (r.status !== 0 || failed.length || !fs.existsSync(mp4)) { console.error(log.split('\n').slice(-20).join('\n') + (failed.length ? '\nFAILED recipes:\n  ' + failed.join('\n  ') : '')); process.exit(1); }
      console.log('✔', path.relative(process.cwd(), mp4), (fs.statSync(mp4).size / 1024).toFixed(0) + ' KB');
      if (opt.gif) {
        const gif = path.join(outDir, name + '.gif'), gw = num(opt.gifw, 480), gf = num(opt.giffps, 15);
        const g = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4, '-vf', `fps=${gf},scale=${gw}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', gif], { encoding: 'utf8' });
        if (g.status !== 0) { console.error(g.stderr); process.exit(1); } console.log('✔', path.relative(process.cwd(), gif), (fs.statSync(gif).size / 1024).toFixed(0) + ' KB');
      }
    }
    break;
  }
  case 'gallery': {
    // regenerate references/gallery/*.jpg: one contact sheet per atlas family + the engine examples (transitions, backgrounds, filters, materials)
    const outDir = path.resolve(opt.out || path.join(SKILL, 'references', 'gallery')); fs.mkdirSync(outDir, { recursive: true });
    const jpg = (png, name, q = 3) => { const dst = path.join(outDir, name + '.jpg'); const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', png, '-q:v', String(q), dst], { encoding: 'utf8' }); if (r.status !== 0) { console.error(r.stderr); process.exit(1); } console.log('✔', path.relative(process.cwd(), dst), (fs.statSync(dst).size / 1024).toFixed(0) + ' KB'); };
    for (const fam of A.families) {
      const entries = A.entries.filter(e => e.family === fam.family), R = recipesOf(entries); if (!R.length || (opt.only && opt.only !== fam.family)) continue;
      const cols = R.length > 24 ? 6 : 5, tile = R.length > 24 ? 320 : R.length > 12 ? 380 : 440, png = path.join(os.tmpdir(), `pcv-gal-${fam.family}.png`);
      const r = runSheet(R, { cols, tile, out: png, quiet: true }); if (!r.ok) { console.error(`${fam.family}: ${r.failed.join('; ') || 'render failed'}`); process.exit(1); } jpg(png, 'atlas-' + fam.family);
    }
    if (!opt.only) {
      const dir = path.resolve(path.join(os.tmpdir(), 'pcv-atlas')); ensureProject(dir); fs.cpSync(path.join(SKILL, 'templates', 'examples'), path.join(dir, 'examples'), { recursive: true });
      for (const [page, name, cols, tile] of [['transitions', 'transitions', 6, 330], ['backgrounds', 'backgrounds', 5, 400], ['filters', 'filters', 6, 330], ['materials3d', 'materials3d', 4, 500], ['typography', 'typography', 4, 480], ['fonts', 'fonts', 4, 480], ['particles', 'particles-example', 4, 480], ['text3d-city', 'text3d-city', 3, 640]]) {
        const png = path.join(os.tmpdir(), `pcv-gal-${name}.png`), r = spawnSync(process.execPath, [path.join(dir, 'tools', 'render.mjs'), 'sheet', '--root', dir, '--page', `examples/${page}.html`, '--markers', '--cols', String(cols), '--tile', String(tile), '--out', png, '--workers', '2'], { encoding: 'utf8', cwd: dir });
        if (r.status !== 0) { console.error(`${name}: ${(r.stdout + r.stderr).split(/\r?\n/).slice(-6).join(' | ')}`); process.exit(1); } jpg(png, name);
      }
    }
    break;
  }
  case 'wav': {
    if (!pos.length) { console.error('usage: atlas.mjs wav <audio-recipe-id> [--out file.wav]  (then: node qc.mjs audio file.wav)'); process.exit(1); }
    const lib = await import(pathToFileURL(path.join(SKILL, 'templates', 'lib', 'synth.mjs')).href);
    for (const id of pos) { const e = A.entries.find(x => x.id === id), b = e?.blocks.find(x => KIND[x.info] === 'audio'); if (!b) { console.error(`"${id}" has no \`\`\`js audio block`); continue; }
      const s = new lib.Song({ dur: 8, bpm: 120, seed: 3, tail: 1.5 }); new Function('s', 'B', 'lib', b.code)(s, s.B, lib); const out = path.resolve(opt.out && pos.length === 1 ? opt.out : `${id}.wav`); s.write(out, { lufs: -14 }); }
    break;
  }
  case 'test': {
    const entries = pick(pos); const R = recipesOf(entries); let bad = 0;
    if (R.length) { const chunks = []; for (let i = 0; i < R.length; i += 60) chunks.push(R.slice(i, i + 60)); let n = 0;
      for (const ch of chunks) { const r = runSheet(ch, { cols: 6, tile: 320, out: path.join(os.tmpdir(), `pcv-atlas-test-${n++}.png`), quiet: true }); if (r.failed.length || !r.ok) { bad += r.failed.length || 1; console.error('FAILED:\n  ' + (r.failed.join('\n  ') || r.other.join('\n  ') || 'render error')); } else console.log(`✔ ${ch.length} visual recipes rendered (${r.outFile})`); } }
    const au = await runAudio(entries); for (const a of au) if (!a.ok) { bad++; console.error(`FAILED audio ${a.id}: ${a.err}`); } if (au.length) console.log(`✔ ${au.filter(a => a.ok).length}/${au.length} audio recipes produce sound`);
    const noUse = entries.filter(e => !e.fields.use || !e.fields.tags); if (noUse.length) console.log(`note: ${noUse.length} entries without use:/tags: ${noUse.slice(0, 6).map(e => e.id).join(', ')}`);
    console.log(bad ? `\n${bad} problem(s)` : `\nall good: ${entries.length} entries, ${R.length} visual + ${au.length} audio recipes executed`); process.exit(bad ? 1 : 0);
  }
  default: console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).slice(0, 22).map(l => l.slice(3)).join('\n'));
}
