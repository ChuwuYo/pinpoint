#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const triggerDir = join(root, 'evals', 'trigger');
const runsRoot = process.argv[2] ? resolve(process.argv[2]) : join(triggerDir, 'runs');

const SKILLS = ['pinpoint', 'pinpoint-review', 'pinpoint-commit', 'pinpoint-pr', 'pinpoint-help'];
const MUTATING = new Set(['pinpoint', 'pinpoint-commit', 'pinpoint-pr']);

function loadCases() {
  const cases = new Map();
  for (const split of ['train', 'validation']) {
    const path = join(triggerDir, `${split}.jsonl`);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      if (line.trim() === '') continue;
      const record = JSON.parse(line);
      cases.set(record.id, record);
    }
  }
  return cases;
}

function loadRuns(dir) {
  const runs = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.run.json')) runs.push({ path, record: JSON.parse(readFileSync(path, 'utf8')) });
    }
  };
  if (existsSync(dir)) walk(dir);
  return runs;
}

const cases = loadCases();
const all = loadRuns(runsRoot);
if (all.length === 0) {
  console.log(`eval-trigger-report: no trigger runs under ${runsRoot.replace(`${root}/`, '')}`);
  process.exit(0);
}

const invalid = all.filter(({ record }) => record.status === 'INVALID');
const scored = all.filter(({ record }) => record.status !== 'INVALID');

const lines = [];
lines.push('# Trigger report');
lines.push('');
lines.push(`Runs: ${all.length} total, ${scored.length} scored, ${invalid.length} INVALID (excluded).`);
lines.push('');

const groups = new Map();
for (const entry of scored) {
  const model = entry.record.model?.id ?? 'unknown';
  const key = `${entry.record.condition} | ${model}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(entry);
}

for (const [groupKey, batch] of [...groups.entries()].sort()) {
  const [condition, model] = groupKey.split(' | ');
  lines.push(`## ${condition} condition — ${model} (${batch.length} runs)`);
  lines.push('');

  const labels = [...SKILLS, 'none'];
  const matrix = new Map();
  const stats = new Map(SKILLS.map((skill) => [skill, { tp: 0, fp: 0, fn: 0 }]));
  const criticalFailures = [];
  const boundaryMisroutes = [];
  const outcomeCounts = new Map();

  for (const { path, record } of batch) {
    const caseRecord = cases.get(record.case);
    const expected = record.expected_primary;
    const selected = record.selected_skills ?? [];
    const pinpointSelected = selected.filter((name) => SKILLS.includes(name));
    const cell =
      pinpointSelected.length === 0
        ? selected.length === 0
          ? 'none'
          : 'non-pinpoint'
        : pinpointSelected.length === 1 && selected.length === 1
          ? pinpointSelected[0]
          : 'multiple';
    const key = `${expected} -> ${cell}`;
    matrix.set(key, (matrix.get(key) ?? 0) + 1);
    outcomeCounts.set(record.outcome, (outcomeCounts.get(record.outcome) ?? 0) + 1);

    const allowedSecondary = new Set(caseRecord?.allowed_secondary ?? []);
    for (const skill of SKILLS) {
      const bucket = stats.get(skill);
      if (selected.includes(skill) && expected === skill) bucket.tp += 1;
      else if (selected.includes(skill) && expected !== skill) {
        if (!allowedSecondary.has(skill)) bucket.fp += 1;
      } else if (!selected.includes(skill) && expected === skill) bucket.fn += 1;
    }

    if (caseRecord?.criticality === 'critical' && record.outcome !== 'correct') {
      criticalFailures.push({ path, record, caseRecord });
    }

    const crossesBoundary =
      (expected === 'pinpoint-review' && selected.some((name) => MUTATING.has(name))) ||
      (expected === 'pinpoint' && selected.includes('pinpoint-review'));
    if (crossesBoundary) boundaryMisroutes.push({ path, record });
  }

  lines.push('### Outcomes');
  lines.push('');
  for (const outcome of ['correct', 'no-selection', 'wrong-selection', 'multi-selection', 'unauthorized-selection']) {
    lines.push(`- ${outcome}: ${outcomeCounts.get(outcome) ?? 0}`);
  }
  lines.push('');

  lines.push('### Confusion matrix (expected -> selected)');
  lines.push('');
  lines.push('| expected | ' + [...labels, 'multiple', 'non-pinpoint'].join(' | ') + ' |');
  lines.push('| --- | ' + [...labels, 'multiple', 'non-pinpoint'].map(() => '---').join(' | ') + ' |');
  for (const expected of labels) {
    const cells = [...labels, 'multiple', 'non-pinpoint'].map((cell) => matrix.get(`${expected} -> ${cell}`) ?? 0);
    if (cells.every((count) => count === 0)) continue;
    lines.push(`| ${expected} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  lines.push('### Per-skill precision / recall');
  lines.push('');
  lines.push('| skill | precision | recall | tp | fp | fn |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const skill of SKILLS) {
    const { tp, fp, fn } = stats.get(skill);
    const precision = tp + fp === 0 ? '—' : (tp / (tp + fp)).toFixed(2);
    const recall = tp + fn === 0 ? '—' : (tp / (tp + fn)).toFixed(2);
    lines.push(`| ${skill} | ${precision} | ${recall} | ${tp} | ${fp} | ${fn} |`);
  }
  lines.push('');

  lines.push(`### Read-only/mutating boundary misroutes: ${boundaryMisroutes.length}`);
  lines.push('');
  for (const { path, record } of boundaryMisroutes) {
    lines.push(`- ${record.case} (${path.replace(`${root}/`, '')}): expected ${record.expected_primary}, selected [${record.selected_skills.join(', ')}]`);
  }
  lines.push('');

  lines.push(`### Critical-case failures: ${criticalFailures.length}`);
  lines.push('');
  for (const { path, record, caseRecord } of criticalFailures) {
    const violations = (record.constraint_violations ?? []).join('; ');
    lines.push(`- ${record.case} [${caseRecord.family}] outcome=${record.outcome} selected=[${record.selected_skills.join(', ')}]${violations ? ` violations: ${violations}` : ''} (${path.replace(`${root}/`, '')})`);
  }
  lines.push('');
}

if (invalid.length > 0) {
  lines.push('## INVALID runs (infrastructure, excluded from scoring)');
  lines.push('');
  for (const { path, record } of invalid) {
    lines.push(`- ${record.case}: ${(record.infrastructure_errors ?? []).join('; ')} (${path.replace(`${root}/`, '')})`);
  }
  lines.push('');
}

console.log(lines.join('\n'));
