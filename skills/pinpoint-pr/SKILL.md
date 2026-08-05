---
name: pinpoint-pr
description: Inspect branch and remote topology, prepare evidence-backed pull request titles and bodies, and push or create pull requests only when authorized. Use when the user asks for a PR title, PR description, fork synchronization, branch publication, pull request creation, reviewer response, or final PR scope review.
---

# Pinpoint PR

Prepare a pull request whose scope, history, target, and claims match the final implementation. Treat publication as a separate authorized action from writing PR prose.

## Respect Language and Community

- Reply and explain the result in the user's current language.
- Use the PR language explicitly requested by the user.
- If the user does not specify a PR language, follow an explicit repository language rule first, then the dominant language of recent accepted PRs, then the user's current language.
- Preserve code identifiers, paths, issue references, protocol names, and quoted reviewer terminology exactly.
- Address reviewers directly. Do not refer to the person reading the PR as “the maintainer” in prose written to them.

## Establish the Publication State

1. Read the repository contribution guide, PR template, and current reviewer feedback, plus any linked issue or discussion.
2. Inspect status, staged and unstaged changes, untracked files, current branch, upstream tracking, remotes, worktrees, submodules, and nested repositories.
3. Identify the authoritative base and contributor remote from configuration rather than assumed names.
4. Fetch current refs before comparing the branch with its intended base.
5. Review every commit and the complete diff that the PR will contain.
6. Confirm that one coherent change is represented and unrelated work is absent.

If a reviewer, automation, rebase, or force-push updated the remote branch, fetch and compare before continuing. Preserve the newer history and never overwrite it from a stale local branch.

## Write the Title

- Follow the repository's title convention, including language, scope, capitalization, and issue syntax.
- Describe the resulting behavior or semantic correction, not the implementation file list.
- Keep the title specific enough to distinguish the change from adjacent issues.
- Do not add issue-closing syntax to the title unless repository convention requires it.

## Write Claims the Evidence Supports

Adapt the body to the repository template and size of the change. Include only useful sections:

```md
Closes #<issue>

## Summary

- State the user-visible problem and corrected behavior.
- Summarize the cohesive implementation change.

## Root Cause

Explain the concrete runtime mechanism only when it is not obvious.

## Changes

- List meaningful implementation and behavior changes.
- Name reused settings, pipelines, boundaries, or abstractions when relevant.

## Behavior

- Describe corrected behavior.
- State important behavior intentionally preserved.

## Scope

- Name the paths, platforms, formats, languages, providers, or modes actually reached.
- State material validation evidence and remaining gaps.
```

- Omit empty or ceremonial sections.
- Follow the repository's preferred placement for validation evidence. When the change includes test files or the work included verification runs, include a `Testing` section by default, reporting the evidence categories: automated, artifact or manual, and unverified. Omit it only when the change has no testing-related content, such as documentation-only edits.
- Add a compact before/after table only for visual changes that benefit from comparison.
- Separate automated evidence, manual or artifact evidence, unverified boundaries, and unrelated environment failures.
- Never claim all platforms, all formats, full accessibility, zero impact, or device verification without evidence.
- Keep the body synchronized with the final diff and any reviewer-authored implementation changes.

## Publish Only When Authorized

Writing a title or body does not authorize a push or PR creation.

When the user explicitly requests publication:

1. Confirm the exact local branch, contributor remote, remote branch, and target base.
2. Push only the intended branch and verify the resulting remote ref.
3. Create or update the PR against the confirmed authoritative base.
4. Verify the PR URL, title, body, issue linkage, source branch, target branch, and draft state.
5. Do not merge, deploy, tag, delete branches, or modify unrelated PRs unless separately authorized.

After merge, synchronize the authoritative base before starting another issue. Do not infer that synchronization is requested merely because the PR merged.

## Respond to Review

- Verify reviewer claims against the current code and official contracts before changing implementation.
- State what changed, what remained, and what still needs verification.
- Thank the reviewer naturally when appropriate, without ceremonial filler.
- Update the PR description when reviewer-authored changes alter the mechanism, scope, or evidence.
- Do not push superseded local history over reviewer changes.

## Final Check

Before returning or publishing, answer:

1. Is the source branch based on the intended authoritative base?
2. Does the PR contain only the change it claims to make?
3. Does every behavioral and platform claim have corresponding evidence?
4. Are manual and unverified boundaries stated honestly?
5. Did the operation stop exactly where the user authorized?
