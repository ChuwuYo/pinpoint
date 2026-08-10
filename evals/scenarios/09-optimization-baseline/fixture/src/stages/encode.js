'use strict';

// Serializes an image to a textual pixel dump. Written as a per-pixel
// string append loop, which looks quadratic but is linear under V8 ropes.
function serializeImage(image) {
  let out = '';
  out += `${image.width}x${image.height}\n`;
  for (const [r, g, b] of image.pixels) {
    out += `${r} ${g} ${b}\n`;
  }
  return out;
}

module.exports = { serializeImage };
