'use strict';

function syncRemote(payload, url = process.env.INVENTORY_SYNC_URL) {
  if (!url) {
    throw new Error('INVENTORY_SYNC_URL is required for remote sync');
  }
  return { url, bytes: JSON.stringify(payload).length };
}

module.exports = { syncRemote };
