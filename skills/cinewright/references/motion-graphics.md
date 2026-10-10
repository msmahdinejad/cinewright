# Motion graphics — the fast path for everyday jobs

Most video requests are not trailers. They are **an intro for a person or a channel, a promo for a shop, a product feature, an infographic, an event announcement, a lower-third, a quote card**: a sequence of bold *shots*, each with one idea, moving on the beat, with sound. For these, do not write a renderer — **describe the film as data** and let the kit draw and score it. It is the studio-grade route, not a lite one: "go all out" means more care in the copy, the colour, the order, the timing, a custom scene where the subject needs a drawn hero, and looking at frames — not a different engine. You spend your time on what makes it good.

```bash
node "<skill>/scripts/scaffold.mjs" film --template motion --preset person-intro     # or channel-intro · social-promo · infographic · event-promo
cd film && node audio.mjs && node tools/render.mjs sheet --count 24                   # look at qc/sheet.png, then edit the spec in video.html
```
`--preset` gives a complete, good-looking film for a made-up subject; **replace every word, number and colour with the user's**, reorder/add/remove shots, then iterate. Vertical (`--w 1080 --h 1920`) re-lays out by itself; the `social-promo` preset is vertical already.

## Shots, not slides (the rule the presets are built on)
A *slide* is a heading with a few items under it that stays for 3–5 seconds. A *shot* is **one idea filling the frame** for 1–2 seconds, and then the carried object or the camera moves on. A film of five slides reads as a slideshow however well each slide animates; a film of ten shots reads as motion design. Split the content, don't lay it out:

| content | slide (avoid) | shots (do this) |
|---|---|---|
| three skills / features | `chips`: a heading above three cards, 3 s | three `hit`s of 1 s — the skill in giant type, the carried disc turning into its icon |
| three numbers | `stats`: three counters side by side | three `fact`s of 1.5 s — one number fills the frame and counts, the flood colour flips on every cut |
| speakers, menu items, steps | `list` rows | one `hit` per person or item (name huge, detail small), 1.5 s each |
| a quote | 5 s of centred text | one `quote` of 2–2.5 s, type that fills the frame |
| "3 days · 40 talks · 1 city" | a bullet list | `words`: one colour flood per phrase, 0.5–1 s each |
| the ending | a 1 s card | a `cta` of ≥ 2.5 s that holds (handle pill, button) |

* **Budget:** a 15 s film has 9–12 shots (average ≤ 1.7 s), an 8 s intro 6–7, a 20 s explainer 10–12. Only the opener and the closing hold run longer than 2.5 s. `qc craft` counts them and warns about rows of cards.
* **Every shot has one dominant element** (≥ 40 % of the frame height): a word, a number, an icon disc. Consecutive shots must not look alike — alternate `layout` (`left` · `right` · `center`), the flood colour (`color`), the entrance (`styles`) and the transition.
* `chips`, `stats` and `list` are **row layouts** — right for a dashboard, a price list that must be read, a comparison. Use at most one per film and say why in `brief.md`.

## The spec (`<script id="cues">` in video.html — picture and sound both read it)
```json
{ "bpm": 120, "duration": 15, "mood": "upbeat", "transition": "whip",
  "theme": { "preset": "poster" },
  "carry": { "keys": [ … ] },
  "scenes": [ { "type": "title", "at": 0, "lines": ["Alex", "Morgan"], "art": true }, { "type": "hit", "at": 2.5, "text": "Brand identity", "carried": true, "transition": "iris" }, … ] }
```
* **Times** are seconds; start scenes on beats (bpm 120 → every 0.5 s). A scene lasts until the next one starts (the last until `duration`). Item *i* of a scene appears at `at + (lead ?? .3) + i·(step ?? beat/2)` — audio.mjs uses the same formula, so changing a time moves the pop sound with it. One-idea scenes (`hit`, `fact`, `logo`) **compress their entrances to the shot length** (a 1-second `hit` runs its choreography at ~2.5× speed; audio.mjs applies the same factor).
* **`transition`** (spec default, or per scene = the transition *into* that scene): `whip` (default; `push` in vertical films) — both scenes travel on one camera strip, the incoming one slides over the outgoing one with a soft shadow · `zoom` (fly through) · `iris` (the next scene opens inside a circle that grows from `focus: [x, y]` or from the carried object) · `blinds` (strips reveal it) · `cut` (a 1.07× punch-in on the beat). `transitionDur` (default 0.7 s; use 0.45–0.6 s between 1-second shots). The legacy colour wipes (`wipe`: `stripes` · `circle` · `slide` · `flood` · `blocks` · `diagonal`, `wipeDur`) still work, but a wipe after every scene reads as a deck of slides — use them on purpose, not by default. Never the same transition more than twice in a row. Render the final with `--motion-blur 6 --shutter .5` so travelling moves smear along their direction.
* **Camera:** every scene breathes — a slow push-in (alternating strength), the beat punches it +1 %. `"push": .05` (more), `"push": -.04` (a pull-out) per scene.
* **`bg`** per scene: `blobs` · `dots` · `grid` · `stripes` · `rays` · `waves` · `flat` · `grad`; **`bgColor`** (`a`/`b`/`c`/`d`/`ink` or a hex) gives the scene a full colour block with automatically readable text — the quickest way to get the bold flat-poster look and a rhythm of colour changes. `float: false` removes the drifting shapes. (`hit`, `fact` and `words` paint their own flood.)
* **Theme**: `preset` = `poster` (cream · tomato · mustard · forest · mint, condensed caps — loud and friendly) · `pop` · `night` (dark, glow) · `studio` (editorial) · `mint` · `warm` (coffee/dark) · `ocean` (blue dark); override any token (`a b c d bg bg2 ink`), `head`: `grotesk` (default) · `display` (condensed caps) · `rounded` · `serif`, `caps: true|false`.
* **mood** (music): `upbeat` · `chill` · `tech` · `cinematic`.
* **Aspect ratios:** the kit lays out 16:9 and 9:16 (a wide or a tall frame). A square or 4:5 frame needs its own composition — write the shots as custom scenes (`MG.scenes.name`) rather than stretching the built-in layouts, which assume one of the two.

## Continuity: a carried object and travelling transitions
A film of independent scenes is a slideshow however good each slide is. Give it a spine — **one object that never leaves the frame**:
```json
"carry": { "fill": "a", "fill2": "c", "keys": [
  { "at": 0.15, "dur": 0.9,  "x": 0.76, "y": 0.5,  "size": 0.5,  "letter": "AM" },
  { "at": 2.2,  "dur": 0.6,  "x": 0.2227, "y": 0.5, "size": 0.5, "icon": "pen", "fill": "a", "fill2": "c" },
  { "at": 5.2,  "dur": 0.6,  "x": 0.93, "y": 0.13, "size": 0.085, "letter": "AM" },
  { "at": 12.25, "dur": 0.85, "x": 0.5,  "y": 0.56, "w": 0.74, "h": 0.17, "text": "@alexmorgan", "ts": 0.1 } ] }
```
* The first key is where it appears; every later key is a **move** that starts at `at`, lasts `dur` (default 0.75 s) and ends in that state. Start a move ~0.25 s *before* the scene it belongs to, so it is already travelling while the camera moves. `x`, `y` are fractions of the frame; `size` (or `w`/`h`/`r`) are fractions of the shorter side; `fill`/`fill2` are theme keys (`a`–`d`) or hex; content is `letter`, `icon` or `text` (`ts` = text size; a `text` pill must be wide enough: ~`ts` × 0.62 × characters + 0.1). It winds up, stretches along its travel, settles and breathes on the beat; the content cross-fades mid-move; it recolours itself when it would vanish into a flood of its own colour.
* Scenes cooperate: `title { art: true }` keeps room for it, `hit { carried: true }` and `fact { carried: true }` leave their icon spot to it (`hit` with `layout: "left"`: x = 0.7773; `"right"`: x = 0.2227; `"center"`: x = 0.5, y = 0.29, size 0.37; vertical: x = 0.5, y = 0.27, size 0.5; y = 0.5 and size 0.5 for left/right), `cta { handle: false }` lets it *be* the handle pill, `logo { mark: 'none' }` lets it be the mark. `iris` opens the next scene from its position.
* One carried object; let it rest for a beat between moves and keep it off the text. Name it and the transition of every boundary in `brief.md` under *Continuity* (`anti-slideshow.md`).
* Type entrances: `title` lines and `hit` lines take `"styles": ["slideL", "slam"]` (`rise` · `slideL` · `slideR` · `slam` · `drop`; `style` on `MG.mask` in custom scenes). A quiet line first, the hit last, one slam per scene.

## Scene types
| type | fields | what it is |
|---|---|---|
| `title` | `kicker`, `lines[]` (1–3), `sub`, `avatar` (initials) or `icon`, `badges[]` (icon names orbiting the art), `art: true` (the carried object is the art) | the opener / name card: big stacked lines that slide up out of a mask, an accent underline that draws itself, an avatar disc with orbiting badges |
| **`hit`** | `text` (or `lines[]`; long text breaks into two balanced lines), `sub`, `kicker`, `icon` or `carried: true`, `color` (`a`–`d`; default cycles), `layout` (`left` · `right` · `center`), `styles[]`, `decor` (`rays` · `dots` · `stripes` · `rings`), `ghost: false`, `flood: false` | **ONE idea filling the frame** — the workhorse: a colour flood, a statement that lands, a ghost copy of it drifting behind, tone-on-tone decoration, an icon disc beside it. A skill, a speaker, a menu item, a slogan, a date |
| `fact` | `icon` or `carried`, `value`+`suffix`+`prefix`+`decimals` (counts up) *or* `big` (a word or phrase), `text`, `kicker`, `color`, `layout` (`left` · `right`) | one number or phrase with one icon and one sentence, on a flood with a sunburst; the number scales in and counts |
| `words` | `words[]`, `step`, `sub` | rapid full-frame words on colour floods (energy, countdowns, hooks, "3 days · 40 talks · 1 city") |
| `quote` | `text`, `who`, `role`, `flood` (colour key) | a big quote mark and the words sliding up, attribution with a drawn rule |
| `logo` | `mark` (`pulse`·`bolt`·`play`·`ring`·`orbit`·`letter`+`letter`·`none`), `name`, `tag` | a mark that builds itself, the name popping letter by letter, a tagline, a shine (compresses to 2 s) |
| `cta` | `line`, `handle`, `sub`, `button` | the closing line, a handle/URL in a pulsing pill, confetti, a button — hold it ≥ 2.5 s |
| `chart` | `title`, `kind` `bars`/`ring`/`line`, `data[{label, value}]`, `highlight`, `unit`, `max`, `caption` | animated chart with the key value highlighted (a data shot of ~3 s; the one place a slide-like layout is the point) |
| `chips` · `stats` · `list` | `title`/`kicker`, `items[…]` | **row layouts** (cards / counters / rows): a heading above 2–5 items. Right for a dashboard or a price list; for skills, numbers and speakers prefer `hit` / `fact` shots |
Icons (`MG.icons`): user users briefcase pen layers code search bulb rocket trophy award calendar ticket mic pin globe mail play camera music coffee cup leaf bean brain chart trend target smile bell bag tag gift zzz battery wifi shield book flag eye pulse grid cube home heart star bolt moon sun clock check plus arrow.

## When the kit does not have it — add a scene, keep everything else
```js
MG.scenes.cup = (g, lt, t, sc, X) => {            // X = { W, H, U (unit = H/1080), V (vertical), T (theme tokens), B (beat) }
  const p = K.E.outBack(K.prog(lt, .2, .9)); … draw the subject-specific art here (a drawn coffee cup, a product, a map pin, a chart of your own) …
};                                                 // then  { "type": "cup", "at": 3, … }  in the spec
```
Use `MG.mask`, `MG.pop`, `MG.icon`, `MG.iconDisc`, `MG.card`, `MG.stat`, `MG.underline`, `MG.avatar`, `MG.wipe`, `MG.floaters`, `MG.sheen` inside it (`sc.i` = its index, `sc.end` its end time, `MG.shotK(sc)` the shot-length factor for compressing your own entrances). A custom hero illustration (drawn from circles, rounded rects and paths) as ONE shot in the sequence, plus the kit's type, colour, transitions, carried object and sound, is exactly what makes a simple film feel designed — and what keeps the film about *this* subject, not a template.

## Persian, Arabic, Hebrew (right-to-left)
Scaffold with `--lang fa` (or write `"lang": "fa"` / `"dir": "rtl"` in the spec) and write the copy in the script: the **whole layout mirrors** (title text right-aligned with the avatar on the left, cards ordered right → left, list icons on the right, a `hit` with `layout: "left"` ends up with its text on the right) and every text run is shaped by the browser (Vazirmatn is the fallback of every theme font; heavy display faces fall back to Vazirmatn 800). Persian and Arabic use the bundled Vazirmatn; Hebrew needs a Hebrew font you load yourself (`K.loadFonts`). `lang: "fa"` also writes **Persian digits** with the Persian thousands/decimal separators (`"digits": "latin"` keeps ASCII digits). Keep Latin handles and URLs as they are — they stay readable inside the mirrored layout. In a custom scene draw text with `MG.text(g, str, x, y, opts)` (same signature as `K.text`) so it mirrors with the rest; shapes need nothing. Animate Persian by words or lines, never per letter (joining breaks).

## What makes simple motion graphics look expensive (check before you ship)
0. **Shots, not slides** (table above): 9–12 shots for 15 s, one dominant element each, the longest being the ending.
1. **Continuity**: a carried object and a travelling transition between every pair of scenes (`whip`, `iris`, `zoom` …) — not wipe after wipe. Filmstrip every boundary: `render.mjs sheet --times a:b:0.15`.
2. **A colour system and a rhythm of colour**: 3–4 colours only, a different `color` / `bgColor` every shot, text always readable (the kit picks black/white automatically).
3. **Everything moves, nothing sits**: entrances with overshoot, a ghost layer, drifting shapes, counters, pulses, the camera push; `qc energy` should show < 25 % near-static.
4. **Type does the work**: the biggest thing on screen is the message; ≤ 7 words per shot; numbers as counters, not text.
5. **Sound on every beat of the picture**: the kit does it; listen to the mix (`qc audio`) and make sure the music is not louder than the pops.
6. **A last image that holds** (≥ 1.5 s) with the name / handle / call to action.
7. **Look at frames** (sheet + 3 full-size stills), write the three review rounds, run `qc check` — same protocol as every other film.

## Typical briefs → recipe
| brief | preset → what to change |
|---|---|
| introduce a person | `person-intro` (9 shots): title (name, role) · three `hit` skills · three `fact` numbers · `quote` · `cta`; pick the theme that fits the person (`poster` friendly, `studio` editorial, `night` techy) |
| channel / brand intro (5–8 s) | `channel-intro` (7 shots): a `words` hook (3 words), the `logo` build with name + tagline, a `hit` and a `fact` of proof, a `cta` with the handle and "Subscribe" |
| social promo / menu / sale (9:16) | `social-promo` (9 shots): `title` (what's new), one `hit` per product with its price, a `fact`, a `words` burst for the hours, `cta` (address) |
| explainer / infographic | `infographic` (10 shots): `title`, `fact`s and `hit`s with a `words` burst and one `chart`, closing `cta`; one fact = one icon + one number + one sentence |
| event / launch announcement | `event-promo` (9 shots): `title` (name + date), one `hit` per speaker, `words` (3 big numbers), a `hit` for date and place, `cta` (tickets) |
