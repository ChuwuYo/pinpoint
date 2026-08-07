## Review report

**Scope:** `0dd10b6..0b53482` (merge-base `main`…`fix/export-total`) — `src/export.js`, `src/settings.js`, +12/−4
**Mode:** standalone, single-reviewer (diff small enough for one pass); read-only, repo state clean before/after
**Packet gaps:** no linked issue or repro steps for the original bug; no validation evidence shipped with the change (empty commit body); intent reconstructed from the prompt and commit subject; repo has no test infrastructure (`package.json` has zero scripts)

**Gate status:** RED — `npx eslint src/` (configured via `eslint.config.mjs`) fails with 2 errors, both introduced by this diff: `src/export.js:18` (`eqeqeq`), `src/export.js:19` (`no-unused-vars`). No other gates configured (no test/build/lint script in `package.json`; eslint config is the lint gate).

**What holds up:**
- The stated bug is fixed and I verified the mechanism: `getReport` now keys the cache on locale, and a live repro shows `en-US → de-DE` rebuilds the report (`$123.45` → `123,45 $`) instead of serving the stale cache (`src/export.js:18-21`).
- The cache stores a copied string (`cache.locale = settings.locale`, export.js:20), not a reference to the mutable settings singleton — no aliasing defect.
- Repo contracts untouched: CSV single-line normalization (`src/csv.js`) and fire-and-forget webhook (`src/notify.js`) are outside the diff; commit message follows Conventional Commits.

**Static checks (subtracted):** eslint `eqeqeq` and `no-unused-vars` already enforce the `==` at export.js:18 and the unused `DEBUG` at export.js:19 — not repeated as findings below, but they leave the configured gate red.

**Findings:**
1. **[should-fix · high]** `src/export.js:18-21` — cache key omits two of the report's three inputs. `buildReport` consumes `lines`, `settings.locale`, and `settings.currency` (export.js:12), but only `locale` is keyed. The same stale-totals defect still reproduces through adjacent paths, verified live: currency change USD→EUR at fixed `de-DE` returns the USD-formatted cache (`123,45 $`), and passing new `lines` returns the previous report's rows entirely. Fix: key on all inputs (locale + currency + lines) or drop the memoization.
2. **[should-fix · medium]** `src/settings.js:14-19` — unrequested new public API. `setLocale` enforces a hardcoded 4-locale allowlist and throws `RangeError` for any other valid `Intl` locale (`fr-FR`, `en-GB`, …), diverging from platform behavior; nothing in the repo calls it, and `applySettings` remains exported and unvalidated, so the gate is decorative. Fix: drop it from this bugfix, or justify the allowlist and route all locale mutation through it.

**Advisory nits:** the red lint gate (above) must be cleared before merge regardless — remove the `DEBUG` residue and use `===`.

**Open questions:** Is the global cache intended to survive new `lines` data (is `lines` process-stable by design)? If yes, the currency half of finding 1 still stands. Should `setLocale` become the sole mutation path, deprecating `applySettings({locale})`?

**Verdict:** blocker 0 · should-fix 2 · nit 0 → **FIX-THEN-COMMIT** — the reported locale bug is genuinely fixed and verified, but the lint gate is red and the cache key is incomplete (staleness still reachable, reproduced).
