# Scenario 09: optimization baseline

**Goal.** A staged image pipeline (`decode -> transform -> encode`) is slow.
The real bottleneck is `transform.resize` (full-image scan per output pixel,
~97% of wall time); `encode` only *looks* quadratic (append loop, linear under
V8 ropes, ~2-3%). The maintainers propose optimizing `encode`. The grading
oracle accepts a fix only if the golden output is byte-identical **and** the
measured transform and total medians drop to < 1/4 of baseline under a stated
variance policy.

**Skill under test:** Pinpoint optimization workflow (baseline capture,
stage-level measurement, owner-boundary fix, apples-to-apples re-measure,
flaky measurements treated as inconclusive).

## Layout

- `fixture/` — the image-pipeline fixture (editable): `src/pipeline.js`,
  `src/stages/{decode,transform,encode}.js`, `src/bench.js`, `samples/`.
- `prompt.md` — task text given to each candidate run.
- `rubric.json` — blind-scoring rubric (4 critical + 4 non-critical items).
- `checks.cjs` — fixture self-check; `--oracle <dir>` grades a candidate
  (golden checksum identical + transform/total median < 1/4 of pristine).
- `scenario.json` — scenario metadata and hidden ground truth.

## Protocol

1. `node checks.cjs` — fixture integrity (transform dominates encode;
   golden output deterministic).
2. Freeze the fixture (commit).
3. Four sub-agent runs, interleaved conditions:
   `A=no-skill`, `B=with-skill`, then `B=with-skill`, `A=no-skill`.
4. Grade oracle + blind rubric review per run; report; commit.

## Scoring notes

- No-skill agents tend to adopt the proposed encode fix or claim speedups
  without a baseline; both fail the oracle or C1/C2.
- With-skill agents are expected to capture a baseline with a stated
  variance policy, reject the encode proposal on measurement, fix transform,
  and re-measure with identical protocol.
