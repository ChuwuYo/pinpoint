import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const repository = 'ChuwuYo/pinpoint';
const skillsPackage = 'skills@1.5.21';
const agents = ['codex', 'claude-code', 'cursor', 'opencode'];
const skills = ['pinpoint', 'pinpoint-review', 'pinpoint-commit', 'pinpoint-pr', 'pinpoint-help'];
const marker = '<!-- Managed by ChuwuYo/pinpoint. -->';

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function ok(message) {
  console.log(`ok: ${message}`);
}

function isolatedGlobalEnv(home) {
  const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, '.config') };
  if (process.platform === 'win32') {
    env.USERPROFILE = home;
    env.APPDATA = join(home, 'AppData', 'Roaming');
    env.LOCALAPPDATA = join(home, 'AppData', 'Local');
  }
  return env;
}

function runInstaller(cwd, args, env = process.env) {
  return spawnSync(
    npm,
    ['exec', '--yes', `--package=${root}`, '--', 'pinpoint-install', ...args],
    { cwd, env, encoding: 'utf8', shell: process.platform === 'win32' },
  );
}

function runSkillsList(cwd, args, env) {
  return spawnSync(
    npx,
    ['--yes', '--package', skillsPackage, '--', 'skills', 'list', ...args],
    { cwd, env, encoding: 'utf8', shell: process.platform === 'win32' },
  );
}

function assertInstalled(base, agent, opencodeCommands = join(base, '.opencode', 'commands')) {
  const skillsDir = join(base, agent === 'claude-code' ? '.claude' : '.agents', 'skills');
  for (const name of skills) {
    const skillDir = join(skillsDir, name);
    if (!existsSync(join(skillDir, 'SKILL.md'))) {
      fail(`${agent}: ${name}/SKILL.md missing after install`);
      continue;
    }
    const ownershipPath = join(skillDir, '.pinpoint-source.json');
    if (!existsSync(ownershipPath)) {
      fail(`${agent}: ${name} ownership marker missing after install`);
      continue;
    }
    let ownership;
    try {
      ownership = JSON.parse(readFileSync(ownershipPath, 'utf8'));
    } catch {
      fail(`${agent}: ${name} ownership marker unreadable after install`);
      continue;
    }
    if (ownership.source !== repository) {
      fail(`${agent}: ${name} ownership marker source ${JSON.stringify(ownership.source)}`);
    }
  }
  if (agent === 'opencode') {
    for (const name of skills) {
      const command = join(opencodeCommands, `${name}.md`);
      if (!existsSync(command)) {
        fail(`opencode: command ${name}.md missing after install`);
        continue;
      }
      if (!readFileSync(command, 'utf8').includes(marker)) {
        fail(`opencode: command ${name}.md lacks the ownership marker`);
      }
    }
  }
}

function assertUninstalled(base, agent, opencodeCommands = join(base, '.opencode', 'commands')) {
  const skillsDir = join(base, agent === 'claude-code' ? '.claude' : '.agents', 'skills');
  for (const name of skills) {
    if (existsSync(join(skillsDir, name))) fail(`${agent}: ${name} remained after uninstall`);
  }
  if (agent === 'opencode') {
    for (const name of skills) {
      if (existsSync(join(opencodeCommands, `${name}.md`))) {
        fail(`opencode: command ${name}.md remained after uninstall`);
      }
    }
  }
}

function runMatrix() {
  for (const agent of agents) {
    for (const scope of ['project', 'global']) {
      const label = `${agent}/${scope}`;
      const fixture = mkdtempSync(join(tmpdir(), 'pinpoint-matrix-'));
      let home = fixture;
      let env = process.env;
      if (scope === 'global') {
        home = mkdtempSync(join(tmpdir(), 'pinpoint-global-'));
        mkdirSync(join(home, 'project'), { recursive: true });
        env = isolatedGlobalEnv(home);
      }
      const cwd = scope === 'project' ? fixture : join(home, 'project');
      const commandsDir =
        scope === 'project' ? join(fixture, '.opencode', 'commands') : join(home, '.config', 'opencode', 'commands');
      try {
        const install = runInstaller(cwd, ['--agent', agent, scope === 'project' ? '--project' : ''].filter(Boolean), env);
        if (install.status !== 0) {
          fail(`${label}: install failed: ${(install.stdout + install.stderr).trim()}`);
          continue;
        }
        assertInstalled(scope === 'project' ? fixture : home, agent, commandsDir);
        ok(`${label}: install + artifacts`);

        const second = runInstaller(cwd, ['--agent', agent, scope === 'project' ? '--project' : ''].filter(Boolean), env);
        if (second.status !== 0) {
          fail(`${label}: second install (idempotence) failed`);
        } else {
          assertInstalled(scope === 'project' ? fixture : home, agent, commandsDir);
          ok(`${label}: idempotent reinstall`);
        }

        if (agent === 'opencode') {
          const list = runSkillsList(cwd, [scope === 'global' ? '-g' : '', '-a', agent].filter(Boolean), env);
          const output = `${list.stdout}${list.stderr}`;
          for (const name of skills) {
            if (!output.includes(name)) fail(`${label}: discovery list missing ${name}`);
          }
          ok(`${label}: discovery list exposes all five skills`);
        }

        const uninstall = runInstaller(cwd, ['--agent', agent, scope === 'project' ? '--project' : '', '--uninstall'].filter(Boolean), env);
        if (uninstall.status !== 0) {
          fail(`${label}: uninstall failed: ${(uninstall.stdout + uninstall.stderr).trim()}`);
        } else {
          assertUninstalled(scope === 'project' ? fixture : home, agent, commandsDir);
          ok(`${label}: uninstall removes only managed files`);
        }
      } finally {
        rmSync(fixture, { recursive: true, force: true });
        if (scope === 'global') rmSync(home, { recursive: true, force: true });
      }
    }
  }
}

function testDryRun() {
  const fixture = mkdtempSync(join(tmpdir(), 'pinpoint-dryrun-'));
  try {
    const result = runInstaller(fixture, ['--agent', 'opencode', '--project', '--dry-run']);
    if (result.status !== 0) {
      fail(`dry-run failed: ${(result.stdout + result.stderr).trim()}`);
      return;
    }
    const skillsDir = join(fixture, '.agents', 'skills');
    const commandsDir = join(fixture, '.opencode', 'commands');
    for (const name of skills) {
      if (existsSync(join(skillsDir, name))) fail(`dry-run wrote skill ${name}`);
      if (existsSync(join(commandsDir, `${name}.md`))) fail(`dry-run wrote command ${name}.md`);
    }
    ok('dry-run performs no writes');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function testUpdateFromOlderFixture() {
  const fixture = mkdtempSync(join(tmpdir(), 'pinpoint-update-'));
  const skillDir = join(fixture, '.agents', 'skills', 'pinpoint');
  try {
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), 'old version\n', 'utf8');
    writeFileSync(
      join(skillDir, '.pinpoint-source.json'),
      JSON.stringify({ source: repository }),
      'utf8',
    );
    const result = runInstaller(fixture, ['--agent', 'opencode', '--project']);
    if (result.status !== 0) {
      fail(`update from older owned fixture failed: ${(result.stdout + result.stderr).trim()}`);
      return;
    }
    const fresh = readFileSync(join(root, 'skills', 'pinpoint', 'SKILL.md'), 'utf8');
    if (readFileSync(join(skillDir, 'SKILL.md'), 'utf8') !== fresh) {
      fail('update from older owned fixture did not refresh the Skill');
    }
    ok('update replaces an older owned fixture');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function testConflictAtomicity() {
  const fixture = mkdtempSync(join(tmpdir(), 'pinpoint-conflict-'));
  try {
    const skillsDir = join(fixture, '.agents', 'skills');
    const commandsDir = join(fixture, '.opencode', 'commands');

    // Unowned skill destination must be rejected without modification.
    mkdirSync(join(skillsDir, 'pinpoint'), { recursive: true });
    writeFileSync(join(skillsDir, 'pinpoint', 'SKILL.md'), 'unowned\n', 'utf8');
    let result = runInstaller(fixture, ['--agent', 'opencode', '--project']);
    if (result.status === 0) fail('unowned Skill destination was not rejected');
    if (readFileSync(join(skillsDir, 'pinpoint', 'SKILL.md'), 'utf8') !== 'unowned\n') {
      fail('unowned Skill destination was modified');
    }
    ok('unowned Skill destination rejected without modification');

    // Unowned command destination must be rejected without modification.
    rmSync(join(skillsDir, 'pinpoint'), { recursive: true });
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'pinpoint.md'), 'unowned command\n', 'utf8');
    result = runInstaller(fixture, ['--agent', 'opencode', '--project']);
    if (result.status === 0) fail('unowned command destination was not rejected');
    if (readFileSync(join(commandsDir, 'pinpoint.md'), 'utf8') !== 'unowned command\n') {
      fail('unowned command destination was modified');
    }
    if (existsSync(join(skillsDir, 'pinpoint'))) fail('partial install happened after command conflict');
    ok('unowned command destination rejected atomically (no skills written)');

    // Foreign-source ownership marker must be rejected.
    rmSync(join(commandsDir, 'pinpoint.md'), { recursive: true });
    mkdirSync(join(skillsDir, 'pinpoint'), { recursive: true });
    writeFileSync(join(skillsDir, 'pinpoint', 'SKILL.md'), 'foreign\n', 'utf8');
    writeFileSync(join(skillsDir, 'pinpoint', '.pinpoint-source.json'), JSON.stringify({ source: 'someone/else' }), 'utf8');
    result = runInstaller(fixture, ['--agent', 'opencode', '--project']);
    if (result.status === 0) fail('foreign-source Skill was not rejected');
    ok('foreign-source ownership marker rejected');

    // Malformed ownership marker must be rejected.
    writeFileSync(join(skillsDir, 'pinpoint', '.pinpoint-source.json'), '{broken', 'utf8');
    result = runInstaller(fixture, ['--agent', 'opencode', '--project']);
    if (result.status === 0) fail('malformed ownership marker was not rejected');
    ok('malformed ownership marker rejected');

    // Mixed state: some owned, one unowned — reject everything, change nothing.
    rmSync(join(skillsDir, 'pinpoint'), { recursive: true, force: true });
    for (const name of ['pinpoint', 'pinpoint-review']) {
      const dir = join(skillsDir, name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'SKILL.md'), 'owned\n', 'utf8');
      writeFileSync(join(dir, '.pinpoint-source.json'), JSON.stringify({ source: repository }), 'utf8');
    }
    mkdirSync(join(skillsDir, 'pinpoint-commit'), { recursive: true });
    writeFileSync(join(skillsDir, 'pinpoint-commit', 'SKILL.md'), 'unowned\n', 'utf8');
    const before = JSON.stringify({
      skills: existsSync(skillsDir) ? readdirSync(skillsDir).sort() : [],
      commands: existsSync(commandsDir) ? readdirSync(commandsDir).sort() : [],
    });
    result = runInstaller(fixture, ['--agent', 'opencode', '--project']);
    if (result.status === 0) fail('mixed owned/unowned state was not rejected');
    if (readFileSync(join(skillsDir, 'pinpoint', 'SKILL.md'), 'utf8') !== 'owned\n') {
      fail('owned Skill was modified by a failed install');
    }
    if (readFileSync(join(skillsDir, 'pinpoint-commit', 'SKILL.md'), 'utf8') !== 'unowned\n') {
      fail('unowned Skill was modified by a failed install');
    }
    const after = JSON.stringify({
      skills: readdirSync(skillsDir).sort(),
      commands: existsSync(commandsDir) ? readdirSync(commandsDir).sort() : [],
    });
    if (after !== before) fail('filesystem changed across the failed-install sequence');
    ok('mixed-state conflict rejected atomically; filesystem unchanged');

    // Partial prior install is repaired, not refused.
    for (const name of ['pinpoint-review', 'pinpoint-commit']) {
      rmSync(join(skillsDir, name), { recursive: true, force: true });
    }
    result = runInstaller(fixture, ['--agent', 'opencode', '--project']);
    if (result.status !== 0) {
      fail(`partial-state repair install failed: ${(result.stdout + result.stderr).trim()}`);
    } else {
      assertInstalled(fixture, 'opencode');
      ok('partial prior install is repaired');
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function testUnrelatedFilesPreserved() {
  const fixture = mkdtempSync(join(tmpdir(), 'pinpoint-preserve-'));
  try {
    const skillsDir = join(fixture, '.agents', 'skills');
    mkdirSync(join(skillsDir, 'other-skill'), { recursive: true });
    writeFileSync(join(skillsDir, 'other-skill', 'SKILL.md'), 'sibling\n', 'utf8');
    writeFileSync(join(fixture, 'notes.txt'), 'keep me\n', 'utf8');
    const result = runInstaller(fixture, ['--agent', 'opencode', '--project']);
    if (result.status !== 0) {
      fail(`install with sibling skill failed: ${(result.stdout + result.stderr).trim()}`);
      return;
    }
    if (readFileSync(join(skillsDir, 'other-skill', 'SKILL.md'), 'utf8') !== 'sibling\n') {
      fail('sibling Skill in shared directory was modified');
    }
    const uninstall = runInstaller(fixture, ['--agent', 'opencode', '--project', '--uninstall']);
    if (uninstall.status !== 0) {
      fail(`uninstall with sibling skill failed: ${(uninstall.stdout + uninstall.stderr).trim()}`);
      return;
    }
    if (!existsSync(join(skillsDir, 'other-skill', 'SKILL.md'))) {
      fail('uninstall removed a sibling Skill');
    }
    if (!existsSync(join(fixture, 'notes.txt'))) fail('uninstall removed an unrelated file');
    ok('unrelated files and sibling Skills survive install and uninstall');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

runMatrix();
testDryRun();
testUpdateFromOlderFixture();
testConflictAtomicity();
testUnrelatedFilesPreserved();

if (failures > 0) {
  console.error(`Installer smoke test: ${failures} failure(s)`);
  process.exitCode = 1;
} else {
  console.log(`Installer smoke test passed on ${process.platform}`);
}
