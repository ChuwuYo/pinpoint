'use strict';

function roundHalfEven(cents) {
  const floor = Math.floor(cents);
  const fraction = cents - floor;
  if (fraction > 0.5) return floor + 1;
  if (fraction < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

function totalPrice(lines) {
  const cents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.qty * (1 - (line.discount ?? 0)),
    0,
  );
  return roundHalfEven(cents) / 100;
}

function formatMoney(amount) {
  return `USD ${amount.toFixed(2)}`;
}

module.exports = { totalPrice, formatMoney, roundHalfEven };
