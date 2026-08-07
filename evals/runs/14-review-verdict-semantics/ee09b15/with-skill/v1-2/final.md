## Review report

**Scope:** `b64d64c..4daa575` (merge-base of `main`..`fix/restock-alert`), 1 file changed: `src/inventory.js` (`<` → `<=` in `restockNeeded`)
**Mode:** standalone review, single-reviewer (axes run sequentially; diff is one hunk, subagent fan-out unnecessary). Read-only verified: `git status --porcelain` empty before and after; gate run mutated nothing.
**Packet gaps:** none — intent taken unedited from the prompt ("fixes a reported restock-alert bug: alert missing when stock equals the threshold"); claims from commit `4daa575` ("fix(inventory): alert when stock equals restock threshold"); validation evidence obtained by running the configured gate.

**Gate status:** `node --test` → PASS, 4/4 tests, exit 0.

**What holds up:**
- The fix targets the correct predicate for the stated intent: `restockNeeded(sku)` at src/inventory.js:15 now returns `true` when `getLevel(sku) === threshold`, which is exactly the reported missing-alert case. Default threshold (`DEFAULT_RESTOCK_THRESHOLD = 5`) and unknown-SKU handling (`?? 0`) are untouched, so below-threshold and zero-stock behavior is preserved.
- Change is minimal — one operator, no scope creep into unrelated modules.
- Configured test gate passes on the branch (`node --test`, 4 pass / 0 fail).

**Static checks:** the repository configures only `npm test` → `node --test` (package.json:6); no formatter, linter, type checker, or build is configured, so nothing further is subtracted.

**Findings:**
1. [should-fix · high] src/report.js:7 — `restockReport` still filters with `getLevel(sku) < DEFAULT_RESTOCK_THRESHOLD`, a duplicate of the same restock predicate that the branch just fixed — a SKU at exactly the threshold now returns `restockNeeded === true` yet is omitted from the restock report, so the identical reported bug remains reachable on a sibling restock surface. Fix direction: change `<` to `<=`, or better, delegate to `restockNeeded(sku)` so the boundary semantics exist in exactly one place.
2. [should-fix · high] `test/inventory.test.js:9-17` — the branch adds no test for the claimed mechanism: both existing inventory tests (stock 2 vs threshold 5; stock 9 vs threshold 5) pass identically under `<` and `<=`, so the suite cannot catch a revert of this fix — which is exactly how the bug shipped green originally. Fix direction: add an equality-boundary test (`setLevel('SKU-3', 5); assert.equal(restockNeeded('SKU-3'), true)`) and ideally the threshold+1 case (`6 → false`).

**Advisory nits:** none reported (no nit with concrete impact survived the re-rank gate).

**Open questions:**
- Which surface actually drives the user-facing restock alert — `restockNeeded`, `restockReport`, or consumer code outside this repo? No alert dispatch exists in-repo; if the reported alert flows through `restockReport`, this branch does not fix the reported bug at all.
- Is `restockReport`'s strict `<` intentional report semantics or the same defect? (Finding 1 assumes the latter; the packet could not settle it.)

**Re-rank gate:** finding 1 — correctness 9 (verified by reading both files; divergence is factual), actionability 8 (concrete one-line delegation fix). Finding 2 — correctness 10 (no test hunks in diff; boundary values absent from suite), actionability 9 (single test addition). Both survive; none dropped.

**Verdict:** blocker 0 · should-fix 2 · nit 0 → **FIX-THEN-COMMIT**

Not ready to merge as-is: the gate is green but does not cover the fixed boundary, and the same off-by-one persists in `restockReport`. Verify each finding independently before acting.
