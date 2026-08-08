---
name: pinpoint
description: Trace ambiguous or high-risk software defects and performance problems to the owning runtime boundary, implement the smallest complete fix, validate the real mechanism, and run evidence-based adversarial review. Use for bug fixes, measured performance work, issue triage, cross-platform behavior, browser or native integration, accessibility, internationalization, external protocols, sync, persistence, UI geometry, or anything reported as broken or slow where blast radius and proof matter. A request to review a change and fix what it finds also routes here — the fix request makes pinpoint primary and review runs at this skill's own gate. Do not use for read-only audits of an existing change when no fix is requested — that is pinpoint-review.
---

# Pinpoint

Find where correct behavior first becomes incorrect — or acceptable cost first becomes unjustified — fix the boundary that owns that transition, and claim only what the evidence proves.

Repository rules and mandatory external contracts outrank this Skill. Prior fixes are leads, not permanent architecture.

## Keep an Evidence Ledger

Classify important conclusions internally:

- **Repository contract:** current code, tests, contribution rules, or architecture.
- **External contract:** applicable official specification, platform, framework, browser, or provider documentation.
- **Requester direction:** a requirement stated in the current request, issue, or review.
- **Observation:** reproduced behavior from the real environment, artifact, payload, trace, or device.
- **Inference:** an explanation that still needs verification.

Do not present inference as observation. A veto is a claim too: "no reliable predicate exists" is an inference until its failure costs are bounded with evidence. Resolve conflicts by identifying which authority owns the behavior; generic best practice does not override a deliberate repository contract, and repository convention does not override a mandatory external protocol.

Prefer evidence in this order: real reproduction, traced mechanism, representative oracle, repository contract, official external contract, then generic guidance. External convention and prior art are generic guidance: they may justify the minimal internal answer, but they never substitute for tracing the project's own mechanism, and they must not expand the option surface.

## Apply Transferable Reasoning

Preserve lessons from specific bugs by translating them into cross-domain rules:

- **Validate at the real consumer boundary.** Intermediate state and static checks are proxies, not final behavior. An accessibility tree may not prove screen-reader navigation, and a successful API response may not prove persistence. When only a proxy is available, state what it cannot prove.
- **Match evidence granularity to the claim.** Aggregate evidence cannot prove local continuity, order, or identity. An average cannot establish tail behavior, and one bounding region cannot establish every rendered fragment. An unchanged result on an input that cannot exhibit the behavior proves nothing about preservation.
- **Distinguish visible equivalence from semantic equivalence.** Compare identity, order, lifecycle, side effects, and security as well as output. A retried request may duplicate work, while a visually identical UI may change focus or interaction order.
- **Preserve upstream authority.** If a protocol returns a documented valid form or an operating system provides intentional native behavior, normalize only what crosses into application ownership rather than rewriting the authority itself.
- **Prove impact through runtime reachability.** A shared type or common helper shows possible reuse, not actual execution. Establish affected formats, platforms, providers, and modes through callers, dispatch, configuration gates, and concrete consumers. Enumerate channels that bypass the call graph — event buses, dispatchers, registries — by event or channel name, and check each dispatch site's data provenance: live value or stale snapshot.
- **Separate stable identity from transient representation.** A reordered list may change indexes without changing records, and a reconnect may replace a connection without replacing the business session. Preserve continuity with stable identifiers, semantic anchors, or authoritative event reasons.
- **Make cached results express all dependencies.** An API cache may depend on permissions and locale; a geometry cache may depend on dimensions and fonts. A cache with incomplete dependencies is not authoritative state.
- **Relax only the smallest necessary condition.** Accepting another documented OAuth callback form must preserve state validation; accepting another file extension must preserve content and size checks. Define the new equivalence precisely and keep unrelated invariants unchanged.
- **Keep one user-facing field on one producer with one semantics.** Prefer honest absence (an explicit unknown state) over a second producer with different semantics. A fallback chain that leaves a "which value do we show?" fork is a stop signal: re-verify the primary source's properties before adding producers, not a question to delegate to the user.
- **Bound approximations by their failure cost.** When a decision cannot be exact and refusal is not an option — a routing gate, a language guess — choose the cheaper failure direction: degrade to the general path rather than suppress the capability, and bound the heuristic explicitly: name what it stands in for, cap it, document it. When absence is an option, honest absence outranks approximation.

## Trace Ownership Before Designing

Protect the working state first: preserve unrelated user changes, staged work, worktrees, and branch history, and never clean, reset, or rewrite anything without explicit authorization. When the task needs a new branch, create one task-focused branch from the authoritative base identified from actual configuration, following the repository's branch naming and worktree conventions, and keep one coherent task on it.

1. Capture the exact environment, input, settings, expected behavior, and observed behavior relevant to the stated problem.
2. Follow the concrete runtime path from trigger through local state, shared transformations, external or native boundaries, and persistence or re-entry.
3. Identify the concrete consumer of every value under consideration. Do not infer reachability from a shared type, optional method, or broad interface.
4. Before reusing, substituting, or extending an existing value, trace it to its producer and read the producing computation. Never infer a value's properties from a same-named nearby computation or from domain convention. Name the producer (file:line) before proposing alternatives.
5. Inspect the real failing artifact or mechanism: DOM, computed style, event sequence, payload, persisted record, generated file, native log, geometry, or equivalent evidence.
6. Classify ownership: application, framework, browser, operating system, toolkit, source data, provider, network, or environment.
7. Locate the first transition from correct to incorrect, or from acceptable cost to unjustified cost. Distinguish an external layer behaving intentionally from the application consuming that behavior incorrectly.

A simplified fixture is useful only if it preserves the property that causes the failure.

Before editing, state one invariant and explicit non-goals:

> When X occurs under Y, Z must happen, while A and B remain unchanged.

## Fix the Smallest Owned Boundary

Prefer, in order:

1. Correct the existing predicate or transformation that owns the transition.
2. Reuse the established setting, semantic gate, pipeline, adapter, renderer, or platform abstraction.
3. Normalize data as it enters application ownership rather than rewriting authoritative native or external behavior.
4. Let proven runtime topology isolate formats, modes, providers, or platforms instead of adding speculative flags.
5. Add an abstraction only when it creates one source of truth or makes the real mechanism testable.

Reject symptom masking, parallel semantic paths, unrelated cleanup, and architecture replacement justified only by novelty. Minimal means the smallest semantic and risk surface, not the fewest changed lines.

Treat changes to native interaction, DOM order, authentication validation, persistent identity, shared synchronization, global styling, cross-cutting state, and platform workarounds as high risk until their ownership and reachable impact are proven.

## Audit Only Reachable Contracts

Do not load every domain checklist by default. From the traced path, identify which dimensions are reachable and inspect only those:

- **Interaction and accessibility:** semantics, DOM or reading order, focus, keyboard, native selection, touch behavior, and assistive-technology traversal.
- **Language and content:** interface versus content language, Unicode, CJK, RTL, vertical text, punctuation, segmentation, and long translations.
- **Data and persistence:** authority, stable identity, ordering, transactions, idempotency, migration, retries, fallback, reload, and synchronization.
- **External protocols and security:** origin and redirect validation, state or nonce, PKCE, signatures, replay protection, serialization, and request-specific expectations.
- **UI and geometry:** rendered fragments, reflow identity, cache dependencies, clipping, layering, hit targets, resize, zoom, fonts, and writing direction.
- **Platform and toolchain:** existing platform workarounds, actual native mechanism, and every touched compiler or runtime.

If a dimension is not reachable, exclude it rather than inventing hypothetical support. If it is reachable but cannot be exercised, report the gap.

## Validate the Mechanism, Not the Patch Shape

Choose the lowest reliable oracle that observes the original failure — for a pure decision function, that is a boundary-value unit test, not an end-to-end flow. Preserve the real input structure, event order, classes, values, viewport, persistence state, or platform behavior that made the issue possible.

When a stable, representative oracle exists, add a failing regression test before the fix. Do not force test-first when the real mechanism requires visual judgment, hardware, a native service, or another unstable oracle.

For optimization work, capture a baseline measurement at the chosen oracle before changing code and compare against that baseline under the same conditions. A speedup claimed without a before/after measurement at the same oracle is an inference, not an observation; state what the measurement cannot prove, such as variance, a single input, or a single environment.

Validate:

- the corrected behavior or measured improvement;
- adjacent behavior named in the invariant;
- meaningful boundaries and failure fallback;
- persistence, reload, or re-entry when reachable;
- the actual touched platform or toolchain.

Run the repository-prescribed formatter, linter, type checker, build, and applicable tests for the touched scope.

Tests prove conformance to their model, not that the model matches the product. Do not claim all platforms, formats, languages, accessibility services, or zero impact from local automation.

Report evidence separately:

- **Automated:** exact command and outcome.
- **Artifact or manual:** exact scenario, environment, and observation.
- **Unverified:** reachable behavior not exercised.
- **Unrelated environment:** failures shown not to originate from the change.

## Run an Adversarial Review

After the cohesive change is ready, hand it to an independent, read-only reviewer. Assemble the review packet: the stated intent (issue, request, or change description), repository rules, the authoritative-base diff, validation evidence — reproduction evidence when the change fixes a defect — and the intended-behavior claims — never the intended verdict or a defense of the change.

When the `pinpoint-review` Skill is available, load and follow it with the review packet. Otherwise run the same challenge inline: prefer one independent, read-only reviewer when the harness provides subagents; prohibit edits explicitly and compare repository state before and after the review if read-only cannot be guaranteed.

Ask the reviewer to find:

- a mismatch between the diff and the stated intent — each gap quoted against the intent source, or an intent that itself looks wrong;
- a wrong ownership or root-cause assumption;
- a wider runtime blast radius than claimed;
- divergence from established architecture or platform handling;
- reachable accessibility, language, platform, data, security, or persistence regressions;
- tests that imitate the implementation instead of the claimed mechanism;
- unrelated changes or unsupported claims;
- scope creep: behavior the request never asked for;
- a scoped-out requirement whose rejection rests on an unverified feasibility claim — vetoes carry the same evidence burden as claims.

Require the review to close with severity counts (blocker, should-fix, nit) and a verdict: BLOCK, FIX-THEN-COMMIT, or CLEAR.

Verify every finding independently. Fix confirmed issues and reject false positives with evidence. A reviewer is a source of hypotheses, not proof of correctness. Resolve open questions against the stated intent — re-verify or ask the requester; never promote an open question to a finding without evidence.

If an independent review is unavailable, perform the same challenge yourself and disclose that it was self-review.

## Hand Off Deliberately

Stop after implementation, validation, and review unless delivery was requested. Use `pinpoint-commit` for staging or commits and `pinpoint-pr` for PR preparation or publication. Completion does not authorize commit, push, PR, merge, tag, deployment, or cleanup.

## Final Gate

A completion claim made without evidence in this session's ledger is a misreport, whatever the intent. The table names the most-overstated claims; the questions below remain the operative gate.

| Claim | Requires | Not sufficient |
| --- | --- | --- |
| Root cause found | Traced first incorrect transition at an owned boundary | A plausible explanation that matches the symptom |
| Fixed | The original failure now passes at the lowest reliable oracle | The code changed; a proxy or simplified fixture passes |
| Optimized | Before/after measurement at the same oracle under the same conditions | A complexity argument, or measurements taken on different inputs or environments |
| Adjacent behavior preserved | Each invariant-named behavior exercised with inputs capable of showing the change | An unchanged result on inputs that cannot exhibit the behavior |
| Works on a platform, format, or language | Evidence from that target | Evidence from another target |
| Accessible | Real assistive-technology traversal — otherwise report the gap as unverified | Static ARIA or accessibility-tree checks |
| No wider impact | Reachability traced through callers, dispatch, configuration gates, and concrete consumers | A shared type or common helper without a traced consumer |
| Complete | Reachable behavior exercised, or each gap reported as unverified | Silence about reachable behavior not exercised |

Before claiming completion, answer:

1. Where does correct behavior first become incorrect — or acceptable cost first become unjustified — and who owns that boundary?
2. Which repository contract, external contract, requester direction, and observation support the fix?
3. Does the oracle preserve the real failure mechanism?
4. Which adjacent contracts are actually reachable?
5. What is the smallest invariant now proven?
6. What remains unverified?
