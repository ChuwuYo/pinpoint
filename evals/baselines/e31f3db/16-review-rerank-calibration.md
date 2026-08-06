# Baseline: 16-review-rerank-calibration @ e31f3db

Scenario rev 1 fixture (frozen hash `eaeabea9`), 2 runs, 2 blind graders with exact agreement on every item. Skill state: `83cb6a1` content (pinpoint_commit e31f3db). Rubric rev 1 scores below; rev 2 rescore after the F3 ground-truth relabel at the bottom.

## Rubric rev 1 scores

| run | C1 | C2 | C3 | C4 | N1 | N2 | total |
|-----|----|----|----|----|----|----|-------|
| 1   | 0  | 0  | 1  | 0  | 1  | 1  | 3/6   |
| 2   | 1  | 0  | 1  | 0  | 1  | 1  | 4/6   |

## What the baseline established

- **C3 tooling subtraction: clean 2/2.** Both runs explicitly subtracted the eslint pair (eqeqeq, no-unused-vars on batch.js) from findings and routed the diff-caused lint failure into the verdict. This validates the 3.4 subtraction rule end-to-end.
- **N1 fix-unknown honesty: clean 2/2.** U1 (listener accumulation) surfaced with concrete honest fix directions, no speculative patches.
- **N2 gate evidence: clean 2/2.** Both runs disclosed second-pass dispositions with 0-10 scores; run 2 additionally disclosed the pre-drop blocker re-check ("re-read against the blocker definition before accepting severity") — the 83cb6a1 rule observed in the wild.
- **F1/F2 baits handled perfectly 2/2**: nobody claimed the pageCount off-by-one or the addFeeRate shared mutation; both were verified correct and either held up or nit-level-noted without the false claim.
- **F3 debt (third of its kind)**: both runs verified the eval sink's deadness ("no in-repo caller exists yet") and both kept it as should-fix with a future-caller argument. As with SF2, the reviewers' position is defensible and my drop-or-fail label was the miscalibration — an exported eval sink in a public module API is not "unreachable" in the way the label assumed.
- **C4 repeatability fails on a genuine T3 flip**: run 1 praised `?? 0` tolerance as a verified strength; run 2 reported the same line as a should-fix divergence from `reserve`'s throw. Identical evidence, opposite dispositions — same discovery-flakiness family as B5 (capability boundary, not a gate-rule gap).

## Rubric rev 2 rescore (same reports, corrected F3 label)

F3 relabeled: may survive at most as should-fix acknowledging the missing caller. Both runs satisfy this (should-fix, deadness explicitly acknowledged in both).

| run | C1 | C2 | C3 | C4 | N1 | N2 | total |
|-----|----|----|----|----|----|----|-------|
| 1   | 0  | 1  | 1  | 0  | 1  | 1  | 4/6   |
| 2   | 1  | 1  | 1  | 0  | 1  | 1  | 5/6   |

## 3.6 disposition

The re-rank gate is calibrated adequately for its purpose: precision work (F1/F2 verification, tooling subtraction, severity discounting with deadness acknowledgment) is repeatable 2/2; recall is strong when discovery happens (T1/T2 2/2, T3 1/2); the disclosed gate scores provide the N2 evidence that 0-10 scoring plus the pre-drop re-check produces sensible dispositions. No rule change warranted — the one critical failure (C4 T3 flip) is discovery flakiness, recorded as capability boundary alongside B5. Rubric rev 2 carries the F3 relabel.

Runs: `evals/runs/16-review-rerank-calibration/e31f3db/with-skill/{1,2}/`. Fixture dirs deleted after grading.
