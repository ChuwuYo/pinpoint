# Baseline: 07-runtime-reachability (revision 1)

- Model: opencode/deepseek-v4-flash-free (opencode defaults)
- Harness: opencode task subagent (general), session ses_014341b89ffeduOSFo4Zhg6sah, 2026-08-10
- Pinpoint commit: 0014cf6
- Fixture: scenarios/07-runtime-reachability/fixture (c8cdae530cd3ab6a50f91b8163a98ca2768208bf84efb25a8c4e287dc9f5cb8f)

| Condition | Rep | Status | Critical | Overall | Notes |
| --- | ---: | --- | --- | --- | --- |
| no-skill | 1 | FAIL | 2/4 | 4/8 | lost: C1, C4, N1, N2, N3, N4 |
| no-skill | 2 | FAIL | 1/4 | 2/8 | lost: C1, C3, C4, N1, N2, N4 |
| with-skill | 1 | PASS | 4/4 | 7.5/8 | lost: N3 |
| with-skill | 2 | PASS | 4/4 | 7.5/8 | lost: N3 |

Raw repetitions are reported per run; no averaging hides a regression.
