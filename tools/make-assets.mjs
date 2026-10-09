#!/usr/bin/env node
// make-assets.mjs — derive every picture and video on the website and in the README from real films (nothing is hand-made).
//
//   node tools/make-assets.mjs build [--only id,id] [--samples <dir>]   transcode the films listed in docs/assets/data/media.plan.json
//                                                                        → docs/assets/video/<section>/<id>.mp4 · docs/assets/img/<section>/<id>.jpg · docs/assets/data/media.json
//   node tools/make-assets.mjs reels [--only name,name]                 render the technique reels (atlas recipes, 960×540 @30) into <samples>/reel-<name>.mp4
//   node tools/make-assets.mjs readme [--only id,id]                    animated-WebP previews for the README (docs/assets/anim/<id>.webp), for plan items that have a "readme" block
//   node tools/make-assets.mjs blocks                                  fill the README showcase blocks (README.md, README.fa.md) from the plan
//   node tools/make-assets.mjs release [--out dir]                      copy every source film to <dir>/<src>.mp4 — the files to attach to a GitHub release
//   node tools/make-assets.mjs check                                    every planned file exists, media.json is current, no source film is used twice
//
// Sources: <samples>/<src>.mp4 (default benchmark/samples — not committed, published as release assets) or, for plan items with "from": "run:<runId>/<jobId>", the film an agent produced in benchmark/runs/.
// Requires Node >= 18, ffmpeg + ffprobe (and Chrome for `reels`; run  node skills/cinewright/scripts/doctor.mjs  first).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills', 'cinewright'), DOCS = path.join(ROOT, 'docs'), PLAN = path.join(DOCS, 'assets', 'data', 'media.plan.json'), OUT = path.join(DOCS, 'assets', 'data', 'media.json');
const argv = process.argv.slice(2), cmd = argv[0] || 'help', opt = {};
for (let i = 1; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i];
const SAMPLES = path.resolve(opt.samples || path.join(ROOT, 'benchmark', 'samples'));
const only = opt.only ? new Set(opt.only.split(',')) : null;

const run = (bin, args, o = {}) => { const r = spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...o }); if (r.status !== 0) { console.error((r.stdout || '') + (r.stderr || '')); process.exit(1); } return r; };
const kb = f => (fs.statSync(f).size / 1024).toFixed(0) + ' KB', mb = f => (fs.statSync(f).size / 1048576).toFixed(1) + ' MB';
const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');
const plan = () => JSON.parse(fs.readFileSync(PLAN, 'utf8'));
function probe(file) {
  const j = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]).stdout), v = j.streams.find(s => s.codec_type === 'video'), a = j.streams.find(s => s.codec_type === 'audio');
  return { width: v.width, height: v.height, duration: +(+j.format.duration).toFixed(2), audio: !!a, bytes: +j.format.size };
}
function source(it) {
  if (it.from && it.from.startsWith('run:')) { const p = path.join(ROOT, 'benchmark', 'runs', ...it.from.slice(4).split('/'), 'final.mp4'); if (fs.existsSync(p)) return p; }
  const p = path.join(SAMPLES, it.src + '.mp4'); return fs.existsSync(p) ? p : null;
}

/** H.264 web film: 'loop' = silent, small; 'film' = with AAC audio. w = max width (landscape) / max height (portrait). */
function encode(src, dst, e = {}, info) {
  const portrait = info.height > info.width, w = e.w || 1280, scale = portrait ? `scale=-2:'min(${w},ih)'` : `scale='min(${w},iw)':-2`;
  const args = ['-hide_banner', '-loglevel', 'error', '-y']; if (e.from) args.push('-ss', String(e.from)); if (e.dur) args.push('-t', String(e.dur));
  args.push('-i', src, '-vf', `${scale}:flags=lanczos,fps=${e.fps || 30},format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(e.crf ?? 23), '-profile:v', 'high', '-movflags', '+faststart');
  if (e.audio === false || !info.audio) args.push('-an'); else args.push('-c:a', 'aac', '-b:a', e.ab || '112k', '-ac', '2');
  args.push(dst); fs.mkdirSync(path.dirname(dst), { recursive: true }); run('ffmpeg', args);
}
function poster(src, dst, t = 1, w = 1280) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', src, '-frames:v', '1', '-vf', `scale='min(${w},iw)':-2:flags=lanczos`, '-q:v', '3', dst]);
}
/** MP4 segment → animated WebP (≈ 4× smaller than GIF at the same size; every browser and GitHub's README renderer play it). */
function anim(src, dst, { from = 0, dur = 6, w = 720, fps = 15, q = 72 } = {}) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(from), '-t', String(dur), '-i', src, '-vf', `fps=${fps},scale=${w}:-1:flags=lanczos`, '-c:v', 'libwebp_anim', '-quality', String(q), '-compression_level', '6', '-loop', '0', '-an', dst]);
  console.log('✔', rel(dst), kb(dst));
}

/* ── build ─────────────────────────────────────────────────────────────────────────────────── */
function build() {
  const P = plan(), media = {}; let missing = 0;
  for (const it of P.items) {
    if (only && !only.has(it.id)) { if (fs.existsSync(OUT)) { const old = JSON.parse(fs.readFileSync(OUT, 'utf8')).items.find(x => x.id === it.id); if (old) { media[it.id] = { ...old, ...it }; continue; } } }
    const src = source(it); if (!src) { console.warn(`skip ${it.id}: no source "${it.src}" in ${rel(SAMPLES)}${it.from ? ' or ' + it.from : ''}`); missing++; continue; }
    const info = probe(src), sec = it.section, dst = path.join(DOCS, 'assets', 'video', sec, it.id + '.mp4'), pst = path.join(DOCS, 'assets', 'img', sec, it.id + '.jpg');
    encode(src, dst, it.encode || {}, info); poster(src, pst, (it.encode?.from || 0) + (it.poster ?? 1), it.encode?.w ? Math.min(1280, it.encode.w) : 1280);
    const out = probe(dst); console.log('✔', rel(dst), mb(dst), `${out.width}×${out.height} ${out.duration}s${out.audio ? ' ♪' : ''}`);
    media[it.id] = { ...it, video: rel(dst).replace(/^docs\//, ''), posterImg: rel(pst).replace(/^docs\//, ''), width: out.width, height: out.height, duration: out.duration, bytes: out.bytes, audio: out.audio, source: { width: info.width, height: info.height, duration: info.duration } };
  }
  const items = P.items.map(it => media[it.id]).filter(Boolean);
  fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), tasks: P.tasks || [], items }, null, 1) + '\n');
  const total = items.reduce((a, b) => a + b.bytes, 0); console.log(`\nmedia.json: ${items.length} item(s), ${(total / 1048576).toFixed(1)} MB of video${missing ? ` — ${missing} planned film(s) have no source yet` : ''}`);
}

/* ── technique reels: a few atlas recipes per family, rendered by the skill's own harness ───── */
const REELS = {      // [name]: [recipe ids] — 3 s per recipe; neutral sample copy only
  type: ['word-slam', 'echo-stack', 'type-outline-write-on', 'text-ring'],
  '3d': ['text3d-chrome', 'glass-gems', 'city-night-flight', 'orbit-rings'],
  particles: ['particles-morph-word', 'particles-burst-spark', 'particles-galaxy-swirl', 'particles-dissolve'],
  shaders: ['glsl-raymarch-metaballs', 'glsl-retro-sun', 'glsl-starfield-warp', 'glsl-voronoi-cracks'],
  looks: ['look-vhs', 'look-ascii', 'look-stained-glass', 'look-kaleido'],
  logos: ['logo-stamp-shockwave', 'logo-shatter-in', 'logo-glitch-in', 'logo-gl-bloom-ring'],
  graphic: ['gfx-girih-reveal', 'gfx-dot-globe', 'gfx-flow-field', 'gfx-radial-equalizer'],
  ui: ['ui-app-flow', 'ui-isotype-grid', 'ui-network-graph', 'light-neon-sign'],
};
function reels() {
  fs.mkdirSync(SAMPLES, { recursive: true }); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cw-reels-'));
  const R = fs.existsSync(path.join(DOCS, 'assets', 'data', 'reels.json')) ? JSON.parse(fs.readFileSync(path.join(DOCS, 'assets', 'data', 'reels.json'), 'utf8')) : REELS;
  for (const [name, ids] of Object.entries(R)) {
    if (only && !only.has(name)) continue;
    run(process.execPath, [path.join(SKILL, 'scripts', 'atlas.mjs'), 'clip', ...ids, '--reel', name, '--w', '960', '--h', '540', '--fps', '30', '--quality', 'high', '--out', tmp]);
    fs.copyFileSync(path.join(tmp, name + '.mp4'), path.join(SAMPLES, 'reel-' + name + '.mp4')); console.log('✔', 'reel-' + name, mb(path.join(SAMPLES, 'reel-' + name + '.mp4')));
  }
}

/* ── README previews ───────────────────────────────────────────────────────────────────────── */
function readme() {
  for (const it of plan().items) {
    if (!it.readme || (only && !only.has(it.id))) continue; const src = source(it); if (!src) { console.warn('skip', it.id); continue; }
    anim(src, path.join(DOCS, 'assets', 'anim', it.id + '.webp'), it.readme);
  }
}


/* ── README showcase blocks (generated from the plan; never edited by hand) ─────────────────── */
function blocks() {
  const P = plan(), M = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).items : [];
  const dur = id => { const m = M.find(x => x.id === id); return m ? Math.round(m.duration) + ' s' : ''; };
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const cell = (it, fa) => {
    const t = (fa ? it.title.fa : it.title.en), d = (fa ? it.desc.fa : it.desc.en), w = it.readme.w || 440;
    return `<td valign="top" width="50%"><img src="docs/assets/anim/${it.id}.webp" alt="${esc(t)}" width="${Math.min(w, 520)}"><br><sub><b>${t}</b> · ${esc(it.agent)} · ${dur(it.id)}<br>${d}</sub></td>`;
  };
  const table = (list, fa) => {
    const rows = []; for (let i = 0; i < list.length; i += 2) rows.push('<tr>' + cell(list[i], fa) + (list[i + 1] ? cell(list[i + 1], fa) : '<td></td>') + '</tr>');
    const FENCE = '`'.repeat(3), NL = '\n';
    const prompts = list.map(it => '**' + (fa ? it.title.fa : it.title.en) + '**' + NL + NL + FENCE + 'text' + NL + it.prompt + NL + FENCE).join(NL + NL);
    const sum = fa ? 'پرامپت‌هایی که این فیلم‌ها از آن‌ها ساخته شدند' : 'The prompts these films were made from';
    return '<table dir="ltr">' + NL + rows.join(NL) + NL + '</table>' + NL + NL + (fa ? '<div dir="rtl">' + NL + NL : '') + '<details><summary>' + sum + '</summary>' + NL + NL + prompts + NL + NL + '</details>' + NL + (fa ? NL + '</div>' + NL : '');
  };
  const put = (file, tag, text) => {
    const f = path.join(ROOT, file); let s = fs.readFileSync(f, 'utf8'); const a = '<!-- ' + tag + ':START -->', b = '<!-- ' + tag + ':END -->'; const i = s.indexOf(a), j = s.indexOf(b);
    if (i < 0 || j < 0) { console.warn('markers ' + tag + ' not found in ' + file); return; }
    fs.writeFileSync(f, s.slice(0, i + a.length) + '\n' + text + '\n' + s.slice(j)); console.log('✔', file, tag);
  };
  const withPrev = it => it.section === 'showcase' && it.readme && fs.existsSync(path.join(DOCS, 'assets', 'anim', it.id + '.webp'));
  const en = P.items.filter(it => withPrev(it) && it.lang !== 'fa'), fa = P.items.filter(it => withPrev(it) && it.lang === 'fa');
  if (en.length) put('README.md', 'SHOWCASE', table(en, false));
  if (fa.length) put('README.fa.md', 'FA-SHOWCASE', table(fa, true));

  /* the proof: one table per prompt, a header + picture row per pair; captions are computed from the committed benchmark numbers (docs/assets/benchmark/summary.json) */
  const BS = path.join(DOCS, 'assets', 'benchmark', 'summary.json'), rows = fs.existsSync(BS) ? JSON.parse(fs.readFileSync(BS, 'utf8')) : [], row = id => rows.find(r => r.id === id);
  const faDig = s => String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\./g, '٫');
  const proof = fa => {
    const NL = '\n', FENCE = '`'.repeat(3), num = x => fa ? faDig(x) : String(x), out = [], label = it => String(it.agent).replace(/ \+ Cinewright/, '');
    for (const t of P.tasks || []) {
      const its = P.items.filter(i => i.section === 'compare' && (i.task || 'showreel') === t.id && i.readme && fs.existsSync(path.join(DOCS, 'assets', 'anim', i.id + '.webp')));
      const pairs = [...new Set(its.map(i => i.pair))].map(k => ({ k, a: its.find(i => i.pair === k && i.side === 'without'), b: its.find(i => i.pair === k && i.side === 'with') })).filter(p => p.a && p.b);
      if (!pairs.length) continue;
      const alt = it => esc((it.alt && (fa ? it.alt.fa : it.alt.en)) || `${label(it)} — ${it.side === 'with' ? 'with' : 'without'} the skill`);
      const tableRows = pairs.map(p => { const w = Math.min(p.a.readme.w || 480, 520);
        return `<tr><th width="50%">${label(p.a)} — ${fa ? 'بدون اسکیل' : '<i>without</i> the skill'}</th><th width="50%">${fa ? 'با Cinewright' : '… and <i>with</i> Cinewright'}</th></tr>` + NL
          + `<tr><td align="center"><img src="docs/assets/anim/${p.a.id}.webp" alt="${alt(p.a)}" width="${w}"></td><td align="center"><img src="docs/assets/anim/${p.b.id}.webp" alt="${alt(p.b)}" width="${w}"></td></tr>`; }).join(NL);
      const cap = pairs.map(p => { const a = row(p.a.metrics), b = row(p.b.metrics); if (!a || !b) return '';
        const tok = a.tokens && b.tokens ? ` · ${num((b.tokens / a.tokens).toFixed(1))}× ${fa ? 'توکن' : 'the tokens'}` : '';
        return fa ? `${label(p.b)}: پُری قاب ${num(a.fill)}٪ ← ${num(b.fill)}٪ · زمان تقریباً ساکن ${num(a.quietPct)}٪ ← ${num(b.quietPct)}٪${tok}`
          : `${label(p.b)}: frame fill ${a.fill}% → ${b.fill}% · near-static ${a.quietPct}% → ${b.quietPct}%${tok}`; }).filter(Boolean).join('<br>');
      const head = '**' + (fa ? t.title.fa : t.title.en) + '**', prompt = FENCE + 'text' + NL + '$cinewright ' + t.prompt + NL + FENCE, tbl = '<table dir="ltr">' + NL + tableRows + NL + '</table>';
      const note = cap ? '<sub>' + cap + (fa ? ' · هر خانه یک اجرا' : ' · one run per cell') + '</sub>' : '';
      out.push(fa ? ['<div dir="rtl">', '', head, '', '</div>', '', prompt, '', tbl, '', note && '<div dir="rtl">', note && '', note, note && '', note && '</div>'].filter(x => x !== undefined && x !== false && x !== null).join(NL).replace(/\n{3,}/g, NL + NL)
        : [head, '', prompt, '', tbl, '', note].join(NL).trimEnd());
    }
    return out.join(NL + NL);
  };
  put('README.md', 'PROOF', proof(false)); put('README.fa.md', 'FA-PROOF', proof(true));
}

/* ── release assets: every source film under the name the site links to ─────────────────────── */
function release() {
  const out = path.resolve(opt.out || path.join(ROOT, 'benchmark', '.work', 'release')); fs.mkdirSync(out, { recursive: true }); let n = 0, missing = 0;
  const seen = new Set();
  for (const it of plan().items) {
    if (!it.src || seen.has(it.src)) continue; seen.add(it.src); const src = source(it); if (!src) { console.warn('missing source for', it.src); missing++; continue; }
    const dst = path.join(out, it.src + '.mp4'); fs.copyFileSync(src, dst); n++; console.log('✔', path.basename(dst), mb(dst));
  }
  console.log(`\n${n} file(s) in ${out}${missing ? `, ${missing} missing` : ''}`);
}

/* ── check ─────────────────────────────────────────────────────────────────────────────────── */
function check() {
  const P = plan(); let bad = 0; const warn = m => { console.error('✘ ' + m); bad++; };
  const seen = new Map(); for (const it of P.items) { const k = it.src + '|' + (it.encode?.from || 0) + '|' + (it.encode?.dur || 0); if (seen.has(k)) warn(`"${it.id}" and "${seen.get(k)}" are the same excerpt of the same film — each clip may appear once`); else seen.set(k, it.id); }
  const ids = new Set(); for (const it of P.items) { if (ids.has(it.id)) warn(`duplicate id ${it.id}`); ids.add(it.id); }
  if (!fs.existsSync(OUT)) warn('media.json missing — run: node tools/make-assets.mjs build'); else {
    const M = JSON.parse(fs.readFileSync(OUT, 'utf8')); const have = new Set(M.items.map(x => x.id));
    for (const it of P.items) if (!have.has(it.id)) warn(`"${it.id}" is in the plan but not in media.json (no source film yet?)`);
    for (const m of M.items) for (const f of [m.video, m.posterImg]) if (!fs.existsSync(path.join(DOCS, f))) warn(`missing file docs/${f}`);
    const total = M.items.reduce((a, b) => a + b.bytes, 0); console.log(`${M.items.length} media item(s), ${(total / 1048576).toFixed(1)} MB`); if (total > 125 * 1048576) warn('site video exceeds 125 MB — raise the CRF or cut the length');
  }
  console.log(bad ? `\n${bad} problem(s)` : '\n✔ media plan is consistent'); process.exit(bad ? 1 : 0);
}

if (cmd === 'build') build(); else if (cmd === 'reels') reels(); else if (cmd === 'readme') readme(); else if (cmd === 'blocks') blocks(); else if (cmd === 'release') release(); else if (cmd === 'check') check();
else console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 11).map(l => l.slice(3)).join('\n'));
