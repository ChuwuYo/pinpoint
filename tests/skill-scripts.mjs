import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotScript = join(root, 'skills', 'pinpoint-review', 'scripts', 'snapshot-state.mjs');
const commitScript = join(root, 'skills', 'pinpoint-deliver', 'scripts', 'inspect-commit-state.mjs');
const prScript = join(root, 'skills', 'pinpoint-deliver', 'scripts', 'inspect-pr-topology.mjs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runNode(scriptPath, args, cwd = root) {
  return spawnSync('node', [scriptPath, ...args], { cwd, encoding: 'utf8' });
}

function runGit(args, cwd) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert(res.status === 0, `git ${args.join(' ')} failed: ${res.stderr}`);
  return (res.stdout ?? '').trim();
}

for (const script of [snapshotScript, commitScript, prScript]) {
  const help = runNode(script, ['--help']);
  assert(help.status === 0 && help.stdout.includes('Usage:'), `--help failed for ${script}`);
}

const repo = mkdtempSync(join(tmpdir(), 'pinpoint-scripts-'));
let defaultSnapshotPath = null;

try {
  runGit(['init'], repo);
  runGit(['config', 'user.name', 'Test'], repo);
  runGit(['config', 'user.email', 'test@example.com'], repo);

  mkdirSync(join(repo, 'src'), { recursive: true });
  writeFileSync(join(repo, 'src', 'app.txt'), 'v1\n', 'utf8');
  runGit(['add', 'src/app.txt'], repo);
  runGit(['commit', '-m', 'init'], repo);

  const subCwd = join(repo, 'sub', 'nested');
  mkdirSync(subCwd, { recursive: true });
  mkdirSync(join(repo, '.husky'), { recursive: true });
  mkdirSync(join(repo, '.github'), { recursive: true });

  writeFileSync(join(repo, 'src', 'app.txt'), 'v2\n', 'utf8');
  writeFileSync(join(repo, '.env.local'), 'SECRET=1\n', 'utf8');
  writeFileSync(join(repo, '.husky', 'commit-msg'), '#!/bin/sh\n', 'utf8');
  writeFileSync(join(repo, '.github', 'pull_request_template.md'), '## Summary\n', 'utf8');

  const snap = runNode(snapshotScript, ['--snapshot'], subCwd);
  assert(snap.status === 0, `snapshot-state --snapshot failed: ${snap.stderr}`);
  const snapOut = JSON.parse(snap.stdout);
  defaultSnapshotPath = snapOut.snapshotFile;
  assert(defaultSnapshotPath && existsSync(defaultSnapshotPath), 'default snapshot file missing');
  const snapData = JSON.parse(readFileSync(defaultSnapshotPath, 'utf8'));
  assert(/^[a-f0-9]{64}$/.test(snapData.files['src/app.txt'] ?? ''), 'subdirectory snapshot hashed file as null');

  const verifyClean = runNode(snapshotScript, ['--verify'], subCwd);
  assert(verifyClean.status === 0, `snapshot-state --verify failed: ${verifyClean.stderr}`);
  const cleanOut = JSON.parse(verifyClean.stdout);
  assert(cleanOut.readOnlyVerified === true && cleanOut.mutations.length === 0, 'clean verify reported mutations');

  writeFileSync(join(repo, 'src', 'app.txt'), 'v3\n', 'utf8');
  const verifyDirty = runNode(snapshotScript, ['--verify'], subCwd);
  assert(verifyDirty.status === 1, 'dirty verify did not exit 1');
  const dirtyOut = JSON.parse(verifyDirty.stdout);
  assert(
    dirtyOut.readOnlyVerified === false && dirtyOut.mutations.some((m) => m.includes('src/app.txt')),
    'dirty verify did not report src/app.txt mutation',
  );

  const commitRes = runNode(commitScript, [], subCwd);
  assert(commitRes.status === 0, `inspect-commit-state failed: ${commitRes.stderr}`);
  const commitOut = JSON.parse(commitRes.stdout);
  assert(commitOut.counts?.unstaged >= 1, 'inspect-commit-state missed unstaged change');
  assert(commitOut.secretHazards?.includes('.env.local'), 'inspect-commit-state missed .env.local');
  assert(commitOut.commitValidators?.includes('.husky/commit-msg'), 'inspect-commit-state missed .husky/commit-msg');

  const prRes = runNode(prScript, [], subCwd);
  assert(prRes.status === 0, `inspect-pr-topology failed: ${prRes.stderr}`);
  const prOut = JSON.parse(prRes.stdout);
  assert(Boolean(prOut.currentBranch), 'inspect-pr-topology missed currentBranch');
  assert(prOut.worktreeClean === false, 'inspect-pr-topology missed dirty worktree');
  assert(prOut.prTemplates?.includes('.github/pull_request_template.md'), 'inspect-pr-topology missed PR template');
} finally {
  rmSync(repo, { recursive: true, force: true });
  if (defaultSnapshotPath) rmSync(defaultSnapshotPath, { force: true });
}

console.log(`Skill scripts smoke test passed on ${process.platform}`);
