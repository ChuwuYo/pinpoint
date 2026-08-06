'use strict';

const { addUser, removeUser } = require('../src/users');
const { charge, invoiceLine } = require('../src/billing');
const { PLANS } = require('../src/plans');
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('users can be added and removed', () => {
  addUser('u1', 'a@b.c');
  removeUser('u1');
});

test('charge records an amount', () => {
  const result = charge('u1', PLANS.solo.priceCents);
  assert.equal(result.ok, true);
});

test('team plan has five seats', () => {
  assert.equal(PLANS.team.seats, 5);
  assert.equal(invoiceLine('team', 1).quantity, 1);
});
