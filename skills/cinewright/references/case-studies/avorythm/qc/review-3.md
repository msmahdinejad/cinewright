# Review 3 — Round B (craft & detail) and Round C (sound & finish)

## Round B — look at full-size frames, then at phone-size crops
1. **Browser popup clipped by the camera zoom (4–8 s).** The popup sat near the frame edge and the push-in cropped it. Fix: anchor it at `.635 * W`; check every element that is near an edge against the *zoomed* frame, not the unzoomed one.
2. **Sizes and safe margins.** Text checked against the rules (≥ 4 % of frame height, inside the 90 % safe area, ≤ 7 words per screen) and adjusted where it failed.
3. **Persian lines** are set word by word with `K.words` (never per letter, no letter-spacing); Latin names inside an RTL line stay one unit because `K.words` → `K.lay` keeps opposite-direction runs together.
4. **Colour discipline.** Violet = the source language (left), cyan = the target language (right), as in the logo; nothing outside the style-bible palette.

## Round C — sound & finish
1. **Every event comes from the shared cues** (`T.click`, `T.o1…o4`, `hits[]`) — no hard-coded seconds in `audio.mjs`, so retiming the picture retimes the music.
2. **The story is in the stereo field.** Dull babble panned left (the foreign voice) → silence → impact at the turn (8 s) → four ascending bells for the four outputs (9.7–10.3 s) → bright babble panned right (the dub) → santur on the Persian subtitle (17–20 s) → riser + tom roll → **a 0.15 s duck of everything** before the burst → resolve on D major with one santur note.
3. **Ducks and whooshes.** `s.duck('music', …)` just before the turn and before the burst; a whoosh before each cut, a hit on each cue.
4. **`qc audio`:** sub-bass levels trimmed until the band table passed; master normalised to −14 LUFS (`s.write('audio.wav', { lufs: -14, … })`).
5. **Ending:** the last scene is 4 s, the logo is on screen for all of it, the final tail is quiet.

Gate: `render.mjs verify` → PASS; full render; `qc.mjs check` → 0 failures, 0 warnings; the final contact sheet (`qc.mjs sheet`) looked at once more as a viewer would.
