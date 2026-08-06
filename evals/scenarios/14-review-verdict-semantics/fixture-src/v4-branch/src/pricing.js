'use strict';

function roundHalfUp(cents) {
  return Math.floor(cents + 0.5);
}

function totalCents(lines) {
  return lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.qty * (1 - (line.discount ?? 0)),
    0,
  );
}

function totalPrice(lines) {
  return roundHalfUp(totalCents(lines)) / 100;
}

function totalWithBulkDiscount(lines) {
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);
  const cents = totalCents(lines);
  const discounted = totalQty >= 10 ? roundHalfUp(cents * 0.95) : roundHalfUp(cents);
  return discounted / 100;
}

function formatMoney(amount) {
  return `USD ${amount.toFixed(2)}`;
}

module.exports = { totalPrice, totalWithBulkDiscount, formatMoney, roundHalfUp };
