'use strict';

const levels = new Map();
const DEFAULT_RESTOCK_THRESHOLD = 5;

function setLevel(sku, units) {
  levels.set(sku, units);
}

function getLevel(sku) {
  return levels.get(sku) ?? 0;
}

function restockNeeded(sku, threshold = DEFAULT_RESTOCK_THRESHOLD) {
  return getLevel(sku) < threshold;
}

module.exports = { setLevel, getLevel, restockNeeded, DEFAULT_RESTOCK_THRESHOLD };
