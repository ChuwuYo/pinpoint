# Install Pinpoint

Pinpoint uses the open Agent Skills format. Install it with a Skill-aware agent or the cross-agent `skills` installer; do not manually move files unless automated installation is unavailable.

## Give This to Your Agent

Send the repository URL with this instruction:

```text
Install the complete Pinpoint Skill suite globally for the current coding agent
from https://github.com/ChuwuYo/pinpoint. Inspect this INSTALL.md first. Verify
that pinpoint, pinpoint-commit, pinpoint-pr, and pinpoint-help are discoverable.
Do not add hooks, edit project instructions, or modify repository files.
```

The agent should identify its own client, run the corresponding command below, and report the installed scope and discovered Skill names.

## Interactive Installation

Let the installer detect the current agent and ask for any missing choices:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

This installs all four Skills globally for the selected agent. Omit `-g` to install them only for the current project.

## Unattended Installation

Specify the target harness and accept the installation non-interactively. Examples:

```bash
# Codex
npx skills add ChuwuYo/pinpoint --skill '*' -g -a codex -y

# Claude Code
npx skills add ChuwuYo/pinpoint --skill '*' -g -a claude-code -y

# Cursor
npx skills add ChuwuYo/pinpoint --skill '*' -g -a cursor -y

# OpenCode
npx skills add ChuwuYo/pinpoint --skill '*' -g -a opencode -y
```

Codex, Claude Code, Cursor, OpenCode, and other supported harnesses use the same command shape. Replace the agent identifier only when the installer documents that target. Do not guess an identifier after an installation error; run the interactive command instead.

## Install One Skill

Use the exact Skill name:

```bash
npx skills add ChuwuYo/pinpoint --skill pinpoint -g
npx skills add ChuwuYo/pinpoint --skill pinpoint-commit -g
npx skills add ChuwuYo/pinpoint --skill pinpoint-pr -g
npx skills add ChuwuYo/pinpoint --skill pinpoint-help -g
```

Use `pinpoint` for the complete fix workflow. The other three are optional companions.

## Codex Built-In Installer

When Codex has `$skill-installer`, ask it directly:

```text
Use $skill-installer to install all Skills from
https://github.com/ChuwuYo/pinpoint globally. Verify all four names afterward.
```

Codex discovers user-scoped Skills from its supported Skill locations. Newly installed Skills should appear automatically; restart Codex or start a new task if they do not.

## Verify

For a global Codex installation:

```bash
npx skills list -g -a codex
```

For a global OpenCode installation:

```bash
npx skills list -g -a opencode
```

Confirm that the result includes:

```text
pinpoint
pinpoint-commit
pinpoint-pr
pinpoint-help
```

Then test discovery in a new task with an agent-neutral request:

```text
Use the pinpoint-help Skill to tell me which Pinpoint workflow should handle a bug fix.
```

## Update

Update installed Skills from their recorded source:

```bash
npx skills update -g
```

Review upstream changes before updating in sensitive environments.

## Remove

Remove the suite from Codex:

```bash
npx skills remove pinpoint pinpoint-commit pinpoint-pr pinpoint-help -g -a codex -y
```

Removal should affect only the installed Skill links or copies. It should not modify application repositories, Git history, hooks, or project instructions.

## Installation Boundaries

- Installation does not authorize repository edits, commits, pushes, PR creation, or deployment.
- Pinpoint does not require a hook, MCP server, background service, account, or API key.
- Do not install globally when the user requests project-only scope.
- Do not install for every detected agent unless the user requests that scope.
- Do not replace an existing Skill with the same name without comparing its source and asking when ownership is unclear.
