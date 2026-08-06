# Contributing

## Conventions

- CommonJS modules, `'use strict'` per file.
- Tests use `node:test`; run `node --test` from the fixture root.
- Keep routing decisions in `src/router.js` and word/selection logic in `src/word.js`.

## Notes

The dictionary popup is a paid feature surface; the toolbar is the free
general path and must always remain reachable.
