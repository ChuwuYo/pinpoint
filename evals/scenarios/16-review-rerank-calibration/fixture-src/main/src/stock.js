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

function level(sku) {
  return stock.get(sku) ?? 0;
}

module.exports = { setStock, reserve, level };
