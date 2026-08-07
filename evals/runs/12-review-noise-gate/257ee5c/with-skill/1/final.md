## Review report

**Scope:** `0dd10b6..0b53482` (merge-base of `main`..`fix/export-total`) — src/export.js, src/settings.js (+12/−4)
**Mode:** Standalone, single-reviewer. Diff is small enough for one pass; no subagents spawned.
**Packet gaps:** No issue text beyond the one-line prompt; no reproduction evidence or test output supplied; repo has no test suite to run. Intent taken from the prompt and commit message `fix(export): invalidate report cache on locale change`.

**Gate status:** **FAIL** — `npx eslint src/` (the only configured gate; eslint 9.39.1 with `eslint.config.mjs`) reports 2 errors, both introduced by this branch:
- `src/export.js:18:29` — `eqeqeq`: `cache.locale == settings.locale` uses `==`
- `src/export.js:19:9` — `no-unused-vars`: `const DEBUG = false;` never used

**What holds up:**
- The stated mechanism is fixed for the locale path: `getReport` now keys the cache by locale and rebuilds on mismatch (src/export.js:18–21). Tracing the call path — `applySettings({locale:'de-DE'})` then `exportReport(lines, settings)` — confirms a rebuilt report instead of the stale one.
- Repository contracts are untouched: CSV single-line normalization (src/csv.js:5) and fire-and-forget webhook (src/notify.js:10) are unchanged, per CONTRIBUTING.md.
- settings.js changes are additive; existing exports are preserved (src/settings.js:21), so no consumer breakage.
- Commit message follows Conventional Commits.

**Static checks:** `eqeqeq` and `no-unused-vars` over `src/**/*.js` — their output is subtracted from the findings below (and reported under Gate status). package.json defines no test/build/typecheck/format scripts; eslint is the only gate.

**Findings:**
1. [should-fix · high] src/export.js:18–21 — cache is keyed on `locale` only, but report output also depends on `settings.currency` (src/export.js:12). `applySettings` is exported (src/settings.js:21), so a currency change without a locale change returns a stale report — the same defect class this branch claims to fix, still reachable. Fix direction: include currency in the cache key (or key on all formatting-relevant settings).
2. [should-fix · medium] No validation evidence for the claimed mechanism — the packet contains no test and no repro output showing stale-total-then-reformatted behavior. A targeted check is cheap: `getReport` with `en-US`, then with `de-DE`, must return reformatted totals. Fix direction: add a minimal regression test or attach repro evidence.

**Advisory nits:**
1. [nit · high] src/settings.js:14–19 — new exported `setLocale`/`SUPPORTED_LOCALES` is unconnected to the fix (nothing calls it; export.js does not import settings.js) and its hardcoded whitelist rejects locales `Intl` supports (e.g. `fr-FR`) while `applySettings` still bypasses validation. Concrete impact: new public API surface with an inconsistent validation boundary. Fix direction: drop it from this branch, or make `setLocale` the single locale-mutation path.

**Open questions:**
- Did the original bug report cover currency changes, or locale only? (Determines whether finding 1 is in-scope or a follow-up.)
- Is `getReport`'s cache intentionally lines-agnostic (same-locale calls with different `lines` still return the old report)? Pre-existing behavior, unchanged by this diff — flagged for confirmation, not as a finding.

**Verdict:** blocker 0 · should-fix 2 · nit 1 in review findings — but the branch **fails the repo's only configured gate on lines it introduces**, so it is not ready to merge → **BLOCK**. After the two lint errors are fixed, this becomes FIX-THEN-COMMIT (currency cache key + regression evidence).
