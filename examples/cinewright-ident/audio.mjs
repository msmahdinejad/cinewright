// audio.mjs — soundtrack for the CINEWRIGHT ident, from the SAME cues as the picture (video.html → <script id="cues">). 120 BPM, A minor → C major resolve. Run: node audio.mjs
// code (typing ticks + a quiet pad) → shatter (impact + whoosh) → particles gather (sparkle, riser) → lock (hit + chime) → reel (groove + bell figure) → name (impact, resolve) → tail.
import { Song, readCues, chord } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 5 }), B = s.B, bar = 4 * B;                  // B = 0.5 s, bar = 2 s
const kicks = [];

/* 1 · code (0–2 s): the window types — soft ticks, a held pad underneath, a riser leaning into the shatter */
s.pad(0, chord('A3', 'min9'), 2.4, { vel: .22, attack: .6, cutoff: 900, movement: .5, send: .5 });
for (let k = 0; k < 24; k++) s.type(.3 + k * .06, { vel: .28 });
s.riser(.9, 1.1, { vel: .5, from: 250, to: 7000 });
/* 2 · assemble (2–4 s): impact on the shatter, sparkle while the particles gather, a hit + chime when the mark locks */
s.impact(T.assemble, { size: 1.2, vel: .85 }); s.whoosh(T.assemble - .1, .6, { vel: .5, from: 400, to: 5000, pan0: -.7, pan1: .7 });
s.sparkle(T.assemble + .15, 1.3, { vel: .35 }); s.hit(T.lock, { vel: .6 }); s.chime(T.lock + .02, ['E5', 'A5', 'C6', 'E6'], { vel: .45 }); s.sub(T.lock, 'A1', 1.2, { vel: .2, drop: 1.1 });
s.whoosh(T.reel - .3, .4, { vel: .5, from: 300, to: 4500 });
/* 3 · reel (4–7 s): a groove with bass on the helix, a bell figure that orbits with the frames */
kicks.push(...s.groove('house', T.reel, 1.5, { vel: .85, kick: { f1: 56, f0: 160, decay: .3 } }));
for (let t = T.reel; t < T.name - 1e-6; t += B / 2) s.bass(t, ['A1', 'F1', 'C2'][Math.floor((t - T.reel) / bar) % 3], B / 2 * .85, { vel: .42, cutoff: 560 + 60 * (t - T.reel), sub: .25 });
s.pad(T.reel, chord('A3', 'min7'), 3.4, { vel: .3, attack: .3, cutoff: 1400, movement: .6, send: .45 });
s.arp(T.reel + .1, chord('A5', 'min7'), 12, B / 2, (t, m, i) => s.keys(t, m, .3, { kind: 'bell', vel: .2, decay: 1.7, pan: Math.sin(i * 1.1) * .6, send: .5 }));
s.riser(T.name - 1.2, 1.0, { vel: .45, from: 300, to: 8000 }); s.duck('music', [T.name - .1], { depth: .85, attack: .03, release: .5 });
/* 4 · name (7–12 s): the impact, a bright C major resolve, the tagline typed with soft ticks, a long tail */
s.impact(T.name, { size: 1.5, vel: .9 }); s.kick(T.name, { vel: 1.1, f1: 54 }); kicks.push(T.name); s.sub(T.name, 'C2', 2.2, { vel: .26, drop: 1.4 }); s.sparkle(T.name + .2, 1.6, { vel: .4 });
s.pad(T.name + .05, chord('C4', 'maj9'), dur - T.name, { vel: .46, attack: .35, release: 2, cutoff: 3000, send: .6 }); s.strings(T.name + .05, chord('C3', 'maj7'), dur - T.name, { vel: .3, attack: .5, release: 2 });
for (let k = 0; k < 20; k++) s.type(T.tag + .05 * k, { vel: .22 });
s.arp(T.name + .6, chord('C5', 'maj7'), 6, B, (t, m) => s.keys(t, m, .4, { kind: 'bell', vel: .26, decay: 2.4, send: .6, echo: .3 }));

s.duck('music', kicks, { depth: .4, attack: .01, release: .18 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 2.6, mix: .32 }, fadeOut: .6 });
