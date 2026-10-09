# Editing — pacing, structure and rhythm (what makes it feel directed)

Editing is deciding **when** things happen. Most "AI-looking" videos fail here, not in graphics: every scene lasts the same time, nothing is synchronised, everything is equally loud.
Measure it: `node tools/qc.mjs energy out/video.mp4` prints a motion-energy curve — long flat stretches are slideshow moments to fix (add camera motion, an accent, or cut earlier).

## edit-beat-grid — One grid for picture and sound
tags: editing rhythm beat grid bpm sync cues timeline cut on beat structure
use: decide BPM first (110–128 for modern/tech, 90–100 for calm/Persian 6/8 feel, 140+ for sport/energy), then express every cue as bars/beats: `t = bar·4B`
how: write the cue table in `<script id="cues">` as seconds computed from beats; scene cuts on bar lines (every 2 or 4 bars), accents on beats, reveals on the "and" before a bar. `K.grid(bpm)` and `Cine.beats(bpm)` convert. The audio script reads the SAME cues, so one edit moves both.
avoid: cuts that land between beats by accident (feels sloppy even to non-musicians)

## edit-structure-15s — A 15-second structure that works
tags: editing structure 15 seconds short reel showreel social timeline plan
use: showreels, social cuts, logo-driven pieces
how: 0–1 s HOOK (impossible image / statement, hit on 0.8) · 1–4 s SET-UP (the idea in one clear visual, medium pace) · 4–10 s ESCALATION (3–4 shots, cuts every 1.5 s then 1 s; one camera/transition per cut) · 10–12 s PEAK (the biggest visual + biggest sound: burst / reveal / drop) · 12–15 s RESOLVE (settle, hold the name/tagline ≥ 1 s, sound resolves). Silence/duck of ~0.2 s right before the peak.

## edit-structure-30s — A 30-second explainer structure
tags: editing structure 30 seconds explainer product promo timeline plan story
use: product/feature explainers
how: 0–3 s hook · 3–9 s problem (relatable, desaturated or distorted) · 9–10 s TURN (hit + colour/sound opens up) · 10–22 s solution in 3 beats of ~4 s (each beat = one benefit = one visual idea = one short phrase) · 22–27 s proof (number, UI result, social proof) · 27–30 s name + tagline + CTA held. Voice-over/subtitles: ≤ 2.5 words per second of screen time.

## edit-structure-60s — A 60-second film structure
tags: editing structure 60 seconds film brand story long timeline plan chapters
use: brand films, product stories, narrated pieces
how: three acts with a visual motif that evolves: Act 1 (0–15 s) world + tension · Act 2 (15–45 s) the turn, 3 chapters each with a different "location" (look/palette shift) but one recurring motif · Act 3 (45–60 s) payoff + brand. Add a **breath** (2 s of calm, no cuts) after each big peak; two peaks only — three feels tiring.

## edit-pacing-curve — Vary the cut length
tags: editing pacing speed cut length curve acceleration deceleration breathing
use: every film. Equal cut lengths are what slideshows are made of
how: plan a curve, not a constant: e.g. 3 s · 2 s · 2 s · 1.5 s · 1 s · 1 s · 0.5 s · 0.5 s · (hold) 2 s · 3 s. Fast = tension/energy, slow = importance/emotion. The only fixed rule: the most important thing gets the longest, stillest hold (≥ 1 s).

## edit-rule-of-three — Threes
tags: editing rule of three repetition pattern payoff list benefits
use: lists of benefits, build-ups, jokes, reveals
how: show a pattern twice (establish), break or escalate it the third time (payoff). Three benefits, three scenes, three words (`word-slam`: "Fast. Private. Free."). Four is a list; two is a pair; three is a rhythm.

## edit-anticipation-action — Anticipation → action → follow-through
tags: editing motion principle anticipation overshoot follow through squash timing animation
use: every object move: it should pull back a little before it launches (anticipation), overshoot its target (`E.outBack`, `K.slam`), then settle (`K.spring`). This is the difference between "moves" and "feels alive"
how: wind-up 3–6 frames, action 6–10 frames, overshoot and settle 10–14 frames; stagger multiple objects by 2–4 frames (`K.stagger`); ease in/out on camera, ease out on entrances, ease in on exits.
avoid: linear interpolation; everything arriving simultaneously

## edit-contrast-scale — Contrast in scale, speed, colour and sound
tags: editing contrast scale speed colour sound loud quiet big small dynamics
use: when a scene feels flat: increase contrast somewhere, not everywhere
how: big/small (a tiny dot then a giant word), fast/slow (hold after a flurry), dark/bright (cut to a flash), loud/quiet (duck before the hit), simple/complex, flat/3D. Each contrast should be used once, then rest.

## edit-layers-depth — Foreground, midground, background
tags: editing layers depth parallax composition cinematic foreground background framing
use: any scene: three layers moving at different speeds make 2D feel like space
how: background = slow shader/gradient/stars; midground = the subject; foreground = soft out-of-focus particles/shapes crossing the frame (blurred, bigger, faster). Add a vignette and keep the subject on a rule-of-thirds line; leave negative space in the direction the subject faces/moves.

## edit-direction-continuity — Keep motion direction across cuts
tags: editing direction continuity screen direction cut flow left right movement
use: a cut where an object leaves right and the next scene's object enters from the left feels smooth; reversing direction feels like a collision (use deliberately)
how: choose a dominant direction for the film (LTR for Latin, RTL for Persian/Arabic reading flow — mirror slides/wipes accordingly) and keep transitions' `dir` consistent with it.

## edit-text-timing — How long text stays on screen
tags: editing text reading time subtitles words per second title duration legibility
use: every piece of on-screen text
how: ≈ 3 words per second for simple words, 2 for Persian/long words, plus 0.4 s to register; titles ≥ 1.2 s fully formed; never two competing texts; end every text with an exit motion different from its entrance; never place important text in the bottom 12 % (UI overlays on social) or outside the central 80 % (safe area).

## edit-sound-picture-sync — Events for every important visual
tags: editing sound picture sync sfx hits whoosh audio design foley accents
use: the cheapest upgrade: a sound for each visual accent
how: list visual events (cut, slam, UI click, reveal, burst) in the cue table; give each a sound from `sound.md` (whoosh before cuts, hit on slams, tick on UI, riser into reveals, sub on the biggest one); keep levels hierarchical (hero hit 100 %, cuts 60 %, UI 30 %). Mix music 6–10 dB under SFX peaks; duck the pad on kicks.

## edit-negative-space — Leave room
tags: editing negative space breathing room minimal calm composition empty premium
use: premium/calm styles; any moment that must be read
how: fill ≤ 40 % of the frame, one focal point, generous margins, slow motion, no background clutter. Busy scenes are fine in the middle of the film if the first and last seconds are clean.

## edit-vertical-adapt — One film, three aspect ratios
tags: editing vertical 9:16 square 1:1 aspect ratio adapt reframe social responsive layout
use: social delivery: render 16:9, 9:16 and 1:1 from the same page (`--w --h`)
how: layout with `K.layout(W, H)` / relative units (`u = H/1080`, `min(W,H)`), scale 3D props by `W/H` (`vs = vertical ? .68 : 1`), re-flow text into more lines, keep the focal element centred and inside the central 80 %; check all three with `render.mjs sheet --w 1080 --h 1920`.

## edit-seamless-loop — A loop with no seam (reels, GIFs, backgrounds, end cards)
tags: editing loop seamless cyclic periodic reel gif background hold ending noise phase 2d cheap
use: anything that repeats — a social reel that auto-loops, a background under a long title, a "hold" at the end of a film. A loop that you can not find the seam in feels expensive; a pop at the seam feels broken
how: drive EVERYTHING from one phase `A = (t / period) · 2π`. Periodic motion must use whole-number frequencies of `A` (`sin(2A)`, `cos(3A)`). For noise, sample it on a circle in noise-space — `noise2(cos a + cos A, sin a + sin A)` — so when `A` returns, the noise returns too. Offset elements by phase (`k·2π/n`), never by time. Check the seam: `node tools/render.mjs still 0,<period − 1/fps>` — the two frames must look like neighbours, not like a cut.
pair: idea-loop-ending, gfx-blobs, bg-gradient-mesh
avoid: `Math.sin(t)` with a frequency that is not a whole number of cycles per period; one-shot particles or text reveals inside the loop; a fade-to-black at the loop point (it IS the seam)
```js scene
//@ {"peak":1.2,"bg":"#0d0b1f","look":{"bloom":0.6}}
const P = 3, A = (lt % P) / P * K.TAU, cx = W / 2, cy = H / 2;
g.beginPath(); for (let i = 0; i <= 160; i++) { const a = i / 160 * K.TAU, r = H * .22 * (1 + .28 * K.noise2(Math.cos(a) * 1.3 + Math.cos(A) * 1.1, Math.sin(a) * 1.3 + Math.sin(A) * 1.1)), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath();
g.fillStyle = K.gradient(g, cx - H * .3, cy - H * .3, cx + H * .3, cy + H * .3, [[0, '#8a63ff'], [1, '#40f5f5']]); g.fill();
for (let k = 0; k < 12; k++) { const a = A * (k % 2 ? -2 : 1) + k * K.TAU / 12, r = H * (.34 + .03 * Math.sin(A * 3 + k)); K.glow(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r * .85, 18 * u * 2, k % 2 ? '#40f5f5' : '#ffd23f', .9); }
g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3 * u * 2; g.beginPath(); g.arc(cx, cy, H * (.4 + .02 * Math.sin(A * 2)), 0, K.TAU); g.stroke();
```

## mg-spec-structure — Describe the film as data
tags: motion graphics spec json scenes structure editing beats pacing template
use: any everyday motion-graphics job: write `scenes` with `at` times on beats (0.5 s grid at 120 BPM), one idea per scene, 2.5–4 s each, a fast `words` burst somewhere, a last image that holds ≥ 1.5 s
how: start from the closest `--preset` of the `motion` template, replace the copy, then change scene order, durations, `bgColor` and wipes until the colour rhythm and pacing curve feel right; the same spec is read by the picture (mg.js) and the sound (audio.mjs)
avoid: equal scene lengths; two text-heavy scenes in a row
