## Review report
Scope: 0dd10b6..0b53482 (merge-base of main..fix/export-total; src/export.js, src/settings.js)
Mode: single-reviewer (diff small enough for one pass; no subagents spawned)
Packet gaps: no external issue/spec beyond the one-line prompt; no reproduction or test evidence for the claimed bug fix — intent reconstructed from the prompt and commit message
Gate status:
- `npx eslint src/` (configured: eslint.config.mjs) → **diff-caused failure** — src/export.js:18 `eqeqeq` (`==` instead of `===`), src/export.js:19 `no-unused-vars` (`DEBUG` assigned, never used). Verified exit 0 on main (0dd10b6), exit 1 on branch.
- Tests → unavailable (no test framework or script configured)
- Build/typecheck → not applicable (plain JS, no scripts in package.json)

What holds up:
- The claimed mechanism is real: the cache is now keyed on locale, so a locale change triggers a rebuild (src/export.js:18–21), closing the reported stale-totals path for locale.
- Cache assignment happens only after `buildReport` completes (src/export.js:20), so a throw mid-build leaves the previous cache intact — no partial cache state.
- `setLocale` validates before mutating shared settings (src/settings.js:16–19) — no half-applied state.
- CONTRIBUTING.md contracts (CSV single-line cells, fire-and-forget webhook) are untouched; commit message follows Conventional Commits.

Static checks: eslint already enforces `eqeqeq` and `no-unused-vars` — both violations are reported in Gate status above and subtracted from findings.

Findings:
1. [blocker · high] src/export.js:18 — cache key omits `settings.currency`, but the cached report consumes it via `formatTotal(l.totalMinor, settings.locale, settings.currency)` (src/export.js:12); `applySettings({ currency })` (src/settings.js:10) or any caller passing a settings object with a different currency and the same locale returns stale totals. Same root cause as the claimed fix (incomplete cache key), still reachable on a supported sibling path — the "stale totals fixed" claim is contradicted for the currency path. Fix: include currency (and every input the report depends on) in the cache key, or drop the cache.
2. [blocker · medium] src/export.js:18–21 — cache key omits `lines`; `getReport(newLines, sameSettings)` returns the previous report — stale rows and totals through the primary exported API, same incomplete-key root cause. Pre-existing, but the change rewrites this cache and claims the stale-report bug class while leaving this path intact. Fix: key on the report's full input set (e.g., lines identity/hash) or make the cache per-dataset. Confidence medium only because the intended cache contract is unstated — see open questions.
3. [should-fix · high] (no file) — the bug is user-reported, yet the branch carries zero validation evidence: no reproduction, no test, no script demonstrating stale→fresh behavior, and the repo has no test harness. For a defect fix, verification is required and currently missing. Fix: add a minimal regression check (even a plain node script asserting a locale/currency change yields a rebuilt report) and attach reproduction evidence.

Advisory nits:
- src/settings.js:14–19 — `setLocale`/`SUPPORTED_LOCALES` is a new exported API with a 4-locale allowlist policy, shipped inside a bug-fix commit, with no callers in the repo. Concrete impact: new public surface and a frozen locale policy that rejects locales `Intl.NumberFormat` supports. Split into its own commit or justify in the fix.

Open questions:
- Is the module-level cache intended to serve varying `lines` across calls, or is the runtime model one fixed dataset per process? (Settles finding 2's blast radius, not its existence.)
- Is `setLocale` part of the intended fix, and who owns the supported-locale policy?

Verdict: blocker 2 · should-fix 1 · nit 0 → **BLOCK** — the diff-caused eslint failure blocks on its own; findings 1 and 2 must also be resolved before merge.
