#!/usr/bin/env node
// rate.mjs — blind A/B human rating, because numbers cannot judge beauty.
//
//   node benchmark/rate.mjs <run-id>                       build benchmark/runs/<run-id>/blind/index.html (open it in a browser, rate, click "Download votes")
//   node benchmark/rate.mjs --tally <run-id> votes.json …  un-blind the votes and write benchmark/results/<run-id>/votes.json (win rates, mean scores)
//
// The page shows each task's two films as "A" and "B" in random order; the key stays on disk (blind/key.json). With more than two conditions every pair is rated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const SUITE = JSON.parse(fs.readFileSync(path.join(HERE, 'suite', 'suite.json'), 'utf8'));
const CRITERIA = [['concept', 'Idea — is there a specific, original concept?'], ['motion', 'Motion — does it feel directed, not like slides?'], ['polish', 'Polish — type, colour, depth, finish'], ['sound', 'Sound — does the audio carry the picture?']];

if (args[0] === '--tally') {
  const [, runId, ...files] = args; if (!runId || !files.length) { console.error('usage: rate.mjs --tally <run-id> votes.json …'); process.exit(1); }
  const key = JSON.parse(fs.readFileSync(path.join(HERE, 'runs', runId, 'blind', 'key.json'), 'utf8')), agg = {}; let ballots = 0;
  for (const f of files) for (const v of JSON.parse(fs.readFileSync(f, 'utf8')).votes || []) {
    const k = key[v.pair]; if (!k) continue; ballots++; const a = (agg[k.task] ||= { n: 0, wins: {}, ties: 0, scores: {} });
    a.n++; const winner = v.choice === 'A' ? k.A : v.choice === 'B' ? k.B : null; if (winner) a.wins[winner] = (a.wins[winner] || 0) + 1; else a.ties++;
    for (const [c] of CRITERIA) for (const side of ['A', 'B']) { const val = v.scores?.[c]?.[side]; if (val) { const cond = k[side], s = ((a.scores[cond] ||= {})[c] ||= []); s.push(val); } }
  }
  for (const a of Object.values(agg)) for (const cond of Object.keys(a.scores)) for (const c of Object.keys(a.scores[cond])) { const l = a.scores[cond][c]; a.scores[cond][c] = +(l.reduce((x, y) => x + y, 0) / l.length).toFixed(2); }
  const out = path.join(HERE, 'results', runId); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'votes.json'), JSON.stringify({ runId, ballots, tasks: agg }, null, 2) + '\n');
  console.log(`✔ ${ballots} ballot(s) → benchmark/results/${runId}/votes.json`); for (const [t, a] of Object.entries(agg)) console.log(`  ${t}: ${JSON.stringify(a.wins)} ties ${a.ties}`); process.exit(0);
}

const runId = args[0]; if (!runId) { console.error('usage: rate.mjs <run-id>   (a folder name under benchmark/runs/)'); process.exit(1); }
const runDir = path.join(HERE, 'runs', runId); if (!fs.existsSync(runDir)) { console.error('no such run: ' + runDir); process.exit(1); }
const jobs = fs.readdirSync(runDir).filter(d => fs.existsSync(path.join(runDir, d, 'final.mp4'))).map(d => { const [task, cond, rep] = d.split('__'); return { d, task, cond, rep }; });
const byTask = {}; for (const j of jobs) (byTask[j.task] ||= []).push(j);
const pairs = [], key = {};
for (const [task, list] of Object.entries(byTask)) for (let i = 0; i < list.length; i++) for (let k = i + 1; k < list.length; k++) {
  if (list[i].cond === list[k].cond) continue; const flip = Math.random() < .5, [a, b] = flip ? [list[k], list[i]] : [list[i], list[k]], id = `${task}#${pairs.length}`;
  pairs.push({ id, task, A: a.d, B: b.d }); key[id] = { task, A: a.cond, B: b.cond };
}
if (!pairs.length) { console.error('need at least two different conditions with a final.mp4 for the same task'); process.exit(1); }
const blind = path.join(runDir, 'blind'); fs.mkdirSync(blind, { recursive: true }); fs.writeFileSync(path.join(blind, 'key.json'), JSON.stringify(key, null, 2));
const taskTitle = id => SUITE.tasks.find(t => t.id === id)?.title || id;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blind rating — ${runId}</title>
<style>:root{color-scheme:light dark;--bg:#fff;--fg:#14161f;--mut:#667;--line:#dde;--acc:#5b3df5}@media(prefers-color-scheme:dark){:root{--bg:#0e1018;--fg:#e9ebf5;--mut:#98a;--line:#272b3d;--acc:#8f7bff}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,Segoe UI,sans-serif}main{max-width:1100px;margin:0 auto;padding:24px 16px 80px}h1{margin:.2em 0}.pair{border-top:1px solid var(--line);padding:24px 0}
.vids{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:760px){.vids{grid-template-columns:1fr}}video{width:100%;background:#000;border-radius:8px}.lab{font-weight:700;margin:4px 0}
.row{display:grid;grid-template-columns:1fr 130px 130px;gap:8px;align-items:center;margin:6px 0}.row span{color:var(--mut)}label{cursor:pointer}.pref{display:flex;gap:16px;margin:12px 0;font-weight:600}
button{background:var(--acc);color:#fff;border:0;border-radius:8px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer}small{color:var(--mut)}</style></head><body><main>
<h1>Blind rating</h1><p>Watch both films of each pair with sound. Which is better overall? Then score each film 1–5. You do not know which one used the skill. When you finish, click <b>Download votes</b> and send the file to whoever ran the benchmark.</p>
${pairs.map(p => `<section class="pair" data-pair="${p.id}"><h2>${taskTitle(p.task)}</h2><div class="vids"><div><div class="lab">A</div><video controls preload="metadata" src="../${p.A}/final.mp4"></video></div><div><div class="lab">B</div><video controls preload="metadata" src="../${p.B}/final.mp4"></video></div></div>
<div class="pref"><span>Better overall:</span><label><input type="radio" name="c-${p.id}" value="A"> A</label><label><input type="radio" name="c-${p.id}" value="B"> B</label><label><input type="radio" name="c-${p.id}" value="tie"> tie</label></div>
${CRITERIA.map(([c, t]) => `<div class="row"><span>${t}</span><label>A <select data-c="${c}" data-s="A">${[0, 1, 2, 3, 4, 5].map(n => `<option value="${n}">${n || '–'}</option>`).join('')}</select></label><label>B <select data-c="${c}" data-s="B">${[0, 1, 2, 3, 4, 5].map(n => `<option value="${n}">${n || '–'}</option>`).join('')}</select></label></div>`).join('')}</section>`).join('\n')}
<p><button id="dl">Download votes</button> <small id="msg"></small></p></main>
<script>document.getElementById('dl').onclick=()=>{const votes=[];document.querySelectorAll('.pair').forEach(s=>{const id=s.dataset.pair,ch=s.querySelector('input[name="c-'+id+'"]:checked');if(!ch)return;const scores={};s.querySelectorAll('select').forEach(x=>{if(+x.value){(scores[x.dataset.c]??={})[x.dataset.s]=+x.value}});votes.push({pair:id,choice:ch.value,scores})});
if(!votes.length){document.getElementById('msg').textContent='Rate at least one pair first.';return}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({run:${JSON.stringify(runId)},votes},null,1)],{type:'application/json'}));a.download='votes-'+Date.now()+'.json';a.click();document.getElementById('msg').textContent=votes.length+' pair(s) saved.'}</script></body></html>`;
fs.writeFileSync(path.join(blind, 'index.html'), html);
console.log(`✔ ${pairs.length} pair(s) → ${path.relative(process.cwd(), path.join(blind, 'index.html'))}\n  open it in a browser; the A/B order is random and the key is in blind/key.json (do not open it before rating).\n  tally:  node benchmark/rate.mjs --tally ${runId} votes-*.json`);
