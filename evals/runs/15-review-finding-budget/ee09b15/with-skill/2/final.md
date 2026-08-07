## Review report

**Scope:** `9ee2e98..feat/team-plans` (93b2f1f) — merge-base of `main`; diff touches `src/billing.js`, `src/notify.js`, `src/teams.js` (new), +91/−2. Intent: *"adds team subscriptions: seats, proration, checkout/renewal totals, trial notices, and ownership transfer"* (user request; commit 93b2f1f says the same). Validation evidence: I executed the code paths directly with node one-liners; each finding below carries reproduced output. Review was read-only — `git status --porcelain` clean before and after.

**Mode:** Standalone, single-reviewer (no subagents available); axes run sequentially.

**Packet gaps:** No external spec/issue beyond the one-line intent; no README/AGENTS/repo rules found (only `package.json`, `.gitignore`). No PR description. Claims reconstructed from the prompt and commit message.

**Gate status:** `node --test` passes (3/3, exit 0) — but all 3 tests exercise only pre-merge code (`users`, `charge`, `PLANS`); none of the 13 new/changed functions are executed. Green gate ≠ validated change here.

**What holds up:**
- Seat cap enforces `PLANS[team.plan].seats` (teams.js:13–16 ↔ plans.js:5); 40-char name limit enforced (teams.js:7).
- `checkoutTotal` rounds to integer cents (reproduced: `checkoutTotal(4000, 0.333, 0.10) → 2935`).
- All claimed surface exists and is exported: proration, both totals, `chargeTeam`, both notices, trial helpers, teams CRUD + `transferOwnership`.
- Pre-existing exports and behavior preserved; old tests still pass.

**Static checks:** Only configured tooling is `node --test` (passes); no formatter, linter, type checker, or build configured. Nothing subtracted — the gate covers none of the diff.

**Findings:**
1. **[blocker · high]** `src/billing.js:31–38` — `chargeTeam` catches gateway failure and returns `{ ok: true }`. Reproduced: a throwing gateway yields `{"ok":true}` after `console.warn`. A failed payment is indistinguishable from success — teams get service without being charged. Fix: return `{ ok: false, error }` or rethrow; never synthesize success.
2. **[blocker · high]** `src/teams.js:23,31` — `teamId`/`teamName` interpolated raw into `db.query`. `db.js:5–9` explicitly models tautology injection. Reproduced: `findMembers("x' OR '1'='1")` returned **all** member rows; `removeTeam("t1' OR '1'='1")` deleted **every member of every team** (0 rows left) before throwing on the team delete — cross-team data loss plus a half-completed delete. Fix: parameterize the query layer or add a parameterized lookup to `db`.
3. **[blocker · high]** `src/billing.js:17–19` — `prorateTeam` hardcodes `/30`, contradicting the convention added in the same diff (billing.js:3–4: *"per actual calendar day… 31-day month uses denominator 31"*). Reproduced: day 15 of a 31-day month at 4000¢ → code 2000¢, convention 1935¢ (~3% overcharge). Fix: pass days-in-month (or compute from the current date) as the denominator.
4. **[blocker · high]** `src/notify.js:18–24` — `new Date(user.trialEndsOn)` on the documented legacy `DD.MM.YYYY` format (users.js:5). Reproduced both failure modes: day > 12 (`'15.08.2026'`) → `Invalid Date` → `trialExpired` is **always false** (expired trials never flagged) and the banner renders `"trial ends Invalid Date"`; day ≤ 12 (`'07.08.2026'`) is silently parsed as MM.DD.YYYY (7 Aug → Jul 8). The claimed trial-notice feature is wrong or dead for all legacy users. Fix: parse `DD.MM.YYYY` explicitly before constructing the Date.
5. **[should-fix · high]** `src/notify.js:11,15` vs `src/teams.js:8` — `createTeam` stores `owner` as an id **string**, but `invoiceEmail`/`renewalNotice` read `team.owner.email`. Reproduced: `invoiceEmail({owner:'owner-id-string'}, …)` sends to `undefined` and still returns `{ok:true}` — renewal/invoice notices silently misdelivered for any team created through `createTeam`. Fix: unify the contract (store owner id and look up the user, or hydrate `owner` before calling notify).

**Advisory nits (concrete impact, bounded):**
- `src/billing.js:26–29` — `renewalTotal` never rounds the final discount step: reproduced `renewalTotal(4000, 0.333, 0.10) → 2934.8` fractional cents, while `checkoutTotal` returns `2935`. Same inputs, one-cent divergence between checkout and renewal totals.
- `test/core.test.js` — unchanged by the diff; zero tests for proration, totals, `chargeTeam`, trial helpers, or any `teams.js` behavior. Any of findings 1–5 would ship green.
- `src/teams.js:17–19` — `db.lookup('users', userId)` result discarded (missing users join silently; `lookup` returns `null`, doesn't throw), and no duplicate check — re-adding a member inflates seat usage and overwrites the `members` row.

**Open questions (intent could not settle; not promoted to findings):**
- `src/teams.js:34–38` — `transferOwnership`: is `newOwnerId ?? null` (silently orphaning the team when the arg is omitted) intended? Should the new owner be validated as an existing user/member? And there is no `db.put` — persistence currently relies on the in-memory stand-in returning the stored object by alias; against the real SQL backend this models, the transfer would silently not persist.
- `src/teams.js:30–31` — `findMembers(teamName)` filters the `teamId` column: is the parameter meant to be a team id or a display name? As written, a name returns nothing unless name === id.

**Re-rank gate:** findings 1–5 scored correctness 10 / actionability 8–10 (each reproduced by execution, each has a concrete fix); no zeros dropped. Nits kept only with demonstrated impact.

**Verdict: blocker 4 · should-fix 1 · nit 3 → BLOCK.** Not ready to merge: silent payment-failure success, injectable mass member deletion, proration contradicting the branch's own stated convention, and trial notices broken for the documented legacy date format. Findings are hypotheses backed by reproductions — verify each independently before fixing.
