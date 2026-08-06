# Review report
Scope: main..chore/order-errors (1 commit, +17/-0, new file `src/orders.js`)   Packet gaps: no external issue/spec — intent reconstructed from branch name, commit message ("tolerate writer failures when saving orders"), and the task statement. Single-reviewer review (17-line diff, one pass; no subagents spawned). Read-only confirmed: working tree clean before and after.

What holds up:
- The core claim works: a throwing writer is caught and reported as `{ ok: true, saved: false }` — verified by executing `saveOrder` with `write() { throw new Error('disk full') }`, which returned `{"ok":true,"saved":false}` without propagating.
- The writer contract (synchronous only, async writers out of scope) is documented in-file at `src/orders.js:3-4`, pre-empting the "rejected promises escape the try/catch" challenge.
- Zero blast radius to existing code: the module is new and nothing requires it; all 4 pre-existing tests still pass.

Static checks: only `npm test` (`node --test`) is configured — no linter, formatter, or type checker exists. It passes but exercises none of the new module, so nothing was subtracted from review scope.

Findings:
1. [should-fix · high] `src/orders.js:9` — `JSON.stringify(order)` is inside the `try`, so serialization failures are swallowed and misreported as writer failures. Verified: a circular order returns `{"ok":true,"saved":false}` and logs "order write failed, continuing Converting circular structure to JSON". A caller-input bug is indistinguishable from a tolerated disk failure and the order is silently dropped — the opposite of the observability this module exists to provide. Fix: serialize before the `try`, or catch serialization separately and return/throw a distinct failure.
2. [should-fix · high] `test/` — no test covers the new module or its claimed mechanism. `npm test` passes (4/4) without ever loading `src/orders.js`; the tolerance behavior, the `saved` flag, and the sync-writer contract are all unverified by the suite. A test imitating the mechanism (throwing writer → `saved:false`, no throw; successful writer → `saved:true`, payload is the stringified order) would fail if the code were broken — none exists. Fix: add `test/orders.test.js`.
3. [should-fix · medium] `src/orders.js:13` — failure returns `ok: true`, diverging from the repo's only other result shape (`validate.js:10` returns `{ ok: false, reason }` on failure). The file documents the writer contract but not the result contract, so a caller pattern-matching on `ok` will treat an unsaved order as successful. Fix: document the `{ ok, saved }` semantics, or use `ok: false` + a distinguishable reason for write failures.
4. [nit · high] `src/orders.js:12` — `error.message` is `undefined` for non-Error throws (verified: `throw 'weird'` logs "order write failed, continuing undefined"), degrading the diagnostic this log line exists for. Fix: log the error object itself.

Open questions: Is an unsaved (`saved: false`) order expected to be retried or queued downstream? The intent is silent and no caller exists yet. Is the `ok: true`-on-failure shape deliberate API design (intent could settle this; flagged as finding 3 only because it clashes with repo convention)?

Verdict: blocker 0 · should-fix 3 · nit 1 → FIX-THEN-COMMIT
