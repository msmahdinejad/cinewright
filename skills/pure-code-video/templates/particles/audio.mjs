// audio.mjs — cinematic ambient bed for the particle morph. Every event is placed from the cues in video.html.
import { Song, readCues, chord, note } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 11 }), B = s.B, bar = 4 * B;

/* harmony: Dm9 · Bbmaj7 · Fmaj7 · Csus → home on D (one chord per bar, long overlaps) */
const chords = [chord('D3', 'min9'), chord('A#2', 'maj7'), chord('F3', 'maj7'), chord('C3', 'sus4'), chord('D3', 'min9')];
chords.forEach((c, i) => s.pad(i * bar, c, bar + .8, { vel: i === 0 ? .32 : .42, attack: 1.0, release: 1.6, cutoff: 1100 + 500 * i, movement: .8, send: .55, width: 1 }));
s.drone(0, dur - 1, 'D1', { vel: .3, cutoff: 180 });
s.strings(T.formB - .5, chord('D4', 'min'), 5, { vel: .28, attack: 1.5, release: 1.5, send: .5 });

/* the cloud gathers → hello */
s.riser(0, T.formA, { vel: .32, from: 400, to: 7000 });
s.impact(T.formA, { size: 1, vel: .7 });
s.chime(T.formA + .1, ['D6', 'F6', 'A6'], { vel: .4 });
/* slow glassy arpeggio that follows the chord (marimba + echo) */
for (let t = T.formA + B; t < dur - 1.5; t += B / 2) { const c = chords[Math.min(chords.length - 1, Math.floor(t / bar))], k = Math.round((t - T.formA) / (B / 2)); if (k % 2 === 0) s.keys(t, c[k / 2 % c.length | 0] + 24, .3, { kind: 'bell', vel: .18, pan: Math.sin(k) * .6, echo: .35, send: .4, decay: 1.6 }); }

/* hello → سلام : smoke, a downward sweep, then the new word rings in */
s.downlifter(T.formB - .25, 1.0, { vel: .4, from: 5000, to: 300 });
s.whoosh(T.formB, 1.6, { vel: .4, from: 300, to: 3500, pan0: -.7, pan1: .7 });
s.sub(T.formB, 'D1', 2.2, { vel: .6, drop: 1.3 });
s.impact(T.formB + 1.6, { size: .7, vel: .6 });
s.chime(T.formB + 1.7, ['A5', 'C6', 'E6'], { vel: .4 });

/* → the mark: everything swells, resolves on D */
s.riser(T.formC - 1.4, 1.4, { vel: .4, from: 500, to: 8000 });
s.whoosh(T.formC, 1.8, { vel: .45, from: 400, to: 4200 });
s.impact(T.formC + 1.6, { size: 1.6, vel: .9 });
s.sub(T.formC + 1.6, 'D1', 3, { vel: .8 });
s.brass(T.formC + 1.6, chord('D3', 'min'), 2.5, { vel: .3, attack: .3, release: 1 });
s.chime(T.formC + 1.7, ['D6', 'A6', 'D7'], { vel: .5 });
s.sparkle(T.formC + 1.6, 2.2, { vel: .6 });

s.write('audio.wav', { lufs: -15, reverb: { rt60: 3.2, mix: .32 }, fadeOut: .35 });
