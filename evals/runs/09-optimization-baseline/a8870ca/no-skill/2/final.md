# REPORT.md

## Baseline (before fix)

- Protocol: `node src/bench.js samples/image-32.txt --out 256x256 --warmup 3 --runs 7`
- Variance policy: I used the harness defaults (3 warmup, 7 timed runs; median is robust to the
  multi-second GC outlier spikes seen in `transform_max`). Each configuration was run as 3
  independent bench invocations; a difference is judged meaningful only when the invocation
  medians of the two configurations are disjoint. Overlapping or flaky measurements are treated
  as inconclusive. Median of the 3 invocation medians is reported; min/max are the raw per-run
  extremes across those invocations.
- Environment caveats: Apple macOS, Node v26.5.0. I could not control parallel load from other
  processes, CPU frequency scaling, or GC/JIT behavior (a GC run inflates `max` by up to ~2 s).
  The comparison is still valid because both sides were measured on the same machine, back to
  back, with the identical protocol and input, and the transform gap is 2 orders of magnitude
  larger than the observed variance. `decode` reads from the page-cache-warm file on both sides.

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.23 | 0.16 | 0.36 |
| transform | 89.6 | 87.3 | 597.9 |
| encode | 2.9 | 1.72 | 2.94 |
| total | 92.9 | 92.3 | 574.0 |

## Bottleneck analysis

`transform` is the hot stage: ~89.6 ms of ~93 ms total (~96%). Measured complexity is
quadratic in output pixels: with a fixed 32x32 (1024 px) input, isolated timing gives
21.3 ms at 128x128, 86.5 ms at 256x256, 361 ms at 512x512 — i.e., 4.06x and 4.17x growth per
4x output pixels (a linear stage would grow 4x per 4x *input* pixels; this grows 4x per 4x
*output* pixels because the inner loop rescans the entire input for every output pixel:
O(outW·outH × inW·inH) = 67M inner iterations at 256x256).

Root cause: `resize` recomputes the average over the *whole* input image for every output
pixel. The averaging set never changes, so every output pixel is the same constant — verified
empirically (all 65,536 output pixels identical, value `124,124,47`).

The proposed encode optimization: I measured it both in isolation and in the full pipeline.
The `out += ...` loop is **not O(n²)** under V8: isolated encode of 46 MB output (2048x2048)
takes ~250 ms, and a true quadratic at that size would take seconds to minutes. Growth per 4x
bytes was 2.9x/3.5x/5.9x/2.5x — sub-quadratic, consistent with V8 rope concatenation (the
comment in `encode.js` was accurate). In the full pipeline at 256x256, `array + join()`
was *slower*, not faster: encode median 3.30–3.57 ms vs 2.02–2.61 ms for `+=` (disjoint across
3 invocations each).

## Fix

`src/stages/transform.js`: since every output pixel is the average of the same full input
set, compute the three channel totals once in a single pass over the input (O(inPx)) and
materialize the constant output pixel O(outPx) times. The arithmetic is identical — same
integer sums, same `count = width*height`, same `Math.round` — so every byte of output is
unchanged. Measured complexity after fix: 0.0013 ms/outPx constant per-pixel cost collapses
to O(inPx + outPx).

The proposed `encode.js` change was **not** adopted (see Verdict).

## After fix (same protocol, same input)

Invocation medians (3 invocations of warmup 3 / runs 7): transform 0.66/0.61/0.64 ms,
encode 2.02/2.61/2.13 ms, total 3.10/3.45/3.27 ms.

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | 0.18 | 0.16 | 0.26 |
| transform | 0.63 | 0.55 | 0.82 |
| encode | 2.6 | 1.60 | 3.02 |
| total | 3.36 | 2.32 | 4.04 |

Secondary check at `--out 512x512` (warmup 3, runs 5, 2 invocations): transform
349.6/362.5 ms → 1.74/1.86 ms; total 377.3/389.3 ms → 19.4/20.1 ms.

## Output equivalence

Golden output captured from the unmodified pipeline at 256x256 (720,904 bytes). The fixed
pipeline reproduces it byte-for-byte (`===` on the full string). Additionally, the fixed
resize was diffed against the original algorithm (inlined copy) at 1x1, 32x32, 64x48,
127x129, 256x256 and 400x300 — all byte-identical.

## Verdict on the proposed change

**Reject.** The proposal's premise is false: the `+=` loop is rope-based, not O(n²), and
measured as such (46 MB in ~250 ms; sub-quadratic growth). It targets the wrong stage —
`encode` is 2.9 ms of a ~93 ms baseline, so even a perfect encode would not fix the reported
slowness. Implemented as proposed it was measurably *worse* (encode median 3.30–3.57 ms vs
2.02–2.61 ms at 256x256; total ~3.9 ms vs ~3.3 ms). The actual bottleneck, `transform`
(~96% of runtime, quadratic in output pixels), was fixed instead: 89.6 → 0.63 ms at 256x256
(~140x), 350 → 1.8 ms at 512x512 (~190x), with byte-identical output.
