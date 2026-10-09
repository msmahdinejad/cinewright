# Review 2 — craft & detail (looked at: full-size stills at 5.6, 8.8, 11.6, 15.4 and 19.0 s, plus 0.2-second filmstrips of the coin flight 9.0–10.6 s and the burst 11.1–12.3 s)

Typography, spacing and colour are consistent with the style bible (Space Grotesk 800 for headlines and numbers, Inter 600 for UI, JetBrains Mono for the receipts, no letter-spaced words). Findings, ranked:

1. **Burst (11.5–11.9 s): a white-hot blob sits on Ana's plate.** Cause: 9 000 additive confetti particles at glow .25 saturate where they overlap, and the scene bloom (.5, threshold .7) pushes the plate to white. Change: 5 200 + 2 600 particles, glow .16, sizes 3.6–9 px so they read as confetti, scene bloom .5 → .38 and threshold .7 → .78; the green rings keep the shape of the moment.
2. **Coin landings (8.9–10.7 s) have no physical feedback.** Cause: the coins simply disappear into Ana's plate. Change: on each of the 15 landing times (computed from the shared cues) Ana's plate bumps by 7 % and her balance label pops by 12 %, so every chime has a visible partner.
3. **Debtors' labels (8.8 s): the avatar circle sits on the plate rim and hides the plate's highlight.** Change: label block 70 → 128 px below the plate centre; check badges move to the avatar's corner instead of under the amount.
4. **Summary card (15.4 s) collides with the heading and the €-sign touches the first digit.** Change: card height 800 → 700, the whole block moves down 14 px, number block 128 px centred at +450 px, donut and legend re-spaced; the 4 member avatars now appear one by one with an "even" label.
5. **End (18.6 s): the wordmark is flat.** Change: a warm amber glint travels across "Pocketwise" (gradient fill driven by the local time), the coin drops into the pocket with `outCubic` and a glow, and the tagline arrives word by word.
6. **Easter egg for the last third:** the ticker under the dashboard starts with "Pizza night €84.00" — the bill from the phone scene — so the story closes on itself.
