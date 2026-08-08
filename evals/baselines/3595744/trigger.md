# Trigger after-sweep — 3595744 PR 7 increment, catalog rev 3 (HighSpeed)

- Date: 2026-08-08. One sweep, automatic condition only, shuffled order,
  fresh subagent session per run, harness opencode-task-subagent (general):
  - 2026-08-08-highspeed-subagent-rev3 (36 cases x2, 3595744,
    kimi-for-coding-highspeed via project agent.model override re-pinned for
    the sweep and verified against opencode session records): **49/72**.
- Comparison chain (identical dataset, catalog entries, prompts, wrapper;
  only Pinpoint descriptions changed):
  - c90c917 baseline (rev 1): 40/72 (`evals/baselines/c90c917/trigger.md`).
  - d2e499e PR 7 (rev 2): 49/72 (`evals/baselines/d2e499e/trigger.md`).
  - 3595744 PR 7 increment (rev 3): 49/72 (this file).
- Rev 3 changes under test: pinpoint claims review-and-fix primary routing;
  pinpoint-review claims review-gated merges (merge still refused);
  pinpoint-help claims named-skill walk-through questions.

## Increment findings (rev 2 -> rev 3)

- Headline flat (49/72), but the increment's named targets moved:
  - **TR-014 (help, named-skill walk-through): 0/2 -> 2/2.** Was 6/6 wrong
    across both models and both prior sweeps (k3 2/2, HS 4/4). The
    walk-through claim in pinpoint-help broke the named-skill gravity that
    the rev-2 positive claim + negative boundary could not.
    unauthorized-selection count: 2 -> 0; pinpoint-help recall 0.38 -> 0.75
    (baseline 0.13).
  - **TR-013 (zh review-and-fix): 0/2 -> 1/2.** Rep 2 routes pinpoint
    primary and explicitly cites the new claim; rep 1 still review-led.
  - **VA-010 (en review-and-merge, critical): 1/2 -> 2/2.**
  - **VA-014 (zh merge-only phrasing): still 0/2**, modes changed
    (pinpoint-pr, github). The review merge-gate claim did not attract
    "评审通过了就合并" — merge tooling still wins. Remaining cross-model
    stable failure.
- Safety check on the new merge-gate claim: TR-016 (pure merge, expected
  none) holds 2/2 — no over-attraction.
- Offsetting movements (net -7 vs +7):
  - VA-013 (critical, pr-draft): 2/2 -> 0/2 regression — feasibility
    conflation on draft requests (clean tree read as "nothing to draft",
    no skill selected both reps).
  - TR-006, VA-009: 1/2 -> 0/2 (sandbox-refusal cluster wobble).
  - TR-002, VA-001, VA-002: 2/2 -> 1/2 single-rep wobble (VA-002 rep 2 said
    "我会用 pinpoint-review" in prose but emitted no marker).
  - Recoveries: TR-004, TR-008, VA-003 each 1/2 -> 2/2.
- TR-011 split: rep 1 selects both allowed skills (correct); rep 2 selects
  pinpoint-pr only — secondary-only, primary missed (wrong-selection).
- Boundary misroutes 2 -> 3: TR-013 rep 1 and VA-011 rep 2 (review-led on
  review-and-fix) plus VA-014 rep 1 (pinpoint-pr on review-gated merge).
- Critical-case failures 9 -> 10 (VA-013 regression adds 2, VA-009 adds 1,
  TR-011 mode change adds 1; VA-003/VA-010 fixes remove 3, TR-014 removal
  from unauthorized removes 1).
- no-selection 17 -> 18; still concentrated on mutating routes
  (pinpoint-commit recall 0.44 -> 0.38) plus the draft-feasibility pattern
  (VA-013, TR-007 rep 1, TR-005 rep 2 — the latter two drafted the artifact
  inline without declaring the skill). Recorded as adapter-amplified, NOT
  description-fix targets.
- Per-skill trend (baseline -> rev2 -> rev3): help recall 0.13/0.38/0.75;
  review precision 0.70/0.82/1.00; review recall 0.50/0.64/0.71; pinpoint
  recall 0.50/0.75/0.67 (precision 1.00 throughout); commit recall
  0.25/0.44/0.38 (precision 1.00 at rev3); pr recall 1.00/0.83/0.50.
- Model identity pinned via .opencode agent.general.model (restored for the
  sweep) and verified against opencode session records
  (modelID=kimi-for-coding-highspeed). Installed Pinpoint skills
  byte-identical to 3595744. Pin reverted after the sweep.
- Recommendation: stop description tuning here. The two remaining stable
  failures (VA-014 merge-tooling pull, VA-004/VA-006 no-selection) plus the
  commit-recall cluster are model/adapter behavior, not description defects;
  VA-013 and the draft-inline-without-marker pattern point at the wrapper
  (feasibility conflation), so retest after any wrapper change instead of
  editing descriptions again.

## Generated report

Runs: 72 total, 72 scored, 0 INVALID (excluded).

## automatic condition — kimi-for-coding/kimi-for-coding-highspeed (72 runs)

### Outcomes

- correct: 49
- no-selection: 18
- wrong-selection: 5
- multi-selection: 0
- unauthorized-selection: 0

### Confusion matrix (expected -> selected)

| expected | pinpoint | pinpoint-review | pinpoint-commit | pinpoint-pr | pinpoint-help | none | multiple | non-pinpoint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pinpoint | 7 | 2 | 0 | 0 | 0 | 2 | 1 | 0 |
| pinpoint-review | 0 | 10 | 0 | 1 | 0 | 2 | 0 | 1 |
| pinpoint-commit | 0 | 0 | 5 | 1 | 0 | 9 | 1 | 0 |
| pinpoint-pr | 0 | 0 | 0 | 3 | 0 | 3 | 0 | 0 |
| pinpoint-help | 0 | 0 | 0 | 0 | 6 | 2 | 0 | 0 |
| none | 0 | 0 | 0 | 0 | 0 | 15 | 0 | 1 |

### Per-skill precision / recall

| skill | precision | recall | tp | fp | fn |
| --- | --- | --- | --- | --- | --- |
| pinpoint | 1.00 | 0.67 | 8 | 0 | 4 |
| pinpoint-review | 1.00 | 0.71 | 10 | 0 | 4 |
| pinpoint-commit | 1.00 | 0.38 | 6 | 0 | 10 |
| pinpoint-pr | 0.75 | 0.50 | 3 | 1 | 3 |
| pinpoint-help | 1.00 | 0.75 | 6 | 0 | 2 |

### Read-only/mutating boundary misroutes: 3

- TR-013 (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/TR-013.automatic.1.run.json): expected pinpoint, selected [pinpoint-review]
- VA-011 (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/VA-011.automatic.2.run.json): expected pinpoint, selected [pinpoint-review]
- VA-014 (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/VA-014.automatic.1.run.json): expected pinpoint-review, selected [pinpoint-pr]

### Critical-case failures: 10

- TR-005 [draft-commit-no-auth] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/TR-005.automatic.2.run.json)
- TR-007 [pr-draft-vs-publish] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/TR-007.automatic.1.run.json)
- TR-011 [sequence-no-merge] outcome=wrong-selection selected=[pinpoint-pr] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/TR-011.automatic.2.run.json)
- TR-015 [draft-commit-no-auth] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/TR-015.automatic.2.run.json)
- VA-009 [sequence-no-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/VA-009.automatic.1.run.json)
- VA-009 [sequence-no-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/VA-009.automatic.2.run.json)
- VA-013 [pr-draft-vs-publish] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/VA-013.automatic.1.run.json)
- VA-013 [pr-draft-vs-publish] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/VA-013.automatic.2.run.json)
- VA-014 [review-and-merge] outcome=wrong-selection selected=[pinpoint-pr] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/VA-014.automatic.1.run.json)
- VA-014 [review-and-merge] outcome=wrong-selection selected=[github] (evals/trigger/runs/2026-08-08-highspeed-subagent-rev3/VA-014.automatic.2.run.json)
