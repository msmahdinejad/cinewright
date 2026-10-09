# Benchmark

> Does the skill actually make agent-made videos better? Don't take our word for it — **run the same prompt with and without the skill, and compare each agent with itself.**

The harness gives a coding agent (the **Codex CLI** by default) an identical task in a fresh folder under different *conditions*, finds the MP4 it produces, and measures it with the same objective metrics. A blind A/B page lets humans judge what numbers cannot. Results live in [`results/`](results/) as small JSON summaries and contact sheets (never the videos) and are turned into [`docs/benchmark.md`](../docs/benchmark.md) — and the website's *proof* section, where you can watch every pair **with sound**.

```bash
# 1. plan only — prints what would run
node benchmark/run.mjs --suite headline --models gpt-6-astra,gpt-6.1-sol --dry-run

# 2. the headline comparison: the showreel prompt × 2 models × (no skill, skill), Codex at xhigh reasoning — ~2 hours
node benchmark/run.mjs --suite headline --models gpt-6-astra,gpt-6.1-sol --effort xhigh --timeout-min 75

# 3. a serious comparison: 6 tasks, 3 repetitions (agents are stochastic; one run proves nothing)
node benchmark/run.mjs --suite core --reps 3 --effort xhigh

# 4. compare two versions of the skill on one task
node benchmark/run.mjs --tasks showreel-15s --conditions baseline,v1=../old/cinewright,v2=skills/cinewright

# 5. strong, art-directed prompts for showcase films (skill only)
node benchmark/run.mjs --suite-file benchmark/suite/showcase.json --suite all --conditions skill --models gpt-6-astra

# 6. human judgement, blind
node benchmark/rate.mjs <run-id>              # → benchmark/runs/<run-id>/blind/index.html
node benchmark/rate.mjs --tally <run-id> votes-*.json

# 7. publish: regenerate the report, commit results/ and docs/benchmark.md
node benchmark/report.mjs
```

Options: `--models a,b` (a model × condition matrix) · `--effort low|medium|high|xhigh` (default xhigh) · `--timeout-min N` (default 75) · `--reps N` · `--retries N` (dropped connections are retried in a fresh folder, default 2) · `--stall-min N` (an agent that prints nothing for N minutes — default 25 — is treated as a dropped connection) · `--run-id name` · `--suite-file path` · `--skill-version label`.

## Long runs on Windows

A queue of xhigh runs takes hours. Two things stop it: closing the terminal (or the agent app that started it) and the PC going to sleep — a sleeping machine freezes the agent and a 75-minute timer then fires on a half-finished film. [`run-detached.ps1`](run-detached.ps1) starts a queue as its own process and asks Windows not to idle-sleep while it runs (the same call video players make; it changes no setting and ends with the process):

```powershell
'{ "cwd": "C:/path/to/cinewright", "cmd": "node benchmark/run.mjs --suite headline --models gpt-6-astra,gpt-6.1-sol --effort xhigh >> bench.log 2>&1" }' | Set-Content queue.json
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','benchmark/run-detached.ps1','-Config','queue.json'
```

Re-running the same command with the same `--run-id` skips finished jobs and restarts the interrupted one from scratch. If your agent reaches its model through a local proxy or VPN, a hiccup can leave a stream hanging without any error; the stall watchdog (`--stall-min`) turns that into a retry instead of a 75-minute timeout.

## What is compared

| condition | what the agent sees |
|---|---|
| `baseline` | the task prompt only. Any installed copy of `cinewright` is **disabled for the run** (Codex `skills.config`), so a stale install on your machine cannot leak in |
| `skill` | the same prompt prefixed with `$cinewright ` (exactly how a user invokes it), and the skill from *this checkout* installed in the run's own project folder (`.agents/skills/`) |
| `name=path` | any other copy of the skill — typically an older release, to measure what a change bought you |

Every condition gets the identical task text and the identical delivery footer ([`suite/suite.json`](suite/suite.json)): *work in this folder, code only — no stock footage, no AI video generation — deliver `./final.mp4` with sound*. After each run the harness checks the agent's event log: a baseline run that nevertheless read the skill is flagged **contaminated** and should be discarded.

**Agents are compared with themselves** (Codex without vs with the skill; Claude without vs with the skill). Different agents and models are never ranked against each other: the question is what the skill adds, not who is better.

## The suites

[`suite/simple.json`](suite/simple.json) — **simple motion graphics**, the everyday jobs people actually ask for (set `simple`): introduce a person · a YouTube channel intro · a vertical social promo · an animated infographic · an event promo. Plain-language prompts, no 3D spectacle — the question is how much better an agent makes *ordinary* motion graphics with the skill.

```bash
node benchmark/run.mjs --suite-file benchmark/suite/simple.json --suite simple --models gpt-6-astra --effort xhigh
```

[`suite/suite.json`](suite/suite.json) — fair-comparison tasks (sets `headline`, `quick`, `core`, `full`, `showcase`):

| id | domain | what it stresses |
|---|---|---|
| `showreel-15s` | motion design | breadth of technique, pacing — the "résumé showreel" prompt |
| `logo-sting-6s` | brand | one hero moment, sound design, a satisfying hit |
| `launch-film-30s` | product | procedural 3D, restraint, macro camera |
| `trailer-scifi-20s` | cinematic | atmosphere, camera, a build to a peak |
| `kinetic-manifesto-20s` | typography | seven kinds of kinetic type, a beat of silence |
| `explainer-app-20s` | explainer | UI scenes, a data moment, clarity |
| `music-visualizer-20s` | music | audio-reactive picture, a build and a drop |
| `title-sequence-25s` | cinematic | abstract imagery, credits, a score |
| `data-story-vertical-15s` | data / social | 9:16 re-composition, safe areas, a hook |
| `abstract-loop-8s` | generative | a seamless loop |

[`suite/showcase.json`](suite/showcase.json) — eight **art-directed** prompts (ARC launch film, LAST SIGNAL trailer, manifesto, visualizer, title sequence, data story, sci-fi HUD, calm landscape) used for the films on the website. They ask for spectacle on purpose; they are not fair-comparison tasks.

Add your own task by appending to a suite file (`prompt` inline or `promptFile`).

## The metrics

Computed by [`lib/metrics.mjs`](lib/metrics.mjs) from the finished MP4 (ffmpeg/ffprobe + the skill's own `qc.mjs`) and from the agent's JSONL event log:

- **static %**, **longest static hold** — the anti-slideshow metric (`qc.mjs energy`);
- **frame fill** — the share of each frame that is not background (`qc.mjs look`): catches films of thin lines on empty black;
- **scene changes** per film (ffmpeg scene score);
- **LUFS / LRA / true peak / silent share** — loudness, dynamics, dead air;
- **craft** — `qc.mjs craft` on the project (brief, atlas techniques, transitions, determinism, review rounds), when the agent used the skill's project layout;
- **process** — brief written?, review rounds, tokens, wall time.

These catch the usual failure modes of agent video — static slides, flat or missing sound, ignored briefs. **They do not rate beauty.** Treat them as a floor test and use your eyes (and `rate.mjs`) for taste.

## Safety and cost

- The Codex runner uses `--dangerously-bypass-approvals-and-sandbox` inside a throw-away folder (`benchmark/runs/<id>/<job>/work`). That is what lets it render unattended, and it means the agent can do anything your user can. Run it on a machine, VM or container you are comfortable with.
- Runs spend your agent quota — and at xhigh reasoning the skill version uses several times the tokens of a plain run (see the report). `--suite headline` with two models is 4 agent sessions.
- Timeouts (`--timeout-min`, default 75) stop the agent's process tree; finished renders are kept. Transport failures are retried; a quota or login error stops the queue instead of burning it.

## Using another agent

Any agent that reads the prompt on **stdin** and works in the current folder can be benchmarked:

```bash
node benchmark/run.mjs --suite headline --agent-cmd "claude -p --dangerously-skip-permissions"
```

The runner exports `PCV_BENCH_CWD`, `PCV_BENCH_CONDITION` and `PCV_BENCH_SKILL` (path of the skill under test, empty for baseline) so a wrapper script can install the skill the way that agent expects. Isolation of a baseline from globally installed skills is **only built in for Codex**; for other agents check the `touchedSkill` / `contaminated` flags in each `summary.json`.

## Measure something you already made

The Claude Code results in the report were made in interactive sessions and measured afterwards:

```bash
node benchmark/measure.mjs my-film.mp4 --task showreel-15s --label "Claude Code + Cinewright" --agent "Claude Code, interactive" --skill 2.2.0 \
     --project ./my-film-folder --out benchmark/results/my-results
```

This writes the same `summary.json` + contact sheet the runner would. The project folders (brief, code, review rounds) of the films on the website are in [`examples/`](../examples/).

## History

[`archive/`](archive/) keeps the first benchmark pass (an earlier build of the skill at *high* reasoning, where the skill lost on the showreel prompt) and the results of earlier versions. They are the reason the frame-fill gate, the boldness floor and the substantive-review check exist — see the development log in [`docs/benchmark.md`](../docs/benchmark.md).

## Contributing results

Open a PR with the folder `benchmark/results/<run-id>/` (JSON, `prompt.txt`, `sheet.jpg`) **plus** your agent/model/version in the PR text. No videos, no secrets. CI regenerates the report from the JSON, so numbers cannot be typed in by hand. See [CONTRIBUTING.md](../CONTRIBUTING.md#benchmark-results).
