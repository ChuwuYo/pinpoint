# Review report

Scope: `main...feat/bulk-discount` (merge-base f969213, head 185a6d1 — 4 files, +54/−6) · Packet gaps: none (no repo rules files exist; intent taken from the task statement and commit message "feat(pricing): bulk discount at ten units, applied in daily summaries"; discount magnitude not stated in either). Single-reviewer review — diff is small enough for one pass; axes run locally.

What holds up:
- Threshold and aggregation implemented as claimed: `totalQty >= 10 → 5% off`, aggregated across lines (src/pricing.js:19-21), pinned by tests at test/pricing.test.js:7-21 — all pass.
- Applied in daily summaries as claimed: src/report.js:11 routes `dailySummary` through `totalWithBulkDiscount`; both report tests pass (test/report.test.js:9-14).
- `totalPrice` behavior preserved: the diff is a pure extraction into `totalCents` — the reduce expression is byte-identical to `main` (verified via `git show main:src/pricing.js`), and the pre-existing "total rounds half up" test still passes.
- Rounding contract survives the `* 0.95` multiply: I swept integer and half-cent domains (0–1,000,000 cents) comparing `Math.floor(cents * 0.95 + 0.5)` against exact rational round-half-up — 0 mismatches, so the new path honors the module's `roundHalfUp` policy on reachable inputs.
- Tests test the mechanism, not the implementation: they assert public-API outputs (19, 6, cross-line aggregation) and would fail if the discount, threshold, or aggregation were removed or altered.

Static checks: only `npm test` is configured (`node --test`; no formatter/linter/typecheck/build in package.json) — 9/9 pass. Nothing to subtract beyond that.

Findings:
1. [nit · medium] src/pricing.js:19,21 — threshold `10` and rate `0.95` are inline magic numbers while the repo's established pattern names such business constants (`DEFAULT_RESTOCK_THRESHOLD`, src/inventory.js:4) — the bulk rule can't be discovered or tuned without reading the function body, and the tests pin the literals so a rate change touches multiple files — extract named constants (e.g. `BULK_DISCOUNT_QTY`, `BULK_DISCOUNT_RATE`).
   - Re-rank: correctness 8/10 (factually verifiable against inventory.js:4), actionability 7/10 (one-line extraction). A rejected float-rounding hypothesis scored 0 on correctness and was dropped.

Open questions:
- The intent states neither the discount magnitude nor whether the threshold is per-line or aggregate; the change chooses 5% aggregated. Tests encode aggregation, but if the business rule differs the current shape (single aggregate, hardcoded rate) can't express it.
- `qty` is unvalidated anywhere in the repo; negative or fractional quantities would distort the aggregate threshold. No validation layer exists to settle whether such lines are reachable — out of scope to fix here, but worth confirming upstream.

Verdict: blocker 0 · should-fix 0 · nit 1 → **CLEAR**

Ready to merge. The nit is advisory and never blocks on its own; the open questions are for the product owner, not the diff. Note per workflow: findings are hypotheses — verify the nit independently before acting on it.
