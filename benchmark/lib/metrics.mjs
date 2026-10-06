// metrics.mjs — objective measurements of a finished video (and of the agent session that made it). No dependencies: Node + ffmpeg/ffprobe.
// These numbers do not judge beauty. They catch the usual failure of agent-made video — a slideshow with no sound design — and give a
// reproducible footing; beauty is judged by people (benchmark/rate.mjs).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SKILL_SCRIPTS = path.resolve(HERE, '..', '..', 'skills', 'cinewright', 'scripts');
const run = (bin, args, o = {}) => spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...o });

/** ffprobe facts. */
export function probe(file) {
  const r = run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file]); if (r.status !== 0) return null;
  const j = JSON.parse(r.stdout || '{}'), v = j.streams?.find(s => s.codec_type === 'video'), a = j.streams?.find(s => s.codec_type === 'audio');
  if (!v) return null; const [n, d] = (v.r_frame_rate || '30/1').split('/').map(Number);
  return { duration: +j.format.duration, width: v.width, height: v.height, fps: +(n / d).toFixed(2), codec: v.codec_name, pixFmt: v.pix_fmt, hasAudio: !!a, audioCodec: a?.codec_name || null, sizeMB: +(+j.format.size / 1e6).toFixed(2) };
}

/** Loudness (EBU R128) and silence share. */
export function audio(file) {
  const e = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr || '';
  const sum = e.slice(e.lastIndexOf('Summary:')), pick = re => { const m = re.exec(sum); return m ? +m[1] : null; };
  const lufs = pick(/I:\s+(-?[\d.]+) LUFS/), lra = pick(/LRA:\s+([\d.]+) LU/), peak = pick(/Peak:\s+(-?[\d.]+) dBFS/);
  const s = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'silencedetect=n=-45dB:d=0.4', '-f', 'null', '-']).stderr || '';
  const dur = +[...e.matchAll(/t:\s*([\d.]+)/g)].pop()?.[1] || null; let silent = 0; for (const m of s.matchAll(/silence_duration:\s*([\d.]+)/g)) silent += +m[1];
  return { lufs, lra, truePeak: peak, silentShare: dur ? +Math.min(1, silent / dur).toFixed(3) : null };
}

/** Motion / pacing via the skill's own `qc.mjs energy` (the anti-slideshow metric). */
export function energy(file) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pcv-bm-')), r = run(process.execPath, [path.join(SKILL_SCRIPTS, 'qc.mjs'), 'energy', path.resolve(file)], { cwd: tmp });
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  const out = (r.stdout || '') + (r.stderr || ''), m = /median ([\d.]+) · mean ([\d.]+) · quiet (\d+)% of the time · (\d+) hard cut/.exec(out);
  if (!m) return null;
  const longest = [...out.matchAll(/almost nothing changes for ≥ 1\.5 s at: ([^—]+)/g)].flatMap(x => [...x[1].matchAll(/([\d.]+)–([\d.]+)s/g)].map(y => +y[2] - +y[1])).reduce((a, b) => Math.max(a, b), 0);
  return { median: +m[1], mean: +m[2], quietPct: +m[3], cuts: +m[4], longestStatic: +longest.toFixed(1), curve: /energy\)?:\s*\n\s*([▁▂▃▄▅▆▇█]+)/.exec(out)?.[1] || (/\n  ([▁▂▃▄▅▆▇█]{6,})/.exec(out)?.[1] || null) };
}

/** Editing density: how many times the picture changes substantially (ffmpeg scene score > 0.25 on a 320 px proxy), per minute. */
export function scenes(file, dur) {
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-an', '-vf', "scale=320:-1,select='gt(scene,0.25)',metadata=print:file=-", '-f', 'null', '-']);
  if (r.status !== 0) return null; const n = (r.stdout.match(/lavfi\.scene_score/g) || []).length;
  return { changes: n, perMinute: +(n / (dur / 60)).toFixed(1) };
}

/** Everything about the file. */
export function measureVideo(file) {
  const p = probe(file); if (!p) return { ok: false, error: 'not a readable video' };
  return { ok: true, ...p, audio: p.hasAudio ? audio(file) : null, energy: energy(file), scenes: scenes(file, p.duration) };
}

/** Contact sheet (jpg) and an 8-second animated preview (webp). */
export function sheet(file, out, { cols = 6, rows = 3, tile = 320 } = {}) {
  const p = probe(file); if (!p) return false; const n = cols * rows;
  const r = run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-vf', `fps=${(n / p.duration).toFixed(4)},scale=${tile}:-1,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '4', out]); return r.status === 0;
}
export function preview(file, out, { w = 480, fps = 12, secs = 8 } = {}) {
  const p = probe(file); if (!p) return false; const t = Math.min(secs, p.duration);
  return run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '0', '-t', String(t), '-i', file, '-vf', `fps=${fps},scale=${w}:-1:flags=lanczos`, '-c:v', 'libwebp_anim', '-quality', '50', '-loop', '0', '-an', out]).status === 0;
}

/** What the agent session did, from Codex-style JSONL events (heuristics — the event vocabulary differs between agents). */
export function sessionStats(jsonlFile) {
  if (!fs.existsSync(jsonlFile)) return null;
  const lines = fs.readFileSync(jsonlFile, 'utf8').split('\n').filter(Boolean), types = {}; let inTok = 0, outTok = 0, cached = 0, turns = 0, images = 0, skill = false, atlas = false, inspire = false, lastText = '';
  for (const l of lines) {
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (e.type === 'turn.completed') { turns++; inTok += e.usage?.input_tokens || 0; outTok += e.usage?.output_tokens || 0; cached += e.usage?.cached_input_tokens || 0; }
    const it = e.item; if (it) { types[it.type] = (types[it.type] || 0) + 1; if (it.type === 'agent_message' && it.text) lastText = it.text; }
    if (/view_image|local_image|input_image|image_view/.test(l)) images++;
    if (/(?:cinewright|pure-code-video)[\\/]+(?:SKILL\.md|scripts|references|templates|agents)|\$cinewright|\$pure-code-video/.test(l)) skill = true; if (/atlas\.mjs/.test(l)) atlas = true; if (/inspire\.mjs/.test(l)) inspire = true;
  }
  return { events: lines.length, itemTypes: types, turns, inputTokens: inTok, outputTokens: outTok, cachedInputTokens: cached, imageViews: images, touchedSkill: skill, usedAtlas: atlas, usedInspire: inspire, finalMessage: lastText.slice(0, 600) };
}

/** Skill-process evidence left in the project folder (brief, review rounds, craft gate). */
export function projectStats(dir) {
  const find = (re, depth = 4, d = dir, acc = []) => { if (depth < 0 || !fs.existsSync(d)) return acc; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['node_modules', '.git', '.render', 'lib', 'fonts', '.agents'].includes(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) find(re, depth - 1, p, acc); else if (re.test(e.name)) acc.push(p); } return acc; };
  const briefs = find(/^brief\.md$/i), reviews = find(/^review-\d+\.md$/i), html = find(/^video\.html$/i)[0];
  let craft = null;
  if (html) { const cwd = path.dirname(html), r = run(process.execPath, [path.join(SKILL_SCRIPTS, 'qc.mjs'), 'craft'], { cwd }), out = (r.stdout || '') + (r.stderr || ''), m = /(\d+) failure\(s\), (\d+) warning\(s\)/.exec(out); if (m) craft = { failures: +m[1], warnings: +m[2] }; }
  return { briefWritten: briefs.length > 0, briefChars: briefs[0] ? fs.statSync(briefs[0]).size : 0, reviewRounds: reviews.length, hasVideoHtml: !!html, craft };
}
