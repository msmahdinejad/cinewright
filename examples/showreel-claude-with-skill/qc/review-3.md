# Review 3 — Round B (craft & detail) and Round C (sound & finish)

Looked at: a 24-frame contact sheet of the full-size render, two full-size stills with motion blur (1.62 s the MOVE bounce, 10.35 s the tunnel), the spectrogram / band table from `qc audio`, and the determinism report.

## Round B — craft
0. **`qc check` WARN: black frames at 6.3–6.6 s (found after the first full render, review 1's fix was incomplete).** The filmstrip showed the ink disc covering the frame at 6.33 s although the cut is at 6.56 s. Cause: `K.seg()` already applies `outCubic`, so my `E.inCubic(seg(lt, .86, 1.3))` was an out-then-in curve that finished 0.25 s early. Fix: a linear `K.prog` under `E.inCubic`, window 0.9–1.4 s, target radius `hypot * .56` — the disc now closes exactly on the cut and the empty ink stretch is 0.06 s (one frame pair), with the UI cards already 25 % in.
1. **Contrast and legibility.** The HUD follows the background (ink on pink/lime/bone/pattern/fluid/end, bone on the dark worlds) and cross-fades over ±0.12 s at each change, so it never sits ink-on-ink during the flood or the fast cuts. Headlines are 20–110 % of the frame height; the only small text is decorative microcopy (UI labels at 2.4 % of the short side, the HUD at 2.1 %) — accepted: it is not meant to be read at phone size, the KPI numbers beside it are 8 %.
2. **Edge safety.** Every element that sits near an edge was checked against the *zoomed* frame (3.5 % push-in): the HUD margins are 4.8 %, the slam words are fitted to 74–90 % of the width, the UI cards are inset 7 %.
3. **Depth.** Every shot has at least three layers: slam (flood + rotating rays + word), form (shader studio + outline word behind + 3D + gems in front), type (gradient world + 50 000 particles + shock ring), UI (glows + outline word + cards), end (sunburst + name + orbiting shapes + stamp).
4. **A detail for the last third.** The rotating text-ring stamp on the end card ("MOTION · DESIGN · CODE · SOUND ·") and the progress bar closing exactly on the last frame.
5. **Finish.** Rendered at 1920×1080, `--quality high` with 6 sub-frames of motion blur at a 180° shutter (the slam letters, the orbit and the tunnel now smear correctly); fade in from ink over 0.1 s, fade out to ink over 0.5 s after a 2.3 s hold; `render.mjs verify` → PASS~ (a few pixels differ by one level between Chrome processes — GPU rounding, invisible after encoding).

## Round C — sound
1. **Everything comes from the shared cues** (`T.lock`, `T.click`, `T.silence`, `HITS`): no hard-coded seconds in `audio.mjs`, so retiming the picture retimes the music.
2. **Dynamics.** The groove grows bar by bar (`vel .62 → .98`), the music ducks 50 % under the UI shot as a breather, and the 0.12 s of near-silence (`T.silence`) before the impact makes the burst the loudest moment. The loudness range measured by `qc audio` is still modest for a 15 s film (≈ 1.9 LU) — accepted: the master is normalised to −14 LUFS for social platforms and the film has no long quiet passage by design.
3. **A whoosh *before* every cut, a hit *on* every cue** (word slams, chrome impact, lock chime, UI click + success, burst impact + sub + kick + six confetti pops); music resolves on A major (add9) with bells and a held pad under the end card.
4. **`qc audio`:** −14 LUFS, true peak −1.3 dBFS, no silent gaps, band balance reasonable (sub bass trimmed after the first mix until the table passed).

Gate: `render.mjs verify` PASS~ → full render → `qc.mjs check` → see the final line below; the last contact sheet was looked at once more as a viewer would.
