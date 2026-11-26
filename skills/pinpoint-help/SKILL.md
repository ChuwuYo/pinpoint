---
name: pinpoint-help
description: Explain the Pinpoint Skill suite, its workflows, and their authorization boundaries, and show how to invoke or install it without changing repository state. Use when the user asks what Pinpoint does, which Pinpoint skill to use, how to use or install Pinpoint, available Pinpoint workflows, the difference between pinpoint, pinpoint-review, pinpoint-commit, and pinpoint-pr, or asks about a specific skill's behavior or permissions (including Chinese questions like Pinpoint 这几个技能有什么区别, 该用哪个, or walk-through questions naming a skill with "don't actually run it"). Answering meta questions about Pinpoint is this skill's sole job; naming a skill in a question is never a request to execute that skill's workflow.
license: MIT
compatibility: Portable Agent Skill; works with any coding agent harness.
metadata:
  author: ChuwuYo
  version: "0.5.0"
  suite: pinpoint
---

# Pinpoint Help

Explain the suite and route the request.

> **Iron Law:** Never inspect code to fix it, edit files, run reviews, stage, commit, push, or create a PR from `pinpoint-help`. Naming another Pinpoint skill inside a question is never authorization to run that skill.

## 1. Respect Language

- Reply in the user's current language.
- Preserve Skill names, commands, paths, code identifiers, and required syntax exactly.
- Keep the explanation concise unless the user asks for a detailed comparison.

## Choose the Skill

| Request | Skill |
| --- | --- |
| Investigate an issue or performance problem, find the owning layer, implement a narrow fix or optimization, validate it, or review and fix issues | `pinpoint` |
| Review a diff, branch, or PR read-only: challenge ownership, blast radius, test quality, and claims before delivery | `pinpoint-review` |
| Generate a commit message, inspect staging, split commits, stage exact changes, or commit when authorized | `pinpoint-commit` |
| Prepare a PR title or body, inspect fork and branch publication state, respond to review, push, or create a PR when authorized | `pinpoint-pr` |
| Explain the suite, installation, invocation, or routing | `pinpoint-help` |

Use the smallest applicable Skill. Do not route an isolated commit-message request through the full repair workflow, and do not route implementation work directly to PR publication.

For an end-to-end contribution, advance one phase at a time only as explicitly authorized:

```text
pinpoint -> pinpoint-commit -> pinpoint-pr
```

`pinpoint` invokes `pinpoint-review` at its review gate automatically; invoke `pinpoint-review` directly when auditing work outside a Pinpoint run. Completion of one phase never authorizes the next.

### Mixed-Request Routing Rules

| Mixed Request Pattern | Route & Boundary |
| --- | --- |
| "Review this branch and fix what you find" | `pinpoint` (mutation requested; review runs at its own gate) |
| "Review this branch and merge if it passes" | `pinpoint-review` (read-only audit runs; merge is always refused) |
| "Commit, push, and open a PR" | `pinpoint-commit` -> `pinpoint-pr` (only when explicitly authorized; never merges) |
| "What would `pinpoint-review` catch here? Don't run it." | `pinpoint-help` (explain only; do not execute `pinpoint-review`) |
| Pure behavior-preserving refactor / merge-only / squash or rebase | Outside Pinpoint suite (no Pinpoint skill owns these operations) |

## Explain Invocation

Use the current harness's native explicit form:

| Workflow | Claude Code, Cursor, OpenCode | Codex |
| --- | --- | --- |
| Fix and optimization workflow | `/pinpoint <request>` | `$pinpoint` or `/skills` |
| Review workflow | `/pinpoint-review <request>` | `$pinpoint-review` or `/skills` |
| Commit workflow | `/pinpoint-commit <request>` | `$pinpoint-commit` or `/skills` |
| PR workflow | `/pinpoint-pr <request>` | `$pinpoint-pr` or `/skills` |
| Help and routing | `/pinpoint-help` | `$pinpoint-help` or `/skills` |

For another harness, use its native Skill picker, mention syntax, or a natural-language request naming the Skill. Never claim a slash command exists when the harness does not provide one.

## Explain Installation

Install the complete suite and supported command entries for a primary harness:

```bash
npx -y github:ChuwuYo/pinpoint --agent opencode
```

Replace `opencode` with `codex`, `claude-code`, or `cursor`. Add `--project` for project scope.

For another Agent Skills-compatible harness, or for Skills without separate command integration:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

After installation, verify discovery:

```bash
npx skills list -g -a codex
```

Replace `codex` with the installer-documented target identifier. Confirm all five Skill names, then start a new session and test native explicit invocation. OpenCode should also list all five Pinpoint commands in its `/` menu.

If an installed Skill does not appear, restart the current agent or start a new task. Never add hooks, edit `AGENTS.md`, or change project configuration merely to make Pinpoint available.

## Route Clearly

When the user asks which Skill to use, answer with:

1. **Recommended Skill:** exact name.
2. **Reason:** one sentence tied to the requested operation.
3. **Boundary:** state whether it may edit, commit, push, or create a PR (and note merging is never in scope).
4. **Invocation:** provide one ready-to-use prompt when useful.

If the request spans multiple phases, recommend the current phase first and name later phases without implying authorization.

## Gotchas

- **Executing a mentioned skill during a walk-through:** When the user asks "what would `pinpoint-review` catch?" or "does `pinpoint-commit` push?", answer in prose without running `git diff` or starting that workflow.
- **Claiming Pinpoint can merge PRs:** No Pinpoint skill merges branches or PRs, even if the user explicitly asks.
