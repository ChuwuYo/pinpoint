## Review report

Scope: `0dd10b6..0b53482` (merge-base of `main..fix/export-total`, diff of `src/export.js`, `src/settings.js`)
Mode: single-reviewer local review (diff is ~15 lines across 2 files — one pass covers all axes; no subagents spawned). Read-only verified: repo state identical before/after (`git status --porcelain` empty).
Packet gaps: no external issue/spec beyond the one-line bug description in the prompt; the branch ships no reproduction script or test evidence — all validation evidence below is my own runtime reproduction. Intent source quoted: *"exported CSV reports showed stale row totals after a locale change"*; commit claim: *"fix(export): invalidate report cache on locale change"*.

Gate status: **FAILING** — the repo's only configured gate (`npx eslint src/`, rules `eqeqeq` + `no-unused-vars` as errors) fails on the branch with 2 errors in `src/export.js`. No test/build/typecheck/formatter scripts exist in `package.json`. The failing gate alone blocks merge.

What holds up:
- The locale mechanism is verifiably fixed: runtime repro `en-US → de-DE → ja-JP` produces correctly re-formatted totals (`$1,234.56` → `1.234,56 $` → `￥1,235`) from the same cached module — the reported symptom is gone.
- Both CONTRIBUTING.md contracts intact: `csv.js` (single-line cells) and `notify.js` (fire-and-forget webhook) untouched by the diff.
- Blast radius contained: `cache` is module-local to `src/export.js:7`, only `getReport` touches it, and `getReport`/`exportReport` signatures are unchanged. Nothing else in `src/` requires these modules.
- Commit message follows the Conventional Commits rule in CONTRIBUTING.md.

Static checks (subtracted from findings — enforced by configured tooling): `src/export.js:18` `eqeqeq` (`cache.locale == settings.locale` uses `==`); `src/export.js:19` `no-unused-vars` (`const DEBUG = false;` is dead leftover). Both must be fixed for the gate to pass but are not listed as findings.

Findings:
1. [should-fix · high] `src/export.js:18` — the new cache key captures only `locale`, but `buildReport` (`src/export.js:12`) also depends on `settings.currency`. Runtime-verified: after a cached export, `applySettings({ currency: 'EUR' })` with unchanged locale returns the stale `$1,234.56` report — the exact reported symptom ("stale row totals") via a sibling trigger. The root cause (cache key doesn't capture report inputs) is only half-closed. Fix direction: key the cache on `{ locale, currency }` (or on the settings snapshot).
2. [should-fix · high] repo-wide — a defect fix for a caching regression ships with zero regression coverage: no test file, no test script in `package.json`. The claimed mechanism (invalidate on locale change) works today only by manual verification; nothing fails if it breaks tomorrow. Fix direction: add a minimal test (e.g. `node:test`) that exports, changes locale, re-exports, and asserts the total string changes.
3. [should-fix · medium] `src/settings.js:14-19` — `setLocale`/`SUPPORTED_LOCALES` is behavior the intent never asked for (scope creep), and it creates two divergent locale-change paths: validated `setLocale` and unvalidated `applySettings` — the latter remains exported, is the path the bug came through, and is what `exportReport` consumers actually use. Nothing routes callers through the new validation. Fix direction: either drop `setLocale` from this branch, or make it the single validated path (have `applySettings` enforce the locale whitelist).

Advisory nits: none surviving — the two style items (`==`, dead `DEBUG`) are already enforced by the configured ESLint gate and were subtracted per the noise budget.

Open questions (not promoted to findings):
- The cache also ignores the `lines` input entirely — `getReport(linesA)` then `getReport(linesB)` returns linesA's report. This was equally true at base, so the intent can't settle whether it's accepted design or the same defect class on the data axis. Worth a decision while the cache key is being redesigned.

Verdict: blocker 0 · should-fix 3 · nit 0 → **FIX-THEN-COMMIT**

Not ready to merge. Independently of the findings, the configured ESLint gate fails on the branch (`src/export.js:18-19`) and must pass first; then close the currency half of the cache key and add a regression test. Findings are hypotheses — verify each independently before acting.
