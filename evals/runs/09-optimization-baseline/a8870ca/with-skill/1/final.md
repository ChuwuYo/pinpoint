# REPORT.md

## Baseline (before fix)

- Protocol: `node src/bench.js samples/image-32.txt --out 128x128 --warmup 5 --runs 15`, repeated 3x per configuration; the canonical comparison uses 128x128, with 256x256 / 512x512 / 1024x1024 spot checks for scaling.
- Variance policy: each bench run reports the median of 15 timed runs after 5 warmup runs; the whole bench is repeated 3 times. A difference is treated as meaningful only if it moves outside the min-max spread observed across repetitions. Baseline transform medians across reps: 21.1 / 25.9 / 26.1 ms — one rep contained a GC outlier (max 143.6 ms) that the median is robust to. Post-fix effect sizes (25.9 -> 0.086 ms) are 2-3 orders of magnitude beyond this variance.
- Environment caveats (uncontrolled): no CI/test/linter exists in this fixture; single machine (macOS, Node v26.5.0), background load uncontrolled; JIT warmup handled by the 5 warmup runs. The comparison is still valid because both sides ran the identical harness/protocol/input minutes apart on the same machine, and the measured effect dwarfs the observed run-to-run spread.

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.16 | 0.14 | 0.29 |
| transform | 25.9 | 20.97 | 143.6* |
| encode | 0.44 | 0.34 | 1.02 |
| total | 26.6 | 21.5 | 144.6 |

\* one GC/JIT outlier rep; non-outlier max was 31.8 ms.

Scaling (same input, larger outputs): transform 26.4 ms @128x128 -> 85.6 ms @256x256 -> 358 ms @512x512 -> 1537 ms @1024x1024, i.e. ~4x per output doubling: O(outW x outH x inW x inH).

## Bottleneck analysis

Transform is the hot stage: ~94-96% of total wall time at every output size. Evidence: per-stage medians above, and the clean ~4x-per-doubling scaling that matches O(outW x outH) with the inner full-image scan.

Why: `resize` averages *every input pixel* for *every output pixel*. The average does not depend on output position at all (no `ox`/`oy` variable is referenced inside the scan), so the same whole-image mean is recomputed outW x outH times. Verified empirically: all 16384 output pixels at 128x128 are identical (`124 124 47`; 1 distinct pixel value). The stage does O(outW x outH x inW x inH) work to produce a constant image.

The proposed encode change (append loop -> array + join) was evaluated with a direct in-process probe alternating both encoders on identical resized images:

| output | append median (ms) | join median (ms) |
|---|---|---|
| 256x256 | 2.12 | 2.19 |
| 512x512 | 12.63 | 11.20 |
| 1024x1024 | 65.04 | 65.82 |

The variants are statistically indistinguishable (differences inside min-max spread, favoring each side at different sizes), so the append loop is not measurably quadratic: it is not the bottleneck (encode was <=5% of baseline total). The superlinear-looking encode trend (bytes x64 -> time ~x100) is shared by both variants, so it is not caused by the concatenation mechanism; it belongs to serialization/GC of the large result string and is untouched by the proposal.

## Fix

`src/stages/transform.js` only. The whole-input average is computed once (O(inW x inH)) and replicated to every output pixel (O(outW x outH)): O(outW x outH x inW x inH) -> O(inW x inH + outW x outH). The value is a pure function of the input sums, so every output pixel is bit-identical to the previous computation (same accumulation order, same division, same `Math.round`). Per-pixel output arrays are still fresh allocations (no shared references). Decode and encode are untouched. This boundary owns the resize computation, so the waste is removed where it is created.

## After fix (same protocol, same input)

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.18 | 0.17 | 0.40 |
| transform | 0.086 | 0.063 | 0.30 |
| encode | 0.56 | 0.38 | 1.94 |
| total | 0.84 | 0.63 | 2.37 |

(median of 3 reps; representative full run shown)

Scaling: transform 0.086 ms @128x128 -> 0.59 ms @256x256 -> 1.36 ms @512x512. ~300x faster at the canonical size; total pipeline 26.6 -> ~0.85 ms (~31x). Note the bottleneck moved: at 512x512 encode (~10.3 ms) now dominates the 12.1 ms total, and the measured data shows the rejected proposal would not help it either.

## Output equivalence

Golden output captured before the fix via the real pipeline entry point (`processImage`) at 128x128, 256x256, 512x512, 1024x1024 and compared by sha256 after the fix — all four byte-identical:

- 128x128: 5c8f64aac851700749fd3bb9ba2418e1a8034474ce44d90938c30d81a113532a
- 256x256: 51198901be0d8bfa955d3440df9bc7622d333ccffe31b0b9d3108e8f263ad127
- 512x512: a58cea7970e994fcbccc2376e27865bf445b245af1f18cb3182afd1a993a734a
- 1024x1024: 59388a5fea8f619fb9061dea85e30f62acb8c26f1687d8fd545cc5ed3ba46438

`cmp` confirms identity; bench `bytes` field unchanged (180232 @128x128).

## Verdict on the proposed change

**Reject.** Measured evidence: the append loop and an array+join variant are indistinguishable in direct, alternating in-process probes at 256x256 / 512x512 / 1024x1024 (e.g. 65.04 vs 65.82 ms at 1024x1024), and encode was at most ~5% of baseline total even at the largest output — so even a hypothetical win there could not produce a meaningful pipeline speedup. The real bottleneck was `resize` (94-96% of total), which the proposal does not touch; that stage was the one fixed, and the ~300x transform speedup was measured with the same protocol and byte-identical output.
