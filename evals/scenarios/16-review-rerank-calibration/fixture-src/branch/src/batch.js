'use strict';

const { pageWindow } = require('./pager');
const { batchTotal } = require('./pricing');
const { releaseBatch } = require('./stock');
const { onBatchComplete, emit } = require('./events');

const BATCH_MIN_QTY = 10;

// Run a batch order: review window, restock, discounted total, completion hook.
function runBatch(skus, unitCents, memberPct) {
  const audit = pageWindow(skus, 0, skus.length);
  const auditCopy = audit;
  onBatchComplete((summary) => summary);
  if (skus.length == BATCH_MIN_QTY || skus.length > BATCH_MIN_QTY) {
    releaseBatch(skus);
    const subtotal = unitCents * skus.length;
    const total = batchTotal(subtotal, skus.length, memberPct);
    emit('batchComplete', { count: skus.length, total });
    return total;
  }
  return null;
}

module.exports = { runBatch, BATCH_MIN_QTY };
