'use strict';

// Scenario 14 deterministic checks: per-variant fixture integrity.
// Verifies each variant's expected gate status (main vs branch) and the
// planted traps that the rubric scores against.
// usage: node checks.cjs <materialized-root>   (the dir containing v1..v7)

const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !existsSync(root)) {
  console.error('usage: node checks.cjs <materialized-root>');
  process.exit(1);
}

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`check: ${message}`);
};

const git = (dir, args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
const testExit = (dir, ref) => {
  const work = spawnSync('git', ['worktree', 'add', '-q', '--detach', join(dir, '.check-wt'), ref], { cwd: dir });
  if (work.status !== 0) {
    fail(`${dir}: cannot create check worktree for ${ref}`);
    return null;
  }
  const run = spawnSync('npm', ['test', '--silent'], { cwd: join(dir, '.check-wt'), encoding: 'utf8' });
  spawnSync('git', ['worktree', 'remove', '--force', '.check-wt'], { cwd: dir });
  return run.status;
};
const onBranch = (dir, branch, file) => git(dir, ['show', `${branch}:${file}`]);

const expect = [
  // [variant, branch, mainTestExit, branchTestExit, trapChecks]
  ['v1', 'fix/restock-alert', 0, 0, (dir, b) => {
    if (!/<=\s*threshold/.test(onBranch(dir, b, 'src/inventory.js'))) fail('v1: restockNeeded must be fixed to <=');
    if (!/getLevel\(sku\)\s*<\s*DEFAULT_RESTOCK_THRESHOLD/.test(onBranch(dir, b, 'src/report.js'))) {
      fail('v1: planted blocker missing — restockReport must still use <');
    }
  }],
  ['v2', 'chore/order-errors', 0, 0, (dir, b) => {
    const orders = onBranch(dir, b, 'src/orders.js');
    if (!/Writer contract: synchronous/.test(orders)) {
      fail('v2: sync-writer contract note missing (variant would be ambiguous)');
    }
    if (!/catch/.test(orders) || !/ok:\s*true,\s*saved:\s*false/.test(orders)) {
      fail('v2: swallowed-error contract missing in orders.js');
    }
  }],
  ['v3', 'refactor/pricing-cleanup', 0, 0, (dir, b) => {
    if (!/MINOR_UNITS/.test(onBranch(dir, b, 'src/pricing.js'))) fail('v3: MINOR_UNITS extraction missing');
  }],
  ['v4', 'feat/bulk-discount', 0, 0, (dir, b) => {
    const pricing = onBranch(dir, b, 'src/pricing.js');
    if (!/totalWithBulkDiscount/.test(pricing)) fail('v4: totalWithBulkDiscount missing');
    if (/total\s*\*\s*0\.95/.test(pricing)) {
      fail('v4: discount must be applied in cents (float-dollar discount would be a real defect)');
    }
    if (!/roundHalfUp\(cents \* 0\.95\)/.test(pricing)) {
      fail('v4: cents-level discounted rounding missing');
    }
    if (!/totalWithBulkDiscount/.test(onBranch(dir, b, 'src/report.js'))) {
      fail('v4: feature must be wired into dailySummary (unwired features invite true findings)');
    }
    if (!/qty: 5/.test(onBranch(dir, b, 'test/pricing.test.js'))) {
      fail('v4: multi-line aggregation test missing');
    }
  }],
  ['v5', 'fix/price-rounding', 0, 1, (dir, b) => {
    if (!/roundHalfEven/.test(onBranch(dir, b, 'src/pricing.js'))) fail('v5: rounding change missing');
  }],
  ['v6', 'feat/remote-sync', 0, 0, (dir, b) => {
    if (!/skip:\s*!process\.env\.INVENTORY_SYNC_URL/.test(onBranch(dir, b, 'test/sync.test.js'))) {
      fail('v6: env-gated skip missing — verification must be inconclusive');
    }
  }],
  ['v7', 'docs/contributing-guide', 1, 1, (dir, b) => {
    const diff = git(dir, ['diff', '--name-only', 'main', b]);
    if (diff !== 'CONTRIBUTING.md') fail(`v7: branch must touch only CONTRIBUTING.md, got: ${diff}`);
  }],
];

for (const [id, branch, mainExit, branchExit, trap] of expect) {
  const dir = join(root, id);
  if (!existsSync(dir)) {
    fail(`${id}: missing`);
    continue;
  }
  const gotMain = testExit(dir, 'main');
  const gotBranch = testExit(dir, branch);
  if (gotMain !== mainExit) fail(`${id}: main test exit must be ${mainExit}, got ${gotMain}`);
  if (gotBranch !== branchExit) fail(`${id}: branch test exit must be ${branchExit}, got ${gotBranch}`);
  trap(dir, branch);
}

if (failures > 0) {
  console.error(`check: ${failures} integrity failure(s)`);
  process.exit(1);
}
console.log('check: all 7 variants OK (gate expectations + planted traps verified)');
