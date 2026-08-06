'use strict';

// Scenario 12 deterministic checks. Default mode verifies a materialized
// fixture's integrity (traps present, decoys documented, blocker reachable).
// usage: node checks.cjs <materialized-fixture-dir>

const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');

const dir = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !existsSync(dir)) {
  console.error('usage: node checks.cjs <materialized-fixture-dir>');
  process.exit(1);
}

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`check: ${message}`);
};

const git = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
const onBranch = (branch, file) => git(['show', `${branch}:${file}`]);

for (const branch of ['main', 'fix/export-total']) {
  try {
    git(['rev-parse', '--verify', branch]);
  } catch {
    fail(`branch ${branch} missing`);
  }
}

if (!existsSync(join(dir, 'node_modules', 'eslint'))) {
  fail('eslint not installed; run setup.cjs (it runs npm ci)');
} else {
  let lintOut;
  try {
    lintOut = execFileSync('npx', ['eslint', '--format', 'json'], { cwd: dir, encoding: 'utf8' });
  } catch (error) {
    lintOut = error.stdout;
  }
  const rules = JSON.parse(lintOut)
    .flatMap((f) => f.messages.map((m) => m.ruleId))
    .sort();
  if (JSON.stringify(rules) !== JSON.stringify(['eqeqeq', 'no-unused-vars'])) {
    fail(`eslint must flag exactly eqeqeq + no-unused-vars on the branch, got: ${rules.join(',') || 'none'}`);
  }
}

const branchExport = onBranch('fix/export-total', 'src/export.js');
const branchSettings = onBranch('fix/export-total', 'src/settings.js');
if (!/cache\.locale\s*==\s*settings\.locale/.test(branchExport)) {
  fail('branch cache key must compare locale (the reviewed fix)');
}
if (/cache\.(currency)/.test(branchExport)) {
  fail('planted blocker missing: branch cache key must NOT include currency');
}
if (!/settings\.currency/.test(branchExport)) {
  fail('export.js report building must depend on settings.currency (blocker reachability)');
}
if (!/next\.currency/.test(branchSettings)) {
  fail('settings.js applySettings must accept currency changes (settings path in context)');
}

const contributing = readFileSync(join(dir, 'CONTRIBUTING.md'), 'utf8');
if (!/single-line per cell/.test(contributing)) fail('csv decoy contract not documented');
if (!/fire-and-forget/.test(contributing)) fail('notify decoy contract not documented');

const importGraph = ['src/export.js', 'src/router.js', 'src/settings.js', 'src/index.js']
  .filter((f) => existsSync(join(dir, f)))
  .map((f) => readFileSync(join(dir, f), 'utf8'))
  .join('\n');
if (/require\(['"]\.\/preview/.test(importGraph)) {
  fail('preview.js must stay unreachable from the export path');
}

if (failures > 0) {
  console.error(`check: ${failures} integrity failure(s)`);
  process.exit(1);
}
console.log('check: fixture integrity OK (blocker planted, decoys documented, lint traps exact)');
