'use strict';

const { getLevel, DEFAULT_RESTOCK_THRESHOLD } = require('./inventory');
const { formatMoney, totalPrice } = require('./pricing');

function restockReport(skus) {
  return skus.filter((sku) => getLevel(sku) < DEFAULT_RESTOCK_THRESHOLD);
}

function dailySummary(lines) {
  return `total=${formatMoney(totalPrice(lines))} lines=${lines.length}`;
}

module.exports = { restockReport, dailySummary };
