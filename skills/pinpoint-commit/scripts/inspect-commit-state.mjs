#!/usr/bin/env node

/**
 * Deterministic pre-staging repository inspector for pinpoint-commit.
 * Read-only: never modifies repository state.
 *
 * Usage:
 *   node scripts/inspect-commit-state.mjs [--log-count 10]
 */

import { spawnSync } from 'node:child_process';

function runGit(args) {
  const res = spawnSync('git', args, { encoding: 'utf8' });
  return {
    ok: res.status === 0,
    stdout: (res.stdout ?? '').trimEnd(),
    stderr: (res.stderr ?? '').trimEnd(),
  };
}

const SECRET_PATTERNS = [
  /(^|\/)\.env(\.|$)/i,
  /\.(pem|key|p12|pfx|jks|keystore)$/i,
  /(^|\/)(id_rsa|id_ed25519|credentials\.json|secrets?\.(json|ya?ml|toml))$/i,
];

function isPotentialSecret(path) {
  return SECRET_PATTERNS.some((re) => re.test(path));
}

function parseLogCount(argv) {
  const idx = argv.indexOf('--log-count');
  if (idx === -1) return 10;
  const parsed = Number.parseInt(argv[idx + 1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 10;
}

try {
  const top = runGit(['rev-parse', '--show-toplevel']);
  if (!top.ok) {
    throw new Error(`Not inside a git repository: ${top.stderr || 'git rev-parse failed'}`);
  }

  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const status = runGit(['status', '--porcelain=v1', '-uall']);
  const stagedStat = runGit(['diff', '--cached', '--stat']);
  const unstagedStat = runGit(['diff', '--stat']);
  const worktrees = runGit(['worktree', 'list', '--porcelain']);
  const submodules = runGit(['submodule', 'status']);
  const logCount = parseLogCount(process.argv.slice(2));
  const recentCommits = runGit(['log', `-n${logCount}`, '--pretty=format:%h %s']);

  const staged = [];
  const unstaged = [];
  const untracked = [];
  const secretHazards = [];

  for (const line of status.stdout ? status.stdout.split('\n') : []) {
    if (line.length < 4) continue;
    const x = line[0];
    const y = line[1];
    const file = line.slice(3).trim();
    if (x === '?' && y === '?') {
      untracked.push(file);
    } else {
      if (x !== ' ') staged.push({ code: x, file });
      if (y !== ' ') unstaged.push({ code: y, file });
    }
    if (isPotentialSecret(file)) secretHazards.push(file);
  }

  const report = {
    root: top.stdout,
    branch: branch.ok ? branch.stdout : null,
    counts: {
      staged: staged.length,
      unstaged: unstaged.length,
      untracked: untracked.length,
    },
    staged,
    unstaged,
    untracked,
    secretHazards,
    stagedStat: stagedStat.stdout || null,
    unstagedStat: unstagedStat.stdout || null,
    worktreeCount: worktrees.ok ? worktrees.stdout.split('\n').filter((l) => l.startsWith('worktree ')).length : 1,
    hasSubmodules: Boolean(submodules.ok && submodules.stdout.trim()),
    recentCommits: recentCommits.ok && recentCommits.stdout ? recentCommits.stdout.split('\n') : [],
  };

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(`inspect-commit-state: ${error.message}`);
  process.exitCode = 1;
}
