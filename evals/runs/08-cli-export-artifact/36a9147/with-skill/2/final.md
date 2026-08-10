# Final response

**Root cause (first incorrect transition, exporter-owned):** `src/exporter.js` buffered the entire artifact in a fixed 1024-byte buffer; `writeRow` silently discarded any bytes beyond it, and `export()` returned `ok: true` unconditionally (including in the catch branch). The importer behaved correctly and intentionally — its trailing-newline check is the consumer contract detecting the truncation (importer.js:10). That's why 5 books worked (fits in 1024 B) and 300 books "exported" but produced a 1024-byte artifact with 27 rows and a mid-row cut.

**Proposed 8 MiB patch — rejected as symptom masking.** I reproduced it failing at the next boundary: a 240,000-book catalog (14.9 MB, ≈1.8× the proposed budget) still truncates under the proposal, and it also leaves the catch-branch false-success untouched. It contradicts CONTRIBUTING.md's contract: "must not claim success unless every book made it into the artifact" (no size carve-out exists).

**Fix (smallest owned boundary):** in `src/exporter.js` only —
- `writeRow` now grows the buffer (doubling) instead of silently dropping rows; no fixed cap, artifact always complete.
- The catch branch now returns `ok: false` with the error instead of claiming `ok: true`, so fs failures surface as `Export failed: …` / exit 1 (the CLI already knew how to render this; the branch was just never reachable).

**Validation (real consumer oracle, export → import):**
- 5 books: `Exported 5` → `Imported 5` (unchanged).
- 300 books: `Exported 300` → `Imported 300`; artifact 12,097 bytes (was 1024).
- 240,000 books: 14.9 MB artifact round-trips fully — `bytesWritten === file size`, trailing newline present.
- Unwritable dest: `Export failed: ENOENT …`, exit 1 (intended behavior change per contract).
- Importer untouched: still rejects `samples/truncated.csv` (exit 1).
- Reachable scope confirmed by grep: `writeRow`/`OUTPUT_BUDGET` consumed only by `export()`; dead `flush()` left untouched.

Unverified (per fixture): no test suite/linter/CI exists; CSV row-escaping quirks (commas in titles) are pre-existing format behavior, out of scope.

## 2. Files changed

- `src/exporter.js` (only file; importer, CLI, samples, docs untouched)
