## Review report

Scope: `main...feat/team-plans` (merge-base `9ee2e98` → head `93b2f1f`; 3 files, +91/−2)
Mode: single-reviewer (no subagents spawned; the 91-line diff across 3 files was coverable in one pass with full surrounding context read)
Packet gaps: no external issue/spec exists; intent taken unedited from the request ("team subscriptions: seats, proration, checkout/renewal totals, trial notices, and ownership transfer") plus commit message `93b2f1f` "team plans with seats, proration, and trial notices"
Gate status: `node --test` (repo's configured gate, whole suite) → **pass** (3/3, exit 0). No formatter/linter/typecheck/build configured in `package.json` → not applicable
What holds up:
- Existing API (`charge`, `invoiceLine`, `sendEmail`) untouched; base suite still green (evidence: `node --test` output above).
- Seat cap enforced before mutation against `PLANS.team.seats` (`src/teams.js:14-16`, `src/plans.js` team.seats=5).
- `checkoutTotal` rounds to integer cents (`src/billing.js:23`; verified `checkoutTotal(999,0.05,0.07) === 1015`).
- `createTeam` rejects over-long names (`src/teams.js:7`); new exports consistently wired in `module.exports`.
Static checks: only `node --test` is configured; it does not import or exercise any new code, so nothing is subtracted from the findings below by tooling.

Findings:
1. **[blocker · high]** `src/notify.js:19` and `src/notify.js:23` — `trialExpired`/`trialBanner` feed `user.trialEndsOn` to `new Date()`, but `src/users.js:3` declares the stored format is legacy `DD.MM.YYYY`. Verified on this repo's runtime (node v26.5.0): day ≤ 12 is silently parsed as US `MM.DD.YYYY` (`'07.08.2026'` → "Wed Jul 08 2026", month/day swapped → wrong banner, expiry evaluated a month early); day > 12 → `Invalid Date` → `trialExpired` returns `false` for already-expired trials (`'15.08.2026'` verified). The claimed "trial notices" feature is broken for the actual data format on every path — fix direction: parse `DD.MM.YYYY` explicitly (split and construct `new Date(y, m-1, d)`), never via the Date parser.
2. **[blocker · high]** `src/teams.js:23` and `src/teams.js:31` — `removeTeam` and `findMembers` interpolate input into a SQL string passed to `db.query`, whose own contract (`src/db.js:4-8`) implements unparameterized tautology semantics. Verified: `teamId = "' OR '1'='1"` returns **all** member rows across all teams — cross-tenant exposure via `findMembers`; via `removeTeam` every members row is deleted and then `db.remove('teams', ...)` throws for the non-literal id, leaving the members table mass-deleted with teams intact (partial state). Fix direction: never build SQL by interpolation — filter the table directly or add a parameterized query API.
3. **[blocker · high]** `src/billing.js:18` — `prorateTeam` hardcodes `/30`, contradicting the convention the same diff adds at `src/billing.js:3-4` ("per actual calendar day of the current month … 31-day month uses denominator 31"). Verified: day 15 of a 31-day month yields 2000¢ instead of 1935¢. The change's own stated contract is contradicted — fix direction: derive the denominator from the actual month's length (or pass it in).
4. **[blocker · high]** `src/billing.js:36` — `chargeTeam` swallows gateway failures and returns `{ ok: true }`, verified with a throwing gateway (`card declined` → `{ ok: true }`). Callers record a successful charge that never happened — fix direction: rethrow or return `{ ok: false, error }` and let the caller decide.
5. **[should-fix · high]** `src/billing.js:28` — `renewalTotal` never rounds the discounted result and applies operations in the opposite order to `checkoutTotal`, so identical inputs diverge and produce fractional cents (verified: `renewalTotal(999,0.05,0.07) === 1015.55` vs checkout `1015`). Fix direction: round the final cents and use one documented operation order for both totals.
6. **[should-fix · high]** `src/teams.js:36` — `transferOwnership` assigns `newOwnerId ?? null`, silently orphaning the team when the argument is missing, and never validates that the new owner exists (contrast `addMember`'s user lookup). Fix direction: require a non-null, existing user id and reject otherwise.
7. **[should-fix · high]** `src/notify.js:11,15` vs `src/teams.js:8` — `invoiceEmail`/`renewalNotice` read `team.owner.email`, but `createTeam` stores `owner` as an id string, so any team created by this diff yields recipient `undefined`. Fix direction: resolve the owner id through `db.lookup('users', …)` (or store the shape the notifiers expect) and align the contract.
8. **[should-fix · medium]** `src/teams.js:17-19` — `addMember` discards the `db.lookup('users', userId)` result, so nonexistent users are added, and nothing prevents the same user being added twice, consuming two seats. Fix direction: null-check the lookup and check `team.members.includes(userId)`.
9. **[should-fix · high]** `test/core.test.js` — the diff adds no tests; the three existing tests import none of the new modules. Seats, proration, totals, trial notices, and transfer all ship with zero coverage of the claimed mechanisms (every blocker above would have been caught by a direct test). Fix direction: add tests per claimed behavior, including the `DD.MM.YYYY` data path.

Advisory nits: none reported (noise budget: 4 blockers + 5 should-fix already at the 5-finding cap for non-blockers; a parameter-naming mismatch in `findMembers` — named `teamName`, compared against `teamId` — was re-checked against the blocker definition and dropped as the lowest-severity candidate).
Open questions: none — every reported defect was verified in code or by execution on the repo's runtime; reachability of the exported-but-uncalled functions is judged as public API surface of this library package.

Verdict: blocker 4 · should-fix 5 · nit 0 → **BLOCK**

Findings are hypotheses to verify independently; fix confirmed ones and reject false positives with evidence. The branch is not ready to merge.
