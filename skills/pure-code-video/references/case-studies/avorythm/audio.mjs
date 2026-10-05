// audio.mjs — soundtrack for AVORYTHM, built from the SAME cues as the picture (video.html → <script id="cues">). 120 BPM, D minor with a Shur colour (quarter-flat E: 'Ed4').
// The sound tells the same story as the picture, left → right: a DULL babble panned left (the foreign voice, violet) and, after the turn, a BRIGHT babble panned right (the dub, cyan) answering it.
// babel (muffled, low drone) → tab (UI ticks, riser) → silence → TURN 8 s (impact, filter-open, groove) → 4 ascending bells (the 4 outputs) → crossfading voices → santur on the Persian subtitle →
// riser + tom roll → 0.15 s of silence → BURST 24 s → resolve on D major with bells and one santur note.
import { Song, readCues, chord, progression } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 17 }), B = s.B, bar = 4 * B;                       // B = 0.5 s
const prog = progression('D3', 'minor', 'i VI III VII'), roots = ['D1', 'Bb0', 'F1', 'C1'];  // Dm · Bb · F · C
const kicks = [];

/* 1 · babel (0–4): a heartbeat, a hit at 0.8 s, the muffled foreign voice, a cold drone, glitchy ticks */
s.heartbeat(.12, { vel: .55 }); s.heartbeat(.5, { vel: .5 }); s.hit(.8, { vel: .8 }); s.impact(.8, { size: .8, vel: .5 }); s.whoosh(.45, .4, { vel: .4, from: 200, to: 2500 });
s.drone(0, T.prism, 'D1', { vel: .3, cutoff: 190, movement: .8 }); s.babble(.85, T.tab - .1, { f0: 105, style: 'dull', pan: -.45, gain: 1, seed: 1 });
s.glitch(1.9, .25, { vel: .35 }); s.glitch(3.3, .2, { vel: .3 }); s.tick(2.6, { vel: .25 }); s.riser(T.tab - 1.0, .95, { vel: .3, from: 250, to: 5000 });

/* 2 · tab (4–8): the same dull voice, UI sounds on every click, a riser leaning into the turn, then SILENCE */
s.whoosh(T.tab - .25, .4, { vel: .5, from: 300, to: 4000, pan0: -.6, pan1: .6 }); s.babble(T.tab, T.prism - .22, { f0: 105, style: 'dull', pan: -.45, gain: .8, seed: 2 });
s.swipe(T.tab + .6, .3, { vel: .3 }); s.pop(T.tab + 1.15, { vel: .4, pan: .3 }); s.click(T.tab + 1.7, { vel: .55, pan: .25 }); s.click(T.tab + 2.7, { vel: .6, pan: .35 }); s.pop(T.tab + 2.75, { vel: .5, f0: 1100, pan: .4 }); s.click(T.click, { vel: .8, pan: .1 });
s.riser(T.click - 1.1, 1.0, { vel: .5, from: 200, to: 9000 }); s.duck('music', [T.prism - .16], { depth: .95, attack: .02, release: .3 }); s.duck('voice', [T.prism - .18], { depth: 1, attack: .02, release: .06 });

/* 3 · prism (8–12) — THE TURN: impact, sparkle, the groove enters, four bells = four outputs (violet left / cyan right) */
s.impact(T.prism, { size: 1.5, vel: .9 }); s.sub(T.prism, 'D1', 2.6, { vel: .3, drop: 1.4 }); s.kick(T.prism, { vel: 1.1 }); kicks.push(T.prism); s.sparkle(T.prism + .1, 1.6, { vel: .45 }); s.whoosh(T.prism - .02, 1.0, { vel: .4, from: 4000, to: 500, pan0: 0, pan1: .3 });
[['D5', T.o1, -.5], ['F5', T.o2, .5], ['A5', T.o3, -.4], ['D6', T.o4, .4]].forEach(([n, t, p]) => { s.keys(t, n, .4, { kind: 'bell', vel: .55, pan: p, decay: 2.2, send: .5, echo: .3 }); s.pop(t - .01, { vel: .3, f0: 1400, pan: p }); });
kicks.push(...s.groove('halftime', T.prism, 4));                                                // prism + mix (8 s)
s.babble(T.prism + .9, T.glass - .1, { f0: 195, style: 'bright', pan: .45, gain: .35, seed: 3 });  // the dub arrives on the right, quietly at first
for (let b = 0; b < 4; b++) { const t0 = T.prism + b * bar; for (let t = t0; t < t0 + bar - 1e-6; t += B) s.bass(t, roots[b % 4], B * .85, { vel: .46, cutoff: 540 + 120 * b, sub: .25 }); s.pad(t0, prog[b % 4], bar + .6, { vel: .32, attack: .4, cutoff: 1400 + 150 * b, movement: .6, send: .5 }); }

/* 4 · mix (12–16): the crossfader — the dull voice (left) fades down while the bright dub (right) takes over; marimba + ticks on the counters */
s.babble(T.mix, T.mix + 1.8, { f0: 105, style: 'dull', pan: -.45, gain: .55, seed: 4 }); s.babble(T.mix + 1.8, T.glass - .3, { f0: 105, style: 'dull', pan: -.45, gain: .2, seed: 5 });
s.babble(T.mix + 1.2, T.glass - .1, { f0: 195, style: 'bright', pan: .45, gain: .8, seed: 6 });
s.arp(T.mix, chord('D4', 'min9'), 16, B / 2, (t, m, i) => s.keys(t, m + (i % 8 > 4 ? 12 : 0), .25, { kind: 'marimba', vel: .26, pan: Math.sin(i * .9) * .6, send: .3, echo: .25 })); s.whoosh(T.mix - .3, .4, { vel: .45, from: 300, to: 4500 });
for (let k = 0; k < 10; k++) s.tick(T.mix + .6 + k * .27, { vel: .25 });

/* 5 · glass (16–20): a breakdown — drums out; the santur plays the Persian subtitle in Shur, a swipe when the card is dragged */
s.whoosh(T.glass - .3, .4, { vel: .4, from: 300, to: 3500 });
s.pad(T.glass, prog[0], 2 * bar, { vel: .34, attack: .6, cutoff: 1600, send: .6 }); s.pad(T.glass + bar, prog[1], 2 * bar, { vel: .34, attack: .6, cutoff: 1800, send: .6 });
[['A4', 17.0], ['G4', 17.35], ['F4', 17.7], ['Ed4', 18.05], ['D4', 18.4], ['Ed4', 19.15], ['F4', 19.5], ['D4', 19.85]].forEach(([n, t], i) => s.santur(t, n, 1.2, { vel: .6, pan: .15 }));
s.click(T.glass + 2.1, { vel: .5 }); s.swipe(T.glass + 2.3, .7, { vel: .3 }); s.drone(T.glass, 4, 'D2', { vel: .18, cutoff: 260 });

/* 6 · world (20–24): the groove returns and builds — a bell for every node, pops for the pills, riser + tom roll into the silence before the burst */
s.whoosh(T.world - .3, .4, { vel: .5, from: 300, to: 4800 }); kicks.push(...s.groove('halftime', T.world, 2));
for (let b = 0; b < 2; b++) { const t0 = T.world + b * bar; for (let t = t0; t < t0 + bar - 1e-6; t += B) s.bass(t, roots[b % 4], B * .85, { vel: .5, cutoff: 700 + 150 * b, sub: .25 }); s.pad(t0, prog[b % 4], bar + .6, { vel: .36, attack: .3, cutoff: 2000, send: .5 }); }
[['D5', 20.2, -.5], ['A4', 20.33, -.4], ['F5', 20.46, -.3], ['A5', 20.8, .3], ['C6', 20.93, .4], ['D6', 21.06, .5]].forEach(([n, t, p]) => s.keys(t, n, .4, { kind: 'bell', vel: .4, pan: p, decay: 1.8, send: .5, echo: .25 }));
[21.9, 22.08, 22.26].forEach(t => s.pop(t, { vel: .35, f0: 900 })); s.riser(T.world + 2.0, 1.85, { vel: .55, from: 200, to: 9500 });
for (let t = T.burst - 1.0; t < T.burst - .16; t += B / 4) { const k = (t - (T.burst - 1.0)) / .85; s.tom(t, { f: 95 + 150 * k, vel: .3 + .5 * k }); }

/* 7 · burst (24): the loudest moment — silence first, then impact + sub + sparkle + a swell as the particles lock into the logo; chime when it is whole */
s.duck('music', [T.burst - .15], { depth: .95, attack: .03, release: .55 });
s.impact(T.burst, { size: 1.7, vel: .95 }); s.hit(T.burst + .02, { vel: .8 }); s.sub(T.burst, 'D1', 2.4, { vel: .3, drop: 1.6 }); s.kick(T.burst, { vel: 1.2 }); kicks.push(T.burst); s.sparkle(T.burst + .2, 1.8, { vel: .5 });
s.strings(T.burst, chord('D3', 'min'), 2.0, { vel: .42, attack: .1, release: 1.2 }); s.whoosh(T.burst + .05, 1.5, { vel: .4, from: 5000, to: 300, pan0: -.5, pan1: .5, send: .6 }); s.chime(T.burst + 1.45, ['D6', 'A6', 'D7'], { vel: .5 });

/* 8 · end (26–30): resolve on D major (add9), bell shimmer, ONE santur note, a long tail */
s.pad(T.end, chord('D3', 'maj9'), dur - T.end, { vel: .5, attack: .4, release: 2.2, cutoff: 2800, send: .6 }); s.strings(T.end, chord('D3', 'maj7'), dur - T.end, { vel: .32, attack: .5, release: 2 });
s.arp(T.end + .3, chord('D5', 'maj7'), 6, B, (t, m, i) => s.keys(t, m, .4, { kind: 'bell', vel: .26, pan: Math.sin(i) * .5, decay: 2.4, send: .6, echo: .3 })); s.santur(T.end + 1.0, 'F#4', 3, { vel: .45, pan: .1 }); s.santur(T.end + 1.5, 'D5', 3, { vel: .4, pan: -.1 });
s.sub(T.end, 'D1', 3, { vel: .22, drop: 1 }); s.sparkle(T.end + 1.2, 2, { vel: .3 });

s.duck('music', kicks, { depth: .4, attack: .01, release: .18 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 3, mix: .3 }, fadeOut: .5 });
