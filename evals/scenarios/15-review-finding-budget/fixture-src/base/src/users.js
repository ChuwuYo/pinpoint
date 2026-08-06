'use strict';

const db = require('./db');

function addUser(id, email) {
  db.put('users', id, { email });
}

function removeUser(id) {
  db.remove('users', id);
}

module.exports = { addUser, removeUser };
