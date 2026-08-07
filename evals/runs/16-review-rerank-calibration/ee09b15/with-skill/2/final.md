## Review report

**Scope:** `f97e89d..a9ce165` (merge-base of `main`..`feat/batch-discounts`), 6 files, +83/−4
**Mode:** standalone, single-reviewer (diff small enough for one pass; no subagents spawned). Read-only confirmed — `git status` clean before and after.
**Packet gaps:** none — base ref resolved, diff non-empty, intent taken unedited from the request, claims from the branch description/commit `a9ce165` ("batch totals with member/quantity discounts, paged batch review windows, batch stock release, and completion hooks").

**Gate status**
- `npm test` (`node --test`): **PASS**, 2/2 — but both tests pre-date the branch; nothing new is exercised.
- `npx eslint src` (config committed at `eslint.config.mjs`, `eqeqeq` + `no-unused-vars` as errors): **FAIL**, 2 errors, both on new code in `src/batch.js`.

**What holds up**
- Existing behavior preserved: `paginate` and `totalCents` untouched, their tests still green.
- `releaseBatch` matches the "batch stock release" intent and defaults unknown SKUs via `?? 0` (`src/stock.js:17`).
- `batchTotal` rounds once at the end, honoring the repo's round-once rule (`src/pricing.js:21-23`).
- `pageCount`'s ceiling division is correct (`src/pricing.js`… `src/pager.js:15-16`).

**Static checks (subtracted from findings)**
- `src/batch.js:13` `'auditCopy' is assigned a value but never used` (no-unused-vars) and `src/batch.js:15` `==` instead of `===` (eqeqeq) — tooling-enforced, not reported as findings; but the branch fails this configured gate on its own new code.

**Findings**
1. **[blocker · high]** `src/pager.js:11` — `pageWindow` slices `list.slice(start, start + size - 1)`, one row short versus the established `paginate` (`start + size`). Every page drops its last row, and the row at each page boundary (index `size-1`, `2size-1`, …) appears on *no* page — paging through a full list permanently skips rows. `runBatch`'s 10-SKU audit window shows 9. Fix: `slice(start, start + size)` plus a paging test. (Separately, the only caller discards the result — `src/batch.js:12-13` — so even fixed, the "review window" is decorative until something consumes it.)
2. **[should-fix · high]** `src/batch.js:14` — every `runBatch` call appends a no-op listener to the global `listeners` map and nothing ever removes it: unbounded growth plus wasted dispatch on every `emit`. Fix: delete the self-registration; downstream consumers subscribe via `onBatchComplete` themselves.
3. **[should-fix · high]** `src/format.js:11-13` — `renderLabel` evaluates template text via `new Function` (eval-equivalent), and the whole module is out of the stated scope by its own comment ("nothing in the service calls this yet"). Ships a code-injection primitive for an unrequested feature. Fix: drop the module from this branch; if labels land later, interpolate without eval.
4. **[should-fix · high]** `test/core.test.js` — zero tests for the claimed mechanisms (`batchTotal` discount math, `pageWindow` paging, `releaseBatch`, the completion hook). A single `pageWindow` test would have caught finding 1. Fix: add tests asserting claimed behavior.
5. **[should-fix · medium]** `src/pricing.js:20-24` — `batchTotal` compounds the quantity discount on the *member-discounted* price, while the repo convention (`src/pricing.js:5`) states "discounts multiply the ORIGINAL subtotal unless a function says otherwise" — and this function's doc doesn't say otherwise. 10% member + 15% qty yields 23.5% off vs. the convention's 25%. Fix: apply both discounts to the original subtotal, or document the exception explicitly.

Re-rank gate: all five scored >0 on correctness and actionability (lowest: finding 5, correctness 7 — convention text is real, business intent interpretive → kept at medium confidence). No finding promoted from speculation.

**Advisory nits**
- `addFeeRate` (`src/pricing.js:28-32`) and `pageCount` (`src/pager.js:15`) are exported with no caller and no stated-intent requirement — dead API surface.
- `skus.length == BATCH_MIN_QTY || skus.length > BATCH_MIN_QTY` (`src/batch.js:15`) is a redundant way to write `>=` (the `==` half is already lint-flagged).

**Open questions**
- What is meant to consume the batch review window — is an audit sink planned, or should `runBatch` return it?
- Is returning `null` for sub-minimum batches the intended API contract?

**Verdict:** blocker 1 · should-fix 4 · nit 0 → **BLOCK** — not ready to merge: the review-window paging drops rows, the configured eslint gate fails on the branch's own new code, and none of the claimed behavior is tested. Findings are hypotheses; verify each independently before fixing.
