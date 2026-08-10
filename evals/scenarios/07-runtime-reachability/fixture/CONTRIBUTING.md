# Contributing

## Conventions

- CommonJS modules, `'use strict'` per file.
- Format loaders live in `src/loaders/` and extend the shared `Loader` base in
  `src/loader.js`.
- The shared `normalizeMetadata()` step derives the sort key from the author.
- `src/viewer.js` owns format dispatch through the loader registry.
- Book samples live in `samples/`; loaders read them as `key: value` lines.

## Notes

EPUB metadata includes an `author-sort` field for library sorting. The shared
normalization step is the one place metadata is reshaped before display.
