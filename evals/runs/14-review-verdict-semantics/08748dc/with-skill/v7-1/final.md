# Review report

Scope: `main...docs/contributing-guide` (`6047b52..e2fa085`) — one new file, `CONTRIBUTING.md`, 5 insertions, no other changes. Packet gaps: none. (No AGENTS.md/CLAUDE.md/repo rule files exist; rules are the guide's own claims. Single-reviewer review — diff is one pass, no subagents spawned.)

What holds up:
- Scope matches intent exactly: branch claims "adds a contributing guide (docs only)"; the diff is exclusively `CONTRIBUTING.md` — zero runtime blast radius.
- "Keep modules dependency-free; Node built-ins only" — verified: `package.json` declares no dependencies; every `require` in `src/*.js` and `test/*.js` is relative or `node:test`/`node:assert` (grep of all 11 import sites).
- "Commit messages follow Conventional Commits" — verified against history: `feat: inventory service`, `docs: add contributing guide` both conform.
- "`npm test` before committing" — the script exists (`node --test`, package.json:6) and runs.

Static checks: no linter/formatter/typechecker configured; only `npm test`. Ran it: 4 pass, 1 fail (`legacy currency format`, test/legacy-currency.test.js:10). The failing file is byte-identical on `main` (verified via `git show main:test/legacy-currency.test.js`), and its own comment marks it a separately-tracked legacy TODO — **pre-existing, not introduced by this branch**. Subtracted from findings as a branch-caused issue.

Findings:
1. [should-fix · high] CONTRIBUTING.md:4 — the guide elevates `npm test` to a documented pre-commit gate while the suite is red on `main` — a new contributor following the guide will hit the known-failing legacy test and cannot tell whether they broke something — fix direction: add one line noting the known-failing `legacy-currency` test (tracked separately), or land this after that test is resolved. Evidence: `npm test` output above; failure reproduces on `main` independently of this diff.

Open questions: none — the legacy failure is documented in-repo as intentional, so it is not a defect this review can assign to the branch.

Verdict: blocker 0 · should-fix 1 · nit 0 → **FIX-THEN-COMMIT** (docs-only, no merge risk; the should-fix is a one-line addition to the guide, not a code change).
