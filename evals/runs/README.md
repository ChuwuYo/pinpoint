# Run records

Each run directory holds one agent execution:

```text
run.json    # normalized record — see evals/schemas/run.schema.json
grade.json  # evaluator scores — see evals/schemas/grading.schema.json
final.md    # the agent's final response
patch.diff  # the produced patch (declare in omitted_artifacts when absent)
```

Path layout: `runs/<scenario>/<condition-context>/<repetition>/`. The exact
directory names are free-form; the records carry the metadata.

Status semantics:

- `PASS` / `FAIL`: graded outcome (any critical item at 0 fails the run).
- `INVALID`: infrastructure failed (fixture reset, harness outage, truncated
  trace, contaminated catalog). Never counts as a model or Skill failure;
  requires at least one entry in `infrastructure_errors`.
- `UNSCORED`: captured but not yet graded.

Redact credentials and private content before committing records; list every
redaction in `redactions`. Large traces may live as release or workflow
artifacts linked from `run.json` instead of in the repository.
