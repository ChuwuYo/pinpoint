import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tar = process.platform === 'win32' ? 'tar.exe' : 'tar';
const skills = ['pinpoint', 'pinpoint-review', 'pinpoint-commit', 'pinpoint-pr', 'pinpoint-help'];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function ok(message) {
  console.log(`ok: ${message}`);
}

function pack() {
  const result = spawnSync(npm, ['pack', '--json'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`npm pack failed: ${result.stdout}${result.stderr}`);
  }
  const entries = JSON.parse(result.stdout);
  if (entries.length !== 1) throw new Error(`npm pack produced ${entries.length} tarballs`);
  const entry = entries[0];
  return { filename: entry.filename, version: entry.version };
}

function tarballEntries(tarball) {
  const result = spawnSync(tar, ['-tzf', tarball], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`tar -tzf failed: ${result.stdout}${result.stderr}`);
  }
  return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}

function runInstaller(cwd, args) {
  return spawnSync(
    npm,
    ['exec', '--yes', `--package=${tarballAbs}`, '--', 'pinpoint-install', ...args],
    { cwd, encoding: 'utf8', shell: process.platform === 'win32' },
  );
}

let tarballAbs = null;
const fixture = mkdtempSync(join(tmpdir(), 'pinpoint-package-'));
try {
  const { filename, version } = pack();
  tarballAbs = join(root, filename);
  const rootVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  if (version !== rootVersion) fail(`npm pack version ${version} != package.json ${rootVersion}`);
  ok(`npm pack produced ${filename} (version ${version})`);

  const entries = tarballEntries(tarballAbs);
  const entrySet = new Set(entries);

  const required = [
    'package/package.json',
    'package/bin/pinpoint-install.mjs',
    'package/INSTALL.md',
    'package/README.md',
    'package/LICENSE',
    ...skills.map((name) => `package/skills/${name}/SKILL.md`),
    ...skills.map((name) => `package/skills/${name}/.pinpoint-source.json`),
    ...skills.map((name) => `package/commands/${name}.md`),
  ];
  for (const file of required) {
    if (!entrySet.has(file)) fail(`tarball missing ${file}`);
  }
  ok(`tarball contains all ${skills.length} Skills, commands, installer, and docs`);

  const excluded = ['package/evals', 'package/docs', 'package/tests', 'package/.github', 'package/scripts'];
  for (const prefix of excluded) {
    const leaked = entries.filter((entry) => entry.startsWith(`${prefix}/`));
    if (leaked.length > 0) fail(`tarball leaks unintended path ${prefix}: ${leaked.join(', ')}`);
  }
  ok('tarball excludes fixtures, evaluation assets, tests, and CI files');

  const versionResult = runInstaller(fixture, ['--version']);
  if (versionResult.status !== 0) {
    fail(`--version from tarball failed: ${versionResult.stdout}${versionResult.stderr}`);
  } else if (versionResult.stdout.trim() !== rootVersion) {
    fail(`--version from tarball (${versionResult.stdout.trim()}) != package version (${rootVersion})`);
  }
  ok('packaged entrypoint --version matches package.json');

  const check = runInstaller(fixture, ['--check']);
  if (check.status !== 0) {
    fail(`--check from tarball failed: ${check.stdout}${check.stderr}`);
  }
  ok('packaged --check passes');

  const install = runInstaller(fixture, ['--agent', 'opencode', '--project']);
  if (install.status !== 0) {
    fail(`install from tarball failed: ${install.stdout}${install.stderr}`);
  } else {
    for (const name of skills) {
      const path = join(fixture, '.agents', 'skills', name, 'SKILL.md');
      if (!existsSync(path)) fail(`install from tarball did not create ${name}/SKILL.md`);
      const ownership = join(fixture, '.agents', 'skills', name, '.pinpoint-source.json');
      if (!existsSync(ownership)) fail(`install from tarball missing ownership marker for ${name}`);
      const command = join(fixture, '.opencode', 'commands', `${name}.md`);
      if (!existsSync(command)) fail(`install from tarball did not create command ${name}.md`);
    }
    ok('install from the published tarball shape installs all five Skills and commands');
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
  if (tarballAbs && existsSync(tarballAbs)) rmSync(tarballAbs, { force: true });
}

if (failures > 0) {
  console.error(`Package smoke test: ${failures} failure(s)`);
  process.exitCode = 1;
} else {
  console.log(`Package smoke test passed on ${process.platform}`);
}
