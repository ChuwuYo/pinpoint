#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2];
if (!target || !existsSync(target)) {
  console.error('usage: node scripts/eval-report.mjs <evals/runs/scenario-dir>');
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
  console.error(`eval-report: no run.json+grade.json pairs under ${target}`);
  process.exit(1);
}

const first = records[0].run;
const lines = [];
lines.push(`# Baseline: ${first.scenario} (revision ${first.scenario_revision})`);
lines.push('');
lines.push(`- Model: ${first.model.id} (${first.model.settings})`);
lines.push(`- Harness: ${first.harness.name} ${first.harness.version}`);
lines.push(`- Pinpoint commit: ${first.pinpoint_commit}`);
lines.push(`- Fixture: ${first.fixture.ref} (${first.fixture.hash})`);
lines.push('');
lines.push('| Condition | Rep | Status | Critical | Overall | Notes |');
lines.push('| --- | ---: | --- | --- | --- | --- |');

const sorted = [...records].sort((a, b) =>
  a.run.condition.localeCompare(b.run.condition) || a.run.repetition - b.run.repetition,
);
for (const { run, grade } of sorted) {
  if (run.status === 'INVALID') {
    lines.push(`| ${run.condition} | ${run.repetition} | INVALID | — | — | ${run.infrastructure_errors.join('; ')} |`);
    continue;
  }
  const criticals = grade.items.filter((item) => item.critical);
  const criticalPassed = criticals.filter((item) => item.score === 1).length;
  const status = criticalPassed === criticals.length ? 'PASS' : 'FAIL';
  const total = grade.items.reduce((sum, item) => sum + item.score, 0);
  const lost = grade.items.filter((item) => item.score < 1).map((item) => item.id);
  lines.push(`| ${run.condition} | ${run.repetition} | ${status} | ${criticalPassed}/${criticals.length} | ${total}/${grade.items.length} | ${lost.length > 0 ? `lost: ${lost.join(', ')}` : ''} |`);
}
lines.push('');
lines.push('Raw repetitions are reported per run; no averaging hides a regression.');

console.log(lines.join('\n'));
