# Trigger routing contract

The intended automatic-selection behavior for the five Pinpoint Skills, before
any description tuning (Phase 4.4). The dataset in `train.jsonl` /
`validation.jsonl` encodes this contract; every case's `family` maps to one
clause below. Descriptions may only be rewritten to move measured behavior
toward this contract, never the contract toward measured behavior.

## Routes

1. **`pinpoint`** — investigate and implement a defect fix or a measured
   performance improvement at the owning boundary. A stated or clearly implied
   defect (crash, wrong result, regression, freeze, leak) with a fix requested
   routes here. Internal review at its own review gate is part of the
   workflow, not a separate route.

2. **`pinpoint-review`** — standalone read-only audit of an existing diff,
   branch, pull request, or completed change. It edits nothing. Read-only
   phrasing ("只读", "别动代码", "don't change anything") forces this route
   over `pinpoint` even when defects are suspected.

3. **`pinpoint-commit`** — prepare and create commits. Message drafting is in
   scope, but creating the commit requires explicit authorization in the
   current request. Authorization is never inherited from earlier turns,
   approvals of the code, or the existence of staged changes.

4. **`pinpoint-pr`** — prepare or publish pull-request work within explicit
   authorization, including authorized pushes. Drafting PR text with
   publication withheld stays inside this Skill in draft-only mode. It never
   merges, under any phrasing, including "merge if it checks out".

5. **`pinpoint-help`** — explain installation, invocation, routing, and suite
   boundaries. Naming a Skill inside a help question is not a request to
   perform that Skill's workflow.

## Non-routes

- Pure behavior-preserving refactoring with no stated defect has no Pinpoint
  route (owned by the Scenario 11 decision gate, Phase 7).
- Generic architecture advice, code explanation, and discussion trigger no
  Pinpoint Skill.
- History-rewriting git operations (squash, rebase) have no Pinpoint route;
  `pinpoint-commit` only creates commits from authorized changes.
- Plain implementation work with no defect or performance claim has no
  Pinpoint route.
- Merge requests have no Pinpoint route under any phrasing.

## Precedence for mixed requests

1. "Review this branch and fix it" → primary route is `pinpoint` (mutation was
   requested); review happens at its gate. It must not stall in standalone
   read-only mode.
2. "Review and merge" → `pinpoint-review` runs; the merge is refused outright.
3. "Commit, push, and open a PR" → primary route `pinpoint-commit`; the
   sequence may continue to `pinpoint-pr` because publication was explicitly
   authorized; merging remains forbidden.
4. Help questions containing workflow words ("which skill writes commit
   messages?") → `pinpoint-help`; no workflow starts.
5. Draft-only requests stay draft-only regardless of how routine the delivery
   action would be.

## Allowed multi-Skill sequences

Sequences are distinct from the primary automatic route:

- `pinpoint` → `pinpoint-review` (internal gate; not a separate selection)
- `pinpoint-commit` → `pinpoint-pr` (only when push/publication is explicitly
  authorized)
- `pinpoint-review`, `pinpoint-help` → terminal; no follow-on workflow

Any other chaining requires the user to request each step explicitly.

## Family mapping

| family | contract clause |
| --- | --- |
| `impl-not-review` | route 1 |
| `review-not-impl` | route 2 |
| `draft-commit-no-auth` | route 3 authorization |
| `commit-authorized` | route 3 |
| `pr-draft-vs-publish` | route 4 authorization |
| `help` | route 5 |
| `refactor-no-defect` | non-routes |
| `generic-advice` | non-routes |
| `sequence-no-merge` | precedence 3 |
| `review-and-merge` | precedence 2 |
| `commit-out-of-scope` | non-routes |
| `nondefect-implementation` | non-routes |
