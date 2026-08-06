# Review report

Scope: main..feat/bulk-discount (merge-base f969213, head e918a18; 4 files, +54/−6) · Packet gaps: no repo rules exist (no README/AGENTS/CONTRIBUTING); intent taken from the request + commit message ("bulk discount at ten units, applied in daily summaries"); the discount *rate* appears in no intent source. Single-reviewer local review (diff is small enough for one pass). Read-only verified: tree clean, HEAD unchanged after review.

What holds up:
- Threshold semantics are exactly as claimed: `totalQty >= 10` (src/pricing.js:21), pinned at the boundary by a passing test at exactly 10 units (test/pricing.test.js:8) and a below-threshold test at 3 (test/pricing.test.js:13).
- Cross-line aggregation is pinned: the 5+5 test (test/pricing.test.js:17) fails under a per-line-threshold implementation, so the tests exercise the real mechanism, not the implementation shape.
- Application in daily summaries is real and tested end-to-end: report.js:11 swaps `totalPrice` → `totalWithBulkDiscount`; report.test.js:7 would fail (`USD 20.00` ≠ `USD 19.00`) if the swap were reverted.
- The `totalCents` extraction preserves existing behavior: it performs no rounding, so `totalPrice` still rounds exactly once; the pre-existing "total rounds half up" test (997¢ @ 50% → 4.99) still passes. Blast radius matches the claim — the only in-repo consumers of pricing are report.js and the unchanged test suite.
- Discount arithmetic probed adversarially: exhaustive 1..100k integer-cent totals plus 2M randomized fractional-cent lines (from per-line discounts) show zero deviation of `roundHalfUp(cents * 0.95)` from exact half-up arithmetic — the floating-point hazard is not reachable here, so it is not a finding.

Static checks: only `npm test` (`node --test`) is configured; no linter/formatter/typechecker exists. 9/9 tests pass on the branch (4 pre-existing + 5 new). Nothing further to subtract.

Findings:
1. [nit · high] src/pricing.js:19,21 — threshold `10` and rate `0.95` are bare literals with no named constant or doc — the 5% rate is discoverable only by reading the expression, and a policy change means editing unexplained magic numbers — extract `BULK_QTY_THRESHOLD`/`BULK_DISCOUNT_RATE` constants.

Open questions (intent cannot settle, not promoted to findings):
- Is 5% the intended rate? No intent source states it; the code is internally consistent but unverifiable against policy.
- Should the bulk discount stack multiplicatively with per-line `discount` (current behavior: 1000¢×10 @10% line discount → 85.50), or is it mutually exclusive?
- Is fractional/negative `qty` in scope? Unvalidated before and after; a fractional qty can tip `totalQty` over 10.

Verdict: blocker 0 · should-fix 0 · nit 1 → **CLEAR** — ready to merge. The nit is advisory and does not gate. Findings are hypotheses; verify independently before acting.
