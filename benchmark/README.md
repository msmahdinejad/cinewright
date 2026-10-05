# Benchmark

> Does the skill actually make agent-made videos better? Don't take our word for it — **run the same prompt with and without the skill and measure.**

The harness gives a coding agent (the **Codex CLI** by default) an identical task in a fresh folder under different *conditions*, finds the MP4 it produces, and measures it with the same objective metrics. A blind A/B page lets humans judge what numbers cannot. Results live in [`results/`](results/) as small JSON summaries and contact sheets (never the videos) and are turned into [`docs/benchmark.md`](../docs/benchmark.md).

```bash
# 1. plan only — prints what would run
node benchmark/run.mjs --suite quick --dry-run

# 2. the quick suite: 3 tasks × (no skill, with skill) — expect 1–3 hours of agent time
node benchmark/run.mjs --suite quick

# 3. a serious comparison: 6 tasks, 3 repetitions (agents are stochastic; one run proves nothing)
node benchmark/run.mjs --suite core --reps 3

# 4. compare two versions of the skill on one task
node benchmark/run.mjs --tasks showreel-15s --conditions baseline,v1=../old/pure-code-video,v2=skills/pure-code-video

# 5. human judgement, blind
node benchmark/rate.mjs <run-id>              # → benchmark/runs/<run-id>/blind/index.html
node benchmark/rate.mjs --tally <run-id> votes-*.json

# 6. publish: regenerate the report, commit results/ and docs/benchmark.md
node benchmark/report.mjs
```

## What is compared

| condition | what the agent sees |
|---|---|
| `baseline` | the task prompt only. Any installed copy of `pure-code-video` is **disabled for the run** (Codex `skills.config`), so a stale install on your machine cannot leak in |
| `skill` | the same prompt prefixed with `Use $pure-code-video.`, and the skill from *this checkout* installed in the run's own project folder (`.agents/skills/`) |
| `name=path` | any other copy of the skill — typically an older release, to measure what a change bought you |

Every condition gets the identical task text and the identical delivery footer ([`suite/suite.json`](suite/suite.json)): *work in this folder, code only — no stock footage, no AI video generation — deliver `./final.mp4` with sound*. After each run the harness checks the agent's event log: a baseline run that nevertheless read the skill is flagged **contaminated** and should be discarded.

## The suite

| id | domain | what it stresses |
|---|---|---|
| `showreel-15s` | motion design | breadth of technique, pacing — the "résumé showreel" prompt |
| `logo-sting-6s` | brand | one hero moment, sound design, a satisfying hit |
| `kinetic-poem-fa` | typography | correct Persian shaping and RTL, rhythm, original music |
| `product-avorythm` | product | a long creative-director brief with facts to respect |
| `explainer-app-20s` | explainer | UI scenes, a data moment, clarity |
| `trailer-scifi-20s` | cinematic | atmosphere, camera, a build to a peak |
| `data-story-vertical-15s` | data / social | 9:16 re-composition, safe areas, a hook |
| `heritage-observatory-fa` | cultural | Persian visual identity, 6/8 rhythm, santur and ney |
| `music-visualizer-20s` | music | audio-reactive picture, a build and a drop |
| `abstract-loop-8s` | generative | a seamless loop |

Sets: `quick` (3 tasks), `core` (6), `full` (all 10). Add your own task by appending to `suite/suite.json` (`prompt` inline or `promptFile` under `suite/prompts/`).

## The metrics

Computed by [`lib/metrics.mjs`](lib/metrics.mjs) from the finished MP4 (ffmpeg/ffprobe + the skill's own `qc.mjs`) and from the agent's JSONL event log:

- **quiet %**, **longest static hold** — the anti-slideshow metric (`qc.mjs energy`);
- **scene changes** per film (ffmpeg scene score);
- **LUFS / LRA / true peak / silent share** — loudness, dynamics, dead air;
- **craft** — `qc.mjs craft` on the project (brief, atlas techniques, transitions, determinism, review rounds), when the agent used the skill's project layout;
- **process** — brief written?, review rounds, tokens, wall time, frames looked at (heuristic), atlas/inspire used.

These catch the usual failure modes of agent video — static slides, flat or missing sound, ignored briefs. **They do not rate beauty.** Treat them as a floor test and use `rate.mjs` for taste.

## Safety and cost

- The Codex runner uses `--dangerously-bypass-approvals-and-sandbox` inside a throw-away folder (`benchmark/runs/<id>/<job>/work`). That is what lets it render unattended, and it means the agent can do anything your user can. Run it on a machine, VM or container you are comfortable with.
- Runs spend your agent quota. `--suite quick` is ~6 agent sessions.
- Timeouts (`--timeout-min`, default 45) stop the agent's process tree; finished renders are kept.

## Using another agent

Any agent that reads the prompt on **stdin** and works in the current folder can be benchmarked:

```bash
node benchmark/run.mjs --suite quick --agent-cmd "claude -p --dangerously-skip-permissions"
```

The runner exports `PCV_BENCH_CWD`, `PCV_BENCH_CONDITION` and `PCV_BENCH_SKILL` (path of the skill under test, empty for baseline) so a wrapper script can install the skill the way that agent expects. Isolation of a baseline from globally installed skills is **only built in for Codex**; for other agents check the `touchedSkill` / `contaminated` flags in each `summary.json`.

## Measure something you already made

```bash
node benchmark/measure.mjs my-film.mp4 --task showreel-15s --label "Codex + skill v2" --agent "codex 0.148" --skill 2.0.0 \
     --project ./my-film-folder --session events.jsonl --preview
```

This writes the same `summary.json` + contact sheet the runner would, into `benchmark/results/measured/`.

## Contributing results

Open a PR with the folder `benchmark/results/<run-id>/` (JSON, `prompt.txt`, `sheet.jpg`, optional `preview.webp`) **plus** your agent/model/version in the PR text. No videos, no secrets. CI regenerates the report from the JSON, so numbers cannot be typed in by hand. See [CONTRIBUTING.md](../CONTRIBUTING.md#benchmark-results).
