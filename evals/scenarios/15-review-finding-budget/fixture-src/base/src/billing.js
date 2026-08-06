'use strict';

const charges = [];

function charge(customerId, amountCents) {
  charges.push({ customerId, amountCents });
  return { ok: true };
}

function invoiceLine(plan, quantity) {
  return { plan, quantity };
}

module.exports = { charge, invoiceLine };
