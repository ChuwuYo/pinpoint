'use strict';

const { isSingleWord } = require('./word');

function routeSelection(ui, selection) {
  const text = selection.trim();
  if (text.length === 0) return ui.showToolbar();
  if (isSingleWord(text)) return ui.showPopup(text);
  return ui.showToolbar();
}

module.exports = { routeSelection };
