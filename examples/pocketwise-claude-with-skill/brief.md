# Pocketwise — "Settle up" (20 s explainer film)

**The request (their words):** "Make a 20-second explainer video for "Pocketwise", a fictional app that turns shared household expenses into a simple monthly summary. Show the problem, the app UI (invent the screens), one satisfying data moment (numbers/chart), and end with the name and a one-line tagline. Original music and UI sound design. Go all out."
Format: 1920×1080 · 30 fps · 20 s · English · H.264/AAC.

## Promise and visual verb
**Promise:** a messy pile of receipts and group-chat nagging resolves into one calm number — everyone is even.
**Visual verb:** *settle* — things that fly, pile up and swirl drop into place and balance to zero.
**Hero moment (≈ 11.3 s):** four plates on a glossy floor; gold coins arc from the flatmates who owe to the one who paid; every balance counts to 0.00, a check ring closes, confetti fires after one breath of silence.
**Last image:** the pocket mark with a coin dropped in, "Pocketwise", "Split the bills. Keep the friends." — held for 1.7 s.

## Style bible
- Palette (5 tokens): `#0d0f24` ink-indigo (bg) · `#f4efe6` paper · `#7a5cff` violet (accent) · `#2fe0e8` aqua · `#ffb84d` amber (money). Signal colour only for balances: `#ff6b6b` coral (owes), `#37d67a` green (settled).
- Fonts: Space Grotesk 700/800 (headlines, numbers) · Inter 500/700 (UI) · JetBrains Mono 500 (receipt print).
- Motion: outExpo entrances (0.5–0.7 s), outBack overshoot on hits, a camera move in every scene (handheld → orbit → push → drift); transitions are motivated by the picture: a **whip** with the falling receipts, a **zoomBlurCut** into the money, **liquid** when the numbers flow, a **dissolve** into the calm end.
- Grade: bloom .45 · threshold .72 · soft grain .03 · vignette .3 · chromatic aberration .0015, a little more on hits.
- Sound plan (120 BPM, warm lo-fi pop): pad chords (Cmaj7 → Am7 → Fmaj7 → G), marimba arps, a soft kick from the phone scene, bass from the settle scene; UI foley (paper rustle, message pings, key ticks, tap, toast); coin chimes whose pitch rises with every landing; **a breath of silence before the burst**; sub hit + chime on "settled"; a resolved final chord with a long tail.
- Never: a stretch > 1.2 s with nothing moving · thin outlines on black · more than 7 words on a screen · letter-spaced text.

## Shot list
| # | id | seconds | techniques (atlas ids) | what moves | transition in | sound |
|---|---|---|---|---|---|---|
| 1 | pile | 0 – 3.0 | `word-slam` (type) · `particles-confetti` (particles, receipts) · `ui-chat-bubbles` (ui-data) · `cam-handheld` (camera) | "Who paid for what?" slams in; receipts fall in parallax; chat bubbles pile up; notification badge climbs | — | paper rustle, message pings, low pulse |
| 2 | phone | 3.0 – 7.0 | `phone-ui-3d` (three-d) · `ui-app-flow` (ui-data) · `cam-orbit-3d` (camera) · `counter-odometer` (type) | the phone orbits; the amount types in 84.00; four avatars join; "Split it" is tapped; toast "€21.00 each" | whip | key ticks, tap, toast, whoosh |
| 3 | settle | 7.0 – 12.8 | `product-pedestal` (three-d, plates + coins on a floor) · `particles-burst-spark` (particles) · `sfx-hit-stack` (sound) · `cam-push-in` (camera) | coins arc between plates, balances count to 0.00, check ring closes, confetti | zoomBlurCut | coin chimes rising, silence, sub hit |
| 4 | summary | 12.8 – 16.8 | `ui-dashboard-kpis` · `ui-donut-progress` (ui-data) · `counter-odometer` (type) · `trans-color-flood` (transitions) | the monthly total counts up to €1,284.60; line chart and donut draw; every member "even" | liquid | soft pops, riser |
| 5 | end | 16.8 – 20 | `logo-orbit-lockup` (logos) · `particles-morph-word` (particles) · `end-first-last-impression` (ideas) | the pocket mark draws, a coin drops in, name, tagline, CTA | dissolve | resolved chord + chime, long tail |

Cues are shared by picture and sound (`<script id="cues">` in video.html): coin departures and landings, the tap, the toast and the burst are all computed from them.
