'use strict';

function createUi() {
  const display = { mode: 'toolbar', payload: null };
  return {
    display,
    showPopup(word) {
      display.mode = 'popup';
      display.payload = word;
      return display;
    },
    showToolbar() {
      display.mode = 'toolbar';
      display.payload = null;
      return display;
    },
  };
}

module.exports = { createUi };
