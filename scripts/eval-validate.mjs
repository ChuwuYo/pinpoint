#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evalsDir = join(root, 'evals');
const errors = [];

function fail(message) {
  errors.push(message);
}

function validateAgainst(value, schema, path) {
  if (schema.enum && !schema.enum.includes(value)) {
    fail(`${path}: ${JSON.stringify(value)} not in enum [${schema.enum.join(', ')}]`);
    return;
  }
  if (schema.type === 'string') {
    if (typeof value !== 'string') fail(`${path}: expected string`);
    if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern).test(value)) {
      fail(`${path}: ${JSON.stringify(value)} does not match ${schema.pattern}`);
    }
    return;
  }
  if (schema.type === 'number') {
    if (typeof value !== 'number') fail(`${path}: expected number`);
    return;
  }
  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') fail(`${path}: expected boolean`);
    return;
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      fail(`${path}: expected array`);
      return;
    }
    if (schema.minItems && value.length < schema.minItems) {
      fail(`${path}: needs at least ${schema.minItems} items`);
    }
    if (schema.items) value.forEach((item, i) => validateAgainst(item, schema.items, `${path}[${i}]`));
    return;
  }
  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      fail(`${path}: expected object`);
      return;
    }
    for (const key of schema.required ?? []) {
      if (!(key in value)) fail(`${path}: missing required field '${key}'`);
    }
    for (const [key, val] of Object.entries(value)) {
      if (schema.additionalProperties === false && !(key in (schema.properties ?? {}))) {
        fail(`${path}: unexpected field '${key}'`);
      } else if (schema.properties?.[key]) {
        validateAgainst(val, schema.properties[key], `${path}.${key}`);
      }
    }
  }
}

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path}: invalid JSON (${error.message})`);
    return null;
  }
}

const schemas = {};
for (const name of ['scenario', 'run', 'grading', 'trigger-case', 'trigger-run']) {
  const schemaPath = join(evalsDir, 'schemas', `${name}.schema.json`);
  if (!existsSync(schemaPath)) {
    fail(`missing schema: evals/schemas/${name}.schema.json`);
    continue;
  }
  schemas[name] = loadJson(schemaPath);
}

const scenariosDir = join(evalsDir, 'scenarios');
const scenarioIds = new Set();
if (existsSync(scenariosDir)) {
  for (const entry of readdirSync(scenariosDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(scenariosDir, entry.name);
    const scenarioPath = join(dir, 'scenario.json');
    if (!existsSync(scenarioPath)) {
      fail(`${entry.name}: directory without scenario.json`);
      continue;
    }
    const scenario = loadJson(scenarioPath);
    if (!scenario || !schemas.scenario) continue;
    validateAgainst(scenario, schemas.scenario, `scenarios/${entry.name}/scenario.json`);
    scenarioIds.add(scenario.id ?? entry.name);

    for (const refField of ['prompt', 'rubric']) {
      const ref = scenario[refField];
      if (typeof ref === 'string' && !existsSync(join(dir, ref))) {
        fail(`${entry.name}: ${refField} references missing file ${ref}`);
      }
    }

    if (scenario.fixture_status === 'frozen' || scenario.fixture_status === 'ready') {
      const hasFixture =
        typeof scenario.fixture === 'string' && existsSync(join(dir, scenario.fixture));
      const hasGenerator =
        typeof scenario.fixture_generator === 'string' &&
        existsSync(join(dir, scenario.fixture_generator));
      if (!hasFixture && !hasGenerator) {
        fail(`${entry.name}: fixture_status is '${scenario.fixture_status}' but neither fixture nor fixture_generator is present`);
      }
    }

    const rubricPath = join(dir, scenario.rubric ?? 'rubric.json');
    if (existsSync(rubricPath)) {
      const rubric = loadJson(rubricPath);
      if (rubric) {
        if (rubric.scenario !== scenario.id) fail(`${entry.name}/rubric.json: scenario id mismatch`);
        if (!Array.isArray(rubric.items) || rubric.items.length === 0) {
          fail(`${entry.name}/rubric.json: no items`);
        } else {
          const ids = new Set();
          for (const item of rubric.items) {
            if (typeof item.id !== 'string' || typeof item.text !== 'string' || typeof item.critical !== 'boolean') {
              fail(`${entry.name}/rubric.json: item needs id, text, critical`);
            }
            if (ids.has(item.id)) fail(`${entry.name}/rubric.json: duplicate item id ${item.id}`);
            ids.add(item.id);
          }
        }
      }
    }
  }
}

const runsDir = join(evalsDir, 'runs');
if (existsSync(runsDir)) {
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === 'run.json') validateRun(path);
      else if (entry.name === 'grade.json') validateGrade(path);
    }
  };
  walk(runsDir);
}

function validateRun(path) {
  const run = loadJson(path);
  if (!run || !schemas.run) return;
  validateAgainst(run, schemas.run, path.replace(`${root}/`, ''));
  if (run.scenario && !scenarioIds.has(run.scenario)) {
    fail(`${path}: unknown scenario '${run.scenario}'`);
  }
  if (run.status === 'INVALID' && run.infrastructure_errors.length === 0) {
    fail(`${path}: status INVALID requires at least one infrastructure error`);
  }
  for (const [field, label] of [['final_response', 'final_response'], ['patch', 'patch']]) {
    const value = run[field];
    if (typeof value === 'string' && value.length > 0) {
      if (!existsSync(join(dirname(path), value))) {
        fail(`${path}: ${label} references missing file ${value}`);
      }
    } else if (!run.omitted_artifacts.includes(label)) {
      fail(`${path}: ${label} absent but not declared in omitted_artifacts`);
    }
  }
}

function validateGrade(path) {
  const grade = loadJson(path);
  if (!grade || !schemas.grading) return;
  validateAgainst(grade, schemas.grading, path.replace(`${root}/`, ''));
  const runPath = join(dirname(path), grade.run ?? '');
  if (grade.run && !existsSync(runPath)) {
    fail(`${path}: run references missing file ${grade.run}`);
  }
  for (const item of grade.items ?? []) {
    if (item.critical && (item.score === 0.5)) {
      fail(`${path}: critical item ${item.id} must be scored 0 or 1`);
    }
  }
  if (grade.run && existsSync(runPath)) {
    const run = loadJson(runPath);
    const rubricPath = join(scenariosDir, grade.scenario ?? '', 'rubric.json');
    if (run && existsSync(rubricPath)) {
      const rubric = loadJson(rubricPath);
      const rubricIds = new Set((rubric?.items ?? []).map((item) => item.id));
      for (const item of grade.items) {
        if (!rubricIds.has(item.id)) fail(`${path}: graded item ${item.id} not in rubric`);
      }
    }
  }
}

const triggerDir = join(evalsDir, 'trigger');
const triggerCases = new Map();
let catalogNames = new Set();
const REQUIRED_TRIGGER_FAMILIES = [
  'impl-not-review',
  'review-not-impl',
  'draft-commit-no-auth',
  'commit-authorized',
  'pr-draft-vs-publish',
  'help',
  'refactor-no-defect',
  'generic-advice',
  'sequence-no-merge',
  'review-and-merge',
];
if (existsSync(triggerDir)) {
  const triggerIds = new Set();
  const familiesBySplit = { train: new Set(), validation: new Set() };
  for (const split of ['train', 'validation']) {
    const jsonlPath = join(triggerDir, `${split}.jsonl`);
    if (!existsSync(jsonlPath)) {
      fail(`trigger/${split}.jsonl: missing`);
      continue;
    }
    const lines = readFileSync(jsonlPath, 'utf8').split('\n').filter((line) => line.trim() !== '');
    for (const [index, line] of lines.entries()) {
      const label = `trigger/${split}.jsonl:${index + 1}`;
      let record;
      try {
        record = JSON.parse(line);
      } catch (error) {
        fail(`${label}: invalid JSON (${error.message})`);
        continue;
      }
      if (schemas['trigger-case']) {
        validateAgainst(record, schemas['trigger-case'], label);
      }
      if (typeof record.id === 'string') {
        const prefix = split === 'train' ? 'TR-' : 'VA-';
        if (!record.id.startsWith(prefix)) {
          fail(`${label}: id ${record.id} must start with ${prefix}`);
        }
        if (triggerIds.has(record.id)) fail(`${label}: duplicate case id ${record.id}`);
        triggerIds.add(record.id);
        triggerCases.set(record.id, record);
      }
      if (typeof record.family === 'string') familiesBySplit[split].add(record.family);
      if (record.forbidden_skills?.includes(record.expected_primary)) {
        fail(`${label}: expected_primary ${record.expected_primary} is also forbidden`);
      }
      if (record.allowed_secondary?.includes(record.expected_primary)) {
        fail(`${label}: expected_primary ${record.expected_primary} duplicated in allowed_secondary`);
      }
    }
  }
  for (const family of REQUIRED_TRIGGER_FAMILIES) {
    for (const split of ['train', 'validation']) {
      if (!familiesBySplit[split].has(family)) {
        fail(`trigger/${split}.jsonl: required hard-negative family '${family}' not represented`);
      }
    }
  }
  const catalogPath = join(triggerDir, 'catalog.json');
  if (!existsSync(catalogPath)) {
    fail('trigger/catalog.json: missing');
  } else {
    const catalog = loadJson(catalogPath);
    if (catalog) {
      const pinpointNames = ['pinpoint', 'pinpoint-review', 'pinpoint-commit', 'pinpoint-pr', 'pinpoint-help'];
      const entries = Array.isArray(catalog.skills) ? catalog.skills : [];
      if (entries.length === 0) fail('trigger/catalog.json: no skills recorded');
      for (const name of pinpointNames) {
        const entry = entries.find((skill) => skill.name === name);
        if (!entry) {
          fail(`trigger/catalog.json: Pinpoint skill '${name}' not recorded`);
        } else if (typeof entry.description !== 'string' || entry.description.length === 0) {
          fail(`trigger/catalog.json: '${name}' has no recorded description`);
        }
      }
      for (const [index, entry] of entries.entries()) {
        if (typeof entry.name !== 'string' || typeof entry.source !== 'string' || typeof entry.description !== 'string') {
          fail(`trigger/catalog.json: skills[${index}] needs name, source, description`);
        }
        if (typeof entry.name === 'string') catalogNames.add(entry.name);
      }
    }
  }

  const triggerRunsDir = join(triggerDir, 'runs');
  if (existsSync(triggerRunsDir)) {
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.run.json')) validateTriggerRun(path);
      }
    };
    walk(triggerRunsDir);
  }
}

function validateTriggerRun(path) {
  const run = loadJson(path);
  if (!run) return;
  const label = path.replace(`${root}/`, '');
  if (schemas['trigger-run']) validateAgainst(run, schemas['trigger-run'], label);
  const caseRecord = triggerCases.get(run.case);
  if (!caseRecord) {
    fail(`${label}: unknown trigger case '${run.case}'`);
    return;
  }
  if (run.expected_primary !== caseRecord.expected_primary) {
    fail(`${label}: expected_primary '${run.expected_primary}' does not match dataset '${caseRecord.expected_primary}'`);
  }
  if (catalogNames.size > 0) {
    const discovered = new Set(run.discovered_skills ?? []);
    const missing = [...catalogNames].filter((name) => !discovered.has(name));
    if (missing.length > 0) {
      fail(`${label}: discovered_skills missing catalog entries: ${missing.join(', ')}`);
    }
  }
  const discoveredSet = new Set(run.discovered_skills ?? []);
  for (const selected of run.selected_skills ?? []) {
    if (discoveredSet.size > 0 && !discoveredSet.has(selected)) {
      fail(`${label}: selected skill '${selected}' not in discovered_skills`);
    }
  }
  if (run.status === 'INVALID') {
    if ((run.infrastructure_errors ?? []).length === 0) {
      fail(`${label}: status INVALID requires at least one infrastructure error`);
    }
    return;
  }
  const selected = new Set(run.selected_skills ?? []);
  const forbidden = new Set(caseRecord.forbidden_skills ?? []);
  const pinpointSet = new Set(['pinpoint', 'pinpoint-review', 'pinpoint-commit', 'pinpoint-pr', 'pinpoint-help']);
  const hasForbidden = [...selected].some((name) => forbidden.has(name));
  const expected = caseRecord.expected_primary;
  const hasExpected = expected === 'none'
    ? ![...selected].some((name) => pinpointSet.has(name))
    : selected.has(expected);
  switch (run.outcome) {
    case 'correct':
      if (!hasExpected || hasForbidden) {
        fail(`${label}: outcome 'correct' inconsistent with selection [${[...selected].join(', ')}] for case expecting '${expected}'`);
      }
      if (expected !== 'none' && selected.size > 1) {
        const allowed = new Set([expected, ...(caseRecord.allowed_secondary ?? [])]);
        const extras = [...selected].filter((name) => pinpointSet.has(name) && !allowed.has(name));
        if (extras.length > 0) {
          fail(`${label}: outcome 'correct' but selection includes non-allowed Pinpoint skills: ${extras.join(', ')}`);
        }
      }
      break;
    case 'no-selection':
      if (selected.size !== 0) fail(`${label}: outcome 'no-selection' but selection is non-empty`);
      break;
    case 'wrong-selection':
      if (selected.size === 0 || hasExpected) {
        fail(`${label}: outcome 'wrong-selection' inconsistent with selection [${[...selected].join(', ')}]`);
      }
      break;
    case 'multi-selection':
      if (selected.size < 2 || !selected.has(expected)) {
        fail(`${label}: outcome 'multi-selection' requires 2+ selections including expected_primary`);
      }
      break;
    case 'unauthorized-selection':
      if (!hasForbidden && (run.constraint_violations ?? []).length === 0) {
        fail(`${label}: outcome 'unauthorized-selection' requires a forbidden selection or a constraint violation`);
      }
      break;
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`eval-validate: ${error}`);
  console.error(`eval-validate: ${errors.length} error(s)`);
  process.exitCode = 1;
} else {
  console.log(`eval-validate: OK (${scenarioIds.size} structured scenario(s))`);
}
