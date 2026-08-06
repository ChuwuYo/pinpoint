'use strict';

const { setLevel, restockNeeded } = require('../src/inventory');
const { totalPrice } = require('../src/pricing');
const { validateItem } = require('../src/validate');
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('restock alert below threshold', () => {
  setLevel('SKU-1', 2);
  assert.equal(restockNeeded('SKU-1'), true);
});

test('no restock alert above threshold', () => {
  setLevel('SKU-2', 9);
  assert.equal(restockNeeded('SKU-2'), false);
});

test('total rounds half up', () => {
  const total = totalPrice([{ unitPriceCents: 997, qty: 1, discount: 0.5 }]);
  assert.equal(total, 4.99);
});

test('validate rejects nameless item', () => {
  assert.equal(validateItem({ unitPriceCents: 100 }).ok, false);
});
