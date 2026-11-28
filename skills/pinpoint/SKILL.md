---
name: pinpoint
description: Trace ambiguous or high-risk software defects and performance problems to the owning runtime boundary, implement the smallest complete fix, validate the real mechanism, and run evidence-based adversarial review. Use when the user asks to debug, diagnose, fix a bug, crash, regression, freeze, memory leak, wrong output, slow performance, cross-platform issue, accessibility, i18n, OAuth/protocol, sync, persistence, or UI geometry defect, or asks to review a change and fix what it finds (mutation requested makes pinpoint primary, with review running at its own gate). Also triggers on Chinese defect-fix requests such as 定位并修复, 修 bug, 排查性能, or review 并修复. Do not use for read-only audits when no fix is requested (use pinpoint-review), pure behavior-preserving refactoring with no stated defect, plain new-feature work, or questions about Pinpoint itself (use pinpoint-help).
license: MIT
metadata:
  author: ChuwuYo
  version: "0.6.1"
  suite: pinpoint
---

# Pinpoint

Find where correct behavior first becomes incorrect (or acceptable cost first becomes unjustified), fix the boundary that owns that transition, and claim only what fresh evidence proves.

Repository rules and mandatory external contracts outrank this Skill. Prior fixes are leads, not permanent architecture.

> **Iron Law:** Never edit code before tracing the owning boundary and stating one testable invariant. Never claim completion without fresh post-edit evidence at the lowest reliable oracle.

## Axioms

1. **Ownership:** Fix only at the boundary where behavior first diverges—trace the full lifecycle (entry, shared state, teardown/inverse, re-entry) and version history; never mask symptoms downstream or rewrite upstream authority.
2. **Entropy reduction:** Subtract or unify before adding—prefer fixing an existing predicate, collapsing split state, or reusing one producer over layering speculative guards. Every changed line must trace to the invariant; clean up only orphans your own edit created. Comments document only non-obvious invariants, constraints, or *why*—never narrate *what* the code does or what this edit changed.
3. **Fresh evidence:** Push every critical claim (root cause, safety, speedup, veto) down the proof ladder to fresh, post-edit observation; re-read authoritative state across suspension or concurrency boundaries; treat inconclusive checks and unsearched scope as `Unverified`.
4. **Explicit scope and authority:** Audit only contracts reachable from the traced path; keep investigation, independent review, and git delivery strictly separated—completion never authorizes commit, push, PR, merge, deploy, or cleanup.

## 1. Keep an Evidence Ledger

Classify every key conclusion internally and never present inference as observation:

- **Repository contract:** current code, tests, contribution rules, or architecture.
- **External contract:** applicable official specification, platform, framework, or provider docs (verify current official docs or installed dependency source rather than stale training memory).
- **Requester direction:** a requirement stated in the current request, issue, or review.
- **Observation:** reproduced behavior from the real environment, artifact, payload, trace, or device.
- **Inference:** an explanation that still needs verification.

**Precedence order:** real reproduction > traced mechanism > representative oracle > repository contract > official external contract > generic guidance.

- **Proof ladder:** push each safety- or correctness-critical claim as far down this ladder as is cheap, and state where it stopped: (1) assertion alone (worthless) -> (2) exact `file:line` or commit record -> (3) step-by-step reachability/infeasibility trace -> (4) executed test or probe against real code -> (5) reproduction in the real running environment.
- **Veto burden:** "no reliable predicate exists" is an inference until its failure costs are bounded with evidence. Resolve conflicts by identifying which authority owns the behavior.

## 2. Trace Ownership Before Designing

Protect working state first: preserve unrelated user changes, staged work, worktrees, and branch history. Never clean, reset, or rewrite anything without explicit authorization.

1. Capture the exact environment, input, settings, expected behavior, and observed behavior.
2. Trace the full runtime path from trigger through local state, transforms, external/native boundaries, persistence, and teardown, inverse, or re-entry paths (check what shared, stacked, or persistent state reused consumers also mutate).
3. Prove runtime reachability through callers, dispatch, gates, event/registry channels, and implicit boundaries past symbol search (wire formats, schemas, dependencies). Across suspension or concurrency boundaries, verify freshness and read authoritative state after resumption.
4. Trace any value before reusing it to its producer (`file:line`), and check version history (`git log`/commits) before altering an existing guard, workaround, or regression-prone path.
5. Inspect the real failing artifact or mechanism (summarize large traces before drilling down; amplify and revert cumulative/intermittent defects). Scale tracing to codebase size without equating a local search with repo-wide reachability—mark unsearched scope `Unverified`.
6. Classify ownership (app, framework, OS, toolkit, data, provider, network, or environment) and locate the first incorrect or unjustified transition.

Before editing, state one invariant and explicit non-goals:

> When X occurs under Y, Z must happen, while A and B remain unchanged.

For detailed principles (consumer-boundary validation, symbol-search blind spots, signal amplification, scale-adaptive tracing, Deletion Test, single-producer fields, bounded heuristics) and worked examples, read [references/reasoning-and-gotchas.md](references/reasoning-and-gotchas.md).

## 3. Fix the Smallest Owned Boundary

Prefer changes in this order:

1. Subtract dead paths, collapse split state, or correct the owning predicate—when replacing an internal implementation, migrate all real callers and delete the superseded path (keep compatibility shims only for proven external contracts).
2. Reuse the established setting, semantic gate, pipeline, adapter, renderer, or platform abstraction.
3. Normalize data as it enters application ownership rather than rewriting authoritative native or external behavior.
4. Let proven runtime topology isolate variants instead of adding speculative flags.
5. Add an abstraction only when it passes the Deletion Test (deleting it would spread complexity rather than remove it) and creates one source of truth or testability.

Minimal means the smallest semantic and risk surface, not the fewest changed lines. Remove imports, variables, or branches your edit made unused while leaving pre-existing dead code untouched (mention it only); never weaken safe code merely to silence a false-positive static alert.

- **Single-producer rule:** keep one user-facing field on one producer with one semantics; prefer honest absence over a second conflicting fallback.
- **High-risk boundaries:** treat native interaction, DOM order, auth validation, persistent identity, shared sync, global styling, cross-cutting state, and platform workarounds as high risk until ownership and reachable impact are proven.
- **Attack the premise (escalation):** if two or more fixes sharing one premise fail the same gate—or three targeted attempts fail—stop patching, write down and falsify the shared premise directly, and revert speculative code motivated by refuted hypotheses before editing again.

## 4. Audit Only Reachable Contracts

Do not load every checklist by default. Identify only the domains reachable from the traced path:

- Interaction and accessibility | Language and content | Data and persistence
- External protocols and security | UI and geometry | Platform and toolchain

If any apply, read only the matching section(s) of [references/domain-checklists.md](references/domain-checklists.md). Exclude unreachable domains and record unexercised reachable checks under `Unverified`.

## 5. Validate the Mechanism, Not the Patch Shape

Choose the lowest reliable oracle that observes the original failure (preserving real input structure, event order, viewport, persistence, or platform behavior). An inconclusive check or wrong-surface pass is not a pass; record it under `Unverified`.

- **Test-first when stable:** add a failing regression test before the fix when a stable oracle exists. When cheap, encode recurring failure modes as automated tests, types, or lint/CI checks rather than prose.
- **Optimization baseline:** capture matched before/after measurements at the same oracle and conditions; disclose variance and input/environment limits.

Validate: the corrected behavior or improvement, invariant-named adjacent behavior (with discriminating inputs), boundary/failure fallbacks, persistence/reload/teardown/interleaved transitions when reachable, and repository-prescribed checks for the touched scope. Report evidence separately under **Automated**, **Artifact or manual**, **Unverified**, and **Unrelated environment**.

## 6. Run an Adversarial Review and Hand Off

After validation, inspect your own `git diff` to strip debug logs, narration comments, or accidental edits, then hand a neutral review packet (unedited intent, repository rules, authoritative-base diff, validation evidence, and claims—never intended verdict or defense) to an independent read-only reviewer:

- Load and follow `pinpoint-review` when available; otherwise run the same read-only 7-axis challenge inline (prefer a fresh subagent, verify repo state unchanged before/after, and disclose self-review).
- Verify every finding independently, fixing confirmed issues and rejecting false positives with evidence.

**Deliberate handoff:** stop after implementation, validation, and review unless delivery was explicitly requested. Use `pinpoint-deliver` for commits, pushes, or PRs.

## Final Gate

Never cite pre-edit or pre-compaction outputs/line numbers from memory, and never use speculative phrasing (`"should work"`, `"probably fixed"`) without a fresh post-edit run.

| Claim | Requires | Not sufficient |
| --- | --- | --- |
| Root cause found | Traced first incorrect transition at an owned boundary | A plausible explanation matching the symptom |
| Fixed | Original failure passes at the lowest reliable oracle | Code changed; proxy or simplified fixture passes |
| Optimized | Before/after measurement at the same oracle and conditions | Complexity argument, or mismatched inputs/environments |
| Adjacent behavior preserved | Invariant-named behavior exercised with discriminating inputs | Unchanged result on inputs that cannot exhibit the behavior |
| Works on platform/format/language | Evidence from that specific target | Evidence from another target |
| Accessible | Real assistive-technology traversal (else report unverified) | Static ARIA or accessibility-tree checks |
| No wider impact | Reachability traced through callers, dispatch, gates, consumers (scoped to searched boundaries) | Shared type/helper, or local search claimed repo-wide |
| Complete | Reachable behavior exercised, or each gap reported unverified | Silence about reachable behavior or unsearched scope |
