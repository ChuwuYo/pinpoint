'use strict';

const listeners = new Map();

function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(fn);
}

function emit(event, payload) {
  for (const fn of listeners.get(event) ?? []) fn(payload);
}

module.exports = { on, emit };
