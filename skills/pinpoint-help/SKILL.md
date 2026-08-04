---
name: pinpoint-help
description: Explain the Pinpoint Skill suite, choose the correct workflow, and show how to invoke or install it without changing repository state. Use when the user asks what Pinpoint does, which Pinpoint skill to use, how to use Pinpoint, Pinpoint help, available Pinpoint workflows, or the difference between pinpoint, pinpoint-commit, and pinpoint-pr.
---

# Pinpoint Help

Explain the suite and route the request. Do not inspect, edit, stage, commit, push, or create a PR unless the user separately invokes the appropriate workflow.

## Respect Language

- Reply in the user's current language.
- Preserve Skill names, commands, paths, code identifiers, and required syntax exactly.
- Keep the explanation concise unless the user asks for a detailed comparison.

## Choose the Skill

| Request | Skill |
| --- | --- |
| Investigate an issue, find the owning layer, implement a narrow fix, validate it, or review the complete change | `pinpoint` |
| Generate a commit message, inspect staging, split commits, stage exact changes, or commit when authorized | `pinpoint-commit` |
| Prepare a PR title or body, inspect fork and branch publication state, respond to review, push, or create a PR when authorized | `pinpoint-pr` |
| Explain the suite, installation, invocation, or routing | `pinpoint-help` |

Use the smallest applicable Skill. Do not route an isolated commit-message request through the full repair workflow. Do not route implementation work directly to PR publication.

For an end-to-end contribution, use this sequence only as each phase becomes necessary:

```text
pinpoint -> pinpoint-commit -> pinpoint-pr
```

Completion of one phase does not authorize the next.

## Explain Invocation

Recommend explicit requests when automatic activation is uncertain:

```text
Use Pinpoint to investigate and fix this issue with the smallest proven impact.
```

```text
Use Pinpoint Commit to prepare the commit message, but do not commit.
```

```text
Use Pinpoint PR to write the PR title and body, but do not push.
```

## Explain Installation

Install the complete suite:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

Install the suite only for the current project by omitting `-g`. Install one workflow by replacing `'*'` with its exact Skill name.

For unattended Codex installation:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g -a codex -y
```

For unattended OpenCode installation:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g -a opencode -y
```

Codex, Claude Code, Cursor, OpenCode, and other supported harnesses use the same command shape with their installer-documented agent identifier.

After installation, verify discovery:

```bash
npx skills list -g -a codex
```

Replace `codex` with `opencode` when verifying an OpenCode installation.

If an installed Skill does not appear, restart the current agent or start a new task. Do not add hooks, edit `AGENTS.md`, or change project configuration merely to make Pinpoint available.

## Route Clearly

When the user asks which Skill to use, answer with:

1. **Recommended Skill:** exact name.
2. **Reason:** one sentence tied to the requested operation.
3. **Boundary:** state whether it may edit, commit, push, or create a PR.
4. **Invocation:** provide one ready-to-use prompt when useful.

If the request spans multiple phases, recommend the current phase first and name later phases without implying authorization.
