# CLAUDE — Motion Reel 2026 · creative brief

**The request (verbatim):** "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. Go all out."
Format: 16:9 · 1920×1080 · 30 fps · 15 s · 128 BPM (15 s = 8 bars = 32 beats) · English · original synthesised score and sound design · everything from code, no footage.

## Concept
**Promise (one sentence):** *A reel proves range, so every two seconds is a different discipline — and one palette, one display face and a player-style HUD make nine very different shots read as one designer.*
**Visual verb:** **to chapter** — the film behaves like a *reel player*: a title, a running timecode, a chapter label per discipline (01 TYPE … 08 SOUND) and a progress bar that fills as you watch. The disciplines are the content; the HUD is the résumé.
**Twist:** the person on the résumé is the one making it — the last card says CLAUDE, motion designer, *built entirely from code*, and the film is the proof. A match cut (the ink disc of the pattern shot floods the frame and becomes the dark UI) is the signature transition authored for this film.

## Hero moment & last image
**Hero (≈ 75 %, 11.25 s):** riser + accelerating tom roll → 0.12 s of near-silence → impact: sparks, confetti, "AND SOUND" slammed. **Last image:** CLAUDE · MOTION DESIGNER · "built entirely from code" on bone with a slow violet sunburst, held 2.3 s, then a short fade.

## Style bible
Palette (5 tokens): ink `#0a0614` · violet `#6a35ff` · pink `#ff3f8e` · lime `#c6ff3a` · bone `#f5f1ff`. Two saturated hues plus a neutral per shot; floods of pink/lime/violet/bone for the type, ink for the dark worlds.
Type: Anton (display, weight 400) for all headlines · Space Grotesk (UI) · JetBrains Mono (HUD, timecode, stamp). No other faces. Motion: slams with overshoot (`outBack`), no linear easing, every cut on a beat, hit punch +2 %, slow push-in of 3.5 % per shot, hand-held 0.2 %.
Grade: grain .04, light chromatic aberration pulsing on hits, bloom only on bright shots (3D, particles, burst), fade in from ink / out to ink.
Sound plan: 128 BPM A minor — kick + hit per word, house groove that grows bar by bar, a whoosh *before* every cut, bells on the knot, chime on the particle lock, santur arpeggio for the geometry, marimba + typing ticks + click for the UI, riser + tom roll → silence → impact, resolve on A major.
Never: thin 1 px lines on empty black · a flat black background in a shot (always a layer) · two shots with the same transition · text under 4 % of the frame height · anything not in the palette.

## Shot list (technique ids from the atlas)
| time | scene | picture | technique ids | camera / motion | transition in | sound |
|---|---|---|---|---|---|---|
| 0–1.875 | slam | I · MAKE · THINGS · MOVE, a colour flood per beat, a different entrance per word | `word-slam` · `gfx-sunburst` · `echo-stack` · `letters-assemble` | slam + overshoot, rays rotate | fade from ink + colour wipe between beats | kick + hit per word, riser |
| 1.875–3.75 | form | chrome torus-knot, glass ring, three gems, outline "FORM" behind | `text3d-chrome` · `cam-orbit-3d` · `glass-gems` · `orbit-rings` | orbit + dolly + DOF | `whip` | impact, bell figure |
| 3.75–5.16 | type | 50 000 particles: noise → "TYPE", shock ring on the lock | `particles-morph-word` · `bg-catalog` | slow yaw | `zoomBlurCut` | sparkle, chime + hit on the lock |
| 5.16–6.56 | pattern | star pattern grows, ink disc + "PATTERN", the disc floods | `gfx-girih-reveal` · `edit-direction-continuity` | rotation, iris flood | `dots` | santur arp, downlifter |
| 6.56–8.44 | ui | dark dashboard: counters, line chart, toggles, cursor click, toast | `ui-dashboard-kpis` · `counter-odometer` · `style-dark-glass-ui` · `ui-notification-stack` | push-in, cursor path | match cut (ink) | marimba, ticks, click, success |
| 8.44–9.84 | fluid | raymarched liquid-metal blobs + "FLUID" | `glsl-raymarch-metaballs` · `style-liquid-dream` | morphing blobs | `liquid` | sliding sub, saw lead |
| 9.84–11.25 | speed | tunnel of rings, echo type, zoom blur | `tunnel-rings` · `echo-stack` · `cam-flythrough-gates` | forward flight | `zoom` | zap, riser, tom roll |
| 11.25–12.66 | burst | sparks + confetti + "AND SOUND" slammed | `particles-burst-spark` · `particles-confetti` · `logo-stamp-shockwave` · `cam-punch-hits` | shock + shake | `flash` | silence → impact, sub, kick, pops |
| 12.66–15 | end | name · role · stamp, long hold | `text-ring` · `gfx-sunburst` · `logo-orbit-lockup` | calm drift | `blur` | pad + strings resolve, bells |

Cues come from one beat grid (`edit-beat-grid`) following `edit-structure-15s`: scenes are 4·4·3·3·4·3·3·3·5 beats (`edit-pacing-curve`: the cuts speed up toward the hero moment, then hold); every sound event is read from the same `cues` (`edit-sound-picture-sync`).
