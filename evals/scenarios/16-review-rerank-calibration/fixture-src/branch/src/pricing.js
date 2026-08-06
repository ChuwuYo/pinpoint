'use strict';

// Pricing conventions:
// - all money is integer cents;
// - discounts multiply the ORIGINAL subtotal unless a function says otherwise;
// - totals round once, at the end.

const QTY_DISCOUNT_PCT = 0.15;

function unitPriceWithTax(unitCents, taxPct) {
  return Math.round(unitCents * (1 + taxPct));
}

function totalCents(unitCents, qty, taxPct) {
  return Math.round(unitCents * qty * (1 + taxPct));
}

// Batch total with member and quantity discounts.
function batchTotal(subtotalCents, qty, memberPct) {
  const memberPrice = subtotalCents * (1 - memberPct);
  if (qty >= 10) {
    return Math.round(memberPrice * (1 - QTY_DISCOUNT_PCT));
  }
  return Math.round(memberPrice);
}

// Register a fee rate for the pricing engine.
function addFeeRate(config, rate) {
  const rates = [...config.rates];
  rates.push(rate);
  return rates;
}

module.exports = { unitPriceWithTax, totalCents, batchTotal, addFeeRate, QTY_DISCOUNT_PCT };
