# Pinpoint

**Find the owner. Fix the boundary. Prove the claim.**

Pinpoint is a portable Agent Skill suite for fixing software issues with evidence and a deliberately small blast radius. Its core Skill traces the real runtime path, identifies which layer owns the failure, preserves adjacent contracts, and reports only what the available evidence proves. Focused companion Skills handle commits and pull requests without loading delivery rules into every investigation.

It does not prescribe a framework or replace a repository's own rules. It provides a disciplined way to investigate and deliver changes inside them.

## Quick Install

Give your coding agent this repository URL and say:

```text
Install the complete Pinpoint Skill suite globally for the current agent from
https://github.com/ChuwuYo/pinpoint. Follow INSTALL.md, verify that all four
Skills are discoverable, and do not add hooks or modify project files.
```

Or run the cross-agent installer directly:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

No manual download or file copying is required. See [`INSTALL.md`](INSTALL.md) for Codex, Claude Code, Cursor, OpenCode, other supported harnesses, project-scoped installation, verification, updates, and removal.

## Why Pinpoint

Coding agents are good at producing plausible patches. The harder problem is deciding whether the patch changes the right layer without damaging behavior somewhere else.

Pinpoint focuses the agent on questions that determine whether a fix is actually sound:

- Is the behavior an application defect, or intentional browser, operating-system, framework, provider, or input behavior?
- Where does correct state first become incorrect?
- Which existing boundary, setting, or pipeline already owns the behavior?
- Which accessibility, language, platform, data, security, and persistence contracts can the change reach?
- Does the test reproduce the real mechanism, or only a convenient imitation?
- Which claims are verified, and which still require a device, provider, artifact, or human check?

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
| `pinpoint` | Complete investigation, implementation, validation, and review workflow |
| `pinpoint-commit` | Exact staging, repository-aligned commit messages, and authorized commits |
| `pinpoint-pr` | Branch and remote checks, evidence-backed PR prose, and authorized publication |
| `pinpoint-help` | Explain the suite and route a request without changing repository state |

`pinpoint` remains one complete root-cause-to-review workflow. Commit and PR delivery are separate because they are optional actions with distinct authorization and language rules. Help remains a lightweight router rather than another workflow.

Both delivery Skills reply in the user's language. Commit messages and PR prose follow an explicitly requested language first; otherwise they follow repository rules and established history before falling back to the user's language.

## Core Workflow

The core `pinpoint` Skill guides an agent through eight decisions:

1. Read the repository rules, complete issue, current diff, history, and remote topology.
2. Reproduce the report and classify the layer that owns the behavior.
3. Trace the concrete consumer from interaction to persistence or external boundary.
4. State one invariant and explicit non-goals before changing code.
5. Implement the smallest complete fix at the existing ownership boundary.
6. Validate the real failure shape and every reachable contract.
7. Use an independent adversarial subagent review when available, verify its findings, and disclose when only self-review was possible.
8. Stop before delivery unless requested.

The full workflow lives in [`skills/pinpoint/SKILL.md`](skills/pinpoint/SKILL.md).

## Install Options

Install the complete suite globally for the detected agent:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

Install only the core workflow globally when commit and PR helpers are not needed:

```bash
npx skills add ChuwuYo/pinpoint --skill pinpoint -g
```

Omit `-g` for a project-scoped installation. Use an explicit `-a` target for unattended installation; [`INSTALL.md`](INSTALL.md) contains ready-to-run examples.

The suite activates from each Skill's description. `pinpoint` handles bug fixing and complete review; `pinpoint-commit` handles staging and commits; `pinpoint-pr` handles PR preparation and publication; `pinpoint-help` explains which one to use. You can also request one explicitly:

```text
Use Pinpoint to investigate and fix this issue with the smallest proven impact.
```

```text
Use Pinpoint to review this branch for incorrect ownership, hidden regressions,
weak test models, and claims the evidence does not support.
```

```text
Use Pinpoint Commit to commit only the staged fix and write the message in Chinese.
```

```text
Use Pinpoint PR to prepare the English PR title and body, but do not push.
```

## What Pinpoint Protects

- Native browser and operating-system behavior
- DOM order, focus, keyboard use, selection, and screen-reader traversal
- Unicode, RTL, CJK, vertical text, and long translations
- Platform-specific workarounds and native toolchains
- Authentication callbacks, redirects, state, PKCE, signatures, and protocol validation
- Stable identity, hashes, ordering, sync clocks, persistence, and fallbacks
- Rendered geometry, reflow, viewport changes, caching, clipping, and hit targets
- Existing user work, branch history, fork topology, and deployment boundaries

Pinpoint does not promise zero impact. It requires the agent to demonstrate the reachable impact and state any remaining verification gaps.

## Evaluation

The scenarios in [`evals/scenarios`](evals/scenarios) exercise the decisions most likely to distinguish a rigorous contribution from a plausible-looking patch:

- external behavior versus application ownership;
- visual correctness versus accessible interaction structure;
- documented protocol equivalence without weakened security;
- rendered geometry and reflow identity;
- user language versus repository commit and PR conventions;
- safe contribution work in a dirty fork.

Each scenario keeps the user prompt separate from the evaluator rubric. Give only the prompt to the agent under evaluation; use the rubric afterward. The scenarios are harness-neutral so they can be used with different agents and models.

## Repository Layout

```text
pinpoint/
├── README.md
├── INSTALL.md
├── LICENSE
├── skills/
│   ├── pinpoint/SKILL.md
│   ├── pinpoint-commit/SKILL.md
│   ├── pinpoint-pr/SKILL.md
│   └── pinpoint-help/SKILL.md
├── evals/
│   └── scenarios/
└── .github/
    └── workflows/
        └── validate.yml
```

Only the selected folders under `skills/` are installed. The remaining files support people evaluating, maintaining, and publishing the project.

## Contributing

Keep changes evidence-driven and narrowly scoped. For a behavior change:

1. Add or update a scenario that exposes the missing decision.
2. Change the minimum necessary instruction in the responsible `SKILL.md`.
3. Validate every Skill against the open specification.
4. Run the affected scenarios without showing their rubrics to the agent.
5. Report both improvements and regressions.

Avoid adding scripts, references, compatibility layers, or plugin packaging until they solve a demonstrated distribution or reliability need.

## License

MIT
