# Review report

Scope: `main (5ed1cd0)..fix/price-rounding (a607583)` — 1 file, `src/pricing.js`, +8/−4. Single-reviewer review (axes run sequentially, no subagents). Read-only confirmed: working tree clean before and after.
Packet gaps: no repository rules file exists (no README/AGENTS/CONTRIBUTING); no spec beyond the stated intent "switches totals to banker's rounding" and the commit message `fix(pricing): switch totals to banker's rounding`. Claims reconstructed from the change itself: totals round ties-to-even, everything else preserved.

What holds up:
- `roundHalfEven` (src/pricing.js:3-8) correctly implements ties-to-even for exact halves: `fraction > 0.5`/`< 0.5` fast paths, tie broken on `floor % 2`. Proven by the test run: 498.5¢ → 498 (actual `4.98`), the correct banker's result.
- The switch is complete for its stated scope: `totalPrice` is the only rounding call site (src/pricing.js:16; grep shows no other callers), and `formatMoney` is untouched.

Static checks: no linter, formatter, or type checker configured — only `npm test` (`node --test`). It **fails** on this branch, so nothing is subtracted; it is evidence for finding 1.

Findings:
1. [blocker · high] test/inventory.test.js:19-22 — the suite's only rounding test still asserts half-up semantics (`total rounds half up`, expects `4.99` for 997¢ × 50% discount = 498.5¢). Banker's rounding yields `4.98`; `npm test` fails: `4.98 !== 4.99`. The branch's configured check is red, and the new behavior was never reconciled with the encoded old behavior. Fix direction: update the test to the banker's expectation (`4.98`) and rename it — or, if `4.99` was the business-correct answer, the rounding switch is wrong for this supported path.
2. [should-fix · high] src/pricing.js:3-8 — the claimed mechanism has zero coverage: no test exercises ties-to-even (e.g., 2.5→2 vs 3.5→4). The only rounding test encoded the old semantics, so nothing would fail if `roundHalfEven` were broken (e.g., rounding ties up). Fix direction: add explicit banker's-rounding cases for tie, above-tie, and below-tie inputs.
3. [should-fix · medium] src/pricing.js:23 — the public export `roundHalfUp` was removed and replaced with `roundHalfEven`, a breaking API change the stated intent never asked for. No in-repo consumers remain (grep confirms; `report.js` imports only `formatMoney, totalPrice`) and the package is private, so the blast radius is bounded — but any external consumer breaks with `undefined`. Fix direction: keep a `roundHalfUp` alias or explicitly document the breaking change.

Open questions: was `4.99` the business-desired outcome for the 50%-discount tie case? The intent says banker's rounding, but the unreconciled test leaves ambiguity about which behavior is authoritative — the requester should confirm the intent itself before choosing the fix for finding 1.

Verdict: blocker 1 · should-fix 2 · nit 0 → **BLOCK**

Not ready to merge: the branch's own test suite fails. Each finding is a hypothesis to verify independently — fix confirmed ones, reject false positives with evidence.
