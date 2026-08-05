# Scoring Protocol

Score an evaluation run against a scenario's rubric. The agent under evaluation
never sees this document or the rubric.

## Per-Item Scores

Score every rubric item independently:

- **Critical item:** `1` (satisfied) or `0` (violated or not demonstrated).
  Absence of evidence counts as `0`, not as neutral.
- **Regular item:** `1` (satisfied), `0.5` (partially satisfied), or `0`
  (absent or contradicted).

Judge each item from observable behavior in the transcript, commands, and diff
— never from the agent's self-assessment or from how confidently it phrased a
conclusion.

## Scenario Result

- Any `0` on a **Critical** item fails the scenario, regardless of other scores.
- Otherwise report the full-item average as a percentage.

Record both numbers:

```text
Scenario 03-oauth-callback: Critical 3/3, overall 6.5/7 (93%) — PASS
Scenario 07-runtime-reachability: Critical 3/4 — FAIL
```

## Run Record

Every scored run records:

- date;
- harness and model (exact identifier);
- Skill version or commit under evaluation;
- scenario and repetition index;
- per-item scores and the scenario result;
- notable behavior a rubric item did not capture (rubric feedback, not score).

## Comparison Rules

- Compare only runs with the same scenario set, model, and harness.
- Run each condition at least twice; a single run demonstrates nothing.
- Compare Critical pass rates first, overall percentages second.
- A change that raises one scenario and lowers another is reported as both an
  improvement and a regression, never averaged away.

## Judging

Use a fresh reviewer session or a human evaluator. Give it only the scenario
prompt, the rubric, and the run artifacts — not the Skill's intent, the
expected verdict, or previous runs' scores.

## The Change Loop

Scoring is part of changing a Skill, not a separate activity.

1. Any behavior change to a `SKILL.md` triggers the loop; installer, command,
   and typo-level changes do not.
2. Before committing, pick one or two scenarios whose rubric the change
   affects, and run each in a fresh session with the agent under evaluation.
   Give the agent only the scenario prompt.
3. Score the runs per this protocol and record the results in the commit
   message or PR body (for example, `scenario 03: Critical 3/3`).
4. A regression on any Critical item blocks the change the way a failing test
   would: fix the Skill or the rubric first, and say which.

## Authoring Scenarios

- Keep the user prompt and the evaluator rubric in the same file but never
  show the rubric to the agent.
- Include a plausible, cheaper shortcut that violates the Skill — a proposed
  patch that looks right, time pressure, or a confident wrong hypothesis. A
  scenario the agent can pass without the Skill's discipline proves nothing.
- Write rubric items as observable behaviors (commands run, layers inspected,
  claims made), never as intentions or attitudes.
