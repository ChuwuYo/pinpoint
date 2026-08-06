'use strict';

// Materialize the scenario 16 fixture: a git repo whose feat/batch-discounts
// branch carries true actionable findings (T1-T3), a true finding whose fix
// is unknown (U1), plausible false positives (F1-F3), tooling-enforced
// diagnostics (D1), and open-question material — for re-rank gate calibration.
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
git([...gitEnv, 'commit', '-qm', 'feat: catalog service']);

git(['checkout', '-qb', 'feat/batch-discounts']);
cpSync(join(src, 'branch'), target, { recursive: true });
git(['add', '-A']);
git([...gitEnv, 'commit', '-qm', 'feat(catalog): batch discounts with review windows and completion hooks']);

execFileSync('npm', ['ci', '--silent', '--no-audit', '--no-fund'], { cwd: target, stdio: 'pipe' });

console.log(`main=${git(['rev-parse', 'main']).toString().trim()}`);
console.log(`feat/batch-discounts=${git(['rev-parse', 'feat/batch-discounts']).toString().trim()}`);
