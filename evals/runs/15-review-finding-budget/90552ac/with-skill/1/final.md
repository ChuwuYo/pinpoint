## Review report

**Scope:** `9ee2e98..93b2f1f` (merge-base of `main`..`feat/team-plans`; 3 files, +91/−2: `src/billing.js`, `src/notify.js`, new `src/teams.js`)

**Mode:** single-reviewer (diff is small enough for one pass; no subagents spawned)

**Packet gaps:** none. Base ref resolves, diff is non-empty. Intent taken from the request and the commit message: "team subscriptions: seats, proration, checkout/renewal totals, trial notices, and ownership transfer." No external spec exists; intended behavior reconstructed from the change itself and the in-repo conventions (`src/users.js:5` legacy date format, `src/db.js:5-16` documented naive-query semantics, `src/billing.js:3-4` proration convention added by this diff).

**Gate status:**
- `node --test` (whole repo, configured gate) → **pass** (3/3, exit 0) — but note: all 3 tests are pre-existing; none exercise any line of this diff, so the green gate carries no evidence for the branch.
- Formatter / linter / type checker → **not applicable** (none configured; `package.json` defines only `test`).

**What holds up:**
- `addMember` enforces the seat limit against `PLANS[team.plan].seats` in the sequential path and records the member row (`src/teams.js:13-19`).
- `checkoutTotal` rounds to integer cents and applies discount before tax consistently within its own path (`src/billing.js:21-24`).
- `createTeam` validates name length and persists the team row (`src/teams.js:6-9`).
- Module exports are consistent; existing behavior (`charge`, `invoiceLine`, `users`, `PLANS`) is untouched and still green.

**Static checks:** nothing beyond the test gate is configured; nothing subtracted.

**Findings:**

1. **[blocker · high]** `src/teams.js:23` (also `:31`) — `removeTeam`/`findMembers` interpolate `teamId` directly into `db.query`, whose documented semantics evaluate a tautology `OR 'a'='a'` literally (`src/db.js:6-15`). Verified: `removeTeam("t1' OR '1'='1")` deleted **all** member rows (including another team's), then threw `foreign key constraint` on `db.remove('teams', …)` — leaving partial state: members wiped, team intact. Mass data loss plus a half-applied mutation. Fix: parameterize the query layer (or add a parameterized `find(table, field, value)` API) and use it at both call sites.

2. **[blocker · high]** `src/billing.js:31-37` — `chargeTeam` catches a gateway failure and returns `{ ok: true }`, reporting a failed charge as a successful payment. Callers will provision/renew on money that never arrived. Fix: return the failure (or rethrow); never fabricate `ok: true` on the error path.

3. **[blocker · high]** `src/notify.js:18-24` — `trialExpired`/`trialBanner` call `new Date(user.trialEndsOn)`, but `trialEndsOn` is documented as legacy `DD.MM.YYYY` (`src/users.js:5`). Verified: `new Date('15.08.2026')` → `Invalid Date`/`NaN`, so `trialExpired` is **always false** (trials never expire) and the banner renders "trial ends Invalid Date". The claimed trial-notice feature does not function on real data. Fix: parse `DD.MM.YYYY` explicitly (split and construct `Date.UTC(y, m-1, d)`) at the boundary.

4. **[blocker · high]** `src/billing.js:17-18` vs `src/billing.js:3-4` — `prorateTeam` hardcodes a `/30` denominator while the convention this same diff adds mandates actual calendar days of the current month. Verified: day 15 of a 31-day month on 4000¢ → 2000¢ charged vs 1935¢ per the convention (worse in February). Customer-visible overbilling on a claimed feature. Fix: derive the denominator from the current month's day count.

5. **[blocker · high]** `src/billing.js:26-29` vs `:21-24` — `renewalTotal` applies tax before discount (the inverse of `checkoutTotal`) and never rounds the final result. Verified on identical inputs (999¢, 7% discount, 6.25% tax): checkout = 987, renewal = **986.7299999999999** — a fractional-cent charge and a checkout↔renewal price divergence for the same plan. Fix: use one shared total computation (discount-then-tax, single final `Math.round`) for both paths.

6. **[blocker · high]** `src/notify.js:11,15` vs `src/teams.js:8` — `invoiceEmail`/`renewalNotice` read `team.owner.email`, but `createTeam` stores `owner` as an id **string**. For any team created through the only creation path in this repo, `team.owner.email` is `undefined` — invoice and renewal emails are addressed to `undefined` and silently "succeed". Fix: resolve the owner via `db.lookup('users', team.owner)` and use the user's email.

7. **[should-fix · high]** `src/teams.js:17` — `await db.lookup('users', userId)` discards its result; nonexistent users are added as members and consume seats. Fix: throw when the lookup returns null.

8. **[should-fix · high]** `test/core.test.js` — no test touches any claimed mechanism (seats, proration, totals, trial notices, ownership transfer, team removal); each finding above would pass the current suite. Fix: add mechanism tests, e.g. renewal-total integer-cents/checkout-parity, proration on a 31-day month, trial expiry on a `DD.MM.YYYY` date, seat-limit enforcement.

9. **[should-fix · medium]** `src/teams.js:11-19` — the seat check is check-then-act across two `await`s; two concurrent `addMember` calls both pass the check and overfill the team. Fix: make check-and-insert atomic at the store boundary (or serialize per team).

10. **[should-fix · medium]** `src/teams.js:30-32` — `findMembers(teamName)` queries `WHERE teamId = …`: by-name lookup can never match (member rows hold ids), so it returns `[]` unless passed an id — the function doesn't do what its signature says. Fix: rename the parameter to `teamId` or look the team up by name first.

11. **[should-fix · medium]** `src/teams.js:34-37` — `transferOwnership` writes `newOwnerId ?? null`, which can orphan a team (owner `null`), never validates the new owner exists, and throws a bare TypeError when the team is missing. Fix: require a non-null, existing user id; handle the not-found case explicitly.

**Advisory nits:** none reported (should-fix budget exhausted; remaining observations had no concrete impact).

**Open questions:**
- Is `chargeTeam`'s gateway ever expected to fail in supported operation, and is there a retry/reconciliation layer outside this repo that the swallowed failure was designed for? If so, finding 2's blast radius shifts, though the `{ ok: true }` contract remains wrong in-repo.
- Is `findMembers` intended to be by-name or by-id? The intent statement doesn't settle it; the defect (finding 10) stands either way, but the correct fix direction depends on the answer.
- The proration convention comment is new in this diff — if `/30` was the actual intended business rule and the comment is wrong, finding 4 inverts (fix the comment, not the math).

**Verdict:** blocker 6 · should-fix 5 · nit 0 → **BLOCK**
