## Review report
Scope: `main...fix/restock-alert` (merge-base `b64d64c` .. `4daa575`, 1 file, 1 line: `src/inventory.js`)
Mode: single-reviewer (one-line diff; axes run locally in one pass — no subagents spawned)
Packet gaps: intent is user-stated only ("fixes a reported restock-alert bug: alert missing when stock equals the threshold") — no linked issue or reproduction evidence was provided; claims taken from the commit message `fix(inventory): alert when stock equals restock threshold`; no validation evidence shipped with the branch (gate run by reviewer instead).
Gate status: `node --test` (repo-configured gate, full suite) → **pass** (exit 0, 4/4 tests). Formatter / linter / type checker / build → **not applicable** (none configured; `package.json` defines only `test`).
What holds up: the changed predicate `getLevel(sku) <= threshold` at `src/inventory.js:15` does implement the stated intent for `restockNeeded` — stock exactly equal to the threshold now returns `true` (verified by reading the hunk; boundary arithmetic 5 ≤ 5). The diff is minimal and touches nothing else. The configured gate is green.
Static checks: none configured beyond the test gate — nothing to subtract.
Findings:
  1. [blocker · high] `src/report.js:7` — `restockReport` filters with `getLevel(sku) < DEFAULT_RESTOCK_THRESHOLD`, the same strict-boundary root cause this branch fixes in `restockNeeded`. A SKU at exactly the threshold now alerts via `restockNeeded` but is still silently omitted from the restock report — the claimed bug class survives on a sibling path that shares the same threshold constant. Re-rank: correctness 10 (line read; same predicate kind, same constant), actionability 9. Fix direction: change to `<=`, or better, have `restockReport` delegate to `restockNeeded` so the boundary lives in exactly one place.
  2. [should-fix · high] `test/inventory.test.js:9-17` — no test exercises stock == threshold; the two restock tests (level 2 → true, level 9 → false) pass identically under `<` and `<=`, so the suite would stay green if this branch were reverted. The claimed fix has zero regression protection. Re-rank: correctness 10 (verified by arithmetic against both predicates), actionability 9. Fix direction: add a boundary test (e.g., level 5 → `true`, level 6 → `false`); if finding 1 is fixed, add a `restockReport` boundary case too.
Advisory nits: none beyond the fix directions above.
Open questions: is `restockReport` intended to share the alert's threshold semantics? It imports `DEFAULT_RESTOCK_THRESHOLD`, which strongly suggests yes, but the stated intent names only the alert — if the report were deliberately stricter, finding 1 would downgrade; nothing in the repo supports that reading.
Verdict: blocker 1 · should-fix 1 · nit 0 → **BLOCK**

The branch is not ready to merge: the same threshold-boundary root cause survives in `restockReport` (`src/report.js:7`), and the fix carries no boundary test. Verify each finding independently before acting.
