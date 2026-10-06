# Typography — kinetic type that carries the message

Type is the cheapest way to look expensive. Rules that hold for every recipe here: one idea per screen · the word that matters is the biggest thing in frame · every word **enters** with a motion
(never just appears) and **leaves** with a different one · hold a finished word for ≥ 0.4 s so it can be read · Persian/Arabic text is animated per **word**, never per letter, never letter-spaced.
All recipes are 2D canvas (`g`), so they work in `video.html`, in a Stage scene `draw(g, lt, t)`, or on top of a GL scene.

## poster-justify — Justified word poster
tags: typography poster hero rhythm 2d persian-ok cheap
use: the big statement; a tagline that fills the frame; "headline" beats of 1.5–3 s
how: every line is scaled to the same width and slides up out of its own mask, staggered. Pass `lines:[…]` to control the breaks; otherwise words are merged until the block fits `height`.
pair: bg-gradient-mesh, trans-whip, cam-punch-hits
avoid: more than ~6 words (it becomes noise); two posters in a row with the same colours
```js scene
//@ {"peak":1.9,"bg":"#0e0e14"}
Type.poster(g, 'Make it move now', W / 2, H / 2, W * .62, lt, { fills: ['#ffffff', '#ffd23f', '#ff4d6d'], height: H * .86, each: .16 });
```

## word-slam — One word per beat, slammed in
tags: typography beat slam impact rhythm 2d persian-ok cheap
use: hook sequences ("THIS. IS. NOT. A SLIDESHOW."), lyric-video energy, countdowns
how: each word lives one beat; `K.slam` gives overshoot + squash, a decaying `K.shake` sells the impact. Change colour/size every word so the cut feels like a cut.
pair: sfx hit on every word (sound.md → `s.hit`), trans-flash
avoid: letting the last word fade — end on a held, finished frame
```js scene
//@ {"peak":1.9,"bg":"#ff3b30"}
const words = ['THIS', 'IS', 'NOT', 'A SLIDESHOW'], cols = ['#fff', '#111', '#fff', '#111'], beat = .6, i = Math.min(words.length - 1, Math.floor(lt / beat)), p = lt - i * beat;
if (i % 2) { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, W, H); }
const sh = K.shake(p, 22 * u * Math.exp(-p * 12), 30, i); g.translate(sh[0], sh[1]);
K.slam(g, p, W / 2, H / 2, () => K.text(g, words[i], 0, 0, { size: H * (i === 3 ? .17 : .36), weight: 900, fill: cols[i] }), { from: 2.2, d: .16 });
```

## echo-stack — Echo stack (solid / outline / solid …)
tags: typography stack echo repeat poster 2d latin-best cheap
use: a single powerful word, music-poster look ("RHYTHM RHYTHM RHYTHM"), section titles
how: N copies stacked with a shrinking gap; every second copy is outline-only. Animate `gap` from 0 so the stack unfolds.
avoid: long words (the stack gets too wide); Persian (outline strokes make the joins messy — use solid copies only)
```js scene
//@ {"peak":1.7,"bg":"#f4efe4"}
const p = K.E.outCubic(K.prog(lt, 0, 1.1));
Type.stack(g, 'RHYTHM', W / 2, H / 2, { n: 5, size: H * .24, gap: .8 * p, fill: '#15151b', outline: '#15151b' });
```

## outline-draw — Letters write themselves
tags: typography outline stroke draw-on neon 2d latin-best cheap
use: logo/word reveals with a "drawn" feel; titles on dark backgrounds; before the fill-in flash
how: the outline strokes on (dash offset) over ~70 % of `p`, then the fill fades in. Pair with `glow` for neon.
avoid: thin weights (the stroke disappears) — use weight ≥ 700
```js scene
//@ {"peak":1.8,"bg":"#07070d","look":{"bloom":.9}}
Type.outline(g, 'DRAW ME', W / 2, H / 2, K.prog(lt, 0, 2.4), { size: H * .3, stroke: '#7df9ff', fill: '#ffffff', glow: '#27c4ff' });
```

## mask-reveal — Lines rise out of invisible masks
tags: typography reveal mask lines clean 2d persian-ok cheap
use: elegant multi-line statements, subtitles, product feature lines
how: `Type.reveal` clips each line to its own box and slides it up. Stagger by 0.2 s. The cleanest "premium" text move there is.
```js scene
//@ {"peak":1.6,"bg":"#101820"}
['We make', 'the web', 'move.'].forEach((s, i) => Type.reveal(g, s, W / 2, H * (.3 + i * .2), K.prog(lt, i * .2, i * .2 + .8), { size: H * .17, weight: 800, fill: i === 2 ? '#ffd23f' : '#ffffff' }));
```

## slice-snap — Slices fly in and snap together
tags: typography slice glitch snap hero 2d latin-best cheap
use: aggressive title reveals, tech/gaming/sport tone, the beat right after a hit
how: the word is cut into horizontal strips that slide in from alternating sides with random lag, then align.
```js scene
//@ {"peak":1.3,"bg":"#14141f"}
Type.slice(g, 'SNAP', W / 2, H / 2, K.prog(lt, 0, 1), { size: H * .44, n: 9, fill: '#ffffff' });
K.text(g, 'EVERYTHING LANDS ON THE BEAT', W / 2, H * .82, { size: H * .045, weight: 700, spacing: 10 * u, fill: '#ff4d6d', alpha: K.prog(lt, .8, 1.2) });
```

## glitch-type — RGB split + slice jitter
tags: typography glitch rgb distortion cyber 2d latin-best cheap
use: tension, error states, "signal lost", the cut into a hard scene; pulse `amt` on hits only
how: deterministic from the frame number — pass `Math.round(t*fps)`. Keep `amt` 0 most of the time and spike it for 3–6 frames.
avoid: constant glitching (it reads as a broken video, not a style)
```js scene
//@ {"peak":1.1,"bg":"#08080c"}
const hit = lt % 1 < .22 ? 1 : .04;
Type.glitch(g, 'SIGNAL LOST', W / 2, H / 2, hit, Math.round(t * 30), { size: H * .2, fill: '#ffffff' });
```

## extrude-block — Faux-3D block letters
tags: typography extrude 3d-lite block bold 2d latin-best cheap
use: playful, sticker/poster tone, sport, kids, retro-pop. For real 3D use `text3d-chrome` instead.
how: stacked copies offset along an angle; animate depth with an overshoot and sway the angle slightly.
```js scene
//@ {"peak":1.5,"bg":"#2a1d6e"}
const p = K.E.outBack(K.prog(lt, 0, .9));
Type.extrude(g, 'BOLD', W / 2, H / 2, { size: H * .38, depth: 70 * u * p, angle: Math.PI * (.75 + .06 * Math.sin(lt * 2.2)), colors: ['#ffe45e', '#ff4d8d'] });
```

## marquee-wall — Counter-scrolling ticker rows
tags: typography marquee ticker loop texture background 2d persian-ok cheap
use: energetic backgrounds behind a hero element, "brand wall", section dividers, fast-cut texture
how: rows of the same phrase scroll in alternating directions at different speeds; one solid row, the rest outline-only.
```js scene
//@ {"peak":1.4,"bg":"#0b1a2b"}
for (let r = 0; r < 7; r++) Type.marquee(g, 'TRANSLATE LIVE  ✦  SPEAK ANY LANGUAGE  ✦  ', H * (.08 + r * .14), lt + r * .7, { speed: 200 * u * (1 + r * .15), dir: r % 2 ? 1 : -1, size: H * .12, weight: 900, fill: '#ffffff', outline: r === 3 ? null : 'rgba(255,255,255,.35)' });
```

## weight-breathe — Variable-font weight animation
tags: typography weight variable font breathe calm 2d persian-ok cheap
use: calm/premium moods, "alive" idle text, emphasis without moving the layout much
how: Inter and Vazirmatn are variable fonts (100–900). Animate `weight` with a slow sine.
```js scene
//@ {"peak":1.2,"bg":"#f3f1ec"}
Type.weight(g, 'Breathe', W / 2, H / 2, .5 + .5 * Math.sin(lt * 2.4 - 1.57), { from: 100, to: 900, size: H * .32, fill: '#16161a' });
```

## wave-letters — Per-letter sine wave
tags: typography wave playful flow 2d latin-best cheap
use: friendly/joyful tone, "flow" words (translate, music, ocean); a bridge between two statements
```js scene
//@ {"peak":1.2,"bg":"#14284b"}
Type.wave(g, 'Everything flows', W / 2, H / 2, lt, { amp: H * .045, size: H * .16, speed: 4, fill: '#9fe7ff' });
```

## scramble-decode — Decode / hacker reveal
tags: typography scramble decode terminal cyber data 2d latin-best cheap
use: "access granted", loading → result, tech/security tone, translating gibberish into meaning (a perfect Avorythm-style metaphor)
how: `K.scramble(str, p, seed, frame)` resolves characters left → right while the rest flicker; mono font + glow.
pair: sfx-ui-ticks (sound.md), fx-filter-crt
```js scene
//@ {"peak":1.5,"bg":"#030806","look":{"bloom":1}}
const s = K.scramble('ACCESS GRANTED', K.prog(lt, .1, 1.7), 3, Math.round(t * 30));
K.text(g, s, W / 2, H / 2, { size: H * .12, family: K.FONTS.mono, weight: 700, fill: '#7dff9b', glow: '#2dff7a', spacing: 8 * u });
```

## typewriter-caret — Typed line with blinking caret
tags: typography typewriter terminal caret code 2d latin-best cheap
use: quiet, human moments; chat/code/search-box scenes; punchline after silence
how: `K.typed(str, p)` slices by grapheme (Persian-safe, types in reading order). The caret is drawn at the end of the returned width.
```js scene
//@ {"peak":2.2,"bg":"#101018"}
const s = K.typed('Ship it before the coffee gets cold.', K.prog(lt, .2, 2.4)), r = K.text(g, s, W * .12, H / 2, { size: H * .07, family: K.FONTS.mono, weight: 500, align: 'left', fill: '#e8e8f0' });
if (lt < 2.5 || Math.floor(lt * 2.4) % 2 === 0) { g.fillStyle = '#ffd23f'; g.fillRect(r.x1 + 8 * u, H / 2 - H * .04, 14 * u, H * .08); }
```

## text-window — Letters as a window onto anything
tags: typography mask gradient window fill hero 2d persian-ok cheap
use: a huge word filled with moving colour, a shader frame, a photo or video; the "title over nothing" look
how: `Type.fillWith(g, str, x, y, paint)` draws the word as a mask, then your `paint(ctx, bounds)` fills it (gradient, noise, drawImage of another canvas). Animate the paint, not the word.
```js scene
//@ {"peak":1.4,"bg":"#0a0a12"}
Type.fillWith(g, 'AURORA', W / 2, H / 2, (k, b) => {
  const x0 = -W + (lt * W * .45) % W, cols = ['#ff4d6d', '#ffd23f', '#27f0ff', '#7a5cff', '#ff4d6d'];
  for (const off of [0, W, 2 * W]) { const gr = k.createLinearGradient(x0 + off, 0, x0 + off + W, 0); cols.forEach((c, i) => gr.addColorStop(i / 4, c)); k.fillStyle = gr; k.fillRect(x0 + off, 0, W, H); }
}, { size: H * .46 });
```

## text-ring — Text around a circle
tags: typography ring circle orbit badge seal 2d persian-ok cheap
use: rotating badges/seals, "sticker" accents, logo lock-ups, a decorative spinning ring around a hero
how: `Type.ring` places letters (Latin) or words (Persian) along an arc; spin it by animating `ang`. Draw two rings with opposite spin for depth.
```js scene
//@ {"peak":1.4,"bg":"#1a1033"}
const cx = W / 2, cy = H / 2;
g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2 * u; g.beginPath(); g.arc(cx, cy, H * .31, 0, K.TAU); g.stroke();
Type.ring(g, 'OPEN SOURCE • REAL TIME • ZERO LATENCY • ', cx, cy, H * .33, lt * .6, { size: H * .05, weight: 800, fill: '#ffd23f' });
K.text(g, 'AI', cx, cy, { size: H * .26, weight: 900, fill: '#fff' });
```

## counter-odometer — Rolling number counter
tags: typography counter odometer number data stats 2d persian-ok cheap
use: stats ("12M users"), prices, progress, countdowns; the most convincing "numbers going up" move
how: ease the value yourself (`to * K.E.outExpo(p)`); `pad` reserves width so it doesn't jump; `fa:true` renders Persian digits with Persian separators.
```js scene
//@ {"peak":1.6,"bg":"#0f1420"}
const v = 1284500 * K.E.outExpo(K.prog(lt, 0, 2.2));
Type.counter(g, v, W / 2, H * .46, { size: H * .26, weight: 800, pad: 7, fill: '#ffffff' });
K.text(g, 'translated words / day', W / 2, H * .68, { size: H * .05, weight: 500, fill: '#8aa0c8', alpha: K.prog(lt, .6, 1.1) });
```

## marker-highlight — Highlighter sweep
tags: typography highlight marker underline emphasis explainer 2d persian-ok cheap
use: emphasising one phrase inside an explainer; "this is the part that matters"
how: a skewed bar grows behind the text; the ink flips to dark on top of it.
```js scene
//@ {"peak":1.5,"bg":"#f6f3ea"}
K.text(g, 'the fastest way to', W / 2, H * .38, { size: H * .09, weight: 500, fill: '#222' });
Type.marker(g, 'understand anyone', W / 2, H * .55, K.prog(lt, .3, 1.1), { size: H * .13, weight: 800, color: '#ffd23f', ink: '#111' });
```

## letters-assemble — Letters fly in and snap together
tags: typography assemble scatter kinetic hero 2d latin-best cheap
use: logo/name reveal with energy, "everything comes together" metaphors, end cards
how: every letter (word for Persian) starts at a random place, rotation and scale and eases home with staggered lag. Fix the `seed` once you like a look.
```js scene
//@ {"peak":1.3,"bg":"#101018"}
Type.assemble(g, 'AVORYTHM', W / 2, H / 2, K.prog(lt, 0, 1.8), { size: H * .2, weight: 900, seed: 4, fill: '#ffffff' });
```

## neon-sign — Flickering neon tube text
tags: typography neon glow sign night cyber 2d latin-best cheap
use: nightlife/synthwave/cyber tones, "open" signs, a title that needs a warm electric glow
how: three additive strokes (wide faint, medium, white core) + a flicker curve that is mostly 1. Needs Post bloom (≥ 0.9) to really glow.
```js scene
//@ {"peak":1.8,"bg":"#07060d","look":{"bloom":1.2}}
const flick = lt < 1.2 ? (Math.sin(lt * 71) > -.25 || lt > .9 ? 1 : .12) : 1;
g.globalCompositeOperation = 'lighter';
for (const [w, a] of [[34, .07], [18, .14], [9, .3], [3.5, 1]]) K.text(g, 'OPEN', W / 2, H / 2, { size: H * .34, weight: 800, fill: 'rgba(0,0,0,0)', stroke: K.rgba(w < 4 ? '#ffe3f6' : '#ff3fd0', a * flick), strokeW: w * u });
```

## words-on-beat — Lyric-style words (Persian-safe)
tags: typography words subtitle lyric karaoke persian rhythm 2d persian-ok cheap
use: subtitles with presence, voice-over line reveals, lyric/explainer lines
how: `K.words` enters each word of a line in reading order (right-to-left for Persian) with a stagger; the line stays shaped correctly because only whole words move.
```js scene
//@ {"peak":1.6,"bg":"#0c1020"}
K.words(g, 'ترجمه‌ی زنده، بدون هیچ مکثی', W / 2, H * .45, lt, { size: H * .1, weight: 800, fill: '#ffffff', each: .12, dur: .6, max: W * .86 });
K.words(g, 'Real-time translation, no pauses', W / 2, H * .66, lt - .5, { size: H * .06, weight: 500, fill: '#8fb0ff', each: .09, max: W * .86 });
```

## type-font-guide — Twelve bundled fonts and what each is for
tags: typography fonts font pairing persian latin display serif handwriting calligraphy nastaliq kufi
use: pick fonts BEFORE designing — type choice is half of a style system. Specimen: `references/gallery/fonts.jpg` / `examples/fonts.html`
how: all offline (OFL), referenced as `K.FONTS.<key>` and loaded with `K.loadFonts(['800 Vazirmatn', '400 Anton', …])`. Latin: `sans` Inter (neutral UI) · `grotesk` Space Grotesk (tech) · `display` Anton (tall condensed posters, ALL CAPS) · `serif` Playfair Display (editorial/luxury) · `hand` Caveat (human notes) · `rounded` Fredoka (friendly) · `mono` JetBrains Mono (code). Persian/Arabic: `fa` Vazirmatn (workhorse, 100–900, also Latin) · `faDisplay` Lalezar (bold headline) · `faClassic` Amiri (Naskh, literary) · `faKufi` Reem Kufi (geometric, brand) · `faRuqaa` Aref Ruqaa (warm calligraphic) · `faNastaliq` Noto Nastaliq Urdu (poetry titles; very tall lines — give it 1.8× line height) · `faFun` Rakkas (playful).
Script coverage: Inter = Latin + Latin-Ext + Cyrillic + Greek; Space Grotesk/Anton/Playfair/Caveat/Fredoka = Latin only; the Persian faces cover Arabic script (+ basic Latin); **no CJK, Hebrew or Indic glyphs are bundled** — a multi-script wall must stay within Latin/Cyrillic/Greek/Arabic.
Pairing: one display + one text face per film (e.g. Anton + Inter; Playfair + Inter; Space Grotesk + Vazirmatn; Lalezar titles + Vazirmatn body). A Latin-only font falls back to Vazirmatn for Persian glyphs automatically — but then the two lines look unrelated, so for bilingual titles prefer a Persian display font that also has Latin (Lalezar, Amiri, Reem Kufi, Aref Ruqaa, Rakkas, Vazirmatn).
avoid: more than two families in one film; Persian text in weight 100–300 on busy backgrounds; letter-spacing on Persian; Anton for Persian (it has no Persian glyphs)
```js
// the stacks:  K.FONTS.sans / grotesk / display / serif / hand / rounded / mono   ·   K.FONTS.fa / faDisplay / faClassic / faKufi / faRuqaa / faNastaliq / faFun
await K.loadFonts(['800 Vazirmatn', '400 Lalezar']);            // in window.ready
K.text(g, 'سلام دنیا', W / 2, H / 2, { size: 220, weight: 400, family: K.FONTS.faDisplay, fill: '#ffd23f' });
```

## type-persian-calligraphy — Poetic Persian title (Nastaliq) with a quiet gold glow
tags: typography persian calligraphy nastaliq poetry title gold elegant heritage words 2d persian-ok cheap
use: heritage/poetry/literary tones, openers and end cards for Persian audiences; a refined contrast to techy sans type. Pair with `gfx-girih-reveal` or `particles-dust-ambient`
how: `K.words` enters the line word by word (right to left) in `K.FONTS.faNastaliq`, bigger line-height than usual (Nastaliq stacks vertically), a soft warm glow, a tiny Latin subtitle below in a quiet serif. Keep the background dark and calm.
```js scene
//@ {"peak":1.8,"bg":"#0d1030","look":{"bloom":0.6}}
const gr = g.createRadialGradient(W / 2, H * .5, 0, W / 2, H * .5, W * .6); gr.addColorStop(0, '#1d2260'); gr.addColorStop(1, '#0a0c24'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
K.words(g, 'هر زبان، یک دنیاست', W / 2, H * .46, lt, { size: H * .17, weight: 700, family: K.FONTS.faNastaliq, fill: '#ffe9b8', glow: { color: '#e9b350', blur: 26 * u * 2 }, each: .2, dur: .9, max: W * .8 });
K.text(g, 'Every language is a world', W / 2, H * .72, { size: H * .05, weight: 500, family: K.FONTS.serif, fill: '#cfd3ff', alpha: K.prog(lt, 1.2, 1.8) });
```

## type-karaoke-captions — Word-by-word highlighted captions (Persian-safe)
tags: typography captions subtitles karaoke highlight words dubbing lyrics speech persian-ok rtl 2d cheap
use: subtitles that are part of the design — dubbing/translation products, lyric videos, spoken explainers. The active word lights up, the others wait, a pill glides from word to word; the line is readable the whole time
how: lay the line out once with `K.lay` (word centres and widths, RTL-aware: the first Persian word is the rightmost), find the active word from the clock, draw spoken words bright, future words dim, the active word dark on a pill that eases to its box and pops with `K.wobble`. Words, never letters, so Persian stays joined. For real speech, feed `per` from your transcript timings instead of a constant.
pair: ui-glass-panels (the card behind the line), sfx-ui-tick (one tick per word), bg-gradient-mesh
avoid: highlighting per letter in Persian; changing the line while a word is active; text under 4 % of frame height or without a card/scrim on busy footage
```js scene
//@ {"peak":2.0,"bg":"#0b0d1a"}
const size = H * .075, T0 = .25, per = .4, pad = size * .22, dark = '#0b0d1a', white = '#ffffff';
[['Hear every voice in your language', .4, 0], ['هر صدا را به زبان خودت بشنو', .62, .12]].forEach(([str, fy, off]) => {
  const L = K.lay(g, str, W / 2, { size, weight: 700, max: W * .86 }), y = H * fy, n = L.words.length, t = lt - T0 - off, idx = Math.min(n - 1, Math.floor(t / per)), cur = L.words[Math.max(0, idx)], prev = L.words[Math.max(0, idx - 1)];
  const q = idx <= 0 ? 1 : K.E.outCubic(K.prog(t - idx * per, 0, .16));                                  // glide progress of the pill from the previous word to this one
  if (idx >= 0) { const px = K.lerp(prev.x, cur.x, q), pw = K.lerp(prev.w, cur.w, q) + pad * 2; K.rr(g, px - pw / 2, y - size * .66, pw, size * 1.32, size * .3); g.fillStyle = K.gradient(g, px - pw / 2, 0, px + pw / 2, 0, [[0, '#8a63ff'], [1, '#40f5f5']]); g.fill(); }
  L.words.forEach((w, i) => { const act = i === idx, sc = act ? 1 + .1 * K.wobble(t - idx * per, { f: 3, decay: 8 }) : 1;
    const col = act ? K.mix(idx ? white : dark, dark, q) : i === idx - 1 ? K.mix(dark, white, q) : i < idx ? white : 'rgba(255,255,255,.34)';   // text colour follows the pill: dark while it is under the pill, white once it has left
    g.save(); g.translate(w.x, y); g.scale(sc, sc); K.text(g, w.s, 0, 0, { size: L.size, weight: 700, fill: col, max: 0 }); g.restore(); });
});
```

## type-outline-write-on — Text that writes itself (outline, pen glow, then fill)
tags: typography outline stroke write handwriting pen reveal draw calligraphy nastaliq signature title persian-ok 2d cheap
use: elegant titles, poetry in Nastaliq, a signature or brand name — a glowing pen head travels along the word, leaving a thin outline that turns into the solid word a beat later. Reads as "crafted", costs nothing
how: stroke the text (transparent fill) through a clip rectangle that grows in READING direction — right → left for Persian, left → right for Latin — put an additive glow at the clip edge (the pen), and cross-fade the filled text in after the line is complete. Works with every bundled font, joined Persian letters included, because the clip only reveals what is already shaped.
pair: type-persian-calligraphy, light-god-rays (behind), sfx-sparkle at the end
avoid: dash-offset tricks on text (the outline length is unknown and the order of contours is not reading order); a pen speed that is constant — ease in/out
```js scene
//@ {"peak":1.2,"bg":"#0a0b14","look":{"bloom":0.7}}
const str = 'سلام دنیا', fam = K.FONTS.faNastaliq, size = H * .2, cx = W / 2, cy = H * .5, m = K.measure(g, str, { size, family: fam, weight: 700 });
const p = K.E.inOutCubic(K.prog(lt, .15, 1.6)), fill = K.E.outCubic(K.prog(lt, 1.35, 2.1)), x0 = cx - m.w / 2, x1 = cx + m.w / 2, edge = m.rtl ? x1 - m.w * p : x0 + m.w * p;
g.save(); g.beginPath(); m.rtl ? g.rect(edge, 0, x1 - edge + 6, H) : g.rect(x0 - 6, 0, edge - x0 + 6, H); g.clip();
K.text(g, str, cx, cy, { size, family: fam, weight: 700, fill: 'rgba(0,0,0,0)', stroke: '#8fe9ff', strokeW: 3 * u * 2 }); g.restore();
g.globalAlpha = fill; K.text(g, str, cx, cy, { size, family: fam, weight: 700, fill: '#ffffff', glow: { color: '#40f5f5', blur: size * .12 } }); g.globalAlpha = 1;
if (p > 0 && p < 1) { K.glow(g, edge, cy, size * .5, '#40f5f5', .9); K.glow(g, edge, cy, size * .18, '#ffffff', 1); }
```
