'use strict';

// Materialize the scenario 12 fixture into a target directory: a git
// repository whose main branch has the stale-total bug and whose
// fix/export-total branch carries the locale-keyed cache fix.
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
const gitEnv = ['-c', 'user.name=eval', '-c', 'user.email=eval@localhost'];

cpSync(join(src, 'main'), target, { recursive: true });
git(['init', '-q', '-b', 'main']);
git(['add', '-A']);
git([...gitEnv, 'commit', '-qm', 'feat: report export service']);

git(['checkout', '-qb', 'fix/export-total']);
cpSync(join(src, 'branch'), target, { recursive: true });
git(['add', '-A']);
git([...gitEnv, 'commit', '-qm', 'fix(export): invalidate report cache on locale change']);

execFileSync('npm', ['ci', '--silent', '--no-audit', '--no-fund'], { cwd: target, stdio: 'pipe' });

const main = git(['rev-parse', 'main']).toString().trim();
const branch = git(['rev-parse', 'fix/export-total']).toString().trim();
console.log(`fixture ready at ${target}`);
console.log(`main=${main}`);
console.log(`fix/export-total=${branch}`);
