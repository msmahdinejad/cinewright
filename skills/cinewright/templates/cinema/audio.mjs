// audio.mjs — soundtrack for CINEMA, built from the SAME cues as the picture (video.html → <script id="cues">). 120 BPM, F minor. Run: node audio.mjs
// Energy curve:  open (dark swell) → HERO HIT 3 s → poster groove 6–9 → city lift 9–12 → UI breakdown 12–15 → BURST 15 (silence before it) → resolve 17–20.
import { Song, readCues, chord, progression } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 5 }), B = s.B, bar = 4 * B;                       // B = 0.5 s
const prog = progression('F3', 'minor', 'i VI III VII');                                       // Fm · Db · Ab · Eb (one chord per bar)
const kicks = [];

/* bed ─ drone + pads all film long; the cutoff opens as the film builds */
s.drone(0, dur - .4, 'F1', { vel: .2, cutoff: 170 });
for (let b = 0; b * bar < dur; b++) s.pad(b * bar, prog[b % 4], bar + .8, { vel: b * bar < T.hero ? .3 : b * bar >= T.ui && b * bar < T.burst ? .46 : .38, attack: b * bar < T.hero ? 1.1 : .5, release: 1.4, cutoff: 900 + 120 * b, movement: .8, send: .55, width: 1 });

/* 1 · open (0–3): smoke → name. A riser leans into the hero hit, then the music is pulled out for one breath */
s.sparkle(.4, 2.2, { vel: .3 }); s.whoosh(.2, 2.4, { vel: .22, from: 220, to: 1800, pan0: -.3, pan1: .3, send: .5 });
s.riser(1.0, T.hero - 1.0 - .12, { vel: .36, from: 300, to: 7000 }); s.duck('music', [T.hero - .35], { depth: .75, attack: .05, release: .35 });

/* 2 · hero (3–6): the impact + a bright chord + glassy arpeggio while the camera orbits the chrome name */
s.impact(T.hero, { size: 1.5, vel: .7 }); s.sub(T.hero, 'F1', 3, { vel: .22, drop: 1.4 }); s.chime(T.hero + .02, ['F5', 'Ab5', 'C6', 'F6'], { vel: .55 }); s.strings(T.hero, chord('F3', 'min9'), 3, { vel: .34, attack: .35, release: 1.2 });
s.arp(T.hero + .5, chord('F5', 'min7'), 10, B / 2, (t, m, i) => s.keys(t, m + (i % 4 === 3 ? 12 : 0), .3, { kind: 'bell', vel: .24, pan: Math.sin(i) * .5, decay: 2, send: .55, echo: .25 }));
s.whoosh(T.poster - .45, .5, { vel: .5, from: 400, to: 5000, pan0: -.6, pan1: .6 });

/* 3 · poster (6–9): groove arrives with the first hard cut, one accent per cut (6 · 7 · 8) */
for (let t = T.poster; t < T.city; t += B) { s.kick(t, { vel: 1, f1: 56 }); kicks.push(t); s.hat(t + B / 2, { vel: .45 }); }
for (let t = T.poster + B; t < T.city; t += 2 * B) { s.snare(t, { vel: .9 }); s.clap(t, { vel: .5 }); }
for (let t = T.poster; t < T.city; t += B / 2) s.bass(t, 'F1', B / 2 * .9, { vel: .5, cutoff: 640 + 200 * ((t - T.poster) / 3), sub: .3 });
for (const h of [6, 7, 8]) { s.hit(h, { vel: .55 }); }
s.glitch(T.city - .35, .35, { vel: .5 });

/* 4 · city (9–12): the flight — brighter, a lead line over the same groove, off-beat stabs */
for (let t = T.city; t < T.ui; t += B) { s.kick(t, { vel: 1, f1: 56 }); kicks.push(t); s.hat(t + B / 2, { vel: .5 }); if (Math.round((t - T.city) / B) % 2) { s.snare(t, { vel: .85 }); } }
for (let t = T.city; t < T.ui; t += B / 2) s.bass(t, ((t - T.city) / (B / 2)) % 4 === 3 ? 'Ab1' : 'F1', B / 2 * .9, { vel: .5, cutoff: 900, sub: .28 });
[['C5', 0], ['Ab4', 1], ['C5', 2], ['Eb5', 3], ['F5', 4.5], ['Eb5', 5.5]].forEach(([n, k]) => s.lead(T.city + k * B, n, B * .9, { vel: .26, wave: 'saw', cutoff: 2600, vibrato: 4, send: .4, echo: .3 }));
s.whoosh(T.ui - .5, .5, { vel: .45, from: 300, to: 4200 });

/* 5 · ui (12–15): breakdown — no drums; marimba + bells play the cards passing by, a riser/tom roll builds into the burst */
s.arp(T.ui, chord('F4', 'min9'), 24, B / 2, (t, m, i) => s.keys(t, m + (i % 8 > 4 ? 12 : 0), .25, { kind: 'marimba', vel: .26, pan: Math.sin(i * .9) * .6, send: .35, echo: .3 }));
for (let k = 0; k < 7; k++) s.tick(T.ui + .6 + k * .43, { vel: .35 });
s.riser(T.burst - 1.5, 1.4, { vel: .5, from: 200, to: 9000 }); for (let t = T.burst - 1; t < T.burst - .05; t += B / 4) s.tom(t, { f: 90 + 160 * ((t - (T.burst - 1)) / 1), vel: .35 + .5 * ((t - (T.burst - 1)) / 1) });
s.duck('music', [T.burst - .12], { depth: .9, attack: .03, release: .5 });

/* 6 · burst (15): the loudest moment — explosion, shock, glittering debris, strings swell as the cloud re-forms into the logo */
s.impact(T.burst, { size: 1.7, vel: .9 }); s.hit(T.burst + .02, { vel: .8 }); s.sub(T.burst, 'F1', 2.8, { vel: .26, drop: 1.6 }); s.kick(T.burst, { vel: 1.2, f1: 56 }); kicks.push(T.burst);
s.sparkle(T.burst + .2, 1.8, { vel: .5 }); s.strings(T.burst, chord('F3', 'min'), 2.2, { vel: .45, attack: .1, release: 1.4 }); s.chime(T.burst + .1, ['C6', 'F6', 'Ab6', 'C7'], { vel: .5 });
s.whoosh(T.burst + .05, 1.6, { vel: .4, from: 5000, to: 300, pan0: .5, pan1: -.5, send: .6 });

/* 7 · end (17–20): resolve on a bright F-major-ish chord (add9), bell shimmer, long tail */
s.pad(T.end, chord('F3', 'maj9'), dur - T.end, { vel: .5, attack: .5, release: 2.2, cutoff: 2600, send: .6 }); s.strings(T.end, chord('F3', 'maj7'), dur - T.end, { vel: .34, attack: .6, release: 2 });
s.arp(T.end + .3, chord('F5', 'maj7'), 6, B, (t, m, i) => s.keys(t, m, .4, { kind: 'bell', vel: .26, pan: Math.sin(i) * .5, decay: 2.6, send: .6, echo: .3 })); s.sparkle(T.end + 1.5, 2, { vel: .35 }); s.sub(T.end, 'F1', 3, { vel: .2, drop: 1 });

s.duck('music', kicks, { depth: .4, attack: .01, release: .18 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 3.2, mix: .32 }, fadeOut: .5 });
