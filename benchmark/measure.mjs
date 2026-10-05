#!/usr/bin/env node
// measure.mjs — measure a video that already exists (made by any agent, with or without the skill) and store the result like a benchmark run.
//
//   node benchmark/measure.mjs <video.mp4> --task showreel-15s --label "Codex + skill v1.1" --agent "codex 0.148" --skill 1.1
//        [--condition skill|baseline|other] [--project <folder with brief.md, qc/…>] [--session events.jsonl] [--note "…"] [--out benchmark/results/history] [--preview]
//
// Use it to add your own results: run your agent however you like, point this at the MP4, open a PR with the generated folder (JSON + sheet.jpg — never the video).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureVideo, preview, projectStats, sessionStats, sheet } from './lib/metrics.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), pos = [], o = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); if (['preview'].includes(k)) o[k] = true; else o[k] = argv[++i]; } else pos.push(a); }
const video = pos[0];
if (!video || !fs.existsSync(video)) { console.error('usage: node benchmark/measure.mjs <video.mp4> --task <id> --label "…" --agent "codex 0.148" --skill <version|none> [--condition …] [--project dir] [--session events.jsonl] [--out dir] [--preview]'); process.exit(1); }

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const task = o.task || 'unspecified', cond = o.condition || (o.skill && o.skill !== 'none' ? 'skill' : 'baseline');
const id = `${task}__${slug(o.label || cond)}`, outDir = path.resolve(o.out || path.join(ROOT, 'benchmark', 'results', 'measured'), id); fs.mkdirSync(outDir, { recursive: true });

console.log('measuring', video, '…');
const summary = {
  schema: 1, id, kind: 'measured', task, condition: cond, label: o.label || cond, agent: o.agent || 'unknown', model: o.model || null, skill: o.skill || 'none',
  date: new Date().toISOString().slice(0, 10), wallSeconds: o.wall ? +o.wall : null, note: o.note || '',
  video: measureVideo(video), session: o.session ? sessionStats(o.session) : null, project: o.project ? projectStats(path.resolve(o.project)) : null, files: {},
};
if (summary.video.ok) {
  if (sheet(video, path.join(outDir, 'sheet.jpg'))) summary.files.sheet = 'sheet.jpg';
  if (o.preview && preview(video, path.join(outDir, 'preview.webp'))) summary.files.preview = 'preview.webp';
}
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
const v = summary.video; console.log(v.ok ? `✔ ${v.duration.toFixed(1)} s ${v.width}×${v.height} · quiet ${v.energy?.quietPct ?? '?'}% · ${v.scenes?.changes ?? '?'} scene changes · ${v.audio ? v.audio.lufs + ' LUFS' : 'NO AUDIO'} · ${v.energy?.longestStatic ?? '?'} s longest static hold` : '✘ ' + v.error);
console.log('→', path.relative(process.cwd(), outDir));
