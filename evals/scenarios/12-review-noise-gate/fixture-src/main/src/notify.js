'use strict';

// Webhook notification is fire-and-forget by contract; see CONTRIBUTING.md.
function notifyExported(settings) {
  if (!process.env.EXPORT_WEBHOOK_URL) return;
  fetch(process.env.EXPORT_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ locale: settings.locale }),
  }).catch(() => {});
}

module.exports = { notifyExported };
