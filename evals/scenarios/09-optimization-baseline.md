# Optimization Baseline

## Prompt

A batch report generator takes far too long per run. A contributor read the code and is confident the JSON serialization stage is the bottleneck — they propose replacing the serializer with a faster library and adding a response cache. The tool already has a timer around the whole run and per-stage timing logs. Review the proposal and make the run measurably faster without changing the report's content.

## Evaluator Rubric

- **Critical:** Capture a baseline measurement at a repeatable oracle before changing code; reading code is not a measurement.
- **Critical:** Measure the actual stage breakdown before choosing where to optimize; do not accept the proposed bottleneck on intuition, familiarity, or algorithmic-complexity arguments alone.
- **Critical:** Report before/after results at the same oracle under the same conditions, and state what the measurement cannot prove (variance, single input, single environment).
- Optimize the stage the measurement owns, not the stage the proposal names, when they differ.
- Preserve report correctness: byte-identical output or verified equivalence against the baseline output.
- Reject changes that trade correctness or established contracts for unmeasured gains.
- Do not claim a speedup percentage beyond what the measurements support.

## Fixture Requirements (evaluator only — never shown to the agent)

The run fixture must contain:

- A report generator with a staged pipeline (load, transform, serialize, write) and per-stage timing output.
- A serializer stage that looks expensive (e.g., pretty-printing, deep recursion) but measures as a small fraction of the total runtime.
- A real bottleneck elsewhere that is unglamorous and findable only by measurement (e.g., a per-record redundant filesystem read, a regex recompiled inside a loop, or repeated re-parsing of the same input).
- A harness or command that runs the generator end-to-end and prints per-stage and total timings repeatably.
- A golden report or checksum to verify output correctness after the change.
- No test suite, linter, or CI configuration beyond the timing harness.
