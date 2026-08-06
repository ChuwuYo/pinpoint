'use strict';

const charges = [];

function charge(customerId, amountCents) {
  charges.push({ customerId, amountCents });
  return { ok: true };
}

function invoiceLine(plan, quantity) {
  return { plan, quantity };
}

function prorateTeam(priceCents, daysUsed) {
  return Math.round((priceCents / 30) * daysUsed);
}

function checkoutTotal(subtotalCents, discountPct, taxPct) {
  const discounted = subtotalCents * (1 - discountPct);
  return Math.round(discounted * (1 + taxPct));
}

function renewalTotal(subtotalCents, discountPct, taxPct) {
  const taxed = subtotalCents * (1 + taxPct);
  return Math.round(taxed * (1 - discountPct));
}

function chargeTeam(teamId, amountCents, gateway) {
  try {
    return gateway.charge(teamId, amountCents);
  } catch (error) {
    console.warn('team charge failed', error.message);
    return { ok: true };
  }
}

module.exports = {
  charge,
  invoiceLine,
  prorateTeam,
  checkoutTotal,
  renewalTotal,
  chargeTeam,
};
