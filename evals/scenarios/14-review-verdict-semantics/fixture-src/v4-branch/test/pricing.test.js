'use strict';

const { bulkDiscount } = require('../src/pricing');
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('bulk discount applies at ten units', () => {
  const lines = [{ unitPriceCents: 200, qty: 10 }];
  assert.equal(bulkDiscount(lines), 19);
});

test('bulk discount does not apply below ten units', () => {
  const lines = [{ unitPriceCents: 200, qty: 3 }];
  assert.equal(bulkDiscount(lines), 6);
});
