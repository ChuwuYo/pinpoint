# Review report

**Scope:** `main...fix/export-total` (merge-base `e78a057`, head `5c1df06`; 2 files, +12/−4) · **Packet gaps:** no external issue/spec text — intent reconstructed from the task statement and commit message (`fix(export): invalidate report cache on locale change`); no tests or test script exist in the repo; no reproduction/validation evidence was provided with the change.

**What holds up:**
- Root cause and ownership are correct: the stale totals came from the unkeyed module-level cache in `getReport`, and the fix keys that cache at the same boundary (`src/export.js:18-21`) — no wrong-boundary fix.
- The reported bug's exact path is fixed: the cache records `locale` at build time and rebuilds when `settings.locale` changes (`src/export.js:18-21`), and `setLocale` routes through `applySettings`, so locale changes reach the key.
- Repo contracts in CONTRIBUTING.md are respected: `csv.js` (single-line cells) and `notify.js` (fire-and-forget) are untouched.
- Blast radius is contained: `cache` is module-local and only `getReport` reads/writes it; `exportReport` is the sole internal caller (grep-verified).

**Static checks (subtracted from findings):** `npx eslint src/` **fails on this branch** with 2 errors, both introduced by this diff: `eqeqeq` at `src/export.js:18` (`cache.locale == settings.locale`) and `no-unused-vars` at `src/export.js:19` (`const DEBUG = false;`, a debug leftover). Configured tooling enforces these — they must be fixed before merge but are not counted as review findings.

**Findings:**
1. **[blocker · high] src/export.js:18** — the cache key includes only `locale`, but `buildReport` also formats totals with `settings.currency` (`src/format.js:3`). Calling the exported `applySettings({ currency: 'EUR' })` with the locale unchanged yields a cache hit and returns totals formatted in the old currency — the same stale-totals defect class this change claims to fix, still reachable through a supported path. **Fix:** include every settings field the report depends on (at minimum `currency`) in the cache key, or version the cache on a settings snapshot.
2. **[should-fix · medium] src/settings.js:14-19** — `setLocale` is new public API with no callers in the repo and no basis in the stated intent (scope creep), and its 4-locale whitelist is an inconsistent validation boundary: `applySettings({ locale })` remains unvalidated, so the restriction neither protects the cache fix nor applies uniformly, while arbitrarily rejecting valid locales (e.g. `fr-FR`) for any future adopter. **Fix:** drop `setLocale` from this branch, or move validation into `applySettings` with justification.
3. **[should-fix · medium] src/export.js:18-21** — no validation evidence backs the claimed fix: no test, no repro script, and the repo's packet contains nothing demonstrating that a locale change now produces fresh totals. Cache-invalidation fixes are exactly the kind that silently regress. **Fix:** add a minimal reproduction (build report → change locale → rebuild → assert totals differ) even if the repo currently lacks test infrastructure.

**Open questions:** the cache also ignores the `lines` argument (`src/export.js:18`), so different line sets under the same settings return the previous report. This predates the branch and the intent doesn't cover it — is the cache contract intended to be "one report per settings," or should `lines` identity factor in?

**Verdict:** blocker 1 · should-fix 2 · nit 0 → **BLOCK** (lint failure independently blocks merge). Findings are hypotheses — verify each independently before acting; the blocker is confirmed by code reading but should be reproduced at runtime before the fix is widened.
