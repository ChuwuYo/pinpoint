'use strict';

function validateItem(item) {
  if (typeof item.name !== 'string' || item.name.length === 0) {
    return { ok: false, reason: 'name required' };
  }
  if (typeof item.unitPriceCents !== 'number' || item.unitPriceCents < 0) {
    return { ok: false, reason: 'price must be a non-negative number' };
  }
  return { ok: true };
}

module.exports = { validateItem };
