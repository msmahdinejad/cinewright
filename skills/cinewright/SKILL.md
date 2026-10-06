---
name: cinewright
description: Cinewright — make videos entirely from code — cinematic motion graphics, showreels and reels, product/UI explainers, teasers and trailers, logo reveals, kinetic typography, 3D (chrome, glass, cities), GPU particles, shader art, music videos — as an MP4 with original synthesized music and sound design. Every frame is a deterministic WebGL/canvas page rendered by headless Chrome and encoded with ffmpeg (no stock footage, samples or video models). Ships a GPU film engine (scene sequencer with 32 transitions, 3D renderer, particles, 25 shader backgrounds, 26 filters, kinetic type, camera tools), 3 flagship templates, a searchable atlas of 230+ tested techniques with a visual gallery, a creative-direction generator, a sound engine with Persian instruments, QC tools and first-class Persian/RTL support. Use for ANY request for a video, animation, reel, teaser, intro/outro, explainer or visualizer — above all when the user wants it awesome / cinematic / "go all out", in Persian/Arabic, or with original music.
---

# Cinewright — studio mode

**Idea:** a video is `renderFrame(t)` — a *pure function of time* — plus a soundtrack synthesized from the *same cue timeline*. `tools/render.mjs` renders every frame in parallel headless Chrome tabs and pipes pixels to ffmpeg. Nothing depends on the previous frame, so any frame can be rendered, inspected and fixed independently — that is how you verify your own work without eyes or ears, and how you iterate fast.

`<skill>` = the folder containing this SKILL.md (e.g. `~/.agents/skills/cinewright`). Dependencies: Node ≥ 18, Chrome/Edge/Chromium, ffmpeg — nothing else.

## What "great" means here (read this first)
Previous outputs from this skill were *correct but flat*: one idea per film, a handful of effects, a slideshow rhythm. The engine now makes **cinema-grade** looks cheap (GPU transitions, 3D with real reflections and depth of field, 50 000-particle morphs, shader backgrounds, kinetic type, camera moves), so the quality bar is set by **your decisions**:
**a specific concept** (not "glowing gradient + name") · **one style system** with a twist · **many different techniques** (≥ 6, from ≥ 4 families) · **camera motion in every scene** · **sound events for every cut/hit** · **three review rounds on frames you actually looked at**.
If the request says *go all out / awesome / wow / showreel / cinematic* — or gives you creative freedom — you are in studio mode: follow `references/protocol.md` fully. A tiny request (a 5 s title card) may use a lighter version, never skipping the looking-at-frames step.

## Workflow (each step ends on a checkable criterion)
0. **Preflight** — `node "<skill>/scripts/doctor.mjs"` → "all good" (else tell the user exactly what to install).
1. **Concept & direction** (10 %) — write `brief.md` first: their words, your interpretation, duration/aspect/language. Then `node "<skill>/scripts/inspire.mjs" --brief "<their words>" [--duration 20]` (later also `node tools/inspire.mjs`) for three different directions (concept device, metaphor, style system, twist, techniques, timeline skeleton, sound plan) — pick one, add the **style bible** (5 hex tokens, 1–2 `K.FONTS`, motion rules, grade, sound plan). Ideas and metaphors: `node scripts/atlas.mjs show idea-metaphor-ladder` and `search <topic>`. *Done when:* brief.md has the one-sentence promise, the visual verb only this subject can do, hero moment (~75 %), last image (held ≥ 1 s), shot list with technique ids.
2. **Look-dev** (10 %) — before building a timeline, render 2–3 *style frames* and **look at them** (`render.mjs sheet --times …`, `still t`). Browse `references/gallery/*.jpg` with your image viewer; `node scripts/atlas.mjs sheet <ids>` renders recipes so you can see them. *Done when:* palette, hierarchy, depth and light are decided.
3. **Scaffold** — `node "<skill>/scripts/scaffold.mjs" <dir> --template <name> [--lang fa] [--dur N] [--title "…"] [--examples]` (table below), `cd <dir>`; all later commands are relative. *Done when:* `node audio.mjs && node tools/render.mjs sheet` works on the untouched template.
4. **Cues first** — rewrite `<script id="cues">`: BPM, named scene times (on bar lines), `hits`. One timeline shared by picture and sound. *Done when:* every shot-list row has a cue name.
5. **Skeleton** (20 %) — all scenes present with correct timing and transitions (`Stage`), audio sketch, draft render, `node tools/qc.mjs energy`. Look up each technique: `node scripts/atlas.mjs show <id>` (copy-paste recipes that are tested), API in `references/engine.md`.
6. **Three polish rounds** (50 %) — A: motion & camera · B: craft & detail · C: sound & finish. Each = look → fix list (`qc/review-N.md`) → fix → check the changed seconds (`sheet --times a:b:0.1`). *Done when:* the 10 review questions in protocol.md pass and `qc energy` has no WARN.
7. **Gate** — `node tools/render.mjs verify` (PASS / `PASS~`) → full render → `node tools/qc.mjs check` (video, pacing, audio **and craft**: brief.md complete, ≥ 6 atlas techniques from ≥ 4 families, ≥ 4 transitions, 3 written review rounds; no FAIL, every WARN fixed or consciously accepted) → `node tools/qc.mjs sheet`.
8. **Deliver** — final message format at the end of this file.

## Choose the starting point (`--template`)
| The request looks like… | template | what you get |
|---|---|---|
| cinematic / trailer / brand or tech launch / AI / "wow", dark and glossy | **`cinema`** | 20 s, 7 scenes on **Stage**: particles → chrome 3D name → kinetic poster → night-city flight → 3D UI cards → burst → end; 6 transitions, camera, full synth score |
| showreel / portfolio / bold graphic / poster / social reel / a designer's résumé | **`showreel`** | 17.5 s, 9 fast shots on a bright poster system: slam type · 3D plastic · particles · girih pattern · UI · liquid-metal shader · tunnel · burst · name card |
| product / app / SaaS explainer, UI walkthrough, tutorial | `explainer` | `lib/ui.js` windows, cursor, typing, charts — combine with cinema/showreel scenes for energy |
| music video, audio-reactive, lyric/podcast visualizer | `music` | `tools/analyze-audio.mjs` → envelopes |
| abstract particles / smoke / dust · 3D-looking raymarched objects | `particles` · `shader` | single-engine starters |
| minimal or fully custom | `basic` | canvas 2D + Post |
Every project gets **all libraries** (`lib/`): add `<script>` tags for what you use (order and API: `references/engine.md`). Prefer **`Stage`** (scene timeline + GPU transitions + camera) for anything longer than one shot. `--examples` also copies 8 runnable engine demos. Vertical/square are **re-compositions** (`--aspects 16:9,9:16`): read `?w=&h=` and re-lay out.

## The creative engine — use it, it is why the output can be spectacular
- **Atlas** — `node scripts/atlas.mjs search <words>` · `show <id>` · `sheet <id…|family>` (renders a contact sheet *so you can see it*) · `random` · `families`. 17 families, 239 entries: type · 3D · particles · shaders · looks (filters/grades) · camera · transitions · light · UI/data · graphic · logos (10 title-sting reveals) · sound · ideas · editing · color · styles · pipelines (glue patterns). Most entries carry **tested code** you can paste into a scene.
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
node tools/qc.mjs check | craft | energy | audio | video | sheet | frames | palette         node tools/analyze-audio.mjs song.wav → envelopes.json
node tools/atlas.mjs search|show|sheet|list|random|wav|test|gallery      node tools/inspire.mjs --brief "…"     (inside a scaffolded project; before scaffolding: node "<skill>/scripts/…")
```
Renders are resumable (re-run the same command). Options, codecs, speed, troubleshooting → `references/pipeline.md`.

## Hard rules for "not a slideshow" (check with `qc.mjs energy`)
Camera motion in every scene · no element static > 1.2 s without secondary motion · ≥ 4 different transitions (vary them; match cuts are best) · a sound event for every cut and hit · pacing curve (not equal scene lengths) · foreground/mid/background layers · a breath of silence before the peak · the last frame held ≥ 1 s · text ≥ 4 % of frame height, contrast ≥ 4.5:1, ≤ 7 words per screen · a limited palette (5 tokens) · hits punch the camera +2–3 %.

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
| `references/case-studies/avorythm/` | a complete worked example (30 s Persian film): `brief.md` (concept → style bible → storyboard with technique ids), `video.html`, `audio.mjs`, and the iteration story — read it once before your first studio-mode film |
| `references/direction.md` · `motion.md` · `visuals.md` · `sound.md` | background theory: structure per video type, timing tables, effect craft, music & mixing |
| `references/typography-rtl.md` | any Persian/Arabic/mixed text |
| `references/pipeline.md` · `qc.md` | render options and troubleshooting; what to check, symptom → fix |

## Deliverable format (keep it short)
(1) path(s) of the MP4(s) (+ stems if relevant) · (2) one line each: concept, style, duration/resolution/fps, what you checked (verify, qc check/energy, which frames you looked at) · (3) the command to re-render and to preview (`node tools/render.mjs serve`) · (4) assumptions made / WARNs accepted. If the user gave a storyboard, map your scenes to theirs.
