'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { addNote } = require('../src/notes');
const { searchNotes } = require('../src/search');

test('searchNotes matches any term without duplicates', () => {
  const store = { notes: [] };
  addNote(store, 'alpha beta gamma');
  addNote(store, 'alpha only');
  const results = searchNotes(store, ['alpha', 'beta']);
  assert.equal(results.length, 2);
});
