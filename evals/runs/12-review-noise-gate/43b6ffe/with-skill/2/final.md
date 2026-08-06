# Review report

Scope: `main (81015f4)..fix/export-total (844e685)` — 2 files, +12/−4   Packet gaps: no reproduction evidence or test results supplied with the branch (verified manually via inline `node -e`); no test suite exists in the repo to run; intent taken from the task statement ("exported CSV reports showed stale row totals after a locale change") and commit `844e685`. Single-reviewer review (parallel axis reviewers disclosed as unnecessary per the workflow: diff is 12 lines across 2 files — one pass covers it).

What holds up:
- The stated bug is genuinely fixed: `getReport` now keys the memo on `settings.locale` (src/export.js:18-21). Reproduced en-US → de-DE → en-US; each switch rebuilt the report with correct `Intl.NumberFormat` output (`"$1,234.56"` → `"1.234,56 $"` → `"$1,234.56"`).
- Repository contracts in CONTRIBUTING.md are untouched: csv.js single-line-cell normalization and notify.js fire-and-forget webhook are unchanged, and locale-formatted totals still flow through `row()` quoting correctly.

Static checks: `npx eslint src/` (configured: `eqeqeq`, `no-unused-vars` as errors) **fails on this branch, exit 1** — src/export.js:18 `==` instead of `===`, src/export.js:19 `DEBUG` assigned but never used (leftover debug debris). `main` passes clean. These two violations are enforced by tooling, so they are subtracted from the findings list — but the branch does not pass its own configured linter and cannot merge as-is.

Findings:
  1. [should-fix · high] src/export.js:18-21 — the cache key covers only `locale`, not the other inputs to `buildReport` (`settings.currency` used at src/export.js:12, and `lines`). The same stale-total defect class remains reachable: after `applySettings({ currency: 'EUR' })`, `getReport` returns the stale USD-formatted `"$1,234.56"` instead of `"€1,234.56"` (reproduced). The commit claims cache invalidation on settings change but owns only one of the transitions. Fix: key the cache on all report inputs (locale + currency at minimum) or drop the memoization.
  2. [should-fix · high] src/settings.js:14-21 — `setLocale`/`SUPPORTED_LOCALES` is scope creep with zero callers (grep confirms only its definition and export). It also contradicts the established locale handling: src/format.js:4 passes any locale to `Intl.NumberFormat` (full CLDR support), while the new whitelist rejects valid locales — `setLocale('fr-FR')` throws `RangeError` though `Intl` formats fr-FR fine. And it guards nothing, since `applySettings` remains exported and unrestricted. Fix: drop `setLocale` and `SUPPORTED_LOCALES` from this bugfix branch.

Open questions: Is currency-change-without-locale-change a supported runtime path for this service? If yes, finding 1 is effectively the un-fixed half of the reported bug. (No regression test accompanies the fix; the repo has no test infrastructure, so this is noted rather than raised as a finding.)

Verdict: blocker 0 · should-fix 2 · nit 0 → **FIX-THEN-COMMIT** — not ready to merge: the branch fails its configured linter, leaves the identical staleness mechanism reachable via currency, and carries an uncalled locale-whitelist API that conflicts with the Intl-based architecture. Findings are hypotheses — verify each independently before acting.
