---
name: cinewright
description: Cinewright — make videos entirely from code, as an MP4 with original synthesized music and sound: everyday motion graphics (person / channel / brand intros, social promos, infographics, event announcements, quote cards) from a ready kit, plus showreels, product/UI explainers, trailers, logo reveals, kinetic typography, 3D, GPU particles, shader art, music videos. Every frame is a deterministic WebGL/canvas page rendered by headless Chrome and encoded with ffmpeg (no stock footage or video models). Ships a motion-graphics kit (11 scene types, 7 themes, 50 icons, a carried object and travelling transitions, auto-scored), a GPU film engine (32 transitions, 3D, particles, shaders, camera tools), templates, an atlas of 250+ tested techniques, QC tools and first-class Persian/RTL support. Use for ANY request for a video, animation, intro/outro, promo, explainer or visualizer — above all when the user wants it awesome / "go all out".
---

# Cinewright — studio mode

**Idea:** a video is `renderFrame(t)` — a *pure function of time* — plus a soundtrack synthesized from the *same cue timeline*. `tools/render.mjs` renders every frame in parallel headless Chrome tabs and pipes pixels to ffmpeg. Nothing depends on the previous frame, so any frame can be rendered, inspected and fixed independently — that is how you verify your own work without eyes or ears, and how you iterate fast.

`<skill>` = the folder containing this SKILL.md (e.g. `~/.agents/skills/cinewright`). Dependencies: Node ≥ 18, Chrome/Edge/Chromium, ffmpeg — nothing else.

## Route first (before anything else)
| the request is… | build it on | because |
|---|---|---|
| an **intro** (person / channel / brand), a **promo**, a menu or sale post, an **infographic**, an **event or launch announcement**, a quote card, a lower-third, a social post — in any language, *"go all out" included* | **the motion kit**: `node "<skill>/scripts/scaffold.mjs" film --template motion --preset <closest>`, then edit the spec (`references/motion-graphics.md`) | it is the studio-grade route for these: one-idea shots, a carried object, travelling transitions, scored sound and the QC gates are built in. "Go all out" means more care — your own copy, colour and shot order, a custom scene where the subject needs a drawn hero, three honest review rounds — not hand-writing a renderer: hand-built films of this kind came out as five slides on a timer |
| a **vertical data story**, a **title sequence**, an **ambient / generative landscape or loop**, an **app / product explainer**, a product / 3D hero, a cinematic trailer or launch film, a music visualizer, kinetic typography, shader or particle art, a showreel | `cinema` · `showreel` · `explainer` · `music` · `particles` · `shader` · `basic` (table below), `references/protocol.md` — **and first the genre's section in `references/genres.md`** (its structure goes into your shot list, its failure modes into your reviews) | the kit cannot draw these; each genre fails in its own way (a landscape as flat clip art, a title sequence as static credit cards, a data story as a dashboard) |
A mixed request (a motion-graphics film with one 3D hero shot) starts from the kit and adds the special shot as a custom scene (`MG.scenes.name`).

## What "great" means here (read this first)
Previous outputs from this skill were *correct but flat*: a **slideshow** — five full-screen layouts of a heading and three cards, each animating in, holding for three seconds and wiping or fading into the next; items that arrive once and then sit; one easing for everything. Real motion design is **cut into shots and continuous**: one idea fills the frame for a second or two, one object or one camera carries the eye from every moment into the next, things move at different speeds on different curves, and every cut lands on the music. The quality bar is set by **your decisions**:
**shots, not slides** — a 15 s film has 9–12 shots of 1–2 s, one idea each, never a heading above three cards (`references/anti-slideshow.md` §0) · **a specific concept** (not "glowing gradient + name") · **one style system** with a twist · **continuity** — a carried object plus a travelling transition (whip · push · zoom · iris · blinds) between shots, never wipe after wipe · **type that moves like design** (different entrances, one hit per shot) · **many different techniques** (≥ 6, from ≥ 4 families) · **sound events for every cut/hit** · **three review rounds on frames you actually looked at**. The film's frames are *full*: a hero at least 40 % of the frame height and a real background layer. For a *cinematic product or trailer* brief the hero object is a lit **3D mesh** (`Scene3D`, `atlas.mjs show product-ring-macro`), never a 2D outline.
**For everyday motion graphics the kit supplies the motion, timing and sound — you supply the subject:** write the copy, pick the theme, split the content into shots, choose their order and colour rhythm, and add a custom scene with a drawn hero (a cup, a product, a mark) when the subject needs one; then look at frames like any other film. Persian / Arabic (and Hebrew, with a font you load) copy: scaffold with `--lang fa` (or set `lang`/`dir` in the spec) and the whole layout mirrors, with Persian digits.
If the request says *go all out / awesome / wow / showreel / cinematic* — or gives you creative freedom — you are in studio mode: follow `references/protocol.md` fully (it is a *process*, on whichever engine the route table picked). A tiny request (a 5 s title card) may use a lighter version, never skipping the looking-at-frames step.

## Workflow (each step ends on a checkable criterion)
0. **Preflight** — `node "<skill>/scripts/doctor.mjs"` → "all good" (else tell the user exactly what to install).
1. **Concept & direction** (10 %) — write `brief.md` first: their words, your interpretation, duration/aspect/language. Then `node "<skill>/scripts/inspire.mjs" --brief "<their words>" [--duration 20]` (later also `node tools/inspire.mjs`) for three different directions (concept device, metaphor, style system, twist, techniques, timeline skeleton, sound plan) — pick one, add the **style bible** (5 hex tokens, 1–2 `K.FONTS`, motion rules, grade, sound plan). Add a **Continuity** table — one row per scene boundary: what travels (a carried object, the camera, a shape) and what changes (`references/anti-slideshow.md`); `qc craft` warns when it is missing. Ideas and metaphors: `node scripts/atlas.mjs show idea-metaphor-ladder` and `search <topic>`. *Done when:* brief.md has the one-sentence promise, the visual verb only this subject can do, hero moment (~75 %), last image (held ≥ 1 s), and a shot list with **one row per shot** — its seconds (the average is ≤ 2 s: 9–12 rows for a 15 s film, never "title · 3 cards · 3 numbers · quote · handle"), what carries into it, technique ids.
2. **Look-dev** (10 %) — before building a timeline, render 2–3 *style frames* and **look at them** (`render.mjs sheet --times …`, `still t`). Browse `references/gallery/*.jpg` with your image viewer; `node scripts/atlas.mjs sheet <ids>` renders recipes so you can see them. *Done when:* palette, hierarchy, depth and light are decided.
3. **Scaffold — fork, don't start blank** — for ordinary motion graphics (an intro, a promo, an infographic, an announcement) start from `--template motion --preset <closest>` and edit the spec — it is the fastest way to a film that looks designed (`references/motion-graphics.md`); otherwise `node "<skill>/scripts/scaffold.mjs" <dir> --template <name> [--lang fa] [--dur N] [--title "…"] [--examples]` (table below), `cd <dir>`; all later commands are relative. Pick the closest template and re-theme it (copy, palette, shot order, your concept); replace a scene only when you have a better one — films built from a blank page have come out thin. *Done when:* `node audio.mjs && node tools/render.mjs sheet` works on the untouched template.
4. **Cues first** — rewrite `<script id="cues">`: BPM, named scene times (on bar lines), `hits`. One timeline shared by picture and sound. *Done when:* every shot-list row has a cue name.
5. **Skeleton** (20 %) — all scenes present with correct timing and transitions (`Stage`), audio sketch, draft render, then `node tools/qc.mjs energy` **and `look`** (they work even if you cannot view images: they print the exact seconds that are static or empty). Look up each technique: `node scripts/atlas.mjs show <id>` (copy-paste recipes that are tested), API in `references/engine.md`.
6. **Three polish rounds** (50 %) — A: motion & camera · B: craft & detail · C: sound & finish. Each = look → fix list (`qc/review-N.md`) → fix → check the changed seconds (`sheet --times a:b:0.1`). *Done when:* the 10 review questions in protocol.md pass and `qc energy` **and `qc look`** have no WARN (a median frame fill under 15 % or more than half the film near-static is a **FAIL** — unless `brief.md` has a `Restraint: <why>` line because stillness is the concept).
7. **Gate** — `node tools/render.mjs verify` (PASS / `PASS~`) → full render → `node tools/qc.mjs check` (video, pacing, audio **and craft**: brief.md complete, ≥ 6 atlas techniques from ≥ 4 families, ≥ 4 transitions, 3 written review rounds; no FAIL, every WARN fixed or consciously accepted) → `node tools/qc.mjs sheet`.
8. **Deliver** — final message format at the end of this file.

## Choose the starting point (`--template`)
| The request looks like… | template | what you get |
|---|---|---|
| cinematic / trailer / brand or tech launch / AI / "wow", dark and glossy | **`cinema`** | 20 s, 7 scenes on **Stage**: particles → chrome 3D name → kinetic poster → night-city flight → 3D UI cards → burst → end; 6 transitions, camera, full synth score |
| intro (person / channel / brand), promo, menu or sale, infographic, event announcement, quote card, lower-third — **everyday motion graphics** (any language, "go all out" included) | **`motion`** (`--preset person-intro` · `channel-intro` · `social-promo` · `infographic` · `event-promo`) | the film is **data**: 11 scene types (title · **hit** · **fact** · words · quote · logo · cta · chart · chips · stats · list), 7 themes, a carried object, travelling transitions (whip · push · zoom · iris · blinds · cut), 50 self-drawing icons, music + sound design generated from the same spec; every preset is cut into 7–10 one-idea shots; vertical re-lays out by itself → `references/motion-graphics.md` |
| showreel / portfolio / bold graphic / poster / social reel / a designer's résumé | **`showreel`** | 17.5 s, 9 fast shots on a bright poster system: slam type · 3D plastic · particles · girih pattern · UI · liquid-metal shader · tunnel · burst · name card |
| product / app / SaaS explainer, UI walkthrough, tutorial | `explainer` | `lib/ui.js` windows, cursor, typing, charts — combine with cinema/showreel scenes for energy |
| music video, audio-reactive, lyric/podcast visualizer | `music` | `tools/analyze-audio.mjs` → envelopes |
| abstract particles / smoke / dust · 3D-looking raymarched objects | `particles` · `shader` | single-engine starters |
| minimal or fully custom | `basic` | canvas 2D + Post |
Every project gets **all libraries** (`lib/`): add `<script>` tags for what you use (order and API: `references/engine.md`). Prefer **`Stage`** (scene timeline + GPU transitions + camera) for anything longer than one shot. `--examples` also copies 8 runnable engine demos. Vertical/square are **re-compositions** (`--aspects 16:9,9:16`): read `?w=&h=` and re-lay out.

## The creative engine — use it, it is why the output can be spectacular
- **Atlas** — `node scripts/atlas.mjs search <words>` · `show <id>` · `sheet <id…|family>` (renders a contact sheet *so you can see it*) · `random` · `families`. 17 families, 256 entries: type · 3D · particles · shaders · looks (filters/grades) · camera · transitions · light · UI/data · graphic · logos (10 title-sting reveals) · sound · ideas · editing · color · styles · pipelines (glue patterns). Most entries carry **tested code** you can paste into a scene.
- **Gallery** — `references/gallery/atlas-<family>.jpg`, `transitions.jpg`, `backgrounds.jpg`, `filters.jpg`, `materials3d.jpg`, `fonts.jpg`: contact sheets of everything. Open the ones relevant to your style and choose by eye.
- **Direction generator** — `inspire.mjs` (above): three different bundles per brief; re-roll with `--seed`.
- **Endings & logos** — most briefs end on a name/mark: `atlas.mjs list logos` (stamp + shockwave, stroke trace, light sweep, shatter-in, liquid fill, glitch, GPU bloom ring, …); pair it with `sfx-hit-stack`, hold ≥ 1 s. Real PNG logo on white → `K.keyWhite(img)`. If you cannot view images, `references/qc.md` §7 gives the numeric substitute.
- **Styles** — 22 complete systems (`atlas.mjs list styles`): palette · fonts · motion · techniques · transitions · sound · grade · "avoid". One style per film.
- **Fonts** — 14 offline fonts incl. Anton, Playfair, Space Grotesk, Caveat, Fredoka and Persian Lalezar, Amiri, Reem Kufi, Aref Ruqaa, **Nastaliq**, Rakkas (`K.FONTS.*`, `gallery/fonts.jpg`).
- **Sound** — `lib/synth.mjs`: drums, bass, pads, strings, keys, plucks, `santur`, `ney`, `tombak`, `daf`, risers, impacts, UI sounds, ambience, `groove('house'|'trap'|'dnb'|'lofi'|'sixeight'…)`; quarter-tone note names (`'Ed4'`) and Persian modes. Recipes: `atlas.mjs list sound`.

## Rules that keep the pipeline honest (each has a reason)
1. **`renderFrame(t)` is pure** — no `Math.random`, `Date.now`, state carried between frames (use `K.hash/K.rng/K.noise`, closed-form motion; no feedback buffers: sample several times inside the shader instead). *Why:* parallel, out-of-order rendering; `verify` proves it.
2. **Build heavy things once** (Scene3D, Parts, geometry, textures, fonts in `window.ready`), never inside `renderFrame`.
3. **One timeline** (`cues`) read by `video.html` and `audio.mjs`. **Assets are local**; `K.loadFonts()` throws on a missing font — load every font you draw with.
4. **Verify by measurement and by looking** — contact sheets, `still`, `qc.mjs`; never report "done" from a log line. **Never claim a check you did not run.**
5. **Long renders run detached** (`--detach`, poll `status`, end with `render.mjs stop` — never kill Chrome by hand).
6. **Do not add GPU-forcing Chrome flags**; if WebGL misbehaves use `--gpu off`.

## Commands
```
node tools/render.mjs sheet [--times 1,4.5 | 3:4:0.1 | --count 24 | --markers] [--w 540 --h 960]   contact sheet / motion filmstrip → qc/sheet.png
node tools/render.mjs still 3.5,12        full-size PNGs        node tools/render.mjs verify     determinism check
node tools/render.mjs [--quality draft|web|high|max] [--aspects 16:9,9:16] [--detach] [--motion-blur 8]    render → out/*.mp4   (status · stop · serve)
node tools/qc.mjs check | craft | energy | audio | video | loop | sheet | frames | palette         node tools/analyze-audio.mjs song.wav → envelopes.json
node tools/atlas.mjs search|show|sheet|list|random|wav|test|gallery      node tools/inspire.mjs --brief "…"     (inside a scaffolded project; before scaffolding: node "<skill>/scripts/…")
```
Renders are resumable (re-run the same command). Options, codecs, speed, troubleshooting → `references/pipeline.md`.

## Hard rules for "not a slideshow" (check with `qc.mjs energy` and `qc.mjs look`)
**Shots, not slides: ≥ 9 shots per 15 s (average ≤ 2 s), one idea each, never a heading above rows of cards** · **Frame fill: the picture is FULL, not thin lines on empty black (hero ≥ 40 % of frame height, a real background layer, median fill ≥ 25 %)** · Camera motion in every scene · no element static > 1.2 s without secondary motion · ≥ 4 different transitions (vary them; match cuts are best) · a sound event for every cut and hit · pacing curve (not equal scene lengths) · foreground/mid/background layers · a breath of silence before the peak · the last frame held ≥ 1 s · text ≥ 4 % of frame height, contrast ≥ 4.5:1, ≤ 7 words per screen · a limited palette (5 tokens) · hits punch the camera +2–3 %.

## Persian / Arabic / RTL (first-class)
`K.text`, `K.words`, `K.lay`, `K.wrap` detect direction and shape script correctly (Vazirmatn + the Persian display fonts). Animate Persian **word by word** (`K.words`, `Type.*` do this automatically) — never per letter, never letter-spaced; digits with `K.faDigits` / `fmtNum(n,{fa:true})`; Latin brand names stay one unit inside RTL lines; RTL layouts flow right→left (first word rightmost, slides/wipes enter from the right). Display options: `faDisplay` Lalezar (headline), `faNastaliq` (poetry titles), `faKufi`, `faRuqaa`, `faClassic`. Details → `references/typography-rtl.md`. Persian visual identity: `style-persian-heritage`, `gfx-girih-reveal`, `type-persian-calligraphy`; sound: `beat-persian-sixeight`, `persian-santur-melody`.

## Failure modes to expect
- **White-out / flat white disc / grey veil:** bloom + additive glow on bright shapes → draw halos first, subject on top, lower `bloom`, raise `threshold`; Scene3D env colours are *light intensities* (bright pastels glow) — use dark values and `S.sky.amt`. Check full-size `still` frames.
- **Static "slideshow" stretches:** `qc energy` WARN → add camera drift/push, parallax particles, a second mover, or cut earlier.
- **3D object looks dull:** it needs a coloured environment, a floor/fog and depth of field (`atlas show text3d-chrome`).
- **GL errors:** `INVALID_OPERATION` after a shader edit → an unset `sampler2D` defaults to unit 0 (the render target itself): set every sampler; "context lost" → `--gpu off`; thousands of blend-mode draws on a GPU 2D canvas → bake on a CPU canvas (`K.canvas(w,h,{cpu:true})`).
- **Muddy/dull mix, sound off-beat:** `qc audio` band table; place events with `cueTime(...)`/`T.x` from the shared cues, never hard-coded seconds.
- **Fallback font in the video:** a font is not in `K.loadFonts([...])`; check `[page error]` lines.
- **Slow/stalling render:** the renderer measures memory and sheds workers; try `--workers 2`, lower `ss` of Scene3D, fewer particles, `--quality draft` while iterating → pipeline.md.

## References (read only what the step needs)
| File | Read it when |
|---|---|
| `references/protocol.md` | **always in studio mode**: phases, review questions, ambition budget, parallel (sub-agent) work |
| `references/engine.md` | writing code: every library's API on one page |
| `references/atlas/*.md` (via `atlas.mjs`) | choosing techniques, copying tested recipes, styles, ideas, editing, colour, sound |
| `references/gallery/*.jpg` | looking at what techniques look like before choosing |
| `references/review-example.md` | what a *substantive* three-round review looks like (looked at → ranked findings with scene, cause, exact change → result) — read it once before your first review round |
| `templates/cinema/` · `templates/showreel/` | complete worked examples (`direction.md` → `video.html` → `audio.mjs`): fork the closest one |
| `references/direction.md` · `motion.md` · `visuals.md` · `sound.md` | background theory: structure per video type, timing tables, effect craft, music & mixing |
| `references/genres.md` | **every film that is not an everyday intro/promo**: per genre (vertical data story · title sequence · ambient / loop · app explainer · logo sting · kinetic type · music visualizer · product reveal) the structure, the look, what fails and the atlas ids to start from |
| `references/anti-slideshow.md` | **every film**: continuity (one camera, a carried object), per-move curves, type entrances, rhythm — what separates motion design from animated slides, with a checklist for polish round A |
| `references/motion-graphics.md` | **any intro / promo / infographic / announcement**: the spec format, scene types, themes, wipes, icons, recipes, quality checklist |
| `references/typography-rtl.md` | any Persian/Arabic/mixed text |
| `references/pipeline.md` · `qc.md` | render options and troubleshooting; what to check, symptom → fix |

## Deliverable format (keep it short)
(1) path(s) of the MP4(s) (+ stems if relevant) · (2) one line each: concept, style, duration/resolution/fps, what you checked (verify, qc check/energy, which frames you looked at) · (3) the command to re-render and to preview (`node tools/render.mjs serve`) · (4) assumptions made / WARNs accepted. If the user gave a storyboard, map your scenes to theirs.
