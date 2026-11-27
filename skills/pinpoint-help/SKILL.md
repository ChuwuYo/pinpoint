---
name: pinpoint-help
description: Explain the Pinpoint Skill suite, its workflows, and their authorization boundaries, and show how to invoke or install it without changing repository state. Use when the user asks what Pinpoint does, which Pinpoint skill to use, how to use or install Pinpoint, available Pinpoint workflows, the difference between pinpoint, pinpoint-review, pinpoint-commit, and pinpoint-pr, or asks about a specific skill's behavior or permissions (including Chinese questions like Pinpoint 这几个技能有什么区别, 该用哪个, or walk-through questions naming a skill with "don't actually run it"). Answering meta questions about Pinpoint is this skill's sole job; naming a skill in a question is never a request to execute that skill's workflow.
license: MIT
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

Every compatible agent reaches Pinpoint Skills by exact name (`pinpoint`, `pinpoint-review`, `pinpoint-commit`, `pinpoint-pr`, `pinpoint-help`) — automatically from each Skill's description, as a slash command or `$` mention, through a Skill picker, or via a natural-language request naming the Skill. Never claim a specific slash command exists when the current agent does not provide one.

## Explain Installation

Install the complete suite:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

Omit `-g` for project scope. (Optional: OpenCode users who also want `/` command files can run `npx -y github:ChuwuYo/pinpoint --agent opencode`.)

After installation, verify discovery:

```bash
npx skills list -g
```

Confirm all five Skill names, then start a new session and test explicit invocation by Skill name.

If an installed Skill does not appear, start a new session or relaunch the agent. Never add hooks, edit `AGENTS.md`, or change project configuration merely to make Pinpoint available.

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
