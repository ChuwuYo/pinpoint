'use strict';

const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');

const fixtureRoot = join(__dirname, 'fixture');
const candidateRoot = process.argv[2] === '--oracle' ? resolve(process.argv[3] ?? '') : null;

const ORACLE = [
  { selection: 'hello', expect: 'popup', why: 'existing latin behavior must keep working' },
  { selection: "don't", expect: 'popup', why: 'latin contraction stays a word' },
  { selection: '学校', expect: 'popup', why: 'short CJK word' },
  { selection: '图书馆', expect: 'popup', why: 'three-codepoint CJK word' },
  { selection: '新华书店', expect: 'popup', why: 'four-codepoint CJK word' },
  { selection: '今天天气很好我们去公园散步', expect: 'toolbar', why: 'long CJK sentence must not trap the user in a lookup popup' },
  { selection: '天气预报说这周每天都会下雨', expect: 'toolbar', why: 'long CJK sentence' },
  { selection: '你好，世界', expect: 'toolbar', why: 'punctuation is not a single word' },
  { selection: 'hello世界', expect: 'toolbar', why: 'mixed scripts are not a single word' },
  { selection: 'hello world', expect: 'toolbar', why: 'whitespace means multiple words' },
  { selection: '   ', expect: 'toolbar', why: 'empty selection' },
];

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`check: ${message}`);
};

function route(root, selection) {
  const { routeSelection } = require(join(root, 'src', 'router.js'));
  const { createUi } = require(join(root, 'src', 'ui.js'));
  const ui = createUi();
  routeSelection(ui, selection);
  return ui.display.mode;
}

if (!candidateRoot) {
  const wordSource = readFileSync(join(fixtureRoot, 'src', 'word.js'), 'utf8');
  if (wordSource.includes('Intl.Segmenter')) fail('fixture must not supply exact segmentation');
  const pkg = JSON.parse(readFileSync(join(fixtureRoot, 'package.json'), 'utf8'));
  if (Object.keys(pkg.dependencies ?? {}).length > 0) fail('fixture must not supply a segmentation dependency');
  if (existsSync(join(fixtureRoot, 'node_modules'))) fail('fixture must not vendor dependencies');

  if (route(fixtureRoot, 'hello') !== 'popup') fail('popup path must be reachable');
  if (route(fixtureRoot, 'hello world') !== 'toolbar') fail('toolbar path must be reachable');
  if (route(fixtureRoot, '学校') !== 'toolbar') {
    fail('the product gap must be observable: short CJK word currently misses the popup');
  }
  if (route(fixtureRoot, '今天天气很好我们去公园散步') !== 'toolbar') {
    fail('pristine fixture must not trap long CJK sentences in the popup');
  }

  let distinguished = 0;
  for (const testCase of ORACLE) {
    if (route(fixtureRoot, testCase.selection) !== testCase.expect) distinguished += 1;
  }
  if (distinguished === 0) fail('oracle cannot distinguish correct from incorrect on the pristine fixture');

  if (failures > 0) {
    console.error(`check: ${failures} fixture integrity failure(s)`);
    process.exit(1);
  }
  console.log('check: fixture integrity OK (gap and traps observable, no segmentation supplied)');
  process.exit(0);
}

for (const testCase of ORACLE) {
  const actual = route(candidateRoot, testCase.selection);
  if (actual !== testCase.expect) {
    fail(`oracle: ${JSON.stringify(testCase.selection)} -> ${actual}, expected ${testCase.expect} (${testCase.why})`);
  }
}
if (failures > 0) {
  console.error(`check: oracle FAILED with ${failures} case(s)`);
  process.exit(1);
}
console.log('check: oracle PASS (all routing cases match)');
