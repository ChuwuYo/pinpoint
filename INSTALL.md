# Install Pinpoint

Pinpoint uses the open Agent Skills format. The suite installer adds all four
Skills through the cross-agent `skills` CLI and installs separate user commands
only for harnesses that do not expose installed Skills directly in their
command menu. It does not install hooks or edit project instructions.

## Install with your agent

Give this prompt to your coding agent:

```text
Install Pinpoint globally for the current coding harness from
https://github.com/ChuwuYo/pinpoint. Read and follow INSTALL.md. Install all four
Skills and any matching user commands supported by this harness, then verify
explicit invocation in a new session. Do not install hooks or modify project
files.
```

The agent should identify its current harness, run the matching command below,
and report the installed scope and explicit invocation syntax.

## Install from terminal

Choose the harness you use. Node.js 22.20 or newer is required.

```bash
# Codex
npx -y github:ChuwuYo/pinpoint --agent codex

# Claude Code
npx -y github:ChuwuYo/pinpoint --agent claude-code

# Cursor
npx -y github:ChuwuYo/pinpoint --agent cursor

# OpenCode
npx -y github:ChuwuYo/pinpoint --agent opencode
```

Installation is global by default. Add `--project` to install only for the
current project.

The installer gives its exact packaged Skill source to the pinned `skills` CLI,
which writes to the selected harness's documented Skill directory. Claude Code
and Cursor can surface user-invocable Skills directly. OpenCode keeps Skills
and custom commands separate, so the installer also writes four managed
command files to its documented command directory. Codex uses its native Skill
picker and `$` mentions rather than third-party bare slash commands.

## Explicit invocation

| Workflow | Claude Code, Cursor, OpenCode | Codex |
| --- | --- | --- |
| Fix and optimization workflow | `/pinpoint <request>` | `$pinpoint` or `/skills` |
| Commit workflow | `/pinpoint-commit <request>` | `$pinpoint-commit` or `/skills` |
| PR workflow | `/pinpoint-pr <request>` | `$pinpoint-pr` or `/skills` |
| Help and routing | `/pinpoint-help` | `$pinpoint-help` or `/skills` |

Start a new session after installation. Harnesses discover Skills and command
menus at session startup; installing into an already-running session does not
guarantee that its cached capability list will refresh. For desktop or
long-running harnesses, quit and relaunch the application entirely — starting
a new conversation inside a running app may not rescan the command menu.

## Standard Skills-only installation

For another Agent Skills-compatible harness, or when command integration is not
needed, use the universal installer directly:

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

Omit `-g` for project scope. Use an installer-documented `-a` identifier for
unattended installation. Other harnesses retain their native Skill picker,
mention syntax, or natural-language invocation; Pinpoint does not invent a
slash-command mechanism they do not provide.

## Install one Skill

Use the exact Skill name:

```bash
npx skills add ChuwuYo/pinpoint --skill pinpoint -g
npx skills add ChuwuYo/pinpoint --skill pinpoint-commit -g
npx skills add ChuwuYo/pinpoint --skill pinpoint-pr -g
npx skills add ChuwuYo/pinpoint --skill pinpoint-help -g
```

This installs only the selected standard Skill. Use the suite installer when
you also want all supported explicit command entries.

## Codex built-in installer

When Codex has `$skill-installer`, ask it directly:

```text
Use $skill-installer to install all Skills from
https://github.com/ChuwuYo/pinpoint globally. Verify all four names afterward.
```

Codex discovers newly installed Skills automatically. In a new task, invoke one
with `$pinpoint`, `$pinpoint-commit`, `$pinpoint-pr`, or `$pinpoint-help`, or
select it through `/skills`.

## Verify

List the globally installed Skills for the target harness:

```bash
npx skills list -g -a opencode
```

Replace `opencode` with the harness identifier used during installation and
confirm that the result includes:

```text
pinpoint
pinpoint-commit
pinpoint-pr
pinpoint-help
```

Then start a new session and invoke `pinpoint-help` using the syntax in the
table above. On OpenCode, all four command names should also appear in the `/`
menu.

## Versioning

Pinpoint versions the complete suite with Semantic Versioning. Check the source
version with:

```bash
npx -y github:ChuwuYo/pinpoint --version
```

For reproducible installation after a release tag exists, pin the tag:

```bash
npx -y github:ChuwuYo/pinpoint#v0.3.0 --agent opencode
```

The package version, Git tag, Skills, commands, and installer belong to the
same release.

## Update

Re-run the suite installer for the same harness and scope. This updates both
the Skills and any managed command files:

```bash
npx -y github:ChuwuYo/pinpoint --agent opencode
```

For a Skills-only installation, use `npx skills update -g`.

## Remove

Remove the suite from the selected scope:

```bash
npx -y github:ChuwuYo/pinpoint --agent opencode --uninstall
```

Add `--project` when removing a project-scoped installation. The `--agent`
value selects the target Skill directory and any matching harness integration,
such as OpenCode's separate commands. Some harnesses intentionally share an
`.agents/skills` directory; removing Pinpoint there also removes it for other
harnesses that read the same directory.

The installer removes only Skills and command files carrying Pinpoint's
ownership marker. It refuses to overwrite or remove an unowned item with the
same name.

## Installation boundaries

- Installation does not authorize repository edits, commits, pushes, PR creation, or deployment.
- Pinpoint does not require a hook, MCP server, background service, account, or API key.
- Do not install globally when the user requests project-only scope.
- Do not install for every detected harness unless the user requests that scope.
- Do not replace an existing Skill or command with the same name when ownership is unclear.
