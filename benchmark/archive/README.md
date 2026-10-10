# Archive

Older benchmark results, kept for the record and **not** part of the report's headline tables.

- `20261006-1742-first-pass/` — the first automated pass: Codex 0.148, reasoning effort *high*, the first Cinewright 2.1 build (which became this repository's `v2.1.0`), showreel / logo sting / Persian poem. The no-skill showreel (frame fill 32 %, 0 % static) beat the skill build (6 %, 21 %); the skill logo-sting run hit the timeout. Those numbers drove the frame-fill gate, the boldness floor, the substantive-review check and the "no unattended sub-agents" rule.
- `history-earlier-versions/` — a showreel made with version 1.1 of the skill, measured after the fact, before the runner existed.
- `motion-v2/` — the first attempt of the second everyday pass (2026-10-10): the *intermediate* skill (continuity system, but still five-slide presets and a routing table that sent "go all out" briefs to a hand-built engine) on the person-intro and channel-intro prompts of [`suite/motion.json`](../suite/motion.json). Codex scaffolded the blank `basic` template and hand-wrote five 3-second chapters — a heading over three items, then the next — in 70 and 55 minutes (frame fill 14 % and 21 %; near-static 21 % and 14 %). Those two films are what showed that *structure* (layout and pacing), not transitions, makes a film read as a slideshow; the redesigned skill (one-idea shots, a routing table that sends everyday jobs to the motion kit) was then re-run on all four prompts — see the development log in [`docs/benchmark.md`](../../docs/benchmark.md).

Re-measure any of them with `node benchmark/reeval.mjs`.
