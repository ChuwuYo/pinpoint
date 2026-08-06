'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { routeSelection } = require('../src/router');
const { createUi } = require('../src/ui');

test('latin word selection shows the lookup popup', () => {
  const ui = createUi();
  routeSelection(ui, 'hello');
  assert.equal(ui.display.mode, 'popup');
  assert.equal(ui.display.payload, 'hello');
});

test('multi-word selection returns to the toolbar', () => {
  const ui = createUi();
  routeSelection(ui, 'hello world');
  assert.equal(ui.display.mode, 'toolbar');
});

test('empty selection returns to the toolbar', () => {
  const ui = createUi();
  routeSelection(ui, '   ');
  assert.equal(ui.display.mode, 'toolbar');
});
