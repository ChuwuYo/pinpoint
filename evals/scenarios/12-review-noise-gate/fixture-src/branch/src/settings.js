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

const SUPPORTED_LOCALES = ['en-US', 'de-DE', 'zh-CN', 'ja-JP'];

function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) throw new RangeError(`unsupported locale: ${locale}`);
  return applySettings({ locale });
}

module.exports = { settings, applySettings, setLocale };
