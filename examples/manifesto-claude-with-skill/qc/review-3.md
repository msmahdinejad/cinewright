# Review 3 — Round B (craft & detail) and Round C (sound & finish)

Looked at: the full-size render's contact sheet, stills of the 3D flight with motion blur, the spectrogram and band table from `qc audio`, and RMS measurements of the silent beat.

## Round B — craft
1. **Type size and safety.** Every headline is ≥ 18 % of the frame height per line (the FRAME stack is three copies at 18 % H, "FRAME." 22 % H, the others 27–36 % H); mono labels (counter, frame number, timecode) are decorative at 2.6–3.5 % of H.
2. **Colour discipline.** Only ink, bone, blue and orange appear (the bloom adds no hue); a full-bleed flood changes at 0 s (ink), 2.07 s (blue), 4.14 s (3D blue world), 8.28 s (bone), 11.03 s (ink + blue grid), 13.79 s (orange), 16.9 s (blue) — never more than 4 s apart.
3. **Detail for the last third.** The serif word "imagined" is the only humanist letterform in the film, glitching in at 15.2 s; the percentage in the corner and the live frame counter ("F 0285") are real functions of time.
4. **Finish.** 1920×1080, `--quality high`, 6 sub-frames of motion blur at a 180° shutter (the slams and the particle word smear correctly); `render.mjs verify` → PASS~.

## Round C — sound
1. **Every event comes from the shared cues** (`T.build`, `T.frame`, `T.hush`, `T.move`, `HITS`): retime the picture and the music follows.
2. **The beat of silence is real.** First version: RMS −25 dBFS between 16.55 and 16.90 s (the reverb tail and the last pad were still ringing, 11 dB below the music — *not* silent). Fix: overlapping `duck()` calls on every bus including the reverb and delay returns hold everything down: RMS −32 dBFS, 18 dB below the groove, and the impact at 16.9 s lands as the loudest moment.
3. **`qc audio` WARN: sub-bass −6 dB re total.** Phone speakers cannot play it. Fix: bass sub level .35 → .10, impact subs .3 → .10 (and .22 → .08 under the 3D words), kick body 54 → 62 Hz; the band table passes and `qc check` no longer warns. Loudness −14.1 LUFS, true peak −1.3 dBFS, **loudness range 4.7 LU** (the decode ticks and the hush give the film real dynamics).
4. **A whoosh before every cut, a hit on every word:** kick + hit for WE / DON'T / WAIT, a sweep on the strike-through, shutter clicks on every beat of the FRAME scene, typed ticks while the lines draw, a snare roll that accelerates into the hush.

Gate: `render.mjs verify` PASS~ → full render → `qc.mjs check`.

**Accepted WARN:** `qc check` reports black frames at 16.6–16.9 s — that is the beat of silence the brief asks for (an ink frame with a blinking cursor), not a rendering fault.
