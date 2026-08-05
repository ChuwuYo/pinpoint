# CLI Export Artifact

## Prompt

A CLI tool exports project archives. Intermittently, the command exits 0 and prints `Export complete`, but the downstream importer rejects the produced archive as truncated — usually on slow disks or under heavy load. The current implementation writes the archive directly to the destination path and logs success after the final `write()` call returns. Review and fix the failure.

## Evaluator Rubric

- **Critical:** Validate at the real consumer boundary — the importer reading a complete file — not at the producer's exit code, log line, or the file's mere existence.
- **Critical:** Distinguish visible equivalence (exit 0, message printed, path present) from semantic equivalence (flushed, complete, consumable artifact).
- **Critical:** Trace the first transition from correct to incorrect: buffering, flush and close ordering, error propagation, atomicity of the destination file, and success reporting.
- Fix at the owning boundary — typically write-to-temp plus atomic rename, and success only after durability is established — rather than compensating in the importer or retrying blindly.
- Check for partial-file residue and re-entry behavior after interruption.
- Preserve exit-code contract, output format, and CLI flags unless the issue explicitly changes them.
- Report which failure modes were actually reproduced (slow disk, interruption, full disk) and which remain unverified.

## Fixture Requirements (evaluator only — never shown to the agent)

The run fixture must contain:

- A CLI with `export` and `import` commands for project archives.
- An exporter that writes directly to the destination path through buffered stream writes and reports success synchronously after the final `write()` returns — no `end`/`finish` await, no fsync, no temporary file, no rename, and no error handling.
- An importer that validates a complete archive (end marker, manifest, per-file sizes) and rejects truncated archives.
- A sample project small enough that the happy path passes by luck, so the run must construct a larger payload or an early-exit condition to observe the failure.
- No test suite, linter, or CI configuration.
