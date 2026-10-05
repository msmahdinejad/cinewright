# Sound reference — music, effects and mixing from math

Contents: [1 Setup](#1-setup) · [2 Timeline sync](#2-one-timeline-for-picture-and-sound) · [3 Instruments](#3-instrument-api) · [4 Theory helpers](#4-theory-helpers) · [5 Mixing & mastering](#5-mixing-and-mastering) · [6 Structure](#6-structure-the-energy-curve) · [7 Sound design for motion](#7-sound-design-for-motion) · [8 Recipes](#8-recipes) · [9 Persian modes](#9-persian-modes-and-instruments) · [10 Voice, TTS, supplied music](#10-voice-tts-and-supplied-music) · [11 Reading the QC](#11-verifying-a-mix-you-cannot-hear)

Everything is synthesized offline in Node (`lib/synth.mjs`, no samples, deterministic). You cannot listen, so build with **known-good recipes, sensible levels, and measurement** (§11).

## 1. Setup
```js
import { Song, readCues, cueTime, note, mtof, chord, scale, progression, PERSIAN, hzOf } from './lib/synth.mjs';
const C = readCues('video.html'), T = C.t;
const s = new Song({ dur: C.duration, bpm: C.bpm, seed: 7 });     // 48 kHz stereo; s.B = seconds per beat; s.rnd() is seeded
… instruments …
s.write('audio.wav', { lufs: -14, reverb: { rt60: 2.4, mix: .28 }, fadeOut: .3 });      // mix → master → WAV (16-bit, dithered)
```
`render.mjs` re-runs `audio.mjs` automatically when it is older than the page. Buses: `music`, `drums`, `sfx`, `voice` (+ hidden `verb`, `delay` sends). Every instrument accepts `{ vel, pan, bus, send (reverb), echo (ping-pong delay) }`.

## 2. One timeline for picture and sound
Put **named times** in the page's `<script id="cues" type="application/json">`; both sides read them. In `audio.mjs`:
```js
s.impact(T.hit); s.whoosh(cueTime(C, 'cards-0.3'), .6);          // "cue+offset" strings
for (const [name, ref, o = {}] of C.sfx || []) s[name]?.(cueTime(C, ref), o);   // a data-driven SFX list: ["click","click"], ["pop","dash+0.5"]
```
Tempo: `s.B = 60/bpm`. Use a BPM whose beat is a whole number of frames (60 fps: 120→30 f, 100→36 f, 90→40 f, 75→48 f; 30 fps: 120→15 f). If key events do not fall on your grid, *fit the tempo to the events* (e.g. pick a BPM so a bar line lands on the logo hit) or shift the cue to the nearest beat. Musical time with tempo changes (rubato/accelerando): compute beat→seconds with your own piecewise function and use it for **both** audio and picture.

## 3. Instrument API
Times in seconds; `n` = note name/MIDI (`'C#4'`, `'Bb2'`, `'Ed4'` quarter-flat, `'F+4'` quarter-sharp) or MIDI number.
| Group | Call | Key options (defaults) | Use |
|---|---|---|---|
| Drums | `kick(t,{f0:150,f1:46,decay:.38,drive:1.6})` `snare(t,{tone:190,decay:.2})` `clap(t)` `hat(t,{open})` `tom(t,{f:110})` `rim(t)` `sub(t,n,dur,{drop:1.7})` | `vel .. 1.25` | four-on-the-floor kick, backbeat snare/clap, 8th hats, 808 sub |
| Bass | `bass(t,n,dur,{wave:'saw'\|'square'\|'sine', cutoff:700, sub:.6, glide})` | | root notes on the beat, 8th pulses |
| Pads/strings | `pad(t,[notes],dur,{attack:.6,release:1.2,voices:5,detune:9,cutoff:1800,movement:.5})` `strings(t,[notes],dur,{attack:.25,vibrato:5.2})` `brass(t,[notes],dur)` `choir(t,[notes],dur,{vowel:'a'})` | `send .3–.5` | harmonic bed, swells, finales |
| Melodic | `lead(t,n,dur,{wave,cutoff,vibrato,glide,from})` `keys(t,n,dur,{kind:'ep'\|'bell'\|'marimba'\|'organ', decay})` `pluck(t,n,dur,{T60:2.2,bright:.5,courses:1..4,strike:.13})` `flute(t,n,dur,{breath:.7,vibrato:5.3})` `arp(t0,chord,count,step,(t,m,i)=>…,{order})` | | motifs, arpeggios, bells; `pluck` is Karplus–Strong tuned to < 1 cent (quarter-tones work); `courses:3` = santur/12-string |
| Transitions | `riser(t,dur,{from,to})` `downlifter(...)` `whoosh(t,dur,{from,to,pan0,pan1})` `swipe(t)` `impact(t,{size:.5–1.6})` `hit(t)` `glitch(t,dur)` `zap(t)` | | build-ups and hits |
| UI/foley | `click` `pop` `tick` `type` (keystroke) `chime([notes])` `success` `error` `sparkle(t,dur)` `shutter` `heartbeat` | | interface sounds |
| Beds | `drone(t,dur,note)` `babble(t0,t1,{f0,style:'dull'\|'clear'})` (formant "someone speaking" texture — placeholder, clearly not words) | | atmosphere, crowds |
| Helpers | `pattern(t0,'x..x.o.X',(t,vel)=>…,{unit,swing,humanize,repeat})` · `duck('music',times,{depth:.5})` · `human(t,.006)` · `g()` gaussian | | step sequencing, sidechain, humanising |
Levels are calibrated so `vel` ≈ 0.3–0.6 for beds, 0.8–1 for drums/hits sits sensibly; the master normalizes to the LUFS target afterwards, so balance *between* layers matters, not absolute level.

## 4. Theory helpers
```js
note('C#4') // 61      mtof('A4') // 440      chord('A3','min7')      scale('D3','dorian', 2)
progression('A3','minor','i VI III VII')   // roman numerals → chords (upper = major, lower = minor, add '7' / 'maj7')
SCALES: major minor dorian phrygian lydian mixolydian harmonicMinor melodicMinor majorPent minorPent blues wholeTone hijaz
chord qualities: maj min dim aug sus2 sus4 maj7 min7 dom7 dim7 m7b5 maj9 min9 add9 min11 6 min6 power
```
Harmony that works: minor loops `i–VI–III–VII` (epic/tech), `i–iv–VII–VI` (dark), major `I–V–vi–IV` (pop/uplift), `I–vi–IV–V` (nostalgic); end on the tonic; a suspended chord (`sus4`) before the resolve. Voice-lead by keeping pad chords in one octave (A3–E5); bass an octave or two below.

## 5. Mixing and mastering
`write()/mixdown()` does: bus gains → reverb (8-line FDN, `rt60`, `damp`, `mix`) and ping-pong delay → sidechain ducks → 24 Hz high-pass + 1.5 dB air shelf → gentle glue compressor → loudness normalise to `lufs` (BS.1770 gated, matches ffmpeg within 0.1 LU) → look-ahead limiter to `ceiling` (default −1.5 dBFS ⇒ ≈ −1 dBTP after AAC) → fades → 16-bit TPDF-dithered WAV.
Options: `lufs -14` (social; −16 speech-led; −23 broadcast), `reverb {rt60, mix, damp}` (room .6 s · hall 2.2 · cathedral 4.5), `delay {time, feedback, mix}`, `gains {music:-2, drums:0, sfx:1, voice:3}` (dB per bus), `air`, `glue:false`, `fadeOut`, `bits:24`, `stems('stems')` for per-bus WAVs (dry).
Mix rules of thumb: kick + bass own the low end (duck pads/bass under the kick 40–55 %); one lead element at a time in 1–4 kHz; sfx sit 3–6 dB under the music except the hero hit; keep reverb sends on pads/bells/impacts, not on kick/bass; leave 2–6 kHz alive (presence) — muddy mixes pile energy at 60–250 Hz; keep sub-bass (< 60 Hz) modest, phones cannot reproduce it and it steals headroom.

## 6. Structure: the energy curve
Build the *curve first* (per section: which layers are on), then fill it:
| Section | Layers |
|---|---|
| Intro / hook | pad or drone, one motif, riser into the first hit |
| Build | + hats, + bass pulse, arps opening (cutoff rising), risers before each scene change |
| Drop / hero | full drums, bass, lead/bells, impact + kick + chord; loudest 2–4 s |
| Breakdown (optional) | everything out but pad + one voice; a rising tom fill or riser |
| Resolve | tonic pad + strings, bell shimmer, long reverb tail, fade last |
Make loudness *move*: quiet intro (−6 to −8 dB vs drop), the biggest moment at ~65–75 %, then lower. A loudness range below ~2 LU means nothing changes (qc points it out).

## 7. Sound design for motion
Every visible event deserves a sound; the sound's *character* should match the motion: fast slide → `whoosh` (up-sweep for entering, down for leaving); landing/slam → `impact`/`hit` + `kick`; pop-in → `pop`; UI press → `click`; counting → `tick`s; typing → `type`; success → `success`/`chime`; light sweep → `sparkle`; scene change → `whoosh` 0.25 s early; anticipation → `riser`/`downlifter`; glitch cut → `glitch`. The hero: riser → **breath of silence (0.15–0.4 s, drop the pad)** → impact + chord + shimmer. Land audio hits on the same frame as the visual landing (visual arrives *on* the cue — see motion.md §4).

## 8. Recipes
```js
// Cinematic ambient (slow, 60–75 BPM): long pads + drone + bells, no drums until the hero
progression('D3','minor','i VI III VII').forEach((c,i)=>s.pad(i*bar, c, bar+1, {vel:.4, attack:1, release:1.6, cutoff:1200+300*i, send:.5}));
s.drone(0, dur, 'D1', {vel:.25});  s.impact(T.hero, {size:1.5});  s.chime(T.hero+.1, ['D6','F6','A6']);
// Tech / product (110–128 BPM): pulse + bells + clean beat
for (let t=T.drop; t<T.end; t+=s.B){ s.kick(t); s.hat(t+s.B/2,{vel:.5}); }  s.duck('music', kickTimes, {depth:.45});
s.arp(T.drop, chord('C5','maj7'), 32, s.B/4, (t,m,i)=>s.keys(t,m,.12,{kind:'marimba',vel:.2,echo:.25}));
// Lo-fi (80–90 BPM): keys(kind:'ep') chords, swung soft kick/snare, quiet 8th hats
s.pattern(t0, 'x...x...x..x....', (t,v)=>s.kick(t,{vel:v}), {swing:.12, humanize:.008});
s.pattern(t0, '..x...x...x...x.', (t,v)=>s.snare(t,{vel:.5*v}), {swing:.12});
// Epic trailer: low strings + brass stabs + toms + risers + huge impacts on hits, silence before the last hit
// Synthwave (100–118): saw bass 8ths, gated snare (snare + reverb send high), arps on lead(wave:'square'), pad with movement
```
Humanise (±6 ms timing via `s.human(t)`, velocity ±6 %) for anything meant to feel played; keep grid-exact for UI/tech.

## 9. Persian modes and instruments
`PERSIAN` holds cents-above-tonic tables from real compositions: `chahargah` [0,140,390,498,702,842,1092] (tonic C; koron on the 2nd and 6th), `esfahan` [0,204,294,498,702,853,996,1088] (tonic D), `mahur`, `shur` (approx); `koron = -50`, `sori = +50` cents. Play them with `pluck` and exact Hz:
```js
const D4 = 293.665, hz = c => hzOf(D4, c);                 // pluck accepts MIDI numbers; convert Hz→MIDI: 69 + 12*Math.log2(f/440)
const m = f => 69 + 12*Math.log2(f/440);
s.pluck(t, m(hz(PERSIAN.esfahan[5])), 2, {courses: 3});     // B-koron, a real quarter-tone (fractional MIDI is supported)
```
Timbres: **santur** = `pluck(courses:3, T60:3.5, strike:.13)` with tremolo (repeat strikes 13 Hz); **ney** = `flute(breath .7, vibrato 5.4)`, slow attack, delayed vibrato; **tar/setar** = `pluck(courses:2, bright:.7)`; **kamancheh** = `strings(voices:3, vibrato 6)` with glides via `lead(glide)`; **daf** = `kick`-like membrane + `hat(open)` jingles; **tombak** = `tom(f:170)` (tom) + `rim`/`click` (bak), with `riz` rolls as 16th ghost notes. Rhythms: 6/8 (`pattern` with unit = B/3), 7/8 tension before a climax, reng-style accelerando at the end (tempo map). Add a long hall reverb (`rt60 4–4.6`). Compose as data first (a JSON score) and derive both audio and picture from it, like the reference films.

## 10. Voice, TTS and supplied music
- **A user-supplied song or voice-over:** copy it to `audio.wav` (any format ffmpeg reads; `--audio file` also works), run `node tools/analyze-audio.mjs audio.wav` → `envelopes.json` (levels, 32-band spectrum, onsets, beat grid) and drive visuals with `K.audioData` (`music` template). Use `--stems dir` for per-instrument sync.
- **Voice-over without recordings:** ask whether the user has one; otherwise design *caption-led* video (words on screen, `babble` texture or none). OS speech is an option only if it can speak the language: Windows `System.Speech` (PowerShell `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).SetOutputToWaveFile('vo.wav')`), macOS `say -o vo.aiff "text"`, Linux `espeak-ng -w vo.wav "text"`. Persian voices are usually absent — do not promise one. Cloud TTS only if the user supplies a key and asks.
- **Ducking music under voice:** `s.duck('music', voiceStartTimes, {depth:.5, release:.4})`, or lower the music bus (`gains:{music:-6}`).

## 11. Verifying a mix you cannot hear
`node tools/qc.mjs audio audio.wav` prints loudness (target −14 LUFS), true peak (≤ −1), silence gaps, a per-section **band table**, `qc/spectrogram.png`, `qc/waveform.png`, and an **energy curve** (one bar per second).
- Table columns are dB relative to the section's total. Healthy: sub −7…−12, low −4…−8, lowmid −9…−14, mid −14…−19, presence −18…−24, air −20…−28. `low` ≈ −3 or higher with presence < −25 → **muddy**: cut pad/bass low end, raise filter cutoffs. Presence < −32 → **dull**: raise `cutoff`, add hats/bells.
- The energy curve should rise toward the hero and dip after; flat = add dynamics.
- Spectrogram: vertical lines = transients (are they on your cue times?); a solid band under 250 Hz = wall of bass; horizontal lines = sustained tones.
- After changing `audio.mjs`, re-run `node audio.mjs` then `qc audio`; iterate at least once.
- Sync sanity: transients in the spectrogram at the cue times (kick lines every beat), and `sheet --times cue-0.033,cue,cue+0.033` shows the visual landing on the cue frame.

## 10. v2 additions (Persian palette, textures, grooves)
`tombak(t, 'dom'|'tak'|'ka'|'roll')` and `daf(t, 'dom'|'bam'|'ring')` (synthesised goblet/frame drums) · `santur(t, note, dur)` (hammered strings) · `ney(t, note, dur)` (breathy reed) · `gong(t)` · `ambience(t, dur, 'wind'|'rain'|'room')` · `crackle(t, dur)` (vinyl) ·
`groove('house'|'trap'|'dnb'|'breakbeat'|'lofi'|'halftime'|'sixeight', t0, bars, {vel, swing})` returns the kick times for `duck`. Quarter-tone note names: `'Ed4'` (E quarter-flat, koron), `'E+4'` (quarter-sharp, sori); modes in `PERSIAN` (cents) and `SCALES.hijaz`.
Tested recipes with audible results: `node scripts/atlas.mjs list sound` (`sfx-hit-stack`, `beat-persian-sixeight`, `persian-santur-melody`, `beat-house-groove`, …); render any to WAV with `atlas.mjs wav <id>` and measure it with `qc.mjs audio`.
The percussion/instrument models are approximations, not recordings — say so when a Persian-music authenticity claim matters.
