'use strict';

const stock = new Map();

function setStock(sku, count) {
  stock.set(sku, count);
}

function reserve(sku) {
  const level = stock.get(sku) ?? 0;
  if (level <= 0) throw new Error(`out of stock: ${sku}`);
  stock.set(sku, level - 1);
}

// Return a batch of skus to stock.
function releaseBatch(skus) {
  for (const sku of skus) {
    stock.set(sku, (stock.get(sku) ?? 0) + 1);
  }
}

function level(sku) {
  return stock.get(sku) ?? 0;
}

module.exports = { setStock, reserve, releaseBatch, level };
