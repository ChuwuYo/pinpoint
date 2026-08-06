# Review report

Scope: `main...fix/export-total` (merge-base `e78a057`, head `5c1df06`)   Packet gaps: no external issue/spec beyond the stated intent ("exported CSV reports showed stale row totals after a locale change"); no tests, no reproduction evidence, no CI config in the repo. Single-reviewer review (diff small enough for one pass; no subagents spawned).

What holds up:
- For the exact reported path — locale changes, then `getReport`/`exportReport` is called again — the cache now rebuilds, because the stored build-time locale no longer matches (`src/export.js:18-22`). Verified by reading the hunk: `cache = { locale: settings.locale, report: buildReport(...) }` snapshots locale at build time, so a later `applySettings({locale})` misses the cache.
- `getReport`'s external contract (returns the CSV string) is preserved; the cache shape change is module-private.
- CONTRIBUTING.md contracts untouched: `csv.js` single-line cells and `notify.js` fire-and-forget webhook are not modified.

Static checks: `npx eslint src/` **fails on this branch** — `eqeqeq` error at `src/export.js:18` (`==` instead of `===`) and `no-unused-vars` error at `src/export.js:19` (`const DEBUG = false;`). Both are tooling-enforced, so subtracted from findings — but note the branch does not currently pass its own configured lint.

Findings:
1. [blocker · high] `src/export.js:18-21` — the cache key captures only `locale`, but `buildReport` output also depends on `lines` (the row data, `export.js:12`) and `settings.currency` (`export.js:13`). Calling `getReport`/`exportReport` with new data, or after `applySettings({currency: 'EUR'})` with an unchanged locale, still returns the stale cached report — the same stale-row-totals defect class this branch claims to fix, still reachable through the supported path. Fix direction: key the cache on every report input (lines identity/content, locale, currency), or drop the memoization and rebuild per call.
2. [should-fix · high] `src/settings.js:14-19` — scope creep: the intent is cache invalidation, but the branch adds a new public `setLocale` API with a hardcoded `SUPPORTED_LOCALES` allowlist that throws `RangeError` for locales `Intl.NumberFormat` fully supports (e.g. `'fr-FR'`), while `applySettings` remains exported as an unvalidated bypass, so the validation is both arbitrary and non-binding. Fix direction: drop it from this branch, or justify it separately and make it the only locale-mutation path.
3. [should-fix · high] repo-wide — no test exercises the claimed mechanism; nothing would fail if locale-change invalidation regressed (no test files, no `test` script in `package.json`). Fix direction: add a minimal test that builds a report, changes locale via the settings path, and asserts the rebuilt totals.

Re-rank gate: finding 1 — correctness 9 (verified against `buildReport`'s actual inputs), actionability 9; finding 2 — correctness 8 (verified against the diff and `Intl` behavior), actionability 8; finding 3 — correctness 8 (verified: no test harness exists), actionability 6. None dropped.

Open questions: whether the module-level cache itself is still wanted at all (the fix keeps the pre-existing memoization pattern rather than questioning it) — the intent does not settle this, so it stays a question, not a finding.

Verdict: blocker 1 · should-fix 2 · nit 0 → BLOCK
