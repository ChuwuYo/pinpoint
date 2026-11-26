#!/usr/bin/env node

/**
 * Deterministic read-only preflight and mutation detector for pinpoint-review.
 *
 * Usage:
 *   node scripts/snapshot-state.mjs --snapshot <file> [--base <ref>] [--range <range>]
 *   node scripts/snapshot-state.mjs --verify <file>
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function runGit(args) {
  const res = spawnSync('git', args, { encoding: 'utf8' });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    stdout: (res.stdout ?? '').trimEnd(),
    stderr: (res.stderr ?? '').trimEnd(),
  };
}

function hashFile(filePath) {
  const abs = resolve(filePath);
  if (!existsSync(abs)) return null;
  const st = statSync(abs);
  if (!st.isFile()) return `nonfile:${st.mode}`;
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

function captureState() {
  const top = runGit(['rev-parse', '--show-toplevel']);
  if (!top.ok) {
    throw new Error(`Not inside a git repository: ${top.stderr || 'git rev-parse failed'}`);
  }
  const head = runGit(['rev-parse', '--verify', 'HEAD']);
  const status = runGit(['status', '--porcelain=v1', '-uall']);
  const stagedDiff = runGit(['diff', '--cached', '--raw']);
  const unstagedDiff = runGit(['diff', '--raw']);

  const files = {};
  const lines = status.stdout ? status.stdout.split('\n') : [];
  for (const line of lines) {
    if (line.length < 4) continue;
    let filePath = line.slice(3).trim();
    if (filePath.includes(' -> ')) {
      filePath = filePath.split(' -> ').pop().trim();
    }
    if (filePath.startsWith('"') && filePath.endsWith('"')) {
      filePath = filePath.slice(1, -1);
    }
    files[filePath] = hashFile(filePath);
  }

  return {
    root: top.stdout,
    head: head.ok ? head.stdout : null,
    status: status.stdout,
    stagedHash: createHash('sha256').update(stagedDiff.stdout).digest('hex'),
    unstagedHash: createHash('sha256').update(unstagedDiff.stdout).digest('hex'),
    files,
  };
}

function preflightDiff(base, range) {
  let diffCmd;
  if (range) {
    diffCmd = ['diff', '--stat', range];
  } else if (base) {
    const verifyBase = runGit(['rev-parse', '--verify', base]);
    if (!verifyBase.ok) {
      return { ok: false, error: `Base ref does not resolve: ${base}` };
    }
    diffCmd = ['diff', '--stat', `${base}...HEAD`];
  } else {
    const unstaged = runGit(['diff', '--stat']);
    const staged = runGit(['diff', '--cached', '--stat']);
    const combined = [staged.stdout, unstaged.stdout].filter(Boolean).join('\n');
    if (!combined) {
      return { ok: false, error: 'Diff is empty (no staged or unstaged changes; pass --base or --range to review committed changes).' };
    }
    return { ok: true, scope: 'worktree (staged + unstaged)', summary: combined };
  }

  const res = runGit(diffCmd);
  if (!res.ok) {
    return { ok: false, error: `Diff command failed (git ${diffCmd.join(' ')}): ${res.stderr}` };
  }
  if (!res.stdout.trim()) {
    return { ok: false, error: `Diff is empty for git ${diffCmd.join(' ')}` };
  }
  return { ok: true, scope: range || `${base}...HEAD`, summary: res.stdout };
}

function parseArgs(argv) {
  const opts = { snapshot: null, verify: null, base: null, range: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--snapshot') opts.snapshot = argv[++i] ?? null;
    else if (arg === '--verify') opts.verify = argv[++i] ?? null;
    else if (arg === '--base') opts.base = argv[++i] ?? null;
    else if (arg === '--range') opts.range = argv[++i] ?? null;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.snapshot) {
    const state = captureState();
    const diff = preflightDiff(opts.base, opts.range);
    writeFileSync(opts.snapshot, JSON.stringify(state, null, 2), 'utf8');
    console.log(JSON.stringify({ mode: 'snapshot', snapshotFile: opts.snapshot, head: state.head, diff }, null, 2));
    if (!diff.ok) process.exitCode = 2;
  } else if (opts.verify) {
    const before = JSON.parse(readFileSync(opts.verify, 'utf8'));
    const after = captureState();
    const mutations = [];
    if (before.head !== after.head) mutations.push(`HEAD changed: ${before.head} -> ${after.head}`);
    if (before.status !== after.status) mutations.push('git status changed during review');
    if (before.stagedHash !== after.stagedHash) mutations.push('staged index changed during review');
    if (before.unstagedHash !== after.unstagedHash) mutations.push('unstaged diff changed during review');
    const allKeys = new Set([...Object.keys(before.files), ...Object.keys(after.files)]);
    for (const k of allKeys) {
      if (before.files[k] !== after.files[k]) {
        mutations.push(`file content changed: ${k}`);
      }
    }
    const clean = mutations.length === 0;
    console.log(JSON.stringify({ mode: 'verify', readOnlyVerified: clean, mutations }, null, 2));
    if (!clean) process.exitCode = 1;
  } else {
    console.error('Usage: snapshot-state.mjs --snapshot <file> [--base <ref>] [--range <range>] | --verify <file>');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`snapshot-state: ${error.message}`);
  process.exitCode = 1;
}
