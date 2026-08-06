## Review report

**Scope:** `7a825e9..b44d413` (merge-base of `main`..`feat/bulk-discount`) — 4 files: `src/pricing.js`, `src/report.js`, `test/pricing.test.js` (new), `test/report.test.js` (new); 54 insertions, 6 deletions.
**Mode:** standalone, single-reviewer (diff is small enough for one pass — 4 files, all read in full). Read-only confirmed: working tree clean before and after.

**Packet gaps:** none material. Stated intent taken unedited from the request ("adds a bulk discount with tests") plus the branch's own claim from commit `b44d413`: "feat(pricing): bulk discount at ten units, applied in daily summaries". No external spec exists; the discount **rate** (5%) is pinned only by the code, not by any stated requirement.

**Gate status:** PASS — configured gate `node --test` (package.json:6): 9/9 tests pass, exit 0, including all 5 new tests.

**What holds up:**
- Intent is fully covered: bulk discount at ≥10 total units (`src/pricing.js:18-23`), applied in `dailySummary` (`src/report.js:11`), with tests for both layers. No scope creep.
- `totalPrice` behavior is preserved: the pre-change reduce body was extracted verbatim into `totalCents` (`src/pricing.js:7-12`) and the pre-existing test `total rounds half up` (test/inventory.test.js:19-22) still passes — blast radius on the legacy path is nil.
- Tests pin the mechanism, not the implementation: threshold-at-10, no-discount-below-10, and cross-line quantity aggregation (test/pricing.test.js:7-23) would each fail if the threshold, rate, or aggregation were broken. The report tests pin the exact output string (test/report.test.js:9,14).
- Style follows the existing module conventions (CommonJS, `'use strict'`, reuse of `roundHalfUp`, additive exports).

**Static checks:** only `node --test` is configured (no linter, formatter, or type checker in the repo). Gate passes; nothing further enforced to subtract.

**Findings:** no material issues.

**Advisory nits:**
1. [nit · medium] test/pricing.test.js — no test produces fractional post-discount cents (all cases: 2000×0.95=1900, exact) — a regression dropping `roundHalfUp` on the discounted path would pass the gate; add one odd-cent case (e.g., 10 × 105¢ → 997.5 → USD 9.98).

**Open questions:**
1. The 5% rate appears nowhere in the stated intent or commit message — confirm 5% (not another rate) is the intended bulk discount.
2. Bulk discount stacks multiplicatively with per-line `discount` (src/pricing.js:9,21) — no requirement states whether that interaction is intended.

**Verdict:** blocker 0 · should-fix 0 · nit 0 → **CLEAR** — ready to merge, subject to confirming the 5% rate in open question 1.
