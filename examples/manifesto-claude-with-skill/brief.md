# WE BUILD IT — a 20-second kinetic manifesto · creative brief

**The request (verbatim):** "Make a 20-second kinetic typography film that delivers this manifesto word for word: "We don't wait for inspiration. We build it. Frame by frame. Line by line. Until the thing you imagined starts to move." Type is the only hero — at least six different typographic treatments … on a driving original drum-and-bass track at 174 BPM with every cut on the beat. Two saturated colours plus one neutral, huge type (at least 40 % of the frame height), a full-bleed colour flood every ~4 s, one camera flight through the letters in 3D and one beat of total silence before the last line. Go all out."
Format: 16:9 · 1920×1080 · 30 fps · 20 s = 58 beats @ 174 BPM · English · original synthesised score.

## Concept
**Promise (one sentence):** *Every line of the manifesto is built with a different tool — the way the sentence says it is built — and the last tool is motion itself.*
**Visual verb:** **to build** — type is stacked, drawn, framed, extruded and finally *moved*; the film is the sentence performing itself.
**Hero moment (≈ 85 %, 16.9 s):** one beat of silence, then 40 000 particles gather into "STARTS TO MOVE." and the last word slides off the frame. **Last image:** the orange "MOVE." leaving to the right on blue, a bell chord ringing out.

## Style bible
Palette (4 tokens + ink): ink `#0a0a0f` · bone `#f4f1ea` · electric blue `#3050ff` · signal orange `#ff5a2a`. Two saturated colours, two neutrals; every scene is a flood of one of them.
Type: Anton (all impact) · Playfair Display 700 (the one human word, "imagined") · JetBrains Mono (labels, counters). Motion: slams with overshoot on the kick, stepped "on fours" where the line is about frames, draw-on where it is about lines; every cut on a beat; hit punch +2 %.
Sound plan: 174 BPM drum & bass in F minor — kick + hit per word, decode ticks, breakbeat groove from the 3D words, film-shutter clicks, typed ticks, riser + accelerating snare roll, a held-down beat of silence, impact + bell chord.
Never: a flat black background in the type scenes · type under 25 % of the frame height · two lines with the same treatment · any sound inside the silent beat.

## Shot list (technique ids from the atlas)
| beats / time | scene | picture | technique ids | transition in | sound |
|---|---|---|---|---|---|
| 0–6 · 0–2.07 | wedont | WE · DON'T · WAIT slammed on three kicks, colour bars shoot to the edge, negative flash on each hit | `word-slam` · `trans-hit-flash` · `cam-punch-hits` | cut from ink | kick + hit per word |
| 6–12 · 2.07–4.14 | inspire | INSPIRATION. decodes from noise on a blue flood, an orange strike-through wipes it out | `scramble-decode` · `style-kinetic-type-only` | `flash` | decode ticks, sweep |
| 12–24 · 4.14–8.28 | build | WE · BUILD · IT. as 3D plastic words at three depths, the camera threads between them | `text3d-chrome` · `cam-orbit-3d` · `cam-flythrough-gates` | `whip` | impacts, whooshes, groove enters |
| 24–32 · 8.28–11.03 | frame | FRAME BY FRAME. echo stack stepped on fours, film strips, a live frame counter | `echo-stack` · `edit-rule-of-three` | `slice` | shutter click per beat |
| 32–40 · 11.03–13.79 | line | LINE BY LINE. drawn as glowing outlines under a scanner | `outline-draw` · `type-outline-write-on` | `dots` | typed ticks |
| 40–48 · 13.79–16.55 | until | UNTIL THE THING YOU IMAGINED — a serif word glitches in, the picture shakes harder | `slice-snap` · `glitch-type` · `sfx-riser-drop` | `glitch` | riser, snare roll |
| 48–49 · 16.55–16.90 | hush | one beat of nothing | `edit-negative-space` | cut | silence (all buses held down) |
| 49–58 · 16.90–20 | move | STARTS TO MOVE. — particles gather, shock ring, the word moves away | `particles-morph-word` · `logo-stamp-shockwave` | `flash` | impact, sub, kick, bell chord |

Cues come from one beat grid (`edit-beat-grid`); every sound event is read from the same `cues` (`edit-sound-picture-sync`).
