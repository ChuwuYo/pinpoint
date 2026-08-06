# Review Report: `fix/export-total` vs `main`

## Summary

The branch fixes the reported bug — stale row totals after a locale change — by keying the module-level report cache on `settings.locale`, and adds a validated `setLocale()` helper. The core mechanism works (verified at runtime: switching `en-US` → `de-DE` re-renders totals correctly). However, the branch fails the repo's own lint gate and leaves the same stale-cache bug class unfixed for currency changes.

## Findings

### 1. BLOCKER — Lint failure: loose equality (`eqeqeq`)
- **File:line:** `src/export.js:18`
- **Evidence:** `if (cache && cache.locale == settings.locale) return cache.report;`
- The repo's `eslint.config.mjs` sets `eqeqeq: 'error'`. Running `npx eslint src/` exits 1 with: `18:29 error Expected '===' and instead saw '=='`. Fix: use `===`.

### 2. BLOCKER — Lint failure: unused variable (`no-unused-vars`)
- **File:line:** `src/export.js:19`
- **Evidence:** `const DEBUG = false;` — declared but never referenced.
- `npx eslint src/` reports: `19:9 error 'DEBUG' is assigned a value but never used`. This is leftover debug scaffolding that must be removed.

### 3. MAJOR — Cache key omits `currency`; stale totals persist for currency changes
- **File:line:** `src/export.js:18-20` (cache keyed only on `locale`), interacting with `src/export.js:12` (`formatTotal(l.totalMinor, settings.locale, settings.currency)`) and `src/settings.js:10` (`applySettings` accepts `currency`).
- **Evidence (runtime reproduction):**
  ```
  applySettings({ currency: 'EUR' })   // locale unchanged
  getReport(lines, settings)           // → "1.234,56 $"  (stale; expected "1.234,56 €")
  ```
- The report output depends on both `locale` and `currency`, but only `locale` invalidates the cache. This is the identical bug class the branch was created to fix — a settings change that leaves exported totals stale. The cache key should include `settings.currency` (and arguably the fix should consider whether caching across differing `lines` inputs is acceptable at all, though that predates this branch).

### 4. MINOR — New `setLocale` API is reasonable but unused by the fix
- **File:line:** `src/settings.js:14-19`
- `setLocale` throws `RangeError` on unsupported locales and delegates to `applySettings` — behavior verified correct. However, nothing in the diff consumes it; the cache invalidation reads `settings.locale` directly regardless of how it was mutated (direct `applySettings` still works). Not a defect, but dead-weight surface area unless callers are expected to migrate.

## Checks Performed
- `git diff main...fix/export-total` — full diff reviewed (2 files).
- `npx eslint src/` — **fails** (2 errors, both introduced by this branch).
- Runtime probe of `getReport` across locale/currency changes and `setLocale` validation — locale fix confirmed working; currency staleness confirmed present.
- CONTRIBUTING.md contracts (CSV single-line cells, fire-and-forget webhook) — untouched by this diff; no violations.

## Merge Verdict

**NOT READY TO MERGE.**

Two lint errors (`src/export.js:18`, `src/export.js:19`) break the repo's configured lint gate and are trivial to fix (`===`, delete `DEBUG`). More substantively, finding 3 means the fix is incomplete: currency changes with an unchanged locale still serve stale totals, so the cache key must cover every input `buildReport` depends on — at minimum `{ locale, currency }`. Fix both blockers and the cache key, re-run `npx eslint src/`, and re-verify before merging.
