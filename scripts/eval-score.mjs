#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2];
const asJson = process.argv.includes('--json');
if (!target || !existsSync(target)) {
  console.error('usage: node scripts/eval-score.mjs <evals/runs/scenario-dir> [--json]');
  process.exit(1);
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const records = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name === 'run.json' && existsSync(join(dir, 'grade.json'))) {
      records.push({ dir, run: loadJson(path), grade: loadJson(join(dir, 'grade.json')) });
    }
  }
};
walk(target);

if (records.length === 0) {
  console.error(`eval-score: no run.json+grade.json pairs under ${target}`);
  process.exit(1);
}

function scoreRecord({ run, grade }) {
  if (run.status === 'INVALID') return { status: 'INVALID' };
  const criticals = grade.items.filter((item) => item.critical);
  const regulars = grade.items.filter((item) => !item.critical);
  const criticalPassed = criticals.filter((item) => item.score === 1).length;
  const status = criticalPassed === criticals.length ? 'PASS' : 'FAIL';
  const total = grade.items.reduce((sum, item) => sum + item.score, 0);
  return {
    status,
    critical: `${criticalPassed}/${criticals.length}`,
    overall: `${total}/${grade.items.length}`,
    fraction: grade.items.length === 0 ? 0 : total / grade.items.length,
    regularsLost: regulars.filter((item) => item.score < 1).map((item) => item.id),
  };
}

const byCondition = new Map();
for (const record of records) {
  const key = record.run.condition;
  if (!byCondition.has(key)) byCondition.set(key, []);
  byCondition.get(key).push({ repetition: record.run.repetition, ...scoreRecord(record) });
}
for (const list of byCondition.values()) list.sort((a, b) => a.repetition - b.repetition);

if (asJson) {
  const out = {};
  for (const [condition, runs] of byCondition) out[condition] = runs;
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

console.log(`Scenario: ${records[0].run.scenario} (revision ${records[0].run.scenario_revision})`);
for (const [condition, runs] of byCondition) {
  const valid = runs.filter((run) => run.status !== 'INVALID');
  const passed = valid.filter((run) => run.status === 'PASS').length;
  console.log(`\n${condition}: ${valid.length} valid run(s), ${passed} PASS`);
  for (const run of runs) {
    if (run.status === 'INVALID') {
      console.log(`  rep ${run.repetition}: INVALID (excluded)`);
    } else {
      const lost = run.regularsLost.length > 0 ? ` regular-lost=[${run.regularsLost.join(',')}]` : '';
      console.log(`  rep ${run.repetition}: ${run.status} critical ${run.critical} overall ${run.overall}${lost}`);
    }
  }
}
