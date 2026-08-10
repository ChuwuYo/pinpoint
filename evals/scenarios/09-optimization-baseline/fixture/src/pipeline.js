'use strict';

const { decodeImage } = require('./stages/decode');
const { resize } = require('./stages/transform');
const { serializeImage } = require('./stages/encode');

function processImage(srcPath, outWidth, outHeight) {
  const decoded = decodeImage(srcPath);
  const resized = resize(decoded, outWidth, outHeight);
  return serializeImage(resized);
}

module.exports = { processImage };
