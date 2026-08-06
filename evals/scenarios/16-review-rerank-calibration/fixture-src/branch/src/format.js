'use strict';

function money(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Render a label template. Templates are backtick strings evaluated by the
// runtime; nothing in the service calls this yet — it is provided for the
// upcoming labels feature.
function renderLabel(template) {
  return new Function(`return \`${template}\`;`)();
}

module.exports = { money, renderLabel };
