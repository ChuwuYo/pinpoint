## Review report

**Scope:** `9ee2e98..93b2f1f` (merge-base `main` → `feat/team-plans`, 3 files, +91/−2)
**Mode:** single-reviewer (harness exposes no subagents), strictly read-only — tree clean before and after
**Packet gaps:** no external issue/spec exists; intent taken unedited from the prompt ("seats, proration, checkout/renewal totals, trial notices, and ownership transfer") plus commit `93b2f1f`. No lint/format/typecheck config in repo. Validation evidence = local gate run only.

**Gate status:** `node --test` passes 3/3 — but `git diff 9ee2e98..93b2f1f -- test/` is empty. All 3 tests exercise only pre-branch code (`charge`, `invoiceLine`, `users`, `PLANS`). The green gate covers **zero** of the 8 new functions; it is not evidence this branch works.

**What holds up:**
- Seat cap is enforced: `teams.js:14-16` throws at `plan.seats` (5 for team, `plans.js:5`); over-cap adds rejected.
- `removeTeam` deletes member rows before the team row (`teams.js:24-27`), matching the FK throw in `db.js:23-25` on the happy path.
- `checkoutTotal` returns rounded integer cents (`billing.js:21-24`; verified `checkoutTotal(1050,0.05,0.08) = 1077`).
- `createTeam` name-length guard (`teams.js:7`).

**Static checks:** only `node --test` is configured (`package.json`); no formatter/linter/typechecker exists, so nothing further was subtracted.

**Findings:**
1. **[blocker · high] `billing.js:36`** — `chargeTeam` catches gateway failures and returns `{ ok: true }` — demonstrated: a throwing gateway yields success. Failed charges are silently reported as paid; revenue loss is undetectable downstream. Fix: return a failure result or rethrow; never map catch → ok.
2. **[blocker · high] `teams.js:23,31`** — unparameterized interpolation of `teamId`/`teamName` into `db.query`, which explicitly mimics a naive SQL backend (`db.js:6-9`). Demonstrated: `removeTeam("' OR '1'='1")` wiped **all** member rows cross-tenant before throwing; `findMembers("' OR '1'='1")` leaked all rows. Fix: parameterize/escape, or validate ids before querying.
3. **[blocker · high] `billing.js:18` vs `billing.js:3-4`** — the diff adds the convention "per actual calendar day of the current month (denominator 31 in a 31-day month)" then implements `priceCents / 30`. Demonstrated: `prorateTeam(4000,15) = 2000` vs 1935 under the stated convention. The diff contradicts itself; every prorated charge outside a 30-day month is wrong. Fix: compute the days-in-month denominator (or correct the convention).
4. **[blocker · high] `notify.js:19,23` vs `users.js:5`** — `trialEndsOn` is documented as legacy `DD.MM.YYYY`, but `new Date()` parses it as `MM.DD.YYYY`: day ≤ 12 silently swaps month/day (`'07.08.2026'` → July 8); day > 12 → `Invalid Date` → `NaN` → `trialExpired` returns **false** for genuinely expired trials (demonstrated with `'15.01.2020'`), and `trialBanner` prints "Invalid Date". The claimed trial-notice mechanism is broken for the documented data. Fix: parse the DD.MM.YYYY format explicitly.
5. **[should-fix · high] `billing.js:28`** — `renewalTotal` never rounds its final result: demonstrated `renewalTotal(1050,0.05,0.08) = 1077.3` (fractional cents) while `checkoutTotal` of the same inputs is 1077. Renewals produce non-integer cent amounts and diverge from checkout. Fix: final `Math.round`.

**Advisory nits:**
- `teams.js:30` — `findMembers(teamName)` parameter is named "name" but matched against `teamId`; callers passing a display name silently get `[]`.

**Open questions:**
- `teams.js:17-19` — `addMember` discards the `db.lookup('users', userId)` result (nonexistent users become members) and has no duplicate guard (a repeat add consumes an extra seat). The intent says "seats" but states no validation requirements — acceptable at this boundary?
- `teams.js:34-38` — `transferOwnership` applies `newOwnerId ?? null` with no existence/membership check and persists only via mutation of the live row — intended semantics?

**Verdict:** blocker 4 · should-fix 1 · nit 1 → **BLOCK** — not ready to merge. Findings are hypotheses verified against the in-repo runtime; re-verify each independently before fixing.
