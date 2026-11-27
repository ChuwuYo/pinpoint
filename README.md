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
  <a href="#quick-start">Install</a> ·
  <a href="#why-pinpoint">Why Pinpoint</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#core-workflow">Workflow</a> ·
  <a href="#evaluation">Evaluation</a>
</p>

---

Pinpoint is a portable Agent Skill suite for fixing and optimizing software with evidence and a deliberately small blast radius. Its core Skill traces the real runtime path, identifies which layer owns the failure, preserves adjacent contracts, and reports only what the available evidence proves.

It does not prescribe a framework or replace a repository's own rules. It provides a disciplined way to investigate, review, and deliver changes inside them.

## Quick Start

### From terminal

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

Omit `-g` for project scope, or pass `--skill pinpoint` to install only the core workflow.

### With your agent

Give this prompt to your coding agent:

```text
Install Pinpoint globally from https://github.com/ChuwuYo/pinpoint following INSTALL.md.
```

See [`INSTALL.md`](INSTALL.md) for verification, updates, removal, and optional OpenCode slash commands.

## Why Pinpoint

Coding agents are good at producing plausible patches. The harder problem is deciding whether a patch changes the right layer without silently breaking adjacent behavior or overstating what was tested.

| Without Pinpoint | With Pinpoint |
| --- | --- |
| Patch the visible symptom | Trace the first transition from correct to incorrect |
| Replace architecture when a helper exists | Reuse the project's established boundaries and semantics |
| Add flags for hypothetical platforms | Prove impact through runtime reachability first |
| Treat accessibility as a final checklist | Treat interaction structure as a design constraint |
| Trust a simplified fixture | Validate the real mechanism and consumer artifact |
| Claim "verified" after local mocks | Separate automated, manual, and unverified evidence |
| Push the current branch and hope | Verify worktree, remotes, base, and authorization |

> [!NOTE]
> Pinpoint audits only contracts reachable from the traced runtime path. A single-platform project stays single-platform; unrelated platforms, formats, and toolchains do not become artificial requirements.

## Skills

| Skill | Purpose | Scope |
| --- | --- | --- |
| `pinpoint` | Full investigation, implementation, validation, and review workflow for fixes and optimizations | Edits + Review |
| `pinpoint-review` | Adversarial review of a diff, branch, or PR: parallel concern axes, scored re-rank gate, strict noise budget | Read-only |
| `pinpoint-commit` | Exact staging, repository-aligned commit messages, and commits when authorized | Delivery |
| `pinpoint-pr` | Branch and remote checks, evidence-backed PR prose, and PR publication when authorized | Delivery |
| `pinpoint-help` | Explain the suite, check boundaries, and route requests without touching repository state | Read-only help |

`pinpoint` invokes `pinpoint-review` automatically at its review gate, while keeping review, commit, PR, and help as separate Skills so adversarial grading and git delivery rules stay out of unrelated turns. Both delivery Skills reply in the user's language; commit messages and PR prose follow an explicitly requested language first, then repository rules and history, before falling back to the user's language.

Pinpoint uses the open Agent Skills format: compatible agents load matching Skills automatically from their descriptions or when invoked explicitly by Skill name. Start a new session after installation so your agent refreshes its Skill list.

> [!IMPORTANT]
> Installing or invoking Pinpoint never authorizes commits, pushes, pull requests, merges, deployments, or destructive cleanup. Each delivery action requires explicit user authorization.

## Core Workflow

The core [`pinpoint`](skills/pinpoint/SKILL.md) Skill guides an agent through seven decisions:

1. **Maintain an evidence ledger**: separate repository contract, external contract, requester direction, observation, and inference.
2. **Apply transferable reasoning**: validate at the real consumer boundary, match evidence granularity to the claim, preserve upstream authority, and prove impact through runtime reachability.
3. **Trace the concrete runtime path**: locate the first transition from correct to incorrect and classify which layer owns it.
4. **Fix the smallest owned boundary**: reuse established settings, pipelines, and abstractions before adding anything new.
5. **Audit reachable contracts**: check only contracts reachable from the traced path (interaction, language, data, protocol, geometry, or platform) and report what could not be exercised.
6. **Validate the real mechanism**: test at the lowest reliable oracle, then report automated, manual, unverified, and unrelated-environment evidence separately.
7. **Run independent adversarial review**: delegate to `pinpoint-review` when subagents are available, verify its findings, or disclose when only self-review was possible. Stop before delivery unless requested.

Example explicit requests:

```text
Use pinpoint to fix the broken sidebar scroll.
Use pinpoint-review to review this branch before merge.
Use pinpoint-commit to commit the staged fix in Chinese.
Use pinpoint-pr to draft the PR title and body.
```

## What Pinpoint Protects

Every contract reachable from the traced runtime path — whatever the domain:

- **Upstream authority**: intentional browser, OS, protocol, or provider behavior
- **Interaction structure**: DOM order, focus, keyboard, selection, screen-reader traversal
- **Language and content**: Unicode, RTL, CJK, vertical text, long translations
- **Identity and persistence**: stable identifiers, hashes, ordering, sync, fallbacks
- **Protocol validity**: callbacks, redirects, state, PKCE, signatures, replay checks
- **Rendered behavior**: geometry, reflow, viewport, caching, clipping, hit targets
- **Platform reality**: documented workarounds, native toolchains, real execution mechanisms
- **Producer-consumer contracts**: exit codes, artifact completeness, downstream readability
- **Repository safety**: existing user work, branch history, fork topology, deployment boundaries

Pinpoint does not promise zero impact. It requires the agent to prove reachable impact and state remaining verification gaps.

## Evaluation

The scenarios in [`evals/scenarios`](evals/scenarios) test decisions that distinguish a rigorous fix from a plausible-looking patch (ownership vs. external behavior, accessible structure, protocol equivalence, rendered geometry, runtime reachability, artifact usability, baseline-backed optimization, and review noise discipline).

Each scenario keeps `prompt.md` separate from `rubric.json`. Scenarios are agent-agnostic and scored against [`evals/SCORING.md`](evals/SCORING.md); see [`evals/README.md`](evals/README.md) for layout and validation commands.

## Contributing

Keep changes evidence-driven and narrowly scoped:

1. Add or update a scenario in `evals/scenarios/` that exposes the missing decision.
2. Make the smallest necessary edit in the responsible `SKILL.md`.
3. Validate the suite locally with `npm test`.
4. Run affected scenarios without exposing `rubric.json` to the agent under test, scoring per [`evals/SCORING.md`](evals/SCORING.md).
5. Report both improvements and regressions.

Avoid adding scripts, references, compatibility layers, or extra packaging unless they solve a demonstrated reliability or distribution need. When updating the pinned `skills` CLI version in `bin/pinpoint-install.mjs`, keep `tests/installer-smoke.mjs` and the CI matrix in sync.

## License

MIT
