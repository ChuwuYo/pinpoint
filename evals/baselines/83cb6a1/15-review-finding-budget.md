# After-evidence round 2: 15-review-finding-budget @ 83cb6a1

Same frozen scenario (rev 3, hash `0cbc9764`), 2 runs, 2 blind graders with exact agreement on every item. Skill under test: second 3.3 iteration (persisted-state blocker severity, repo-only reachability, pre-drop blocker re-check).

## Scores across all three rounds

| run | C1 | C2 | C3 | C4 | N1 | total |
|-----|----|----|----|----|----|-------|
| baseline 1 @8e4a574 | 0 | 1 | 1 | 0 | 0 | 2/5 |
| baseline 2 @8e4a574 | 0 | 1 | 1 | 0 | 0 | 2/5 |
| iter1 run 1 @91e14f1 | 0 | 0 | 1 | 0 | 1 | 2/5 |
| iter1 run 2 @91e14f1 | 0 | 1 | 1 | 0 | 0 | 2/5 |
| iter2 run 1 @83cb6a1 | 0 | 0→**1** | 1 | 0 | 1 | **3/5** |
| iter2 run 2 @83cb6a1 | 0 | 1 | 1 | 0 | 0 | 2/5 |

## What iteration 2 fixed

- **B7 demotion regression resolved**: merged single blocker in both runs (iteration 1 demoted it 1/2 via the hypothetical-external-layer evasion; the repo-only reachability rule closed that).
- Stable across both runs: B1, B4, B6 (both consequences), B7 merged, SF1 as should-fix finding, B2 as finding (semantic framing). 10 findings per run, no cap pressure, no budget-cited omissions.

## What persists — and why it is no longer a retention-rule problem

- **B3 missed 2/2 — now a composition gap, not praise.** Run 2 explicitly considered the mid-operation error path and declared it unreachable through the public API, *despite its own finding 9 verifying duplicate membership is reachable* — the exact composed path (duplicate userId → two array entries, one row → second `remove` of the same key throws mid-loop → team alive, members half-deleted). Both runs found the enabler; neither composed it. A single-reviewer reasoning limit, not addressable by another retention rule.
- **B5 missed 2/2 (1/6 across all after-runs)**: seat cap praised with sequential verification only; the concurrency check from the holds-up rule was applied to `removeTeam` (run 2) but not to `addMember`'s check-then-act. Flaky discovery.
- **Ground-truth debts (confirmed, 6/6 runs)**: (a) B2-as-injection is unexploitable against the fixture's tolerant `db.query` stand-in — reviewers repeatedly verify this by execution and find only the name/id mismatch (should-fix); the blocker label over-claims for this fixture. (b) SF2 classified blocker 6/6 under the defensible reading of the e28fc49 definition. Both debts move to scenario revision 4.
- **N1 ordering**: should-fix·medium before should-fix·high in run 2 (second consecutive violation).

## 3.3 disposition

The retention machinery the TODO items describe is now validated by evidence: all-blockers retention (10 findings, blockers first, no cap-bound reports since iteration 1), exact-duplicate merge (C2: 5/6 runs), multi-consequence naming (C3: 6/6), open-question boundary in both directions (B2/B7 evidence), pre-drop re-check (no budget-cited omission since the rule landed). The residual C1/C4 failures are (a) two ground-truth miscalibrations and (b) two discovery-depth limits (B3 defect composition, B5 race) that further rule edits cannot reach without overfitting to this fixture. Proposed: mark 3.3's rule items done-with-evidence, record B3/B5 as model capability boundary, and carry the two ground-truth debts into scenario revision 4 alongside 3.6/3.7 work.

Runs: `evals/runs/15-review-finding-budget/83cb6a1/with-skill/{1,2}/`. Fixture dirs deleted after grading.
