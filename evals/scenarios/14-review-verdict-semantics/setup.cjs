'use strict';

// Materialize the scenario 14 fixtures: seven independent variant repos
// (v1..v7), each a git repo with main + one variant branch. Variants are
// semantically independent — v7's main carries a pre-existing test failure,
// so a single shared main cannot host all variants.
// usage: node setup.cjs <target-root>

const { cpSync, existsSync, rmSync, mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');

const src = join(__dirname, 'fixture-src');
const root = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('usage: node setup.cjs <target-root>');
  process.exit(1);
}

const variants = {
  v1: { branch: 'fix/restock-alert', message: 'fix(inventory): alert when stock equals restock threshold' },
  v2: { branch: 'chore/order-errors', message: 'chore(orders): tolerate writer failures when saving orders' },
  v3: { branch: 'refactor/pricing-cleanup', message: 'refactor(pricing): name the minor-units constant' },
  v4: { branch: 'feat/bulk-discount', message: 'feat(pricing): bulk discount at ten units, applied in daily summaries' },
  v5: { branch: 'fix/price-rounding', message: 'fix(pricing): switch totals to banker\'s rounding' },
  v6: { branch: 'feat/remote-sync', message: 'feat(sync): remote inventory sync envelope' },
  v7: { branch: 'docs/contributing-guide', message: 'docs: add contributing guide' },
};

if (existsSync(root)) rmSync(root, { recursive: true, force: true });

for (const [id, meta] of Object.entries(variants)) {
  const dir = join(root, id);
  mkdirSync(dir, { recursive: true });
  const git = (args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  const commit = (message) =>
    git(['-c', 'user.name=eval', '-c', 'user.email=eval@localhost', 'commit', '-qm', message]);

  cpSync(join(src, 'base'), dir, { recursive: true });
  const mainOverride = join(src, `${id}-main`);
  if (existsSync(mainOverride)) cpSync(mainOverride, dir, { recursive: true });

  git(['init', '-q', '-b', 'main']);
  git(['add', '-A']);
  commit('feat: inventory service');

  git(['checkout', '-qb', meta.branch]);
  cpSync(join(src, `${id}-branch`), dir, { recursive: true });
  git(['add', '-A']);
  commit(meta.message);

  console.log(`${id}: main=${git(['rev-parse', 'main']).toString().trim()} ${meta.branch}=${git(['rev-parse', meta.branch]).toString().trim()}`);
}
console.log(`7 variant fixtures ready under ${root}`);
