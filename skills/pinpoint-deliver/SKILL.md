---
name: pinpoint-deliver
description: Inspect repository, branch, and remote state, draft repository-aligned commit messages and evidence-backed PR titles/bodies, stage and commit authorized paths, respond to reviewer feedback, and push or open pull requests only when explicitly authorized. Use when the user asks for a commit message, staging review, commit splitting, creating a commit, PR title/description draft, fork synchronization check, branch publication, PR creation, or reviewer response (including Chinese requests such as 提交改动, 拟一个提交信息, 写 PR 描述, 推送分支并提 PR, or 回复评审意见). Drafting stays draft-only; committing never authorizes pushing or opening a PR; merging and history rewriting (squash, rebase, amend) are never in scope. Do not use for read-only code review (use pinpoint-review) or questions about Pinpoint (use pinpoint-help).
license: MIT
metadata:
  author: ChuwuYo
  version: "0.6.0"
  suite: pinpoint
---

# Pinpoint Deliver

Deliver reviewed changes in two strictly gated stages—local commit and remote PR publication—preserving unrelated work, repository contracts, and remote reviewer history.

> **Iron Law:** Drafting never authorizes staging, committing, pushing, or opening a PR. Committing never authorizes pushing or opening a PR. Authorization is never inherited from earlier turns, code approval, or pre-staged files. Merging, history rewriting (`squash`, `rebase`, `amend`), and hook bypasses (`--no-verify`) are never in scope. Never overwrite newer remote reviewer commits from a stale local branch.

## 1. Respect Language and Community

- Reply and explain results in the user's current language.
- Use the commit/PR language explicitly requested by the user.
- If unspecified, follow precedence: explicit repository rule > dominant language of recent commits or accepted PRs > user's current language.
- Do not force English merely because Conventional Commits uses English type keywords (`fix:`, `feat:`).
- Keep code identifiers, paths, protocol names, issue references, and required trailers exact.
- Address reviewers directly in PR replies (e.g., "Thanks for catching X", never "Per the maintainer's request").

## 2. Stage 1 — Local Commit

Run this stage when the request involves commit messages, staging, commit splitting, or creating a commit:

From the target repository directory, run `node <skill-dir>/scripts/inspect-commit-state.mjs` ([scripts/inspect-commit-state.mjs](scripts/inspect-commit-state.mjs), when Node.js is available) or the equivalent `git` commands to inspect worktree state and detect active commit-validator configs:

1. **Establish the commit contract:** when a validator or hook validates commit messages, read its active configuration first and treat its rejection output as the source of truth rather than retrying variants or bypassing it. Otherwise derive format, scopes, language, body style, and trailers from recent commits. Repository rules outrank this Skill.
2. **Isolate scope:** keep one coherent behavior or maintenance purpose per commit. Keep regression tests with the implementation they protect unless repository convention splits them. Include lockfiles, migrations, or generated files only when required by the same change; exclude unrelated formatting, local artifacts, secrets (`.env`, keys, tokens), and unrelated user edits.
3. **Draft the message:** follow repository convention first. For Conventional Commits (`<type>(<scope>): <imperative summary>`), choose type and scope from the semantic change rather than filenames, keep the subject concise with no trailing period, and add a body only to explain *why* or preserved behavior. Omit AI attribution unless explicitly required. Never claim unverified tests, platforms, or behavior.
   - **Bad:** `fix: update export.js and csv.js`
   - **Good:** `fix(export): handle empty cells without crashing CSV serialization`
4. **Commit safely (only when explicitly authorized):**
   - Stage only the exact authorized paths or hunks; never run blind `git add -A` / `git add .` across dirty trees.
   - Re-read the complete staged diff and file list to confirm no unrelated, secret, or missing required files are staged.
   - Run any required pre-commit checks not yet completed.
   - Commit without bypassing hooks (`--no-verify` is forbidden; stop and report hook failures). If the selection yields no diff, stop—never create an empty commit.
   - Verify the created commit subject, file list, diff summary, and remaining dirty worktree state. Stop here unless Stage 2 was also explicitly authorized.

## 3. Stage 2 — Remote PR and Review Response

Run this stage when the request involves PR titles/bodies, fork or branch synchronization, pushing, PR creation, or reviewer responses:

From the target repository directory, run `node <skill-dir>/scripts/inspect-pr-topology.mjs` ([scripts/inspect-pr-topology.mjs](scripts/inspect-pr-topology.mjs), when Node.js is available) or the equivalent `git` commands to verify branch, remotes, PR templates, and base:

1. **Establish publication state:** read the contribution guide, PR template, reviewer feedback, and linked issue. Identify the authoritative base and contributor remote from actual `git remote -v` config (do not blindly assume `origin/main`). Fetch current refs when online and inspect every commit and the complete diff against the base. If remote reviewer/automation history updated the branch, preserve it and never force-push stale local history over it; rebase or merge base drift only when explicitly authorized.
2. **Write title and evidence-backed body:** follow repository title conventions, describing semantic behavior rather than filenames, and omit closing syntax from titles unless required. Adapt the body to the repository PR template and change size, omitting empty ceremonial sections:

```md
## Summary
- State the user-visible problem and corrected behavior.

## Root Cause
Explain the concrete runtime mechanism only when non-obvious.

## Changes
- List meaningful implementation changes and reused boundaries.

## Behavior
- Describe corrected behavior and important behavior intentionally preserved.

## Scope
- Name reached paths, platforms, modes, or formats, plus material evidence and gaps.

## Testing
- **Automated:** exact commands and outcomes.
- **Artifact or manual:** exact scenario, environment, and observation.
- **Unverified:** reachable boundaries not exercised.
```

   Include `## Testing` whenever the change touches code/tests or ran checks; never claim unverified platforms, formats, accessibility, or zero impact.
3. **Publish (only when explicitly authorized):** confirm the exact local branch, contributor remote, remote branch, and target base; push only the intended branch and verify the remote ref; create or update the PR against the authoritative base; verify the resulting PR URL, title, body, linkage, branches, and draft state. Never merge, deploy, tag, or delete branches.
4. **Respond to review:** verify reviewer claims against current code and contracts before changing code; state clearly what changed, what remained unchanged, and what still needs verification; update the PR body whenever changes alter mechanism, scope, or evidence.

## Gotchas

- **Treating code approval or commit auth as push/PR auth:** stop after the exact action authorized in the current request.
- **Staging everything blindly (`git add -A` / `git add .`):** always stage explicit paths or hunks to protect unrelated edits and secrets.
- **Bypassing hooks or history:** `--no-verify`, `squash`, `rebase`, and `amend` of existing commits are out of bounds unless explicitly requested; hook failures stop execution.
- **Conflating a clean worktree with "nothing to draft":** draft PR prose from branch commits against the authoritative base even when the working tree is clean.
- **Overwriting reviewer commits or assuming `origin/main`:** fetch and compare remote refs and check `upstream` vs. `origin` before pushing or targeting a PR.

## Final Check

Before returning, committing, or publishing, verify:

1. Does the commit or PR represent one coherent purpose against the intended base?
2. Does its language follow user > repository rule > history precedence?
3. Does every behavioral, platform, and test claim have matching evidence, with gaps stated honestly?
4. Are unrelated local edits and newer remote reviewer commits intact?
5. Did execution stop strictly at drafting, staging, committing, pushing, or PR creation as authorized?
