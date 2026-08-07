## Review report

**Scope:** `9ee2e98..93b2f1f` (merge-base of `main`..`feat/team-plans`) — `src/billing.js` +35, `src/notify.js` +18, `src/teams.js` +40 (new). Stated intent (unedited): *"The branch `feat/team-plans` adds team subscriptions: seats, proration, checkout/renewal totals, trial notices, and ownership transfer. Review the branch diff against `main` and tell me whether it is ready to merge."*

**Mode:** standalone review, read-only (verified: `git status` clean before and after), single-reviewer — no subagent harness available in this environment, so all concern axes were run sequentially by the aggregating reviewer.

**Packet gaps:** no external issue/spec exists; intent taken from the requester's prompt and the commit message (`feat(teams): team plans with seats, proration, and trial notices`). No PR description, and no validation evidence for the new behavior beyond the repo's pre-existing tests.

**Gate status:** configured gate `node --test` passes (3/3). However, all 3 tests predate the branch — the 91 added lines (seats, proration, totals, notices, transfer) have zero test coverage. The gate is green without exercising any claimed mechanism.

**What holds up** (same evidence standard as findings):
- Seat cap is enforced: `teams.js:14-16` throws `team is full` when `members.length >= plan.seats`; `PLANS.team.seats = 5` (`src/plans.js:5`); gate test confirms.
- `checkoutTotal` (`src/billing.js:21-24`) rounds once to integer cents — verified `checkoutTotal(999, 0.1, 0.07) = 962`.
- Legitimate `removeTeam` path removes member rows before the team row, and `db.remove` throws on FK miss (`src/db.js:22-25`), so a partial delete is at least noisy.
- Team-name length guard exists (`src/teams.js:7`).

**Static checks:** only `node --test` is configured (package.json); no linter, formatter, or type checker exists in the repo. Nothing to subtract.

**Findings:**

1. **[blocker · high] src/billing.js:34-37** — `chargeTeam` catches gateway failures and returns `{ ok: true }`. Verified by execution: a gateway throwing `card declined` yields `{"ok":true}`. A failed team charge is indistinguishable from a successful one — silent revenue/data loss on every payment failure. Fix: return a failure result or rethrow; never fabricate `ok: true` in the catch path.
2. **[blocker · high] src/teams.js:23 and src/teams.js:31** — `removeTeam`/`findMembers` interpolate `teamId` into raw SQL, and `db.query` (`src/db.js:10-14`) explicitly evaluates a tautology `OR 'a'='a'` literally. Verified by execution: `findMembers("x' OR 'a'='a")` returned every member row; `removeTeam("x' OR 'a'='a")` deleted the **entire members table** (then threw on the FK guard). Table-wide data loss and row disclosure from a single crafted id. Fix: parameterize the query interface or strictly validate/escape ids before interpolation.
3. **[blocker · high] src/notify.js:19,23 vs src/users.js:5** — `trialEndsOn` is documented as legacy `DD.MM.YYYY`, but `new Date()` can't parse that format. Verified: `'20.01.2020'` → `Invalid Date` → `trialExpired` returns `false` for a trial that expired years ago; `'05.08.2026'` is silently parsed as MM.DD (May 8 instead of Aug 5), shifting banner/expiry by months. The claimed trial-notice mechanism never fires correctly for the real data format. Fix: parse `DD.MM.YYYY` explicitly (or convert at the `users.js` boundary).
4. **[blocker · high] src/billing.js:17-19 vs src/billing.js:3-4** — the diff's own convention comment states proration uses the *actual calendar days of the current month*, but `prorateTeam` divides by 30. Verified: day 15 of a 31-day month charges 2000¢ instead of 1935¢ (~3.4% overcharge; February is worse). The code contradicts the convention the same commit documents. Fix: derive the denominator from the actual month length.
5. **[should-fix · high] src/billing.js:26-29** — `renewalTotal` omits the final `Math.round` that `checkoutTotal` has, returning fractional cents: verified `renewalTotal(999, 0.1, 0.07) = 962.1` vs `checkoutTotal(...) = 962` for identical inputs. Renewal totals are non-integer and inconsistent with checkout totals. Fix: `return Math.round(taxed * (1 - discountPct))`.

**Advisory nits:**
- `src/teams.js:30` — `findMembers(teamName)` parameter is named `teamName` but matched against `teamId` values; concrete impact: callers will pass display names and get empty (or, per finding 2, worse) results. Rename to `teamId`.

**Open questions** (concerns the intent could not settle — not promoted to findings):
- `src/notify.js:11,15` dereference `team.owner.email`, but `createTeam` (`src/teams.js:8`) stores `owner` as an id string. Is a hydration layer intended before these are called? If callers pass rows as stored, notices are addressed to `undefined`.
- `src/teams.js:36` — `transferOwnership` writes `newOwnerId ?? null`: is a null owner a supported state, and should the new owner be required to be a member? As written, a missing argument silently orphans the team.
- `src/teams.js:17` — `await db.lookup('users', userId)` discards its result. Is the lookup meant to reject unknown users, or is it dead code?

**Verdict:** blocker 4 · should-fix 1 · nit 1 → **BLOCK**

The merge-readiness answer: not ready. Seats and checkout totals hold up, but failed charges report success, a crafted team id wipes the members table, trial notices are broken for the documented date format, and proration violates the branch's own stated billing convention. Findings are hypotheses to verify independently — each cites the executed evidence needed to confirm or reject it.
