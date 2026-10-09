# Review 3 — sound & finish (looked at: the spectrogram and band table of `qc audio`, the measured level of the silent beat, and the final contact sheet)

Loudness is −13.9 LUFS with a −1.2 dBFS true peak and a 4.5 LU range; the first full mix has the right energy curve (hush → burst → light summary → resolved end). Findings, ranked:

1. **Summary (12.8–16.3 s) is dull in the top end.** The band table shows presence/air at −24.8 / −24.0 dB against −14.7 / −17.9 in the end scene. Change: 16th-note hats (open hat on the off-beat, vel .42 / .2 / .22), two `sparkle` clusters at 13.1 s and 15.4 s, and the clap raised to .34; the section now reads −21.8 / −20.7 dB in presence / air without touching the kick.
2. **The breath before "Everyone's even." (10.7–11.3 s).** Measured: mean −25.9 dB against −14.1 dB around it — a clear 12 dB hole made by overlapping ducks on music, drums, sfx, verb and delay. Kept as is; the last coin chime is allowed to ring out into it.
3. **Coin chimes (8.9–10.7 s).** The 15 chimes climb a pentatonic line (C6 → E7) in landing order, each paired with a short pop and a visual bump of Ana's plate computed from the same cues, so picture and sound cannot drift if the flight time is retimed.
4. **The burst (11.3 s).** Sub impact + a four-note chime + a marimba arpeggio start on the beat of the rings; the 0.9 s riser before the coins (7.3–8.2 s) is kept short so it does not mask the "Settle up" headline.
5. **End (16.3–20 s).** The coin drop at 17.0 s has its own pop + chime, the pad resolves on Cmaj7 and holds under the last image, and the film fades out over 0.5 s after the last image has held for ≈ 1.7 s.
6. **Final checks:** `render.mjs verify` (determinism), a full 1080p render with motion blur, `qc check` (video, pacing, fill, audio, craft) before shipping.
