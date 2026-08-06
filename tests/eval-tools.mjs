import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(script, ...args) {
  const result = spawnSync('node', [join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  return result;
}

const validate = run('eval-validate.mjs');
if (validate.status !== 0) {
  throw new Error(`eval-validate failed:\n${validate.stdout}${validate.stderr}`);
}

const runsDir = join(root, 'evals', 'runs', '_synthetic');
const score = run('eval-score.mjs', runsDir, '--json');
if (score.status !== 0) {
  throw new Error(`eval-score failed:\n${score.stdout}${score.stderr}`);
}
const byCondition = JSON.parse(score.stdout);

const withSkill = byCondition['with-skill'];
const noSkill = byCondition['no-skill'];
if (!withSkill || !noSkill) throw new Error('missing synthetic conditions');

const pass = withSkill.find((run) => run.repetition === 1);
const failCritical = withSkill.find((run) => run.repetition === 2);
const falsePositive = withSkill.find((run) => run.repetition === 3);
const invalid = noSkill.find((run) => run.repetition === 1);

if (pass?.status !== 'PASS' || pass.critical !== '4/4') {
  throw new Error('synthetic pass run scored incorrectly');
}
if (failCritical?.status !== 'FAIL' || failCritical.critical !== '3/4') {
  throw new Error('scorer did not catch the critical regression');
}
if (falsePositive?.status !== 'PASS' || !falsePositive.regularsLost.includes('N2')) {
  throw new Error('scorer did not surface the regular-item loss');
}
if (invalid?.status !== 'INVALID') {
  throw new Error('scorer did not exclude the infrastructure-invalid run');
}

const report = run('eval-report.mjs', runsDir);
if (report.status !== 0 || !report.stdout.includes('| Condition |') || !report.stdout.includes('INVALID')) {
  throw new Error(`eval-report output unexpected:\n${report.stdout}${report.stderr}`);
}

console.log(`Eval tooling smoke test passed on ${process.platform}`);
