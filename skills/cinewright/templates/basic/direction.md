# {{TITLE}} — direction

> Fill this in BEFORE touching code (10 minutes of thought saves an hour of rework). Keep it short; every line should change a decision.

**Concept (one transformation):** _A becomes B_ — e.g. "a point becomes a city", "noise becomes a sentence". The whole film is that one change, seen from different distances.
**Audience & platform:** who watches, where (phone reel? conference screen?), sound on or off?
**Format:** {{W}}×{{H}} · {{FPS}} fps · {{DUR}} s · language(s): {{LANG}}
**Hero moment (where the film peaks, ~65–75 % in):**
**Last image (what stays on screen, held ≥ 1 s):**

## Look
- **Palette** (hue {{HUE}} unless the subject has its own): background · surface · primary · secondary · accent · ink
- **Type:** display = _ · body = _ · numerals = _ (Persian: Vazirmatn, RTL, word-level animation only)
- **Texture:** grain / bloom / glass / paper / halftone …
- **Motion language:** one easing family (e.g. outExpo entrances, outBack for pops), overshoot ≤ 8 %, everything staggered by 60–120 ms, camera never static.

## Sound
- **Tempo / key:** 120 BPM (beat = 0.5 s = 30 frames @ 60 fps) · A minor
- **Layers by section:** intro _ → build _ → drop _ → resolve _
- **Signature sounds:** _ (one per scene change, one for the hero moment)

## Storyboard (times are cue names in `<script id="cues">`, not magic numbers)
| time | scene | on screen | motion | sound | text |
|---|---|---|---|---|---|
| 0.0 | hook | | | | |

## Checks before final render
- [ ] `node tools/render.mjs verify` passes (deterministic)
- [ ] contact sheet reviewed: nothing clipped, text ≥ 4 % of frame height, palette consistent
- [ ] `node tools/qc.mjs check` has no FAIL, every WARN explained
- [ ] vertical version re-composed (`--aspects 16:9,9:16`), not cropped
