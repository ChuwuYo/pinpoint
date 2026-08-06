## Review report

**Scope:** main..feat/team-plans (1 commit, 07ab5de; +91/−2 across src/billing.js, src/notify.js, src/teams.js) · **Packet gaps:** no external issue/spec — intent reconstructed from the request and the commit message; no author-supplied validation evidence beyond the unchanged test suite · **Mode:** single-reviewer (subagents unavailable); axes 1–7 run sequentially per the skill.

**What holds up (evidence-checked):**
- Seat cap is enforced *before* mutation: `addMember` checks `team.members.length >= plan.seats` against `PLANS.team.seats = 5` and throws prior to any write (src/teams.js:13-16, src/plans.js:5).
- `checkoutTotal` produces integer cents with a single final `Math.round` (src/billing.js:21-24; verified: `checkoutTotal(999,0.15,0.08) = 917`).
- `removeTeam` deletes child rows before the team row, matching `db.remove`'s FK throw contract (src/teams.js:22-28, src/db.js:18-21); executed removal of a team with members leaves no orphaned member rows.
- Existing exports and `sendEmail`'s signature are unchanged; prior callers unaffected.

**Static checks:** `npm test` (node --test) is the only configured check — 3/3 pass. It enforces nothing about the new code (suite untouched by the diff), so nothing was subtracted except trivial coverage of pre-existing behavior.

**Findings:**

1. **[blocker · high]** src/billing.js:17-19 — `prorateTeam` hardcodes `/30`, contradicting the convention documented in the same file (src/billing.js:3-4: "per actual calendar day of the current month… denominator 31") — proration over/under-charges against the service's own stated contract (verified: 3100¢ at day 15 of a 31-day month yields 1550¢ vs the documented 1500¢) — fix: derive the denominator from the actual days in the current month.
2. **[blocker · high]** src/billing.js:26-29 — `renewalTotal` rounds after tax then multiplies by `(1 - discountPct)` with no final round — returns fractional cents and diverges from checkout for identical inputs (verified: `renewalTotal(999,0.15,0.08) = 917.15` vs `checkoutTotal(...) = 917`) — fix: round the final result to integer cents and align the discount/tax ordering policy with `checkoutTotal`.
3. **[blocker · high]** src/billing.js:31-37 — `chargeTeam` catches gateway failure, logs, and returns `{ ok: true }` — a failed charge is reported as success to every caller (verified: throwing gateway → `{"ok":true}`), so unbilled teams will be treated as paid — fix: return a failure result or rethrow; never synthesize `ok:true` on error.
4. **[blocker · high]** src/notify.js:18-24 vs src/users.js:5 — `trialEndsOn` is documented as legacy `DD.MM.YYYY`, which `new Date()` cannot parse — `new Date('31.08.2026')` → Invalid Date, so `trialExpired` returns false even for long-expired trials and `trialBanner` renders "trial ends Invalid Date"; ambiguous dates misparse (`'05.08.2026'` → May 8) (verified on this Node) — trial notices are wrong for all users on the documented format — fix: parse `DD.MM.YYYY` explicitly (split → `new Date(y, m-1, d)`) before comparing or formatting.
5. **[blocker · high]** src/notify.js:10-16 vs src/teams.js:8 — `createTeam` stores `owner` as an id string, but `invoiceEmail`/`renewalNotice` read `team.owner.email` → `undefined`; `sendEmail` then reports `{ok:true}` for a notice addressed to `undefined` (verified) — the claimed renewal/invoice notices never reach an owner for any team created via the supported path — fix: resolve the owner id through `db.lookup('users', team.owner)` before reading `email`.
6. **[should-fix · high]** src/teams.js:30-32 — `findMembers(teamName)` interpolates its parameter as `teamId`; member rows store the id, so `findMembers('Acme')` returns `[]` while `findMembers('t1')` works (verified) — silently empty results for the signature's documented input — fix: rename the parameter to `teamId` or resolve name → id first.
7. **[should-fix · high]** src/teams.js:17 — `addMember` awaits `db.lookup('users', userId)` and discards the result; nonexistent users are added (verified: `'u9'` joined with an empty users table) — dead-code lookup masquerading as validation — fix: throw when the lookup returns null.
8. **[should-fix · high]** test/core.test.js:1-22 — suite is unchanged; none of the claimed mechanisms (proration, totals, seat enforcement, transfer, trial notices) has a test, and all five blockers above pass the current suite (verified 3/3) — fix: add tests pinning the documented proration convention, integer-cent totals, charge-failure propagation, DD.MM.YYYY parsing, and owner-email resolution.
9. **[should-fix · medium]** src/teams.js:34-38 — `transferOwnership` writes `owner = newOwnerId ?? null` with no existence or membership check — an omitted/typo'd id silently leaves the team ownerless (verified: owner `null` after `transferOwnership('t1', undefined)`) — fix: require a valid user id and reject null/unknown owners.
10. **[should-fix · medium]** src/teams.js:18-19 — no duplicate check in `addMember`: the same `userId` can be pushed twice into `team.members` while the `members` Map keeps one row, so the two membership stores diverge and seat counting inflates — fix: reject existing members and treat one store as canonical.

*Re-rank gate:* all ten findings scored ≥8 on correctness (1–8, 10 verified by read-only execution) and ≥8 on actionability; none dropped. *Dropped candidates:* SQL injection via interpolated queries (teams.js:23,31) — executed against the repo's actual `db.query`, whose greedy exact-match stand-in tolerates embedded quotes; no reachable wrong behavior in-repo, so per the skill's reachability rule it is an open question, not a finding.

**Open questions:**
- If src/db.js's in-memory stand-in is ever swapped for a real SQL backend, the string-interpolated queries (src/teams.js:23, 31) become injectable — is a backend swap on the roadmap?
- What is the gateway contract for `chargeTeam` — sync throw or async rejection? The try/catch covers only synchronous failures.
- Should the owner count against a team's seats? `addMember` counts only `members`, not the owner; the intent doesn't say.

**Verdict:** blocker 5 · should-fix 5 · nit 0 → **BLOCK**

Working tree verified clean (`git status` — no mutations; review was strictly read-only).
