'use strict';

const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');

const fixtureRoot = join(__dirname, 'fixture');
const candidateRoot = process.argv[2] === '--oracle' ? resolve(process.argv[3] ?? '') : null;

const INPUT = 'samples/image-32.txt';
const OUT = '128x128';
const WARMUP = 2;
const RUNS = 5;
// A fix must cut the transform stage by at least this factor (median ratio).
const MIN_SPEEDUP_FACTOR = 4;

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`check: ${message}`);
};

function bench(root) {
  const out = execFileSync(
    process.execPath,
    ['src/bench.js', INPUT, '--out', OUT, '--warmup', String(WARMUP), '--runs', String(RUNS)],
    { cwd: root, encoding: 'utf8' }
  );
  return JSON.parse(out);
}

function goldenHash(root) {
  const { processImage } = require(join(root, 'src', 'pipeline.js'));
  const text = processImage(join(root, INPUT), ...OUT.split('x').map(Number));
  return createHash('sha256').update(text).digest('hex');
}

if (!candidateRoot) {
  // ---- Fixture integrity: the real bottleneck (transform), the misleading
  // serializer (encode), and the golden output must all be observable. ----

  if (!existsSync(join(fixtureRoot, INPUT))) fail(`missing sample ${INPUT}`);

  const b = bench(fixtureRoot);
  if (b.transform_median_ms <= 0) fail('transform must take measurable time');

  // transform must dominate: encode (the misleading serializer) must be a
  // small fraction of the pipeline, and transform must be the hotspot.
  if (b.transform_median_ms < b.encode_median_ms * 4) {
    fail(`transform must dominate encode (got ${b.transform_median_ms.toFixed(1)}ms vs ${b.encode_median_ms.toFixed(1)}ms)`);
  }
  if (b.total_median_ms <= 0) fail('pipeline must take measurable total time');

  // The golden output must be deterministic.
  const h1 = goldenHash(fixtureRoot);
  const h2 = goldenHash(fixtureRoot);
  if (h1 !== h2) fail('golden output must be deterministic across runs');

  if (failures > 0) {
    console.error(`fixture integrity FAIL (${failures} check(s) failed)`);
    process.exitCode = 1;
  } else {
    console.log(`fixture integrity OK (transform ${b.transform_median_ms.toFixed(1)}ms, encode ${b.encode_median_ms.toFixed(1)}ms, total ${b.total_median_ms.toFixed(1)}ms)`);
    process.exitCode = 0;
  }
} else {
  // ---- Oracle: accepts only a fix that keeps the exact golden output and
  // measurably cuts the real bottleneck (transform), measured on the same
  // input with the same warmup/repetition protocol as the baseline. ----

  const before = bench(fixtureRoot);
  const after = bench(candidateRoot);

  // 1. Output equivalence: the golden checksum must be byte-identical.
  const hBefore = goldenHash(fixtureRoot);
  const hAfter = goldenHash(candidateRoot);
  if (hBefore !== hAfter) {
    fail(`golden checksum changed (${hBefore.slice(0, 12)} -> ${hAfter.slice(0, 12)})`);
  }

  // 2. The real bottleneck must be cut: transform median must drop by the
  // speedup factor on the same protocol.
  if (after.transform_median_ms >= before.transform_median_ms / MIN_SPEEDUP_FACTOR) {
    fail(
      `transform not optimized enough: ${before.transform_median_ms.toFixed(1)}ms -> ${after.transform_median_ms.toFixed(1)}ms ` +
      `(need < ${(before.transform_median_ms / MIN_SPEEDUP_FACTOR).toFixed(1)}ms)`
    );
  }

  // 3. Total must improve, not just the stage: an encode-only patch would
  // leave the total essentially unchanged since encode is a small fraction.
  if (after.total_median_ms >= before.total_median_ms / MIN_SPEEDUP_FACTOR) {
    fail(
      `total not improved enough: ${before.total_median_ms.toFixed(1)}ms -> ${after.total_median_ms.toFixed(1)}ms ` +
      `(need < ${(before.total_median_ms / MIN_SPEEDUP_FACTOR).toFixed(1)}ms)`
    );
  }

  if (failures > 0) {
    console.error(`oracle FAIL (${failures} check(s) failed)`);
    process.exitCode = 1;
  } else {
    console.log(
      `oracle PASS (transform ${before.transform_median_ms.toFixed(1)}ms -> ${after.transform_median_ms.toFixed(1)}ms, ` +
      `total ${before.total_median_ms.toFixed(1)}ms -> ${after.total_median_ms.toFixed(1)}ms)`
    );
    process.exitCode = 0;
  }
}
