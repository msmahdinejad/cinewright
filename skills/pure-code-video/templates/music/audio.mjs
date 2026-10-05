// audio.mjs — a 128 BPM demo track (stems + master) and its analysis. Replace the composition with your own, or drop a real song in as audio.wav
// and skip this file: the visuals only need envelopes.json, made by:  node tools/analyze-audio.mjs audio.wav
import { Song, readCues, chord, progression } from './lib/synth.mjs';
import { spawnSync } from 'node:child_process';

const C = readCues('video.html'), dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 5 }), B = s.B, bar = 4 * B;
const prog = progression('F3', 'minor', 'i VI III VII i VI III VII');
const bars = Math.floor(dur / bar);

prog.slice(0, bars).forEach((c, i) => s.pad(i * bar, c, bar + .3, { vel: .34, attack: .3, release: .8, cutoff: 1400 + 300 * i, send: .35 }));
for (let b = 0; b < bars; b++) {
  const t0 = b * bar, full = b >= 2, chorus = b >= 4 && b < 7, breakdown = b === 6;
  for (let k = 0; k < 4; k++) {
    const t = t0 + k * B;
    if (full && !breakdown) s.kick(t, { vel: 1.05 });
    if (chorus && k % 2 === 1 && !breakdown) { s.snare(t, { vel: .8 }); s.clap(t, { vel: .6 }); }
    s.hat(t + B / 2, { vel: b < 2 ? .25 : .5, open: k === 3 && full });
    if (full) s.hat(t, { vel: .18 });
  }
  if (full && !breakdown) for (let k = 0; k < 8; k++) if (k % 4 !== 1) s.bass(t0 + k * B / 2, prog[b][0] - 12, B * .42, { vel: .8, cutoff: 800 });
  if (chorus) s.arp(t0, chord(prog[b][0] + 12, 'min7'), 16, B / 4, (t, m, i) => s.keys(t, m + (i % 8 > 3 ? 12 : 0), .12, { kind: 'bell', vel: .2, pan: Math.sin(i) * .6, echo: .3, send: .25, decay: .8 }));
  if (b === 5) s.riser(t0 + bar - 2 * B, 2 * B, { vel: .5 });
}
s.duck('music', Array.from({ length: bars * 4 }, (_, i) => i * B).filter(t => (t >= 2 * bar && t < 6 * bar) || t >= 7 * bar), { depth: .5 });
s.impact(7 * bar, { size: 1.3, vel: .9 }); s.impact(0, { size: .5, vel: .6 });
s.write('audio.wav', { lufs: -13, reverb: { rt60: 2, mix: .25 }, fadeOut: .4 });
s.stems('stems');
const r = spawnSync(process.execPath, ['tools/analyze-audio.mjs', 'audio.wav', '--out', 'envelopes.json'], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
