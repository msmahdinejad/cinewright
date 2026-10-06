#!/usr/bin/env node
// inspire.mjs — turn a brief into THREE different creative directions (concept device · metaphor · style system · twist · techniques · timeline skeleton · sound plan).
// The point is to escape the default look: every direction is a different bundle from the atlas, seeded by the brief (re-roll with --seed).
//
//   node inspire.mjs --brief "make a 15-second showreel that proves I am an incredible motion designer"
//   node inspire.mjs --file brief.md --duration 30 --n 3 --seed 2          read the brief from a file; 30 s plan; re-roll
//   node inspire.mjs --brief "…" --json                                    machine-readable
// Then: pick ONE direction (or mix, but keep a single style system), write it into brief.md, and look up its techniques:  node atlas.mjs show <id> · node atlas.mjs sheet <id…>
import fs from 'node:fs';
import { loadAtlas, search } from './atlas-lib.mjs';

const argv = process.argv.slice(2), opt = {}; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); if (k === 'json') opt[k] = true; else opt[k] = argv[++i]; } }
let brief = opt.brief || ''; if (opt.file) brief = fs.readFileSync(opt.file, 'utf8'); if (brief && fs.existsSync(brief) && fs.statSync(brief).isFile()) brief = fs.readFileSync(brief, 'utf8');
if (!brief.trim()) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).slice(1, 9).map(l => l.slice(3)).join('\n')); process.exit(brief === '' ? 1 : 0); }

const A = loadAtlas(), byId = id => A.entries.find(e => e.id === id), N = Math.min(5, Math.max(1, +opt.n || 3));
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
let seed = (hash(brief) + (+opt.seed || 0) * 7919) >>> 0; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr, k = 1, avoid = []) => { const pool = arr.filter(x => !avoid.includes(x)), out = []; while (out.length < k && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]); return k === 1 ? out[0] : out; };
const lower = brief.toLowerCase(), persian = /[؀-ۿ]/.test(brief) || /persian|farsi|iran|rtl/.test(lower), vertical = /9:16|vertical|reels?|tiktok|shorts|instagram story/.test(lower);
const dur = +opt.duration || (() => { const m = /(\d{1,3})\s*(?:-|–|to)?\s*(\d{1,3})?\s*(?:s\b|sec|second)/.exec(lower); return m ? (m[2] ? Math.round((+m[1] + +m[2]) / 2) : +m[1]) : 20; })();

/* ───────────────────────── choose ───────────────────────── */
const STOP = new Set('make create video piece motion graphics product decide format length style story scenes typography color colour music pacing creative director you your the and for with that this from will want need also just only must should any all are not use using after before build whatever installed available report path done output mp4 audio final render review frames mid way fix weak anything requirements assets facts invent features dont surprise bold original generic ad out including repo github https com about into viewer understand feel special brief concept short first end name text screen screens something things thing really very more most than then them they their there when what which while where who why how can could would might like get got has have had was were been being does did doing its our ours own per via'.split(' '));
const words = lower.replace(/[^a-z0-9؀-ۿ\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)), bias = [];
if (persian) bias.push('persian', 'heritage'); if (/dev|code|open.?source|api|terminal|developer/.test(lower)) bias.push('terminal', 'code', 'glass'); if (/kid|child|fun|play|toy|family/.test(lower)) bias.push('playful', 'clay', 'paper');
if (/luxur|premium|brand|elegan|fashion/.test(lower)) bias.push('cinematic', 'noir', 'clean'); if (/music|party|night|club|game|gaming/.test(lower)) bias.push('neon', 'glitch', 'brutalist'); if (/space|ai\b|intelligen|science|future/.test(lower)) bias.push('space', 'liquid', 'holo');
if (/data|growth|finance|report|analytic/.test(lower)) bias.push('data', 'swiss', 'glass'); if (/showreel|show reel|portfolio|resume|résumé|motion designer/.test(lower)) bias.push('cinematic', 'kinetic', 'liquid', 'brutalist'); if (/translat|language|dubb|speech|voice|subtitle/.test(lower)) bias.push('translation', 'voice');
// "go all out / showreel / trailer / wow" asks for SPECTACLE: the restrained styles (thin lines, empty space) are left out unless the brief asks for calm - the first Codex benchmark run showed what happens otherwise
const BOLD = /go all out|all out|awesome|wow|incredible|spectacular|showreel|show reel|trailer|cinematic|epic|خفن|شگفت/.test(lower) && !/minimal|calm|quiet|zen|subtle|elegan|luxur|premium|clean|آرام|مینیمال/.test(lower);
const QUIET = new Set(['style-clean-product', 'style-sunset-lofi', 'style-noir-editorial', 'style-ink-calligraphy', 'style-holo-blueprint', 'style-terminal-hacker']);
const styles = A.entries.filter(e => e.family === 'styles' && !(BOLD && QUIET.has(e.id)));
const ranked = search(A, [...words, ...bias, ...bias], { family: 'styles', n: 30 }).filter(e => styles.includes(e)); const rest = styles.filter(s => !ranked.includes(s));
const chosenStyles = []; // diverse: best match, a contrasting match, a wildcard
if (ranked[0]) chosenStyles.push(ranked[0]); for (const s of ranked.slice(1)) { if (chosenStyles.length >= N) break; const overlap = s.tags.filter(t => chosenStyles.some(c => c.tags.includes(t) && !['style'].includes(t))).length; if (overlap <= 2) chosenStyles.push(s); }
while (chosenStyles.length < N) { const c = pick(rest.concat(ranked), 1, chosenStyles); if (!c) break; chosenStyles.push(c); }

const devices = A.entries.filter(e => e.id.startsWith('idea-') && !['idea-metaphor-ladder'].includes(e.id)), metaphors = search(A, [...words, ...bias], { family: 'ideas', prefix: 'meta-', n: 6 });
const fallbackMeta = A.entries.filter(e => e.id.startsWith('meta-'));
const TWISTS = ['Everything is built from ONE repeating shape (a ring / a dot / a bar) that changes role in every scene.', 'The film is a perfect loop: the last frame equals the first and the sound tail leads into the first hit.', 'Invert the palette for exactly one scene (the idea flips), then return.',
  'One scene is deliberately silent for 0.4 s — all sound removed — right before the biggest hit.', 'Every transition is a MATCH CUT on a shared shape (circle, line, glyph), never a generic effect.', 'Run the whole film as one continuous camera move; hide every join behind an object passing the lens.',
  'Show the process: wireframe → shaded → rendered inside the film (the same object three times).', 'All text appears in two scripts at once (Persian + Latin) and the two lines interlock rhythmically.', 'One scene is rendered as ASCII / dithered / hatch, then "resolves" into full colour.',
  'The hero object is never named until the final second — only its effects are shown.', 'Use scale as the contrast: a single dot in vast empty space, then a world of dots.', 'Every cut lands on a kick; between cuts nothing moves faster than a slow push-in.', 'Break the frame once: a graphic escapes its scene and crosses into the next.',
  'Time ramps: slow-motion (15 %) around the hit, double speed for the build-up.', 'Let a particle swarm act as the "camera operator": it forms each scene\'s subject and dissolves it.', 'The soundtrack is audible as picture: waveform / equaliser geometry appears in every scene.',
  'One accent colour exists ONLY for the key idea and appears nowhere else until the payoff.', 'Start in a different aspect ratio (4:3 or 2.39:1 letterbox) and open to full frame at the turn.', 'Replace the logo reveal with a logo that is built, used, and finally revealed as the thing you were looking at.'];
const CAMERAS = ['impossible camera — flies through letters, screens and shapes', 'one-take flythrough with speed ramps', 'locked-off frames with beat punches (+3 % scale, shake) and hard cuts', 'slow orbit + dolly on 3D heroes, whip-pans between scenes', 'handheld documentary drift with rack-focus',
  '2.5D parallax layers drifting at different speeds', 'macro → wide zoom-out reveal', 'rotating/scaling the type itself as the camera'];
const ADJ = ['Velvet', 'Liquid', 'Midnight', 'Electric', 'Paper', 'Quiet', 'Molten', 'Prism', 'Neon', 'Atlas', 'Lunar', 'Amber', 'Glass', 'Silent', 'Kinetic', 'Orchid', 'Cobalt', 'Saffron', 'Hollow', 'Polar'];
const NOUN = ['Signal', 'Orbit', 'Bridge', 'Lantern', 'Current', 'Compass', 'Harbour', 'Echo', 'Engine', 'Garden', 'Tide', 'Ember', 'Window', 'Thread', 'Skyline', 'Mirror', 'Cascade', 'Pulse', 'Atlas', 'Voyage'];
const idsOf = f => (f || '').split(/[\s,]+/).filter(x => byId(x));
const crossFamilies = ['type', 'particles', 'shaders', 'three-d', 'graphic', 'looks', 'light', 'camera', 'ui-data'];
const first = s => (s || '').split(/(?<=[.;])\s/)[0].slice(0, 140);

/* ───────────────────────── timeline skeleton ───────────────────────── */
function timeline(d, tech, trans) {
  const reel = /showreel|reel|portfolio|resume|résumé/.test(lower), n = Math.max(4, Math.min(10, reel ? Math.round(d / 2.2) : Math.round(d / 3.1)));
  const w = Array.from({ length: n }, (_, i) => i === 0 ? .62 : i === n - 1 ? 1.5 : i === n - 2 ? 1.05 : 1.12 - .42 * Math.sin(Math.PI * (i - 1) / Math.max(1, n - 3))), tot = w.reduce((a, b) => a + b, 0); let t = 0; const rows = [], T = [...trans];
  for (let i = 0; i < n; i++) { const len = w[i] / tot * d, role = i === 0 ? 'HOOK (motion in frame 1, hit by 0.8 s)' : i === n - 1 ? 'RESOLVE (settle, hold the name ≥ 1 s)' : i === n - 2 ? 'PEAK (biggest visual + biggest sound)' : i < n / 2 ? 'SET-UP / build' : 'ESCALATION (cuts get shorter)'; rows.push({ from: +t.toFixed(1), to: +(t + len).toFixed(1), role, tech: tech[i % tech.length], enter: i ? T[(i - 1) % T.length] : '—' }); t += len; }
  return rows;
}

/* ───────────────────────── build the directions ───────────────────────── */
const LOGO_BRIEF = /logo|brand|identity|sting|wordmark|end.?card|name|mark|لوگو|برند|نشان/.test(lower);
const used = { dev: [], meta: [], twist: [], cam: [], name: [] }, out = [];
chosenStyles.forEach((st, k) => {
  const device = pick(devices, 1, used.dev); used.dev.push(device); const meta = (metaphors.filter(m => !used.meta.includes(m))[0]) || pick(fallbackMeta, 1, used.meta); used.meta.push(meta);
  const twist = pick(TWISTS, 1, used.twist); used.twist.push(twist); const cam = pick(CAMERAS, 1, used.cam); used.cam.push(cam);
  const styleTech = idsOf(st.fields.techniques), foreign = A.entries.filter(e => crossFamilies.includes(e.family) && !styleTech.includes(e.id) && !(byId(e.id).blocks.length === 0));
  const tech = [...pick(styleTech, Math.min(4, styleTech.length)), ...pick(foreign.filter(e => !styleTech.includes(e.id)).map(e => e.id), 3)];
  // briefs that end on a name / logo / sting get a logo-reveal technique from the `logos` family as the RESOLVE shot (a different one per direction)
  const logoPool = A.entries.filter(e => e.family === 'logos'), logoPick = LOGO_BRIEF && logoPool.length ? logoPool[(k * 3 + (lower.length % 7)) % logoPool.length] : null;
  if (logoPick && !tech.includes(logoPick.id)) tech.splice(tech.length - 1, 1, logoPick.id);
  const trans = [...new Set([...(st.fields.transitions || '').split(/[\s,]+/).filter(Boolean), ...pick(['whip', 'zoomBlurCut', 'iris', 'glitch', 'slide', 'blur', 'lightleak', 'dissolve', 'flash', 'doors', 'liquid', 'scan'], 3)])];
  const snd = idsOf(st.fields.sound); const name = `${pick(ADJ, 1, used.name)} ${pick(NOUN, 1, used.name)}`; used.name.push(name.split(' ')[0], name.split(' ')[1]);
  out.push({ k: k + 1, name, style: st, device, meta, twist, cam, tech, trans, snd, tl: timeline(dur, tech, trans).map((r, i, a) => logoPick && i === a.length - 1 ? { ...r, tech: logoPick.id } : r), fonts: (st.fields.fonts || '').split(/\s+/).filter(Boolean), palette: (st.fields.palette || '').split(/\s+/) });
});

if (opt.json) { console.log(JSON.stringify(out.map(d => ({ direction: d.name, style: d.style.id, palette: d.palette, fonts: d.fonts, device: d.device.id, metaphor: d.meta.id, twist: d.twist, camera: d.cam, techniques: d.tech, transitions: d.trans, sound: d.snd.map(s => s.id), timeline: d.tl })), null, 1)); process.exit(0); }

console.log(`# Creative directions  (brief ${brief.trim().split(/\s+/).length} words · ${dur} s${vertical ? ' · vertical' : ''}${persian ? ' · Persian audience → bilingual text, RTL-aware motion' : ''})`);
console.log(`Pick ONE (or take the device from one and the style from another — but keep a single style system). Write it into brief.md, then \`node atlas.mjs show <id>\` for every technique below.\n`);
for (const d of out) {
  console.log(`## Direction ${String.fromCharCode(64 + d.k)} — "${d.name}"  ·  style: ${d.style.title} (${d.style.id})`);
  console.log(`- **Concept device:** ${d.device.id} — ${first(d.device.fields.use)}`); console.log(`- **Metaphor bank:** ${d.meta.id} — ${first(d.meta.fields.use)}   → ${first(d.meta.fields.how)}`);
  console.log(`- **Twist (makes it yours):** ${d.twist}`); console.log(`- **Camera language:** ${d.cam}`); console.log(`- **Hook (first 1.5 s) — choose one:** an impossible image already in motion · a 2–4 word statement slammed on the beat · black + a pulse, then a hit at 0.8 s · the finished result first, then rewind`);
  console.log(`- **Palette** (bg · base · accent · accent2 · light): ${d.palette.join('  ')}   **Fonts:** ${d.fonts.map(f => 'K.FONTS.' + f).join(', ')}`); console.log(`- **Motion:** ${d.style.fields.motion}`); console.log(`- **Grade:** ${d.style.fields.look}`);
  if (BOLD) console.log('- **Boldness floor** (checked by `qc.mjs look`): the hero fills >= 40 % of the frame height; the background is never flat black (shader / gradient / pattern); median frame fill >= 25 %; at least one full-bleed moment; headline type >= 12 % of the frame height');
  console.log(`- **Techniques to use (≥ 6, from ≥ 4 families):**`); for (const id of d.tech) { const e = byId(id); console.log(`    - \`${id}\` [${e.family}] — ${e.title}`); }
  console.log(`- **Transitions (≥ 4 different):** ${d.trans.join(' · ')}`); console.log(`- **Sound plan:** ${d.snd.length ? d.snd.map(s => '`' + s + '`').join(' · ') : 'see sound.md'}  (+ \`sfx-whoosh-set\` before cuts, \`sfx-hit-stack\` on the peak, duck 0.2 s before it)`);
  console.log(`- **Avoid:** ${d.style.fields.avoid}`); console.log(`- **Timeline skeleton** (adjust to your story; cut on beats):`);
  console.log(`  | time (s) | role | technique | enters with |\n  |---|---|---|---|`); for (const r of d.tl) console.log(`  | ${r.from}–${r.to} | ${r.role} | \`${r.tech}\` | ${r.enter} |`); console.log('');
}
console.log(`Ambition budget (the floor, not the target): ≥ 6 atlas techniques from ≥ 4 families · ≥ 4 different transitions · camera motion in EVERY scene · a sound event for every cut and every hit · one visual idea you cannot find in the templates · 3 review rounds (sheet → fix → energy check).`);
