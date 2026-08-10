'use strict';

const { Loader } = require('../loader');

// CBZ archives carry their own per-page metadata that is not meant to go
// through the shared normalization step, so this loader overrides load()
// entirely and never calls normalizeMetadata() at runtime.
class CbzLoader extends Loader {
  load(file) {
    const raw = require('node:fs').readFileSync(file, 'utf8');
    const metadata = {};
    for (const line of raw.split('\n')) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      metadata[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
    return metadata;
  }
}

module.exports = { CbzLoader };
