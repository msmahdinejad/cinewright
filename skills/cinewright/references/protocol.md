# Protocol — how to make a film that is great, not just correct

The first render that plays without errors is usually 40 % of the way there. What separates a "wow" from "fine" is **decisions made early** (concept, style bible), **seeing your own frames** (look-dev, reviews) and **spending the improvement rounds** you have. Follow the phases; do not skip the reviews — they are where the quality comes from.
Time budget (typical 15–30 s film): concept + style bible 10 % · look-dev frames 10 % · skeleton 20 % · three polish rounds 50 % · QC + delivery 10 %.

## Phase 0 — Decide (write `brief.md` FIRST)
1. Parse the request: duration, aspect ratio(s), language(s), audience, mandatory elements (name, tagline, RTL text, end card), tone words, forbidden things. Quote the user's own words at the top of `brief.md`.
2. Run `node <skill>/scripts/inspire.mjs --brief "<their words>" [--duration N]` — three different creative directions. Read the *concept device*, *metaphor* and *twist*; pick one or combine one device with one style. **Write the one-sentence promise** and the **visual verb** only this subject can do (see `references/atlas/ideas.md`).
3. Write the **style bible** (half a page, in `brief.md`): palette tokens (5 hex), 1–2 fonts (`K.FONTS` keys), motion rules (easing, typical durations, camera language), grade (Post options), sound plan, 3 "never do" lines. Everything later is checked against it.
4. Write the **shot list**: each scene = id · seconds · technique ids from the atlas · what moves · transition in · sound event. Use the timeline skeleton from `inspire.mjs`. Cues (hit times) come from a beat grid (`edit-beat-grid`).

## Phase 1 — Look-dev (before building the timeline)
Render 2–3 *style frames* (the hero shot, a text shot, a data/UI shot) and **look at them** (`node tools/render.mjs still 3.2` for a full-size PNG, `node tools/render.mjs sheet --times 2,3.2,5` for several). Judge: palette contrast, hierarchy (what do I see first?), depth (3 layers?), light direction, text legibility at phone size. Fix the look now; changing it later costs 5× more.
Browse the gallery for ideas you have not used: `references/gallery/*.jpg` (view them with your image tool); `node atlas.mjs search …`, `node atlas.mjs sheet <ids>` to see recipes before you commit.

## Phase 2 — Skeleton (everything present, roughly right)
`node scripts/scaffold.mjs <dir> --template cinema|showreel|… [--lang fa]`, fill the `<script id="cues">`, build **every scene** with correct timing and transition, even if crude. Write `audio.mjs` from the same cues. Render a draft (`--quality draft`) and a contact sheet; run `node tools/qc.mjs energy out/video.mp4`.
Skeleton exit criteria: story reads in the sheet · all cuts on beats · no scene static · sound events exist for every cut and hit · total duration correct.

## Phase 3 — Three polish rounds (this is where it becomes great)
Each round = look → write a fix list → fix → check the affected seconds (`render.mjs sheet --times a:b:0.1` is a motion filmstrip; `still t` a full-size frame) and re-render (cheap: the cinema template renders 20 s in ≈ 30 s). Do not mix rounds.
- **Round A — motion & camera.** Every scene has camera motion; entrances have anticipation/overshoot/settle; no linear easing; hit punches (+2–3 % scale, 0.2 s) on cues; vary shot lengths (pacing curve); fix every `qc energy` WARN (add camera drift, secondary motion, or cut earlier).
- **Round B — craft & detail.** Typography (sizes, line breaks, contrast, safe area, Persian never letter-spaced/split), depth (foreground bokeh/particles, vignette), light (glow only on what is bright), colour consistency with the style bible, easter egg or fine detail in the last third, grain/CA/bloom values.
- **Round C — sound & finish.** Whoosh *before* each cut, hit *on* each cue, UI ticks aligned, music ducks 0.2 s before the peak, ending resolves and the final frame holds ≥ 1 s; loudness −14 LUFS; check vertical/square if requested.
After C: `node tools/render.mjs verify` (determinism) · full render · `node tools/qc.mjs check` (loudness, black frames, duration, sync) · look at the final contact sheet once more as a viewer would.

## How to review frames (look at images, not code)
Open the contact sheet (12–24 frames) and 3 full-size frames (hero, text, busiest). Ask, in order: 1 What is the first thing the eye sees — is it the right thing? · 2 Can I read all text in 0.5 s at phone size? · 3 Is anything cropped, overlapping or outside the safe 90 %? · 4 Do the scenes look like one film (palette/type/grade)? · 5 Is there depth (3 layers) and a light source? · 6 Is any scene a static slide? (energy) · 7 Are transitions varied and motivated? · 8 Is the biggest moment clearly the biggest? · 9 Does the ending hold and resolve? · 10 Would a stranger say "how was this made?" — if not, what is the one thing that would make them? Write the fix list in `qc/review-N.md` (3–8 items, ranked by visual impact; each: scene/time → cause → exact change; see `references/case-studies/avorythm/qc/review-*.md`). `node tools/qc.mjs craft` counts the review rounds, the atlas techniques cited in brief.md, the distinct transitions and lints video.html for non-deterministic calls — it runs as part of `qc.mjs check`.

## Anti-slideshow rules (hard)
Camera motion in every scene · no element static > 1.2 s without secondary motion · ≥ 4 different transitions · sound event for every cut and hit · pacing curve (not equal scene lengths) · foreground/mid/background layering · `qc energy` ≤ 10 % near-static · at least one moment of silence/space before the peak · at least one idea that is not a template effect.

## Ambition budget (the floor)
≥ 6 atlas techniques from ≥ 4 families · ≥ 3 engines used (2D canvas, GPU shaders/particles, 3D) unless the style system deliberately restricts them · 1 custom element (a shader, a shape language, a path, a pattern) written for this film · 1 signature transition authored for this film (`Trans.define` or a match cut) · bilingual or RTL handling done properly when the brief mentions Persian · a loop/hold/ending designed on purpose.

## Working in parallel (sub-agents, Codex Desktop)
Split by file so nobody edits the same lines: **soundtrack agent** (`audio.mjs` from the shared cues + `qc.mjs audio`), **scene agents** (one file per scene: `scenes/<id>.js` calling `SCENES.push({ id, at, enter, draw|gl, look })`, loaded by `video.html` before `S.timeline(SCENES)`), **review agent** (renders sheets, writes `qc/review-N.md`, never edits). Give every agent: `brief.md` + style bible, the cue table, the API cheat sheet (`references/engine.md`), and the rule "pure functions of time, no `Math.random`, no `Date.now`, fonts via `K.FONTS`". The lead integrates, renders, runs the review loop, and owns the final contact sheet.

## Speed & reliability
Iterate with `--quality draft` (and `--w 960 --h 540`) — render the full film only when sheets look right. Long renders: `--detach`, poll `render.mjs status`, stop with `render.mjs stop`. If the GPU path misbehaves (context lost, black frames) add `--gpu off`. Never force a specific GPU in Chrome flags. Keep scene state out of `renderFrame` (build 3D scenes/particle systems once at load).

## Delivery
Final answer = the path of the MP4, duration/resolution/fps, the style in one sentence, what to look at, and how to re-render (`node tools/render.mjs`) plus any honest caveat (e.g. "Persian text checked in 3 frames; audio is synthesised, not a recording"). Never claim a check you did not run. Keep `brief.md`, `video.html`, `audio.mjs`, `qc/` in the project so the user can tweak.
