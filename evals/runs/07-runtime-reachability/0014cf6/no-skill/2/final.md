# Final response

**Root cause:** `Loader.normalizeMetadata()` (`src/loader.js:24`) unconditionally deleted `author-sort` and derived `sortKey` from `author`. `EpubLoader` inherits that method, so EPUB's `Abe, Kobo` became `sortKey: "kobo abe"` — the reported sorting break. (Confirmed by running the viewer before the fix.)

**Proposal review:** The `preserveAuthorSort` option on the shared `Loader` base is the right layer — CONTRIBUTING.md states the shared normalization is the single reshaping point. I made one refinement: preserving the field alone wouldn't restore sorting, since `sortKey` was still derived from the author, so when the option is set the base now prefers `author-sort` as the `sortKey` source (mirroring the already-correct `Fb2Loader` semantics).

**Changes:**
- `src/loader.js` — `Loader` now accepts `{ preserveAuthorSort }`; when true it keeps `author-sort` and derives `sortKey` from it (falling back to `author`), otherwise behavior is unchanged.
- `src/loaders/epub.js` — opts in with `super({ preserveAuthorSort: true })`.
- `src/loaders/fb2.js` — replaced its bespoke `normalizeMetadata` override + dead `useLegacyNormalize` flag (grep confirms no caller sets it) with the same option; output is identical.
- `src/loaders/cbz.js` — comment only; CBZ overrides `load()` entirely and never normalizes, so the option is intentionally inert there rather than threaded as dead code.
- `src/loaders/pdf.js` / `src/loaders/txt.js` — untouched; those formats carry no `author-sort`, and the default (`false`) preserves prior behavior exactly.
- `CONTRIBUTING.md` — documented the option so future loaders follow the convention.

**Behavior changes:** EPUB gains `author-sort` + corrected `sortKey` (the fix). FB2's previously dead `useLegacyNormalize` path was removed with no observable effect. PDF, CBZ, TXT outputs unchanged.

## Files changed

- `CONTRIBUTING.md`
- `src/loader.js`
- `src/loaders/epub.js`
- `src/loaders/fb2.js`
- `src/loaders/cbz.js`
