'use strict';

const sent = [];

function sendEmail(to, subject, body) {
  sent.push({ to, subject, body });
  return { ok: true };
}

function invoiceEmail(team, amountCents) {
  return sendEmail(team.owner.email, 'invoice', `total ${amountCents}`);
}

function renewalNotice(team) {
  return sendEmail(team.owner.email, 'renewal', 'your team plan renews soon');
}

function trialExpired(user) {
  return Date.now() > new Date(user.trialEndsOn).getTime();
}

function trialBanner(user) {
  return `trial ends ${new Date(user.trialEndsOn).toDateString()}`;
}

module.exports = { sendEmail, invoiceEmail, renewalNotice, trialExpired, trialBanner };
