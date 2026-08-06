# Baseline: 12-review-noise-gate (revision 1)

- Model: kimi-for-coding/k3 (opencode defaults)
- Harness: opencode desktop session, 2026-08-06
- Pinpoint commit: 43b6ffe
- Fixture: scenarios/12-review-noise-gate (generator: setup.cjs) (b3037a2900f0a6ecd323dfeb38cb96af0e2da29c12744e82ff325cbf64de499a)

| Condition | Rep | Status | Critical | Overall | Notes |
| --- | ---: | --- | --- | --- | --- |
| no-skill | 1 | FAIL | 2/4 | 5/7 | lost: C3, C4 |
| no-skill | 2 | FAIL | 2/4 | 5/7 | lost: C3, C4 |
| with-skill | 1 | PASS | 4/4 | 7/7 |  |
| with-skill | 2 | FAIL | 3/4 | 6/7 | lost: C4 |
| with-skill | 3 | FAIL | 3/4 | 6/7 | lost: C4 |

Raw repetitions are reported per run; no averaging hides a regression.
