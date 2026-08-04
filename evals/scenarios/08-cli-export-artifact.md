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
