# Motion reference — making movement feel expensive

Contents: [1 Principles in code](#1-the-principles-in-code) · [2 Easing chooser](#2-easing-chooser) · [3 Timing table](#3-timing-table) · [4 Arrive on the beat](#4-arrive-on-the-beat) · [5 Text animation](#5-text-animation-catalog) · [6 Camera](#6-camera) · [7 Transitions](#7-transitions) · [8 Choreography](#8-choreography) · [9 Secondary motion](#9-secondary-motion-and-life) · [10 Motion blur](#10-motion-blur) · [11 Rhythm](#11-rhythm-and-hits) · [12 Mistakes](#12-common-mistakes)

All snippets use `kit.js` (`K`, `K.E` easings). `lt` = seconds since the scene/element started; every value is a function of it.

## 1. The principles, in code
| Principle | How |
|---|---|
| Squash & stretch | `K.slam(g, lt, x, y, draw, {from:2.4})` (stretched in flight, squashed on impact, damped wobble); or `sx = 1 + k, sy = 1 - k` with `k = .17*K.wobble(lt, {f:4, decay:8})` |
| Anticipation | a small move the *opposite* way first: `E.inBack`, or scale 1 → .94 over 0.12 s before a punch; a 0.13 s dark dip / silence before the hero hit |
| Follow-through & overlap | children start later and settle later: `p = ease(prog(lt - i*.07, 0, .5))`; loose parts use `K.wobble` |
| Slow-in / slow-out | never `lin` (except rotation, tickers): pick from §2 |
| Arcs | curved paths: give `UI.cursor` an `arc` value; interpolate along a quadratic/cubic Bézier instead of a line |
| Staging | one hero mover per moment; dim (`alpha .5`) or blur everything else |
| Secondary action | breathing glow, dust, blinking caret, ripple after a click (§9) |
| Timing | §3 |
| Exaggeration | overshoot 4–10 % for professional UI, 15–25 % for playful; squash ≤ 17 % |

## 2. Easing chooser
| Situation | Use |
|---|---|
| Something *arrives* (title, card, number) | `E.outExpo` (decisive) · `E.outCubic` (gentle) · `E.outBack` or `E.backOut(1.2)` (a friendly pop) |
| Something *leaves* | `E.inCubic` / `E.inBack`, shorter than the entrance |
| A move inside a scene, camera moves | `E.inOutCubic`, `E.inOutQuint`, `K.smootherstep` |
| Springy UI, toggles | `K.spring(t, {f:2.4, z:.32})` (closed form damped oscillator, 0→1, overshoots) |
| Logo bounce | `E.outElastic` |
| Counters, chart draw-on | `E.outExpo` / `E.inOutCubic` |
| Breathing, idle | `Math.sin` |
| Custom feel | `E.bezier(.2,.8,.2,1)` (CSS cubic-bezier) |
| Linear is right for | continuous rotation, scrolling tickers, waveforms |
Pick **one easing family per film** (e.g. outExpo in, inCubic out, outBack for pops) — consistency reads as brand.
```js
const p = K.seg(lt, 0.2, 0.7, K.E.outExpo);        // 0→1 between 0.2 s and 0.7 s
g.globalAlpha = K.clamp(p*3);  y = y0 + (1-p)*60;  // fade + rise
const v = K.keyframes(lt, [[0,0],[.6,1,K.E.outBack],[1.4,1,K.E.inCubic],[1.8,0]]);   // in – hold – out envelope
```

## 3. Timing table (seconds)
| What | Duration |
|---|---|
| press / toggle / micro feedback | 0.12–0.20 |
| UI element enters | 0.30–0.45 |
| title / hero word enters | 0.40–0.60 (slam impact at ~0.28) |
| exit | 0.20–0.30 |
| scene transition | 0.25–0.40 |
| stagger between siblings | 0.06–0.12 (words 0.07 · cards 0.12–0.25, ideally on beat subdivisions) |
| settle after overshoot | 0.15–0.40 |
| hold after text is readable | ≥ 0.8 (1.2 s + 0.3 s per word beyond 4) |
| flash decay | 0.08–0.15 |
| shockwave ring / sparks | 0.7–1.0 / 1.0–1.4 |
| camera push-in (subtle) | whole scene, 2–6 % total |
| camera punch on a hit | +2–3 % scale, decay 0.12–0.15 s |
At 30 fps one frame is 33 ms: anything shorter than 0.1 s is 3 frames — make it deliberate (a hit) or lengthen it.

## 4. Arrive on the beat
Audiences feel sync at the *impact*, not at the start. Start the move early so it **lands** on the cue: for a slam whose impact is 0.28 s after it starts, call `K.slam(g, t - (T.hit - 0.28), …)`. For tweens, end = cue time: `K.seg(t, T.hit - .35, T.hit, E.outCubic)`. For the sound, place the impact/kick **at** the cue time. Check with `sheet --times hit-0.033,hit,hit+0.033` (one frame before, on, after): the frame *on* the cue must show the landing.

## 5. Text animation catalog
| Effect | API | Notes |
|---|---|---|
| word by word | `K.words(g, str, cx, y, lt, {size, each:.07, dur:.55, dy})` | RTL-aware (first word rightmost), keeps Persian joins |
| per character | `K.chars(...)` | Latin only — auto-falls back to words for Arabic script |
| slam | `K.slam(g, lt, x, y, () => K.text(g, s, 0, 0, o))` | one big word per beat |
| typewriter | `K.typed(str, p)` | graphemes, Persian-safe; add a caret |
| decode / scramble | `K.scramble(str, p, seed, frameIndex)` | Latin symbols set; ends on the true string |
| blur-in | `g.filter = 'blur(' + (1-p)*12 + 'px)'` around `K.text` | reset `g.filter='none'` |
| mask reveal | clip a rect growing from the reading edge (right edge for RTL) | see below |
| gradient sweep | `fill: (c,{x0,x1}) => K.gradient(c, x0,0,x1,0, stops)` | gradient follows the measured text |
| glow pulse | `glow:{color, blur: 30*(1+.4*K.pulse(t,HITS,.12))}` | keep blur < 0.25 × size |
| tracking-in (Latin) | `spacing: (1-p)*40` | never on Arabic script |
| counter | `K.fmtNum(Math.round(v*p), {fa})` | ease-out; units smaller |
```js
// mask reveal that respects reading direction
function reveal(g, x0, x1, y0, y1, p, rtl, draw) { g.save(); g.beginPath(); const w = (x1 - x0) * p; g.rect(rtl ? x1 - w : x0, y0, w, y1 - y0); g.clip(); draw(); g.restore(); }
```
Text must not move while it is being read: enter → hold still (or breathe ±1 %) → exit.

## 6. Camera
Apply once per frame around the whole scene: `K.camera(g, W, H, {zoom, rot, x, y, shake})` inside `save()/restore()`. Recipes:
```js
const zoom  = (1 + .025 * t / DUR) * K.punch(t, HITS, {amp:.022, decay:.14});   // slow push-in + punch on every hit
const shake = K.shake(t, 9 * u * K.pulse(t, HITS, .07), 32);                       // decays with the hit
const drift = [12 * Math.sin(t*.31), 8 * Math.sin(t*.23 + 1)];                    // hand-held float, ≤ 12 px
```
- **Never leave the camera still**: minimum a 1–3 % push or drift per scene.
- **Parallax:** translate each layer by `camX * depth` (background 0.2, subject 1, foreground dust 1.6) — depth without 3D.
- **3D:** `K.cam3({x,y,z,yaw,pitch,fov,W,H})` + `K.drawFaces`, or the `shader`/`particles` templates.
- **Whip pan:** 0.15 s fast slide with `Post` `zoomBlur` or ghosted `K.slide`.
- **Rack focus:** blur the background layer (`g.filter` on a pre-rendered layer) as the subject sharpens.
- **Dolly + zoom (vertigo):** scale up while moving back for uncanny depth — use once.
- Anticipation for a camera dive: pull back 2–4 % over 0.3 s, then dive with `E.inExpo` (see the Naqsh film: silence in the music at the same moment).

## 7. Transitions
Draw the outgoing and incoming scenes in the overlap window `[cut - d, cut + d]` (`d ≈ .15–.2`) with `K.scenes` adjacency, or hide the seam with an effect:
| Transition | How | Feels |
|---|---|---|
| Hard cut on the beat + 1–2 frame flash | `Post` `flash` decays 0.09 s, `punch` | energetic, modern |
| Whip / slide | `K.slide` ghosts + zoom blur | fast, kinetic |
| Iris | `K.iris(g, W, H, p, cx, cy)` then draw the new scene inside the clip | focus on a point (logo reveals) |
| Wipe | `K.wipe(g, W, H, p, angle)` | graphic, clean |
| Zoom-through | outgoing scales to 2–3× + fades; incoming scales from 0.6 → 1 | "diving into" a thing |
| Match cut | same shape/position in both scenes (a circle becomes a sun) | clever, smooth |
| Glitch | `Post` `glitch .4–.6` for 0.1 s | tech, edgy |
| Particle morph | `K.samplePoints` + `K.morph` between shapes/words | magic, product reveals |
| Shatter | triangulate the frame, throw shards outward (see direction.md case study) | dramatic turn |
| Crossfade | only for calm sections | gentle |
Keep transitions ≤ 0.4 s and *of one family* per film.

## 8. Choreography
For every important element: **anticipate → act → overshoot → settle → hold (breathe) → exit**. For groups: leader first, followers staggered; larger/heavier things move later and slower; different elements use different delays but the same easing family. Balance: when one thing moves in, another eases out, so the frame's centre of mass stays composed. Use the beat grid for all offsets: `K.grid(bpm).time(n)`, staggers of 1/8 or 1/16 notes.

## 9. Secondary motion and life
Nothing should be perfectly still: breathing glow (`.85 + .15*sin(t*.8)`), drifting background blobs, dust (`K.field`), blinking caret (`floor(t*2)%2`), cursor arcs and click ripples (`UI.cursor`), idle rotation 0.2–0.4 °/s, count-ups, eye blinks and slight head sway for characters (`K.noise1`, deterministic), a light sweep across glass (`K.shine`) every ~2 s. Characters: two-bone limbs with `K.ik2`, follow-through on the head (0.14 s lag), blinks at irregular hash-based times.

## 10. Motion blur
Fast motion without blur strobes. Three tools:
1. **Global:** `node tools/render.mjs --motion-blur 8 --shutter 0.5` — averages 8 sub-frames per frame on the GPU (cost ≈ 8×; use for finals of fast scenes, `--start/--end` to limit).
2. **Streaks:** draw a line from `pos(t-Δ)` to `pos(t)` (`K.sparks`, `K.trail`, the GPU particle capsule) — cheap and exact.
3. **Ghost trail:** `K.slide` draws 3 fading copies behind a fast mover.
Rule of thumb: if something moves more than half its own width per frame, blur it. Verify with `still` at mid-move and at the same time ± one frame.

## 11. Rhythm and hits
- Choose BPM so a beat is a whole number of frames (see pipeline.md §5); put scene cuts on beats or bar lines; let 1–2 elements move *off* the beat (syncopation) so it isn't a metronome.
- Every hit = camera punch (2–3 %) + small flash (≤ 0.1) + CA/zoom-blur spike (0.08 s) + sound. Big hit: also rings/sparks.
- Energy curve: quiet → build (more elements, faster cuts, rising sound) → **one** biggest hit → resolve (slower, wider, warmer).
- Flashes: keep to ≤ 3 per second and avoid large-area pure-white strobing (`qc video` measures it).

## 12. Common mistakes
Linear easing everywhere · everything animates at once · identical durations for everything · overshoot > 15 % on serious UI · no anticipation before the big move · motion that has no reason · fade instead of move · shaking that doesn't decay · text that moves while it is read · hard flashes on white · a still hold longer than 1 s with nothing alive on screen · impact on the wrong frame (start-on-beat instead of land-on-beat).

## 8. v2: camera and transitions as first-class tools
Cameras: `Stage.camera` (2D, uv units) built from `Cine.path / punch / shake / handheld / ramp`; 3D cameras via `Cam3.orbit/path/shake`, depth of field via `S3.render({dof})`. Transitions: 32 GPU transitions + `Trans.define`; choose by meaning (`atlas show trans-catalog`), vary them, centre them on the beat. Recipes with code: `atlas list camera`, `atlas list transitions`, `atlas list editing` (pacing, rule of three, anticipation/overshoot, contrast, depth layers).
