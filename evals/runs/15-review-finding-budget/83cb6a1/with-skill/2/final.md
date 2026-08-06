## Review report

Scope: main..feat/team-plans (diff: src/billing.js, src/notify.js, src/teams.js; 91 insertions, 2 deletions)   Packet gaps: none — intent taken from the user prompt unedited; base resolves; diff non-empty; repository conventions taken from in-code comments (src/billing.js:3-4, src/users.js:6). Subagents unavailable: axes were run sequentially by a single reviewer. Re-rank gate applied (all findings below scored ≥8/10 on correctness and actionability, all verified by read-only execution; none dropped).

What holds up:
- Seat-limit enforcement works: `addMember` throws `team is full` on the 6th member of a 5-seat team plan (src/teams.js:14-16, verified by execution).
- `createTeam` rejects names over 40 chars (src/teams.js:7, verified: throws `team name too long` at 41 chars).
- Pre-existing behavior is preserved: `npm test` passes 3/3, and `charge`/`invoiceLine` (src/billing.js:8-15) are untouched.
- `checkoutTotal` itself rounds to integer cents (verified 1050); `removeTeam`'s happy path removes the team row and its member rows without throwing (verified). Ordering checked: the only mid-operation error path (`db.remove` on a missing key) is not reachable through the public API, so no partial-write claim is made for it.

Static checks: `npm test` (`node --test`) — 3/3 pass, but the tests cover only pre-existing behavior; the diff adds no tests. No linter, formatter, type checker, or build is configured (package.json has only the `test` script). Nothing subtracted from the findings below — tooling enforces nothing over the new code.

Findings:
1. [blocker · high] src/billing.js:36 — `chargeTeam` catches any gateway error and returns `{ ok: true }` — a failed charge is reported to callers as a successful one (verified: gateway throwing `card declined` → returns `{"ok":true}`); the service would deliver team plans it never collected money for — fix: return `{ ok: false, error }` or rethrow; never fabricate success.
2. [blocker · high] src/billing.js:18 — `prorateTeam` hardcodes a `/30` denominator while the convention documented in this same diff (src/billing.js:3-4) requires actual calendar days of the current month — verified: 3100¢ × 15 days of a 31-day month yields 1550 from the code vs 1500 per the documented convention; every 28/31-day month misbills — fix: compute the denominator from the actual month (or correct the convention, but code and doc currently contradict).
3. [blocker · high] src/billing.js:26-29 — `renewalTotal` applies discount after tax with no final rounding, opposite order to `checkoutTotal` — verified: identical inputs (999, 0.07, 0.13) give checkout 1050 vs renewal 1049.97, a non-integer cent amount; checkout and renewal totals diverge for the same subscription and renewal emits fractional cents — fix: round the final result and align the discount/tax order with `checkoutTotal`.
4. [blocker · high] src/notify.js:11,15 — `invoiceEmail`/`renewalNotice` read `team.owner.email`, but teams store `owner` as an ownerId string (src/teams.js:8) — verified: `team.owner.email` is `undefined`, so invoice and renewal emails are "sent" to `undefined` while `sendEmail` still returns `{ok:true}`; with a null owner (reachable via finding 7) `renewalNotice` throws `TypeError` (verified) — fix: resolve the owner's user record (e.g. `db.lookup('users', team.owner)`) before addressing.
5. [blocker · high] src/notify.js:18-23 — `trialExpired`/`trialBanner` parse `user.trialEndsOn` with `new Date()`, but the format is documented as DD.MM.YYYY (src/users.js:6) — verified: `31.01.2026` (expired) parses as Invalid Date → `NaN` comparison → `trialExpired` returns false, so expired trials with day > 12 are never flagged; `05.06.2026` (intended 5 June) parses as May 6, so the banner shows the wrong date — fix: parse DD.MM.YYYY explicitly (split and construct `Date.UTC(y, m-1, d)`).
6. [should-fix · high] src/teams.js:17-19 — `addMember` discards the `db.lookup('users', userId)` result — verified: a nonexistent user (`ghost`) is added, consumes a seat, and gets a members row; an unknown teamId throws a bare `TypeError` at src/teams.js:13 — fix: null-check both lookups and throw domain errors.
7. [should-fix · high] src/teams.js:34-37 — `transferOwnership` applies `newOwnerId ?? null`, silently nulling ownership when the argument is omitted (verified: owner becomes `null`), producing an ownerless team that crashes notify (finding 4); no validation that the new owner exists or is a member — fix: require a valid user id and reject otherwise.
8. [should-fix · medium] src/teams.js:30-31 with src/db.js:14 — `findMembers(teamName)` queries `WHERE teamId = '<name>'` — verified: `findMembers('Acme')` returns `[]` while `findMembers('t1')` returns rows; additionally `db.query` discards the column name and matches any row field — fix: settle the contract (look up by id; honor the column).
9. [should-fix · medium] src/teams.js:19 — members rows keyed by `userId` with no duplicate/existing-membership check — verified: adding the same user twice yields `members: ["ghost","u2","u2"]` (two seats, one row); a user joining a second team silently overwrites their first membership row, leaving the first team's `members` array stale — fix: reject duplicate adds and enforce (or explicitly allow) single-team membership.
10. [should-fix · high] test/core.test.js — the diff adds seats, proration, checkout/renewal totals, trial notices, and ownership transfer with zero new tests; each blocker above would fail a one-line test — fix: add tests asserting the claimed mechanisms (convention-based proration, integer totals, failure propagation, recipient resolution, DD.MM.YYYY trial handling).

Open questions:
- Is one-team-per-user intended? The members table keyed by `userId` (src/teams.js:19) enforces it silently; the stated intent does not say.
- Must the new owner on transfer be an existing member/user? Intent is silent; current code accepts anything, including `undefined`.
- `discountPct`/`taxPct` units (0.07 vs 7) are undocumented; both totals functions assume fractions consistently, but no caller in the repo confirms the convention.

Verdict: blocker 5 · should-fix 5 · nit 0 → BLOCK

Findings are hypotheses, not proof — verify each independently before fixing. Repository state confirmed clean after review (read-only throughout).
