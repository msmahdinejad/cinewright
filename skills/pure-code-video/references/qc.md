# QC reference — verifying what you cannot see or hear

Contents: [1 The loop](#1-the-loop) · [2 Reading a contact sheet](#2-reading-a-contact-sheet) · [3 Sync](#3-sync-checks) · [4 The gate](#4-the-ship-gate) · [5 Symptom → cause → fix](#5-symptom--cause--fix) · [6 Review rubric](#6-review-rubric) · [7 If you cannot view images](#7-if-you-cannot-view-images)

Past projects found their real problems by rendering ~24 frames side by side and reading numbers — bloom that turned everything white, a carpet the wrong colour next to the reference photos, text clipped under a card, a muddy mix 28 dB short of presence, a fallback font visible only in the *encoded* file, a first render that silently produced 48 bytes. Do the same, at every stage.

## 1. The loop
| Stage | Command | Look for |
|---|---|---|
| after each scene | `node tools/render.mjs sheet --times a,b,c` (entrance, mid-hold, exit) → open `qc/sheet.png` | §2 |
| composition detail | `node tools/render.mjs still 3.5` → open `qc/still_3.500.png` | small text, edges, banding |
| references | `node tools/qc.mjs palette ref.png` and a side-by-side of your frame vs the reference | palette/proportion drift |
| whole film | `node tools/render.mjs sheet --count 24` | rhythm: does something change every 2–3 s? one focal point? |
| named moments | `node tools/render.mjs sheet --markers` (from `VIDEO.markers`) | every cue moment |
| audio | `node audio.mjs && node tools/qc.mjs audio audio.wav` | sound.md §11 |
| determinism | `node tools/render.mjs verify` | PASS (or `PASS~`) on all four checks — `PASS~` means a few pixels differ by ≤ 2 levels, which real GPUs do not avoid (70 k additive particles: 0.05 % of bytes off by 1) |
| encoded file | `node tools/qc.mjs check` then `node tools/qc.mjs sheet` | §4 |
Keep iterations cheap: `--start/--end`, `--quality draft`, `--scale 0.5`.

## 2. Reading a contact sheet
Tiles are labelled with time (and marker names). Go through it in this order:
1. **Legibility** — can each text be read in one second at phone size? ≥ 4 % of frame height, contrast against what is behind it, not over busy detail, not clipped by an edge or a card.
2. **Focal point** — one obvious hero per moment; secondary elements quieter (dimmer, smaller, blurred).
3. **Composition** — balanced weight, margins ≥ 5 % (vertical: nothing important in the top 14 % / bottom 20 %), nothing cut by the frame unintentionally, safe area respected.
4. **Exposure & colour** — no white blobs (bloom + glow on white), no grey veil from a flash, blacks are black not milky, palette consistent (≤ 3 colours + neutrals), skin/brand colours right, no banding in dark gradients (grain + dither should hide it).
5. **Overlaps & collisions** — bubbles through bubbles, cursor over labels, toast over the input, text over bright geometry.
6. **Continuity** — the same element looks the same across scenes; transitions land where planned; no dead frames (empty or static without life).
7. **Motion evidence** — compare `t` and `t ± 1 frame` around fast moves: fast things should be blurred/streaked, not stepped.
8. **Language** — Persian: joins intact, order right, numbers Persian, Latin runs placed correctly; Latin: no orphan words, consistent casing.
Fix the worst issue first, re-render only the affected times, re-inspect.

## 3. Sync checks
- Cues are shared, so drift is impossible; what can be wrong is *where the motion lands*. Render `sheet --times cue-0.033,cue,cue+0.033` (30 fps) and confirm the visual **arrives on the cue frame** (motion.md §4).
- `qc audio` spectrogram: transient lines at the cue times; kicks each beat.
- Loudest 2–4 s of audio = the hero moment; a breath of quiet just before.
- The final frame and the last chord end together; the audio tail is not cut (video length = `duration`).

## 4. The ship gate
1. `node tools/render.mjs verify` → PASS ×4 (`PASS~` = GPU rounding noise; `FAIL` = real impurity, usually thousands of pixels and deltas ≫ 2).
2. Final render (`--detach` for anything long).
3. `node tools/qc.mjs check` → **no FAIL**; every WARN fixed or written down as accepted. It reports: pixel format yuv420p, BT.709 tag, faststart, exact frame count, decodes end-to-end, audio/video length match, black gaps, frozen stretches ≥ 1.2 s, hard cuts list, photosensitive **flash rate** (≤ 3/s), mean luma; audio loudness (−14 LUFS ± 2), true peak, silent gaps, band balance, spectrogram.
4. `node tools/qc.mjs sheet` — frames cut from the *encoded* MP4: fonts, colours, text survived; compare with the page sheet.
5. Optionally `node tools/qc.mjs frames out/video.mp4 0.62,9.1` for full-size stills of key moments.
Then report (SKILL.md deliverable format). If something is knowingly imperfect (e.g. a deliberate strobe), say so.

## 5. Symptom → cause → fix
| Symptom | Likely cause | Fix |
|---|---|---|
| White text is a glowing blob | bloom + additive glow on pure white | `bloom` ↓, `threshold` ↑, text `#dcdcf0`, glow blur < 0.25 × size, draw title away from bright geometry |
| Grey veil on hits | flash colour too strong/long | `flash` ≤ .06–.1, decay ≤ 0.1 s, tint it |
| Everything looks muddy/dark | low exposure + heavy vignette | `exposure` 1.05–1.15, `vignette` ≤ .4, lift shadows (`lift [.01,.01,.02]`) |
| Banding in gradients | 8-bit gradients | keep `dither` 1.4, add `grain` .03+, avoid long dark ramps |
| Text clipped or overlapping | fixed pixel layout | compute from `K.measure`, use `max`, `K.layout(W,H).safe`, `UI.fit` |
| Small unreadable UI text | drawn at 14 px in a 1080p frame | design in units and scale with `UI.fit` |
| Vertical version is just cropped | layout hard-coded for 16:9 | branch on `L.vertical`, use `u` and fractions of W/H |
| A bright subject (moon, logo, product) is a flat white disc | additive `K.glow` drawn *after* it, bloom threshold too low, base colour near white | draw the halo first, subject on top; subject base colour ≤ ~75 % luminance; raise `threshold`; check a full-size `still` |
| Frame differs between renders | impurity | `verify`; remove Math.random/Date/state; seed everything |
| Motion looks steppy/strobing | fast mover, no blur | `--motion-blur 8` or streaks/trails |
| Dead frames / feels static | holds with nothing alive | drift, breathing, particles, light sweeps; camera push |
| Scene feels late/early vs sound | motion starts on the cue instead of landing on it | shift start earlier by the move's impact time |
| Audio muddy | pad/bass overload 60–250 Hz | lower `cutoff`, thin voicings, duck under kick; `qc audio` band table |
| Audio dull | no 2–6 kHz | raise `cutoff`, add hats/bells/air; avoid stacked low-passes |
| Audio too flat | constant level | quiet intro, bigger hero, riser + silence |
| Clipping/true peak > −1 | hot master | keep `ceiling` default; lower drums; do not raise post-normalise |
| Colours washed on a phone | untagged BT.601 | use render.mjs (tags BT.709); do not re-encode elsewhere |
| File huge | grain + CRF only | default `maxrate auto` or `--quality web` |
| First frames black | fade-in too long / assets late | check `ready`, shorten fade, design frame 0 (it is the thumbnail on many platforms) |

## 6. Review rubric
Score each 0–2 before shipping; fix any 0, and improve anything under 1.5 average.
Concept (one transformation, clear) · Hook (first 2 s intriguing) · Hierarchy (one focal point) · Legibility · Palette (limited, harmonious, from the subject) · Motion polish (eased, staggered, arrive-on-beat) · Depth & light (layers, glow hierarchy, film look) · Sound (sync, energy curve, mix) · Pacing (change every 2–3 s, hero at ~70 %) · Ending (designed last frame, held) · Technical (verify, qc clean, safe zones) · Language (RTL/Persian correct).

## 7. If you cannot view images
Use numbers instead: `qc.mjs palette` on stills (dominant colours, luminance), `qc.mjs video` (cuts list, flash rate, frozen segments), `render.mjs info` (fonts loaded, canvas size), `--verbose` page logs, text metrics via `K.measure` asserted in code (throw if a title is wider than the safe area), and `verify`. Prefer conservative layouts (centered, generous margins, large type) and the templates' proven structures; state clearly in the report that visual review was numeric.

## 8. Motion energy (v2) — the slideshow detector
`node tools/qc.mjs energy out/video.mp4` (also run by `check`) measures the mean frame-to-frame difference at 15 fps and prints a sparkline per half-second, the share of near-static time, the number of hard cuts/flashes and the longest static hold.
Calibration: the dynamic reference films sit at ~5–15 % near-static; a slideshow-style render is 50–60 %. **WARN** = a stretch ≥ 1.5 s with almost no change → add camera drift/push, parallax particles, a secondary mover, or cut earlier; **PASS "pacing"** = enough of the film is in motion.
Use it after every polish round; it is the objective counterpart of the 10 review questions in `protocol.md`. It cannot judge beauty, only whether things move.

## 9. Looking at the right things (v2)
Contact sheets: `render.mjs sheet --count 24` (overview) · `--times 3:4:0.1` (a 1-second motion filmstrip around a hit) · `--markers` (one tile per labelled scene) · `still 3.2` (full-size frame — judge glow, text edges, banding here, never on the sheet).
3D/particle shots: look for flat-white blobs (over-bloom), black chrome (no coloured environment), noisy text particles (too few points), missing floor reflection (floor too dark/low reflect). Persian: check one full-size frame of every Persian line (joins intact, direction right).
