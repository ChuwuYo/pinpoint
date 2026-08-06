'use strict';

function roundHalfUp(cents) {
  return Math.floor(cents + 0.5);
}

function totalPrice(lines) {
  const cents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.qty * (1 - (line.discount ?? 0)),
    0,
  );
  return roundHalfUp(cents) / 100;
}

function bulkDiscount(lines) {
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = totalPrice(lines);
  return totalQty >= 10 ? total * 0.95 : total;
}

function formatMoney(amount) {
  return `USD ${amount.toFixed(2)}`;
}

module.exports = { totalPrice, bulkDiscount, formatMoney, roundHalfUp };
