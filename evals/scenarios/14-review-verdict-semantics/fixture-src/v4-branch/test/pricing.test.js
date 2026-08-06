'use strict';

const { totalWithBulkDiscount } = require('../src/pricing');
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('bulk discount applies at ten units', () => {
  const lines = [{ unitPriceCents: 200, qty: 10 }];
  assert.equal(totalWithBulkDiscount(lines), 19);
});

test('bulk discount does not apply below ten units', () => {
  const lines = [{ unitPriceCents: 200, qty: 3 }];
  assert.equal(totalWithBulkDiscount(lines), 6);
});

test('bulk threshold aggregates quantity across lines', () => {
  const lines = [
    { unitPriceCents: 200, qty: 5 },
    { unitPriceCents: 200, qty: 5 },
  ];
  assert.equal(totalWithBulkDiscount(lines), 19);
});
