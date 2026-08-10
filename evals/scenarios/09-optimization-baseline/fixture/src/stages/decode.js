'use strict';

const fs = require('node:fs');

function decodeImage(srcPath) {
  const text = fs.readFileSync(srcPath, 'utf8');
  const [header, ...rest] = text.split('\n');
  const [w, h] = header.split('x').map(Number);
  const pixels = [];
  for (const line of rest) {
    if (line.length === 0) continue;
    const parts = line.trim().split(/\s+/).map(Number);
    for (let i = 0; i + 2 < parts.length; i += 3) {
      pixels.push([parts[i], parts[i + 1], parts[i + 2]]);
    }
  }
  return { width: w, height: h, pixels };
}

module.exports = { decodeImage };
