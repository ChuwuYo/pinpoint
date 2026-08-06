'use strict';

// Pricing conventions:
// - all money is integer cents;
// - discounts multiply the ORIGINAL subtotal unless a function says otherwise;
// - totals round once, at the end.

function unitPriceWithTax(unitCents, taxPct) {
  return Math.round(unitCents * (1 + taxPct));
}

function totalCents(unitCents, qty, taxPct) {
  return Math.round(unitCents * qty * (1 + taxPct));
}

module.exports = { unitPriceWithTax, totalCents };
