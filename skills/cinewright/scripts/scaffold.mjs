#!/usr/bin/env node
// scaffold.mjs — create a self-contained video project from a template.
//
//   node <skill>/scripts/scaffold.mjs <project-dir> [--template basic] [--preset <name>] [--w 1920 --h 1080 --fps 60 --dur 12] [--lang en|fa] [--title "My video"] [--examples] [--force]
//   (templates with presets — `motion` — start from a complete example film described as data: --preset person-intro | channel-intro | social-promo | infographic | event-promo)
//
// Result (everything the project needs lives inside it, so it can be zipped, shared and re-rendered years later):
//   video.html   scenes + renderFrame(t) + <script id="cues"> timeline      audio.mjs   soundtrack synthesised from the same cues
//   direction.md the creative brief to fill in first                        tools/      render.mjs · qc.mjs · chrome.mjs · pcv-page.js
//   lib/         kit · post · gfx · trans · stage · fx · scene3d · parts · type · cine · synth      fonts/  Vazirmatn · Inter · JetBrains Mono (offline, OFL)
//   examples/    (with --examples) 7 runnable demos of the engine: transitions, backgrounds, filters, materials3d, text3d-city, particles, typography
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), SKILL = path.resolve(HERE, '..');
const argv = process.argv.slice(2), pos = [], opt = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); if (['force', 'examples'].includes(k)) opt[k] = true; else opt[k] = argv[++i]; } else pos.push(a); }
const dir = pos[0];
if (!dir) { console.error('usage: node scaffold.mjs <project-dir> [--template basic] [--w 1920 --h 1080 --fps 60 --dur 12] [--lang en|fa] [--title "…"] [--examples] [--force]'); process.exit(1); }
const template = opt.template || 'basic', tdir = path.join(SKILL, 'templates', template);
if (!fs.existsSync(tdir)) { console.error(`unknown template "${template}". available: ${fs.readdirSync(path.join(SKILL, 'templates')).filter(d => !['lib', 'fonts', 'examples'].includes(d)).join(', ')}`); process.exit(1); }
const target = path.resolve(dir);
if (fs.existsSync(target) && fs.readdirSync(target).length && !opt.force) { console.error(`${target} is not empty. Pick another folder or pass --force (existing files with the same name are overwritten).`); process.exit(1); }

let defaults = {}; try { defaults = JSON.parse(fs.readFileSync(path.join(tdir, 'template.json'), 'utf8')); } catch { /* no defaults file */ }
let preset = null; const pdir = path.join(tdir, 'presets');          // templates with presets (motion) start from a complete example film described as data
if (fs.existsSync(pdir)) { const name = opt.preset || defaults.preset, pf = path.join(pdir, name + '.json'); if (!fs.existsSync(pf)) { console.error(`unknown preset "${name}". available: ${fs.readdirSync(pdir).map(x => x.replace(/\.json$/, '')).join(', ')}`); process.exit(1); } preset = JSON.parse(fs.readFileSync(pf, 'utf8')); if (opt.dur) preset.duration = +opt.dur; }
const tokens = { W: opt.w || preset?.w || defaults.w || 1920, H: opt.h || preset?.h || defaults.h || 1080, FPS: opt.fps || preset?.fps || defaults.fps || 60, DUR: opt.dur || preset?.duration || defaults.dur || 12, LANG: opt.lang || 'en', TITLE: opt.title || path.basename(target), HUE: 262, SPEC: preset ? JSON.stringify(preset, null, 1) : '' };
const fill = s => s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
const isText = f => /\.(html|mjs|js|md|json|css|txt)$/i.test(f);
function copy(from, to, transform) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copy(a, b, transform); else if (transform && isText(e.name)) fs.writeFileSync(b, fill(fs.readFileSync(a, 'utf8'))); else fs.copyFileSync(a, b);
  }
}
fs.mkdirSync(target, { recursive: true });
copy(path.join(SKILL, 'templates', 'lib'), path.join(target, 'lib'));
copy(path.join(SKILL, 'templates', 'fonts'), path.join(target, 'fonts'));
copy(tdir, target, true); try { fs.rmSync(path.join(target, 'template.json')); } catch { /* absent */ }
if (opt.examples) copy(path.join(SKILL, 'templates', 'examples'), path.join(target, 'examples'));   // runnable engine demos: node tools/render.mjs sheet --page examples/transitions.html --markers
fs.mkdirSync(path.join(target, 'tools'), { recursive: true });
for (const f of ['render.mjs', 'chrome.mjs', 'pcv-page.js', 'qc.mjs', 'analyze-audio.mjs', 'doctor.mjs']) if (fs.existsSync(path.join(HERE, f))) fs.copyFileSync(path.join(HERE, f), path.join(target, 'tools', f));
for (const d of ['assets', 'out', 'qc']) fs.mkdirSync(path.join(target, d), { recursive: true });
// the creative-engine CLIs live in the skill folder (they need references/atlas/*.md); thin forwarders let you run them from inside the project: node tools/atlas.mjs search …
for (const f of ['atlas.mjs', 'inspire.mjs']) {
  const real = path.join(SKILL, 'scripts', f);
  fs.writeFileSync(path.join(target, 'tools', f), `// forwards to the skill's own ${f} (${real.replace(/\\/g, '/')}) so it can be run from inside this project\nimport fs from 'node:fs'; import { pathToFileURL } from 'node:url';\nconst real = ${JSON.stringify(real)};\nif (!fs.existsSync(real)) { console.error('the cinewright skill was not found at ' + real + ' — run its scripts/${f} directly'); process.exit(1); }\nawait import(pathToFileURL(real).href);\n`);
}

console.log(`✔ project created: ${target}   (template: ${template}, ${tokens.W}×${tokens.H} @ ${tokens.FPS} fps, ${tokens.DUR}s, ${tokens.LANG})

next (run inside the project folder):
  node audio.mjs                         # synthesise audio.wav from the cues
  node tools/render.mjs sheet --count 12 # contact sheet → qc/sheet.png (look at it!)
  node tools/render.mjs verify           # determinism check
  node tools/render.mjs --quality draft  # fast draft render → out/video.mp4
  node tools/render.mjs                  # final render (resumable). Long? add --detach, poll "render.mjs status", end with "render.mjs stop"
  node tools/qc.mjs check                # verify the encoded file
  node tools/render.mjs serve            # live preview with audio in your browser

creative engine (also from inside the project):
  node tools/inspire.mjs --brief "…"     # three creative directions for a brief
  node tools/atlas.mjs search <words>    # 250+ tested techniques; show <id> · sheet <ids> to SEE them     (skill folder: ${SKILL})
  API on one page: ${path.join(SKILL, 'references', 'engine.md')}    process: ${path.join(SKILL, 'references', 'protocol.md')}`);
if (preset?.scenes) console.log(`
this film is cut into ${preset.scenes.reduce((n, x) => n + (x.type === 'words' ? (x.words || []).length : 1), 0)} shots in ${preset.duration} s (video.html → <script id="cues">): one idea per shot, a carried object, travelling transitions. Replace the copy and keep that rhythm — a heading above three cards is a slide, give each item its own shot (hit / fact / words). Fields and recipes: ${path.join(SKILL, 'references', 'motion-graphics.md')}`);
