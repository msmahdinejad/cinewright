# Round B - craft and detail

Looked at qc/review-A.png (3.5, 5.3, 9.2, 10.45, 11.8, 14 seconds), qc/transitions.png, and full-size stills at 0.9, 5.5, 12.1 seconds.

1. At 5.5 s the faux extrusion has visibly stepped edges because only five copies cover 40 pixels. Replaced it with forty one-pixel steps and reduced headline size to 305 pixels to protect the top safe area. The paper faces now read clearly against their ink shadows.
2. At 12.1 s the metal is sculptural, not a white disc, but persistent chromatic aberration muddies annotation edges. Removed steady aberration from the dark look; retained short cue-driven aberration only. Reduced dark-scene grain slightly.
3. At 3.5 s the left text approaches the orbit ring. Reduced the caption size from 205 to 195 pixels. Increased small metadata type toward 44 pixels and shortened verbose captions throughout the piece.
4. Mid-transition frames exposed a custom GLSL entry-point mismatch. The engine calls tr(uv), not trans(uv,t). Corrected the function and read progress from uP; all six transition midpoints now render without errors.

Draft metrics: median frame fill 29%, zero empty frames, median motion energy .0287. One low-motion warning at the end is the designed identity hold. The full draft decodes correctly, has no frozen stretches or black gaps, and matches its audio duration.

