# Install Pinpoint

Pinpoint uses the open Agent Skills format.

## Quick Install

### From terminal

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

- Omit `-g` to install only in the current project.
- Replace `'*'` with a single Skill name (`pinpoint`, `pinpoint-review`, `pinpoint-commit`, `pinpoint-pr`, or `pinpoint-help`) to install one Skill.

### With your agent

Give this prompt to your coding agent:

```text
Install Pinpoint globally from https://github.com/ChuwuYo/pinpoint following INSTALL.md.
```

## Verify

List the globally installed Skills (omit `-g` for project scope):

```bash
npx skills list -g
```

Confirm that all five names appear:

```text
pinpoint
pinpoint-review
pinpoint-commit
pinpoint-pr
pinpoint-help
```

Then start a new session and invoke `pinpoint-help` by name (or via your agent's native Skill trigger).

## Update & Remove

Update globally installed Skills:

```bash
npx skills update -g
```

Remove all five Pinpoint Skills globally (omit `-g` for project scope):

```bash
npx skills remove pinpoint pinpoint-review pinpoint-commit pinpoint-pr pinpoint-help -g
```

## Optional: OpenCode Slash Commands

If you use OpenCode and also want its `/` menu populated with standalone command files (`commands/*.md`), run the suite installer (requires Node.js 22.20 or newer):

```bash
npx -y github:ChuwuYo/pinpoint --agent opencode
```

Options:
- Add `--project` for project-only scope.
- Add `--uninstall` to remove Pinpoint Skills and managed command files carrying Pinpoint's ownership marker.
- Pass `--version` to print the suite release version.

The suite installer refuses to overwrite or delete any existing Skill or command file that does not carry Pinpoint's ownership marker.

## Installation Boundaries

- Installation does not authorize repository edits, commits, pushes, PR creation, or deployment.
- Do not install globally when the user requests project-only scope.
- Do not install across unrelated agents unless the user requests that scope.
- Do not replace an existing Skill or command with the same name when ownership is unclear.
