## Review report

**Scope:** `7a825e9 (merge-base main)..efcdf38 (fix/price-rounding)` — one file, `src/pricing.js` (+8/−4)
**Mode:** standalone, single-reviewer (diff small enough for one pass; no subagents spawned). Read-only confirmed: `git status --porcelain` clean before and after.
**Packet gaps:** no issue/spec exists beyond the one-line stated intent ("switches totals to banker's rounding") and the commit message `fix(pricing): switch totals to banker's rounding`; no repo rules files (no README/AGENTS.md/CONTRIBUTING); claims reconstructed from the commit message.

**Gate status:** FAIL — `node --test` exits 1. `test/inventory.test.js:19` "total rounds half up": expected `4.99`, actual `4.98` (997 × 1 × 0.5 = 498.5¢; ties-to-even → 498 → 4.98).

**What holds up:**
- `roundHalfEven` implements half-even correctly, verified by direct execution: 2.5→2, 3.5→4, 2.4→2, 2.6→3, 498.5→498, 499.5→500, and negatives −2.5→−2, −3.5→−4 (JS `%` on negative floors handled correctly).
- `totalPrice` routes through the new function (`src/pricing.js:16`); intent's core mechanism is genuinely in place.
- No stale references to the removed `roundHalfUp` export anywhere in the repo (grep: zero hits); `src/report.js:4` imports only `formatMoney, totalPrice` and needs no change.
- Float tie-sensitivity (e.g., `105*0.9` → 94) is a pre-existing class shared identically with the old `Math.floor(cents + 0.5)` — not a regression introduced here; dropped as a finding.

**Static checks:** the only configured tooling is the test gate (`package.json`: `"test": "node --test"`); no linter, formatter, or type checker is configured. The gate's own failure is reported as a finding, not subtracted.

**Findings:**
1. [blocker · high] `test/inventory.test.js:19-22` — the configured gate fails on the branch: the test asserts the *old* half-up result (4.99) while the new half-even code correctly produces 4.98 — the branch cannot merge with a red gate, and the failing assertion contradicts the change's own intent — fix direction: update the expectation to `4.98` and rename the test to reflect half-even behavior.
2. [should-fix · high] `test/inventory.test.js` (whole file) — after the switch, zero tests exercise the claimed mechanism: no tie-to-even cases (e.g., totals ending in exactly x.5¢ rounding to even) and no non-tie cases through `totalPrice`/`roundHalfEven`; a broken implementation (half-up, half-down, truncation) would pass the entire suite once finding 1 is fixed — fix direction: add tie cases (e.g., 498.5→4.98, 499.5→5.00) and non-tie cases for `totalPrice`.

Re-rank gate: finding 1 — correctness 10 (direct gate output), actionability 10; finding 2 — correctness 9 (verified by reading the only test file), actionability 9. Both survive.

**Advisory nits:** none — everything material is folded into the findings above.

**Open questions:**
- The export rename `roundHalfUp` → `roundHalfEven` (`src/pricing.js:23`) breaks any out-of-repo importer of the old name. Package is `"private": true` and no in-repo consumer exists, so no in-packet evidence of harm — but whether external consumers exist cannot be settled from this packet.

**Verdict:** blocker 1 · should-fix 1 · nit 0 → **BLOCK** — the code change itself is correct, but the branch fails its own configured test gate (`node --test`, exit 1) because the existing rounding test still encodes half-up behavior, and the new half-even mechanism ships with no test coverage. Fix the test (expect 4.98), add half-even tie cases, then re-run the gate.
