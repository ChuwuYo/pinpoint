<p align="center">
  <img src="docs/assets/logo.svg" alt="Pinpoint logo" width="180">
</p>

<h1 align="center">Pinpoint</h1>

<p align="center">
  English | <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <strong>Find the owner. Fix the boundary. Prove the claim.</strong>
</p>

<p align="center">
  <a href="https://github.com/ChuwuYo/pinpoint/actions/workflows/validate.yml"><img src="https://github.com/ChuwuYo/pinpoint/actions/workflows/validate.yml/badge.svg" alt="Validate Pinpoint"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="#quick-install">Install</a> ·
  <a href="#why-pinpoint">Why Pinpoint</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#commands">Commands</a> ·
  <a href="#core-workflow">Workflow</a> ·
  <a href="#evaluation">Evaluation</a>
</p>

---

Pinpoint is a portable Agent Skill suite for fixing and optimizing software with evidence and a deliberately small blast radius. Its core Skill traces the real runtime path, identifies which layer owns the failure, preserves adjacent contracts, and reports only what the available evidence proves. Focused companion Skills handle commits and pull requests without loading delivery rules into every investigation.

It does not prescribe a framework or replace a repository's own rules. It provides a disciplined way to investigate and deliver changes inside them.

## Quick Install

### Install with your agent

Give this prompt to your coding agent:

```text
Install Pinpoint globally for the current coding harness from
https://github.com/ChuwuYo/pinpoint. Read and follow INSTALL.md. Install all five
Skills and any matching user commands supported by this harness, then verify
explicit invocation in a new session. Do not install hooks or modify project
files.
```

### Install from terminal

Run the suite installer with the harness you use:

```bash
npx -y github:ChuwuYo/pinpoint --agent opencode
```

`npx -y github:ChuwuYo/pinpoint` fetches this repository and runs the Pinpoint
suite installer. `--agent opencode` selects the target harness's Skill
directory and any required command integration.

The suite installer supports these explicitly verified values:

```text
codex
claude-code
cursor
opencode
```

The `--agent` value is not an arbitrary harness identifier. For another
Agent Skills-compatible harness, use its identifier with the standard
installer instead:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g -a <harness-id>
```

The suite installer adds all five Skills globally and installs separate
command files only when the selected harness requires them. Use `--project`
for project-only scope.

> [!TIP]
> Give the repository URL to your coding agent with the prompt above and it can install and verify the suite itself. No manual download or file copying is required.

See [`INSTALL.md`](INSTALL.md) for Codex, Claude Code, Cursor, OpenCode, other supported harnesses, project-scoped installation, verification, updates, and removal.

## Why Pinpoint

Coding agents are good at producing plausible patches. The harder problem is deciding whether the patch changes the right layer without damaging behavior somewhere else.

Pinpoint focuses the agent on questions that determine whether a fix is actually sound:

- Is the behavior an application defect, or intentional browser, operating-system, framework, provider, or input behavior?
- Where does correct state first become incorrect?
- Which existing boundary, setting, or pipeline already owns the behavior?
- Which accessibility, language, platform, data, security, and persistence contracts can the change reach?
- Does the test reproduce the real mechanism, or only a convenient imitation?
- Which claims are verified, and which still require a device, provider, artifact, or human check?

> [!NOTE]
> Pinpoint audits only contracts reachable from the traced runtime path. A single-platform project stays single-platform; unrelated platforms, formats, and toolchains do not become artificial requirements.

## What Changes

| Without Pinpoint | With Pinpoint |
| --- | --- |
| Patch the visible symptom | Trace the first incorrect boundary |
| Replace architecture because a newer tool exists | Reuse the project's established semantics |
| Add flags for hypothetical platforms | Prove runtime reachability first |
| Treat accessibility as a final checklist | Treat interaction structure as a design constraint |
| Trust a simplified fixture | Match the real artifact and mechanism |
| Say “all platforms” after local tests | Separate automated, manual, and unverified evidence |
| Push the current branch and hope | Verify worktree, remotes, base, and authorization |

## Skills

| Skill | Purpose |
| --- | --- |
| `pinpoint` | Complete investigation, implementation, validation, and review workflow for fixes and optimizations |
| `pinpoint-review` | Read-only adversarial review of a diff, branch, or PR: parallel concern axes, scored re-rank gate, strict noise budget |
| `pinpoint-commit` | Exact staging, repository-aligned commit messages, and authorized commits |
| `pinpoint-pr` | Branch and remote checks, evidence-backed PR prose, and authorized publication |
| `pinpoint-help` | Explain the suite and route a request without changing repository state |

`pinpoint` remains one complete root-cause-to-review workflow, and invokes `pinpoint-review` at its review stage. Review is a separate Skill because it is also useful standalone — auditing any diff or branch, not just Pinpoint output — and because keeping its adversarial methodology out of the investigation context keeps both sharper. Commit and PR delivery are separate because they are optional actions with distinct authorization and language rules. Help remains a lightweight router rather than another workflow.

Both delivery Skills reply in the user's language. Commit messages and PR prose follow an explicitly requested language first; otherwise they follow repository rules and established history before falling back to the user's language.

## Commands

| Workflow | Claude Code, Cursor, OpenCode | Codex |
| --- | --- | --- |
| Fix and optimization workflow | `/pinpoint <request>` | `$pinpoint` or `/skills` |
| Review workflow | `/pinpoint-review <request>` | `$pinpoint-review` or `/skills` |
| Commit workflow | `/pinpoint-commit <request>` | `$pinpoint-commit` or `/skills` |
| PR workflow | `/pinpoint-pr <request>` | `$pinpoint-pr` or `/skills` |
| Help and routing | `/pinpoint-help` | `$pinpoint-help` or `/skills` |

> [!NOTE]
> Agent Skills are portable; command registration is harness-owned. Skills and commands are discovered when a harness starts a session, so open a new session after installation — for desktop or long-running harnesses, quit and relaunch the application entirely, since a new conversation may not rescan the command menu. Codex exposes third-party Skills through `$` mentions and `/skills`; it does not register third-party bare `/pinpoint` commands.

## Core Workflow

The core `pinpoint` Skill guides an agent through seven decisions:

1. Keep an evidence ledger: separate repository contract, external contract, reviewer direction, observation, and inference.
2. Apply transferable reasoning: validate at the real consumer boundary, match evidence granularity to the claim, preserve upstream authority, and prove impact through runtime reachability.
3. Trace the concrete runtime path to the first transition from correct to incorrect, and classify which layer owns it.
4. Fix the smallest owned boundary, reusing established settings, pipelines, and abstractions before adding anything new.
5. Audit only the contracts reachable from the traced path — interaction, language, data, protocol, geometry, or platform — and report what could not be exercised.
6. Validate the real mechanism at the lowest reliable oracle, then report automated, manual, unverified, and unrelated-environment evidence separately.
7. Run an independent adversarial review when subagents are available — delegated to the `pinpoint-review` Skill — verify its findings, and disclose when only self-review was possible. Stop before delivery unless requested.

The full workflow lives in [`skills/pinpoint/SKILL.md`](skills/pinpoint/SKILL.md).

## Scope and Invocation

Install only the standard Skills when command integration is not needed or the harness is not listed above:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

Install only the core workflow globally when commit and PR helpers are not needed:

```bash
npx skills add ChuwuYo/pinpoint --skill pinpoint -g
```

Omit `-g` for a project-scoped installation. Use an explicit `-a` target for unattended installation; [`INSTALL.md`](INSTALL.md) contains ready-to-run examples and command behavior for each primary harness.

> [!IMPORTANT]
> Installing or invoking Pinpoint does not authorize commits, pushes, pull requests, merges, deployments, or destructive cleanup. Each delivery action still requires explicit user authorization.

The suite activates from each Skill's description. `pinpoint` handles bug fixing, optimization, and complete review; `pinpoint-review` audits any diff or branch read-only; `pinpoint-commit` handles staging and commits; `pinpoint-pr` handles PR preparation and publication; `pinpoint-help` explains which one to use. You can also request one explicitly:

```text
Use Pinpoint to investigate and fix this issue with the smallest proven impact.
```

```text
Use Pinpoint to review this branch for incorrect ownership, hidden regressions,
weak test models, and claims the evidence does not support.
```

```text
Use Pinpoint Review to audit this branch before merge: challenge ownership,
blast radius, test quality, and every claim the evidence does not support.
```

```text
Use Pinpoint Commit to commit only the staged fix and write the message in Chinese.
```

```text
Use Pinpoint PR to prepare the English PR title and body, but do not push.
```

## What Pinpoint Protects

Every contract reachable from the traced runtime path — whatever the domain. Common examples:

- Upstream authority: intentional browser, OS, protocol, or provider behavior
- Interaction structure: DOM order, focus, keyboard, selection, screen-reader traversal
- Language and content: Unicode, RTL, CJK, vertical text, long translations
- Identity and persistence: stable identifiers, hashes, ordering, sync, fallbacks
- Protocol validity: callbacks, redirects, state, PKCE, signatures, replay checks
- Rendered behavior: geometry, reflow, viewport, caching, clipping, hit targets
- Platform reality: specific workarounds, native toolchains, actual mechanisms
- Producer-consumer contracts: exit codes, artifact completeness, downstream readability
- Existing user work, branch history, fork topology, and deployment boundaries

Pinpoint does not promise zero impact. It requires the agent to demonstrate the reachable impact and state any remaining verification gaps.

## Evaluation

The scenarios in [`evals/scenarios`](evals/scenarios) exercise the decisions most likely to distinguish a rigorous contribution from a plausible-looking patch:

- external behavior versus application ownership;
- visual correctness versus accessible interaction structure;
- documented protocol equivalence without weakened security;
- rendered geometry and reflow identity;
- shared interfaces versus runtime-reachable consumers;
- producer success signals versus downstream-consumable artifacts;
- baseline measurement versus intuitive optimization;
- persisted-value provenance versus same-named decoys;
- planted blockers versus decoy findings and review noise;
- user language versus repository commit and PR conventions;
- safe contribution work in a dirty fork.

Each scenario keeps the user prompt separate from the evaluator rubric. Give only the prompt to the agent under evaluation; use the rubric afterward. The scenarios are harness-neutral so they can be used with different agents and models. Score runs with [`evals/SCORING.md`](evals/SCORING.md) so results stay comparable across versions and models.

## Contributing

Keep changes evidence-driven and narrowly scoped. For a behavior change:

1. Add or update a scenario that exposes the missing decision.
2. Change the minimum necessary instruction in the responsible `SKILL.md`.
3. Validate every Skill against the open specification.
4. Run the affected scenarios without showing their rubrics to the agent, scoring runs per [`evals/SCORING.md`](evals/SCORING.md).
5. Report both improvements and regressions.

Avoid adding scripts, references, compatibility layers, or plugin packaging until they solve a demonstrated distribution or reliability need.

## License

MIT
