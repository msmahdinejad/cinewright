# Archive

Older benchmark results, kept for the record and **not** part of the report's headline tables.

- `20261006-1742-first-pass/` — the first automated pass: Codex 0.148, reasoning effort *high*, the first Cinewright 2.1 build (which became this repository's `v2.1.0`), showreel / logo sting / Persian poem. The no-skill showreel (frame fill 32 %, 0 % static) beat the skill build (6 %, 21 %); the skill logo-sting run hit the timeout. Those numbers drove the frame-fill gate, the boldness floor, the substantive-review check and the "no unattended sub-agents" rule.
- `history-earlier-versions/` — a showreel made with version 1.1 of the skill, measured after the fact, before the runner existed.

Re-measure any of them with `node benchmark/reeval.mjs`.
