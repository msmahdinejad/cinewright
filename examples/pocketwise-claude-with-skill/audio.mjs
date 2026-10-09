// audio.mjs — Pocketwise: warm lo-fi pop, UI foley, rising coin chimes, one breath of silence before "everyone's even".
// Everything is placed from the shared cues in video.html (change a time there and picture AND sound move).
import { Song, readCues, chord, progression, note } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, COIN = C.coin, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 33 }), B = s.B, bar = 4 * B;
const HUSH = T.coins + 2 * COIN.gap + (COIN.per - 1) * COIN.step + COIN.flight + .08;          // the last coin has landed → silence until the burst

/* harmony: one chord per bar (2 s): C · Am · F · G, twice, then C → G */
const prog = progression('C4', 'major', 'I vi IV V I vi IV V I V');
const chordAt = t => prog[Math.min(prog.length - 1, Math.floor(t / bar))];
prog.forEach((c, i) => { const t0 = i * bar; if (t0 >= HUSH - .4 && t0 < T.burst) return; s.pad(t0, c, bar + .5, { vel: .26, attack: .35, release: .9, cutoff: 1700, send: .32 }); });

/* 1 · pile (0 – 3): a low pulse under paper and pings */
for (let t = .5; t < T.phone - .2; t += B) s.kick(t, { vel: .38 });
s.impact(.15, { size: .45, vel: .7 }); s.impact(.45, { size: .4, vel: .75 });
for (const t of [.2, .5, .9, 1.3, 1.75, 2.2, 2.6]) s.whoosh(t, .22 + s.rnd() * .1, { vel: .16 });                     // paper rustle
for (const t of [.7, 1.15, 1.6, 2.05]) { s.pop(t, { vel: .6, f0: 980 }); s.chime(t + .02, ['E6'], { vel: .16 }); }    // message pings, one per bubble
for (let k = 0; k < 22; k++) s.tick(.6 + 2.3 * Math.pow(k / 21, .8), { vel: .16 });                                    // the unread badge counting up
s.whoosh(T.phone - .35, .55, { vel: .5 });

/* 2 · phone (3 – 7): the beat arrives, UI foley */
for (let t = T.phone; t < T.settle - .2; t += B) { if (Math.round((t - T.phone) / B) % 2 === 0) s.kick(t, { vel: .62 }); s.hat(t + B / 2, { vel: .26 }); }
s.duck('music', Array.from({ length: Math.ceil((T.settle - T.phone) / (2 * B)) }, (_, i) => T.phone + i * 2 * B), { depth: .32 });
s.arp(T.phone, chord('C5', 'maj7'), Math.floor((T.settle - T.phone) / (B / 2)), B / 2, (t, m, i) => { if (i % 2) s.keys(t, m, .16, { kind: 'marimba', vel: .15, pan: Math.sin(i) * .5, echo: .25, send: .2 }); });
for (let t = T.type; t < T.type + .75; t += .085) s.type(t + s.g() * .01, { vel: .3 + .2 * s.rnd() });                // "Pizza night"
for (let t = T.digits; t < T.digits + .9; t += .06) s.tick(t, { vel: .16 });                                          // the amount rolling up
[0, 1, 2, 3].forEach(i => s.pop(T.join + i * .22, { vel: .5, f0: 700 + i * 140 }));                                    // the four avatars joining
s.click(T.join + 1.0, { vel: .6 }); s.chime(T.join + 1.3, ['G5', 'C6'], { vel: .3 });                                // "Equally", then the per-head amount
s.click(T.split, { vel: .95 }); s.success(T.toast);
s.whoosh(T.settle - .35, .55, { vel: .55 });

/* 3 · settle (7 – 12.8): plates rise, coins fly, silence, then the burst */
for (let i = 0; i < 4; i++) s.pop(T.settle + .35 + i * .12, { vel: .55, f0: 520 + i * 90 });
s.riser(T.coins - .9, .9, { vel: .3 });
const NOTES = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7'];
const lands = [];
for (let d = 0; d < 3; d++) for (let k = 0; k < COIN.per; k++) { const dep = T.coins + d * COIN.gap + k * COIN.step; s.tick(dep, { vel: .22 }); lands.push(dep + COIN.flight); }
lands.sort((a, b) => a - b).forEach((t, i) => { s.chime(t, [NOTES[Math.min(NOTES.length - 1, Math.floor(i / 2))]], { vel: .32 + .02 * i }); s.pop(t, { vel: .3, f0: 1500 }); });
for (let t = T.settle + 1.0; t < HUSH - .3; t += B) { s.kick(t, { vel: .85 }); if (Math.round((t - T.settle) / B) % 2 === 1) s.clap(t, { vel: .45 }); s.hat(t + B / 2, { vel: .32 }); }
s.duck('music', Array.from({ length: 12 }, (_, i) => T.settle + 1.0 + i * B), { depth: .4 });
for (let t = T.settle + 1.0; t < HUSH - .3; t += B / 2) s.bass(t, chordAt(t)[0] - 12, B * .4, { vel: .55, cutoff: 700 });
const gap = []; for (let t = HUSH; t < T.burst - .03; t += .04) gap.push(t);                                          // overlapping ducks hold every bus (and the reverb tail) down: a real breath of silence
for (const bus of ['music', 'drums', 'sfx', 'verb', 'delay']) s.duck(bus, gap, { depth: .985, attack: .004, release: .07 });
s.impact(T.burst, { size: 1, vel: .95 });
s.chime(T.burst + .02, ['C6', 'E6', 'G6', 'C7'], { vel: .6 });
s.arp(T.burst, chord('C5', 'maj7'), 14, B / 4, (t, m, i) => s.keys(t + .05, m, .14, { kind: 'marimba', vel: .2, pan: Math.sin(i) * .6, echo: .25, send: .25 }));
s.whoosh(T.summary - .3, .5, { vel: .5 });

/* 4 · summary (12.8 – 16.8): light and confident */
for (let t = T.summary; t < T.end - .2; t += B) { s.kick(t, { vel: .55 }); s.hat(t + B / 2, { vel: .42 }); s.hat(t + B / 4, { vel: .2 }); s.hat(t + B * .75, { vel: .22 }); if (Math.round((t - T.summary) / B) % 2 === 1) s.clap(t, { vel: .34 }); }
s.duck('music', Array.from({ length: 8 }, (_, i) => T.summary + i * B), { depth: .35 });
for (let t = T.summary; t < T.end - .2; t += B) s.bass(t, chordAt(t)[0] - 12, B * .9, { vel: .45, cutoff: 600 });
for (let t = T.count; t < T.count + 1.5; t += .07) s.tick(t, { vel: .14 });
[1.7, 1.95, 2.2, 2.45].forEach((d, i) => s.pop(T.summary + d, { vel: .4, f0: 800 + i * 100 }));
s.riser(T.end - 1.3, 1.3, { vel: .3 }); s.sparkle(T.summary + .3, 2.4, { vel: .3, seed: 3 }); s.sparkle(T.summary + 2.6, 1.6, { vel: .25, seed: 5 });

/* 5 · end (16.8 – 20): the coin drops in; a resolved chord rings out */
s.impact(T.end, { size: .5, vel: .6 });
s.pop(T.drop, { vel: .5, f0: 1100 }); s.chime(T.drop + .05, ['G5', 'C6', 'E6', 'G6'], { vel: .55 });
s.pad(T.end, chord('C4', 'maj7'), dur - T.end, { vel: .4, attack: .5, release: 1.5, cutoff: 2200, send: .4 });
s.chime(T.end + 2.2, ['C6', 'G6', 'C7'], { vel: .38 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 2.0, mix: .24 }, fadeOut: .5 });
