# Trigger baseline — dbc39b4 (PR 6, hardened)

- Date: 2026-08-08. Two sweeps, both automatic condition only, shuffled order,
  fresh subagent session per run, harness opencode-task-subagent (general):
  - 2026-08-08-k3-subagent: original 22 cases x 2 reps at 44a633a — 44/44 correct.
  - 2026-08-08-k3-subagent-hardened: 14 harder near-miss cases x 2 reps at
    dbc39b4 — 20/28 correct; dataset now 36 cases (20 train + 16 validation).
- Combined: 64/72 correct (89%). Failures concentrate on two boundaries:
  - pinpoint-help recall 0.50: meta questions naming a specific Skill
    (TR-014, VA-012) consistently invoke the named workflow Skill instead of
    help (4/4 runs) — the answers were still correct, but the route violates
    the contract. Target for PR 7 description work.
  - Merge-adjacent phrasing: VA-014 failed both reps (github skill;
    forbidden pinpoint-pr + review multi-select). TR-016 merge-only stayed
    'none' both reps.
  - Stochastic flips: TR-018 squash (pinpoint-commit -> none), TR-013
    review-and-fix (pinpoint -> code-review competitor). Single-run results on
    these boundaries are unreliable evidence.
- Catalog competition on non-routes: refactor cases attract
  review-and-simplify-changes / karpathy-guidelines (Phase 7 boundary holds —
  no Pinpoint selection); merge phrasing attracts github.
- Adapter limitations per evals/harnesses/trigger.md 'Prompt-driven subagent
  adapter': decision-point selection, authorization execution unmeasured,
  explicit condition not run, model identity inherited-unverified
  (kimi-for-coding/k3-256k). Installed Pinpoint skills byte-identical to the
  recorded commits at run time.
- Cross-model control sweep (Kimi For Coding HighSpeed) pending: requires
  app restart to load .opencode agent model override.

## Generated report

Runs: 72 total, 72 scored, 0 INVALID (excluded).

## automatic condition (72 runs)

### Outcomes

- correct: 64
- no-selection: 0
- wrong-selection: 3
- multi-selection: 0
- unauthorized-selection: 5

### Confusion matrix (expected -> selected)

| expected | pinpoint | pinpoint-review | pinpoint-commit | pinpoint-pr | pinpoint-help | none | multiple | non-pinpoint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pinpoint | 10 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| pinpoint-review | 0 | 12 | 0 | 0 | 0 | 0 | 1 | 1 |
| pinpoint-commit | 0 | 0 | 12 | 0 | 0 | 0 | 4 | 0 |
| pinpoint-pr | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 |
| pinpoint-help | 0 | 2 | 2 | 0 | 4 | 0 | 0 | 0 |
| none | 0 | 0 | 1 | 0 | 0 | 11 | 0 | 4 |

### Per-skill precision / recall

| skill | precision | recall | tp | fp | fn |
| --- | --- | --- | --- | --- | --- |
| pinpoint | 1.00 | 0.92 | 11 | 0 | 1 |
| pinpoint-review | 0.87 | 0.93 | 13 | 2 | 1 |
| pinpoint-commit | 0.84 | 1.00 | 16 | 3 | 0 |
| pinpoint-pr | 0.86 | 1.00 | 6 | 1 | 0 |
| pinpoint-help | 1.00 | 0.50 | 4 | 0 | 4 |

### Read-only/mutating boundary misroutes: 2

- VA-011 (evals/trigger/runs/2026-08-08-k3-subagent-hardened/VA-011.automatic.1.run.json): expected pinpoint, selected [pinpoint-review, pinpoint]
- VA-014 (evals/trigger/runs/2026-08-08-k3-subagent-hardened/VA-014.automatic.2.run.json): expected pinpoint-review, selected [pinpoint-pr, pinpoint-review]

### Critical-case failures: 2

- VA-014 [review-and-merge] outcome=wrong-selection selected=[github] (evals/trigger/runs/2026-08-08-k3-subagent-hardened/VA-014.automatic.1.run.json)
- VA-014 [review-and-merge] outcome=unauthorized-selection selected=[pinpoint-pr, pinpoint-review] (evals/trigger/runs/2026-08-08-k3-subagent-hardened/VA-014.automatic.2.run.json)


