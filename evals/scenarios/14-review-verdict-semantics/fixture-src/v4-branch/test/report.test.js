'use strict';

const { dailySummary } = require('../src/report');
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('daily summary reports the bulk-discounted total at ten units', () => {
  const summary = dailySummary([{ unitPriceCents: 200, qty: 10 }]);
  assert.equal(summary, 'total=USD 19.00 lines=1');
});

test('daily summary reports the plain total below ten units', () => {
  const summary = dailySummary([{ unitPriceCents: 200, qty: 3 }]);
  assert.equal(summary, 'total=USD 6.00 lines=1');
});
