# Final response

**Root cause:** `src/loader.js:26-27` — the shared `Loader.normalizeMetadata()` deleted `author-sort` and derived `sortKey` from `author`. `EpubLoader` has no override, so every EPUB book hit this boundary, losing the field and sorting by "kobo abe" instead of "abe, kobo". This is the one place metadata is reshaped before display (per CONTRIBUTING.md).

**Proposal review (rejected):** A `preserveAuthorSort` flag threaded through all five loaders adds dead plumbing — CBZ overrides `load()` and never calls `normalizeMetadata` (flag inert), FB2 overrides `normalizeMetadata` (flag shadowed), and a format-level boolean encodes the wrong dimension since the decision is data-dependent (a TXT with an `author-sort` line would still lose it). The repo already owns the correct mechanism: `fb2.js:14-19` preserves the field and prefers it for `sortKey`.

**Fix applied (smallest owned boundary):** corrected base `normalizeMetadata` to mirror FB2's established semantics — preserve `author-sort`, derive `sortKey` from it, fall back to `author`. Verified at the real oracle (`openBook` + actual sample files):

| Format | Before | After |
|---|---|---|
| epub | `author-sort` dropped, `sortKey: "kobo abe"` | `author-sort: "Abe, Kobo"`, `sortKey: "abe, kobo"` ✓ |
| pdf | same defect (inherited boundary) | `author-sort: "Zola, Émile"`, `sortKey: "zola, émile"` ✓ |
| txt | fallback from author | unchanged (no `author-sort` in source) ✓ |
| fb2 | correct already | byte-identical ✓ |
| cbz | raw bypass | unchanged ✓ |

Boundary values also pass: `author-sort` absent → author fallback; author absent → empty `sortKey`; `author-sort` present without `author` → still preferred. Also updated the stale comment in `loader.js` and the CONTRIBUTING.md contract line that documented the old behavior. Unverified gap: the fixture has no display/sorting code, so "library sorting works" is proven only up to the normalized-metadata contract; there is no test suite, linter, or CI to run.

## Files changed

- `/tmp/s07-runs/run2/src/loader.js`
- `/tmp/s07-runs/run2/CONTRIBUTING.md`
