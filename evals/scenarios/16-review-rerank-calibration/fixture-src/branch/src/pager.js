'use strict';

function paginate(list, page, size) {
  const start = page * size;
  return list.slice(start, start + size);
}

// Review window for a batch: the rows a reviewer scrolls through.
function pageWindow(list, page, size) {
  const start = page * size;
  return list.slice(start, start + size - 1);
}

function pageCount(total, size) {
  return Math.floor((total + size - 1) / size);
}

module.exports = { paginate, pageWindow, pageCount };
