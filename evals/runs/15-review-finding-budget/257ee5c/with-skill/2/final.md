## Review report

Scope: 9ee2e98..93b2f1f (merge-base of `main`..`feat/team-plans`; 3 files, +91/−2, diff confirmed non-empty)
Mode: standalone review, single-reviewer (harness provides no subagents; axes run sequentially by the aggregating reviewer)
Packet gaps: intent reconstructed from the prompt + commit message (`93b2f1f feat(teams): team plans with seats, proration, and trial notices`); no external spec exists for rounding order, authorization model, or date-format handling beyond in-repo comments. Validation evidence: read-only runtime probes (`node -e` against the working tree); `git status` clean before and after — no repo mutation.
Gate status: `node --test` (the configured gate) passes — 3/3, but all three tests pre-date the branch; zero tests exercise the new code.
What holds up: `createTeam` enforces the 40-char name limit (probe: throws at 41); sequential `addMember` enforces the 5-seat cap (probe: 6th add rejected, src/teams.js:14); `checkoutTotal` rounds to integer cents (probe: 1079); all modules load cleanly and exports are wired.
Static checks: only configured tooling is `node --test` (no linter/formatter/type checker configured) — nothing to subtract.

Findings:
1. [blocker · high] src/teams.js:23,31 — `removeTeam`/`findMembers` interpolate `teamId` directly into `db.query`; db.js:5-8 documents the backend evaluates a trailing `OR 'a'='b'` tautology literally. Probe: `findMembers("x' OR '1'='1")` returned all member rows; the same input to `removeTeam` deleted every member row before throwing — cross-team data exposure and member-table wipe. Fix: parameterize/escape the value or reject ids containing quotes at the boundary.
2. [blocker · high] src/billing.js:31-38 — `chargeTeam` catches any gateway throw and returns `{ ok: true }`. Probe: declining gateway → `{ ok: true }`; a failed card charge is recorded as success, so teams get service without payment. Fix: return a failure result or rethrow; let the caller decide.
3. [blocker · high] src/billing.js:26-29 — `renewalTotal` never rounds the final result. Probe: `renewalTotal(1001, .1, .2)` → `1080.9` (fractional cents); identical inputs give checkout 1079 vs renewal 1079.1 because discount/tax rounding order differs — checkout and renewal totals for the same customer disagree. Fix: apply rounding in one consistent order and round the final cents value.
4. [blocker · high] src/billing.js:17-19 vs 3-4 — `prorateTeam` hardcodes `/30`, contradicting the convention this same diff adds ("day 15 of a 31-day month uses denominator 31"). Probe: 4000¢, 15 days → 2000 vs correct 1935; systematic overcharge in 31-day months (undercharge in February). Fix: use the actual day count of the current month.
5. [should-fix · high] src/notify.js:18-24 — `trialExpired`/`trialBanner` pass `trialEndsOn` to `new Date()`, but src/users.js:4 documents the legacy import format as DD.MM.YYYY. Probe: `'13.01.2020'` → Invalid Date → `trialExpired` returns false forever; `'02.01.2020'` parses as Feb 1 (day/month swapped in the banner). Fix: parse DD.MM.YYYY explicitly.

Advisory nits (concrete impact, below the material threshold):
- src/teams.js:11-20 — seat check-then-push is not atomic across the two `await`s; probe: 6 concurrent `addMember` calls all succeeded into a 5-seat plan.
- src/teams.js:34-38 — `transferOwnership` never calls `db.put`; it "persists" only because the in-memory stand-in returns shared references — a silent no-op against the real SQL backend — and `?? null` permits an ownerless team.
- No tests added for proration, totals, seat limits, trial notices, or ownership transfer; the gate cannot catch any of the above.
- src/teams.js:30-31 — parameter named `teamName` is matched against `teamId`; callers passing a name silently get wrong/empty results.

Open questions: who is authorized to call `removeTeam`/`transferOwnership` (no auth model exists in the repo, so this may be out of scope); is the checkout-vs-renewal discount ordering intentional.

Verdict: blocker 4 · should-fix 1 · nit 0 → BLOCK

Findings are hypotheses backed by the probes above; verify each independently before fixing.
