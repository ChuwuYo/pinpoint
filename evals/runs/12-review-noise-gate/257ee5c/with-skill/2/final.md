## Review report

**Scope:** `0dd10b6..0b53482` (merge-base `main`…`fix/export-total`; single commit `0b53482 fix(export): invalidate report cache on locale change`; 2 files, +12/-4)
**Mode:** Single-reviewer, axes run sequentially and locally (diff small enough for one pass; subagents not warranted). Read-only verified: working tree clean and HEAD `0b53482` identical before and after review; nothing edited, staged, or committed.
**Packet gaps:** No external issue/spec text exists — intent is taken from the user prompt ("exported CSV reports showed stale row totals after a locale change") and reconstructed from the commit message. The branch ships no validation evidence; reproduction was performed by the reviewer. No CI configuration in the repo.
**Gate status:** FAIL. `package.json` defines no scripts (no lint/test/build gates there). The only configured gate is ESLint 9.39.1 via `eslint.config.mjs` (`eqeqeq`, `no-unused-vars` on `src/**/*.js`). `npx eslint src/` exits 1 with 2 errors, both on lines this diff added: `src/export.js:18` (`==`, eqeqeq) and `src/export.js:19` (unused `DEBUG`, no-unused-vars).

**What holds up:**
- The claimed fix works for the reported trigger. Manual run: `en-US` → `de-DE` → `en-US` produces `"$1,234.56"` → `"1.234,56 $"` → `"$1,234.56"` — the cache rebuilds exactly on locale change and not otherwise.
- Both CONTRIBUTING.md contracts are preserved: `src/csv.js` untouched (single-line cells), `src/notify.js` untouched and still called once per `exportReport` with no response checking or retries added (fire-and-forget, src/export.js:26).
- `setLocale` rejects unsupported locales with `RangeError` as written (verified: `fr-FR` throws).
- Commit message follows Conventional Commits per CONTRIBUTING.md.

**Static checks (subtracted):** ESLint already enforces the two style defects this diff introduces (`==` at export.js:18, dead `DEBUG` constant at export.js:19). They are not counted as findings below, but they make the gate red: the branch cannot merge as-is in any workflow that enforces the repo's own lint config. Fixes are trivial: `===` and delete `DEBUG`.

**Findings:**
1. [should-fix · high] `src/export.js:18` — the cache key includes only `locale`, but `buildReport` also formats every row with `settings.currency` (src/export.js:12). Changing currency via the exported `applySettings` leaves totals stale — demonstrated: after `applySettings({ currency: 'EUR' })` with locale unchanged, `getReport` still returns `"$1,234.56"`. This is the same root cause as the reported bug (cache key doesn't cover everything `buildReport` depends on), only partially fixed — fix: key the cache on locale + currency, or invalidate the cache from `applySettings`.
2. [should-fix · high] no test file — a fix for a reported stale-data defect ships with zero regression coverage on the claimed mechanism (locale-change rebuild); the repo has no test harness at all, so the fix is verified only by the reviewer's manual run and will regress silently — fix: add a minimal zero-dependency `node:test` case: `getReport` → change locale → `getReport` output must differ.
3. [should-fix · medium] `src/settings.js:14-19` — the new exported `setLocale`/`SUPPORTED_LOCALES` has no caller anywhere in the repo (grep-verified) and is not needed for the fix (the cache keys off whatever `settings.locale` the caller passes). It also diverges from established handling without justification: `applySettings` + `Intl.NumberFormat` accept any BCP-47 locale, while `setLocale` throws on valid ones like `en-GB` — dead API surface that contradicts module behavior — fix: drop it from this branch, or land it with its consumer and a rationale for the allowlist.

**Advisory nits:** none.

**Open questions:**
- `getReport`'s cache ignores the `lines` argument entirely (pre-existing, not introduced by this diff; demonstrated: new input rows with unchanged locale return the previous report). Is the cache intended as per-process single-shot, or should input data also key/invalidate it? The intent could not settle this — raised as a question, not a finding.

**Verdict:** blocker 0 · should-fix 3 · nit 0 → **FIX-THEN-COMMIT**

Not ready to merge: the configured ESLint gate fails on the diff's own added lines, the cache-key fix is incomplete for currency (same stale-totals mechanism), and the fix carries no regression test. Findings are hypotheses — verify each independently before acting.
