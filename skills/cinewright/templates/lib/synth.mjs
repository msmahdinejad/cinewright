// synth.mjs — a from-scratch sound-design + mixing kit for Node (no samples, no dependencies).
// Deterministic: same code → same WAV. Everything renders offline into Float32 buses, then mix → master → WAV.
//
//   import { Song, note, scale, chord, PERSIAN } from './lib/synth.mjs';
//   const s = new Song({ dur: 30, bpm: 120 });                     // 48 kHz stereo
//   s.pad(0, chord('A3','min7'), 8, { vel: .5 });                  // instruments write into named buses
//   s.kick(4 * s.B); s.hat(4.25 * s.B); s.whoosh(3.5, 1);          // s.B = seconds per beat
//   s.write('audio.wav', { lufs: -14 });                           // reverb + duck + glue + loudness + limiter
//
// Instruments take (time in seconds, …, opts). Common opts: vel (0..1), pan (-1..1), send (reverb amount 0..1), bus (name).
// Persian palette: tombak(t,'dom'|'tak'|'ka'|'roll') daf(t,'dom'|'bam'|'ring') santur(t,note,dur) ney(t,note,dur) + PERSIAN modes and quarter-tone note names ('Ed4'); s.groove('sixeight', t0, bars) plays a Persian-flavoured 6/8.
// Textures: gong(t) ambience(t,dur,'wind'|'rain'|'room') crackle(t,dur).  Grooves: s.groove('house'|'trap'|'dnb'|'breakbeat'|'lofi'|'halftime'|'sixeight', t0, bars) → kick times for ducking.
import fs from 'node:fs';
import path from 'node:path';

const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
export const lerp = (a, b, t) => a + (b - a) * t;
const db = x => 10 ** (x / 20);
const fract = x => x - Math.floor(x);

/* ═══════════════ theory ═══════════════ */
const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** 'C#4' → MIDI 61. Accidentals: # sharp, b flat, d quarter-flat (koron), + quarter-sharp (sori). Fractional MIDI is fine. Numbers pass through. */
export function note(n) {
  if (typeof n === 'number') return n;
  const m = /^([A-Ga-g])(#|b|d|\+)?(-?\d)$/.exec(n.trim()); if (!m) throw new Error(`bad note "${n}" (use e.g. C4, F#3, Bb2, Ed4 = E quarter-flat)`);
  return 12 * (+m[3] + 1) + NAMES[m[1].toUpperCase()] + ({ '#': 1, b: -1, d: -.5, '+': .5 }[m[2]] || 0);
}
export const mtof = (m, a4 = 440) => a4 * 2 ** ((note(m) - 69) / 12);
export const centsToRatio = c => 2 ** (c / 1200);
export const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11], melodicMinor: [0, 2, 3, 5, 7, 9, 11], majorPent: [0, 2, 4, 7, 9], minorPent: [0, 3, 5, 7, 10], blues: [0, 3, 5, 6, 7, 10], wholeTone: [0, 2, 4, 6, 8, 10], hijaz: [0, 1, 4, 5, 7, 8, 10], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
/** scale('D3','minor', 2) → MIDI numbers over 2 octaves (inclusive of the top root). */
export function scale(root, name = 'major', octaves = 1) { const r = note(root), s = SCALES[name] || name, out = []; for (let o = 0; o < octaves; o++) for (const d of s) out.push(r + d + 12 * o); out.push(r + 12 * octaves); return out; }
const CHORDS = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10],
  maj9: [0, 4, 7, 11, 14], min9: [0, 3, 7, 10, 14], add9: [0, 4, 7, 14], min11: [0, 3, 7, 10, 14, 17], '6': [0, 4, 7, 9], min6: [0, 3, 7, 9], power: [0, 7, 12] };
/** chord('A3','min7') → MIDI numbers; inversion shifts the lowest notes up an octave. */
export function chord(root, quality = 'maj', inversion = 0) { const r = note(root), c = (CHORDS[quality] || quality).map(d => r + d); for (let i = 0; i < inversion; i++) c.push(c.shift() + 12); return c; }
/** progression('C4','major','I V vi IV') → array of chords (triads; add 7ths with 'I7' 'ii7' style suffixes). Roman numerals: upper = major, lower = minor. */
export function progression(key, mode, romans, octave = 0) {
  const root = note(key), sc = SCALES[mode] || SCALES.major, R = { i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6 };
  return String(romans).trim().split(/\s+/).map(tok => {
    const m = /^([b#]?)([ivIV]+)(7|maj7|°|dim)?$/.exec(tok); if (!m) throw new Error(`bad roman numeral "${tok}"`);
    const deg = R[m[2].toLowerCase()], upper = m[2] === m[2].toUpperCase(), r = root + sc[deg] + (m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0) + 12 * octave;
    const q = m[3] === '7' ? (upper ? 'dom7' : 'min7') : m[3] === 'maj7' ? 'maj7' : (m[3] === '°' || m[3] === 'dim') ? 'dim' : (upper ? 'maj' : 'min');
    return chord(r, q);
  });
}
/** Persian modes as cents above the tonic (from the compositions this kit grew out of; other schools tune slightly differently — check by ear).
    Use with hzOf(): hzOf(tonicHz, PERSIAN.chahargah[2]). koron = quarter-flat, sori = quarter-sharp. */
export const PERSIAN = {
  chahargah: [0, 140, 390, 498, 702, 842, 1092],            // on C: C Dk E F G Ak B  (two identical tetrachords, neutral 2nd + plus-second)
  esfahan: [0, 204, 294, 498, 702, 853, 996, 1088],          // on D: D E F G A Bk C(desc)/C#(asc)
  mahur: [0, 204, 386, 498, 702, 884, 1088],                 // just-intonation major
  shur: [0, 150, 294, 498, 702, 792, 996],                   // approximate, on D: D Ek F G A Bb C
  koron: -50, sori: 50,
};
export const hzOf = (tonicHz, cents) => tonicHz * 2 ** (cents / 1200);

/* ═══════════════ DSP primitives ═══════════════ */
const pan2 = p => [Math.cos((clamp(p, -1, 1) + 1) * Math.PI / 4), Math.sin((clamp(p, -1, 1) + 1) * Math.PI / 4)];
function biquad(type, f, Q, sr, gDb = 0) { // RBJ cookbook; returns a stateful per-sample function with .set(f,Q)
  const s = { x1: 0, x2: 0, y1: 0, y2: 0, b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
  const set = (f, Q = .707) => {
    f = clamp(f, 10, sr * .45); const w = TAU * f / sr, c = Math.cos(w), sn = Math.sin(w), al = sn / (2 * Q), A = db(gDb / 2);
    let b0, b1, b2, a0, a1, a2;
    switch (type) {
      case 'lp': b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
      case 'hp': b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
      case 'bp': b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
      case 'notch': b0 = 1; b1 = -2 * c; b2 = 1; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
      case 'peak': b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A; break;
      case 'lshelf': { const sq = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) - (A - 1) * c + sq); b1 = 2 * A * ((A - 1) - (A + 1) * c); b2 = A * ((A + 1) - (A - 1) * c - sq); a0 = (A + 1) + (A - 1) * c + sq; a1 = -2 * ((A - 1) + (A + 1) * c); a2 = (A + 1) + (A - 1) * c - sq; break; }
      case 'hshelf': { const sq = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) + (A - 1) * c + sq); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - sq); a0 = (A + 1) - (A - 1) * c + sq; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - sq; break; }
      default: throw new Error('filter ' + type);
    }
    s.b0 = b0 / a0; s.b1 = b1 / a0; s.b2 = b2 / a0; s.a1 = a1 / a0; s.a2 = a2 / a0;
  };
  set(f, Q);
  const run = x => { const y = s.b0 * x + s.b1 * s.x1 + s.b2 * s.x2 - s.a1 * s.y1 - s.a2 * s.y2; s.x2 = s.x1; s.x1 = x; s.y2 = s.y1; s.y1 = y; return y; };
  run.set = set; return run;
}
const polyblep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
const sawBL = (ph, dt) => 2 * ph - 1 - polyblep(ph, dt);
const sqBL = (ph, dt, pw = .5) => (ph < pw ? 1 : -1) + polyblep(ph, dt) - polyblep(fract(ph - pw + 1), dt);
const softclip = x => Math.tanh(x);

/* ═══════════════ Song ═══════════════ */
export class Song {
  /** opts: sr=48000, dur (seconds), bpm=120, seed, tail (extra seconds for reverb tails, default 2) */
  constructor({ sr = 48000, dur = 30, bpm = 120, seed = 1, tail = 2 } = {}) {
    this.sr = sr; this.dur = dur; this.bpm = bpm; this.B = 60 / bpm; this.N = Math.ceil(sr * (dur + tail)); this.seed = seed >>> 0;
    this.buses = {}; this.cfg = {}; this.log = []; this.rnd = this.#mkRng(seed);
    this.bus('music'); this.bus('drums'); this.bus('sfx'); this.bus('voice'); this.bus('verb'); this.bus('delay');
  }
  #mkRng(seed) { let s = (seed | 0) + 0x6D2B79F5; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  bus(name) { return this.buses[name] ||= [new Float32Array(this.N), new Float32Array(this.N)]; }
  /** seconds of beat n (with optional swing on off-beat eighths) */
  beat(n) { return n * this.B; } bar(n, beats = 4) { return n * beats * this.B; }
  /** write one stereo sample */
  put(bus, i, l, r) { if (i >= 0 && i < this.N) { bus[0][i] += l; bus[1][i] += r; } }
  /** send a copy of a signal to the reverb (or delay) input */
  #emit(i, l, r, o) { const bus = this.bus(o.bus || 'music'); this.put(bus, i, l, r); if (o.send) this.put(this.buses.verb, i, l * o.send, r * o.send); if (o.echo) this.put(this.buses.delay, i, l * o.echo, r * o.echo); }
  g(x) { return (this.rnd() + this.rnd() + this.rnd() + this.rnd() - 2) * 1.732; }   // gaussian-ish, for humanising
  human(t, amount = .006) { return t + this.g() * amount; }
  /** Step-sequencer: pattern 'x..x.o.X' → fn(time, vel) on every non-'.' step. x=1, o=.55, X=1.25, digits 1-9 = 0.1..0.9. unit = seconds per step (default 16th). */
  pattern(t0, pat, fn, { unit = this.B / 4, swing = 0, humanize = 0, repeat = 1 } = {}) {
    const steps = [...pat.replace(/[ |]/g, '')];
    for (let r = 0; r < repeat; r++) steps.forEach((ch, i) => { if (ch === '.' || ch === '-') return; const vel = ch === 'x' ? 1 : ch === 'X' ? 1.25 : ch === 'o' ? .55 : /\d/.test(ch) ? +ch / 10 : 1; const k = r * steps.length + i;
      fn(t0 + k * unit + (k % 2 ? swing * unit : 0) + (humanize ? this.g() * humanize : 0), vel * (humanize ? 1 + this.g() * .06 : 1)); });
  }

  /* ─────────── drums ─────────── */
  kick(t, { vel = 1, f0 = 150, f1 = 46, pitchDecay = .032, decay = .38, click = .18, drive = 1.6, bus = 'drums', pan = 0, send = .04 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round((decay + .1) * sr), [gl, gr] = pan2(pan), hp = biquad('hp', 2500, .7, sr); let ph = 0;
    for (let k = 0; k < n; k++) { const x = k / sr, f = f1 + (f0 - f1) * Math.exp(-x / pitchDecay); ph += TAU * f / sr;
      const a = Math.min(1, x / .0015) * Math.exp(-x / (decay * .42)), y = softclip(drive * (Math.sin(ph) * a + click * hp(this.rnd() * 2 - 1) * Math.exp(-x / .004))) * vel * .9; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  snare(t, { vel = 1, tone = 190, decay = .2, noise = 1, bus = 'drums', pan = 0, send = .14 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round((decay + .1) * sr), [gl, gr] = pan2(pan), bp = biquad('bp', 2100, .7, sr), hp = biquad('hp', 900, .7, sr); let ph = 0;
    for (let k = 0; k < n; k++) { const x = k / sr; ph += TAU * (tone * (1 + .6 * Math.exp(-x / .012))) / sr;
      const y = (Math.sin(ph) * Math.exp(-x / .055) * .55 + hp(bp(this.rnd() * 2 - 1)) * Math.exp(-x / (decay * .45)) * 1.5 * noise) * vel * .8; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  clap(t, { vel = 1, bus = 'drums', pan = 0, send = .2 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(.32 * sr), [gl, gr] = pan2(pan), bp = biquad('bp', 1250, 1.3, sr), offs = [0, .009, .019, .031];
    for (let k = 0; k < n; k++) { const x = k / sr; let a = 0; for (const o of offs) if (x >= o && x < o + .012) a = Math.max(a, Math.exp(-(x - o) / .003)); a = Math.max(a, x > .03 ? Math.exp(-(x - .031) / .07) * .7 : 0);
      const y = bp(this.rnd() * 2 - 1) * a * vel * 2; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  hat(t, { vel = 1, open = false, decay, bus = 'drums', pan = .15, send = .05 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), dec = decay || (open ? .28 : .035), n = Math.round((dec * 5 + .01) * sr), [gl, gr] = pan2(pan), hp = biquad('hp', 7200, .8, sr), R = [205.3, 304.4, 369.6, 522.7, 540, 800].map(f => f * 2.3);
    for (let k = 0; k < n; k++) { const x = k / sr; let m = 0; for (const f of R) m += Math.sign(Math.sin(TAU * f * x)); const y = hp(this.rnd() * 1.4 - .7 + m * .09) * Math.exp(-x / dec) * vel * .55; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  tom(t, { vel = 1, f = 110, decay = .35, bus = 'drums', pan = 0, send = .12 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round((decay + .1) * sr), [gl, gr] = pan2(pan); let ph = 0;
    for (let k = 0; k < n; k++) { const x = k / sr; ph += TAU * f * (1 + .5 * Math.exp(-x / .04)) / sr; const y = (Math.sin(ph) * Math.exp(-x / (decay * .5)) + (this.rnd() * 2 - 1) * Math.exp(-x / .006) * .25) * vel * .8; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  rim(t, { vel = 1, bus = 'drums', pan = .1, send = .08 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(.06 * sr), [gl, gr] = pan2(pan), bp = biquad('bp', 1700, 4, sr); let ph = 0;
    for (let k = 0; k < n; k++) { const x = k / sr; ph += TAU * 1650 / sr; const y = (Math.sin(ph) * .5 + bp(this.rnd() * 2 - 1) * 1.2) * Math.exp(-x / .009) * vel; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  /** Tombak / zarb (Persian goblet drum). kind: 'dom' (deep centre bass), 'tak' (bright rim, right hand), 'ka' (softer rim, left hand), 'roll' (finger roll: a fast tak–ka run of `dur` seconds). A synthesised approximation, not a sample. */
  tombak(t, kind = 'dom', { vel = 1, dur = .5, bus = 'drums', pan = -.1, send = .16 } = {}) {
    if (kind === 'roll') { const n = Math.max(2, Math.round(dur / .055)); for (let i = 0; i < n; i++) this.tombak(t + i * .055, i % 2 ? 'ka' : 'tak', { vel: vel * (.45 + .55 * i / n), bus, pan, send }); return; }
    const sr = this.sr, i0 = Math.round(t * sr), [gl, gr] = pan2(pan);
    if (kind === 'dom') { const n = Math.round(.55 * sr); let ph = 0; for (let k = 0; k < n; k++) { const x = k / sr, f = 98 + 70 * Math.exp(-x / .018); ph += TAU * f / sr; const y = (Math.sin(ph) * Math.exp(-x / .15) + .35 * Math.sin(ph * 2.31) * Math.exp(-x / .06) + (this.rnd() * 2 - 1) * Math.exp(-x / .004) * .25) * vel * .95; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); } return; }
    const rim = kind === 'tak', n = Math.round((rim ? .16 : .12) * sr), bp = biquad('bp', rim ? 3300 : 2200, 2.2, sr); let ph = 0;
    for (let k = 0; k < n; k++) { const x = k / sr; ph += TAU * (rim ? 640 : 420) * (1 + .3 * Math.exp(-x / .01)) / sr; const y = (Math.sin(ph) * Math.exp(-x / .028) * .5 + bp(this.rnd() * 2 - 1) * Math.exp(-x / (rim ? .03 : .022)) * 1.6) * vel * (rim ? .85 : .6); this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  /** Daf (large Persian frame drum with jingle rings). kind: 'dom' (deep centre), 'bam' (bright rim + rings), 'ring' (only the rings: a shake). */
  daf(t, kind = 'dom', { vel = 1, bus = 'drums', pan = .15, send = .28 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), [gl, gr] = pan2(pan), n = Math.round((kind === 'dom' ? .7 : .9) * sr), hp = biquad('hp', 6500, .8, sr), bp = biquad('bp', 1300, 2.5, sr); let ph = 0;
    const R = [5200, 6100, 7300, 8800, 10100];
    for (let k = 0; k < n; k++) { const x = k / sr; let y = 0;
      if (kind === 'dom') { ph += TAU * (78 + 55 * Math.exp(-x / .02)) / sr; y += Math.sin(ph) * Math.exp(-x / .2) * .9 + Math.sin(ph * 2.4) * Math.exp(-x / .09) * .25; }
      if (kind === 'bam') { y += bp(this.rnd() * 2 - 1) * Math.exp(-x / .02) * 1.2 + Math.sin(TAU * 1180 * x) * Math.exp(-x / .015) * .3; }
      let rings = 0; for (const f of R) rings += Math.sin(TAU * f * x + f) * Math.exp(-x / (.2 + f * 1e-5 * 6)); y += hp(this.rnd() * 2 - 1) * Math.exp(-x / .12) * .25 * (kind === 'ring' ? 1.8 : 1) + rings * .06 * (kind === 'ring' ? 1.8 : 1);
      this.#emit(i0 + k, y * vel * .8 * gl, y * vel * .8 * gr, { bus, send }); }
  }
  /** Santur (hammered dulcimer): 3 detuned strings per note + a hammer click; a bright, long-ringing plucked tone. Use with PERSIAN modes / quarter-tones (note('Ed4')). */
  santur(t, n, dur = 2, o = {}) { this.pluck(t, n, dur, { courses: 3, spread: 3.4, T60: 2.8, bright: .75, strike: .085, vel: .6, send: .38, echo: .12, ...o }); }
  /** Ney (end-blown reed flute): breathy flute with a slow attack and pronounced vibrato. */
  ney(t, n, dur, o = {}) { this.flute(t, n, dur, { breath: .95, vibrato: 5.6, attack: .1, send: .5, vel: .55, ...o }); }
  /** Gong / big bell: inharmonic partials with long decay. */
  gong(t, { f = 98, vel = .8, decay = 4.5, bus = 'sfx', send = .5 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round((decay + .6) * sr), P = [[1, 1], [1.47, .7], [1.98, .6], [2.55, .45], [3.17, .35], [4.03, .25], [5.2, .15]], ph = P.map(() => 0);
    for (let k = 0; k < n; k++) { const x = k / sr; let y = 0; P.forEach(([r, a], i) => { ph[i] += TAU * f * r * (1 + .0015 * Math.sin(x * (2 + i))) / sr; y += Math.sin(ph[i]) * a * Math.exp(-x / (decay / (1 + r * .6))); }); y *= Math.min(1, x / .003) * vel * .35 + (x < .02 ? (this.rnd() * 2 - 1) * (1 - x / .02) * .2 * vel : 0); this.#emit(i0 + k, y, y, { bus, send }); }
  }
  /** Noise bed: kind 'wind' (slow-swelling low rush), 'rain' (dense hiss), 'room' (very soft broadband). Fades in/out over 15 % of dur. */
  ambience(t, dur, kind = 'wind', { vel = .3, pan = 0, bus = 'sfx', send = .15 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(dur * sr), [gl, gr] = pan2(pan), lp = biquad('lp', kind === 'rain' ? 9000 : kind === 'room' ? 2500 : 700, .7, sr), hp = biquad('hp', kind === 'rain' ? 2500 : kind === 'room' ? 120 : 80, .7, sr);
    for (let k = 0; k < n; k++) { const x = k / sr, e = Math.min(1, x / (dur * .15), (dur - x) / (dur * .15)); if (kind === 'wind' && k % 64 === 0) lp.set(350 + 650 * (.5 + .5 * Math.sin(x * 0.7 + Math.sin(x * .23) * 2)), .9);
      const y = hp(lp(this.rnd() * 2 - 1)) * e * vel * (kind === 'wind' ? 1.6 * (.6 + .4 * Math.sin(x * .6)) : kind === 'rain' ? .7 : .5); this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  /** Vinyl / tape crackle: sparse random ticks over a faint hiss. density = ticks per second. */
  crackle(t, dur, { vel = .25, density = 18, bus = 'sfx' } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(dur * sr), hp = biquad('hp', 3000, .7, sr); let env = 0;
    for (let k = 0; k < n; k++) { if (this.rnd() < density / sr) env = .3 + .7 * this.rnd(); env *= .985; const y = (hp(this.rnd() * 2 - 1) * (env * env * 1.2 + .015) * (this.rnd() < .5 ? 1 : -1)) * vel; this.#emit(i0 + k, y, y, { bus, send: .02 }); }
  }
  /** Ready-made drum grooves, bar after bar. name: 'house' · 'trap' · 'dnb' · 'breakbeat' · 'lofi' · 'sixeight' (Persian-flavoured 6/8: tombak + daf) · 'halftime'. Returns the kick times (for s.duck('music', kicks, …)). */
  groove(name, t0, bars, { vel = 1, swing = 0, kick = {} } = {}) {
    const B = this.B, kicks = [], K = (t, v = 1) => { this.kick(t, { vel: v * vel, ...kick }); kicks.push(t); }, bar = (name === 'sixeight' ? 3 : 4) * B;
    for (let b = 0; b < bars; b++) { const T = t0 + b * bar, u = B / 4, at = (i, off = 0) => T + i * u + (i % 2 && swing ? swing * u : 0) + off;
      switch (name) {
        case 'house': for (let i = 0; i < 4; i++) K(T + i * B); for (let i = 0; i < 4; i++) this.hat(T + i * B + B / 2, { vel: .6 * vel, open: true }); this.clap(T + B, { vel: .8 * vel }); this.clap(T + 3 * B, { vel: .8 * vel }); for (let i = 0; i < 16; i++) if (i % 2) this.hat(at(i), { vel: .22 * vel }); break;
        case 'trap': K(T); K(T + 1.5 * B, .9); K(T + 2.75 * B, .8); this.snare(T + 2 * B, { vel: vel }); this.clap(T + 2 * B, { vel: .6 * vel }); for (let i = 0; i < 16; i++) this.hat(at(i), { vel: (i % 4 === 0 ? .5 : .28) * vel }); for (let i = 0; i < 6; i++) this.hat(T + 3.5 * B + i * B / 12, { vel: (.25 + i * .06) * vel }); this.sub(T, 'F1', 1.4 * B, { vel: .55 * vel, drop: 1.2 }); break;
        case 'dnb': { const hits = [0, 6, 10]; hits.forEach(i => K(at(i), .95)); this.snare(T + B, { vel: vel }); this.snare(T + 3 * B, { vel: vel }); for (let i = 0; i < 16; i++) this.hat(at(i), { vel: (i % 2 ? .35 : .2) * vel }); this.snare(at(14), { vel: .35 * vel }); break; }
        case 'breakbeat': { [0, 5, 10].forEach(i => K(at(i), .95)); [4, 12].forEach(i => this.snare(at(i), { vel: vel })); this.snare(at(7), { vel: .4 * vel }); this.snare(at(15), { vel: .5 * vel }); for (let i = 0; i < 8; i++) this.hat(T + i * B / 2, { vel: .4 * vel }); break; }
        case 'lofi': K(T, .8); K(at(7), .6); K(at(10), .75); this.snare(T + B, { vel: .7 * vel, decay: .22 }); this.snare(T + 3 * B, { vel: .7 * vel, decay: .22 }); for (let i = 0; i < 8; i++) this.hat(T + i * B / 2 + (i % 2 ? swing * B / 4 : 0), { vel: (i % 2 ? .22 : .3) * vel }); break;
        case 'halftime': K(T); K(at(10), .8); this.snare(T + 2 * B, { vel: vel }); this.clap(T + 2 * B, { vel: .7 * vel }); for (let i = 0; i < 8; i++) this.hat(T + i * B / 2, { vel: .35 * vel }); break;
        case 'sixeight': { const e = B / 2, seq = ['dom', '', 'tak', 'ka', 'dom', 'tak']; seq.forEach((k, i) => { if (k) this.tombak(T + i * e, k, { vel: (k === 'dom' ? 1 : .8) * vel }); }); this.daf(T, 'dom', { vel: .9 * vel }); this.daf(T + 3 * e, 'bam', { vel: .7 * vel }); this.daf(T + 5 * e, 'ring', { vel: .5 * vel }); if (b % 4 === 3) this.tombak(T + 4 * e, 'roll', { dur: e * 1.8, vel: .8 * vel }); kicks.push(T, T + 4 * e); break; }
        default: throw new Error(`groove: unknown "${name}" (house, trap, dnb, breakbeat, lofi, halftime, sixeight)`);
      } }
    return kicks;
  }
  /** Sidechain-style ducking: lower bus `name` under every trigger time (mixdown applies it). */
  duck(name, times, { depth = .55, attack = .006, release = .22 } = {}) { (this.cfg.duck ||= []).push({ name, times: [...times], depth, attack, release }); }

  /* ─────────── bass / synth voices ─────────── */
  bass(t, n, dur, { vel = .8, wave = 'saw', cutoff = 700, env = 2.2, sub = .6, drive = 1.4, glide = 0, bus = 'music', pan = 0, send = 0 } = {}) {
    const sr = this.sr, f = mtof(n), i0 = Math.round(t * sr), len = Math.round((dur + .12) * sr), [gl, gr] = pan2(pan), lp = biquad('lp', cutoff, 1.1, sr); let ph = 0, ps = 0;
    for (let k = 0; k < len; k++) { const x = k / sr, e = Math.min(1, x / .006) * (x > dur ? Math.max(0, 1 - (x - dur) / .12) : 1) * (.35 + .65 * Math.exp(-x / .6));
      const ff = glide && x < glide ? f * 2 ** (-glide * 4 * (1 - x / glide) / 12) : f, dt = ff / sr; ph = fract(ph + dt); ps = fract(ps + dt / 2);
      if (k % 16 === 0) lp.set(cutoff * (1 + env * Math.exp(-x / .12)), 1.1);
      const osc = wave === 'square' ? sqBL(ph, dt, .5) : wave === 'sine' ? Math.sin(TAU * ph) : sawBL(ph, dt), y = softclip(drive * (lp(osc) * .8 + Math.sin(TAU * ps) * sub)) * e * vel * .6;
      this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  /** 808-style sub: sine with a short pitch drop and long tail. */
  sub(t, n, dur = .8, { vel = .9, drop = 1.7, bus = 'drums', drive = 1.8, send = 0 } = {}) {
    const sr = this.sr, f = mtof(n), i0 = Math.round(t * sr), len = Math.round((dur + .15) * sr); let ph = 0;
    for (let k = 0; k < len; k++) { const x = k / sr; ph += TAU * f * (1 + (drop - 1) * Math.exp(-x / .035)) / sr; const e = Math.min(1, x / .004) * Math.exp(-x / (dur * .55)) * (x > dur ? Math.max(0, 1 - (x - dur) / .15) : 1);
      const y = softclip(drive * Math.sin(ph) * e) * vel * .75; this.#emit(i0 + k, y, y, { bus, send }); }
  }
  /** Detuned-saw pad chord. notes = MIDI/names[]. Slow attack, breathing low-pass, stereo spread. */
  pad(t, notes, dur, { vel = .5, attack = .6, release = 1.2, voices = 5, detune = 9, cutoff = 1800, movement = .5, width = .8, bus = 'music', send = .3, brightness = 1 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), len = Math.round((dur + release) * sr), gain = vel * .32 / Math.sqrt(voices), ns = [].concat(notes).map(note);
    for (const m of ns) {
      const f = mtof(m), L = Array.from({ length: voices }, (_, v) => { const pn = voices === 1 ? 0 : (v / (voices - 1) * 2 - 1) * width, [pl, pr] = pan2(pn); return { ph: this.rnd(), det: voices === 1 ? 0 : (v / (voices - 1) - .5) * 2 * detune, pl, pr }; });
      const lpL = biquad('lp', cutoff, .8, sr), lpR = biquad('lp', cutoff, .8, sr), lfo = this.rnd() * TAU;
      for (let k = 0; k < len; k++) {
        const x = k / sr, e = Math.min(1, x / attack) ** 1.5 * (x > dur ? Math.max(0, 1 - (x - dur) / release) ** 1.5 : 1); if (e <= 0) continue;
        let l = 0, r = 0; for (const v of L) { const dt = v.dt ??= f * 2 ** (v.det / 1200) / sr; v.ph = fract(v.ph + dt); const s = sawBL(v.ph, dt); l += s * v.pl; r += s * v.pr; }
        if (k % 32 === 0) { const c = cutoff * brightness * (1 + movement * .5 * Math.sin(lfo + x * .7)) * (.5 + .5 * Math.min(1, x / (attack * 2))); lpL.set(c, .8); lpR.set(c, .8); }
        this.#emit(i0 + k, lpL(l) * e * gain, lpR(r) * e * gain, { bus, send });
      }
    }
  }
  /** Mono lead / synth: saw or square with vibrato, glide and a resonant filter sweep. */
  lead(t, n, dur, { vel = .6, wave = 'saw', cutoff = 3200, vibrato = 5, vibDepth = 8, glide = 0, from, attack = .01, release = .2, bus = 'music', pan = 0, send = .25, echo = .12 } = {}) {
    const sr = this.sr, f = mtof(n), f0 = from != null ? mtof(from) : f, i0 = Math.round(t * sr), len = Math.round((dur + release) * sr), [gl, gr] = pan2(pan), lp = biquad('lp', cutoff, 1.4, sr); let ph = 0;
    for (let k = 0; k < len; k++) { const x = k / sr, e = Math.min(1, x / attack) * (x > dur ? Math.max(0, 1 - (x - dur) / release) : 1) * (.8 + .2 * Math.exp(-x / .25)), gl_ = glide ? lerp(f0, f, clamp(x / glide)) : f;
      const vf = 1 + vibDepth / 1200 * Math.sin(TAU * vibrato * x) * clamp((x - .12) / .3), dt = gl_ * vf / sr; ph = fract(ph + dt); if (k % 24 === 0) lp.set(cutoff * (.5 + .5 * e), 1.4);
      const y = lp(wave === 'square' ? sqBL(ph, dt, .45) : sawBL(ph, dt)) * e * vel * .45; this.#emit(i0 + k, y * gl, y * gr, { bus, send, echo }); }
  }
  /** Karplus–Strong string with allpass fractional tuning (in tune to <1 cent). courses>1 = several slightly detuned strings (santur, 12-string). */
  pluck(t, n, dur = 2, { vel = .7, T60 = 2.2, bright = .5, courses = 1, spread = 2.5, strike = .13, pan = 0, bus = 'music', send = .25, echo = 0 } = {}) {
    const sr = this.sr, f0 = mtof(n), i0 = Math.round(t * sr), len = Math.round(Math.min(T60 * .9, dur + .6) * sr);
    for (let c = 0; c < courses; c++) {
      const f = f0 * 2 ** ((courses === 1 ? 0 : (c / (courses - 1) - .5) * 2 * spread) / 1200), P = sr / f, S = clamp(.32 - .28 * bright, .04, .32), Ni = Math.max(2, Math.floor(P - S - .15)), d = P - S - Ni, C = (1 - d) / (1 + d);
      const rho = .001 ** (P / (T60 * sr)), buf = new Float32Array(Ni), off = Math.max(1, Math.round(strike * P)), K = Math.max(3, Math.round(sr * (.0003 + .0009 * (1 - vel)))), ex = new Float32Array(len);
      for (let k = 0; k < K && k < len; k++) { const p = Math.sin(Math.PI * k / K) ** 2 * vel; ex[k] += p; if (k + off < len) ex[k + off] -= p; }
      for (let k = 0; k < 140 && k < len; k++) ex[k] += vel * .18 * (this.rnd() * 2 - 1) * Math.exp(-k / 32);
      let w = 0, z1 = 0, ax = 0, ay = 0; const [gl, gr] = pan2(pan + (courses === 1 ? 0 : (c / (courses - 1) - .5) * .7)), gain = .6 / Math.sqrt(courses);
      for (let k = 0; k < len; k++) { const z = buf[w], lp = (1 - S) * z + S * z1; z1 = z; const ap = C * lp + ax - C * ay; ax = lp; ay = ap; const y = ex[k] + rho * ap; buf[w] = y; if (++w === Ni) w = 0;
        const fade = k > len - 2400 ? (len - k) / 2400 : 1; this.#emit(i0 + k, y * gl * gain * fade, y * gr * gain * fade, { bus, send, echo }); }
    }
  }
  /** Keys: kind = 'ep' (FM electric piano) | 'bell' | 'marimba' | 'organ'. */
  keys(t, n, dur = 1, { kind = 'ep', vel = .6, pan = 0, bus = 'music', send = .3, echo = 0, decay } = {}) {
    const sr = this.sr, f = mtof(n), i0 = Math.round(t * sr), [gl, gr] = pan2(pan);
    const D = decay || { ep: 1.8, bell: 3, marimba: .35, organ: 99 }[kind], len = Math.round((dur + 1.2) * sr); let ph = 0, ph2 = 0;
    for (let k = 0; k < len; k++) {
      const x = k / sr, rel = x > dur ? Math.exp(-(x - dur) * (kind === 'organ' ? 14 : 5)) : 1; let y = 0;
      if (kind === 'ep') { ph += TAU * f * (1 + .0022 * Math.sin(TAU * .5 * x)) / sr; y = (Math.sin(ph + (1.3 * Math.exp(-x * 8) + .22) * Math.sin(ph)) + .12 * Math.sin(2 * ph) * Math.exp(-x * 4)) * Math.min(1, x / .004) * Math.exp(-x / D); }
      else if (kind === 'bell') { ph += TAU * f / sr; ph2 += TAU * f * 3.5 / sr; y = Math.sin(ph + 2 * Math.exp(-x * 5) * Math.sin(ph2)) * Math.min(1, x / .002) * Math.exp(-x / D); }
      else if (kind === 'marimba') { ph += TAU * f / sr; ph2 += TAU * f * 3.99 / sr; y = (Math.sin(ph) + .35 * Math.sin(ph2) * Math.exp(-x * 30)) * Math.min(1, x / .002) * Math.exp(-x / D); }
      else { ph += TAU * f / sr; y = (Math.sin(ph) + .6 * Math.sin(2 * ph) + .45 * Math.sin(3 * ph) + .25 * Math.sin(4 * ph) + .15 * Math.sin(6 * ph)) * .5 * Math.min(1, x / .012); }
      y *= rel * vel * .5; this.#emit(i0 + k, y * gl, y * gr, { bus, send, echo });
    }
  }
  /** Bowed-string ensemble (detuned saws, vibrato, bow noise, filter opens with dynamics). */
  strings(t, notes, dur, { vel = .55, attack = .25, release = .6, voices = 5, vibrato = 5.2, cutoff = 2600, bus = 'music', pan = 0, send = .35 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), len = Math.round((dur + release) * sr), ns = [].concat(notes).map(note), gain = vel * .28 / Math.sqrt(voices);
    for (const m of ns) {
      const f = mtof(m), V = Array.from({ length: voices }, (_, v) => ({ ph: this.rnd(), det: (v / Math.max(1, voices - 1) - .5) * 14 + this.g() * 1.5, vp: this.rnd() * TAU })), lp = biquad('lp', cutoff, .7, sr), hp = biquad('bp', 4200, 1.1, sr), [gl, gr] = pan2(pan + this.g() * .12);
      for (let k = 0; k < len; k++) {
        const x = k / sr, e = Math.min(1, x / attack) ** 1.3 * (x > dur ? Math.max(0, 1 - (x - dur) / release) : 1); if (e <= 0) continue; let s = 0;
        for (const v of V) { const vf = 1 + .0045 * Math.sin(TAU * vibrato * x + v.vp) * clamp((x - .15) / .4), dt = f * 2 ** (v.det / 1200) * vf / sr; v.ph = fract(v.ph + dt); s += sawBL(v.ph, dt); }
        if (k % 32 === 0) lp.set(cutoff * (.35 + .65 * e), .7);
        const y = (lp(s) + hp(this.rnd() * 2 - 1) * .03 * Math.exp(-x / .3)) * e * gain; this.#emit(i0 + k, y * gl, y * gr, { bus, send });
      }
    }
  }
  /** Brass-like stab/swell. */
  brass(t, notes, dur, { vel = .6, attack = .06, release = .25, bus = 'music', pan = 0, send = .25 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), len = Math.round((dur + release) * sr), [gl, gr] = pan2(pan);
    for (const m of [].concat(notes).map(note)) { const f = mtof(m), ph = [this.rnd(), this.rnd(), this.rnd()], det = [-6, 0, 7], lp = biquad('lp', 500, 1.2, sr);
      for (let k = 0; k < len; k++) { const x = k / sr, e = Math.min(1, x / attack) * (x > dur ? Math.max(0, 1 - (x - dur) / release) : 1); if (e <= 0) continue; let s = 0;
        for (let v = 0; v < 3; v++) { const dt = f * 2 ** (det[v] / 1200) * (1 + .003 * Math.sin(TAU * 5.4 * x)) / sr; ph[v] = fract(ph[v] + dt); s += sawBL(ph[v], dt); }
        if (k % 24 === 0) lp.set(400 + 4200 * e * e, 1.2); const y = lp(s) * e * vel * .22; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); } }
  }
  /** Breathy flute / ney: sine partials + band-passed noise at the pitch, slow attack, delayed vibrato. */
  flute(t, n, dur, { vel = .6, breath = .7, vibrato = 5.3, bus = 'music', pan = 0, send = .35, attack = .12 } = {}) {
    const sr = this.sr, f = mtof(n), i0 = Math.round(t * sr), len = Math.round((dur + .4) * sr), [gl, gr] = pan2(pan), bp = biquad('bp', f * 1.01, 6, sr), hp = biquad('hp', 5000, .7, sr); let ph = 0;
    for (let k = 0; k < len; k++) { const x = k / sr, e = Math.min(1, x / attack) ** 1.6 * (x > dur ? Math.max(0, 1 - (x - dur) / .4) : 1); ph += f * (1 + .011 * clamp((x - .22) / .4) * Math.sin(TAU * vibrato * x)) / sr; ph -= Math.floor(ph);
      const p = TAU * ph, tone = Math.sin(p) + .28 * Math.sin(2 * p + .4) + .12 * Math.sin(3 * p + 1.1), wn = this.rnd() * 2 - 1, air = (bp(wn) * 3 * Math.sqrt(440 / f) + hp(wn) * .1) * breath * (.5 + .5 * (1 - e));
      const y = (tone * e * .55 + air * Math.min(1, x / .05) * (x > dur ? e : 1) * .35) * vel; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  /** Vowel choir pad ('a','e','i','o','u') via formant filters on a saw stack. */
  choir(t, notes, dur, { vel = .5, vowel = 'a', attack = .5, release = 1, bus = 'music', pan = 0, send = .5 } = {}) {
    const F = { a: [800, 1150, 2800], e: [480, 1800, 2600], i: [320, 2250, 3000], o: [520, 880, 2500], u: [340, 780, 2400] }[vowel] || [800, 1150, 2800], sr = this.sr, i0 = Math.round(t * sr), len = Math.round((dur + release) * sr), [gl, gr] = pan2(pan);
    for (const m of [].concat(notes).map(note)) { const f = mtof(m), ph = [this.rnd(), this.rnd(), this.rnd()], bq = F.map((c, q) => biquad('bp', c, [5, 7, 8][q], sr));
      for (let k = 0; k < len; k++) { const x = k / sr, e = Math.min(1, x / attack) ** 1.4 * (x > dur ? Math.max(0, 1 - (x - dur) / release) : 1); if (e <= 0) continue; let s = 0;
        for (let v = 0; v < 3; v++) { const dt = f * (1 + (v - 1) * .004) * (1 + .004 * Math.sin(TAU * 5 * x + v)) / sr; ph[v] = fract(ph[v] + dt); s += sawBL(ph[v], dt); }
        const y = (bq[0](s) + .7 * bq[1](s) + .3 * bq[2](s)) * e * vel * .3; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); } }
  }
  /** Arpeggio helper: plays `chordNotes` cyclically every `step` seconds using fn(time, midi, index). */
  arp(t0, chordNotes, count, step, fn, { order = 'up' } = {}) {
    const ns = chordNotes.map(note); const seq = order === 'down' ? [...ns].reverse() : order === 'updown' ? [...ns, ...ns.slice(1, -1).reverse()] : ns;
    for (let i = 0; i < count; i++) fn(t0 + i * step, seq[i % seq.length], i);
  }

  /* ─────────── sound effects ─────────── */
  whoosh(t, dur = .8, { vel = .7, from = 300, to = 3200, pan0 = -.6, pan1 = .6, bus = 'sfx', send = .2 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(dur * sr), bp = biquad('bp', from, 1.2, sr);
    for (let k = 0; k < n; k++) { const u = k / n; if (k % 32 === 0) bp.set(from * (to / from) ** u, 1.2); const pa = (clamp(lerp(pan0, pan1, u), -1, 1) + 1) * Math.PI / 4, y = bp(this.rnd() * 2 - 1) * Math.sin(Math.PI * u) ** 2 * vel * 1.7; this.#emit(i0 + k, y * Math.cos(pa), y * Math.sin(pa), { bus, send }); }
  }
  riser(t, dur = 2, { vel = .6, from = 250, to = 5000, bus = 'sfx', send = .3 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(dur * sr), bp = biquad('bp', from, 1.6, sr); let ph = 0, ph2 = 0;
    for (let k = 0; k < n; k++) { const u = k / n; if (k % 32 === 0) bp.set(from * (to / from) ** u, 1.6); ph += TAU * (200 * 4 ** u) / sr; ph2 += TAU * (203 * 4 ** u) / sr; const y = (bp(this.rnd() * 2 - 1) * 1.2 + (Math.sin(ph) + Math.sin(ph2)) * .07) * u * u * vel * .8; this.#emit(i0 + k, y, y, { bus, send }); }
  }
  downlifter(t, dur = 1.2, { vel = .5, from = 6000, to = 200, bus = 'sfx', send = .3 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(dur * sr), bp = biquad('bp', from, 1.4, sr);
    for (let k = 0; k < n; k++) { const u = k / n; if (k % 32 === 0) bp.set(from * (to / from) ** u, 1.4); const y = bp(this.rnd() * 2 - 1) * (1 - u) ** 2 * vel * 1.3; this.#emit(i0 + k, y, y, { bus, send }); }
  }
  /** Cinematic impact: sub drop + noise burst + long tail. size 0.5–2 */
  impact(t, { vel = 1, size = 1, bus = 'sfx', send = .5 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), n = Math.round((1.8 * size + .2) * sr), lp = biquad('lp', 2400, .7, sr); let ph = 0;
    for (let k = 0; k < n; k++) { const x = k / sr; ph += TAU * (34 + 90 * Math.exp(-x / .06)) / sr; const y = softclip(1.5 * Math.sin(ph) * Math.exp(-x / (.55 * size)) + lp(this.rnd() * 2 - 1) * Math.exp(-x / (.09 * size)) * .9) * vel * .8; this.#emit(i0 + k, y, y, { bus, send }); }
  }
  hit(t, { vel = 1, bus = 'sfx', send = .3 } = {}) { this.impact(t, { vel: vel * .8, size: .35, bus, send }); }
  click(t, { vel = 1, bus = 'sfx', pan = 0, send = .05 } = {}) {
    const sr = this.sr, [gl, gr] = pan2(pan); for (const [dt, v, fc] of [[0, 1, 3000], [.07, .5, 4200]]) { const i0 = Math.round((t + dt) * sr), bp = biquad('bp', fc, 1.3, sr); for (let k = 0; k < sr * .03; k++) { const x = k / sr, y = (bp(this.rnd() * 2 - 1) * 2.2 * Math.exp(-x * 250) + Math.sin(TAU * 1500 * x) * Math.exp(-x * 320) * .5) * v * vel * .6; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); } }
  }
  pop(t, { vel = .6, f0 = 900, f1 = 260, bus = 'sfx', pan = 0, send = .12 } = {}) {
    const sr = this.sr, i0 = Math.round(t * sr), [gl, gr] = pan2(pan); let ph = 0; for (let k = 0; k < sr * .14; k++) { const x = k / sr; ph += TAU * (f1 + (f0 - f1) * Math.exp(-x * 40)) / sr; const y = Math.sin(ph) * Math.exp(-x * 28) * Math.min(1, x / .002) * vel; this.#emit(i0 + k, y * gl, y * gr, { bus, send }); }
  }
  tick(t, { vel = .3, bus = 'sfx', pan = 0 } = {}) { const sr = this.sr, i0 = Math.round(t * sr), bp = biquad('bp', 5200, 2, sr), [gl, gr] = pan2(pan); for (let k = 0; k < sr * .012; k++) { const y = bp(this.rnd() * 2 - 1) * Math.exp(-k / sr * 500) * vel * 1.5; this.#emit(i0 + k, y * gl, y * gr, { bus }); } }
  /** keyboard keystroke; call repeatedly for typing */
  type(t, { vel = .5, bus = 'sfx', pan = 0 } = {}) { const sr = this.sr, i0 = Math.round(t * sr), bp = biquad('bp', 1900 + this.rnd() * 900, 2.2, sr), [gl, gr] = pan2(pan + this.g() * .05); for (let k = 0; k < sr * .04; k++) { const x = k / sr, y = (bp(this.rnd() * 2 - 1) * Math.exp(-x * 190) + Math.sin(TAU * 240 * x) * Math.exp(-x * 90) * .4) * vel * 1.4; this.#emit(i0 + k, y * gl, y * gr, { bus }); } }
  swipe(t, dur = .25, opts = {}) { this.whoosh(t, dur, { from: 900, to: 7000, vel: .35, ...opts }); }
  chime(t, notes = ['E6', 'G6', 'B6', 'E7'], { vel = .5, gap = .065, bus = 'sfx', send = .5 } = {}) { notes.forEach((n, i) => this.keys(t + i * gap, n, .2, { kind: 'bell', vel: vel * (1 - i * .1), pan: -.3 + i * .2, decay: 2.6, bus, send })); }
  sparkle(t, dur = 1, { vel = .5, seed = 1, bus = 'sfx', send = .6 } = {}) { const r = this.#mkRng(this.seed + seed * 977), P = [96, 98, 100, 103, 105, 108]; for (let k = 0; k < 14; k++) this.keys(t + r() * dur, P[Math.floor(r() * P.length)], .1, { kind: 'bell', vel: vel * (.12 + .12 * r()), pan: r() * 1.6 - .8, decay: .5, bus, send }); this.whoosh(t, dur, { from: 2500, to: 9000, vel: vel * .3, pan0: .4, pan1: -.4, bus, send: .3 }); }
  glitch(t, dur = .3, { vel = .5, bus = 'sfx' } = {}) { const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(dur * sr), r = this.#mkRng(this.seed + Math.round(t * 1000)); let hold = 0, v = 0, cnt = 0; for (let k = 0; k < n; k++) { if (cnt-- <= 0) { cnt = 8 + Math.floor(r() * 220); hold = r() * 2 - 1; } v = hold * (r() < .3 ? 1 : .35); const y = (Math.round(v * 6) / 6) * Math.sin(Math.PI * k / n) * vel * .6; this.#emit(i0 + k, y, y, { bus }); } }
  zap(t, { vel = .5, f0 = 3200, f1 = 300, dur = .25, bus = 'sfx', send = .2 } = {}) { const sr = this.sr, i0 = Math.round(t * sr), n = Math.round(dur * sr); let ph = 0; for (let k = 0; k < n; k++) { const u = k / n; ph += TAU * (f1 + (f0 - f1) * (1 - u) ** 3) / sr; const y = sqBL(fract(ph / TAU), .02) * (1 - u) ** 2 * vel * .3; this.#emit(i0 + k, y, y, { bus, send }); } }
  success(t, opts = {}) { [72, 76, 79, 84].forEach((m, i) => this.keys(t + i * .085, m, .25, { kind: 'bell', vel: .5, decay: 2, bus: 'sfx', send: .45, ...opts })); }
  error(t, opts = {}) { [60, 55].forEach((m, i) => this.keys(t + i * .13, m, .2, { kind: 'marimba', vel: .7, decay: .5, bus: 'sfx', send: .2, ...opts })); }
  heartbeat(t, { vel = .9, bus = 'sfx' } = {}) { this.sub(t, 'A1', .25, { vel, bus, drive: 1 }); this.sub(t + .28, 'A1', .22, { vel: vel * .7, bus, drive: 1 }); }
  shutter(t, { vel = .7, bus = 'sfx', pan = 0 } = {}) { this.click(t, { vel, bus, pan }); this.click(t + .045, { vel: vel * .8, bus, pan }); }
  /** Low rumble / drone bed */
  drone(t, dur, n = 'A1', { vel = .4, bus = 'music', send = .4, cutoff = 220, movement = .6 } = {}) { this.pad(t, [n, note(n) + 7], dur, { vel, attack: dur * .4, release: dur * .4, cutoff, movement, bus, send, voices: 4, detune: 12 }); }
  /** gibberish "someone talking" texture (formant syllables) — placeholder voice, clearly not words */
  babble(t0, t1, { f0 = 115, style = 'dull', pan = 0, gain = 1, seed = 1, bus = 'voice', send = .1 } = {}) {
    const VOW = { a: [800, 1150, 2800], e: [480, 1800, 2600], i: [320, 2250, 3000], o: [520, 880, 2500], u: [340, 780, 2400] }, r = this.#mkRng(this.seed + seed * 31), sr = this.sr, syl = []; let tt = t0 + .02;
    while (tt < t1 - .12) { const n = 2 + Math.floor(r() * 3); for (let s = 0; s < n && tt < t1 - .1; s++) { const d = .1 + r() * .1; syl.push([tt, d, 'aeiou'[Math.floor(r() * 5)], 'aeiou'[Math.floor(r() * 5)], (r() - .5) * .14]); tt += d + .02; } tt += .07 + r() * .1; }
    const F = [biquad('bp', 500, 5, sr), biquad('bp', 1500, 7, sr), biquad('bp', 2500, 8, sr)], lp = biquad('lp', style === 'dull' ? 1300 : 3600, .7, sr), [gl, gr] = pan2(pan); let ph = 0, si = 0;
    for (let i = Math.floor(t0 * sr); i < Math.floor(t1 * sr) && i < this.N; i++) { const T = i / sr; while (si < syl.length - 1 && T > syl[si][0] + syl[si][1] + .03) si++; const [st, sd, v1, v2, inf] = syl[si] || [0, 0, 'a', 'a', 0], u = clamp((T - st) / sd);
      const env = T < st ? 0 : T > st + sd ? Math.max(0, 1 - (T - st - sd) / .03) : Math.min(1, (T - st) / .025) * (1 - .3 * u), pu = (T - t0) / (t1 - t0), ff = f0 * (1 + .08 * Math.sin(Math.PI * pu) - .07 * pu + inf * (1 - u) + .012 * Math.sin(TAU * 5.3 * T)); ph = fract(ph + ff / sr);
      let src = 0; const nh = Math.min(30, Math.floor(4200 / ff)); for (let h = 1; h <= nh; h++) src += Math.sin(TAU * ph * h) / h;
      if ((i & 31) === 0) { const A = VOW[v1], B = VOW[v2], w = style === 'dull' ? Math.sin(Math.PI * u) : u; for (let q = 0; q < 3; q++) F[q].set(lerp(A[q], B[q], w), [5, 7, 8][q]); }
      const y = lp(F[0](src) + F[1](src) * .7 + F[2](src) * .3) * env * gain * .5; this.#emit(i, y * gl, y * gr, { bus, send }); }
  }

  /* ─────────── mixdown ─────────── */
  #fdn(inL, inR, rt60, damp) {
    const sr = this.sr, N = this.N, lens = [2203, 2477, 2819, 3079, 3391, 3673, 3967, 4273].map(l => Math.round(l * sr / 48000)), M = 8, pre = Math.round(.024 * sr);
    const lines = lens.map(l => new Float32Array(l)), pos = new Int32Array(M), dmp = new Float32Array(M), g = lens.map(l => .001 ** (l / (sr * rt60)));
    const ap = [[347, .7], [113, .7], [37, .7]].map(([l, k]) => ({ b: new Float32Array(Math.round(l * sr / 48000)), p: 0, k })), diff = x => { for (const a of ap) { const d = a.b[a.p], y = -a.k * x + d; a.b[a.p] = x + a.k * y; a.p = (a.p + 1) % a.b.length; x = y; } return x; };
    const oL = new Float32Array(N), oR = new Float32Array(N), o = new Float32Array(M), sL = [1, -1, 1, -1, 1, -1, 1, -1], sR = [1, 1, -1, -1, 1, 1, -1, -1];
    for (let n = 0; n < N; n++) {
      const x = n >= pre ? diff((inL[n - pre] + inR[n - pre]) * .5) : 0; let sum = 0;
      for (let i = 0; i < M; i++) { const v = lines[i][pos[i]]; dmp[i] = (1 - damp) * v + damp * dmp[i]; o[i] = dmp[i] * g[i]; sum += o[i]; }
      let l = 0, r = 0; const h = 2 * sum / M;
      for (let i = 0; i < M; i++) { l += o[i] * sL[i]; r += o[i] * sR[i]; lines[i][pos[i]] = o[i] - h + x * (i % 2 ? .9 : 1); if (++pos[i] === lens[i]) pos[i] = 0; }
      oL[n] = l * .35; oR[n] = r * .35;
    } return [oL, oR];
  }
  #pingpong(inL, inR, time, fb, damp) {
    const sr = this.sr, N = this.N, d = Math.max(1, Math.round(time * sr)), bl = new Float32Array(d), br = new Float32Array(d), oL = new Float32Array(N), oR = new Float32Array(N), lpL = biquad('lp', 5200 * (1 - damp * .5), .7, sr), lpR = biquad('lp', 5200 * (1 - damp * .5), .7, sr); let p = 0;
    for (let n = 0; n < N; n++) { const l = bl[p], r = br[p]; oL[n] = l; oR[n] = r; bl[p] = lpL(inL[n] + r * fb); br[p] = lpR(inR[n] + l * fb); if (++p === d) p = 0; } return [oL, oR];
  }
  /** Render the mix. cfg: reverb {rt60, damp, mix}, delay {time, feedback, damp, mix}, gains {bus: dB}, lufs, ceiling (dBFS), glue, fadeOut. Returns [L, R] Float32Arrays. */
  mixdown(o = {}) {
    const sr = this.sr, N = this.N, gains = { music: 0, drums: 0, sfx: 0, voice: 0, ...(o.gains || {}) }, rv = { rt60: 2.2, damp: .35, mix: .28, ...(o.reverb || {}) }, dl = { time: this.B * .75, feedback: .38, damp: .4, mix: .18, ...(o.delay || {}) };
    // ducking gain curves
    const duckGain = {};
    for (const d of this.cfg.duck || []) { const g = duckGain[d.name] ||= new Float32Array(N).fill(1); for (const t of d.times) { const i0 = Math.round(t * sr), a = Math.round(d.attack * sr), r = Math.round(d.release * 5 * sr); for (let k = 0; k < a + r && i0 + k < N; k++) { const e = k < a ? k / a : Math.exp(-(k - a) / (d.release * sr)); const gg = 1 - d.depth * e; if (i0 + k >= 0 && gg < g[i0 + k]) g[i0 + k] = gg; } } }
    const dry = [new Float32Array(N), new Float32Array(N)], names = Object.keys(this.buses).filter(n => n !== 'verb' && n !== 'delay');
    for (const nm of names) { const b = this.buses[nm], gn = db(gains[nm] ?? 0), dg = duckGain[nm]; for (let c = 0; c < 2; c++) { const src = b[c], dst = dry[c]; if (dg) for (let i = 0; i < N; i++) dst[i] += src[i] * gn * dg[i]; else for (let i = 0; i < N; i++) dst[i] += src[i] * gn; } }
    const master = [new Float32Array(N), new Float32Array(N)];
    const vSend = this.buses.verb, dSend = this.buses.delay; let hasV = false, hasD = false; for (let i = 0; i < N; i += 7) if (vSend[0][i] || vSend[1][i]) { hasV = true; break; } for (let i = 0; i < N; i += 7) if (dSend[0][i] || dSend[1][i]) { hasD = true; break; }
    const wetV = hasV ? this.#fdn(vSend[0], vSend[1], rv.rt60, rv.damp) : null, wetD = hasD ? this.#pingpong(dSend[0], dSend[1], dl.time, dl.feedback, dl.damp) : null;
    for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) master[c][i] = dry[c][i] + (wetV ? wetV[c][i] * rv.mix * 3 : 0) + (wetD ? wetD[c][i] * dl.mix * 2 : 0);
    return this.#master(master, o);
  }
  #master(m, o) {
    const sr = this.sr, N = this.N, lufs = o.lufs ?? -14, ceiling = o.ceiling ?? -1.5;   // -1.5 dBFS sample peak ≈ -1 dBTP after inter-sample overshoot
    for (let c = 0; c < 2; c++) { const hp = biquad('hp', 24, .7, sr), air = o.air === false ? null : biquad('hshelf', 9000, .7, sr, o.air ?? 1.5); for (let i = 0; i < N; i++) { let x = hp(m[c][i]); if (air) x = air(x); m[c][i] = x; } }
    if (o.glue !== false) { // gentle stereo-linked compressor
      let env = 0; const aA = Math.exp(-1 / (.02 * sr)), aR = Math.exp(-1 / (.25 * sr)), thr = db(o.glueThreshold ?? -20), ratio = o.glueRatio ?? 1.8;
      for (let i = 0; i < N; i++) { const p = (m[0][i] ** 2 + m[1][i] ** 2) / 2; env = p > env ? aA * env + (1 - aA) * p : aR * env + (1 - aR) * p; const lv = Math.sqrt(env), gr = lv > thr ? (thr / lv) ** (1 - 1 / ratio) : 1; m[0][i] *= gr; m[1][i] *= gr; }
    }
    // fades
    const fin = Math.round((o.fadeIn ?? .01) * sr), fout = Math.round((o.fadeOut ?? .05) * sr), end = Math.round((this.dur + (o.tailKeep ?? 1.2)) * sr);
    for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) { let g = 1; if (i < fin) g = i / fin; const dEnd = end - i; if (dEnd < fout) g *= Math.max(0, dEnd / fout); m[c][i] *= g; }
    // loudness → target, then limiter, then a second loudness correction
    const gain1 = db(lufs - integratedLoudness(m, sr)); for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) m[c][i] *= gain1;
    limiter(m, sr, db(ceiling));
    const after = integratedLoudness(m, sr); if (Math.abs(after - lufs) > .4) { const g2 = db(lufs - after); for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) m[c][i] *= g2; limiter(m, sr, db(ceiling)); }
    return m;
  }
  /** Mix and write a WAV file (16 or 24 bit). Trims to duration + tailKeep. Returns {file, lufs, peakDb}. */
  write(file, o = {}) {
    const m = this.mixdown(o), sr = this.sr, n = Math.min(this.N, Math.round((this.dur + (o.tailKeep ?? 1.2)) * sr)), bits = o.bits || 16, bpS = bits / 8, buf = Buffer.alloc(44 + n * 2 * bpS);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2 * bpS, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2 * bpS, 28); buf.writeUInt16LE(2 * bpS, 32); buf.writeUInt16LE(bits, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2 * bpS, 40);
    const rnd = this.#mkRng(12345); let pk = 0;
    for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) { const x = clamp(m[c][i], -1, 1); pk = Math.max(pk, Math.abs(x)); const off = 44 + (i * 2 + c) * bpS;
      if (bits === 24) buf.writeIntLE(Math.round(x * 8388607), off, 3); else buf.writeInt16LE(clamp(Math.round(x * 32767 + (rnd() - rnd())), -32768, 32767), off); }
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true }); fs.writeFileSync(file, buf);
    const res = { file, seconds: n / sr, lufs: +integratedLoudness(m.map(a => a.subarray(0, n)), sr).toFixed(1), peakDb: +(20 * Math.log10(pk || 1e-9)).toFixed(2) };
    if (!o.quiet) console.log(`audio: ${file} — ${res.seconds.toFixed(1)} s, ${res.lufs} LUFS, peak ${res.peakDb} dBFS`); return res;
  }
  /** Write each bus as its own WAV (dry, no master chain) into a folder. */
  stems(dir) { fs.mkdirSync(dir, { recursive: true }); for (const [nm, b] of Object.entries(this.buses)) if (nm !== 'verb' && nm !== 'delay') wavRaw(`${dir}/${nm}.wav`, b, this.sr); }
}

/* ═══════════════ metering / limiting ═══════════════ */
/** ITU-R BS.1770-4 integrated loudness (LUFS) with gating; 48 kHz K-weighting coefficients (resampled biquads for other rates). */
export function integratedLoudness(ch, sr) {
  const k = () => { const s1 = biquad('hshelf', 1681.97, .7071, sr, 4.0), s2 = biquad('hp', 38.13, .5003, sr); return x => s2(s1(x)); };
  const f = ch.map(c => { const F = k(), o = new Float32Array(c.length); for (let i = 0; i < c.length; i++) o[i] = F(c[i]); return o; });
  const blk = Math.round(.4 * sr), hop = Math.round(.1 * sr), n = f[0].length, ms = [];
  for (let s = 0; s + blk <= n; s += hop) { let sum = 0; for (const c of f) { let a = 0; for (let i = s; i < s + blk; i++) a += c[i] * c[i]; sum += a / blk; } ms.push(sum); }
  const L = z => -.691 + 10 * Math.log10(z + 1e-12), abs = ms.filter(z => L(z) > -70); if (!abs.length) return -70;
  const rel = L(abs.reduce((a, b) => a + b, 0) / abs.length) - 10, g = abs.filter(z => L(z) > rel); return g.length ? L(g.reduce((a, b) => a + b, 0) / g.length) : -70;
}
/** Look-ahead peak limiter (in place). ceiling is linear. Sliding-minimum gain over ±look, box-smoothed, exponential release. */
function limiter(m, sr, ceiling, look = .004, rel = .1) {
  const N = m[0].length, la = Math.max(2, Math.round(look * sr)), need = new Float32Array(N);
  for (let i = 0; i < N; i++) { const p = Math.max(Math.abs(m[0][i]), Math.abs(m[1][i])); need[i] = p > ceiling ? ceiling / p : 1; }
  // sliding-window minimum over [i-la, i+la] with a monotonic deque (O(N))
  const mn = new Float32Array(N), dq = new Int32Array(N); let h = 0, t = 0, j = 0;
  for (let i = 0; i < N; i++) {
    const hi = Math.min(N - 1, i + la); while (j <= hi) { while (t > h && need[dq[t - 1]] >= need[j]) t--; dq[t++] = j; j++; }
    while (dq[h] < i - la) h++; mn[i] = need[dq[h]];
  }
  // box smoothing so the gain ramps down before the peak (window ±la/2 keeps gain(peak) <= need(peak))
  const w = Math.max(1, la >> 1), pre = new Float64Array(N + 1); for (let i = 0; i < N; i++) pre[i + 1] = pre[i] + mn[i];
  const relCoef = 1 - Math.exp(-1 / (rel * sr)); let g = 1;
  for (let i = 0; i < N; i++) {
    const lo = Math.max(0, i - w), hi = Math.min(N, i + w + 1), target = (pre[hi] - pre[lo]) / (hi - lo);
    g = Math.min(target, g + (1 - g) * relCoef); m[0][i] *= g; m[1][i] *= g;
  }
  for (let i = 0; i < N; i++) { const p = Math.max(Math.abs(m[0][i]), Math.abs(m[1][i])); if (p > ceiling) { const k = ceiling / p; m[0][i] *= k; m[1][i] *= k; } }   // safety net
}
function wavRaw(file, b, sr) { const n = b[0].length, buf = Buffer.alloc(44 + n * 4); buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  let pk = 1e-9; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(b[0][i]), Math.abs(b[1][i])); const k = Math.min(1, .89 / pk); for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) buf.writeInt16LE(Math.round(clamp(b[c][i] * k, -1, 1) * 32767), 44 + (i * 2 + c) * 2); fs.writeFileSync(file, buf); }

/* ═══════════════ cues: one timeline for picture and sound ═══════════════ */
/** Read <script id="cues" type="application/json">…</script> from the video page (or a .json file). */
export function readCues(file = 'video.html') {
  const txt = fs.readFileSync(file, 'utf8'); if (file.endsWith('.json')) return JSON.parse(txt);
  const m = /<script[^>]*id=["']cues["'][^>]*>([\s\S]*?)<\/script>/.exec(txt); if (!m) throw new Error(`no <script id="cues" type="application/json"> in ${file}`);
  return JSON.parse(m[1]);
}
/** Resolve a cue reference: a number (seconds), or a name in cues.t (e.g. "logoHit"), optionally "+0.25" offset: 'logoHit+0.25'. */
export function cueTime(cues, ref) {
  if (typeof ref === 'number') return ref; const m = /^([A-Za-z_][\w.]*)\s*([+-]\s*[\d.]+)?$/.exec(String(ref).trim()); if (!m) throw new Error(`bad cue "${ref}"`);
  const v = m[1].split('.').reduce((o, k) => o?.[k], cues.t || cues); if (typeof v !== 'number') throw new Error(`unknown cue "${m[1]}"`); return v + (m[2] ? parseFloat(m[2].replace(/\s/g, '')) : 0);
}
