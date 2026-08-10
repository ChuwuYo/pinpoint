'use strict';

const { readFileSync } = require('node:fs');
const { CatalogExporter } = require('./exporter');
const { importCatalog } = require('./importer');

function exportCommand(sourcePath, destPath) {
  const { books } = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const result = new CatalogExporter().export(books, destPath);
  if (result.ok) {
    console.log(`Exported ${result.exported} books to ${destPath}`);
    process.exitCode = 0;
  } else {
    console.error(`Export failed: ${result.error}`);
    process.exitCode = 1;
  }
}

function importCommand(sourcePath) {
  const { books } = importCatalog(sourcePath);
  console.log(`Imported ${books.length} books`);
}

const [, , command, ...rest] = process.argv;
switch (command) {
  case 'export':
    exportCommand(rest[0], rest[1]);
    break;
  case 'import':
    importCommand(rest[0]);
    break;
  default:
    console.error(`unknown command: ${command}`);
    process.exitCode = 2;
}
