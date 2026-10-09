// audio.mjs — soundtrack for the CLAUDE MOTION REEL, built from the SAME cues as the picture (video.html → <script id="cues">). 128 BPM, A minor. Run: node audio.mjs
// Energy curve: slam (one kick + hit per word, riser leaning into the cut) → house groove from the chrome knot → sparkle + chime on the particle lock → santur arp on the pattern →
// marimba + typing ticks + a click on the UI → sliding sub for the fluid → riser + accelerating tom roll → 0.12 s of SILENCE → BURST (11.25 s) → resolve on A major add9.
import { Song, readCues, chord, progression } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 21 }), B = s.B, bar = 4 * B;                       // B = 0.46875 s
const prog = progression('A3', 'minor', 'i VI III VII'), roots = ['A1', 'F1', 'C2', 'G1'];     // Am · F · C · G, one chord per bar
const kicks = [];

/* 1 · slam (0–1.875): a kick + a hit on every word, a riser leaning into the first cut */
for (let i = 0; i < 4; i++) { s.kick(i * B, { vel: .8, f1: 56 }); kicks.push(i * B); s.hit(i * B, { vel: .5 }); s.tick(i * B + B / 2, { vel: .3 }); }
s.riser(.85, 1.0, { vel: .4, from: 300, to: 6500 });

/* 2–7 · the groove runs from the chrome knot to the silence before the burst (5 bars), bass and pad follow one chord per bar */
for (let b = 0; b < 5; b++) kicks.push(...s.groove('house', T.form + b * bar, 1, { vel: .62 + .09 * b, kick: { f1: 58, f0: 170, decay: .3 } }));      // the groove GROWS bar by bar (dynamics!); a slightly higher, shorter kick: phone speakers can play it
for (let b = 0; b < 5; b++) {
  const t0 = T.form + b * bar;
  for (let t = t0; t < t0 + bar - 1e-6; t += B / 2) s.bass(t, roots[b % 4], B / 2 * .85, { vel: .46, cutoff: 520 + 100 * b, sub: .25 });
  s.pad(t0, prog[b % 4], bar + .6, { vel: .3, attack: .35, cutoff: 1100 + 160 * b, movement: .6, send: .45 });
}
for (const t of [T.form, T.type, T.pattern, T.ui, T.fluid, T.speed]) s.whoosh(t - .3, .38, { vel: .5, from: 300, to: 4500, pan0: -.5, pan1: .5 });     // a whoosh BEFORE every cut

/* 2 · form (1.875): a glassy bell figure orbits with the knot */
s.impact(T.form, { size: .8, vel: .5 });
s.arp(T.form + .1, chord('A5', 'min7'), 7, B / 2, (t, m, i) => s.keys(t, m, .3, { kind: 'bell', vel: .2, decay: 1.6, pan: Math.sin(i * 1.3) * .6, send: .5 }));
/* 3 · type (3.75): sparkle while the particles gather, a chime + hit when the word locks */
s.sparkle(T.type + .1, 1.0, { vel: .32 }); s.hit(T.lock, { vel: .5 }); s.chime(T.lock + .02, ['A5', 'C6', 'E6'], { vel: .42 });
/* 4 · pattern (5.156): a santur arpeggio — the geometry has a voice; a downlifter while the disc floods the frame */
s.arp(T.pattern, chord('A4', 'min7'), 6, B / 2, (t, m, i) => s.santur(t, m + (i % 4 === 3 ? 12 : 0), .7, { vel: .42, pan: Math.sin(i) * .4 }));
s.downlifter(T.ui - .62, .62, { vel: .45 });
/* 5 · ui (6.5625): marimba figure, typing ticks while the counters run, the click, a success chime */
s.hit(T.ui, { vel: .55 }); s.arp(T.ui, chord('A4', 'min7'), 7, B / 2, (t, m, i) => s.keys(t, m, .25, { kind: 'marimba', vel: .3, pan: Math.sin(i * .9) * .5 }));
for (let k = 0; k < 8; k++) s.type(T.ui + .2 + k * .09, { vel: .35 }); s.click(T.click, { vel: .85 }); s.success(T.click + .07, { vel: .45 });
/* 6 · fluid (8.4375): a sliding sub + a saw lead that bends */
s.sub(T.fluid, 'A1', 1.4, { vel: .24, drop: 1.2 }); s.lead(T.fluid + .1, 'E4', 1.3, { vel: .2, wave: 'saw', cutoff: 1800, vibrato: 5.5, send: .4, echo: .3 });
/* 7 · speed (9.84): zap + riser + an accelerating tom roll into the silence */
s.zap(T.speed, { vel: .35 }); s.riser(T.speed + .1, T.silence - T.speed - .1, { vel: .6, from: 200, to: 9500 });
for (let t = T.silence - .95; t < T.silence - .02; t += B / 4) { const k = (t - (T.silence - .95)) / .95; s.tom(t, { f: 100 + 150 * k, vel: .3 + .5 * k }); }

/* 8 · burst (11.25): the loudest moment — the music is pulled out for 0.12 s first, then impact, sub, kick, sparkle, confetti pops */
s.duck('music', [T.silence], { depth: .94, attack: .02, release: .45 });
s.impact(T.burst, { size: 1.7, vel: .95 }); s.sub(T.burst, 'A1', 2.2, { vel: .28, drop: 1.5 }); s.kick(T.burst, { vel: 1.2, f1: 56 }); kicks.push(T.burst); s.sparkle(T.burst + .2, 1.5, { vel: .45 });
for (let k = 0; k < 6; k++) s.pop(T.burst + .08 + k * .045, { vel: .5, f0: 700 + k * 150, pan: (k % 2 ? 1 : -1) * .5 });
/* 9 · end (12.656): resolve on A major (add9), bell shimmer, a long tail */
s.pad(T.end, chord('A3', 'maj9'), dur - T.end, { vel: .42, attack: .4, release: 2, cutoff: 2800, send: .6 }); s.strings(T.end, chord('A3', 'maj7'), dur - T.end, { vel: .26, attack: .5, release: 2 });
s.arp(T.end + .15, chord('A5', 'maj7'), 5, B, (t, m) => s.keys(t, m, .4, { kind: 'bell', vel: .26, decay: 2.4, send: .6, echo: .3 })); s.sub(T.end, 'A1', 2.3, { vel: .18, drop: 1 });

s.duck('music', [T.ui + .05], { depth: .5, attack: .12, release: 1.5 });         // a breather under the UI shot, so the burst is felt as the loudest moment (dynamics)
s.duck('music', kicks, { depth: .4, attack: .01, release: .18 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 2.4, mix: .3 }, fadeOut: .45 });
