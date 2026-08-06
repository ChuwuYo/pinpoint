## Review report

**Scope:** `main..feat/team-plans` (1590563, 3 files, +91/−2). **Packet gaps:** none — base ref resolves, diff non-empty; no external spec exists, so intent is the user prompt unedited ("adds team subscriptions: seats, proration, checkout/renewal totals, trial notices, and ownership transfer… tell me whether it is ready to merge") plus the commit message ("team plans with seats, proration, and trial notices"). **Disclosure:** subagents unavailable — all seven concern axes run sequentially by a single reviewer per the skill.

**What holds up** (verified by read-only execution):
- Sequential seat enforcement works: 5 sequential `addMember` calls succeed on a 5-seat team, the 6th throws `team is full`. (Does not survive the concurrency check — see finding 2.)
- `createTeam` name guard rejects >40 chars (`teams.js:7`, verified `team name too long`).
- Pre-existing API signatures (`charge`, `invoiceLine`, `sendEmail`) are unchanged; pre-existing tests still pass.
- `checkoutTotal` returns rounded integers for its discount-then-tax order (verified `1044`).

**Static checks:** `npm test` (`node --test`) is the only configured check — 3/3 pass. No linter, formatter, or type checker configured. The three tests exercise only pre-branch APIs (`users`, `charge`, a `PLANS` constant), so tooling enforces nothing about the diff; nothing to subtract.

**Findings** (each verified by executing `src/` read-only; re-rank gate scores: correctness/actionability 0–10):

1. **[blocker · high]** `src/billing.js:31-37` — `chargeTeam` catches gateway failures and returns `{ ok: true }`. Verified: a gateway throwing `card declined` yields `{"ok":true}`. Uncollected money is reported as a successful charge to every caller. Fix: propagate or return the failure; never synthesize `ok:true`. *(gate: 10/9 — reproduced exactly; fix is concrete.)*
2. **[blocker · high]** `src/teams.js:11-20` — seat check is not atomic: `await db.lookup('users', …)` yields between `members.length >= plan.seats` and `members.push`. Verified: 8 concurrent `addMember` calls all settled on a 5-seat team (`members.length === 8`). The seats contract — a core claim of the change — is contradicted on a normal concurrent path. Fix: atomic check-and-insert per team (serialize, or enforce capacity in the db layer). *(10/8.)*
3. **[blocker · high]** `src/notify.js:18-24` — `trialExpired`/`trialBanner` do `new Date(user.trialEndsOn)`, but `users.js:5` documents `trialEndsOn` as legacy `DD.MM.YYYY`. Verified: `new Date('15.08.2026')` → `Invalid Date`, so `trialExpired` is always `false` and the banner renders `trial ends Invalid Date`. The claimed trial notices never fire. Fix: parse `DD.MM.YYYY` explicitly. *(10/9.)*
4. **[blocker · high]** `src/notify.js:10-16` — `invoiceEmail`/`renewalNotice` read `team.owner.email`, but `createTeam` (`src/teams.js:8`) stores `owner` as an id string. Verified: stored owner `"u1"`, so emails are addressed to `undefined`. Claimed invoice/renewal notices cannot reach a recipient for the team shape this diff creates. Fix: resolve the owner via `db.lookup('users', team.owner)` before reading `.email`. *(10/8.)*
5. **[blocker · high]** `src/billing.js:26-29` — `renewalTotal` returns fractional cents and rounds in a different order than `checkoutTotal`. Verified: `renewalTotal(999, 0.05, 0.10)` → `1044.05` (non-integer) vs `checkoutTotal(999, 0.05, 0.10)` → `1044`. Customer-facing totals can be non-integer and disagree between checkout and renewal for identical inputs. Fix: round once at a consistent step in both functions. *(10/9.)*
6. **[blocker · high]** `src/billing.js:17-19` — `prorateTeam` divides by a fixed 30, contradicting the convention documented in the same diff (`src/billing.js:3-4`: "per actual calendar day of the current month… denominator 31"). Verified: `prorateTeam(4000, 15)` → `2000`; the documented rule gives `1935` in a 31-day month. Code and its own stated convention cannot both be right. Fix: use the actual days-in-month denominator (or correct the convention — see open questions). *(9/8.)*
7. **[should-fix · high]** `src/teams.js:34-38` — `transferOwnership` performs no validation. Verified: `newOwnerId` undefined → owner set to `null` (`?? null`); a nonexistent id (`'ghost'`) is accepted. A null/ghost owner then crashes the notify paths (`team.owner.email`). Fix: require an existing user (ideally a current member) and reject null. *(9/8.)*
8. **[should-fix · high]** `src/teams.js:30-32` — `findMembers(teamName)` interpolates the value into `WHERE teamId = …`. Verified: `findMembers('Acme')` → `[]` while the id-keyed query returns 8 rows; name-based lookups can never match. Fix: resolve the team by name first, or rename the parameter to `teamId`. *(9/9.)*
9. **[should-fix · medium]** `src/teams.js:23,31` — raw string interpolation of `teamId`/`teamName` into `db.query` SQL. Exploitability is bounded today (the in-memory parser's greedy capture just mis-matches), but the pattern is an injection vector against any real backend. Fix: parameterized queries or strict id validation/escaping. *(7/7.)*
10. **[should-fix · high]** `test/core.test.js` (unchanged) — no test covers any claimed mechanism (seats, proration, totals, trial, transfer); the "team plan has five seats" test asserts a constant, not the enforcement path, and would not fail if the code were broken. Fix: tests that fail when each defect above regresses. *(10/9.)*
11. **[should-fix · high]** `src/teams.js:11-20` — no duplicate-membership guard. Verified: the same user added twice yields `members: ['v0','v0']`, consuming two seats for one person. Fix: reject already-member ids before push. *(9/9.)*

*Noise budget:* should-fix + nit capped at 5; a nit-tier candidate (`removeTeam` partial cleanup if `db.remove` throws mid-loop, `src/teams.js:22-28`) was dropped per the budget. No finding scored zero on the re-rank gate.

**Open questions:**
- Proration: is the business rule the documented per-calendar-day convention or the fixed-30 implementation? The contradiction is finding 6; which side to fix is intent.
- `checkoutTotal` discounts before tax while `renewalTotal` taxes before discount — intentional policy difference or inconsistency?
- On gateway failure, should `chargeTeam` retry/queue or surface the error to the caller? Reporting success is wrong either way; the desired failure path is unstated.
- On ownership transfer: should the outgoing owner remain a member, and should a notification fire? Intent is silent.

**Verdict: blocker 6 · should-fix 5 · nit 0 → BLOCK.** Working tree verified clean after review; no files mutated. Every claimed mechanism (seats, proration, renewal totals, trial notices, and the billing/notice paths around them) has at least one verified, reachable defect — the branch is not ready to merge.
