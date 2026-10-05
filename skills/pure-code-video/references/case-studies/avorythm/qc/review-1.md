# Review 1 — look-dev on the first skeleton render (what I LOOKED at, what I changed)

Looked at: `render.mjs sheet --markers` (one tile per scene) and full-size `still` frames of the hero moments. Skeleton = all 8 scenes present, no console errors, nothing polished yet.
Ranked by visual impact (a good fix list names the scene, the cause and the exact change):

1. **Prism scene (8–12 s) — the chrome prism is a flat white shape.** Cause: the bloom threshold is too low for a bright chrome surface (lowering the lights changed nothing). Fix: the scene look gets `{ bloom: .38, threshold: .92, knee: .3, streak: .06 }`; Env colours stay dark (they are light intensities); a rim light carries the silhouette.
2. **Burst (24–26 s) — the logo made of particles is a blob and too faint.** Cause: particles too large and dense, and a bright nebula behind them eats the contrast. Fix: particle size `1.0 * u`, glow `.12`, logo height `.62 * min(W,H)`, the nebula replaced by a dark gradient.
3. **Glass subtitle card (16–20 s) — the English line starts outside the card, left-aligned.** Cause: `K.words(ctx, str, x, …)` centres its line on the x you pass. Fix: pass the card's centre `cx`; move the English → Persian subtitle switch to local time 3.1 s so the translation lands on the beat.

Not done yet (next rounds): camera motion, craft details, sound.
