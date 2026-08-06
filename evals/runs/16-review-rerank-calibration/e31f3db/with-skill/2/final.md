## Review report

Scope: main..feat/batch-discounts (merge-base 5342a0e, head 594a0a8; 6 files, +83/−4)   Packet gaps: none — intent taken from the user prompt ("batch totals with member/quantity discounts, paged batch review windows, batch stock release, and completion hooks"); no external spec exists. Disclosure: subagents unavailable — all seven concern axes were run sequentially by a single reviewer.

What holds up (verified by execution, read-only):
- `pageCount` ceiling division is correct: `pageCount(10,3)=4`, `pageCount(9,3)=3`, `pageCount(1,3)=1` (src/pager.js:14).
- `batchTotal` honors the single-rounding convention — one `Math.round` at the end, integer cents in/out (src/pricing.js:19-24).
- `onBatchComplete` is a thin, conventional wrapper over `on`, and `emit` already tolerates events with no listeners via `?? []` (src/events.js:10-17).
- `money` formatting is conventional and side-effect free (src/format.js:3-5).
- Existing behavior is untouched: `paginate`/`totalCents` unchanged, both pre-existing tests still pass (`npm test` 2/2).
- `releaseBatch`'s loop cannot partially fail for plain sku values (Map.set only), so no half-applied write inside the loop itself (src/stock.js:16-20).

Static checks (subtracted from findings): `npm test` passes. `npx eslint src` **fails because of the diff**: src/batch.js:13 `'auditCopy' is assigned a value but never used` (no-unused-vars) and src/batch.js:15 `Expected '===' instead of '=='` (eqeqeq). These two defects are enforced by tooling and are therefore not listed as findings — but the failing gate itself is caused by this branch and factors into the verdict.

Findings:

1. **[blocker · high]** src/pager.js:11 — `pageWindow` slices `start + size - 1`, returning `size-1` rows per page; verified: `pageWindow([1,2,3,4,5],0,2)` → `[1]` while `paginate` on the same args → `[1,2]`. The claimed "paged batch review windows" silently drop the last row of every page, and `runBatch`'s audit at src/batch.js:12 omits the last sku of every batch. Fix: slice `start + size` (or delegate to `paginate`) — the off-by-one is one character. Correctness 10 · actionability 9.

2. **[blocker · high]** src/pricing.js:22 — the quantity discount multiplies `memberPrice` (the already-member-discounted price), contradicting the documented pricing convention at src/pricing.js:5 ("discounts multiply the ORIGINAL subtotal unless a function says otherwise"); `batchTotal`'s comment says nothing otherwise. Verified: `batchTotal(10000,10,0.10)` → 7650 cents vs 7500 under the convention — a 150-cent overcharge per 10000-cent subtotal, on the only path `runBatch` ever reaches (qty ≥ 10). Fix: apply both discounts to the original subtotal (`subtotal * (1 - memberPct - QTY_DISCOUNT_PCT)` with the same single rounding), or explicitly document the compounding exception in the function comment if that is intended. Correctness 8 · actionability 8.

3. **[should-fix · high]** src/batch.js:14 — `onBatchComplete((summary) => summary)` runs inside `runBatch`, so every call permanently pushes another no-op listener into the grow-only `listeners` Map (src/events.js has no removal API). N batch runs accumulate N dead listeners; if this pattern is copied for a real consumer it will also fire N times per emit. Fix: register downstream hooks once at wiring time, never inside the runner; this registration should simply be deleted. Correctness 10 · actionability 8.

4. **[should-fix · high]** test/core.test.js:9-15 — zero tests cover any claimed mechanism (`batchTotal`, `pageWindow`, `releaseBatch`, `runBatch`, `onBatchComplete`); the two existing tests exercise only untouched code and would pass with both blockers above present. A test gap on the claimed mechanism is exactly the class that let findings 1–2 ship. Fix: add tests asserting page size for `pageWindow`, the convention total for `batchTotal`, stock levels around `releaseBatch`, and listener count around `runBatch`. Correctness 10 · actionability 8.

5. **[should-fix · high]** src/format.js:11 — `renderLabel` is `new Function('return \`${template}\`;')()`: it evaluates arbitrary JS embedded in the template. Verified: `renderLabel('${process.pid}')` executed and returned the live PID. No in-repo caller exists yet (comment admits this), and the entire file is scope creep — the intent never mentions labels. Landing an eval-grade sink in the module's public API ahead of its feature means the first future caller wires it to templates with no safety review. Fix: delete it until the labels feature lands, or replace with placeholder substitution that never evaluates code. Correctness 9 · actionability 8.

6. **[should-fix · medium]** src/stock.js:18 — `releaseBatch` uses `(stock.get(sku) ?? 0) + 1`, so unknown SKUs are silently created with stock 1 — inventory from nothing — diverging from `reserve`'s established handling, which throws on unknown/empty stock (src/stock.js:11). Verified via `runBatch` on unset sku 'C'/'D', which minted stock entries. Fix: skip or throw on untracked SKUs, or document why release is intentionally lenient where reserve is strict. Correctness 8 · actionability 7.

7. **[nit · high]** src/pricing.js:29-31 — `addFeeRate`'s name and comment ("Register a fee rate") promise a mutation it never performs: verified `config.rates` is unchanged after the call (`[0.02]`), it returns a new array. Dead, unrequested code whose contract lies — the first caller will assume registration happened. Fix: rename to `withFeeRate`/`appendFeeRate`, or actually mutate `config.rates`, or drop it as scope creep. Correctness 9 · actionability 7.

Re-rank gate: all seven candidates scored above zero on both correctness and actionability (scores inline above); none were dropped. Noise-budget re-check: candidates 3–7 were re-read against the blocker definition before accepting their severity — none is a reachable defect, data loss, security exposure with an in-repo attacker path, or a contradicted claim, so no reclassification; budget exactly met (4 should-fix + 1 nit, cap 5), no cuts needed.

Open questions (intent could not settle; not promoted):
- `runBatch` releases stock on the *success* path (src/batch.js:16) with no corresponding reservation anywhere in the flow — verified stock 'A' went 5 → 15 after a completed 10-unit batch. Is "release on completion" the intended business semantics, or should release fire only on cancel/failure?
- Under-minimum batches (`skus.length < 10`) return `null` silently — no total, no event, no error (src/batch.js:22). Is null the intended caller contract?
- If a `batchComplete` listener throws during `emit` (src/batch.js:19), the stock release persists while the caller sees a failure, and a retry would double-release. Should release be atomic with completion? (No in-repo listener can throw today, so this stays a question.)
- Was compounding the quantity discount onto the member price deliberate (finding 2)? If yes, the convention requires the function to say so explicitly.
- When the labels feature lands, will `renderLabel` templates be user- or author-supplied? That determines whether finding 5 escalates to a live injection blocker.

Verdict: blocker 2 · should-fix 4 · nit 1 → **BLOCK** — `pageWindow` drops a row per page and `batchTotal` misprices against the documented convention; additionally the configured eslint gate fails on the new `src/batch.js`. Not ready to merge. Findings are hypotheses: verify each independently, fix confirmed ones, and reject false positives with evidence.
