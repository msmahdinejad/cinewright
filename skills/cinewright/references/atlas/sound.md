# Sound — the half of the film people feel before they see it

Audio is synthesised offline by `lib/synth.mjs` (no samples, no dependencies, deterministic): drums, bass, pads, strings, keys, plucks (santur-style), ney/flute, choir, risers, impacts, UI sounds, glitches, ambience; a reverb/delay/ducking/loudness master chain (`s.write('audio.wav', { lufs: -14 })`).
The soundtrack is built from the **same cue times as the picture** (`<script id="cues">` in `video.html`, read with `readCues`): every hit, cut and reveal is a number both files share, so picture and sound cannot drift apart.
Rules that separate "music video" from "slideshow with a loop": (1) **one idea per section** (build → hit → groove → breakdown → drop → resolve) · (2) **an event for every important visual**: whoosh into a cut, hit on the logo, tick/pop on UI, riser into a reveal · (3) **space**: pull the music out for 0.1–0.4 s before the biggest hit (`s.duck`) · (4) **dynamics**: the loudest moment is the hit, not the whole film — sidechain the pads to the kick · (5) master to −14 LUFS with `s.write` and verify with `qc.mjs audio`.
Atlas recipes below are `js audio` blocks run by `atlas.mjs test` (they must produce sound); inside them `s` = Song, `B` = seconds per beat (0.5 at 120 BPM), `lib` = the module (`lib.chord`, `lib.note`, `lib.scale`, `lib.PERSIAN`…).

## sfx-hit-stack — The logo hit (layers that make a hit feel big)
tags: sound sfx hit impact logo stack riser sub chime duck cinematic
use: the loudest moment of the film: a logo/word landing, the "drop", the reveal. A single `impact` is thin — stack: riser → silence → impact + sub + click + chime + pad
how: riser builds into the hit; `s.duck('music', [t - .15], {depth: .8})` pulls the music out just before; at the hit: `impact` (noise + body), `sub` with a downward drop (the felt part), `click` (the attack you hear on laptop speakers), a bright `chime` and a pad swell for the tail.
pair: particles-burst-spark, cam-punch-hits, word-slam
```js audio
const { chord } = lib; s.riser(1.2, 1.7, { vel: .5 }); s.duck('music', [2.85], { depth: .8, attack: .05, release: .4 });
s.impact(3, { size: 1.4, vel: .9 }); s.sub(3, 'F1', 2.5, { vel: .4, drop: 1.4 }); s.click(3, { vel: .8 }); s.chime(3.02, ['F5', 'Ab5', 'C6', 'F6'], { vel: .5 });
s.pad(3, chord('F3', 'min9'), 4, { vel: .4, attack: .1, release: 1.5, cutoff: 2400, send: .5 });
```

## sfx-ui-sounds — Tick, pop, type, swipe, success, error
tags: sound sfx ui tick pop type swipe click success error interface product
use: every interface moment: cursor clicks, typing, toasts, toggles, results. Sync each to the exact frame of the visual (read the time from the same cue)
how: tiny, dry sounds at low level (0.2–0.5), panned toward where the thing is on screen; `type` has randomised pitch per call so keystrokes don't sound machine-gunned; `success` is a rising 4-note bell figure.
```js audio
[.2, .32, .45, .55, .7, .8].forEach((t, i) => s.type(t, { vel: .45, pan: -.2 + i * .05 })); s.click(1.2, { vel: .6 }); s.pop(1.6, { vel: .5, pan: .3 }); s.swipe(2.2, .25, { pan0: -.5, pan1: .5 });
s.tick(3, { vel: .4 }); s.tick(3.2, { vel: .4 }); s.success(4, { vel: .5 }); s.error(5.5, { vel: .5 });
```

## sfx-whoosh-set — Whooshes for cuts and moves
tags: sound sfx whoosh swoosh transition cut motion pan air
use: under every fast move and transition (whip, slide, zoom): start the whoosh ~0.3 s BEFORE the cut so its peak lands on it
how: `s.whoosh(t, dur, {from, to, pan0, pan1})` is band-passed noise sweeping in frequency and pan. Short bright (to ≈ 6 kHz) for small UI moves, long low-to-high for scene cuts, high-to-low (`downlifter`) for things leaving.
```js audio
s.whoosh(.7, .5, { from: 300, to: 5000, pan0: -.7, pan1: .7, vel: .6 }); s.whoosh(2.2, .9, { from: 200, to: 3000, vel: .7 }); s.downlifter(4, 1.2, { vel: .5 }); s.whoosh(5.7, .25, { from: 900, to: 7000, vel: .35 }); s.hit(6.0, { vel: .6 });
```

## sfx-riser-drop — Build, silence, drop
tags: sound sfx riser build tension drop silence energy bass edm trailer
use: the structure of almost every good 15–30 s video: 2–4 s of rising tension, 0.1–0.3 s of near-silence, then the drop (groove + hit)
how: `riser` + a snare/tom roll accelerating toward the drop, `duck` the music just before, then `impact` + `sub` + the full groove from the next beat.
```js audio
const kicks = []; s.riser(0, 3.7, { vel: .55, from: 200, to: 9000 }); for (let t = 2.2; t < 3.6; t += B / (t < 3 ? 2 : 4)) s.tom(t, { f: 90 + 120 * (t - 2.2) / 1.4, vel: .3 + .5 * (t - 2.2) / 1.4 });
s.duck('music', [3.8], { depth: .95, attack: .02, release: .5 }); s.impact(4, { size: 1.5, vel: .9 }); s.sub(4, 'F1', 3, { vel: .45, drop: 1.6 }); kicks.push(...s.groove('house', 4, 2)); s.duck('music', kicks, { depth: .4 });
s.pad(4, lib.chord('F3', 'min7'), 4, { vel: .35, send: .5 });
```

## sfx-glitch-stutter — Digital glitch and zaps
tags: sound sfx glitch stutter digital error zap cyber transition
use: under glitch transitions, data/hacker moments, "system" beats; short bursts (0.15–0.4 s) at cut points
how: `s.glitch(t, dur)` is bit-crushed random hold noise; `s.zap` is a descending laser; a rapid run of `tick`s gives a stutter. Keep them quiet and brief; one every 2–3 s at most.
```js audio
s.glitch(.6, .3, { vel: .5 }); s.zap(1.2, { vel: .4 }); for (let i = 0; i < 8; i++) s.tick(2 + i * .045, { vel: .3 + i * .03 }); s.glitch(3.2, .2, { vel: .5 }); s.zap(3.6, { f0: 5000, f1: 200, dur: .35, vel: .4 }); s.hit(4, { vel: .6 });
```

## sfx-heartbeat-tension — Low tension bed
tags: sound sfx heartbeat tension drone suspense dark dread horror emotional
use: suspense, "something is about to happen", emotional or serious moments; the opposite of a groove
how: a deep drone with slow filter movement, two-thump heartbeats at 60–70 BPM that speed up, a sparse high sparkle, and a long riser into whatever comes next.
```js audio
s.drone(0, 8, 'D1', { vel: .35, cutoff: 200, movement: .8 }); [.5, 1.5, 2.5, 3.4, 4.2, 4.9, 5.5, 6.0].forEach((t, i) => s.heartbeat(t, { vel: .5 + i * .05 })); s.sparkle(2, 4, { vel: .25 }); s.riser(5.5, 2.4, { vel: .4, from: 120, to: 3000 });
```

## beat-house-groove — Four-on-the-floor with sidechain
tags: sound beat house four on floor groove drums bass sidechain energy edm dance
use: confident, forward-moving product/tech/launch films at 120–128 BPM; the default "modern" energy
how: `s.groove('house', t0, bars)` plays kick/hats/claps and returns the kick times; a bass note on every 8th, a chord pad, and `s.duck('music', kicks)` makes the pad breathe with the kick (the pumping you hear in every dance track).
```js audio
const { chord } = lib, kicks = s.groove('house', 0, 4); for (let t = 0; t < 8; t += B / 2) s.bass(t, ['F1', 'F1', 'Ab1', 'F1'][Math.round(t / (B / 2)) % 4], B / 2 * .9, { vel: .5, cutoff: 600 + 400 * (t / 8), sub: .6 });
for (let b = 0; b < 4; b++) s.pad(b * 4 * B, chord(['F3', 'Db3', 'Ab3', 'Eb3'][b], 'maj7'), 4 * B + .5, { vel: .38, send: .4 }); s.duck('music', kicks, { depth: .45, release: .2 });
```

## beat-trap-halftime — 140 BPM half-time with 808 sub
tags: sound beat trap hiphop halftime 808 hats bass urban modern
use: urban/modern/streetwear/sport reels; heavy sub, snappy rolling hi-hats, snare on beat 3
how: `groove('trap')` supplies the pattern (kicks, snare+clap, 16th hats with a roll); a long `sub` per bar with a pitch drop is the 808; add a high bell arp for colour.
```js audio
const kicks = s.groove('trap', 0, 4); s.pad(0, lib.chord('F3', 'min7'), 8, { vel: .3, send: .5 }); lib.chord('F5', 'min7').forEach((m, i) => s.arp(i * B, [m], 1, 1, (t, n) => s.keys(t, n, .3, { kind: 'bell', vel: .2, decay: 1.4 })));
for (let b = 0; b < 4; b++) s.sub(b * 4 * B, ['F1', 'Db1', 'Ab0', 'Eb1'][b], 3.5 * B, { vel: .5, drop: 1.2 }); s.duck('music', kicks, { depth: .35 });
```

## beat-dnb-breaks — Drum & bass / breakbeat energy
tags: sound beat dnb breakbeat drums fast energy chase action
use: fast cuts, chase/race/"speed" themes, high-energy montages (170 BPM feel at tempo 170; here 120 BPM breakbeat)
how: `groove('breakbeat')` (or 'dnb' at bpm 170) + a reese-like bass (two detuned saws via `bass` with glide) and a sparse pad for contrast.
```js audio
const kicks = s.groove('breakbeat', 0, 4); for (let b = 0; b < 4; b++) s.bass(b * 4 * B, ['F1', 'Ab1', 'Eb1', 'F1'][b], 3.6 * B, { vel: .55, cutoff: 500, glide: .05, sub: .8, wave: 'saw' }); s.pad(0, lib.chord('F3', 'min'), 8, { vel: .3, send: .5 }); s.duck('music', kicks, { depth: .4 });
```

## beat-lofi-chill — Lo-fi keys and vinyl
tags: sound beat lofi chill calm study keys vinyl crackle warm soft mellow
use: calm, friendly, "everyday" or reflective films at 70–90 BPM; a warm bed under voice-over
how: soft swung drums (`groove('lofi', …, {swing})`), jazzy 7th/9th chords on the electric piano, a sine-ish bass, `crackle` for vinyl, low reverb.
```js audio
const { chord } = lib; s.groove('lofi', 0, 4, { swing: .2 });
[['D3', 'min9'], ['G3', 'dom7'], ['C3', 'maj9'], ['F3', 'maj7']].forEach(([r, q], i) => chord(r, q).forEach(m => s.keys(i * 4 * B, m, 3.8 * B, { kind: 'ep', vel: .22, send: .35 })));
['D2', 'G2', 'C2', 'F2'].forEach((n, i) => s.bass(i * 4 * B, n, 3 * B, { vel: .4, cutoff: 300, wave: 'sine', sub: .3 })); s.crackle(0, 8, { vel: .22 });
```

## beat-persian-sixeight — Persian-flavoured 6/8 (tombak + daf + santur + ney)
tags: sound beat persian iranian sixeight 68 tombak zarb daf santur ney shur rhythm world folk
use: films for Persian audiences or any film that should feel Iranian/Middle-Eastern: celebrations, heritage + technology, Nowruz-like warmth. An approximation of the idiom — a native musician will refine it
how: `groove('sixeight')` = tombak (dom · tak · ka) + daf (dom, bam, ring shake) in 6/8; melody in **Shur** on D with quarter-flat E (`'Ed4'`, one quarter-tone lower than E) played on `santur`, and a held D drone on `ney`. PERSIAN scale tables (`lib.PERSIAN`) give cents if you want to retune by hand.
pair: gfx-girih-reveal, text words in Persian, particles-dust-ambient
```js audio
const bar = 3 * B; s.groove('sixeight', 0, 6, { vel: .6 }); const m = ['D4', 'Ed4', 'F4', 'G4', 'A4', 'Bb4', 'A4', 'G4', 'F4', 'Ed4', 'D4']; m.forEach((n, i) => s.santur(.1 + i * B * .5 + (i > 5 ? B * .5 : 0), n, 1.2, { vel: .85 }));
s.ney(0, 'D3', bar * 2 - .3, { vel: .4 }); s.ney(bar * 2, 'A3', bar - .2, { vel: .4 }); s.ney(bar * 3, 'D3', bar * 2, { vel: .4 }); s.drone(0, 8, 'D2', { vel: .1, cutoff: 260 });
```

## persian-santur-melody — A Shur phrase on santur with ney drone
tags: sound persian santur melody shur quarter tone ney drone modal scale mode microtone
use: a lyrical Persian theme: openers, emotional beats, endings. Quarter-tones give the character: `'Ed4'` = E lowered by a quarter tone (koron), `'E+4'` = raised (sori)
how: note names accept `d` (quarter-flat) and `+` (quarter-sharp); `lib.scale('D4','hijaz')` and `lib.SCALES` have other modes, `lib.PERSIAN.shur / chahargah / mahur / esfahan` list cents above the tonic. Let phrases breathe: long final note + silence.
```js audio
const ph = [['A4', 0], ['G4', .5], ['F4', 1], ['Ed4', 1.5], ['D4', 2], ['Ed4', 3], ['F4', 3.5], ['G4', 4], ['A4', 4.5], ['Bb4', 5], ['A4', 5.5], ['G4', 6]];
ph.forEach(([n, t]) => s.santur(t * B + .1, n, 1.4, { vel: .55, pan: .2 })); s.ney(2.6, 'D4', 3.4, { vel: .35 }); s.drone(0, 8, 'D2', { vel: .2, cutoff: 240 });
```

## pad-cinematic-swell — Strings and pad swell
tags: sound pad strings swell cinematic emotional epic build orchestral ambient
use: openers, emotional beats, quiet-to-loud arcs; the sound of "something important is beginning"
how: a minor 9th pad with a slow attack, `strings` entering a bar later, a sub note, a high `sparkle`, and a downbeat `hit` at the peak; the long reverb (`write(…, {reverb:{rt60:3.2, mix:.32}})`) is part of the sound.
```js audio
const { chord } = lib; s.pad(0, chord('F3', 'min9'), 8, { vel: .42, attack: 2.4, release: 2, cutoff: 1400, movement: .8 }); s.strings(2, chord('F3', 'min'), 6, { vel: .3, attack: 2, release: 1.5 }); s.sub(0, 'F1', 8, { vel: .22 });
s.sparkle(3, 4, { vel: .3 }); s.riser(4, 3.6, { vel: .35 }); s.hit(7.6, { vel: .7 }); s.chime(7.6, ['F5', 'Ab5', 'C6'], { vel: .4 });
```

## arp-synthwave — Saw arps with delay
tags: sound arp synthwave retro 80s saw delay lead neon night drive
use: neon/retro/night-city/tech scenes; a forward-moving melodic bed with echo
how: `s.arp(t0, chordNotes, count, step, fn)` calls `fn(time, midi, i)` for each note; use `lead` (saw, filter, vibrato, echo) and a pumping 8th-note bass; pair with `groove('house')` or a simple kick.
```js audio
const { chord } = lib; s.groove('halftime', 0, 4); for (let b = 0; b < 4; b++) s.arp(b * 4 * B, chord(['F4', 'Db4', 'Ab4', 'Eb4'][b], 'maj7'), 16, B / 4, (t, m, i) => s.lead(t, m + (i % 4 === 3 ? 12 : 0), B / 4 * .9, { vel: .22, cutoff: 2200 + 400 * (i % 4), echo: .35, send: .3 }));
for (let t = 0; t < 8; t += B / 2) s.bass(t, ['F1', 'Db1', 'Ab1', 'Eb1'][Math.floor(t / (4 * B)) % 4], B / 2 * .8, { vel: .45, cutoff: 700 });
```

## outro-resolve — Resolution with bell shimmer
tags: sound outro ending resolve chord bells shimmer tail calm end card
use: the last 3 seconds: the chord resolves to major/open, bells shimmer, everything rings out into reverb — a sound people remember as "the end"
how: a maj9 pad + strings sustain, a slow bell arpeggio on the chord tones, a soft sub, a final `sparkle`; end the file with a fade (`s.write(…, {fadeOut: .5})`); never end on a cut-off.
```js audio
const { chord } = lib; s.pad(0, chord('F3', 'maj9'), 6, { vel: .5, attack: .5, release: 2.2, cutoff: 2600, send: .6 }); s.strings(0, chord('F3', 'maj7'), 6, { vel: .32, attack: .6, release: 2 });
s.arp(.3, chord('F5', 'maj7'), 6, B, (t, m) => s.keys(t, m, .4, { kind: 'bell', vel: .26, decay: 2.6, send: .6, echo: .3 })); s.sub(0, 'F1', 3, { vel: .3, drop: 1 }); s.sparkle(1.5, 2, { vel: .35 });
```

## ambience-wind-air — Atmosphere beds
tags: sound ambience wind rain room atmosphere space texture gong nature calm
use: under quiet establishing shots, nature/space/meditative films; fills silence with life so the mix never goes dead
how: `s.ambience(t, dur, 'wind'|'rain'|'room', {vel})` is filtered noise with slow movement; a distant `gong`, a low drone, occasional `sparkle` complete a world.
```js audio
s.ambience(0, 8, 'wind', { vel: .35 }); s.ambience(2, 6, 'room', { vel: .15 }); s.drone(0, 8, 'A1', { vel: .25, cutoff: 200 }); s.gong(.4, { vel: .5, f: 110 }); s.sparkle(4, 3, { vel: .2 });
```

## voice-babble — Stand-in speech for talking scenes
tags: sound voice babble speech talking murmur dialogue crowd placeholder translation
use: a "person talking" bed when you have no voice-over (translation/dubbing demos: one babble in a dull timbre for the original, a brighter one for the dub); never use as a substitute for real narration if the story depends on words
how: `s.babble(t0, t1, {f0, style, pan, gain, seed})` generates syllable-like formant bursts with phrase rhythm. `style: 'dull' | 'bright'`, different `f0` (115 vs 190) and `pan` make two speakers.
```js audio
s.babble(.2, 3.6, { f0: 115, style: 'dull', pan: -.4, gain: 1, seed: 1 }); s.babble(4.0, 7.4, { f0: 190, style: 'bright', pan: .4, gain: 1, seed: 2 }); s.pad(0, lib.chord('A3', 'min7'), 8, { vel: .18, send: .5 });
```

## mg-score-from-spec — Music mood and sound design from the same spec
tags: motion graphics sound music mood score whoosh pop tick chime sync spec audio
use: scoring a motion-graphics film without hand-placing a single sound: `mood` (upbeat · chill · tech · cinematic) chooses chords, groove, bass and keys; every scene start gets a whoosh + thud, every item a pop (same time formula as the picture), counters tick, the logo hits, the CTA sparkles
how: edit the spec and re-run `node audio.mjs`; if a moment needs more, add events at the bottom of audio.mjs with `s.pop`, `s.impact`, `s.chime`, `s.riser` at times read from the spec
avoid: music louder than the pops; leaving the default mood when the subject is calm (use `chill` or `cinematic`)
