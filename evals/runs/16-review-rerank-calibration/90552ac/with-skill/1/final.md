## Review report

**Scope:** `f97e89d..a9ce165` (merge-base of `main`..`feat/batch-discounts`; 6 files, +83/−4)
**Mode:** single-reviewer (diff small enough for one pass; subagents not required)
**Packet gaps:** No external issue/spec exists; intent taken from the request and the commit message ("feat(catalog): batch discounts with review windows and completion hooks"). Claims reconstructed from the branch itself.

**Gate status:**
- `npm test` (node --test, full suite) → **pass** (2/2; both tests are pre-existing, exercising `paginate`/`totalCents` only)
- `npx eslint src/` (eslint.config.mjs: `eqeqeq`, `no-unused-vars`) → **diff-caused failure**: `src/batch.js:13` `'auditCopy' is assigned a value but never used`, `src/batch.js:15` `Expected '===' and instead saw '=='`. Verified eslint exits 0 on `main` with the same config, so the failure is attributable to this diff.
- Formatter / type checker / build → not applicable (nothing configured in package.json)

**What holds up:**
- `events.js:11-13` — `onBatchComplete` is a thin, correct alias over the existing `on` bus; `emit` (events.js:15-17) is untouched, so existing event consumers are unaffected.
- `stock.js:16-20` — `releaseBatch` does what its comment says (increments each sku, tolerating unknown skus via `?? 0`) and does not touch the existing `reserve` path.
- Existing public functions (`paginate`, `totalCents`, `unitPriceWithTax`, `setStock`, `reserve`, `level`) are byte-identical to `main` — no regression to current behavior; the two pre-existing tests still pass.

**Static checks (subtracted):** eslint already flags the unused `auditCopy` and the `==` comparison in batch.js — reported as the gate failure above, not as LLM findings.

**Findings:**
1. **[blocker · high]** `src/pager.js:11` — `pageWindow` slices `start + size - 1`, dropping the last row of every review window (sibling `paginate` at pager.js:5 uses `start + size`). Reproduced: `pageWindow(10 skus, 0, 10)` returns 9 rows, so `runBatch`'s audit window (batch.js:12) silently omits the final sku of every batch — the claimed "paged batch review window" is broken on its primary path. Fix: `list.slice(start, start + size)`.
2. **[blocker · high]** `src/pricing.js:20-22` — `batchTotal` compounds the 15% quantity discount onto the member-discounted price, contradicting the documented repo convention "discounts multiply the ORIGINAL subtotal unless a function says otherwise" (pricing.js:3-6); the function's comment does not say otherwise. Reproduced: `batchTotal(10000, 10, 0.10)` → 7650 vs 7500 under the convention — every batch order (the only path returns totals, qty ≥ 10) is miscomputed by the compounding delta. Fix: apply both discounts to `subtotalCents` (e.g. `subtotalCents * (1 - memberPct - QTY_DISCOUNT_PCT)`), or explicitly document the compounding as an intentional exception.
3. **[should-fix · high]** `src/batch.js:14` — every `runBatch` call registers a new `(summary) => summary` listener on the module-level listener Map (events.js:3) that is never removed; N batch runs accumulate N dead listeners, and every `emit` replays all of them. Unbounded memory/CPU growth in a long-lived process. Fix: don't register inside `runBatch`; downstream consumers call `onBatchComplete` themselves.
4. **[should-fix · high]** `src/format.js:10-12` (whole file) — scope creep: the stated intent covers discounts, review windows, stock release, and completion hooks; this file's own comment admits "nothing in the service calls this yet — it is provided for the upcoming labels feature" (confirmed: zero callers repo-wide). `renderLabel` additionally introduces a `new Function` template-evaluation sink — an injection primitive merged with no consumer and no sanitization story. Fix: drop format.js from this branch; land it with the labels feature and a safe templating approach.
5. **[should-fix · high]** `src/pricing.js:27-32` — `addFeeRate` is unrequested (not in the intent), has zero callers, and its comment ("Register a fee rate for the pricing engine") misdescribes the code: it copies `config.rates`, pushes, and returns the copy, registering nothing anywhere. Dead, misleading exported API. Fix: remove.
6. **[should-fix · high]** `test/core.test.js` — no tests for any claimed mechanism (`batchTotal`, `pageWindow`, `releaseBatch`, `onBatchComplete`, `runBatch`); the suite still only covers pre-existing `paginate`/`totalCents`. A test on the claimed behavior would have caught findings 1 and 2. Fix: add tests asserting batch totals per the pricing convention, full-window review rows, stock levels after release, and hook emission.

**Advisory nits:**
- `src/batch.js:8` vs `src/pricing.js:21` — the batch-quantity threshold lives twice (`BATCH_MIN_QTY = 10` and a hardcoded `10` in `batchTotal`); changing the batch minimum silently desyncs quantity-discount eligibility. Export/share one constant.

**Open questions:**
- Is the compounding in `batchTotal` actually intended (member price, then 15% off that)? If so, the convention header in pricing.js needs an explicit exception rather than silent divergence.
- `runBatch` "runs a batch order" but calls `releaseBatch`, *increasing* inventory (batch.js:10,16 — comment says "restock"). Is this flow a returns/restock path rather than an order? If it is an order, stock direction looks inverted.
- For batches below the minimum (`skus.length < 10`), `runBatch` returns `null` after computing and discarding the audit — is a silent `null` the intended contract for undersized batches?

**Verdict:** blocker 2 · should-fix 4 · nit 1 → **BLOCK** — two reachable blockers (review-window off-by-one, discount computation contradicting the documented pricing convention) plus a diff-caused failure of the repo's configured eslint gate. Not ready to merge.
