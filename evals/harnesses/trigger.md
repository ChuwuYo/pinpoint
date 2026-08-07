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
