'use strict';

const { Loader } = require('../loader');

// FB2 keeps the author-sort field through its own normalization. A legacy
// flag path into the base implementation remains for compatibility with an
// old pipeline that no caller enables.
class Fb2Loader extends Loader {
  constructor() {
    super();
    this.useLegacyNormalize = false;
  }

  normalizeMetadata(metadata) {
    if (this.useLegacyNormalize) return super.normalizeMetadata(metadata);
    const normalized = { ...metadata };
    normalized.sortKey = (metadata['author-sort'] || metadata.author || '').toLowerCase();
    return normalized;
  }
}

module.exports = { Fb2Loader };
