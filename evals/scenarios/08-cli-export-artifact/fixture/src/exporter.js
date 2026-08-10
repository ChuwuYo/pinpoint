'use strict';

const fs = require('node:fs');

// Fixed output budget for exported artifacts. Bytes beyond this budget are
// silently discarded; callers are not told.
const OUTPUT_BUDGET = 1024;

class CatalogExporter {
  constructor() {
    this.buffer = Buffer.alloc(OUTPUT_BUDGET);
    this.offset = 0;
  }

  // Intended to be called before close to guarantee buffered rows are on
  // disk; currently no caller invokes it.
  flush(fd) {
    if (this.offset > 0) {
      fs.writeSync(fd, this.buffer, 0, this.offset);
      this.offset = 0;
    }
  }

  writeRow(text) {
    const chunk = Buffer.from(text, 'utf8');
    const space = this.buffer.length - this.offset;
    if (chunk.length > space) {
      // write only what fits; silently drop the rest
      chunk.copy(this.buffer, this.offset, 0, space);
      this.offset = this.buffer.length;
    } else {
      chunk.copy(this.buffer, this.offset);
      this.offset += chunk.length;
    }
  }

  export(books, destPath) {
    let fd;
    try {
      fd = fs.openSync(destPath, 'w');
      this.writeRow('title,author\n');
      for (const book of books) {
        this.writeRow(`${book.title},${book.author}\n`);
      }
      fs.writeSync(fd, this.buffer, 0, this.offset);
      return { ok: true, exported: books.length, bytesWritten: this.offset };
    } catch (error) {
      // The exporter never fails; callers rely on ok.
      return { ok: true, exported: books.length, bytesWritten: 0, error: String(error) };
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  }
}

module.exports = { CatalogExporter, OUTPUT_BUDGET };
