# Getting started

Five minutes from zero to your first film. You need three things on your machine — the skill's `doctor` command tells you if anything is missing.

| requirement | why | get it |
|---|---|---|
| **Node.js ≥ 18** | runs the renderer and tools (no `npm install` needed) | `winget install OpenJS.NodeJS.LTS` · `brew install node` · `apt install nodejs` |
| **Chrome / Edge / Chromium** | headless browser draws every frame | usually already installed |
| **ffmpeg** | encodes the MP4 and the audio | `winget install Gyan.FFmpeg` · `brew install ffmpeg` · `apt install ffmpeg` |

No Docker? No GPU? Fine. A GPU makes rendering faster, but everything works on integrated graphics and on CPU-only machines (WebGL falls back to software). If you would rather install nothing, use the [Docker image](#docker).

## 1 · Install the skill

Pick the line for the agent you use. Each one copies the skill into the folder where that agent looks for skills, replacing any older version cleanly.

### Codex (CLI or app)

```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/msmahdinejad/pure-code-video/main/install.ps1 | iex
```

```bash
# macOS / Linux / Git-Bash
curl -fsSL https://raw.githubusercontent.com/msmahdinejad/pure-code-video/main/install.sh | bash
```

This installs to `~/.agents/skills/pure-code-video` (and `~/.codex/skills` if you have that folder) **and** `~/.claude/skills`. Choose one agent only with `-Target codex|claude` (PowerShell) or `bash -s -- codex|claude`. **Restart the agent** afterwards so it rescans skills.

### Claude Code (plugin marketplace)

```text
/plugin marketplace add msmahdinejad/pure-code-video
/plugin install pure-code-video@pure-code-video
```

### Any agent via `npx skills`

```bash
npx skills add msmahdinejad/pure-code-video
```

The [`skills`](https://github.com/vercel-labs/skills) CLI finds the skill in this repository and installs it for the agents it detects on your machine (pick one with its prompts). `npx skills add msmahdinejad/pure-code-video --list` shows what it found without installing.

### Manual

Copy the folder [`skills/pure-code-video`](../skills/pure-code-video) to your agent's skills directory (Codex: `~/.agents/skills/`, Claude Code: `~/.claude/skills/`, or `<project>/.agents/skills/` for one repository only). `install.ps1 -Project` / `PROJECT=1 bash install.sh` do exactly that for the current folder.

### Docker

```bash
docker build -t pure-code-video https://github.com/msmahdinejad/pure-code-video.git
docker run --rm pure-code-video doctor
```

See [Docker](#docker-usage) below for scaffolding and rendering inside the container.

## 2 · Check your machine

```bash
node ~/.agents/skills/pure-code-video/scripts/doctor.mjs
```

It verifies Node, ffmpeg (and encoders), a browser, WebGL, float framebuffers, bundled fonts, and does a smoke render. Every `!` or `✘` line says what to fix.

## 3 · Make something

Open an **empty folder**, start your agent there and give it a prompt that names the skill. In Codex the skill is invoked with `$`:

```text
$pure-code-video make a dynamic 15-second motion graphics video that shows what an incredible
motion designer you are, like it's your showreel for a résumé. Go all out.
```

> **"Go all out" matters.** It switches the skill into *studio mode*: the agent writes a brief, generates three creative directions, picks techniques from the atlas, builds, then runs three review rounds on frames it has actually looked at. Without it you get the lighter, faster path — fine for a title card, not for a showreel.

When it finishes you should find in the folder: `out/*.mp4` (the film), `brief.md` (concept + shot list), `video.html` + `audio.mjs` (the film's source — every frame is code), `qc/` (contact sheets and written review rounds).

More prompts — product films, logo stings, Persian kinetic type, trailers, explainers, vertical reels — in the [prompt cookbook](prompts.md).

## 4 · Use the pieces by hand (optional)

You do not need an agent to use the engine:

```bash
node skills/pure-code-video/scripts/scaffold.mjs my-film --template showreel   # or: cinema · explainer · music · particles · shader · basic
cd my-film
node audio.mjs                       # synthesise the soundtrack from the cue timeline
node tools/render.mjs sheet          # contact sheet → qc/sheet.png (look at it!)
node tools/render.mjs --quality draft
node tools/qc.mjs check              # verify the encoded file and the project
node tools/render.mjs serve          # live preview with audio in your browser
```

Explore the atlas from your terminal:

```bash
node skills/pure-code-video/scripts/atlas.mjs search liquid chrome 3d text
node skills/pure-code-video/scripts/atlas.mjs clip logo-shatter-in --gif       # render a technique as real motion
node skills/pure-code-video/scripts/inspire.mjs --brief "a 20 s teaser for a translation app"
```

## Docker usage

The image contains Node, Chromium, ffmpeg and the skill. Rendering uses software WebGL inside the container (correct, but several times slower than a real GPU).

```bash
docker run --rm -v "$PWD/film:/work" pure-code-video scaffold /work --template showreel
docker run --rm -v "$PWD/film:/work" pure-code-video audio
docker run --rm -v "$PWD/film:/work" pure-code-video render --quality draft      # → film/out/video.mp4
docker run --rm -v "$PWD/film:/work" pure-code-video qc check
```

## Troubleshooting

| symptom | what to do |
|---|---|
| the agent does not use the skill | restart it after installing; name the skill in the prompt (`$pure-code-video` in Codex, "use the pure-code-video skill" elsewhere) |
| render is slow / the machine freezes | the renderer measures memory and sheds workers; force fewer with `--workers 2`; iterate with `--quality draft` |
| black frames / "context lost" | `--gpu off` (software WebGL). Never add GPU-forcing Chrome flags |
| an agent's render got cut off | run the same command again — finished segments are reused; `node tools/render.mjs status` for background renders, `… stop` to end one cleanly (do not kill Chrome by hand) |
| ffmpeg / Chrome not found | install them (table above), then `doctor.mjs` |
| Persian text looks disjointed | animate **words**, not letters; no letter-spacing; see `references/typography-rtl.md` |

More in the [FAQ](faq.md).
