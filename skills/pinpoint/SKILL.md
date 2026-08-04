---
name: pinpoint
description: Investigate, implement, validate, and review narrowly scoped software fixes using repository evidence and authoritative documentation. Use for bug fixes, issue triage, architecture review, regression prevention, cross-platform behavior, browser or native integration, accessibility, internationalization, external protocols, sync and persistence, UI geometry, or any request requiring a complete root-cause-to-review workflow with minimal blast radius.
---

# Pinpoint

Produce the smallest complete change that fixes the reported behavior without weakening adjacent contracts. Let the repository, concrete runtime path, real artifact, official external contract, and current reviewer guidance determine the solution.

Treat prior accepted changes as evidence of useful patterns, not permanent rules. Re-check every pattern against the current repository and issue.

## Separate Evidence From Inference

Label conclusions internally as one of:

1. **Repository contract:** stated by current code, tests, contribution rules, or architecture documentation.
2. **External contract:** stated by an applicable official specification, platform, framework, browser, provider, or accessibility document.
3. **Reviewer direction:** explicitly stated in the current issue or review.
4. **Observation:** reproduced from the real application, device, data, or artifact.
5. **Inference:** a proposed explanation or pattern that still needs verification.

Prefer evidence in this order:

1. The reporter's real environment, input, settings, and reproduction artifact.
2. A traced runtime mechanism that explains the failure.
3. Tests or probes that observe that mechanism at the correct layer.
4. Existing product semantics and repository contracts.
5. Relevant official external documentation.
6. Generic best practices and simplified fixtures.

Do not use a generic guideline to override a deliberate project contract. Do not use project convention to contradict a mandatory external protocol. Resolve which authority owns the behavior first.

## Start Safely

1. Read the nearest `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, design documents, package instructions, PR templates, and relevant subsystem documentation.
2. Read the complete issue, linked issues, review discussion, screenshots, logs, sample files, and reproduction steps. Fetch current remote content when facts may have changed.
3. Inspect repository history for the symptom, platform, subsystem, workaround, and affected API. Treat history as a lead, then verify it against current code.
4. Run serialized checks for status, staged and unstaged diffs, untracked files, current branch, upstream tracking, remotes, worktrees, submodules, and nested repositories.
5. Identify the authoritative base and contributor remote from actual configuration. Do not assume remote names, default branches, or fork topology.
6. Fetch before branching. Create one issue-focused branch from the authoritative base, using the repository's required naming and worktree tooling.
7. Preserve unrelated user changes, worktrees, branches, generated files, and staged state. Never clean, reset, rewrite, commit, push, deploy, or create a PR without the corresponding authorization.

If a reviewer or automation updates the remote branch, fetch and compare it before editing. Never push stale local history over a newer remote head.

## Map the Actual Runtime

Trace the concrete path relevant to the issue instead of reasoning from filenames or shared types:

1. User interaction, rendered UI, command, API, or background trigger.
2. Local component, controller, state, model, or event layer.
3. Shared service, transformation, validation, or serialization pipeline.
4. Renderer, browser frame, native bridge, worker, backend, database, or external provider.
5. Persistence, synchronization, retry, fallback, and re-entry behavior.

Find the concrete consumer of every value you plan to change. Do not infer reachability from a shared interface, generic helper, optional method, or broad type. Runtime topology may already isolate platforms, formats, providers, or feature modes without another flag.

Search for existing settings, abstractions, feature gates, pipelines, platform workarounds, and historical fixes before introducing new state or dependencies.

## Establish the Defect

1. Record version, platform, runtime, input or document type, locale and direction, input method, relevant settings, expected behavior, and actual behavior.
2. Reproduce before editing whenever feasible. Preserve the failing artifact or a faithful minimized case.
3. Classify ownership: application, framework, browser, operating system, toolkit, publication or input data, provider, network, or environment.
4. Distinguish intentional native or external behavior from an application defect in how that behavior is consumed.
5. Inspect the real artifact: DOM, computed style, event sequence, payload, protocol callback, persisted record, generated file, native log, or rendered geometry.
6. Trace the first point at which correct state becomes incorrect. Fix that owned boundary instead of compensating downstream.
7. State one invariant and explicit non-goals before coding: "When X occurs under Y, Z must happen, while A and B remain unchanged."

A clean mock or simplified fixture does not prove the real failure model. Ensure the fixture preserves the property that causes the bug.

## Design the Smallest Owned Fix

Use this order of preference:

1. Correct the predicate or transformation at the existing ownership boundary.
2. Reuse an existing setting, semantic gate, pipeline, renderer boundary, provider adapter, or platform abstraction.
3. Preserve browser, OS, assistive-technology, source-data, and provider semantics unless the feature explicitly overrides them.
4. Normalize or copy data as it crosses into application ownership instead of mutating live native state when native behavior should remain authoritative.
5. Let runtime topology provide isolation; do not add markers or guards that merely restate an existing invariant.
6. Add a platform-specific path only after proving that the underlying mechanism differs.
7. Replay an established pipeline instead of duplicating its current operation list.
8. Extract an abstraction only when it creates one source of truth, makes real behavior testable, or removes meaningful duplication.
9. Reject symptom-hiding changes, speculative configuration, parallel semantic paths, and unrelated cleanup.

Treat DOM moves, portals, global CSS, broad selectors, `!important`, custom language segmentation, rewritten native interaction, auth bypasses, and cross-cutting state as high risk. Minimal means the minimum semantic and risk surface, not the fewest changed lines.

## Preserve Reachable Contracts

Audit only dimensions that the traced path can reach, but do not omit them by habit.

### Interaction and accessibility

- Preserve semantic DOM order, labels, roles, focus order, focus recovery, keyboard behavior, native selection, touch handles, and assistive-technology traversal.
- Treat accessibility as an architectural constraint, not a final lint step. A visually correct portal or DOM relocation can still break reading order.
- Distinguish static ARIA or accessibility-tree checks from real screen-reader behavior. State when VoiceOver, TalkBack, Narrator, or another target service was not exercised.
- Preserve native interaction behavior unless the issue explicitly changes it.

### Language and content

- Separate interface locale from user-content language and direction.
- Preserve Unicode, combining marks, CJK, RTL, vertical text, long translations, punctuation, and locale-sensitive behavior when reachable.
- Prefer logical layout properties and content-derived direction over hardcoded left/right assumptions.
- Do not redefine browser or platform word boundaries when the issue only requires trimming application-owned data.

### Data, identity, and persistence

- Preserve source authority, stable identifiers, hashes, ordering, sync clocks, transactions, idempotency, migrations, retries, and fallback behavior.
- Verify immediate behavior, persistence, reload or re-entry, and synchronization independently.
- Keep destructive normalization behind the existing user opt-in or semantic permission that authorizes it.

### External protocols and security

- Consult current official protocol and provider documentation before changing callback, redirect, authentication, or serialization behavior.
- Accept only the smallest documented equivalence needed for interoperability.
- Preserve scheme, authority, port, path, origin, redirect-target, nonce, OAuth `state`, PKCE, signature, and replay validation unless the official contract requires otherwise.
- Carry the expected target per request across boundaries instead of hardcoding provider-specific shapes in a shared bridge.
- Test cross-language and cross-process serialization at both ends of the boundary.

### UI, layout, and geometry

- Measure actual rendered fragments when visual lines or hit regions matter; a single bounding box may include gaps or unrelated content.
- Group fragments by visual continuity and keep multiple documents, frames, panes, or surfaces in logical reading order.
- Use coarse estimates only for coarse decisions such as direction. Use stable identity, authoritative events, or explicit reasons for transitions and state continuity.
- Distinguish user navigation from anchor-preserving reflow, resize, zoom, typography changes, and restoration.
- Invalidate geometry caches for every dependency that can change the result, including width, height, fonts, content, zoom, layout mode, and writing direction.
- Clamp padding and expansion per edge, cap outlier image or element geometry, preserve layering, and verify clipping and hit targets.

### Platform and toolchain

- Search for existing Android, iOS, WebKit, Blink, desktop toolkit, filesystem, and provider workarounds before changing shared behavior.
- Measure the reported platform mechanism instead of assuming a familiar cause.
- Compile or test every touched language and target toolchain. Passing TypeScript tests does not validate Kotlin, Swift, Rust, C++, native manifests, or provider configuration.
- Keep platform divergence narrow and evidence-based; retain shared behavior elsewhere.

## Validate According to Risk

1. Add an initial failing regression test first when a stable, representative oracle exists.
2. Complete the cohesive implementation before repeatedly running broad suites.
3. Test at the lowest layer that can observe the original failure:
   - pure unit tests for deterministic transformations;
   - realistic DOM or browser tests for layout, selection, focus, and browser APIs;
   - real documents, payloads, databases, or files for parser and renderer behavior;
   - integration tests for bridges, providers, persistence, and process boundaries;
   - real devices, native hosts, assistive technology, or hardware for mechanisms automation cannot represent.
4. Match the real failure shape, including classes, inline structure, event ordering, viewport, content, protocol values, and persistence state.
5. Test the corrected behavior, important preserved behavior, boundary conditions, reload or re-entry, and failure fallback.
6. Run repository-prescribed formatting, linting, type checking, compilation, targeted tests, and broader applicable suites after the patch is cohesive.
7. Separate product failures from harness, dependency, credential, network, or environment failures.

Report results in four distinct categories:

- **Automated:** exact commands and outcomes.
- **Artifact or manual:** exact scenario, environment, and observed result.
- **Unverified:** reachable device, provider, format, language, accessibility service, or runtime not exercised.
- **Unrelated environment:** failures shown not to originate from the change.

Do not infer "all platforms," "all formats," "fully accessible," or "zero impact" from code inspection or passing tests alone.

## Review the Complete Change

1. Compare the complete branch against the authoritative base, including staged, unstaged, untracked, generated, nested-repository, submodule, lockfile, and configuration changes.
2. Trace all callers and consumers of shared code. Verify that the intended scope matches actual reachability.
3. Challenge every new dependency, marker, global rule, platform branch, abstraction, compatibility exception, and broad claim.
4. Remove low-signal tests that only restate implementation details; retain tests that reproduce the real mechanism or protect a valuable contract.
5. Check that comments explain non-obvious constraints rather than narrating code.
6. Confirm that no unrelated behavior, deployment, generated metadata, or user work entered the diff.
7. Treat passing tests as evidence that code follows the test model, not proof that the model matches the product.

After cohesive validation, prefer an independent adversarial review with at least one separate-context subagent when subagent capability is available. Use a read-only reviewer profile when the harness provides one. Otherwise explicitly prohibit edits and compare repository state before and after the review. Give the reviewer the raw issue, authoritative-base diff, repository rules, and reproduction evidence without the intended verdict, suspected findings, or proposed defense. Ask it to search for:

- incorrect root-cause or ownership assumptions;
- behavioral regressions and a wider runtime blast radius than claimed;
- divergence from repository architecture and established platform handling;
- reachable accessibility, language, platform, data, security, and persistence failures;
- tests that model the implementation instead of the reported mechanism;
- unrelated changes and claims unsupported by the evidence.

Independently verify every finding before changing code. Fix confirmed findings, reject false positives with concrete evidence, and rerun affected validation after any revision. Do not use the subagent as a rubber stamp or report its existence as proof of correctness.

If an independent review cannot be isolated without risking repository mutation, or subagents are unavailable, perform the same adversarial checklist yourself and disclose that no independent subagent review was possible. Never describe a self-review as independent.

## Hand Off Deliberately

Stop after the cohesive fix is implemented, validated, and reviewed unless the user requests delivery work.

- Use `pinpoint-commit` for commit-message generation, exact staging, or committing.
- Use `pinpoint-pr` for PR prose, fork or remote publication, reviewer responses, or PR creation.
- Do not infer commit, push, PR, merge, tag, deployment, or branch cleanup authorization from completion of the fix.

## Apply Transferable Patterns

Use these patterns when the current evidence supports them:

- Trace the concrete consumer before adding format, mode, or platform markers.
- Reuse the established transformation pipeline rather than copying its operation list.
- Gate stronger or destructive behavior behind the setting that already expresses user intent.
- Normalize a copy at the application boundary rather than mutating live native state.
- Preserve DOM adjacency and focus order when overlay architecture would harm assistive navigation.
- Measure the actual platform mechanism before adding a workaround.
- Preserve source authority, identity, and fallback invariants when consuming external data.
- Use authoritative event reasons or stable anchors to distinguish real navigation from reflow.
- Build geometry from rendered fragments, aggregate surfaces in logical order, and invalidate all relevant cache dimensions.
- Accept only documented protocol equivalence while preserving all other callback and authentication checks.
- Pass request-specific expectations across shared bridges instead of encoding one provider's shape globally.
- Compile every touched language; a logically correct cross-language patch can still fail another compiler's control-flow rules.

## Final Gate

Before coding, approving, or claiming completion, answer:

1. What concrete runtime consumer owns the failing value or behavior?
2. Is the observed behavior intentional in an external layer and mishandled by the application?
3. Which repository contract, reviewer statement, real observation, and official document support the design?
4. Does the test artifact preserve the actual failure mechanism?
5. Which accessibility, language, platform, data, security, and persistence contracts are truly reachable?
6. Can the fix reuse an existing boundary or pipeline instead of creating a parallel path?
7. What is the smallest invariant the change can honestly prove?
8. Which claims remain unverified, and are they stated plainly?
