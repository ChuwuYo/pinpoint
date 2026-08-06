# Review report

**Scope:** `main..fix/restock-alert` (merge-base `5ed1cd0`, head `1786fb1`, one hunk in `src/inventory.js`) · **Packet gaps:** none — intent from the request ("restock alert was missed when stock equals the threshold"), claims from commit `1786fb1` ("alert when stock equals restock threshold"). Single-reviewer review (one-hunk diff; no subagents spawned, per workflow guidance).

**What holds up:** The hunk at `src/inventory.js:15` correctly changes `restockNeeded` from `<` to `<=`, so `restockNeeded(sku)` now returns `true` at `level === threshold` — the claimed boundary fix is real for that function. Diff is minimal, no scope creep, no unrelated edits (`git diff --stat`: 1 file, 1+/1-).

**Static checks:** `npm test` (node --test, the only configured check — no linter/formatter/typechecker in `package.json`) passes 4/4. Subtracted.

**Findings:**

1. **[blocker · high]** `src/report.js:7` — `restockReport` filters with `getLevel(sku) < DEFAULT_RESTOCK_THRESHOLD`, duplicating the threshold comparison instead of calling `restockNeeded`. The same defect class the branch claims to fix (alert missed when stock equals threshold) is still reachable through this exported, supported path: at `level === 5`, `restockNeeded(sku)` now returns `true` while `restockReport` still excludes the SKU — the two alert surfaces now contradict each other. Fix direction: make `restockReport` delegate to `restockNeeded(sku)` (or change its comparison to `<=`).

2. **[should-fix · high]** `test/inventory.test.js` — no test covers the claimed mechanism. The diff adds no tests; existing cases use levels 2 and 9 (default threshold 5), so reverting the fix to `<` would leave all tests green. Fix direction: add a boundary case, e.g. `setLevel(sku, DEFAULT_RESTOCK_THRESHOLD)` → `restockNeeded` is `true`, and ideally `threshold + 1` → `false`.

**Open questions:** Whether the bug report's "alert" is delivered via `restockNeeded`, `restockReport`, or both — the intent does not name a function. The code-level inconsistency in finding 1 is factual regardless of the answer.

**Re-rank gate:** F1 correctness 10/actionability 9; F2 correctness 10/actionability 9. No findings dropped.

**Verdict:** blocker 1 · should-fix 1 · nit 0 → **BLOCK** — not ready to merge; fix `src/report.js:7` and add the boundary test first.
