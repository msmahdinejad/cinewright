#!/usr/bin/env node
// analyze-audio.mjs — turn a sound file into data your visuals can read (music-driven videos, audio-reactive scenes).
//
//   node tools/analyze-audio.mjs song.mp3 [--rate 120] [--out envelopes.json]      one file
//   node tools/analyze-audio.mjs --stems stems/ [--rate 120]                       one entry per WAV in the folder (kick.wav, bass.wav, …)
//
// Output JSON (load it in the page with `await K.audioData('envelopes.json')`, see lib/kit.js):
//   { rate, duration, bpm, beats:[t…], downbeats:[t…], onsets:[{t,v,band}], levels:{master,sub,low,lowmid,mid,high,centroid}, sections:[{t,energy}] }
//   levels are 0..1000 integers sampled `rate` times per second (linear interpolation in the page).
// Zero dependencies: ffmpeg decodes, a radix-2 FFT does the rest.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), opt = {}, pos = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) { opt[args[i].slice(2)] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true; } else pos.push(args[i]); }
const FFMPEG = process.env.FFMPEG || 'ffmpeg', SR = 22050, N = 1024, RATE = +(opt.rate || 120), HOP = Math.round(SR / RATE);

function decode(file) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error('ffmpeg could not decode ' + file + ': ' + String(r.stderr).slice(0, 300));
  const raw = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.length / 4)), x = new Float32Array(raw.length + N / 2); x.set(raw, N / 2); return x;   // window f is centred on time f/RATE
}
// in-place radix-2 FFT on re/im Float64Arrays
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
  }
}
const HANN = Float64Array.from({ length: N }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / (N - 1)));
const BANDS = [['sub', 20, 60], ['low', 60, 250], ['lowmid', 250, 800], ['mid', 800, 3000], ['high', 3000, 10000]];
const binOf = f => Math.min(N / 2, Math.max(1, Math.round(f * N / SR)));
const NBANDS = 32;
function spectrumEdges() { const out = []; let prev = binOf(40); for (let i = 1; i <= NBANDS; i++) { const f = 40 * (12000 / 40) ** (i / NBANDS), b = Math.max(prev, binOf(f)); out.push([prev, Math.max(prev, b - (i < NBANDS ? 0 : 0))]); prev = b + 1 > N / 2 ? N / 2 : b + 1; } return out; }

function analyze(x) {
  const frames = Math.max(1, Math.floor((x.length - N) / HOP) + 1), re = new Float64Array(N), im = new Float64Array(N), prev = new Float64Array(N / 2 + 1);
  const SP = spectrumEdges(), spec = new Float32Array(frames * SP.length), bandE = BANDS.map(() => new Float64Array(frames)), master = new Float64Array(frames), flux = new Float64Array(frames), cent = new Float64Array(frames), bflux = BANDS.map(() => new Float64Array(frames));
  for (let f = 0; f < frames; f++) {
    const o = f * HOP; let rms = 0; for (let i = 0; i < N; i++) { const v = x[o + i] || 0; re[i] = v * HANN[i]; im[i] = 0; rms += v * v; } master[f] = Math.sqrt(rms / N);
    fft(re, im); let fl = 0, num = 0, den = 0;
    const mag = new Float64Array(N / 2 + 1); for (let k = 0; k <= N / 2; k++) { mag[k] = Math.hypot(re[k], im[k]); num += k * mag[k]; den += mag[k]; }
    BANDS.forEach(([, lo, hi], b) => { let e = 0, fx = 0; for (let k = binOf(lo); k <= binOf(hi); k++) { e += mag[k] * mag[k]; const d = Math.log1p(mag[k] * 20) - Math.log1p(prev[k] * 20); if (d > 0) fx += d; } bandE[b][f] = Math.sqrt(e); bflux[b][f] = fx; fl += fx; });
    for (let k = 0; k <= N / 2; k++) prev[k] = mag[k]; flux[f] = fl; cent[f] = den ? (num / den) * SR / N : 0;
    SP.forEach(([lo, hi], b) => { let e = 0, c = 0; for (let k = lo; k <= hi; k++) { e += mag[k] * mag[k]; c++; } spec[f * SP.length + b] = Math.sqrt(e / Math.max(1, c)); });
  }
  return { frames, bandE, master, flux, cent, bflux, spec, nb: SP.length };
}
const norm = a => { const s = [...a].sort((p, q) => p - q), hi = s[Math.floor(s.length * .995)] || 1; return Array.from(a, v => Math.min(1000, Math.round(1000 * v / (hi || 1)))); };
const smooth = (a, k) => { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) { let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) { s += a[j]; n++; } o[i] = s / n; } return o; };

function peaks(env, minGapS = .06, k = 1.4) {
  const e = smooth(env, 1), out = [], gap = Math.round(minGapS * RATE), w = Math.round(.5 * RATE);
  for (let i = 2; i < e.length - 2; i++) {
    if (!(e[i] > e[i - 1] && e[i] >= e[i + 1])) continue;
    const seg = e.slice(Math.max(0, i - w), Math.min(e.length, i + w)), med = [...seg].sort((p, q) => p - q)[seg.length >> 1], mad = [...seg].map(v => Math.abs(v - med)).sort((p, q) => p - q)[seg.length >> 1];
    if (e[i] > med + k * mad * 1.48 + 1e-6 && (!out.length || i - out[out.length - 1].i >= gap)) out.push({ i, v: e[i] });
    else if (out.length && i - out[out.length - 1].i < gap && e[i] > out[out.length - 1].v) out[out.length - 1] = { i, v: e[i] };
  }
  const mx = Math.max(1e-9, ...out.map(p => p.v)); return out.map(p => ({ t: +(p.i / RATE).toFixed(3), v: +(p.v / mx).toFixed(2) }));
}
function tempo(flux) {
  const e = smooth(flux, 1), n = e.length, mean = e.reduce((a, b) => a + b, 0) / n, z = Float64Array.from(e, v => Math.max(0, v - mean)), zs = smooth(z, 1);
  // 1) coarse: autocorrelation over 60–200 BPM (with harmonics), mild preference for musical tempi
  let best = 0, bl = 120;
  for (let bpm = 60; bpm <= 200; bpm += .5) { const lag = 60 / bpm * RATE; let s = 0; for (const m of [1, 2, 4]) { const L = lag * m; for (let i = 0; i + L < n; i++) s += z[i] * z[Math.round(i + L)]; } s = s / n * (1 - .12 * Math.abs(Math.log2(bpm / 120))); if (s > best) { best = s; bl = bpm; } }
  while (bl < 80) bl *= 2; while (bl > 165) bl /= 2;
  // 2) fine: comb filter — score every (bpm, phase) by the onset energy that lands on the beat grid
  let bestS = -1, bBpm = bl, bPh = 0;
  for (let b = bl - 3; b <= bl + 3; b += .02) { const P = 60 / b * RATE; for (let ph = 0; ph < P; ph += .5) { let s = 0, c = 0; for (let t = ph; t < n; t += P) { s += zs[Math.round(t)] || 0; c++; } s /= Math.max(1, c); if (s > bestS) { bestS = s; bBpm = b; bPh = ph; } } }
  const P = 60 / bBpm * RATE, beats = []; for (let t = bPh; t < n; t += P) beats.push(+(t / RATE).toFixed(3));
  return { bpm: +bBpm.toFixed(2), beats };
}
function sections(master, seconds = 2) {
  const w = Math.round(seconds * RATE), out = []; for (let i = 0; i < master.length; i += w) { const s = master.slice(i, i + w), m = s.reduce((a, b) => a + b, 0) / s.length; out.push({ t: +(i / RATE).toFixed(2), energy: Math.round(m) }); } return out;
}
function process_(file) {
  const x = decode(file), A = analyze(x), levels = { master: norm(smooth(A.master, 1)) }; BANDS.forEach(([n], b) => { levels[n] = norm(smooth(A.bandE[b], 1)); }); levels.centroid = norm(A.cent);
  const onsets = peaks(A.flux).map(o => ({ ...o, band: null })); BANDS.forEach(([n], b) => { for (const p of peaks(A.bflux[b], .09, 2.2)) { const hit = onsets.find(o => Math.abs(o.t - p.t) < .03); if (hit) hit.band ??= n; else onsets.push({ ...p, band: n }); } }); onsets.sort((a, b) => a.t - b.t);
  const T = tempo(A.flux), downbeats = T.beats.filter((_, i) => i % 4 === 0);
  const step = 2, nf = Math.floor(A.frames / step), data = new Array(nf * A.nb);
  for (let b = 0; b < A.nb; b++) { const col = []; for (let f = 0; f < A.frames; f++) col.push(A.spec[f * A.nb + b]); const s = [...col].sort((p, q) => p - q), hi = s[Math.floor(s.length * .99)] || 1; for (let f = 0; f < nf; f++) data[f * A.nb + b] = Math.min(1000, Math.round(1000 * Math.sqrt(Math.min(1, col[f * step] / hi)))); }
  return { rate: RATE, duration: +((x.length - N / 2) / SR).toFixed(3), bpm: T.bpm, beats: T.beats, downbeats, onsets, levels, sections: sections(levels.master), spectrum: { bands: A.nb, rate: RATE / step, data } };
}

if (opt.stems) {
  const dir = path.resolve(String(opt.stems)), out = { rate: RATE, stems: {} };
  for (const f of fs.readdirSync(dir).filter(f => /\.(wav|mp3|flac|ogg|m4a)$/i.test(f))) { const r = process_(path.join(dir, f)); out.stems[path.basename(f, path.extname(f))] = { levels: r.levels, onsets: r.onsets, duration: r.duration }; console.log(`stem ${f}: ${r.onsets.length} onsets`); }
  out.duration = Math.max(...Object.values(out.stems).map(s => s.duration)); const file = path.resolve(String(opt.out || 'envelopes.json')); fs.writeFileSync(file, JSON.stringify(out)); console.log('✔ ' + file);
} else {
  const file = pos[0]; if (!file) { console.error('usage: node analyze-audio.mjs <audio file> [--rate 120] [--out envelopes.json]   |   --stems <dir>'); process.exit(1); }
  const r = process_(path.resolve(file)), o = path.resolve(String(opt.out || 'envelopes.json')); fs.writeFileSync(o, JSON.stringify(r));
  console.log(`✔ ${o}\n  ${r.duration.toFixed(1)} s · ≈ ${r.bpm} BPM · ${r.beats.length} beats · ${r.onsets.length} onsets · strongest sections: ${[...r.sections].sort((a, b) => b.energy - a.energy).slice(0, 3).map(s => s.t + 's').join(', ')}`);
}
