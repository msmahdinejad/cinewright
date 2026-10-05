// audio.mjs — soundtrack for SHOWREEL, built from the SAME cues as the picture (video.html → <script id="cues">). 128 BPM, A minor. Run: node audio.mjs
// Energy curve: slam (one hit per word) → groove enters on the 3D word → riser/pad for the particles → santur arp for the pattern → marimba + UI ticks → wobble bass for the fluid →
// riser + tom roll for the tunnel → SILENCE → BURST (13.1 s) → resolve on a bright A-major chord.
import { Song, readCues, chord, progression } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 11 }), B = s.B, bar = 4 * B;                       // B = 0.46875 s
const prog = progression('A3', 'minor', 'i VI III VII'), roots = ['A1', 'F1', 'C2', 'G1'];     // Am · F · C · G, one chord per bar
const kicks = [];

/* 1 · slam (0–1.875): a kick + a hit on every word, a riser leaning into the first cut */
for (let i = 0; i < 4; i++) { s.kick(i * B, { vel: 1, f1: 56 }); kicks.push(i * B); s.hit(i * B, { vel: .45 }); s.tick(i * B + B / 2, { vel: .3 }); }
s.riser(T.type3d - 1.0, .95, { vel: .35, from: 300, to: 6000 });

/* 2–7 · the groove runs from the 3D word to the burst (6 bars), with bass and pad following the chord of each bar */
kicks.push(...s.groove('house', T.type3d, 6, { vel: 1, kick: { f1: 58, f0: 170, decay: .3 } }));      // a slightly higher, shorter kick: phone speakers can play it
for (let b = 0; b < 6; b++) {
  const t0 = T.type3d + b * bar;
  for (let t = t0; t < t0 + bar - 1e-6; t += B / 2) s.bass(t, roots[b % 4], B / 2 * .85, { vel: .46, cutoff: 520 + 90 * b, sub: .25 });
  s.pad(t0, prog[b % 4], bar + .6, { vel: .3, attack: .35, cutoff: 1100 + 150 * b, movement: .6, send: .45 });
}
for (const t of [T.type3d, T.morph, T.pattern, T.ui, T.fluid, T.speed]) s.whoosh(t - .3, .38, { vel: .5, from: 300, to: 4500, pan0: -.5, pan1: .5 });     // a whoosh BEFORE every cut

/* 3 · morph (3.75–5.6): smoke → word: sparkle while it forms, a chime and a hit when it locks */
s.sparkle(T.morph + .1, 1.4, { vel: .3 }); s.hit(T.morph + 1.3, { vel: .4 }); s.chime(T.morph + 1.32, ['A5', 'C6', 'E6'], { vel: .4 });
/* 4 · pattern (5.6–7.5): a santur arpeggio — the Persian colour of the reel */
s.arp(T.pattern, chord('A4', 'min7'), 8, B / 2, (t, m, i) => s.santur(t, m + (i % 4 === 3 ? 12 : 0), .7, { vel: .42, pan: Math.sin(i) * .4 }));
/* 5 · ui (7.5–9.4): marimba figure, typing ticks while the counters run, the click, a success chime */
s.arp(T.ui, chord('A4', 'min7'), 8, B / 2, (t, m, i) => s.keys(t, m, .25, { kind: 'marimba', vel: .3, pan: Math.sin(i * .9) * .5 }));
for (let k = 0; k < 8; k++) s.type(T.ui + .25 + k * .1, { vel: .35 }); s.click(T.ui + 1.15, { vel: .8 }); s.success(T.ui + 1.22, { vel: .45 });
/* 6 · fluid (9.4–11.25): a sliding sub + a saw lead that bends */
s.sub(T.fluid, 'A1', 1.8, { vel: .22, drop: 1.2 }); s.lead(T.fluid + .1, 'E4', 1.7, { vel: .2, wave: 'saw', cutoff: 1800, vibrato: 5.5, send: .4, echo: .3 });
/* 7 · speed (11.25–13.1): riser + accelerating tom roll into the silence before the burst */
s.zap(T.speed, { vel: .35 }); s.riser(T.speed + .15, T.burst - T.speed - .3, { vel: .55, from: 200, to: 9000 });
for (let t = T.burst - 1.0; t < T.burst - .06; t += B / 4) { const k = (t - (T.burst - 1.0)) / 1.0; s.tom(t, { f: 100 + 150 * k, vel: .3 + .5 * k }); }

/* 8 · burst (13.125): the loudest moment — music pulled out for 0.12 s first, then impact, sub, sparkle, confetti pops */
s.duck('music', [T.burst - .12], { depth: .92, attack: .03, release: .5 });
s.impact(T.burst, { size: 1.6, vel: .9 }); s.sub(T.burst, 'A1', 2.4, { vel: .26, drop: 1.5 }); s.kick(T.burst, { vel: 1.2, f1: 56 }); kicks.push(T.burst); s.sparkle(T.burst + .2, 1.6, { vel: .45 });
for (let k = 0; k < 6; k++) s.pop(T.burst + .08 + k * .045, { vel: .5, f0: 700 + k * 150, pan: (k % 2 ? 1 : -1) * .5 });
/* 9 · end (14.06–17.5): resolve on A major (add9), bell shimmer, a long tail */
s.pad(T.end, chord('A3', 'maj9'), dur - T.end, { vel: .5, attack: .4, release: 2, cutoff: 2800, send: .6 }); s.strings(T.end, chord('A3', 'maj7'), dur - T.end, { vel: .32, attack: .5, release: 2 });
s.arp(T.end + .2, chord('A5', 'maj7'), 6, B, (t, m) => s.keys(t, m, .4, { kind: 'bell', vel: .26, decay: 2.4, send: .6, echo: .3 })); s.sub(T.end, 'A1', 3, { vel: .18, drop: 1 });

s.duck('music', kicks, { depth: .4, attack: .01, release: .18 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 2.6, mix: .3 }, fadeOut: .5 });
