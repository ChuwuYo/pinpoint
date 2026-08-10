# REPORT.md

## Baseline (before fix)

- Protocol: `node src/bench.js samples/image-32.txt --out 512x512 --warmup 5 --runs 15`, repeated 3x per side; also a 1024x1024 datapoint (`--warmup 3 --runs 8`, 2x) to check scaling. Single-threaded node process on an idle-ish 10-core Mac; load average ~2.4 from unrelated GUI processes.
- Variance policy: 5 warmup runs (JIT/GC warm), then 15 timed runs; median per stage is robust to outliers (observed 9s spikes on 1024x1024). Three whole-invocation repeats per side; a difference counts as meaningful only if the before/after medians are separated by more than the spread between the repeated invocations. Decode (~0.2ms) and encode (~14ms) are stable; transform showed 340-374ms spread, so anything under ~10% would have been inconclusive.
- Environment caveats: could not control parallel load (OpenCode helper, Chrome), OS scheduling, JIT compilation, GC pauses — hence the spike outliers (e.g. 9.2s max on 1024x1024). Comparison is still valid because medians were stable across repeated invocations, both sides were measured with the identical command/protocol, and the fixed stage's time falls ~100x outside the baseline noise band.

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.21 (0.215, 0.210, 0.208) | 0.19 | 0.31 |
| transform | 355.9 (348.3, 358.1, 361.4) | 340.1 | 374.2 |
| encode | 14.9 (15.4, 14.6, 14.5) | 12.8 | 25.5 |
| total | 371.8 (363.5, 374.0, 377.8) | — | — |

Per-stage min/max span all runs across the 3 invocations; the total min/max were not reported per run by the harness, so only the three total medians are shown.

## Bottleneck analysis

**Transform is the bottleneck: ~356ms of ~372ms total (96%) at 512x512; encode is ~15ms (4%); decode ~0.2ms.**

Why: `resize` scans the *entire* 32x32 input for *every* output pixel — O(outW·outH·inW·inH). At 512x512 that is 262,144 x 1,024 = 268M inner iterations. Scaling confirms: 128x128 -> 512x512 -> 1024x1024 (4x more output pixels each step) transform medians were 27.9ms -> 356ms -> 1,514ms — ~4.1x and ~4.3x per 4x step, i.e. quadratic in output size.

Worse, the inner loop never reads `ox`/`oy`: every output pixel is the identical global mean of the input. Measured: 262,144 output pixels, **1 unique value** (124,124,47). The stage recomputes the same O(in) average 262,144 times.

**The proposed encode fix: rejected by measurement.** The comment in `encode.js` claims the append loop "looks quadratic but is linear under V8 ropes" — measurement confirms near-linear: encode alone at 16K/65K/262K/1M pixels = 0.7/2.3/9.5/53ms (4x pixels -> 3.1-5.6x time; quadratic would be ~16x). A join() rewrite of the same stage was statistically indistinguishable: 9.5-12.8ms vs 9.8-11.2ms (overlapping medians across repeated ABAB micro-benchmarks, byte-identical output). Even a free win in encode would be capped at ~15ms of a ~372ms pipeline (~4%) — it is not the slowness users hit.

## Fix

`src/stages/transform.js`: since the per-output-pixel average provably does not depend on the output position (verified empirically: 1 unique output value), the global mean is computed **once** over the input (identical loop order over input pixels -> identical float sums -> identical `Math.round`), and the output is filled by replicating that triple. Complexity drops from O(out·in) to O(in + out). Byte-identical by construction and verified empirically. The fill preserves the original row-major emission order, and each output pixel is a fresh 3-element array (same per-pixel representation as decode produces).

## After fix (same protocol, same input)

Same commands as baseline; 3 repeats at 512x512, 2 repeats at 1024x1024.

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.197 (0.197, 0.197, 0.192) | 0.183 | 0.258 |
| transform | 2.68 (2.71, 2.68, 2.66) | 1.98 | 5.22 |
| encode | 14.4 (14.4, 13.9, 14.0) | 13.2 | 24.2 |
| total | 17.2 (17.4, 17.2, 17.1) | 17.1 | 17.5 |

1024x1024: transform 1,514ms -> 58ms (54.7, 60.6); total 1,590ms -> 116ms. Encode is now the largest stage (14.4ms).

## Output equivalence

Golden output captured from the unmodified baseline pipeline (`processImage(samples/image-32.txt, WxH)`) and byte-compared with the fixed pipeline via `===` on full UTF-8 strings:
- 128x128: identical (180,232 bytes)
- 512x512: identical (2,883,592 bytes)
- 1024x1024: identical (11,534,346 bytes)

Both pipelines also report the same byte counts in the harness (`bytes=2883592`, `bytes=11534346`).

## Verdict on the proposed change

**Rejected as the fix, with evidence.** The encode `out += ...` loop is measured near-linear under V8 ropes (4x output -> ~4x time, not ~16x), so the O(n^2) premise is false; an array+join rewrite measured statistically identical (9.8-11.2ms vs 9.5-12.8ms) and byte-identical. It would be a no-op even if applied. The actual bottleneck is `transform` (96% of runtime, quadratic in output size), fixed by computing the once-redundant global mean a single time: transform 355.9ms -> 2.68ms (~133x), pipeline total 371.8ms -> 17.2ms (~22x) at 512x512 with byte-identical output.
