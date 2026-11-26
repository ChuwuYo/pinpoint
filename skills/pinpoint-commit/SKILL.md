---
name: pinpoint-commit
description: Inspect repository state, draft repository-aligned commit messages, stage exact authorized paths, and create commits without touching unrelated work. Use when the user asks to draft or write a commit message, review staging, split commits, stage exact files, or create a commit (including Chinese requests such as 提交改动, 帮我提交, 拟一个提交信息, or conventional commit requests). Drafting stays draft-only unless committing is explicitly authorized in the current request. Do not use for history-rewriting operations (squash, rebase, or amend of existing commits), merging, or questions about this skill (use pinpoint-help).
license: MIT
compatibility: Requires git CLI (and optional Node.js) for repository inspection and commit creation.
metadata:
  author: ChuwuYo
  version: "0.5.0"
  suite: pinpoint
---

# Pinpoint Commit

Create one exact, reviewable commit from the changes the user authorized. Preserve unrelated work and follow the repository's actual history and rules.

> **Iron Law:** Drafting a commit message never authorizes staging or committing. Authorization is never inherited from earlier turns, code approval, or pre-staged files. Never bypass hooks, create an empty commit, or follow up with push, PR, or merge.

## 1. Respect Language

- Reply and explain the result in the user's current language.
- Use the commit-message language explicitly requested by the user.
- If unspecified, follow precedence: explicit repository rule > dominant recent commit history > user's current language.
- Do not force English merely because Conventional Commits uses English type keywords.
- Keep code identifiers, paths, protocol names, issue references, and required trailers exact.

## 2. Inspect Before Staging

Run `node scripts/inspect-commit-state.mjs` (when Node.js is available) or the equivalent `git` commands to capture repository state cleanly:

1. Read the nearest repository and contribution instructions governing commits.
2. Inspect status, staged and unstaged diffs, untracked files, branch, worktrees, submodules, and nested repositories.
3. Read recent commits to determine message structure, language, capitalization, scopes, body style, issue references, and trailers.
4. Separate changes belonging to the requested commit from unrelated, secret, generated, or ambiguous files.
5. Never reset, clean, discard, amend, bypass hooks, or rewrite history unless explicitly authorized.

If the user asks only for a commit message (e.g., "draft a commit message" or "拟一个提交信息，我确认后再提交"), do **not** stage or commit. Base the message on the identified diff or staged diff and return it ready to use.

## 3. Define the Commit Scope

- Keep one coherent behavior or maintenance purpose per commit.
- Split changes only when each resulting commit remains buildable, understandable, and independently useful.
- Keep regression tests together with the implementation they protect unless repository convention requires splitting them.
- Include generated files, lockfiles, migrations, or snapshots only when they are required consequences of the same change.
- Exclude unrelated formatting, metadata churn, local artifacts, secrets (`.env`, keys, tokens), and unrelated user changes.

## 4. Write the Message

Follow repository convention before generic style. When the repository uses Conventional Commits:

```text
<type>(<scope>): <imperative summary>
```

- Choose type and scope from the semantic change, not the file list.
- Keep the subject concise, specific, and free of a trailing period.
- Prefer imperative mood when natural in the selected language.
- Add a body only when the rationale, compatibility constraint, migration, security impact, or tradeoff matters to future readers. Explain *why* or preserved behavior instead of narrating the diff.
- Place issue-closing syntax and trailers where the repository expects them.
- Do not add AI attribution unless the user or repository explicitly requires it.
- Never claim tests, platforms, or behavior that were not verified.

### Good vs. Bad Examples

- **Bad:** `fix: update export.js and csv.js` (narrates filenames, hides semantics).
- **Good:** `fix(export): handle empty cells without crashing CSV serialization` (names semantic scope and user-visible fix).

## 5. Commit Safely (Only When Explicitly Authorized)

1. Stage only the exact authorized paths or hunks.
2. Re-read the complete staged diff and staged file list.
3. Confirm no unrelated, secret, generated, or missing required files are staged.
4. Run any repository-required pre-commit validation not already completed.
5. Create the commit without bypassing hooks (`--no-verify` is forbidden). If a hook fails, report the failure and stop; never retry with a bypass.
6. Verify the resulting commit subject, body, file list, diff summary, and repository status.
7. Report any remaining staged, unstaged, or untracked work separately.

If the authorized selection yields no diff, stop and say so. Never create an empty commit. Do not push, create a PR, deploy, tag, or amend as an implied follow-up.

## Gotchas

- **Staging everything blindly (`git add -A` / `git add .`):** Always stage explicit paths or hunks so unrelated dirty worktree edits and untracked secrets stay untouched.
- **Treating "looks good" as commit authorization:** Code approval is not commit authorization; require explicit commit intent in the current request.
- **Retrying failed hooks with `--no-verify`:** Hook failure is a stop signal; report the exact hook error and let the user decide.
- **Forcing English on Chinese repos:** Check `git log -n 10 --oneline` first; Conventional Commits types (`fix:`, `feat:`) can pair with Chinese subjects when repo history does.

## Final Check

Before returning or committing, verify:

1. Does the commit contain exactly one coherent purpose?
2. Does its language follow user > repository rule > history precedence?
3. Does the message explain the semantic change without overclaiming?
4. Are all unrelated user changes still intact?
5. Did the operation stop exactly at message drafting, staging, or committing as authorized?
