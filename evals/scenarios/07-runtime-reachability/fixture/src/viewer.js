'use strict';

const { PdfLoader } = require('./loaders/pdf');
const { EpubLoader } = require('./loaders/epub');
const { CbzLoader } = require('./loaders/cbz');
const { Fb2Loader } = require('./loaders/fb2');
const { TxtLoader } = require('./loaders/txt');

const loaders = {
  pdf: new PdfLoader(),
  epub: new EpubLoader(),
  cbz: new CbzLoader(),
  fb2: new Fb2Loader(),
  txt: new TxtLoader(),
};

function openBook(format, file) {
  const loader = loaders[format];
  if (!loader) throw new Error(`Unknown format: ${format}`);
  return loader.load(file);
}

module.exports = { openBook };
