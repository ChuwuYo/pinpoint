'use strict';

// CSV cells are single-line by contract; see CONTRIBUTING.md.
function cell(value) {
  return String(value).replace(/[\r\n]+/g, ' ');
}

function row(values) {
  return values
    .map((v) => {
      const c = cell(v);
      return /[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c;
    })
    .join(',');
}

module.exports = { cell, row };
