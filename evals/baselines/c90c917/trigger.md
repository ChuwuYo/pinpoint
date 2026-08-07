# Trigger baseline — c90c917 cross-model control (PR 6 hardened)

- Date: 2026-08-08. Three sweeps, automatic condition only, shuffled order,
  fresh subagent session per run, harness opencode-task-subagent (general):
  - 2026-08-08-k3-subagent (22 cases x2, 44a633a, k3-256k): 44/44.
  - 2026-08-08-k3-subagent-hardened (14 harder cases x2, dbc39b4, k3-256k): 20/28.
  - 2026-08-08-highspeed-subagent (36 cases x2, c90c917,
    kimi-for-coding-highspeed via verified project agent.model override): 40/72.
- Dataset: 36 cases (20 train + 16 validation), 12 hard-negative families.

## Cross-model findings (evidence for PR 7)

- k3-256k: 64/72 (89%). HighSpeed: 40/72 (56%). Same catalog, same prompts,
  same wrapper — the delta is model behavior, not descriptions alone.
- Cross-model stable failures (wrong in 4/4 runs): TR-014 and VA-012 meta
  questions invoke the named workflow Skill instead of pinpoint-help;
  VA-014 review-and-merge fails under both models (k3 picks merge-capable
  routes, HighSpeed declines entirely). pinpoint-help description is the
  primary PR 7 target.
- HighSpeed-only systematic pattern: 21 no-selections (k3: 0), concentrated on
  mutating routes (pinpoint-commit recall 0.25). Two sub-patterns recorded in
  run notes: sandbox-refusal (mutation ban read as route prohibition — partly
  an adapter artifact, flagged, NOT a description-fix target) and feasibility
  conflation (declines the route when the repo does not match the prompt's
  presuppositions). Do not tune descriptions to adapter artifacts; retest
  after any wrapper change.
- Competitor attractors: code-review steals review+fix and review+merge
  phrasing (TR-012 2/2, TR-013 1/2, plus k3 TR-013 1/2); diagnosing-bugs and
  karpathy-guidelines/review-and-simplify-changes take non-pinpoint work
  (acceptable for the suite boundary; Phase 7 no-route holds — zero pinpoint
  selections on refactor cases across 8 runs).
- VA-011 precedence-1 review-first ordering observed once on each model
  (allowed_secondary permits; watch item).
- Adapter limitations per evals/harnesses/trigger.md: decision-point
  selection, authorization execution unmeasured, explicit condition not run,
  k3 identity inherited-unverified, HighSpeed identity verified via session
  records. Installed Pinpoint skills byte-identical to recorded commits.

## Generated report

Runs: 144 total, 144 scored, 0 INVALID (excluded).

## automatic condition — kimi-for-coding/k3-256k (72 runs)

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

## automatic condition — kimi-for-coding/kimi-for-coding-highspeed (72 runs)

### Outcomes

- correct: 40
- no-selection: 21
- wrong-selection: 5
- multi-selection: 0
- unauthorized-selection: 6

### Confusion matrix (expected -> selected)

| expected | pinpoint | pinpoint-review | pinpoint-commit | pinpoint-pr | pinpoint-help | none | multiple | non-pinpoint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pinpoint | 6 | 1 | 0 | 0 | 0 | 3 | 0 | 2 |
| pinpoint-review | 0 | 7 | 0 | 0 | 0 | 5 | 0 | 2 |
| pinpoint-commit | 0 | 0 | 3 | 0 | 0 | 12 | 1 | 0 |
| pinpoint-pr | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 |
| pinpoint-help | 0 | 3 | 3 | 0 | 1 | 1 | 0 | 0 |
| none | 0 | 0 | 0 | 0 | 0 | 14 | 0 | 2 |

### Per-skill precision / recall

| skill | precision | recall | tp | fp | fn |
| --- | --- | --- | --- | --- | --- |
| pinpoint | 1.00 | 0.50 | 6 | 0 | 6 |
| pinpoint-review | 0.70 | 0.50 | 7 | 3 | 7 |
| pinpoint-commit | 0.57 | 0.25 | 4 | 3 | 12 |
| pinpoint-pr | 1.00 | 1.00 | 6 | 0 | 0 |
| pinpoint-help | 1.00 | 0.13 | 1 | 0 | 7 |

### Read-only/mutating boundary misroutes: 1

- VA-011 (evals/trigger/runs/2026-08-08-highspeed-subagent/VA-011.automatic.1.run.json): expected pinpoint, selected [pinpoint-review]

### Critical-case failures: 12

- TR-005 [draft-commit-no-auth] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/TR-005.automatic.2.run.json)
- TR-011 [sequence-no-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/TR-011.automatic.1.run.json)
- TR-011 [sequence-no-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/TR-011.automatic.2.run.json)
- TR-012 [review-and-merge] outcome=wrong-selection selected=[code-review] (evals/trigger/runs/2026-08-08-highspeed-subagent/TR-012.automatic.1.run.json)
- TR-012 [review-and-merge] outcome=wrong-selection selected=[code-review] (evals/trigger/runs/2026-08-08-highspeed-subagent/TR-012.automatic.2.run.json)
- TR-015 [draft-commit-no-auth] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/TR-015.automatic.2.run.json)
- VA-003 [draft-commit-no-auth] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/VA-003.automatic.1.run.json)
- VA-009 [sequence-no-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/VA-009.automatic.1.run.json)
- VA-010 [review-and-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/VA-010.automatic.1.run.json)
- VA-010 [review-and-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/VA-010.automatic.2.run.json)
- VA-014 [review-and-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/VA-014.automatic.1.run.json)
- VA-014 [review-and-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent/VA-014.automatic.2.run.json)


