# TODO

Planned work that is not yet scheduled. Each entry carries its motivation and
next concrete step so a future session can pick it up without archaeology.
Remove entries when done; do not keep a completed archive. Open bugs and
user-facing proposals belong in issues, not here.

## Under consideration

### Scenario 12 baseline run

**What:** Build the fixture for `evals/scenarios/12-review-noise-gate.md`
(planted currency-path blocker, two documented decoys, linter-covered style
issues) and run an A/B baseline with and without the `pinpoint-review` Skill.

**Why:** The scenario is unproven until a no-Skill run shows the failure modes
it was designed to catch (missed blocker, decoy findings, padded finding
lists). A scenario the agent can pass without the Skill proves nothing.

**Next step:** Build the fixture per the scenario's fixture requirements, run
baseline on the current model, then run with `pinpoint-review` loaded and
score both per `evals/SCORING.md`. Record results in the commit that adjusts
the Skill from observed failure modes.

### `pinpoint-refactor` Skill

**What:** A companion Skill applying the Pinpoint discipline to
behavior-preserving structural changes (refactoring, extraction, module
splits). Its invariant is zero behavior change; its oracle is behavior
equivalence, not a red/green test. It must not teach decomposition technique —
that belongs to the model and the project's conventions.

**Why:** The core Skill's workflow entry presumes a defect report ("capture
expected and observed behavior", "locate the first incorrect transition"),
which does not exist for refactoring. Whether agents skip that machinery
gracefully or fabricate a root cause is untested.

**Next step:** Run a refactoring A/B baseline first (scenario: extract a
metadata-handling layer with planted behavioral hazards such as ordering,
error-message text, or identifier stability). Use the observed failure modes
to design the Skill's sections and Final Gate rows, then add the scenario as
`evals/scenarios/11-refactoring-preservation.md`. Do not write the Skill
before the baseline exists.
