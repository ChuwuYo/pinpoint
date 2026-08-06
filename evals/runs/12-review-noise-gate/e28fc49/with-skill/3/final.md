# Review report

Scope: `main..fix/export-total` (e78a057..5c1df06, diff of src/export.js + src/settings.js, 12 ins / 4 del) · single-reviewer review (no subagents available) · read-only verified: working tree identical before/after
Packet gaps: no external issue text beyond the one-line bug report as relayed ("exported CSV reports showed stale row totals after a locale change"); no tests or validation artifacts ship with the branch.

What holds up:
- The reported defect is fixed on its stated path, verified by execution: after `applySettings({ locale: 'de-DE' })`, `exportReport` rebuilds and emits `123,45 $` instead of the stale `$123.45` (src/export.js:18–21).
- The cache stays module-private (`let cache`, src/export.js:7); `getReport`/`exportReport` still return plain strings, so the public surface and callers are unchanged.
- CONTRIBUTING.md contracts are untouched: csv.js single-line cells and notify.js fire-and-forget webhook are not modified by the diff.
- Commit message follows the repo's Conventional Commits rule.

Static checks: eslint (the repo's configured gate: `eqeqeq`, `no-unused-vars`) **fails on this branch, exit 1** — src/export.js:18 uses `==` instead of `===`, and src/export.js:19 declares an unused `const DEBUG = false`. Per workflow these two defects are subtracted from the findings below, but the branch does not pass its own lint gate and cannot merge as-is.

Findings:
1. [blocker · high] src/export.js:18,20 — the cache key stores/compares only `settings.locale`, but `buildReport` also formats with `settings.currency` (src/export.js:12). Reproduced: after `applySettings({ currency: 'EUR' })` with locale unchanged, `exportReport` still returns the cached `123,45 $` instead of `123,45 €`. This is the same defect class the change claims to fix (stale totals after a settings change), still reachable through the exported, supported `applySettings({ currency })` path — the fix's claim is contradicted for that path. Fix direction: key the cache on every formatting input it consumes (at minimum `{ locale, currency }`), or drop memoization.
2. [should-fix · medium] src/settings.js:14–19 — `setLocale` is new exported API the reported bug never asked for (scope creep), and it creates two divergent locale-setting paths: `setLocale` rejects any locale outside a 4-entry allowlist (e.g. `fr-FR`, which `Intl.NumberFormat` formats fine), while `applySettings({ locale })` accepts anything and bypasses validation. Nothing in the repo calls `setLocale`. Fix direction: remove it from this fix, or make it the single validated path and justify the allowlist.
3. [should-fix · medium] branch ships no regression test or reproduction artifact for the claimed mechanism; the repo has no test harness, so the stale-cache bug class (including finding 1) has nothing to catch a recurrence. Fix direction: add a minimal `node:test` case asserting that changing `locale` **and** `currency` each force a rebuild.

Open questions: the cache also ignores the `lines` argument entirely — calling `getReport` with a changed dataset and unchanged settings returns a fully stale report. This predates the branch (identical on `main`), so it is not a diff finding, but whether `getReport` is intended to memoize per-dataset is a design question the stated intent cannot settle.

Verdict: blocker 1 · should-fix 2 · nit 0 → **BLOCK** — not ready to merge: the currency path still serves stale totals (reproduced), and the branch fails its configured eslint gate. Findings are hypotheses; verify each independently before fixing.
