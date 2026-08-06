## Review report

Scope: main..feat/batch-discounts (594a0a8) · Packet gaps: none — base resolves, diff non-empty; intent taken from the user prompt only (no issue/spec exists); repo rules = the pricing conventions documented in src/pricing.js:3-6 plus eslint.config.mjs. Subagents unavailable — axes run sequentially by a single reviewer.

What holds up (verified by execution):
- `onBatchComplete` is a correct thin delegate over `on` (src/events.js:11-13); `emit` tolerates unregistered events via `?? []` (src/events.js:16); external listeners received every payload (fired 3/3 runs).
- `releaseBatch` restores +1 per sku and tolerates unknown skus via `?? 0` (src/stock.js:16-20; verified 5→8 over three runs). Its loop cannot partially fail on `Map.set`.
- `pageCount` implements ceiling division correctly (src/pager.js:14-16; pageCount(10,5)=2).
- `batchTotal` still rounds once at the end (single `Math.round`, src/pricing.js:22,24), honoring that half of the pricing convention.
- `runBatch` returns `null` below the 10-unit minimum and emits `{count, total}` otherwise (verified).

Static checks (subtracted): `npm test` passes — 2 pre-existing tests only, none covering the diff. `npx eslint .` **fails because of the diff**: src/batch.js:13:9 `no-unused-vars` (`auditCopy`) and src/batch.js:15:19 `eqeqeq` (`==`). Findings on those two lines are subtracted as tooling-enforced, but the failing lint gate itself feeds the verdict.

Findings:
1. [blocker · high] src/pager.js:11 — `pageWindow` slices `start + size - 1`, dropping the last row of every page; verified: for 10 items at size 5, pages 0-1 return [1-4],[6-9], so item 10 is unreachable through any page while `pageCount` promises 2 pages — a reviewer can never see the final row of a batch, contradicting the claimed "paged batch review windows" — fix: `list.slice(start, start + size)` (match `paginate`).
2. [blocker · high] src/pricing.js:20-22 — the quantity discount multiplies the already-member-discounted price, but the file's own documented convention (src/pricing.js:3-6, pre-existing on main) requires discounts to multiply the ORIGINAL subtotal; verified: batchTotal(10000, 10, 0.10) = 7650 vs 7500 per the convention — every qualifying batch is overcharged (150¢ per 10000¢+10% member), a reachable wrong-money defect in the claimed "batch totals" feature — fix: compute both discounts against the original subtotal, or explicitly document the exception in the function's comment per the convention's escape hatch.
3. [should-fix · high] src/format.js:10-12 — `renderLabel` compiles caller templates with `new Function`; verified it executes arbitrary JS (`globalThis` mutated from a template string) — an eval sink exported into the service, and the entire file (plus `addFeeRate`, src/pricing.js:28-32) is scope creep: the stated intent asks only for batch totals, review windows, stock release, and completion hooks, none of which need label rendering or fee rates — fix: delete both until the labels/fees features land; never evaluate templates.
4. [should-fix · high] test/core.test.js (unchanged in diff) — zero tests for any claimed mechanism: `batchTotal` discount math, `pageWindow` paging, `releaseBatch`, completion hooks — the two passing tests predate the branch, so the off-by-one in finding 1 and the convention violation in finding 2 both slipped through — fix: add mechanism tests (page edges, discount composition against the documented convention, hook payload).
5. [should-fix · medium] src/batch.js:14 — `runBatch` registers a new no-op identity listener on every call, so `batchComplete` listeners accumulate unboundedly per run and the producer registers its own hook instead of leaving registration to downstream consumers — bounded but real leak and inverted hook semantics — fix: remove the internal `onBatchComplete` call; let consumers register at module scope.
6. [nit · medium] src/pricing.js:28-32 — `addFeeRate` claims to "register a fee rate for the pricing engine" but only returns a copied array; `config` is unchanged (verified) and no fee machinery exists to consume rates — dead, misleading API surface — fix: drop it with format.js or wire it into a real fee path when that feature lands.

Re-rank gate (correctness/actionability, 0-10): F1 10/9 keep · F2 9/8 keep · F3 9/8 keep · F4 10/8 keep · F5 8/7 keep · F6 8/7 keep. Dropped candidates: (a) partial-mutation ordering in `runBatch` (stock released before `emit`) — reachable only via a throwing listener, none exists in-repo; hypothetical outside the diff, dropped at aggregation (would score ~3 on correctness); (b) `pageCount(total, 0)` → Infinity — no caller passes size 0, speculative; (c) redundant `== 10 || > 10` condition — no concrete behavioral impact, and the `==` half is already eslint-enforced; (d) `money()` unused — no standalone concrete impact, folded into F3's scope note.

Open questions:
- src/batch.js:12-13 computes the review window (`audit`) and discards it — is the review window meant to gate batch completion (approval step) or is it purely for an external UI? If gating is intended, the current code completes every qualifying batch unreviewed.
- Is multiplicative stacking of member × quantity discounts actually the desired business rule? If yes, the convention comment and function doc must say so; as written the code contradicts the module's documented rule.
- Will `renderLabel` templates ever be user-supplied? That determines whether F3 is a latent RCE or merely dead weight.

Verdict: blocker 2 · should-fix 3 · nit 1 → BLOCK (two verified blockers stand, and the configured eslint gate fails on the new file). Working tree confirmed clean after review; no files mutated.
