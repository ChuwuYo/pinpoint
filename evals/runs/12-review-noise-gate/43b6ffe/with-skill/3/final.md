# Review report

**Scope:** `main (d44f30a)..fix/export-total (1294a80)` — 2 files, +12/−4 · **Packet gaps:** the branch ships no validation evidence (no tests, no repro output in commits); intent taken from the task statement ("exported CSV reports showed stale row totals after a locale change"); the only change description is the commit subject `fix(export): invalidate report cache on locale change`.

**What holds up:**
- The fix addresses the stated bug at the right boundary: `getReport` now keys the cache by locale and rebuilds on change (src/export.js:18-21). Verified empirically: `getReport` → `applySettings({locale:'de-DE'})` → `getReport` outputs `123,45 $` instead of the stale `$123.45`.
- The cache shape change (string → `{locale, report}`) is safe: `cache` is module-local and `getReport` is its only reader (grep of src/ confirms).
- src/settings.js changes are additive; `applySettings` is untouched, so existing callers are unaffected. Commit message follows the Conventional Commits rule in CONTRIBUTING.md; the csv.js and notify.js contracts are untouched.

**Static checks:** configured ESLint (`eqeqeq`, `no-unused-vars`) **fails on the branch** — 2 errors, both in the new hunk: src/export.js:18 (`==` instead of `===`) and src/export.js:19 (`DEBUG` assigned but never used, leftover dead code). Subtracted from findings per workflow, but the branch does not pass its own lint gate.

**Findings:**
1. [should-fix · high] src/export.js:18 — cache key omits `settings.currency`, but `buildReport` consumes it (src/export.js:12). Reproduced: after `applySettings({currency:'EUR'})`, `getReport` still serves the USD-formatted report — the exact stale-totals defect class this branch fixes for locale. Fix direction: key the cache on both formatting inputs (e.g. `{locale, currency}`) or clear it in `applySettings`.
2. [should-fix · medium] repo-wide — no test covers the claimed mechanism; the repo has no test runner (package.json has no scripts) and the branch adds no regression test. A "build → change locale → rebuild" test would fail if the cache key were broken. Fix direction: add minimal test infra and a cache-invalidation test.
3. [should-fix · medium] src/settings.js:14-19 — `setLocale`/`SUPPORTED_LOCALES` is unrequested scope: nothing calls it (grep confirms), and it creates a second, divergent locale-setting path whose 4-locale allowlist rejects locales `Intl.NumberFormat` and `applySettings` happily accept (e.g. `fr-FR`). Fix direction: drop it, or fold validation into `applySettings` so there is one path.

**Open questions:** the report cache still ignores `lines` entirely — repeated exports with different input lines return the first report. Pre-existing behavior, possibly intentional, but worth confirming while cache semantics are being touched.

**Verdict:** blocker 0 · should-fix 3 · nit 0 → **FIX-THEN-COMMIT**. Not ready to merge as-is: the lint gate fails (src/export.js:18-19), and the currency staleness is a reachable instance of the very bug being fixed. Findings are hypotheses — verify independently before acting.
