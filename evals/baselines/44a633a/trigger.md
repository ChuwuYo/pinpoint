# Trigger baseline — 44a633a (PR 6)

- Date: 2026-08-08. Sweep: 22 cases x 2 repetitions, automatic condition only,
  shuffled order per repetition (fresh session per run).
- Harness: opencode-task-subagent (general subagents). Adapter deviations and
  limitations per evals/harnesses/trigger.md 'Prompt-driven subagent adapter':
  full installed catalog (152 skills, snapshot in
  evals/trigger/runs/2026-08-08-k3-subagent/catalog-snapshot.txt); neutral
  safety wrapper after the case prompt; selection observed at decision point —
  authorization behavior under execution NOT measured; explicit condition not
  run; model identity inherited-unverified (kimi-for-coding/k3-256k).
- All five installed Pinpoint skills verified byte-identical to 44a633a.
- Precision/recall: allowed_secondary selections are not counted as false
  positives (authorized commit->pr sequences).
- Observations: zero Pinpoint misroutes; both refactor-no-defect cases
  consistently attracted non-Pinpoint catalog competitors
  (review-and-simplify-changes, karpathy-guidelines) with rep-level variance,
  supporting the Phase 7 'no Pinpoint route' boundary; authorized sequences
  selected pinpoint-commit + pinpoint-pr on every repetition; no stochastic
  disagreement between repetitions on this model.
- Caveat: runs executed against the live pinpoint working tree (unrelated
  uncommitted eval tooling visible to agents); routing decisions unaffected.

## Generated report

Runs: 44 total, 44 scored, 0 INVALID (excluded).

## automatic condition (44 runs)

### Outcomes

- correct: 44
- no-selection: 0
- wrong-selection: 0
- multi-selection: 0
- unauthorized-selection: 0

### Confusion matrix (expected -> selected)

| expected | pinpoint | pinpoint-review | pinpoint-commit | pinpoint-pr | pinpoint-help | none | multiple | non-pinpoint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pinpoint | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| pinpoint-review | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| pinpoint-commit | 0 | 0 | 8 | 0 | 0 | 0 | 4 | 0 |
| pinpoint-pr | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 |
| pinpoint-help | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 |
| none | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 4 |

### Per-skill precision / recall

| skill | precision | recall | tp | fp | fn |
| --- | --- | --- | --- | --- | --- |
| pinpoint | 1.00 | 1.00 | 6 | 0 | 0 |
| pinpoint-review | 1.00 | 1.00 | 10 | 0 | 0 |
| pinpoint-commit | 1.00 | 1.00 | 12 | 0 | 0 |
| pinpoint-pr | 1.00 | 1.00 | 4 | 0 | 0 |
| pinpoint-help | 1.00 | 1.00 | 4 | 0 | 0 |

### Read-only/mutating boundary misroutes: 0


### Critical-case failures: 0



