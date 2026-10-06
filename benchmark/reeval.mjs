#!/usr/bin/env node
// reeval.mjs — re-measure finished runs with the CURRENT metrics (use it after metrics.mjs or the skill's qc.mjs changed).
//   node benchmark/reeval.mjs <run-id> [--no-export]
// Reads benchmark/runs/<run-id>/<job>/{final.mp4,events.jsonl,work/}, rewrites summary.json there and in benchmark/results/<run-id>/<job>/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureVideo, projectStats, sessionStats } from './lib/metrics.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const runId = process.argv[2]; if (!runId) { console.error('usage: node benchmark/reeval.mjs <run-id> [--no-export]'); process.exit(1); }
const dir = path.join(HERE, 'runs', runId); if (!fs.existsSync(dir)) { console.error('no such run: ' + dir); process.exit(1); }
for (const job of fs.readdirSync(dir).filter(d => fs.existsSync(path.join(dir, d, 'summary.json')))) {
  const jd = path.join(dir, job), f = path.join(jd, 'summary.json'), s = JSON.parse(fs.readFileSync(f, 'utf8')), mp4 = path.join(jd, 'final.mp4');
  if (fs.existsSync(mp4)) s.video = measureVideo(mp4);
  s.session = sessionStats(path.join(jd, 'events.jsonl')) || s.session; if (fs.existsSync(path.join(jd, 'work'))) s.project = projectStats(path.join(jd, 'work'));
  s.integrity = { skillVisible: !!s.integrity?.skillVisible, touchedSkill: s.session?.touchedSkill ?? null, contaminated: !s.integrity?.skillVisible && !!s.session?.touchedSkill };
  fs.writeFileSync(f, JSON.stringify(s, null, 2) + '\n');
  const ex = path.join(HERE, 'results', runId, job, 'summary.json'); if (!process.argv.includes('--no-export') && fs.existsSync(path.dirname(ex))) fs.copyFileSync(f, ex);
  const v = s.video; console.log(`✔ ${job}: ${v.ok ? `quiet ${v.energy?.quietPct}% · fill ${v.look?.medianFill}% · contaminated=${s.integrity.contaminated}` : v.error}`);
}
