# TODO

This file is the ordered, dependency-aware roadmap for taking Pinpoint from a
strongly designed Skill suite to a reproducible, externally credible, release-ready
one.

The order is intentional. Complete each phase's exit criteria before changing
behavior in a later phase. The central rule is:

> Establish the baseline, freeze the scenario, then change the Skill.

## How to maintain this file

- Keep only unfinished work. Remove completed entries instead of maintaining a
  completed-work archive.
- Preserve the phase order unless new evidence changes a dependency. Record the
  reason when reordering work.
- Track implementation details in issues or pull requests when useful, but keep
  the dependency order and acceptance criteria here.
- Treat any behavioral edit to a `SKILL.md` or routing description as an
  evaluation-triggering change, even when the edit looks small.
- Do not count an infrastructure failure as a model or Skill failure. Mark the run
  `INVALID`, fix the infrastructure, and rerun from a clean fixture.
- Do not claim improvement from a single run. Use repeated, same-condition A/B
  runs and report regressions separately instead of averaging them away.
- Do not add a new Skill, rule, reviewer axis, or delivery capability merely
  because it sounds useful. Add it only after a repeatable failure demonstrates
  the need.
- Keep permission boundaries explicit: installing or invoking Pinpoint never
  grants permission to commit, push, publish a pull request, merge, deploy, clean
  unrelated changes, or edit project instructions.

## Contents

1. [Execution order](#execution-order)
2. [Target repository layout](#target-repository-layout)
3. [Phase 0 — Repair suite consistency](#phase-0--repair-suite-consistency)
4. [Phase 1 — Build the minimum reproducible evaluation system](#phase-1--build-the-minimum-reproducible-evaluation-system)
5. [Phase 2 — Complete the existing Scenario 13 baseline](#phase-2--complete-the-existing-scenario-13-baseline)
6. [Phase 3 — Harden `pinpoint-review`](#phase-3--harden-pinpoint-review)
7. [Phase 4 — Isolate Skill triggering and routing](#phase-4--isolate-skill-triggering-and-routing)
8. [Phase 5 — Harden installation, packaging, and CI](#phase-5--harden-installation-packaging-and-ci)
9. [Phase 6 — Convert the remaining scenarios into public evidence](#phase-6--convert-the-remaining-scenarios-into-public-evidence)
10. [Phase 7 — Decide whether `pinpoint-refactor` should exist](#phase-7--decide-whether-pinpoint-refactor-should-exist)
11. [Phase 8 — External validation and the 1.0 gate](#phase-8--external-validation-and-the-10-gate)
12. [Deferred, evidence-triggered work](#deferred-evidence-triggered-work)
13. [Protected strengths and non-goals](#protected-strengths-and-non-goals)
14. [Recommended pull-request sequence](#recommended-pull-request-sequence)

## Execution order

| Order | Phase | Depends on | Primary outcome | Blocks later work because |
| ---: | --- | --- | --- | --- |
| 0 | Suite consistency | Nothing | One authoritative five-Skill inventory and accurate docs | Evaluation and installer work must agree on what the suite contains |
| 1 | Reproducible evaluation foundation | Phase 0 | A thin end-to-end scenario/run/score/report loop | Behavioral changes need repeatable evidence |
| 2 | Scenario 13 baseline | Phase 1 | Evidence for or against the existing veto/approximation rules | Those rules currently lack a reproducible A/B baseline |
| 3 | `pinpoint-review` hardening | Phases 1–2 | Unambiguous finding retention, gate, and verdict semantics | Review is the suite's delivery gate and must not hide blockers or block on nits |
| 4 | Trigger and routing isolation | Phase 3 | Measured boundaries between all five Skills | Description changes are behavioral changes and need eval support |
| 5 | Installer, package, and CI hardening | Phases 0–4 | Verified global/project installation for every supported harness | Distribution must faithfully deliver the now-stable suite |
| 6 | Remaining scenario fixtures and baselines | Phases 1–5 | Broader public evidence across the core workflow | New capabilities should be considered only after the existing suite is measured |
| 7 | `pinpoint-refactor` decision | Phases 1 and 6 | Evidence-based create/do-not-create decision | A companion Skill must solve a demonstrated failure rather than a hypothetical one |
| 8 | External validation and 1.0 | All prior phases | Real-project evidence and explicit maturity criteria | A stable release should be based on reproducibility, not repository popularity |

Work from a later phase may be researched earlier, but do not merge a later
behavioral change before the preceding gates are satisfied.

## Target repository layout

This is the target shape, not a requirement to create every empty directory in
the first pull request. Add each path only when its owning phase begins.

```text
.
├── README.md
├── README.zh-CN.md
├── INSTALL.md
├── package.json
├── bin/
│   └── pinpoint-install.mjs
├── commands/
│   ├── pinpoint.md
│   ├── pinpoint-review.md
│   ├── pinpoint-commit.md
│   ├── pinpoint-pr.md
│   └── pinpoint-help.md
├── skills/
│   ├── pinpoint/
│   │   └── SKILL.md
│   ├── pinpoint-review/
│   │   └── SKILL.md
│   ├── pinpoint-commit/
│   │   └── SKILL.md
│   ├── pinpoint-pr/
│   │   └── SKILL.md
│   └── pinpoint-help/
│       └── SKILL.md
├── docs/
│   ├── TODO.md
│   └── research-ai-code-review.md
├── scripts/
│   ├── eval-validate.mjs                   # Planned in Phase 1
│   ├── eval-score.mjs                      # Planned in Phase 1
│   ├── eval-report.mjs                     # Planned in Phase 1
│   └── eval-run.mjs                        # Add only with the first stable harness adapter
├── evals/
│   ├── README.md                           # Format, isolation, and reproduction instructions
│   ├── SCORING.md
│   ├── schemas/
│   │   ├── scenario.schema.json
│   │   ├── run.schema.json
│   │   └── grading.schema.json
│   ├── harnesses/
│   │   └── manual.md                       # Initial harness-neutral execution contract
│   ├── trigger/
│   │   ├── train.jsonl
│   │   └── validation.jsonl
│   ├── scenarios/
│   │   ├── 01-ownership-boundary/
│   │   │   ├── scenario.json
│   │   │   ├── prompt.md
│   │   │   ├── rubric.json
│   │   │   ├── fixture/
│   │   │   └── checks/
│   │   ├── 02-accessible-overlay/
│   │   ├── 03-oauth-callback/
│   │   ├── 04-rendered-geometry/
│   │   ├── 05-safe-delivery/
│   │   ├── 06-language-and-conventions/
│   │   ├── 07-runtime-reachability/
│   │   ├── 08-cli-export-artifact/
│   │   ├── 09-optimization-baseline/
│   │   ├── 10-value-provenance/
│   │   ├── 11-refactoring-preservation/    # Created only when Phase 7 starts
│   │   ├── 12-review-noise-gate/
│   │   ├── 13-veto-evidence/
│   │   ├── 14-review-verdict-semantics/
│   │   ├── 15-review-finding-budget/
│   │   ├── 16-review-rerank-calibration/
│   │   └── 17-review-packet-and-readonly/
│   ├── runs/
│   │   ├── README.md
│   │   └── <scenario>/<commit>/<condition>/<model>/<repetition>/
│   │       ├── run.json
│   │       ├── final.md
│   │       ├── patch.diff
│   │       ├── commands.jsonl
│   │       ├── validation.json
│   │       └── grade.json
│   └── baselines/
│       └── <release-or-commit>/
│           ├── summary.md
│           └── results.json
├── tests/
│   ├── installer-smoke.mjs
│   └── package-smoke.mjs                   # Planned in Phase 5
└── .github/
    └── workflows/
        └── validate.yml
```

Large traces need not be committed when they contain secrets, private repository
content, or excessive generated output. Commit the normalized run metadata,
final response, patch, deterministic results, grade, and checksums. Store any
permitted large trace as a release or workflow artifact and link it from
`run.json`.

---

## Phase 0 — Repair suite consistency

### Goal

Fix the one independently observed documentation drift — `INSTALL.md` predates
`pinpoint-review` — and add regression protection proportional to that failure's
scale: a small section-scoped CI consistency check, not a manifest architecture.

The suite inventory is five Skills:

- `pinpoint`
- `pinpoint-review`
- `pinpoint-commit`
- `pinpoint-pr`
- `pinpoint-help`

This phase must not change Skill behavior.

### 0.1 Fix the current installation-document drift

- [ ] Add `pinpoint-review` to the explicit invocation table in `INSTALL.md`.
- [ ] Add the one-Skill installation example for `pinpoint-review`.
- [ ] Add the Codex `$pinpoint-review` and `/skills` invocation example wherever
  individual built-in invocations are listed.
- [ ] Add `pinpoint-review` to every expected-installation and verification list.
- [ ] Audit `README.md`, `README.zh-CN.md`, `INSTALL.md`, `pinpoint-help`,
  command wrappers, installer output, and package metadata for the same five
  names and the same invocation semantics.
- [ ] Remove examples that present the core `pinpoint` Skill and the standalone
  read-only review Skill as interchangeable for the same request. Mixed
  "review and then fix" work should have one documented primary route and an
  explicit transition to review.

### 0.2 Add a lightweight consistency check to CI

- [ ] Add one small step to `validate.yml` — shell or `node -e`, grep-level
  complexity, no new script or test files — that verifies each of the five Skill
  names appears in the designated inventory sections of `INSTALL.md`,
  `README.md`, `README.zh-CN.md`, and `skills/pinpoint-help/SKILL.md`.
- [ ] Scope the check to the relevant table or list section of each file, not a
  whole-file substring match: a name mentioned in passing prose must not
  satisfy a missing table row.
- [ ] Add `README.zh-CN.md`, `docs/**`, `evals/**`, and `scripts/**` to the
  `push` and `pull_request` path filters in `.github/workflows/validate.yml`.
- [ ] Ensure package metadata and lockfiles, when present, also trigger package
  validation.
- [ ] Run the consistency check before installer smoke tests so a naming
  mismatch fails early with a focused error.

### Exit criteria

- [ ] Every public installation, invocation, and verification section includes
  `pinpoint-review` where applicable.
- [ ] CI fails when one of the five names disappears from a designated inventory
  section.
- [ ] `node bin/pinpoint-install.mjs --check` still passes.
- [ ] No `SKILL.md` behavior changed in this phase.

### Likely files

```text
INSTALL.md
README.md
README.zh-CN.md
skills/pinpoint-help/SKILL.md
.github/workflows/validate.yml
```

---

## Phase 1 — Build the minimum reproducible evaluation system

### Goal

Turn the existing scenario descriptions and scoring philosophy into a thin,
runnable, auditable loop:

```text
frozen fixture + hidden rubric
            ↓
  no-skill / with-skill run
            ↓
 normalized artifacts and status
            ↓
 deterministic checks + fresh grading
            ↓
 repeated comparison and report
```

Do not build a multi-provider evaluation platform before the first scenario
works end to end. Scenario 13 is the canary.

### 1.1 Define a versioned scenario contract

- [x] Add `evals/schemas/scenario.schema.json`.
- [x] Give every scenario a stable ID, title, target Skill, prompt path, rubric
  path, fixture path or generator, deterministic check commands, required
  capabilities, allowed mutations, timeout policy, and supported conditions.
- [x] Separate `prompt.md` from `rubric.json`. The candidate agent must receive
  only the prompt and normal repository instructions, never evaluator-only
  fixture notes, planted-fault descriptions, expected verdicts, or rubric
  items.
- [x] Freeze the prompt, rubric, fixture commit/hash, and deterministic checks
  before collecting comparison runs.
- [x] Record scenario revisions explicitly. Do not compare runs across materially
  different fixtures or rubrics as though they were the same scenario.
- [ ] Define a deterministic reset command that restores a clean fixture before
  every repetition.
- [x] Permit scenario-specific setup, but forbid setup that reveals the planted
  fault to the candidate.

### 1.2 Define a normalized run record

- [x] Add `evals/schemas/run.schema.json`.
- [x] Record, at minimum:
  - scenario and scenario revision;
  - `no-skill`, `with-skill`, or `trigger` condition;
  - repetition index and randomized execution order;
  - exact model identifier and model settings;
  - exact harness name and version;
  - Pinpoint commit or release under evaluation;
  - enabled Skill catalog and invocation method;
  - fixture commit/hash and clean-start proof;
  - operating system and relevant runtime/tool versions;
  - commands, exit statuses, and captured validation;
  - final response and patch;
  - start/end repository state;
  - status: `PASS`, `FAIL`, `INVALID`, or `UNSCORED`;
  - infrastructure errors and omitted artifacts.
- [x] Mark missing tools, broken fixtures, harness outages, truncated traces, and
  contaminated Skill catalogs as `INVALID`; never score them as agent failure.
- [x] Redact credentials and private content before retaining artifacts. Record
  the redaction and artifact checksum.

### 1.3 Define machine-readable grading without discarding the current protocol

- [x] Add `evals/schemas/grading.schema.json`.
- [x] Preserve the current rule that each critical item is binary and any missed
  critical item fails the scenario.
- [x] Preserve regular item scores of `1`, `0.5`, or `0`, unless later evaluator
  agreement data justifies a change.
- [x] Require an evidence pointer for every score: transcript span, command,
  changed line, test result, or artifact.
- [x] Record evaluator identity/type and whether grading was human or model-based.
- [x] Use a fresh evaluator context that sees the prompt, hidden rubric, and run
  artifacts, but not the Skill's intended benefit, prior scores, or the other
  A/B condition.
- [x] Add a disagreement field and a tie-break process for semantic items.
- [x] Keep deterministic checks separate from semantic grading so the report can
  distinguish "the artifact is wrong" from "the explanation is incomplete."

### 1.4 Add metrics appropriate to each Skill class

For core implementation scenarios, retain critical pass rate and overall rubric
score, then add:

- [x] root-cause/ownership correctness;
- [x] regression-test relevance;
- [x] scope expansion beyond the proven owner;
- [x] unsupported completion or preservation claims;
- [x] mutation outside the authorized files;
- [x] commit/push/PR/merge/deploy authorization violations;
- [x] fixture success at the real consumer boundary.

For review scenarios, add:

- [x] true positives, false positives, and false negatives;
- [x] precision and recall for planted material findings;
- [x] blocker retention;
- [x] duplicate/static-tool finding rate;
- [x] verdict correctness;
- [x] mutation count;
- [x] unsupported praise or evidence claims.

For trigger scenarios, add:

- [x] per-Skill precision and recall;
- [x] confusion matrix;
- [x] critical authorization-boundary misroutes;
- [x] read-only versus mutating-workflow misroutes;
- [x] explicit-invocation and automatic-trigger results reported separately.

### 1.5 Make repeated A/B runs comparable

- [x] Run each condition at least twice.
- [x] Add a third run when repetitions disagree on any critical item or verdict.
- [x] Use the same scenario revision, model, model settings, harness, tool
  availability, fixture, and evaluator policy for both conditions.
- [x] Randomize condition execution order to reduce sequence and operator bias.
- [x] Use a fresh agent session and freshly reset fixture for every repetition.
- [x] For quality evaluation, invoke the target Skill explicitly so routing noise
  does not contaminate behavior measurement.
- [x] Evaluate automatic triggering separately in Phase 4.
- [x] For `no-skill`, use an isolated Skill catalog and isolated home/config
  directories. Merely omitting an explicit invocation is insufficient if the
  Skill can still auto-load.
- [x] Report raw repetitions and condition variance. Do not hide a regression
  inside a mean score.
- [x] Compare critical pass counts first, then regular score, then efficiency or
  style metrics.

### 1.6 Add the smallest useful tooling

- [x] Add `scripts/eval-validate.mjs` to validate scenarios, run records, grading
  records, file references, fixture hashes, and required artifacts.
- [x] Add `scripts/eval-score.mjs` to compute scenario results and A/B comparison
  tables from normalized records.
- [x] Add `scripts/eval-report.mjs` to generate a stable Markdown summary without
  overwriting raw results.
- [x] Document a manual, harness-neutral execution contract in
  `evals/harnesses/manual.md`.
- [ ] Add `scripts/eval-run.mjs` only when one harness has a stable, testable
  adapter. Do not block the first evidence on a universal runner.
- [x] Make scripts fail with actionable messages and nonzero exit codes.
- [ ] Add fixture self-checks that prove the planted behavior exists before an
  agent run and that the oracle can distinguish correct from incorrect output.
- [x] Run schema, fixture, and report-generation checks in CI.
- [x] Do not run paid or nondeterministic model calls automatically on every
  pull request. Run model evaluations deliberately for behavior-changing work
  and release candidates.

### 1.7 Migrate one canary before migrating the suite

- [x] Convert Scenario 13 into the directory format.
- [x] Validate the full path from clean fixture to normalized report using dummy
  or dry-run records before collecting model results.
- [x] Update `evals/SCORING.md` and add `evals/README.md` with exact reproduction
  commands.
- [x] Leave the other scenario specifications readable during migration; migrate
  them incrementally in their owning phase instead of creating empty fixtures.

### Exit criteria

- [ ] A clean checkout can validate Scenario 13's metadata and fixture.
- [x] The candidate-visible input is mechanically separated from the hidden
  rubric and evaluator-only fixture notes.
- [x] A maintainer can create, validate, score, and report both conditions using
  documented commands.
- [x] Missing or contaminated artifacts become `INVALID`, not misleading
  `PASS`/`FAIL` results.
- [x] At least one synthetic result set proves the scorer catches a critical
  regression, a false positive, and an infrastructure-invalid run.
- [x] CI validates evaluation structure without invoking a model.

### Likely files

```text
evals/README.md
evals/SCORING.md
evals/schemas/*
evals/harnesses/manual.md
evals/scenarios/13-veto-evidence/*
evals/runs/README.md
scripts/eval-validate.mjs
scripts/eval-score.mjs
scripts/eval-report.mjs
tests/*
.github/workflows/validate.yml
```

---

## Phase 2 — Complete the existing Scenario 13 baseline

This phase incorporates the existing unfinished **Scenario 13 baseline run**
without weakening its original intent.

### Goal

Determine whether the core `pinpoint` Skill materially improves decisions where
an exact predicate is unavailable, refusal is not a valid product outcome, and
false-accept/false-reject costs are asymmetric.

### 2.1 Build and freeze the fixture

- [x] Implement the fixture described by
  `13-veto-evidence`:
  - an input space without reliable word segmentation;
  - an existing general toolbar path that preserves capability reachability;
  - a dictionary-popup path where false acceptance visibly traps or misleads;
  - cheaper false rejection that degrades to the toolbar;
  - an existing domain module that owns selection/word logic;
  - repository notes that do not answer the gating decision.
- [x] Make refusal or indefinite deferral based solely on predicate uncertainty
  a plausible shortcut in the scenario, and score that shortcut as a failure;
  do not pre-seed a completed incorrect implementation.
- [x] Include a bounded heuristic oracle and boundary cases at cap minus one,
  cap, cap plus one, mixed scripts, and punctuation.
- [x] Add fixture self-checks proving:
  - exact segmentation is not supplied by the fixture;
  - both routing paths are reachable;
  - the unbounded or suppressive solution fails;
  - the bounded fallback solution is observable at the real UI decision
    boundary.
- [x] Freeze the prompt, rubric, fixture hash, and checks before seeing any
  with-Skill output.
- [x] Do not tune the fixture merely to force a no-Skill failure. The failure mode
  must be plausible and natural.

### 2.2 Run the baseline and treatment conditions

- [x] Run `no-skill` with an isolated catalog that cannot discover Pinpoint.
- [x] Run `with-skill` with the exact pinned `pinpoint` commit and explicit
  invocation.
- [x] Use the same model, harness, settings, fixture revision, and tool access.
- [x] Collect at least two valid runs per condition.
- [x] Run a third repetition when critical items disagree.
- [x] Blind the evaluator to condition and previous results.
- [x] Score both conditions with the normalized protocol.
- [x] Retain the final patch, commands, tests, final response, grade, and
  condition metadata.

### 2.3 Apply an evidence-based decision gate

- [x] If `with-skill` improves the targeted critical behavior without a new
  critical regression, retain the related core rules and record exactly what
  improved.
- [ ] If both conditions pass equally, do not claim the Skill caused success.
  Check whether the scenario lacks discrimination or whether the rule is
  unnecessary. Revise only from an independently observed failure mode, then
  rerun both conditions.
- [ ] If `with-skill` performs worse, revise or remove the responsible rule and
  rerun before merging.
- [ ] If results remain unstable after the third repetition, report the
  instability and keep the rule's status as unproven.
- [x] Publish a compact baseline summary under
  `evals/baselines/<commit>/summary.md`.

### Exit criteria

- [x] Scenario 13 has a committed, resettable fixture and deterministic oracle.
- [x] At least two valid runs exist for each condition, with a third where
  required.
- [x] The result report exposes every repetition and all critical-item outcomes.
- [x] The repository makes no stronger claim than the evidence supports.
- [ ] Any resulting `pinpoint/SKILL.md` edit passes Scenario 13 and a relevant
  regression subset before merge.

---

## Phase 3 — Harden `pinpoint-review`

### Goal

Resolve the current ambiguities among per-axis retention, global ordering, the
five-finding cap, static-check subtraction, the re-rank gate, and final verdicts.

Do not edit `skills/pinpoint-review/SKILL.md` first. Build the targeted fixtures,
record current behavior, then change the text.

### 3.1 Complete the existing Scenario 12 fixture

- [x] Convert `12-review-noise-gate` to the structured scenario format.
- [x] Build the stale CSV total/cache fixture with:
  - the real locale-and-currency blocker reachable through the settings path;
  - at least two documented intentional-contract decoys;
  - configured linter/type-checker findings that must not be repeated as review
    findings;
  - a plausible but unreachable concern;
  - contribution notes that explain the decoys.
- [x] Add deterministic checks for the planted blocker, decoys, configured tool
  diagnostics, and repository state before/after review.
- [x] Run and publish the current no-Skill/with-Skill baseline before changing
  review behavior.

Baseline result (commit `43b6ffe`, frozen hash `b3037a29`): no-Skill 0/2 PASS
(C3 lint-as-findings and C4 verdict format fail in both); with-Skill 1/3 PASS —
both failures are the same repeatable severity-calibration gap: the planted
blocker is found but classified [should-fix], yielding FIX-THEN-COMMIT instead
of BLOCK (C4). Discovery (C1/C2) held in all 5 runs. C4 calibration is the
primary hardening target for 3.3+.

### 3.2 Add targeted review scenarios

#### Scenario 14 — `review-verdict-semantics`

- [x] Structured spec created (fixture_status `planned`); fixture variants pending:
  - one reachable blocker;
  - only should-fix findings;
  - only concrete nits;
  - no material findings;
  - a required deterministic check newly failing because of the diff;
  - a required check that cannot run or produces inconclusive evidence;
  - an unrelated pre-existing failure that must not be fabricated as a diff
    finding.
- [ ] Score both finding classification and final verdict.
- [ ] Require nits to remain advisory rather than becoming an implicit commit
  veto.

#### Scenario 15 — `review-finding-budget`

- [ ] Plant more than five independent, reachable blockers across multiple
  concern axes, plus lower-severity findings and duplicates. (structured spec
  created, fixture_status `planned`)
- [ ] Verify that every distinct blocker survives aggregation.
- [ ] Verify that exact duplicates are merged without merging separate
  consequences that happen to share a root cause.
- [ ] Verify that the non-blocker noise budget cannot hide a blocker.
- [ ] Verify deterministic ordering after deduplication.

#### Scenario 16 — `review-rerank-calibration`

- [ ] Include true actionable findings, true findings whose exact code fix is
  unknown, plausible false positives, unreachable concerns, open questions, and
  diagnostics already enforced by tooling. (structured spec created,
  fixture_status `planned`)
- [ ] Measure which findings survive the second pass.
- [ ] Test whether numeric 0–10 scoring is repeatable enough to justify its
  complexity.
- [ ] Calibrate a real retention threshold from results; do not preserve a rule
  that drops only literal zero if it allows low-evidence noise through.
- [ ] Prefer a simpler evidence/actionability pass gate if numeric scoring does
  not improve precision without reducing recall.

#### Scenario 17 — `review-packet-and-readonly`

- [ ] Include invalid base refs, empty diffs, mixed staged/unstaged work, missing
  intent, missing validation evidence, and a harness that tempts mutation.
  (structured spec created, fixture_status `planned`)
- [ ] Verify packet failure occurs once at the aggregator instead of being
  rediscovered by every reviewer.
- [ ] Verify the report distinguishes reconstructed intent from externally stated
  intent.
- [ ] Snapshot repository status and relevant file hashes before and after.
- [ ] Treat any edit, stage, clean, reset, commit, or generated-file mutation as
  a critical failure unless the fixture explicitly marks it as unavoidable
  tool output and the reviewer reports it.

### 3.3 Clarify discovery, aggregation, and finding retention

After baseline runs exist:

- [ ] Replace "one worst finding per axis" with a rule that retains **all
  independently supported blockers** from every reachable axis.
- [ ] Let each axis report all blockers and a bounded number of lower-severity
  candidates; do not let one noisy axis consume another axis's discovery budget.
- [ ] Clarify that "do not cross-rank axes" applies to independent discovery, not
  to final presentation.
- [ ] Let the aggregator globally order the deduplicated result by severity and
  confidence.
- [ ] Apply the count limit only to non-blockers. Recommended default:
  `all blockers + at most five should-fix/nit findings combined`.
- [ ] Prefer dropping a nit, then the lowest-confidence should-fix, before
  omitting any blocker.
- [ ] Group findings only when they have the same root cause **and** the grouped
  remediation and consequences remain explicit.
- [ ] Keep open questions separate. Never promote uncertainty into a finding to
  fill the report.

### 3.4 Make static checks a gate without duplicating their diagnostics

- [ ] Keep formatter, linter, type-checker, test, and build diagnostics out of
  the LLM finding budget when configured tooling already identifies them.
- [ ] Record each required command, scope, exit status, and attribution:
  `pass`, `diff-caused failure`, `pre-existing/unattributed failure`,
  `unavailable`, or `not applicable`.
- [ ] Add a fixed `Gate status` field to the report.
- [ ] Make a required diff-caused deterministic failure affect readiness even
  though it is not restated as an LLM finding.
- [ ] Do not claim `CLEAR` when required evidence is unavailable or inconclusive.
- [ ] Do not blame the diff for a pre-existing failure without evidence.
- [ ] Keep tool output concise and link to the full artifact when necessary.

### 3.5 Make verdict semantics unambiguous

Use Scenario 14 to validate this target behavior:

- [ ] `BLOCK`: at least one blocker stands, or a required deterministic gate
  fails because of the diff.
- [ ] `FIX-THEN-COMMIT`: no blocker stands, but at least one should-fix stands,
  or required verification is missing/inconclusive.
- [ ] `CLEAR`: no blocker or should-fix stands and required gates pass or are
  genuinely not applicable.
- [ ] Nits may be shown as advisory items under `CLEAR`; nits alone must not
  block commit readiness.
- [ ] Report pre-existing or unattributed gate failures separately. If the
  three-verdict vocabulary remains confusing for evidence-only gaps, evaluate a
  rename or fourth verdict in Scenario 14 before changing the public contract.
- [ ] State that the verdict applies to the reviewed scope and evidence, not to
  unreviewed code or unexecuted environments.

### 3.6 Calibrate the second-pass finding gate

- [ ] Treat factual correctness and reachability as hard gates, not soft style
  scores.
- [ ] Require direct support from inspected code, a diff hunk, repository rule,
  runtime path, or validation artifact.
- [ ] Require concrete actionability: a fix direction, verification step, owner
  boundary, or precise question whose answer determines the outcome.
- [ ] Allow a valid finding when the exact patch is unknown, provided the defect
  and next verification/fix boundary are concrete.
- [ ] Demote low-evidence but plausible concerns to open questions.
- [ ] Select numeric thresholds only after Scenario 16 shows evaluator
  calibration. Otherwise use explicit pass/fail gates to avoid false precision.
- [ ] Record why every candidate was retained, demoted, deduplicated, or dropped
  in evaluation artifacts, even though the public review remains concise.

### 3.7 Make review depth risk-based

- [ ] Trigger independent reviewers based on reachable risk, not diff size alone.
- [ ] Treat security, persistence, destructive operations, protocol boundaries,
  identity/authorization, broad dispatch, unclear ownership, and cross-platform
  behavior as depth triggers.
- [ ] Use fresh read-only contexts for independent axes when supported.
- [ ] Keep single-reviewer mode valid for bounded changes and disclose it.
- [ ] Do not spawn reviewers for unreachable axes merely to satisfy a fixed
  count.
- [ ] Measure whether extra reviewers increase blocker recall enough to justify
  latency and noise.

### 3.8 Update the fixed report shape

Evaluate a report containing:

```text
## Review report
Scope: <base..head or exact worktree scope>
Mode: <independent-axis | single-reviewer>
Packet gaps: <none | explicit gaps>
Gate status: <PASS | FAIL | INCOMPLETE | NOT-APPLICABLE>
What holds up: <supported claims with evidence>
Findings:
  1. [blocker · high] file:line — defect — consequence — fix/verification direction
Advisory nits: <optional; never commit-blocking by themselves>
Open questions: <uncertainty not promoted to findings>
Verdict: blocker N · should-fix N · nit N → BLOCK | FIX-THEN-COMMIT | CLEAR
```

- [ ] Keep praise evidence-based and brief.
- [ ] Include every blocker even when the report exceeds the normal noise budget.
- [ ] Expose packet gaps and gate incompleteness before the verdict.
- [ ] Keep finding IDs stable within one run so grading and follow-up can refer to
  them.

### 3.9 Prove the change before accepting it

- [ ] Run current and proposed `pinpoint-review` behavior on Scenarios 12 and
  14–17 under the same conditions.
- [ ] Require no lost planted blocker.
- [ ] Require improved or unchanged precision and false-positive count.
- [ ] Require correct verdicts for blocker-only, should-fix-only, nit-only,
  clean, failed-gate, and incomplete-gate variants.
- [ ] Require zero repository mutation.
- [ ] Reject instruction growth that adds no measurable value.
- [ ] Update `SKILL.md`, command copy, help, and docs only after the target
  behavior is supported.

### Exit criteria

- [ ] All blockers survive finding-budget enforcement.
- [ ] Static-tool diagnostics are not duplicated, but required failures affect
  readiness.
- [ ] Nit-only reviews end `CLEAR` with advisory nits.
- [ ] The re-rank gate removes low-evidence findings at a calibrated threshold or
  uses a simpler validated gate.
- [ ] Packet errors and read-only violations are deterministically tested.
- [ ] Repeated A/B results show no critical regression across Scenarios 12 and
  14–17.

---

## Phase 4 — Isolate Skill triggering and routing

### Goal

Make automatic selection reliably distinguish the five workflows before
tightening descriptions. Quality evaluation and trigger evaluation must remain
separate.

### 4.1 Define the intended routing contract

- [ ] `pinpoint`: investigate and implement a defect fix or measured performance
  improvement at the owning boundary.
- [ ] `pinpoint-review`: perform a standalone read-only audit of an existing
  diff, branch, pull request, or completed change.
- [ ] `pinpoint-commit`: create a commit only after explicit authorization to
  commit the intended changes.
- [ ] `pinpoint-pr`: prepare or publish pull-request work only within the user's
  explicit authorization; never merge.
- [ ] `pinpoint-help`: explain installation, invocation, routing, and suite
  boundaries without performing another workflow.
- [ ] Define precedence for mixed requests. Example: "review this branch and fix
  it" routes primarily to mutating `pinpoint`, then invokes read-only review at
  the review gate; it must not remain trapped in standalone read-only mode.
- [ ] Define allowed multi-Skill sequences separately from the primary automatic
  route.

### 4.2 Build trigger datasets before editing descriptions

- [ ] Add `evals/trigger/train.jsonl` and `validation.jsonl`.
- [ ] Give each case a stable ID, locale, prompt, expected primary Skill,
  allowed secondary sequence, forbidden Skills, criticality, and rationale.
- [ ] Include realistic English and Chinese prompts.
- [ ] Include explicit and implicit requests, terse prompts, long issue reports,
  typos, conversational phrasing, and mixed requests.
- [ ] Include near-miss hard negatives, not only obvious unrelated prompts.
- [ ] Keep a held-out validation set that is not used while rewriting
  descriptions.
- [ ] Start with approximately 20 high-value near-miss cases covering the two
  most consequential routing boundaries: implementation versus standalone
  read-only review (~8), and drafting versus explicitly authorized delivery
  actions (~8), plus ~4 mixed-request, help, or merge-forbidden control cases.
  Mix English and Chinese cases across the set rather than duplicating every
  case in both languages, and never place translations of the same case in
  both the train and validation sets.
- [ ] Grow the dataset from evidence: every observed production or evaluation
  misroute becomes a regression case.
- [ ] Repeat routing trials because automatic selection is stochastic.

Required hard-negative families:

- [ ] implementation request → `pinpoint`, not standalone `pinpoint-review`;
- [ ] read-only diff/PR audit → `pinpoint-review`, not mutating `pinpoint`;
- [ ] request to draft a commit message without committing → no implicit
  `pinpoint-commit` authorization;
- [ ] explicit request to create the commit → `pinpoint-commit`;
- [ ] request to draft PR text versus request to publish a PR → both remain
  inside `pinpoint-pr`, with publication separately authorized;
- [ ] help/install/which-command questions → `pinpoint-help`;
- [ ] pure behavior-preserving refactor → no core defect workflow unless a
  defect is also stated; keep unowned until Phase 7 proves a route;
- [ ] generic architecture advice or code explanation → no Pinpoint Skill;
- [ ] "commit, push, and open a PR" → explicit sequence with no merge permission;
- [ ] "review and merge" → review may run, merge remains forbidden.

### 4.3 Isolate the trigger harness

- [ ] Use an isolated home/config directory and a controlled Skill catalog.
- [ ] Verify only the intended Pinpoint version and comparison Skills are
  discoverable.
- [ ] Record the full discovered Skill list in every trigger run.
- [ ] Test descriptions in the real catalog shape rather than in a synthetic
  one-Skill vacuum.
- [ ] Run explicit-invocation tests separately; an explicit command should not be
  scored as evidence of automatic trigger quality.
- [ ] Record no-selection, multi-selection, wrong-selection, and unauthorized
  workflow selection distinctly.

### 4.4 Tighten descriptions only after the baseline

- [ ] Narrow the core `pinpoint` description to defect investigation/fix and
  evidence-based performance work.
- [ ] Remove or qualify broad standalone "architecture review" and "regression
  review" language that overlaps `pinpoint-review`.
- [ ] Keep `pinpoint-review` explicitly read-only and centered on an existing
  change.
- [ ] Keep commit and PR descriptions explicit about authorization and
  non-inherited permissions.
- [ ] Keep help centered on discovery, installation, and routing.
- [ ] Put "use when" and important "do not use when" boundaries in descriptions
  without copying the entire workflow into frontmatter.
- [ ] Update command wrappers, `pinpoint-help`, `README.md`,
  `README.zh-CN.md`, and `INSTALL.md` in the same change.
- [ ] Re-run suite consistency checks after every description/name edit.

### 4.5 Report routing quality honestly

- [ ] Publish per-Skill precision, recall, and the confusion matrix.
- [ ] Treat unauthorized commit/PR selection and read-only/mutating confusion as
  critical errors.
- [ ] Report raw counts while the validation set is small.
- [ ] Use 90% precision and recall as a provisional target only after the
  validation set is large enough to make percentages meaningful; before that,
  require no regression and zero critical authorization misroutes in the
  authored validation set.
- [ ] Compare at least two repetitions per case for release candidates.
- [ ] Add cross-harness routing comparisons after one harness has a stable
  baseline; do not assume one harness's selector generalizes to all others.

### Exit criteria

- [ ] The five workflows have explicit, non-overlapping primary routes.
- [ ] The held-out trigger set includes bilingual positives and near-miss
  negatives for every Skill.
- [ ] Core implementation requests and standalone read-only reviews no longer
  routinely collide.
- [ ] Commit and PR Skills never gain authorization merely from a related
  request.
- [ ] Trigger metrics and confusion matrices are published for the evaluated
  harness/model pair.
- [ ] Description changes introduce no critical regression in behavior scenarios.

---

## Phase 5 — Harden installation, packaging, and CI

### Goal

Verify that the packaged suite installs, updates, discovers, and uninstalls
safely for every supported harness and both scopes, not merely that one expected
file exists.

Preserve the current ownership-marker and no-overwrite behavior.

### 5.1 Expand installer coverage across harnesses and scopes

Test all supported harnesses:

- [ ] Codex
- [ ] Claude Code
- [ ] Cursor
- [ ] OpenCode

Test both scopes:

- [ ] project
- [ ] global

For global tests:

- [ ] isolate `HOME`, `XDG_CONFIG_HOME`, `APPDATA`, `LOCALAPPDATA`, and
  `USERPROFILE` as appropriate for the operating system;
- [ ] prove no test writes to the CI runner's real user configuration;
- [ ] verify cleanup after both successful and failed runs.

For every applicable harness/scope combination:

- [ ] install all five Skills;
- [ ] verify all ownership markers;
- [ ] verify all five OpenCode command files where commands are required;
- [ ] run install twice to prove idempotence;
- [ ] test update from an older owned fixture;
- [ ] test `--dry-run` performs no writes;
- [ ] test `--check`;
- [ ] uninstall and prove only managed files are removed;
- [ ] preserve unrelated files and unrelated user changes.

### 5.2 Test conflicts and failure atomicity

- [ ] Reject an unowned Skill destination without changing it.
- [ ] Reject an unowned command destination without changing it.
- [ ] Reject malformed, missing, foreign-repository, or inconsistent ownership
  markers.
- [ ] Test mixed states where some destinations are owned and another conflicts.
- [ ] Preflight every destination before writing so one late conflict cannot
  leave a partial installation.
- [ ] On any failure, verify the filesystem matches the pre-run state except for
  explicitly documented temporary files, which must be cleaned.
- [ ] Test shared directories such as `.agents/skills` without deleting sibling
  Skills.
- [ ] Test an interrupted/partial prior install and define whether repair or
  refusal is the safe behavior.
- [ ] Keep uninstall conservative: never infer ownership from a matching name
  alone.

### 5.3 Verify discoverability, not only file presence

- [ ] Use the pinned `skills` CLI's list/inspection capability where available
  to prove the installed Skills are discoverable.
- [ ] Verify native harness directory layout against the installer's supported
  contract.
- [ ] Verify frontmatter names match invocation names after installation.
- [ ] Verify a fresh-session discovery instruction is documented for harnesses
  that cache capabilities.
- [ ] Where a real harness binary cannot run in CI, state the boundary and use a
  deterministic directory/catalog contract rather than claiming full
  end-to-end discovery.

### 5.4 Test the actual published package shape

- [ ] Add `tests/package-smoke.mjs`.
- [ ] Run `npm pack` and inspect the tarball rather than testing only the source
  checkout.
- [ ] Verify the tarball contains every declared Skill, command, installer file,
  and required documentation file.
- [ ] Verify it excludes fixtures, secrets, local run artifacts, and other
  unintended files unless intentionally packaged.
- [ ] Install from the generated tarball in smoke tests.
- [ ] Verify the packaged entrypoint, version output, and `--check`.
- [ ] Verify package version, release tag, and ownership-marker source are
  consistent.
- [ ] Test the declared minimum Node version and one newer supported runtime.
- [ ] Document the process for intentionally updating the pinned `skills` CLI
  dependency and rerunning compatibility tests.

### 5.5 Strengthen the CI matrix without making it noisy

- [ ] Keep Ubuntu, macOS, and Windows installer smoke coverage.
- [ ] Exercise every harness and both scopes inside the matrix using isolated
  directories.
- [ ] Run fast suite/eval schema checks once on Linux; run path-sensitive
  installer/package checks on all operating systems.
- [ ] Ensure `docs/**`, `evals/**`, `scripts/**`, `README.zh-CN.md`, package
  metadata, and tests trigger the relevant jobs.
- [ ] Pin third-party actions and evaluation/installer dependencies.
- [ ] Produce focused failure messages naming harness, scope, operation, and
  destination.
- [ ] Do not put nondeterministic model calls in required pull-request CI.

### Exit criteria

- [ ] All four supported harnesses pass project and isolated-global tests on the
  supported OS matrix.
- [ ] Every test verifies all five Skills; OpenCode tests verify all five
  commands.
- [ ] Dry-run, check, idempotent install, update, conflict, partial-state,
  uninstall, and package-tarball paths are covered.
- [ ] A failed install leaves no partial managed state.
- [ ] At least one discovery-level assertion is used where supported.
- [ ] The published tarball, not only the repository checkout, passes smoke tests.

---

## Phase 6 — Convert the remaining scenarios into public evidence

### Goal

Build fixtures in the order that maximizes discriminative value and minimizes
environmental ambiguity. For each scenario:

1. convert the specification to the structured format;
2. build and self-check the fixture;
3. freeze prompt/rubric/fixture;
4. run repeated `no-skill` and `with-skill` conditions;
5. publish raw normalized results and a compact summary;
6. turn observed misses into regression cases without leaking the rubric.

Scenario 13 is completed in Phase 2. Scenario 12 and Scenarios 14–17 are completed
in Phase 3.

### Recommended fixture order

#### 6.1 Scenario 07 — Runtime reachability

- [ ] Build the five-loader fixture exactly around actual runtime consumers,
  overrides, dead configuration, and representative inputs.
- [ ] Make PDF's intentional behavior change observable so a false "all other
  formats unchanged" claim fails.
- [ ] Score consumer enumeration, dispatch/configuration tracing, owner-boundary
  choice, and per-format evidence.
- [ ] Prioritize this first because runtime reachability is a central Pinpoint
  differentiator and the fixture can be deterministic.

#### 6.2 Scenario 08 — CLI export artifact

- [ ] Build buffered export/import commands with a happy path that passes by
  luck and a reproducible truncation path.
- [ ] Test close/flush ordering, error propagation, temporary-file atomicity,
  interruption residue, and importer consumption.
- [ ] Distinguish producer success signals from a complete consumable artifact.
- [ ] Record which slow-disk/full-disk/interruption modes are actually simulated
  and which remain unverified.

#### 6.3 Scenario 09 — Optimization baseline

- [ ] Build the staged generator, misleading serializer, real bottleneck, timing
  harness, and golden output/checksum.
- [ ] Control warmup, input, environment, and repetition count.
- [ ] Define a variance policy before scoring speedup claims.
- [ ] Score baseline capture, stage measurement, owner-boundary optimization,
  before/after comparability, and output equivalence.
- [ ] Treat flaky or overlapping measurements as inconclusive rather than as a
  claimed speedup.

#### 6.4 Scenario 10 — Value provenance

- [ ] Build distinct same-named page-count producers with different semantics.
- [ ] Include the dispatcher/event snapshot path that bypasses the obvious
  import graph.
- [ ] Make "honest unknown" the observable correct behavior when no proven
  primary producer exists.
- [ ] Score producer tracing, semantic equivalence checks, display-path
  enumeration, and avoidance of speculative option surfaces.

#### 6.5 Scenario 05 — Safe delivery

- [ ] Build a fixture with unrelated worktree changes, mixed staged/unstaged
  state, and an explicit but bounded delivery request.
- [ ] Test that Pinpoint does not stage, commit, push, open a PR, merge, clean,
  or modify unrelated work beyond authorization.
- [ ] Separate Skill quality from actual credentials or network availability.
- [ ] Add deterministic repository-state checks before and after.

#### 6.6 Scenario 06 — Language and conventions

- [ ] Build a repository whose requested response language differs from source
  language while code conventions remain repository-owned.
- [ ] Include misleading nearby patterns and explicit repository rules.
- [ ] Score user-language compliance, code-style preservation, and evidence
  hierarchy without rewarding imitation of accidental local inconsistency.

#### 6.7 Scenario 01 — Ownership boundary

- [ ] Build a controlled server-rendered app and browser mutation fixture.
- [ ] Separate extension/external mutation, application nondeterminism, invalid
  markup, and server/client branching.
- [ ] Require inspection of the actual DOM mismatch before mitigation.
- [ ] Make broad warning suppression observably fail the rubric.
- [ ] State which parts are browser-simulated versus verified in a real browser.

#### 6.8 Scenario 02 — Accessible overlay

- [ ] Build visual, keyboard, focus, DOM-order, RTL, and accessibility-tree
  checks.
- [ ] Add real assistive-technology validation only where the environment
  supports it.
- [ ] Never claim VoiceOver or TalkBack behavior from screenshots or static
  accessibility-tree inspection alone.
- [ ] Record manual, automated, and unverified evidence separately.

#### 6.9 Scenario 03 — OAuth callback

- [ ] Build TypeScript/native bridge fixtures and documented URI variants.
- [ ] Preserve scheme, authority, port, non-root path, state, PKCE, replay, and
  per-request expected target.
- [ ] Use protocol/provider documentation snapshots or stable references in the
  evaluator fixture.
- [ ] Compile/test every touched language where available; mark unavailable
  native toolchains as evidence gaps, not passes.

#### 6.10 Scenario 04 — Rendered geometry

- [ ] Build a deterministic rendering/geometry fixture with a real consumer
  oracle.
- [ ] Separate source dimensions, layout state, device scale, transforms,
  clipping, and rendered output.
- [ ] Use screenshots only as one artifact, not as sole proof where geometry or
  interaction can be asserted programmatically.
- [ ] Document environment-specific rendering variance.

### Cross-scenario requirements

- [ ] Keep every rubric observable and evidence-linked.
- [ ] Include a plausible shortcut or confident wrong proposal in each fixture.
- [ ] Require the real consumer boundary, not an intermediate proxy.
- [ ] Retain at least two valid runs per condition and a third on critical
  disagreement.
- [ ] Publish known limitations and unverified environments.
- [ ] Maintain a release-level table showing critical pass counts per scenario,
  not only a blended aggregate.
- [ ] Re-run the smallest affected subset for each Skill change and the full
  stable suite for release candidates.
- [ ] Add cross-model and cross-harness runs only after one pinned configuration
  is reproducible; do not mix configurations in one comparison.

### Exit criteria

- [ ] Scenarios 07–10 have deterministic fixtures, repeated A/B evidence, and
  public summaries.
- [ ] Scenarios 05–06 have delivery/convention fixtures and repository-state
  oracles.
- [ ] Scenarios 01–04 explicitly distinguish automated, manual, and unverified
  consumer evidence.
- [ ] Every behavior claim in the README can point to a relevant scenario or is
  clearly labeled as design intent rather than measured outcome.
- [ ] Release reports expose scenario-level regressions instead of hiding them in
  an average.

---

## Phase 7 — Decide whether `pinpoint-refactor` should exist

This phase incorporates the existing unfinished `pinpoint-refactor` proposal.
The outcome may legitimately be **do not create the Skill**.

### Goal

Test whether agents handling behavior-preserving structural work need a separate
Pinpoint workflow, whether the current core Skill harms such work by fabricating
a defect/root cause, or whether normal model/repository conventions are already
sufficient.

### 7.1 Build Scenario 11 before writing the Skill

- [ ] Add `11-refactoring-preservation` only when the evaluation foundation is
  ready.
- [ ] Build the planned fixture: extract a metadata-handling layer while
  preserving:
  - output ordering;
  - exact error-message text;
  - identifier stability;
  - public API shape;
  - serialization format;
  - side-effect timing and observable call order where relevant.
- [ ] Provide a behavior-equivalence oracle that compares the pre-refactor and
  post-refactor artifact across representative and edge inputs.
- [ ] Include tests that appear green while missing at least one planted
  preservation hazard.
- [ ] Make the invariant **zero behavior change** explicit to the evaluator.
- [ ] Do not teach decomposition style in the rubric; judge preservation,
  evidence, scope, and repository conventions.

### 7.2 Establish the baseline conditions

Run, at minimum:

- [ ] `no-skill`;
- [ ] current core `pinpoint`, explicitly invoked;
- [ ] no candidate `pinpoint-refactor` yet.

Measure whether the agents:

- [ ] fabricate expected/observed defect behavior;
- [ ] invent a root cause for a non-defect task;
- [ ] skip preservation inventory;
- [ ] preserve only test-covered behavior rather than observable behavior;
- [ ] widen scope or rename/reformat unrelated code;
- [ ] make unsupported "no behavior change" claims;
- [ ] fail exact ordering, message, or identifier oracles.

### 7.3 Use the baseline to choose one of three outcomes

#### Outcome A — Do not create it

Choose this when no-Skill/current-core runs preserve behavior reliably and a
separate workflow has no clear target failure.

- [ ] Document the result.
- [ ] Keep pure refactoring outside automatic core triggering.
- [ ] Do not add a sixth Skill for catalog completeness.

#### Outcome B — Fix routing or the core boundary only

Choose this when invoking core `pinpoint` makes refactoring worse, but no focused
companion workflow is necessary.

- [ ] Remove refactor-adjacent trigger language from the core Skill.
- [ ] Add the failure as a trigger/behavior regression case.
- [ ] Do not create `pinpoint-refactor`.

#### Outcome C — Create `pinpoint-refactor`

Choose this only when a repeatable preservation failure exists and a focused
candidate Skill improves it without critical regression.

- [ ] Derive sections and final gates from observed misses, not from a generic
  refactoring checklist.
- [ ] Center the workflow on preservation inventory, equivalence oracles,
  smallest structural scope, and explicit unverified behavior.
- [ ] Keep decomposition technique owned by the model and repository.
- [ ] Add targeted A/B runs for the candidate before merging.
- [ ] Add the Skill and command to:
  - the lightweight CI consistency check's inventory sections;
  - installer/package tests;
  - all relevant docs;
  - `pinpoint-help`;
  - trigger train/validation sets.
- [ ] Re-evaluate the suite name/count in user-facing text rather than leaving
  stale "five Skills" claims.
- [ ] Treat the addition as a release-level capability change.

### Exit criteria

- [ ] Scenario 11 has a frozen fixture and repeated baseline evidence.
- [ ] A written decision explains why the Skill is unnecessary, why routing alone
  was changed, or which measured failure a new Skill solves.
- [ ] No `pinpoint-refactor/SKILL.md` exists before the baseline decision.
- [ ] If created, the candidate improves the targeted critical behavior and
  introduces no critical routing, authorization, installer, or preservation
  regression.

---

## Phase 8 — External validation and the 1.0 gate

### Goal

Move from internally designed fixtures to evidence that the suite remains useful
across real repositories, languages, and harnesses.

### 8.1 Run controlled real-project pilots

- [ ] Select real open-source or permissioned repositories with different
  languages, build systems, and architecture styles.
- [ ] Include at least one bug fix, one performance investigation, one standalone
  review, and one authorized delivery workflow.
- [ ] Record repository revision, task source, environment, model/harness, enabled
  Skills, commands, patch, validation, and accepted/rejected review findings.
- [ ] Obtain permission before publishing any non-public repository artifact.
- [ ] Redact secrets and personal information.
- [ ] Ask maintainers to classify findings and patches as accepted, rejected,
  partially accepted, or unverified, with a brief evidence reason.
- [ ] Convert recurring false positives, missed defects, overclaims, and routing
  errors into minimal regression scenarios.
- [ ] Do not treat stars, forks, downloads, or social attention as quality
  metrics.

### 8.2 Publish release-level evidence

- [ ] Generate a benchmark summary for every behavior-changing release.
- [ ] Pin scenario revisions, model/harness configuration, and Pinpoint commit.
- [ ] Show raw repetition counts, critical pass rates, regular scores, review
  precision/recall, trigger confusion, and installer matrix.
- [ ] List known limitations and unsupported environments prominently.
- [ ] Separate internally planted-fixture results from external maintainer
  outcomes.
- [ ] Preserve prior release summaries so regressions are visible, while removing
  completed roadmap entries from this TODO.

### 8.3 Define the 1.0 release gate

Do not call the suite 1.0-ready until all applicable items hold:

- [ ] The suite inventory, installer, commands, help, and English/Chinese docs are
  mechanically consistent.
- [ ] The evaluation format is reproducible from a clean checkout.
- [ ] Scenario 13 and review Scenarios 12 and 14–17 have repeated A/B results.
- [ ] Core Scenarios 07–10 have deterministic fixtures and published evidence.
- [ ] No stable scenario has a known unaddressed critical regression.
- [ ] Review retains every blocker, does not block on nits alone, integrates
  deterministic gate state, and remains read-only.
- [ ] Trigger validation shows no critical authorization or read-only/mutating
  misroutes in the pinned release configuration.
- [ ] All supported harnesses pass project/global installer tests on the
  supported OS matrix.
- [ ] The packed release artifact passes package smoke tests.
- [ ] At least several external pilot tasks across more than one language and
  harness have maintainer-classified outcomes.
- [ ] Public claims distinguish design guarantees, tested guarantees, manual
  evidence, and unverified areas.
- [ ] The `pinpoint-refactor` decision is recorded, whether the result is create
  or do not create.

### Exit criteria

- [ ] A release candidate can be audited from packaged files to installed
  Skills to scenario evidence.
- [ ] External evidence has produced regression tests or confirmed that the
  existing scenarios cover the observed failures.
- [ ] Version 1.0 claims are bounded by published evidence rather than by age,
  popularity, or checklist completion alone.

---

## Deferred, evidence-triggered work

Do not schedule these by default. Promote an item into a numbered phase only
after a repeatable failure or usage pattern demonstrates its value.

### Machine-readable suite manifest

- [ ] Add `suite-manifest.json` only after a second independently observed
  inventory drift, after the suite grows beyond the current five Skills, or
  when multiple runtime consumers require structured metadata that a small CI
  assertion cannot check reliably.
- [ ] Until then, the section-scoped CI consistency check from Phase 0 is the
  inventory protection of record.

### Repository-local review learnings

- [ ] Consider an opt-in `PINPOINT_LEARNINGS.md` only when the same repository
  produces repeated, verified false positives or project-specific review rules.
- [ ] Never let a read-only review create or modify the file automatically.
- [ ] Require explicit user authorization and repository policy.
- [ ] Separate verified repository facts from model-generated heuristics.

### Persistent finding fingerprints

- [ ] Add stable finding fingerprints only when repeated review of the same pull
  request causes meaningful duplicate work.
- [ ] Define invalidation when lines move, the root cause changes, or evidence
  becomes stale.
- [ ] Do not suppress a blocker merely because a similar earlier finding was
  dismissed.

### Deterministic security/static-analysis seeds

- [ ] Consider Semgrep, CodeQL, or repository-specific analyzers only when review
  volume and measured misses justify them.
- [ ] Keep their diagnostics separate from LLM findings.
- [ ] Measure incremental recall and duplicate rate before making them required.

### Context graphs, model routing, and deeper escalation

- [ ] Consider explicit context graphs only when ordinary call-path and ownership
  tracing repeatedly misses reachable consumers.
- [ ] Consider model-specific routing only after cross-model data shows a stable
  difference.
- [ ] Consider automatic deep-review escalation only after risk triggers are
  measured against precision, recall, latency, and cost.

### Additional generic principles or reviewer axes

- [ ] Do not add another principle to core `pinpoint` or another review axis
  without a scenario that the current wording fails.
- [ ] Prefer deleting redundant wording over accumulating overlapping rules.
- [ ] Keep each Skill focused enough that the model can load and follow it
  reliably.

### Hooks, background services, and hidden automation

- [ ] Do not add hooks, daemons, background mutation, automatic commits,
  automatic pushes, automatic PR publication, merging, deployment, or project
  instruction edits.
- [ ] Reconsider only through a separate explicit product decision with opt-in
  permission and dedicated safety evaluation.

---

## Protected strengths and non-goals

Every phase must preserve these properties unless a separately evaluated product
decision explicitly changes them:

- Evidence outranks confidence.
- Repository contracts, external contracts, user instructions, observations,
  and inferences remain distinguishable.
- Root cause is sought at the first incorrect transition and the smallest owning
  boundary.
- Runtime reachability is proven through callers, dispatch, configuration, and
  consumers rather than inferred from shared types or names.
- Semantic equivalence is not inferred from visual similarity, success messages,
  file existence, or passing proxy tests.
- Stable identity is not replaced with mutable presentation data without proof.
- Performance work starts with a repeatable baseline and ends with comparable
  before/after evidence.
- Review is read-only and reports mutation.
- Static checks are respected without consuming the human/LLM finding budget.
- Commit, push, PR publication, merge, deployment, cleanup, and unrelated file
  changes require separate explicit authorization.
- The installer never overwrites an unowned Skill or command and never removes
  an unowned file.
- Installation does not add hooks or edit project instructions.
- A clear review is a valid result; reports are not padded to appear thorough.
- Unknown or unverified behavior is reported honestly instead of converted into
  a completion claim.
- New Skills are optional outcomes, not roadmap success criteria.

---

## Recommended pull-request sequence

Keep changes reviewable and preserve a clean evidence trail. The preferred
sequence is:

1. **PR 1 — Suite consistency**
   - fix `INSTALL.md`;
   - add the lightweight CI consistency check and CI path coverage;
   - no Skill behavior changes.

2. **PR 2 — Evaluation contract and canary skeleton**
   - add schemas, validation/scoring/report scripts, manual harness contract;
   - convert Scenario 13 structure;
   - use synthetic records only.

3. **PR 3 — Scenario 13 fixture and baseline**
   - freeze fixture/rubric;
   - publish repeated no-Skill/with-Skill results;
   - make any core wording change only in a follow-up commit with before/after
     evidence.

4. **PR 4 — Review fixtures and current baseline**
   - complete Scenario 12;
   - add Scenarios 14–17;
   - record current `pinpoint-review` behavior without changing it.

5. **PR 5 — `pinpoint-review` rule hardening**
   - fix blocker retention, static-gate handling, verdict semantics, and
     read-only checks;
   - calibrate the second-pass finding gate and update the report shape;
   - include repeated before/after results.

6. **PR 6 — Trigger dataset and baseline**
   - add bilingual positive/negative routing cases;
   - record current confusion matrix;
   - do not edit descriptions yet.

7. **PR 7 — Description and routing isolation**
   - narrow overlapping descriptions;
   - update commands, help, and both READMEs together;
   - publish post-change trigger results and behavior regression results.

8. **PR 8 — Installer and package matrix**
   - add global isolation, all-harness/all-Skill assertions, conflict atomicity,
     discovery checks, and tarball smoke tests.

9. **PRs 9+ — Remaining scenario fixtures**
   - follow the Phase 6 order;
   - keep one or a small coherent group of fixtures per PR;
   - publish baseline artifacts with each fixture.

10. **Decision PR — Scenario 11**
    - add only the refactoring fixture and baseline decision;
    - create `pinpoint-refactor` in a later PR only if the decision gate supports
      it.

11. **Release-candidate PR — External evidence and 1.0**
    - update release benchmark, known limitations, installer matrix, and external
      pilot summary;
    - verify every 1.0 gate explicitly.

The roadmap is successful when evidence removes uncertainty and unnecessary work,
not when every speculative feature is implemented.
