# Review 2 — Round A: motion & camera (the slideshow check)

Tool: `node tools/qc.mjs energy` and `look` on a 960×540 draft (16 s render) and a full-size contact sheet of 24 frames; the filmstrip around each cut.

Measured on the draft after the fixes: median ½-second energy 0.070, **0 % quiet**, no static hold ≥ 1.5 s, 9 hard cuts on the beat grid; frame fill median **43 %** (reference films 27–53 %), 3 % of the half-seconds are "empty" (the UI shot's first frames). Findings and fixes:

1. **Shots 5 (UI) and 9 (end card) sit on a single image for 1.4–2.3 s.** Content moves (counters, chart, sunburst) but the camera does not, which is exactly how a slide reads. Fix: a per-shot push-in (`pushIn(t)`: +3.5 % over the length of each shot, +2 % on the long end card) mixed with the hit punch (+2 %, 0.2 s), hit shake and hand-held drift through `Cine.mix` into one `S.camera`.
2. **The four slam words enter the same way.** Four identical slams make an obvious template. Fix: four different entrances — a slam with overshoot ("I"), an echo-slide with four outline trails ("MAKE"), a per-letter drop with random tilt ("THINGS"), a letter-by-letter bounce ("MOVE") — plus a 0.09 s colour wipe that hands each beat to the next.
3. **Cuts are only cuts.** Nine shots need nine different ways in: `whip`, `zoomBlurCut`, `dots`, a *designed* match cut (the ink disc of the pattern floods the frame and becomes the UI's background), `liquid`, `zoom`, `flash`, `blur`; `qc craft` counts 7 distinct GPU transitions.
4. **The particle word has no payoff at the moment it locks (4.78 s).** Fix: a lime shock ring that expands from the word (alpha and width decay with `E.outCubic`), synchronised with a chime + hit in the score (cue `lock`).
5. **Pacing.** Shots are 4·4·3·3·4·3·3·3·5 beats: they speed up toward the hero moment (11.25 s) and the end card holds 2.3 s. *Accepted on purpose:* the 4-beat shots in the first third are slower than the later ones so the viewer learns the vocabulary (type → 3D) before the montage accelerates.

Result: no `qc energy` WARN, `qc look` PASS. The one deliberate near-silence (the 0.12 s before the burst) is a sound moment, not a picture one — the picture is already running the tunnel.
