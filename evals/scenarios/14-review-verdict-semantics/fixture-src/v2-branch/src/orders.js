'use strict';

// Writer contract: synchronous. `writer.write(payload)` either returns or
// throws; asynchronous writers (promises, streams, callbacks) are out of
// scope for this module by design.

function saveOrder(order, writer) {
  try {
    writer.write(JSON.stringify(order));
    return { ok: true, saved: true };
  } catch (error) {
    console.warn('order write failed, continuing', error.message);
    return { ok: true, saved: false };
  }
}

module.exports = { saveOrder };
