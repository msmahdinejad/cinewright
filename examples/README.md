# Examples — the source of the films

Every film on the [website](https://msmahdinejad.github.io/cinewright/) and in the README is code. These folders hold what the agents wrote for the **showreel prompt** — the same sentence for everyone:

> `$cinewright make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. Go all out.`

| folder | who | what is in it |
|---|---|---|
| [`showreel-claude-with-skill/`](showreel-claude-with-skill/) | Claude Code (Sonnet 5.5) + Cinewright | `brief.md` (concept, style bible, shot list with atlas ids), `video.html` (the nine scenes), `audio.mjs` (the score, from the same cues), `qc/review-1…3.md` — the three written review rounds |
| [`showreel-codex-astra-with-skill/`](showreel-codex-astra-with-skill/) | Codex gpt-6-astra, xhigh + Cinewright | the same artefacts, as the agent left them |
| [`showreel-codex-sol-with-skill/`](showreel-codex-sol-with-skill/) | Codex gpt-6.1-sol, xhigh + Cinewright | the same artefacts, as the agent left them |
| [`showreel-without-skill/`](showreel-without-skill/) | the same agents **without** the skill | what they wrote instead: Claude — Python + Pillow + numpy; Codex — a Python GPU renderer (moderngl) with a GLSL fragment shader |
| [`cinewright-ident/`](cinewright-ident/) | Claude Code + Cinewright | the 12-second ident in the website hero (code → particles → film-strip helix → name) |
| [`pocketwise-claude-with-skill/`](pocketwise-claude-with-skill/) | Claude Code + Cinewright | a 20-second app explainer (prompt: `explainer-app-20s`): receipts → a 3D phone with a live UI → coins settling four balances → a dashboard → the mark; brief, code, score and three review rounds |
| [`manifesto-claude-with-skill/`](manifesto-claude-with-skill/) | Claude Code + Cinewright | the kinetic-typography manifesto (174 BPM) from the website gallery |
| [`event-promo-claude-with-skill/`](event-promo-claude-with-skill/) | Claude Code + Cinewright | *Frame Summit 2026*, a 15-second event promo (prompt: `event-promo-15s`) built with the **motion kit**: the film is the JSON spec in `video.html`, `audio.mjs` scores it from the same spec; brief and three review rounds |
| [`person-intro-fa-with-skill/`](person-intro-fa-with-skill/) | Claude Code + Cinewright | a Persian person intro: the `person-intro` preset with the copy translated (`--lang fa` mirrors the layout and writes Persian digits) — `video.html` + `audio.mjs` only, because nothing else was needed |

## Re-render one

The folders contain only what the agent *wrote*. The engine (`lib/`), fonts and render tools come from a scaffold:

```bash
node skills/cinewright/scripts/scaffold.mjs film --template showreel      # any template: it only provides lib/, fonts/, tools/
cp examples/showreel-claude-with-skill/{video.html,audio.mjs,brief.md} film/ && cp -r examples/showreel-claude-with-skill/qc film/
cd film
node audio.mjs                                  # → audio.wav, from the cues in video.html
node tools/render.mjs --quality high            # → out/video.mp4   (add --motion-blur 6 --shutter .5 for the website version)
node tools/qc.mjs check                         # energy · frame fill · audio · craft (brief + three reviews)
```

The Python examples under `showreel-without-skill/` need Python 3 with Pillow and numpy (Codex's also moderngl and scipy) and ffmpeg.

## Read them as a case study

- `brief.md` shows what "decide before you build" looks like: a one-sentence promise, a *visual verb* only this subject can do, a style bible, a shot list where every row names atlas techniques.
- `qc/review-*.md` show what a **substantive** review is — what was looked at, ranked findings (scene/time → cause → exact change), and the result. (`qc.mjs craft` rejects four-line rubber stamps.)
- Compare `video.html` with the Python in `showreel-without-skill/`: the skill's engine turns "write a renderer" into "write the film".
