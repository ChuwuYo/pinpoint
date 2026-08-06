# Review Report: `fix/export-total` vs `main`

## Scope
Diff touches `src/export.js` (cache invalidation) and `src/settings.js` (new `setLocale`). Bug claim: exported CSV showed stale row totals after a locale change.

## Verification performed
- Ran repo linter (`npx eslint src/`) — **fails, exit 1**.
- Ran a runtime repro: export → `setLocale('de-DE')` → export → `applySettings({currency:'EUR'})` → export → export with new input lines.

## What works
The reported bug is genuinely fixed: after a locale change, `cache.locale` mismatch triggers a rebuild (verified: `de-DE` export re-renders as `1.234,56 $` instead of stale `$1,234.56`). `setLocale` validation and the `RangeError` are reasonable. `csv.js`/`notify.js` contracts in CONTRIBUTING.md are untouched.

## Findings

**F1 — Blocker: lint failure, `eqeqeq`**
`src/export.js:18` — `if (cache && cache.locale == settings.locale)` uses `==`. `eslint.config.mjs:5` sets `eqeqeq: 'error'`; linter errors: `Expected '===' and instead saw '=='`.

**F2 — Blocker: lint failure, `no-unused-vars` + dead code**
`src/export.js:19` — `const DEBUG = false;` is never used. `eslint.config.mjs:6` sets `no-unused-vars: 'error'`; linter errors. Leftover scaffolding that shouldn't ship regardless.

**F3 — High: cache key is still incomplete; same stale-total bug class survives for currency**
`src/export.js:18,20` — the cache is keyed on `locale` only, but `buildReport` also depends on `settings.currency` (`src/export.js:12`) and on `lines`. Verified at runtime: after `applySettings({ currency: 'EUR' })` with locale unchanged, `exportReport` still returns `1.234,56 $` — the stale USD-formatted report. The fix patches the reported symptom (locale) but leaves an identical staleness path (currency). Additionally, calling `getReport`/`exportReport` with different `lines` and the same locale returns the old report (verified: new input returned previous output); this predates the branch, but the new keyed cache was the right place to address it and doesn't.

**F4 — Low: validation is bypassable**
`src/settings.js:16-19` — `setLocale` guards against unsupported locales, but `applySettings` (`src/settings.js:8-12`) remains exported and accepts any `locale` string; a bogus value would make `Intl.NumberFormat` throw inside `buildReport`. Not introduced by this branch's intent, but the new API doesn't actually narrow the surface.

## Verdict
**Not ready to merge.** Two hard lint errors (F1, F2) must be fixed, and the cache key should include `currency` (and ideally the input data, or the cache should be invalidated on any settings change) to actually close the stale-total bug class (F3). F4 is advisory.
