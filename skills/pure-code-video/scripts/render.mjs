#!/usr/bin/env node
// render.mjs — deterministic HTML → MP4 renderer. Zero npm dependencies (Node >= 18, Chrome/Edge/Chromium, ffmpeg).
//
//   node tools/render.mjs                       full render → out/<page>.mp4  (segments, resumable, parallel Chrome workers)
//   node tools/render.mjs sheet [--count 24]    contact sheet → qc/sheet.png (labelled with times)   --times 1,4.5,9  --times 3:4:0.1 (a motion filmstrip)  --markers
//   node tools/render.mjs still 3.5,12          full-size PNGs → qc/still_3.500.png …
//   node tools/render.mjs verify                determinism check (same t → same pixels, any order, any worker)
//   node tools/render.mjs serve                 static server for live preview in your browser (page.html?play)
//   node tools/render.mjs info                  print the page's VIDEO spec + environment
//   node tools/render.mjs --detach              start a render in the background and return at once;  node tools/render.mjs status  shows progress
//   node tools/render.mjs stop                  end a background render cleanly (closes Chrome/ffmpeg, keeps finished segments — never kill them by hand)
//
// The page contract (see references/pipeline.md):
//   window.renderFrame(t)   draw the frame for time t (seconds) — a PURE function of t; may be async
//   window.ready            optional Promise (fonts/images/data loaded)
//   window.VIDEO            optional { width, height, fps, duration, audio, title, capture, canvas, markers:[{t,label}] }
//   ?render=1&w=&h=&fps=&dur=   query params the renderer passes so the page can re-compose for other aspect ratios
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Browser, findChrome, tmpBase } from './chrome.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtTime = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ───────────────────────────── memory ─────────────────────────────
// Every worker is a whole Chrome (browser + renderer + GPU process). With an integrated GPU the GPU process also lives in system RAM
// (2–3 GB each in practice), so "one worker per few cores" can exhaust a 32 GB machine — and once RAM is gone everything stalls.
const GB = 1024 ** 3;
const readText = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
/** RAM the OS could hand out right now, in GB (reclaimable cache counted; container limits respected). */
function availGB() {
  let a = os.freemem() / GB;
  try {
    if (process.platform === 'linux') {
      const m = /MemAvailable:\s+(\d+) kB/.exec(readText('/proc/meminfo') || ''); if (m) a = +m[1] * 1024 / GB;
      let lim = readText('/sys/fs/cgroup/memory.max'), use = readText('/sys/fs/cgroup/memory.current');
      if (lim === null) { lim = readText('/sys/fs/cgroup/memory/memory.limit_in_bytes'); use = readText('/sys/fs/cgroup/memory/memory.usage_in_bytes'); }
      if (lim && use && /^\d+$/.test(lim.trim()) && +lim < 2 ** 50) a = Math.min(a, (+lim - +use) / GB);
    } else if (process.platform === 'darwin') {   // os.freemem() is only never-touched pages there; inactive/purgeable pages are free for the taking
      const o = spawnSync('vm_stat', { encoding: 'utf8' }).stdout || '', pg = +/page size of (\d+)/.exec(o)?.[1] || 16384, n = k => +(new RegExp(`Pages ${k}:\\s+(\\d+)`).exec(o)?.[1] || 0);
      const pages = n('free') + n('inactive') + n('purgeable') + n('speculative'); if (pages) a = Math.max(a, pages * pg / GB);
    }
  } catch { /* keep os.freemem() */ }
  return Math.max(0, a);
}

// ───────────────────────────── CLI ─────────────────────────────
const FLAGS_WITH_VALUE = new Set(['page', 'out', 'w', 'h', 'fps', 'dur', 'workers', 'gpu', 'capture', 'transport', 'quality', 'crf', 'preset', 'maxrate', 'codec', 'encoder', 'audio',
  'motion-blur', 'shutter', 'segment', 'start', 'end', 'query', 'aspects', 'count', 'times', 'cols', 'tile', 'chrome', 'root', 'port', 'ready-timeout', 'frame-timeout', 'stall-timeout', 'min-free-gb', 'audio-script', 'rebuild-audio', 'scale', 'title', 'shot-format', 'label']);
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (s.startsWith('--')) {
      let [k, v] = s.slice(2).split(/=(.*)/s);
      if (FLAGS_WITH_VALUE.has(k) && v === undefined) v = argv[++i];
      a[k] = v === undefined ? true : v;
    } else a._.push(s);
  }
  return a;
}
const args = parseArgs(process.argv.slice(2));
const MODES = ['render', 'sheet', 'still', 'verify', 'serve', 'info'];
const mode = MODES.includes(args._[0]) ? args._.shift() : 'render';
const num = (v, d) => (v === undefined || v === true || v === '' || Number.isNaN(+v) ? d : +v);

if (args.help || args.h === true) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 14).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

const ROOT = path.resolve(args.root || process.cwd());

const STATE = path.join(ROOT, '.render'), STOP_FILE = path.join(STATE, 'stop');
const isAlive = pid => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

// status: how is a background render doing? (progress.json is written by the render itself; the log is its stdout)
if (args._[0] === 'status') {
  const read = f => readText(path.join(STATE, f)), prog = read('progress.json'), pid = +read('pid');
  console.log(prog ? prog : 'no progress file yet (has a render been started in this folder?)');
  console.log(pid ? `process ${pid}: ${isAlive(pid) ? 'running' : 'not running'}` : '');
  console.log(`free RAM now: ${availGB().toFixed(1)} GB of ${(os.totalmem() / GB).toFixed(0)} GB`);
  const lg = read('render.log'); if (lg) console.log('--- log tail ---\n' + lg.trim().split('\n').slice(-8).join('\n'));
  process.exit(0);
}
// stop: end a background render cleanly. A plain kill is NOT clean on Windows (no signal handlers run, Chrome is left behind), so ask the render to stop itself.
if (args._[0] === 'stop') {
  const pid = +readText(path.join(STATE, 'pid'));
  if (!isAlive(pid)) { console.log('no render is running in this folder.'); process.exit(0); }
  fs.mkdirSync(STATE, { recursive: true }); fs.writeFileSync(STOP_FILE, String(Date.now()));
  console.log(`stop requested (process ${pid}) — waiting for Chrome and ffmpeg to shut down …`);
  for (let i = 0; i < 60 && isAlive(pid); i++) await sleep(500);
  if (isAlive(pid)) { console.log('still running after 30 s — ending it forcibly.'); try { process.kill(pid); } catch { /* gone */ } }
  else console.log('stopped. Finished segments are kept: run the same render command again to resume.');
  process.exit(0);
}
tmpBase(path.join(STATE, 'tmp'));   // settle where scratch files go now (OS temp dir, or <project>/.render/tmp when a sandbox forbids it)
// detach: run the render in the background and return at once — for shells/agents whose commands time out (poll with: node tools/render.mjs status)
if (args.detach && !process.env.PCV_CHILD) {
  const st = path.join(ROOT, '.render'); fs.mkdirSync(st, { recursive: true });
  const fd = fs.openSync(path.join(st, 'render.log'), 'w');
  const child = spawn(process.execPath, process.argv.slice(1).filter(a => a !== '--detach'), { detached: true, stdio: ['ignore', fd, fd], windowsHide: true, env: { ...process.env, PCV_CHILD: '1' }, cwd: process.cwd() });
  child.unref(); fs.writeFileSync(path.join(st, 'pid'), String(child.pid));
  console.log(`render started in the background (pid ${child.pid}).\n  check:  node ${path.relative(process.cwd(), fileURLToPath(import.meta.url)) || 'render.mjs'} status${args.root ? ' --root ' + args.root : ''}\n  log:    ${path.join(st, 'render.log')}`);
  process.exit(0);
}
let workers = [], stopping = false; const ffprocs = new Set();      // declared before the first die() so an early failure can clean up
const log = (...m) => { if (!args.quiet) console.log(...m); };
const warn = (...m) => console.warn('warning:', ...m);
const die = msg => { console.error('\nerror: ' + msg); cleanupAndExit(1); };

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const ff = spawnSync(FFMPEG, ['-hide_banner', '-version'], { encoding: 'utf8' });
if (ff.error || ff.status !== 0) die('ffmpeg not found on PATH. Install it (Windows: winget install Gyan.FFmpeg · macOS: brew install ffmpeg · Linux: apt install ffmpeg) or set FFMPEG=<path>.');
const FFMPEG_VER = /ffmpeg version (\S+)/.exec(ff.stdout)?.[1] || '?';

// ───────────────────────────── page discovery ─────────────────────────────
function findPage() {
  if (args.page) return path.resolve(ROOT, args.page);
  for (const n of ['video.html', 'index.html', 'film.html', 'main.html', 'reel.html', 'demo.html']) if (fs.existsSync(path.join(ROOT, n))) return path.join(ROOT, n);
  const any = fs.readdirSync(ROOT).find(f => f.endsWith('.html'));
  return any ? path.join(ROOT, any) : null;
}
const PAGE = findPage();
if (!PAGE || !fs.existsSync(PAGE)) die(`no HTML page found in ${ROOT}. Pass --page video.html (or --root <project dir>).`);
const PAGE_REL = path.relative(ROOT, PAGE).split(path.sep).join('/');
const PAGE_NAME = path.basename(PAGE, path.extname(PAGE));

// ───────────────────────────── static + upload server ─────────────────────────────
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8', '.glsl': 'text/plain', '.bin': 'application/octet-stream' };
const waiters = new Map();
const server = http.createServer((q, r) => {
  const url = new URL(q.url, 'http://x');
  if (q.method === 'POST' && url.pathname.startsWith('/__pcv/f/')) {
    const parts = []; q.on('data', c => parts.push(c));
    q.on('end', () => { waiters.get(url.pathname.slice(9))?.(Buffer.concat(parts)); r.writeHead(204); r.end(); });
    return;
  }
  if (url.pathname === '/favicon.ico') { r.writeHead(204); return r.end(); }
  const rel = decodeURIComponent(url.pathname);
  const f = path.normalize(path.join(ROOT, rel));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('not found'); }
  const size = fs.statSync(f).size, range = /bytes=(\d*)-(\d*)/.exec(q.headers.range || '');
  const type = MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
  if (range) { // audio scrubbing in serve mode needs range support
    const s = range[1] ? +range[1] : 0, e = range[2] ? +range[2] : size - 1;
    r.writeHead(206, { 'content-type': type, 'content-range': `bytes ${s}-${e}/${size}`, 'accept-ranges': 'bytes', 'content-length': e - s + 1, 'cache-control': 'no-store' });
    fs.createReadStream(f, { start: s, end: e }).pipe(r);
  } else {
    r.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(r);
  }
});
await new Promise((res, rej) => { server.once('error', rej); server.listen(num(args.port, 0), '127.0.0.1', res); });
const PORT = server.address().port;

if (mode === 'serve') {
  const q = args.query ? '&' + args.query : '';
  console.log(`\nPreview server on ${ROOT}\n  live + audio : http://127.0.0.1:${PORT}/${PAGE_REL}?play${q}\n  a still frame: http://127.0.0.1:${PORT}/${PAGE_REL}?t=3.5${q}\n  (Ctrl+C to stop)`);
  await new Promise(() => {});
}

// ───────────────────────────── injected page helper (pcv-page.js) ─────────────────────────────
const HELPER = fs.readFileSync(path.join(HERE, 'pcv-page.js'), 'utf8');

// ───────────────────────────── worker (one Chrome process) ─────────────────────────────
const cores = os.cpus().length, totalGB = os.totalmem() / GB;
const cfg = {
  gpu: args.gpu || process.env.PCV_GPU || 'auto',
  workers: Math.max(1, Math.min(16, num(args.workers, Math.max(1, Math.min(8, Math.floor(cores / 3)))))),   // an upper bound: planWorkers() lowers it to what fits in RAM
  workersFixed: args.workers !== undefined && args.workers !== true,
  readyTimeout: num(args['ready-timeout'], 90) * 1000,
  frameTimeout: num(args['frame-timeout'], 90) * 1000,       // one frame slower than this (×40 the running average) = the renderer is hung
  stallTimeout: num(args['stall-timeout'], 180) * 1000,      // nothing finished anywhere for this long = give up; finished segments are kept
  minFreeGB: num(args['min-free-gb'], Math.max(1, totalGB * 0.05)),   // free RAM below this for a few seconds = shed a worker
};
/** A first guess at how many workers fit in RAM, before anything is measured. `n` is what the caller wants (CPU-based default, --workers, or the number of frames to shoot). */
function planWorkers(n, spec, min = 1) {
  const soft = cfg.gpu === 'off' || /swiftshader|llvmpipe|software/i.test(spec.info?.webgl || ''), mpx = spec.W * spec.H / 1e6;
  const per = (soft ? 1.0 : 0.6) + 0.1 * mpx;               // GB per worker for an ordinary page (browser + renderer + GPU process ≈ 0.6 GB at 1080p); probeFootprint() measures the real figure
  const fit = Math.max(1, Math.floor(Math.max(0, availGB() - 3) * 0.7 / per));
  return Math.max(min, Math.min(n, cfg.workersFixed ? n : fit));
}
/** Worker 0 shoots a spread of frames (every scene start + an even grid) while free RAM is watched: what one worker really costs on THIS page.
 *  A page that puts thousands of small blend-mode draws on a GPU canvas can grab gigabytes on its first frame of a scene — seen in practice at 3.7 GB per worker. */
async function probeFootprint(w, spec, ram0, frameOpts) {
  const last = spec.dur - 1 / spec.fps, marks = (spec.V?.markers || []).map(m => m.t + 0.05), grid = Array.from({ length: 10 }, (_, i) => (i + 0.5) / 10 * spec.dur);
  const ts = [...new Set([...grid, ...marks, last].map(t => +Math.min(Math.max(0, t), last).toFixed(3)))].sort((a, b) => a - b).slice(0, 24);
  let low = availGB(); const t0 = Date.now();
  for (const [i, t] of ts.entries()) { await w.safeFrame(t, frameOpts(i === 0)); low = Math.min(low, availGB()); }
  return { perWorker: Math.max(0.6, ram0 - low), frames: ts.length, seconds: (Date.now() - t0) / 1000 };
}
/** How many workers the measured footprint allows: what is free now (worker 0 is fully warmed up) shared out, leaving the machine a reserve. */
function fitWorkers(n, foot, min = 1) {
  const reserve = Math.max(2.5, totalGB * 0.1), free = availGB();
  const fit = Math.max(min, Math.min(n, 1 + Math.floor(Math.max(0, free - reserve) * 0.8 / foot.perWorker)));
  log(`  probe: ${foot.frames} frames in ${foot.seconds.toFixed(1)} s · one worker ≈ ${foot.perWorker.toFixed(1)} GB · ${free.toFixed(1)} GB free → ${fit} worker${fit > 1 ? 's' : ''}${fit < n ? ` (RAM-limited; ${n} were possible)` : ''}`);
  if (foot.perWorker > 2.5) warn(`a single worker needs ≈${foot.perWorker.toFixed(1)} GB on this page — usually many small draws with blend modes (multiply/screen/…) or a huge canvas on a GPU canvas. Paint such layers once on a software canvas (K.bake / K.canvas(w, h, { cpu: true })).`);
  if (cfg.workersFixed) { if (n > fit) warn(`--workers ${n} asked for, but free RAM allows about ${fit} — the machine may stall.`); return n; }
  return fit;
}
const activeWorkers = () => workers.filter(w => !w.retired && !w.closed);
const withTimeout = (p, ms, msg) => { let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(msg)), ms); })]).finally(() => clearTimeout(t)); };
/** After Chrome quits its GPU memory comes back a moment later: wait for it, so the next launch is planned from real numbers. */
async function settleMemory(ms = 6000) { let last = availGB(); for (const t0 = Date.now(); Date.now() - t0 < ms;) { await sleep(500); const a = availGB(); if (a - last < 0.05) break; last = a; } }
let frameSeq = 0;
const pageLogs = new Set();
const onLog = (level, text) => {
  if (level === 'log' && !args.verbose) return;
  const line = `[page ${level}] ${text}`.slice(0, 600);
  if (pageLogs.has(line)) return; pageLogs.add(line); if (pageLogs.size < 200) console.log(line);
};

function pageUrl(extra = {}) {
  const p = new URLSearchParams({ render: '1', ...extra });
  if (args.query) for (const [k, v] of new URLSearchParams(args.query)) p.set(k, v);
  return `http://127.0.0.1:${PORT}/${PAGE_REL}?${p}`;
}

class Worker {
  constructor(id, want, probe = false) { this.id = id; this.want = want; this.probe = probe; this.gpu = cfg.gpu; this.restarts = 0; this.retired = false; this.closed = false; this.ema = 0; }
  frameTimeout() { return Math.min(900000, Math.max(cfg.frameTimeout, this.ema * 40)); }
  /** Boot Chrome + the page. If the GPU path is unstable (GPU process dying, no WebGL at all), switch this run to software rendering instead of failing with a confusing page error. */
  async start() {
    await this.#boot();
    if (this.gpu !== 'off' && (this.browser.gpuDeaths > 0 || !this.info.webgl)) {
      warn(`worker ${this.id}: the GPU is unstable here (${this.browser.gpuDeaths ? 'the GPU process keeps dying' : 'no WebGL'}) — switching to software rendering for this run (slower, same picture). Force it from the start with --gpu off.`);
      cfg.gpu = this.gpu = 'off';
      await this.browser.close(3000).catch(() => {});
      await this.#boot();
    }
    return this;
  }
  async #boot() {
    const { W, H } = this.want;
    this.browser = await Browser.launch({ chrome: args.chrome, gpu: this.gpu, width: W, height: H });
    this.page = await this.browser.newPage({ width: W, height: H, onLog });
    const q = this.probe ? {} : { w: W, h: H, fps: this.want.fps, dur: this.want.dur };
    if (this.probe) for (const k of ['w', 'h', 'fps', 'dur']) if (args[k] !== undefined && args[k] !== true) q[k] = args[k];
    await this.page.goto(pageUrl(q));
    const t0 = Date.now(); let lastErr = '';
    for (;;) {
      try {
        const st = await this.page.eval(`(async () => {
          if (typeof window.renderFrame !== 'function') return 'wait';
          const r = window.ready; if (r && typeof r.then === 'function') await r;
          if (document.fonts) await document.fonts.ready;
          return 'ok'; })()`, { timeout: cfg.readyTimeout });
        if (st === 'ok') break;
      } catch (e) { lastErr = e.message; if (/renderer crashed|Chrome exited/.test(lastErr)) throw e; if (!/timed out/.test(lastErr) && !/Cannot find context|Execution context/.test(lastErr)) throw new Error('page failed to initialise: ' + lastErr); }
      if (Date.now() - t0 > cfg.readyTimeout) throw new Error(`page never became ready (${lastErr || 'renderFrame is not defined'}). Does it define window.renderFrame(t) and resolve window.ready?`);
      await sleep(60);
    }
    await this.page.eval(HELPER);
    this.info = await this.page.eval('__PCV.inspect()');
    return this;
  }
  /** Decide capture mode and lock the frame size. gpuCapture: pack frames to YUV420 on the GPU (fast path) when WebGL2 works. */
  async prepare(capture, gpuCapture = true) {
    this.capture = capture; this.gpuCapture = gpuCapture; this.mode = 'rgba';
    if (capture === 'canvas') { const r = await this.page.eval(`__PCV.prep(${gpuCapture})`); [this.W, this.H] = r; this.mode = r[2]; this.gpuError = r[3]; }
    else { this.W = this.want.W; this.H = this.want.H; }
    return this;
  }
  async frame(t, o = {}) { // → Buffer (raw RGBA, PNG or JPEG depending on mode)
    const id = String(++frameSeq), p = new Promise(res => waiters.set(id, res)), t0 = Date.now(), tmo = this.frameTimeout(), gd0 = this.browser.gpuDeaths;
    try {
      let buf;
      if (this.capture === 'canvas') {
        const st = await this.page.eval(`__PCV.frame(${t}, ${JSON.stringify(id)}, ${JSON.stringify(o)})`, { timeout: tmo });
        if (st && typeof st === 'object') { const S = this.stats || (this.stats = { n: 0, render: 0, read: 0, upload: 0 }); S.n++; S.render += st.render; S.read += st.read; S.upload += st.upload; }
        buf = await withTimeout(p, tmo, `frame upload timed out after ${tmo} ms (renderer hung or crashed?)`);   // never wait forever for a POST that may not come
      } else {
        waiters.delete(id);
        await this.page.eval(`__PCV.tick(${t})`, { timeout: tmo });
        const fmt = args['shot-format'] === 'jpeg' ? 'jpeg' : 'png';
        const r = await this.page.send('Page.captureScreenshot', { format: fmt, quality: 95, optimizeForSpeed: true, captureBeyondViewport: false, clip: { x: 0, y: 0, width: this.W, height: this.H, scale: 1 } }, Math.min(tmo, 60000));
        buf = Buffer.from(r.data, 'base64');
      }
      if (this.gpu !== 'off' && this.browser.gpuDeaths > gd0) throw new Error('GPU process crashed while rendering this frame (its pixels cannot be trusted)');
      const ms = Date.now() - t0; this.ema = this.ema ? this.ema * 0.8 + ms * 0.2 : ms;
      return buf;
    } finally { waiters.delete(id); }
  }
  /** Render with retries; a crashed or hung renderer is replaced by a software-rendered one — unless RAM is short, then the worker is shed instead. */
  async safeFrame(t, o) {
    for (let attempt = 0; ; attempt++) {
      try { return await this.frame(t, o); }
      catch (e) {
        if (stopping || this.closed) throw new Error('render stopped');                 // Chrome is being shut down on purpose: no restarts
        const crashed = this.page.crashed || this.browser.dead || /crashed|Chrome exited|timed out|not running/.test(e.message);
        if (attempt >= 2) throw new Error(`frame t=${t.toFixed(4)} failed: ${e.message}`);
        if (crashed) {
          if (activeWorkers().some(w => w !== this) && availGB() < cfg.minFreeGB * 1.5) {
            warn(`worker ${this.id}: ${e.message} — RAM is short (${availGB().toFixed(1)} GB free), retiring this worker instead of restarting it`);
            const r = new Error('worker retired (low memory)'); r.retire = true; throw r;
          }
          warn(`worker ${this.id}: ${e.message} — restarting Chrome in software-rendering mode`);
          this.gpu = 'off'; this.restarts++; this.ema = 0;
          try { await this.browser.close(); } catch { /* dead */ }
          await this.start(); await this.prepare(this.capture, this.gpuCapture);
        } else await sleep(100);
      }
    }
  }
  async close() { if (this.closed) return; this.closed = true; try { await this.browser?.close(); } catch { /* ignore */ } }
}

// ───────────────────────────── spec resolution ─────────────────────────────
function parseFps(v) { if (typeof v === 'string' && v.includes('/')) { const [n, d] = v.split('/').map(Number); return [n, d]; } const f = +v; if (Math.abs(f - 29.97) < 0.01) return [30000, 1001]; if (Math.abs(f - 23.976) < 0.01) return [24000, 1001]; if (Math.abs(f - 59.94) < 0.01) return [60000, 1001]; return [f, 1]; }
const even = n => Math.max(2, Math.round(n / 2) * 2);
function aspectSize(name, short) {
  const [a, b] = name.split(':').map(Number); if (!a || !b) die(`bad aspect "${name}" (use 16:9, 9:16, 1:1, 4:5)`);
  return a >= b ? [even(short * a / b), even(short)] : [even(short), even(short * b / a)];
}

/** Quit every Chrome through its DevTools pipe (10 s each, in parallel) — a hard kill while the GPU process is busy is what leaves stuck processes behind. */
async function cleanupAndExit(code = 0) {
  if (stopping) return; stopping = true;
  for (const p of ffprocs) try { p.kill(); } catch { /* gone */ }
  if (workers.some(w => !w.closed)) log('  closing Chrome …');
  await Promise.race([Promise.all(workers.map(w => w.close())), sleep(15000)]);
  try { server.close(); } catch { /* ignore */ }
  process.exit(code);
}
process.on('SIGINT', () => { console.error('\ninterrupted — partial segments are kept, run again to resume'); cleanupAndExit(130); });
process.on('SIGTERM', () => cleanupAndExit(143));
process.on('uncaughtException', e => { console.error(e); cleanupAndExit(1); });
process.on('unhandledRejection', e => { console.error(e); cleanupAndExit(1); });

/** Start `count` more Chrome workers. They join `workers` before they are up, so a failed start can still be cleaned up. */
async function addWorkers(count, want) {
  const base = workers.length, fresh = Array.from({ length: count }, (_, i) => new Worker(base + i, want));
  workers.push(...fresh);
  await Promise.all(fresh.map(w => w.start().catch(e => { throw new Error(`worker ${w.id}: ${e.message}`); })));
  return fresh;
}

/** Read the page's own spec, merge CLI overrides. Uses a throw-away first worker to look at the page. */
async function resolveSpec() {
  const probe = new Worker(-1, { W: 1920, H: 1080 }, true); workers.push(probe);   // tracked, so a failing page cannot leave this Chrome behind
  await probe.start();
  const info = probe.info; await probe.close(); workers.splice(workers.indexOf(probe), 1);
  const V = info.video || {};
  let W = num(args.w, V.width || info.canvas?.w || 1920), H = num(args.h, V.height || info.canvas?.h || 1080);
  if (args.vertical) [W, H] = aspectSize('9:16', Math.min(W, H));
  if (args.scale) { W = even(W * +args.scale); H = even(H * +args.scale); }
  const fpsRaw = args.fps || V.fps || 30, [fn, fd] = parseFps(fpsRaw);
  const fps = fn / fd, dur = num(args.dur, V.duration || V.dur);
  if (!dur) die('the page must declare window.VIDEO = { duration: <seconds>, … } (or pass --dur).');
  const forced = args.capture && args.capture !== 'auto' ? args.capture : (V.capture && V.capture !== 'auto' ? V.capture : null);
  return { W, H, fps, fn, fd, dur, capture: forced, info, V, audio: args.audio || V.audio || null, title: args.title || V.title || null };
}

/** Launch workers at the final size, decide canvas-vs-screenshot capture from what the page really renders, lock the frame size. */
async function setupWorkers(spec, n, { forceRgba = false, min = 1, blurK = 1 } = {}) {
  const want = { W: spec.W, H: spec.H, fps: spec.fps, dur: spec.dur }, t0 = Date.now(), ram0 = availGB();
  n = planWorkers(n, spec, min);
  await addWorkers(1, want);                                   // worker 0 first: it decides capture mode and, for bigger pools, measures the memory cost
  const w0 = workers[0], info = w0.info, c = info.canvas;
  if (info.fontErrors?.length) die(`font(s) failed to load: ${[...new Set(info.fontErrors)].join(', ')} — refusing to render with fallback fonts. Fix the @font-face URLs (fonts must be local files).`);
  if (info.webgl && /swiftshader|llvmpipe|software/i.test(info.webgl) && cfg.gpu !== 'off') log('  note: WebGL runs on the CPU (SwiftShader) — heavy shaders will be slow; a GPU-enabled Chrome is much faster.');
  if (!spec.capture) {
    const fits = c && ((Math.abs(c.w - spec.W) <= 2 && Math.abs(c.h - spec.H) <= 2) || info.canvasCoversViewport);
    spec.capture = fits ? 'canvas' : 'screenshot';
    if (!fits) log(c ? `  note: the page's canvas is ${c.w}×${c.h}, not ${spec.W}×${spec.H} — falling back to screenshot capture (slower). Size the canvas from ?w=&h= to use the fast path.`
                      : '  note: no <canvas> found — using DOM screenshot capture (slower than canvas capture).');
  }
  const wantYuv = spec.capture === 'canvas' && args.transport !== 'raw' && args.transport !== 'png' && !forceRgba;
  await w0.prepare(spec.capture, wantYuv);
  if (wantYuv && w0.mode !== 'yuv') log(`  note: GPU frame packing unavailable (${w0.gpuError || 'no WebGL2'}) — using the RGBA capture path (slower).`);
  if (spec.capture === 'canvas' && (w0.W !== spec.W || w0.H !== spec.H)) {
    warn(`page canvas is ${w0.W}×${w0.H} but ${spec.W}×${spec.H} was requested — the page must size its canvas from ?w=&h= (or VIDEO). Using the canvas size.`);
    spec.W = want.W = w0.W; spec.H = want.H = w0.H;
  }
  if (spec.W % 2 || spec.H % 2) warn(`odd frame size ${spec.W}×${spec.H}: yuv420p needs even dimensions — pick even w/h.`);
  if (n > 2) {
    const fmt = spec.capture === 'canvas' ? (args.transport === 'png' ? 'png' : w0.mode === 'yuv' && !forceRgba ? 'yuv' : 'raw') : 'png';
    const foot = await probeFootprint(w0, spec, ram0, first => ({ K: first && spec.capture === 'canvas' ? blurK : 1, shutter: num(args.shutter, 0.5), dt: 1 / spec.fps, dur: spec.dur, fmt }));
    n = fitWorkers(n, foot, min);
  }
  if (n > 1) { await addWorkers(n - 1, want); await Promise.all(workers.slice(1).map(w => w.prepare(spec.capture, wantYuv))); }
  log(`  ${n} Chrome worker${n > 1 ? 's' : ''} ready in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${w0.browser.version} · WebGL: ${info.webgl || 'n/a'} · free RAM ${availGB().toFixed(1)} GB`);
  return spec;
}

// ───────────────────────────── ffmpeg ─────────────────────────────
function encoderArgs(spec, o) {
  const q = { draft: ['ultrafast', 28], web: ['medium', 22], standard: ['veryfast', 20], high: ['medium', 17], max: ['slow', 15] }[args.quality || 'high'] || ['medium', 17];   // x264 'slow' is ~2× slower than 'medium' for a near-identical file
  const codec = args.codec || 'h264', preset = args.preset || q[0], crf = num(args.crf, q[1]);
  const px = spec.W * spec.H * spec.fps;
  const maxrate = args.maxrate === 'off' ? null : args.maxrate && args.maxrate !== 'auto' ? args.maxrate : `${Math.max(2, Math.round(px * (args.quality === 'web' ? 0.075 : 0.2) / 1e6))}M`;   // bits per pixel cap: grain makes CRF alone explode
  const color = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv'];
  const yuvIn = o.transport === 'yuv', vf = yuvIn ? 'format=yuv420p' : 'scale=out_color_matrix=bt709:out_range=tv:flags=bicubic,format=yuv420p';
  let wantNvenc = args.encoder === 'nvenc';
  if (wantNvenc) {
    const t = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=black:s=256x256:d=0.1', '-frames:v', '1', '-c:v', 'h264_nvenc', '-f', 'null', '-'], { encoding: 'utf8' });
    if (t.status !== 0) { warn(`NVENC is not usable here (${(t.stderr || '').trim().split(/\r?\n/)[0] || 'encoder failed'}) — using libx264 instead.`); wantNvenc = false; }
  }
  if (codec === 'prores') return { ext: '.mov', v: ['-vf', (yuvIn ? '' : 'scale=out_color_matrix=bt709:out_range=tv,') + 'format=yuv422p10le', '-c:v', 'prores_ks', '-profile:v', '3', '-vendor', 'apl0', ...color], a: ['-c:a', 'pcm_s16le'] };
  if (codec === 'vp9' || codec === 'webm') return { ext: '.webm', v: ['-vf', vf, '-c:v', 'libvpx-vp9', '-crf', String(crf + 8), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', ...color], a: ['-c:a', 'libopus', '-b:a', '192k'] };
  if (codec === 'gif') return { ext: '.gif', v: ['-vf', `fps=${Math.min(24, spec.fps)},scale=${Math.min(spec.W, 960)}:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0'], a: [], noAudio: true };
  if (codec === 'h265' || codec === 'hevc') return { ext: '.mp4', v: ['-vf', vf, '-c:v', 'libx265', '-preset', preset, '-crf', String(crf + 3), '-tag:v', 'hvc1', '-pix_fmt', 'yuv420p', ...(maxrate ? ['-x265-params', `vbv-maxrate=${parseInt(maxrate) * 1000}:vbv-bufsize=${parseInt(maxrate) * 2000}`] : []), ...color], a: ['-c:a', 'aac', '-b:a', '256k'] };
  if (wantNvenc) return { ext: '.mp4', v: ['-vf', vf, '-c:v', 'h264_nvenc', '-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', String(crf + 2), '-b:v', '0', ...(maxrate ? ['-maxrate', maxrate, '-bufsize', `${parseInt(maxrate) * 2}M`] : []), '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...color], a: ['-c:a', 'aac', '-b:a', '256k'] };
  return { ext: '.mp4', v: ['-vf', vf, '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), ...(maxrate ? ['-maxrate', maxrate, '-bufsize', `${parseInt(maxrate) * 2}M`] : []), '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...color], a: ['-c:a', 'aac', '-b:a', '256k'] };
}
function inputArgs(spec, transport) {
  const fr = `${spec.fn}/${spec.fd}`;
  return transport === 'yuv' ? ['-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', `${spec.W}x${spec.H}`, '-framerate', fr, '-color_range', 'tv', '-colorspace', 'bt709', '-i', 'pipe:0']
    : transport === 'raw' ? ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${spec.W}x${spec.H}`, '-framerate', fr, '-i', 'pipe:0']
    : ['-f', 'image2pipe', '-framerate', fr, '-c:v', transport === 'jpeg' ? 'mjpeg' : 'png', '-i', 'pipe:0'];
}
function runFfmpeg(argv, { stdin = false, label = 'ffmpeg' } = {}) {
  const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: [stdin ? 'pipe' : 'ignore', 'ignore', 'pipe'], windowsHide: true });
  ffprocs.add(p); let err = ''; p.stderr.on('data', d => { err = (err + d).slice(-2000); });
  p.stdin?.on('error', () => {});
  p.done = new Promise((res, rej) => p.on('close', c => { ffprocs.delete(p); p.finished = true; if (c) { p.failure = new Error(`${label} exited with ${c}: ${err.trim()}`); rej(p.failure); } else res(); }));
  p.done.catch(() => {});
  return p;
}
/** Feed one buffer to ffmpeg's stdin. If ffmpeg died (bad encoder flags, disk full …) fail fast instead of waiting on 'drain' forever. */
const write = async (p, buf) => {
  if (p.failure) throw p.failure;
  if (!p.stdin.write(buf)) await Promise.race([new Promise(r => p.stdin.once('drain', r)), p.done]);
  if (p.failure) throw p.failure;
};

// ───────────────────────────── in-order parallel frame pipeline ─────────────────────────────
/** Render `items` (array of {t, o}) with all workers; deliver Buffers to sink(i, buf) strictly in order.
 *  While it works it watches the machine: free RAM below the floor for 3 s sheds a worker (Chrome quits, its frames go to the others);
 *  no frame finished anywhere for --stall-timeout seconds aborts with a clear message (finished segments are kept, so a re-run resumes). */
async function renderList(items, sink, onProgress) {
  let next = 0, out = 0, inflight = 0, chain = Promise.resolve(), lastProgress = Date.now(), lowSince = 0, calmUntil = 0;
  const ready = new Map(), retry = [], window_ = () => activeWorkers().length * 2 + 4;
  const flush = () => (chain = chain.then(async () => { while (ready.has(out)) { const b = ready.get(out); ready.delete(out); await sink(out, b); out++; onProgress?.(out); } }));
  let fail; const failed = new Promise((_, rej) => { fail = rej; }); failed.catch(() => {});
  const watch = setInterval(() => {
    const now = Date.now(), free = availGB(), act = activeWorkers();
    if (free < cfg.minFreeGB) lowSince ||= now; else lowSince = 0;
    if (lowSince && now - lowSince > 3000 && act.length > 1 && now > calmUntil) {
      act[act.length - 1].retired = true; calmUntil = now + 8000;
      warn(`only ${free.toFixed(1)} GB of RAM is free — dropping to ${act.length - 1} worker${act.length > 2 ? 's' : ''} to keep the machine responsive`);
    }
    if (now - lastProgress > cfg.stallTimeout) fail(new Error(`no frame finished for ${Math.round((now - lastProgress) / 1000)} s (free RAM ${free.toFixed(1)} GB, ${act.length} worker${act.length > 1 ? 's' : ''}). `
      + 'The usual cause is memory or GPU exhaustion. Finished segments are kept — re-run with fewer workers (--workers 1 or 2) or software rendering (--gpu off).'));
  }, 1000);
  const loops = activeWorkers().map(async w => {
    try {
      for (;;) {
        let i = -1;
        while (!w.retired && !w.closed) {
          if (retry.length || next - out < window_()) { i = retry.length ? retry.shift() : next < items.length ? next++ : -1; if (i >= 0) break; }
          if (next >= items.length && !retry.length && !inflight) break;        // everything is claimed and delivered
          await sleep(5);
        }
        if (i < 0) break;
        inflight++;
        try { ready.set(i, await w.safeFrame(items[i].t, items[i].o)); }
        catch (e) { if (e.retire) { retry.push(i); w.retired = true; break; } throw e; }
        finally { inflight--; }
        lastProgress = Date.now(); await flush();
      }
    } finally { if (w.retired) await w.close(); }
  });
  try { await Promise.race([Promise.all(loops), failed]); await chain; }
  finally { clearInterval(watch); }
}

// ───────────────────────────── modes ─────────────────────────────
function projectFingerprint(spec) {
  const h = crypto.createHash('sha1'); h.update(JSON.stringify({ W: spec.W, H: spec.H, fps: spec.fps, dur: spec.dur, q: [args.quality, args.crf, args.preset, args.codec, args.encoder, args.maxrate, args['motion-blur'], args.shutter, args.query, args.capture, args.transport] }));
  const skip = new Set(['.render', 'out', 'qc', 'node_modules', '.git']), bigExt = new Set(['.mp4', '.mov', '.webm', '.wav', '.mp3', '.m4a', '.log', '.mkv']);
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isDirectory()) { if (!skip.has(e.name)) walk(path.join(d, e.name)); continue; }
    if (bigExt.has(path.extname(e.name).toLowerCase())) continue;
    const s = fs.statSync(path.join(d, e.name)); h.update(`${path.relative(ROOT, path.join(d, e.name))}|${s.size}|${Math.round(s.mtimeMs)}`);
  } };
  walk(ROOT); return h.digest('hex').slice(0, 16);
}
function maybeBuildAudio() {
  const script = path.resolve(ROOT, args['audio-script'] || 'audio.mjs');
  if (args['rebuild-audio'] === 'never' || args['no-audio'] || !fs.existsSync(script)) return;
  const wav = path.resolve(ROOT, args.audio || 'audio.wav');
  const deps = [script, PAGE, path.join(ROOT, 'lib/synth.mjs')].filter(fs.existsSync);
  const stale = !fs.existsSync(wav) || deps.some(d => fs.statSync(d).mtimeMs > fs.statSync(wav).mtimeMs);
  if (args['rebuild-audio'] === 'always' || stale) {
    log(`  audio: running ${path.basename(script)} …`);
    const r = spawnSync(process.execPath, [script], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) die('audio script failed (see output above).');
  }
}

async function doRender() {
  maybeBuildAudio();
  const spec = await resolveSpec();
  const aspects = args.aspects ? String(args.aspects).split(',') : [null];
  const baseShort = Math.min(spec.W, spec.H);
  for (const asp of aspects) {
    const s = { ...spec };
    if (asp) [s.W, s.H] = aspectSize(asp, baseShort);
    await renderOne(s, asp);
  }
}

async function renderOne(spec, aspect) {
  const N = Math.round(spec.dur * spec.fps), f0 = Math.max(0, Math.round(num(args.start, 0) * spec.fps)), f1 = Math.min(N, args.end ? Math.round(num(args.end, spec.dur) * spec.fps) : N);
  const partial = f0 > 0 || f1 < N;
  const outDir = path.join(ROOT, 'out'); fs.mkdirSync(outDir, { recursive: true });
  const suffix = aspect ? '_' + aspect.replace(':', 'x') : (args.vertical ? '_vertical' : '');
  const ext = encoderArgs(spec, { transport: 'raw' }).ext, noAudioCodec = encoderArgs(spec, { transport: 'raw' }).noAudio;
  const outFile = path.resolve(ROOT, args.out && !aspect ? args.out : path.join('out', `${PAGE_NAME}${suffix}${partial ? '_partial' : ''}${ext}`));
  const audioPath = noAudioCodec || args['no-audio'] ? null : (spec.audio ? path.resolve(ROOT, spec.audio) : (fs.existsSync(path.join(ROOT, 'audio.wav')) ? path.join(ROOT, 'audio.wav') : null));
  if (audioPath && !fs.existsSync(audioPath)) die(`audio file not found: ${audioPath}`);
  const K = Math.max(1, Math.round(num(args['motion-blur'], 1))), shutter = num(args.shutter, 0.5);
  log(`\n▶ ${path.basename(outFile)}  ${spec.W}×${spec.H} @ ${+spec.fps.toFixed(3)} fps · ${spec.dur}s · ${N} frames${partial ? ` (frames ${f0}–${f1})` : ''}${K > 1 ? ` · motion blur ×${K}` : ''}${audioPath ? ' · audio ' + path.basename(audioPath) : ' · no audio'}`);
  await setupWorkers(spec, cfg.workers, { blurK: K });
  log(`  capture: ${spec.capture}`);
  const transport = spec.capture === 'canvas' ? (args.transport === 'png' ? 'png' : workers[0].mode === 'yuv' ? 'yuv' : 'raw') : (args['shot-format'] === 'jpeg' ? 'jpeg' : 'png');
  const enc = encoderArgs(spec, { transport });
  const subK = spec.capture === 'screenshot' && K > 1 ? K : 1;
  const frameOpts = () => ({ K: subK > 1 ? 1 : K, shutter, dt: 1 / spec.fps, dur: spec.dur, fmt: transport === 'png' ? 'png' : transport === 'yuv' ? 'yuv' : 'raw' });

  const state = path.join(ROOT, '.render'); fs.mkdirSync(state, { recursive: true });
  const fpKey = projectFingerprint(spec) + (aspect || '') + `${f0}-${f1}`;
  // segments are big and short-lived: keep them in the OS temp dir (project folders are often synced by OneDrive/Dropbox, which would upload every segment)
  const segDir = path.join(tmpBase(path.join(STATE, 'tmp')), 'pcv-render', crypto.createHash('sha1').update(ROOT).digest('hex').slice(0, 10), `seg_${PAGE_NAME}${suffix}`);
  fs.mkdirSync(path.dirname(segDir), { recursive: true });
  const keyFile = path.join(segDir, 'key.txt');
  if (args.fresh || !fs.existsSync(keyFile) || fs.readFileSync(keyFile, 'utf8') !== fpKey) { fs.rmSync(segDir, { recursive: true, force: true }); fs.mkdirSync(segDir, { recursive: true }); fs.writeFileSync(keyFile, fpKey); }
  else log('  resuming: project unchanged since the last (interrupted) run — finished segments are reused');

  const segFrames = args.segment === '0' ? (f1 - f0) : Math.max(1, Math.round(num(args.segment, 6) * spec.fps));
  const segs = []; for (let s = f0; s < f1; s += segFrames) segs.push([s, Math.min(f1, s + segFrames)]);
  const t0 = Date.now(); let doneFrames = 0, resumed = 0; const total = f1 - f0; let lastPrint = 0;
  const progressFile = path.join(state, 'progress.json'); fs.writeFileSync(path.join(state, 'pid'), String(process.pid));
  const report = (force, status = 'rendering') => {
    const el = (Date.now() - t0) / 1000, fps_ = (doneFrames - resumed) / Math.max(el, 0.001), eta = fps_ > 0 ? (total - doneFrames) / fps_ : 0;
    if (force || Date.now() - lastPrint > 4000) {
      lastPrint = Date.now();
      const free = availGB(), nw = activeWorkers().length;
      log(`  frame ${doneFrames}/${total} (${Math.round(100 * doneFrames / total)}%) · ${fps_.toFixed(1)} fps · elapsed ${fmtTime(el)} · eta ${fmtTime(eta)} · ${nw} worker${nw === 1 ? '' : 's'} · free RAM ${free.toFixed(1)} GB`);
      fs.writeFileSync(progressFile, JSON.stringify({ status, done: doneFrames, total, fps: +fps_.toFixed(2), etaSeconds: Math.round(eta), workers: nw, freeRamGB: +free.toFixed(1), out: outFile, updated: new Date().toISOString() }));
    }
  };
  const segFiles = [];
  for (const [si, [a, b]] of segs.entries()) {
    const file = path.join(segDir, `seg_${String(si).padStart(3, '0')}${enc.ext === '.gif' ? '.mp4' : enc.ext}`);
    segFiles.push(file);
    if (fs.existsSync(file + '.done')) { doneFrames += b - a; resumed += b - a; report(true); continue; }
    let segEnc = enc.ext === '.gif' ? { v: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p'] } : { ...enc, v: [...enc.v] };
    if (subK > 1) { // DOM capture has no in-page accumulation: shoot K sub-frames per frame and let ffmpeg average them
      const C = '\\,'; // ffmpeg filtergraph escape for a comma inside an expression
      const pre = `tmix=frames=${subK},select=eq(mod(n${C}${subK})${C}${subK - 1}),setpts=N/((${spec.fn}/${spec.fd})*TB)`, i = segEnc.v.indexOf('-vf');
      if (i >= 0) segEnc.v[i + 1] = pre + ',' + segEnc.v[i + 1]; else segEnc.v.unshift('-vf', pre);
    }
    const p = runFfmpeg([...inputArgs({ ...spec, fn: spec.fn * subK }, transport), ...segEnc.v, '-r', `${spec.fn}/${spec.fd}`, '-an', file], { stdin: true, label: 'ffmpeg (video)' });
    const items = [];
    for (let f = a; f < b; f++) for (let k = 0; k < subK; k++) {
      const t = f / spec.fps + (subK > 1 ? ((k + 0.5) / subK - 0.5) * shutter / spec.fps : 0);
      items.push({ t: Math.min(spec.dur, Math.max(0, t)), o: frameOpts(t) });
    }
    const base = doneFrames;
    await renderList(items, (i, buf) => write(p, buf), n => { doneFrames = base + Math.floor(n / subK); report(false); });
    p.stdin.end(); await p.done;
    fs.writeFileSync(file + '.done', '');
  }
  report(true, 'muxing');
  // join segments + audio
  const list = path.join(segDir, 'list.txt');
  fs.writeFileSync(list, segFiles.map(f => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const durOut = (f1 - f0) / spec.fps;
  const meta = spec.title ? ['-metadata', `title=${spec.title}`] : [];
  if (enc.ext === '.gif') {
    const tmp = path.join(segDir, 'joined.mp4');
    await runFfmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', tmp], { label: 'ffmpeg (join)' }).done;
    await runFfmpeg(['-i', tmp, ...enc.v, outFile], { label: 'ffmpeg (gif)' }).done;
  } else {
    const aIn = audioPath ? ['-ss', String(f0 / spec.fps), '-i', audioPath] : [];
    const map = audioPath ? ['-map', '0:v', '-map', '1:a', ...enc.a, '-ar', '48000', '-af', 'apad', '-t', String(durOut)] : ['-map', '0:v', '-an', '-t', String(durOut)];
    await runFfmpeg(['-f', 'concat', '-safe', '0', '-i', list, ...aIn, ...map, '-c:v', 'copy', ...meta, ...(enc.ext === '.mp4' || enc.ext === '.mov' ? ['-movflags', '+faststart'] : []), outFile], { label: 'ffmpeg (mux)' }).done;
  }
  const restarts = workers.reduce((s, w) => s + w.restarts, 0);
  if (args.profile) { const S = workers.reduce((a, w) => w.stats ? { n: a.n + w.stats.n, render: a.render + w.stats.render, read: a.read + w.stats.read, upload: a.upload + w.stats.upload } : a, { n: 0, render: 0, read: 0, upload: 0 });
    if (S.n) log(`  profile (avg ms per frame, per worker): renderFrame ${(S.render / S.n).toFixed(1)} · pixel readback ${(S.read / S.n).toFixed(1)} · upload ${(S.upload / S.n).toFixed(1)}  → with ${workers.length} workers ≈ ${(1000 / ((S.render + S.read + S.upload) / S.n) * workers.length).toFixed(1)} fps ceiling`); }
  await Promise.all(workers.map(w => w.close())); workers = []; await settleMemory();
  const took = (Date.now() - t0) / 1000, size = fs.statSync(outFile).size;
  fs.writeFileSync(progressFile, JSON.stringify({ status: 'done', done: total, total, seconds: Math.round(took), out: outFile, updated: new Date().toISOString() }));
  log(`\n✔ ${outFile}\n  ${(size / 1e6).toFixed(1)} MB · ${fmtTime(took)} total · ${(total / took).toFixed(1)} fps average${restarts ? ` · ${restarts} worker restart(s)` : ''}`);
  if (size < 20000) warn('the output file is suspiciously small — check the page for errors (run: node tools/render.mjs sheet).');
  fs.rmSync(segDir, { recursive: true, force: true });
}

async function timesFromArgs(spec) {
  if (args.times) return String(args.times).split(',').flatMap(tok => { if (tok.includes(':')) { const [a, b, st = '.1'] = tok.split(':').map(Number); const out = []; for (let t = a; t <= b + 1e-9 && out.length < 200; t += st) out.push(+t.toFixed(4)); return out; } return [Number(tok)]; }).filter(x => Number.isFinite(x));   // "3:4:0.1" = a filmstrip every 0.1 s from 3 to 4 s
  if (args.markers && spec.V.markers?.length) return spec.V.markers.map(m => m.t);
  const n = num(args.count, 24);
  return Array.from({ length: n }, (_, i) => +((i + 0.5) / n * spec.dur).toFixed(3));
}

async function doSheet() {
  const spec = await resolveSpec();
  const times = (await timesFromArgs(spec)).map(t => Math.min(Math.max(0, t), spec.dur - 1 / spec.fps));
  await setupWorkers(spec, Math.min(cfg.workers, times.length), { forceRgba: true });
  const portrait = spec.H > spec.W, cols = num(args.cols, times.length <= 6 ? Math.min(3, times.length) : portrait ? 6 : 4);
  const rows = Math.ceil(times.length / cols), tileW = num(args.tile, Math.round((portrait ? 2000 : 2000) / cols));
  const transport = spec.capture === 'canvas' ? 'raw' : 'png';
  const outFile = path.resolve(ROOT, args.out || 'qc/sheet.png'); fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const p = runFfmpeg([...inputArgs({ ...spec }, transport).map(x => x === `${spec.fn}/${spec.fd}` ? '1' : x), '-vf', `scale=${tileW}:-2:flags=area,tile=${cols}x${rows}:padding=4:margin=4:color=0x101014`, '-frames:v', '1', '-update', '1', outFile], { stdin: true, label: 'ffmpeg (sheet)' });
  const items = times.map(t => ({ t, o: { K: 1, fmt: transport === 'raw' ? 'raw' : 'png', label: `${t.toFixed(2)}s${spec.V.markers?.find(m => Math.abs(m.t - t) < 1e-6)?.label ? '  ' + spec.V.markers.find(m => Math.abs(m.t - t) < 1e-6).label : ''}` } }));
  // the tile filter needs exactly cols*rows frames: pad with the last one
  await renderList(items, (i, b) => write(p, b));
  for (let k = times.length; k < cols * rows; k++) await write(p, Buffer.alloc(transport === 'raw' ? spec.W * spec.H * 4 : 0, 16));
  p.stdin.end(); await p.done;
  log(`✔ contact sheet: ${outFile}  (${times.length} frames: ${times.map(t => t.toFixed(1)).join(', ')})`);
  await cleanupAndExit(0);
}

async function doStill() {
  const spec = await resolveSpec();
  const times = (args._.length ? args._.join(',').split(',') : String(args.times || '0').split(',')).map(Number).filter(Number.isFinite);
  await setupWorkers(spec, Math.min(cfg.workers, times.length), { forceRgba: true });
  fs.mkdirSync(path.join(ROOT, 'qc'), { recursive: true });
  const files = [];
  await renderList(times.map(t => ({ t: Math.min(Math.max(0, t), spec.dur), o: { K: Math.max(1, Math.round(num(args['motion-blur'], 1))), shutter: num(args.shutter, 0.5), dt: 1 / spec.fps, dur: spec.dur, fmt: 'png' } })),
    (i, buf) => { const f = path.join(ROOT, 'qc', `still_${times[i].toFixed(3)}.png`); fs.writeFileSync(f, buf); files.push(f); });
  files.forEach(f => log('✔ ' + f));
  await cleanupAndExit(0);
}

async function doVerify() {
  const spec = await resolveSpec();
  await setupWorkers(spec, 2, { min: 2 });
  const [A, B] = workers, d = spec.dur, T1 = +(d * 0.31).toFixed(3), T2 = +(d * 0.77).toFixed(3), T3 = +(d * 0.05).toFixed(3);
  const opt = { K: 1, fmt: spec.capture === 'canvas' ? (A.mode === 'yuv' ? 'yuv' : 'raw') : 'png' };
  const sha = b => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
  const a1 = await A.safeFrame(T1, opt), a2 = await A.safeFrame(T2, opt), a3 = await A.safeFrame(T3, opt), a1b = await A.safeFrame(T1, opt), a2b = await A.safeFrame(T2, opt);
  const b1 = await B.safeFrame(T1, opt), b2 = await B.safeFrame(T2, opt);
  const checks = [['same worker, repeated (t=' + T1 + ')', a1, a1b], ['same worker, out of order (t=' + T2 + ')', a2, a2b], ['other Chrome process (t=' + T1 + ')', a1, b1], ['other Chrome process (t=' + T2 + ')', a2, b2]];
  let bad = 0, noisy = 0;
  for (const [name, x, y] of checks) {
    let verdict = 'PASS', extra = '';
    if (!x.equals(y)) {
      if (spec.capture === 'canvas' && x.length === y.length) {
        let n = 0, mx = 0; for (let i = 0; i < x.length; i++) { const dlt = Math.abs(x[i] - y[i]); if (dlt) { n++; if (dlt > mx) mx = dlt; } }
        extra = `  → ${n} of ${x.length} bytes differ (${(100 * n / x.length).toFixed(3)}%), max delta ${mx}`;
        // A real GPU does not promise bit-exact blending/float math (measured: 70 k additive particles → 0.05 % of bytes off by 1, even in one process). Impurity shows up as far larger differences.
        if (mx <= 2 && n / x.length <= 0.005) { verdict = 'PASS~'; noisy++; } else { verdict = 'FAIL'; bad++; }
      } else { verdict = 'FAIL'; bad++; }
    }
    log(`${verdict.padEnd(5)} ${name}  ${sha(x)} ${verdict === 'PASS' ? '==' : '!='} ${sha(y)}${extra}`);
  }
  if (a1.equals(a3)) warn(`frames at t=${T1} and t=${T3} are identical — is the animation actually moving?`);
  if (bad) {
    log('\nNOT deterministic. Usual causes: Math.random() · Date.now()/performance.now() inside renderFrame · state that accumulates between frames (particle arrays mutated per frame) · images/fonts not awaited in window.ready · CSS animations/<video> not seeked · async work still running. Fix, then re-run verify. (Differences of ≤ 2 levels in < 0.5 % of bytes count as GPU rounding noise and pass.)');
    await cleanupAndExit(2);
  }
  log(noisy ? '\n✔ deterministic within GPU rounding noise (PASS~: a few pixels differ by ≤ 2 levels — invisible after encoding; --gpu off renders bit-exact frames).'
            : '\n✔ deterministic: any frame can be rendered in any order on any worker.');
  await cleanupAndExit(0);
}

async function doInfo() {
  const spec = await resolveSpec();
  const chrome = findChrome(args.chrome);
  console.log(JSON.stringify({ page: PAGE_REL, root: ROOT, node: process.version, ffmpeg: FFMPEG_VER, chrome, cores, ramGB: { total: +totalGB.toFixed(1), free: +availGB().toFixed(1) }, workersDefault: cfg.workers, spec: { width: spec.W, height: spec.H, fps: spec.fps, duration: spec.dur, capture: spec.capture, audio: spec.audio, title: spec.title }, page_report: spec.info }, null, 2));
  await cleanupAndExit(0);
}

try {
  if (mode === 'render') {
    fs.rmSync(STOP_FILE, { force: true });       // `node tools/render.mjs stop` drops this file; a clean stop is the only kind that closes Chrome properly on Windows
    setInterval(() => { if (fs.existsSync(STOP_FILE)) { console.error('\nstop requested — shutting down (finished segments are kept) …'); cleanupAndExit(130); } }, 1000).unref();
    await doRender();
  }
  else if (mode === 'sheet') await doSheet();
  else if (mode === 'still') await doStill();
  else if (mode === 'verify') await doVerify();
  else if (mode === 'info') await doInfo();
  await cleanupAndExit(0);
} catch (e) {
  console.error('\nerror: ' + (e && e.message || e));
  if (pageLogs.size) console.error('(page messages are printed above)');
  await cleanupAndExit(1);
}
