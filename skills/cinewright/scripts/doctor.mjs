#!/usr/bin/env node
// doctor.mjs — is this machine ready to render code-made videos? Checks tools, GPU/WebGL, then renders a 6-frame smoke test.
//   node <skill>/scripts/doctor.mjs            (or node tools/doctor.mjs inside a project)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Browser, findChrome, tmpBase } from './chrome.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let fails = 0, warns = 0;
const ok = m => console.log('✔ ' + m), warn = m => { warns++; console.log('! ' + m); }, bad = m => { fails++; console.log('✘ ' + m); };
const run = (bin, a, o = {}) => spawnSync(bin, a, { encoding: 'utf8', ...o });
const availNow = () => os.freemem() / 2 ** 30;
const plat = process.platform, cores = os.cpus().length, ramGB = os.totalmem() / 2 ** 30;
console.log(`cinewright doctor — ${os.type()} ${os.release()} · ${cores} cores · ${ramGB.toFixed(0)} GB RAM\n`);

// Node
const nodeMajor = +process.versions.node.split('.')[0];
nodeMajor >= 20 ? ok(`Node ${process.version}`) : nodeMajor >= 18 ? warn(`Node ${process.version} works, Node 20+ is recommended`) : bad(`Node ${process.version} is too old (need 18+): https://nodejs.org`);

// ffmpeg
const FF = process.env.FFMPEG || 'ffmpeg', ffv = run(FF, ['-hide_banner', '-version']);
if (ffv.error || ffv.status !== 0) {
  bad(`ffmpeg not found. Install: ${plat === 'win32' ? 'winget install Gyan.FFmpeg' : plat === 'darwin' ? 'brew install ffmpeg' : 'sudo apt install ffmpeg'}   (or set FFMPEG=<path>)`);
} else {
  ok(`ffmpeg ${/version (\S+)/.exec(ffv.stdout)?.[1]}`);
  const enc = run(FF, ['-hide_banner', '-encoders']).stdout, filt = run(FF, ['-hide_banner', '-filters']).stdout;
  for (const [name, pattern, need] of [['libx264 (H.264 video)', /libx264/, true], ['aac audio', /\baac\b/, true], ['libx265 (--codec h265)', /libx265/, false], ['libvpx-vp9 (--codec vp9)', /libvpx-vp9/, false], ['prores_ks (--codec prores)', /prores_ks/, false]]) {
    pattern.test(enc) ? ok(name) : need ? bad(`ffmpeg lacks ${name}`) : warn(`ffmpeg lacks ${name} (optional)`);
  }
  for (const f of ['tile', 'tmix', 'ebur128', 'showspectrumpic', 'signalstats', 'freezedetect', 'blackdetect']) /\b/.test(filt) && new RegExp(`\\b${f}\\b`).test(filt) ? null : warn(`ffmpeg filter "${f}" missing — some qc.mjs / motion-blur features will not work`);
  const nv = run(FF, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=black:s=256x256:d=0.1', '-frames:v', '1', '-c:v', 'h264_nvenc', '-f', 'null', '-']);
  nv.status === 0 ? ok('NVENC hardware encoding works (use --encoder nvenc)') : console.log('  (NVENC not usable here — software x264 is used; that is fine)');
}

// Chrome + GPU
const chrome = findChrome();
if (!chrome) bad(`Chrome/Chromium/Edge not found. Install Google Chrome (https://www.google.com/chrome) or set CHROME=<path>.`);
else {
  ok(`browser: ${chrome}`);
  try {
    const b = await Browser.launch({ gpu: process.env.PCV_GPU || 'auto', width: 800, height: 600 }), p = await b.newPage({ width: 800, height: 600 });
    await p.goto('about:blank');
    const r = await p.eval(`(() => { const o = {}; const c = document.createElement('canvas'); const g = c.getContext('2d');
      o.roundRect = typeof g.roundRect === 'function'; o.letterSpacing = 'letterSpacing' in g; o.filter = 'filter' in g; o.segmenter = typeof Intl.Segmenter === 'function';
      const gl = document.createElement('canvas').getContext('webgl2'); o.webgl2 = !!gl;
      if (gl) { const e = gl.getExtension('WEBGL_debug_renderer_info'); o.renderer = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); o.floatFB = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')); }
      return o; })()`);
    ok(`${b.version} headless, canvas 2D features: roundRect ${r.roundRect ? '✔' : '✘'} · filter ${r.filter ? '✔' : '✘'} · letterSpacing ${r.letterSpacing ? '✔' : '✘'}`);
    if (!r.roundRect) bad('Chrome is too old (no roundRect) — update Chrome');
    if (r.webgl2) {
      const sw = /swiftshader|llvmpipe|software/i.test(r.renderer);
      sw ? warn(`WebGL2 works but runs on the CPU (${r.renderer}) — post-effects/particles render ~3× slower. A GPU-enabled Chrome is much faster.`) : ok(`WebGL2 on GPU: ${r.renderer}`);
      if (!sw && /Intel.*(UHD|Iris|HD Graphics)|Radeon\(TM\) Graphics|Apple/i.test(r.renderer)) console.log('  (integrated GPU: its memory is system RAM — the renderer measures one worker and only starts as many as fit; pages that draw thousands of blend-mode shapes per frame can need gigabytes)');
      r.floatFB ? ok('float framebuffers (HDR bloom, GPU motion-blur accumulation)') : warn('no float framebuffers — bloom falls back to 8-bit');
    } else bad('WebGL2 unavailable — post.js and GPU capture need it. Try updating your GPU driver, or the CHROME env var pointing at another Chromium.');
    await b.close();
  } catch (e) { bad('could not start headless Chrome: ' + e.message); }
}

// smoke test: render a tiny page end-to-end
if (!fails) {
  const tmp = fs.mkdtempSync(path.join(tmpBase(), 'pcv-doctor-'));
  fs.writeFileSync(path.join(tmp, 'video.html'), `<!doctype html><meta charset=utf-8><canvas id=out width=640 height=360></canvas><script>
    window.VIDEO={width:640,height:360,fps:30,duration:0.2};const c=document.getElementById('out'),g=c.getContext('2d');
    window.renderFrame=t=>{g.fillStyle='hsl('+(t*900)+',70%,45%)';g.fillRect(0,0,640,360);g.fillStyle='#fff';g.font='700 60px sans-serif';g.textAlign='center';g.fillText('t='+t.toFixed(2),320,200);};
    window.ready=Promise.resolve(true);</script>`);
  const t0 = Date.now(), r = run(process.execPath, [path.join(HERE, 'render.mjs'), '--root', tmp, '--quality', 'draft', '--workers', '1', '--no-audio'], { cwd: tmp });
  const out = path.join(tmp, 'out', 'video.mp4');
  if (r.status === 0 && fs.existsSync(out) && fs.statSync(out).size > 1000) {
    const pr = run(process.env.FFPROBE || 'ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames,width,height', '-of', 'csv=p=0', out]).stdout.trim();
    ok(`smoke render: ${pr} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    if (/note: GPU frame packing unavailable/.test(r.stdout)) warn('GPU frame packing unavailable → the slower RGBA capture path will be used (still works)');
  } else { bad('smoke render failed:\n' + (r.stdout + r.stderr).split('\n').slice(-12).join('\n')); }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
}

// bundled fonts present?
const fontDir = [path.join(HERE, '..', 'templates', 'fonts'), path.join(HERE, '..', 'fonts')].find(d => fs.existsSync(path.join(d, 'Vazirmatn-variable.woff2')));
if (fontDir) { const css = fs.readFileSync(path.join(fontDir, 'fonts.css'), 'utf8'), files = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m => m[1]), miss = files.filter(f => !fs.existsSync(path.join(fontDir, f))), fams = new Set([...css.matchAll(/font-family: '([^']+)'/g)].map(m => m[1])); miss.length ? warn(`font files missing: ${miss.join(', ')}`) : ok(`bundled fonts found: ${[...fams].join(' · ')}`); } else warn('bundled fonts not found next to this script — projects created by scaffold.mjs will lack them');

console.log(`\nworkers: up to ${Math.max(1, Math.min(8, Math.floor(cores / 3)))} (one Chrome each); the renderer measures memory first and starts only as many as fit — ${availNow().toFixed(1)} GB of ${ramGB.toFixed(0)} GB RAM is free right now (override: --workers N).`);
console.log('long renders: run them in the background (--detach) and poll `node tools/render.mjs status`; end one cleanly with `node tools/render.mjs stop`.');
console.log(fails ? `\n✘ ${fails} problem(s) block rendering — fix them first.` : warns ? `\n! ready, with ${warns} note(s).` : '\n✔ all good.');
process.exit(fails ? 1 : 0);
