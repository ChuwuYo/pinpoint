## Review report

Scope: `main..feat/team-plans` (1 commit, 3 files, +91/-2) · Packet gaps: no external issue/spec — intent reconstructed from the request ("seats, proration, checkout/renewal totals, trial notices, ownership transfer"); no linter/formatter/type-checker configured, only `npm test`. Single-reviewer review: subagents unavailable, concern axes run sequentially by the aggregating agent.

What holds up:
- Seat cap is enforced: `addMember` throws `team is full` at the 6th member on a 5-seat plan — verified by execution (src/teams.js:14-16).
- `createTeam` validates name length before writing (src/teams.js:7), and `checkoutTotal` rounds its final total to whole cents — verified: `checkoutTotal(999, 0.07, 0.05) === 976` (src/billing.js:21-24).
- `removeTeam` deletes member rows before the team row, respecting `db.remove`'s FK-style throw on missing rows (src/teams.js:22-28, src/db.js:18-21).

Static checks: `npm test` (`node --test`) — 3/3 pass. Enforces only pre-existing user/charge paths and `PLANS.team.seats`; nothing subtracted from findings below.

Findings:
1. [blocker · high] src/billing.js:17-19 — `prorateTeam` hardcodes a 30-day denominator while the file's own convention comment (src/billing.js:3-4) mandates actual calendar days of the current month — verified: `prorateTeam(3100, 15)` returns 1550, the documented convention yields 1500 (31-day month); every 31/28-day month over/under-charges — fix direction: derive the denominator from the actual month's length; confidence high.
2. [blocker · high] src/billing.js:31-37 — `chargeTeam` catches a gateway exception and returns `{ ok: true }` — verified: a gateway throwing `card declined` produces `{ ok: true }`, so a failed team charge is indistinguishable from a successful one (money lost, false success signal) — fix direction: return `{ ok: false, error }` or rethrow; never report success on failure.
3. [blocker · high] src/notify.js:18-24 — `trialExpired`/`trialBanner` parse `user.trialEndsOn` with `new Date(...)`, but src/users.js:5 documents the format as DD.MM.YYYY from the legacy import — verified: `'15.08.2020'` → Invalid Date → `trialExpired` returns `false` for a trial expired 5 years ago and the banner renders "trial ends Invalid Date"; `'05.08.2030'` is silently read as May 7 (MM.DD swap) — trial notices are wrong or broken for every real user — fix direction: parse DD.MM.YYYY explicitly (split and construct `Date.UTC`).
4. [should-fix · high] src/teams.js:34-37 — `transferOwnership` applies `newOwnerId ?? null`, so passing null/undefined silently strips ownership, and no existence/membership check on the new owner — verified: `transferOwnership('t1', undefined)` leaves `owner: null`, after which `renewalNotice(team)` throws `TypeError: Cannot read properties of null (reading 'email')` — fix direction: reject nullish new owners and validate the user (ideally a team member) before assigning.
5. [should-fix · high] src/teams.js:17 — `addMember` awaits `db.lookup('users', userId)` but discards the result — verified: `addMember('t1', 'ghost-user')` succeeds and consumes a seat for a nonexistent user — fix direction: throw when the lookup returns null.
6. [should-fix · high] src/billing.js:26-28 — `renewalTotal` rounds mid-computation but returns the final value unrounded — verified: `renewalTotal(999, 0.07, 0.05)` returns `975.5699999999999` (fractional cents) while `checkoutTotal` with identical inputs returns `976`; the two totals also apply discount/tax in opposite orders, so checkout and renewal disagree beyond rounding — fix direction: `Math.round` the final result and align the operation order with `checkoutTotal`.
7. [should-fix · medium] src/teams.js:30-32 — `findMembers(teamName)` interpolates the argument into a `teamId =` filter and member rows store only ids — verified: `findMembers('Alpha')` returns `[]` while `findMembers('t1')` returns the row; callers following the signature get empty results — fix direction: rename the parameter to `teamId` or resolve the name through the teams table first.
8. [should-fix · medium] test/core.test.js:9-22 — no test exercises any new mechanism (seat limit, proration, checkout/renewal totals, trial expiry/banner, ownership transfer); the only new-adjacent assertion re-states `PLANS.team.seats` data — every blocker above would pass this suite — fix direction: add mechanism tests, especially a failing-gateway `chargeTeam` case and a DD.MM.YYYY trial case.

Open questions:
- `invoiceEmail`/`renewalNotice` read `team.owner.email` (object shape), but `createTeam` stores `owner` as an id string — verified that passing a `createTeam`-shaped team sends mail to `undefined` with `{ ok: true }`. Whether a join layer exists outside the diff is not settled by the intent; if it doesn't, this is a blocker.
- Blast radius: no callers of the new functions exist in this repo, so the deployment exposure of findings 1–3 (webhook paths, schedulers) cannot be determined from the packet.

Verdict: blocker 3 · should-fix 5 · nit 0 → BLOCK
