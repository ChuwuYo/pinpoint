# Review report

Scope: `main (dfe318e)..feat/team-plans (7c19f9a)` — 3 files, +91/−2. Single-reviewer review (diff small enough for one pass; no subagents spawned). Packet gaps: no external spec/issue exists; intent taken from the task statement ("team subscriptions: seats, proration, checkout/renewal totals, trial notices, and ownership transfer") and the commit message.

What holds up:
- Seat limit is enforced against the plan definition (`teams.js:13-15` checks `team.members.length >= plan.seats` before pushing; `plans.js:5` sets team seats to 5), and the configured test `team plan has five seats` passes.
- `removeTeam` deletes member rows before the team row (`teams.js:23-27`), which respects the FK-constraint throw in `db.remove` (`db.js:18-22`) — ordering is correct.
- `createTeam` validates name length (`teams.js:7`).
- All pre-existing tests still pass (`npm test`: 3/3).

Static checks: only `npm test` (`node --test`) is configured — no linter, formatter, or type checker to subtract. Note the suite enforces nothing about the new code: zero tests touch `prorateTeam`, `checkoutTotal`, `renewalTotal`, `chargeTeam`, the notify functions, or `teams.js`, so none of the claimed mechanisms are pinned by tests.

Findings (each verified by executing the code read-only; re-rank gate applied — all findings score ≥8/10 on correctness and actionability):

1. [blocker · high] `src/billing.js:18` — `prorateTeam` hardcodes denominator 30 while the convention comment added in the same commit (`src/billing.js:3-4`) mandates the actual days in the current month — proven: `prorateTeam(4000, 15)` returns 2000 but the documented calendar-day convention for a 31-day month gives 1935, so customers are overcharged on every prorated invoice in 31-day months (and undercharged in February) — the change's own stated claim is contradicted for the supported path — fix: derive the denominator from the current month's day count (e.g. `new Date(y, m+1, 0).getDate()`).
2. [blocker · high] `src/billing.js:31-37` — `chargeTeam` catches gateway failures and returns `{ ok: true }` — proven: with a gateway whose `charge` throws `card declined`, the function returns `{"ok":true}` — a failed payment is reported as a successful charge, so teams get service without paying and any caller reconciling on `ok` is corrupted — fix: return a failure result or rethrow; never map a caught error to `ok: true`.
3. [blocker · high] `src/notify.js:19,23` — trial notices parse `trialEndsOn` with `new Date(...)`, but `users.js:5` documents the legacy import format as DD.MM.YYYY, which V8 cannot parse — proven: `new Date('15.08.2026')` is `Invalid Date`, so `trialExpired` returns `false` for a trial that expired (NaN comparison) and `trialBanner` renders `"trial ends Invalid Date"` — the claimed trial-notice feature is broken for every legacy-imported user — fix: parse DD.MM.YYYY explicitly and handle unparseable input.
4. [blocker · high] `src/billing.js:26-29` — `renewalTotal` rounds mid-computation and never rounds the final result, and applies discount/tax in the opposite order to `checkoutTotal` — proven: `checkoutTotal(999, 0.1, 0.07)` = 962 while `renewalTotal(999, 0.1, 0.07)` = 962.1 — renewal invoices disagree with checkout for identical inputs and can carry fractional cents — fix: use one shared computation (same order, single final `Math.round`) for both.
5. [should-fix · high] `src/notify.js:11,15` vs `src/teams.js:8` — `invoiceEmail`/`renewalNotice` read `team.owner.email`, but teams are stored with `owner` as an ID string — proven: after `createTeam('t1','acme','u1')`, `team.owner.email` is `undefined`, so notices are addressed to `undefined` — fix: resolve the owner ID through `db.lookup('users', ...)` before sending (or document and enforce a hydrated-team contract).

Open questions (not promoted to findings):
- `teams.js:36` — `transferOwnership` writes `newOwnerId ?? null`: is a null owner an intended state, or should an invalid/missing new owner be rejected? As written, a caller passing `undefined` silently orphans the team.
- `teams.js:17` — `addMember` awaits `db.lookup('users', userId)` but discards the result; is existence validation intended (a nonexistent user is currently added without error)?

Verdict: blocker 4 · should-fix 1 · nit 0 → BLOCK
