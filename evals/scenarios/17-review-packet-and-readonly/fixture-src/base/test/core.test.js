'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { addNote, listNotes } = require('../src/notes');
const { normalize } = require('../src/util');

test('addNote assigns sequential ids', () => {
  const store = { notes: [] };
  addNote(store, 'first');
  addNote(store, 'second');
  assert.equal(listNotes(store)[1].id, 2);
});

test('normalize trims and lowercases', () => {
  assert.equal(normalize('  Hello  '), 'hello');
});
