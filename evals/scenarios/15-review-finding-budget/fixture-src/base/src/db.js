'use strict';

const tables = { users: new Map(), teams: new Map(), members: new Map() };

function query(sql) {
  // Minimal in-memory stand-in for a naive SQL backend: the WHERE value is
  // read up to the first closing quote, and a trailing OR '<a>'='<b>' clause
  // is evaluated literally — exactly what an unparameterized query does with
  // a classic tautology injection.
  const match = /FROM (\w+) WHERE (\w+) = '(.*?)'( OR '(.*?)'='(.*?)')?\s*$/.exec(sql);
  if (!match) return [];
  const [, table, , value, orClause, left, right] = match;
  const rows = [...tables[table].values()];
  if (orClause && left === right) return rows;
  return rows.filter((row) => Object.values(row).includes(value));
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
