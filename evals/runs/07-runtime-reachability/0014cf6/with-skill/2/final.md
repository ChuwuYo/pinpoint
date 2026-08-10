# Final response

**Root cause:** the shared `Loader.normalizeMetadata()` (`src/loader.js`) deleted the source `author-sort` field and derived `sortKey` from `author` only. EPUB (and PDF) inherit this base, so EPUB lost `author-sort` and got `sortKey: "kobo abe"` instead of `"abe, kobo"` — the reported failure.

**Proposal review:** rejected the proposed `preserveAuthorSort` flag. It leaves the buggy delete as the default, forks sort-key semantics, and threads through CBZ which never calls `normalizeMetadata` at runtime. The owning boundary fix reuses the pattern FB2 already established.

**Fix applied:** the base `normalizeMetadata()` no longer deletes `author-sort` and prefers it for `sortKey`, falling back to `author`. Result: EPUB keeps `author-sort` with correct sort key; PDF gets the same (previously latent) fix; FB2, TXT fallback, and CBZ unchanged.

**Reachability traced through `viewer.js:9-15` dispatch — all five formats exercised on real samples:**
- epub: `author-sort: "Abe, Kobo"`, `sortKey: "abe, kobo"` ✓ (the report)
- pdf: `author-sort: "Zola, Émile"`, `sortKey: "zola, émile"` — intended change, reported explicitly
- txt: no `author-sort` in source, fallback from author, byte-identical ✓
- fb2: already correct, byte-identical ✓
- cbz: never reaches `normalizeMetadata` (load() override), byte-identical ✓
- no-`author-sort` inputs and boundary fallbacks validated; no other consumers in-repo

Also updated the stale loader.js header comment and CONTRIBUTING.md line 8 that documented the removed buggy behavior. Unverified: external library sorting (outside fixture); no test/lint/CI suite exists.

## Files changed

- `src/loader.js` — `normalizeMetadata()` no longer deletes `author-sort`; `sortKey` prefers it, falls back to author; header comment updated.
- `CONTRIBUTING.md` — convention line updated to describe the corrected sort-key derivation.
