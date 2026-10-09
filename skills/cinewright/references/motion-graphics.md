# Motion graphics — the fast path for everyday jobs

Most video requests are not trailers. They are **an intro for a person or a channel, a promo for a shop, a product feature, an infographic, an event announcement, a lower-third, a quote card**: a handful of well-designed 2D scenes, each with one idea, moving on the beat, with sound. For these, do not write a renderer — **describe the film as data** and let the kit draw and score it. You spend your time on what makes it good: the copy, the colour, the order, the timing, and looking at frames.

```bash
node "<skill>/scripts/scaffold.mjs" film --template motion --preset person-intro     # or channel-intro · social-promo · infographic · event-promo
cd film && node audio.mjs && node tools/render.mjs sheet --count 24                   # look at qc/sheet.png, then edit the spec in video.html
```
`--preset` gives a complete, good-looking film for a made-up subject; **replace every word, number and colour with the user's**, reorder/add/remove scenes, then iterate. Vertical (`--w 1080 --h 1920`) re-lays out by itself; the `social-promo` preset is vertical already.

## The spec (`<script id="cues">` in video.html — picture and sound both read it)
```json
{ "bpm": 120, "duration": 15, "mood": "upbeat", "wipe": "stripes",
  "theme": { "preset": "poster" },
  "scenes": [ { "type": "title", "at": 0, "lines": ["Alex", "Morgan"] }, { "type": "chips", "at": 3, "items": [...] }, … ] }
```
* **Times** are seconds; start scenes on beats (bpm 120 → every 0.5 s). A scene lasts until the next one starts (the last until `duration`). Item *i* of a scene appears at `at + (lead ?? .3) + i·(step ?? beat/2)` — audio.mjs uses the same formula, so changing a time moves the pop sound with it.
* **`wipe`** (spec default, or per scene = the transition *into* that scene): `stripes` · `circle` · `slide` · `flood` · `blocks` · `diagonal`. Vary them; a colour flood or a circle between a busy and a calm scene reads best. `wipeDur` (default 0.5 s).
* **`bg`** per scene: `blobs` · `dots` · `grid` · `stripes` · `rays` · `waves` · `flat` · `grad`; **`bgColor`** (`a`/`b`/`c`/`d`/`ink` or a hex) gives the scene a full colour block with automatically readable text — the quickest way to get the bold flat-poster look and a rhythm of colour changes. `float: false` removes the drifting shapes.
* **Theme**: `preset` = `poster` (cream · tomato · mustard · forest · mint, condensed caps — loud and friendly) · `pop` · `night` (dark, glow) · `studio` (editorial) · `mint` · `warm` (coffee/dark) · `ocean` (blue dark); override any token (`a b c d bg bg2 ink`), `head`: `grotesk` (default) · `display` (condensed caps) · `rounded` · `serif`, `caps: true|false`.
* **mood** (music): `upbeat` · `chill` · `tech` · `cinematic`.

## Scene types
| type | fields | what it is |
|---|---|---|
| `title` | `kicker`, `lines[]` (1–3), `sub`, `avatar` (initials) or `icon`, `badges[]` (icon names orbiting the art) | the opener / name card: big stacked lines that slide up out of a mask, an accent underline that draws itself, an avatar disc with orbiting badges |
| `chips` | `title`, `items[{label, icon, note}]` (2–4) | big colour cards with self-drawing icons popping in (skills, features, services) |
| `stats` | `title`, `items[{value, prefix, suffix, decimals, label, icon}]` (2–4) | counters that count up inside cards |
| `quote` | `text`, `who`, `role`, `flood` (colour key) | a big quote mark and the words sliding up, attribution with a drawn rule |
| `list` | `kicker`, `title`, `items[{label, value, icon, note}]` (2–5) | menu / agenda / speakers / steps: rows slide in from alternating sides, icon disc, price pill |
| `fact` | `icon`, `value`+`suffix`+`prefix` (counts up) *or* `big`, `text`, `kicker`, `color` | an infographic beat: colour flood, one big self-drawing icon, one number, one sentence |
| `chart` | `title`, `kind` `bars`/`ring`/`line`, `data[{label, value}]`, `highlight`, `unit`, `max`, `caption` | animated chart with the key value highlighted |
| `logo` | `mark` (`pulse`·`bolt`·`play`·`ring`·`orbit`·`letter`+`letter`), `name`, `tag` | a mark that builds itself, the name popping letter by letter, a tagline, a shine |
| `cta` | `line`, `handle`, `sub`, `button` | the closing line, a handle/URL in a pulsing pill, confetti, a button — hold it ≥ 1.5 s |
| `words` | `words[]`, `step`, `sub` | rapid full-frame words on colour floods (energy between calmer scenes, countdowns, hooks) |
Icons (`MG.icons`): user users briefcase pen layers code search bulb rocket trophy award calendar ticket mic pin globe mail play camera music coffee cup leaf bean brain chart trend target smile bell bag tag gift zzz battery wifi shield book flag eye pulse grid cube home heart star bolt moon sun clock check plus arrow.

## When the kit does not have it — add a scene, keep everything else
```js
MG.scenes.cup = (g, lt, t, sc, X) => {            // X = { W, H, U (unit = H/1080), V (vertical), T (theme tokens), B (beat) }
  const p = K.E.outBack(K.prog(lt, .2, .9)); … draw the subject-specific art here (a drawn coffee cup, a product, a map pin, a chart of your own) …
};                                                 // then  { "type": "cup", "at": 3, … }  in the spec
```
Use `MG.mask`, `MG.pop`, `MG.icon`, `MG.iconDisc`, `MG.card`, `MG.stat`, `MG.underline`, `MG.avatar`, `MG.wipe` inside it. A custom hero illustration (drawn from circles, rounded rects and paths) plus the kit's type, colour, wipes and sound is exactly what makes a simple film feel designed.

## Persian, Arabic, Hebrew (right-to-left)
Scaffold with `--lang fa` (or write `"lang": "fa"` / `"dir": "rtl"` in the spec) and write the copy in the script: the **whole layout mirrors** (title text right-aligned with the avatar on the left, cards ordered right → left, list icons on the right) and every text run is shaped by the browser (Vazirmatn is the fallback of every theme font; heavy display faces fall back to Vazirmatn 800). Persian and Arabic use the bundled Vazirmatn; Hebrew needs a Hebrew font you load yourself (`K.loadFonts`). `lang: "fa"` also writes **Persian digits** with the Persian thousands/decimal separators (`"digits": "latin"` keeps ASCII digits). Keep Latin handles and URLs as they are — they stay readable inside the mirrored layout. In a custom scene draw text with `MG.text(g, str, x, y, opts)` (same signature as `K.text`) so it mirrors with the rest; shapes need nothing. Animate Persian by words or lines, never per letter (joining breaks).

## What makes simple motion graphics look expensive (check before you ship)
1. **One idea per scene, 2.5–4 s each**, in a pacing that is *not* equal (a fast `words` burst, a calmer `stats`, a long final hold).
2. **A colour system and a rhythm of colour**: 3–4 colours only, a different `bgColor` or `bg` every scene or two, text always readable (the kit picks black/white automatically).
3. **Everything moves, nothing sits**: entrances with overshoot, drifting shapes, counters, pulses; `qc energy` should show < 25 % near-static.
4. **Type does the work**: the biggest thing on screen is the message; ≤ 7 words per scene line; numbers as counters, not text.
5. **Sound on every beat of the picture**: the kit does it; listen to the mix (`qc audio`) and make sure the music is not louder than the pops.
6. **A last image that holds** (≥ 1.5 s) with the name / handle / call to action.
7. **Look at frames** (sheet + 3 full-size stills), write the three review rounds, run `qc check` — same protocol as every other film.

## Typical briefs → recipe
| brief | preset → what to change |
|---|---|
| introduce a person | `person-intro`: name, role, 3 skills, 3 numbers, a quote, handle; pick the theme that fits the person (`poster` friendly, `studio` editorial, `night` techy) |
| channel / brand intro (5–8 s) | `channel-intro`: a `words` hook (3 words), the `logo` build with name + tagline, a short `cta` with the handle and "Subscribe" |
| social promo / menu / sale (9:16) | `social-promo`: `title` (what's new), `list` (items + prices), `cta` (hours, address); keep vertical safe areas |
| explainer / infographic | `infographic`: `title`, alternating `fact` and `chart`, closing `cta`; one fact = one icon + one number + one sentence |
| event / launch announcement | `event-promo`: `title` (name + date), `list` (speakers/agenda), `words` (3 big numbers), `cta` (tickets) |
