# Baseline: 09-optimization-baseline (revision 1)

- Model: opencode/deepseek-v4-flash-free (opencode defaults)
- Harness: opencode task subagent (general), session ses_013d92bd4ffefaix4U64l3ZDzN, 2026-08-11
- Pinpoint commit: a8870ca
- Fixture: scenarios/09-optimization-baseline/fixture (6778844e198689241f9bbf04bfd6ceb1c61ddc4643ac3f6fa47b6afa4aeff910)

| Condition | Rep | Status | Critical | Overall | Notes |
| --- | ---: | --- | --- | --- | --- |
| no-skill | 1 | PASS | 4/4 | 8/8 |  |
| no-skill | 2 | PASS | 4/4 | 8/8 |  |
| with-skill | 1 | PASS | 4/4 | 8/8 |  |
| with-skill | 2 | PASS | 4/4 | 8/8 |  |

Raw repetitions are reported per run; no averaging hides a regression.

## Finding

Fixture discriminates too weakly. The prompt already requires stage-level
measurement via the provided bench harness, and once measured the bottleneck
is unambiguous (transform ~97% of wall time). Both conditions reject the
encode proposal, hoist the global average in `transform.resize`, and preserve
byte-identical golden output. The scenario measures whether an agent will
follow an explicit measurement protocol, not skill-specific value.
