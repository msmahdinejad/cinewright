// audio.mjs — soundtrack for "WE BUILD IT", built from the SAME cues as the picture (video.html → <script id="cues">). 174 BPM drum & bass in F minor.
// Energy: three kick hits (WE / DON'T / WAIT) → decode ticks + riser → breakbeat groove from the 3D words → film-shutter clicks on the FRAME beat → typed ticks while the lines draw →
// snare roll + riser to 16.55 s → ONE BEAT OF SILENCE → impact, sub, a pad chord that rings out under the last word.
import { Song, readCues, chord } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 17 }), B = s.B, bar = 4 * B, kicks = [];

/* 1 · wedont: one kick + hit per word, a tick between, a riser leaning into the decode */
for (const b of [0, 2, 4]) { s.kick(b * B, { vel: 1.05, f1: 60 }); kicks.push(b * B); s.hit(b * B, { vel: .55 }); s.tick(b * B + B, { vel: .25 }); }
s.riser(1.15, .9, { vel: .4, from: 250, to: 6000 });
/* 2 · inspire: the decode — many small ticks, then a sweep on the strike-through */
for (let k = 0; k < 18; k++) s.tick(T.inspire + .1 + k * .06, { vel: .22 + .15 * (k / 18) }); s.whoosh(T.inspire + 1.15, .45, { vel: .6, from: 300, to: 7000, pan0: -.8, pan1: .8 });
s.zap(T.inspire + 1.55, { vel: .3 });
/* 3–5 · the groove: breakbeat from the 3D words to the end of the "until" riser (9 bars), reese bass on the root of each bar, a pad moving underneath */
const roots = ['F1', 'F1', 'Db1', 'Eb1'], prog = [chord('F3', 'min7'), chord('F3', 'min7'), chord('Db3', 'maj7'), chord('Eb3', 'maj7')];
for (let b = 0; b < 9; b++) kicks.push(...s.groove('dnb', T.build + b * bar, 1, { vel: .62 + .05 * Math.min(b, 6), kick: { f1: 62, f0: 170, decay: .22 } }));
for (let b = 0; b < 9; b++) { const t0 = T.build + b * bar; for (let t = t0; t < t0 + bar - 1e-6; t += B) s.bass(t, roots[b % 4], B * .92, { vel: .5, cutoff: 500 + 140 * b, sub: .1, wave: 'saw', drive: 1.5 }); s.pad(t0, prog[b % 4], bar + .5, { vel: .24, attack: .4, cutoff: 1000 + 200 * b, movement: .6, send: .4 }); }
for (const t of [T.build, T.frame, T.line, T.until]) s.whoosh(t - .3, .38, { vel: .55, from: 300, to: 4500, pan0: -.6, pan1: .6 });
/* 3 · build: three impacts as the 3D words arrive; a whoosh for every pass of the camera */
for (const [d, n] of [[0, 'F2'], [1.3, 'F2'], [2.6, 'Db2']]) { s.impact(T.build + d, { size: .9, vel: .5 }); s.sub(T.build + d, n, .8, { vel: .08, drop: 1.1 }); }
s.whoosh(T.build + 1.1, .7, { vel: .5, from: 200, to: 3500, pan0: -.7, pan1: .7 }); s.whoosh(T.build + 2.5, .7, { vel: .5, from: 300, to: 5000, pan0: .7, pan1: -.7 });
/* 4 · frame: a film-shutter click on every beat (the picture steps "on fours") */
for (let t = T.frame; t < T.line - 1e-6; t += B) s.shutter ? s.shutter(t, { vel: .45 }) : s.click(t, { vel: .45 });
/* 5 · line: typed ticks while each outline is drawn */
for (const [d0, n] of [[0, 14], [.55, 5], [1.05, 14]]) for (let k = 0; k < n; k++) s.type(T.line + d0 + k * (.85 / n), { vel: .3 });
/* 6 · until: a riser climbs for 2.76 s, a snare roll accelerates, the words land on kicks */
s.riser(T.until, T.hush - T.until, { vel: .62, from: 200, to: 9500 });
for (let t = T.until + 1.2; t < T.hush - .04; t += B / 2 * (1 - .55 * (t - T.until - 1.2) / (T.hush - T.until - 1.2))) s.snare(t, { vel: .25 + .55 * (t - T.until - 1.2) / (T.hush - T.until - 1.2), tone: 200 });
s.hit(T.until, { vel: .5 }); s.hit(T.until + 2 * B, { vel: .5 }); s.sparkle(T.until + 1.45, .9, { vel: .35 });
/* silence: nothing is scheduled between T.hush and T.move; everything above is cut to end exactly there */
const gap = []; for (let t = T.hush - .01; t < T.move - .03; t += .04) gap.push(t);                        // overlapping ducks hold every bus (and the reverb tail) down for the whole beat
for (const bus of ['music', 'drums', 'sfx', 'verb', 'delay']) s.duck(bus, gap, { depth: .985, attack: .004, release: .07 });
/* 7 · move: the loudest moment, then a chord that rings out under the word as it moves away */
s.impact(T.move, { size: 1.7, vel: .95 }); s.sub(T.move, 'F1', 2.8, { vel: .1, drop: 1.4 }); s.kick(T.move, { vel: 1.15, f1: 58 }); kicks.push(T.move); s.sparkle(T.move + .25, 1.6, { vel: .45 });
s.pad(T.move, chord('F3', 'min9'), dur - T.move, { vel: .46, attack: .3, release: 2, cutoff: 3200, send: .55 }); s.strings(T.move + .1, chord('F3', 'min7'), dur - T.move - .1, { vel: .28, attack: .5, release: 2 });
s.whoosh(T.move + 1.85, .9, { vel: .65, from: 300, to: 6000, pan0: -.9, pan1: .9 });
for (const [d, m] of [[1.3, 'F5'], [1.65, 'Ab5'], [2.0, 'C6']]) s.keys(T.move + d, m, .8, { kind: 'bell', vel: .28, decay: 2, send: .55 });

s.duck('music', kicks, { depth: .42, attack: .008, release: .16 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 2.2, mix: .26 }, fadeOut: .4 });
