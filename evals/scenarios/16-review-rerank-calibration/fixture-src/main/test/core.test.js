'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { paginate } = require('../src/pager');
const { totalCents } = require('../src/pricing');

test('paginate returns the requested page', () => {
  assert.deepEqual(paginate([1, 2, 3, 4, 5], 1, 2), [3, 4]);
});

test('totalCents rounds once at the end', () => {
  assert.equal(totalCents(999, 3, 0.07), 3207);
});
