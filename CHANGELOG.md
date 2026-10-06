# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]

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
- **Protocol** (`references/protocol.md`): brief → look-dev → skeleton → three polish rounds → gates; `references/engine.md` (API on one page); a complete worked example (`references/case-studies/avorythm`).
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
