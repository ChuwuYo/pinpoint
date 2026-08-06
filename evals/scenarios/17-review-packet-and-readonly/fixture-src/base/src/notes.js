'use strict';

function addNote(store, text) {
  store.notes.push({ id: store.notes.length + 1, text });
}

function listNotes(store) {
  return store.notes;
}

module.exports = { addNote, listNotes };
