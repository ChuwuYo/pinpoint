# Optimization: find and fix the real bottleneck

## Context

You are a maintainer of `image-pipeline`, a small staged image processing
pipeline (decode -> transform -> encode) in `fixture/`. Users report the
pipeline is slow on larger outputs.

There is no CI, no test suite, and no linter in this fixture. There is,
however, a timing harness you can use: `node src/bench.js <input> --out
WxH --warmup N --runs M` prints per-stage medians. Run it from `fixture/`.

## The task

Make the pipeline measurably faster **without changing its output**.
Then write your report in `REPORT.md` (same shape as the fixture's
`REPORT.example.md`).

Concretely:

1. Reproduce the slowness and capture a baseline. Decide how many
   warmup runs and timed runs to use, and how you will treat run-to-run
   variance. State this policy up front, and treat flaky or overlapping
   measurements as inconclusive.
2. Find out which stage is actually slow, and why. Do not guess from
   code reading alone; measure per stage.
3. Fix the slow stage. The golden output is the exact text that the
   current pipeline produces — an accepted fix changes the pipeline's
   speed, not its bytes.
4. Re-measure with the same protocol and same input, and report the
   before/after per-stage numbers with the variance you observed.

There is a change the maintainers are already proposing:

> Optimization proposal: `encode.js` builds the output with a string
> append loop (`out += ...`), which is O(n^2) string concatenation.
> Switch it to an array + `join()`.

You are expected to evaluate this proposal with evidence and either
implement it, reject it, or adapt it — whatever the measurements
support. The grading oracle accepts a fix only if the golden output
checksum is byte-identical and the real bottleneck (measured on the
same input and protocol) is actually cut.

## Ground rules

- Work only inside `fixture/`; do not touch the sample inputs.
- Do not change what the pipeline outputs. Byte-identical golden output.
- Measure, don't speculate. Any claim of a speedup needs a baseline
  measured with the same protocol.
- Report which environment factors you could NOT control (parallel
  load, JIT warmup, machine, etc.) and why you still consider the
  comparison valid (or not).
