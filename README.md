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

Pinpoint is a portable Agent Skill suite for diagnosing, fixing, optimizing, and reviewing software with evidence and a deliberately narrow blast radius. It traces the real execution path, isolates which layer owns the failure, validates the mechanism rather than a proxy, and claims only what observed evidence proves.

It does not prescribe a framework or replace a repository's own rules—it provides a disciplined engineering workflow inside them.

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

Coding agents are good at producing plausible patches. The hard part is fixing the owning boundary without silently breaking adjacent contracts or overstating what was tested.

| Without Pinpoint | With Pinpoint |
| --- | --- |
| Patch the visible symptom | Trace the first transition from correct to incorrect |
| Invent new helpers or flags | Reuse existing pipelines and prove runtime reachability |
| Verify only the happy-path entry | Trace teardown, inverse, re-entry, and concurrency windows |
| Trust simplified mocks or proxies | Validate the real mechanism and downstream consumer |
| Claim "verified" broadly | Separate automated, manual, and unverified evidence |
| Push current changes blindly | Check base, worktree, history, and explicit authorization |

> [!NOTE]
> Pinpoint audits only contracts reachable from the traced runtime path: **interaction & accessibility**, **language & content**, **data & persistence**, **external protocols & security**, **UI & geometry**, and **platform & toolchain**. Unreachable targets never become artificial requirements.

## Skills

| Skill | Purpose | Scope |
| --- | --- | --- |
| `pinpoint` | Full investigation, implementation, validation, and review workflow for fixes and optimizations | Edits + Review |
| `pinpoint-review` | Adversarial review of a diff, branch, or PR: parallel concern axes, scored re-rank gate, strict noise budget | Read-only |
| `pinpoint-deliver` | Two-stage gated git delivery: commit staging/messages and PR prose, branch pushes, PR creation, or review replies when authorized | Delivery |
| `pinpoint-help` | Explain the suite, check boundaries, and route requests without touching repository state | Read-only help |

`pinpoint` loads `pinpoint-review` automatically at its review gate whenever installed (scaling between parallel axis subagents and single-reviewer mode based on risk and harness support). Keeping review, delivery, and help as separate Skills prevents adversarial grading and git delivery rules from bloating unrelated turns.

### Three-Tier Progressive Disclosure

Each Skill follows the open Agent Skills architecture to keep context lean:

1. **Metadata (`SKILL.md` frontmatter):** always loaded for accurate triggering and routing.
2. **Core instructions (`SKILL.md` body):** concise, language-agnostic first principles and stop rules loaded only when triggered.
3. **Bundled resources (`references/` & `scripts/`):** domain checklists, worked examples, and deterministic read-only inspection scripts loaded or executed on demand.

> [!IMPORTANT]
> Installing or invoking Pinpoint never authorizes commits, pushes, pull requests, merges, deployments, or destructive cleanup. Each delivery action requires explicit user authorization.

## Core Workflow

The core [`pinpoint`](skills/pinpoint/SKILL.md) Skill guides an agent through six stages:

1. **Keep an evidence ledger:** classify repository contracts, external contracts, requester direction, observations, and inferences, pushing critical claims down the 5-level proof ladder (`assertion -> file:line/history -> trace -> executed probe -> real-environment repro`).
2. **Trace ownership before designing:** follow the real path from trigger through boundaries, shared channels, version history of existing guards, symbol-search blind spots, teardown/re-entry, and suspension windows to locate the first incorrect transition.
3. **Fix the smallest owned boundary:** reuse established settings, pipelines, and single-producer semantics before adding new abstractions; attack the shared premise and revert speculative code from refuted hypotheses if repeated attempts fail.
4. **Audit only reachable contracts:** load only matching domain sections from `references/domain-checklists.md` and report unexercised reachable domains as gaps.
5. **Validate the mechanism, not the patch shape:** test at the lowest reliable oracle (with matched before/after baselines for optimizations) and report automated, manual, unverified, and unrelated-environment results separately.
6. **Run an adversarial review and hand off:** pass a neutral evidence packet to `pinpoint-review` (or run the same challenge read-only), fix confirmed findings, and stop before git delivery unless requested.

Example explicit requests:

```text
Use pinpoint to fix the broken sidebar scroll.
Use pinpoint-review to review this branch before merge.
Use pinpoint-deliver to commit the staged fix in Chinese.
Use pinpoint-deliver to draft the PR title and body.
```

## Evaluation

The scenarios in [`evals/scenarios`](evals/scenarios) test engineering judgment that separates a rigorous fix from a plausible patch (ownership vs. external behavior, accessible structure, protocol equivalence, rendered geometry, runtime reachability, downstream consumer usability, baseline-backed optimization, and review noise discipline).

Each scenario separates `prompt.md` from `rubric.json`. Scenarios are agent-agnostic and scored against [`evals/SCORING.md`](evals/SCORING.md); see [`evals/README.md`](evals/README.md) for layout and validation commands.

## Contributing

Keep changes evidence-driven and narrowly scoped:

1. Add or update a scenario in `evals/scenarios/` that exposes the missing decision.
2. Put universal principles in `SKILL.md`, domain-specific depth or examples in `references/`, and deterministic read-only checks in `scripts/`.
3. Validate the suite locally with `npm test`.
4. Run affected scenarios without exposing `rubric.json` to the candidate agent, scoring per [`evals/SCORING.md`](evals/SCORING.md).
5. Report both improvements and regressions.

Keep `SKILL.md` concise and language-agnostic—do not hardcode project-specific or framework-specific rules into core instructions. When updating the pinned `skills` CLI version in `bin/pinpoint-install.mjs`, keep `tests/installer-smoke.mjs` and the CI matrix in sync.

## License

MIT
