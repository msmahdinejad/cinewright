# Frame Summit 2026 — event promo (15 s)

**The request (their words):** "Make a 15-second motion graphics promo for a fictional design conference, "Frame Summit 2026 · Oct 14–16 · Lisbon": three speakers with their talk titles, a big date moment, bold typography and shapes, and the call to action "Get tickets at framesummit.io". Energetic, modern, with a beat-synced edit and sound design. Go all out."
Format: 1920×1080 · 30 fps · 15 s · English · H.264/AAC. Built with the `motion` kit (the film is the JSON spec in video.html).

## Promise and visual verb
**Promise:** three days, one city, the people who make things — and a single place to get in.
**Visual verb:** *frame* — shapes and colour floods that snap into place like frames in a viewfinder; every cut is a wipe that "develops" the next scene.
**Hero moment (≈ 9–11 s):** the date lands as three full-frame colour floods — 14–16 / OCTOBER / LISBON — one word per second on the beat.
**Last image:** "Be in the room" · framesummit.io in a pulsing pill · "Get tickets" button — held ≈ 1.8 s.

## Style bible
- Palette (5 tokens): `#0b0b16` night (bg) · `#17163a` indigo (bg2) · `#7a5cff` violet (accent) · `#c6ff3d` lime · `#ff5fa2` pink · cyan `#2fe0e8` for small accents.
- Fonts: Space Grotesk 700 (headlines, numbers) · Inter 600/700 (labels, notes).
- Motion: lines slide up out of masks (0.7 s outExpo), rows slide in from alternating sides 0.25 s apart, pills pop with overshoot; a colour wipe on every cut (stripes → circle → flood → stripes); slow camera drift and a 1.2 % punch on every cut.
- Sound plan (120 BPM, "tech" mood): A-minor pads, house groove from 1 s, bass on eighths, plucked arps; whoosh + thud on every cut, a pop per row, impact on every word of the date, sparkle + chime on the call to action.
- Never: a scene longer than 5 s without a wipe, more than 7 words on a screen, a colour that repeats on two adjacent scenes.

## Shot list
| # | id | seconds | techniques (atlas ids) | what moves | transition in | sound |
|---|---|---|---|---|---|---|
| 1 | title | 0 – 3.5 | `mg-mask-reveal` (type) · `mg-icon-draw-on` (graphic) · `mg-poster-system` (graphic) | "Frame / Summit" slides up, calendar disc with orbiting badges, underline draws | — | pops per line, impact, chime |
| 2 | list | 3.5 – 8.5 | `mg-list-rows` (ui-data) · `mg-wipes` (graphic) · `mg-spec-structure` (editing) | three speaker rows slide in with a day pill each | circle wipe | swipe + pop per row |
| 3 | words | 8.5 – 11.5 | `mg-wipes` · `mg-score-from-spec` (sound) | 14–16 → OCTOBER → LISBON, one colour flood per word | flood | an impact + pop per word |
| 4 | cta | 11.5 – 15 | `mg-logo-build` (logos) · `mg-counter-stats` (type) | confetti burst, pulsing handle pill, button pops | stripes | sparkle, chime, resolved chord |
