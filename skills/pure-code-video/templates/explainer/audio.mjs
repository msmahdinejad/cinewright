// audio.mjs — light tech music + UI sound effects, all placed from the cues in video.html.
// cues.sfx = [[sound, cue-or-seconds, options], …]: change a time in cues.t and the picture AND its sound move together.
import { Song, readCues, cueTime, chord, progression, note } from './lib/synth.mjs';

const C = readCues('video.html'), T = C.t, dur = C.duration;
const s = new Song({ dur, bpm: C.bpm, seed: 21 }), B = s.B, bar = 4 * B;

/* music: soft pads throughout, a gentle pulse from the demo, fuller beat on the dashboard */
const prog = progression('C4', 'major', 'I V vi IV I V');
prog.forEach((c, i) => s.pad(i * bar * 1.15, c, bar * 1.15 + .4, { vel: .3, attack: .4, release: .9, cutoff: 1800, send: .3 }));
for (let t = T.demo; t < dur - .5; t += B) {
  const full = t >= T.dash;
  if (full || Math.round((t - T.demo) / B) % 2 === 0) s.kick(t, { vel: full ? 1 : .7 });
  if (full && Math.round((t - T.dash) / B) % 2 === 1) { s.snare(t, { vel: .7 }); }
  s.hat(t + B / 2, { vel: full ? .45 : .3 });
}
s.duck('music', Array.from({ length: Math.ceil((dur - T.demo) / B) }, (_, i) => T.demo + i * B), { depth: .35 });
for (let t = T.dash; t < dur - .5; t += B / 2) s.bass(t, prog[Math.min(prog.length - 1, Math.floor(t / (bar * 1.15)))][0] - 12, B * .4, { vel: .6, cutoff: 700 });
s.arp(T.problem, chord('C5', 'maj7'), Math.floor(dur / (B / 2)), B / 2, (t, m, i) => { if (t > T.demo - .01 && (i % 2)) s.keys(t, m, .15, { kind: 'marimba', vel: .16, pan: Math.sin(i) * .5, echo: .25, send: .2 }); });

/* UI sound effects from the cue list */
for (const [name, ref, o = {}] of C.sfx || []) {
  const t = cueTime(C, ref);
  if (name === 'type') for (let k = t; k < (o.until ?? t + 1); k += (o.every ?? .1)) s.type(k + s.g() * .012, { vel: .35 + .2 * s.rnd() });
  else if (name === 'click') s.click(t, { vel: .9 });
  else if (name === 'pop') s.pop(t, { vel: .5, f0: 900 + 300 * s.rnd() });
  else if (name === 'whoosh') s.whoosh(t, o.dur ?? .6, { vel: .5 });
  else if (name === 'success') s.success(t);
  else if (name === 'chime') s.chime(t, ['C6', 'E6', 'G6', 'C7'], { vel: .5 });
  else if (typeof s[name] === 'function') s[name](t, o);
}
s.impact(T.cta, { size: .8, vel: .8 }); s.riser(T.cta - 1.2, 1.2, { vel: .35 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 1.8, mix: .22 }, fadeOut: .3 });
