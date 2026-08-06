# Review report

Scope: `main..feat/bulk-discount` (merge-base `840f68f`, 4 files, +54/−6) · Packet gaps: none (intent from user request + commit `0cc6887`; base resolves; diff non-empty). Small diff — reviewed locally, single-reviewer, no subagents spawned.

**What holds up:**
- `totalPrice` behavior is preserved exactly: `src/pricing.js:14-16` delegates to `totalCents`, whose reduce expression (`src/pricing.js:8-11`) is byte-identical to the deleted body; the pre-existing test `total rounds half up` (test/inventory.test.js:19-22) still passes.
- The claimed mechanism — 5% off at ≥10 units, aggregated across lines, wired into daily summaries — is tested through the public API, not by imitating internals: threshold (test/pricing.test.js:7-10), below-threshold (12-15), cross-line aggregation (17-23), and the `dailySummary` integration (test/report.test.js:6-14). Each test would fail under a real mutation of its mechanism (threshold, rate, aggregation, wiring).
- Rounding in the new discount path is sound: I empirically verified in node that `cents * 0.95` is float-exact at every half-cent boundary (`cents % 20 === 10`: 10, 30, …, 2010) and `roundHalfUp` yields the decimal half-up result; e.g. `totalWithBulkDiscount([{unitPriceCents:21, qty:10}])` = 2.00, not 1.99.
- Blast radius is contained: the only consumer of `dailySummary` is its test; `totalPrice` remains exported and unchanged in behavior; `restockReport` untouched.

**Static checks:** only `npm test` (`node --test`) is configured — no formatter/linter/typecheck/build. Ran: 9/9 pass. Nothing configured to subtract beyond that.

**Findings:**
1. [nit · medium] test/pricing.test.js:7-23 — all cases use round-dollar inputs (200×N), so no test pins the rounding of the discounted subtotal; a mutation of `src/pricing.js:21` from `roundHalfUp(cents * 0.95)` to truncation would pass the suite. Concrete impact: the discount path's rounding convention (the module's established half-up rule) is unprotected. Fix direction: add one fractional-cent case, e.g. `unitPriceCents: 21, qty: 10` → 2.00.

**Open questions** (intent could not settle; not findings):
- The 5% rate is unstated in any intent source — only "bulk discount at ten units" is claimed; correctness of the rate itself is unverifiable from the packet.
- The bulk discount stacks multiplicatively on top of per-line `discount` (`src/pricing.js:9,21`). Intended stacking vs. exclusive discounts is unspecified.

**Verdict:** blocker 0 · should-fix 0 · nit 1 → **FIX-THEN-COMMIT** — safe to merge after optionally adding the fractional-cent rounding test; confirm the 5% rate and stacking semantics with the requester.
