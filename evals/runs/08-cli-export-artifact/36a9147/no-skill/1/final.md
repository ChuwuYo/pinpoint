# Final response

**Root cause** — `src/exporter.js` had two design flaws, not one:
1. A fixed 1024-byte `Buffer` where `writeRow` silently dropped everything that didn't fit (`chunk.copy(..., 0, space)` and the rest is discarded).
2. `export()` unconditionally returned `{ ok: true }` in **both** the success and catch paths — so the CLI printed `Exported 300 books` and exited 0 even when only ~100 of 300 rows reached the file. The importer then correctly threw `TruncatedArtifactError` on the 1024-byte artifact (cut off mid-row, missing trailing newline). Reproduced exactly.

**Why the proposed 8 MiB patch is wrong** — it only moves the cliff: any catalog whose CSV exceeds 8 MiB (or any write failure) would still silently truncate while claiming success, violating CONTRIBUTING.md ("The exporter must not claim success unless every book made it into the artifact... A failed or truncated export must be reported, not silently swallowed"). I verified this class of failure with a 200k-book export that the 8 MiB budget would not have fit.

**Fix (in `src/exporter.js` only)** — removed the fixed budget and buffer entirely; `writeRow` now writes each row directly to the file descriptor, so the artifact is complete for any size. Added real `bytesWritten` accounting, and the catch path now returns `{ ok: false, error }`, which the existing `cli.js` already surfaces as `Export failed: ...` with exit code 1. Removed the unused buffer-dependent `flush()` and the now-unneeded `OUTPUT_BUDGET` export (nothing else referenced them).

**Behavior changes observed:**
- 300 books: before → 1024-byte CSV + false success + import crash; after → 12,097-byte CSV, `Exported 300 books`, `Imported 300 books`, exit 0.
- 5-book export: unchanged, still round-trips.
- 200,000-book (~11 MB) export/import: round-trips cleanly — proven size-independent.
- Write failure (e.g. EISDIR): now reports `Export failed: ...`, exit 1 (previously claimed success, exit 0).

## Files changed

- `/tmp/s08-runs/run1/src/exporter.js` (only file; `cli.js`, `importer.js`, and samples untouched)
