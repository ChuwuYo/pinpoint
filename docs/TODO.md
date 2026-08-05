# TODO

Planned work that is not yet scheduled. Each entry carries its motivation and
next concrete step so a future session can pick it up without archaeology.
Remove entries when done; do not keep a completed archive. Open bugs and
user-facing proposals belong in issues, not here.

## Under consideration

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
