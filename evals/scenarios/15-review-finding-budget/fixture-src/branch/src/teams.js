'use strict';

const db = require('./db');
const { PLANS } = require('./plans');

function createTeam(id, name, ownerId) {
  if (name.length > 40) throw new Error('team name too long');
  db.put('teams', id, { name, owner: ownerId, plan: 'team', members: [] });
}

async function addMember(teamId, userId) {
  const team = await db.lookup('teams', teamId);
  const plan = PLANS[team.plan];
  if (team.members.length >= plan.seats) {
    throw new Error('team is full');
  }
  await db.lookup('users', userId);
  team.members.push(userId);
  db.put('members', userId, { teamId, userId });
}

function removeTeam(teamId) {
  const rows = db.query(`FROM members WHERE teamId = '${teamId}'`);
  for (const row of rows) {
    db.remove('members', row.userId);
  }
  db.remove('teams', teamId);
}

function findMembers(teamName) {
  return db.query(`FROM members WHERE teamId = '${teamName}'`);
}

function transferOwnership(teamId, newOwnerId) {
  return db.lookup('teams', teamId).then((team) => {
    team.owner = newOwnerId ?? null;
  });
}

module.exports = { createTeam, addMember, removeTeam, findMembers, transferOwnership };
