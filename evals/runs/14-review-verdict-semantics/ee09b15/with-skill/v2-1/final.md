## Review report

**Scope:** `7a825e9..c1f450c` (merge-base of `main`..`chore/order-errors`) — one file, `src/orders.js` +17 (new)
**Mode:** single-reviewer, local review (diff is one 17-line file; parallel axis reviewers not warranted)
**Packet gaps:** none material — intent taken from the user-stated variant ("makes order saving tolerate writer failures") and commit `c1f450c`; no external issue/spec exists.

**Gate status:** `node --test` → PASS (4/4, exit 0). Note: all 4 tests are pre-existing `test/inventory.test.js`; none touch the new module.

**What holds up:**
- Core intent delivered and empirically verified: a throwing synchronous writer yields `{ ok: true, saved: false }` and the process continues (`saveOrder({a:1},{write(){throw new Error('disk full')}})` → `{ok:true,saved:false}`).
- Scope discipline: async writers are explicitly disclaimed in the module contract comment (`src/orders.js:3-5`), so the known try/catch-can't-see-rejections limitation is documented, not hidden.
- Zero blast radius: new file, no callers anywhere in repo (grep confirms); nothing existing can regress.
- `'use strict'`, CommonJS exports, and code style match the established modules.

**Static checks:** only the test gate is configured (`package.json:6`); no linter, formatter, or type checker exists to subtract.

**Findings:**
1. [should-fix · high] `test/` — no test exercises the claimed mechanism. The entire branch behavior (writer throws → tolerated, `saved: false`) has zero coverage; deleting the try/catch would leave the gate green. Would the tests fail if the code were broken? No. Fix direction: add `test/orders.test.js` asserting both the throwing-writer path (`saved: false`, no propagation) and the success path (`saved: true`, payload is `JSON.stringify(order)`). Re-rank: correctness 10, actionability 9.
2. [should-fix · medium] `src/orders.js:9` — `JSON.stringify(order)` sits inside the try, so non-writer failures are misattributed and swallowed. Reproduced: a circular order logs `order write failed, continuing Converting circular structure to JSON` and returns `{ok:true,saved:false}`; `saveOrder({a:1}, undefined)` logs `order write failed … Cannot read properties of undefined` and returns `ok: true`. A deterministic data/programmer bug becomes indistinguishable from a writer outage in logs, and a missing writer (integration bug) is silently masked. Fix direction: hoist serialization above the try (let it throw), and/or rethrow TypeErrors so only genuine writer exceptions are tolerated. Re-rank: correctness 9, actionability 8.

**Advisory nits:**
- [nit · low] `src/orders.js:12` — a writer throwing a non-Error (legal JS) logs `undefined` (reproduced with `throw 'plain string'`). Log `error` itself or `String(error)` for diagnosability.

**Open questions:**
- Is `{ ok: true, saved: false }` the intended caller contract — i.e., `ok` means "handled gracefully", never "persisted"? No caller exists in-repo to settle it; if any future caller reads `ok` as "the order is safe", this shape is a footgun.
- The sync-only contract is documented, but unenforced: a promise-returning writer passed by mistake returns `saved: true` while the write fails later as an unhandled rejection. Acceptable to rely on the comment alone?

**Verdict:** blocker 0 · should-fix 2 · nit 1 → **FIX-THEN-COMMIT** — the mechanism works as intended for the documented contract, but merge should wait on a test for the claimed behavior and a decision on tolerating only writer errors versus everything.

Findings are hypotheses; verify each independently before acting.
