# Review report
Scope: main (dfe318e)..feat/team-plans (7c19f9a) — 3 files, +91/−2. Packet gaps: no external spec/issue exists; intent taken from the task statement ("team subscriptions: seats, proration, checkout/renewal totals, trial notices, and ownership transfer") plus commit message `feat(teams): team plans with seats, proration, and trial notices`. Single-reviewer review (no subagent harness available).

What holds up:
- Seat limit is genuinely enforced: `addMember` throws when `team.members.length >= plan.seats` against `PLANS.team.seats = 5` (src/teams.js:13-16, src/plans.js:5).
- `checkoutTotal` rounds to whole cents (src/billing.js:23) — verified: `checkoutTotal(999, 0.1, 0.07)` → `962`.
- `createTeam` guards name length (src/teams.js:7); `removeTeam` deletes member rows before the team row, respecting `db.remove`'s FK throw (src/teams.js:23-27, src/db.js:18-22).
- Base ref resolves, diff is non-empty, configured test command is green.

Static checks: `npm test` (`node --test`) is the only configured check — passes 3/3. However, `test/core.test.js` is byte-identical to `main`; all 3 tests predate the branch and exercise none of the new code, so none of the claimed behavior (seats, proration, totals, trial notices, ownership transfer) has any validation evidence. No linter/formatter/typechecker is configured.

Findings:
1. [blocker · high] src/billing.js:31-37 — `chargeTeam` catches a gateway throw and returns `{ ok: true }` — a declined/failed charge is indistinguishable from a collected one to every caller; verified live: `chargeTeam('t1', 4000, { charge() { throw new Error('card declined') } })` → `{ ok: true }` — fix: rethrow or return `{ ok: false, error }` and let the caller decide.
2. [blocker · high] src/billing.js:17-19 vs src/billing.js:3-4 — `prorateTeam` hardcodes a `/30` denominator while the convention comment added by this same branch mandates actual calendar days of the current month — overcharges in 31-day months (verified: day 15 of a 31-day month at 4000¢ → 2000¢ vs correct 1935¢) and undercharges in February — fix: derive the denominator from the actual month (`new Date(y, m+1, 0).getDate()`).
3. [blocker · high] src/notify.js:18-24 with src/users.js:5 — `trialExpired`/`trialBanner` feed `user.trialEndsOn` to `new Date()`, but the documented legacy format is `DD.MM.YYYY`, which V8 cannot parse — verified: `new Date('15.08.2026')` → Invalid Date, so `trialExpired` returns `false` forever (trials never expire) and `trialBanner` renders "trial ends Invalid Date"; day ≤ 12 is silently misparsed as `MM.DD.YYYY` (`'05.08.2026'` → May 2026) — fix: parse the documented format explicitly (split on `.`, construct `Date(y, m-1, d)`).
4. [blocker · high] src/teams.js:8 vs src/notify.js:11,15 — `createTeam` stores `owner: ownerId` (a string ID), but `invoiceEmail`/`renewalNotice` dereference `team.owner.email` — the only team-creation path in the repo produces rows the notice functions cannot address; verified: `renewalNotice(teamRow)` sends to `undefined` and still returns `{ ok: true }`, so invoice/renewal notices are silently lost — fix: store a hydrated owner or resolve the owner ID to an email before sending.
5. [should-fix · high] src/billing.js:26-29 vs src/billing.js:21-24 — `renewalTotal` omits the final `Math.round` and applies discount after tax, the opposite of `checkoutTotal` — returns fractional cents (verified: `renewalTotal(999, 0.1, 0.07)` → `962.1` while checkout yields `962`), so checkout and renewal disagree on the same inputs — fix: round the final result and pick one documented discount/tax ordering for both paths.

Open questions:
- `transferOwnership` assigns `team.owner = newOwnerId ?? null` and never calls `db.put` (src/teams.js:34-37): is nulling the owner intended (verified: `transferOwnership('t1')` with no ID leaves `owner: null`), and is persistence meant to rely on the in-memory stand-in's reference semantics rather than a write?
- `findMembers(teamName)` interpolates its argument into `WHERE teamId = '...'` (src/teams.js:30-31): do callers pass a name or an ID? The string-interpolated query is harmless against the current stand-in (src/db.js:5-12 matches any field) but is an injection-shaped pattern if the db is ever real.
- `addMember` awaits `db.lookup('users', userId)` but discards the result (src/teams.js:17): is adding a non-existent user as a member acceptable, or should the existence check throw?

Verdict: blocker 4 · should-fix 1 · nit 0 → **BLOCK**

The branch is not ready to merge: four reachable defects sit directly inside the claimed contract (a failed charge reported as success, proration contradicting the branch's own stated convention, trial notices broken for the documented date format, and invoice/renewal notices silently addressed to `undefined`), and the green `npm test` run covers none of the new code. Verify each finding independently, fix the confirmed ones, and add tests that exercise the claimed mechanisms before re-requesting review.
