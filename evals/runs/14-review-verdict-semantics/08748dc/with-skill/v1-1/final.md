# Review report

Scope: main (5ed1cd0)..fix/restock-alert (1786fb1), one-file diff — `src/inventory.js` `<` → `<=` in `restockNeeded`. Packet gaps: no external issue/spec exists; intent taken unedited from the request ("the restock alert was missed when stock equals the threshold") and the commit message ("fix(inventory): alert when stock equals restock threshold"). No reproduction evidence was supplied with the change; I reproduced boundary behavior myself (below). Single-reviewer review — the diff is one line, so axes were run sequentially rather than via parallel subagents.

What holds up: The fix is correct and minimal for the function it touches. Verified empirically: at level 5 with default threshold 5, `restockNeeded('SKU-EQ')` now returns `true` (previously `false`); above-threshold behavior is preserved (`npm test`: level 9 → `false`, 4/4 pass). No scope creep — the diff is exactly the boundary change the intent describes, and `restockNeeded` has no other callers besides tests.

Static checks: only `npm test` (`node --test`) is configured — 4/4 pass. No linter, formatter, or type checker configured. Nothing to subtract.

Findings:

1. [blocker · high] src/report.js:7 — `restockReport` filters with `getLevel(sku) < DEFAULT_RESTOCK_THRESHOLD`, duplicating the threshold comparison instead of delegating to `restockNeeded`; it was not updated by the fix. A SKU at exactly the threshold now alerts via `restockNeeded` but is silently omitted from the restock report — the same defect class the branch claims to fix, still reachable through a supported path. Proven: `setLevel('SKU-EQ', 5)` → `restockNeeded` = `true`, `restockReport(['SKU-EQ'])` = `[]`. Fix direction: make `restockReport` call `restockNeeded(sku)` so the boundary semantics live in one predicate.
2. [should-fix · high] test/inventory.test.js:9-17 — no test covers the equality boundary the fix claims to change. Existing cases use levels 2 and 9, which do not discriminate `<` from `<=`; the suite passes with the fix reverted, so no test would fail if the code were broken. Fix direction: add a level-equals-threshold case asserting `true` (and ideally a level-6 `false` case plus a `restockReport` boundary test once finding 1 is fixed).

Re-rank gate: finding 1 — correctness 10 (reproduced at runtime), actionability 9 (one-line delegation); finding 2 — correctness 9 (verified the suite passes on the pre-fix predicate), actionability 9 (concrete test to add). Both survive.

Open questions: whether `restockReport` is considered part of the "restock alert" surface in the original bug report — the intent statement does not name it; treated as in-scope because it is the only other threshold consumer and the inconsistency is user-visible either way.

Verdict: blocker 1 · should-fix 1 · nit 0 → BLOCK

Not ready to merge: the boundary fix is correct in `restockNeeded` but the same off-by-one survives in `restockReport`, and the claimed mechanism has no test. Both fixes are small — delegate the predicate and add the equality test, then re-review. Findings are hypotheses; verify each independently before acting. Repository state confirmed unchanged (clean working tree before and after).
