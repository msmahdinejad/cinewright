# Contributing

Thanks for helping make agent-made video better. The most valuable contributions, in order:

1. **A new technique for the atlas** — a recipe that *runs* and that you have *looked at*.
2. **Benchmark results** — measured runs of any agent, with or without the skill.
3. **Bug reports with a reproduction** — especially rendering problems on your OS/GPU.
4. **Translations & Persian/RTL fixes** — the docs and the typography engine.
5. **Engine features** — new transitions, materials, synth instruments.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md). Persian and English are both fine in issues.

## Setup

```bash
git clone https://github.com/msmahdinejad/pure-code-video && cd pure-code-video
npm test                                   # lint + generated-docs check, no browser needed (Node ≥ 18)
node skills/pure-code-video/scripts/doctor.mjs   # checks Chrome, ffmpeg, WebGL on your machine
```

There are **no dependencies to install**. The skill is plain Node scripts and browser JavaScript.

## Repository map

| path | what lives there |
|---|---|
| `skills/pure-code-video/` | **the skill** — what agents install. `SKILL.md` is the entry point, `references/` the knowledge, `scripts/` the tools, `templates/` the engine and starter films |
| `skills/pure-code-video/references/atlas/*.md` | the technique atlas (one file per family) — the main thing to extend |
| `docs/` | the website (GitHub Pages) and generated pages; `atlas.md` and `benchmark.md` are **generated** |
| `benchmark/` | the harness that compares agents with/without the skill |
| `tools/` | repository tooling (lint, doc generation, asset generation) — not shipped to users |

## Adding a technique to the atlas

Each entry is a section in `references/atlas/<family>.md`:

````markdown
## my-technique-id — A short, concrete title
tags: words people would search for, space separated
use: when to reach for it, in one or two sentences — the situation, not the implementation
how: how it works and the one trick that makes it look good
pair: other-entry-ids that combine well
avoid: the mistake people make with it
```js scene
//@ {"peak":1.5,"bg":"#0b0b12"}
// body of a 2D scene: (g, lt, t, c, W, H, u, store) — lt = seconds since the recipe started (0…3), u = H/1080
```
````

Rules that keep the atlas good:

- **It must run.** `js scene`, `js gl`, `glsl` and `js audio` blocks are executed by `node skills/pure-code-video/scripts/atlas.mjs test <id>`. Run it; CI runs all of them.
- **Look at it.** `node skills/pure-code-video/scripts/atlas.mjs sheet <id>` renders a contact sheet; `clip <id> --gif` renders motion. Fix white-outs, clipped text and static frames before you open the PR. A recipe that "works" but looks flat teaches the agent to make flat video.
- **Pure functions of time.** No `Math.random()`, `Date.now()`, timers or state carried between frames — use `K.hash`, `K.rng`, `K.noise`. (`render.mjs verify` proves this for films.)
- **Say when *not* to use it** (`avoid:`). Judgement is what the atlas teaches.
- Persian/RTL text: animate per **word**, never per letter, no letter-spacing.
- Regenerate the gallery for your family: `node skills/pure-code-video/scripts/atlas.mjs gallery --only <family>`, then `node tools/gen-docs.mjs`.

## Changing the engine (`templates/lib`)

- Keep it dependency-free and deterministic. Run `node skills/pure-code-video/scripts/atlas.mjs test all` (≈1 min) and `node tools/render.mjs verify` inside a scaffolded `cinema` and `showreel` project before you push.
- Never add GPU-forcing Chrome flags; the renderer must work on integrated GPUs and in containers.
- Update `references/engine.md` (the one-page API) in the same PR.

## Pull requests

1. Branch from `main`; keep a PR to one idea.
2. `npm test` passes (CI runs it plus the atlas execution test).
3. Update `CHANGELOG.md` under **Unreleased** (Keep a Changelog format).
4. Commit messages: [Conventional Commits](https://www.conventionalcommits.org/) — `feat(atlas): …`, `fix(render): …`, `docs: …`.
5. Add before/after pictures or an animated WebP for anything visual (`atlas.mjs clip … --gif`).

## Benchmark results

Run `node benchmark/run.mjs --suite quick` (or `measure.mjs` on an existing film) and open a PR with the generated `benchmark/results/<run-id>/` folder — summaries, `prompt.txt` and contact sheets only, **never videos**. State the agent, model and version in the PR. CI regenerates `docs/benchmark.md` from the JSON. Results that contradict the project's claims are the most welcome kind.

## Releases (maintainers)

Bump the version in `package.json`, `.claude-plugin/*.json`, `CITATION.cff` and `CHANGELOG.md` (lint checks they agree), tag `vX.Y.Z`; the release workflow packages the skill and attaches it. Sample films are uploaded to the release by hand (`gh release upload`) — they are too big for git.
