# What a substantive review looks like (three rounds, abridged)

`qc.mjs craft` rejects review files that rubber-stamp the render. A real review names **what you looked at**, then a ranked fix list where every finding gives the **scene/time → cause → exact change**, then the **result**. Copy the shape; the numbers below come from a real 30 s film built with this engine.

---

## Review 1 — look-dev on the first skeleton render

Looked at: `render.mjs sheet --markers` (one tile per scene) and full-size `still` frames of the hero moments. Skeleton = all 8 scenes present, no console errors, nothing polished yet.

1. **Chrome prism (8–12 s) is a flat white shape.** Cause: the bloom threshold is too low for a bright chrome surface (lowering the lights changed nothing). Fix: scene look `{ bloom: .38, threshold: .92, knee: .3, streak: .06 }`; env colours stay dark (they are light intensities); a rim light carries the silhouette.
2. **Particle logo burst (24–26 s) is a blob and too faint.** Cause: particles too large and dense, and a bright nebula behind them eats the contrast. Fix: particle size `1.0 * u`, glow `.12`, logo height `.62 * min(W,H)`, the nebula replaced by a dark gradient.
3. **Glass subtitle card (16–20 s): the line starts outside the card, left-aligned.** Cause: `K.words(ctx, str, x, …)` centres its line on the x you pass. Fix: pass the card's centre `cx`; move the subtitle switch to local time 3.1 s so it lands on the beat.

Not done yet (next rounds): camera motion, craft details, sound.

## Review 2 — Round A: motion & camera (the slideshow check)

Tool: `node tools/qc.mjs energy out/video.mp4` before and after; motion filmstrips (`sheet --times a:b:0.1`) around each cut.

1. **Calm stretches ≥ 1.5 s inside scenes** — the content moves, the camera does not, so they read as slides. Fix: a camera key list per scene (`Cine.path(camKeys, { ease: 'inOutSine' })`: slow push-ins and drifts) plus `Cine.handheld(t, { amp: .0035, roll: .004 })` so the frame is never perfectly still.
2. **Hits do not move the camera.** Fix: on the `hits[]` of the shared cues, `Cine.punch(t, HITS, { amp: .016, decay: .22 })` and `Cine.shake(t, HITS, { amp: .007 })`, combined with `Cine.mix(...)` into one `S.camera`.
3. **Nothing lives in the background between hits.** Fix: one global dust layer — `Parts.Emitter` (8 000 slots, glow .35, depth of field) drawn after `S.render(t, false)` and before `post.end(look)`, so it floats in front of EVERY scene and is graded together with it.
4. **Entrances are plain fades.** Fix: cards and chips enter with `E.outBack` (a small overshoot) instead of an opacity ramp.
5. **Scene lengths are all 4 s.** *Accepted on purpose:* the cut grid is musical (2 bars at 120 bpm), and the variety comes from inside the scenes (a held silence, a fast montage, a slow glass card).

Result: median frame-to-frame energy ×2.5 compared with the skeleton; `qc energy` reports no stretch ≥ 1.5 s. The one deliberate slow moment — the held quiet right before the turn at 7.5 s (music ducked) — is intentional: a film needs one breath before its turn.

## Review 3 — Round B (craft & detail) and Round C (sound & finish)

Round B — full-size frames, then phone-size crops:
1. **A popup is clipped by the camera zoom (4–8 s).** It sat near the frame edge and the push-in cropped it. Fix: anchor it at `.635 * W`; check every element near an edge against the *zoomed* frame, not the unzoomed one.
2. **Sizes and safe margins:** text checked against the rules (≥ 4 % of frame height, inside the 90 % safe area, ≤ 7 words per screen) and adjusted where it failed.
3. **Colour discipline:** nothing outside the style-bible palette.

Round C — sound:
1. **Every event comes from the shared cues** (`T.turn`, `hits[]`) — no hard-coded seconds in `audio.mjs`, so retiming the picture retimes the music.
2. **The story is in the stereo field and the dynamics:** dull babble panned left → silence → impact at the turn (8 s) → four ascending bells for the four outputs → bright babble panned right → riser + tom roll → **a 0.15 s duck of everything** before the burst → resolve chord.
3. **Ducks and whooshes:** `s.duck('music', …)` just before the turn and before the burst; a whoosh before each cut, a hit on each cue.
4. **`qc audio`:** sub-bass levels trimmed until the band table passed; master normalised to −14 LUFS (`s.write('audio.wav', { lufs: -14, … })`).
5. **Ending:** the last scene is 4 s, the logo is on screen for all of it, the final tail is quiet.

Gate: `render.mjs verify` → PASS; full render; `qc.mjs check` → 0 failures, 0 warnings; the final contact sheet (`qc.mjs sheet`) looked at once more as a viewer would.
