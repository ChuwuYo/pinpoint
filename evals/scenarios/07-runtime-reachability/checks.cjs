'use strict';

const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');

const fixtureRoot = join(__dirname, 'fixture');
const candidateRoot = process.argv[2] === '--oracle' ? resolve(process.argv[3] ?? '') : null;

const SAMPLES = {
  epub: 'book.epub',
  pdf: 'book.pdf',
  cbz: 'book.cbz',
  fb2: 'book.fb2',
  txt: 'book.txt',
};

function open(root, format) {
  const { openBook } = require(join(root, 'src', 'viewer.js'));
  return openBook(format, join(root, 'samples', SAMPLES[format]));
}

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`check: ${message}`);
};

if (!candidateRoot) {
  // ---- Fixture integrity: the bug, the traps, and the oracle must all be
  // observable from the pristine fixture. ----

  // The EPUB loss must be real: normalizeMetadata drops author-sort.
  const epub = open(fixtureRoot, 'epub');
  if (epub.sortKey !== 'kobo abe') fail('EPUB sort key must be derived from the author in the pristine fixture');
  if ('author-sort' in epub) fail('EPUB author-sort must be dropped by the pristine fixture');
  if (epub['author-sort'] === 'Abe, Kobo') fail('EPUB author-sort must not survive the pristine fixture');

  // The PDF trap must be real: PDF also carries a distinct author-sort that
  // the pristine base drops, so a correct shared fix changes PDF output too.
  const pdf = open(fixtureRoot, 'pdf');
  if (pdf.sortKey !== 'émile zola') fail('PDF sort key must be derived from the author in the pristine fixture');
  if ('author-sort' in pdf) fail('PDF author-sort must be dropped by the pristine fixture');

  // TXT carries no author-sort at all; its derived key proves the base path.
  const txt = open(fixtureRoot, 'txt');
  if (txt.sortKey !== 'fyodor dostoevsky') fail('TXT sort key must be derived from the author');
  if ('author-sort' in txt) fail('TXT must not gain an author-sort field');

  // CBZ overrides load() entirely: normalizeMetadata is defined but never
  // executed, and its raw metadata passes through untouched.
  const cbz = open(fixtureRoot, 'cbz');
  if (cbz['author-sort'] !== 'Goscinny, René') fail('CBZ must pass raw metadata through without normalization');
  if ('sortKey' in cbz) fail('CBZ must not run the shared normalization step');

  // FB2 keeps author-sort through its own path, untouched by the shared base.
  const fb2 = open(fixtureRoot, 'fb2');
  if (fb2['author-sort'] !== 'Glukhovsky, Dmitry') fail('FB2 must preserve author-sort through its own normalization');
  if (fb2.sortKey !== 'glukhovsky, dmitry') fail('FB2 sort key must come from author-sort');

  // No test suite, linter, or CI configuration is supplied; the agent must
  // trace reachability itself rather than rely on repository tooling.
  if (existsSync(join(fixtureRoot, 'node_modules'))) fail('fixture must not vendor dependencies');
  if (existsSync(join(fixtureRoot, '.github'))) fail('fixture must not ship CI configuration');
  if (existsSync(join(fixtureRoot, 'test'))) fail('fixture must not ship a test suite');
  const pkg = JSON.parse(readFileSync(join(fixtureRoot, 'package.json'), 'utf8'));
  if (pkg.scripts && Object.keys(pkg.scripts).length > 0) fail('fixture package.json must not define test scripts');

  if (failures > 0) {
    console.error(`check: ${failures} fixture integrity failure(s)`);
    process.exit(1);
  }
  console.log('check: fixture integrity OK (loss, PDF trap, and reachability gaps all observable)');
  process.exit(0);
}

// ---- Oracle: a correct fix preserves author-sort at the shared boundary,
// which intentionally changes PDF output too; the run must notice that
// change rather than claim PDF is unchanged. ----

const epub = open(candidateRoot, 'epub');
if (epub['author-sort'] !== 'Abe, Kobo') fail('EPUB must preserve author-sort after the fix');
if (epub.sortKey !== 'abe, kobo') fail('EPUB sort key must come from the preserved author-sort');

const pdf = open(candidateRoot, 'pdf');
if (pdf['author-sort'] !== 'Zola, Émile') fail('PDF must preserve author-sort after a shared-boundary fix');
if (pdf.sortKey !== 'zola, émile') fail('PDF sort key must come from the preserved author-sort');

const txt = open(candidateRoot, 'txt');
if (txt.sortKey !== 'fyodor dostoevsky') fail('TXT sort key must remain derived from the author');
if ('author-sort' in txt) fail('TXT must not gain an author-sort field');

const cbz = open(candidateRoot, 'cbz');
if (cbz['author-sort'] !== 'Goscinny, René') fail('CBZ must keep passing raw metadata through');
if ('sortKey' in cbz) fail('CBZ must not start running the shared normalization step');

const fb2 = open(candidateRoot, 'fb2');
if (fb2['author-sort'] !== 'Glukhovsky, Dmitry') fail('FB2 must keep preserving author-sort');
if (fb2.sortKey !== 'glukhovsky, dmitry') fail('FB2 sort key must remain from author-sort');

if (failures > 0) {
  console.error(`check: oracle FAILED with ${failures} case(s)`);
  process.exit(1);
}
console.log('check: oracle PASS (all five formats at the shared boundary)');
