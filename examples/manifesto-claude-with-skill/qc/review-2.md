# Review 2 — Round A: motion & camera (the slideshow check)

Tool: `node tools/qc.mjs energy` and `look` on a 960×540 draft (14 s render) and filmstrips around the cuts. A crash found by the draft: **the render failed at t = 4.03 s** (`Cannot read properties of undefined`) although every contact sheet had worked — contact sheets sample only the times you ask for.

Measured on the draft after the fixes: median ½-second energy 0.043, **0 % quiet**, no static hold ≥ 1.5 s, 9 hard cuts on the beat grid; frame fill median **33 %** (reference 27–53 %), 5 % "empty" half-seconds (the hush beat, on purpose). Findings and fixes:

1. **Crash during the whip transition into the 3D scene.** The camera parameter `u = lt / length` is negative while the scene is still entering (lt < 0) → no keyframe matches → `keys[-1]`. Fix: `clamp(lt / length)`. Lesson kept: scenes are drawn with lt slightly < 0 during their transition.
2. **The camera in the 3D scene snaps between keys.** Linear blends between four keys looked mechanical; fixed with `E.inOutSine` per segment and a small roll (`cam.up`) that breathes with time; DOF focus follows the camera-to-target distance (80 %).
3. **Every line used the same energy.** Slam (kick), decode (noise), fly-through (3D), stepped (on fours), draw-on (outline), shake-build (until), particles — seven treatments, none repeated; the stepped shot deliberately drops to 7.5 poses per second so the *film about frames* feels like frames.
4. **The shake in "until" was constant.** It now follows `build²` (0 → 14 px at 38 Hz) so the picture trembles harder as the riser climbs, and the percentage counter in the corner climbs from 60 % to 98 %.
5. **Pacing.** Scenes are 6·6·12·8·8·8·1·9 beats: the 3D scene gets the longest shot after the finale; the cuts speed up (8-beat scenes) toward the hush. *Accepted on purpose:* the hush is a single beat, the shortest shot of all, because silence is the biggest contrast the film has.

Result: no `qc energy` WARN, `qc look` PASS.
