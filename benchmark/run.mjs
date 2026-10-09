#!/usr/bin/env node
// run.mjs — the benchmark runner: the SAME prompt, given to a coding agent in a fresh folder, with and without the skill (or with two versions of it),
// then measured with the same objective metrics. Each agent is compared with ITSELF (Codex vs Codex + skill; never Codex vs Claude).
// Default agent: the Codex CLI (`codex exec`), reasoning effort xhigh.
//
//   node benchmark/run.mjs --tasks showreel-15s --models gpt-6-astra,gpt-6.1-sol          the headline comparison: 2 models × (no skill, skill), xhigh
//   node benchmark/run.mjs --suite quick --reps 2                                         three tasks, two repetitions each (agents are stochastic: one run proves nothing)
//   node benchmark/run.mjs --tasks showreel-15s --conditions baseline,v1=../old/cinewright,v2=skills/cinewright       compare two versions of the skill
//   node benchmark/run.mjs --suite quick --dry-run                                        print the plan, change nothing
//   node benchmark/run.mjs --suite quick --agent-cmd "claude -p --dangerously-skip-permissions"      any agent that reads the prompt on stdin and works in the current folder
//
// Conditions:  baseline = no skill (any installed copy of the skill is disabled for this run) · skill = skills/cinewright from this checkout ·
//              name=path = another copy of the skill (e.g. an older version) · all conditions get the identical task prompt (the skill condition just starts it with `$cinewright `) and the identical delivery footer.
// Options:     --models a,b · --effort low|medium|high|xhigh (default xhigh) · --timeout-min 75 · --stall-min 25 (no output that long = a hung connection: stop and retry) · --reps N · --out <dir> · --skill-version <label> · --label-suffix <text> · --fake-video <mp4> (pipeline test, no agent)
//
// SAFETY: the agent runs with full access (`--dangerously-bypass-approvals-and-sandbox`) inside a throw-away folder under benchmark/runs/. Run benchmarks on a machine or container you are happy to let an agent use.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureVideo, preview, projectStats, sessionStats, sheet } from './lib/metrics.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const argv = process.argv.slice(2), opt = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (!a.startsWith('--')) continue; const k = a.slice(2); if (['dry-run', 'no-export', 'keep-work'].includes(k)) opt[k] = true; else opt[k] = argv[++i]; }

const SUITE = JSON.parse(fs.readFileSync(opt['suite-file'] ? path.resolve(opt['suite-file']) : path.join(HERE, 'suite', 'suite.json'), 'utf8'));
const taskPrompt = t => t.prompt || fs.readFileSync(path.join(HERE, 'suite', t.promptFile), 'utf8').trim();
const FOOTER = SUITE.footer;

// ── plan ───────────────────────────────────────────────────────────────────────────────────
const ids = opt.tasks ? opt.tasks.split(',') : (SUITE.sets[opt.suite || 'quick'] || (opt.suite ? opt.suite.split(',') : SUITE.sets.quick));
const tasks = ids.map(id => SUITE.tasks.find(t => t.id === id) || (console.error(`unknown task "${id}". tasks: ${SUITE.tasks.map(t => t.id).join(', ')}`), process.exit(1)));
const defaultSkill = path.join(ROOT, 'skills', 'cinewright');
const conditions = (opt.conditions || 'baseline,skill').split(',').map(c => {
  if (c === 'baseline') return { name: 'baseline', skill: null };
  if (c === 'skill') return { name: 'skill', skill: defaultSkill };
  const [n, p] = c.split('='); if (!p) { console.error(`condition "${c}": use baseline | skill | name=path`); process.exit(1); }
  if (!fs.existsSync(path.join(path.resolve(p), 'SKILL.md'))) { console.error(`condition ${n}: no SKILL.md in ${path.resolve(p)}`); process.exit(1); }
  return { name: n, skill: path.resolve(p) };
});
const models = opt.models ? opt.models.split(',') : opt.model ? [opt.model] : [null];
const effort = opt.effort || (opt['agent-cmd'] ? null : 'xhigh');
const reps = +(opt.reps || 1), timeoutMs = +(opt['timeout-min'] || 75) * 60000, stallMs = +(opt['stall-min'] || 25) * 60000;
const runId = opt['run-id'] || opt.resume || new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 13);
const outRoot = path.resolve(opt.out || path.join(HERE, 'runs'), runId);
const slug = s => String(s || 'default').replace(/[^a-zA-Z0-9.]+/g, '-').toLowerCase();
const jobs = []; for (let r = 1; r <= reps; r++) for (const t of tasks) for (const m of models) for (const c of conditions) jobs.push({ task: t, cond: c, model: m, rep: r, id: `${t.id}__${slug(m)}__${c.name}__r${r}` });

const agentName = opt['agent-cmd'] ? 'custom' : 'codex';
const codexVersion = agentName === 'codex' ? (spawnSync('codex', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' }).stdout || '').trim() : '';
console.log(`benchmark ${runId}: ${jobs.length} job(s) — ${tasks.length} task(s) × ${models.map(m => m || 'default model').join(' / ')} × ${conditions.map(c => c.name).join(' / ')} × ${reps} rep(s) · agent: ${agentName}${codexVersion ? ' (' + codexVersion + ')' : ''}${effort ? ' · effort ' + effort : ''} · timeout ${timeoutMs / 60000} min/job`);
for (const j of jobs) console.log(`  · ${j.id}`);
if (opt['dry-run']) { console.log('\n--dry-run: nothing executed.'); process.exit(0); }
if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg is required for the measurements'); process.exit(1); }
fs.mkdirSync(outRoot, { recursive: true });

// ── helpers ────────────────────────────────────────────────────────────────────────────────
const copyDir = (a, b) => fs.cpSync(a, b, { recursive: true, filter: s => !/[\\/](node_modules|\.git|\.render)([\\/]|$)/.test(s) });
/** Installed copies of the skill that would leak into a baseline run (Codex reads ~/.agents/skills, ~/.codex/skills, $CODEX_HOME/skills). */
function installedCopies() {
  const home = os.homedir(), roots = [path.join(home, '.agents', 'skills'), path.join(home, '.codex', 'skills'), process.env.CODEX_HOME && path.join(process.env.CODEX_HOME, 'skills'), path.join(home, '.claude', 'skills')].filter(Boolean);
  return [...new Set(roots.flatMap(r => ['cinewright', 'pure-code-video'].map(n => path.join(r, n, 'SKILL.md'))).filter(p => fs.existsSync(p)))];   // pure-code-video = the name before 2.1
}
const killTree = pid => { try { if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']); else process.kill(-pid, 'SIGTERM'); } catch { /* already gone */ } };

function findVideo(work) {
  const direct = path.join(work, 'final.mp4'); if (fs.existsSync(direct)) return direct;
  const all = []; (function walk(d, depth) { if (depth > 5) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['node_modules', '.git', '.agents', '.render', 'lib', 'fonts'].includes(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p, depth + 1); else if (/\.(mp4|mov|webm)$/i.test(e.name) && !/(partial|segment|silent|preview|draft)/i.test(e.name)) all.push([p, fs.statSync(p).mtimeMs, fs.statSync(p).size]); } })(work, 0);
  all.sort((a, b) => b[1] - a[1]); return all.find(x => x[2] > 50000)?.[0] || null;
}

function runAgent(job, work, prompt, evFile, logFile) {
  return new Promise(resolve => {
    const t0 = Date.now(); let timedOut = false, child;
    const ev = fs.createWriteStream(evFile), log = fs.createWriteStream(logFile);
    if (opt['fake-video']) {                                                                // pipeline test without an agent
      fs.copyFileSync(path.resolve(opt['fake-video']), path.join(work, 'final.mp4')); if (job.cond.skill) { fs.writeFileSync(path.join(work, 'brief.md'), '# fake brief\n'); }
      ev.write(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 1000, output_tokens: 100 } }) + '\n'); ev.end(); log.end(); return resolve({ code: 0, timedOut: false, seconds: (Date.now() - t0) / 1000 });
    }
    let bin, args, shell = false;
    const env = { ...process.env, PCV_BENCH_CWD: work, PCV_BENCH_CONDITION: job.cond.name, PCV_BENCH_SKILL: job.cond.skill || '' };
    if (opt['agent-cmd']) { bin = opt['agent-cmd']; args = []; shell = true; }
    else {
      const disabled = installedCopies().map(p => `{path='${p}',enabled=false}`);                // the skill under test comes ONLY from the project folder
      args = ['exec', '--json', '--ephemeral', '--skip-git-repo-check', '--dangerously-bypass-approvals-and-sandbox', '-C', work, '-o', path.join(work, '..', 'last-message.txt'), '-c', `skills.config=[${disabled.join(',')}]`];
      if (job.model) args.push('-m', job.model); if (effort) args.push('-c', `model_reasoning_effort="${effort}"`); args.push('-');
      bin = 'codex'; shell = false;
      if (process.platform === 'win32') { bin = path.join(process.env.APPDATA || '', 'npm', 'codex.cmd'); if (!fs.existsSync(bin)) bin = 'codex.cmd'; }
    }
    // codex.cmd needs a shell on Windows; quote arguments for cmd.exe
    const useShell = shell || (process.platform === 'win32' && /\.cmd$/i.test(bin));
    const cmdline = useShell && !shell ? [bin, ...args].map(a => /[\s"{}'\[\],=]/.test(a) ? '"' + a.replace(/"/g, '\\"') + '"' : a).join(' ') : bin;
    child = useShell ? spawn(cmdline, { cwd: work, env, shell: true, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, detached: process.platform !== 'win32' }) : spawn(bin, args, { cwd: work, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, detached: process.platform !== 'win32' });
    let lastData = Date.now(), lastTick = Date.now(), stalled = false;                         // a silent hang (a dropped proxy, a stuck stream) is a transport failure too: no output for --stall-min (default 25) → stop and retry
    child.stdout.on('data', d => { lastData = Date.now(); ev.write(d); }); child.stderr.on('data', d => { lastData = Date.now(); log.write(d); });
    const watch = setInterval(() => { const now = Date.now(); if (now - lastTick > 90000) lastData = now; lastTick = now;                  // a gap between ticks = the computer slept: give the agent time to reconnect
      if (!done && now - lastData > stallMs) { stalled = true; clearInterval(watch); log.write(`\n[benchmark] stalled — no output for ${Math.round(stallMs / 60000)} min, stopping the agent\n`); killTree(child.pid); setTimeout(() => finish(null), 20000); } }, 30000);
    child.stdin.on('error', () => { /* agent exited early */ }); child.stdin.end(prompt);
    let done = false; const finish = code => { if (done) return; done = true; clearTimeout(timer); clearInterval(watch); ev.end(); log.end(); resolve({ code, timedOut, stalled, seconds: Math.min((Date.now() - t0) / 1000, timedOut ? timeoutMs / 1000 + 30 : 1e9) }); };   // never wait for stdio to close: an orphaned grandchild (a sub-agent, a Chrome) can hold the pipes for hours
    const timer = setTimeout(() => { timedOut = true; log.write('\n[benchmark] timeout — stopping the agent\n'); killTree(child.pid); setTimeout(() => finish(null), 20000); }, timeoutMs);
    child.on('close', finish); child.on('exit', code => setTimeout(() => finish(code), 10000));
    child.on('error', e => { clearTimeout(timer); clearInterval(watch); log.write(String(e)); ev.end(); log.end(); resolve({ code: -1, timedOut, seconds: (Date.now() - t0) / 1000, error: String(e) }); });
  });
}

// ── run ────────────────────────────────────────────────────────────────────────────────────
const index = [], who = agentName === 'codex' ? 'Codex' : 'Agent';
for (const [n, job] of jobs.entries()) {
  const dir = path.join(outRoot, job.id), work = path.join(dir, 'work');
  if (fs.existsSync(path.join(dir, 'summary.json'))) { console.log(`[${n + 1}/${jobs.length}] ${job.id}: already done (resume)`); index.push(JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf8'))); continue; }
  const prepare = () => {                                                                       // a fresh folder per attempt
    fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(work, { recursive: true });
    spawnSync('git', ['init', '-q', '.'], { cwd: work });                                       // a git root makes project-scoped skill discovery unambiguous
    if (job.cond.skill) { fs.mkdirSync(path.join(work, '.agents', 'skills'), { recursive: true }); copyDir(job.cond.skill, path.join(work, '.agents', 'skills', 'cinewright')); }
  };
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); prepare();
  const prompt = (job.cond.skill ? '$cinewright ' : '') + taskPrompt(job.task) + '\n\n' + FOOTER; fs.writeFileSync(path.join(dir, 'prompt.txt'), prompt);
  console.log(`\n[${n + 1}/${jobs.length}] ${job.id} — running the agent (up to ${timeoutMs / 60000} min) …`);
  const retries = +(opt.retries ?? 2), infraLog = []; let res, attempts = 0;
  for (;;) {                                                                                    // a dropped connection is not a result: retry transport failures with a fresh folder
    attempts++; res = await runAgent(job, work, prompt, path.join(dir, 'events.jsonl'), path.join(dir, 'agent.log'));
    const tail = (() => { try { return fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8').slice(-1500) + fs.readFileSync(path.join(dir, 'agent.log'), 'utf8').slice(-800); } catch { return ''; } })();
    const infra = res.stalled || !findVideo(work) && !res.timedOut && /turn\.failed|stream disconnected|Transport error|network error|ECONNRESET|ETIMEDOUT|socket hang up|overloaded|Reconnecting\.\.\. 5\/5|\b(429|502|503|504)\b/i.test(tail);
    if (!infra || attempts > retries) break;
    infraLog.push({ attempt: attempts, seconds: Math.round(res.seconds), error: res.stalled ? `stalled: no output for ${Math.round(stallMs / 60000)} min` : ((tail.match(/"message":"[^"]{0,200}/g) || []).pop() || 'transport error').slice(11) });
    console.log(`   ⚠ transport failure after ${Math.round(res.seconds / 60)} min (${infraLog.at(-1).error.slice(0, 120)}) — retrying ${attempts}/${retries} in a fresh folder`);
    fs.renameSync(path.join(dir, 'events.jsonl'), path.join(dir, `events.failed-${attempts}.jsonl`)); prepare(); await new Promise(r => setTimeout(r, 30000));
  }
  const video = findVideo(work), session = sessionStats(path.join(dir, 'events.jsonl'));
  const summary = {
    schema: 2, id: `${runId}/${job.id}`, kind: 'run', task: job.task.id, domain: job.task.domain, condition: job.cond.name, rep: job.rep, agentFamily: agentName,
    label: `${who}${job.model ? ' ' + job.model : ''}${job.cond.name === 'baseline' ? ', no skill' : ' + Cinewright'}${opt['label-suffix'] ? ' ' + opt['label-suffix'] : ''}`,
    agent: agentName === 'codex' ? codexVersion : 'custom', model: job.model || null, effort: effort || null, skill: job.cond.skill ? (opt['skill-version'] || (() => { try { return JSON.parse(fs.readFileSync(path.join(path.dirname(job.cond.skill), '..', 'package.json'), 'utf8')).version; } catch { return 'custom'; } })()) : 'none',
    date: new Date().toISOString().slice(0, 10), wallSeconds: Math.round(res.seconds), exitCode: res.code, timedOut: res.timedOut, attempts, ...(infraLog.length ? { transportFailures: infraLog } : {}), note: '',
    video: video ? measureVideo(video) : { ok: false, error: 'no video was produced' }, session, project: projectStats(work), files: {},
    integrity: { skillVisible: !!job.cond.skill, touchedSkill: session?.touchedSkill ?? null, contaminated: !job.cond.skill && !!session?.touchedSkill },
  };
  if (video && summary.video.ok) { fs.copyFileSync(video, path.join(dir, 'final.mp4')); if (sheet(video, path.join(dir, 'sheet.jpg'))) summary.files.sheet = 'sheet.jpg'; if (preview(video, path.join(dir, 'preview.webp'))) summary.files.preview = 'preview.webp'; }
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n'); index.push(summary);
  if (!opt['no-export']) {                                                                         // small artefacts (never the video) go where they can be committed
    const ex = path.join(HERE, 'results', runId, job.id); fs.mkdirSync(ex, { recursive: true }); fs.copyFileSync(path.join(dir, 'summary.json'), path.join(ex, 'summary.json'));
    for (const f of Object.values(summary.files)) fs.copyFileSync(path.join(dir, f), path.join(ex, f)); fs.copyFileSync(path.join(dir, 'prompt.txt'), path.join(ex, 'prompt.txt'));
  }
  if (!opt['keep-work']) for (const d of ['node_modules', '.render']) fs.rmSync(path.join(work, d), { recursive: true, force: true });
  const v = summary.video;
  if (!video && res.seconds < 120 && !res.timedOut) {                                                   // an agent that dies in two minutes is a quota / login / network problem, not a result: stop instead of burning the queue
    const tail = (() => { try { return fs.readFileSync(path.join(dir, 'agent.log'), 'utf8').slice(-600) + fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8').slice(-600); } catch { return ''; } })();
    if (/limit|quota|rate|unauthori[sz]ed|log ?in|credit|billing|network|ECONN|ENOTFOUND/i.test(tail)) {
      console.error(`\n[benchmark] the agent stopped almost immediately and the log mentions a limit/login/network problem — stopping the queue so nothing is wasted. Fix it, then re-run with --run-id ${runId} (finished jobs are skipped).\n${tail.slice(-400)}`);
      fs.rmSync(path.join(dir, 'summary.json'), { force: true }); fs.rmSync(path.join(HERE, 'results', runId, job.id), { recursive: true, force: true }); process.exit(3);
    }
  }
  console.log(v.ok ? `   ✔ ${v.duration.toFixed(1)} s · quiet ${v.energy?.quietPct ?? '?'}% · fill ${v.look?.medianFill ?? '?'}% · ${v.audio ? v.audio.lufs + ' LUFS' : 'no audio'} · ${Math.round(res.seconds / 60)} min${res.timedOut ? ' (TIMED OUT)' : ''}${summary.integrity.contaminated ? ' · ⚠ baseline touched the skill' : ''}` : `   ✘ ${v.error}${res.timedOut ? ' (timed out)' : ''}`);
}
fs.writeFileSync(path.join(outRoot, 'index.json'), JSON.stringify(index.map(s => ({ id: s.id, task: s.task, condition: s.condition, model: s.model, ok: s.video.ok, quietPct: s.video.energy?.quietPct, fill: s.video.look?.medianFill, wallSeconds: s.wallSeconds })), null, 2));
console.log(`\nraw runs: ${path.relative(process.cwd(), outRoot)}   committed-friendly summaries: benchmark/results/${runId}/\nnext:  node benchmark/report.mjs   ·   node benchmark/rate.mjs ${runId}   (blind human rating)`);
