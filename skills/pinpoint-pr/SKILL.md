---
name: pinpoint-pr
description: Inspect branch and remote topology, draft evidence-backed pull request titles and descriptions, respond to reviewer feedback, and push or open pull requests only when explicitly authorized. Use when the user asks for a PR title, PR description, PR body draft, fork synchronization check, branch publication, pull request creation, reviewer response, or final PR scope check (including Chinese requests such as 写 PR 描述, 起草 PR, 推送分支并提 PR, or 回复评审意见). Drafting stays draft-only unless push or PR creation is explicitly authorized. Merging is never in scope, even on request. Do not use for read-only code review (use pinpoint-review) or questions about Pinpoint (use pinpoint-help).
license: MIT
metadata:
  author: ChuwuYo
  version: "0.5.0"
  suite: pinpoint
---

# Pinpoint PR

Prepare a pull request whose scope, history, target, and claims match the final implementation. Treat publication as a separate authorized action from writing PR prose.

> **Iron Law:** Writing a PR title or description never authorizes pushing a branch or opening a PR. Merging is never in scope under any phrasing, including "merge if it checks out". Never overwrite newer remote reviewer commits from a stale local branch.

## 1. Respect Language and Community

- Reply and explain the result in the user's current language.
- Use the PR language explicitly requested by the user.
- If unspecified, follow precedence: explicit repository language rule > dominant language of recent accepted PRs > user's current language.
- Preserve code identifiers, paths, issue references, protocol names, and quoted reviewer terminology exactly.
- Address reviewers directly. Never refer to the reader as "the maintainer" in prose addressed to them.

## 2. Establish the Publication State

Run `node scripts/inspect-pr-topology.mjs` (when Node.js is available) or the equivalent `git` commands to verify branch and remote state:

1. Read the repository contribution guide, PR template, current reviewer feedback, and any linked issue or discussion. When CI or a bot validates the PR title or body, that validator's rules are the contract.
2. Inspect status, staged/unstaged changes, untracked files, current branch, upstream tracking, remotes, worktrees, submodules, and nested repositories.
3. Identify the authoritative base and contributor remote from actual git configuration rather than assumed names.
4. Fetch current refs before comparing the branch with its intended base (when network access is available).
5. Review every commit and the complete diff that the PR will contain; confirm one coherent change is represented and unrelated work is absent.
6. If the authoritative base has moved since divergence, report the drift; rebase or merge to integrate only with explicit authorization.

If a reviewer, automation, rebase, or force-push updated the remote branch, fetch and compare before continuing. Preserve the newer history and never overwrite it from a stale local branch.

## 3. Write the Title and Evidence-Backed Body

**Title rules:**

- Follow the repository's title convention (language, scope, capitalization, issue syntax).
- Describe the resulting behavior or semantic correction, not the implementation file list.
- Keep it specific enough to distinguish the change from adjacent issues.
- Omit issue-closing syntax from the title unless repository convention requires it.

**Body template:** adapt to the repository PR template and change size. Link the originating issue with closing syntax when one exists and convention expects it. Omit empty or ceremonial sections:

```md
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

## Testing

- **Automated:** exact commands and outcomes.
- **Artifact or manual:** exact scenario, environment, and observation.
- **Unverified:** reachable boundaries not exercised.
```

- Include `## Testing` by default whenever the change touches code/tests or included verification runs; omit it only for pure documentation edits.
- Add a compact before/after table only for visual changes that benefit from comparison.
- Never claim all platforms, all formats, full accessibility, zero impact, or device verification without evidence.
- Keep the body synchronized with the final diff and any reviewer-authored changes.

## 4. Publish Only When Authorized

When the user explicitly requests push or PR creation:

1. Confirm the exact local branch, contributor remote, remote branch, and target base.
2. Push only the intended branch and verify the resulting remote ref.
3. Create or update the PR against the confirmed authoritative base.
4. Verify the PR URL, title, body, issue linkage, source branch, target branch, and draft state.
5. Never merge, deploy, tag, delete branches, or modify unrelated PRs unless separately authorized (merging is always out of scope for Pinpoint).

After merge, synchronize the authoritative base before starting another task only when the user asks for it.

## 5. Respond to Review

- Verify reviewer claims against current code and official contracts before changing implementation.
- State clearly what changed, what remained unchanged, and what still needs verification.
- Thank the reviewer naturally when appropriate, without ceremonial filler.
- Update the PR description whenever reviewer-driven changes alter the mechanism, scope, or evidence.
- Never push superseded local history over reviewer-authored commits.

## Gotchas

- **Conflating a clean worktree with "nothing to draft":** Draft PR titles/bodies from the branch commits against the authoritative base even when the working tree is clean.
- **Overwriting reviewer commits on force-push:** Always fetch and compare remote tracking refs before pushing an updated branch.
- **Assuming `origin/main` blindly:** Check `git remote -v` and `upstream` vs. `origin` in fork workflows before targeting a base branch.
- **Referring to the reviewer in third person:** Write "Thanks for catching X" instead of "Per the maintainer's request".

## Final Check

Before returning or publishing, verify:

1. Is the source branch based on the intended authoritative base?
2. Does the PR contain only the change it claims to make?
3. Does every behavioral and platform claim have corresponding evidence?
4. Are manual and unverified boundaries stated honestly?
5. Did the operation stop exactly where the user authorized?
