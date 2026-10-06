# {{TITLE}} — creative direction (SHOWREEL starter)

**Concept (one idea):** *"I make things move"* — a showreel that proves range inside **one** visual system. Nine shots, nine disciplines (kinetic type, 3D, particles, ornament/geometry, UI motion,
shader art, speed/tunnel, burst/celebration, identity card), tied together by one palette, one display face, one easing family and a recurring circle. *Replace this with your own idea in one sentence.*
**Audience & platform:** 16:9 for the web, 9:16 recomposition for Reels/TikTok (`--aspects 16:9,9:16`).  **Format:** 1080p · 30 fps · 17.5 s · 128 BPM.
**Hero moment (≈ 75 %):** the burst at 13.1 s — riser + tom roll, 0.12 s of silence, impact, sparks and confetti, the finale line slammed.  **Last image:** name · role · contact on paper, held ≈ 3 s.

## Look
Palette: paper #f4efe6 · ink #101014 · red #ff4b2b · blue #2b4bff · yellow #ffd23f.  Type: Anton (EN) / Lalezar (FA) for display — weight 400 only — with Space Grotesk / Vazirmatn as the support face.
Texture: light grain, hard shapes, no gradients except in the particle/3D shots.  Motion: slams and overshoot, beat punches (+2 %), camera never still; transitions: a different one every cut.

## Storyboard (rows add up to the duration)
| time | scene | picture | motion / camera | transition in | sound |
|---|---|---|---|---|---|
| 0–1.9 | slam | four words, one flat colour per beat | slam + overshoot per beat | (fade from paper) | kick + hit per word |
| 1.9–3.75 | type3d | chunky plastic word in a blue world, orbiting props | orbit + DOF | whip | groove starts |
| 3.75–5.6 | morph | particles: smoke → word | cloud → word, slow yaw | zoomBlurCut | sparkle, chime |
| 5.6–7.5 | pattern | star pattern grows from the centre, disc + word | radial reveal, slow rotation | dots | santur arp |
| 7.5–9.4 | ui | light dashboard, counters, cursor click, toast | slide-up card, cursor path | slide | marimba, ticks, click |
| 9.4–11.25 | fluid | raymarched liquid-metal blobs + word | morphing blobs | liquid | sliding sub |
| 11.25–13.1 | speed | tunnel of rings, echo type | forward flight, zoom blur | zoom | riser, tom roll |
| 13.1–14.5 | burst | sparks + confetti + slammed line | shock + shake | flash | boom, pops |
| 14.5–17.5 | end | name · role · contact, slow sunburst | calm drift, long hold | blur | resolve + tail |

## Make it yours
1. Rewrite `COPY` (name, role, six words) and the palette. 2. Swap shots for your real strengths (see `references/atlas/*.md`; `node scripts/atlas.mjs search …`) — keep ≥ 6 distinct disciplines.
3. Keep the rhythm: scenes on bar lines, the biggest moment at ~75 %, a held final card. 4. Run `node tools/qc.mjs energy out/*.mp4` and fix every static stretch.
