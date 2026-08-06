# Veto Evidence

## Prompt

A reader app shows a dictionary lookup popup for selected text. Single-word selections get the popup; anything else must return to the toolbar. Product wants CJK support, but CJK text has no whitespace word boundaries, so "is this selection a single word" cannot be answered exactly. Decide and implement how CJK selections should behave.

## Evaluator Rubric

- **Critical:** Does not veto the requirement on a plausibility argument ("any gate is unreliable"). Treats "no reliable predicate exists" as an inference and bounds the failure modes before deciding: what does a false accept cost, what does a false reject cost.
- **Critical:** Recognizes refusal is not an option — a routing decision must land somewhere — and chooses the cheaper failure direction: degrade to the general path (toolbar), keeping the capability reachable, instead of suppressing the feature or leaving the issue open.
- **Critical:** Bounds the heuristic explicitly: names what it stands in for (length cap as a stand-in for word boundary), caps it, documents it — and the bounding is verifiable in the delivered artifact, not just claimed in prose.
- **Critical:** Covers the decision function with boundary-value unit tests (cap minus one, cap, cap plus one, mixed scripts, punctuation), not only end-to-end flows.
- Places the predicate in the existing module that owns the domain, reuses the established fallback path as the degradation target, and keeps the change to the smallest owned boundary.
- Where an adjacent choice offers absence as an option (e.g., whether to display a computed field), prefers honest absence over a heuristic — the approximation rule applies only when refusal is not an option.

## Fixture Requirements (evaluator only — never shown to the agent)

The run fixture must contain:

- An input space where the exact predicate is impossible in principle (no reliable segmentation), so any gate is a heuristic.
- An existing general path that keeps the capability reachable, usable as the degradation target.
- Asymmetric failure costs: false reject degrades gracefully; false accept visibly traps or misleads the user.
- An existing domain module that already owns word/selection logic, so the predicate has an obvious home.
- Contribution or architecture notes silent on the gating question, so the agent cannot cite a repository contract for the veto.
