import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(fixture, ...args) {
  const result = spawnSync(
    npm,
    ['exec', '--yes', `--package=${root}`, '--', 'pinpoint-install', ...args],
    {
      cwd: fixture,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  );
  if (result.status !== 0) {
    throw new Error(`${result.stdout}${result.stderr}`.trim());
  }
}

function expectFailure(fixture, ...args) {
  const result = spawnSync(
    npm,
    ['exec', '--yes', `--package=${root}`, '--', 'pinpoint-install', ...args],
    {
      cwd: fixture,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  );
  if (result.status === 0) throw new Error('Expected installer to reject an unowned destination');
}

const fixture = mkdtempSync(join(tmpdir(), 'pinpoint-smoke-'));
const claudeFixture = mkdtempSync(join(tmpdir(), 'pinpoint-smoke-claude-'));
const skill = join(fixture, '.agents', 'skills', 'pinpoint');
const command = join(fixture, '.opencode', 'commands', 'pinpoint.md');

try {
  run(fixture, '--agent', 'opencode', '--project');
  run(fixture, '--agent', 'opencode', '--project');
  if (!existsSync(join(skill, 'SKILL.md'))) throw new Error('Pinpoint Skill was not installed');
  if (!existsSync(join(skill, '.pinpoint-source.json'))) throw new Error('Skill ownership marker is missing');
  if (!readFileSync(command, 'utf8').includes('Managed by ChuwuYo/pinpoint')) {
    throw new Error('OpenCode command ownership marker is missing');
  }

  run(fixture, '--agent', 'opencode', '--project', '--uninstall');
  if (existsSync(skill) || existsSync(command)) throw new Error('Managed files remained after uninstall');

  mkdirSync(skill, { recursive: true });
  writeFileSync(join(skill, 'SKILL.md'), 'unowned\n', 'utf8');
  expectFailure(fixture, '--agent', 'opencode', '--project');
  if (readFileSync(join(skill, 'SKILL.md'), 'utf8') !== 'unowned\n') {
    throw new Error('Installer changed an unowned Skill');
  }

  const claudeSkill = join(claudeFixture, '.claude', 'skills', 'pinpoint');
  run(claudeFixture, '--agent', 'claude-code', '--project');
  if (!existsSync(join(claudeSkill, '.pinpoint-source.json'))) {
    throw new Error('Claude Code Skill was not installed to its native directory');
  }
  run(claudeFixture, '--agent', 'claude-code', '--project', '--uninstall');
  if (existsSync(claudeSkill)) throw new Error('Claude Code Skill remained after uninstall');

  console.log(`Pinpoint installer smoke test passed on ${process.platform}`);
} finally {
  rmSync(fixture, { recursive: true, force: true });
  rmSync(claudeFixture, { recursive: true, force: true });
}
