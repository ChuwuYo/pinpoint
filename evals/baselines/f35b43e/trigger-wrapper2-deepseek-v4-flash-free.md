# Trigger wrapper v2 sweep — 2026-08-10, catalog rev 3 (deepseek-v4-flash-free)

- Date: 2026-08-10. One sweep, automatic condition only, shuffled order
  (seed 20260810), fresh subagent session per run, harness
  opencode-task-subagent (general, **wrapper v2**):
  - 2026-08-10-deepseek-v4-flash-free-subagent-rev3-w2 (36 cases x2,
    f35b43e, model inherited from parent session — no pin — verified
    `deepseek-v4-flash-free` against opencode session records): **67/72**.
- Primary comparison (same dataset, catalog, prompts; wrapper v1 -> v2):
  - 3595744 PR 7 increment, catalog rev 3, wrapper v1, HighSpeed
    (`evals/baselines/3595744/trigger.md`): **49/72**.
  - Model differs between the two sweeps (kimi-for-coding-highspeed vs
    deepseek-v4-flash-free); model is a recorded variable, and the
    wrapper comparison below must be read with that confound in mind.
    `deepseek-v4-flash-free` was used because it is the current session
    model (no pin); a same-model v1-vs-v2 sweep is deferred.
- Identical conditions across sweeps: 36-case dataset, catalog revision 3,
  wrapper (except v1/v2 wording), pinned vs inherited model handling per
  harness rules, discovery snapshot byte-identical (152 entries).

## Headline

- correct 49/72 -> **67/72**; no-selection 18 -> **5**; wrong-selection
  5 -> **0**; unauthorized-selection 0 -> 0; boundary misroutes 3 -> **0**;
  critical-case failures 10 -> **3**.
- The v2 wrapper clarification ("bans restrict execution only — they never
  restrict which skill you may select or name") removed the
  sandbox-refusal and feasibility-conflation no-selections that dominated
  v1: subagents that previously read the mutation ban as a route
  prohibition now name the route anyway.

## no-selection cluster (the v2 hypothesis target)

- v1 no-selection 18, concentrated on mutating routes (pinpoint-commit
  recall 0.38) plus the draft-feasibility pattern (VA-013, TR-007 rep 1,
  TR-005 rep 2).
- v2 no-selection 5, with the named cluster resolved:
  - **VA-004 (commit-authorized): 0/2 -> 1/2.** Rep 2 now selects
    pinpoint-commit; rep 1 still no-selection (clean-tree feasibility
    refusal).
  - **VA-006 (help): 0/2 -> 2/2.**
  - **VA-013 (pr-draft, critical): 0/2 -> 2/2.** Both reps select
    pinpoint-pr; the draft-feasibility conflation is gone.
  - **TR-005/TR-015 (draft-commit): 1/2 -> 2/2.** Draft-first requests now
    name pinpoint-commit while withholding the commit.
  - **commit recall 0.38 -> 0.94** (TR-006 0/2 -> 2/2, VA-009 0/2 -> 2/2,
    TR-019 1/2 -> 2/2).
- Interpretation per the attribution rule: the cluster vanished under v2,
  so it is recorded as a **wrapper artifact**, not a description defect;
  descriptions stay unchanged. Caveat: the model also changed, so the
  v1-vs-v2 delta is wrapper-confounded by model — the residual cluster
  (below) is the same pattern that v1 already mis-scored under both
  models (k3 and HighSpeed), which supports the wrapper attribution.

## Residual no-selection (known limitations)

- **VA-004 rep 1**: clean working tree read as "nothing to commit"; no
  skill selected despite the v2 clarification. Same pattern as v1's
  cross-model failures — feasibility conflation on empty repo state is
  adapter/model behavior, not a description defect. Known limitation;
  description untouched.
- **TR-012 rep 2 (critical, review-and-merge)**: no branch to review and
  merge; no selection (route also blocked by repo-state feasibility).
- **VA-001 rep 2**: prose said "route through the pinpoint skill" but
  emitted `SKILL_USED: none` — marker mismatch, recorded as no-selection
  per rule.
- **VA-014 rep 1 (critical, review-and-merge)**: format violation — no
  `SKILL_USED` line emitted at all; recorded as no-selection with the
  format-violation note. (Modes in v1: pinpoint-pr / github; v2 rep 2
  selects pinpoint-review.)

## Increment targets carried over from rev 3

- **TR-013 (zh review-and-fix): 1/2 -> 2/2.** Rep 1 was review-led in v1
  (wrong-selection, boundary misroute); v2 both reps route pinpoint
  primary.
- **VA-011 (en review-and-fix): 1/2 -> 2/2.** Same fix; rep 2 was
  review-led in v1.
- **VA-014 (zh merge-only phrasing, critical): 0/2 -> 1/2.** Rep 2 now
  selects pinpoint-review (the review-gated-merge claim lands on
  "评审通过了就合并"); rep 1 is a format-violation no-selection. Still
  not fully solved — merge-gate claim partially effective.
- **TR-014 (help walk-through): 2/2 held** (was 0/2 at rev 2, fixed at
  rev 3).
- **TR-016 (pure merge, expected none): 2/2 held** — no over-attraction
  from the merge-gate claim.

## Offsetting movements (v1 -> v2)

- TR-011 rep 2: wrong-selection (pinpoint-pr only) -> correct
  (pinpoint-commit + pinpoint-pr, both allowed).
- TR-012: 2/2 -> 1/2 (rep 2 no-selection, above).
- VA-001: 2/2 -> 1/2 (rep 2 marker mismatch, above).
- TR-002, TR-017, VA-002: 1/2 -> 2/2 (single-rep wobbles from v1 gone).
- VA-014: mode change wrong-selection -> format no-selection (rep 1) /
  correct (rep 2).

## Generated report

Runs: 72 total, 72 scored, 0 INVALID (excluded).

## automatic condition — deepseek-v4-flash-free (72 runs)

### Outcomes

- correct: 67
- no-selection: 5
- wrong-selection: 0
- multi-selection: 0
- unauthorized-selection: 0

### Confusion matrix (expected -> selected)

| expected | pinpoint | pinpoint-review | pinpoint-commit | pinpoint-pr | pinpoint-help | none | multiple | non-pinpoint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pinpoint | 11 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| pinpoint-review | 0 | 12 | 0 | 0 | 0 | 2 | 0 | 0 |
| pinpoint-commit | 0 | 0 | 11 | 0 | 0 | 1 | 4 | 0 |
| pinpoint-pr | 0 | 0 | 0 | 5 | 0 | 1 | 0 | 0 |
| pinpoint-help | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
| none | 0 | 0 | 0 | 0 | 0 | 13 | 0 | 3 |

### Per-skill precision / recall

| skill | precision | recall | tp | fp | fn |
| --- | --- | --- | --- | --- | --- |
| pinpoint | 1.00 | 0.92 | 11 | 0 | 1 |
| pinpoint-review | 1.00 | 0.86 | 12 | 0 | 2 |
| pinpoint-commit | 1.00 | 0.94 | 15 | 0 | 1 |
| pinpoint-pr | 1.00 | 0.83 | 5 | 0 | 1 |
| pinpoint-help | 1.00 | 1.00 | 8 | 0 | 0 |

### Read-only/mutating boundary misroutes: 0

### Critical-case failures: 3

- TR-007 [pr-draft-vs-publish] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-10-deepseek-v4-flash-free-subagent-rev3-w2/TR-007.automatic.1.run.json)
- TR-012 [review-and-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-10-deepseek-v4-flash-free-subagent-rev3-w2/TR-012.automatic.2.run.json)
- VA-014 [review-and-merge] outcome=no-selection selected=[] (evals/trigger/runs/2026-08-10-deepseek-v4-flash-free-subagent-rev3-w2/VA-014.automatic.1.run.json)

## Model identity

- Inherited from parent session — no `.opencode` override was created
  (default no-pin path); verified against opencode session records after
  batch 1: all 8 sessions report `deepseek-v4-flash-free`. Recorded per
  run in `model.id` with the verification source in `model.settings`.
- Installed Pinpoint skills byte-identical to f35b43e (diff 5/5);
  discovery snapshot byte-identical to the rev 3 snapshot (152 entries).

## Attribution verdict

- The v2 wrapper fixed the measured artifact class: sandbox-refusal and
  draft-feasibility no-selections collapsed (18 -> 5) and every named
  cluster case improved; descriptions were not touched and must not be
  adjusted for adapter artifacts.
- Remaining failures are feasibility conflation on clean/empty repo state,
  one marker mismatch, and one format violation — same pattern the v1
  adapter showed cross-model; recorded as known limitations, not
  description targets.
- Caveat recorded: v1 (HighSpeed) vs v2 (deepseek-v4-flash-free) differ
  in model; a same-model v1-vs-v2 rerun is the follow-up if the wrapper
  attribution needs to be isolated from the model variable.
