# Baseline: 15-review-finding-budget @ 8e4a574

Scenario revision 3 (frozen hash `0cbc9764`), condition `with-skill`, 2 repetitions, model kimi-for-coding/k3, 2026-08-07. Skill state: pinpoint-review after severity-boundary (e28fc49) and verdict-semantics (185d0f1) hardening, before any 3.3 retention-rule change.

## Results

| run | C1 | C2 | C3 | C4 | N1 | total | pass |
|-----|----|----|----|----|----|-------|------|
| 1   | 0  | 1  | 1  | 0  | 0  | 2/5   | no   |
| 2   | 0  | 1  | 1  | 0  | 0  | 2/5   | no   |

Two blind graders, exact agreement on every criterion for both runs; no third grader required. Raw scores not averaged.

## What survived (repeatable)

- C2: B7's two notify sites (`invoiceEmail` + `renewalNotice` derefing `team.owner.email` where owner is an ID string) merged into ONE finding in both runs — the exact-duplicate merge rule works.
- C3: B6 named with both consequences (trials never expire + "Invalid Date" banner) in both runs. Run 2 added a bonus third consequence (day ≤ 12 silently misparsed as MM.DD).
- Both runs correctly verdicted BLOCK.

## What failed (repeatable, 2/2 runs)

- **B3 (non-atomic removeTeam) was invisible**: both reviewers independently praised the member-first delete ordering in "What holds up" without recognizing the missing transaction. Neither run came close.
- **B5 (check-then-act race in addMember) was invisible**: not found in either run; the `await` between seat check and push was never scrutinized.
- **B2 (SQL interpolation) failed two different ways**: run 1 never found it; run 2 found it and explicitly demoted it to an open question ("harmless against the current stand-in... if the db is ever real").
- **N1**: SF2 (chargeTeam swallowing the gateway error) was over-escalated to blocker in both runs; SF1 (zero tests for new code) appeared only as a static-check aside, never as a should-fix finding. Ordering itself was severity-first and clean.

## Evidence for 3.3

The binding failure mechanism is **open-question demotion and holds-up praise, not the finding cap**. Neither run cited the cap or one-worst-per-axis to justify an omission; both runs landed on exactly 5 findings (the cap maximum — circumstantial, not proof of cap binding). The observed, repeatable rule violations:

1. A verified-true, reachable defect (B2 interpolation, proven by reading the code) was demoted to an open question because its *impact* depends on future db realism — the skill's "never promote uncertainty to a finding" is being over-applied to defects whose existence is certain and only whose blast radius is uncertain.
2. Defects requiring mechanism-level reasoning (B3 atomicity, B5 race) are actively misclassified as strengths when surface ordering looks correct.

Implication for the 3.3 skill change: the fix is primarily the **finding-vs-open-question boundary** (a defect verified true of the code and reachable is a finding even when intent/impact is partly ambiguous; open questions are for what cannot be settled by evidence), secondarily the cap/one-worst-per-axis retention rules. Severity calibration of swallowed-error (SF2 → blocker both runs) is a secondary signal consistent with the e28fc49 boundary discussion.

Runs: `evals/runs/15-review-finding-budget/8e4a574/with-skill/{1,2}/` (final.md, run.json, grade.json, grade.blind2.json). Fixture dirs deleted after grading.
