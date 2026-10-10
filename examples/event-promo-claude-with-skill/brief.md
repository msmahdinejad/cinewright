# Frame Summit 2026 — event promo (15 s)

**The request (their words):** "Make a 15-second motion graphics promo for a fictional design conference, "Frame Summit 2026 · Oct 14–16 · Lisbon": three speakers with their talk titles, a big date moment, bold typography and shapes, and the call to action "Get tickets at framesummit.io". Energetic, modern, with a beat-synced edit and sound design. Go all out."
Format: 1920×1080 · 30 fps · 15 s · English · H.264/AAC. Built with the `motion` kit (the film is the JSON spec in video.html): nine shots, each one idea.

## Promise and visual verb
**Promise:** three days, one city, the people who make things — and a single place to get in.
**Visual verb:** *frame* — one badge travels through the film like a viewfinder moving across a venue: the calendar disc becomes the microphone, the code window, the pen, the badge in the corner, and finally the link you click. Nothing is a new slide; every shot is reached by moving.
**Hero moment (7–10 s):** the date lands as three full-frame colour floods — 14–16 / OCTOBER / LISBON — one word per second on the beat, with the badge still riding in the corner.
**Last image:** "Be in the room" · framesummit.io in a gradient pill · "Get tickets" button — held ≈ 2 s.

## Style bible
- Palette (5 tokens): `#0b0b16` night (bg) · `#17163a` indigo (bg2) · `#7a5cff` violet (accent) · `#c6ff3d` lime · `#ff5fa2` pink · cyan `#2fe0e8` for small accents.
- Fonts: Space Grotesk 700 (headlines, numbers) · Inter 600/700 (labels, notes).
- Motion: every speaker is a flood of its own colour (violet · cyan · lime) with the name in giant type, a ghost copy of it drifting behind; entrances alternate (slam · slide · rise); no colour wipes — shots change by an iris that grows out of the carried disc, whips, a punch-in cut onto the date, blinds and a zoom-through into the call to action; slow camera push on every shot and a 1 % punch on every hit.
- Sound plan (120 BPM, "tech" mood): the first four seconds are pads and keys only, the groove drops in at 4 s on a riser; swipe on every carried move, a pop per line, a riser + clap/hat/sparkle on every word of the date, sparkle + chime on the call to action.
- Never: a heading above rows of cards, a shot longer than 2.5 s except the opener and the ending, two neighbouring shots with the same colour, the same transition more than twice in a row.

## Continuity
| boundary | what travels | what changes | transition |
|---|---|---|---|
| 2.5 s title → Lena | the calendar disc (grows to the mic disc, 0.44 → 0.5 of the frame height) | dark gradient → violet flood; the speaker's scene is visible inside the circle as it grows | iris from the disc, 0.6 s |
| 4 s Lena → Omar | the disc crosses the frame, mic → code icon, violet → cyan flood | the weight of the layout swaps side | whip, 0.5 s |
| 5.5 s Omar → Ines | the disc, code → pen | cyan → lime | zoom-through, 0.5 s |
| 7 s Ines → date | the disc shrinks into the corner badge | the whole frame: one word on a flood | punch-in cut on the beat |
| 10 s date → 40+ | the badge stays in the corner | pink flood → lime flood with a sunburst | blinds, 0.55 s |
| 12 s 40+ → call to action | the badge stretches into the handle pill and travels to the centre | lime → night; "40+" scales away as the closing line rises | zoom-through, 0.7 s |

## Shot list
| # | id | seconds | techniques (atlas ids) | what moves | transition in | sound |
|---|---|---|---|---|---|---|
| 1 | title | 0 – 2.5 | `mg-type-entrances` (type) · `mg-carry-object` (editing) · `mg-icon-draw-on` (graphic) | "Frame" slides in, "Summit" slams; the calendar disc pops in with a dashed ring | — | pops per line, impact, chime |
| 2 | Lena Hart | 2.5 – 4 | `mg-hit-shots` (editing) · `mg-travel-transitions` (editing) | name in giant type, the mic disc, ghost name drifting | iris from the disc | swipe + pop |
| 3 | Omar Reyes | 4 – 5.5 | `mg-hit-shots` · `mg-carry-object` | two stacked lines, the code disc on the other side | whip | swipe + pop |
| 4 | Ines Duval | 5.5 – 7 | `mg-hit-shots` · `mg-type-entrances` | name rises, pen disc | zoom | swipe + pop |
| 5 | 14–16 | 7 – 8 | `mg-wipes` (graphic) · `mg-score-from-spec` (sound) | one word slams onto a violet flood | cut | riser, clap, hat, sparkle |
| 6 | OCTOBER | 8 – 9 | `mg-score-from-spec` | the next flood (lime) | cut | clap, hat, sparkle |
| 7 | LISBON | 9 – 10 | `mg-score-from-spec` | pink flood, last word of the date | cut | clap, hat, sparkle |
| 8 | 40+ talks | 10 – 12 | `mg-fact-flood` (ui-data) · `mg-counter-stats` (type) | the number scales in and counts up beside a mic icon | blinds | ticks, success chime |
| 9 | call to action | 12 – 15 | `mg-logo-build` (logos) · `mg-carry-object` | confetti burst, the pill settles, the button pops | zoom | sparkle, chime, resolved chord |

Reviews: `qc/review-1.md` (motion & camera), `qc/review-2.md` (craft & detail), `qc/review-3.md` (sound & finish).
