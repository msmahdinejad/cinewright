// audio.mjs — the soundtrack, synthesised from math (no samples). Run: node audio.mjs → audio.wav
// Timing comes from the SAME <script id="cues"> block the picture uses, so sound and image cannot drift apart.
import { Song, readCues, chord, progression, note } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 7 }), B = s.B;                 // B = seconds per beat (0.5 s at 120 BPM)
const bar = n => n * 4 * B;

/* ── harmony: A minor, one chord per bar (Am · F · C · G, then home) ── */
const prog = progression('A3', 'minor', 'i VI III VII i VI');
prog.forEach((c, i) => s.pad(bar(i), c, 4 * B + .4, { vel: i < 1 ? .3 : .42, attack: .5, release: 1, cutoff: 1500 + 250 * i, send: .35 }));
s.drone(0, T.cards + .2, 'A1', { vel: .2 });                               // low bed under the hook

/* ── hook: swell into the title hit ── */
s.riser(0, T.hit, { vel: .3, from: 500, to: 6500 });
s.impact(T.hit, { size: .8, vel: .75 });
s.whoosh(T.hit - .05, .5, { vel: .35, from: 1200, to: 200, pan0: .5, pan1: -.5 });
for (let i = 0; i < 3; i++) s.keys(T.hit + .12 + i * .16, ['E5', 'A5', 'C6'][i], .2, { kind: 'bell', vel: .33, pan: -.3 + i * .3 });

/* ── cards: the beat arrives (kick + bass + hats), riser leads in ── */
s.riser(T.cards - 1.5, 1.5, { vel: .45, from: 300, to: 5000 });
s.impact(T.cards, { size: .6, vel: .8 });
const grooveEnd = T.logo;
for (let t = T.cards; t < grooveEnd - .01; t += B) {
  const n = Math.round((t - T.cards) / B);
  s.kick(t, { vel: 1.05 });
  if (n % 2 === 1) { s.snare(t, { vel: .8 }); s.clap(t, { vel: .55 }); }
  s.hat(t + B / 2, { vel: .5 + (n % 4 === 3 ? .15 : 0), open: n % 4 === 3 });
}
s.duck('music', Array.from({ length: Math.ceil((grooveEnd - T.cards) / B) }, (_, i) => T.cards + i * B), { depth: .45, release: .2 });
const roots = prog.map(c => c[0] - 12);                                     // bass follows the chord roots
for (let t = T.cards; t < grooveEnd - .01; t += B / 2) { const bi = Math.min(prog.length - 1, Math.floor(t / (4 * B))); if (Math.round((t - T.cards) / (B / 2)) % 4 !== 1) s.bass(t, roots[bi], B * .45, { vel: .8, cutoff: 650 }); }
// arpeggio: 16ths over the current chord, gets brighter in the chart section
for (let t = T.cards; t < grooveEnd - .01; t += B / 4) { const bi = Math.min(prog.length - 1, Math.floor(t / (4 * B))), k = Math.round((t - T.cards) / (B / 4));
  s.keys(t, prog[bi][k % 3] + 12 * (1 + (t > T.chart ? 1 : 0)), .12, { kind: 'marimba', vel: .22 + .12 * ((k % 4) === 0), pan: Math.sin(k) * .5, echo: .25, send: .2 }); }
// card pops and whooshes on the scene changes
for (let i = 0; i < 3; i++) { s.pop(T.cards + .08 + i * .5 * .5 + .0, { vel: .4, f0: 800 + i * 160, pan: -.4 + i * .4 }); }
s.whoosh(T.cards - .3, .6, { vel: .5 }); s.whoosh(T.chart - .3, .6, { vel: .5, from: 400, to: 4200 });
s.impact(T.chart, { size: .6, vel: .8 });
s.pattern(T.chart + .6, 'x.x.x.x.x.x.x.x.', (t, v) => s.tick(t, { vel: .18 * v }), { unit: B / 4 });
s.sub(T.chart, 'A1', B * 1.5, { vel: .7 });

/* ── logo: everything drops out for a beat, then the big chord and shimmer ── */
s.riser(T.logo - 1.0, 1.0, { vel: .5, from: 400, to: 7000 });
for (let i = 0; i < 4; i++) s.tom(T.logo - .5 + i * B / 4, { vel: .5 + i * .12, f: 190 - i * 24, pan: -.4 + i * .27 });
s.impact(T.logo, { size: 1.5, vel: 1 });
s.kick(T.logo, { vel: 1 });
const finale = chord('A3', 'min', 0).concat([note('E5'), note('C6')]);
s.pad(T.logo, finale, dur - T.logo, { vel: .6, attack: .05, release: 2, cutoff: 3200, send: .5 });
s.strings(T.logo, chord('A3', 'min'), dur - T.logo, { vel: .4, attack: .08, release: 2 });
s.chime(T.logo + .05, ['A5', 'C6', 'E6', 'A6'], { vel: .55 });
s.sparkle(T.logo + .2, 2, { vel: .55 });
s.sub(T.logo, 'A1', 2, { vel: .9 });

s.write('audio.wav', { lufs: -14, reverb: { rt60: 2.4, mix: .28 }, fadeOut: .3 });
