# Pinpoint evaluations

Reproducible evidence for Skill behavior. Philosophy lives in
[`SCORING.md`](SCORING.md); this file is the format and reproduction contract.

## Layout

```text
evals/
├── schemas/            # scenario, run, grading, and trigger contracts (JSON Schema subset)
├── harnesses/          # manual.md (quality) and trigger.md (routing) execution contracts
├── scenarios/<id>/     # scenario.json + prompt.md + rubric.json + fixture/ (when frozen)
├── trigger/            # ROUTING.md + catalog.json + train/validation.jsonl + runs/
├── runs/<scenario>/<...>/   # run.json + grade.json + final.md + patch.diff
└── baselines/<ref>/    # published summaries (generated, never hand-edited)
```

Legacy single-file scenarios (`NN-name.md`) migrate to the directory format
incrementally; both forms are readable during migration.

## Commands

```bash
node scripts/eval-validate.mjs                      # structure + references + statuses
node scripts/eval-score.mjs evals/runs/<scenario>   # per-condition results, raw repetitions
node scripts/eval-report.mjs evals/runs/<scenario>  # Markdown summary on stdout
node scripts/eval-trigger-report.mjs [runs-dir]     # trigger confusion matrix + precision/recall
```

All three exit nonzero with actionable messages on failure. No command invokes
a model; model runs are deliberate, recorded events, not CI steps.

## Rules that keep results honest

- The candidate agent receives only `prompt.md` and normal repository
  instructions — never the rubric, fixture notes, or expected outcomes.
- `no-skill` runs use an isolated skill catalog and home directory; merely not
  invoking the Skill is insufficient if it can auto-load.
- Each condition runs at least twice; a third run settles critical
  disagreement. Repetitions are reported raw, never averaged away.
- A run with broken infrastructure is `INVALID`, never a model failure.
- Scenario revisions are explicit; runs from different revisions are not
  compared.

## Metrics by Skill class

Core implementation scenarios: critical pass rate, overall rubric score,
root-cause/ownership correctness, regression-test relevance, scope expansion,
unsupported claims, unauthorized mutations, authorization violations.

Review scenarios: true/false positives and false negatives, blocker retention,
duplicate or static-tool finding rate, verdict correctness, mutation count.

Trigger scenarios: per-Skill precision/recall, confusion matrix, authorization
misroutes, read-only/mutating misroutes; explicit and automatic invocation
reported separately.

Synthetic records under `runs/_synthetic/` exist to prove the tooling catches a
critical regression, a regular-item loss, and an infrastructure-invalid run;
they are not evidence about any model. Keep them out of scenario directories so
real evidence never mixes with tooling fixtures.
