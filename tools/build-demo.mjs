#!/usr/bin/env node
// build-demo.mjs — build the live engine demo of the website (docs/demo/) from the skill's own templates.
//   node tools/build-demo.mjs [<samples-dir with the sample MP4s, for the filmstrip images>]
//
// The website runs the REAL engine in the visitor's browser: docs/demo/<film>.html is a template's video.html next to the shared lib/ and fonts/;
// the page drives it by calling renderFrame(t) (that is the whole point of the project) and plays <film>.m4a, synthesised by the template's audio.mjs.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SKILL = path.join(ROOT, 'skills', 'cinewright'), OUT = path.join(ROOT, 'docs', 'demo');
const samples = process.argv[2] && path.resolve(process.argv[2]);
const run = (bin, args, o = {}) => { const r = spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...o }); if (r.status !== 0) { console.error((r.stdout || '') + (r.stderr || '')); process.exit(1); } return r; };
const FILMS = { showreel: { sample: 'showreel-template-en_16x9.mp4' }, cinema: { sample: 'cinema-template-en_16x9.mp4' } };

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(path.join(ROOT, 'docs', 'assets', 'img'), { recursive: true });
let first = true;
for (const [name, cfg] of Object.entries(FILMS)) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `cw-demo-${name}-`));
  run(process.execPath, [path.join(SKILL, 'scripts', 'scaffold.mjs'), tmp, '--template', name, '--force']);
  run(process.execPath, ['audio.mjs'], { cwd: tmp });
  if (first) { fs.cpSync(path.join(tmp, 'lib'), path.join(OUT, 'lib'), { recursive: true }); fs.cpSync(path.join(tmp, 'fonts'), path.join(OUT, 'fonts'), { recursive: true }); first = false; }
  const html = fs.readFileSync(path.join(tmp, 'video.html'), 'utf8'); fs.writeFileSync(path.join(OUT, `${name}.html`), html);
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(tmp, 'audio.wav'), '-c:a', 'aac', '-b:a', '112k', '-movflags', '+faststart', path.join(OUT, `${name}.m4a`)]);
  // cue table → markers for the scrubber (scene start times)
  const cues = JSON.parse(/<script id="cues"[^>]*>([\s\S]*?)<\/script>/.exec(html)[1]), spec = /window\.VIDEO\s*=\s*\{([^}]*)\}/.exec(html);
  const dur = cues.duration || +(/dur(?:ation)?:\s*([\d.]+)/.exec(spec?.[1] || '')?.[1]) || 20;
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ name, duration: dur, bpm: cues.bpm, markers: Object.entries(cues.t || {}).map(([label, t]) => ({ t, label })), hits: cues.hits || [] }));
  if (samples && fs.existsSync(path.join(samples, cfg.sample))) {                                      // filmstrip: 18 real frames side by side → the scrubber's track
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(samples, cfg.sample), '-vf', `fps=18/${dur},scale=192:-1,tile=18x1`, '-frames:v', '1', '-q:v', '5', path.join(ROOT, 'docs', 'assets', 'img', `strip-${name}.jpg`)]);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('✔', name, `${dur}s`, (fs.statSync(path.join(OUT, `${name}.m4a`)).size / 1024).toFixed(0) + ' KB audio');
}
const size = d => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`docs/demo: ${(size(OUT) / 1048576).toFixed(1)} MB`);
