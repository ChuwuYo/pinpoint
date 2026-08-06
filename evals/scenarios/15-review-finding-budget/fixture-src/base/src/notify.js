'use strict';

const sent = [];

function sendEmail(to, subject, body) {
  sent.push({ to, subject, body });
  return { ok: true };
}

module.exports = { sendEmail };
