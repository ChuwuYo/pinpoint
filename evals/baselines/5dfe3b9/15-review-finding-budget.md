# Revision 4 spot-check: 15-review-finding-budget @ 5dfe3b9

Scenario rev 4 (frozen hash `8c40c70b`, both ground-truth debts settled), 2 runs, 2 blind graders with exact agreement on every item. Skill unchanged since `83cb6a1`.

## Results

| run | C1 | C2 | C3 | C4 | N1 | total |
|-----|----|----|----|----|----|-------|
| rev4 run 1 | 0 | 1 | 1 | 0 | 0 | 2/5 |
| rev4 run 2 | **1** | 1 | 1 | **1** | **1** | **5/5 PASS** |

**Run 2 is the first full PASS in scenario 15 history** (eight graded runs across four commits).

## What rev 4 changed in reviewer behavior

- **B2 settled**: run 1 found the executable injection AT the findMembers site (`findMembers("x' OR 'a'='a")` → all member rows, cross-team disclosure). Run 2 found the injection class at removeTeam and the findMembers semantic mismatch (should-fix) — counted present per the rev 3 note. No more unprovability demotions.
- **B3's composition barrier dissolved**: the naive stand-in made removeTeam non-atomicity reachable through the injection path (tautology id → all member rows deleted → FK throw → teams alive, members wiped). BOTH runs found it as a blocker naming the inconsistent persisted state — after 6 consecutive misses/praises on the duplicate-membership composition path.
- **B5 found 1/2** (run 2: TOCTOU verified with 6 members in a 5-seat plan) — still flaky, consistent with the capability-boundary record.
- **B8 (formerly SF2)**: labeled blocker 2/2, now matching ground truth — no more severity-mislabel noise in N1.

## Residual

- B5 remains the only flaky discovery (2/8 runs overall). N1 ordering violated again in run 1 (should-fix high after mediums — third occurrence; the rule exists, compliance is inconsistent).

## 3.3 final disposition

Confirmed closed. The retention rules landed in `91e14f1`/`83cb6a1` produce PASS-capable reviews when the ground truth is honestly calibrated: run 2 retained all 8 blockers with correct merging (C2), multi-consequence naming (C3), clean ordering (N1), and zero budget-cited omissions (C4). The four-commit arc (baseline 2/5,2/5 → iter1 2/5,2/5 → iter2 3/5,2/5 → rev4 2/5,**5/5**) is the complete evidence chain: first two iterations fixed retention/demotion, rev 4 fixed the fixture, and the previously "invisible" B3 turned out to be fixture-limited, not model-limited.

Runs: `evals/runs/15-review-finding-budget/5dfe3b9/with-skill/{1,2}/`. Fixture dirs deleted after grading.
