// audio.mjs — electronic build for the raymarched scene. All timing comes from the cues in video.html.
import { Song, readCues, chord, progression, note } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 3 }), B = s.B, bar = 4 * B;

const prog = progression('E3', 'minor', 'i VI III VII i VI');
prog.forEach((c, i) => s.pad(i * bar, c, bar + .5, { vel: i < 2 ? .3 : .42, attack: .6, release: 1.2, cutoff: 1300 + 350 * i, movement: .7, send: .4 }));
s.drone(0, dur, 'E1', { vel: .25, cutoff: 160 });

/* approach: filtered pulse that opens up, riser into the unfold */
for (let t = 0; t < T.unfold; t += B / 2) s.bass(t, prog[Math.min(prog.length - 1, Math.floor(t / bar))][0] - 12, B * .4, { vel: .35 + .35 * (t / T.unfold), cutoff: 250 + 1400 * (t / T.unfold) });
s.riser(T.unfold - 2, 2, { vel: .45, from: 300, to: 6500 });
s.impact(T.unfold, { size: 1.1, vel: .9 });

/* unfold: the beat drops */
for (let t = T.unfold; t < T.reveal - .01; t += B) { const n = Math.round((t - T.unfold) / B); s.kick(t, { vel: 1.05 }); if (n % 2) { s.snare(t, { vel: .75 }); s.clap(t, { vel: .5 }); } s.hat(t + B / 2, { vel: .5, open: n % 4 === 3 }); }
s.duck('music', Array.from({ length: Math.ceil((T.reveal - T.unfold) / B) }, (_, i) => T.unfold + i * B), { depth: .45 });
for (let t = T.unfold; t < T.reveal - .01; t += B / 2) s.bass(t, prog[Math.min(prog.length - 1, Math.floor(t / bar))][0] - 12, B * .42, { vel: .8, cutoff: 900 });
s.arp(T.unfold, chord('E4', 'min7'), 24, B / 4, (t, m, i) => s.keys(t, m + (i % 8 > 3 ? 12 : 0), .12, { kind: 'marimba', vel: .2, pan: Math.sin(i) * .5, echo: .3, send: .25 }));
s.whoosh(T.unfold - .3, .8, { vel: .5, from: 400, to: 4500 });

/* reveal: drop out, then the big chord */
s.riser(T.reveal - 1.2, 1.2, { vel: .5, from: 400, to: 8000 });
for (let i = 0; i < 4; i++) s.tom(T.reveal - .5 + i * B / 4, { vel: .5 + i * .12, f: 200 - i * 26, pan: -.4 + i * .27 });
s.impact(T.reveal, { size: 1.6, vel: 1 }); s.kick(T.reveal, { vel: 1 });
s.pad(T.reveal, chord('E3', 'min9'), dur - T.reveal, { vel: .55, attack: .05, release: 2, cutoff: 3200, send: .55 });
s.strings(T.reveal, chord('E3', 'min'), dur - T.reveal, { vel: .38, attack: .1, release: 2 });
s.chime(T.reveal + .05, ['E5', 'G5', 'B5', 'E6'], { vel: .55 });
s.sparkle(T.reveal + .2, 2.2, { vel: .55 });
s.sub(T.reveal, 'E1', 2, { vel: .8 });

s.write('audio.wav', { lufs: -14, reverb: { rt60: 2.6, mix: .28 }, fadeOut: .35 });
