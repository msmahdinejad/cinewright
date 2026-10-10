# Not a slideshow — how motion design differs from animated slides

A *slideshow* is what agents make by default: a sequence of full-screen layouts, each one animates in, holds, and is replaced (a fade, a wipe, a cut). Every number can be right and it still reads as slides. *Motion design* is continuous: the eye is carried from one moment into the next, things move at different speeds on different curves, and the edit follows the music. Use this page when you plan the film (brief), when you build it, and in polish round A.

## 0 · Shots, not slides (decide this before anything else)
A slide is a heading with three things under it that stays for 3–5 seconds. A shot is **one idea filling the frame for 1–2 seconds**. Two films can have identical transitions and sound and still be a different kind of object: five 3-second slides ("A clear point of view" + three icons · "Ideas. Built. Launched." + three numbers · a quote · a handle) read as a deck, ten shots read as motion design. The layout and the pacing decide this long before the easing does.
- **Count the shots.** A 15 s film has 9–12 (average ≤ 1.7 s), an 8 s intro 6–7, a 20 s explainer 10–12. Write the shot list as one row per shot with its seconds; `qc craft` divides duration by rows and warns above 2.5 s on average (MG.film specs: above 2.2 s).
- **Split content instead of laying it out.** Three skills → three shots of ~1 s, each skill in giant type with its own icon. Three numbers → three shots, one number filling the frame and counting up. Three speakers → one shot each. A heading above three equal cards is the layout of a slide deck however well it animates; "title + 3 columns" never appears in a shot list.
- **One dominant element per shot**, ≥ 40 % of the frame height (a word, a number, an icon disc, a drawn hero). Scale contrast: one thing huge, the rest small, type allowed to bleed past the frame. Consecutive shots must not look alike: alternate the side the weight sits on, the background colour, the entrance, the camera direction.
- **Overlap the shots.** The next shot's first element starts moving before the previous one has left (a whip or an iris, never "scene A ends, scene B starts"); the carried object is already travelling when the cut arrives.
- **Only two places hold longer than 2.5 s**: the opener (the name, the promise) and the ending (the handle / call to action, ≥ 1.5 s). Everything between is rhythm; a calm moment is a shot that is simply a little longer.
- A deliberately slow film (a meditative piece, a talking-head lower third) says `Pacing: <why>` in `brief.md` and the warning becomes a note.

## 1 · Continuity (the single biggest difference)
- **Plan how every scene turns into the next** and write it in `brief.md` under *Continuity* — one row per boundary: *what travels* (an object, the camera, a shape) and *what changes* (position, size, colour, content). "Fade" and "wipe" are not answers.
- **One camera.** Scenes sit side by side and the camera travels between them: a small wind-up, a fast whip, a settle. Both scenes are visible during the move (`"transition": "whip"`, `push` in vertical films). The incoming scene does not start its entrances until the move has settled (~0.3 s).
- **One object carries across.** A shape that never unmounts: an avatar becomes a badge becomes the handle pill; a logo mark flies in from a corner pixel; an icon disc turns into the next icon. In the kit: `spec.carry` (see `motion-graphics.md`). Other films: keep the hero element above the scenes and change its position, size, radius and colour.
- **Open the next scene from the carried object.** `iris` opens the next scene inside a circle that grows from it; `zoom` flies through it.
- **Never cross-fade scene to scene** (a dissolve reads as a slide change) and never use the same transition more than twice in a row.
- If you cut, cut where the motion is fastest and keep that motion going in the next shot; cut on the beat (`"transition": "cut"`: a 1.07× punch-in that settles in 0.3 s).

## 2 · Timing and curves
- **Different curves for different moves**: entrances `cubic-bezier(.16, 1, .3, 1)` (~0.35 s: fast start, long soft landing); exits `cubic-bezier(.7, 0, .84, 0)` (~0.15 s, travel only ~70 % as far — let opacity finish the job); a whip `cubic-bezier(.62, -.14, .18, 1)`; a gentle settle `cubic-bezier(.2, .7, .1, 1)`. In the kit: `MG.ease.enter | exit | whip | settle | io`. The default "ease-in-out for everything" is the look of a template.
- **Stagger on a curve, with a leader**: one element first, the others 2–4 frames behind each other (30–80 ms), not evenly spaced.
- **Never scale up from 0** — start at ~0.93 with opacity 0; overshoot a little on UI, never on text.
- **Holds**: give a message long enough to be read; during the hold only the camera breathes (zoom 1.00 → 1.04 across the scene) and secondary things loop. A film that never pauses is as bad as one that freezes.
- **Motion blur along the direction of travel** — render the final with `--motion-blur 6 --shutter .5`; whips and carried-object moves then smear naturally.

## 3 · Type that moves like design
- Different entrances for different lines (`styles: ["slideL", "slam"]`): a quiet one, then the hit. One slam per scene.
- Scale contrast: one word huge (often bleeding past the frame), the rest small. Numbers count, they do not appear.
- Animate Persian/Arabic by whole words or lines, never per letter (the joins break).

## 4 · Rhythm and sound
- Choose the tempo first and put every scene start on a bar line, every hit on a beat or 2 frames before it; big changes on bars, details on half-beats.
- Place each sound so its attack lands on the visual hit (a whoosh peaks on the downbeat it travels through). In the kit `audio.mjs` is scored from the same spec, so retiming a scene moves its sound.
- Sound is half the perceived quality: pops, ticks, whooshes, a final chime — the mix should breathe (loudness range ≥ 2 LU), not sit flat.

## 5 · Restraint
- Every move means something; give the film one signature behaviour (the carried object) and reuse it.
- Texture (grain, halftone, ASCII) only with a physical reason — they are now the AI default look.
- Build a system, not one-offs: ~3 curves × 3 durations, a type scale, a grid, 3–4 colours.

## Checklist before you ship (polish round A)
0. Count the shots: rows of the shot list ÷ seconds. Is any shot a heading above rows of cards, or longer than 2.5 s without being the opener or the ending?
1. Name the carried object and the transition of every boundary. Is any boundary a plain wipe or fade?
2. Pause on 5 random frames: is anything *moving at different speeds* besides the entering item?
3. Look at a filmstrip across each transition (`render.mjs sheet --times a:b:0.15`): do you see both scenes mid-move, and does the carried object stay readable?
4. Are there at least three different type entrances, one big hit per scene?
5. Does every cut land on a beat? (`audio.mjs` hits vs `hits` in the spec)
6. `node tools/qc.mjs check`: no WARN about "scene changes travel" or "carried object" unless the brief says `Style: beat-cut`.

*Method adapted from the public notes of working motion designers collected in the open-source [Persian Motion Director](https://github.com/atmirrr/persian-motion-director) skill (one camera, objects that carry across scenes, music-first, per-move curves) — recommended reading for Persian-language motion work.*
