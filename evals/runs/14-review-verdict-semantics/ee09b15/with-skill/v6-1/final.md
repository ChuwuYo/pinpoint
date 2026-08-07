## Review report

**Scope:** `7a825e9..feat/remote-sync` (merge-base of `main`..`feat/remote-sync`, single commit `215072c`, 2 new files, +20 lines: `src/sync.js`, `test/sync.test.js`)
**Mode:** read-only, single-reviewer (diff small enough for one pass; no subagents spawned). Working tree verified clean before and after (`git status --porcelain` empty).
**Packet gaps:** No external issue/spec exists; intent taken from the user-stated "adds a remote sync envelope with an env-gated test" plus the commit message `feat(sync): remote inventory sync envelope`. No PR description available.

**Gate status:** Configured gate `node --test` → exit 0 in both modes:
- Default env: 4 pass, 0 fail, **1 skipped** (`sync builds a request envelope` → SKIP)
- With `INVENTORY_SYNC_URL` set: 5 pass, 0 fail, 0 skipped

**What holds up:**
- Diff matches the stated intent exactly: an envelope builder (`src/sync.js:4-8` returning `{url, bytes}`) plus a test gated on the env var (`test/sync.test.js:8`). No scope creep — nothing beyond the two files.
- Follows repo conventions: `'use strict'`, CommonJS `module.exports`, `node:test` + `assert/strict` — identical shape to `src/inventory.js` and `test/inventory.test.js`.
- Zero blast radius on existing code: no existing file modified; `syncRemote` has no callers anywhere in the tree.
- Env read as a default parameter (`src/sync.js:3`), so it's re-evaluated per call — no stale-env capture.

**Static checks:** Repo configures no linter, formatter, or type checker — only the `node --test` gate. Nothing to subtract.

**Findings:**
1. **[should-fix · high]** `test/sync.test.js:8` — the new module's only test is skipped under the repo's configured gate. Verified: plain `node --test` reports `﹣ sync builds a request envelope # SKIP`. Worse, the skip is unnecessary: `syncRemote` accepts `url` as an explicit parameter and performs no network I/O, so the test could call `syncRemote(payload, 'https://example.test')` and run unconditionally. As merged, the claimed mechanism has zero coverage in CI, and the one behavior that *is* reachable in the default environment — the throw when the URL is missing (`src/sync.js:5`) — is untested. Fix direction: drop the env gate and pass the URL explicitly; add an always-on test asserting the throw for the missing-URL path.
2. **[nit · medium]** `src/sync.js:7` — `bytes: JSON.stringify(payload).length` counts UTF-16 code units, not bytes; `JSON.stringify` does not escape non-ASCII, so a payload like `{name:'商品'}` undercounts UTF-8 length 3× per character. If `bytes` ever feeds a Content-Length or size budget, it misreports for internationalized item names (this service validates string item names in `src/validate.js:4`). No consumer exists yet, hence nit. Fix direction: `Buffer.byteLength(JSON.stringify(payload))`, or rename the field.

**Advisory nits:** Finding 2 above is the only nit; nothing else had concrete impact.

**Open questions:**
- Is `{url, bytes}` the complete intended scope of "remote sync," or is actual transmission a follow-up? The name `syncRemote` implies performing a sync the function does not do.
- Is CI expected to export `INVENTORY_SYNC_URL`, or should the gate exercise this test unconditionally? (Related to finding 1, but the intended operating mode is the owner's call.)

**Verdict:** blocker 0 · should-fix 1 · nit 1 → **FIX-THEN-COMMIT** — not ready to merge as-is; the should-fix test-coverage gap on the claimed mechanism should be closed first (small, mechanical change). Findings are hypotheses; verify each independently before acting.
