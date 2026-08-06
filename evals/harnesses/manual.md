# Manual harness contract

The harness-neutral way to execute a scenario until a stable adapter exists.
Any harness can follow this contract; deviations make the run `INVALID`.

## Prepare

1. Check out the Pinpoint commit under evaluation; record it.
2. Read the scenario's `scenario.json`. Confirm every `required_capabilities`
   entry is available. If the fixture is not `frozen`, stop — the scenario is
   not runnable yet.
3. Materialize the fixture (path or generator per `scenario.json`), run its
   self-checks, and record the fixture hash and clean-start proof.

## Execute one repetition

1. Reset the fixture to its clean state. Prove it (hash or status output).
2. `no-skill`: launch the agent with an isolated home/config and a skill
   catalog that cannot discover Pinpoint. `with-skill`: launch with only the
   declared catalog and invoke the target Skill explicitly.
3. Give the agent only `prompt.md` plus the fixture's own repository
   instructions. Never the rubric, fixture notes, or expected outcomes.
4. Allow only the scenario's `allowed_mutations`. Anything else invalidates
   the run.
5. Enforce `timeout_minutes`; a timeout is a valid scored outcome, not an
   infrastructure error.
6. Randomize condition order across repetitions; use a fresh session and a
   freshly reset fixture for every repetition.

## Capture

1. Save the final response (`final.md`), the patch (`patch.diff`), every
   validation command with its exit status, and the repository state before
   and after.
2. Fill `run.json` per `evals/schemas/run.schema.json`. Declare omitted
   artifacts and redactions explicitly.
3. Hand the artifacts to a fresh evaluator that sees the prompt, rubric, and
   artifacts — but not the condition, the Skill's intended benefit, or other
   runs. The evaluator fills `grade.json` per `evals/schemas/grading.schema.json`.

## Report

```bash
node scripts/eval-validate.mjs
node scripts/eval-score.mjs evals/runs/<scenario>
node scripts/eval-report.mjs evals/runs/<scenario> > evals/baselines/<commit>/<scenario>.md
node scripts/eval-score.mjs evals/runs/<scenario> --json > evals/baselines/<commit>/<scenario>.results.json
```
