## What and why
<!-- One idea per PR. Link the issue it closes. -->

## Checklist
- [ ] `npm test` passes
- [ ] New/changed atlas recipes run: `node skills/pure-code-video/scripts/atlas.mjs test <id>` and I **looked** at the contact sheet / clip
- [ ] Engine changes: `atlas.mjs test all` passes and `render.mjs verify` is PASS on `cinema` and `showreel`
- [ ] Docs updated (`references/engine.md`, `CHANGELOG.md` → Unreleased); generated docs refreshed (`node tools/gen-docs.mjs`, `node benchmark/report.mjs`)
- [ ] Visual change: before/after image or animated WebP attached
- [ ] Benchmark results: summaries + sheets only, no videos
