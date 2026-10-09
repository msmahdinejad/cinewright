# Review 2 — Motion and craft

Looked at: qc/lookdev-b.png, full-size stills at 2.65 s, 4.95 s, 8.35 s, 12.28 s, and 14.60 s, and motion filmstrips around the 1.875 s and 12.1875 s cuts.

1. **4.95 s particle word → too faint and over-bloomed.** Cause: the original particle size/glow combination made FIELD read as a soft white blob on the dark field. Fix: use smaller but brighter particles with paper/cyan color separation, restrained bloom, and a faint circular trace behind the word.
2. **8.35 s curve editor → button contrast and layout.** Cause: the cyan PLAY pill was bright but its white label had weak contrast at phone size. Fix: draw a direct ink label on the cyan control, keep the Bézier handles and timeline inside the safe area, and animate the cursor into the control instead of leaving a static dashboard.
3. **12.50–14.00 s finale → static-hold warning.** Cause: the end of the burst and the start of the identity card did not have enough secondary motion. Fix: add 140 depth streaks to the tunnel, a progressive camera push after the burst, rotating signature arcs, orbiting dots, and an animated inner arc during the final hold.

Result: qc.mjs energy reports no static holds of 1.5 s or longer, and qc.mjs look reports a 28% median frame fill with no empty frames.

