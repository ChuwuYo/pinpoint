# REPORT.md

## Baseline (before fix)

- Protocol: `node src/bench.js samples/image-32.txt --out WxH --warmup 5 --runs 15`, input `samples/image-32.txt` (32x32), out sizes 128x128 (primary) and 256x256 (larger-output confirmation).
- Variance policy: each process invocation does 5 warmup runs (JIT warm-up, values discarded by the harness for the reported numbers) then 15 timed runs; per-stage statistic is the harness's median. I repeated the whole bench *process* 5x at 128x128 and 3x at 256x256 (cost-limited) and take the median of the per-process medians as the representative value; the min-max span across process reps is the observed variance. A before/after difference is only meaningful if the per-stage distributions (median spreads) do not overlap; overlapping distributions are treated as inconclusive. Observed outliers (e.g. a single transform max of 141-144 ms vs ~27 ms median) are noise spikes (GC/load) and are absorbed by the median.
- Environment caveats (not controllable): shared laptop (macOS arm64, 10 cores, node v26.5.0), background machine load and CPU frequency scaling, JIT and GC nondeterminism. Comparison validity: before/after were measured minutes apart on the same machine, same harness, same input, same protocol; the margins reported below are hundreds of times larger than the observed within-condition spread, so uncontrolled factors cannot explain them.

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.17 | 0.16 | 0.17 |
| transform | 26.2 | 21.7 | 27.7 |
| encode | 0.71 | 0.50 | 0.76 |
| total | 27.0 | 22.3 | 28.8 |

(128x128; median of per-process medians, min-max = spread of medians across 5 process reps)

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.18 | 0.18 | 0.21 |
| transform | 86.7 | 85.8 | 87.2 |
| encode | 2.06 | 1.46 | 2.12 |
| total | 88.6 | 88.2 | 90.2 |

(256x256; 3 process reps)

## Bottleneck analysis

**The bottleneck is `transform` (the resize stage), not `encode`.** At baseline it is 94-98% of total time (26.2/27.0 ms at 128x128; 86.7/88.6 ms at 256x256). Decode is ~0.17 ms and encode ~0.7-2.1 ms.

*Measured complexity of transform:* single-run medians at 64x64 / 128x128 / 256x256 were 7.7 / 27.0 / 87.2 ms. Doubling the output side quadruples the output pixel count and transform time grows ~3.2-3.5x — consistent with O(outW x outH x inW x inH). Mechanism confirmed by code trace (`src/stages/transform.js`): for **every** output pixel the inner loop rescans the **entire** input image, and the sum is the same for every output pixel, so the identical whole-image average is recomputed `outW x outH` times (128x128 output => 16.8M inner iterations; 256x256 => 67M).

*Measured complexity of encode:* per-stage medians 0.09 / 0.60 / 2.15 ms at 64 / 128 / 256 while output bytes grow 16x (45 KB -> 720 KB). That is roughly linear growth, not quadratic (a quadratic-in-bytes pattern would put encode at ~23 ms at 256x256). The `out += ...` append loop is O(1) amortized per append under V8 cons-strings ("ropes"), as the original comment claimed; the proposal's O(n^2) premise is contradicted by measurement.

## Fix

`src/stages/transform.js`: hoisted the whole-input averaging scan out of the per-output-pixel loops. The global average is computed once (O(inW x inH)) and the resulting `[rAvg, gAvg, bAvg]` is replicated to each of the `outW x outH` output pixels (O(outW x outH)) instead of rescanning the input for every output pixel (O(outW x outH x inW x inH)).

This lives at the owning boundary: `transform` is the stage whose per-pixel work creates the cost, and the redundant recomputation was entirely inside it. The values produced are bit-identical to before: the accumulation runs in the same loop order over the same integer sums, and every output pixel previously received the same `Math.round(sum/count)` triple — now computed once. Each output pixel is still a fresh array (no shared references), matching the previous object structure. Decode, encode, the harness, and the sample input are untouched.

## After fix (same protocol, same input)

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.17 | 0.16 | 0.19 |
| transform | 0.08 | 0.07 | 0.09 |
| encode | 0.54 | 0.48 | 0.59 |
| total | 0.99 | 0.93 | 1.08 |

(128x128; 5 process reps — transform 26.2 -> 0.08 ms, ~330x; total 27.0 -> 0.99 ms, ~27x)

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.18 | 0.17 | 0.19 |
| transform | 0.25 | 0.24 | 0.26 |
| encode | 1.50 | 1.41 | 1.58 |
| total | 1.99 | 1.86 | 2.09 |

(256x256; 3 process reps — transform 86.7 -> 0.25 ms, ~350x; total 88.6 -> 1.99 ms, ~45x)

The before/after per-stage spreads do not overlap for transform or total; encode before (0.50-0.76) vs after (0.48-0.59) overlaps, so no claim is made about encode changing (see proposal verdict).

## Output equivalence

Byte-identical verified by hashing full pipeline output of the fixed tree against the unmodified baseline pipeline (`git show HEAD:src/stages/transform.js` run from a temp copy) for the same input: sha256 matches at 64x64 (`5c5c03cb...`), 128x128 (`5c8f64aac851700749fd3bb9ba2418e1a8034474ce44d90938c30d81a113532a`), 256x256 (`51198901...`), and a non-square 7x3 (`cbe2ede6...`); byte counts match (45,062 / 180,232 / 720,904 / 235). The bench harness also reports `bytes: 180232` both before and after.

## Verdict on the proposed change

**Reject** the `encode.js` array + `join()` proposal, on measurement. Applying the proposed change and re-measuring with the same protocol: encode medians 0.57-0.71 ms at 128x128 (vs 0.50-0.76 baseline) and 1.92-1.95 ms at 256x256 (vs 1.46-2.12 baseline). The distributions overlap completely; the difference is inside run-to-run noise. The proposal's premise (O(n^2) string concatenation) is contradicted by measured linear encode scaling (0.09 -> 2.15 ms while output bytes grow 16x), consistent with V8 rope strings. And encode was never the bottleneck: even at its slowest measured (2.1 ms) it is ~2-7% of total time. The real bottleneck — transform's redundant whole-input rescan per output pixel — was cut ~330-350x with byte-identical output.
