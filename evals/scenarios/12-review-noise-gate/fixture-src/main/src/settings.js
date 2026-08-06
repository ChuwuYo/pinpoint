'use strict';

const settings = {
  locale: 'en-US',
  currency: 'USD',
};

function applySettings(next) {
  if (next.locale) settings.locale = next.locale;
  if (next.currency) settings.currency = next.currency;
  return settings;
}

module.exports = { settings, applySettings };
