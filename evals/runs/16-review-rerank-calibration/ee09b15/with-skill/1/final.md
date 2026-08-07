## Review report

**Scope:** `f97e89d (merge-base main)..a9ce165 feat/batch-discounts` — 6 files, +83/−4. **Mode:** standalone, single-reviewer (diff is one-pass size, no subagents spawned). Read-only verified: working tree clean before and after (`git status --porcelain` empty).

**Packet gaps:** none material. Base ref resolves, diff non-empty. No external spec exists; intent is the prompt as stated, claims reconstructed from the commit message (`feat(catalog): batch discounts with review windows and completion hooks`) and code comments. Validation evidence: I ran the configured gates myself.

**Gate status:**
- `npm test` (node --test): **PASS** — 2/2, but both tests cover untouched base functions only.
- `npx eslint src/` (configured: `eqeqeq`, `no-unused-vars`): **FAIL** — 2 errors in `src/batch.js`: `13:9 'auditCopy' never used`, `15:19 expected '==='`. The branch fails its own configured lint gate.

**What holds up (with evidence):**
- `releaseBatch` increments per sku occurrence and tolerates unknown skus via `?? 0` (`src/stock.js:16-20`) — matches the "batch stock release" claim.
- The completion-hook mechanism itself works: `onBatchComplete` delegates to `on`, `emit` delivers the payload (`src/events.js:10-17`). The leak is in the caller, not the bus.
- `batchTotal` honors the repo's "round once, at the end" convention — single `Math.round` on an unrounded intermediate (`src/pricing.js:22,24`).
- `pageCount` is correct ceiling division (`src/pager.js:15`).
- Existing modules changed additively only — `paginate`, `totalCents`, `reserve`, `on`, `emit` etc. are untouched; blast radius is contained to new paths and base tests still pass.

**Static checks (subtracted, not findings):** eslint already enforces the two `batch.js` errors above; they fail the gate but are excluded from findings per noise-budget rules.

**Findings:**
1. **[blocker · high]** `src/pager.js:11` — `pageWindow` slices `start + size - 1`, returning one row short of `size` (a 10-row window yields 9 rows, dropping the last). The established `paginate` in the same file slices `start + size` (`pager.js:5`) and no comment justifies the divergence. The claimed "paged batch review windows" mechanism is contradicted by the evidence. Fix: `list.slice(start, start + size)`.
2. **[should-fix · high]** `src/batch.js:14` — `runBatch` pushes a new no-op listener onto the module-level `listeners` Map on every call and never removes it; N batch runs leak N listeners, and each `emit('batchComplete', …)` fans out to all of them. Fix: register once at module init, or drop the in-call registration.
3. **[should-fix · high]** `src/format.js:11` — `renderLabel` is `eval` via `new Function(\`return \`${template}\`;\`)`: any `${…}` in a passed template executes arbitrary JS. It has no callers (admitted in its own comment) and label formatting is outside the stated intent — an unrequested eval-equivalent API committed ahead of need. Fix: remove until the labels feature lands, or use explicit placeholder substitution.
4. **[should-fix · medium]** `src/pricing.js:20-22` — repo convention: "discounts multiply the ORIGINAL subtotal unless a function says otherwise" (`pricing.js:5`). `batchTotal` applies `QTY_DISCOUNT_PCT` to the already-member-discounted `memberPrice`, compounding discounts — at memberPct 0.10 / qty 0.15 the customer gets 23.5% off instead of 25%. The function's comment does not "say otherwise". Fix: compute both discounts against `subtotalCents`, or document the compounding explicitly.
5. **[should-fix · high]** `test/` — the branch adds no tests for any of the four claimed behaviors (`batchTotal`, `pageWindow`, `releaseBatch`, completion hooks); the passing suite covers only untouched base functions. A one-line window-length test would have caught finding 1. Fix: add tests asserting each claimed mechanism.

**Advisory nits:**
- `src/pricing.js:21` hardcodes the threshold `10` while `src/batch.js:8` exports `BATCH_MIN_QTY = 10` — two sources of truth; drift would silently split batch gating from batch discounting.
- `src/pricing.js:28-32` `addFeeRate` is uncalled and its "Register a fee rate" comment misleads — it returns a new array rather than registering anywhere. Same scope-creep class as `format.js`, but harmless.

**Open questions:**
- `src/batch.js:12-13` — the review window (`audit`) is computed but never returned or emitted. Is the window meant to surface to a reviewer (return value/event payload), or is `pageWindow` only for a future caller?
- `src/batch.js:16` — `releaseBatch` increments stock for every sku on every qualifying batch, including skus never reserved (`stock.js` has no cap). Is the batch flow a restock/return path by design? The stated intent doesn't settle it.

**Verdict:** blocker 1 · should-fix 4 · nit 2 → **BLOCK**

Not ready to merge: the lint gate fails outright, the claimed review-window mechanism is off by one, and none of the four claimed behaviors has a test. Verify each finding independently before fixing.
