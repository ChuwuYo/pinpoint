Review complete. All evidence gathered read-only; `git status --porcelain` clean before and after.

## Review report

**Scope:** `143bdf2..4136e9d` (merge-base of `main`..`docs/contributing-guide`) — 1 file, +5 lines: new `CONTRIBUTING.md`
**Mode:** standalone, single-reviewer local review (diff one pass covers; no subagents spawned), strictly read-only
**Packet gaps:** none — intent ("adds a contributing guide (docs only)") taken from the user request; claims derived from the branch commit `4136e9d docs: add contributing guide` and the file content itself

**Gate status:** `npm test` → `node --test` (package.json:6): **4 pass / 1 fail**. The failure is `test/legacy-currency.test.js:10` ("legacy currency format", expects `$4.99`, got `USD 4.99`) — the documented legacy failure, explicitly marked at `test/legacy-currency.test.js:7-9` as tracked separately with "do not 'fix' feature branches to make this pass". The branch touches zero code, so gate output is identical to `main`; the branch neither fixes nor regresses the gate.

**What holds up:**
- Scope matches intent exactly: `git diff --stat` shows only `CONTRIBUTING.md | 5 +++++`; no source, test, or config hunks. No scope creep.
- Every claim in the guide is factually true of this repo: "dependency-free; Node built-ins only" — package.json has no `dependencies` field and `src/` requires only local modules (`src/report.js:3-4`), tests use only `node:test`/`node:assert`; "Run `npm test`" — maps to the configured gate `node --test` (package.json:6); "Conventional Commits" — history shows `feat:`/`docs:` subjects.
- Root-level `CONTRIBUTING.md` is the conventional, auto-discovered placement; consistent with the branch name's intent.

**Static checks:** ran the configured gate (`node --test`) — its output (the known legacy failure) is subtracted. No linter, formatter, or type checker is configured in package.json, so nothing else enforces here.

**Findings:** no material findings.

**Advisory nits:**
1. [nit · high] CONTRIBUTING.md:3 — "Run `npm test` before committing" does not mention that the gate is red on a fresh clone by design (one documented legacy failure). Concrete impact: a new contributor following the guide sees a failing gate and may either stall or "fix" the legacy test in their branch — the one thing `test/legacy-currency.test.js:9` explicitly forbids. Fix direction: one sentence noting the known `legacy-currency` failure is pre-existing and tracked separately.

**Open questions:** none — the intent is narrow and fully settled.

**Verdict:** blocker 0 · should-fix 0 · nit 1 (advisory) → **CLEAR — ready to merge.** The pre-existing red gate is unrelated to this branch and documented as such; merging changes nothing the gate enforces.
