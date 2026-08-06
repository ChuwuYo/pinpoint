# Review report
Scope: `main...fix/price-rounding` (merge-base `5ed1cd0`, head `a607583`, 1 file: `src/pricing.js`, +8/−4)   Packet gaps: no issue/spec exists — intent reconstructed from the task statement and commit message `fix(pricing): switch totals to banker's rounding`; no repository rules files (README/AGENTS/CONTRIBUTING) exist. Single-reviewer review (diff small enough for one pass; no subagents spawned).

What holds up:
- The core mechanism is correct. `roundHalfEven` (src/pricing.js:3-9) verified by direct execution: `498.5 → 498` (even floor), `499.5 → 500` (odd floor), `497.4 → 497`, `497.6 → 498`, negatives `-2.5 → -2`, `-1.5 → -2`. Exact-tie comparison is sound for this domain: ties arise from integer `unitPriceCents*qty` × exact binary fractions (0.5, 0.75), so ties land exactly on `fraction === 0.5`.
- Ownership is right: rounding lives in `pricing.js`, the single boundary that owns the totals transition; `totalPrice` (src/pricing.js:16) is the only call site.
- Blast radius verified: grep shows the only in-repo consumers of `pricing.js` are `src/report.js` (`dailySummary`, inherits the intended behavior change) and the test. The removed `roundHalfUp` export has no in-repo consumer.

Static checks: only `npm test` (`node --test`) is configured — no linter/formatter/typechecker to subtract. Current run: 3 pass, 1 fail.

Findings:
  1. [blocker · high] test/inventory.test.js:19-22 — the branch does not update the test that encodes the old round-half-up behavior; `npm test` fails with `4.98 !== 4.99` (assertion at line 21). The deliverable state of the branch is a red suite, so the implicit claim of a working change is contradicted by the repo's own configured check. Fix direction: update the expectation to banker's rounding (`498.5 → 4.98`) and rename the test (`total rounds half up` is now false).
  2. [should-fix · high] test/inventory.test.js:19 — no test pins the claimed new mechanism: neither tie parity (even-floor `498.5 → 498` nor odd-floor `499.5 → 500`) is asserted anywhere. The only test touching rounding would pass under the old implementation if its expectation were reverted; it cannot distinguish round-half-even from round-half-up except by accident of one even-floor case. Fix direction: when fixing finding 1, add the odd-floor tie case (e.g., `{unitPriceCents: 999, qty: 1, discount: 0.5}` → `5.00`, where half-up would give the same but a non-tie-adjacent bug such as always-round-down would not — or use `249.5`-style half-cent constructions via discount to pin both parities explicitly). (Re-rank gate: finding 1 correctness 10/actionability 10; finding 2 correctness 9/actionability 9 — both survive.)

Open questions: the diff removes `roundHalfUp` from `module.exports` (src/pricing.js:23) — beyond the stated intent of switching totals. No in-repo consumer exists and `package.json` is `private` with no entry point, so no supported consumption path breaks; flagged only in case an out-of-repo consumer was intended to keep working.

Verdict: blocker 1 · should-fix 1 · nit 0 → BLOCK

Not ready to merge: the branch's own test suite fails. Verify each finding independently; the fix is a test update plus tie-parity coverage, after which the implementation itself checks out as correct banker's rounding.
