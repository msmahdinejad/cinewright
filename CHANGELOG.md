# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]

## [2.3.0] — 2026-10-10

The "motion design, not slides" release. The project owner's verdict on the first everyday benchmark was: *better, but still a slideshow — it does not look like real motion graphics.* Looking at the frames showed why. Even with whips and a carried object, every preset was five slides — a heading above three cards, three seconds each — and an agent told to "go all out" walked past the kit and hand-built the same five chapters. This release fixes the structure, not just the transitions.

### Added
- **Shots, not slides.** A new `hit` scene — ONE idea filling the frame: a colour flood, a statement that lands (slam / slide / rise), a ghost copy of it drifting behind, tone-on-tone decoration, an icon disc or the carried object. `fact` gained a mirrored layout, a word or phrase instead of a number, and fitted text. One-idea scenes (`hit`, `fact`, `logo`) compress their entrances to the shot length (`MG.shotK`; `audio.mjs` applies the same factor), so a one-second shot is a real shot.
- **A continuity system.** `spec.carry` — one object that lives above the scenes and travels, resizes, recolours and changes content from shot to shot (it stretches along its path, breathes on the beat and recolours itself when it would vanish into a flood of its own colour); five travelling transitions — `whip`, `push`, `zoom`, `iris` (opens from the carried object), `blinds` — and `cut` (a punch-in on the beat); per-move bezier curves (`MG.ease`); type entrance styles (`slideL`, `slideR`, `slam`, `drop`); a camera that breathes through every shot.
- **`references/anti-slideshow.md`** — what separates motion design from animated slides (§0 *Shots, not slides*, continuity, curves, type, rhythm) with a checklist for polish round A — and four atlas recipes (256 entries): `mg-hit-shots`, `mg-travel-transitions`, `mg-carry-object`, `mg-type-entrances`.
- **`qc craft` checks** for the things that made films read as slides: shots per second (from the brief's shot table and from the motion spec), rows of cards (`chips`/`stats`/`list`), travelling transitions, a carried object, a *Continuity* table in `brief.md`; `Pacing: <why>` declares a deliberately slow film.
- **Genre playbooks — `references/genres.md`.** Every kind of film fails in its own way (a landscape as flat clip art, a title sequence as static credit cards, a data story as a dashboard), so each genre — vertical data story, title sequence, ambient / loop, app explainer, logo sting, kinetic type, music visualizer, product reveal — gets its structure, its look, its failure modes, its sound and the atlas ids to start from. SKILL.md's route table and the protocol send every non-intro brief there first; `inspire.mjs` names the genre, points to its playbook and suggests the right template.
- **`light-dusk-landscape`** — a tested atlas recipe for an ambient landscape with real depth: aerial perspective over six ridges, mist in every valley, a warm horizon, an aurora curtain, a rising moon with a halo, blinking fireflies, a slow crane (256 entries).
- **`qc.mjs loop`** — checks that a looping film has no visible seam (the jump from the last frame to the first against a normal frame-to-frame change).
- `benchmark/suite/variety.json` — the third pass: four kinds of film that are not intros (a vertical data story, a prestige title sequence, an ambient landscape with no text, an app explainer), both conditions, identical prompts.
- `benchmark/suite/motion.json` — the four everyday prompts plus one sentence asking for real motion design, given identically to both conditions (the second pass). The report has a section for it; the first pass stays below it, and the earlier attempt with the intermediate skill is archived in `benchmark/archive/motion-v2/`.

### Changed
- **All five presets are re-cut into 7–10 one-idea shots** (a person intro: title · three skills · three numbers · quote · handle) with a carried object and a different travelling transition at every boundary; the score has an arc (films of 12 s or more start with pads and keys, the groove drops in at ~4 s on a riser: loudness range 1.5 → 3.6 LU on the event promo).
- **Routing.** SKILL.md opens with a *route first* table: everyday motion graphics — "go all out" included — start from the motion kit; the hand-built engines (`cinema`, `showreel`, `basic`) are for what the kit cannot draw. `inspire.mjs` says the same for such briefs and cuts its timeline skeleton into ~1.7-second shots (it used to tell every brief, a person intro included, to fork `--template cinema`); the protocol's scaffold step names the motion template; the scaffold prints the shot rhythm of the preset.
- **The website and README stop showcasing 3D.** The 3D reel and the vase clip are gone, the hero cards and the engine card show the re-cut presets, and the proof tabs show the second pass (the first pass is in the report). *Frame Summit 2026* and the Persian person intro were rebuilt from the new presets.
- **Website:** the *Made with it* lightbox fits the whole film in the window (its width follows the film's aspect ratio and the height left after the caption), so a vertical film no longer needs scrolling; the proof tabs are grouped (everyday motion graphics · other kinds of film · the showreel), and so is the README proof.
- `benchmark/run.mjs` also treats a transport error that leaves a half-written `final.mp4` behind as a dropped connection (it used to count it as a result).

### Benchmark — second everyday pass (Codex · gpt-6-astra · xhigh, one run per cell; [details](docs/benchmark.md))
- **Introduce a person:** frame fill 12 → 25 %, near-static 54 → 0 %, at 3.4× the tokens and 1.1× the time — five handsome chapters became ten one-idea shots.
- **Animated infographic:** frame fill 12 → 22 %, near-static 57 → 5 %, 4.4× the tokens, 0.6× the time (23 vs 38 min).
- **YouTube channel intro:** frame fill 16 → 31 %, near-static 36 → 14 %, 1.4× the time. **A loss:** the no-skill sting has the wider loudness range (4.1 vs 1.1 LU).
- **Vertical social promo:** a draw — unaided, Codex already makes a very good poster promo (frame fill 35 vs 33 %, neither film is ever static); the skill run took half the time (17 vs 34 min) at 5.6× the tokens.
- In all four with-skill runs Codex forked the motion kit as a film grammar and added drawings of its own as custom scenes (a phone with a badge, illustrated cups, a pixel P in a tunnel of squares, sleep icons that turn into each other). The metrics check motion and sound hygiene, not beauty — watch the films.

### Benchmark — other kinds of film (third pass; Codex · gpt-6-astra · xhigh, one run per cell)
- **Title sequence:** the clearest gain — quiet vignettes with credits on cards (59 % static frames) became moving graphic shots that one red clock hand runs through into the title (9 % static, frame fill 21 → 38 %), at 3.6× the tokens and 2.5× the time.
- **App explainer:** a tidy four-section product page (65 % static) became a story in shots (16 % static, frame fill 15 → 48 %), at 3.8× the tokens and 2.3× the time.
- **Vertical data story:** close — both turn a grid of dots into a river of light; the skill film is more readable on a phone and never static (0 vs 14 %), the baseline has finer detail; 3.4× the tokens, 2× the time.
- **Ambient landscape:** a draw — both ray-march a real 3D valley with a seamless loop; the skill film has more depth (frame fill 35 → 46 %), the baseline the bolder aurora and a 4K render; 1.3× the tokens, slightly less time.
- The new with-skill title sequence and landscape replaced the older showcase films of those genres in *Made with it*; the older data story and app explainer are still at least as good and stayed.

## [2.2.0] — 2026-10-09

The "show, don't tell" release: the proof is now films you can watch with sound, each agent compared with itself — and the skill learns the thing people ask for most, **simple, good-looking motion graphics** (a person intro, a channel intro, a promo, an infographic).

### Added
- **Motion graphics from a spec.** A new `motion` template (`lib/mg.js`): the whole film is a JSON spec in `video.html` — a theme, scenes of ten types (`title`, `chips`, `stats`, `quote`, `list`, `fact`, `chart`, `logo`, `cta`, `words`), a wipe into each scene — and the soundtrack (`audio.mjs`) is scored from the **same** spec, so retiming a scene moves its whoosh, pops, counter ticks and chimes with it. Seven themes (including a flat-colour poster style), 50 line icons that draw themselves on, counters, sliding masks, wipes, a light sweep over cards, beat-synced camera pulses, and `MG.scenes.mine = …` for anything the kit does not have. Five presets: `scaffold.mjs my-film --template motion --preset person-intro | channel-intro | social-promo | infographic | event-promo`. Every preset passes the skill's own pacing and frame-fill gates as shipped (ambient motion everywhere: a light sweep, beat pulses, orbiting glints). Right-to-left films work out of the box: `--lang fa` (or `"lang": "fa"` / `"dir": "rtl"` in the spec) mirrors the whole layout and writes Persian digits. Guide: `references/motion-graphics.md`.
- 11 new `mg-*` atlas entries (251 entries in 17 families).
- `benchmark/suite/simple.json` — five everyday prompts (person intro, YouTube channel intro, vertical café promo, animated infographic, event promo) with a ready `simple` set; the report puts them first. First results (Codex gpt-6-astra, xhigh, one run per cell): frame fill 14 → 50 % (person intro), 36 → 37 % (vertical promo — a draw on design), 9 → 31 % (channel intro), 12 → 26 % (infographic); near-static time 57 → 0, 41 → 0, 57 → 14 and 73 → 8 %; the skill costs 2.8–5.1× the tokens, and the channel-intro sting lost on loudness range (7 → 0.7 LU). `benchmark/run-detached.ps1` keeps a long Windows run alive when the agent app closes and stops the PC from idle-sleeping meanwhile. The runner has a **stall watchdog** (`--stall-min`, default 25): an agent that prints nothing for that long — a dropped proxy leaves a stream hanging silently — is stopped and retried in a fresh folder like any other transport failure.
- More films made with the skill, with their sources in `examples/`: *Pocketwise* (a 20-second app explainer), *Frame Summit 2026* (a 15-second event promo built with the new kit) and a Persian person intro (the preset with translated copy).
- **A video-first website.** A new ident film in the hero, a *proof* section with real with/without players — one tab per prompt, Codex at xhigh reasoning (on the showreel also a second model, and Claude Code) — with synced A/B sound, technique reels rendered by the atlas itself, and a gallery of films with the prompt that made each one. Everything is built from `docs/assets/data/media.plan.json` by `tools/make-assets.mjs` (MP4 + poster + README WebP); no clip appears twice.
- **Benchmark, rebuilt around self-comparison**: `run.mjs --models a,b --effort xhigh` (a model × condition matrix), automatic retries of dropped connections, `--suite-file`, a new art-directed *showcase* suite (`benchmark/suite/showcase.json`), and a report that puts each agent next to itself plus a development log (including the first run, where the skill lost). Claude Code results are measured from interactive sessions with `measure.mjs`.
- `examples/` — the complete source (brief, code, three written review rounds) of the Claude showreel and of the Cinewright ident, so the films can be re-rendered.
- `UI.button({ ink })` (a readable label on light accent colours); `atlas.mjs clip --quality`.
- **Hard gates in `qc.mjs`.** A median frame fill under 15 % or more than half the film near-static is now a **FAIL** (a fill under 25 % warns), unless `brief.md` declares `Restraint: <why>`; `craft` warns when a film uses nothing but 2D canvas. Found by the second benchmark pass: a launch film for a titanium ring was drawn as a thin glowing 2D circle (fill 13 %, 64 % static) and shipped despite its own warnings, while the agent without the skill built a lit 3D ring.
- New atlas recipe **`product-ring-macro`** — a hero object (a ring) as a lit `Scene3D` mesh with a coloured environment, floor reflection, macro dolly and an exploded view (it brought the atlas to 240 entries). SKILL.md and the protocol say that a hero *object* is a 3D mesh, never an outline.
- Protocol: a **time-box** rule (ship a first deliverable right after the skeleton, overwrite it as polish rounds land) — after a skill run timed out with a film that was still being polished.

### Changed
- The proof section has **tabs per prompt**: everyday motion-graphics prompts first, then the résumé showreel; every agent is compared with itself. The heavy 3D / cinematic prompts stay in the benchmark report with their numbers (including the ones the skill lost).
- `qc.mjs craft` recognises the motion kit as a complete engine (flat 2D by design) instead of warning about "2D canvas only".
- The English README and site no longer centre on Persian: Persian examples live in the Persian view (`README.fa.md`, the *فارسی* switch). Persian/RTL support is unchanged, and the motion kit now mirrors its layout for right-to-left languages.
- The product examples from the skill's origin were removed from the atlas recipes, the gallery sheets (regenerated — the `three-d` sheet had shown the wrong recipes), the case study and the site template; the examples are now generic.
- The low-quality animated WebPs on the site were replaced by MP4 at 720p/1080p with posters.

## [2.1.0] — 2026-10-06

### Changed
- **The project is now called Cinewright** (it was "pure-code-video"). The skill id is `cinewright`; invoke it with `$cinewright` in Codex. The repository moved to `github.com/msmahdinejad/cinewright` (old URLs redirect). The installers remove an old `pure-code-video` install of this skill automatically, so agents never see two copies. Internal `PCV_*` environment variables and `pcv-` file names are unchanged.
- The website was rebuilt from scratch: live in-browser demo of the engine, a frame scrubber, an interactive atlas explorer, animated benchmark charts, Persian/English.

### Added
- **`qc.mjs look` — the frame-fill gate** (also part of `check`): the share of each frame that is not background. Found by the first Codex benchmark run, where a technically clean film of thin lines on empty black passed every other check and lost to an agent with no skill. Calibrated on nine reference films (27–53 % median fill for good ones, 6–8 % for thin ones).
- `qc.mjs craft` now requires *substantive* review files (≥ 3 findings, times, ≥ ~450 characters) and recognises atlas ids written without backticks.
- `inspire.mjs` leaves the restrained styles out of "go all out" briefs and prints a *boldness floor* per direction; `protocol.md` has a measured Boldness section.
- `benchmark/reeval.mjs` (re-measure finished runs with the current metrics); frame fill in the benchmark report.
- `PCV_GPU=off|on|auto` environment override (used by the Docker image, where software GL is the only option).
- Docker image, GitHub Actions CI (lint, installers on three OSes, execution of every atlas recipe in a container).

### Fixed
- `install.sh` exited with status 1 after a successful install when installing from a clone; `install.ps1` downloads no longer stall on the progress bar and retry once.

## [2.0.0] — 2026-10-05

The "go all out" release. Version 1 produced *correct but flat* films (a Codex run of the first release was 61 % near-static — a slideshow). Version 2 attacks that at three levels: a film engine that makes spectacular looks cheap, a technique atlas that teaches agents what is possible, and a protocol plus gates that make them use it.

### Added
- **GPU film engine** (`templates/lib`): `Stage` scene sequencer with **32 GPU transitions**; `Scene3D`, a from-scratch WebGL2 renderer (chrome, glass, floor reflections, depth of field, instancing, text/relief/lathe geometry); `Parts` GPU particles (50 000 points, text ↔ logo ↔ mesh morphs); `FX` with **25 shader backgrounds** and **26 filters**; `Type` kinetic typography; `Cine` camera tools; `UI`; `G` girih/sacred-geometry patterns.
- **Technique atlas**: 239 entries in 17 families (type, 3D, particles, shaders, looks, camera, transitions, light, UI/data, graphic, **logos**, sound, ideas, editing, colour, styles, pipelines) with code that is executed by `atlas.mjs test`. `atlas.mjs` can `search`, `show`, `sheet` (contact sheets), **`clip`** (real motion → MP4/GIF) and `gallery`.
- `inspire.mjs` — three different creative directions (concept device, metaphor, style system, twist, techniques, timeline, sound plan) for any brief.
- **Protocol** (`references/protocol.md`): brief → look-dev → skeleton → three polish rounds → gates; `references/engine.md` (API on one page); a complete worked example.
- **Quality gates**: `qc.mjs energy` (anti-slideshow metric), `qc.mjs craft` (brief completeness, ≥ 6 atlas techniques from ≥ 4 families, ≥ 4 transitions, deterministic code, three written review rounds), part of `qc.mjs check`.
- Templates `cinema` (dark, 20 s) and `showreel` (bright poster reel, 17.5 s); 14 bundled OFL fonts including Persian display faces and Nastaliq.
- Sound engine: santur, ney, tombak, daf, gong, ambience, `groove()` presets, quarter-tone note names and Persian modes.
- **Benchmark harness** (`benchmark/`): same prompt, with/without the skill, objective metrics, blind A/B rating.
- **Open-source packaging**: installers (`install.ps1`, `install.sh`), `npx skills add`, Claude Code plugin marketplace, Docker image, CI, documentation site.

### Changed
- Renderer is memory-aware (measures a worker, starts only as many as fit, stall watchdog, clean `render.mjs stop`).
- `SKILL.md` rewritten around "studio mode" and the creative protocol.

### Fixed
- Unset `sampler2D` uniforms defaulting to texture unit 0; `source-in` masking wiping text fills; particle emitters ignoring spawn direction; Voronoi seams; `Geo.lathe` edge case.

## [1.1.0] — 2026-09-30
Initial public versions (1.0 – 1.1): deterministic HTML → MP4 renderer (parallel headless Chrome → ffmpeg), the `basic`, `explainer`, `music`, `particles` and `shader` templates, synthesised audio from a shared cue timeline, Persian/RTL text helpers, `qc.mjs` checks, `--detach`/`status` for long renders.

[Unreleased]: https://github.com/msmahdinejad/cinewright/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/msmahdinejad/cinewright/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/msmahdinejad/cinewright/releases/tag/v2.0.0
