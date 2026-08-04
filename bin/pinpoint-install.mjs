#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const repository = 'ChuwuYo/pinpoint';
const skillsPackage = 'skills@1.5.21';
const commandNames = ['pinpoint', 'pinpoint-commit', 'pinpoint-pr', 'pinpoint-help'];
const knownAgents = new Set(['codex', 'claude-code', 'cursor', 'opencode']);
const aliases = new Map([
  ['claude', 'claude-code'],
  ['open-code', 'opencode'],
]);
const marker = '<!-- Managed by ChuwuYo/pinpoint. -->';
const ownershipFile = '.pinpoint-source.json';

function usage() {
  console.log(`Pinpoint ${packageJson.version}

Usage:
  pinpoint-install --agent <codex|claude-code|cursor|opencode> [--project]
  pinpoint-install --agent <agent> --uninstall [--project]
  pinpoint-install --check

Options:
  --agent <id>  Target harness
  --project     Install in the current project instead of globally
  --uninstall   Remove Pinpoint from the selected harness and scope
  --check       Validate packaged commands without installing
  --dry-run     Print intended operations without writing
  --version     Print the suite version
  --help        Show this help`);
}

function parseArgs(argv) {
  const options = {
    agent: null,
    project: false,
    uninstall: false,
    check: false,
    dryRun: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--agent') {
      options.agent = argv[++i] ?? null;
    } else if (arg === '--project') {
      options.project = true;
    } else if (arg === '--uninstall') {
      options.uninstall = true;
    } else if (arg === '--check') {
      options.check = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg === '--') {
      continue;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.agent) options.agent = aliases.get(options.agent) ?? options.agent;
  return options;
}

function commandSource(name) {
  return join(root, 'commands', `${name}.md`);
}

function skillSource(name) {
  return join(root, 'skills', name, 'SKILL.md');
}

function validatePackage() {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
    throw new Error(`Invalid SemVer version: ${packageJson.version}`);
  }

  for (const name of commandNames) {
    if (!existsSync(skillSource(name))) throw new Error(`Missing Skill: skills/${name}/SKILL.md`);
    const ownershipPath = join(root, 'skills', name, ownershipFile);
    if (!existsSync(ownershipPath)) throw new Error(`Missing Skill ownership marker: skills/${name}/${ownershipFile}`);
    const ownership = JSON.parse(readFileSync(ownershipPath, 'utf8'));
    if (ownership.source !== repository) {
      throw new Error(`Invalid Skill ownership marker: skills/${name}/${ownershipFile}`);
    }

    const source = commandSource(name);
    if (!existsSync(source)) throw new Error(`Missing command: commands/${name}.md`);
    const content = readFileSync(source, 'utf8');
    if (!content.startsWith('---\n') || !content.includes('\ndescription: ')) {
      throw new Error(`Invalid command frontmatter: commands/${name}.md`);
    }
    if (!content.includes(marker) || !content.includes(`\`${name}\` Skill`)) {
      throw new Error(`Command does not identify its managed Skill: commands/${name}.md`);
    }
  }

  for (const document of ['README.md', 'INSTALL.md', 'skills/pinpoint-help/SKILL.md']) {
    const content = readFileSync(join(root, document), 'utf8');
    if (/github:ChuwuYo\/pinpoint(?:#[^\s]+)?\s+--\s+--/.test(content)) {
      throw new Error(`Invalid npx argument separator in ${document}`);
    }
  }

  console.log(`Validated Pinpoint ${packageJson.version}: ${commandNames.length} commands`);
}

function skillStorage(agent, project) {
  const base = project ? process.cwd() : homedir();
  // skills@1.5.21 uses Claude's native directory and the shared Agent Skills directory for the other targets.
  return join(base, agent === 'claude-code' ? '.claude' : '.agents', 'skills');
}

function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function preflightSkills(agent, project) {
  const skillsDir = skillStorage(agent, project);
  for (const name of commandNames) {
    const destination = join(skillsDir, name);
    if (!pathExists(destination)) continue;
    const ownershipPath = join(destination, ownershipFile);
    if (!existsSync(ownershipPath)) {
      throw new Error(`Refusing to replace or remove unowned Skill: ${destination}`);
    }
    const ownership = JSON.parse(readFileSync(ownershipPath, 'utf8'));
    if (ownership.source !== repository) {
      throw new Error(`Refusing to replace or remove unowned Skill: ${destination}`);
    }
  }
}

function opencodeCommandsDir(project) {
  if (project) return join(process.cwd(), '.opencode', 'commands');
  const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(configHome, 'opencode', 'commands');
}

function preflightOpenCode(project) {
  const destinationDir = opencodeCommandsDir(project);
  for (const name of commandNames) {
    const destination = join(destinationDir, `${name}.md`);
    if (!pathExists(destination)) continue;
    const existing = readFileSync(destination, 'utf8');
    if (!existing.includes(marker)) {
      throw new Error(`Refusing to replace or remove unowned command: ${destination}`);
    }
  }
  return destinationDir;
}

function npxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function runSkills(agent, project, uninstall, dryRun) {
  const command = ['--yes', '--package', skillsPackage, '--', 'skills'];
  const args = uninstall
    ? [...command, 'remove', ...commandNames, '--agent', agent, '--yes']
    : [...command, 'add', root, '--skill', '*', '--agent', agent, '--yes'];
  if (!project) args.push('--global');

  console.log(`> ${npxCommand()} ${args.join(' ')}`);
  if (dryRun) return;

  const result = spawnSync(npxCommand(), args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`skills installer exited with status ${result.status}`);
}

function removeManagedSkills(agent, project, dryRun) {
  const skillsDir = skillStorage(agent, project);
  console.log(`Remove managed Pinpoint Skills from ${skillsDir}`);
  if (dryRun) return;

  for (const name of commandNames) {
    rmSync(join(skillsDir, name), { recursive: true, force: true });
  }
}

function installOpenCodeCommands(project, dryRun) {
  const destinationDir = preflightOpenCode(project);
  console.log(`Install OpenCode commands in ${destinationDir}`);
  if (dryRun) return;

  mkdirSync(destinationDir, { recursive: true });
  for (const name of commandNames) {
    writeFileSync(
      join(destinationDir, `${name}.md`),
      readFileSync(commandSource(name), 'utf8'),
      'utf8',
    );
  }
}

function uninstallOpenCodeCommands(project, dryRun) {
  const destinationDir = opencodeCommandsDir(project);
  console.log(`Remove managed OpenCode commands from ${destinationDir}`);
  if (dryRun) return;

  for (const name of commandNames) {
    const destination = join(destinationDir, `${name}.md`);
    if (!existsSync(destination)) continue;
    const content = readFileSync(destination, 'utf8');
    if (content.includes(marker)) unlinkSync(destination);
  }
}

function printInvocation(agent) {
  if (agent === 'codex') {
    console.log('Start a new Codex task, then use $pinpoint or select it through /skills.');
  } else {
    console.log('Start a new session, then use /pinpoint, /pinpoint-commit, /pinpoint-pr, or /pinpoint-help.');
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();
  if (options.version) return console.log(packageJson.version);
  if (options.check) return validatePackage();
  if (!options.agent || !knownAgents.has(options.agent)) {
    throw new Error('Specify --agent codex, claude-code, cursor, or opencode.');
  }

  validatePackage();
  preflightSkills(options.agent, options.project);
  if (options.agent === 'opencode') {
    preflightOpenCode(options.project);
  }
  runSkills(options.agent, options.project, options.uninstall, options.dryRun);

  if (options.uninstall) removeManagedSkills(options.agent, options.project, options.dryRun);

  if (options.agent === 'opencode') {
    if (options.uninstall) uninstallOpenCodeCommands(options.project, options.dryRun);
    else installOpenCodeCommands(options.project, options.dryRun);
  }

  if (!options.uninstall) printInvocation(options.agent);
}

try {
  main();
} catch (error) {
  console.error(`pinpoint-install: ${error.message}`);
  process.exitCode = 1;
}
