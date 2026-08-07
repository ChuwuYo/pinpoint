## Review report

**Scope:** `b64d64c..fix/restock-alert` (merge-base of `main`) — one hunk, `src/inventory.js:15`, `<` → `<=` in `restockNeeded`. Packet gaps: none (base ref resolves, diff non-empty, intent taken from the user-stated prompt; branch commits corroborate).

**Mode:** standalone, single-reviewer (diff is one line; parallel axis reviewers not warranted — disclosed per skill).

**Gate status:** repo's configured gate `node --test` run on the branch — **PASS, 4/4** (exit 0). No other tooling configured (no linter, formatter, or type checker; no AGENTS.md/README rules). Repo state verified unchanged after the run (`git status --porcelain` empty) — review stayed read-only.

**What holds up:**
- The operator change at `src/inventory.js:15` directly implements the intended semantics: stock equal to threshold now alerts. Verified by reading the hunk and the base version (`b64d64c:src/inventory.js`).
- No scope creep: exports, `DEFAULT_RESTOCK_THRESHOLD`, and all other files untouched; behavior below/above threshold unchanged (0<5 vs 0<=5 identical for unknown SKUs, etc.).
- Existing suite still green under the new semantics.

**Static checks (subtracted):** only `node --test` is configured; its 4 passes are subtracted from findings. Nothing else enforces anything here.

**Findings:**
1. **[should-fix · high]** `src/report.js:7` — `restockReport` re-implements the restock predicate as `getLevel(sku) < DEFAULT_RESTOCK_THRESHOLD` instead of calling `restockNeeded`. Post-merge the two restock surfaces contradict at exactly threshold: `restockNeeded('X') === true` while `restockReport(['X'])` omits `X` — the reported "missing at threshold" symptom persists on the report surface. Re-rank: correctness 9 (both files read; grep confirms all consumers), actionability 9. Fix: `skus.filter((sku) => restockNeeded(sku))`.
2. **[should-fix · high]** `test/inventory.test.js:8-17` — no test at stock == threshold, the claimed mechanism. Both existing cases (2 vs 5, 9 vs 5) pass identically under `<` and `<=`, so the suite cannot catch a revert of this fix; the gate passes without proving the bug is fixed. Re-rank: correctness 10, actionability 9. Fix: add an equality case, e.g. `setLevel('SKU-3', 5); assert.equal(restockNeeded('SKU-3'), true)`.

**Advisory nits:** none with concrete impact.

**Open questions:** was the original bug report scoped to the `restockNeeded` alert only, or also to the restock report view? If the latter, finding 1 elevates to blocker.

**Verdict:** blocker 0 · should-fix 2 · nit 0 → **FIX-THEN-COMMIT** — not ready to merge as-is; the gate is green but does not exercise the fixed mechanism, and the same defect survives in `restockReport`. Verify each finding independently before acting.
