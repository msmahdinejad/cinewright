# Review 2 — Round A: motion & camera (the slideshow check)

Tool: `node tools/qc.mjs energy out/video.mp4` before and after; motion filmstrips (`sheet --times a:b:0.1`) around each cut.

Findings and fixes:
1. **Calm stretches ≥ 1.5 s inside scenes** — the content moves, the camera does not, so they read as slides. Fix: a camera key list per scene (`camKeys` → `Cine.path(camKeys, { ease: 'inOutSine' })`: slow push-ins and drifts) plus `Cine.handheld(t, { amp: .0035, roll: .004 })` so the frame is never perfectly still.
2. **Hits do not move the camera.** Fix: on the `hits[]` of the shared cues, `Cine.punch(t, HITS, { amp: .016, decay: .22 })` and `Cine.shake(t, HITS, { amp: .007 })`, combined with `Cine.mix(...)` into one `S.camera`.
3. **Nothing lives in the background between hits.** Fix: one global dust layer — `Parts.Emitter` (8 000 slots, 6 000 streamed, glow .35, depth of field) drawn after `S.render(t, false)` and before `post.end(look)`, so it floats in front of EVERY scene and is graded together with it.
4. **Entrances are plain fades.** Fix: popup, chips and cards enter with `E.outBack` (a small overshoot) instead of an opacity ramp.
5. **Scene lengths are all 4 s** (2 bars at 120 bpm; only the burst is 2 s). *Accepted on purpose:* the cut grid is musical, and the variety comes from inside the scenes (a held silence, a fast montage, a slow glass card). A weaker film would have used the 4 s grid AND static scenes.

Result: median frame-to-frame energy ×2.5 compared with the skeleton; `qc energy` reports no stretch ≥ 1.5 s. The one deliberate slow moment — the held quiet right before the click at 7.5 s (music and voice are ducked, see `audio.mjs`) — is intentional: a film needs one breath before its turn.
