'use strict';

const { normalize } = require('./util');

// Search notes matching ANY term. Matches are case-insensitive.
function searchNotes(store, terms) {
  const matches = [];
  for (const term of terms) {
    const needle = normalize(term);
    for (const note of store.notes) {
      if (normalize(note.text).includes(needle)) {
        matches.push(note);
      }
    }
  }
  return matches;
}

module.exports = { searchNotes };
