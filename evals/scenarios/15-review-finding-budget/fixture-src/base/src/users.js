'use strict';

const db = require('./db');

// trialEndsOn comes from the legacy import in DD.MM.YYYY format.
function addUser(id, email, trialEndsOn) {
  db.put('users', id, { email, trialEndsOn });
}

function removeUser(id) {
  db.remove('users', id);
}

module.exports = { addUser, removeUser };
