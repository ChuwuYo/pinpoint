---
name: pinpoint
description: Trace ambiguous or high-risk software defects and performance problems to the owning runtime boundary, implement the smallest complete fix, validate the real mechanism, and run evidence-based adversarial review. Use when the user asks to debug, diagnose, fix a bug, crash, regression, freeze, memory leak, wrong output, slow performance, cross-platform issue, accessibility, i18n, OAuth/protocol, sync, persistence, or UI geometry defect, or asks to review a change and fix what it finds (mutation requested makes pinpoint primary, with review running at its own gate). Also triggers on Chinese defect-fix requests such as 定位并修复, 修 bug, 排查性能, or review 并修复. Do not use for read-only audits when no fix is requested (use pinpoint-review), pure behavior-preserving refactoring with no stated defect, plain new-feature work, or questions about Pinpoint itself (use pinpoint-help).
license: MIT
metadata:
  author: ChuwuYo
  version: "0.5.1"
  suite: pinpoint
---

# Pinpoint

Find where correct behavior first becomes incorrect (or where acceptable cost first becomes unjustified), fix the boundary that owns that transition, and claim only what the evidence proves.

Repository rules and mandatory external contracts outrank this Skill. Prior fixes are leads, not permanent architecture.

> **Iron Law:** Never edit code before tracing the owning boundary and stating one testable invariant. Never claim a fix or optimization is complete without observed evidence at the lowest reliable oracle.

## 1. Keep an Evidence Ledger

Classify every key conclusion internally and never present inference as observation:

- **Repository contract:** current code, tests, contribution rules, or architecture.
- **External contract:** applicable official specification, platform, framework, browser, or provider documentation.
- **Requester direction:** a requirement stated in the current request, issue, or review.
- **Observation:** reproduced behavior from the real environment, artifact, payload, trace, or device.
- **Inference:** an explanation that still needs verification.

**Precedence order:** real reproduction > traced mechanism > representative oracle > repository contract > official external contract > generic guidance.

- **Proof ladder:** push each safety- or correctness-critical claim as far down this ladder as is cheap, and state where it stopped: (1) assertion alone (worthless) -> (2) exact `file:line` or commit record -> (3) step-by-step reachability/infeasibility trace -> (4) executed test or probe against real code -> (5) reproduction in the real running environment.
- A veto is a claim too: "no reliable predicate exists" is an inference until its failure costs are bounded with evidence.
- Resolve conflicts by identifying which authority owns the behavior. Generic best practice never overrides a deliberate repository contract, and repository convention never overrides a mandatory external protocol.
- External convention and prior art never substitute for tracing the project's own mechanism, and must not expand the option surface.

## 2. Trace Ownership Before Designing

Protect working state first: preserve unrelated user changes, staged work, worktrees, and branch history. Never clean, reset, or rewrite anything without explicit authorization. If the task requires a new branch, create one task-focused branch from the authoritative base identified from actual configuration.

1. Capture the exact environment, input, settings, expected behavior, and observed behavior.
2. Follow the concrete runtime path from trigger through local state, shared transforms, external or native boundaries, persistence, and teardown, inverse, or re-entry paths (check what shared, stacked, or persistent state any reused consumer also mutates).
3. Prove runtime reachability through callers, dispatch, configuration gates, and concrete consumers. Do not infer reachability from a shared type, optional method, or broad interface. Enumerate channels that bypass the call graph (event buses, dispatchers, registries) by event or channel name and check whether each dispatch site passes a live value or a stale snapshot. Across any suspension, I/O, lock, callback, or concurrency boundary, verify whether shared or environmental state can change before resumption and read fresh authoritative state rather than a pre-yield snapshot. Look where symbol search stops: wire or serialization formats, schemas, cross-language boundaries, dependency source/patches, and downstream consumers multiple hops away.
4. Before reusing, substituting, or extending any value, trace it to its producer (`file:line`) and read the producing computation. Never infer properties from a same-named nearby helper or domain convention. Before altering an existing guard, workaround, or regression-prone path, check version history (`git log`/commits) to separate its original intent from guesswork.
5. Inspect the real failing artifact or mechanism (DOM, computed style, event sequence, payload, persisted record, generated file, native log, or geometry). A simplified fixture is valid only if it preserves the property that causes the failure.
6. Classify ownership: application, framework, browser, operating system, toolkit, source data, provider, network, or environment.
7. Locate the first transition from correct to incorrect (or acceptable cost to unjustified cost). Distinguish intentional external behavior from the application consuming it incorrectly.

Before editing, state one invariant and explicit non-goals:

> When X occurs under Y, Z must happen, while A and B remain unchanged.

For detailed transferable reasoning principles (consumer-boundary validation, semantic vs. visible equivalence, cache dependencies, single-producer fields, bounded heuristics) and worked Good vs. Bad examples, read [references/reasoning-and-gotchas.md](references/reasoning-and-gotchas.md).

## 3. Fix the Smallest Owned Boundary

Prefer changes in this order:

1. Correct the existing predicate or transformation that owns the transition.
2. Reuse the established setting, semantic gate, pipeline, adapter, renderer, or platform abstraction.
3. Normalize data as it enters application ownership rather than rewriting authoritative native or external behavior.
4. Let proven runtime topology isolate formats, modes, providers, or platforms instead of adding speculative flags.
5. Add an abstraction only when it creates one source of truth or makes the real mechanism testable.

Reject symptom masking, parallel semantic paths, unrelated cleanup, and architecture replacement justified only by novelty. Minimal means the smallest semantic and risk surface, not the fewest changed lines.

- **Single-producer rule:** keep one user-facing field on one producer with one semantics. Prefer honest absence (an explicit unknown state) over a second fallback producer with conflicting semantics.
- **High-risk boundaries:** treat changes to native interaction, DOM order, auth validation, persistent identity, shared sync, global styling, cross-cutting state, and platform workarounds as high risk until ownership and reachable impact are proven.
- **Attack the premise (escalation):** if two or more fixes sharing one premise fail the same gate—or three targeted attempts fail—stop patching. Write down the shared premise, test or falsify it directly, and revert any speculative ("might help") code motivated by refuted hypotheses before editing again.

## 4. Audit Only Reachable Contracts

Do not load every domain checklist by default. From the traced path, identify which of the six domains are actually reachable:

- Interaction and accessibility
- Language and content
- Data and persistence
- External protocols and security
- UI and geometry
- Platform and toolchain

If any domain above is reachable, read only the matching section(s) of [references/domain-checklists.md](references/domain-checklists.md). Exclude unreachable domains instead of inventing hypothetical support. If a reachable domain cannot be exercised in this environment, record the gap as unverified.

## 5. Validate the Mechanism, Not the Patch Shape

Choose the lowest reliable oracle that observes the original failure (for a pure decision function, a boundary-value unit test; for a CLI export or rendered output, the real downstream consumer). Preserve the real input structure, event order, viewport, persistence state, or platform behavior. An inconclusive check or wrong-surface pass is not a pass; record it under Unverified.

- **Test-first when stable:** add a failing regression test before the fix whenever a stable, representative oracle exists. Do not force test-first when the real mechanism requires visual judgment, hardware, or an unstable native service.
- **Optimization baseline:** capture a baseline measurement at the chosen oracle before changing code and compare before/after under identical conditions. A speedup without a matched before/after measurement is an inference, not an observation. Disclose variance, single-input, or single-environment limits.

Validate:

- the corrected behavior or measured improvement;
- adjacent behavior named in the invariant (using inputs capable of exhibiting a regression);
- meaningful boundaries and failure fallback;
- persistence, reload, teardown/inverse paths, or interleaved state transitions when reachable;
- the repository-prescribed formatter, linter, type checker, build, and applicable tests for the touched scope.

Report evidence separately under four labels:

- **Automated:** exact command and outcome.
- **Artifact or manual:** exact scenario, environment, and observation.
- **Unverified:** reachable behavior not exercised.
- **Unrelated environment:** failures shown not to originate from the change.

## 6. Run an Adversarial Review and Hand Off

After the cohesive change is validated, hand it to an independent, read-only reviewer. Assemble a neutral review packet: stated intent (unedited), repository rules, authoritative-base diff, validation/reproduction evidence, and intended-behavior claims. Never include the intended verdict or a defense of the change.

- When `pinpoint-review` is available, load and follow it with the review packet.
- Otherwise run the same challenge inline (prefer a fresh read-only subagent; prohibit edits explicitly and compare repo state before and after). Check: intent mismatch or scope creep, wrong ownership/root cause, wider blast radius, architecture/platform divergence, reachable regressions, tests imitating implementation, unverified vetoes, and unsupported claims. Close with severity counts (`blocker`, `should-fix`, `nit`) and a verdict (`BLOCK`, `FIX-THEN-COMMIT`, or `CLEAR`). Disclose if only self-review was available.
- Verify every finding independently. Fix confirmed issues and reject false positives with evidence.

**Deliberate handoff:** stop after implementation, validation, and review unless delivery was explicitly requested. Use `pinpoint-commit` for staging or commits and `pinpoint-pr` for PR preparation or publication. Completion never authorizes commit, push, PR, merge, tag, deployment, or cleanup.

## Gotchas

| If you catch yourself thinking... | Do this instead |
| --- | --- |
| "The symptom is obvious, I can patch it right now." | Trace the first incorrect transition and state the invariant first. |
| "This helper has the same name, so it has the same semantics." | Read the producer at `file:line` before reusing or substituting it. |
| "A shared interface uses this, so all formats are affected." | Prove impact through callers, dispatch gates, event buses, and concrete consumers. |
| "The primary value is missing, let me add a fallback chain." | Verify the primary producer first; prefer honest unknown over dual semantics. |
| "Unit tests pass, so it works across all platforms / screen readers." | Report only what the oracle proved and list unexercised targets as unverified. |
| "This is obviously faster in Big-O, no benchmark needed." | Capture before/after measurements at the same oracle under the same conditions. |
| "The primary path works now, so the fix is complete." | Trace teardown, inverse, cancel, and re-entry paths too; check what shared or stacked state reused consumers mutate. |
| "I checked the state before the operation started." | Across I/O, callbacks, locks, or async suspension, re-read fresh authoritative state after resumption and test interleaved transitions. |
| "Let me keep this extra guard too, just in case." | Speculative ("might help") guards are unverified hypotheses; revert code motivated by refuted hypotheses and ship only what evidence justifies. |

## Final Gate

A completion claim without evidence in this session's ledger is a misreport.

| Claim | Requires | Not sufficient |
| --- | --- | --- |
| Root cause found | Traced first incorrect transition at an owned boundary | A plausible explanation matching the symptom |
| Fixed | Original failure passes at the lowest reliable oracle | Code changed; proxy or simplified fixture passes |
| Optimized | Before/after measurement at the same oracle and conditions | Complexity argument, or mismatched inputs/environments |
| Adjacent behavior preserved | Invariant-named behavior exercised with discriminating inputs | Unchanged result on inputs that cannot exhibit the behavior |
| Works on platform/format/language | Evidence from that specific target | Evidence from another target |
| Accessible | Real assistive-technology traversal (else report unverified) | Static ARIA or accessibility-tree checks |
| No wider impact | Reachability traced through callers, dispatch, gates, consumers | Shared type or helper without traced consumers |
| Complete | Reachable behavior exercised, or each gap reported unverified | Silence about reachable behavior not exercised |

Before claiming completion, verify all six questions:

1. Where does correct behavior first become incorrect (or cost first become unjustified), and who owns that boundary?
2. Which repository contract, external contract, requester direction, and observation support the fix?
3. Does the oracle preserve the real failure mechanism?
4. Which adjacent contracts are actually reachable?
5. What is the smallest invariant now proven?
6. What remains unverified?
