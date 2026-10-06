#!/usr/bin/env node
// make-assets.mjs — regenerate every picture/animation used by README and docs from the skill itself (nothing is hand-made).
//
//   node tools/make-assets.mjs films  <samples-dir>     animated-WebP highlights cut from the sample films (needs the MP4s; they live in GitHub Releases)
//   node tools/make-assets.mjs videos <samples-dir>     720p web MP4s for the website lightbox
//   node tools/make-assets.mjs reels                    technique reels: a few atlas recipes per family as one animated WebP each (renders with the skill's own atlas harness)
//   node tools/make-assets.mjs all <samples-dir>
//
// Requires Node >= 18, Chrome/Edge/Chromium and ffmpeg (run  node skills/cinewright/scripts/doctor.mjs  first).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills', 'cinewright'), OUT = path.join(ROOT, 'docs', 'assets');
const [cmd = 'help', arg] = process.argv.slice(2);
fs.mkdirSync(path.join(OUT, 'anim'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });

const run = (bin, args, o = {}) => { const r = spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...o }); if (r.status !== 0) { console.error((r.stdout || '') + (r.stderr || '')); process.exit(1); } return r; };
const kb = f => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';

/** MP4 segment → animated WebP (≈ 4× smaller than GIF at the same size; every browser and GitHub's README renderer play it). */
function anim(src, dst, { from = 0, dur = 6, w = 640, fps = 14, q = 55 } = {}) {
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(from), '-t', String(dur), '-i', src, '-vf', `fps=${fps},scale=${w}:-1:flags=lanczos`, '-c:v', 'libwebp_anim', '-quality', String(q), '-compression_level', '5', '-loop', '0', '-an', dst]);
  console.log('✔', path.relative(ROOT, dst), kb(dst));
}

const FILMS = [   // [file in samples dir, output name, start s, length s]
  ['avorythm_16x9.mp4', 'avorythm-turn', 7.4, 6.5], ['avorythm_16x9.mp4', 'avorythm-burst', 22.8, 6.5], ['avorythm_16x9.mp4', 'avorythm-glass', 15.8, 5],
  ['cinema-template-en_16x9.mp4', 'cinema', 0.5, 9], ['showreel-template-en_16x9.mp4', 'showreel', 0.3, 8], ['showreel-template-fa_16x9.mp4', 'showreel-fa', 0.3, 6],
];
function films(dir) {
  if (!dir || !fs.existsSync(dir)) { console.error('usage: make-assets.mjs films <folder with the sample MP4s>'); process.exit(1); }
  for (const [f, name, from, dur] of FILMS) { const src = path.join(dir, f); if (!fs.existsSync(src)) { console.warn('skip (missing)', src); continue; } anim(src, path.join(OUT, 'anim', name + '.webp'), { from, dur, w: 640, fps: 14, q: 55 }); }
  for (const [f, name, t] of [['avorythm_16x9.mp4', 'avorythm-prism', 10.0], ['cinema-template-en_16x9.mp4', 'cinema-city', 11.0], ['showreel-template-en_16x9.mp4', 'showreel-type', 2.2]]) {
    const src = path.join(dir, f); if (!fs.existsSync(src)) continue; const dst = path.join(OUT, 'img', name + '.jpg');
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', src, '-frames:v', '1', '-vf', 'scale=1280:-1', '-q:v', '3', dst]); console.log('✔', path.relative(ROOT, dst), kb(dst));
  }
}

// technique reels: [name, [recipe ids], seconds-per-recipe is fixed (3 s) by the atlas harness]
const REELS = {
  type: ['word-slam', 'type-outline-write-on', 'type-karaoke-captions', 'text-ring'],
  '3d': ['text3d-chrome', 'glass-gems', 'city-night-flight', 'product-pedestal'],
  particles: ['particles-morph-word', 'particles-burst-spark', 'particles-galaxy-swirl', 'particles-dissolve'],
  shaders: ['glsl-raymarch-metaballs', 'glsl-retro-sun', 'glsl-starfield-warp', 'glsl-voronoi-cracks'],
  looks: ['look-vhs', 'look-ascii', 'look-stained-glass', 'look-kaleido'],
  logos: ['logo-stamp-shockwave', 'logo-shatter-in', 'logo-glitch-in', 'logo-gl-bloom-ring'],
  graphic: ['gfx-girih-reveal', 'gfx-dot-globe', 'gfx-flow-field', 'gfx-radial-equalizer'],
  ui: ['ui-app-flow', 'ui-isotype-grid', 'ui-network-graph', 'light-neon-sign'],
};
function reels() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pcv-reels-'));
  for (const [name, ids] of Object.entries(REELS)) {
    run(process.execPath, [path.join(SKILL, 'scripts', 'atlas.mjs'), 'clip', ...ids, '--reel', name, '--w', '640', '--h', '360', '--fps', '20', '--out', tmp]);
    anim(path.join(tmp, name + '.mp4'), path.join(OUT, 'anim', 'reel-' + name + '.webp'), { from: 0, dur: ids.length * 3, w: 560, fps: 14, q: 55 });
  }
}

// web-sized MP4s (720p, CRF 27) for the website's lightbox: small enough to live in git, good enough to watch with sound
function videos(dir) {
  if (!dir || !fs.existsSync(dir)) { console.error('usage: make-assets.mjs videos <folder with the sample MP4s>'); process.exit(1); }
  fs.mkdirSync(path.join(OUT, 'video'), { recursive: true });
  for (const [f, name] of [['avorythm_16x9.mp4', 'avorythm'], ['cinema-template-en_16x9.mp4', 'cinema'], ['showreel-template-en_16x9.mp4', 'showreel'], ['showreel-template-fa_16x9.mp4', 'showreel-fa']]) {
    const src = path.join(dir, f); if (!fs.existsSync(src)) { console.warn('skip (missing)', src); continue; } const dst = path.join(OUT, 'video', name + '.mp4');
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', dst]); console.log('✔', path.relative(ROOT, dst), kb(dst));
  }
}
if (cmd === 'videos') videos(arg); else if (cmd === 'films') films(arg); else if (cmd === 'reels') reels(); else if (cmd === 'all') { films(arg); reels(); videos(arg); }
else console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 8).join('\n'));
