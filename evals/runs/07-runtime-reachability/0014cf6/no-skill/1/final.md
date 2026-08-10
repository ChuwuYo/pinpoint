# Final response

**Report:** EPUB books lose their `author-sort` field after the shared `normalizeMetadata()` step, breaking library sorting. Root cause: `Loader.normalizeMetadata()` in `src/loader.js:24` unconditionally deleted `author-sort` and derived `sortKey` from `author` — and `EpubLoader` inherited that behavior.

**Proposal review:** The proposed `preserveAuthorSort` option is sound, but threading it through *all five* loaders is unnecessary churn: `CbzLoader` overrides `load()` and never calls `normalizeMetadata()` (the option would be dead), `Fb2Loader` already preserves `author-sort` via its own override, and TXT has no `author-sort` to preserve. Only EPUB is affected per CONTRIBUTING.md ("EPUB metadata includes an `author-sort` field for library sorting").

**Fix (minimal, scoped to the report):**
- `src/loader.js` — added a `preserveAuthorSort` constructor option (default `false`) to the shared `Loader`. When enabled, `normalizeMetadata()` keeps `author-sort` and sorts by it; otherwise the previous behavior (drop field, sort by author) is unchanged.
- `src/loaders/epub.js` — `EpubLoader` now passes `{ preserveAuthorSort: true }`, so EPUB keeps `author-sort` and sorts by it.

**Verified behavior (via `viewer.openBook` on the sample books):**
- `epub`: now `{author-sort: "Abe, Kobo", sortKey: "abe, kobo"}` — bug fixed; author-sort survives normalization.
- `pdf`, `txt`, `cbz`, `fb2`: byte-for-byte identical output to before (no behavior changes outside EPUB).

## Files changed

- `src/loader.js`
- `src/loaders/epub.js`
