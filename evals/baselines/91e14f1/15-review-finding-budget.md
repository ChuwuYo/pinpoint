# After-evidence: 15-review-finding-budget @ 91e14f1

Same frozen scenario (rev 3, hash `0cbc9764`), same protocol as the baseline at `8e4a574`: 2 runs, 2 blind graders each, model kimi-for-coding/k3, 2026-08-07. Skill change under test: blocker retention + finding/question boundary + holds-up failure-mode check (`91e14f1`).

## Scores, before → after

| run | C1 | C2 | C3 | C4 | N1 | total |
|-----|----|----|----|----|----|-------|
| baseline 1 | 0 | 1 | 1 | 0 | 0 | 2/5 |
| baseline 2 | 0 | 1 | 1 | 0 | 0 | 2/5 |
| after 1    | 0 | 0 | 1 | 0 | 1 | 2/5 |
| after 2    | 0 | 1 | 1 | 0 | 0 | 2/5 |

Grader agreement: exact on every C* item for both after-runs. One N1 disagreement (after run 2) adjudicated against the skill's "Order by severity, then confidence" text — should-fix·medium finding preceded should-fix·high findings, N1=0. No third grader (disagreement non-critical).

C1/C4 still fail both runs: 3.3 is **not resolved**. But the failure mechanisms shifted substantially.

## What the skill change fixed (repeatable evidence)

- **B2 (SQL interpolation): baseline demoted/missed → after: a finding in both runs.** Run 1 as should-fix (wrong-results framing), run 2 as should-fix naming the injection pattern explicitly. The finding/question boundary fix worked 2/2.
- **SF1 (zero tests for new code): baseline static-check aside 2/2 → after: a should-fix finding in both runs.** 2/2.
- **B5 (check-then-act race): baseline missed 2/2 → after run 2 found it and verified it by executing 8 concurrent `addMember` calls settling on a 5-seat team** — the new holds-up rule surfaced in the report text ("Does not survive the concurrency check — see finding 2"). Run 1 still missed it (1/2).
- Finding counts rose from exactly-5 (cap-bound) to 8 and 11; run 2 reported 6 blockers with gate scores, consistent with all-blockers-retained.

## What regressed or persists

- **B3 (non-atomic removeTeam) still fails both runs, two different modes**: run 1 praised it in holds-up again (third consecutive praise); run 2 recognized the partial-cleanup defect but classed it **nit-tier and explicitly dropped it per the new budget rule** — a new failure mode created by the rule interaction (severity misjudgment + drop-nit-first → budget-cited blocker omission, auto-failing C4).
- **B7 regression in run 1**: baseline merged it both runs; after run 1 verified the defect (`sends mail to undefined`) yet demoted it to an open question on a hypothetical "join layer outside the diff" — the new boundary rule misapplied: reachability was judged against hypothetical external code instead of the repo.
- **SF2 over-escalation unchanged** (blocker in both runs, 4/4 across baseline+after). Reviewers reason that a failed charge reported as `{ ok: true }` is "a claim the evidence contradicts" per the e28fc49 blocker definition. This is defensible; the ground-truth should-fix label for SF2 is the likely miscalibration, recorded as a rubric debt, not a skill defect.
- **Ordering**: after run 2 violated severity-then-confidence within should-fix (medium before high).

## Next targeted changes (evidence-backed, second iteration)

1. Severity definitions: a reachable defect whose failure leaves persisted state inconsistent (partial write, orphaned/missing rows) is a blocker — targets B3's 3x praise + 1x nit-tier misclassification.
2. Boundary rule addendum: reachability is judged against code in the repo under review, not hypothetical layers outside the diff — targets the after-run-1 B7 demotion.
3. Budget rule addendum: before dropping a lower-severity candidate per the cap, re-check it against the blocker definition — a misclassified blocker may not be discarded as a nit — targets the after-run-2 B3 budget-drop.

Rubric debt: SF2 ground-truth severity (should-fix) is contradicted by 4/4 reviewer runs applying the e28fc49 blocker definition; consider relabeling ground truth to blocker at the next scenario revision and adjusting N1 accordingly.

Runs: `evals/runs/15-review-finding-budget/91e14f1/with-skill/{1,2}/`. Fixture dirs deleted after grading.
