---
name: pinpoint-commit
description: Inspect repository state, prepare repository-aligned commit messages, stage exact files, and create commits without touching unrelated work. Use when the user asks for a commit, commit message, staging review, commit splitting, conventional commit, or verification of what a commit contains.
---

# Pinpoint Commit

Create one exact, reviewable commit from the changes the user authorized. Preserve unrelated work and follow the repository's actual history and rules.

## Respect Language

- Reply and explain the result in the user's current language.
- Use the commit-message language explicitly requested by the user.
- If the user does not specify a commit-message language, follow an explicit repository rule first, then the dominant recent commit history, then the user's current language.
- Do not force English merely because Conventional Commits uses English type keywords.
- Keep code identifiers, paths, protocol names, issue references, and required trailers exact.

## Inspect Before Staging

1. Read the nearest repository and contribution instructions that govern commits.
2. Inspect status, staged and unstaged diffs, untracked files, branch, worktrees, submodules, and nested repositories.
3. Read recent commits to determine message structure, language, capitalization, scopes, body style, issue references, and trailers.
4. Identify which changes belong to the requested commit and which are unrelated or ambiguous.
5. Never reset, clean, discard, amend, bypass hooks, or rewrite history unless explicitly authorized.

If the user asks only for a commit message, do not stage or commit. Base the message on the diff or staged diff they identified and return it ready to use.

## Define the Commit

- Keep one coherent behavior or maintenance purpose per commit.
- Split changes only when each resulting commit remains buildable, understandable, and independently useful.
- Do not separate a regression test from the implementation it protects unless repository convention requires it.
- Include generated files, lockfiles, migrations, or snapshots only when they are required consequences of the same change.
- Exclude unrelated formatting, metadata churn, local artifacts, secrets, and user changes.

## Write the Message

Follow repository convention before applying generic style.

When the repository uses Conventional Commits, use:

```text
<type>(<scope>): <imperative summary>
```

- Choose the type and scope from the actual semantic change, not the files touched.
- Keep the subject concise, specific, and free of a trailing period.
- Prefer imperative mood when natural in the selected language.
- Add a body only when the reason, compatibility constraint, migration, security impact, or non-obvious tradeoff matters to future readers.
- Explain why or preserved behavior instead of narrating the diff.
- Put issue-closing language and trailers where the repository expects them.
- Do not add AI attribution unless the user or repository explicitly requires it.
- Do not claim tests, platforms, or behavior that were not verified.

For breaking changes, migrations, security fixes, reversions, and compatibility workarounds, preserve enough context for future maintainers even when the subject is self-explanatory.

## Commit Safely

Only create a commit after the user authorizes committing.

1. Stage only the exact authorized paths or hunks.
2. Re-read the complete staged diff and staged file list.
3. Confirm that no unrelated, secret, generated, or missing required files are present.
4. Run any repository-required pre-commit validation not already completed.
5. Create the commit without bypassing hooks.
6. Verify the resulting commit subject, body, file list, diff summary, and repository status.
7. Report any remaining staged, unstaged, or untracked work separately.

Do not push, create a PR, deploy, tag, or amend as an implied follow-up.

## Final Check

Before returning or committing, answer:

1. Does the commit contain exactly one coherent purpose?
2. Does its language follow the user, repository rule, and history precedence?
3. Does the message explain the semantic change without overclaiming?
4. Are all unrelated user changes still intact?
5. Did the requested operation stop at message generation, staging, or committing as authorized?
