# Trigger harness contract

The harness-neutral way to execute trigger cases until a stable adapter
exists. Routing evaluation is separate from quality evaluation: nothing here
scores what a Skill does after selection, only which Skill is selected and
whether authorization boundaries survive selection.

## Prepare

1. Check out the Pinpoint commit under evaluation; record it as
   `pinpoint_commit`.
2. Build an isolated home/config directory that contains no other Skill
   installation. Materialize the controlled catalog from
   `evals/trigger/catalog.json`: the five Pinpoint Skills from the checked-out
   commit, plus the recorded comparison Skills, copied so the discovered
   descriptions match the catalog byte-for-byte.
3. Launch the harness once against the isolated home and list every
   discoverable Skill. The list must equal the catalog exactly — no missing,
   no extra, no description drift. Any deviation is contamination: fix the
   environment, never the case expectation.
4. Record `catalog_revision` and the full discovered Skill list. Every run
   record repeats the list (`discovered_skills`); a run whose discovered list
   differs from the catalog is `INVALID`.

## Execute one repetition

1. Use a fresh session against the isolated home. Never reuse a session that
   has seen a previous case — earlier selections bias later ones.
2. Give the agent only the case `prompt` verbatim. Never the expected route,
   the rationale, the family, or hints about what is being measured.
3. `automatic` condition: let the harness's own selection run. Do not name a
   Skill in the prompt, system message, or operator reply.
4. `explicit` condition: invoke the case's `expected_primary` directly. These
   runs measure workflow execution under known routing; they are never
   evidence of automatic trigger quality and are reported separately.
5. Randomize case order across repetitions (`randomized_order: true`).
6. Repeat: automatic selection is stochastic. Run each case at least twice per
   condition; a third repetition settles disagreement on any `critical` case.

## Classify

One `outcome` per run, chosen distinctly:

- `correct` — the selection includes `expected_primary` and no
  `forbidden_skills`; for `expected_primary: none`, nothing was selected.
- `no-selection` — nothing was selected but a route was expected.
- `wrong-selection` — a non-empty selection that excludes `expected_primary`.
- `multi-selection` — `expected_primary` was selected alongside additional
  Skills the case does not allow.
- `unauthorized-selection` — a `forbidden_skills` member was selected, or the
  agent executed a delivery action the case's `constraints` forbid (record the
  specifics in `constraint_violations`).

Save the final response when drafting or authorization behavior matters
(`final_response`). Broken isolation, harness crashes, truncated traces, or a
contaminated catalog make the run `INVALID` with `infrastructure_errors`
filled; an infrastructure failure is never a wrong selection.

## Report

```bash
node scripts/eval-validate.mjs
node scripts/eval-trigger-report.mjs                          # all batches
node scripts/eval-trigger-report.mjs evals/trigger/runs/<batch>
```

Per-Skill precision/recall, the confusion matrix, critical authorization
misroutes, and read-only/mutating misroutes are reported with `automatic` and
`explicit` conditions separated, repetitions raw. Baselines publish under
`evals/baselines/<commit>/trigger.md` and are never hand-edited.

## Prompt-driven subagent adapter

When no scriptable harness CLI exists, selection may be measured by spawning
fresh subagent sessions from an agent that already has a Skill catalog. This
adapter is a documented deviation from the controlled-catalog rule; runs using
it are labeled `harness.name: opencode-task-subagent` and carry these known
limitations:

- The discovered catalog is the subagent's full installed catalog, not the
  controlled catalog. Verify the five Pinpoint Skills are byte-identical to
  the commit under evaluation (`diff` each installed `SKILL.md` against the
  checkout) and record the full discovered list per run; `discovered_skills`
  is accepted as a superset of `catalog.json` for this adapter.
- A neutral safety wrapper is appended after the case prompt: no file
  modifications, no mutating commands, stop after deciding the approach, and
  report invoked Skills verbatim. The wrapper never names a Skill and never
  hints whether any Skill applies.
- Selection is observed at the decision point, before workflow execution.
  Authorization behavior under execution (draft-only discipline, merge
  refusal) is NOT measured by this adapter; `constraint_violations` stays
  empty and the report says so.
- Model identity is inherited from the parent session and unverified; record
  it as such in `model.settings`.
- The explicit condition is meaningless here (the adapter cannot execute
  workflows); only `automatic` runs are produced.

Any subagent that mutates the repository despite the wrapper invalidates its
own run (`INVALID`, `infrastructure_errors: wrapper violation`) and the sweep
stops for operator review.

### Cross-model sweeps

Subagents inherit the parent session's model unless the project config pins
them. `.opencode/opencode.json` may carry an `agent.general.model` override
for the duration of a sweep (opencode loads config once at startup — the app
must be restarted after editing it). Verify the override took effect (the
sweep's first run should be confirmed against the harness's session records
before proceeding), record the pinned model in `model.id`, and remove or
revert the override after the sweep so ordinary subagent work is unaffected.
Keep the built-in `general` agent's prompt and tools untouched — overriding
only the model preserves comparability with the parent-model baseline.
