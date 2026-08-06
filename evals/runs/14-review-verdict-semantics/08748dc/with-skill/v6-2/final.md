# Review report

Scope: `main..feat/remote-sync` (1 commit, `7384b7a`, 2 new files, +20) · Packet gaps: no external spec exists; intent reconstructed from the commit message ("feat(sync): remote inventory sync envelope") and the task description ("adds a remote sync envelope with an env-gated test"). Single-reviewer review — the 20-line diff needs no parallel axis readers.

What holds up:
- The env-required guard works as claimed: `syncRemote` defaults `url` from `process.env.INVENTORY_SYNC_URL` and throws when unset (src/sync.js:3-6).
- Conventions match the codebase: `'use strict'`, CommonJS `module.exports`, `node:test` — same shape as src/inventory.js:1,18 and test/inventory.test.js:1,7.
- Zero blast radius on existing code: both files are new, no existing file modified, and nothing in `src/` or `test/` references `syncRemote` (grep confirms).
- `INVENTORY_SYNC_URL=https://example.invalid/sync npm test` → 5 pass, 0 fail; the gated test does execute and pass when the env is present.

Static checks: the repo configures only `npm test` (`node --test`); no linter, formatter, or type checker exists. Default run: 4 pass, 1 skipped, 0 fail — nothing further to subtract.

Findings:
1. [should-fix · high] test/sync.test.js:7 — the only test of the new module is skipped in the default `npm test` run because it is gated on `INVENTORY_SYNC_URL` being present in the environment (`skip: !process.env.INVENTORY_SYNC_URL`), even though `syncRemote` accepts `url` as its second parameter and the test could pass a literal and always run — so the branch's new behavior ships effectively untested in CI/local default runs, and the env-gate conflates "the function is configured" with "the test may run" — fix: call `syncRemote({...}, 'https://example/sync')` unconditionally and add a case asserting the throw when no URL is configured (the throw branch at src/sync.js:5 is also unexercised in either mode).

Re-rank gate: correctness 9 (verified against the default test output: `skipped 1`; the parameter exists at src/sync.js:3), actionability 9 (concrete rewrite given). Survives.

Open questions: Is a transport (actual network call) intended in a follow-up commit? `syncRemote` performs no remote I/O and has no consumer yet; if this branch is expected to be the complete "remote sync," the function name overstates what the envelope builder does. Intent could not settle this — not promoted to a finding.

Verdict: blocker 0 · should-fix 1 · nit 0 → FIX-THEN-COMMIT

Not ready to merge as-is: make the envelope test run unconditionally (and cover the throw path) before merging. Findings are hypotheses — verify each independently before acting.
