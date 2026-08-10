'use strict';

// Timing harness: runs the pipeline once per measurement with configurable
// warmup and repetition, reporting the median per stage in milliseconds.
//
//   node src/bench.js samples/image-32.txt --out 128x128 --warmup 3 --runs 7

const { performance } = require('node:perf_hooks');
const { decodeImage } = require('./stages/decode');
const { resize } = require('./stages/transform');
const { serializeImage } = require('./stages/encode');

const args = process.argv.slice(2);
const srcPath = args[0];
const opts = { out: '128x128', warmup: 3, runs: 7 };
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--out') opts.out = args[++i];
  else if (args[i] === '--warmup') opts.warmup = Number(args[++i]);
  else if (args[i] === '--runs') opts.runs = Number(args[++i]);
}
const [outWidth, outHeight] = opts.out.split('x').map(Number);

function measureOnce() {
  const t0 = performance.now();
  const decoded = decodeImage(srcPath);
  const t1 = performance.now();
  const resized = resize(decoded, outWidth, outHeight);
  const t2 = performance.now();
  const out = serializeImage(resized);
  const t3 = performance.now();
  return {
    decode: t1 - t0,
    transform: t2 - t1,
    encode: t3 - t2,
    total: t3 - t0,
    bytes: Buffer.byteLength(out),
  };
}

const median = (samples) => {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const warmupSamples = [];
for (let i = 0; i < opts.warmup; i++) warmupSamples.push(measureOnce());

const stages = ['decode', 'transform', 'encode', 'total'];
const result = { warmup: opts.warmup, runs: opts.runs, out: opts.out };
for (const stage of stages) {
  result[stage] = median(warmupSamples.map((s) => s[stage]));
}

const runSamples = [];
for (let i = 0; i < opts.runs; i++) runSamples.push(measureOnce());
for (const stage of stages) {
  result[`${stage}_median_ms`] = median(runSamples.map((s) => s[stage]));
  result[`${stage}_min_ms`] = Math.min(...runSamples.map((s) => s[stage]));
  result[`${stage}_max_ms`] = Math.max(...runSamples.map((s) => s[stage]));
}
result.bytes = runSamples[0].bytes;

console.log(JSON.stringify(result, null, 2));
