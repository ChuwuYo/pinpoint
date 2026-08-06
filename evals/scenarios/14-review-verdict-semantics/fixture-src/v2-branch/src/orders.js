'use strict';

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
