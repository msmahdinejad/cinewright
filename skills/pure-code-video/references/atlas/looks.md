# Looks — the filter and grade that give a film its identity

A look is what makes five different scenes feel like **one** film. Decide it once (in the style bible), then apply it globally (`Stage.look(...)` / the final `post.end({…})`) or per scene (`look:{…}` on a scene).
Two layers: **grade** = Post options (`bloom threshold streak ca grain vignette tint lift contrast sat exposure fade fadeColor glitch zoomBlur scan pixelate warp`), always on, almost free;
**filters** = `fx.filter(name, srcTexture, params, { to })` — 26 image filters that transform a picture (ascii, dither, hatch, mosaic, vhs, crt, halftone, edge, kaleido…).
In the recipes `c.demo()` is a test picture standing in for your composed scene texture (in a real scene it is the texture you rendered, e.g. `S.render()` or a Stage scene rt).
Chain filters with a scratch target: `const a = gfx.tmp('lookA', W, H); fx.filter('posterize', src, {…}, { to: a }); fx.filter('halftone', a, {…}, { to: rt });`

## look-teal-orange — Cinematic grade
tags: look grade cinematic teal orange film color post cheap
use: the default "expensive" finish for realistic/3D/city/product scenes; warm highlights, cool shadows, a touch more contrast
how: only Post options — `tint` multiplies, `lift` lifts blacks toward a cool colour, `contrast`/`sat` shape, `vignette` + `grain` glue it together. Apply to the whole film so scenes match.
```js gl
//@ {"peak":1.0,"look":{"tint":[1.07,1.0,0.88],"lift":[0.0,0.035,0.07],"contrast":1.14,"sat":1.14,"vignette":0.5,"grain":0.05,"bloom":0.5}}
return c.demo();
```

## look-noir — Black & white contrast
tags: look grade noir monochrome black white drama grain post cheap
use: serious/dramatic/historical beats, a "memory" scene, a contrast cut against colour scenes
how: `sat: 0`, strong contrast, heavy vignette and visible grain; keep one accent colour in a later scene for payoff.
```js gl
//@ {"peak":1.0,"look":{"sat":0,"contrast":1.35,"vignette":0.65,"grain":0.09,"bloom":0.35,"exposure":0.95}}
return c.demo();
```

## look-dream-bloom — Soft, glowing, lifted blacks
tags: look grade dream bloom soft pastel haze glow dreamy post cheap
use: dreamlike, romantic, nostalgic, "memory", fantasy; the visual opposite of noir
how: low `threshold` + high `bloom` makes everything glow, `lift` raises the blacks into violet, slightly lower contrast, a little `streak`. Keep text crisp by adding it AFTER the glow in an overlay.
```js gl
//@ {"peak":1.0,"look":{"bloom":1.0,"threshold":0.45,"knee":0.5,"lift":[0.10,0.05,0.14],"contrast":0.92,"sat":1.1,"streak":0.12,"vignette":0.3,"grain":0.03}}
return c.demo();
```

## look-anamorphic — Widescreen lens streaks
tags: look grade anamorphic streak lens flare cinema blue widescreen post cheap
use: trailers, sci-fi, night cities, any scene with bright lights; pair with `Cine.letterbox` bars (2.39:1)
how: `streak` draws horizontal light streaks from bright points, `bloomTint` colours them (classic cyan), a little chromatic aberration at the edges.
```js gl
//@ {"peak":1.0,"look":{"streak":0.8,"bloom":0.9,"threshold":0.6,"bloomTint":[0.7,0.9,1.3],"ca":0.004,"vignette":0.5,"grain":0.04}}
return c.demo();
```

## look-film-fade — Faded vintage film
tags: look grade vintage film fade warm retro nostalgia grain post cheap
use: nostalgia, archive footage, "years ago", retro-pop; soft and warm
how: `fade` mixes toward a warm `fadeColor` (lifts blacks and dulls whites), lower contrast, strong grain, soft vignette, slight chromatic aberration.
```js gl
//@ {"peak":1.0,"look":{"fade":0.14,"fadeColor":[0.95,0.82,0.62],"contrast":0.95,"sat":0.9,"grain":0.1,"vignette":0.45,"ca":0.003,"bloom":0.4}}
return c.demo();
```

## look-ascii — The picture becomes characters
tags: look filter ascii text terminal matrix code hacker retro cyber gl medium
use: "the machine's view", code/AI/matrix tones, a hard stylistic cut, turning any scene (3D, particles, UI) into text art; very strong signature technique
how: `fx.filter('ascii', src, {size, gain, mono}, {to})` replaces each cell by one of ten characters by brightness. `mono:1` = single ink colour on dark (matrix green), `mono:0` keeps the picture's colours. Bigger `size` = chunkier. Put real text on top for contrast.
pair: scramble-decode (type), bloom ≥ 1 on the result
```js gl
//@ {"peak":1.0,"look":{"bloom":1.0}}
fx.filter('ascii', c.demo(), { size: 9, gain: 1.2, mono: 1 }, { to: rt });
```

## look-dither — 1-bit bitmap
tags: look filter dither bitmap 1bit retro mac gameboy pixel texture gl cheap
use: retro-computing, poster/print texture, "low-fi" interludes, a bold cut away from smooth gradients
how: ordered Bayer dithering at `size` px blocks; `levels:2` is pure 1-bit (`c0` dark, `c1` light), more levels give a Game-Boy-like posterised dither; `keep` blends back the original colour.
```js gl
//@ {"peak":1.0}
fx.filter('dither', c.demo(), { size: 3, levels: 2, c: ['#0b0f14', '#e8f1ff'] }, { to: rt });
```

## look-hatch — Engraving / crosshatch drawing
tags: look filter hatch engraving drawing ink sketch paper print gl cheap
use: "hand-drawn" feel, history/science/editorial tones, a drawn-by-pen interlude
how: four line directions switch on as the picture gets darker; ink on paper colours. Pair with a paper texture (`K.paper`) behind for realism.
```js gl
//@ {"peak":1.0}
fx.filter('hatch', c.demo(), { size: 7, width: .17, c: ['#16120e', '#f1e7d3'] }, { to: rt });
```

## look-stained-glass — Voronoi mosaic
tags: look filter mosaic stained glass lowpoly voronoi crystal cells gl medium
use: cathedral/crystal/low-poly looks, "fragments", shatter-in transitions (animate `cells` from 80 down to 10)
how: Voronoi cells filled with the picture colour at their centre; seams darkened by `border`; cells drift slowly (`speed`).
```js gl
//@ {"peak":1.0}
fx.filter('mosaic', c.demo(), { cells: 13, border: .85, speed: .5 }, { to: rt });
```

## look-vhs — VHS tape
tags: look filter vhs analog retro glitch nostalgia noise tracking gl cheap
use: found-footage, 80s/90s nostalgia, "recording", flashbacks; short bursts (0.3–0.8 s) are better than a whole film
how: tracking wobble, colour bleed, noise and scanlines from one filter; chain `chroma` for lens fringing and add `zoomBlur` pulses on cuts.
```js gl
//@ {"peak":1.0,"look":{"scan":0.12}}
const a = gfx.tmp('lookA', W, H); fx.filter('vhs', c.demo(), { amt: 1.1 }, { to: a }); fx.filter('chroma', a, { amt: .006 }, { to: rt });
```

## look-crt — Old monitor
tags: look filter crt monitor scanlines retro screen curvature phosphor gl cheap
use: "on a screen" scenes (terminal, game, old TV), tech-nostalgia; the quick way to make UI look physical
how: barrel curvature, RGB phosphor mask, scanlines. Needs bloom to glow.
```js gl
//@ {"peak":1.0,"look":{"bloom":0.9}}
fx.filter('crt', c.demo(), { curve: .16, mask: .35, scan: .45 }, { to: rt });
```

## look-riso — Two-ink print / risograph
tags: look filter riso halftone print poster posterize graphic duotone gl medium
use: graphic/poster/editorial/pop styles; the opposite of "realistic 3D"; strong with flat colours and big type
how: posterize to few levels → gradient-map into two inks → halftone. Mis-register by offsetting a copy. Works on 2D scenes and 3D renders alike.
```js gl
//@ {"peak":1.0}
const a = gfx.tmp('lookA', W, H), b = gfx.tmp('lookB', W, H);
fx.filter('gradmap', c.demo(), { amt: 1, c: ['#1b1464', '#e8366d', '#fff2c9'] }, { to: a }); fx.filter('posterize', a, { levels: 4 }, { to: b }); fx.filter('halftone', b, { size: 6, soft: .6, mono: 0 }, { to: rt });
```

## look-duotone — Gradient map
tags: look filter duotone gradmap tritone colour grade graphic brand gl cheap
use: force any footage into the brand palette; unify clashing scenes; instant stylisation (3 colours: shadows, mids, highlights)
```js gl
//@ {"peak":1.0}
fx.filter('gradmap', c.demo(), { amt: 1, c: ['#04010f', '#8a2bff', '#ffe08a'] }, { to: rt });
```

## look-neon-edge — Glowing outlines
tags: look filter edge neon outline wireframe tron cyber line art gl cheap
use: Tron/cyber/blueprint looks; turns any flat-shaded scene into glowing line art; great on 3D renders and logos
how: Sobel edges → coloured glow. Draw simple solid shapes on black, get neon outlines; needs bloom.
```js gl
//@ {"peak":1.0,"look":{"bloom":1.2}}
fx.filter('edge', c.demo(), { strength: 4, glow: 1.3, c: ['#7fe9ff', '#ff4fd8'] }, { to: rt });
```

## look-pixel-art — Chunky pixels
tags: look filter pixelate posterize pixel art 8bit game retro gl cheap
use: game/retro scenes, "loading", censorship-style reveals (animate `size` 64 → 1 for a pixel-in reveal)
```js gl
//@ {"peak":1.0}
const a = gfx.tmp('lookA', W, H); fx.filter('pixelate', c.demo(), { size: 10 }, { to: a }); fx.filter('posterize', a, { levels: 5 }, { to: rt });
```

## look-tilt-shift — Miniature world
tags: look filter tiltshift miniature blur depth toy city gl cheap
use: aerial/city/landscape shots that should look like toys; a playful change of scale
```js gl
//@ {"peak":1.0,"look":{"sat":1.2,"contrast":1.08}}
fx.filter('tilt', c.demo(), { y: .62, band: .1, blur: 9 }, { to: rt });
```

## look-kaleido — Kaleidoscope mandala
tags: look filter kaleido kaleidoscope mandala symmetry psychedelic ornament gl cheap
use: ornamental/psychedelic/Persian-pattern feeling from ANY source; transitions ("everything folds into a pattern"); spinning logo backgrounds
how: n mirror segments around the centre; animate `angle` slowly and `zoom` for breathing.
```js gl
//@ {"peak":1.0,"look":{"bloom":0.6}}
fx.filter('kaleido', c.demo(), { n: 8, angle: lt * .35, zoom: 1.4 + .15 * Math.sin(lt * 1.5) }, { to: rt });
```

## look-swirl-bulge — Distortion toys
tags: look filter swirl bulge twirl magnifier lens distortion transition gl cheap
use: playful transitions and emphasis (magnify a detail, twirl away), "drain" effects, hypnotic intros
how: `swirl` rotates by an angle that falls off from the centre; `bulge` magnifies a disc with a glass rim. Animate their parameters over 0.5–1 s.
```js gl
//@ {"peak":1.2}
const a = gfx.tmp('lookA', W, H); fx.filter('swirl', c.demo(), { angle: 3 * Math.sin(lt * 1.2), r: .55 }, { to: a }); fx.filter('bulge', a, { k: .45, r: .22, center: [.5 + .2 * Math.sin(lt), .5] }, { to: rt });
```

## look-datamosh — Compression-glitch blocks
tags: look filter mosh glitch datamosh blocks digital error cyber gl cheap
use: errors, transitions into chaos, "signal" beats; trigger for 3–8 frames on hits, not continuously
how: random macro-blocks slip with an RGB tear; deterministic from `uT` + `seed`. Combine with `glitch` filter and `Post.glitch` pulses.
```js gl
//@ {"peak":1.0}
fx.filter('mosh', c.demo(), { amt: .22, block: 40, seed: 3 }, { to: rt });
```

## look-emboss — Relief lighting
tags: look filter emboss relief bevel metal plate paper cut lighting gl cheap
use: engraved-metal / paper-cut / coin looks from flat artwork; subtle tactility on UI
```js gl
//@ {"peak":1.0}
fx.filter('emboss', c.demo(), { strength: 4, width: 1.6, angle: .9 }, { to: rt });
```
