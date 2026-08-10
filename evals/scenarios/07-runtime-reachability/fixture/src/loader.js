'use strict';

// Shared Loader base. normalizeMetadata() derives the sort key from the
// author and drops the source `author-sort` field; format loaders that do
// not override it inherit this behavior.

class Loader {
  load(file) {
    const metadata = this.parse(file);
    return this.normalizeMetadata(metadata);
  }

  parse(file) {
    const raw = require('node:fs').readFileSync(file, 'utf8');
    const metadata = {};
    for (const line of raw.split('\n')) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      metadata[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
    return metadata;
  }

  normalizeMetadata(metadata) {
    const normalized = { ...metadata };
    delete normalized['author-sort'];
    normalized.sortKey = (metadata.author || '').toLowerCase();
    return normalized;
  }
}

module.exports = { Loader };
