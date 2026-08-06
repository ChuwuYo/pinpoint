# Review report

**Scope:** `main...feat/remote-sync` (merge-base `5ed1cd0` → `7384b7a`), 2 new files, +20 lines. **Packet gaps:** no external issue/spec — intent reconstructed from the task statement and commit message (`feat(sync): remote inventory sync envelope`); no repo rules files (no AGENTS.md/README/lint config); no linter, formatter, or type checker configured. Single-reviewer review (diff is one-pass size; axes run locally, not via subagents).

**What holds up:**
- Conventions match the codebase exactly: `'use strict'`, CommonJS exports, plain functions, `node:test` + `assert/strict` (src/sync.js:1–10 vs src/inventory.js:1,18; test/sync.test.js:1–6 vs test/inventory.test.js:1–7).
- Missing-URL failure is explicit and throws a clear error (src/sync.js:4–6).
- The env gate works as claimed in both directions, verified: `npm test` without the env var → sync test SKIP, 4 pass/0 fail; with `INVENTORY_SYNC_URL` set → 5 pass/0 skipped.
- Zero blast radius on existing code: diff touches no existing file, and nothing outside the new test requires `sync.js`.

**Static checks:** Only configured check is `npm test` (`node --test`) — passes in both env configurations. No lint/format/typecheck output to subtract.

**Findings:**
1. [should-fix · high] test/sync.test.js:8 — the only test of the new module is skipped whenever `INVENTORY_SYNC_URL` is unset, which is the default `npm test` environment (verified: SKIP). The claimed mechanism ("sync builds a request envelope") is therefore unverified in CI/dev runs, and if `syncRemote` were broken the default suite would still pass. The test needs no real remote — it only needs *some* URL. Fix direction: pass the URL explicitly (`syncRemote(payload, 'https://example.test/sync')`) or set `process.env.INVENTORY_SYNC_URL` inside the test, and drop the skip gate; while there, strengthen the assertion (test/sync.test.js:10) to check `result.url` and the exact byte count, and add a case for the throw path at src/sync.js:4–6.
2. [should-fix · medium] src/sync.js:7 — `bytes: JSON.stringify(payload).length` counts UTF-16 code units, not bytes. For a request-envelope field named `bytes` (Content-Length semantics), non-ASCII payloads (e.g. accented product names) report a wrong count — `'é'` is 1 code unit but 2 UTF-8 octets. No consumer exists yet, so blast radius is latent but it sits inside the exact contract being added. Fix direction: `Buffer.byteLength(JSON.stringify(payload), 'utf8')`.

**Open questions:** Whether `syncRemote` is intended to perform network I/O later — the intent says "envelope", so building only the envelope is in scope as stated, but callers currently have no path that sends anything.

**Verdict:** blocker 0 · should-fix 2 · nit 0 → **FIX-THEN-COMMIT** — not ready to merge as-is; ungate/strengthen the test and fix the byte count first. Findings are hypotheses; verify each independently before acting.
