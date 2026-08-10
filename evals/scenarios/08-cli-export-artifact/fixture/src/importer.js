'use strict';

const fs = require('node:fs');

class TruncatedArtifactError extends Error {}

function importCatalog(srcPath) {
  const text = fs.readFileSync(srcPath, 'utf8');
  if (!text.endsWith('\n')) {
    throw new TruncatedArtifactError('artifact is truncated: missing trailing newline');
  }
  const lines = text.split('\n').filter((line) => line.length > 0);
  if (lines.length === 0 || lines[0] !== 'title,author') {
    throw new TruncatedArtifactError('artifact is malformed: bad or missing header');
  }
  const books = [];
  for (const line of lines.slice(1)) {
    const comma = line.indexOf(',');
    if (comma < 0) {
      throw new TruncatedArtifactError(`artifact is malformed: row without comma: ${line}`);
    }
    books.push({ title: line.slice(0, comma), author: line.slice(comma + 1) });
  }
  return { ok: true, books, complete: true };
}

module.exports = { importCatalog, TruncatedArtifactError };
