# Trigger after-sweep — d2e499e PR 7 descriptions (HighSpeed)

- Date: 2026-08-08. One sweep, automatic condition only, shuffled order,
  fresh subagent session per run, harness opencode-task-subagent (general):
  - 2026-08-08-highspeed-subagent-pr7 (36 cases x2, d2e499e,
    kimi-for-coding-highspeed via project agent.model override pinned at
    6870271 and verified against opencode session records): **49/72**.
- Baseline for comparison: 2026-08-08-highspeed-subagent (c90c917,
  catalog rev 1): 40/72 (`evals/baselines/c90c917/trigger.md`).
- Dataset unchanged: 36 cases (20 train + 16 validation), 12 hard-negative
  families. Catalog revision 2 (PR 7 description tightening); installed
  catalog otherwise byte-identical to the rev-1 snapshot (152 entries).
- Protocol note: the first after-sweep pass accidentally reused 12
  pre-hardening prompts under hardened case IDs (TR-005/006/010/011/014/015/
  017/018/019, VA-005/010/015). Those 24 runs were discarded unrecorded and
  re-run with the correct hardened prompts; rep 1 was re-run in full (36
  cases) because per-case outcomes from the first pass were not fully
  preserved. All 72 recorded runs use the hardened prompts verbatim.

## Before/after findings (PR 7 targets)

- Headline: 40/72 (56%) -> 49/72 (68%). Critical-case failures 12 -> 9.
- Primary targets fixed:
  - TR-012 (review-and-merge, critical): 0/2 -> 2/2. Baseline pulled
    code-review on both reps; after PR 7 pinpoint-review's merge-refusal
    boundary and the narrowed competitors, both reps select pinpoint-review
    and refuse the merge.
  - VA-012 (help, zh meta question): 0/2 -> 2/2. pinpoint-help now claims
    "will skill X do Y" boundary questions; was github/wrong-selection in
    the baseline.
- Secondary improvements:
  - VA-011 (review-and-fix precedence): 0/2 -> 1/2. Rep 2 routes pinpoint
    primary (contract-correct); rep 1 still review-led (wrong-selection,
    boundary misroute).
  - TR-011 (critical sequence-no-merge): 0/2 -> 1/2 (both allowed skills
    selected on rep 2).
  - VA-010 (critical review-and-merge, en): 0/2 -> 1/2.
  - VA-001, TR-002, TR-006, TR-019: +1 each (rep-level).
- Single-rep regressions (watch items, r2 correct in each): TR-004 2->1,
  TR-007 2->1 (feasibility conflation on pr-draft). VA-007 rep 1 attracted
  review-and-simplify-changes exactly like both baseline reps — non-pinpoint
  competitor, no pinpoint selection, contract holds; not a regression.
- Unchanged stable failures:
  - TR-014 (help meta question naming pinpoint-review): 0/2,
    unauthorized-selection both reps — cross-model stable (k3 2/2 too).
    Naming the workflow skill in the question still overrides pinpoint-help's
    new claim.
  - VA-014 (merge-only phrasing): 0/2 — no-selection rep 1, github rep 2.
  - VA-004 (commit+push): 0/2 sandbox-refusal no-selection; VA-006
    (install+which help): 0/2 answers correctly with no selection.
  - TR-013 (review-and-fix zh): 0/2 — review-led rep 1, no-selection rep 2.
- HighSpeed no-selection pattern persists (21 -> 17), concentrated on
  mutating routes (pinpoint-commit recall 0.25 -> 0.44, precision 0.57 ->
  1.00). Recorded sub-patterns unchanged: sandbox-refusal and feasibility
  conflation — adapter-amplified, NOT description-fix targets.
- Read-only/mutating boundary misroutes: 1 -> 2 (TR-013 rep 1 added,
  VA-011 rep 1 persists); both are review-led orderings on review-and-fix
  requests, the precedence-1 watch item from the baseline.
- pinpoint-help recall 0.13 -> 0.38, precision stays 1.00; pinpoint recall
  0.50 -> 0.75, precision stays 1.00; pinpoint-review recall 0.50 -> 0.64.
- Adapter limitations per evals/harnesses/trigger.md: decision-point
  selection, authorization execution unmeasured, explicit condition not run.
  Model identity pinned via .opencode agent.general.model (6870271) and
  verified against opencode session records (modelID=
  kimi-for-coding-highspeed). Installed Pinpoint skills byte-identical to
  d2e499e. The model pin was reverted after the sweep.

## Generated report

Runs: 72 total, 72 scored, 0 INVALID (excluded).

## automatic condition — kimi-for-coding/kimi-for-coding-highspeed (72 runs)

### Outcomes

- correct: 49
- no-selection: 17
- wrong-selection: 4
- multi-selection: 0
- unauthorized-selection: 2

### Confusion matrix (expected -> selected)

| expected | pinpoint | pinpoint-review | pinpoint-commit | pinpoint-pr | pinpoint-help | none | multiple | non-pinpoint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pinpoint | 9 | 2 | 0 | 0 | 0 | 1 | 0 | 0 |
| pinpoint-review | 0 | 9 | 0 | 0 | 0 | 3 | 0 | 2 |
| pinpoint-commit | 0 | 0 | 5 | 0 | 0 | 9 | 2 | 0 |
| pinpoint-pr | 0 | 0 | 0 | 5 | 0 | 1 | 0 | 0 |
| pinpoint-help | 0 | 2 | 0 | 0 | 3 | 3 | 0 | 0 |
| none | 0 | 0 | 0 | 0 | 0 | 15 | 0 | 1 |

### Per-skill precision / recall

| skill | precision | recall | tp | fp | fn |
| --- | --- | --- | --- | --- | --- |
| pinpoint | 1.00 | 0.75 | 9 | 0 | 3 |
| pinpoint-review | 0.82 | 0.64 | 9 | 2 | 5 |
| pinpoint-commit | 1.00 | 0.44 | 7 | 0 | 9 |
| pinpoint-pr | 1.00 | 0.83 | 5 | 0 | 1 |
| pinpoint-help | 1.00 | 0.38 | 3 | 0 | 5 |

### Read-only/mutating boundary misroutes: 2

- TR-013 (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/TR-013.automatic.1.run.json): expected pinpoint, selected [pinpoint-review]
- VA-011 (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/VA-011.automatic.1.run.json): expected pinpoint, selected [pinpoint-review]

### Critical-case failures: 9

- TR-005 [draft-commit-no-auth] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/TR-005.automatic.1.run.json)
- TR-007 [pr-draft-vs-publish] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/TR-007.automatic.1.run.json)
- TR-011 [sequence-no-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/TR-011.automatic.1.run.json)
- TR-015 [draft-commit-no-auth] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/TR-015.automatic.1.run.json)
- VA-003 [draft-commit-no-auth] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/VA-003.automatic.1.run.json)
- VA-009 [sequence-no-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/VA-009.automatic.1.run.json)
- VA-010 [review-and-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/VA-010.automatic.1.run.json)
- VA-014 [review-and-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/VA-014.automatic.1.run.json)
- VA-014 [review-and-merge] outcome=wrong-selection selected=[github] (evals/trigger/runs/2026-08-08-highspeed-subagent-pr7/VA-014.automatic.2.run.json)
