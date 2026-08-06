# Baseline: 13-veto-evidence (revision 1)

- Model: kimi-for-coding/k3 (opencode defaults)
- Harness: opencode desktop session, 2026-08-06
- Pinpoint commit: 74dfb1e
- Fixture: scenarios/13-veto-evidence/fixture (64b6495652e254362e589084147e7ad1dc4faee28cb8bdeda46b0bb49e4f7c43)

| Condition | Rep | Status | Critical | Overall | Notes |
| --- | ---: | --- | --- | --- | --- |
| no-skill | 1 | PASS | 4/4 | 6/6 |  |
| no-skill | 2 | FAIL | 1/4 | 2.5/6 | lost: C1, C3, C4, N2 |
| no-skill | 3 | PASS | 4/4 | 6/6 |  |
| with-skill | 1 | PASS | 4/4 | 6/6 |  |
| with-skill | 2 | PASS | 4/4 | 6/6 |  |

Raw repetitions are reported per run; no averaging hides a regression.
