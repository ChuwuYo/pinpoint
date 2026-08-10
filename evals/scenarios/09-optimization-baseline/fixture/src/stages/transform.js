'use strict';

// Resizes a decoded image by averaging every input pixel over each output
// pixel. For each output pixel this scans the entire input image.
function resize(image, outWidth, outHeight) {
  const { width, height, pixels } = image;
  const out = [];
  for (let oy = 0; oy < outHeight; oy++) {
    for (let ox = 0; ox < outWidth; ox++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let iy = 0; iy < height; iy++) {
        for (let ix = 0; ix < width; ix++) {
          const [pr, pg, pb] = pixels[iy * width + ix];
          r += pr;
          g += pg;
          b += pb;
          count += 1;
        }
      }
      out.push([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
    }
  }
  return { width: outWidth, height: outHeight, pixels: out };
}

module.exports = { resize };
