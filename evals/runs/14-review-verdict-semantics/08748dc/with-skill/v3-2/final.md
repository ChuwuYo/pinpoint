# Review report

Scope: `main..refactor/pricing-cleanup` (merge-base `5ed1cd0`, head `646065b`; 1 file, +3/-1)   Packet gaps: none — intent from user request and commit message; base resolves; diff non-empty. Single-reviewer local review (diff fits one pass).

What holds up:
- Intent honored exactly: "names the minor-units constant; behavior unchanged." The only behavioral line, `src/pricing.js:14`, divides by `MINOR_UNITS` whose value is `100` (src/pricing.js:3) — arithmetic identical to the removed `/ 100`.
- Completeness: repo-wide search finds no other occurrence of the conversion literal — the only remaining `100`s are a test input price (test/inventory.test.js:25) and `MINOR_UNITS` itself. No caller, export, or consumer was missed; the public surface (`module.exports`, src/pricing.js:21) is untouched, so blast radius is confined to the module.
- Convention match: module-level named constant mirrors the existing `DEFAULT_RESTOCK_THRESHOLD` pattern in src/inventory.js:4.
- Claim vs evidence: "behavior unchanged" is proven by the existing test `total rounds half up` (test/inventory.test.js:19-22), which exercises the changed line (997 × 0.5 → 499 → 4.99) and would fail if the divisor were wrong; 4/4 tests pass.

Static checks: `npm test` (`node --test`) is the only configured check — no linter, formatter, or type checker configured. Result: 4 pass, 0 fail. Nothing to subtract.

Findings: no material issues.

Open questions: `MINOR_UNITS` is not exported, unlike `DEFAULT_RESTOCK_THRESHOLD` in inventory.js:18 — the stated intent ("name the constant") doesn't settle whether it should be public; and `formatMoney` (src/pricing.js:18) still hardcodes 2 decimal places, a related but distinct concept the intent never claimed to cover. Both are pre-existing/out-of-scope, not findings.

Verdict: blocker 0 · should-fix 0 · nit 0 → CLEAR

Ready to merge. Verify independently: the diff is one hunk — `const MINOR_UNITS = 100` plus `/ 100` → `/ MINOR_UNITS`; `npm test` passes 4/4.
