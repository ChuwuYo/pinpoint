'use strict';

// Selection/word logic lives in this module.
function isSingleWord(text) {
  return /^[A-Za-z][A-Za-z'-]*$/.test(text);
}

module.exports = { isSingleWord };
