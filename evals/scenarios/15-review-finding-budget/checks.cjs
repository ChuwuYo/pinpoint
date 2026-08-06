'use strict';

// Scenario 15 deterministic checks: gate expectations plus every planted
// blocker / duplicate / shared-root / lower-severity trap must be present.
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
const onBranch = (file) => git(['show', `feat/team-plans:${file}`]);

const run = spawnSync('npm', ['test', '--silent'], { cwd: dir, encoding: 'utf8' });
if (run.status !== 0) {
  fail(`branch tests must pass (defects are untested, not test-failing), got exit ${run.status}`);
}

const teams = onBranch('src/teams.js');
const billing = onBranch('src/billing.js');
const notify = onBranch('src/notify.js');

requireMatch('B1 proration must use fixed 30-day month', billing, /priceCents\s*\/\s*30/);
requireMatch('B1 contract: proration convention must be documented as per-calendar-day', billing, /per actual calendar day/);
requireMatch('B2 member lookup must interpolate teamName into SQL', teams, /WHERE teamId = '\$\{teamName\}'/);

// B2 must be executable against the stand-in (rev 4): a tautology injection
// through findMembers returns ALL member rows, not the filtered set.
const inject = spawnSync('node', ['-e', `
  const db = require('./src/db');
  const teams = require('./src/teams');
  teams.createTeam('t1', 'Alpha', 'u1');
  teams.createTeam('t2', 'Beta', 'u2');
  db.put('members', 'u1', { teamId: 't1', userId: 'u1' });
  db.put('members', 'u2', { teamId: 't2', userId: 'u2' });
  const leaked = teams.findMembers("t1' OR '1'='1");
  if (leaked.length !== 2) { console.error('no leak: ' + JSON.stringify(leaked)); process.exit(1); }
`], { cwd: dir, encoding: 'utf8' });
if (inject.status !== 0) {
  fail(`B2 tautology injection must leak all member rows against the stand-in: ${inject.stderr.trim()}`);
}
requireMatch('B3 removeTeam must delete members before team without a transaction', teams, /db\.remove\('members'[\s\S]*db\.remove\('teams'/);
requireMatch('B4 renewal must round after tax (diverges from checkout)', billing, /const taxed = Math\.round\(subtotalCents \* \(1 \+ taxPct\)\);\s*return taxed \* \(1 - discountPct\)/);
requireMatch('B5 addMember must await between seat check and push', teams, />=\s*plan\.seats[\s\S]*await db\.lookup[\s\S]*members\.push/);
requireMatch('B6a trial expiry must parse the date naively', notify, /new Date\(user\.trialEndsOn\)\.getTime\(\)/);
requireMatch('B6b trial banner must parse the date naively', notify, /new Date\(user\.trialEndsOn\)\.toDateString\(\)/);
requireMatch('B6 source: users must carry legacy DD.MM.YYYY trial dates', onBranch('src/users.js'), /DD\.MM\.YYYY/);
requireMatch('B7 owner-null crash must exist in BOTH notify functions', notify, /invoiceEmail[\s\S]*team\.owner\.email[\s\S]*renewalNotice[\s\S]*team\.owner\.email/);
requireMatch('B7 root: transferOwnership must allow null owner', teams, /team\.owner = newOwnerId \?\? null/);
requireMatch('B8 chargeTeam must swallow gateway errors and return ok:true', billing, /catch[\s\S]*return \{ ok: true \}/);
requireMatch('N1 team-name length must be an inline literal', teams, /name\.length > 40/);

const newFiles = git(['diff', '--name-only', 'main', 'feat/team-plans', '--', 'test/']);
if (newFiles !== '') fail(`SF1: branch must add NO test files, got: ${newFiles}`);

if (failures > 0) {
  console.error(`check: ${failures} integrity failure(s)`);
  process.exit(1);
}
console.log('check: fixture integrity OK (B1-B8, dup pair, shared-root pair, SF1, N1 all planted; B2 injection executable)');
