// audio.mjs — the soundtrack of a motion-graphics film, scored from the SAME spec the picture is drawn from (video.html → <script id="cues">).
// Music: a mood (upbeat · chill · tech · cinematic) = chords + groove + bass + keys, ducked under the kick. Sound design: a whoosh into every cut, a soft thud on it,
// a pop for every item as it appears (same formula as mg.js: at + lead + i*step), counter ticks, a chime when a number lands, a hit on the logo, sparkle on the CTA.
// Change a time or an item in the spec and the sound moves with it. Run:  node audio.mjs
import { Song, readCues, chord, progression } from './lib/synth.mjs';

const C = readCues('video.html'), dur = C.duration, bpm = C.bpm || 120;
const s = new Song({ dur, bpm, seed: C.seed || 7 }), B = s.B, bar = 4 * B;
const scenes = C.scenes.map((sc, i, a) => ({ ...sc, i, at: sc.at ?? 0, end: a[i + 1]?.at ?? dur }));
const MOODS = {
  upbeat:    { key: 'C4', mode: 'major', prog: 'I V vi IV',     groove: 'house',  pad: .24, keys: 'marimba', bass: .5,  kick: .75 },
  chill:     { key: 'F4', mode: 'major', prog: 'ii7 V7 I vi7',  groove: 'lofi',   pad: .30, keys: 'ep',      bass: .42, kick: .62 },
  tech:      { key: 'A3', mode: 'minor', prog: 'i VI III VII',  groove: 'house',  pad: .22, keys: 'pluck',   bass: .6,  kick: .85 },
  cinematic: { key: 'D4', mode: 'minor', prog: 'i VI III VII',  groove: null,     pad: .42, keys: 'bell',    bass: 0,   kick: 0 },
};
const M = MOODS[C.mood] || MOODS.upbeat, bars = Math.ceil(dur / bar) + 1;
const chords = progression(M.key, M.mode, Array.from({ length: bars }, (_, i) => M.prog.split(' ')[i % M.prog.split(' ').length]).join(' '));

/* music — the energy follows the picture: calm under a quote or a chart, full on the lists and counters, biggest on the call to action */
const ENERGY = { title: .85, chips: 1, stats: 1, list: 1, fact: .95, hit: 1.02, chart: .7, quote: .45, logo: 1, cta: 1.12, words: 1.1 };
const energyAt = t => { let e = .8; for (const sc of scenes) if (t >= sc.at) e = ENERGY[sc.type] ?? 1; return e; };
chords.forEach((c, i) => s.pad(i * bar, c, bar + .4, { vel: M.pad * (.7 + .45 * energyAt(i * bar + bar / 2)), attack: .35, release: .9, cutoff: 1700, send: .3 }));
const g0 = dur >= 12 ? Math.ceil(Math.min(4, dur * .27) / bar) * bar : Math.ceil(1.0 / bar) * bar, gBars = Math.floor((dur - .6 - g0) / bar), allKicks = [];   // a film of 12 s or more has an arc: pads and keys first, the groove DROPS IN at ~4 s on a riser (the loudness range the QC asks for)
if (g0 >= 3) { s.riser(g0 - 1.2, 1.2, { vel: .32 }); s.impact(g0, { size: .55, vel: .6 }); }
if (M.groove && gBars > 0) {
  for (let b = 0; b < gBars; b++) { const t = g0 + b * bar, e = energyAt(t + bar / 2); allKicks.push(...(s.groove(M.groove, t, 1, { vel: M.kick * e }) || [])); if (M.bass) for (let q = 0; q < 8; q++) s.bass(t + q * B / 2, chords[Math.floor(t / bar)][0] - 12, B * .42, { vel: M.bass * e, cutoff: 700 }); }
  if (allKicks.length) s.duck('music', allKicks, { depth: .35 });
}
for (let b = 0; b < bars; b++) { const t0 = b * bar, c = chords[b], e = energyAt(t0 + bar / 2); s.arp(t0, [c[0] + 12, c[1] + 12, c[2] + 12, c[0] + 24], 8, B / 2, (t, n, i) => { if (i % 2 && t > .8 && t < dur - .6) s.keys(t, n, .16, { kind: M.keys, vel: .13 * e, pan: Math.sin(i + b) * .5, echo: .22, send: .2 }); }); }

/* sound design, scene by scene */
const items = sc => (sc.items || sc.lines || sc.words || sc.data || []);
for (const sc of scenes) {
  const { at, type, i } = sc, lead = sc.lead ?? .3, step = sc.step ?? B / 2, list = items(sc), it = k => at + lead + k * step;
  if (i > 0) { s.whoosh(at - .3, .5, { vel: .5 }); s.impact(at, { size: .35, vel: .45 }); }
  if (type === 'title') { list.forEach((_, k) => s.pop(at + .25 + k * .12 + .1, { vel: .5, f0: 700 + k * 120 })); s.impact(at + .35, { size: .5, vel: .6 }); s.chime(at + .25 + list.length * .12 + .2, ['G5', 'C6'], { vel: .3 }); }
  else if (type === 'chips') list.forEach((_, k) => { s.pop(it(k) + .05, { vel: .55, f0: 760 + k * 110 }); s.tick(it(k) + .3, { vel: .2 }); });
  else if (type === 'list') list.forEach((_, k) => { s.swipe(it(k) + .1 - .08, .22, { vel: .3 }); s.pop(it(k) + .1 + .35, { vel: .45, f0: 1100 + k * 80 }); });
  else if (type === 'stats') list.forEach((_, k) => { s.pop(it(k), { vel: .5, f0: 820 + k * 100 }); for (let q = 0; q < 17; q++) s.tick(it(k) + .15 + q * .075, { vel: .12 + q * .004 }); s.chime(it(k) + 1.55, ['C6', 'G6'], { vel: .28 }); });
  else if (type === 'quote') { s.riser(at + .1, .9, { vel: .18 }); (sc.text || '').split(/\s+/).forEach((_, k, a) => { if (k % 3 === 0) s.tick(at + .35 + k * .075, { vel: .16 }); }); s.chime(at + .9, ['E6', 'B6'], { vel: .3 }); }
  else if (type === 'fact') { const k = Math.max(.45, Math.min(1, (sc.end - at) / 2.8)); s.impact(at + .4 * k, { size: .45, vel: .6 }); for (let q = 0; q < 14; q++) s.tick(at + (.55 + q * .075) * k, { vel: .15 }); s.success(at + 1.7 * k, { vel: .4 }); }   // shot scale k: the same formula as MG.shotK in mg.js
  else if (type === 'hit') { const k = Math.max(.45, Math.min(1, (sc.end - at) / 2.8)), txt = String(sc.lines ? sc.lines.join(' ') : sc.text || ''), n = sc.lines ? sc.lines.length : (/s/.test(txt) && txt.length > 14 ? 2 : 1); for (let q = 0; q < n; q++) s.pop(at + (.2 + q * .1) * k, { vel: .55, f0: 880 + q * 170 + (i % 3) * 90 }); s.tick(at + .6 * k, { vel: .2 }); if (sc.sub) s.pop(at + .85 * k, { vel: .3, f0: 1250 }); }
  else if (type === 'chart') { list.forEach((_, k) => { s.pop(at + .35 + k * .14 + .1, { vel: .45, f0: 640 + k * 90 }); }); s.chime(at + 1.5, ['C6', 'E6', 'G6'], { vel: .3 }); }
  else if (type === 'logo') { const lk = Math.max(.6, Math.min(1, (sc.end - at) / 3.4)); s.riser(at, 1.0 * lk, { vel: .4 }); s.impact(at + 1.05 * lk, { size: 1, vel: .9 }); s.chime(at + 1.1 * lk, ['C6', 'E6', 'G6', 'C7'], { vel: .55 }); (sc.name || '').split('').forEach((_, k) => s.tick(at + (1.05 + k * .045) * lk, { vel: .18 })); s.whoosh(at + 1.85 * lk, .5, { vel: .35 }); }
  else if (type === 'cta') { s.sparkle(at + .3, 1.2, { vel: .35, seed: 2 }); s.pop(at + .6, { vel: .6, f0: 900 }); s.chime(at + .65, ['G5', 'C6', 'E6', 'G6'], { vel: .5 }); if (sc.button) s.pop(at + 1.45, { vel: .5, f0: 1200 }); }
  else if (type === 'words') { s.riser(at - .6, .6, { vel: .22 }); list.forEach((_, k) => { const t0 = at + k * (sc.step ?? B); s.impact(t0, { size: .4, vel: .7 }); s.clap(t0, { vel: .4 }); s.hat(t0 + B / 2, { vel: .35, open: true }); s.sparkle(t0 + .06, .5, { vel: .22, seed: 3 + k }); s.pop(t0 + .05, { vel: .5, f0: 900 + k * 90 }); }); }
}
/* the carried object: a pop when it appears, a swipe as it travels and a pop as it lands — scored from the same spec */
(C.carry?.keys || []).forEach((k, i) => { const d = k.dur ?? .75; if (i === 0) s.pop(k.at + .35, { vel: .5, f0: 880 }); else { s.swipe(k.at, d * .8, { vel: .28 }); s.pop(k.at + d * .92, { vel: .38, f0: 1000 }); } });
/* the end: a resolved chord that rings under the last image */
const last = scenes[scenes.length - 1]; s.chime(last.at + (last.type === 'cta' ? 1.9 : 1.0), ['C6', 'G6', 'C7'], { vel: .3 });
s.write('audio.wav', { lufs: -14, reverb: { rt60: 1.7, mix: .22 }, fadeOut: .5 });
