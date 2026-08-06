'use strict';

// Materialize the scenario 15 fixture: a git repo whose feat/team-plans
// branch carries 7 independently reachable blockers across concern axes,
// one exact-duplicate pair, one shared-root/two-consequences pair, two
// should-fix findings, and one nit.
// usage: node setup.cjs <target-dir>

const { cpSync, existsSync, rmSync, mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');

const src = join(__dirname, 'fixture-src');
const target = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('usage: node setup.cjs <target-dir>');
  process.exit(1);
}

if (existsSync(target)) rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

const git = (args) => execFileSync('git', args, { cwd: target, stdio: 'pipe' });
const commit = (message) =>
  git(['-c', 'user.name=eval', '-c', 'user.email=eval@localhost', 'commit', '-qm', message]);

cpSync(join(src, 'base'), target, { recursive: true });
git(['init', '-q', '-b', 'main']);
git(['add', '-A']);
commit('feat: subscription service');

git(['checkout', '-qb', 'feat/team-plans']);
cpSync(join(src, 'branch'), target, { recursive: true });
git(['add', '-A']);
commit('feat(teams): team plans with seats, proration, and trial notices');

console.log(`main=${git(['rev-parse', 'main']).toString().trim()}`);
console.log(`feat/team-plans=${git(['rev-parse', 'feat/team-plans']).toString().trim()}`);
