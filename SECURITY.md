# Security policy

## What this project does on your machine
cinewright is a *skill*: instructions plus Node scripts that an AI coding agent runs locally. The scripts

- start a headless Chrome/Edge/Chromium that opens **local** HTML files (served from a local static server on `127.0.0.1`, random port),
- run `ffmpeg`/`ffprobe`,
- write into the project folder you scaffolded (`out/`, `qc/`, `.render/`).

They make **no network calls** and have **no dependencies**. The benchmark harness (`benchmark/`) launches the agent CLI you configure (for example `codex exec`) — an agent that, depending on *your* agent configuration, can run arbitrary commands. Run benchmarks in a throw-away folder or container, never in a directory you care about.

## Supported versions
Only the latest release on `main` receives fixes.

## Reporting a vulnerability
Please **do not open a public issue** for security problems. Use GitHub's private reporting: *Security → Report a vulnerability* on this repository, or email the maintainer (address on the GitHub profile). You will get a first answer within a week. Please include a minimal reproduction and the OS/Node/Chrome versions (`node skills/cinewright/scripts/doctor.mjs` prints them).

Things that count as vulnerabilities: path traversal in the preview server (`render.mjs serve`), command injection through project/file names, an installer that writes outside the skill folders, a script that executes content fetched from the network.
