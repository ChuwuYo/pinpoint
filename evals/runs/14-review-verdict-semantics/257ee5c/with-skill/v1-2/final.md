## Review report

**Scope:** `b64d64c..4daa575` (merge-base of `main`..`fix/restock-alert`), 1 hunk in `src/inventory.js`
**Mode:** standalone, single-reviewer (diff is one hunk; axes run sequentially, not via parallel subagents)
**Packet gaps:** no external issue/bug report text available — intent taken from the user's unedited statement ("fixes a reported restock-alert bug: alert missing when stock equals the threshold") plus commit message `4daa575`; no repository rules found (no AGENTS.md/lint/format/typecheck config; `package.json` defines only the test gate)
**Gate status:** `node --test` → 4/4 pass (exit 0). Note the gate was also green *before* this fix, so a green gate does not validate the claimed mechanism.

**What holds up:**
- The fix targets the owning boundary: the restock predicate lives in `src/inventory.js:15`, the module that owns stock levels, and `restockNeeded('x')` now returns `true` at stock == threshold and `false` at threshold+1 — the exact semantics the intent demands (verified by reading the hunk and evaluating boundary values).
- Blast radius of the change itself is bounded: the only in-repo callers of `restockNeeded` are tests (`test/inventory.test.js:11,16`); the export surface and default-parameter behavior are otherwise unchanged.
- Read-only review confirmed: working tree clean before and after; no mutation.

**Static checks:** only `node --test` is configured — run, passes (4/4). No formatter, linter, type checker, or build is configured, so nothing further to subtract.

**Findings:**
1. [should-fix · high] `src/report.js:7` — `restockReport` still filters with `getLevel(sku) < DEFAULT_RESTOCK_THRESHOLD`, a duplicate of the same restock predicate that the branch just fixed — a SKU at exactly the threshold now returns `restockNeeded === true` yet is omitted from the restock report, so the identical reported bug remains reachable on a sibling restock surface. Fix direction: change `<` to `<=`, or better, delegate to `restockNeeded(sku)` so the boundary semantics exist in exactly one place.
2. [should-fix · high] `test/inventory.test.js:9-17` — the branch adds no test for the claimed mechanism: both existing inventory tests (stock 2 vs threshold 5; stock 9 vs threshold 5) pass identically under `<` and `<=`, so the suite cannot catch a revert of this fix — which is exactly how the bug shipped green originally. Fix direction: add an equality-boundary test (`setLevel('SKU-3', 5); assert.equal(restockNeeded('SKU-3'), true)`) and ideally the threshold+1 case (`6 → false`).

**Advisory nits:** none reported (no nit with concrete impact survived the re-rank gate).

**Open questions:**
- Which surface actually drives the user-facing restock alert — `restockNeeded`, `restockReport`, or consumer code outside this repo? No alert dispatch exists in-repo; if the reported alert flows through `restockReport`, this branch does not fix the reported bug at all.
- Is `restockReport`'s strict `<` intentional report semantics or the same defect? (Finding 1 assumes the latter; the packet could not settle it.)

**Verdict:** blocker 0 · should-fix 2 · nit 0 → **FIX-THEN-COMMIT** — not ready to merge as-is. The core one-line fix is correct, but the sibling predicate retains the same bug and no test pins the equality boundary. Findings are hypotheses; verify each independently before acting.
