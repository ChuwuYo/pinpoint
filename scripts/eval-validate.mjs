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
for (const name of ['scenario', 'run', 'grading']) {
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
      if (typeof scenario.fixture !== 'string' || !existsSync(join(dir, scenario.fixture))) {
        fail(`${entry.name}: fixture_status is '${scenario.fixture_status}' but fixture path is missing`);
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

if (errors.length > 0) {
  for (const error of errors) console.error(`eval-validate: ${error}`);
  console.error(`eval-validate: ${errors.length} error(s)`);
  process.exitCode = 1;
} else {
  console.log(`eval-validate: OK (${scenarioIds.size} structured scenario(s))`);
}
