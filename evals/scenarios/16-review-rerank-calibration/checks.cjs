'use strict';

// Scenario 16 deterministic checks: gate expectations plus every planted
// item of the re-rank ground truth inventory must be present.
// usage: node checks.cjs <materialized-fixture-dir>

const { existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

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
const requireMatch = (label, text, pattern) => {
  if (!pattern.test(text)) fail(label);
};

const git = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
const onBranch = (file) => git(['show', `feat/batch-discounts:${file}`]);

const run = spawnSync('npm', ['test', '--silent'], { cwd: dir, encoding: 'utf8' });
if (run.status !== 0) {
  fail(`branch tests must pass (defects are untested, not test-failing), got exit ${run.status}`);
}

const pager = onBranch('src/pager.js');
const pricing = onBranch('src/pricing.js');
const stock = onBranch('src/stock.js');
const events = onBranch('src/events.js');
const format = onBranch('src/format.js');
const batch = onBranch('src/batch.js');

requireMatch('T1 pageWindow must drop the last row of each page', pager, /slice\(start, start \+ size - 1\)/);
requireMatch('T2 batchTotal must discount the post-member amount (convention says original subtotal)', pricing, /memberPrice \* \(1 - QTY_DISCOUNT_PCT\)/);
requireMatch('T2 convention: discounts multiply the ORIGINAL subtotal', pricing, /discounts multiply the ORIGINAL subtotal/);
requireMatch('T3 releaseBatch must create phantom stock for unknown skus', stock, /stock\.set\(sku, \(stock\.get\(sku\) \?\? 0\) \+ 1\)/);
requireMatch('U1 runBatch must register a completion listener per call', batch, /onBatchComplete\(\(summary\) => summary\)/);
requireMatch('F1 bait: pageCount must use the floor ceiling formula (provably correct)', pager, /Math\.floor\(\(total \+ size - 1\) \/ size\)/);
requireMatch('F2 bait: addFeeRate must copy before pushing (provably safe)', pricing, /const rates = \[\.\.\.config\.rates\]/);
requireMatch('F3 bait: renderLabel must be dead code with new Function', format, /new Function/);

// F3 must actually be dead: no caller anywhere in src or test.
const callers = git(['grep', '-l', 'renderLabel', '--', 'src/', 'test/']);
if (callers !== 'src/format.js') {
  fail(`F3 renderLabel must be defined but never called, callers: ${callers}`);
}

// D1: eslint must flag exactly eqeqeq + no-unused-vars on the branch, on batch.js only.
let lintOut = '';
try {
  lintOut = execFileSync('npx', ['eslint', '--format', 'json'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
} catch (error) {
  lintOut = error.stdout ?? '';
}
const rules = new Set();
const files = new Set();
for (const result of JSON.parse(lintOut)) {
  for (const message of result.messages) {
    if (message.ruleId) rules.add(message.ruleId);
    if (message.ruleId) files.add(result.filePath.split('/src/')[1]);
  }
}
const rulesList = [...rules].sort().join(',');
if (rulesList !== 'eqeqeq,no-unused-vars') {
  fail(`D1 eslint must flag exactly eqeqeq + no-unused-vars, got: ${rulesList || 'none'}`);
}
if (files.size !== 1 || !files.has('batch.js')) {
  fail(`D1 eslint findings must be confined to src/batch.js, got: ${[...files].join(',')}`);
}

// OQ material: the threshold comparison must exist (inclusivity intent undocumented).
requireMatch('OQ batch threshold comparison must exist', batch, /skus\.length == BATCH_MIN_QTY \|\| skus\.length > BATCH_MIN_QTY/);

const newTests = git(['diff', '--name-only', 'main', 'feat/batch-discounts', '--', 'test/']);
if (newTests !== '') fail(`SF: branch must add NO test files, got: ${newTests}`);

if (failures > 0) {
  console.error(`check: ${failures} integrity failure(s)`);
  process.exit(1);
}
console.log('check: fixture integrity OK (T1-T3, U1, F1-F3 baits, D1 tooling pair, OQ, SF all planted)');
