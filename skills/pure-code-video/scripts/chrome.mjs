// chrome.mjs — tiny Chrome DevTools Protocol client over --remote-debugging-pipe. Zero dependencies, Node >= 18.
// Why a pipe and not a WebSocket: no port to pick, no DevToolsActivePort file to poll, and no message-size trouble
// (Node's built-in WebSocket silently drops multi-MB replies). One Chrome *process* per worker keeps tabs from
// throttling each other and lets a crashed renderer be replaced without touching the others.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const isFile = p => { try { return !!p && fs.statSync(p).isFile(); } catch { return false; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

let tmpDir = null;
/** Scratch directory for Chrome profiles, render segments and QC temp files: $PCV_TMP, else the OS temp dir (big files stay out of OneDrive/Dropbox project folders).
 *  Sandboxed agent shells sometimes cannot write there — then `fallback` (a folder inside the project) is used and exported as $PCV_TMP for child processes. */
export function tmpBase(fallback) {
  if (tmpDir) return tmpDir;
  const usable = d => { try { fs.mkdirSync(d, { recursive: true }); fs.rmSync(fs.mkdtempSync(path.join(d, 'pcv-t-')), { recursive: true }); return true; } catch { return false; } };
  const want = process.env.PCV_TMP || os.tmpdir();
  if (usable(want)) return (tmpDir = want);
  const d = fallback || path.join(process.cwd(), '.render', 'tmp');
  fs.mkdirSync(d, { recursive: true }); process.env.PCV_TMP = d;
  console.warn(`note: ${want} is not writable here — using ${d} for scratch files`);
  return (tmpDir = d);
}

/** Locate Chrome / Chromium / Edge / Brave. `explicit` or $CHROME wins. Returns null when nothing is found. */
export function findChrome(explicit) {
  const env = process.env, c = [explicit, env.CHROME, env.CHROME_PATH, env.PUPPETEER_EXECUTABLE_PATH, env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH];
  const home = os.homedir();
  if (process.platform === 'win32') {
    for (const r of [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA, 'C:\\Program Files', 'C:\\Program Files (x86)'].filter(Boolean)) {
      c.push(path.join(r, 'Google', 'Chrome', 'Application', 'chrome.exe'), path.join(r, 'Chromium', 'Application', 'chrome.exe'),
        path.join(r, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), path.join(r, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'));
    }
    c.push(...playwrightBrowsers(path.join(env.LOCALAPPDATA || '', 'ms-playwright'), 'chrome-win', 'chrome.exe'));
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'));
    c.push(...playwrightBrowsers(path.join(home, 'Library/Caches/ms-playwright'), 'chrome-mac/Chromium.app/Contents/MacOS', 'Chromium'));
  } else {
    for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable', 'brave-browser', 'chrome']) {
      const r = spawnSync('which', [n], { encoding: 'utf8' });
      if (r.status === 0 && r.stdout.trim()) c.push(r.stdout.trim());
    }
    c.push('/snap/bin/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome');
    c.push(...playwrightBrowsers(path.join(home, '.cache/ms-playwright'), 'chrome-linux', 'chrome'));
  }
  return c.find(isFile) || null;
}
function playwrightBrowsers(root, sub, exe) {
  try { return fs.readdirSync(root).filter(d => d.startsWith('chromium')).sort().reverse().map(d => path.join(root, d, sub, exe)); } catch { return []; }
}

/** Chrome command line. gpu: 'on' | 'off' | 'auto' (auto = try the GPU, keep SwiftShader as a WebGL fallback). */
export function chromeArgs({ profile, gpu = process.env.PCV_GPU || 'auto', width = 1920, height = 1080, extra = [] }) {
  const a = ['--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--mute-audio', '--force-color-profile=srgb', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-ipc-flooding-protection',
    '--disable-features=CalculateNativeWinOcclusion,Translate,MediaRouter', '--disable-extensions', '--disable-component-update', '--disable-sync',
    '--disable-breakpad', '--metrics-recording-only', '--password-store=basic', '--use-mock-keychain', `--window-size=${width},${height}`];
  if (process.platform === 'linux' && (process.getuid?.() === 0 || process.env.PCV_NO_SANDBOX)) a.push('--no-sandbox', '--disable-dev-shm-usage');   // containers/CI run as root
  if (gpu === 'off') a.push('--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  else {
    a.push('--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader');
    if (process.platform === 'win32') a.push('--use-angle=d3d11');
    else if (process.platform === 'darwin') a.push('--use-angle=metal');
  }
  if (process.env.PCV_CHROME_FLAGS) a.push(...process.env.PCV_CHROME_FLAGS.split(/\s+/).filter(Boolean));   // escape hatch for experiments, e.g. PCV_CHROME_FLAGS="--use-angle=vulkan"
  return a.concat(extra);
}

const fmtException = d => d.exception?.description || d.exception?.value || d.text || 'page exception';

let swept = false;
/** Temp profiles of runs that were killed hard (timeouts, Ctrl+C on some shells) pile up: delete the ones older than 30 minutes. */
function sweepStaleProfiles() {
  if (swept) return; swept = true;
  try {
    for (const d of fs.readdirSync(tmpBase())) if (d.startsWith('pcv-chrome-')) {
      const p = path.join(tmpBase(), d);
      try { if (Date.now() - fs.statSync(p).mtimeMs > 30 * 60 * 1000) fs.rmSync(p, { recursive: true, force: true, maxRetries: 2 }); } catch { /* in use */ }
    }
  } catch { /* tmp unreadable */ }
}

export class Page {
  constructor(browser, targetId, sessionId) {
    this.browser = browser; this.targetId = targetId; this.sessionId = sessionId; this.handlers = new Map(); this.crashed = false;
  }
  send(method, params = {}, timeout = 120000) { return this.browser.send(method, params, this.sessionId, timeout); }
  on(event, fn) { (this.handlers.get(event) || this.handlers.set(event, []).get(event)).push(fn); return this; }
  emit(event, params) { for (const fn of this.handlers.get(event) || []) fn(params); }
  /** Evaluate JS in the page. Awaits promises. Throws with the page's own error text. */
  async eval(expression, { timeout = 120000, awaitPromise = true } = {}) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true }, timeout);
    if (r.exceptionDetails) throw new Error(fmtException(r.exceptionDetails));
    return r.result.value;
  }
  async viewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  }
  goto(url) { return this.send('Page.navigate', { url }); }
  async close() { try { await this.browser.send('Target.closeTarget', { targetId: this.targetId }, undefined, 5000); } catch { /* browser already gone */ } }
}

export class Browser {
  constructor(proc, profile, exe) {
    this.proc = proc; this.profile = profile; this.exe = exe; this.seq = 0; this.pending = new Map(); this.pages = new Map(); this.buf = []; this.dead = false; this.stderr = ''; this.gpuDeaths = 0;
    // Chrome logs "GPU process exited unexpectedly" when the GPU driver path fails (seen with a forced discrete GPU on a hybrid laptop); WebGL contexts are lost and shader compiles fail with an empty log
    proc.stdio[2].on('data', d => { this.stderr = (this.stderr + d).slice(-4000); this.gpuDeaths += (String(d).match(/GPU process (exited unexpectedly|crashed)/g) || []).length; });
    proc.stdio[4].on('data', c => this.#onData(c));
    proc.stdio[4].on('error', () => {});
    proc.stdio[3].on('error', () => {});
    proc.on('exit', code => { this.dead = true; this.#failAll(new Error(`Chrome exited (code ${code}). ${this.stderr.trim().split('\n').slice(-3).join(' | ')}`)); });
  }
  static async launch({ chrome, gpu = process.env.PCV_GPU || 'auto', width = 1920, height = 1080, extra = [] } = {}) {
    const exe = findChrome(chrome);
    if (!exe) throw new Error('Chrome/Chromium/Edge not found. Install Chrome, or set CHROME=<full path to the executable>.');
    sweepStaleProfiles();
    const profile = fs.mkdtempSync(path.join(tmpBase(), 'pcv-chrome-'));
    const proc = spawn(exe, chromeArgs({ profile, gpu, width, height, extra }), { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'], windowsHide: true });
    const b = new Browser(proc, profile, exe);
    try { await b.send('Browser.getVersion', {}, undefined, 30000).then(v => { b.version = v.product; }); }
    catch (e) { await b.close(3000); throw e; }     // never leave a half-started Chrome behind
    return b;
  }
  #onData(chunk) {
    let start = 0;
    for (let i; (i = chunk.indexOf(0, start)) >= 0; start = i + 1) {
      this.buf.push(chunk.subarray(start, i));
      const text = Buffer.concat(this.buf).toString('utf8'); this.buf = [];
      if (text) try { this.#dispatch(JSON.parse(text)); } catch { /* ignore malformed */ }
    }
    if (start < chunk.length) this.buf.push(chunk.subarray(start));
  }
  #dispatch(m) {
    if (m.id) {
      const p = this.pending.get(m.id); if (!p) return;
      this.pending.delete(m.id); clearTimeout(p.timer);
      m.error ? p.reject(new Error(`${p.method}: ${m.error.message}`)) : p.resolve(m.result);
    } else if (m.method) {
      const page = m.sessionId ? this.pages.get(m.sessionId) : null;
      if (page) {
        if (m.method === 'Inspector.targetCrashed') { page.crashed = true; this.#failAll(new Error('renderer crashed'), m.sessionId); }
        page.emit(m.method, m.params);
      }
    }
  }
  #failAll(err, sessionId) {
    for (const [id, p] of this.pending) if (!sessionId || p.sessionId === sessionId) { this.pending.delete(id); clearTimeout(p.timer); p.reject(err); }
  }
  send(method, params = {}, sessionId, timeout = 120000) {
    if (this.dead) return Promise.reject(new Error('Chrome is not running'));
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`${method} timed out after ${timeout} ms (renderer hung or crashed?)`)); }, timeout);
      this.pending.set(id, { resolve, reject, timer, method, sessionId });
      try { this.proc.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0'); } catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  /** Open a blank tab with the given viewport and console/network diagnostics wired to `onLog(level, text)`. */
  async newPage({ width, height, onLog } = {}) {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const page = new Page(this, targetId, sessionId); this.pages.set(sessionId, page);
    await Promise.all([page.send('Runtime.enable'), page.send('Page.enable'), page.send('Log.enable'), page.send('Network.enable'), page.send('Inspector.enable')]);
    if (width) await page.viewport(width, height);
    if (onLog) {
      const urls = new Map();
      page.on('Runtime.exceptionThrown', p => onLog('error', 'page error: ' + fmtException(p.exceptionDetails)));
      page.on('Runtime.consoleAPICalled', p => {
        const text = p.args.map(a => a.value ?? a.description ?? '').join(' ');
        if (p.type === 'error' || p.type === 'assert') onLog('error', 'console.error: ' + text);
        else if (p.type === 'warning') onLog('warn', 'console.warn: ' + text);
        else if (p.type === 'log' || p.type === 'info') onLog('log', text);
      });
      page.on('Log.entryAdded', p => { if (p.entry.level === 'error') onLog('error', `${p.entry.source}: ${p.entry.text}${p.entry.url ? ' — ' + p.entry.url : ''}`); });
      page.on('Network.requestWillBeSent', p => urls.set(p.requestId, p.request.url));
      page.on('Network.responseReceived', p => { if (p.response.status >= 400) onLog('error', `HTTP ${p.response.status} for ${p.response.url}`); });
      page.on('Network.loadingFailed', p => { if (!p.canceled) onLog('error', `request failed (${p.errorText}) ${urls.get(p.requestId) || ''}`); });
    }
    return page;
  }
  /** Ask Chrome to quit and give it time to tear its GPU process down itself; killing the root while the GPU process is busy can leave it stuck. */
  async close(graceMs = 10000) {
    if (!this.dead) {
      try { await this.send('Browser.close', {}, undefined, 3000); } catch { /* already closing */ }
      await Promise.race([new Promise(r => this.proc.once('exit', r)), sleep(graceMs)]);
    }
    if (!this.dead) try { this.proc.kill(); } catch { /* gone */ }
    for (let i = 0; i < 8; i++) { try { fs.rmSync(this.profile, { recursive: true, force: true }); break; } catch { await sleep(250); } }
  }
}
