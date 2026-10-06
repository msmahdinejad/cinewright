# How it works

A video, to this skill, is **a pure function of time** plus a soundtrack synthesised from the **same cue timeline**:

```js
function renderFrame(t) { /* draw the picture for second t — nothing else may influence it */ }
```

Because no frame depends on any other, frames can be rendered in parallel, out of order, re-rendered after a one-line fix, or inspected one at a time. That is also how an agent *checks its own work without eyes or ears*: it renders frame 3.2, looks at it, changes a number, renders it again.

```mermaid
flowchart LR
  A[Prompt<br/>"go all out"] --> B[Brief<br/>concept · style bible · shot list]
  B --> C[inspire.mjs<br/>3 creative directions]
  C --> D[Atlas<br/>239 tested techniques]
  D --> E[video.html + audio.mjs<br/>one shared cue timeline]
  E --> F[render.mjs<br/>parallel headless Chrome → ffmpeg]
  F --> G[QC gates<br/>energy · audio · craft · verify]
  G -->|three polish rounds| E
  G --> H[(MP4 with audio)]
```

## The three layers

### 1 · The engine — makes spectacular looks cheap
`skills/cinewright/templates/lib`, zero dependencies, all deterministic:

| module | what it gives an agent |
|---|---|
| `Stage` | scene timeline with **32 GPU transitions**, per-scene look, global camera and overlay |
| `Scene3D` | its own WebGL2 renderer: chrome, glass, floor reflections, depth of field, instancing, 3D text, night-city flights |
| `Parts` | GPU particles (up to 50 000), **morphing** between text, logos, meshes and shapes |
| `FX` | 25 shader backgrounds and 26 filters (ASCII, dither, stained glass, VHS, CRT, datamosh…) |
| `Type`, `K.words` | kinetic typography; Persian/RTL shaped word-by-word, never per letter |
| `Cine` | camera paths, beat punches, shake, handheld, speed ramps |
| `synth.mjs` | drums, bass, pads, strings, keys, **santur, ney, tombak, daf**, risers, impacts, `groove()` presets, quarter-tone notes, ducking and mastering to −14 LUFS |

### 2 · The knowledge — teaches *what is possible* and *when to use it*
The **[atlas](atlas.md)** is 239 short recipes — use / how / avoid / pairs-with — most with code that is executed in CI so it never rots, plus a **[gallery](assets/gallery)** of contact sheets so an agent can *see* options before choosing. Families: type · 3D · particles · shaders · looks · camera · transitions · light · UI/data · graphic · logos · sound · ideas · editing · colour · styles · pipelines. 22 of the entries are complete *style systems* (palette, fonts, motion rules, grade, sound) — an agent picks one and commits, which is what stops films from looking like a pile of effects.

`inspire.mjs` turns any brief into three *different* creative directions: a concept device, a metaphor, a style system, a twist, ≥ 6 techniques from ≥ 4 families, a timeline skeleton and a sound plan.

### 3 · The process — makes it actually use them
[`protocol.md`](../skills/cinewright/references/protocol.md) is the "studio mode" workflow: brief → look-dev (render and *look at* style frames) → skeleton → **three polish rounds** (motion & camera · craft & detail · sound & finish), each with a written fix list. The gates are objective:

| gate | catches |
|---|---|
| `qc.mjs energy` | the slideshow: share of near-static time, longest static hold, cuts |
| `qc.mjs audio` | muddy mixes, clipping, dead air, wrong loudness |
| `qc.mjs craft` | no brief, < 6 atlas techniques, < 4 transitions, `Math.random()` in frame code, fewer than three review rounds |
| `render.mjs verify` | non-determinism (same time ⇒ same pixels, any order, any worker) |

## What an agent produces

```text
my-film/
├─ brief.md          concept, style bible, shot list with atlas technique ids
├─ video.html        every scene as code (renderFrame)
├─ audio.mjs         the score, built from the same cue timeline
├─ qc/               contact sheets + review-1…3.md (written fix lists)
├─ out/video.mp4     the film
└─ tools/ lib/ fonts/   the engine, copied in — the project is self-contained and re-renders years later
```

## Why code instead of a video model?

| | video model | cinewright |
|---|---|---|
| **Text** | garbled, wrong script | pixel-exact; correct Persian shaping and RTL |
| **Editing** | re-roll everything | change one number, re-render the second you changed |
| **Repeatability** | different every time | identical frames, proven by `verify` |
| **Sound** | separate tool | synthesised from the same timeline, hits land on the frame |
| **Cost / privacy** | per-second fees, uploads | local, offline, free |
| **Limits** | whatever the model learned | you can build anything you can compute — but it is *graphics*, not photographs |

The honest limitation: no photoreal people, animals or footage. This is for motion graphics, titles, product/UI films, abstract and stylised worlds, data stories, typography and music visuals.

## Platform notes
- Chrome is launched headless with a throw-away profile; frames are read back and piped to ffmpeg. Nothing leaves your machine.
- The renderer measures the memory one Chrome worker needs and starts only as many as fit — integrated GPUs share system RAM, and "one worker per core" can freeze a laptop.
- Windows, macOS and Linux are supported; hybrid-GPU laptops work on the integrated GPU by default (forcing the discrete GPU is deliberately not done).
