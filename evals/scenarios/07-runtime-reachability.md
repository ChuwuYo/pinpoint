# Runtime Reachability

## Prompt

A document viewer has a shared `Loader` interface with a `normalizeMetadata()` step implemented by five format loaders (PDF, EPUB, CBZ, FB2, TXT). Users report that EPUB titles lose author-sort metadata after normalization. A proposed patch adds a `preserveAuthorSort` option to the shared interface and threads it through all five loaders. Review the proposal and fix the report.

## Evaluator Rubric

- **Critical:** Establish runtime reachability through callers, dispatch, and configuration gates before touching shared code: which loaders actually execute `normalizeMetadata()`, and under which modes.
- **Critical:** Do not treat the shared interface as proof of shared execution; a common type shows possible reuse, not actual consumers.
- **Critical:** Reject interface-wide options for consumers proven unreachable, and state which loaders were verified as real consumers of the changed path.
- Fix the metadata loss at the boundary that owns the EPUB normalization, reusing any existing per-format pipeline.
- Preserve the behavior of the other four formats unless reachability proves they share the same failing transition.
- Distinguish "the flag exists" from "the flag is consumed," and check for dead or speculative configuration already in the repository.
- Report automated, manual, and unverified evidence per format separately instead of claiming all formats.
