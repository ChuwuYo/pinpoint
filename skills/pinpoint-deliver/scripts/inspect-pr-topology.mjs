#!/usr/bin/env node

/**
 * Deterministic read-only branch and PR topology inspector for pinpoint-deliver.
 * Read-only: never fetches, pushes, or modifies repository state.
 *
 * Usage:
 *   node scripts/inspect-pr-topology.mjs [--base <ref>]
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function runGit(args) {
  const res = spawnSync('git', args, { encoding: 'utf8' });
  return {
    ok: res.status === 0,
    stdout: (res.stdout ?? '').trimEnd(),
    stderr: (res.stderr ?? '').trimEnd(),
  };
}

function usage() {
  console.log('Usage: inspect-pr-topology.mjs [--base <ref>]');
}

function parseBaseArg(argv) {
  const idx = argv.indexOf('--base');
  return idx !== -1 ? argv[idx + 1] ?? null : null;
}

function detectDefaultBase(explicitBase) {
  if (explicitBase) return explicitBase;
  const candidates = [
    'refs/remotes/upstream/HEAD',
    'refs/remotes/origin/HEAD',
    'upstream/main',
    'origin/main',
    'main',
    'master',
  ];
  for (const ref of candidates) {
    const sym = runGit(['symbolic-ref', '--short', ref]);
    if (sym.ok && sym.stdout) return sym.stdout;
    const rev = runGit(['rev-parse', '--verify', ref]);
    if (rev.ok) return ref;
  }
  return null;
}

function findPrTemplates(root) {
  const candidates = [
    '.github/pull_request_template.md',
    '.github/PULL_REQUEST_TEMPLATE.md',
    'docs/pull_request_template.md',
    'PULL_REQUEST_TEMPLATE.md',
  ];
  return candidates.filter((rel) => existsSync(join(root, rel)));
}

try {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    usage();
    process.exit(0);
  }

  const top = runGit(['rev-parse', '--show-toplevel']);
  if (!top.ok) {
    throw new Error(`Not inside a git repository: ${top.stderr || 'git rev-parse failed'}`);
  }

  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const remotes = runGit(['remote', '-v']);
  const status = runGit(['status', '--porcelain=v1']);
  const base = detectDefaultBase(parseBaseArg(process.argv.slice(2)));

  let aheadBehind = null;
  let commits = [];
  let diffStat = null;
  if (base) {
    const ab = runGit(['rev-list', '--left-right', '--count', `${base}...HEAD`]);
    if (ab.ok && ab.stdout) {
      const [behind, ahead] = ab.stdout.split(/\s+/).map((n) => Number.parseInt(n, 10));
      aheadBehind = { behind, ahead };
    }
    const log = runGit(['log', '--oneline', `${base}..HEAD`]);
    if (log.ok && log.stdout) commits = log.stdout.split('\n');
    const stat = runGit(['diff', '--stat', `${base}...HEAD`]);
    if (stat.ok) diffStat = stat.stdout || null;
  }

  const report = {
    root: top.stdout,
    currentBranch: branch.ok ? branch.stdout : null,
    upstreamTracking: upstream.ok ? upstream.stdout : null,
    detectedBase: base,
    aheadBehindBase: aheadBehind,
    worktreeClean: !status.stdout.trim(),
    remotes: remotes.ok && remotes.stdout ? remotes.stdout.split('\n') : [],
    prTemplates: findPrTemplates(top.stdout),
    commitsSinceBase: commits,
    diffStat,
  };

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(`inspect-pr-topology: ${error.message}`);
  process.exitCode = 1;
}
