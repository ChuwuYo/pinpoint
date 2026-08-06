# Review report

Scope: main (8133bc2)..chore/order-errors (fff03c9), one commit, `src/orders.js` +17 (new file) · Packet gaps: no external issue/spec — intent reconstructed from the user task and commit message ("tolerate writer failures when saving orders"); claims taken from the commit message and the module's own contract comment (sync writers only). Single-reviewer review (diff is one small file; axes run sequentially). Read-only confirmed: `git status` clean before and after.

What holds up: the stated mechanism works within the documented contract — probed with a sync writer that throws: `saveOrder` caught it, logged, returned `{ ok: true, saved: false }`, and a succeeding writer returns `{ ok: true, saved: true }` (runtime probe, this session). Module style (`'use strict'`, CJS exports, plain functions) matches `src/inventory.js`, `src/validate.js`. The sync-only writer contract is stated explicitly in the header comment (src/orders.js:3-4) rather than left implicit.

Static checks: only configured tooling is `npm test` (`node --test`) — 4/4 pass. No linter, formatter, or type checker configured; nothing further to subtract.

Findings:
  1. [should-fix · high] no test added — the branch's entire claimed mechanism (writer throws → tolerated, `saved: false`) is untested; `test/` contains only the pre-existing `inventory.test.js` and the diff adds none. A regression that deletes the try/catch would go green. Fix direction: add a `saveOrder` test with a throwing writer asserting `{ ok: true, saved: false }` and a succeeding writer asserting `saved: true`.
  2. [should-fix · medium] src/orders.js:9 — `JSON.stringify(order)` sits inside the try, so non-writer failures are misclassified as writer failures: probed with a circular order → logs "order write failed" and returns `saved: false` though the writer never ran; a null/undefined writer's TypeError is likewise swallowed as a tolerated "failure," masking caller bugs the intent never asked to tolerate. Fix direction: stringify before the try (let serialization errors propagate or return a distinct result), and/or validate the writer argument.
  3. [nit · medium] src/orders.js:13 — failure path returns `{ ok: true, saved: false }`, diverging from the established result convention `{ ok: false, reason }` in src/validate.js:5,9: a caller that checks `.ok` (the pattern this repo teaches) reads an unsaved order as success. Concrete impact: misuse risk for future callers; fix direction: return `ok: false` with a reason on the failure path, or document the inverted convention at the export.

Open questions: an async (promise-returning) writer escapes the catch entirely — probed: `saveOrder` returns `{ ok: true, saved: true }` and the rejection then crashes the process as an unhandled rejection. The header comment declares async writers "out of scope by design," so this is contract-honoring behavior; whether callers will honor an unenforced comment (no runtime guard, no type) is a design question the intent cannot settle, not a finding.

Verdict: blocker 0 · should-fix 2 · nit 1 → FIX-THEN-COMMIT

Not ready to merge as-is: add a test for the claimed tolerance mechanism and narrow the catch to actual writer failures first. Findings are hypotheses — verify each independently before acting.
