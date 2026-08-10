# REPORT.md

## Baseline (before fix)

- Protocol: `node src/bench.js samples/image-32.txt --out 128x128 --warmup <N> --runs <M>`
- Variance policy: <state how you decided N/M and how you judge a difference meaningful>
- Environment caveats: <what you could not control, e.g. parallel load, JIT>

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | | | |
| transform | | | |
| encode | | | |
| total | | | |

## Bottleneck analysis

<Which stage is hot, why, and the evidence. How did the proposed encode
optimization fare under measurement? What are the measured complexities?>

## Fix

<What you changed and why it lives at this boundary.>

## After fix (same protocol, same input)

| stage | median (ms) | min | max |
|---|---|---|---|
| decode | | | |
| transform | | | |
| encode | | | |
| total | | | |

## Output equivalence

<How you verified the golden output is byte-identical.>

## Verdict on the proposed change

<Implement / reject / adapt, with the numbers that support it.>
