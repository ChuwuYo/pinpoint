'use strict';

const { syncRemote } = require('../src/sync');
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('sync builds a request envelope', { skip: !process.env.INVENTORY_SYNC_URL }, () => {
  const result = syncRemote({ sku: 'SKU-1', units: 3 });
  assert.equal(result.bytes > 0, true);
});
