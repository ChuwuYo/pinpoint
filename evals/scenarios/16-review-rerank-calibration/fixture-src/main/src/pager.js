'use strict';

function paginate(list, page, size) {
  const start = page * size;
  return list.slice(start, start + size);
}

module.exports = { paginate };
