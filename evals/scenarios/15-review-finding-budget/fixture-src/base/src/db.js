'use strict';

const tables = { users: new Map(), teams: new Map(), members: new Map() };

function query(sql) {
  // Minimal in-memory stand-in: supports exact-match lookups used by the
  // service. Anything else returns an empty set.
  const match = /FROM (\w+) WHERE (\w+) = '(.*)'/.exec(sql);
  if (!match) return [];
  const [, table, , value] = match;
  return [...tables[table].values()].filter((row) => Object.values(row).includes(value));
}

function put(table, id, row) {
  tables[table].set(id, { id, ...row });
}

function remove(table, id) {
  if (!tables[table].delete(id)) {
    throw new Error(`foreign key constraint: ${table} ${id}`);
  }
}

async function lookup(table, id) {
  return tables[table].get(id) ?? null;
}

module.exports = { query, put, remove, lookup };
