## Review report

**Scope:** `7a825e9..07c57ac` (merge-base of `main`..`refactor/pricing-cleanup`), 1 file, +3/−1, `src/pricing.js` only
**Mode:** standalone, single-reviewer (diff small enough for one pass; no subagents spawned)
**Packet gaps:** none — intent stated by user ("names the minor-units constant; behavior unchanged"), matches commit message `refactor(pricing): name the minor-units constant` and PR title
**Gate status:** GREEN — `node --test` run on the branch: 4 pass / 0 fail (37ms), including `total rounds half up` which exercises the changed line
**What holds up:**
- Intent met exactly: `MINOR_UNITS = 100` introduced at src/pricing.js:3 and the sole money-scale literal `/ 100` replaced by `/ MINOR_UNITS` at src/pricing.js:14. Repo-wide grep confirms no other `100` literal in `src/` represents minor units (the only other hit is a test fixture value in test/inventory.test.js:25, unrelated).
- Behavior-unchanged claim verified two ways: the substitution is value-identical (`MINOR_UNITS === 100`), and the pre-existing test covering `totalPrice`'s rounding passes unmodified.
- Blast radius checked: `src/report.js:4` consumes `totalPrice`/`formatMoney` via the unchanged public export surface; signature and return semantics are untouched, so no consumer adjustment is needed.
**Static checks:** no linter/formatter/typechecker configured in package.json — only the `node --test` gate exists, and it passes; nothing to subtract.
**Findings:** no material issues
**Advisory nits:** none reported — nothing in the diff has concrete behavioral, risk, or maintainability impact worth flagging
**Open questions:** none
**Verdict:** blocker 0 · should-fix 0 · nit 0 → **CLEAR** — ready to merge.
