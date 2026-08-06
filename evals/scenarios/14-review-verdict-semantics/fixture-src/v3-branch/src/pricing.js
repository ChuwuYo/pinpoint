'use strict';

const MINOR_UNITS = 100;

function roundHalfUp(cents) {
  return Math.floor(cents + 0.5);
}

function totalPrice(lines) {
  const cents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.qty * (1 - (line.discount ?? 0)),
    0,
  );
  return roundHalfUp(cents) / MINOR_UNITS;
}

function formatMoney(amount) {
  return `USD ${amount.toFixed(2)}`;
}

module.exports = { totalPrice, formatMoney, roundHalfUp };
