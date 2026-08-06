'use strict';

const { row } = require('./csv');
const { formatTotal } = require('./format');
const { notifyExported } = require('./notify');

let cache = null;

function buildReport(lines, settings) {
  const header = row(['date', 'item', 'total']);
  const body = lines.map((l) =>
    row([l.date, l.item, formatTotal(l.totalMinor, settings.locale, settings.currency)]),
  );
  return [header, ...body].join('\n');
}

function getReport(lines, settings) {
  if (cache) return cache;
  cache = buildReport(lines, settings);
  return cache;
}

function exportReport(lines, settings) {
  const out = getReport(lines, settings);
  notifyExported(settings);
  return out;
}

module.exports = { exportReport, getReport };
