# Color — palettes, grades and the "limited palette" rule

A film feels designed when it uses **4–5 colours on purpose**: a dominant (60 %), a secondary (30 %), an accent (10 %), plus near-black and near-white. Decide them once, as tokens (`const PAL = {…}`), reuse everywhere (UI theme, particles, 3D env colours, text).
Rules: darks must stay dark (don't lift blacks above ~#07080f unless the style is pastel) · one accent that always means "attention" · text contrast ≥ 7:1 on its background · never pure `#000` / `#fff` large areas (use #07080f / #f5f1e8) · colour carries emotion: cool = calm/tech, warm = human/energetic, magenta+cyan = night/cyber, earthy = craft, pastel = soft/dreamy.
In code: `K.palette(hue, {mode: 'analogous'|'complementary'|'triad', dark})`, `K.oklch(l, c, h)` (perceptually even colours), `K.mix`, `K.hsl`. Env colours for `Scene3D` are *light intensities* — keep the first dark, the second a near-white key light, the others saturated but not too bright.

## palette-library — 24 ready palettes (copy the hex values)
tags: color palette library hex scheme brand mood neon pastel earthy dark tech
use: skip the "what colours?" detour; each line is `name: bg · base · accent · accent2 · light` and the mood it carries
how: **aurora-night** `#05060e #121a3a #27f0ff #7a5cff #eaf2ff` calm tech · **neon-city** `#07060d #1b1030 #ff2d95 #18e0ff #fff1dc` night/cyber · **sunset-pop** `#150d3a #c43c6e #ff9a4a #ffd98a #fff6e8` warm cinematic · **mint-ink** `#06120f #0f2f27 #7dff9b #27f0ff #f2fff8` fresh/dev · **royal-gold** `#0a0a12 #1a1630 #f5c76b #ffe9b0 #fff8e6` luxury/Persian · **persian-turquoise** `#06121f #0b3b4a #19c3b1 #f2c14e #fdf6e3` heritage (firouzeh + gold) · **lapis-saffron** `#0a1030 #1b2f7a #f4b942 #e4572e #fff7e0` Persian tile · **riso-pink** `#fff4e0 #1b1464 #e8366d #2fb8d4 #1b1464` graphic print · **bauhaus** `#f2ede4 #111111 #e63946 #1d4e89 #ffd23f` poster/editorial · **terminal** `#030806 #0a1a12 #7dff9b #2dff7a #d8ffe6` hacker · **blueprint** `#0a2540 #123a63 #7fdbff #ffffff #cfe9ff` technical · **vapor** `#1a0b2e #3b1c6e #ff71ce #01cdfe #fffb96` retro-pop · **candy** `#ffe3f0 #ff6fb5 #7a5cff #27d3ff #fff` playful · **clay** `#f1e4d3 #e07a5f #3d405b #81b29a #f2cc8f` tactile/craft · **mono-ink** `#f4f1ea #16161a #16161a #8a8a93 #ffffff` editorial · **noir** `#050505 #1a1a1a #ffffff #ff2a2a #cfcfcf` drama · **ocean** `#03111f #0a3a5c #19b5fe #7df9ff #e9fbff` water/calm · **forest** `#07140f #12362a #7bd88f #f4d35e #f3fff6` nature · **ember** `#0e0605 #3a0f08 #ff5a1f #ffb347 #fff1d6` fire/energy · **lavender-mist** `#17122b #3a2f6b #b79cff #ffc6ff #fff0ff` dreamy · **sakura** `#1a0e18 #4a1d3f #ff9ecb #ffd6e7 #fff5fa` soft/romantic · **cobalt-lime** `#06091f #1233ff #d6ff1f #ffffff #eef2ff` bold sport · **sand-ink** `#f3e9d2 #3b2f2f #c0392b #1f6f78 #fffaf0` warm print · **ultraviolet** `#08001a #2a0b66 #8a2bff #00e5ff #f6eaff` electronic

## palette-from-brand — Derive a palette from one colour
tags: color palette derive brand hue oklch generate analogous complementary triad
use: the client gave one brand colour
how: `K.palette(hue, {mode, dark: true})` returns coordinated colours; or in OKLCH keep the lightness ladder (L .15 / .30 / .62 / .85 / .96) and rotate hue ±25° for the second accent and +180° for the contrast accent; desaturate the dark end (C ≈ .03–.06) so backgrounds look rich, not coloured.

## grade-recipes — Quick colour grades (Post options)
tags: color grade look post tint lift contrast saturation film teal orange noir pastel
use: unify scenes; set once on the global `Stage.look`
how: **cinematic** `{tint:[1.07,1,.88], lift:[0,.035,.07], contrast:1.14, sat:1.14, vignette:.5, grain:.05}` · **noir** `{sat:0, contrast:1.35, vignette:.65, grain:.09}` · **dream** `{bloom:1.0, threshold:.45, lift:[.10,.05,.14], contrast:.92, streak:.12}` · **vintage** `{fade:.14, fadeColor:[.95,.82,.62], contrast:.95, sat:.9, grain:.1}` · **neon night** `{bloom:1.1, ca:.003, vignette:.45, sat:1.2, bloomTint:[1,.8,1.2]}` · **clean product** `{bloom:.3, grain:.02, vignette:.2, contrast:1.05}`. Previews in `looks.md`.

## color-gradient-rules — Gradients that look expensive
tags: color gradient mesh background smooth banding dither noise premium
use: backgrounds and fills; the cheap-gradient look comes from 2 stops, high saturation and banding
how: use ≥ 3 stops with hue shifts (not just lightness), keep saturation moderate in the middle, add ~3 % grain/dither (Post `grain`, `dither`) to kill banding, prefer shader backgrounds (`fx.bg('gradient'|'aurora'|'nebula')`) over `createLinearGradient` for large areas.
