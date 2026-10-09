# Review 1 — look-dev on the first skeleton (what I LOOKED at, what I changed)

Looked at: a 19-frame `render.mjs sheet --times …` contact sheet of the first full skeleton and full-size frames of the 3D scene. Skeleton = all seven scenes, no console errors; the four-colour palette already reads as one film. Ranked by visual impact:

1. **The opening uses a third of the frame (0.2–1.5 s).** WE / DON'T / WAIT sit in the top-left, the right side and the bottom are empty, and `WE` is clipped at the top edge. Cause: `K.text` centres the em box, not the ink, and Anton's caps sit high; the lines were also 0.33 of the height each. Fix: `ink: true` (centre on the ink bounds), size 0.36 H, three evenly spaced rows, and a colour bar that shoots from each word to the right edge on the slam — the type now floods the frame horizontally.
2. **The 3D words are a grey smear (5.6–7.6 s).** The chrome "BUILD" reflects a dark studio and reads white-grey; the camera path goes straight through "BUILD", so the frame is filled with giant flat slabs. Fix: BUILD becomes blue plastic with a pale rim (the palette's second colour), "IT." orange like "WE"; the camera keys move wide (x = 7.6, then 5.2) so the words are passed, not entered.
3. **"UNTIL THE THING YOU" reads in the wrong order (14.6–15.9 s).** Four words were placed on a 2×2 grid, so the eye reads UNTIL → YOU → THE THING. Fix: two rows, "UNTIL THE" / "THING YOU", then the serif "imagined" as the third row.
4. **The FRAME stack collides with the top film strip and the "FRAME." below it (9–10 s).** Fix: stack of 3 at 0.18 H centred at 0.43 H; "BY FRAME." moved to 0.75 H.
5. **The particle line is too dim (17.6–18.4 s).** 24 000 points at 1.7 px against a bright bloom: the words read as noise. Fix: 40 000 points, 2.7 px, glow .16, bloom .9 with threshold .55.

Not done yet (next rounds): the camera feel, the glitch/shake build, sound.
