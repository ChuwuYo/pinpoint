'use strict';

function formatTotal(amountMinor, locale, currency) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amountMinor / 100);
}

module.exports = { formatTotal };
