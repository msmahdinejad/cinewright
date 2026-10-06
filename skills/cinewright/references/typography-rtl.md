# Typography and RTL — Persian, Arabic and mixed-direction text

Contents: [1 Setup](#1-setup) · [2 Rules](#2-the-rules) · [3 API](#3-api) · [4 Mixed direction](#4-mixed-direction-lines) · [5 Animation](#5-animating-persian-text) · [6 Numbers & punctuation](#6-numbers-and-punctuation) · [7 Layout for RTL](#7-layout-for-rtl) · [8 Effects](#8-effects-that-are-safe-and-not) · [9 Verify](#9-verifying-text) · [10 Pitfalls](#10-pitfalls-seen-in-real-projects)

## 1. Setup
- The scaffold bundles **Vazirmatn** (variable 100–900, Persian/Arabic + Latin), **Inter** and **JetBrains Mono** in `fonts/` with `fonts/fonts.css` (SIL OFL). Link it: `<link rel="stylesheet" href="fonts/fonts.css">`, set `<html lang="fa">`.
- Wait for them: `window.ready = K.loadFonts(['800 Vazirmatn','500 Vazirmatn', …])` — it **throws** if a face did not load, and `render.mjs` refuses to render with failed fonts. (A past project shipped a serif fallback because Google Fonts were fetched over the network; fonts must be local.)
- Canvas shapes Arabic script with the browser's text engine: correct joins, ligatures, marks, and RTL, as long as you draw **whole words** with `direction = 'rtl'` (which `K.text` sets automatically).

## 2. The rules
1. Draw Persian as whole words; animate **per word**, never per letter (splitting letters breaks the joins).
2. No `letter-spacing`/tracking on Arabic script (it detaches connected letters). Latin may be tracked.
3. Keep ZWNJ (U+200C, «نیم‌فاصله») inside words such as «می‌کند», «ساخته‌شده»: do not strip or replace it.
4. Use Persian digits ۰–۹ and punctuation `،` `؛` `؟` `٪` `«»` in Persian copy (`K.faDigits`, `K.fmtNum(n,{fa:true})`).
5. First word of an RTL line sits at the **right**; reading, staggers, wipes and progress all flow right → left.
6. Latin brand names / code inside Persian lines are single units (see §4).
7. Vazirmatn's ascenders/descenders are tall: use line-height 1.5–1.7 and centre by ink (`ink:true`) for big words.

## 3. API
| Call | Purpose |
|---|---|
| `K.text(g, str, x, y, {size, weight, family, fill, glow, stroke, align, max, spacing, ink, dir})` | one line; direction auto-detected from the first strong character (`K.dirOf`); family auto-picks Vazirmatn for Arabic-script strings; `max` shrinks to fit a width; `ink:true` centres by real glyph bounds |
| `K.words(g, str, cx, y, lt, o)` / `K.lay(g, str, cx, o)` | word layout in **reading order** (right→left for RTL), stagger animation; runs of opposite-direction words stay grouped |
| `K.chars(...)` | per-character — Latin only; Arabic script falls back to words automatically |
| `K.wrap(g, str, maxW, o)` | line breaking at spaces; logical order preserved (draw each line with `K.text`) |
| `K.typed(str, p)` | typewriter by grapheme cluster (Persian-safe) |
| `K.measure(g, str, o)` | `{w, asc, desc, rtl}` |
| `K.isRTL(s)`, `K.dirOf(s)` | detection |
| `K.faDigits(s)`, `K.fmtNum(n, {fa, compact, decimals})` | digits and number formatting (`٬` thousands, `٫` decimal) |
| `K.sampleText(str, {size, weight, w, h, step, dir})` | pixels → points for particle morphs (the browser did the shaping) |
| `UI.input/chat/button` | RTL-aware labels via `K.text` |

## 4. Mixed-direction lines
The browser's bidi algorithm orders a **whole line** correctly (`K.text`). Per-word animation (`K.words`) must reproduce that order by hand: `K.lay` groups each run of opposite-direction words into one unit — "از Google AI Studio استفاده کن" lays out as `[از] [Google AI Studio] [استفاده کن]`, right to left, with the English phrase left-to-right inside. Rules of thumb:
- Put Latin/product names in one run; do not end a Persian line with Latin punctuation (`.`/`!` may jump to the wrong side) — end with Persian punctuation or restructure.
- Numbers written with Western digits are LTR runs inside RTL text; prefer Persian digits in Persian copy.
- Parentheses and quotes mirror automatically in RTL context; verify visually.
- A caption with both languages: two separate lines, each with its own alignment/size, is clearer than one mixed line.
- `K.wrap` on a mixed paragraph keeps logical order; draw each returned line with `K.text` (whole-line bidi).

## 5. Animating Persian text
- **Word stagger:** `K.words(g, str, W/2, y, lt - .3, {size, weight:800, each:.07, dur:.55, dy:24})` — first word (rightmost) enters first.
- **Mask reveal** (whole line, right→left): clip a rectangle growing from the right edge (motion.md §5) — smooth and safe.
- **Typewriter:** `K.typed(str, p)` grows from the start (right edge); draw with `align:'right'` at a fixed right anchor so the text does not jitter.
- **Slam:** `K.slam(g, lt, x, y, () => K.text(g, word, 0, 0, {…}))` per word/phrase — fine, it scales the whole word.
- **Particle morph:** sample the shaped word with `K.sampleText` and sort destinations right→left (`dirB:-1`) so the word "writes" in the correct direction.
- **Blur/opacity/scale/glow** are all safe; **letter-level** effects are not.

## 6. Numbers and punctuation
Persian digits look like: ۰۱۲۳۴۵۶۷۸۹. `K.fmtNum(1234567,{fa:true})` → «۱٬۲۳۴٬۵۶۷»; compact `{compact:true}` → «۱٫۲M» (unit letters stay Latin; write your own «هزار/میلیون» mapping if you need Persian units). Percent `٪`, question `؟`, comma `،`, semicolon `؛`. Times/dates: write Jalali dates as text yourself; do not trust `toLocaleDateString('fa')` across Chrome builds. Right-align number columns; keep units small and muted.

## 7. Layout for RTL
Mirror what is directional: the first item is on the right; progress bars fill from the right; carousels advance leftwards; arrows for "next" point left; chat "my" bubbles align to the right edge in the templates (adjust if your product mirrors); reading-order stagger right→left; camera pans that "follow the text" go right→left. Icons that depict direction (arrows, play) mirror; logos, numbers, charts' time axes conventionally do not (say so in `direction.md` if you decide otherwise).
For vertical (9:16) keep Persian lines ≤ 4–5 words each, sized 90–140 px; wrap with `K.wrap` and centre.

## 8. Effects that are safe and not
- Safe: gradient fills (`fill:(c,{x0,x1}) => …`), glow, drop shadow, outline, scale/rotate, blur-in, masks, per-word colour changes, particles.
- Careful: **chromatic aberration / RGB split** on Persian text can leave bright lines at the joins — keep `ca` ≤ .003 or fringe *under* a matte copy; heavy datamosh/glitch over Persian words hurts legibility; strong bloom on thin strokes blurs dots (نقطه) — the dots are what distinguishes letters.
- Never: per-letter animation, tracking, forced uppercase (no case in Arabic script), text on a path that rotates individual glyphs.

## 9. Verifying text
`node tools/render.mjs sheet --query lang=fa --times …` and look at: joined letters (no gaps), dots and marks intact, correct order (read the sentence!), Latin runs in the right place, punctuation on the correct side, no overlap with icons, size ≥ 4 % of the frame height. Then `node tools/qc.mjs sheet` on the encoded MP4 (fonts survived encoding). Compare against `K.text` of the whole line if `K.words` looks wrong.

## 10. Pitfalls seen in real projects
| Symptom | Cause | Fix |
|---|---|---|
| Latin serif font in the final video | web font fetched from the network, not loaded | local `@font-face`, `K.loadFonts` |
| Broken/separated letters | per-letter animation or letter-spacing | word-level animation, spacing 0 |
| "Google AI Studio" reversed | words laid out one by one in RTL | use `K.lay`/`K.words` (groups runs) |
| Gradient text vanishes on purple glass | contrast | lighten the gradient, darken the glass ("smoke") |
| Cursor covers the button label | hand-placed positions | compute from the button rect (`UI.fit` design units) |
| Headline placed too high / clipped | em-box centring with tall glyphs | `ink:true`, check the sheet |
| Two headlines stuck together | tight line-height | 1.5–1.7 for Persian |
| Numbers look Latin in a Persian sentence | forgot `faDigits` | convert all displayed numbers |
| Text unreadable on Instagram | outside the safe zone | keep out of the top 14 % / bottom 20 % |
