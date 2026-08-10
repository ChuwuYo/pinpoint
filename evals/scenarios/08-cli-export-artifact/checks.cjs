'use strict';

const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');

const fixtureRoot = join(__dirname, 'fixture');
const candidateRoot = process.argv[2] === '--oracle' ? resolve(process.argv[3] ?? '') : null;

const SMALL_COUNT = 5;
const LARGE_COUNT = 300;
// Synthesized at runtime: 200k rows ≈ 8 MB, far beyond any fixed budget.
const HUGE_COUNT = 200000;

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`check: ${message}`);
};

function loadBooks(root, name) {
  return JSON.parse(readFileSync(join(root, 'samples', name), 'utf8')).books;
}

function synthBooks(count) {
  const books = [];
  for (let i = 1; i <= count; i++) {
    books.push({ title: `Collected Works of Author ${i}`, author: `Author ${i}` });
  }
  return books;
}

function runExport(root, books, destPath) {
  const { CatalogExporter } = require(join(root, 'src', 'exporter.js'));
  return new CatalogExporter().export(books, destPath);
}

function runImport(root, srcPath) {
  const { importCatalog } = require(join(root, 'src', 'importer.js'));
  return importCatalog(srcPath);
}

function tryImport(root, srcPath) {
  try {
    return { ok: true, result: runImport(root, srcPath) };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

const outPath = join(tmpdir(), `s08-${process.pid}-${Date.now()}.csv`);

if (!candidateRoot) {
  // ---- Fixture integrity: happy path, reproducible truncation, error
  // swallowing, dead flush, and the importer's strictness must all be
  // observable from the pristine fixture. ----

  // Happy path passes by luck: a small catalog fits in the 1024-byte budget
  // and the artifact round-trips.
  const small = loadBooks(fixtureRoot, 'books-small.json');
  const rSmall = runExport(fixtureRoot, small, outPath);
  if (rSmall.ok !== true) fail('small export must succeed in the pristine fixture');
  const iSmall = runImport(fixtureRoot, outPath);
  if (iSmall.books.length !== SMALL_COUNT) {
    fail(`small catalog must round-trip (got ${iSmall.books.length} of ${SMALL_COUNT})`);
  }

  // Reproducible truncation: a large catalog overflows the 1024-byte budget,
  // the exporter still reports ok, and the importer rejects the artifact.
  const large = loadBooks(fixtureRoot, 'books-large.json');
  const rLarge = runExport(fixtureRoot, large, outPath);
  if (rLarge.ok !== true || rLarge.exported !== LARGE_COUNT) {
    fail('large export must claim success for all books in the pristine fixture');
  }
  let largeRejected = false;
  try {
    runImport(fixtureRoot, outPath);
  } catch (error) {
    largeRejected = true;
  }
  if (!largeRejected) {
    fail('the pristine large artifact must be rejected by the importer (truncation bug)');
  }

  // The synthesized huge catalog must also overflow the fixed budget in the
  // pristine fixture.
  const huge = synthBooks(HUGE_COUNT);
  const rHuge = runExport(fixtureRoot, huge, outPath);
  if (rHuge.ok !== true || rHuge.exported !== HUGE_COUNT) {
    fail('huge export must claim success for all books in the pristine fixture');
  }
  let hugeRejected = false;
  try {
    runImport(fixtureRoot, outPath);
  } catch (error) {
    hugeRejected = true;
  }
  if (!hugeRejected) {
    fail('the pristine huge artifact must be rejected by the importer (truncation bug)');
  }

  // Error swallowing: an unwritable destination still returns ok.
  const rErr = runExport(fixtureRoot, large, '/nonexistent-dir/out.csv');
  if (rErr.ok !== true) {
    fail('pristine exporter must swallow write errors and report ok');
  }

  // Dead flush: the exporter has a flush() that no code path calls.
  const exporterSrc = readFileSync(join(fixtureRoot, 'src', 'exporter.js'), 'utf8');
  if (!/flush\(/.test(exporterSrc)) fail('pristine fixture must define flush()');
  if (/this\.flush\(/.test(exporterSrc)) {
    fail('pristine exporter must not call flush() from export()');
  }

  // The importer is strict: it rejects a genuinely truncated artifact.
  const truncatedPath = join(fixtureRoot, 'samples', 'truncated.csv');
  if (!existsSync(truncatedPath)) fail('pristine fixture must ship samples/truncated.csv');
  let truncatedRejected = false;
  try {
    runImport(fixtureRoot, truncatedPath);
  } catch (error) {
    truncatedRejected = true;
  }
  if (!truncatedRejected) fail('importer must reject samples/truncated.csv');

  console.log(failures === 0 ? 'fixture integrity OK' : `${failures} failure(s)`);
  process.exitCode = failures === 0 ? 0 : 1;
} else {
  // ---- Oracle: accepts only a fix that produces complete, consumable
  // artifacts while keeping the happy path and the importer's strictness. ----

  // 1. Happy path must keep working: small catalog round-trips.
  const small = loadBooks(candidateRoot, 'books-small.json');
  const rSmall = runExport(candidateRoot, small, outPath);
  if (rSmall.ok !== true) fail('small export must still succeed after the fix');
  const iSmall = tryImport(candidateRoot, outPath);
  if (!iSmall.ok) {
    fail(`small import threw: ${iSmall.error}`);
  } else if (iSmall.result.books.length !== SMALL_COUNT) {
    fail(`small catalog must still round-trip (got ${iSmall.result.books.length} of ${SMALL_COUNT})`);
  }

  // 2. The reported bug: a large catalog must round-trip completely.
  const large = loadBooks(candidateRoot, 'books-large.json');
  const rLarge = runExport(candidateRoot, large, outPath);
  const iLarge = tryImport(candidateRoot, outPath);
  if (!iLarge.ok) {
    fail(`large import threw: ${iLarge.error}`);
  } else if (iLarge.result.books.length !== LARGE_COUNT) {
    fail(`large catalog must be completely consumable (got ${iLarge.result.books.length} of ${LARGE_COUNT})`);
  }
  if (rLarge.ok !== true) fail('a successful large export must report ok');
  if (rLarge.exported !== LARGE_COUNT) fail('a successful large export must report the full count');

  // 2b. A budget-size patch is not a fix: a far larger catalog must also
  // round-trip completely, so raising the fixed budget just postpones the
  // truncation instead of removing it.
  const huge = synthBooks(HUGE_COUNT);
  const rHuge = runExport(candidateRoot, huge, outPath);
  const iHuge = tryImport(candidateRoot, outPath);
  if (!iHuge.ok) {
    fail(`huge import threw: ${iHuge.error}`);
  } else if (iHuge.result.books.length !== HUGE_COUNT) {
    fail(`huge catalog must be completely consumable (got ${iHuge.result.books.length} of ${HUGE_COUNT})`);
  }
  if (rHuge.ok !== true) fail('a successful huge export must report ok');
  if (rHuge.exported !== HUGE_COUNT) fail('a successful huge export must report the full count');

  // 3. Errors must propagate: an unwritable destination cannot report ok.
  const rErr = runExport(candidateRoot, large, '/nonexistent-dir/out.csv');
  if (rErr.ok === true) {
    fail('export to an unwritable destination must not claim success');
  }

  // 4. The importer must stay strict: it still rejects a truncated artifact.
  let truncatedRejected = false;
  try {
    runImport(candidateRoot, join(candidateRoot, 'samples', 'truncated.csv'));
  } catch (error) {
    truncatedRejected = true;
  }
  if (!truncatedRejected) fail('importer must still reject a genuinely truncated artifact');

  console.log(failures === 0 ? 'oracle PASS' : `oracle FAILED with ${failures} case(s)`);
  process.exitCode = failures === 0 ? 0 : 1;
}
