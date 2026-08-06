'use strict';

const listeners = new Map();

function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(fn);
}

// Batch completion hook for downstream consumers.
function onBatchComplete(fn) {
  on('batchComplete', fn);
}

function emit(event, payload) {
  for (const fn of listeners.get(event) ?? []) fn(payload);
}

module.exports = { on, onBatchComplete, emit };
