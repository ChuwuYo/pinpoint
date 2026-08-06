'use strict';

const { getLevel, DEFAULT_RESTOCK_THRESHOLD } = require('./inventory');
const { formatMoney, totalWithBulkDiscount } = require('./pricing');

function restockReport(skus) {
  return skus.filter((sku) => getLevel(sku) < DEFAULT_RESTOCK_THRESHOLD);
}

function dailySummary(lines) {
  return `total=${formatMoney(totalWithBulkDiscount(lines))} lines=${lines.length}`;
}

module.exports = { restockReport, dailySummary };
