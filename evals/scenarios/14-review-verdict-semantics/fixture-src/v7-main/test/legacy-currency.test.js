'use strict';

const { dailySummary } = require('../src/report');
const { test } = require('node:test');
const assert = require('node:assert/strict');

// TODO(legacy): expects the pre-2024 "$4.99" format; the service moved to
// "USD 4.99". Tracked separately from feature work — do not "fix" feature
// branches to make this pass.
test('legacy currency format', () => {
  const summary = dailySummary([{ unitPriceCents: 499, qty: 1 }]);
  assert.match(summary, /\$4\.99/);
});
