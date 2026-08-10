# Final response

## 1. Summary

**Root cause:** `src/exporter.js` buffered output into a fixed 1024-byte `Buffer`. When a catalog exceeded it, `writeRow` silently discarded the overflow mid-row, yet `export()` returned `{ ok: true, exported: books.length }` — and the `catch` block returned `ok: true` too. The 300-book artifact was cut at 1024 bytes without a trailing newline, so `importer.js` threw `TruncatedArtifactError` while the CLI claimed `Exported 300 books` (exit 0).

**Why the 8 MiB patch is wrong:** it merely moves the cap. It keeps silent truncation and the dishonest `ok: true`, so any catalog over 8 MiB fails identically — I proved this by exporting a 300,000-book catalog (~13.9 MB, larger than the proposal) and watching it round-trip fine after the fix. It also violates CONTRIBUTING.md: "The exporter must not claim success (`ok: true`) unless every book made it into the artifact."

**Fix (`src/exporter.js`):** removed the fixed budget, buffer, and dead `flush`/`OUTPUT_BUDGET` entirely; each row is now written straight to the file descriptor with `fs.writeSync`, so completeness is guaranteed by construction with no size cap. Failures now return `{ ok: false, exported: <rows actually written>, error }`, which the unchanged `cli.js` reports as `Export failed: ...` with exit code 1.

**Behavior changes observed:** small (5 books) still round-trips; 300 books now produces a full 12,097-byte artifact and imports 300; a bad destination path now exits 1 with an error instead of claiming success; a 13.9 MB catalog imports fully — the previous 1024-byte (and proposed 8 MiB) cap would have truncated it.

## 2. Files changed

- `src/exporter.js` (only file)
