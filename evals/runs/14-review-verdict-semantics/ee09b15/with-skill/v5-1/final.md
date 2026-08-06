## Review report

**Scope:** `7a825e9..efcdf38` (merge-base of `main`..`fix/price-rounding`) — 1 file, `src/pricing.js`, +8/−4
**Mode:** standalone, read-only, single-reviewer (diff is one hunk; no subagents spawned). Repo state verified clean before and after; nothing mutated.
**Packet gaps:** none — intent as stated by user ("switches totals to banker's rounding"), commit message (`fix(pricing): switch totals to banker's rounding`), full diff, and gate output all obtained.

**Gate status:** FAIL — `node --test` exits 1: `total rounds half up` fails with `4.98 !== 4.99` (test/inventory.test.js:21).

**What holds up:**
- `roundHalfEven` implements banker's rounding correctly, including negatives — verified by direct execution: 498.5→498, 499.5→500, 497.4→497, 497.6→498, −0.5→0, −1.5→−2, −2.5→−2.
- Diff matches the stated intent exactly: only the rounding of `totalPrice` changes; `formatMoney` and the summation plumbing are untouched (single hunk, src/pricing.js:16). No scope creep.
- Export rename has no reachable blast radius: grep across the repo shows `roundHalfUp`/`roundHalfEven` referenced only in src/pricing.js; src/report.js:4 and test/inventory.test.js:4 import only `totalPrice`/`formatMoney`.

**Static checks:** the only configured tooling is the test gate (`node --test`); no linter, formatter, type checker, or build is configured. Nothing to subtract.

**Findings:**
1. **[blocker · high]** test/inventory.test.js:19-22 — the test `'total rounds half up'` asserts the pre-change behavior on an exact tie (997 × 1 × 0.5 = 498.5 cents, expects 4.99); under banker's rounding the correct result is 4.98, so the repo's configured merge gate `node --test` is red (observed: exit 1, `4.98 !== 4.99`) — the branch cannot merge while its own gate fails — fix direction: update the expectation to 4.98 and rename the test to reflect tie-to-even.
2. **[should-fix · high]** test/inventory.test.js — the claimed mechanism has no test coverage: the suite's only rounding test still encodes half-up, and no test exercises tie-to-even in both directions — a regression that rounds ties up (or always down) would pass once finding 1 is patched minimally — fix direction: add both tie directions (498.5→4.98, 499.5→5.00) plus non-tie cases (497.4→4.97, 497.6→4.98).

**Advisory nits:** none with concrete impact.

**Open questions:** src/pricing.js:23 removes the exported `roundHalfUp` from the module surface. No in-repo consumers and `package.json` is `private: true`, but if anything outside this repo imports it, the rename is a silent breaking change — the intent does not say whether the old export must be preserved. Not promoted to a finding.

**Verdict:** blocker 1 · should-fix 1 · nit 0 → **BLOCK** — not ready to merge; the branch's behavior change is correct, but it ships with the repo's test gate red.
